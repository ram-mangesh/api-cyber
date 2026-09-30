import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { ShieldAlert, ArrowRight, Activity, Lock, Server } from 'lucide-react'

export default function Landing() {
  const { theme } = useTheme()

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text }} className="flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: theme.primary }}>
            <ShieldAlert size={20} color="#fff" />
          </div>
          <span className="font-bold tracking-tight text-xl">DRONIKASTRA</span>
        </div>
        <div className="flex gap-6 items-center">
          <a href="#features" className="text-sm font-medium hover:opacity-70 transition" style={{ color: theme.textMuted }}>Features</a>
          <a href="#about" className="text-sm font-medium hover:opacity-70 transition" style={{ color: theme.textMuted }}>Technology</a>
          <Link to="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-md" style={{ background: theme.primary }}>
            Log In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto py-20">
        <div className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-8 border" style={{ color: theme.primary, borderColor: theme.border, background: theme.card }}>
          Enterprise Security Platform v2.0
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Find vulnerabilities <br />
          <span style={{ color: theme.primary }}>before they find you.</span>
        </h1>
        
        <p className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed" style={{ color: theme.textMuted }}>
          Dronikastra is an advanced algorithmic scanning engine. Secure your APIs, infrastructure, and web apps with state-of-the-art DAST and automated exploit verifications.
        </p>
        
        <div className="flex gap-4">
          <Link to="/login" className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white transition-transform hover:scale-105 shadow-lg" style={{ background: theme.primary }}>
            Enter Dashboard <ArrowRight size={18} />
          </Link>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-20 px-8 w-full border-t" style={{ background: theme.card, borderColor: theme.border }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Dynamic App Testing", desc: "Automated crawling and testing of modern SPAs and APIs with deep authentication support.", icon: Activity },
            { title: "Stateful Exploit Replay", desc: "Automatically chain requests, extract JWTs, and validate exploitability with zero false positives.", icon: Lock },
            { title: "Continuous Monitoring", desc: "Set up target profiles with excluded hours, scheduled scans, and real-time webhook alerts.", icon: Server }
          ].map((f, i) => (
            <div key={i} className="p-8 rounded-3xl" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
              <div className="w-12 h-12 rounded-2xl mb-6 flex items-center justify-center opacity-90" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <f.icon size={24} style={{ color: theme.primary }} />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: theme.text }}>{f.title}</h3>
              <p className="leading-relaxed text-sm" style={{ color: theme.textMuted }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm font-medium" style={{ color: theme.textMuted, borderTop: `1px solid ${theme.border}` }}>
        &copy; 2026 Dronikastra Security Systems. All rights reserved.
      </footer>
    </div>
  )
}