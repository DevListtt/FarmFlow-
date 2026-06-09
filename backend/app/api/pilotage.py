"""
API de pilotage FarmFlow.

Ce module pose le socle transverse d'un ERP agricole modulaire :
applications metier, workflows, roles, pilotage economique, caisse,
banque, IA preparatoire et exports reglementaires.
"""
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(prefix="/pilotage", tags=["pilotage"])


class ScenarioMargeRequest(BaseModel):
    """Entrees minimales pour simuler une marge brute agricole."""

    libelle: str = Field(..., description="Nom du scenario ou de l'atelier")
    surface_ha: float = Field(..., gt=0, description="Surface concernee en hectares")
    rendement: float = Field(..., ge=0, description="Rendement par hectare")
    prix_unitaire: float = Field(..., ge=0, description="Prix de vente par unite produite")
    aides: float = Field(0, ge=0, description="Aides ou primes rattachees au scenario")
    semences: float = Field(0, ge=0)
    engrais: float = Field(0, ge=0)
    phytos: float = Field(0, ge=0)
    alimentation: float = Field(0, ge=0)
    carburant: float = Field(0, ge=0)
    main_oeuvre: float = Field(0, ge=0)
    autres_charges_operationnelles: float = Field(0, ge=0)


class TransactionBancaire(BaseModel):
    """Transaction bancaire normalisee pour preparer la future synchro bancaire."""

    date_operation: date
    libelle: str
    montant: float
    contrepartie: Optional[str] = None
    categorie: Optional[str] = None


class AnalyseFluxRequest(BaseModel):
    """Lot de transactions a analyser avant integration bancaire automatisee."""

    transactions: List[TransactionBancaire]
    solde_initial: float = 0


class ConfigurationExploitationRequest(BaseModel):
    """Profil simple d'exploitation pour recommander les premiers modules."""

    nom: str = Field(..., description="Nom de l'exploitation")
    type_exploitation: str = Field("mixte", description="cereales, elevage, maraichage, viticulture, mixte...")
    surface_ha: Optional[float] = Field(None, ge=0)
    productions: List[str] = Field(default_factory=list)
    modules_souhaites: List[str] = Field(default_factory=list)


def _app(
    code: str,
    nom: str,
    categorie: str,
    route: str,
    statut: str,
    priorite: str,
    description: str,
    fonctionnalites: List[str],
    premieres_actions: List[str],
    endpoints: List[str],
) -> Dict[str, Any]:
    return {
        "code": code,
        "nom": nom,
        "categorie": categorie,
        "route": route,
        "statut": statut,
        "priorite": priorite,
        "description": description,
        "fonctionnalites": fonctionnalites,
        "premieres_actions": premieres_actions,
        "endpoints": endpoints,
    }


