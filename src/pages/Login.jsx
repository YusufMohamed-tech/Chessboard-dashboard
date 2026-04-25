import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, LayoutGrid, LogIn, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [portal, setPortal] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const isShopperPortal = portal === 'shopper'
  const isManagerPortal = portal === 'manager'

  const handleSelectPortal = (nextPortal) => {
    setPortal(nextPortal)
    setEmail('')
    setPassword('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!portal || loading) return

    setError('')
    setLoading(true)

    try {
      const user = await onLogin(email, password)

      if (!user) {
        setError('بيانات الدخول غير صحيحة. يرجى المحاولة مرة أخرى.')
        return
      }

      if (isShopperPortal && user.role !== 'shopper') {
        setError('هذا الحساب ليس حساب وكيل ميداني.')
        return
      }

      if (isManagerPortal && user.role === 'shopper') {
        setError('هذا الحساب ليس حساب إداري.')
        return
      }

      if (user.role === 'superadmin') navigate('/superadmin/overview', { replace: true })
      else if (user.role === 'admin') navigate('/admin/overview', { replace: true })
      else if (user.role === 'ops') navigate('/ops/overview', { replace: true })
      else navigate('/shopper/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'بيانات الدخول غير صحيحة. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cb-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <section className="text-center animate-fade-in-up">
          <img
            src="/branding/chessboard-logo.jpeg"
            alt="Chessboard"
            className="mx-auto h-24 w-24 object-contain rounded-2xl shadow-lg"
          />
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.32] text-cb-gray-900 max-md:text-4xl max-md:leading-[1.4]">
            نظام المتحري الخفي
          </h1>
          <p className="mt-2 text-sm font-bold text-cb-lime-dark tracking-wide">المنصة الإلكترونية للتقييم الميداني</p>
          <p className="mt-3 text-lg leading-relaxed text-cb-gray-500">اختر دورك للدخول إلى النظام</p>
        </section>

        {/* Portal Selection */}
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => handleSelectPortal('shopper')}
            className={`group rounded-3xl border bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
              isShopperPortal ? 'border-cb-lime ring-2 ring-cb-lime-200' : 'border-cb-gray-200'
            }`}
          >
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-cb-gray-800 text-white shadow-sm transition group-hover:bg-cb-gray-900">
              <ClipboardCheck className="h-10 w-10" />
            </span>
            <h2 className="mt-5 text-4xl font-bold text-cb-gray-900 max-md:text-3xl">وكيل ميداني</h2>
            <p className="mt-2 text-base text-cb-gray-500">تنفيذ الزيارات وإعداد التقييمات</p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPortal('manager')}
            className={`group rounded-3xl border bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
              isManagerPortal ? 'border-cb-lime ring-2 ring-cb-lime-200' : 'border-cb-gray-200'
            }`}
          >
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-cb-lime text-white shadow-sm transition group-hover:bg-cb-lime-dark">
              <LayoutGrid className="h-10 w-10" />
            </span>
            <h2 className="mt-5 text-4xl font-bold text-cb-gray-900 max-md:text-3xl">مدير النظام</h2>
            <p className="mt-2 text-base text-cb-gray-500">إدارة المشاريع والفرق ومتابعة الأداء</p>
          </button>
        </section>

        {/* Login Form */}
        {portal && (
          <section className="mx-auto mt-6 w-full max-w-2xl rounded-3xl border border-cb-gray-200 bg-white p-6 shadow-sm animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-2xl font-bold text-cb-gray-900">تسجيل الدخول</h3>
              <span className="inline-flex items-center rounded-full border border-cb-gray-200 bg-cb-gray-50 px-3 py-1 text-sm font-bold text-cb-gray-700">
                {isShopperPortal ? 'وكيل ميداني' : 'مدير النظام'}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-cb-gray-700">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@chessboard.sa"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-cb-gray-300 bg-white px-4 text-cb-gray-800 outline-none transition focus:border-cb-lime focus:ring-2 focus:ring-cb-lime-200 disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-cb-gray-700">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-cb-gray-300 bg-white pe-12 ps-4 text-cb-gray-800 outline-none transition focus:border-cb-lime focus:ring-2 focus:ring-cb-lime-200 disabled:opacity-60"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-cb-gray-400 hover:text-cb-gray-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cb-lime text-base font-bold text-white transition hover:bg-cb-lime-dark disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    دخول المنصة
                  </>
                )}
              </button>
            </form>
          </section>
        )}

        <div className="mt-6 text-center">
          <span className="inline-flex items-center rounded-full border border-cb-gray-200 bg-white px-4 py-2 text-sm font-semibold text-cb-gray-500">
            <ShieldCheck className="me-2 h-4 w-4" />
            جميع الحقوق محفوظة — Chessboard © 2026
          </span>
        </div>
      </div>
    </div>
  )
}
