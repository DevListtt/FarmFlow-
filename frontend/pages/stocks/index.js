import Head from 'next/head'
import { useState } from 'react'
import { useMutation } from 'react-query'
import axios from 'axios'
import {
  FiAlertTriangle,
  FiArrowUpCircle,
  FiCheckCircle,
  FiPackage,
  FiTruck,
} from 'react-icons/fi'
import Layout from '../../components/Layout'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0)

const postMovement = async (payload) => {
  const response = await axios.post(`${API_URL}/noyau/stocks/mouvement`, payload)
  return response.data
}

const stockFamilies = [
  { name: 'Intrants', value: '41 250 EUR', alert: '2 seuils bas', icon: FiArrowUpCircle },
  { name: 'Produits finis', value: '28 900 EUR', alert: 'caisse connectee', icon: FiPackage },
  { name: 'Fourrages', value: '17 600 EUR', alert: 'rendement lie parcelles', icon: FiTruck },
]

const initialForm = {
  produit: 'semence-ble',
  lot: 'LOT-SEM-2026-01',
  sens: 'entree',
  quantite: 10,
  unite: 'sac',
  origine: 'reception fournisseur',
  atelier: 'Ble tendre',
  cout_unitaire: 72,
}

export default function StocksPage() {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)

  const movementMutation = useMutation(postMovement, {
    onSuccess: (payload) => setResult(payload),
  })

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <Layout>
      <Head>
        <title>Stocks - FarmFlow</title>
        <meta name="description" content="Stocks agricoles avec mouvements valorises, lots et impact marge." />
      </Head>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Stocks agricoles</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Lots, mouvements et valorisation</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Les entrees, sorties, pertes et ventes alimentent la valeur de stock, les couts atelier et les marges.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {stockFamilies.map((family) => {
              const Icon = family.icon
              return (
                <div key={family.name} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <Icon className="h-5 w-5 text-emerald-700" />
                  <p className="mt-2 text-xs text-slate-500">{family.name}</p>
                  <p className="text-sm font-semibold text-slate-950">{family.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Mouvement</p>
              <h2 className="text-xl font-semibold text-slate-950">Creer un flux valorise</h2>
            </div>
            <FiPackage className="h-5 w-5 text-slate-400" />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Produit</span>
              <input value={form.produit} onChange={(event) => updateField('produit', event.target.value)} className="input" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Lot</span>
              <input value={form.lot} onChange={(event) => updateField('lot', event.target.value)} className="input" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Sens</span>
              <select value={form.sens} onChange={(event) => updateField('sens', event.target.value)} className="input">
                <option value="entree">Entree</option>
                <option value="sortie">Sortie</option>
                <option value="vente">Vente</option>
                <option value="perte">Perte</option>
                <option value="transfert">Transfert</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Quantite</span>
              <input type="number" min="0" step="0.01" value={form.quantite} onChange={(event) => updateField('quantite', Number(event.target.value))} className="input" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Unite</span>
              <input value={form.unite} onChange={(event) => updateField('unite', event.target.value)} className="input" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Cout unitaire</span>
              <input type="number" min="0" step="0.01" value={form.cout_unitaire} onChange={(event) => updateField('cout_unitaire', Number(event.target.value))} className="input" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Origine</span>
              <input value={form.origine} onChange={(event) => updateField('origine', event.target.value)} className="input" />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-500">Atelier</span>
              <input value={form.atelier} onChange={(event) => updateField('atelier', event.target.value)} className="input" />
            </label>
          </div>

          <button
            type="button"
            onClick={() => movementMutation.mutate(form)}
            disabled={movementMutation.isLoading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-300"
          >
            <FiCheckCircle className="h-4 w-4" />
            {movementMutation.isLoading ? 'Creation...' : 'Valider le mouvement'}
          </button>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Impact</p>
              <h2 className="text-xl font-semibold text-slate-950">Stock et marge</h2>
            </div>
            <FiAlertTriangle className="h-5 w-5 text-slate-400" />
          </div>

          {result ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">{result.mouvement_id}</p>
                <p className="mt-1 text-sm text-emerald-800">{result.impact_marge}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Produit</span>
                  <span className="font-semibold text-slate-950">{result.produit}</span>
                </div>
                <div className="flex justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Quantite</span>
                  <span className="font-semibold text-slate-950">{result.quantite} {result.unite}</span>
                </div>
                <div className="flex justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Valorisation</span>
                  <span className="font-semibold text-slate-950">{formatCurrency(Math.abs(result.valorisation))}</span>
                </div>
                <div className="flex justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Journal</span>
                  <span className="font-semibold text-slate-950">{result.ecriture_stock.journal}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-center">
              <FiPackage className="h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-600">Valide un mouvement pour voir la valorisation et ecriture proposee.</p>
            </div>
          )}
        </aside>
      </section>
    </Layout>
  )
}
