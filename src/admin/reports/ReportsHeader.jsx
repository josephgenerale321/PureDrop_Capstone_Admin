function ReportsHeader({ isMobileNavOpen, onToggleMobileNav }) {
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
    </header>
  )
}

export default ReportsHeader
