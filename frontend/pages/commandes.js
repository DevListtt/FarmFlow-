import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiCreditCard,
  FiMinus,
  FiPackage,
  FiPlus,
  FiRefreshCcw,
  FiSearch,
  FiShoppingCart,
  FiTrash2,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import Layout from '../components/Layout'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0)
const formatNumber = (value, digits = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(value || 0)

const fetchPortal = async () => {
  const response = await axios.get(`${API_URL}/commandes/portail`)
  return response.data
}

const createOrder = async (payload) => {
  const response = await axios.post(`${API_URL}/commandes`, payload)
  return response.data
}

const convertOrder = async ({ reference, moyen_paiement }) => {
  const response = await axios.post(`${API_URL}/commandes/${reference}/convertir-ticket`, { moyen_paiement })
  return response.data
}

const cancelOrder = async (reference) => {
  const response = await axios.post(`${API_URL}/commandes/${reference}/annuler`)
  return response.data
}

const fallbackData = {
  kpis: [
    { label: 'Commandes actives', value: 0, detail: 'reservees ou en preparation' },
    { label: 'Montant reserve', value: 0, detail: 'stock engage' },
    { label: 'Produits reservables', value: 0, detail: 'stock disponible' },
    { label: 'Alertes dispo', value: 0, detail: 'sous seuil apres reservations' },
  ],
  catalogue: [],
  clients: [],
  modes_retrait: [
    { code: 'retrait-ferme', label: 'Retrait ferme' },
    { code: 'livraison-locale', label: 'Livraison locale' },
  ],
  commandes: [],
}

function StatusBadge({ status }) {
  const cls = status === 'reservee' || status === 'preparation'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : status === 'convertie_caisse'
      ? 'border-sky-200 bg-sky-50 text-sky-800'
      : status === 'annulee'
        ? 'border-slate-200 bg-slate-50 text-slate-600'
        : 'border-amber-200 bg-amber-50 text-amber-900'
  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${cls}`}>{status}</span>
}

export default function CommandesPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Tous')
  const [clientKey, setClientKey] = useState('')
  const [modeRetrait, setModeRetrait] = useState('retrait-ferme')
  const [dateRetrait, setDateRetrait] = useState('')
  const [cart, setCart] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('card')

  const { data, isError, isFetching } = useQuery('commandes-portail', fetchPortal, { staleTime: 15000 })
  const portal = data || fallbackData
  const products = useMemo(() => portal.catalogue || [], [portal.catalogue])
  const clients = useMemo(() => portal.clients || [], [portal.clients])
  const selectedClient = clients.find((client) => String(client.id) === clientKey) || clients[0]
  const categories = useMemo(() => ['Tous', ...Array.from(new Set(products.map((product) => product.famille || product.categorie || 'Produit'))).sort()], [products])
  const recentOrders = portal.commandes || []

  const createMutation = useMutation(createOrder, {
    onSuccess: (result) => {
      setLastResult(result)
      setCart([])
      queryClient.invalidateQueries('commandes-portail')
    },
  })
  const convertMutation = useMutation(convertOrder, {
    onSuccess: (result) => {
      setLastResult(result)
      queryClient.invalidateQueries('commandes-portail')
      queryClient.invalidateQueries('pilotage-caisse')
      queryClient.invalidateQueries('comptabilite-vue')
    },
  })
  const cancelMutation = useMutation(cancelOrder, {
    onSuccess: (result) => {
      setLastResult(result)
      queryClient.invalidateQueries('commandes-portail')
    },
  })

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return products.filter((product) => {
      const category = product.famille || product.categorie || 'Produit'
      const matchCategory = categoryFilter === 'Tous' || category === categoryFilter
      const matchSearch = !needle || `${product.nom} ${category} ${product.code}`.toLowerCase().includes(needle)
      return matchCategory && matchSearch
    })
  }, [categoryFilter, products, query])

  const addProduct = (product) => {
    setLastResult(null)
    setCart((current) => {
      const existing = current.find((line) => line.code === product.code)
      if (existing) {
        return current.map((line) => (
          line.code === product.code
            ? { ...line, quantite: Math.min(line.quantite + 1, product.stock_disponible || 0) }
            : line
        ))
      }
      return [...current, {
        code: product.code,
        nom: product.nom,
        famille: product.famille || product.categorie,
        prix: product.prix || product.price,
        unite: product.unite || product.unit,
        lot: product.lot_courant || product.lot,
        tva: product.tva || product.tax || 5.5,
        stock_disponible: product.stock_disponible || 0,
        quantite: 1,
      }]
    })
  }

  const updateQuantity = (code, delta) => {
    setCart((current) => current
      .map((line) => (
        line.code === code
          ? { ...line, quantite: Math.max(0, Math.min(line.quantite + delta, line.stock_disponible || line.quantite)) }
          : line
      ))
      .filter((line) => line.quantite > 0))
  }

  const totals = useMemo(() => {
    const discount = Number(selectedClient?.remise_reference || 0)
    const subtotal = cart.reduce((sum, line) => sum + line.prix * line.quantite, 0)
    const discountAmount = subtotal * discount / 100
    const total = Math.max(subtotal - discountAmount, 0)
    const reservedUnits = cart.reduce((sum, line) => sum + line.quantite, 0)
    return { discount, subtotal, discountAmount, total, reservedUnits }
  }, [cart, selectedClient])

  const submitOrder = () => {
    if (!selectedClient || !cart.length) return
    createMutation.mutate({
      client_id: selectedClient.id,
      client_nom: selectedClient.nom,
      segment: selectedClient.segment,
      canal: selectedClient.canal,
      mode_retrait: modeRetrait,
      date_retrait: dateRetrait || null,
      remise_percent: totals.discount,
      lignes: cart.map((line) => ({ code: line.code, quantite: line.quantite })),
    })
  }

  return (
    <Layout>
      <Head>
        <title>Commandes - FarmFlow</title>
        <meta name="description" content="Portail commandes FarmFlow avec reservation stock, clients et conversion caisse." />
      </Head>

      <section className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 p-5 xl:grid-cols-[1fr_0.42fr] xl:items-center">
          <div>
            <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold uppercase text-emerald-800">
              Portail commandes
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-950">Commandes clients & reservations</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Catalogue reservable, prix par client, retrait ferme, livraison locale, stock engage et conversion caisse.
            </p>
            {isError && <p className="mt-3 text-sm text-amber-700">API commandes indisponible, affichage de secours.</p>}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-emerald-300">Stock engage</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(totals.total)}</p>
              </div>
              <FiPackage className="h-6 w-6 text-emerald-200" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md bg-white/10 p-3">
                <p className="text-white/60">Lignes</p>
                <p className="font-semibold">{cart.length}</p>
              </div>
              <div className="rounded-md bg-white/10 p-3">
                <p className="text-white/60">Unites</p>
                <p className="font-semibold">{formatNumber(totals.reservedUnits, 2)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-3 md:grid-cols-4">
        {portal.kpis.map((item, index) => (
          <article key={item.label} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className={['h-1 bg-emerald-600', 'h-1 bg-sky-600', 'h-1 bg-amber-500', 'h-1 bg-slate-700'][index % 4]} />
            <div className="p-4">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {item.label.toLowerCase().includes('montant') ? formatCurrency(item.value) : formatNumber(item.value)}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[270px_minmax(0,1fr)_390px]">
        <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-950">
              <FiUsers className="h-4 w-4 text-emerald-700" />
              Client
            </div>
            <select value={clientKey || String(selectedClient?.id || '')} onChange={(event) => setClientKey(event.target.value)} className="input">
              {clients.map((client) => <option key={client.id} value={client.id}>{client.nom}</option>)}
            </select>
            {selectedClient && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-950">{selectedClient.segment}</p>
                <p>{selectedClient.canal}</p>
                <p>Remise {selectedClient.remise_reference || 0}%</p>
              </div>
            )}
          </div>

          <div>
            <label className="label">Mode</label>
            <select value={modeRetrait} onChange={(event) => setModeRetrait(event.target.value)} className="input">
              {(portal.modes_retrait || fallbackData.modes_retrait).map((mode) => <option key={mode.code} value={mode.code}>{mode.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date retrait</label>
            <input type="date" value={dateRetrait} onChange={(event) => setDateRetrait(event.target.value)} className="input" />
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <p className="font-semibold">Flux connecte</p>
            <p className="mt-1">Commande {'>'} reservation {'>'} preparation {'>'} caisse {'>'} stock.</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <label className="relative">
                <span className="sr-only">Recherche produit</span>
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="input pl-10" placeholder="Rechercher produit, lot ou famille" />
              </label>
              <span className="text-sm font-medium text-slate-500">{isFetching ? 'Actualisation...' : `${filteredProducts.length} produits`}</span>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold ${categoryFilter === category ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.map((product) => {
              const available = product.stock_disponible || 0
              const disabled = available <= 0
              return (
                <button
                  key={product.code}
                  type="button"
                  disabled={disabled}
                  onClick={() => addProduct(product)}
                  className="group min-h-[178px] rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{product.famille || product.categorie}</span>
                    <span className="text-base font-semibold text-slate-950">{formatCurrency(product.prix || product.price)}</span>
                  </div>
                  <p className="mt-4 text-base font-semibold leading-tight text-slate-950">{product.nom}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <span className="rounded-md bg-slate-50 p-2 text-slate-600">Stock {formatNumber(product.stock_physique, 2)}</span>
                    <span className="rounded-md bg-amber-50 p-2 text-amber-800">Reserve {formatNumber(product.stock_reserve, 2)}</span>
                    <span className="rounded-md bg-emerald-50 p-2 text-emerald-800">Dispo {formatNumber(available, 2)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>{product.lot_courant || product.lot || 'lot a definir'}</span>
                    <span className="rounded-full bg-white px-2 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200 group-hover:bg-emerald-100">
                      {disabled ? 'Rupture' : 'Reserver'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm xl:sticky xl:top-20">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <FiShoppingCart className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-semibold text-slate-950">Panier reservation</h2>
              </div>
              <button onClick={() => setCart([])} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Vider">
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[330px] space-y-3 overflow-y-auto p-4">
              {!cart.length ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Selectionne des produits reservables.
                </div>
              ) : cart.map((line) => (
                <div key={line.code} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{line.nom}</p>
                      <p className="text-xs text-slate-500">{line.lot} - dispo {formatNumber(line.stock_disponible, 2)}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">{formatCurrency(line.prix * line.quantite)}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => updateQuantity(line.code, -1)} className="rounded-md border border-slate-200 p-2 hover:bg-slate-50">
                      <FiMinus className="h-3 w-3" />
                    </button>
                    <span className="w-12 text-center text-sm font-semibold">{formatNumber(line.quantite, 2)}</span>
                    <button onClick={() => updateQuantity(line.code, 1)} className="rounded-md border border-slate-200 p-2 hover:bg-slate-50">
                      <FiPlus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Sous-total</span><span>{formatCurrency(totals.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Remise client</span><span>-{formatCurrency(totals.discountAmount)}</span></div>
                <div className="mt-3 flex justify-between rounded-lg bg-slate-950 px-4 py-4 text-xl font-semibold text-white">
                  <span>Total reserve</span><span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
              <button
                onClick={submitOrder}
                disabled={!selectedClient || !cart.length || createMutation.isLoading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FiCheckCircle className="h-4 w-4" />
                {createMutation.isLoading ? 'Reservation...' : 'Reserver la commande'}
              </button>
              {createMutation.isError && <p className="mt-3 text-sm text-red-700">{createMutation.error?.response?.data?.detail || 'Reservation refusee.'}</p>}
            </div>
          </section>

          {lastResult && (
            <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <FiCheckCircle className="h-4 w-4" />
                {lastResult.statut}
              </div>
              <p className="mt-1">{lastResult.commande?.reference || lastResult.ticket?.reference}</p>
            </section>
          )}
        </aside>
      </section>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Commandes recentes</h2>
            <p className="text-sm text-slate-500">Reservations, preparation, annulation et conversion caisse.</p>
          </div>
          <button onClick={() => queryClient.invalidateQueries('commandes-portail')} className="btn btn-outline gap-2 self-start sm:self-auto">
            <FiRefreshCcw className="h-4 w-4" />
            Actualiser
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Retrait</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {recentOrders.map((order) => (
                <tr key={order.reference} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-950">{order.reference}</td>
                  <td className="px-4 py-3 text-slate-700">{order.client}</td>
                  <td className="px-4 py-3 text-slate-700">{order.mode_retrait}</td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(order.total_ttc)}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.statut} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={!['reservee', 'preparation', 'confirmee'].includes(order.statut) || convertMutation.isLoading}
                        onClick={() => convertMutation.mutate({ reference: order.reference, moyen_paiement: paymentMethod })}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 disabled:opacity-40"
                      >
                        <FiCreditCard className="h-3 w-3" />
                        Caisse
                      </button>
                      <button
                        disabled={!['reservee', 'preparation', 'confirmee'].includes(order.statut) || cancelMutation.isLoading}
                        onClick={() => cancelMutation.mutate(order.reference)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 disabled:opacity-40"
                      >
                        <FiAlertTriangle className="h-3 w-3" />
                        Annuler
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!recentOrders.length && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">Aucune commande.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <FiTruck className="h-4 w-4 text-emerald-700" />
          <span>Paiement conversion caisse</span>
          {['card', 'cash', 'transfer'].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`rounded-md border px-2 py-1 font-semibold ${paymentMethod === method ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
            >
              {method}
            </button>
          ))}
        </div>
      </section>
    </Layout>
  )
}
