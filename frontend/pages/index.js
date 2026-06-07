import Head from 'next/head'
import Layout from '../components/Layout'
import { useQuery } from 'react-query'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const fetchPilotage = async () => {
  const response = await axios.get(`${API_URL}/pilotage/dashboard`)
  return response.data
}

const fallbackPilotage = {
  nom: 'FarmFlow Pilotage',
  vision: 'Un environnement type Odoo, spécialisé ferme, réunissant technique, économie, banque, caisse, IA et conformité.',
  kpis: [
    { label: 'Ateliers suivis', value: 8, unit: 'ateliers' },
    { label: 'Marge brute cible', value: 1240, unit: '€/ha' },
    { label: 'Alertes trésorerie', value: 3, unit: 'alertes' },
    { label: 'Exports prêts', value: 6, unit: 'formats' },
  ],
  espaces: [
    {
      code: 'technique',
      titre: 'Technique ferme',
      description: 'Animaux, parcelles, cultures, stocks, interventions, flotte et IoT.',
      statut: 'socle disponible',
    },
    {
      code: 'economie',
      titre: 'Économie & marges',
      description: 'Marge brute par atelier, simulateurs, prix de revient et écarts budget/réel.',
      statut: 'préparé',
    },
    {
      code: 'caisse',
      titre: 'Caisse & ventes directes',
      description: 'Tickets, moyens de paiement, clôtures de caisse et rapprochement comptable.',
      statut: 'préparé',
    },
    {
      code: 'banque',
      titre: 'Banque & trésorerie',
      description: 'Synchro bancaire, catégorisation, alertes de flux et prévision de trésorerie.',
      statut: 'préparé',
    },
    {
      code: 'reglementaire',
      titre: 'Exports réglementaires',
      description: 'FEC, journaux, grand livre, balances, TVA et exports techniques traçables.',
      statut: 'préparé',
    },
    {
      code: 'ia',
      titre: 'IA agricole',
      description: 'Assistant, OCR factures, détection d’anomalies, recommandations et synthèses.',
      statut: 'connecteurs à brancher',
    },
  ],
  alertes: [
    {
      niveau: 'warning',
      titre: 'Décaissement carburant élevé',
      description: 'Flux carburant supérieur au budget mensuel simulé.',
    },
    {
      niveau: 'info',
      titre: 'Export comptable à valider',
      description: 'Préparer FEC, journaux et pièces justificatives avant clôture.',
    },
  ],
}

const colorClasses = {
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-secondary-100 text-secondary-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-800',
  danger: 'bg-danger-100 text-danger-700',
}

const icons = {
  technique: '🌾',
  economie: '📈',
  caisse: '🧾',
  banque: '🏦',
  reglementaire: '📚',
  ia: '🤖',
}

const KpiCard = ({ label, value, unit, color = 'primary' }) => (
  <div className="card p-6 animate-fade-in">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <div className="mt-3 flex items-end gap-2">
      <span className="text-3xl font-bold text-gray-900">{value}</span>
      <span className="pb-1 text-sm text-gray-500">{unit}</span>
    </div>
    <div className={`mt-4 h-2 rounded-full ${colorClasses[color] || colorClasses.primary}`} />
  </div>
)

const WorkspaceCard = ({ espace }) => (
  <article id={espace.code} className="card p-6 animate-fade-in">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-xl">
          {icons[espace.code] || '🚜'}
        </span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{espace.titre}</h3>
          <span className="badge badge-primary mt-1">{espace.statut}</span>
        </div>
      </div>
    </div>
    <p className="mt-4 text-sm leading-6 text-gray-600">{espace.description}</p>
  </article>
)

const AlertCard = ({ alerte }) => {
  const classes = {
    success: 'border-success-200 bg-success-50 text-success-900',
    warning: 'border-warning-200 bg-warning-50 text-warning-900',
    info: 'border-primary-200 bg-primary-50 text-primary-900',
    critical: 'border-danger-200 bg-danger-50 text-danger-900',
  }

  return (
    <div className={`rounded-xl border p-4 ${classes[alerte.niveau] || classes.info}`}>
      <p className="font-semibold">{alerte.titre}</p>
      <p className="mt-1 text-sm opacity-80">{alerte.description}</p>
    </div>
  )
}

export default function Home() {
  const { data, isLoading, isError } = useQuery('pilotage-dashboard', fetchPilotage)
  const pilotage = data || fallbackPilotage

  return (
    <Layout>
      <Head>
        <title>FarmFlow - Pilotage agricole</title>
        <meta
          name="description"
          content="FarmFlow centralise les aspects techniques, économiques, bancaires, IA et réglementaires de la ferme."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-success-600 p-8 text-white shadow-soft">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-100">ERP agricole modulaire</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{pilotage.nom}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-primary-50">{pilotage.vision}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#economie" className="btn bg-white text-primary-700 hover:bg-primary-50">Simuler les marges</a>
            <a href="#banque" className="btn border-white text-white hover:bg-white/10">Voir la trésorerie</a>
          </div>
        </div>
      </section>

      {isError && (
        <div className="mb-6 rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900">
          API indisponible : affichage de la maquette de pilotage locale.
        </div>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="spinner" />
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {pilotage.kpis.map((kpi, index) => (
            <KpiCard
              key={kpi.label}
              {...kpi}
              color={['primary', 'success', 'warning', 'secondary'][index]}
            />
          ))}
        </div>
      )}

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Espaces de travail</h2>
            <p className="text-sm text-gray-500">Une ferme pilotée par atelier, flux, marge et obligation réglementaire.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pilotage.espaces.map((espace) => (
            <WorkspaceCard key={espace.code} espace={espace} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900">Chaîne de pilotage prévue</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              'Saisie technique terrain → coûts par intervention',
              'Caisse et ventes → comptabilité et stock',
              'Banque synchronisée → catégorisation et alertes',
              'Exports réglementaires → expert-comptable et obligations',
            ].map((item) => (
              <div key={item} className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900">Alertes flux</h2>
          <div className="mt-4 space-y-3">
            {pilotage.alertes.map((alerte) => (
              <AlertCard key={alerte.titre} alerte={alerte} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}
