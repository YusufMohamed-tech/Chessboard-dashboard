export default function Avatar({ name, size = 'md' }) {
  const initial = String(name ?? '').trim().charAt(0) || '?'
  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'

  return (
    <div
      className={`${sizeClasses} inline-flex items-center justify-center rounded-full bg-cb-gray-800 font-bold text-white`}
    >
      {initial}
    </div>
  )
}
