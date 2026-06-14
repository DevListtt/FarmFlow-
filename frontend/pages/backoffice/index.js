import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  FiArchive,
  FiCheckCircle,
  FiDatabase,
  FiEdit3,
  FiPackage,
  FiPlus,
  FiRefreshCcw,
  FiSave,
  FiSliders,
  FiUsers,
} from 'react-icons/fi'
import Layout from '../../components/Layout'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const fallbackData = {
  kpis: [
    { label: 'Produits actifs', value: 6, detail: 'catalogue vente et intrants' },
    { label: 'Tiers actifs', value: 5, detail: 'clients et fournisseurs' },
    { label: 'Stock valorise', value: 3500, detail: 'cout de revient' },
    { label: 'Alertes stock', value: 0, detail: 'seuils a traiter' },
  ],
  produits: [],
  tiers: [],
  segments: [
    { code: 'circuit-court', nom: 'Circuit court' },
    { code: 'pro', nom: 'Professionnel' },
    { code: 'collectivite', nom: 'Collectivite' },
  ],
  mouvements: [],
  commandes: [],
  ecritures: [],
}

const EMPTY_ARRAY = []

const emptyProduct = {
  code: '',
  code_barres: '',
  nom: 'Miel printemps 250g',
  famille: 'Transformation',
  unite: 'pot',
  prix_vente: '5.90',
  prix_kg: '',
  tva: '5.5',
  cout_revient: '2.40',
  stock: '80',
  seuil_alerte: '18',
  lot_courant: 'LOT-MIE-2026-01',
}

const emptyTier = {
  code: '',
  nom: 'Epicerie du centre',
  type_tiers: 'client',
  segment: 'pro',
  canal: 'epicerie',
  email: '',
  telephone: '',
  delai_paiement: '15',
  remise_reference: '6',
  volume_annuel: '5200',
}

const emptyAdjustment = {
  produit: 'panier-legumes',
  sens: 'entree',
  quantite: '8',
  lot: 'LOT-MAR-2026-18',
  origine: 'inventaire back-office',
  atelier: 'Boutique ferme',
  cout_unitaire: '',
}

const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0)
const formatNumber = (value, digits = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(value || 0)
const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
const toOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const fetchBackoffice = async () => {
  const response = await axios.get(`${API_URL}/backoffice/referentiels`)
  return response.data
}

const saveProduct = async (payload) => {
  const response = await axios.post(`${API_URL}/backoffice/produits`, payload)
  return response.data
}

const saveTier = async (payload) => {
  const response = await axios.post(`${API_URL}/backoffice/tiers`, payload)
  return response.data
}

const adjustStock = async (payload) => {
  const response = await axios.post(`${API_URL}/backoffice/stocks/ajustement`, payload)
  return response.data
}

function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export default function BackofficePage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('produits')
  const [productForm, setProductForm] = useState(emptyProduct)
  const [tierForm, setTierForm] = useState(emptyTier)
  const [adjustmentForm, setAdjustmentForm] = useState(emptyAdjustment)
  const [lastAction, setLastAction] = useState(null)

  const { data, isError } = useQuery('backoffice-referentiels', fetchBackoffice, { staleTime: 30000 })
  const backoffice = data || fallbackData
  const produits = backoffice.produits || EMPTY_ARRAY
  const tiers = backoffice.tiers || EMPTY_ARRAY

  const onMutationSuccess = (result) => {
    setLastAction(result)
    queryClient.invalidateQueries('backoffice-referentiels')
  }

  const productMutation = useMutation(saveProduct, { onSuccess: onMutationSuccess })
  const tierMutation = useMutation(saveTier, { onSuccess: onMutationSuccess })
  const adjustmentMutation = useMutation(adjustStock, { onSuccess: onMutationSuccess })

  const stockSignals = useMemo(() => {
    const total = produits.reduce((sum, product) => sum + (product.stock || 0), 0)
    const alerts = produits.filter((product) => product.seuil_alerte && product.stock <= product.seuil_alerte)
    return { total, alerts }
  }, [produits])

  const submitProduct = (event) => {
    event.preventDefault()
    productMutation.mutate({
      ...productForm,
      code: productForm.code || null,
      code_barres: productForm.code_barres || null,
      prix_vente: toNumber(productForm.prix_vente),
      prix_kg: toOptionalNumber(productForm.prix_kg),
      tva: toNumber(productForm.tva, 5.5),
      cout_revient: toNumber(productForm.cout_revient),
      stock: toNumber(productForm.stock),
      seuil_alerte: toNumber(productForm.seuil_alerte),
      lot_courant: productForm.lot_courant || null,
    })
  }

  const submitTier = (event) => {
    event.preventDefault()
    tierMutation.mutate({
      ...tierForm,
      code: tierForm.code || null,
      email: tierForm.email || null,
      telephone: tierForm.telephone || null,
      delai_paiement: toNumber(tierForm.delai_paiement),
      remise_reference: toNumber(tierForm.remise_reference),
      volume_annuel: toNumber(tierForm.volume_annuel),
    })
  }

  const submitAdjustment = (event) => {
    event.preventDefault()
    adjustmentMutation.mutate({
      ...adjustmentForm,
      quantite: toNumber(adjustmentForm.quantite, 1),
      lot: adjustmentForm.lot || null,
      cout_unitaire: toOptionalNumber(adjustmentForm.cout_unitaire),
    })
  }

  const editProduct = (product) => {
    setActiveTab('produits')
    setProductForm({
      code: product.code || '',
      code_barres: product.code_barres || '',
      nom: product.nom || '',
      famille: product.famille || 'Produit ferme',
      unite: product.unite || 'piece',
      prix_vente: String(product.prix ?? product.price ?? 0),
      prix_kg: product.prix_kg ? String(product.prix_kg) : '',
      tva: String(product.tva ?? product.tax ?? 5.5),
      cout_revient: String(product.cout_revient ?? 0),
      stock: String(product.stock ?? 0),
      seuil_alerte: String(product.seuil_alerte ?? 0),
      lot_courant: product.lot || '',
    })
  }

  const editTier = (tier) => {
    setActiveTab('tiers')
    setTierForm({
      code: tier.code || '',
      nom: tier.nom || '',
      type_tiers: tier.type_tiers || 'client',
      segment: tier.segment || 'circuit-court',
      canal: tier.canal || '',
      email: tier.email || '',
      telephone: tier.telephone || '',
      delai_paiement: String(tier.delai_paiement ?? 0),
      remise_reference: String(tier.remise_reference ?? 0),
      volume_annuel: String(tier.volume_annuel ?? 0),
    })
  }

  return (
    <Layout>
      <Head>
        <title>Back-office - FarmFlow</title>
        <meta name="description" content="Referentiels produits, tiers, stocks et audit transactionnel FarmFlow." />
      </Head>

      <section className="mb-5 rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.55fr] xl:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-300">Referentiels & exploitation</p>
            <h1 className="mt-2 text-3xl font-semibold">Back-office</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
              Produits, tiers, lots, tarifs, seuils et ajustements de stock connectes aux tickets, achats et ecritures automatiques.
            </p>
            {isError && <p className="mt-3 text-sm text-amber-200">Donnees de secours affichees, API indisponible.</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(backoffice.kpis || fallbackData.kpis).map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/10 bg-white/10 p-3">
                <p className="text-xs text-slate-300">{stat.label}</p>
                <p className="mt-1 text-xl font-semibold">
                  {stat.label.toLowerCase().includes('stock') ? formatCurrency(stat.value) : stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <button
          onClick={() => setActiveTab('produits')}
          className={`rounded-lg border p-4 text-left transition ${activeTab === 'produits' ? 'border-slate-950 bg-white shadow-sm' : 'border-slate-200 bg-white/70 hover:bg-white'}`}
        >
          <FiPackage className="h-5 w-5 text-emerald-700" />
          <p className="mt-2 font-semibold text-slate-950">Produits</p>
          <p className="text-sm text-slate-500">{produits.length} references actives</p>
        </button>
        <button
          onClick={() => setActiveTab('tiers')}
          className={`rounded-lg border p-4 text-left transition ${activeTab === 'tiers' ? 'border-slate-950 bg-white shadow-sm' : 'border-slate-200 bg-white/70 hover:bg-white'}`}
        >
          <FiUsers className="h-5 w-5 text-sky-700" />
          <p className="mt-2 font-semibold text-slate-950">Tiers</p>
          <p className="text-sm text-slate-500">{tiers.length} clients et fournisseurs</p>
        </button>
        <button
          onClick={() => setActiveTab('stocks')}
          className={`rounded-lg border p-4 text-left transition ${activeTab === 'stocks' ? 'border-slate-950 bg-white shadow-sm' : 'border-slate-200 bg-white/70 hover:bg-white'}`}
        >
          <FiArchive className="h-5 w-5 text-amber-700" />
          <p className="mt-2 font-semibold text-slate-950">Stocks</p>
          <p className="text-sm text-slate-500">{formatNumber(stockSignals.total, 1)} unites suivies</p>
        </button>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          {activeTab === 'produits' && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                icon={FiPackage}
                title="Catalogue produits"
                action={<button onClick={() => setProductForm(emptyProduct)} className="btn btn-outline gap-2"><FiPlus className="h-4 w-4" />Nouveau</button>}
              />
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Produit</th>
                      <th className="px-4 py-3">Famille</th>
                      <th className="px-4 py-3">Prix</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">Lot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {produits.map((product) => (
                      <tr key={product.code} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <button onClick={() => editProduct(product)} className="text-left font-semibold text-slate-950 hover:text-emerald-700">
                            {product.nom}
                          </button>
                          <p className="text-xs text-slate-500">{product.code_barres || product.code}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{product.famille}</td>
                        <td className="px-4 py-3 font-medium text-slate-950">{formatCurrency(product.prix)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-1 text-xs font-medium ${product.seuil_alerte && product.stock <= product.seuil_alerte ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                            {formatNumber(product.stock, 1)} {product.unite}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{product.lot}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'tiers' && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                icon={FiUsers}
                title="Clients et fournisseurs"
                action={<button onClick={() => setTierForm(emptyTier)} className="btn btn-outline gap-2"><FiPlus className="h-4 w-4" />Nouveau</button>}
              />
              <div className="grid gap-3 md:grid-cols-2">
                {tiers.map((tier) => (
                  <button
                    key={tier.code}
                    onClick={() => editTier(tier)}
                    className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{tier.nom}</p>
                        <p className="mt-1 text-sm text-slate-500">{tier.type_tiers} - {tier.canal}</p>
                      </div>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800">
                        {tier.segment}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
                      <span>{tier.delai_paiement} j</span>
                      <span>{tier.remise_reference}% remise</span>
                      <span>{formatCurrency(tier.volume_annuel)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'stocks' && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader icon={FiArchive} title="Mouvements recents" />
              {stockSignals.alerts.length > 0 && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {stockSignals.alerts.length} seuil stock a traiter.
                </div>
              )}
              <div className="space-y-3">
                {(backoffice.mouvements || []).map((movement) => (
                  <div key={movement.reference} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[150px_1fr_120px] md:items-center">
                    <div>
                      <p className="font-semibold text-slate-950">{movement.produit}</p>
                      <p className="text-xs text-slate-500">{movement.reference}</p>
                    </div>
                    <p className="text-sm text-slate-600">{movement.origine} - {movement.lot}</p>
                    <p className={`text-right text-sm font-semibold ${movement.quantite < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {formatNumber(movement.quantite, 2)} {movement.unite}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            {activeTab === 'produits' && (
              <form onSubmit={submitProduct}>
                <SectionHeader icon={FiEdit3} title="Fiche produit" />
                <div className="grid gap-3 md:grid-cols-2">
                  <label><span className="label">Code</span><input value={productForm.code} onChange={(event) => setProductForm({ ...productForm, code: event.target.value })} className="input" /></label>
                  <label><span className="label">Code-barres</span><input value={productForm.code_barres} onChange={(event) => setProductForm({ ...productForm, code_barres: event.target.value })} className="input" /></label>
                  <label className="md:col-span-2"><span className="label">Nom</span><input value={productForm.nom} onChange={(event) => setProductForm({ ...productForm, nom: event.target.value })} className="input" required /></label>
                  <label><span className="label">Famille</span><input value={productForm.famille} onChange={(event) => setProductForm({ ...productForm, famille: event.target.value })} className="input" /></label>
                  <label><span className="label">Unite</span><input value={productForm.unite} onChange={(event) => setProductForm({ ...productForm, unite: event.target.value })} className="input" /></label>
                  <label><span className="label">Prix vente</span><input type="number" step="0.01" value={productForm.prix_vente} onChange={(event) => setProductForm({ ...productForm, prix_vente: event.target.value })} className="input" /></label>
                  <label><span className="label">Prix kg</span><input type="number" step="0.01" value={productForm.prix_kg} onChange={(event) => setProductForm({ ...productForm, prix_kg: event.target.value })} className="input" /></label>
                  <label><span className="label">TVA</span><input type="number" step="0.1" value={productForm.tva} onChange={(event) => setProductForm({ ...productForm, tva: event.target.value })} className="input" /></label>
                  <label><span className="label">Cout revient</span><input type="number" step="0.01" value={productForm.cout_revient} onChange={(event) => setProductForm({ ...productForm, cout_revient: event.target.value })} className="input" /></label>
                  <label><span className="label">Stock</span><input type="number" step="0.01" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} className="input" /></label>
                  <label><span className="label">Seuil alerte</span><input type="number" step="0.01" value={productForm.seuil_alerte} onChange={(event) => setProductForm({ ...productForm, seuil_alerte: event.target.value })} className="input" /></label>
                  <label className="md:col-span-2"><span className="label">Lot courant</span><input value={productForm.lot_courant} onChange={(event) => setProductForm({ ...productForm, lot_courant: event.target.value })} className="input" /></label>
                </div>
                <button disabled={productMutation.isLoading} className="mt-4 btn btn-primary w-full gap-2">
                  <FiSave className="h-4 w-4" />{productMutation.isLoading ? 'Enregistrement...' : 'Enregistrer produit'}
                </button>
              </form>
            )}

            {activeTab === 'tiers' && (
              <form onSubmit={submitTier}>
                <SectionHeader icon={FiUsers} title="Fiche tiers" />
                <div className="grid gap-3 md:grid-cols-2">
                  <label><span className="label">Code</span><input value={tierForm.code} onChange={(event) => setTierForm({ ...tierForm, code: event.target.value })} className="input" /></label>
                  <label><span className="label">Type</span><select value={tierForm.type_tiers} onChange={(event) => setTierForm({ ...tierForm, type_tiers: event.target.value })} className="input"><option value="client">Client</option><option value="fournisseur">Fournisseur</option></select></label>
                  <label className="md:col-span-2"><span className="label">Nom</span><input value={tierForm.nom} onChange={(event) => setTierForm({ ...tierForm, nom: event.target.value })} className="input" required /></label>
                  <label><span className="label">Segment</span><select value={tierForm.segment} onChange={(event) => setTierForm({ ...tierForm, segment: event.target.value })} className="input">{(backoffice.segments || fallbackData.segments).map((segment) => <option key={segment.code} value={segment.code}>{segment.nom}</option>)}</select></label>
                  <label><span className="label">Canal</span><input value={tierForm.canal} onChange={(event) => setTierForm({ ...tierForm, canal: event.target.value })} className="input" /></label>
                  <label><span className="label">Email</span><input value={tierForm.email} onChange={(event) => setTierForm({ ...tierForm, email: event.target.value })} className="input" /></label>
                  <label><span className="label">Telephone</span><input value={tierForm.telephone} onChange={(event) => setTierForm({ ...tierForm, telephone: event.target.value })} className="input" /></label>
                  <label><span className="label">Delai paiement</span><input type="number" value={tierForm.delai_paiement} onChange={(event) => setTierForm({ ...tierForm, delai_paiement: event.target.value })} className="input" /></label>
                  <label><span className="label">Remise reference</span><input type="number" step="0.1" value={tierForm.remise_reference} onChange={(event) => setTierForm({ ...tierForm, remise_reference: event.target.value })} className="input" /></label>
                  <label className="md:col-span-2"><span className="label">Volume annuel</span><input type="number" step="0.01" value={tierForm.volume_annuel} onChange={(event) => setTierForm({ ...tierForm, volume_annuel: event.target.value })} className="input" /></label>
                </div>
                <button disabled={tierMutation.isLoading} className="mt-4 btn btn-primary w-full gap-2">
                  <FiSave className="h-4 w-4" />{tierMutation.isLoading ? 'Enregistrement...' : 'Enregistrer tiers'}
                </button>
              </form>
            )}

            {activeTab === 'stocks' && (
              <form onSubmit={submitAdjustment}>
                <SectionHeader icon={FiSliders} title="Ajustement stock" />
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="md:col-span-2"><span className="label">Produit</span><select value={adjustmentForm.produit} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, produit: event.target.value })} className="input">{produits.map((product) => <option key={product.code} value={product.code}>{product.nom}</option>)}</select></label>
                  <label><span className="label">Sens</span><select value={adjustmentForm.sens} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, sens: event.target.value })} className="input"><option value="entree">Entree</option><option value="sortie">Sortie</option><option value="perte">Perte</option></select></label>
                  <label><span className="label">Quantite</span><input type="number" step="0.01" value={adjustmentForm.quantite} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, quantite: event.target.value })} className="input" /></label>
                  <label><span className="label">Lot</span><input value={adjustmentForm.lot} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, lot: event.target.value })} className="input" /></label>
                  <label><span className="label">Atelier</span><input value={adjustmentForm.atelier} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, atelier: event.target.value })} className="input" /></label>
                  <label className="md:col-span-2"><span className="label">Origine</span><input value={adjustmentForm.origine} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, origine: event.target.value })} className="input" /></label>
                  <label className="md:col-span-2"><span className="label">Cout unitaire</span><input type="number" step="0.01" value={adjustmentForm.cout_unitaire} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, cout_unitaire: event.target.value })} className="input" /></label>
                </div>
                <button disabled={adjustmentMutation.isLoading} className="mt-4 btn btn-primary w-full gap-2">
                  <FiRefreshCcw className="h-4 w-4" />{adjustmentMutation.isLoading ? 'Ajustement...' : 'Enregistrer mouvement'}
                </button>
              </form>
            )}
          </section>

          {lastAction && (
            <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <FiCheckCircle className="h-4 w-4" />
                Action enregistree
              </div>
              <p className="mt-1">{lastAction.statut}</p>
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader icon={FiDatabase} title="Audit comptable recent" />
            <div className="space-y-2">
              {(backoffice.ecritures || []).slice(0, 6).map((entry) => (
                <div key={entry.reference} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{entry.journal} - {entry.compte}</p>
                    <p className="text-xs text-slate-500">{entry.reference}</p>
                  </div>
                  <p className="mt-1 text-slate-600">{entry.libelle}</p>
                  <p className="mt-1 text-xs text-slate-500">Debit {formatCurrency(entry.debit)} / Credit {formatCurrency(entry.credit)}</p>
                </div>
              ))}
              {(!backoffice.ecritures || backoffice.ecritures.length === 0) && (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">Aucune ecriture recente.</p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </Layout>
  )
}
