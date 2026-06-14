import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiDollarSign,
  FiMove,
  FiPlus,
  FiRefreshCcw,
  FiShoppingBag,
  FiSliders,
  FiTrash2,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi'
import Layout from '../components/Layout'
import { moveIdBefore } from '../lib/useStoredOrder'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const standardChargeLabels = {
  semences: 'Semences / plants',
  engrais: 'Engrais / amendements',
  phytos: 'Protection / sanitaire',
  alimentation: 'Alimentation',
  carburant: 'Carburant',
  main_oeuvre: 'Main oeuvre',
  materiel: 'Materiel',
  autres_charges_operationnelles: 'Autres charges',
}

const atelierPresets = {
  culture: {
    code: 'culture',
    title: 'Culture',
    icon: FiBarChart2,
    color: 'emerald',
    description: 'Parcelle, ilot, culture, rendement, prix et charges terrain.',
    scenario: {
      libelle: 'Ble tendre - ilot nord',
      atelier_type: 'culture',
      canal: 'coop',
      unite_reference: 'ha',
      surface_ha: 42,
      quantite_reference: 42,
      rendement: 72,
      prix_unitaire: 20.5,
      aides: 7350,
      pertes_percent: 4,
      variation_prix_percent: -8,
      variation_rendement_percent: -10,
      objectif_marge_percent: 20,
      charges: {
        semences: 3444,
        engrais: 10332,
        phytos: 4956,
        alimentation: 0,
        carburant: 3276,
        main_oeuvre: 3990,
        materiel: 5964,
        autres_charges_operationnelles: 1890,
      },
      customCharges: [
        { id: 'irrigation', libelle: 'Irrigation', montant: 920 },
        { id: 'analyse-sol', libelle: 'Analyses sol', montant: 280 },
      ],
      customRevenues: [
        { id: 'paille', libelle: 'Paille vendue', montant: 3600 },
      ],
    },
  },
  elevage: {
    code: 'elevage',
    title: 'Animal',
    icon: FiUsers,
    color: 'sky',
    description: 'Lot animal, poids produit, alimentation, sanitaire et cout par tete.',
    scenario: {
      libelle: 'Lot bovin finition',
      atelier_type: 'elevage',
      canal: 'pro',
      unite_reference: 'tete',
      surface_ha: 38,
      quantite_reference: 38,
      rendement: 385,
      prix_unitaire: 3.95,
      aides: 6400,
      pertes_percent: 2,
      variation_prix_percent: -6,
      variation_rendement_percent: -4,
      objectif_marge_percent: 16,
      charges: {
        semences: 0,
        engrais: 0,
        phytos: 0,
        alimentation: 22800,
        carburant: 1900,
        main_oeuvre: 8200,
        materiel: 4200,
        autres_charges_operationnelles: 5600,
      },
      customCharges: [
        { id: 'veto', libelle: 'Veterinaire', montant: 2400 },
        { id: 'paille', libelle: 'Paille / litiere', montant: 3100 },
      ],
      customRevenues: [
        { id: 'fumier', libelle: 'Valorisation fumier', montant: 1250 },
      ],
    },
  },
  circuit: {
    code: 'circuit-court',
    title: 'Circuit court',
    icon: FiShoppingBag,
    color: 'amber',
    description: 'Paniers, boutique, marche, restauration, collectivite et invendus.',
    scenario: {
      libelle: 'Paniers legumes hebdo',
      atelier_type: 'circuit-court',
      canal: 'circuit-court',
      unite_reference: 'panier',
      surface_ha: 1200,
      quantite_reference: 1200,
      rendement: 1,
      prix_unitaire: 24.5,
      aides: 0,
      pertes_percent: 7,
      variation_prix_percent: -5,
      variation_rendement_percent: -6,
      objectif_marge_percent: 25,
      charges: {
        semences: 1800,
        engrais: 1450,
        phytos: 360,
        alimentation: 0,
        carburant: 780,
        main_oeuvre: 9400,
        materiel: 1800,
        autres_charges_operationnelles: 2100,
      },
      customCharges: [
        { id: 'emballage', libelle: 'Emballage', montant: 1560 },
        { id: 'livraison', libelle: 'Livraison', montant: 1850 },
        { id: 'commission', libelle: 'Commission plateforme', montant: 980 },
      ],
      customRevenues: [
        { id: 'atelier', libelle: 'Ateliers ferme', montant: 1400 },
      ],
    },
  },
}

