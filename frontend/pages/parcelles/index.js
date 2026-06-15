import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import axios from 'axios'
import {
  FiCalendar,
  FiCheckCircle,
  FiDatabase,
  FiFileText,
  FiLayers,
  FiMapPin,
  FiSliders,
  FiSmartphone,
  FiTruck,
} from 'react-icons/fi'
import Layout from '../../components/Layout'
import ParcelleMapWorkbench from '../../components/ParcelleMapWorkbench'
import { fieldModeSteps } from '../../lib/profileWorkspace'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const SERVER_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const fallbackData = {
  centre_gps: { lat: 47.2138, lng: -1.5684 },
  parcelles: [
    {
      id: 'P-101',
      nom: 'Les Pres Nord',
      ilot_id: 'I-01',
      surface_ha: 12.4,
      culture: 'Ble tendre',
      sol: 'Limono-argileux',
      statut: 'en culture',
      rendement_prevu: 72,
      ift_prevu: 1.8,
      marge_prevue_ha: 1180,
      gps: [
        { lat: 47.2164, lng: -1.5729 },
        { lat: 47.2161, lng: -1.5685 },
        { lat: 47.2134, lng: -1.5678 },
        { lat: 47.2126, lng: -1.5716 },
      ],
      itineraire: [
        { stade: 'Semis', date: '2026-10-18', action: 'Semis 180 kg/ha', statut: 'planifie' },
        { stade: 'Tallage', date: '2027-02-22', action: 'Azote 70 u', statut: 'a valider' },
        { stade: 'Montaison', date: '2027-04-08', action: 'Fongicide T1 + oligo', statut: 'scenario' },
      ],
    },
    {
      id: 'P-102',
      nom: 'Les Pres Sud',
      ilot_id: 'I-01',
      surface_ha: 8.7,
      culture: 'Orge hiver',
      sol: 'Limoneux',
      statut: 'en culture',
      rendement_prevu: 65,
      ift_prevu: 1.4,
      marge_prevue_ha: 930,
      gps: [
        { lat: 47.2125, lng: -1.5715 },
        { lat: 47.2132, lng: -1.5677 },
        { lat: 47.2102, lng: -1.5667 },
        { lat: 47.2093, lng: -1.5704 },
      ],
      itineraire: [
        { stade: 'Desherbage', date: '2026-11-16', action: 'Passage post-levee', statut: 'planifie' },
        { stade: 'Nutrition', date: '2027-03-05', action: 'Azote 55 u', statut: 'scenario' },
      ],
    },
    {
      id: 'P-201',
      nom: 'Grand Champ',
      ilot_id: 'I-02',
      surface_ha: 15.9,
      culture: 'Mais grain',
      sol: 'Argilo-calcaire',
      statut: 'a preparer',
      rendement_prevu: 96,
      ift_prevu: 1.2,
      marge_prevue_ha: 1420,
      gps: [
        { lat: 47.2169, lng: -1.5654 },
        { lat: 47.2157, lng: -1.5609 },
        { lat: 47.2119, lng: -1.5618 },
        { lat: 47.2129, lng: -1.5661 },
      ],
      itineraire: [
        { stade: 'Preparation', date: '2026-04-05', action: 'Faux semis + nivellement', statut: 'pret' },
        { stade: 'Semis', date: '2026-04-22', action: 'Semis 92k grains/ha', statut: 'planifie' },
        { stade: 'Desherbage', date: '2026-05-18', action: 'Binage + rattrapage localise', statut: 'scenario' },
      ],
    },
    {
      id: 'P-301',
      nom: 'Maraichage Ouest',
      ilot_id: 'I-03',
      surface_ha: 3.6,
      culture: 'Legumes paniers',
      sol: 'Sable limoneux',
      statut: 'intensif',
      rendement_prevu: 16500,
      ift_prevu: 0.6,
      marge_prevue_ha: 8600,
      gps: [
        { lat: 47.2108, lng: -1.5657 },
        { lat: 47.2112, lng: -1.5626 },
        { lat: 47.2088, lng: -1.5621 },
        { lat: 47.2082, lng: -1.5652 },
      ],
      itineraire: [
        { stade: 'Plantation', date: '2026-03-14', action: 'Series tomates et salades', statut: 'pret' },
        { stade: 'Irrigation', date: '2026-04-02', action: 'Controle goutte-a-goutte', statut: 'planifie' },
        { stade: 'Recolte', date: '2026-05-10', action: 'Debut paniers hebdo', statut: 'scenario' },
      ],
    },
    {
      id: 'P-302',
      nom: 'Serres Est',
      ilot_id: 'I-03',
      surface_ha: 1.8,
      culture: 'Plants',
      sol: 'Substrat + sable',
      statut: 'sous abri',
      rendement_prevu: 24000,
      ift_prevu: 0.3,
      marge_prevue_ha: 12400,
      gps: [
        { lat: 47.2115, lng: -1.5616 },
        { lat: 47.2112, lng: -1.5593 },
        { lat: 47.2091, lng: -1.5592 },
        { lat: 47.2089, lng: -1.5615 },
      ],
      itineraire: [
        { stade: 'Semis', date: '2026-02-18', action: 'Plaques plants tomate', statut: 'pret' },
        { stade: 'Suivi', date: '2026-03-12', action: 'Controle temperature et humidite', statut: 'planifie' },
      ],
    },
  ],
  ilots: [
    { id: 'I-01', nom: 'Ilot Pres', parcelle_ids: ['P-101', 'P-102'], surface_ha: 21.1, usage: 'Cereales hiver', contrainte: 'Fenetre epandage courte' },
    { id: 'I-02', nom: 'Ilot Grand Champ', parcelle_ids: ['P-201'], surface_ha: 15.9, usage: 'Culture printemps', contrainte: 'Portance variable' },
    { id: 'I-03', nom: 'Ilot Vente directe', parcelle_ids: ['P-301', 'P-302'], surface_ha: 5.4, usage: 'Maraichage et plants', contrainte: 'Irrigation prioritaire' },
  ],
  planning_chantiers: [
    { id: 'CH-240', date: '2026-03-14', operation: 'Plantation legumes', parcelles: ['P-301', 'P-302'], materiel: 'Planteuse + goutte-a-goutte', statut: 'pret' },
    { id: 'CH-251', date: '2026-04-05', operation: 'Preparation mais', parcelles: ['P-201'], materiel: 'Tracteur 180ch + vibroculteur', statut: 'a valider' },
    { id: 'CH-263', date: '2026-04-08', operation: 'Fongicide cereales', parcelles: ['P-101', 'P-102'], materiel: 'Pulverisateur 24m', statut: 'scenario' },
  ],
  registre_terrain: [
    { id: 'LOG-001', date: '2026-03-12', type: 'observation', parcelle: 'P-301', titre: 'Humidite sol correcte', source: 'terrain', statut: 'valide' },
    { id: 'LOG-002', date: '2026-03-14', type: 'intervention', parcelle: 'P-301', titre: 'Plantation legumes', source: 'chantier', statut: 'pret' },
    { id: 'LOG-003', date: '2026-04-02', type: 'alerte', parcelle: 'P-302', titre: 'Controle irrigation serre', source: 'capteur', statut: 'a controler' },
    { id: 'LOG-004', date: '2026-04-08', type: 'stock', parcelle: 'P-101', titre: 'Intrants a reserver', source: 'stock', statut: 'scenario' },
  ],
  postgis_readiness: {
    statut: 'pret a migrer',
    srid: 4326,
    tables_cibles: ['agri_parcelles', 'agri_ilots', 'agri_observations', 'agri_chantiers'],
    controles: ['geometrie valide', 'surface coherente', 'pas d auto-intersection', 'ilot continu'],
  },
}

