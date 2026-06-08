# FarmFlow 2.0 - ERP Agricole Open Source

## Introduction

FarmFlow est un ERP agricole open source concu pour centraliser les operations d'une exploitation agricole moderne. L'objectif est de relier production, stocks, achats, ventes, caisse, comptabilite, banque, marges, reglementaire, RH, flotte, CRM, communication et IA dans un meme environnement modulaire.

## Fonctionnalites principales

- Gestion des animaux : elevage, identification, sanitaire, reproduction et lots.
- Gestion des parcelles : ilots, cultures, sols, rotations, interventions et IFT.
- Gestion des stocks : intrants, aliments, produits finis, lots, seuils et mouvements.
- Gestion commerciale : achats, fournisseurs, ventes, caisse, devis, factures et CRM.
- Gestion economique : comptabilite, banque, tresorerie, marges, prix de revient et simulations.
- Gestion operationnelle : chantiers, flotte, entretiens, carburant, RH, planning et calendrier.
- Gestion reglementaire : FEC, journaux, grand livre, balance, TVA, tracabilite et justificatifs.
- Plateforme : assistant IA, OCR, detection d'anomalies, connecteurs, webhooks, Zapier, meteo et paiement.

## Vision produit : ERP agricole modulaire

FarmFlow vise un environnement centralise ou l'exploitant pilote toute la ferme depuis un meme espace :

- Technique : animaux, parcelles, cultures, stocks, chantiers, flotte, calendrier et tracabilite.
- Economique : caisse, ventes, comptabilite, marges brutes, prix de revient, simulations et budget/reel.
- Tresorerie : preparation de la synchronisation bancaire, categorisation des flux, rapprochement facture/paiement et alertes.
- IA : socle prepare pour assistant contextualise, OCR de factures, anomalies de flux, recommandations et syntheses.
- Reglementaire : exports comptables et techniques horodates pour expert-comptable, FEC, journaux, grand livre, balance et TVA.

Le socle transverse est expose via `/pilotage/*` pour fournir la synthese, le catalogue d'applications, les workflows, les roles, les simulateurs, l'analyse bancaire preparatoire et les exports reglementaires.

Voir aussi : [Vision ERP agricole](vision-erp-agricole.md).

## Statistiques cible

- 18+ modules metier.
- 50+ modeles de donnees.
- 100+ endpoints API.
- 100% open source.

## Installation

### Prerequis

- Python 3.9+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker et Docker Compose, recommandes

### Installation avec Docker

```bash
git clone https://github.com/DevListtt/FarmFlow-.git
cd FarmFlow-
cp backend/.env.example backend/.env
cd docker
docker-compose up -d
```

Initialiser la base de donnees :

```bash
docker exec -it farmflow_backend bash
cd /app
alembic upgrade head
```

Services principaux :

- Backend API : `http://localhost:8000`
- Documentation API : `http://localhost:8000/docs`
- Frontend : `http://localhost:3000`
- PostgreSQL : `localhost:5432`
- Redis : `localhost:6379`
- MQTT : `localhost:1883`
- Node-RED : `localhost:1880`

### Installation manuelle du backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Sous Windows, activer l'environnement avec `venv\Scripts\activate`.

### Installation manuelle du frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Build production :

```bash
npm run build
npm run start
```

## Architecture

```text
farmflow/
|-- backend/                  # Backend FastAPI
|   |-- app/
|   |   |-- main.py           # Point d'entree de l'API
|   |   |-- database.py       # Configuration base de donnees
|   |   |-- core/             # Configuration globale
|   |   |-- models/           # Modeles SQLAlchemy
|   |   |-- schemas/          # Schemas Pydantic
|   |   |-- api/              # Routes API
|   |   `-- utils/            # Fonctions utilitaires
|   |-- alembic/              # Migrations
|   |-- requirements.txt
|   `-- Dockerfile
|-- frontend/                 # Frontend Next.js
|   |-- pages/
|   |-- components/
|   |-- styles/
|   |-- public/
|   `-- package.json
|-- mobile/                   # Application mobile Flutter optionnelle
|-- docker/                   # Configuration Docker
`-- docs/                     # Documentation
```

