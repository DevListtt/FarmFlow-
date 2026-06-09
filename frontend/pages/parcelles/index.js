import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import axios from 'axios'
import { FiCalendar, FiCheckCircle, FiCrosshair, FiLayers, FiMap, FiMapPin, FiNavigation, FiScissors, FiSliders, FiTruck } from 'react-icons/fi'
import Layout from '../../components/Layout'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const fallbackData = {
  centre_gps: { lat: 47.2138, lng: -1.5684 },
  parcelles: [
    { id: 'P-101', nom: 'Les Pres Nord', ilot_id: 'I-01', surface_ha: 12.4, culture: 'Ble tendre', sol: 'Limono-argileux', statut: 'en culture', rendement_prevu: 72, ift_prevu: 1.8, marge_prevue_ha: 1180, gps: [{ lat: 47.2164, lng: -1.5729 }, { lat: 47.2161, lng: -1.5685 }, { lat: 47.2134, lng: -1.5678 }, { lat: 47.2126, lng: -1.5716 }], itineraire: [{ stade: 'Semis', date: '2026-10-18', action: 'Semis 180 kg/ha', statut: 'planifie' }, { stade: 'Tallage', date: '2027-02-22', action: 'Azote 70 u', statut: 'a valider' }, { stade: 'Montaison', date: '2027-04-08', action: 'Fongicide T1 + oligo', statut: 'scenario' }] },
    { id: 'P-102', nom: 'Les Pres Sud', ilot_id: 'I-01', surface_ha: 8.7, culture: 'Orge hiver', sol: 'Limoneux', statut: 'en culture', rendement_prevu: 65, ift_prevu: 1.4, marge_prevue_ha: 930, gps: [{ lat: 47.2125, lng: -1.5715 }, { lat: 47.2132, lng: -1.5677 }, { lat: 47.2102, lng: -1.5667 }, { lat: 47.2093, lng: -1.5704 }], itineraire: [{ stade: 'Desherbage', date: '2026-11-16', action: 'Passage post-levee', statut: 'planifie' }, { stade: 'Nutrition', date: '2027-03-05', action: 'Azote 55 u', statut: 'scenario' }] },
    { id: 'P-201', nom: 'Grand Champ', ilot_id: 'I-02', surface_ha: 15.9, culture: 'Mais grain', sol: 'Argilo-calcaire', statut: 'a preparer', rendement_prevu: 96, ift_prevu: 1.2, marge_prevue_ha: 1420, gps: [{ lat: 47.2169, lng: -1.5654 }, { lat: 47.2157, lng: -1.5609 }, { lat: 47.2119, lng: -1.5618 }, { lat: 47.2129, lng: -1.5661 }], itineraire: [{ stade: 'Preparation', date: '2026-04-05', action: 'Faux semis + nivellement', statut: 'pret' }, { stade: 'Semis', date: '2026-04-22', action: 'Semis 92k grains/ha', statut: 'planifie' }, { stade: 'Desherbage', date: '2026-05-18', action: 'Binage + rattrapage localise', statut: 'scenario' }] },
    { id: 'P-301', nom: 'Maraichage Ouest', ilot_id: 'I-03', surface_ha: 3.6, culture: 'Legumes paniers', sol: 'Sable limoneux', statut: 'intensif', rendement_prevu: 16500, ift_prevu: 0.6, marge_prevue_ha: 8600, gps: [{ lat: 47.2108, lng: -1.5657 }, { lat: 47.2112, lng: -1.5626 }, { lat: 47.2088, lng: -1.5621 }, { lat: 47.2082, lng: -1.5652 }], itineraire: [{ stade: 'Plantation', date: '2026-03-14', action: 'Series tomates et salades', statut: 'pret' }, { stade: 'Irrigation', date: '2026-04-02', action: 'Controle goutte-a-goutte', statut: 'planifie' }, { stade: 'Recolte', date: '2026-05-10', action: 'Debut paniers hebdo', statut: 'scenario' }] },
    { id: 'P-302', nom: 'Serres Est', ilot_id: 'I-03', surface_ha: 1.8, culture: 'Plants', sol: 'Substrat + sable', statut: 'sous abri', rendement_prevu: 24000, ift_prevu: 0.3, marge_prevue_ha: 12400, gps: [{ lat: 47.2115, lng: -1.5616 }, { lat: 47.2112, lng: -1.5593 }, { lat: 47.2091, lng: -1.5592 }, { lat: 47.2089, lng: -1.5615 }], itineraire: [{ stade: 'Semis', date: '2026-02-18', action: 'Plaques plants tomate', statut: 'pret' }, { stade: 'Suivi', date: '2026-03-12', action: 'Controle temperature et humidite', statut: 'planifie' }] },
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
}

const cultureColors = { 'Ble tendre': '#65a30d', 'Orge hiver': '#ca8a04', 'Mais grain': '#16a34a', 'Legumes paniers': '#0d9488', Plants: '#2563eb' }
const statusClasses = { pret: 'border-emerald-200 bg-emerald-50 text-emerald-800', planifie: 'border-blue-200 bg-blue-50 text-blue-800', scenario: 'border-slate-200 bg-slate-50 text-slate-700', 'a valider': 'border-amber-200 bg-amber-50 text-amber-900' }
const formatHa = (value) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value || 0)} ha`
const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0)

const fetchCartographie = async () => (await axios.get(`${API_URL}/parcelles/cartographie`)).data
const createIlot = async (payload) => (await axios.post(`${API_URL}/parcelles/ilots/regrouper`, payload)).data
const planChantier = async (payload) => (await axios.post(`${API_URL}/parcelles/planifier-chantier`, payload)).data

const getBounds = (parcelles) => parcelles.flatMap((parcelle) => parcelle.gps || []).reduce((bounds, point) => ({ minLat: Math.min(bounds.minLat, point.lat), maxLat: Math.max(bounds.maxLat, point.lat), minLng: Math.min(bounds.minLng, point.lng), maxLng: Math.max(bounds.maxLng, point.lng) }), { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 })
const projectPoint = (point, bounds) => {
  const lngRange = Math.max(bounds.maxLng - bounds.minLng, 0.0001)
  const latRange = Math.max(bounds.maxLat - bounds.minLat, 0.0001)
  return { x: 36 + ((point.lng - bounds.minLng) / lngRange) * 748, y: 36 + (1 - (point.lat - bounds.minLat) / latRange) * 448 }
}
const polygonCenter = (points) => points.reduce((acc, point) => ({ x: acc.x + point.x / points.length, y: acc.y + point.y / points.length }), { x: 0, y: 0 })

export default function ParcellesPage() {
  const [mode, setMode] = useState('detail')
  const [activeParcelleId, setActiveParcelleId] = useState('P-101')
  const [activeIlotId, setActiveIlotId] = useState('I-01')
  const [selectedIds, setSelectedIds] = useState(['P-101', 'P-102'])
  const [ilotName, setIlotName] = useState('Ilot operationnel Nord')
  const [operation, setOperation] = useState('Fertilisation azotee')
  const [datePrevue, setDatePrevue] = useState('2026-04-08')
  const [materiel, setMateriel] = useState('Tracteur 120ch + epandeur')
  const [responsable, setResponsable] = useState('Chef de culture')

  const { data, isError } = useQuery('parcelles-cartographie', fetchCartographie, { staleTime: 60000 })
  const mapData = data?.parcelles?.length ? data : fallbackData
  const parcelles = mapData.parcelles || []
  const ilots = mapData.ilots || []
  const planning = mapData.planning_chantiers || []
  const bounds = useMemo(() => getBounds(parcelles), [parcelles])
  const ilotMutation = useMutation(createIlot)
  const chantierMutation = useMutation(planChantier)
  const activeParcelle = parcelles.find((parcelle) => parcelle.id === activeParcelleId) || fallbackData.parcelles[0]
  const activeIlot = ilots.find((ilot) => ilot.id === activeIlotId) || fallbackData.ilots[0]
  const selectedParcelles = parcelles.filter((parcelle) => selectedIds.includes(parcelle.id))
  const stats = useMemo(() => {
    const surface = parcelles.reduce((sum, parcelle) => sum + parcelle.surface_ha, 0)
    const ift = parcelles.reduce((sum, parcelle) => sum + parcelle.ift_prevu * parcelle.surface_ha, 0) / Math.max(surface, 1)
    return [{ label: 'Surface', value: formatHa(surface) }, { label: 'Parcelles', value: parcelles.length }, { label: 'Ilots', value: ilots.length }, { label: 'IFT moyen', value: ift.toFixed(1) }]
  }, [ilots.length, parcelles])

  const handleParcelleClick = (parcelle) => {
    setActiveParcelleId(parcelle.id)
    setActiveIlotId(parcelle.ilot_id)
    if (mode === 'regroupement') {
      setSelectedIds((current) => current.includes(parcelle.id) ? current.filter((id) => id !== parcelle.id) : [...current, parcelle.id])
    }
  }
  const submitIlot = () => ilotMutation.mutate({ nom: ilotName, parcelle_ids: selectedIds, objectif: 'optimisation chantier et cout machine' })
  const submitChantier = () => {
    const ids = mode === 'regroupement' && selectedIds.length ? selectedIds : [activeParcelle.id]
    chantierMutation.mutate({ parcelle_ids: ids, operation, date_prevue: datePrevue, materiel, responsable, priorite: ids.length > 1 ? 'haute' : 'normale' })
  }

  return (
    <Layout>
      <Head>
        <title>Parcelles GPS - FarmFlow</title>
        <meta name='description' content='Cartographie GPS, ilots, parcelles, chantiers et itineraires techniques FarmFlow.' />
      </Head>

      <section className='mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm'>
        <div className='grid gap-5 xl:grid-cols-[1fr_0.5fr] xl:items-end'>
          <div>
            <p className='text-sm font-semibold uppercase text-emerald-700'>Cartographie & agronomie</p>
            <h1 className='mt-2 text-3xl font-semibold text-slate-950'>Parcelles GPS</h1>
            <p className='mt-2 max-w-4xl text-sm leading-6 text-slate-600'>Decoupage parcellaire, regroupement en ilots, lecture technique, planning chantier et itineraire par culture.</p>
            {isError && <p className='mt-3 text-sm text-amber-700'>Donnees de secours chargees pour la cartographie.</p>}
          </div>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2'>
            {stats.map((stat) => <div key={stat.label} className='rounded-lg border border-slate-200 bg-slate-50 p-3'><p className='text-xs text-slate-500'>{stat.label}</p><p className='mt-1 text-xl font-semibold text-slate-950'>{stat.value}</p></div>)}
          </div>
        </div>
      </section>

      <section className='grid gap-5 xl:grid-cols-[1.35fr_0.65fr]'>
        <div className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            <div className='flex items-center gap-2'><FiMap className='h-5 w-5 text-emerald-700' /><h2 className='text-lg font-semibold text-slate-950'>Carte parcellaire</h2></div>
            <div className='grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1'>
              {[{ key: 'detail', label: 'Detail', icon: FiCrosshair }, { key: 'ilot', label: 'Ilots', icon: FiLayers }, { key: 'regroupement', label: 'Regrouper', icon: FiScissors }].map((item) => {
                const Icon = item.icon
                return <button key={item.key} onClick={() => setMode(item.key)} className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${mode === item.key ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}><Icon className='h-4 w-4' />{item.label}</button>
              })}
            </div>
          </div>
          <div className='relative overflow-hidden rounded-lg border border-emerald-100 bg-[#eef6e9]'>
            <svg viewBox='0 0 820 500' className='block aspect-[16/10] w-full'>
              <defs><pattern id='field-grid' width='41' height='41' patternUnits='userSpaceOnUse'><path d='M 41 0 L 0 0 0 41' fill='none' stroke='#d6e5d1' strokeWidth='1' /></pattern></defs>
              <rect width='820' height='500' fill='url(#field-grid)' />
              <path d='M36 414 C145 380 240 404 338 360 C470 300 590 330 790 260' fill='none' stroke='#94a3b8' strokeWidth='10' strokeLinecap='round' opacity='0.35' />
              <path d='M52 132 C205 150 265 104 398 116 C550 130 615 78 790 92' fill='none' stroke='#7dd3fc' strokeWidth='12' strokeLinecap='round' opacity='0.38' />
              {parcelles.map((parcelle) => {
                const points = parcelle.gps.map((point) => projectPoint(point, bounds))
                const center = polygonCenter(points)
                const active = (mode === 'detail' && activeParcelle?.id === parcelle.id) || (mode === 'ilot' && activeIlot?.id === parcelle.ilot_id) || (mode === 'regroupement' && selectedIds.includes(parcelle.id))
                return <g key={parcelle.id}><polygon points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill={cultureColors[parcelle.culture] || '#84cc16'} fillOpacity={active ? 0.72 : 0.38} stroke={active ? '#064e3b' : '#ffffff'} strokeWidth={active ? 4 : 2} className='cursor-pointer transition' onClick={() => handleParcelleClick(parcelle)} /><circle cx={center.x} cy={center.y} r={active ? 18 : 14} fill='white' fillOpacity='0.9' /><text x={center.x} y={center.y + 4} textAnchor='middle' className='pointer-events-none text-[13px] font-semibold fill-slate-900'>{parcelle.id.replace('P-', '')}</text></g>
              })}
            </svg>
            <div className='absolute bottom-3 left-3 right-3 grid gap-2 rounded-lg border border-white/70 bg-white/90 p-3 text-xs text-slate-600 shadow-sm backdrop-blur md:grid-cols-3'>
              <span className='inline-flex items-center gap-2'><FiMapPin className='h-4 w-4 text-emerald-700' /> Centre {mapData.centre_gps.lat.toFixed(4)}, {mapData.centre_gps.lng.toFixed(4)}</span>
              <span className='inline-flex items-center gap-2'><FiNavigation className='h-4 w-4 text-emerald-700' /> Projection locale GPS</span>
              <span className='inline-flex items-center gap-2'><FiLayers className='h-4 w-4 text-emerald-700' /> Mode {mode}</span>
            </div>
          </div>
        </div>

        <aside className='space-y-5'>
          <section className='rounded-lg border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='mb-4 flex items-start justify-between gap-3'><div><p className='text-sm font-semibold uppercase text-slate-500'>Parcelle active</p><h2 className='mt-1 text-xl font-semibold text-slate-950'>{activeParcelle.nom}</h2></div><span className='rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800'>{activeParcelle.statut}</span></div>
            <div className='grid grid-cols-2 gap-3'>
              {[['Surface', formatHa(activeParcelle.surface_ha)], ['Culture', activeParcelle.culture], ['IFT prevu', activeParcelle.ift_prevu], ['Marge / ha', formatCurrency(activeParcelle.marge_prevue_ha)]].map(([label, value]) => <div key={label} className='rounded-lg bg-slate-50 p-3'><p className='text-xs text-slate-500'>{label}</p><p className='mt-1 font-semibold text-slate-950'>{value}</p></div>)}
            </div>
            <div className='mt-4 rounded-lg border border-slate-200 p-3'><p className='text-xs font-medium uppercase text-slate-500'>Sol et ilot</p><p className='mt-2 text-sm text-slate-700'>{activeParcelle.sol} - {activeIlot?.nom}</p><p className='mt-1 text-sm text-slate-500'>{activeIlot?.contrainte}</p></div>
          </section>

          <section className='rounded-lg border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='mb-4 flex items-center gap-2'><FiScissors className='h-5 w-5 text-emerald-700' /><h2 className='text-lg font-semibold text-slate-950'>Regroupement ilot</h2></div>
            <input value={ilotName} onChange={(event) => setIlotName(event.target.value)} className='input' />
            <div className='mt-3 flex flex-wrap gap-2'>{selectedParcelles.map((parcelle) => <span key={parcelle.id} className='rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800'>{parcelle.id} - {formatHa(parcelle.surface_ha)}</span>)}</div>
            <button onClick={submitIlot} disabled={ilotMutation.isLoading || selectedIds.length < 1} className='mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-300'><FiLayers className='h-4 w-4' />{ilotMutation.isLoading ? 'Calcul...' : 'Regrouper'}</button>
            {ilotMutation.data && <p className='mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900'>{ilotMutation.data.nom} prepare - {formatHa(ilotMutation.data.surface_ha)}</p>}
          </section>
        </aside>
      </section>

      <section className='mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]'>
        <section className='rounded-lg border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='mb-4 flex items-center gap-2'><FiSliders className='h-5 w-5 text-emerald-700' /><h2 className='text-lg font-semibold text-slate-950'>Itineraire technique</h2></div>
          <div className='space-y-3'>{(activeParcelle.itineraire || []).map((step) => <div key={`${step.stade}-${step.date}`} className='grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[110px_1fr_120px] md:items-center'><div><p className='text-sm font-semibold text-slate-950'>{step.stade}</p><p className='text-xs text-slate-500'>{step.date}</p></div><p className='text-sm text-slate-700'>{step.action}</p><span className={`inline-flex justify-center rounded-full border px-2 py-1 text-xs font-medium ${statusClasses[step.statut] || statusClasses.scenario}`}>{step.statut}</span></div>)}</div>
        </section>

        <section className='rounded-lg border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='mb-4 flex items-center gap-2'><FiCalendar className='h-5 w-5 text-emerald-700' /><h2 className='text-lg font-semibold text-slate-950'>Planification chantier</h2></div>
          <div className='grid gap-3 md:grid-cols-2'>
            <label><span className='mb-1 block text-xs font-medium text-slate-500'>Operation</span><input value={operation} onChange={(event) => setOperation(event.target.value)} className='input' /></label>
            <label><span className='mb-1 block text-xs font-medium text-slate-500'>Date prevue</span><input type='date' value={datePrevue} onChange={(event) => setDatePrevue(event.target.value)} className='input' /></label>
            <label><span className='mb-1 block text-xs font-medium text-slate-500'>Materiel</span><input value={materiel} onChange={(event) => setMateriel(event.target.value)} className='input' /></label>
            <label><span className='mb-1 block text-xs font-medium text-slate-500'>Responsable</span><input value={responsable} onChange={(event) => setResponsable(event.target.value)} className='input' /></label>
          </div>
          <button onClick={submitChantier} disabled={chantierMutation.isLoading} className='mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:bg-emerald-300'><FiTruck className='h-4 w-4' />{chantierMutation.isLoading ? 'Planification...' : 'Planifier chantier'}</button>
          {chantierMutation.data && <div className='mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900'><p className='font-semibold'>{chantierMutation.data.operation} - {chantierMutation.data.statut}</p><p className='mt-1'>{chantierMutation.data.surface_ha} ha couverts avec {chantierMutation.data.materiel}</p></div>}
        </section>
      </section>

      <section className='mt-5 grid gap-5 xl:grid-cols-[0.72fr_1.28fr]'>
        <section className='rounded-lg border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='mb-4 flex items-center gap-2'><FiLayers className='h-5 w-5 text-emerald-700' /><h2 className='text-lg font-semibold text-slate-950'>Ilots</h2></div>
          <div className='space-y-3'>{ilots.map((ilot) => <button key={ilot.id} onClick={() => { setMode('ilot'); setActiveIlotId(ilot.id); setSelectedIds(ilot.parcelle_ids) }} className={`w-full rounded-lg border p-3 text-left ${activeIlot?.id === ilot.id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}><div className='flex items-center justify-between gap-3'><p className='font-semibold text-slate-950'>{ilot.nom}</p><span className='text-sm text-slate-500'>{formatHa(ilot.surface_ha)}</span></div><p className='mt-1 text-sm text-slate-600'>{ilot.usage}</p></button>)}</div>
        </section>

        <section className='rounded-lg border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='mb-4 flex items-center gap-2'><FiCheckCircle className='h-5 w-5 text-emerald-700' /><h2 className='text-lg font-semibold text-slate-950'>Chantiers a venir</h2></div>
          <div className='overflow-hidden rounded-lg border border-slate-200'>
            <table className='min-w-full divide-y divide-slate-200 text-sm'><thead className='bg-slate-50 text-left text-xs uppercase text-slate-500'><tr><th className='px-4 py-3'>Date</th><th className='px-4 py-3'>Operation</th><th className='px-4 py-3'>Parcelles</th><th className='px-4 py-3'>Materiel</th><th className='px-4 py-3'>Statut</th></tr></thead><tbody className='divide-y divide-slate-200 bg-white'>{planning.map((chantier) => <tr key={chantier.id}><td className='px-4 py-3 font-medium text-slate-950'>{chantier.date}</td><td className='px-4 py-3 text-slate-700'>{chantier.operation}</td><td className='px-4 py-3 text-slate-600'>{chantier.parcelles.join(', ')}</td><td className='px-4 py-3 text-slate-600'>{chantier.materiel}</td><td className='px-4 py-3'><span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClasses[chantier.statut] || statusClasses.scenario}`}>{chantier.statut}</span></td></tr>)}</tbody></table>
          </div>
        </section>
      </section>
    </Layout>
  )
}
