export default function Footer() {
  return (
    <footer className="mt-6 rounded-2xl border border-cb-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col items-center justify-center gap-1 md:flex-row md:gap-3">
        <img src="/branding/chessboard-logo.jpeg" alt="Chessboard" className="h-6 object-contain opacity-60" />
        <p className="text-center text-sm text-cb-gray-500">
          All Rights Reserved — Chessboard © 2026
        </p>
      </div>
    </footer>
  )
}
