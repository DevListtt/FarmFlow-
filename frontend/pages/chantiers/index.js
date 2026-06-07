import ModuleWorkspace from '../../components/ModuleWorkspace'

const priorities = ['planning interventions', 'coût machine et carburant', 'temps salarié', 'analyse budget/réel']
const endpoints = ['GET /chantiers', 'GET /pilotage/dashboard']

export default function Page() {
  return (
    <ModuleWorkspace
      title="Chantiers"
      subtitle="Organisation du travail, temps, matériels, coûts et rentabilité des chantiers."
      icon="🚜"
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
