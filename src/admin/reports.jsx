import './reports.css'
import ReportDeleteModal from './reports/ReportDeleteModal.jsx'
import ReportDetailsModal from './reports/ReportDetailsModal.jsx'
import ReportEditModal from './reports/ReportEditModal.jsx'
import ReportsHeader from './reports/ReportsHeader.jsx'
import ReportsManagementTable from './reports/ReportsManagementTable.jsx'
import ReportsSummary from './reports/ReportsSummary.jsx'
import useReportsData from './reports/useReportsData.jsx'
import useReportsPageState from './reports/useReportsPageState.jsx'
import AdminSidebar from './sidebar.jsx'
import useAdminMobileNav from './useAdminMobileNav.js'

function AdminReports({ onLogout }) {
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useAdminMobileNav()
  const {
    reports,
    search,
    setSearch,
    filteredReports,
    isLoading,
    loadError,
    selectedReport,
    selectedReportKey,
    setSelectedReportKey,
    summary,
    refreshReports,
    updateReportStatus,
    editReport,
    deleteReport,
    updatingReportKey,
    savingReportKey,
    deletingReportKey,
  } = useReportsData()

  const {
    selectedStatusDraft,
    statusUpdateResult,
    isDetailsModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    editForm,
    reportActionResult,
    handleOpenDetailsModal,
    handleCloseDetailsModal,
    handleStatusDraftChange,
    handleApplyStatusChange,
    handleOpenEditModal,
    handleCloseEditModal,
    handleEditFieldChange,
    handleEditSubmit,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
  } = useReportsPageState({
    selectedReport,
    updateReportStatus,
    editReport,
    deleteReport,
  })

  const selectedReportStatusError =
    statusUpdateResult.key === selectedReport?.key && statusUpdateResult.type === 'error' ? statusUpdateResult.message : ''
  const selectedReportStatusSuccess =
    statusUpdateResult.key === selectedReport?.key && statusUpdateResult.type === 'success' ? statusUpdateResult.message : ''
  const selectedReportActionError =
    reportActionResult.key === selectedReport?.key && reportActionResult.type === 'error' ? reportActionResult.message : ''
  const selectedReportActionSuccess =
    reportActionResult.key === selectedReport?.key && reportActionResult.type === 'success' ? reportActionResult.message : ''

  const handleViewReportDetails = (reportKey) => {
    setSelectedReportKey(reportKey)
    handleOpenDetailsModal()
  }

  return (
    <main className="admin-reports-page">
      <div className={`admin-reports-shell${isMobileNavOpen ? ' is-nav-open' : ''}`}>
        <div id="admin-reports-sidebar" className="admin-reports-sidebar-wrap">
          <AdminSidebar activeItem="reports" onClose={closeMobileNav} />
        </div>

        <section className="admin-reports-content">
          <ReportsHeader isMobileNavOpen={isMobileNavOpen} onToggleMobileNav={toggleMobileNav} onLogout={onLogout} />
          <ReportsSummary totalReports={reports.length} summary={summary} />

          <div className="admin-reports-grid">
            <ReportsManagementTable
              search={search}
              onSearchChange={setSearch}
              onRefresh={refreshReports}
              filteredReports={filteredReports}
              isLoading={isLoading}
              loadError={loadError}
              selectedReportKey={selectedReportKey}
              onViewDetails={handleViewReportDetails}
            />
          </div>
        </section>
        <button
          type="button"
          className="admin-reports-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={closeMobileNav}
        />

        {isDetailsModalOpen && (
          <ReportDetailsModal
            report={selectedReport}
            onClose={handleCloseDetailsModal}
            statusDraft={selectedStatusDraft}
            onStatusDraftChange={handleStatusDraftChange}
            onApplyStatusChange={handleApplyStatusChange}
            onOpenEditModal={handleOpenEditModal}
            onOpenDeleteModal={handleOpenDeleteModal}
            isStatusUpdating={updatingReportKey === selectedReport?.key}
            isEditSubmitting={savingReportKey === selectedReport?.key}
            isDeleteSubmitting={deletingReportKey === selectedReport?.key}
            statusUpdateError={selectedReportStatusError}
            statusUpdateSuccess={selectedReportStatusSuccess}
            reportActionError={selectedReportActionError}
            reportActionSuccess={selectedReportActionSuccess}
          />
        )}

        {isEditModalOpen && (
          <ReportEditModal
            report={selectedReport}
            form={editForm}
            onChangeField={handleEditFieldChange}
            onClose={handleCloseEditModal}
            onSubmit={handleEditSubmit}
            actionFeedback={
              reportActionResult.key === selectedReport?.key
                ? { type: reportActionResult.type, message: reportActionResult.message }
                : { type: '', message: '' }
            }
            isSubmitting={savingReportKey === selectedReport?.key}
          />
        )}

        {isDeleteModalOpen && (
          <ReportDeleteModal
            report={selectedReport}
            onClose={handleCloseDeleteModal}
            onConfirmDelete={handleConfirmDelete}
            actionFeedback={
              reportActionResult.key === selectedReport?.key
                ? { type: reportActionResult.type, message: reportActionResult.message }
                : { type: '', message: '' }
            }
            isDeleting={deletingReportKey === selectedReport?.key}
          />
        )}
      </div>
    </main>
  )
}

export default AdminReports

