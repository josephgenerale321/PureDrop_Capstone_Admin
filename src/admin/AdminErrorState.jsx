import './admin-states.css'

function AdminErrorState({
  title = 'Something went wrong',
  message = '',
  onRetry,
  retryLabel = 'Try Again',
  tips = [],
  compact = false,
}) {
  return (
    <div className={`admin-error-state${compact ? ' is-compact' : ''}`} role="alert">
      <div className="admin-error-icon-wrap" aria-hidden="true">
        <span className="admin-error-icon">!</span>
      </div>

      <h3 className="admin-error-title">{title}</h3>
      {message && <p className="admin-error-message">{message}</p>}

      {tips.length > 0 && (
        <div className="admin-error-tips">
          {tips.map((tip) => (
            <p key={tip} className="admin-error-tip">
              • {tip}
            </p>
          ))}
        </div>
      )}

      {onRetry && (
        <button type="button" className="admin-error-retry-btn" onClick={onRetry}>
          <span className="admin-error-retry-icon" aria-hidden="true">
            ↻
          </span>
          {retryLabel}
        </button>
      )}
    </div>
  )
}

export default AdminErrorState