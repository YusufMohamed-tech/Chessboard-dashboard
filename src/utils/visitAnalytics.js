import { calculateWeightedScore } from './scoring'

const CHART_COLORS = ['#a8c93a', '#2d2d2d', '#64748b', '#d97706', '#dc2626', '#0891b2', '#7c3aed']

function roundTo(value, digits = 2) {
  const safeValue = Number(value ?? 0)
  const factor = 10 ** digits
  return Math.round(safeValue * factor) / factor
}

function normalizeText(value, fallback = '-') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function parseVisitDate(value) {
  const source = String(value ?? '').trim()
  if (!source) return null
  const direct = new Date(source)
  if (!Number.isNaN(direct.getTime())) return direct
  const dateOnly = source.split('T')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const fallback = new Date(`${dateOnly}T00:00:00`)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  return null
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  if (!y || !m) return monthKey
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { month: 'short' }).format(new Date(y, m - 1, 1))
}

function getAnchorDate(visits) {
  const timestamps = visits.map((v) => parseVisitDate(v.date)).filter(Boolean).map((d) => d.getTime())
  return timestamps.length ? new Date(Math.max(...timestamps)) : new Date()
}

function buildMonthKeys({ visits, months = 6 }) {
  const anchor = getAnchorDate(visits)
  const keys = []
  for (let i = months - 1; i >= 0; i--) {
    keys.push(getMonthKey(new Date(anchor.getFullYear(), anchor.getMonth() - i, 1)))
  }
  return keys
}

function normalizeIssue(issue, visitsById, index) {
  const visitId = issue.visitId ?? issue.visit_id
  const sv = visitsById.get(visitId)
  return {
    id: issue.id ?? `${visitId ?? 'issue'}-${index}`,
    visitId: visitId ?? sv?.id ?? null,
    severity: normalizeText(issue.severity, 'بسيطة'),
    description: normalizeText(issue.description, 'بدون وصف'),
    officeName: normalizeText(issue.officeName ?? sv?.officeName),
    city: normalizeText(issue.city ?? sv?.city),
    date: normalizeText(issue.date ?? sv?.date),
  }
}

function buildIssuesSource({ visits, issues }) {
  const vm = new Map(visits.map((v) => [v.id, v]))
  if (issues.length > 0) return issues.map((i, idx) => normalizeIssue(i, vm, idx))
  return visits.flatMap((v) => (Array.isArray(v.issues) ? v.issues : []).map((i, idx) => normalizeIssue({ ...i, visitId: i.visitId ?? v.id, officeName: i.officeName ?? v.officeName, city: i.city ?? v.city, date: i.date ?? v.date }, vm, idx)))
}

function countIssuesByVisit(recs) {
  const map = new Map()
  recs.forEach((i) => { if (i.visitId) map.set(i.visitId, (map.get(i.visitId) ?? 0) + 1) })
  return map
}

