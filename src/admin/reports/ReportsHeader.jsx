import { Link } from 'react-router-dom'
import { ProfileIcon, LogoutIcon } from '../AdminIcons.jsx'

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
          <span className="admin-reports-toggle-icon" aria-hidden="true">
            {isMobileNavOpen ? '✕' : '☰'}
          </span>
          {isMobileNavOpen ? 'Close Menu' : 'Menu'}
        </button>
        <h1 className="admin-reports-title">Reports</h1>
        <p className="admin-reports-subtitle">View and manage system reports and reported issues.</p>
      </div>
      <div className="admin-reports-top-actions">
        <Link to="/admin/profile" className="btn btn-outline-secondary admin-header-icon-btn" title="Admin Profile">
          <ProfileIcon className="admin-header-icon" />
          <span>Profile</span>
        </Link>
        <button type="button" className="btn btn-outline-secondary admin-header-icon-btn admin-header-icon-btn-danger" onClick={onLogout} title="Logout">
          <LogoutIcon className="admin-header-icon" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}

export default ReportsHeader
