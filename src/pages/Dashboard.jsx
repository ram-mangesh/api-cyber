import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { useApiClient } from '../hooks/useApiClient'
import { ShieldAlert, Target, Scan, FileText, TrendingUp, TrendingDown, RefreshCw, PhoneCall } from 'lucide-react'
import { triggerTwilioCall } from '../utils/twilioAlert'

const lineData = [
  { month: 'Apr', scans: 12, vulns: 45 },
  { month: 'May', scans: 19, vulns: 62 },
  { month: 'Jun', scans: 15, vulns: 38 },
  { month: 'Jul', scans: 28, vulns: 80 },
  { month: 'Aug', scans: 22, vulns: 55 },
  { month: 'Sep', scans: 35, vulns: 92 },
]

const barData = [
  { day: 'Mon', critical: 4, high: 8, medium: 12 },
  { day: 'Tue', critical: 2, high: 5, medium: 18 },
  { day: 'Wed', critical: 6, high: 10, medium: 8 },
  { day: 'Thu', critical: 1, high: 4, medium: 15 },
  { day: 'Fri', critical: 8, high: 12, medium: 6 },
  { day: 'Sat', critical: 3, high: 7, medium: 11 },
  { day: 'Sun', critical: 5, high: 9, medium: 14 },
]

const areaData = [
  { time: '00:00', targets: 20 },
  { time: '04:00', targets: 22 },
  { time: '08:00', targets: 30 },
  { time: '12:00', targets: 45 },
  { time: '16:00', targets: 38 },
  { time: '20:00', targets: 42 },
  { time: '24:00', targets: 35 },
]

const donutData = [
  { name: 'Critical', value: 12 },
  { name: 'High', value: 28 },
  { name: 'Medium', value: 45 },
  { name: 'Low', value: 15 },
]

