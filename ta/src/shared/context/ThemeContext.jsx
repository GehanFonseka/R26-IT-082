/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)
const THEME_KEY = 'ari_theme'

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY)

  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return 'dark'
}

function applyThemeClass(mode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialTheme)

  useEffect(() => {
    applyThemeClass(mode)
    localStorage.setItem(THEME_KEY, mode)
  }, [mode])

  const value = useMemo(
    () => ({ mode, toggleTheme: () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark')) }),
    [mode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
