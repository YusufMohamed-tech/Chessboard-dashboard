import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-cb-gray-50 px-4">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100">
              <svg className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-cb-gray-900">حدث خطأ غير متوقع</h2>
            <p className="mt-2 text-sm text-cb-gray-500">نعتذر عن هذا الخطأ. يرجى تحديث الصفحة أو العودة للرئيسية.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-cb-lime px-4 py-2 text-sm font-bold text-white transition hover:bg-cb-lime-dark"
              >
                تحديث الصفحة
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
                className="rounded-xl border border-cb-gray-300 px-4 py-2 text-sm font-bold text-cb-gray-700 transition hover:bg-cb-gray-100"
              >
                الرئيسية
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
