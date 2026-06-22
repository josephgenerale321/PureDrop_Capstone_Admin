import { useState } from 'react'

const PERMISSION_COLUMNS = [
  { key: 'edit', label: 'Edit' },
  { key: 'process', label: 'Process' },
  { key: 'admin', label: 'Admin' },
  { key: 'view', label: 'View' },
  { key: 'close', label: 'Close' },
]

function RolesPermissionsCard({ roles, onRoleNameChange, onTogglePermission, onAddRole, onSave, isSaving }) {
  const [newRoleName, setNewRoleName] = useState('')

  const handleAddRole = () => {
    onAddRole(newRoleName)
    setNewRoleName('')
  }

  return (
    <section className="admin-settings-card">
      <div className="admin-settings-card-head">
        <h2 className="admin-settings-card-title mb-0">User Roles and Permissions</h2>
        <div className="admin-settings-add-role">
          <input
            className="form-control"
            placeholder="Role name"
            value={newRoleName}
            onChange={(event) => setNewRoleName(event.target.value)}
          />
          <button type="button" className="btn btn-outline-secondary" onClick={handleAddRole}>
            + Add New Role
          </button>
        </div>
      </div>

      <div className="admin-settings-roles-scroll">
        <div className="admin-role-table">
          <div className="admin-role-row admin-role-row-head">
            <span>Role</span>
            {PERMISSION_COLUMNS.map((column) => (
              <span key={column.key}>{column.label}</span>
            ))}
          </div>

          {roles.map((role) => (
            <div key={role.id} className="admin-role-row">
              <input
                className="form-control form-control-sm admin-role-name-input"
                value={role.name}
                onChange={(event) => onRoleNameChange(role.id, event.target.value)}
              />
              {PERMISSION_COLUMNS.map((column) => (
                <label key={`${role.id}-${column.key}`} className="admin-settings-checkbox admin-settings-center">
                  <input
                    type="checkbox"
                    checked={Boolean(role.permissions[column.key])}
                    onChange={() => onTogglePermission(role.id, column.key)}
                  />
                  <span>{column.label}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="admin-settings-save-row">
        <button type="button" className="btn btn-success" disabled={isSaving} onClick={onSave}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </section>
  )
}

export default RolesPermissionsCard
