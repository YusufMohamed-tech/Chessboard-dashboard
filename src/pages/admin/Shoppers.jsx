import { Plus, Search, Pencil, Trash2, X, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import { EmptyState, ErrorState, LoadingState } from '../../components/DataState'
import PointsBadge from '../../components/PointsBadge'
import useDebouncedValue from '../../hooks/useDebouncedValue'

export default function Shoppers() {
  const { shoppers, addShopper, updateShopper, deleteShopper, dataLoading, dataError } = useOutletContext()

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [newShopper, setNewShopper] = useState({ name: '', email: '', password: '', city: '', primaryPhone: '', whatsappPhone: '', status: 'نشط' })

  const filtered = useMemo(() => {
    return shoppers.filter((s) => `${s.name} ${s.email} ${s.city}`.toLowerCase().includes(debouncedQuery.toLowerCase()))
  }, [shoppers, debouncedQuery])

  const handleAdd = async (e) => {
    e.preventDefault()
    await addShopper(newShopper)
    setNewShopper({ name: '', email: '', password: '', city: '', primaryPhone: '', whatsappPhone: '', status: 'نشط' })
    setIsAddOpen(false)
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    await updateShopper(editing.id, editing)
    setEditing(null)
  }

  const handleDelete = async (id) => {
    if (window.confirm('هل تريد حذف هذا الوكيل الميداني؟')) await deleteShopper(id)
  }

  if (dataLoading) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} />

  const inputClasses = "h-11 w-full rounded-xl border border-cb-gray-300 bg-white px-3 outline-none focus:border-cb-lime focus:ring-2 focus:ring-cb-lime-200"

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-display text-2xl font-black text-cb-gray-900">إدارة الوكلاء الميدانيون</h2>
            <p className="text-sm text-cb-gray-500">إدارة فريق المتحريين الخفيين</p>
          </div>
          <button type="button" onClick={() => setIsAddOpen(true)} className="ms-auto inline-flex items-center gap-2 rounded-xl bg-cb-lime px-4 py-2 text-sm font-bold text-white transition hover:bg-cb-lime-dark">
            <Plus className="h-4 w-4" /> إضافة وكيل
          </button>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cb-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="البحث بالاسم أو المدينة..."
            className="h-11 w-full rounded-xl border border-cb-gray-300 bg-white pe-10 ps-4 text-sm outline-none transition focus:border-cb-lime focus:ring-2 focus:ring-cb-lime-200" />
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} message="لا يوجد وكلاء مطابقون" actionLabel="إضافة وكيل" onAction={() => setIsAddOpen(true)} />
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <article key={s.id} className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm card-hover">
              <div className="flex items-center gap-3">
                <Avatar name={s.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-cb-gray-900 truncate">{s.name}</p>
                  <p className="text-sm text-cb-gray-500 truncate">{s.email}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${s.status === 'نشط' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-cb-gray-100 text-cb-gray-600 border-cb-gray-200'}`}>
                  {s.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-cb-gray-50 p-2"><p className="text-xs text-cb-gray-500">المدينة</p><p className="text-sm font-bold text-cb-gray-800">{s.city}</p></div>
                <div className="rounded-lg bg-cb-gray-50 p-2"><p className="text-xs text-cb-gray-500">الزيارات</p><p className="text-sm font-bold text-cb-gray-800">{s.visits}</p></div>
                <div className="rounded-lg bg-cb-lime-50 p-2"><p className="text-xs text-cb-lime-700">النقاط</p><p className="text-sm font-bold text-cb-lime-800">{s.points}</p></div>
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setEditing({ ...s })} className="flex-1 rounded-xl border border-cb-gray-300 py-1.5 text-sm font-bold text-cb-gray-700 hover:bg-cb-gray-100 transition">
                  <Pencil className="inline h-3.5 w-3.5 me-1" /> تعديل
                </button>
                <button type="button" onClick={() => handleDelete(s.id)} className="rounded-xl border border-rose-300 px-3 py-1.5 text-sm font-bold text-rose-600 hover:bg-rose-50 transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-cb-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-black text-cb-gray-900">إضافة وكيل ميداني</h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="rounded-lg border border-cb-gray-300 p-1.5 text-cb-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm text-cb-gray-600"><span>الاسم</span><input required value={newShopper.name} onChange={(e) => setNewShopper((p) => ({ ...p, name: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>البريد</span><input type="email" required value={newShopper.email} onChange={(e) => setNewShopper((p) => ({ ...p, email: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>كلمة المرور</span><input required value={newShopper.password} onChange={(e) => setNewShopper((p) => ({ ...p, password: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>المدينة</span><input required value={newShopper.city} onChange={(e) => setNewShopper((p) => ({ ...p, city: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>الهاتف</span><input value={newShopper.primaryPhone} onChange={(e) => setNewShopper((p) => ({ ...p, primaryPhone: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>واتساب</span><input value={newShopper.whatsappPhone} onChange={(e) => setNewShopper((p) => ({ ...p, whatsappPhone: e.target.value }))} className={inputClasses} /></label>
              <button type="submit" className="h-11 rounded-xl bg-cb-lime text-sm font-bold text-white transition hover:bg-cb-lime-dark sm:col-span-2">حفظ الوكيل</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-cb-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-black text-cb-gray-900">تعديل بيانات الوكيل</h3>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-cb-gray-300 p-1.5 text-cb-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm text-cb-gray-600"><span>الاسم</span><input value={editing.name} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>المدينة</span><input value={editing.city} onChange={(e) => setEditing((p) => ({ ...p, city: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>الحالة</span>
                <select value={editing.status === 'نشط' ? 'نشط' : 'غير نشط'} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} className={inputClasses}>
                  <option value="نشط">نشط</option><option value="غير نشط">غير نشط</option>
                </select>
              </label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>الهاتف</span><input value={editing.primaryPhone} onChange={(e) => setEditing((p) => ({ ...p, primaryPhone: e.target.value }))} className={inputClasses} /></label>
              <button type="button" onClick={handleSaveEdit} className="h-11 rounded-xl bg-cb-lime text-sm font-bold text-white transition hover:bg-cb-lime-dark sm:col-span-2">حفظ التعديلات</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
