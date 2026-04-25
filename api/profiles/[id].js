import { requireRole } from '../_lib/middleware.js'
import { hashPassword } from '../_lib/auth.js'
import { supabase } from '../_lib/db.js'

export default async function handler(req, res) {
  const profileId = req.query.id
  if (!profileId) {
    return res.status(400).json({ success: false, error: 'معرف المستخدم مطلوب' })
  }

  if (req.method === 'PUT') {
    return handleUpdate(req, res, profileId)
  }
  if (req.method === 'DELETE') {
    return handleDelete(req, res, profileId)
  }
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

// PUT /api/profiles/[id]
async function handleUpdate(req, res, profileId) {
  const user = await requireRole(req, res, ['superadmin'])
  if (!user) return

  try {
    const { name, email, password, personalEmail, city, primaryPhone, whatsappPhone, status, assignedBrands, assignedAdminId } = req.body || {}

    // Build update object with only provided fields
    const updates = {}
    if (name !== undefined) updates.name = name
    if (email !== undefined) updates.email = String(email).trim().toLowerCase()
    if (personalEmail !== undefined) updates.personal_email = personalEmail
    if (city !== undefined) updates.city = city
    if (primaryPhone !== undefined) updates.primary_phone = primaryPhone
    if (whatsappPhone !== undefined) updates.whatsapp_phone = whatsappPhone
    if (status !== undefined) updates.status = status === 'inactive' ? 'inactive' : 'active'
    if (assignedBrands !== undefined) updates.assigned_brands = Array.isArray(assignedBrands) ? assignedBrands : []
    if (assignedAdminId !== undefined) updates.assigned_admin_id = assignedAdminId || null

    // Hash new password if provided
    if (password) {
      updates.password_hash = await hashPassword(password)
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'لا توجد بيانات للتحديث' })
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single()

    if (error) throw error

    const { password_hash, ...profile } = updated
    return res.status(200).json({ success: true, data: profile })
  } catch (err) {
    console.error('Update profile error:', err)
    return res.status(500).json({ success: false, error: 'فشل في تحديث الحساب' })
  }
}

// DELETE /api/profiles/[id]
async function handleDelete(req, res, profileId) {
  const user = await requireRole(req, res, ['superadmin'])
  if (!user) return

  try {
    // Prevent deleting root superadmin
    const { data: target } = await supabase
      .from('profiles')
      .select('is_root, role')
      .eq('id', profileId)
      .single()

    if (target?.is_root) {
      return res.status(403).json({ success: false, error: 'لا يمكن حذف السوبر أدمن الرئيسي' })
    }

    // Only root superadmin can delete other superadmins
    if (target?.role === 'superadmin' && !user.is_root) {
      return res.status(403).json({ success: false, error: 'فقط السوبر أدمن الرئيسي يمكنه حذف سوبر أدمن آخر' })
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId)

    if (error) throw error

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Delete profile error:', err)
    return res.status(500).json({ success: false, error: 'فشل في حذف الحساب' })
  }
}
