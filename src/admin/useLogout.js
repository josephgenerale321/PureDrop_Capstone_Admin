import { useCallback, useState } from 'react'

/**
 * Shared logout flow for admin pages.
 * Handles the confirmation modal state, signing out, loading state,
 * and error handling.
 */
function useLogout(onLogout) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const confirmLogout = useCallback(() => {
    setLogoutError('')
    setIsLogoutModalOpen(true)
  }, [])

  const closeLogoutModal = useCallback(() => {
    if (isSigningOut) {
      return
    }
    setIsLogoutModalOpen(false)
    setLogoutError('')
  }, [isSigningOut])

  const handleConfirmLogout = useCallback(async () => {
    if (isSigningOut) {
      return
    }

    setIsSigningOut(true)
    setLogoutError('')

    try {
      await onLogout?.()
      // The app will redirect to login via App.jsx when adminUser becomes null.
      setIsLogoutModalOpen(false)
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Unable to sign out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }, [isSigningOut, onLogout])

  return {
    isLogoutModalOpen,
    isSigningOut,
    logoutError,
    confirmLogout,
    closeLogoutModal,
    handleConfirmLogout,
  }
}

export default useLogout