import Link from 'next/link'
import { useMemo } from 'react'
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
  FiStar,
  FiTruck,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import { moduleCategories } from '../lib/farmflowModules'

export const launcherIconMap = {
  pilotage: FiBarChart2,
  'noyau-operationnel': FiZap,
  parcelles: FiMap,
  'cultures-interventions': FiActivity,
  elevage: FiActivity,
  stocks: FiBox,
  achats: FiShoppingCart,
  'ventes-caisse': FiCreditCard,
  'commandes-clients': FiShoppingCart,
  backoffice: FiSettings,
  historiques: FiFileText,
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

const categoryStyles = {
  socle: 'bg-slate-950 text-white ring-slate-950/10',
  production: 'bg-emerald-600 text-white ring-emerald-700/15',
  operations: 'bg-amber-500 text-slate-950 ring-amber-600/15',
  commerce: 'bg-rose-600 text-white ring-rose-700/15',
  finance: 'bg-sky-600 text-white ring-sky-700/15',
  conformite: 'bg-violet-600 text-white ring-violet-700/15',
  plateforme: 'bg-teal-700 text-white ring-teal-800/15',
}

const priorityOrder = {
  haute: 0,
  moyenne: 1,
  basse: 2,
}

export const normalizeLauncherApp = (app) => ({
  code: app.code,
  name: app.name || app.nom,
  category: app.category || app.categorie || 'socle',
  route: app.route || `/apps/${app.code}`,
  priority: app.priority || app.priorite || 'moyenne',
  description: app.description || '',
  capabilities: app.capabilities || app.fonctionnalites || [],
})

function AppIconTile({ app, favoriteActive = false, onToggleFavorite }) {
  const Icon = launcherIconMap[app.code] || FiGrid
  const colorClass = categoryStyles[app.category] || categoryStyles.socle

  return (
    <div className="group relative min-h-[126px] w-full max-w-[132px] rounded-lg border border-transparent text-center transition hover:border-slate-200 hover:bg-white/90 hover:shadow-[0_16px_34px_-28px_rgba(15,23,42,0.8)] focus-within:bg-white">
      {onToggleFavorite && (
        <button
          type="button"
          onClick={() => onToggleFavorite(app.code)}
          className={`absolute right-1.5 top-1.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border shadow-sm transition ${favoriteActive ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white/85 text-slate-400 hover:text-amber-600'}`}
          title={favoriteActive ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-label={favoriteActive ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <FiStar className={favoriteActive ? 'h-3.5 w-3.5 fill-current' : 'h-3.5 w-3.5'} />
        </button>
      )}
      <Link
        href={app.route}
        className="flex min-h-[126px] w-full flex-col items-center justify-start px-2 py-3"
        title={app.name}
      >
        <span className={`flex h-16 w-16 items-center justify-center rounded-lg shadow-sm ring-1 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg ${colorClass}`}>
          <Icon className="h-7 w-7" />
        </span>
        <span className="mt-3 flex min-h-[40px] max-w-[116px] items-start justify-center text-sm font-semibold leading-5 text-slate-900">
          {app.name}
        </span>
      </Link>
    </div>
  )
}

export default function AppLauncher({
  apps,
  query = '',
  category = 'all',
  favorites = [],
  onQueryChange,
  onCategoryChange,
  onToggleFavorite,
  showControls = false,
}) {
  const normalizedApps = useMemo(() => apps.map(normalizeLauncherApp), [apps])
  const filteredApps = useMemo(() => {
    const search = query.trim().toLowerCase()
    return normalizedApps
      .filter((app) => {
        const matchesCategory = category === 'all' || app.category === category
        const text = `${app.name} ${app.description} ${app.capabilities.join(' ')}`.toLowerCase()
        return matchesCategory && (!search || text.includes(search))
      })
      .sort((a, b) => {
        const priorityDiff = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
        if (priorityDiff !== 0) return priorityDiff
        return a.name.localeCompare(b.name)
      })
  }, [category, normalizedApps, query])

  return (
    <div className="mx-auto w-full max-w-7xl">
      {showControls && (
        <div className="surface mx-auto mb-7 grid max-w-3xl gap-3 p-2 sm:grid-cols-[1fr_220px]">
          <label className="relative">
            <span className="sr-only">Rechercher</span>
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => onQueryChange?.(event.target.value)}
              className="input h-11 border-transparent bg-white pl-10 shadow-none"
              placeholder="Rechercher"
            />
          </label>
          <select
            value={category}
            onChange={(event) => onCategoryChange?.(event.target.value)}
            className="input h-11 border-transparent bg-white shadow-none"
          >
            <option value="all">Toutes</option>
            {moduleCategories.map((item) => (
              <option key={item.code} value={item.code}>{item.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-3 justify-items-center gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-9">
        {filteredApps.map((app) => (
          <AppIconTile
            key={app.code}
            app={app}
            favoriteActive={favorites.includes(app.code)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  )
}
