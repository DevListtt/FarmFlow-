"""
API Router pour la gestion des ventes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas.ventes import (
    ClientCreate, ClientUpdate, ClientResponse,
    ProduitCreate, ProduitUpdate, ProduitResponse,
    VenteCreate, VenteUpdate, VenteResponse,
    DetailVenteCreate, DetailVenteUpdate, DetailVenteResponse
)

router = APIRouter(prefix="/ventes", tags=["ventes"])


@router.post("/clients", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    db_client = models.Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


@router.get("/clients", response_model=List[ClientResponse])
def get_clients(db: Session = Depends(get_db)):
    return db.query(models.Client).all()


@router.post("/produits", response_model=ProduitResponse, status_code=status.HTTP_201_CREATED)
def create_produit(produit: ProduitCreate, db: Session = Depends(get_db)):
    db_produit = models.Produit(**produit.model_dump())
    db.add(db_produit)
    db.commit()
    db.refresh(db_produit)
    return db_produit


@router.get("/produits", response_model=List[ProduitResponse])
def get_produits(db: Session = Depends(get_db)):
    return db.query(models.Produit).all()


@router.post("/", response_model=VenteResponse, status_code=status.HTTP_201_CREATED)
def create_vente(vente: VenteCreate, db: Session = Depends(get_db)):
    db_vente = models.Vente(**vente.model_dump())
    db.add(db_vente)
    db.commit()
    db.refresh(db_vente)
    return db_vente


@router.get("/", response_model=List[VenteResponse])
def get_ventes(
    client_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Vente)
    if client_id:
        query = query.filter(models.Vente.client_id == client_id)
    if statut:
        query = query.filter(models.Vente.statut == statut)
    return query.all()


@router.get("/{vente_id}", response_model=VenteResponse)
def get_vente(vente_id: int, db: Session = Depends(get_db)):
    db_vente = db.query(models.Vente).filter(models.Vente.id == vente_id).first()
    if not db_vente:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    return db_vente


@router.post("/{vente_id}/details", response_model=DetailVenteResponse, status_code=status.HTTP_201_CREATED)
def create_detail_vente(vente_id: int, detail: DetailVenteCreate, db: Session = Depends(get_db)):
    db_vente = db.query(models.Vente).filter(models.Vente.id == vente_id).first()
    if not db_vente:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    db_detail = models.DetailVente(**detail.model_dump(), vente_id=vente_id)
    db.add(db_detail)
    db.commit()
    db.refresh(db_detail)
    return db_detail


@router.get("/{vente_id}/details", response_model=List[DetailVenteResponse])
def get_details_vente(vente_id: int, db: Session = Depends(get_db)):
    db_vente = db.query(models.Vente).filter(models.Vente.id == vente_id).first()
    if not db_vente:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    return db.query(models.DetailVente).filter(models.DetailVente.vente_id == vente_id).all()