const cultureColors = {
  'Ble tendre': '#65a30d',
  'Orge hiver': '#ca8a04',
  'Mais grain': '#16a34a',
  'Legumes paniers': '#0d9488',
  Plants: '#2563eb',
  'A definir': '#475569',
}

const statusClasses = {
  pret: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  planifie: 'border-blue-200 bg-blue-50 text-blue-800',
  scenario: 'border-slate-200 bg-slate-50 text-slate-700',
  'a valider': 'border-amber-200 bg-amber-50 text-amber-900',
}

const getLayerFill = (parcelle, layer) => {
  if (layer === 'ift') {
    if (parcelle.ift_prevu >= 1.7) return '#dc2626'
    if (parcelle.ift_prevu >= 1.2) return '#d97706'
    return '#059669'
  }
  if (layer === 'marge') {
    if (parcelle.marge_prevue_ha >= 6000) return '#2563eb'
    if (parcelle.marge_prevue_ha >= 1200) return '#0d9488'
    return '#84cc16'
  }
  if (layer === 'chantier') {
    if (parcelle.statut === 'a preparer') return '#f59e0b'
    if (parcelle.statut === 'intensif' || parcelle.statut === 'sous abri') return '#0284c7'
    return '#16a34a'
  }
  if (layer === 'ilot') {
    return { 'I-01': '#16a34a', 'I-02': '#0ea5e9', 'I-03': '#a855f7', 'I-DRAFT': '#475569', 'I-IMPORT': '#f97316' }[parcelle.ilot_id] || '#64748b'
  }
  return cultureColors[parcelle.culture] || '#84cc16'
}

