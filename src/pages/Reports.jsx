import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Plus, Trash2, Download, FileText, RefreshCw, RotateCcw } from 'lucide-react'

const COMPLIANCE_HINTS = /pci|hipaa|iso|nist|cis\b|gdpr|gxp|fedramp|cjis|fisma|nerc|pisa|cobit|itil|stig|disa|21\s*cfr|soc\s*2|compliance|regulatory|ordinance|congress|as\s*9100/i

function bucketOf(t) {
  const group = String(t.group || '')
  if (/compliance/i.test(group)) return 'compliance'
  if (/standard/i.test(group)) return 'standard'
  return COMPLIANCE_HINTS.test(`${t.name || ''} ${group}`) ? 'compliance' : 'standard'
}

const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''))

const statusStyle = (s) => ({
  completed: { bg: '#dcfce7', color: '#16a34a' },
  generating: { bg: '#dbeafe', color: '#1d4ed8' },
  failed: { bg: '#fee2e2', color: '#dc2626' },
}[s] || { bg: '#f3f4f6', color: '#6b7280' })

export default function Reports() {
  const { theme } = useTheme()
  const api = useApiClient()
  const [reports, setReports] = useState([])
  const [templates, setTemplates] = useState([])
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ template_id: '', source: { list_type: 'targets', id_list: [] }, email_to: [] })

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [repRes, tplRes, tgtRes] = await Promise.all([
        api.reports.getAll(),
        api.reports.getTemplates(),
        api.targets.getAll(),
      ])
      setReports(repRes.data?.reports || [])
      setTemplates(tplRes.data?.templates || [])
      setTargets(tgtRes.data?.targets || [])
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const templateGroups = useMemo(() => {
    const compliance = templates.filter(t => bucketOf(t) === 'compliance').sort(byName)
    const standard = templates.filter(t => bucketOf(t) === 'standard').sort(byName)
    return { compliance, standard }
  }, [templates])

  const create = async () => {
    if (!form.template_id) return
    try {
      await api.reports.create(form)
      setShowNew(false)
      load()
    } catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const download = async (r) => {
    try {
      const paths = r.download || []
      // Assume array of links, find pdf or take the first format
      const downloadPath = paths.find(p => typeof p === 'string' && p.endsWith('.pdf')) || paths[0]
      if (!downloadPath) return alert('No download available yet for this report.')

      // Remove "/api/v1" prefix if it exists because our api client already prepends it
      const safePath = downloadPath.replace(/^\/api\/v1/, '')
      
      const res = await api.raw.get(safePath, { responseType: 'blob' })
      const ext = downloadPath.split('.').pop() || 'pdf'
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `report-${r.report_id}.${ext}`; a.click()
    } catch (e) { 
      console.error(e);
      alert('Download error: ' + (e.response?.data?.message || e.message)) 
    }
  }

  const repeat = async (id) => {
    try { await api.reports.repeat(id); load() }
    catch (e) { alert(e.message) }
  }

  const remove = async (id) => {
    try { await api.reports.delete(id); load() }
    catch (e) { alert(e.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Reports</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>{reports.length} reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>
            <Plus size={15} /> Generate Report
          </button>
        </div>
      </div>

      {showNew && (
        <div className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>New Report</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.template_id} onChange={e => setForm(p => ({ ...p, template_id: e.target.value }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
              <option value="">Select Template</option>
              {templateGroups.compliance.length > 0 && (
                <optgroup label={`Compliance (${templateGroups.compliance.length})`}>
                  {templateGroups.compliance.map(t => <option key={t.template_id} value={t.template_id}>{t.name}</option>)}
                </optgroup>
              )}
              {templateGroups.standard.length > 0 && (
                <optgroup label={`Standard (${templateGroups.standard.length})`}>
                  {templateGroups.standard.map(t => <option key={t.template_id} value={t.template_id}>{t.name}</option>)}
                </optgroup>
              )}
            </select>
            <select onChange={e => setForm(p => ({ ...p, source: { list_type: 'targets', id_list: [e.target.value] } }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
              <option value="">Select Target</option>
              {targets.map(t => <option key={t.target_id} value={t.target_id}>{t.address}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={create} className="px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>Generate</button>
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
                {['Report', 'Template', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map(r => {
                const st = statusStyle(r.status)
                return (
                  <tr key={r.report_id} style={{ borderTop: `1px solid ${theme.border}` }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} style={{ color: theme.primary }} />
                        <span className="font-medium" style={{ color: theme.text }}>{r.report_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{r.template_name || '-'}</td>
                    <td className="px-5 py-3"><span className="px-2 py-1 rounded-lg text-xs font-semibold capitalize" style={{ background: st.bg, color: st.color }}>{r.status || '-'}</span></td>
                    <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{r.generation_date ? new Date(r.generation_date).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-3 flex gap-2 items-center">
                      {r.status === 'completed' && (
                        <>
                          <button onClick={() => download(r)} className="p-1.5 rounded-lg" style={{ color: theme.primary }} title="Download"><Download size={14} /></button>
                          <button onClick={() => repeat(r.report_id)} className="p-1.5 rounded-lg" style={{ color: theme.primary }} title="Regenerate"><RotateCcw size={14} /></button>
                        </>
                      )}
                      <button onClick={() => remove(r.report_id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }} title="Delete"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && reports.length === 0 && <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No reports yet</div>}
      </div>
    </div>
  )
}
