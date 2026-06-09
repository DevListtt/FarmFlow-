"""
API cartographique pour le parcellaire GPS, les ilots et les chantiers.
"""
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


router = APIRouter(prefix="/parcelles", tags=["parcellaire-gps"])


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
}


@router.get("/cartographie")
def get_cartographie_parcellaire() -> Dict[str, Any]:
    return PARCELLAIRE_GPS


@router.post("/ilots/regrouper")
def regrouper_ilot(request: RegroupementIlotRequest) -> Dict[str, Any]:
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
