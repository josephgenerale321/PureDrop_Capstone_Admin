function ReportsQuickActionsCard({ reports }) {
  const handleExport = async () => {
    if (!reports?.length) {
      return
    }
    try {
      const { downloadReportXlsx } = await import('./reportsExport.js')
      await downloadReportXlsx(reports)
    } catch {
      // Best-effort export; failures are surfaced in the main table's status message.
    }
  }

  return (
    <section className="admin-reports-card">
      <h2 className="admin-reports-card-title mb-3">Quick Actions</h2>
      <div className="d-grid gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={handleExport}>
          Export Report Summary (.xlsx)
        </button>
        <button type="button" className="btn btn-outline-secondary" disabled title="Requires backend workflow">
          Bulk Status Update
        </button>
        <button type="button" className="btn btn-outline-secondary" disabled title="Requires analytics pipeline">
          Generate System Health Report
        </button>
      </div>
    </section>
  )
}

export default ReportsQuickActionsCard
