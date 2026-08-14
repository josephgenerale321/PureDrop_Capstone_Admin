import UserDetailsPanel from './UserDetailsPanel.jsx'

function UserDetailsModal({ user, onClose }) {
  if (!user) {
    return null
  }

  return (
    <div className="admin-users-details-modal-layer" role="presentation">
      <button type="button" className="admin-users-details-modal-backdrop" aria-label="Close user details modal" onClick={onClose} />
      <section
        className="admin-users-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-users-details-modal-title"
      >
        <div className="admin-mobile-profile-header">
          <h2 id="admin-users-details-modal-title" className="admin-mobile-profile-header-title">
            Profile
          </h2>
        </div>

        <UserDetailsPanel user={user} />
      </section>
    </div>
  )
}

export default UserDetailsModal