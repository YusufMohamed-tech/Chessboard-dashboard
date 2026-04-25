import { verifyToken } from './auth.js'
import { supabase } from './db.js'

/**
 * Extract and verify JWT from the Authorization header.
 * Returns the user profile row or null.
 */
export async function authenticate(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded || !decoded.sub) return null

  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', decoded.sub)
    .single()

  if (error || !user) return null
  if (user.status !== 'active') return null

  return user
}

/**
 * Check the authenticated user has one of the allowed roles.
 * Returns { user } or sends a 401/403 response and returns null.
 */
export async function requireRole(req, res, allowedRoles) {
  const user = await authenticate(req)

  if (!user) {
    res.status(401).json({ success: false, error: 'غير مصرح — يرجى تسجيل الدخول' })
    return null
  }

  if (!allowedRoles.includes(user.role)) {
    res.status(403).json({ success: false, error: 'ليس لديك صلاحية لهذا الإجراء' })
    return null
  }

  return user
}
