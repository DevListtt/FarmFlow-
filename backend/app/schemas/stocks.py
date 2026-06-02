"""
Schémas Pydantic pour la gestion des stocks
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class TypeStockEnum(str, Enum):
    semence = "semence"
    engrais = "engrais"
    phyto = "phyto"
    produit_fini = "produit_fini"
    materiel = "matériel"
    fourrage = "fourrage"
    autre = "autre"


class UniteEnum(str, Enum):
    kg = "kg"
    l = "L"
    tonne = "tonne"
    unite = "unité"
    sachet = "sachet"
    boite = "boîte"
    bidon = "bidon"
    autre = "autre"


class TypeMouvementEnum(str, Enum):
    entree = "Entrée"
    sortie = "Sortie"
    transfert = "Transfert"
    ajustement = "Ajustement"


# CategorieduStock
class CategorieduStockBase(BaseModel):
    nom: str = Field(..., max_length=50)
    description: Optional[str] = None
    type_stock: TypeStockEnum


class CategorieduStockCreate(CategorieduStockBase):
    pass


class CategorieduStockUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    type_stock: Optional[TypeStockEnum] = None


class CategorieduStockResponse(CategorieduStockBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Fournisseur
class FournisseurBase(BaseModel):
    nom: str = Field(..., max_length=100)
    contact: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    adresse: Optional[str] = None
    notes: Optional[str] = None


class FournisseurCreate(FournisseurBase):
    pass


class FournisseurUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    contact: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    adresse: Optional[str] = None
    notes: Optional[str] = None


class FournisseurResponse(FournisseurBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Stock
class StockBase(BaseModel):
    nom: str = Field(..., max_length=100)
    code: str = Field(..., max_length=20)
    categorie_id: Optional[int] = None
    fournisseur_id: Optional[int] = None
    quantite: float = 0
    unite: UniteEnum = UniteEnum.unite
    prix_achat: Optional[float] = None
    prix_vente: Optional[float] = None
    seuil_alert: float = 0
    date_expiration: Optional[date] = None
    emplacement: Optional[str] = Field(None, max_length=100)
    lot: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    actif: bool = True


class StockCreate(StockBase):
    pass


class StockUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    code: Optional[str] = Field(None, max_length=20)
    categorie_id: Optional[int] = None
    fournisseur_id: Optional[int] = None
    quantite: Optional[float] = None
    unite: Optional[UniteEnum] = None
    prix_achat: Optional[float] = None
    prix_vente: Optional[float] = None
    seuil_alert: Optional[float] = None
    date_expiration: Optional[date] = None
    emplacement: Optional[str] = Field(None, max_length=100)
    lot: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    actif: Optional[bool] = None


class StockResponse(StockBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# MouvementStock
class MouvementStockBase(BaseModel):
    stock_id: int
    type_mouvement: TypeMouvementEnum
    quantite: float = Field(..., gt=0)
    unite: UniteEnum
    date_mouvement: Optional[datetime] = None
    reference: Optional[str] = Field(None, max_length=50)
    cout_unitaire: Optional[float] = None
    cout_total: Optional[float] = None
    destination: Optional[str] = Field(None, max_length=100)
    origine: Optional[str] = Field(None, max_length=100)
    operateur: Optional[str] = Field(None, max_length=100)
    observations: Optional[str] = None


class MouvementStockCreate(MouvementStockBase):
    pass


class MouvementStockUpdate(BaseModel):
    stock_id: Optional[int] = None
    type_mouvement: Optional[TypeMouvementEnum] = None
    quantite: Optional[float] = Field(None, gt=0)
    unite: Optional[UniteEnum] = None
    date_mouvement: Optional[datetime] = None
    reference: Optional[str] = Field(None, max_length=50)
    cout_unitaire: Optional[float] = None
    cout_total: Optional[float] = None
    destination: Optional[str] = Field(None, max_length=100)
    origine: Optional[str] = Field(None, max_length=100)
    operateur: Optional[str] = Field(None, max_length=100)
    observations: Optional[str] = None


class MouvementStockResponse(MouvementStockBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
