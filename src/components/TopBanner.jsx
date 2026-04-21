import { useEffect, useState } from 'react'

const TAGLINE_WORDS = ['WHERE', 'WHY']

export default function TopBanner() {
  const [activeWord, setActiveWord] = useState(0)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWord((prev) => (prev + 1) % TAGLINE_WORDS.length)
      setPulse(true)
      setTimeout(() => setPulse(false), 600)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative z-50 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 40%, #1a1a1a 100%)' }}>
      {/* Animated particles — full width */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 16 }).map((_, i) => {
          const sizes = [6, 9, 7, 11, 5, 10, 8, 12, 6, 9, 10, 5, 11, 7, 8, 6]
          const lefts = [2, 8, 15, 22, 30, 37, 44, 51, 58, 65, 72, 78, 84, 90, 95, 5]
          const tops = [18, 55, 35, 70, 25, 60, 15, 45, 72, 30, 50, 20, 65, 40, 58, 75]
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${sizes[i]}px`,
                height: `${sizes[i]}px`,
                background: `rgba(168, 201, 58, ${0.35 + (i % 5) * 0.06})`,
                left: `${lefts[i]}%`,
                top: `${tops[i]}%`,
                animation: `float ${2.5 + (i % 4) * 0.8}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.25}s`,
              }}
            />
          )
        })}
      </div>

      {/* Moving gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #a8c93a, transparent)', animation: 'shimmer 3s ease-in-out infinite' }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 px-4 py-4" dir="ltr">
        {/* Logo with glow */}
        <div className="relative group">
          <div className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle, rgba(168,201,58,0.2), transparent 70%)' }} />
          <div className="relative bg-white rounded-2xl p-2.5 shadow-lg border border-white/10" style={{ boxShadow: '0 0 20px rgba(168,201,58,0.1), 0 4px 12px rgba(0,0,0,0.3)' }}>
            <img
              src="/branding/chessboard-logo.png"
              alt="Chessboard"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>
        </div>

        {/* Divider with pulse */}
        <div className="hidden sm:flex flex-col items-center gap-1">
          <div className={`w-px h-3 rounded-full transition-all duration-500 ${pulse ? 'bg-cb-lime h-4' : 'bg-white/20'}`} />
          <div className="w-1.5 h-1.5 rounded-full bg-cb-lime animate-pulse-lime" />
          <div className={`w-px h-3 rounded-full transition-all duration-500 ${pulse ? 'bg-cb-lime h-4' : 'bg-white/20'}`} />
        </div>

        {/* Text content */}
        <div className="text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase" style={{ background: 'rgba(168,201,58,0.15)', color: '#a8c93a', border: '1px solid rgba(168,201,58,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-cb-lime animate-pulse-lime" />
              Mystery Shopper Platform
            </span>
          </div>

          <p className="mt-2 text-sm font-bold text-white/90 tracking-wide">
            Numbers show{' '}
            <span
              className={`inline-block transition-all duration-500 font-black ${
                activeWord === 0 ? 'text-cb-lime scale-110' : 'text-white/60 scale-100'
              }`}
              style={activeWord === 0 ? { textShadow: '0 0 12px rgba(168,201,58,0.5)' } : {}}
            >
              WHERE
            </span>
            , Mystery Shopping shows{' '}
            <span
              className={`inline-block transition-all duration-500 font-black ${
                activeWord === 1 ? 'text-cb-lime scale-110' : 'text-white/60 scale-100'
              }`}
              style={activeWord === 1 ? { textShadow: '0 0 12px rgba(168,201,58,0.5)' } : {}}
            >
              WHY
            </span>
          </p>
        </div>

        {/* Live indicator */}
        <div className="hidden lg:flex items-center gap-3 ms-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: 'rgba(168,201,58,0.1)', border: '1px solid rgba(168,201,58,0.2)', color: '#a8c93a' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cb-lime opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cb-lime" />
            </span>
            LIVE
          </div>
        </div>
      </div>
    </div>
  )
}
