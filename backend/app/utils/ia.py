"""
Fonctions d'Intelligence Artificielle
"""
from typing import Dict, List, Optional, Any, Tuple
import numpy as np
from PIL import Image
import cv2
import io
import base64
from datetime import datetime, timedelta
from ..database import SessionLocal
from .. import models


class ChatBot:
    """Chatbot simple pour FarmFlow"""
    
    def __init__(self):
        self.conversations = {}
        self.knowledge_base = self._load_knowledge_base()
    
    def _load_knowledge_base(self) -> Dict:
        """Charger la base de connaissances"""
        return {
            "salutations": ["Bonjour", "Salut", "Hello", "Bonjour!", "Salut!", "Hello!"],
            "au_revoir": ["Au revoir", "À bientôt", "Bonne journée", "Bye"],
            "merci": ["De rien", "Je vous en prie", "Avec plaisir", "Pas de problème"],
            "farmflow": [
                "FarmFlow est un ERP agricole complet pour gérer votre exploitation.",
                "Je peux vous aider avec la gestion des animaux, cultures, stocks, ventes, etc."
            ],
            "animaux": [
                "Je peux vous aider à gérer vos animaux d'élevage (bovins, caprins, ovins).",
                "Vous pouvez ajouter, modifier, supprimer des animaux et suivre leur santé."
            ],
            "parcelles": [
                "Je peux vous aider à gérer vos parcelles et cultures.",
                "Vous pouvez suivre les interventions, calculer l'IFT, etc."
            ],
            "stocks": [
                "Je peux vous aider à gérer vos stocks de semences, engrais, phytos, etc.",
                "Vous pouvez suivre les mouvements de stock et recevoir des alertes."
            ],
            "ventes": [
                "Je peux vous aider à gérer vos ventes, devis et factures.",
                "Vous pouvez suivre vos clients et calculer vos marges."
            ],
            "default": [
                "Je ne comprends pas votre question. Pouvez-vous reformuler?",
                "Désolé, je n'ai pas la réponse à cette question.",
                "Je suis encore en apprentissage. Essayez une autre question."
            ]
        }
    
    def respond(self, message: str, user_id: Optional[str] = None) -> str:
        """Répondre à un message"""
        message_lower = message.lower()
        
        # Vérifier dans la base de connaissances
        for intent, responses in self.knowledge_base.items():
            if intent in message_lower:
                return np.random.choice(responses)
        
        # Réponse par défaut
        return np.random.choice(self.knowledge_base["default"])


class PredictiveAnalytics:
    """Analyse prédictive pour FarmFlow"""
    
    @staticmethod
    def predict_yield(parcelle_id: int, annee: int) -> Dict:
        """
        Prédire le rendement pour une parcelle
        
        Args:
            parcelle_id: ID de la parcelle
            annee: Année de prédiction
            
        Returns:
            Dict: Prédiction de rendement
        """
        db = SessionLocal()
        try:
            # Récupérer les données historiques
            cultures = db.query(models.Culture).filter(
                models.Culture.parcelle_id == parcelle_id
            ).all()
            
            if not cultures:
                return {
                    "parcelle_id": parcelle_id,
                    "annee": annee,
                    "prediction": 0.0,
                    "confiance": 0.0,
                    "message": "Aucune donnée historique disponible"
                }
            
            # Calculer la moyenne des rendements historiques
            rendements = [c.rendement_reel for c in cultures if c.rendement_reel]
            
            if not rendements:
                # Utiliser le rendement attendu
                rendements = [c.rendement_attendu for c in cultures if c.rendement_attendu]
            
            if rendements:
                moyenne = sum(rendements) / len(rendements)
                # Prédiction simple (moyenne)
                prediction = moyenne
                confiance = min(0.9, 0.5 + (len(rendements) * 0.1))
            else:
                prediction = 0.0
                confiance = 0.0
            
            return {
                "parcelle_id": parcelle_id,
                "annee": annee,
                "prediction": round(prediction, 2),
                "confiance": round(confiance, 2),
                "historique": rendements
            }
        finally:
            db.close()
    
    @staticmethod
    def predict_stock_alert(stock_id: int) -> Dict:
        """
        Prédire les alertes de stock
        
        Args:
            stock_id: ID du stock
            
        Returns:
            Dict: Prédiction d'alerte
        """
        db = SessionLocal()
        try:
            stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
            
            if not stock:
                return {"erreur": "Stock non trouvé"}
            
            # Récupérer les mouvements récents
            mouvements = db.query(models.MouvementStock).filter(
                models.MouvementStock.stock_id == stock_id
            ).order_by(models.MouvementStock.date_mouvement.desc()).limit(10).all()
            
            # Calculer la consommation moyenne
            if mouvements:
                total_sorties = sum(
                    m.quantite for m in mouvements 
                    if m.type_mouvement == "Sortie"
                )
                jours = (mouvements[0].date_mouvement - mouvements[-1].date_mouvement).days
                if jours > 0:
                    consommation_jour = total_sorties / jours
                else:
                    consommation_jour = 0.0
            else:
                consommation_jour = 0.0
            
            # Prédire quand le seuil sera atteint
            if consommation_jour > 0 and stock.quantite > 0:
                jours_restants = (stock.quantite - stock.seuil_alert) / consommation_jour
            else:
                jours_restants = float('inf')
            
            return {
                "stock_id": stock_id,
                "nom": stock.nom,
                "quantite_actuelle": stock.quantite,
                "seuil_alert": stock.seuil_alert,
                "consommation_jour": round(consommation_jour, 2),
                "jours_restants": round(jours_restants, 1) if jours_restants != float('inf') else None,
                "alerte": jours_restants <= 7 if jours_restants != float('inf') else False
            }
        finally:
            db.close()


class OCR:
    """OCR - Reconnaissance Optique de Caractères"""
    
    @staticmethod
    def extract_text_from_image(image_data: bytes) -> str:
        """
        Extraire du texte d'une image
        
        Args:
            image_data: Données binaires de l'image
            
        Returns:
            str: Texte extrait
        """
        try:
            # Lire l'image
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Convertir en niveaux de gris
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Appliquer un seuil
            _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)
            
            # Ici on utiliserait pytesseract pour extraire le texte
            # Pour l'instant, on retourne un message
            return "OCR en cours de développement. Texte extrait: [exemple]"
        except Exception as e:
            return f"Erreur OCR: {str(e)}"


class ComputerVision:
    """Vision par ordinateur"""
    
    @staticmethod
    def detect_objects(image_data: bytes) -> List[Dict]:
        """
        Détecter des objets dans une image
        
        Args:
            image_data: Données binaires de l'image
            
        Returns:
            List[Dict]: Liste des objets détectés
        """
        try:
            # Lire l'image
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Ici on utiliserait un modèle de détection d'objets
            # Pour l'instant, on retourne un exemple
            return [
                {"class": "animal", "confidence": 0.95, "box": [100, 100, 200, 200]},
                {"class": "parcelle", "confidence": 0.85, "box": [300, 300, 400, 400]}
            ]
        except Exception as e:
            return [{"error": str(e)}]
    
    @staticmethod
    def analyze_animal_health(image_data: bytes) -> Dict:
        """
        Analyser la santé d'un animal à partir d'une image
        
        Args:
            image_data: Données binaires de l'image
            
        Returns:
            Dict: Analyse de santé
        """
        try:
            # Lire l'image
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Ici on utiliserait un modèle d'analyse d'image
            # Pour l'instant, on retourne un exemple
            return {
                "health_score": 0.85,
                "status": "good",
                "issues": [],
                "recommendations": ["L'animal semble en bonne santé"]
            }
        except Exception as e:
            return {"error": str(e)}


# Instances globales
chatbot = ChatBot()
predictive = PredictiveAnalytics()
ocr = OCR()
vision = ComputerVision()
