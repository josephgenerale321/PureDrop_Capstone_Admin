import { useEffect } from 'react'

// Fullscreen image viewer opened from the verification review modal. Lets the
// reviewer inspect ID photos / selfies at full resolution and flip through
// every submitted image with the arrow keys (which doubles as the
// selfie-vs-ID compare view).
function VerificationImageLightbox({ images, index, onClose, onNavigate }) {
  const image = images[index]

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault()
        onNavigate(index - 1)
      }

      if (event.key === 'ArrowRight' && index < images.length - 1) {
        event.preventDefault()
        onNavigate(index + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [index, images.length, onClose, onNavigate])

  if (!image) {
    return null
  }

  return (
    <div className="admin-verification-lightbox-layer" role="dialog" aria-modal="true" aria-label={`${image.label} enlarged`}>
      <button
        type="button"
        className="admin-verification-lightbox-backdrop"
        aria-label="Close enlarged image"
        onClick={onClose}
      />
      <button
        type="button"
        className="admin-verification-lightbox-close"
        aria-label="Close enlarged image"
        onClick={onClose}
      >
        <span aria-hidden="true">✕</span>
      </button>

      <figure className="admin-verification-lightbox">
        <img src={image.src} alt={image.alt} className="admin-verification-lightbox-image" />
        <figcaption className="admin-verification-lightbox-caption">
          <span>{image.label}</span>
          <span className="admin-verification-lightbox-counter">
            {index + 1} of {images.length}
          </span>
        </figcaption>
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="admin-verification-lightbox-nav admin-verification-lightbox-prev"
              aria-label="Previous image"
              onClick={() => onNavigate(index - 1)}
              disabled={index <= 0}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="admin-verification-lightbox-nav admin-verification-lightbox-next"
              aria-label="Next image"
              onClick={() => onNavigate(index + 1)}
              disabled={index >= images.length - 1}
            >
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}
      </figure>
    </div>
  )
}

export default VerificationImageLightbox