## Stack technique

| Composant | Technologie |
| --- | --- |
| Backend | FastAPI, Python, SQLAlchemy, Pydantic |
| Frontend | Next.js, React, Tailwind CSS, React Query |
| Base relationnelle | PostgreSQL |
| Time-series | InfluxDB |
| Cache | Redis |
| IoT | MQTT, Node-RED |
| IA | TensorFlow, OpenCV, scikit-learn, pytesseract |
| Communication | Twilio, SendGrid, WhatsApp API |
| Conteneurisation | Docker, Docker Compose |
| Reverse proxy | Nginx |

## Modules

### Pilotage

Vue transversale de pilotage ERP agricole.

Fonctionnalites :

- Dashboard synthetique technique, economique, banque, caisse, IA et conformite.
- Catalogue d'applications et fiches modules.
- Workflows transverses entre production, stock, vente, banque, comptabilite et marge.
- Roles metier et premieres actions de configuration.
- Preparation d'une caisse pour ventes directes et clotures journalieres.
- Simulateur de marge brute par atelier.
- Preparation de la synchronisation bancaire et analyse des flux.
- Catalogue d'exports reglementaires comptables et techniques.
- Preparation des points d'integration IA.

Endpoints API :

- `GET /pilotage/dashboard`
- `GET /pilotage/apps`
- `GET /pilotage/apps/{code}`
- `GET /pilotage/workflows`
- `GET /pilotage/roles`
- `GET /pilotage/roadmap`
- `POST /pilotage/configurer-exploitation`
- `GET /pilotage/operations`
- `GET /pilotage/caisse`
- `GET /pilotage/marges`
- `POST /pilotage/marges/simuler`
- `GET /pilotage/banque`
- `POST /pilotage/banque/analyser-flux`
- `GET /pilotage/ia/preparation`
- `GET /pilotage/exports/reglementaires`

### Animaux

Gestion de l'elevage avec identification, sanitaire, reproduction, lots et genealogie.

Endpoints principaux :

- `GET /animaux/`
- `POST /animaux/`
- `GET /animaux/{id}`
- `PUT /animaux/{id}`
- `DELETE /animaux/{id}`
- `GET /animaux/types`
- `GET /animaux/races`
- `GET /animaux/{id}/sante`
- `GET /animaux/{id}/reproduction`

### Parcelles

Gestion des parcelles, cultures, types de sol, itineraires techniques, interventions et IFT.

Endpoints principaux :

- `GET /parcelles/`
- `POST /parcelles/`
- `GET /parcelles/{id}`
- `GET /parcelles/types-sol`
- `GET /parcelles/{id}/cultures`
- `GET /parcelles/{id}/interventions`

### Stocks

Gestion des categories de stock, fournisseurs, seuils, mouvements, dates de peremption et valorisation.

Endpoints principaux :

- `GET /stocks/`
- `POST /stocks/`
- `GET /stocks/categories`
- `GET /stocks/fournisseurs`
- `GET /stocks/{id}/mouvements`

### Ventes et caisse

Gestion des clients, produits vendables, devis, factures, tickets, paiements et clotures.

Endpoints principaux :

- `GET /ventes/`
- `POST /ventes/`
- `GET /ventes/clients`
- `GET /ventes/produits`
- `GET /ventes/{id}/details`
- `GET /pilotage/caisse`

### Chantiers et flotte

Planification des chantiers, taches, equipements, vehicules, entretiens, carburant et cout horaire.

Endpoints principaux :

- `GET /chantiers/`
- `POST /chantiers/`
- `GET /chantiers/{id}/taches`
- `GET /chantiers/equipements`
- `GET /flotte/vehicules`
- `GET /flotte/{id}/entretiens`
- `GET /flotte/{id}/carburants`

### RH

Gestion des employes, postes, conges, absences, paie, formations, evaluations et planning.

Endpoints principaux :

