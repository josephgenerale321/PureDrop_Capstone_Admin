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
}

const createEmptyCreateForm = () => ({
  ...EMPTY_CREATE_FORM,
})

const createEmptyFeedback = () => ({
  type: '',
  message: '',
})

const mapUserToEditForm = (user) => ({
  fullName: user.name === 'N/A' ? '' : user.name,
  email: user.email === 'N/A' ? '' : user.email,
  address: user.address === 'N/A' ? '' : user.address,
  waterMeter: user.waterMeter === 'N/A' ? '' : String(user.waterMeter),
})

function useUsersPageState({ createUserAccount, updateUserAccount, deleteUserAccount, setSelectedUserId }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState(createEmptyCreateForm)
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM)
  const [editUserId, setEditUserId] = useState('')
  const [actionFeedback, setActionFeedback] = useState(createEmptyFeedback)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsMobileNavOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const isEditModalOpen = Boolean(editUserId)
    if (typeof document === 'undefined' || (!isMobileNavOpen && !isEditModalOpen && !isCreateModalOpen)) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key !== 'Escape') {
        return
      }

      if (isEditModalOpen) {
        setEditUserId('')
        return
      }

      if (isCreateModalOpen) {
        setIsCreateModalOpen(false)
        return
      }

      if (isMobileNavOpen) {
        setIsMobileNavOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [editUserId, isCreateModalOpen, isMobileNavOpen])

  const handleToggleMobileNav = () => {
    setIsMobileNavOpen((current) => !current)
  }

  const handleCloseMobileNav = () => {
    setIsMobileNavOpen(false)
  }

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
    setEditUserId('')
    setCreateForm(createEmptyCreateForm())
    setActionFeedback(createEmptyFeedback())
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  const handleStartEdit = (user) => {
    setIsCreateModalOpen(false)
    setSelectedUserId(user.id)
    setEditUserId(user.id)
    setEditForm(mapUserToEditForm(user))
    setActionFeedback(createEmptyFeedback())
  }

  const handleCloseEditModal = () => {
    setEditUserId('')
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

    setActionFeedback({
      type: 'success',
      message: 'User account created successfully.',
    })
    setIsCreateModalOpen(false)
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()
    setActionFeedback(createEmptyFeedback())

    const result = await updateUserAccount(editUserId, editForm)
    if (!result.ok) {
      setActionFeedback({
        type: 'error',
        message: result.error,
      })
      return
    }

    setActionFeedback({
      type: 'success',
      message: 'User account updated successfully.',
    })
    setEditUserId('')
  }

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Delete account for ${user.name} (${user.email})? This will remove the user's Firebase login and report documents.`,
    )
    if (!confirmed) {
      return
    }

    setActionFeedback(createEmptyFeedback())
    const result = await deleteUserAccount(user.id)

    if (!result.ok) {
      setActionFeedback({
        type: 'error',
        message: result.error,
      })
      return
    }

    setActionFeedback({
      type: 'success',
      message: result.message || 'User account and Firebase login deleted successfully.',
    })

    if (editUserId === user.id) {
      setEditUserId('')
    }
  }

  return {
    isMobileNavOpen,
    isCreateModalOpen,
    isEditModalOpen: Boolean(editUserId),
    createForm,
    editForm,
    editUserId,
    actionFeedback,
    handleToggleMobileNav,
    handleCloseMobileNav,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleStartEdit,
    handleCloseEditModal,
    handleCreateFieldChange,
    handleEditFieldChange,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteUser,
  }
}

export default useUsersPageState
