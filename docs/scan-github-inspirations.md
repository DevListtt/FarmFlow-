# Scan GitHub des inspirations FarmFlow

Date: 2026-06-15

## Objectif

Ce scan compare FarmFlow avec les principaux projets open source agricoles et ERP pour identifier ce qui merite d'etre integre dans l'application, ce qui doit seulement inspirer le produit, et ce qu'il faut eviter de reprendre.

Decision generale: conserver la pile actuelle FarmFlow, c'est-a-dire FastAPI, Next.js, PostgreSQL, Alembic, Docker Compose et React Query. Les depots inspectes apportent surtout des modeles metier, des parcours UX et des idees de priorisation. Aucun ne justifie une re-ecriture de FarmFlow.

## Depots inspectes

| Depot | Etat | Apport utile | Integration FarmFlow recommandee |
| --- | --- | --- | --- |
| [farmOS/farmOS](https://github.com/farmOS/farmOS) | actif | Registre agricole standardise, planification, tenue de registres, socle communautaire. | Creer un modele canonique `assets / logs / observations / quantities` pour parcelles, animaux, stocks et chantiers. |
| [farmOS/field-kit](https://github.com/farmOS/field-kit) | actif, branche `develop` | PWA mobile, usage navigateur, fonctionnement hors ligne, persistance locale. | Construire un vrai mode terrain offline avec brouillons, file de synchronisation et resolution de conflits. |
| [LiteFarmOrg/LiteFarm](https://github.com/LiteFarmOrg/LiteFarm) | actif | Exploitations diversifiees, certification, indicateurs sociaux, environnementaux et economiques. | Ajouter des parcours certification/durabilite et une saisie terrain plus accessible sur mobile. |
| [ekylibre/ekylibre](https://github.com/ekylibre/ekylibre) | actif | ERP/FMIS agricole mature, PostgreSQL, PostGIS, stocks, comptabilite, ateliers. | Durcir le noyau ERP: stocks valorises, couts par atelier, piste d'audit, exports et PostGIS progressif. |
| [FarmData2/FarmData2](https://github.com/FarmData2/FarmData2) | actif, pas encore production-ready | Fermes maraicheres diversifiees, seeding, transplanting, soil amendment, harvesting, certification bio. | Cadrer les ecrans de certification bio, recolte, conditionnement, distribution et recertification. |
| [frappe/agriculture](https://github.com/frappe/agriculture) | actif mais petit | Domaine agricole ERPNext: crops, land, soil, water, weather, diseases, fertilizers. | Reprendre l'idee de fiches type "DocType" et de workflows, sans adopter Frappe/ERPNext. |
| [usetania/tania](https://github.com/usetania/tania) | archive | Simplicite: zones, reservoirs, taches, inventaires, progression de culture. | Garder des ecrans simples pour les petites fermes, sans importer la pile Symfony/PHP. |
| [openfarmcc/OpenFarm](https://github.com/openfarmcc/OpenFarm) | archive, service arrete en avril 2025 | Guides de culture structures comme une base de connaissances. | Ajouter plus tard des modeles de guides cultures et itineraires, sans dependre du service. |
| [microsoft/farmvibes-ai](https://github.com/microsoft/farmvibes-ai) | actif | Workflows geospatiaux, satellite, drone, meteo, NDVI, carbone, detection de pratiques. | Prevoir un connecteur IA/geospatial optionnel, apres stabilisation du parcellaire et des donnees terrain. |

## Ce que FarmFlow couvre deja

- Lanceur d'applications par profil et cockpit dirigeant.
- Parcellaire GPS, ilots, couches metier, planning chantier et export GeoJSON.
- Registre terrain prototype avec observations, interventions, alertes et stock.
- Preparation PostGIS documentee dans l'API parcelles.
- Noyau transactionnel: achats, caisse, commandes, banque, mouvements de stock et ecritures automatiques.
- Documentation Windows, scripts locaux, CI et smoke tests frontend.

## Manques prioritaires

### 1. Registre terrain canonique

FarmFlow a deja un journal terrain, mais il reste un prototype. La prochaine etape doit etre un vrai modele metier inspire de farmOS:

- `agri_assets`: parcelle, animal, lot, materiel, batiment, reservoir, stock;
- `agri_logs`: observation, intervention, alerte, recolte, intrant, soin, mouvement, audit;
- `agri_quantities`: quantite, unite, produit, lot, surface, temps, cout;
- relations vers parcelles, cultures, stocks, chantiers, animaux et documents.

Impact: c'est le socle pour le mobile, la tracabilite, l'IA, les exports reglementaires et les marges.

### 2. Mode terrain offline

Field Kit montre que l'usage terrain doit fonctionner meme sans connexion. FarmFlow doit ajouter:

- stockage local navigateur avec IndexedDB;
- brouillons d'observations et d'interventions;
- file de synchronisation visible;
- statut par element: `brouillon`, `a synchroniser`, `synchronise`, `conflit`;
- endpoint backend de synchronisation idempotent.

Impact: forte valeur utilisateur, surtout batiments, champs, marches et zones a faible reseau.

### 3. Parcellaire PostGIS progressif

Ekylibre confirme que PostGIS est la bonne cible pour un ERP agricole serieux. Il ne faut pas le rendre obligatoire trop vite, mais le preparer:

- migration optionnelle `postgis`;
- colonnes `geometry`, `centroid`, `bbox`;
- calcul de surface cote base;
- validation geometrie et non auto-intersection;
- index spatial pour recherche par zone.

Impact: fiabilise les cartes, chantiers, IFT, calculs de surface et futures analyses IA.

### 4. Certification, durabilite et preuves

LiteFarm et FarmData2 montrent une opportunite forte pour FarmFlow:

- checklist certification bio ou cahier des charges;
- justificatifs par intervention;
- recolte, conditionnement, distribution et facturation relies;
- indicateurs simples: intrants, eau, carburant, temps, marge, emissions estimees;
- export dossier controle.

Impact: differenciation produit, utile pour exploitations bio, maraichage, circuits courts et audit.

### 5. Profondeur ERP agricole

Ekylibre et ERPNext rappellent que FarmFlow doit rester un ERP, pas seulement une app terrain:

- stocks valorises par lot;
- couts imputes par atelier;
- liens achats -> stock -> chantier -> marge;
- ventes/caisse -> stock -> comptabilite;
- piste d'audit lisible dans l'UI;
- workflow de validation par statut.

Impact: transforme les ecrans en postes de travail fiables pour exploitation et comptabilite.

## Ameliorations visuelles recommandees

### Style general

FarmFlow doit garder un style SaaS operationnel, dense et lisible. Les depots agricoles utiles ne sont pas des modeles visuels a copier pixel par pixel. Il faut reprendre leurs logiques:

- farmOS: fiches simples, historique clair, journal chronologique;
- LiteFarm: parcours mobile accessibles, saisie guidee, certification comprehensible;
- Ekylibre: listes ERP denses, filtres, statuts, audit, table detail;
- Field Kit: actions terrain rapides et offline.

### Ecrans a faire evoluer

1. Parcelles: basculer vers un vrai poste terrain avec carte a gauche, panneau detail/action a droite, timeline en dessous.
2. Registre: ajouter onglets `Observations`, `Interventions`, `Stocks`, `Photos`, `Audit`.
3. Mobile: ajouter barre d'action bas d'ecran pour `Observer`, `Intervenir`, `Photo`, `Synchroniser`.
4. Stocks: afficher mouvements, lots, valorisation, peremption et lien chantier.
5. Certification: ecran checklist avec preuves manquantes, pieces jointes et export.
6. Cockpit: afficher moins de cartes decoratives, plus de listes d'actions, alertes et decisions a valider.

## Roadmap d'integration proposee

### Lot A - Registre terrain canonique

- Tables backend `agri_assets`, `agri_logs`, `agri_quantities`.
- Schemas Pydantic stricts.
- Endpoints CRUD et timeline.
- UI parcelle avec timeline terrain.
- Tests API et fixtures.

Priorite: P0.

### Lot B - Mode terrain offline

- IndexedDB cote frontend.
- File de synchronisation.
- Endpoint `POST /terrain/sync`.
- Gestion conflits.
- Smoke test Playwright mobile.

Priorite: P0/P1.

### Lot C - PostGIS parcellaire

- Migration optionnelle.
- GeoJSON depuis base.
- Validation geometrie.
- Calcul surface et centroid.
- Conservation fallback prototype.

Priorite: P1.

### Lot D - Certification et durabilite

- Modele checklist.
- Justificatifs par log terrain.
- Export dossier controle.
- Indicateurs environnementaux simples.

Priorite: P1.

### Lot E - ERP stocks, couts et audit

- Valorisation stock par lot.
- Imputation cout chantier.
- Audit visible par transaction.
- Workflow statut et validation.

Priorite: P1.

### Lot F - IA geospatiale

- Connecteur meteo/satellite optionnel.
- NDVI ou indicateur culture simple.
- Analyse carbone ou pratiques seulement apres stabilisation des donnees.

Priorite: P2.

## A ne pas faire

- Ne pas re-ecrire FarmFlow en Rails, Drupal, Frappe ou Symfony.
- Ne pas importer de gros depots comme dependances directes.
- Ne pas commencer par l'IA geospatiale avant d'avoir un registre terrain fiable.
- Ne pas multiplier les cartes visuelles sans workflow actionnable.
- Ne pas ajouter PostGIS comme pre-requis bloquant pour tester l'app sur Windows.

## Conclusion

La meilleure suite pour FarmFlow est de construire d'abord le socle `registre terrain + offline + parcellaire fiable`. C'est la base commune a farmOS, Field Kit, LiteFarm, FarmData2 et Ekylibre. Les modules certification, stocks valorises et IA pourront ensuite s'appuyer sur des donnees propres au lieu de rester des demos separees.
