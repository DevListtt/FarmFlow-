# FarmFlow - Propositions fonctionnelles

Cette roadmap précise les fonctions à prioriser pour transformer FarmFlow en environnement de pilotage agricole comparable à un Odoo spécialisé ferme.

## 1. Priorité MVP - Socle exploitable

### Pilotage ferme
- Dashboard unique avec vision technique, économique, trésorerie et alertes.
- Fiches atelier : culture, troupeau, transformation, vente directe, prestation.
- Journal d'activité qui relie intervention, stock consommé, temps humain, matériel et coût.
- Raccourcis opérationnels : vendre, encaisser, saisir une intervention, importer une banque, simuler une marge.

### Caisse agricole
- Point de vente pour boutique, marché, panier, prestation, animaux ou produits transformés.
- Tickets, factures simplifiées, avoirs, remises et moyens de paiement multiples.
- Clôture journalière avec fond de caisse, écarts, Z de caisse et export comptable.
- Impact automatique sur stock, vente, TVA et comptabilité.

### Marges et prix de revient
- Marge brute par culture, lot animal, atelier et canal de vente.
- Simulateur rendement / prix / intrants / main-d'œuvre / carburant / aides.
- Seuil de rentabilité, coût de production et comparaison budget/réalisé.
- Analyse de sensibilité pour voir ce qui fait varier la marge.

### Banque et trésorerie
- Import CSV/OFX en premier, puis connecteurs Bridge, Powens ou GoCardless Bank Account Data.
- Catégorisation automatique des flux et rapprochement facture/paiement.
- Alertes : solde bas, gros décaissement, doublon, prélèvement inconnu, retard client.
- Projection de trésorerie à 7, 30 et 90 jours.

### Exports réglementaires
- FEC, journaux, grand livre, balance, TVA et exports par exercice.
- Exports techniques : registre phytosanitaire, traçabilité lots, mouvements stocks, interventions.
- Piste d'audit : horodatage, utilisateur, source de donnée, justificatif lié.

## 2. Modules métier à structurer ensuite

### Technique végétale
- Parcelles, cultures, assolement, itinéraires techniques et interventions.
- Stocks intrants, doses, IFT, coûts et conformité.
- Météo, irrigation, observations terrain et photos.

### Technique animale
- Troupeaux, lots, animaux, reproduction, santé, alimentation et mouvements.
- Coût alimentaire, suivi sanitaire, alertes de rappel et performance par lot.
- Traçabilité naissance, vente, mortalité et traitements.

### Atelier transformation
- Recettes, lots de fabrication, rendements, pertes et traçabilité.
- Calcul de coût de revient transformé.
- Étiquettes, DLC/DDM, allergènes et stocks produits finis.

### Commercial / CRM
- Clients, paniers, abonnements, commandes, relances et segmentation.
- Tarifs par canal : boutique, marché, grossiste, coopérative, livraison.
- Historique client et performance par canal.

## 3. IA à préparer proprement

- Assistant contextualisé par les données de la ferme avec validation humaine obligatoire.
- OCR factures, bons de livraison, tickets et relevés bancaires.
- Détection d'anomalies sur marges, stocks, banque et comptabilité.
- Recommandations explicables : achat, intervention, relance client, alerte marge.
- Journal d'audit des suggestions IA et séparation claire entre suggestion et décision.

## 4. Ordre de réalisation conseillé

1. Stabiliser backend, migrations, authentification, droits et audit.
2. Restaurer/terminer les pages métier indispensables au lieu de simples maquettes.
3. Livrer caisse + ventes + stocks + export comptable minimal.
4. Ajouter import bancaire et rapprochement manuel, puis automatisation progressive.
5. Brancher marges réelles depuis interventions, ventes, stocks et banque.
6. Ajouter IA uniquement quand les données métier sont fiables et traçables.


## 5. Fonctions maintenant amorcées

- Caisse : `POST /pilotage/caisse/ticket` crée une vente payée, calcule HT/TVA/TTC et sort le stock lié aux produits.
- Journal de caisse : `GET /pilotage/caisse/journal` agrège les ventes payées par moyen de paiement.
- Marges réelles : `GET /pilotage/marges/reelles` calcule chiffre d'affaires, coûts directs, marge brute et taux de marge par atelier.
- Banque : `POST /pilotage/banque/import-csv` importe un CSV bancaire avant connecteur externe et réutilise l'analyse d'alertes de flux.
- Réglementaire : `GET /pilotage/exports/fec.csv` et `GET /pilotage/exports/journal-caisse.csv` fournissent les premiers exports CSV.
- Frontend : pages dédiées `/caisse`, `/marges`, `/banque` et `/exports-reglementaires` exposent ces fonctions sans nouvelles dépendances.
