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
        <div className="admin-users-details-modal-head">
          <div>
            <h2 id="admin-users-details-modal-title" className="admin-users-details-modal-title">
              User Details
            </h2>
            <p className="admin-users-details-modal-subtitle mb-0">Review details for user {user.name}.</p>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <UserDetailsPanel user={user} />
      </section>
    </div>
  )
}

export default UserDetailsModal

