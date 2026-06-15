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
  FiCompass,
  FiList,
  FiMapPin,
  FiSmartphone,
  FiStar,
  FiUser,
  FiZap,
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
  const heroActions = useMemo(() => [workspace.primaryAction, workspace.secondaryAction].filter(Boolean), [workspace])
  const topAction = actions[0]
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

      <section className="flex min-h-[calc(100vh-7rem)] flex-col items-center py-4 sm:py-6">
        <div className="mb-6 grid w-full max-w-7xl gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="command-panel overflow-hidden p-5 text-white" data-testid="home-workspace">
            <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-100">
                  <FiActivity className="h-4 w-4" />
                  {profile.label}
                </div>
                <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">FarmFlow</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{workspace.focus}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {heroActions.map((item, index) => (
                    <Link
                      key={item.route}
                      href={item.route}
                      className={`touch-button inline-flex items-center gap-2 border px-4 py-2 text-sm ${
                        index === 0
                          ? 'border-emerald-300 bg-emerald-300 text-slate-950 hover:bg-emerald-200'
                          : 'border-white/15 bg-white/10 text-white hover:bg-white/15'
                      }`}
                    >
                      {index === 0 ? <FiZap className="h-4 w-4" /> : <FiCompass className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase text-slate-300">Action a ouvrir</span>
                  <FiArrowRight className="h-4 w-4 text-emerald-200" />
                </div>
                <p className="mt-3 text-lg font-semibold text-white">{topAction?.title || workspace.primaryAction?.label}</p>
                <p className="mt-1 text-sm leading-5 text-slate-300">{topAction?.detail || workspace.primaryAction?.detail}</p>
                <Link href={topAction?.route || workspace.primaryAction?.route || '/cockpit'} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white">
                  Ouvrir maintenant
                  <FiChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-2 md:grid-cols-3">
              {workspace.indicators.map((indicator) => (
                <div key={indicator} className="rounded-lg border border-white/10 bg-white/10 p-3">
                  <p className="text-xs font-medium text-slate-300">{indicator}</p>
                  <p className="mt-1 text-sm font-semibold text-white">A suivre</p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_0.9fr] xl:grid-cols-1">
              <div>
                <div className="section-kicker">
                  <FiList className="h-4 w-4" />
                  Plan du jour
                </div>
                <div className="mt-3 space-y-2">
                  {(workspace.todayPlan || []).map((item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/80 p-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-950 text-xs font-semibold text-white">{index + 1}</span>
                      <span className="text-sm font-semibold text-slate-950">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div data-testid="home-field-mode">
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
                          <span className="block truncate text-xs text-slate-500">{item.detail}</span>
                        </span>
                      </span>
                      <span className="hidden rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 sm:inline-flex">{item.status}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mb-7 grid w-full max-w-7xl gap-3 md:grid-cols-3">
          {workspace.routes.map((item) => (
            <Link key={item.route} href={item.route} className="group surface flex items-center justify-between gap-3 p-4 transition hover:border-emerald-200 hover:bg-emerald-50">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-950">{item.label}</span>
                <span className="mt-1 block truncate text-xs text-slate-500">{item.detail}</span>
              </span>
              <FiArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
            </Link>
          ))}
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
