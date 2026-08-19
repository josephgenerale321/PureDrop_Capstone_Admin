import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '../sidebar.jsx'
import useAdminMobileNav from '../useAdminMobileNav.js'
import useLogout from '../useLogout.js'
import LogoutConfirmModal from '../LogoutConfirmModal.jsx'
import RecentActivityModal from './RecentActivityModal.jsx'
import ActivityItem from './ActivityItem.jsx'
import { DocumentIcon, ProfileIcon, LogoutIcon } from '../AdminIcons.jsx'
import PaginationControls from '../pagination/PaginationControls.jsx'

const DEFAULT_PAGE_SIZE = 10

const SORTABLE_COLUMNS = [
  { key: 'reportId', label: 'Report ID', getValue: (report) => report.reportId },
  { key: 'reporterName', label: 'Reporter', getValue: (report) => report.reporterName },
  { key: 'category', label: 'Category', getValue: (report) => report.category },
  { key: 'status', label: 'Status', getValue: (report) => report.status },
  { key: 'location', label: 'Location', getValue: (report) => report.location },
  { key: 'statusUpdatedAtLabel', label: 'Updated', getValue: (report) => report.statusUpdatedAtLabel },
]

function AdminDashboardContent({
  onLogout,
  isAccessDenied,
  loadError,
  dashboard,
  adminName,
  adminInitials,
  userEmail,
}) {
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useAdminMobileNav()
  const {
    isLogoutModalOpen,
    isSigningOut,
    logoutError,
    confirmLogout,
    closeLogoutModal,
    handleConfirmLogout,
  } = useLogout(onLogout)
  const [sortKey, setSortKey] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)

  const sortedReports = useMemo(() => {
    if (!dashboard?.recentReports || !sortKey) {
      return dashboard?.recentReports || []
    }

    const column = SORTABLE_COLUMNS.find((item) => item.key === sortKey)
    if (!column) {
      return dashboard.recentReports
    }

    return [...dashboard.recentReports].sort((a, b) => {
      const aValue = column.getValue(a)
      const bValue = column.getValue(b)
      const comparison = String(aValue ?? '')
        .localeCompare(String(bValue ?? ''), undefined, { numeric: true, sensitivity: 'base' })
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [dashboard, sortKey, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedReports.length / pageSize))
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedReports.slice(start, start + pageSize)
  }, [sortedReports, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [sortKey, sortDirection])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const renderSortIcon = (key) => {
    if (sortKey !== key) {
      return (
        <span className="admin-sort-icon" aria-hidden="true">
          ⇅
        </span>
      )
    }

    return sortDirection === 'asc' ? (
      <span className="admin-sort-icon is-active" aria-hidden="true">
        ↑
      </span>
    ) : (
      <span className="admin-sort-icon is-active" aria-hidden="true">
        ↓
      </span>
    )
  }

  return (
    <main className="admin-dashboard-page">
      <div className={`admin-dashboard-shell${isMobileNavOpen ? ' is-nav-open' : ''}`}>
        <div id="admin-dashboard-sidebar" className="admin-dashboard-sidebar-wrap">
          <AdminSidebar activeItem="dashboard" onClose={closeMobileNav} />
        </div>

        <section className="admin-dashboard-content">
          <header className="admin-dashboard-header">
            <div>
              <button
                type="button"
                className="btn btn-outline-secondary admin-dashboard-mobile-toggle"
                onClick={toggleMobileNav}
                aria-expanded={isMobileNavOpen}
                aria-controls="admin-dashboard-sidebar"
              >
                <span className="admin-dashboard-toggle-icon" aria-hidden="true">
                  {isMobileNavOpen ? '✕' : '☰'}
                </span>
                {isMobileNavOpen ? 'Close Menu' : 'Menu'}
              </button>
              <h1 className="admin-dashboard-title">Administrator</h1>
              <p className="admin-dashboard-subtitle">Manage users, reports, and system updates.</p>
            </div>
            <div className="admin-dashboard-top-actions">
              <Link to="/admin/profile" className="btn btn-outline-secondary admin-header-icon-btn" title="Admin Profile">
                <ProfileIcon className="admin-header-icon" />
                <span>Profile</span>
              </Link>
              <button type="button" className="btn btn-outline-secondary admin-header-icon-btn admin-header-icon-btn-danger" onClick={confirmLogout} title="Logout">
                <LogoutIcon className="admin-header-icon" />
                <span>Logout</span>
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
                  <p className="admin-metric-note">Pending and resolving</p>
                </article>

                <article className="admin-metric-card">
                  <p className="admin-metric-label">System Status</p>
                  <h2 className={`admin-metric-value status-${dashboard.systemStatusClass}`}>{dashboard.systemStatusLabel}</h2>
                  <p className="admin-metric-note">Approved: {dashboard.approvedReports}</p>
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
                          {SORTABLE_COLUMNS.map((column) => (
                            <th key={column.key}>
                              <button
                                type="button"
                                className={`admin-sort-header${sortKey === column.key ? ' is-active' : ''}`}
                                onClick={() => handleSort(column.key)}
                              >
                                {column.label}
                                {renderSortIcon(column.key)}
                              </button>
                            </th>
                          ))}
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!sortedReports.length && (
                          <tr>
                            <td colSpan={7} className="text-center text-muted py-4">
                              No reports found.
                            </td>
                          </tr>
                        )}
                        {paginatedReports.map((report) => (
                          <tr key={report.key}>
                            <td data-label="Report ID">REP-{report.reportId}</td>
                            <td data-label="Reporter">{report.reporterName}</td>
                            <td data-label="Category">{report.category}</td>
                            <td data-label="Status">
                              <span className={`badge-pill report-status-${report.statusClass}`}>{report.status}</span>
                            </td>
                            <td data-label="Location">{report.location}</td>
                            <td data-label="Updated">{report.statusUpdatedAtLabel}</td>
                            <td data-label="Action">
                              <Link to="/admin/reports" className="btn btn-sm btn-outline-secondary">
                                Manage
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={sortedReports.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </section>

                <aside className="admin-dashboard-side-panels">
                  <section className="admin-dashboard-card">
                    <div className="admin-dashboard-card-head">
                      <div>
                        <h2 className="admin-dashboard-card-title">Recent Activity</h2>
                        <p className="admin-dashboard-card-subtitle">Latest report activity across all users.</p>
                      </div>
                    </div>
                    {!dashboard.recentActivity.length && <p className="text-muted mb-0">No activity yet.</p>}
                    {!!dashboard.recentActivity.length && (
                      <ul className="dashboard-activity-list">
                        {dashboard.recentActivity.map((activity) => (
                          <ActivityItem key={activity.id} activity={activity} showTimeAgo />
                        ))}
                      </ul>
                    )}
                    {dashboard.allActivity.length > 0 && (
                      <div className="admin-activity-show-all">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setIsActivityModalOpen(true)}
                        >
                          Show All{' '}
                          <span className="admin-activity-show-all-count">{dashboard.allActivity.length}</span>
                        </button>
                      </div>
                    )}
                  </section>

                  <section className="admin-dashboard-card">
                    <h2 className="admin-dashboard-card-title mb-3">Quick Snapshot</h2>
                    <dl className="dashboard-details-list">
                      <div>
                        <dt>Admin Account</dt>
                        <dd className="admin-dashboard-account">
                          <span className="admin-dashboard-avatar-initials" aria-hidden="true">
                            {adminInitials}
                          </span>
                          <span className="admin-dashboard-account-text">
                            <span className="admin-dashboard-avatar-text">{adminName || userEmail || 'Administrator'}</span>
                            {userEmail && <span className="admin-dashboard-avatar-email">{userEmail}</span>}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Reports Today</dt>
                        <dd>
                          <span className="admin-snapshot-badge is-today">{dashboard.reportsToday}</span>
                        </dd>
                      </div>
                      <div>
                        <dt>Pending Reports</dt>
                        <dd>
                          <span className="admin-snapshot-badge is-pending">{dashboard.pendingReports}</span>
                        </dd>
                      </div>
                      <div>
                        <dt>Resolving Reports</dt>
                        <dd>
                          <span className="admin-snapshot-badge is-resolving">{dashboard.resolvingReports}</span>
                        </dd>
                      </div>
                      <div>
                        <dt>Approved Reports</dt>
                        <dd>
                          <span className="admin-snapshot-badge is-approved">{dashboard.approvedReports}</span>
                        </dd>
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
                    <div className="admin-snapshot-actions">
                      <Link to="/admin/reports" className="btn btn-sm btn-outline-secondary">
                        View Reports
                      </Link>
                      <Link to="/admin/users" className="btn btn-sm btn-outline-secondary">
                        Manage Users
                      </Link>
                      <Link to="/admin/profile" className="btn btn-sm btn-outline-secondary">
                        View Profile
                      </Link>
                    </div>
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
          onClick={closeMobileNav}
        />
      </div>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        isSigningOut={isSigningOut}
        error={logoutError}
        userEmail={userEmail}
        onConfirm={handleConfirmLogout}
        onClose={closeLogoutModal}
      />

      <RecentActivityModal
        isOpen={isActivityModalOpen}
        activities={dashboard.allActivity}
        onClose={() => setIsActivityModalOpen(false)}
      />
    </main>
  )
}

export default AdminDashboardContent
