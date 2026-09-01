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
import { MOCK_VERIFICATIONS } from './verification/mockVerifications.js'

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

  // DESIGN PHASE: local state only. Phase 2 replaces this with
  // a verificationService.js Firestore subscription.
  const [verifications, setVerifications] = useState(MOCK_VERIFICATIONS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedKey, setSelectedKey] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // DESIGN PHASE: simulated fetch delay so the loading state mirrors the
  // Reports page. Phase 2 replaces this with the real Firestore subscription.
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900)
    return () => clearTimeout(timer)
  }, [])

  const refreshVerifications = () => {
    setIsLoading(true)
    setLoadError('')
    setTimeout(() => setIsLoading(false), 900)
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
        item.idType.toLowerCase().includes(query)
      )
    })
  }, [verifications, search, statusFilter])

  const selectedVerification = verifications.find((item) => item.key === selectedKey) || null

  const handleDecision = (key, decision, rejectionReason = '') => {
    setVerifications((previous) =>
      previous.map((item) =>
        item.key === key
          ? {
              ...item,
              verificationStatus: decision === 'approve' ? 'verified' : 'rejected',
              rejectionReason: decision === 'reject' ? rejectionReason : null,
            }
          : item,
      ),
    )
    setSelectedKey(null)
  }

  return (
    <main className="admin-verification-page">
      <div className={`admin-verification-shell${isMobileNavOpen ? ' is-nav-open' : ''}`}>
        <div id="admin-verification-sidebar" className="admin-verification-sidebar-wrap">
          <AdminSidebar
            activeItem="verification"
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

          <VerificationSummary summary={summary} />

          <VerificationTable
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            filteredVerifications={filteredVerifications}
            onViewReview={setSelectedKey}
            isLoading={isLoading}
            loadError={loadError}
            onRefresh={refreshVerifications}
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
            verification={selectedVerification}
            onClose={() => setSelectedKey(null)}
            onDecision={handleDecision}
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
