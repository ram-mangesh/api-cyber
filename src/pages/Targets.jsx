import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Plus, Trash2, Search, Globe, RefreshCw, Settings, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const critLabel = (v) => v >= 30 ? 'High' : v >= 20 ? 'Medium' : 'Low'
const critColor = (v) => v >= 30
  ? { bg: '#fee2e2', color: '#dc2626' }
  : v >= 20
  ? { bg: '#fef9c3', color: '#a16207' }
  : { bg: '#dcfce7', color: '#16a34a' }

export default function Targets() {
  const { theme } = useTheme()
  const api = useApiClient()
  const navigate = useNavigate()
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ address: '', description: '', criticality: 20 })
  const [selected, setSelected] = useState([])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.targets.getAll()
      setTargets(res.data?.targets || [])
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = targets.filter(t =>
    (t.address || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const addTarget = async () => {
    if (!form.address) return
    try {
      await api.targets.create(form)
      setForm({ address: '', description: '', criticality: 20 })
      setShowAdd(false)
      load()
    } catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const exportCsv = async () => {
    try {
      const res = await api.targets.csvExport()
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a'); a.href = url; a.download = `targets-export.csv`; a.click()
    } catch (e) {
      alert('Export error: ' + (e.response?.data?.message || e.message))
    }
  }

  const deleteSelected = async () => {
    try {
      await api.targets.deleteMany(selected)
      setSelected([])
      load()
    } catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Scan Targets</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>{targets.length} targets configured</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }} title="Refresh"><RefreshCw size={15} /></button>
          <button onClick={exportCsv} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }} title="Export CSV"><Download size={15} /></button>
          {selected.length > 0 && (
            <button onClick={deleteSelected} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: '#dc2626' }}>
              <Trash2 size={15} /> Delete ({selected.length})
            </button>
          )}
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>
            <Plus size={15} /> Add Target
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-80" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <Search size={14} style={{ color: theme.textMuted }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search targets..." className="bg-transparent text-sm outline-none w-full" style={{ color: theme.text }} />
      </div>

      {showAdd && (
        <div className="rounded-2xl p-5 shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>Add New Target</h3>
          <div className="grid grid-cols-3 gap-3">
            <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="https://example.com" className="px-3 py-2.5 rounded-xl text-sm outline-none col-span-1" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <select value={form.criticality} onChange={e => setForm(p => ({ ...p, criticality: Number(e.target.value) }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
              <option value={10}>Low</option>
              <option value={20}>Medium</option>
              <option value={30}>High</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addTarget} className="px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>Save</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Cancel</button>
          </div>
        </div>
      )}

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}

      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        {loading ? (
          <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: theme.bg }}>
                <th className="w-10 px-4 py-3"><input type="checkbox" onChange={e => setSelected(e.target.checked ? filtered.map(t => t.target_id) : [])} /></th>
                {['Address', 'Description', 'Criticality', 'Last Scan', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const c = critColor(t.criticality)
                return (
                  <tr key={t.target_id} style={{ borderTop: `1px solid ${theme.border}` }}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(t.target_id)} onChange={() => toggle(t.target_id)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Globe size={14} style={{ color: theme.primary }} />
                        <span className="font-medium" style={{ color: theme.text }}>{t.address}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: theme.textMuted }}>{t.description || '-'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: c.bg, color: c.color }}>{critLabel(t.criticality)}</span></td>
                    <td className="px-4 py-3 text-xs" style={{ color: theme.textMuted }}>{t.last_scan_date || '-'}</td>
                    <td className="px-4 py-3 flex gap-1">
                      <button onClick={() => navigate(`/targets/${t.target_id}/config`)} className="p-1.5 rounded-lg" style={{ color: theme.primary }} title="Configure"><Settings size={14} /></button>
                      <button onClick={async () => { await api.targets.deleteMany([t.target_id]); load() }} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }} title="Delete"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No targets found</div>}
      </div>
    </div>
  )
}
