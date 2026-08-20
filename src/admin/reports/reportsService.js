import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase.js'
import { isSupabaseConfigured, supabase } from '../../supabase.js'

const USERS_COLLECTION = 'regular_user'
const REPORTS_COLLECTION = 'reports'
const REPORTS_BUCKET = 'reports'
const REPORT_ATTACHMENT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic']
const REPORT_ATTACHMENT_INDEX_LIMIT = 10
const DATE_FORMAT_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric' }
const DATE_TIME_FORMAT_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }

const STATUS_LABELS = {
  pending: 'Pending',
  resolving: 'Resolving',
  resolved: 'Resolving',
  approved: 'Approved',
  rejected: 'Rejected',
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

const formatStatusClass = (status) =>
  String(status || 'pending')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')

const formatTimeAgo = (value) => {
  const parsed = toDateValue(value)
  if (!parsed) {
    return 'Unknown time'
  }

  const diffMs = Date.now() - parsed.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes < 1) {
    return 'Just now'
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '')

const getReportUserId = (docSnap, data) => {
  const explicitUserId = normalizeString(data.userId)
  if (explicitUserId) {
    return explicitUserId
  }

  return normalizeString(docSnap.ref.parent?.parent?.id)
}

const fetchUserProfilesByIds = async (userIds) => {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))]
  const profilesById = new Map()

  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const userSnap = await getDoc(doc(db, USERS_COLLECTION, userId))
        if (!userSnap.exists()) {
          profilesById.set(userId, {})
          return
        }

        const userData = userSnap.data()
        profilesById.set(userId, {
          fullName: normalizeString(userData.fullName),
          profileImageUrl: normalizeString(userData.profileImageUrl),
        })
      } catch {
        profilesById.set(userId, {})
      }
    }),
  )

  return profilesById
}

const buildUidToDisplayIdMap = async (additionalUids = []) => {
  let uids = []

  try {
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION))
    uids = usersSnap.docs
      .map((docSnap) => docSnap.data().uid || docSnap.id)
      .filter(Boolean)
  } catch {
    // Fall through: still build the map from the report user IDs below.
  }

  const allUids = [...new Set([...uids, ...additionalUids.filter(Boolean)])]
  const sortedUids = allUids.sort((a, b) => String(a).localeCompare(String(b)))
  const map = new Map()
  sortedUids.forEach((uid, index) => {
    map.set(uid, String(index + 1))
  })
  return map
}

const mapReportDocsWithProfiles = async (docs) => {
  const reportDocs = docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      docSnap,
      data,
      userId: getReportUserId(docSnap, data),
    }
  })
  const reportUserIds = reportDocs.map((item) => item.userId)
  const profilesById = await fetchUserProfilesByIds(reportUserIds)
  const uidToDisplayId = await buildUidToDisplayIdMap(reportUserIds)

  return reportDocs
    .map(({ docSnap, data, userId }) => {
      const mapped = mapReportDoc(docSnap, data, profilesById.get(userId) || {}, userId)
      return {
        ...mapped,
        userIdRaw: userId,
        userId: uidToDisplayId.get(userId) || 'N/A',
      }
    })
    .sort((left, right) => right.submittedAtMs - left.submittedAtMs)
}

const mapReportDoc = (docSnap, data = docSnap.data(), userProfile = {}, userId = getReportUserId(docSnap, data)) => {
  const submittedAtDate = toDateValue(data.createdAt) || toDateValue(data.submittedAt)
  const reporterName = userProfile.fullName || normalizeString(data.reporterName) || 'Unknown Reporter'
  const reporterAvatarUrl = userProfile.profileImageUrl || normalizeString(data.reporterAvatarUrl)
  const status = normalizeReportStatus(data.status) || 'Pending'

  return {
    key: docSnap.ref.path,
    documentId: docSnap.id,
    reportId: data.reportId || docSnap.id,
    issue: data.issue || 'N/A',
    title: data.issue || data.category || 'Untitled report',
    category: data.category || 'Uncategorized',
    status,
    statusClass: formatStatusClass(status),
    dateSubmitted: formatDate(submittedAtDate),
    submittedAt: formatDateTime(submittedAtDate),
    submittedAtMs: submittedAtDate ? submittedAtDate.getTime() : 0,
    reporterName,
    reporterAvatarUrl,
    userId: userId || 'N/A',
    waterMeter: data.waterMeter || 'N/A',
    location: data.location || data.address || 'N/A',
    locationDetails: data.locationDetails || 'N/A',
    address: data.address || 'N/A',
    gpsLocation: data.gpsLocation || 'N/A',
    attachments: Array.isArray(data.attachments) ? data.attachments.filter((item) => typeof item === 'string' && item) : [],
    activityTimeAgo: formatTimeAgo(submittedAtDate),
  }
}

