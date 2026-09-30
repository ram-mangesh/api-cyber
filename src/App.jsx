import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ApiProvider } from './context/ApiContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AttackPaths from './pages/AttackPaths'
import Targets from './pages/Targets'
import TargetGroups from './pages/TargetGroups'
import Scans from './pages/Scans'
import ScanDetail from './pages/ScanDetail'
import ScanProfiles from './pages/ScanProfiles'
import Vulnerabilities from './pages/Vulnerabilities'
import VulnDetail from './pages/VulnDetail'
import Reports from './pages/Reports'
import Exports from './pages/Exports'
import IssueTrackers from './pages/IssueTrackers'
import WAFs from './pages/WAFs'
import Workers from './pages/Workers'
import ExcludedHours from './pages/ExcludedHours'
import Users from './pages/Users'
import UserGroups from './pages/UserGroups'
import Settings from './pages/Settings'

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

// Public Route Wrapper
const PublicRoute = () => {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <ApiProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicRoute />}>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
              </Route>

              {/* Protected Dashboard Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/attack-paths" element={<AttackPaths />} />
                  <Route path="/targets" element={<Targets />} />
                  <Route path="/target-groups" element={<TargetGroups />} />
                  <Route path="/scans" element={<Scans />} />
                  <Route path="/scans/:scanId" element={<ScanDetail />} />
                  <Route path="/scan-profiles" element={<ScanProfiles />} />
                  <Route path="/vulnerabilities" element={<Vulnerabilities />} />
                  <Route path="/vulnerabilities/:vulnId" element={<VulnDetail />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/exports" element={<Exports />} />
                  <Route path="/issue-trackers" element={<IssueTrackers />} />
                  <Route path="/wafs" element={<WAFs />} />
                  <Route path="/workers" element={<Workers />} />
                  <Route path="/excluded-hours" element={<ExcludedHours />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/user-groups" element={<UserGroups />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ApiProvider>
    </ThemeProvider>
  )
}
