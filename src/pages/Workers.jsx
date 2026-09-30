import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, ArrowUp, Tag, Cpu, Download, RotateCcw, Trash2 } from 'lucide-react'

const statusStyle = (s) => ({
  authorized: { bg: '#dcfce7', color: '#16a34a', label: 'Authorized' },
  unauthorized: { bg: '#fef9c3', color: '#a16207', label: 'Pending Auth' },
  failed: { bg: '#fee2e2', color: '#dc2626', label: 'Failed' },
  offline: { bg: '#f3f4f6', color: '#6b7280', label: 'Offline' },
}[s] || { bg: '#f3f4f6', color: '#6b7280', label: s || 'Unknown' })

export default function Workers() {
  const { theme } = useTheme()
  const api = useApiClient()
  const [workers, setWorkers] = useState([])
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [wRes, tRes] = await Promise.all([api.workers.getAll(), api.workers.getRegistrationToken()])
      setWorkers(wRes.data?.workers || [])
      setToken(tRes.data?.token)
    } catch (e) { setError(e.response?.data?.message || e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const authorize = async (id) => { try { await api.workers.authorize(id); load() } catch (e) { alert(e.message) } }
  const reject = async (id) => { try { await api.workers.reject(id); load() } catch (e) { alert(e.message) } }
  const upgrade = async (id) => { try { await api.workers.upgrade(id); alert('Upgrade initiated') } catch (e) { alert(e.message) } }
  const check = async (id) => { try { await api.workers.check(id); alert('Check initiated') } catch (e) { alert(e.message) } }
  const ignoreErrors = async (id) => { try { await api.workers.ignoreErrors(id); load() } catch (e) { alert(e.message) } }
  const deleteWorker = async (id) => { try { await api.raw.delete(`/workers/${id}`); load() } catch (e) { alert(e.message) } }

  const generateToken = async () => {
    try { const res = await api.raw.post('/config/agents/registration_token'); setToken(res.data?.token); }
    catch (e) { alert(e.message) }
  }

  const deleteToken = async () => {
    try { await api.raw.delete('/config/agents/registration_token'); setToken(null); }
    catch (e) { alert(e.message) }
  }

  const downloadSensor = async () => {
    try {
      const res = await api.raw.get('/targets/sensors/linux/latest', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'acunetix-agent'; a.click()
    } catch (e) { alert('Download failed: ' + e.message) }
  }

  const rename = async (id) => {
    const name = window.prompt('Enter new name:')
    if (!name) return
    try { await api.workers.rename(id, { name }); load() } catch (e) { alert(e.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Workers / Agents</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>{workers.length} agents registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadSensor} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
            <Download size={14} /> Download Sensor
          </button>
          <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
        </div>
      </div>

      {/* Registration Token */}
      {token !== null && (
        <div className="rounded-2xl p-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2 mb-2">
            <Tag size={14} style={{ color: theme.primary }} />
            <span className="text-sm font-semibold" style={{ color: theme.text }}>Agent Registration Token</span>
            <div className="flex-1" />
            <button onClick={generateToken} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RotateCcw size={11} /> Regenerate</button>
            <button onClick={deleteToken} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }} title="Delete token"><Trash2 size={13} /></button>
          </div>
          {token ? (
            <>
              <code className="text-xs block px-3 py-2 rounded-lg break-all" style={{ background: theme.bg, color: theme.textMuted }}>{token}</code>
              <p className="text-xs mt-2" style={{ color: theme.textMuted }}>Use this token when registering a new scan agent</p>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xs" style={{ color: theme.textMuted }}>No token generated yet.</p>
              <button onClick={generateToken} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: theme.primary, color: '#fff' }}>Generate Token</button>
            </div>
          )}
        </div>
      )}

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}

      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        {loading ? <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>Loading...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: theme.bg }}>
                {['Agent', 'Status', 'Version', 'Description', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workers.map(w => {
                const st = statusStyle(w.status)
                return (
                  <tr key={w.worker_id} style={{ borderTop: `1px solid ${theme.border}` }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Cpu size={14} style={{ color: theme.primary }} />
                        <span className="font-medium" style={{ color: theme.text }}>{w.name || w.worker_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                    <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{w.version || '-'}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{w.description || '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 items-center flex-wrap">
                        {w.status === 'unauthorized' && (
                          <>
                            <button onClick={() => authorize(w.worker_id)} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: '#dcfce7', color: '#16a34a' }}><CheckCircle size={11} className="inline mr-1" />Authorize</button>
                            <button onClick={() => reject(w.worker_id)} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: '#fee2e2', color: '#dc2626' }}><XCircle size={11} className="inline mr-1" />Reject</button>
                          </>
                        )}
                        {w.status === 'authorized' && (
                          <>
                            <button onClick={() => upgrade(w.worker_id)} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: '#dbeafe', color: '#1d4ed8' }}><ArrowUp size={11} className="inline mr-1" />Upgrade</button>
                            <button onClick={() => check(w.worker_id)} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Check</button>
                          </>
                        )}
                        {w.has_error && <button onClick={() => ignoreErrors(w.worker_id)} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: '#fef9c3', color: '#a16207' }}><AlertTriangle size={11} className="inline mr-1" />Ignore Errors</button>}
                        <button onClick={() => rename(w.worker_id)} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Rename</button>
                        <button onClick={() => deleteWorker(w.worker_id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && workers.length === 0 && <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No agents registered</div>}
      </div>
    </div>
  )
}
