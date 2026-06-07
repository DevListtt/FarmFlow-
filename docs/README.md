# FarmFlow 2.0 - ERP Agricole Open Source

## 📋 Table des matières

- [📖 Introduction](#-introduction)
- [🚀 Installation](#-installation)
- [🏗️ Architecture](#-architecture)
- [📦 Modules](#-modules)
- [🛠️ Technologies](#-technologies)
- [📝 Configuration](#-configuration)
- [🚀 Déploiement](#-déploiement)
- [🤝 Contribution](#-contribution)
- [📄 Licence](#-licence)

---

## 📖 Introduction

> Identité UI obligatoire : avant toute modification frontend, lire [`docs/brand/identity.md`](brand/identity.md). FarmFlow est un cockpit numérique professionnel bleu marine / bleu électrique, sans vert dominant ni esthétique bio générique.


**FarmFlow** est un ERP (Enterprise Resource Planning) agricole open source complet, conçu pour répondre aux besoins spécifiques des exploitations agricoles modernes. Il offre une solution intégrée pour gérer tous les aspects de votre exploitation, de la gestion des animaux à la comptabilité, en passant par les ressources humaines et la communication.

### 🎯 Fonctionnalités principales

- **Gestion des animaux** : Suivi complet de l'élevage (bovins, caprins, ovins) avec identification RFID
- **Gestion des parcelles** : Planification des cultures, itinéraires techniques, calcul de l'IFT
- **Gestion des stocks** : Suivi des semences, engrais, phytosanitaires, produits finis
- **Gestion économique** : Caisse, ventes, achats, comptabilité complète
- **Gestion des RH** : Planning, paie, recrutement, cycle de vie des employés
- **Gestion de la flotte** : Véhicules, entretiens, suivi du carburant
- **CRM** : Clients, prospects, historique, segmentation
- **Communication** : Mailing, SMS, WhatsApp, VoIP
- **Pilotage synthétique** : Vue type Odoo agricole regroupant technique, économie, caisse, banque, IA et conformité
- **Caisse agricole** : Tickets, ventes directes, clôtures, moyens de paiement et rapprochement comptable
- **Marge brute & simulateurs** : Prix de revient, seuils de rentabilité, scénarios par culture, lot ou atelier
- **Banque & flux** : Synchro bancaire à préparer, catégorisation, alertes de trésorerie et analyse des décaissements
- **Intelligence Artificielle** : Analyse prédictive, recommandations, chatbot, OCR, vision par ordinateur et assistant contextualisé
- **Calendrier** : Événements, rappels, synchronisation
- **Export des données** : Comptabilité, FEC, journaux, grand livre, balance, RH, CRM, flotte
- **Intégrations externes** : Zapier, code-barres, étiquettes réglementaires, API météo, paiement en ligne


### 🧭 Vision produit : un Odoo agricole

FarmFlow vise un environnement centralisé où l'exploitant pilote toute la ferme depuis un même espace :

- **Technique** : animaux, parcelles, cultures, stocks, chantiers, flotte, calendrier et traçabilité.
- **Économique** : caisse, ventes, comptabilité, marges brutes, prix de revient, simulations et budget/réel.
- **Trésorerie** : préparation de la synchronisation bancaire, catégorisation des flux, rapprochement facture/paiement et alertes.
- **IA** : socle préparé pour assistant contextualisé, OCR de factures, anomalies de flux, recommandations et synthèses.
- **Réglementaire** : exports comptables et techniques horodatés pour expert-comptable, FEC, journaux, grand livre, balance et TVA.

Le premier socle transverse est exposé via `/pilotage/*` pour fournir la synthèse, les simulateurs, l'analyse bancaire préparatoire et le catalogue d'exports réglementaires. La roadmap fonctionnelle détaillée est disponible dans [`docs/FUNCTIONAL_ROADMAP.md`](FUNCTIONAL_ROADMAP.md).

### 📊 Statistiques

- **14+** modules intégrés
- **50+** modèles de données
- **100+** endpoints API
- **100%** open source

---

## 🚀 Installation

### 📥 Prérequis

- Python 3.9+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker et Docker Compose (recommandé)

### 🐳 Installation avec Docker (recommandé)

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/DevListtt/FarmFlow-.git
   cd FarmFlow-
   ```

2. **Configurer l'environnement**
   ```bash
   # Copier le fichier d'exemple
   cp backend/.env.example backend/.env
   
   # Modifier le fichier .env selon vos besoins
   nano backend/.env
   ```

3. **Lancer les conteneurs**
   ```bash
   cd docker
   docker-compose up -d
   ```

4. **Initialiser la base de données**
   ```bash
   # Accéder au conteneur backend
   docker exec -it farmflow_backend bash
   
   # Exécuter les migrations
   cd /app
   alembic upgrade head
   
   # Quitter le conteneur
   exit
   ```

5. **Accéder à l'application**
   - Backend API: `http://localhost:8000`
   - Documentation API: `http://localhost:8000/docs`
   - Frontend: `http://localhost:3000` (si activé)
   - PostgreSQL: `http://localhost:5432`
   - InfluxDB: `http://localhost:8086`
   - Redis: `http://localhost:6379`
   - MQTT: `http://localhost:1883`
   - Node-RED: `http://localhost:1880`

### 🐍 Installation manuelle (Backend)

1. **Créer un environnement virtuel**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # ou
   venv\Scripts\activate  # Windows
   ```

2. **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   nano .env
   ```

4. **Initialiser la base de données**
   ```bash
   # Installer PostgreSQL et créer la base de données
   sudo apt install postgresql postgresql-contrib
   sudo -u postgres psql -c "CREATE DATABASE farmflow;"
   sudo -u postgres psql -c "CREATE USER farmflow WITH PASSWORD 'farmflow';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE farmflow TO farmflow;"
   
   # Exécuter les migrations
   alembic upgrade head
   ```

5. **Lancer le serveur**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### 🖥️ Installation manuelle (Frontend)

1. **Installer les dépendances**
   ```bash
   cd frontend
   npm install
   ```

2. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   nano .env
   ```

3. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

4. **Build pour la production**
   ```bash
   npm run build
   npm run start
   ```

---

## 🏗️ Architecture

### 📁 Structure du projet

```
farmflow/
├── backend/                  # Backend FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # Point d'entrée de l'API
│   │   ├── database.py       # Configuration de la base de données
│   │   ├── core/
│   │   │   └── config.py     # Configuration globale
│   │   ├── models/           # Modèles SQLAlchemy
│   │   ├── schemas/          # Schémas Pydantic
│   │   ├── api/              # Routes API
│   │   └── utils/            # Fonctions utilitaires
│   ├── alembic/              # Migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                 # Frontend Next.js
│   ├── pages/               # Pages Next.js
│   ├── components/          # Composants React
│   ├── styles/              # Styles Tailwind CSS
│   ├── public/              # Fichiers statiques
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── mobile/                   # Application mobile Flutter (optionnel)
│   └── lib/
│       └── main.dart
│
├── docker/                   # Configuration Docker
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── nginx.conf
│
└── docs/                    # Documentation
    └── README.md
```

### 🔧 Stack Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Backend | FastAPI | 0.109.0 |
| Frontend | Next.js | 14.0.4 |
| Mobile | Flutter | 3.x |
| Base de données | PostgreSQL | 15+ |
| Time-series | InfluxDB | 2.7+ |
| Cache | Redis | 7+ |
| IoT | MQTT, Node-RED | - |
| IA | TensorFlow, OpenCV, scikit-learn | - |
| Communication | Twilio, SendGrid, WhatsApp API | - |
| Conteneurisation | Docker | - |
| Reverse Proxy | Nginx | - |

---

## 📦 Modules

### 🧭 Module Pilotage

Vue transversale de pilotage façon ERP/Odoo agricole.

**Fonctionnalités:**
- Dashboard synthétique technique, économique, banque, caisse, IA et conformité
- Préparation d'une caisse pour ventes directes et clôtures journalières
- Simulateur de marge brute par atelier
- Préparation de la synchronisation bancaire et analyse des flux
- Catalogue d'exports réglementaires comptables et techniques
- Préparation des points d'intégration IA

**Endpoints API:**
- `GET /pilotage/dashboard` : Synthèse globale de la ferme
- `GET /pilotage/roadmap` : Propositions fonctionnelles priorisées
- `GET /pilotage/caisse` : Socle caisse et contrôles
- `POST /pilotage/caisse/ticket` : Encaissement, création de vente et sortie de stock
- `GET /pilotage/caisse/journal` : Journal de caisse par moyen de paiement
- `GET /pilotage/marges` : Indicateurs économiques et exemples
- `GET /pilotage/marges/reelles` : Marges réelles calculées depuis ventes, produits et stocks
- `POST /pilotage/marges/simuler` : Simulation de marge brute
- `GET /pilotage/banque` : Préparation de synchro bancaire
- `POST /pilotage/banque/import-csv` : Import CSV bancaire et analyse immédiate
- `POST /pilotage/banque/analyser-flux` : Analyse de flux et alertes
- `GET /pilotage/ia/preparation` : Objectifs et garde-fous IA
- `GET /pilotage/exports/reglementaires` : Exports comptables et réglementaires
- `GET /pilotage/exports/fec.csv` : Export CSV FEC simplifié
- `GET /pilotage/exports/journal-caisse.csv` : Export CSV du journal de caisse

### 🐄 Module Animaux

Gestion complète de l'élevage avec identification RFID.

**Fonctionnalités:**
- Ajout, modification, suppression des animaux
- Suivi sanitaire et historique médical
- Gestion de la reproduction
- Identification par RFID
- Généalogie (mère, père, descendants)

**Modèles:**
- `TypeAnimal` : Types d'animaux (bovin, caprin, ovin, etc.)
- `Race` : Races d'animaux
- `Animal` : Animaux individuels
- `SuiviSante` : Historique sanitaire
- `Reproduction` : Suivi de la reproduction

**Endpoints API:**
- `GET /animaux/` : Lister tous les animaux
- `POST /animaux/` : Créer un animal
- `GET /animaux/{id}` : Obtenir un animal
- `PUT /animaux/{id}` : Mettre à jour un animal
- `DELETE /animaux/{id}` : Supprimer un animal
- `GET /animaux/types` : Lister les types d'animaux
- `GET /animaux/races` : Lister les races
- `GET /animaux/{id}/sante` : Suivi sanitaire
- `GET /animaux/{id}/reproduction` : Suivi de reproduction

### 🌾 Module Parcelles

Gestion des parcelles et cultures.

**Fonctionnalités:**
- Gestion des parcelles (surface, type de sol, localisation)
- Planification des cultures
- Itinéraires techniques
- Suivi des interventions
- Calcul de l'IFT (Indice de Fréquence de Traitement)

**Modèles:**
- `TypeSol` : Types de sol
- `Parcelle` : Parcelles agricoles
- `Culture` : Cultures sur les parcelles
- `ItineraireTechnique` : Itinéraires techniques
- `Intervention` : Interventions sur les parcelles

**Endpoints API:**
- `GET /parcelles/` : Lister toutes les parcelles
- `POST /parcelles/` : Créer une parcelle
- `GET /parcelles/{id}` : Obtenir une parcelle
- `GET /parcelles/types-sol` : Lister les types de sol
- `GET /parcelles/{id}/cultures` : Cultures d'une parcelle
- `GET /parcelles/{id}/interventions` : Interventions d'une parcelle

### 📦 Module Stocks

Gestion des stocks de produits.

**Fonctionnalités:**
- Gestion des catégories de stock
- Suivi des mouvements (entrées, sorties, transferts)
- Alertes de seuil
- Gestion des fournisseurs
- Suivi des dates de péremption

**Modèles:**
- `CategorieduStock` : Catégories de stock
- `Fournisseur` : Fournisseurs
- `Stock` : Stocks de produits
- `MouvementStock` : Mouvements de stock

**Endpoints API:**
- `GET /stocks/` : Lister tous les stocks
- `POST /stocks/` : Créer un stock
- `GET /stocks/categories` : Lister les catégories
- `GET /stocks/fournisseurs` : Lister les fournisseurs
- `GET /stocks/{id}/mouvements` : Mouvements d'un stock

### 💰 Module Ventes

Gestion des ventes, devis et factures.

**Fonctionnalités:**
- Gestion des clients
- Création de devis et factures
- Suivi des ventes
- Calcul des marges
- Historique des ventes

**Modèles:**
- `Client` : Clients
- `Produit` : Produits vendables
- `Vente` : Ventes
- `DetailVente` : Détails des ventes

**Endpoints API:**
- `GET /ventes/` : Lister toutes les ventes
- `POST /ventes/` : Créer une vente
- `GET /ventes/clients` : Lister les clients
- `GET /ventes/produits` : Lister les produits
- `GET /ventes/{id}/details` : Détails d'une vente

### 🚜 Module Chantiers

Gestion des chantiers et équipements.

**Fonctionnalités:**
- Planification des chantiers
- Suivi des tâches
- Gestion des équipements
- Maintenance préventive et corrective

**Modèles:**
- `Chantier` : Chantiers
- `Tache` : Tâches
- `Equipement` : Équipements
- `Maintenance` : Maintenance des équipements

**Endpoints API:**
- `GET /chantiers/` : Lister tous les chantiers
- `POST /chantiers/` : Créer un chantier
- `GET /chantiers/{id}/taches` : Tâches d'un chantier
- `GET /chantiers/equipements` : Lister les équipements
- `GET /chantiers/{id}/maintenances` : Maintenance d'un équipement

### 👥 Module RH (Ressources Humaines)

Gestion des employés et ressources humaines.

**Fonctionnalités:**
- Gestion des employés
- Suivi des congés et absences
- Calcul de la paie
- Gestion des formations
- Évaluations des employés

**Modèles:**
- `Poste` : Postes de travail
- `Employe` : Employés
- `Conges` : Congés et absences
- `Paie` : Bulletins de paie
- `Formation` : Formations
- `Evaluation` : Évaluations

**Endpoints API:**
- `GET /rh/employes` : Lister tous les employés
- `POST /rh/employes` : Créer un employé
- `GET /rh/postes` : Lister les postes
- `GET /rh/{id}/conges` : Congés d'un employé
- `GET /rh/{id}/paies` : Paie d'un employé

### 🚗 Module Flotte

Gestion de la flotte de véhicules.

**Fonctionnalités:**
- Gestion des véhicules
- Suivi des entretiens
- Consommation de carburant
- Gestion des conducteurs
- Alertes de maintenance

**Modèles:**
- `TypeVehicule` : Types de véhicules
- `Conducteur` : Conducteurs
- `Vehicule` : Véhicules
- `Entretien` : Entretiens
- `Carburant` : Ravitaillements

**Endpoints API:**
- `GET /flotte/vehicules` : Lister tous les véhicules
- `POST /flotte/vehicules` : Créer un véhicule
- `GET /flotte/types` : Lister les types de véhicules
- `GET /flotte/conducteurs` : Lister les conducteurs
- `GET /flotte/{id}/entretiens` : Entretiens d'un véhicule
- `GET /flotte/{id}/carburants` : Carburant d'un véhicule

### 🤝 Module CRM

Gestion de la relation client.

**Fonctionnalités:**
- Gestion des clients et prospects
- Suivi des commandes
- Facturation
- Historique des interactions
- Segmentation des clients

**Modèles:**
- `Prospect` : Prospects
- `Commande` : Commandes
- `Facture` : Factures
- `SegmentClient` : Segments de clients
- `HistoriqueClient` : Historique des interactions

**Endpoints API:**
- `GET /crm/prospects` : Lister tous les prospects
- `POST /crm/prospects` : Créer un prospect
- `GET /crm/commandes` : Lister les commandes
- `GET /crm/factures` : Lister les factures
- `GET /crm/segments` : Lister les segments

### 📊 Module Comptabilité

Gestion comptable complète.

**Fonctionnalités:**
- Plan comptable
- Journaux comptables
- Écritures comptables
- Gestion des fournisseurs
- Suivi des factures

**Modèles:**
- `CompteComptable` : Comptes comptables
- `Journal` : Journaux
- `EcritureComptable` : Écritures
- `FournisseurComptable` : Fournisseurs
- `FactureFournisseur` : Factures fournisseurs

**Endpoints API:**
- `GET /comptabilite/comptes` : Lister les comptes
- `POST /comptabilite/comptes` : Créer un compte
- `GET /comptabilite/journaux` : Lister les journaux
- `GET /comptabilite/ecritures` : Lister les écritures
- `GET /comptabilite/fournisseurs` : Lister les fournisseurs

### 📧 Module Communication

Gestion de la communication.

**Fonctionnalités:**
- Campagnes de communication
- Modèles de messages
- Envoi d'emails, SMS, WhatsApp
- Suivi des envois

**Modèles:**
- `CanalCommunication` : Canaux de communication
- `ModeleMessage` : Modèles de messages
- `Campagne` : Campagnes
- `EnvoiMessage` : Envois de messages

**Endpoints API:**
- `GET /communication/canaux` : Lister les canaux
- `POST /communication/canaux` : Créer un canal
- `GET /communication/modeles` : Lister les modèles
- `GET /communication/campagnes` : Lister les campagnes
- `GET /communication/envois` : Lister les envois

### 🤖 Module IA

Intelligence artificielle et analyse de données.

**Fonctionnalités:**
- Chatbot intelligent
- Analyse prédictive
- Reconnaissance optique de caractères (OCR)
- Vision par ordinateur
- Recommandations

**Endpoints API:**
- `POST /ia/chatbot` : Chatbot
- `POST /ia/predict` : Analyse prédictive
- `POST /ia/ocr` : OCR
- `POST /ia/vision` : Vision par ordinateur
- `POST /ia/recommend` : Recommandations

### 📅 Module Calendrier

Gestion du calendrier et des événements.

**Fonctionnalités:**
- Gestion des événements
- Rappels automatiques
- Synchronisation
- Répétition des événements

**Modèles:**
- `TypeEvenement` : Types d'événements
- `Evenement` : Événements
- `Rappel` : Rappels

**Endpoints API:**
- `GET /calendrier/` : Lister les événements
- `POST /calendrier/` : Créer un événement
- `GET /calendrier/types` : Lister les types d'événements
- `GET /calendrier/{id}/rappels` : Rappels d'un événement
- `GET /calendrier/prochains` : Prochains événements

### 📤 Module Export

Export des données.

**Fonctionnalités:**
- Export en CSV
- Export en JSON
- Export en PDF
- Génération d'étiquettes
- Génération de codes-barres

**Endpoints API:**
- `GET /export/animaux/csv` : Exporter les animaux en CSV
- `GET /export/parcelles/csv` : Exporter les parcelles en CSV
- `GET /export/stocks/csv` : Exporter les stocks en CSV
- `GET /export/ventes/csv` : Exporter les ventes en CSV

### 🔗 Module Zapier

Intégration avec Zapier.

**Fonctionnalités:**
- Webhooks entrants
- Déclenchement d'actions
- Synchronisation avec d'autres applications

**Endpoints API:**
- `POST /zapier/webhook` : Webhook entrant
- `POST /zapier/trigger` : Déclencher une action

---

## 🛠️ Technologies

### Backend

- **Framework**: FastAPI (Python 3.9+)
- **Base de données**: PostgreSQL (relationnel) + InfluxDB (time-series)
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Authentification**: JWT
- **Cache**: Redis
- **IoT**: MQTT, Node-RED
- **IA**: TensorFlow, OpenCV, scikit-learn, pytesseract
- **Communication**: Twilio (SMS/VoIP), SendGrid (email), WhatsApp API

### Frontend

- **Framework**: Next.js (React)
- **UI**: Tailwind CSS
- **State Management**: React Query
- **Formulaires**: React Hook Form + Zod
- **Graphiques**: Recharts
- **Dates**: date-fns
- **Notifications**: react-hot-toast

### Mobile (optionnel)

- **Framework**: Flutter
- **State Management**: Provider ou Riverpod
- **UI**: Material Design

### DevOps

- **Conteneurisation**: Docker, Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions (à configurer)

---

## 📝 Configuration

### Variables d'environnement

Créer un fichier `.env` dans le dossier `backend` basé sur `.env.example`:

```env
# Environnement
ENVIRONMENT=development
DEBUG=True

# Base de données PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=farmflow
POSTGRES_PASSWORD=farmflow
POSTGRES_DB=farmflow

# InfluxDB
INFLUXDB_HOST=localhost
INFLUXDB_PORT=8086
INFLUXDB_USER=farmflow
INFLUXDB_PASSWORD=farmflow
INFLUXDB_DB=farmflow_metrics

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=farmflow-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# MQTT
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USER=
MQTT_PASSWORD=

# Communication
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@farmflow.com
WHATSAPP_API_KEY=
WHATSAPP_PHONE_ID=

# API Externes
WEATHER_API_KEY=
ZAPIER_WEBHOOK_URL=

# Stockage
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=104857600

# CORS
CORS_ORIGINS=["*"]
```

### Configuration de la base de données

1. **PostgreSQL**:
   - Créer une base de données `farmflow`
   - Créer un utilisateur `farmflow` avec mot de passe `farmflow`
   - Donner tous les droits à l'utilisateur sur la base de données

2. **InfluxDB**:
   - Créer un bucket `farmflow_metrics`
   - Configurer l'accès avec l'utilisateur `farmflow`

3. **Redis**:
   - Installer Redis et le lancer
   - Aucune configuration supplémentaire nécessaire

---

## 🚀 Déploiement

### Déploiement en développement

```bash
# Lancer tous les services
cd docker
docker-compose up -d

# Accéder aux services
# - Backend: http://localhost:8000
# - Frontend: http://localhost:3000
# - Documentation: http://localhost:8000/docs
```

### Déploiement en production

1. **Configurer le fichier docker-compose.prod.yml**
   - Modifier les ports
   - Configurer les volumes persistants
   - Configurer SSL pour Nginx

2. **Lancer les services en production**
   ```bash
   cd docker
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. **Configurer SSL**
   - Placer les certificats SSL dans `docker/ssl/`
   - Modifier `docker/nginx.conf` pour activer SSL

### Déploiement manuel

1. **Backend**:
   ```bash
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm run build
   npm run start
   ```

3. **Nginx**:
   - Configurer Nginx comme reverse proxy
   - Configurer SSL avec Let's Encrypt

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

### 🍴 Fork et Pull Request

1. Forker le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commiter vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pousser vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### 📝 Conventions de commit

Nous utilisons les conventions de commit suivantes :

- `feat:` : Nouvelle fonctionnalité
- `fix:` : Correction de bug
- `docs:` : Documentation
- `style:` : Changements de style
- `refactor:` : Refactorisation du code
- `perf:` : Amélioration des performances
- `test:` : Ajout de tests
- `chore:` : Tâches de maintenance

### 📜 Code de conduite

Veuillez respecter le code de conduite du projet :

- Soyez respectueux
- Soyez clair dans vos commits et messages
- Documentez votre code
- Testez vos changements

### 🔍 Tests

Pour lancer les tests :

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- [FastAPI](https://fastapi.tiangolo.com/) - Framework backend
- [Next.js](https://nextjs.org/) - Framework frontend
- [Tailwind CSS](https://tailwindcss.com/) - CSS Utility First
- [PostgreSQL](https://www.postgresql.org/) - Base de données relationnelle
- [Docker](https://www.docker.com/) - Conteneurisation
- [All contributors](https://github.com/DevListtt/FarmFlow-/graphs/contributors) - Merci pour vos contributions !

---

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub :

[https://github.com/DevListtt/FarmFlow-/issues](https://github.com/DevListtt/FarmFlow-/issues)

---

**FarmFlow - ERP Agricole Open Source**

*Gérez votre exploitation agricole avec efficacité et simplicité.*
