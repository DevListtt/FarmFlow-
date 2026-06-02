# Schémas Pydantic
from .animaux import (
    TypeAnimalCreate, TypeAnimalUpdate, TypeAnimalResponse,
    RaceCreate, RaceUpdate, RaceResponse,
    AnimalCreate, AnimalUpdate, AnimalResponse,
    SuiviSanteCreate, SuiviSanteUpdate, SuiviSanteResponse,
    ReproductionCreate, ReproductionUpdate, ReproductionResponse
)
from .parcelles import (
    TypeSolCreate, TypeSolUpdate, TypeSolResponse,
    ParcelleCreate, ParcelleUpdate, ParcelleResponse,
    CultureCreate, CultureUpdate, CultureResponse,
    ItineraireTechniqueCreate, ItineraireTechniqueUpdate, ItineraireTechniqueResponse,
    InterventionCreate, InterventionUpdate, InterventionResponse
)
from .stocks import (
    CategorieduStockCreate, CategorieduStockUpdate, CategorieduStockResponse,
    FournisseurCreate, FournisseurUpdate, FournisseurResponse,
    StockCreate, StockUpdate, StockResponse,
    MouvementStockCreate, MouvementStockUpdate, MouvementStockResponse
)
from .ventes import (
    ClientCreate, ClientUpdate, ClientResponse,
    ProduitCreate, ProduitUpdate, ProduitResponse,
    VenteCreate, VenteUpdate, VenteResponse,
    DetailVenteCreate, DetailVenteUpdate, DetailVenteResponse
)
from .chantiers import (
    ChantierCreate, ChantierUpdate, ChantierResponse,
    TacheCreate, TacheUpdate, TacheResponse,
    EquipementCreate, EquipementUpdate, EquipementResponse,
    MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse
)
from .rh import (
    PosteCreate, PosteUpdate, PosteResponse,
    EmployeCreate, EmployeUpdate, EmployeResponse,
    CongesCreate, CongesUpdate, CongesResponse,
    PaieCreate, PaieUpdate, PaieResponse,
    FormationCreate, FormationUpdate, FormationResponse,
    EvaluationCreate, EvaluationUpdate, EvaluationResponse
)
from .flotte import (
    TypeVehiculeCreate, TypeVehiculeUpdate, TypeVehiculeResponse,
    ConducteurCreate, ConducteurUpdate, ConducteurResponse,
    VehiculeCreate, VehiculeUpdate, VehiculeResponse,
    EntretienCreate, EntretienUpdate, EntretienResponse,
    CarburantCreate, CarburantUpdate, CarburantResponse
)
from .crm import (
    ProspectCreate, ProspectUpdate, ProspectResponse,
    CommandeCreate, CommandeUpdate, CommandeResponse,
    FactureCreate, FactureUpdate, FactureResponse,
    SegmentClientCreate, SegmentClientUpdate, SegmentClientResponse,
    HistoriqueClientCreate, HistoriqueClientUpdate, HistoriqueClientResponse
)
from .comptabilite import (
    CompteComptableCreate, CompteComptableUpdate, CompteComptableResponse,
    JournalCreate, JournalUpdate, JournalResponse,
    EcritureComptableCreate, EcritureComptableUpdate, EcritureComptableResponse,
    FournisseurComptableCreate, FournisseurComptableUpdate, FournisseurComptableResponse,
    FactureFournisseurCreate, FactureFournisseurUpdate, FactureFournisseurResponse
)
from .communication import (
    CanalCommunicationCreate, CanalCommunicationUpdate, CanalCommunicationResponse,
    ModeleMessageCreate, ModeleMessageUpdate, ModeleMessageResponse,
    CampagneCreate, CampagneUpdate, CampagneResponse,
    EnvoiMessageCreate, EnvoiMessageUpdate, EnvoiMessageResponse
)
from .messagerie import (
    ConversationCreate, ConversationUpdate, ConversationResponse,
    MessageCreate, MessageUpdate, MessageResponse,
    PieceJointeCreate, PieceJointeUpdate, PieceJointeResponse
)
from .calendrier import (
    TypeEvenementCreate, TypeEvenementUpdate, TypeEvenementResponse,
    EvenementCreate, EvenementUpdate, EvenementResponse,
    RappelCreate, RappelUpdate, RappelResponse
)

