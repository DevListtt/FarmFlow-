import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import clsx from 'clsx'
import {
  FiBarChart2,
  FiBell,
  FiBox,
  FiCalendar,
  FiChevronDown,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiHome,
  FiMap,
  FiMenu,
  FiSettings,
  FiUser,
  FiX,
} from 'react-icons/fi'

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: FiHome },
  { name: 'Applications', href: '/apps', icon: FiGrid },
  { name: 'Parcelles', href: '/parcelles', icon: FiMap },
  { name: 'Animaux', href: '/animaux', icon: FiUser },
  { name: 'Stocks', href: '/stocks', icon: FiBox },
  { name: 'Ventes & caisse', href: '/ventes', icon: FiCreditCard },
  { name: 'Marges', href: '/apps/marges', icon: FiBarChart2 },
  { name: 'Banque', href: '/apps/banque-tresorerie', icon: FiDollarSign },
  { name: 'Comptabilite', href: '/comptabilite', icon: FiFileText },
  { name: 'Calendrier', href: '/calendrier', icon: FiCalendar },
]

const bottomNavigation = [
  { name: 'Reglementaire', href: '/apps/documents-reglementaire', icon: FiFileText },
  { name: 'Integrations', href: '/apps/integrations', icon: FiSettings },
]

const userMenu = [
  { name: 'Roles et droits', href: '/apps/pilotage' },
  { name: 'Automatisations', href: '/apps/integrations' },
  { name: 'Exports', href: '/apps/documents-reglementaire' },
]

const isActiveRoute = (pathname, href) => {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Layout({ children }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = () => {
      if (userMenuOpen) setUserMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen)

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <Head>
        <title>FarmFlow - ERP agricole</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0',
          {
            'translate-x-0': sidebarOpen,
            '-translate-x-full': !sidebarOpen,
          }
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-500 text-sm font-bold text-white">
              FF
            </span>
            <span className="truncate text-lg font-semibold">FarmFlow</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-white hover:bg-slate-800 lg:hidden"
            aria-label="Fermer le menu"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex h-[calc(100vh-4rem)] flex-col overflow-y-auto">
          <div className="p-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">ERP agricole</p>
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = isActiveRoute(router.pathname, item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                      {
                        'bg-success-600 text-white': isActive,
                        'text-slate-300 hover:bg-slate-800 hover:text-white': !isActive,
                      }
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="mt-auto border-t border-slate-800 p-4">
            <div className="space-y-1">
              {bottomNavigation.map((item) => {
                const Icon = item.icon
                const isActive = isActiveRoute(router.pathname, item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                      {
                        'bg-success-600 text-white': isActive,
                        'text-slate-300 hover:bg-slate-800 hover:text-white': !isActive,
                      }
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
                aria-label="Ouvrir le menu"
              >
                <FiMenu className="h-5 w-5" />
              </button>

              <div className="hidden min-w-0 md:block">
                <nav className="flex items-center gap-2 text-sm">
                  <Link href="/" className="text-gray-500 hover:text-gray-700">
                    FarmFlow
                  </Link>
                  {router.pathname !== '/' && (
                    <>
                      <span className="text-gray-300">/</span>
                      <span className="truncate text-gray-900">
                        {router.pathname.replace('/', '').replace('/', ' / ') || 'Accueil'}
                      </span>
                    </>
                  )}
                </nav>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Notifications">
                <FiBell className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-100 text-success-700">
                    <FiUser className="h-4 w-4" />
                  </span>
                  <span className="hidden text-sm font-medium text-gray-700 md:inline">Exploitant</span>
                  <FiChevronDown className="hidden h-4 w-4 md:inline" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg bg-white py-1 shadow-lg">
                    {userMenu.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

        <footer className="border-t border-gray-200 bg-gray-100 px-6 py-4">
          <div className="flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} FarmFlow. ERP agricole open source.</p>
            <div className="flex items-center gap-4">
              <Link href="/apps" className="hover:text-gray-700">Applications</Link>
              <Link href="/apps/documents-reglementaire" className="hover:text-gray-700">Reglementaire</Link>
            </div>
          </div>
        </footer>
      </main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
