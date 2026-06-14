"""
Service transactionnel V1.
"""
from datetime import date, datetime
from typing import Any, Dict, Iterable, List, Optional
from uuid import uuid4

from sqlalchemy.orm import Session

from ..models.transactionnel import (
    AuditFluxAgri,
    CommandeAchatAgri,
    EcritureAutoAgri,
    LigneTicketAgri,
    MouvementStockAgri,
    OperationBancaireAgri,
    ProduitAgri,
    TicketCaisseAgri,
    TiersAgri,
)


DEMO_PRODUCTS: List[Dict[str, Any]] = [
    {"code": "panier-legumes", "code_barres": "FF-PANIER-001", "nom": "Panier legumes", "famille": "Maraichage", "prix_vente": 22.0, "prix_kg": None, "tva": 5.5, "stock": 42, "unite": "piece", "cout_revient": 12.2, "lot_courant": "LOT-MAR-2026-18", "seuil_alerte": 12},
    {"code": "oeufs-x12", "code_barres": "FF-OEUFS-012", "nom": "Oeufs plein air x12", "famille": "Elevage", "prix_vente": 4.8, "prix_kg": None, "tva": 5.5, "stock": 68, "unite": "boite", "cout_revient": 2.9, "lot_courant": "LOT-OEU-2026-22", "seuil_alerte": 20},
    {"code": "farine-1kg", "code_barres": "FF-FARINE-1K", "nom": "Farine ferme 1kg", "famille": "Transformation", "prix_vente": 3.4, "prix_kg": None, "tva": 5.5, "stock": 35, "unite": "sac", "cout_revient": 1.75, "lot_courant": "LOT-TRA-2026-04", "seuil_alerte": 15},
    {"code": "colis-boeuf", "code_barres": "FF-BOEUF-KG", "nom": "Colis boeuf pese", "famille": "Elevage", "prix_vente": 15.8, "prix_kg": 15.8, "tva": 5.5, "stock": 94.5, "unite": "kg", "cout_revient": 9.6, "lot_courant": "LOT-VIA-2026-07", "seuil_alerte": 25},
    {"code": "pommes-kg", "code_barres": "FF-POMMES-KG", "nom": "Pommes au kg", "famille": "Verger", "prix_vente": 2.7, "prix_kg": 2.7, "tva": 5.5, "stock": 310, "unite": "kg", "cout_revient": 1.05, "lot_courant": "LOT-VER-2026-11", "seuil_alerte": 80},
    {"code": "semence-ble", "code_barres": "FF-SEM-BLE", "nom": "Semence ble tendre", "famille": "Intrants", "prix_vente": 72.0, "prix_kg": None, "tva": 10.0, "stock": 18, "unite": "sac", "cout_revient": 72.0, "lot_courant": "LOT-SEM-2026-01", "seuil_alerte": 6},
]


DEMO_TIERS: List[Dict[str, Any]] = [
    {"code": "client-comptoir", "nom": "Client comptoir", "type_tiers": "client", "segment": "circuit-court", "canal": "boutique ferme", "delai_paiement": 0, "remise_reference": 0, "volume_annuel": 800},
    {"code": "restaurant-tilleuls", "nom": "Restaurant Les Tilleuls", "type_tiers": "client", "segment": "pro", "canal": "restaurant", "delai_paiement": 15, "remise_reference": 8, "volume_annuel": 6200},
    {"code": "amap-village", "nom": "AMAP village", "type_tiers": "client", "segment": "circuit-court", "canal": "AMAP", "delai_paiement": 0, "remise_reference": 3, "volume_annuel": 4200},
    {"code": "cantine-centrale", "nom": "Cantine centrale", "type_tiers": "client", "segment": "collectivite", "canal": "collectivite", "delai_paiement": 30, "remise_reference": 12, "volume_annuel": 18000},
    {"code": "coop-val-loire", "nom": "Cooperative Val de Loire", "type_tiers": "fournisseur", "segment": "pro", "canal": "fournisseur", "delai_paiement": 30, "remise_reference": 0, "volume_annuel": 0},
]


SEGMENTS: List[Dict[str, Any]] = [
    {"code": "circuit-court", "nom": "Circuit court", "canaux": ["boutique ferme", "marche", "AMAP", "drive fermier"], "prix": "prix public, panier moyen, fidelite", "promesse": "vente directe, tracabilite, paiement immediat"},
    {"code": "pro", "nom": "Professionnel", "canaux": ["restaurant", "epicerie", "revendeur", "transformateur"], "prix": "tarifs negocies, remises volume, facturation", "promesse": "regularite, lots reserves, bons de livraison"},
    {"code": "collectivite", "nom": "Collectivite", "canaux": ["cantine", "mairie", "ehpad", "ecole"], "prix": "contrat, appels d offres, delais de paiement", "promesse": "volumes planifies, conformite, bons de commande"},
]


