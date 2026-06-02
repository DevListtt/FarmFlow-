"""
API Router pour la gestion du CRM
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas.crm import (
    ProspectCreate, ProspectUpdate, ProspectResponse,
    CommandeCreate, CommandeUpdate, CommandeResponse,
    FactureCreate, FactureUpdate, FactureResponse,
    SegmentClientCreate, SegmentClientUpdate, SegmentClientResponse,
    HistoriqueClientCreate, HistoriqueClientUpdate, HistoriqueClientResponse
)

router = APIRouter(prefix="/crm", tags=["crm"])


@router.post("/prospects", response_model=ProspectResponse, status_code=status.HTTP_201_CREATED)
def create_prospect(prospect: ProspectCreate, db: Session = Depends(get_db)):
    db_prospect = models.Prospect(**prospect.model_dump())
    db.add(db_prospect)
    db.commit()
    db.refresh(db_prospect)
    return db_prospect


@router.get("/prospects", response_model=List[ProspectResponse])
def get_prospects(
    statut: Optional[str] = None,
    segment: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Prospect)
    if statut:
        query = query.filter(models.Prospect.statut == statut)
    if segment:
        query = query.filter(models.Prospect.segment == segment)
    return query.all()


@router.post("/commandes", response_model=CommandeResponse, status_code=status.HTTP_201_CREATED)
def create_commande(commande: CommandeCreate, db: Session = Depends(get_db)):
    db_commande = models.Commande(**commande.model_dump())
    db.add(db_commande)
    db.commit()
    db.refresh(db_commande)
    return db_commande


@router.get("/commandes", response_model=List[CommandeResponse])
def get_commandes(
    client_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Commande)
    if client_id:
        query = query.filter(models.Commande.client_id == client_id)
    if statut:
        query = query.filter(models.Commande.statut == statut)
    return query.all()


@router.post("/factures", response_model=FactureResponse, status_code=status.HTTP_201_CREATED)
def create_facture(facture: FactureCreate, db: Session = Depends(get_db)):
    db_facture = models.Facture(**facture.model_dump())
    db.add(db_facture)
    db.commit()
    db.refresh(db_facture)
    return db_facture


@router.get("/factures", response_model=List[FactureResponse])
def get_factures(
    client_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Facture)
    if client_id:
        query = query.filter(models.Facture.client_id == client_id)
    if statut:
        query = query.filter(models.Facture.statut == statut)
    return query.all()


@router.post("/segments", response_model=SegmentClientResponse, status_code=status.HTTP_201_CREATED)
def create_segment(segment: SegmentClientCreate, db: Session = Depends(get_db)):
    db_segment = models.SegmentClient(**segment.model_dump())
    db.add(db_segment)
    db.commit()
    db.refresh(db_segment)
    return db_segment


@router.get("/segments", response_model=List[SegmentClientResponse])
def get_segments(db: Session = Depends(get_db)):
    return db.query(models.SegmentClient).all()


@router.post("/historique", response_model=HistoriqueClientResponse, status_code=status.HTTP_201_CREATED)
def create_historique(historique: HistoriqueClientCreate, db: Session = Depends(get_db)):
    db_historique = models.HistoriqueClient(**historique.model_dump())
    db.add(db_historique)
    db.commit()
    db.refresh(db_historique)
    return db_historique


@router.get("/historique", response_model=List[HistoriqueClientResponse])
def get_historique(
    client_id: Optional[int] = None,
    prospect_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.HistoriqueClient)
    if client_id:
        query = query.filter(models.HistoriqueClient.client_id == client_id)
    if prospect_id:
        query = query.filter(models.HistoriqueClient.prospect_id == prospect_id)
    return query.all()
