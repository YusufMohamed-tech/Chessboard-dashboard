import { Suspense, lazy, useMemo, useState, useCallback, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { calculateWeightedScore, ALL_QUESTION_KEYS, calculatePercentage } from './utils/scoring'
import { BRANDS, POINTS_RULES, EVALUATION_CRITERIA, AUTH_STORAGE_KEY, TOKEN_STORAGE_KEY } from './config/constants'
import { locationDatabase } from './data/locations'
import * as authService from './services/authService'
import * as dataService from './services/dataService'

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

const SHOW_POINTS_SECTION = true
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
  const n = String(value ?? '').trim().toLowerCase()
  return n === 'active' || n === 'نشط' ? 'نشط' : 'غير نشط'
}

function toDbUserStatus(value) {
  const n = String(value ?? '').trim().toLowerCase()
  return n === 'active' || n === 'نشط' ? 'active' : 'inactive'
}

// Map DB row → frontend profile shape
function mapProfileRow(row) {
  return {
    id: row.id,
    name: row.name ?? '',
    email: normalizeEmail(row.email),
    personalEmail: normalizeEmail(row.personal_email ?? ''),
    city: row.city ?? '',
    primaryPhone: row.primary_phone ?? '',
    whatsappPhone: row.whatsapp_phone ?? '',
    status: toArabicUserStatus(row.status),
    role: row.role ?? 'shopper',
    assignedBrands: Array.isArray(row.assigned_brands) ? row.assigned_brands : [],
    assignedAdminId: row.assigned_admin_id ?? null,
    visits: Number(row.visits_completed ?? 0),
    points: Number(row.points ?? 0),
    isRoot: Boolean(row.is_root),
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

// Map DB row → frontend visit shape
function mapVisitRow(row) {
  return {
    id: row.id,
    officeName: row.office_name ?? '',
    city: row.city ?? '',
    type: row.type ?? 'تقييم شامل',
    brand: row.brand ?? '',
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
    officeName: row.officeName ?? '',
    city: row.city ?? '',
    date: row.date ?? '',
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

// ─── Main App ───────────────────────────────────────────────
function App() {
  // ─── Auth State ──────────────────────────────────────────
  const [authUser, setAuthUser] = useState(() => authService.getStoredUser())
  const [sessionChecked, setSessionChecked] = useState(false)

  // ─── Data State ──────────────────────────────────────────
  const [allProfiles, setAllProfiles] = useState([])
  const [visits, setVisits] = useState([])
  const [issues, setIssues] = useState([])
  const [notifications, setNotifications] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')

  // ─── Derived profile lists ───────────────────────────────
  const mappedProfiles = useMemo(() => allProfiles.map(mapProfileRow), [allProfiles])
  const superAdmins = useMemo(() => mappedProfiles.filter(p => p.role === 'superadmin'), [mappedProfiles])
  const subAdmins = useMemo(() => mappedProfiles.filter(p => p.role === 'admin'), [mappedProfiles])
  const opsAdmins = useMemo(() => mappedProfiles.filter(p => p.role === 'ops'), [mappedProfiles])
  const shoppers = useMemo(() => mappedProfiles.filter(p => p.role === 'shopper'), [mappedProfiles])

  // ─── Derived visit/issue data ────────────────────────────
  const mappedVisits = useMemo(() => visits.map(mapVisitRow), [visits])
  const mappedIssues = useMemo(() => issues.map(mapIssueRow), [issues])
  const mappedNotifications = useMemo(() => notifications.map(mapNotificationRow), [notifications])

  const issuesByVisit = useMemo(() => {
    const map = new Map()
    mappedIssues.forEach(iss => {
      const cur = map.get(iss.visitId) ?? []
      map.set(iss.visitId, [...cur, iss])
    })
    return map
  }, [mappedIssues])

  const visitsWithIssues = useMemo(() =>
    mappedVisits.map(v => ({ ...v, issues: issuesByVisit.get(v.id) ?? [] }))
  , [mappedVisits, issuesByVisit])

  // Active user from mappedProfiles
  const activeUser = useMemo(() => {
    if (!authUser) return null
    const found = mappedProfiles.find(p => p.id === authUser.id)
    if (found) return { ...found, isRootSuperAdmin: found.isRoot }
    // If profile not loaded yet, use stored auth
    return { ...authUser, isRootSuperAdmin: authUser.is_root || false }
  }, [authUser, mappedProfiles])

  const scopedNotifications = useMemo(() => {
    if (!activeUser) return []
    return mappedNotifications
      .filter(n => n.recipientRole === activeUser.role)
      .filter(n => !n.recipientUserId || n.recipientUserId === activeUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [activeUser, mappedNotifications])

  const unreadNotificationsCount = useMemo(() =>
    scopedNotifications.filter(n => !n.isRead).length
  , [scopedNotifications])

  // ─── Session Validation ──────────────────────────────────
  useEffect(() => {
    if (!authUser) { setSessionChecked(true); return }
    authService.validateSession()
      .then(user => {
        if (!user) setAuthUser(null)
        else setAuthUser(user)
      })
      .catch(() => setAuthUser(null))
      .finally(() => setSessionChecked(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Fetch all data when logged in ──────────────────────
  const fetchAllData = useCallback(async () => {
    setDataLoading(true)
    setDataError('')
    try {
      const [profilesData, visitsData, issuesData, notifData] = await Promise.all([
        dataService.fetchProfiles().catch(() => []),
        dataService.fetchVisits().catch(() => []),
        dataService.fetchIssues().catch(() => []),
        dataService.fetchNotifications().catch(() => []),
      ])
      setAllProfiles(profilesData)
      setVisits(visitsData)
      setIssues(issuesData)
      setNotifications(notifData)
    } catch (err) {
      setDataError('فشل في تحميل البيانات. يرجى تحديث الصفحة.')
      console.error('Fetch all data error:', err)
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authUser && sessionChecked) fetchAllData()
  }, [authUser, sessionChecked, fetchAllData])

  // ─── Auth ────────────────────────────────────────────────
  const handleLogin = useCallback(async (email, password) => {
    const user = await authService.login(email, password)
    setAuthUser(user)
    return user
  }, [])

  const handleLogout = useCallback(() => {
    authService.logout()
    setAuthUser(null)
    setAllProfiles([])
    setVisits([])
    setIssues([])
    setNotifications([])
  }, [])

  // ─── Notification actions ────────────────────────────────
  const handleMarkNotificationAsRead = useCallback(async (notificationId) => {
    await dataService.markNotificationRead(notificationId)
    setNotifications(prev => prev.map(n =>
      n.id !== notificationId ? n : { ...n, is_read: true, read_at: new Date().toISOString() }
    ))
    return true
  }, [])

  const handleMarkAllNotificationsAsRead = useCallback(async () => {
    await dataService.markAllNotificationsRead()
    const readAt = new Date().toISOString()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: readAt })))
    return true
  }, [])

  // ─── Profile CRUD (SuperAdmin) ───────────────────────────
  const addProfile = useCallback(async (role, payload) => {
    const newProfile = await dataService.createProfile({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      personalEmail: payload.personalEmail ?? '',
      role,
      city: payload.city ?? '',
      primaryPhone: payload.primaryPhone ?? '',
      whatsappPhone: payload.whatsappPhone ?? '',
      status: toDbUserStatus(payload.status ?? 'نشط'),
      assignedBrands: payload.assignedBrands ?? [],
      assignedAdminId: payload.assignedAdminId ?? null,
    })
    setAllProfiles(prev => [newProfile, ...prev])
    return mapProfileRow(newProfile)
  }, [])

  const updateProfileById = useCallback(async (id, updates) => {
    const apiUpdates = {}
    if (updates.name !== undefined) apiUpdates.name = updates.name
    if (updates.email !== undefined) apiUpdates.email = updates.email
    if (updates.password !== undefined) apiUpdates.password = updates.password
    if (updates.personalEmail !== undefined) apiUpdates.personalEmail = updates.personalEmail
    if (updates.city !== undefined) apiUpdates.city = updates.city
    if (updates.primaryPhone !== undefined) apiUpdates.primaryPhone = updates.primaryPhone
    if (updates.whatsappPhone !== undefined) apiUpdates.whatsappPhone = updates.whatsappPhone
    if (updates.status !== undefined) apiUpdates.status = toDbUserStatus(updates.status)
    if (updates.assignedBrands !== undefined) apiUpdates.assignedBrands = updates.assignedBrands
    if (updates.assignedAdminId !== undefined) apiUpdates.assignedAdminId = updates.assignedAdminId

    const updated = await dataService.updateProfile(id, apiUpdates)
    setAllProfiles(prev => prev.map(p => p.id === id ? updated : p))
    return mapProfileRow(updated)
  }, [])

  const deleteProfileById = useCallback(async (id) => {
    await dataService.deleteProfile(id)
    setAllProfiles(prev => prev.filter(p => p.id !== id))
    return true
  }, [])

  // Convenience wrappers matching existing API signatures
  const addSuperAdmin = useCallback(async (p) => addProfile('superadmin', p), [addProfile])
  const addOpsAdmin = useCallback(async (p) => addProfile('ops', p), [addProfile])
  const addSubAdmin = useCallback(async (p) => addProfile('admin', p), [addProfile])
  const addShopper = useCallback(async (p) => addProfile('shopper', p), [addProfile])

  const updateSuperAdmin = useCallback(async (id, u) => updateProfileById(id, u), [updateProfileById])
  const updateOpsAdmin = useCallback(async (id, u) => updateProfileById(id, u), [updateProfileById])
  const updateSubAdmin = useCallback(async (id, u) => updateProfileById(id, u), [updateProfileById])
  const updateShopper = useCallback(async (id, u) => updateProfileById(id, u), [updateProfileById])
  const updateShopperStatus = useCallback(async (id, s) => updateProfileById(id, { status: s }), [updateProfileById])

  const deleteSuperAdmin = useCallback(async (id) => deleteProfileById(id), [deleteProfileById])
  const deleteOpsAdmin = useCallback(async (id) => deleteProfileById(id), [deleteProfileById])
  const deleteSubAdmin = useCallback(async (id) => deleteProfileById(id), [deleteProfileById])
  const deleteShopper = useCallback(async (id) => deleteProfileById(id), [deleteProfileById])

  const awardShopperPoints = useCallback(async (shopperId, points) => {
    const shopper = allProfiles.find(p => p.id === shopperId)
    if (!shopper) return false
    await dataService.updateProfile(shopperId, { points: (shopper.points || 0) + points })
    setAllProfiles(prev => prev.map(p =>
      p.id === shopperId ? { ...p, points: (p.points || 0) + points } : p
    ))
    return true
  }, [allProfiles])

  // ─── Visit CRUD ──────────────────────────────────────────
  const addVisit = useCallback(async (payload) => {
    const newVisit = await dataService.createVisit({
      officeName: payload.officeName,
      city: payload.city,
      type: payload.type || 'تقييم شامل',
      brand: payload.brand || '',
      status: payload.status || 'معلقة',
      scenario: payload.scenario ?? '',
      shopperId: payload.assignedShopperId || null,
      visitDate: parseVisitDateTime(payload.date, payload.time),
    })
    setVisits(prev => [newVisit, ...prev])
    return mapVisitRow(newVisit)
  }, [])

  const updateVisit = useCallback(async (visitId, updates) => {
    const apiUpdates = {}
    if (updates.officeName !== undefined) apiUpdates.officeName = updates.officeName
    if (updates.city !== undefined) apiUpdates.city = updates.city
    if (updates.type !== undefined) apiUpdates.type = updates.type
    if (updates.brand !== undefined) apiUpdates.brand = updates.brand
    if (updates.status !== undefined) apiUpdates.status = updates.status
    if (updates.scenario !== undefined) apiUpdates.scenario = updates.scenario
    if (updates.assignedShopperId !== undefined) apiUpdates.shopperId = updates.assignedShopperId
    if (updates.date !== undefined || updates.time !== undefined) {
      const existing = visits.find(v => v.id === visitId)
      apiUpdates.visitDate = parseVisitDateTime(
        updates.date ?? formatVisitDate(existing?.visit_date),
        updates.time ?? formatVisitTime(existing?.visit_date)
      )
    }

    const updated = await dataService.updateVisit(visitId, apiUpdates)
    setVisits(prev => prev.map(v => v.id === visitId ? updated : v))
    return mapVisitRow(updated)
  }, [visits])

  const deleteVisitAction = useCallback(async (visitId) => {
    const result = await dataService.deleteVisit(visitId)
    if (result.requested) {
      setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status: 'جاري المسح' } : v))
      return 'requested'
    }
    setVisits(prev => prev.filter(v => v.id !== visitId))
    setIssues(prev => prev.filter(i => i.visit_id !== visitId))
    return true
  }, [])

  const completeVisit = useCallback(async (visitId, payload) => {
    const result = await dataService.completeVisit(visitId, payload.scores, payload.notes)
    // Re-fetch data to get updated visits, issues, profiles
    await fetchAllData()
    return result.pointsEarned
  }, [fetchAllData])

  // ─── Scope props ─────────────────────────────────────────
  const evaluationCriteria = EVALUATION_CRITERIA
  const pointsRules = POINTS_RULES

  const canManageSuperAdmins = activeUser?.isRootSuperAdmin === true
  const canManageOpsAdmins = activeUser?.role === 'superadmin'

  const baseProps = {
    offices: [], evaluationCriteria, pointsRules, locationDatabase, brands: BRANDS,
    notifications: scopedNotifications, notificationsEnabled: true,
    unreadNotificationsCount, dataLoading, dataError,
    isLive: true, markNotificationAsRead: handleMarkNotificationAsRead,
    markAllNotificationsAsRead: handleMarkAllNotificationsAsRead,
    onLogout: handleLogout,
  }

  // Brand-scoped data for admin/ops
  const adminBrands = activeUser?.assignedBrands
  const isBrandScoped = activeUser?.role === 'admin'
  const brandScopedVisits = useMemo(() => {
    if (!isBrandScoped) return visitsWithIssues
    if (!adminBrands || adminBrands.length === 0) return []
    return visitsWithIssues.filter(v => adminBrands.includes(v.brand || v.type || ''))
  }, [visitsWithIssues, adminBrands, isBrandScoped])

  const brandScopedIssues = useMemo(() => {
    if (!isBrandScoped) return mappedIssues
    const scopedIds = new Set(brandScopedVisits.map(v => v.id))
    return mappedIssues.filter(iss => scopedIds.has(iss.visitId))
  }, [mappedIssues, brandScopedVisits, isBrandScoped])

  const adminScopeProps = {
    ...baseProps, user: activeUser, shoppers, visits: brandScopedVisits, issues: brandScopedIssues,
    addShopper, updateShopper, updateShopperStatus, deleteShopper,
    addVisit, updateVisit, deleteVisit: deleteVisitAction, completeVisit, awardShopperPoints,
  }

  const opsScopeProps = {
    ...baseProps, user: activeUser, shoppers, visits: brandScopedVisits, issues: brandScopedIssues,
    addVisit, updateVisit, deleteVisit: deleteVisitAction,
  }

  const superAdminScopeProps = {
    ...baseProps, user: activeUser, superAdmins, opsAdmins, subAdmins, shoppers,
    visits: visitsWithIssues, issues: mappedIssues,
    canManageSuperAdmins, canManageOpsAdmins,
    addSuperAdmin, updateSuperAdmin, deleteSuperAdmin,
    addOpsAdmin, updateOpsAdmin, deleteOpsAdmin,
    addSubAdmin, updateSubAdmin, deleteSubAdmin,
    addShopper, updateShopper, updateShopperStatus, deleteShopper,
    addVisit, updateVisit, deleteVisit: deleteVisitAction, completeVisit, awardShopperPoints,
  }

  const shopperScopeProps = {
    ...baseProps, user: activeUser, shoppers, visits: visitsWithIssues, issues: mappedIssues,
    completeVisit,
  }

  const defaultPath = activeUser ? getRoleHome(activeUser.role) : '/'

  // Show loading while checking session
  if (!sessionChecked && authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cb-gray-50">
        <div className="text-center animate-fade-in">
          <img src="/branding/chessboard-logo.jpeg" alt="Chessboard" className="mx-auto h-16 w-16 object-contain mb-4 rounded-xl" />
          <p className="text-sm font-semibold text-cb-gray-600">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    )
  }

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
