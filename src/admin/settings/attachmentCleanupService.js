import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { isSupabaseConfigured, supabase } from '../../supabase.js'

const USERS_COLLECTION = 'regular_user'
const CLEANUP_BUCKET = 'regular_user'
const AVATAR_FOLDER = 'users'
const PAGE_SIZE = 1000

const normalizePath = (value) => String(value || '').trim().replace(/^\/+|\/+$/g, '')

const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|heic|heif|gif|bmp|avif)$/i
const IGNORED_FILENAMES = new Set(['.emptyFolderPlaceholder'])

/**
 * Returns true when the path looks like a user profile image (has a known
 * image extension and is not a Supabase system marker file).
 */
const isProfileImagePath = (value) => {
  const normalized = normalizePath(value)
  if (!normalized) {
    return false
  }
  const filename = normalized.split('/').pop() || ''
  if (IGNORED_FILENAMES.has(filename)) {
    return false
  }
  return IMAGE_EXTENSION_PATTERN.test(filename)
}

/**
 * Builds the public URL for a file in the cleanup bucket so the admin UI can
 * render a thumbnail preview of each orphaned attachment.
 */
const buildPublicUrl = (path) => {
  if (!isSupabaseConfigured || !supabase) {
    return ''
  }
  const normalized = normalizePath(path)
  if (!normalized) {
    return ''
  }
  const { data } = supabase.storage.from(CLEANUP_BUCKET).getPublicUrl(normalized)
  return data?.publicUrl || ''
}

/**
 * Lists every object (file) under the given folder in the bucket, paginating
 * until all pages are fetched. Mirrors the logic used by the CLI cleanup
 * script (PureDrop_Capstone-main/scripts/cleanup_old_avatars.mjs).
 */
const listObjectsInFolder = async ({ bucket = CLEANUP_BUCKET, prefix = AVATAR_FOLDER } = {}) => {
  const allObjects = []
  let from = 0

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, {
        limit: PAGE_SIZE,
        offset: from,
        sortBy: { column: 'name', order: 'asc' },
      })

    if (error) {
      throw error
    }

    allObjects.push(...(data || []))

    if (!data || data.length < PAGE_SIZE) {
      break
    }
    from += PAGE_SIZE
  }

  return allObjects
}

/**
 * Recursively walks the avatar folder, returning every file with its full
 * path (e.g. `users/{uid}/profile-image-123.jpg`).
 */
const listAllAvatarFiles = async (bucket = CLEANUP_BUCKET) => {
  const files = []
  const topLevel = await listObjectsInFolder({ bucket, prefix: AVATAR_FOLDER })

  for (const item of topLevel) {
    if (item.id === null) {
      // Nested user folder: list its contents.
      const subPrefix = `${AVATAR_FOLDER}/${item.name}`
      const subItems = await listObjectsInFolder({ bucket, prefix: subPrefix })
      subItems.forEach((sub) => {
        if (sub.id !== null) {
          files.push(`${subPrefix}/${sub.name}`)
        }
      })
    } else {
      // Direct file at the top level (unlikely but safe).
      files.push(`${AVATAR_FOLDER}/${item.name}`)
    }
  }

  return files
}

/**
 * Reads every regular_user document and collects the set of profile image
 * paths that are currently referenced as the active profile picture.
 */
const getReferencedPaths = async () => {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION))
  const referenced = new Set()

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() || {}
    const path = normalizePath(data.profileImagePath)
    if (path) {
      referenced.add(path)
    }
  })

  return referenced
}

/**
 * Scans the bucket for profile attachments that are NOT referenced by any
 * user's profileImagePath. Returns the list of orphaned file paths.
 */
export const scanUnusedAttachments = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase is not configured in the admin dashboard.',
    }
  }

  try {
    const [allFiles, referencedPaths] = await Promise.all([
      listAllAvatarFiles(),
      getReferencedPaths(),
    ])

    const orphaned = []
    const seen = new Set()

    allFiles.forEach((fullPath) => {
      const normalized = normalizePath(fullPath)
      if (!isProfileImagePath(normalized)) {
        return
      }
      if (referencedPaths.has(normalized) || seen.has(normalized)) {
        return
      }
      seen.add(normalized)
      orphaned.push({
        path: normalized,
        url: buildPublicUrl(normalized),
      })
    })

    return {
      ok: true,
      referenced: referencedPaths.size,
      scanned: seen.size,
      unused: orphaned,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to scan attachments.',
    }
  }
}

/**
 * Deletes the given file paths from the bucket. Returns a summary of what was
 * deleted and what failed.
 */
export const deleteUnusedAttachments = async (paths) => {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error: 'Supabase is not configured in the admin dashboard.',
    }
  }

  const uniquePaths = [
    ...new Set(
      (paths || [])
        .map((item) => normalizePath(typeof item === 'string' ? item : item?.path))
        .filter(Boolean),
    ),
  ]
  if (uniquePaths.length === 0) {
    return {
      ok: true,
      deleted: 0,
      failed: 0,
      errors: [],
    }
  }

  const errors = []
  let deleted = 0

  // Batch in chunks of 100 (Supabase's max per remove call).
  const CHUNK_SIZE = 100
  for (let i = 0; i < uniquePaths.length; i += CHUNK_SIZE) {
    const chunk = uniquePaths.slice(i, i + CHUNK_SIZE)
    const { error } = await supabase.storage.from(CLEANUP_BUCKET).remove(chunk)

    if (error) {
      errors.push(error.message)
    } else {
      deleted += chunk.length
    }
  }

  return {
    ok: true,
    deleted,
    failed: uniquePaths.length - deleted,
    errors,
  }
}