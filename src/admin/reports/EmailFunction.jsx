import { isSupabaseConfigured, supabase } from '../../supabase.js'

const isValidStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'approved' || normalized === 'resolving' || normalized === 'resolved' || normalized === 'pending' || normalized === 'rejected'
}

/**
 * Sends a report status-update email via the Supabase `send-report-status-email`
 * Edge Function (Brevo transactional email) after the admin changes a report's
 * status. Best-effort and non-blocking: failures are swallowed and only logged
 * to the console so they never break or delay the status update in Firestore.
 *
 * The Edge Function reads the reporter's email from their Firestore profile
 * (`regular_user/{userId}`) and emails them through Brevo. Users without an
 * email on file are silently skipped by the Edge Function.
 */
export const fireReportStatusEmail = ({ userId, reportId, status, documentId }) => {
  const normalizedUserId = String(userId || '').trim()
  const normalizedReportId = String(reportId || '').trim() || String(documentId || '').trim()

  if (!normalizedUserId || !isValidStatus(status)) {
    return
  }

  if (!isSupabaseConfigured || !supabase) {
    console.warn('Status email skipped: Supabase is not configured in the admin dashboard.')
    return
  }

  supabase.functions
    .invoke('send-report-status-email', {
      body: {
        userId: normalizedUserId,
        reportId: normalizedReportId,
        status,
        changedByAdmin: true,
      },
    })
    .then(({ error }) => {
      if (error) {
        console.warn('Status email skipped:', error.message || error)
      }
    })
    .catch((error) => {
      console.warn('Status email skipped:', error instanceof Error ? error.message : String(error))
    })
}

export default fireReportStatusEmail

