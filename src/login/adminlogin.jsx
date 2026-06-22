import './adminlogin.css'
import { useState } from 'react'
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import logo from '../assets/logo.png'
import { auth, db } from '../firebase.js'

const ADMIN_EMAIL_ALLOWLIST = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || ''

function AdminLogin({ onSignInSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const normalizedInputEmail = email.trim().toLowerCase()
      if (ADMIN_EMAIL_ALLOWLIST.length > 0 && !ADMIN_EMAIL_ALLOWLIST.includes(normalizedInputEmail)) {
        setErrorMessage('Access denied. This email is not in the admin allowlist.')
        return
      }
      if (ADMIN_PASSWORD && password !== ADMIN_PASSWORD) {
        setErrorMessage('Access denied. Admin password is incorrect.')
        return
      }

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

      setSuccessMessage('Admin sign-in successful.')
      onSignInSuccess?.({
        uid: credential.user.uid,
        email: credential.user.email || normalizedInputEmail,
      })
    } catch (error) {
      if (error?.code === 'auth/invalid-credential-existing-user') {
        setErrorMessage('This admin email already exists in Firebase Auth, but the password is incorrect.')
      } else if (error?.code === 'auth/too-many-requests') {
        setErrorMessage('Too many attempts. Please wait a bit before trying again.')
      } else if (error?.code === 'auth/network-request-failed') {
        setErrorMessage('Network error while signing in. Check your internet connection.')
      } else {
        setErrorMessage(`Unable to sign in right now (${error?.code || 'unknown-error'}).`)
      }
    } finally {
      setIsSubmitting(false)
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
