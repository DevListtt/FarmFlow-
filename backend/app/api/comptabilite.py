"""
API Router pour la gestion de la comptabilité
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas.comptabilite import (
    CompteComptableCreate, CompteComptableUpdate, CompteComptableResponse,
    JournalCreate, JournalUpdate, JournalResponse,
    EcritureComptableCreate, EcritureComptableUpdate, EcritureComptableResponse,
    FournisseurComptableCreate, FournisseurComptableUpdate, FournisseurComptableResponse,
    FactureFournisseurCreate, FactureFournisseurUpdate, FactureFournisseurResponse
)

router = APIRouter(prefix="/comptabilite", tags=["comptabilite"])


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
