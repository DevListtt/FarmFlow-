import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiCreditCard,
  FiDatabase,
  FiDownload,
  FiFileText,
  FiFilter,
  FiRefreshCcw,
  FiShield,
} from 'react-icons/fi'
import Layout from '../../components/Layout'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const fallbackData = {
  kpis: [
    { label: 'Ecritures', value: 0, detail: 'lignes automatiques' },
    { label: 'Balance', value: 0, detail: 'debit - credit' },
    { label: 'TVA nette', value: 0, detail: 'collectee - deductible' },
    { label: 'A rapprocher', value: 0, detail: 'operations banque' },
  ],
  journaux: [],
  balance: [],
  grand_livre: [],
  banque: [],
  plan: [],
  tva: { collectee: 0, deductible: 0, nette: 0 },
  controles: [],
}

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0)
const formatNumber = (value) => new Intl.NumberFormat('fr-FR').format(value || 0)

const fetchAccounting = async () => {
  const response = await axios.get(`${API_URL}/comptabilite/vue`)
  return response.data
}

const validateEntries = async (references) => {
  const response = await axios.post(`${API_URL}/comptabilite/ecritures/valider-auto`, { references, statut: 'validee' })
  return response.data
}

const reconcileOperation = async (payload) => {
  const response = await axios.post(`${API_URL}/comptabilite/rapprochements`, payload)
  return response.data
}

