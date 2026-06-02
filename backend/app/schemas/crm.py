"""
Schémas Pydantic pour la gestion du CRM
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class StatutProspectEnum(str, Enum):
    nouveau = "nouveau"
    contacte = "contacté"
    qualifie = "qualifié"
    proposition = "proposition"
    negotiation = "négociation"
    perdu = "perdu"
    converti = "converti"


class StatutCommandeEnum(str, Enum):
    devis = "devis"
    confirmee = "confirmée"
    en_cours = "en_cours"
    livree = "livrée"
    facturee = "facturée"
    payee = "payée"
    annulee = "annulée"


class SegmentClientEnum(str, Enum):
    agriculteur = "agriculteur"
    cooperative = "coopérative"
    negociant = "négociant"
    industriel = "industriel"
    particulier = "particulier"
    autre = "autre"


# Prospect
class ProspectBase(BaseModel):
    nom: str = Field(..., max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    raison_sociale: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    adresse: Optional[str] = None
    code_postal: Optional[str] = Field(None, max_length=20)
    ville: Optional[str] = Field(None, max_length=100)
    pays: str = Field(default="France", max_length=50)
    segment: Optional[SegmentClientEnum] = None
    statut: StatutProspectEnum = StatutProspectEnum.nouveau
    source: Optional[str] = Field(None, max_length=50)
    date_premier_contact: Optional[date] = None
    date_prochain_contact: Optional[date] = None
    potentiel: Optional[float] = None
    observations: Optional[str] = None
    actif: bool = True


class ProspectCreate(ProspectBase):
    pass


class ProspectUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    raison_sociale: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    adresse: Optional[str] = None
    code_postal: Optional[str] = Field(None, max_length=20)
    ville: Optional[str] = Field(None, max_length=100)
    pays: Optional[str] = Field(None, max_length=50)
    segment: Optional[SegmentClientEnum] = None
    statut: Optional[StatutProspectEnum] = None
    source: Optional[str] = Field(None, max_length=50)
    date_premier_contact: Optional[date] = None
    date_prochain_contact: Optional[date] = None
    potentiel: Optional[float] = None
    observations: Optional[str] = None
    actif: Optional[bool] = None


class ProspectResponse(ProspectBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Commande
class CommandeBase(BaseModel):
    client_id: int
    reference: str = Field(..., max_length=50)
    date_commande: Optional[datetime] = None
    statut: StatutCommandeEnum = StatutCommandeEnum.devis
    total_ht: float = 0
    total_tva: float = 0
    total_ttc: float = 0
    remises: float = 0
    date_livraison: Optional[date] = None
    observations: Optional[str] = None


class CommandeCreate(CommandeBase):
    pass


class CommandeUpdate(BaseModel):
    client_id: Optional[int] = None
    reference: Optional[str] = Field(None, max_length=50)
    date_commande: Optional[datetime] = None
    statut: Optional[StatutCommandeEnum] = None
    total_ht: Optional[float] = None
    total_tva: Optional[float] = None
    total_ttc: Optional[float] = None
    remises: Optional[float] = None
    date_livraison: Optional[date] = None
    observations: Optional[str] = None


class CommandeResponse(CommandeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Facture
class FactureBase(BaseModel):
    commande_id: Optional[int] = None
    client_id: int
    reference: str = Field(..., max_length=50)
    date_facture: date
    date_echeance: Optional[date] = None
    statut: Optional[str] = Field(None, max_length=50)
    total_ht: float = 0
    total_tva: float = 0
    total_ttc: float = 0
    montant_paye: float = 0
    mode_paiement: Optional[str] = Field(None, max_length=50)
    date_paiement: Optional[date] = None
    observations: Optional[str] = None


class FactureCreate(FactureBase):
    pass


class FactureUpdate(BaseModel):
    commande_id: Optional[int] = None
    client_id: Optional[int] = None
    reference: Optional[str] = Field(None, max_length=50)
    date_facture: Optional[date] = None
    date_echeance: Optional[date] = None
    statut: Optional[str] = Field(None, max_length=50)
    total_ht: Optional[float] = None
    total_tva: Optional[float] = None
    total_ttc: Optional[float] = None
    montant_paye: Optional[float] = None
    mode_paiement: Optional[str] = Field(None, max_length=50)
    date_paiement: Optional[date] = None
    observations: Optional[str] = None


class FactureResponse(FactureBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# SegmentClient
class SegmentClientBase(BaseModel):
    nom: str = Field(..., max_length=50)
    description: Optional[str] = None
    criteres: Optional[List[dict]] = None


class SegmentClientCreate(SegmentClientBase):
    pass


class SegmentClientUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    criteres: Optional[List[dict]] = None


class SegmentClientResponse(SegmentClientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# HistoriqueClient
class HistoriqueClientBase(BaseModel):
    client_id: Optional[int] = None
    prospect_id: Optional[int] = None
    date: datetime
    type_interaction: str = Field(..., max_length=50)
    sujet: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    operateur: Optional[str] = Field(None, max_length=100)
    resultat: Optional[str] = Field(None, max_length=100)
    prochain_contact: Optional[date] = None
    observations: Optional[str] = None


class HistoriqueClientCreate(HistoriqueClientBase):
    pass


class HistoriqueClientUpdate(BaseModel):
    client_id: Optional[int] = None
    prospect_id: Optional[int] = None
    date: Optional[datetime] = None
    type_interaction: Optional[str] = Field(None, max_length=50)
    sujet: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    operateur: Optional[str] = Field(None, max_length=100)
    resultat: Optional[str] = Field(None, max_length=100)
    prochain_contact: Optional[date] = None
    observations: Optional[str] = None


class HistoriqueClientResponse(HistoriqueClientBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
