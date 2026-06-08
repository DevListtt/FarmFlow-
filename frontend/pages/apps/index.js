import Head from 'next/head'
import Link from 'next/link'
import { useMemo, useState } from 'react'
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
  FiSearch,
  FiSettings,
  FiShoppingCart,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import Layout from '../../components/Layout'
import { farmflowApps, groupAppsByCategory, moduleCategories } from '../../lib/farmflowModules'

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

const categoryColors = {
  socle: 'border-primary-200 bg-primary-50 text-primary-800',
  production: 'border-success-200 bg-success-50 text-success-800',
  operations: 'border-warning-200 bg-warning-50 text-warning-900',
  commerce: 'border-rose-200 bg-rose-50 text-rose-900',
  finance: 'border-sky-200 bg-sky-50 text-sky-900',
  conformite: 'border-violet-200 bg-violet-50 text-violet-900',
  plateforme: 'border-slate-200 bg-slate-50 text-slate-900',
}

const AppTile = ({ app }) => {
  const Icon = iconMap[app.code] || FiGrid
  const detailRoute = app.route?.startsWith('/apps/') || app.route === '/' ? app.route : `/apps/${app.code}`

  return (
    <article className="card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${categoryColors[app.category] || categoryColors.socle}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="badge badge-secondary">{app.priority}</span>
      </div>
      <div className="mt-4 flex-1">
        <h2 className="text-lg font-semibold text-gray-950">{app.name}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{app.description}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {app.capabilities.slice(0, 4).map((item) => (
          <span key={item} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
            {item}
          </span>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <Link href={detailRoute} className="btn btn-primary flex-1 gap-2">
          <FiGrid className="h-4 w-4" />
          Ouvrir
        </Link>
        {detailRoute !== `/apps/${app.code}` && (
          <Link href={`/apps/${app.code}`} className="btn btn-outline gap-2">
            <FiFileText className="h-4 w-4" />
            Fiche
          </Link>
        )}
      </div>
    </article>
  )
}

export default function AppsPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const filteredApps = useMemo(() => {
    const search = query.trim().toLowerCase()
    return farmflowApps.filter((app) => {
      const matchesCategory = category === 'all' || app.category === category
      const text = `${app.name} ${app.description} ${app.capabilities.join(' ')}`.toLowerCase()
      return matchesCategory && (!search || text.includes(search))
    })
  }, [category, query])

  const groupedApps = useMemo(() => groupAppsByCategory(filteredApps), [filteredApps])

  return (
    <Layout>
      <Head>
        <title>Applications - FarmFlow</title>
        <meta name="description" content="Lanceur d'applications FarmFlow pour ERP agricole." />
      </Head>

      <section className="mb-6 rounded-lg bg-white p-6 shadow-soft">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-success-700">Lanceur d'applications</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-950">Applications FarmFlow</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
              Modules production, commerce, finance, conformite et plateforme pour piloter une exploitation agricole.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Rechercher</span>
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input pl-10"
                placeholder="Rechercher un module"
              />
            </label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="input sm:w-56">
              <option value="all">Toutes categories</option>
              {moduleCategories.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="space-y-7">
        {groupedApps.map((group) => (
          <section key={group.code}>
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">{group.label}</h2>
                <p className="text-sm text-gray-500">{group.description}</p>
              </div>
              <span className="badge badge-secondary">{group.apps.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {group.apps.map((app) => (
                <AppTile key={app.code} app={app} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  )
}
