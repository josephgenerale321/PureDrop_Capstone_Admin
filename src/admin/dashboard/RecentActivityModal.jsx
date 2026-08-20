import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ActivityItem from './ActivityItem.jsx'

const PAGE_SIZE = 10
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'submission', label: 'Submissions' },
  { key: 'status-update', label: 'Status Updates' },
]

const getGroupKey = (date) => {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - now.getDay())

  if (date >= startOfToday) return 'Today'
  if (date >= startOfYesterday) return 'Yesterday'
  if (date >= startOfWeek) return 'This Week'
  return 'Older'
}

const GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Older']

function RecentActivityModal({ isOpen, activities = [], onClose }) {
  const [filter, setFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const modalRef = useRef(null)
  const closeButtonRef = useRef(null)
  const lastFocusedRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    lastFocusedRef.current = document.activeElement
    closeButtonRef.current?.focus()
    return () => {
      lastFocusedRef.current?.focus?.()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const handleTabKey = (event) => {
      if (event.key !== 'Tab') return
      const modal = modalRef.current
      if (!modal) return
      const focusableElements = modal.querySelectorAll(focusableSelector)
      if (!focusableElements.length) return
      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities
    return activities.filter((activity) => activity.type === filter)
  }, [activities, filter])

  const filterCounts = useMemo(() => {
    return activities.reduce(
      (counts, activity) => {
        counts.all += 1
        if (activity.type === 'submission') {
          counts.submission += 1
        } else if (activity.type === 'status-update') {
          counts['status-update'] += 1
        }
        return counts
      },
      { all: 0, submission: 0, 'status-update': 0 },
    )
  }, [activities])

  const groupedActivities = useMemo(() => {
    const groups = new Map()
    for (const activity of filteredActivities) {
      const parsedDate = activity.timeIso ? new Date(activity.timeIso) : null
      const groupKey = parsedDate && !Number.isNaN(parsedDate.getTime()) ? getGroupKey(parsedDate) : 'Older'
      if (!groups.has(groupKey)) groups.set(groupKey, [])
      groups.get(groupKey).push(activity)
    }
    return GROUP_ORDER.filter((key) => groups.has(key)).map((key) => ({ key, items: groups.get(key) }))
  }, [filteredActivities])

  const visibleActivities = useMemo(() => {
    let count = 0
    const result = []
    for (const group of groupedActivities) {
      if (count >= visibleCount) break
      const slice = group.items.slice(0, visibleCount - count)
      result.push({ ...group, items: slice })
      count += slice.length
    }
    return result
  }, [groupedActivities, visibleCount])

  const totalCount = filteredActivities.length
  const hasMore = visibleCount < totalCount

  if (!isOpen) return null

  return (
    <div className="admin-activity-overlay" role="presentation" onClick={onClose}>
      <div
        ref={modalRef}
        className="admin-activity-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recentActivityModalTitle"
        aria-describedby="recentActivityModalDesc"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-activity-modal-head">
          <div>
            <h2 id="recentActivityModalTitle" className="admin-activity-modal-title">
              Recent Activity
            </h2>
            <p id="recentActivityModalDesc" className="admin-activity-modal-subtitle">
              {totalCount} total {totalCount === 1 ? 'activity' : 'activities'}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="admin-activity-modal-close"
            onClick={onClose}
            aria-label="Close recent activity"
          >
            ✕
          </button>
        </div>

        {!!activities.length && (
          <div className="admin-activity-modal-filters" role="group" aria-label="Filter activities">
            {FILTERS.map((item) => {
              const count = filterCounts[item.key]
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`admin-activity-filter-btn${filter === item.key ? ' is-active' : ''}`}
                  onClick={() => {
                    setFilter(item.key)
                    setVisibleCount(PAGE_SIZE)
                  }}
                  aria-pressed={filter === item.key}
                >
                  {item.label}
                  {count > 0 && (
                    <span className="admin-activity-filter-count">{' '}{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {!activities.length && (
          <div className="admin-activity-empty">
            <span className="admin-activity-empty-icon" aria-hidden="true">📭</span>
            <p className="admin-activity-empty-title">No activity yet</p>
            <p className="admin-activity-empty-text">Report submissions and status changes will appear here.</p>
            <Link to="/admin/reports" className="btn btn-outline-secondary">
              View Reports
            </Link>
          </div>
        )}

        {!!activities.length && !totalCount && (
          <div className="admin-activity-empty">
            <span className="admin-activity-empty-icon" aria-hidden="true">🔍</span>
            <p className="admin-activity-empty-title">No matching activity</p>
            <p className="admin-activity-empty-text">Try a different filter to see more activity.</p>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setFilter('all')}>
              Show All
            </button>
          </div>
        )}

        {!!totalCount && (
          <ul className="admin-activity-modal-list">
            {visibleActivities.map((group) => (
              <li key={group.key} className="admin-activity-group">
                <p className="admin-activity-group-title">{group.key}</p>
                <ul className="admin-activity-group-list">
                  {group.items.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}

        {hasMore && (
          <div className="admin-activity-load-more">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
            >
              Load More
            </button>
          </div>
        )}

        <div className="admin-activity-modal-footer">
          <Link to="/admin/reports" className="btn btn-sm btn-success" onClick={onClose}>
            View All Reports
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RecentActivityModal