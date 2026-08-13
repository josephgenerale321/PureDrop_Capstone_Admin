import { CheckIcon } from './AdminIcons.jsx'

function SuccessAlertModal({
  isOpen,
  title = 'Success',
  message = '',
  onClose,
  variant = 'success',
}) {
  if (!isOpen) {
    return null
  }

  const isError = variant === 'error'

  return (
    <div className={`admin-success-overlay${isError ? ' is-error' : ''}`} role="presentation" onClick={onClose}>
      <div
        className={`admin-success-modal${isError ? ' is-error' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="successAlertTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`admin-success-icon-wrap${isError ? ' is-error' : ''}`}>
          {isError ? (
            <span className="admin-success-icon-error" aria-hidden="true">
              !
            </span>
          ) : (
            <CheckIcon className="admin-success-icon" />
          )}
        </div>

        <h2 id="successAlertTitle" className="admin-success-title">
          {title}
        </h2>

        {message && <p className="admin-success-message">{message}</p>}

        <div className="admin-success-actions">
          <button
            type="button"
            className={`admin-success-confirm${isError ? ' is-error' : ''}`}
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuccessAlertModal