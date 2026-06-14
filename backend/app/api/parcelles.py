"""
API Router pour la gestion des parcelles et cultures
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..schemas.parcelles import (
    TypeSolCreate, TypeSolUpdate, TypeSolResponse,
    ParcelleCreate, ParcelleUpdate, ParcelleResponse,
    CultureCreate, CultureUpdate, CultureResponse,
    ItineraireTechniqueCreate, ItineraireTechniqueUpdate, ItineraireTechniqueResponse,
    InterventionCreate, InterventionUpdate, InterventionResponse
)
from .. import models

router = APIRouter(prefix="/parcelles", tags=["parcelles"])


class RegroupementIlotRequest(BaseModel):
    nom: str = "Nouvel ilot"
    parcelle_ids: List[str]
    objectif: str = "optimisation chantier"


class PlanificationChantierRequest(BaseModel):
    parcelle_ids: List[str]
    operation: str
    date_prevue: str
    materiel: str
    responsable: str = "Chef de culture"
    priorite: str = "normale"


PARCELLAIRE_GPS: Dict[str, Any] = {
    "centre_gps": {"lat": 47.2138, "lng": -1.5684},
    "parcelles": [
        {
            "id": "P-101",
            "nom": "Les Pres Nord",
            "ilot_id": "I-01",
            "surface_ha": 12.4,
            "culture": "Ble tendre",
            "sol": "Limono-argileux",
            "statut": "en culture",
            "rendement_prevu": 72,
            "ift_prevu": 1.8,
            "marge_prevue_ha": 1180,
            "gps": [
                {"lat": 47.2164, "lng": -1.5729},
                {"lat": 47.2161, "lng": -1.5685},
                {"lat": 47.2134, "lng": -1.5678},
                {"lat": 47.2126, "lng": -1.5716},
            ],
            "itineraire": [
                {"stade": "Semis", "date": "2026-10-18", "action": "Semis 180 kg/ha", "statut": "planifie"},
                {"stade": "Tallage", "date": "2027-02-22", "action": "Azote 70 u", "statut": "a valider"},
                {"stade": "Montaison", "date": "2027-04-08", "action": "Fongicide T1 + oligo", "statut": "scenario"},
            ],
        },
        {
            "id": "P-102",
            "nom": "Les Pres Sud",
            "ilot_id": "I-01",
            "surface_ha": 8.7,
            "culture": "Orge hiver",
            "sol": "Limoneux",
            "statut": "en culture",
            "rendement_prevu": 65,
            "ift_prevu": 1.4,
            "marge_prevue_ha": 930,
            "gps": [
                {"lat": 47.2125, "lng": -1.5715},
                {"lat": 47.2132, "lng": -1.5677},
                {"lat": 47.2102, "lng": -1.5667},
                {"lat": 47.2093, "lng": -1.5704},
            ],
            "itineraire": [
                {"stade": "Desherbage", "date": "2026-11-16", "action": "Passage post-levee", "statut": "planifie"},
                {"stade": "Nutrition", "date": "2027-03-05", "action": "Azote 55 u", "statut": "scenario"},
            ],
        },
        {
            "id": "P-201",
            "nom": "Grand Champ",
            "ilot_id": "I-02",
            "surface_ha": 15.9,
            "culture": "Mais grain",
            "sol": "Argilo-calcaire",
            "statut": "a preparer",
            "rendement_prevu": 96,
            "ift_prevu": 1.2,
            "marge_prevue_ha": 1420,
            "gps": [
                {"lat": 47.2169, "lng": -1.5654},
                {"lat": 47.2157, "lng": -1.5609},
                {"lat": 47.2119, "lng": -1.5618},
                {"lat": 47.2129, "lng": -1.5661},
            ],
            "itineraire": [
                {"stade": "Preparation", "date": "2026-04-05", "action": "Faux semis + nivellement", "statut": "pret"},
                {"stade": "Semis", "date": "2026-04-22", "action": "Semis 92k grains/ha", "statut": "planifie"},
                {"stade": "Desherbage", "date": "2026-05-18", "action": "Binage + rattrapage localise", "statut": "scenario"},
            ],
        },
        {
            "id": "P-301",
            "nom": "Maraichage Ouest",
            "ilot_id": "I-03",
            "surface_ha": 3.6,
            "culture": "Legumes paniers",
            "sol": "Sable limoneux",
            "statut": "intensif",
            "rendement_prevu": 16500,
            "ift_prevu": 0.6,
            "marge_prevue_ha": 8600,
            "gps": [
                {"lat": 47.2108, "lng": -1.5657},
                {"lat": 47.2112, "lng": -1.5626},
                {"lat": 47.2088, "lng": -1.5621},
                {"lat": 47.2082, "lng": -1.5652},
            ],
            "itineraire": [
                {"stade": "Plantation", "date": "2026-03-14", "action": "Series tomates et salades", "statut": "pret"},
                {"stade": "Irrigation", "date": "2026-04-02", "action": "Controle goutte-a-goutte", "statut": "planifie"},
                {"stade": "Recolte", "date": "2026-05-10", "action": "Debut paniers hebdo", "statut": "scenario"},
            ],
        },
        {
            "id": "P-302",
            "nom": "Serres Est",
            "ilot_id": "I-03",
            "surface_ha": 1.8,
            "culture": "Plants",
            "sol": "Substrat + sable",
            "statut": "sous abri",
            "rendement_prevu": 24000,
            "ift_prevu": 0.3,
            "marge_prevue_ha": 12400,
            "gps": [
                {"lat": 47.2115, "lng": -1.5616},
                {"lat": 47.2112, "lng": -1.5593},
                {"lat": 47.2091, "lng": -1.5592},
                {"lat": 47.2089, "lng": -1.5615},
            ],
            "itineraire": [
                {"stade": "Semis", "date": "2026-02-18", "action": "Plaques plants tomate", "statut": "pret"},
                {"stade": "Suivi", "date": "2026-03-12", "action": "Controle temperature et humidite", "statut": "planifie"},
            ],
        },
    ],
    "ilots": [
        {"id": "I-01", "nom": "Ilot Pres", "parcelle_ids": ["P-101", "P-102"], "surface_ha": 21.1, "usage": "Cereales hiver", "contrainte": "Fenetre epandage courte"},
        {"id": "I-02", "nom": "Ilot Grand Champ", "parcelle_ids": ["P-201"], "surface_ha": 15.9, "usage": "Culture printemps", "contrainte": "Portance variable"},
        {"id": "I-03", "nom": "Ilot Vente directe", "parcelle_ids": ["P-301", "P-302"], "surface_ha": 5.4, "usage": "Maraichage et plants", "contrainte": "Irrigation prioritaire"},
    ],
    "planning_chantiers": [
        {"id": "CH-240", "date": "2026-03-14", "operation": "Plantation legumes", "parcelles": ["P-301", "P-302"], "materiel": "Planteuse + goutte-a-goutte", "statut": "pret"},
        {"id": "CH-251", "date": "2026-04-05", "operation": "Preparation mais", "parcelles": ["P-201"], "materiel": "Tracteur 180ch + vibroculteur", "statut": "a valider"},
        {"id": "CH-263", "date": "2026-04-08", "operation": "Fongicide cereales", "parcelles": ["P-101", "P-102"], "materiel": "Pulverisateur 24m", "statut": "scenario"},
    ],
    "registre_terrain": [
        {"id": "LOG-001", "date": "2026-03-12", "type": "observation", "parcelle": "P-301", "titre": "Humidite sol correcte", "source": "terrain", "statut": "valide"},
        {"id": "LOG-002", "date": "2026-03-14", "type": "intervention", "parcelle": "P-301", "titre": "Plantation legumes", "source": "chantier", "statut": "pret"},
        {"id": "LOG-003", "date": "2026-04-02", "type": "alerte", "parcelle": "P-302", "titre": "Controle irrigation serre", "source": "capteur", "statut": "a controler"},
        {"id": "LOG-004", "date": "2026-04-08", "type": "stock", "parcelle": "P-101", "titre": "Intrants a reserver", "source": "stock", "statut": "scenario"},
    ],
    "postgis_readiness": {
        "statut": "pret a migrer",
        "srid": 4326,
        "tables_cibles": ["agri_parcelles", "agri_ilots", "agri_observations", "agri_chantiers"],
        "colonnes": ["geometry polygon", "centroid point", "surface_ha calculee", "bbox"],
        "controles": ["geometrie valide", "surface coherente", "pas d'auto-intersection", "ilot continu"],
    },
}


# TypeSol endpoints
@router.post("/types-sol", response_model=TypeSolResponse, status_code=status.HTTP_201_CREATED)
def create_type_sol(type_sol: TypeSolCreate, db: Session = Depends(get_db)):
    db_type = models.TypeSol(**type_sol.model_dump())
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type


@router.get("/types-sol", response_model=List[TypeSolResponse])
def get_types_sol(db: Session = Depends(get_db)):
    return db.query(models.TypeSol).all()


@router.get("/types-sol/{type_id}", response_model=TypeSolResponse)
def get_type_sol(type_id: int, db: Session = Depends(get_db)):
    db_type = db.query(models.TypeSol).filter(models.TypeSol.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Type de sol non trouvé")
    return db_type


@router.put("/types-sol/{type_id}", response_model=TypeSolResponse)
def update_type_sol(type_id: int, type_sol: TypeSolUpdate, db: Session = Depends(get_db)):
    db_type = db.query(models.TypeSol).filter(models.TypeSol.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Type de sol non trouvé")
    for key, value in type_sol.model_dump(exclude_unset=True).items():
        setattr(db_type, key, value)
    db.commit()
    db.refresh(db_type)
    return db_type


@router.delete("/types-sol/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_type_sol(type_id: int, db: Session = Depends(get_db)):
    db_type = db.query(models.TypeSol).filter(models.TypeSol.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Type de sol non trouvé")
    db.delete(db_type)
    db.commit()


# Parcelle endpoints
@router.post("/", response_model=ParcelleResponse, status_code=status.HTTP_201_CREATED)
def create_parcelle(parcelle: ParcelleCreate, db: Session = Depends(get_db)):
    db_parcelle = models.Parcelle(**parcelle.model_dump())
    db.add(db_parcelle)
    db.commit()
    db.refresh(db_parcelle)
    return db_parcelle


@router.get("/", response_model=List[ParcelleResponse])
def get_parcelles(
    type_sol_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Parcelle)
    if type_sol_id:
        query = query.filter(models.Parcelle.type_sol_id == type_sol_id)
    if statut:
        query = query.filter(models.Parcelle.statut == statut)
    return query.all()


@router.get("/cartographie")
def get_cartographie_parcellaire() -> Dict[str, Any]:
    """Retourner le parcellaire GPS, les ilots et le planning chantier."""
    return PARCELLAIRE_GPS


@router.get("/journal-terrain")
def get_journal_terrain() -> Dict[str, Any]:
    """Retourner le journal terrain inspire des registres d'observations agricoles."""
    return {
        "registre": PARCELLAIRE_GPS["registre_terrain"],
        "modeles": [
            {"type": "observation", "donnees": ["parcelle", "date", "note", "photo", "auteur"]},
            {"type": "intervention", "donnees": ["parcelle", "operation", "intrants", "temps", "materiel"]},
            {"type": "alerte", "donnees": ["parcelle", "niveau", "source", "action attendue"]},
            {"type": "stock", "donnees": ["produit", "lot", "quantite", "mouvement"]},
        ],
        "postgis": PARCELLAIRE_GPS["postgis_readiness"],
    }


