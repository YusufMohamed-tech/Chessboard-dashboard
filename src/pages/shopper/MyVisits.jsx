import { Building2, CalendarDays } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../components/DataState'
import StatusBadge from '../../components/StatusBadge'

export default function MyVisits() {
  const { myVisits, dataLoading, dataError } = useOutletContext()

  if (dataLoading) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} />

  const pending = myVisits.filter((v) => v.status !== 'مكتملة' && v.status !== 'جاري المسح')
  if (pending.length === 0) return <EmptyState icon={CalendarDays} message="لا توجد زيارات نشطة لك حالياً" />

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <h2 className="font-display text-2xl font-black text-cb-gray-900">الزيارات المخصصة</h2>
        <p className="text-sm text-cb-gray-500">الزيارات المسندة إليك والتي تحتاج تنفيذاً</p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pending.map((v) => (
          <Link key={v.id} to={`/shopper/visits/${v.id}`}
            className="block rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm card-hover">
            <div className="flex items-center justify-between">
              <StatusBadge status={v.status} />
              <span className="text-xs text-cb-gray-500">{v.date}</span>
            </div>
            <div className="mt-3">
              <h3 className="flex items-center gap-2 font-black text-cb-gray-900">
                <Building2 className="h-4 w-4 text-cb-lime" />
                {v.officeName}
              </h3>
              <p className="mt-1 text-sm text-cb-gray-500">{v.type} • {v.city}</p>
            </div>
            <div className="mt-3 rounded-xl bg-cb-gray-50 p-3 text-sm text-cb-gray-600 line-clamp-2">
              {v.scenario || 'بدون سيناريو'}
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
