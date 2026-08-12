import { LogoutIcon } from './AdminIcons.jsx'

function LogoutConfirmModal({
  isOpen,
  isSigningOut,
  error,
  userEmail,
  onConfirm,
  onClose,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="admin-logout-overlay" role="presentation" onClick={onClose}>
      <div
        className="admin-logout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logoutConfirmTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-logout-icon-wrap">
          <LogoutIcon className="admin-logout-icon" />
        </div>

        <h2 id="logoutConfirmTitle" className="admin-logout-title">
          Sign Out of PureDrop Admin?
        </h2>

        {userEmail && <p className="admin-logout-email">{userEmail}</p>}

        <p className="admin-logout-message">
          You will need to sign in again to access the admin panel.
        </p>

        {error && <p className="admin-logout-error">{error}</p>}

        <div className="admin-logout-actions">
          <button
            type="button"
            className="admin-logout-cancel"
            onClick={onClose}
            disabled={isSigningOut}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-logout-confirm"
            onClick={onConfirm}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LogoutConfirmModal