const defaultRation = {
  lot: 'Lot laitier',
  effectif: 52,
  objectif_sucre_percent: 6.5,
  objectif_mat_percent: 14,
  ingredients: [
    { id: 'ensilage-mais', nom: 'Ensilage mais', kg_ms: 8.8, prix_kg_ms: 0.13, sucre_soluble_percent: 3.2, mat_percent: 7.5, ufl_kg_ms: 0.92 },
    { id: 'foin-luzerne', nom: 'Foin luzerne', kg_ms: 3.4, prix_kg_ms: 0.19, sucre_soluble_percent: 7.8, mat_percent: 17.5, ufl_kg_ms: 0.72 },
    { id: 'cereales', nom: 'Cereales aplaties', kg_ms: 2.6, prix_kg_ms: 0.28, sucre_soluble_percent: 4.5, mat_percent: 10.8, ufl_kg_ms: 1.05 },
    { id: 'correcteur', nom: 'Correcteur azote', kg_ms: 1.1, prix_kg_ms: 0.48, sucre_soluble_percent: 6.2, mat_percent: 34, ufl_kg_ms: 0.95 },
  ],
}

const formatCurrency = (value, digits = 0) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: digits }).format(value || 0)
const formatNumber = (value, digits = 1) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(value || 0)
const formatPercent = (value) => `${formatNumber(value, 1)}%`
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
const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
const clonePreset = (preset) => JSON.parse(JSON.stringify(preset.scenario))
const sumLines = (lines) => lines.reduce((sum, line) => sum + toNumber(line.montant), 0)

const buildMarginPayload = (scenario) => ({
  libelle: scenario.libelle,
  atelier_type: scenario.atelier_type,
  canal: scenario.canal,
  unite_reference: scenario.unite_reference,
  quantite_reference: toNumber(scenario.quantite_reference) || toNumber(scenario.surface_ha),
  surface_ha: Math.max(toNumber(scenario.surface_ha), 0.01),
  rendement: Math.max(toNumber(scenario.rendement), 0),
  prix_unitaire: Math.max(toNumber(scenario.prix_unitaire), 0),
  aides: Math.max(toNumber(scenario.aides), 0),
  semences: Math.max(toNumber(scenario.charges.semences), 0),
  engrais: Math.max(toNumber(scenario.charges.engrais), 0),
  phytos: Math.max(toNumber(scenario.charges.phytos), 0),
  alimentation: Math.max(toNumber(scenario.charges.alimentation), 0),
  carburant: Math.max(toNumber(scenario.charges.carburant), 0),
  main_oeuvre: Math.max(toNumber(scenario.charges.main_oeuvre), 0),
  materiel: Math.max(toNumber(scenario.charges.materiel), 0),
  autres_charges_operationnelles: Math.max(toNumber(scenario.charges.autres_charges_operationnelles), 0),
  pertes_percent: Math.max(toNumber(scenario.pertes_percent), 0),
  variation_prix_percent: toNumber(scenario.variation_prix_percent),
  variation_rendement_percent: toNumber(scenario.variation_rendement_percent),
  objectif_marge_percent: Math.max(toNumber(scenario.objectif_marge_percent), 0),
  charges_personnalisees: scenario.customCharges.map(({ id, libelle, montant }) => ({ id, libelle, montant: Math.max(toNumber(montant), 0) })),
  revenus_personnalises: scenario.customRevenues.map(({ id, libelle, montant }) => ({ id, libelle, montant: Math.max(toNumber(montant), 0) })),
})

