import DefaultAvatarImage from '../DefaultAvatarImage.jsx'
import AdminReportGpsMap from './AdminReportGpsMap.jsx'

const STATUS_OPTIONS = ['Pending', 'Resolving', 'Approved', 'Rejected']

const STATUS_BADGE_CLASS = {
  pending: 'report-status-pending',
  resolving: 'report-status-resolving',
  approved: 'report-status-approved',
  rejected: 'report-status-rejected',
}

function ReportDetailsPanel({
  report,
  statusDraft,
  onStatusDraftChange,
  onApplyStatusChange,
  onOpenEditModal,
  onOpenDeleteModal,
  isStatusUpdating = false,
  isEditSubmitting = false,
  isDeleteSubmitting = false,
  statusUpdateError = '',
  statusUpdateSuccess = '',
  reportActionError = '',
  reportActionSuccess = '',
  isEmbedded = false,
}) {
  const isStatusUnchanged =
    String(statusDraft || '')
      .trim()
      .toLowerCase() ===
    String(report?.status || '')
      .trim()
      .toLowerCase()

  const PanelTag = isEmbedded ? 'div' : 'section'

  return (
    <PanelTag className={isEmbedded ? 'admin-report-details-panel' : 'admin-reports-card'}>
      {!isEmbedded && <h2 className="admin-reports-card-title mb-3">Report Details</h2>}
      {!report && <p className="text-muted mb-0">Select a report and click View Details.</p>}
      {report && (
        <div className="admin-report-details">
          <div className="admin-report-profile-head">
            <DefaultAvatarImage src={report.reporterAvatarUrl} alt={`${report.reporterName} avatar`} className="admin-report-profile-image" />
            <div className="admin-report-profile-info">
              <strong className="admin-report-profile-name">{report.reporterName}</strong>
              <p className="admin-report-details-meta mb-0">Report #{report.reportId}</p>
            </div>
            <span className={`badge-pill ${STATUS_BADGE_CLASS[String(report.status || '').toLowerCase()] || 'report-status-active'}`}>
              {report.status}
            </span>
          </div>

          <div className="admin-report-status-controls">
            <label htmlFor="admin-report-status-select" className="admin-report-status-label">
              Change Status
            </label>
            <div className="admin-report-status-row">
              <select
                id="admin-report-status-select"
                className="form-select form-select-sm"
                value={statusDraft}
                onChange={(event) => onStatusDraftChange(event.target.value)}
                disabled={isStatusUpdating}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={onApplyStatusChange}
                disabled={isStatusUpdating || isStatusUnchanged}
              >
                {isStatusUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
            {!!statusUpdateError && <p className="admin-report-status-feedback is-error">{statusUpdateError}</p>}
            {!statusUpdateError && !!statusUpdateSuccess && <p className="admin-report-status-feedback is-success">{statusUpdateSuccess}</p>}
          </div>

          <div className="admin-report-management-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={onOpenEditModal}
              disabled={isStatusUpdating || isEditSubmitting || isDeleteSubmitting}
            >
              {isEditSubmitting ? 'Saving...' : 'Edit Report'}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={onOpenDeleteModal}
              disabled={isStatusUpdating || isEditSubmitting || isDeleteSubmitting}
            >
              {isDeleteSubmitting ? 'Deleting...' : 'Delete Report'}
            </button>
          </div>
          {!!reportActionError && <p className="admin-report-management-feedback is-error">{reportActionError}</p>}
          {!reportActionError && !!reportActionSuccess && <p className="admin-report-management-feedback is-success">{reportActionSuccess}</p>}

          <dl className="admin-report-details-list">
            <div>
              <dt>Category</dt>
              <dd>{report.category}</dd>
            </div>
            <div>
              <dt>Issue</dt>
              <dd>{report.issue}</dd>
            </div>
            <div>
              <dt>Date Submitted</dt>
              <dd>{report.submittedAt}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{report.userId}</dd>
            </div>
            <div>
              <dt>Water Meter</dt>
              <dd>{report.waterMeter}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{report.address}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{report.location}</dd>
            </div>
            <div>
              <dt>Location Details</dt>
              <dd>{report.locationDetails}</dd>
            </div>
            <div>
              <dt>GPS</dt>
              <dd>{report.gpsLocation}</dd>
            </div>
            <div>
              <dt>Attachments</dt>
              <dd>
                {!report.attachments.length && <span className="text-muted">No attachments</span>}
                {!!report.attachments.length && (
                  <ul className="admin-report-attachments">
                    {report.attachments.map((url, index) => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noreferrer">
                          📎 Attachment {index + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          </dl>

          <div className="admin-report-map-section">
            <div className="admin-report-map-section-head">
              <h3 className="admin-report-map-section-title">GPS Location Map</h3>
              <span className="admin-report-map-section-coords">{report.gpsLocation}</span>
            </div>
            <AdminReportGpsMap gpsLocation={report.gpsLocation} />
          </div>
        </div>
      )}
    </PanelTag>
  )
}

export default ReportDetailsPanel
