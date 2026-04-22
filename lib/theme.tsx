'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'warm' | 'dark-tech' | 'indigo'

const STORAGE_KEY = 'glyphic-theme'
const DEFAULT_THEME: Theme = 'warm'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && ['warm', 'dark-tech', 'indigo'].includes(stored)) {
      setThemeState(stored)
      document.documentElement.dataset.theme = stored
    }
  }, [])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    document.documentElement.dataset.theme = t
    localStorage.setItem(STORAGE_KEY, t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
