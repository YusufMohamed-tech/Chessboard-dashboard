// ─── Chessboard Mystery Shopper Demo — Mock Data ────────────────────────────
// Comprehensive dataset for telecom booth mystery shopping operations

// ─── BRANDS ─────────────────────────────────────────────────────────────────
export const BRANDS = [
  { key: 'all', label: 'جميع البراندات', color: '#a8c93a' },
  { key: 'موبايلي', label: 'موبايلي', color: '#6d28d9' },
  { key: 'ريدبول', label: 'ريدبول', color: '#dc2626' },
  { key: 'سلام موبايل', label: 'سلام موبايل', color: '#0891b2' },
  { key: 'ليبارا', label: 'ليبارا', color: '#059669' },
  { key: 'فيرجن MT', label: 'فيرجن MT', color: '#e11d48' },
  { key: 'فيرجن DS', label: 'فيرجن DS', color: '#f97316' },
]

// ─── DEMO CREDENTIALS ──────────────────────────────────────────────────────
export const DEMO_CREDENTIALS = {
  superadmin: { email: 'admin@chessboard.sa', password: 'demo2026', name: 'يوسف محمد' },
  admin: { email: 'manager@chessboard.sa', password: 'demo2026', name: 'سارة القحطاني' },
  ops: { email: 'ops@chessboard.sa', password: 'demo2026', name: 'فهد الدوسري' },
  shopper: { email: 'agent@chessboard.sa', password: 'demo2026', name: 'نورة العتيبي' },
}

// ─── ADMINS ─────────────────────────────────────────────────────────────────
export const mockAdmins = [
  {
    id: 'sa-001',
    name: 'يوسف محمد',
    email: 'admin@chessboard.sa',
    personal_email: 'yusuf@gmail.com',
    password: 'demo2026',
    city: 'الرياض',
    status: 'active',
    role: 'superadmin',
    assignedBrands: [], // empty = sees all
  },
  {
    id: 'admin-001',
    name: 'سارة القحطاني',
    email: 'manager@chessboard.sa',
    personal_email: 'sara.q@gmail.com',
    password: 'demo2026',
    city: 'جدة',
    status: 'active',
    role: 'admin',
    assignedBrands: ['ريدبول', 'موبايلي'],
  },
  {
    id: 'admin-002',
    name: 'محمد الحربي',
    email: 'mobily@chessboard.sa',
    personal_email: 'moh.h@gmail.com',
    password: 'demo2026',
    city: 'الدمام',
    status: 'active',
    role: 'admin',
    assignedBrands: ['موبايلي'],
  },
  {
    id: 'admin-003',
    name: 'خالد الشمري',
    email: 'salam@chessboard.sa',
    personal_email: 'khalid.sh@gmail.com',
    password: 'demo2026',
    city: 'الرياض',
    status: 'active',
    role: 'admin',
    assignedBrands: ['سلام موبايل'],
  },
  {
    id: 'admin-004',
    name: 'عبدالرحمن العمري',
    email: 'lebara@chessboard.sa',
    personal_email: 'abdulrahman@gmail.com',
    password: 'demo2026',
    city: 'جدة',
    status: 'active',
    role: 'admin',
    assignedBrands: ['ليبارا'],
  },
  {
    id: 'admin-005',
    name: 'ريم السعيد',
    email: 'virgin@chessboard.sa',
    personal_email: 'reem.s@gmail.com',
    password: 'demo2026',
    city: 'الرياض',
    status: 'active',
    role: 'admin',
    assignedBrands: ['فيرجن MT', 'فيرجن DS'],
  },
  {
    id: 'ops-001',
    name: 'فهد الدوسري',
    email: 'ops@chessboard.sa',
    personal_email: 'fahad.d@gmail.com',
    password: 'demo2026',
    city: 'الرياض',
    status: 'active',
    role: 'ops',
    assignedBrands: [], // ops sees all
  },
]


