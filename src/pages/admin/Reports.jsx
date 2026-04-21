import { AlertTriangle, BarChart3, CalendarCheck2, Download, Gauge, LoaderCircle, MapPinned, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState, ErrorState, LoadingState } from '../../components/DataState'
import ReportHeader from '../../components/ReportHeader'
import StatusBadge from '../../components/StatusBadge'
import useDashboardStats from '../../hooks/useDashboardStats'
import { generateMysteryShopperDetailedPdf, generateMysteryShopperPdf } from '../../utils/reportsPdf'
import { buildVisitAnalytics } from '../../utils/visitAnalytics'

const SHOW_POINTS = true
const subTabs = [
  { key: 'overview', label: 'لوحة الزيارات' },
  { key: 'visits', label: 'سجل الزيارات' },
  { key: 'regions', label: 'تحليل المناطق' },
  { key: 'issues', label: 'التحديات' },
]
const timeOpts = [
  { key: 'daily', label: 'يومي' },
  { key: 'monthly', label: 'شهري' },
  { key: 'yearly', label: 'سنوي' },
  { key: 'custom', label: 'من تاريخ إلى تاريخ' },
]

function toDateKey(d) { if (!d) return ''; const p = new Date(d); if (isNaN(p)) return ''; return `${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,'0')}-${String(p.getDate()).padStart(2,'0')}` }
function toMonthKey(d) { return toDateKey(d).slice(0,7) }
function scoreCls(s) { if (s>=4) return 'bg-emerald-100 text-emerald-700 border-emerald-200'; if (s>=2.5) return 'bg-amber-100 text-amber-700 border-amber-200'; return 'bg-rose-100 text-rose-700 border-rose-200' }

