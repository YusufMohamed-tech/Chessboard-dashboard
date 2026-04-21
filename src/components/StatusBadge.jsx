const statusClasses = {
  مكتملة: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  قادمة: 'bg-amber-100 text-amber-700 border-amber-200',
  معلقة: 'bg-cb-gray-100 text-cb-gray-700 border-cb-gray-300',
  'قيد الانتظار': 'bg-cb-gray-100 text-cb-gray-700 border-cb-gray-300',
  'جاري المسح': 'bg-rose-100 text-rose-700 border-rose-200',
}

const statusLabels = {
  معلقة: 'زيارة جديدة',
  قادمة: 'إعادة الزيارة',
}

export default function StatusBadge({ status }) {
  const statusText = statusLabels[status] ?? status

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${statusClasses[status] ?? 'bg-cb-gray-100 text-cb-gray-700 border-cb-gray-200'}`}
    >
      {statusText}
    </span>
  )
}
