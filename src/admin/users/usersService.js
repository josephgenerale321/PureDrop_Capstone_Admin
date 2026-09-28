import { deleteApp, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functionsClient } from '../../firebase.js'
import { VERIFICATION_BUCKET, isSupabaseConfigured, supabase } from '../../supabase.js'
import { resolvePresenceStatus } from './presenceStatus.js'

const USERS_COLLECTION = 'regular_user'
const COUNTERS_COLLECTION = 'counters'
const SEQUENTIAL_ID_COUNTER_ID = 'regularUserSequentialId'
const REPORTS_COLLECTION = 'reports'
const SUPPORTED_SUFFIXES = [', Toledo City', ', Balamban, Cebu', ', Balamban']
const DATE_FORMAT_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric' }
const DATE_TIME_FORMAT_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
const deleteRegularUserAccountCallable = httpsCallable(functionsClient, 'deleteRegularUserAccount')

const readStoredSequentialId = (data) => {
  const value = data?.sequentialId
  return typeof value === 'number' && Number.isInteger(value) && value >= 1
    ? value
    : null
}

// Same numbering source as the mobile app (lib/regular_user/sequentialId.ts):
// - reserveSequentialUserId: bumps ONLY the counter (no user-doc touch).
//   Used at creation so the profile is born with its final ID.
// - claimSequentialUserId: self-heal for EXISTING docs only — throws when
//   the user doc does not exist, so creation can never leave stub docs.
const readCounterNext = (data) => {
  const value = data?.next
  return typeof value === 'number' && Number.isInteger(value) && value >= 1
    ? value
    : null
}

const readSeededNextId = async (firestore) => {
  const topSnap = await getDocs(
    query(
      collection(firestore, USERS_COLLECTION),
      orderBy('sequentialId', 'desc'),
      limit(1),
    ),
  )
  let highest = null
  topSnap.docs.forEach((docSnap) => {
    const stored = readStoredSequentialId(docSnap.data())
    if (stored !== null && (highest === null || stored > highest)) {
      highest = stored
    }
  })
  return (highest ?? 0) + 1
}

const reserveSequentialUserId = async (firestore) => {
  const counterRef = doc(firestore, COUNTERS_COLLECTION, SEQUENTIAL_ID_COUNTER_ID)
  const seededNext = await readSeededNextId(firestore)

  return runTransaction(firestore, async (transaction) => {
    const counterSnap = await transaction.get(counterRef)
    const next = readCounterNext(counterSnap.data()) ?? seededNext
    transaction.set(
      counterRef,
      { next: next + 1, updatedAt: serverTimestamp() },
      { merge: true },
    )
    return next
  })
}

// Shared self-heal for legacy accounts (docs created before sequential IDs
// existed): claims a permanent ID for an EXISTING user doc. Kept exported
// so the admin user list can heal rows it displays; the mobile profile
// screen calls it automatically on view.
export const claimSequentialUserId = async (firestore, uid) => {
  const userRef = doc(firestore, USERS_COLLECTION, uid)
  const counterRef = doc(firestore, COUNTERS_COLLECTION, SEQUENTIAL_ID_COUNTER_ID)
  const seededNext = await readSeededNextId(firestore)

  return runTransaction(firestore, async (transaction) => {
    // All reads happen before any writes (Firestore transaction rule).
    const userSnap = await transaction.get(userRef)
    if (!userSnap.exists()) {
      throw new Error('Cannot claim a sequential ID for a missing user document.')
    }
    const stored = readStoredSequentialId(userSnap.data())
    const counterSnap = await transaction.get(counterRef)
    const counterNext = readCounterNext(counterSnap.data())

    // A doc that already owns an ID always keeps it — the counter is only
    // fast-forwarded when it lags behind, and never moves backwards.
    // This keeps IDs 1, 2, 3... permanent even if the counter doc was
    // deleted or restored from a stale backup.
    if (stored !== null) {
      if (counterNext === null || counterNext <= stored) {
        transaction.set(
          counterRef,
          { next: stored + 1, updatedAt: serverTimestamp() },
          { merge: true },
        )
      }
      return stored
    }

    const next = counterNext !== null ? counterNext : seededNext
    transaction.set(
      counterRef,
      { next: next + 1, updatedAt: serverTimestamp() },
      { merge: true },
    )
    transaction.set(
      userRef,
      { sequentialId: next, updatedAt: serverTimestamp() },
      { merge: true },
    )

    return next
  })
}

const toDateValue = (value) => {
  if (!value) {
    return null
  }

  if (typeof value.toDate === 'function') {
    return value.toDate()
  }

  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

const formatDate = (value) => {
  const parsed = toDateValue(value)
  if (!parsed) {
    return 'N/A'
  }

  return parsed.toLocaleDateString(undefined, DATE_FORMAT_OPTIONS)
}

const formatDateTime = (value) => {
  const parsed = toDateValue(value)
  if (!parsed) {
    return 'N/A'
  }

  return parsed.toLocaleString(undefined, DATE_TIME_FORMAT_OPTIONS)
}

const formatRole = (role) => {
  if (!role) {
    return 'User'
  }
  return role
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const roleClassName = (role) => {
  return role
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
}

const toNumericWaterMeter = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const digitsOnly = String(value).replace(/[^\d]/g, '')
  if (digitsOnly.length > 6) {
    return NaN
  }

  const parsed = Number(digitsOnly)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return NaN
  }

  return parsed
}

const normalizeAddress = (value) => {
  const trimmed = String(value || '').trim()

  if (!trimmed) {
    return ''
  }

  const lower = trimmed.toLowerCase()
  for (const suffix of SUPPORTED_SUFFIXES) {
    if (lower.endsWith(suffix.toLowerCase())) {
      return trimmed
    }
  }

  return trimmed
}

const mapUserDoc = (docSnap) => {
  const data = docSnap.data()
  const uid = data.uid || docSnap.id
  const storedSequentialId = readStoredSequentialId(data)
  const displayRole = formatRole(data.role)
  const presenceUpdatedAtDate = toDateValue(data.presenceUpdatedAt)
  const lastSeenAtDate = toDateValue(data.lastSeenAt)
  const lastActiveAtDate = toDateValue(data.lastActiveAt)
  const presenceStatusRaw = data.presenceStatus || data.status
  const status = resolvePresenceStatus({
    status: presenceStatusRaw,
    presenceUpdatedAt: presenceUpdatedAtDate,
    lastSeenAt: lastSeenAtDate,
    lastActiveAt: lastActiveAtDate,
  })

  return {
    docId: docSnap.id,
    id: uid,
    uid,
    // Permanent sequential display ID (1, 2, 3...). Null when the doc has
    // none yet (legacy doc awaiting self-heal) — subscribeUsers backfills a
    // contiguous number for display only, without writing to Firestore.
    displayId: storedSequentialId !== null ? String(storedSequentialId) : null,
    name: data.fullName || 'N/A',
    email: data.email || 'N/A',
    role: displayRole,
    roleClass: roleClassName(data.role || 'user'),
    roleRaw: data.role || 'regular_user',
    status,
    presenceStatusRaw,
    dateJoined: formatDate(data.createdAt),
    address: data.address || 'N/A',
    createdAt: formatDateTime(data.createdAt),
    updatedAt: formatDateTime(data.updatedAt),
    presenceUpdatedAt: formatDateTime(data.presenceUpdatedAt),
    presenceUpdatedAtMs: presenceUpdatedAtDate ? presenceUpdatedAtDate.getTime() : 0,
    lastSeenAt: formatDateTime(data.lastSeenAt),
    lastSeenAtMs: lastSeenAtDate ? lastSeenAtDate.getTime() : 0,
    lastActiveAt: formatDateTime(data.lastActiveAt),
    lastActiveAtMs: lastActiveAtDate ? lastActiveAtDate.getTime() : 0,
    lastReportAt: formatDateTime(data.lastReportAt),
    notificationsLastSeenAt: formatDateTime(data.notificationsLastSeenAt),
    profileImageUrl: data.profileImageUrl || '',
    profileImagePath: data.profileImagePath || 'N/A',
    reportCounter: data.reportCounter ?? 0,
    waterMeter: data.waterMeter ?? 'N/A',
    emailVerified: data.emailVerified ?? false,
  }
}

export const subscribeUsers = ({ onUsers, onError }) => {
  return onSnapshot(
    collection(db, USERS_COLLECTION),
    (snapshot) => {
      const users = snapshot.docs.map((docSnap) => mapUserDoc(docSnap))
      // Order by the permanent sequentialId (1, 2, 3...). Docs without one
      // yet (legacy, awaiting self-heal) get a display-only continuation
      // number after the highest stored ID — never a UID-sorted renumber,
      // so visible numbers MATCH the mobile profile exactly.
      const storedIds = users
        .map((user) => (user.displayId !== null ? Number(user.displayId) : null))
        .filter((value) => value !== null)
      let nextFallback = storedIds.length > 0 ? Math.max(...storedIds) + 1 : 1
      const withDisplayId = users.map((user) => {
        if (user.displayId !== null) {
          return user
        }
        const fallback = { ...user, displayId: String(nextFallback) }
        nextFallback += 1
        return fallback
      })
      const sorted = [...withDisplayId].sort(
        (a, b) => Number(a.displayId) - Number(b.displayId),
      )
      onUsers(sorted)
    },
    onError,
  )
}

export const getUsersLoadErrorMessage = (error) => {
  if (error?.code === 'permission-denied') {
    return 'Unable to load users: permission denied by Firestore rules.'
  }

  return 'Unable to load users right now.'
}

export const setUserPasswordDirectly = async ({ email, newPassword }) => {
  const normalizedEmail = String(email || '').trim()
  const password = String(newPassword || '')

  if (!normalizedEmail) {
    return {
      ok: false,
      error: 'User email is missing.',
    }
  }

  if (password.length < 6) {
    return {
      ok: false,
      error: 'Password must be at least 6 characters.',
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase is not configured in the admin dashboard.',
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke('direct-password-reset', {
      body: {
        email: normalizedEmail,
        newPassword: password,
      },
    })

    if (error) {
      const message = error.message || 'Unable to set the password right now.'
      return {
        ok: false,
        error: message,
      }
    }

    if (data?.success === true) {
      return {
        ok: true,
        message: 'Password has been updated for the user.',
      }
    }

    return {
      ok: false,
      error: data?.error?.message || 'Unable to set the password right now.',
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to set the password right now.',
    }
  }
}

export const sendPasswordResetEmailToUser = async (email) => {
  const normalizedEmail = String(email || '').trim()
  if (!normalizedEmail) {
    return {
      ok: false,
      error: 'User email is missing.',
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase is not configured in the admin dashboard.',
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-password-reset-otp', {
      body: {
        action: 'send',
        email: normalizedEmail,
      },
    })

    if (error) {
      const message = error.message || 'Unable to send password reset email right now.'
      return {
        ok: false,
        error: message,
      }
    }

    if (data?.sent === true) {
      return {
        ok: true,
        message: 'A password reset code has been sent to the user\'s email.',
        codeDelivery: 'otp',
      }
    }

    return {
      ok: false,
      error: data?.error?.message || 'Unable to send password reset email right now.',
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to send password reset email right now.',
    }
  }
}

export const verifyEmailOtpCode = async ({ email, code }) => {
  const normalizedEmail = String(email || '').trim()
  const normalizedCode = String(code || '').replace(/\D/g, '').slice(0, 6)

  if (!normalizedEmail) {
    return {
      ok: false,
      error: 'User email is missing.',
    }
  }

  if (normalizedCode.length !== 6) {
    return {
      ok: false,
      error: 'A valid 6-digit code is required.',
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase is not configured in the admin dashboard.',
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke('email-verification-otp', {
      body: {
        action: 'verify',
        email: normalizedEmail,
        code: normalizedCode,
      },
    })

    if (error) {
      const message = error.message || 'Unable to verify the email right now.'
      return {
        ok: false,
        error: message,
      }
    }

    if (data?.verified === true) {
      return {
        ok: true,
        message: 'Email verified successfully.',
      }
    }

    return {
      ok: false,
      error: data?.error?.message || 'Unable to verify the email right now.',
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to verify the email right now.',
    }
  }
}

export const markUserEmailVerifiedInFirestore = async ({ id, users }) => {
  if (!id) {
    return {
      ok: false,
      error: 'Select a user first.',
    }
  }

  const targetUser = users.find((user) => user.id === id)
  const targetDocId = targetUser?.docId || id

  try {
    await updateDoc(doc(db, USERS_COLLECTION, targetDocId), {
      emailVerified: true,
      updatedAt: serverTimestamp(),
    })

    return {
      ok: true,
    }
  } catch (error) {
    if (error?.code === 'permission-denied') {
      return {
        ok: false,
        error: 'Unable to update email verification: permission denied by Firestore rules.',
      }
    }

    return {
      ok: false,
      error: 'Unable to update email verification right now.',
    }
  }
}

export const sendEmailVerificationLinkToUser = async (email) => {
  const normalizedEmail = String(email || '').trim()
  if (!normalizedEmail) {
    return {
      ok: false,
      error: 'User email is missing.',
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase is not configured in the admin dashboard.',
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke('email-verification-otp', {
      body: {
        action: 'send',
        email: normalizedEmail,
      },
    })

    if (error) {
      const message = error.message || 'Unable to send verification email right now.'
      return {
        ok: false,
        error: message,
      }
    }

    if (data?.sent === true) {
      return {
        ok: true,
        message: 'A verification code has been sent to the user\'s email.',
        codeDelivery: 'otp',
      }
    }

    return {
      ok: false,
      error: data?.error?.message || 'Unable to send verification email right now.',
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to send verification email right now.',
    }
  }
}

export const updateUserStatusInFirestore = async ({ id, status, users }) => {
  if (!id) {
    return {
      ok: false,
      error: 'Select a user first.',
    }
  }

  const targetUser = users.find((user) => user.id === id)
  const targetDocId = targetUser?.docId || id

  try {
    await updateDoc(doc(db, USERS_COLLECTION, targetDocId), {
      status,
      presenceStatus: status,
      updatedAt: serverTimestamp(),
    })

    return {
      ok: true,
    }
  } catch (error) {
    if (error?.code === 'permission-denied') {
      return {
        ok: false,
        error: 'Unable to update user status: permission denied by Firestore rules.',
      }
    }

    return {
      ok: false,
      error: 'Unable to update user status right now.',
    }
  }
}

export const updateUserAccountInFirestore = async ({ id, updates, users }) => {
  if (!id) {
    return {
      ok: false,
      error: 'Select a user first.',
    }
  }

  const fullName = String(updates?.fullName || '').trim()
  const email = String(updates?.email || '').trim()
  const address = String(updates?.address || '').trim()
  const waterMeter = toNumericWaterMeter(String(updates?.waterMeter ?? '').trim())

  if (!fullName || !email || !address) {
    return {
      ok: false,
      error: 'Full name, email, and address are required.',
    }
  }

  if (Number.isNaN(waterMeter)) {
    return {
      ok: false,
      error: 'Water meter must be a valid non-negative number.',
    }
  }

  const targetUser = users.find((user) => user.id === id)
  const targetDocId = targetUser?.docId || id

  try {
    await updateDoc(doc(db, USERS_COLLECTION, targetDocId), {
      fullName,
      email,
      address,
      waterMeter,
      updatedAt: serverTimestamp(),
    })

    return {
      ok: true,
      updatedUser: {
        name: fullName,
        email,
        address,
        waterMeter: waterMeter ?? 'N/A',
        updatedAt: formatDateTime(new Date()),
      },
    }
  } catch (error) {
    if (error?.code === 'permission-denied') {
      return {
        ok: false,
        error: 'Unable to update user: permission denied by Firestore rules.',
      }
    }

    return {
      ok: false,
      error: 'Unable to update user right now.',
    }
  }
}

export const createUserAccountInFirestore = async (payload) => {
  const fullName = String(payload?.fullName || '').trim()
  const email = String(payload?.email || '')
    .trim()
    .toLowerCase()
  const password = String(payload?.password || '')
  const confirmPassword = String(payload?.confirmPassword || '')
  const address = normalizeAddress(payload?.address)
  const waterMeter = toNumericWaterMeter(String(payload?.waterMeter ?? '').trim())

  if (!fullName || !email || !address || !password || !confirmPassword) {
    return {
      ok: false,
      error: 'Full name, email, password, confirm password, and address are required.',
    }
  }

  if (password !== confirmPassword) {
    return {
      ok: false,
      error: 'Password and confirm password do not match.',
    }
  }

  if (password.length < 6) {
    return {
      ok: false,
      error: 'Password must be at least 6 characters.',
    }
  }

  if (Number.isNaN(waterMeter)) {
    return {
      ok: false,
      error: 'Water meter must be a valid non-negative number.',
    }
  }

  const temporaryAppName = `admin-user-creation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  let temporaryApp = null
  let createdUser = null

  try {
    temporaryApp = initializeApp(auth.app.options, temporaryAppName)
    const temporaryAuth = getAuth(temporaryApp)
    const temporaryDb = getFirestore(temporaryApp)

    const credential = await createUserWithEmailAndPassword(temporaryAuth, email, password)
    createdUser = credential.user
    await createdUser.getIdToken()

    // Reserve this user's sequential display ID (1, 2, 3...) BEFORE creating
    // the profile, so the doc is born with its final ID — the same numbering
    // source the mobile app uses at self signup.
    const sequentialId = await reserveSequentialUserId(temporaryDb)

    await setDoc(doc(temporaryDb, USERS_COLLECTION, createdUser.uid), {
      uid: createdUser.uid,
      sequentialId,
      fullName,
      address,
      email,
      role: 'regular_user',
      status: 'Inactive',
      presenceStatus: 'Inactive',
      presenceSource: 'admin_created',
      presenceUpdatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      lastActiveAt: null,
      lastReportAt: null,
      notificationsLastSeenAt: null,
      profileImagePath: '',
      profileImageUrl: '',
      reportCounter: 0,
      waterMeter,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      ok: true,
      uid: createdUser.uid,
    }
  } catch (error) {
    if (createdUser) {
      try {
        await createdUser.delete()
      } catch {
        // Keep the original error because account cleanup can fail for separate reasons.
      }
    }

    if (error?.code === 'auth/email-already-in-use') {
      return {
        ok: false,
        error: 'This email is already registered.',
      }
    }

    if (error?.code === 'auth/invalid-email') {
      return {
        ok: false,
        error: 'Please enter a valid email address.',
      }
    }

    if (error?.code === 'auth/weak-password') {
      return {
        ok: false,
        error: 'Password is too weak. Use at least 6 characters.',
      }
    }

    if (error?.code === 'permission-denied') {
      return {
        ok: false,
        error:
          "Unable to create user profile: permission denied by Firestore rules. Ensure regular_user/{uid} create is allowed for the newly authenticated owner.",
      }
    }

    return {
      ok: false,
      error: 'Unable to create user right now.',
    }
  } finally {
    if (temporaryApp) {
      try {
        await deleteApp(temporaryApp)
      } catch {
        // Ignore cleanup failures for temporary app instance.
      }
    }
  }
}

// Identity-verification attachments (face selfie + Valid ID photos) live in the
// public Supabase `verification_id` bucket, NOT in Firestore. The mobile app
// writes them under `verification/{userId}/` using the Firebase Auth uid
// (components/verification/faceselfie_comp/backend/verificationUpload.ts and
// components/verification/validid/backend/validIdBackend.ts):
//
//   verification/{uid}/selfie.jpg
//   verification/{uid}/valid-id-front.jpg
//   verification/{uid}/valid-id-back.jpg
//   verification/{uid}/valid-id-passport.jpg
//
// Deleting the Firestore documents alone therefore orphans a face photo and an
// ID copy of a deleted person's biometric data in a PUBLIC bucket — and leaves a
// working URL that still resolves. These must be removed too.
//
// The folder is keyed by the AUTH UID, but the admin table is keyed by the
// sequential public id, so both are collected and the union is removed. Anything
// already gone is not an error: `remove()` is idempotent for missing objects.
const VERIFICATION_FOLDER_ROOT = 'verification'
const VERIFICATION_PHOTO_FILENAMES = [
  'selfie.jpg',
  'valid-id-front.jpg',
  'valid-id-back.jpg',
  'valid-id-passport.jpg',
]

const normalizeStoragePath = (value) => String(value || '').trim().replace(/^\/+|\/+$/g, '')

const listVerificationPhotoPaths = async (folder) => {
  const { data, error } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .list(folder, { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } })
  if (error) {
    throw error
  }
  return (data || [])
    .filter((item) => item && item.id !== null)
    // Only ever delete files this feature is known to write. Guards against
    // sweeping up an unrelated object that happens to share the folder.
    .filter((item) => VERIFICATION_PHOTO_FILENAMES.includes(item.name))
    .map((item) => `${folder}/${item.name}`)
}

// Collects the uid-keyed folder prefixes to sweep for one deleted account. The
// `uid` field of the user document is authoritative when present; the sequential
// public id and the document id are added as fallbacks so accounts created
// before the storage path was keyed by uid are still reachable.
const collectVerificationFolderKeys = ({ id, targetUser, docData }) => {
  const keys = new Set()
  const add = (value) => {
    const normalized = normalizeStoragePath(value)
    if (normalized) {
      keys.add(normalized)
    }
  }

  // The Auth uid recorded on the document is the folder key the mobile app used.
  add(docData?.uid)
  add(targetUser?.uid)
  // Legacy fallbacks: accounts whose folder predates the uid layout, or whose
  // document is keyed by the sequential public id.
  add(targetUser?.id)
  add(id)
  add(targetUser?.docId)

  return [...keys]
}

// Reads the authoritative Firestore document for the account about to be
// deleted. The in-memory `users` rows come from mapUserDoc(), which does NOT
// carry faceScanPath / validId*Path, so the recorded storage paths have to be
// read straight from Firestore. Resolves to the first document that exists,
// searching the same candidates as deleteUserFirestoreData.
const readUserDocForCleanup = async ({ id, targetUser }) => {
  const docIds = []
  const addDocId = (value) => {
    if (typeof value === 'string' && value.trim() && !docIds.includes(value.trim())) {
      docIds.push(value.trim())
    }
  }

  addDocId(targetUser?.docId)
  addDocId(id)
  addDocId(targetUser?.uid)

  for (const docId of docIds) {
    try {
      const userDocSnap = await getDoc(doc(db, USERS_COLLECTION, docId))
      if (userDocSnap.exists()) {
        return { docId, data: userDocSnap.data() || {} }
      }
    } catch {
      // Fall through to the next candidate; storage cleanup is best-effort.
    }
  }

  return null
}

const removeVerificationAttachmentsFromSupabase = async ({ id, targetUser, userDoc }) => {
  if (!isSupabaseConfigured || !supabase) {
    // Not a blocker: the profile, reports and Firebase login are still deleted.
    return { ok: true, removed: 0, warning: 'Supabase is not configured, so identity-verification photos (face selfie / Valid ID) were NOT deleted from storage.' }
  }

  const docData = userDoc?.data || {}

  const folderKeys = collectVerificationFolderKeys({
    id,
    targetUser,
    docData,
  })
  if (!folderKeys.length) {
    return { ok: true, removed: 0 }
  }

  // Paths recorded on the document win: they are the exact objects uploaded for
  // this account, and they catch any upload written before the uid folder layout.
  const recordedPaths = [
    docData.faceScanPath,
    docData.validIdFrontPath,
    docData.validIdBackPath,
  ]
    .map(normalizeStoragePath)
    .filter((path) => path && path.startsWith(`${VERIFICATION_FOLDER_ROOT}/`))

  const listedPaths = []
  for (const folder of folderKeys) {
    const prefix = `${VERIFICATION_FOLDER_ROOT}/${folder}`
    try {
      listedPaths.push(...(await listVerificationPhotoPaths(prefix)))
    } catch {
      // Listing is a best-effort sweep for orphans; the recorded paths above
      // still guarantee the known attachments are removed.
    }
  }

  const uniquePaths = [...new Set([...recordedPaths, ...listedPaths])]
  if (!uniquePaths.length) {
    return { ok: true, removed: 0 }
  }

  const { error } = await supabase.storage.from(VERIFICATION_BUCKET).remove(uniquePaths)
  if (error) {
    return {
      ok: false,
      error: 'Unable to delete the identity-verification photos (face selfie / Valid ID) from Supabase storage. The user documents were not deleted — please try again.',
    }
  }

  return { ok: true, removed: uniquePaths.length }
}

const deleteUserFirestoreData = async ({ id, users }) => {
  const targetUser = users.find((user) => user.id === id)
  const userDocRefsById = new Map()

  if (targetUser?.docId) {
    userDocRefsById.set(targetUser.docId, doc(db, USERS_COLLECTION, targetUser.docId))
  }

  userDocRefsById.set(id, doc(db, USERS_COLLECTION, id))

  const matchingUidDocsSnap = await getDocs(
    query(collection(db, USERS_COLLECTION), where('uid', '==', id)),
  )

  matchingUidDocsSnap.docs.forEach((userDocSnap) => {
    userDocRefsById.set(userDocSnap.id, userDocSnap.ref)
  })

  await Promise.all(
    [...userDocRefsById.entries()].map(async ([docId, userDocRef]) => {
      const reportsSnapshot = await getDocs(collection(db, USERS_COLLECTION, docId, REPORTS_COLLECTION))
      await Promise.all(reportsSnapshot.docs.map((reportDocSnap) => deleteDoc(reportDocSnap.ref)))
      await deleteDoc(userDocRef)
    }),
  )

  const topLevelReportsSnap = await getDocs(
    query(collection(db, REPORTS_COLLECTION), where('userId', '==', id)),
  )
  await Promise.all(topLevelReportsSnap.docs.map((reportDocSnap) => deleteDoc(reportDocSnap.ref)))
}

export const deleteUserAccountInFirestore = async ({ id, users }) => {
  if (!id) {
    return {
      ok: false,
      error: 'Select a user first.',
    }
  }

  if (auth.currentUser?.uid === id) {
    return {
      ok: false,
      error: 'Admin accounts cannot delete themselves.',
    }
  }

  const targetUser = users.find((user) => user.id === id)

  // Delete the identity-verification photos FIRST. The Firestore document is the
  // only record of where they live, so once it is gone a retry can no longer find
  // the objects — and a public-bucket face photo + ID copy of a deleted person
  // would survive with a still-working URL. If this step fails we abort before
  // touching Firestore, so the account stays intact and the admin can retry.
  const userDocForCleanup = await readUserDocForCleanup({ id, targetUser })
  const attachmentsResult = await removeVerificationAttachmentsFromSupabase({
    id,
    targetUser,
    userDoc: userDocForCleanup,
  })

  if (!attachmentsResult.ok) {
    return {
      ok: false,
      error: attachmentsResult.error,
    }
  }

  try {
    await deleteUserFirestoreData({ id, users })
  } catch (error) {
    if (error?.code === 'permission-denied') {
      return {
        ok: false,
        error:
          "Unable to delete user: permission denied by Firestore rules. Ensure your admin account has custom claim admin=true (or role='admin') or an admin_user/{uid} document with role='admin' or isAdmin=true.",
      }
    }

    return {
      ok: false,
      error: 'Unable to delete user right now.',
    }
  }

  try {
    await deleteRegularUserAccountCallable({ uid: id })

    // Report the storage outcome honestly rather than claiming a clean delete
    // when the biometric photos were left behind (e.g. Supabase env missing).
    if (attachmentsResult.warning) {
      return {
        ok: true,
        message: attachmentsResult.warning,
      }
    }

    if (attachmentsResult.removed > 0) {
      return {
        ok: true,
        message: `User account, Firebase login and ${attachmentsResult.removed} verification photo${attachmentsResult.removed === 1 ? '' : 's'} deleted successfully.`,
      }
    }

    return {
      ok: true,
      message: 'User account and Firebase login deleted successfully.',
    }
  } catch (error) {
    if (
      error?.code === 'functions/not-found' ||
      error?.code === 'functions/unavailable' ||
      error?.code === 'functions/internal' ||
      error?.code === 'functions/unimplemented' ||
      error?.code === 'functions/resource-exhausted'
    ) {
      return {
        ok: true,
        message:
          'User documents were deleted. The Firebase Authentication email was not removed because backend auth deletion is not available on the current project setup.',
      }
    }

    if (error?.code === 'functions/permission-denied') {
      return {
        ok: true,
        message:
          'User documents were deleted, but the Firebase Authentication email could not be removed because the admin delete function is not authorized yet.',
      }
    }

    if (error?.code === 'functions/failed-precondition') {
      return {
        ok: true,
        message: 'User documents were deleted. Firebase Authentication deletion was skipped for this account.',
      }
    }

    return {
      ok: true,
      message:
        'User documents were deleted, but the Firebase Authentication email could not be removed right now.',
    }
  }
}
