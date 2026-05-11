const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const DEMO_HR = {
  email: 'hr@talentai.local',
  password: 'Recruiter123!',
}

const HR_TOKEN_KEY = 'talent_demo_hr_token'

export async function request(path, { method = 'GET', body, useFormData = false, authToken = '' } = {}) {
  const options = { method, headers: {} }
  if (authToken) {
    options.headers.Authorization = `Bearer ${authToken}`
  }

  if (body !== undefined && body !== null) {
    if (useFormData) {
      options.body = body
    } else {
      options.headers['Content-Type'] = 'application/json'
      options.body = JSON.stringify(body)
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.detail?.error ||
      payload?.error ||
      payload?.detail ||
      `Request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return payload
}

export async function loginAsHr() {
  const payload = await request('/api/v1/auth/login', {
    method: 'POST',
    body: DEMO_HR,
  })
  const token = payload?.token || ''
  if (!token) {
    throw new Error('Unable to create HR demo session.')
  }
  window.localStorage.setItem(HR_TOKEN_KEY, token)
  return token
}

export async function getHrToken(forceRefresh = false) {
  if (!forceRefresh) {
    const existing = window.localStorage.getItem(HR_TOKEN_KEY) || ''
    if (existing) {
      return existing
    }
  }
  return loginAsHr()
}

export async function requestWithHrAuth(path, options = {}) {
  let token = await getHrToken()
  try {
    return await request(path, { ...options, authToken: token })
  } catch (error) {
    if (error?.status !== 401) {
      throw error
    }
    token = await getHrToken(true)
    return request(path, { ...options, authToken: token })
  }
}

export function hrStatusClasses(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'rejected') {
    return {
      card: 'border-rose-400 bg-rose-100 dark:border-rose-300/45 dark:bg-rose-500/20',
      title: 'text-rose-900 dark:text-rose-100',
      text: 'text-rose-800 dark:text-rose-100',
    }
  }
  if (normalized === 'selected') {
    return {
      card: 'border-emerald-300 bg-emerald-50 dark:border-emerald-300/35 dark:bg-emerald-500/15',
      title: 'text-emerald-900 dark:text-emerald-100',
      text: 'text-emerald-800 dark:text-emerald-100',
    }
  }
  return {
    card: 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900',
    title: 'text-slate-900 dark:text-white',
    text: 'text-slate-600 dark:text-white/70',
  }
}
