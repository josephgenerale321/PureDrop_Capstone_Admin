// Static import so the Excel export is bundled into the main app.
// A lazy import() creates a separate chunk that must be fetched at click
// time, which fails on some free hosts (e.g. InfinityFree) when the chunk
// request returns HTML from the SPA fallback instead of JavaScript.
import { downloadReportXlsx } from './reportsExport.js'

function ReportsQuickActionsCard({ reports }) {
  const handleExport = async () => {
    if (!reports?.length) {
      return
    }
    try {
      await downloadReportXlsx(reports)
    } catch (error) {
      console.error('Excel export failed:', error)
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
