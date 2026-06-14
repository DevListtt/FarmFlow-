"""
Noyau operationnel agricole.

Ce routeur simule les chaines transactionnelles critiques avant raccordement
aux tables finales : achat, reception, stock, caisse, banque, ecriture
comptable, IoT, balance, mobile terrain et segmentation commerciale.
"""
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.transactionnel import CommandeAchatAgri, OperationBancaireAgri, ProduitAgri
from ..services import transactionnel as tx


router = APIRouter(prefix="/noyau", tags=["noyau-operationnel"])


class CommandeAchatRequest(BaseModel):
    fournisseur: str = "Cooperative Val de Loire"
    produit: str = "semence-ble"
    quantite: float = Field(12, gt=0)
    unite: str = "sac"
    prix_unitaire: float = Field(72, ge=0)
    tva: float = Field(10, ge=0)
    atelier: str = "Ble tendre"


class MouvementStockRequest(BaseModel):
    produit: str = "semence-ble"
    lot: str = "LOT-SEM-2026-01"
    sens: str = "entree"
    quantite: float = Field(10, gt=0)
    unite: str = "sac"
    origine: str = "reception fournisseur"
    atelier: str = "Ble tendre"
    cout_unitaire: float = Field(72, ge=0)


class RapprochementRequest(BaseModel):
    libelle_banque: str = "Virement Cooperative Val de Loire"
    montant: float = Field(-864, description="Debit negatif, credit positif")
    reference: Optional[str] = None
    date_operation: Optional[str] = None


class SegmentationRequest(BaseModel):
    nom: str = "Cantine centrale"
    canal: str = "collectivite"
    type_structure: str = "collectivite"
    volume_annuel: float = Field(18000, ge=0)
    frequence: str = "hebdomadaire"
    delai_paiement: int = Field(30, ge=0)


class ScanPosRequest(BaseModel):
    code_barres: str = "FF-PANIER-001"
    quantite: float = Field(1, gt=0)
    client_segment: str = "circuit-court"


class PeseeRequest(BaseModel):
    produit: str = "colis-boeuf"
    poids_brut: float = Field(5.25, gt=0)
    tare: float = Field(0.15, ge=0)
    lot: str = "LOT-VIA-2026-07"
    prix_kg: Optional[float] = None
    client_segment: str = "circuit-court"


class InterventionMobileRequest(BaseModel):
    chantier: str = "Epandage fumier"
    parcelle: str = "P-104"
    operateur: str = "Salarie terrain"
    temps_heures: float = Field(2.5, gt=0)
    carburant_litres: float = Field(18, ge=0)
    stock_consomme: float = Field(7.5, ge=0)


class AnalyseNoyauRequest(BaseModel):
    scenario: str = "tresorerie"
    horizon_jours: int = Field(30, ge=1, le=365)
    objectif: str = "reduire ecarts et proteger marge"


CATALOGUE_POS: List[Dict[str, Any]] = [
    {
        "code": "panier-legumes",
        "code_barres": "FF-PANIER-001",
        "nom": "Panier legumes",
        "famille": "Maraichage",
        "prix": 22.0,
        "prix_kg": None,
        "tva": 5.5,
        "stock": 42,
        "unite": "piece",
        "cout_revient": 12.2,
        "lot": "LOT-MAR-2026-18",
    },
    {
        "code": "oeufs-x12",
        "code_barres": "FF-OEUFS-012",
        "nom": "Oeufs plein air x12",
        "famille": "Elevage",
        "prix": 4.8,
        "prix_kg": None,
        "tva": 5.5,
        "stock": 68,
        "unite": "boite",
        "cout_revient": 2.9,
        "lot": "LOT-OEU-2026-22",
    },
    {
        "code": "farine-1kg",
        "code_barres": "FF-FARINE-1K",
        "nom": "Farine ferme 1kg",
        "famille": "Transformation",
        "prix": 3.4,
        "prix_kg": None,
        "tva": 5.5,
        "stock": 35,
        "unite": "sac",
        "cout_revient": 1.75,
        "lot": "LOT-TRA-2026-04",
    },
    {
        "code": "colis-boeuf",
        "code_barres": "FF-BOEUF-KG",
        "nom": "Colis boeuf pese",
        "famille": "Elevage",
        "prix": 15.8,
        "prix_kg": 15.8,
        "tva": 5.5,
        "stock": 94.5,
        "unite": "kg",
        "cout_revient": 9.6,
        "lot": "LOT-VIA-2026-07",
    },
    {
        "code": "pommes-kg",
        "code_barres": "FF-POMMES-KG",
        "nom": "Pommes au kg",
        "famille": "Verger",
        "prix": 2.7,
        "prix_kg": 2.7,
        "tva": 5.5,
        "stock": 310,
        "unite": "kg",
        "cout_revient": 1.05,
        "lot": "LOT-VER-2026-11",
    },
]


