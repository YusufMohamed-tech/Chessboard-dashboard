import { BarChart3, CheckCircle2, ShieldCheck, Users2 } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/DataState'
import useDashboardStats from '../../hooks/useDashboardStats'

export default function SuperAdminOverview() {
  const { shoppers, visits, issues, superAdmins, opsAdmins, subAdmins, dataLoading, dataError } = useOutletContext()
  const stats = useDashboardStats({ shoppers, visits, issues })

  if (dataLoading) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} />

  const totalAdmins = (superAdmins?.length ?? 0) + (opsAdmins?.length ?? 0) + (subAdmins?.length ?? 0)
  const completedVisits = visits.filter((v) => v.status === 'مكتملة')
  const todayDate = new Date().toISOString().slice(0, 10)
  const visitsToday = visits.filter((v) => v.date === todayDate).length

  return (
    <div className="space-y-4">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl p-6 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 40%, #a8c93a 100%)' }}>
        <div className="absolute -start-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -end-12 -bottom-16 h-48 w-48 rounded-full bg-cb-lime/20 blur-2xl" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-black">لوحة تحكم الإدارة العليا</h2>
              <p className="text-sm text-white/85">نظرة شاملة على جميع العمليات — Chessboard</p>
            </div>
            <div className="ms-auto inline-flex items-center rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold">
              <CheckCircle2 className="me-2 h-4 w-4" />
              جميع الأنظمة تعمل
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs text-white/80">إجمالي الزيارات</p>
              <p className="mt-1 text-xl font-black">{stats.totalVisits}</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs text-white/80">مكتملة</p>
              <p className="mt-1 text-xl font-black">{stats.completedVisits}</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs text-white/80">زيارات اليوم</p>
              <p className="mt-1 text-xl font-black">{visitsToday}</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs text-white/80">معدل الإنجاز</p>
              <p className="mt-1 text-xl font-black">{stats.completionRate}%</p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
              <p className="text-xs text-white/80">التحديات</p>
              <p className="mt-1 text-xl font-black">{stats.issuesTotal}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team + Performance */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm card-hover">
          <div className="flex items-center gap-2 text-cb-gray-600">
            <ShieldCheck className="h-5 w-5" />
            <p className="text-sm font-semibold">المديرون</p>
          </div>
          <p className="mt-2 text-3xl font-black text-cb-gray-900">{totalAdmins}</p>
          <div className="mt-2 space-y-1 text-xs text-cb-gray-500">
            <p>سوبر أدمن: {superAdmins?.length ?? 0}</p>
            <p>مديرين: {subAdmins?.length ?? 0}</p>
            <p>عمليات: {opsAdmins?.length ?? 0}</p>
          </div>
        </article>

        <article className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm card-hover">
          <div className="flex items-center gap-2 text-cb-gray-600">
            <Users2 className="h-5 w-5" />
            <p className="text-sm font-semibold">الوكلاء الميدانيون</p>
          </div>
          <p className="mt-2 text-3xl font-black text-cb-gray-900">{shoppers.length}</p>
          <p className="mt-2 text-xs text-cb-gray-500">
            نشط: {shoppers.filter((s) => s.status === 'نشط').length} — غير نشط: {shoppers.filter((s) => s.status !== 'نشط').length}
          </p>
        </article>

        <article className="rounded-xl border border-cb-lime-200 bg-cb-lime-50 p-4 shadow-sm card-hover">
          <div className="flex items-center gap-2 text-cb-lime-700">
            <BarChart3 className="h-5 w-5" />
            <p className="text-sm font-semibold">معدل التقييم</p>
          </div>
          <p className="mt-2 text-3xl font-black text-cb-lime-800">{stats.avgRating.toFixed(2)} / 5</p>
          <p className="mt-2 text-xs text-cb-lime-700">من {stats.completedVisits} زيارة مكتملة</p>
        </article>

        <article className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm card-hover">
          <div className="flex items-center gap-2 text-rose-700">
            <BarChart3 className="h-5 w-5" />
            <p className="text-sm font-semibold">التحديات المرصودة</p>
          </div>
          <p className="mt-2 text-3xl font-black text-rose-800">{stats.issuesTotal}</p>
          <div className="mt-2 text-xs text-rose-600">
            خطيرة: {stats.issuesCounts.critical} • متوسطة: {stats.issuesCounts.medium} • بسيطة: {stats.issuesCounts.simple}
          </div>
        </article>
      </section>

      {/* Points & Top Agents */}
      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
          <h3 className="font-display text-xl font-black text-cb-gray-900">توزيع النقاط</h3>
          <div className="mt-4 space-y-3">
            {[...shoppers].sort((a, b) => b.points - a.points).slice(0, 6).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-cb-gray-200 bg-cb-gray-50 p-3">
                <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white ${i < 3 ? 'bg-cb-lime' : 'bg-cb-gray-500'}`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-cb-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-cb-gray-500">{s.city}</p>
                </div>
                <span className="text-sm font-black text-cb-lime-700">{s.points} نقطة</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
          <h3 className="font-display text-xl font-black text-cb-gray-900">حالة الزيارات</h3>
          <div className="mt-4 space-y-3">
            {[
              { label: 'مكتملة', count: stats.completedVisits, color: 'bg-emerald-500' },
              { label: 'إعادة الزيارة', count: stats.upcomingVisits, color: 'bg-amber-500' },
              { label: 'زيارة جديدة', count: stats.pendingVisits, color: 'bg-cb-gray-700' },
            ].map((item) => {
              const pct = stats.totalVisits ? Math.round((item.count / stats.totalVisits) * 100) : 0
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm font-semibold text-cb-gray-600">
                    <span>{item.label}</span>
                    <span>{item.count} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-cb-gray-200">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 rounded-xl bg-cb-gray-50 p-3 text-center">
            <p className="text-sm text-cb-gray-500">إجمالي النقاط الموزعة</p>
            <p className="text-2xl font-black text-cb-lime">{stats.totalPoints.toLocaleString()}</p>
          </div>
        </article>
      </section>
    </div>
  )
}
