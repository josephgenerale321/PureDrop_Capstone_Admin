import { useEffect, useState } from 'react'

/**
 * Shared mobile navigation state and behavior for admin pages.
 * Handles the open/close state, auto-close on desktop resize,
 * Escape key to close, and body scroll lock while open.
 */
function useAdminMobileNav() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsMobileNavOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined' || !isMobileNavOpen) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileNavOpen])

  const toggleMobileNav = () => setIsMobileNavOpen((current) => !current)
  const closeMobileNav = () => setIsMobileNavOpen(false)

  return {
    isMobileNavOpen,
    toggleMobileNav,
    closeMobileNav,
  }
}

export default useAdminMobileNav