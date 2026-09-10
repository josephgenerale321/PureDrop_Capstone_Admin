import AdminErrorState from '../AdminErrorState.jsx'
import AdminLoadingState from '../AdminLoadingState.jsx'

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'awaiting_id', label: 'Awaiting ID' },
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
]

function VerificationTable({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  filteredVerifications,
  onViewReview,
  isLoading,
  loadError = '',
  onRefresh,
}) {
  return (
    <div className="admin-verification-card">
      <div className="admin-verification-card-head">
        <div>
          <h2 className="admin-verification-card-title">Verification Requests</h2>
          <p className="admin-verification-card-subtitle">
            Compare each ID photo with the live selfie before deciding.
          </p>
        </div>
        <div className="admin-verification-card-tools">
          <input
            type="search"
            className="form-control"
            placeholder="Search name, email, or ID type…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search verification requests"
          />
          <button type="button" className="btn btn-outline-secondary" onClick={onRefresh}>
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-verification-tabs" role="tablist" aria-label="Filter by verification status">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={statusFilter === filter.key}
            className={`admin-verification-tab${statusFilter === filter.key ? ' is-active' : ''}`}
            onClick={() => onStatusFilterChange(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading && <AdminLoadingState label="Loading verification requests..." compact />}

      {!isLoading && loadError && (
        <AdminErrorState
          title="Unable to load verification requests"
          message={loadError}
          onRetry={onRefresh}
          tips={[
            'Check your network connection',
            'Verify your admin permissions',
            'Try again in a few moments',
          ]}
        />
      )}

      {!isLoading && !loadError && (
      <div className="table-responsive">
        <table className="table admin-verification-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>ID Type</th>
              <th>Liveness</th>
              <th>Rejections</th>
              <th>Submitted</th>
              <th>Status</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredVerifications.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-verification-empty">
                  No verification requests found.
                </td>
              </tr>
            ) : (
              filteredVerifications.map((item) => (
                <tr key={item.key}>
                  <td>
                    <div className="admin-verification-applicant">
                      <span className="admin-verification-avatar" aria-hidden="true">
                        {item.fullName.charAt(0).toUpperCase()}
                      </span>
                      <div className="admin-verification-applicant-info">
                        <span className="admin-verification-applicant-name">{item.fullName}</span>
                        <span className="admin-verification-applicant-email">{item.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{item.idType || <span className="admin-verification-not-submitted">—</span>}</td>
                  <td>
                    {item.livenessPassed === null ? (
                      <span className="badge-pill verification-liveness-pending">
                        Not submitted
                      </span>
                    ) : (
                      <span
                        className={`badge-pill ${
                          item.livenessPassed ? 'verification-liveness-passed' : 'verification-liveness-failed'
                        }`}
                      >
                        {item.livenessPassed ? '✓ Passed' : '✕ Failed'}
                      </span>
                    )}
                  </td>
                  <td>
                    {item.rejectionCount > 0 ? (
                      <span
                        className={`badge-pill verification-rejections${item.rejectionCount >= 3 ? ' is-final' : ''}`}
                        title={
                          item.rejectionCount >= 3
                            ? 'Final warning — the user has been rejected 3 times.'
                            : 'Number of times this verification was rejected.'
                        }
                      >
                        {item.rejectionCount}
                      </span>
                    ) : (
                      <span className="admin-verification-not-submitted">0</span>
                    )}
                  </td>
                  <td className="admin-verification-date">
                    {item.submittedAt ? (
                      <>
                        {item.submittedAt}
                        {item.verificationStatus === 'pending' && item.waitingDays >= 1 && (
                          <span
                            className={`admin-verification-age-chip${item.waitingDays >= 3 ? ' is-stale' : ''}`}
                            title={
                              item.waitingDays >= 3
                                ? `Waiting ${item.waitingDays} days — review this request soon.`
                                : `Waiting ${item.waitingDays} ${item.waitingDays === 1 ? 'day' : 'days'}.`
                            }
                          >
                            {item.waitingDays}d
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="admin-verification-not-submitted">Not submitted yet</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge-pill verification-status-${item.verificationStatus}`}>
                      {item.verificationStatus.charAt(0).toUpperCase() + item.verificationStatus.slice(1)}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-outline-primary admin-verification-review-button"
                      onClick={() => onViewReview(item.key)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

export default VerificationTable
