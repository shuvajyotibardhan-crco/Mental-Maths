import { createContext, useContext, useState, type ReactNode } from 'react'

interface Settings {
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
}

const SettingsContext = createContext<Settings>({
  soundEnabled: true,
  setSoundEnabled: () => {},
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('mm_sound') !== 'false'
    } catch {
      return true
    }
  })

  const handleSetSound = (v: boolean) => {
    setSoundEnabled(v)
    try {
      localStorage.setItem('mm_sound', String(v))
    } catch {
      // ignore
    }
  }

  return (
    <SettingsContext.Provider value={{ soundEnabled, setSoundEnabled: handleSetSound }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