// ─── SHOPPERS (Field Agents) ────────────────────────────────────────────────
export const mockShoppers = [
  {
    id: 'sh-001',
    name: 'نورة العتيبي',
    email: 'agent@chessboard.sa',
    personal_email: 'noura.o@gmail.com',
    password: 'demo2026',
    city: 'الرياض',
    primary_phone: '0501234567',
    whatsapp_phone: '0501234567',
    status: 'active',
    visits_completed: 18,
    points: 1240,
    assigned_admin_id: 'admin-001',
  },
  {
    id: 'sh-002',
    name: 'أحمد الزهراني',
    email: 'ahmed.z@chessboard.sa',
    personal_email: 'ahmed.z@gmail.com',
    password: 'demo2026',
    city: 'جدة',
    primary_phone: '0559876543',
    whatsapp_phone: '0559876543',
    status: 'active',
    visits_completed: 14,
    points: 980,
    assigned_admin_id: 'admin-001',
  },
  {
    id: 'sh-003',
    name: 'فاطمة الغامدي',
    email: 'fatima.g@chessboard.sa',
    personal_email: 'fatima.g@gmail.com',
    password: 'demo2026',
    city: 'الدمام',
    primary_phone: '0532345678',
    whatsapp_phone: '0532345678',
    status: 'active',
    visits_completed: 22,
    points: 1580,
    assigned_admin_id: 'admin-002',
  },
  {
    id: 'sh-004',
    name: 'عمر المالكي',
    email: 'omar.m@chessboard.sa',
    personal_email: 'omar.m@gmail.com',
    password: 'demo2026',
    city: 'الرياض',
    primary_phone: '0541112233',
    whatsapp_phone: '0541112233',
    status: 'active',
    visits_completed: 9,
    points: 620,
    assigned_admin_id: 'ops-001',
  },
  {
    id: 'sh-005',
    name: 'هند الحارثي',
    email: 'hind.h@chessboard.sa',
    personal_email: 'hind.h@gmail.com',
    password: 'demo2026',
    city: 'مكة المكرمة',
    primary_phone: '0567778899',
    whatsapp_phone: '0567778899',
    status: 'active',
    visits_completed: 11,
    points: 790,
    assigned_admin_id: 'admin-001',
  },
  {
    id: 'sh-006',
    name: 'ياسر القرني',
    email: 'yaser.q@chessboard.sa',
    personal_email: 'yaser.q@gmail.com',
    password: 'demo2026',
    city: 'المدينة المنورة',
    primary_phone: '0543334455',
    whatsapp_phone: '0543334455',
    status: 'active',
    visits_completed: 7,
    points: 480,
    assigned_admin_id: 'admin-002',
  },
  {
    id: 'sh-007',
    name: 'لمى العنزي',
    email: 'lama.a@chessboard.sa',
    personal_email: 'lama.a@gmail.com',
    password: 'demo2026',
    city: 'الخبر',
    primary_phone: '0555556677',
    whatsapp_phone: '0555556677',
    status: 'inactive',
    visits_completed: 3,
    points: 180,
    assigned_admin_id: null,
  },
  {
    id: 'sh-008',
    name: 'سلطان البلوي',
    email: 'sultan.b@chessboard.sa',
    personal_email: 'sultan.b@gmail.com',
    password: 'demo2026',
    city: 'تبوك',
    primary_phone: '0509998877',
    whatsapp_phone: '0509998877',
    status: 'active',
    visits_completed: 5,
    points: 340,
    assigned_admin_id: 'ops-001',
  },
]

// ─── OFFICES (Telecom Booths) ───────────────────────────────────────────────
export const mockOffices = [
  { id: 'off-001', name: 'كشك STC - الرياض بارك', city: 'الرياض', type: 'كشك اتصالات', location: 'الرياض بارك مول', status: 'active', brand: 'stc' },
  { id: 'off-002', name: 'كشك موبايلي - النخيل مول', city: 'الرياض', type: 'كشك اتصالات', location: 'النخيل مول', status: 'active', brand: 'mobily' },
  { id: 'off-003', name: 'كشك زين - رد سي مول', city: 'جدة', type: 'كشك اتصالات', location: 'رد سي مول', status: 'active', brand: 'zain' },
  { id: 'off-004', name: 'كشك STC - مول العرب', city: 'جدة', type: 'كشك اتصالات', location: 'مول العرب', status: 'active', brand: 'stc' },
  { id: 'off-005', name: 'كشك موبايلي - الظهران مول', city: 'الدمام', type: 'كشك اتصالات', location: 'الظهران مول', status: 'active', brand: 'mobily' },
  { id: 'off-006', name: 'كشك زين - النور مول', city: 'المدينة المنورة', type: 'كشك اتصالات', location: 'النور مول', status: 'active', brand: 'zain' },
  { id: 'off-007', name: 'كشك STC - العثيم مول', city: 'الرياض', type: 'كشك اتصالات', location: 'العثيم مول', status: 'active', brand: 'stc' },
  { id: 'off-008', name: 'كشك موبايلي - الأندلس مول', city: 'جدة', type: 'كشك اتصالات', location: 'الأندلس مول', status: 'active', brand: 'mobily' },
  { id: 'off-009', name: 'كشك زين - الراشد مول', city: 'الخبر', type: 'كشك اتصالات', location: 'الراشد مول', status: 'active', brand: 'zain' },
  { id: 'off-010', name: 'كشك STC - الحكير مول', city: 'مكة المكرمة', type: 'كشك اتصالات', location: 'الحكير مول', status: 'active', brand: 'stc' },
  { id: 'off-011', name: 'كشك موبايلي - تبوك بارك', city: 'تبوك', type: 'كشك اتصالات', location: 'تبوك بارك', status: 'active', brand: 'mobily' },
  { id: 'off-012', name: 'كشك زين - بانوراما مول', city: 'الرياض', type: 'كشك اتصالات', location: 'بانوراما مول', status: 'active', brand: 'zain' },
  { id: 'off-013', name: 'Redbull - الرياض بارك', city: 'الرياض', type: 'كشك', location: 'الرياض بارك مول', status: 'active', brand: 'redbull' },
  { id: 'off-014', name: 'Redbull - رد سي مول', city: 'جدة', type: 'كشك', location: 'رد سي مول', status: 'active', brand: 'redbull' },
]