const calculateMarginLocal = (payload) => {
  const quantity = payload.surface_ha * payload.rendement
  const stressedQuantity = payload.surface_ha * payload.rendement * (1 + payload.variation_rendement_percent / 100)
  const stressedPrice = payload.prix_unitaire * (1 + payload.variation_prix_percent / 100)
  const customCharges = sumLines(payload.charges_personnalisees)
  const customRevenues = sumLines(payload.revenus_personnalises)
  const standardCharges = ['semences', 'engrais', 'phytos', 'alimentation', 'carburant', 'main_oeuvre', 'materiel', 'autres_charges_operationnelles'].reduce((sum, key) => sum + toNumber(payload[key]), 0)
  const saleRevenue = quantity * payload.prix_unitaire
  const revenue = saleRevenue + payload.aides + customRevenues
  const stressedRevenue = stressedQuantity * stressedPrice + payload.aides + customRevenues
  const losses = (saleRevenue + customRevenues) * (payload.pertes_percent / 100)
  const charges = standardCharges + customCharges
  const margin = revenue - charges - losses
  const stressedMargin = stressedRevenue - charges - losses
  const reference = payload.quantite_reference || payload.surface_ha || 1
  const breakEvenPrice = quantity ? (charges + losses - payload.aides - customRevenues) / quantity : 0
  const breakEvenYield = payload.prix_unitaire ? (charges + losses - payload.aides - customRevenues) / (payload.surface_ha * payload.prix_unitaire) : 0
  const marginRate = revenue ? (margin / revenue) * 100 : 0

  return {
    scenario: payload.libelle,
    atelier_type: payload.atelier_type,
    canal: payload.canal,
    unite_reference: payload.unite_reference,
    quantite_produite: quantity,
    produit_total: revenue,
    produit_vente: saleRevenue,
    revenus_personnalises: customRevenues,
    produit_stresse: stressedRevenue,
    charges_operationnelles: charges,
    charges_standard: standardCharges,
    charges_personnalisees: customCharges,
    pertes_estimees: losses,
    marge_brute: margin,
    marge_stressee: stressedMargin,
    marge_brute_ha: margin / Math.max(payload.surface_ha, 1),
    marge_reference: margin / Math.max(reference, 1),
    taux_marge_percent: marginRate,
    ecart_objectif_percent: marginRate - payload.objectif_marge_percent,
    prix_equilibre: breakEvenPrice,
    rendement_equilibre: breakEvenYield,
    cout_revient_unitaire: breakEvenPrice,
    analyse: margin >= 0 ? 'rentable' : 'a revoir',
    recommandations: stressedMargin < 0 ? ['Scenario fragile en stress test.'] : ['Scenario coherent, a comparer au realise.'],
    details: { charges: [], revenus: payload.revenus_personnalises },
  }
}

const buildRationPayload = (ration) => ({
  lot: ration.lot,
  effectif: Math.max(toNumber(ration.effectif), 1),
  objectif_sucre_percent: Math.max(toNumber(ration.objectif_sucre_percent), 0),
  objectif_mat_percent: Math.max(toNumber(ration.objectif_mat_percent), 0),
  ingredients: ration.ingredients.map(({ nom, kg_ms, prix_kg_ms, sucre_soluble_percent, mat_percent, ufl_kg_ms }) => ({
    nom,
    kg_ms: Math.max(toNumber(kg_ms), 0),
    prix_kg_ms: Math.max(toNumber(prix_kg_ms), 0),
    sucre_soluble_percent: Math.max(toNumber(sucre_soluble_percent), 0),
    mat_percent: Math.max(toNumber(mat_percent), 0),
    ufl_kg_ms: Math.max(toNumber(ufl_kg_ms), 0),
  })),
})

const calculateRationLocal = (payload) => {
  const totalMs = payload.ingredients.reduce((sum, item) => sum + item.kg_ms, 0)
  const divisor = Math.max(totalMs, 0.01)
  const sugar = payload.ingredients.reduce((sum, item) => sum + item.kg_ms * item.sucre_soluble_percent, 0) / divisor
  const mat = payload.ingredients.reduce((sum, item) => sum + item.kg_ms * item.mat_percent, 0) / divisor
  const ufl = payload.ingredients.reduce((sum, item) => sum + item.kg_ms * item.ufl_kg_ms, 0)
  const cost = payload.ingredients.reduce((sum, item) => sum + item.kg_ms * item.prix_kg_ms, 0)
  const alerts = []
  if (sugar < payload.objectif_sucre_percent) alerts.push('Sucres solubles sous objectif.')
  if (mat < payload.objectif_mat_percent) alerts.push('MAT sous objectif.')
  if (!alerts.length) alerts.push('Ration equilibree sur les indicateurs suivis.')

  return {
    lot: payload.lot,
    effectif: payload.effectif,
    kg_ms_animal: totalMs,
    sucre_soluble_percent: sugar,
    mat_percent: mat,
    ufl_animal: ufl,
    cout_animal: cost,
    cout_lot: cost * payload.effectif,
    alertes: alerts,
    ingredients: payload.ingredients,
  }
}

