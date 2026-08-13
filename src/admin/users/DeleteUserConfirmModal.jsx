import { TrashIcon } from '../AdminIcons.jsx'

function DeleteUserConfirmModal({
  isOpen,
  userName = '',
  userEmail = '',
  isDeleting = false,
  error = '',
  onConfirm,
  onClose,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="admin-users-delete-overlay" role="presentation" onClick={onClose}>
      <div
        className="admin-users-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deleteUserConfirmTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-users-delete-icon-wrap">
          <TrashIcon className="admin-users-delete-icon" />
        </div>

        <h2 id="deleteUserConfirmTitle" className="admin-users-delete-title">
          Delete User Account?
        </h2>

        {userName && (
          <p className="admin-users-delete-name">{userName}</p>
        )}

        {userEmail && <p className="admin-users-delete-email">{userEmail}</p>}

        <p className="admin-users-delete-message">
          This will permanently remove the user's profile, report documents, and Firebase login. This action cannot be undone.
        </p>

        {error && <p className="admin-users-delete-error">{error}</p>}

        <div className="admin-users-delete-actions">
          <button
            type="button"
            className="admin-users-delete-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-users-delete-confirm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteUserConfirmModal