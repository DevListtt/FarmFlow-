import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import axios from 'axios'
import {
  FiActivity,
  FiBarChart2,
  FiBox,
  FiCheckCircle,
  FiCpu,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiPackage,
  FiRadio,
  FiRefreshCcw,
  FiShoppingCart,
  FiSliders,
  FiSmartphone,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import Layout from '../components/Layout'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0)
const formatNumber = (value, digits = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(value || 0)

const fallbackView = {
  kpis: [
    { label: 'Flux prets', value: 9, detail: 'achats, stock, caisse, banque, compta, IoT' },
    { label: 'Ecritures auto', value: 24, detail: 'tickets, factures, stocks, TVA' },
    { label: 'Connecteurs', value: 6, detail: 'banque, TPE, scanner, balance, IoT, mobile' },
    { label: 'Segments', value: 3, detail: 'circuit court, pro, collectivite' },
  ],
  chaines: [
    {
      code: 'achat-stock-compta-banque',
      titre: 'Achat intrant -> reception -> stock -> compta -> banque',
      etapes: ['commande', 'reception', 'stock', 'facture', 'ecriture', 'banque'],
      statut: 'pret a tester',
    },
    {
      code: 'caisse-stock-compta-tpe',
      titre: 'Caisse -> stock -> ticket -> TPE -> compta',
      etapes: ['scan', 'pesee', 'encaissement', 'lot', 'TVA', 'TPE'],
      statut: 'pret a tester',
    },
  ],
  iot: [
    { code: 'scanner-pos', nom: 'Scanner POS', statut: 'simulation active', usage: 'code-barres vers panier, lot et stock' },
    { code: 'balance', nom: 'Balance connectee', statut: 'simulation active', usage: 'poids net vers prix, lot et ticket' },
    { code: 'tpe', nom: 'TPE', statut: 'a parametrer', usage: 'paiement carte vers rapprochement' },
    { code: 'capteurs', nom: 'IoT ferme', statut: 'a connecter', usage: 'silo, eau, temperature, carburant' },
  ],
  segments: [
    { code: 'circuit-court', nom: 'Circuit court', promesse: 'vente directe et paiement immediat' },
    { code: 'pro', nom: 'Professionnel', promesse: 'tarifs negocies et facturation' },
    { code: 'collectivite', nom: 'Collectivite', promesse: 'volumes planifies et conformite' },
  ],
  catalogue_pos: [
    { code: 'panier-legumes', code_barres: 'FF-PANIER-001', nom: 'Panier legumes', prix: 22, stock: 42, unite: 'piece', lot: 'LOT-MAR-2026-18' },
    { code: 'colis-boeuf', code_barres: 'FF-BOEUF-KG', nom: 'Colis boeuf pese', prix: 15.8, stock: 94.5, unite: 'kg', lot: 'LOT-VIA-2026-07' },
  ],
  garde_fous: ['validation humaine', 'journal audit', 'anti doublon', 'mode simulation'],
}

const fetchNoyau = async () => {
  const response = await axios.get(`${API_URL}/noyau/vue`)
  return response.data
}

const postCommande = async (payload) => {
  const response = await axios.post(`${API_URL}/noyau/achats/commande`, payload)
  return response.data
}

const postMouvement = async (payload) => {
  const response = await axios.post(`${API_URL}/noyau/stocks/mouvement`, payload)
  return response.data
}

const postRapprochement = async (payload) => {
  const response = await axios.post(`${API_URL}/noyau/banque/rapprocher`, payload)
  return response.data
}

const postSegment = async (payload) => {
  const response = await axios.post(`${API_URL}/noyau/crm/segmenter`, payload)
  return response.data
}

const postScan = async (payload) => {
  const response = await axios.post(`${API_URL}/noyau/iot/scan-pos`, payload)
  return response.data
}

const postPesee = async (payload) => {
  const response = await axios.post(`${API_URL}/noyau/iot/pesee`, payload)
  return response.data
}

const postMobile = async (payload) => {
  const response = await axios.post(`${API_URL}/noyau/mobile/intervention`, payload)
  return response.data
}

const postAnalyse = async (payload) => {
  const response = await axios.post(`${API_URL}/noyau/ia/analyser`, payload)
  return response.data
}

const connectorIcons = {
  'scanner-pos': FiShoppingCart,
  balance: FiSliders,
  tpe: FiCreditCard,
  capteurs: FiRadio,
}

const statusClasses = {
  'simulation active': 'border-emerald-200 bg-emerald-50 text-emerald-800',
  persistant: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'a parametrer': 'border-amber-200 bg-amber-50 text-amber-800',
  'a connecter': 'border-slate-200 bg-slate-50 text-slate-700',
  'pret a tester': 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'socle fonctionnel': 'border-sky-200 bg-sky-50 text-sky-800',
}

const flowIcons = [FiShoppingCart, FiPackage, FiDatabase, FiDollarSign, FiCreditCard, FiCheckCircle]

function ResultPanel({ title, icon: Icon = FiCheckCircle, children, empty = 'Lance une action pour voir le resultat.' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      </div>
      {children || <p className="text-sm text-slate-500">{empty}</p>}
    </div>
  )
}

function ValueRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-950">{value}</span>
    </div>
  )
}

