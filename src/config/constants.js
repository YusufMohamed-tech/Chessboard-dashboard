// ─── Chessboard — Static Configuration ──────────────────────
// These rarely change and don't need to be in the database.

export const BRANDS = [
  { key: 'all', label: 'جميع البراندات', color: '#a8c93a' },
  { key: 'موبايلي', label: 'موبايلي', color: '#6d28d9' },
  { key: 'ريدبول', label: 'ريدبول', color: '#dc2626' },
  { key: 'سلام موبايل', label: 'سلام موبايل', color: '#0891b2' },
  { key: 'ليبارا', label: 'ليبارا', color: '#059669' },
  { key: 'فيرجن MT', label: 'فيرجن MT', color: '#e11d48' },
  { key: 'فيرجن DS', label: 'فيرجن DS', color: '#f97316' },
]

export const POINTS_RULES = {
  visits: [{ label: 'إكمال زيارة', points: 50 }],
  issues: [
    { label: 'بسيطة', points: 15 },
    { label: 'متوسطة', points: 30 },
    { label: 'خطيرة', points: 50 },
  ],
  quality: [{ label: 'تقرير شامل', points: 25 }],
  achievements: [
    { label: 'إنجاز 5 زيارات', points: 50 },
    { label: 'إنجاز 10 زيارات', points: 100 },
    { label: 'إنجاز 20 زيارات', points: 200 },
  ],
}

export const EVALUATION_CRITERIA = [
  { key: 'fi_q1', label: 'تحية خلال 5 ثواني' },
  { key: 'fi_q2', label: 'وقوف احترافي' },
  { key: 'fi_q3', label: 'الزي الرسمي كامل' },
  { key: 'cm_q1', label: 'سؤال عن الاحتياجات' },
  { key: 'cm_q2', label: 'شرح العرض تلقائياً' },
  { key: 'cm_q3', label: 'لغة واضحة' },
  { key: 'pk_q1', label: 'عرض صحيح 100%' },
  { key: 'pk_q2', label: 'إجابة بدون معلومات غلط' },
  { key: 'pk_q3', label: 'تفاصيل السعر بدقة' },
  { key: 'ss_q1', label: 'محاولة إقفال البيع' },
  { key: 'ss_q2', label: 'اقتراح باقة إضافية' },
  { key: 'ss_q3', label: 'تعامل مع اعتراض' },
  { key: 'bc_q1', label: 'ستاند نظيف ومرتب' },
  { key: 'bc_q2', label: 'branding واضح' },
  { key: 'bc_q3', label: 'سكريبت معتمد' },
]

export const AUTH_STORAGE_KEY = 'cb-mystery-auth'
export const TOKEN_STORAGE_KEY = 'cb-mystery-token'
