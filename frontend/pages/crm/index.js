import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  FiBriefcase,
  FiCheckCircle,
  FiCreditCard,
  FiHome,
  FiMove,
  FiRefreshCcw,
  FiSave,
  FiShoppingBag,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi'
import Layout from '../../components/Layout'
import { useStoredOrder } from '../../lib/useStoredOrder'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0)
const formatNumber = (value, digits = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(value || 0)

const postSegment = async (payload) => {
  const response = await axios.post(`${API_URL}/noyau/crm/segmenter`, payload)
  return response.data
}

const fetchCommercial = async () => {
  const response = await axios.get(`${API_URL}/crm/pilotage-commercial`)
  return response.data
}

const updateObjective = async (payload) => {
  const response = await axios.post(`${API_URL}/crm/objectifs`, payload)
  return response.data
}

const segments = [
  {
    code: 'circuit-court',
    name: 'Circuit court',
    icon: FiHome,
    channels: ['Boutique ferme', 'Marche', 'AMAP', 'Drive fermier'],
    policy: 'ticket immediat, fidelite, paniers et produits saisonniers',
  },
  {
    code: 'pro',
    name: 'Pro',
    icon: FiBriefcase,
    channels: ['Restaurant', 'Epicerie', 'Revendeur', 'Transformateur'],
    policy: 'tarifs negocies, volumes reserves, factures et relances',
  },
  {
    code: 'collectivite',
    name: 'Collectivite',
    icon: FiUsers,
    channels: ['Cantine', 'Mairie', 'Ecole', 'EHPAD'],
    policy: 'contrats, bons de commande, conformite et delais de paiement',
  },
]

const fallbackCommercial = {
  kpis: {
    clients: 4,
    ca_realise: 17616,
    objectif: 29200,
    progression_percent: 60.3,
    panier_moyen: 158,
    commandes_ouvertes: 3,
  },
  clients: [
    { id: 1, code: 'client-comptoir', nom: 'Client comptoir', segment: 'circuit-court', canal: 'boutique ferme', objectif_annuel: 800, ca_realise: 464, reste_a_faire: 336, progression_percent: 58, tickets: 18, panier_moyen: 26, commandes_ouvertes: 0, statut_pipeline: 'en_cours', prochaine_action: 'proposer panier compose pour augmenter le panier moyen', source_ca: 'projection' },
    { id: 2, code: 'restaurant-tilleuls', nom: 'Restaurant Les Tilleuls', segment: 'pro', canal: 'restaurant', objectif_annuel: 6200, ca_realise: 3968, reste_a_faire: 2232, progression_percent: 64, tickets: 12, panier_moyen: 145, commandes_ouvertes: 1, statut_pipeline: 'en_cours', prochaine_action: 'caler une mercuriale et un objectif de volume hebdo', source_ca: 'projection' },
    { id: 3, code: 'amap-village', nom: 'AMAP village', segment: 'circuit-court', canal: 'AMAP', objectif_annuel: 4200, ca_realise: 2436, reste_a_faire: 1764, progression_percent: 58, tickets: 28, panier_moyen: 28, commandes_ouvertes: 1, statut_pipeline: 'en_cours', prochaine_action: 'preparer offre paniers saison', source_ca: 'projection' },
    { id: 4, code: 'cantine-centrale', nom: 'Cantine centrale', segment: 'collectivite', canal: 'collectivite', objectif_annuel: 18000, ca_realise: 7560, reste_a_faire: 10440, progression_percent: 42, tickets: 3, panier_moyen: 430, commandes_ouvertes: 1, statut_pipeline: 'a_relancer', prochaine_action: 'planifier contrat, volumes et prochaines commandes', source_ca: 'projection' },
  ],
  segments: [
    { code: 'circuit-court', ca: 2900, objectif: 5000, clients: 2, progression_percent: 58 },
    { code: 'pro', ca: 3968, objectif: 6200, clients: 1, progression_percent: 64 },
    { code: 'collectivite', ca: 7560, objectif: 18000, clients: 1, progression_percent: 42 },
  ],
}

const initialForm = {
  nom: 'Restaurant Les Tilleuls',
  canal: 'restaurant',
  type_structure: 'professionnel',
  volume_annuel: 6200,
  frequence: 'hebdomadaire',
  delai_paiement: 15,
}

const pipelineColumns = [
  { code: 'a_relancer', title: 'A relancer', tone: 'border-amber-200 bg-amber-50 text-amber-900' },
  { code: 'en_cours', title: 'En cours', tone: 'border-sky-200 bg-sky-50 text-sky-900' },
  { code: 'objectif_atteint', title: 'Objectif OK', tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
]

const clientKey = (client) => String(client.id || client.code || client.nom)

const setReorderPayload = (event, id) => {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/x-farmflow-order', id)
  event.dataTransfer.setData('text/plain', id)
}

const getReorderPayload = (event) => event.dataTransfer.getData('application/x-farmflow-order') || event.dataTransfer.getData('text/plain')

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </article>
  )
}

