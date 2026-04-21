export default function ScoreBar({ value, max = 100, showValue = true, className = '' }) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0

  return (
    <div className={className}>
      <div className="h-2.5 overflow-hidden rounded-full bg-cb-gray-200">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #a8c93a, #8fb02e)',
          }}
        />
      </div>
      {showValue && (
        <p className="mt-1 text-xs font-semibold text-cb-gray-500">{percentage}%</p>
      )}
    </div>
  )
}