export const normalizeReportStatus = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()

  return STATUS_LABELS[normalized] || null
}

export const fetchReportsFromFirestore = async () => {
  const snapshot = await getDocs(collectionGroup(db, REPORTS_COLLECTION))

  return mapReportDocsWithProfiles(snapshot.docs)
}

export const subscribeToReportsRealtime = ({ onReports, onError }) => {
  return onSnapshot(
    collectionGroup(db, REPORTS_COLLECTION),
    async (snapshot) => {
      try {
        const mappedReports = await mapReportDocsWithProfiles(snapshot.docs)
        onReports?.(mappedReports)
      } catch (error) {
        onError?.(error)
      }
    },
    (error) => {
      onError?.(error)
    },
  )
}

export const getReportsLoadErrorMessage = (error) => {
  if (error?.code === 'permission-denied') {
    return 'Unable to load reports: permission denied by Firestore rules.'
  }

  return 'Unable to load reports right now.'
}

export const updateReportStatusInFirestore = async ({ reportKey, nextStatus, userId, reportId, documentId }) => {
  if (!reportKey) {
    return {
      ok: false,
      error: 'Select a report first.',
    }
  }

  const normalizedStatus = normalizeReportStatus(nextStatus)
  if (!normalizedStatus) {
    return {
      ok: false,
      error: 'Select a valid status.',
    }
  }

  try {
    const reportRef = doc(db, reportKey)
    await updateDoc(reportRef, {
      status: normalizedStatus,
      statusUpdatedAt: serverTimestamp(),
      statusUpdatedBy: 'admin',
      statusUpdatedByUid: auth.currentUser?.uid || null,
      updatedAt: serverTimestamp(),
    })

    // Fire-and-forget push notification through the Supabase Edge Function.
    // Push failures must never block or break the status update in Firestore.
    fireReportStatusPush({ userId, reportId, status: normalizedStatus, documentId })

    return {
      ok: true,
      normalizedStatus,
    }
  } catch (error) {
    if (error?.code === 'permission-denied') {
      return {
        ok: false,
        error: 'Unable to update status: permission denied by Firestore rules.',
      }
    }

    return {
      ok: false,
      error: 'Unable to update status right now.',
    }
  }
}

/**
 * Sends an Expo push notification via the Supabase `send-report-push` Edge
 * Function after the admin changes a report's status. Best-effort and
 * non-blocking: failures are swallowed and only logged to the console.
 */
const fireReportStatusPush = ({ userId, reportId, status, documentId }) => {
  const normalizedUserId = normalizeString(userId)
  const normalizedReportId = normalizeString(reportId) ? normalizeString(reportId) : normalizeString(documentId)

  if (!normalizedUserId || !normalizeStatusPushSafe(status)) {
    return
  }

  if (!isSupabaseConfigured || !supabase) {
    console.warn('Push skipped: Supabase is not configured in the admin dashboard.')
    return
  }

  supabase.functions
    .invoke('send-report-push', {
      body: {
        userId: normalizedUserId,
        reportId: normalizedReportId,
        status,
        changedByAdmin: true,
      },
    })
    .then(({ error }) => {
      if (error) {
        console.warn('Push notification skipped:', error.message || error)
      }
    })
    .catch((error) => {
      console.warn('Push notification skipped:', error instanceof Error ? error.message : String(error))
    })
}

const normalizeStatusPushSafe = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'approved' || normalized === 'resolving' || normalized === 'resolved' || normalized === 'pending' || normalized === 'rejected'
}

const normalizeReportTextField = (value) => String(value || '').trim()

const buildEditableReportPayload = (draft) => {
  const issue = normalizeReportTextField(draft?.issue)
  const category = normalizeReportTextField(draft?.category)
  const address = normalizeReportTextField(draft?.address)
  const locationDetails = normalizeReportTextField(draft?.locationDetails)
  const location = normalizeReportTextField(draft?.location) || [address, locationDetails].filter(Boolean).join(' ').trim()
  const gpsLocation = normalizeReportTextField(draft?.gpsLocation)
  const waterMeter = normalizeReportTextField(draft?.waterMeter)

  if (!issue || !category) {
    return {
      ok: false,
      error: 'Issue and category are required.',
    }
  }

  if (waterMeter && waterMeter.replace(/[^\d]/g, '').length > 6) {
    return {
      ok: false,
      error: 'Water meter must be at most 6 digits.',
    }
  }

  return {
    ok: true,
    payload: {
      issue,
      category,
      address,
      location,
      locationDetails,
      gpsLocation,
      waterMeter,
      updatedAt: serverTimestamp(),
    },
    updatedReport: {
      issue,
      title: issue || category || 'Untitled report',
      category,
      address: address || 'N/A',
      location: location || 'N/A',
      locationDetails: locationDetails || 'N/A',
      gpsLocation: gpsLocation || 'N/A',
      waterMeter: waterMeter || 'N/A',
    },
  }
}

