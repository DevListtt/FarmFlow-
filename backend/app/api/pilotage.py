"""
API de pilotage FarmFlow.

Ce module pose le socle transverse d'un ERP agricole modulaire :
applications metier, workflows, roles, pilotage economique, caisse,
banque, IA preparatoire et exports reglementaires.
"""
from collections import defaultdict
from copy import deepcopy
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.module_registry import (
    build_architecture_payload,
    build_dependency_graph,
    enrich_apps,
    validate_registry,
)
from ..database import get_db
from ..models.transactionnel import (
    CommandeClientAgri,
    EcritureAutoAgri,
    LigneTicketAgri,
    MouvementStockAgri,
    OperationBancaireAgri,
    ProduitAgri,
    TicketCaisseAgri,
)


router = APIRouter(prefix="/pilotage", tags=["pilotage"])


class ScenarioMargeRequest(BaseModel):
    """Entrees minimales pour simuler une marge brute agricole."""

    libelle: str = Field(..., description="Nom du scenario ou de l'atelier")
    atelier_type: str = Field("culture", description="culture, elevage ou circuit-court")
    canal: str = Field("standard", description="Canal de vente ou mode de valorisation")
    unite_reference: str = Field("ha", description="Unite de lecture de la marge")
    quantite_reference: Optional[float] = Field(None, gt=0, description="Nombre d'unites de reference")
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
    materiel: float = Field(0, ge=0)
    autres_charges_operationnelles: float = Field(0, ge=0)
    pertes_percent: float = Field(0, ge=0, le=100)
    variation_prix_percent: float = Field(0, ge=-100)
    variation_rendement_percent: float = Field(0, ge=-100)
    objectif_marge_percent: float = Field(18, ge=0)
    charges_personnalisees: List[Dict[str, Any]] = Field(default_factory=list)
    revenus_personnalises: List[Dict[str, Any]] = Field(default_factory=list)


class IngredientRationRequest(BaseModel):
    """Ingredient utilise pour calculer une ration simplifiee."""

    nom: str
    kg_ms: float = Field(..., ge=0, description="Kg de matiere seche par jour")
    prix_kg_ms: float = Field(0, ge=0)
    sucre_soluble_percent: float = Field(0, ge=0)
    mat_percent: float = Field(0, ge=0, description="Matiere azotee totale en pourcentage MS")
    ufl_kg_ms: float = Field(0, ge=0, description="UFL par kg MS")


class RationRequest(BaseModel):
    """Ration journaliere par animal ou par lot."""

    lot: str = "Lot laitier"
    effectif: int = Field(1, ge=1)
    objectif_sucre_percent: float = Field(6.5, ge=0)
    objectif_mat_percent: float = Field(14, ge=0)
    ingredients: List[IngredientRationRequest]


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


class LigneTicketCaisse(BaseModel):
    """Ligne normalisee envoyee par la caisse."""

    code: str
    nom: str
    quantite: float = Field(..., gt=0)
    prix_unitaire: float = Field(..., ge=0)
    tva: float = Field(5.5, ge=0)


class TicketCaisseRequest(BaseModel):
    """Ticket de caisse avant generation des mouvements automatiques."""

    client: str = "Client comptoir"
    moyen_paiement: str = "card"
    remise_percent: float = Field(0, ge=0, le=100)
    lignes: List[LigneTicketCaisse]


class ClotureCaisseRequest(BaseModel):
    """Cloture de session caisse."""

    fond_reel: float = Field(0, ge=0)
    commentaire: Optional[str] = None


class SyncConnectorRequest(BaseModel):
    """Configuration envoyee par le hub de synchronisation."""

    code: str
    frequence_minutes: int = Field(15, ge=5)
    mode: str = "Simulation"
    journal_automatique: bool = True
    validation_humaine: bool = True
    parametres: Dict[str, str] = Field(default_factory=dict)


class ConfigurationExploitationRequest(BaseModel):
    """Profil simple d'exploitation pour recommander les premiers modules."""

    nom: str = Field(..., description="Nom de l'exploitation")
    type_exploitation: str = Field("mixte", description="cereales, elevage, maraichage, viticulture, mixte...")
    surface_ha: Optional[float] = Field(None, ge=0)
    productions: List[str] = Field(default_factory=list)
    modules_souhaites: List[str] = Field(default_factory=list)


class CockpitConfigurationRequest(BaseModel):
    """Regles de pilotage modifiables pour le cockpit dirigeant."""

    profil: str = "exploitant"
    objectifs: Dict[str, float] = Field(default_factory=dict)
    regles: Dict[str, Any] = Field(default_factory=dict)
    affichage: Dict[str, Any] = Field(default_factory=dict)


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
    _app("pilotage", "Pilotage ferme", "socle", "/cockpit", "socle pret", "haute", "Cockpit dirigeant pour suivre production, marges, tresorerie, alertes et obligations.", ["tableau de bord", "alertes", "objectifs", "vues par atelier"], ["Configurer les ateliers", "Choisir les modules actifs", "Definir les roles"], ["GET /pilotage/cockpit", "GET /pilotage/cockpit/configuration", "POST /pilotage/cockpit/configuration", "GET /pilotage/dashboard", "GET /pilotage/apps"]),
    _app("noyau-operationnel", "Noyau operationnel", "socle", "/noyau", "pret a tester", "haute", "Flux achats, stocks, caisse, banque, compta, IoT, mobile terrain et segmentation commerciale.", ["achats", "mouvements stock", "scan POS", "balance", "banque", "ecritures auto", "segmentation"], ["Tester un scan POS", "Peser un produit", "Segmenter un client"], ["GET /noyau/vue", "POST /noyau/iot/scan-pos", "POST /noyau/iot/pesee"]),
    _app("backoffice", "Back-office", "socle", "/backoffice", "referentiels connectes", "haute", "Produits, clients, fournisseurs, lots, seuils et ajustements de stock relies au noyau transactionnel.", ["produits", "tiers", "tarifs", "seuils stock", "ajustements", "audit"], ["Creer un produit", "Segmenter un tiers", "Ajuster un stock"], ["GET /backoffice/referentiels", "POST /backoffice/produits", "POST /backoffice/tiers"]),
    _app("historiques", "Historiques", "socle", "/historiques", "consultation connectee", "haute", "Tickets, achats, mouvements, ecritures, banque, fiches detail et exports CSV.", ["recherche", "filtres", "details", "exports CSV", "audit"], ["Filtrer les tickets", "Ouvrir une fiche", "Exporter les mouvements"], ["GET /backoffice/historiques", "GET /backoffice/tickets/{reference}", "GET /backoffice/exports/tickets.csv"]),
    _app("parcelles", "Parcelles", "production", "/parcelles", "atelier carto interactif", "haute", "Carte GPS interactive, dessin, edition, decoupe, ilots, couches, GeoJSON et chantiers.", ["carte interactive", "dessin GPS", "edition sommets", "decoupe", "GeoJSON", "ilots"], ["Tracer une parcelle", "Importer GeoJSON", "Regrouper en ilot"], ["GET /parcelles/cartographie", "GET /parcelles/geojson", "GET /parcelles/fonds-carte"]),
    _app("cultures-interventions", "Cultures & interventions", "production", "/chantiers", "a enrichir", "haute", "Itineraires techniques, interventions, temps de travaux, intrants, IFT et couts terrain.", ["planning cultural", "interventions", "IFT", "temps et couts"], ["Creer les itineraires", "Planifier les interventions", "Lier stocks et materiel"], ["GET /chantiers/", "GET /parcelles/{id}/interventions", "GET /export/parcelles/csv"]),
    _app("elevage", "Elevage", "production", "/animaux", "socle disponible", "haute", "Troupeaux, identification, reproduction, sanitaire, lots, mouvements et performances.", ["animaux", "lots", "sanitaire", "reproduction", "RFID"], ["Importer les animaux", "Creer les lots", "Planifier les suivis sanitaires"], ["GET /animaux/", "POST /animaux/", "GET /animaux/{id}/sante"]),
    _app("stocks", "Stocks", "operations", "/stocks", "socle disponible", "haute", "Intrants, aliments, produits finis, lots, seuils, mouvements et valorisation.", ["seuils", "lots", "mouvements", "valorisation", "liaison interventions"], ["Creer les categories", "Saisir stocks initiaux", "Definir les seuils d'alerte"], ["GET /stocks", "GET /stocks/categories", "GET /export/stocks/csv"]),
    _app("achats", "Achats fournisseurs", "commerce", "/noyau", "flux connecte", "haute", "Demandes de prix, commandes, receptions, factures fournisseurs et couts par atelier.", ["devis", "commandes", "receptions", "factures", "couts imputes"], ["Structurer fournisseurs", "Creer modeles de commande", "Lier factures et stocks"], ["POST /noyau/achats/commande", "GET /noyau/vue", "POST /noyau/banque/rapprocher"]),
    _app("ventes-caisse", "Ventes & caisse", "commerce", "/caisse", "crm caisse", "haute", "Ventes directes, tickets, clients CRM, segments, paiements, stocks et clotures de caisse.", ["clients caisse", "tickets", "paiements", "segments", "stocks", "cloture journaliere"], ["Selectionner client", "Creer client caisse", "Encaisser panier", "Verifier ecritures"], ["GET /pilotage/caisse", "POST /pilotage/caisse/clients", "POST /pilotage/caisse/tickets"]),
    _app("commandes-clients", "Commandes clients", "commerce", "/commandes", "reservation stock", "haute", "Portail de commande avec catalogue reservable, clients CRM, lots, retrait, livraison et conversion caisse.", ["catalogue", "reservation stock", "prix client", "retrait ferme", "livraison", "conversion caisse"], ["Selectionner client", "Reserver produits", "Convertir en caisse"], ["GET /commandes/portail", "POST /commandes", "POST /commandes/{reference}/convertir-ticket"]),
    _app("crm", "CRM agricole", "commerce", "/crm", "socle disponible", "moyenne", "Clients, prospects, distributeurs, circuits courts, contrats et historique commercial.", ["contacts", "segments", "opportunites", "contrats", "relances"], ["Importer clients", "Segmenter circuits", "Creer pipelines de vente"], ["GET /crm/clients", "POST /crm/prospects", "GET /crm/opportunites"]),
    _app("comptabilite", "Comptabilite", "finance", "/comptabilite", "console avancee", "haute", "Journaux, ecritures automatiques, TVA, balance, grand livre, banque et controles.", ["journaux", "TVA", "balance", "grand livre", "rapprochements", "exports"], ["Controler balance", "Valider ecritures auto", "Rapprocher banque"], ["GET /comptabilite/vue", "POST /comptabilite/ecritures/valider-auto", "POST /comptabilite/rapprochements"]),
    _app("banque-tresorerie", "Banque & tresorerie", "finance", "/sync", "connecteur a brancher", "haute", "Synchronisation bancaire, rapprochement, prevision de tresorerie et alertes de flux.", ["synchro bancaire", "rapprochement", "categorisation", "prevision", "alertes"], ["Choisir connecteur", "Importer historique", "Definir seuils de tresorerie"], ["GET /pilotage/banque", "POST /pilotage/banque/analyser-flux"]),
    _app("marges", "Marges & prix de revient", "finance", "/marges", "atelier avance", "haute", "Marge brute par culture, lot animal, circuit court, postes personnalisables, ration et seuils.", ["marge brute", "prix de revient", "postes personnalisables", "circuit court", "ration animale", "stress test"], ["Definir ateliers", "Ajouter postes charges", "Calculer ration", "Comparer stress test"], ["GET /pilotage/marges", "POST /pilotage/marges/simuler", "POST /pilotage/marges/ration"]),
    _app("flotte-materiel", "Flotte & materiel", "operations", "/flotte", "socle disponible", "moyenne", "Tracteurs, outils, entretiens, carburant, cout horaire et disponibilite chantier.", ["vehicules", "entretiens", "carburant", "cout horaire", "planning"], ["Inventorier materiel", "Programmer entretiens", "Calculer couts horaires"], ["GET /flotte", "POST /flotte/entretiens", "GET /chantiers"]),
    _app("rh", "RH & planning", "operations", "/rh", "socle disponible", "moyenne", "Saisonniers, permanents, temps de travaux, competences, absences et paie preparatoire.", ["employes", "planning", "temps", "absences", "paie"], ["Creer equipes", "Declarer competences", "Lier temps aux chantiers"], ["GET /rh/employes", "GET /rh/conges", "POST /rh/planning"]),
    _app("calendrier", "Calendrier agricole", "operations", "/calendrier", "socle disponible", "moyenne", "Evenements, rappels, fenetres meteo, taches recurrentes et echeances reglementaires.", ["agenda", "rappels", "echeances", "meteo", "recurrence"], ["Importer echeances", "Planifier cultures", "Activer rappels"], ["GET /calendrier", "POST /calendrier/evenements"]),
    _app("documents-reglementaire", "Documents & reglementaire", "conformite", "/apps/documents-reglementaire", "exports prets", "haute", "FEC, journaux, grand livre, balance, TVA, tracabilite technique et pieces justificatives.", ["FEC", "journaux", "grand livre", "balance", "tracabilite", "audit"], ["Parametrer exercice", "Centraliser justificatifs", "Tester exports"], ["GET /pilotage/exports/reglementaires", "GET /export/comptabilite/csv"]),
    _app("ia-agricole", "IA agricole", "plateforme", "/ia", "connecteur a brancher", "moyenne", "Assistant contextualise, OCR factures, anomalies, recommandations et syntheses de ferme.", ["assistant", "OCR", "anomalies", "recommandations", "syntheses"], ["Choisir modele", "Definir donnees autorisees", "Activer journal d'audit"], ["GET /pilotage/ia/preparation", "POST /ia/analyser"]),
    _app("communication", "Communication", "plateforme", "/communication", "socle disponible", "basse", "Email, SMS, WhatsApp, campagnes clients, alertes internes et notifications equipe.", ["campagnes", "notifications", "SMS", "email", "WhatsApp"], ["Configurer canaux", "Creer modeles", "Segmenter destinataires"], ["GET /communication/campagnes", "POST /communication/envoyer"]),
    _app("integrations", "Integrations & automatisations", "plateforme", "/sync", "socle zapier", "moyenne", "Zapier, API meteo, paiement, code-barres, etiquettes, IoT et connecteurs externes.", ["Zapier", "meteo", "paiement", "code-barres", "IoT", "webhooks"], ["Lister connecteurs", "Securiser webhooks", "Prioriser automatisations"], ["GET /zapier/triggers", "POST /zapier/webhook"]),
]


AGRI_WORKFLOWS: List[Dict[str, Any]] = [
    {"code": "intervention-culture-stock-marge", "titre": "Intervention terrain -> stock -> marge", "modules": ["noyau-operationnel", "parcelles", "cultures-interventions", "stocks", "flotte-materiel", "marges"], "description": "Une intervention consomme intrants, materiel et temps, puis alimente le cout de revient.", "etapes": ["Planifier", "Affecter equipe et materiel", "Sortir intrants", "Valider terrain", "Actualiser marge"]},
    {"code": "commande-client-reservation", "titre": "Commande client -> reservation -> caisse -> stock", "modules": ["commandes-clients", "crm", "stocks", "ventes-caisse", "comptabilite"], "description": "Une commande reserve les lots disponibles, prepare le retrait ou la livraison, puis se convertit en ticket avec sortie de stock.", "etapes": ["Choisir client", "Reserver stock", "Preparer lot", "Convertir caisse", "Generer ecritures"]},
    {"code": "vente-directe-caisse-compta-stock", "titre": "Vente directe -> caisse -> compta -> stock", "modules": ["noyau-operationnel", "ventes-caisse", "stocks", "crm", "comptabilite", "banque-tresorerie"], "description": "Une vente cree ticket, paiement, mouvement de stock et ecriture comptable.", "etapes": ["Composer panier", "Encaisser", "Cloturer caisse", "Generer ecritures", "Rapprocher banque"]},
    {"code": "achat-intrant-banque-stock", "titre": "Achat intrant -> reception -> banque -> cout atelier", "modules": ["noyau-operationnel", "achats", "stocks", "comptabilite", "banque-tresorerie", "marges"], "description": "Les achats d'intrants alimentent les stocks, les factures fournisseurs et les couts des ateliers.", "etapes": ["Demande de prix", "Commande", "Reception", "Facture", "Paiement", "Imputation"]},
    {"code": "elevage-sante-lot-marge", "titre": "Elevage -> sanitaire -> lot -> marge", "modules": ["elevage", "stocks", "calendrier", "marges", "documents-reglementaire"], "description": "Les soins, aliments, mouvements et ventes d'animaux structurent la marge par lot.", "etapes": ["Identifier", "Planifier soin", "Consommer stock", "Suivre lot", "Calculer marge"]},
    {"code": "cloture-reglementaire", "titre": "Cloture -> exports -> expert-comptable", "modules": ["comptabilite", "documents-reglementaire", "banque-tresorerie", "pilotage"], "description": "La cloture consolide pieces, journaux, TVA, FEC, balances et anomalies avant transmission.", "etapes": ["Controler pieces", "Rapprocher banque", "Calculer TVA", "Exporter", "Archiver"]},
    {"code": "assistant-ia-anomalie", "titre": "IA -> detection -> validation humaine", "modules": ["ia-agricole", "pilotage", "banque-tresorerie", "stocks", "marges"], "description": "L'assistant analyse factures, flux et ecarts, puis propose une action validee par l'utilisateur.", "etapes": ["Collecter contexte", "Detecter anomalie", "Expliquer", "Proposer", "Valider"]},
]


