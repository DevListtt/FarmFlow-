import Head from 'next/head'
import Layout from './Layout'

const roadmapLabels = {
  pret: 'Socle pret',
  prepare: 'Prepare',
  connecter: 'Connecteurs a brancher',
}

export default function ModuleWorkspace({ title, subtitle, icon, status = 'prepare', endpoints = [], priorities = [], kpis = [] }) {
  return (
    <Layout>
      <Head>
        <title>{title} - FarmFlow</title>
        <meta name="description" content={`${title} dans l'environnement de pilotage agricole FarmFlow.`} />
      </Head>

      <section className="mb-8 rounded-lg bg-white p-8 shadow-soft">
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
          <h2 className="text-xl font-semibold text-gray-900">Priorites metier</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {priorities.map((priority) => (
              <div key={priority} className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
                {priority}
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900">Indicateurs</h2>
          <div className="mt-4 space-y-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-600">{kpi.label}</span>
                <span className="font-semibold text-gray-900">{kpi.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card mt-6 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Connexions internes</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Ce module est prevu pour se connecter au noyau operationnel, aux droits, aux journaux d audit et aux exports.
        </p>
        {endpoints.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Flux metier</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{endpoints.length}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Mode</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">Connectable</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Controle</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">Audit</p>
            </div>
          </div>
        )}
      </section>
    </Layout>
  )
}
