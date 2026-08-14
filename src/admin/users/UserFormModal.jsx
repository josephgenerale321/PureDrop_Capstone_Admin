import AddressSelect from './AddressSelect.jsx'

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
  onSendPasswordReset,
  onSendVerificationEmail,
  emailVerified = false,
  newPassword = '',
  confirmNewPassword = '',
  isUpdatingPassword = false,
  onChangeNewPassword,
  onChangeConfirmNewPassword,
  verificationCode = '',
  onChangeVerificationCode,
  isVerificationCodeSent = false,
  isVerifyingEmail = false,
  isEmailVerified = false,
  onSendVerificationCode,
  onVerifyEmailCode,
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
      return 'admin-users-edit-input'
    }
    return 'admin-users-edit-input is-invalid'
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
        {/* Header with centered title and close button */}
        <div className="admin-users-edit-modal-header">
          <h2 id={modalTitleId} className="admin-users-edit-modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="admin-users-edit-modal-close"
            onClick={onClose}
            aria-label={backdropAriaLabel}
          >
            x
          </button>
        </div>

        {!isCreateMode && isDirty && (
          <span className="admin-users-dirty-badge">Unsaved changes</span>
        )}

        <form className="admin-users-edit-form" onSubmit={onSubmit} noValidate>
          <div className="admin-users-edit-field">
            <label className="admin-users-edit-label" htmlFor={`${idPrefix}-full-name`}>
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

          <div className="admin-users-edit-field">
            <label className="admin-users-edit-label" htmlFor={`${idPrefix}-email`}>
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

            {!isCreateMode && (
              <div className="admin-users-email-verified-row">
                <span className={`badge-pill admin-users-email-${emailVerified ? 'verified' : 'unverified'}`}>
                  {emailVerified ? '✓ Email Verified' : '✗ Email Unverified'}
                </span>
                {!emailVerified && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={onSendVerificationEmail}
                    disabled={isSubmitting}
                  >
                    Send Verification
                  </button>
                )}
              </div>
            )}
          </div>

          {isCreateMode && (
            <>
              <div className="admin-users-edit-field">
                <label className="admin-users-edit-label" htmlFor={`${idPrefix}-password`}>
                  Password
                </label>
                <input
                  id={`${idPrefix}-password`}
                  type="password"
                  className="admin-users-edit-input"
                  value={form.password}
                  onChange={(event) => onChangeField('password', event.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              <div className="admin-users-edit-field">
                <label className="admin-users-edit-label" htmlFor={`${idPrefix}-confirm-password`}>
                  Confirm Password
                </label>
                <input
                  id={`${idPrefix}-confirm-password`}
                  type="password"
                  className="admin-users-edit-input"
                  value={form.confirmPassword}
                  onChange={(event) => onChangeField('confirmPassword', event.target.value)}
                  placeholder="Confirm password"
                  required
                />
              </div>

              <div className="admin-users-edit-password-section">
                <h3 className="admin-users-edit-section-title">Email Verification</h3>
                <p className="admin-users-edit-section-note">
                  Send a 6-digit verification code to the user's email and verify it to mark the email as verified.
                </p>

                {!isEmailVerified ? (
                  <>
                    <div className="admin-users-edit-action-row">
                      <button
                        type="button"
                        className="admin-users-edit-action-btn"
                        onClick={onSendVerificationCode}
                        disabled={isSubmitting || !form.email}
                      >
                        Send Verification Code
                      </button>
                    </div>

                    {isVerificationCodeSent && (
                      <>
                        <div className="admin-users-edit-field">
                          <label className="admin-users-edit-label" htmlFor={`${idPrefix}-verification-code`}>
                            6-Digit Code
                          </label>
                          <input
                            id={`${idPrefix}-verification-code`}
                            type="text"
                            inputMode="numeric"
                            className="admin-users-edit-input"
                            value={verificationCode}
                            onChange={(event) => onChangeVerificationCode && onChangeVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                          />
                        </div>
                        <div className="admin-users-edit-action-row">
                          <button
                            type="button"
                            className="admin-users-edit-action-btn"
                            onClick={onVerifyEmailCode}
                            disabled={isSubmitting || isVerifyingEmail || verificationCode.length !== 6}
                          >
                            {isVerifyingEmail ? 'Verifying...' : 'Verify Email'}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="admin-users-email-verified-row">
                    <span className="admin-users-email-verified">✓ Email Verified</span>
                  </div>
                )}
              </div>
            </>
          )}

          {!isCreateMode && (
            <div className="admin-users-edit-field">
              <label className="admin-users-edit-label" htmlFor={`${idPrefix}-status`}>
                Status
              </label>
              <select
                id={`${idPrefix}-status`}
                className="admin-users-edit-input"
                value={form.status}
                onChange={(event) => onChangeField('status', event.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          )}

          <div className="admin-users-edit-field">
            <label className="admin-users-edit-label" htmlFor={`${idPrefix}-address`}>
              Address
            </label>
            <AddressSelect
              id={`${idPrefix}-address`}
              value={form.address}
              onChange={(value) => onChangeField('address', value)}
              onBlur={() => onFieldBlur && onFieldBlur('address')}
              hasError={Boolean(getFieldError('address'))}
              placeholder={isCreateMode ? 'Select barangay (optional)' : 'Select barangay (Toledo City only)'}
            />
            {renderFieldError('address')}
            {isCreateMode && <small className="admin-users-field-note">If missing, this app automatically appends ", Toledo City".</small>}
          </div>

          <div className="admin-users-edit-field">
            <label className="admin-users-edit-label" htmlFor={`${idPrefix}-water-meter`}>
              Water Meter
            </label>
            <input
              id={`${idPrefix}-water-meter`}
              className={getFieldClass('waterMeter')}
              inputMode="numeric"
              value={form.waterMeter}
              onChange={(event) => onChangeField('waterMeter', event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              onBlur={() => onFieldBlur && onFieldBlur('waterMeter')}
              placeholder={isCreateMode ? 'Optional' : 'e.g. 12345'}
              maxLength={6}
              aria-describedby={getFieldError('waterMeter') ? `${idPrefix}-water-meter-error` : undefined}
            />
            {renderFieldError('waterMeter')}
          </div>

          {!isCreateMode && (
            <div className="admin-users-edit-password-section">
              <h3 className="admin-users-edit-section-title">Change Password</h3>
              <p className="admin-users-edit-section-note">
                Set a new password for this user directly. No email verification needed.
              </p>
              <div className="admin-users-edit-field">
                <label className="admin-users-edit-label" htmlFor={`${idPrefix}-new-password`}>
                  New Password
                </label>
                <input
                  id={`${idPrefix}-new-password`}
                  type="password"
                  className="admin-users-edit-input"
                  value={newPassword}
                  onChange={(event) => onChangeNewPassword && onChangeNewPassword(event.target.value)}
                  placeholder="Enter new password"
                  minLength={6}
                />
              </div>
              <div className="admin-users-edit-field">
                <label className="admin-users-edit-label" htmlFor={`${idPrefix}-confirm-new-password`}>
                  Confirm New Password
                </label>
                <input
                  id={`${idPrefix}-confirm-new-password`}
                  type="password"
                  className="admin-users-edit-input"
                  value={confirmNewPassword}
                  onChange={(event) => onChangeConfirmNewPassword && onChangeConfirmNewPassword(event.target.value)}
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>
              <div className="admin-users-edit-action-row">
                <button
                  type="button"
                  className="admin-users-edit-action-btn"
                  onClick={onSendPasswordReset}
                  disabled={isSubmitting || isUpdatingPassword || !userEmail}
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          {actionFeedback.message && (
            <p className={`admin-users-action-feedback ${actionFeedback.type === 'error' ? 'is-error' : 'is-success'}`}>
              {actionFeedback.message}
            </p>
          )}

          <div className="admin-users-edit-actions">
            {!isCreateMode && (
              <button
                type="button"
                className="admin-users-edit-cancel"
                onClick={onReset}
                disabled={!isDirty || isSubmitting}
              >
                Reset
              </button>
            )}
            <button type="button" className="admin-users-edit-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-users-edit-submit" disabled={isSubmitDisabled}>
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