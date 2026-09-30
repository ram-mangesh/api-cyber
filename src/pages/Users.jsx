import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Plus, Trash2, UserCheck, UserX, RefreshCw } from 'lucide-react'

export default function Users() {
  const { theme } = useTheme()
  const api = useApiClient()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role_id: '', password: '' })

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [uRes, rRes] = await Promise.all([api.users.getAll(), api.roles.getAll()])
      setUsers(uRes.data?.users || [])
      setRoles(rRes.data?.roles || [])
    } catch (e) { setError(e.response?.data?.message || e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const addUser = async () => {
    if (!form.email) return
    try { await api.users.create(form); setForm({ first_name: '', last_name: '', email: '', role_id: '', password: '' }); setShowAdd(false); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const toggleEnabled = async (u) => {
    try {
      if (u.enabled) await api.users.disable([u.user_id])
      else await api.users.enable([u.user_id])
      load()
    } catch (e) { alert(e.message) }
  }

  const remove = async (id) => {
    try { await api.users.deleteMany([id]); load() }
    catch (e) { alert(e.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Users</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>{users.length} users registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>
            <Plus size={15} /> Add User
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>Add New User</h3>
          <div className="grid grid-cols-3 gap-3">
            <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} placeholder="First Name" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Last Name" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" type="email" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Password" type="password" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <select value={form.role_id} onChange={e => setForm(p => ({ ...p, role_id: e.target.value }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
              <option value="">Select Role</option>
              {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addUser} className="px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>Save</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Cancel</button>
          </div>
        </div>
      )}

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}

      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        {loading ? <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>Loading...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: theme.bg }}>
                {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id} style={{ borderTop: `1px solid ${theme.border}` }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: theme.primary }}>
                        {(u.first_name || '?')[0]}{(u.last_name || '')[0]}
                      </div>
                      <span className="font-medium" style={{ color: theme.text }}>{u.first_name} {u.last_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3" style={{ color: theme.textMuted }}>{u.email}</td>
                  <td className="px-5 py-3"><span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: theme.bg, color: theme.primary, border: `1px solid ${theme.border}` }}>{u.role?.name || u.role_id || '-'}</span></td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: u.enabled ? '#dcfce7' : '#fee2e2', color: u.enabled ? '#16a34a' : '#dc2626' }}>
                      {u.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-5 py-3 flex gap-1">
                    <button onClick={() => toggleEnabled(u)} className="p-1.5 rounded-lg" style={{ color: u.enabled ? '#ea580c' : '#16a34a' }} title={u.enabled ? 'Disable' : 'Enable'}>
                      {u.enabled ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    <button onClick={() => remove(u.user_id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && users.length === 0 && <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No users found</div>}
      </div>
    </div>
  )
}
