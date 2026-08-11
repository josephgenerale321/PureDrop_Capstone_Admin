import { useMemo, useState } from 'react'
import UserPresenceBadge from './UserPresenceBadge.jsx'

const SORTABLE_COLUMNS = [
  { key: 'id', label: 'User ID', getValue: (user) => user.id },
  { key: 'name', label: 'Name', getValue: (user) => user.name },
  { key: 'email', label: 'Email Address', getValue: (user) => user.email },
  { key: 'role', label: 'Role', getValue: (user) => user.role },
  { key: 'status', label: 'Status', getValue: (user) => user.status },
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
}) {
  const [sortKey, setSortKey] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')

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
    <section className="admin-users-card">
      <div className="admin-users-card-head">
        <div>
          <h2 className="admin-users-card-title">User Management Section</h2>
          <p className="admin-users-card-subtitle">View organized data table of all user accounts.</p>
        </div>
        <div className="admin-users-card-tools">
          <input className="form-control" placeholder="Search" value={search} onChange={(event) => onSearchChange(event.target.value)} />
          <button type="button" className="btn btn-primary" onClick={onOpenCreateModal}>
            + Add New User
          </button>
        </div>
      </div>

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
            {!isLoading && !sortedUsers.length && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  {loadError || 'No users found.'}
                </td>
              </tr>
            )}

            {sortedUsers.map((user) => (
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

            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  Loading users...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default UsersManagementTable
