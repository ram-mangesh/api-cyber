import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Plus, Trash2, RefreshCw, Shield, CheckCircle, XCircle } from 'lucide-react'

export default function WAFs() {
  const { theme } = useTheme()
  const api = useApiClient()
  const [wafs, setWafs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [checking, setChecking] = useState(null)
  const [form, setForm] = useState({ name: '', url: '', platform: 'aws_waf', api_key: '' })

  const platforms = ['aws_waf', 'cloudflare', 'akamai', 'f5_big_ip', 'imperva', 'barracuda']

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.wafs.getAll()
      setWafs(res.data?.wafs || [])
    } catch (e) { setError(e.response?.data?.message || e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const addWaf = async () => {
    if (!form.name || !form.url) return
    try { await api.wafs.create(form); setForm({ name: '', url: '', platform: 'aws_waf', api_key: '' }); setShowAdd(false); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const checkConn = async (id) => {
    setChecking(id)
    try { await api.wafs.checkExistingConnection(id); alert('Connection OK') }
    catch (e) { alert('Connection failed: ' + e.message) }
    finally { setChecking(null) }
  }

  const remove = async (id) => { try { await api.wafs.delete(id); load() } catch (e) { alert(e.message) } }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>WAF Integration</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Web Application Firewall connections — {wafs.length} configured</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>
            <Plus size={15} /> Add WAF
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>Add WAF</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="WAF Name" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
              {platforms.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
            <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="WAF API URL" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <input value={form.api_key} onChange={e => setForm(p => ({ ...p, api_key: e.target.value }))} placeholder="API Key" type="password" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addWaf} className="px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>Save</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}>Cancel</button>
          </div>
        </div>
      )}

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}

      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        {loading ? <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>Loading...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: theme.bg }}>
                {['WAF Name', 'Platform', 'URL', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wafs.map(w => (
                <tr key={w.waf_id} style={{ borderTop: `1px solid ${theme.border}` }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Shield size={14} style={{ color: theme.primary }} />
                      <span className="font-medium" style={{ color: theme.text }}>{w.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs capitalize" style={{ color: theme.textMuted }}>{(w.platform || '').replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{w.url || '-'}</td>
                  <td className="px-5 py-3 flex gap-1 items-center">
                    <button onClick={() => checkConn(w.waf_id)} disabled={checking === w.waf_id} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                      {checking === w.waf_id ? 'Checking...' : 'Test Connection'}
                    </button>
                    <button onClick={() => remove(w.waf_id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && wafs.length === 0 && <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No WAFs configured</div>}
      </div>
    </div>
  )
}
