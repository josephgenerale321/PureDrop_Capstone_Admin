import { downloadReportCsv } from './reportsExport.js'

function ReportsManagementTable({
  search,
  onSearchChange,
  onRefresh,
  filteredReports,
  isLoading,
  loadError,
  selectedReportKey,
  onViewDetails,
}) {
  return (
    <section className="admin-reports-card">
      <div className="admin-reports-card-head">
        <div>
          <h2 className="admin-reports-card-title">Report Management Section</h2>
          <p className="admin-reports-card-subtitle">View organized data table of all system reports.</p>
        </div>
        <div className="admin-reports-card-tools">
          <input className="form-control" placeholder="Search" value={search} onChange={(event) => onSearchChange(event.target.value)} />
          <button type="button" className="btn btn-outline-secondary" onClick={onRefresh}>
            Refresh
          </button>
          <button type="button" className="btn btn-success" onClick={() => downloadReportCsv(filteredReports)}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-sm align-middle admin-reports-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Issue</th>
              <th>Status</th>
              <th>Category</th>
              <th>Date Submitted</th>
              <th>Reported By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && !filteredReports.length && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  {loadError || 'No reports found.'}
                </td>
              </tr>
            )}
            {filteredReports.map((report) => (
              <tr key={report.key} className={selectedReportKey === report.key ? 'is-selected' : ''}>
                <td>REP-{report.reportId}</td>
                <td className="admin-reports-issue-cell">{report.title}</td>
                <td>
                  <span className={`badge-pill report-status-${report.statusClass}`}>{report.status}</span>
                </td>
                <td>{report.category}</td>
                <td>{report.dateSubmitted}</td>
                <td>{report.reporterName}</td>
                <td>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onViewDetails(report.key)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  Loading reports...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ReportsManagementTable
