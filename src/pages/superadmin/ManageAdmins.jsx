import { Plus, Pencil, Trash2, X, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import { EmptyState, ErrorState, LoadingState } from '../../components/DataState'

export default function ManageAdmins() {
  const {
    superAdmins, opsAdmins, subAdmins, brands,
    canManageSuperAdmins, canManageOpsAdmins,
    addSuperAdmin, updateSuperAdmin, deleteSuperAdmin,
    addOpsAdmin, updateOpsAdmin, deleteOpsAdmin,
    addSubAdmin, updateSubAdmin, deleteSubAdmin,
    dataLoading, dataError,
  } = useOutletContext()

  const brandOptions = (brands || []).filter(b => b.key !== 'all')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addRole, setAddRole] = useState('admin')
  const [editing, setEditing] = useState(null)
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', city: '', status: 'نشط', assignedBrands: [] })

  const toggleBrand = (brandKey, setter) => {
    setter((prev) => {
      const current = prev.assignedBrands || []
      return { ...prev, assignedBrands: current.includes(brandKey) ? current.filter(b => b !== brandKey) : [...current, brandKey] }
    })
  }

  if (dataLoading) return <LoadingState />
  if (dataError) return <ErrorState message={dataError} />

  const inputClasses = "h-11 w-full rounded-xl border border-cb-gray-300 bg-white px-3 outline-none focus:border-cb-lime focus:ring-2 focus:ring-cb-lime-200"

  const handleAdd = async (e) => {
    e.preventDefault()
    const payload = { ...newAdmin }
    if (addRole === 'superadmin') await addSuperAdmin(payload)
    else if (addRole === 'ops') await addOpsAdmin(payload)
    else await addSubAdmin(payload)
    setNewAdmin({ name: '', email: '', password: '', city: '', status: 'نشط', assignedBrands: [] })
    setIsAddOpen(false)
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    const { id, role, ...updates } = editing
    if (role === 'superadmin') await updateSuperAdmin(id, updates)
    else if (role === 'ops') await updateOpsAdmin(id, updates)
    else await updateSubAdmin(id, updates)
    setEditing(null)
  }

  const handleDelete = async (id, role) => {
    if (!window.confirm('هل تريد حذف هذا المدير؟')) return
    if (role === 'superadmin') await deleteSuperAdmin(id)
    else if (role === 'ops') await deleteOpsAdmin(id)
    else await deleteSubAdmin(id)
  }

  const roleLabel = (r) => r === 'superadmin' ? 'سوبر أدمن' : r === 'ops' ? 'عمليات' : 'مدير'
  const roleColor = (r) => r === 'superadmin' ? 'bg-cb-lime text-white' : r === 'ops' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'

  const renderSection = (title, admins, role, canManage) => (
    <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-black text-cb-gray-900">{title}</h3>
        {canManage && (
          <button type="button" onClick={() => { setAddRole(role); setIsAddOpen(true) }}
            className="inline-flex items-center gap-1 rounded-xl bg-cb-lime px-3 py-1.5 text-sm font-bold text-white transition hover:bg-cb-lime-dark">
            <Plus className="h-4 w-4" /> إضافة
          </button>
        )}
      </div>
      {admins.length === 0 ? (
        <p className="text-sm text-cb-gray-500 text-center py-4">لا يوجد {title.toLowerCase()}</p>
      ) : (
        <div className="space-y-2">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-cb-gray-200 bg-cb-gray-50 p-3 card-hover">
              <Avatar name={a.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-cb-gray-900 truncate">{a.name}</p>
                <p className="text-xs text-cb-gray-500">{a.email} • {a.city}</p>
                {a.assignedBrands?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {a.assignedBrands.map((bk) => {
                      const br = brandOptions.find(b => b.key === bk)
                      return br ? (
                        <span key={bk} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-cb-gray-100 text-cb-gray-700">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: br.color }} />
                          {br.label}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                {(!a.assignedBrands || a.assignedBrands.length === 0) && role !== 'superadmin' && (
                  <p className="mt-0.5 text-[10px] text-cb-gray-400">جميع البراندات</p>
                )}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${roleColor(role)}`}>{roleLabel(role)}</span>
              {canManage && (
                <div className="flex gap-1">
                  <button type="button" onClick={() => setEditing({ ...a, role })} className="rounded-lg border border-cb-gray-300 p-1 text-cb-gray-600 hover:bg-cb-gray-100">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDelete(a.id, role)} className="rounded-lg border border-rose-300 p-1 text-rose-600 hover:bg-rose-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-cb-gray-200 bg-white p-4 shadow-sm">
        <h2 className="font-display text-2xl font-black text-cb-gray-900">إدارة المديرين</h2>
        <p className="text-sm text-cb-gray-500">إدارة فريق الإدارة والعمليات</p>
      </section>

      {canManageSuperAdmins && renderSection('سوبر أدمن', superAdmins, 'superadmin', true)}
      {renderSection('مديرين', subAdmins, 'admin', true)}
      {canManageOpsAdmins && renderSection('فريق العمليات', opsAdmins, 'ops', true)}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-cb-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-black text-cb-gray-900">إضافة {roleLabel(addRole)}</h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="rounded-lg border border-cb-gray-300 p-1.5 text-cb-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="mt-4 grid gap-3">
              <label className="space-y-1 text-sm text-cb-gray-600"><span>الاسم</span><input required value={newAdmin.name} onChange={(e) => setNewAdmin((p) => ({ ...p, name: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>البريد</span><input type="email" required value={newAdmin.email} onChange={(e) => setNewAdmin((p) => ({ ...p, email: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>كلمة المرور</span><input required value={newAdmin.password} onChange={(e) => setNewAdmin((p) => ({ ...p, password: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>المدينة</span><input value={newAdmin.city} onChange={(e) => setNewAdmin((p) => ({ ...p, city: e.target.value }))} className={inputClasses} /></label>
              {addRole !== 'superadmin' && (
                <div className="space-y-2 text-sm text-cb-gray-600">
                  <span className="font-semibold">البراندات المخصصة</span>
                  <p className="text-xs text-cb-gray-400">اترك فارغاً لعرض جميع البراندات</p>
                  <div className="flex flex-wrap gap-2">
                    {brandOptions.map((b) => (
                      <button key={b.key} type="button" onClick={() => toggleBrand(b.key, setNewAdmin)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                          newAdmin.assignedBrands.includes(b.key)
                            ? 'border-cb-lime bg-cb-lime/10 text-cb-gray-900'
                            : 'border-cb-gray-300 text-cb-gray-500 hover:border-cb-gray-400'
                        }`}>
                        <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" className="h-11 rounded-xl bg-cb-lime text-sm font-bold text-white transition hover:bg-cb-lime-dark">حفظ</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-cb-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-black text-cb-gray-900">تعديل {editing.name}</h3>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-cb-gray-300 p-1.5 text-cb-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="space-y-1 text-sm text-cb-gray-600"><span>الاسم</span><input value={editing.name} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>المدينة</span><input value={editing.city} onChange={(e) => setEditing((p) => ({ ...p, city: e.target.value }))} className={inputClasses} /></label>
              <label className="space-y-1 text-sm text-cb-gray-600"><span>الحالة</span>
                <select value={editing.status === 'نشط' ? 'نشط' : 'غير نشط'} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))} className={inputClasses}>
                  <option value="نشط">نشط</option><option value="غير نشط">غير نشط</option>
                </select>
              </label>
              {editing.role !== 'superadmin' && (
                <div className="space-y-2 text-sm text-cb-gray-600">
                  <span className="font-semibold">البراندات المخصصة</span>
                  <p className="text-xs text-cb-gray-400">اترك فارغاً لعرض جميع البراندات</p>
                  <div className="flex flex-wrap gap-2">
                    {brandOptions.map((b) => (
                      <button key={b.key} type="button" onClick={() => toggleBrand(b.key, setEditing)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                          (editing.assignedBrands || []).includes(b.key)
                            ? 'border-cb-lime bg-cb-lime/10 text-cb-gray-900'
                            : 'border-cb-gray-300 text-cb-gray-500 hover:border-cb-gray-400'
                        }`}>
                        <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button type="button" onClick={handleSaveEdit} className="h-11 rounded-xl bg-cb-lime text-sm font-bold text-white transition hover:bg-cb-lime-dark">حفظ التعديلات</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
