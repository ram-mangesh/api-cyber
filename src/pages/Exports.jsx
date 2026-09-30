import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Plus, Trash2, RefreshCw, Download, Archive } from 'lucide-react'

export default function Exports() {
  const { theme } = useTheme()
  const api = useApiClient()
  const [exports, setExports] = useState([])
  const [exportTypes, setExportTypes] = useState([])
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ export_id: '', source: { list_type: 'targets', id_list: [] } })

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [expRes, typeRes, tgtRes] = await Promise.all([
        api.exports.getAll(), api.exports.getTypes(), api.targets.getAll()
      ])
      setExports(expRes.data?.exports || [])
      setExportTypes(typeRes.data?.export_types || [])
      setTargets(tgtRes.data?.targets || [])
    } catch (e) { setError(e.response?.data?.message || e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.export_id) return
    try { await api.exports.create(form); setShowNew(false); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const downloadExport = async (eObj) => {
    try {
      const paths = eObj.download || []
      const downloadPath = paths[0]
      if (!downloadPath) return alert('No download available yet.')

      const safePath = downloadPath.replace(/^\/api\/v1/, '')
      const res = await api.raw.get(safePath, { responseType: 'blob' })
      const ext = downloadPath.split('.').pop() || 'zip'
      
      let mimeType = 'application/octet-stream'
      if (ext === 'pdf') mimeType = 'application/pdf'
      else if (ext === 'html') mimeType = 'text/html'
      else if (ext === 'csv') mimeType = 'text/csv'

      const url = URL.createObjectURL(new Blob([res.data], { type: mimeType }))
      const a = document.createElement('a'); a.href = url; a.download = `export-${eObj.export_id}.${ext}`; a.click()
    } catch (e) { 
      console.error(e)
      alert('Download error: ' + (e.response?.data?.message || e.message)) 
    }
  }

  const remove = async (id) => { try { await api.exports.delete(id); load() } catch (e) { alert(e.message) } }

  const statusStyle = (s) => ({
    completed: { bg: '#dcfce7', color: '#16a34a' },
    processing: { bg: '#dbeafe', color: '#1d4ed8' },
    failed: { bg: '#fee2e2', color: '#dc2626' },
  }[s] || { bg: '#f3f4f6', color: '#6b7280' })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Exports</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>{exports.length} exports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>
            <Plus size={15} /> New Export
          </button>
        </div>
      </div>

      {showNew && (
        <div className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>New Export</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.export_id} onChange={e => setForm(p => ({ ...p, export_id: e.target.value }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
              <option value="">Select Export Type</option>
              {exportTypes.map(t => <option key={t.export_id} value={t.export_id}>{t.name}</option>)}
            </select>
            <select onChange={e => setForm(p => ({ ...p, source: { list_type: 'targets', id_list: [e.target.value] } }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
              <option value="">Select Target</option>
              {targets.map(t => <option key={t.target_id} value={t.target_id}>{t.address}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={create} className="px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>Create</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Cancel</button>
          </div>
        </div>
      )}

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}

      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        {loading ? <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>Loading...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: theme.bg }}>
                {['Export', 'Type', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exports.map(e => {
                const st = statusStyle(e.status)
                return (
                  <tr key={e.export_id} style={{ borderTop: `1px solid ${theme.border}` }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Archive size={14} style={{ color: theme.primary }} />
                        <span className="font-medium" style={{ color: theme.text }}>{e.export_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{e.export_id}</td>
                    <td className="px-5 py-3"><span className="px-2 py-1 rounded-lg text-xs font-semibold capitalize" style={{ background: st.bg, color: st.color }}>{e.status || '-'}</span></td>
                    <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{e.created ? new Date(e.created).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-3 flex gap-2 items-center">
                      {e.status === 'completed' && <button onClick={() => downloadExport(e)} className="p-1.5 rounded-lg" style={{ color: theme.primary }} title="Download"><Download size={14} /></button>}
                      <button onClick={() => remove(e.export_id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && exports.length === 0 && <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No exports found</div>}
      </div>
    </div>
  )
}
