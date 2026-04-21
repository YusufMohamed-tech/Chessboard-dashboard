import { Suspense, lazy, useMemo, useState, useCallback } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { calculateWeightedScore, ALL_QUESTION_KEYS, calculatePercentage } from './utils/scoring'
import {
  DEMO_CREDENTIALS,
  mockAdmins,
  mockShoppers as initialShoppers,
  mockVisits as initialVisits,
  mockIssues as initialIssues,
  mockNotifications as initialNotifications,
  mockOffices,
  mockEvaluationCriteria,
  mockPointsRules,
} from './data/mockData'
import { locationDatabase } from './data/locations'

const Login = lazy(() => import('./pages/Login'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const Overview = lazy(() => import('./pages/admin/Overview'))
const Shoppers = lazy(() => import('./pages/admin/Shoppers'))
const Visits = lazy(() => import('./pages/admin/Visits'))
const AdminReports = lazy(() => import('./pages/admin/Reports'))
const Points = lazy(() => import('./pages/admin/Points'))
const ShopperLayout = lazy(() => import('./pages/shopper/ShopperLayout'))
const ShopperDashboard = lazy(() => import('./pages/shopper/Dashboard'))
const MyVisits = lazy(() => import('./pages/shopper/MyVisits'))
const VisitDetail = lazy(() => import('./pages/shopper/VisitDetail'))
const CompletedVisits = lazy(() => import('./pages/shopper/CompletedVisits'))
const ShopperReports = lazy(() => import('./pages/shopper/Reports'))
const SuperAdminLayout = lazy(() => import('./pages/superadmin/SuperAdminLayout'))
const SuperAdminOverview = lazy(() => import('./pages/superadmin/Overview'))
const ManageAdmins = lazy(() => import('./pages/superadmin/ManageAdmins'))
const NotificationCenter = lazy(() => import('./pages/NotificationCenter'))

const AUTH_STORAGE_KEY = 'cb-mystery-auth'
const SHOW_POINTS_SECTION = true

const SUPER_ADMIN_ACCOUNT = {
  id: 'superadmin-root',
  name: DEMO_CREDENTIALS.superadmin.name,
  email: DEMO_CREDENTIALS.superadmin.email,
  personalEmail: DEMO_CREDENTIALS.superadmin.email,
  password: DEMO_CREDENTIALS.superadmin.password,
  role: 'superadmin',
}

const RIYADH_TIME_ZONE = 'Asia/Riyadh'
const RIYADH_UTC_OFFSET = '+03:00'

function getRoleHome(role) {
  if (role === 'superadmin') return '/superadmin/overview'
  if (role === 'admin') return '/admin/overview'
  if (role === 'ops') return '/ops/overview'
  if (role === 'shopper') return '/shopper/dashboard'
  return '/'
}

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

function toArabicUserStatus(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'active' || normalized === 'نشط' ? 'نشط' : 'غير نشط'
}

function toDbUserStatus(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'active' || normalized === 'نشط' ? 'active' : 'inactive'
}

function normalizeAdminRole(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (['superadmin', 'super_admin'].includes(normalized)) return 'superadmin'
  if (['ops', 'operations'].includes(normalized)) return 'ops'
  if (['admin', 'subadmin'].includes(normalized)) return 'admin'
  return normalized || 'admin'
}

function mapAdminRow(row) {
  return {
    id: row.id,
    name: row.name ?? '',
    email: normalizeEmail(row.email),
    personalEmail: normalizeEmail(row.personal_email ?? row.email ?? ''),
    password: row.password ?? '',
    city: row.city ?? '',
    status: toArabicUserStatus(row.status),
    role: normalizeAdminRole(row.role),
  }
}

function mapShopperRow(row) {
  return {
    id: row.id,
    name: row.name ?? '',
    email: normalizeEmail(row.email),
    personalEmail: normalizeEmail(row.personal_email ?? row.email ?? ''),
    password: row.password ?? '',
    city: row.city ?? '',
    primaryPhone: row.primary_phone ?? '',
    whatsappPhone: row.whatsapp_phone ?? '',
    status: toArabicUserStatus(row.status),
    visits: Number(row.visits_completed ?? 0),
    points: Number(row.points ?? 0),
    assignedAdminId: row.assigned_admin_id ?? null,
  }
}

function formatVisitDate(visitDate) {
  if (!visitDate) return ''
  const date = new Date(visitDate)
  if (Number.isNaN(date.getTime())) return String(visitDate).split('T')[0]
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: RIYADH_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const month = parts.find((p) => p.type === 'month')?.value ?? '01'
  const day = parts.find((p) => p.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

function formatVisitTime(visitDate) {
  if (!visitDate) return 'صباحية'
  const date = new Date(visitDate)
  if (Number.isNaN(date.getTime())) return 'صباحية'
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: RIYADH_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date)
  const hour24 = Number(parts.find((p) => p.type === 'hour')?.value ?? '10')
  return hour24 >= 12 ? 'مسائية' : 'صباحية'
}

function mapVisitRow(row) {
  return {
    id: row.id,
    officeName: row.office_name ?? '',
    city: row.city ?? '',
    type: row.type ?? 'تقييم شامل',
    status: row.status ?? 'معلقة',
    scenario: row.scenario ?? '',
    membershipId: row.membership_id ?? '',
    assignedShopperId: row.shopper_id ?? null,
    date: formatVisitDate(row.visit_date),
    time: formatVisitTime(row.visit_date),
    scores: row.scores && typeof row.scores === 'object' ? row.scores : {},
    notes: row.notes ?? '',
    pointsEarned: Number(row.points_earned ?? 0),
    fileUrls: Array.isArray(row.file_urls) ? row.file_urls : [],
  }
}

function mapIssueRow(row) {
  return {
    id: row.id,
    visitId: row.visit_id,
    severity: row.severity,
    description: row.description,
    createdAt: row.created_at,
  }
}

function mapNotificationRow(row) {
  return {
    id: row.id,
    recipientRole: row.recipient_role ?? '',
    recipientUserId: row.recipient_user_id ?? null,
    recipientEmail: normalizeEmail(row.recipient_email),
    title: row.title ?? '',
    description: row.description ?? '',
    eventType: row.event_type ?? '',
    visitId: row.visit_id ?? null,
    payload: row.payload && typeof row.payload === 'object' ? row.payload : {},
    isRead: Boolean(row.is_read),
    readAt: row.read_at ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
  }
}

function mapPointsRules(rows) {
  const next = { visits: [], issues: [], quality: [], achievements: [] }
  rows.forEach((row) => {
    if (!next[row.category]) return
    next[row.category].push({ label: row.condition, points: Number(row.points ?? 0) })
  })
  return next
}

function makeEmptyScores() {
  const obj = {}
  ALL_QUESTION_KEYS.forEach((k) => { obj[k] = 0 })
  return obj
}

function getGeneratedIssues(scores) {
  const pct = calculatePercentage(scores)
  if (pct >= 80) return []
  const severity = pct < 40 ? 'خطيرة' : pct < 60 ? 'متوسطة' : 'بسيطة'
  // Find which categories have weak scores
  const weakKeys = ALL_QUESTION_KEYS.filter((k) => Number(scores[k]) === 0)
  const desc = weakKeys.length > 0
    ? `تم رصد ${weakKeys.length} نقطة ضعف (${pct}% فقط).`
    : `النتيجة العامة ${pct}% تحتاج تحسين.`
  return [{ severity, description: desc }]
}

function isRootSuperAdmin(user) {
  return user?.role === 'superadmin' && user.id === SUPER_ADMIN_ACCOUNT.id
}

function parseVisitDateTime(date, time) {
  const dateValue = String(date ?? '').trim()
  if (!dateValue) return new Date().toISOString()
  if (time === 'مسائية') return `${dateValue}T18:00:00${RIYADH_UTC_OFFSET}`
  return `${dateValue}T10:00:00${RIYADH_UTC_OFFSET}`
}

function ProtectedRoute({ user, allowedRole, children }) {
  if (!user) return <Navigate to="/" replace />
  if (allowedRole && user.role !== allowedRole) return <Navigate to={getRoleHome(user.role)} replace />
  return children
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

// ─── Main App ───────────────────────────────────────────────────────────────
function App() {
  // Initialize state from mock data
  const allAdmins = useMemo(() => mockAdmins.map(mapAdminRow), [])
  const [subAdmins, setSubAdmins] = useState(() => allAdmins.filter((a) => a.role === 'admin'))
  const [superAdmins, setSuperAdmins] = useState(() => allAdmins.filter((a) => a.role === 'superadmin'))
  const [opsAdmins, setOpsAdmins] = useState(() => allAdmins.filter((a) => a.role === 'ops'))
  const [shoppers, setShoppers] = useState(() => initialShoppers.map(mapShopperRow))
  const [visits, setVisits] = useState(() => initialVisits.map(mapVisitRow))
  const [issues, setIssues] = useState(() => initialIssues.map(mapIssueRow))
  const [notifications, setNotifications] = useState(() => initialNotifications.map(mapNotificationRow))
  const offices = useMemo(() => mockOffices.map((o) => ({ id: o.id, name: o.name, city: o.city, type: o.type, location: o.location, status: o.status })), [])
  const evaluationCriteria = mockEvaluationCriteria
  const pointsRules = useMemo(() => mapPointsRules(mockPointsRules), [])

  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const activeUser = useMemo(() => {
    if (!authUser) return null
    if (authUser.role === 'superadmin') {
      if (isRootSuperAdmin(authUser)) {
        return { ...authUser, role: 'superadmin', isRootSuperAdmin: true }
      }
      const sa = superAdmins.find((a) => a.id === authUser.id || normalizeEmail(a.email) === normalizeEmail(authUser.email))
      return sa?.status === 'نشط' ? { ...authUser, ...sa, role: 'superadmin', isRootSuperAdmin: false } : null
    }
    if (authUser.role === 'admin') {
      const a = subAdmins.find((x) => x.id === authUser.id || normalizeEmail(x.email) === normalizeEmail(authUser.email))
      return a ? { ...authUser, ...a, role: 'admin' } : null
    }
    if (authUser.role === 'ops') {
      const o = opsAdmins.find((x) => x.id === authUser.id || normalizeEmail(x.email) === normalizeEmail(authUser.email))
      return o ? { ...authUser, ...o, role: 'ops' } : null
    }
    if (authUser.role === 'shopper') {
      const s = shoppers.find((x) => x.id === authUser.id || normalizeEmail(x.email) === normalizeEmail(authUser.email))
      return s ? { ...authUser, ...s, role: 'shopper' } : null
    }
    return null
  }, [authUser, opsAdmins, shoppers, subAdmins, superAdmins])

  // ─── Derived data ─────────────────────────────────────────────────────────
  const issuesWithVisitMeta = useMemo(() => {
    const vm = new Map(visits.map((v) => [v.id, v]))
    return issues.map((iss) => {
      const rv = vm.get(iss.visitId)
      return { ...iss, officeName: rv?.officeName ?? '', city: rv?.city ?? '', date: rv?.date ?? '' }
    })
  }, [issues, visits])

  const issuesByVisit = useMemo(() => {
    const map = new Map()
    issuesWithVisitMeta.forEach((iss) => {
      const cur = map.get(iss.visitId) ?? []
      map.set(iss.visitId, [...cur, iss])
    })
    return map
  }, [issuesWithVisitMeta])

  const visitsWithIssues = useMemo(() => visits.map((v) => ({ ...v, issues: issuesByVisit.get(v.id) ?? [] })), [issuesByVisit, visits])

  const scopedNotifications = useMemo(() => {
    if (!activeUser) return []
    return notifications
      .filter((n) => n.recipientRole === activeUser.role)
      .filter((n) => !n.recipientUserId || n.recipientUserId === activeUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [activeUser, notifications])

  const unreadNotificationsCount = useMemo(() => scopedNotifications.filter((n) => !n.isRead).length, [scopedNotifications])

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const handleLogin = useCallback((email, password, options = {}) => {
    const commitSession = options.commit !== false
    const ne = normalizeEmail(email)

    // Root superadmin
    if (ne === normalizeEmail(SUPER_ADMIN_ACCOUNT.email) && password === SUPER_ADMIN_ACCOUNT.password) {
      const payload = { id: SUPER_ADMIN_ACCOUNT.id, name: SUPER_ADMIN_ACCOUNT.name, email: SUPER_ADMIN_ACCOUNT.email, role: 'superadmin' }
      if (commitSession) { setAuthUser(payload); localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload)) }
      return payload
    }

    // All other users
    const allUsers = [
      ...superAdmins.map((u) => ({ ...u, role: 'superadmin' })),
      ...subAdmins.map((u) => ({ ...u, role: 'admin' })),
      ...opsAdmins.map((u) => ({ ...u, role: 'ops' })),
      ...shoppers.map((u) => ({ ...u, role: 'shopper' })),
    ]

    const user = allUsers.find((u) => normalizeEmail(u.email) === ne && u.password === password && u.status === 'نشط')
    if (!user) return null

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role }
    if (commitSession) { setAuthUser(payload); localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload)) }
    return payload
  }, [opsAdmins, shoppers, subAdmins, superAdmins])

  const handleLogout = useCallback(() => {
    setAuthUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [])

  // ─── Notification actions ─────────────────────────────────────────────────
  const markNotificationAsRead = useCallback(async (notificationId) => {
    setNotifications((prev) => prev.map((n) => n.id !== notificationId ? n : { ...n, isRead: true, readAt: new Date().toISOString() }))
    return true
  }, [])

  const markAllNotificationsAsRead = useCallback(async () => {
    const readAt = new Date().toISOString()
    const ids = new Set(scopedNotifications.filter((n) => !n.isRead).map((n) => n.id))
    setNotifications((prev) => prev.map((n) => ids.has(n.id) ? { ...n, isRead: true, readAt } : n))
    return true
  }, [scopedNotifications])

  // ─── Shopper CRUD ─────────────────────────────────────────────────────────
  const addShopper = useCallback(async (payload) => {
    const newShopper = mapShopperRow({
      id: generateId('sh'), name: payload.name, email: payload.email,
      personal_email: payload.personalEmail ?? '', password: payload.password,
      city: payload.city, primary_phone: payload.primaryPhone ?? '',
      whatsapp_phone: payload.whatsappPhone ?? '', status: toDbUserStatus(payload.status ?? 'نشط'),
      visits_completed: 0, points: 0, assigned_admin_id: payload.assignedAdminId ?? null,
    })
    setShoppers((prev) => [newShopper, ...prev])
    return newShopper
  }, [])

  const updateShopper = useCallback(async (shopperId, updates) => {
    let updated = null
    setShoppers((prev) => prev.map((s) => {
      if (s.id !== shopperId) return s
      updated = {
        ...s,
        name: updates.name ?? s.name, email: updates.email ? normalizeEmail(updates.email) : s.email,
        personalEmail: updates.personalEmail !== undefined ? normalizeEmail(updates.personalEmail) : s.personalEmail,
        password: updates.password ?? s.password, city: updates.city ?? s.city,
        primaryPhone: updates.primaryPhone ?? s.primaryPhone, whatsappPhone: updates.whatsappPhone ?? s.whatsappPhone,
        status: updates.status ? toArabicUserStatus(updates.status) : s.status,
      }
      return updated
    }))
    return updated
  }, [])

  const updateShopperStatus = useCallback(async (shopperId, newStatus) => {
    setShoppers((prev) => prev.map((s) => s.id !== shopperId ? s : { ...s, status: toArabicUserStatus(newStatus) }))
    return true
  }, [])

  const deleteShopper = useCallback(async (shopperId) => {
    setShoppers((prev) => prev.filter((s) => s.id !== shopperId))
    return true
  }, [])

  const awardShopperPoints = useCallback(async (shopperId, points, reason) => {
    setShoppers((prev) => prev.map((s) => s.id !== shopperId ? s : { ...s, points: s.points + points }))
    return true
  }, [])

  // ─── Visit CRUD ───────────────────────────────────────────────────────────
  const addVisit = useCallback(async (payload) => {
    const newVisitRow = {
      id: generateId('v'), office_name: payload.officeName, city: payload.city,
      type: payload.type || 'تقييم شامل', status: payload.status || 'معلقة',
      scenario: payload.scenario ?? '', membership_id: `CB-${Math.floor(10000 + Math.random() * 90000)}`,
      shopper_id: payload.assignedShopperId || null,
      visit_date: parseVisitDateTime(payload.date, payload.time),
      scores: {}, notes: '', points_earned: 0, file_urls: [],
    }
    const mapped = mapVisitRow(newVisitRow)
    setVisits((prev) => [mapped, ...prev])

    // Add notification
    const nid = generateId('n')
    setNotifications((prev) => [{
      id: nid, recipientRole: 'superadmin', recipientUserId: null, recipientEmail: '',
      title: 'تم إنشاء زيارة جديدة', description: `تم إنشاء زيارة جديدة (${payload.officeName} - ${payload.city})`,
      eventType: 'visit_created', visitId: mapped.id, payload: {}, isRead: false, readAt: null,
      createdAt: new Date().toISOString(),
    }, ...prev])

    return mapped
  }, [])

  const updateVisit = useCallback(async (visitId, updates) => {
    let updated = null
    setVisits((prev) => prev.map((v) => {
      if (v.id !== visitId) return v
      updated = {
        ...v,
        officeName: updates.officeName ?? v.officeName, city: updates.city ?? v.city,
        type: updates.type ?? v.type, status: updates.status ?? v.status,
        scenario: updates.scenario ?? v.scenario,
        date: updates.date ?? v.date, time: updates.time ?? v.time,
        assignedShopperId: updates.assignedShopperId !== undefined ? updates.assignedShopperId : v.assignedShopperId,
      }
      return updated
    }))
    return updated
  }, [])

  const deleteVisit = useCallback(async (visitId) => {
    const target = visits.find((v) => v.id === visitId)
    if (!target) return false

    if (activeUser?.role === 'ops' && target.status !== 'جاري المسح') {
      setVisits((prev) => prev.map((v) => v.id !== visitId ? v : { ...v, status: 'جاري المسح' }))
      return 'requested'
    }

    setVisits((prev) => prev.filter((v) => v.id !== visitId))
    setIssues((prev) => prev.filter((i) => i.visitId !== visitId))
    return true
  }, [activeUser, visits])

  const completeVisit = useCallback(async (visitId, payload) => {
    const target = visits.find((v) => v.id === visitId)
    if (!target) return null

    const finalScore = calculateWeightedScore(payload.scores)
    const generatedIssues = getGeneratedIssues(payload.scores)
    const pointsEarned = Math.round(calculatePercentage(payload.scores) * 1.2 + generatedIssues.length * 10)

    setVisits((prev) => prev.map((v) => v.id !== visitId ? v : {
      ...v, status: 'مكتملة', scores: payload.scores, notes: payload.notes, pointsEarned,
    }))

    if (target.assignedShopperId) {
      setShoppers((prev) => prev.map((s) => s.id !== target.assignedShopperId ? s : {
        ...s, visits: s.visits + 1, points: s.points + pointsEarned,
      }))
    }

    // Replace issues for this visit
    setIssues((prev) => {
      const remaining = prev.filter((i) => i.visitId !== visitId)
      const newIssues = generatedIssues.map((gi, idx) => ({
        id: generateId('iss'), visitId, severity: gi.severity,
        description: gi.description, createdAt: new Date().toISOString(),
      }))
      return [...remaining, ...newIssues]
    })

    return pointsEarned
  }, [visits, evaluationCriteria])

  // ─── Admin CRUD (SuperAdmin) ──────────────────────────────────────────────
  const canManageSuperAdmins = isRootSuperAdmin(activeUser)
  const canManageOpsAdmins = activeUser?.role === 'superadmin'

  const addSuperAdmin = useCallback(async (payload) => {
    const newAdmin = mapAdminRow({ id: generateId('sa'), name: payload.name, email: payload.email, personal_email: payload.personalEmail ?? '', password: payload.password, city: payload.city, status: toDbUserStatus(payload.status), role: 'superadmin' })
    setSuperAdmins((prev) => [newAdmin, ...prev])
    return newAdmin
  }, [])

  const updateSuperAdmin = useCallback(async (id, updates) => {
    let updated = null
    setSuperAdmins((prev) => prev.map((a) => {
      if (a.id !== id) return a
      updated = { ...a, name: updates.name ?? a.name, email: updates.email ? normalizeEmail(updates.email) : a.email, password: updates.password ?? a.password, city: updates.city ?? a.city, status: updates.status ? toArabicUserStatus(updates.status) : a.status }
      return updated
    }))
    return updated
  }, [])

  const deleteSuperAdmin = useCallback(async (id) => {
    setSuperAdmins((prev) => prev.filter((a) => a.id !== id))
    return true
  }, [])

  const addOpsAdmin = useCallback(async (payload) => {
    const newAdmin = mapAdminRow({ id: generateId('ops'), name: payload.name, email: payload.email, personal_email: payload.personalEmail ?? '', password: payload.password, city: payload.city, status: toDbUserStatus(payload.status), role: 'ops' })
    setOpsAdmins((prev) => [newAdmin, ...prev])
    return newAdmin
  }, [])

  const updateOpsAdmin = useCallback(async (id, updates) => {
    let updated = null
    setOpsAdmins((prev) => prev.map((a) => {
      if (a.id !== id) return a
      updated = { ...a, name: updates.name ?? a.name, email: updates.email ? normalizeEmail(updates.email) : a.email, password: updates.password ?? a.password, city: updates.city ?? a.city, status: updates.status ? toArabicUserStatus(updates.status) : a.status }
      return updated
    }))
    return updated
  }, [])

  const deleteOpsAdmin = useCallback(async (id) => {
    setOpsAdmins((prev) => prev.filter((a) => a.id !== id))
    return true
  }, [])

  const addSubAdmin = useCallback(async (payload) => {
    const newAdmin = mapAdminRow({ id: generateId('admin'), name: payload.name, email: payload.email, personal_email: payload.personalEmail ?? '', password: payload.password, city: payload.city, status: toDbUserStatus(payload.status), role: 'admin' })
    setSubAdmins((prev) => [newAdmin, ...prev])
    return newAdmin
  }, [])

  const updateSubAdmin = useCallback(async (id, updates) => {
    let updated = null
    setSubAdmins((prev) => prev.map((a) => {
      if (a.id !== id) return a
      updated = { ...a, name: updates.name ?? a.name, email: updates.email ? normalizeEmail(updates.email) : a.email, password: updates.password ?? a.password, city: updates.city ?? a.city, status: updates.status ? toArabicUserStatus(updates.status) : a.status }
      return updated
    }))
    return updated
  }, [])

  const deleteSubAdmin = useCallback(async (id) => {
    setSubAdmins((prev) => prev.filter((a) => a.id !== id))
    return true
  }, [])

  // ─── Scope props ──────────────────────────────────────────────────────────
  const baseProps = {
    offices, evaluationCriteria, pointsRules, locationDatabase,
    notifications: scopedNotifications, notificationsEnabled: true,
    unreadNotificationsCount, dataLoading: false, dataError: '',
    isLive: true, markNotificationAsRead, markAllNotificationsAsRead,
    onLogout: handleLogout,
  }

  const adminScopeProps = {
    ...baseProps, user: activeUser, shoppers, visits: visitsWithIssues, issues: issuesWithVisitMeta,
    addShopper, updateShopper, updateShopperStatus, deleteShopper,
    addVisit, updateVisit, deleteVisit, completeVisit, awardShopperPoints,
  }

  const opsScopeProps = {
    ...baseProps, user: activeUser, shoppers, visits: visitsWithIssues, issues: issuesWithVisitMeta,
    addVisit, updateVisit, deleteVisit,
  }

  const superAdminScopeProps = {
    ...baseProps, user: activeUser, superAdmins, opsAdmins, subAdmins, shoppers,
    visits: visitsWithIssues, issues: issuesWithVisitMeta,
    canManageSuperAdmins, canManageOpsAdmins,
    addSuperAdmin, updateSuperAdmin, deleteSuperAdmin,
    addOpsAdmin, updateOpsAdmin, deleteOpsAdmin,
    addSubAdmin, updateSubAdmin, deleteSubAdmin,
    addShopper, updateShopper, updateShopperStatus, deleteShopper,
    addVisit, updateVisit, deleteVisit, completeVisit, awardShopperPoints,
  }

  const shopperScopeProps = {
    ...baseProps, user: activeUser, shoppers, visits: visitsWithIssues, issues: issuesWithVisitMeta,
    completeVisit,
  }

  const defaultPath = activeUser ? getRoleHome(activeUser.role) : '/'

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cb-gray-50">
          <div className="text-center animate-fade-in">
            <img src="/branding/chessboard-logo.jpeg" alt="Chessboard" className="mx-auto h-16 w-16 object-contain mb-4 rounded-xl" />
            <p className="text-sm font-semibold text-cb-gray-600">جاري تحميل الصفحة...</p>
          </div>
        </div>
      }
    >
      <Routes>
        <Route
          path="/"
          element={
            activeUser ? <Navigate to={defaultPath} replace /> : <Login onLogin={handleLogin} />
          }
        />

        <Route path="/login" element={<Navigate to="/" replace />} />

        <Route
          path="/superadmin"
          element={
            <ProtectedRoute user={activeUser} allowedRole="superadmin">
              <SuperAdminLayout {...superAdminScopeProps} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<SuperAdminOverview />} />
          <Route path="managers" element={<ManageAdmins />} />
          <Route path="shoppers" element={<Shoppers />} />
          <Route path="visits" element={<Visits />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="reports" element={<AdminReports />} />
          {SHOW_POINTS_SECTION && <Route path="points" element={<Points />} />}
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute user={activeUser} allowedRole="admin">
              <AdminLayout {...adminScopeProps} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="visits" element={<Visits />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="reports" element={<AdminReports />} />
          {SHOW_POINTS_SECTION && <Route path="points" element={<Points />} />}
        </Route>

        <Route
          path="/ops"
          element={
            <ProtectedRoute user={activeUser} allowedRole="ops">
              <AdminLayout {...opsScopeProps} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="visits" element={<Visits />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        <Route
          path="/shopper"
          element={
            <ProtectedRoute user={activeUser} allowedRole="shopper">
              <ShopperLayout {...shopperScopeProps} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ShopperDashboard />} />
          <Route path="visits" element={<MyVisits />} />
          <Route path="visits/:visitId" element={<VisitDetail />} />
          <Route path="completed" element={<CompletedVisits />} />
          <Route path="completed/:visitId" element={<VisitDetail fromCompleted />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="reports" element={<ShopperReports />} />
        </Route>

        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
