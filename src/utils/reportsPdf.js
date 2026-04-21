import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { buildVisitAnalytics } from './visitAnalytics'

const PRIMARY = [45, 45, 45]
const PRIMARY_DEEP = [26, 26, 26]
const LIME = [168, 201, 58]
const LIME_LIGHT = [220, 235, 180]
const TEXT_DARK = [15, 23, 42]
const TEXT_MUTED = [71, 85, 105]
const HEADER_HEIGHT = 82

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return window.btoa(binary)
}

async function fetchAssetAsDataUrl(path) {
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => reject(new Error(`Failed: ${path}`))
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

async function registerArabicFont(doc) {
  try {
    const res = await fetch('/branding/noto-naskh-arabic-regular.ttf')
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const b64 = arrayBufferToBase64(buf)
    doc.addFileToVFS('noto-naskh-arabic-regular.ttf', b64)
    doc.addFont('noto-naskh-arabic-regular.ttf', 'NotoNaskhArabic', 'normal')
    return 'NotoNaskhArabic'
  } catch { return null }
}

async function loadAssets(doc) {
  const [chessLogo, fontFamily] = await Promise.all([
    fetchAssetAsDataUrl('/branding/chessboard-logo.png'),
    registerArabicFont(doc),
  ])
  return { chessLogo, fontFamily: fontFamily ?? 'helvetica' }
}

function safeText(v) { return v == null || v === '' ? '-' : String(v) }
function rtlText(doc, v) { const t = safeText(v); return typeof doc.processArabic === 'function' ? doc.processArabic(t) : t }
function setFont(doc, f, s) { doc.setFont(f, 'normal'); doc.setFontSize(s) }
function setTextColor(doc, c) { doc.setTextColor(c[0], c[1], c[2]) }

function drawImageContain(doc, data, type, bx, by, bw, bh) {
  if (!data) return
  try {
    const props = doc.getImageProperties(data)
    const iw = Number(props?.width ?? bw), ih = Number(props?.height ?? bh)
    if (!iw || !ih) { doc.addImage(data, type, bx, by, bw, bh); return }
    const scale = Math.min(1, Math.min(bw / iw, bh / ih))
    const dw = iw * scale, dh = ih * scale
    doc.addImage(data, type, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh)
  } catch { /* ignore */ }
}

function drawHeader(doc, assets, pageWidth, y = 0) {
  // Dark header with lime accent
  doc.setFillColor(...PRIMARY)
  doc.rect(0, y, pageWidth, HEADER_HEIGHT, 'F')
  doc.setFillColor(...PRIMARY_DEEP)
  doc.rect(0, y + HEADER_HEIGHT - 10, pageWidth, 10, 'F')

  // Lime accent line
  doc.setFillColor(...LIME)
  doc.rect(0, y + HEADER_HEIGHT - 2, pageWidth, 2, 'F')

  // Decorative elements
  doc.setFillColor(...LIME)
  doc.circle(52, y + 18, 14, 'F')
  doc.circle(pageWidth - 56, y + 18, 12, 'F')

  // Logo card
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...LIME_LIGHT)
  doc.setLineWidth(1)
  doc.roundedRect(24, y + 8, 182, HEADER_HEIGHT - 16, 10, 10, 'FD')
  drawImageContain(doc, assets.chessLogo, 'PNG', 34, y + 16, 162, HEADER_HEIGHT - 32)

  // Title
  setFont(doc, assets.fontFamily, 14)
  setTextColor(doc, [255, 255, 255])
  doc.text(rtlText(doc, 'Chessboard — برنامج المتحري الخفي'), pageWidth - 30, y + 40, { align: 'right' })
  setFont(doc, assets.fontFamily, 9)
  doc.text(rtlText(doc, 'Mystery Shopper Platform'), pageWidth - 30, y + 56, { align: 'right' })
}

function formatDate(d = new Date()) {
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { dateStyle: 'full', timeStyle: 'short' }).format(d)
}

function formatExportDate(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addHeaderFooter(doc, text, assets) {
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    const pw = doc.internal.pageSize.getWidth()
    const ph = doc.internal.pageSize.getHeight()
    drawHeader(doc, assets, pw, 0)
    setTextColor(doc, [255, 255, 255])
    setFont(doc, assets.fontFamily, 10)
    doc.text(rtlText(doc, `صفحة ${i} من ${total}`), pw / 2, 26, { align: 'center' })
    setTextColor(doc, TEXT_MUTED)
    setFont(doc, assets.fontFamily, 10)
    doc.text(rtlText(doc, 'سري - Chessboard'), pw - 24, ph - 14, { align: 'right' })
    doc.text(text, 24, ph - 14, { align: 'left' })
  }
}

function drawKpiCard(doc, { x, y, w, h, fontFamily, title, value, subtitle, tone }) {
  doc.setFillColor(...tone.bg)
  doc.setDrawColor(...tone.border)
  doc.setLineWidth(1)
  doc.roundedRect(x, y, w, h, 12, 12, 'FD')
  setFont(doc, fontFamily, 10); setTextColor(doc, TEXT_MUTED)
  doc.text(rtlText(doc, title), x + w - 12, y + 18, { align: 'right' })
  setFont(doc, fontFamily, 21); setTextColor(doc, tone.accent)
  doc.text(rtlText(doc, value), x + w - 12, y + 42, { align: 'right' })
  setFont(doc, fontFamily, 9); setTextColor(doc, TEXT_MUTED)
  doc.text(rtlText(doc, subtitle), x + w - 12, y + 61, { align: 'right' })
}

export async function generateMysteryShopperPdf({ visits, issues, evaluationCriteria, showPointsSection = true, generatedAt = new Date() }) {
  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
  const dateText = formatDate(generatedAt)
  const assets = await loadAssets(doc)
  const ff = assets.fontFamily
  setFont(doc, ff, 12)

  const analytics = buildVisitAnalytics({ visits, issues, evaluationCriteria })
  const totalPts = analytics.visitRows.reduce((s, r) => s + Number(r.pointsEarned ?? 0), 0)
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()

  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pw, ph, 'F')
  drawHeader(doc, assets, pw, 0)

  setFont(doc, ff, 28); setTextColor(doc, TEXT_DARK)
  doc.text(rtlText(doc, 'تقرير برنامج المتحري الخفي'), pw - 40, 170, { align: 'right' })
  setFont(doc, ff, 14); setTextColor(doc, TEXT_MUTED)
  doc.text(rtlText(doc, 'تقرير تحليلي بصري للزيارات الميدانية'), pw - 40, 205, { align: 'right' })
  setFont(doc, ff, 12)
  doc.text(rtlText(doc, `تاريخ الإنشاء: ${dateText}`), pw - 40, 235, { align: 'right' })

  // Confidential badge
  doc.setFillColor(254, 242, 242)
  doc.setDrawColor(244, 63, 94)
  doc.roundedRect(pw - 310, 265, 270, 30, 15, 15, 'FD')
  doc.setTextColor(190, 24, 93)
  setFont(doc, ff, 12)
  doc.text(rtlText(doc, 'سري - محمي باتفاقية عدم الإفصاح'), pw - 175, 285, { align: 'center' })

  // Dashboard page
  doc.addPage('a4', 'l')
  const lpw = doc.internal.pageSize.getWidth()
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, lpw, doc.internal.pageSize.getHeight(), 'F')
  drawHeader(doc, assets, lpw, 0)

  const cX = 20, cW = lpw - 40, cardsY = 116, cardH = 74, cardGap = 10
  const cardW = (cW - cardGap * 3) / 4
  const kpis = [
    { title: 'إجمالي الزيارات', value: String(analytics.statusCounts.total), subtitle: `قادمة: ${analytics.statusCounts.upcoming}`, tone: { bg: [238, 242, 255], border: [199, 210, 254], accent: [67, 56, 202] } },
    { title: 'المكتملة', value: String(analytics.statusCounts.completed), subtitle: `طلبات مسح: ${analytics.statusCounts.deleting}`, tone: { bg: [236, 253, 245], border: [167, 243, 208], accent: [5, 150, 105] } },
    { title: 'معدل الإنجاز', value: `${analytics.completionRate}%`, subtitle: `تحديات: ${analytics.issueSummary.total}`, tone: { bg: [247, 254, 231], border: LIME_LIGHT, accent: [101, 163, 13] } },
    { title: 'متوسط الأداء', value: `${analytics.averageScore.toFixed(2)} / 5`, subtitle: `خطيرة: ${analytics.issueSummary.critical}`, tone: { bg: [254, 242, 242], border: [254, 205, 211], accent: [225, 29, 72] } },
  ]
  kpis.forEach((k, i) => drawKpiCard(doc, { x: cX + i * (cardW + cardGap), y: cardsY, w: cardW, h: cardH, fontFamily: ff, ...k }))

  // Summary table page
  doc.addPage('a4', 'p')
  setFont(doc, ff, 22); setTextColor(doc, TEXT_DARK)
  doc.text(rtlText(doc, 'ملخص رقمي للزيارات'), doc.internal.pageSize.getWidth() - 40, 142, { align: 'right' })

  const summaryRows = [
    [rtlText(doc, 'إجمالي الزيارات'), String(analytics.statusCounts.total)],
    [rtlText(doc, 'الزيارات المكتملة'), String(analytics.statusCounts.completed)],
    [rtlText(doc, 'الزيارات الجديدة'), String(analytics.statusCounts.pending)],
    [rtlText(doc, 'إعادة الزيارة'), String(analytics.statusCounts.upcoming)],
    [rtlText(doc, 'معدل الإنجاز'), `${analytics.completionRate}%`],
    [rtlText(doc, 'متوسط الأداء'), `${analytics.averageScore.toFixed(2)} / 5`],
    [rtlText(doc, 'إجمالي التحديات'), String(analytics.issueSummary.total)],
    [rtlText(doc, 'بسيطة / متوسطة / خطيرة'), `${analytics.issueSummary.simple} / ${analytics.issueSummary.medium} / ${analytics.issueSummary.critical}`],
  ]
  if (showPointsSection) summaryRows.push([rtlText(doc, 'إجمالي نقاط الزيارات'), String(totalPts)])

  autoTable(doc, {
    startY: 170,
    head: [[rtlText(doc, 'المؤشر'), rtlText(doc, 'القيمة')]],
    body: summaryRows,
    theme: 'grid',
    styles: { font: ff, fontStyle: 'normal', halign: 'right', valign: 'middle', fontSize: 11, textColor: [30, 41, 59], cellPadding: 7 },
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], font: ff, fontStyle: 'normal', halign: 'right' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
  })

  addHeaderFooter(doc, dateText, assets)
  doc.save(`Chessboard-Report-${formatExportDate(generatedAt)}.pdf`)
}