def reference(prefix: str) -> str:
    return f"{prefix}-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid4())[:8].upper()}"


def seed_demo(db: Session) -> None:
    for payload in DEMO_PRODUCTS:
        existing = db.query(ProduitAgri).filter(ProduitAgri.code == payload["code"]).first()
        if not existing:
            db.add(ProduitAgri(**payload))

    for payload in DEMO_TIERS:
        existing = db.query(TiersAgri).filter(TiersAgri.code == payload["code"]).first()
        if not existing:
            db.add(TiersAgri(**payload))

    db.commit()


def audit(db: Session, flux: str, ref: str, action: str, payload: Optional[Dict[str, Any]] = None, statut: str = "ok") -> None:
    db.add(AuditFluxAgri(flux=flux, reference=ref, action=action, statut=statut, payload=payload or {}))


def product_to_dict(product: ProduitAgri) -> Dict[str, Any]:
    return {
        "id": product.id,
        "code": product.code,
        "code_barres": product.code_barres,
        "nom": product.nom,
        "name": product.nom,
        "famille": product.famille,
        "categorie": product.famille,
        "category": product.famille,
        "prix": product.prix_vente,
        "price": product.prix_vente,
        "prix_kg": product.prix_kg,
        "tva": product.tva,
        "tax": product.tva,
        "stock": product.stock,
        "unite": product.unite,
        "unit": product.unite,
        "cout_revient": product.cout_revient,
        "lot": product.lot_courant,
        "seuil_alerte": product.seuil_alerte,
    }


def tier_to_dict(tier: TiersAgri) -> Dict[str, Any]:
    return {
        "id": tier.id,
        "code": tier.code,
        "nom": tier.nom,
        "type_tiers": tier.type_tiers,
        "segment": tier.segment,
        "canal": tier.canal,
        "email": tier.email,
        "telephone": tier.telephone,
        "delai_paiement": tier.delai_paiement,
        "remise_reference": tier.remise_reference,
        "volume_annuel": tier.volume_annuel,
    }


def ticket_to_dict(ticket: TicketCaisseAgri) -> Dict[str, Any]:
    return {
        "ticket_id": ticket.reference,
        "reference": ticket.reference,
        "statut": ticket.statut,
        "client_id": ticket.client_id,
        "client": ticket.client_nom,
        "segment": ticket.segment,
        "moyen_paiement": {"code": ticket.moyen_paiement, "label": payment_label(ticket.moyen_paiement)},
        "totaux": {
            "sous_total": round(ticket.total_ttc + ticket.remise_percent, 2),
            "remise": round(ticket.remise_percent, 2),
            "tva": round(ticket.total_tva, 2),
            "total": round(ticket.total_ttc, 2),
            "cout_revient": round(ticket.cout_revient, 2),
            "marge": round(ticket.marge, 2),
        },
        "lignes": [
            {
                "code": line.produit_code,
                "nom": line.libelle,
                "quantite": line.quantite,
                "prix_unitaire": line.prix_unitaire,
                "tva": line.tva,
                "total": line.total_ttc,
                "marge": line.marge,
                "lot": line.lot,
                "source": line.source,
            }
            for line in ticket.lignes
        ],
    }


def movement_to_dict(movement: MouvementStockAgri) -> Dict[str, Any]:
    return {
        "mouvement_id": movement.reference,
        "reference": movement.reference,
        "produit": movement.produit_code,
        "libelle": movement.libelle,
        "lot": movement.lot,
        "sens": movement.sens,
        "quantite": movement.quantite,
        "unite": movement.unite,
        "origine": movement.origine,
        "atelier": movement.atelier,
        "valorisation": round(movement.valorisation or 0, 2),
        "impact_marge": "cout atelier actualise" if movement.quantite < 0 else "stock valorise",
        "ecriture_stock": {
            "journal": "STOCK",
            "libelle": f"{movement.sens} {movement.produit_code} {movement.lot or ''}".strip(),
            "debit": round(abs(movement.valorisation or 0), 2) if movement.quantite > 0 else 0,
            "credit": round(abs(movement.valorisation or 0), 2) if movement.quantite < 0 else 0,
        },
    }


def payment_label(code: str) -> str:
    return {"card": "TPE", "cash": "Especes", "transfer": "Virement"}.get(code, code)


def find_product(db: Session, identifier: str) -> ProduitAgri:
    normalized = identifier.strip().lower()
    product = (
        db.query(ProduitAgri)
        .filter(
            (ProduitAgri.code == normalized)
            | (ProduitAgri.code_barres == identifier)
            | (ProduitAgri.nom == identifier)
        )
        .first()
    )
    if not product:
        raise ValueError("Produit non mappe dans le catalogue POS")
    return product


