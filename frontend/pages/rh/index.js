import ModuleWorkspace from '../../components/ModuleWorkspace'

const priorities = ['planning équipe', 'coûts main-d’œuvre', 'congés et paie', 'affectation chantier']
const endpoints = ['GET /rh/employes', 'GET /rh/paies']

export default function Page() {
  return (
    <ModuleWorkspace
      title="Ressources humaines"
      subtitle="Planning, paie, formations, charges de main-d’œuvre et affectation par atelier."
      icon="👥"
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
