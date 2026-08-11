function UserFormModal({
  mode,
  userId,
  userName = '',
  userEmail = '',
  form,
  onChangeField,
  onClose,
  onSubmit,
  actionFeedback,
  isSubmitting,
  fieldErrors = {},
  validatedFields = new Set(),
  onFieldBlur,
  onReset,
  isDirty = false,
  isConfirmCloseOpen = false,
  onConfirmDiscard,
  onCancelDiscard,
}) {
  const isCreateMode = mode === 'create'
  const idPrefix = isCreateMode ? 'create-user' : 'edit-user'
  const title = isCreateMode ? 'Add New User' : 'Edit User'
  const subtitle = isCreateMode
    ? 'Create a regular user account with email and password.'
    : userName && userEmail
      ? `Editing ${userName} (${userEmail})`
      : 'Update account details for this user.'
  const modalTitleId = isCreateMode ? 'admin-users-add-modal-title' : 'admin-users-edit-modal-title'
  const backdropAriaLabel = isCreateMode ? 'Close add user modal' : 'Close edit user modal'
  const submitLabel = isCreateMode ? 'Create User' : 'Save Changes'
  const submittingLabel = isCreateMode ? 'Creating...' : 'Saving...'
  const isSubmitDisabled = isCreateMode ? Boolean(isSubmitting) : !userId || Boolean(isSubmitting) || !isDirty

  const getFieldError = (field) => {
    if (!validatedFields.has(field)) {
      return ''
    }
    return fieldErrors[field] || ''
  }

  const getFieldClass = (field) => {
    const error = getFieldError(field)
    if (!error) {
      return 'form-control'
    }
    return 'form-control is-invalid'
  }

  const renderFieldError = (field) => {
    const error = getFieldError(field)
    if (!error) {
      return null
    }
    return (
      <div className="admin-users-field-error" id={`${idPrefix}-${field}-error`}>
        {error}
      </div>
    )
  }

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
            {!isCreateMode && isDirty && (
              <span className="admin-users-dirty-badge">Unsaved changes</span>
            )}
          </div>
          <div className="d-flex flex-column align-items-end gap-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <form className="admin-users-edit-form" onSubmit={onSubmit} noValidate>
          <div className="admin-users-field-wrapper">
            <label className="form-label mb-1" htmlFor={`${idPrefix}-full-name`}>
              Full Name
            </label>
            <input
              id={`${idPrefix}-full-name`}
              className={getFieldClass('fullName')}
              value={form.fullName}
              onChange={(event) => onChangeField('fullName', event.target.value)}
              onBlur={() => onFieldBlur && onFieldBlur('fullName')}
              placeholder="e.g. Juan Dela Cruz"
              maxLength={100}
              autoFocus={!isCreateMode}
              aria-describedby={getFieldError('fullName') ? `${idPrefix}-full-name-error` : undefined}
              required
            />
            {renderFieldError('fullName')}
          </div>

          <div className="admin-users-field-wrapper mt-2">
            <label className="form-label mb-1" htmlFor={`${idPrefix}-email`}>
              Email
            </label>
            <input
              id={`${idPrefix}-email`}
              type="email"
              className={getFieldClass('email')}
              value={form.email}
              onChange={(event) => onChangeField('email', event.target.value)}
              onBlur={() => onFieldBlur && onFieldBlur('email')}
              placeholder="e.g. juan@example.com"
              maxLength={150}
              aria-describedby={getFieldError('email') ? `${idPrefix}-email-error` : undefined}
              required
            />
            {renderFieldError('email')}
          </div>

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

          <div className="admin-users-field-wrapper mt-2">
            <label className="form-label mb-1" htmlFor={`${idPrefix}-address`}>
              Address
            </label>
            <input
              id={`${idPrefix}-address`}
              className={getFieldClass('address')}
              value={form.address}
              onChange={(event) => onChangeField('address', event.target.value)}
              onBlur={() => onFieldBlur && onFieldBlur('address')}
              placeholder="e.g. Purok 3, Barangay Poblacion"
              maxLength={200}
              aria-describedby={getFieldError('address') ? `${idPrefix}-address-error` : undefined}
              required
            />
            {renderFieldError('address')}
            {isCreateMode && <small className="admin-users-field-note">If missing, this app automatically appends ", Toledo City".</small>}
          </div>

          <div className="admin-users-field-wrapper mt-2">
            <label className="form-label mb-1" htmlFor={`${idPrefix}-water-meter`}>
              Water Meter
            </label>
            <input
              id={`${idPrefix}-water-meter`}
              className={getFieldClass('waterMeter')}
              inputMode="numeric"
              value={form.waterMeter}
              onChange={(event) => onChangeField('waterMeter', event.target.value)}
              onBlur={() => onFieldBlur && onFieldBlur('waterMeter')}
              placeholder={isCreateMode ? 'Optional' : 'e.g. 12345'}
              maxLength={20}
              aria-describedby={getFieldError('waterMeter') ? `${idPrefix}-water-meter-error` : undefined}
            />
            {renderFieldError('waterMeter')}
          </div>

          {actionFeedback.message && (
            <p className={`admin-users-action-feedback mt-3 mb-0 ${actionFeedback.type === 'error' ? 'is-error' : 'is-success'}`}>
              {actionFeedback.message}
            </p>
          )}

          <div className="admin-users-edit-modal-actions">
            {!isCreateMode && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onReset}
                disabled={!isDirty || isSubmitting}
              >
                Reset
              </button>
            )}
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitDisabled}>
              {isSubmitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </form>
      </section>

      {!isCreateMode && isConfirmCloseOpen && (
        <div className="admin-users-confirm-layer" role="presentation">
          <button type="button" className="admin-users-confirm-backdrop" aria-label="Close confirmation dialog" onClick={onCancelDiscard} />
          <section className="admin-users-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-users-confirm-title">
            <h3 id="admin-users-confirm-title" className="admin-users-confirm-title">
              Discard unsaved changes?
            </h3>
            <p className="admin-users-confirm-message mb-0">
              You have unsaved changes. If you close now, your edits will be lost.
            </p>
            <div className="admin-users-confirm-actions">
              <button type="button" className="btn btn-outline-secondary" onClick={onCancelDiscard}>
                Keep Editing
              </button>
              <button type="button" className="btn btn-danger" onClick={onConfirmDiscard}>
                Discard Changes
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default UserFormModal
