import './pagination.css'
import { IoChevronBack, IoChevronForward, IoPlaySkipBack, IoPlaySkipForward } from 'react-icons/io5'

const WINDOW_SIZE = 4
const PAGE_SIZE_OPTIONS = [10, 20, 50]

function getPageWindow(currentPage, totalPages) {
  const pages = []
  const start = Math.max(1, currentPage - WINDOW_SIZE)
  const end = Math.min(totalPages, currentPage + WINDOW_SIZE)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return { pages, start, end }
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalPages <= 1 && !onPageSizeChange) {
    return null
  }

  const { pages, start, end } = getPageWindow(currentPage, totalPages)
  const showStartEllipsis = start > 1
  const showEndEllipsis = end < totalPages

  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="admin-pagination-wrap">
      <div className="admin-pagination-info">
        {totalItems > 0 && (
          <span className="admin-pagination-summary">
            Showing {firstItem}–{lastItem} of {totalItems}
          </span>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="admin-pagination" aria-label="Table pagination">
          <button
            type="button"
            className="admin-pagination-btn admin-pagination-first"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            aria-label="First page"
          >
            <IoPlaySkipBack />
          </button>
          <button
            type="button"
            className="admin-pagination-btn admin-pagination-prev"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <IoChevronBack />
          </button>

          {showStartEllipsis && (
            <>
              <button
                type="button"
                className="admin-pagination-btn"
                onClick={() => onPageChange(1)}
                aria-label="Page 1"
              >
                1
              </button>
              <span className="admin-pagination-ellipsis" aria-hidden="true">…</span>
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              type="button"
              className={`admin-pagination-btn${page === currentPage ? ' is-active' : ''}`}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}

          {showEndEllipsis && (
            <>
              <span className="admin-pagination-ellipsis" aria-hidden="true">…</span>
              <button
                type="button"
                className="admin-pagination-btn"
                onClick={() => onPageChange(totalPages)}
                aria-label={`Page ${totalPages}`}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            className="admin-pagination-btn admin-pagination-next"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <IoChevronForward />
          </button>
          <button
            type="button"
            className="admin-pagination-btn admin-pagination-last"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            aria-label="Last page"
          >
            <IoPlaySkipForward />
          </button>
        </nav>
      )}

      {onPageSizeChange && (
        <label className="admin-pagination-size">
          <span>Rows per page</span>
          <select
            className="admin-pagination-select"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}

export default PaginationControls