function StatusBadge({ status }) {
  const cls = status === 'ok' || status === 'validee' || status === 'rapprochee'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : status === 'a controler' || status === 'a rapprocher'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-slate-200 bg-slate-50 text-slate-700'
  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${cls}`}>{status || 'proposee'}</span>
}

export default function ComptabilitePage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('synthese')
  const { data, isError, isFetching } = useQuery('comptabilite-vue', fetchAccounting, { staleTime: 15000 })
  const accounting = data || fallbackData
  const proposedEntries = useMemo(() => accounting.grand_livre.filter((entry) => entry.statut !== 'validee').slice(0, 12), [accounting.grand_livre])
  const firstBankOperation = accounting.banque.find((operation) => operation.statut === 'a_rapprocher')
  const validatedEntries = accounting.grand_livre.filter((entry) => entry.statut === 'validee').length
  const pendingEntries = Math.max(accounting.grand_livre.length - validatedEntries, 0)
  const openControls = accounting.controles.filter((control) => control.statut !== 'ok').length

  const validateMutation = useMutation(validateEntries, {
    onSuccess: () => queryClient.invalidateQueries('comptabilite-vue'),
  })
  const reconcileMutation = useMutation(reconcileOperation, {
    onSuccess: () => queryClient.invalidateQueries('comptabilite-vue'),
  })

  const tabs = [
    { code: 'synthese', label: 'Synthese', icon: FiShield },
    { code: 'journaux', label: 'Journaux', icon: FiDatabase },
    { code: 'balance', label: 'Balance', icon: FiFileText },
    { code: 'grand-livre', label: 'Grand livre', icon: FiFilter },
    { code: 'banque', label: 'Banque', icon: FiCreditCard },
  ]

  return (
    <Layout>
      <Head>
        <title>Comptabilite - FarmFlow</title>
        <meta name="description" content="Comptabilite agricole FarmFlow : journaux, TVA, balance, grand livre et rapprochement." />
      </Head>

      <section className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 p-5 xl:grid-cols-[1fr_0.48fr] xl:items-center">
          <div>
            <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold uppercase text-emerald-800">Finance & controle</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-950">Comptabilite agricole</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Journaux, ecritures automatiques, TVA, balance, grand livre, cartes a encaisser et rapprochement bancaire.
            </p>
            {isError && <p className="mt-3 text-sm text-amber-700">Donnees comptables indisponibles, affichage de secours.</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                disabled={!proposedEntries.length || validateMutation.isLoading}
                onClick={() => validateMutation.mutate(proposedEntries.map((entry) => entry.reference))}
                className="btn btn-primary gap-2 disabled:opacity-50"
              >
                <FiCheckCircle className="h-4 w-4" />
                Valider ecritures
              </button>
              <a href={`${API_URL}/backoffice/exports/ecritures.csv`} className="btn btn-outline gap-2">
                <FiDownload className="h-4 w-4" />
                Export CSV
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-emerald-300">File de controle</p>
                <p className="mt-1 text-lg font-semibold">{pendingEntries} ecritures a traiter</p>
              </div>
              <FiShield className="h-6 w-6 text-emerald-200" />
            </div>
            <div className="mt-4 grid gap-2">
              <div className="flex items-center justify-between rounded-md bg-white/10 px-3 py-2 text-sm">
                <span>Validees</span>
                <span className="font-semibold">{validatedEntries}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/10 px-3 py-2 text-sm">
                <span>Controles ouverts</span>
                <span className="font-semibold">{openControls}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/10 px-3 py-2 text-sm">
                <span>TVA nette</span>
                <span className="font-semibold">{formatCurrency(accounting.tva.nette)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-3 md:grid-cols-4">
        {accounting.kpis.map((item, index) => (
          <article key={item.label} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className={['h-1 bg-emerald-600', 'h-1 bg-sky-600', 'h-1 bg-amber-500', 'h-1 bg-slate-700'][index % 4]} />
            <div className="p-4">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {typeof item.value === 'number' && item.label.toLowerCase().includes('tva') ? formatCurrency(item.value) : formatNumber(item.value)}
            </p>
            <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.code}
                onClick={() => setActiveTab(tab.code)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${activeTab === tab.code ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
          {isFetching && <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Actualisation</span>}
        </div>
      </section>

      {activeTab === 'synthese' && (
        <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Controles comptables</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {accounting.controles.map((control) => (
                <div key={control.code} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{control.label}</p>
                    <StatusBadge status={control.statut} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {control.montant !== undefined ? formatCurrency(control.montant) : control.volume !== undefined ? `${control.volume} elements` : 'controle disponible'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">TVA</h2>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <span className="text-sm text-slate-600">Collectee</span>
                <span className="font-semibold text-slate-950">{formatCurrency(accounting.tva.collectee)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <span className="text-sm text-slate-600">Deductible</span>
                <span className="font-semibold text-slate-950">{formatCurrency(accounting.tva.deductible)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                <span className="text-sm font-semibold text-emerald-900">Nette</span>
                <span className="font-semibold text-emerald-950">{formatCurrency(accounting.tva.nette)}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'journaux' && (
        <TableSection
          title="Journaux"
          rows={accounting.journaux}
          columns={[
            ['journal', 'Journal'],
            ['debit', 'Debit', formatCurrency],
            ['credit', 'Credit', formatCurrency],
            ['ecart', 'Ecart', formatCurrency],
            ['lignes', 'Lignes'],
          ]}
        />
      )}

      {activeTab === 'balance' && (
        <section className="grid gap-5 xl:grid-cols-[1fr_0.45fr]">
          <TableSection
            title="Balance par compte"
            rows={accounting.balance}
            columns={[
              ['compte', 'Compte'],
              ['debit', 'Debit', formatCurrency],
              ['credit', 'Credit', formatCurrency],
              ['solde', 'Solde', formatCurrency],
              ['lignes', 'Lignes'],
            ]}
          />
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Plan agricole</h2>
            <div className="mt-4 space-y-2">
              {accounting.plan.map((account) => (
                <div key={account.compte} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold text-slate-950">{account.compte} - {account.libelle}</p>
                  <p className="text-xs text-slate-500">{account.type}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'grand-livre' && (
        <TableSection
          title="Grand livre"
          rows={accounting.grand_livre.slice(0, 80)}
          columns={[
            ['date', 'Date'],
            ['journal', 'Journal'],
            ['compte', 'Compte'],
            ['libelle', 'Libelle'],
            ['debit', 'Debit', formatCurrency],
            ['credit', 'Credit', formatCurrency],
            ['statut', 'Statut', (value) => <StatusBadge status={value} />],
          ]}
        />
      )}

      {activeTab === 'banque' && (
        <section className="grid gap-5 xl:grid-cols-[1fr_0.42fr]">
          <TableSection
            title="Operations bancaires"
            rows={accounting.banque}
            columns={[
              ['date_operation', 'Date'],
              ['libelle', 'Libelle'],
              ['montant', 'Montant', formatCurrency],
              ['categorie', 'Categorie'],
              ['statut', 'Statut', (value) => <StatusBadge status={value} />],
              ['score', 'Score'],
            ]}
          />
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FiAlertTriangle className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-950">Rapprochement rapide</h2>
            </div>
            {firstBankOperation ? (
              <>
                <p className="mt-3 text-sm leading-6 text-slate-600">{firstBankOperation.libelle} - {formatCurrency(firstBankOperation.montant)}</p>
                <button
                  disabled={reconcileMutation.isLoading}
                  onClick={() => reconcileMutation.mutate({ operation_reference: firstBankOperation.reference, document_reference: 'ticket-caisse', categorie: 'vente' })}
                  className="mt-4 btn btn-primary w-full gap-2"
                >
                  <FiRefreshCcw className="h-4 w-4" />
                  Rapprocher
                </button>
              </>
            ) : (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Aucune operation a rapprocher.</p>
            )}
          </div>
        </section>
      )}
    </Layout>
  )
}

function TableSection({ title, rows, columns }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-950">{title}</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              {columns.map(([, label]) => <th key={label} className="px-4 py-3">{label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row, index) => (
              <tr key={row.reference || row.journal || row.compte || index} className="hover:bg-slate-50">
                {columns.map(([key, , formatter]) => (
                  <td key={key} className="max-w-[320px] px-4 py-3 text-slate-700">
                    {formatter ? formatter(row[key]) : String(row[key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-500">Aucune ligne.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