export default function NoyauPage() {
  const [scanCode, setScanCode] = useState('FF-PANIER-001')
  const [scanQty, setScanQty] = useState(1)
  const [scaleProduct, setScaleProduct] = useState('colis-boeuf')
  const [scaleGross, setScaleGross] = useState(5.25)
  const [scaleTare, setScaleTare] = useState(0.15)
  const [scaleSegment, setScaleSegment] = useState('circuit-court')
  const [segmentForm, setSegmentForm] = useState({
    nom: 'Cantine centrale',
    canal: 'collectivite',
    type_structure: 'collectivite',
    volume_annuel: 18000,
    frequence: 'hebdomadaire',
    delai_paiement: 30,
  })
  const [commandeForm, setCommandeForm] = useState({
    fournisseur: 'Cooperative Val de Loire',
    produit: 'semence-ble',
    quantite: 12,
    unite: 'sac',
    prix_unitaire: 72,
    tva: 10,
    atelier: 'Ble tendre',
  })
  const [results, setResults] = useState({})

  const { data, isError } = useQuery('noyau-operationnel', fetchNoyau, { staleTime: 60000 })
  const view = data || fallbackView
  const catalogue = view.catalogue_pos || fallbackView.catalogue_pos
  const recentTickets = view.tickets_recents || []
  const stockAlerts = view.alertes_stock || []

  const remember = (key) => ({
    onSuccess: (payload) => setResults((current) => ({ ...current, [key]: payload })),
  })

  const commandeMutation = useMutation(postCommande, remember('commande'))
  const mouvementMutation = useMutation(postMouvement, remember('mouvement'))
  const banqueMutation = useMutation(postRapprochement, remember('banque'))
  const segmentMutation = useMutation(postSegment, remember('segment'))
  const scanMutation = useMutation(postScan, remember('scan'))
  const peseeMutation = useMutation(postPesee, remember('pesee'))
  const mobileMutation = useMutation(postMobile, remember('mobile'))
  const analyseMutation = useMutation(postAnalyse, remember('analyse'))

  const weightedProducts = useMemo(() => catalogue.filter((item) => item.unite === 'kg' || item.prix_kg), [catalogue])

  const runStockMovement = () => {
    mouvementMutation.mutate({
      produit: commandeForm.produit,
      lot: 'LOT-SEM-2026-01',
      sens: 'entree',
      quantite: Number(commandeForm.quantite),
      unite: commandeForm.unite,
      origine: 'reception fournisseur',
      atelier: commandeForm.atelier,
      cout_unitaire: Number(commandeForm.prix_unitaire),
    })
  }

  const runBankMatch = () => {
    const total = Number(commandeForm.quantite) * Number(commandeForm.prix_unitaire) * (1 + Number(commandeForm.tva) / 100)
    banqueMutation.mutate({
      libelle_banque: `Virement ${commandeForm.fournisseur}`,
      montant: -Number(total.toFixed(2)),
      reference: results.commande?.facture?.id || 'FACF-SIMULATION',
    })
  }

  const runMobile = () => {
    mobileMutation.mutate({
      chantier: 'Epandage fumier',
      parcelle: 'P-104',
      operateur: 'Salarie terrain',
      temps_heures: 2.5,
      carburant_litres: 18,
      stock_consomme: 7.5,
    })
  }

  const runAnalyse = () => {
    analyseMutation.mutate({
      scenario: 'tresorerie et marge',
      horizon_jours: 30,
      objectif: 'reduire ecarts et proteger marge',
    })
  }

  return (
    <Layout>
      <Head>
        <title>Noyau operationnel - FarmFlow</title>
        <meta name="description" content="Noyau operationnel agricole avec achats, stock, caisse, banque, IoT et CRM." />
      </Head>

      <section className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-sm">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.7fr] lg:p-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <FiZap className="h-4 w-4" />
              Noyau operationnel agricole
            </div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Achats, stocks, caisse, banque et compta connectes</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Chaque action cree un resultat exploitable : mouvement de stock, lot, ticket, segment client, rapprochement et ecriture automatique.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {view.kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-white/10 bg-white/10 p-4">
                <p className="text-xs text-slate-300">{kpi.label}</p>
                <p className="mt-1 text-2xl font-semibold">{kpi.value}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{kpi.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isError && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Mode local actif : donnees de secours chargees.
        </div>
      )}

      <section className="mb-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Chaines automatisees</p>
              <h2 className="text-xl font-semibold text-slate-950">Flux transactionnels</h2>
            </div>
            <FiActivity className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {view.chaines.map((flow) => (
              <div key={flow.code} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-sm font-semibold text-slate-950">{flow.titre}</h3>
                  <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses[flow.statut] || statusClasses['pret a tester']}`}>
                    {flow.statut}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">
                  {flow.etapes.map((step, index) => {
                    const Icon = flowIcons[index] || FiCheckCircle
                    return (
                      <div key={`${flow.code}-${step}`} className="flex min-h-[72px] flex-col items-center justify-center rounded-lg bg-slate-50 px-2 text-center">
                        <Icon className="h-4 w-4 text-emerald-700" />
                        <span className="mt-2 text-xs font-medium text-slate-700">{step}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Synchro</p>
              <h2 className="text-xl font-semibold text-slate-950">Connecteurs</h2>
            </div>
            <FiRadio className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {view.iot.map((connector) => {
              const Icon = connectorIcons[connector.code] || FiRadio
              return (
                <div key={connector.code} className="flex gap-3 rounded-lg border border-slate-200 p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-950">{connector.nom}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClasses[connector.statut] || statusClasses['a connecter']}`}>
                        {connector.statut}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{connector.usage}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Persistant</p>
              <h2 className="text-xl font-semibold text-slate-950">Tickets recents</h2>
            </div>
            <FiCreditCard className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-2">
            {recentTickets.length ? recentTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.reference || ticket.ticket_id} className="grid gap-2 rounded-lg border border-slate-200 p-3 text-sm md:grid-cols-[1fr_120px_120px] md:items-center">
                <div>
                  <p className="font-semibold text-slate-950">{ticket.client}</p>
                  <p className="text-xs text-slate-500">{ticket.reference || ticket.ticket_id} - {ticket.segment}</p>
                </div>
                <span className="font-semibold text-slate-950">{formatCurrency(ticket.totaux?.total)}</span>
                <span className="text-xs font-medium text-emerald-700">marge {formatCurrency(ticket.totaux?.marge)}</span>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                Aucun ticket persiste pour le moment.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Stock</p>
              <h2 className="text-xl font-semibold text-slate-950">Alertes seuils</h2>
            </div>
            <FiPackage className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-2">
            {stockAlerts.length ? stockAlerts.slice(0, 5).map((product) => (
              <div key={product.code} className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <div>
                  <p className="font-semibold text-amber-950">{product.nom}</p>
                  <p className="text-xs text-amber-800">{product.lot}</p>
                </div>
                <span className="font-semibold text-amber-950">{formatNumber(product.stock, 2)} {product.unite}</span>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                Aucun seuil critique.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Point de vente</p>
              <h2 className="text-xl font-semibold text-slate-950">Scanner POS</h2>
            </div>
            <FiShoppingCart className="h-5 w-5 text-slate-400" />
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_120px]">
            <select value={scanCode} onChange={(event) => setScanCode(event.target.value)} className="input">
              {catalogue.map((product) => (
                <option key={product.code_barres} value={product.code_barres}>{product.nom} - {product.code_barres}</option>
              ))}
            </select>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={scanQty}
              onChange={(event) => setScanQty(Number(event.target.value))}
              className="input"
            />
          </div>
          <button
            type="button"
            onClick={() => scanMutation.mutate({ code_barres: scanCode, quantite: Number(scanQty), client_segment: results.segment?.segment?.code || 'circuit-court' })}
            disabled={scanMutation.isLoading}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-300"
          >
            <FiZap className="h-4 w-4" />
            {scanMutation.isLoading ? 'Scan...' : 'Scanner et reserver le lot'}
          </button>

          <ResultPanel title="Resultat scan" icon={FiShoppingCart}>
            {results.scan && (
              <div className="space-y-2">
                <ValueRow label="Produit" value={results.scan.ligne_panier.nom} />
                <ValueRow label="Total" value={formatCurrency(results.scan.ligne_panier.total)} />
                <ValueRow label="Marge" value={formatCurrency(results.scan.ligne_panier.marge)} />
                <ValueRow label="Stock apres scan" value={`${formatNumber(results.scan.stock_apres_scan, 2)} ${results.scan.produit.unite}`} />
                <ValueRow label="Lot" value={results.scan.tracabilite.lot} />
              </div>
            )}
          </ResultPanel>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">IoT</p>
              <h2 className="text-xl font-semibold text-slate-950">Balance connectee</h2>
            </div>
            <FiSliders className="h-5 w-5 text-slate-400" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select value={scaleProduct} onChange={(event) => setScaleProduct(event.target.value)} className="input md:col-span-3">
              {(weightedProducts.length ? weightedProducts : catalogue).map((product) => (
                <option key={product.code} value={product.code}>{product.nom}</option>
              ))}
            </select>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Brut kg</span>
              <input type="number" min="0" step="0.01" value={scaleGross} onChange={(event) => setScaleGross(Number(event.target.value))} className="input" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Tare kg</span>
              <input type="number" min="0" step="0.01" value={scaleTare} onChange={(event) => setScaleTare(Number(event.target.value))} className="input" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Segment</span>
              <select
                value={scaleSegment}
                onChange={(event) => setScaleSegment(event.target.value)}
                className="input"
              >
                <option value="circuit-court">Circuit court</option>
                <option value="pro">Pro</option>
                <option value="collectivite">Collectivite</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={() => peseeMutation.mutate({
              produit: scaleProduct,
              poids_brut: Number(scaleGross),
              tare: Number(scaleTare),
              lot: 'LOT-VIA-2026-07',
              client_segment: scaleSegment,
            })}
            disabled={peseeMutation.isLoading}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:bg-emerald-300"
          >
            <FiSliders className="h-4 w-4" />
            {peseeMutation.isLoading ? 'Pesee...' : 'Peser et creer la ligne'}
          </button>

          <ResultPanel title="Resultat pesee" icon={FiSliders}>
            {results.pesee && (
              <div className="space-y-2">
                <ValueRow label="Produit" value={results.pesee.ligne_panier.nom} />
                <ValueRow label="Poids net" value={`${formatNumber(results.pesee.poids.net, 3)} kg`} />
                <ValueRow label="Total" value={formatCurrency(results.pesee.ligne_panier.total)} />
                <ValueRow label="Marge" value={formatCurrency(results.pesee.ligne_panier.marge)} />
                <ValueRow label="Mouvement" value={`${formatNumber(results.pesee.mouvement_stock.quantite, 3)} kg`} />
              </div>
            )}
          </ResultPanel>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">CRM</p>
              <h2 className="text-xl font-semibold text-slate-950">Segmentation commerciale</h2>
            </div>
            <FiUsers className="h-5 w-5 text-slate-400" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input value={segmentForm.nom} onChange={(event) => setSegmentForm((current) => ({ ...current, nom: event.target.value }))} className="input md:col-span-2" />
            <select value={segmentForm.canal} onChange={(event) => setSegmentForm((current) => ({ ...current, canal: event.target.value }))} className="input">
              <option value="boutique ferme">Circuit court</option>
              <option value="restaurant">Pro</option>
              <option value="collectivite">Collectivite</option>
            </select>
            <select value={segmentForm.type_structure} onChange={(event) => setSegmentForm((current) => ({ ...current, type_structure: event.target.value }))} className="input">
              <option value="particulier">Particulier</option>
              <option value="professionnel">Professionnel</option>
              <option value="collectivite">Collectivite</option>
            </select>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Volume annuel</span>
              <input type="number" min="0" value={segmentForm.volume_annuel} onChange={(event) => setSegmentForm((current) => ({ ...current, volume_annuel: Number(event.target.value) }))} className="input" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Paiement jours</span>
              <input type="number" min="0" value={segmentForm.delai_paiement} onChange={(event) => setSegmentForm((current) => ({ ...current, delai_paiement: Number(event.target.value) }))} className="input" />
            </label>
          </div>

          <button
            type="button"
            onClick={() => segmentMutation.mutate(segmentForm)}
            disabled={segmentMutation.isLoading}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-300"
          >
            <FiUsers className="h-4 w-4" />
            {segmentMutation.isLoading ? 'Segmentation...' : 'Segmenter le client'}
          </button>

          <ResultPanel title="Segment applique" icon={FiUsers}>
            {results.segment && (
              <div className="space-y-2">
                <ValueRow label="Segment" value={results.segment.segment.nom} />
                <ValueRow label="Remise ref." value={`${results.segment.politique_commerciale.remise_reference}%`} />
                <ValueRow label="Facturation" value={results.segment.politique_commerciale.facturation} />
                <ValueRow label="Risque" value={results.segment.politique_commerciale.risque} />
              </div>
            )}
          </ResultPanel>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Back-office</p>
              <h2 className="text-xl font-semibold text-slate-950">Achats, stock, banque, mobile et analyse</h2>
            </div>
            <FiDatabase className="h-5 w-5 text-slate-400" />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input value={commandeForm.fournisseur} onChange={(event) => setCommandeForm((current) => ({ ...current, fournisseur: event.target.value }))} className="input md:col-span-3" />
            <input value={commandeForm.produit} onChange={(event) => setCommandeForm((current) => ({ ...current, produit: event.target.value }))} className="input" />
            <input type="number" min="0" value={commandeForm.quantite} onChange={(event) => setCommandeForm((current) => ({ ...current, quantite: Number(event.target.value) }))} className="input" />
            <input type="number" min="0" value={commandeForm.prix_unitaire} onChange={(event) => setCommandeForm((current) => ({ ...current, prix_unitaire: Number(event.target.value) }))} className="input" />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <button type="button" onClick={() => commandeMutation.mutate(commandeForm)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              <FiShoppingCart className="h-4 w-4" />
              Achat
            </button>
            <button type="button" onClick={runStockMovement} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <FiBox className="h-4 w-4" />
              Stock
            </button>
            <button type="button" onClick={runBankMatch} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <FiRefreshCcw className="h-4 w-4" />
              Banque
            </button>
            <button type="button" onClick={runMobile} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <FiSmartphone className="h-4 w-4" />
              Mobile
            </button>
            <button type="button" onClick={runAnalyse} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <FiCpu className="h-4 w-4" />
              Analyse
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <ResultPanel title="Commande" icon={FiShoppingCart}>
              {results.commande && (
                <div className="space-y-2">
                  <ValueRow label="Commande" value={results.commande.commande.id} />
                  <ValueRow label="Total TTC" value={formatCurrency(results.commande.commande.total_ttc)} />
                  <ValueRow label="Reception" value={results.commande.reception.statut} />
                </div>
              )}
            </ResultPanel>
            <ResultPanel title="Stock" icon={FiPackage}>
              {results.mouvement && (
                <div className="space-y-2">
                  <ValueRow label="Mouvement" value={results.mouvement.mouvement_id} />
                  <ValueRow label="Quantite" value={`${formatNumber(results.mouvement.quantite, 2)} ${results.mouvement.unite}`} />
                  <ValueRow label="Valeur" value={formatCurrency(Math.abs(results.mouvement.valorisation))} />
                </div>
              )}
            </ResultPanel>
            <ResultPanel title="Banque" icon={FiDollarSign}>
              {results.banque && (
                <div className="space-y-2">
                  <ValueRow label="Statut" value={results.banque.statut} />
                  <ValueRow label="Suggestion" value={results.banque.suggestion.reference} />
                  <ValueRow label="Score" value={`${results.banque.suggestion.score}%`} />
                </div>
              )}
            </ResultPanel>
            <ResultPanel title="Terrain et analyse" icon={FiBarChart2}>
              {(results.mobile || results.analyse) && (
                <div className="space-y-2">
                  {results.mobile && <ValueRow label="Intervention" value={results.mobile.statut} />}
                  {results.mobile && <ValueRow label="Cout total" value={formatCurrency(results.mobile.couts.total)} />}
                  {results.analyse && <ValueRow label="Alertes" value={results.analyse.alertes.length} />}
                  {results.analyse && <ValueRow label="Horizon" value={`${results.analyse.horizon_jours} jours`} />}
                </div>
              )}
            </ResultPanel>
          </div>
        </div>
      </section>
    </Layout>
  )
}
