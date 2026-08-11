import UserPresenceBadge from './UserPresenceBadge.jsx'
import DefaultAvatarImage from '../DefaultAvatarImage.jsx'

const ROLE_BADGE_CLASS = {
  admin: 'role-admin',
  moderator: 'role-moderator',
  citizen: 'role-citizen',
  'regular user': 'role-regular-user',
  user: 'role-user',
  'regular-user': 'role-regular-user',
}

function UserDetailsPanel({ user }) {
  const roleKey = String(user?.role || '').trim().toLowerCase()

  return (
    <section className="admin-users-card">
      <h2 className="admin-users-card-title mb-3">User Details</h2>
      {!user && <p className="text-muted mb-0">Select a user and click View Details.</p>}
      {user && (
        <div className="admin-user-details">
          <div className="admin-user-profile-head">
            <DefaultAvatarImage src={user.profileImageUrl} alt={`${user.name} profile`} className="admin-user-profile-image" />
            <div className="admin-user-profile-info">
              <strong className="admin-user-profile-name">{user.name}</strong>
              <p className="admin-user-details-email mb-0">{user.email}</p>
            </div>
            <div className="admin-user-profile-badges">
              <span className={`badge-pill ${ROLE_BADGE_CLASS[roleKey] || 'role-citizen'}`}>{user.role}</span>
              <UserPresenceBadge status={user.status} />
            </div>
          </div>

          <div className="admin-user-details-section">
            <h3 className="admin-user-details-section-title">Account Information</h3>
            <dl className="admin-user-details-list">
              <div>
                <dt>User ID</dt>
                <dd>{user.displayId || 'N/A'}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{user.address}</dd>
              </div>
              <div>
                <dt>Water Meter</dt>
                <dd>{user.waterMeter}</dd>
              </div>
              <div>
                <dt>Email Verified</dt>
                <dd>
                  <span className={`badge-pill ${user.emailVerified ? 'email-verified' : 'email-unverified'}`}>
                    {user.emailVerified ? '✓ Verified' : '✗ Unverified'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Report Counter</dt>
                <dd>{user.reportCounter}</dd>
              </div>
              <div>
                <dt>Created At</dt>
                <dd>{user.createdAt}</dd>
              </div>
              <div>
                <dt>Updated At</dt>
                <dd>{user.updatedAt}</dd>
              </div>
            </dl>
          </div>

          <div className="admin-user-details-section">
            <h3 className="admin-user-details-section-title">Activity</h3>
            <dl className="admin-user-details-list">
              <div>
                <dt>Last Report At</dt>
                <dd>{user.lastReportAt}</dd>
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
                <dt>Presence Updated</dt>
                <dd>{user.presenceUpdatedAt}</dd>
              </div>
              <div>
                <dt>Notifications Seen</dt>
                <dd>{user.notificationsLastSeenAt}</dd>
              </div>
              <div>
                <dt>Image Path</dt>
                <dd>{user.profileImagePath}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </section>
  )
}

export default UserDetailsPanel
