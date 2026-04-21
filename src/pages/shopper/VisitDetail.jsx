import { ArrowRight, CheckCircle2, Info } from 'lucide-react'
import { useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/DataState'
import PointsBadge from '../../components/PointsBadge'
import StarRating from '../../components/StarRating'
import StatusBadge from '../../components/StatusBadge'
import { calculateWeightedScore, getScoreClasses } from '../../utils/scoring'

const criteriaLabels = [
  { key: 'criterion1', label: 'الترحيب والاستقبال' },
  { key: 'criterion2', label: 'المعرفة بالمنتجات' },
  { key: 'criterion3', label: 'مهارات العرض والإقناع' },
  { key: 'criterion4', label: 'المظهر العام والنظافة' },
  { key: 'criterion5', label: 'سرعة الخدمة' },
  { key: 'criterion6', label: 'التعامل مع الاعتراضات' },
  { key: 'criterion7', label: 'إتمام البيع والتوديع' },
]

export default function VisitDetail({ fromCompleted = false }) {
  const { visitId } = useParams()
  const { myVisits, completeVisit, evaluationCriteria, dataLoading, dataError } = useOutletContext()

  const visit = myVisits.find((v) => v.id === visitId)
  const isCompleted = visit?.status === 'مكتملة'
  const backPath = fromCompleted ? '/shopper/completed' : '/shopper/visits'

  const [scores, setScores] = useState(() => {
    if (isCompleted && visit.scores) return { ...visit.scores }
    const initial = {}
    criteriaLabels.forEach((c) => { initial[c.key] = 0 })
    return initial
  })

  const [notes, setNotes] = useState(visit?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (dataLoading) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} />
  if (!visit) return <ErrorState message="الزيارة غير موجودة" />

  const weightedScore = calculateWeightedScore(scores)

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await completeVisit(visit.id, { scores, notes })
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
          <p className="mt-2 text-cb-gray-500">شكراً لإتمام التقييم. تم إضافة النقاط إلى رصيدك.</p>
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

      {/* Scoring */}
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl font-black text-cb-gray-900">تقييم الأداء</h3>
          <span className={`rounded-full border px-3 py-1 text-sm font-bold ${getScoreClasses(weightedScore)}`}>
            {weightedScore.toFixed(2)} / 5
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {criteriaLabels.map((c) => (
            <div key={c.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cb-gray-200 bg-cb-gray-50 p-3">
              <span className="text-sm font-bold text-cb-gray-700">{c.label}</span>
              <StarRating value={scores[c.key]} readOnly={isCompleted} onChange={(val) => setScores((prev) => ({ ...prev, [c.key]: val }))} />
            </div>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <h3 className="font-display text-xl font-black text-cb-gray-900 mb-3">ملاحظات</h3>
        {isCompleted ? (
          <p className="rounded-xl bg-cb-gray-50 p-3 text-sm text-cb-gray-600">{visit.notes || 'لا توجد ملاحظات'}</p>
        ) : (
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="اكتب ملاحظاتك عن الزيارة..."
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
          {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
        </button>
      )}
    </div>
  )
}
