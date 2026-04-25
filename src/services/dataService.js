import { api } from './api'

// ─── PROFILES ───────────────────────────────────────────────

export async function fetchProfiles(roles = []) {
  const params = roles.map(r => `role=${r}`).join('&')
  const path = params ? `/api/profiles?${params}` : '/api/profiles'
  const result = await api.get(path)
  return result.data
}

export async function createProfile(data) {
  const result = await api.post('/api/profiles', data)
  return result.data
}

export async function updateProfile(id, data) {
  const result = await api.put(`/api/profiles/${id}`, data)
  return result.data
}

export async function deleteProfile(id) {
  await api.delete(`/api/profiles/${id}`)
  return true
}

// ─── VISITS ─────────────────────────────────────────────────

export async function fetchVisits() {
  const result = await api.get('/api/visits')
  return result.data
}

export async function createVisit(data) {
  const result = await api.post('/api/visits', data)
  return result.data
}

export async function updateVisit(id, data) {
  const result = await api.put(`/api/visits/${id}`, data)
  return result.data
}

export async function completeVisit(id, scores, notes) {
  const result = await api.put(`/api/visits/${id}`, { scores, notes, complete: true })
  return result
}

export async function deleteVisit(id) {
  const result = await api.delete(`/api/visits/${id}`)
  return result
}

// ─── ISSUES ─────────────────────────────────────────────────

export async function fetchIssues() {
  const result = await api.get('/api/issues')
  return result.data
}

// ─── NOTIFICATIONS ──────────────────────────────────────────

export async function fetchNotifications() {
  const result = await api.get('/api/notifications')
  return result.data
}

export async function markNotificationRead(notificationId) {
  await api.put('/api/notifications', { notificationId })
  return true
}

export async function markAllNotificationsRead() {
  await api.put('/api/notifications', { markAll: true })
  return true
}
