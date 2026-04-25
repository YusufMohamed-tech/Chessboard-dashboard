import { authenticate } from '../_lib/middleware.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const user = await authenticate(req)

    if (!user) {
      return res.status(401).json({ success: false, error: 'جلسة غير صالحة' })
    }

    const { password_hash, ...profile } = user

    return res.status(200).json({ success: true, user: profile })
  } catch (err) {
    console.error('Session error:', err)
    return res.status(500).json({ success: false, error: 'حدث خطأ في الخادم' })
  }
}
