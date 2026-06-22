import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminHome from './admin/home.jsx'
import AdminProfile from './admin/profile.jsx'
import AdminReports from './admin/reports.jsx'
import AdminSettings from './admin/settings.jsx'
import AdminUsers from './admin/users.jsx'
import AdminLogin from './login/adminlogin.jsx'

const ADMIN_SESSION_KEY = 'puredrop_admin_session'

function readAdminSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function App() {
  const [adminUser, setAdminUser] = useState(() => readAdminSession())

  const handleSignInSuccess = (user) => {
    setAdminUser(user)
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user))
  }

  const handleLogout = () => {
    setAdminUser(null)
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
  }

  if (!adminUser) {
    return <AdminLogin onSignInSuccess={handleSignInSuccess} />
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<AdminHome user={adminUser} onLogout={handleLogout} />} />
      <Route path="/admin/profile" element={<AdminProfile user={adminUser} onLogout={handleLogout} />} />
      <Route path="/admin/users" element={<AdminUsers user={adminUser} onLogout={handleLogout} />} />
      <Route path="/admin/reports" element={<AdminReports user={adminUser} onLogout={handleLogout} />} />
      <Route path="/admin/settings" element={<AdminSettings user={adminUser} onLogout={handleLogout} />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}

export default App
