"""
API Router pour la gestion des chantiers
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas.chantiers import (
    ChantierCreate, ChantierUpdate, ChantierResponse,
    TacheCreate, TacheUpdate, TacheResponse,
    EquipementCreate, EquipementUpdate, EquipementResponse,
    MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse
)

router = APIRouter(prefix="/chantiers", tags=["chantiers"])


@router.post("/", response_model=ChantierResponse, status_code=status.HTTP_201_CREATED)
def create_chantier(chantier: ChantierCreate, db: Session = Depends(get_db)):
    db_chantier = models.Chantier(**chantier.model_dump())
    db.add(db_chantier)
    db.commit()
    db.refresh(db_chantier)
    return db_chantier


@router.get("/", response_model=List[ChantierResponse])
def get_chantiers(
    statut: Optional[str] = None,
    priorite: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Chantier)
    if statut:
        query = query.filter(models.Chantier.statut == statut)
    if priorite:
        query = query.filter(models.Chantier.priorite == priorite)
    return query.all()


@router.get("/{chantier_id}", response_model=ChantierResponse)
def get_chantier(chantier_id: int, db: Session = Depends(get_db)):
    db_chantier = db.query(models.Chantier).filter(models.Chantier.id == chantier_id).first()
    if not db_chantier:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    return db_chantier


@router.post("/{chantier_id}/taches", response_model=TacheResponse, status_code=status.HTTP_201_CREATED)
def create_tache(chantier_id: int, tache: TacheCreate, db: Session = Depends(get_db)):
    db_chantier = db.query(models.Chantier).filter(models.Chantier.id == chantier_id).first()
    if not db_chantier:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    db_tache = models.Tache(**tache.model_dump(), chantier_id=chantier_id)
    db.add(db_tache)
    db.commit()
    db.refresh(db_tache)
    return db_tache


@router.get("/{chantier_id}/taches", response_model=List[TacheResponse])
def get_taches(chantier_id: int, db: Session = Depends(get_db)):
    db_chantier = db.query(models.Chantier).filter(models.Chantier.id == chantier_id).first()
    if not db_chantier:
        raise HTTPException(status_code=404, detail="Chantier non trouvé")
    return db.query(models.Tache).filter(models.Tache.chantier_id == chantier_id).all()


@router.post("/equipements", response_model=EquipementResponse, status_code=status.HTTP_201_CREATED)
def create_equipement(equipement: EquipementCreate, db: Session = Depends(get_db)):
    db_equipement = models.Equipement(**equipement.model_dump())
    db.add(db_equipement)
    db.commit()
    db.refresh(db_equipement)
    return db_equipement


@router.get("/equipements", response_model=List[EquipementResponse])
def get_equipements(db: Session = Depends(get_db)):
    return db.query(models.Equipement).all()


@router.post("/{equipement_id}/maintenances", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance(equipement_id: int, maintenance: MaintenanceCreate, db: Session = Depends(get_db)):
    db_equipement = db.query(models.Equipement).filter(models.Equipement.id == equipement_id).first()
    if not db_equipement:
        raise HTTPException(status_code=404, detail="Équipement non trouvé")
    db_maintenance = models.Maintenance(**maintenance.model_dump(), equipement_id=equipement_id)
    db.add(db_maintenance)
    db.commit()
    db.refresh(db_maintenance)
    return db_maintenance


@router.get("/{equipement_id}/maintenances", response_model=List[MaintenanceResponse])
def get_maintenances(equipement_id: int, db: Session = Depends(get_db)):
    db_equipement = db.query(models.Equipement).filter(models.Equipement.id == equipement_id).first()
    if not db_equipement:
        raise HTTPException(status_code=404, detail="Équipement non trouvé")
    return db.query(models.Maintenance).filter(models.Maintenance.equipement_id == equipement_id).all()
