"""
Schémas Pydantic pour la gestion de la communication
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CanalCommunicationEnum(str, Enum):
    email = "email"
    sms = "sms"
    whatsapp = "whatsapp"
    voip = "voip"
    courrier = "courrier"


class StatutCampagneEnum(str, Enum):
    brouillon = "brouillon"
    planifie = "planifié"
    en_cours = "en_cours"
    terminee = "terminée"
    annulee = "annulée"


class TypeMessageEnum(str, Enum):
    promotionnel = "promotionnel"
    informationnel = "informationnel"
    relance = "relance"
    alerte = "alerte"
    autre = "autre"


# CanalCommunication
class CanalCommunicationBase(BaseModel):
    nom: str = Field(..., max_length=50)
    type_canal: CanalCommunicationEnum
    description: Optional[str] = None
    configuration: Optional[List[dict]] = None
    actif: bool = True


class CanalCommunicationCreate(CanalCommunicationBase):
    pass


class CanalCommunicationUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=50)
    type_canal: Optional[CanalCommunicationEnum] = None
    description: Optional[str] = None
    configuration: Optional[List[dict]] = None
    actif: Optional[bool] = None


class CanalCommunicationResponse(CanalCommunicationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ModeleMessage
class ModeleMessageBase(BaseModel):
    nom: str = Field(..., max_length=100)
    type_message: TypeMessageEnum
    sujet: Optional[str] = Field(None, max_length=200)
    contenu: str
    variables: Optional[List[dict]] = None
    canal_id: Optional[int] = None
    actif: bool = True


class ModeleMessageCreate(ModeleMessageBase):
    pass


class ModeleMessageUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    type_message: Optional[TypeMessageEnum] = None
    sujet: Optional[str] = Field(None, max_length=200)
    contenu: Optional[str] = None
    variables: Optional[List[dict]] = None
    canal_id: Optional[int] = None
    actif: Optional[bool] = None


class ModeleMessageResponse(ModeleMessageBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Campagne
class CampagneBase(BaseModel):
    nom: str = Field(..., max_length=100)
    canal_id: Optional[int] = None
    modele_id: Optional[int] = None
    type_message: TypeMessageEnum
    statut: StatutCampagneEnum = StatutCampagneEnum.brouillon
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    cibles: Optional[List[dict]] = None
    nombre_cibles: int = 0
    nombre_envoyes: int = 0
    nombre_ouverts: int = 0
    nombre_clics: int = 0
    cout: float = 0
    observations: Optional[str] = None


class CampagneCreate(CampagneBase):
    pass


class CampagneUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    canal_id: Optional[int] = None
    modele_id: Optional[int] = None
    type_message: Optional[TypeMessageEnum] = None
    statut: Optional[StatutCampagneEnum] = None
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    cibles: Optional[List[dict]] = None
    nombre_cibles: Optional[int] = None
    nombre_envoyes: Optional[int] = None
    nombre_ouverts: Optional[int] = None
    nombre_clics: Optional[int] = None
    cout: Optional[float] = None
    observations: Optional[str] = None


class CampagneResponse(CampagneBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# EnvoiMessage
class EnvoiMessageBase(BaseModel):
    campagne_id: Optional[int] = None
    destinataire: str = Field(..., max_length=200)
    type_destinataire: Optional[str] = Field(None, max_length=50)
    destinataire_id: Optional[int] = None
    sujet: Optional[str] = Field(None, max_length=200)
    contenu: str
    statut: Optional[str] = Field(None, max_length=50)
    date_envoi: Optional[datetime] = None
    date_livraison: Optional[datetime] = None
    date_lecture: Optional[datetime] = None
    erreur: Optional[str] = None
    cout: float = 0


class EnvoiMessageCreate(EnvoiMessageBase):
    pass


class EnvoiMessageUpdate(BaseModel):
    campagne_id: Optional[int] = None
    destinataire: Optional[str] = Field(None, max_length=200)
    type_destinataire: Optional[str] = Field(None, max_length=50)
    destinataire_id: Optional[int] = None
    sujet: Optional[str] = Field(None, max_length=200)
    contenu: Optional[str] = None
    statut: Optional[str] = Field(None, max_length=50)
    date_envoi: Optional[datetime] = None
    date_livraison: Optional[datetime] = None
    date_lecture: Optional[datetime] = None
    erreur: Optional[str] = None
    cout: Optional[float] = None


class EnvoiMessageResponse(EnvoiMessageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
