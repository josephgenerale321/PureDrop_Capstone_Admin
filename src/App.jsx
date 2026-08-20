import { Navigate, Route, Routes } from 'react-router-dom'
import AdminHome from './admin/home.jsx'
import AdminProfile from './admin/profile.jsx'
import AdminReports from './admin/reports.jsx'
import AdminSettings from './admin/settings.jsx'
import AdminUsers from './admin/users.jsx'
import AdminLogin from './login/adminlogin.jsx'
import useAdminSavedLogin from './admin/savedlogin/adminsavelogin.jsx'
import NoInternetScreen from './components/NoInternetScreen.jsx'

function App() {
  const { adminUser, isRestoring, rememberedEmail, signOut, clearRememberedEmail } = useAdminSavedLogin()

  // While the saved session is being restored from localStorage / Firebase,
  // show a lightweight loading state so we don't flash the login screen.
  if (isRestoring) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9fa',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#6c757d',
        }}
      >
        Restoring saved session…
      </div>
    )
  }

  return (
    <>
      {!adminUser ? (
        <NoInternetScreen>
          <AdminLogin rememberedEmail={rememberedEmail} onClearRememberedEmail={clearRememberedEmail} />
        </NoInternetScreen>
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminHome user={adminUser} onLogout={signOut} />} />
          <Route path="/admin/profile" element={<AdminProfile user={adminUser} onLogout={signOut} />} />
          <Route path="/admin/users" element={<AdminUsers user={adminUser} onLogout={signOut} />} />
          <Route path="/admin/reports" element={<AdminReports user={adminUser} onLogout={signOut} />} />
          <Route path="/admin/settings" element={<AdminSettings user={adminUser} onLogout={signOut} />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      )}
    </>
  )
}

export default App