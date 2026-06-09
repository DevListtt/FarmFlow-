import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  FiBell,
  FiChevronDown,
  FiCreditCard,
  FiDollarSign,
  FiGrid,
  FiHome,
  FiMap,
  FiMenu,
  FiPackage,
  FiRadio,
  FiSettings,
  FiTrendingUp,
  FiUser,
  FiX,
} from 'react-icons/fi'

const primaryNavigation = [
  { name: 'Cockpit', href: '/', icon: FiHome },
  { name: 'Caisse', href: '/caisse', icon: FiCreditCard },
  { name: 'Marges', href: '/marges', icon: FiTrendingUp },
  { name: 'Sync', href: '/sync', icon: FiRadio },
  { name: 'Applications', href: '/apps', icon: FiGrid },
]

const quickLinks = [
  { name: 'Parcelles', href: '/parcelles', icon: FiMap },
  { name: 'Stocks', href: '/stocks', icon: FiPackage },
  { name: 'Comptabilite', href: '/comptabilite', icon: FiDollarSign },
  { name: 'Reglages', href: '/apps/pilotage', icon: FiSettings },
]

const accountLinks = [
  { name: 'Roles et droits', href: '/apps/pilotage' },
  { name: 'Connecteurs', href: '/sync' },
  { name: 'Exports', href: '/apps/documents-reglementaire' },
]

const isActiveRoute = (pathname, href) => {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Layout({ children }) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const currentArea = useMemo(() => {
    const active = [...primaryNavigation, ...quickLinks].find((item) => isActiveRoute(router.pathname, item.href))
    return active?.name || 'FarmFlow'
  }, [router.pathname])

  const closeMenus = () => {
    setMobileOpen(false)
    setAccountOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#f4f7f3] text-slate-950">
      <Head>
        <title>FarmFlow - ERP agricole</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" onClick={closeMenus}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-sm font-semibold text-white">
              FF
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-base font-semibold text-slate-950">FarmFlow</p>
              <p className="text-xs font-medium text-slate-500">ERP agricole</p>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {primaryNavigation.map((item) => {
              const Icon = item.icon
              const active = isActiveRoute(router.pathname, item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition',
                    active
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto hidden items-center gap-2 xl:flex">
            {quickLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                  title={item.name}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              )
            })}
          </div>

          <button className="hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:inline-flex" title="Notifications">
            <FiBell className="h-4 w-4" />
          </button>

          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setAccountOpen((open) => !open)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                <FiUser className="h-4 w-4" />
              </span>
              Exploitant
              <FiChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {accountOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                {accountLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={closeMenus}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <FiMenu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="ml-auto h-full w-full max-w-sm bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-950">FarmFlow</p>
                <p className="text-sm text-slate-500">{currentArea}</p>
              </div>
              <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setMobileOpen(false)} aria-label="Fermer">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {[...primaryNavigation, ...quickLinks].map((item) => {
                const Icon = item.icon
                const active = isActiveRoute(router.pathname, item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium',
                      active ? 'bg-emerald-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                    )}
                    onClick={closeMenus}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
