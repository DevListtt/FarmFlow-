import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { area as turfArea } from '@turf/area'
import { centroid as turfCentroid } from '@turf/centroid'
import {
  FiCheck,
  FiCrosshair,
  FiDownload,
  FiEdit3,
  FiLayers,
  FiMapPin,
  FiMaximize2,
  FiMinimize2,
  FiMousePointer,
  FiPlus,
  FiRotateCcw,
  FiScissors,
  FiSearch,
  FiTrash2,
  FiUpload,
} from 'react-icons/fi'

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

const workModes = [
  { key: 'selection', label: 'Selection', icon: FiMousePointer },
  { key: 'dessin', label: 'Dessin', icon: FiPlus },
  { key: 'edition', label: 'Edition', icon: FiEdit3 },
  { key: 'decoupe', label: 'Decoupe', icon: FiScissors },
  { key: 'regroupement', label: 'Ilot', icon: FiLayers },
]

const statusClasses = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
}

const formatHa = (value) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value || 0)} ha`
const formatNumber = (value, digits = 5) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(value || 0)

const toLatLngs = (points = []) => points.map((point) => [point.lat, point.lng])

const closedCoordinates = (points = []) => {
  const coords = points.map((point) => [point.lng, point.lat])
  if (!coords.length) return coords
  const first = coords[0]
  const last = coords[coords.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first)
  return coords
}

const toGeoJsonFeature = (parcelle) => ({
  type: 'Feature',
  properties: {
    id: parcelle.id,
    nom: parcelle.nom,
    ilot_id: parcelle.ilot_id,
    culture: parcelle.culture,
    statut: parcelle.statut,
    surface_ha: parcelle.surface_ha,
  },
  geometry: {
    type: 'Polygon',
    coordinates: [closedCoordinates(parcelle.gps || [])],
  },
})

const computeAreaHa = (points = []) => {
  if (points.length < 3) return 0
  try {
    return turfArea({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [closedCoordinates(points)] },
    }) / 10000
  } catch {
    return 0
  }
}

const computeCenter = (points = []) => {
  if (!points.length) return null
  try {
    const feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [closedCoordinates(points)] },
    }
    const [lng, lat] = turfCentroid(feature).geometry.coordinates
    return { lat, lng }
  } catch {
    const total = points.reduce((acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }), { lat: 0, lng: 0 })
    return { lat: total.lat / points.length, lng: total.lng / points.length }
  }
}

const getBounds = (points = []) => {
  if (!points.length) return null
  return points.reduce((acc, point) => ({
    minLat: Math.min(acc.minLat, point.lat),
    maxLat: Math.max(acc.maxLat, point.lat),
    minLng: Math.min(acc.minLng, point.lng),
    maxLng: Math.max(acc.maxLng, point.lng),
  }), {
    minLat: points[0].lat,
    maxLat: points[0].lat,
    minLng: points[0].lng,
    maxLng: points[0].lng,
  })
}

const intersectLng = (start, end, lng) => {
  const distance = end.lng - start.lng
  if (distance === 0) return { lat: start.lat, lng }
  const ratio = (lng - start.lng) / distance
  return {
    lat: start.lat + ratio * (end.lat - start.lat),
    lng,
  }
}

const clipByLng = (points = [], lng, side) => {
  if (points.length < 3) return []
  const output = []
  const inside = (point) => (side === 'left' ? point.lng <= lng : point.lng >= lng)

  points.forEach((current, index) => {
    const previous = points[(index + points.length - 1) % points.length]
    const currentInside = inside(current)
    const previousInside = inside(previous)

    if (currentInside) {
      if (!previousInside) output.push(intersectLng(previous, current, lng))
      output.push(current)
    } else if (previousInside) {
      output.push(intersectLng(previous, current, lng))
    }
  })

  return output.length >= 3 ? output : []
}

const polygonStyle = (parcelle, layer, getLayerFill, active, selected) => ({
  color: active ? '#064e3b' : selected ? '#0f766e' : '#ffffff',
  weight: active ? 4 : selected ? 3 : 2,
  opacity: 0.95,
  fillColor: getLayerFill(parcelle, layer),
  fillOpacity: active || selected ? 0.52 : 0.34,
})

const buildGeoJson = (parcelles) => ({
  type: 'FeatureCollection',
  features: parcelles
    .filter((parcelle) => (parcelle.gps || []).length >= 3)
    .map(toGeoJsonFeature),
})

const stopMapEvent = (event) => {
  event.stopPropagation()
}

const parseGpsQuery = (query) => {
  const normalized = query
    .trim()
    .replace(/[;|]/g, ',')
    .replace(/\s+/g, ' ')
  const direct = normalized.match(/(-?\d+(?:[.,]\d+)?)\s*[, ]\s*(-?\d+(?:[.,]\d+)?)/)
  if (!direct) return null
  const lat = Number(direct[1].replace(',', '.'))
  const lng = Number(direct[2].replace(',', '.'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

export default function ParcelleMapWorkbench({
  centre,
  parcelles,
  setParcelles,
  initialParcelles,
  layers,
  layer,
  setLayer,
  activeParcelleId,
  setActiveParcelleId,
  activeIlotId,
  setActiveIlotId,
  selectedIds,
  setSelectedIds,
  ilots,
  connecteurs,
  alertes,
  getLayerFill,
  onCreateIlot,
  ilotLoading,
  ilotResult,
}) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const leafletRef = useRef(null)
  const parcelleLayerRef = useRef(null)
  const draftLayerRef = useRef(null)
  const editLayerRef = useRef(null)
  const searchLayerRef = useRef(null)
  const fileInputRef = useRef(null)
  const fittedRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  const [workMode, setWorkMode] = useState('selection')
  const [draftPoints, setDraftPoints] = useState([])
  const [expanded, setExpanded] = useState(false)
  const [message, setMessage] = useState('Pret')
  const [geoQuery, setGeoQuery] = useState('')
  const [geoStatus, setGeoStatus] = useState('')
  const [deleteIntent, setDeleteIntent] = useState(null)

  const activeParcelle = useMemo(
    () => parcelles.find((parcelle) => parcelle.id === activeParcelleId) || parcelles[0],
    [activeParcelleId, parcelles]
  )

  const selectedParcelles = useMemo(
    () => parcelles.filter((parcelle) => selectedIds.includes(parcelle.id)),
    [parcelles, selectedIds]
  )

  const activeMetrics = useMemo(() => {
    if (!activeParcelle) return null
    const gps = activeParcelle.gps || []
    return {
      area: computeAreaHa(gps),
      center: computeCenter(gps),
      points: gps.length,
    }
  }, [activeParcelle])

  const setActive = useCallback((parcelle) => {
    if (!parcelle) return
    setActiveParcelleId(parcelle.id)
    setActiveIlotId(parcelle.ilot_id)
    if (workMode === 'regroupement') {
      setSelectedIds((current) => (
        current.includes(parcelle.id)
          ? current.filter((id) => id !== parcelle.id)
          : [...current, parcelle.id]
      ))
    }
  }, [setActiveIlotId, setActiveParcelleId, setSelectedIds, workMode])

  const fitParcelles = useCallback((items) => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map || !items.length) return
    const latLngs = items.flatMap((parcelle) => toLatLngs(parcelle.gps || []))
    if (!latLngs.length) return
    map.fitBounds(L.latLngBounds(latLngs), { padding: [36, 36], maxZoom: 17 })
  }, [])

  const focusPoint = useCallback((point, label = 'Point recherche') => {
    const L = leafletRef.current
    const map = mapRef.current
    const group = searchLayerRef.current
    if (!L || !map || !group || !point) return
    group.clearLayers()
    L.circleMarker([point.lat, point.lng], {
      radius: 9,
      color: '#0f172a',
      weight: 2,
      fillColor: '#10b981',
      fillOpacity: 0.82,
    }).bindTooltip(label, { permanent: false }).addTo(group)
    L.circle([point.lat, point.lng], {
      radius: 120,
      color: '#10b981',
      weight: 1,
      fillColor: '#10b981',
      fillOpacity: 0.08,
    }).addTo(group)
    map.setView([point.lat, point.lng], Math.max(map.getZoom(), 16), { animate: true })
    setMessage(label)
  }, [])

  const searchLocation = useCallback(async () => {
    const query = geoQuery.trim()
    if (!query) {
      setGeoStatus('Saisir une adresse ou lat,lng')
      return
    }
    const gpsPoint = parseGpsQuery(query)
    if (gpsPoint) {
      focusPoint(gpsPoint, `GPS ${formatNumber(gpsPoint.lat)}, ${formatNumber(gpsPoint.lng)}`)
      setGeoStatus('Point GPS centre')
      return
    }
    setGeoStatus('Recherche adresse...')
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      const response = await fetch(url)
      const results = await response.json()
      if (!results?.length) {
        setGeoStatus('Adresse introuvable')
        return
      }
      const first = results[0]
      const point = { lat: Number(first.lat), lng: Number(first.lon) }
      focusPoint(point, first.display_name || query)
      setGeoStatus('Adresse centree')
    } catch {
      setGeoStatus('Geocodage indisponible')
    }
  }, [focusPoint, geoQuery])

  const resetWork = useCallback(() => {
    setParcelles(initialParcelles)
    setDraftPoints([])
    setSelectedIds(initialParcelles.slice(0, 2).map((parcelle) => parcelle.id))
    setActiveParcelleId(initialParcelles[0]?.id || '')
    setActiveIlotId(initialParcelles[0]?.ilot_id || '')
    setDeleteIntent(null)
    setMessage('Trace restauree')
    fittedRef.current = false
  }, [initialParcelles, setActiveIlotId, setActiveParcelleId, setParcelles, setSelectedIds])

  const clearDraft = useCallback(() => {
    setDraftPoints([])
    setDeleteIntent(null)
    setMessage('Trace effacee')
  }, [])

  const removeLastDraftPoint = useCallback(() => {
    setDraftPoints((current) => current.slice(0, -1))
    setMessage('Dernier point retire')
  }, [])

  const removeDraftPoint = useCallback((index) => {
    setDraftPoints((current) => current.filter((_, pointIndex) => pointIndex !== index))
    setMessage(`Point ${index + 1} retire`)
  }, [])

  const validateDraft = useCallback(() => {
    if (draftPoints.length < 3) {
      setMessage('Trace incomplete')
      return
    }
    const id = `D-${String(parcelles.length + 1).padStart(3, '0')}`
    const surface = computeAreaHa(draftPoints)
    const newParcelle = {
      id,
      nom: `Trace terrain ${id}`,
      ilot_id: 'I-DRAFT',
      surface_ha: Number(surface.toFixed(2)),
      culture: 'A definir',
      sol: 'A qualifier',
      statut: 'brouillon',
      rendement_prevu: 0,
      ift_prevu: 0,
      marge_prevue_ha: 0,
      gps: draftPoints,
      itineraire: [],
    }
    setParcelles((current) => [...current, newParcelle])
    setActiveParcelleId(id)
    setDraftPoints([])
    setDeleteIntent(null)
    setMessage(`Trace creee - ${formatHa(surface)}`)
  }, [draftPoints, parcelles.length, setActiveParcelleId, setParcelles])

  const splitActiveParcelle = useCallback(() => {
    if (!activeParcelle || (activeParcelle.gps || []).length < 4) {
      setMessage('Decoupe impossible')
      return
    }
    const bounds = getBounds(activeParcelle.gps)
    if (!bounds) return
    const lng = (bounds.minLng + bounds.maxLng) / 2
    const left = clipByLng(activeParcelle.gps, lng, 'left')
    const right = clipByLng(activeParcelle.gps, lng, 'right')
    if (left.length < 3 || right.length < 3) {
      setMessage('Decoupe non valide')
      return
    }
    const parts = [
      { suffix: 'A', gps: left },
      { suffix: 'B', gps: right },
    ].map((part) => ({
      ...activeParcelle,
      id: `${activeParcelle.id}-${part.suffix}`,
      nom: `${activeParcelle.nom} ${part.suffix}`,
      gps: part.gps,
      surface_ha: Number(computeAreaHa(part.gps).toFixed(2)),
      statut: 'decoupe simulation',
    }))
    setParcelles((current) => current.filter((parcelle) => parcelle.id !== activeParcelle.id).concat(parts))
    setSelectedIds(parts.map((part) => part.id))
    setActiveParcelleId(parts[0].id)
    setActiveIlotId(parts[0].ilot_id)
    setDeleteIntent(null)
    setMessage(`Decoupe creee - ${parts.map((part) => formatHa(part.surface_ha)).join(' / ')}`)
  }, [activeParcelle, setActiveIlotId, setActiveParcelleId, setParcelles, setSelectedIds])

  const deleteParcelles = useCallback((ids, label) => {
    const idsToDelete = Array.from(new Set(ids.filter(Boolean)))
    if (!idsToDelete.length) {
      setMessage('Aucune parcelle a supprimer')
      return
    }
    if (idsToDelete.length >= parcelles.length) {
      setMessage('Conserver au moins une parcelle')
      return
    }
    const deleteSet = new Set(idsToDelete)
    const remaining = parcelles.filter((parcelle) => !deleteSet.has(parcelle.id))
    const nextActive = remaining.find((parcelle) => parcelle.id !== activeParcelleId) || remaining[0]
    setParcelles(remaining)
    setSelectedIds((current) => current.filter((id) => !deleteSet.has(id)))
    setActiveParcelleId(nextActive?.id || '')
    setActiveIlotId(nextActive?.ilot_id || '')
    setDeleteIntent(null)
    setMessage(`${label} supprimee`)
    fittedRef.current = false
  }, [activeParcelleId, parcelles, setActiveIlotId, setActiveParcelleId, setParcelles, setSelectedIds])

  const requestDeleteActive = useCallback(() => {
    if (!activeParcelle) return
    const intent = `parcelle:${activeParcelle.id}`
    if (deleteIntent === intent) {
      deleteParcelles([activeParcelle.id], activeParcelle.nom || activeParcelle.id)
      return
    }
    setDeleteIntent(intent)
    setMessage(`Confirmer suppression ${activeParcelle.id}`)
  }, [activeParcelle, deleteIntent, deleteParcelles])

  const requestDeleteSelection = useCallback(() => {
    const ids = selectedIds.filter((id) => parcelles.some((parcelle) => parcelle.id === id))
    const intent = `selection:${ids.join('|')}`
    if (deleteIntent === intent) {
      deleteParcelles(ids, `${ids.length} parcelle(s)`)
      return
    }
    setDeleteIntent(intent)
    setMessage(`Confirmer suppression selection`)
  }, [deleteIntent, deleteParcelles, parcelles, selectedIds])

  const deleteActiveVertex = useCallback((index) => {
    if (!activeParcelle) return
    const gps = activeParcelle.gps || []
    if (gps.length <= 3) {
      setMessage('Une parcelle doit garder 3 sommets')
      return
    }
    const nextGps = gps.filter((_, pointIndex) => pointIndex !== index)
    setParcelles((current) => current.map((parcelle) => {
      if (parcelle.id !== activeParcelle.id) return parcelle
      return {
        ...parcelle,
        gps: nextGps,
        surface_ha: Number(computeAreaHa(nextGps).toFixed(2)),
        statut: parcelle.statut === 'importe' ? 'importe modifie' : 'modifie',
      }
    }))
    setMessage(`Sommet ${index + 1} supprime`)
  }, [activeParcelle, setParcelles])

  const exportGeoJson = useCallback(() => {
    const payload = JSON.stringify(buildGeoJson(parcelles), null, 2)
    const blob = new Blob([payload], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'farmflow-parcelles.geojson'
    link.click()
    URL.revokeObjectURL(url)
    setMessage('GeoJSON exporte')
  }, [parcelles])

  const importGeoJson = useCallback((event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const geojson = JSON.parse(String(reader.result || '{}'))
        const features = geojson.type === 'FeatureCollection' ? geojson.features || [] : [geojson]
        const imported = features
          .filter((feature) => feature.geometry?.type === 'Polygon')
          .map((feature, index) => {
            const coords = feature.geometry.coordinates?.[0] || []
            const gps = coords
              .slice(0, -1)
              .map(([lng, lat]) => ({ lat, lng }))
              .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
            const id = feature.properties?.id || `GEO-${Date.now()}-${index + 1}`
            return {
              id,
              nom: feature.properties?.nom || `Parcelle importee ${index + 1}`,
              ilot_id: feature.properties?.ilot_id || 'I-IMPORT',
              surface_ha: Number(computeAreaHa(gps).toFixed(2)),
              culture: feature.properties?.culture || 'A definir',
              sol: feature.properties?.sol || 'A qualifier',
              statut: 'importe',
              rendement_prevu: 0,
              ift_prevu: 0,
              marge_prevue_ha: 0,
              gps,
              itineraire: [],
            }
          })
          .filter((parcelle) => parcelle.gps.length >= 3)
        if (!imported.length) {
          setMessage('GeoJSON vide')
          return
        }
        setParcelles((current) => [...current, ...imported])
        setActiveParcelleId(imported[0].id)
        setMessage(`${imported.length} parcelle(s) importee(s)`)
      } catch {
        setMessage('GeoJSON invalide')
      } finally {
        event.target.value = ''
      }
    }
    reader.readAsText(file)
  }, [setActiveParcelleId, setParcelles])

  useEffect(() => {
    let cancelled = false
    async function setup() {
      const leafletModule = await import('leaflet')
      if (cancelled || !mapElementRef.current || mapRef.current) return
      const L = leafletModule.default || leafletModule
      leafletRef.current = L
      const map = L.map(mapElementRef.current, {
        center: [centre.lat, centre.lng],
        zoom: 15,
        preferCanvas: true,
        zoomControl: false,
        doubleClickZoom: false,
      })
      L.tileLayer(TILE_URL, {
        maxZoom: 19,
        attribution: 'OpenStreetMap contributors',
      }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map)
      parcelleLayerRef.current = L.featureGroup().addTo(map)
      draftLayerRef.current = L.featureGroup().addTo(map)
      editLayerRef.current = L.featureGroup().addTo(map)
      searchLayerRef.current = L.featureGroup().addTo(map)
      mapRef.current = map
      setMapReady(true)
    }
    setup()
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [centre.lat, centre.lng])

  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    const group = parcelleLayerRef.current
    if (!L || !map || !group) return
    group.clearLayers()
    parcelles.forEach((parcelle) => {
      const gps = parcelle.gps || []
      if (gps.length < 3) return
      const selected = selectedIds.includes(parcelle.id)
      const active = activeParcelleId === parcelle.id
      const polygon = L.polygon(toLatLngs(gps), polygonStyle(parcelle, layer, getLayerFill, active, selected))
      polygon.on('click', (event) => {
        L.DomEvent.stopPropagation(event)
        setActive(parcelle)
      })
      polygon.bindTooltip(`${parcelle.id} - ${parcelle.nom}`, { sticky: true })
      polygon.addTo(group)
      if (active) polygon.bringToFront()
    })
    if (!fittedRef.current && parcelles.length) {
      fitParcelles(parcelles)
      fittedRef.current = true
    }
  }, [activeParcelleId, fitParcelles, getLayerFill, layer, parcelles, selectedIds, setActive])

  useEffect(() => {
    const L = leafletRef.current
    const group = draftLayerRef.current
    if (!L || !group) return
    group.clearLayers()
    if (draftPoints.length) {
      L.polyline(toLatLngs(draftPoints), { color: '#0f172a', weight: 3, dashArray: '6 6' }).addTo(group)
      if (draftPoints.length >= 3) {
        L.polygon(toLatLngs(draftPoints), { color: '#0f172a', weight: 2, fillColor: '#fbbf24', fillOpacity: 0.24 }).addTo(group)
      }
      draftPoints.forEach((point, index) => {
        const marker = L.marker([point.lat, point.lng], {
          interactive: true,
          icon: L.divIcon({ className: 'parcel-draft-marker', iconSize: [13, 13] }),
        })
        marker.on('click', (event) => {
          L.DomEvent.stopPropagation(event)
          removeDraftPoint(index)
        })
        marker.bindTooltip(`Retirer point ${index + 1}`, { sticky: true })
        marker.addTo(group)
      })
    }
  }, [draftPoints, removeDraftPoint])

  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map) return undefined
    const handleClick = (event) => {
      if (workMode !== 'dessin') return
      setDraftPoints((current) => [...current, { lat: event.latlng.lat, lng: event.latlng.lng }])
      setMessage('Point ajoute')
    }
    const handleDoubleClick = () => {
      if (workMode === 'dessin') validateDraft()
    }
    map.on('click', handleClick)
    map.on('dblclick', handleDoubleClick)
    return () => {
      map.off('click', handleClick)
      map.off('dblclick', handleDoubleClick)
    }
  }, [validateDraft, workMode])

  useEffect(() => {
    const L = leafletRef.current
    const group = editLayerRef.current
    if (!L || !group) return
    group.clearLayers()
    if (workMode !== 'edition' || !activeParcelle) return
    ;(activeParcelle.gps || []).forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        draggable: true,
        icon: L.divIcon({ className: 'parcel-vertex-marker', iconSize: [16, 16] }),
      })
      marker.on('dragend', (event) => {
        const latLng = event.target.getLatLng()
        setParcelles((current) => current.map((parcelle) => {
          if (parcelle.id !== activeParcelle.id) return parcelle
          const gps = [...(parcelle.gps || [])]
          gps[index] = { lat: latLng.lat, lng: latLng.lng }
          return {
            ...parcelle,
            gps,
            surface_ha: Number(computeAreaHa(gps).toFixed(2)),
            statut: parcelle.statut === 'importe' ? 'importe modifie' : 'modifie',
          }
        }))
        setMessage('Sommet deplace')
      })
      marker.on('dblclick', (event) => {
        L.DomEvent.stopPropagation(event)
        deleteActiveVertex(index)
      })
      marker.bindTooltip(`Sommet ${index + 1} - double clic pour supprimer`, { sticky: true })
      marker.addTo(group)
    })
  }, [activeParcelle, deleteActiveVertex, setParcelles, workMode])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    setTimeout(() => map.invalidateSize(), 80)
  }, [expanded])

  const currentIlot = ilots.find((ilot) => ilot.id === activeIlotId)

  return (
    <section className={expanded ? 'fixed inset-3 z-[80] overflow-auto rounded-lg bg-[#f6f8f5] p-3 shadow-2xl' : ''}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1">
              {workModes.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setWorkMode(item.key)
                      setMessage(item.label)
                    }}
                    className={`inline-flex h-10 items-center gap-2 px-3 text-sm font-semibold ${workMode === item.key ? 'rounded-md bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                    title={item.label}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => fitParcelles(activeParcelle ? [activeParcelle] : parcelles)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" title="Centrer">
                <FiCrosshair className="h-4 w-4" />
                <span className="hidden sm:inline">Centrer</span>
              </button>
              <button onClick={exportGeoJson} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" title="Exporter GeoJSON">
                <FiDownload className="h-4 w-4" />
                <span className="hidden sm:inline">GeoJSON</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" title="Importer GeoJSON">
                <FiUpload className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button onClick={resetWork} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" title="Restaurer">
                <FiRotateCcw className="h-4 w-4" />
              </button>
              <button onClick={() => setExpanded((value) => !value)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" title="Plein ecran">
                {expanded ? <FiMinimize2 className="h-4 w-4" /> : <FiMaximize2 className="h-4 w-4" />}
              </button>
              <input ref={fileInputRef} type="file" accept=".geojson,.json,application/geo+json,application/json" className="hidden" onChange={importGeoJson} />
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {layers.map((item) => (
              <button
                key={item.code}
                onClick={() => setLayer(item.code)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${layer === item.code ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                <span className={`h-2 w-2 rounded-full ${item.statut === 'actif' ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                {item.nom}
              </button>
            ))}
          </div>

          <div
            className="mb-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 lg:grid-cols-[1fr_150px]"
            onClick={stopMapEvent}
            onDoubleClick={stopMapEvent}
            onMouseDown={stopMapEvent}
          >
            <label className="relative">
              <span className="sr-only">Adresse ou point GPS</span>
              <FiMapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={geoQuery}
                onChange={(event) => setGeoQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') searchLocation()
                }}
                className="input h-11 pl-10"
                placeholder="Adresse, commune ou lat,lng"
              />
            </label>
            <button
              type="button"
              onClick={searchLocation}
              className="touch-button inline-flex items-center justify-center gap-2 bg-slate-950 px-4 py-2 text-sm text-white hover:bg-slate-800"
            >
              <FiSearch className="h-4 w-4" />
              Rechercher
            </button>
            {geoStatus && <p className="text-xs font-medium text-slate-500 lg:col-span-2">{geoStatus}</p>}
          </div>

          <div className="farm-map-shell relative h-[72vh] min-h-[620px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <div ref={mapElementRef} className="h-full w-full" />
            {!mapReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-semibold text-slate-600">
                Chargement carte
              </div>
            )}
            <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              {message}
            </div>
            {workMode === 'dessin' && (
              <div
                className="absolute left-3 right-3 top-16 z-[500] flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-sm"
                onClick={stopMapEvent}
                onDoubleClick={stopMapEvent}
                onMouseDown={stopMapEvent}
              >
                <span className="text-sm font-semibold text-slate-700">{draftPoints.length} point(s)</span>
                <div className="flex gap-2">
                  <button onClick={removeLastDraftPoint} disabled={!draftPoints.length} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Retirer point</button>
                  <button onClick={clearDraft} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Effacer</button>
                  <button data-testid="validate-parcel-draft" onClick={validateDraft} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                    <FiCheck className="h-4 w-4" />
                    Valider
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Parcelle</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">{activeParcelle?.nom || '-'}</h2>
              </div>
              <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${activeParcelle?.statut?.includes('modifie') || activeParcelle?.statut?.includes('brouillon') ? statusClasses.warning : statusClasses.success}`}>
                {activeParcelle?.statut || '-'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Surface API</p>
                <p className="mt-1 font-semibold text-slate-950">{formatHa(activeParcelle?.surface_ha)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Surface trace</p>
                <p className="mt-1 font-semibold text-slate-950">{formatHa(activeMetrics?.area)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Sommets</p>
                <p className="mt-1 font-semibold text-slate-950">{activeMetrics?.points || 0}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Ilot</p>
                <p className="mt-1 font-semibold text-slate-950">{currentIlot?.nom || activeParcelle?.ilot_id || '-'}</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-950">{activeParcelle?.culture || 'A definir'}</p>
              <p className="mt-1">{activeParcelle?.sol || 'Sol a qualifier'}</p>
              {activeMetrics?.center && (
                <p className="mt-2 text-xs text-slate-500">
                  {formatNumber(activeMetrics.center.lat)}, {formatNumber(activeMetrics.center.lng)}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <FiScissors className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-semibold text-slate-950">Outils</h2>
            </div>
            <div className="grid gap-2">
              <button onClick={splitActiveParcelle} disabled={!activeParcelle} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <FiScissors className="h-4 w-4" />
                Decouper
              </button>
              <button onClick={() => fitParcelles(selectedParcelles.length ? selectedParcelles : parcelles)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <FiLayers className="h-4 w-4" />
                Voir selection
              </button>
              <button onClick={onCreateIlot} disabled={ilotLoading || selectedIds.length < 1} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                <FiCheck className="h-4 w-4" />
                {ilotLoading ? 'Calcul' : 'Regrouper'}
              </button>
              <button onClick={requestDeleteActive} disabled={!activeParcelle || parcelles.length <= 1} className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${deleteIntent === `parcelle:${activeParcelle?.id}` ? 'border-rose-700 bg-rose-700 text-white hover:bg-rose-800' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}>
                <FiTrash2 className="h-4 w-4" />
                {deleteIntent === `parcelle:${activeParcelle?.id}` ? 'Confirmer parcelle' : 'Supprimer parcelle'}
              </button>
              <button onClick={requestDeleteSelection} disabled={!selectedIds.length || selectedIds.length >= parcelles.length} className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${deleteIntent?.startsWith('selection:') ? 'border-rose-700 bg-rose-700 text-white hover:bg-rose-800' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}>
                <FiTrash2 className="h-4 w-4" />
                {deleteIntent?.startsWith('selection:') ? 'Confirmer selection' : 'Supprimer selection'}
              </button>
              {deleteIntent && (
                <button onClick={() => setDeleteIntent(null)} className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Annuler suppression
                </button>
              )}
            </div>
            {workMode === 'edition' && activeParcelle && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                <p className="mb-2 text-sm font-semibold text-slate-950">Sommets GPS</p>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {(activeParcelle.gps || []).map((point, index) => (
                    <div key={`${point.lat}-${point.lng}-${index}`} className="grid grid-cols-[32px_1fr_34px] items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 text-xs">
                      <span className="font-semibold text-slate-500">{index + 1}</span>
                      <span className="truncate text-slate-600">{formatNumber(point.lat)}, {formatNumber(point.lng)}</span>
                      <button onClick={() => deleteActiveVertex(index)} disabled={(activeParcelle.gps || []).length <= 3} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-700 hover:bg-rose-50 disabled:text-slate-300" title="Supprimer sommet">
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-950">{selectedIds.length} selection(s)</p>
              <p className="mt-1">{selectedParcelles.map((parcelle) => parcelle.id).join(', ') || 'Aucune'}</p>
              {ilotResult && <p className="mt-2 text-emerald-700">{ilotResult.nom} - {formatHa(ilotResult.surface_ha)}</p>}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <FiLayers className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-semibold text-slate-950">Terrain</h2>
            </div>
            <div className="space-y-2">
              {connecteurs.slice(0, 4).map((connector) => (
                <div key={connector.code} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-950">{connector.nom}</span>
                  <span className="text-xs text-slate-500">{connector.statut}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {alertes.slice(0, 3).map((alerte) => (
                <div key={`${alerte.parcelle}-${alerte.titre}`} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{alerte.titre}</span>
                    <span className="text-xs">{alerte.parcelle}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
