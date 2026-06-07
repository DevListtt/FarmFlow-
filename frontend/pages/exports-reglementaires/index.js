import OperationalModulePage from '../../components/OperationalModulePage'

export default function ExportsReglementairesPage() {
  return (
    <OperationalModulePage
      title="Exports réglementaires"
      icon="📚"
      subtitle="Exports comptables et caisse pour préparer expert-comptable, contrôle et obligations réglementaires."
      endpoint="GET /pilotage/exports/fec.csv"
      actions={[
        {
          title: 'Export FEC simplifié',
          description: 'Produit un CSV structuré depuis les écritures comptables avec journal, compte, référence, débit et crédit.',
          endpoint: 'GET /pilotage/exports/fec.csv',
        },
        {
          title: 'Export journal de caisse',
          description: 'Exporte les ventes payées par date, référence, moyen de paiement, HT, TVA et TTC.',
          endpoint: 'GET /pilotage/exports/journal-caisse.csv',
        },
      ]}
      responseFields={['JournalCode', 'EcritureDate', 'CompteNum', 'PieceRef', 'Debit', 'Credit']}
    />
  )
}
