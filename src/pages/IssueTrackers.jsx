import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { Plus, Trash2, RefreshCw, Link2, CheckCircle } from 'lucide-react'

const trackerTypes = ['jira', 'github', 'gitlab', 'bugzilla', 'tfs', 'servicenow']

export default function IssueTrackers() {
  const { theme } = useTheme()
  const api = useApiClient()
  const [trackers, setTrackers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [checking, setChecking] = useState(null)
  const [form, setForm] = useState({ name: '', url: '', tracker_type: 'jira', api_key: '', username: '' })

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.issueTrackers.getAll()
      setTrackers(res.data?.issue_trackers || [])
    } catch (e) { setError(e.response?.data?.message || e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const addTracker = async () => {
    if (!form.name || !form.url) return
    try { await api.issueTrackers.create(form); setForm({ name: '', url: '', tracker_type: 'jira', api_key: '', username: '' }); setShowAdd(false); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const checkConn = async (id) => {
    setChecking(id)
    try { await api.issueTrackers.checkExistingConnection(id); alert('Connection OK') }
    catch (e) { alert('Failed: ' + (e.response?.data?.message || e.message)) }
    finally { setChecking(null) }
  }

  const remove = async (id) => { try { await api.issueTrackers.delete(id); load() } catch (e) { alert(e.message) } }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Issue Trackers</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Jira, GitHub, GitLab integrations — {trackers.length} configured</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>
            <Plus size={15} /> Add Tracker
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>Add Issue Tracker</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Tracker Name" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <select value={form.tracker_type} onChange={e => setForm(p => ({ ...p, tracker_type: e.target.value }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
              {trackerTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="URL (e.g. https://jira.company.com)" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="Username / Email" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <input value={form.api_key} onChange={e => setForm(p => ({ ...p, api_key: e.target.value }))} placeholder="API Key / Token" type="password" className="px-3 py-2.5 rounded-xl text-sm outline-none col-span-2" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addTracker} className="px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>Save</button>
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
                {['Tracker', 'Type', 'URL', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trackers.map(t => (
                <tr key={t.issue_tracker_id} style={{ borderTop: `1px solid ${theme.border}` }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Link2 size={14} style={{ color: theme.primary }} />
                      <span className="font-medium" style={{ color: theme.text }}>{t.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="px-2 py-1 rounded-lg text-xs font-semibold capitalize" style={{ background: theme.bg, color: theme.primary, border: `1px solid ${theme.border}` }}>{t.tracker_type}</span></td>
                  <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{t.url || '-'}</td>
                  <td className="px-5 py-3 flex gap-1 items-center">
                    <button onClick={() => checkConn(t.issue_tracker_id)} disabled={checking === t.issue_tracker_id} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                      {checking === t.issue_tracker_id ? 'Checking...' : 'Test'}
                    </button>
                    <button onClick={() => remove(t.issue_tracker_id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && trackers.length === 0 && <div className="text-center py-10 text-sm" style={{ color: theme.textMuted }}>No issue trackers configured</div>}
      </div>
    </div>
  )
}
