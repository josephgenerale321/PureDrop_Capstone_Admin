import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase.js'

const ADMIN_PROFILE_COLLECTION = 'admin_user'

const PASSWORD_MIN_LENGTH = 8

function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, label: '', color: '' }
  }

  let score = 0
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) return { score, label: 'Weak', color: '#dc2626' }
  if (score === 2) return { score, label: 'Fair', color: '#d97706' }
  if (score === 3) return { score, label: 'Good', color: '#16a34a' }
  return { score, label: 'Strong', color: '#15803d' }
}

function useAdminProfile(user) {
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [role, setRole] = useState('admin')
  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' })
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [accountMeta, setAccountMeta] = useState({
    createdAt: null,
    lastSignInAt: null,
  })
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: 'Success', message: '' })
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: 'Error', message: '' })
  const [isPasswordConfirmOpen, setIsPasswordConfirmOpen] = useState(false)
  const [passwordConfirmError, setPasswordConfirmError] = useState('')
  const [retryCounter, setRetryCounter] = useState(0)

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      if (!user?.uid) {
        setIsLoadingProfile(false)
        return
      }

      try {
        const snap = await getDoc(doc(db, ADMIN_PROFILE_COLLECTION, user.uid))
        if (!isMounted) {
          return
        }

        if (snap.exists()) {
          const data = snap.data()
          setFullName(data.fullName || '')
          setAddress(data.address || data.location || '')
          setRole(data.role || 'admin')
          setAccountMeta({
            createdAt: data.createdAt?.toDate?.() || null,
            lastSignInAt: data.lastSignInAt?.toDate?.() || null,
          })
        } else {
          setAccountMeta({
            createdAt: user.metadata?.creationTime ? new Date(user.metadata.creationTime) : null,
            lastSignInAt: user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null,
          })
        }
      } catch {
        if (isMounted) {
          setProfileStatus({ type: 'error', message: 'Unable to load profile details right now.' })
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false)
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [user?.uid, user?.metadata?.creationTime, user?.metadata?.lastSignInTime, retryCounter])

  const retryProfile = useCallback(() => {
    setRetryCounter((current) => current + 1)
    setProfileStatus({ type: '', message: '' })
    setIsLoadingProfile(true)
  }, [])

  const isProfileDirty = useMemo(() => {
    return fullName.trim() !== '' || address.trim() !== ''
  }, [fullName, address])

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword])

  const validateProfile = () => {
    const errors = {}
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.'
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.'
    }
    if (!address.trim()) {
      errors.address = 'Address is required.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    if (!user?.uid) {
      return
    }

    if (!validateProfile()) {
      setProfileStatus({ type: 'error', message: 'Please fix the highlighted fields before saving.' })
      return
    }

    setIsSavingProfile(true)
    setProfileStatus({ type: '', message: '' })
    try {
      await setDoc(
        doc(db, ADMIN_PROFILE_COLLECTION, user.uid),
        {
          uid: user.uid,
          email: user.email || '',
          fullName: fullName.trim(),
          address: address.trim(),
          role: 'admin',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      setProfileStatus({ type: 'success', message: 'Profile updated successfully.' })
      setSuccessModal({
        isOpen: true,
        title: 'Profile Updated',
        message: 'Your profile changes have been saved successfully.',
      })
    } catch (error) {
      if (error?.code === 'permission-denied') {
        setProfileStatus({ type: 'error', message: 'Save failed: permission denied by Firestore rules.' })
        setErrorModal({
          isOpen: true,
          title: 'Save Failed',
          message: 'Unable to save profile changes: permission denied by Firestore rules.',
        })
      } else if (error?.code?.startsWith('unavailable') || error?.code === 'network-request-failed') {
        setProfileStatus({ type: 'error', message: 'Network error. Check your connection and try again.' })
        setErrorModal({
          isOpen: true,
          title: 'Network Error',
          message: 'Unable to reach the server. Please check your internet connection and try again.',
        })
      } else {
        setProfileStatus({ type: 'error', message: 'Unable to save profile changes.' })
        setErrorModal({
          isOpen: true,
          title: 'Save Failed',
          message: 'Unable to save profile changes. Please try again.',
        })
      }
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()
    setPasswordStatus({ type: '', message: '' })
    setPasswordConfirmError('')

    if (!auth.currentUser || !auth.currentUser.email) {
      setPasswordStatus({ type: 'error', message: 'No active admin session.' })
      setErrorModal({
        isOpen: true,
        title: 'No Active Session',
        message: 'No active admin session. Please sign in again.',
      })
      return
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setPasswordStatus({ type: 'error', message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters.` })
      setErrorModal({
        isOpen: true,
        title: 'Password Too Short',
        message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      })
      return
    }
    if (passwordStrength.score < 2) {
      setPasswordStatus({ type: 'error', message: 'Password is too weak. Use a mix of letters, numbers, and symbols.' })
      setErrorModal({
        isOpen: true,
        title: 'Password Too Weak',
        message: 'Password is too weak. Use a mix of uppercase, lowercase, numbers, and symbols.',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New password and confirmation do not match.' })
      setErrorModal({
        isOpen: true,
        title: 'Passwords Do Not Match',
        message: 'New password and confirmation do not match.',
      })
      return
    }

    setIsPasswordConfirmOpen(true)
  }

  const closePasswordConfirm = () => {
    if (isUpdatingPassword) {
      return
    }
    setIsPasswordConfirmOpen(false)
    setPasswordConfirmError('')
  }

  const performPasswordChange = async () => {
    setIsUpdatingPassword(true)
    setPasswordConfirmError('')
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPassword)
      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' })
      setSuccessModal({
        isOpen: true,
        title: 'Password Updated',
        message: 'Your password has been updated successfully.',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsPasswordConfirmOpen(false)
    } catch (error) {
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        setPasswordStatus({ type: 'error', message: 'Current password is incorrect.' })
        setPasswordConfirmError('The current password you entered is incorrect.')
      } else if (error?.code === 'auth/weak-password') {
        setPasswordStatus({ type: 'error', message: 'New password is too weak.' })
        setPasswordConfirmError('The new password is too weak. Please choose a stronger password.')
      } else if (error?.code === 'auth/requires-recent-login') {
        setPasswordStatus({ type: 'error', message: 'Please sign in again before changing your password.' })
        setPasswordConfirmError('For security, please sign in again before changing your password.')
      } else {
        setPasswordStatus({ type: 'error', message: 'Unable to update password. Please try again.' })
        setPasswordConfirmError('Unable to update password. Please try again.')
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const formatDate = (date) => {
    if (!date) {
      return '—'
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  return {
    fullName,
    setFullName,
    address,
    setAddress,
    role,
    profileStatus,
    passwordStatus,
    isSavingProfile,
    isUpdatingPassword,
    isLoadingProfile,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    fieldErrors,
    accountMeta,
    formatDate,
    isProfileDirty,
    passwordStrength,
    successModal,
    errorModal,
    isPasswordConfirmOpen,
    passwordConfirmError,
    retryProfile,
    handleSaveProfile,
    handleChangePassword,
    closePasswordConfirm,
    performPasswordChange,
    handleCloseSuccessModal: () => setSuccessModal((current) => ({ ...current, isOpen: false })),
    handleCloseErrorModal: () => setErrorModal((current) => ({ ...current, isOpen: false })),
  }
}

export default useAdminProfile