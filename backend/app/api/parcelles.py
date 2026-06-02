"""
API Router pour la gestion des parcelles et cultures
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.parcelles import (
    TypeSolCreate, TypeSolUpdate, TypeSolResponse,
    ParcelleCreate, ParcelleUpdate, ParcelleResponse,
    CultureCreate, CultureUpdate, CultureResponse,
    ItineraireTechniqueCreate, ItineraireTechniqueUpdate, ItineraireTechniqueResponse,
    InterventionCreate, InterventionUpdate, InterventionResponse
)
from .. import models

router = APIRouter(prefix="/parcelles", tags=["parcelles"])


# TypeSol endpoints
@router.post("/types-sol", response_model=TypeSolResponse, status_code=status.HTTP_201_CREATED)
def create_type_sol(type_sol: TypeSolCreate, db: Session = Depends(get_db)):
    db_type = models.TypeSol(**type_sol.model_dump())
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type


@router.get("/types-sol", response_model=List[TypeSolResponse])
def get_types_sol(db: Session = Depends(get_db)):
    return db.query(models.TypeSol).all()


@router.get("/types-sol/{type_id}", response_model=TypeSolResponse)
def get_type_sol(type_id: int, db: Session = Depends(get_db)):
    db_type = db.query(models.TypeSol).filter(models.TypeSol.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Type de sol non trouvé")
    return db_type


@router.put("/types-sol/{type_id}", response_model=TypeSolResponse)
def update_type_sol(type_id: int, type_sol: TypeSolUpdate, db: Session = Depends(get_db)):
    db_type = db.query(models.TypeSol).filter(models.TypeSol.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Type de sol non trouvé")
    for key, value in type_sol.model_dump(exclude_unset=True).items():
        setattr(db_type, key, value)
    db.commit()
    db.refresh(db_type)
    return db_type


@router.delete("/types-sol/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_type_sol(type_id: int, db: Session = Depends(get_db)):
    db_type = db.query(models.TypeSol).filter(models.TypeSol.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Type de sol non trouvé")
    db.delete(db_type)
    db.commit()


# Parcelle endpoints
@router.post("/", response_model=ParcelleResponse, status_code=status.HTTP_201_CREATED)
def create_parcelle(parcelle: ParcelleCreate, db: Session = Depends(get_db)):
    db_parcelle = models.Parcelle(**parcelle.model_dump())
    db.add(db_parcelle)
    db.commit()
    db.refresh(db_parcelle)
    return db_parcelle


@router.get("/", response_model=List[ParcelleResponse])
def get_parcelles(
    type_sol_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Parcelle)
    if type_sol_id:
        query = query.filter(models.Parcelle.type_sol_id == type_sol_id)
    if statut:
        query = query.filter(models.Parcelle.statut == statut)
    return query.all()


@router.get("/{parcelle_id}", response_model=ParcelleResponse)
def get_parcelle(parcelle_id: int, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    return db_parcelle


@router.put("/{parcelle_id}", response_model=ParcelleResponse)
def update_parcelle(parcelle_id: int, parcelle: ParcelleUpdate, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    for key, value in parcelle.model_dump(exclude_unset=True).items():
        setattr(db_parcelle, key, value)
    db.commit()
    db.refresh(db_parcelle)
    return db_parcelle


@router.delete("/{parcelle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parcelle(parcelle_id: int, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    db.delete(db_parcelle)
    db.commit()


# Culture endpoints
@router.post("/{parcelle_id}/cultures", response_model=CultureResponse, status_code=status.HTTP_201_CREATED)
def create_culture(parcelle_id: int, culture: CultureCreate, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    db_culture = models.Culture(**culture.model_dump(), parcelle_id=parcelle_id)
    db.add(db_culture)
    db.commit()
    db.refresh(db_culture)
    return db_culture


@router.get("/{parcelle_id}/cultures", response_model=List[CultureResponse])
def get_cultures(parcelle_id: int, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    return db.query(models.Culture).filter(models.Culture.parcelle_id == parcelle_id).all()


# ItineraireTechnique endpoints
@router.post("/{parcelle_id}/itineraire", response_model=ItineraireTechniqueResponse, status_code=status.HTTP_201_CREATED)
def create_itineraire(parcelle_id: int, itineraire: ItineraireTechniqueCreate, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    db_itineraire = models.ItineraireTechnique(**itineraire.model_dump(), parcelle_id=parcelle_id)
    db.add(db_itineraire)
    db.commit()
    db.refresh(db_itineraire)
    return db_itineraire


@router.get("/{parcelle_id}/itineraire", response_model=ItineraireTechniqueResponse)
def get_itineraire(parcelle_id: int, db: Session = Depends(get_db)):
    db_itineraire = db.query(models.ItineraireTechnique).filter(models.ItineraireTechnique.parcelle_id == parcelle_id).first()
    if not db_itineraire:
        raise HTTPException(status_code=404, detail="Itinéraire technique non trouvé")
    return db_itineraire


# Intervention endpoints
@router.post("/{parcelle_id}/interventions", response_model=InterventionResponse, status_code=status.HTTP_201_CREATED)
def create_intervention(parcelle_id: int, intervention: InterventionCreate, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    db_intervention = models.Intervention(**intervention.model_dump(), parcelle_id=parcelle_id)
    db.add(db_intervention)
    db.commit()
    db.refresh(db_intervention)
    return db_intervention


@router.get("/{parcelle_id}/interventions", response_model=List[InterventionResponse])
def get_interventions(parcelle_id: int, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    return db.query(models.Intervention).filter(models.Intervention.parcelle_id == parcelle_id).all()