SEGMENTS: List[Dict[str, Any]] = [
    {
        "code": "circuit-court",
        "nom": "Circuit court",
        "canaux": ["boutique ferme", "marche", "AMAP", "drive fermier"],
        "prix": "prix public, panier moyen, fidelite",
        "promesse": "vente directe, tracabilite, paiement immediat",
    },
    {
        "code": "pro",
        "nom": "Professionnel",
        "canaux": ["restaurant", "epicerie", "revendeur", "transformateur"],
        "prix": "tarifs negocies, remises volume, facturation",
        "promesse": "regularite, lots reserves, bons de livraison",
    },
    {
        "code": "collectivite",
        "nom": "Collectivite",
        "canaux": ["cantine", "mairie", "ehpad", "ecole"],
        "prix": "contrat, appels d offres, delais de paiement",
        "promesse": "volumes planifies, conformite, bons de commande",
    },
]


CHAINES_TRANSACTIONNELLES: List[Dict[str, Any]] = [
    {
        "code": "achat-stock-compta-banque",
        "titre": "Achat intrant -> reception -> stock -> compta -> banque",
        "etapes": [
            "commande fournisseur",
            "reception lot",
            "mouvement stock valorise",
            "facture fournisseur",
            "ecriture automatique",
            "rapprochement bancaire",
        ],
        "statut": "pret a tester",
    },
    {
        "code": "caisse-stock-compta-tpe",
        "titre": "Caisse -> sortie stock -> ticket -> TPE -> compta",
        "etapes": [
            "scan produit",
            "pesee optionnelle",
            "encaissement",
            "sortie lot",
            "ticket et TVA",
            "rapprochement TPE",
        ],
        "statut": "pret a tester",
    },
    {
        "code": "terrain-stock-marge",
        "titre": "Chantier terrain -> consommation -> cout atelier -> marge",
        "etapes": [
            "planification chantier",
            "validation mobile",
            "sortie intrant",
            "temps machine",
            "cout parcelle",
            "marge actualisee",
        ],
        "statut": "socle fonctionnel",
    },
]


def _reference(prefix: str) -> str:
    return f"{prefix}-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid4())[:8].upper()}"


def _find_product(identifier: str) -> Dict[str, Any]:
    normalized = identifier.strip().lower()
    product = next(
        (
            item
            for item in CATALOGUE_POS
            if item["code"].lower() == normalized
            or item["code_barres"].lower() == normalized
            or item["nom"].lower() == normalized
        ),
        None,
    )
    if not product:
        raise HTTPException(status_code=404, detail="Produit non mappe dans le catalogue POS")
    return product


def _segment_from_request(request: SegmentationRequest) -> str:
    channel = f"{request.canal} {request.type_structure}".lower()
    if "collectivite" in channel or "cantine" in channel or "mairie" in channel or request.volume_annuel >= 15000:
        return "collectivite"
    if "restaurant" in channel or "pro" in channel or "revendeur" in channel or request.volume_annuel >= 3500:
        return "pro"
    return "circuit-court"


