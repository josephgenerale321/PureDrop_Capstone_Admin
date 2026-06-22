function ReportEditModal({ report, form, onChangeField, onClose, onSubmit, actionFeedback, isSubmitting }) {
  if (!report) {
    return null
  }

  return (
    <div className="admin-reports-modal-layer" role="presentation">
      <button type="button" className="admin-reports-modal-backdrop" aria-label="Close edit report modal" onClick={onClose} />
      <section className="admin-reports-modal" role="dialog" aria-modal="true" aria-labelledby="admin-reports-edit-modal-title">
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

        <form className="admin-reports-modal-form" onSubmit={onSubmit}>
          <label className="form-label mb-1" htmlFor="edit-report-issue">
            Issue
          </label>
          <textarea
            id="edit-report-issue"
            className="form-control"
            rows={3}
            value={form.issue}
            onChange={(event) => onChangeField('issue', event.target.value)}
            required
          />

          <label className="form-label mb-1 mt-2" htmlFor="edit-report-category">
            Category
          </label>
          <input
            id="edit-report-category"
            className="form-control"
            value={form.category}
            onChange={(event) => onChangeField('category', event.target.value)}
            required
          />

          <label className="form-label mb-1 mt-2" htmlFor="edit-report-address">
            Address
          </label>
          <input
            id="edit-report-address"
            className="form-control"
            value={form.address}
            onChange={(event) => onChangeField('address', event.target.value)}
          />

          <label className="form-label mb-1 mt-2" htmlFor="edit-report-location">
            Location
          </label>
          <input
            id="edit-report-location"
            className="form-control"
            value={form.location}
            onChange={(event) => onChangeField('location', event.target.value)}
          />

          <label className="form-label mb-1 mt-2" htmlFor="edit-report-location-details">
            Location Details
          </label>
          <input
            id="edit-report-location-details"
            className="form-control"
            value={form.locationDetails}
            onChange={(event) => onChangeField('locationDetails', event.target.value)}
          />

          <label className="form-label mb-1 mt-2" htmlFor="edit-report-gps">
            GPS Location
          </label>
          <input
            id="edit-report-gps"
            className="form-control"
            value={form.gpsLocation}
            onChange={(event) => onChangeField('gpsLocation', event.target.value)}
            placeholder="10.501502, 123.723919"
          />

          <label className="form-label mb-1 mt-2" htmlFor="edit-report-water-meter">
            Water Meter
          </label>
          <input
            id="edit-report-water-meter"
            className="form-control"
            value={form.waterMeter}
            onChange={(event) => onChangeField('waterMeter', event.target.value)}
          />

          {!!actionFeedback?.message && (
            <p className={`admin-reports-action-feedback mt-3 mb-0 ${actionFeedback.type === 'error' ? 'is-error' : 'is-success'}`}>
              {actionFeedback.message}
            </p>
          )}

          <div className="admin-reports-modal-actions">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default ReportEditModal
