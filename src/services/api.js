import { TOKEN_STORAGE_KEY } from '../config/constants'

const BASE_URL = ''

/**
 * Base API client with automatic JWT auth headers.
 */
async function request(method, path, body = null) {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const options = { method, headers }
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, options)

  let data = {}
  try {
    const text = await response.text()
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error('استجابة غير صالحة من الخادم')
  }

  // Auto-logout on 401
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem('cb-mystery-auth')
    window.location.href = '/'
    throw new Error(data.error || 'انتهت الجلسة — يرجى تسجيل الدخول مرة أخرى')
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || `خطأ في الخادم (${response.status})`)
  }

  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
}
