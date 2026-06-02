"""
Schémas Pydantic pour la gestion des chantiers
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class StatutChantierEnum(str, Enum):
    planifie = "planifié"
    en_cours = "en_cours"
    termine = "terminé"
    suspendu = "suspendu"
    annule = "annulé"


class PrioriteEnum(str, Enum):
    faible = "faible"
    moyenne = "moyenne"
    haute = "haute"
    urgente = "urgente"


class TypeEquipementEnum(str, Enum):
    tracteur = "tracteur"
    moissonneuse = "moissonneuse"
    charrue = "charrue"
    semoir = "semoir"
    pulverisateur = "pulvérisateur"
    recolteuse = "récolteuse"
    autre = "autre"


# Chantier
class ChantierBase(BaseModel):
    nom: str = Field(..., max_length=100)
    code: str = Field(..., max_length=20)
    description: Optional[str] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    statut: StatutChantierEnum = StatutChantierEnum.planifie
    priorite: PrioriteEnum = PrioriteEnum.moyenne
    budget: Optional[float] = None
    cout_reel: float = 0
    responsable: Optional[str] = Field(None, max_length=100)
    localisation: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None


class ChantierCreate(ChantierBase):
    pass


class ChantierUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    code: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    statut: Optional[StatutChantierEnum] = None
    priorite: Optional[PrioriteEnum] = None
    budget: Optional[float] = None
    cout_reel: Optional[float] = None
    responsable: Optional[str] = Field(None, max_length=100)
    localisation: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None


class ChantierResponse(ChantierBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Tache
class TacheBase(BaseModel):
    chantier_id: int
    nom: str = Field(..., max_length=100)
    description: Optional[str] = None
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    duree_estimee: Optional[float] = None
    duree_reelle: Optional[float] = None
    statut: Optional[str] = Field(None, max_length=50)
    priorite: Optional[PrioriteEnum] = None
    responsable: Optional[str] = Field(None, max_length=100)
    operateurs: Optional[List[str]] = None
    equipements_utilises: Optional[List[str]] = None
    cout: float = 0
    observations: Optional[str] = None


class TacheCreate(TacheBase):
    pass


class TacheUpdate(BaseModel):
    chantier_id: Optional[int] = None
    nom: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    duree_estimee: Optional[float] = None
    duree_reelle: Optional[float] = None
    statut: Optional[str] = Field(None, max_length=50)
    priorite: Optional[PrioriteEnum] = None
    responsable: Optional[str] = Field(None, max_length=100)
    operateurs: Optional[List[str]] = None
    equipements_utilises: Optional[List[str]] = None
    cout: Optional[float] = None
    observations: Optional[str] = None


class TacheResponse(TacheBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Equipement
class EquipementBase(BaseModel):
    nom: str = Field(..., max_length=100)
    code: str = Field(..., max_length=20)
    type_equipement: TypeEquipementEnum
    marque: Optional[str] = Field(None, max_length=50)
    modele: Optional[str] = Field(None, max_length=50)
    annee: Optional[int] = None
    numero_serie: Optional[str] = Field(None, max_length=50)
    valeur_acquisition: Optional[float] = None
    valeur_actuelle: Optional[float] = None
    date_acquisition: Optional[date] = None
    duree_vie: Optional[int] = None
    chantier_id: Optional[int] = None
    actif: bool = True
    notes: Optional[str] = None


class EquipementCreate(EquipementBase):
    pass


class EquipementUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    code: Optional[str] = Field(None, max_length=20)
    type_equipement: Optional[TypeEquipementEnum] = None
    marque: Optional[str] = Field(None, max_length=50)
    modele: Optional[str] = Field(None, max_length=50)
    annee: Optional[int] = None
    numero_serie: Optional[str] = Field(None, max_length=50)
    valeur_acquisition: Optional[float] = None
    valeur_actuelle: Optional[float] = None
    date_acquisition: Optional[date] = None
    duree_vie: Optional[int] = None
    chantier_id: Optional[int] = None
    actif: Optional[bool] = None
    notes: Optional[str] = None


class EquipementResponse(EquipementBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Maintenance
class MaintenanceBase(BaseModel):
    equipement_id: int
    type_maintenance: str = Field(..., max_length=50)
    date: date
    description: Optional[str] = None
    cout: float = 0
    fournisseur: Optional[str] = Field(None, max_length=100)
    operateur: Optional[str] = Field(None, max_length=100)
    date_prochaine: Optional[date] = None
    statut: Optional[str] = Field(None, max_length=50)
    observations: Optional[str] = None


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    equipement_id: Optional[int] = None
    type_maintenance: Optional[str] = Field(None, max_length=50)
    date: Optional[date] = None
    description: Optional[str] = None
    cout: Optional[float] = None
    fournisseur: Optional[str] = Field(None, max_length=100)
    operateur: Optional[str] = Field(None, max_length=100)
    date_prochaine: Optional[date] = None
    statut: Optional[str] = Field(None, max_length=50)
    observations: Optional[str] = None


class MaintenanceResponse(MaintenanceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
