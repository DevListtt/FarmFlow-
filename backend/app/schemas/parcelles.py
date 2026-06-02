"""
Schémas Pydantic pour les parcelles et cultures
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class TypeSolEnum(str, Enum):
    argileux = "argileux"
    sableux = "sableux"
    limoneux = "limoneux"
    calcaire = "calcaire"
    tourbeux = "tourbeux"
    autre = "autre"


class StatutParcelleEnum(str, Enum):
    libre = "libre"
    en_culture = "en_culture"
    en_jachere = "en_jachere"
    en_entretien = "en_entretien"


class TypeCultureEnum(str, Enum):
    cereale = "céréale"
    oleagineux = "oléagineux"
    proteagineux = "proteagineux"
    legume = "légume"
    fruit = "fruit"
    fourragere = "fourragère"
    autre = "autre"


# TypeSol
class TypeSolBase(BaseModel):
    nom: str = Field(..., max_length=50)
    description: Optional[str] = None
    ph_ideal_min: Optional[float] = None
    ph_ideal_max: Optional[float] = None


class TypeSolCreate(TypeSolBase):
    pass


class TypeSolUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    ph_ideal_min: Optional[float] = None
    ph_ideal_max: Optional[float] = None


class TypeSolResponse(TypeSolBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Parcelle
class ParcelleBase(BaseModel):
    nom: str = Field(..., max_length=100)
    code: str = Field(..., max_length=20)
    surface: float = Field(..., gt=0)
    type_sol_id: Optional[int] = None
    statut: StatutParcelleEnum = StatutParcelleEnum.libre
    localisation: Optional[str] = Field(None, max_length=200)
    altitude: Optional[float] = None
    exposition: Optional[str] = Field(None, max_length=50)
    pente: Optional[float] = None
    irrigation: bool = False
    notes: Optional[str] = None


class ParcelleCreate(ParcelleBase):
    pass


class ParcelleUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    code: Optional[str] = Field(None, max_length=20)
    surface: Optional[float] = Field(None, gt=0)
    type_sol_id: Optional[int] = None
    statut: Optional[StatutParcelleEnum] = None
    localisation: Optional[str] = Field(None, max_length=200)
    altitude: Optional[float] = None
    exposition: Optional[str] = Field(None, max_length=50)
    pente: Optional[float] = None
    irrigation: Optional[bool] = None
    notes: Optional[str] = None


class ParcelleResponse(ParcelleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Culture
class CultureBase(BaseModel):
    parcelle_id: int
    nom: str = Field(..., max_length=100)
    type_culture: Optional[TypeCultureEnum] = None
    variete: Optional[str] = Field(None, max_length=100)
    date_semis: Optional[date] = None
    date_recolte: Optional[date] = None
    densite: Optional[float] = None
    rendement_attendu: Optional[float] = None
    rendement_reel: Optional[float] = None
    statut: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class CultureCreate(CultureBase):
    pass


class CultureUpdate(BaseModel):
    parcelle_id: Optional[int] = None
    nom: Optional[str] = Field(None, max_length=100)
    type_culture: Optional[TypeCultureEnum] = None
    variete: Optional[str] = Field(None, max_length=100)
    date_semis: Optional[date] = None
    date_recolte: Optional[date] = None
    densite: Optional[float] = None
    rendement_attendu: Optional[float] = None
    rendement_reel: Optional[float] = None
    statut: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class CultureResponse(CultureBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ItineraireTechnique
class ItineraireTechniqueBase(BaseModel):
    parcelle_id: int
    nom: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    rotations: Optional[List[dict]] = None
    pratiques: Optional[List[dict]] = None


class ItineraireTechniqueCreate(ItineraireTechniqueBase):
    pass


class ItineraireTechniqueUpdate(BaseModel):
    parcelle_id: Optional[int] = None
    nom: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    rotations: Optional[List[dict]] = None
    pratiques: Optional[List[dict]] = None


class ItineraireTechniqueResponse(ItineraireTechniqueBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Intervention
class InterventionBase(BaseModel):
    parcelle_id: int
    culture_id: Optional[int] = None
    date: date
    type_intervention: str = Field(..., max_length=100)
    produit_utilise: Optional[str] = Field(None, max_length=200)
    dose: Optional[float] = None
    cout: Optional[float] = None
    duree: Optional[float] = None
    operateur: Optional[str] = Field(None, max_length=100)
    equipement_utilise: Optional[str] = Field(None, max_length=100)
    conditions_meteo: Optional[str] = Field(None, max_length=100)
    observations: Optional[str] = None
    ift: Optional[float] = None


class InterventionCreate(InterventionBase):
    pass


class InterventionUpdate(BaseModel):
    parcelle_id: Optional[int] = None
    culture_id: Optional[int] = None
    date: Optional[date] = None
    type_intervention: Optional[str] = Field(None, max_length=100)
    produit_utilise: Optional[str] = Field(None, max_length=200)
    dose: Optional[float] = None
    cout: Optional[float] = None
    duree: Optional[float] = None
    operateur: Optional[str] = Field(None, max_length=100)
    equipement_utilise: Optional[str] = Field(None, max_length=100)
    conditions_meteo: Optional[str] = Field(None, max_length=100)
    observations: Optional[str] = None
    ift: Optional[float] = None


class InterventionResponse(InterventionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
