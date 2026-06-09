import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import axios from 'axios'
import {
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiMinus,
  FiPlus,
  FiPrinter,
  FiRefreshCcw,
  FiSearch,
  FiShoppingCart,
  FiTrash2,
} from 'react-icons/fi'
import Layout from '../components/Layout'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const fallbackProducts = [
  { id: 'panier-legumes', name: 'Panier legumes', category: 'Maraichage', price: 22, tax: 5.5, stock: 42, unit: 'piece' },
  { id: 'oeufs-x12', name: 'Oeufs plein air x12', category: 'Elevage', price: 4.8, tax: 5.5, stock: 68, unit: 'boite' },
  { id: 'farine-1kg', name: 'Farine ferme 1kg', category: 'Transformation', price: 3.4, tax: 5.5, stock: 35, unit: 'sac' },
  { id: 'colis-boeuf', name: 'Colis boeuf 5kg', category: 'Elevage', price: 78, tax: 5.5, stock: 9, unit: 'colis' },
]

const fallbackSession = {
  statut: 'ouverte',
  journal: 'Boutique ferme',
  fond_initial: 250,
  tickets: 38,
  ca_jour: 1284,
  panier_moyen: 33.8,
  ecart_caisse: 0,
}

const methodIcons = {
  card: FiCreditCard,
  cash: FiDollarSign,
  transfer: FiRefreshCcw,
}

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0)

const normalizeProduct = (product) => ({
  id: product.code || product.id,
  name: product.nom || product.name,
  category: product.categorie || product.category || 'Produit',
  price: product.prix ?? product.price,
  tax: product.tva ?? product.tax ?? 5.5,
  stock: product.stock ?? 0,
  unit: product.unite || product.unit || 'unite',
})

const fetchCaisse = async () => {
  const response = await axios.get(`${API_URL}/pilotage/caisse`)
  return response.data
}

const createTicket = async (payload) => {
  const response = await axios.post(`${API_URL}/pilotage/caisse/tickets`, payload)
  return response.data
}

const closeSession = async (payload) => {
  const response = await axios.post(`${API_URL}/pilotage/caisse/cloturer`, payload)
  return response.data
}

