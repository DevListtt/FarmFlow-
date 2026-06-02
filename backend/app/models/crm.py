"""
Modèles pour la gestion du CRM (Customer Relationship Management)
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum


class StatutProspectEnum(PyEnum):
    NOUVEAU = "nouveau"
    CONTACTE = "contacté"
    QUALIFIE = "qualifié"
    PROPOSITION = "proposition"
    NEGOCIATION = "négociation"
    PERDU = "perdu"
    CONVERTI = "converti"


class StatutCommandeEnum(PyEnum):
    DEVIS = "devis"
    CONFIRMEE = "confirmée"
    EN_COURS = "en_cours"
    LIVREE = "livrée"
    FACTUREE = "facturée"
    PAYEE = "payée"
    ANNULEE = "annulée"


class SegmentClientEnum(PyEnum):
    AGRICULTEUR = "agriculteur"
    COOPERATIVE = "coopérative"
    NEGOCIANT = "négociant"
    INDUSTRIEL = "industriel"
    PARTICULIER = "particulier"
    AUTRE = "autre"


class Prospect(Base):
    """Prospect"""
    __tablename__ = "prospects"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100))
    raison_sociale = Column(String(100))
    telephone = Column(String(20))
    email = Column(String(100))
    adresse = Column(Text)
    code_postal = Column(String(20))
    ville = Column(String(100))
    pays = Column(String(50), default="France")
    segment = Column(Enum(SegmentClientEnum))
    statut = Column(Enum(StatutProspectEnum), default=StatutProspectEnum.NOUVEAU)
    source = Column(String(50))  # Source du prospect (Salon, Site web, Recommandation, etc.)
    date_premier_contact = Column(Date)
    date_prochain_contact = Column(Date)
    potentiel = Column(Float)  # Potentiel en euros
    observations = Column(Text)
    actif = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    historique = relationship("HistoriqueClient", back_populates="prospect")


class Commande(Base):
    """Commande client"""
    __tablename__ = "commandes"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    reference = Column(String(50), unique=True)
    date_commande = Column(DateTime(timezone=True), default=func.now())
    statut = Column(Enum(StatutCommandeEnum), default=StatutCommandeEnum.DEVIS)
    total_ht = Column(Float, default=0)
    total_tva = Column(Float, default=0)
    total_ttc = Column(Float, default=0)
    remises = Column(Float, default=0)
    date_livraison = Column(Date)
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    client = relationship("Client", back_populates="commandes")


class Facture(Base):
    """Facture client"""
    __tablename__ = "factures"
    
    id = Column(Integer, primary_key=True, index=True)
    commande_id = Column(Integer, ForeignKey("commandes.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    reference = Column(String(50), unique=True)
    date_facture = Column(Date, nullable=False)
    date_echeance = Column(Date)
    statut = Column(String(50))  # Brouillon, Envoyée, Payée, Impayée, Annulée
    total_ht = Column(Float, default=0)
    total_tva = Column(Float, default=0)
    total_ttc = Column(Float, default=0)
    montant_paye = Column(Float, default=0)
    mode_paiement = Column(String(50))
    date_paiement = Column(Date)
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    commande = relationship("Commande")
    client = relationship("Client")


class SegmentClient(Base):
    """Segment de clients"""
    __tablename__ = "segments_clients"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    criteres = Column(JSON)  # Critères de segmentation
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class HistoriqueClient(Base):
    """Historique des interactions avec un client ou prospect"""
    __tablename__ = "historique_clients"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    prospect_id = Column(Integer, ForeignKey("prospects.id"))
    date = Column(DateTime(timezone=True), nullable=False)
    type_interaction = Column(String(50))  # Appel, Email, Réunion, Visite, Achat
    sujet = Column(String(100))
    description = Column(Text)
    operateur = Column(String(100))
    resultat = Column(String(100))
    prochain_contact = Column(Date)
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    client = relationship("Client")
    prospect = relationship("Prospect", back_populates="historique")
