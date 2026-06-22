function ReportDeleteModal({ report, onClose, onConfirmDelete, actionFeedback, isDeleting }) {
  if (!report) {
    return null
  }

  return (
    <div className="admin-reports-modal-layer" role="presentation">
      <button type="button" className="admin-reports-modal-backdrop" aria-label="Close delete report modal" onClick={onClose} />
      <section className="admin-reports-modal" role="dialog" aria-modal="true" aria-labelledby="admin-reports-delete-modal-title">
        <div className="admin-reports-modal-head">
          <div>
            <h2 id="admin-reports-delete-modal-title" className="admin-reports-modal-title">
              Delete Report
            </h2>
            <p className="admin-reports-modal-subtitle mb-0">This action cannot be undone.</p>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose} disabled={isDeleting}>
            Close
          </button>
        </div>

        <p className="mb-2">
          Delete report <strong>REP-{report.reportId}</strong> from <strong>{report.reporterName}</strong>?
        </p>
        <p className="text-muted mb-0">
          This will also delete {report.attachments.length} attachment{report.attachments.length === 1 ? '' : 's'} from Supabase storage.
        </p>

        {!!actionFeedback?.message && (
          <p className={`admin-reports-action-feedback mt-3 mb-0 ${actionFeedback.type === 'error' ? 'is-error' : 'is-success'}`}>
            {actionFeedback.message}
          </p>
        )}

        <div className="admin-reports-modal-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirmDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Report'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default ReportDeleteModal
