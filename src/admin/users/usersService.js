import { deleteApp, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import { collection, deleteDoc, doc, getDocs, getFirestore, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functionsClient } from '../../firebase.js'
import { resolvePresenceStatus } from './presenceStatus.js'

const USERS_COLLECTION = 'regular_user'
const REPORTS_COLLECTION = 'reports'
const CITY_SUFFIX = ', Toledo City'
const DATE_FORMAT_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric' }
const DATE_TIME_FORMAT_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
const deleteRegularUserAccountCallable = httpsCallable(functionsClient, 'deleteRegularUserAccount')

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

  const parsed = Number(value)
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

  if (trimmed.toLowerCase().endsWith(CITY_SUFFIX.toLowerCase())) {
    return trimmed
  }

  return `${trimmed}${CITY_SUFFIX}`
}

const mapUserDoc = (docSnap) => {
  const data = docSnap.data()
  const uid = data.uid || docSnap.id
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
    name: data.fullName || 'N/A',
    email: data.email || 'N/A',
    role: displayRole,
    roleClass: roleClassName(data.role || 'user'),
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
  }
}

export const subscribeUsers = ({ onUsers, onError }) => {
  return onSnapshot(
    collection(db, USERS_COLLECTION),
    (snapshot) => {
      onUsers(snapshot.docs.map((docSnap) => mapUserDoc(docSnap)))
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

    await setDoc(doc(temporaryDb, USERS_COLLECTION, createdUser.uid), {
      uid: createdUser.uid,
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
