import { Link } from 'react-router-dom'

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
          {isMobileNavOpen ? 'Close Menu' : 'Menu'}
        </button>
        <h1 className="admin-users-title">Users</h1>
        <p className="admin-users-subtitle">View and manage user accounts and permissions.</p>
      </div>
      <div className="admin-users-top-actions">
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

export default UsersHeader
