// ─── Checklist-based scoring: each question = 1 or 0 ───────────────────────

export const EVALUATION_CATEGORIES = [
  {
    key: 'firstImpression',
    label: 'الانطباع الأول',
    emoji: '👋',
    questions: [
      { key: 'fi_q1', label: 'هل الموظف بادر بالتحية خلال أول 5 ثواني؟' },
      { key: 'fi_q2', label: 'هل كان واقف بشكل احترافي (مش قاعد/مشغول بالموبايل)؟' },
      { key: 'fi_q3', label: 'هل كان لابس الزي الرسمي كامل؟' },
    ],
  },
  {
    key: 'communication',
    label: 'التواصل',
    emoji: '💬',
    questions: [
      { key: 'cm_q1', label: 'هل سأل العميل عن احتياجاته؟' },
      { key: 'cm_q2', label: 'هل شرح العرض بدون ما العميل يطلب؟' },
      { key: 'cm_q3', label: 'هل استخدم لغة واضحة (مش عامية زيادة / مش مبهمة)؟' },
    ],
  },
  {
    key: 'productKnowledge',
    label: 'المعرفة بالمنتج',
    emoji: '📦',
    questions: [
      { key: 'pk_q1', label: 'هل قدم عرض واحد على الأقل صحيح 100%؟' },
      { key: 'pk_q2', label: 'هل جاوب على سؤال العميل بدون معلومات غلط؟' },
      { key: 'pk_q3', label: 'هل ذكر تفاصيل السعر/الباقة بدقة؟' },
    ],
  },
  {
    key: 'salesSkills',
    label: 'مهارات البيع',
    emoji: '🧠',
    questions: [
      { key: 'ss_q1', label: 'هل حاول يقفل البيع؟ (Ask for closing)' },
      { key: 'ss_q2', label: 'هل اقترح باقة إضافية (Upsell / Cross-sell)؟' },
      { key: 'ss_q3', label: 'هل تعامل مع اعتراض واحد على الأقل؟' },
    ],
  },
  {
    key: 'brandCompliance',
    label: 'الالتزام بالبراند',
    emoji: '🏢',
    questions: [
      { key: 'bc_q1', label: 'هل الستاند نظيف ومرتب؟' },
      { key: 'bc_q2', label: 'هل في branding واضح للشركة؟' },
      { key: 'bc_q3', label: 'هل استخدم جمل أو سكريبت معتمد من الشركة؟' },
    ],
  },
]

// All question keys flat
export const ALL_QUESTION_KEYS = EVALUATION_CATEGORIES.flatMap((cat) =>
  cat.questions.map((q) => q.key)
)

export const TOTAL_QUESTIONS = ALL_QUESTION_KEYS.length // 15

/**
 * Calculate total score from binary answers.
 * scores = { fi_q1: 1, fi_q2: 0, ... }
 * Returns a value from 0 to 5 (scaled) for backward compat with charts/reports.
 */
export function calculateWeightedScore(scores = {}) {
  const answered = ALL_QUESTION_KEYS.reduce(
    (sum, key) => sum + (Number(scores[key]) === 1 ? 1 : 0),
    0
  )
  // Scale to 0–5 for backward compatibility
  const scaled = TOTAL_QUESTIONS > 0 ? (answered / TOTAL_QUESTIONS) * 5 : 0
  return Number(scaled.toFixed(2))
}

/**
 * Raw score: sum of 1s out of total questions
 */
export function calculateRawScore(scores = {}) {
  return ALL_QUESTION_KEYS.reduce(
    (sum, key) => sum + (Number(scores[key]) === 1 ? 1 : 0),
    0
  )
}

/**
 * Percentage: (answered / total) × 100
 */
export function calculatePercentage(scores = {}) {
  const raw = calculateRawScore(scores)
  return TOTAL_QUESTIONS > 0 ? Math.round((raw / TOTAL_QUESTIONS) * 100) : 0
}

/**
 * Get empty scores object
 */
export function makeEmptyScores() {
  const obj = {}
  ALL_QUESTION_KEYS.forEach((key) => { obj[key] = 0 })
  return obj
}

/**
 * Get empty notes object (one per category)
 */
export function makeEmptyNotes() {
  const obj = {}
  EVALUATION_CATEGORIES.forEach((cat) => { obj[cat.key] = '' })
  return obj
}

export function getScoreColor(score) {
  if (score >= 4) return 'green'
  if (score >= 2.5) return 'amber'
  return 'red'
}

export function getScoreClasses(score) {
  const color = getScoreColor(score)
  if (color === 'green') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (color === 'amber') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-rose-100 text-rose-700 border-rose-200'
}

export function getPercentageClasses(pct) {
  if (pct >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (pct >= 50) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-rose-100 text-rose-700 border-rose-200'
}
