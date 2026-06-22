import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

function AdminSidebar({ baseClass, activeItem, includeProfile = false, settingsDisabled = false, onNavigate }) {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', to: '/admin/dashboard' },
    ...(includeProfile ? [{ key: 'profile', label: 'Admin Profile', to: '/admin/profile' }] : []),
    { key: 'users', label: 'Users', to: '/admin/users' },
    { key: 'reports', label: 'Reports', to: '/admin/reports' },
    { key: 'settings', label: 'Settings', to: '/admin/settings' },
  ]

  const sidebarClass = `${baseClass}-sidebar`
  const brandClass = `${baseClass}-sidebar-brand`
  const logoClass = `${baseClass}-sidebar-logo`
  const navClass = `${baseClass}-nav`
  const navItemClass = `${baseClass}-nav-item`

  return (
    <aside className={sidebarClass}>
      <div className={brandClass}>
        <img src={logo} className={logoClass} alt="PureDrop logo" />
      </div>
      <nav className={navClass}>
        {navItems.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className={`${navItemClass}${activeItem === item.key ? ' is-active' : ''}`}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        ))}
        {settingsDisabled && (
          <button type="button" className={navItemClass} disabled>
            Settings
          </button>
        )}
      </nav>
    </aside>
  )
}

export default AdminSidebar