AGRI_APPS: List[Dict[str, Any]] = [
    _app("pilotage", "Pilotage ferme", "socle", "/", "socle pret", "haute", "Cockpit dirigeant pour suivre production, marges, tresorerie, alertes et obligations.", ["tableau de bord", "alertes", "objectifs", "vues par atelier"], ["Configurer les ateliers", "Choisir les modules actifs", "Definir les roles"], ["GET /pilotage/dashboard", "GET /pilotage/apps", "GET /pilotage/workflows"]),
    _app("parcelles", "Parcelles", "production", "/parcelles", "socle disponible", "haute", "Cadastre agricole, ilots, cultures, sols, surfaces, rotations et cartographie.", ["fiche parcelle", "rotation", "sols", "historique cultural"], ["Importer les ilots", "Renseigner surfaces", "Associer cultures en cours"], ["GET /parcelles/", "POST /parcelles/", "GET /parcelles/{id}/cultures"]),
    _app("cultures-interventions", "Cultures & interventions", "production", "/chantiers", "a enrichir", "haute", "Itineraires techniques, interventions, temps de travaux, intrants, IFT et couts terrain.", ["planning cultural", "interventions", "IFT", "temps et couts"], ["Creer les itineraires", "Planifier les interventions", "Lier stocks et materiel"], ["GET /chantiers/", "GET /parcelles/{id}/interventions", "GET /export/parcelles/csv"]),
    _app("elevage", "Elevage", "production", "/animaux", "socle disponible", "haute", "Troupeaux, identification, reproduction, sanitaire, lots, mouvements et performances.", ["animaux", "lots", "sanitaire", "reproduction", "RFID"], ["Importer les animaux", "Creer les lots", "Planifier les suivis sanitaires"], ["GET /animaux/", "POST /animaux/", "GET /animaux/{id}/sante"]),
    _app("stocks", "Stocks", "operations", "/stocks", "socle disponible", "haute", "Intrants, aliments, produits finis, lots, seuils, mouvements et valorisation.", ["seuils", "lots", "mouvements", "valorisation", "liaison interventions"], ["Creer les categories", "Saisir stocks initiaux", "Definir les seuils d'alerte"], ["GET /stocks", "GET /stocks/categories", "GET /export/stocks/csv"]),
    _app("achats", "Achats fournisseurs", "commerce", "/apps/achats", "a construire", "haute", "Demandes de prix, commandes, receptions, factures fournisseurs et couts par atelier.", ["devis", "commandes", "receptions", "factures", "couts imputes"], ["Structurer fournisseurs", "Creer modeles de commande", "Lier factures et stocks"], ["POST /achats/commandes", "GET /achats/fournisseurs", "POST /comptabilite/ecritures"]),
    _app("ventes-caisse", "Ventes & caisse", "commerce", "/ventes", "socle disponible", "haute", "Devis, factures, ventes directes, tickets, paniers, marches et clotures de caisse.", ["devis", "factures", "tickets", "paiements", "cloture journaliere"], ["Configurer produits", "Creer moyens de paiement", "Activer journal de caisse"], ["GET /ventes", "GET /pilotage/caisse", "GET /export/ventes/csv"]),
    _app("crm", "CRM agricole", "commerce", "/crm", "socle disponible", "moyenne", "Clients, prospects, distributeurs, circuits courts, contrats et historique commercial.", ["contacts", "segments", "opportunites", "contrats", "relances"], ["Importer clients", "Segmenter circuits", "Creer pipelines de vente"], ["GET /crm/clients", "POST /crm/prospects", "GET /crm/opportunites"]),
    _app("comptabilite", "Comptabilite", "finance", "/comptabilite", "socle disponible", "haute", "Journaux, plan comptable agricole, ecritures, TVA, immobilisations et clotures.", ["journaux", "ecritures", "TVA", "immobilisations", "cloture"], ["Definir exercice", "Configurer journaux", "Importer plan comptable"], ["GET /comptabilite", "POST /comptabilite/ecritures", "GET /pilotage/exports/reglementaires"]),
    _app("banque-tresorerie", "Banque & tresorerie", "finance", "/apps/banque-tresorerie", "connecteur a brancher", "haute", "Synchronisation bancaire, rapprochement, prevision de tresorerie et alertes de flux.", ["synchro bancaire", "rapprochement", "categorisation", "prevision", "alertes"], ["Choisir connecteur", "Importer historique", "Definir seuils de tresorerie"], ["GET /pilotage/banque", "POST /pilotage/banque/analyser-flux"]),
    _app("marges", "Marges & prix de revient", "finance", "/apps/marges", "simulateur pret", "haute", "Marge brute par culture, lot animal, produit, canal, seuils et scenarios de prix.", ["marge brute", "prix de revient", "budget/reel", "seuil", "scenario"], ["Definir ateliers", "Imputer charges", "Comparer budget et realise"], ["GET /pilotage/marges", "POST /pilotage/marges/simuler"]),
    _app("flotte-materiel", "Flotte & materiel", "operations", "/flotte", "socle disponible", "moyenne", "Tracteurs, outils, entretiens, carburant, cout horaire et disponibilite chantier.", ["vehicules", "entretiens", "carburant", "cout horaire", "planning"], ["Inventorier materiel", "Programmer entretiens", "Calculer couts horaires"], ["GET /flotte", "POST /flotte/entretiens", "GET /chantiers"]),
    _app("rh", "RH & planning", "operations", "/rh", "socle disponible", "moyenne", "Saisonniers, permanents, temps de travaux, competences, absences et paie preparatoire.", ["employes", "planning", "temps", "absences", "paie"], ["Creer equipes", "Declarer competences", "Lier temps aux chantiers"], ["GET /rh/employes", "GET /rh/conges", "POST /rh/planning"]),
    _app("calendrier", "Calendrier agricole", "operations", "/calendrier", "socle disponible", "moyenne", "Evenements, rappels, fenetres meteo, taches recurrentes et echeances reglementaires.", ["agenda", "rappels", "echeances", "meteo", "recurrence"], ["Importer echeances", "Planifier cultures", "Activer rappels"], ["GET /calendrier", "POST /calendrier/evenements"]),
    _app("documents-reglementaire", "Documents & reglementaire", "conformite", "/apps/documents-reglementaire", "exports prets", "haute", "FEC, journaux, grand livre, balance, TVA, tracabilite technique et pieces justificatives.", ["FEC", "journaux", "grand livre", "balance", "tracabilite", "audit"], ["Parametrer exercice", "Centraliser justificatifs", "Tester exports"], ["GET /pilotage/exports/reglementaires", "GET /export/comptabilite/csv"]),
    _app("ia-agricole", "IA agricole", "plateforme", "/ia", "connecteur a brancher", "moyenne", "Assistant contextualise, OCR factures, anomalies, recommandations et syntheses de ferme.", ["assistant", "OCR", "anomalies", "recommandations", "syntheses"], ["Choisir modele", "Definir donnees autorisees", "Activer journal d'audit"], ["GET /pilotage/ia/preparation", "POST /ia/analyser"]),
    _app("communication", "Communication", "plateforme", "/communication", "socle disponible", "basse", "Email, SMS, WhatsApp, campagnes clients, alertes internes et notifications equipe.", ["campagnes", "notifications", "SMS", "email", "WhatsApp"], ["Configurer canaux", "Creer modeles", "Segmenter destinataires"], ["GET /communication/campagnes", "POST /communication/envoyer"]),
    _app("integrations", "Integrations & automatisations", "plateforme", "/apps/integrations", "socle zapier", "moyenne", "Zapier, API meteo, paiement, code-barres, etiquettes, IoT et connecteurs externes.", ["Zapier", "meteo", "paiement", "code-barres", "IoT", "webhooks"], ["Lister connecteurs", "Securiser webhooks", "Prioriser automatisations"], ["GET /zapier/triggers", "POST /zapier/webhook"]),
]


