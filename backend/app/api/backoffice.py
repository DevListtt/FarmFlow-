"""
Back-office operationnel pour les referentiels transactionnels.
"""
import csv
import io
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.transactionnel import (
    CommandeAchatAgri,
    EcritureAutoAgri,
    LigneTicketAgri,
    MouvementStockAgri,
    OperationBancaireAgri,
    ProduitAgri,
    TicketCaisseAgri,
    TiersAgri,
)
from ..services import transactionnel as tx


router = APIRouter(prefix="/backoffice", tags=["backoffice"])


class ProduitBackofficeRequest(BaseModel):
    code: Optional[str] = None
    code_barres: Optional[str] = None
    nom: str
    famille: str = "Produit ferme"
    unite: str = "piece"
    prix_vente: float = Field(0, ge=0)
    prix_kg: Optional[float] = Field(None, ge=0)
    tva: float = Field(5.5, ge=0)
    cout_revient: float = Field(0, ge=0)
    stock: float = Field(0, ge=0)
    seuil_alerte: float = Field(0, ge=0)
    lot_courant: Optional[str] = None


class TiersBackofficeRequest(BaseModel):
    code: Optional[str] = None
    nom: str
    type_tiers: str = "client"
    segment: str = "circuit-court"
    canal: str = "boutique ferme"
    email: Optional[str] = None
    telephone: Optional[str] = None
    delai_paiement: int = Field(0, ge=0)
    remise_reference: float = Field(0, ge=0)
    volume_annuel: float = Field(0, ge=0)


class AjustementStockRequest(BaseModel):
    produit: str
    sens: str = "entree"
    quantite: float = Field(..., gt=0)
    lot: Optional[str] = None
    origine: str = "ajustement back-office"
    atelier: str = "Exploitation"
    cout_unitaire: Optional[float] = Field(None, ge=0)


def _slug(value: str, fallback: str) -> str:
    normalized = "".join(char.lower() if char.isalnum() else "-" for char in value.strip())
    compact = "-".join(part for part in normalized.split("-") if part)
    return (compact or fallback)[:60]


def _movement_to_backoffice_dict(movement: MouvementStockAgri) -> Dict[str, Any]:
    return {
        "reference": movement.reference,
        "produit": movement.produit_code,
        "libelle": movement.libelle,
        "sens": movement.sens,
        "quantite": movement.quantite,
        "unite": movement.unite,
        "lot": movement.lot,
        "origine": movement.origine,
        "atelier": movement.atelier,
        "valorisation": round(movement.valorisation or 0, 2),
        "date": movement.created_at.isoformat() if movement.created_at else None,
    }


def _order_to_dict(order: CommandeAchatAgri) -> Dict[str, Any]:
    return {
        "reference": order.reference,
        "fournisseur": order.fournisseur,
        "produit": order.produit_code,
        "quantite": order.quantite,
        "unite": order.unite,
        "atelier": order.atelier,
        "total_ttc": order.total_ttc,
        "statut": order.statut,
        "date": order.created_at.isoformat() if order.created_at else None,
    }


def _entry_to_dict(entry: EcritureAutoAgri) -> Dict[str, Any]:
    return {
        "reference": entry.reference,
        "journal": entry.journal,
        "compte": entry.compte,
        "libelle": entry.libelle,
        "debit": entry.debit,
        "credit": entry.credit,
        "statut": entry.statut,
        "document_type": entry.document_type,
        "document_reference": entry.document_reference,
        "date": entry.created_at.isoformat() if entry.created_at else None,
    }


def _bank_to_dict(operation: OperationBancaireAgri) -> Dict[str, Any]:
    return {
        "reference": operation.reference,
        "date_operation": operation.date_operation.isoformat() if operation.date_operation else None,
        "libelle": operation.libelle,
        "montant": operation.montant,
        "categorie": operation.categorie,
        "statut": operation.statut,
        "document_reference": operation.document_reference,
        "score": operation.score,
    }


