import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Plus, Trash2, RefreshCw, Edit2, Save, X, ShieldCheck } from 'lucide-react'

export default function Roles() {
  const { theme } = useTheme()
  const api = useApiClient()
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', permissions: [] })
  const [editForm, setEditForm] = useState({})

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [rRes, pRes] = await Promise.all([api.roles.getAll(), api.roles.getPermissions()])
      setRoles(rRes.data?.roles || [])
      setPermissions(pRes.data?.permissions || [])
    } catch (e) { setError(e.response?.data?.message || e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const addRole = async () => {
    if (!form.name) return
    try { await api.roles.create(form); setForm({ name: '', permissions: [] }); setShowAdd(false); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const saveEdit = async (id) => {
    try { await api.roles.update(id, editForm); setEditing(null); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const remove = async (id) => { try { await api.roles.delete(id); load() } catch (e) { alert(e.message) } }

  const togglePerm = (arr, perm, setter) => {
    setter(p => ({
      ...p,
      permissions: arr.includes(perm) ? arr.filter(x => x !== perm) : [...arr, perm]
    }))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Roles & Permissions</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>{roles.length} roles defined</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>
            <Plus size={15} /> New Role
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold" style={{ color: theme.text }}>Create New Role</h3>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Role name"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
          {permissions.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: theme.textMuted }}>Permissions:</p>
              <div className="grid grid-cols-3 gap-2">
                {permissions.map(p => (
                  <label key={p} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: theme.text }}>
                    <input type="checkbox" checked={form.permissions.includes(p)}
                      onChange={() => togglePerm(form.permissions, p, setForm)} />
                    {p.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={addRole} className="px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>Save</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Cancel</button>
          </div>
        </div>
      )}

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}

      <div className="space-y-3">
        {loading ? <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>Loading...</div> :
          roles.map(r => (
            <div key={r.role_id} className="rounded-2xl p-5 shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck size={16} style={{ color: theme.primary }} />
                {editing === r.role_id ? (
                  <input value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none font-semibold" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
                ) : (
                  <span className="flex-1 font-semibold text-sm" style={{ color: theme.text }}>{r.name}</span>
                )}
                <div className="flex gap-1">
                  {editing === r.role_id ? (
                    <>
                      <button onClick={() => saveEdit(r.role_id)} className="p-1.5 rounded-lg" style={{ color: '#16a34a' }}><Save size={14} /></button>
                      <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg" style={{ color: '#6b7280' }}><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditing(r.role_id); setEditForm({ name: r.name, permissions: r.permissions || [] }) }}
                        className="p-1.5 rounded-lg" style={{ color: theme.primary }}><Edit2 size={14} /></button>
                      <button onClick={() => remove(r.role_id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
              {/* Permissions */}
              <div className="flex flex-wrap gap-1.5">
                {(editing === r.role_id ? (editForm.permissions || []) : (r.permissions || [])).map(p => (
                  <span key={p} className="px-2 py-0.5 rounded-lg text-xs font-medium" style={{ background: theme.bg, color: theme.primary, border: `1px solid ${theme.border}` }}>
                    {p.replace(/_/g, ' ')}
                    {editing === r.role_id && (
                      <button onClick={() => setEditForm(prev => ({ ...prev, permissions: prev.permissions.filter(x => x !== p) }))} className="ml-1" style={{ color: '#dc2626' }}>×</button>
                    )}
                  </span>
                ))}
                {editing === r.role_id && permissions.filter(p => !(editForm.permissions || []).includes(p)).map(p => (
                  <button key={p} onClick={() => setEditForm(prev => ({ ...prev, permissions: [...(prev.permissions || []), p] }))}
                    className="px-2 py-0.5 rounded-lg text-xs font-medium opacity-40" style={{ background: theme.bg, color: theme.textMuted, border: `1px dashed ${theme.border}` }}>
                    + {p.replace(/_/g, ' ')}
                  </button>
                ))}
                {!editing && (r.permissions || []).length === 0 && (
                  <span className="text-xs" style={{ color: theme.textMuted }}>No permissions assigned</span>
                )}
              </div>
            </div>
          ))
        }
        {!loading && roles.length === 0 && <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No roles defined</div>}
      </div>
    </div>
  )
}