AGRI_WORKFLOWS: List[Dict[str, Any]] = [
    {"code": "intervention-culture-stock-marge", "titre": "Intervention terrain -> stock -> marge", "modules": ["parcelles", "cultures-interventions", "stocks", "flotte-materiel", "marges"], "description": "Une intervention consomme intrants, materiel et temps, puis alimente le cout de revient.", "etapes": ["Planifier", "Affecter equipe et materiel", "Sortir intrants", "Valider terrain", "Actualiser marge"]},
    {"code": "vente-directe-caisse-compta-stock", "titre": "Vente directe -> caisse -> compta -> stock", "modules": ["ventes-caisse", "stocks", "crm", "comptabilite", "banque-tresorerie"], "description": "Une vente cree ticket, paiement, mouvement de stock et ecriture comptable.", "etapes": ["Composer panier", "Encaisser", "Cloturer caisse", "Generer ecritures", "Rapprocher banque"]},
    {"code": "achat-intrant-banque-stock", "titre": "Achat intrant -> reception -> banque -> cout atelier", "modules": ["achats", "stocks", "comptabilite", "banque-tresorerie", "marges"], "description": "Les achats d'intrants alimentent les stocks, les factures fournisseurs et les couts des ateliers.", "etapes": ["Demande de prix", "Commande", "Reception", "Facture", "Paiement", "Imputation"]},
    {"code": "elevage-sante-lot-marge", "titre": "Elevage -> sanitaire -> lot -> marge", "modules": ["elevage", "stocks", "calendrier", "marges", "documents-reglementaire"], "description": "Les soins, aliments, mouvements et ventes d'animaux structurent la marge par lot.", "etapes": ["Identifier", "Planifier soin", "Consommer stock", "Suivre lot", "Calculer marge"]},
    {"code": "cloture-reglementaire", "titre": "Cloture -> exports -> expert-comptable", "modules": ["comptabilite", "documents-reglementaire", "banque-tresorerie", "pilotage"], "description": "La cloture consolide pieces, journaux, TVA, FEC, balances et anomalies avant transmission.", "etapes": ["Controler pieces", "Rapprocher banque", "Calculer TVA", "Exporter", "Archiver"]},
    {"code": "assistant-ia-anomalie", "titre": "IA -> detection -> validation humaine", "modules": ["ia-agricole", "pilotage", "banque-tresorerie", "stocks", "marges"], "description": "L'assistant analyse factures, flux et ecarts, puis propose une action validee par l'utilisateur.", "etapes": ["Collecter contexte", "Detecter anomalie", "Expliquer", "Proposer", "Valider"]},
]


