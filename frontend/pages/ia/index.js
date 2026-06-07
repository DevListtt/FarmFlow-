import ModuleWorkspace from '../../components/ModuleWorkspace'

const priorities = ['assistant contextualisé', 'OCR factures', 'anomalies flux et marges', 'recommandations tracées']
const endpoints = ['GET /pilotage/ia/preparation', 'POST /ia/ocr', 'POST /ia/chatbot']

export default function Page() {
  return (
    <ModuleWorkspace
      title="IA agricole"
      subtitle="Préparation de l’assistant IA, OCR, recommandations et alertes intelligentes."
      icon="🤖"
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
