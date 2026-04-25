import { requireRole } from './_lib/middleware.js'
import { supabase } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const user = await requireRole(req, res, ['superadmin', 'admin', 'ops', 'shopper'])
  if (!user) return

  try {
    // Fetch issues with visit metadata via join
    let query = supabase
      .from('issues')
      .select('*, visits!inner(office_name, city, visit_date, brand, shopper_id)')
      .order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error

    // Apply role-based filtering
    let filtered = data || []

    if (user.role === 'shopper') {
      filtered = filtered.filter(iss => iss.visits?.shopper_id === user.id)
    } else if (user.role === 'admin' && user.assigned_brands?.length > 0) {
      filtered = filtered.filter(iss => user.assigned_brands.includes(iss.visits?.brand))
    }

    // Flatten the visit data into the issue object
    const issues = filtered.map(({ visits, ...iss }) => ({
      ...iss,
      officeName: visits?.office_name || '',
      city: visits?.city || '',
      date: visits?.visit_date ? new Date(visits.visit_date).toISOString().split('T')[0] : '',
    }))

    return res.status(200).json({ success: true, data: issues })
  } catch (err) {
    console.error('List issues error:', err)
    return res.status(500).json({ success: false, error: 'فشل في تحميل المشاكل' })
  }
}
