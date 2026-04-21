import { Star } from 'lucide-react'

export default function StarRating({ value = 0, max = 5, onChange, readOnly = false }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className="inline-flex gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`transition ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            className={`h-5 w-5 ${
              star <= value
                ? 'fill-cb-lime text-cb-lime'
                : 'fill-cb-gray-200 text-cb-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  )
}
