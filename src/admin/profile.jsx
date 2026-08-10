import './profile.css'
import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase.js'
import DefaultAvatarImage from './DefaultAvatarImage.jsx'
import useAdminProfile from './profile/useAdminProfile.jsx'
import AdminSidebar from './sidebar.jsx'

function AdminProfile({ user, onLogout }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
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
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    handleSaveProfile,
    handleChangePassword,
  } = useAdminProfile(user)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsMobileNavOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined' || !isMobileNavOpen) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileNavOpen])

  const handleLogout = async () => {
    await signOut(auth)
    onLogout?.()
  }

  return (
    <main className="admin-home-page">
      <div className={`admin-shell${isMobileNavOpen ? ' is-nav-open' : ''}`}>
        <div id="admin-profile-sidebar" className="admin-sidebar-wrap">
          <AdminSidebar
            baseClass="admin"
            activeItem="profile"
            includeProfile
            onNavigate={() => setIsMobileNavOpen(false)}
          />
        </div>

        <section className="admin-content">
          <header className="admin-content-header">
            <div>
              <button
                type="button"
                className="btn btn-outline-secondary admin-mobile-toggle"
                onClick={() => setIsMobileNavOpen((current) => !current)}
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
            <button type="button" className="btn btn-outline-secondary" onClick={handleLogout}>
              Logout
            </button>
          </header>

          <section className="admin-card">
            <h2 className="admin-card-title">Profile Overview</h2>
            <div className="admin-profile-grid">
              <div className="admin-avatar-wrap">
                <DefaultAvatarImage alt="Default admin profile" className="admin-avatar" />
              </div>

              <form className="admin-profile-form" onSubmit={handleSaveProfile}>
                <div className="admin-form-grid">
                  <div>
                    <label htmlFor="fullName" className="form-label">
                      Full Name
                    </label>
                    <input id="fullName" className="form-control" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="emailAddress" className="form-label">
                      Email Address
                    </label>
                    <input id="emailAddress" className="form-control" value={user?.email || ''} readOnly />
                  </div>
                  <div>
                    <label htmlFor="address" className="form-label">
                      Address
                    </label>
                    <input id="address" className="form-control" value={address} onChange={(event) => setAddress(event.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="role" className="form-label">
                      Current Role
                    </label>
                    <input id="role" className="form-control" value={role} readOnly />
                  </div>
                </div>

                <div className="admin-actions-row">
                  <button type="submit" className="btn btn-success" disabled={isSavingProfile}>
                    {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
                {profileStatus && <p className="admin-inline-status">{profileStatus}</p>}
              </form>
            </div>
          </section>

          <section className="admin-card">
            <h2 className="admin-card-title">Security &amp; Login</h2>
            <h3 className="admin-card-subtitle">Change Password</h3>

            <form className="admin-password-form" onSubmit={handleChangePassword}>
              <div className="admin-form-grid">
                <div>
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    className="form-control"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="admin-form-span-2">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="admin-actions-row">
                <button type="submit" className="btn btn-success" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
              {passwordStatus && <p className="admin-inline-status">{passwordStatus}</p>}
            </form>
          </section>
        </section>
        <button
          type="button"
          className="admin-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileNavOpen(false)}
        />
      </div>
    </main>
  )
}

export default AdminProfile

