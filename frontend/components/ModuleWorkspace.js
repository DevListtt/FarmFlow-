import Head from 'next/head'
import Layout from './Layout'

const roadmapLabels = {
  pret: 'Socle prêt',
  prepare: 'Préparé',
  connecter: 'Connecteurs à brancher',
}

export default function ModuleWorkspace({ title, subtitle, icon, status = 'prepare', endpoints = [], priorities = [], kpis = [] }) {
  return (
    <Layout>
      <Head>
        <title>{title} - FarmFlow</title>
        <meta name="description" content={`${title} dans l'environnement de pilotage agricole FarmFlow.`} />
      </Head>

      <section className="mb-8 rounded-2xl bg-white p-8 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Espace FarmFlow</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold text-gray-900">
              <span>{icon}</span>
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-gray-600">{subtitle}</p>
          </div>
          <span className="badge badge-primary self-start md:self-center">{roadmapLabels[status]}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="card p-6 xl:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900">Priorités métier</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {priorities.map((priority) => (
              <div key={priority} className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
                {priority}
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900">Indicateurs</h2>
          <div className="mt-4 space-y-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <span className="text-sm text-gray-600">{kpi.label}</span>
                <span className="font-semibold text-gray-900">{kpi.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card mt-6 p-6">
        <h2 className="text-xl font-semibold text-gray-900">API et intégrations prévues</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {endpoints.map((endpoint) => (
            <code key={endpoint} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
              {endpoint}
            </code>
          ))}
        </div>
      </section>
    </Layout>
  )
}
