import { LogOut, ShieldCheck } from 'lucide-react'

export default function Navbar({ title, user, onLogout, showLiveIndicator = false }) {
  const roleText =
    user?.role === 'superadmin'
      ? 'سوبر أدمن'
      : user?.role === 'admin'
        ? 'مدير'
        : user?.role === 'ops'
          ? 'عمليات'
          : 'وكيل ميداني'

  return (
    <header className="rounded-2xl border border-cb-gray-200 bg-white p-4 shadow-sm animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-xl font-black text-cb-gray-900">{title}</h1>
          <p className="text-sm text-cb-gray-500">برنامج المتحري الخفي — Chessboard</p>
        </div>

        <div className="ms-auto flex items-center gap-2">
          {showLiveIndicator && (
            <span className="inline-flex items-center rounded-full border border-cb-lime-200 bg-cb-lime-50 px-3 py-1 text-sm font-bold text-cb-lime-700">
              <span className="me-1.5 h-2 w-2 rounded-full bg-cb-lime animate-pulse-lime inline-block" />
              مباشر
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border border-cb-gray-200 bg-cb-gray-50 px-3 py-1 text-sm font-semibold text-cb-gray-700">
            <ShieldCheck className="h-4 w-4" />
            {user?.name} • {roleText}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1 rounded-xl bg-cb-gray-800 px-3 py-2 text-sm font-bold text-white transition hover:bg-cb-gray-900"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      </div>
    </header>
  )
}