- `GET /rh/employes`
- `POST /rh/employes`
- `GET /rh/postes`
- `GET /rh/{id}/conges`
- `GET /rh/{id}/paies`

### CRM et communication

Gestion des prospects, clients, commandes, factures, segments, campagnes, modeles et envois.

Endpoints principaux :

- `GET /crm/prospects`
- `POST /crm/prospects`
- `GET /crm/commandes`
- `GET /crm/factures`
- `GET /crm/segments`
- `GET /communication/campagnes`
- `POST /communication/envoyer`

### Comptabilite et banque

Gestion du plan comptable, journaux, ecritures, fournisseurs, factures, rapprochement bancaire et TVA.

Endpoints principaux :

- `GET /comptabilite/comptes`
- `POST /comptabilite/comptes`
- `GET /comptabilite/journaux`
- `GET /comptabilite/ecritures`
- `GET /comptabilite/fournisseurs`
- `GET /pilotage/banque`
- `POST /pilotage/banque/analyser-flux`

### IA

Assistant contextualise, OCR, analyse predictive, detection d'anomalies, vision par ordinateur et recommandations.

Endpoints principaux :

- `GET /pilotage/ia/preparation`
- `POST /ia/chatbot`
- `POST /ia/predict`
- `POST /ia/ocr`
- `POST /ia/vision`
- `POST /ia/recommend`

### Calendrier

Evenements, rappels, synchronisation, repetitions et echeances agricoles.

Endpoints principaux :

- `GET /calendrier/`
- `POST /calendrier/`
- `GET /calendrier/types`
- `GET /calendrier/{id}/rappels`
- `GET /calendrier/prochains`

### Exports et integrations

Exports CSV/JSON/PDF, FEC, journaux, grand livre, balance, etiquettes, codes-barres, webhooks et connecteurs externes.

Endpoints principaux :

- `GET /export/animaux/csv`
- `GET /export/parcelles/csv`
- `GET /export/stocks/csv`
- `GET /export/ventes/csv`
- `GET /pilotage/exports/reglementaires`
- `POST /zapier/webhook`
- `POST /zapier/trigger`

## Configuration

Creer un fichier `backend/.env` base sur `backend/.env.example` :

```env
ENVIRONMENT=development
DEBUG=True
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=farmflow
POSTGRES_PASSWORD=farmflow
POSTGRES_DB=farmflow
INFLUXDB_HOST=localhost
INFLUXDB_PORT=8086
INFLUXDB_USER=farmflow
INFLUXDB_PASSWORD=farmflow
INFLUXDB_DB=farmflow_metrics
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=farmflow-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
MQTT_BROKER=localhost
MQTT_PORT=1883
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@farmflow.com
WHATSAPP_API_KEY=
WHATSAPP_PHONE_ID=
WEATHER_API_KEY=
ZAPIER_WEBHOOK_URL=
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=104857600
CORS_ORIGINS=["*"]
```

## Deploiement

Developpement :

```bash
cd docker
docker-compose up -d
```

Production :

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d --build
```

Pour un deploiement manuel, lancer le backend avec `uvicorn` et le frontend avec `npm run build && npm run start`, puis placer Nginx en reverse proxy.

## Contribution

1. Forker le projet.
2. Creer une branche de fonctionnalite.
3. Commiter les changements.
4. Pousser la branche.
5. Ouvrir une pull request.

Conventions de commit :

- `feat:` nouvelle fonctionnalite.
- `fix:` correction de bug.
- `docs:` documentation.
- `style:` style et formatage.
- `refactor:` refactorisation.
- `perf:` performance.
- `test:` tests.
- `chore:` maintenance.

## Tests

```bash
cd backend
pytest

cd ../frontend
npm test
```

## Licence

Ce projet est sous licence MIT.

## Support

Ouvrir une issue sur GitHub : https://github.com/DevListtt/FarmFlow-/issues

**FarmFlow - ERP Agricole Open Source**

Gerez votre exploitation agricole avec efficacite et simplicite.
