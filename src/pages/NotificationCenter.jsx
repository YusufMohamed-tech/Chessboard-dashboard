import { Bell, BellOff, Check, CheckCheck } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/DataState'

const eventTypeLabels = {
  visit_created: 'زيارة جديدة',
  visit_completed: 'زيارة مكتملة',
  visit_assigned: 'إسناد زيارة',
  visit_delete_requested: 'طلب حذف',
  issue_detected: 'تحدي مرصود',
}

const eventTypeStyles = {
  visit_created: 'bg-sky-100 text-sky-700 border-sky-200',
  visit_completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  visit_assigned: 'bg-cb-lime-100 text-cb-lime-700 border-cb-lime-200',
  visit_delete_requested: 'bg-rose-100 text-rose-700 border-rose-200',
  issue_detected: 'bg-amber-100 text-amber-700 border-amber-200',
}

function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  return `منذ ${days} يوم`
}

export default function NotificationCenter() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, dataLoading, dataError } = useOutletContext()

  if (dataLoading) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} />
  if (!notifications || notifications.length === 0) return <EmptyState icon={BellOff} message="لا توجد إشعارات" />

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-black text-cb-gray-900">مركز الإشعارات</h2>
            <p className="text-sm text-cb-gray-500">{unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}</p>
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllNotificationsAsRead}
              className="inline-flex items-center gap-2 rounded-xl bg-cb-lime px-4 py-2 text-sm font-bold text-white transition hover:bg-cb-lime-dark">
              <CheckCheck className="h-4 w-4" />
              تعيين الكل كمقروء
            </button>
          )}
        </div>
      </section>

      <section className="space-y-2">
        {notifications.map((n) => (
          <article
            key={n.id}
            className={`rounded-xl border p-4 shadow-sm transition ${
              n.isRead ? 'border-cb-gray-200 bg-white' : 'border-cb-lime-200 bg-cb-lime-50'
            }`}
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className={`mt-0.5 rounded-full p-1.5 ${n.isRead ? 'bg-cb-gray-200 text-cb-gray-500' : 'bg-cb-lime text-white'}`}>
                <Bell className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`font-bold ${n.isRead ? 'text-cb-gray-700' : 'text-cb-gray-900'}`}>{n.title}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${eventTypeStyles[n.eventType] ?? 'bg-cb-gray-100 text-cb-gray-600 border-cb-gray-200'}`}>
                    {eventTypeLabels[n.eventType] ?? n.eventType}
                  </span>
                </div>
                <p className="mt-1 text-sm text-cb-gray-500">{n.description}</p>
                <p className="mt-2 text-xs text-cb-gray-400">{formatRelativeTime(n.createdAt)}</p>
              </div>

              {!n.isRead && (
                <button type="button" onClick={() => markNotificationAsRead(n.id)}
                  className="rounded-lg border border-cb-gray-300 p-1.5 text-cb-gray-600 hover:bg-cb-gray-100 transition" title="تعيين كمقروء">
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
