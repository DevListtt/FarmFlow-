"""
Fonctions d'export des données
"""
import csv
import io
import json
from typing import List, Dict, Optional, Any
from datetime import datetime
from fastapi.responses import StreamingResponse, FileResponse
from ..database import SessionLocal
from .. import models


def exporter_csv(module: str, filters: Optional[Dict] = None) -> bytes:
    """
    Exporter des données en CSV
    
    Args:
        module: Module à exporter (animaux, parcelles, stocks, ventes, etc.)
        filters: Filtres à appliquer
        
    Returns:
        bytes: Données CSV
    """
    db = SessionLocal()
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        
        if module == "animaux":
            # Exporter les animaux
            query = db.query(models.Animal)
            if filters:
                if 'type_animal_id' in filters:
                    query = query.filter(models.Animal.type_animal_id == filters['type_animal_id'])
                if 'race_id' in filters:
                    query = query.filter(models.Animal.race_id == filters['race_id'])
                if 'statut' in filters:
                    query = query.filter(models.Animal.statut == filters['statut'])
            
            animaux = query.all()
            writer.writerow(["ID", "RFID", "Nom", "Type", "Race", "Sexe", "Date Naissance", "Date Entrée", "Poids", "Statut"])
            for animal in animaux:
                writer.writerow([
                    animal.id,
                    animal.rfid,
                    animal.nom or "",
                    animal.type_animal.nom if animal.type_animal else "",
                    animal.race.nom if animal.race else "",
                    animal.sexe,
                    animal.date_naissance,
                    animal.date_entree,
                    animal.poids,
                    animal.statut
                ])
        
        elif module == "parcelles":
            # Exporter les parcelles
            query = db.query(models.Parcelle)
            if filters:
                if 'type_sol_id' in filters:
                    query = query.filter(models.Parcelle.type_sol_id == filters['type_sol_id'])
                if 'statut' in filters:
                    query = query.filter(models.Parcelle.statut == filters['statut'])
            
            parcelles = query.all()
            writer.writerow(["ID", "Nom", "Code", "Surface", "Type Sol", "Statut", "Localisation", "Irrigation"])
            for parcelle in parcelles:
                writer.writerow([
                    parcelle.id,
                    parcelle.nom,
                    parcelle.code,
                    parcelle.surface,
                    parcelle.type_sol.nom if parcelle.type_sol else "",
                    parcelle.statut,
                    parcelle.localisation or "",
                    parcelle.irrigation
                ])
        
        elif module == "stocks":
            # Exporter les stocks
            query = db.query(models.Stock)
            if filters:
                if 'categorie_id' in filters:
                    query = query.filter(models.Stock.categorie_id == filters['categorie_id'])
                if 'fournisseur_id' in filters:
                    query = query.filter(models.Stock.fournisseur_id == filters['fournisseur_id'])
                if 'actif' in filters:
                    query = query.filter(models.Stock.actif == filters['actif'])
            
            stocks = query.all()
            writer.writerow(["ID", "Nom", "Code", "Catégorie", "Fournisseur", "Quantité", "Unité", "Prix Achat", "Prix Vente", "Seuil Alerte"])
            for stock in stocks:
                writer.writerow([
                    stock.id,
                    stock.nom,
                    stock.code,
                    stock.categorie.nom if stock.categorie else "",
                    stock.fournisseur.nom if stock.fournisseur else "",
                    stock.quantite,
                    stock.unite,
                    stock.prix_achat,
                    stock.prix_vente,
                    stock.seuil_alert
                ])
        
        elif module == "ventes":
            # Exporter les ventes
            query = db.query(models.Vente)
            if filters:
                if 'client_id' in filters:
                    query = query.filter(models.Vente.client_id == filters['client_id'])
                if 'statut' in filters:
                    query = query.filter(models.Vente.statut == filters['statut'])
                if 'date_debut' in filters:
                    query = query.filter(models.Vente.date_vente >= filters['date_debut'])
                if 'date_fin' in filters:
                    query = query.filter(models.Vente.date_vente <= filters['date_fin'])
            
            ventes = query.all()
            writer.writerow(["ID", "Référence", "Client", "Date", "Total HT", "Total TVA", "Total TTC", "Remises", "Statut"])
            for vente in ventes:
                writer.writerow([
                    vente.id,
                    vente.reference,
                    vente.client.nom if vente.client else "",
                    vente.date_vente,
                    vente.total_ht,
                    vente.total_tva,
                    vente.total_ttc,
                    vente.remises,
                    vente.statut
                ])
        
        elif module == "rh":
            # Exporter les employés
            query = db.query(models.Employe)
            if filters:
                if 'poste_id' in filters:
                    query = query.filter(models.Employe.poste_id == filters['poste_id'])
                if 'statut' in filters:
                    query = query.filter(models.Employe.statut == filters['statut'])
                if 'actif' in filters:
                    query = query.filter(models.Employe.actif == filters['actif'])
            
            employes = query.all()
            writer.writerow(["ID", "Matricule", "Nom", "Prénom", "Poste", "Email", "Téléphone", "Date Embauche", "Statut"])
            for employe in employes:
                writer.writerow([
                    employe.id,
                    employe.matricule,
                    employe.nom,
                    employe.prenom,
                    employe.poste.nom if employe.poste else "",
                    employe.email or "",
                    employe.telephone or "",
                    employe.date_embauche,
                    employe.statut
                ])
        
        elif module == "flotte":
            # Exporter les véhicules
            query = db.query(models.Vehicule)
            if filters:
                if 'type_vehicule_id' in filters:
                    query = query.filter(models.Vehicule.type_vehicule_id == filters['type_vehicule_id'])
                if 'conducteur_id' in filters:
                    query = query.filter(models.Vehicule.conducteur_id == filters['conducteur_id'])
                if 'statut' in filters:
                    query = query.filter(models.Vehicule.statut == filters['statut'])
            
            vehicules = query.all()
            writer.writerow(["ID", "Immatriculation", "Nom", "Type", "Marque", "Modèle", "Année", "Kilométrage", "Statut"])
            for vehicule in vehicules:
                writer.writerow([
                    vehicule.id,
                    vehicule.immatriculation,
                    vehicule.nom or "",
                    vehicule.type_vehicule.nom if vehicule.type_vehicule else "",
                    vehicule.marque or "",
                    vehicule.modele or "",
                    vehicule.annee,
                    vehicule.kilométrage,
                    vehicule.statut
                ])
        
        else:
            raise ValueError(f"Module {module} non supporté pour l'export CSV")
        
        output.seek(0)
        return output.getvalue().encode('utf-8')
    finally:
        db.close()