AGRI_ROLES: List[Dict[str, Any]] = [
    {"code": "exploitant", "nom": "Exploitant / dirigeant", "niveau": "admin", "acces": ["pilotage", "finance", "production", "configuration", "exports"], "objectifs": ["decider", "controler marges", "suivre tresorerie", "valider clotures"]},
    {"code": "chef-culture", "nom": "Chef de culture", "niveau": "manager", "acces": ["parcelles", "cultures-interventions", "stocks", "flotte-materiel"], "objectifs": ["planifier interventions", "suivre IFT", "controler intrants"]},
    {"code": "responsable-elevage", "nom": "Responsable elevage", "niveau": "manager", "acces": ["elevage", "stocks", "calendrier", "documents-reglementaire"], "objectifs": ["suivre troupeau", "planifier sanitaire", "tracer lots"]},
    {"code": "commercial-caisse", "nom": "Commercial / caisse", "niveau": "operationnel", "acces": ["commandes-clients", "ventes-caisse", "crm", "stocks"], "objectifs": ["vendre", "reserver commandes", "encaisser", "relancer clients", "cloturer caisse"]},
    {"code": "comptable", "nom": "Comptable / expert-comptable", "niveau": "controle", "acces": ["comptabilite", "banque-tresorerie", "documents-reglementaire", "exports"], "objectifs": ["rapprocher", "declarer TVA", "exporter FEC", "controler pieces"]},
    {"code": "salarie-terrain", "nom": "Salarie terrain", "niveau": "saisie", "acces": ["cultures-interventions", "flotte-materiel", "calendrier"], "objectifs": ["voir taches", "saisir temps", "remonter observations"]},
]


ROADMAP: List[Dict[str, Any]] = [
    {"phase": "Socle ERP agricole", "statut": "en cours", "livrables": ["catalogue apps", "dashboard", "roles", "workflows", "configuration exploitation"]},
    {"phase": "Noyau transactionnel", "statut": "pret a tester", "livrables": ["achats", "caisse complete", "banque", "mouvements stock", "ecritures automatiques", "scan POS", "balance"]},
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


AGRI_APPS = enrich_apps(AGRI_APPS)


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


def _workspace_cards() -> List[Dict[str, Any]]:
    return [
        {"code": "socle", "titre": "Noyau operationnel", "description": "Achats, stock, caisse, banque, compta, IoT, balance, mobile et segmentation.", "statut": "pret a tester"},
        {"code": "production", "titre": "Production agricole", "description": "Parcelles, cultures, elevage, interventions, stocks, materiel et calendrier terrain.", "statut": "socle disponible"},
        {"code": "commerce", "titre": "Commerce & caisse", "description": "CRM, ventes, tickets, paniers, marches, fournisseurs, achats et factures.", "statut": "connecte"},
        {"code": "finance", "titre": "Finance & marges", "description": "Comptabilite, tresorerie, banque, couts de revient, marges et budget/reel.", "statut": "connecte"},
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
    base_codes = {"pilotage", "noyau-operationnel", "comptabilite", "banque-tresorerie", "marges", "documents-reglementaire"}
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


MONTH_LABELS = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"]
ACTIVE_COCKPIT_ORDER_STATUSES = {"reservee", "preparation", "confirmee"}

DEFAULT_COCKPIT_CONFIGURATION: Dict[str, Any] = {
    "profil": "exploitant",
    "objectifs": {
        "ca": 210000,
        "marge": 72000,
        "tresorerie": 50000,
        "stock": 54000,
        "commandes": 28,
        "ca_mensuel": 17500,
    },
    "regles": {
        "marge_min_percent": 35,
        "tresorerie_warning_ratio": 0.9,
        "objectif_warning_ratio": 0.75,
        "stock_risk_level": 60,
        "bank_priority_threshold": 1,
        "orders_attention_threshold": 5,
        "displayed_kpis": ["ca", "marge", "tresorerie", "stock", "commandes"],
    },
    "affichage": {
        "modules": {
            "revenu_marge": True,
            "tresorerie": True,
            "ventes_canaux": True,
            "charges": True,
            "sante": True,
            "marges_ateliers": True,
            "risques": True,
            "decisions": True,
            "alertes": True,
        }
    },
}
COCKPIT_CONFIGURATION: Dict[str, Any] = deepcopy(DEFAULT_COCKPIT_CONFIGURATION)


def _round_money(value: float) -> float:
    return round(float(value or 0), 2)


def _month_index(value: Optional[datetime]) -> int:
    current = value or datetime.utcnow()
    return max(min(current.month, 12), 1)


def _percent(value: float, total: float) -> float:
    if not total:
        return 0.0
    return round((value / total) * 100, 1)


def _trend(current: float, previous: float) -> float:
    if not previous:
        return 0.0 if not current else 100.0
    return round(((current - previous) / abs(previous)) * 100, 1)


def _status_from_gap(value: float, target: float, warning_ratio: float = 0.9) -> str:
    if target <= 0:
        return "ok"
    ratio = value / target
    if ratio >= warning_ratio:
        return "ok"
    if ratio >= warning_ratio * 0.75:
        return "a-surveiller"
    return "attention"


def _margin_risk(margin: float, revenue: float) -> int:
    rate = _percent(margin, revenue)
    if rate >= 45:
        return 28
    if rate >= 32:
        return 44
    if rate >= 20:
        return 62
    return 82


def _get_cockpit_configuration() -> Dict[str, Any]:
    return deepcopy(COCKPIT_CONFIGURATION)


def _merge_nested_config(current: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
    merged = deepcopy(current)
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _merge_nested_config(merged[key], value)
        else:
            merged[key] = value
    return merged


def _set_kpi_status(kpi: Dict[str, Any], rules: Dict[str, Any]) -> None:
    target = float(kpi.get("target") or 0)
    value = float(kpi.get("value") or 0)
    code = kpi.get("code")
    if code == "commandes":
        threshold = float(target or rules.get("orders_attention_threshold", 5))
        kpi["status"] = "attention" if value > threshold else "ok"
        return
    warning_ratio = float(rules.get("tresorerie_warning_ratio", 0.9) if code == "tresorerie" else rules.get("objectif_warning_ratio", 0.75))
    kpi["status"] = _status_from_gap(value, target, warning_ratio)


def _apply_cockpit_configuration(payload: Dict[str, Any]) -> Dict[str, Any]:
    config = _get_cockpit_configuration()
    objectives = config.get("objectifs", {})
    rules = config.get("regles", {})
    displayed_kpis = set(rules.get("displayed_kpis") or [])

    configured_kpis = []
    for kpi in payload.get("kpis", []):
        code = kpi.get("code")
        if displayed_kpis and code not in displayed_kpis:
            continue
        if code in objectives:
            kpi["target"] = objectives[code]
            _set_kpi_status(kpi, rules)
        configured_kpis.append(kpi)
    payload["kpis"] = configured_kpis

    monthly_target = objectives.get("ca_mensuel")
    if monthly_target:
        for row in payload.get("series", {}).get("revenu_marge", []):
            row["objectif"] = _round_money(monthly_target)

    revenue = next((item.get("value", 0) for item in configured_kpis if item.get("code") == "ca"), 0)
    margin = next((item.get("value", 0) for item in configured_kpis if item.get("code") == "marge"), 0)
    treasury = next((item.get("value", 0) for item in configured_kpis if item.get("code") == "tresorerie"), 0)
    margin_rate = _percent(float(margin or 0), float(revenue or 0))
    margin_min = float(rules.get("marge_min_percent", 35))
    treasury_target = float(objectives.get("tresorerie", 0) or 0)
    treasury_ratio = float(rules.get("tresorerie_warning_ratio", 0.9))

    alert_titles = {alert.get("titre") for alert in payload.get("alertes", [])}
    if revenue and margin_rate < margin_min and "Marge sous regle cockpit" not in alert_titles:
        payload.setdefault("alertes", []).insert(0, {
            "niveau": "warning",
            "titre": "Marge sous regle cockpit",
            "description": f"Taux marge {margin_rate}% pour une regle minimale {margin_min}%.",
        })
    if treasury_target and treasury < treasury_target * treasury_ratio and "Tresorerie sous regle cockpit" not in alert_titles:
        payload.setdefault("alertes", []).insert(0, {
            "niveau": "warning",
            "titre": "Tresorerie sous regle cockpit",
            "description": f"Solde {round(treasury, 2)} EUR sous le seuil configure.",
        })

    if revenue and margin_rate < margin_min:
        payload.setdefault("decisions", []).insert(0, {
            "priorite": "haute",
            "titre": "Ajuster les objectifs de marge par atelier",
            "impact": "reprioriser prix, couts et canaux selon les regles cockpit",
            "gain_estime": _round_money(float(revenue) * 0.03),
            "route": "/marges",
        })

    payload["configuration"] = config
    payload["alertes"] = payload.get("alertes", [])[:4]
    payload["decisions"] = payload.get("decisions", [])[:4]
    return payload


def _build_treasury_series(tickets: List[TicketCaisseAgri], operations: List[OperationBancaireAgri]) -> List[Dict[str, Any]]:
    weekly: Dict[str, Dict[str, float]] = defaultdict(lambda: {"encaissements": 0.0, "decaissements": 0.0})
    if operations:
        sorted_operations = sorted(operations, key=lambda operation: operation.date_operation or date.today())
        for operation in sorted_operations:
            week = f"S{(operation.date_operation or date.today()).isocalendar().week}"
            amount = operation.montant or 0
            if amount >= 0:
                weekly[week]["encaissements"] += amount
            else:
                weekly[week]["decaissements"] += abs(amount)
    else:
        total_revenue = sum(ticket.total_ttc or 0 for ticket in tickets)
        total_cost = sum(ticket.cout_revient or 0 for ticket in tickets)
        weekly["S1"]["encaissements"] = total_revenue
        weekly["S1"]["decaissements"] = total_cost

    balance = 0.0
    rows: List[Dict[str, Any]] = []
    for week in sorted(weekly.keys())[-6:]:
        values = weekly[week]
        balance += values["encaissements"] - values["decaissements"]
        rows.append({
            "semaine": week,
            "solde": _round_money(balance),
            "encaissements": _round_money(values["encaissements"]),
            "decaissements": _round_money(values["decaissements"]),
        })
    return rows or [{"semaine": "S1", "solde": 0, "encaissements": 0, "decaissements": 0}]


def _build_live_cockpit(db: Session) -> Optional[Dict[str, Any]]:
    tickets = db.query(TicketCaisseAgri).order_by(TicketCaisseAgri.created_at.asc()).all()
    orders = db.query(CommandeClientAgri).order_by(CommandeClientAgri.created_at.desc()).all()
    products = db.query(ProduitAgri).filter(ProduitAgri.actif.is_(True)).order_by(ProduitAgri.famille, ProduitAgri.nom).all()
    entries = db.query(EcritureAutoAgri).order_by(EcritureAutoAgri.created_at.desc()).all()
    operations = db.query(OperationBancaireAgri).order_by(OperationBancaireAgri.date_operation.asc()).all()
    movements = db.query(MouvementStockAgri).order_by(MouvementStockAgri.created_at.desc()).all()
    ticket_lines = db.query(LigneTicketAgri).all()

    if not any([tickets, orders, entries, operations, movements]):
        return None

    revenue = sum(ticket.total_ttc or 0 for ticket in tickets)
    margin = sum(ticket.marge or 0 for ticket in tickets)
    stock_value = sum((product.stock or 0) * (product.cout_revient or 0) for product in products)
    active_orders = [order for order in orders if order.statut in ACTIVE_COCKPIT_ORDER_STATUSES]
    open_order_value = sum(order.total_ttc or 0 for order in active_orders)
    bank_balance = sum(operation.montant or 0 for operation in operations)
    if not operations:
        bank_balance = revenue - sum(ticket.cout_revient or 0 for ticket in tickets)

    month_revenue: Dict[int, float] = defaultdict(float)
    month_margin: Dict[int, float] = defaultdict(float)
    for ticket in tickets:
        index = _month_index(ticket.created_at)
        month_revenue[index] += ticket.total_ttc or 0
        month_margin[index] += ticket.marge or 0

    max_month = max(month_revenue.keys() or [datetime.utcnow().month])
    start_month = max(1, max_month - 7)
    revenue_margin_series = [
        {
            "mois": MONTH_LABELS[index - 1],
            "ca": _round_money(month_revenue[index]),
            "marge": _round_money(month_margin[index]),
            "objectif": _round_money(month_revenue[index] * 1.08),
        }
        for index in range(start_month, max_month + 1)
    ]

    channel_totals: Dict[str, Dict[str, float]] = defaultdict(lambda: {"montant": 0.0, "marge": 0.0})
    for ticket in tickets:
        channel = ticket.segment or ticket.moyen_paiement or "circuit-court"
        channel_totals[channel]["montant"] += ticket.total_ttc or 0
        channel_totals[channel]["marge"] += ticket.marge or 0
    sales_channels = [
        {"canal": channel, "montant": _round_money(values["montant"]), "marge": _round_money(values["marge"])}
        for channel, values in sorted(channel_totals.items(), key=lambda item: item[1]["montant"], reverse=True)
    ] or [{"canal": "Aucune vente", "montant": 0, "marge": 0}]

    family_totals: Dict[str, Dict[str, float]] = defaultdict(lambda: {"ca": 0.0, "marge": 0.0})
    product_family = {product.code: product.famille or "Produit" for product in products}
    for line in ticket_lines:
        family = product_family.get(line.produit_code, "Produit")
        family_totals[family]["ca"] += line.total_ttc or 0
        family_totals[family]["marge"] += line.marge or 0
    margin_workshops = [
        {
            "atelier": family,
            "marge": _round_money(values["marge"]),
            "objectif": _round_money(values["marge"] * 1.08),
            "risque": _margin_risk(values["marge"], values["ca"]),
        }
        for family, values in sorted(family_totals.items(), key=lambda item: item[1]["marge"], reverse=True)
    ] or [{"atelier": "Aucun atelier", "marge": 0, "objectif": 0, "risque": 0}]

    stock_cost = sum(ticket.cout_revient or 0 for ticket in tickets)
    tva_collected = sum(entry.credit or 0 for entry in entries if entry.compte in {"4457", "44571", "445711"})
    cash_waiting = sum((entry.debit or 0) - (entry.credit or 0) for entry in entries if entry.compte == "5112")
    bank_out = abs(sum(operation.montant or 0 for operation in operations if (operation.montant or 0) < 0))
    stock_out = abs(sum(movement.valorisation or 0 for movement in movements if (movement.quantite or 0) < 0))
    charges = [
        {"poste": "Cout stock vendu", "budget": _round_money(stock_cost * 0.94), "realise": _round_money(stock_cost)},
        {"poste": "TVA collectee", "budget": _round_money(tva_collected), "realise": _round_money(tva_collected)},
        {"poste": "Sorties banque", "budget": _round_money(bank_out * 0.92), "realise": _round_money(bank_out)},
        {"poste": "Attente TPE", "budget": 0, "realise": _round_money(max(cash_waiting, 0))},
        {"poste": "Sorties stock", "budget": _round_money(stock_out * 0.95), "realise": _round_money(stock_out)},
    ]

    previous_month = month_revenue.get(max_month - 1, 0)
    current_month = month_revenue.get(max_month, 0)
    previous_margin = month_margin.get(max_month - 1, 0)
    current_margin = month_margin.get(max_month, 0)
    target_revenue = max(revenue * 1.12, revenue + open_order_value)
    target_margin = max(margin * 1.10, margin + 1)
    target_treasury = max(bank_balance * 1.15, 5000)
    low_stock_products = [product for product in products if product.seuil_alerte and (product.stock or 0) <= product.seuil_alerte]
    bank_to_match = [operation for operation in operations if operation.statut == "a_rapprocher"]
    debit_total = sum(entry.debit or 0 for entry in entries)
    credit_total = sum(entry.credit or 0 for entry in entries)
    balance_gap = round(debit_total - credit_total, 2)
    margin_rate = _percent(margin, revenue)

    risks = []
    if bank_to_match:
        risks.append({"label": "Rapprochement banque", "niveau": min(95, 35 + len(bank_to_match) * 10), "impact": "Tresorerie et cloture", "route": "/comptabilite"})
    if low_stock_products:
        risks.append({"label": f"Stock bas {low_stock_products[0].nom}", "niveau": min(90, 45 + len(low_stock_products) * 12), "impact": "Rupture possible en vente", "route": "/stocks"})
    if revenue and margin_rate < 35:
        risks.append({"label": "Marge sous objectif", "niveau": _margin_risk(margin, revenue), "impact": "Prix ou cout de revient a revoir", "route": "/marges"})
    if active_orders:
        risks.append({"label": "Commandes ouvertes", "niveau": min(80, 35 + len(active_orders) * 7), "impact": "Preparation et stock a suivre", "route": "/commandes"})
    if not risks:
        risks.append({"label": "Aucun risque majeur", "niveau": 12, "impact": "Surveillance normale", "route": "/cockpit"})

    decisions = []
    if bank_to_match:
        decisions.append({"priorite": "haute", "titre": f"Rapprocher {len(bank_to_match)} operations bancaires", "impact": "fiabiliser tresorerie et compta", "gain_estime": 0, "route": "/comptabilite"})
    if low_stock_products:
        decisions.append({"priorite": "haute", "titre": f"Reapprovisionner {low_stock_products[0].nom}", "impact": "securiser ventes et commandes", "gain_estime": round(low_stock_products[0].prix_vente * max(low_stock_products[0].seuil_alerte or 0, 1), 2), "route": "/stocks"})
    if revenue and margin_rate < 35:
        decisions.append({"priorite": "haute", "titre": "Reviser prix ou couts des ateliers faibles", "impact": "ameliorer le taux de marge", "gain_estime": _round_money(revenue * 0.04), "route": "/marges"})
    if active_orders:
        decisions.append({"priorite": "moyenne", "titre": f"Preparer {len(active_orders)} commandes ouvertes", "impact": "eviter retards et ruptures", "gain_estime": _round_money(open_order_value), "route": "/commandes"})
    if not decisions:
        decisions.append({"priorite": "basse", "titre": "Continuer le suivi quotidien", "impact": "aucune action critique detectee", "gain_estime": 0, "route": "/cockpit"})

    alerts = []
    if bank_balance < target_treasury * 0.9:
        alerts.append({"niveau": "warning", "titre": "Tresorerie sous objectif", "description": f"Solde calcule {round(bank_balance, 2)} EUR pour un objectif {round(target_treasury, 2)} EUR."})
    if balance_gap:
        alerts.append({"niveau": "warning", "titre": "Balance comptable a controler", "description": f"Ecart debit-credit de {balance_gap} EUR sur les ecritures automatiques."})
    if low_stock_products:
        alerts.append({"niveau": "warning", "titre": "Stock sous seuil", "description": f"{len(low_stock_products)} produit(s) sous seuil d'alerte."})
    if not alerts:
        alerts.append({"niveau": "success", "titre": "Flux transactionnels coherents", "description": "Aucun ecart critique detecte sur caisse, stock, banque et compta."})

    return {
        "periode": {"label": f"Campagne {datetime.utcnow().year}", "debut": f"{datetime.utcnow().year}-01-01", "fin": f"{datetime.utcnow().year}-12-31"},
        "source": "transactions",
        "mis_a_jour": datetime.utcnow().isoformat() + "Z",
        "kpis": [
            {"code": "ca", "label": "Chiffre d'affaires", "value": _round_money(revenue), "unit": "EUR", "trend": _trend(current_month, previous_month), "target": _round_money(target_revenue), "status": _status_from_gap(revenue, target_revenue, 0.75)},
            {"code": "marge", "label": "Marge brute", "value": _round_money(margin), "unit": "EUR", "trend": _trend(current_margin, previous_margin), "target": _round_money(target_margin), "status": "ok" if margin_rate >= 35 else "a-surveiller"},
            {"code": "tresorerie", "label": "Tresorerie calculee", "value": _round_money(bank_balance), "unit": "EUR", "trend": _trend(bank_balance, revenue - stock_cost), "target": _round_money(target_treasury), "status": _status_from_gap(bank_balance, target_treasury, 0.9)},
            {"code": "stock", "label": "Stock valorise", "value": _round_money(stock_value), "unit": "EUR", "trend": _trend(stock_value, stock_value - stock_out), "target": _round_money(stock_value), "status": "a-surveiller" if low_stock_products else "ok"},
            {"code": "commandes", "label": "Commandes ouvertes", "value": len(active_orders), "unit": "commandes", "trend": _trend(len(active_orders), max(len(orders) - len(active_orders), 0)), "target": len(orders), "status": "attention" if len(active_orders) > 5 else "ok"},
        ],
        "series": {
            "revenu_marge": revenue_margin_series,
            "tresorerie": _build_treasury_series(tickets, operations),
            "ventes_canaux": sales_channels,
            "marges_ateliers": margin_workshops,
            "charges": charges,
            "sante": [
                {"axe": "Tresorerie", "score": max(0, min(100, int(_percent(bank_balance, target_treasury))))},
                {"axe": "Marge", "score": max(0, min(100, int(margin_rate * 2)))},
                {"axe": "Stock", "score": max(0, 100 - len(low_stock_products) * 15)},
                {"axe": "Ventes", "score": max(0, min(100, int(_percent(revenue, target_revenue))))},
                {"axe": "Compta", "score": 100 if balance_gap == 0 else 55},
                {"axe": "Planning", "score": max(30, 100 - len(active_orders) * 6)},
            ],
        },
        "risques": risks[:4],
        "decisions": decisions[:4],
        "alertes": alerts[:4],
    }


@router.get("/dashboard")
def get_dashboard() -> Dict[str, Any]:
    """Vue synthetique de l'environnement FarmFlow en ERP agricole."""
    high_priority_apps = [app for app in AGRI_APPS if app["priorite"] == "haute"]
    dependency_graph = build_dependency_graph(AGRI_APPS)

    return {
        "nom": "FarmFlow ERP agricole",
        "vision": "Un environnement modulaire specialise ferme, reunissant production, commerce, finance, conformite, IA et automatisations.",
        "mis_a_jour": datetime.utcnow().isoformat() + "Z",
        "kpis": [
            {"label": "Applications metier", "value": len(AGRI_APPS), "unit": "apps"},
            {"label": "Workflows transverses", "value": len(AGRI_WORKFLOWS), "unit": "flux"},
            {"label": "Modules prioritaires", "value": len(high_priority_apps), "unit": "modules"},
            {"label": "Dependances modules", "value": len(dependency_graph["edges"]), "unit": "liens"},
        ],
        "espaces": _workspace_cards(),
        "categories": _group_apps_by_category(),
        "apps": AGRI_APPS,
        "workflows": AGRI_WORKFLOWS,
        "roles": AGRI_ROLES,
        "priorites_execution": [
            "stabiliser les donnees de base exploitation, parcelles, animaux, produits et tiers",
            "relier interventions, stocks, achats, ventes et comptabilite",
            "tester noyau operationnel, banque, caisse et exports reglementaires",
            "ajouter les automatisations IA avec validation humaine",
        ],
        "alertes": [
            {"niveau": "warning", "titre": "Tresorerie a surveiller", "description": "Brancher le connecteur bancaire puis activer les seuils de solde et gros decaissements."},
            {"niveau": "success", "titre": "Noyau operationnel testable", "description": "Achats, stocks, scan POS, balance, segmentation et rapprochement ont un flux de simulation."},
            {"niveau": "success", "titre": "Socle pilotage pret", "description": "Le catalogue apps, les workflows et les roles donnent la colonne vertebrale ERP."},
        ],
    }


@router.get("/cockpit")
def get_cockpit(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Centre de decision pour suivre les indicateurs agricoles critiques."""
    live_payload = _build_live_cockpit(db)
    if live_payload:
        return _apply_cockpit_configuration(live_payload)

    payload = {
        "periode": {"label": "Campagne 2026", "debut": "2026-01-01", "fin": "2026-12-31"},
        "source": "demo",
        "mis_a_jour": datetime.utcnow().isoformat() + "Z",
        "kpis": [
            {"code": "ca", "label": "Chiffre d'affaires", "value": 184620, "unit": "EUR", "trend": 12.4, "target": 210000, "status": "ok"},
            {"code": "marge", "label": "Marge brute", "value": 68450, "unit": "EUR", "trend": 8.7, "target": 72000, "status": "a-surveiller"},
            {"code": "tresorerie", "label": "Tresorerie 30 j", "value": 42380, "unit": "EUR", "trend": -6.2, "target": 50000, "status": "a-surveiller"},
            {"code": "stock", "label": "Stock valorise", "value": 58740, "unit": "EUR", "trend": 4.1, "target": 54000, "status": "ok"},
            {"code": "commandes", "label": "Commandes ouvertes", "value": 37, "unit": "commandes", "trend": 18.0, "target": 28, "status": "attention"},
        ],
        "series": {
            "revenu_marge": [
                {"mois": "Jan", "ca": 14200, "marge": 4700, "objectif": 13500},
                {"mois": "Fev", "ca": 15800, "marge": 5200, "objectif": 14500},
                {"mois": "Mar", "ca": 18600, "marge": 6900, "objectif": 16000},
                {"mois": "Avr", "ca": 21400, "marge": 8100, "objectif": 18500},
                {"mois": "Mai", "ca": 26800, "marge": 10300, "objectif": 23000},
                {"mois": "Juin", "ca": 31800, "marge": 12100, "objectif": 27000},
                {"mois": "Juil", "ca": 35400, "marge": 13600, "objectif": 31500},
                {"mois": "Aout", "ca": 30620, "marge": 11650, "objectif": 29000},
            ],
            "tresorerie": [
                {"semaine": "S1", "solde": 51800, "encaissements": 12600, "decaissements": 9800},
                {"semaine": "S2", "solde": 49300, "encaissements": 8400, "decaissements": 10900},
                {"semaine": "S3", "solde": 46500, "encaissements": 7200, "decaissements": 10000},
                {"semaine": "S4", "solde": 42380, "encaissements": 9800, "decaissements": 13920},
                {"semaine": "S5", "solde": 39800, "encaissements": 11200, "decaissements": 13780},
                {"semaine": "S6", "solde": 45600, "encaissements": 18300, "decaissements": 12500},
            ],
            "ventes_canaux": [
                {"canal": "Boutique", "montant": 52800, "marge": 20100},
                {"canal": "Marche", "montant": 31400, "marge": 11900},
                {"canal": "Professionnels", "montant": 64200, "marge": 22400},
                {"canal": "Collectivites", "montant": 23600, "marge": 8600},
                {"canal": "Paniers", "montant": 12620, "marge": 5450},
            ],
            "marges_ateliers": [
                {"atelier": "Ble tendre", "marge": 1180, "objectif": 1050, "risque": 38},
                {"atelier": "Maraichage", "marge": 8600, "objectif": 7800, "risque": 52},
                {"atelier": "Bovin", "marge": 410, "objectif": 460, "risque": 69},
                {"atelier": "Boutique", "marge": 1320, "objectif": 1200, "risque": 34},
                {"atelier": "Transformation", "marge": 980, "objectif": 1100, "risque": 58},
            ],
            "charges": [
                {"poste": "Intrants", "budget": 32500, "realise": 34800},
                {"poste": "Aliments", "budget": 21400, "realise": 22800},
                {"poste": "Main oeuvre", "budget": 28500, "realise": 27100},
                {"poste": "Materiel", "budget": 18400, "realise": 16900},
                {"poste": "Energie", "budget": 9700, "realise": 11200},
            ],
            "sante": [
                {"axe": "Tresorerie", "score": 72},
                {"axe": "Marge", "score": 78},
                {"axe": "Stock", "score": 84},
                {"axe": "Ventes", "score": 88},
                {"axe": "Compta", "score": 69},
                {"axe": "Planification", "score": 74},
            ],
        },
        "risques": [
            {"label": "Rapprochement banque", "niveau": 78, "impact": "Tresorerie et cloture", "route": "/comptabilite"},
            {"label": "Stock pommes de terre", "niveau": 64, "impact": "Rupture possible en boutique", "route": "/stocks"},
            {"label": "Marge lot bovin", "niveau": 69, "impact": "Alimentation au-dessus budget", "route": "/marges"},
            {"label": "Commandes collectivites", "niveau": 56, "impact": "Capacite preparation a confirmer", "route": "/commandes"},
        ],
        "decisions": [
            {"priorite": "haute", "titre": "Rapprocher 14 operations bancaires", "impact": "+ fiabilite tresorerie et compta", "gain_estime": 0, "route": "/comptabilite"},
            {"priorite": "haute", "titre": "Recalculer le prix du lot bovin", "impact": "+ 5 a 8 points de marge possibles", "gain_estime": 3200, "route": "/marges"},
            {"priorite": "moyenne", "titre": "Preparer les commandes collectivites", "impact": "eviter retards et ruptures", "gain_estime": 1850, "route": "/commandes"},
            {"priorite": "moyenne", "titre": "Reapprovisionner emballages boutique", "impact": "securiser ventes circuit court", "gain_estime": 920, "route": "/stocks"},
        ],
        "alertes": [
            {"niveau": "warning", "titre": "Tresorerie sous objectif", "description": "Le solde projete descend sous 40 000 EUR en S5 avant remontee attendue."},
            {"niveau": "warning", "titre": "Charges energie au-dessus budget", "description": "Ecart de 1 500 EUR a analyser avec carburant et froid."},
            {"niveau": "success", "titre": "Ventes boutique solides", "description": "La marge boutique reste au-dessus de l'objectif malgre les commandes ouvertes."},
        ],
    }
    return _apply_cockpit_configuration(payload)


@router.get("/cockpit/configuration")
def get_cockpit_configuration() -> Dict[str, Any]:
    """Retourner les objectifs et regles configurables du cockpit."""
    return {
        "configuration": _get_cockpit_configuration(),
        "modeles": {
            "objectifs": [
                {"code": "ca", "label": "Objectif chiffre d'affaires", "unit": "EUR"},
                {"code": "marge", "label": "Objectif marge brute", "unit": "EUR"},
                {"code": "tresorerie", "label": "Tresorerie minimum", "unit": "EUR"},
                {"code": "stock", "label": "Stock valorise cible", "unit": "EUR"},
                {"code": "commandes", "label": "Commandes ouvertes maximum", "unit": "commandes"},
                {"code": "ca_mensuel", "label": "Objectif CA mensuel", "unit": "EUR"},
            ],
            "regles": [
                {"code": "marge_min_percent", "label": "Marge minimum", "unit": "%"},
                {"code": "tresorerie_warning_ratio", "label": "Seuil alerte tresorerie", "unit": "ratio"},
                {"code": "objectif_warning_ratio", "label": "Seuil objectif KPI", "unit": "ratio"},
                {"code": "bank_priority_threshold", "label": "Operations banque avant priorite haute", "unit": "operations"},
                {"code": "orders_attention_threshold", "label": "Commandes avant attention", "unit": "commandes"},
            ],
        },
    }


@router.post("/cockpit/configuration")
def configurer_cockpit(request: CockpitConfigurationRequest) -> Dict[str, Any]:
    """Mettre a jour les objectifs, regles et modules visibles du cockpit."""
    global COCKPIT_CONFIGURATION

    updates = request.model_dump(exclude_none=True)
    clean_updates = {key: value for key, value in updates.items() if value not in ({}, [])}
    COCKPIT_CONFIGURATION = _merge_nested_config(COCKPIT_CONFIGURATION, clean_updates)
    return {
        "statut": "configuration mise a jour",
        "configuration": _get_cockpit_configuration(),
        "actions": [
            "recalculer les KPI avec les objectifs",
            "mettre a jour les alertes dirigeant",
            "actualiser les decisions recommandees",
        ],
    }


@router.get("/apps")
def get_apps() -> Dict[str, Any]:
    """Lister les applications FarmFlow comme un lanceur d'apps ERP."""
    return {
        "apps": AGRI_APPS,
        "categories": _group_apps_by_category(),
        "validation": validate_registry(AGRI_APPS, AGRI_WORKFLOWS, AGRI_ROLES, CATEGORY_LABELS),
        "total": len(AGRI_APPS),
    }


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


@router.get("/architecture")
def get_architecture() -> Dict[str, Any]:
    """Retourner la structure modulaire, les dependances et les controles."""
    return build_architecture_payload(AGRI_APPS, AGRI_WORKFLOWS, AGRI_ROLES, CATEGORY_LABELS)


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
            {"label": "Ouvrir le noyau", "route": "/noyau"},
            {"label": "Nouvelle intervention", "route": "/chantiers"},
            {"label": "Encaisser une vente", "route": "/caisse"},
            {"label": "Analyser les flux", "route": "/sync"},
            {"label": "Simuler une marge", "route": "/marges"},
        ],
    }


@router.get("/caisse")
def get_caisse() -> Dict[str, Any]:
    """Preparation du module caisse pour vente directe et point de vente agricole."""
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
            "mode hors-ligne a prevoir pour marches et batiments agricoles",
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
    """Valider un ticket et preparer mouvements de stock et ecritures comptables."""
    if not request.lignes:
        raise HTTPException(status_code=400, detail="Le ticket doit contenir au moins une ligne")

    sous_total = sum(ligne.prix_unitaire * ligne.quantite for ligne in request.lignes)
    remise = sous_total * (request.remise_percent / 100)
    total = max(sous_total - remise, 0)
    tva = sum(((ligne.prix_unitaire * ligne.quantite) * (1 - request.remise_percent / 100) * ligne.tva) / (100 + ligne.tva) for ligne in request.lignes)
    cout_revient = 0.0
    mouvements_stock = []

    couts = {produit["code"]: produit["cout_revient"] for produit in PRODUITS_CAISSE}
    for ligne in request.lignes:
        cout_revient += couts.get(ligne.code, ligne.prix_unitaire * 0.55) * ligne.quantite
        mouvements_stock.append({"produit": ligne.code, "quantite": -ligne.quantite, "motif": "vente caisse"})

    marge = total - cout_revient
    ticket_id = f"CAI-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid4())[:8].upper()}"
    paiement = next((moyen for moyen in MOYENS_PAIEMENT_CAISSE if moyen["code"] == request.moyen_paiement), MOYENS_PAIEMENT_CAISSE[0])

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
            "marge": round(marge, 2),
        },
        "mouvements_stock": mouvements_stock,
        "ecritures": [
            {"journal": "VENTE", "libelle": f"Ticket {ticket_id}", "debit": round(total, 2), "credit": 0},
            {"journal": "TVA", "libelle": f"TVA ticket {ticket_id}", "debit": 0, "credit": round(tva, 2)},
            {"journal": "STOCK", "libelle": f"Sortie stock {ticket_id}", "debit": round(cout_revient, 2), "credit": 0},
        ],
    }


@router.post("/caisse/cloturer")
def cloturer_caisse(request: ClotureCaisseRequest) -> Dict[str, Any]:
    """Cloturer une session caisse et preparer le journal de cloture."""
    theorique = 250 + 1284
    ecart = request.fond_reel - theorique
    return {
        "statut": "cloture_preparee",
        "journal": "Boutique ferme",
        "fond_theorique": theorique,
        "fond_reel": request.fond_reel,
        "ecart": round(ecart, 2),
        "commentaire": request.commentaire,
        "actions": ["verrouiller tickets", "generer journal caisse", "preparer rapprochement banque"],
    }


@router.get("/marges")
def get_marges() -> Dict[str, Any]:
    """Vue economique preparatoire pour marges brutes et simulateurs."""
    return {
        "indicateurs": ["marge brute par culture, lot animal ou atelier", "prix de revient", "seuil de rentabilite", "ecart budget / realise", "sensibilite prix, rendement, intrants et main d'oeuvre", "ration et cout alimentaire"],
        "ateliers_exemple": [
            {"nom": "Ble tendre", "marge_brute_ha": 1180, "seuil_rentabilite": 182, "risque": "prix marche"},
            {"nom": "Maraichage paniers", "marge_brute_ha": 8600, "seuil_rentabilite": 1.95, "risque": "main d oeuvre"},
            {"nom": "Bovin allaitant", "marge_brute_tete": 410, "seuil_rentabilite": 1450, "risque": "aliment"},
            {"nom": "Paniers boutique", "marge_brute_lot": 1320, "seuil_rentabilite": 18.4, "risque": "invendus"},
        ],
        "modeles": [
            {"code": "culture", "libelle": "Culture / parcelle", "unites": ["ha", "q/ha", "EUR/t"], "postes": ["semences", "engrais", "protection", "carburant", "materiel"]},
            {"code": "elevage", "libelle": "Lot animal", "unites": ["tetes", "kg vif", "EUR/tete"], "postes": ["alimentation", "paille", "veterinaire", "reproduction", "temps"]},
            {"code": "circuit-court", "libelle": "Circuit court", "unites": ["lots", "pieces", "EUR/piece"], "postes": ["emballage", "transformation", "commission", "livraison", "invendus"]},
        ],
        "ration": {
            "indicateurs": ["kg MS", "sucres solubles", "MAT", "UFL", "cout par animal", "cout lot"],
            "alertes": ["surveiller les transitions", "controler fibre efficace", "valider avec conseiller nutrition si ration de production"],
        },
        "workflows": ["intervention-culture-stock-marge", "achat-intrant-banque-stock", "elevage-sante-lot-marge"],
    }


@router.post("/marges/simuler")
def simuler_marge(request: ScenarioMargeRequest) -> Dict[str, Any]:
    """Calculer une marge brute avancee avec postes personnalisables."""
    rendement_stresse = request.rendement * (1 + request.variation_rendement_percent / 100)
    prix_stresse = request.prix_unitaire * (1 + request.variation_prix_percent / 100)
    quantite_produite = request.surface_ha * request.rendement
    quantite_stressee = request.surface_ha * rendement_stresse
    reference = request.quantite_reference or request.surface_ha
    revenus_personnalises = sum(float(line.get("montant", 0) or 0) for line in request.revenus_personnalises)
    charges_personnalisees = sum(float(line.get("montant", 0) or 0) for line in request.charges_personnalisees)
    produit_vente = quantite_produite * request.prix_unitaire
    produit_brut = produit_vente + request.aides + revenus_personnalises
    produit_stresse = quantite_stressee * prix_stresse + request.aides + revenus_personnalises
    pertes = (produit_vente + revenus_personnalises) * (request.pertes_percent / 100)
    charges_standard = sum([request.semences, request.engrais, request.phytos, request.alimentation, request.carburant, request.main_oeuvre, request.materiel, request.autres_charges_operationnelles])
    charges = charges_standard + charges_personnalisees
    marge_brute = produit_brut - charges - pertes
    marge_stressee = produit_stresse - charges - pertes
    marge_ha = marge_brute / request.surface_ha
    marge_reference = marge_brute / reference
    prix_equilibre = (charges + pertes - request.aides - revenus_personnalises) / quantite_produite if quantite_produite else None
    rendement_equilibre = (charges + pertes - request.aides - revenus_personnalises) / (request.surface_ha * request.prix_unitaire) if request.prix_unitaire else None
    cout_revient_unitaire = (charges + pertes - request.aides - revenus_personnalises) / quantite_produite if quantite_produite else None
    taux_marge = (marge_brute / produit_brut * 100) if produit_brut else 0
    ecart_objectif = taux_marge - request.objectif_marge_percent
    recommandations = []
    if marge_stressee < 0:
        recommandations.append("Renforcer le prix plancher ou reduire les charges variables avant engagement.")
    if charges_personnalisees > charges_standard:
        recommandations.append("Verifier les postes personnalises, ils depassent les charges standard.")
    if request.atelier_type == "elevage" and request.alimentation == 0:
        recommandations.append("Ajouter le cout alimentaire pour fiabiliser la marge du lot.")
    if request.atelier_type == "circuit-court" and request.pertes_percent > 8:
        recommandations.append("Travailler precommandes, DLC et transformation pour reduire les invendus.")
    if not recommandations:
        recommandations.append("Scenario coherent, a comparer au realise et aux stocks consommes.")

    return {
        "scenario": request.libelle,
        "atelier_type": request.atelier_type,
        "canal": request.canal,
        "unite_reference": request.unite_reference,
        "quantite_produite": round(quantite_produite, 2),
        "produit_total": round(produit_brut, 2),
        "produit_vente": round(produit_vente, 2),
        "revenus_personnalises": round(revenus_personnalises, 2),
        "produit_stresse": round(produit_stresse, 2),
        "charges_operationnelles": round(charges, 2),
        "charges_standard": round(charges_standard, 2),
        "charges_personnalisees": round(charges_personnalisees, 2),
        "pertes_estimees": round(pertes, 2),
        "marge_brute": round(marge_brute, 2),
        "marge_stressee": round(marge_stressee, 2),
        "marge_brute_ha": round(marge_ha, 2),
        "marge_reference": round(marge_reference, 2),
        "taux_marge_percent": round(taux_marge, 2),
        "ecart_objectif_percent": round(ecart_objectif, 2),
        "prix_equilibre": round(prix_equilibre, 2) if prix_equilibre is not None else None,
        "rendement_equilibre": round(rendement_equilibre, 2) if rendement_equilibre is not None else None,
        "cout_revient_unitaire": round(cout_revient_unitaire, 2) if cout_revient_unitaire is not None else None,
        "analyse": "rentable" if marge_brute >= 0 else "a revoir",
        "recommandations": recommandations,
        "details": {
            "charges": [
                {"code": "semences", "libelle": "Semences / plants", "montant": round(request.semences, 2)},
                {"code": "engrais", "libelle": "Engrais / amendements", "montant": round(request.engrais, 2)},
                {"code": "phytos", "libelle": "Protection / sanitaire", "montant": round(request.phytos, 2)},
                {"code": "alimentation", "libelle": "Alimentation", "montant": round(request.alimentation, 2)},
                {"code": "carburant", "libelle": "Carburant", "montant": round(request.carburant, 2)},
                {"code": "main_oeuvre", "libelle": "Main d oeuvre", "montant": round(request.main_oeuvre, 2)},
                {"code": "materiel", "libelle": "Materiel", "montant": round(request.materiel, 2)},
                {"code": "autres", "libelle": "Autres charges", "montant": round(request.autres_charges_operationnelles, 2)},
            ] + request.charges_personnalisees,
            "revenus": request.revenus_personnalises,
        },
    }


