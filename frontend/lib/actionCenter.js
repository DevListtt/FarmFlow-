const priorityWeight = {
  haute: 0,
  critical: 0,
  warning: 1,
  moyenne: 1,
  info: 2,
  basse: 3,
  success: 4,
}

const fallbackActions = [
  {
    id: 'fallback-caisse-cloture',
    title: 'Cloturer la caisse',
    detail: 'Verifier les paiements, ecarts et journal de journee.',
    route: '/caisse',
    priority: 'haute',
    kind: 'caisse',
  },
  {
    id: 'fallback-banque-rapprochement',
    title: 'Rapprocher la banque',
    detail: 'Controler les flux carte, virements et factures.',
    route: '/comptabilite',
    priority: 'haute',
    kind: 'finance',
  },
  {
    id: 'fallback-stock-seuil',
    title: 'Surveiller les stocks',
    detail: 'Traiter les seuils bas et produits engages.',
    route: '/stocks',
    priority: 'moyenne',
    kind: 'stock',
  },
]

const priorityFromRisk = (niveau) => {
  const value = Number(niveau || 0)
  if (value >= 70) return 'haute'
  if (value >= 45) return 'moyenne'
  return 'basse'
}

const priorityFromAlert = (niveau) => {
  if (niveau === 'critical') return 'haute'
  if (niveau === 'warning') return 'moyenne'
  if (niveau === 'success') return 'basse'
  return 'info'
}

const routeFromAlert = (alert = {}) => {
  const text = `${alert.titre || ''} ${alert.description || ''}`.toLowerCase()
  if (text.includes('tresorerie') || text.includes('banque')) return '/comptabilite'
  if (text.includes('stock') || text.includes('rupture')) return '/stocks'
  if (text.includes('commande')) return '/commandes'
  if (text.includes('marge') || text.includes('prix')) return '/marges'
  if (text.includes('caisse') || text.includes('vente')) return '/caisse'
  return '/cockpit'
}

export const buildActionCenterItems = (cockpit) => {
  const decisions = (cockpit?.decisions || []).map((decision, index) => ({
    id: `decision-${index}-${decision.titre || 'action'}`,
    title: decision.titre || 'Decision a traiter',
    detail: decision.impact || 'Action prioritaire du cockpit.',
    route: decision.route || '/cockpit',
    priority: decision.priorite || 'moyenne',
    kind: 'decision',
    gain: Number(decision.gain_estime || 0),
  }))

  const risks = (cockpit?.risques || []).map((risk, index) => ({
    id: `risk-${index}-${risk.label || 'risque'}`,
    title: risk.label || 'Risque a suivre',
    detail: risk.impact || 'Point de controle exploitation.',
    route: risk.route || '/cockpit',
    priority: priorityFromRisk(risk.niveau),
    kind: 'risque',
    score: Number(risk.niveau || 0),
  }))

  const alerts = (cockpit?.alertes || []).map((alert, index) => ({
    id: `alert-${index}-${alert.titre || 'alerte'}`,
    title: alert.titre || 'Alerte',
    detail: alert.description || 'Alerte cockpit.',
    route: routeFromAlert(alert),
    priority: priorityFromAlert(alert.niveau),
    kind: 'alerte',
  }))

  const items = [...decisions, ...risks, ...alerts]
  const source = items.length ? items : fallbackActions

  return source
    .sort((a, b) => {
      const priorityDiff = (priorityWeight[a.priority] ?? 5) - (priorityWeight[b.priority] ?? 5)
      if (priorityDiff !== 0) return priorityDiff
      return (b.gain || b.score || 0) - (a.gain || a.score || 0)
    })
    .slice(0, 12)
}

export const actionToneClass = {
  haute: 'border-rose-200 bg-rose-50 text-rose-900',
  critical: 'border-rose-200 bg-rose-50 text-rose-900',
  moyenne: 'border-amber-200 bg-amber-50 text-amber-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  basse: 'border-slate-200 bg-slate-50 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
}
