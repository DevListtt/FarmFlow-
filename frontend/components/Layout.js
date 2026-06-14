import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from 'react-query'
import {
  FiAlertTriangle,
  FiBell,
  FiCheckCircle,
  FiChevronRight,
  FiGrid,
  FiMonitor,
  FiMoon,
  FiRotateCcw,
  FiSearch,
  FiSettings,
  FiSun,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { actionToneClass, buildActionCenterItems } from '../lib/actionCenter'
import { farmflowApps } from '../lib/farmflowModules'
import { fetchPilotageCockpit } from '../lib/pilotageApi'
import { profileOptions, useFarmflowPreferences } from '../lib/useFarmflowPreferences'
import { launcherIconMap, normalizeLauncherApp } from './AppLauncher'

const themeOptions = ['light', 'dark', 'system']

const themeLabel = {
  light: 'Clair',
  dark: 'Sombre',
  system: 'Systeme',
}

function getPreferredTheme(mode) {
  if (mode !== 'system') return mode
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function Layout({ children }) {
  const [themeMode, setThemeMode] = useState('system')
  const [resolvedTheme, setResolvedTheme] = useState('light')
  const [commandOpen, setCommandOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const commandInputRef = useRef(null)
  const {
    preferences,
    profile,
    setProfile,
    toggleFavorite,
    dismissAction,
    resetDismissedActions,
  } = useFarmflowPreferences()
  const { data: cockpitData } = useQuery('layout-action-center', fetchPilotageCockpit, {
    staleTime: 30000,
    retry: 1,
  })

  const commandApps = useMemo(() => {
    const search = commandQuery.trim().toLowerCase()

    return farmflowApps
      .map(normalizeLauncherApp)
      .filter((app) => {
        const text = `${app.name} ${app.description} ${app.capabilities.join(' ')}`.toLowerCase()
        return !search || text.includes(search)
      })
      .slice(0, 8)
  }, [commandQuery])

  const actionItems = useMemo(() => {
    const dismissed = new Set(preferences.dismissedActions || [])
    return buildActionCenterItems(cockpitData)
      .filter((item) => !dismissed.has(item.id))
      .slice(0, 8)
  }, [cockpitData, preferences.dismissedActions])

  const favoriteApps = useMemo(() => {
    const favoriteCodes = new Set(preferences.favorites || [])
    return farmflowApps
      .map(normalizeLauncherApp)
      .filter((app) => favoriteCodes.has(app.code))
      .slice(0, 6)
  }, [preferences.favorites])

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('farmflow-theme')
    if (themeOptions.includes(savedTheme)) {
      setThemeMode(savedTheme)
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      const nextTheme = getPreferredTheme(themeMode)
      document.documentElement.dataset.theme = nextTheme
      document.documentElement.dataset.themePreference = themeMode
      window.localStorage.setItem('farmflow-theme', themeMode)
      setResolvedTheme(nextTheme)
    }

    applyTheme()
    mediaQuery.addEventListener('change', applyTheme)
    return () => mediaQuery.removeEventListener('change', applyTheme)
  }, [themeMode])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isCommand = event.ctrlKey || event.metaKey
      if (isCommand && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(true)
      }
      if (event.key === 'Escape') {
        setCommandOpen(false)
        setActionsOpen(false)
        setPreferencesOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!commandOpen) return
    const timeout = window.setTimeout(() => commandInputRef.current?.focus(), 60)
    return () => window.clearTimeout(timeout)
  }, [commandOpen])

  const cycleTheme = () => {
    const currentIndex = themeOptions.indexOf(themeMode)
    setThemeMode(themeOptions[(currentIndex + 1) % themeOptions.length])
  }

  const ThemeIcon = themeMode === 'system' ? FiMonitor : resolvedTheme === 'dark' ? FiMoon : FiSun

  return (
    <div className="app-shell">
      <Head>
        <title>FarmFlow - ERP agricole</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <header className="app-header">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" title="Applications">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm ring-1 ring-slate-950/10">
              <FiGrid className="h-5 w-5" />
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-base font-semibold text-slate-950">FarmFlow</p>
              <p className="text-xs font-medium text-slate-500">Centre exploitation</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:inline-flex">
              Synchro active
            </span>
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="header-action"
              title="Commande rapide"
              aria-label="Commande rapide"
              data-testid="command-open"
            >
              <FiSearch className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={cycleTheme}
              className="header-action min-w-[2.5rem] sm:w-auto sm:px-3"
              title={`Theme ${themeLabel[themeMode]}`}
              aria-label={`Theme ${themeLabel[themeMode]}`}
              data-testid="theme-toggle"
            >
              <ThemeIcon className="h-4 w-4" />
              <span className="hidden text-xs font-semibold sm:inline">{themeLabel[themeMode]}</span>
            </button>
            <button
              type="button"
              onClick={() => setActionsOpen(true)}
              className="header-action relative"
              title="Centre actions"
              aria-label="Centre actions"
              data-testid="action-center-open"
            >
              <FiBell className="h-4 w-4" />
              {actionItems.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {actionItems.length}
                </span>
              )}
            </button>
            <button
              type="button"
              className="header-profile"
              title="Profil"
              onClick={() => setPreferencesOpen(true)}
              data-testid="preferences-open"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-950 text-white">
                <FiUser className="h-4 w-4" />
              </span>
              <span className="hidden sm:inline">{profile.label}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {commandOpen && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center px-4 py-20 sm:py-24" data-testid="command-palette">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setCommandOpen(false)}
            aria-label="Fermer"
          />
          <section className="command-palette relative w-full max-w-2xl overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
              <FiSearch className="h-5 w-5 text-slate-400" />
              <input
                ref={commandInputRef}
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="Ouvrir une application, un module ou un flux"
              />
              <button
                type="button"
                onClick={() => setCommandOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                title="Fermer"
                aria-label="Fermer"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto p-2">
              {commandApps.length > 0 ? commandApps.map((app) => {
                const Icon = launcherIconMap[app.code] || FiGrid

                return (
                  <Link
                    key={app.code}
                    href={app.route}
                    onClick={() => setCommandOpen(false)}
                    className="group flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-slate-50"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-950">{app.name}</span>
                      <span className="line-clamp-1 block text-xs font-medium text-slate-500">{app.description}</span>
                    </span>
                    <span className="hidden rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold uppercase text-slate-500 sm:inline-flex">
                      {app.category}
                    </span>
                  </Link>
                )
              }) : (
                <div className="px-4 py-10 text-center text-sm font-medium text-slate-500">
                  Aucun module trouve
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {actionsOpen && (
        <div className="fixed inset-0 z-[115] flex justify-end" data-testid="action-center-panel">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setActionsOpen(false)}
            aria-label="Fermer"
          />
          <aside className="action-drawer relative flex h-full w-full max-w-md flex-col overflow-hidden">
            <div className="border-b border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="section-kicker">
                    <FiBell className="h-4 w-4" />
                    Centre actions
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-950">A traiter maintenant</h2>
                  <p className="mt-1 text-sm text-slate-500">Decisions, risques et alertes du cockpit.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActionsOpen(false)}
                  className="header-action"
                  title="Fermer"
                  aria-label="Fermer"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {actionItems.length > 0 ? actionItems.map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${actionToneClass[item.priority] || actionToneClass.info}`}>
                      {item.priority === 'basse' || item.priority === 'success' ? <FiCheckCircle className="h-4 w-4" /> : <FiAlertTriangle className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${actionToneClass[item.priority] || actionToneClass.info}`}>
                          {item.priority}
                        </span>
                        <span className="text-xs font-medium text-slate-500">{item.kind}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{item.detail}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Link
                          href={item.route || '/cockpit'}
                          onClick={() => setActionsOpen(false)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                        >
                          Ouvrir
                          <FiChevronRight className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => dismissAction(item.id)}
                          className="text-xs font-semibold text-slate-400 hover:text-slate-700"
                        >
                          Masquer
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )) : (
                <div className="rounded-lg border border-slate-200 bg-white/80 p-8 text-center">
                  <FiCheckCircle className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-950">Aucune action prioritaire</p>
                  <p className="mt-1 text-sm text-slate-500">Les actions masquees peuvent etre restaurees.</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={resetDismissedActions}
                className="touch-button inline-flex w-full items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <FiRotateCcw className="h-4 w-4" />
                Restaurer les actions masquees
              </button>
            </div>
          </aside>
        </div>
      )}

      {preferencesOpen && (
        <div className="fixed inset-0 z-[116] flex items-start justify-center px-4 py-20 sm:py-24" data-testid="preferences-panel">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setPreferencesOpen(false)}
            aria-label="Fermer"
          />
          <section className="command-palette relative w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="section-kicker">
                  <FiSettings className="h-4 w-4" />
                  Preferences
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-950">Profil et favoris</h2>
              </div>
              <button type="button" onClick={() => setPreferencesOpen(false)} className="header-action" title="Fermer" aria-label="Fermer">
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-5 p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-950">Profil actif</span>
                <select value={preferences.profile} onChange={(event) => setProfile(event.target.value)} className="input">
                  {profileOptions.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </label>

              <div>
                <h3 className="text-sm font-semibold text-slate-950">Favoris</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {favoriteApps.map((app) => {
                    const Icon = launcherIconMap[app.code] || FiGrid
                    return (
                      <div key={app.code} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/80 p-2">
                        <Link href={app.route} onClick={() => setPreferencesOpen(false)} className="flex min-w-0 items-center gap-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="truncate text-sm font-semibold text-slate-950">{app.name}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(app.code)}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                        >
                          Retirer
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