AGRI_ROLES: List[Dict[str, Any]] = [
    {"code": "exploitant", "nom": "Exploitant / dirigeant", "niveau": "admin", "acces": ["pilotage", "finance", "production", "configuration", "exports"], "objectifs": ["decider", "controler marges", "suivre tresorerie", "valider clotures"]},
    {"code": "chef-culture", "nom": "Chef de culture", "niveau": "manager", "acces": ["parcelles", "cultures-interventions", "stocks", "flotte-materiel"], "objectifs": ["planifier interventions", "suivre IFT", "controler intrants"]},
    {"code": "responsable-elevage", "nom": "Responsable elevage", "niveau": "manager", "acces": ["elevage", "stocks", "calendrier", "documents-reglementaire"], "objectifs": ["suivre troupeau", "planifier sanitaire", "tracer lots"]},
    {"code": "commercial-caisse", "nom": "Commercial / caisse", "niveau": "operationnel", "acces": ["ventes-caisse", "crm", "stocks"], "objectifs": ["vendre", "encaisser", "relancer clients", "cloturer caisse"]},
    {"code": "comptable", "nom": "Comptable / expert-comptable", "niveau": "controle", "acces": ["comptabilite", "banque-tresorerie", "documents-reglementaire", "exports"], "objectifs": ["rapprocher", "declarer TVA", "exporter FEC", "controler pieces"]},
    {"code": "salarie-terrain", "nom": "Salarie terrain", "niveau": "saisie", "acces": ["cultures-interventions", "flotte-materiel", "calendrier"], "objectifs": ["voir taches", "saisir temps", "remonter observations"]},
]


ROADMAP: List[Dict[str, Any]] = [
    {"phase": "Socle ERP agricole", "statut": "en cours", "livrables": ["catalogue apps", "dashboard", "roles", "workflows", "configuration exploitation"]},
    {"phase": "Noyau transactionnel", "statut": "prochaine etape", "livrables": ["achats", "caisse complete", "banque", "mouvements stock", "ecritures automatiques"]},
    {"phase": "Agronomie et elevage avances", "statut": "a planifier", "livrables": ["cartographie", "IFT complet", "registre elevage", "couts par lot"]},
    {"phase": "Automatisations et IA", "statut": "a brancher", "livrables": ["OCR factures", "anomalies", "assistant ferme", "connecteurs bancaires", "meteo"]},
    {"phase": "Mobile terrain offline", "statut": "a cadrer", "livrables": ["mode hors ligne", "scan code-barres", "saisie intervention", "photos justificatives"]},
]


