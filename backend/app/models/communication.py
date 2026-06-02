"""
Modèles pour la gestion de la communication
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum


class CanalCommunicationEnum(PyEnum):
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    VOIP = "voip"
    COURRIER = "courrier"


class StatutCampagneEnum(PyEnum):
    BROUILLON = "brouillon"
    PLANIFIE = "planifié"
    EN_COURS = "en_cours"
    TERMINEE = "terminée"
    ANNULEE = "annulée"


class TypeMessageEnum(PyEnum):
    PROMOTIONNEL = "promotionnel"
    INFORMATIONNEL = "informationnel"
    RELANCE = "relance"
    ALERTE = "alerte"
    AUTRE = "autre"


class CanalCommunication(Base):
    """Canal de communication"""
    __tablename__ = "canaux_communication"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), unique=True, nullable=False)
    type_canal = Column(Enum(CanalCommunicationEnum))
    description = Column(Text)
    configuration = Column(JSON)  # Configuration spécifique au canal
    actif = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    campagnes = relationship("Campagne", back_populates="canal")


class ModeleMessage(Base):
    """Modèle de message"""
    __tablename__ = "modeles_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), unique=True, nullable=False)
    type_message = Column(Enum(TypeMessageEnum))
    sujet = Column(String(200))
    contenu = Column(Text, nullable=False)
    variables = Column(JSON)  # Variables à remplacer dans le message
    canal_id = Column(Integer, ForeignKey("canaux_communication.id"))
    actif = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    canal = relationship("CanalCommunication")


class Campagne(Base):
    """Campagne de communication"""
    __tablename__ = "campagnes"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    canal_id = Column(Integer, ForeignKey("canaux_communication.id"))
    modele_id = Column(Integer, ForeignKey("modeles_messages.id"))
    type_message = Column(Enum(TypeMessageEnum))
    statut = Column(Enum(StatutCampagneEnum), default=StatutCampagneEnum.BROUILLON)
    date_debut = Column(DateTime(timezone=True))
    date_fin = Column(DateTime(timezone=True))
    cibles = Column(JSON)  # Liste des cibles (clients, prospects, employés)
    nombre_cibles = Column(Integer, default=0)
    nombre_envoyes = Column(Integer, default=0)
    nombre_ouverts = Column(Integer, default=0)
    nombre_clics = Column(Integer, default=0)
    cout = Column(Float, default=0)
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    canal = relationship("CanalCommunication", back_populates="campagnes")
    modele = relationship("ModeleMessage")
    envois = relationship("EnvoiMessage", back_populates="campagne", cascade="all, delete-orphan")


class EnvoiMessage(Base):
    """Envoi de message"""
    __tablename__ = "envois_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    campagne_id = Column(Integer, ForeignKey("campagnes.id"))
    destinataire = Column(String(200), nullable=False)  # Email, téléphone, etc.
    type_destinataire = Column(String(50))  # Client, Prospect, Employé
    destinataire_id = Column(Integer)  # ID du destinataire
    sujet = Column(String(200))
    contenu = Column(Text)
    statut = Column(String(50))  # En attente, Envoyé, Livré, Lu, Échec
    date_envoi = Column(DateTime(timezone=True))
    date_livraison = Column(DateTime(timezone=True))
    date_lecture = Column(DateTime(timezone=True))
    erreur = Column(Text)
    cout = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    campagne = relationship("Campagne", back_populates="envois")
