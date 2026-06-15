export const profileWorkspaces = {
  exploitant: {
    title: 'Poste dirigeant',
    focus: 'Arbitrer tresorerie, marge, risques et priorites de campagne.',
    primaryAction: { label: 'Traiter les priorites', route: '/cockpit', detail: 'Decisions, risques et alertes' },
    secondaryAction: { label: 'Controler les marges', route: '/marges', detail: 'Prix de revient et stress test' },
    routes: [
      { label: 'Cockpit', route: '/cockpit', detail: 'KPI, decisions et risques' },
      { label: 'Marges', route: '/marges', detail: 'Prix de revient et seuils' },
      { label: 'Comptabilite', route: '/comptabilite', detail: 'Controle et cloture' },
    ],
    indicators: ['Gain potentiel', 'Treso 30 j', 'Ecart budget'],
    todayPlan: ['Rapprocher banque', 'Verifier stocks engages', 'Valider prix sensibles'],
  },
  'chef-culture': {
    title: 'Poste cultures',
    focus: 'Planifier les interventions, surveiller IFT, stocks et fenetres terrain.',
    primaryAction: { label: 'Ouvrir le terrain', route: '/parcelles', detail: 'Carte, logs et ilots' },
    secondaryAction: { label: 'Planifier chantier', route: '/chantiers', detail: 'Interventions a valider' },
    routes: [
      { label: 'Parcelles', route: '/parcelles', detail: 'Carte, ilots et chantiers' },
      { label: 'Chantiers', route: '/chantiers', detail: 'Interventions a valider' },
      { label: 'Stocks', route: '/stocks', detail: 'Intrants et lots' },
    ],
    indicators: ['Surface active', 'IFT moyen', 'Chantiers ouverts'],
    todayPlan: ['Observer parcelles', 'Controler fenetre meteo', 'Reserver intrants'],
  },
  'responsable-elevage': {
    title: 'Poste elevage',
    focus: 'Suivre lots, sanitaire, ration, stocks aliments et marge animale.',
    primaryAction: { label: 'Suivre troupeau', route: '/animaux', detail: 'Lots, mouvements et sanitaire' },
    secondaryAction: { label: 'Calculer ration', route: '/marges', detail: 'Cout lot et marge animale' },
    routes: [
      { label: 'Elevage', route: '/animaux', detail: 'Lots et sanitaire' },
      { label: 'Marges', route: '/marges', detail: 'Ration et cout lot' },
      { label: 'Calendrier', route: '/calendrier', detail: 'Rappels sanitaires' },
    ],
    indicators: ['Lots suivis', 'Cout ration', 'Alertes sanitaires'],
    todayPlan: ['Verifier ration', 'Controler rappels sanitaires', 'Suivre stock aliments'],
  },
  'commercial-caisse': {
    title: 'Poste vente directe',
    focus: 'Encaisser, reserver, preparer les commandes et suivre les clients.',
    primaryAction: { label: 'Ouvrir la caisse', route: '/caisse', detail: 'Tickets, paiements et cloture' },
    secondaryAction: { label: 'Preparer commandes', route: '/commandes', detail: 'Reservations et retraits' },
    routes: [
      { label: 'Caisse', route: '/caisse', detail: 'Tickets et paiements' },
      { label: 'Commandes', route: '/commandes', detail: 'Reservations stock' },
      { label: 'CRM', route: '/crm', detail: 'Segments clients' },
    ],
    indicators: ['CA jour', 'Panier moyen', 'Commandes ouvertes'],
    todayPlan: ['Verifier panier marche', 'Preparer retraits', 'Segmenter clients pro'],
  },
  comptable: {
    title: 'Poste comptable',
    focus: 'Rapprocher banque, valider les ecritures et preparer les exports.',
    primaryAction: { label: 'Controler compta', route: '/comptabilite', detail: 'Journaux, TVA et banque' },
    secondaryAction: { label: 'Exporter dossier', route: '/apps/documents-reglementaire', detail: 'FEC et justificatifs' },
    routes: [
      { label: 'Comptabilite', route: '/comptabilite', detail: 'Journaux et TVA' },
      { label: 'Banque', route: '/sync', detail: 'Flux et rapprochement' },
      { label: 'Exports', route: '/apps/documents-reglementaire', detail: 'FEC et justificatifs' },
    ],
    indicators: ['Ecritures auto', 'Banque a rapprocher', 'Exports prets'],
    todayPlan: ['Rapprocher flux', 'Valider ecritures auto', 'Controler TVA'],
  },
}

export const openSourceInfluences = [
  {
    source: 'Ekylibre',
    title: 'ERP agricole robuste',
    detail: 'Ateliers, comptabilite, stocks, PostGIS et exports.',
  },
  {
    source: 'farmOS',
    title: 'Registre terrain',
    detail: 'Assets, observations, logs et historique exploitable.',
  },
  {
    source: 'Field Kit',
    title: 'Terrain offline',
    detail: 'Brouillons, synchronisation et usage mobile sans reseau.',
  },
  {
    source: 'LiteFarm',
    title: 'Terrain mobile',
    detail: 'Parcours accessibles, certification et indicateurs durables.',
  },
  {
    source: 'FarmData2',
    title: 'Certification bio',
    detail: 'Recolte, elevage, conditionnement et preuves de controle.',
  },
  {
    source: 'FarmVibes.AI',
    title: 'IA geospatiale',
    detail: 'Satellite, meteo, NDVI et carbone en connecteur futur.',
  },
]

export const mobileWorkflows = [
  { label: 'Observer', route: '/parcelles', status: 'pret UI', detail: 'Saisie rapide parcelle' },
  { label: 'Intervenir', route: '/chantiers', status: 'a connecter stock', detail: 'Chantier, temps, intrants' },
  { label: 'Encaisser', route: '/caisse', status: 'pret transactionnel', detail: 'Marche, boutique, paiement' },
  { label: 'Justifier', route: '/apps/documents-reglementaire', status: 'a brancher OCR', detail: 'Photo, piece, export' },
]

export const fieldModeSteps = [
  { code: 'observer', label: 'Observer', detail: 'Note terrain, parcelle, source et statut.' },
  { code: 'planifier', label: 'Planifier', detail: 'Operation, date, responsable et materiel.' },
  { code: 'executer', label: 'Executer', detail: 'Validation chantier, stock et temps passe.' },
  { code: 'justifier', label: 'Justifier', detail: 'Photo, registre, audit et export.' },
]

export const getProfileWorkspace = (profileCode) => (
  profileWorkspaces[profileCode] || profileWorkspaces.exploitant
)
