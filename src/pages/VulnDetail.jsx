import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { buildHttpExchange, normalizeRequest } from '../utils/httpExchange'
import { ArrowLeft, RotateCcw, Code2, Link2, Copy, Check } from 'lucide-react'

const sevStyle = (s) => ({
  critical: { bg: '#fee2e2', color: '#dc2626' },
  high: { bg: '#ffedd5', color: '#ea580c' },
  medium: { bg: '#fef9c3', color: '#a16207' },
  low: { bg: '#dcfce7', color: '#16a34a' },
  info: { bg: '#dbeafe', color: '#1d4ed8' },
}[String(s || '').toLowerCase()] || { bg: '#f3f4f6', color: '#6b7280' })

export default function VulnDetail() {
  const { vulnId } = useParams()
  const { state } = useLocation()
  const { theme } = useTheme()
  const api = useApiClient()
  const navigate = useNavigate()
  const [vuln, setVuln] = useState(null)
  const [http, setHttp] = useState({ request: '', response: '', hasData: false, source: null })
  const [httpLoading, setHttpLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('details')
  const [status, setStatus] = useState('')

  const loadHttp = useCallback(async (vulnData) => {
    setHttpLoading(true)
    const sources = []
    if (state?.scanId && state?.resultId) {
      sources.push({
        label: `scan result ${state.resultId.slice(0, 8)}`,
        run: () => api.vulns.getScanVulnHttpResponse(state.scanId, state.resultId, vulnId),
      })
    }
    sources.push({ label: 'vulnerability record', run: () => api.vulns.getHttpResponse(vulnId) })
    if (vulnData?.target_id) {
      try {
        const tRes = await api.targets.getOne(vulnData.target_id)
        const s = tRes.data?.last_scan_id
        const r = tRes.data?.last_scan_session_id
        if (s && r) {
          sources.push({ label: "target's latest scan", run: () => api.vulns.getScanVulnHttpResponse(s, r, vulnId) })
        }
      } catch { /* target lookup is optional */ }
    }

    for (const source of sources) {
      try {
        const res = await source.run()
        const text = typeof res.data === 'string' ? res.data : ''
        const parsed = buildHttpExchange(text, vulnData)
        if (parsed.hasData) {
          setHttp({ ...parsed, source: source.label })
          setHttpLoading(false)
          return
        }
      } catch { /* try the next source */ }
    }
    setHttp({ request: normalizeRequest(vulnData?.request) || '', response: vulnData?.response_info || '', hasData: Boolean(normalizeRequest(vulnData?.request) || vulnData?.response_info), source: null })
    setHttpLoading(false)
  }, [vulnId, api, state])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const vRes = await api.vulns.getOne(vulnId)
      const vulnData = vRes.data
      setVuln(vulnData)
      setStatus(vulnData?.status || 'open')
      await loadHttp(vulnData)
    } catch (e) { setError(e.response?.data?.message || e.message) }
    finally { setLoading(false) }
  }, [vulnId, api, loadHttp])

  useEffect(() => { load() }, [load])

  const copy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch { /* clipboard unavailable */ }
  }

  const updateStatus = async (s) => {
    try { await api.vulns.updateStatus(vulnId, { status: s }); setStatus(s) }
    catch (e) { alert(e.message) }
  }

  const recheck = async () => {
    try { await api.vulns.recheck(vulnId); alert('Recheck queued') }
    catch (e) { alert(e.message) }
  }

  const createIssue = async () => {
    try {
      await api.vulns.getIssues({ vuln_id_list: [vulnId] })
      alert('Issue created in configured issue tracker')
    } catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'http', label: 'HTTP Request/Response' },
    { key: 'description', label: 'Description' },
  ]

  if (loading) return <div className="text-center py-20 text-sm" style={{ color: theme.textMuted }}>Loading...</div>
  if (error) return <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>

  const ss = sevStyle(vuln?.severity)

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: theme.text }}>{vuln?.vt_name || vuln?.name || 'Vulnerability'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-lg text-xs font-semibold capitalize" style={{ background: ss.bg, color: ss.color }}>{vuln?.severity}</span>
            <span className="text-xs" style={{ color: theme.textMuted }}>{vuln?.affects_url || ''}</span>
          </div>
        </div>
        <button onClick={recheck} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
          <RotateCcw size={14} /> Recheck
        </button>
        <button onClick={createIssue} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
          <Link2 size={14} /> Create Issue
        </button>
        <select value={status} onChange={e => updateStatus(e.target.value)} className="px-3 py-2 rounded-xl text-sm outline-none font-medium" style={{ background: theme.primary, color: '#fff', border: 'none' }}>
          <option value="open">Open</option>
          <option value="fixed">Fixed</option>
          <option value="ignored">Ignored</option>
          <option value="false positive">False Positive</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{ background: tab === t.key ? theme.primary : 'transparent', color: tab === t.key ? '#fff' : theme.textMuted }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'details' && vuln && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          {[
            ['Vulnerability Name', vuln.vt_name || vuln.name],
            ['Severity', vuln.severity],
            ['CVSS Score', vuln.cvss_score || '-'],
            ['Affects URL', vuln.affects_url || '-'],
            ['Target', vuln.target_vuln?.address || vuln.target_id || '-'],
            ['Status', vuln.status || '-'],
            ['Source', vuln.source || '-'],
            ['Confidence', vuln.confidence || '-'],
            ['Impact', vuln.impact || '-'],
            ['First Seen', vuln.first_seen || '-'],
            ['Last Seen', vuln.last_seen || '-'],
            ['Request', http.request ? http.request.slice(0, 200) + (http.request.length > 200 ? '...' : '') : '-'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-4" style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: 8 }}>
              <span className="text-xs font-semibold w-36 shrink-0" style={{ color: theme.textMuted }}>{k}</span>
              <span className="text-sm font-mono break-all whitespace-pre-wrap" style={{ color: theme.text }}>{v || '-'}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'http' && (
        <div className="space-y-4">
          {httpLoading ? (
            <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>Loading HTTP exchange...</div>
          ) : http.hasData ? (
            <>
              <div className="flex items-center justify-end text-xs" style={{ color: theme.textMuted }}>
                Source: {http.source || 'vulnerability record'}
              </div>
              {[
                ['request', 'Request', http.request],
                ['response', 'Response', http.response],
              ].map(([key, label, value]) => (
                <div key={key} className="rounded-2xl p-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 size={14} style={{ color: theme.primary }} />
                    <span className="text-sm font-semibold" style={{ color: theme.text }}>{label}</span>
                    <span className="text-xs" style={{ color: theme.textMuted }}>{value.length} chars</span>
                    <button
                      onClick={() => copy(key, value)}
                      className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ background: theme.bg, color: copied === key ? theme.primary : theme.textMuted }}
                    >
                      {copied === key ? <Check size={12} /> : <Copy size={12} />}
                      {copied === key ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-xs overflow-auto p-3 rounded-lg whitespace-pre-wrap break-all" style={{ background: theme.bg, color: theme.textMuted, maxHeight: 400 }}>
                    {value || 'Not available for this vulnerability'}
                  </pre>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-10 text-sm space-y-2" style={{ color: theme.textMuted }}>
              <div>No HTTP request/response recorded for this vulnerability.</div>
              <div className="text-xs opacity-70">The scanner did not store an exchange for this finding.</div>
            </div>
          )}
        </div>
      )}

      {tab === 'description' && (
        <div className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="prose max-w-none text-sm" style={{ color: theme.text }}
            dangerouslySetInnerHTML={{ __html: vuln?.description || vuln?.recommendation || 'No description available' }}
          />
          {vuln?.recommendation && (
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
              <h4 className="font-semibold text-sm mb-2" style={{ color: theme.text }}>Recommendation</h4>
              <div className="text-sm" style={{ color: theme.textMuted }}
                dangerouslySetInnerHTML={{ __html: vuln.recommendation }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
