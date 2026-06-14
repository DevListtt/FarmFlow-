"""
Registre applicatif FarmFlow.

Ce fichier enrichit les modules avec des metadonnees de type ERP :
dependances, etats metier, permissions, domaines de donnees et controles.
"""
import json
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict, List


MANIFEST_CATALOG_PATH = Path(__file__).with_name("module_manifest_catalog.json")
REQUIRED_MANIFEST_KEYS = {"dependances", "etats", "permissions", "domaines_donnees", "contrats", "controles"}


DEFAULT_EXTENSION: Dict[str, List[str]] = {
    "dependances": [],
    "etats": ["brouillon", "actif", "archive"],
    "permissions": ["lecture", "ecriture", "validation"],
    "domaines_donnees": ["referentiel"],
    "contrats": ["audit", "export"],
    "controles": ["droits", "journalisation"],
}


MODULE_EXTENSIONS: Dict[str, Dict[str, List[str]]] = {
    "pilotage": {
        "dependances": [],
        "etats": ["actif", "a-controler"],
        "permissions": ["lecture", "configuration", "validation"],
        "domaines_donnees": ["kpis", "alertes", "configuration"],
        "contrats": ["dashboard", "catalogue", "recommandation"],
        "controles": ["coherence modules", "roles", "workflows"],
    },
    "noyau-operationnel": {
        "dependances": ["backoffice", "stocks", "comptabilite"],
        "etats": ["simulation", "pret", "valide"],
        "permissions": ["operation", "validation", "supervision"],
        "domaines_donnees": ["achats", "stock", "caisse", "banque", "iot"],
        "contrats": ["transaction", "mouvement stock", "ecriture comptable"],
        "controles": ["double ecriture", "stock negatif", "audit"],
    },
    "backoffice": {
        "dependances": [],
        "etats": ["brouillon", "actif", "inactif"],
        "permissions": ["lecture", "ecriture", "admin referentiel"],
        "domaines_donnees": ["produits", "tiers", "lots", "tarifs"],
        "contrats": ["referentiel", "audit", "export csv"],
        "controles": ["unicite code", "seuil stock", "TVA"],
    },
    "historiques": {
        "dependances": ["backoffice", "noyau-operationnel"],
        "etats": ["consultation", "exporte"],
        "permissions": ["lecture", "export"],
        "domaines_donnees": ["tickets", "achats", "mouvements", "ecritures"],
        "contrats": ["detail", "export", "audit"],
        "controles": ["tracabilite", "filtrage", "pagination"],
    },
    "parcelles": {
        "dependances": ["stocks", "marges"],
        "etats": ["brouillon", "validee", "regroupee", "archivee"],
        "permissions": ["lecture carte", "edition carte", "validation terrain"],
        "domaines_donnees": ["geojson", "ilots", "cultures", "chantiers"],
        "contrats": ["cartographie", "import geojson", "export geojson"],
        "controles": ["surface", "geometrie", "ilot"],
    },
    "cultures-interventions": {
        "dependances": ["parcelles", "stocks", "flotte-materiel"],
        "etats": ["planifiee", "en-cours", "realisee", "controlee"],
        "permissions": ["planification", "saisie terrain", "validation"],
        "domaines_donnees": ["interventions", "intrants", "temps", "IFT"],
        "contrats": ["chantier", "consommation stock", "cout atelier"],
        "controles": ["fenetre meteo", "dose", "delai avant recolte"],
    },
    "elevage": {
        "dependances": ["stocks", "calendrier", "marges"],
        "etats": ["actif", "en-suivi", "sorti"],
        "permissions": ["lecture troupeau", "saisie sanitaire", "validation"],
        "domaines_donnees": ["animaux", "lots", "sanitaire", "alimentation"],
        "contrats": ["identification", "mouvement animal", "suivi lot"],
        "controles": ["identification", "evenement sanitaire", "ration"],
    },
    "stocks": {
        "dependances": ["backoffice"],
        "etats": ["disponible", "reserve", "bloque", "sorti"],
        "permissions": ["lecture stock", "mouvement", "inventaire"],
        "domaines_donnees": ["lots", "mouvements", "valorisation", "seuils"],
        "contrats": ["entree", "sortie", "reservation", "inventaire"],
        "controles": ["stock negatif", "lot", "valorisation"],
    },
    "achats": {
        "dependances": ["backoffice", "stocks", "comptabilite", "banque-tresorerie"],
        "etats": ["brouillon", "commande", "receptionnee", "facturee", "payee"],
        "permissions": ["achat", "reception", "validation facture"],
        "domaines_donnees": ["fournisseurs", "commandes", "receptions", "factures"],
        "contrats": ["commande fournisseur", "reception stock", "ecriture fournisseur"],
        "controles": ["prix", "quantite recue", "TVA deductible"],
    },
    "ventes-caisse": {
        "dependances": ["crm", "stocks", "comptabilite"],
        "etats": ["panier", "valide", "cloture", "rapproche"],
        "permissions": ["vente", "encaissement", "cloture"],
        "domaines_donnees": ["tickets", "paiements", "clients", "clotures"],
        "contrats": ["ticket", "paiement", "sortie stock", "ecriture vente"],
        "controles": ["fond de caisse", "TVA collectee", "moyen paiement"],
    },
    "commandes-clients": {
        "dependances": ["crm", "stocks", "ventes-caisse", "comptabilite"],
        "etats": ["brouillon", "reservee", "preparation", "convertie", "annulee"],
        "permissions": ["commande", "reservation", "conversion caisse"],
        "domaines_donnees": ["catalogue", "reservations", "clients", "retraits"],
        "contrats": ["reservation stock", "annulation", "conversion ticket"],
        "controles": ["disponibilite", "lot", "remise client"],
    },
    "crm": {
        "dependances": ["backoffice"],
        "etats": ["prospect", "client", "inactif"],
        "permissions": ["lecture client", "edition client", "segmentation"],
        "domaines_donnees": ["clients", "segments", "contrats", "relances"],
        "contrats": ["fiche client", "segment", "historique"],
        "controles": ["doublon client", "remise", "consentement"],
    },
    "comptabilite": {
        "dependances": ["backoffice"],
        "etats": ["brouillon", "validee", "rapprochee", "cloturee"],
        "permissions": ["lecture compta", "validation ecriture", "export"],
        "domaines_donnees": ["journaux", "ecritures", "TVA", "grand livre"],
        "contrats": ["ecriture double", "journal", "export reglementaire"],
        "controles": ["equilibre debit credit", "compte", "periode"],
    },
    "banque-tresorerie": {
        "dependances": ["comptabilite"],
        "etats": ["importe", "a-categoriser", "rapproche", "ecart"],
        "permissions": ["import banque", "categorisation", "rapprochement"],
        "domaines_donnees": ["transactions", "soldes", "rapprochements"],
        "contrats": ["import bancaire", "regle categorisation", "lettrage"],
        "controles": ["doublon bancaire", "ecart montant", "date valeur"],
    },
    "marges": {
        "dependances": ["stocks", "comptabilite"],
        "etats": ["scenario", "simule", "valide"],
        "permissions": ["lecture marge", "simulation", "validation hypothese"],
        "domaines_donnees": ["prix de revient", "charges", "revenus", "ration"],
        "contrats": ["simulation", "stress test", "cout lot"],
        "controles": ["hypotheses", "cout incomplet", "seuil rentabilite"],
    },
    "flotte-materiel": {
        "dependances": ["calendrier"],
        "etats": ["disponible", "reserve", "maintenance", "indisponible"],
        "permissions": ["planning materiel", "maintenance", "cout horaire"],
        "domaines_donnees": ["materiels", "entretiens", "carburant", "planning"],
        "contrats": ["reservation", "entretien", "cout horaire"],
        "controles": ["maintenance due", "disponibilite", "cout carburant"],
    },
    "rh": {
        "dependances": ["calendrier"],
        "etats": ["planifie", "present", "absent", "valide"],
        "permissions": ["planning equipe", "saisie temps", "validation"],
        "domaines_donnees": ["employes", "temps", "absences", "competences"],
        "contrats": ["planning", "temps de travail", "absence"],
        "controles": ["heures", "competence", "conflit planning"],
    },
    "calendrier": {
        "dependances": [],
        "etats": ["a-faire", "planifie", "termine"],
        "permissions": ["lecture agenda", "edition agenda", "rappel"],
        "domaines_donnees": ["evenements", "rappels", "echeances"],
        "contrats": ["evenement", "recurrence", "notification"],
        "controles": ["date", "recurrence", "assignation"],
    },
    "documents-reglementaire": {
        "dependances": ["comptabilite", "historiques"],
        "etats": ["prepare", "controle", "exporte", "archive"],
        "permissions": ["lecture document", "generation", "export"],
        "domaines_donnees": ["pieces", "exports", "audit", "tracabilite"],
        "contrats": ["piece justificative", "export", "archive"],
        "controles": ["piece manquante", "periode", "signature"],
    },
    "ia-agricole": {
        "dependances": ["pilotage", "historiques"],
        "etats": ["suggestion", "a-valider", "valide", "rejete"],
        "permissions": ["analyse", "validation humaine", "audit"],
        "domaines_donnees": ["anomalies", "OCR", "recommandations"],
        "contrats": ["suggestion", "explication", "validation"],
        "controles": ["source", "confiance", "validation humaine"],
    },
    "communication": {
        "dependances": ["crm"],
        "etats": ["brouillon", "programme", "envoye", "erreur"],
        "permissions": ["campagne", "envoi", "segmentation"],
        "domaines_donnees": ["campagnes", "destinataires", "modeles"],
        "contrats": ["message", "campagne", "notification"],
        "controles": ["destinataire", "canal", "consentement"],
    },
    "integrations": {
        "dependances": ["noyau-operationnel"],
        "etats": ["a-configurer", "test", "actif", "erreur"],
        "permissions": ["configuration connecteur", "test", "supervision"],
        "domaines_donnees": ["webhooks", "connecteurs", "iot", "paiement"],
        "contrats": ["webhook", "mapping", "journal sync"],
        "controles": ["secret", "mapping", "rejeu"],
    },
}


def load_manifest_catalog() -> Dict[str, Any]:
    """Charger le catalogue JSON versionne des manifestes modules."""
    if not MANIFEST_CATALOG_PATH.exists():
        return {"manifest_version": 0, "source": "fallback", "modules": deepcopy(MODULE_EXTENSIONS)}

    with MANIFEST_CATALOG_PATH.open("r", encoding="utf-8") as manifest_file:
        catalog = json.load(manifest_file)

    modules = catalog.get("modules", {})
    if not isinstance(modules, dict):
        raise ValueError("Le catalogue de manifestes doit contenir un objet 'modules'")

    for code, manifest in modules.items():
        missing_keys = REQUIRED_MANIFEST_KEYS - set(manifest)
        if missing_keys:
            raise ValueError(f"Manifeste incomplet pour {code}: {', '.join(sorted(missing_keys))}")
        for key in REQUIRED_MANIFEST_KEYS:
            if not isinstance(manifest[key], list):
                raise ValueError(f"Le champ {key} du manifeste {code} doit etre une liste")

    return catalog


def load_module_extensions() -> Dict[str, Dict[str, List[str]]]:
    """Retourner les extensions de manifestes, avec fallback embarque."""
    catalog = load_manifest_catalog()
    return deepcopy(catalog.get("modules", MODULE_EXTENSIONS))


def _extension_for(code: str) -> Dict[str, List[str]]:
    extension = deepcopy(DEFAULT_EXTENSION)
    extension.update(deepcopy(load_module_extensions().get(code, {})))
    return extension


def enrich_apps(apps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Ajouter les metadonnees de manifeste sans changer les champs historiques."""
    app_codes = {app["code"] for app in apps}
    catalog = load_manifest_catalog()
    enriched: List[Dict[str, Any]] = []
    for app in apps:
        next_app = deepcopy(app)
        extension = _extension_for(app["code"])
        missing_dependencies = [code for code in extension["dependances"] if code not in app_codes]
        next_app.update(extension)
        next_app["installable"] = not missing_dependencies
        next_app["dependances_manquantes"] = missing_dependencies
        next_app["manifest_version"] = catalog.get("manifest_version", 0)
        next_app["manifest_source"] = catalog.get("source", "fallback")
        enriched.append(next_app)
    return enriched


def build_dependency_graph(apps: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    nodes = [
        {
            "code": app["code"],
            "nom": app.get("nom") or app.get("name"),
            "categorie": app.get("categorie") or app.get("category"),
            "statut": app.get("statut") or app.get("status"),
        }
        for app in apps
    ]
    edges = [
        {"module": app["code"], "dependance": dependency, "type": "dependance"}
        for app in apps
        for dependency in app.get("dependances", [])
    ]
    return {"nodes": nodes, "edges": edges}


def validate_registry(
    apps: List[Dict[str, Any]],
    workflows: List[Dict[str, Any]],
    roles: List[Dict[str, Any]],
    category_labels: Dict[str, str],
) -> Dict[str, Any]:
    app_codes = [app["code"] for app in apps]
    app_code_set = set(app_codes)
    category_codes = set(category_labels)
    accepted_scopes = category_codes | {"configuration", "exports"}
    errors: List[str] = []
    warnings: List[str] = []

    duplicates = sorted({code for code in app_codes if app_codes.count(code) > 1})
    for code in duplicates:
        errors.append(f"Module duplique: {code}")

    for app in apps:
        for dependency in app.get("dependances", []):
            if dependency not in app_code_set:
                errors.append(f"Dependance inconnue: {app['code']} -> {dependency}")
        if not app.get("endpoints"):
            warnings.append(f"Aucun endpoint declare: {app['code']}")
        if not app.get("permissions"):
            warnings.append(f"Aucune permission declaree: {app['code']}")

    for workflow in workflows:
        for module in workflow.get("modules", []):
            if module not in app_code_set:
                errors.append(f"Workflow {workflow['code']} reference un module inconnu: {module}")

    for role in roles:
        for access in role.get("acces", []):
            if access not in app_code_set and access not in accepted_scopes:
                errors.append(f"Role {role['code']} reference un acces inconnu: {access}")

    return {
        "statut": "ok" if not errors else "erreur",
        "erreurs": errors,
        "avertissements": warnings,
        "modules": len(apps),
        "workflows": len(workflows),
        "roles": len(roles),
    }


def build_architecture_payload(
    apps: List[Dict[str, Any]],
    workflows: List[Dict[str, Any]],
    roles: List[Dict[str, Any]],
    category_labels: Dict[str, str],
) -> Dict[str, Any]:
    graph = build_dependency_graph(apps)
    validation = validate_registry(apps, workflows, roles, category_labels)
    manifest_catalog = load_manifest_catalog()
    return {
        "nom": "Architecture modulaire FarmFlow",
        "manifest_version": manifest_catalog.get("manifest_version", 0),
        "manifest_source": manifest_catalog.get("source", "fallback"),
        "principes": [
            "un manifeste par module",
            "dependances explicites",
            "etats metier standardises",
            "permissions rattachees aux roles",
            "contrats API audites",
            "workflows transverses plutot que silos",
        ],
        "couches": [
            {"code": "interface", "role": "experience utilisateur, navigation, saisie et visualisation"},
            {"code": "api", "role": "contrats HTTP, validation, orchestration metier"},
            {"code": "metier", "role": "transactions, etats, calculs, controles"},
            {"code": "donnees", "role": "modeles, migrations, audit, exports"},
            {"code": "connecteurs", "role": "banque, paiement, IoT, cartographie, automatisations"},
        ],
        "graph": graph,
        "validation": validation,
        "prochain_durcissement": [
            "eclater le catalogue en manifestes par module quand la structure sera stabilisee",
            "generer un client API type depuis le schema OpenAPI",
            "ajouter migrations Alembic pour chaque nouveau modele",
            "poser des tests transactionnels sur stock, caisse, banque et compta",
            "introduire une matrice droits x roles x modules",
        ],
    }