@router.get("/postgis-readiness")
def get_postgis_readiness() -> Dict[str, Any]:
    """Decrire la cible PostGIS sans rendre PostGIS obligatoire au prototype."""
    return PARCELLAIRE_GPS["postgis_readiness"]


@router.post("/ilots/regrouper")
def regrouper_ilot(request: RegroupementIlotRequest) -> Dict[str, Any]:
    """Preparer un regroupement de parcelles en ilot operationnel."""
    parcelles = [parcelle for parcelle in PARCELLAIRE_GPS["parcelles"] if parcelle["id"] in request.parcelle_ids]
    if not parcelles:
        raise HTTPException(status_code=400, detail="Selection de parcelles vide")

    surface = sum(parcelle["surface_ha"] for parcelle in parcelles)
    cultures = sorted({parcelle["culture"] for parcelle in parcelles})
    return {
        "id": f"ILOT-SIM-{len(request.parcelle_ids)}",
        "nom": request.nom,
        "statut": "simulation_prete",
        "objectif": request.objectif,
        "parcelle_ids": request.parcelle_ids,
        "surface_ha": round(surface, 2),
        "cultures": cultures,
        "actions": ["controler continuites GPS", "valider acces materiel", "synchroniser planning chantier"],
    }


@router.post("/planifier-chantier")
def planifier_chantier_parcellaire(request: PlanificationChantierRequest) -> Dict[str, Any]:
    """Preparer un chantier a partir d'une selection de parcelles GPS."""
    parcelles = [parcelle for parcelle in PARCELLAIRE_GPS["parcelles"] if parcelle["id"] in request.parcelle_ids]
    if not parcelles:
        raise HTTPException(status_code=400, detail="Aucune parcelle valide pour ce chantier")

    surface = sum(parcelle["surface_ha"] for parcelle in parcelles)
    return {
        "id": f"CH-SIM-{request.date_prevue.replace('-', '')}",
        "operation": request.operation,
        "date_prevue": request.date_prevue,
        "parcelles": request.parcelle_ids,
        "surface_ha": round(surface, 2),
        "materiel": request.materiel,
        "responsable": request.responsable,
        "priorite": request.priorite,
        "statut": "chantier_prepare",
        "stocks_a_preparer": ["intrants lies a l'itineraire", "carburant", "pieces d'usure"],
        "controles": ["fenetre meteo", "portance sol", "temps machine", "cout previsionnel"],
    }


