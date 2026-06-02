"""
Modèles pour la gestion du calendrier
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Text, Enum, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum


class TypeEvenementEnum(PyEnum):
    REUNION = "réunion"
    RENDEZ_VOUS = "rendez-vous"
    TACHE = "tâche"
    RAPPEL = "rappel"
    EVENEMENT = "événement"
    ANNIVERSAIRE = "anniversaire"
    AUTRE = "autre"


class PrioriteEnum(PyEnum):
    FAIBLE = "faible"
    MOYENNE = "moyenne"
    HAUTE = "haute"
    URGENTE = "urgente"


class StatutEvenementEnum(PyEnum):
    PLANIFIE = "planifié"
    EN_COURS = "en_cours"
    TERMINE = "terminé"
    ANNULE = "annulé"


class TypeEvenement(Base):
    """Type d'événement"""
    __tablename__ = "types_evenements"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    couleur = Column(String(20))  # Couleur pour l'affichage
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    evenements = relationship("Evenement", back_populates="type_evenement")


class Evenement(Base):
    """Événement du calendrier"""
    __tablename__ = "evenements"
    
    id = Column(Integer, primary_key=True, index=True)
    titre = Column(String(100), nullable=False)
    description = Column(Text)
    type_evenement_id = Column(Integer, ForeignKey("types_evenements.id"))
    type_evenement_str = Column(Enum(TypeEvenementEnum))
    date_debut = Column(DateTime(timezone=True), nullable=False)
    date_fin = Column(DateTime(timezone=True))
    duree = Column(Integer)  # en minutes
    heure_debut = Column(Time)
    heure_fin = Column(Time)
    lieu = Column(String(200))
    priorite = Column(Enum(PrioriteEnum), default=PrioriteEnum.MOYENNE)
    statut = Column(Enum(StatutEvenementEnum), default=StatutEvenementEnum.PLANIFIE)
    organisateur = Column(String(100))
    participants = Column(Text)  # Liste des participants
    rappel = Column(Boolean, default=False)
    date_rappel = Column(DateTime(timezone=True))
    recurrence = Column(String(50))  # Unique, Quotidien, Hebdomadaire, Mensuel, Annuel
    fin_recurrence = Column(Date)
    module = Column(String(50))  # Module associé (RH, Flotte, CRM, etc.)
    module_id = Column(Integer)  # ID de l'élément associé
    couleur = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    type_evenement = relationship("TypeEvenement", back_populates="evenements")
    rappels = relationship("Rappel", back_populates="evenement", cascade="all, delete-orphan")


class Rappel(Base):
    """Rappel pour un événement"""
    __tablename__ = "rappels"
    
    id = Column(Integer, primary_key=True, index=True)
    evenement_id = Column(Integer, ForeignKey("evenements.id"), nullable=False)
    date_rappel = Column(DateTime(timezone=True), nullable=False)
    type_rappel = Column(String(50))  # Email, SMS, Notification, WhatsApp
    destinataire = Column(String(200))  # Email, téléphone, etc.
    type_destinataire = Column(String(50))  # Client, Prospect, Employé
    destinataire_id = Column(Integer)
    message = Column(Text)
    statut = Column(String(50))  # En attente, Envoyé, Échec
    date_envoi = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    evenement = relationship("Evenement", back_populates="rappels")
