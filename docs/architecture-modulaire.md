# Architecture modulaire FarmFlow

Cette note fixe la direction technique pour transformer FarmFlow en ERP agricole robuste sans changer de pile a chaque nouvelle brique.

## Decision

FarmFlow garde la pile actuelle :

- Python, FastAPI et PostgreSQL pour le backend metier ;
- Next.js, React et TypeScript progressif pour le frontend ;
- Docker Compose pour le test local ;
- Alembic, OpenAPI, Zod et tests transactionnels comme prochains durcissements.

Le but n'est pas de copier une pile existante, mais de reprendre les principes solides des ERP matures :

- modules declares par manifeste ;
- dependances explicites entre modules ;
- etats metier standardises ;
- roles et permissions rattachables aux modules ;
- workflows transverses entre production, stock, commerce, finance et conformite ;
- contrats API visibles et testables ;
- audit et controles sur chaque transaction critique.

## Registre applicatif

Le registre backend charge le catalogue versionne :

- `backend/app/core/module_manifest_catalog.json`

Ce catalogue enrichit chaque module avec :

- `dependances` : modules requis avant activation complete ;
- `etats` : cycle de vie metier attendu ;
- `permissions` : droits cibles ;
- `domaines_donnees` : objets manipules ;
- `contrats` : surfaces API ou evenements metier ;
- `controles` : validations a durcir.

Endpoint principal :

- `GET /pilotage/architecture`

Endpoints relies :

- `GET /pilotage/apps`
- `GET /pilotage/apps/{code}`
- `GET /pilotage/workflows`
- `GET /pilotage/roles`
- `GET /pilotage/cockpit`
- `GET /pilotage/cockpit/configuration`
- `POST /pilotage/cockpit/configuration`

Le cockpit agrege les tables transactionnelles quand elles contiennent des donnees : tickets caisse, commandes clients, produits, mouvements de stock, operations bancaires et ecritures automatiques. Si aucune transaction n'existe, il renvoie un jeu de demonstration pour conserver un ecran de decision lisible.

Le cockpit applique ensuite une configuration modifiable : objectifs par KPI, seuils de decision, KPI visibles et blocs de pilotage affiches. Cette configuration est gardee en memoire pour le test local ; la prochaine etape naturelle sera de la persister par exploitation et par profil utilisateur.

## Prochain durcissement

1. Eclater le catalogue en manifestes par module quand la structure sera stabilisee.
2. Generer un client API type depuis OpenAPI.
3. Ajouter les migrations Alembic pour les modeles transactionnels.
4. Couvrir stock, caisse, banque et comptabilite avec des tests transactionnels.
5. Ajouter une matrice droits x roles x modules.
6. Ajouter PostGIS pour les parcelles, ilots et calculs GPS avances.

## Tests

Le registre est couvert par :

- `backend/tests/test_module_registry.py`
- `backend/tests/test_transactional_flows.py`

Commande :

```bash
python -m unittest discover -s tests
```

Les tests transactionnels couvrent :

- mouvement de stock et ecriture associee ;
- ticket caisse, sortie de stock et ecritures equilibrees ;
- commande client, reservation, conversion caisse et sortie de stock ;
- rapprochement bancaire comptable.
- cockpit transactionnel et objectifs configurables.

## Migrations

La premiere migration Alembic transactionnelle est :

- `backend/alembic/versions/20260612_0001_transactional_core.py`

Elle cree les tables `tx_*` et leurs index si besoin. Elle est volontairement compatible avec une base deja initialisee par le demarrage local.

Commandes :

```bash
alembic upgrade head
alembic current
```

Le frontend consomme les endpoints de pilotage via :

- `frontend/lib/pilotageApi.js`
