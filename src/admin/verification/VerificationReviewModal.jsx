import { useState } from 'react'

function VerificationReviewModal({ verification, onClose, onDecision }) {
  // Design phase: Approve decides instantly; Reject reveals the reason field.
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  if (!verification) {
    return null
  }

  // Awaiting-ID accounts only have the enrollment selfie. The full review
  // (ID front/back + login selfie) unlocks after the user submits their ID
  // from the login gate.
  const hasSubmittedId = verification.verificationStatus !== 'awaiting_id'

  const handleConfirmReject = () => {
    onDecision(verification.key, 'reject', rejectionReason.trim() || 'Verification rejected by admin.')
  }

  const handleApprove = () => {
    onDecision(verification.key, 'approve')
  }

  return (
    <div className="admin-verification-modal-layer" role="presentation">
      <button type="button" className="admin-verification-modal-backdrop" aria-label="Close verification review modal" onClick={onClose} />
      <section
        className="admin-verification-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-verification-modal-title"
      >
        <div className="admin-verification-modal-head">
          <div>
            <h2 id="admin-verification-modal-title" className="admin-verification-modal-title">
              {verification.fullName}
            </h2>
            <p className="admin-verification-modal-subtitle">
              {hasSubmittedId
                ? `${verification.idType} · Submitted ${verification.submittedAt}`
                : `Face enrolled ${verification.enrolledAt} · No ID submitted yet`}
            </p>
          </div>
          <button type="button" className="admin-verification-modal-close" aria-label="Close" onClick={onClose}>
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {!hasSubmittedId && (
          <div className="admin-verification-notice">
            <strong>Awaiting valid ID.</strong> This account completed face enrollment but hasn't submitted a
            valid ID yet. Full review unlocks after the user submits their ID on the next login.
          </div>
        )}

        <div className={`admin-verification-images${hasSubmittedId ? '' : ' is-enrollment-only'}`}>
          {verification.images.front && (
            <figure className="admin-verification-image-tile">
              <img
                src={verification.images.front}
                alt={`${verification.idType || 'ID'} front`}
                className="admin-verification-image"
              />
              <figcaption className="admin-verification-image-label">ID Front</figcaption>
            </figure>
          )}
          {verification.images.back && (
            <figure className="admin-verification-image-tile">
              <img
                src={verification.images.back}
                alt={`${verification.idType || 'ID'} back`}
                className="admin-verification-image"
              />
              <figcaption className="admin-verification-image-label">ID Back</figcaption>
            </figure>
          )}
          {verification.images.enrollmentSelfie && (
            <figure className="admin-verification-image-tile admin-verification-image-tile-enrollment">
              <img
                src={verification.images.enrollmentSelfie}
                alt="Enrollment selfie captured during registration"
                className="admin-verification-image"
              />
              <figcaption className="admin-verification-image-label">Enrollment Selfie</figcaption>
            </figure>
          )}
          {verification.images.loginSelfie && (
            <figure className="admin-verification-image-tile admin-verification-image-tile-login">
              <img
                src={verification.images.loginSelfie}
                alt="Selfie captured during identity verification"
                className="admin-verification-image"
              />
              <figcaption className="admin-verification-image-label">Login Selfie</figcaption>
            </figure>
          )}
        </div>

        <dl className="admin-verification-meta">
          <div>
            <dt>Email</dt>
            <dd>{verification.email}</dd>
          </div>
          <div>
            <dt>Liveness Check</dt>
            <dd>
              <span
                className={`badge-pill ${
                  verification.livenessPassed ? 'verification-liveness-passed' : 'verification-liveness-failed'
                }`}
              >
                {verification.livenessPassed ? '✓ Passed' : '✕ Failed'}
              </span>
            </dd>
          </div>
          <div>
            <dt>ID Type</dt>
            <dd>{verification.idType || 'Not submitted'}</dd>
          </div>
          <div>
            <dt>Face Enrolled</dt>
            <dd>{verification.enrolledAt}</dd>
          </div>
          <div>
            <dt>ID Submitted</dt>
            <dd>{verification.submittedAt || 'Not yet'}</dd>
          </div>
        </dl>

        {verification.verificationStatus === 'rejected' && (
          <p className="admin-verification-existing-rejection">
            <strong>Rejected:</strong> {verification.rejectionReason}
          </p>
        )}

        {isRejecting && (
          <div className="admin-verification-reject-box">
            <label className="admin-verification-reject-label" htmlFor="admin-verification-reject-reason">
              Rejection reason (shown to the user)
            </label>
            <textarea
              id="admin-verification-reject-reason"
              className="form-control"
              rows={2}
              placeholder="e.g. ID photo is blurry — please retake and resubmit."
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
            />
          </div>
        )}

        <div className="admin-verification-modal-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          {isRejecting ? (
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setIsRejecting(false)}>
                Back
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmReject}>
                Confirm Reject
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-outline-danger" onClick={() => setIsRejecting(true)}>
                Reject
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleApprove}
                disabled={!hasSubmittedId}
                title={hasSubmittedId ? undefined : 'Approval unlocks after the user submits a valid ID.'}
              >
                Approve
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default VerificationReviewModal