function KpiCard({ title, value, hint, icon, tone }) {
  const Icon = icon
  const t = { emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800', lime: 'border-cb-lime-200 bg-cb-lime-50 text-cb-lime-800', sky: 'border-sky-200 bg-sky-50 text-sky-800', rose: 'border-rose-200 bg-rose-50 text-rose-800', gray: 'border-cb-gray-200 bg-cb-gray-50 text-cb-gray-800' }
  const cls = t[tone] ?? t.gray
  return (
    <article className={`rounded-xl border p-4 ${cls}`}>
      <div className="flex items-start justify-between gap-2">
        <div><p className="text-xs font-bold">{title}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-2 text-xs font-semibold opacity-70">{hint}</p></div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/60"><Icon className="h-4 w-4" /></span>
      </div>
    </article>
  )
}

function ChartCard({ title, subtitle, icon, children }) {
  const Icon = icon
  return (
    <article className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2"><div><h3 className="font-display text-lg font-black text-cb-gray-900">{title}</h3>{subtitle && <p className="text-xs text-cb-gray-500">{subtitle}</p>}</div><span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cb-gray-100 text-cb-gray-600"><Icon className="h-4 w-4" /></span></div>
      <div className="mt-4 h-72">{children}</div>
    </article>
  )
}

export default function Reports() {
  const { user, shoppers, visits, issues, evaluationCriteria, dataLoading, dataError } = useOutletContext()
  const [activeTab, setActiveTab] = useState('overview')
  const [exportMode, setExportMode] = useState('')
  const [toast, setToast] = useState({ type: '', message: '' })
  const [timeFilter, setTimeFilter] = useState('custom')
  const [dailyDate, setDailyDate] = useState(() => toDateKey(new Date()))
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthKey(new Date()))
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()))
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')

  const visitDateKeys = useMemo(() => visits.map(v => toDateKey(v.date)).filter(Boolean).sort(), [visits])
  const minDate = visitDateKeys[0] ?? '', maxDate = visitDateKeys[visitDateKeys.length-1] ?? ''

  useEffect(() => { if (!toast.message) return; const t = setTimeout(() => setToast({type:'',message:''}), 2600); return () => clearTimeout(t) }, [toast])
  useEffect(() => { if (minDate && !rangeFrom) setRangeFrom(minDate); if (maxDate && !rangeTo) setRangeTo(maxDate) }, [minDate, maxDate])

  const availableYears = useMemo(() => { const s = new Set(visitDateKeys.map(k=>k.slice(0,4))); if(!s.size) s.add(String(new Date().getFullYear())); return [...s].sort((a,b)=>b-a) }, [visitDateKeys])

  const rangeStart = rangeFrom <= rangeTo ? rangeFrom : rangeTo
  const rangeEnd = rangeFrom <= rangeTo ? rangeTo : rangeFrom

  const filteredVisits = useMemo(() => visits.filter(v => {
    const d = toDateKey(v.date); if (!d) return false
    if (timeFilter==='daily') return d===dailyDate
    if (timeFilter==='monthly') return d.startsWith(selectedMonth+'-')
    if (timeFilter==='yearly') return d.startsWith(selectedYear+'-')
    if (rangeStart && d<rangeStart) return false
    if (rangeEnd && d>rangeEnd) return false
    return true
  }), [dailyDate, rangeEnd, rangeStart, selectedMonth, selectedYear, timeFilter, visits])

  const filteredIds = useMemo(() => new Set(filteredVisits.map(v=>String(v.id))), [filteredVisits])
  const filteredIssues = useMemo(() => issues.filter(i => filteredIds.has(String(i.visitId??i.visit_id))), [filteredIds, issues])
  const stats = useDashboardStats({ shoppers, visits: filteredVisits, issues: filteredIssues })
  const analytics = useMemo(() => buildVisitAnalytics({ visits: filteredVisits, issues: filteredIssues, evaluationCriteria }), [evaluationCriteria, filteredIssues, filteredVisits])

  const canExport = ['superadmin','admin','ops'].includes(user?.role) && filteredVisits.length > 0
  const isExporting = exportMode !== ''

  const handleExport = async (mode) => {
    if (isExporting || !canExport) return
    setExportMode(mode)
    try {
      if (mode==='summary') await generateMysteryShopperPdf({ visits: filteredVisits, issues: filteredIssues, evaluationCriteria, showPointsSection: SHOW_POINTS })
      else await generateMysteryShopperDetailedPdf({ visits: filteredVisits, issues: filteredIssues, evaluationCriteria, showPointsSection: SHOW_POINTS })
      setToast({ type:'success', message:'تم إصدار التقرير بنجاح' })
    } catch { setToast({ type:'error', message:'تعذر إنشاء التقرير' }) }
    finally { setExportMode('') }
  }

  const regionsSummary = useMemo(() => {
    const byVol = analytics.cityPerformance[0] ?? null
    const byScore = [...analytics.cityPerformance].filter(r=>r.completed>0).sort((a,b)=>b.average-a.average)[0] ?? null
    const weak = [...analytics.cityPerformance].filter(r=>r.completed>0).sort((a,b)=>a.average-b.average)[0] ?? null
    return { byVol, byScore, weak }
  }, [analytics.cityPerformance])

  if (dataLoading) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} />
  if (visits.length === 0) return <EmptyState icon={BarChart3} message="لا توجد بيانات زيارات كافية" />

  const inputCls = "w-full rounded-xl border border-cb-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-cb-lime"

  return (
    <div className="space-y-4">
      {toast.message && <div className="fixed end-4 top-4 z-50"><div className={`rounded-xl border px-4 py-3 text-sm font-bold shadow-lg ${toast.type==='success'?'border-emerald-200 bg-emerald-50 text-emerald-700':'border-rose-200 bg-rose-50 text-rose-700'}`}>{toast.message}</div></div>}

      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <ReportHeader title="تقارير الزيارات التحليلية" />
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
          <h2 className="font-display text-2xl font-black text-cb-gray-900">تقارير الزيارات التحليلية</h2>
          {canExport && (
            <div className="ms-auto flex flex-wrap gap-2">
              <button type="button" onClick={() => handleExport('summary')} disabled={isExporting} className="inline-flex items-center gap-2 rounded-xl bg-cb-lime px-4 py-2 text-sm font-bold text-white transition hover:bg-cb-lime-dark disabled:opacity-70">
                {exportMode==='summary'?<><LoaderCircle className="h-4 w-4 animate-spin" />جاري الإصدار...</>:<><Download className="h-4 w-4" />إصدار تقرير</>}
              </button>
              <button type="button" onClick={() => handleExport('detailed')} disabled={isExporting} className="inline-flex items-center gap-2 rounded-xl bg-cb-gray-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-cb-gray-900 disabled:opacity-70">
                {exportMode==='detailed'?<><LoaderCircle className="h-4 w-4 animate-spin" />جاري الإصدار...</>:<><Download className="h-4 w-4" />تقرير تفصيلي</>}
              </button>
            </div>
          )}
        </div>

        {/* Time filter */}
        <section className="mt-4 rounded-xl border border-cb-gray-200 bg-cb-gray-50 p-3">
          <div className="flex flex-wrap gap-2">
            {timeOpts.map(o => <button key={o.key} type="button" onClick={() => setTimeFilter(o.key)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${timeFilter===o.key?'bg-cb-lime text-white':'bg-white text-cb-gray-600 hover:bg-cb-gray-100'}`}>{o.label}</button>)}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {timeFilter==='daily' && <label className="space-y-1 text-sm font-semibold text-cb-gray-700">تاريخ اليوم<input type="date" value={dailyDate} onChange={e=>setDailyDate(e.target.value)} className={inputCls} /></label>}
            {timeFilter==='monthly' && <label className="space-y-1 text-sm font-semibold text-cb-gray-700">الشهر<input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className={inputCls} /></label>}
            {timeFilter==='yearly' && <label className="space-y-1 text-sm font-semibold text-cb-gray-700">السنة<select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} className={inputCls}>{availableYears.map(y=><option key={y} value={y}>{y}</option>)}</select></label>}
            {timeFilter==='custom' && <><label className="space-y-1 text-sm font-semibold text-cb-gray-700">من تاريخ<input type="date" value={rangeFrom} onChange={e=>setRangeFrom(e.target.value)} className={inputCls} /></label><label className="space-y-1 text-sm font-semibold text-cb-gray-700">إلى تاريخ<input type="date" value={rangeTo} onChange={e=>setRangeTo(e.target.value)} className={inputCls} /></label></>}
          </div>
          <p className="mt-3 text-xs font-semibold text-cb-gray-600">{filteredVisits.length} من {visits.length} زيارة</p>
        </section>

        <div className="mt-4 flex flex-wrap gap-2">
          {subTabs.map(t => <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${activeTab===t.key?'bg-cb-lime text-white':'bg-cb-gray-100 text-cb-gray-600 hover:bg-cb-gray-200'}`}>{t.label}</button>)}
        </div>
      </section>

      {filteredVisits.length===0 && <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">لا توجد زيارات ضمن الفترة المحددة.</section>}

      {activeTab==='overview' && <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="إجمالي الزيارات" value={stats.totalVisits} hint={`${analytics.statusCounts.pending+analytics.statusCounts.upcoming} نشطة`} icon={CalendarCheck2} tone="gray" />
          <KpiCard title="المكتملة" value={stats.completedVisits} hint={`${analytics.statusCounts.deleting} طلب مسح`} icon={Gauge} tone="emerald" />
          <KpiCard title="متوسط الأداء" value={`${stats.avgRating.toFixed(2)} / 5`} hint="الزيارات المكتملة" icon={TrendingUp} tone="lime" />
          <KpiCard title="معدل الإنجاز" value={`${stats.completionRate}%`} hint={`${stats.issuesTotal} تحدي`} icon={AlertTriangle} tone="rose" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="الأداء حسب المنطقة" subtitle="توزيع الزيارات على المدن" icon={MapPinned}>
            {analytics.cityShare.length>0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analytics.cityShare} dataKey="value" nameKey="name" innerRadius={56} outerRadius={86} paddingAngle={2}>{analytics.cityShare.map(e=><Cell key={e.name} fill={e.color} />)}</Pie><Tooltip formatter={v=>[`${v} زيارة`,'العدد']} /><Legend verticalAlign="bottom" height={24} /></PieChart></ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-cb-gray-500">لا توجد بيانات كافية</p>}
          </ChartCard>
          <ChartCard title="أداء التقييم الشهري" subtitle="متوسط التقييم خلال 6 أشهر" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.performanceTrend} margin={{top:16,right:20,left:0,bottom:6}}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis domain={[0,5]} tickCount={6} /><Tooltip formatter={v=>[`${Number(v).toFixed(2)} / 5`,'الأداء']} /><Line type="monotone" dataKey="averageScore" stroke="#a8c93a" strokeWidth={3} dot={{r:3,fill:'#a8c93a'}} activeDot={{r:5}} /></LineChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="التقييم حسب المنطقة" subtitle="أفضل 8 مدن" icon={BarChart3}>
            {analytics.cityRatingBars.length>0 ? <ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.cityRatingBars} layout="vertical" margin={{top:6,right:20,left:12,bottom:6}}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0,5]} /><YAxis dataKey="city" type="category" width={84} /><Tooltip formatter={v=>[`${Number(v).toFixed(2)} / 5`,'التقييم']} /><Bar dataKey="average" fill="#a8c93a" radius={[0,8,8,0]} /></BarChart></ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-cb-gray-500">لا توجد بيانات</p>}
          </ChartCard>
          <ChartCard title="حجم الزيارات" subtitle="آخر 6 أشهر" icon={CalendarCheck2}>
            <ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.volumeTrend} margin={{top:14,right:16,left:0,bottom:6}}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip formatter={v=>[`${v} زيارة`,'العدد']} /><Bar dataKey="visits" fill="#2d2d2d" radius={[8,8,0,0]} maxBarSize={38} /></BarChart></ResponsiveContainer>
          </ChartCard>
        </div>
      </section>}

      {activeTab==='visits' && <section className="overflow-hidden rounded-xl border border-cb-gray-200 bg-white shadow-sm">
        <div className="border-b border-cb-gray-200 bg-cb-gray-50 px-4 py-3"><h3 className="font-display text-lg font-black text-cb-gray-900">سجل الزيارات التفصيلي</h3></div>
        <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-cb-gray-100 text-cb-gray-700"><tr><th className="px-4 py-3 text-start font-black">الفرع</th><th className="px-4 py-3 text-start font-black">المدينة</th><th className="px-4 py-3 text-start font-black">التاريخ</th><th className="px-4 py-3 text-start font-black">الحالة</th><th className="px-4 py-3 text-start font-black">التقييم</th><th className="px-4 py-3 text-start font-black">التحديات</th>{SHOW_POINTS && <th className="px-4 py-3 text-start font-black">النقاط</th>}</tr></thead>
        <tbody>{analytics.visitRows.length>0 ? analytics.visitRows.map((v,i) => <tr key={v.id} className={`${i%2===0?'bg-white':'bg-cb-gray-50'} hover:bg-cb-lime-50/40`}><td className="px-4 py-3 font-semibold text-cb-gray-900">{v.officeName}</td><td className="px-4 py-3 text-cb-gray-600">{v.city}</td><td className="px-4 py-3 text-cb-gray-600">{v.date}</td><td className="px-4 py-3"><StatusBadge status={v.status} /></td><td className="px-4 py-3"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${scoreCls(v.score)}`}>{v.score.toFixed(2)} / 5</span></td><td className="px-4 py-3 font-bold text-cb-gray-700">{v.issuesCount}</td>{SHOW_POINTS && <td className="px-4 py-3 font-bold text-cb-lime-700">{v.pointsEarned}</td>}</tr>) : <tr><td colSpan={SHOW_POINTS?7:6} className="px-4 py-6 text-center text-sm text-cb-gray-500">لا توجد زيارات</td></tr>}</tbody></table></div>
      </section>}

      {activeTab==='regions' && <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-xl border border-cb-gray-200 bg-white p-4"><p className="text-xs font-bold text-cb-gray-500">الأكثر نشاطاً</p><p className="mt-1 text-2xl font-black text-cb-gray-900">{regionsSummary.byVol?.city??'-'}</p><p className="mt-1 text-xs text-cb-gray-500">{regionsSummary.byVol?`${regionsSummary.byVol.total} زيارة`:'-'}</p></article>
          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-700">الأفضل تقييماً</p><p className="mt-1 text-2xl font-black text-emerald-800">{regionsSummary.byScore?.city??'-'}</p><p className="mt-1 text-xs text-emerald-700">{regionsSummary.byScore?`${regionsSummary.byScore.average.toFixed(2)} / 5`:'-'}</p></article>
          <article className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-xs font-bold text-rose-700">فرصة تحسين</p><p className="mt-1 text-2xl font-black text-rose-800">{regionsSummary.weak?.city??'-'}</p><p className="mt-1 text-xs text-rose-700">{regionsSummary.weak?`${regionsSummary.weak.average.toFixed(2)} / 5`:'-'}</p></article>
        </div>
        <section className="overflow-hidden rounded-xl border border-cb-gray-200 bg-white shadow-sm">
          <div className="border-b border-cb-gray-200 bg-cb-gray-50 px-4 py-3"><h3 className="font-display text-lg font-black text-cb-gray-900">تحليل الزيارات حسب المنطقة</h3></div>
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-cb-gray-100 text-cb-gray-700"><tr><th className="px-4 py-3 text-start font-black">المدينة</th><th className="px-4 py-3 text-start font-black">الإجمالي</th><th className="px-4 py-3 text-start font-black">المكتملة</th><th className="px-4 py-3 text-start font-black">معدل الإنجاز</th><th className="px-4 py-3 text-start font-black">متوسط التقييم</th><th className="px-4 py-3 text-start font-black">التحديات</th></tr></thead>
          <tbody>{analytics.cityPerformance.map((r,i) => <tr key={r.city} className={`${i%2===0?'bg-white':'bg-cb-gray-50'} hover:bg-cb-lime-50/40`}><td className="px-4 py-3 font-semibold text-cb-gray-900">{r.city}</td><td className="px-4 py-3 text-cb-gray-600">{r.total}</td><td className="px-4 py-3 text-cb-gray-600">{r.completed}</td><td className="px-4 py-3 text-cb-gray-600">{r.completionRate}%</td><td className="px-4 py-3"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${scoreCls(r.average)}`}>{r.average.toFixed(2)} / 5</span></td><td className="px-4 py-3 font-bold text-rose-700">{r.issues}</td></tr>)}</tbody></table></div>
        </section>
      </section>}

      {activeTab==='issues' && <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-cb-gray-200 bg-white p-4"><p className="text-xs text-cb-gray-500">إجمالي التحديات</p><p className="mt-1 text-2xl font-black text-cb-gray-900">{analytics.issueSummary.total}</p></div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs text-emerald-700">بسيطة</p><p className="mt-1 text-2xl font-black text-emerald-800">{analytics.issueSummary.simple}</p></div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs text-amber-700">متوسطة</p><p className="mt-1 text-2xl font-black text-amber-800">{analytics.issueSummary.medium}</p></div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-xs text-rose-700">خطيرة</p><p className="mt-1 text-2xl font-black text-rose-800">{analytics.issueSummary.critical}</p></div>
        </div>
        <article className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
          <h3 className="font-display text-xl font-black text-cb-gray-900">سجل التحديات</h3>
          <div className="mt-4 space-y-3">
            {analytics.issueRecords.map((iss,i) => <div key={`${iss.visitId}-${iss.id}`} className="rounded-xl border border-cb-gray-200 bg-cb-gray-50 p-3">
              <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${iss.severity==='خطيرة'?'border-rose-200 bg-rose-100 text-rose-700':iss.severity==='متوسطة'?'border-amber-200 bg-amber-100 text-amber-700':'border-emerald-200 bg-emerald-100 text-emerald-700'}`}>{iss.severity}</span><span className="text-sm text-cb-gray-500">#{i+1} • {iss.date}</span></div>
              <p className="mt-2 font-semibold text-cb-gray-800">{iss.description}</p>
              <p className="mt-1 text-sm text-cb-gray-500">{iss.officeName} • {iss.city}</p>
            </div>)}
            {analytics.issueRecords.length===0 && <p className="rounded-xl border border-cb-gray-200 bg-cb-gray-50 p-4 text-center text-sm text-cb-gray-500">لا توجد تحديات</p>}
          </div>
        </article>
      </section>}
    </div>
  )
}