export const updateReportDetailsInFirestore = async ({ reportKey, draft }) => {
  if (!reportKey) {
    return {
      ok: false,
      error: 'Select a report first.',
    }
  }

  const payloadResult = buildEditableReportPayload(draft)
  if (!payloadResult.ok) {
    return payloadResult
  }

  try {
    const reportRef = doc(db, reportKey)
    const adminUid = auth.currentUser?.uid || null
    await updateDoc(reportRef, {
      ...payloadResult.payload,
      editedBy: 'admin',
      editedByUid: adminUid,
    })

    return {
      ok: true,
      updatedReport: payloadResult.updatedReport,
    }
  } catch (error) {
    if (error?.code === 'permission-denied') {
      return {
        ok: false,
        error:
          'Unable to edit report: permission denied by Firestore rules. Admin edits require rules that allow admin update of report fields.',
      }
    }

    return {
      ok: false,
      error: 'Unable to edit report right now.',
    }
  }
}

const normalizeStoragePath = (value) => {
  const trimmed = String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')

  if (!trimmed) {
    return ''
  }

  try {
    return decodeURIComponent(trimmed)
  } catch {
    return trimmed
  }
}

const getReportAttachmentReportFolderPrefix = ({ reportId, documentId }) => {
  const normalizedReportId = normalizeStoragePath(reportId)
  const normalizedDocumentId = normalizeStoragePath(documentId)
  const id = normalizedReportId && normalizedReportId !== 'N/A' ? normalizedReportId : normalizedDocumentId
  return id && id !== 'N/A' ? id : ''
}

const getLegacyReportAttachmentFolderPrefix = ({ userId }) => {
  const normalizedUserId = normalizeStoragePath(userId)
  return normalizedUserId && normalizedUserId !== 'N/A' ? normalizedUserId : ''
}

const getLegacyReportAttachmentNamePrefix = ({ reportId, documentId }) => {
  const normalizedReportId = normalizeStoragePath(reportId)
  const normalizedDocumentId = normalizeStoragePath(documentId)
  const id = normalizedReportId && normalizedReportId !== 'N/A' ? normalizedReportId : normalizedDocumentId
  return id ? `${id}-` : ''
}

const buildReportAttachmentCandidatePaths = ({ userId, reportId, documentId }) => {
  const reportFolderPrefix = getReportAttachmentReportFolderPrefix({ reportId, documentId })
  const legacyFolderPrefix = getLegacyReportAttachmentFolderPrefix({ userId })
  const legacyNamePrefix = getLegacyReportAttachmentNamePrefix({ reportId, documentId })
  const reportFolderFallbackPaths = reportFolderPrefix
    ? Array.from({ length: REPORT_ATTACHMENT_INDEX_LIMIT }, (_, index) =>
        REPORT_ATTACHMENT_EXTENSIONS.map((extension) => `${reportFolderPrefix}/attachment-${index + 1}.${extension}`),
      ).flat()
    : []

  const legacyPaths =
    legacyFolderPrefix && legacyNamePrefix
      ? Array.from({ length: REPORT_ATTACHMENT_INDEX_LIMIT }, (_, index) =>
          REPORT_ATTACHMENT_EXTENSIONS.map((extension) => `${legacyFolderPrefix}/${legacyNamePrefix}${index}.${extension}`),
        ).flat()
      : []

  return [...reportFolderFallbackPaths, ...legacyPaths]
}

const extractReportsAttachmentPath = (attachmentUrl) => {
  const rawValue = String(attachmentUrl || '').trim()
  if (!rawValue) {
    return ''
  }

  if (!rawValue.includes('://')) {
    if (rawValue.startsWith(`${REPORTS_BUCKET}/`)) {
      return normalizeStoragePath(rawValue.slice(REPORTS_BUCKET.length + 1))
    }
    return normalizeStoragePath(rawValue)
  }

  try {
    const parsedUrl = new URL(rawValue)
    const markers = [
      `/storage/v1/object/public/${REPORTS_BUCKET}/`,
      `/storage/v1/object/sign/${REPORTS_BUCKET}/`,
      `/storage/v1/object/authenticated/${REPORTS_BUCKET}/`,
      `/storage/v1/render/image/public/${REPORTS_BUCKET}/`,
      `/storage/v1/render/image/authenticated/${REPORTS_BUCKET}/`,
      `/storage/v1/object/${REPORTS_BUCKET}/`,
    ]

    for (const marker of markers) {
      const markerIndex = parsedUrl.pathname.indexOf(marker)
      if (markerIndex >= 0) {
        return normalizeStoragePath(parsedUrl.pathname.slice(markerIndex + marker.length))
      }
    }
  } catch {
    return ''
  }

  return ''
}

