import ModuleWorkspace from '../../components/ModuleWorkspace'

const priorities = ['rappels sanitaires', 'échéances comptables', 'interventions terrain', 'alertes équipe']
const endpoints = ['GET /calendrier/evenements', 'GET /calendrier/rappels']

export default function Page() {
  return (
    <ModuleWorkspace
      title="Calendrier"
      subtitle="Événements, rappels, échéances réglementaires et synchronisation opérationnelle."
      icon="📅"
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