function KpiCard({ title, value, sub, icon: Icon, trend, up }) {
  const { theme } = useTheme()
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: theme.card, border: `1px solid ${theme.border}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: theme.bg }}
        >
          <Icon size={20} style={{ color: theme.primary }} />
        </div>
        <span
          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
          style={{
            background: up ? '#dcfce7' : '#fee2e2',
            color: up ? '#16a34a' : '#dc2626',
          }}
        >
          {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend}
        </span>
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: theme.text }}>{value}</div>
      <div className="text-sm" style={{ color: theme.textMuted }}>{title}</div>
      <div className="text-xs mt-1" style={{ color: theme.textMuted }}>{sub}</div>
    </div>
  )
}

export default function Dashboard() {
  const { theme } = useTheme()
  const api = useApiClient()
  const [c1, c2, c3, c4] = theme.chartColors

  const [stats, setStats] = useState({ targets: 0, scans: 0, vulns: 0, reports: 0 })
  const [recentScans, setRecentScans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [t, s, v, r, allVulns] = await Promise.allSettled([
        api.targets.getAll({ l: 1 }),
        api.scans.getAll(),
        api.vulns.getAll({ l: 1 }),
        api.reports.getAll({ l: 1 }),
        api.vulns.getAll() // Fetch full list to check exact critical bugs
      ]).then(rs => rs.map(out => (out.status === 'fulfilled' ? out.value : null)))

      setStats({
        targets: t?.data?.pagination?.count || t?.data?.targets?.length || 0,
        scans: s?.data?.pagination?.count || s?.data?.scans?.length || 0,
        vulns: v?.data?.pagination?.count || v?.data?.vulnerabilities?.length || 0,
        reports: r?.data?.pagination?.count || r?.data?.reports?.length || 0,
      })

      if (s?.data?.scans) {
        setRecentScans(s.data.scans.slice(0, 5))
      }

      // Track critical vulnerabilities for Twilio calls
      if (allVulns?.data?.vulnerabilities) {
        const alerted = JSON.parse(localStorage.getItem('alerted_critical_vulns') || '[]')
        let newCriticalFound = false

        let combinedCount = 0
        let highestSev = 'High'

        allVulns.data.vulnerabilities.forEach(vuln => {
          if ((vuln.severity === 'critical' || vuln.severity === 'high')) {
            combinedCount++
            if (vuln.severity === 'critical') highestSev = 'Critical'

            if (!alerted.includes(vuln.vuln_id)) {
              newCriticalFound = true
              alerted.push(vuln.vuln_id)
            }
          }
        })

        if (newCriticalFound) {
          localStorage.setItem('alerted_critical_vulns', JSON.stringify(alerted))
          triggerTwilioCall(combinedCount, highestSev) // Make the phone call with DYNAMIC DATA
            .catch((err) => alert('Twilio alert failed: ' + err.message))
        }
      }

    } catch(e) {
      console.error("Dashboard Load Error:", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Overview of your security scanning activity</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => {
            alert('Testing Custom Neural Voice Call...');
            triggerTwilioCall(7, 'Critical').catch((err) => alert(err.message)); // Sending dummy 7 Criticals to test dynamics 
          }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: '#ea580c' }}>
            <PhoneCall size={14} /> Test Twilio Alert
          </button>
          <button onClick={load} disabled={loading} className="p-2 rounded-xl" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard title="Total Targets" value={loading ? '...' : stats.targets} sub="Active scan targets" icon={Target} trend="+12%" up={true} />
        <KpiCard title="Scans Run" value={loading ? '...' : stats.scans} sub="Last 30 days" icon={Scan} trend="+8%" up={true} />
        <KpiCard title="Vulnerabilities" value={loading ? '...' : stats.vulns} sub="Across all scans" icon={ShieldAlert} trend="+23%" up={false} />
        <KpiCard title="Reports" value={loading ? '...' : stats.reports} sub="Generated reports" icon={FileText} trend="+5%" up={true} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Line Chart */}
        <div className="rounded-2xl p-5 shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: theme.text }}>Scans & Vulnerabilities Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
              <XAxis dataKey="month" tick={{ fill: theme.textMuted, fontSize: 12 }} />
              <YAxis tick={{ fill: theme.textMuted, fontSize: 12 }} />
              <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="scans" stroke={c1} strokeWidth={2.5} dot={{ r: 4, fill: c1 }} />
              <Line type="monotone" dataKey="vulns" stroke={c2} strokeWidth={2.5} dot={{ r: 4, fill: c2 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="rounded-2xl p-5 shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: theme.text }}>Weekly Vulnerability Severity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
              <XAxis dataKey="day" tick={{ fill: theme.textMuted, fontSize: 12 }} />
              <YAxis tick={{ fill: theme.textMuted, fontSize: 12 }} />
              <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="critical" fill={c1} radius={[4, 4, 0, 0]} />
              <Bar dataKey="high" fill={c2} radius={[4, 4, 0, 0]} />
              <Bar dataKey="medium" fill={c3} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="col-span-2 rounded-2xl p-5 shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: theme.text }}>Target Activity (24h)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c1} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={c1} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
              <XAxis dataKey="time" tick={{ fill: theme.textMuted, fontSize: 12 }} />
              <YAxis tick={{ fill: theme.textMuted, fontSize: 12 }} />
              <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12 }} />
              <Area type="monotone" dataKey="targets" stroke={c1} strokeWidth={2.5} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="rounded-2xl p-5 shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: theme.text }}>Vuln Severity Split</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {donutData.map((_, i) => (
                  <Cell key={i} fill={theme.chartColors[i % theme.chartColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12 }} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold text-sm" style={{ color: theme.text }}>Recent Scans</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: theme.bg }}>
              {['Target', 'Status', 'Vulnerabilities', 'Started', 'Duration'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-5 py-3 text-center text-sm" style={{ color: theme.textMuted }}>Loading...</td></tr> : recentScans.map((s, i) => {
              const status = s.current_session?.status || s.status
              return (
              <tr key={i} style={{ borderTop: `1px solid ${theme.border}` }}>
                <td className="px-5 py-3 font-medium" style={{ color: theme.text }}>{s.target?.address || s.target_id}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-1 rounded-lg text-xs font-semibold capitalize" style={{
                    background: status === 'completed' ? '#dcfce7' : status === 'processing' ? '#dbeafe' : '#fee2e2',
                    color: status === 'completed' ? '#16a34a' : status === 'processing' ? '#1d4ed8' : '#dc2626',
                  }}>{status}</span>
                </td>
                <td className="px-5 py-3 text-xs" style={{ color: theme.text }}>{s.profile?.name || '-'}</td>
                <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>{s.current_session?.start_date ? new Date(s.current_session.start_date).toLocaleString() : '-'}</td>
                <td className="px-5 py-3 text-xs" style={{ color: theme.textMuted }}>-</td>
              </tr>
            )})}
            {!loading && recentScans.length === 0 && <tr><td colSpan={5} className="px-5 py-3 text-center text-sm" style={{ color: theme.textMuted }}>No recent scans</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
