"""
Tables transactionnelles V1.

Ces modeles servent les flux reels du noyau operationnel : produits POS,
segments clients, tickets, achats, mouvements de stock, ecritures comptables,
operations bancaires et rapprochements.
"""
from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class TiersAgri(Base):
    __tablename__ = "tx_tiers_agri"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(40), unique=True, index=True, nullable=False)
    nom = Column(String(160), nullable=False)
    type_tiers = Column(String(40), nullable=False, default="client")
    segment = Column(String(40), default="circuit-court")
    canal = Column(String(80))
    email = Column(String(120))
    telephone = Column(String(40))
    delai_paiement = Column(Integer, default=0)
    remise_reference = Column(Float, default=0)
    volume_annuel = Column(Float, default=0)
    actif = Column(Boolean, default=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tickets = relationship("TicketCaisseAgri", back_populates="client")


class ProduitAgri(Base):
    __tablename__ = "tx_produits_agri"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(60), unique=True, index=True, nullable=False)
    code_barres = Column(String(80), unique=True, index=True)
    nom = Column(String(160), nullable=False)
    famille = Column(String(80), default="Produit")
    unite = Column(String(20), default="piece")
    prix_vente = Column(Float, nullable=False, default=0)
    prix_kg = Column(Float)
    tva = Column(Float, default=5.5)
    cout_revient = Column(Float, default=0)
    stock = Column(Float, default=0)
    seuil_alerte = Column(Float, default=0)
    lot_courant = Column(String(80))
    actif = Column(Boolean, default=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lignes_ticket = relationship("LigneTicketAgri", back_populates="produit")
    mouvements = relationship("MouvementStockAgri", back_populates="produit")


class TicketCaisseAgri(Base):
    __tablename__ = "tx_tickets_caisse_agri"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(80), unique=True, index=True, nullable=False)
    client_id = Column(Integer, ForeignKey("tx_tiers_agri.id"))
    client_nom = Column(String(160), nullable=False)
    segment = Column(String(40), default="circuit-court")
    moyen_paiement = Column(String(40), default="card")
    statut = Column(String(40), default="valide")
    remise_percent = Column(Float, default=0)
    total_ht = Column(Float, default=0)
    total_tva = Column(Float, default=0)
    total_ttc = Column(Float, default=0)
    cout_revient = Column(Float, default=0)
    marge = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("TiersAgri", back_populates="tickets")
    lignes = relationship("LigneTicketAgri", back_populates="ticket", cascade="all, delete-orphan")


class LigneTicketAgri(Base):
    __tablename__ = "tx_lignes_ticket_agri"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tx_tickets_caisse_agri.id"), nullable=False)
    produit_id = Column(Integer, ForeignKey("tx_produits_agri.id"))
    produit_code = Column(String(80), nullable=False)
    libelle = Column(String(180), nullable=False)
    lot = Column(String(80))
    quantite = Column(Float, nullable=False)
    unite = Column(String(20), default="piece")
    prix_unitaire = Column(Float, nullable=False)
    tva = Column(Float, default=5.5)
    total_ttc = Column(Float, default=0)
    marge = Column(Float, default=0)
    source = Column(String(40), default="manuel")
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("TicketCaisseAgri", back_populates="lignes")
    produit = relationship("ProduitAgri", back_populates="lignes_ticket")


class MouvementStockAgri(Base):
    __tablename__ = "tx_mouvements_stock_agri"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(80), unique=True, index=True, nullable=False)
    produit_id = Column(Integer, ForeignKey("tx_produits_agri.id"))
    produit_code = Column(String(80), nullable=False)
    libelle = Column(String(180), nullable=False)
    lot = Column(String(80))
    sens = Column(String(30), nullable=False)
    quantite = Column(Float, nullable=False)
    unite = Column(String(20), default="piece")
    cout_unitaire = Column(Float, default=0)
    valorisation = Column(Float, default=0)
    origine = Column(String(120))
    atelier = Column(String(120))
    document_reference = Column(String(80))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    produit = relationship("ProduitAgri", back_populates="mouvements")


