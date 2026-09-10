import { useEffect, useState } from 'react'
import { subscribeVerifications } from './verificationService.js'

// Live pending-verification count for the sidebar badge. Reuses the same
// onSnapshot subscription the verification page uses, so the badge updates in
// real time as users submit IDs and as admin decisions land. Errors (e.g.
// permission-denied) silently fall back to no badge — the page itself will
// surface the load error to the reviewer.
function usePendingVerificationBadge() {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const unsubscribe = subscribeVerifications({
      onVerifications: (verifications) => {
        setPendingCount(
          verifications.filter((item) => item.verificationStatus === 'pending').length,
        )
      },
      onError: () => setPendingCount(0),
    })

    return () => unsubscribe()
  }, [])

  return pendingCount
}

export default usePendingVerificationBadge
