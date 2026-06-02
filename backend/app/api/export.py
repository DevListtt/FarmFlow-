"""
API Router pour l'export des données
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
import csv
import io
from datetime import datetime

# Importation conditionnelle de pdfkit
try:
    import pdfkit
    PDFKIT_AVAILABLE = True
except ImportError:
    PDFKIT_AVAILABLE = False

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/animaux/csv")
def export_animaux_csv(db: Session = Depends(get_db)):
    """Exporter les animaux en CSV"""
    animaux = db.query(models.Animal).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Écrire l'en-tête
    writer.writerow(["ID", "RFID", "Nom", "Type", "Race", "Sexe", "Date Naissance", "Poids", "Statut"])
    
    # Écrire les données
    for animal in animaux:
        writer.writerow([
            animal.id,
            animal.rfid,
            animal.nom or "",
            animal.type_animal.nom if animal.type_animal else "",
            animal.race.nom if animal.race else "",
            animal.sexe,
            animal.date_naissance,
            animal.poids,
            animal.statut
        ])
    
    output.seek(0)
    return FileResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type='text/csv',
        filename=f'animaux_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )


@router.get("/parcelles/csv")
def export_parcelles_csv(db: Session = Depends(get_db)):
    """Exporter les parcelles en CSV"""
    parcelles = db.query(models.Parcelle).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Écrire l'en-tête
    writer.writerow(["ID", "Nom", "Code", "Surface", "Type Sol", "Statut", "Localisation"])
    
    # Écrire les données
    for parcelle in parcelles:
        writer.writerow([
            parcelle.id,
            parcelle.nom,
            parcelle.code,
            parcelle.surface,
            parcelle.type_sol.nom if parcelle.type_sol else "",
            parcelle.statut,
            parcelle.localisation or ""
        ])
    
    output.seek(0)
    return FileResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type='text/csv',
        filename=f'parcelles_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )


@router.get("/stocks/csv")
def export_stocks_csv(db: Session = Depends(get_db)):
    """Exporter les stocks en CSV"""
    stocks = db.query(models.Stock).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Écrire l'en-tête
    writer.writerow(["ID", "Nom", "Code", "Catégorie", "Quantité", "Unité", "Prix Achat", "Prix Vente"])
    
    # Écrire les données
    for stock in stocks:
        writer.writerow([
            stock.id,
            stock.nom,
            stock.code,
            stock.categorie.nom if stock.categorie else "",
            stock.quantite,
            stock.unite,
            stock.prix_achat,
            stock.prix_vente
        ])
    
    output.seek(0)
    return FileResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type='text/csv',
        filename=f'stocks_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )


@router.get("/ventes/csv")
def export_ventes_csv(db: Session = Depends(get_db)):
    """Exporter les ventes en CSV"""
    ventes = db.query(models.Vente).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Écrire l'en-tête
    writer.writerow(["ID", "Référence", "Client", "Date", "Total HT", "Total TTC", "Statut"])
    
    # Écrire les données
    for vente in ventes:
        writer.writerow([
            vente.id,
            vente.reference,
            vente.client.nom if vente.client else "",
            vente.date_vente,
            vente.total_ht,
            vente.total_ttc,
            vente.statut
        ])
    
    output.seek(0)
    return FileResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type='text/csv',
        filename=f'ventes_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )
