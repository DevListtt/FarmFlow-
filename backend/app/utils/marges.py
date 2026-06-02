"""
Calcul des marges et simulateur de rentabilité
"""
from typing import Dict, List, Optional
from ..database import SessionLocal
from .. import models


def calculer_marge(produit_id: int) -> Dict:
    """
    Calculer la marge pour un produit
    
    Args:
        produit_id: ID du produit
        
    Returns:
        Dict: Informations sur la marge
    """
    db = SessionLocal()
    try:
        produit = db.query(models.Produit).filter(models.Produit.id == produit_id).first()
        
        if not produit:
            return {"erreur": "Produit non trouvé"}
        
        # Calculer la marge
        if produit.prix_vente and produit.cout_production:
            marge_absolue = produit.prix_vente - produit.cout_production
            if produit.cout_production > 0:
                marge_pourcentage = (marge_absolue / produit.cout_production) * 100
            else:
                marge_pourcentage = 0.0
        else:
            marge_absolue = 0.0
            marge_pourcentage = 0.0
        
        return {
            "produit_id": produit.id,
            "nom": produit.nom,
            "prix_vente": produit.prix_vente or 0.0,
            "cout_production": produit.cout_production or 0.0,
            "marge_absolue": marge_absolue,
            "marge_pourcentage": marge_pourcentage,
            "marge": produit.marge or 0.0
        }
    finally:
        db.close()


def calculer_marge_vente(vente_id: int) -> Dict:
    """
    Calculer la marge pour une vente
    
    Args:
        vente_id: ID de la vente
        
    Returns:
        Dict: Informations sur la marge de la vente
    """
    db = SessionLocal()
    try:
        vente = db.query(models.Vente).filter(models.Vente.id == vente_id).first()
        
        if not vente:
            return {"erreur": "Vente non trouvée"}
        
        # Calculer le coût total et la marge
        details = db.query(models.DetailVente).filter(models.DetailVente.vente_id == vente_id).all()
        
        total_cout = 0.0
        total_marge = 0.0
        
        for detail in details:
            if detail.produit:
                cout_unitaire = detail.produit.cout_production or 0.0
                total_cout += cout_unitaire * detail.quantite
                marge_unitaire = detail.prix_unitaire - cout_unitaire
                total_marge += marge_unitaire * detail.quantite
        
        marge_pourcentage = 0.0
        if vente.total_ht > 0:
            marge_pourcentage = (total_marge / vente.total_ht) * 100
        
        return {
            "vente_id": vente.id,
            "reference": vente.reference,
            "total_ht": vente.total_ht or 0.0,
            "total_cout": total_cout,
            "total_marge": total_marge,
            "marge_pourcentage": marge_pourcentage
        }
    finally:
        db.close()


def simuler_marge(prix_vente: float, cout_production: float, quantite: float = 1.0) -> Dict:
    """
    Simuler la marge pour un produit
    
    Args:
        prix_vente: Prix de vente unitaire
        cout_production: Coût de production unitaire
        quantite: Quantité vendue
        
    Returns:
        Dict: Résultat de la simulation
    """
    marge_absolue = prix_vente - cout_production
    marge_totale = marge_absolue * quantite
    
    if cout_production > 0:
        marge_pourcentage = (marge_absolue / cout_production) * 100
    else:
        marge_pourcentage = 0.0
    
    return {
        "prix_vente": prix_vente,
        "cout_production": cout_production,
        "quantite": quantite,
        "marge_absolue": marge_absolue,
        "marge_totale": marge_totale,
        "marge_pourcentage": marge_pourcentage,
        "seuil_rentabilite": cout_production  # Seuil de rentabilité
    }


def get_marges_produits() -> List[Dict]:
    """
    Obtenir les marges pour tous les produits
    
    Returns:
        List[Dict]: Liste des marges par produit
    """
    db = SessionLocal()
    try:
        produits = db.query(models.Produit).all()
        
        marges = []
        for produit in produits:
            marge = calculer_marge(produit.id)
            if "erreur" not in marge:
                marges.append(marge)
        
        # Trier par marge décroissante
        marges.sort(key=lambda x: x["marge_pourcentage"], reverse=True)
        
        return marges
    finally:
        db.close()


def get_statistiques_marges() -> Dict:
    """
    Obtenir les statistiques des marges
    
    Returns:
        Dict: Statistiques des marges
    """
    marges = get_marges_produits()
    
    if not marges:
        return {
            "nombre_produits": 0,
            "marge_moyenne": 0.0,
            "marge_totale": 0.0,
            "meilleur_produit": None,
            "pire_produit": None
        }
    
    total_marge = sum(m["marge_absolue"] for m in marges)
    moyenne_marge = sum(m["marge_pourcentage"] for m in marges) / len(marges)
    
    meilleur = max(marges, key=lambda x: x["marge_pourcentage"])
    pire = min(marges, key=lambda x: x["marge_pourcentage"])
    
    return {
        "nombre_produits": len(marges),
        "marge_moyenne": moyenne_marge,
        "marge_totale": total_marge,
        "meilleur_produit": meilleur,
        "pire_produit": pire
    }
