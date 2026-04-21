import { Building2, CalendarDays, Headphones, ExternalLink, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/DataState'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import StatusBadge from '../../components/StatusBadge'
import LocationPicker from '../../components/LocationPicker'

const filters = [
  { label: 'الكل', value: 'الكل' },
  { label: 'زيارة جديدة', value: 'معلقة' },
  { label: 'إعادة الزيارة', value: 'قادمة' },
  { label: 'مكتملة', value: 'مكتملة' },
  { label: 'جاري المسح', value: 'جاري المسح' },
]

function getInitialVisit() {
  return { officeName: '', city: '', type: '', status: 'معلقة', date: new Date().toISOString().slice(0, 10), time: 'صباحية', assignedShopperId: '', scenario: '' }
}

export default function Visits() {
  const { user, visits, shoppers, addVisit, updateVisit, deleteVisit, getShopperById, locationDatabase, brands, dataLoading, dataError } = useOutletContext()

  const [activeFilter, setActiveFilter] = useState('الكل')
  const [activeBrand, setActiveBrand] = useState('all')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingVisit, setEditingVisit] = useState(null)
  const [newVisit, setNewVisit] = useState(getInitialVisit)
  const canAssignShopper = user?.role === 'superadmin' || user?.role === 'ops'
  const canDeleteVisit = user?.role === 'superadmin' || user?.role === 'ops'

  // Brand tabs: show only assigned brands for scoped admins
  const userBrands = user?.assignedBrands?.length ? user.assignedBrands : null
  const isSuperAdmin = user?.role === 'superadmin'
  const isOps = user?.role === 'ops'
  const availableBrands = (brands || []).filter((b) => isSuperAdmin || isOps || !userBrands ? true : b.key === 'all' || userBrands.includes(b.key))

  // Filter locations by admin's assigned brands
  const allowedLocations = useMemo(() => {
    const locs = locationDatabase ?? []
    if (isSuperAdmin || isOps) return locs
    if (!userBrands) return []
    return locs.filter(loc => userBrands.includes(loc.brand))
  }, [locationDatabase, userBrands, isSuperAdmin, isOps])

  const summary = {
    total: visits.length,
    completed: visits.filter((v) => v.status === 'مكتملة').length,
    upcoming: visits.filter((v) => v.status === 'قادمة').length,
    pending: visits.filter((v) => v.status === 'معلقة').length,
    deleting: visits.filter((v) => v.status === 'جاري المسح').length,
  }

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const matchFilter = activeFilter === 'الكل' || v.status === activeFilter
      const matchQuery = `${v.officeName} ${v.city}`.toLowerCase().includes(debouncedQuery.toLowerCase())
      const vBrand = v.brand || v.type || ''
      const matchBrand = activeBrand === 'all' || vBrand === activeBrand
      const matchScope = !userBrands || userBrands.includes(vBrand)
      return matchFilter && matchQuery && matchBrand && matchScope
    })
  }, [activeFilter, activeBrand, debouncedQuery, visits, userBrands])

  const handleCreateVisit = async (e) => {
    e.preventDefault()
    await addVisit({ ...newVisit, brand: newVisit.type, assignedShopperId: canAssignShopper ? newVisit.assignedShopperId || null : null })
    setNewVisit(getInitialVisit())
    setIsAddModalOpen(false)
  }

  const handleDeleteVisit = async (visitId) => {
    if (!canDeleteVisit) return
    if (window.confirm('هل تريد حذف هذه الزيارة؟')) {
      const result = await deleteVisit(visitId)
      if (result === 'requested') window.alert('تم إرسال طلب حذف')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingVisit) return
    await updateVisit(editingVisit.id, {
      officeName: editingVisit.officeName, city: editingVisit.city, type: editingVisit.type,
      status: editingVisit.status, date: editingVisit.date, time: editingVisit.time,
      assignedShopperId: canAssignShopper ? editingVisit.assignedShopperId || null : undefined,
      scenario: editingVisit.scenario,
    })
    setEditingVisit(null)
  }

  if (dataLoading) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} />

  const inputClasses = "h-11 w-full rounded-xl border border-cb-gray-300 bg-white px-3 outline-none focus:border-cb-lime focus:ring-2 focus:ring-cb-lime-200"

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-display text-2xl font-black text-cb-gray-900">إدارة الزيارات</h2>
            <p className="text-sm text-cb-gray-500">تنسيق الزيارات الميدانية لأكشاك الاتصالات</p>
          </div>
          <button type="button" onClick={() => setIsAddModalOpen(true)} className="ms-auto inline-flex items-center gap-2 rounded-xl bg-cb-lime px-4 py-2 text-sm font-bold text-white transition hover:bg-cb-lime-dark">
            <Plus className="h-4 w-4" /> إضافة زيارة
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-lg border border-cb-gray-200 bg-cb-gray-50 p-3"><p className="text-xs text-cb-gray-500">إجمالي</p><p className="mt-1 text-2xl font-black text-cb-gray-900">{summary.total}</p></div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"><p className="text-xs text-emerald-700">مكتملة</p><p className="mt-1 text-2xl font-black text-emerald-800">{summary.completed}</p></div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-xs text-amber-700">إعادة الزيارة</p><p className="mt-1 text-2xl font-black text-amber-800">{summary.upcoming}</p></div>
          <div className="rounded-lg border border-cb-gray-300 bg-cb-gray-100 p-3"><p className="text-xs text-cb-gray-600">زيارة جديدة</p><p className="mt-1 text-2xl font-black text-cb-gray-800">{summary.pending}</p></div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3"><p className="text-xs text-rose-700">طلبات مسح</p><p className="mt-1 text-2xl font-black text-rose-800">{summary.deleting}</p></div>
        </div>

        {/* Brand tabs */}
        <div className="mt-4 rounded-xl border border-cb-gray-200 bg-cb-gray-50 p-1.5 flex flex-wrap gap-1.5">
          {availableBrands.map((b) => (
            <button key={b.key} type="button" onClick={() => setActiveBrand(b.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                activeBrand === b.key
                  ? 'bg-white text-cb-gray-900 shadow-sm ring-1 ring-cb-gray-200'
                  : 'text-cb-gray-500 hover:bg-white/60 hover:text-cb-gray-700'
              }`}>
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: b.color }} />
              {b.label}
              {activeBrand === b.key && (
                <span className="ms-1 rounded-full bg-cb-gray-200 px-2 py-0.5 text-[10px] font-black text-cb-gray-700">
                  {b.key === 'all'
                    ? visits.length
                    : visits.filter((v) => (v.brand || v.type) === b.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button key={f.value} type="button" onClick={() => setActiveFilter(f.value)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${activeFilter === f.value ? 'bg-cb-lime text-white' : 'bg-cb-gray-100 text-cb-gray-600 hover:bg-cb-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cb-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="البحث عن كشك أو مدينة..."
            className="h-11 w-full rounded-xl border border-cb-gray-300 bg-white pe-10 ps-4 text-sm outline-none transition focus:border-cb-lime focus:ring-2 focus:ring-cb-lime-200" />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredVisits.map((visit) => {
          const shopper = getShopperById?.(visit.assignedShopperId)
          return (
            <article key={visit.id} className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm card-hover">
              <div className="flex items-center justify-between">
                <StatusBadge status={visit.status} />
                <div className="flex items-center gap-2">
                  {canDeleteVisit && (
                    <button type="button" onClick={() => handleDeleteVisit(visit.id)} className="rounded-lg border border-rose-300 p-1.5 text-rose-600 transition hover:bg-rose-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => setEditingVisit({ ...visit })} className="rounded-lg border border-cb-gray-300 p-1.5 text-cb-gray-600 transition hover:bg-cb-gray-100">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="flex items-center gap-2 font-black text-cb-gray-900">
                  <Building2 className="h-4 w-4 text-cb-lime" />
                  {visit.officeName}
                </h3>
                <p className="mt-1 text-sm text-cb-gray-500">{visit.type}</p>
              </div>
              <p className="mt-3 text-sm text-cb-gray-600">{visit.city} • {visit.date} • {visit.time}</p>
              <div className="mt-3 rounded-xl bg-cb-gray-50 p-3 text-sm text-cb-gray-600">{visit.scenario || 'بدون سيناريو'}</div>
              <div className="mt-3 text-sm">
                <span className="text-cb-gray-500">الوكيل الميداني: {shopper ? shopper.name : 'في انتظار التعيين'}</span>
              </div>
            </article>
          )
        })}
        {filteredVisits.length === 0 && (
          <div className="rounded-xl border border-cb-gray-200 bg-white p-8 text-center text-sm text-cb-gray-500 md:col-span-2 xl:col-span-3">
            <CalendarDays className="mx-auto h-10 w-10 text-cb-gray-300" />
            <p className="mt-3 font-semibold">لا توجد زيارات مطابقة</p>
          </div>
        )}
      </section>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-cb-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-cb-gray-200 bg-white p-5 shadow-xl animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-black text-cb-gray-900">إضافة زيارة</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-lg border border-cb-gray-300 p-1.5 text-cb-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreateVisit} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 text-sm text-cb-gray-600 sm:col-span-2"><span className="font-semibold">الموقع</span>
                <LocationPicker locations={allowedLocations} value={newVisit.officeName ? { name: newVisit.officeName, city: newVisit.city, brand: newVisit.type } : null} onChange={(loc) => { if (loc) setNewVisit((p) => ({ ...p, officeName: loc.name, city: loc.city, type: loc.brand || p.type })); else setNewVisit((p) => ({ ...p, officeName: '', city: '', type: '' })) }} placeholder="ابحث واختر الموقع..." />
              </div>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>المدينة</span><input value={newVisit.city} onChange={(e) => setNewVisit((p) => ({ ...p, city: e.target.value }))} className={inputClasses} placeholder="تُعبأ تلقائياً" /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>البراند</span>
                <select value={newVisit.type} onChange={(e) => setNewVisit((p) => ({ ...p, type: e.target.value }))} className={inputClasses}>
                  <option value="">اختر البراند</option>
                  {(brands || []).filter(b => b.key !== 'all').filter(b => !userBrands || userBrands.includes(b.key)).map((b) => (
                    <option key={b.key} value={b.key}>{b.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>الحالة</span><select value={newVisit.status} onChange={(e) => setNewVisit((p) => ({ ...p, status: e.target.value }))} className={inputClasses}><option value="معلقة">زيارة جديدة</option><option value="قادمة">إعادة الزيارة</option></select></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>التاريخ</span><input type="date" value={newVisit.date} onChange={(e) => setNewVisit((p) => ({ ...p, date: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>الفترة</span><select value={newVisit.time} onChange={(e) => setNewVisit((p) => ({ ...p, time: e.target.value }))} className={inputClasses}><option value="صباحية">صباحية</option><option value="مسائية">مسائية</option></select></label>
              {canAssignShopper && (
                <label className="space-y-1 text-sm text-cb-gray-600 sm:col-span-2"><span>الوكيل الميداني</span>
                  <select value={newVisit.assignedShopperId} onChange={(e) => setNewVisit((p) => ({ ...p, assignedShopperId: e.target.value }))} className={inputClasses}>
                    <option value="">في انتظار التعيين</option>
                    {shoppers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              )}
              <label className="space-y-1 text-sm text-cb-gray-600 sm:col-span-2"><span>تفاصيل السيناريو</span><textarea value={newVisit.scenario} onChange={(e) => setNewVisit((p) => ({ ...p, scenario: e.target.value }))} rows={3} className="w-full rounded-xl border border-cb-gray-300 bg-white p-3 outline-none focus:border-cb-lime" /></label>
              <button type="submit" className="h-11 rounded-xl bg-cb-lime text-sm font-bold text-white transition hover:bg-cb-lime-dark sm:col-span-2">حفظ الزيارة</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingVisit && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-cb-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-cb-gray-200 bg-white p-5 shadow-xl animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-black text-cb-gray-900">تعديل الزيارة</h3>
              <button type="button" onClick={() => setEditingVisit(null)} className="rounded-lg border border-cb-gray-300 p-1.5 text-cb-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 text-sm text-cb-gray-600 sm:col-span-2"><span className="font-semibold">الموقع</span>
                <LocationPicker locations={allowedLocations} value={editingVisit.officeName ? { name: editingVisit.officeName, city: editingVisit.city, brand: editingVisit.type } : null} onChange={(loc) => { if (loc) setEditingVisit((p) => ({ ...p, officeName: loc.name, city: loc.city, type: loc.brand || p.type })); else setEditingVisit((p) => ({ ...p, officeName: '', city: '', type: '' })) }} placeholder="ابحث واختر الموقع..." />
              </div>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>المدينة</span><input value={editingVisit.city} onChange={(e) => setEditingVisit((p) => ({ ...p, city: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>البراند</span>
                <select value={editingVisit.type} onChange={(e) => setEditingVisit((p) => ({ ...p, type: e.target.value }))} className={inputClasses}>
                  <option value="">اختر البراند</option>
                  {(brands || []).filter(b => b.key !== 'all').filter(b => !userBrands || userBrands.includes(b.key)).map((b) => (
                    <option key={b.key} value={b.key}>{b.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>الحالة</span><select value={editingVisit.status} onChange={(e) => setEditingVisit((p) => ({ ...p, status: e.target.value }))} className={inputClasses}><option value="معلقة">زيارة جديدة</option><option value="قادمة">إعادة الزيارة</option><option value="جاري المسح">جاري المسح</option></select></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>التاريخ</span><input type="date" value={editingVisit.date} onChange={(e) => setEditingVisit((p) => ({ ...p, date: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>الفترة</span><select value={editingVisit.time} onChange={(e) => setEditingVisit((p) => ({ ...p, time: e.target.value }))} className={inputClasses}><option value="صباحية">صباحية</option><option value="مسائية">مسائية</option></select></label>
              {canAssignShopper && (
                <label className="space-y-1 text-sm text-cb-gray-600 sm:col-span-2"><span>الوكيل الميداني</span>
                  <select value={editingVisit.assignedShopperId ?? ''} onChange={(e) => setEditingVisit((p) => ({ ...p, assignedShopperId: e.target.value }))} className={inputClasses}>
                    <option value="">في انتظار التعيين</option>
                    {shoppers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              )}
              <label className="space-y-1 text-sm text-cb-gray-600 sm:col-span-2"><span>تفاصيل السيناريو</span><textarea value={editingVisit.scenario} onChange={(e) => setEditingVisit((p) => ({ ...p, scenario: e.target.value }))} rows={3} className="w-full rounded-xl border border-cb-gray-300 bg-white p-3 outline-none focus:border-cb-lime" /></label>
              <button type="button" onClick={handleSaveEdit} className="h-11 rounded-xl bg-cb-lime text-sm font-bold text-white transition hover:bg-cb-lime-dark sm:col-span-2">حفظ التعديلات</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
