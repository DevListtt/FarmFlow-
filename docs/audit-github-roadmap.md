# Audit GitHub et feuille de route FarmFlow

Date: 2026-06-14

## Etat du depot

Depot GitHub inspecte: `DevListtt/FarmFlow-`

La version `farmflow-erp-agri-ui-v31` a ete consolidee dans `main` via la PR `#11`.

- 128 fichiers locaux detectes.
- 97 fichiers detectes sur `main`.
- 35 fichiers locaux sont absents du depot distant.
- 32 fichiers communs ont diverge.

Les principaux apports locaux a conserver sont:

- cockpit dirigeant configurable;
- lanceur d'applications, profils, favoris et centre actions;
- noyau transactionnel avec tickets, commandes, stocks, banque, ecritures et audit;
- migration Alembic transactionnelle;
- tests de registre modulaire et flux transactionnels;
- atelier parcellaire Leaflet avec dessin, edition, decoupe, ilots et GeoJSON;
- scripts Windows et documentation de lancement local.

## References open source inspectees

### Ekylibre

Ekylibre est une reference FMIS/ERP agricole mature. Les idees utiles pour FarmFlow:

- granularite atelier, culture, lot et stock;
- comptabilite agricole plus stricte;
- PostGIS pour structurer le parcellaire;
- exports et piste d'audit.

FarmFlow ne doit pas reprendre la pile Ruby on Rails, mais reprendre la profondeur metier.

### farmOS

farmOS est une reference pour la tenue de registres terrain.

Idees a integrer:

- modele "assets / logs / observations";
- journal chronologique des operations;
- observations terrain liees aux parcelles, animaux et stocks;
- APIs utilisables par mobile, recherche et automatisations.

### LiteFarm

LiteFarm est interessant pour l'UX de terrain et les exploitations diversifiees.

Idees a integrer:

- parcours mobile-first;
- indicateurs environnementaux et sociaux;
- certification, conformite et justificatifs;
- accompagnement decisionnel accessible.

## Decisions techniques

La pile actuelle reste la bonne base:

- FastAPI;
- Next.js;
- PostgreSQL;
- Alembic;
- Docker Compose;
- React Query;
- Tailwind CSS.

Changements recommandes sans re-ecriture:

1. Ajouter PostGIS en durcissement progressif, pas en pre-requis immediat.
2. Passer progressivement les contrats critiques en TypeScript + Zod.
3. Maintenir le lockfile frontend et reduire progressivement les alertes `npm audit`.
4. Migrer `react-query` v3 vers `@tanstack/react-query`.
5. Elargir la CI: smoke tests Playwright, lint, verification Docker.
6. Transformer les pages en vrais postes de travail par profil.

## Priorites produit

### Lot 1 - Consolidation

- Publier `v31` sur une branche GitHub dediee.
- Ouvrir une PR de consolidation.
- Garder une trace claire des fichiers ajoutes et modifies.
- Ajouter CI, lockfile et script de preparation Windows.

### Lot 2 - Experience metier

- Accueil oriente profil: exploitant, chef culture, elevage, caisse, compta.
- Registre terrain inspire farmOS.
- Parcellaire pret pour PostGIS.
- Actions terrain mobile: observation, intervention, photo, stock, chantier.

### Lot 3 - Robustesse

- Tests transactionnels dans CI.
- Schemas API plus stricts.
- Journal d'audit affiche dans l'UI.

### Lot 4 - Extensions

- Banque connectee.
- OCR factures.
- Meteo et fenetres d'intervention.
- Connecteurs IoT.
- Exports reglementaires et dossier expert-comptable.

