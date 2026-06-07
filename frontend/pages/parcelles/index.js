import ModuleWorkspace from '../../components/ModuleWorkspace'

const priorities = ['assolement et surfaces', 'interventions techniques', 'stocks consommés par parcelle', 'marge brute par culture']
const endpoints = ['GET /parcelles', 'GET /parcelles/cultures', 'GET /pilotage/marges']

export default function Page() {
  return (
    <ModuleWorkspace
      title="Parcelles & cultures"
      subtitle="Pilotage agronomique par parcelle, culture, itinéraire technique et IFT."
      icon="🌾"
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
