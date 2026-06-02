"""
Modèles pour la messagerie (WhatsApp, SMS, Email)
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum


class TypeMessageEnum(PyEnum):
    WHATSAPP = "whatsapp"
    SMS = "sms"
    EMAIL = "email"
    VOIP = "voip"


class StatutMessageEnum(PyEnum):
    EN_ATTENTE = "en_attente"
    ENVOYE = "envoyé"
    LIVRE = "livré"
    LU = "lu"
    ECHEC = "échec"


class Conversation(Base):
    """Conversation"""
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    type_message = Column(Enum(TypeMessageEnum))
    destinataire = Column(String(200), nullable=False)
    type_destinataire = Column(String(50))  # Client, Prospect, Employé, Fournisseur
    destinataire_id = Column(Integer)
    sujet = Column(String(200))
    statut = Column(Enum(StatutMessageEnum), default=StatutMessageEnum.EN_ATTENTE)
    date_creation = Column(DateTime(timezone=True), default=func.now())
    date_dernier_message = Column(DateTime(timezone=True))
    nombre_messages = Column(Integer, default=0)
    actif = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class PieceJointe(Base):
    """Pièce jointe"""
    __tablename__ = "pieces_jointes"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"))
    nom = Column(String(255), nullable=False)
    chemin = Column(String(500), nullable=False)  # Chemin du fichier
    type_fichier = Column(String(50))  # PDF, Image, Document, etc.
    taille = Column(Integer)  # Taille en octets
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    message = relationship("Message", back_populates="pieces_jointes")


class Message(Base):
    """Message"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    type_message = Column(Enum(TypeMessageEnum))
    expediteur = Column(String(200))
    type_expediteur = Column(String(50))  # Systeme, Employé, Client
    expediteur_id = Column(Integer)
    contenu = Column(Text, nullable=False)
    statut = Column(Enum(StatutMessageEnum), default=StatutMessageEnum.EN_ATTENTE)
    date_envoi = Column(DateTime(timezone=True))
    date_livraison = Column(DateTime(timezone=True))
    date_lecture = Column(DateTime(timezone=True))
    erreur = Column(Text)
    metadonnees = Column(Text)  # Métadonnées spécifiques (ID WhatsApp, etc.)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    conversation = relationship("Conversation", back_populates="messages")
    pieces_jointes = relationship("PieceJointe", back_populates="message", cascade="all, delete-orphan")
