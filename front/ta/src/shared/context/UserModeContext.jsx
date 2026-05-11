/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const UserModeContext = createContext(null)
const STORAGE_KEY = 'talent_user_mode'

function readStoredMode() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === 'candidate' || raw === 'hr') {
      return raw
    }
  } catch {
    // Ignore storage errors
  }
  return 'candidate'
}

export function UserModeProvider({ children }) {
  const [mode, setModeState] = useState(readStoredMode)

  const setMode = useCallback((nextMode) => {
    const resolved = nextMode === 'hr' ? 'hr' : 'candidate'
    setModeState(resolved)
    try {
      window.localStorage.setItem(STORAGE_KEY, resolved)
    } catch {
      // Ignore storage errors
    }
  }, [])

  const toggleMode = useCallback(() => {
    setMode(mode === 'candidate' ? 'hr' : 'candidate')
  }, [mode, setMode])

  const value = useMemo(
    () => ({ mode, isHr: mode === 'hr', isCandidate: mode === 'candidate', setMode, toggleMode }),
    [mode, setMode, toggleMode],
  )

  return <UserModeContext.Provider value={value}>{children}</UserModeContext.Provider>
}

export function useUserMode() {
  const context = useContext(UserModeContext)
  if (!context) {
    throw new Error('useUserMode must be used inside UserModeProvider')
  }
  return context
}
