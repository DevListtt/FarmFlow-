"""
API locale legere pour tester FarmFlow sans PostgreSQL ni Docker.

Elle expose uniquement le socle pilotage, suffisant pour tester le cockpit
frontend, le catalogue d'applications, les workflows, les roles et les
simulateurs de la branche actuelle.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import noyau_agri, pilotage_transactionnel, parcellaire, parcelles, pilotage


app = FastAPI(
    title="FarmFlow Local Pilotage API",
    version="2.0.0",
    description="API locale legere pour tester le socle ERP agricole FarmFlow.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(noyau_agri.router)
app.include_router(pilotage_transactionnel.router)
app.include_router(parcellaire.router)
app.include_router(parcelles.router)
app.include_router(pilotage.router)


@app.get("/health", tags=["health"])
def health_check():
    return {
        "status": "healthy",
        "mode": "local-pilotage",
        "version": "2.0.0",
    }
