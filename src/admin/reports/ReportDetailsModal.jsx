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
        <div className="admin-report-mobile-modal-head">
          <h2 id="admin-reports-details-modal-title" className="admin-report-mobile-modal-title">
            Report Details
          </h2>
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