const simulateMargin = async (payload) => {
  const response = await axios.post(`${API_URL}/pilotage/marges/simuler`, payload)
  return response.data
}

const simulateRation = async (payload) => {
  const response = await axios.post(`${API_URL}/pilotage/marges/ration`, payload)
  return response.data
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'slate' }) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    sky: 'border-sky-200 bg-sky-50 text-sky-950',
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    rose: 'border-rose-200 bg-rose-50 text-rose-950',
    slate: 'border-slate-200 bg-white text-slate-950',
  }
  return (
    <article className={`rounded-lg border p-4 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs opacity-75">{detail}</p>
    </article>
  )
}

function NumberInput({ label, value, onChange, suffix, step = '0.01' }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <div className="flex rounded-lg border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-l-lg border-0 px-3 py-2 text-sm outline-none"
        />
        {suffix && <span className="flex min-w-[74px] items-center justify-center rounded-r-lg bg-slate-50 px-2 text-xs text-slate-500">{suffix}</span>}
      </div>
    </label>
  )
}

export default function MargesPage() {
  const [activeMode, setActiveMode] = useState('culture')
  const [scenario, setScenario] = useState(() => clonePreset(atelierPresets.culture))
  const [ration, setRation] = useState(defaultRation)
  const marginPayload = useMemo(() => buildMarginPayload(scenario), [scenario])
  const rationPayload = useMemo(() => buildRationPayload(ration), [ration])

  const { data: apiMargin, isFetching: marginLoading, isError: marginError } = useQuery(
    ['pilotage-marges-simulation', marginPayload],
    () => simulateMargin(marginPayload),
    { enabled: activeMode !== 'ration', keepPreviousData: true, staleTime: 1000 }
  )
  const { data: apiRation, isFetching: rationLoading, isError: rationError } = useQuery(
    ['pilotage-marges-ration', rationPayload],
    () => simulateRation(rationPayload),
    { enabled: activeMode === 'ration', keepPreviousData: true, staleTime: 1000 }
  )

  const marginResult = apiMargin || calculateMarginLocal(marginPayload)
  const rationResult = apiRation || calculateRationLocal(rationPayload)
  const activePreset = atelierPresets[activeMode] || atelierPresets.culture
  const ActiveIcon = activePreset.icon || FiSliders
  const chargeBars = [
    ...Object.entries(scenario.charges).map(([key, value]) => ({ id: key, label: standardChargeLabels[key], montant: toNumber(value), standard: true })),
    ...scenario.customCharges.map((line) => ({ ...line, standard: false })),
  ].filter((line) => line.montant > 0)
  const maxCharge = Math.max(...chargeBars.map((line) => line.montant), 1)
  const scenarioCards = [
    { label: 'Base', value: marginResult.marge_brute, detail: `${formatPercent(marginResult.taux_marge_percent)} de marge` },
    { label: 'Prudent', value: marginResult.marge_stressee, detail: `prix ${scenario.variation_prix_percent}% / volume ${scenario.variation_rendement_percent}%` },
    { label: 'Objectif', value: marginResult.produit_total * (scenario.objectif_marge_percent / 100), detail: `${scenario.objectif_marge_percent}% attendu` },
  ]

  const selectMode = (mode) => {
    setActiveMode(mode)
    if (mode !== 'ration') setScenario(clonePreset(atelierPresets[mode]))
  }

  const updateScenario = (patch) => setScenario((current) => ({ ...current, ...patch }))
  const updateCharge = (key, value) => setScenario((current) => ({ ...current, charges: { ...current.charges, [key]: value } }))
  const updateLine = (collection, id, patch) => setScenario((current) => ({
    ...current,
    [collection]: current[collection].map((line) => (line.id === id ? { ...line, ...patch } : line)),
  }))
  const addLine = (collection, defaults) => setScenario((current) => ({
    ...current,
    [collection]: [...current[collection], { id: `${collection}-${Date.now()}`, ...defaults }],
  }))
  const removeLine = (collection, id) => setScenario((current) => ({
    ...current,
    [collection]: current[collection].filter((line) => line.id !== id),
  }))
  const reorderScenarioLine = (collection, sourceId, targetId) => setScenario((current) => ({
    ...current,
    [collection]: reorderLines(current[collection], sourceId, targetId),
  }))

  const updateIngredient = (id, patch) => setRation((current) => ({
    ...current,
    ingredients: current.ingredients.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }))
  const addIngredient = () => setRation((current) => ({
    ...current,
    ingredients: [...current.ingredients, { id: `ingredient-${Date.now()}`, nom: 'Nouvel aliment', kg_ms: 1, prix_kg_ms: 0.2, sucre_soluble_percent: 5, mat_percent: 12, ufl_kg_ms: 0.85 }],
  }))
  const removeIngredient = (id) => setRation((current) => ({
    ...current,
    ingredients: current.ingredients.filter((item) => item.id !== id),
  }))
  const reorderIngredient = (sourceId, targetId) => setRation((current) => ({
    ...current,
    ingredients: reorderLines(current.ingredients, sourceId, targetId),
  }))
  const applyRationToAnimalMargin = () => {
    const costCycle = rationResult.cout_lot * 180
    setActiveMode('elevage')
    setScenario((current) => {
      const base = current.atelier_type === 'elevage' ? current : clonePreset(atelierPresets.elevage)
      return { ...base, charges: { ...base.charges, alimentation: Math.round(costCycle) } }
    })
  }

  return (
    <Layout>
      <Head>
        <title>Marges - FarmFlow</title>
        <meta name="description" content="Atelier marges, prix de revient, circuit court, elevage et ration FarmFlow." />
      </Head>

      <section className="command-panel mb-5 overflow-hidden p-5 text-white">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.52fr] xl:items-end">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-100">
              Prix de revient & decisions
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Atelier marges</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
              Simule culture, animal et circuit court avec postes personnalisables, revenus annexes, stress test et ration.
            </p>
            {(marginError || rationError) && <p className="mt-3 text-sm text-amber-100">Mode local actif pour le calcul affiche.</p>}
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-2">
            {Object.values(atelierPresets).map((preset) => {
              const Icon = preset.icon
              return (
                <button
                  key={preset.code}
                  onClick={() => selectMode(preset.code === 'circuit-court' ? 'circuit' : preset.code)}
                  className={`rounded-lg border p-3 text-left transition ${activeMode === (preset.code === 'circuit-court' ? 'circuit' : preset.code) ? 'border-emerald-300/50 bg-emerald-400/20 text-white' : 'border-white/15 bg-white/10 text-slate-200 hover:bg-white/15'}`}
                >
                  <Icon className="h-5 w-5" />
                  <p className="mt-2 text-sm font-semibold">{preset.title}</p>
                </button>
              )
            })}
            <button
              onClick={() => setActiveMode('ration')}
              className={`rounded-lg border p-3 text-left transition ${activeMode === 'ration' ? 'border-emerald-300/50 bg-emerald-400/20 text-white' : 'border-white/15 bg-white/10 text-slate-200 hover:bg-white/15'}`}
            >
              <FiActivity className="h-5 w-5" />
              <p className="mt-2 text-sm font-semibold">Ration</p>
            </button>
          </div>
        </div>
      </section>

      {activeMode !== 'ration' ? (
        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <section className="surface p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <ActiveIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Hypotheses {activePreset.title.toLowerCase()}</h2>
                    <p className="text-xs text-slate-500">{activePreset.description}</p>
                  </div>
                </div>
                {marginLoading && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Calcul API</span>}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-slate-500">Nom du scenario</span>
                  <input value={scenario.libelle} onChange={(event) => updateScenario({ libelle: event.target.value })} className="input" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-slate-500">Canal</span>
                  <select value={scenario.canal} onChange={(event) => updateScenario({ canal: event.target.value })} className="input">
                    <option value="coop">Cooperative</option>
                    <option value="pro">Professionnel</option>
                    <option value="circuit-court">Circuit court</option>
                    <option value="collectivite">Collectivite</option>
                    <option value="boutique">Boutique ferme</option>
                    <option value="marche">Marche</option>
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-slate-500">Unite de lecture</span>
                  <input value={scenario.unite_reference} onChange={(event) => updateScenario({ unite_reference: event.target.value })} className="input" />
                </label>
                <NumberInput label={scenario.atelier_type === 'culture' ? 'Surface' : 'Effectif / lots'} value={scenario.surface_ha} suffix={scenario.atelier_type === 'culture' ? 'ha' : scenario.unite_reference} onChange={(value) => updateScenario({ surface_ha: value, quantite_reference: value })} />
                <NumberInput label="Rendement / volume" value={scenario.rendement} suffix="unite" onChange={(value) => updateScenario({ rendement: value })} />
                <NumberInput label="Prix unitaire" value={scenario.prix_unitaire} suffix="EUR" onChange={(value) => updateScenario({ prix_unitaire: value })} />
                <NumberInput label="Aides / primes" value={scenario.aides} suffix="EUR" onChange={(value) => updateScenario({ aides: value })} />
              </div>

              <div className="mt-5 grid gap-4">
                <label>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">Pertes / invendus</span>
                    <span className="text-slate-500">{scenario.pertes_percent}%</span>
                  </div>
                  <input type="range" min="0" max="30" value={scenario.pertes_percent} onChange={(event) => updateScenario({ pertes_percent: Number(event.target.value) })} className="w-full" />
                </label>
                <label>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">Stress prix</span>
                    <span className="text-slate-500">{scenario.variation_prix_percent}%</span>
                  </div>
                  <input type="range" min="-45" max="45" value={scenario.variation_prix_percent} onChange={(event) => updateScenario({ variation_prix_percent: Number(event.target.value) })} className="w-full" />
                </label>
                <label>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">Stress volume</span>
                    <span className="text-slate-500">{scenario.variation_rendement_percent}%</span>
                  </div>
                  <input type="range" min="-45" max="45" value={scenario.variation_rendement_percent} onChange={(event) => updateScenario({ variation_rendement_percent: Number(event.target.value) })} className="w-full" />
                </label>
              </div>
            </section>

            <section className="surface p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FiSliders className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-lg font-semibold text-slate-950">Postes de charges</h2>
                </div>
                <button onClick={() => addLine('customCharges', { libelle: 'Nouveau poste', montant: 0 })} className="btn btn-outline gap-2">
                  <FiPlus className="h-4 w-4" />
                  Ajouter
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(scenario.charges).map(([key, value]) => (
                  <NumberInput key={key} label={standardChargeLabels[key]} value={value} suffix="EUR" onChange={(nextValue) => updateCharge(key, nextValue)} />
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {scenario.customCharges.map((line) => (
                  <div
                    key={line.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      reorderScenarioLine('customCharges', getReorderPayload(event), line.id)
                    }}
                    className="grid gap-2 rounded-lg border border-slate-200 p-2 md:grid-cols-[42px_1fr_160px_42px]"
                  >
                    <button type="button" draggable onDragStart={(event) => setReorderPayload(event, line.id)} className="inline-flex h-10 cursor-grab items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 active:cursor-grabbing" title="Reorganiser">
                      <FiMove className="h-4 w-4" />
                    </button>
                    <input value={line.libelle} onChange={(event) => updateLine('customCharges', line.id, { libelle: event.target.value })} className="input" />
                    <input type="number" value={line.montant} onChange={(event) => updateLine('customCharges', line.id, { montant: event.target.value })} className="input" />
                    <button onClick={() => removeLine('customCharges', line.id)} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" title="Supprimer">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FiDollarSign className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-lg font-semibold text-slate-950">Revenus annexes</h2>
                </div>
                <button onClick={() => addLine('customRevenues', { libelle: 'Nouveau revenu', montant: 0 })} className="btn btn-outline gap-2">
                  <FiPlus className="h-4 w-4" />
                  Ajouter
                </button>
              </div>
              <div className="space-y-2">
                {scenario.customRevenues.map((line) => (
                  <div
                    key={line.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      reorderScenarioLine('customRevenues', getReorderPayload(event), line.id)
                    }}
                    className="grid gap-2 rounded-lg border border-slate-200 p-2 md:grid-cols-[42px_1fr_160px_42px]"
                  >
                    <button type="button" draggable onDragStart={(event) => setReorderPayload(event, line.id)} className="inline-flex h-10 cursor-grab items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 active:cursor-grabbing" title="Reorganiser">
                      <FiMove className="h-4 w-4" />
                    </button>
                    <input value={line.libelle} onChange={(event) => updateLine('customRevenues', line.id, { libelle: event.target.value })} className="input" />
                    <input type="number" value={line.montant} onChange={(event) => updateLine('customRevenues', line.id, { montant: event.target.value })} className="input" />
                    <button onClick={() => removeLine('customRevenues', line.id)} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" title="Supprimer">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="grid gap-3 md:grid-cols-2">
              <MetricCard icon={FiTrendingUp} label="Marge brute" value={formatCurrency(marginResult.marge_brute)} detail={`${formatCurrency(marginResult.marge_reference)} / ${marginResult.unite_reference}`} tone={marginResult.marge_brute >= 0 ? 'emerald' : 'rose'} />
              <MetricCard icon={FiDollarSign} label="Cout revient" value={formatCurrency(marginResult.cout_revient_unitaire, 2)} detail="prix minimum par unite vendue" tone="sky" />
              <MetricCard icon={FiTrendingDown} label="Stress test" value={formatCurrency(marginResult.marge_stressee)} detail={`prix ${scenario.variation_prix_percent}% / volume ${scenario.variation_rendement_percent}%`} tone={marginResult.marge_stressee >= 0 ? 'amber' : 'rose'} />
              <MetricCard icon={FiActivity} label="Taux marge" value={formatPercent(marginResult.taux_marge_percent)} detail={`ecart objectif ${formatPercent(marginResult.ecart_objectif_percent)}`} tone="slate" />
            </section>

            <section className="surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <FiBarChart2 className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-semibold text-slate-950">Structure des charges</h2>
              </div>
              <div className="space-y-3">
                {chargeBars.map((line) => (
                  <div key={line.id} className="grid grid-cols-[130px_1fr_92px] items-center gap-3">
                    <span className="truncate text-sm text-slate-600">{line.label || line.libelle}</span>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max((line.montant / maxCharge) * 100, 2)}%` }} />
                    </div>
                    <span className="text-right text-sm font-medium text-slate-950">{formatCurrency(line.montant)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <FiRefreshCcw className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-semibold text-slate-950">Comparaison scenario</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {scenarioCards.map((card) => (
                  <div key={card.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{card.label}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(card.value)}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <FiAlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-slate-950">Lecture metier</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Produit total</p>
                  <p className="mt-1 font-semibold text-slate-950">{formatCurrency(marginResult.produit_total)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Charges</p>
                  <p className="mt-1 font-semibold text-slate-950">{formatCurrency(marginResult.charges_operationnelles + marginResult.pertes_estimees)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Seuil rendement</p>
                  <p className="mt-1 font-semibold text-slate-950">{formatNumber(marginResult.rendement_equilibre, 2)}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {(marginResult.recommandations || []).map((item) => (
                  <p key={item} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">{item}</p>
                ))}
              </div>
            </section>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            <section className="surface p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <FiActivity className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Calculateur ration</h2>
                    <p className="text-xs text-slate-500">Kg MS, sucres solubles, MAT, UFL et cout alimentaire.</p>
                  </div>
                </div>
                {rationLoading && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Calcul API</span>}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label>
                  <span className="mb-1 block text-xs font-medium text-slate-500">Lot</span>
                  <input value={ration.lot} onChange={(event) => setRation((current) => ({ ...current, lot: event.target.value }))} className="input" />
                </label>
                <NumberInput label="Effectif" value={ration.effectif} suffix="tetes" onChange={(value) => setRation((current) => ({ ...current, effectif: value }))} />
                <NumberInput label="Objectif sucres solubles" value={ration.objectif_sucre_percent} suffix="% MS" onChange={(value) => setRation((current) => ({ ...current, objectif_sucre_percent: value }))} />
                <NumberInput label="Objectif MAT" value={ration.objectif_mat_percent} suffix="% MS" onChange={(value) => setRation((current) => ({ ...current, objectif_mat_percent: value }))} />
              </div>
            </section>

            <section className="surface p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">Ingredients</h2>
                <button onClick={addIngredient} className="btn btn-outline gap-2">
                  <FiPlus className="h-4 w-4" />
                  Ajouter
                </button>
              </div>
              <div className="space-y-3">
                {ration.ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      reorderIngredient(getReorderPayload(event), ingredient.id)
                    }}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="mb-3 grid gap-2 md:grid-cols-[42px_1fr_42px]">
                      <button type="button" draggable onDragStart={(event) => setReorderPayload(event, ingredient.id)} className="inline-flex h-10 cursor-grab items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 active:cursor-grabbing" title="Reorganiser">
                        <FiMove className="h-4 w-4" />
                      </button>
                      <input value={ingredient.nom} onChange={(event) => updateIngredient(ingredient.id, { nom: event.target.value })} className="input" />
                      <button onClick={() => removeIngredient(ingredient.id)} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" title="Supprimer">
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-5">
                      <NumberInput label="kg MS" value={ingredient.kg_ms} suffix="kg" onChange={(value) => updateIngredient(ingredient.id, { kg_ms: value })} />
                      <NumberInput label="Prix kg MS" value={ingredient.prix_kg_ms} suffix="EUR" onChange={(value) => updateIngredient(ingredient.id, { prix_kg_ms: value })} />
                      <NumberInput label="Sucres" value={ingredient.sucre_soluble_percent} suffix="%" onChange={(value) => updateIngredient(ingredient.id, { sucre_soluble_percent: value })} />
                      <NumberInput label="MAT" value={ingredient.mat_percent} suffix="%" onChange={(value) => updateIngredient(ingredient.id, { mat_percent: value })} />
                      <NumberInput label="UFL" value={ingredient.ufl_kg_ms} suffix="/kg" onChange={(value) => updateIngredient(ingredient.id, { ufl_kg_ms: value })} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="grid gap-3 md:grid-cols-2">
              <MetricCard icon={FiActivity} label="Kg MS" value={formatNumber(rationResult.kg_ms_animal, 2)} detail="par animal et par jour" tone="emerald" />
              <MetricCard icon={FiTrendingUp} label="Sucres solubles" value={formatPercent(rationResult.sucre_soluble_percent)} detail={`objectif ${formatPercent(ration.objectif_sucre_percent)}`} tone="amber" />
              <MetricCard icon={FiBarChart2} label="MAT" value={formatPercent(rationResult.mat_percent)} detail={`objectif ${formatPercent(ration.objectif_mat_percent)}`} tone="sky" />
              <MetricCard icon={FiDollarSign} label="Cout lot" value={formatCurrency(rationResult.cout_lot, 2)} detail={`${formatCurrency(rationResult.cout_animal, 2)} / animal / jour`} tone="slate" />
            </section>

            <section className="surface p-5">
              <h2 className="text-lg font-semibold text-slate-950">Lecture ration</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">UFL animal</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{formatNumber(rationResult.ufl_animal, 2)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Projection 180 jours</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(rationResult.cout_lot * 180)}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {(rationResult.alertes || []).map((item) => (
                  <p key={item} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{item}</p>
                ))}
              </div>
              <button onClick={applyRationToAnimalMargin} className="mt-4 btn btn-primary w-full gap-2">
                <FiRefreshCcw className="h-4 w-4" />
                Injecter le cout ration dans marge animal
              </button>
            </section>
          </div>
        </section>
      )}
    </Layout>
  )
}
