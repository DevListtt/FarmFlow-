"""
API Router pour la gestion de la comptabilite.
"""
from collections import defaultdict
from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..models.transactionnel import EcritureAutoAgri, OperationBancaireAgri, TicketCaisseAgri
from ..schemas.comptabilite import (
    CompteComptableCreate, CompteComptableUpdate, CompteComptableResponse,
    JournalCreate, JournalUpdate, JournalResponse,
    EcritureComptableCreate, EcritureComptableUpdate, EcritureComptableResponse,
    FournisseurComptableCreate, FournisseurComptableUpdate, FournisseurComptableResponse,
    FactureFournisseurCreate, FactureFournisseurUpdate, FactureFournisseurResponse,
)
from ..services import transactionnel as tx

router = APIRouter(prefix="/comptabilite", tags=["comptabilite"])


class ValidationEcrituresRequest(BaseModel):
    references: List[str]
    statut: str = "validee"


class RapprochementRequest(BaseModel):
    operation_reference: str
    document_reference: str
    categorie: str = "vente"


PLAN_COMPTABLE_AGRI: List[Dict[str, Any]] = [
    {"compte": "411", "libelle": "Clients", "type": "tiers"},
    {"compte": "401", "libelle": "Fournisseurs", "type": "tiers"},
    {"compte": "512", "libelle": "Banque", "type": "tresorerie"},
    {"compte": "531", "libelle": "Caisse", "type": "tresorerie"},
    {"compte": "5112", "libelle": "Cartes a encaisser", "type": "attente"},
    {"compte": "707", "libelle": "Ventes produits ferme", "type": "produit"},
    {"compte": "603", "libelle": "Variation stocks / couts", "type": "charge"},
    {"compte": "4457", "libelle": "TVA collectee", "type": "taxe"},
    {"compte": "4456", "libelle": "TVA deductible", "type": "taxe"},
    {"compte": "44566", "libelle": "TVA deductible intrants", "type": "taxe"},
]


def _entry_dict(entry: EcritureAutoAgri) -> Dict[str, Any]:
    return {
        "reference": entry.reference,
        "date": entry.date_ecriture.isoformat() if entry.date_ecriture else None,
        "journal": entry.journal,
        "compte": entry.compte,
        "libelle": entry.libelle,
        "debit": round(entry.debit or 0, 2),
        "credit": round(entry.credit or 0, 2),
        "solde": round((entry.debit or 0) - (entry.credit or 0), 2),
        "document_type": entry.document_type,
        "document_reference": entry.document_reference,
        "statut": entry.statut,
    }


def _bank_dict(operation: OperationBancaireAgri) -> Dict[str, Any]:
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


@router.get("/vue")
def get_vue_comptable(db: Session = Depends(get_db)) -> Dict[str, Any]:
    tx.seed_demo(db)
    entries = db.query(EcritureAutoAgri).order_by(EcritureAutoAgri.created_at.desc()).limit(300).all()
    operations = db.query(OperationBancaireAgri).order_by(OperationBancaireAgri.created_at.desc()).limit(80).all()
    tickets = db.query(TicketCaisseAgri).order_by(TicketCaisseAgri.created_at.desc()).limit(40).all()

    journal_totals: Dict[str, Dict[str, float]] = defaultdict(lambda: {"debit": 0.0, "credit": 0.0, "lignes": 0})
    account_totals: Dict[str, Dict[str, float]] = defaultdict(lambda: {"debit": 0.0, "credit": 0.0, "lignes": 0})
    for entry in entries:
        journal_totals[entry.journal]["debit"] += entry.debit or 0
        journal_totals[entry.journal]["credit"] += entry.credit or 0
        journal_totals[entry.journal]["lignes"] += 1
        account_key = entry.compte or "N/A"
        account_totals[account_key]["debit"] += entry.debit or 0
        account_totals[account_key]["credit"] += entry.credit or 0
        account_totals[account_key]["lignes"] += 1

    debit_total = sum(entry.debit or 0 for entry in entries)
    credit_total = sum(entry.credit or 0 for entry in entries)
    tva_collectee_accounts = {"4457", "44571", "445711"}
    tva_deductible_accounts = {"4456", "44566", "445661", "44562"}
    tva_collectee = sum(entry.credit or 0 for entry in entries if entry.compte in tva_collectee_accounts)
    tva_deductible = sum(entry.debit or 0 for entry in entries if entry.compte in tva_deductible_accounts)
    waiting_card = sum((entry.debit or 0) - (entry.credit or 0) for entry in entries if entry.compte == "5112")
    bank_to_match = [operation for operation in operations if operation.statut == "a_rapprocher"]

    return {
        "date": date.today().isoformat(),
        "kpis": [
            {"label": "Ecritures", "value": len(entries), "detail": "lignes automatiques"},
            {"label": "Balance", "value": round(debit_total - credit_total, 2), "detail": "debit - credit"},
            {"label": "TVA nette", "value": round(tva_collectee - tva_deductible, 2), "detail": "collectee - deductible"},
            {"label": "A rapprocher", "value": len(bank_to_match), "detail": "operations banque"},
        ],
        "journaux": [
            {
                "journal": journal,
                "debit": round(values["debit"], 2),
                "credit": round(values["credit"], 2),
                "lignes": values["lignes"],
                "ecart": round(values["debit"] - values["credit"], 2),
            }
            for journal, values in sorted(journal_totals.items())
        ],
        "balance": [
            {
                "compte": account,
                "debit": round(values["debit"], 2),
                "credit": round(values["credit"], 2),
                "solde": round(values["debit"] - values["credit"], 2),
                "lignes": values["lignes"],
            }
            for account, values in sorted(account_totals.items())
        ],
        "grand_livre": [_entry_dict(entry) for entry in entries],
        "banque": [_bank_dict(operation) for operation in operations],
        "plan": PLAN_COMPTABLE_AGRI,
        "tva": {
            "collectee": round(tva_collectee, 2),
            "deductible": round(tva_deductible, 2),
            "nette": round(tva_collectee - tva_deductible, 2),
        },
        "controles": [
            {"code": "balance", "label": "Equilibre debit/credit", "statut": "ok" if round(debit_total - credit_total, 2) == 0 else "a controler"},
            {"code": "tpe", "label": "Cartes a encaisser", "statut": "a rapprocher" if waiting_card else "ok", "montant": round(waiting_card, 2)},
            {"code": "tickets", "label": "Tickets ventes", "statut": "ok", "volume": len(tickets)},
            {"code": "fec", "label": "Export controle", "statut": "pret a generer"},
        ],
    }


