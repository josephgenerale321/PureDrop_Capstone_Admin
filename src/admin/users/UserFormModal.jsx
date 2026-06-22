function UserFormModal({
  mode,
  userId,
  form,
  onChangeField,
  onClose,
  onSubmit,
  actionFeedback,
  isSubmitting,
}) {
  const isCreateMode = mode === 'create'
  const idPrefix = isCreateMode ? 'create-user' : 'edit-user'
  const title = isCreateMode ? 'Add New User' : 'Edit User'
  const subtitle = isCreateMode
    ? 'Create a regular user account with email and password.'
    : `Update account details for user ID: ${userId}`
  const modalTitleId = isCreateMode ? 'admin-users-add-modal-title' : 'admin-users-edit-modal-title'
  const backdropAriaLabel = isCreateMode ? 'Close add user modal' : 'Close edit user modal'
  const submitLabel = isCreateMode ? 'Create User' : 'Save Changes'
  const submittingLabel = isCreateMode ? 'Creating...' : 'Saving...'
  const isSubmitDisabled = isCreateMode ? Boolean(isSubmitting) : !userId || Boolean(isSubmitting)

  return (
    <div className="admin-users-edit-modal-layer" role="presentation">
      <button type="button" className="admin-users-edit-modal-backdrop" aria-label={backdropAriaLabel} onClick={onClose} />
      <section className="admin-users-edit-modal" role="dialog" aria-modal="true" aria-labelledby={modalTitleId}>
        <div className="admin-users-edit-modal-head">
          <div>
            <h2 id={modalTitleId} className="admin-users-edit-modal-title">
              {title}
            </h2>
            <p className="admin-users-edit-modal-subtitle mb-0">{subtitle}</p>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="admin-users-edit-form" onSubmit={onSubmit}>
          <label className="form-label mb-1" htmlFor={`${idPrefix}-full-name`}>
            Full Name
          </label>
          <input
            id={`${idPrefix}-full-name`}
            className="form-control"
            value={form.fullName}
            onChange={(event) => onChangeField('fullName', event.target.value)}
            required
          />

          <label className="form-label mb-1 mt-2" htmlFor={`${idPrefix}-email`}>
            Email
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            className="form-control"
            value={form.email}
            onChange={(event) => onChangeField('email', event.target.value)}
            required
          />

          {isCreateMode && (
            <>
              <label className="form-label mb-1 mt-2" htmlFor={`${idPrefix}-password`}>
                Password
              </label>
              <input
                id={`${idPrefix}-password`}
                type="password"
                className="form-control"
                value={form.password}
                onChange={(event) => onChangeField('password', event.target.value)}
                required
              />

              <label className="form-label mb-1 mt-2" htmlFor={`${idPrefix}-confirm-password`}>
                Confirm Password
              </label>
              <input
                id={`${idPrefix}-confirm-password`}
                type="password"
                className="form-control"
                value={form.confirmPassword}
                onChange={(event) => onChangeField('confirmPassword', event.target.value)}
                required
              />
            </>
          )}

          <label className="form-label mb-1 mt-2" htmlFor={`${idPrefix}-address`}>
            Address
          </label>
          <input
            id={`${idPrefix}-address`}
            className="form-control"
            value={form.address}
            onChange={(event) => onChangeField('address', event.target.value)}
            required
          />
          {isCreateMode && <small className="admin-users-field-note">If missing, this app automatically appends ", Toledo City".</small>}

          <label className="form-label mb-1 mt-2" htmlFor={`${idPrefix}-water-meter`}>
            Water Meter
          </label>
          <input
            id={`${idPrefix}-water-meter`}
            className="form-control"
            inputMode="numeric"
            value={form.waterMeter}
            onChange={(event) => onChangeField('waterMeter', event.target.value)}
            placeholder={isCreateMode ? 'Optional' : undefined}
          />

          {actionFeedback.message && (
            <p className={`admin-users-action-feedback mt-3 mb-0 ${actionFeedback.type === 'error' ? 'is-error' : 'is-success'}`}>
              {actionFeedback.message}
            </p>
          )}

          <div className="admin-users-edit-modal-actions">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitDisabled}>
              {isSubmitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default UserFormModal
