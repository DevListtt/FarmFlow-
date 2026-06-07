"""
API de pilotage FarmFlow.

Ce module prépare le socle transverse façon ERP/Odoo agricole :
vue synthétique technique et économique, caisse, marges, banque,
alertes de flux, IA préparatoire et exports réglementaires.
"""
import csv
import io
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..models.ventes import StatutVenteEnum


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


class LigneCaisseRequest(BaseModel):
    """Ligne de ticket de caisse agricole."""

    produit_id: Optional[int] = None
    libelle: str = Field(..., min_length=1)
    quantite: float = Field(..., gt=0)
    prix_unitaire_ht: float = Field(..., ge=0)
    taux_tva: float = Field(20, ge=0)
    remise: float = Field(0, ge=0)


class EncaissementRequest(BaseModel):
    """Ticket encaissé depuis une caisse ou une vente directe."""

    lignes: List[LigneCaisseRequest] = Field(..., min_length=1)
    mode_paiement: str = Field("espèces", min_length=1)
    client_id: Optional[int] = None
    reference: Optional[str] = None
    observations: Optional[str] = None



def _prochaines_fonctions() -> List[Dict[str, Any]]:
    return [
        {
            "priorite": "P0",
            "titre": "Restaurer les vrais écrans métier",
            "module": "frontend",
            "impact": "remplacer les maquettes par des pages CRUD métier utilisables",
        },
        {
            "priorite": "P0",
            "titre": "Caisse + ventes + stock",
            "module": "caisse",
            "impact": "encaisser, sortir le stock, générer le journal de caisse et préparer la compta",
        },
        {
            "priorite": "P0",
            "titre": "Marge réelle par atelier",
            "module": "marges",
            "impact": "lier interventions, intrants, temps, ventes et aides pour une marge fiable",
        },
        {
            "priorite": "P1",
            "titre": "Import bancaire et rapprochement",
            "module": "banque",
            "impact": "import CSV/OFX, catégorisation, alertes et rapprochement facture/paiement",
        },
        {
            "priorite": "P1",
            "titre": "Exports réglementaires",
            "module": "comptabilite",
            "impact": "FEC, journaux, grand livre, balance, TVA et piste d'audit",
        },
        {
            "priorite": "P2",
            "titre": "IA assistée et contrôlée",
            "module": "ia",
            "impact": "OCR, synthèses et anomalies avec validation humaine et traçabilité",
        },
    ]


def _roadmap_fonctionnelle() -> Dict[str, Any]:
    return {
        "orientation": "Construire d'abord un socle fiable technique + économique, puis automatiser banque et IA.",
        "prochaines_fonctions": _prochaines_fonctions(),
        "lots": [
            {
                "nom": "Socle exploitation",
                "objectif": "avoir des données fiables par atelier",
                "fonctions": [
                    "authentification, droits et audit",
                    "pages métier CRUD pour animaux, parcelles, stocks, ventes et comptabilité",
                    "journal d'activité reliant intervention, stock, temps et coût",
                ],
            },
            {
                "nom": "Caisse et ventes directes",
                "objectif": "encaisser et produire une donnée comptable propre",
                "fonctions": [
                    "tickets, factures, avoirs et remises",
                    "clôture journalière et Z de caisse",
                    "mise à jour stock et export comptable",
                ],
            },
            {
                "nom": "Marge brute et simulateurs",
                "objectif": "connaître le prix de revient et les seuils de rentabilité",
                "fonctions": [
                    "budget/réalisé par atelier",
                    "analyse de sensibilité prix, rendement et intrants",
                    "marges culture, troupeau, transformation et vente directe",
                ],
            },
            {
                "nom": "Banque et trésorerie",
                "objectif": "surveiller les flux et anticiper les tensions",
                "fonctions": [
                    "import CSV/OFX avant connecteurs bancaires",
                    "catégorisation et rapprochement",
                    "alertes solde bas, doublon, gros décaissement et retard client",
                ],
            },
            {
                "nom": "IA et conformité",
                "objectif": "automatiser sans perdre le contrôle ni la traçabilité",
                "fonctions": [
                    "OCR factures et bons",
                    "détection d'anomalies",
                    "exports FEC, journaux, grand livre, balance et TVA",
                ],
            },
        ],
    }


def _format_csv_response(filename: str, rows: List[List[Any]]) -> StreamingResponse:
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerows(rows)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def _parse_amount(value: str) -> float:
    normalized = str(value).strip().replace(" ", "").replace(",", ".")
    return float(normalized or 0)


def _parse_date(value: str) -> date:
    raw = str(value).strip()[:10]
    for pattern in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(raw, pattern).date()
        except ValueError:
            continue
    raise HTTPException(status_code=400, detail=f"Format de date bancaire non reconnu: {value}")

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
        "prochaines_fonctions": _prochaines_fonctions(),
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


@router.get("/roadmap")
def get_roadmap() -> Dict[str, Any]:
    """Propositions fonctionnelles priorisées pour les prochaines itérations."""
    return _roadmap_fonctionnelle()


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




