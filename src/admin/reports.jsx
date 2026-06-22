import './reports.css'
import ReportDeleteModal from './reports/ReportDeleteModal.jsx'
import ReportDetailsPanel from './reports/ReportDetailsPanel.jsx'
import ReportEditModal from './reports/ReportEditModal.jsx'
import ReportsHeader from './reports/ReportsHeader.jsx'
import ReportsManagementTable from './reports/ReportsManagementTable.jsx'
import ReportsQuickActionsCard from './reports/ReportsQuickActionsCard.jsx'
import ReportsRecentActivityCard from './reports/ReportsRecentActivityCard.jsx'
import ReportsSummary from './reports/ReportsSummary.jsx'
import useReportsData from './reports/useReportsData.jsx'
import useReportsPageState from './reports/useReportsPageState.jsx'
import AdminSidebar from './sidebar.jsx'

function AdminReports({ onLogout }) {
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
    recentActivity,
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
    isMobileNavOpen,
    setIsMobileNavOpen,
    selectedStatusDraft,
    statusUpdateResult,
    isEditModalOpen,
    isDeleteModalOpen,
    editForm,
    reportActionResult,
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

  return (
    <main className="admin-reports-page">
      <div className={`admin-reports-shell${isMobileNavOpen ? ' is-nav-open' : ''}`}>
        <div id="admin-reports-sidebar" className="admin-reports-sidebar-wrap">
          <AdminSidebar
            baseClass="admin-reports"
            activeItem="reports"
            onNavigate={() => {
              setIsMobileNavOpen(false)
            }}
          />
        </div>

        <section className="admin-reports-content">
          <ReportsHeader
            isMobileNavOpen={isMobileNavOpen}
            onToggleMobileNav={() => setIsMobileNavOpen((current) => !current)}
            onLogout={onLogout}
          />
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
              onViewDetails={setSelectedReportKey}
            />

            <aside className="admin-reports-side-panels">
              <ReportDetailsPanel
                report={selectedReport}
                statusDraft={selectedStatusDraft}
                onStatusDraftChange={handleStatusDraftChange}
                onApplyStatusChange={handleApplyStatusChange}
                onOpenEditModal={handleOpenEditModal}
                onOpenDeleteModal={handleOpenDeleteModal}
                isStatusUpdating={updatingReportKey === selectedReport?.key}
                isEditSubmitting={savingReportKey === selectedReport?.key}
                isDeleteSubmitting={deletingReportKey === selectedReport?.key}
                statusUpdateError={
                  statusUpdateResult.key === selectedReport?.key && statusUpdateResult.type === 'error'
                    ? statusUpdateResult.message
                    : ''
                }
                statusUpdateSuccess={
                  statusUpdateResult.key === selectedReport?.key && statusUpdateResult.type === 'success'
                    ? statusUpdateResult.message
                    : ''
                }
                reportActionError={
                  reportActionResult.key === selectedReport?.key && reportActionResult.type === 'error'
                    ? reportActionResult.message
                    : ''
                }
                reportActionSuccess={
                  reportActionResult.key === selectedReport?.key && reportActionResult.type === 'success'
                    ? reportActionResult.message
                    : ''
                }
              />
              <ReportsRecentActivityCard recentActivity={recentActivity} />
              <ReportsQuickActionsCard reports={reports} />
            </aside>
          </div>
        </section>
        <button
          type="button"
          className="admin-reports-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileNavOpen(false)}
        />

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

