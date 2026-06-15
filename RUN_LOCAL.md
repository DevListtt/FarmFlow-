# FarmFlow - Test local Windows

Ce depot contient FarmFlow prete a tester en local sur Windows 11.

## Prerequis

- Docker Desktop lance
- PowerShell
- Ports libres : `3000`, `8000`, `5432`, `6379`, `8086`

## Preparation Windows

Depuis ce dossier :

```powershell
.\setup-windows.cmd
```

Le script :

- debloque les scripts PowerShell de cette copie locale ;
- verifie Git si disponible ;
- verifie Docker Desktop et Docker Compose ;
- cree `backend/.env` depuis `backend/.env.example` ;
- cree `frontend/.env.local` ;
- signale les ports deja occupes.

## Lancement rapide Docker

```powershell
.\start-local.cmd
```

Si tu veux utiliser directement PowerShell :

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\start-local.ps1
```

Le script lance le minimum utile pour tester via `docker/docker-compose.local.yml` :

- PostgreSQL
- Redis
- InfluxDB
- Backend FastAPI
- Frontend Next.js

Il n'utilise pas Nginx, MQTT et Node-RED au premier lancement pour eviter les conflits de ports.

## Mode sans Docker

Si Docker Desktop n'est pas installe ou ne demarre pas, tu peux quand meme tester le cockpit et les pages d'applications.

Terminal 1, API legere :

```powershell
.\start-api-lite.cmd
```

ou :

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\start-api-lite.ps1
```

Terminal 2, frontend :

```powershell
.\start-ui-only.cmd
```

