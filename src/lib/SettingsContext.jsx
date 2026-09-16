import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api.js'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)

  const refresh = useCallback(async () => {
    const data = await api.settings.get()
    setSettings(data)
    return data
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (!settings) return null

  return <SettingsContext.Provider value={{ settings, refresh }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider')
  return ctx
}
