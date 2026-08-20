import { useEffect, useState } from 'react'
import './NoInternetScreen.css'
import logo from '../assets/logo.png'

/**
 * `NoInternetScreen` — a web-native, desktop-appropriate offline overlay for
 * the PureDrop Admin dashboard.
 *
 * HOW IT WORKS (100% web-safe, no mobile-style detection):
 * - Uses the browser's native `navigator.onLine` API + `online`/`offline`
 *   events — the same mechanism browsers use to show their own offline
 *   indicators. This never false-positives when a third-party endpoint
 *   (e.g. Google's generate_204) is unreachable due to network policy.
 * - The overlay ONLY appears when the browser itself reports being offline
 *   (`navigator.onLine === false`). If you have internet but a probe URL is
 *   blocked, the admin dashboard stays fully usable.
 * - The "Try Again" button re-checks `navigator.onLine` immediately.
 */
export default function NoInternetScreen({ children }) {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  const [checking, setChecking] = useState(false)
  const [visible, setVisible] = useState(offline)

  useEffect(() => {
    const handleOnline = () => {
      setOffline(false)
    }
    const handleOffline = () => {
      setOffline(true)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (offline) {
      // Defer the synchronous state update out of the effect body.
      const timer = setTimeout(() => setVisible(true), 0)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setVisible(false), 350)
    return () => clearTimeout(timer)
  }, [offline])

  const handleRetry = () => {
    if (checking) return
    setChecking(true)
    // Re-check the browser's native online status after a short delay.
    setTimeout(() => {
      setOffline(typeof navigator !== 'undefined' && navigator.onLine === false)
      setChecking(false)
    }, 500)
  }

  if (!offline || !visible) {
    return <>{children}</>
  }

  return (
    <div className="no-internet-overlay">
      <div className="no-internet-content">
        <div className="no-internet-illustration-wrap">
          <img src={logo} alt="PureDrop logo" className="no-internet-illustration" />
        </div>

        <h1 className="no-internet-title">You're offline</h1>
        <p className="no-internet-message">
          Looks like you've lost your internet connection. Please check your
          connection and try again to continue managing PureDrop.
        </p>

        <div className="no-internet-tips">
          <p className="no-internet-tip">• Check your network connection</p>
          <p className="no-internet-tip">• Contact your network administrator</p>
          <p className="no-internet-tip">• This page will auto-reconnect when online</p>
        </div>

        <button
          type="button"
          className="no-internet-retry-btn"
          onClick={handleRetry}
          disabled={checking}
        >
          {checking ? (
            <span className="no-internet-spinner" aria-hidden="true" />
          ) : (
            'Try Again'
          )}
        </button>

        <p className="no-internet-auto-note">We'll reconnect you automatically</p>
      </div>
    </div>
  )
}