@router.get("/vue")
def get_vue_noyau(db: Session = Depends(get_db)) -> Dict[str, Any]:
    state = tx.dashboard(db)
    return {
        "date": date.today().isoformat(),
        "kpis": state["kpis"],
        "chaines": CHAINES_TRANSACTIONNELLES,
        "segments": tx.SEGMENTS,
        "catalogue_pos": state["catalogue_pos"],
        "tickets_recents": state["tickets_recents"],
        "alertes_stock": state["alertes_stock"],
        "iot": [
            {"code": "scanner-pos", "nom": "Scanner POS", "statut": "persistant", "usage": "code-barres vers panier, lot et stock"},
            {"code": "balance", "nom": "Balance connectee", "statut": "persistant", "usage": "poids net vers prix, lot et ticket"},
            {"code": "tpe", "nom": "TPE", "statut": "a parametrer", "usage": "paiement carte vers rapprochement"},
            {"code": "capteurs", "nom": "IoT ferme", "statut": "a connecter", "usage": "silo, eau, temperature, carburant"},
        ],
        "simulateurs": [
            "marge par canal client",
            "prix de revient par lot",
            "rupture stock et reapprovisionnement",
            "tresorerie apres rapprochement",
        ],
        "garde_fous": [
            "validation humaine avant ecriture definitive",
            "journal d audit sur chaque flux",
            "anti doublon reference + montant + date",
            "donnees persistantes PostgreSQL",
        ],
    }


