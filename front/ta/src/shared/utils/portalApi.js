const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export async function apiRequest(path, { method = 'GET', body, token = '' } = {}) {
  const headers = {}
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (body !== undefined && body !== null && !isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined && body !== null ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.detail?.error ||
      payload?.error ||
      payload?.detail ||
      `Request failed with status ${response.status}`

    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export const DEMO_CREDENTIALS = {
  candidate: {
    email: 'candidate@talentai.local',
    password: 'Candidate123!',
  },
  hr: {
    email: 'hr@talentai.local',
    password: 'Recruiter123!',
  },
}
