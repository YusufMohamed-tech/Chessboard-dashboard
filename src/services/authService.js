import { api } from './api'
import { AUTH_STORAGE_KEY, TOKEN_STORAGE_KEY } from '../config/constants'

/**
 * Login — authenticates against the server, stores JWT + profile.
 */
export async function login(email, password) {
  const result = await api.post('/api/auth/login', { email, password })

  // Store token and user profile
  localStorage.setItem(TOKEN_STORAGE_KEY, result.token)
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user))

  return result.user
}

/**
 * Logout — clears stored session.
 */
export function logout() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

/**
 * Get stored user from localStorage (fast, no API call).
 */
export function getStoredUser() {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

/**
 * Validate session against the server (on page load).
 */
export async function validateSession() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!token) return null

  try {
    const result = await api.get('/api/auth/session')
    // Update stored profile with latest from server
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.user))
    return result.user
  } catch {
    // Token invalid/expired — clear everything
    logout()
    return null
  }
}
