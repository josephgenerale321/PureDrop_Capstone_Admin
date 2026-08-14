import { TrashIcon } from '../AdminIcons.jsx'

function ReportDeleteModal({ report, onClose, onConfirmDelete, actionFeedback, isDeleting }) {
  if (!report) {
    return null
  }

  return (
    <div className="admin-report-delete-overlay" role="presentation" onClick={onClose}>
      <div
        className="admin-report-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-report-delete-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-report-delete-icon-wrap">
          <TrashIcon className="admin-report-delete-icon" />
        </div>

        <h2 id="admin-report-delete-title" className="admin-report-delete-title">
          Delete Report?
        </h2>

        <p className="admin-report-delete-message">
          Delete report <strong>REP-{report.reportId}</strong> from <strong>{report.reporterName}</strong>?
        </p>

        <p className="admin-report-delete-warning">
          This will also delete {report.attachments.length} attachment{report.attachments.length === 1 ? '' : 's'} from Supabase storage.
        </p>

        {!!actionFeedback?.message && (
          <p className={`admin-report-delete-feedback ${actionFeedback.type === 'error' ? 'is-error' : 'is-success'}`}>
            {actionFeedback.message}
          </p>
        )}

        <div className="admin-report-delete-actions">
          <button
            type="button"
            className="admin-report-delete-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-report-delete-confirm"
            onClick={onConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportDeleteModal
