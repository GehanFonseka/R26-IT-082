/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const SharedCvContext = createContext(null)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function fileFingerprint(file) {
  if (!(file instanceof File)) {
    return null
  }

  return `${file.name}::${file.size}::${file.lastModified}`
}

export function SharedCvProvider({ children }) {
  const [sharedCvFile, setSharedCvFileState] = useState(null)
  const [sharedCvCacheId, setSharedCvCacheId] = useState(null)
  const [sharedCvExpiresAt, setSharedCvExpiresAt] = useState(null)
  const [sharedCvFingerprint, setSharedCvFingerprint] = useState(null)
  const [cacheStatus, setCacheStatus] = useState('idle')
  const [cacheError, setCacheError] = useState('')

  const clearSharedCvFile = useCallback(() => {
    setSharedCvFileState(null)
    setSharedCvCacheId(null)
    setSharedCvExpiresAt(null)
    setSharedCvFingerprint(null)
    setCacheStatus('idle')
    setCacheError('')
  }, [])

  const registerSharedCvFile = useCallback((file) => {
    if (!(file instanceof File)) {
      clearSharedCvFile()
      return
    }

    setSharedCvFileState(file)
    setSharedCvFingerprint(fileFingerprint(file))
    setSharedCvCacheId(null)
    setSharedCvExpiresAt(null)
    setCacheStatus('idle')
    setCacheError('')
  }, [clearSharedCvFile])

  const cacheSharedCvFile = useCallback(async (file) => {
    if (!(file instanceof File)) {
      throw new Error('Select a valid CV file before caching.')
    }

    const nextFingerprint = fileFingerprint(file)
    if (
      cacheStatus === 'ready' &&
      sharedCvCacheId &&
      sharedCvFingerprint &&
      nextFingerprint === sharedCvFingerprint
    ) {
      return {
        cv_cache_id: sharedCvCacheId,
        expires_at: sharedCvExpiresAt,
      }
    }

    setSharedCvFileState(file)
    setSharedCvFingerprint(nextFingerprint)
    setSharedCvCacheId(null)
    setSharedCvExpiresAt(null)
    setCacheStatus('uploading')
    setCacheError('')

    const formData = new FormData()
    formData.append('cv_file', file)

    const response = await fetch(`${API_BASE_URL}/api/v1/cv-cache/upload`, {
      method: 'POST',
      body: formData,
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        payload?.detail?.error ||
        payload?.error ||
        payload?.detail ||
        `CV cache upload failed (${response.status})`
      setCacheStatus('error')
      setCacheError(message)
      throw new Error(message)
    }

    setSharedCvCacheId(payload?.cv_cache_id || null)
    setSharedCvExpiresAt(payload?.expires_at || null)
    setCacheStatus('ready')
    setCacheError('')

    return payload
  }, [
    cacheStatus,
    sharedCvCacheId,
    sharedCvExpiresAt,
    sharedCvFingerprint,
  ])

  const value = useMemo(
    () => ({
      sharedCvFile,
      sharedCvCacheId,
      sharedCvExpiresAt,
      cacheStatus,
      cacheError,
      setSharedCvFile: registerSharedCvFile,
      registerSharedCvFile,
      cacheSharedCvFile,
      clearSharedCvFile,
    }),
    [
      sharedCvFile,
      sharedCvCacheId,
      sharedCvExpiresAt,
      cacheStatus,
      cacheError,
      registerSharedCvFile,
      cacheSharedCvFile,
      clearSharedCvFile,
    ],
  )

  return <SharedCvContext.Provider value={value}>{children}</SharedCvContext.Provider>
}

export function useSharedCv() {
  const context = useContext(SharedCvContext)

  if (!context) {
    throw new Error('useSharedCv must be used within SharedCvProvider')
  }

  return context
}
