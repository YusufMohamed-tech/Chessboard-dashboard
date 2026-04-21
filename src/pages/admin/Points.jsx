import { Activity } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { EmptyState } from '../../components/DataState'
import PointsBadge from '../../components/PointsBadge'
import Avatar from '../../components/Avatar'

export default function Points() {
  const { shoppers } = useOutletContext()

  const sorted = [...shoppers].sort((a, b) => b.points - a.points)
  if (sorted.length === 0) return <EmptyState icon={Activity} message="لا توجد بيانات نقاط" />

  const totalPoints = sorted.reduce((s, sh) => s + sh.points, 0)

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <h2 className="font-display text-2xl font-black text-cb-gray-900">إدارة النقاط</h2>
        <p className="text-sm text-cb-gray-500">نظام المكافآت والحوافز للوكلاء الميدانيين</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-cb-lime-50 border border-cb-lime-200 p-4 text-center">
            <p className="text-sm text-cb-lime-700">إجمالي النقاط</p>
            <p className="text-3xl font-black text-cb-lime-800">{totalPoints.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-cb-gray-50 border border-cb-gray-200 p-4 text-center">
            <p className="text-sm text-cb-gray-600">عدد الوكلاء</p>
            <p className="text-3xl font-black text-cb-gray-900">{sorted.length}</p>
          </div>
          <div className="rounded-xl bg-cb-gray-50 border border-cb-gray-200 p-4 text-center">
            <p className="text-sm text-cb-gray-600">متوسط النقاط</p>
            <p className="text-3xl font-black text-cb-gray-900">{sorted.length ? Math.round(totalPoints / sorted.length) : 0}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <h3 className="font-display text-xl font-black text-cb-gray-900 mb-4">ترتيب الوكلاء حسب النقاط</h3>
        <div className="space-y-3">
          {sorted.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-cb-gray-200 bg-cb-gray-50 p-3 card-hover">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white ${i < 3 ? 'bg-cb-lime' : 'bg-cb-gray-500'}`}>
                #{i + 1}
              </div>
              <Avatar name={s.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-cb-gray-900 truncate">{s.name}</p>
                <p className="text-xs text-cb-gray-500">{s.city} • {s.visits} زيارات</p>
              </div>
              <PointsBadge points={s.points} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