def find_or_create_tier(db: Session, name: str, segment: str = "circuit-court") -> TiersAgri:
    normalized = name.strip().lower().replace(" ", "-")[:40] or "client"
    tier = db.query(TiersAgri).filter(TiersAgri.nom == name).first()
    if tier:
        return tier
    tier = TiersAgri(code=normalized, nom=name, type_tiers="client", segment=segment, canal=segment)
    db.add(tier)
    db.flush()
    return tier


def create_stock_movement(
    db: Session,
    product: ProduitAgri,
    sens: str,
    quantity: float,
    lot: Optional[str],
    origin: str,
    workshop: Optional[str],
    document_ref: Optional[str],
    cost_unit: Optional[float] = None,
) -> MouvementStockAgri:
    signed_qty = -abs(quantity) if sens in {"sortie", "vente", "perte"} else abs(quantity)
    cost = product.cout_revient if cost_unit is None else cost_unit
    value = signed_qty * cost
    product.stock = round((product.stock or 0) + signed_qty, 3)
    movement = MouvementStockAgri(
        reference=reference("STK"),
        produit=product,
        produit_code=product.code,
        libelle=product.nom,
        lot=lot or product.lot_courant,
        sens=sens,
        quantite=round(signed_qty, 3),
        unite=product.unite,
        cout_unitaire=cost,
        valorisation=round(value, 2),
        origine=origin,
        atelier=workshop,
        document_reference=document_ref,
    )
    db.add(movement)
    audit(db, "stock", movement.reference, "mouvement stock", {"produit": product.code, "quantite": signed_qty})
    return movement


def create_entry(
    db: Session,
    journal: str,
    account: str,
    label: str,
    debit: float,
    credit: float,
    doc_type: str,
    doc_ref: str,
    status: str = "proposee",
) -> EcritureAutoAgri:
    entry = EcritureAutoAgri(
        reference=reference("ECR"),
        journal=journal,
        compte=account,
        libelle=label,
        debit=round(debit, 2),
        credit=round(credit, 2),
        document_type=doc_type,
        document_reference=doc_ref,
        statut=status,
    )
    db.add(entry)
    audit(db, "compta", entry.reference, "ecriture automatique", {"document": doc_ref, "journal": journal})
    return entry


def entries_to_dict(entries: Iterable[EcritureAutoAgri]) -> List[Dict[str, Any]]:
    return [
        {
            "reference": entry.reference,
            "journal": entry.journal,
            "compte": entry.compte,
            "libelle": entry.libelle,
            "debit": entry.debit,
            "credit": entry.credit,
            "statut": entry.statut,
        }
        for entry in entries
    ]


def segment_code(canal: str, type_structure: str, volume: float) -> str:
    text = f"{canal} {type_structure}".lower()
    if "collectivite" in text or "cantine" in text or "mairie" in text or volume >= 15000:
        return "collectivite"
    if "restaurant" in text or "pro" in text or "revendeur" in text or volume >= 3500:
        return "pro"
    return "circuit-court"


def segment_payload(code: str) -> Dict[str, Any]:
    return next(item for item in SEGMENTS if item["code"] == code)


def dashboard(db: Session) -> Dict[str, Any]:
    seed_demo(db)
    products = db.query(ProduitAgri).filter(ProduitAgri.actif.is_(True)).order_by(ProduitAgri.famille, ProduitAgri.nom).all()
    tickets = db.query(TicketCaisseAgri).order_by(TicketCaisseAgri.created_at.desc()).limit(8).all()
    entries_count = db.query(EcritureAutoAgri).count()
    movements_count = db.query(MouvementStockAgri).count()
    stock_value = sum((product.stock or 0) * (product.cout_revient or 0) for product in products)
    alerts = [product for product in products if product.seuil_alerte and (product.stock or 0) <= product.seuil_alerte]
    revenue = sum(ticket.total_ttc or 0 for ticket in tickets)
    margin = sum(ticket.marge or 0 for ticket in tickets)

    return {
        "date": date.today().isoformat(),
        "kpis": [
            {"label": "Stock valorise", "value": round(stock_value, 2), "detail": "valeur cout de revient"},
            {"label": "Tickets recents", "value": len(tickets), "detail": f"{round(revenue, 2)} EUR encaisses"},
            {"label": "Marge caisse", "value": round(margin, 2), "detail": "tickets persistants"},
            {"label": "Ecritures auto", "value": entries_count, "detail": f"{movements_count} mouvements stock"},
        ],
        "catalogue_pos": [product_to_dict(product) for product in products],
        "segments": SEGMENTS,
        "tickets_recents": [ticket_to_dict(ticket) for ticket in tickets],
        "alertes_stock": [product_to_dict(product) for product in alerts],
    }
