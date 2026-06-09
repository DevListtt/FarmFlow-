import Head from 'next/head'
import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import {
  FiActivity,
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
import Layout from '../components/Layout'
import {
  categoryByCode,
  farmflowApps,
  groupAppsByCategory,
  roles as fallbackRoles,
  workflows as fallbackWorkflows,
} from '../lib/farmflowModules'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const fetchPilotage = async () => {
  const response = await axios.get(`${API_URL}/pilotage/dashboard`)
  return response.data
}

const fallbackPilotage = {
  nom: 'FarmFlow ERP agricole',
  vision: 'Un environnement modulaire specialise ferme, reunissant production, commerce, finance, conformite, IA et automatisations.',
  kpis: [
    { label: 'Applications metier', value: farmflowApps.length, unit: 'apps' },
    { label: 'Workflows transverses', value: fallbackWorkflows.length, unit: 'flux' },
    { label: 'Modules prioritaires', value: farmflowApps.filter((app) => app.priority === 'haute').length, unit: 'modules' },
    { label: 'Socles disponibles', value: farmflowApps.filter((app) => app.status.includes('disponible')).length, unit: 'modules' },
  ],
  apps: farmflowApps,
  workflows: fallbackWorkflows,
  roles: fallbackRoles,
  alertes: [
    {
      niveau: 'warning',
      titre: 'Tresorerie a surveiller',
      description: 'Brancher le connecteur bancaire puis activer les seuils de solde et gros decaissements.',
    },
    {
      niveau: 'success',
      titre: 'Socle pilotage pret',
      description: 'Le catalogue apps, les workflows et les roles donnent la colonne vertebrale ERP.',
    },
  ],
}

const iconMap = {
  pilotage: FiGrid,
  parcelles: FiMap,
  'cultures-interventions': FiActivity,
  elevage: FiActivity,
  stocks: FiBox,
  achats: FiShoppingCart,
  'ventes-caisse': FiCreditCard,
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

const categoryClasses = {
  socle: 'border-primary-200 bg-primary-50 text-primary-800',
  production: 'border-success-200 bg-success-50 text-success-800',
  operations: 'border-warning-200 bg-warning-50 text-warning-900',
  commerce: 'border-rose-200 bg-rose-50 text-rose-900',
  finance: 'border-sky-200 bg-sky-50 text-sky-900',
  conformite: 'border-violet-200 bg-violet-50 text-violet-900',
  plateforme: 'border-slate-200 bg-slate-50 text-slate-900',
}

const alertClasses = {
  success: 'border-success-200 bg-success-50 text-success-900',
  warning: 'border-warning-200 bg-warning-50 text-warning-900',
  info: 'border-primary-200 bg-primary-50 text-primary-900',
  critical: 'border-danger-200 bg-danger-50 text-danger-900',
}

const normalizeApp = (app) => ({
  code: app.code,
  name: app.name || app.nom,
  category: app.category || app.categorie,
  route: app.route || `/apps/${app.code}`,
  status: app.status || app.statut,
  priority: app.priority || app.priorite,
  description: app.description,
  capabilities: app.capabilities || app.fonctionnalites || app.premieres_actions || [],
  endpoints: app.endpoints || [],
})

const normalizeWorkflow = (workflow) => ({
  code: workflow.code,
  title: workflow.title || workflow.titre,
  description: workflow.description,
  modules: workflow.modules || [],
  steps: workflow.steps || workflow.etapes || [],
})

const normalizeRole = (role) => ({
  code: role.code,
  name: role.name || role.nom,
  level: role.level || role.niveau,
  focus: role.focus || (role.objectifs || []).join(', '),
})

const KpiCard = ({ label, value, unit, index }) => {
  const accents = ['bg-primary-600', 'bg-success-600', 'bg-warning-500', 'bg-slate-700']

  return (
    <article className="card p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-semibold text-gray-950">{value}</span>
        <span className="pb-1 text-sm text-gray-500">{unit}</span>
      </div>
      <div className={`mt-4 h-1.5 rounded ${accents[index % accents.length]}`} />
    </article>
  )
}

const AppCard = ({ app }) => {
  const Icon = iconMap[app.code] || FiGrid
  const category = categoryByCode[app.category] || { label: 'Application' }
  const className = categoryClasses[app.category] || categoryClasses.socle
  const openRoute = app.route || `/apps/${app.code}`

  return (
    <Link
      href={openRoute}
      className="group flex min-h-[132px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
      title={category.label}
    >
      <span className={`flex h-14 w-14 items-center justify-center rounded-lg border transition group-hover:scale-105 ${className}`}>
        <Icon className="h-6 w-6" />
      </span>
      <span className="mt-3 text-sm font-semibold leading-tight text-slate-950">{app.name}</span>
    </Link>
  )
}

const WorkflowCard = ({ workflow }) => (
  <article className="card p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold text-gray-950">{workflow.title}</h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">{workflow.description}</p>
      </div>
      <FiActivity className="h-5 w-5 shrink-0 text-success-600" />
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {workflow.steps.slice(0, 5).map((step) => (
        <span key={step} className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600">
          {step}
        </span>
      ))}
    </div>
  </article>
)

const AlertCard = ({ alerte }) => (
  <div className={`rounded-lg border p-4 ${alertClasses[alerte.niveau] || alertClasses.info}`}>
    <p className="font-semibold">{alerte.titre}</p>
    <p className="mt-1 text-sm opacity-80">{alerte.description}</p>
  </div>
)

export default function Home() {
  const { data, isLoading, isError } = useQuery('pilotage-dashboard', fetchPilotage)
  const pilotage = data || fallbackPilotage

  const apps = useMemo(() => (pilotage.apps || farmflowApps).map(normalizeApp), [pilotage.apps])
  const groupedApps = useMemo(() => groupAppsByCategory(apps), [apps])
  const workflows = useMemo(() => (pilotage.workflows || fallbackWorkflows).map(normalizeWorkflow), [pilotage.workflows])
  const roles = useMemo(() => (pilotage.roles || fallbackRoles).map(normalizeRole), [pilotage.roles])

  return (
    <Layout>
      <Head>
        <title>FarmFlow - ERP agricole</title>
        <meta
          name="description"
          content="FarmFlow centralise production agricole, ventes, caisse, comptabilite, banque, marges, reglementaire et IA."
        />
      </Head>

      <section className="mb-8 rounded-lg bg-white p-6 shadow-soft lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr] xl:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-success-700">ERP agricole modulaire</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-gray-950 sm:text-4xl">
              {pilotage.nom}
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">{pilotage.vision}</p>
          </div>
          <div className="flex flex-wrap gap-3 xl:justify-end">
            <Link href="/apps" className="btn btn-primary gap-2">
              <FiGrid className="h-4 w-4" />
              Applications
            </Link>
            <Link href="/marges" className="btn btn-outline gap-2">
              <FiBarChart2 className="h-4 w-4" />
              Marges
            </Link>
          </div>
        </div>
      </section>

      {isError && (
        <div className="mb-6 rounded-lg border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900">
          API indisponible : affichage du socle local FarmFlow.
        </div>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="spinner" />
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(pilotage.kpis || fallbackPilotage.kpis).map((kpi, index) => (
            <KpiCard key={kpi.label} {...kpi} index={index} />
          ))}
        </div>
      )}

      <section className="mb-8">
        <div className="mx-auto mb-4 flex max-w-6xl flex-col gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <h2 className="text-xl font-semibold text-gray-950">Applications FarmFlow</h2>
          </div>
          <Link href="/apps" className="btn btn-outline gap-2 self-start sm:self-auto">
            <FiGrid className="h-4 w-4" />
            Voir tout
          </Link>
        </div>

        <div className="mx-auto max-w-6xl space-y-6">
          {groupedApps.map((category) => (
            <div key={category.code}>
              <div className="mb-3 flex items-center justify-center gap-3">
                <span className={`h-3 w-3 rounded ${categoryClasses[category.code] || categoryClasses.socle}`} />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{category.label}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                {category.apps.map((app) => (
                  <AppCard key={app.code} app={app} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-950">Workflows transverses</h2>
            <p className="text-sm text-gray-500">Les flux relient terrain, stock, caisse, banque, comptabilite et marges.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {workflows.slice(0, 4).map((workflow) => (
              <WorkflowCard key={workflow.code} workflow={workflow} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-lg font-semibold text-gray-950">Roles</h2>
            <div className="mt-4 space-y-3">
              {roles.slice(0, 6).map((role) => (
                <div key={role.code} className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{role.name}</p>
                    <p className="text-xs text-gray-500">{role.focus}</p>
                  </div>
                  <span className="badge badge-secondary">{role.level}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-lg font-semibold text-gray-950">Alertes</h2>
            <div className="mt-4 space-y-3">
              {(pilotage.alertes || fallbackPilotage.alertes).map((alerte) => (
                <AlertCard key={alerte.titre} alerte={alerte} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </Layout>
  )
}
