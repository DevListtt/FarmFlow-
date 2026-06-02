"""
Calcul de l'Indice de Fréquence de Traitement (IFT)
"""
from typing import List, Dict, Optional
from datetime import date
from ..database import SessionLocal
from .. import models


def calculer_ift(parcelle_id: int, annee: int) -> float:
    """
    Calculer l'IFT pour une parcelle sur une année
    
    L'IFT est calculé comme suit:
    IFT = (Nombre total de doses homologuées appliquées) / (Surface traitée en hectares)
    
    Args:
        parcelle_id: ID de la parcelle
        annee: Année de calcul
        
    Returns:
        float: Valeur de l'IFT
    """
    db = SessionLocal()
    try:
        # Récupérer les interventions de la parcelle pour l'année
        interventions = db.query(models.Intervention).filter(
            models.Intervention.parcelle_id == parcelle_id,
            models.Intervention.date >= date(annee, 1, 1),
            models.Intervention.date <= date(annee, 12, 31)
        ).all()
        
        # Calculer le total des doses
        total_doses = 0.0
        surface = 0.0
        
        # Récupérer la surface de la parcelle
        parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
        if parcelle:
            surface = parcelle.surface
        
        # Calculer le total des doses
        for intervention in interventions:
            if intervention.dose and intervention.type_intervention in ["Traitement", "Fertilisation"]:
                total_doses += intervention.dose
        
        # Calculer l'IFT
        if surface > 0:
            ift = total_doses / surface
        else:
            ift = 0.0
        
        return ift
    finally:
        db.close()


def calculer_ift_par_culture(culture_id: int) -> float:
    """
    Calculer l'IFT pour une culture spécifique
    
    Args:
        culture_id: ID de la culture
        
    Returns:
        float: Valeur de l'IFT
    """
    db = SessionLocal()
    try:
        # Récupérer les interventions de la culture
        interventions = db.query(models.Intervention).filter(
            models.Intervention.culture_id == culture_id
        ).all()
        
        # Calculer le total des doses
        total_doses = 0.0
        surface = 0.0
        
        # Récupérer la surface de la parcelle associée
        culture = db.query(models.Culture).filter(models.Culture.id == culture_id).first()
        if culture and culture.parcelle:
            surface = culture.parcelle.surface
        
        # Calculer le total des doses
        for intervention in interventions:
            if intervention.dose and intervention.type_intervention in ["Traitement", "Fertilisation"]:
                total_doses += intervention.dose
        
        # Calculer l'IFT
        if surface > 0:
            ift = total_doses / surface
        else:
            ift = 0.0
        
        return ift
    finally:
        db.close()


def get_ift_statistiques(annee: int) -> Dict:
    """
    Obtenir les statistiques IFT pour toutes les parcelles
    
    Args:
        annee: Année de calcul
        
    Returns:
        Dict: Statistiques IFT
    """
    db = SessionLocal()
    try:
        parcelles = db.query(models.Parcelle).all()
        
        statistiques = {
            "annee": annee,
            "parcelles": [],
            "total_ift": 0.0,
            "moyenne_ift": 0.0,
            "max_ift": 0.0,
            "min_ift": float('inf')
        }
        
        total_ift = 0.0
        count = 0
        
        for parcelle in parcelles:
            ift = calculer_ift(parcelle.id, annee)
            statistiques["parcelles"].append({
                "id": parcelle.id,
                "nom": parcelle.nom,
                "ift": ift
            })
            total_ift += ift
            count += 1
            if ift > statistiques["max_ift"]:
                statistiques["max_ift"] = ift
            if ift < statistiques["min_ift"]:
                statistiques["min_ift"] = ift
        
        if count > 0:
            statistiques["total_ift"] = total_ift
            statistiques["moyenne_ift"] = total_ift / count
        
        if statistiques["min_ift"] == float('inf'):
            statistiques["min_ift"] = 0.0
        
        return statistiques
    finally:
        db.close()
