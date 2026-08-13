import { LockIcon } from './AdminIcons.jsx'

function ConfirmPasswordChangeModal({
  isOpen,
  isUpdating = false,
  error = '',
  onConfirm,
  onClose,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="admin-password-confirm-overlay" role="presentation" onClick={onClose}>
      <div
        className="admin-password-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passwordConfirmTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-password-confirm-icon-wrap">
          <LockIcon className="admin-password-confirm-icon" />
        </div>

        <h2 id="passwordConfirmTitle" className="admin-password-confirm-title">
          Change Password?
        </h2>

        <p className="admin-password-confirm-message">
          Are you sure you want to update your password? You will need to use the new password the next time you sign in.
        </p>

        {error && <p className="admin-password-confirm-error">{error}</p>}

        <div className="admin-password-confirm-actions">
          <button
            type="button"
            className="admin-password-confirm-cancel"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-password-confirm-yes"
            onClick={onConfirm}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Yes, Change Password'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmPasswordChangeModal