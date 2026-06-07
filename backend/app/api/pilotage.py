"""
API de pilotage FarmFlow.

Ce module prépare le socle transverse façon ERP/Odoo agricole :
vue synthétique technique et économique, caisse, marges, banque,
alertes de flux, IA préparatoire et exports réglementaires.
"""
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field


router = APIRouter(prefix="/pilotage", tags=["pilotage"])


class ScenarioMargeRequest(BaseModel):
    """Entrées minimales pour simuler une marge brute agricole."""

    libelle: str = Field(..., description="Nom du scénario ou de l'atelier")
    surface_ha: float = Field(..., gt=0, description="Surface concernée en hectares")
    rendement: float = Field(..., ge=0, description="Rendement par hectare")
    prix_unitaire: float = Field(..., ge=0, description="Prix de vente par unité produite")
    aides: float = Field(0, ge=0, description="Aides ou primes rattachées au scénario")
    semences: float = Field(0, ge=0)
    engrais: float = Field(0, ge=0)
    phytos: float = Field(0, ge=0)
    alimentation: float = Field(0, ge=0)
    carburant: float = Field(0, ge=0)
    main_oeuvre: float = Field(0, ge=0)
    autres_charges_operationnelles: float = Field(0, ge=0)


class TransactionBancaire(BaseModel):
    """Transaction bancaire normalisée pour préparer la future synchro bancaire."""

    date_operation: date
    libelle: str
    montant: float
    contrepartie: Optional[str] = None
    categorie: Optional[str] = None


class AnalyseFluxRequest(BaseModel):
    """Lot de transactions à analyser avant intégration bancaire automatisée."""

    transactions: List[TransactionBancaire]
    solde_initial: float = 0


def _workspace_cards() -> List[Dict[str, Any]]:
    return [
        {
            "code": "technique",
            "titre": "Technique ferme",
            "description": "Animaux, parcelles, cultures, stocks, interventions, flotte et IoT.",
            "statut": "socle disponible",
        },
        {
            "code": "economie",
            "titre": "Économie & marges",
            "description": "Marge brute par atelier, simulateurs, prix de revient et écarts budget/réel.",
            "statut": "préparé",
        },
        {
            "code": "caisse",
            "titre": "Caisse & ventes directes",
            "description": "Tickets, moyens de paiement, clôtures de caisse et rapprochement comptable.",
            "statut": "préparé",
        },
        {
            "code": "banque",
            "titre": "Banque & trésorerie",
            "description": "Synchro bancaire, catégorisation, alertes de flux et prévision de trésorerie.",
            "statut": "préparé",
        },
        {
            "code": "reglementaire",
            "titre": "Exports réglementaires",
            "description": "FEC, journaux, grand livre, balances, TVA et exports techniques traçables.",
            "statut": "préparé",
        },
        {
            "code": "ia",
            "titre": "IA agricole",
            "description": "Assistant, OCR factures, détection d'anomalies, recommandations et synthèses.",
            "statut": "connecteurs à brancher",
        },
    ]


@router.get("/dashboard")
def get_dashboard() -> Dict[str, Any]:
    """Vue synthétique du futur environnement FarmFlow."""
    return {
        "nom": "FarmFlow Pilotage",
        "vision": "Un environnement type Odoo, spécialisé ferme, réunissant technique, économie, banque, caisse, IA et conformité.",
        "mis_a_jour": datetime.utcnow().isoformat() + "Z",
        "kpis": [
            {"label": "Ateliers suivis", "value": 8, "unit": "ateliers"},
            {"label": "Marge brute cible", "value": 1240, "unit": "€/ha"},
            {"label": "Alertes trésorerie", "value": 3, "unit": "alertes"},
            {"label": "Exports prêts", "value": 6, "unit": "formats"},
        ],
        "espaces": _workspace_cards(),
        "alertes": [
            {
                "niveau": "warning",
                "titre": "Décaissement carburant élevé",
                "description": "Flux carburant supérieur de 18% au budget mensuel simulé.",
            },
            {
                "niveau": "info",
                "titre": "Export comptable à valider",
                "description": "Préparer FEC, journaux et pièces justificatives avant clôture.",
            },
            {
                "niveau": "success",
                "titre": "Marge céréales positive",
                "description": "Le scénario de prix actuel reste au-dessus du seuil de rentabilité.",
            },
        ],
    }


@router.get("/caisse")
def get_caisse() -> Dict[str, Any]:
    """Préparation du module caisse pour vente directe et point de vente agricole."""
    return {
        "objectif": "Encaisser ventes boutique, marchés, paniers, animaux ou produits transformés.",
        "fonctionnalites": [
            "tickets et factures simplifiées",
            "espèces, carte bancaire, virement, chèque et avoirs",
            "clôture journalière avec écarts de caisse",
            "ventilation automatique vers ventes, TVA et comptabilité",
            "mode hors-ligne à prévoir pour marchés et bâtiments agricoles",
        ],
        "controles": ["fond de caisse", "total par moyen de paiement", "écarts", "journal de caisse"],
    }


