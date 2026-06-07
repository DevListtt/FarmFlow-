import ModuleWorkspace from '../../components/ModuleWorkspace'

const priorities = ['inventaire vivant et statuts', 'suivi sanitaire et rappels', 'reproduction et généalogie', 'coût par animal ou lot']
const endpoints = ['GET /animaux/', 'GET /animaux/types', 'GET /animaux/{id}/sante']

export default function Page() {
  return (
    <ModuleWorkspace
      title="Animaux"
      subtitle="Suivi troupeau, RFID, santé, reproduction et coûts par lot animal."
      icon="🐄"
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
