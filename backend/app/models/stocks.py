"""
Modèles pour la gestion des stocks
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum


class TypeStockEnum(PyEnum):
    SEMENCE = "semence"
    ENGRAIS = "engrais"
    PHYTO = "phyto"
    PRODUIT_FINI = "produit_fini"
    MATERIEL = "matériel"
    FOURRAGE = "fourrage"
    AUTRE = "autre"


class UniteEnum(PyEnum):
    KG = "kg"
    L = "L"
    TONNE = "tonne"
    UNITE = "unité"
    SACHET = "sachet"
    BOITE = "boîte"
    BIDON = "bidon"
    AUTRE = "autre"


class CategorieduStock(Base):
    """Catégorie de stock"""
    __tablename__ = "categories_stock"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    type_stock = Column(Enum(TypeStockEnum))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    stocks = relationship("Stock", back_populates="categorie")


class Fournisseur(Base):
    """Fournisseur de stocks"""
    __tablename__ = "fournisseurs_stock"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    contact = Column(String(100))
    telephone = Column(String(20))
    email = Column(String(100))
    adresse = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    stocks = relationship("Stock", back_populates="fournisseur")


class Stock(Base):
    """Stock de produits"""
    __tablename__ = "stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    code = Column(String(20), unique=True)  # Code interne ou code-barres
    categorie_id = Column(Integer, ForeignKey("categories_stock.id"))
    fournisseur_id = Column(Integer, ForeignKey("fournisseurs_stock.id"))
    quantite = Column(Float, default=0)  # Quantité en stock
    unite = Column(Enum(UniteEnum), default=UniteEnum.UNITE)
    prix_achat = Column(Float)  # Prix d'achat unitaire
    prix_vente = Column(Float)  # Prix de vente unitaire
    seuil_alert = Column(Float, default=0)  # Seuil d'alerte
    date_expiration = Column(Date)  # Date de péremption
    emplacement = Column(String(100))  # Emplacement dans le stock
    lot = Column(String(50))  # Numéro de lot
    description = Column(Text)
    actif = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    categorie = relationship("CategorieduStock", back_populates="stocks")
    fournisseur = relationship("Fournisseur", back_populates="stocks")
    mouvements = relationship("MouvementStock", back_populates="stock", cascade="all, delete-orphan")


class MouvementStock(Base):
    """Mouvement de stock (entrée, sortie, transfert)"""
    __tablename__ = "mouvements_stock"
    
    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    type_mouvement = Column(String(20))  # Entrée, Sortie, Transfert, Ajustement
    quantite = Column(Float, nullable=False)
    unite = Column(Enum(UniteEnum))
    date_mouvement = Column(DateTime(timezone=True), default=func.now())
    reference = Column(String(50))  # Référence du document (facture, bon de livraison, etc.)
    cout_unitaire = Column(Float)  # Coût unitaire
    cout_total = Column(Float)  # Coût total
    destination = Column(String(100))  # Destination pour les sorties
    origine = Column(String(100))  # Origine pour les entrées
    operateur = Column(String(100))
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    stock = relationship("Stock", back_populates="mouvements")
