import Head from 'next/head'
import Link from 'next/link'
import { useQuery } from 'react-query'
import {
  FiActivity,
  FiArrowLeft,
  FiBarChart2,
  FiBox,
  FiCalendar,
  FiCpu,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiMap,
  FiMessageSquare,
  FiSettings,
  FiShoppingCart,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import Layout from '../../components/Layout'
import { categoryByCode, farmflowApps, getAppByCode, workflows } from '../../lib/farmflowModules'
import { fetchPilotageApp } from '../../lib/pilotageApi'

const iconMap = {
  pilotage: FiBarChart2,
  'noyau-operationnel': FiCpu,
  backoffice: FiSettings,
  historiques: FiFileText,
  parcelles: FiMap,
  'cultures-interventions': FiActivity,
  elevage: FiActivity,
  stocks: FiBox,
  achats: FiShoppingCart,
  'ventes-caisse': FiCreditCard,
  'commandes-clients': FiShoppingCart,
  crm: FiUsers,
  comptabilite: FiFileText,
  'banque-tresorerie': FiDollarSign,
  marges: FiBarChart2,
  'flotte-materiel': FiTruck,
  rh: FiUsers,
  calendrier: FiCalendar,
  'documents-reglementaire': FiFileText,
  'ia-agricole': FiCpu,
  communication: FiMessageSquare,
  integrations: FiSettings,
}

const categoryColors = {
  socle: 'border-primary-200 bg-primary-50 text-primary-800',
  production: 'border-success-200 bg-success-50 text-success-800',
  operations: 'border-warning-200 bg-warning-50 text-warning-900',
  commerce: 'border-rose-200 bg-rose-50 text-rose-900',
  finance: 'border-sky-200 bg-sky-50 text-sky-900',
  conformite: 'border-violet-200 bg-violet-50 text-violet-900',
  plateforme: 'border-slate-200 bg-slate-50 text-slate-900',
}

const normalizeApp = (app) => ({
  code: app.code,
  name: app.name || app.nom,
  category: app.category || app.categorie,
  route: app.route || `/apps/${app.code}`,
  status: app.status || app.statut,
  priority: app.priority || app.priorite,
  description: app.description || '',
  capabilities: app.capabilities || app.fonctionnalites || [],
  firstActions: app.firstActions || app.premieres_actions || [],
  endpoints: app.endpoints || [],
  dependencies: app.dependencies || app.dependances || [],
  states: app.states || app.etats || [],
  permissions: app.permissions || [],
  contracts: app.contracts || app.contrats || [],
  controls: app.controls || app.controles || [],
})

const normalizeWorkflow = (workflow) => ({
  code: workflow.code,
  title: workflow.title || workflow.titre,
  description: workflow.description || '',
})

function ManifestBlock({ title, items }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? items.map((item) => (
          <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {item}
          </span>
        )) : (
          <span className="text-sm text-slate-500">Non declare</span>
        )}
      </div>
    </div>
  )
}

export default function AppDetailPage({ app: fallbackApp, relatedWorkflows }) {
  const { data } = useQuery(['pilotage-app', fallbackApp.code], () => fetchPilotageApp(fallbackApp.code), { staleTime: 30000 })
  const app = normalizeApp(data?.app || fallbackApp)
  const liveWorkflows = (data?.workflows || relatedWorkflows).map(normalizeWorkflow)
  const Icon = iconMap[app.code] || FiGrid
  const category = categoryByCode[app.category]
  const categoryClass = categoryColors[app.category] || categoryColors.socle

  return (
    <Layout>
      <Head>
        <title>{`${app.name} - FarmFlow`}</title>
        <meta name="description" content={`${app.name} dans FarmFlow ERP agricole.`} />
      </Head>

      <div className="mb-5">
        <Link href="/apps" className="btn btn-outline gap-2">
          <FiArrowLeft className="h-4 w-4" />
          Applications
        </Link>
      </div>

      <section className="mb-6 rounded-lg bg-white p-6 shadow-soft">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.35fr] lg:items-start">
          <div className="flex gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border ${categoryClass}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{category?.label || app.category}</p>
              <h1 className="mt-1 text-3xl font-semibold text-gray-950">{app.name}</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600">{app.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <span className="badge badge-primary">{app.status}</span>
            <span className="badge badge-secondary">priorite {app.priority}</span>
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-950">Capacites metier</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {app.capabilities.map((capability) => (
              <div key={capability} className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                {capability}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-950">Premieres actions</h2>
          <div className="mt-4 space-y-3">
            {app.firstActions.map((action, index) => (
              <div key={action} className="flex gap-3 rounded-lg bg-gray-50 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white text-xs font-semibold text-gray-700 shadow-sm">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
        <ManifestBlock title="Dependances" items={app.dependencies} />
        <ManifestBlock title="Etats" items={app.states} />
        <ManifestBlock title="Permissions" items={app.permissions} />
        <ManifestBlock title="Contrats" items={app.contracts} />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-950">API et integrations</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {app.endpoints.map((endpoint) => (
              <code key={endpoint} className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
                {endpoint}
              </code>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-950">Workflows relies</h2>
          <div className="mt-4 space-y-3">
            {liveWorkflows.length ? liveWorkflows.map((workflow) => (
              <div key={workflow.code} className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900">{workflow.title}</p>
                <p className="mt-1 text-sm leading-6 text-gray-600">{workflow.description}</p>
              </div>
            )) : (
              <p className="text-sm text-gray-500">Aucun workflow rattache pour le moment.</p>
            )}
          </div>
        </div>
      </section>
    </Layout>
  )
}

export function getStaticPaths() {
  return {
    paths: farmflowApps.map((app) => ({ params: { code: app.code } })),
    fallback: false,
  }
}

export function getStaticProps({ params }) {
  const app = getAppByCode(params.code)
  const relatedWorkflows = workflows.filter((workflow) => workflow.modules.includes(app.code))

  return {
    props: {
      app,
      relatedWorkflows,
    },
  }
}
