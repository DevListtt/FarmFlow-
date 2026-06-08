# FarmFlow

FarmFlow est un ERP agricole open source inspire d'Odoo, adapte aux besoins des exploitations agricoles : production, elevage, stocks, ventes, caisse, achats, comptabilite, banque, marges, conformite, IA et integrations.

## Objectif

Centraliser l'exploitation dans un seul environnement modulaire :

- piloter parcelles, cultures, interventions, elevage et stocks ;
- relier terrain, achats, ventes, caisse, banque et comptabilite ;
- calculer marges, prix de revient, seuils et budget/reel ;
- preparer FEC, journaux, grand livre, TVA et exports techniques ;
- brancher IA, OCR, meteo, webhooks, Zapier, paiement et IoT.

## Socle actuel

Le projet contient :

- backend FastAPI ;
- frontend Next.js ;
- documentation dans `docs/` ;
- Docker Compose dans `docker/docker-compose.yml` ;
- module transversal `pilotage` pour le cockpit ERP agricole.

## Endpoints de pilotage

- `GET /pilotage/dashboard`
- `GET /pilotage/apps`
- `GET /pilotage/apps/{code}`
- `GET /pilotage/workflows`
- `GET /pilotage/roles`
- `GET /pilotage/roadmap`
- `POST /pilotage/configurer-exploitation`
- `GET /pilotage/operations`
- `POST /pilotage/marges/simuler`
- `POST /pilotage/banque/analyser-flux`

## Documentation

- [Documentation principale](docs/README.md)
- [Vision Odoo agricole](docs/vision-odoo-agricole.md)

## Lancement avec Docker

```bash
cd docker
docker-compose up -d
```

Services principaux :

- API FastAPI : `http://localhost:8000`
- Documentation API : `http://localhost:8000/docs`
- Frontend : `http://localhost:3000`

## Lancement manuel frontend

```bash
cd frontend
npm install
npm run dev
```

## Lancement manuel backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
