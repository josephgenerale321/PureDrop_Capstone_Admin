function ReportsSummary({ totalReports, summary }) {
  return (
    <div className="admin-reports-summary">
      <span className="admin-report-summary-pill">Total: {totalReports}</span>
      <span className="admin-report-summary-pill admin-report-summary-pill-pending">Pending: {summary.pending}</span>
      <span className="admin-report-summary-pill admin-report-summary-pill-resolving">Resolving: {summary.resolving}</span>
<span className="admin-report-summary-pill admin-report-summary-pill-approved">Approved: {summary.approved}</span>
      <span className="admin-report-summary-pill admin-report-summary-pill-rejected">Rejected: {summary.rejected}</span>
      {summary.other > 0 && <span className="admin-report-summary-pill admin-report-summary-pill-other">Other: {summary.other}</span>}
    </div>
  )
}

export default ReportsSummary
