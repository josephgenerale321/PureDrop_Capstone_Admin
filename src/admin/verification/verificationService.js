import { collection, doc, getDoc, increment, onSnapshot, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'

// REAL Firestore-backed verification service.
//
// Source of truth: the `regular_user` collection. The mobile app's submission
// backends write these fields onto the user's document when they complete the
// identity verification flow (face selfie + valid ID):
//
//   verificationStatus    'awaiting_id' -> 'pending' -> 'verified' / 'rejected'
//   faceScanUrl / faceScanPath            - enrollment selfie (Supabase Storage)
//   livenessPassed                        - on-device liveness gate result
//   validIdType                           - chosen ID type label
//   validIdFrontUrl / validIdFrontPath    - ID front (or passport data page)
//   validIdBackUrl  / validIdBackPath     - ID back (absent for passports)
//   faceScanSubmittedAt / validIdSubmittedAt - server timestamps
//   verifiedAt / rejectionReason          - set by the admin decisions below
//   verificationRejectionCount            - bumped on every rejection (the
//                                           mobile app shows a final-warning
//                                           notice at 3 rejections)
//   rejectedNoticeSeenCount               - mobile-side: rejection count the
//                                           user last acknowledged, so the
//                                           rejection notice shows once per
//                                           rejection

const USERS_COLLECTION = 'regular_user'
const DATE_TIME_FORMAT_OPTIONS = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}

// Statuses the mobile app can put on a user document. Documents without any
// of these (and without any submission payload) are not part of the
// verification flow and are skipped.
const VERIFICATION_STATUSES = new Set(['awaiting_id', 'pending', 'verified', 'rejected'])

// Audit-trail cap: the user document keeps at most this many decision entries
// so repeated re-submissions cannot grow the document unbounded.
const VERIFICATION_HISTORY_LIMIT = 20

const DAY_MS = 24 * 60 * 60 * 1000

