export default function PointsBadge({ points, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-cb-lime-200 bg-cb-lime-50 px-3 py-1 text-xs font-black text-cb-lime-700 ${className}`}
    >
      {Number(points ?? 0).toLocaleString('en-US')} نقطة
    </span>
  )
}
