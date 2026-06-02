"""
Schémas Pydantic pour la messagerie
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class TypeMessageEnum(str, Enum):
    whatsapp = "whatsapp"
    sms = "sms"
    email = "email"
    voip = "voip"


class StatutMessageEnum(str, Enum):
    en_attente = "en_attente"
    envoye = "envoyé"
    livre = "livré"
    lu = "lu"
    echec = "échec"


# Conversation
class ConversationBase(BaseModel):
    type_message: TypeMessageEnum
    destinataire: str = Field(..., max_length=200)
    type_destinataire: Optional[str] = Field(None, max_length=50)
    destinataire_id: Optional[int] = None
    sujet: Optional[str] = Field(None, max_length=200)
    statut: StatutMessageEnum = StatutMessageEnum.en_attente
    date_creation: Optional[datetime] = None
    date_dernier_message: Optional[datetime] = None
    nombre_messages: int = 0
    actif: bool = True


class ConversationCreate(ConversationBase):
    pass


class ConversationUpdate(BaseModel):
    type_message: Optional[TypeMessageEnum] = None
    destinataire: Optional[str] = Field(None, max_length=200)
    type_destinataire: Optional[str] = Field(None, max_length=50)
    destinataire_id: Optional[int] = None
    sujet: Optional[str] = Field(None, max_length=200)
    statut: Optional[StatutMessageEnum] = None
    date_creation: Optional[datetime] = None
    date_dernier_message: Optional[datetime] = None
    nombre_messages: Optional[int] = None
    actif: Optional[bool] = None


class ConversationResponse(ConversationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# PieceJointe
class PieceJointeBase(BaseModel):
    message_id: int
    nom: str = Field(..., max_length=255)
    chemin: str = Field(..., max_length=500)
    type_fichier: Optional[str] = Field(None, max_length=50)
    taille: Optional[int] = None


class PieceJointeCreate(PieceJointeBase):
    pass


class PieceJointeUpdate(BaseModel):
    message_id: Optional[int] = None
    nom: Optional[str] = Field(None, max_length=255)
    chemin: Optional[str] = Field(None, max_length=500)
    type_fichier: Optional[str] = Field(None, max_length=50)
    taille: Optional[int] = None


class PieceJointeResponse(PieceJointeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Message
class MessageBase(BaseModel):
    conversation_id: int
    type_message: TypeMessageEnum
    expediteur: Optional[str] = Field(None, max_length=200)
    type_expediteur: Optional[str] = Field(None, max_length=50)
    expediteur_id: Optional[int] = None
    contenu: str
    statut: StatutMessageEnum = StatutMessageEnum.en_attente
    date_envoi: Optional[datetime] = None
    date_livraison: Optional[datetime] = None
    date_lecture: Optional[datetime] = None
    erreur: Optional[str] = None
    metadonnees: Optional[str] = None


class MessageCreate(MessageBase):
    pass


class MessageUpdate(BaseModel):
    conversation_id: Optional[int] = None
    type_message: Optional[TypeMessageEnum] = None
    expediteur: Optional[str] = Field(None, max_length=200)
    type_expediteur: Optional[str] = Field(None, max_length=50)
    expediteur_id: Optional[int] = None
    contenu: Optional[str] = None
    statut: Optional[StatutMessageEnum] = None
    date_envoi: Optional[datetime] = None
    date_livraison: Optional[datetime] = None
    date_lecture: Optional[datetime] = None
    erreur: Optional[str] = None
    metadonnees: Optional[str] = None


class MessageResponse(MessageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
