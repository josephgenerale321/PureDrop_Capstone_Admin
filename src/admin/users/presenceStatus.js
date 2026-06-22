const ACTIVE_PRESENCE_MAX_AGE_MS = 3 * 60 * 1000

const toDateValue = (value) => {
  if (!value) {
    return null
  }

  if (typeof value.toDate === 'function') {
    return value.toDate()
  }

  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

export const normalizePresenceStatus = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()

  if (normalized === 'active' || normalized === 'online') {
    return 'Active'
  }

  if (normalized === 'inactive' || normalized === 'offline') {
    return 'Inactive'
  }

  return 'Inactive'
}

export const resolvePresenceStatus = ({ status, presenceUpdatedAt, lastSeenAt, lastActiveAt, nowMs = Date.now() }) => {
  const normalizedStatus = normalizePresenceStatus(status)
  if (normalizedStatus !== 'Active') {
    return normalizedStatus
  }

  const latestPresenceDate =
    toDateValue(presenceUpdatedAt) || toDateValue(lastSeenAt) || toDateValue(lastActiveAt)

  if (!latestPresenceDate) {
    return 'Inactive'
  }

  return nowMs - latestPresenceDate.getTime() <= ACTIVE_PRESENCE_MAX_AGE_MS
    ? 'Active'
    : 'Inactive'
}
