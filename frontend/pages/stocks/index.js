import ModuleWorkspace from '../../components/ModuleWorkspace'

const priorities = ['alertes seuils', 'valorisation stock', 'traçabilité lots', 'liaison caisse et interventions']
const endpoints = ['GET /stocks', 'GET /stocks/categories', 'GET /export/stocks/csv']

export default function Page() {
  return (
    <ModuleWorkspace
      title="Stocks"
      subtitle="Stocks semences, engrais, phytos, produits finis et mouvements valorisés."
      icon="📦"
      priorities={priorities}
      endpoints={endpoints}
      kpis={[
        { label: 'État', value: 'préparé' },
        { label: 'Mode', value: 'modulaire' },
        { label: 'Pilotage', value: 'tech + éco' },
      ]}
    />
  )
}
