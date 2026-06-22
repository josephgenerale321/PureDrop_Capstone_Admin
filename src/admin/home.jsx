import './home.css'
import AdminDashboardContent from './dashboard/AdminDashboardContent.jsx'
import useAdminDashboard from './dashboard/useAdminDashboard.js'

function AdminHome({ user, onLogout }) {
  const { isLoading, loadError, isAccessDenied, adminName, adminInitials, dashboard } = useAdminDashboard(user)

  if (isLoading) {
    return (
      <main className="admin-dashboard-page">
        <section className="admin-dashboard-loading">Loading dashboard...</section>
      </main>
    )
  }

  return (
    <AdminDashboardContent
      onLogout={onLogout}
      isAccessDenied={isAccessDenied}
      loadError={loadError}
      dashboard={dashboard}
      adminInitials={adminInitials}
      adminName={adminName}
      userEmail={user?.email}
    />
  )
}

export default AdminHome
