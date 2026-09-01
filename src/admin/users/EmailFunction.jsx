import { isSupabaseConfigured, supabase } from '../../supabase.js'

const FIELD_LABELS = {
  fullName: 'Full name',
  email: 'Email',
  address: 'Address',
  waterMeter: 'Water meter',
  status: 'Account status',
}

const EDITABLE_FIELDS = ['fullName', 'email', 'address', 'waterMeter', 'status']

/**
 * Builds a human-readable summary of the fields an admin changed while editing
 * a user account, e.g. "Full name changed; Address changed".
 */
export const buildAccountUpdateDetails = (nextForm, referenceForm) => {
  const changed = EDITABLE_FIELDS
    .filter((key) => String(nextForm?.[key] ?? '') !== String(referenceForm?.[key] ?? ''))
    .map((key) => `${FIELD_LABELS[key] || key} changed`)

  return changed.join('; ')
}

/**
 * Sends an account-update email to the user via the Supabase
 * `send-account-update-email` Edge Function (Brevo transactional email) after
 * the admin edits a user account or sets a new password. Best-effort and
 * non-blocking: failures are swallowed and only logged to the console so they
 * never break or delay the admin action.
 *
 * Supported change types: "password", "profile", "status", "custom".
 */
export const fireUserAccountEmail = ({ email, fullName, changeType = 'custom', details = '' }) => {
  const normalizedEmail = String(email || '').trim()

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return
  }

  if (!isSupabaseConfigured || !supabase) {
    console.warn('Account email skipped: Supabase is not configured in the admin dashboard.')
    return
  }

  supabase.functions
    .invoke('send-account-update-email', {
      body: {
        email: normalizedEmail,
        fullName: String(fullName || '').trim(),
        changeType,
        details: String(details || ''),
        changedByAdmin: true,
      },
    })
    .then(({ error }) => {
      if (error) {
        console.warn('Account email skipped:', error.message || error)
      }
    })
    .catch((error) => {
      console.warn('Account email skipped:', error instanceof Error ? error.message : String(error))
    })
}

export default fireUserAccountEmail
