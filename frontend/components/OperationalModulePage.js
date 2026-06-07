import Head from 'next/head'
import Layout from './Layout'

export default function OperationalModulePage({ title, icon: Icon, subtitle, endpoint, actions = [], payloadExample, responseFields = [] }) {
  const hasIconComponent = typeof Icon === 'function'

  return (
    <Layout>
      <Head>
        <title>{title} - FarmFlow</title>
        <meta name="description" content={`${title} opérationnel dans FarmFlow.`} />
      </Head>

      <section className="mb-8 rounded-2xl bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Module opérationnel</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold text-gray-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 text-primary-600">
            {hasIconComponent ? <Icon className="h-5 w-5" aria-hidden="true" /> : <span className="h-2 w-2 rounded-full bg-primary-500" />}
          </span>
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-gray-600">{subtitle}</p>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="card p-6 xl:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900">Fonctions livrées</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {actions.map((action) => (
              <article key={action.title} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <span className="badge badge-success">{action.status || 'disponible'}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">{action.description}</p>
                {action.endpoint && <code className="mt-3 inline-block rounded-lg bg-slate-900 px-3 py-2 text-xs text-white">{action.endpoint}</code>}
              </article>
            ))}
          </div>
        </section>

        <aside className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900">Endpoint principal</h2>
          <code className="mt-4 block rounded-lg bg-slate-900 p-3 text-sm text-white">{endpoint}</code>
          <div className="mt-5 space-y-2">
            {responseFields.map((field) => (
              <div key={field} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{field}</div>
            ))}
          </div>
        </aside>
      </div>

      {payloadExample && (
        <section className="card mt-6 p-6">
          <h2 className="text-xl font-semibold text-gray-900">Exemple de payload</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-50">
            {JSON.stringify(payloadExample, null, 2)}
          </pre>
        </section>
      )}
    </Layout>
  )
}