const listReportAttachmentPathsFromSupabase = async ({ userId, reportId, documentId }) => {
  const reportFolderPrefix = getReportAttachmentReportFolderPrefix({ reportId, documentId })
  const legacyFolderPrefix = getLegacyReportAttachmentFolderPrefix({ userId })
  const legacyNamePrefix = getLegacyReportAttachmentNamePrefix({ reportId, documentId })

  if ((!reportFolderPrefix && (!legacyFolderPrefix || !legacyNamePrefix)) || !isSupabaseConfigured || !supabase) {
    return {
      ok: true,
      paths: [],
    }
  }

  const listFolder = async (folderPrefix) => {
    if (!folderPrefix) {
      return { data: [] }
    }

    return supabase.storage.from(REPORTS_BUCKET).list(folderPrefix, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    })
  }

  const [reportFolderResult, legacyFolderResult] = await Promise.all([
    listFolder(reportFolderPrefix),
    listFolder(legacyFolderPrefix),
  ])

  if (reportFolderResult.error || legacyFolderResult.error) {
    return {
      ok: false,
      error: 'Unable to list report attachments from Supabase storage.',
    }
  }

  const reportFolderPaths = Array.isArray(reportFolderResult.data)
    ? reportFolderResult.data
        .filter((item) => typeof item?.name === 'string')
        .map((item) => `${reportFolderPrefix}/${item.name}`)
    : []
  const legacyFolderPaths = Array.isArray(legacyFolderResult.data)
    ? legacyFolderResult.data
        .filter((item) => typeof item?.name === 'string' && item.name.startsWith(legacyNamePrefix))
        .map((item) => `${legacyFolderPrefix}/${item.name}`)
    : []

  return {
    ok: true,
    paths: [...reportFolderPaths, ...legacyFolderPaths],
  }
}

const removeReportAttachmentsFromSupabase = async ({ attachments, userId, reportId, documentId }) => {
  const attachmentUrls = Array.isArray(attachments) ? attachments.filter((item) => typeof item === 'string' && item.trim()) : []

  const parsedPaths = attachmentUrls.map((url) => extractReportsAttachmentPath(url))
  if (parsedPaths.some((path) => !path)) {
    return {
      ok: false,
      error: 'Unable to delete report attachments because one or more attachment URLs are invalid.',
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Unable to delete report attachments: missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in admin .env.',
    }
  }

  const candidatePaths = buildReportAttachmentCandidatePaths({ userId, reportId, documentId })
  const listedPathsResult = await listReportAttachmentPathsFromSupabase({ userId, reportId, documentId })
  if (!listedPathsResult.ok && !parsedPaths.length && !candidatePaths.length) {
    return listedPathsResult
  }

  const listedPaths = listedPathsResult.ok ? listedPathsResult.paths : []
  const uniquePaths = [...new Set([...parsedPaths, ...candidatePaths, ...listedPaths])]
  if (!uniquePaths.length) {
    return { ok: true }
  }

  const { error } = await supabase.storage.from(REPORTS_BUCKET).remove(uniquePaths)
  if (error) {
    return {
      ok: false,
      error: 'Unable to delete report attachments from Supabase right now.',
    }
  }

  return { ok: true }
}

export const deleteReportInFirestore = async ({ reportKey, attachments, userId, reportId, documentId }) => {
  if (!reportKey) {
    return {
      ok: false,
      error: 'Select a report first.',
    }
  }

  try {
    const attachmentsDeleteResult = await removeReportAttachmentsFromSupabase({
      attachments,
      userId,
      reportId,
      documentId,
    })
    if (!attachmentsDeleteResult.ok) {
      return attachmentsDeleteResult
    }

    await deleteDoc(doc(db, reportKey))

    return { ok: true }
  } catch (error) {
    if (error?.code === 'permission-denied') {
      return {
        ok: false,
        error:
          "Unable to delete report: permission denied by Firestore rules. Ensure your admin account has custom claim admin=true (or role='admin') or an admin_user/{uid} document with role='admin' or isAdmin=true.",
      }
    }

    return {
      ok: false,
      error: 'Unable to delete report right now.',
    }
  }
}

export const toReportStatusClass = formatStatusClass
