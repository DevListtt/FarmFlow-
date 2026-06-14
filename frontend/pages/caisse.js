import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import axios from 'axios'
import {
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiMinus,
  FiMove,
  FiPlus,
  FiPrinter,
  FiRefreshCcw,
  FiSearch,
  FiShoppingCart,
  FiSliders,
  FiTrash2,
  FiUserPlus,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import Layout from '../components/Layout'
import { moveIdBefore } from '../lib/useStoredOrder'

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

const fallbackCustomers = [
  { id: null, code: 'client-comptoir', nom: 'Client comptoir', segment: 'circuit-court', canal: 'boutique ferme', email: '', telephone: '', remise_reference: 0, delai_paiement: 0 },
  { id: null, code: 'restaurant-tilleuls', nom: 'Restaurant Les Tilleuls', segment: 'pro', canal: 'restaurant', email: '', telephone: '', remise_reference: 8, delai_paiement: 15 },
  { id: null, code: 'amap-village', nom: 'AMAP village', segment: 'circuit-court', canal: 'AMAP', email: '', telephone: '', remise_reference: 3, delai_paiement: 0 },
  { id: null, code: 'cantine-centrale', nom: 'Cantine centrale', segment: 'collectivite', canal: 'collectivite', email: '', telephone: '', remise_reference: 12, delai_paiement: 30 },
]

const emptyCustomerForm = {
  nom: '',
  segment: 'circuit-court',
  canal: 'boutique ferme',
  email: '',
  telephone: '',
  delai_paiement: 0,
  remise_reference: 0,
  volume_annuel: 0,
}

const methodIcons = {
  card: FiCreditCard,
  cash: FiDollarSign,
  transfer: FiRefreshCcw,
}

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0)

const setReorderPayload = (event, id) => {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/x-farmflow-order', id)
  event.dataTransfer.setData('text/plain', id)
}

const getReorderPayload = (event) => event.dataTransfer.getData('application/x-farmflow-order') || event.dataTransfer.getData('text/plain')

const reorderLines = (lines, sourceId, targetId) => {
  const order = moveIdBefore(lines.map((line) => line.id), sourceId, targetId)
  return order.map((id) => lines.find((line) => line.id === id)).filter(Boolean)
}

const normalizeProduct = (product) => ({
  id: product.code || product.id,
  name: product.nom || product.name,
  category: product.categorie || product.category || 'Produit',
  price: product.prix ?? product.price,
  tax: product.tva ?? product.tax ?? 5.5,
  stock: product.stock ?? 0,
  unit: product.unite || product.unit || 'unite',
})

const normalizeCustomer = (customer) => {
  if (typeof customer === 'string') {
    const code = customer.toLowerCase().replaceAll(' ', '-')
    return { id: null, code, nom: customer, segment: 'circuit-court', canal: 'boutique ferme', email: '', telephone: '', remise_reference: 0, delai_paiement: 0 }
  }
  return {
    id: customer.id ?? null,
    code: customer.code || String(customer.id || customer.nom).toLowerCase().replaceAll(' ', '-'),
    nom: customer.nom || customer.name || customer.client || 'Client comptoir',
    segment: customer.segment || 'circuit-court',
    canal: customer.canal || 'boutique ferme',
    email: customer.email || '',
    telephone: customer.telephone || '',
    remise_reference: customer.remise_reference || 0,
    delai_paiement: customer.delai_paiement || 0,
    volume_annuel: customer.volume_annuel || 0,
  }
}

const customerKey = (customer) => (customer?.id ? `id:${customer.id}` : `code:${customer?.code || customer?.nom}`)

const fetchCaisse = async () => {
  const response = await axios.get(`${API_URL}/pilotage/caisse`)
  return response.data
}

