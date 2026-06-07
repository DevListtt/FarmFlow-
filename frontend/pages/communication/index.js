import ModuleWorkspace from '../../components/ModuleWorkspace'

const priorities = ['campagnes clients', 'notifications rappels', 'modèles de message', 'historique envois']
const endpoints = ['GET /communication/campagnes']

export default function Page() {
  return (
    <ModuleWorkspace
      title="Communication"
      subtitle="Mail, SMS, WhatsApp et campagnes liées aux clients et opérations ferme."
      icon="📧"
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
