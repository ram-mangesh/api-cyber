import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Plus, Trash2, RefreshCw, Folder, Globe } from 'lucide-react'

export default function TargetGroups() {
  const { theme } = useTheme()
  const api = useApiClient()
  const [groups, setGroups] = useState([])
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [expanded, setExpanded] = useState(null)
  const [groupTargets, setGroupTargets] = useState({})

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [grpRes, tgtRes] = await Promise.all([api.targetGroups.getAll(), api.targets.getAll()])
      setGroups(grpRes.data?.groups || [])
      setTargets(tgtRes.data?.targets || [])
    } catch (e) { setError(e.response?.data?.message || e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const loadGroupTargets = async (id) => {
    if (groupTargets[id]) return
    try {
      const res = await api.targetGroups.getTargets(id)
      setGroupTargets(p => ({ ...p, [id]: res.data?.targets || [] }))
    } catch (e) { console.error(e) }
  }

  const toggleExpand = (id) => {
    if (expanded === id) { setExpanded(null) }
    else { setExpanded(id); loadGroupTargets(id) }
  }

  const addGroup = async () => {
    if (!form.name) return
    try { await api.targetGroups.create(form); setForm({ name: '', description: '' }); setShowAdd(false); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const remove = async (id) => {
    try { await api.targetGroups.delete(id); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Target Groups</h1>
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
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>New Target Group</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Group name" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addGroup} className="px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>Save</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Cancel</button>
          </div>
        </div>
      )}

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}

      <div className="space-y-3">
        {loading ? <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>Loading...</div> :
          groups.length === 0 ? <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No groups found</div> :
          groups.map(g => (
            <div key={g.group_id} className="rounded-2xl overflow-hidden shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => toggleExpand(g.group_id)}>
                <Folder size={18} style={{ color: theme.primary }} />
                <div className="flex-1">
                  <div className="font-semibold text-sm" style={{ color: theme.text }}>{g.name}</div>
                  {g.description && <div className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{g.description}</div>}
                </div>
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: theme.bg, color: theme.textMuted }}>{g.target_count || 0} targets</span>
                <button onClick={e => { e.stopPropagation(); remove(g.group_id) }} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
              </div>
              {expanded === g.group_id && (
                <div style={{ borderTop: `1px solid ${theme.border}`, background: theme.bg }} className="px-5 py-3">
                  {groupTargets[g.group_id] ? groupTargets[g.group_id].length === 0 ? (
                    <p className="text-xs" style={{ color: theme.textMuted }}>No targets in this group</p>
                  ) : (
                    <div className="space-y-1">
                      {groupTargets[g.group_id].map(t => (
                        <div key={t.target_id} className="flex items-center gap-2 text-xs py-1">
                          <Globe size={12} style={{ color: theme.primary }} />
                          <span style={{ color: theme.text }}>{t.address}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs" style={{ color: theme.textMuted }}>Loading...</p>}
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  )
}
