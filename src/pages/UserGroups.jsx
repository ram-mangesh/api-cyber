import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Plus, Trash2, RefreshCw, Users as UsersIcon } from 'lucide-react'

export default function UserGroups() {
  const { theme } = useTheme()
  const api = useApiClient()
  const [groups, setGroups] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '' })

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [gRes, rRes] = await Promise.all([api.userGroups.getAll(), api.roles.getAll()])
      setGroups(gRes.data?.user_groups || [])
      setRoles(rRes.data?.roles || [])
    } catch (e) { setError(e.response?.data?.message || e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const addGroup = async () => {
    if (!form.name) return
    try { await api.userGroups.create(form); setForm({ name: '' }); setShowAdd(false); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const remove = async (id) => { try { await api.userGroups.delete(id); load() } catch (e) { alert(e.message) } }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>User Groups</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>{groups.length} groups</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>
            <Plus size={15} /> New Group
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>New User Group</h3>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Group name" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
          <div className="flex gap-2 mt-3">
            <button onClick={addGroup} className="px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>Save</button>
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
                {['Group Name', 'Members', 'Roles', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr key={g.user_group_id} style={{ borderTop: `1px solid ${theme.border}` }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <UsersIcon size={14} style={{ color: theme.primary }} />
                      <span className="font-medium" style={{ color: theme.text }}>{g.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{g.user_count ?? '-'}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{(g.roles || []).map(r => r.name).join(', ') || '-'}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => remove(g.user_group_id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && groups.length === 0 && <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No user groups found</div>}
      </div>
    </div>
  )
}
