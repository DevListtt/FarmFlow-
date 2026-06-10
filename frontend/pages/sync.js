import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import axios from 'axios'
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiCloud,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiLink,
  FiRadio,
  FiRefreshCcw,
  FiTruck,
} from 'react-icons/fi'
import Layout from '../components/Layout'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const connectorIcons = {
  bank: FiDollarSign,
  tpe: FiCreditCard,
  iot: FiRadio,
  scale: FiActivity,
  weather: FiCloud,
  logistics: FiTruck,
}

const fallbackConnectors = [
  {
    code: 'bank',
    nom: 'Banque',
    statut: 'a connecter',
    fraicheur: 'Aucun flux',
    description: 'Import CSV/OFX puis connecteur bancaire pour rapprochement facture, caisse et compta.',
    champs: ['IBAN', 'Journal banque', 'Regle de categorisation', 'Seuil alerte solde'],
  },
  {
    code: 'tpe',
    nom: 'TPE',
    statut: 'pret a parametrer',
    fraicheur: 'Terminal non associe',
    description: 'Associer les paiements carte a la caisse, aux tickets et au compte d attente.',
    champs: ['Terminal', 'Compte encaissement', 'Frais carte', 'Delai versement'],
  },
]

const fallbackFlows = [
  { source: 'Caisse', destination: 'Comptabilite', regle: 'Ticket valide -> ecriture vente + TVA', statut: 'pret' },
  { source: 'TPE', destination: 'Banque', regle: 'Paiement carte -> attente versement -> rapprochement', statut: 'a parametrer' },
]

const statusClasses = {
  pret: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'a connecter': 'bg-amber-50 text-amber-900 border-amber-200',
  'pret a parametrer': 'bg-blue-50 text-blue-900 border-blue-200',
  'mapping requis': 'bg-violet-50 text-violet-900 border-violet-200',
  optionnel: 'bg-slate-50 text-slate-700 border-slate-200',
  'a cadrer': 'bg-slate-50 text-slate-700 border-slate-200',
  'a parametrer': 'bg-blue-50 text-blue-900 border-blue-200',
  'configuration incomplete': 'bg-amber-50 text-amber-900 border-amber-200',
}

const fetchSync = async () => {
  const response = await axios.get(`${API_URL}/pilotage/sync`)
  return response.data
}

const connectSync = async (payload) => {
  const response = await axios.post(`${API_URL}/pilotage/sync/connecter`, payload)
  return response.data
}

