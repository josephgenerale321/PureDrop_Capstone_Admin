import './admin-states.css'

function AdminLoadingState({ label = 'Loading...', compact = false }) {
  return (
    <div className={`admin-loading-state${compact ? ' is-compact' : ''}`} role="status" aria-live="polite">
      <div className="admin-loading-spinner" aria-hidden="true" />
      <p className="admin-loading-label">{label}</p>
    </div>
  )
}

export default AdminLoadingState