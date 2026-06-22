function UsersQuickActionsCard({ actionFeedback }) {
  return (
    <section className="admin-users-card">
      <h2 className="admin-users-card-title mb-3">Quick Actions</h2>
      {actionFeedback.message && (
        <p className={`admin-users-action-feedback mb-3 ${actionFeedback.type === 'error' ? 'is-error' : 'is-success'}`}>
          {actionFeedback.message}
        </p>
      )}
      <div className="d-grid gap-2">
        <button type="button" className="btn btn-outline-secondary">
          Export User List
        </button>
        <button type="button" className="btn btn-outline-secondary">
          Bulk Role Update
        </button>
        <button type="button" className="btn btn-outline-secondary">
          Send System-Wide Announcement
        </button>
      </div>
    </section>
  )
}

export default UsersQuickActionsCard
