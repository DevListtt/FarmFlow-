import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import clsx from 'clsx'
import {
  FiActivity,
  FiBarChart2,
  FiBox,
  FiCalendar,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiHome,
  FiLayers,
  FiMessageSquare,
  FiSettings,
  FiTruck,
  FiUsers,
  FiZap,
} from 'react-icons/fi'

const Wordmark = ({ inverse = false }) => (
  <span className={clsx('wordmark text-2xl leading-none', { 'wordmark-inverse': inverse })}>
    <span className="wordmark-farm">Farm</span>
    <span className="wordmark-flow">Flow</span>
  </span>
)

const navigation = [
  { name: 'Pilotage ferme', href: '/', icon: FiHome },
  { name: 'Technique', href: '/#technique', icon: FiLayers },
  { name: 'Marges & simulateurs', href: '/marges', icon: FiBarChart2 },
  { name: 'Caisse', href: '/caisse', icon: FiCreditCard },
  { name: 'Banque & flux', href: '/banque', icon: FiDollarSign },
  { name: 'Exports réglementaires', href: '/exports-reglementaires', icon: FiFileText },
  { name: 'IA agricole', href: '/#ia', icon: FiZap },
  { name: 'Animaux', href: '/animaux', icon: FiActivity },
  { name: 'Parcelles', href: '/parcelles', icon: FiGrid },
  { name: 'Stocks', href: '/stocks', icon: FiBox },
  { name: 'Ventes', href: '/ventes', icon: FiDatabase },
  { name: 'Comptabilité', href: '/comptabilite', icon: FiFileText },
  { name: 'Calendrier', href: '/calendrier', icon: FiCalendar },
  { name: 'Flotte', href: '/flotte', icon: FiTruck },
  { name: 'CRM', href: '/crm', icon: FiUsers },
  { name: 'Communication', href: '/communication', icon: FiMessageSquare },
]

const bottomNavigation = [
  { name: 'Paramètres', href: '/settings', icon: FiSettings },
  { name: 'Aide', href: '/help', icon: FiHelpCircle },
]

const userMenu = [
  { name: 'Mon profil', href: '/profile' },
  { name: 'Paramètres', href: '/settings' },
  { name: 'Déconnexion', href: '/logout' },
]

export default function Layout({ children }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = () => {
      if (userMenuOpen) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleUserMenu = (event) => {
    event.stopPropagation()
    setUserMenuOpen(!userMenuOpen)
  }

  const getIsActive = (href) => {
    if (href.includes('#')) {
      return false
    }
    return router.pathname === href || (router.pathname.startsWith(href) && href !== '/')
  }

  return (
    <div className="min-h-screen bg-brand-surface lg:flex">
      <Head>
        <title>FarmFlow - Cockpit agricole</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col bg-brand-navy text-white shadow-2xl shadow-brand-navy/30 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none',
          {
            'translate-x-0': sidebarOpen,
            '-translate-x-full': !sidebarOpen,
          }
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link href="/" className="flex flex-col gap-1">
            <Wordmark inverse />
            <span className="text-xs font-medium text-slate-400">Toute votre ferme. Un seul flux.</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"
          >
            <span className="sr-only">Fermer le menu</span>
            <span>✕</span>
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="p-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = getIsActive(item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200',
                      {
                        'bg-primary-500 text-white shadow-lg shadow-primary-500/20': isActive,
                        'text-slate-300 hover:bg-white/10 hover:text-white': !isActive,
                      }
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="mt-auto border-t border-white/10 p-4">
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Exploitation</p>
              <p className="mt-1 text-sm font-semibold text-white">Ferme pilote</p>
              <p className="text-xs text-slate-400">Cockpit de démonstration</p>
            </div>
            <div className="space-y-1">
              {bottomNavigation.map((item) => {
                const Icon = item.icon
                const isActive = router.pathname === item.href

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-200',
                      {
                        'bg-primary-500 text-white': isActive,
                        'text-slate-300 hover:bg-white/10 hover:text-white': !isActive,
                      }
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-brand-border bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="rounded-lg p-2 text-brand-muted hover:bg-secondary-100 lg:hidden"
              >
                <span className="sr-only">Ouvrir le menu</span>
                <span>☰</span>
              </button>

              <div className="hidden md:block">
                <nav className="flex items-center gap-2 text-sm">
                  <Link href="/" className="font-medium text-brand-muted hover:text-brand-text">
                    Tableau de bord
                  </Link>
                  {router.pathname !== '/' && (
                    <>
                      <span className="text-secondary-400">/</span>
                      <span className="font-semibold capitalize text-brand-text">
                        {router.pathname.replace('/', '').replace('-', ' ') || 'Accueil'}
                      </span>
                    </>
                  )}
                </nav>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-full p-2 text-brand-muted hover:bg-secondary-100">
                <span className="sr-only">Notifications</span>
                <FiActivity className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 rounded-full border border-brand-border bg-white px-2 py-1.5 text-brand-muted hover:bg-secondary-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <FiUsers className="h-4 w-4" />
                  </span>
                  <span className="hidden text-sm font-semibold text-brand-text md:inline">Utilisateur</span>
                  <span className="hidden text-xs md:inline">▼</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-48 animate-fade-in rounded-xl border border-brand-border bg-white py-1 shadow-card">
                    {userMenu.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 text-sm font-medium text-brand-text hover:bg-secondary-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>

        <footer className="border-t border-brand-border bg-white px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-brand-muted">
              © {new Date().getFullYear()} FarmFlow. Cockpit numérique des fermes modernes.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm font-medium text-brand-muted hover:text-brand-text">
                Documentation
              </Link>
              <Link href="/" className="text-sm font-medium text-brand-muted hover:text-brand-text">
                Support
              </Link>
            </div>
          </div>
        </footer>
      </main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-brand-navy/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
