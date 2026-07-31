import { useEffect, useMemo, useState } from 'react'

const normalizeReportStatus = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()

  if (normalized === 'approved') return 'Approved'
  if (normalized === 'rejected') return 'Rejected'
  if (normalized === 'resolved') return 'Resolved'
  return 'Pending'
}

const createEmptyReportActionResult = () => ({
  key: '',
  type: '',
  message: '',
})

const createEmptyEditForm = () => ({
  issue: '',
  category: '',
  address: '',
  location: '',
  locationDetails: '',
  gpsLocation: '',
  waterMeter: '',
})

const mapReportToEditForm = (report) => ({
  issue: report?.issue === 'N/A' ? '' : report?.issue || '',
  category: report?.category === 'N/A' ? '' : report?.category || '',
  address: report?.address === 'N/A' ? '' : report?.address || '',
  location: report?.location === 'N/A' ? '' : report?.location || '',
  locationDetails: report?.locationDetails === 'N/A' ? '' : report?.locationDetails || '',
  gpsLocation: report?.gpsLocation === 'N/A' ? '' : report?.gpsLocation || '',
  waterMeter: report?.waterMeter === 'N/A' ? '' : String(report?.waterMeter || ''),
})

function useReportsPageState({ selectedReport, updateReportStatus, editReport, deleteReport }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [statusDraftByReportKey, setStatusDraftByReportKey] = useState({})
  const [statusUpdateResult, setStatusUpdateResult] = useState({ key: '', type: '', message: '' })
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editForm, setEditForm] = useState(createEmptyEditForm)
  const [reportActionResult, setReportActionResult] = useState(createEmptyReportActionResult)

  const selectedStatusDraft = useMemo(() => {
    if (!selectedReport) {
      return 'Pending'
    }

    return statusDraftByReportKey[selectedReport.key] || normalizeReportStatus(selectedReport.status)
  }, [selectedReport, statusDraftByReportKey])

  const isEditModalVisible = isEditModalOpen && Boolean(selectedReport)
  const isDeleteModalVisible = isDeleteModalOpen && Boolean(selectedReport)
  const isDetailsModalVisible = isDetailsModalOpen && Boolean(selectedReport)

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
    if (typeof document === 'undefined' || (!isMobileNavOpen && !isDetailsModalVisible && !isEditModalVisible && !isDeleteModalVisible)) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (isDeleteModalVisible) {
          setIsDeleteModalOpen(false)
          return
        }

        if (isEditModalVisible) {
          setIsEditModalOpen(false)
          return
        }

        if (isDetailsModalVisible) {
          setIsDetailsModalOpen(false)
          return
        }

        setIsMobileNavOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isDeleteModalVisible, isDetailsModalVisible, isEditModalVisible, isMobileNavOpen])

  useEffect(() => {
    if (!selectedReport) {
      const timeoutId = window.setTimeout(() => {
        setIsDetailsModalOpen(false)
      }, 0)

      return () => {
        window.clearTimeout(timeoutId)
      }
    }

    return undefined
  }, [selectedReport])

  const handleOpenDetailsModal = () => {
    setIsDetailsModalOpen(true)
    setIsEditModalOpen(false)
    setIsDeleteModalOpen(false)
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
  }

  const handleStatusDraftChange = (nextValue) => {
    if (!selectedReport) {
      return
    }

    setStatusDraftByReportKey((current) => ({
      ...current,
      [selectedReport.key]: normalizeReportStatus(nextValue),
    }))

    setStatusUpdateResult((current) => {
      if (current.key !== selectedReport.key) {
        return current
      }

      return { key: '', type: '', message: '' }
    })
  }

  const handleApplyStatusChange = async () => {
    if (!selectedReport) {
      return
    }

    setStatusUpdateResult({ key: '', type: '', message: '' })

    const result = await updateReportStatus(selectedReport.key, selectedStatusDraft)
    if (!result.ok) {
      setStatusUpdateResult({
        key: selectedReport.key,
        type: 'error',
        message: result.error,
      })
      return
    }

    setStatusUpdateResult({
      key: selectedReport.key,
      type: 'success',
      message: `Report REP-${selectedReport.reportId} marked as ${selectedStatusDraft}.`,
    })
  }

  const handleOpenEditModal = () => {
    if (!selectedReport) {
      return
    }

    setEditForm(mapReportToEditForm(selectedReport))
    setIsDetailsModalOpen(false)
    setIsDeleteModalOpen(false)
    setIsEditModalOpen(true)
    setReportActionResult(createEmptyReportActionResult())
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
  }

  const handleEditFieldChange = (field, value) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()

    if (!selectedReport) {
      return
    }

    setReportActionResult(createEmptyReportActionResult())
    const result = await editReport(selectedReport.key, editForm)
    if (!result.ok) {
      setReportActionResult({
        key: selectedReport.key,
        type: 'error',
        message: result.error,
      })
      return
    }

    setReportActionResult({
      key: selectedReport.key,
      type: 'success',
      message: `Report REP-${selectedReport.reportId} updated successfully.`,
    })
    setIsEditModalOpen(false)
  }

  const handleOpenDeleteModal = () => {
    if (!selectedReport) {
      return
    }

    setIsEditModalOpen(false)
    setIsDetailsModalOpen(false)
    setIsDeleteModalOpen(true)
    setReportActionResult(createEmptyReportActionResult())
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (!selectedReport) {
      return
    }

    setReportActionResult(createEmptyReportActionResult())
    const result = await deleteReport({
      reportKey: selectedReport.key,
      attachments: selectedReport.attachments,
      userId: selectedReport.userId,
      reportId: selectedReport.reportId,
      documentId: selectedReport.documentId,
    })

    if (!result.ok) {
      setReportActionResult({
        key: selectedReport.key,
        type: 'error',
        message: result.error,
      })
      return
    }

    setIsDeleteModalOpen(false)
  }

  return {
    isMobileNavOpen,
    setIsMobileNavOpen,
    selectedStatusDraft,
    statusUpdateResult,
    isDetailsModalOpen: isDetailsModalVisible,
    isEditModalOpen: isEditModalVisible,
    isDeleteModalOpen: isDeleteModalVisible,
    editForm,
    reportActionResult,
    handleOpenDetailsModal,
    handleCloseDetailsModal,
    handleStatusDraftChange,
    handleApplyStatusChange,
    handleOpenEditModal,
    handleCloseEditModal,
    handleEditFieldChange,
    handleEditSubmit,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
  }
}

export default useReportsPageState
