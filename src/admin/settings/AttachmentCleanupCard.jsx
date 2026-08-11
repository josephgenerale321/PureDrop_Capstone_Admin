import { useState } from 'react'
import { deleteUnusedAttachments, scanUnusedAttachments } from './attachmentCleanupService.js'

function AttachmentCleanupCard({ onRequestDelete }) {
  const [isScanning, setIsScanning] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingPath, setDeletingPath] = useState('')
  const [unused, setUnused] = useState([])
  const [status, setStatus] = useState({ type: '', message: '' })
  const [lightbox, setLightbox] = useState({ path: '', url: '' })
  const [confirmDeletePath, setConfirmDeletePath] = useState('')

  const handleScan = async () => {
    setIsScanning(true)
    setStatus({ type: '', message: '' })
    try {
      const result = await scanUnusedAttachments()
      if (!result.ok) {
        setStatus({ type: 'error', message: result.error || 'Unable to scan attachments.' })
        setUnused([])
        return
      }
      setUnused(result.unused || [])
      if ((result.unused || []).length === 0) {
        setStatus({ type: 'success', message: `No unused attachments found. ${result.referenced} profile picture(s) are in use.` })
      } else {
        setStatus({
          type: 'success',
          message: `Found ${result.unused.length} unused attachment(s). ${result.referenced} profile picture(s) are in use. Review the list below before deleting.`,
        })
      }
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to scan attachments.' })
      setUnused([])
    } finally {
      setIsScanning(false)
    }
  }

  const handleDelete = async () => {
    if (unused.length === 0) {
      return
    }
    setIsDeleting(true)
    setStatus({ type: '', message: '' })
    try {
      const result = await deleteUnusedAttachments(unused)
      if (!result.ok) {
        setStatus({ type: 'error', message: result.error || 'Unable to delete attachments.' })
        return
      }
      setUnused([])
      if (result.failed > 0) {
        setStatus({
          type: 'error',
          message: `Deleted ${result.deleted} file(s), but ${result.failed} file(s) could not be deleted.`,
        })
      } else {
        setStatus({ type: 'success', message: `Deleted ${result.deleted} unused attachment(s).` })
      }
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to delete attachments.' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteOne = async (path) => {
    if (!path || isDeleting || deletingPath) {
      return
    }
    setIsDeleting(true)
    setDeletingPath(path)
    setStatus({ type: '', message: '' })
    try {
      const result = await deleteUnusedAttachments([path])
      if (!result.ok) {
        setStatus({ type: 'error', message: result.error || 'Unable to delete attachment.' })
        return
      }
      setUnused((current) => current.filter((item) => {
        const itemPath = typeof item === 'string' ? item : item?.path
        return itemPath !== path
      }))
      if (result.failed > 0) {
        setStatus({ type: 'error', message: 'This file could not be deleted.' })
      } else {
        setStatus({ type: 'success', message: 'Deleted 1 unused attachment.' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to delete attachment.' })
    } finally {
      setIsDeleting(false)
      setDeletingPath('')
    }
  }

  const openLightbox = (item) => {
    const path = typeof item === 'string' ? item : item?.path
    const url = typeof item === 'string' ? '' : item?.url
    if (path && url) {
      setLightbox({ path, url })
    }
  }

  const closeLightbox = () => {
    setLightbox({ path: '', url: '' })
  }

  const requestDeleteOne = (path) => {
    if (path && !isDeleting && !deletingPath) {
      setConfirmDeletePath(path)
    }
  }

  const cancelDeleteOne = () => {
    setConfirmDeletePath('')
  }

  const confirmDeleteOne = async () => {
    const path = confirmDeletePath
    setConfirmDeletePath('')
    await handleDeleteOne(path)
  }

  const confirmDeleteItem = (confirmDeletePath || '').trim()
    ? (() => {
        const item = unused.find((entry) => {
          const itemPath = typeof entry === 'string' ? entry : entry?.path
          return itemPath === confirmDeletePath
        })
        return item
      })()
    : null

  const confirmDeleteUrl = confirmDeleteItem
    ? typeof confirmDeleteItem === 'string'
      ? ''
      : confirmDeleteItem?.url
    : ''

  return (
    <section className="admin-settings-card">
      <div className="admin-settings-card-head">
        <div>
          <h2 className="admin-settings-card-title">Storage Cleanup</h2>
          <p className="admin-settings-card-subtitle text-muted mb-0">
            Find and remove profile attachments in the <code>regular_user</code> bucket that are no longer
            used by any user's active profile picture.
          </p>
        </div>
      </div>

      <div className="admin-settings-cleanup-actions">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={handleScan}
          disabled={isScanning || isDeleting}
        >
          {isScanning ? 'Scanning...' : 'Scan Unused Attachments'}
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onRequestDelete(unused, handleDelete)}
          disabled={unused.length === 0 || isScanning || isDeleting}
        >
          {isDeleting ? 'Deleting...' : `Delete ${unused.length} Unused File${unused.length === 1 ? '' : 's'}`}
        </button>
      </div>

      {status.message && (
        <p className={`admin-settings-inline-status mt-2 ${status.type === 'error' ? 'is-error' : ''}`}>
          {status.message}
        </p>
      )}

      {unused.length > 0 && (
        <div className="admin-settings-cleanup-list-wrap">
          <p className="text-muted mb-1">Files that will be deleted (click a thumbnail to preview):</p>
          <div className="admin-settings-cleanup-grid">
            {unused.slice(0, 50).map((item) => {
              const path = typeof item === 'string' ? item : item?.path
              const url = typeof item === 'string' ? '' : item?.url
              const isDeletingThis = deletingPath === path
              return (
                <figure className="admin-settings-cleanup-thumb" key={path} title={path}>
                  <div className="admin-settings-cleanup-thumb-media">
                    {url ? (
                      <img
                        src={url}
                        alt={path}
                        loading="lazy"
                        onClick={() => openLightbox(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openLightbox(item)
                          }
                        }}
                      />
                    ) : (
                      <span className="admin-settings-cleanup-thumb-fallback">?</span>
                    )}
                    <button
                      type="button"
                      className="admin-settings-cleanup-thumb-delete"
                      onClick={() => requestDeleteOne(path)}
                      disabled={isDeleting || Boolean(deletingPath)}
                      aria-label={`Delete ${path}`}
                    >
                      {isDeletingThis ? '...' : '✕'}
                    </button>
                  </div>
                  <figcaption>{path}</figcaption>
                </figure>
              )
            })}
          </div>
          {unused.length > 50 && (
            <p className="text-muted mb-0">...and {unused.length - 50} more file(s).</p>
          )}
        </div>
      )}

      {lightbox.path && lightbox.url && (
        <div className="admin-settings-lightbox-overlay" role="presentation" onClick={closeLightbox}>
          <div
            className="admin-settings-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lightboxTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="admin-settings-lightbox-close"
              onClick={closeLightbox}
              aria-label="Close preview"
            >
              ✕
            </button>
            <img src={lightbox.url} alt={lightbox.path} className="admin-settings-lightbox-image" />
            <p id="lightboxTitle" className="admin-settings-lightbox-path">
              {lightbox.path}
            </p>
          </div>
        </div>
      )}

      {confirmDeleteItem && (
        <div className="admin-settings-confirm-overlay" role="presentation" onClick={cancelDeleteOne}>
          <div
            className="admin-settings-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleteConfirmTitle"
            onClick={(event) => event.stopPropagation()}
          >
            {confirmDeleteUrl && (
              <img src={confirmDeleteUrl} alt="Attachment preview" className="admin-settings-confirm-image" />
            )}
            <h2 id="deleteConfirmTitle" className="admin-settings-confirm-title">
              Do you want to delete this file?
            </h2>
            <p className="admin-settings-confirm-message">{confirmDeletePath}</p>
            <div className="admin-settings-confirm-actions">
              <button
                type="button"
                className="admin-settings-confirm-yes"
                onClick={confirmDeleteOne}
                disabled={isDeleting || Boolean(deletingPath)}
              >
                {deletingPath === confirmDeletePath ? 'Deleting...' : 'YES'}
              </button>
              <button
                type="button"
                className="admin-settings-confirm-no"
                onClick={cancelDeleteOne}
                disabled={isDeleting || Boolean(deletingPath)}
              >
                NO
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AttachmentCleanupCard