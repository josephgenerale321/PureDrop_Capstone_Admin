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

  if (!user) {
    return <p className="admin-mobile-profile-muted">Select a user and click View Details.</p>
  }

  return (
    <div className="admin-mobile-profile-card">
      <div className="admin-mobile-profile-avatar-wrap">
        <DefaultAvatarImage src={user.profileImageUrl} alt={`${user.name} profile`} className="admin-mobile-profile-avatar" />
      </div>

      <h2 className="admin-mobile-profile-name">{user.name}</h2>

      <div className="admin-mobile-profile-badges">
        <span className={`badge-pill ${ROLE_BADGE_CLASS[roleKey] || 'role-citizen'}`}>{user.role}</span>
        <UserPresenceBadge status={user.status} />
        <span className={`badge-pill ${user.emailVerified ? 'email-verified' : 'email-unverified'}`}>
          {user.emailVerified ? 'Email Verified' : 'Email Unverified'}
        </span>
      </div>

      <div className="admin-mobile-profile-field-group">
        <span className="admin-mobile-profile-field-label">USER ID (UID):</span>
        <span className="admin-mobile-profile-field-value">{user.displayId || user.uid || 'N/A'}</span>
        <div className="admin-mobile-profile-line" />
      </div>

      <div className="admin-mobile-profile-field-group">
        <span className="admin-mobile-profile-field-label">ADDRESS:</span>
        <span className="admin-mobile-profile-field-value">{user.address}</span>
        <div className="admin-mobile-profile-line" />
      </div>

      <div className="admin-mobile-profile-field-group">
        <span className="admin-mobile-profile-field-label">YOUR EMAIL:</span>
        <span className="admin-mobile-profile-field-value">{user.email}</span>
        <div className="admin-mobile-profile-line" />
      </div>

      <div className="admin-mobile-profile-field-group">
        <span className="admin-mobile-profile-field-label">WATER METER:</span>
        <span className="admin-mobile-profile-field-value">{user.waterMeter}</span>
        <div className="admin-mobile-profile-line" />
      </div>

      <div className="admin-mobile-profile-field-group">
        <span className="admin-mobile-profile-field-label">REPORT COUNT:</span>
        <span className="admin-mobile-profile-field-value">{user.reportCounter}</span>
        <div className="admin-mobile-profile-line" />
      </div>

      <div className="admin-mobile-profile-field-group">
        <span className="admin-mobile-profile-field-label">DATE JOINED:</span>
        <span className="admin-mobile-profile-field-value">{user.dateJoined}</span>
        <div className="admin-mobile-profile-line" />
      </div>

      <div className="admin-mobile-profile-field-group">
        <span className="admin-mobile-profile-field-label">LAST REPORT:</span>
        <span className="admin-mobile-profile-field-value">{user.lastReportAt}</span>
        <div className="admin-mobile-profile-line" />
      </div>

      <div className="admin-mobile-profile-field-group">
        <span className="admin-mobile-profile-field-label">LAST SEEN:</span>
        <span className="admin-mobile-profile-field-value">{user.lastSeenAt}</span>
        <div className="admin-mobile-profile-line" />
      </div>
    </div>
  )
}

export default UserDetailsPanel