CATEGORY_LABELS: Dict[str, str] = {
    "socle": "Socle ERP",
    "production": "Production agricole",
    "operations": "Operations",
    "commerce": "Commerce",
    "finance": "Finance",
    "conformite": "Conformite",
    "plateforme": "Plateforme",
}


def _workspace_cards() -> List[Dict[str, Any]]:
    return [
        {"code": "production", "titre": "Production agricole", "description": "Parcelles, cultures, elevage, interventions, stocks, materiel et calendrier terrain.", "statut": "socle disponible"},
        {"code": "commerce", "titre": "Commerce & caisse", "description": "CRM, ventes, tickets, paniers, marches, fournisseurs, achats et factures.", "statut": "a renforcer"},
        {"code": "finance", "titre": "Finance & marges", "description": "Comptabilite, tresorerie, banque, couts de revient, marges et budget/reel.", "statut": "prepare"},
        {"code": "conformite", "titre": "Reglementaire", "description": "FEC, TVA, journaux, grand livre, balance, tracabilite et justificatifs.", "statut": "exports prepares"},
        {"code": "plateforme", "titre": "Plateforme & IA", "description": "Assistant, OCR, anomalies, webhooks, Zapier, meteo, paiement et IoT.", "statut": "connecteurs a brancher"},
    ]


def _group_apps_by_category() -> List[Dict[str, Any]]:
    grouped: Dict[str, List[Dict[str, Any]]] = {}
    for app in AGRI_APPS:
        grouped.setdefault(app["categorie"], []).append(app)

    return [
        {"code": code, "label": CATEGORY_LABELS.get(code, code), "modules": modules, "nombre_modules": len(modules)}
        for code, modules in grouped.items()
    ]


def _find_app(code: str) -> Dict[str, Any]:
    normalized = code.lower()
    for app in AGRI_APPS:
        if app["code"] == normalized:
            return app
    raise HTTPException(status_code=404, detail="Application FarmFlow introuvable")


def _categoriser_flux(transaction: TransactionBancaire) -> str:
    if transaction.categorie:
        return transaction.categorie

    libelle = transaction.libelle.lower()
    categories = [
        ("carburant", ["gazole", "gasoil", "carburant", "station"]),
        ("intrants", ["semence", "engrais", "phyto", "cooperative", "aliments"]),
        ("vente", ["client", "marche", "boutique", "facture vente", "paniers"]),
        ("materiel", ["tracteur", "piece", "atelier", "entretien", "reparation"]),
        ("banque", ["frais", "commission", "prelevement", "cotisation"]),
        ("charges sociales", ["msa", "urssaf", "paie", "salaire"]),
    ]
    for categorie, keywords in categories:
        if any(keyword in libelle for keyword in keywords):
            return categorie
    return "a categoriser"


def _apps_for_profile(request: ConfigurationExploitationRequest) -> List[Dict[str, Any]]:
    base_codes = {"pilotage", "comptabilite", "banque-tresorerie", "marges", "documents-reglementaire"}
    profile = request.type_exploitation.lower()
    productions = " ".join(request.productions).lower()

    if any(term in profile or term in productions for term in ["cereal", "culture", "viticulture", "maraichage"]):
        base_codes.update({"parcelles", "cultures-interventions", "stocks", "flotte-materiel", "calendrier"})
    if any(term in profile or term in productions for term in ["elevage", "bovin", "ovin", "caprin", "volaille", "lait"]):
        base_codes.update({"elevage", "stocks", "calendrier"})
    if any(term in profile or term in productions for term in ["vente", "boutique", "marche", "panier", "circuit court"]):
        base_codes.update({"ventes-caisse", "crm", "communication"})

    base_codes.update(code for code in request.modules_souhaites if code)
    return [app for app in AGRI_APPS if app["code"] in base_codes]


