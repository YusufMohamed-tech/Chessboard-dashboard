import { requireRole } from './_lib/middleware.js'
import { supabase } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') return handleList(req, res)
  if (req.method === 'POST') return handleCreate(req, res)
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

// GET /api/visits
async function handleList(req, res) {
  const user = await requireRole(req, res, ['superadmin', 'admin', 'ops', 'shopper'])
  if (!user) return

  try {
    let query = supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false })

    // Shoppers only see their assigned visits
    if (user.role === 'shopper') {
      query = query.eq('shopper_id', user.id)
    }

    // Admins with assigned brands only see those brands
    if (user.role === 'admin' && user.assigned_brands && user.assigned_brands.length > 0) {
      query = query.in('brand', user.assigned_brands)
    }

    const { data, error } = await query
    if (error) throw error

    return res.status(200).json({ success: true, data: data || [] })
  } catch (err) {
    console.error('List visits error:', err)
    return res.status(500).json({ success: false, error: 'فشل في تحميل الزيارات' })
  }
}

// POST /api/visits
async function handleCreate(req, res) {
  const user = await requireRole(req, res, ['superadmin', 'admin', 'ops'])
  if (!user) return

  try {
    const { officeName, city, type, brand, status, scenario, shopperId, visitDate } = req.body || {}

    if (!officeName || !city || !visitDate) {
      return res.status(400).json({ success: false, error: 'اسم المكتب والمدينة والتاريخ مطلوبون' })
    }

    const membershipId = `CB-${Math.floor(10000 + Math.random() * 90000)}`

    const { data: newVisit, error } = await supabase
      .from('visits')
      .insert({
        office_name: officeName,
        city,
        type: type || 'تقييم شامل',
        brand: brand || '',
        status: status || 'معلقة',
        scenario: scenario || '',
        membership_id: membershipId,
        shopper_id: shopperId || null,
        visit_date: visitDate,
        scores: {},
        notes: '',
        points_earned: 0,
        file_urls: [],
      })
      .select()
      .single()

    if (error) throw error

    // Create notification
    await supabase.from('notifications').insert({
      recipient_role: 'superadmin',
      title: 'تم إنشاء زيارة جديدة',
      description: `تم إنشاء زيارة جديدة (${officeName} - ${city})`,
      event_type: 'visit_created',
      visit_id: newVisit.id,
    })

    // Notify assigned shopper
    if (shopperId) {
      await supabase.from('notifications').insert({
        recipient_role: 'shopper',
        recipient_user_id: shopperId,
        title: 'تم إسناد زيارة جديدة لك',
        description: `يرجى مراجعة بيانات الزيارة (${officeName} - ${city})`,
        event_type: 'visit_assigned',
        visit_id: newVisit.id,
      })
    }

    return res.status(201).json({ success: true, data: newVisit })
  } catch (err) {
    console.error('Create visit error:', err)
    return res.status(500).json({ success: false, error: 'فشل في إنشاء الزيارة' })
  }
}
