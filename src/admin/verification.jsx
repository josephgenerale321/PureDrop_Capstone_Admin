import { useEffect, useMemo, useState } from 'react'
import './verification.css'
import './admin-states.css'
import AdminSidebar from './sidebar.jsx'
import useAdminMobileNav from './useAdminMobileNav.js'
import useLogout from './useLogout.js'
import LogoutConfirmModal from './LogoutConfirmModal.jsx'
import VerificationReviewModal from './verification/VerificationReviewModal.jsx'
import VerificationSummary from './verification/VerificationSummary.jsx'
import VerificationTable from './verification/VerificationTable.jsx'
import usePendingVerificationBadge from './verification/usePendingVerificationBadge.js'
import PaginationControls from './pagination/PaginationControls.jsx'
import {
  decideVerificationInFirestore,
  getVerificationsLoadErrorMessage,
  subscribeVerifications,
} from './verification/verificationService.js'

function AdminVerification({ user, onLogout }) {
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useAdminMobileNav()
  const {
    isLogoutModalOpen,
    isSigningOut,
    logoutError,
    confirmLogout,
    closeLogoutModal,
    handleConfirmLogout,
  } = useLogout(onLogout)

  // REAL Firestore data — a live onSnapshot subscription over the
  // `regular_user` collection (see verificationService.js). The table updates
  // automatically as users submit face scans / IDs and as decisions land.
  const [verifications, setVerifications] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedKey, setSelectedKey] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryCounter, setRetryCounter] = useState(0)
  // Feedback for the last approve/reject decision (shown under the header).
  const [decisionFeedback, setDecisionFeedback] = useState(null)
  const [isDeciding, setIsDeciding] = useState(false)

  // Live pending count for the sidebar badge (its own lightweight subscription).
  const pendingVerificationCount = usePendingVerificationBadge()

  // Table pagination over the filtered verification list.
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setIsLoading(true)
    setLoadError('')

    const unsubscribe = subscribeVerifications({
      onVerifications: (mappedVerifications) => {
        setVerifications(mappedVerifications)
        setIsLoading(false)
      },
      onError: (error) => {
        setLoadError(getVerificationsLoadErrorMessage(error))
        setVerifications([])
        setIsLoading(false)
      },
    })

    return () => unsubscribe()
  }, [retryCounter])

  // Re-subscribe (fresh snapshot + loading state) — wired to the Refresh button.
  const refreshVerifications = () => {
    setDecisionFeedback(null)
    setRetryCounter((current) => current + 1)
  }

  const summary = useMemo(() => {
    const count = (status) => verifications.filter((item) => item.verificationStatus === status).length
    return {
      total: verifications.length,
      awaitingId: count('awaiting_id'),
      pending: count('pending'),
      verified: count('verified'),
      rejected: count('rejected'),
    }
  }, [verifications])

  const filteredVerifications = useMemo(() => {
    const query = search.trim().toLowerCase()
    return verifications.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.verificationStatus === statusFilter
      if (!matchesStatus) {
        return false
      }
      if (!query) {
        return true
      }
      return (
        item.fullName.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        (item.idType || '').toLowerCase().includes(query)
      )
    })
  }, [verifications, search, statusFilter])

  // Reset to the first page whenever the query, filter, or page size changes,
  // and keep the page in range when filters shrink the list.
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, pageSize])

  const totalPageCount = Math.max(1, Math.ceil(filteredVerifications.length / pageSize))

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPageCount))
  }, [totalPageCount])

  const paginatedVerifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredVerifications.slice(start, start + pageSize)
  }, [filteredVerifications, currentPage, pageSize])

  const selectedVerification = verifications.find((item) => item.key === selectedKey) || null
  const selectedQueueIndex = filteredVerifications.findIndex((item) => item.key === selectedKey)
  const selectedPosition =
    selectedQueueIndex >= 0 ? { index: selectedQueueIndex, total: filteredVerifications.length } : null

  // Move through the review queue (Prev/Next buttons or arrow keys).
  const navigateReview = (direction) => {
    const nextIndex = selectedQueueIndex + direction
    if (selectedQueueIndex < 0 || nextIndex < 0 || nextIndex >= filteredVerifications.length) {
      return
    }
    setSelectedKey(filteredVerifications[nextIndex].key)
  }

  // REAL decision — writes verificationStatus / verifiedAt / rejectionReason
  // plus an audit-trail entry (who decided, when, and the reason) to the
  // user's `regular_user` document. The live subscription reflects the
  // change in the table instantly; the modal closes on success.
  const handleDecision = async (key, decision, rejectionReason = '', rejectionTarget = 'both') => {
    setIsDeciding(true)
    try {
      const result = await decideVerificationInFirestore({
        uid: key,
        decision,
        rejectionReason,
        rejectionTarget,
        actor: { email: user?.email || '', name: user?.name || '' },
      })

      if (!result.ok) {
        setDecisionFeedback({ type: 'error', message: result.error })
        return
      }

      setDecisionFeedback({ type: 'success', message: result.message })
      setSelectedKey(null)
    } finally {
      setIsDeciding(false)
    }
  }

  return (
    <main className="admin-verification-page">
      <div className={`admin-verification-shell${isMobileNavOpen ? ' is-nav-open' : ''}`}>
        <div id="admin-verification-sidebar" className="admin-verification-sidebar-wrap">
          <AdminSidebar
            activeItem="verification"
            badges={{ verification: pendingVerificationCount }}
            user={user}
            onLogout={confirmLogout}
            onClose={closeMobileNav}
          />
        </div>

        <section className="admin-verification-content">
          <header className="admin-verification-header">
            <div>
              <button
                type="button"
                className="btn btn-outline-secondary admin-verification-mobile-toggle"
                onClick={toggleMobileNav}
                aria-expanded={isMobileNavOpen}
                aria-controls="admin-verification-sidebar"
              >
                <span className="admin-verification-toggle-icon" aria-hidden="true">
                  {isMobileNavOpen ? '✕' : '☰'}
                </span>
                {isMobileNavOpen ? 'Close Menu' : 'Menu'}
              </button>
              <h1 className="admin-verification-title">Verification</h1>
              <p className="admin-verification-subtitle">
                Review submitted valid IDs and face scans, then approve or reject accounts.
              </p>
            </div>
          </header>

          {decisionFeedback && (
            <div
              className={`admin-verification-notice${decisionFeedback.type === 'error' ? ' is-error' : ''}`}
              role="status"
            >
              <strong>{decisionFeedback.type === 'error' ? 'Decision failed.' : 'Decision saved.'}</strong>{' '}
              {decisionFeedback.message}
            </div>
          )}

          <VerificationSummary summary={summary} />

          <VerificationTable
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            filteredVerifications={paginatedVerifications}
            onViewReview={setSelectedKey}
            isLoading={isLoading}
            loadError={loadError}
            onRefresh={refreshVerifications}
          />

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPageCount}
            totalItems={filteredVerifications.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => setPageSize(size)}
          />
        </section>

        <button
          type="button"
          className="admin-verification-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={closeMobileNav}
        />

        {selectedVerification && (
          <VerificationReviewModal
            key={selectedVerification.key}
            verification={selectedVerification}
            isDeciding={isDeciding}
            position={selectedPosition}
            onClose={() => setSelectedKey(null)}
            onDecision={handleDecision}
            onNavigate={selectedPosition ? navigateReview : null}
          />
        )}
      </div>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        isSigningOut={isSigningOut}
        error={logoutError}
        userEmail={''}
        onConfirm={handleConfirmLogout}
        onClose={closeLogoutModal}
      />
    </main>
  )
}

export default AdminVerification
