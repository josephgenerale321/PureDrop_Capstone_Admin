const DATE_TIME_FORMAT_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }

export const createInitialDashboard = () => ({
  totalUsers: 0,
  totalReports: 0,
  openReports: 0,
  resolvedReports: 0,
  reportsToday: 0,
  lastReportAtLabel: 'N/A',
  systemStatusLabel: 'Healthy',
  systemStatusClass: 'healthy',
  recentReports: [],
  recentActivity: [],
})

export const toDateValue = (value) => {
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

export const formatDateTime = (value) => {
  const parsed = toDateValue(value)
  if (!parsed) {
    return 'N/A'
  }
  return parsed.toLocaleString(undefined, DATE_TIME_FORMAT_OPTIONS)
}

export const formatTimeAgo = (value) => {
  const parsed = toDateValue(value)
  if (!parsed) {
    return 'Unknown time'
  }

  const diffMs = Date.now() - parsed.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes < 1) {
    return 'Just now'
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export const normalizeStatus = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()

  if (normalized === 'approved') return 'Approved'
  if (normalized === 'rejected') return 'Rejected'
  if (normalized === 'resolved') return 'Resolved'
  return 'Pending'
}

export const toStatusClass = (status) =>
  status
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')

export const getInitials = (nameOrEmail) => {
  const source = String(nameOrEmail || 'Admin').trim()
  if (!source) {
    return 'A'
  }

  const parts = source.split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase()
  }

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

export const isSameDate = (leftValue, rightValue) => {
  const left = toDateValue(leftValue)
  const right = toDateValue(rightValue)
  if (!left || !right) {
    return false
  }
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export const isAdminProfile = (data) => data?.role === 'admin' || data?.isAdmin === true
