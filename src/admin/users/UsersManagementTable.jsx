import UserPresenceBadge from './UserPresenceBadge.jsx'

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
              <th>User ID</th>
              <th>Name</th>
              <th>Email Address</th>
              <th>Role</th>
              <th>Status</th>
              <th>Date Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && !filteredUsers.length && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  {loadError || 'No users found.'}
                </td>
              </tr>
            )}

            {filteredUsers.map((user) => (
              <tr key={user.id} className={selectedUserId === user.id ? 'is-selected' : ''}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge-pill role-${user.roleClass}`}>{user.role}</span>
                </td>
                <td>
                  <UserPresenceBadge status={user.status} />
                </td>
                <td>{user.dateJoined}</td>
                <td className="d-flex gap-2">
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
