import ReportDetailsPanel from './ReportDetailsPanel.jsx'

function ReportDetailsModal({
  report,
  onClose,
  statusDraft,
  onStatusDraftChange,
  onApplyStatusChange,
  onOpenEditModal,
  onOpenDeleteModal,
  isStatusUpdating,
  isEditSubmitting,
  isDeleteSubmitting,
  statusUpdateError,
  statusUpdateSuccess,
  reportActionError,
  reportActionSuccess,
}) {
  if (!report) {
    return null
  }

  return (
    <div className="admin-reports-modal-layer" role="presentation">
      <button type="button" className="admin-reports-modal-backdrop" aria-label="Close report details modal" onClick={onClose} />
      <section
        className="admin-reports-modal admin-reports-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-reports-details-modal-title"
      >
        <div className="admin-reports-modal-head">
          <div>
            <h2 id="admin-reports-details-modal-title" className="admin-reports-modal-title">
              Report Details
            </h2>
            <p className="admin-reports-modal-subtitle mb-0">Review report REP-{report.reportId} from {report.reporterName}.</p>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <ReportDetailsPanel
          report={report}
          statusDraft={statusDraft}
          onStatusDraftChange={onStatusDraftChange}
          onApplyStatusChange={onApplyStatusChange}
          onOpenEditModal={onOpenEditModal}
          onOpenDeleteModal={onOpenDeleteModal}
          isStatusUpdating={isStatusUpdating}
          isEditSubmitting={isEditSubmitting}
          isDeleteSubmitting={isDeleteSubmitting}
          statusUpdateError={statusUpdateError}
          statusUpdateSuccess={statusUpdateSuccess}
          reportActionError={reportActionError}
          reportActionSuccess={reportActionSuccess}
          isEmbedded
        />
      </section>
    </div>
  )
}

export default ReportDetailsModal
