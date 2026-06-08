# Vision FarmFlow : Odoo agricole

FarmFlow doit devenir un ERP agricole modulaire : une plateforme unique ou l'exploitant active les apps dont il a besoin, relie les donnees terrain aux flux economiques, puis pilote l'exploitation avec des indicateurs fiables.

## Principe produit

Le produit reprend les principes forts d'un ERP type Odoo, mais les adapte aux metiers agricoles :

- apps modulaires activables progressivement ;
- donnees partagees entre production, commerce, finance, conformite et IA ;
- workflows transverses plutot que silos de pages ;
- roles metier pour l'exploitant, le chef de culture, le responsable elevage, la caisse, la comptabilite et les salaries terrain ;
- automatisations avec validation humaine pour les operations sensibles.

## Domaines fonctionnels

### Socle ERP

- tableau de bord dirigeant ;
- catalogue d'applications ;
- configuration de l'exploitation ;
- roles et droits ;
- alertes et priorites ;
- journal d'audit.

### Production agricole

- parcelles, ilots, sols, cultures et rotations ;
- itineraires techniques et interventions ;
- IFT, temps de travaux et couts par intervention ;
- elevage, lots, identification, reproduction et sanitaire ;
- calendrier agricole et echeances.

### Operations

- stocks intrants, aliments, produits finis et lots ;
- mouvements de stock lies aux interventions, achats et ventes ;
- flotte, materiel, entretiens, carburant et cout horaire ;
- RH, equipes, saisonniers, planning et temps.

### Commerce

- CRM agricole ;
- devis, commandes, factures et contrats ;
- caisse pour vente directe, boutique, marches et paniers ;
- achats fournisseurs, commandes, receptions et factures ;
- communication client et relances.

### Finance

- comptabilite agricole ;
- banque, synchronisation, categorisation et rapprochement ;
- tresorerie previsionnelle ;
- marges brutes, prix de revient, seuils et budget/reel ;
- TVA et cloture.

### Conformite

- FEC ;
- journaux, grand livre et balance ;
- exports techniques et tracabilite ;
- pieces justificatives ;
- preparation expert-comptable.

### Plateforme et IA

- assistant contextualise par les donnees de l'exploitation ;
- OCR factures et bons de livraison ;
- detection d'anomalies sur flux, stocks et marges ;
- recommandations avec validation humaine ;
- connecteurs banque, meteo, paiement, Zapier, IoT et webhooks.

## Workflows prioritaires

1. Intervention terrain -> stock -> marge
2. Vente directe -> caisse -> comptabilite -> stock
3. Achat intrant -> reception -> banque -> cout atelier
4. Elevage -> sanitaire -> lot -> marge
5. Cloture -> exports -> expert-comptable
6. IA -> detection -> explication -> validation humaine

## Roadmap pragmatique

### Phase 1 : socle ERP agricole

- catalogue des apps ;
- dashboard modulaire ;
- roles ;
- workflows ;
- endpoints de pilotage ;
- fiches modules.

### Phase 2 : noyau transactionnel

- achats fournisseurs ;
- mouvements de stock robustes ;
- caisse complete ;
- banque et rapprochement ;
- ecritures comptables automatiques ;
- imputation des couts par atelier.

### Phase 3 : metier agricole avance

- cartographie parcellaire ;
- IFT complet ;
- registre elevage ;
- couts par lot animal ;
- fiches intervention mobile ;
- mode hors ligne terrain.

### Phase 4 : automatisations et IA

- OCR factures ;
- categorisation bancaire ;
- anomalies tresorerie, stocks, marges ;
- assistant ferme ;
- syntheses de cloture ;
- connecteurs externes.

## Regle d'architecture

Chaque nouveau module doit respecter cette logique :

1. donnees metier claires ;
2. API CRUD ;
3. evenements ou mouvements qui alimentent les autres modules ;
4. impact economique ou reglementaire identifie ;
5. vue frontend exploitable ;
6. role et droit associes ;
7. export ou trace d'audit si necessaire.
