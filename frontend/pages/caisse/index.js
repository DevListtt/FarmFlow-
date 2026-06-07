import OperationalModulePage from '../../components/OperationalModulePage'

export default function CaissePage() {
  return (
    <OperationalModulePage
      title="Caisse agricole"
      icon="🧾"
      subtitle="Encaissement des ventes directes avec création de vente, détail de ticket et sortie automatique des stocks liés."
      endpoint="POST /pilotage/caisse/ticket"
      actions={[
        {
          title: 'Encaisser un ticket',
          description: 'Crée une vente payée, calcule HT/TVA/TTC et sort le stock si le produit est rattaché à un stock.',
          endpoint: 'POST /pilotage/caisse/ticket',
        },
        {
          title: 'Journal de caisse',
          description: 'Agrège les ventes payées par moyen de paiement pour préparer la clôture journalière.',
          endpoint: 'GET /pilotage/caisse/journal',
        },
      ]}
      responseFields={['vente_id', 'reference', 'total_ht', 'total_tva', 'total_ttc', 'lignes']}
      payloadExample={{
        mode_paiement: 'CB',
        lignes: [
          { libelle: 'Panier légumes', quantite: 1, prix_unitaire_ht: 18.5, taux_tva: 5.5 },
        ],
      }}
    />
  )
}
