"""
API Router pour la gestion des animaux
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from .. import schemas, models
from ..database import get_db
from ..schemas.animaux import (
    TypeAnimalCreate, TypeAnimalUpdate, TypeAnimalResponse,
    RaceCreate, RaceUpdate, RaceResponse,
    AnimalCreate, AnimalUpdate, AnimalResponse,
    SuiviSanteCreate, SuiviSanteUpdate, SuiviSanteResponse,
    ReproductionCreate, ReproductionUpdate, ReproductionResponse
)

router = APIRouter(prefix="/animaux", tags=["animaux"])


# TypeAnimal endpoints
@router.post("/types", response_model=TypeAnimalResponse, status_code=status.HTTP_201_CREATED)
def create_type_animal(type_animal: TypeAnimalCreate, db: Session = Depends(get_db)):
    """Créer un type d'animal"""
    db_type = models.TypeAnimal(**type_animal.model_dump())
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type


@router.get("/types", response_model=List[TypeAnimalResponse])
def get_types_animaux(db: Session = Depends(get_db)):
    """Lister tous les types d'animaux"""
    return db.query(models.TypeAnimal).all()


@router.get("/types/{type_id}", response_model=TypeAnimalResponse)
def get_type_animal(type_id: int, db: Session = Depends(get_db)):
    """Obtenir un type d'animal par ID"""
    db_type = db.query(models.TypeAnimal).filter(models.TypeAnimal.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Type d'animal non trouvé")
    return db_type


@router.put("/types/{type_id}", response_model=TypeAnimalResponse)
def update_type_animal(type_id: int, type_animal: TypeAnimalUpdate, db: Session = Depends(get_db)):
    """Mettre à jour un type d'animal"""
    db_type = db.query(models.TypeAnimal).filter(models.TypeAnimal.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Type d'animal non trouvé")
    for key, value in type_animal.model_dump(exclude_unset=True).items():
        setattr(db_type, key, value)
    db.commit()
    db.refresh(db_type)
    return db_type


@router.delete("/types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_type_animal(type_id: int, db: Session = Depends(get_db)):
    """Supprimer un type d'animal"""
    db_type = db.query(models.TypeAnimal).filter(models.TypeAnimal.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Type d'animal non trouvé")
    db.delete(db_type)
    db.commit()


# Race endpoints
@router.post("/races", response_model=RaceResponse, status_code=status.HTTP_201_CREATED)
def create_race(race: RaceCreate, db: Session = Depends(get_db)):
    """Créer une race"""
    db_race = models.Race(**race.model_dump())
    db.add(db_race)
    db.commit()
    db.refresh(db_race)
    return db_race


@router.get("/races", response_model=List[RaceResponse])
def get_races(db: Session = Depends(get_db)):
    """Lister toutes les races"""
    return db.query(models.Race).all()


@router.get("/races/{race_id}", response_model=RaceResponse)
def get_race(race_id: int, db: Session = Depends(get_db)):
    """Obtenir une race par ID"""
    db_race = db.query(models.Race).filter(models.Race.id == race_id).first()
    if not db_race:
        raise HTTPException(status_code=404, detail="Race non trouvée")
    return db_race


@router.put("/races/{race_id}", response_model=RaceResponse)
def update_race(race_id: int, race: RaceUpdate, db: Session = Depends(get_db)):
    """Mettre à jour une race"""
    db_race = db.query(models.Race).filter(models.Race.id == race_id).first()
    if not db_race:
        raise HTTPException(status_code=404, detail="Race non trouvée")
    for key, value in race.model_dump(exclude_unset=True).items():
        setattr(db_race, key, value)
    db.commit()
    db.refresh(db_race)
    return db_race


@router.delete("/races/{race_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_race(race_id: int, db: Session = Depends(get_db)):
    """Supprimer une race"""
    db_race = db.query(models.Race).filter(models.Race.id == race_id).first()
    if not db_race:
        raise HTTPException(status_code=404, detail="Race non trouvée")
    db.delete(db_race)
    db.commit()


# Animal endpoints
@router.post("/", response_model=AnimalResponse, status_code=status.HTTP_201_CREATED)
def create_animal(animal: AnimalCreate, db: Session = Depends(get_db)):
    """Créer un animal"""
    db_animal = models.Animal(**animal.model_dump())
    db.add(db_animal)
    db.commit()
    db.refresh(db_animal)
    return db_animal


@router.get("/", response_model=List[AnimalResponse])
def get_animaux(
    type_animal_id: Optional[int] = None,
    race_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lister tous les animaux avec filtres"""
    query = db.query(models.Animal)
    if type_animal_id:
        query = query.filter(models.Animal.type_animal_id == type_animal_id)
    if race_id:
        query = query.filter(models.Animal.race_id == race_id)
    if statut:
        query = query.filter(models.Animal.statut == statut)
    return query.all()


@router.get("/{animal_id}", response_model=AnimalResponse)
def get_animal(animal_id: int, db: Session = Depends(get_db)):
    """Obtenir un animal par ID"""
    db_animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal non trouvé")
    return db_animal


@router.get("/rfid/{rfid}", response_model=AnimalResponse)
def get_animal_by_rfid(rfid: str, db: Session = Depends(get_db)):
    """Obtenir un animal par RFID"""
    db_animal = db.query(models.Animal).filter(models.Animal.rfid == rfid).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal non trouvé")
    return db_animal


@router.put("/{animal_id}", response_model=AnimalResponse)
def update_animal(animal_id: int, animal: AnimalUpdate, db: Session = Depends(get_db)):
    """Mettre à jour un animal"""
    db_animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal non trouvé")
    for key, value in animal.model_dump(exclude_unset=True).items():
        setattr(db_animal, key, value)
    db.commit()
    db.refresh(db_animal)
    return db_animal


@router.delete("/{animal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_animal(animal_id: int, db: Session = Depends(get_db)):
    """Supprimer un animal"""
    db_animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal non trouvé")
    db.delete(db_animal)
    db.commit()


# SuiviSante endpoints
@router.post("/{animal_id}/sante", response_model=SuiviSanteResponse, status_code=status.HTTP_201_CREATED)
def create_suivi_sante(animal_id: int, suivi: SuiviSanteCreate, db: Session = Depends(get_db)):
    """Ajouter un suivi sanitaire"""
    db_animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal non trouvé")
    db_suivi = models.SuiviSante(**suivi.model_dump(), animal_id=animal_id)
    db.add(db_suivi)
    db.commit()
    db.refresh(db_suivi)
    return db_suivi


@router.get("/{animal_id}/sante", response_model=List[SuiviSanteResponse])
def get_suivi_sante(animal_id: int, db: Session = Depends(get_db)):
    """Lister le suivi sanitaire d'un animal"""
    db_animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal non trouvé")
    return db.query(models.SuiviSante).filter(models.SuiviSante.animal_id == animal_id).all()


# Reproduction endpoints
@router.post("/{animal_id}/reproduction", response_model=ReproductionResponse, status_code=status.HTTP_201_CREATED)
def create_reproduction(animal_id: int, reproduction: ReproductionCreate, db: Session = Depends(get_db)):
    """Ajouter un suivi de reproduction"""
    db_animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal non trouvé")
    db_reproduction = models.Reproduction(**reproduction.model_dump(), animal_id=animal_id)
    db.add(db_reproduction)
    db.commit()
    db.refresh(db_reproduction)
    return db_reproduction


@router.get("/{animal_id}/reproduction", response_model=List[ReproductionResponse])
def get_reproduction(animal_id: int, db: Session = Depends(get_db)):
    """Lister le suivi de reproduction d'un animal"""
    db_animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not db_animal:
        raise HTTPException(status_code=404, detail="Animal non trouvé")
    return db.query(models.Reproduction).filter(models.Reproduction.animal_id == animal_id).all()
