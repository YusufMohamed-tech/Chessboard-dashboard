import { ArrowRight, CheckCircle2, Info, Square, SquareCheckBig } from 'lucide-react'
import { useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/DataState'
import PointsBadge from '../../components/PointsBadge'
import StatusBadge from '../../components/StatusBadge'
import {
  EVALUATION_CATEGORIES,
  calculateRawScore,
  calculatePercentage,
  makeEmptyScores,
  makeEmptyNotes,
  getPercentageClasses,
  TOTAL_QUESTIONS,
} from '../../utils/scoring'

export default function VisitDetail({ fromCompleted = false }) {
  const { visitId } = useParams()
  const { myVisits, completeVisit, dataLoading, dataError } = useOutletContext()

  const visit = myVisits.find((v) => v.id === visitId)
  const isCompleted = visit?.status === 'مكتملة'
  const backPath = fromCompleted ? '/shopper/completed' : '/shopper/visits'

  const [scores, setScores] = useState(() => {
    if (isCompleted && visit.scores && Object.keys(visit.scores).length > 0) return { ...visit.scores }
    return makeEmptyScores()
  })

  const [categoryNotes, setCategoryNotes] = useState(() => {
    if (isCompleted && visit.categoryNotes) return { ...visit.categoryNotes }
    return makeEmptyNotes()
  })

  const [generalNotes, setGeneralNotes] = useState(visit?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (dataLoading) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} />
  if (!visit) return <ErrorState message="الزيارة غير موجودة" />

  const rawScore = calculateRawScore(scores)
  const percentage = calculatePercentage(scores)

  const toggleQuestion = (questionKey) => {
    if (isCompleted) return
    setScores((prev) => ({ ...prev, [questionKey]: prev[questionKey] === 1 ? 0 : 1 }))
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await completeVisit(visit.id, { scores, notes: generalNotes, categoryNotes })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <CheckCircle2 className="mx-auto h-16 w-16 text-cb-lime" />
          <h2 className="mt-4 font-display text-2xl font-black text-cb-gray-900">تم إرسال التقييم بنجاح!</h2>
          <p className="mt-2 text-cb-gray-500">النتيجة: {rawScore} / {TOTAL_QUESTIONS} ({percentage}%)</p>
          <p className="mt-1 text-cb-gray-500">شكراً لإتمام التقييم. تم إضافة النقاط إلى رصيدك.</p>
          <Link to={backPath} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cb-lime px-6 py-3 text-sm font-bold text-white transition hover:bg-cb-lime-dark">
            <ArrowRight className="h-4 w-4" /> العودة للزيارات
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to={backPath} className="inline-flex items-center gap-2 text-sm font-bold text-cb-gray-600 transition hover:text-cb-gray-900">
        <ArrowRight className="h-4 w-4" /> العودة
      </Link>

      {/* Visit info */}
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-black text-cb-gray-900">{visit.officeName}</h2>
            <p className="text-sm text-cb-gray-500">{visit.type} • {visit.city} • {visit.date} • {visit.time}</p>
          </div>
          <StatusBadge status={visit.status} />
        </div>
        {visit.scenario && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-cb-gray-50 p-3 text-sm text-cb-gray-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-cb-gray-400" />
            {visit.scenario}
          </div>
        )}
      </section>

      {/* Score summary */}
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl font-black text-cb-gray-900">📊 نتيجة التقييم</h3>
          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-4 py-1.5 text-sm font-black ${getPercentageClasses(percentage)}`}>
              {percentage}%
            </span>
            <span className="rounded-full border border-cb-gray-200 bg-cb-gray-50 px-4 py-1.5 text-sm font-black text-cb-gray-700">
              {rawScore} / {TOTAL_QUESTIONS}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-cb-gray-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </section>

      {/* Categories with questions */}
      {EVALUATION_CATEGORIES.map((cat) => {
        const catScore = cat.questions.reduce((s, q) => s + (scores[q.key] === 1 ? 1 : 0), 0)
        const catTotal = cat.questions.length
        return (
          <section key={cat.key} className="rounded-xl border border-cb-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Category header */}
            <div className="flex items-center justify-between gap-3 border-b border-cb-gray-200 bg-cb-gray-50 px-4 py-3">
              <h3 className="font-display text-lg font-black text-cb-gray-900">
                <span className="me-2">{cat.emoji}</span>
                {cat.label}
              </h3>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${catScore === catTotal ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : catScore > 0 ? 'border-amber-200 bg-amber-100 text-amber-700' : 'border-cb-gray-200 bg-cb-gray-100 text-cb-gray-500'}`}>
                {catScore} / {catTotal}
              </span>
            </div>

            {/* Questions */}
            <div className="p-4 space-y-2">
              {cat.questions.map((q) => {
                const checked = scores[q.key] === 1
                return (
                  <button
                    key={q.key}
                    type="button"
                    onClick={() => toggleQuestion(q.key)}
                    disabled={isCompleted}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-start text-sm transition ${
                      checked
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-cb-gray-200 bg-white text-cb-gray-700 hover:bg-cb-gray-50'
                    } ${isCompleted ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {checked ? (
                      <SquareCheckBig className="h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <Square className="h-5 w-5 shrink-0 text-cb-gray-400" />
                    )}
                    <span className="font-semibold">{q.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Category notes text box */}
            <div className="border-t border-cb-gray-200 bg-cb-gray-50 p-4">
              <label className="text-xs font-bold text-cb-gray-600">تفاصيل / ملاحظات - {cat.label}</label>
              {isCompleted ? (
                <p className="mt-1 rounded-lg bg-white p-2.5 text-sm text-cb-gray-600 border border-cb-gray-200 min-h-[40px]">
                  {categoryNotes[cat.key] || 'لا توجد تفاصيل'}
                </p>
              ) : (
                <textarea
                  value={categoryNotes[cat.key] || ''}
                  onChange={(e) => setCategoryNotes((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                  rows={2}
                  placeholder={`اكتب تفاصيل عن ${cat.label}...`}
                  className="mt-1 w-full rounded-lg border border-cb-gray-300 bg-white p-2.5 text-sm outline-none focus:border-cb-lime focus:ring-2 focus:ring-cb-lime-200"
                />
              )}
            </div>
          </section>
        )
      })}

      {/* General notes */}
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <h3 className="font-display text-xl font-black text-cb-gray-900 mb-3">📝 ملاحظات عامة</h3>
        {isCompleted ? (
          <p className="rounded-xl bg-cb-gray-50 p-3 text-sm text-cb-gray-600">{visit.notes || 'لا توجد ملاحظات'}</p>
        ) : (
          <textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} rows={4} placeholder="اكتب ملاحظاتك العامة عن الزيارة..."
            className="w-full rounded-xl border border-cb-gray-300 bg-white p-3 text-sm outline-none focus:border-cb-lime focus:ring-2 focus:ring-cb-lime-200" />
        )}
      </section>

      {/* Points if completed */}
      {isCompleted && visit.pointsEarned > 0 && (
        <div className="flex justify-center">
          <PointsBadge points={visit.pointsEarned} className="text-base px-4 py-2" />
        </div>
      )}

      {/* Submit */}
      {!isCompleted && (
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="w-full h-12 rounded-xl bg-cb-lime text-base font-bold text-white transition hover:bg-cb-lime-dark disabled:opacity-60">
          {submitting ? 'جاري الإرسال...' : `إرسال التقييم (${rawScore}/${TOTAL_QUESTIONS} — ${percentage}%)`}
        </button>
      )}
    </div>
  )
}
