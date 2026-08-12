import { NavLink } from 'react-router-dom'
import logo from '../assets/logo.png'
import DefaultAvatarImage from './DefaultAvatarImage.jsx'
import { LogoutIcon } from './AdminIcons.jsx'
import './sidebar.css'

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    to: '/admin/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    key: 'profile',
    label: 'Admin Profile',
    to: '/admin/profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: 'users',
    label: 'Users',
    to: '/admin/users',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'reports',
    label: 'Reports',
    to: '/admin/reports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    to: '/admin/settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

function AdminSidebar({
  activeItem,
  includeProfile = false,
  disabledItems = [],
  badges = {},
  user = null,
  onLogout,
  onClose,
}) {
  const navItems = NAV_ITEMS.filter((item) => {
    if (item.key === 'profile' && !includeProfile) {
      return false
    }
    return true
  })

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <img src={logo} className="admin-sidebar-logo" alt="PureDrop logo" />
        {onClose && (
          <button type="button" className="admin-sidebar-close" aria-label="Close navigation menu" onClick={onClose}>
            <span aria-hidden="true">✕</span>
          </button>
        )}
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map((item) => {
          const isDisabled = disabledItems.includes(item.key)
          const badge = badges[item.key]

          if (isDisabled) {
            return (
              <button key={item.key} type="button" className="admin-sidebar-nav-item" disabled>
                <span className="admin-sidebar-nav-icon">{item.icon}</span>
                <span className="admin-sidebar-nav-label">{item.label}</span>
              </button>
            )
          }

          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                `admin-sidebar-nav-item${isActive || activeItem === item.key ? ' is-active' : ''}`
              }
              onClick={onClose}
            >
              <span className="admin-sidebar-nav-icon">{item.icon}</span>
              <span className="admin-sidebar-nav-label">{item.label}</span>
              {badge != null && badge > 0 && <span className="admin-sidebar-nav-badge">{badge}</span>}
            </NavLink>
          )
        })}
      </nav>

      {(user || onLogout) && (
        <div className="admin-sidebar-footer">
          {user && (
            <div className="admin-sidebar-user">
              <DefaultAvatarImage alt="Admin avatar" className="admin-sidebar-user-avatar" />
              <div className="admin-sidebar-user-info">
                <span className="admin-sidebar-user-name">{user.name || user.email || 'Administrator'}</span>
                <span className="admin-sidebar-user-role">{user.role || 'Administrator'}</span>
              </div>
            </div>
          )}
          {onLogout && (
            <button type="button" className="admin-sidebar-logout" onClick={onLogout}>
              <LogoutIcon className="admin-sidebar-logout-icon" />
              <span>Logout</span>
            </button>
          )}
        </div>
      )}
    </aside>
  )
}

export default AdminSidebar