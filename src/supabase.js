import { createClient } from '@supabase/supabase-js'

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY || '').trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Storage bucket holding the user identity-verification files (face scans and
// valid IDs) uploaded by the mobile app. The admin verification review screens
// read from this bucket, so it must match the mobile app's
// EXPO_PUBLIC_SUPABASE_VERIFICATION_BUCKET value.
export const VERIFICATION_BUCKET = String(
  import.meta.env.VITE_SUPABASE_VERIFICATION_BUCKET || 'verification_id'
).trim()

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : null
