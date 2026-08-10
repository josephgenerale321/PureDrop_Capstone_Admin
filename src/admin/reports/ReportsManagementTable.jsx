import { useMemo, useState } from 'react'
import { downloadReportCsv } from './reportsExport.js'

const SORTABLE_COLUMNS = [
  { key: 'reportId', label: 'Report ID', getValue: (report) => report.reportId },
  { key: 'issue', label: 'Issue', getValue: (report) => report.title || report.issue || '' },
  { key: 'status', label: 'Status', getValue: (report) => report.status },
  { key: 'category', label: 'Category', getValue: (report) => report.category },
  { key: 'dateSubmitted', label: 'Date Submitted', getValue: (report) => report.dateSubmitted },
  { key: 'reporterName', label: 'Reported By', getValue: (report) => report.reporterName },
]

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
  const [sortKey, setSortKey] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')

  const sortedReports = useMemo(() => {
    if (!sortKey) {
      return filteredReports
    }

    const column = SORTABLE_COLUMNS.find((item) => item.key === sortKey)
    if (!column) {
      return filteredReports
    }

    return [...filteredReports].sort((a, b) => {
      const aValue = column.getValue(a)
      const bValue = column.getValue(b)
      const comparison = String(aValue ?? '')
        .localeCompare(String(bValue ?? ''), undefined, { numeric: true, sensitivity: 'base' })
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredReports, sortKey, sortDirection])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const renderSortIcon = (key) => {
    if (sortKey !== key) {
      return (
        <span className="admin-sort-icon" aria-hidden="true">
          ⇅
        </span>
      )
    }

    return sortDirection === 'asc' ? (
      <span className="admin-sort-icon is-active" aria-hidden="true">
        ↑
      </span>
    ) : (
      <span className="admin-sort-icon is-active" aria-hidden="true">
        ↓
      </span>
    )
  }

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
          <button type="button" className="btn btn-success" onClick={() => downloadReportCsv(sortedReports)}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-sm align-middle admin-reports-table">
          <thead>
            <tr>
              {SORTABLE_COLUMNS.map((column) => (
                <th key={column.key}>
                  <button
                    type="button"
                    className={`admin-sort-header${sortKey === column.key ? ' is-active' : ''}`}
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label}
                    {renderSortIcon(column.key)}
                  </button>
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && !sortedReports.length && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  {loadError || 'No reports found.'}
                </td>
              </tr>
            )}
            {sortedReports.map((report) => (
              <tr key={report.key} className={selectedReportKey === report.key ? 'is-selected' : ''}>
                <td data-label="Report ID">REP-{report.reportId}</td>
                <td data-label="Issue" className="admin-reports-issue-cell">{report.title}</td>
                <td data-label="Status">
                  <span className={`badge-pill report-status-${report.statusClass}`}>{report.status}</span>
                </td>
                <td data-label="Category">{report.category}</td>
                <td data-label="Date Submitted">{report.dateSubmitted}</td>
                <td data-label="Reported By">{report.reporterName}</td>
                <td data-label="Actions">
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
