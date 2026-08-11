import { useCallback, useEffect, useRef, useState } from 'react'
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '../../firebase.js'

// Saved login key. Using localStorage (not sessionStorage) so the admin
// session survives browser restarts and works when deployed on a web host.
const ADMIN_SESSION_KEY = 'puredrop_admin_session'
const ADMIN_EMAIL_KEY = 'puredrop_admin_remembered_email'
const ADMIN_LAST_ACTIVITY_KEY = 'puredrop_admin_last_activity'

// Auto-logout after this many minutes of inactivity (0 = never).
const SESSION_TIMEOUT_MINUTES = 30

function readSavedSession() {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSavedSession(user) {
  try {
    if (user) {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(ADMIN_SESSION_KEY)
    }
  } catch {
    // Storage may be unavailable (private mode, blocked cookies, etc.).
  }
}

function readRememberedEmail() {
  try {
    return localStorage.getItem(ADMIN_EMAIL_KEY) || ''
  } catch {
    return ''
  }
}

function writeRememberedEmail(email) {
  try {
    if (email) {
      localStorage.setItem(ADMIN_EMAIL_KEY, email)
    } else {
      localStorage.removeItem(ADMIN_EMAIL_KEY)
    }
  } catch {
    // Ignore storage errors.
  }
}

function touchLastActivity() {
  try {
    localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()))
  } catch {
    // Ignore storage errors.
  }
}

function hasSessionExpired() {
  if (SESSION_TIMEOUT_MINUTES <= 0) return false
  try {
    const last = Number(localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY) || 0)
    if (!last) return false
    return Date.now() - last > SESSION_TIMEOUT_MINUTES * 60 * 1000
  } catch {
    return false
  }
}

/**
 * useAdminSavedLogin
 *
 * Provides a persistent admin session that is "saved" on the device and
 * automatically restored on every visit via:
 *
 *  1. localStorage  – survives browser restarts (not cleared like sessionStorage).
 *  2. Firebase Auth browserLocalPersistence – keeps the Firebase auth token
 *     across browser tabs / restarts on any web host.
 *  3. onAuthStateChanged – syncs the app state with Firebase's persisted token.
 *
 * The adminLogin component may call signInWithEmailAndPassword directly
 * (which is the standard Firebase Auth flow). The onAuthStateChanged listener
 * below picks up those sign-ins automatically, so this hook does NOT need to
 * wrap signInWithEmailAndPassword itself.
 *
 * Returns:
 *   adminUser        : { uid, email } | null – the logged-in admin (or null).
 *   isRestoring      : boolean – true while the saved session is being loaded.
 *   rememberedEmail  : string – the last admin email that signed in.
 *   signOut          : () => Promise<void> – signs the admin out.
 *   clearRememberedEmail : () => void – clears the remembered email.
 */
export function useAdminSavedLogin() {
  const [adminUser, setAdminUser] = useState(() => readSavedSession())
  const [isRestoring, setIsRestoring] = useState(true)
  const [rememberedEmail, setRememberedEmail] = useState(() => readRememberedEmail())
  const activityTimerRef = useRef(null)

  const clearSession = useCallback(() => {
    setAdminUser(null)
    writeSavedSession(null)
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
    clearSession()
  }, [clearSession])

  const clearRememberedEmail = useCallback(() => {
    writeRememberedEmail('')
    setRememberedEmail('')
  }, [])

  useEffect(() => {
    let active = true

    // Force Firebase Auth to keep its session in localStorage (persists
    // across browser restarts and tabs). This is critical for a "saved login"
    // that works after the browser is closed and reopened.
    setPersistence(auth, browserLocalPersistence).catch(() => {})

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!active) return

      if (firebaseUser) {
        const sessionUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        }
        setAdminUser(sessionUser)
        writeSavedSession(sessionUser)
        if (firebaseUser.email) {
          writeRememberedEmail(firebaseUser.email)
          setRememberedEmail(firebaseUser.email)
        }
        touchLastActivity()
      } else {
        clearSession()
      }
      setIsRestoring(false)
    })

    // Multi-tab sync: if another tab signs out (or the session is cleared),
    // reflect that change here immediately.
    const handleStorage = (event) => {
      if (event.key === ADMIN_SESSION_KEY) {
        if (!event.newValue) {
          clearSession()
        } else {
          try {
            setAdminUser(JSON.parse(event.newValue))
          } catch {
            // Ignore malformed storage values.
          }
        }
      }
      if (event.key === ADMIN_EMAIL_KEY) {
        setRememberedEmail(event.newValue || '')
      }
    }
    window.addEventListener('storage', handleStorage)

    // Session expiry: if the saved session has been inactive too long,
    // sign the admin out automatically.
    if (hasSessionExpired() && readSavedSession()) {
      firebaseSignOut(auth).catch(() => {})
      clearSession()
    }

    // Track user activity so the session timeout can be enforced.
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    const handleActivity = () => touchLastActivity()
    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity))

    // Periodically check for session expiry while the app is open.
    activityTimerRef.current = window.setInterval(() => {
      if (hasSessionExpired() && readSavedSession()) {
        firebaseSignOut(auth).catch(() => {})
        clearSession()
      }
    }, 60 * 1000)

    return () => {
      active = false
      unsubscribe()
      window.removeEventListener('storage', handleStorage)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity))
      if (activityTimerRef.current) {
        window.clearInterval(activityTimerRef.current)
      }
    }
  }, [clearSession])

  return { adminUser, isRestoring, rememberedEmail, signOut, clearRememberedEmail }
}

export default useAdminSavedLogin