function ReportsSummary({ totalReports, summary }) {
  return (
    <div className="admin-reports-summary">
      <span className="summary-pill">Total: {totalReports}</span>
      <span className="summary-pill summary-pill-pending">Pending: {summary.pending}</span>
      <span className="summary-pill summary-pill-resolved">Resolved: {summary.resolved}</span>
      {summary.other > 0 && <span className="summary-pill summary-pill-other">Other: {summary.other}</span>}
    </div>
  )
}

export default ReportsSummary
