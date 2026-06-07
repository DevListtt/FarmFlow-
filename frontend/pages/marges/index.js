import OperationalModulePage from '../../components/OperationalModulePage'

export default function MargesPage() {
  return (
    <OperationalModulePage
      title="Marges & prix de revient"
      icon="📈"
      subtitle="Calcul des marges simulées et réelles depuis les ventes, coûts de production produits et stocks."
      endpoint="GET /pilotage/marges/reelles"
      actions={[
        {
          title: 'Marge réelle',
          description: 'Agrège chiffre d’affaires, coûts directs et taux de marge par type de produit vendu.',
          endpoint: 'GET /pilotage/marges/reelles',
        },
        {
          title: 'Simulateur de marge',
          description: 'Teste rendement, prix, aides, intrants, carburant et main-d’œuvre avant décision.',
          endpoint: 'POST /pilotage/marges/simuler',
        },
      ]}
      responseFields={['atelier', 'chiffre_affaires', 'couts_directs', 'marge_brute', 'taux_marge']}
      payloadExample={{
        libelle: 'Blé tendre 2026',
        surface_ha: 12,
        rendement: 7.2,
        prix_unitaire: 210,
        aides: 900,
        semences: 850,
        engrais: 2100,
        phytos: 680,
        carburant: 520,
        main_oeuvre: 750,
      }}
    />
  )
}
