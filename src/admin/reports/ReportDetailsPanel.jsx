import { useState } from 'react'
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
  const [lightboxUrl, setLightboxUrl] = useState('')
  const isStatusUnchanged =
    String(statusDraft || '')
      .trim()
      .toLowerCase() ===
    String(report?.status || '')
      .trim()
      .toLowerCase()

  const PanelTag = isEmbedded ? 'div' : 'section'

  const openLightbox = (url) => {
    if (url) {
      setLightboxUrl(url)
    }
  }

  const closeLightbox = () => {
    setLightboxUrl('')
  }

  return (
    <PanelTag className={isEmbedded ? 'admin-report-details-panel' : 'admin-reports-card'}>
      {!isEmbedded && <h2 className="admin-reports-card-title mb-3">Report Details</h2>}
      {!report && <p className="text-muted mb-0">Select a report and click View Details.</p>}
      {report && (
        <>
          <div className="admin-report-details admin-report-mobile-card">
            <h3 className="admin-report-mobile-heading">Problem Summary</h3>

            <div className="admin-report-mobile-status-panel">
              <div className="admin-report-mobile-status-controls">
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
            </div>

            <div className="admin-report-mobile-avatar">
              <DefaultAvatarImage src={report.reporterAvatarUrl} alt={`${report.reporterName} avatar`} className="admin-report-mobile-avatar-img" />
            </div>

            {!isEmbedded && (
              <div className="admin-report-mobile-status-wrap">
                <span className={`badge-pill ${STATUS_BADGE_CLASS[String(report.status || '').toLowerCase()] || 'report-status-active'}`}>
                  {report.status}
                </span>
              </div>
            )}

            <div className="admin-report-mobile-field">
              <dt className="admin-report-mobile-label">Category:</dt>
              <dd className="admin-report-mobile-value">{report.category}</dd>
            </div>

            <div className="admin-report-mobile-field">
              <dt className="admin-report-mobile-label">Name:</dt>
              <dd className="admin-report-mobile-value">{report.reporterName || 'N/A'}</dd>
            </div>

            <div className="admin-report-mobile-field">
              <dt className="admin-report-mobile-label">Location (Toledo City only):</dt>
              <dd className="admin-report-mobile-value">{report.location || 'N/A'}</dd>
            </div>

            <div className="admin-report-mobile-field">
              <dt className="admin-report-mobile-label">GPS Coordinates:</dt>
              <dd className="admin-report-mobile-value">{report.gpsLocation || 'N/A'}</dd>
            </div>

            <div className="admin-report-map-section">
              <div className="admin-report-map-section-head">
                <h3 className="admin-report-map-section-title">GPS Location Map</h3>
                <span className="admin-report-map-section-coords">{report.gpsLocation}</span>
              </div>
              <AdminReportGpsMap gpsLocation={report.gpsLocation} />
            </div>

            <div className="admin-report-mobile-field">
              <dt className="admin-report-mobile-label">Issue:</dt>
              <dd className="admin-report-mobile-value">{report.issue || 'N/A'}</dd>
            </div>

            <div className="admin-report-mobile-field">
              <dt className="admin-report-mobile-label">Water Meter:</dt>
              <dd className="admin-report-mobile-value">{report.waterMeter || 'N/A'}</dd>
            </div>

            <div className="admin-report-mobile-field">
              <dt className="admin-report-mobile-label">User ID:</dt>
              <dd className="admin-report-mobile-value">{report.userId}</dd>
            </div>

            <div className="admin-report-mobile-field">
              <dt className="admin-report-mobile-label">Date Submitted:</dt>
              <dd className="admin-report-mobile-value">{report.submittedAt}</dd>
            </div>

            <div className="admin-report-mobile-field">
              <dt className="admin-report-mobile-label">Attachments:</dt>
              <dd className="admin-report-mobile-value">
                {!report.attachments.length && <span className="text-muted">No attachments</span>}
                {!!report.attachments.length && (
                  <div className="admin-report-mobile-attachments">
                    {report.attachments.map((url, index) => (
                      <img
                        key={url}
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        loading="lazy"
                        className="admin-report-mobile-attachment-img"
                        onClick={() => openLightbox(url)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openLightbox(url)
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </dd>
            </div>

            <div className="admin-report-mobile-field">
              <dt className="admin-report-mobile-label">Status:</dt>
              <dd className="admin-report-mobile-value">{report.status}</dd>
            </div>

          </div>
        </>
      )}

      {lightboxUrl && (
        <div className="admin-report-lightbox-overlay" role="presentation" onClick={closeLightbox}>
          <div
            className="admin-report-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reportLightboxTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="admin-report-lightbox-close"
              onClick={closeLightbox}
              aria-label="Close preview"
            >
              ✕
            </button>
            <img src={lightboxUrl} alt="Report attachment preview" className="admin-report-lightbox-image" />
            <p id="reportLightboxTitle" className="admin-report-lightbox-path">
              {lightboxUrl}
            </p>
          </div>
        </div>
      )}
    </PanelTag>
  )
}

export default ReportDetailsPanel