import { useEffect, useMemo, useState } from 'react'
import { downloadReportCsv } from './reportsExport.js'
import PaginationControls from '../pagination/PaginationControls.jsx'

const DEFAULT_PAGE_SIZE = 10

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
  onEditReport,
  onDeleteReport,
  savingReportKey = '',
  deletingReportKey = '',
}) {
  const [sortKey, setSortKey] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

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

  const totalPages = Math.max(1, Math.ceil(sortedReports.length / pageSize))
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedReports.slice(start, start + pageSize)
  }, [sortedReports, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, sortKey, sortDirection])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

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
            {paginatedReports.map((report) => (
              <tr key={report.key} className={selectedReportKey === report.key ? 'is-selected' : ''}>
                <td data-label="Report ID">REP-{report.reportId}</td>
                <td data-label="Issue" className="admin-reports-issue-cell">{report.title}</td>
                <td data-label="Status">
                  <span className={`badge-pill report-status-${report.statusClass}`}>{report.status}</span>
                </td>
                <td data-label="Category">{report.category}</td>
                <td data-label="Date Submitted">{report.dateSubmitted}</td>
                <td data-label="Reported By">{report.reporterName}</td>
                <td data-label="Actions" className="d-flex gap-2 flex-wrap">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onViewDetails(report.key)}>
                    View Details
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onEditReport(report.key)}
                    disabled={savingReportKey === report.key || deletingReportKey === report.key}
                  >
                    {savingReportKey === report.key ? 'Saving...' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => onDeleteReport(report.key)}
                    disabled={savingReportKey === report.key || deletingReportKey === report.key}
                  >
                    {deletingReportKey === report.key ? 'Deleting...' : 'Delete'}
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

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedReports.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </section>
  )
}

export default ReportsManagementTable
