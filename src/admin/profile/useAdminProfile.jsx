import { useEffect, useMemo, useState } from 'react'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase.js'

const ADMIN_PROFILE_COLLECTION = 'admin_user'

function useAdminProfile(user) {
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [role, setRole] = useState('admin')
  const [profileStatus, setProfileStatus] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: 'Success', message: '' })
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: 'Error', message: '' })
  const [isPasswordConfirmOpen, setIsPasswordConfirmOpen] = useState(false)
  const [passwordConfirmError, setPasswordConfirmError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      if (!user?.uid) {
        return
      }

      try {
        const snap = await getDoc(doc(db, ADMIN_PROFILE_COLLECTION, user.uid))
        if (!isMounted || !snap.exists()) {
          return
        }

        const data = snap.data()
        setFullName(data.fullName || '')
        setAddress(data.address || data.location || '')
        setRole(data.role || 'admin')
      } catch {
        if (isMounted) {
          setProfileStatus('Unable to load profile details right now.')
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [user?.uid])

  const initials = useMemo(() => {
    const source = fullName || user?.email || 'A'
    const parts = source.trim().split(/\s+/)
    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase()
    }
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
  }, [fullName, user?.email])

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    if (!user?.uid) {
      return
    }

    setIsSavingProfile(true)
    setProfileStatus('')
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
      setProfileStatus('Profile updated successfully.')
      setSuccessModal({
        isOpen: true,
        title: 'Profile Updated',
        message: 'Your profile changes have been saved successfully.',
      })
    } catch (error) {
      if (error?.code === 'permission-denied') {
        setProfileStatus('Save failed: permission denied by Firestore rules.')
        setErrorModal({
          isOpen: true,
          title: 'Save Failed',
          message: 'Unable to save profile changes: permission denied by Firestore rules.',
        })
      } else {
        setProfileStatus('Unable to save profile changes.')
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
    setPasswordStatus('')
    setPasswordConfirmError('')

    if (!auth.currentUser || !auth.currentUser.email) {
      setPasswordStatus('No active admin session.')
      setErrorModal({
        isOpen: true,
        title: 'No Active Session',
        message: 'No active admin session. Please sign in again.',
      })
      return
    }
    if (newPassword.length < 6) {
      setPasswordStatus('New password must be at least 6 characters.')
      setErrorModal({
        isOpen: true,
        title: 'Password Too Short',
        message: 'New password must be at least 6 characters.',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus('New password and confirmation do not match.')
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
      setPasswordStatus('Password updated successfully.')
      setSuccessModal({
        isOpen: true,
        title: 'Password Updated',
        message: 'Your password has been updated successfully.',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsPasswordConfirmOpen(false)
    } catch {
      setPasswordStatus('Unable to update password. Check current password and try again.')
      setPasswordConfirmError('Unable to update password. Check your current password and try again.')
    } finally {
      setIsUpdatingPassword(false)
    }
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
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    initials,
    successModal,
    errorModal,
    isPasswordConfirmOpen,
    passwordConfirmError,
    handleSaveProfile,
    handleChangePassword,
    closePasswordConfirm,
    performPasswordChange,
    handleCloseSuccessModal: () => setSuccessModal((current) => ({ ...current, isOpen: false })),
    handleCloseErrorModal: () => setErrorModal((current) => ({ ...current, isOpen: false })),
  }
}

export default useAdminProfile