def _csv_response(filename: str, rows: List[Dict[str, Any]]) -> Response:
    output = io.StringIO()
    fieldnames = sorted({key for row in rows for key in row.keys()})
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/referentiels")
def get_referentiels(db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    produits = db.query(ProduitAgri).filter(ProduitAgri.actif.is_(True)).order_by(ProduitAgri.famille, ProduitAgri.nom).all()
    tiers = db.query(TiersAgri).filter(TiersAgri.actif.is_(True)).order_by(TiersAgri.type_tiers, TiersAgri.nom).all()
    mouvements = db.query(MouvementStockAgri).order_by(MouvementStockAgri.created_at.desc()).limit(14).all()
    commandes = db.query(CommandeAchatAgri).order_by(CommandeAchatAgri.created_at.desc()).limit(8).all()
    ecritures = db.query(EcritureAutoAgri).order_by(EcritureAutoAgri.created_at.desc()).limit(10).all()
    tickets = db.query(TicketCaisseAgri).order_by(TicketCaisseAgri.created_at.desc()).limit(8).all()
    valeur_stock = sum((product.stock or 0) * (product.cout_revient or 0) for product in produits)
    alertes = [product for product in produits if product.seuil_alerte and (product.stock or 0) <= product.seuil_alerte]

    return {
        "kpis": [
            {"label": "Produits actifs", "value": len(produits), "detail": "catalogue vente et intrants"},
            {"label": "Tiers actifs", "value": len(tiers), "detail": "clients et fournisseurs"},
            {"label": "Stock valorise", "value": round(valeur_stock, 2), "detail": "cout de revient"},
            {"label": "Alertes stock", "value": len(alertes), "detail": "seuils a traiter"},
        ],
        "produits": [tx.product_to_dict(product) for product in produits],
        "tiers": [tx.tier_to_dict(tier) for tier in tiers],
        "segments": tx.SEGMENTS,
        "mouvements": [_movement_to_backoffice_dict(movement) for movement in mouvements],
        "commandes": [_order_to_dict(order) for order in commandes],
        "ecritures": [_entry_to_dict(entry) for entry in ecritures],
        "tickets": [tx.ticket_to_dict(ticket) for ticket in tickets],
    }


@router.get("/historiques")
def get_historiques(
    type_flux: str = "tout",
    recherche: str = "",
    limite: int = 50,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    tx.seed_demo(db)
    limit = max(1, min(limite, 200))
    needle = recherche.strip().lower()

    tickets = db.query(TicketCaisseAgri).order_by(TicketCaisseAgri.created_at.desc()).limit(limit).all()
    commandes = db.query(CommandeAchatAgri).order_by(CommandeAchatAgri.created_at.desc()).limit(limit).all()
    mouvements = db.query(MouvementStockAgri).order_by(MouvementStockAgri.created_at.desc()).limit(limit).all()
    ecritures = db.query(EcritureAutoAgri).order_by(EcritureAutoAgri.created_at.desc()).limit(limit).all()
    operations = db.query(OperationBancaireAgri).order_by(OperationBancaireAgri.created_at.desc()).limit(limit).all()

    rows: List[Dict[str, Any]] = []
    if type_flux in {"tout", "tickets"}:
        rows.extend({
            "type": "ticket",
            "reference": ticket.reference,
            "date": ticket.created_at.isoformat() if ticket.created_at else None,
            "libelle": ticket.client_nom,
            "statut": ticket.statut,
            "montant": ticket.total_ttc,
            "detail_url": f"/backoffice/tickets/{ticket.reference}",
        } for ticket in tickets)
    if type_flux in {"tout", "achats"}:
        rows.extend({
            "type": "achat",
            "reference": order.reference,
            "date": order.created_at.isoformat() if order.created_at else None,
            "libelle": order.fournisseur,
            "statut": order.statut,
            "montant": order.total_ttc,
            "detail_url": f"/backoffice/achats/{order.reference}",
        } for order in commandes)
    if type_flux in {"tout", "stocks"}:
        rows.extend({
            "type": "stock",
            "reference": movement.reference,
            "date": movement.created_at.isoformat() if movement.created_at else None,
            "libelle": f"{movement.sens} {movement.produit_code}",
            "statut": movement.origine or "mouvement",
            "montant": movement.valorisation,
            "detail_url": f"/backoffice/produits/{movement.produit_code}",
        } for movement in mouvements)
    if type_flux in {"tout", "ecritures"}:
        rows.extend({
            "type": "ecriture",
            "reference": entry.reference,
            "date": entry.created_at.isoformat() if entry.created_at else None,
            "libelle": entry.libelle,
            "statut": entry.statut,
            "montant": round((entry.debit or 0) - (entry.credit or 0), 2),
            "detail_url": f"/backoffice/ecritures/{entry.reference}",
        } for entry in ecritures)
    if type_flux in {"tout", "banque"}:
        rows.extend({
            "type": "banque",
            "reference": operation.reference,
            "date": operation.date_operation.isoformat() if operation.date_operation else None,
            "libelle": operation.libelle,
            "statut": operation.statut,
            "montant": operation.montant,
            "detail_url": f"/backoffice/banque/{operation.reference}",
        } for operation in operations)

    if needle:
        rows = [row for row in rows if needle in " ".join(str(value).lower() for value in row.values() if value is not None)]

    rows = sorted(rows, key=lambda row: row.get("date") or "", reverse=True)[:limit]
    return {
        "type_flux": type_flux,
        "recherche": recherche,
        "total": len(rows),
        "lignes": rows,
        "exports": [
            {"label": "Tickets CSV", "url": "/backoffice/exports/tickets.csv"},
            {"label": "Achats CSV", "url": "/backoffice/exports/achats.csv"},
            {"label": "Stocks CSV", "url": "/backoffice/exports/stocks.csv"},
            {"label": "Ecritures CSV", "url": "/backoffice/exports/ecritures.csv"},
        ],
    }


@router.get("/produits/{code}")
def get_produit_detail(code: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    product = db.query(ProduitAgri).filter(ProduitAgri.code == code).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    movements = db.query(MouvementStockAgri).filter(MouvementStockAgri.produit_code == code).order_by(MouvementStockAgri.created_at.desc()).limit(30).all()
    lines = db.query(LigneTicketAgri).filter(LigneTicketAgri.produit_code == code).order_by(LigneTicketAgri.created_at.desc()).limit(30).all()
    total_sales = sum(line.total_ttc or 0 for line in lines)
    total_margin = sum(line.marge or 0 for line in lines)
    return {
        "produit": tx.product_to_dict(product),
        "kpis": [
            {"label": "Stock", "value": product.stock, "detail": product.unite},
            {"label": "Valeur stock", "value": round((product.stock or 0) * (product.cout_revient or 0), 2), "detail": "cout de revient"},
            {"label": "Ventes recentes", "value": round(total_sales, 2), "detail": f"{len(lines)} lignes"},
            {"label": "Marge recente", "value": round(total_margin, 2), "detail": "lignes caisse"},
        ],
        "mouvements": [_movement_to_backoffice_dict(movement) for movement in movements],
        "ventes": [
            {
                "reference": line.ticket.reference if line.ticket else None,
                "date": line.created_at.isoformat() if line.created_at else None,
                "quantite": line.quantite,
                "total": line.total_ttc,
                "marge": line.marge,
                "lot": line.lot,
            }
            for line in lines
        ],
    }


@router.get("/tiers/{code}")
def get_tiers_detail(code: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    tier = db.query(TiersAgri).filter(TiersAgri.code == code).first()
    if not tier:
        raise HTTPException(status_code=404, detail="Tiers introuvable")
    tickets = db.query(TicketCaisseAgri).filter(TicketCaisseAgri.client_id == tier.id).order_by(TicketCaisseAgri.created_at.desc()).limit(30).all()
    orders = db.query(CommandeAchatAgri).filter(CommandeAchatAgri.fournisseur == tier.nom).order_by(CommandeAchatAgri.created_at.desc()).limit(30).all()
    revenue = sum(ticket.total_ttc or 0 for ticket in tickets)
    purchases = sum(order.total_ttc or 0 for order in orders)
    return {
        "tiers": tx.tier_to_dict(tier),
        "kpis": [
            {"label": "Ventes", "value": round(revenue, 2), "detail": f"{len(tickets)} tickets"},
            {"label": "Achats", "value": round(purchases, 2), "detail": f"{len(orders)} commandes"},
            {"label": "Delai paiement", "value": tier.delai_paiement, "detail": "jours"},
            {"label": "Remise", "value": tier.remise_reference, "detail": "%"},
        ],
        "tickets": [tx.ticket_to_dict(ticket) for ticket in tickets],
        "commandes": [_order_to_dict(order) for order in orders],
    }


@router.get("/tickets/{reference}")
def get_ticket_detail(reference: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    ticket = db.query(TicketCaisseAgri).filter(TicketCaisseAgri.reference == reference).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    movements = db.query(MouvementStockAgri).filter(MouvementStockAgri.document_reference == reference).order_by(MouvementStockAgri.created_at.desc()).all()
    entries = db.query(EcritureAutoAgri).filter(EcritureAutoAgri.document_reference == reference).order_by(EcritureAutoAgri.created_at.desc()).all()
    return {
        "ticket": tx.ticket_to_dict(ticket),
        "mouvements": [_movement_to_backoffice_dict(movement) for movement in movements],
        "ecritures": [_entry_to_dict(entry) for entry in entries],
    }


@router.get("/achats/{reference}")
def get_achat_detail(reference: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    order = db.query(CommandeAchatAgri).filter(CommandeAchatAgri.reference == reference).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande achat introuvable")
    movements = db.query(MouvementStockAgri).filter(MouvementStockAgri.document_reference == reference).order_by(MouvementStockAgri.created_at.desc()).all()
    entries = db.query(EcritureAutoAgri).filter(EcritureAutoAgri.document_reference == reference).order_by(EcritureAutoAgri.created_at.desc()).all()
    return {
        "commande": _order_to_dict(order),
        "mouvements": [_movement_to_backoffice_dict(movement) for movement in movements],
        "ecritures": [_entry_to_dict(entry) for entry in entries],
    }


@router.get("/ecritures/{reference}")
def get_ecriture_detail(reference: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    entry = db.query(EcritureAutoAgri).filter(EcritureAutoAgri.reference == reference).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Ecriture introuvable")
    related = (
        db.query(EcritureAutoAgri)
        .filter(EcritureAutoAgri.document_reference == entry.document_reference)
        .order_by(EcritureAutoAgri.created_at.desc())
        .all()
    )
    return {
        "ecriture": _entry_to_dict(entry),
        "document_reference": entry.document_reference,
        "ecritures_liees": [_entry_to_dict(item) for item in related],
    }


@router.get("/banque/{reference}")
def get_banque_detail(reference: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    operation = db.query(OperationBancaireAgri).filter(OperationBancaireAgri.reference == reference).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation bancaire introuvable")
    entries = (
        db.query(EcritureAutoAgri)
        .filter(EcritureAutoAgri.document_reference == operation.document_reference)
        .order_by(EcritureAutoAgri.created_at.desc())
        .all()
    )
    return {
        "operation": _bank_to_dict(operation),
        "ecritures_liees": [_entry_to_dict(entry) for entry in entries],
    }


@router.get("/exports/{export_type}.csv")
def export_csv(export_type: str, db: Session = Depends(get_db)) -> Response:
    tx.seed_demo(db)
    if export_type == "tickets":
        rows = [
            {
                "reference": ticket.reference,
                "date": ticket.created_at.isoformat() if ticket.created_at else None,
                "client": ticket.client_nom,
                "segment": ticket.segment,
                "moyen_paiement": ticket.moyen_paiement,
                "total_ttc": ticket.total_ttc,
                "marge": ticket.marge,
                "statut": ticket.statut,
            }
            for ticket in db.query(TicketCaisseAgri).order_by(TicketCaisseAgri.created_at.desc()).limit(500).all()
        ]
    elif export_type == "achats":
        rows = [_order_to_dict(order) for order in db.query(CommandeAchatAgri).order_by(CommandeAchatAgri.created_at.desc()).limit(500).all()]
    elif export_type == "stocks":
        rows = [_movement_to_backoffice_dict(movement) for movement in db.query(MouvementStockAgri).order_by(MouvementStockAgri.created_at.desc()).limit(500).all()]
    elif export_type == "ecritures":
        rows = [_entry_to_dict(entry) for entry in db.query(EcritureAutoAgri).order_by(EcritureAutoAgri.created_at.desc()).limit(500).all()]
    elif export_type == "tiers":
        rows = [tx.tier_to_dict(tier) for tier in db.query(TiersAgri).order_by(TiersAgri.nom).limit(500).all()]
    elif export_type == "produits":
        rows = [tx.product_to_dict(product) for product in db.query(ProduitAgri).order_by(ProduitAgri.nom).limit(500).all()]
    else:
        raise HTTPException(status_code=404, detail="Export inconnu")
    return _csv_response(f"farmflow-{export_type}.csv", rows)


@router.post("/produits")
def upsert_produit(request: ProduitBackofficeRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    code = _slug(request.code or request.nom, "produit")
    product = db.query(ProduitAgri).filter(ProduitAgri.code == code).first()
    status = "mis_a_jour" if product else "cree"
    if not product:
        product = ProduitAgri(code=code)
        db.add(product)

    for key, value in request.model_dump(exclude={"code"}).items():
        setattr(product, key, value)

    if not product.code_barres:
        product.code_barres = f"FF-{code.upper()[:28]}"
    if not product.lot_courant:
        product.lot_courant = f"LOT-{code.upper()[:20]}"

    db.flush()
    tx.audit(db, "backoffice", product.code, "produit back-office", {"statut": status})
    db.commit()
    db.refresh(product)
    return {"statut": status, "produit": tx.product_to_dict(product)}


@router.post("/tiers")
def upsert_tiers(request: TiersBackofficeRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    code = _slug(request.code or request.nom, "tiers")[:40]
    tier = db.query(TiersAgri).filter(TiersAgri.code == code).first()
    status = "mis_a_jour" if tier else "cree"
    if not tier:
        tier = TiersAgri(code=code)
        db.add(tier)

    for key, value in request.model_dump(exclude={"code"}).items():
        setattr(tier, key, value)

    db.flush()
    tx.audit(db, "backoffice", tier.code, "tiers back-office", {"statut": status, "segment": tier.segment})
    db.commit()
    db.refresh(tier)
    return {"statut": status, "tiers": tx.tier_to_dict(tier)}


@router.post("/stocks/ajustement")
def ajuster_stock(request: AjustementStockRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    try:
        product = tx.find_product(db, request.produit)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    movement = tx.create_stock_movement(
        db,
        product=product,
        sens=request.sens,
        quantity=request.quantite,
        lot=request.lot or product.lot_courant,
        origin=request.origine,
        workshop=request.atelier,
        document_ref=None,
        cost_unit=request.cout_unitaire,
    )
    value = abs(movement.valorisation or 0)
    entry = tx.create_entry(
        db,
        "STOCK",
        "31",
        f"Ajustement {product.code}",
        value if movement.quantite > 0 else 0,
        value if movement.quantite < 0 else 0,
        "stock",
        movement.reference,
    )
    db.commit()
    db.refresh(product)
    db.refresh(movement)
    return {
        "statut": "ajustement_enregistre",
        "produit": tx.product_to_dict(product),
        "mouvement": _movement_to_backoffice_dict(movement),
        "ecriture": _entry_to_dict(entry),
    }
