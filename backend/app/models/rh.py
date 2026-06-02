"""
Modèles pour la gestion des Ressources Humaines
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum


class StatutEmployeEnum(PyEnum):
    ACTIF = "actif"
    EN_CONGE = "en_congé"
    MALADE = "malade"
    EN_FORMATION = "en_formation"
    LICENCIE = "licencié"
    RETRAITE = "retraite"


class TypeContratEnum(PyEnum):
    CDI = "CDI"
    CDD = "CDD"
    INTERIM = "intérim"
    APPRENTISSAGE = "apprentissage"
    STAGE = "stage"
    TEMPS_PARTIEL = "temps_partiel"


class TypeCongesEnum(PyEnum):
    PAYES = "payés"
    RTT = "RTT"
    MALADIE = "maladie"
    MATERNITE = "maternité"
    PATERNITE = "paternité"
    SANS_SOLDE = "sans_solde"
    AUTRE = "autre"


class Poste(Base):
    """Poste de travail"""
    __tablename__ = "postes"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    service = Column(String(50))  # Service ou département
    niveau = Column(String(50))  # Niveau hiérarchique
    salaire_min = Column(Float)  # Salaire minimum
    salaire_max = Column(Float)  # Salaire maximum
    actif = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    employes = relationship("Employe", back_populates="poste")


class Employe(Base):
    """Employé"""
    __tablename__ = "employes"
    
    id = Column(Integer, primary_key=True, index=True)
    matricule = Column(String(20), unique=True)  # Numéro de matricule
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    poste_id = Column(Integer, ForeignKey("postes.id"))
    date_naissance = Column(Date)
    lieu_naissance = Column(String(100))
    adresse = Column(Text)
    code_postal = Column(String(20))
    ville = Column(String(100))
    telephone = Column(String(20))
    email = Column(String(100), unique=True)
    date_embauche = Column(Date)
    type_contrat = Column(Enum(TypeContratEnum))
    date_fin_contrat = Column(Date)  # Pour les CDD
    statut = Column(Enum(StatutEmployeEnum), default=StatutEmployeEnum.ACTIF)
    salaire_brut = Column(Float)  # Salaire brut mensuel
    salaire_net = Column(Float)  # Salaire net mensuel
    banques = Column(JSON)  # Coordonnées bancaires
    securite_sociale = Column(String(50))
    mutuelle = Column(String(100))
    prevoyance = Column(String(100))
    photo = Column(String(255))  # Chemin vers la photo
    actif = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    poste = relationship("Poste", back_populates="employes")
    conges = relationship("Conges", back_populates="employe", cascade="all, delete-orphan")
    paies = relationship("Paie", back_populates="employe", cascade="all, delete-orphan")
    formations = relationship("Formation", back_populates="employe", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="employe", cascade="all, delete-orphan")


class Conges(Base):
    """Congés et absences"""
    __tablename__ = "conges"
    
    id = Column(Integer, primary_key=True, index=True)
    employe_id = Column(Integer, ForeignKey("employes.id"), nullable=False)
    type_conges = Column(Enum(TypeCongesEnum))
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date, nullable=False)
    duree = Column(Float)  # en jours
    motif = Column(Text)
    statut = Column(String(50))  # En attente, Approuvé, Refusé
    approbateur = Column(String(100))
    date_approbation = Column(Date)
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    employe = relationship("Employe", back_populates="conges")


class Paie(Base):
    """Bulletin de paie"""
    __tablename__ = "paies"
    
    id = Column(Integer, primary_key=True, index=True)
    employe_id = Column(Integer, ForeignKey("employes.id"), nullable=False)
    mois = Column(Integer)  # Mois (1-12)
    annee = Column(Integer)  # Année
    salaire_brut = Column(Float, nullable=False)
    salaire_net = Column(Float, nullable=False)
    heures_travaillees = Column(Float)  # Heures travaillées
    heures_supplementaires = Column(Float, default=0)
    primes = Column(Float, default=0)
    cotisations_sociales = Column(Float, default=0)
    impots = Column(Float, default=0)
    autres_retentions = Column(Float, default=0)
    net_a_payer = Column(Float, nullable=False)
    date_paiement = Column(Date)
    mode_paiement = Column(String(50))
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    employe = relationship("Employe", back_populates="paies")


class Formation(Base):
    """Formation des employés"""
    __tablename__ = "formations"
    
    id = Column(Integer, primary_key=True, index=True)
    employe_id = Column(Integer, ForeignKey("employes.id"), nullable=False)
    titre = Column(String(100), nullable=False)
    description = Column(Text)
    type_formation = Column(String(50))  # Interne, Externe, Obligatoire
    organisme = Column(String(100))
    date_debut = Column(Date)
    date_fin = Column(Date)
    duree = Column(Float)  # en heures
    cout = Column(Float, default=0)
    statut = Column(String(50))  # Planifiée, En cours, Terminé, Annulé
    certificat = Column(Boolean, default=False)
    observations = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    employe = relationship("Employe", back_populates="formations")


class Evaluation(Base):
    """Évaluation des employés"""
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    employe_id = Column(Integer, ForeignKey("employes.id"), nullable=False)
    evaluateur = Column(String(100))
    date_evaluation = Column(Date, nullable=False)
    periode_evaluation = Column(String(50))  # Trimestrielle, Semestrielle, Annuelle
    note_competences = Column(Float)  # Note sur 20
    note_productivite = Column(Float)
    note_ponctualite = Column(Float)
    note_esprit_equipe = Column(Float)
    note_globale = Column(Float)
    commentaires = Column(Text)
    objectifs = Column(Text)
    plan_action = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    employe = relationship("Employe", back_populates="evaluations")
