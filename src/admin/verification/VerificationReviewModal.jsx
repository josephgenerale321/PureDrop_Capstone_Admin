import { useEffect, useMemo, useState } from 'react'
import VerificationImageLightbox from './VerificationImageLightbox.jsx'

// Quick-pick reasons for the rejection flow — clicking a chip fills the
// (still editable) reason textarea so feedback stays consistent across admins.
const REJECTION_PRESETS = [
  { label: 'Blurry photo', reason: 'The ID photo is blurry — please retake it and resubmit.' },
  { label: 'ID expired', reason: 'The submitted ID has expired. Please submit a currently valid ID.' },
  { label: 'Details mismatch', reason: 'The name or details on the ID do not match the account information.' },
  { label: 'Face mismatch', reason: 'The face in the photo does not clearly match the submitted ID.' },
  { label: 'Possible tampering', reason: 'The submitted ID appears to be altered or tampered with. Please resubmit a genuine document.' },
]

function VerificationReviewModal({
  verification,
  isDeciding = false,
  position = null, // { index, total } within the current review queue, when available
  onClose,
  onDecision,
  onNavigate = null, // (direction: -1 | 1) => void — moves to the previous/next request
}) {
  // Approve and Reject both reveal a confirmation step before writing to
  // Firestore, so a stray click can never decide an account. While a decision
  // is being written, the action buttons are disabled.
  const [isRejecting, setIsRejecting] = useState(false)
  const [isConfirmingApprove, setIsConfirmingApprove] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [zoomedImageIndex, setZoomedImageIndex] = useState(null)

  // Awaiting-ID accounts only have the enrollment selfie. The full review
  // (ID front/back + login selfie) unlocks after the user submits their ID
  // from the login gate. `submittedAt` guards against a rejected account
  // that never submitted an ID.
  const hasSubmittedId =
    Boolean(verification) &&
    verification.verificationStatus !== 'awaiting_id' &&
    Boolean(verification.submittedAt)

  // Flat list of every submitted image, in review order (ID front, ID back,
  // enrollment selfie, login selfie) — drives the zoom lightbox, where
  // stepping through the images doubles as the selfie-vs-ID compare view.
  const reviewImages = useMemo(() => {
    if (!verification) {
      return []
    }

    const list = []
    if (verification.images.front) {
      list.push({
        src: verification.images.front,
        label: 'ID Front',
        alt: `${verification.idType || 'ID'} front`,
      })
    }
    if (verification.images.back) {
      list.push({
        src: verification.images.back,
        label: 'ID Back',
        alt: `${verification.idType || 'ID'} back`,
      })
    }
    if (verification.images.enrollmentSelfie) {
      list.push({
        src: verification.images.enrollmentSelfie,
        label: 'Enrollment Selfie',
        alt: 'Enrollment selfie captured during registration',
      })
    }
    if (verification.images.loginSelfie) {
      list.push({
        src: verification.images.loginSelfie,
        label: 'Login Selfie',
        alt: 'Selfie captured during identity verification',
      })
    }
    return list
  }, [verification])

  // NOTE: no reset effect is needed — the parent remounts this modal with a
  // `key` per request, so all review state starts fresh each time.

  // Keyboard shortcuts: Esc closes, arrows move through the review queue,
  // A/R start the approve/reject flows. Ignored while typing in a field.
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

      if (isTyping || isDeciding) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'ArrowLeft' && onNavigate && position && position.index > 0) {
        event.preventDefault()
        onNavigate(-1)
      } else if (event.key === 'ArrowRight' && onNavigate && position && position.index < position.total - 1) {
        event.preventDefault()
        onNavigate(1)
      } else if ((event.key === 'a' || event.key === 'A') && !isRejecting && !isConfirmingApprove && hasSubmittedId) {
        event.preventDefault()
        setIsConfirmingApprove(true)
      } else if ((event.key === 'r' || event.key === 'R') && !isConfirmingApprove) {
        event.preventDefault()
        setIsRejecting(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isConfirmingApprove, isDeciding, isRejecting, onClose, onNavigate, position, hasSubmittedId])

  if (!verification) {
    return null
  }

  const handleConfirmReject = () => {
    onDecision(verification.key, 'reject', rejectionReason.trim() || 'Verification rejected by admin.')
  }

  const handleConfirmApprove = () => {
    onDecision(verification.key, 'approve')
  }

  // Lightbox indices are resolved from the flat image list so each tile opens
  // the right image regardless of which payloads the account submitted.
  const frontImageIndex = reviewImages.findIndex((image) => image.label === 'ID Front')
  const backImageIndex = reviewImages.findIndex((image) => image.label === 'ID Back')
  const enrollmentImageIndex = reviewImages.findIndex((image) => image.label === 'Enrollment Selfie')
  const loginImageIndex = reviewImages.findIndex((image) => image.label === 'Login Selfie')

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
                ? `${verification.idType || 'Valid ID'} · Submitted ${verification.submittedAt}`
                : `Face enrolled ${verification.enrolledAt} · No ID submitted yet`}
            </p>
          </div>
          <button type="button" className="admin-verification-modal-close" aria-label="Close" onClick={onClose}>
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {position && onNavigate && (
          <div className="admin-verification-queue-bar">
            <span className="admin-verification-queue-counter">
              Reviewing {position.index + 1} of {position.total}
            </span>
            <div className="admin-verification-queue-nav">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => onNavigate(-1)}
                disabled={isDeciding || position.index <= 0}
                aria-label="Previous verification request"
              >
                ‹ Prev
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => onNavigate(1)}
                disabled={isDeciding || position.index >= position.total - 1}
                aria-label="Next verification request"
              >
                Next ›
              </button>
            </div>
          </div>
        )}

        {!hasSubmittedId && (
          <div className="admin-verification-notice">
            <strong>Awaiting valid ID.</strong> This account completed face enrollment but hasn't submitted a
            valid ID yet. Full review unlocks after the user submits their ID on the next login.
          </div>
        )}

        <div className={`admin-verification-images${hasSubmittedId ? '' : ' is-enrollment-only'}`}>
          {verification.images.front && (
            <figure className="admin-verification-image-tile">
              <button
                type="button"
                className="admin-verification-image-zoom-btn"
                onClick={() => setZoomedImageIndex(frontImageIndex)}
                title="Click to enlarge"
                aria-label="Enlarge ID front image"
              >
                <img
                  src={verification.images.front}
                  alt={`${verification.idType || 'ID'} front`}
                  className="admin-verification-image"
                />
              </button>
              <figcaption className="admin-verification-image-label">ID Front</figcaption>
            </figure>
          )}
          {verification.images.back && (
            <figure className="admin-verification-image-tile">
              <button
                type="button"
                className="admin-verification-image-zoom-btn"
                onClick={() => setZoomedImageIndex(backImageIndex)}
                title="Click to enlarge"
                aria-label="Enlarge ID back image"
              >
                <img
                  src={verification.images.back}
                  alt={`${verification.idType || 'ID'} back`}
                  className="admin-verification-image"
                />
              </button>
              <figcaption className="admin-verification-image-label">ID Back</figcaption>
            </figure>
          )}
          {verification.images.enrollmentSelfie && (
            <figure className="admin-verification-image-tile admin-verification-image-tile-enrollment">
              <button
                type="button"
                className="admin-verification-image-zoom-btn"
                onClick={() => setZoomedImageIndex(enrollmentImageIndex)}
                title="Click to enlarge"
                aria-label="Enlarge enrollment selfie image"
              >
                <img
                  src={verification.images.enrollmentSelfie}
                  alt="Enrollment selfie captured during registration"
                  className="admin-verification-image"
                />
              </button>
              <figcaption className="admin-verification-image-label">Enrollment Selfie</figcaption>
            </figure>
          )}
          {verification.images.loginSelfie && (
            <figure className="admin-verification-image-tile admin-verification-image-tile-login">
              <button
                type="button"
                className="admin-verification-image-zoom-btn"
                onClick={() => setZoomedImageIndex(loginImageIndex)}
                title="Click to enlarge"
                aria-label="Enlarge login selfie image"
              >
                <img
                  src={verification.images.loginSelfie}
                  alt="Selfie captured during identity verification"
                  className="admin-verification-image"
                />
              </button>
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
              {verification.livenessPassed === null ? (
                <span className="badge-pill verification-liveness-pending">
                  Not submitted
                </span>
              ) : (
                <span
                  className={`badge-pill ${
                    verification.livenessPassed ? 'verification-liveness-passed' : 'verification-liveness-failed'
                  }`}
                >
                  {verification.livenessPassed ? '✓ Passed' : '✕ Failed'}
                </span>
              )}
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
          <div>
            <dt>Rejections</dt>
            <dd>{verification.rejectionCount || 0}</dd>
          </div>
        </dl>

        {verification.history && verification.history.length > 0 && (
          <section className="admin-verification-history" aria-label="Decision history">
            <h3 className="admin-verification-history-title">Decision History</h3>
            <ul className="admin-verification-history-list">
              {verification.history.map((entry, index) => (
                <li
                  key={`${entry.atMs}-${index}`}
                  className={`admin-verification-history-item is-${entry.action}`}
                >
                  <span className="admin-verification-history-action">
                    {entry.action === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                  <span className="admin-verification-history-detail">
                    {entry.reason ? `${entry.reason} — ` : ''}
                    by {entry.adminEmail} · {entry.at}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {verification.rejectionCount >= 3 && (
          <div className="admin-verification-notice">
            <strong>Final warning stage.</strong> This verification has been rejected{" "}
            {verification.rejectionCount} times — the mobile app now shows a final-warning
            screen before asking the user to re-verify.
          </div>
        )}

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
            <div className="admin-verification-preset-row" role="group" aria-label="Common rejection reasons">
              {REJECTION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`admin-verification-preset-chip${rejectionReason === preset.reason ? ' is-active' : ''}`}
                  onClick={() => setRejectionReason(preset.reason)}
                  title={preset.reason}
                >
                  {preset.label}
                </button>
              ))}
            </div>
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

        {isConfirmingApprove && (
          <div className="admin-verification-approve-box">
            <strong>Confirm approval.</strong> This marks the account as verified, clears any previous
            rejection, and takes effect immediately.
          </div>
        )}

        <div className="admin-verification-modal-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isDeciding}>
            Close
          </button>
          {isConfirmingApprove ? (
            <>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setIsConfirmingApprove(false)}
                disabled={isDeciding}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmApprove}
                disabled={isDeciding}
              >
                {isDeciding ? 'Saving...' : 'Confirm Approve'}
              </button>
            </>
          ) : isRejecting ? (
            <>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setIsRejecting(false)}
                disabled={isDeciding}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmReject}
                disabled={isDeciding}
              >
                {isDeciding ? 'Saving...' : 'Confirm Reject'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => setIsRejecting(true)}
                disabled={isDeciding}
              >
                Reject
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => setIsConfirmingApprove(true)}
                disabled={!hasSubmittedId || isDeciding}
                title={hasSubmittedId ? undefined : 'Approval unlocks after the user submits a valid ID.'}
              >
                {isDeciding ? 'Saving...' : 'Approve'}
              </button>
            </>
          )}
        </div>

        {zoomedImageIndex !== null && reviewImages[zoomedImageIndex] && (
          <VerificationImageLightbox
            images={reviewImages}
            index={zoomedImageIndex}
            onClose={() => setZoomedImageIndex(null)}
            onNavigate={setZoomedImageIndex}
          />
        )}
      </section>
    </div>
  )
}

export default VerificationReviewModal
