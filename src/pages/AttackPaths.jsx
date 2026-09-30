import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { Shield, GitBranch, Target, Zap, Server, Key, ArrowRight, ShieldCheck, Activity } from 'lucide-react'

// Simulated Output from Graph Traversal Algorithm
const engineResult = {
  total_paths: 24,
  critical_paths: 15,
  choke_point: {
    node_id: "API_042",
    endpoint: "POST /api/v1/auth/exchange",
    issue: "Broken Authentication / Missing Context Validation",
    risk_reduction_score: 80, // % of critical paths neutralized
    paths_severed: 12,
    layer: "Authentication Layer"
  },
  overlapping_paths: [
    { id: "P1", sequence: ["Public Internet", "GET /api/public", "POST /api/v1/auth/exchange", "GET /api/v1/admin/keys", "Data Exfiltration"], risk: "Critical" },
    { id: "P2", sequence: ["Compromised Insider", "POST /api/v1/auth/exchange", "POST /api/v1/users/escalate", "System Takeover"], risk: "Critical" },
    { id: "P3", sequence: ["Stolen JWT", "POST /api/v1/auth/exchange", "GET /api/v1/billing/export", "Data Exfiltration"], risk: "High" },
  ],
  secondary_choke_points: [
    { endpoint: "GET /api/v1/admin/*", reduction: 35, issue: "Insufficient Role-Based Access Control" },
    { endpoint: "AWS S3 Bucket Policy", reduction: 15, issue: "Public Read Access" }
  ]
}

function KpiCard({ title, value, sub, icon: Icon, theme, accent }) {
  return (
    <div className="rounded-2xl p-5 shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: theme.bg }}>
          <Icon size={20} style={{ color: accent || theme.primary }} />
        </div>
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: theme.text }}>{value}</div>
      <div className="text-sm font-medium" style={{ color: theme.textMuted }}>{title}</div>
      <div className="text-xs mt-1" style={{ color: theme.textMuted }}>{sub}</div>
    </div>
  )
}

export default function AttackPaths() {
  const { theme } = useTheme()
  const { choke_point: cp } = engineResult

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Attack Path Analysis</h1>
        <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Algorithmic Choke Point Identification</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard title="Total Attack Paths" value={engineResult.total_paths} sub="Discovered by Engine" icon={GitBranch} theme={theme} accent={theme.primary} />
        <KpiCard title="Critical Paths" value={engineResult.critical_paths} sub="High Priority Chains" icon={Zap} theme={theme} accent="#ea580c" />
        <KpiCard title="Paths Severed" value={cp.paths_severed} sub={`By fixing ${cp.endpoint.split(' ')[0]}`} icon={Shield} theme={theme} accent="#16a34a" />
        <KpiCard title="Risk Reduction" value={`${cp.risk_reduction_score}%`} sub="Overall Security Lift" icon={Activity} theme={theme} accent="#16a34a" />
      </div>

      {/* Suggested Remediation (The Choke Point) */}
      <div className="rounded-2xl p-6 shadow-sm relative overflow-hidden" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Target size={150} />
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide" style={{ background: '#fee2e2', color: '#dc2626' }}>
            Top Remediation Parameter
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide" style={{ background: '#dcfce7', color: '#16a34a' }}>
            {cp.risk_reduction_score}% Risk Reduction
          </span>
        </div>

        <h2 className="text-2xl font-bold font-mono mb-2" style={{ color: theme.text }}>{cp.endpoint}</h2>
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
            <Server size={16} /> Layer: {cp.layer}
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
            <Key size={16} /> Issue: {cp.issue}
          </div>
        </div>

        <p className="text-sm max-w-3xl leading-relaxed" style={{ color: theme.textMuted }}>
          The graph traversal algorithm has identified this node as the most critical choke point. 
          Patching this single misconfiguration will neutralize <strong>{cp.paths_severed} out of {engineResult.critical_paths} critical attack chains</strong>, effectively severing overlapping lateral movement opportunities.
        </p>
        
        <div className="mt-6 flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: theme.primary }}>
            <ShieldCheck size={16} /> Auto-Generate WAF Rule
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
            View Patching Guide
          </button>
        </div>
      </div>

      {/* Graph Visualizer / Path Overlaps */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-2xl p-6 shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>Overlapping Attack Chains</h3>
          <p className="text-xs mb-6" style={{ color: theme.textMuted }}>Paths intersecting at the identified choke point.</p>
          
          <div className="space-y-6">
            {engineResult.overlapping_paths.map(path => (
              <div key={path.id} className="relative">
                <div className="text-xs font-bold mb-2 flex items-center justify-between">
                  <span style={{ color: theme.textMuted }}>Chain {path.id}</span>
                  <span style={{ color: path.risk === 'Critical' ? '#dc2626' : '#ea580c' }}>{path.risk}</span>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  {path.sequence.map((node, idx) => {
                    const isChokeNode = node === cp.endpoint;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="px-3 py-2 rounded-lg text-xs font-mono transition-transform hover:scale-105" 
                          style={{ 
                            background: isChokeNode ? '#fee2e2' : theme.bg, 
                            border: `1px solid ${isChokeNode ? '#dc2626' : theme.border}`,
                            color: isChokeNode ? '#dc2626' : theme.text,
                            fontWeight: isChokeNode ? 'bold' : 'normal'
                          }}>
                          {node}
                        </div>
                        {idx < path.sequence.length - 1 && (
                          <ArrowRight size={14} style={{ color: theme.textMuted }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alternative Secondary Choke Points */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text }}>Secondary Alternatives</h3>
          <div className="space-y-4">
            {engineResult.secondary_choke_points.map((alt, idx) => (
              <div key={idx} className="p-4 rounded-xl" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                <div className="text-sm font-mono font-bold mb-2 truncate" style={{ color: theme.text }}>{alt.endpoint}</div>
                <div className="text-xs mb-3" style={{ color: theme.textMuted }}>{alt.issue}</div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold" style={{ color: theme.text }}>Reduction</div>
                  <div className="text-xs font-bold px-2 py-1 rounded-md" style={{ background: theme.card, color: '#ea580c' }}>
                    {alt.reduction}%
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full mt-2" style={{ background: theme.border }}>
                  <div className="h-full rounded-full" style={{ width: `${alt.reduction}%`, background: '#ea580c' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}