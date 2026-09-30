import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useTheme } from '../../context/ThemeContext'

export default function Layout() {
  const { theme } = useTheme()
  return (
    <div style={{ background: theme.bg, minHeight: '100vh' }}>
      <Sidebar />
      <Topbar />
      <main className="ml-60 pt-16 p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
