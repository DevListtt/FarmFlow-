import Head from 'next/head'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiChevronRight,
  FiClipboard,
  FiMapPin,
  FiSmartphone,
  FiStar,
  FiUser,
} from 'react-icons/fi'
import AppLauncher from '../components/AppLauncher'
import { launcherIconMap, normalizeLauncherApp } from '../components/AppLauncher'
import Layout from '../components/Layout'
import { actionToneClass, buildActionCenterItems } from '../lib/actionCenter'
import { farmflowApps } from '../lib/farmflowModules'
import { fetchPilotageApps, fetchPilotageCockpit } from '../lib/pilotageApi'
import { getProfileWorkspace, mobileWorkflows, openSourceInfluences } from '../lib/profileWorkspace'
import { useFarmflowPreferences } from '../lib/useFarmflowPreferences'

export default function Home() {
  const [query, setQuery] = useState('')
  const { data } = useQuery('pilotage-apps-home', fetchPilotageApps, { staleTime: 30000 })
  const { data: cockpitData } = useQuery('pilotage-cockpit-home', fetchPilotageCockpit, { staleTime: 30000, retry: 1 })
  const { preferences, profile, setProfile, toggleFavorite } = useFarmflowPreferences()
  const apps = useMemo(() => data?.apps || farmflowApps, [data?.apps])
  const normalizedApps = useMemo(() => apps.map(normalizeLauncherApp), [apps])
  const actions = useMemo(() => buildActionCenterItems(cockpitData).slice(0, 3), [cockpitData])
  const workspace = useMemo(() => getProfileWorkspace(preferences.profile), [preferences.profile])
  const favoriteApps = useMemo(() => {
    const favoriteCodes = new Set(preferences.favorites || [])
    return normalizedApps.filter((app) => favoriteCodes.has(app.code)).slice(0, 4)
  }, [normalizedApps, preferences.favorites])

  return (
    <Layout>
      <Head>
        <title>FarmFlow - Applications agricoles</title>
        <meta name="description" content="Lanceur FarmFlow pour piloter les applications agricoles." />
      </Head>

      <section className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center py-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-950 text-lg font-semibold text-white shadow-[0_18px_34px_-22px_rgba(15,23,42,0.95)]">
            FF
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">FarmFlow</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Applications de gestion agricole</p>
        </div>

        <div className="mb-7 grid w-full max-w-7xl gap-3 xl:grid-cols-[1fr_0.72fr]">
          <section className="surface overflow-hidden p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="section-kicker">
                  <FiActivity className="h-4 w-4" />
                  {profile.label}
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-950">{workspace.title}</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{workspace.focus}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
                {workspace.indicators.map((indicator) => (
                  <div key={indicator} className="rounded-lg border border-slate-200 bg-white/80 p-3">
                    <p className="text-xs font-medium text-slate-500">{indicator}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">A suivre</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {workspace.routes.map((item) => (
                <Link key={item.route} href={item.route} className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 transition hover:border-emerald-200 hover:bg-emerald-50">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-950">{item.label}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{item.detail}</span>
                  </span>
                  <FiArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
                </Link>
              ))}
            </div>
          </section>

          <section className="surface p-4">
            <div className="section-kicker">
              <FiSmartphone className="h-4 w-4" />
              Terrain mobile
            </div>
            <div className="mt-3 grid gap-2">
              {mobileWorkflows.map((item) => (
                <Link key={item.label} href={item.route} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 transition hover:bg-slate-50">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                      <FiMapPin className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-950">{item.label}</span>
                      <span className="text-xs text-slate-500">{item.status}</span>
                    </span>
                  </span>
                  <FiChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="mb-7 grid w-full max-w-7xl gap-3 lg:grid-cols-[1.1fr_0.9fr_0.7fr]">
          <section className="surface p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="section-kicker">
                <FiAlertTriangle className="h-4 w-4" />
                Priorites
              </div>
              <Link href="/cockpit" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900">
                Cockpit
                <FiChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-1">
              {actions.map((item) => (
                <Link key={item.id} href={item.route || '/cockpit'} className="group rounded-lg border border-slate-200 bg-white/80 p-3 transition hover:border-emerald-200 hover:bg-emerald-50">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${actionToneClass[item.priority] || actionToneClass.info}`}>
                      {item.priority}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{item.kind}</span>
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.detail}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="surface p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="section-kicker">
                <FiStar className="h-4 w-4" />
                Favoris
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              {favoriteApps.map((app) => {
                const Icon = launcherIconMap[app.code]
                return (
                  <Link key={app.code} href={app.route} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 p-2 transition hover:bg-slate-50">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                      {Icon ? <Icon className="h-4 w-4" /> : <FiStar className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 truncate text-sm font-semibold text-slate-950">{app.name}</span>
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="surface p-4">
            <div className="section-kicker">
              <FiUser className="h-4 w-4" />
              Profil
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-950">{profile.label}</p>
            <select value={preferences.profile} onChange={(event) => setProfile(event.target.value)} className="input mt-3">
              <option value="exploitant">Exploitant</option>
              <option value="chef-culture">Chef culture</option>
              <option value="responsable-elevage">Elevage</option>
              <option value="commercial-caisse">Caisse</option>
              <option value="comptable">Compta</option>
            </select>
          </section>
        </div>

        <section className="surface mb-7 w-full max-w-7xl p-4">
          <div className="mb-3 flex items-center gap-2">
            <FiClipboard className="h-4 w-4 text-emerald-700" />
            <h2 className="text-base font-semibold text-slate-950">References integrees dans FarmFlow</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {openSourceInfluences.map((item) => (
              <div key={item.source} className="rounded-lg border border-slate-200 bg-white/80 p-3">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-semibold uppercase text-slate-500">{item.source}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <AppLauncher
          apps={normalizedApps}
          query={query}
          favorites={preferences.favorites}
          onQueryChange={setQuery}
          onToggleFavorite={toggleFavorite}
          showControls
        />
      </section>
    </Layout>
  )
}