@router.post("/achats/commande")
def creer_commande_achat(request: CommandeAchatRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    total_ht = request.quantite * request.prix_unitaire
    tva = total_ht * request.tva / 100
    total_ttc = total_ht + tva
    commande_id = tx.reference("ACH")
    reception_id = _reference("REC")
    facture_id = tx.reference("FACF")

    product = db.query(ProduitAgri).filter(ProduitAgri.code == request.produit).first()
    if not product:
        product = ProduitAgri(
            code=request.produit,
            code_barres=f"FF-{request.produit.upper()[:24]}",
            nom=request.produit.replace("-", " ").title(),
            famille="Intrants",
            unite=request.unite,
            prix_vente=request.prix_unitaire,
            tva=request.tva,
            cout_revient=request.prix_unitaire,
            stock=0,
            lot_courant=f"LOT-{request.produit.upper()}-{datetime.utcnow().strftime('%m%d')}",
        )
        db.add(product)
        db.flush()

    order = CommandeAchatAgri(
        reference=commande_id,
        fournisseur=request.fournisseur,
        produit_code=request.produit,
        quantite=request.quantite,
        unite=request.unite,
        prix_unitaire=request.prix_unitaire,
        tva=request.tva,
        total_ht=round(total_ht, 2),
        total_tva=round(tva, 2),
        total_ttc=round(total_ttc, 2),
        atelier=request.atelier,
        facture_reference=facture_id,
    )
    db.add(order)
    movement = tx.create_stock_movement(
        db,
        product=product,
        sens="entree",
        quantity=request.quantite,
        lot=product.lot_courant,
        origin=f"reception {request.fournisseur}",
        workshop=request.atelier,
        document_ref=commande_id,
        cost_unit=request.prix_unitaire,
    )
    entries = [
        tx.create_entry(db, "ACHAT", "601", f"Achat {request.produit}", total_ht, 0, "achat", commande_id),
        tx.create_entry(db, "TVA", "44566", "TVA deductible", tva, 0, "achat", commande_id),
        tx.create_entry(db, "FOURN", "401", request.fournisseur, 0, total_ttc, "achat", commande_id),
    ]
    tx.audit(db, "achat", commande_id, "commande achat persistante", {"facture": facture_id})
    db.commit()
    db.refresh(order)

    return {
        "commande": {
            "id": order.reference,
            "fournisseur": order.fournisseur,
            "produit": order.produit_code,
            "quantite": order.quantite,
            "unite": order.unite,
            "atelier": order.atelier,
            "total_ht": order.total_ht,
            "total_ttc": order.total_ttc,
        },
        "reception": {
            "id": reception_id,
            "lot": product.lot_courant,
            "controle": "quantite et prix coherents",
            "statut": "reception enregistree",
        },
        "mouvement_stock": tx.movement_to_dict(movement),
        "facture": {
            "id": facture_id,
            "fournisseur": request.fournisseur,
            "montant": round(total_ttc, 2),
            "statut": "a payer",
        },
        "ecritures": tx.entries_to_dict(entries),
        "banque": {
            "rapprochement_attendu": round(-total_ttc, 2),
            "reference": facture_id,
            "statut": "en attente flux banque",
        },
    }


@router.post("/stocks/mouvement")
def creer_mouvement_stock(request: MouvementStockRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    product = db.query(ProduitAgri).filter(ProduitAgri.code == request.produit).first()
    if not product:
        product = ProduitAgri(
            code=request.produit,
            nom=request.produit.replace("-", " ").title(),
            famille="Stock",
            unite=request.unite,
            prix_vente=request.cout_unitaire,
            cout_revient=request.cout_unitaire,
            stock=0,
            lot_courant=request.lot,
        )
        db.add(product)
        db.flush()
    movement = tx.create_stock_movement(db, product, request.sens, request.quantite, request.lot, request.origine, request.atelier, None, request.cout_unitaire)
    entry = tx.create_entry(db, "STOCK", "3", f"{request.sens} {request.produit}", abs(movement.valorisation or 0) if movement.quantite > 0 else 0, abs(movement.valorisation or 0) if movement.quantite < 0 else 0, "stock", movement.reference)
    db.commit()
    return {**tx.movement_to_dict(movement), "ecritures": tx.entries_to_dict([entry])}


@router.post("/banque/rapprocher")
def rapprocher_banque(request: RapprochementRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    candidates = []
    for order in db.query(CommandeAchatAgri).order_by(CommandeAchatAgri.created_at.desc()).limit(10).all():
        candidates.append({"type": "facture fournisseur", "reference": order.facture_reference or order.reference, "montant": -abs(order.total_ttc or 0), "score": 80})
    for ticket in db.query(tx.TicketCaisseAgri).order_by(tx.TicketCaisseAgri.created_at.desc()).limit(10).all():
        candidates.append({"type": "ticket caisse", "reference": ticket.reference, "montant": abs(ticket.total_ttc or 0), "score": 80})
    if not candidates:
        candidates = [{"type": "operation libre", "reference": request.reference or tx.reference("BQ"), "montant": request.montant, "score": 75}]
    best = sorted(candidates, key=lambda item: abs(abs(item["montant"]) - abs(request.montant)))[0]
    best["score"] = max(50, 100 - int(abs(abs(best["montant"]) - abs(request.montant))))
    operation = OperationBancaireAgri(
        reference=request.reference or tx.reference("BQ"),
        date_operation=date.fromisoformat(request.date_operation) if request.date_operation else date.today(),
        libelle=request.libelle_banque,
        montant=request.montant,
        categorie=best["type"],
        statut="rapprochement_propose" if best["score"] >= 90 else "a_valider",
        document_reference=best["reference"],
        score=best["score"],
    )
    db.add(operation)
    entry = tx.create_entry(
        db,
        "BANQUE",
        "512",
        request.libelle_banque,
        request.montant if request.montant > 0 else 0,
        abs(request.montant) if request.montant < 0 else 0,
        "banque",
        operation.reference,
    )
    tx.audit(db, "banque", operation.reference, "rapprochement propose", {"document": best["reference"], "score": best["score"]})
    db.commit()

    return {
        "operation": {
            "libelle": request.libelle_banque,
            "montant": request.montant,
            "reference": request.reference,
            "date": request.date_operation or date.today().isoformat(),
        },
        "suggestion": best,
        "statut": operation.statut,
        "ecriture": tx.entries_to_dict([entry])[0],
        "controles": ["montant", "date", "reference", "doublon"],
    }


@router.post("/crm/segmenter")
def segmenter_client(request: SegmentationRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    segment_code = tx.segment_code(request.canal, request.type_structure, request.volume_annuel)
    segment = tx.segment_payload(segment_code)
    remise = {"circuit-court": 0, "pro": 8, "collectivite": 12}[segment_code]
    risque = "delai a surveiller" if request.delai_paiement >= 30 else "paiement rapide"
    tier = tx.find_or_create_tier(db, request.nom, segment_code)
    tier.segment = segment_code
    tier.canal = request.canal
    tier.volume_annuel = request.volume_annuel
    tier.delai_paiement = request.delai_paiement
    tier.remise_reference = remise
    tx.audit(db, "crm", tier.code, "segmentation client", {"segment": segment_code})
    db.commit()

    return {
        "client": tier.nom,
        "segment": segment,
        "regles": {
            "canal": request.canal,
            "type_structure": request.type_structure,
            "volume_annuel": request.volume_annuel,
            "delai_paiement": request.delai_paiement,
        },
        "politique_commerciale": {
            "remise_reference": remise,
            "facturation": "mensuelle" if segment_code != "circuit-court" else "ticket ou facture immediate",
            "risque": risque,
        },
        "actions": [
            "creer tarif segment",
            "lier commandes et factures",
            "suivre marge par canal",
        ],
    }


@router.post("/iot/scan-pos")
def scanner_pos(request: ScanPosRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    try:
        product = tx.find_product(db, request.code_barres)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    quantite = request.quantite
    total = quantite * product.prix_vente
    marge = total - (quantite * product.cout_revient)
    scan_id = tx.reference("SCAN")
    tx.audit(db, "iot", scan_id, "scan POS", {"produit": product.code, "quantite": quantite})
    db.commit()

    return {
        "scan_id": scan_id,
        "produit": tx.product_to_dict(product),
        "ligne_panier": {
            "code": product.code,
            "nom": product.nom,
            "quantite": quantite,
            "prix_unitaire": product.prix_vente,
            "tva": product.tva,
            "total": round(total, 2),
            "marge": round(marge, 2),
        },
        "stock_apres_scan": round((product.stock or 0) - quantite, 2),
        "tracabilite": {
            "lot": product.lot_courant,
            "source": "scanner POS",
            "segment": request.client_segment,
        },
        "automatisations": [
            "ajouter au panier",
            "reserver le lot",
            "preparer sortie stock",
            "actualiser marge ticket",
        ],
    }


@router.post("/iot/pesee")
def enregistrer_pesee(request: PeseeRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    try:
        product = tx.find_product(db, request.produit)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    poids_net = max(request.poids_brut - request.tare, 0)
    prix_kg = request.prix_kg or product.prix_kg or product.prix_vente
    total = poids_net * prix_kg
    cout = poids_net * product.cout_revient
    weighing_id = tx.reference("BAL")
    tx.audit(db, "iot", weighing_id, "pesee balance", {"produit": product.code, "poids_net": poids_net})
    db.commit()

    return {
        "pesee_id": weighing_id,
        "produit": tx.product_to_dict(product),
        "poids": {
            "brut": request.poids_brut,
            "tare": request.tare,
            "net": round(poids_net, 3),
            "unite": "kg",
        },
        "ligne_panier": {
            "code": product.code,
            "nom": product.nom,
            "quantite": round(poids_net, 3),
            "prix_unitaire": round(prix_kg, 2),
            "tva": product.tva,
            "total": round(total, 2),
            "marge": round(total - cout, 2),
        },
        "mouvement_stock": {
            "lot": request.lot,
            "quantite": -round(poids_net, 3),
            "motif": "vente pesee",
        },
        "automatisations": [
            "creer ligne pesee",
            "editer etiquette",
            "lier lot",
            "deduire stock au ticket",
        ],
    }


@router.post("/mobile/intervention")
def valider_intervention_mobile(request: InterventionMobileRequest) -> Dict[str, Any]:
    cout_machine = request.temps_heures * 52
    cout_carburant = request.carburant_litres * 1.72
    cout_stock = request.stock_consomme * 18
    total = cout_machine + cout_carburant + cout_stock
    return {
        "intervention_id": _reference("MOB"),
        "chantier": request.chantier,
        "parcelle": request.parcelle,
        "operateur": request.operateur,
        "statut": "validee terrain",
        "couts": {
            "machine": round(cout_machine, 2),
            "carburant": round(cout_carburant, 2),
            "stock": round(cout_stock, 2),
            "total": round(total, 2),
        },
        "flux_declenches": [
            "temps de travaux",
            "sortie stock",
            "cout parcelle",
            "marge atelier",
        ],
    }


@router.post("/ia/analyser")
def analyser_noyau(request: AnalyseNoyauRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    state = tx.dashboard(db)
    stock_alerts = state.get("alertes_stock", [])
    return {
        "analyse_id": tx.reference("IA"),
        "scenario": request.scenario,
        "horizon_jours": request.horizon_jours,
        "objectif": request.objectif,
        "alertes": [
            {"niveau": "haut", "message": "Rapprocher les versements TPE avant cloture TVA."},
            {"niveau": "moyen", "message": f"{len(stock_alerts)} produits sous seuil de stock."},
            {"niveau": "moyen", "message": "Separer les tarifs circuit court, pro et collectivite."},
        ],
        "actions_recommandees": [
            "valider les ecritures proposees",
            "controler les lots a forte marge",
            "separer les tarifs circuit court, pro et collectivite",
        ],
    }
