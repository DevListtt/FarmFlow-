import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import clsx from 'clsx'

// Icons (simplifiés)
const Icons = {
  animals: '🐄',
  parcelles: '🌾',
  stocks: '📦',
  ventes: '💰',
  chantiers: '🚜',
  rh: '👥',
  flotte: '🚗',
  crm: '🤝',
  comptabilite: '📊',
  communication: '📧',
  ia: '🤖',
  calendrier: '📅',
  caisse: '🧾',
  banque: '🏦',
  marges: '📈',
  export: '📚',
  dashboard: '🏠',
  settings: '⚙️',
  help: '❓'
}

// Navigation items
const navigation = [
  { name: 'Pilotage ferme', href: '/', icon: Icons.dashboard },
  { name: 'Technique', href: '/#technique', icon: Icons.parcelles },
  { name: 'Marges & simulateurs', href: '/#economie', icon: Icons.marges },
  { name: 'Caisse', href: '/#caisse', icon: Icons.caisse },
  { name: 'Banque & flux', href: '/#banque', icon: Icons.banque },
  { name: 'Exports réglementaires', href: '/#reglementaire', icon: Icons.export },
  { name: 'IA agricole', href: '/#ia', icon: Icons.ia },
  { name: 'Animaux', href: '/animaux', icon: Icons.animaux },
  { name: 'Parcelles', href: '/parcelles', icon: Icons.parcelles },
  { name: 'Stocks', href: '/stocks', icon: Icons.stocks },
  { name: 'Ventes', href: '/ventes', icon: Icons.ventes },
  { name: 'Comptabilité', href: '/comptabilite', icon: Icons.comptabilite },
]

// Bottom navigation
const bottomNavigation = [
  { name: 'Paramètres', href: '/settings', icon: Icons.settings },
  { name: 'Aide', href: '/help', icon: Icons.help },
]

// User menu items
const userMenu = [
  { name: 'Mon profil', href: '/profile' },
  { name: 'Paramètres', href: '/settings' },
  { name: 'Déconnexion', href: '/logout' },
]

export default function Layout({ children }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Fermer le menu utilisateur quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen) {
        setUserMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  // Fermer la sidebar sur mobile
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

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Toggle user menu
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>FarmFlow - Pilotage agricole</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          {
            'translate-x-0': sidebarOpen,
            '-translate-x-full': !sidebarOpen,
          }
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">FarmFlow</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-white hover:bg-slate-700 lg:hidden"
          >
            <span className="sr-only">Fermer le menu</span>
            <span>✕</span>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href || 
                  (router.pathname.startsWith(item.href) && item.href !== '/')
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                      {
                        'bg-primary-600 text-white': isActive,
                        'text-slate-300 hover:bg-slate-700 hover:text-white': !isActive,
                      }
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Sidebar Bottom */}
          <div className="mt-auto p-4 border-t border-slate-700">
            <div className="space-y-1">
              {bottomNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                    {
                      'bg-primary-600 text-white': router.pathname === item.href,
                      'text-slate-300 hover:bg-slate-700 hover:text-white': router.pathname !== item.href,
                    }
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={clsx(
          'flex-1 transition-all duration-300 ease-in-out',
          {
            'lg:ml-0': !sidebarOpen,
            'lg:ml-64': sidebarOpen,
          }
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left Side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 lg:hidden"
              >
                <span className="sr-only">Ouvrir le menu</span>
                <span>☰</span>
              </button>
              
              {/* Breadcrumb */}
              <div className="hidden md:block">
                <nav className="flex items-center space-x-2 text-sm">
                  <Link href="/" className="text-gray-500 hover:text-gray-700">
                    Tableau de bord
                  </Link>
                  {router.pathname !== '/' && (
                    <>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-900 capitalize">
                        {router.pathname.replace('/', '') || 'Accueil'}
                      </span>
                    </>
                  )}
                </nav>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
                <span className="sr-only">Notifications</span>
                <span>🔔</span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 p-2 rounded-full text-gray-500 hover:bg-gray-100"
                >
                  <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                    👤
                  </span>
                  <span className="hidden md:inline text-sm font-medium">
                    Utilisateur
                  </span>
                  <span className="hidden md:inline">▼</span>
                </button>

                {/* User Menu Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 animate-fade-in">
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

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>

        {/* Footer */}
        <footer className="bg-gray-100 border-t border-gray-200 py-4 px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} FarmFlow. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Documentation
              </Link>
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Support
              </Link>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
