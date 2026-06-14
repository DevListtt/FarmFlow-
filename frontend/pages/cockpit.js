import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiMove,
  FiPackage,
  FiRefreshCcw,
  FiSave,
  FiSettings,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
} from 'react-icons/fi'
import Layout from '../components/Layout'
import { fetchPilotageCockpit, fetchPilotageCockpitConfiguration, updatePilotageCockpitConfiguration } from '../lib/pilotageApi'
import { useStoredOrder } from '../lib/useStoredOrder'

const SERVER_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const fallbackCockpit = {
  periode: { label: 'Campagne 2026' },
  mis_a_jour: new Date().toISOString(),
  kpis: [
    { code: 'ca', label: "Chiffre d'affaires", value: 184620, unit: 'EUR', trend: 12.4, target: 210000, status: 'ok' },
    { code: 'marge', label: 'Marge brute', value: 68450, unit: 'EUR', trend: 8.7, target: 72000, status: 'a-surveiller' },
    { code: 'tresorerie', label: 'Tresorerie 30 j', value: 42380, unit: 'EUR', trend: -6.2, target: 50000, status: 'a-surveiller' },
    { code: 'stock', label: 'Stock valorise', value: 58740, unit: 'EUR', trend: 4.1, target: 54000, status: 'ok' },
    { code: 'commandes', label: 'Commandes ouvertes', value: 37, unit: 'commandes', trend: 18, target: 28, status: 'attention' },
  ],
  series: {
    revenu_marge: [
      { mois: 'Jan', ca: 14200, marge: 4700, objectif: 13500 },
      { mois: 'Fev', ca: 15800, marge: 5200, objectif: 14500 },
      { mois: 'Mar', ca: 18600, marge: 6900, objectif: 16000 },
      { mois: 'Avr', ca: 21400, marge: 8100, objectif: 18500 },
      { mois: 'Mai', ca: 26800, marge: 10300, objectif: 23000 },
      { mois: 'Juin', ca: 31800, marge: 12100, objectif: 27000 },
      { mois: 'Juil', ca: 35400, marge: 13600, objectif: 31500 },
      { mois: 'Aout', ca: 30620, marge: 11650, objectif: 29000 },
    ],
    tresorerie: [
      { semaine: 'S1', solde: 51800, encaissements: 12600, decaissements: 9800 },
      { semaine: 'S2', solde: 49300, encaissements: 8400, decaissements: 10900 },
      { semaine: 'S3', solde: 46500, encaissements: 7200, decaissements: 10000 },
      { semaine: 'S4', solde: 42380, encaissements: 9800, decaissements: 13920 },
      { semaine: 'S5', solde: 39800, encaissements: 11200, decaissements: 13780 },
      { semaine: 'S6', solde: 45600, encaissements: 18300, decaissements: 12500 },
    ],
    ventes_canaux: [
      { canal: 'Boutique', montant: 52800, marge: 20100 },
      { canal: 'Marche', montant: 31400, marge: 11900 },
      { canal: 'Professionnels', montant: 64200, marge: 22400 },
      { canal: 'Collectivites', montant: 23600, marge: 8600 },
      { canal: 'Paniers', montant: 12620, marge: 5450 },
    ],
    marges_ateliers: [
      { atelier: 'Ble tendre', marge: 1180, objectif: 1050, risque: 38 },
      { atelier: 'Maraichage', marge: 8600, objectif: 7800, risque: 52 },
      { atelier: 'Bovin', marge: 410, objectif: 460, risque: 69 },
      { atelier: 'Boutique', marge: 1320, objectif: 1200, risque: 34 },
      { atelier: 'Transformation', marge: 980, objectif: 1100, risque: 58 },
    ],
    charges: [
      { poste: 'Intrants', budget: 32500, realise: 34800 },
      { poste: 'Aliments', budget: 21400, realise: 22800 },
      { poste: 'Main oeuvre', budget: 28500, realise: 27100 },
      { poste: 'Materiel', budget: 18400, realise: 16900 },
      { poste: 'Energie', budget: 9700, realise: 11200 },
    ],
    sante: [
      { axe: 'Tresorerie', score: 72 },
      { axe: 'Marge', score: 78 },
      { axe: 'Stock', score: 84 },
      { axe: 'Ventes', score: 88 },
      { axe: 'Compta', score: 69 },
      { axe: 'Planning', score: 74 },
    ],
  },
  risques: [
    { label: 'Rapprochement banque', niveau: 78, impact: 'Tresorerie et cloture', route: '/comptabilite' },
    { label: 'Stock pommes de terre', niveau: 64, impact: 'Rupture possible en boutique', route: '/stocks' },
    { label: 'Marge lot bovin', niveau: 69, impact: 'Alimentation au-dessus budget', route: '/marges' },
    { label: 'Commandes collectivites', niveau: 56, impact: 'Capacite preparation a confirmer', route: '/commandes' },
  ],
  decisions: [
    { priorite: 'haute', titre: 'Rapprocher 14 operations bancaires', impact: '+ fiabilite tresorerie et compta', gain_estime: 0, route: '/comptabilite' },
    { priorite: 'haute', titre: 'Recalculer le prix du lot bovin', impact: '+ 5 a 8 points de marge possibles', gain_estime: 3200, route: '/marges' },
    { priorite: 'moyenne', titre: 'Preparer les commandes collectivites', impact: 'eviter retards et ruptures', gain_estime: 1850, route: '/commandes' },
    { priorite: 'moyenne', titre: 'Reapprovisionner emballages boutique', impact: 'securiser ventes circuit court', gain_estime: 920, route: '/stocks' },
  ],
  alertes: [
    { niveau: 'warning', titre: 'Tresorerie sous objectif', description: 'Le solde projete descend sous 40 000 EUR en S5 avant remontee attendue.' },
    { niveau: 'warning', titre: 'Charges energie au-dessus budget', description: 'Ecart de 1 500 EUR a analyser avec carburant et froid.' },
    { niveau: 'success', titre: 'Ventes boutique solides', description: "La marge boutique reste au-dessus de l'objectif." },
  ],
}