export async function generateMysteryShopperDetailedPdf({ visits, issues, evaluationCriteria, showPointsSection = true, generatedAt = new Date() }) {
  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
  const dateText = formatDate(generatedAt)
  const assets = await loadAssets(doc)
  const ff = assets.fontFamily
  setFont(doc, ff, 12)

  const analytics = buildVisitAnalytics({ visits, issues, evaluationCriteria })
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()

  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pw, ph, 'F')
  drawHeader(doc, assets, pw, 0)

  setFont(doc, ff, 28); setTextColor(doc, TEXT_DARK)
  doc.text(rtlText(doc, 'التقرير التفصيلي للزيارات'), pw - 40, 170, { align: 'right' })
  setFont(doc, ff, 14); setTextColor(doc, TEXT_MUTED)
  doc.text(rtlText(doc, 'سجل كامل لكل زيارة ميدانية'), pw - 40, 205, { align: 'right' })

  // Visits table
  doc.addPage('a4', 'l')
  const lpw2 = doc.internal.pageSize.getWidth()
  setFont(doc, ff, 18); setTextColor(doc, TEXT_DARK)
  doc.text(rtlText(doc, 'سجل الزيارات التفصيلي'), lpw2 - 30, 110, { align: 'right' })

  const head = [rtlText(doc, 'الفرع'), rtlText(doc, 'المدينة'), rtlText(doc, 'التاريخ'), rtlText(doc, 'الحالة'), rtlText(doc, 'التقييم'), rtlText(doc, 'التحديات')]
  if (showPointsSection) head.push(rtlText(doc, 'النقاط'))

  const body = analytics.visitRows.map((v) => {
    const row = [rtlText(doc, v.officeName), rtlText(doc, v.city), v.date, rtlText(doc, v.status), `${v.score.toFixed(2)} / 5`, String(v.issuesCount)]
    if (showPointsSection) row.push(String(v.pointsEarned))
    return row
  })

  autoTable(doc, {
    startY: 130,
    head: [head],
    body: body.length ? body : [[rtlText(doc, 'لا توجد بيانات'), ...Array(head.length - 1).fill('-')]],
    theme: 'grid',
    styles: { font: ff, fontStyle: 'normal', halign: 'right', fontSize: 9, cellPadding: 5, textColor: TEXT_DARK },
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], font: ff, halign: 'right' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 },
  })

  // Region table
  doc.addPage('a4', 'l')
  setFont(doc, ff, 18); setTextColor(doc, TEXT_DARK)
  doc.text(rtlText(doc, 'تحليل الزيارات حسب المنطقة'), doc.internal.pageSize.getWidth() - 30, 110, { align: 'right' })

  autoTable(doc, {
    startY: 130,
    head: [[rtlText(doc, 'المدينة'), rtlText(doc, 'الإجمالي'), rtlText(doc, 'المكتملة'), rtlText(doc, 'معدل الإنجاز'), rtlText(doc, 'متوسط التقييم'), rtlText(doc, 'التحديات')]],
    body: analytics.cityPerformance.map((r) => [rtlText(doc, r.city), String(r.total), String(r.completed), `${r.completionRate}%`, `${r.average.toFixed(2)} / 5`, String(r.issues)]),
    theme: 'grid',
    styles: { font: ff, fontStyle: 'normal', halign: 'right', fontSize: 9, cellPadding: 5, textColor: TEXT_DARK },
    headStyles: { fillColor: LIME, textColor: [255, 255, 255], font: ff, halign: 'right' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 },
  })

  addHeaderFooter(doc, dateText, assets)
  doc.save(`Chessboard-Detailed-Report-${formatExportDate(generatedAt)}.pdf`)
}
