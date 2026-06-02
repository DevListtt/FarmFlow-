import Head from 'next/head'
import Layout from '../../components/Layout'
import { useQuery } from 'react-query'
import axios from 'axios'
import { useState } from 'react'
import toast from 'react-hot-toast'

// Configuration de l'API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Fonction pour récupérer les animaux
const fetchAnimaux = async () => {
  try {
    const response = await axios.get(`${API_URL}/animaux/`)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des animaux:', error)
    throw error
  }
}

// Fonction pour récupérer les types d'animaux
const fetchTypesAnimaux = async () => {
  try {
    const response = await axios.get(`${API_URL}/animaux/types`)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des types d\'animaux:', error)
    return []
  }
}

// Fonction pour créer un animal
const createAnimal = async (animalData) => {
  try {
    const response = await axios.post(`${API_URL}/animaux/`, animalData)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la création de l\'animal:', error)
    throw error
  }
}

// Composant AnimalCard
const AnimalCard = ({ animal }) => (
  <div className="card p-6 animate-fade-in">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{animal.sexe === 'male' ? '♂' : animal.sexe === 'femelle' ? '♀' : '⚪'}</span>
        <div>
          <h3 className="font-semibold text-gray-900">{animal.nom || `Animal #${animal.id}`}</h3>
          <p className="text-sm text-gray-500">{animal.rfid}</p>
        </div>
      </div>
      <span className={`badge badge-${animal.statut === 'actif' ? 'success' : animal.statut === 'malade' ? 'danger' : 'secondary'}`}>
        {animal.statut}
      </span>
    </div>
    
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-gray-500">Type</p>
        <p className="font-medium">{animal.type_animal?.nom || 'N/A'}</p>
      </div>
      <div>
        <p className="text-gray-500">Race</p>
        <p className="font-medium">{animal.race?.nom || 'N/A'}</p>
      </div>
      <div>
        <p className="text-gray-500">Date de naissance</p>
        <p className="font-medium">{animal.date_naissance || 'N/A'}</p>
      </div>
      <div>
        <p className="text-gray-500">Poids</p>
        <p className="font-medium">{animal.poids} kg</p>
      </div>
    </div>
    
    <div className="mt-4 flex space-x-2">
      <button className="btn btn-outline btn-sm">Voir</button>
      <button className="btn btn-outline btn-sm">Modifier</button>
    </div>
  </div>
)

// Composant AddAnimalModal
const AddAnimalModal = ({ isOpen, onClose, types, onSuccess }) => {
  const [formData, setFormData] = useState({
    rfid: '',
    nom: '',
    type_animal_id: '',
    race_id: '',
    sexe: 'inconnu',
    date_naissance: '',
    date_entree: '',
    poids: '',
    statut: 'actif'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await createAnimal(formData)
      toast.success('Animal créé avec succès!')
      onSuccess()
      onClose()
      setFormData({
        rfid: '',
        nom: '',
        type_animal_id: '',
        race_id: '',
        sexe: 'inconnu',
        date_naissance: '',
        date_entree: '',
        poids: '',
        statut: 'actif'
      })
    } catch (error) {
      toast.error('Erreur lors de la création de l\'animal')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal */}
        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                <span className="text-primary-600">🐄</span>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Ajouter un animal
                </h3>
                
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">RFID *</label>
                      <input
                        type="text"
                        name="rfid"
                        value={formData.rfid}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Nom</label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        className="input"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Type *</label>
                      <select
                        name="type_animal_id"
                        value={formData.type_animal_id}
                        onChange={handleChange}
                        className="input"
                        required
                      >
                        <option value="">Sélectionnez un type</option>
                        {types.map(type => (
                          <option key={type.id} value={type.id}>{type.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Sexe</label>
                      <select
                        name="sexe"
                        value={formData.sexe}
                        onChange={handleChange}
                        className="input"
                      >
                        <option value="inconnu">Inconnu</option>
                        <option value="male">Mâle</option>
                        <option value="femelle">Femelle</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Date de naissance</label>
                      <input
                        type="date"
                        name="date_naissance"
                        value={formData.date_naissance}
                        onChange={handleChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Poids (kg)</label>
                      <input
                        type="number"
                        name="poids"
                        value={formData.poids}
                        onChange={handleChange}
                        className="input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="label">Statut</label>
                    <select
                      name="statut"
                      value={formData.statut}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="actif">Actif</option>
                      <option value="vendu">Vendu</option>
                      <option value="mort">Mort</option>
                      <option value="malade">Malade</option>
                      <option value="retiré">Retiré</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-outline"
                      disabled={isSubmitting}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Page principale
export default function AnimauxPage() {
  const { data: animaux, isLoading, error, refetch } = useQuery('animaux', fetchAnimaux)
  const { data: types } = useQuery('typesAnimaux', fetchTypesAnimaux)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSuccess = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <Layout>
        <Head>
          <title>Animaux - FarmFlow</title>
        </Head>
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Head>
          <title>Animaux - FarmFlow</title>
        </Head>
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-danger-600 mb-4">
            Erreur lors du chargement des animaux
          </h2>
          <button onClick={() => refetch()} className="btn btn-primary">
            Réessayer
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Animaux - FarmFlow</title>
        <meta name="description" content="Gestion des animaux d'élevage" />
      </Head>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Animaux</h1>
          <p className="text-gray-500 mt-1">
            Gestion de l'élevage avec RFID
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          + Ajouter un animal
        </button>
      </div>

      {/* Filtres */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Type d'animal</label>
            <select className="input">
              <option value="">Tous les types</option>
              {types?.map(type => (
                <option key={type.id} value={type.id}>{type.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Statut</label>
            <select className="input">
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="vendu">Vendu</option>
              <option value="mort">Mort</option>
              <option value="malade">Malade</option>
              <option value="retiré">Retiré</option>
            </select>
          </div>
          <div>
            <label className="label">Sexe</label>
            <select className="input">
              <option value="">Tous les sexes</option>
              <option value="male">Mâle</option>
              <option value="femelle">Femelle</option>
              <option value="inconnu">Inconnu</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn btn-secondary w-full">
              Filtrer
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Total animaux</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{animaux?.length || 0}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Actifs</p>
          <p className="text-3xl font-bold text-success-600 mt-1">
            {animaux?.filter(a => a.statut === 'actif').length || 0}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Alertes</p>
          <p className="text-3xl font-bold text-danger-600 mt-1">
            {animaux?.filter(a => a.statut === 'malade').length || 0}
          </p>
        </div>
      </div>

      {/* Liste des animaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {animaux?.length > 0 ? (
          animaux.map(animal => (
            <AnimalCard key={animal.id} animal={animal} />
          ))
        ) : (
          <div className="card p-8 text-center col-span-full">
            <p className="text-gray-500">Aucun animal trouvé</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary mt-4"
            >
              + Ajouter un animal
            </button>
          </div>
        )}
      </div>

      {/* Modal d'ajout */}
      <AddAnimalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        types={types || []}
        onSuccess={handleSuccess}
      />
    </Layout>
  )
}