@router.get("/dashboard")
def get_dashboard() -> Dict[str, Any]:
    """Vue synthetique de l'environnement FarmFlow en ERP agricole."""
    high_priority_apps = [app for app in AGRI_APPS if app["priorite"] == "haute"]
    ready_apps = [app for app in AGRI_APPS if "pret" in app["statut"] or "disponible" in app["statut"]]

    return {
        "nom": "FarmFlow ERP agricole",
        "vision": "Un environnement modulaire specialise ferme, reunissant production, commerce, finance, conformite, IA et automatisations.",
        "mis_a_jour": datetime.utcnow().isoformat() + "Z",
        "kpis": [
            {"label": "Applications metier", "value": len(AGRI_APPS), "unit": "apps"},
            {"label": "Workflows transverses", "value": len(AGRI_WORKFLOWS), "unit": "flux"},
            {"label": "Modules prioritaires", "value": len(high_priority_apps), "unit": "modules"},
            {"label": "Socles disponibles", "value": len(ready_apps), "unit": "modules"},
        ],
        "espaces": _workspace_cards(),
        "categories": _group_apps_by_category(),
        "apps": AGRI_APPS,
        "workflows": AGRI_WORKFLOWS,
        "roles": AGRI_ROLES,
        "priorites_execution": [
            "stabiliser les donnees de base exploitation, parcelles, animaux, produits et tiers",
            "relier interventions, stocks, achats, ventes et comptabilite",
            "brancher banque, caisse et exports reglementaires",
            "ajouter les automatisations IA avec validation humaine",
        ],
        "alertes": [
            {"niveau": "warning", "titre": "Tresorerie a surveiller", "description": "Brancher le connecteur bancaire puis activer les seuils de solde et gros decaissements."},
            {"niveau": "info", "titre": "Modules achats a construire", "description": "Les commandes fournisseurs sont la prochaine brique pour relier couts, stocks et factures."},
            {"niveau": "success", "titre": "Socle pilotage pret", "description": "Le catalogue apps, les workflows et les roles donnent la colonne vertebrale ERP."},
        ],
    }


@router.get("/apps")
def get_apps() -> Dict[str, Any]:
    """Lister les applications FarmFlow comme un lanceur d'apps ERP."""
    return {"apps": AGRI_APPS, "categories": _group_apps_by_category(), "total": len(AGRI_APPS)}


@router.get("/apps/{code}")
def get_app(code: str) -> Dict[str, Any]:
    """Retourner le detail d'une application FarmFlow."""
    app = _find_app(code)
    workflows = [workflow for workflow in AGRI_WORKFLOWS if app["code"] in workflow["modules"]]
    roles = [role for role in AGRI_ROLES if app["categorie"] in role["acces"] or app["code"] in role["acces"]]
    return {"app": app, "workflows": workflows, "roles": roles}


@router.get("/workflows")
def get_workflows() -> Dict[str, Any]:
    """Lister les flux de travail transverses qui relient les modules."""
    return {"workflows": AGRI_WORKFLOWS, "total": len(AGRI_WORKFLOWS)}


@router.get("/roles")
def get_roles() -> Dict[str, Any]:
    """Lister les roles cibles et leurs perimetres fonctionnels."""
    return {"roles": AGRI_ROLES, "total": len(AGRI_ROLES)}


@router.get("/roadmap")
def get_roadmap() -> Dict[str, Any]:
    """Donner la feuille de route produit pour l'ERP agricole FarmFlow."""
    return {"roadmap": ROADMAP}