function ClientCard({ client, onDragStart }) {
  return (
    <article
      draggable
      onDragStart={(event) => onDragStart(event, client)}
      className="cursor-grab rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{client.nom}</p>
          <p className="mt-1 text-xs text-slate-500">{client.segment} - {client.canal}</p>
        </div>
        <FiMove className="h-4 w-4 shrink-0 text-slate-400" />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(client.progression_percent || 0, 100)}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-slate-50 p-2">
          <p className="text-slate-500">CA</p>
          <p className="font-semibold text-slate-950">{formatCurrency(client.ca_realise)}</p>
        </div>
        <div className="rounded-md bg-slate-50 p-2">
          <p className="text-slate-500">Panier</p>
          <p className="font-semibold text-slate-950">{formatCurrency(client.panier_moyen)}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{client.prochaine_action}</p>
    </article>
  )
}

export default function CrmPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [pipelineOverrides, setPipelineOverrides] = useState({})
  const [draggedClient, setDraggedClient] = useState(null)
  const [objectiveDrafts, setObjectiveDrafts] = useState({})

  const { data, isError, isFetching } = useQuery('crm-pilotage-commercial', fetchCommercial, { staleTime: 30000 })
  const commercial = data || fallbackCommercial

  useEffect(() => {
    const nextDrafts = {}
    ;(commercial.clients || []).forEach((client) => {
      nextDrafts[clientKey(client)] = client.objectif_annuel
    })
    setObjectiveDrafts(nextDrafts)
  }, [commercial.clients])

  const segmentMutation = useMutation(postSegment, {
    onSuccess: (payload) => setResult(payload),
  })

  const objectiveMutation = useMutation(updateObjective, {
    onSuccess: () => queryClient.invalidateQueries('crm-pilotage-commercial'),
  })

  const clientsWithPipeline = useMemo(() => (commercial.clients || []).map((client) => ({
    ...client,
    statut_pipeline: pipelineOverrides[clientKey(client)] || client.statut_pipeline,
  })), [commercial.clients, pipelineOverrides])
  const metricCards = useMemo(() => [
    { code: 'clients', icon: FiUsers, label: 'Clients actifs', value: formatNumber(commercial.kpis.clients, 0), detail: 'clients suivis' },
    { code: 'ca', icon: FiTrendingUp, label: 'CA realise', value: formatCurrency(commercial.kpis.ca_realise), detail: `${formatNumber(commercial.kpis.progression_percent)}% objectif` },
    { code: 'objectif', icon: FiTarget, label: 'Objectif', value: formatCurrency(commercial.kpis.objectif), detail: 'volume annuel suivi' },
    { code: 'panier', icon: FiShoppingBag, label: 'Panier moyen', value: formatCurrency(commercial.kpis.panier_moyen), detail: 'tickets et projection' },
    { code: 'commandes', icon: FiCreditCard, label: 'Commandes', value: formatNumber(commercial.kpis.commandes_ouvertes, 0), detail: 'ouvertes a convertir' },
  ], [commercial.kpis])
  const { orderedItems: orderedMetricCards, moveItem: moveMetricCard } = useStoredOrder('farmflow-crm-metrics-order', metricCards)

  const topClients = useMemo(
    () => [...clientsWithPipeline].sort((a, b) => Number(b.reste_a_faire || 0) - Number(a.reste_a_faire || 0)).slice(0, 5),
    [clientsWithPipeline]
  )

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleDragStart = (event, client) => {
    const key = clientKey(client)
    setDraggedClient(key)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', key)
  }

  const handleDrop = (event, status) => {
    event.preventDefault()
    const key = event.dataTransfer.getData('text/plain') || draggedClient
    if (!key) return
    setPipelineOverrides((current) => ({ ...current, [key]: status }))
    setDraggedClient(null)
  }

  const saveObjective = (client) => {
    const key = clientKey(client)
    objectiveMutation.mutate({
      client_id: client.id,
      objectif_annuel: Number(objectiveDrafts[key] || 0),
    })
  }

  return (
    <Layout>
      <Head>
        <title>CRM agricole - FarmFlow</title>
        <meta name="description" content="CRM agricole avec objectifs client, panier moyen, pipeline et segmentation." />
      </Head>

      <section className="command-panel mb-5 overflow-hidden p-5 text-white">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.54fr] xl:items-end">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-100">
              CRM agricole
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Clients, objectifs et paniers</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
              Pilote les objectifs par client, le panier moyen, les relances et le pipeline commercial par segment.
            </p>
            {isError && <p className="mt-3 text-sm text-amber-100">Mode local actif pour le pilotage commercial.</p>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {segments.map((segment) => {
              const Icon = segment.icon
              return (
                <div key={segment.code} className="flex min-w-[96px] flex-col items-center justify-center rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-center">
                  <Icon className="h-5 w-5 text-emerald-200" />
                  <span className="mt-2 text-xs font-semibold text-white">{segment.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {orderedMetricCards.map((card) => (
          <div
            key={card.code}
            draggable
            onDragStart={(event) => setReorderPayload(event, card.code)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              moveMetricCard(getReorderPayload(event), card.code)
            }}
            className="group relative cursor-grab active:cursor-grabbing"
          >
            <span className="absolute right-3 top-3 z-10 rounded-md border border-slate-200 bg-white/90 p-1.5 text-slate-400 opacity-0 shadow-sm transition group-hover:opacity-100">
              <FiMove className="h-3.5 w-3.5" />
            </span>
            <MetricCard icon={card.icon} label={card.label} value={card.value} detail={card.detail} />
          </div>
        ))}
      </section>

      <section className="mb-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="section-kicker">
                <FiMove className="h-4 w-4" />
                Pipeline commercial
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Priorites commerciales</h2>
              <p className="mt-1 text-sm text-slate-500">Organise les clients entre relance, suivi et objectif atteint.</p>
            </div>
            {isFetching && <FiRefreshCcw className="h-5 w-5 animate-spin text-slate-400" />}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {pipelineColumns.map((column) => {
              const columnClients = clientsWithPipeline.filter((client) => client.statut_pipeline === column.code)
              return (
                <div
                  key={column.code}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, column.code)}
                  className="min-h-[360px] rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${column.tone}`}>{column.title}</span>
                    <span className="text-xs font-semibold text-slate-500">{columnClients.length}</span>
                  </div>
                  <div className="space-y-3">
                    {columnClients.map((client) => (
                      <ClientCard key={clientKey(client)} client={client} onDragStart={handleDragStart} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <FiTarget className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-slate-950">Objectifs a realiser</h2>
          </div>
          <div className="space-y-3">
            {topClients.map((client) => {
              const key = clientKey(client)
              return (
                <div key={key} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{client.nom}</p>
                      <p className="mt-1 text-sm text-slate-500">Reste {formatCurrency(client.reste_a_faire)} - panier {formatCurrency(client.panier_moyen)}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-950">{formatNumber(client.progression_percent)}%</span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_44px]">
                    <input
                      type="number"
                      min="0"
                      value={objectiveDrafts[key] ?? client.objectif_annuel}
                      onChange={(event) => setObjectiveDrafts((current) => ({ ...current, [key]: event.target.value }))}
                      className="input"
                    />
                    <button
                      type="button"
                      onClick={() => saveObjective(client)}
                      disabled={objectiveMutation.isLoading || !client.id}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 text-white hover:bg-slate-800 disabled:bg-slate-300"
                      title="Sauvegarder objectif"
                    >
                      <FiSave className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {segments.map((segment) => {
              const Icon = segment.icon
              const segmentMetric = (commercial.segments || []).find((item) => item.code === segment.code)
              return (
                <article key={segment.code} className="surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{segment.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{segment.policy}</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(segmentMetric?.progression_percent || 0, 100)}%` }} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{formatCurrency(segmentMetric?.ca || 0)} / {formatCurrency(segmentMetric?.objectif || 0)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {segment.channels.map((channel) => (
                      <span key={channel} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                        {channel}
                      </span>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>

          <div className="surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Segmentation active</p>
                <h2 className="text-xl font-semibold text-slate-950">Qualifier un client</h2>
              </div>
              <FiShoppingBag className="h-5 w-5 text-slate-400" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-500">Client</span>
                <input value={form.nom} onChange={(event) => updateField('nom', event.target.value)} className="input" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-500">Canal</span>
                <select value={form.canal} onChange={(event) => updateField('canal', event.target.value)} className="input">
                  <option value="boutique ferme">Boutique ferme</option>
                  <option value="marche">Marche</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="revendeur">Revendeur</option>
                  <option value="collectivite">Collectivite</option>
                  <option value="cantine">Cantine</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-500">Structure</span>
                <select value={form.type_structure} onChange={(event) => updateField('type_structure', event.target.value)} className="input">
                  <option value="particulier">Particulier</option>
                  <option value="professionnel">Professionnel</option>
                  <option value="collectivite">Collectivite</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-500">Volume annuel</span>
                <input type="number" min="0" value={form.volume_annuel} onChange={(event) => updateField('volume_annuel', Number(event.target.value))} className="input" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-500">Delai paiement</span>
                <input type="number" min="0" value={form.delai_paiement} onChange={(event) => updateField('delai_paiement', Number(event.target.value))} className="input" />
              </label>
            </div>

            <button
              type="button"
              onClick={() => segmentMutation.mutate(form)}
              disabled={segmentMutation.isLoading}
              className="touch-button mt-4 inline-flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-300"
            >
              <FiUsers className="h-4 w-4" />
              {segmentMutation.isLoading ? 'Analyse...' : 'Appliquer le segment'}
            </button>
          </div>
        </div>

        <aside className="surface p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Resultat</p>
              <h2 className="text-xl font-semibold text-slate-950">Politique client</h2>
            </div>
            <FiCheckCircle className="h-5 w-5 text-slate-400" />
          </div>

          {result ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">{result.segment.nom}</p>
                <p className="mt-1 text-sm leading-6 text-emerald-800">{result.segment.promesse}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Remise ref.</span>
                  <span className="font-semibold text-slate-950">{result.politique_commerciale.remise_reference}%</span>
                </div>
                <div className="flex justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Facturation</span>
                  <span className="text-right font-semibold text-slate-950">{result.politique_commerciale.facturation}</span>
                </div>
                <div className="flex justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Risque</span>
                  <span className="text-right font-semibold text-slate-950">{result.politique_commerciale.risque}</span>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Actions</p>
                <div className="space-y-2">
                  {result.actions.map((action) => (
                    <div key={action} className="flex items-center gap-2 text-sm text-slate-700">
                      <FiCreditCard className="h-4 w-4 text-emerald-700" />
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-center">
              <FiUsers className="h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-600">Lance une qualification client pour obtenir le segment et la politique commerciale.</p>
            </div>
          )}
        </aside>
      </section>
    </Layout>
  )
}
