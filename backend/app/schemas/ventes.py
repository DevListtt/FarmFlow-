"""
Schémas Pydantic pour la gestion des ventes
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from enum import Enum


class StatutVenteEnum(str, Enum):
    devis = "devis"
    commande = "commande"
    livree = "livrée"
    facturee = "facturée"
    payee = "payée"
    annulee = "annulée"


class TypeProduitEnum(str, Enum):
    animal = "animal"
    produit_agricole = "produit_agricole"
    produit_transforme = "produit_transformé"
    service = "service"
    autre = "autre"


# Client
class ClientBase(BaseModel):
    nom: str = Field(..., max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    raison_sociale: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    adresse: Optional[str] = None
    code_postal: Optional[str] = Field(None, max_length=20)
    ville: Optional[str] = Field(None, max_length=100)
    pays: str = Field(default="France", max_length=50)
    siret: Optional[str] = Field(None, max_length=50)
    tva_intracommunautaire: Optional[str] = Field(None, max_length=50)
    type_client: Optional[str] = Field(None, max_length=50)
    segment: Optional[str] = Field(None, max_length=50)
    solde: float = 0
    limite_credit: float = 0
    actif: bool = True
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    raison_sociale: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    adresse: Optional[str] = None
    code_postal: Optional[str] = Field(None, max_length=20)
    ville: Optional[str] = Field(None, max_length=100)
    pays: Optional[str] = Field(None, max_length=50)
    siret: Optional[str] = Field(None, max_length=50)
    tva_intracommunautaire: Optional[str] = Field(None, max_length=50)
    type_client: Optional[str] = Field(None, max_length=50)
    segment: Optional[str] = Field(None, max_length=50)
    solde: Optional[float] = None
    limite_credit: Optional[float] = None
    actif: Optional[bool] = None
    notes: Optional[str] = None


class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Produit
class ProduitBase(BaseModel):
    nom: str = Field(..., max_length=100)
    code: str = Field(..., max_length=20)
    type_produit: TypeProduitEnum
    description: Optional[str] = None
    prix_vente: float = Field(..., gt=0)
    unite: Optional[str] = Field(None, max_length=20)
    cout_production: Optional[float] = None
    marge: Optional[float] = None
    stock_id: Optional[int] = None
    actif: bool = True


class ProduitCreate(ProduitBase):
    pass


class ProduitUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    code: Optional[str] = Field(None, max_length=20)
    type_produit: Optional[TypeProduitEnum] = None
    description: Optional[str] = None
    prix_vente: Optional[float] = Field(None, gt=0)
    unite: Optional[str] = Field(None, max_length=20)
    cout_production: Optional[float] = None
    marge: Optional[float] = None
    stock_id: Optional[int] = None
    actif: Optional[bool] = None


class ProduitResponse(ProduitBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Vente
class VenteBase(BaseModel):
    client_id: int
    date_vente: Optional[datetime] = None
    statut: StatutVenteEnum = StatutVenteEnum.devis
    reference: Optional[str] = Field(None, max_length=50)
    total_ht: float = 0
    total_tva: float = 0
    total_ttc: float = 0
    remises: float = 0
    mode_paiement: Optional[str] = Field(None, max_length=50)
    date_paiement: Optional[date] = None
    date_livraison: Optional[date] = None
    observations: Optional[str] = None


class VenteCreate(VenteBase):
    pass


class VenteUpdate(BaseModel):
    client_id: Optional[int] = None
    date_vente: Optional[datetime] = None
    statut: Optional[StatutVenteEnum] = None
    reference: Optional[str] = Field(None, max_length=50)
    total_ht: Optional[float] = None
    total_tva: Optional[float] = None
    total_ttc: Optional[float] = None
    remises: Optional[float] = None
    mode_paiement: Optional[str] = Field(None, max_length=50)
    date_paiement: Optional[date] = None
    date_livraison: Optional[date] = None
    observations: Optional[str] = None


class VenteResponse(VenteBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# DetailVente
class DetailVenteBase(BaseModel):
    vente_id: int
    produit_id: Optional[int] = None
    quantite: float = Field(..., gt=0)
    prix_unitaire: float = Field(..., gt=0)
    remises: float = 0
    tva: float = 20
    total_ht: Optional[float] = None
    total_tva: Optional[float] = None
    total_ttc: Optional[float] = None
    observations: Optional[str] = None


class DetailVenteCreate(DetailVenteBase):
    pass


class DetailVenteUpdate(BaseModel):
    vente_id: Optional[int] = None
    produit_id: Optional[int] = None
    quantite: Optional[float] = Field(None, gt=0)
    prix_unitaire: Optional[float] = Field(None, gt=0)
    remises: Optional[float] = None
    tva: Optional[float] = None
    total_ht: Optional[float] = None
    total_tva: Optional[float] = None
    total_ttc: Optional[float] = None
    observations: Optional[str] = None


class DetailVenteResponse(DetailVenteBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
