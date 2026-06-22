const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected', 'Resolved']

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
}) {
  const isStatusUnchanged =
    String(statusDraft || '')
      .trim()
      .toLowerCase() ===
    String(report?.status || '')
      .trim()
      .toLowerCase()

  return (
    <section className="admin-reports-card">
      <h2 className="admin-reports-card-title mb-3">Report Details</h2>
      {!report && <p className="text-muted mb-0">Select a report and click View Details.</p>}
      {report && (
        <div className="admin-report-details">
          <div className="admin-report-profile-head">
            {report.reporterAvatarUrl ? (
              <img src={report.reporterAvatarUrl} alt={`${report.reporterName} avatar`} className="admin-report-profile-image" />
            ) : (
              <div className="admin-report-profile-fallback">{(report.reporterName || 'R').slice(0, 1).toUpperCase()}</div>
            )}
            <div>
              <strong>{report.reporterName}</strong>
              <p className="admin-report-details-meta mb-0">Report #{report.reportId}</p>
            </div>
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
              <dt>Status</dt>
              <dd>{report.status}</dd>
            </div>
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
                          Attachment {index + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  )
}

export default ReportDetailsPanel
