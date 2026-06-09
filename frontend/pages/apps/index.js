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
  const openRoute = app.route || `/apps/${app.code}`

  return (
    <Link
      href={openRoute}
      className="group flex min-h-[136px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
    >
      <span className={`flex h-14 w-14 items-center justify-center rounded-lg border transition group-hover:scale-105 ${categoryColors[app.category] || categoryColors.socle}`}>
        <Icon className="h-6 w-6" />
      </span>
      <span className="mt-3 text-sm font-semibold leading-tight text-slate-950">{app.name}</span>
    </Link>
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
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-success-700">Lanceur d'applications</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-950">Applications FarmFlow</h1>
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

      <div className="mx-auto flex min-h-[calc(100vh-18rem)] max-w-6xl flex-col justify-center space-y-7">
        {groupedApps.map((group) => (
          <section key={group.code}>
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className={`h-3 w-3 rounded ${categoryColors[group.code] || categoryColors.socle}`} />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{group.label}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
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