export default function CaissePage() {
  const [cart, setCart] = useState([])
  const [query, setQuery] = useState('')
  const [customer, setCustomer] = useState('Client comptoir')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [lastTicket, setLastTicket] = useState(null)
  const [closeResult, setCloseResult] = useState(null)

  const { data, isError } = useQuery('pilotage-caisse', fetchCaisse, {
    staleTime: 30000,
  })

  const ticketMutation = useMutation(createTicket, {
    onSuccess: (ticket) => {
      setLastTicket(ticket)
      setCart([])
    },
  })

  const closeMutation = useMutation(closeSession, {
    onSuccess: (result) => setCloseResult(result),
  })

  const products = useMemo(() => (data?.produits_exemple || fallbackProducts).map(normalizeProduct), [data])
  const session = data?.session || fallbackSession
  const customers = data?.clients || ['Client comptoir', 'Restaurant Les Tilleuls', 'AMAP village', 'Client pro facture']
  const paymentMethods = data?.moyens_paiement || [
    { code: 'card', label: 'TPE' },
    { code: 'cash', label: 'Especes' },
    { code: 'transfer', label: 'Virement' },
  ]

  const sessions = [
    { label: 'Tickets', value: session.tickets },
    { label: 'CA jour', value: formatCurrency(session.ca_jour) },
    { label: 'Panier moy.', value: formatCurrency(session.panier_moyen) },
    { label: 'Ecart caisse', value: formatCurrency(session.ecart_caisse) },
  ]

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return products
    return products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(search))
  }, [products, query])

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0)
    const discountAmount = subtotal * (discount / 100)
    const taxable = Math.max(subtotal - discountAmount, 0)
    const tax = cart.reduce((sum, line) => {
      const lineTotal = line.price * line.quantity
      const lineDiscount = subtotal ? lineTotal * (discount / 100) : 0
      return sum + ((lineTotal - lineDiscount) * line.tax) / (100 + line.tax)
    }, 0)

    return {
      subtotal,
      discountAmount,
      tax,
      total: taxable,
      marginSignal: lastTicket?.totaux?.marge ?? taxable * 0.42,
    }
  }, [cart, discount, lastTicket])

  const addProduct = (product) => {
    setLastTicket(null)
    setCart((current) => {
      const existing = current.find((line) => line.id === product.id)
      if (existing) {
        return current.map((line) => (line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line))
      }
      return [...current, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id, delta) => {
    setCart((current) => current
      .map((line) => (line.id === id ? { ...line, quantity: Math.max(line.quantity + delta, 0) } : line))
      .filter((line) => line.quantity > 0))
  }

  const clearCart = () => {
    setCart([])
    setLastTicket(null)
  }

  const submitTicket = () => {
    ticketMutation.mutate({
      client: customer,
      moyen_paiement: paymentMethod,
      remise_percent: discount,
      lignes: cart.map((line) => ({
        code: line.id,
        nom: line.name,
        quantite: line.quantity,
        prix_unitaire: line.price,
        tva: line.tax,
      })),
    })
  }

  const submitClose = () => {
    closeMutation.mutate({
      fond_reel: session.fond_initial + session.ca_jour,
      commentaire: 'Cloture lancee depuis la caisse',
    })
  }

  return (
    <Layout>
      <Head>
        <title>Caisse - FarmFlow</title>
        <meta name="description" content="Caisse agricole FarmFlow avec panier, TPE, ventes directes et cloture." />
      </Head>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1fr_0.38fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-700">Point de vente ferme</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">Caisse directe</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Vente boutique, marche, paniers, colis, paiement TPE, sortie de stock, ticket et cloture de journee.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {sessions.map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          {isError && <p className="mt-4 text-sm text-amber-700">Mode local actif : donnees de secours chargees.</p>}
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-900">Session {session.statut}</p>
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            {session.journal} - fond initial {formatCurrency(session.fond_initial)}.
          </p>
          <button
            onClick={submitClose}
            disabled={closeMutation.isLoading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:bg-emerald-300"
          >
            <FiPrinter className="h-4 w-4" />
            {closeMutation.isLoading ? 'Cloture...' : 'Cloturer la session'}
          </button>
          {closeResult && <p className="mt-3 text-xs font-medium text-emerald-900">Cloture preparee, ecart {formatCurrency(closeResult.ecart)}.</p>}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <label className="relative">
                <span className="sr-only">Recherche produit</span>
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="input pl-10"
                  placeholder="Scanner ou rechercher un produit"
                />
              </label>
              <select value={customer} onChange={(event) => setCustomer(event.target.value)} className="input">
                {customers.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product)}
                className="min-h-[150px] rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{product.category}</span>
                  <span className="text-sm font-semibold text-slate-950">{formatCurrency(product.price)}</span>
                </div>
                <p className="mt-4 text-base font-semibold leading-tight text-slate-950">{product.name}</p>
                <p className="mt-2 text-xs text-slate-500">{product.stock} {product.unit}s en stock</p>
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <FiShoppingCart className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-semibold text-slate-950">Panier</h2>
            </div>
            <button onClick={clearCart} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Vider">
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto p-4">
            {lastTicket && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <div className="flex items-center gap-2 font-semibold">
                  <FiCheckCircle className="h-4 w-4" />
                  Ticket valide
                </div>
                <p className="mt-1">{lastTicket.ticket_id} - {formatCurrency(lastTicket.totaux.total)}</p>
              </div>
            )}
            {cart.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Ajoute un produit pour commencer un ticket.
              </div>
            ) : cart.map((line) => (
              <div key={line.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{line.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(line.price)} - TVA {line.tax}%</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-950">{formatCurrency(line.price * line.quantity)}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => updateQuantity(line.id, -1)} className="rounded-md border border-slate-200 p-2 hover:bg-slate-50">
                    <FiMinus className="h-3 w-3" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{line.quantity}</span>
                  <button onClick={() => updateQuantity(line.id, 1)} className="rounded-md border border-slate-200 p-2 hover:bg-slate-50">
                    <FiPlus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 p-4">
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Remise globale (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(event) => setDiscount(Number(event.target.value))}
                className="input"
              />
            </label>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Sous-total</span><span>{formatCurrency(totals.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Remise</span><span>-{formatCurrency(totals.discountAmount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">TVA incluse</span><span>{formatCurrency(totals.tax)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Signal marge</span><span>{formatCurrency(totals.marginSignal)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-semibold text-slate-950">
                <span>Total</span><span>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => {
                const Icon = methodIcons[method.code] || FiCreditCard
                const active = paymentMethod === method.code
                return (
                  <button
                    key={method.code}
                    onClick={() => setPaymentMethod(method.code)}
                    className={`rounded-lg border px-2 py-3 text-sm font-medium ${active ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Icon className="mx-auto mb-1 h-4 w-4" />
                    {method.label}
                  </button>
                )
              })}
            </div>

            <button
              onClick={submitTicket}
              disabled={!cart.length || ticketMutation.isLoading}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {ticketMutation.isLoading ? 'Encaissement...' : `Encaisser ${formatCurrency(totals.total)}`}
            </button>
            {ticketMutation.isError && <p className="mt-3 text-sm text-red-700">Encaissement refuse, verifie le panier.</p>}
          </div>
        </aside>
      </section>
    </Layout>
  )
}
