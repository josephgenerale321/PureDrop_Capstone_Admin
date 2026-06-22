import { Link } from 'react-router-dom'

function ReportsHeader({ isMobileNavOpen, onToggleMobileNav, onLogout }) {
  return (
    <header className="admin-reports-header">
      <div>
        <button
          type="button"
          className="btn btn-outline-secondary admin-reports-mobile-toggle"
          onClick={onToggleMobileNav}
          aria-expanded={isMobileNavOpen}
          aria-controls="admin-reports-sidebar"
        >
          {isMobileNavOpen ? 'Close Menu' : 'Menu'}
        </button>
        <h1 className="admin-reports-title">Reports</h1>
        <p className="admin-reports-subtitle">View and manage system reports and reported issues.</p>
      </div>
      <div className="admin-reports-top-actions">
        <Link to="/admin/profile" className="btn btn-outline-secondary">
          Admin Profile
        </Link>
        <button type="button" className="btn btn-outline-secondary" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}

export default ReportsHeader