@router.post("/caisse/ticket")
def encaisser_ticket(request: EncaissementRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Créer une vente encaissée et sortir les stocks liés aux produits vendus."""
    reference = request.reference or f"CAISSE-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    existing = db.query(models.Vente).filter(models.Vente.reference == reference).first()
    if existing:
        raise HTTPException(status_code=409, detail="Référence de ticket déjà utilisée")

    vente = models.Vente(
        client_id=request.client_id,
        reference=reference,
        statut=StatutVenteEnum.PAYEE,
        mode_paiement=request.mode_paiement,
        date_paiement=date.today(),
        observations=request.observations,
    )
    db.add(vente)
    db.flush()

    total_ht = 0.0
    total_tva = 0.0
    lignes_response = []

    for ligne in request.lignes:
        produit = None
        if ligne.produit_id is not None:
            produit = db.query(models.Produit).filter(models.Produit.id == ligne.produit_id).first()
            if not produit:
                raise HTTPException(status_code=404, detail=f"Produit {ligne.produit_id} introuvable")

        ligne_ht = max(ligne.quantite * ligne.prix_unitaire_ht - ligne.remise, 0)
        ligne_tva = ligne_ht * ligne.taux_tva / 100
        ligne_ttc = ligne_ht + ligne_tva
        total_ht += ligne_ht
        total_tva += ligne_tva

        detail = models.DetailVente(
            vente_id=vente.id,
            produit_id=ligne.produit_id,
            quantite=ligne.quantite,
            prix_unitaire=ligne.prix_unitaire_ht,
            remises=ligne.remise,
            tva=ligne.taux_tva,
            total_ht=ligne_ht,
            total_tva=ligne_tva,
            total_ttc=ligne_ttc,
            observations=ligne.libelle,
        )
        db.add(detail)

        stock_sorti = False
        if produit and produit.stock_id:
            stock = db.query(models.Stock).filter(models.Stock.id == produit.stock_id).first()
            if stock:
                stock.quantite = (stock.quantite or 0) - ligne.quantite
                db.add(
                    models.MouvementStock(
                        stock_id=stock.id,
                        type_mouvement="sortie",
                        quantite=ligne.quantite,
                        unite=stock.unite,
                        reference=reference,
                        cout_unitaire=stock.prix_achat or 0,
                        cout_total=(stock.prix_achat or 0) * ligne.quantite,
                        destination="caisse",
                        operateur="FarmFlow",
                        observations=f"Vente caisse {reference}",
                    )
                )
                stock_sorti = True

        lignes_response.append(
            {
                "libelle": ligne.libelle,
                "quantite": ligne.quantite,
                "total_ht": round(ligne_ht, 2),
                "total_tva": round(ligne_tva, 2),
                "total_ttc": round(ligne_ttc, 2),
                "stock_sorti": stock_sorti,
            }
        )

    vente.total_ht = round(total_ht, 2)
    vente.total_tva = round(total_tva, 2)
    vente.total_ttc = round(total_ht + total_tva, 2)
    db.commit()
    db.refresh(vente)

    return {
        "vente_id": vente.id,
        "reference": vente.reference,
        "mode_paiement": vente.mode_paiement,
        "total_ht": vente.total_ht,
        "total_tva": vente.total_tva,
        "total_ttc": vente.total_ttc,
        "lignes": lignes_response,
        "message": "Ticket encaissé, vente créée et stocks liés mis à jour.",
    }


@router.get("/caisse/journal")
def get_journal_caisse(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Journal de caisse simple basé sur les ventes payées."""
    ventes = db.query(models.Vente).filter(models.Vente.statut == StatutVenteEnum.PAYEE).all()
    total = sum((vente.total_ttc or 0) for vente in ventes)
    par_mode: Dict[str, float] = {}
    for vente in ventes:
        mode = vente.mode_paiement or "non renseigné"
        par_mode[mode] = round(par_mode.get(mode, 0) + (vente.total_ttc or 0), 2)

    return {
        "nombre_tickets": len(ventes),
        "total_ttc": round(total, 2),
        "par_mode_paiement": par_mode,
        "tickets": [
            {
                "id": vente.id,
                "reference": vente.reference,
                "date": vente.date_vente.isoformat() if vente.date_vente else None,
                "mode_paiement": vente.mode_paiement,
                "total_ttc": vente.total_ttc,
            }
            for vente in ventes[-50:]
        ],
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


@router.get("/marges/reelles")
def get_marges_reelles(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Calculer les marges réelles depuis ventes, produits, coûts de production et stocks."""
    details = db.query(models.DetailVente).all()
    ateliers: Dict[str, Dict[str, float]] = {}

    for detail in details:
        produit = detail.produit
        atelier = produit.type_produit.value if produit and produit.type_produit else "non_categorise"
        chiffre_affaires = detail.total_ht if detail.total_ht is not None else detail.quantite * detail.prix_unitaire
        cout_unitaire = 0.0
        if produit:
            cout_unitaire = produit.cout_production or (produit.stock.prix_achat if produit.stock else 0) or 0
        cout = cout_unitaire * (detail.quantite or 0)

        if atelier not in ateliers:
            ateliers[atelier] = {"chiffre_affaires": 0.0, "couts_directs": 0.0, "marge_brute": 0.0}
        ateliers[atelier]["chiffre_affaires"] += chiffre_affaires or 0
        ateliers[atelier]["couts_directs"] += cout
        ateliers[atelier]["marge_brute"] += (chiffre_affaires or 0) - cout

    lignes = []
    for atelier, valeurs in ateliers.items():
        ca = valeurs["chiffre_affaires"]
        marge = valeurs["marge_brute"]
        lignes.append(
            {
                "atelier": atelier,
                "chiffre_affaires": round(ca, 2),
                "couts_directs": round(valeurs["couts_directs"], 2),
                "marge_brute": round(marge, 2),
                "taux_marge": round((marge / ca) * 100, 2) if ca else None,
            }
        )

    return {
        "source": "ventes.details + produits.cout_production + stocks.prix_achat",
        "ateliers": lignes,
        "total_marge_brute": round(sum(item["marge_brute"] for item in lignes), 2),
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


@router.post("/banque/import-csv")
async def importer_flux_bancaires_csv(file: UploadFile = File(...), solde_initial: float = 0) -> Dict[str, Any]:
    """Importer un CSV bancaire et retourner une analyse sans persistance.

    Colonnes acceptées : date/date_operation, libelle/libellé, montant, categorie/catégorie, contrepartie.
    """
    content = await file.read()
    text = content.decode("utf-8-sig")
    sample = text[:2048]
    dialect = csv.Sniffer().sniff(sample, delimiters=";,	,") if sample.strip() else csv.excel
    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    transactions: List[TransactionBancaire] = []

    for row in reader:
        normalized = {str(key).strip().lower(): value for key, value in row.items() if key}
        raw_date = normalized.get("date_operation") or normalized.get("date")
        raw_libelle = normalized.get("libelle") or normalized.get("libellé") or normalized.get("description")
        raw_montant = normalized.get("montant") or normalized.get("amount")
        if not raw_date or not raw_libelle or raw_montant is None:
            continue
        transactions.append(
            TransactionBancaire(
                date_operation=_parse_date(raw_date),
                libelle=raw_libelle,
                montant=_parse_amount(raw_montant),
                contrepartie=normalized.get("contrepartie"),
                categorie=normalized.get("categorie") or normalized.get("catégorie"),
            )
        )

    analyse = analyser_flux(AnalyseFluxRequest(transactions=transactions, solde_initial=solde_initial))
    analyse["fichier"] = file.filename
    analyse["transactions_importees"] = [transaction.model_dump() for transaction in transactions[:100]]
    return analyse


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

@router.get("/exports/fec.csv")
def exporter_fec_csv(db: Session = Depends(get_db)) -> StreamingResponse:
    """Exporter les écritures comptables dans une structure compatible FEC simplifiée."""
    rows: List[List[Any]] = [[
        "JournalCode",
        "JournalLib",
        "EcritureNum",
        "EcritureDate",
        "CompteNum",
        "CompteLib",
        "PieceRef",
        "EcritureLib",
        "Debit",
        "Credit",
    ]]
    ecritures = db.query(models.EcritureComptable).all()
    for ecriture in ecritures:
        rows.append([
            ecriture.journal.code if ecriture.journal else "",
            ecriture.journal.nom if ecriture.journal else "",
            ecriture.id,
            ecriture.date.isoformat() if ecriture.date else "",
            ecriture.compte.numero if ecriture.compte else "",
            ecriture.compte.nom if ecriture.compte else "",
            ecriture.reference or "",
            ecriture.libelle,
            f"{ecriture.debit or 0:.2f}",
            f"{ecriture.credit or 0:.2f}",
        ])
    return _format_csv_response(f"fec_{datetime.utcnow().strftime('%Y%m%d')}.csv", rows)


@router.get("/exports/journal-caisse.csv")
def exporter_journal_caisse_csv(db: Session = Depends(get_db)) -> StreamingResponse:
    """Exporter le journal de caisse issu des ventes payées."""
    rows: List[List[Any]] = [["Date", "Reference", "ModePaiement", "TotalHT", "TVA", "TotalTTC"]]
    ventes = db.query(models.Vente).filter(models.Vente.statut == StatutVenteEnum.PAYEE).all()
    for vente in ventes:
        rows.append([
            vente.date_vente.isoformat() if vente.date_vente else "",
            vente.reference or "",
            vente.mode_paiement or "",
            f"{vente.total_ht or 0:.2f}",
            f"{vente.total_tva or 0:.2f}",
            f"{vente.total_ttc or 0:.2f}",
        ])
    return _format_csv_response(f"journal_caisse_{datetime.utcnow().strftime('%Y%m%d')}.csv", rows)
