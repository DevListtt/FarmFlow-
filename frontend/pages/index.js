import Head from 'next/head'
import Layout from '../components/Layout'
import { useQuery } from 'react-query'
import axios from 'axios'

// Configuration de l'API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Fonction pour récupérer les statistiques
const fetchStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/`)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return null
  }
}

// Composant de statistiques
const StatsCard = ({ title, value, icon, color }) => (
  <div className="card p-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
        {icon}
      </div>
    </div>
  </div>
)

// Composant de module
const ModuleCard = ({ title, description, icon, href }) => (
  <a
    href={href}
    className="card p-6 hover:shadow-md transition-shadow duration-200 animate-fade-in"
  >
    <div className="flex items-center space-x-4">
      <div className="p-3 rounded-full bg-primary-100 text-primary-600">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  </a>
)

// Icons (simplifiés)
const Icons = {
  animals: '🐄',
  parcelles: '🌾',
  stocks: '📦',
  ventes: '💰',
  chantiers: '🚜',
  rh: '👥',
  flotte: '🚗',
  crm: '🤝',
  comptabilite: '📊',
  communication: '📧',
  ia: '🤖',
  calendrier: '📅'
}

// Page principale
export default function Home() {
  const { data: stats, isLoading } = useQuery('stats', fetchStats)

  // Modules disponibles
  const modules = [
    {
      title: 'Animaux',
      description: 'Gestion de l\'élevage avec RFID',
      icon: Icons.animals,
      href: '/animaux'
    },
    {
      title: 'Parcelles',
      description: 'Gestion des cultures et itinéraires techniques',
      icon: Icons.parcelles,
      href: '/parcelles'
    },
    {
      title: 'Stocks',
      description: 'Gestion des semences, engrais, phytos',
      icon: Icons.stocks,
      href: '/stocks'
    },
    {
      title: 'Ventes',
      description: 'Gestion des ventes, devis et factures',
      icon: Icons.ventes,
      href: '/ventes'
    },
    {
      title: 'Chantiers',
      description: 'Gestion des chantiers et équipements',
      icon: Icons.chantiers,
      href: '/chantiers'
    },
    {
      title: 'RH',
      description: 'Gestion des employés et paie',
      icon: Icons.rh,
      href: '/rh'
    },
    {
      title: 'Flotte',
      description: 'Gestion des véhicules et carburant',
      icon: Icons.flotte,
      href: '/flotte'
    },
    {
      title: 'CRM',
      description: 'Gestion des clients et prospects',
      icon: Icons.crm,
      href: '/crm'
    },
    {
      title: 'Comptabilité',
      description: 'Gestion comptable complète',
      icon: Icons.comptabilite,
      href: '/comptabilite'
    },
    {
      title: 'Communication',
      description: 'Campagnes mail, SMS, WhatsApp',
      icon: Icons.communication,
      href: '/communication'
    },
    {
      title: 'IA',
      description: 'Analyse prédictive et chatbot',
      icon: Icons.ia,
      href: '/ia'
    },
    {
      title: 'Calendrier',
      description: 'Événements et rappels',
      icon: Icons.calendrier,
      href: '/calendrier'
    }
  ]

  return (
    <Layout>
      <Head>
        <title>FarmFlow - ERP Agricole Open Source</title>
        <meta name="description" content="FarmFlow est un ERP agricole complet pour gérer votre exploitation" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenue sur <span className="text-primary-600">FarmFlow</span>
        </h1>
        <p className="text-gray-500 mt-2">
          ERP Agricole Open Source - Version 2.0
        </p>
      </div>

      {/* Statistiques */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Modules"
            value={stats?.modules?.length || 12}
            icon={Icons.ia}
            color="primary"
          />
          <StatsCard
            title="Version"
            value={stats?.version || "2.0.0"}
            icon="📋"
            color="secondary"
          />
          <StatsCard
            title="API Status"
            value={stats ? "✅" : "❌"}
            icon="🔌"
            color="success"
          />
          <StatsCard
            title="Documentation"
            value="📖"
            icon="📚"
            color="warning"
          />
        </div>
      )}

      {/* Modules */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Modules disponibles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module, index) => (
            <ModuleCard key={index} {...module} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="card p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Prêt à commencer ?
        </h3>
        <p className="text-gray-500 mb-4">
          Explorez les différents modules pour gérer votre exploitation agricole.
        </p>
        <a
          href="/animaux"
          className="btn btn-primary inline-flex items-center space-x-2"
        >
          <span>Commencer avec les animaux</span>
          <span>→</span>
        </a>
      </div>
    </Layout>
  )
}