@router.post("/configurer-exploitation")
def configurer_exploitation(request: ConfigurationExploitationRequest) -> Dict[str, Any]:
    """Recommander les modules et premieres actions selon le profil d'exploitation."""
    apps = _apps_for_profile(request)
    return {
        "exploitation": request.nom,
        "type_exploitation": request.type_exploitation,
        "surface_ha": request.surface_ha,
        "modules_recommandes": apps,
        "premieres_actions": [{"module": app["nom"], "action": app["premieres_actions"][0]} for app in apps[:8]],
    }


@router.get("/operations")
def get_operations() -> Dict[str, Any]:
    """Donner une vue operationnelle ERP pour la journee."""
    return {
        "a_traiter": [
            {"module": "Stocks", "priorite": "haute", "titre": "Verifier seuils semences et carburant"},
            {"module": "Banque", "priorite": "haute", "titre": "Categoriser les flux non rapproches"},
            {"module": "Comptabilite", "priorite": "moyenne", "titre": "Completer pieces avant export TVA"},
            {"module": "Cultures", "priorite": "moyenne", "titre": "Valider interventions realisees"},
        ],
        "raccourcis": [
            {"label": "Nouvelle intervention", "route": "/chantiers"},
            {"label": "Encaisser une vente", "route": "/ventes"},
            {"label": "Analyser les flux", "route": "/apps/banque-tresorerie"},
            {"label": "Simuler une marge", "route": "/apps/marges"},
        ],
    }


@router.get("/caisse")
def get_caisse() -> Dict[str, Any]:
    """Preparation du module caisse pour vente directe et point de vente agricole."""
    return {
        "objectif": "Encaisser ventes boutique, marches, paniers, animaux ou produits transformes.",
        "fonctionnalites": [
            "tickets et factures simplifiees",
            "especes, carte bancaire, virement, cheque et avoirs",
            "cloture journaliere avec ecarts de caisse",
            "ventilation automatique vers ventes, TVA et comptabilite",
            "mode hors-ligne a prevoir pour marches et batiments agricoles",
        ],
        "controles": ["fond de caisse", "total par moyen de paiement", "ecarts", "journal de caisse"],
        "workflow": "vente-directe-caisse-compta-stock",
    }


@router.get("/marges")
def get_marges() -> Dict[str, Any]:
    """Vue economique preparatoire pour marges brutes et simulateurs."""
    return {
        "indicateurs": ["marge brute par culture, lot animal ou atelier", "prix de revient", "seuil de rentabilite", "ecart budget / realise", "sensibilite prix, rendement, intrants et main d'oeuvre"],
        "ateliers_exemple": [
            {"nom": "Ble tendre", "marge_brute_ha": 1180, "seuil_rentabilite": 182},
            {"nom": "Maraichage paniers", "marge_brute_ha": 8600, "seuil_rentabilite": 1.95},
            {"nom": "Bovin allaitant", "marge_brute_tete": 410, "seuil_rentabilite": 1450},
        ],
        "workflows": ["intervention-culture-stock-marge", "achat-intrant-banque-stock", "elevage-sante-lot-marge"],
    }


@router.post("/marges/simuler")
def simuler_marge(request: ScenarioMargeRequest) -> Dict[str, Any]:
    """Calculer une marge brute simple pour valider le futur simulateur."""
    produit = request.surface_ha * request.rendement * request.prix_unitaire + request.aides
    charges = sum([request.semences, request.engrais, request.phytos, request.alimentation, request.carburant, request.main_oeuvre, request.autres_charges_operationnelles])
    marge_brute = produit - charges
    marge_ha = marge_brute / request.surface_ha
    prix_equilibre = charges / (request.surface_ha * request.rendement) if request.rendement else None

    return {
        "scenario": request.libelle,
        "produit_total": round(produit, 2),
        "charges_operationnelles": round(charges, 2),
        "marge_brute": round(marge_brute, 2),
        "marge_brute_ha": round(marge_ha, 2),
        "prix_equilibre": round(prix_equilibre, 2) if prix_equilibre is not None else None,
        "analyse": "rentable" if marge_brute >= 0 else "a revoir",
    }