@router.post("/marges/ration")
def calculer_ration(request: RationRequest) -> Dict[str, Any]:
    """Calculer les indicateurs nutritionnels et economiques d'une ration."""
    total_ms = sum(item.kg_ms for item in request.ingredients)
    if total_ms <= 0:
        raise HTTPException(status_code=400, detail="La ration doit contenir de la matiere seche.")

    sucre_total = sum(item.kg_ms * item.sucre_soluble_percent for item in request.ingredients) / total_ms
    mat_total = sum(item.kg_ms * item.mat_percent for item in request.ingredients) / total_ms
    ufl_total = sum(item.kg_ms * item.ufl_kg_ms for item in request.ingredients)
    cout_animal = sum(item.kg_ms * item.prix_kg_ms for item in request.ingredients)
    cout_lot = cout_animal * request.effectif
    alerts = []
    if sucre_total < request.objectif_sucre_percent:
        alerts.append("Sucres solubles sous objectif, verifier apport energetique rapide.")
    if mat_total < request.objectif_mat_percent:
        alerts.append("MAT sous objectif, verifier proteines et coherence avec production.")
    if sucre_total > request.objectif_sucre_percent + 3:
        alerts.append("Sucres solubles eleves, surveiller transition et acidose.")
    if not alerts:
        alerts.append("Ration equilibree sur les indicateurs suivis.")

    return {
        "lot": request.lot,
        "effectif": request.effectif,
        "kg_ms_animal": round(total_ms, 2),
        "sucre_soluble_percent": round(sucre_total, 2),
        "mat_percent": round(mat_total, 2),
        "ufl_animal": round(ufl_total, 2),
        "cout_animal": round(cout_animal, 2),
        "cout_lot": round(cout_lot, 2),
        "alertes": alerts,
        "ingredients": [item.model_dump() for item in request.ingredients],
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


@router.get("/sync")
def get_sync() -> Dict[str, Any]:
    """Lister les espaces de synchronisation et les flux a connecter."""
    return {
        "connecteurs": CONNECTEURS_SYNC,
        "flux": FLUX_SYNC,
        "garde_fous": ["mode simulation", "validation humaine", "journal d'audit", "rejeu d'un flux", "controle doublons"],
    }


@router.post("/sync/connecter")
def connecter_sync(request: SyncConnectorRequest) -> Dict[str, Any]:
    """Enregistrer une configuration de connecteur en mode preparation."""
    connecteur = next((item for item in CONNECTEURS_SYNC if item["code"] == request.code), None)
    if not connecteur:
        raise HTTPException(status_code=404, detail="Connecteur introuvable")

    champs_renseignes = [cle for cle, valeur in request.parametres.items() if valeur]
    statut = "pret" if len(champs_renseignes) >= max(len(connecteur["champs"]) - 1, 1) else "configuration incomplete"

    return {
        "connecteur": connecteur["nom"],
        "code": request.code,
        "statut": statut,
        "frequence_minutes": request.frequence_minutes,
        "mode": request.mode,
        "journal_automatique": request.journal_automatique,
        "validation_humaine": request.validation_humaine,
        "champs_renseignes": champs_renseignes,
        "prochaines_actions": ["tester le flux", "controler les doublons", "valider le premier import"],
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


@router.get("/references-open-source")
def get_references_open_source() -> Dict[str, Any]:
    """Restituer les references open source retenues comme inspirations produit."""
    return {
        "decision": "conserver FastAPI, Next.js et PostgreSQL, puis reprendre les principes metier utiles sans changer de pile",
        "references": [
            {
                "nom": "Ekylibre",
                "apport": "profondeur ERP agricole, ateliers, comptabilite, stocks et PostGIS",
                "statut": "actif",
                "a_integrer": ["PostGIS", "couts par atelier", "stocks valorises", "exports robustes", "piste audit"],
            },
            {
                "nom": "farmOS",
                "apport": "registre terrain avec assets, logs et observations",
                "statut": "actif",
                "a_integrer": ["journal terrain canonique", "observations mobiles", "historique parcelle", "API terrain"],
            },
            {
                "nom": "farmOS Field Kit",
                "apport": "PWA terrain hors ligne avec persistance locale",
                "statut": "actif",
                "a_integrer": ["IndexedDB", "brouillons offline", "file de synchronisation", "gestion conflits"],
            },
            {
                "nom": "LiteFarm",
                "apport": "experience mobile, exploitations diversifiees, certification et indicateurs durables",
                "statut": "actif",
                "a_integrer": ["mode terrain", "certification", "indicateurs environnementaux", "parcours accessibles"],
            },
            {
                "nom": "FarmData2",
                "apport": "petites fermes bio, recolte, elevage, conditionnement, distribution et certification",
                "statut": "actif, pas encore production-ready",
                "a_integrer": ["preuves certification", "recolte", "conditionnement", "recertification"],
            },
            {
                "nom": "FarmVibes.AI",
                "apport": "workflows geospatiaux, satellite, meteo, NDVI et carbone",
                "statut": "actif",
                "a_integrer": ["connecteur geospatial optionnel", "NDVI", "meteo", "analyses IA apres stabilisation terrain"],
            },
        ],
        "prochains_lots": [
            "registre terrain canonique",
            "mode terrain offline",
            "parcellaire PostGIS progressif",
            "certification et durabilite",
            "stocks valorises et audit ERP",
        ],
    }
