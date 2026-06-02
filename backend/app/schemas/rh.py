"""
Schémas Pydantic pour la gestion des Ressources Humaines
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class StatutEmployeEnum(str, Enum):
    actif = "actif"
    en_conge = "en_congé"
    malade = "malade"
    en_formation = "en_formation"
    licencie = "licencié"
    retraite = "retraite"


class TypeContratEnum(str, Enum):
    cdi = "CDI"
    cdd = "CDD"
    interim = "intérim"
    apprentissage = "apprentissage"
    stage = "stage"
    temps_partiel = "temps_partiel"


class TypeCongesEnum(str, Enum):
    payes = "payés"
    rtt = "RTT"
    maladie = "maladie"
    maternite = "maternité"
    paternite = "paternité"
    sans_solde = "sans_solde"
    autre = "autre"


# Poste
class PosteBase(BaseModel):
    nom: str = Field(..., max_length=100)
    description: Optional[str] = None
    service: Optional[str] = Field(None, max_length=50)
    niveau: Optional[str] = Field(None, max_length=50)
    salaire_min: Optional[float] = None
    salaire_max: Optional[float] = None
    actif: bool = True


class PosteCreate(PosteBase):
    pass


class PosteUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    service: Optional[str] = Field(None, max_length=50)
    niveau: Optional[str] = Field(None, max_length=50)
    salaire_min: Optional[float] = None
    salaire_max: Optional[float] = None
    actif: Optional[bool] = None


class PosteResponse(PosteBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Employe
class EmployeBase(BaseModel):
    matricule: str = Field(..., max_length=20)
    nom: str = Field(..., max_length=100)
    prenom: str = Field(..., max_length=100)
    poste_id: Optional[int] = None
    date_naissance: Optional[date] = None
    lieu_naissance: Optional[str] = Field(None, max_length=100)
    adresse: Optional[str] = None
    code_postal: Optional[str] = Field(None, max_length=20)
    ville: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: str = Field(..., max_length=100)
    date_embauche: Optional[date] = None
    type_contrat: Optional[TypeContratEnum] = None
    date_fin_contrat: Optional[date] = None
    statut: StatutEmployeEnum = StatutEmployeEnum.actif
    salaire_brut: Optional[float] = None
    salaire_net: Optional[float] = None
    banques: Optional[List[dict]] = None
    securite_sociale: Optional[str] = Field(None, max_length=50)
    mutuelle: Optional[str] = Field(None, max_length=100)
    prevoyance: Optional[str] = Field(None, max_length=100)
    photo: Optional[str] = Field(None, max_length=255)
    actif: bool = True
    notes: Optional[str] = None


class EmployeCreate(EmployeBase):
    pass


class EmployeUpdate(BaseModel):
    matricule: Optional[str] = Field(None, max_length=20)
    nom: Optional[str] = Field(None, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    poste_id: Optional[int] = None
    date_naissance: Optional[date] = None
    lieu_naissance: Optional[str] = Field(None, max_length=100)
    adresse: Optional[str] = None
    code_postal: Optional[str] = Field(None, max_length=20)
    ville: Optional[str] = Field(None, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    date_embauche: Optional[date] = None
    type_contrat: Optional[TypeContratEnum] = None
    date_fin_contrat: Optional[date] = None
    statut: Optional[StatutEmployeEnum] = None
    salaire_brut: Optional[float] = None
    salaire_net: Optional[float] = None
    banques: Optional[List[dict]] = None
    securite_sociale: Optional[str] = Field(None, max_length=50)
    mutuelle: Optional[str] = Field(None, max_length=100)
    prevoyance: Optional[str] = Field(None, max_length=100)
    photo: Optional[str] = Field(None, max_length=255)
    actif: Optional[bool] = None
    notes: Optional[str] = None


class EmployeResponse(EmployeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Conges
class CongesBase(BaseModel):
    employe_id: int
    type_conges: TypeCongesEnum
    date_debut: date
    date_fin: date
    duree: float = Field(..., gt=0)
    motif: Optional[str] = None
    statut: Optional[str] = Field(None, max_length=50)
    approbateur: Optional[str] = Field(None, max_length=100)
    date_approbation: Optional[date] = None
    observations: Optional[str] = None


class CongesCreate(CongesBase):
    pass


class CongesUpdate(BaseModel):
    employe_id: Optional[int] = None
    type_conges: Optional[TypeCongesEnum] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    duree: Optional[float] = Field(None, gt=0)
    motif: Optional[str] = None
    statut: Optional[str] = Field(None, max_length=50)
    approbateur: Optional[str] = Field(None, max_length=100)
    date_approbation: Optional[date] = None
    observations: Optional[str] = None


class CongesResponse(CongesBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Paie
class PaieBase(BaseModel):
    employe_id: int
    mois: int = Field(..., ge=1, le=12)
    annee: int = Field(..., ge=2000, le=2100)
    salaire_brut: float = Field(..., gt=0)
    salaire_net: float = Field(..., gt=0)
    heures_travaillees: float = 0
    heures_supplementaires: float = 0
    primes: float = 0
    cotisations_sociales: float = 0
    impots: float = 0
    autres_retentions: float = 0
    net_a_payer: float = Field(..., gt=0)
    date_paiement: Optional[date] = None
    mode_paiement: Optional[str] = Field(None, max_length=50)
    observations: Optional[str] = None


class PaieCreate(PaieBase):
    pass


class PaieUpdate(BaseModel):
    employe_id: Optional[int] = None
    mois: Optional[int] = Field(None, ge=1, le=12)
    annee: Optional[int] = Field(None, ge=2000, le=2100)
    salaire_brut: Optional[float] = Field(None, gt=0)
    salaire_net: Optional[float] = Field(None, gt=0)
    heures_travaillees: Optional[float] = None
    heures_supplementaires: Optional[float] = None
    primes: Optional[float] = None
    cotisations_sociales: Optional[float] = None
    impots: Optional[float] = None
    autres_retentions: Optional[float] = None
    net_a_payer: Optional[float] = Field(None, gt=0)
    date_paiement: Optional[date] = None
    mode_paiement: Optional[str] = Field(None, max_length=50)
    observations: Optional[str] = None


class PaieResponse(PaieBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Formation
class FormationBase(BaseModel):
    employe_id: int
    titre: str = Field(..., max_length=100)
    description: Optional[str] = None
    type_formation: Optional[str] = Field(None, max_length=50)
    organisme: Optional[str] = Field(None, max_length=100)
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    duree: Optional[float] = None
    cout: float = 0
    statut: Optional[str] = Field(None, max_length=50)
    certificat: bool = False
    observations: Optional[str] = None


class FormationCreate(FormationBase):
    pass


class FormationUpdate(BaseModel):
    employe_id: Optional[int] = None
    titre: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    type_formation: Optional[str] = Field(None, max_length=50)
    organisme: Optional[str] = Field(None, max_length=100)
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    duree: Optional[float] = None
    cout: Optional[float] = None
    statut: Optional[str] = Field(None, max_length=50)
    certificat: Optional[bool] = None
    observations: Optional[str] = None


class FormationResponse(FormationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Evaluation
class EvaluationBase(BaseModel):
    employe_id: int
    evaluateur: str = Field(..., max_length=100)
    date_evaluation: date
    periode_evaluation: Optional[str] = Field(None, max_length=50)
    note_competences: Optional[float] = Field(None, ge=0, le=20)
    note_productivite: Optional[float] = Field(None, ge=0, le=20)
    note_ponctualite: Optional[float] = Field(None, ge=0, le=20)
    note_esprit_equipe: Optional[float] = Field(None, ge=0, le=20)
    note_globale: Optional[float] = Field(None, ge=0, le=20)
    commentaires: Optional[str] = None
    objectifs: Optional[str] = None
    plan_action: Optional[str] = None


class EvaluationCreate(EvaluationBase):
    pass


class EvaluationUpdate(BaseModel):
    employe_id: Optional[int] = None
    evaluateur: Optional[str] = Field(None, max_length=100)
    date_evaluation: Optional[date] = None
    periode_evaluation: Optional[str] = Field(None, max_length=50)
    note_competences: Optional[float] = Field(None, ge=0, le=20)
    note_productivite: Optional[float] = Field(None, ge=0, le=20)
    note_ponctualite: Optional[float] = Field(None, ge=0, le=20)
    note_esprit_equipe: Optional[float] = Field(None, ge=0, le=20)
    note_globale: Optional[float] = Field(None, ge=0, le=20)
    commentaires: Optional[str] = None
    objectifs: Optional[str] = None
    plan_action: Optional[str] = None


class EvaluationResponse(EvaluationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
