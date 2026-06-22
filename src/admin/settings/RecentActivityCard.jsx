function RecentActivityCard({ items }) {
  return (
    <section className="admin-settings-card">
      <h2 className="admin-settings-card-title">Recent Activity</h2>
      {!items.length && <p className="text-muted mb-0">No activity yet.</p>}
      {!!items.length && (
        <ul className="admin-settings-activity-list">
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.timeAgo}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default RecentActivityCard
