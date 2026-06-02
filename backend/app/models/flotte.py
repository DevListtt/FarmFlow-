"""
Modèles pour la gestion de la flotte de véhicules
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum


class TypeVehiculeEnum(PyEnum):
    TRACTEUR = "tracteur"
    CAMION = "camion"
    REMORQUE = "remorque"
    VOITURE = "voiture"
    UTILITAIRE = "utilitaire"
    MOTO = "moto"
    AUTRE = "autre"


class TypeCarburantEnum(PyEnum):
    DIESEL = "diesel"
    ESSENCE = "essence"
    GPL = "gpl"
    ELECTRIQUE = "électrique"
    HYBRIDE = "hybride"
    AUTRE = "autre"


class StatutVehiculeEnum(PyEnum):
    DISPONIBLE = "disponible"
    EN_SERVICE = "en_service"
    EN_MAINTENANCE = "en_maintenance"
    EN_PANNE = "en_panne"
    RETIRE = "retiré"


class TypeVehicule(Base):
    """Type de véhicule"""
    __tablename__ = "types_vehicules"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    vehicules = relationship("Vehicule", back_populates="type_vehicule")


class Conducteur(Base):
    """Conducteur de véhicule"""
    __tablename__ = "conducteurs"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    telephone = Column(String(20))
    email = Column(String(100))
    numero_permis = Column(String(50))
    date_expiration_permis = Column(Date)
    actif = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    vehicules = relationship("Vehicule", back_populates="conducteur")


class Vehicule(Base):
    """Véhicule"""
    __tablename__ = "vehicules"
    
    id = Column(Integer, primary_key=True, index=True)
    immatriculation = Column(String(20), unique=True)  # Numéro d'immatriculation
    nom = Column(String(100))
    type_vehicule_id = Column(Integer, ForeignKey("types_vehicules.id"))
    marque = Column(String(50))
    modele = Column(String(50))
    annee = Column(Integer)
    type_carburant = Column(Enum(TypeCarburantEnum))
    capacite_reservoir = Column(Float)  # en litres
    consommation_moyenne = Column(Float)  # en L/100km
    kilométrage = Column(Float, default=0)  # en km
    date_acquisition = Column(Date)
    valeur_acquisition = Column(Float)  # en euros
    valeur_actuelle = Column(Float)  # en euros
    statut = Column(Enum(StatutVehiculeEnum), default=StatutVehiculeEnum.DISPONIBLE)
    conducteur_id = Column(Integer, ForeignKey("conducteurs.id"))
    assurance = Column(String(100))
    date_assurance = Column(Date)
    date_controle_technique = Column(Date)
    couleur = Column(String(30))
    actif = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    type_vehicule = relationship("TypeVehicule", back_populates="vehicules")
    conducteur = relationship("Conducteur", back_populates="vehicules")
    entretiens = relationship("Entretien", back_populates="vehicule", cascade="all, delete-orphan")
    carburants = relationship("Carburant", back_populates="vehicule", cascade="all, delete-orphan")


class Entretien(Base):
    """Entretien d'un véhicule"""
    __tablename__ = "entretiens"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicule_id = Column(Integer, ForeignKey("vehicules.id"), nullable=False)
    type_entretien = Column(String(50))  # Vidange, Révision, Réparation, Contrôle technique
    date = Column(Date, nullable=False)
    kilométrage = Column(Float)  # Kilométrage au moment de l'entretien
    description = Column(Text)
    cout = Column(Float, default=0)  # en euros
    fournisseur = Column(String(100))
    operateur = Column(String(100))
    date_prochaine = Column(Date)  # Date du prochain entretien
    statut = Column(String(50))  # Planifié, En cours, Terminé
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    vehicule = relationship("Vehicule", back_populates="entretiens")


class Carburant(Base):
    """Ravitaillement en carburant"""
    __tablename__ = "carburants"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicule_id = Column(Integer, ForeignKey("vehicules.id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    type_carburant = Column(Enum(TypeCarburantEnum))
    quantite = Column(Float, nullable=False)  # en litres
    prix_litre = Column(Float)  # en euros
    cout_total = Column(Float)  # en euros
    kilométrage = Column(Float)  # Kilométrage au ravitaillement
    station = Column(String(100))  # Station-service
    operateur = Column(String(100))
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    vehicule = relationship("Vehicule", back_populates="carburants")
