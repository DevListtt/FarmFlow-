"""
Modèles pour la gestion de la comptabilité
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum


class TypeCompteEnum(PyEnum):
    ACTIF = "actif"
    PASSIF = "passif"
    CHARGE = "charge"
    PRODUIT = "produit"
    TRORIE = "trésorerie"


class TypeJournalEnum(PyEnum):
    ACHATS = "achats"
    VENTES = "ventes"
    BANQUE = "banque"
    CAISSE = "caisse"
    OD = "od"  # Opérations diverses


class StatutFactureEnum(PyEnum):
    BROUILLON = "brouillon"
    VALIDEE = "validée"
    PAYEE = "payée"
    IMPAYEE = "impayée"
    ANNULEE = "annulée"


class CompteComptable(Base):
    """Compte comptable"""
    __tablename__ = "comptes_comptables"
    
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(20), unique=True, nullable=False)  # Numéro de compte
    nom = Column(String(100), nullable=False)
    type_compte = Column(Enum(TypeCompteEnum))
    parent_id = Column(Integer, ForeignKey("comptes_comptables.id"))
    description = Column(Text)
    solde = Column(Float, default=0)
    actif = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    parent = relationship("CompteComptable", remote_side=[id], back_populates="enfants")
    enfants = relationship("CompteComptable", back_populates="parent")
    ecritures = relationship("EcritureComptable", back_populates="compte")


class Journal(Base):
    """Journal comptable"""
    __tablename__ = "journaux"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    nom = Column(String(100), nullable=False)
    type_journal = Column(Enum(TypeJournalEnum))
    description = Column(Text)
    actif = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    ecritures = relationship("EcritureComptable", back_populates="journal")


class EcritureComptable(Base):
    """Écriture comptable"""
    __tablename__ = "ecritures_comptables"
    
    id = Column(Integer, primary_key=True, index=True)
    journal_id = Column(Integer, ForeignKey("journaux.id"), nullable=False)
    compte_id = Column(Integer, ForeignKey("comptes_comptables.id"), nullable=False)
    date = Column(Date, nullable=False)
    reference = Column(String(50))  # Référence du document
    libelle = Column(String(200), nullable=False)
    debit = Column(Float, default=0)
    credit = Column(Float, default=0)
    solde = Column(Float, default=0)
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    journal = relationship("Journal", back_populates="ecritures")
    compte = relationship("CompteComptable", back_populates="ecritures")


class FournisseurComptable(Base):
    """Fournisseur (comptabilité)"""
    __tablename__ = "fournisseurs_comptables"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    raison_sociale = Column(String(100))
    telephone = Column(String(20))
    email = Column(String(100))
    adresse = Column(Text)
    code_postal = Column(String(20))
    ville = Column(String(100))
    pays = Column(String(50), default="France")
    siret = Column(String(50))
    tva_intracommunautaire = Column(String(50))
    compte_comptable_id = Column(Integer, ForeignKey("comptes_comptables.id"))
    solde = Column(Float, default=0)
    actif = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    compte_comptable = relationship("CompteComptable")
    factures = relationship("FactureFournisseur", back_populates="fournisseur")


class FactureFournisseur(Base):
    """Facture fournisseur"""
    __tablename__ = "factures_fournisseurs"
    
    id = Column(Integer, primary_key=True, index=True)
    fournisseur_id = Column(Integer, ForeignKey("fournisseurs_comptables.id"), nullable=False)
    reference = Column(String(50), unique=True)
    date_facture = Column(Date, nullable=False)
    date_echeance = Column(Date)
    statut = Column(Enum(StatutFactureEnum), default=StatutFactureEnum.BROUILLON)
    total_ht = Column(Float, default=0)
    total_tva = Column(Float, default=0)
    total_ttc = Column(Float, default=0)
    montant_paye = Column(Float, default=0)
    mode_paiement = Column(String(50))
    date_paiement = Column(Date)
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    fournisseur = relationship("FournisseurComptable", back_populates="factures")