@router.get("/marges")
def get_marges() -> Dict[str, Any]:
    """Vue économique préparatoire pour marges brutes et simulateurs."""
    return {
        "indicateurs": [
            "marge brute par culture, lot animal ou atelier",
            "prix de revient",
            "seuil de rentabilité",
            "écart budget / réalisé",
            "sensibilité prix, rendement, intrants et main d'œuvre",
        ],
        "ateliers_exemple": [
            {"nom": "Blé tendre", "marge_brute_ha": 1180, "seuil_rentabilite": 182},
            {"nom": "Maraîchage paniers", "marge_brute_ha": 8600, "seuil_rentabilite": 1.95},
            {"nom": "Bovin allaitant", "marge_brute_tete": 410, "seuil_rentabilite": 1450},
        ],
    }


@router.post("/marges/simuler")
def simuler_marge(request: ScenarioMargeRequest) -> Dict[str, Any]:
    """Calculer une marge brute simple pour valider le futur simulateur."""
    produit = request.surface_ha * request.rendement * request.prix_unitaire + request.aides
    charges = sum(
        [
            request.semences,
            request.engrais,
            request.phytos,
            request.alimentation,
            request.carburant,
            request.main_oeuvre,
            request.autres_charges_operationnelles,
        ]
    )
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
        "analyse": "rentable" if marge_brute >= 0 else "à revoir",
    }


@router.get("/banque")
def get_banque() -> Dict[str, Any]:
    """Préparer la synchro bancaire, l'analyse et les alertes de flux."""
    return {
        "statut": "connecteur bancaire à brancher",
        "connecteurs_prevus": ["Bridge", "Powens", "GoCardless Bank Account Data", "import CSV/OFX"],
        "analyses": [
            "catégorisation automatique des flux",
            "rapprochement factures / paiements",
            "détection des doublons et opérations inhabituelles",
            "alerte solde bas, gros décaissement, retard client ou prélèvement inconnu",
            "projection de trésorerie court terme",
        ],
    }


@router.post("/banque/analyser-flux")
def analyser_flux(request: AnalyseFluxRequest) -> Dict[str, Any]:
    """Analyser un lot de flux bancaires sans dépendre encore d'un connecteur externe."""
    encaissements = sum(t.montant for t in request.transactions if t.montant > 0)
    decaissements = abs(sum(t.montant for t in request.transactions if t.montant < 0))
    solde_final = request.solde_initial + encaissements - decaissements
    alertes = []

    for transaction in request.transactions:
        if transaction.montant < -2500:
            alertes.append(
                {
                    "niveau": "warning",
                    "transaction": transaction.libelle,
                    "message": "Décaissement important à valider.",
                }
            )
        if "prélèvement" in transaction.libelle.lower() and not transaction.categorie:
            alertes.append(
                {
                    "niveau": "info",
                    "transaction": transaction.libelle,
                    "message": "Prélèvement à catégoriser pour le rapprochement.",
                }
            )

    if solde_final < 0:
        alertes.append({"niveau": "critical", "message": "Solde final prévisionnel négatif."})

    return {
        "encaissements": round(encaissements, 2),
        "decaissements": round(decaissements, 2),
        "solde_final": round(solde_final, 2),
        "nombre_transactions": len(request.transactions),
        "alertes": alertes,
    }


@router.get("/ia/preparation")
def get_ia_preparation() -> Dict[str, Any]:
    """Décrire les points d'intégration IA à brancher progressivement."""
    return {
        "objectifs": [
            "assistant ferme contextualisé par données techniques et économiques",
            "OCR factures et bons de livraison",
            "détection d'anomalies bancaires, stocks et marges",
            "recommandations d'intervention ou d'achat selon historique",
            "synthèses de clôture et préparation réglementaire",
        ],
        "donnees_contextuelles": ["parcelles", "animaux", "stocks", "ventes", "banque", "comptabilité", "documents"],
        "garde_fous": ["validation humaine", "traçabilité des suggestions", "séparation conseil / décision", "journal d'audit"],
    }


@router.get("/exports/reglementaires")
def get_exports_reglementaires() -> Dict[str, Any]:
    """Lister les exports comptables et réglementaires à couvrir."""
    return {
        "formats": [
            {"code": "FEC", "label": "Fichier des écritures comptables", "priorite": "haute"},
            {"code": "JOURNAUX", "label": "Journaux comptables", "priorite": "haute"},
            {"code": "GRAND_LIVRE", "label": "Grand livre", "priorite": "haute"},
            {"code": "BALANCE", "label": "Balance générale", "priorite": "haute"},
            {"code": "TVA", "label": "Préparation déclarative TVA", "priorite": "moyenne"},
            {"code": "TRACABILITE", "label": "Traçabilité technique parcelles/animaux/stocks", "priorite": "moyenne"},
        ],
        "principes": [
            "exports horodatés",
            "données filtrables par exercice et journal",
            "piste d'audit et justificatifs liés",
            "formats CSV prêts pour expert-comptable et outils réglementaires",
        ],
    }
