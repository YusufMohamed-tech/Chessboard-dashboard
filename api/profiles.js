import { requireRole } from './_lib/middleware.js'
import { hashPassword } from './_lib/auth.js'
import { supabase } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleList(req, res)
  }
  if (req.method === 'POST') {
    return handleCreate(req, res)
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

// GET /api/profiles?role=admin&role=ops  (supports multiple role filters)
async function handleList(req, res) {
  const user = await requireRole(req, res, ['superadmin', 'admin', 'ops', 'shopper'])
  if (!user) return

  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    // Role filter from query params
    const roles = [].concat(req.query?.role || []).filter(Boolean)
    if (roles.length > 0) {
      query = query.in('role', roles)
    }

    // Shoppers can only see their own profile
    if (user.role === 'shopper') {
      query = query.eq('id', user.id)
    }

    const { data, error } = await query
    if (error) throw error

    // Strip password hashes from response
    const profiles = (data || []).map(({ password_hash, ...p }) => p)

    return res.status(200).json({ success: true, data: profiles })
  } catch (err) {
    console.error('List profiles error:', err)
    return res.status(500).json({ success: false, error: 'فشل في تحميل البيانات' })
  }
}

// POST /api/profiles — Create new user (SuperAdmin only)
async function handleCreate(req, res) {
  const user = await requireRole(req, res, ['superadmin'])
  if (!user) return

  try {
    const { name, email, password, personalEmail, role, city, primaryPhone, whatsappPhone, status, assignedBrands, assignedAdminId } = req.body || {}

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'الاسم والبريد وكلمة المرور والدور مطلوبون' })
    }

    const validRoles = ['superadmin', 'admin', 'ops', 'shopper']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'دور غير صالح' })
    }

    // Only root superadmin can create other superadmins
    if (role === 'superadmin' && !user.is_root) {
      return res.status(403).json({ success: false, error: 'فقط السوبر أدمن الرئيسي يمكنه إنشاء سوبر أدمن آخر' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (existing) {
      return res.status(409).json({ success: false, error: 'البريد الإلكتروني مستخدم بالفعل' })
    }

    const password_hash = await hashPassword(password)

    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        name,
        email: normalizedEmail,
        personal_email: personalEmail || '',
        password_hash,
        role,
        city: city || '',
        primary_phone: primaryPhone || '',
        whatsapp_phone: whatsappPhone || '',
        status: status === 'inactive' ? 'inactive' : 'active',
        assigned_brands: Array.isArray(assignedBrands) ? assignedBrands : [],
        assigned_admin_id: assignedAdminId || null,
      })
      .select()
      .single()

    if (error) throw error

    const { password_hash: _, ...profile } = newProfile
    return res.status(201).json({ success: true, data: profile })
  } catch (err) {
    console.error('Create profile error:', err)
    return res.status(500).json({ success: false, error: 'فشل في إنشاء الحساب' })
  }
}
