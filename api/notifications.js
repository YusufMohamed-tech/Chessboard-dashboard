import { requireRole } from './_lib/middleware.js'
import { supabase } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') return handleList(req, res)
  if (req.method === 'PUT') return handleMarkRead(req, res)
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

// GET /api/notifications
async function handleList(req, res) {
  const user = await requireRole(req, res, ['superadmin', 'admin', 'ops', 'shopper'])
  if (!user) return

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_role', user.role)
      .order('created_at', { ascending: false })
      .limit(100)

    const { data, error } = await query
    if (error) throw error

    // Further filter: notifications with a specific user_id should only show to that user
    const filtered = (data || []).filter(n =>
      !n.recipient_user_id || n.recipient_user_id === user.id
    )

    return res.status(200).json({ success: true, data: filtered })
  } catch (err) {
    console.error('List notifications error:', err)
    return res.status(500).json({ success: false, error: 'فشل في تحميل الإشعارات' })
  }
}

// PUT /api/notifications — mark as read
async function handleMarkRead(req, res) {
  const user = await requireRole(req, res, ['superadmin', 'admin', 'ops', 'shopper'])
  if (!user) return

  try {
    const { notificationId, markAll } = req.body || {}
    const readAt = new Date().toISOString()

    if (markAll) {
      // Mark all notifications for this user's role as read
      let query = supabase
        .from('notifications')
        .update({ is_read: true, read_at: readAt })
        .eq('recipient_role', user.role)
        .eq('is_read', false)

      const { error } = await query
      if (error) throw error
    } else if (notificationId) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: readAt })
        .eq('id', notificationId)

      if (error) throw error
    } else {
      return res.status(400).json({ success: false, error: 'معرف الإشعار أو markAll مطلوب' })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Mark notification error:', err)
    return res.status(500).json({ success: false, error: 'فشل في تحديث الإشعار' })
  }
}
