import { requireRole } from '../_lib/middleware.js'
import { supabase } from '../_lib/db.js'

export default async function handler(req, res) {
  const visitId = req.query.id
  if (!visitId) {
    return res.status(400).json({ success: false, error: 'معرف الزيارة مطلوب' })
  }

  if (req.method === 'PUT') return handleUpdate(req, res, visitId)
  if (req.method === 'DELETE') return handleDelete(req, res, visitId)
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

// PUT /api/visits/[id] — update or complete a visit
async function handleUpdate(req, res, visitId) {
  const user = await requireRole(req, res, ['superadmin', 'admin', 'ops', 'shopper'])
  if (!user) return

  try {
    const { officeName, city, type, brand, status, scenario, shopperId, visitDate, scores, notes, complete } = req.body || {}

    // If "complete" flag is set, handle visit completion
    if (complete) {
      return handleComplete(req, res, visitId, user, { scores, notes })
    }

    // Shoppers cannot edit visit metadata
    if (user.role === 'shopper') {
      return res.status(403).json({ success: false, error: 'لا يمكن للوكيل الميداني تعديل بيانات الزيارة' })
    }

    const updates = { updated_at: new Date().toISOString() }
    if (officeName !== undefined) updates.office_name = officeName
    if (city !== undefined) updates.city = city
    if (type !== undefined) updates.type = type
    if (brand !== undefined) updates.brand = brand
    if (status !== undefined) updates.status = status
    if (scenario !== undefined) updates.scenario = scenario
    if (shopperId !== undefined) updates.shopper_id = shopperId || null
    if (visitDate !== undefined) updates.visit_date = visitDate

    const { data: updated, error } = await supabase
      .from('visits')
      .update(updates)
      .eq('id', visitId)
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({ success: true, data: updated })
  } catch (err) {
    console.error('Update visit error:', err)
    return res.status(500).json({ success: false, error: 'فشل في تحديث الزيارة' })
  }
}

// Handle visit completion with scoring
async function handleComplete(req, res, visitId, user, { scores, notes }) {
  try {
    // Fetch the visit
    const { data: visit, error: fetchErr } = await supabase
      .from('visits')
      .select('*')
      .eq('id', visitId)
      .single()

    if (fetchErr || !visit) {
      return res.status(404).json({ success: false, error: 'الزيارة غير موجودة' })
    }

    // Calculate score percentage
    const ALL_KEYS = [
      'fi_q1','fi_q2','fi_q3','cm_q1','cm_q2','cm_q3',
      'pk_q1','pk_q2','pk_q3','ss_q1','ss_q2','ss_q3',
      'bc_q1','bc_q2','bc_q3'
    ]
    const answered = ALL_KEYS.reduce((sum, k) => sum + (Number(scores?.[k]) === 1 ? 1 : 0), 0)
    const pct = ALL_KEYS.length > 0 ? Math.round((answered / ALL_KEYS.length) * 100) : 0
    const pointsEarned = Math.round(pct * 1.2)

    // Update the visit
    const { data: updated, error: updateErr } = await supabase
      .from('visits')
      .update({
        status: 'مكتملة',
        scores: scores || {},
        notes: notes || '',
        points_earned: pointsEarned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', visitId)
      .select()
      .single()

    if (updateErr) throw updateErr

    // Update shopper stats
    if (visit.shopper_id) {
      const { data: shopper } = await supabase
        .from('profiles')
        .select('visits_completed, points')
        .eq('id', visit.shopper_id)
        .single()

      if (shopper) {
        await supabase
          .from('profiles')
          .update({
            visits_completed: (shopper.visits_completed || 0) + 1,
            points: (shopper.points || 0) + pointsEarned,
          })
          .eq('id', visit.shopper_id)
      }
    }

    // Generate issues based on score
    if (pct < 80) {
      const severity = pct < 40 ? 'خطيرة' : pct < 60 ? 'متوسطة' : 'بسيطة'
      const weakKeys = ALL_KEYS.filter(k => Number(scores?.[k]) === 0)
      const desc = weakKeys.length > 0
        ? `تم رصد ${weakKeys.length} نقطة ضعف (${pct}% فقط).`
        : `النتيجة العامة ${pct}% تحتاج تحسين.`

      // Remove old issues for this visit
      await supabase.from('issues').delete().eq('visit_id', visitId)

      await supabase.from('issues').insert({
        visit_id: visitId,
        severity,
        description: desc,
      })
    }

    // Create notification
    await supabase.from('notifications').insert({
      recipient_role: 'superadmin',
      title: 'تم إكمال زيارة',
      description: `تم إكمال الزيارة بنجاح (${visit.office_name} - ${visit.city}) — النتيجة: ${pct}%`,
      event_type: 'visit_completed',
      visit_id: visitId,
    })

    return res.status(200).json({ success: true, data: updated, pointsEarned })
  } catch (err) {
    console.error('Complete visit error:', err)
    return res.status(500).json({ success: false, error: 'فشل في إكمال الزيارة' })
  }
}

// DELETE /api/visits/[id]
async function handleDelete(req, res, visitId) {
  const user = await requireRole(req, res, ['superadmin', 'admin', 'ops'])
  if (!user) return

  try {
    // Ops can only request deletion (soft)
    if (user.role === 'ops') {
      const { data: visit } = await supabase
        .from('visits')
        .select('status')
        .eq('id', visitId)
        .single()

      if (visit && visit.status !== 'جاري المسح') {
        await supabase
          .from('visits')
          .update({ status: 'جاري المسح', updated_at: new Date().toISOString() })
          .eq('id', visitId)
        return res.status(200).json({ success: true, requested: true })
      }
    }

    // Hard delete (cascades issues)
    const { error } = await supabase.from('visits').delete().eq('id', visitId)
    if (error) throw error

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Delete visit error:', err)
    return res.status(500).json({ success: false, error: 'فشل في حذف الزيارة' })
  }
}
