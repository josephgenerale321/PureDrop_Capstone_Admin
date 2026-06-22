import { collectionGroup, deleteDoc, doc, getDocs, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase.js'
import { isSupabaseConfigured, supabase } from '../../supabase.js'

const REPORTS_COLLECTION = 'reports'
const REPORTS_BUCKET = 'reports'
const DATE_FORMAT_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric' }
const DATE_TIME_FORMAT_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  resolved: 'Resolved',
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

const mapReportDoc = (docSnap) => {
  const data = docSnap.data()
  const submittedAtDate = toDateValue(data.createdAt) || toDateValue(data.submittedAt)

  return {
    key: docSnap.ref.path,
    documentId: docSnap.id,
    reportId: data.reportId || docSnap.id,
    issue: data.issue || 'N/A',
    title: data.issue || data.category || 'Untitled report',
    category: data.category || 'Uncategorized',
    status: data.status || 'Pending',
    statusClass: formatStatusClass(data.status),
    dateSubmitted: formatDate(submittedAtDate),
    submittedAt: formatDateTime(submittedAtDate),
    submittedAtMs: submittedAtDate ? submittedAtDate.getTime() : 0,
    reporterName: data.reporterName || 'Unknown Reporter',
    reporterAvatarUrl: data.reporterAvatarUrl || '',
    userId: data.userId || 'N/A',
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

  return snapshot.docs.map((docSnap) => mapReportDoc(docSnap)).sort((left, right) => right.submittedAtMs - left.submittedAtMs)
}

export const subscribeToReportsRealtime = ({ onReports, onError }) => {
  return onSnapshot(
    collectionGroup(db, REPORTS_COLLECTION),
    (snapshot) => {
      const mappedReports = snapshot.docs.map((docSnap) => mapReportDoc(docSnap)).sort((left, right) => right.submittedAtMs - left.submittedAtMs)
      onReports?.(mappedReports)
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

export const updateReportStatusInFirestore = async ({ reportKey, nextStatus }) => {
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
    await updateDoc(reportRef, payloadResult.payload)

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

const removeReportAttachmentsFromSupabase = async (attachments) => {
  const attachmentUrls = Array.isArray(attachments) ? attachments.filter((item) => typeof item === 'string' && item.trim()) : []

  if (!attachmentUrls.length) {
    return { ok: true }
  }

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

  const uniquePaths = [...new Set(parsedPaths)]
  const { error } = await supabase.storage.from(REPORTS_BUCKET).remove(uniquePaths)
  if (error) {
    return {
      ok: false,
      error: 'Unable to delete report attachments from Supabase right now.',
    }
  }

  return { ok: true }
}

export const deleteReportInFirestore = async ({ reportKey, attachments }) => {
  if (!reportKey) {
    return {
      ok: false,
      error: 'Select a report first.',
    }
  }

  try {
    const attachmentsDeleteResult = await removeReportAttachmentsFromSupabase(attachments)
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
