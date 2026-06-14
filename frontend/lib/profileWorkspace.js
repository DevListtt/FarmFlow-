export const profileWorkspaces = {
  exploitant: {
    title: 'Poste dirigeant',
    focus: 'Arbitrer tresorerie, marge, risques et priorites de campagne.',
    routes: [
      { label: 'Cockpit', route: '/cockpit', detail: 'KPI, decisions et risques' },
      { label: 'Marges', route: '/marges', detail: 'Prix de revient et seuils' },
      { label: 'Comptabilite', route: '/comptabilite', detail: 'Controle et cloture' },
    ],
    indicators: ['Gain potentiel', 'Treso 30 j', 'Ecart budget'],
  },
  'chef-culture': {
    title: 'Poste cultures',
    focus: 'Planifier les interventions, surveiller IFT, stocks et fenetres terrain.',
    routes: [
      { label: 'Parcelles', route: '/parcelles', detail: 'Carte, ilots et chantiers' },
      { label: 'Chantiers', route: '/chantiers', detail: 'Interventions a valider' },
      { label: 'Stocks', route: '/stocks', detail: 'Intrants et lots' },
    ],
    indicators: ['Surface active', 'IFT moyen', 'Chantiers ouverts'],
  },
  'responsable-elevage': {
    title: 'Poste elevage',
    focus: 'Suivre lots, sanitaire, ration, stocks aliments et marge animale.',
    routes: [
      { label: 'Elevage', route: '/animaux', detail: 'Lots et sanitaire' },
      { label: 'Marges', route: '/marges', detail: 'Ration et cout lot' },
      { label: 'Calendrier', route: '/calendrier', detail: 'Rappels sanitaires' },
    ],
    indicators: ['Lots suivis', 'Cout ration', 'Alertes sanitaires'],
  },
  'commercial-caisse': {
    title: 'Poste vente directe',
    focus: 'Encaisser, reserver, preparer les commandes et suivre les clients.',
    routes: [
      { label: 'Caisse', route: '/caisse', detail: 'Tickets et paiements' },
      { label: 'Commandes', route: '/commandes', detail: 'Reservations stock' },
      { label: 'CRM', route: '/crm', detail: 'Segments clients' },
    ],
    indicators: ['CA jour', 'Panier moyen', 'Commandes ouvertes'],
  },
  comptable: {
    title: 'Poste comptable',
    focus: 'Rapprocher banque, valider les ecritures et preparer les exports.',
    routes: [
      { label: 'Comptabilite', route: '/comptabilite', detail: 'Journaux et TVA' },
      { label: 'Banque', route: '/sync', detail: 'Flux et rapprochement' },
      { label: 'Exports', route: '/apps/documents-reglementaire', detail: 'FEC et justificatifs' },
    ],
    indicators: ['Ecritures auto', 'Banque a rapprocher', 'Exports prets'],
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
    source: 'LiteFarm',
    title: 'Terrain mobile',
    detail: 'Parcours accessibles, certification et indicateurs durables.',
  },
]

export const mobileWorkflows = [
  { label: 'Observation parcelle', route: '/parcelles', status: 'pret UI' },
  { label: 'Intervention terrain', route: '/chantiers', status: 'a connecter stock' },
  { label: 'Caisse marche', route: '/caisse', status: 'pret transactionnel' },
  { label: 'Photo justificatif', route: '/apps/documents-reglementaire', status: 'a brancher OCR' },
]

export const getProfileWorkspace = (profileCode) => (
  profileWorkspaces[profileCode] || profileWorkspaces.exploitant
)

