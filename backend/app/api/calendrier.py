"""
API Router pour la gestion du calendrier
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas.calendrier import (
    TypeEvenementCreate, TypeEvenementUpdate, TypeEvenementResponse,
    EvenementCreate, EvenementUpdate, EvenementResponse,
    RappelCreate, RappelUpdate, RappelResponse
)
from datetime import datetime, date

router = APIRouter(prefix="/calendrier", tags=["calendrier"])


@router.post("/types", response_model=TypeEvenementResponse, status_code=status.HTTP_201_CREATED)
def create_type_evenement(type_evenement: TypeEvenementCreate, db: Session = Depends(get_db)):
    db_type = models.TypeEvenement(**type_evenement.model_dump())
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type


@router.get("/types", response_model=List[TypeEvenementResponse])
def get_types_evenement(db: Session = Depends(get_db)):
    return db.query(models.TypeEvenement).all()


@router.post("/", response_model=EvenementResponse, status_code=status.HTTP_201_CREATED)
def create_evenement(evenement: EvenementCreate, db: Session = Depends(get_db)):
    db_evenement = models.Evenement(**evenement.model_dump())
    db.add(db_evenement)
    db.commit()
    db.refresh(db_evenement)
    return db_evenement


@router.get("/", response_model=List[EvenementResponse])
def get_evenements(
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    type_evenement: Optional[str] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Evenement)
    if date_debut:
        query = query.filter(models.Evenement.date_debut >= date_debut)
    if date_fin:
        query = query.filter(models.Evenement.date_debut <= date_fin)
    if type_evenement:
        query = query.filter(models.Evenement.type_evenement_str == type_evenement)
    if statut:
        query = query.filter(models.Evenement.statut == statut)
    return query.all()


@router.get("/{evenement_id}", response_model=EvenementResponse)
def get_evenement(evenement_id: int, db: Session = Depends(get_db)):
    db_evenement = db.query(models.Evenement).filter(models.Evenement.id == evenement_id).first()
    if not db_evenement:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    return db_evenement


@router.post("/{evenement_id}/rappels", response_model=RappelResponse, status_code=status.HTTP_201_CREATED)
def create_rappel(evenement_id: int, rappel: RappelCreate, db: Session = Depends(get_db)):
    db_evenement = db.query(models.Evenement).filter(models.Evenement.id == evenement_id).first()
    if not db_evenement:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    db_rappel = models.Rappel(**rappel.model_dump(), evenement_id=evenement_id)
    db.add(db_rappel)
    db.commit()
    db.refresh(db_rappel)
    return db_rappel


@router.get("/{evenement_id}/rappels", response_model=List[RappelResponse])
def get_rappels(evenement_id: int, db: Session = Depends(get_db)):
    db_evenement = db.query(models.Evenement).filter(models.Evenement.id == evenement_id).first()
    if not db_evenement:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    return db.query(models.Rappel).filter(models.Rappel.evenement_id == evenement_id).all()


@router.get("/prochains", response_model=List[EvenementResponse])
def get_prochains_evenements(db: Session = Depends(get_db)):
    """Obtenir les prochains événements"""
    today = date.today()
    return db.query(models.Evenement).filter(
        models.Evenement.date_debut >= today,
        models.Evenement.statut != "annulé"
    ).order_by(models.Evenement.date_debut).limit(10).all()
