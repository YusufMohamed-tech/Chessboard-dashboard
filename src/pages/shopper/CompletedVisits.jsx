import { Building2, CalendarDays } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../components/DataState'
import PointsBadge from '../../components/PointsBadge'
import { calculateWeightedScore, getScoreClasses } from '../../utils/scoring'

export default function CompletedVisits() {
  const { myVisits, dataLoading, dataError } = useOutletContext()

  if (dataLoading) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} />

  const completed = myVisits.filter((v) => v.status === 'مكتملة')
  if (completed.length === 0) return <EmptyState icon={CalendarDays} message="لم تكمل أي زيارة بعد" />

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <h2 className="font-display text-2xl font-black text-cb-gray-900">الزيارات المكتملة</h2>
        <p className="text-sm text-cb-gray-500">سجل الزيارات التي أتممتها</p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {completed.map((v) => {
          const score = calculateWeightedScore(v.scores)
          return (
            <Link key={v.id} to={`/shopper/completed/${v.id}`}
              className="block rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm card-hover">
              <div className="flex items-center justify-between">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getScoreClasses(score)}`}>
                  {score.toFixed(2)} / 5
                </span>
                <PointsBadge points={v.pointsEarned} />
              </div>
              <div className="mt-3">
                <h3 className="flex items-center gap-2 font-black text-cb-gray-900">
                  <Building2 className="h-4 w-4 text-cb-lime" />
                  {v.officeName}
                </h3>
                <p className="mt-1 text-sm text-cb-gray-500">{v.type} • {v.city} • {v.date}</p>
              </div>
              {v.notes && (
                <div className="mt-3 rounded-xl bg-cb-gray-50 p-3 text-sm text-cb-gray-600 line-clamp-2">{v.notes}</div>
              )}
            </Link>
          )
        })}
      </section>
    </div>
  )
}