export default function SyncPage() {
  const [activeCode, setActiveCode] = useState('bank')
  const [frequency, setFrequency] = useState('15')
  const [mode, setMode] = useState('Simulation')
  const [autoJournal, setAutoJournal] = useState(true)
  const [humanValidation, setHumanValidation] = useState(true)
  const [formValues, setFormValues] = useState({})
  const [connectionResult, setConnectionResult] = useState(null)

  const { data, isError } = useQuery('pilotage-sync', fetchSync, {
    staleTime: 30000,
  })

  const connectMutation = useMutation(connectSync, {
    onSuccess: (result) => setConnectionResult(result),
  })

  const connectors = data?.connecteurs || fallbackConnectors
  const flows = data?.flux || fallbackFlows
  const activeConnector = connectors.find((connector) => connector.code === activeCode) || connectors[0]

  useEffect(() => {
    if (connectors.length && !connectors.some((connector) => connector.code === activeCode)) {
      setActiveCode(connectors[0].code)
    }
  }, [activeCode, connectors])

  const stats = useMemo(() => {
    const connected = connectors.filter((connector) => connector.statut === 'pret').length
    const pending = connectors.length - connected
    return [
      { label: 'Connecteurs', value: connectors.length },
      { label: 'Actifs', value: connected },
      { label: 'A parametrer', value: pending },
      { label: 'Flux cibles', value: flows.length },
    ]
  }, [connectors, flows])

  const updateField = (field, value) => {
    setConnectionResult(null)
    setFormValues((current) => ({
      ...current,
      [activeConnector.code]: {
        ...(current[activeConnector.code] || {}),
        [field]: value,
      },
    }))
  }

  const submitConnector = () => {
    connectMutation.mutate({
      code: activeConnector.code,
      frequence_minutes: Number(frequency),
      mode,
      journal_automatique: autoJournal,
      validation_humaine: humanValidation,
      parametres: formValues[activeConnector.code] || {},
    })
  }

  return (
    <Layout>
      <Head>
        <title>Synchronisations - FarmFlow</title>
        <meta name="description" content="Hub de synchronisation FarmFlow pour banque, TPE, IoT, balance et connecteurs." />
      </Head>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.45fr] xl:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Connecteurs & automatisations</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Espace synchronisation</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Relier banque, TPE, balances, capteurs, meteo et logistique aux mouvements de stock, a la caisse et aux ecritures comptables.
            </p>
            {isError && <p className="mt-3 text-sm text-amber-700">Mode local actif : donnees de secours chargees.</p>}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {connectors.map((connector) => {
            const Icon = connectorIcons[connector.code] || FiRadio
            const active = activeConnector.code === connector.code
            return (
              <button
                key={connector.code}
                onClick={() => {
                  setActiveCode(connector.code)
                  setConnectionResult(null)
                }}
                className={`w-full rounded-lg border bg-white p-4 text-left shadow-sm transition ${active ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-950">{connector.nom}</p>
                      <span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClasses[connector.statut] || statusClasses.optionnel}`}>
                        {connector.statut}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{connector.description}</p>
                    <p className="mt-2 text-xs text-slate-500">{connector.fraicheur}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-slate-500">Configuration</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">{activeConnector.nom}</h2>
              </div>
              <button
                onClick={submitConnector}
                disabled={connectMutation.isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-300"
              >
                <FiLink className="h-4 w-4" />
                {connectMutation.isLoading ? 'Connexion...' : 'Connecter'}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {(activeConnector.champs || []).map((field) => (
                <label key={field}>
                  <span className="mb-1 block text-xs font-medium text-slate-500">{field}</span>
                  <input
                    className="input"
                    placeholder={`Saisir ${field.toLowerCase()}`}
                    value={formValues[activeConnector.code]?.[field] || ''}
                    onChange={(event) => updateField(field, event.target.value)}
                  />
                </label>
              ))}
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-500">Frequence sync (minutes)</span>
                <input type="number" min="5" value={frequency} onChange={(event) => setFrequency(event.target.value)} className="input" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-500">Mode</span>
                <select value={mode} onChange={(event) => setMode(event.target.value)} className="input">
                  <option>Simulation</option>
                  <option>Production avec validation</option>
                  <option>Production automatique</option>
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <span className="text-sm font-medium text-slate-700">Journal automatique</span>
                <input type="checkbox" checked={autoJournal} onChange={(event) => setAutoJournal(event.target.checked)} />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <span className="text-sm font-medium text-slate-700">Validation humaine</span>
                <input type="checkbox" checked={humanValidation} onChange={(event) => setHumanValidation(event.target.checked)} />
              </label>
            </div>

            {connectionResult && (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-semibold">{connectionResult.connecteur} : {connectionResult.statut}</p>
                <p className="mt-1">Frequence {connectionResult.frequence_minutes} min - {connectionResult.mode}</p>
              </div>
            )}
            {connectMutation.isError && <p className="mt-4 text-sm text-red-700">Connexion refusee, controle les champs obligatoires.</p>}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-slate-500">Flux metier</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Regles de synchronisation</h2>
              </div>
              <FiRefreshCcw className="h-5 w-5 text-emerald-700" />
            </div>

            <div className="space-y-3">
              {flows.map((flow) => (
                <div key={`${flow.source}-${flow.destination}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[160px_1fr_130px] md:items-center">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <FiDatabase className="h-4 w-4 text-slate-500" />
                    <span>{flow.source}</span>
                    <span className="text-slate-400">-&gt;</span>
                    <span>{flow.destination}</span>
                  </div>
                  <p className="text-sm text-slate-600">{flow.regle}</p>
                  <span className={`inline-flex justify-center rounded-full border px-2 py-1 text-xs font-medium ${statusClasses[flow.statut] || statusClasses.optionnel}`}>
                    {flow.statut === 'pret' ? <FiCheckCircle className="mr-1 h-3 w-3" /> : <FiAlertTriangle className="mr-1 h-3 w-3" />}
                    {flow.statut}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </Layout>
  )
}
