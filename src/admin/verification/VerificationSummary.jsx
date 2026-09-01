function VerificationSummary({ summary }) {
  return (
    <div className="admin-verification-summary">
      <article className="admin-verification-stat admin-verification-stat-awaiting">
        <span className="admin-verification-stat-value">{summary.awaitingId}</span>
        <span className="admin-verification-stat-label">Awaiting ID</span>
        <span className="admin-verification-stat-note">Face enrolled, no ID yet</span>
      </article>
      <article className="admin-verification-stat admin-verification-stat-pending">
        <span className="admin-verification-stat-value">{summary.pending}</span>
        <span className="admin-verification-stat-label">Pending</span>
        <span className="admin-verification-stat-note">ID submitted, for review</span>
      </article>
      <article className="admin-verification-stat admin-verification-stat-verified">
        <span className="admin-verification-stat-value">{summary.verified}</span>
        <span className="admin-verification-stat-label">Verified</span>
        <span className="admin-verification-stat-note">Approved accounts</span>
      </article>
      <article className="admin-verification-stat admin-verification-stat-rejected">
        <span className="admin-verification-stat-value">{summary.rejected}</span>
        <span className="admin-verification-stat-label">Rejected</span>
        <span className="admin-verification-stat-note">Sent back to users</span>
      </article>
    </div>
  )
}

export default VerificationSummary
