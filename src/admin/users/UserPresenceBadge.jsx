import { normalizePresenceStatus } from './presenceStatus.js'

function UserPresenceBadge({ status }) {
  const normalizedStatus = normalizePresenceStatus(status)
  return <span className={`badge-pill status-${normalizedStatus.toLowerCase()}`}>{normalizedStatus}</span>
}

export default UserPresenceBadge
