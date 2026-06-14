import Head from 'next/head'
import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import AppLauncher from '../../components/AppLauncher'
import Layout from '../../components/Layout'
import { farmflowApps } from '../../lib/farmflowModules'
import { fetchPilotageApps } from '../../lib/pilotageApi'

export default function AppsPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const { data } = useQuery('pilotage-apps', fetchPilotageApps, { staleTime: 30000 })
  const apps = useMemo(() => data?.apps || farmflowApps, [data?.apps])

  return (
    <Layout>
      <Head>
        <title>Applications - FarmFlow</title>
        <meta name="description" content="Lanceur applications FarmFlow pour la gestion agricole." />
      </Head>

      <section className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center py-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Applications</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">FarmFlow</h1>
        </div>

        <AppLauncher
          apps={apps}
          query={query}
          category={category}
          onQueryChange={setQuery}
          onCategoryChange={setCategory}
          showControls
        />
      </section>
    </Layout>
  )
}
