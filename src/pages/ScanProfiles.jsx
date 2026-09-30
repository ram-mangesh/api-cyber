import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Plus, Trash2, RefreshCw, Edit2, Save, X } from 'lucide-react'

export default function ScanProfiles() {
  const { theme } = useTheme()
  const api = useApiClient()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', custom: false })
  const [editForm, setEditForm] = useState({})

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.scanProfiles.getAll()
      setProfiles(res.data?.scanning_profiles || [])
    } catch (e) { setError(e.response?.data?.message || e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const addProfile = async () => {
    if (!form.name) return
    try { await api.scanProfiles.create(form); setForm({ name: '', custom: false }); setShowAdd(false); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const saveEdit = async (id) => {
    try { await api.scanProfiles.update(id, editForm); setEditing(null); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const remove = async (id) => {
    try { await api.scanProfiles.delete(id); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Scanning Profiles</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>{profiles.length} profiles available</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>
            <Plus size={15} /> New Profile
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>New Scanning Profile</h3>
          <div className="flex gap-3">
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Profile name" className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: theme.text }}>
              <input type="checkbox" checked={form.custom} onChange={e => setForm(p => ({ ...p, custom: e.target.checked }))} />
              Custom
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addProfile} className="px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>Save</button>
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
                {['Name', 'Type', 'Checks', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.profile_id} style={{ borderTop: `1px solid ${theme.border}` }}>
                  <td className="px-5 py-3 font-medium" style={{ color: theme.text }}>
                    {editing === p.profile_id ? (
                      <input value={editForm.name || p.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="px-2 py-1 rounded-lg text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
                    ) : p.name}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: p.custom ? theme.bg : '#dbeafe', color: p.custom ? theme.primary : '#1d4ed8', border: p.custom ? `1px solid ${theme.border}` : 'none' }}>
                      {p.custom ? 'Custom' : 'Built-in'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{p.checks?.length || '-'}</td>
                  <td className="px-5 py-3 flex gap-1 items-center">
                    {editing === p.profile_id ? (
                      <>
                        <button onClick={() => saveEdit(p.profile_id)} className="p-1.5 rounded-lg" style={{ color: '#16a34a' }}><Save size={14} /></button>
                        <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg" style={{ color: '#6b7280' }}><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        {p.custom && <button onClick={() => { setEditing(p.profile_id); setEditForm({ name: p.name }) }} className="p-1.5 rounded-lg" style={{ color: theme.primary }}><Edit2 size={14} /></button>}
                        {p.custom && <button onClick={() => remove(p.profile_id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && profiles.length === 0 && <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No profiles found</div>}
      </div>
    </div>
  )
}
