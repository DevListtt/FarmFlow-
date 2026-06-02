"""
Point d'entrée de l'API FarmFlow 2.0
ERP Agricole Open Source Complet
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from .database import engine, Base, init_db
from .core.config import settings
from .api import (
    animaux, parcelles, stocks, ventes, chantiers,
    rh, flotte, crm, comptabilite, communication, ia, export, zapier, calendrier
)

# Initialiser la base de données (optionnel, peut être fait via Alembic)
try:
    init_db()
except Exception as e:
    print(f"Impossible de se connecter à la base de données: {e}")
    print("La base de données sera initialisée lors de la première requête ou via Alembic")


def custom_openapi():
    """Configuration personnalisée de l'OpenAPI"""
    if settings.DEBUG:
        return get_openapi(
            title="FarmFlow API",
            version="2.0.0",
            description="""
            # ERP Agricole Open Source - FarmFlow 2.0
            
            ## Description
            FarmFlow est un ERP agricole complet avec gestion des animaux, cultures, stocks, 
            ventes, RH, flotte, CRM, communication, IA, calendrier et export de données.
            
            ## Modules disponibles
            - **Animaux** : Gestion de l'élevage (bovins, caprins, ovins) avec RFID
            - **Parcelles** : Gestion des cultures, itinéraires techniques, calcul IFT
            - **Stocks** : Gestion des semences, engrais, phytos, produits finis
            - **Ventes** : Gestion des ventes, devis, factures
            - **Chantiers** : Gestion des chantiers et équipements
            - **RH** : Gestion des employés, congés, paie
            - **Flotte** : Gestion des véhicules, entretiens, carburant
            - **CRM** : Gestion des clients, prospects, commandes
            - **Comptabilité** : Gestion comptable complète
            - **Communication** : Campagnes mail, SMS, WhatsApp
            - **IA** : Analyse prédictive, chatbot, OCR
            - **Calendrier** : Événements, rappels, synchronisation
            - **Export** : Export des données (CSV, PDF)
            - **Zapier** : Intégration avec Zapier
            
            ## Technologies
            - Backend: FastAPI (Python 3.9+)
            - Base de données: PostgreSQL + InfluxDB
            - Frontend: Next.js (React) + Tailwind CSS
            """,
            routes=app.routes,
        )
    return get_openapi(title="FarmFlow API", version="2.0.0", routes=app.routes)


# Créer l'application FastAPI
app = FastAPI(
    title="FarmFlow API",
    version="2.0.0",
    description="ERP agricole open source complet",
    debug=settings.DEBUG
)

# Configuration OpenAPI
app.openapi = custom_openapi

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Inclure tous les routeurs
app.include_router(animaux.router, prefix="/animaux", tags=["animaux"])
app.include_router(parcelles.router, prefix="/parcelles", tags=["parcelles"])
app.include_router(stocks.router, prefix="/stocks", tags=["stocks"])
app.include_router(ventes.router, prefix="/ventes", tags=["ventes"])
app.include_router(chantiers.router, prefix="/chantiers", tags=["chantiers"])
app.include_router(rh.router, prefix="/rh", tags=["rh"])
app.include_router(flotte.router, prefix="/flotte", tags=["flotte"])
app.include_router(crm.router, prefix="/crm", tags=["crm"])
app.include_router(comptabilite.router, prefix="/comptabilite", tags=["comptabilite"])
app.include_router(communication.router, prefix="/communication", tags=["communication"])
app.include_router(ia.router, prefix="/ia", tags=["ia"])
app.include_router(export.router, prefix="/export", tags=["export"])
app.include_router(zapier.router, prefix="/zapier", tags=["zapier"])
app.include_router(calendrier.router, prefix="/calendrier", tags=["calendrier"])


@app.get("/", tags=["root"])
def read_root():
    """Endpoint racine"""
    return {
        "message": "Bienvenue sur FarmFlow API 2.0",
        "documentation": "/docs",
        "redoc": "/redoc",
        "modules": [
            "animaux", "parcelles", "stocks", "ventes", "chantiers",
            "rh", "flotte", "crm", "comptabilite", "communication", 
            "ia", "export", "zapier", "calendrier"
        ],
        "version": "2.0.0"
    }


@app.get("/health", tags=["health"])
def health_check():
    """Vérification de l'état de santé de l'API"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT
    }
