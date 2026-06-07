import OperationalModulePage from '../../components/OperationalModulePage'

export default function BanquePage() {
  return (
    <OperationalModulePage
      title="Banque & trésorerie"
      icon="🏦"
      subtitle="Import CSV bancaire, catégorisation de base, analyse des encaissements/décaissements et alertes de flux."
      endpoint="POST /pilotage/banque/import-csv"
      actions={[
        {
          title: 'Importer un CSV bancaire',
          description: 'Accepte les colonnes date, libellé, montant, catégorie et contrepartie pour produire une analyse immédiate.',
          endpoint: 'POST /pilotage/banque/import-csv',
        },
        {
          title: 'Analyser les flux',
          description: 'Détecte solde négatif, gros décaissements et prélèvements non catégorisés.',
          endpoint: 'POST /pilotage/banque/analyser-flux',
        },
      ]}
      responseFields={['encaissements', 'decaissements', 'solde_final', 'alertes', 'transactions_importees']}
      payloadExample={{
        solde_initial: 3200,
        transactions: [
          { date_operation: '2026-06-01', libelle: 'Vente marché', montant: 640, categorie: 'ventes' },
          { date_operation: '2026-06-02', libelle: 'Prélèvement carburant', montant: -3100 },
        ],
      }}
    />
  )
}