const chartColors = ['#0f766e', '#0284c7', '#d97706', '#be123c', '#7c3aed', '#334155']
const defaultCockpitConfiguration = {
  profil: 'exploitant',
  objectifs: {
    ca: 210000,
    marge: 72000,
    tresorerie: 50000,
    stock: 54000,
    commandes: 28,
    ca_mensuel: 17500,
  },
  regles: {
    marge_min_percent: 35,
    tresorerie_warning_ratio: 0.9,
    objectif_warning_ratio: 0.75,
    bank_priority_threshold: 1,
    orders_attention_threshold: 5,
    displayed_kpis: ['ca', 'marge', 'tresorerie', 'stock', 'commandes'],
  },
  affichage: {
    modules: {
      revenu_marge: true,
      tresorerie: true,
      ventes_canaux: true,
      charges: true,
      sante: true,
      marges_ateliers: true,
      risques: true,
      decisions: true,
      alertes: true,
    },
  },
}

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value || 0))
const formatNumber = (value) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
const formatPercent = (value) => `${Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`

const formatKpiValue = (kpi) => {
  if (kpi.unit === 'EUR') return formatCurrency(kpi.value)
  return `${formatNumber(kpi.value)} ${kpi.unit || ''}`.trim()
}

const setReorderPayload = (event, id) => {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/x-farmflow-order', id)
  event.dataTransfer.setData('text/plain', id)
}

const getReorderPayload = (event) => event.dataTransfer.getData('application/x-farmflow-order') || event.dataTransfer.getData('text/plain')

const statusClass = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'a-surveiller': 'border-amber-200 bg-amber-50 text-amber-900',
  attention: 'border-rose-200 bg-rose-50 text-rose-900',
}

const decisionClass = {
  haute: 'border-rose-200 bg-rose-50 text-rose-900',
  moyenne: 'border-amber-200 bg-amber-50 text-amber-900',
  basse: 'border-slate-200 bg-slate-50 text-slate-700',
}

const objectiveFields = [
  { code: 'ca', label: "CA cible", unit: 'EUR' },
  { code: 'marge', label: 'Marge cible', unit: 'EUR' },
  { code: 'tresorerie', label: 'Tresorerie mini', unit: 'EUR' },
  { code: 'stock', label: 'Stock cible', unit: 'EUR' },
  { code: 'commandes', label: 'Commandes max', unit: 'nb' },
  { code: 'ca_mensuel', label: 'CA mensuel', unit: 'EUR' },
]

