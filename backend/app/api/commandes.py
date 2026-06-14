"""
Portail commandes clients et reservations de stock.
"""
from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.transactionnel import (
    CommandeClientAgri,
    LigneCommandeClientAgri,
    LigneTicketAgri,
    ProduitAgri,
    TicketCaisseAgri,
    TiersAgri,
)
from ..services import transactionnel as tx


router = APIRouter(prefix="/commandes", tags=["commandes-clients"])

ACTIVE_ORDER_STATUSES = {"reservee", "preparation", "confirmee"}
ACTIVE_LINE_STATUSES = {"reservee", "preparation"}


class LigneCommandeRequest(BaseModel):
    code: str
    quantite: float = Field(..., gt=0)


class CommandeClientRequest(BaseModel):
    client_id: Optional[int] = None
    client_nom: str = "Client comptoir"
    segment: str = "circuit-court"
    canal: str = "boutique ferme"
    mode_retrait: str = "retrait-ferme"
    date_retrait: Optional[date] = None
    commentaire: Optional[str] = None
    remise_percent: Optional[float] = Field(None, ge=0, le=100)
    lignes: List[LigneCommandeRequest]


class ConversionCommandeRequest(BaseModel):
    moyen_paiement: str = "card"


def _reserved_by_product(db: Session) -> Dict[str, float]:
    orders = db.query(CommandeClientAgri).filter(CommandeClientAgri.statut.in_(ACTIVE_ORDER_STATUSES)).all()
    reserved: Dict[str, float] = {}
    for order in orders:
        for line in order.lignes:
            if line.statut in ACTIVE_LINE_STATUSES:
                reserved[line.produit_code] = reserved.get(line.produit_code, 0.0) + (line.quantite_reservee or 0)
    return reserved


def _product_portal_dict(product: ProduitAgri, reserved: float = 0.0) -> Dict[str, Any]:
    data = tx.product_to_dict(product)
    physical_stock = product.stock or 0
    available = max(physical_stock - reserved, 0)
    data.update({
        "stock_physique": round(physical_stock, 3),
        "stock_reserve": round(reserved, 3),
        "stock_disponible": round(available, 3),
        "lot_courant": product.lot_courant,
        "canaux": ["boutique ferme", "commande en ligne", "restaurant", "collectivite"],
        "statut_commande": "reservable" if available > 0 else "rupture",
    })
    return data


def _order_dict(order: CommandeClientAgri) -> Dict[str, Any]:
    return {
        "reference": order.reference,
        "client_id": order.client_id,
        "client": order.client_nom,
        "segment": order.segment,
        "canal": order.canal,
        "source": order.source,
        "mode_retrait": order.mode_retrait,
        "date_retrait": order.date_retrait.isoformat() if order.date_retrait else None,
        "commentaire": order.commentaire,
        "statut": order.statut,
        "remise_percent": order.remise_percent,
        "total_ht": round(order.total_ht or 0, 2),
        "total_tva": round(order.total_tva or 0, 2),
        "total_ttc": round(order.total_ttc or 0, 2),
        "montant_reserve": round(order.montant_reserve or 0, 2),
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "lignes": [
            {
                "produit": line.produit_code,
                "libelle": line.libelle,
                "lot": line.lot,
                "quantite": line.quantite,
                "quantite_reservee": line.quantite_reservee,
                "unite": line.unite,
                "prix_unitaire": line.prix_unitaire,
                "tva": line.tva,
                "total_ttc": round(line.total_ttc or 0, 2),
                "stock_disponible_avant": line.stock_disponible_avant,
                "statut": line.statut,
            }
            for line in order.lignes
        ],
    }


def _segment_discount(client: TiersAgri) -> float:
    if client.remise_reference is not None:
        return float(client.remise_reference or 0)
    return {"circuit-court": 0.0, "pro": 8.0, "collectivite": 12.0}.get(client.segment or "circuit-court", 0.0)


def _get_client(db: Session, request: CommandeClientRequest) -> TiersAgri:
    if request.client_id:
        client = db.query(TiersAgri).filter(TiersAgri.id == request.client_id, TiersAgri.type_tiers == "client").first()
        if not client:
            raise HTTPException(status_code=404, detail="Client introuvable")
        return client
    client = tx.find_or_create_tier(db, request.client_nom, request.segment)
    client.canal = client.canal or request.canal
    return client