const createCustomer = async (payload) => {
  const response = await axios.post(`${API_URL}/pilotage/caisse/clients`, payload)
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

const scanPos = async (payload) => {
  const response = await axios.post(`${API_URL}/noyau/iot/scan-pos`, payload)
  return response.data
}

const sendWeighing = async (payload) => {
  const response = await axios.post(`${API_URL}/noyau/iot/pesee`, payload)
  return response.data
}

export default function CaissePage() {
  const [cart, setCart] = useState([])
  const [selectedLineId, setSelectedLineId] = useState(null)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Tous')
  const [customer, setCustomer] = useState('')
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [keypadMode, setKeypadMode] = useState('quantity')
  const [keypadValue, setKeypadValue] = useState('')
  const [cashReceived, setCashReceived] = useState(0)
  const [lastTicket, setLastTicket] = useState(null)
  const [closeResult, setCloseResult] = useState(null)
  const [scanCode, setScanCode] = useState('FF-PANIER-001')
  const [scanQuantity, setScanQuantity] = useState(1)
  const [scaleProduct, setScaleProduct] = useState('colis-boeuf')
  const [scaleGross, setScaleGross] = useState(5.25)
  const [scaleTare, setScaleTare] = useState(0.15)
  const [iotResult, setIotResult] = useState(null)

  const { data, isError, refetch } = useQuery('pilotage-caisse', fetchCaisse, {
    staleTime: 30000,
  })

  const ticketMutation = useMutation(createTicket, {
    onSuccess: (ticket) => {
      setLastTicket(ticket)
      setCart([])
      setSelectedLineId(null)
      setCashReceived(0)
      setKeypadValue('')
    },
  })

  const closeMutation = useMutation(closeSession, {
    onSuccess: (result) => setCloseResult(result),
  })

  const customerMutation = useMutation(createCustomer, {
    onSuccess: async (result) => {
      await refetch()
      const created = normalizeCustomer(result.client)
      setCustomer(customerKey(created))
      setDiscount(Number(created.remise_reference || 0))
      setCustomerForm(emptyCustomerForm)
      setShowCustomerForm(false)
    },
  })

  const addTicketLine = (ticketLine, product = {}, options = {}) => {
    setLastTicket(null)
    const quantity = Number(ticketLine.quantite || 1)
    const line = {
      id: options.id || ticketLine.code,
      name: ticketLine.nom,
      category: product.famille || product.categorie || product.category || 'Produit',
      price: Number(ticketLine.prix_unitaire || 0),
      tax: Number(ticketLine.tva || product.tva || 5.5),
      stock: product.stock ?? 0,
      unit: product.unite || product.unit || 'unite',
      quantity,
      source: options.source,
      lot: options.lot,
    }
    setSelectedLineId(line.id)

    setCart((current) => {
      const existing = current.find((item) => item.id === line.id)
      if (existing && !options.forceNewLine) {
        return current.map((item) => (item.id === line.id ? { ...item, quantity: item.quantity + quantity } : item))
      }
      return [...current, line]
    })
  }

  const scanMutation = useMutation(scanPos, {
    onSuccess: (result) => {
      setIotResult({ type: 'scan', payload: result })
      addTicketLine(result.ligne_panier, result.produit, {
        source: 'scanner',
        lot: result.tracabilite?.lot,
      })
    },
  })

  const weighingMutation = useMutation(sendWeighing, {
    onSuccess: (result) => {
      setIotResult({ type: 'balance', payload: result })
      addTicketLine(result.ligne_panier, result.produit, {
        source: 'balance',
        lot: result.mouvement_stock?.lot,
        forceNewLine: true,
        id: `${result.ligne_panier.code}-${result.pesee_id}`,
      })
    },
  })

  const products = useMemo(() => (data?.produits_exemple || fallbackProducts).map(normalizeProduct), [data])
  const session = data?.session || fallbackSession
  const customers = useMemo(() => (data?.clients || fallbackCustomers).map(normalizeCustomer), [data])
  const selectedCustomer = customers.find((item) => customerKey(item) === customer) || customers[0] || fallbackCustomers[0]
  const paymentMethods = data?.moyens_paiement || [
    { code: 'card', label: 'TPE' },
    { code: 'cash', label: 'Especes' },
    { code: 'transfer', label: 'Virement' },
  ]
  const scanOptions = [
    { code: 'FF-PANIER-001', label: 'Panier legumes' },
    { code: 'FF-OEUFS-012', label: 'Oeufs x12' },
    { code: 'FF-FARINE-1K', label: 'Farine 1kg' },
    { code: 'FF-BOEUF-KG', label: 'Colis boeuf' },
    { code: 'FF-POMMES-KG', label: 'Pommes au kg' },
  ]
  const scaleOptions = [
    { code: 'colis-boeuf', label: 'Colis boeuf' },
    { code: 'pommes-kg', label: 'Pommes' },
  ]

  const sessions = [
    { label: 'Tickets', value: session.tickets },
    { label: 'CA jour', value: formatCurrency(session.ca_jour) },
    { label: 'Panier moy.', value: formatCurrency(session.panier_moyen) },
    { label: 'Ecart caisse', value: formatCurrency(session.ecart_caisse) },
  ]

  const categories = useMemo(() => ['Tous', ...Array.from(new Set(products.map((product) => product.category))).sort()], [products])

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase()
    return products.filter((product) => {
      const matchSearch = !search || `${product.name} ${product.category}`.toLowerCase().includes(search)
      const matchCategory = categoryFilter === 'Tous' || product.category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [categoryFilter, products, query])

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
  const selectedLine = cart.find((line) => line.id === selectedLineId) || cart[cart.length - 1] || null
  const changeDue = Math.max(Number(cashReceived || 0) - totals.total, 0)

  const keypadModes = [
    { code: 'quantity', label: 'Qte' },
    { code: 'discount', label: 'Remise' },
    { code: 'cash', label: 'Especes' },
  ]

  const pushKeypad = (key) => {
    setKeypadValue((current) => {
      if (key === '.' && current.includes('.')) return current
      if (key === '00' && !current) return '0'
      if (current === '0' && key !== '.') return key
      return `${current}${key}`
    })
  }

  const applyKeypad = () => {
    const value = Number(keypadValue || 0)
    if (keypadMode === 'quantity' && selectedLine) {
      setLineQuantity(selectedLine.id, value)
    }
    if (keypadMode === 'discount') {
      setDiscount(Math.max(0, Math.min(value, 100)))
    }
    if (keypadMode === 'cash') {
      setPaymentMethod('cash')
      setCashReceived(value)
    }
    setKeypadValue('')
  }

  const addProduct = (product) => {
    setLastTicket(null)
    setSelectedLineId(product.id)
    setCart((current) => {
      const existing = current.find((line) => line.id === product.id)
      if (existing) {
        return current.map((line) => (line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line))
      }
      return [...current, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id, delta) => {
    setSelectedLineId(id)
    setCart((current) => current
      .map((line) => (line.id === id ? { ...line, quantity: Math.max(line.quantity + delta, 0) } : line))
      .filter((line) => line.quantity > 0))
  }

  const setLineQuantity = (id, quantity) => {
    setSelectedLineId(id)
    setCart((current) => current
      .map((line) => (line.id === id ? { ...line, quantity: Math.max(Number(quantity || 0), 0) } : line))
      .filter((line) => line.quantity > 0))
  }

  const reorderCartLine = (sourceId, targetId) => {
    setCart((current) => reorderLines(current, sourceId, targetId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedLineId(null)
    setCashReceived(0)
    setLastTicket(null)
  }

  const submitTicket = () => {
    ticketMutation.mutate({
      client_id: selectedCustomer?.id || null,
      client: selectedCustomer?.nom || 'Client comptoir',
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

  const selectCustomer = (key) => {
    setCustomer(key)
    const nextCustomer = customers.find((item) => customerKey(item) === key)
    setDiscount(Number(nextCustomer?.remise_reference || 0))
  }

  const submitCustomer = (event) => {
    event.preventDefault()
    customerMutation.mutate({
      ...customerForm,
      delai_paiement: Number(customerForm.delai_paiement || 0),
      remise_reference: Number(customerForm.remise_reference || 0),
      volume_annuel: Number(customerForm.volume_annuel || 0),
    })
  }

  return (
    <Layout>
      <Head>
        <title>Caisse - FarmFlow</title>
        <meta name="description" content="Caisse agricole FarmFlow avec panier, TPE, ventes directes et cloture." />
      </Head>

      <section className="mb-5 grid gap-4 xl:grid-cols-[1fr_0.38fr]">
        <div className="command-panel p-5 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-100">Point de vente ferme</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Caisse directe</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Vente boutique, marche, paniers, colis, paiement TPE, sortie de stock, ticket et cloture de journee.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {sessions.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
                  <p className="text-xs text-slate-300">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          {isError && <p className="mt-4 text-sm text-amber-100">Mode local actif : donnees de secours chargees.</p>}
        </div>

        <div className="surface p-5">
          <p className="text-sm font-semibold text-emerald-900">Session {session.statut}</p>
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            {session.journal} - fond initial {formatCurrency(session.fond_initial)}.
          </p>
          <button
            onClick={submitClose}
            disabled={closeMutation.isLoading}
            className="touch-button mt-4 inline-flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-300"
          >
            <FiPrinter className="h-4 w-4" />
            {closeMutation.isLoading ? 'Cloture...' : 'Cloturer la session'}
          </button>
          {closeResult && <p className="mt-3 text-xs font-medium text-emerald-900">Cloture preparee, ecart {formatCurrency(closeResult.ecart)}.</p>}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="min-w-0 space-y-4">
          <div className="surface p-4">
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
              <div className="grid gap-2 sm:grid-cols-[1fr_46px]">
                <select value={customer || customerKey(selectedCustomer)} onChange={(event) => selectCustomer(event.target.value)} className="input">
                  {customers.map((item) => <option key={customerKey(item)} value={customerKey(item)}>{item.nom}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCustomerForm((value) => !value)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Creer client"
                >
                  <FiUserPlus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold transition ${categoryFilter === category ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="surface-muted mt-3 p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <FiUsers className="h-4 w-4 text-emerald-700" />
                <span className="font-semibold text-slate-950">{selectedCustomer?.nom}</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">{selectedCustomer?.segment}</span>
                <span>{selectedCustomer?.canal}</span>
                {selectedCustomer?.remise_reference ? <span>Remise ref. {selectedCustomer.remise_reference}%</span> : null}
              </div>
            </div>
            {showCustomerForm && (
              <form onSubmit={submitCustomer} className="surface-muted mt-3 p-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <input value={customerForm.nom} onChange={(event) => setCustomerForm({ ...customerForm, nom: event.target.value })} className="input md:col-span-2" placeholder="Nom client" required />
                  <select value={customerForm.segment} onChange={(event) => setCustomerForm({ ...customerForm, segment: event.target.value })} className="input">
                    <option value="circuit-court">Circuit court</option>
                    <option value="pro">Professionnel</option>
                    <option value="collectivite">Collectivite</option>
                  </select>
                  <input value={customerForm.canal} onChange={(event) => setCustomerForm({ ...customerForm, canal: event.target.value })} className="input" placeholder="Canal" />
                  <input value={customerForm.email} onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })} className="input" placeholder="Email" />
                  <input value={customerForm.telephone} onChange={(event) => setCustomerForm({ ...customerForm, telephone: event.target.value })} className="input" placeholder="Telephone" />
                  <input type="number" value={customerForm.delai_paiement} onChange={(event) => setCustomerForm({ ...customerForm, delai_paiement: event.target.value })} className="input" placeholder="Delai paiement" />
                  <input type="number" step="0.1" value={customerForm.remise_reference} onChange={(event) => setCustomerForm({ ...customerForm, remise_reference: event.target.value })} className="input" placeholder="Remise" />
                  <input type="number" step="0.01" value={customerForm.volume_annuel} onChange={(event) => setCustomerForm({ ...customerForm, volume_annuel: event.target.value })} className="input" placeholder="Volume annuel" />
                </div>
                <button disabled={customerMutation.isLoading} className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-emerald-300">
                  <FiUserPlus className="h-4 w-4" />
                  {customerMutation.isLoading ? 'Creation...' : 'Creer le client'}
                </button>
              </form>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-emerald-700">IoT caisse</p>
                  <h2 className="text-base font-semibold text-slate-950">Scan POS</h2>
                </div>
                <FiZap className="h-5 w-5 text-slate-400" />
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_100px]">
                <select value={scanCode} onChange={(event) => setScanCode(event.target.value)} className="input">
                  {scanOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
                </select>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={scanQuantity}
                  onChange={(event) => setScanQuantity(Number(event.target.value))}
                  className="input"
                />
              </div>
              <button
                type="button"
                onClick={() => scanMutation.mutate({ code_barres: scanCode, quantite: Number(scanQuantity), client_segment: selectedCustomer?.segment || 'circuit-court' })}
                disabled={scanMutation.isLoading}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-300"
              >
                <FiShoppingCart className="h-4 w-4" />
                {scanMutation.isLoading ? 'Scan...' : 'Ajouter au panier'}
              </button>
            </div>

            <div className="surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-emerald-700">Balance</p>
                  <h2 className="text-base font-semibold text-slate-950">Pesee produit</h2>
                </div>
                <FiSliders className="h-5 w-5 text-slate-400" />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <select value={scaleProduct} onChange={(event) => setScaleProduct(event.target.value)} className="input sm:col-span-3">
                  {scaleOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
                </select>
                <input type="number" min="0" step="0.01" value={scaleGross} onChange={(event) => setScaleGross(Number(event.target.value))} className="input" />
                <input type="number" min="0" step="0.01" value={scaleTare} onChange={(event) => setScaleTare(Number(event.target.value))} className="input" />
                <button
                  type="button"
                  onClick={() => weighingMutation.mutate({ produit: scaleProduct, poids_brut: Number(scaleGross), tare: Number(scaleTare), lot: 'LOT-VIA-2026-07', client_segment: selectedCustomer?.segment || 'circuit-court' })}
                  disabled={weighingMutation.isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:bg-emerald-300"
                >
                  <FiSliders className="h-4 w-4" />
                  {weighingMutation.isLoading ? '...' : 'OK'}
                </button>
              </div>
            </div>
          </div>

          {iotResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <FiCheckCircle className="h-4 w-4" />
                {iotResult.type === 'scan' ? 'Scan ajoute au panier' : 'Pesee ajoutee au panier'}
              </div>
              <p className="mt-1">
                {iotResult.payload.ligne_panier.nom} - {iotResult.type === 'balance' ? `${iotResult.payload.poids.net} kg - ` : ''}
                {formatCurrency(iotResult.payload.ligne_panier.total)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product)}
                className="group min-h-[168px] rounded-lg border border-slate-200 bg-white/95 p-4 text-left shadow-[0_14px_28px_-26px_rgba(15,23,42,0.65)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-[0_20px_38px_-28px_rgba(15,23,42,0.85)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{product.category}</span>
                  <span className="text-base font-semibold text-slate-950">{formatCurrency(product.price)}</span>
                </div>
                <p className="mt-4 text-base font-semibold leading-tight text-slate-950">{product.name}</p>
                <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>{product.stock} {product.unit}s</span>
                  <span className="rounded-full bg-white px-2 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200 group-hover:bg-emerald-100">Ajouter</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="surface min-w-0 overflow-hidden xl:sticky xl:top-20 xl:self-start">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 p-4 text-white">
            <div className="flex items-center gap-2">
              <FiShoppingCart className="h-5 w-5 text-emerald-300" />
              <div>
                <h2 className="text-lg font-semibold text-white">Panier</h2>
                <p className="text-xs text-slate-300">Ordre de preparation modulable</p>
              </div>
            </div>
            <button onClick={clearCart} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-red-200" title="Vider">
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
            ) : cart.map((line) => {
              const selected = selectedLine?.id === line.id
              return (
              <div
                key={line.id}
                onClick={() => setSelectedLineId(line.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  reorderCartLine(getReorderPayload(event), line.id)
                }}
                className={`cursor-pointer rounded-lg border p-3 transition ${selected ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    draggable
                    onClick={(event) => event.stopPropagation()}
                    onDragStart={(event) => {
                      event.stopPropagation()
                      setReorderPayload(event, line.id)
                    }}
                    className="mt-0.5 inline-flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 active:cursor-grabbing"
                    title="Reorganiser le panier"
                  >
                    <FiMove className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950">{line.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(line.price)} - TVA {line.tax}%</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-950">{formatCurrency(line.price * line.quantity)}</p>
                </div>
              <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={() => updateQuantity(line.id, -1)} className="touch-button min-h-9 rounded-md border border-slate-200 bg-white px-3 hover:bg-slate-50">
                    <FiMinus className="h-3 w-3" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{line.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(line.id, 1)} className="touch-button min-h-9 rounded-md border border-slate-200 bg-white px-3 hover:bg-slate-50">
                    <FiPlus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )})}
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
              <div className="mt-3 flex justify-between rounded-lg bg-slate-950 px-4 py-4 text-xl font-semibold text-white">
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
                    className={`touch-button border px-2 py-3 text-sm ${active ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Icon className="mx-auto mb-1 h-4 w-4" />
                    {method.label}
                  </button>
                )
              })}
            </div>

            <div data-testid="pos-keypad" className="surface-muted mt-4 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-emerald-700">Pave tactile</p>
                  <p className="text-sm font-medium text-slate-600">
                    {keypadMode === 'quantity' && (selectedLine ? `Ligne: ${selectedLine.name}` : 'Selectionner une ligne')}
                    {keypadMode === 'discount' && 'Remise globale'}
                    {keypadMode === 'cash' && 'Especes recues'}
                  </p>
                </div>
                <div className="min-w-[112px] rounded-lg bg-slate-950 px-3 py-2 text-right font-mono text-xl font-semibold text-white">
                  {keypadValue || '0'}
                </div>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2">
                {keypadModes.map((mode) => (
                  <button
                    key={mode.code}
                    type="button"
                    data-testid={`pos-keypad-mode-${mode.code}`}
                    onClick={() => {
                      setKeypadMode(mode.code)
                      setKeypadValue('')
                    }}
                    className={`touch-button min-h-11 border px-2 py-2 text-sm ${keypadMode === mode.code ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    data-testid={`pos-keypad-key-${key}`}
                    onClick={() => pushKeypad(key)}
                    className="touch-button h-14 border border-slate-200 bg-white text-xl text-slate-950 shadow-sm hover:bg-slate-100"
                  >
                    {key}
                  </button>
                ))}
                <button type="button" data-testid="pos-keypad-clear" onClick={() => setKeypadValue('')} className="touch-button h-12 border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-100">
                  C
                </button>
                <button type="button" data-testid="pos-keypad-backspace" onClick={() => setKeypadValue((current) => current.slice(0, -1))} className="touch-button h-12 border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-100">
                  Effacer
                </button>
                <button type="button" data-testid="pos-keypad-apply" onClick={applyKeypad} disabled={keypadMode === 'quantity' && !selectedLine} className="touch-button h-12 bg-slate-950 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                  OK
                </button>
              </div>

              {keypadMode === 'cash' && cashReceived > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-white p-2">
                    <p className="text-xs text-slate-500">Recu</p>
                    <p className="font-semibold text-slate-950">{formatCurrency(cashReceived)}</p>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <p className="text-xs text-slate-500">A rendre</p>
                    <p className="font-semibold text-emerald-800">{formatCurrency(changeDue)}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={submitTicket}
              disabled={!cart.length || ticketMutation.isLoading}
              className="touch-button mt-4 inline-flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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