const ruleFields = [
  { code: 'marge_min_percent', label: 'Marge mini', step: 1, unit: '%' },
  { code: 'tresorerie_warning_ratio', label: 'Seuil treso', step: 0.05, unit: 'ratio' },
  { code: 'objectif_warning_ratio', label: 'Seuil KPI', step: 0.05, unit: 'ratio' },
  { code: 'bank_priority_threshold', label: 'Banque prioritaire', step: 1, unit: 'ops' },
  { code: 'orders_attention_threshold', label: 'Commandes attention', step: 1, unit: 'cmd' },
]

const kpiChoices = [
  { code: 'ca', label: 'CA' },
  { code: 'marge', label: 'Marge' },
  { code: 'tresorerie', label: 'Treso' },
  { code: 'stock', label: 'Stock' },
  { code: 'commandes', label: 'Commandes' },
]

const moduleChoices = [
  { code: 'revenu_marge', label: 'CA marge' },
  { code: 'tresorerie', label: 'Treso' },
  { code: 'ventes_canaux', label: 'Canaux' },
  { code: 'charges', label: 'Charges' },
  { code: 'sante', label: 'Sante' },
  { code: 'marges_ateliers', label: 'Ateliers' },
  { code: 'decisions', label: 'Decisions' },
  { code: 'risques', label: 'Risques' },
  { code: 'alertes', label: 'Alertes' },
]

function KpiCard({ kpi }) {
  const Icon = kpi.code === 'tresorerie'
    ? FiCreditCard
    : kpi.code === 'stock'
      ? FiPackage
      : kpi.code === 'marge'
        ? FiTrendingUp
        : kpi.code === 'commandes'
          ? FiTarget
          : FiDollarSign
  const trendUp = Number(kpi.trend || 0) >= 0
  const completion = kpi.target ? Math.min(Math.round((Number(kpi.value || 0) / Number(kpi.target || 1)) * 100), 140) : 0

  return (
    <article className="surface relative overflow-hidden p-4">
      <div className={`absolute inset-x-0 top-0 h-1 ${kpi.status === 'attention' ? 'bg-rose-500' : kpi.status === 'a-surveiller' ? 'bg-amber-500' : 'bg-emerald-600'}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatKpiValue(kpi)}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold ${statusClass[kpi.status] || statusClass.ok}`}>
          {trendUp ? <FiTrendingUp className="h-3.5 w-3.5" /> : <FiTrendingDown className="h-3.5 w-3.5" />}
          {formatPercent(kpi.trend)}
        </span>
        <span className="font-medium text-slate-500">Objectif {kpi.unit === 'EUR' ? formatCurrency(kpi.target) : formatNumber(kpi.target)}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(completion, 100)}%` }} />
      </div>
    </article>
  )
}

function ChartPanel({ title, subtitle, children, className = '' }) {
  return (
    <section className={`surface p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg">
      <p className="mb-2 font-semibold text-slate-950">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-slate-600">
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name || item.dataKey}: {formatCurrency(item.value)}
        </p>
      ))}
    </div>
  )
}

function PercentTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg">
      <p className="mb-2 font-semibold text-slate-950">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-slate-600">
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name || item.dataKey}: {formatPercent(item.value)}
        </p>
      ))}
    </div>
  )
}

