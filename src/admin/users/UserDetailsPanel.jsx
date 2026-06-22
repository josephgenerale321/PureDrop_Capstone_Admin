import UserPresenceBadge from './UserPresenceBadge.jsx'

function UserDetailsPanel({ user }) {
  return (
    <section className="admin-users-card">
      <h2 className="admin-users-card-title mb-3">User Details</h2>
      {!user && <p className="text-muted mb-0">Select a user and click View Details.</p>}
      {user && (
        <div className="admin-user-details">
          <div className="admin-user-profile-head">
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={`${user.name} profile`} className="admin-user-profile-image" />
            ) : (
              <div className="admin-user-profile-fallback">{(user.name || 'U').slice(0, 1).toUpperCase()}</div>
            )}
            <div>
              <strong>{user.name}</strong>
              <p className="admin-user-details-email mb-0">{user.email}</p>
            </div>
          </div>

          <dl className="admin-user-details-list">
            <div>
              <dt>UID</dt>
              <dd>{user.uid}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{user.address}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <UserPresenceBadge status={user.status} />
              </dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user.role}</dd>
            </div>
            <div>
              <dt>Report Counter</dt>
              <dd>{user.reportCounter}</dd>
            </div>
            <div>
              <dt>Water Meter</dt>
              <dd>{user.waterMeter}</dd>
            </div>
            <div>
              <dt>Created At</dt>
              <dd>{user.createdAt}</dd>
            </div>
            <div>
              <dt>Updated At</dt>
              <dd>{user.updatedAt}</dd>
            </div>
            <div>
              <dt>Last Report At</dt>
              <dd>{user.lastReportAt}</dd>
            </div>
            <div>
              <dt>Notifications Seen</dt>
              <dd>{user.notificationsLastSeenAt}</dd>
            </div>
            <div>
              <dt>Presence Updated</dt>
              <dd>{user.presenceUpdatedAt}</dd>
            </div>
            <div>
              <dt>Last Seen</dt>
              <dd>{user.lastSeenAt}</dd>
            </div>
            <div>
              <dt>Last Active</dt>
              <dd>{user.lastActiveAt}</dd>
            </div>
            <div>
              <dt>Image Path</dt>
              <dd>{user.profileImagePath}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  )
}

export default UserDetailsPanel
