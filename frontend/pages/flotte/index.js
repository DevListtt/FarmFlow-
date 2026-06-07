import ModuleWorkspace from '../../components/ModuleWorkspace'

const priorities = ['entretien préventif', 'suivi carburant', 'coût horaire matériel', 'alertes échéances']
const endpoints = ['GET /flotte/vehicules', 'GET /flotte/carburants']

export default function Page() {
  return (
    <ModuleWorkspace
      title="Flotte"
      subtitle="Véhicules, matériels, entretiens, carburant et coûts d’utilisation."
      icon="🚗"
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
