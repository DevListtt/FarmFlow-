import ModuleWorkspace from '../../components/ModuleWorkspace'

const priorities = ['tickets et factures', 'moyens de paiement', 'clôture journalière', 'rapprochement comptable']
const endpoints = ['GET /ventes', 'GET /pilotage/caisse', 'GET /export/ventes/csv']

export default function Page() {
  return (
    <ModuleWorkspace
      title="Ventes & caisse"
      subtitle="Ventes directes, factures, tickets, encaissements et clôtures de caisse."
      icon="🧾"
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
