import { useMemo, useState } from 'react'
import PaginationControls from '../pagination/PaginationControls.jsx'
import AdminErrorState from '../AdminErrorState.jsx'
import AdminLoadingState from '../AdminLoadingState.jsx'

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
  const [exportStatus, setExportStatus] = useState({ type: '', message: '' })

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
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedReports = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return sortedReports.slice(start, start + pageSize)
  }, [sortedReports, safeCurrentPage, pageSize])

  const handleSearchChange = (value) => {
    setCurrentPage(1)
    onSearchChange(value)
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handleSort = (key) => {
    setCurrentPage(1)
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const handleExportCsv = async () => {
    if (!sortedReports.length) {
      setExportStatus({ type: 'error', message: 'No reports to export.' })
      return
    }

    try {
      const { downloadReportXlsx } = await import('./reportsExport.js')
      const result = await downloadReportXlsx(sortedReports)
      if (result?.exported) {
        setExportStatus({ type: 'success', message: `Exported ${result.exported} report(s) to Excel.` })
      } else {
        setExportStatus({ type: 'error', message: 'Unable to export reports right now.' })
      }
    } catch {
      setExportStatus({ type: 'error', message: 'Unable to export reports right now.' })
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
          <input className="form-control" placeholder="Search" value={search} onChange={(event) => handleSearchChange(event.target.value)} />
          <button type="button" className="btn btn-outline-secondary" onClick={onRefresh}>
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={handleExportCsv}
            disabled={!sortedReports.length}
          >
            Export Excel
          </button>
        </div>
      </div>
      {exportStatus.message && (
        <p className={`admin-report-export-status mt-2 mb-0 ${exportStatus.type === 'error' ? 'is-error' : ''}`}>
          {exportStatus.message}
        </p>
      )}

      {isLoading && <AdminLoadingState label="Loading reports..." compact />}

      {!isLoading && loadError && (
        <AdminErrorState
          title="Unable to load reports"
          message={loadError}
          onRetry={onRefresh}
          tips={[
            'Check your network connection',
            'Verify your admin permissions',
            'Try again in a few moments',
          ]}
        />
      )}

      {!isLoading && !loadError && (
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
              {!sortedReports.length && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No reports found.
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
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !loadError && (
        <PaginationControls
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalItems={sortedReports.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </section>
  )
}

export default ReportsManagementTable