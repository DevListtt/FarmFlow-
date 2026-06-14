import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import {
  FiArchive,
  FiClock,
  FiCreditCard,
  FiDatabase,
  FiDownload,
  FiFileText,
  FiFilter,
  FiPackage,
  FiSearch,
  FiShoppingCart,
} from 'react-icons/fi'
import Layout from '../../components/Layout'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const SERVER_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const filters = [
  { code: 'tout', label: 'Tout', icon: FiClock },
  { code: 'tickets', label: 'Tickets', icon: FiShoppingCart },
  { code: 'achats', label: 'Achats', icon: FiFileText },
  { code: 'stocks', label: 'Stocks', icon: FiPackage },
  { code: 'ecritures', label: 'Ecritures', icon: FiDatabase },
  { code: 'banque', label: 'Banque', icon: FiCreditCard },
]

const exportLinks = [
  { label: 'Tickets', url: '/backoffice/exports/tickets.csv' },
  { label: 'Achats', url: '/backoffice/exports/achats.csv' },
  { label: 'Stocks', url: '/backoffice/exports/stocks.csv' },
  { label: 'Ecritures', url: '/backoffice/exports/ecritures.csv' },
  { label: 'Produits', url: '/backoffice/exports/produits.csv' },
  { label: 'Tiers', url: '/backoffice/exports/tiers.csv' },
]

const fallbackHistory = {
  total: 0,
  lignes: [],
}

const EMPTY_ARRAY = []

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0)
const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

const fetchHistory = async ({ queryKey }) => {
  const [, typeFlux, search] = queryKey
  const response = await axios.get(`${API_URL}/backoffice/historiques`, {
    params: { type_flux: typeFlux, recherche: search, limite: 80 },
  })
  return response.data
}

const fetchDetail = async ({ queryKey }) => {
  const [, detailUrl] = queryKey
  if (!detailUrl) return null
  const response = await axios.get(`${API_URL}${detailUrl}`)
  return response.data
}

function typeClasses(type) {
  return {
    ticket: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    achat: 'border-sky-200 bg-sky-50 text-sky-800',
    stock: 'border-amber-200 bg-amber-50 text-amber-900',
    ecriture: 'border-violet-200 bg-violet-50 text-violet-800',
    banque: 'border-slate-200 bg-slate-50 text-slate-700',
  }[type] || 'border-slate-200 bg-slate-50 text-slate-700'
}

