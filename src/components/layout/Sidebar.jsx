import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import {
  LayoutDashboard, Target, Scan, ShieldAlert,
  FileText, Users, Settings, ChevronRight,
  Folder, ScanLine, Link2, Download,
  Shield, Cpu, Clock, UsersRound, ChevronDown, ChevronUp,
  GitBranch
} from 'lucide-react'
import { useState } from 'react'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { path: '/attack-paths', label: 'Attack Paths', icon: GitBranch },
    ]
  },
  {
    label: 'Scanning',
    items: [
      { path: '/targets', label: 'Targets', icon: Target },
      { path: '/target-groups', label: 'Target Groups', icon: Folder },
      { path: '/scans', label: 'Scans', icon: Scan },
      { path: '/scan-profiles', label: 'Scan Profiles', icon: ScanLine },
      { path: '/excluded-hours', label: 'Excluded Hours', icon: Clock },
    ]
  },
  {
    label: 'Results',
    items: [
      { path: '/vulnerabilities', label: 'Vulnerabilities', icon: ShieldAlert },
      { path: '/reports', label: 'Reports', icon: FileText },
      { path: '/exports', label: 'Exports', icon: Download },
    ]
  },
  {
    label: 'Integrations',
    items: [
      { path: '/issue-trackers', label: 'Issue Trackers', icon: Link2 },
      { path: '/wafs', label: 'WAFs', icon: Shield },
      { path: '/workers', label: 'Workers', icon: Cpu },
    ]
  },
  {
    label: 'Admin',
    items: [
      { path: '/users', label: 'Users', icon: Users },
      { path: '/user-groups', label: 'User Groups', icon: UsersRound },
      { path: '/settings', label: 'Settings', icon: Settings },
    ]
  },
]

export default function Sidebar() {
  const { theme } = useTheme()
  const location = useLocation()

  const [expandedGroups, setExpandedGroups] = useState(() => 
    navGroups.reduce((acc, g) => ({ ...acc, [g.label]: true }), {})
  )

  const toggleGroup = (label) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <aside
      style={{ background: theme.sidebar, borderRight: `1px solid ${theme.border}` }}
      className="w-60 h-screen flex flex-col fixed left-0 top-0 z-20 overflow-y-auto overflow-x-hidden custom-scrollbar"
    >
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-3 sticky top-0" style={{ background: theme.sidebar, borderBottom: `1px solid ${theme.border}` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0" style={{ background: theme.primary }}>
          <ShieldAlert size={18} color="#fff" />
        </div>
        <div>
          <div className="font-bold text-sm leading-tight" style={{ color: theme.text }}>DRONIKASTRA</div>
          <div className="text-xs" style={{ color: theme.textMuted }}>Scanner Dashboard</div>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-3 py-3 space-y-4">
        {navGroups.map(group => (
          <div key={group.label}>
            <button 
              onClick={() => toggleGroup(group.label)}
              className="w-full flex items-center justify-between px-3 py-1.5 mb-1 cursor-pointer hover:opacity-80 transition"
            >
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: theme.textMuted }}>{group.label}</span>
              {expandedGroups[group.label] ? (
                <ChevronUp size={14} style={{ color: theme.textMuted }} />
              ) : (
                <ChevronDown size={14} style={{ color: theme.textMuted }} />
              )}
            </button>
            {expandedGroups[group.label] && (
              <div className="space-y-0.5">
                {group.items.map(({ path, label, icon: Icon, exact }) => {
                  const active = isActive(path, exact)
                  return (
                    <NavLink
                      key={path}
                      to={path}
                      style={{
                        background: active ? theme.primary : 'transparent',
                        color: active ? '#fff' : theme.textMuted,
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all duration-200"
                    >
                      <Icon size={16} />
                      <span className="flex-1">{label}</span>
                      {active && <ChevronRight size={12} />}
                    </NavLink>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 sticky bottom-0" style={{ borderTop: `1px solid ${theme.border}`, background: theme.sidebar }}>
        <div className="text-xs" style={{ color: theme.textMuted }}>v1.0.0 · DRONIKASTRA</div>
      </div>
    </aside>
  )
}
