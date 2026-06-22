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
    } catch (error) {
      if (error?.code === 'permission-denied') {
        setProfileStatus('Save failed: permission denied by Firestore rules.')
      } else {
        setProfileStatus('Unable to save profile changes.')
      }
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()
    setPasswordStatus('')

    if (!auth.currentUser || !auth.currentUser.email) {
      setPasswordStatus('No active admin session.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordStatus('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus('New password and confirmation do not match.')
      return
    }

    setIsUpdatingPassword(true)
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPassword)
      setPasswordStatus('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordStatus('Unable to update password. Check current password and try again.')
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
    handleSaveProfile,
    handleChangePassword,
  }
}

export default useAdminProfile
