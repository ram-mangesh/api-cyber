import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Plus, Trash2, RefreshCw, Clock } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ExcludedHours() {
  const { theme } = useTheme()
  const api = useApiClient()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', excluded_hours: [] })

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.excludedHours.getAll()
      setProfiles(res.data?.excluded_hours_profiles || [])
    } catch (e) { setError(e.response?.data?.message || e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const addProfile = async () => {
    if (!form.name) return
    try { await api.excludedHours.create(form); setForm({ name: '', excluded_hours: [] }); setShowAdd(false); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const remove = async (id) => { try { await api.excludedHours.delete(id); load() } catch (e) { alert(e.message) } }

  const toggleHour = (day, hour) => {
    setForm(p => {
      const exists = p.excluded_hours.find(h => h.day === day && h.hour === hour)
      if (exists) return { ...p, excluded_hours: p.excluded_hours.filter(h => !(h.day === day && h.hour === hour)) }
      return { ...p, excluded_hours: [...p.excluded_hours, { day, hour }] }
    })
  }

  const isExcluded = (day, hour) => form.excluded_hours.some(h => h.day === day && h.hour === hour)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Excluded Hours</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Define time windows when scans should not run</p>
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
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>New Excluded Hours Profile</h3>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Profile name" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-4" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />

          <p className="text-xs font-medium mb-2" style={{ color: theme.textMuted }}>Click hours to exclude (gray = excluded):</p>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="pr-3 text-left font-medium" style={{ color: theme.textMuted }}>Day</th>
                  {Array.from({ length: 24 }, (_, i) => (
                    <th key={i} className="w-7 text-center" style={{ color: theme.textMuted }}>{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, di) => (
                  <tr key={day}>
                    <td className="pr-3 py-0.5 font-medium" style={{ color: theme.text }}>{day.slice(0, 3)}</td>
                    {Array.from({ length: 24 }, (_, h) => (
                      <td key={h} className="py-0.5 px-0.5">
                        <button
                          onClick={() => toggleHour(di, h)}
                          className="w-6 h-6 rounded"
                          style={{ background: isExcluded(di, h) ? theme.primary : theme.bg, border: `1px solid ${theme.border}` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={addProfile} className="px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>Save</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Cancel</button>
          </div>
        </div>
      )}

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}

      <div className="space-y-3">
        {loading ? <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>Loading...</div> :
          profiles.length === 0 ? <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No profiles defined</div> :
          profiles.map(p => (
            <div key={p.excluded_hours_id} className="rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              <Clock size={16} style={{ color: theme.primary }} />
              <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: theme.text }}>{p.name}</div>
                <div className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{(p.excluded_hours || []).length} time slots excluded</div>
              </div>
              <button onClick={() => remove(p.excluded_hours_id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
            </div>
          ))
        }
      </div>
    </div>
  )
}
