"""
API Router pour la gestion de la flotte
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas.flotte import (
    TypeVehiculeCreate, TypeVehiculeUpdate, TypeVehiculeResponse,
    ConducteurCreate, ConducteurUpdate, ConducteurResponse,
    VehiculeCreate, VehiculeUpdate, VehiculeResponse,
    EntretienCreate, EntretienUpdate, EntretienResponse,
    CarburantCreate, CarburantUpdate, CarburantResponse
)

router = APIRouter(prefix="/flotte", tags=["flotte"])


@router.post("/types", response_model=TypeVehiculeResponse, status_code=status.HTTP_201_CREATED)
def create_type_vehicule(type_vehicule: TypeVehiculeCreate, db: Session = Depends(get_db)):
    db_type = models.TypeVehicule(**type_vehicule.model_dump())
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type


@router.get("/types", response_model=List[TypeVehiculeResponse])
def get_types_vehicule(db: Session = Depends(get_db)):
    return db.query(models.TypeVehicule).all()


@router.post("/conducteurs", response_model=ConducteurResponse, status_code=status.HTTP_201_CREATED)
def create_conducteur(conducteur: ConducteurCreate, db: Session = Depends(get_db)):
    db_conducteur = models.Conducteur(**conducteur.model_dump())
    db.add(db_conducteur)
    db.commit()
    db.refresh(db_conducteur)
    return db_conducteur


@router.get("/conducteurs", response_model=List[ConducteurResponse])
def get_conducteurs(db: Session = Depends(get_db)):
    return db.query(models.Conducteur).all()


@router.post("/vehicules", response_model=VehiculeResponse, status_code=status.HTTP_201_CREATED)
def create_vehicule(vehicule: VehiculeCreate, db: Session = Depends(get_db)):
    db_vehicule = models.Vehicule(**vehicule.model_dump())
    db.add(db_vehicule)
    db.commit()
    db.refresh(db_vehicule)
    return db_vehicule


@router.get("/vehicules", response_model=List[VehiculeResponse])
def get_vehicules(
    type_vehicule_id: Optional[int] = None,
    conducteur_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Vehicule)
    if type_vehicule_id:
        query = query.filter(models.Vehicule.type_vehicule_id == type_vehicule_id)
    if conducteur_id:
        query = query.filter(models.Vehicule.conducteur_id == conducteur_id)
    if statut:
        query = query.filter(models.Vehicule.statut == statut)
    return query.all()


@router.get("/vehicules/{vehicule_id}", response_model=VehiculeResponse)
def get_vehicule(vehicule_id: int, db: Session = Depends(get_db)):
    db_vehicule = db.query(models.Vehicule).filter(models.Vehicule.id == vehicule_id).first()
    if not db_vehicule:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
    return db_vehicule


@router.post("/{vehicule_id}/entretiens", response_model=EntretienResponse, status_code=status.HTTP_201_CREATED)
def create_entretien(vehicule_id: int, entretien: EntretienCreate, db: Session = Depends(get_db)):
    db_vehicule = db.query(models.Vehicule).filter(models.Vehicule.id == vehicule_id).first()
    if not db_vehicule:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
    db_entretien = models.Entretien(**entretien.model_dump(), vehicule_id=vehicule_id)
    db.add(db_entretien)
    db.commit()
    db.refresh(db_entretien)
    return db_entretien


@router.get("/{vehicule_id}/entretiens", response_model=List[EntretienResponse])
def get_entretiens(vehicule_id: int, db: Session = Depends(get_db)):
    db_vehicule = db.query(models.Vehicule).filter(models.Vehicule.id == vehicule_id).first()
    if not db_vehicule:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
    return db.query(models.Entretien).filter(models.Entretien.vehicule_id == vehicule_id).all()


@router.post("/{vehicule_id}/carburants", response_model=CarburantResponse, status_code=status.HTTP_201_CREATED)
def create_carburant(vehicule_id: int, carburant: CarburantCreate, db: Session = Depends(get_db)):
    db_vehicule = db.query(models.Vehicule).filter(models.Vehicule.id == vehicule_id).first()
    if not db_vehicule:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
    db_carburant = models.Carburant(**carburant.model_dump(), vehicule_id=vehicule_id)
    db.add(db_carburant)
    db.commit()
    db.refresh(db_carburant)
    return db_carburant


@router.get("/{vehicule_id}/carburants", response_model=List[CarburantResponse])
def get_carburants(vehicule_id: int, db: Session = Depends(get_db)):
    db_vehicule = db.query(models.Vehicule).filter(models.Vehicule.id == vehicule_id).first()
    if not db_vehicule:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
    return db.query(models.Carburant).filter(models.Carburant.vehicule_id == vehicule_id).all()