@router.get("/portail")
def get_portail_commandes(db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    reserved = _reserved_by_product(db)
    products = db.query(ProduitAgri).filter(ProduitAgri.actif.is_(True)).order_by(ProduitAgri.famille, ProduitAgri.nom).all()
    clients = db.query(TiersAgri).filter(TiersAgri.type_tiers == "client", TiersAgri.actif.is_(True)).order_by(TiersAgri.nom).all()
    orders = db.query(CommandeClientAgri).order_by(CommandeClientAgri.created_at.desc()).limit(30).all()
    active_orders = [order for order in orders if order.statut in ACTIVE_ORDER_STATUSES]
    reserved_amount = sum(order.montant_reserve or 0 for order in active_orders)
    low_stock = [
        product for product in products
        if product.seuil_alerte and _product_portal_dict(product, reserved.get(product.code, 0.0))["stock_disponible"] <= product.seuil_alerte
    ]

    return {
        "kpis": [
            {"label": "Commandes actives", "value": len(active_orders), "detail": "reservees ou en preparation"},
            {"label": "Montant reserve", "value": round(reserved_amount, 2), "detail": "stock engage"},
            {"label": "Produits reservables", "value": len([p for p in products if (p.stock or 0) - reserved.get(p.code, 0) > 0]), "detail": "stock disponible"},
            {"label": "Alertes dispo", "value": len(low_stock), "detail": "sous seuil apres reservations"},
        ],
        "catalogue": [_product_portal_dict(product, reserved.get(product.code, 0.0)) for product in products],
        "clients": [tx.tier_to_dict(client) for client in clients],
        "segments": tx.SEGMENTS,
        "modes_retrait": [
            {"code": "retrait-ferme", "label": "Retrait ferme"},
            {"code": "marche", "label": "Marche"},
            {"code": "livraison-locale", "label": "Livraison locale"},
            {"code": "tournee-pro", "label": "Tournee pro"},
        ],
        "commandes": [_order_dict(order) for order in orders],
        "workflow": [
            "selection client",
            "reservation stock",
            "preparation lot",
            "conversion caisse ou facture",
            "sortie stock",
        ],
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def creer_commande_client(request: CommandeClientRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    if not request.lignes:
        raise HTTPException(status_code=400, detail="La commande doit contenir au moins une ligne")

    tx.seed_demo(db)
    client = _get_client(db, request)
    reserved = _reserved_by_product(db)
    discount = request.remise_percent if request.remise_percent is not None else _segment_discount(client)
    order_ref = tx.reference("CMD")

    order = CommandeClientAgri(
        reference=order_ref,
        client=client,
        client_nom=client.nom,
        segment=client.segment or request.segment,
        canal=client.canal or request.canal,
        mode_retrait=request.mode_retrait,
        date_retrait=request.date_retrait,
        commentaire=request.commentaire,
        remise_percent=discount,
        statut="reservee",
        source="portail",
    )
    db.add(order)
    db.flush()

    total_ttc = 0.0
    total_tva = 0.0
    for requested_line in request.lignes:
        product = db.query(ProduitAgri).filter(ProduitAgri.code == requested_line.code, ProduitAgri.actif.is_(True)).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produit introuvable: {requested_line.code}")
        already_reserved = reserved.get(product.code, 0.0)
        available = max((product.stock or 0) - already_reserved, 0)
        if requested_line.quantite > available:
            raise HTTPException(
                status_code=409,
                detail=f"Stock insuffisant pour {product.nom}: {available} {product.unite} disponible",
            )

        line_total = product.prix_vente * requested_line.quantite * (1 - discount / 100)
        line_tax = (line_total * product.tva) / (100 + product.tva) if product.tva else 0
        total_ttc += line_total
        total_tva += line_tax
        db.add(
            LigneCommandeClientAgri(
                commande=order,
                produit=product,
                produit_code=product.code,
                libelle=product.nom,
                lot=product.lot_courant,
                quantite=requested_line.quantite,
                quantite_reservee=requested_line.quantite,
                unite=product.unite,
                prix_unitaire=product.prix_vente,
                tva=product.tva,
                total_ttc=round(line_total, 2),
                stock_disponible_avant=round(available, 3),
                statut="reservee",
            )
        )
        reserved[product.code] = already_reserved + requested_line.quantite

    order.total_ttc = round(total_ttc, 2)
    order.total_tva = round(total_tva, 2)
    order.total_ht = round(total_ttc - total_tva, 2)
    order.montant_reserve = round(total_ttc, 2)
    tx.audit(db, "commandes", order.reference, "commande reservee", {"client_id": client.id, "total": order.total_ttc})
    db.commit()
    db.refresh(order)
    return {"statut": "commande reservee", "commande": _order_dict(order)}


@router.get("/{reference}")
def get_commande(reference: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    order = db.query(CommandeClientAgri).filter(CommandeClientAgri.reference == reference).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return {"commande": _order_dict(order)}


@router.post("/{reference}/annuler")
def annuler_commande(reference: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    order = db.query(CommandeClientAgri).filter(CommandeClientAgri.reference == reference).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    if order.statut == "convertie_caisse":
        raise HTTPException(status_code=409, detail="Commande deja convertie en ticket")
    order.statut = "annulee"
    for line in order.lignes:
        line.statut = "annulee"
        line.quantite_reservee = 0
    tx.audit(db, "commandes", order.reference, "commande annulee", {"client_id": order.client_id})
    db.commit()
    db.refresh(order)
    return {"statut": "commande annulee", "commande": _order_dict(order)}


@router.post("/{reference}/convertir-ticket")
def convertir_commande_en_ticket(
    reference: str,
    request: ConversionCommandeRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    order = db.query(CommandeClientAgri).filter(CommandeClientAgri.reference == reference).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    if order.statut == "convertie_caisse":
        raise HTTPException(status_code=409, detail="Commande deja convertie")
    if order.statut == "annulee":
        raise HTTPException(status_code=409, detail="Commande annulee")

    ticket_ref = tx.reference("CAI")
    ticket = TicketCaisseAgri(
        reference=ticket_ref,
        client_id=order.client_id,
        client_nom=order.client_nom,
        segment=order.segment,
        moyen_paiement=request.moyen_paiement,
        remise_percent=order.remise_percent,
        total_ht=order.total_ht,
        total_tva=order.total_tva,
        total_ttc=order.total_ttc,
        statut="valide",
    )
    db.add(ticket)
    db.flush()

    cost_total = 0.0
    movements = []
    for order_line in order.lignes:
        if order_line.statut not in ACTIVE_LINE_STATUSES:
            continue
        product = db.query(ProduitAgri).filter(ProduitAgri.code == order_line.produit_code).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produit introuvable: {order_line.produit_code}")
        cost_line = (product.cout_revient or 0) * order_line.quantite
        cost_total += cost_line
        db.add(
            LigneTicketAgri(
                ticket=ticket,
                produit=product,
                produit_code=product.code,
                libelle=product.nom,
                lot=order_line.lot,
                quantite=order_line.quantite,
                unite=product.unite,
                prix_unitaire=order_line.prix_unitaire,
                tva=order_line.tva,
                total_ttc=order_line.total_ttc,
                marge=round(order_line.total_ttc - cost_line, 2),
                source="commande",
            )
        )
        movement = tx.create_stock_movement(db, product, "vente", order_line.quantite, order_line.lot, "commande client", "Portail commandes", ticket_ref)
        movements.append(tx.movement_to_dict(movement))
        order_line.statut = "sortie"
        order_line.quantite_reservee = 0

    ticket.cout_revient = round(cost_total, 2)
    ticket.marge = round((order.total_ttc or 0) - cost_total, 2)
    payment_account = {"card": "5112", "cash": "531", "transfer": "5111"}.get(request.moyen_paiement, "5112")
    entries = [
        tx.create_entry(db, "VENTE", "707", f"Commande {order.reference}", 0, (order.total_ttc or 0) - (order.total_tva or 0), "ticket", ticket_ref),
        tx.create_entry(db, "TVA", "4457", f"TVA commande {order.reference}", 0, order.total_tva or 0, "ticket", ticket_ref),
        tx.create_entry(db, "CAISSE", payment_account, f"Paiement commande {order.reference}", order.total_ttc or 0, 0, "ticket", ticket_ref),
        tx.create_entry(db, "STOCK", "603", f"Sortie stock commande {order.reference}", cost_total, 0, "ticket", ticket_ref),
        tx.create_entry(db, "STOCK", "3", f"Credit stock commande {order.reference}", 0, cost_total, "ticket", ticket_ref),
    ]
    order.statut = "convertie_caisse"
    tx.audit(db, "commandes", order.reference, "conversion ticket", {"ticket": ticket_ref, "total": order.total_ttc})
    db.commit()
    db.refresh(order)
    db.refresh(ticket)
    return {
        "statut": "commande convertie",
        "commande": _order_dict(order),
        "ticket": tx.ticket_to_dict(ticket),
        "mouvements_stock": movements,
        "ecritures": tx.entries_to_dict(entries),
    }
