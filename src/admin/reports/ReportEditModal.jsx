import { useState } from 'react'
import AdminReportGpsMap from './AdminReportGpsMap.jsx'
import AddressSelect from '../users/AddressSelect.jsx'

const CATEGORY_OPTIONS = ['No water', 'Dirty water', 'Water leaking']
const ISSUE_MAX_LENGTH = 500

const STATUS_BADGE_CLASS = {
  pending: 'report-status-pending',
  resolving: 'report-status-resolving',
  approved: 'report-status-approved',
  rejected: 'report-status-rejected',
}

function ReportEditModal({ report, form, onChangeField, onClose, onSubmit, actionFeedback, isSubmitting }) {
  const [selectedAddress, setSelectedAddress] = useState(form.address || '')

  if (!report) {
    return null
  }

  const handleAddressChange = (value) => {
    setSelectedAddress(value)
    onChangeField('address', value)
  }

  return (
    <div className="admin-reports-modal-layer" role="presentation">
      <button type="button" className="admin-reports-modal-backdrop" aria-label="Close edit report modal" onClick={onClose} />
      <section className="admin-reports-modal admin-reports-edit-modal" role="dialog" aria-modal="true" aria-labelledby="admin-reports-edit-modal-title">
        <div className="admin-reports-modal-head">
          <div>
            <h2 id="admin-reports-edit-modal-title" className="admin-reports-modal-title">
              Edit Report
            </h2>
            <p className="admin-reports-modal-subtitle mb-0">Update report REP-{report.reportId} details.</p>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Report Summary Banner */}
        <div className="admin-reports-edit-summary">
          <div className="admin-reports-edit-summary-info">
            <strong className="admin-reports-edit-summary-name">{report.reporterName}</strong>
            <p className="admin-reports-edit-summary-meta mb-0">Report #{report.reportId}</p>
          </div>
          <span className={`badge-pill ${STATUS_BADGE_CLASS[String(report.status || '').toLowerCase()] || 'report-status-active'}`}>
            {report.status}
          </span>
        </div>

        <form className="admin-reports-edit-form" onSubmit={onSubmit}>
          {/* Issue Details Card */}
          <div className="admin-reports-edit-card">
            <h3 className="admin-reports-edit-card-title">Issue Details</h3>

            <label className="admin-reports-edit-label" htmlFor="edit-report-issue">
              Describe the issue
            </label>
            <textarea
              id="edit-report-issue"
              className="admin-reports-edit-textarea"
              rows={4}
              value={form.issue}
              onChange={(event) => onChangeField('issue', event.target.value)}
              placeholder="Please provide details about the problem..."
              maxLength={ISSUE_MAX_LENGTH}
              required
            />
            <p className="admin-reports-edit-counter">
              {form.issue.length}/{ISSUE_MAX_LENGTH}
            </p>

            <label className="admin-reports-edit-label">Category</label>
            <div className="admin-reports-edit-category-row">
              {CATEGORY_OPTIONS.map((option) => {
                const isSelected = form.category === option
                return (
                  <button
                    key={option}
                    type="button"
                    className={`admin-reports-edit-category-pill${isSelected ? ' is-selected' : ''}`}
                    onClick={() => onChangeField('category', option)}
                  >
                    {option}
                  </button>
                )
              })}
            </div>

            <label className="admin-reports-edit-label" htmlFor="edit-report-water-meter">
              Water Meter (Optional)
            </label>
            <input
              id="edit-report-water-meter"
              className="admin-reports-edit-input"
              inputMode="numeric"
              value={form.waterMeter}
              onChange={(event) => onChangeField('waterMeter', event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              placeholder="Enter meter reading"
              maxLength={6}
            />
          </div>

          {/* Location Information Card */}
          <div className="admin-reports-edit-card">
            <h3 className="admin-reports-edit-card-title">Location Information</h3>

            <label className="admin-reports-edit-label" htmlFor="edit-report-address">
              Barangay / Address
            </label>
            <AddressSelect
              id="edit-report-address"
              value={selectedAddress}
              onChange={handleAddressChange}
              placeholder="Select barangay in Toledo City"
            />

            <label className="admin-reports-edit-label" htmlFor="edit-report-location">
              Landmark / Specific Location
            </label>
            <input
              id="edit-report-location"
              className="admin-reports-edit-input"
              value={form.location}
              onChange={(event) => onChangeField('location', event.target.value)}
              placeholder="e.g. In front of the chapel"
            />

            <label className="admin-reports-edit-label" htmlFor="edit-report-location-details">
              Location Details
            </label>
            <input
              id="edit-report-location-details"
              className="admin-reports-edit-input"
              value={form.locationDetails}
              onChange={(event) => onChangeField('locationDetails', event.target.value)}
              placeholder="Additional location details"
            />

            <label className="admin-reports-edit-label" htmlFor="edit-report-gps">
              GPS Location
            </label>
            <input
              id="edit-report-gps"
              className="admin-reports-edit-input"
              value={form.gpsLocation}
              onChange={(event) => onChangeField('gpsLocation', event.target.value)}
              placeholder="10.501502, 123.723919"
            />

            <div className="admin-reports-edit-map-section">
              <div className="admin-reports-edit-map-section-head">
                <h4 className="admin-reports-edit-map-section-title">GPS Location Map</h4>
                <span className="admin-report-map-section-coords">{form.gpsLocation}</span>
              </div>
              <AdminReportGpsMap gpsLocation={form.gpsLocation} />
            </div>
          </div>

          {/* Attachments Card */}
          {report.attachments.length > 0 && (
            <div className="admin-reports-edit-card">
              <h3 className="admin-reports-edit-card-title">Attachments</h3>
              <div className="admin-report-attachments-grid">
                {report.attachments.map((url, index) => (
                  <figure className="admin-report-attachment-thumb" key={url}>
                    <div className="admin-report-attachment-thumb-media">
                      <img src={url} alt={`Attachment ${index + 1}`} loading="lazy" />
                    </div>
                    <figcaption>Attachment {index + 1}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          {!!actionFeedback?.message && (
            <p className={`admin-reports-action-feedback ${actionFeedback.type === 'error' ? 'is-error' : 'is-success'}`}>
              {actionFeedback.message}
            </p>
          )}

          <div className="admin-reports-edit-actions">
            <button type="button" className="admin-reports-edit-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="admin-reports-edit-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default ReportEditModal