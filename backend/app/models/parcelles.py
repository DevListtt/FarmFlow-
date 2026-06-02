"""
Modèles pour la gestion des parcelles et cultures
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum


class TypeSolEnum(PyEnum):
    ARGILEUX = "argileux"
    SABLEUX = "sableux"
    LIMONEUX = "limoneux"
    CALCAIRE = "calcaire"
    TOURBEUX = "tourbeux"
    AUTRE = "autre"


class StatutParcelleEnum(PyEnum):
    LIBRE = "libre"
    EN_CULTURE = "en_culture"
    EN_JACHERE = "en_jachere"
    EN_ENTRETIEN = "en_entretien"


class TypeCultureEnum(PyEnum):
    CEREALE = "céréale"
    OLEAGINEUX = "oléagineux"
    PROTEAGINEUX = "proteagineux"
    LEGUME = "légume"
    FRUIT = "fruit"
    FOURRAGERE = "fourragère"
    AUTRE = "autre"


class TypeSol(Base):
    """Type de sol"""
    __tablename__ = "types_sol"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    ph_ideal_min = Column(Float)
    ph_ideal_max = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    parcelles = relationship("Parcelle", back_populates="type_sol")


class Parcelle(Base):
    """Parcelle agricole"""
    __tablename__ = "parcelles"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    code = Column(String(20), unique=True)  # Code interne
    surface = Column(Float, nullable=False)  # en hectares
    type_sol_id = Column(Integer, ForeignKey("types_sol.id"))
    statut = Column(Enum(StatutParcelleEnum), default=StatutParcelleEnum.LIBRE)
    localisation = Column(String(200))  # GPS ou adresse
    altitude = Column(Float)  # en mètres
    exposition = Column(String(50))  # Nord, Sud, Est, Ouest
    pente = Column(Float)  # en %
    irrigation = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    type_sol = relationship("TypeSol", back_populates="parcelles")
    cultures = relationship("Culture", back_populates="parcelle", cascade="all, delete-orphan")
    itineraire_technique = relationship("ItineraireTechnique", back_populates="parcelle", uselist=False)
    interventions = relationship("Intervention", back_populates="parcelle", cascade="all, delete-orphan")


class Culture(Base):
    """Culture sur une parcelle"""
    __tablename__ = "cultures"
    
    id = Column(Integer, primary_key=True, index=True)
    parcelle_id = Column(Integer, ForeignKey("parcelles.id"), nullable=False)
    nom = Column(String(100), nullable=False)
    type_culture = Column(Enum(TypeCultureEnum))
    variete = Column(String(100))
    date_semis = Column(Date)
    date_recolte = Column(Date)
    densite = Column(Float)  # plantes/hectare
    rendement_attendu = Column(Float)  # en tonnes/hectare
    rendement_reel = Column(Float)
    statut = Column(String(50))  # Préparation, Semis, Croissance, Récolte, Terminé
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    parcelle = relationship("Parcelle", back_populates="cultures")


class ItineraireTechnique(Base):
    """Itinéraire technique pour une parcelle"""
    __tablename__ = "itineraires_techniques"
    
    id = Column(Integer, primary_key=True, index=True)
    parcelle_id = Column(Integer, ForeignKey("parcelles.id"), unique=True, nullable=False)
    nom = Column(String(100))
    description = Column(Text)
    rotations = Column(JSON)  # Liste des rotations de cultures
    pratiques = Column(JSON)  # Pratiques culturales
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    parcelle = relationship("Parcelle", back_populates="itineraire_technique")


class Intervention(Base):
    """Intervention sur une parcelle"""
    __tablename__ = "interventions"
    
    id = Column(Integer, primary_key=True, index=True)
    parcelle_id = Column(Integer, ForeignKey("parcelles.id"), nullable=False)
    culture_id = Column(Integer, ForeignKey("cultures.id"))
    date = Column(Date, nullable=False)
    type_intervention = Column(String(100))  # Semis, Fertilisation, Traitement, Irrigation, Récolte
    produit_utilise = Column(String(200))
    dose = Column(Float)  # en kg/ha ou L/ha
    cout = Column(Float)  # en euros
    duree = Column(Float)  # en heures
    operateur = Column(String(100))
    equipement_utilise = Column(String(100))
    conditions_meteo = Column(String(100))
    observations = Column(Text)
    ift = Column(Float)  # Indice de Fréquence de Traitement
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    parcelle = relationship("Parcelle", back_populates="interventions")
    culture = relationship("Culture")
