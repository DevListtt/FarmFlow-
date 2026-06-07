import ModuleWorkspace from '../../components/ModuleWorkspace'

const priorities = ['exports réglementaires', 'journaux et écritures', 'TVA', 'piste d’audit']
const endpoints = ['GET /comptabilite', 'GET /pilotage/exports/reglementaires']

export default function Page() {
  return (
    <ModuleWorkspace
      title="Comptabilité & réglementation"
      subtitle="Journaux, pièces, TVA, exports FEC, grand livre et balance."
      icon="📚"
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
