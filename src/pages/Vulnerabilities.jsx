import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Search, RefreshCw, RotateCcw, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const sevStyle = (s) => ({
  critical: { bg: '#fee2e2', color: '#dc2626' },
  high: { bg: '#ffedd5', color: '#ea580c' },
  medium: { bg: '#fef9c3', color: '#a16207' },
  low: { bg: '#dcfce7', color: '#16a34a' },
  info: { bg: '#dbeafe', color: '#1d4ed8' },
}[String(s || '').toLowerCase()] || { bg: '#f3f4f6', color: '#6b7280' })

const statusStyle = (s) => ({
  open: { bg: '#fee2e2', color: '#dc2626' },
  fixed: { bg: '#dcfce7', color: '#16a34a' },
  ignored: { bg: '#f3f4f6', color: '#6b7280' },
  'false positive': { bg: '#fef9c3', color: '#a16207' },
}[String(s || '').toLowerCase()] || { bg: '#f3f4f6', color: '#6b7280' })

export default function Vulnerabilities() {
  const { theme } = useTheme()
  const api = useApiClient()
  const navigate = useNavigate()
  const [vulns, setVulns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sevFilter, setSevFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.vulns.getAll()
      setVulns(res.data?.vulnerabilities || [])
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = vulns.filter(v => {
    const matchSearch = String(v.vt_name || v.name || '').toLowerCase().includes(search.toLowerCase()) || String(v.target_vuln?.address || '').toLowerCase().includes(search.toLowerCase())
    const matchSev = sevFilter === 'all' || String(v.severity || '').toLowerCase() === sevFilter
    const matchStatus = statusFilter === 'all' || String(v.status || '').toLowerCase() === statusFilter
    return matchSearch && matchSev && matchStatus
  })

  const updateStatus = async (id, status) => {
    try {
      await api.vulns.updateStatus(id, { status })
      setVulns(p => p.map(v => v.vuln_id === id ? { ...v, status } : v))
    } catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const recheck = async (id) => {
    try { await api.vulns.recheck(id); alert('Recheck queued') }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const recheckAll = async () => {
    const ids = filtered.map(v => v.vuln_id)
    try { await api.vulns.recheckAll(ids); alert('Bulk recheck queued') }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Vulnerabilities</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>{filtered.length} vulnerabilities</p>
        </div>
        <div className="flex gap-2">
          <button onClick={recheckAll} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
            <RotateCcw size={14} /> Recheck All
          </button>
          <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
        </div>
      </div>

      {/* Severity Badges */}
      <div className="flex gap-3">
        {['critical', 'high', 'medium', 'low', 'info'].map(sev => {
          const count = vulns.filter(v => String(v.severity || '').toLowerCase() === sev).length
          if (!count && sevFilter !== sev) return null
          const st = sevStyle(sev)
          return (
            <button key={sev} onClick={() => setSevFilter(sevFilter === sev ? 'all' : sev)}
              className="px-4 py-2 rounded-xl text-sm font-semibold capitalize"
              style={{ background: sevFilter === sev ? st.color : st.bg, color: sevFilter === sev ? '#fff' : st.color, border: `2px solid ${sevFilter === sev ? st.color : 'transparent'}` }}>
              {sev}: {count}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl flex-1 max-w-xs" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <Search size={14} style={{ color: theme.textMuted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vulnerabilities..." className="bg-transparent text-sm outline-none w-full" style={{ color: theme.text }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl text-sm outline-none" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="fixed">Fixed</option>
          <option value="ignored">Ignored</option>
          <option value="false positive">False Positive</option>
        </select>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}

      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        {loading ? <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>Loading...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: theme.bg }}>
                {['Vulnerability', 'Severity', 'Target', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => {
                const ss = sevStyle(v.severity)
                const st = statusStyle(v.status)
                const name = v.vt_name || v.name || 'Unknown'
                return (
                  <tr key={v.vuln_id} style={{ borderTop: `1px solid ${theme.border}` }}>
                    <td className="px-5 py-3 font-medium max-w-xs truncate" style={{ color: theme.text }}>{name}</td>
                    <td className="px-5 py-3"><span className="px-2 py-1 rounded-lg text-xs font-semibold capitalize" style={{ background: ss.bg, color: ss.color }}>{v.severity || '-'}</span></td>
                    <td className="px-5 py-3 text-xs truncate max-w-xs" style={{ color: theme.textMuted }}>{v.target_vuln?.address || '-'}</td>
                    <td className="px-5 py-3 text-xs font-mono truncate max-w-xs" style={{ color: theme.textMuted }}>{v.affects_url || v.location || '-'}</td>
                    <td className="px-5 py-3"><span className="px-2 py-1 rounded-lg text-xs font-semibold capitalize" style={{ background: st.bg, color: st.color }}>{v.status || '-'}</span></td>
                    <td className="px-5 py-3 flex gap-1 items-center">
                      <button onClick={() => navigate(`/vulnerabilities/${v.vuln_id}`)} className="p-1.5 rounded-lg" style={{ color: theme.primary }} title="View Details"><Eye size={14} /></button>
                      <button onClick={() => recheck(v.vuln_id)} className="p-1.5 rounded-lg" style={{ color: theme.primary }} title="Recheck"><RotateCcw size={14} /></button>
                      <select value={v.status || 'open'} onChange={e => updateStatus(v.vuln_id, e.target.value)}
                        className="px-2 py-1 rounded-lg text-xs outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
                        <option value="open">Open</option>
                        <option value="fixed">Fixed</option>
                        <option value="ignored">Ignored</option>
                        <option value="false positive">False Positive</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No vulnerabilities found</div>}
      </div>
    </div>
  )
}
