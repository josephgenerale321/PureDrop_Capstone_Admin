import './adminlogin.css'
import { useEffect, useState } from 'react'
import { browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, setPersistence, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import logo from '../assets/logo.png'
import { auth, db } from '../firebase.js'

const ADMIN_LOCKOUT_KEY = 'puredrop_admin_lockout'
const ADMIN_PROFILE_COLLECTION = 'admin_user'

const DEFAULT_SECURITY = {
  maxLoginAttempts: 5,
  lockoutMinutes: 10,
}

function readLockoutState() {
  try {
    const raw = localStorage.getItem(ADMIN_LOCKOUT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLockoutState(value) {
  try {
    if (value) {
      localStorage.setItem(ADMIN_LOCKOUT_KEY, JSON.stringify(value))
    } else {
      localStorage.removeItem(ADMIN_LOCKOUT_KEY)
    }
  } catch {
    // Ignore storage errors.
  }
}

const ADMIN_EMAIL_ALLOWLIST = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || ''

function AdminLogin({ rememberedEmail = '', onClearRememberedEmail }) {
  const [email, setEmail] = useState(rememberedEmail || '')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [securityConfig, setSecurityConfig] = useState(DEFAULT_SECURITY)

  useEffect(() => {
    let active = true
    const loadSecurity = async () => {
      try {
        const stored = readLockoutState()
        if (stored?.unlockedAt && Date.now() < stored.unlockedAt) {
          const minutes = Math.ceil((stored.unlockedAt - Date.now()) / 60000)
          if (active) {
            setErrorMessage(`Account temporarily locked. Try again in ${minutes} minute(s).`)
          }
        }

        // Attempt to read the saved admin's security config from Firestore.
        // Best-effort: only applies when a saved session exists (has uid).
        const saved = readSavedAdminUid()
        if (!saved) {
          if (active) setSecurityConfig(DEFAULT_SECURITY)
          return
        }
        const adminDocSnap = await getDoc(doc(db, ADMIN_PROFILE_COLLECTION, saved))
        const remote = adminDocSnap.exists() ? adminDocSnap.data()?.settings?.security : null
        if (active) {
          setSecurityConfig({
            maxLoginAttempts: remote?.maxLoginAttempts || DEFAULT_SECURITY.maxLoginAttempts,
            lockoutMinutes: remote?.lockoutMinutes || DEFAULT_SECURITY.lockoutMinutes,
          })
        }
      } catch {
        if (active) setSecurityConfig(DEFAULT_SECURITY)
      }
    }
    loadSecurity()
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const lockout = readLockoutState()
    if (lockout?.unlockedAt && Date.now() < lockout.unlockedAt) {
      const minutes = Math.ceil((lockout.unlockedAt - Date.now()) / 60000)
      setErrorMessage(`Account temporarily locked. Try again in ${minutes} minute(s).`)
      return
    }

    setIsSubmitting(true)

    try {
      const normalizedInputEmail = email.trim().toLowerCase()
      if (ADMIN_EMAIL_ALLOWLIST.length > 0 && !ADMIN_EMAIL_ALLOWLIST.includes(normalizedInputEmail)) {
        setRecordFailedAttempt()
        setErrorMessage('Access denied. This email is not in the admin allowlist.')
        return
      }
      if (ADMIN_PASSWORD && password !== ADMIN_PASSWORD) {
        setRecordFailedAttempt()
        setErrorMessage('Access denied. Admin password is incorrect.')
        return
      }

      // Apply persistence BEFORE signing in so the "saved login" behavior
      // is respected. If "remember me" is checked, the session is persisted
      // in localStorage (survives browser restarts). Otherwise the session
      // only lasts for the current tab/session.
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)

      let credential
      try {
        credential = await signInWithEmailAndPassword(auth, normalizedInputEmail, password)
      } catch (error) {
        if (error?.code !== 'auth/invalid-credential') {
          throw error
        }

        const methods = await fetchSignInMethodsForEmail(auth, normalizedInputEmail)
        if (methods.length > 0) {
          throw { code: 'auth/invalid-credential-existing-user' }
        }

        // First-time bootstrap: create the allowlisted admin account in Firebase Auth.
        credential = await createUserWithEmailAndPassword(auth, normalizedInputEmail, password)
      }

      // Ensure admin profile doc exists so Firestore admin rules can verify admin writes.
      await setDoc(
        doc(db, 'admin_user', credential.user.uid),
        {
          uid: credential.user.uid,
          email: credential.user.email || normalizedInputEmail,
          role: 'admin',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      setErrorMessage('')
      setSuccessMessage('Admin sign-in successful.')
      // The app-level onAuthStateChanged listener (in useAdminSavedLogin)
      // will detect this sign-in and auto-redirect to the dashboard.
    } catch (error) {
      if (error?.code === 'auth/invalid-credential-existing-user') {
        setRecordFailedAttempt()
        setErrorMessage('This admin email already exists in Firebase Auth, but the password is incorrect.')
      } else if (error?.code === 'auth/too-many-requests') {
        setRecordFailedAttempt()
        setErrorMessage('Too many attempts. Please wait a bit before trying again.')
      } else if (error?.code === 'auth/network-request-failed') {
        setErrorMessage('Network error while signing in. Check your internet connection.')
      } else {
        setRecordFailedAttempt()
        setErrorMessage(`Unable to sign in right now (${error?.code || 'unknown-error'}).`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const setRecordFailedAttempt = () => {
    const lockout = readLockoutState() || { attempts: 0 }
    const attempts = lockout.attempts + 1
    const maxAttempts = securityConfig.maxLoginAttempts || DEFAULT_SECURITY.maxLoginAttempts

    if (attempts >= maxAttempts) {
      const lockoutMinutes = securityConfig.lockoutMinutes || DEFAULT_SECURITY.lockoutMinutes
      const unlockedAt = Date.now() + lockoutMinutes * 60 * 1000
      writeLockoutState({ attempts, unlockedAt })
      setErrorMessage(`Too many failed attempts. Account locked for ${lockoutMinutes} minute(s).`)
    } else {
      writeLockoutState({ attempts })
    }
  }

  const readSavedAdminUid = () => {
    try {
      const raw = localStorage.getItem('puredrop_admin_session')
      return raw ? JSON.parse(raw)?.uid || null : null
    } catch {
      return null
    }
  }

  return (
    <main className="admin-login-page py-4 py-lg-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-9">
            <section className="admin-login-card p-4 p-md-5">
              <div className="row g-4 g-lg-5 align-items-center">
                <div className="col-lg-6 text-center">
                  <img src={logo} className="admin-login-logo" alt="PureDrop logo" />
                  <h1 className="admin-title mt-3 mb-2">PureDrop Admin</h1>
                  <p className="admin-subtitle mb-0">Administrator access only. Sign in to manage platform settings and operations.</p>
                </div>

                <div className="col-lg-6">
                  <form className="d-grid gap-3" onSubmit={handleSubmit}>
                    <div>
                      <label htmlFor="adminEmail" className="form-label fw-semibold">
                        Email
                      </label>
                      <input
                        id="adminEmail"
                        type="email"
                        className="form-control form-control-lg"
                        placeholder="admin@puredrop.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="username"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="adminPassword" className="form-label fw-semibold">
                        Password
                      </label>
                      <input
                        id="adminPassword"
                        type="password"
                        className="form-control form-control-lg"
                        placeholder="Enter password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                      />
                    </div>

                    <div className="form-check d-flex align-items-center gap-2">
                      <input
                        id="adminRememberMe"
                        type="checkbox"
                        className="form-check-input"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                      />
                      <label htmlFor="adminRememberMe" className="form-check-label">
                        Keep me signed in on this device
                      </label>
                    </div>

                    {rememberedEmail && (
                      <div className="d-flex align-items-center justify-content-between">
                        <small className="text-muted">Signed in before as {rememberedEmail}</small>
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0"
                          onClick={() => {
                            setEmail('')
                            onClearRememberedEmail?.()
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    <button type="submit" className="btn admin-signin-btn btn-lg mt-1" disabled={isSubmitting}>
                      {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>
                  </form>

                  {errorMessage && (
                    <p className="admin-feedback admin-feedback-error mt-3 mb-0" role="alert">
                      {errorMessage}
                    </p>
                  )}
                  {successMessage && (
                    <p className="admin-feedback admin-feedback-success mt-3 mb-0" role="status">
                      {successMessage}
                    </p>
                  )}
                  <p className="admin-note mt-3 mb-0">No registration is available. Contact your system owner for account setup.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default AdminLogin