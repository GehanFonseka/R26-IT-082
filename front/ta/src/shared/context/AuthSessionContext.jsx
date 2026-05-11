/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { apiRequest, DEMO_CREDENTIALS } from '../utils/portalApi'

const CANDIDATE_TOKEN_KEY = 'talent_portal_candidate_token'
const HR_TOKEN_KEY = 'talent_portal_hr_token'
const CANDIDATE_USER_KEY = 'talent_portal_candidate_user'
const HR_USER_KEY = 'talent_portal_hr_user'

const AuthSessionContext = createContext(null)

function readStorageItem(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorageItem(key, value) {
  try {
    if (!value) {
      window.localStorage.removeItem(key)
      return
    }
    window.localStorage.setItem(key, value)
  } catch {
    // Ignore localStorage failures
  }
}

function parseUser(raw) {
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function modeKeys(mode) {
  if (mode === 'hr') {
    return { tokenKey: HR_TOKEN_KEY, userKey: HR_USER_KEY }
  }
  return { tokenKey: CANDIDATE_TOKEN_KEY, userKey: CANDIDATE_USER_KEY }
}

function readInitialSession(mode) {
  const { tokenKey, userKey } = modeKeys(mode)
  const token = readStorageItem(tokenKey) || ''
  const user = parseUser(readStorageItem(userKey))
  return { token, user }
}

export function AuthSessionProvider({ children }) {
  const [candidateSession, setCandidateSession] = useState(() => readInitialSession('candidate'))
  const [hrSession, setHrSession] = useState(() => readInitialSession('hr'))

  const setSessionForMode = useCallback((mode, nextSession) => {
    const { tokenKey, userKey } = modeKeys(mode)
    const safeSession = {
      token: String(nextSession?.token || ''),
      user: nextSession?.user || null,
    }

    writeStorageItem(tokenKey, safeSession.token || null)
    writeStorageItem(userKey, safeSession.user ? JSON.stringify(safeSession.user) : null)

    if (mode === 'hr') {
      setHrSession(safeSession)
      return
    }
    setCandidateSession(safeSession)
  }, [])

  const getSession = useCallback(
    (mode) => (mode === 'hr' ? hrSession : candidateSession),
    [candidateSession, hrSession],
  )

  const isAuthenticated = useCallback(
    (mode) => {
      const session = getSession(mode)
      return Boolean(session?.token)
    },
    [getSession],
  )

  const logout = useCallback(
    (mode) => {
      setSessionForMode(mode, { token: '', user: null })
    },
    [setSessionForMode],
  )

  const login = useCallback(
    async ({ mode, email, password }) => {
      const payload = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email: String(email || '').trim(),
          password: String(password || ''),
        },
      })

      const token = String(payload?.token || '')
      if (!token) {
        throw new Error('Login failed: missing auth token in response.')
      }

      const user = payload?.user || null
      setSessionForMode(mode, { token, user })
      return payload
    },
    [setSessionForMode],
  )

  const loginWithDemo = useCallback(
    async (mode) => {
      const credentials = mode === 'hr' ? DEMO_CREDENTIALS.hr : DEMO_CREDENTIALS.candidate
      return login({
        mode,
        email: credentials.email,
        password: credentials.password,
      })
    },
    [login],
  )

  const requestWithAuth = useCallback(
    async (mode, path, options = {}) => {
      const session = getSession(mode)
      const token = session?.token || ''
      if (!token) {
        throw new Error('Please log in first.')
      }

      try {
        return await apiRequest(path, {
          ...options,
          token,
        })
      } catch (error) {
        if (error?.status === 401) {
          logout(mode)
          throw new Error('Your session expired. Please log in again.')
        }
        throw error
      }
    },
    [getSession, logout],
  )

  const value = useMemo(
    () => ({
      sessions: {
        candidate: candidateSession,
        hr: hrSession,
      },
      getSession,
      isAuthenticated,
      login,
      loginWithDemo,
      logout,
      requestWithAuth,
    }),
    [candidateSession, getSession, hrSession, isAuthenticated, login, loginWithDemo, logout, requestWithAuth],
  )

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext)
  if (!context) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider')
  }
  return context
}
