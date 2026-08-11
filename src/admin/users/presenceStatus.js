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

  if (normalized === 'suspended') {
    return 'Suspended'
  }

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

  // BUG FIX (clock skew): `presenceUpdatedAt`/`lastSeenAt`/`lastActiveAt` are
  // written by Firebase `serverTimestamp()`, while `nowMs` defaults to the
  // admin's *device* clock. If the admin device is ahead of the server by more
  // than the active window, every online user would wrongly show "Inactive"
  // (and a device behind the server could wrongly show stale users as
  // "Active"). We guard against skew by:
  //   1. Always using the freshest of the three presence timestamps.
  //   2. Clamping negative deltas (server clock ahead of device) to 0 so a
  //      fresh server write is never dismissed as "expired".
  //   3. Wrapping every timestamp parse so a malformed value can never throw.
  const presenceDates = [
    toDateValue(presenceUpdatedAt),
    toDateValue(lastSeenAt),
    toDateValue(lastActiveAt),
  ]
    .filter(Boolean)

  if (presenceDates.length === 0) {
    return 'Inactive'
  }

  const latestPresenceMs = Math.max(...presenceDates.map((d) => d.getTime()))

  // Clamp to 0: a server timestamp slightly ahead of the admin device clock
  // (legitimate skew) must not be treated as an expired presence.
  const ageMs = Math.max(0, nowMs - latestPresenceMs)

  return ageMs <= ACTIVE_PRESENCE_MAX_AGE_MS ? 'Active' : 'Inactive'
}