// Review-priority ordering: actionable requests first, then awaiting-ID
// accounts, then decided ones. Within a status, most recent submission first.
const STATUS_SORT_PRIORITY = {
  pending: 0,
  awaiting_id: 1,
  verified: 2,
  rejected: 3,
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

const formatTimestamp = (value) => {
  const parsed = toDateValue(value)
  if (!parsed) {
    return null
  }

  return parsed.toLocaleString(undefined, DATE_TIME_FORMAT_OPTIONS)
}

const nonEmptyString = (value) => {
  return typeof value === 'string' && value.length > 0 ? value : null
}

// Normalizes one decision-audit entry written by decideVerificationInFirestore.
const mapHistoryEntry = (entry) => {
  const atDate = toDateValue(entry?.at)
  return {
    action: entry?.action === 'approved' ? 'approved' : 'rejected',
    reason: nonEmptyString(entry?.reason),
    adminEmail: nonEmptyString(entry?.adminEmail) || 'Unknown admin',
    at: atDate ? formatTimestamp(atDate) : 'N/A',
    atMs: atDate ? atDate.getTime() : 0,
  }
}

const mapVerificationDoc = (docSnap) => {
  const data = docSnap.data()
  const uid = data.uid || docSnap.id
  const faceScanDate = toDateValue(data.faceScanSubmittedAt)
  const validIdDate = toDateValue(data.validIdSubmittedAt)
  // Most relevant timestamp for sorting: the valid ID submission when present,
  // otherwise the face-scan enrollment.
  const sortTimestampMs = (validIdDate || faceScanDate)?.getTime() || 0
  // Liveness is only meaningful once a face scan exists. A user who has not
  // uploaded a face scan yet gets `null` (rendered as a neutral "Not
  // submitted" badge) — never a misleading "Failed".
  const hasFaceScanSubmission =
    nonEmptyString(data.faceScanUrl) !== null ||
    nonEmptyString(data.faceScanPath) !== null ||
    faceScanDate !== null

  return {
    key: uid,
    uid,
    docId: docSnap.id,
    fullName: data.fullName || 'N/A',
    email: data.email || 'N/A',
    idType: nonEmptyString(data.validIdType),
    livenessPassed: hasFaceScanSubmission ? data.livenessPassed === true : null,
    enrolledAt: formatTimestamp(data.faceScanSubmittedAt) || 'N/A',
    submittedAt: formatTimestamp(data.validIdSubmittedAt),
    verificationStatus: VERIFICATION_STATUSES.has(data.verificationStatus)
      ? data.verificationStatus
      : 'awaiting_id',
    images: {
      front: nonEmptyString(data.validIdFrontUrl),
      back: nonEmptyString(data.validIdBackUrl),
      enrollmentSelfie: nonEmptyString(data.faceScanUrl),
      // The mobile flow captures a single verification selfie; there is no
      // separate login selfie payload today.
      loginSelfie: null,
    },
    rejectionReason: nonEmptyString(data.rejectionReason),
    rejectionCount: Number(data.verificationRejectionCount) || 0,
    // Decision audit trail (newest first) — written by the admin approve /
    // reject actions below. Older documents may not have it yet.
    history: (Array.isArray(data.verificationHistory) ? data.verificationHistory : [])
      .map(mapHistoryEntry)
      .sort((a, b) => b.atMs - a.atMs),
    // Whole days the current request has been sitting since the latest
    // submission — surfaced as a "Xd" aging chip on pending rows.
    waitingDays: sortTimestampMs ? Math.max(0, Math.floor((Date.now() - sortTimestampMs) / DAY_MS)) : 0,
    sortTimestampMs,
  }
}

const shouldIncludeVerificationDoc = (data) => {
  return (
    VERIFICATION_STATUSES.has(data.verificationStatus) ||
    nonEmptyString(data.faceScanUrl) !== null ||
    nonEmptyString(data.validIdFrontUrl) !== null
  )
}

/**
 * Live Firestore subscription over every verification request. Fires whenever
 * any user document changes, so admin decisions update the table without a
 * manual refresh.
 */
export const subscribeVerifications = ({ onVerifications, onError }) => {
  return onSnapshot(
    collection(db, USERS_COLLECTION),
    (snapshot) => {
      const verifications = snapshot.docs
        .filter((docSnap) => shouldIncludeVerificationDoc(docSnap.data()))
        .map((docSnap) => mapVerificationDoc(docSnap))

      const sorted = [...verifications].sort((a, b) => {
        const priorityA = STATUS_SORT_PRIORITY[a.verificationStatus] ?? 99
        const priorityB = STATUS_SORT_PRIORITY[b.verificationStatus] ?? 99
        if (priorityA !== priorityB) {
          return priorityA - priorityB
        }
        return b.sortTimestampMs - a.sortTimestampMs
      })

      onVerifications(sorted)
    },
    onError,
  )
}

export const getVerificationsLoadErrorMessage = (error) => {
  if (error?.code === 'permission-denied') {
    return 'Unable to load verification requests: permission denied by Firestore rules.'
  }

  return 'Unable to load verification requests right now.'
}

/**
 * Applies an admin decision (approve / reject) to a verification request.
 *
 * - approve: verificationStatus -> 'verified', verifiedAt stamped, any
 *   previous rejection reason cleared, and the rejection counters reset so a
 *   future rejection starts counting from 1 again.
 * - reject:  verificationStatus -> 'rejected', rejectionReason stored (the
 *   mobile app can surface it to the user), verifiedAt cleared, and
 *   verificationRejectionCount incremented. The mobile app shows its
 *   rejection notice again for the new count (final-warning text at 3+).
 *
 * Every decision also appends an entry to the document's `verificationHistory`
 * audit trail ({ action, reason, adminEmail, at }), capped to the most recent
 * VERIFICATION_HISTORY_LIMIT entries, so reviewers can see who decided what
 * and when — including previous rejection reasons.
 *
 * The live subscription updates the table automatically — no local state
 * mutation needed.
 */
export const decideVerificationInFirestore = async ({ uid, decision, rejectionReason = '', actor = null }) => {
  if (!uid) {
    return {
      ok: false,
      error: 'Verification request is missing.',
    }
  }

  if (decision !== 'approve' && decision !== 'reject') {
    return {
      ok: false,
      error: 'Unknown verification decision.',
    }
  }

  const trimmedReason = String(rejectionReason || '').trim()
  if (decision === 'reject' && !trimmedReason) {
    return {
      ok: false,
      error: 'A rejection reason is required.',
    }
  }

  // Audit entry for this decision. Uses a client-side Timestamp because
  // serverTimestamp() sentinels cannot be nested inside array elements; the
  // document-level updatedAt / verifiedAt fields remain server-stamped.
  const historyEntry = {
    action: decision === 'approve' ? 'approved' : 'rejected',
    reason: decision === 'reject' ? trimmedReason : '',
    adminEmail: nonEmptyString(actor?.email) || 'unknown-admin',
    at: Timestamp.fromDate(new Date()),
  }

  const updates =
    decision === 'approve'
      ? {
          verificationStatus: 'verified',
          verifiedAt: serverTimestamp(),
          rejectionReason: null,
          // Clean slate: a newly approved account starts counting
          // rejections from zero again.
          verificationRejectionCount: 0,
          rejectedNoticeSeenCount: 0,
          updatedAt: serverTimestamp(),
        }
      : {
          verificationStatus: 'rejected',
          rejectionReason: trimmedReason,
          verifiedAt: null,
          // Bump the rejection counter — the mobile app compares this
          // against rejectedNoticeSeenCount to decide whether the
          // rejection notice screen should pop up once more (with the
          // final-warning text once this reaches 3).
          verificationRejectionCount: increment(1),
          updatedAt: serverTimestamp(),
        }

  try {
    const docRef = doc(db, USERS_COLLECTION, uid)

    // Cap the audit trail to the most recent entries before writing.
    const snapshot = await getDoc(docRef)
    const existingHistory = Array.isArray(snapshot.data()?.verificationHistory)
      ? snapshot.data().verificationHistory
      : []
    const verificationHistory = [...existingHistory, historyEntry].slice(-VERIFICATION_HISTORY_LIMIT)

    await updateDoc(docRef, { ...updates, verificationHistory })

    return {
      ok: true,
      message:
        decision === 'approve'
          ? 'Account approved — the user is now verified.'
          : 'Account rejected — the user will be asked to resubmit.',
    }
  } catch (error) {
    if (error?.code === 'permission-denied') {
      return {
        ok: false,
        error: 'Unable to update verification: permission denied by Firestore rules.',
      }
    }

    return {
      ok: false,
      error: 'Unable to update verification right now.',
    }
  }
}

