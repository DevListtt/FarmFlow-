"""
API Router pour l'intégration avec Zapier
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from ..database import get_db
from ..core.config import settings
import hmac
import hashlib
import json

router = APIRouter(prefix="/zapier", tags=["zapier"])


@router.post("/webhook")
async def zapier_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook pour recevoir des données de Zapier"""
    try:
        data = await request.json()
        
        # Vérifier la signature si configurée
        if settings.ZAPIER_WEBHOOK_URL:
            # Ici on vérifierait la signature HMAC
            pass
        
        # Traiter les données selon le type
        event_type = data.get("event", "unknown")
        
        return {
            "status": "success",
            "event": event_type,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/trigger")
def trigger_zapier(event: str, data: Dict[str, Any]):
    """Déclencher un Zapier webhook"""
    try:
        # Ici on enverrait les données à Zapier
        return {
            "status": "success",
            "event": event,
            "message": "Zapier trigger en cours de développement"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
