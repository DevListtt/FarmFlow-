import ModuleWorkspace from '../../components/ModuleWorkspace'

const priorities = ['clients et prospects', 'paniers et commandes', 'segmentation', 'relances paiement']
const endpoints = ['GET /crm/prospects', 'GET /crm/commandes']

export default function Page() {
  return (
    <ModuleWorkspace
      title="CRM agricole"
      subtitle="Clients, prospects, segmentation, commandes et historique commercial."
      icon="🤝"
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
