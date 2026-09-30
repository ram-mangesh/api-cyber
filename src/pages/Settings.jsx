import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useApi } from '../context/ApiContext'
import { Save, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function Settings() {
  const { theme } = useTheme()
  const { apiKey, baseUrl, saveConfig } = useApi()
  const [form, setForm] = useState({ apiKey, baseUrl })
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = () => {
    saveConfig(form.apiKey, form.baseUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Configure your DRONIKASTRA Scanner connection</p>
      </div>

      <div className="rounded-2xl p-6 shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <h3 className="font-semibold mb-5" style={{ color: theme.text }}>API Configuration</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: theme.text }}>Scanner Base URL</label>
            <input
              value={form.baseUrl}
              onChange={e => setForm(p => ({ ...p, baseUrl: e.target.value }))}
              placeholder="https://localhost:3443"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
            />
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Base URL of your DRONIKASTRA scanner instance</p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: theme.text }}>API Key (X-Auth)</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center px-4 py-3 rounded-xl" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                <input
                  value={form.apiKey}
                  onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))}
                  type={showKey ? 'text' : 'password'}
                  placeholder="Enter your API key"
                  className="bg-transparent text-sm outline-none flex-1"
                  style={{ color: theme.text }}
                />
                <button onClick={() => setShowKey(v => !v)} style={{ color: theme.textMuted }}>
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              Find your API key in DRONIKASTRA scanner &rarr; Profile &rarr; API Key
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>
            <Save size={15} /> Save Configuration
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#16a34a' }}>
              <CheckCircle size={16} /> Saved successfully
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-6 shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <h3 className="font-semibold mb-2" style={{ color: theme.text }}>Connection Info</h3>
        <div className="space-y-2">
          {[
            ['Base URL', baseUrl || 'Not configured'],
            ['API Key', apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : 'Not set'],
            ['API Version', 'v1'],
            ['Auth Header', 'X-Auth'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <span className="text-sm" style={{ color: theme.textMuted }}>{k}</span>
              <span className="text-sm font-mono font-medium" style={{ color: theme.text }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
