import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Play, Square, Trash2, Plus, RefreshCw, RotateCcw, ChevronRight, Edit2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const statusStyle = (s) => ({
  completed: { bg: '#dcfce7', color: '#16a34a', label: 'Completed' },
  processing: { bg: '#dbeafe', color: '#1d4ed8', label: 'Running' },
  scheduled: { bg: '#fef9c3', color: '#a16207', label: 'Scheduled' },
  aborted: { bg: '#fee2e2', color: '#dc2626', label: 'Aborted' },
  failed: { bg: '#fee2e2', color: '#dc2626', label: 'Failed' },
  paused: { bg: '#f3f4f6', color: '#6b7280', label: 'Paused' },
}[s] || { bg: '#f3f4f6', color: '#6b7280', label: s })

const threatLabel = (t) => ['None', 'Low', 'Medium', 'High', 'Critical'][t] || '-'
const threatColor = (t) => [null, '#16a34a', '#a16207', '#ea580c', '#dc2626'][t] || '#6b7280'

export default function Scans() {
  const { theme } = useTheme()
  const api = useApiClient()
  const navigate = useNavigate()
  const [scans, setScans] = useState([])
  const [profiles, setProfiles] = useState([])
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [editingScan, setEditingScan] = useState(null)
  const [form, setForm] = useState({ target_id: '', profile_id: '', schedule: null })

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [scansRes, profilesRes, targetsRes] = await Promise.all([
        api.scans.getAll(),
        api.scanProfiles.getAll(),
        api.targets.getAll(),
      ])
      setScans(scansRes.data?.scans || [])
      setProfiles(profilesRes.data?.scanning_profiles || [])
      setTargets(targetsRes.data?.targets || [])
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const startScan = async () => {
    if (!form.target_id || !form.profile_id) return
    try {
      if (editingScan) {
        await api.raw.patch(`/scans/${editingScan}`, { profile_id: form.profile_id })
        setEditingScan(null)
      } else {
        await api.scans.create({ target_id: form.target_id, profile_id: form.profile_id, schedule: form.schedule })
      }
      setForm({ target_id: '', profile_id: '', schedule: null })
      setShowNew(false)
      load()
    } catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const abort = async (id) => { try { await api.scans.abort(id); load() } catch (e) { alert(e.message) } }
  const resume = async (id) => { try { await api.scans.resume(id); load() } catch (e) { alert(e.message) } }
  const remove = async (id) => { try { await api.scans.delete(id); load() } catch (e) { alert(e.message) } }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Scans</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>{scans.length} scans total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>
            <Plus size={15} /> New Scan
          </button>
        </div>
      </div>

      {showNew && (
        <div className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>{editingScan ? 'Edit Scan' : 'Start New Scan'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <select disabled={!!editingScan} value={form.target_id} onChange={e => setForm(p => ({ ...p, target_id: e.target.value }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, opacity: editingScan ? 0.7 : 1 }}>
              <option value="">Select Target</option>
              {targets.map(t => <option key={t.target_id} value={t.target_id}>{t.address}</option>)}
            </select>
            <select value={form.profile_id} onChange={e => setForm(p => ({ ...p, profile_id: e.target.value }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
              <option value="">Select Profile</option>
              {profiles.map(p => <option key={p.profile_id} value={p.profile_id}>{p.name}</option>)}
            </select>
            {!editingScan && (
              <label className="flex items-center gap-2 text-sm mt-2 ml-1" style={{ color: theme.text }}>
                <input type="checkbox" checked={form.schedule !== null} onChange={e => setForm(p => ({ ...p, schedule: e.target.checked ? { enable: true, start_date: new Date().toISOString() } : null }))} />
                Schedule for later
              </label>
            )}
          </div>
          <div className="flex gap-2 mt-3 text-sm text-white font-medium">
            <button onClick={startScan} className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: theme.primary }}>{editingScan ? 'Update' : <><Play size={14} /> Start</>}</button>
            <button onClick={() => { setShowNew(false); setEditingScan(null); setForm({ target_id: '', profile_id: '', schedule: null }) }} className="px-4 py-2 rounded-xl" style={{ background: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Cancel</button>
          </div>
        </div>
      )}

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}

      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        {loading ? <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>Loading...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: theme.bg }}>
                {['Target', 'Profile', 'Status', 'Threat', 'Started', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scans.map(s => {
                const st = statusStyle(s.current_session?.status || s.status)
                const threat = s.current_session?.severity_counts?.high ? 3 : s.current_session?.severity_counts?.medium ? 2 : 1
                return (
                  <tr key={s.scan_id} style={{ borderTop: `1px solid ${theme.border}` }}>
                    <td className="px-5 py-3 font-medium" style={{ color: theme.text }}>{s.target?.address || s.target_id}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{s.profile?.name || '-'}</td>
                    <td className="px-5 py-3"><span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                    <td className="px-5 py-3"><span className="text-xs font-semibold" style={{ color: threatColor(s.current_session?.threat || 0) }}>{threatLabel(s.current_session?.threat || 0)}</span></td>
                    <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{s.current_session?.start_date ? new Date(s.current_session.start_date).toLocaleString() : '-'}</td>
                    <td className="px-5 py-3 flex gap-1 items-center">
                      <button onClick={() => navigate(`/scans/${s.scan_id}`)} className="p-1.5 rounded-lg" style={{ color: theme.primary }}><ChevronRight size={14} /></button>
                      <button onClick={() => { setEditingScan(s.scan_id); setForm({ target_id: s.target_id, profile_id: s.profile_id, schedule: null }); setShowNew(true); }} className="p-1.5 rounded-lg" style={{ color: theme.primary }} title="Edit"><Edit2 size={14} /></button>
                      {(st.label === 'Running') && <button onClick={() => abort(s.scan_id)} className="p-1.5 rounded-lg" style={{ color: '#ea580c' }} title="Abort"><Square size={14} /></button>}
                      {(st.label === 'Paused') && <button onClick={() => resume(s.scan_id)} className="p-1.5 rounded-lg" style={{ color: '#16a34a' }} title="Resume"><Play size={14} /></button>}
                      <button onClick={() => remove(s.scan_id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }} title="Delete"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && scans.length === 0 && <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No scans found</div>}
      </div>
    </div>
  )
}
