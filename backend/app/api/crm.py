"""
API Router pour la gestion du CRM
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..models.transactionnel import CommandeClientAgri, TicketCaisseAgri, TiersAgri
from ..schemas.crm import (
    ProspectCreate, ProspectUpdate, ProspectResponse,
    CommandeCreate, CommandeUpdate, CommandeResponse,
    FactureCreate, FactureUpdate, FactureResponse,
    SegmentClientCreate, SegmentClientUpdate, SegmentClientResponse,
    HistoriqueClientCreate, HistoriqueClientUpdate, HistoriqueClientResponse
)
from ..services import transactionnel as tx

router = APIRouter(prefix="/crm", tags=["crm"])


def _round_money(value: float) -> float:
    return round(float(value or 0), 2)


def _client_objective(client: TiersAgri) -> float:
    if client.volume_annuel and client.volume_annuel > 0:
        return float(client.volume_annuel)
    return {
        "circuit-court": 4200,
        "pro": 9000,
        "collectivite": 20000,
    }.get(client.segment or "circuit-court", 5000)


def _pipeline_status(progress: float, tickets_count: int) -> str:
    if progress >= 100:
        return "objectif_atteint"
    if progress < 45 or tickets_count == 0:
        return "a_relancer"
    return "en_cours"


def _next_action(client: TiersAgri, progress: float, basket: float) -> str:
    if progress >= 100:
        return "securiser le renouvellement et proposer une offre saisonniere"
    if client.segment == "collectivite":
        return "planifier contrat, volumes et prochaines commandes"
    if basket < 30 and client.segment == "circuit-court":
        return "proposer panier compose pour augmenter le panier moyen"
    if client.segment == "pro":
        return "caler une mercuriale et un objectif de volume hebdo"
    return "relancer avec offre adaptee au canal"


@router.get("/clients")
def get_clients_crm(
    segment: Optional[str] = None,
    recherche: Optional[str] = None,
    db: Session = Depends(get_db)
):
    tx.seed_demo(db)
    query = db.query(TiersAgri).filter(TiersAgri.type_tiers == "client", TiersAgri.actif.is_(True))
    if segment:
        query = query.filter(TiersAgri.segment == segment)
    if recherche:
        needle = f"%{recherche}%"
        query = query.filter(TiersAgri.nom.ilike(needle))
    clients = query.order_by(TiersAgri.segment, TiersAgri.nom).limit(200).all()
    return {
        "clients": [tx.tier_to_dict(client) for client in clients],
        "segments": tx.SEGMENTS,
    }


@router.get("/pilotage-commercial")
def get_pilotage_commercial(db: Session = Depends(get_db)):
    tx.seed_demo(db)
    clients = (
        db.query(TiersAgri)
        .filter(TiersAgri.type_tiers == "client", TiersAgri.actif.is_(True))
        .order_by(TiersAgri.segment, TiersAgri.nom)
        .all()
    )
    tickets = db.query(TicketCaisseAgri).all()
    commandes = db.query(CommandeClientAgri).all()
    tickets_by_client: dict[int, list[TicketCaisseAgri]] = {}
    orders_by_client: dict[int, list[CommandeClientAgri]] = {}
    for ticket in tickets:
        if ticket.client_id:
            tickets_by_client.setdefault(ticket.client_id, []).append(ticket)
    for order in commandes:
        if order.client_id:
            orders_by_client.setdefault(order.client_id, []).append(order)

    rows = []
    segment_totals: dict[str, dict[str, float]] = {}
    demo_ratio_by_segment = {"circuit-court": 0.58, "pro": 0.64, "collectivite": 0.42}
    for client in clients:
        client_tickets = tickets_by_client.get(client.id, [])
        client_orders = orders_by_client.get(client.id, [])
        objective = _client_objective(client)
        revenue = sum(ticket.total_ttc or 0 for ticket in client_tickets)
        if not client_tickets and objective:
            revenue = objective * demo_ratio_by_segment.get(client.segment or "circuit-court", 0.5)
        open_orders = sum(order.total_ttc or 0 for order in client_orders if order.statut not in {"convertie_caisse", "annulee"})
        tickets_count = len(client_tickets)
        basket = revenue / max(tickets_count, 1)
        if not client_tickets:
            basket = {
                "circuit-court": 28,
                "pro": 145,
                "collectivite": 430,
            }.get(client.segment or "circuit-court", 45)
        progress = (revenue / objective * 100) if objective else 0
        segment_total = segment_totals.setdefault(client.segment or "circuit-court", {"ca": 0, "objectif": 0, "clients": 0})
        segment_total["ca"] += revenue
        segment_total["objectif"] += objective
        segment_total["clients"] += 1
        rows.append({
            **tx.tier_to_dict(client),
            "objectif_annuel": _round_money(objective),
            "ca_realise": _round_money(revenue),
            "reste_a_faire": _round_money(max(objective - revenue, 0)),
            "progression_percent": round(progress, 1),
            "tickets": tickets_count,
            "commandes_ouvertes": len([order for order in client_orders if order.statut not in {"convertie_caisse", "annulee"}]),
            "montant_commandes_ouvertes": _round_money(open_orders),
            "panier_moyen": _round_money(basket),
            "statut_pipeline": _pipeline_status(progress, tickets_count),
            "prochaine_action": _next_action(client, progress, basket),
            "source_ca": "tickets" if client_tickets else "projection",
        })

    total_revenue = sum(row["ca_realise"] for row in rows)
    total_objective = sum(row["objectif_annuel"] for row in rows)
    total_tickets = sum(row["tickets"] for row in rows)
    return {
        "kpis": {
            "clients": len(rows),
            "ca_realise": _round_money(total_revenue),
            "objectif": _round_money(total_objective),
            "progression_percent": round((total_revenue / total_objective * 100) if total_objective else 0, 1),
            "panier_moyen": _round_money(total_revenue / max(total_tickets, 1)) if total_tickets else _round_money(sum(row["panier_moyen"] for row in rows) / max(len(rows), 1)),
            "commandes_ouvertes": sum(row["commandes_ouvertes"] for row in rows),
        },
        "clients": rows,
        "segments": [
            {
                "code": code,
                "ca": _round_money(values["ca"]),
                "objectif": _round_money(values["objectif"]),
                "clients": int(values["clients"]),
                "progression_percent": round((values["ca"] / values["objectif"] * 100) if values["objectif"] else 0, 1),
            }
            for code, values in segment_totals.items()
        ],
        "pipeline": {
            "a_relancer": [row for row in rows if row["statut_pipeline"] == "a_relancer"],
            "en_cours": [row for row in rows if row["statut_pipeline"] == "en_cours"],
            "objectif_atteint": [row for row in rows if row["statut_pipeline"] == "objectif_atteint"],
        },
    }


@router.post("/objectifs")
def update_objectif_client(payload: dict, db: Session = Depends(get_db)):
    tx.seed_demo(db)
    client_id = payload.get("client_id")
    objective = float(payload.get("objectif_annuel") or 0)
    client = db.query(TiersAgri).filter(TiersAgri.id == client_id, TiersAgri.type_tiers == "client").first()
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    client.volume_annuel = max(objective, 0)
    tx.audit(db, "crm", client.code, "objectif commercial", {"objectif_annuel": client.volume_annuel})
    db.commit()
    db.refresh(client)
    return {"statut": "objectif mis a jour", "client": tx.tier_to_dict(client)}


@router.post("/clients", status_code=status.HTTP_201_CREATED)
def create_client_crm(payload: dict, db: Session = Depends(get_db)):
    tx.seed_demo(db)
    nom = (payload.get("nom") or "").strip()
    if not nom:
        raise HTTPException(status_code=400, detail="Nom client obligatoire")
    segment = payload.get("segment") or "circuit-court"
    tier = tx.find_or_create_tier(db, nom, segment)
    tier.segment = segment
    tier.canal = payload.get("canal") or segment
    tier.email = payload.get("email")
    tier.telephone = payload.get("telephone")
    tier.delai_paiement = int(payload.get("delai_paiement") or 0)
    tier.remise_reference = float(payload.get("remise_reference") or 0)
    tier.volume_annuel = float(payload.get("volume_annuel") or 0)
    tx.audit(db, "crm", tier.code, "client crm", {"segment": tier.segment})
    db.commit()
    db.refresh(tier)
    return {"statut": "client enregistre", "client": tx.tier_to_dict(tier)}


@router.post("/prospects", response_model=ProspectResponse, status_code=status.HTTP_201_CREATED)
def create_prospect(prospect: ProspectCreate, db: Session = Depends(get_db)):
    db_prospect = models.Prospect(**prospect.model_dump())
    db.add(db_prospect)
    db.commit()
    db.refresh(db_prospect)
    return db_prospect


@router.get("/prospects", response_model=List[ProspectResponse])
def get_prospects(
    statut: Optional[str] = None,
    segment: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Prospect)
    if statut:
        query = query.filter(models.Prospect.statut == statut)
    if segment:
        query = query.filter(models.Prospect.segment == segment)
    return query.all()


@router.post("/commandes", response_model=CommandeResponse, status_code=status.HTTP_201_CREATED)
def create_commande(commande: CommandeCreate, db: Session = Depends(get_db)):
    db_commande = models.Commande(**commande.model_dump())
    db.add(db_commande)
    db.commit()
    db.refresh(db_commande)
    return db_commande


@router.get("/commandes", response_model=List[CommandeResponse])
def get_commandes(
    client_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Commande)
    if client_id:
        query = query.filter(models.Commande.client_id == client_id)
    if statut:
        query = query.filter(models.Commande.statut == statut)
    return query.all()


@router.post("/factures", response_model=FactureResponse, status_code=status.HTTP_201_CREATED)
def create_facture(facture: FactureCreate, db: Session = Depends(get_db)):
    db_facture = models.Facture(**facture.model_dump())
    db.add(db_facture)
    db.commit()
    db.refresh(db_facture)
    return db_facture


@router.get("/factures", response_model=List[FactureResponse])
def get_factures(
    client_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Facture)
    if client_id:
        query = query.filter(models.Facture.client_id == client_id)
    if statut:
        query = query.filter(models.Facture.statut == statut)
    return query.all()


@router.post("/segments", response_model=SegmentClientResponse, status_code=status.HTTP_201_CREATED)
def create_segment(segment: SegmentClientCreate, db: Session = Depends(get_db)):
    db_segment = models.SegmentClient(**segment.model_dump())
    db.add(db_segment)
    db.commit()
    db.refresh(db_segment)
    return db_segment


@router.get("/segments", response_model=List[SegmentClientResponse])
def get_segments(db: Session = Depends(get_db)):
    return db.query(models.SegmentClient).all()


@router.post("/historique", response_model=HistoriqueClientResponse, status_code=status.HTTP_201_CREATED)
def create_historique(historique: HistoriqueClientCreate, db: Session = Depends(get_db)):
    db_historique = models.HistoriqueClient(**historique.model_dump())
    db.add(db_historique)
    db.commit()
    db.refresh(db_historique)
    return db_historique


@router.get("/historique", response_model=List[HistoriqueClientResponse])
def get_historique(
    client_id: Optional[int] = None,
    prospect_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.HistoriqueClient)
    if client_id:
        query = query.filter(models.HistoriqueClient.client_id == client_id)
    if prospect_id:
        query = query.filter(models.HistoriqueClient.prospect_id == prospect_id)
    return query.all()