const formatHa = (value) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value || 0)} ha`
const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0)

const fetchCartographie = async () => {
  const response = await axios.get(`${API_URL}/parcelles/cartographie`)
  return response.data
}

const createIlot = async (payload) => {
  const response = await axios.post(`${API_URL}/parcelles/ilots/regrouper`, payload)
  return response.data
}

const planChantier = async (payload) => {
  const response = await axios.post(`${API_URL}/parcelles/planifier-chantier`, payload)
  return response.data
}

export async function getServerSideProps() {
  try {
    const response = await axios.get(`${SERVER_API_URL}/parcelles/cartographie`, { timeout: 5000 })
    return { props: { initialMapData: response.data } }
  } catch {
    return { props: { initialMapData: null } }
  }
}

export default function ParcellesPage({ initialMapData = null }) {
  const [layer, setLayer] = useState('culture')
  const [activeParcelleId, setActiveParcelleId] = useState('P-101')
  const [activeIlotId, setActiveIlotId] = useState('I-01')
  const [selectedIds, setSelectedIds] = useState(['P-101', 'P-102'])
  const [workingParcelles, setWorkingParcelles] = useState([])
  const [ilotName] = useState('Ilot operationnel Nord')
  const [operation, setOperation] = useState('Fertilisation azotee')
  const [datePrevue, setDatePrevue] = useState('2026-04-08')
  const [materiel, setMateriel] = useState('Tracteur 120ch + epandeur')
  const [responsable, setResponsable] = useState('Chef de culture')
  const [fieldStep, setFieldStep] = useState(fieldModeSteps[0].code)

  const { data, isError } = useQuery('parcelles-cartographie', fetchCartographie, {
    staleTime: 60000,
    initialData: initialMapData || undefined,
  })
  const mapData = data?.parcelles?.length ? data : fallbackData
  const sourceParcelles = useMemo(() => mapData.parcelles || [], [mapData.parcelles])

  useEffect(() => {
    setWorkingParcelles(sourceParcelles)
  }, [sourceParcelles])

  const parcelles = workingParcelles.length ? workingParcelles : sourceParcelles
  const ilots = mapData.ilots || []
  const planning = mapData.planning_chantiers || []
  const registreTerrain = mapData.registre_terrain || fallbackData.registre_terrain
  const postgisReadiness = mapData.postgis_readiness || fallbackData.postgis_readiness
  const layers = mapData.couches || [
    { code: 'culture', nom: 'Cultures', statut: 'actif' },
    { code: 'ilot', nom: 'Ilots', statut: 'actif' },
    { code: 'marge', nom: 'Marge', statut: 'calcule' },
    { code: 'ift', nom: 'IFT', statut: 'calcule' },
    { code: 'chantier', nom: 'Chantiers', statut: 'planifie' },
  ]
  const alertes = mapData.alertes || []
  const connecteurs = mapData.connecteurs || []

  const ilotMutation = useMutation(createIlot)
  const chantierMutation = useMutation(planChantier)

  const activeParcelle = parcelles.find((parcelle) => parcelle.id === activeParcelleId) || parcelles[0] || fallbackData.parcelles[0]
  const activeIlot = ilots.find((ilot) => ilot.id === activeIlotId) || fallbackData.ilots[0]
  const activeFieldStep = fieldModeSteps.find((step) => step.code === fieldStep) || fieldModeSteps[0]

  const stats = useMemo(() => {
    const surface = parcelles.reduce((sum, parcelle) => sum + Number(parcelle.surface_ha || 0), 0)
    const marge = parcelles.reduce((sum, parcelle) => sum + Number(parcelle.surface_ha || 0) * Number(parcelle.marge_prevue_ha || 0), 0)
    const ift = parcelles.reduce((sum, parcelle) => sum + Number(parcelle.surface_ha || 0) * Number(parcelle.ift_prevu || 0), 0) / Math.max(surface, 1)
    return [
      { label: 'Surface', value: formatHa(surface) },
      { label: 'Parcelles', value: parcelles.length },
      { label: 'Marge prevue', value: formatCurrency(marge) },
      { label: 'IFT moyen', value: ift.toFixed(1) },
    ]
  }, [parcelles])

  const submitIlot = () => {
    ilotMutation.mutate({
      nom: ilotName,
      parcelle_ids: selectedIds,
      objectif: 'optimisation chantier et cout machine',
    })
  }

  const submitChantier = () => {
    const ids = selectedIds.length ? selectedIds : [activeParcelle.id]
    chantierMutation.mutate({
      parcelle_ids: ids,
      operation,
      date_prevue: datePrevue,
      materiel,
      responsable,
      priorite: ids.length > 1 ? 'haute' : 'normale',
    })
  }

  return (
    <Layout>
      <Head>
        <title>Parcelles GPS - FarmFlow</title>
        <meta name="description" content="Atelier cartographique GPS, ilots, parcelles, chantiers et itineraires techniques FarmFlow." />
      </Head>

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.5fr] xl:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Atelier cartographique</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Parcelles GPS</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Carte interactive, dessin terrain, edition de sommets, decoupe, ilots, couches metier et exports GeoJSON.
            </p>
            {isError && <p className="mt-3 text-sm text-amber-700">Donnees de secours chargees pour la cartographie.</p>}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]" data-testid="field-mode">
        <div className="command-panel p-5 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-100">
            <FiSmartphone className="h-4 w-4" />
            Mode terrain
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">{activeFieldStep.label}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{activeFieldStep.detail}</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {fieldModeSteps.map((step) => (
              <button
                key={step.code}
                type="button"
                onClick={() => setFieldStep(step.code)}
                className={`touch-button border px-3 py-2 text-sm ${
                  fieldStep === step.code
                    ? 'border-emerald-300 bg-emerald-300 text-slate-950'
                    : 'border-white/15 bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>

        <div className="surface grid gap-4 p-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white/80 p-3">
            <div className="flex items-center gap-2">
              <FiMapPin className="h-4 w-4 text-emerald-700" />
              <p className="text-xs font-semibold uppercase text-slate-500">Parcelle active</p>
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-950">{activeParcelle.nom}</p>
            <p className="mt-1 text-sm text-slate-500">{activeParcelle.culture} - {formatHa(activeParcelle.surface_ha)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/80 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Prochaine operation</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{operation}</p>
            <p className="mt-1 text-sm text-slate-500">{datePrevue} - {responsable}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/80 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Selection chantier</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{selectedIds.length} parcelle{selectedIds.length > 1 ? 's' : ''}</p>
            <p className="mt-1 text-sm text-slate-500">{selectedIds.join(', ') || activeParcelle.id}</p>
          </div>
        </div>
      </section>

      <ParcelleMapWorkbench
        centre={mapData.centre_gps || fallbackData.centre_gps}
        parcelles={parcelles}
        setParcelles={setWorkingParcelles}
        initialParcelles={sourceParcelles}
        layers={layers}
        layer={layer}
        setLayer={setLayer}
        activeParcelleId={activeParcelleId}
        setActiveParcelleId={setActiveParcelleId}
        activeIlotId={activeIlotId}
        setActiveIlotId={setActiveIlotId}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        ilots={ilots}
        connecteurs={connecteurs}
        alertes={alertes}
        getLayerFill={getLayerFill}
        onCreateIlot={submitIlot}
        ilotLoading={ilotMutation.isLoading}
        ilotResult={ilotMutation.data}
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FiFileText className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-slate-950">Registre terrain</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {registreTerrain.map((log) => (
              <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase text-slate-500">{log.type}</span>
                  <span className="text-xs text-slate-500">{log.date}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-950">{log.titre}</p>
                <p className="mt-1 text-xs text-slate-500">{log.parcelle} - {log.source} - {log.statut}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FiDatabase className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-slate-950">Cible PostGIS</h2>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm font-semibold text-emerald-950">{postgisReadiness.statut}</p>
            <p className="mt-1 text-xs text-emerald-800">SRID {postgisReadiness.srid} pour parcelles, ilots, observations et chantiers.</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(postgisReadiness.tables_cibles || []).map((table) => (
              <div key={table} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                {table}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(postgisReadiness.controles || []).map((controle) => (
              <span key={controle} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                {controle}
              </span>
            ))}
          </div>
        </section>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FiSliders className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-slate-950">Itineraire technique</h2>
          </div>
          <div className="space-y-3">
            {(activeParcelle.itineraire || []).map((step) => (
              <div key={`${step.stade}-${step.date}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[110px_1fr_120px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{step.stade}</p>
                  <p className="text-xs text-slate-500">{step.date}</p>
                </div>
                <p className="text-sm text-slate-700">{step.action}</p>
                <span className={`inline-flex justify-center rounded-full border px-2 py-1 text-xs font-medium ${statusClasses[step.statut] || statusClasses.scenario}`}>
                  {step.statut}
                </span>
              </div>
            ))}
            {(activeParcelle.itineraire || []).length === 0 && (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">Aucun itineraire sur cette trace.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FiCalendar className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-slate-950">Planification chantier</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Operation</span>
              <input value={operation} onChange={(event) => setOperation(event.target.value)} className="input" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Date prevue</span>
              <input type="date" value={datePrevue} onChange={(event) => setDatePrevue(event.target.value)} className="input" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Materiel</span>
              <input value={materiel} onChange={(event) => setMateriel(event.target.value)} className="input" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Responsable</span>
              <input value={responsable} onChange={(event) => setResponsable(event.target.value)} className="input" />
            </label>
          </div>
          <button
            onClick={submitChantier}
            disabled={chantierMutation.isLoading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:bg-emerald-300"
          >
            <FiTruck className="h-4 w-4" />
            {chantierMutation.isLoading ? 'Planification...' : 'Planifier chantier'}
          </button>
          {chantierMutation.data && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <p className="font-semibold">{chantierMutation.data.operation} - {chantierMutation.data.statut}</p>
              <p className="mt-1">{chantierMutation.data.surface_ha} ha couverts avec {chantierMutation.data.materiel}</p>
            </div>
          )}
        </section>
      </section>

      <section className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FiLayers className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-slate-950">Ilots</h2>
          </div>
          <div className="space-y-3">
            {ilots.map((ilot) => (
              <button
                key={ilot.id}
                onClick={() => {
                  setActiveIlotId(ilot.id)
                  setSelectedIds(ilot.parcelle_ids)
                }}
                className={`w-full rounded-lg border p-3 text-left ${activeIlot?.id === ilot.id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{ilot.nom}</p>
                  <span className="text-sm text-slate-500">{formatHa(ilot.surface_ha)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{ilot.usage}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FiCheckCircle className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-slate-950">Chantiers a venir</h2>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Operation</th>
                  <th className="px-4 py-3">Parcelles</th>
                  <th className="px-4 py-3">Materiel</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {planning.map((chantier) => (
                  <tr key={chantier.id}>
                    <td className="px-4 py-3 font-medium text-slate-950">{chantier.date}</td>
                    <td className="px-4 py-3 text-slate-700">{chantier.operation}</td>
                    <td className="px-4 py-3 text-slate-600">{chantier.parcelles.join(', ')}</td>
                    <td className="px-4 py-3 text-slate-600">{chantier.materiel}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClasses[chantier.statut] || statusClasses.scenario}`}>
                        {chantier.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </Layout>
  )
}
