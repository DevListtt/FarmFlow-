import axios from 'axios'
import { z } from 'zod'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const recordSchema = z.record(z.any())

const appsResponseSchema = z.object({
  apps: z.array(recordSchema),
  categories: z.array(recordSchema).optional(),
  validation: recordSchema.optional(),
  total: z.number().optional(),
}).passthrough()

const appResponseSchema = z.object({
  app: recordSchema,
  workflows: z.array(recordSchema).optional(),
  roles: z.array(recordSchema).optional(),
}).passthrough()

const architectureResponseSchema = z.object({
  nom: z.string(),
  manifest_version: z.number(),
  manifest_source: z.string(),
  validation: recordSchema,
  graph: z.object({
    nodes: z.array(recordSchema),
    edges: z.array(recordSchema),
  }).passthrough(),
  prochain_durcissement: z.array(z.string()).optional(),
}).passthrough()

export const fetchPilotageApps = async () => {
  const response = await axios.get(`${API_URL}/pilotage/apps`)
  return appsResponseSchema.parse(response.data)
}

export const fetchPilotageApp = async (code) => {
  const response = await axios.get(`${API_URL}/pilotage/apps/${code}`)
  return appResponseSchema.parse(response.data)
}

export const fetchPilotageArchitecture = async () => {
  const response = await axios.get(`${API_URL}/pilotage/architecture`)
  return architectureResponseSchema.parse(response.data)
}

export const fetchPilotageCockpit = async () => {
  const response = await axios.get(`${API_URL}/pilotage/cockpit`)
  return response.data
}

export const fetchPilotageCockpitConfiguration = async () => {
  const response = await axios.get(`${API_URL}/pilotage/cockpit/configuration`)
  return response.data
}

export const updatePilotageCockpitConfiguration = async (payload) => {
  const response = await axios.post(`${API_URL}/pilotage/cockpit/configuration`, payload)
  return response.data
}
