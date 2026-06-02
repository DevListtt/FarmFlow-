"""
API Router pour la gestion des Ressources Humaines
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas.rh import (
    PosteCreate, PosteUpdate, PosteResponse,
    EmployeCreate, EmployeUpdate, EmployeResponse,
    CongesCreate, CongesUpdate, CongesResponse,
    PaieCreate, PaieUpdate, PaieResponse,
    FormationCreate, FormationUpdate, FormationResponse,
    EvaluationCreate, EvaluationUpdate, EvaluationResponse
)

router = APIRouter(prefix="/rh", tags=["rh"])


@router.post("/postes", response_model=PosteResponse, status_code=status.HTTP_201_CREATED)
def create_poste(poste: PosteCreate, db: Session = Depends(get_db)):
    db_poste = models.Poste(**poste.model_dump())
    db.add(db_poste)
    db.commit()
    db.refresh(db_poste)
    return db_poste


@router.get("/postes", response_model=List[PosteResponse])
def get_postes(db: Session = Depends(get_db)):
    return db.query(models.Poste).all()


@router.post("/employes", response_model=EmployeResponse, status_code=status.HTTP_201_CREATED)
def create_employe(employe: EmployeCreate, db: Session = Depends(get_db)):
    db_employe = models.Employe(**employe.model_dump())
    db.add(db_employe)
    db.commit()
    db.refresh(db_employe)
    return db_employe


@router.get("/employes", response_model=List[EmployeResponse])
def get_employes(
    poste_id: Optional[int] = None,
    statut: Optional[str] = None,
    actif: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Employe)
    if poste_id:
        query = query.filter(models.Employe.poste_id == poste_id)
    if statut:
        query = query.filter(models.Employe.statut == statut)
    if actif is not None:
        query = query.filter(models.Employe.actif == actif)
    return query.all()


@router.get("/employes/{employe_id}", response_model=EmployeResponse)
def get_employe(employe_id: int, db: Session = Depends(get_db)):
    db_employe = db.query(models.Employe).filter(models.Employe.id == employe_id).first()
    if not db_employe:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    return db_employe


@router.post("/{employe_id}/conges", response_model=CongesResponse, status_code=status.HTTP_201_CREATED)
def create_conges(employe_id: int, conges: CongesCreate, db: Session = Depends(get_db)):
    db_employe = db.query(models.Employe).filter(models.Employe.id == employe_id).first()
    if not db_employe:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    db_conges = models.Conges(**conges.model_dump(), employe_id=employe_id)
    db.add(db_conges)
    db.commit()
    db.refresh(db_conges)
    return db_conges


@router.get("/{employe_id}/conges", response_model=List[CongesResponse])
def get_conges(employe_id: int, db: Session = Depends(get_db)):
    db_employe = db.query(models.Employe).filter(models.Employe.id == employe_id).first()
    if not db_employe:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    return db.query(models.Conges).filter(models.Conges.employe_id == employe_id).all()


@router.post("/{employe_id}/paies", response_model=PaieResponse, status_code=status.HTTP_201_CREATED)
def create_paie(employe_id: int, paie: PaieCreate, db: Session = Depends(get_db)):
    db_employe = db.query(models.Employe).filter(models.Employe.id == employe_id).first()
    if not db_employe:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    db_paie = models.Paie(**paie.model_dump(), employe_id=employe_id)
    db.add(db_paie)
    db.commit()
    db.refresh(db_paie)
    return db_paie


@router.get("/{employe_id}/paies", response_model=List[PaieResponse])
def get_paies(employe_id: int, db: Session = Depends(get_db)):
    db_employe = db.query(models.Employe).filter(models.Employe.id == employe_id).first()
    if not db_employe:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    return db.query(models.Paie).filter(models.Paie.employe_id == employe_id).all()


@router.post("/{employe_id}/formations", response_model=FormationResponse, status_code=status.HTTP_201_CREATED)
def create_formation(employe_id: int, formation: FormationCreate, db: Session = Depends(get_db)):
    db_employe = db.query(models.Employe).filter(models.Employe.id == employe_id).first()
    if not db_employe:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    db_formation = models.Formation(**formation.model_dump(), employe_id=employe_id)
    db.add(db_formation)
    db.commit()
    db.refresh(db_formation)
    return db_formation


@router.post("/{employe_id}/evaluations", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
def create_evaluation(employe_id: int, evaluation: EvaluationCreate, db: Session = Depends(get_db)):
    db_employe = db.query(models.Employe).filter(models.Employe.id == employe_id).first()
    if not db_employe:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    db_evaluation = models.Evaluation(**evaluation.model_dump(), employe_id=employe_id)
    db.add(db_evaluation)
    db.commit()
    db.refresh(db_evaluation)
    return db_evaluation
