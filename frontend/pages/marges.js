import Head from 'next/head'
import { useMemo, useState } from 'react'
import { FiBarChart2, FiDollarSign, FiSliders, FiTrendingDown, FiTrendingUp } from 'react-icons/fi'
import Layout from '../components/Layout'

const presets = {
  cereales: {
    label: 'Ble tendre',
    surface: 42,
    yield: 72,
    price: 205,
    aid: 175,
    seed: 82,
    fertilizer: 246,
    cropProtection: 118,
    fuel: 78,
    labor: 95,
    machinery: 142,
    other: 45,
  },
  maraichage: {
    label: 'Maraichage paniers',
    surface: 3.5,
    yield: 16500,
    price: 1.55,
    aid: 0,
    seed: 920,
    fertilizer: 740,
    cropProtection: 180,
    fuel: 460,
    labor: 6800,
    machinery: 950,
    other: 1200,
  },
  elevage: {
    label: 'Bovin allaitant',
    surface: 28,
    yield: 38,
    price: 1420,
    aid: 230,
    seed: 0,
    fertilizer: 65,
    cropProtection: 0,
    fuel: 52,
    labor: 210,
    machinery: 95,
    other: 310,
  },
}

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
const formatNumber = (value) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)

const fields = [
  { key: 'surface', label: 'Surface / lots', suffix: 'ha ou lots' },
  { key: 'yield', label: 'Rendement / volume', suffix: 'unites' },
  { key: 'price', label: 'Prix unitaire', suffix: 'EUR' },
  { key: 'aid', label: 'Aides / primes par ha', suffix: 'EUR/ha' },
  { key: 'seed', label: 'Semences / plants', suffix: 'EUR/ha' },
  { key: 'fertilizer', label: 'Engrais / amendements', suffix: 'EUR/ha' },
  { key: 'cropProtection', label: 'Protection / sanitaire', suffix: 'EUR/ha' },
  { key: 'fuel', label: 'Carburant', suffix: 'EUR/ha' },
  { key: 'labor', label: 'Main d oeuvre', suffix: 'EUR/ha' },
  { key: 'machinery', label: 'Materiel', suffix: 'EUR/ha' },
  { key: 'other', label: 'Autres charges', suffix: 'EUR/ha' },
]