function CockpitSettingsPanel({ draftConfig, setDraftConfig, onSave, isSaving }) {
  const objectives = draftConfig.objectifs || {}
  const rules = draftConfig.regles || {}
  const modules = draftConfig.affichage?.modules || {}
  const displayedKpis = rules.displayed_kpis || []

  const updateObjective = (code, value) => {
    setDraftConfig((current) => ({
      ...current,
      objectifs: { ...(current.objectifs || {}), [code]: Number(value || 0) },
    }))
  }

  const updateRule = (code, value) => {
    setDraftConfig((current) => ({
      ...current,
      regles: { ...(current.regles || {}), [code]: Number(value || 0) },
    }))
  }

  const toggleKpi = (code) => {
    setDraftConfig((current) => {
      const currentRules = current.regles || {}
      const currentKpis = currentRules.displayed_kpis || []
      const nextKpis = currentKpis.includes(code) ? currentKpis.filter((item) => item !== code) : [...currentKpis, code]
      return { ...current, regles: { ...currentRules, displayed_kpis: nextKpis } }
    })
  }

  const toggleModule = (code) => {
    setDraftConfig((current) => ({
      ...current,
      affichage: {
        ...(current.affichage || {}),
        modules: {
          ...(current.affichage?.modules || {}),
          [code]: !current.affichage?.modules?.[code],
        },
      },
    }))
  }

  return (
    <section className="surface mb-5 overflow-hidden p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="section-kicker">
            <FiSettings className="h-4 w-4" />
            Reglages cockpit
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">Objectifs, seuils et vues dirigeant</h2>
          <p className="mt-1 text-sm text-slate-500">Les KPI et alertes se recalculent avec ces regles apres sauvegarde.</p>
        </div>
        <button
          type="button"
          onClick={() => onSave(draftConfig)}
          disabled={isSaving}
          className="touch-button inline-flex items-center justify-center gap-2 bg-slate-950 px-4 py-2.5 text-sm text-white shadow-sm hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-300"
        >
          <FiSave className="h-4 w-4" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-muted p-4">
          <h3 className="text-sm font-semibold text-slate-950">Objectifs exploitation</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {objectiveFields.map((field) => (
              <label key={field.code} className="block">
                <span className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-slate-500">
                  {field.label}
                  <span>{field.unit}</span>
                </span>
                <input
                  type="number"
                  value={objectives[field.code] ?? 0}
                  onChange={(event) => updateObjective(field.code, event.target.value)}
                  className="input bg-white font-semibold"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="surface-muted p-4">
          <h3 className="text-sm font-semibold text-slate-950">Regles de decision</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ruleFields.map((field) => (
              <label key={field.code} className="block">
                <span className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-slate-500">
                  {field.label}
                  <span>{field.unit}</span>
                </span>
                <input
                  type="number"
                  step={field.step}
                  value={rules[field.code] ?? 0}
                  onChange={(event) => updateRule(field.code, event.target.value)}
                  className="input bg-white font-semibold"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="surface-muted p-4">
          <h3 className="text-sm font-semibold text-slate-950">KPI visibles</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {kpiChoices.map((item) => {
              const active = displayedKpis.includes(item.code)
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => toggleKpi(item.code)}
                  className={`touch-button min-h-10 border px-3 py-2 text-sm ${active ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="surface-muted p-4">
          <h3 className="text-sm font-semibold text-slate-950">Composition de vue</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {moduleChoices.map((item) => {
              const active = modules[item.code] !== false
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => toggleModule(item.code)}
                  className={`touch-button min-h-10 border px-3 py-2 text-sm ${active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function CockpitPage({ initialCockpit = null, initialConfiguration = null }) {
  const queryClient = useQueryClient()
  const [draftConfig, setDraftConfig] = useState(initialConfiguration || initialCockpit?.configuration || defaultCockpitConfiguration)
  const { data, isError, isFetching } = useQuery('pilotage-cockpit', fetchPilotageCockpit, {
    initialData: initialCockpit || undefined,
    staleTime: 15000,
  })
  const { data: configData } = useQuery('pilotage-cockpit-configuration', fetchPilotageCockpitConfiguration, {
    initialData: initialConfiguration ? { configuration: initialConfiguration } : undefined,
    staleTime: 30000,
  })
  const configMutation = useMutation(updatePilotageCockpitConfiguration, {
    onSuccess: async (result) => {
      setDraftConfig(result.configuration)
      await queryClient.invalidateQueries('pilotage-cockpit-configuration')
      await queryClient.invalidateQueries('pilotage-cockpit')
    },
  })
  const cockpit = data || fallbackCockpit
  const visibleModules = cockpit.configuration?.affichage?.modules || draftConfig.affichage?.modules || defaultCockpitConfiguration.affichage.modules
  const series = cockpit.series || fallbackCockpit.series
  const totalCanaux = useMemo(() => (series.ventes_canaux || []).reduce((sum, item) => sum + Number(item.montant || 0), 0), [series.ventes_canaux])
  const topDecisionGain = useMemo(() => (cockpit.decisions || []).reduce((sum, item) => sum + Number(item.gain_estime || 0), 0), [cockpit.decisions])
  const cockpitKpis = useMemo(() => (cockpit.kpis || []).map((kpi) => ({ ...kpi, code: kpi.code || kpi.label })), [cockpit.kpis])
  const { orderedItems: orderedKpis, moveItem: moveKpi } = useStoredOrder('farmflow-cockpit-kpi-order', cockpitKpis)

  useEffect(() => {
    if (configData?.configuration) {
      setDraftConfig(configData.configuration)
    }
  }, [configData])

  return (
    <Layout>
      <Head>
        <title>Cockpit - FarmFlow</title>
        <meta name="description" content="Cockpit FarmFlow pour piloter tresorerie, marges, ventes, stocks, risques et decisions agricoles." />
      </Head>

      <section className="command-panel mb-5 overflow-hidden p-5 text-white">
        <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-100">
              Centre de decision
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Cockpit exploitation</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Vue dirigeant pour arbitrer tresorerie, marges, ventes, stocks, charge de travail et actions prioritaires.
            </p>
            <div className="mt-5 grid max-w-3xl gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                <p className="text-xs font-medium text-slate-300">Decisions actives</p>
                <p className="mt-1 text-2xl font-semibold text-white">{cockpit.decisions?.length || 0}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                <p className="text-xs font-medium text-slate-300">Risques suivis</p>
                <p className="mt-1 text-2xl font-semibold text-white">{cockpit.risques?.length || 0}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                <p className="text-xs font-medium text-slate-300">Gain potentiel</p>
                <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(topDecisionGain)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase text-slate-300">Etat donnees</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className={`rounded-full border px-3 py-1 font-semibold ${cockpit.source === 'transactions' ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100' : 'border-amber-300/40 bg-amber-400/15 text-amber-100'}`}>
              {cockpit.source === 'transactions' ? 'Transactions' : 'Demo'}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-semibold text-white">{cockpit.periode?.label}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 font-semibold text-white">
              <FiRefreshCcw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Donnees actualisees
            </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-3/4 rounded-full bg-emerald-400" />
            </div>
            <p className="mt-2 text-xs text-slate-300">Pilotage connecte aux flux caisse, banque, stock et compta.</p>
          </div>
        </div>
      </section>

      {isError && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          API cockpit indisponible : affichage des indicateurs locaux de demonstration.
        </div>
      )}

      <CockpitSettingsPanel
        draftConfig={draftConfig}
        setDraftConfig={setDraftConfig}
        onSave={(payload) => configMutation.mutate(payload)}
        isSaving={configMutation.isLoading}
      />
      {configMutation.isSuccess && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
          Reglages sauvegardes, cockpit recalcule.
        </div>
      )}

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {orderedKpis.map((kpi) => (
          <div
            key={kpi.code || kpi.label}
            draggable
            onDragStart={(event) => setReorderPayload(event, kpi.code || kpi.label)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              moveKpi(getReorderPayload(event), kpi.code || kpi.label)
            }}
            className="group relative cursor-grab active:cursor-grabbing"
          >
            <span className="absolute right-3 top-3 z-10 rounded-md border border-slate-200 bg-white/90 p-1.5 text-slate-400 opacity-0 shadow-sm transition group-hover:opacity-100" title="Reorganiser les indicateurs">
              <FiMove className="h-3.5 w-3.5" />
            </span>
            <KpiCard kpi={kpi} />
          </div>
        ))}
      </section>

      {(visibleModules.revenu_marge !== false || visibleModules.tresorerie !== false) && (
        <section className="mb-5 grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
          {visibleModules.revenu_marge !== false && (
            <ChartPanel title="CA, marge et objectif" subtitle="Lecture mensuelle pour piloter prix, volumes et rentabilite.">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={series.revenu_marge || []} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="mois" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<MoneyTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="ca" name="CA" fill="#ccfbf1" stroke="#0f766e" strokeWidth={2} />
                    <Bar dataKey="marge" name="Marge" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="objectif" name="Objectif" stroke="#d97706" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>
          )}

          {visibleModules.tresorerie !== false && (
            <ChartPanel title="Tresorerie projetee" subtitle="Anticiper les semaines sous tension.">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series.tresorerie || []} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="semaine" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<MoneyTooltip />} />
                    <Area type="monotone" dataKey="solde" name="Solde" fill="#dbeafe" stroke="#2563eb" strokeWidth={2} />
                    <Line type="monotone" dataKey="encaissements" name="Encaissements" stroke="#16a34a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="decaissements" name="Decaissements" stroke="#dc2626" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>
          )}
        </section>
      )}

      {(visibleModules.ventes_canaux !== false || visibleModules.charges !== false || visibleModules.sante !== false) && (
        <section className="mb-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr_0.8fr]">
          {visibleModules.ventes_canaux !== false && (
            <ChartPanel title="Ventes par canal" subtitle={`${formatCurrency(totalCanaux)} suivis sur la periode.`}>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Pie data={series.ventes_canaux || []} dataKey="montant" nameKey="canal" innerRadius={58} outerRadius={92} paddingAngle={2}>
                      {(series.ventes_canaux || []).map((entry, index) => (
                        <Cell key={entry.canal} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>
          )}

          {visibleModules.charges !== false && (
            <ChartPanel title="Charges budget vs realise" subtitle="Detecter les postes qui degradent la marge.">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series.charges || []} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="poste" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<MoneyTooltip />} />
                    <Legend />
                    <Bar dataKey="budget" name="Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="realise" name="Realise" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>
          )}

          {visibleModules.sante !== false && (
            <ChartPanel title="Sante exploitation" subtitle="Scores de controle par axe.">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={series.sante || []} outerRadius={92}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="axe" tick={{ fill: '#475569', fontSize: 12 }} />
                    <Tooltip content={<PercentTooltip />} />
                    <Radar name="Score" dataKey="score" stroke="#0f766e" fill="#0f766e" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>
          )}
        </section>
      )}

      {(visibleModules.marges_ateliers !== false || visibleModules.decisions !== false) && (
        <section className="mb-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          {visibleModules.marges_ateliers !== false && (
            <ChartPanel title="Marges par atelier" subtitle="Comparer marge, objectif et risque operationnel.">
              <div className="h-[310px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={series.marges_ateliers || []} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="atelier" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="marge" name="Marge" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="objectif" name="Objectif" stroke="#d97706" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="risque" name="Risque" stroke="#be123c" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>
          )}

          {visibleModules.decisions !== false && (
            <section className="surface p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Decisions recommandees</h2>
                  <p className="mt-1 text-sm text-slate-500">Gain potentiel suivi : {formatCurrency(topDecisionGain)}</p>
                </div>
                <FiBarChart2 className="h-5 w-5 text-emerald-700" />
              </div>
              <div className="space-y-3">
                {(cockpit.decisions || []).map((decision) => (
                  <Link key={decision.titre} href={decision.route || '/'} className="group flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3 transition hover:border-emerald-200 hover:bg-emerald-50">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${decisionClass[decision.priorite] || decisionClass.basse}`}>
                          {decision.priorite}
                        </span>
                        {decision.gain_estime > 0 && <span className="text-xs font-semibold text-emerald-700">{formatCurrency(decision.gain_estime)}</span>}
                      </div>
                      <p className="mt-2 font-semibold text-slate-950">{decision.titre}</p>
                      <p className="mt-1 text-sm text-slate-500">{decision.impact}</p>
                    </div>
                    <FiArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </section>
      )}

      {(visibleModules.risques !== false || visibleModules.alertes !== false) && (
        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        {visibleModules.risques !== false && <section className="surface p-5">
          <h2 className="text-base font-semibold text-slate-950">Risques a traiter</h2>
          <div className="mt-4 space-y-4">
            {(cockpit.risques || []).map((risk) => (
              <Link key={risk.label} href={risk.route || '/'} className="block rounded-lg border border-slate-200 p-3 transition hover:border-amber-200 hover:bg-amber-50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{risk.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{risk.impact}</p>
                  </div>
                  <span className="text-sm font-semibold text-amber-800">{risk.niveau}/100</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(Number(risk.niveau || 0), 100)}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </section>}

        {visibleModules.alertes !== false && <section className="surface p-5">
          <h2 className="text-base font-semibold text-slate-950">Alertes dirigeant</h2>
          <div className="mt-4 space-y-3">
            {(cockpit.alertes || []).map((alert) => {
              const positive = alert.niveau === 'success'
              return (
                <div key={alert.titre} className={`rounded-lg border p-4 ${positive ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-start gap-3">
                    {positive ? <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /> : <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />}
                    <div>
                      <p className={`font-semibold ${positive ? 'text-emerald-950' : 'text-amber-950'}`}>{alert.titre}</p>
                      <p className={`mt-1 text-sm ${positive ? 'text-emerald-800' : 'text-amber-900'}`}>{alert.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>}
      </section>
      )}
    </Layout>
  )
}

export async function getServerSideProps() {
  try {
    const [cockpitResponse, configurationResponse] = await Promise.all([
      axios.get(`${SERVER_API_URL}/pilotage/cockpit`, { timeout: 5000 }),
      axios.get(`${SERVER_API_URL}/pilotage/cockpit/configuration`, { timeout: 5000 }),
    ])
    return {
      props: {
        initialCockpit: cockpitResponse.data,
        initialConfiguration: configurationResponse.data.configuration,
      },
    }
  } catch (error) {
    return { props: { initialCockpit: null, initialConfiguration: null } }
  }
}
