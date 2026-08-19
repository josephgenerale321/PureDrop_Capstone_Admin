import { DocumentIcon } from '../AdminIcons.jsx'
import { Link } from 'react-router-dom'

function ActivityItem({ activity, showTimeAgo = false }) {
  return (
    <li className={`dashboard-activity-item is-${activity.type}`}>
      <div className="dashboard-activity-head">
        <span className="dashboard-activity-type" aria-hidden="true">
          <DocumentIcon className="dashboard-activity-type-icon" />
        </span>
        <strong className="dashboard-activity-label">
          {activity.type === 'status-update' ? (
            <>
              Status updated: <span className="dashboard-activity-report-id">REP-{activity.reportId}</span> is now{' '}
              <span className={`badge-pill report-status-${activity.statusClass}`}>{activity.status}</span>
            </>
          ) : (
            <>
              Report submitted: <span className="dashboard-activity-report-id">REP-{activity.reportId}</span>
            </>
          )}
        </strong>
      </div>
      <span className="dashboard-activity-meta">{activity.meta}</span>
      <div className="dashboard-activity-footer">
        <time dateTime={activity.timeIso} title={activity.timeLabel}>
          {showTimeAgo ? activity.timeAgo : activity.timeLabel}
        </time>
        <Link to="/admin/reports" className="dashboard-activity-link">
          Manage
        </Link>
      </div>
    </li>
  )
}

export default ActivityItem