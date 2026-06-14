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
    animaux, parcellaire, parcelles, stocks, ventes, chantiers,
    rh, flotte, crm, comptabilite, commandes, communication, ia, export, zapier, calendrier,
    noyau_agri, pilotage_transactionnel, pilotage, backoffice
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
app.include_router(animaux.router)
app.include_router(noyau_agri.router)
app.include_router(backoffice.router)
app.include_router(parcellaire.router)
app.include_router(parcelles.router)
app.include_router(stocks.router)
app.include_router(ventes.router)
app.include_router(chantiers.router)
app.include_router(rh.router)
app.include_router(flotte.router)
app.include_router(crm.router)
app.include_router(comptabilite.router)
app.include_router(commandes.router)
app.include_router(communication.router)
app.include_router(ia.router)
app.include_router(export.router)
app.include_router(zapier.router)
app.include_router(calendrier.router)
app.include_router(pilotage_transactionnel.router)
app.include_router(pilotage.router)


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
            "ia", "export", "zapier", "calendrier", "commandes", "noyau", "pilotage"
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
