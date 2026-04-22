import { Search, X, MapPin, Building2, Tag } from 'lucide-react'
import { useMemo, useRef, useState, useEffect } from 'react'

export default function LocationPicker({ locations = [], value, onChange, placeholder = 'اختر الموقع...' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  const selected = useMemo(() => {
    if (!value) return null
    return locations.find((l) => l.name === value.name && l.city === value.city && l.brand === value.brand) ?? value
  }, [locations, value])

  const filtered = useMemo(() => {
    if (!query.trim()) return locations
    const q = query.toLowerCase()
    return locations.filter((l) =>
      `${l.name} ${l.city} ${l.brand} ${l.region} ${l.project}`.toLowerCase().includes(q)
    )
  }, [locations, query])

  const grouped = useMemo(() => {
    const map = new Map()
    filtered.forEach((l) => {
      const key = l.city || 'أخرى'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(l)
    })
    return map
  }, [filtered])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (location) => {
    onChange?.(location)
    setOpen(false)
    setQuery('')
  }

  const handleClear = () => {
    onChange?.(null)
    setQuery('')
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 100) }}
        className={`flex items-center justify-between w-full h-11 rounded-xl border bg-white px-3 text-sm transition ${
          open ? 'border-cb-lime ring-2 ring-cb-lime-200' : 'border-cb-gray-300'
        }`}
      >
        {selected ? (
          <span className="flex items-center gap-2 text-cb-gray-800 truncate">
            <MapPin className="h-3.5 w-3.5 text-cb-lime shrink-0" />
            <span className="font-bold truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-cb-gray-400">{placeholder}</span>
        )}
        <div className="flex items-center gap-1">
          {selected && (
            <span onClick={(e) => { e.stopPropagation(); handleClear() }} className="rounded-full p-0.5 text-cb-gray-400 hover:text-cb-gray-600 hover:bg-cb-gray-100">
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <Search className="h-3.5 w-3.5 text-cb-gray-400" />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1 w-full z-50 rounded-xl border border-cb-gray-200 bg-white shadow-xl animate-fade-in max-h-[360px] overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-cb-gray-200">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cb-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالاسم أو المدينة أو البراند..."
                className="h-9 w-full rounded-lg border border-cb-gray-200 bg-cb-gray-50 ps-9 pe-3 text-sm outline-none focus:border-cb-lime focus:bg-white"
              />
            </div>
          </div>

          {/* Results */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="p-4 text-center text-sm text-cb-gray-500">لا توجد نتائج مطابقة</p>
            ) : (
              Array.from(grouped.entries()).map(([city, items]) => (
                <div key={city}>
                  {grouped.size > 1 && (
                    <div className="sticky top-0 z-10 bg-cb-gray-50 border-b border-cb-gray-100 px-3 py-1.5 text-xs font-black text-cb-gray-600 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-cb-lime" />
                      {city}
                      <span className="text-cb-gray-400 font-semibold">({items.length})</span>
                    </div>
                  )}
                  {items.map((loc, i) => (
                    <button
                      key={`${loc.name}-${loc.brand}-${i}`}
                      type="button"
                      onClick={() => handleSelect(loc)}
                      className={`w-full text-start px-3 py-2.5 text-sm transition hover:bg-cb-lime-50 ${
                        selected?.name === loc.name && selected?.city === loc.city ? 'bg-cb-lime-50 border-s-2 border-cb-lime' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cb-gray-800 truncate">{loc.name}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-cb-gray-500">
                        {loc.brand}
                        <span className="text-cb-gray-300">•</span>
                        {loc.project}
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-cb-gray-200 bg-cb-gray-50 px-3 py-1.5 text-xs text-cb-gray-400 text-center">
            {filtered.length} موقع متاح
          </div>
        </div>
      )}
    </div>
  )
}
