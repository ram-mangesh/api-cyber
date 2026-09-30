import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { ShieldAlert, LogIn } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const { theme } = useTheme()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (login(username, password)) {
      navigate('/dashboard')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 transition-colors duration-300" style={{ background: theme.bg }}>
      
      {/* Back to Home Header */}
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-2 text-sm font-bold" style={{ color: theme.primary }}>
          <ShieldAlert size={18} /> DRONIKASTRA
        </Link>
      </div>

      <div className="w-full max-w-md p-8 md:p-10 rounded-3xl shadow-2xl transition-all duration-300" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-inner mb-4" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
            <ShieldAlert size={28} style={{ color: theme.primary }} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: theme.text }}>Welcome Back</h2>
          <p className="text-sm mt-2 font-medium" style={{ color: theme.textMuted }}>Sign in to access your security dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm rounded-xl font-medium text-center" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #f87171' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-shadow duration-200"
              style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
              placeholder="e.g., admin"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-shadow duration-200"
              style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-transform hover:scale-[1.02] shadow-md mt-6"
            style={{ background: theme.primary }}
          >
            <LogIn size={18} /> Sign In
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs" style={{ color: theme.textMuted }}>
          Protected by Dronikastra Advanced Security
        </div>
      </div>
    </div>
  )
}