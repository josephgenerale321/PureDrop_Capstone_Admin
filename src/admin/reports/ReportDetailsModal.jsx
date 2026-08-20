import ReportDetailsPanel from './ReportDetailsPanel.jsx'

function ReportDetailsModal({
  report,
  onClose,
  statusDraft,
  onStatusDraftChange,
  onApplyStatusChange,
  isStatusUpdating,
  statusUpdateError,
  statusUpdateSuccess,
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
          isStatusUpdating={isStatusUpdating}
          statusUpdateError={statusUpdateError}
          statusUpdateSuccess={statusUpdateSuccess}
          isEmbedded
        />
      </section>
    </div>
  )
}

export default ReportDetailsModal