ou :

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\start-ui-only.ps1
```

Ce mode expose seulement les endpoints `/pilotage/*`, mais il suffit pour tester :

- le tableau de bord ;
- le lanceur d'applications ;
- les fiches modules ;
- les workflows ;
- les roles ;
- le registre d'architecture modulaire ;
- les simulateurs pilotage.

Le mode Docker complet expose aussi le noyau operationnel :

- `/noyau` : achats, stocks, banque, compta, IoT, balance, segmentation ;
- `/caisse` : scan POS, pesee, panier, client CRM, TPE et cloture ;
- `/commandes` : portail commandes clients, reservation de stock, retrait, livraison et conversion caisse ;
- `/backoffice` : produits, tiers, lots, seuils et ajustements de stock persistants ;
- `/historiques` : tickets, achats, stocks, banque, ecritures, fiches detail et exports CSV ;
- `/parcelles` : atelier cartographique Leaflet, dessin GPS, edition de sommets, decoupe, ilots, couches, alertes et planification chantier ;
- `/marges` : atelier marges culture, animal, circuit court, postes personnalisables, stress test et ration ;
- `/crm` : circuit court, pro et collectivite ;
- `/stocks` : mouvements valorises et impact marge.

## Points a tester dans cette version

- creer un client directement depuis `/caisse`, le selectionner, appliquer son segment/remise, puis encaisser un ticket lie au client CRM ;
- creer un ticket depuis `/caisse` : le panier cree un ticket, une sortie de stock et les ecritures vente/TVA/paiement ;
- ouvrir `/commandes` : choisir un client CRM, filtrer le catalogue, reserver des produits et verifier le stock engage ;
- convertir une commande depuis `/commandes` : le ticket caisse, la sortie de stock et les ecritures automatiques sont crees ;
- annuler une commande depuis `/commandes` : la reservation est liberee et le stock disponible remonte ;
- lancer une commande achat depuis `/noyau` : la reception augmente le stock, valorise le lot et genere les ecritures fournisseur ;
- segmenter un client depuis `/noyau` : circuit court, pro ou collectivite sont persistants ;
- creer un produit ou un tiers depuis `/backoffice` : le referentiel est stocke dans PostgreSQL ;
- enregistrer un ajustement depuis `/backoffice` : le stock, le mouvement et l'ecriture automatique sont crees ;
- ouvrir `/historiques` : les flux transactionnels sont precharges, filtrables et exportables en CSV ;
- cliquer une reference dans `/historiques` : la fiche detail affiche lignes, mouvements ou ecritures liees ;
- utiliser le scanner POS et la balance : les lignes de panier reprennent le produit, le lot, le poids et le prix ;
- rafraichir `/noyau` apres les actions : les tickets recents, le catalogue et les compteurs viennent de PostgreSQL ;
- ouvrir `/parcelles` : la carte Leaflet charge OpenStreetMap, se deplace au glisser, zoome, selectionne les parcelles et affiche les couches cultures, ilots, marge, IFT et chantiers ;
- utiliser les outils `/parcelles` : dessiner une trace, valider une parcelle brouillon, deplacer un sommet, decouper une parcelle, regrouper en ilot, importer/exporter GeoJSON ;
- tester les connecteurs terrain dans `/parcelles` : Trace GPS, meteo, irrigation et validation terrain sont visibles dans le panneau alertes.
- ouvrir `/marges` : tester les onglets Culture, Animal, Circuit court et Ration ;
- ajouter un poste de charge et un revenu annexe dans `/marges` : les seuils et la marge se recalculent ;
- calculer une ration dans `/marges` : kg MS, sucres solubles, MAT, UFL et cout lot sont mis a jour, puis le cout peut etre injecte dans la marge animal.
- ouvrir `/comptabilite` : consulter les journaux, la balance, le grand livre, la TVA, les controles et la banque ;
- valider des ecritures automatiques ou rapprocher une operation bancaire depuis `/comptabilite`, puis exporter le grand livre en CSV.
- ouvrir `/apps` : verifier le registre modulaire, les dependances, les liens et la validation ;
- ouvrir une fiche module depuis `/apps` : verifier les dependances, etats, permissions et contrats API.

## URLs

- Frontend : http://localhost:3000
- API : http://localhost:8000
- Proxy API frontend : http://localhost:3000/api
- Swagger : http://localhost:8000/docs
- Healthcheck : http://localhost:8000/health
- Cockpit decision : http://localhost:8000/pilotage/cockpit
- Pilotage : http://localhost:8000/pilotage/dashboard
- Catalogue apps : http://localhost:8000/pilotage/apps
- Architecture modulaire : http://localhost:8000/pilotage/architecture
- Caisse : http://localhost:8000/pilotage/caisse
- Commandes : http://localhost:8000/commandes/portail
- Comptabilite : http://localhost:8000/comptabilite/vue
- CRM clients : http://localhost:8000/crm/clients
- Marges : http://localhost:8000/pilotage/marges
- Ration : http://localhost:8000/pilotage/marges/ration
- GeoJSON parcelles : http://localhost:8000/parcelles/geojson
- Fonds de carte : http://localhost:8000/parcelles/fonds-carte

## Arret

```powershell
.\stop-local.cmd
```

Pour supprimer aussi les volumes Docker :

```powershell
.\stop-local.cmd -RemoveVolumes
```

## Commandes utiles

Publier cette version dans une branche GitHub apres installation/configuration de Git :

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\publish-github-v31.ps1 -Force
```

Le script cree la branche `codex/farmflow-v31-consolidation`, copie la version locale dans un clone propre, commit, puis pousse la branche. Il ne pousse pas directement sur `main`.

Voir les logs backend :

```powershell
docker compose -p farmflowlocal -f docker/docker-compose.local.yml logs -f backend
```

Voir les logs frontend :

```powershell
docker compose -p farmflowlocal -f docker/docker-compose.local.yml logs -f frontend
```

Relancer un build complet :

```powershell
docker compose -p farmflowlocal -f docker/docker-compose.local.yml build --no-cache backend frontend
docker compose -p farmflowlocal -f docker/docker-compose.local.yml up -d postgres redis influxdb backend frontend
```

Tester le registre modulaire :

```powershell
docker compose -p farmflowlocal -f docker/docker-compose.local.yml run --rm backend python -m unittest discover -s tests
```

Appliquer les migrations Alembic :

```powershell
docker compose -p farmflowlocal -f docker/docker-compose.local.yml run --rm backend alembic upgrade head
docker compose -p farmflowlocal -f docker/docker-compose.local.yml run --rm backend alembic current
```

La migration transactionnelle est compatible avec une base deja initialisee par le demarrage local : elle cree les tables et index manquants sans supprimer les donnees.

Si le script indique qu'un port est deja utilise, commence par :

```powershell
.\stop-local.cmd
```

Puis relance :

```powershell
.\start-local.cmd
```

## Notes

Le premier demarrage peut prendre plusieurs minutes, le temps de construire les images backend/frontend et de telecharger les images Docker.

Si un port est deja utilise, arrete le service qui l'occupe ou modifie les ports dans `docker/docker-compose.local.yml`.

Le frontend Docker appelle l'API via `/api`, puis Next.js relaie vers le backend interne Docker. Pour un lancement hors Docker, garde `INTERNAL_API_URL=http://localhost:8000` si tu utilises le proxy Next.

La carte GPS locale utilise les tuiles publiques OpenStreetMap pour eviter une cle API au prototype. En production, le fond peut etre remplace par un fournisseur dedie via la constante de tuiles ou un moteur cartographique plus avance.

Le frontend Docker utilise Node 20 Alpine et `npm ci` avec `frontend/package-lock.json` pour stabiliser les builds. Les prochaines dettes techniques a traiter sont la reduction des alertes `npm audit`, puis le passage progressif a TypeScript/Zod sur les contrats API critiques.
