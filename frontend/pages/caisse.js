import Head from 'next/head'
import { useMemo, useState } from 'react'
import {
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

const products = [
  { id: 'panier-legumes', name: 'Panier legumes', category: 'Maraichage', price: 22, tax: 5.5, stock: 42, unit: 'piece' },
  { id: 'oeufs-x12', name: 'Oeufs plein air x12', category: 'Elevage', price: 4.8, tax: 5.5, stock: 68, unit: 'boite' },
  { id: 'farine-1kg', name: 'Farine ferme 1kg', category: 'Transformation', price: 3.4, tax: 5.5, stock: 35, unit: 'sac' },
  { id: 'colis-boeuf', name: 'Colis boeuf 5kg', category: 'Elevage', price: 78, tax: 5.5, stock: 9, unit: 'colis' },
  { id: 'jus-pomme', name: 'Jus de pomme 1L', category: 'Verger', price: 3.9, tax: 5.5, stock: 120, unit: 'bouteille' },
  { id: 'miel-500', name: 'Miel 500g', category: 'Ruche', price: 8.5, tax: 5.5, stock: 27, unit: 'pot' },
  { id: 'plants-tomate', name: 'Plants tomate', category: 'Plants', price: 2.2, tax: 10, stock: 180, unit: 'plant' },
  { id: 'foin-botte', name: 'Foin petite botte', category: 'Fourrage', price: 5.5, tax: 10, stock: 54, unit: 'botte' },
]

const paymentMethods = [
  { code: 'card', label: 'TPE', icon: FiCreditCard },
  { code: 'cash', label: 'Especes', icon: FiDollarSign },
  { code: 'transfer', label: 'Virement', icon: FiRefreshCcw },
]

const sessions = [
  { label: 'Tickets', value: 38 },
  { label: 'CA jour', value: '1 284 EUR' },
  { label: 'Panier moy.', value: '33,80 EUR' },
  { label: 'Ecart caisse', value: '0,00 EUR' },
]

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)

export default function CaissePage() {
  const [cart, setCart] = useState([])
  const [query, setQuery] = useState('')
  const [customer, setCustomer] = useState('Client comptoir')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('card')

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return products
    return products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(search))
  }, [query])

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
      marginSignal: taxable * 0.42,
    }
  }, [cart, discount])

  const addProduct = (product) => {
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

  const clearCart = () => setCart([])

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
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-900">Session ouverte</p>
          <p className="mt-2 text-sm leading-6 text-emerald-800">Journal boutique - caisse principale - fond initial 250 EUR.</p>
          <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900">
            <FiPrinter className="h-4 w-4" />
            Cloturer la session
          </button>
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
                <option>Client comptoir</option>
                <option>Restaurant Les Tilleuls</option>
                <option>AMAP village</option>
                <option>Client pro facture</option>
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
                const Icon = method.icon
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
              disabled={!cart.length}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Encaisser {formatCurrency(totals.total)}
            </button>
          </div>
        </aside>
      </section>
    </Layout>
  )
}
