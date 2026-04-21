export default function ReportHeader({ title }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-cb-gray-200 bg-white p-4 shadow-sm">
      <img src="/branding/chessboard-logo.jpeg" alt="Chessboard" className="h-10 object-contain" />
      <div>
        <h2 className="font-display text-lg font-black text-cb-gray-900">{title}</h2>
        <p className="text-xs text-cb-gray-500">Chessboard Mystery Shopper Program</p>
      </div>
    </div>
  )
}
