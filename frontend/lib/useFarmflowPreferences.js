import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'farmflow-preferences'

export const profileOptions = [
  { code: 'exploitant', label: 'Exploitant' },
  { code: 'chef-culture', label: 'Chef culture' },
  { code: 'responsable-elevage', label: 'Elevage' },
  { code: 'commercial-caisse', label: 'Caisse' },
  { code: 'comptable', label: 'Compta' },
]

const defaultPreferences = {
  profile: 'exploitant',
  favorites: ['pilotage', 'ventes-caisse', 'parcelles', 'marges'],
  dismissedActions: [],
}

const readPreferences = () => {
  if (typeof window === 'undefined') return defaultPreferences
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return defaultPreferences
    const parsed = JSON.parse(saved)
    return {
      ...defaultPreferences,
      ...parsed,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : defaultPreferences.favorites,
      dismissedActions: Array.isArray(parsed.dismissedActions) ? parsed.dismissedActions : [],
    }
  } catch (error) {
    return defaultPreferences
  }
}

export function useFarmflowPreferences() {
  const [preferences, setPreferences] = useState(defaultPreferences)

  useEffect(() => {
    setPreferences(readPreferences())
  }, [])

  const updatePreferences = useCallback((updater) => {
    setPreferences((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      const merged = { ...defaultPreferences, ...next }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      }
      return merged
    })
  }, [])

  const setProfile = useCallback((profile) => {
    updatePreferences((current) => ({ ...current, profile }))
  }, [updatePreferences])

  const toggleFavorite = useCallback((code) => {
    updatePreferences((current) => {
      const favorites = current.favorites.includes(code)
        ? current.favorites.filter((item) => item !== code)
        : [...current.favorites, code]
      return { ...current, favorites }
    })
  }, [updatePreferences])

  const dismissAction = useCallback((id) => {
    updatePreferences((current) => ({
      ...current,
      dismissedActions: current.dismissedActions.includes(id)
        ? current.dismissedActions
        : [...current.dismissedActions, id],
    }))
  }, [updatePreferences])

  const resetDismissedActions = useCallback(() => {
    updatePreferences((current) => ({ ...current, dismissedActions: [] }))
  }, [updatePreferences])

  const profile = useMemo(
    () => profileOptions.find((item) => item.code === preferences.profile) || profileOptions[0],
    [preferences.profile]
  )

  return {
    preferences,
    profile,
    setProfile,
    toggleFavorite,
    dismissAction,
    resetDismissedActions,
  }
}
