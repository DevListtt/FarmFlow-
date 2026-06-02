"""
API Router pour la gestion de la communication
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas.communication import (
    CanalCommunicationCreate, CanalCommunicationUpdate, CanalCommunicationResponse,
    ModeleMessageCreate, ModeleMessageUpdate, ModeleMessageResponse,
    CampagneCreate, CampagneUpdate, CampagneResponse,
    EnvoiMessageCreate, EnvoiMessageUpdate, EnvoiMessageResponse
)

router = APIRouter(prefix="/communication", tags=["communication"])


@router.post("/canaux", response_model=CanalCommunicationResponse, status_code=status.HTTP_201_CREATED)
def create_canal(canal: CanalCommunicationCreate, db: Session = Depends(get_db)):
    db_canal = models.CanalCommunication(**canal.model_dump())
    db.add(db_canal)
    db.commit()
    db.refresh(db_canal)
    return db_canal


@router.get("/canaux", response_model=List[CanalCommunicationResponse])
def get_canaux(db: Session = Depends(get_db)):
    return db.query(models.CanalCommunication).all()


@router.post("/modeles", response_model=ModeleMessageResponse, status_code=status.HTTP_201_CREATED)
def create_modele(modele: ModeleMessageCreate, db: Session = Depends(get_db)):
    db_modele = models.ModeleMessage(**modele.model_dump())
    db.add(db_modele)
    db.commit()
    db.refresh(db_modele)
    return db_modele


@router.get("/modeles", response_model=List[ModeleMessageResponse])
def get_modeles(db: Session = Depends(get_db)):
    return db.query(models.ModeleMessage).all()


@router.post("/campagnes", response_model=CampagneResponse, status_code=status.HTTP_201_CREATED)
def create_campagne(campagne: CampagneCreate, db: Session = Depends(get_db)):
    db_campagne = models.Campagne(**campagne.model_dump())
    db.add(db_campagne)
    db.commit()
    db.refresh(db_campagne)
    return db_campagne


@router.get("/campagnes", response_model=List[CampagneResponse])
def get_campagnes(
    statut: Optional[str] = None,
    type_message: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Campagne)
    if statut:
        query = query.filter(models.Campagne.statut == statut)
    if type_message:
        query = query.filter(models.Campagne.type_message == type_message)
    return query.all()


@router.post("/envois", response_model=EnvoiMessageResponse, status_code=status.HTTP_201_CREATED)
def create_envoi(envoi: EnvoiMessageCreate, db: Session = Depends(get_db)):
    db_envoi = models.EnvoiMessage(**envoi.model_dump())
    db.add(db_envoi)
    db.commit()
    db.refresh(db_envoi)
    return db_envoi


@router.get("/envois", response_model=List[EnvoiMessageResponse])
def get_envois(
    campagne_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.EnvoiMessage)
    if campagne_id:
        query = query.filter(models.EnvoiMessage.campagne_id == campagne_id)
    if statut:
        query = query.filter(models.EnvoiMessage.statut == statut)
    return query.all()
