import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import {
  ArrowLeft, RefreshCw, Save, Plus, Trash2, Upload,
  Globe, Shield, Lock, FileText, Cpu, Folder, X, Download
} from 'lucide-react'

const tabs = [
  { key: 'general', label: 'General', icon: Globe },
  { key: 'auth', label: 'Login Sequence', icon: Lock },
  { key: 'cert', label: 'Client Certificate', icon: Shield },
  { key: 'exclusions', label: 'Exclusions', icon: X },
  { key: 'hosts', label: 'Allowed Hosts', icon: Globe },
  { key: 'imports', label: 'Imported Files', icon: FileText },
  { key: 'workers', label: 'Workers', icon: Cpu },
  { key: 'groups', label: 'Target Groups', icon: Folder },
]

export default function TargetConfig() {
  const { targetId } = useParams()
  const { theme } = useTheme()
  const api = useApiClient()
  const navigate = useNavigate()
  const [tab, setTab] = useState('general')
  const [target, setTarget] = useState(null)
  const [config, setConfig] = useState(null)
  const [allowedHosts, setAllowedHosts] = useState([])
  const [exclusions, setExclusions] = useState([])
  const [imports, setImports] = useState([])
  const [loginSeq, setLoginSeq] = useState(null)
  const [clientCert, setClientCert] = useState(null)
  const [workers, setWorkers] = useState([])
  const [allWorkers, setAllWorkers] = useState([])
  const [targetGroups, setTargetGroups] = useState([])
  const [technologies, setTechnologies] = useState([])
  const [continuousScan, setContinuousScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [newHost, setNewHost] = useState('')
  const [newExclusion, setNewExclusion] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const results = await Promise.allSettled([
        api.targets.getOne(targetId),
        api.targets.getConfig(targetId),
        api.targets.getAllowedHosts(targetId),
        api.targets.getExclusions(targetId),
        api.targets.getImports(targetId),
        api.targets.getLoginSequence(targetId),
        api.targets.getWorkerConfig(targetId),
        api.targets.getTargetGroups(targetId),
        api.targets.getTechnologies(targetId),
        api.targets.getContinuousScan(targetId),
        api.workers.getAll(),
      ])
      if (results[0].status === 'fulfilled') setTarget(results[0].value.data)
      if (results[1].status === 'fulfilled') setConfig(results[1].value.data)
      if (results[2].status === 'fulfilled') setAllowedHosts(results[2].value.data?.allowed_hosts || [])
      if (results[3].status === 'fulfilled') setExclusions(results[3].value.data?.excluded_paths || [])
      if (results[4].status === 'fulfilled') setImports(results[4].value.data?.imports || [])
      if (results[5].status === 'fulfilled') setLoginSeq(results[5].value.data)
      if (results[6].status === 'fulfilled') setWorkers(results[6].value.data?.workers || [])
      if (results[7].status === 'fulfilled') setTargetGroups(results[7].value.data?.groups || [])
      if (results[8].status === 'fulfilled') setTechnologies(results[8].value.data?.technologies || [])
      if (results[9].status === 'fulfilled') setContinuousScan(results[9].value.data)
      if (results[10].status === 'fulfilled') setAllWorkers(results[10].value.data?.workers || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [targetId])

  useEffect(() => { load() }, [load])

  const saveConfig = async () => {
    setSaving(true)
    try { await api.targets.updateConfig(targetId, config); alert('Configuration saved') }
    catch (e) { alert(e.response?.data?.message || e.message) }
    finally { setSaving(false) }
  }

  const addAllowedHost = async () => {
    if (!newHost) return
    try { await api.targets.addAllowedHost(targetId, { address: newHost }); setNewHost(''); load() }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const removeAllowedHost = async (ahId) => {
    try { await api.targets.deleteAllowedHost(targetId, ahId); load() }
    catch (e) { alert(e.message) }
  }

  const saveExclusions = async () => {
    try { await api.targets.updateExclusions(targetId, { excluded_paths: exclusions }); alert('Exclusions saved') }
    catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const addExclusion = () => {
    if (!newExclusion) return
    setExclusions(p => [...p, { path: newExclusion, type: 'begins_with' }])
    setNewExclusion('')
  }

  const deleteLoginSeq = async () => {
    try { await api.raw.delete(`/targets/${targetId}/configuration/login_sequence`); load() }
    catch (e) { alert(e.message) }
  }

  const downloadLoginSeq = async () => {
    try {
      const res = await api.targets.downloadLoginSequence(targetId)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'login_sequence.lsr'; a.click()
    } catch (e) { alert(e.message) }
  }

  const deleteClientCert = async () => {
    try { await api.raw.delete(`/targets/${targetId}/configuration/client_certificate`); load() }
    catch (e) { alert(e.message) }
  }

  const uploadImport = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try {
      await api.raw.post(`/targets/${targetId}/configuration/imports`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      load()
    } catch (ex) { alert(ex.response?.data?.message || ex.message) }
  }

  const deleteImport = async (importId) => {
    try { await api.raw.delete(`/targets/${targetId}/configuration/imports/${importId}`); load() }
    catch (e) { alert(e.message) }
  }

  const assignWorker = async (workerId) => {
    try {
      await api.raw.post(`/targets/${targetId}/configuration/workers`, { worker_id: workerId })
      load()
    } catch (e) { alert(e.response?.data?.message || e.message) }
  }

  const toggleContinuous = async () => {
    const enabled = !continuousScan?.enabled
    try { await api.targets.updateContinuousScan(targetId, { enabled }); load() }
    catch (e) { alert(e.message) }
  }

  if (loading) return <div className="text-center py-20 text-sm" style={{ color: theme.textMuted }}>Loading target configuration...</div>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/targets')} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: theme.text }}>Target Configuration</h1>
          <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>{target?.address || targetId}</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RefreshCw size={15} /></button>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>}

      {/* Tab Bar */}
      <div className="flex gap-1 flex-wrap p-1 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition"
            style={{ background: tab === t.key ? theme.primary : 'transparent', color: tab === t.key ? '#fff' : theme.textMuted }}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* Tab: General */}
      {tab === 'general' && config && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold" style={{ color: theme.text }}>General Settings</h3>

          {/* Continuous Scan Toggle */}
          <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div>
              <div className="text-sm font-medium" style={{ color: theme.text }}>Continuous Scan</div>
              <div className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Automatically rescan this target periodically</div>
            </div>
            <button onClick={toggleContinuous}
              className="w-12 h-6 rounded-full transition-all relative"
              style={{ background: continuousScan?.enabled ? theme.primary : theme.border }}>
              <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                style={{ left: continuousScan?.enabled ? '1.75rem' : '0.25rem' }} />
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: theme.textMuted }}>Description</label>
            <input value={config.description || ''} onChange={e => setConfig(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
          </div>

          {/* Criticality */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: theme.textMuted }}>Business Criticality</label>
            <select value={config.criticality || 10} onChange={e => setConfig(p => ({ ...p, criticality: Number(e.target.value) }))}
              className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
              <option value={10}>Low</option>
              <option value={20}>Medium</option>
              <option value={30}>High</option>
            </select>
          </div>

          {/* Technologies detected */}
          {technologies.length > 0 && (
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: theme.textMuted }}>Detected Technologies</label>
              <div className="flex flex-wrap gap-2">
                {technologies.map((t, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: theme.bg, color: theme.primary, border: `1px solid ${theme.border}` }}>
                    {t.name}{t.version ? ` ${t.version}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={saveConfig} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>
            <Save size={14} />{saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Tab: Login Sequence */}
      {tab === 'auth' && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold" style={{ color: theme.text }}>Login Sequence</h3>
          {loginSeq ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                <Lock size={16} style={{ color: theme.primary }} />
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: theme.text }}>Login sequence configured</div>
                  <div className="text-xs" style={{ color: theme.textMuted }}>{loginSeq.kind || 'Sequence'}</div>
                </div>
                <button onClick={downloadLoginSeq} className="p-1.5 rounded-lg" style={{ color: theme.primary }} title="Download"><Download size={14} /></button>
                <button onClick={deleteLoginSeq} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }} title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-3" style={{ color: theme.textMuted }}>No login sequence configured. Upload a .lsr file:</p>
              <input type="file" accept=".lsr,.json" onChange={async (e) => {
                const file = e.target.files[0]; if (!file) return
                const fd = new FormData(); fd.append('file', file)
                try {
                  await api.raw.post(`/targets/${targetId}/configuration/login_sequence`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                  load()
                } catch (ex) { alert(ex.response?.data?.message || ex.message) }
              }} className="text-sm" style={{ color: theme.text }} />
            </div>
          )}
        </div>
      )}

      {/* Tab: Client Certificate */}
      {tab === 'cert' && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold" style={{ color: theme.text }}>Client Certificate (mTLS)</h3>
          {clientCert ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
              <Shield size={16} style={{ color: theme.primary }} />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: theme.text }}>Certificate configured</div>
                <div className="text-xs" style={{ color: theme.textMuted }}>{clientCert.filename || 'Certificate'}</div>
              </div>
              <button onClick={deleteClientCert} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-3" style={{ color: theme.textMuted }}>No client certificate configured. Upload a .pfx or .pem file:</p>
              <input type="file" accept=".pfx,.pem,.crt,.p12" onChange={async (e) => {
                const file = e.target.files[0]; if (!file) return
                const fd = new FormData(); fd.append('file', file)
                try {
                  await api.raw.post(`/targets/${targetId}/configuration/client_certificate`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                  load()
                } catch (ex) { alert(ex.response?.data?.message || ex.message) }
              }} className="text-sm" style={{ color: theme.text }} />
            </div>
          )}
        </div>
      )}

      {/* Tab: Exclusions */}
      {tab === 'exclusions' && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold" style={{ color: theme.text }}>Excluded Paths</h3>
          <p className="text-xs" style={{ color: theme.textMuted }}>Paths matching these patterns will not be scanned</p>
          <div className="flex gap-2">
            <input value={newExclusion} onChange={e => setNewExclusion(e.target.value)} placeholder="/admin/*, /logout"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <select className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
              <option value="begins_with">Begins with</option>
              <option value="contains">Contains</option>
              <option value="regex">Regex</option>
            </select>
            <button onClick={addExclusion} className="px-3 py-2 rounded-xl text-sm text-white" style={{ background: theme.primary }}><Plus size={14} /></button>
          </div>
          <div className="space-y-2">
            {exclusions.map((ex, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                <code className="flex-1 text-xs" style={{ color: theme.text }}>{ex.path || ex}</code>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: theme.card, color: theme.textMuted }}>{ex.type || 'begins_with'}</span>
                <button onClick={() => setExclusions(p => p.filter((_, j) => j !== i))} className="p-1 rounded" style={{ color: '#dc2626' }}><X size={12} /></button>
              </div>
            ))}
            {exclusions.length === 0 && <p className="text-sm text-center py-4" style={{ color: theme.textMuted }}>No exclusions defined</p>}
          </div>
          <button onClick={saveExclusions} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white font-medium" style={{ background: theme.primary }}>
            <Save size={14} /> Save Exclusions
          </button>
        </div>
      )}

      {/* Tab: Allowed Hosts */}
      {tab === 'hosts' && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold" style={{ color: theme.text }}>Allowed Hosts</h3>
          <p className="text-xs" style={{ color: theme.textMuted }}>Additional hosts the scanner is allowed to follow links to</p>
          <div className="flex gap-2">
            <input value={newHost} onChange={e => setNewHost(e.target.value)} placeholder="https://cdn.example.com"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }} />
            <button onClick={addAllowedHost} className="px-3 py-2 rounded-xl text-sm text-white" style={{ background: theme.primary }}><Plus size={14} /></button>
          </div>
          <div className="space-y-2">
            {allowedHosts.map(h => (
              <div key={h.allowed_target_id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                <Globe size={13} style={{ color: theme.primary }} />
                <span className="flex-1 text-sm" style={{ color: theme.text }}>{h.address}</span>
                <button onClick={() => removeAllowedHost(h.allowed_target_id)} className="p-1 rounded" style={{ color: '#dc2626' }}><Trash2 size={12} /></button>
              </div>
            ))}
            {allowedHosts.length === 0 && <p className="text-sm text-center py-4" style={{ color: theme.textMuted }}>No allowed hosts defined</p>}
          </div>
        </div>
      )}

      {/* Tab: Imported Files */}
      {tab === 'imports' && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold" style={{ color: theme.text }}>Imported Files</h3>
          <p className="text-xs mb-2" style={{ color: theme.textMuted }}>Upload Swagger/OpenAPI specs, Postman collections, WSDL files</p>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer w-fit" style={{ background: theme.primary, color: '#fff' }}>
            <Upload size={14} /> Upload File
            <input type="file" className="hidden" onChange={uploadImport} />
          </label>
          <div className="space-y-2 mt-2">
            {imports.map(imp => (
              <div key={imp.import_id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                <FileText size={13} style={{ color: theme.primary }} />
                <span className="flex-1 text-sm" style={{ color: theme.text }}>{imp.file_name || imp.import_id}</span>
                <span className="text-xs" style={{ color: theme.textMuted }}>{imp.kind || '-'}</span>
                <button onClick={() => deleteImport(imp.import_id)} className="p-1 rounded" style={{ color: '#dc2626' }}><Trash2 size={12} /></button>
              </div>
            ))}
            {imports.length === 0 && <p className="text-sm text-center py-4" style={{ color: theme.textMuted }}>No files imported</p>}
          </div>
        </div>
      )}

      {/* Tab: Workers */}
      {tab === 'workers' && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold" style={{ color: theme.text }}>Assigned Workers</h3>
          {/* Assign new worker */}
          <div className="flex gap-2">
            <select onChange={e => e.target.value && assignWorker(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
              <option value="">Assign a worker...</option>
              {allWorkers.filter(w => !workers.find(aw => aw.worker_id === w.worker_id)).map(w => (
                <option key={w.worker_id} value={w.worker_id}>{w.name || w.worker_id}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            {workers.map(w => (
              <div key={w.worker_id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                <Cpu size={13} style={{ color: theme.primary }} />
                <span className="flex-1 text-sm font-medium" style={{ color: theme.text }}>{w.name || w.worker_id}</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#dcfce7', color: '#16a34a' }}>{w.status || 'active'}</span>
              </div>
            ))}
            {workers.length === 0 && <p className="text-sm text-center py-4" style={{ color: theme.textMuted }}>No workers assigned. Uses default worker.</p>}
          </div>
        </div>
      )}

      {/* Tab: Target Groups */}
      {tab === 'groups' && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold" style={{ color: theme.text }}>Target Groups</h3>
          <p className="text-xs" style={{ color: theme.textMuted }}>Groups this target belongs to</p>
          <div className="space-y-2">
            {targetGroups.map(g => (
              <div key={g.group_id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                <Folder size={13} style={{ color: theme.primary }} />
                <span className="flex-1 text-sm font-medium" style={{ color: theme.text }}>{g.name}</span>
              </div>
            ))}
            {targetGroups.length === 0 && <p className="text-sm text-center py-4" style={{ color: theme.textMuted }}>Not in any target group</p>}
          </div>
        </div>
      )}
    </div>
  )
}
