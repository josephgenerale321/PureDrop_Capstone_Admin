function ReportsRecentActivityCard({ recentActivity }) {
  return (
    <section className="admin-reports-card">
      <h2 className="admin-reports-card-title mb-3">Recent Activity</h2>
      {!recentActivity.length && <p className="text-muted mb-0">No report activity yet.</p>}
      {!!recentActivity.length && (
        <ul className="activity-list">
          {recentActivity.map((activity) => (
            <li key={activity.id}>
              <strong>{activity.label}</strong>
              <span>{activity.timeAgo}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ReportsRecentActivityCard
