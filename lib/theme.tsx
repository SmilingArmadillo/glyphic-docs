'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export const VALID_THEMES = ['warm', 'dark-tech', 'indigo'] as const
export type Theme = typeof VALID_THEMES[number]

const STORAGE_KEY = 'glyphic-theme'
const DEFAULT_THEME: Theme = 'warm'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === 'undefined') return DEFAULT_THEME
    const attr = document.documentElement.dataset.theme as Theme | undefined
    return attr && (VALID_THEMES as readonly string[]).includes(attr) ? attr : DEFAULT_THEME
  })

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && (VALID_THEMES as readonly string[]).includes(stored)) {
      setThemeState(stored)
      document.documentElement.dataset.theme = stored
      document.documentElement.classList.toggle('dark', stored === 'dark-tech')
    }
  }, [])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    document.documentElement.dataset.theme = t
    document.documentElement.classList.toggle('dark', t === 'dark-tech')
    localStorage.setItem(STORAGE_KEY, t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
