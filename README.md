# FarmFlow

FarmFlow est un ERP agricole open source adapte aux besoins des exploitations agricoles : production, stocks, ventes, caisse, comptabilite, banque, marges, reglementaire, RH, flotte, CRM, communication, IA et automatisations.

## Objectif

Construire une plateforme modulaire pour piloter une ferme de bout en bout :

- gerer les donnees terrain : parcelles, cultures, animaux, interventions et stocks ;
- relier les operations aux flux economiques : achats, ventes, caisse, banque et comptabilite ;
- suivre les marges, les prix de revient, les alertes et les obligations reglementaires ;
- preparer les integrations IA, OCR, banque, meteo, paiement, Zapier, IoT et webhooks.

## Architecture

- `backend/` : API FastAPI, modeles, schemas et routes metier.
- `frontend/` : interface Next.js avec navigation ERP agricole et lanceur d'applications.
- `docs/` : documentation fonctionnelle et technique.
- `docker/` : environnement Docker et configuration deploiement.

## Documentation

- [Documentation principale](docs/README.md)
- [Vision ERP agricole](docs/vision-erp-agricole.md)
- [Audit GitHub et roadmap](docs/audit-github-roadmap.md)
- [Scan GitHub des inspirations](docs/scan-github-inspirations.md)

## Lancement rapide

Sous Windows 11, depuis le dossier du projet :

```powershell
.\setup-windows.cmd
.\start-local.cmd
```

Le script de preparation verifie Docker Desktop, les ports locaux et cree les fichiers `.env` utiles.

Alternative Docker directe :

```bash
cd docker
docker-compose up -d
```

Backend : `http://localhost:8000`

Frontend : `http://localhost:3000`
