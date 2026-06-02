"""
Schémas Pydantic pour les animaux
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class TypeAnimalEnum(str, Enum):
    bovin = "bovin"
    caprin = "caprin"
    ovin = "ovin"
    porcin = "porcin"
    volaille = "volaille"
    autre = "autre"


class SexeEnum(str, Enum):
    male = "male"
    femelle = "femelle"
    inconnu = "inconnu"


class StatutAnimalEnum(str, Enum):
    actif = "actif"
    vendu = "vendu"
    mort = "mort"
    malade = "malade"
    retire = "retiré"


# TypeAnimal
class TypeAnimalBase(BaseModel):
    nom: str = Field(..., max_length=50)
    description: Optional[str] = None


class TypeAnimalCreate(TypeAnimalBase):
    pass


class TypeAnimalUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None


class TypeAnimalResponse(TypeAnimalBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Race
class RaceBase(BaseModel):
    nom: str = Field(..., max_length=100)
    type_animal_id: Optional[int] = None
    description: Optional[str] = None
    poids_moyen: Optional[float] = None
    production_lait: Optional[float] = None


class RaceCreate(RaceBase):
    pass


class RaceUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    type_animal_id: Optional[int] = None
    description: Optional[str] = None
    poids_moyen: Optional[float] = None
    production_lait: Optional[float] = None


class RaceResponse(RaceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Animal
class AnimalBase(BaseModel):
    rfid: str = Field(..., max_length=50)
    nom: Optional[str] = Field(None, max_length=100)
    type_animal_id: Optional[int] = None
    race_id: Optional[int] = None
    sexe: SexeEnum = SexeEnum.inconnu
    date_naissance: Optional[date] = None
    date_entree: Optional[date] = None
    poids: Optional[float] = None
    statut: StatutAnimalEnum = StatutAnimalEnum.actif
    mere_id: Optional[int] = None
    pere_id: Optional[int] = None
    notes: Optional[str] = None


class AnimalCreate(AnimalBase):
    pass


class AnimalUpdate(BaseModel):
    rfid: Optional[str] = Field(None, max_length=50)
    nom: Optional[str] = Field(None, max_length=100)
    type_animal_id: Optional[int] = None
    race_id: Optional[int] = None
    sexe: Optional[SexeEnum] = None
    date_naissance: Optional[date] = None
    date_entree: Optional[date] = None
    poids: Optional[float] = None
    statut: Optional[StatutAnimalEnum] = None
    mere_id: Optional[int] = None
    pere_id: Optional[int] = None
    notes: Optional[str] = None


class AnimalResponse(AnimalBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# SuiviSante
class SuiviSanteBase(BaseModel):
    animal_id: int
    date: date
    type_soin: str = Field(..., max_length=100)
    produit_utilise: Optional[str] = Field(None, max_length=200)
    dose: Optional[float] = None
    cout: Optional[float] = None
    observations: Optional[str] = None
    veterinaire: Optional[str] = Field(None, max_length=100)
    prochain_rappel: Optional[date] = None


class SuiviSanteCreate(SuiviSanteBase):
    pass


class SuiviSanteUpdate(BaseModel):
    animal_id: Optional[int] = None
    date: Optional[date] = None
    type_soin: Optional[str] = Field(None, max_length=100)
    produit_utilise: Optional[str] = Field(None, max_length=200)
    dose: Optional[float] = None
    cout: Optional[float] = None
    observations: Optional[str] = None
    veterinaire: Optional[str] = Field(None, max_length=100)
    prochain_rappel: Optional[date] = None


class SuiviSanteResponse(SuiviSanteBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Reproduction
class ReproductionBase(BaseModel):
    animal_id: int
    type_reproduction: str = Field(..., max_length=50)
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    partenaire_id: Optional[int] = None
    nombre_enfants: Optional[int] = None
    statut: Optional[str] = Field(None, max_length=50)
    observations: Optional[str] = None


class ReproductionCreate(ReproductionBase):
    pass


class ReproductionUpdate(BaseModel):
    animal_id: Optional[int] = None
    type_reproduction: Optional[str] = Field(None, max_length=50)
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    partenaire_id: Optional[int] = None
    nombre_enfants: Optional[int] = None
    statut: Optional[str] = Field(None, max_length=50)
    observations: Optional[str] = None


class ReproductionResponse(ReproductionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
