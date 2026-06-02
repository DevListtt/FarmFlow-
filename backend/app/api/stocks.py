"""
API Router pour la gestion des stocks
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas.stocks import (
    CategorieduStockCreate, CategorieduStockUpdate, CategorieduStockResponse,
    FournisseurCreate, FournisseurUpdate, FournisseurResponse,
    StockCreate, StockUpdate, StockResponse,
    MouvementStockCreate, MouvementStockUpdate, MouvementStockResponse
)

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.post("/categories", response_model=CategorieduStockResponse, status_code=status.HTTP_201_CREATED)
def create_categorie(categorie: CategorieduStockCreate, db: Session = Depends(get_db)):
    db_categorie = models.CategorieduStock(**categorie.model_dump())
    db.add(db_categorie)
    db.commit()
    db.refresh(db_categorie)
    return db_categorie


@router.get("/categories", response_model=List[CategorieduStockResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.CategorieduStock).all()


@router.post("/fournisseurs", response_model=FournisseurResponse, status_code=status.HTTP_201_CREATED)
def create_fournisseur(fournisseur: FournisseurCreate, db: Session = Depends(get_db)):
    db_fournisseur = models.Fournisseur(**fournisseur.model_dump())
    db.add(db_fournisseur)
    db.commit()
    db.refresh(db_fournisseur)
    return db_fournisseur


@router.get("/fournisseurs", response_model=List[FournisseurResponse])
def get_fournisseurs(db: Session = Depends(get_db)):
    return db.query(models.Fournisseur).all()


@router.post("/", response_model=StockResponse, status_code=status.HTTP_201_CREATED)
def create_stock(stock: StockCreate, db: Session = Depends(get_db)):
    db_stock = models.Stock(**stock.model_dump())
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock


@router.get("/", response_model=List[StockResponse])
def get_stocks(
    categorie_id: Optional[int] = None,
    fournisseur_id: Optional[int] = None,
    actif: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Stock)
    if categorie_id:
        query = query.filter(models.Stock.categorie_id == categorie_id)
    if fournisseur_id:
        query = query.filter(models.Stock.fournisseur_id == fournisseur_id)
    if actif is not None:
        query = query.filter(models.Stock.actif == actif)
    return query.all()


@router.get("/{stock_id}", response_model=StockResponse)
def get_stock(stock_id: int, db: Session = Depends(get_db)):
    db_stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if not db_stock:
        raise HTTPException(status_code=404, detail="Stock non trouvé")
    return db_stock


@router.post("/{stock_id}/mouvements", response_model=MouvementStockResponse, status_code=status.HTTP_201_CREATED)
def create_mouvement(stock_id: int, mouvement: MouvementStockCreate, db: Session = Depends(get_db)):
    db_stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if not db_stock:
        raise HTTPException(status_code=404, detail="Stock non trouvé")
    db_mouvement = models.MouvementStock(**mouvement.model_dump(), stock_id=stock_id)
    db.add(db_mouvement)
    db.commit()
    db.refresh(db_mouvement)
    return db_mouvement


@router.get("/{stock_id}/mouvements", response_model=List[MouvementStockResponse])
def get_mouvements(stock_id: int, db: Session = Depends(get_db)):
    db_stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if not db_stock:
        raise HTTPException(status_code=404, detail="Stock non trouvé")
    return db.query(models.MouvementStock).filter(models.MouvementStock.stock_id == stock_id).all()