// ─── EVALUATION CRITERIA (Checklist: 5 categories × 3 questions = 15 total) ─
// Actual criteria definitions are in src/utils/scoring.js (EVALUATION_CATEGORIES)
// This export maps the flat question keys for backward compat with analytics
export const mockEvaluationCriteria = [
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

// ─── VISITS (auto-generated from 189 active Excel locations) ────────────────
export { mockVisits } from './generatedVisits.js'


// ─── ISSUES ─────────────────────────────────────────────────────────────────
const _d = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
const _today = _d(0)
export const mockIssues = [
  { id: 'iss-001', visit_id: 'v-006', severity: 'خطيرة', description: 'تم رصد انخفاض في معيار الترحيب والاستقبال.', created_at: `${_d(3)}T12:00:00+03:00` },
  { id: 'iss-002', visit_id: 'v-006', severity: 'متوسطة', description: 'عدم تقديم حلول كافية عند التعامل مع الشكوى.', created_at: `${_d(3)}T12:00:00+03:00` },
  { id: 'iss-003', visit_id: 'v-003', severity: 'بسيطة', description: 'نقص في المعرفة بتفاصيل العروض الجديدة.', created_at: `${_d(4)}T12:00:00+03:00` },
  { id: 'iss-004', visit_id: 'v-005', severity: 'بسيطة', description: 'نظافة الكشك تحتاج تحسين.', created_at: `${_d(2)}T12:00:00+03:00` },
  { id: 'iss-005', visit_id: 'v-001', severity: 'بسيطة', description: 'يحتاج تحسين في التعامل مع الاعتراضات.', created_at: `${_d(2)}T12:00:00+03:00` },
  { id: 'iss-006', visit_id: 'v-024', severity: 'متوسطة', description: 'أداء متوسط في مهارات العرض والإقناع.', created_at: `${_d(4)}T12:00:00+03:00` },
  { id: 'iss-007', visit_id: 'v-025', severity: 'متوسطة', description: 'بطء في سرعة الخدمة خلال أوقات الذروة.', created_at: `${_d(2)}T20:00:00+03:00` },
  { id: 'iss-008', visit_id: 'v-020', severity: 'بسيطة', description: 'نقص في المعرفة بالتفاصيل التقنية للباقات.', created_at: `${_d(4)}T12:00:00+03:00` },
]

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────
export const mockNotifications = [
  { id: 'n-001', recipient_role: 'superadmin', recipient_user_id: null, recipient_email: '', title: 'تم إكمال زيارة', description: 'تم إكمال الزيارة بنجاح', event_type: 'visit_completed', visit_id: 'v-001', payload: {}, is_read: false, read_at: null, created_at: `${_d(2)}T12:00:00+03:00` },
  { id: 'n-002', recipient_role: 'admin', recipient_user_id: null, recipient_email: '', title: 'تم إكمال زيارة', description: 'تم إكمال الزيارة بنجاح', event_type: 'visit_completed', visit_id: 'v-003', payload: {}, is_read: false, read_at: null, created_at: `${_d(4)}T13:00:00+03:00` },
  { id: 'n-003', recipient_role: 'shopper', recipient_user_id: 'sh-001', recipient_email: '', title: 'تم إسناد زيارة جديدة لك', description: 'يرجى مراجعة بيانات الزيارة', event_type: 'visit_assigned', visit_id: 'v-012', payload: {}, is_read: false, read_at: null, created_at: `${_d(1)}T09:00:00+03:00` },
]

// ─── POINTS RULES ───────────────────────────────────────────────────────
export const mockPointsRules = [
  { category: 'visits', condition: 'إكمال زيارة', points: 50 },
  { category: 'issues', condition: 'بسيطة', points: 15 },
  { category: 'issues', condition: 'متوسطة', points: 30 },
  { category: 'issues', condition: 'خطيرة', points: 50 },
  { category: 'quality', condition: 'تقرير شامل', points: 25 },
  { category: 'achievements', condition: 'إنجاز 5 زيارات', points: 50 },
  { category: 'achievements', condition: 'إنجاز 10 زيارات', points: 100 },
  { category: 'achievements', condition: 'إنجاز 20 زيارات', points: 200 },
]