class CommandeAchatAgri(Base):
    __tablename__ = "tx_commandes_achat_agri"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(80), unique=True, index=True, nullable=False)
    fournisseur = Column(String(160), nullable=False)
    produit_code = Column(String(80), nullable=False)
    quantite = Column(Float, nullable=False)
    unite = Column(String(20), default="piece")
    prix_unitaire = Column(Float, default=0)
    tva = Column(Float, default=10)
    total_ht = Column(Float, default=0)
    total_tva = Column(Float, default=0)
    total_ttc = Column(Float, default=0)
    atelier = Column(String(120))
    statut = Column(String(40), default="reception_preparee")
    facture_reference = Column(String(80))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CommandeClientAgri(Base):
    __tablename__ = "tx_commandes_clients_agri"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(80), unique=True, index=True, nullable=False)
    client_id = Column(Integer, ForeignKey("tx_tiers_agri.id"))
    client_nom = Column(String(160), nullable=False)
    segment = Column(String(40), default="circuit-court")
    canal = Column(String(80))
    source = Column(String(40), default="portail")
    mode_retrait = Column(String(60), default="retrait-ferme")
    date_retrait = Column(Date)
    commentaire = Column(Text)
    statut = Column(String(40), default="reservee")
    remise_percent = Column(Float, default=0)
    total_ht = Column(Float, default=0)
    total_tva = Column(Float, default=0)
    total_ttc = Column(Float, default=0)
    montant_reserve = Column(Float, default=0)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("TiersAgri")
    lignes = relationship("LigneCommandeClientAgri", back_populates="commande", cascade="all, delete-orphan")


class LigneCommandeClientAgri(Base):
    __tablename__ = "tx_lignes_commandes_clients_agri"

    id = Column(Integer, primary_key=True, index=True)
    commande_id = Column(Integer, ForeignKey("tx_commandes_clients_agri.id"), nullable=False)
    produit_id = Column(Integer, ForeignKey("tx_produits_agri.id"))
    produit_code = Column(String(80), nullable=False)
    libelle = Column(String(180), nullable=False)
    lot = Column(String(80))
    quantite = Column(Float, nullable=False)
    quantite_reservee = Column(Float, default=0)
    unite = Column(String(20), default="piece")
    prix_unitaire = Column(Float, nullable=False)
    tva = Column(Float, default=5.5)
    total_ttc = Column(Float, default=0)
    stock_disponible_avant = Column(Float, default=0)
    statut = Column(String(40), default="reservee")
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    commande = relationship("CommandeClientAgri", back_populates="lignes")
    produit = relationship("ProduitAgri")


class EcritureAutoAgri(Base):
    __tablename__ = "tx_ecritures_auto_agri"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(80), index=True, nullable=False)
    journal = Column(String(30), nullable=False)
    compte = Column(String(30))
    libelle = Column(String(220), nullable=False)
    debit = Column(Float, default=0)
    credit = Column(Float, default=0)
    document_type = Column(String(40))
    document_reference = Column(String(80))
    statut = Column(String(40), default="proposee")
    date_ecriture = Column(Date, server_default=func.current_date())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class OperationBancaireAgri(Base):
    __tablename__ = "tx_operations_bancaires_agri"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(80), unique=True, index=True, nullable=False)
    date_operation = Column(Date, nullable=False)
    libelle = Column(String(220), nullable=False)
    montant = Column(Float, nullable=False)
    categorie = Column(String(80))
    statut = Column(String(40), default="a_rapprocher")
    document_reference = Column(String(80))
    score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditFluxAgri(Base):
    __tablename__ = "tx_audit_flux_agri"

    id = Column(Integer, primary_key=True, index=True)
    flux = Column(String(80), nullable=False)
    reference = Column(String(80), index=True, nullable=False)
    action = Column(String(160), nullable=False)
    statut = Column(String(40), default="ok")
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
