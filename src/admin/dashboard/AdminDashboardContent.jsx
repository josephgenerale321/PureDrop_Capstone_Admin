import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '../sidebar.jsx'

function AdminDashboardContent({
  onLogout,
  isAccessDenied,
  loadError,
  dashboard,
  adminInitials,
  adminName,
  userEmail,
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsMobileNavOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined' || !isMobileNavOpen) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileNavOpen])

  return (
    <main className="admin-dashboard-page">
      <div className={`admin-dashboard-shell${isMobileNavOpen ? ' is-nav-open' : ''}`}>
        <div id="admin-dashboard-sidebar" className="admin-dashboard-sidebar-wrap">
          <AdminSidebar
            baseClass="admin-dashboard"
            activeItem="dashboard"
            onNavigate={() => {
              setIsMobileNavOpen(false)
            }}
          />
        </div>

        <section className="admin-dashboard-content">
          <header className="admin-dashboard-header">
            <div>
              <button
                type="button"
                className="btn btn-outline-secondary admin-dashboard-mobile-toggle"
                onClick={() => setIsMobileNavOpen((current) => !current)}
                aria-expanded={isMobileNavOpen}
                aria-controls="admin-dashboard-sidebar"
              >
                {isMobileNavOpen ? 'Close Menu' : 'Menu'}
              </button>
              <h1 className="admin-dashboard-title">Administrator</h1>
              <p className="admin-dashboard-subtitle">Manage users, reports, and system updates.</p>
            </div>
            <div className="admin-dashboard-top-actions">
              <Link to="/admin/profile" className="btn btn-outline-secondary">
                Admin Profile
              </Link>
              <button type="button" className="btn btn-outline-secondary" onClick={onLogout}>
                Logout
              </button>
            </div>
          </header>

          {isAccessDenied && (
            <section className="admin-dashboard-card">
              <h2 className="admin-dashboard-card-title">Access Restricted</h2>
              <p className="admin-dashboard-inline-error mb-0">{loadError || 'Admin access is required.'}</p>
            </section>
          )}

          {!isAccessDenied && (
            <>
              <section className="admin-dashboard-metrics">
                <article className="admin-metric-card">
                  <p className="admin-metric-label">Total Users</p>
                  <h2 className="admin-metric-value">{dashboard.totalUsers}</h2>
                  <p className="admin-metric-note">Registered accounts</p>
                </article>

                <article className="admin-metric-card">
                  <p className="admin-metric-label">Total Reports</p>
                  <h2 className="admin-metric-value">{dashboard.totalReports}</h2>
                  <p className="admin-metric-note">All submitted reports</p>
                </article>

                <article className="admin-metric-card">
                  <p className="admin-metric-label">Open Reports</p>
                  <h2 className="admin-metric-value">{dashboard.openReports}</h2>
                  <p className="admin-metric-note">Pending, approved, and rejected</p>
                </article>

                <article className="admin-metric-card">
                  <p className="admin-metric-label">System Status</p>
                  <h2 className={`admin-metric-value status-${dashboard.systemStatusClass}`}>{dashboard.systemStatusLabel}</h2>
                  <p className="admin-metric-note">Resolved: {dashboard.resolvedReports}</p>
                </article>
              </section>

              <div className="admin-dashboard-grid">
                <section className="admin-dashboard-card">
                  <div className="admin-dashboard-card-head">
                    <div>
                      <h2 className="admin-dashboard-card-title">Reports Management</h2>
                      <p className="admin-dashboard-card-subtitle">Latest submitted reports across all users.</p>
                    </div>
                    <Link to="/admin/reports" className="btn btn-outline-secondary">
                      Open Reports
                    </Link>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-sm align-middle admin-dashboard-table">
                      <thead>
                        <tr>
                          <th>Report ID</th>
                          <th>Reporter</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Location</th>
                          <th>Updated</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!dashboard.recentReports.length && (
                          <tr>
                            <td colSpan={7} className="text-center text-muted py-4">
                              No reports found.
                            </td>
                          </tr>
                        )}
                        {dashboard.recentReports.map((report) => (
                          <tr key={report.key}>
                            <td>REP-{report.reportId}</td>
                            <td>{report.reporterName}</td>
                            <td>{report.category}</td>
                            <td>
                              <span className={`badge-pill report-status-${report.statusClass}`}>{report.status}</span>
                            </td>
                            <td>{report.location}</td>
                            <td>{report.statusUpdatedAtLabel}</td>
                            <td>
                              <Link to="/admin/reports" className="btn btn-sm btn-outline-secondary">
                                Manage
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <aside className="admin-dashboard-side-panels">
                  <section className="admin-dashboard-card">
                    <h2 className="admin-dashboard-card-title mb-3">Recent Activity</h2>
                    {!dashboard.recentActivity.length && <p className="text-muted mb-0">No activity yet.</p>}
                    {!!dashboard.recentActivity.length && (
                      <ul className="dashboard-activity-list">
                        {dashboard.recentActivity.map((activity) => (
                          <li key={activity.id}>
                            <strong>{activity.label}</strong>
                            <span>{activity.meta}</span>
                            <time>{activity.timeAgo}</time>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="admin-dashboard-card">
                    <h2 className="admin-dashboard-card-title mb-3">Quick Snapshot</h2>
                    <dl className="dashboard-details-list">
                      <div>
                        <dt>Admin Account</dt>
                        <dd>
                          <span className="admin-dashboard-avatar">{adminInitials}</span>
                          <span className="admin-dashboard-avatar-text">{adminName || userEmail || 'Administrator'}</span>
                        </dd>
                      </div>
                      <div>
                        <dt>Reports Today</dt>
                        <dd>{dashboard.reportsToday}</dd>
                      </div>
                      <div>
                        <dt>Latest Report Time</dt>
                        <dd>{dashboard.lastReportAtLabel}</dd>
                      </div>
                      <div>
                        <dt>Open / Total</dt>
                        <dd>
                          {dashboard.openReports} / {dashboard.totalReports}
                        </dd>
                      </div>
                    </dl>
                  </section>
                </aside>
              </div>
            </>
          )}

          {!isAccessDenied && loadError && <p className="admin-dashboard-inline-error mb-0">{loadError}</p>}
        </section>
        <button
          type="button"
          className="admin-dashboard-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileNavOpen(false)}
        />
      </div>
    </main>
  )
}

export default AdminDashboardContent