def exporter_csv_stream(module: str, filters: Optional[Dict] = None) -> StreamingResponse:
    """
    Exporter des données en CSV en tant que StreamingResponse
    
    Args:
        module: Module à exporter
        filters: Filtres à appliquer
        
    Returns:
        StreamingResponse: Réponse HTTP avec le CSV
    """
    csv_data = exporter_csv(module, filters)
    filename = f"{module}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        io.BytesIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def exporter_json(module: str, filters: Optional[Dict] = None) -> bytes:
    """
    Exporter des données en JSON
    
    Args:
        module: Module à exporter
        filters: Filtres à appliquer
        
    Returns:
        bytes: Données JSON
    """
    db = SessionLocal()
    try:
        data = []
        
        if module == "animaux":
            query = db.query(models.Animal)
            if filters:
                if 'type_animal_id' in filters:
                    query = query.filter(models.Animal.type_animal_id == filters['type_animal_id'])
                if 'race_id' in filters:
                    query = query.filter(models.Animal.race_id == filters['race_id'])
            
            animaux = query.all()
            for animal in animaux:
                data.append({
                    "id": animal.id,
                    "rfid": animal.rfid,
                    "nom": animal.nom,
                    "type": animal.type_animal.nom if animal.type_animal else None,
                    "race": animal.race.nom if animal.race else None,
                    "sexe": animal.sexe,
                    "date_naissance": str(animal.date_naissance) if animal.date_naissance else None,
                    "poids": animal.poids,
                    "statut": animal.statut
                })
        
        elif module == "parcelles":
            query = db.query(models.Parcelle)
            if filters:
                if 'type_sol_id' in filters:
                    query = query.filter(models.Parcelle.type_sol_id == filters['type_sol_id'])
            
            parcelles = query.all()
            for parcelle in parcelles:
                data.append({
                    "id": parcelle.id,
                    "nom": parcelle.nom,
                    "code": parcelle.code,
                    "surface": parcelle.surface,
                    "type_sol": parcelle.type_sol.nom if parcelle.type_sol else None,
                    "statut": parcelle.statut,
                    "localisation": parcelle.localisation
                })
        
        else:
            raise ValueError(f"Module {module} non supporté pour l'export JSON")
        
        return json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8')
    finally:
        db.close()


def exporter_json_stream(module: str, filters: Optional[Dict] = None) -> StreamingResponse:
    """
    Exporter des données en JSON en tant que StreamingResponse
    
    Args:
        module: Module à exporter
        filters: Filtres à appliquer
        
    Returns:
        StreamingResponse: Réponse HTTP avec le JSON
    """
    json_data = exporter_json(module, filters)
    filename = f"{module}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    return StreamingResponse(
        io.BytesIO(json_data),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def exporter_pdf(module: str, filters: Optional[Dict] = None) -> bytes:
    """
    Exporter des données en PDF (simplifié)
    
    Args:
        module: Module à exporter
        filters: Filtres à appliquer
        
    Returns:
        bytes: Données PDF
    """
    # Pour l'instant, on génère un PDF simple avec les données CSV
    csv_data = exporter_csv(module, filters).decode('utf-8')
    
    # Ici on utiliserait reportlab pour générer un vrai PDF
    # Pour l'instant, on retourne un message
    return f"PDF export pour {module} en cours de développement".encode('utf-8')


def exporter_pdf_stream(module: str, filters: Optional[Dict] = None) -> StreamingResponse:
    """
    Exporter des données en PDF en tant que StreamingResponse
    
    Args:
        module: Module à exporter
        filters: Filtres à appliquer
        
    Returns:
        StreamingResponse: Réponse HTTP avec le PDF
    """
    pdf_data = exporter_pdf(module, filters)
    filename = f"{module}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_data),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
