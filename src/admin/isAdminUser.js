import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

const ADMIN_EMAIL_ALLOWLIST = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)
const ADMIN_PROFILE_COLLECTION = 'regular_user'

export async function isAdminUser(user) {
  if (!user) {
    return false
  }

  const normalizedEmail = (user.email || '').toLowerCase()
  const hasAllowlist = ADMIN_EMAIL_ALLOWLIST.length > 0
  const isAllowlisted = ADMIN_EMAIL_ALLOWLIST.includes(normalizedEmail)

  if (hasAllowlist && !isAllowlisted) {
    return false
  }

  // If allowlist is configured, treat it as the source of truth for admin access.
  if (hasAllowlist && isAllowlisted) {
    return true
  }

  const tokenResult = await user.getIdTokenResult(true)
  if (tokenResult?.claims?.admin === true || tokenResult?.claims?.role === 'admin') {
    return true
  }

  try {
    const userDoc = await getDoc(doc(db, ADMIN_PROFILE_COLLECTION, user.uid))
    if (!userDoc.exists()) {
      return true
    }

    const userData = userDoc.data()
    if (userData?.role === 'regular_user') {
      return false
    }

    return userData?.role === 'admin' || userData?.isAdmin === true
  } catch {
    return false
  }
}
