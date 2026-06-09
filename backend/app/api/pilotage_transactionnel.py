"""
Noyau transactionnel de preparation pour caisse et synchronisations.

Ces endpoints donnent aux ecrans une API concrete avant le raccordement aux
tables metier finales : tickets, mouvements de stock, ecritures comptables,
connecteurs banque/TPE/IoT/balance et controles de rapprochement.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(prefix="/pilotage", tags=["pilotage-transactionnel"])


class LigneTicketCaisse(BaseModel):
    code: str
    nom: str
    quantite: float = Field(..., gt=0)
    prix_unitaire: float = Field(..., ge=0)
    tva: float = Field(5.5, ge=0)


class TicketCaisseRequest(BaseModel):
    client: str = "Client comptoir"
    moyen_paiement: str = "card"
    remise_percent: float = Field(0, ge=0, le=100)
    lignes: List[LigneTicketCaisse]


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
def get_caisse_connectee() -> Dict[str, Any]:
    return {
        "objectif": "Encaisser ventes boutique, marches, paniers, animaux ou produits transformes.",
        "session": {
            "statut": "ouverte",
            "journal": "Boutique ferme",
            "fond_initial": 250,
            "tickets": 38,
            "ca_jour": 1284,
            "panier_moyen": 33.8,
            "ecart_caisse": 0,
        },
        "clients": ["Client comptoir", "Restaurant Les Tilleuls", "AMAP village", "Client pro facture"],
        "fonctionnalites": [
            "tickets et factures simplifiees",
            "especes, carte bancaire, virement, cheque et avoirs",
            "cloture journaliere avec ecarts de caisse",
            "ventilation automatique vers ventes, TVA et comptabilite",
            "mode hors-ligne pour marches et batiments agricoles",
        ],
        "produits_exemple": PRODUITS_CAISSE,
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


@router.post("/caisse/tickets")
def creer_ticket_caisse(request: TicketCaisseRequest) -> Dict[str, Any]:
    if not request.lignes:
        raise HTTPException(status_code=400, detail="Le ticket doit contenir au moins une ligne")

    sous_total = sum(ligne.prix_unitaire * ligne.quantite for ligne in request.lignes)
    remise = sous_total * (request.remise_percent / 100)
    total = max(sous_total - remise, 0)
    tva = sum(
        ((ligne.prix_unitaire * ligne.quantite) * (1 - request.remise_percent / 100) * ligne.tva) / (100 + ligne.tva)
        for ligne in request.lignes
    )
    couts = {produit["code"]: produit["cout_revient"] for produit in PRODUITS_CAISSE}
    cout_revient = sum(couts.get(ligne.code, ligne.prix_unitaire * 0.55) * ligne.quantite for ligne in request.lignes)
    mouvements_stock = [
        {
            "produit": ligne.code,
            "libelle": ligne.nom,
            "quantite": -ligne.quantite,
            "motif": "vente caisse",
        }
        for ligne in request.lignes
    ]
    ticket_id = f"CAI-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid4())[:8].upper()}"
    paiement = next(
        (moyen for moyen in MOYENS_PAIEMENT_CAISSE if moyen["code"] == request.moyen_paiement),
        MOYENS_PAIEMENT_CAISSE[0],
    )

    return {
        "ticket_id": ticket_id,
        "statut": "valide",
        "client": request.client,
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
        "ecritures": [
            {"journal": "VENTE", "libelle": f"Ticket {ticket_id}", "debit": 0, "credit": round(total - tva, 2)},
            {"journal": "TVA", "libelle": f"TVA ticket {ticket_id}", "debit": 0, "credit": round(tva, 2)},
            {"journal": "CAISSE", "libelle": f"Paiement {paiement['label']} {ticket_id}", "debit": round(total, 2), "credit": 0},
            {"journal": "STOCK", "libelle": f"Sortie stock {ticket_id}", "debit": round(cout_revient, 2), "credit": 0},
        ],
        "prochaines_actions": ["imprimer ticket", "actualiser stock", "preparer rapprochement paiement"],
    }


@router.post("/caisse/cloturer")
def cloturer_caisse(request: ClotureCaisseRequest) -> Dict[str, Any]:
    fond_theorique = 250 + 1284
    ecart = request.fond_reel - fond_theorique
    return {
        "statut": "cloture_preparee",
        "journal": "Boutique ferme",
        "fond_theorique": fond_theorique,
        "fond_reel": request.fond_reel,
        "ecart": round(ecart, 2),
        "commentaire": request.commentaire,
        "actions": ["verrouiller tickets", "generer journal caisse", "preparer rapprochement banque"],
        "ecritures": [
            {"journal": "CAISSE", "libelle": "Cloture journaliere", "debit": round(request.fond_reel, 2), "credit": 0},
            {"journal": "ECART", "libelle": "Ecart de caisse", "debit": abs(round(ecart, 2)) if ecart < 0 else 0, "credit": round(ecart, 2) if ecart > 0 else 0},
        ],
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
