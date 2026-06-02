"""
Schémas Pydantic pour la gestion de la flotte de véhicules
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from enum import Enum


class TypeVehiculeEnum(str, Enum):
    tracteur = "tracteur"
    camion = "camion"
    remorque = "remorque"
    voiture = "voiture"
    utilitaire = "utilitaire"
    moto = "moto"
    autre = "autre"


class TypeCarburantEnum(str, Enum):
    diesel = "diesel"
    essence = "essence"
    gpl = "gpl"
    electrique = "électrique"
    hybride = "hybride"
    autre = "autre"


class StatutVehiculeEnum(str, Enum):
    disponible = "disponible"
    en_service = "en_service"
    en_maintenance = "en_maintenance"
    en_panne = "en_panne"
    retire = "retiré"


# TypeVehicule
class TypeVehiculeBase(BaseModel):
    nom: str = Field(..., max_length=50)
    description: Optional[str] = None


class TypeVehiculeCreate(TypeVehiculeBase):
    pass


class TypeVehiculeUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None


class TypeVehiculeResponse(TypeVehiculeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Conducteur
class ConducteurBase(BaseModel):
    nom: str = Field(..., max_length=100)
    prenom: str = Field(..., max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    numero_permis: Optional[str] = Field(None, max_length=50)
    date_expiration_permis: Optional[date] = None
    actif: bool = True
    notes: Optional[str] = None


class ConducteurCreate(ConducteurBase):
    pass


class ConducteurUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    numero_permis: Optional[str] = Field(None, max_length=50)
    date_expiration_permis: Optional[date] = None
    actif: Optional[bool] = None
    notes: Optional[str] = None


class ConducteurResponse(ConducteurBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Vehicule
class VehiculeBase(BaseModel):
    immatriculation: str = Field(..., max_length=20)
    nom: Optional[str] = Field(None, max_length=100)
    type_vehicule_id: Optional[int] = None
    marque: Optional[str] = Field(None, max_length=50)
    modele: Optional[str] = Field(None, max_length=50)
    annee: Optional[int] = None
    type_carburant: Optional[TypeCarburantEnum] = None
    capacite_reservoir: Optional[float] = None
    consommation_moyenne: Optional[float] = None
    kilometrage: float = 0
    date_acquisition: Optional[date] = None
    valeur_acquisition: Optional[float] = None
    valeur_actuelle: Optional[float] = None
    statut: StatutVehiculeEnum = StatutVehiculeEnum.disponible
    conducteur_id: Optional[int] = None
    assurance: Optional[str] = Field(None, max_length=100)
    date_assurance: Optional[date] = None
    date_controle_technique: Optional[date] = None
    couleur: Optional[str] = Field(None, max_length=30)
    actif: bool = True
    notes: Optional[str] = None


class VehiculeCreate(VehiculeBase):
    pass


class VehiculeUpdate(BaseModel):
    immatriculation: Optional[str] = Field(None, max_length=20)
    nom: Optional[str] = Field(None, max_length=100)
    type_vehicule_id: Optional[int] = None
    marque: Optional[str] = Field(None, max_length=50)
    modele: Optional[str] = Field(None, max_length=50)
    annee: Optional[int] = None
    type_carburant: Optional[TypeCarburantEnum] = None
    capacite_reservoir: Optional[float] = None
    consommation_moyenne: Optional[float] = None
    kilometrage: Optional[float] = None
    date_acquisition: Optional[date] = None
    valeur_acquisition: Optional[float] = None
    valeur_actuelle: Optional[float] = None
    statut: Optional[StatutVehiculeEnum] = None
    conducteur_id: Optional[int] = None
    assurance: Optional[str] = Field(None, max_length=100)
    date_assurance: Optional[date] = None
    date_controle_technique: Optional[date] = None
    couleur: Optional[str] = Field(None, max_length=30)
    actif: Optional[bool] = None
    notes: Optional[str] = None


class VehiculeResponse(VehiculeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Entretien
class EntretienBase(BaseModel):
    vehicule_id: int
    type_entretien: str = Field(..., max_length=50)
    date: date
    kilometrage: Optional[float] = None
    description: Optional[str] = None
    cout: float = 0
    fournisseur: Optional[str] = Field(None, max_length=100)
    operateur: Optional[str] = Field(None, max_length=100)
    date_prochaine: Optional[date] = None
    statut: Optional[str] = Field(None, max_length=50)
    observations: Optional[str] = None


class EntretienCreate(EntretienBase):
    pass


class EntretienUpdate(BaseModel):
    vehicule_id: Optional[int] = None
    type_entretien: Optional[str] = Field(None, max_length=50)
    date: Optional[date] = None
    kilometrage: Optional[float] = None
    description: Optional[str] = None
    cout: Optional[float] = None
    fournisseur: Optional[str] = Field(None, max_length=100)
    operateur: Optional[str] = Field(None, max_length=100)
    date_prochaine: Optional[date] = None
    statut: Optional[str] = Field(None, max_length=50)
    observations: Optional[str] = None


class EntretienResponse(EntretienBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Carburant
class CarburantBase(BaseModel):
    vehicule_id: int
    date: datetime
    type_carburant: TypeCarburantEnum
    quantite: float = Field(..., gt=0)
    prix_litre: Optional[float] = None
    cout_total: Optional[float] = None
    kilometrage: Optional[float] = None
    station: Optional[str] = Field(None, max_length=100)
    operateur: Optional[str] = Field(None, max_length=100)
    observations: Optional[str] = None


class CarburantCreate(CarburantBase):
    pass


class CarburantUpdate(BaseModel):
    vehicule_id: Optional[int] = None
    date: Optional[datetime] = None
    type_carburant: Optional[TypeCarburantEnum] = None
    quantite: Optional[float] = Field(None, gt=0)
    prix_litre: Optional[float] = None
    cout_total: Optional[float] = None
    kilometrage: Optional[float] = None
    station: Optional[str] = Field(None, max_length=100)
    operateur: Optional[str] = Field(None, max_length=100)
    observations: Optional[str] = None


class CarburantResponse(CarburantBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
