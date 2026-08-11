function ConfirmActionModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="admin-settings-modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="admin-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmActionTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirmActionTitle" className="admin-settings-modal-title">
          {title}
        </h2>
        <p className="admin-settings-modal-message">{message}</p>
        <div className="admin-settings-modal-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmActionModal