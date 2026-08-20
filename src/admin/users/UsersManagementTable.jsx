import { useMemo, useState } from 'react'
import UserPresenceBadge from './UserPresenceBadge.jsx'
import PaginationControls from '../pagination/PaginationControls.jsx'
import AdminErrorState from '../AdminErrorState.jsx'
import AdminLoadingState from '../AdminLoadingState.jsx'

const DEFAULT_PAGE_SIZE = 10

const SORTABLE_COLUMNS = [
  { key: 'id', label: 'User ID', getValue: (user) => user.id },
  { key: 'name', label: 'Name', getValue: (user) => user.name },
  { key: 'email', label: 'Email Address', getValue: (user) => user.email },
  { key: 'role', label: 'Role', getValue: (user) => user.role },
  { key: 'status', label: 'Status', getValue: (user) => user.status },
  { key: 'emailVerified', label: 'Email Verified', getValue: (user) => (user.emailVerified ? 'Verified' : 'Unverified') },
  { key: 'dateJoined', label: 'Date Joined', getValue: (user) => user.dateJoined },
]

function UsersManagementTable({
  search,
  onSearchChange,
  onOpenCreateModal,
  filteredUsers,
  isLoading,
  loadError,
  selectedUserId,
  onViewDetails,
  onStartEdit,
  onDeleteUser,
  deletingUserId,
  onRetry,
}) {
  const [sortKey, setSortKey] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const sortedUsers = useMemo(() => {
    if (!sortKey) {
      return filteredUsers
    }

    const column = SORTABLE_COLUMNS.find((item) => item.key === sortKey)
    if (!column) {
      return filteredUsers
    }

    return [...filteredUsers].sort((a, b) => {
      const aValue = column.getValue(a)
      const bValue = column.getValue(b)
      const comparison = String(aValue ?? '')
        .localeCompare(String(bValue ?? ''), undefined, { numeric: true, sensitivity: 'base' })
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredUsers, sortKey, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedUsers = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return sortedUsers.slice(start, start + pageSize)
  }, [sortedUsers, safeCurrentPage, pageSize])

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
    <section className="admin-users-card">
      <div className="admin-users-card-head">
        <div>
          <h2 className="admin-users-card-title">User Management Section</h2>
          <p className="admin-users-card-subtitle">View organized data table of all user accounts.</p>
        </div>
        <div className="admin-users-card-tools">
          <input className="form-control" placeholder="Search" value={search} onChange={(event) => handleSearchChange(event.target.value)} />
          <button type="button" className="btn btn-primary" onClick={onOpenCreateModal}>
            + Add New User
          </button>
        </div>
      </div>

      {isLoading && <AdminLoadingState label="Loading users..." compact />}

      {!isLoading && loadError && (
        <AdminErrorState
          title="Unable to load users"
          message={loadError}
          onRetry={onRetry}
          tips={[
            'Check your network connection',
            'Verify your admin permissions',
            'Try again in a few moments',
          ]}
        />
      )}

      {!isLoading && !loadError && (
        <div className="table-responsive">
          <table className="table table-sm align-middle admin-users-table">
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
              {!sortedUsers.length && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    No users found.
                  </td>
                </tr>
              )}

              {paginatedUsers.map((user) => (
                <tr key={user.id} className={selectedUserId === user.id ? 'is-selected' : ''}>
                  <td data-label="User ID">{user.displayId || 'N/A'}</td>
                  <td data-label="Name">{user.name}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Role">
                    <span className={`badge-pill role-${user.roleClass}`}>{user.role}</span>
                  </td>
                  <td data-label="Status">
                    <UserPresenceBadge status={user.status} />
                  </td>
                  <td data-label="Email Verified">
                    <span className={`badge-pill ${user.emailVerified ? 'email-verified' : 'email-unverified'}`}>
                      {user.emailVerified ? '✓ Verified' : '✗ Unverified'}
                    </span>
                  </td>
                  <td data-label="Date Joined">{user.dateJoined}</td>
                  <td data-label="Actions" className="d-flex gap-2 flex-wrap">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onViewDetails(user.id)}>
                      View Details
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onStartEdit(user)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDeleteUser(user)}
                      disabled={deletingUserId === user.id}
                    >
                      {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
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
          totalItems={sortedUsers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </section>
  )
}

export default UsersManagementTable