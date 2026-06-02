"""
Modèles pour la gestion des chantiers
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum


class StatutChantierEnum(PyEnum):
    PLANIFIE = "planifié"
    EN_COURS = "en_cours"
    TERMINE = "terminé"
    SUSPENDU = "suspendu"
    ANNULE = "annulé"


class PrioriteEnum(PyEnum):
    FAIBLE = "faible"
    MOYENNE = "moyenne"
    HAUTE = "haute"
    URGENTE = "urgente"


class TypeEquipementEnum(PyEnum):
    TRACTEUR = "tracteur"
    MOISSONNEUSE = "moissonneuse"
    CHARRUE = "charrue"
    SEMOIR = "semoir"
    PULVERISATEUR = "pulvérisateur"
    RECOLTEUSE = "récolteuse"
    AUTRE = "autre"


class Chantier(Base):
    """Chantier agricole"""
    __tablename__ = "chantiers"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    code = Column(String(20), unique=True)
    description = Column(Text)
    date_debut = Column(Date)
    date_fin = Column(Date)
    statut = Column(Enum(StatutChantierEnum), default=StatutChantierEnum.PLANIFIE)
    priorite = Column(Enum(PrioriteEnum), default=PrioriteEnum.MOYENNE)
    budget = Column(Float)  # Budget en euros
    cout_reel = Column(Float, default=0)  # Coût réel en euros
    responsable = Column(String(100))  # Responsable du chantier
    localisation = Column(String(200))  # Localisation du chantier
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    taches = relationship("Tache", back_populates="chantier", cascade="all, delete-orphan")
    equipements = relationship("Equipement", back_populates="chantier")


class Tache(Base):
    """Tâche d'un chantier"""
    __tablename__ = "taches"
    
    id = Column(Integer, primary_key=True, index=True)
    chantier_id = Column(Integer, ForeignKey("chantiers.id"), nullable=False)
    nom = Column(String(100), nullable=False)
    description = Column(Text)
    date_debut = Column(DateTime(timezone=True))
    date_fin = Column(DateTime(timezone=True))
    duree_estimee = Column(Float)  # en heures
    duree_reelle = Column(Float)  # en heures
    statut = Column(String(50))  # À faire, En cours, Terminé
    priorite = Column(Enum(PrioriteEnum))
    responsable = Column(String(100))
    operateurs = Column(JSON)  # Liste des opérateurs
    equipements_utilises = Column(JSON)  # Liste des équipements
    cout = Column(Float, default=0)
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    chantier = relationship("Chantier", back_populates="taches")


class Equipement(Base):
    """Équipement agricole"""
    __tablename__ = "equipements"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    code = Column(String(20), unique=True)
    type_equipement = Column(Enum(TypeEquipementEnum))
    marque = Column(String(50))
    modele = Column(String(50))
    annee = Column(Integer)
    numero_serie = Column(String(50))
    valeur_acquisition = Column(Float)  # Valeur d'acquisition en euros
    valeur_actuelle = Column(Float)  # Valeur actuelle en euros
    date_acquisition = Column(Date)
    duree_vie = Column(Integer)  # Durée de vie en années
    chantier_id = Column(Integer, ForeignKey("chantiers.id"))
    actif = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    chantier = relationship("Chantier", back_populates="equipements")
    maintenances = relationship("Maintenance", back_populates="equipement", cascade="all, delete-orphan")


class Maintenance(Base):
    """Maintenance d'un équipement"""
    __tablename__ = "maintenances"
    
    id = Column(Integer, primary_key=True, index=True)
    equipement_id = Column(Integer, ForeignKey("equipements.id"), nullable=False)
    type_maintenance = Column(String(50))  # Préventive, Corrective, Inspection
    date = Column(Date, nullable=False)
    description = Column(Text)
    cout = Column(Float, default=0)
    fournisseur = Column(String(100))
    operateur = Column(String(100))
    date_prochaine = Column(Date)  # Date de la prochaine maintenance
    statut = Column(String(50))  # Planifiée, En cours, Terminé
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    equipement = relationship("Equipement", back_populates="maintenances")
