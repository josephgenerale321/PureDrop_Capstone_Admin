function UsersHeader({ isMobileNavOpen, onToggleMobileNav }) {
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
    </header>
  )
}

export default UsersHeader
