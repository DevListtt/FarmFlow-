"""
Modèles pour la gestion des animaux (élevage)
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum


class TypeAnimalEnum(PyEnum):
    BOVIN = "bovin"
    CAPRIN = "caprin"
    OVIN = "ovin"
    PORCIN = "porcin"
    VOLAILLE = "volaille"
    AUTRE = "autre"


class SexeEnum(PyEnum):
    MALE = "male"
    FEMMELLE = "femelle"
    INCONNU = "inconnu"


class StatutAnimalEnum(PyEnum):
    ACTIF = "actif"
    VENDU = "vendu"
    MORT = "mort"
    MALADE = "malade"
    RETIRE = "retiré"


class TypeAnimal(Base):
    """Type d'animal (Bovin, Caprin, Ovin, etc.)"""
    __tablename__ = "types_animaux"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    animaux = relationship("Animal", back_populates="type_animal")


class Race(Base):
    """Race d'animal"""
    __tablename__ = "races"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    type_animal_id = Column(Integer, ForeignKey("types_animaux.id"))
    description = Column(Text)
    poids_moyen = Column(Float)  # en kg
    production_lait = Column(Float)  # en litres/jour
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    type_animal = relationship("TypeAnimal", backref="races")
    animaux = relationship("Animal", back_populates="race")


class Animal(Base):
    """Animal d'élevage"""
    __tablename__ = "animaux"
    
    id = Column(Integer, primary_key=True, index=True)
    rfid = Column(String(50), unique=True, index=True)  # Identifiant RFID
    nom = Column(String(100))
    type_animal_id = Column(Integer, ForeignKey("types_animaux.id"))
    race_id = Column(Integer, ForeignKey("races.id"))
    sexe = Column(Enum(SexeEnum), default=SexeEnum.INCONNU)
    date_naissance = Column(Date)
    date_entree = Column(Date)  # Date d'entrée dans l'élevage
    poids = Column(Float)  # en kg
    statut = Column(Enum(StatutAnimalEnum), default=StatutAnimalEnum.ACTIF)
    mere_id = Column(Integer, ForeignKey("animaux.id"))
    pere_id = Column(Integer, ForeignKey("animaux.id"))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    type_animal = relationship("TypeAnimal", back_populates="animaux")
    race = relationship("Race", back_populates="animaux")
    mere = relationship("Animal", remote_side=[id], foreign_keys=[mere_id], backref="enfants_mere")
    pere = relationship("Animal", remote_side=[id], foreign_keys=[pere_id], backref="enfants_pere")
    suivi_sante = relationship("SuiviSante", back_populates="animal", cascade="all, delete-orphan")
    reproductions = relationship("Reproduction", back_populates="animal", foreign_keys="Reproduction.animal_id", cascade="all, delete-orphan")


class SuiviSante(Base):
    """Suivi sanitaire des animaux"""
    __tablename__ = "suivi_sante"
    
    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animaux.id"), nullable=False)
    date = Column(Date, nullable=False)
    type_soin = Column(String(100))  # Vaccin, vermifuge, traitement, etc.
    produit_utilise = Column(String(200))
    dose = Column(Float)  # en ml ou g
    cout = Column(Float)  # en euros
    observations = Column(Text)
    veterinaire = Column(String(100))
    prochain_rappel = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    animal = relationship("Animal", back_populates="suivi_sante")


class Reproduction(Base):
    """Suivi de la reproduction"""
    __tablename__ = "reproduction"
    
    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animaux.id"), nullable=False)
    type_reproduction = Column(String(50))  # Gestation, velage, poulinage, etc.
    date_debut = Column(Date)
    date_fin = Column(Date)
    partenaire_id = Column(Integer, ForeignKey("animaux.id"))
    nombre_enfants = Column(Integer)
    statut = Column(String(50))  # En cours, terminé, échoué
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    animal = relationship("Animal", back_populates="reproductions", foreign_keys=[animal_id])
    partenaire = relationship("Animal", remote_side=[Animal.id], foreign_keys=[partenaire_id])