export default function MargesPage() {
  const [scenario, setScenario] = useState(presets.cereales)
  const [saleLoss, setSaleLoss] = useState(4)
  const [priceStress, setPriceStress] = useState(-8)
  const [yieldStress, setYieldStress] = useState(-10)

  const results = useMemo(() => {
    const revenue = scenario.surface * scenario.yield * scenario.price
    const aid = scenario.surface * scenario.aid
    const chargesHa = scenario.seed + scenario.fertilizer + scenario.cropProtection + scenario.fuel + scenario.labor + scenario.machinery + scenario.other
    const charges = scenario.surface * chargesHa
    const lossCost = revenue * (saleLoss / 100)
    const grossMargin = revenue + aid - charges - lossCost
    const marginHa = grossMargin / Math.max(scenario.surface, 1)
    const breakEvenPrice = (charges + lossCost - aid) / Math.max(scenario.surface * scenario.yield, 1)
    const breakEvenYield = (charges + lossCost - aid) / Math.max(scenario.surface * scenario.price, 1)
    const stressedRevenue = scenario.surface * (scenario.yield * (1 + yieldStress / 100)) * (scenario.price * (1 + priceStress / 100))
    const stressedMargin = stressedRevenue + aid - charges - lossCost
    const ebitdaProxy = grossMargin - scenario.surface * (scenario.machinery * 0.35)

    return {
      revenue,
      aid,
      chargesHa,
      charges,
      lossCost,
      grossMargin,
      marginHa,
      breakEvenPrice,
      breakEvenYield,
      stressedMargin,
      ebitdaProxy,
    }
  }, [priceStress, saleLoss, scenario, yieldStress])

  const chargeLines = [
    { label: 'Semences', value: scenario.seed },
    { label: 'Engrais', value: scenario.fertilizer },
    { label: 'Protection', value: scenario.cropProtection },
    { label: 'Carburant', value: scenario.fuel },
    { label: 'Main d oeuvre', value: scenario.labor },
    { label: 'Materiel', value: scenario.machinery },
    { label: 'Autres', value: scenario.other },
  ]
  const maxCharge = Math.max(...chargeLines.map((line) => line.value), 1)

  const updateScenario = (key, value) => {
    setScenario((current) => ({ ...current, [key]: Number(value) }))
  }

  return (
    <Layout>
      <Head>
        <title>Marges - FarmFlow</title>
        <meta name="description" content="Simulateur de marges agricoles FarmFlow." />
      </Head>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.4fr] xl:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Prix de revient & decisions</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Simulateur de marge avance</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Construis un scenario par culture, lot animal ou vente directe, puis teste le prix, le rendement, les pertes, les charges et le seuil de rentabilite.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(presets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setScenario(preset)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${scenario.label === preset.label ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FiSliders className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-semibold text-slate-950">Hypotheses</h2>
            </div>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Nom du scenario</span>
              <input value={scenario.label} onChange={(event) => setScenario((current) => ({ ...current, label: event.target.value }))} className="input" />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              {fields.map((field) => (
                <label key={field.key}>
                  <span className="mb-1 block text-xs font-medium text-slate-500">{field.label}</span>
                  <div className="flex rounded-lg border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
                    <input
                      type="number"
                      value={scenario[field.key]}
                      onChange={(event) => updateScenario(field.key, event.target.value)}
                      className="w-full rounded-l-lg border-0 px-3 py-2 text-sm outline-none"
                    />
                    <span className="flex min-w-[80px] items-center justify-center rounded-r-lg bg-slate-50 px-2 text-xs text-slate-500">{field.suffix}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FiTrendingDown className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-950">Stress test</h2>
            </div>
            <div className="space-y-4">
              <label>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">Pertes / invendus</span>
                  <span className="text-slate-500">{saleLoss}%</span>
                </div>
                <input type="range" min="0" max="25" value={saleLoss} onChange={(event) => setSaleLoss(Number(event.target.value))} className="w-full" />
              </label>
              <label>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">Variation prix</span>
                  <span className="text-slate-500">{priceStress}%</span>
                </div>
                <input type="range" min="-40" max="40" value={priceStress} onChange={(event) => setPriceStress(Number(event.target.value))} className="w-full" />
              </label>
              <label>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">Variation rendement</span>
                  <span className="text-slate-500">{yieldStress}%</span>
                </div>
                <input type="range" min="-40" max="40" value={yieldStress} onChange={(event) => setYieldStress(Number(event.target.value))} className="w-full" />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 text-emerald-900">
                <FiTrendingUp className="h-5 w-5" />
                <p className="text-sm font-semibold">Marge brute</p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-emerald-950">{formatCurrency(results.grossMargin)}</p>
              <p className="mt-1 text-sm text-emerald-800">{formatCurrency(results.marginHa)} / ha ou lot</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <FiDollarSign className="h-5 w-5" />
                <p className="text-sm font-semibold">Seuil prix</p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{formatCurrency(results.breakEvenPrice)}</p>
              <p className="mt-1 text-sm text-slate-500">Prix minimal par unite</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Seuil rendement</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{formatNumber(results.breakEvenYield)}</p>
              <p className="mt-1 text-sm text-slate-500">Unites / ha ou lot</p>
            </article>
            <article className={`rounded-lg border p-5 ${results.stressedMargin >= 0 ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
              <p className={`text-sm font-semibold ${results.stressedMargin >= 0 ? 'text-blue-800' : 'text-red-800'}`}>Marge stress test</p>
              <p className={`mt-3 text-3xl font-semibold ${results.stressedMargin >= 0 ? 'text-blue-950' : 'text-red-950'}`}>{formatCurrency(results.stressedMargin)}</p>
              <p className={`mt-1 text-sm ${results.stressedMargin >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Prix {priceStress}% / rendement {yieldStress}%</p>
            </article>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FiBarChart2 className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-semibold text-slate-950">Structure des charges / ha</h2>
            </div>
            <div className="space-y-3">
              {chargeLines.map((line) => (
                <div key={line.label} className="grid grid-cols-[120px_1fr_90px] items-center gap-3">
                  <span className="text-sm text-slate-600">{line.label}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max((line.value / maxCharge) * 100, 2)}%` }} />
                  </div>
                  <span className="text-right text-sm font-medium text-slate-950">{formatCurrency(line.value)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Lecture decisionnelle</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Produit total</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(results.revenue + results.aid)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Charges totales</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(results.charges + results.lossCost)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Proxy cash</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(results.ebitdaProxy)}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Le scenario devient prioritaire si la marge stress test reste positive et si le seuil prix reste sous le prix contractuel ou le prix marche attendu.
            </p>
          </section>
        </div>
      </section>
    </Layout>
  )
}
