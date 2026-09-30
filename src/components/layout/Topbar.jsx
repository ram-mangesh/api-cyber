import { useState } from 'react'
import { Bell, Search, ChevronDown, User } from 'lucide-react'
import { useTheme, themes } from '../../context/ThemeContext'

export default function Topbar() {
  const { theme, currentTheme, setCurrentTheme } = useTheme()
  const [themeOpen, setThemeOpen] = useState(false)

  return (
    <header
      style={{ background: theme.card, borderBottom: `1px solid ${theme.border}` }}
      className="fixed top-0 left-60 right-0 z-10 h-16 flex items-center px-6 gap-4"
    >
      {/* Search */}
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-xl flex-1 max-w-xs"
        style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
      >
        <Search size={15} style={{ color: theme.textMuted }} />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm outline-none w-full"
          style={{ color: theme.text }}
        />
      </div>

      <div className="flex-1" />

      {/* Theme Switcher */}
      <div className="relative">
        <button
          onClick={() => setThemeOpen(!themeOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
        >
          <div className="w-3 h-3 rounded-full" style={{ background: theme.primary }} />
          {themes[currentTheme].name}
          <ChevronDown size={14} style={{ color: theme.textMuted }} />
        </button>

        {themeOpen && (
          <div
            className="absolute right-0 mt-2 w-52 rounded-xl shadow-lg overflow-hidden z-50"
            style={{ background: theme.card, border: `1px solid ${theme.border}` }}
          >
            {Object.entries(themes).map(([key, t]) => (
              <button
                key={key}
                onClick={() => { setCurrentTheme(key); setThemeOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:opacity-80 transition"
                style={{
                  background: currentTheme === key ? theme.bg : 'transparent',
                  color: theme.text,
                }}
              >
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full border" style={{ background: t.bg, borderColor: t.border }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: t.primary }} />
                </div>
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <button
        className="w-9 h-9 rounded-xl flex items-center justify-center relative"
        style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
      >
        <Bell size={17} style={{ color: theme.textMuted }} />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: theme.primary }}
        />
      </button>

      {/* User Avatar */}
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: theme.primary }}
        >
          <User size={14} color="#fff" />
        </div>
        <span className="text-sm font-medium" style={{ color: theme.text }}>Admin</span>
      </button>
    </header>
  )
}
