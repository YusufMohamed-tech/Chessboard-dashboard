import { BarChart3 } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../components/DataState'
import { calculateWeightedScore, getScoreClasses } from '../../utils/scoring'

export default function ShopperReports() {
  const { myVisits, user, dataLoading, dataError } = useOutletContext()

  if (dataLoading) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} />

  const completed = myVisits.filter((v) => v.status === 'مكتملة')
  if (completed.length === 0) return <EmptyState icon={BarChart3} message="لا توجد بيانات للتقارير بعد" />

  const totalPoints = completed.reduce((s, v) => s + (v.pointsEarned ?? 0), 0)
  const avgScore = completed.reduce((s, v) => s + calculateWeightedScore(v.scores), 0) / completed.length
  const issuesCount = myVisits.reduce((s, v) => s + (v.issues?.length ?? 0), 0)

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <h2 className="font-display text-2xl font-black text-cb-gray-900">تقرير أدائي</h2>
        <p className="text-sm text-cb-gray-500">ملخص أدائك في برنامج المتحري الخفي</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-cb-gray-200 bg-white p-4">
          <p className="text-sm text-cb-gray-500">الزيارات المكتملة</p>
          <p className="mt-2 text-3xl font-black text-cb-gray-900">{completed.length}</p>
        </div>
        <div className="rounded-xl border border-cb-lime-200 bg-cb-lime-50 p-4">
          <p className="text-sm text-cb-lime-700">النقاط المكتسبة</p>
          <p className="mt-2 text-3xl font-black text-cb-lime-800">{totalPoints}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">متوسط التقييم</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">{avgScore.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">التحديات</p>
          <p className="mt-2 text-3xl font-black text-rose-800">{issuesCount}</p>
        </div>
      </section>

      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <h3 className="font-display text-xl font-black text-cb-gray-900 mb-4">سجل الزيارات</h3>
        <div className="space-y-3">
          {completed.map((v) => {
            const sc = calculateWeightedScore(v.scores)
            return (
              <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cb-gray-200 bg-cb-gray-50 p-3">
                <div>
                  <p className="font-bold text-cb-gray-900">{v.officeName}</p>
                  <p className="text-xs text-cb-gray-500">{v.city} • {v.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${getScoreClasses(sc)}`}>{sc.toFixed(2)}</span>
                  <span className="text-sm font-bold text-cb-lime-700">{v.pointsEarned} نقطة</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
