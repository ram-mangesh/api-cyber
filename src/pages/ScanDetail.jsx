import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { ArrowLeft, RefreshCw, Globe, Shield, AlertTriangle, BarChart2, Code2, X } from 'lucide-react'

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info']

const sevStyle = (s) => ({
  critical: { bg: '#fee2e2', color: '#dc2626' },
  high: { bg: '#ffedd5', color: '#ea580c' },
  medium: { bg: '#fef9c3', color: '#a16207' },
  low: { bg: '#dcfce7', color: '#16a34a' },
  info: { bg: '#dbeafe', color: '#1d4ed8' },
}[String(s || '').toLowerCase()] || { bg: '#f3f4f6', color: '#6b7280' })

export default function ScanDetail() {
  const { scanId } = useParams()
  const { theme } = useTheme()
  const api = useApiClient()
  const navigate = useNavigate()
  const [scan, setScan] = useState(null)
  const [results, setResults] = useState([])
  const [activeResult, setActiveResult] = useState(null)
  const [vulns, setVulns] = useState([])
  const [stats, setStats] = useState(null)
  const [technologies, setTechnologies] = useState([])
  const [crawlData, setCrawlData] = useState([])
  const [selectedTech, setSelectedTech] = useState(null)
  const [techVulns, setTechVulns] = useState([])
  const [selectedCrawlLoc, setSelectedCrawlLoc] = useState(null)
  const [crawlChildren, setCrawlChildren] = useState([])
  const [crawlLocVulns, setCrawlLocVulns] = useState([])
  const [tab, setTab] = useState('vulns')
  const [sevFilter, setSevFilter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const visibleVulns = useMemo(
    () => (sevFilter ? vulns.filter(v => String(v.severity || '').toLowerCase() === sevFilter) : vulns),
    [vulns, sevFilter]
  )

  const toggleSev = (sev) => {
    setSevFilter(prev => (prev === sev ? null : sev))
    setTab('vulns')
  }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [scanRes, resultsRes] = await Promise.all([api.scans.getOne(scanId), api.scans.getResults(scanId)])
      setScan(scanRes.data)
      const rs = resultsRes.data?.results || []
      setResults(rs)
      if (rs.length > 0) {
        const r = rs[0]
        setActiveResult(r)
        const [vOut, sOut, tOut, cOut] = await Promise.allSettled([
          api.vulns.getByScan(scanId, r.result_id),
          api.scans.getStatistics(scanId, r.result_id),
          api.scans.getTechnologies(scanId, r.result_id),
          api.scans.getCrawlData(scanId, r.result_id),
        ])
        const val = (out, key) => (out.status === 'fulfilled' ? out.value.data : null)
        setVulns(val(vOut)?.vulnerabilities || [])
        setStats(val(sOut))
        setTechnologies(val(tOut)?.technologies || [])
        setCrawlData(val(cOut)?.locations || [])
      }
    } catch (e) { setError(e.response?.data?.message || e.message) }
    finally { setLoading(false) }
  }, [scanId])

  useEffect(() => { load() }, [load])

  const loadTechVulns = async (techId) => {
    setSelectedTech(techId)
    setTechVulns([])
    if (!activeResult) return
    const locId = technologies.find(t => t.tech_id === techId)?.loc_id ?? 1
    try {
      const res = await api.raw.get(`/scans/${scanId}/results/${activeResult.result_id}/technologies/${techId}/locations/${locId}/vulnerabilities`)
      setTechVulns(res.data?.vulnerabilities || [])
    } catch { } // Error silently ignored for UI simplicity
  }

  const loadCrawlDetails = async (locId) => {
    setSelectedCrawlLoc(locId)
    setCrawlChildren([]); setCrawlLocVulns([])
    if (!activeResult) return
    const [cOut, vOut] = await Promise.allSettled([
      api.scans.getCrawlChildren(scanId, activeResult.result_id, locId),
      api.scans.getCrawlLocVulns(scanId, activeResult.result_id, locId),
    ])
    if (cOut.status === 'fulfilled') setCrawlChildren(cOut.value.data?.locations || [])
    if (vOut.status === 'fulfilled') setCrawlLocVulns(vOut.value.data?.vulnerabilities || [])
  }

  const tabs = [
    { key: 'vulns', label: `Vulnerabilities (${visibleVulns.length})`, icon: Shield },
    { key: 'stats', label: 'Statistics', icon: BarChart2 },
    { key: 'techs', label: `Technologies (${technologies.length})`, icon: Code2 },
    { key: 'crawl', label: `Crawl Data (${crawlData.length})`, icon: Globe },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/scans')} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: theme.text }}>Scan Detail</h1>
          {scan && <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>{scan.target?.address || scan.target_id}</p>}
        </div>
        <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}

      {loading ? <div className="text-center py-20 text-sm" style={{ color: theme.textMuted }}>Loading...</div> : (
        <>
          {/* Scan Info */}
          {scan && (
            <div className="rounded-2xl p-5 grid grid-cols-4 gap-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              {[
                ['Profile', scan.profile?.name || '-'],
                ['Status', scan.current_session?.status || '-'],
                ['Started', scan.current_session?.start_date ? new Date(scan.current_session.start_date).toLocaleString() : '-'],
                ['Ended', scan.current_session?.end_date ? new Date(scan.current_session.end_date).toLocaleString() : '-'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs font-medium mb-1" style={{ color: theme.textMuted }}>{k}</div>
                  <div className="text-sm font-semibold capitalize" style={{ color: theme.text }}>{v}</div>
                </div>
              ))}
            </div>
          )}

          {/* Statistics - clickable severity filters */}
          {stats && (
            <div className="grid grid-cols-5 gap-3">
              {SEVERITIES.map(sev => {
                const s = sevStyle(sev)
                const count = stats.severity_counts?.[sev] ?? 0
                const active = sevFilter === sev
                return (
                  <button
                    key={sev}
                    onClick={() => toggleSev(sev)}
                    title={`Show only ${sev} vulnerabilities`}
                    className="rounded-2xl p-4 text-center transition"
                    style={{
                      background: active ? s.bg : theme.card,
                      border: `2px solid ${active ? s.color : `${s.color}20`}`,
                      opacity: count === 0 && !active ? 0.55 : 1,
                      boxShadow: active ? `0 0 0 3px ${s.color}25` : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="text-2xl font-bold" style={{ color: s.color }}>{count}</div>
                    <div className="text-xs font-semibold capitalize mt-1" style={{ color: s.color }}>{sev}</div>
                  </button>
                )
              })}
            </div>
          )}

          {sevFilter && (
            <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
              <span>Filtered by</span>
              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold capitalize" style={{ background: sevStyle(sevFilter).bg, color: sevStyle(sevFilter).color }}>{sevFilter}</span>
              <span>({visibleVulns.length} of {vulns.length})</span>
              <button onClick={() => setSevFilter(null)} className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: theme.bg, color: theme.textMuted }}>
                <X size={12} /> Clear filter
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
                style={{ background: tab === t.key ? theme.primary : 'transparent', color: tab === t.key ? '#fff' : theme.textMuted }}>
                <t.icon size={14} />{t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
            {tab === 'vulns' && (
              <table className="w-full text-sm">
                <thead><tr style={{ background: theme.bg }}>
                  {['Vulnerability', 'Severity', 'Location', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{visibleVulns.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>
                    {sevFilter ? `No ${sevFilter} vulnerabilities` : 'No vulnerabilities'}
                  </td></tr>
                ) : visibleVulns.map(v => {
                  const ss = sevStyle(v.severity)
                  return (
                    <tr key={v.vuln_id} style={{ borderTop: `1px solid ${theme.border}` }}>
                      <td className="px-5 py-3 font-medium" style={{ color: theme.text }}>{v.vt_name || v.name || '-'}</td>
                      <td className="px-5 py-3"><span className="px-2 py-1 rounded-lg text-xs font-semibold capitalize" style={{ background: ss.bg, color: ss.color }}>{v.severity}</span></td>
                      <td className="px-5 py-3 text-xs font-mono" style={{ color: theme.textMuted }}>{v.affects_url || '-'}</td>
                      <td className="px-5 py-3"><span className="px-2 py-1 rounded-lg text-xs font-semibold capitalize" style={{ background: theme.bg, color: theme.textMuted }}>{v.status || 'open'}</span></td>
                      <td className="px-5 py-3">
                        <button onClick={() => navigate(`/vulnerabilities/${v.vuln_id}`, { state: { scanId, resultId: activeResult?.result_id } })} className="text-xs font-medium px-3 py-1 rounded-lg hover:opacity-80 transition" style={{ background: theme.primary, color: '#fff' }}>
                          View Request/Response
                        </button>
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            )}

            {tab === 'stats' && (
              <div className="p-5">
                {stats ? (
                  <div className="space-y-3">
                    {Object.entries(stats).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <span className="text-sm" style={{ color: theme.textMuted }}>{k.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-semibold" style={{ color: theme.text }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-center text-sm py-10" style={{ color: theme.textMuted }}>No statistics available</p>}
              </div>
            )}

            {tab === 'techs' && (
              <div className="flex">
                <div className="flex-1" style={{ borderRight: `1px solid ${theme.border}` }}>
                  <table className="w-full text-sm">
                    <thead><tr style={{ background: theme.bg }}>
                      {['Technology', 'Version', 'Category'].map(h => (
                        <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>{technologies.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No technologies detected</td></tr>
                    ) : technologies.map((t, i) => (
                      <tr key={i} onClick={() => loadTechVulns(t.tech_id)} className="cursor-pointer hover:opacity-80 transition" style={{ borderTop: `1px solid ${theme.border}`, background: selectedTech === t.tech_id ? theme.bg : 'transparent' }}>
                        <td className="px-5 py-3 font-medium" style={{ color: theme.text }}>{t.name}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{t.version || '-'}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{t.tag || '-'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                {selectedTech && (
                  <div className="w-1/3 p-4">
                    <h3 className="font-semibold text-sm mb-3" style={{ color: theme.text }}>Vulnerabilities for Technology</h3>
                    <div className="space-y-2">
                      {techVulns.length === 0 ? <p className="text-xs" style={{ color: theme.textMuted }}>No vulnerabilities found</p> :
                        techVulns.map(v => (
                          <div key={v.vuln_id} className="text-xs p-2 rounded flex flex-col gap-1" style={{ background: theme.bg }}>
                            <span className="font-medium" style={{ color: theme.text }}>{v.vt_name || v.name}</span>
                            <span style={{ color: sevStyle(v.severity).color }}>{v.severity}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'crawl' && (
              <div className="flex">
                <div className="flex-1" style={{ borderRight: `1px solid ${theme.border}` }}>
                  <table className="w-full text-sm">
                    <thead><tr style={{ background: theme.bg }}>
                      {['URL', 'Status', 'Content Type'].map(h => (
                        <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>{crawlData.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No crawl data</td></tr>
                    ) : crawlData.map((c, i) => (
                      <tr key={i} onClick={() => loadCrawlDetails(c.loc_id)} className="cursor-pointer hover:opacity-80 transition" style={{ borderTop: `1px solid ${theme.border}`, background: selectedCrawlLoc === c.loc_id ? theme.bg : 'transparent' }}>
                        <td className="px-5 py-3 text-xs font-mono truncate max-w-md" style={{ color: theme.text }}>{c.url || c.location || '-'}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{c.response?.status_code || '-'}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{c.response?.content_type || '-'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                {selectedCrawlLoc && (
                  <div className="w-1/3 p-4 flex flex-col gap-4">
                    <div>
                      <h3 className="font-semibold text-sm mb-2" style={{ color: theme.text }}>Vulnerabilities</h3>
                      <div className="space-y-1">
                        {crawlLocVulns.length === 0 ? <p className="text-xs" style={{ color: theme.textMuted }}>None</p> :
                          crawlLocVulns.map(v => <div key={v.vuln_id} className="text-xs">{v.vt_name || v.name}</div>)
                        }
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-2" style={{ color: theme.text }}>Children</h3>
                      <div className="space-y-1">
                        {crawlChildren.length === 0 ? <p className="text-xs" style={{ color: theme.textMuted }}>None</p> :
                          crawlChildren.map(c => <div key={c.loc_id} className="text-xs font-mono">{c.url || c.location}</div>)
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
