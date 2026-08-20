import './settings.css'
import './admin-states.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from './sidebar.jsx'
import useAdminMobileNav from './useAdminMobileNav.js'
import useLogout from './useLogout.js'
import LogoutConfirmModal from './LogoutConfirmModal.jsx'
import { ProfileIcon, LogoutIcon } from './AdminIcons.jsx'
import GeneralConfigurationCard from './settings/GeneralConfigurationCard.jsx'
import NotificationsCard from './settings/NotificationsCard.jsx'
import SecurityAccessCard from './settings/SecurityAccessCard.jsx'
import AttachmentCleanupCard from './settings/AttachmentCleanupCard.jsx'
import AdminLoadingState from './AdminLoadingState.jsx'
import AdminErrorState from './AdminErrorState.jsx'

import useAdminSettings from './settings/useAdminSettings.jsx'
import ConfirmActionModal from './settings/ConfirmActionModal.jsx'

function AdminSettings({ user, onLogout }) {
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useAdminMobileNav()
  const {
    isLogoutModalOpen,
    isSigningOut,
    logoutError,
    confirmLogout,
    closeLogoutModal,
    handleConfirmLogout,
  } = useLogout(onLogout)
  const [confirmAction, setConfirmAction] = useState(null)
  const {
    settings,
    isLoading,
    saveStatus,
    fieldErrors,
    retrySettings,
    setGeneralField,
    setSecurityField,
    toggleReportEmailType,
    setSystemHealthAlerts,
    setWeeklySummaryEmail,
  } = useAdminSettings(user)

  const runConfirmedAction = () => {
    if (!confirmAction) return
    confirmAction.action()
    setConfirmAction(null)
  }

  const handleRequestDelete = (unused, performDelete) => {
    if (!unused || unused.length === 0) {
      return
    }
    setConfirmAction({
      title: 'Delete Unused Attachments',
      message: `This will permanently delete ${unused.length} unused profile attachment file(s) from the regular_user bucket. This action cannot be undone. Continue?`,
      action: performDelete,
    })
  }

  return (
    <main className="admin-settings-page">
      <div className={`admin-settings-shell${isMobileNavOpen ? ' is-nav-open' : ''}`}>
        <div id="admin-settings-sidebar" className="admin-settings-sidebar-wrap">
          <AdminSidebar activeItem="settings" onClose={closeMobileNav} />
        </div>

        <section className="admin-settings-content">
          <header className="admin-settings-header">
            <div>
              <button
                type="button"
                className="btn btn-outline-secondary admin-settings-mobile-toggle"
                onClick={toggleMobileNav}
                aria-expanded={isMobileNavOpen}
                aria-controls="admin-settings-sidebar"
              >
                <span className="admin-settings-toggle-icon" aria-hidden="true">
                  {isMobileNavOpen ? '✕' : '☰'}
                </span>
                {isMobileNavOpen ? 'Close Menu' : 'Menu'}
              </button>
              <h1 className="admin-settings-title">Settings</h1>
              <p className="admin-settings-subtitle">Configure admin profile and PureDrop application preferences.</p>
            </div>
            <div className="admin-settings-top-actions">
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

          {saveStatus.message && (
            <p className={`admin-settings-inline-status ${saveStatus.type === 'error' ? 'is-error' : ''}`}>{saveStatus.message}</p>
          )}
          {isLoading && <AdminLoadingState label="Loading settings..." compact />}
          {!isLoading && saveStatus.type === 'error' && saveStatus.message.includes('Unable to load') && (
            <AdminErrorState
              title="Unable to load settings"
              message={saveStatus.message}
              onRetry={retrySettings}
              tips={[
                'Check your network connection',
                'Verify your admin permissions',
                'Try again in a few moments',
              ]}
            />
          )}

          {!isLoading && (
            <div className="admin-settings-grid">
              <div className="admin-settings-main">
                <GeneralConfigurationCard general={settings.general} fieldErrors={fieldErrors} onChange={setGeneralField} />
                <SecurityAccessCard security={settings.security} fieldErrors={fieldErrors} onChange={setSecurityField} />
                <NotificationsCard
                  notifications={settings.notifications}
                  fieldErrors={fieldErrors}
                  onToggleReportEmailType={toggleReportEmailType}
                  onSystemHealthAlertsChange={setSystemHealthAlerts}
                  onWeeklySummaryEmailChange={setWeeklySummaryEmail}
                />
                <AttachmentCleanupCard onRequestDelete={handleRequestDelete} />
              </div>

            </div>
          )}

          {confirmAction && (
            <ConfirmActionModal
              title={confirmAction.title}
              message={confirmAction.message}
              onConfirm={runConfirmedAction}
              onCancel={() => setConfirmAction(null)}
            />
          )}
        </section>
        <button
          type="button"
          className="admin-settings-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={closeMobileNav}
        />
      </div>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        isSigningOut={isSigningOut}
        error={logoutError}
        userEmail={user?.email || ''}
        onConfirm={handleConfirmLogout}
        onClose={closeLogoutModal}
      />
    </main>
  )
}

export default AdminSettings