@router.get("/banque")
def get_banque() -> Dict[str, Any]:
    """Preparer la synchro bancaire, l'analyse et les alertes de flux."""
    return {
        "statut": "connecteur bancaire a brancher",
        "connecteurs_prevus": ["Bridge", "Powens", "GoCardless Bank Account Data", "import CSV/OFX"],
        "analyses": ["categorisation automatique des flux", "rapprochement factures / paiements", "detection des doublons et operations inhabituelles", "alerte solde bas, gros decaissement, retard client ou prelevement inconnu", "projection de tresorerie court terme"],
        "workflow": "achat-intrant-banque-stock",
    }


@router.post("/banque/analyser-flux")
def analyser_flux(request: AnalyseFluxRequest) -> Dict[str, Any]:
    """Analyser un lot de flux bancaires sans dependre d'un connecteur externe."""
    encaissements = sum(t.montant for t in request.transactions if t.montant > 0)
    decaissements = abs(sum(t.montant for t in request.transactions if t.montant < 0))
    solde_final = request.solde_initial + encaissements - decaissements
    alertes = []
    transactions_enrichies = []

    for transaction in request.transactions:
        categorie = _categoriser_flux(transaction)
        transactions_enrichies.append({"date_operation": transaction.date_operation.isoformat(), "libelle": transaction.libelle, "montant": transaction.montant, "categorie_suggeree": categorie, "contrepartie": transaction.contrepartie})
        if transaction.montant < -2500:
            alertes.append({"niveau": "warning", "transaction": transaction.libelle, "message": "Decaissement important a valider."})
        if "prelevement" in transaction.libelle.lower() and not transaction.categorie:
            alertes.append({"niveau": "info", "transaction": transaction.libelle, "message": "Prelevement a categoriser pour le rapprochement."})

    if solde_final < 0:
        alertes.append({"niveau": "critical", "message": "Solde final previsionnel negatif."})

    return {"encaissements": round(encaissements, 2), "decaissements": round(decaissements, 2), "solde_final": round(solde_final, 2), "nombre_transactions": len(request.transactions), "transactions_enrichies": transactions_enrichies, "alertes": alertes}


@router.get("/ia/preparation")
def get_ia_preparation() -> Dict[str, Any]:
    """Decrire les points d'integration IA a brancher progressivement."""
    return {
        "objectifs": ["assistant ferme contextualise par donnees techniques et economiques", "OCR factures et bons de livraison", "detection d'anomalies bancaires, stocks et marges", "recommandations d'intervention ou d'achat selon historique", "syntheses de cloture et preparation reglementaire"],
        "donnees_contextuelles": ["parcelles", "animaux", "stocks", "ventes", "banque", "comptabilite", "documents"],
        "garde_fous": ["validation humaine", "tracabilite des suggestions", "separation conseil / decision", "journal d'audit"],
        "workflow": "assistant-ia-anomalie",
    }


@router.get("/exports/reglementaires")
def get_exports_reglementaires() -> Dict[str, Any]:
    """Lister les exports comptables et reglementaires a couvrir."""
    return {
        "formats": [
            {"code": "FEC", "label": "Fichier des ecritures comptables", "priorite": "haute"},
            {"code": "JOURNAUX", "label": "Journaux comptables", "priorite": "haute"},
            {"code": "GRAND_LIVRE", "label": "Grand livre", "priorite": "haute"},
            {"code": "BALANCE", "label": "Balance generale", "priorite": "haute"},
            {"code": "TVA", "label": "Preparation declarative TVA", "priorite": "moyenne"},
            {"code": "TRACABILITE", "label": "Tracabilite technique parcelles/animaux/stocks", "priorite": "moyenne"},
        ],
        "principes": ["exports horodates", "donnees filtrables par exercice et journal", "piste d'audit et justificatifs lies", "formats CSV prets pour expert-comptable et outils reglementaires"],
        "workflow": "cloture-reglementaire",
    }
