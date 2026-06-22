import './settings.css'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from './sidebar.jsx'
import GeneralConfigurationCard from './settings/GeneralConfigurationCard.jsx'
import NotificationsCard from './settings/NotificationsCard.jsx'
import QuickActionsCard from './settings/QuickActionsCard.jsx'
import RecentActivityCard from './settings/RecentActivityCard.jsx'
import RolesPermissionsCard from './settings/RolesPermissionsCard.jsx'
import SecurityAccessCard from './settings/SecurityAccessCard.jsx'
import useAdminSettings from './settings/useAdminSettings.jsx'

function AdminSettings({ user, onLogout }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const {
    settings,
    recentActivity,
    isLoading,
    isSaving,
    saveStatus,
    setGeneralField,
    setSecurityField,
    toggleReportEmailType,
    setSystemHealthAlerts,
    setWeeklySummaryEmail,
    setRoleName,
    toggleRolePermission,
    addRole,
    saveSettings,
    restoreDefaults,
    exportSettings,
    bulkEnableViewPermission,
  } = useAdminSettings(user)

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
    <main className="admin-settings-page">
      <div className={`admin-settings-shell${isMobileNavOpen ? ' is-nav-open' : ''}`}>
        <div id="admin-settings-sidebar" className="admin-settings-sidebar-wrap">
          <AdminSidebar
            baseClass="admin-settings"
            activeItem="settings"
            onNavigate={() => {
              setIsMobileNavOpen(false)
            }}
          />
        </div>

        <section className="admin-settings-content">
          <header className="admin-settings-header">
            <div>
              <button
                type="button"
                className="btn btn-outline-secondary admin-settings-mobile-toggle"
                onClick={() => setIsMobileNavOpen((current) => !current)}
                aria-expanded={isMobileNavOpen}
                aria-controls="admin-settings-sidebar"
              >
                {isMobileNavOpen ? 'Close Menu' : 'Menu'}
              </button>
              <h1 className="admin-settings-title">Settings</h1>
              <p className="admin-settings-subtitle">Configure admin profile and PureDrop application preferences.</p>
            </div>
            <div className="admin-settings-top-actions">
              <Link to="/admin/profile" className="btn btn-outline-secondary">
                Admin Profile
              </Link>
              <button type="button" className="btn btn-outline-secondary" onClick={onLogout}>
                Logout
              </button>
            </div>
          </header>

          {saveStatus.message && (
            <p className={`admin-settings-inline-status ${saveStatus.type === 'error' ? 'is-error' : ''}`}>{saveStatus.message}</p>
          )}
          {isLoading && <p className="admin-settings-inline-status">Loading settings...</p>}

          <div className="admin-settings-grid">
            <div className="admin-settings-main">
              <GeneralConfigurationCard general={settings.general} onChange={setGeneralField} />
              <SecurityAccessCard security={settings.security} onChange={setSecurityField} />
              <NotificationsCard
                notifications={settings.notifications}
                onToggleReportEmailType={toggleReportEmailType}
                onSystemHealthAlertsChange={setSystemHealthAlerts}
                onWeeklySummaryEmailChange={setWeeklySummaryEmail}
              />
              <RolesPermissionsCard
                roles={settings.roles}
                onRoleNameChange={setRoleName}
                onTogglePermission={toggleRolePermission}
                onAddRole={addRole}
                onSave={saveSettings}
                isSaving={isSaving || isLoading}
              />
            </div>

            <aside className="admin-settings-side">
              <RecentActivityCard items={recentActivity} />
              <QuickActionsCard
                onExport={exportSettings}
                onBulkUpdatePermissions={bulkEnableViewPermission}
                onRestoreDefaults={restoreDefaults}
              />
            </aside>
          </div>
        </section>
        <button
          type="button"
          className="admin-settings-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileNavOpen(false)}
        />
      </div>
    </main>
  )
}

export default AdminSettings
