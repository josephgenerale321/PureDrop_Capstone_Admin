function ReportsSummary({ totalReports, summary }) {
  return (
    <div className="admin-reports-summary">
      <span className="admin-report-summary-pill">Total: {totalReports}</span>
      <span className="admin-report-summary-pill admin-report-summary-pill-pending">Pending: {summary.pending}</span>
      <span className="admin-report-summary-pill admin-report-summary-pill-resolved">Resolved: {summary.resolved}</span>
      {summary.other > 0 && <span className="admin-report-summary-pill admin-report-summary-pill-other">Other: {summary.other}</span>}
    </div>
  )
}

export default ReportsSummary
