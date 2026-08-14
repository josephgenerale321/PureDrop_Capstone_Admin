import { useEffect, useState } from 'react'

const EMPTY_CREATE_FORM = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  address: '',
  waterMeter: '',
}

const EMPTY_EDIT_FORM = {
  fullName: '',
  email: '',
  address: '',
  waterMeter: '',
  status: 'Inactive',
}

const INITIAL_EDIT_REFERENCE = {
  fullName: '',
  email: '',
  address: '',
  waterMeter: '',
  status: 'Inactive',
}

const createEmptyCreateForm = () => ({
  ...EMPTY_CREATE_FORM,
})

const createEmptyFeedback = () => ({
  type: '',
  message: '',
})

const createEmptyErrors = () => ({
  fullName: '',
  email: '',
  address: '',
  waterMeter: '',
})

const mapUserToEditForm = (user) => ({
  fullName: user.name === 'N/A' ? '' : user.name,
  email: user.email === 'N/A' ? '' : user.email,
  address: user.address === 'N/A' ? '' : user.address,
  waterMeter: user.waterMeter === 'N/A' ? '' : String(user.waterMeter),
  status: user.status || 'Inactive',
})

const formsDiffer = (a, b) => {
  return ['fullName', 'email', 'address', 'waterMeter', 'status'].some(
    (key) => String(a[key] || '') !== String(b[key] || ''),
  )
}

const validateEditForm = (form) => {
  const errors = {}

  if (!form.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  } else if (form.fullName.trim().length < 2) {
    errors.fullName = 'Name must be at least 2 characters.'
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!form.address.trim()) {
    errors.address = 'Address is required.'
  }

  if (form.waterMeter && Number(form.waterMeter) < 0) {
    errors.waterMeter = 'Water meter cannot be negative.'
  } else if (form.waterMeter && form.waterMeter.replace(/[^\d]/g, '').length > 6) {
    errors.waterMeter = 'Water meter must be at most 6 digits.'
  }

  return errors
}

const validateField = (field, value, form) => {
  const nextForm = { ...form, [field]: value }
  const errors = validateEditForm(nextForm)
  return errors[field] || ''
}

function useUsersPageState({
  createUserAccount,
  updateUserAccount,
  deleteUserAccount,
  setSelectedUserId,
  updateUserStatus,
  sendVerificationEmail,
  setUserPassword,
  verifyEmailOtp,
  markEmailVerified,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState(createEmptyCreateForm)
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM)
  const [editUserId, setEditUserId] = useState('')
  const [editUserName, setEditUserName] = useState('')
  const [editUserEmail, setEditUserEmail] = useState('')
  const [editReference, setEditReference] = useState(INITIAL_EDIT_REFERENCE)
  const [editFieldErrors, setEditFieldErrors] = useState(createEmptyErrors)
  const [editValidatedFields, setEditValidatedFields] = useState(() => new Set())
  const [actionFeedback, setActionFeedback] = useState(createEmptyFeedback)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerificationCodeSent, setIsVerificationCodeSent] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false)
  const [pendingCloseAction, setPendingCloseAction] = useState(null)
  const [isSaveSuccess, setIsSaveSuccess] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false)

  const isDeleteModalOpen = Boolean(deleteTarget)

  const isEditModalOpen = Boolean(editUserId)
  const isEditDirty = isEditModalOpen && formsDiffer(editForm, editReference)

  useEffect(() => {
    if (typeof document === 'undefined' || (!isEditModalOpen && !isCreateModalOpen && !isDetailsModalOpen)) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key !== 'Escape') {
        return
      }

      if (isDetailsModalOpen) {
        setIsDetailsModalOpen(false)
        return
      }

      if (isConfirmCloseOpen) {
        setIsConfirmCloseOpen(false)
        return
      }

      if (isEditModalOpen) {
        if (isEditDirty) {
          setPendingCloseAction('close')
          setIsConfirmCloseOpen(true)
        } else {
          setEditUserId('')
        }
        return
      }

      if (isCreateModalOpen) {
        setIsCreateModalOpen(false)
        return
      }

    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [editUserId, isEditModalOpen, isCreateModalOpen, isDetailsModalOpen, isConfirmCloseOpen, isEditDirty])

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
    setEditUserId('')
    setCreateForm(createEmptyCreateForm())
    setActionFeedback(createEmptyFeedback())
    setVerificationCode('')
    setIsVerificationCodeSent(false)
    setIsVerifyingEmail(false)
    setIsEmailVerified(false)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
    setVerificationCode('')
    setIsVerificationCodeSent(false)
    setIsVerifyingEmail(false)
    setIsEmailVerified(false)
  }

  const handleStartEdit = (user) => {
    setIsCreateModalOpen(false)
    setSelectedUserId(user.id)
    setEditUserId(user.id)
    setEditUserName(user.name === 'N/A' ? '' : user.name)
    setEditUserEmail(user.email === 'N/A' ? '' : user.email)
    const mapped = mapUserToEditForm(user)
    setEditForm(mapped)
    setEditReference(mapped)
    setEditFieldErrors(createEmptyErrors())
    setEditValidatedFields(new Set())
    setActionFeedback(createEmptyFeedback())
    setNewPassword('')
    setConfirmNewPassword('')
    setIsConfirmCloseOpen(false)
    setPendingCloseAction(null)
    setIsSaveSuccess(false)
  }

  const handleCloseEditModal = () => {
    if (isEditDirty) {
      setPendingCloseAction('close')
      setIsConfirmCloseOpen(true)
      return
    }
    setEditUserId('')
    setEditUserName('')
    setEditUserEmail('')
    setNewPassword('')
    setConfirmNewPassword('')
    setIsConfirmCloseOpen(false)
    setPendingCloseAction(null)
    setIsSaveSuccess(false)
  }

  const handleConfirmDiscard = () => {
    setIsConfirmCloseOpen(false)
    if (pendingCloseAction === 'close') {
      setEditUserId('')
      setEditUserName('')
      setEditUserEmail('')
      setNewPassword('')
      setConfirmNewPassword('')
      setPendingCloseAction(null)
      setIsSaveSuccess(false)
    }
    setPendingCloseAction(null)
  }

  const handleCancelDiscard = () => {
    setIsConfirmCloseOpen(false)
    setPendingCloseAction(null)
  }

  const handleOpenDetailsModal = () => {
    setIsDetailsModalOpen(true)
    setIsCreateModalOpen(false)
    setEditUserId('')
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
  }

  const handleCreateFieldChange = (field, value) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleEditFieldChange = (field, value) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleEditFieldBlur = (field) => {
    setEditValidatedFields((current) => new Set(current).add(field))
    setEditFieldErrors((current) => ({
      ...current,
      [field]: validateField(field, editForm[field], editForm),
    }))
  }

  const handleEditReset = () => {
    setEditForm({ ...editReference })
    setEditFieldErrors(createEmptyErrors())
    setEditValidatedFields(new Set())
    setActionFeedback(createEmptyFeedback())
  }

  const handleCreateSubmit = async (event) => {
    event.preventDefault()
    setActionFeedback(createEmptyFeedback())

    const result = await createUserAccount(createForm)
    if (!result.ok) {
      setActionFeedback({
        type: 'error',
        message: result.error,
      })
      return
    }

    if (isEmailVerified && result.uid) {
      await handleMarkEmailVerified(result.uid)
    }

    setActionFeedback({
      type: 'success',
      message: 'User account created successfully.',
    })
    setIsCreateModalOpen(false)
    setVerificationCode('')
    setIsVerificationCodeSent(false)
    setIsVerifyingEmail(false)
    setIsEmailVerified(false)
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()
    setActionFeedback(createEmptyFeedback())

    const validationErrors = validateEditForm(editForm)

    if (Object.keys(validationErrors).length > 0) {
      setEditFieldErrors(validationErrors)
      setEditValidatedFields(new Set(['fullName', 'email', 'address', 'waterMeter']))
      setActionFeedback({
        type: 'error',
        message: 'Please fix the highlighted fields before saving.',
      })
      return
    }

    if (!isEditDirty) {
      setActionFeedback({
        type: 'success',
        message: 'No changes were made.',
      })
      return
    }

    const statusChanged = String(editForm.status || '') !== String(editReference.status || '')
    const result = await updateUserAccount(editUserId, editForm)
    if (!result.ok) {
      setActionFeedback({
        type: 'error',
        message: result.error,
      })
      return
    }

    if (statusChanged && updateUserStatus) {
      const statusResult = await updateUserStatus(editUserId, editForm.status)
      if (!statusResult.ok) {
        setActionFeedback({
          type: 'error',
          message: statusResult.error,
        })
        return
      }
    }

    const updatedReference = { ...editForm }
    setEditReference(updatedReference)
    setActionFeedback(createEmptyFeedback())
    setIsSaveSuccess(true)
    setEditUserId('')
    setEditUserName('')
    setEditUserEmail('')
    setIsConfirmCloseOpen(false)
    setPendingCloseAction(null)
  }

  const handleSetUserPassword = async () => {
    if (!editUserEmail) {
      setActionFeedback({
        type: 'error',
        message: 'User email is missing.',
      })
      return
    }

    if (newPassword.length < 6) {
      setActionFeedback({
        type: 'error',
        message: 'Password must be at least 6 characters.',
      })
      return
    }

    if (newPassword !== confirmNewPassword) {
      setActionFeedback({
        type: 'error',
        message: 'New password and confirm password do not match.',
      })
      return
    }

    setActionFeedback(createEmptyFeedback())
    setIsUpdatingPassword(true)
    try {
      const result = await setUserPassword({ email: editUserEmail, newPassword })
      if (!result.ok) {
        setActionFeedback({
          type: 'error',
          message: result.error,
        })
        return
      }

      setActionFeedback({
        type: 'success',
        message: result.message || 'Password has been updated for the user.',
      })
      setNewPassword('')
      setConfirmNewPassword('')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleSendVerificationEmail = async () => {
    if (!editUserEmail) {
      setActionFeedback({
        type: 'error',
        message: 'User email is missing.',
      })
      return
    }

    setActionFeedback(createEmptyFeedback())
    const result = await sendVerificationEmail(editUserEmail)
    if (!result.ok) {
      setActionFeedback({
        type: 'error',
        message: result.error,
      })
      return
    }

    setActionFeedback({
      type: 'success',
      message: result.message || 'Verification email sent successfully.',
    })
  }

  const handleSendCreateVerificationCode = async () => {
    const email = String(createForm.email || '').trim()
    if (!email) {
      setActionFeedback({
        type: 'error',
        message: 'Enter an email address first.',
      })
      return
    }

    setActionFeedback(createEmptyFeedback())
    const result = await sendVerificationEmail(email)
    if (!result.ok) {
      setActionFeedback({
        type: 'error',
        message: result.error,
      })
      return
    }

    setIsVerificationCodeSent(true)
    setActionFeedback({
      type: 'success',
      message: result.message || 'A 6-digit verification code has been sent to the email.',
    })
  }

  const handleVerifyCreateEmailCode = async () => {
    const email = String(createForm.email || '').trim()
    if (!email) {
      setActionFeedback({
        type: 'error',
        message: 'Enter an email address first.',
      })
      return
    }

    if (verificationCode.length !== 6) {
      setActionFeedback({
        type: 'error',
        message: 'Enter the 6-digit verification code.',
      })
      return
    }

    setActionFeedback(createEmptyFeedback())
    setIsVerifyingEmail(true)
    try {
      const result = await verifyEmailOtp({ email, code: verificationCode })
      if (!result.ok) {
        setActionFeedback({
          type: 'error',
          message: result.error,
        })
        return
      }

      setIsEmailVerified(true)
      setActionFeedback({
        type: 'success',
        message: 'Email verified successfully.',
      })
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  const handleMarkEmailVerified = async (userId) => {
    if (!userId) {
      return
    }

    const result = await markEmailVerified(userId)
    if (!result.ok) {
      setActionFeedback({
        type: 'error',
        message: result.error,
      })
      return
    }

    setActionFeedback({
      type: 'success',
      message: 'Email marked as verified.',
    })
  }

  const handleOpenDeleteModal = (user) => {
    setDeleteTarget(user)
    setDeleteError('')
  }

  const handleCloseDeleteModal = () => {
    if (isDeleteSubmitting) {
      return
    }
    setDeleteTarget(null)
    setDeleteError('')
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleteSubmitting) {
      return
    }

    setIsDeleteSubmitting(true)
    setDeleteError('')

    const result = await deleteUserAccount(deleteTarget.id)

    if (!result.ok) {
      setDeleteError(result.error || 'Unable to delete user right now.')
      setIsDeleteSubmitting(false)
      return
    }

    setActionFeedback({
      type: 'success',
      message: result.message || 'User account and Firebase login deleted successfully.',
    })

    if (editUserId === deleteTarget.id) {
      setEditUserId('')
    }

    setIsDeleteSubmitting(false)
    setDeleteTarget(null)
    setDeleteError('')
  }

  return {
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    isUpdatingPassword,
    handleSetUserPassword,
    verificationCode,
    setVerificationCode,
    isVerificationCodeSent,
    isVerifyingEmail,
    isEmailVerified,
    handleSendCreateVerificationCode,
    handleVerifyCreateEmailCode,
    handleMarkEmailVerified,
    isCreateModalOpen,
    isEditModalOpen,
    isDetailsModalOpen,
    isConfirmCloseOpen,
    isEditDirty,
    isSaveSuccess,
    isDeleteModalOpen,
    deleteTarget,
    deleteError,
    isDeleteSubmitting,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
    createForm,
    editForm,
    editUserId,
    editFieldErrors,
    editValidatedFields,
    editUserName,
    editUserEmail,
    actionFeedback,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleStartEdit,
    handleCloseEditModal,
    handleConfirmDiscard,
    handleCancelDiscard,
    handleOpenDetailsModal,
    handleCloseDetailsModal,
    handleCreateFieldChange,
    handleEditFieldChange,
    handleEditFieldBlur,
    handleEditReset,
    handleCreateSubmit,
    handleEditSubmit,
    handleSetUserPassword,
    handleSendVerificationEmail,
  }
}

export default useUsersPageState