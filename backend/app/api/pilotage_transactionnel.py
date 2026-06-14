"""
Noyau transactionnel de preparation pour caisse et synchronisations.

Ces endpoints donnent aux ecrans une API concrete avant le raccordement aux
tables metier finales : tickets, mouvements de stock, ecritures comptables,
connecteurs banque/TPE/IoT/balance et controles de rapprochement.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.transactionnel import LigneTicketAgri, TicketCaisseAgri
from ..services import transactionnel as tx


router = APIRouter(prefix="/pilotage", tags=["pilotage-transactionnel"])


class LigneTicketCaisse(BaseModel):
    code: str
    nom: str
    quantite: float = Field(..., gt=0)
    prix_unitaire: float = Field(..., ge=0)
    tva: float = Field(5.5, ge=0)


class TicketCaisseRequest(BaseModel):
    client_id: Optional[int] = None
    client: str = "Client comptoir"
    moyen_paiement: str = "card"
    remise_percent: float = Field(0, ge=0, le=100)
    lignes: List[LigneTicketCaisse]


class ClientCaisseRequest(BaseModel):
    nom: str
    segment: str = "circuit-court"
    canal: str = "boutique ferme"
    email: Optional[str] = None
    telephone: Optional[str] = None
    delai_paiement: int = Field(0, ge=0)
    remise_reference: float = Field(0, ge=0)
    volume_annuel: float = Field(0, ge=0)


class ClotureCaisseRequest(BaseModel):
    fond_reel: float = Field(0, ge=0)
    commentaire: Optional[str] = None


class SyncConnectorRequest(BaseModel):
    code: str
    frequence_minutes: int = Field(15, ge=5)
    mode: str = "Simulation"
    journal_automatique: bool = True
    validation_humaine: bool = True
    parametres: Dict[str, str] = Field(default_factory=dict)


PRODUITS_CAISSE: List[Dict[str, Any]] = [
    {"code": "panier-legumes", "nom": "Panier legumes", "categorie": "Maraichage", "prix": 22, "tva": 5.5, "stock": 42, "unite": "piece", "cout_revient": 12.2},
    {"code": "oeufs-x12", "nom": "Oeufs plein air x12", "categorie": "Elevage", "prix": 4.8, "tva": 5.5, "stock": 68, "unite": "boite", "cout_revient": 2.9},
    {"code": "farine-1kg", "nom": "Farine ferme 1kg", "categorie": "Transformation", "prix": 3.4, "tva": 5.5, "stock": 35, "unite": "sac", "cout_revient": 1.75},
    {"code": "colis-boeuf", "nom": "Colis boeuf 5kg", "categorie": "Elevage", "prix": 78, "tva": 5.5, "stock": 9, "unite": "colis", "cout_revient": 48},
    {"code": "jus-pomme", "nom": "Jus de pomme 1L", "categorie": "Verger", "prix": 3.9, "tva": 5.5, "stock": 120, "unite": "bouteille", "cout_revient": 1.6},
    {"code": "miel-500", "nom": "Miel 500g", "categorie": "Ruche", "prix": 8.5, "tva": 5.5, "stock": 27, "unite": "pot", "cout_revient": 3.8},
    {"code": "plants-tomate", "nom": "Plants tomate", "categorie": "Plants", "prix": 2.2, "tva": 10, "stock": 180, "unite": "plant", "cout_revient": 0.9},
    {"code": "foin-botte", "nom": "Foin petite botte", "categorie": "Fourrage", "prix": 5.5, "tva": 10, "stock": 54, "unite": "botte", "cout_revient": 2.4},
]


MOYENS_PAIEMENT_CAISSE: List[Dict[str, Any]] = [
    {"code": "card", "label": "TPE", "compte_attente": "5112"},
    {"code": "cash", "label": "Especes", "compte_attente": "531"},
    {"code": "transfer", "label": "Virement", "compte_attente": "5111"},
]


CONNECTEURS_SYNC: List[Dict[str, Any]] = [
    {
        "code": "bank",
        "nom": "Banque",
        "statut": "a connecter",
        "fraicheur": "Aucun flux",
        "description": "Import CSV/OFX puis connecteur bancaire pour rapprochement facture, caisse et compta.",
        "cible": "rapprochement facture / paiement",
        "champs": ["IBAN", "Journal banque", "Regle de categorisation", "Seuil alerte solde"],
    },
    {
        "code": "tpe",
        "nom": "TPE",
        "statut": "pret a parametrer",
        "fraicheur": "Terminal non associe",
        "description": "Associer les paiements carte a la caisse, aux tickets et au compte d attente.",
        "cible": "paiements carte vers caisse",
        "champs": ["Terminal", "Compte encaissement", "Frais carte", "Delai versement"],
    },
    {
        "code": "iot",
        "nom": "IoT ferme",
        "statut": "a connecter",
        "fraicheur": "Capteurs muets",
        "description": "Silos, temperature, irrigation, carburant, compteur eau, energie et alertes terrain.",
        "cible": "capteurs silo, eau, energie, carburant",
        "champs": ["Broker MQTT", "Site", "Type capteur", "Seuil alerte"],
    },
    {
        "code": "scale",
        "nom": "Balance",
        "statut": "mapping requis",
        "fraicheur": "Dernier test manuel",
        "description": "Poids colis, animaux, recoltes et lots pour alimenter ventes, stock et rendement.",
        "cible": "poids vers stocks, ventes et rendements",
        "champs": ["Port / API", "Unite", "Produit lie", "Tolerance"],
    },
    {
        "code": "weather",
        "nom": "Meteo",
        "statut": "optionnel",
        "fraicheur": "Non synchronise",
        "description": "Fenetre d intervention, pluie, temperature, vent, irrigation et alertes parcelle.",
        "cible": "fenetres d'intervention et alertes",
        "champs": ["API provider", "Stations", "Parcelles", "Frequence"],
    },
    {
        "code": "logistics",
        "nom": "Logistique",
        "statut": "a cadrer",
        "fraicheur": "Aucun flux",
        "description": "Livraisons paniers, transport animaux, expedition colis et tournees.",
        "cible": "tournees, transport et livraisons",
        "champs": ["Transporteur", "Tournee", "Client", "Statut livraison"],
    },
]


FLUX_SYNC: List[Dict[str, str]] = [
    {"source": "Caisse", "destination": "Comptabilite", "regle": "ticket valide -> ecriture vente + TVA", "statut": "pret"},
    {"source": "TPE", "destination": "Banque", "regle": "paiement carte -> attente versement -> rapprochement", "statut": "a parametrer"},
    {"source": "Balance", "destination": "Stocks", "regle": "poids valide -> mouvement lot + prix de revient", "statut": "mapping requis"},
    {"source": "IoT", "destination": "Alertes", "regle": "seuil capteur -> notification + tache", "statut": "a connecter"},
    {"source": "Banque", "destination": "Achats", "regle": "debit fournisseur -> facture + stock + cout atelier", "statut": "a connecter"},
]


@router.get("/caisse")
def get_caisse_connectee(db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    tickets = db.query(TicketCaisseAgri).order_by(TicketCaisseAgri.created_at.desc()).limit(50).all()
    products = db.query(tx.ProduitAgri).filter(tx.ProduitAgri.actif.is_(True)).order_by(tx.ProduitAgri.famille, tx.ProduitAgri.nom).all()
    clients = db.query(tx.TiersAgri).filter(tx.TiersAgri.type_tiers == "client", tx.TiersAgri.actif.is_(True)).order_by(tx.TiersAgri.nom).all()
    revenue = sum(ticket.total_ttc or 0 for ticket in tickets)
    basket = revenue / len(tickets) if tickets else 0
    return {
        "objectif": "Encaisser ventes boutique, marches, paniers, animaux ou produits transformes.",
        "session": {
            "statut": "ouverte",
            "journal": "Boutique ferme",
            "fond_initial": 250,
            "tickets": len(tickets),
            "ca_jour": round(revenue, 2),
            "panier_moyen": round(basket, 2),
            "ecart_caisse": 0,
        },
        "clients": [tx.tier_to_dict(client) for client in clients],
        "fonctionnalites": [
            "tickets et factures simplifiees",
            "especes, carte bancaire, virement, cheque et avoirs",
            "cloture journaliere avec ecarts de caisse",
            "ventilation automatique vers ventes, TVA et comptabilite",
            "mode hors-ligne pour marches et batiments agricoles",
        ],
        "produits_exemple": [tx.product_to_dict(product) for product in products],
        "moyens_paiement": MOYENS_PAIEMENT_CAISSE,
        "ecritures_automatiques": [
            "vente -> produit + TVA collectee",
            "paiement TPE -> compte attente carte",
            "cloture caisse -> journal de caisse",
            "sortie stock -> mouvement lot + cout de revient",
        ],
        "controles": ["fond de caisse", "total par moyen de paiement", "ecarts", "journal de caisse"],
        "workflow": "vente-directe-caisse-compta-stock",
    }


@router.post("/caisse/clients")
def creer_client_caisse(request: ClientCaisseRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    existing = db.query(tx.TiersAgri).filter(tx.TiersAgri.nom == request.nom).first()
    if existing:
        existing.segment = request.segment
        existing.canal = request.canal
        existing.email = request.email
        existing.telephone = request.telephone
        existing.delai_paiement = request.delai_paiement
        existing.remise_reference = request.remise_reference
        existing.volume_annuel = request.volume_annuel
        status = "client mis a jour"
        tier = existing
    else:
        tier = tx.find_or_create_tier(db, request.nom, request.segment)
        tier.canal = request.canal
        tier.email = request.email
        tier.telephone = request.telephone
        tier.delai_paiement = request.delai_paiement
        tier.remise_reference = request.remise_reference
        tier.volume_annuel = request.volume_annuel
        status = "client cree"

    tx.audit(db, "crm", tier.code, "client caisse", {"segment": tier.segment, "canal": tier.canal})
    db.commit()
    db.refresh(tier)
    return {"statut": status, "client": tx.tier_to_dict(tier)}


@router.post("/caisse/tickets")
def creer_ticket_caisse(request: TicketCaisseRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    if not request.lignes:
        raise HTTPException(status_code=400, detail="Le ticket doit contenir au moins une ligne")

    tx.seed_demo(db)
    sous_total = sum(ligne.prix_unitaire * ligne.quantite for ligne in request.lignes)
    remise = sous_total * (request.remise_percent / 100)
    total = max(sous_total - remise, 0)
    tva = sum(
        ((ligne.prix_unitaire * ligne.quantite) * (1 - request.remise_percent / 100) * ligne.tva) / (100 + ligne.tva)
        for ligne in request.lignes
    )
    ticket_id = tx.reference("CAI")
    paiement = next(
        (moyen for moyen in MOYENS_PAIEMENT_CAISSE if moyen["code"] == request.moyen_paiement),
        MOYENS_PAIEMENT_CAISSE[0],
    )
    if request.client_id:
        client = db.query(tx.TiersAgri).filter(tx.TiersAgri.id == request.client_id, tx.TiersAgri.type_tiers == "client").first()
        if not client:
            raise HTTPException(status_code=404, detail="Client introuvable")
    else:
        client = tx.find_or_create_tier(db, request.client, "circuit-court")
    ticket = TicketCaisseAgri(
        reference=ticket_id,
        client=client,
        client_nom=client.nom,
        segment=client.segment,
        moyen_paiement=request.moyen_paiement,
        remise_percent=request.remise_percent,
        total_ht=round(total - tva, 2),
        total_tva=round(tva, 2),
        total_ttc=round(total, 2),
    )
    db.add(ticket)
    db.flush()

    cout_revient = 0.0
    mouvements_stock = []
    for line in request.lignes:
        product = db.query(tx.ProduitAgri).filter(tx.ProduitAgri.code == line.code).first()
        if not product:
            product = tx.ProduitAgri(
                code=line.code,
                nom=line.nom,
                famille="Produit",
                unite="piece",
                prix_vente=line.prix_unitaire,
                tva=line.tva,
                cout_revient=line.prix_unitaire * 0.55,
                stock=0,
            )
            db.add(product)
            db.flush()

        line_cost = product.cout_revient * line.quantite
        line_total = line.prix_unitaire * line.quantite * (1 - request.remise_percent / 100)
        cout_revient += line_cost
        db.add(
            LigneTicketAgri(
                ticket=ticket,
                produit=product,
                produit_code=product.code,
                libelle=line.nom,
                lot=product.lot_courant,
                quantite=line.quantite,
                unite=product.unite,
                prix_unitaire=line.prix_unitaire,
                tva=line.tva,
                total_ttc=round(line_total, 2),
                marge=round(line_total - line_cost, 2),
                source="caisse",
            )
        )
        movement = tx.create_stock_movement(db, product, "vente", line.quantite, product.lot_courant, "ticket caisse", "Boutique ferme", ticket_id)
        mouvements_stock.append(tx.movement_to_dict(movement))

    ticket.cout_revient = round(cout_revient, 2)
    ticket.marge = round(total - cout_revient, 2)
    entries = [
        tx.create_entry(db, "VENTE", "707", f"Ticket {ticket_id}", 0, total - tva, "ticket", ticket_id),
        tx.create_entry(db, "TVA", "4457", f"TVA ticket {ticket_id}", 0, tva, "ticket", ticket_id),
        tx.create_entry(db, "CAISSE", paiement["compte_attente"], f"Paiement {paiement['label']} {ticket_id}", total, 0, "ticket", ticket_id),
        tx.create_entry(db, "STOCK", "603", f"Sortie stock {ticket_id}", cout_revient, 0, "ticket", ticket_id),
        tx.create_entry(db, "STOCK", "3", f"Credit stock {ticket_id}", 0, cout_revient, "ticket", ticket_id),
    ]
    tx.audit(db, "caisse", ticket_id, "ticket valide", {"client": client.nom, "client_id": client.id, "total": total})
    db.commit()
    db.refresh(ticket)

    return {
        "ticket_id": ticket_id,
        "statut": "valide",
        "client": client.nom,
        "client_id": client.id,
        "segment": client.segment,
        "moyen_paiement": paiement,
        "totaux": {
            "sous_total": round(sous_total, 2),
            "remise": round(remise, 2),
            "tva": round(tva, 2),
            "total": round(total, 2),
            "cout_revient": round(cout_revient, 2),
            "marge": round(total - cout_revient, 2),
        },
        "mouvements_stock": mouvements_stock,
        "ecritures": tx.entries_to_dict(entries),
        "prochaines_actions": ["imprimer ticket", "actualiser stock", "preparer rapprochement paiement"],
    }


@router.post("/caisse/cloturer")
def cloturer_caisse(request: ClotureCaisseRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    tickets = db.query(TicketCaisseAgri).all()
    ca = sum(ticket.total_ttc or 0 for ticket in tickets)
    fond_theorique = 250 + ca
    ecart = request.fond_reel - fond_theorique
    closure_ref = tx.reference("CLOT")
    entries = [
        tx.create_entry(db, "CAISSE", "531", "Cloture journaliere", request.fond_reel, 0, "cloture", closure_ref),
        tx.create_entry(db, "ECART", "658", "Ecart de caisse", abs(ecart) if ecart < 0 else 0, ecart if ecart > 0 else 0, "cloture", closure_ref),
    ]
    tx.audit(db, "caisse", closure_ref, "cloture session", {"ecart": ecart, "tickets": len(tickets)})
    db.commit()
    return {
        "statut": "cloture_preparee",
        "journal": "Boutique ferme",
        "fond_theorique": fond_theorique,
        "fond_reel": request.fond_reel,
        "ecart": round(ecart, 2),
        "commentaire": request.commentaire,
        "actions": ["verrouiller tickets", "generer journal caisse", "preparer rapprochement banque"],
        "ecritures": tx.entries_to_dict(entries),
    }


@router.get("/sync")
def get_sync_connectee() -> Dict[str, Any]:
    return {
        "connecteurs": CONNECTEURS_SYNC,
        "flux": FLUX_SYNC,
        "garde_fous": [
            "mode simulation",
            "validation humaine",
            "journal d'audit",
            "rejeu d'un flux",
            "controle doublons",
        ],
        "priorites": ["banque", "TPE", "balance", "IoT", "meteo"],
    }


@router.post("/sync/connecter")
def connecter_sync(request: SyncConnectorRequest) -> Dict[str, Any]:
    connecteur = next((item for item in CONNECTEURS_SYNC if item["code"] == request.code), None)
    if not connecteur:
        raise HTTPException(status_code=404, detail="Connecteur introuvable")

    champs_renseignes = [cle for cle, valeur in request.parametres.items() if valeur]
    minimum = max(len(connecteur["champs"]) - 1, 1)
    statut = "pret" if len(champs_renseignes) >= minimum else "configuration incomplete"

    return {
        "connecteur": connecteur["nom"],
        "code": request.code,
        "statut": statut,
        "frequence_minutes": request.frequence_minutes,
        "mode": request.mode,
        "journal_automatique": request.journal_automatique,
        "validation_humaine": request.validation_humaine,
        "champs_renseignes": champs_renseignes,
        "flux_cible": connecteur["cible"],
        "prochaines_actions": ["tester le flux", "controler les doublons", "valider le premier import"],
    }
