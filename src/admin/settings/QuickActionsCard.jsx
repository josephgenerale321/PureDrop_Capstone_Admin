function QuickActionsCard({ onExport, onBulkUpdatePermissions, onRestoreDefaults }) {
  return (
    <section className="admin-settings-card">
      <h2 className="admin-settings-card-title">Quick Actions</h2>
      <div className="admin-settings-quick-actions">
        <button type="button" className="btn btn-outline-secondary" onClick={onExport}>
          Export Configuration Settings
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onBulkUpdatePermissions}>
          Bulk Update User Permissions
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onRestoreDefaults}>
          Restore to System Default Settings
        </button>
      </div>
    </section>
  )
}

export default QuickActionsCard
