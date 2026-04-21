import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search, X, Check } from 'lucide-react'

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'اختر...',
  icon: Icon,
  searchable = false,
  className = ''
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  const selectedOption = useMemo(() => {
    return options.find(o => o.value === value) || null
  }, [options, value])

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options
    const q = query.toLowerCase()
    return options.filter(o => o.label.toLowerCase().includes(q))
  }, [options, query, searchable])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(!open); if (searchable) setTimeout(() => inputRef.current?.focus(), 100) }}
        className={`flex items-center justify-between w-full h-11 rounded-xl border bg-white px-3 text-sm transition ${
          open ? 'border-cb-lime ring-2 ring-cb-lime-200' : 'border-cb-gray-300'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 text-cb-gray-400 shrink-0" />}
          {selectedOption ? (
            <span className="font-semibold text-cb-gray-800 truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-cb-gray-400">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && (
            <span
              onClick={handleClear}
              className="rounded-full p-0.5 text-cb-gray-400 hover:text-cb-gray-600 hover:bg-cb-gray-100"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-cb-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1 w-full z-50 rounded-xl border border-cb-gray-200 bg-white shadow-xl animate-fade-in max-h-[300px] overflow-hidden flex flex-col">
          {searchable && (
            <div className="p-2 border-b border-cb-gray-200">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cb-gray-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث..."
                  className="h-9 w-full rounded-lg border border-cb-gray-200 bg-cb-gray-50 ps-9 pe-3 text-sm outline-none focus:border-cb-lime focus:bg-white"
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length === 0 ? (
              <p className="p-4 text-center text-sm text-cb-gray-500">لا توجد خيارات</p>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition text-start ${
                      isSelected ? 'bg-cb-lime-50 text-cb-lime font-bold' : 'text-cb-gray-700 hover:bg-cb-gray-50'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