export function buildVisitAnalytics({ visits = [], issues = [], evaluationCriteria = [] } = {}) {
  const completed = visits.filter((v) => v.status === 'مكتملة')
  const pending = visits.filter((v) => v.status === 'معلقة')
  const upcoming = visits.filter((v) => v.status === 'قادمة')
  const deleting = visits.filter((v) => v.status === 'جاري المسح')

  const avgRaw = completed.length ? completed.reduce((s, v) => s + calculateWeightedScore(v.scores ?? {}), 0) / completed.length : 0

  const issueRecords = buildIssuesSource({ visits, issues }).sort((a, b) => {
    const da = parseVisitDate(a.date)?.getTime() ?? 0
    const db = parseVisitDate(b.date)?.getTime() ?? 0
    return db - da
  })

  const issueSummary = {
    total: issueRecords.length,
    simple: issueRecords.filter((i) => i.severity === 'بسيطة').length,
    medium: issueRecords.filter((i) => i.severity === 'متوسطة').length,
    critical: issueRecords.filter((i) => i.severity === 'خطيرة').length,
  }

  const issuesCountByVisit = countIssuesByVisit(issueRecords)

  const visitRows = [...visits].map((v) => ({
    ...v,
    officeName: normalizeText(v.officeName),
    city: normalizeText(v.city),
    score: roundTo(calculateWeightedScore(v.scores ?? {})),
    issuesCount: Number(issuesCountByVisit.get(v.id) ?? v.issues?.length ?? 0),
    pointsEarned: Number(v.pointsEarned ?? 0),
  })).sort((a, b) => {
    const da = parseVisitDate(a.date)?.getTime() ?? 0
    const db = parseVisitDate(b.date)?.getTime() ?? 0
    return db - da
  })

  const cityMap = new Map()
  visitRows.forEach((v) => {
    const ck = normalizeText(v.city, 'غير محدد')
    if (!cityMap.has(ck)) cityMap.set(ck, { city: ck, total: 0, completed: 0, scoreSum: 0, scoreCount: 0, issues: 0 })
    const cs = cityMap.get(ck)
    cs.total += 1
    cs.issues += v.issuesCount
    if (v.status === 'مكتملة') { cs.completed += 1; cs.scoreSum += v.score; cs.scoreCount += 1 }
  })

  const cityPerformance = Array.from(cityMap.values()).map((cs) => ({
    city: cs.city, total: cs.total, completed: cs.completed,
    completionRate: cs.total ? Math.round((cs.completed / cs.total) * 100) : 0,
    average: roundTo(cs.scoreCount ? cs.scoreSum / cs.scoreCount : 0), issues: cs.issues,
  })).sort((a, b) => b.total - a.total)

  const topCities = cityPerformance.slice(0, 6)
  const remaining = cityPerformance.slice(6).reduce((s, c) => s + c.total, 0)
  const cityShare = topCities.map((c, i) => ({ name: c.city, value: c.total, color: CHART_COLORS[i % CHART_COLORS.length] }))
  if (remaining > 0) cityShare.push({ name: 'مدن أخرى', value: remaining, color: '#94a3b8' })

  const cityRatingBars = [...cityPerformance].sort((a, b) => b.average - a.average).slice(0, 8)

  const monthKeys = buildMonthKeys({ visits, months: 6 })
  const monthlyMap = new Map(monthKeys.map((k) => [k, { visits: 0, completed: 0, scoreSum: 0 }]))
  visitRows.forEach((v) => {
    const d = parseVisitDate(v.date)
    if (!d) return
    const mk = getMonthKey(d)
    if (!monthlyMap.has(mk)) return
    const ms = monthlyMap.get(mk)
    ms.visits += 1
    if (v.status === 'مكتملة') { ms.completed += 1; ms.scoreSum += v.score }
  })

  const volumeTrend = monthKeys.map((k) => ({ month: getMonthLabel(k), visits: monthlyMap.get(k)?.visits ?? 0 }))
  const performanceTrend = monthKeys.map((k) => {
    const ms = monthlyMap.get(k)
    return { month: getMonthLabel(k), averageScore: roundTo(ms?.completed ? ms.scoreSum / ms.completed : 0) }
  })

  const criteriaPerformance = evaluationCriteria.map((c) => {
    const avg = completed.length ? completed.reduce((s, v) => s + Number(v.scores?.[c.key] ?? 0), 0) / completed.length : 0
    return { key: c.key, label: c.label, average: roundTo(avg) }
  })

  const completionRate = visitRows.length ? Math.round((completed.length / visitRows.length) * 100) : 0

  return {
    statusCounts: { total: visitRows.length, completed: completed.length, pending: pending.length, upcoming: upcoming.length, deleting: deleting.length },
    completionRate, averageScore: roundTo(avgRaw), issueSummary, issueRecords, visitRows,
    cityPerformance, cityShare, cityRatingBars, volumeTrend, performanceTrend, criteriaPerformance,
  }
}
