import './profile.css'
import DefaultAvatarImage from './DefaultAvatarImage.jsx'
import useAdminProfile from './profile/useAdminProfile.jsx'
import AdminSidebar from './sidebar.jsx'
import useAdminMobileNav from './useAdminMobileNav.js'
import useLogout from './useLogout.js'
import LogoutConfirmModal from './LogoutConfirmModal.jsx'
import SuccessAlertModal from './SuccessAlertModal.jsx'
import ConfirmPasswordChangeModal from './ConfirmPasswordChangeModal.jsx'
import { LogoutIcon } from './AdminIcons.jsx'

function AdminProfile({ user, onLogout }) {
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useAdminMobileNav()
  const {
    isLogoutModalOpen,
    isSigningOut,
    logoutError,
    confirmLogout,
    closeLogoutModal,
    handleConfirmLogout,
  } = useLogout(onLogout)
  const {
    fullName,
    setFullName,
    address,
    setAddress,
    role,
    profileStatus,
    passwordStatus,
    isSavingProfile,
    isUpdatingPassword,
    isLoadingProfile,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    fieldErrors,
    accountMeta,
    formatDate,
    isProfileDirty,
    passwordStrength,
    handleSaveProfile,
    handleChangePassword,
    successModal,
    errorModal,
    isPasswordConfirmOpen,
    passwordConfirmError,
    closePasswordConfirm,
    performPasswordChange,
    handleCloseSuccessModal,
    handleCloseErrorModal,
  } = useAdminProfile(user)

  return (
    <main className="admin-home-page admin-profile-page">
      <div className={`admin-shell${isMobileNavOpen ? ' is-nav-open' : ''}`}>
        <div id="admin-profile-sidebar" className="admin-sidebar-wrap">
          <AdminSidebar activeItem="profile" includeProfile onClose={closeMobileNav} />
        </div>

        <section className="admin-content">
          <header className="admin-content-header">
            <div>
              <button
                type="button"
                className="btn btn-outline-secondary admin-mobile-toggle"
                onClick={toggleMobileNav}
                aria-expanded={isMobileNavOpen}
                aria-controls="admin-profile-sidebar"
              >
                <span className="admin-toggle-icon" aria-hidden="true">
                  {isMobileNavOpen ? '✕' : '☰'}
                </span>
                {isMobileNavOpen ? 'Close Menu' : 'Menu'}
              </button>
              <h1 className="admin-page-title">Admin Profile</h1>
              <p className="admin-page-subtitle">Manage your personal account and security details.</p>
            </div>
            <button type="button" className="btn btn-outline-secondary admin-header-icon-btn admin-header-icon-btn-danger" onClick={confirmLogout} title="Logout">
              <LogoutIcon className="admin-header-icon" />
              <span>Logout</span>
            </button>
          </header>

          {isLoadingProfile ? (
            <div className="admin-profile-loading" role="status" aria-live="polite">
              <div className="admin-profile-loading-spinner" aria-hidden="true" />
              <p>Loading profile...</p>
            </div>
          ) : (
            <div className="admin-profile-layout">
              <section className="admin-card admin-profile-card">
                <div className="admin-profile-hero">
                  <div className="admin-profile-avatar-wrap">
                    <DefaultAvatarImage alt="Default admin profile" className="admin-profile-avatar" />
                  </div>

                  <form className="admin-profile-form" onSubmit={handleSaveProfile} noValidate>
                    <div className="admin-profile-name-row">
                      <div>
                        <h2 className="admin-profile-name">{fullName || user?.email || 'Administrator'}</h2>
                        <p className="admin-profile-role">{role}</p>
                      </div>
                      <button type="submit" className="btn admin-btn-primary" disabled={isSavingProfile || !isProfileDirty}>
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                    <div className="admin-profile-fields">
                      <div className="admin-profile-field">
                        <label htmlFor="fullName" className="admin-profile-label">
                          Full Name
                        </label>
                        <input
                          id="fullName"
                          className={`admin-profile-input${fieldErrors.fullName ? ' has-error' : ''}`}
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          aria-invalid={Boolean(fieldErrors.fullName)}
                          aria-describedby={fieldErrors.fullName ? 'fullNameError' : undefined}
                        />
                        {fieldErrors.fullName && (
                          <span id="fullNameError" className="admin-profile-field-error">
                            {fieldErrors.fullName}
                          </span>
                        )}
                        <span className="admin-profile-line" aria-hidden="true" />
                      </div>

                      <div className="admin-profile-field">
                        <label htmlFor="emailAddress" className="admin-profile-label">
                          Email Address
                        </label>
                        <input id="emailAddress" className="admin-profile-input" value={user?.email || ''} readOnly />
                        <span className="admin-profile-line" aria-hidden="true" />
                      </div>

                      <div className="admin-profile-field">
                        <label htmlFor="address" className="admin-profile-label">
                          Address
                        </label>
                        <input
                          id="address"
                          className={`admin-profile-input${fieldErrors.address ? ' has-error' : ''}`}
                          value={address}
                          onChange={(event) => setAddress(event.target.value)}
                          aria-invalid={Boolean(fieldErrors.address)}
                          aria-describedby={fieldErrors.address ? 'addressError' : undefined}
                        />
                        {fieldErrors.address && (
                          <span id="addressError" className="admin-profile-field-error">
                            {fieldErrors.address}
                          </span>
                        )}
                        <span className="admin-profile-line" aria-hidden="true" />
                      </div>

                      <div className="admin-profile-field">
                        <label htmlFor="role" className="admin-profile-label">
                          Current Role
                        </label>
                        <input id="role" className="admin-profile-input" value={role} readOnly />
                        <span className="admin-profile-line" aria-hidden="true" />
                      </div>
                    </div>

                    {profileStatus.message && (
                      <p className={`admin-inline-status is-${profileStatus.type}`} role="status" aria-live="polite">
                        {profileStatus.message}
                      </p>
                    )}
                  </form>
                </div>
              </section>

              <section className="admin-card admin-profile-card">
                <div className="admin-password-head">
                  <div>
                    <h2 className="admin-profile-section-title">Security & Login</h2>
                    <p className="admin-profile-section-subtitle">Change your account password</p>
                  </div>
                </div>

                <form className="admin-password-form" onSubmit={handleChangePassword} noValidate>
                  <div className="admin-password-grid">
                    <div className="admin-profile-field">
                      <label htmlFor="currentPassword" className="admin-profile-label">
                        Current Password
                      </label>
                      <div className="admin-password-input-wrap">
                        <input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          className="admin-profile-input"
                          value={currentPassword}
                          onChange={(event) => setCurrentPassword(event.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="admin-password-toggle"
                          onClick={() => setShowCurrentPassword((value) => !value)}
                          aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                        >
                          {showCurrentPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <span className="admin-profile-line" aria-hidden="true" />
                    </div>

                    <div className="admin-profile-field">
                      <label htmlFor="newPassword" className="admin-profile-label">
                        New Password
                      </label>
                      <div className="admin-password-input-wrap">
                        <input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          className="admin-profile-input"
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="admin-password-toggle"
                          onClick={() => setShowNewPassword((value) => !value)}
                          aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        >
                          {showNewPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="admin-password-strength" aria-live="polite">
                          <div className="admin-password-strength-bar">
                            <span
                              className="admin-password-strength-fill"
                              style={{
                                width: `${(passwordStrength.score / 4) * 100}%`,
                                backgroundColor: passwordStrength.color,
                              }}
                            />
                          </div>
                          <span className="admin-password-strength-label" style={{ color: passwordStrength.color }}>
                            {passwordStrength.label}
                          </span>
                        </div>
                      )}
                      <span className="admin-profile-line" aria-hidden="true" />
                    </div>

                    <div className="admin-profile-field">
                      <label htmlFor="confirmPassword" className="admin-profile-label">
                        Confirm New Password
                      </label>
                      <div className="admin-password-input-wrap">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="admin-profile-input"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="admin-password-toggle"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <span className="admin-profile-line" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="admin-password-actions">
                    <button type="submit" className="btn admin-btn-primary" disabled={isUpdatingPassword}>
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                  {passwordStatus.message && (
                    <p className={`admin-inline-status is-${passwordStatus.type}`} role="status" aria-live="polite">
                      {passwordStatus.message}
                    </p>
                  )}
                </form>
              </section>

              <section className="admin-card admin-profile-card">
                <div className="admin-password-head">
                  <div>
                    <h2 className="admin-profile-section-title">Account Details</h2>
                    <p className="admin-profile-section-subtitle">Your account information</p>
                  </div>
                </div>

                <div className="admin-account-meta-grid">
                  <div className="admin-account-meta-item">
                    <span className="admin-account-meta-label">Account Created</span>
                    <span className="admin-account-meta-value">{formatDate(accountMeta.createdAt)}</span>
                  </div>
                  <div className="admin-account-meta-item">
                    <span className="admin-account-meta-label">Last Sign In</span>
                    <span className="admin-account-meta-value">{formatDate(accountMeta.lastSignInAt)}</span>
                  </div>
                </div>
              </section>
            </div>
          )}
        </section>
        <button
          type="button"
          className="admin-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={closeMobileNav}
        />
      </div>

      <SuccessAlertModal
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
        onClose={handleCloseSuccessModal}
      />

      <SuccessAlertModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={handleCloseErrorModal}
        variant="error"
      />

      <ConfirmPasswordChangeModal
        isOpen={isPasswordConfirmOpen}
        isUpdating={isUpdatingPassword}
        error={passwordConfirmError}
        onConfirm={performPasswordChange}
        onClose={closePasswordConfirm}
      />

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

export default AdminProfile