@router.get("/{parcelle_id}", response_model=ParcelleResponse)
def get_parcelle(parcelle_id: int, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    return db_parcelle


@router.put("/{parcelle_id}", response_model=ParcelleResponse)
def update_parcelle(parcelle_id: int, parcelle: ParcelleUpdate, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    for key, value in parcelle.model_dump(exclude_unset=True).items():
        setattr(db_parcelle, key, value)
    db.commit()
    db.refresh(db_parcelle)
    return db_parcelle


@router.delete("/{parcelle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parcelle(parcelle_id: int, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    db.delete(db_parcelle)
    db.commit()


# Culture endpoints
@router.post("/{parcelle_id}/cultures", response_model=CultureResponse, status_code=status.HTTP_201_CREATED)
def create_culture(parcelle_id: int, culture: CultureCreate, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    db_culture = models.Culture(**culture.model_dump(), parcelle_id=parcelle_id)
    db.add(db_culture)
    db.commit()
    db.refresh(db_culture)
    return db_culture


@router.get("/{parcelle_id}/cultures", response_model=List[CultureResponse])
def get_cultures(parcelle_id: int, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    return db.query(models.Culture).filter(models.Culture.parcelle_id == parcelle_id).all()


# ItineraireTechnique endpoints
@router.post("/{parcelle_id}/itineraire", response_model=ItineraireTechniqueResponse, status_code=status.HTTP_201_CREATED)
def create_itineraire(parcelle_id: int, itineraire: ItineraireTechniqueCreate, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    db_itineraire = models.ItineraireTechnique(**itineraire.model_dump(), parcelle_id=parcelle_id)
    db.add(db_itineraire)
    db.commit()
    db.refresh(db_itineraire)
    return db_itineraire


@router.get("/{parcelle_id}/itineraire", response_model=ItineraireTechniqueResponse)
def get_itineraire(parcelle_id: int, db: Session = Depends(get_db)):
    db_itineraire = db.query(models.ItineraireTechnique).filter(models.ItineraireTechnique.parcelle_id == parcelle_id).first()
    if not db_itineraire:
        raise HTTPException(status_code=404, detail="Itinéraire technique non trouvé")
    return db_itineraire


# Intervention endpoints
@router.post("/{parcelle_id}/interventions", response_model=InterventionResponse, status_code=status.HTTP_201_CREATED)
def create_intervention(parcelle_id: int, intervention: InterventionCreate, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    db_intervention = models.Intervention(**intervention.model_dump(), parcelle_id=parcelle_id)
    db.add(db_intervention)
    db.commit()
    db.refresh(db_intervention)
    return db_intervention


@router.get("/{parcelle_id}/interventions", response_model=List[InterventionResponse])
def get_interventions(parcelle_id: int, db: Session = Depends(get_db)):
    db_parcelle = db.query(models.Parcelle).filter(models.Parcelle.id == parcelle_id).first()
    if not db_parcelle:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    return db.query(models.Intervention).filter(models.Intervention.parcelle_id == parcelle_id).all()
