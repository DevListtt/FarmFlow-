# Modèles SQLAlchemy
from .animaux import Animal, Race, TypeAnimal, SuiviSante, Reproduction
from .parcelles import Parcelle, TypeSol, Culture, ItineraireTechnique, Intervention
from .stocks import Stock, CategorieduStock, MouvementStock, Fournisseur
from .ventes import Vente, DetailVente, Produit, Client
from .chantiers import Chantier, Tache, Equipement, Maintenance
from .rh import Employe, Poste, Conges, Paie, Formation, Evaluation
from .flotte import Vehicule, TypeVehicule, Entretien, Carburant, Conducteur
from .crm import Prospect, Commande, Facture, SegmentClient, HistoriqueClient
from .comptabilite import CompteComptable, EcritureComptable, Journal, FournisseurComptable, FactureFournisseur
from .communication import Campagne, CanalCommunication, ModeleMessage, EnvoiMessage
from .messagerie import Message, Conversation, PieceJointe
from .calendrier import Evenement, Rappel, TypeEvenement

__all__ = [
    # Animaux
    'Animal', 'Race', 'TypeAnimal', 'SuiviSante', 'Reproduction',
    # Parcelles
    'Parcelle', 'TypeSol', 'Culture', 'ItineraireTechnique', 'Intervention',
    # Stocks
    'Stock', 'CategorieduStock', 'MouvementStock', 'Fournisseur',
    # Ventes
    'Vente', 'DetailVente', 'Produit', 'Client',
    # Chantiers
    'Chantier', 'Tache', 'Equipement', 'Maintenance',
    # RH
    'Employe', 'Poste', 'Conges', 'Paie', 'Formation', 'Evaluation',
    # Flotte
    'Vehicule', 'TypeVehicule', 'Entretien', 'Carburant', 'Conducteur',
    # CRM
    'Prospect', 'Commande', 'Facture', 'SegmentClient', 'HistoriqueClient',
    # Comptabilité
    'CompteComptable', 'EcritureComptable', 'Journal', 'FournisseurComptable', 'FactureFournisseur',
    # Communication
    'Campagne', 'CanalCommunication', 'ModeleMessage', 'EnvoiMessage',
    # Messagerie
    'Message', 'Conversation', 'PieceJointe',
    # Calendrier
    'Evenement', 'Rappel', 'TypeEvenement'
]
