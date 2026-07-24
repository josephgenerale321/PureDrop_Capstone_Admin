import defaultAccountImage from '../assets/default_account.png'

function DefaultAvatarImage({ src, alt, className }) {
  const imageSrc = typeof src === 'string' && src.trim() ? src : defaultAccountImage

  const handleImageError = (event) => {
    if (event.currentTarget.dataset.defaultAvatarApplied === 'true') {
      return
    }

    event.currentTarget.dataset.defaultAvatarApplied = 'true'
    event.currentTarget.src = defaultAccountImage
  }

  return <img src={imageSrc} alt={alt} className={className} onError={handleImageError} />
}

export default DefaultAvatarImage