function DetailPanel({ selected, detail, isLoading }) {
  if (!selected) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FiArchive className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-950">Fiche detail</h2>
        </div>
        <p className="mt-3 text-sm text-slate-500">Selectionne une ligne pour afficher les mouvements, lignes et ecritures liees.</p>
      </section>
    )
  }

  const ticket = detail?.ticket
  const order = detail?.commande
  const product = detail?.produit
  const tier = detail?.tiers
  const entry = detail?.ecriture
  const operation = detail?.operation
  const main = ticket || order || product || tier || entry || operation || selected
  const entries = detail?.ecritures || detail?.ecritures_liees || []
  const movements = detail?.mouvements || []
  const sales = detail?.ventes || []
  const tickets = detail?.tickets || []
  const orders = detail?.commandes || []

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">Fiche detail</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {ticket?.ticket_id || order?.reference || product?.nom || tier?.nom || entry?.reference || operation?.reference || selected.reference}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{selected.type} - {selected.statut}</p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${typeClasses(selected.type)}`}>{selected.type}</span>
      </div>

      {isLoading ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">Chargement...</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(main?.totaux || main || {}).slice(0, 8).map(([key, value]) => {
              if (typeof value === 'object' && value !== null) return null
              return (
                <div key={key} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">{key.replaceAll('_', ' ')}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-950">{String(value ?? '-')}</p>
                </div>
              )
            })}
          </div>

          {ticket?.lignes?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-slate-950">Lignes ticket</p>
              <div className="space-y-2">
                {ticket.lignes.map((line) => (
                  <div key={`${line.code}-${line.lot}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span>{line.nom} - {line.quantite}</span>
                    <span className="font-semibold">{formatCurrency(line.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {movements.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-slate-950">Mouvements stock</p>
              <div className="space-y-2">
                {movements.slice(0, 6).map((movement) => (
                  <div key={movement.reference} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-950">{movement.produit}</span>
                      <span className={movement.quantite < 0 ? 'text-rose-700' : 'text-emerald-700'}>{movement.quantite} {movement.unite}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{movement.reference} - {movement.lot}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(entries.length > 0 || sales.length > 0 || tickets.length > 0 || orders.length > 0) && (
            <div className="mt-4 grid gap-3">
              {entries.slice(0, 5).map((item) => (
                <div key={item.reference} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-950">{item.journal} - {item.compte}</p>
                  <p className="text-xs text-slate-500">{item.libelle}</p>
                </div>
              ))}
              {sales.slice(0, 5).map((item) => (
                <div key={`${item.reference}-${item.lot}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-950">Vente {item.reference}</p>
                  <p className="text-xs text-slate-500">{item.quantite} - {formatCurrency(item.total)}</p>
                </div>
              ))}
              {tickets.slice(0, 4).map((item) => (
                <div key={item.ticket_id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-950">Ticket {item.ticket_id}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(item.totaux?.total)}</p>
                </div>
              ))}
              {orders.slice(0, 4).map((item) => (
                <div key={item.reference} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-950">Achat {item.reference}</p>
                  <p className="text-xs text-slate-500">{item.produit} - {formatCurrency(item.total_ttc)}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export async function getServerSideProps() {
  try {
    const response = await axios.get(`${SERVER_API_URL}/backoffice/historiques`, {
      params: { type_flux: 'tout', recherche: '', limite: 80 },
      timeout: 5000,
    })
    return { props: { initialHistory: response.data } }
  } catch {
    return { props: { initialHistory: fallbackHistory } }
  }
}

export default function HistoriquesPage({ initialHistory = fallbackHistory }) {
  const [typeFlux, setTypeFlux] = useState('tout')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const { data, isError } = useQuery(['historiques', typeFlux, search], fetchHistory, {
    staleTime: 15000,
    initialData: typeFlux === 'tout' && search === '' ? initialHistory : undefined,
  })
  const history = data || initialHistory || fallbackHistory
  const rows = history.lignes || EMPTY_ARRAY
  const totals = useMemo(() => ({
    count: rows.length,
    amount: rows.reduce((sum, row) => sum + Number(row.montant || 0), 0),
    tickets: rows.filter((row) => row.type === 'ticket').length,
    stock: rows.filter((row) => row.type === 'stock').length,
  }), [rows])

  const { data: detail, isLoading: detailLoading } = useQuery(
    ['historique-detail', selected?.detail_url],
    fetchDetail,
    { enabled: Boolean(selected?.detail_url), staleTime: 10000 }
  )

  return (
    <Layout>
      <Head>
        <title>Historiques - FarmFlow</title>
        <meta name="description" content="Historiques tickets, achats, stocks, ecritures et exports CSV FarmFlow." />
      </Head>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.55fr] xl:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Audit & consultation</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Historiques</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Recherche transverse sur tickets, achats, mouvements de stock, ecritures automatiques et banque, avec fiches detail et exports.
            </p>
            {isError && <p className="mt-3 text-sm text-amber-700">Donnees indisponibles pour le moment.</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Lignes</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{totals.count}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Montant net</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{formatCurrency(totals.amount)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-3 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.code}
                  onClick={() => setTypeFlux(item.code)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${typeFlux === item.code ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
        <label className="relative block">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input h-full pl-10"
            placeholder="Rechercher reference, client, produit..."
          />
        </label>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <FiFilter className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-semibold text-slate-950">Flux transactionnels</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {exportLinks.slice(0, 4).map((item) => (
                <a key={item.url} href={`${API_URL}${item.url}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <FiDownload className="h-4 w-4" />
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Libelle</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rows.map((row) => (
                  <tr key={`${row.type}-${row.reference}`} className={selected?.reference === row.reference ? 'bg-emerald-50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${typeClasses(row.type)}`}>{row.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(row)} className="text-left font-semibold text-slate-950 hover:text-emerald-700">
                        {row.reference}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(row.date)}</td>
                    <td className="px-4 py-3 text-slate-700">{row.libelle}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-950">{formatCurrency(row.montant)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">Aucune ligne trouvee.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <DetailPanel selected={selected} detail={detail} isLoading={detailLoading} />
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <FiDownload className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-semibold text-slate-950">Exports</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {exportLinks.map((item) => (
                <a key={item.url} href={`${API_URL}${item.url}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {item.label}
                </a>
              ))}
            </div>
          </section>
        </div>
      </section>
    </Layout>
  )
}
