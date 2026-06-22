import { downloadReportCsv } from './reportsExport.js'

function ReportsQuickActionsCard({ reports }) {
  return (
    <section className="admin-reports-card">
      <h2 className="admin-reports-card-title mb-3">Quick Actions</h2>
      <div className="d-grid gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={() => downloadReportCsv(reports)}>
          Export Report Summary
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
