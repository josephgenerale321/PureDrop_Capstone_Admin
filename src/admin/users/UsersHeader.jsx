import { Link } from 'react-router-dom'
import { ProfileIcon, LogoutIcon } from '../AdminIcons.jsx'

function UsersHeader({ isMobileNavOpen, onToggleMobileNav, onLogout }) {
  return (
    <header className="admin-users-header">
      <div>
        <button
          type="button"
          className="btn btn-outline-secondary admin-users-mobile-toggle"
          onClick={onToggleMobileNav}
          aria-expanded={isMobileNavOpen}
          aria-controls="admin-users-sidebar"
        >
          <span className="admin-users-toggle-icon" aria-hidden="true">
            {isMobileNavOpen ? '✕' : '☰'}
          </span>
          {isMobileNavOpen ? 'Close Menu' : 'Menu'}
        </button>
        <h1 className="admin-users-title">Users</h1>
        <p className="admin-users-subtitle">View and manage user accounts and permissions.</p>
      </div>
      <div className="admin-users-top-actions">
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

export default UsersHeader
