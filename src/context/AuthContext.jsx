import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('dronikastra_auth') === 'true')

  const login = (username, password) => {
    const expectedUser = import.meta.env.VITE_DASHBOARD_USERNAME
    const expectedPass = import.meta.env.VITE_DASHBOARD_PASSWORD

    // No credentials configured means the dashboard stays locked instead of
    // falling back to a hardcoded default pair.
    if (!expectedUser || !expectedPass) return false

    if (username === expectedUser && password === expectedPass) {
      setIsAuthenticated(true)
      localStorage.setItem('dronikastra_auth', 'true')
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('dronikastra_auth')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
