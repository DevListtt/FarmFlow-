"""
Schémas Pydantic pour la gestion de la comptabilité
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from enum import Enum


class TypeCompteEnum(str, Enum):
    actif = "actif"
    passif = "passif"
    charge = "charge"
    produit = "produit"
    tresorerie = "trésorerie"


class TypeJournalEnum(str, Enum):
    achats = "achats"
    ventes = "ventes"
    banque = "banque"
    caisse = "caisse"
    od = "od"


class StatutFactureEnum(str, Enum):
    brouillon = "brouillon"
    validee = "validée"
    payee = "payée"
    impayee = "impayée"
    annulee = "annulée"


# CompteComptable
class CompteComptableBase(BaseModel):
    numero: str = Field(..., max_length=20)
    nom: str = Field(..., max_length=100)
    type_compte: TypeCompteEnum
    parent_id: Optional[int] = None
    description: Optional[str] = None
    solde: float = 0
    actif: bool = True


class CompteComptableCreate(CompteComptableBase):
    pass


class CompteComptableUpdate(BaseModel):
    numero: Optional[str] = Field(None, max_length=20)
    nom: Optional[str] = Field(None, max_length=100)
    type_compte: Optional[TypeCompteEnum] = None
    parent_id: Optional[int] = None
    description: Optional[str] = None
    solde: Optional[float] = None
    actif: Optional[bool] = None


class CompteComptableResponse(CompteComptableBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Journal
class JournalBase(BaseModel):
    code: str = Field(..., max_length=10)
    nom: str = Field(..., max_length=100)
    type_journal: TypeJournalEnum
    description: Optional[str] = None
    actif: bool = True


class JournalCreate(JournalBase):
    pass


class JournalUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=10)
    nom: Optional[str] = Field(None, max_length=100)
    type_journal: Optional[TypeJournalEnum] = None
    description: Optional[str] = None
    actif: Optional[bool] = None


class JournalResponse(JournalBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# EcritureComptable
class EcritureComptableBase(BaseModel):
    journal_id: int
    compte_id: int
    date: date
    reference: Optional[str] = Field(None, max_length=50)
    libelle: str = Field(..., max_length=200)
    debit: float = 0
    credit: float = 0
    solde: float = 0
    observations: Optional[str] = None


class EcritureComptableCreate(EcritureComptableBase):
    pass


class EcritureComptableUpdate(BaseModel):
    journal_id: Optional[int] = None
    compte_id: Optional[int] = None
    date: Optional[date] = None
    reference: Optional[str] = Field(None, max_length=50)
    libelle: Optional[str] = Field(None, max_length=200)
    debit: Optional[float] = None
    credit: Optional[float] = None
    solde: Optional[float] = None
    observations: Optional[str] = None


class EcritureComptableResponse(EcritureComptableBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# FournisseurComptable
class FournisseurComptableBase(BaseModel):
    nom: str = Field(..., max_length=100)
    raison_sociale: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    adresse: Optional[str] = None
    code_postal: Optional[str] = Field(None, max_length=20)
    ville: Optional[str] = Field(None, max_length=100)
    pays: str = Field(default="France", max_length=50)
    siret: Optional[str] = Field(None, max_length=50)
    tva_intracommunautaire: Optional[str] = Field(None, max_length=50)
    compte_comptable_id: Optional[int] = None
    solde: float = 0
    actif: bool = True
    notes: Optional[str] = None


class FournisseurComptableCreate(FournisseurComptableBase):
    pass


class FournisseurComptableUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    raison_sociale: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    adresse: Optional[str] = None
    code_postal: Optional[str] = Field(None, max_length=20)
    ville: Optional[str] = Field(None, max_length=100)
    pays: Optional[str] = Field(None, max_length=50)
    siret: Optional[str] = Field(None, max_length=50)
    tva_intracommunautaire: Optional[str] = Field(None, max_length=50)
    compte_comptable_id: Optional[int] = None
    solde: Optional[float] = None
    actif: Optional[bool] = None
    notes: Optional[str] = None


class FournisseurComptableResponse(FournisseurComptableBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# FactureFournisseur
class FactureFournisseurBase(BaseModel):
    fournisseur_id: int
    reference: str = Field(..., max_length=50)
    date_facture: date
    date_echeance: Optional[date] = None
    statut: StatutFactureEnum = StatutFactureEnum.brouillon
    total_ht: float = 0
    total_tva: float = 0
    total_ttc: float = 0
    montant_paye: float = 0
    mode_paiement: Optional[str] = Field(None, max_length=50)
    date_paiement: Optional[date] = None
    observations: Optional[str] = None


class FactureFournisseurCreate(FactureFournisseurBase):
    pass


class FactureFournisseurUpdate(BaseModel):
    fournisseur_id: Optional[int] = None
    reference: Optional[str] = Field(None, max_length=50)
    date_facture: Optional[date] = None
    date_echeance: Optional[date] = None
    statut: Optional[StatutFactureEnum] = None
    total_ht: Optional[float] = None
    total_tva: Optional[float] = None
    total_ttc: Optional[float] = None
    montant_paye: Optional[float] = None
    mode_paiement: Optional[str] = Field(None, max_length=50)
    date_paiement: Optional[date] = None
    observations: Optional[str] = None


class FactureFournisseurResponse(FactureFournisseurBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