@router.post("/ecritures/valider-auto")
def valider_ecritures_auto(request: ValidationEcrituresRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    if not request.references:
        raise HTTPException(status_code=400, detail="Aucune ecriture a valider")
    entries = db.query(EcritureAutoAgri).filter(EcritureAutoAgri.reference.in_(request.references)).all()
    for entry in entries:
        entry.statut = request.statut
    tx.audit(db, "compta", "validation-lot", "validation ecritures", {"references": request.references, "statut": request.statut})
    db.commit()
    return {"statut": "ecritures mises a jour", "references": [entry.reference for entry in entries], "nouveau_statut": request.statut}


@router.post("/rapprochements")
def rapprocher_operation(request: RapprochementRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    operation = db.query(OperationBancaireAgri).filter(OperationBancaireAgri.reference == request.operation_reference).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation bancaire introuvable")
    operation.document_reference = request.document_reference
    operation.categorie = request.categorie
    operation.statut = "rapprochee"
    operation.score = max(operation.score or 0, 95)
    tx.audit(db, "banque", operation.reference, "rapprochement comptable", {"document": request.document_reference})
    db.commit()
    return {"statut": "operation rapprochee", "operation": _bank_dict(operation)}


@router.post("/comptes", response_model=CompteComptableResponse, status_code=status.HTTP_201_CREATED)
def create_compte(compte: CompteComptableCreate, db: Session = Depends(get_db)):
    db_compte = models.CompteComptable(**compte.model_dump())
    db.add(db_compte)
    db.commit()
    db.refresh(db_compte)
    return db_compte


@router.get("/comptes", response_model=List[CompteComptableResponse])
def get_comptes(
    type_compte: Optional[str] = None,
    actif: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.CompteComptable)
    if type_compte:
        query = query.filter(models.CompteComptable.type_compte == type_compte)
    if actif is not None:
        query = query.filter(models.CompteComptable.actif == actif)
    return query.all()


@router.post("/journaux", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
def create_journal(journal: JournalCreate, db: Session = Depends(get_db)):
    db_journal = models.Journal(**journal.model_dump())
    db.add(db_journal)
    db.commit()
    db.refresh(db_journal)
    return db_journal


@router.get("/journaux", response_model=List[JournalResponse])
def get_journaux(db: Session = Depends(get_db)):
    return db.query(models.Journal).all()


@router.post("/ecritures", response_model=EcritureComptableResponse, status_code=status.HTTP_201_CREATED)
def create_ecriture(ecriture: EcritureComptableCreate, db: Session = Depends(get_db)):
    db_ecriture = models.EcritureComptable(**ecriture.model_dump())
    db.add(db_ecriture)
    db.commit()
    db.refresh(db_ecriture)
    return db_ecriture


@router.get("/ecritures", response_model=List[EcritureComptableResponse])
def get_ecritures(
    journal_id: Optional[int] = None,
    compte_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.EcritureComptable)
    if journal_id:
        query = query.filter(models.EcritureComptable.journal_id == journal_id)
    if compte_id:
        query = query.filter(models.EcritureComptable.compte_id == compte_id)
    return query.all()


@router.post("/fournisseurs", response_model=FournisseurComptableResponse, status_code=status.HTTP_201_CREATED)
def create_fournisseur(fournisseur: FournisseurComptableCreate, db: Session = Depends(get_db)):
    db_fournisseur = models.FournisseurComptable(**fournisseur.model_dump())
    db.add(db_fournisseur)
    db.commit()
    db.refresh(db_fournisseur)
    return db_fournisseur


@router.get("/fournisseurs", response_model=List[FournisseurComptableResponse])
def get_fournisseurs(db: Session = Depends(get_db)):
    return db.query(models.FournisseurComptable).all()


@router.post("/factures", response_model=FactureFournisseurResponse, status_code=status.HTTP_201_CREATED)
def create_facture_fournisseur(facture: FactureFournisseurCreate, db: Session = Depends(get_db)):
    db_facture = models.FactureFournisseur(**facture.model_dump())
    db.add(db_facture)
    db.commit()
    db.refresh(db_facture)
    return db_facture


@router.get("/factures", response_model=List[FactureFournisseurResponse])
def get_factures_fournisseurs(
    fournisseur_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.FactureFournisseur)
    if fournisseur_id:
        query = query.filter(models.FactureFournisseur.fournisseur_id == fournisseur_id)
    if statut:
        query = query.filter(models.FactureFournisseur.statut == statut)
    return query.all()
