import { verifyPassword, signToken } from '../_lib/auth.js'
import { supabase } from '../_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'البريد وكلمة المرور مطلوبان' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' })
    }

    if (user.status !== 'active') {
      return res.status(401).json({ success: false, error: 'الحساب غير مفعّل. تواصل مع المسؤول.' })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' })
    }

    const token = signToken({ sub: user.id, email: user.email, role: user.role })

    // Return user profile without password_hash
    const { password_hash, ...profile } = user

    return res.status(200).json({ success: true, token, user: profile })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ success: false, error: 'حدث خطأ في الخادم' })
  }
}
