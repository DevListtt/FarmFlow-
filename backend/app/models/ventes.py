"""
Modèles pour la gestion des ventes
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum


class StatutVenteEnum(PyEnum):
    DEVIS = "devis"
    COMMANDE = "commande"
    LIVREE = "livrée"
    FACTUREE = "facturée"
    PAYEE = "payée"
    ANNULEE = "annulée"


class TypeProduitEnum(PyEnum):
    ANIMAL = "animal"
    PRODUIT_AGRICOLE = "produit_agricole"
    PRODUIT_TRANSFORME = "produit_transformé"
    SERVICE = "service"
    AUTRE = "autre"


class Client(Base):
    """Client pour les ventes"""
    __tablename__ = "clients"
    
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
    siret = Column(String(50))
    tva_intracommunautaire = Column(String(50))
    type_client = Column(String(50))  # Particulier, Professionnel, Collectivité
    segment = Column(String(50))  # Segment client
    solde = Column(Float, default=0)  # Solde client (en euros)
    limite_credit = Column(Float, default=0)
    actif = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    ventes = relationship("Vente", back_populates="client")
    commandes = relationship("Commande", back_populates="client")


class Produit(Base):
    """Produit vendable"""
    __tablename__ = "produits"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    code = Column(String(20), unique=True)
    type_produit = Column(Enum(TypeProduitEnum))
    description = Column(Text)
    prix_vente = Column(Float, nullable=False)  # Prix de vente unitaire
    unite = Column(String(20))  # kg, L, unité, etc.
    cout_production = Column(Float)  # Coût de production unitaire
    marge = Column(Float)  # Marge en %
    stock_id = Column(Integer, ForeignKey("stocks.id"))  # Lien vers le stock si applicable
    actif = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    stock = relationship("Stock")
    details_ventes = relationship("DetailVente", back_populates="produit")


class Vente(Base):
    """Vente"""
    __tablename__ = "ventes"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    date_vente = Column(DateTime(timezone=True), default=func.now())
    statut = Column(Enum(StatutVenteEnum), default=StatutVenteEnum.DEVIS)
    reference = Column(String(50), unique=True)  # Numéro de facture ou devis
    total_ht = Column(Float, default=0)
    total_tva = Column(Float, default=0)
    total_ttc = Column(Float, default=0)
    remises = Column(Float, default=0)  # Montant des remises
    mode_paiement = Column(String(50))  # Espèces, Chèque, Virement, CB
    date_paiement = Column(Date)
    date_livraison = Column(Date)
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    client = relationship("Client", back_populates="ventes")
    details = relationship("DetailVente", back_populates="vente", cascade="all, delete-orphan")


class DetailVente(Base):
    """Détail d'une vente"""
    __tablename__ = "details_ventes"
    
    id = Column(Integer, primary_key=True, index=True)
    vente_id = Column(Integer, ForeignKey("ventes.id"), nullable=False)
    produit_id = Column(Integer, ForeignKey("produits.id"))
    quantite = Column(Float, nullable=False)
    prix_unitaire = Column(Float, nullable=False)
    remises = Column(Float, default=0)  # Remise sur ce produit
    tva = Column(Float, default=20)  # Taux de TVA en %
    total_ht = Column(Float)
    total_tva = Column(Float)
    total_ttc = Column(Float)
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    vente = relationship("Vente", back_populates="details")
    produit = relationship("Produit", back_populates="details_ventes")
