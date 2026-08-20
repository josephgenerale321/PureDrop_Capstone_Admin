import './home.css'
import './admin-states.css'
import AdminDashboardContent from './dashboard/AdminDashboardContent.jsx'
import useAdminDashboard from './dashboard/useAdminDashboard.js'
import AdminLoadingState from './AdminLoadingState.jsx'
import AdminErrorState from './AdminErrorState.jsx'

function AdminHome({ user, onLogout }) {
  const { isLoading, loadError, isAccessDenied, adminName, adminInitials, dashboard, retry } = useAdminDashboard(user)

  if (isLoading) {
    return (
      <main className="admin-dashboard-page">
        <div className="admin-dashboard-loading">
          <AdminLoadingState label="Loading dashboard..." />
        </div>
      </main>
    )
  }

  if (!isAccessDenied && loadError && !dashboard.totalUsers && !dashboard.totalReports) {
    return (
      <main className="admin-dashboard-page">
        <div className="admin-dashboard-loading">
          <AdminErrorState
            title="Unable to load dashboard"
            message={loadError}
            onRetry={retry}
            tips={[
              'Check your network connection',
              'Verify your admin permissions',
              'Try again in a few moments',
            ]}
          />
        </div>
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
      onRetryDashboard={retry}
    />
  )
}

export default AdminHome