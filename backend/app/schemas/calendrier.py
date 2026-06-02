"""
Schémas Pydantic pour la gestion du calendrier
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime, time
from enum import Enum


class TypeEvenementEnum(str, Enum):
    reunion = "réunion"
    rendez_vous = "rendez-vous"
    tache = "tâche"
    rappel = "rappel"
    evenement = "événement"
    anniversaire = "anniversaire"
    autre = "autre"


class PrioriteEnum(str, Enum):
    faible = "faible"
    moyenne = "moyenne"
    haute = "haute"
    urgente = "urgente"


class StatutEvenementEnum(str, Enum):
    planifie = "planifié"
    en_cours = "en_cours"
    termine = "terminé"
    annule = "annulé"


# TypeEvenement
class TypeEvenementBase(BaseModel):
    nom: str = Field(..., max_length=50)
    description: Optional[str] = None
    couleur: Optional[str] = Field(None, max_length=20)


class TypeEvenementCreate(TypeEvenementBase):
    pass


class TypeEvenementUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    couleur: Optional[str] = Field(None, max_length=20)


class TypeEvenementResponse(TypeEvenementBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Evenement
class EvenementBase(BaseModel):
    titre: str = Field(..., max_length=100)
    description: Optional[str] = None
    type_evenement_id: Optional[int] = None
    type_evenement_str: Optional[TypeEvenementEnum] = None
    date_debut: datetime
    date_fin: Optional[datetime] = None
    duree: Optional[int] = None
    heure_debut: Optional[time] = None
    heure_fin: Optional[time] = None
    lieu: Optional[str] = Field(None, max_length=200)
    priorite: PrioriteEnum = PrioriteEnum.moyenne
    statut: StatutEvenementEnum = StatutEvenementEnum.planifie
    organisateur: Optional[str] = Field(None, max_length=100)
    participants: Optional[str] = None
    rappel: bool = False
    date_rappel: Optional[datetime] = None
    recurrence: Optional[str] = Field(None, max_length=50)
    fin_recurrence: Optional[date] = None
    module: Optional[str] = Field(None, max_length=50)
    module_id: Optional[int] = None
    couleur: Optional[str] = Field(None, max_length=20)


class EvenementCreate(EvenementBase):
    pass


class EvenementUpdate(BaseModel):
    titre: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    type_evenement_id: Optional[int] = None
    type_evenement_str: Optional[TypeEvenementEnum] = None
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    duree: Optional[int] = None
    heure_debut: Optional[time] = None
    heure_fin: Optional[time] = None
    lieu: Optional[str] = Field(None, max_length=200)
    priorite: Optional[PrioriteEnum] = None
    statut: Optional[StatutEvenementEnum] = None
    organisateur: Optional[str] = Field(None, max_length=100)
    participants: Optional[str] = None
    rappel: Optional[bool] = None
    date_rappel: Optional[datetime] = None
    recurrence: Optional[str] = Field(None, max_length=50)
    fin_recurrence: Optional[date] = None
    module: Optional[str] = Field(None, max_length=50)
    module_id: Optional[int] = None
    couleur: Optional[str] = Field(None, max_length=20)


class EvenementResponse(EvenementBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Rappel
class RappelBase(BaseModel):
    evenement_id: int
    date_rappel: datetime
    type_rappel: Optional[str] = Field(None, max_length=50)
    destinataire: Optional[str] = Field(None, max_length=200)
    type_destinataire: Optional[str] = Field(None, max_length=50)
    destinataire_id: Optional[int] = None
    message: Optional[str] = None
    statut: Optional[str] = Field(None, max_length=50)
    date_envoi: Optional[datetime] = None


class RappelCreate(RappelBase):
    pass


class RappelUpdate(BaseModel):
    evenement_id: Optional[int] = None
    date_rappel: Optional[datetime] = None
    type_rappel: Optional[str] = Field(None, max_length=50)
    destinataire: Optional[str] = Field(None, max_length=200)
    type_destinataire: Optional[str] = Field(None, max_length=50)
    destinataire_id: Optional[int] = None
    message: Optional[str] = None
    statut: Optional[str] = Field(None, max_length=50)
    date_envoi: Optional[datetime] = None


class RappelResponse(RappelBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