__all__ = [
    # Animaux
    'TypeAnimalCreate', 'TypeAnimalUpdate', 'TypeAnimalResponse',
    'RaceCreate', 'RaceUpdate', 'RaceResponse',
    'AnimalCreate', 'AnimalUpdate', 'AnimalResponse',
    'SuiviSanteCreate', 'SuiviSanteUpdate', 'SuiviSanteResponse',
    'ReproductionCreate', 'ReproductionUpdate', 'ReproductionResponse',
    # Parcelles
    'TypeSolCreate', 'TypeSolUpdate', 'TypeSolResponse',
    'ParcelleCreate', 'ParcelleUpdate', 'ParcelleResponse',
    'CultureCreate', 'CultureUpdate', 'CultureResponse',
    'ItineraireTechniqueCreate', 'ItineraireTechniqueUpdate', 'ItineraireTechniqueResponse',
    'InterventionCreate', 'InterventionUpdate', 'InterventionResponse',
    # Stocks
    'CategorieduStockCreate', 'CategorieduStockUpdate', 'CategorieduStockResponse',
    'FournisseurCreate', 'FournisseurUpdate', 'FournisseurResponse',
    'StockCreate', 'StockUpdate', 'StockResponse',
    'MouvementStockCreate', 'MouvementStockUpdate', 'MouvementStockResponse',
    # Ventes
    'ClientCreate', 'ClientUpdate', 'ClientResponse',
    'ProduitCreate', 'ProduitUpdate', 'ProduitResponse',
    'VenteCreate', 'VenteUpdate', 'VenteResponse',
    'DetailVenteCreate', 'DetailVenteUpdate', 'DetailVenteResponse',
    # Chantiers
    'ChantierCreate', 'ChantierUpdate', 'ChantierResponse',
    'TacheCreate', 'TacheUpdate', 'TacheResponse',
    'EquipementCreate', 'EquipementUpdate', 'EquipementResponse',
    'MaintenanceCreate', 'MaintenanceUpdate', 'MaintenanceResponse',
    # RH
    'PosteCreate', 'PosteUpdate', 'PosteResponse',
    'EmployeCreate', 'EmployeUpdate', 'EmployeResponse',
    'CongesCreate', 'CongesUpdate', 'CongesResponse',
    'PaieCreate', 'PaieUpdate', 'PaieResponse',
    'FormationCreate', 'FormationUpdate', 'FormationResponse',
    'EvaluationCreate', 'EvaluationUpdate', 'EvaluationResponse',
    # Flotte
    'TypeVehiculeCreate', 'TypeVehiculeUpdate', 'TypeVehiculeResponse',
    'ConducteurCreate', 'ConducteurUpdate', 'ConducteurResponse',
    'VehiculeCreate', 'VehiculeUpdate', 'VehiculeResponse',
    'EntretienCreate', 'EntretienUpdate', 'EntretienResponse',
    'CarburantCreate', 'CarburantUpdate', 'CarburantResponse',
    # CRM
    'ProspectCreate', 'ProspectUpdate', 'ProspectResponse',
    'CommandeCreate', 'CommandeUpdate', 'CommandeResponse',
    'FactureCreate', 'FactureUpdate', 'FactureResponse',
    'SegmentClientCreate', 'SegmentClientUpdate', 'SegmentClientResponse',
    'HistoriqueClientCreate', 'HistoriqueClientUpdate', 'HistoriqueClientResponse',
    # Comptabilité
    'CompteComptableCreate', 'CompteComptableUpdate', 'CompteComptableResponse',
    'JournalCreate', 'JournalUpdate', 'JournalResponse',
    'EcritureComptableCreate', 'EcritureComptableUpdate', 'EcritureComptableResponse',
    'FournisseurComptableCreate', 'FournisseurComptableUpdate', 'FournisseurComptableResponse',
    'FactureFournisseurCreate', 'FactureFournisseurUpdate', 'FactureFournisseurResponse',
    # Communication
    'CanalCommunicationCreate', 'CanalCommunicationUpdate', 'CanalCommunicationResponse',
    'ModeleMessageCreate', 'ModeleMessageUpdate', 'ModeleMessageResponse',
    'CampagneCreate', 'CampagneUpdate', 'CampagneResponse',
    'EnvoiMessageCreate', 'EnvoiMessageUpdate', 'EnvoiMessageResponse',
    # Messagerie
    'ConversationCreate', 'ConversationUpdate', 'ConversationResponse',
    'MessageCreate', 'MessageUpdate', 'MessageResponse',
    'PieceJointeCreate', 'PieceJointeUpdate', 'PieceJointeResponse',
    # Calendrier
    'TypeEvenementCreate', 'TypeEvenementUpdate', 'TypeEvenementResponse',
    'EvenementCreate', 'EvenementUpdate', 'EvenementResponse',
    'RappelCreate', 'RappelUpdate', 'RappelResponse'
]
