import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteReportInFirestore,
  fetchReportsFromFirestore,
  getReportsLoadErrorMessage,
  subscribeToReportsRealtime,
  toReportStatusClass,
  updateReportDetailsInFirestore,
  updateReportStatusInFirestore,
} from './reportsService.js'

function useReportsData() {
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedReportKey, setSelectedReportKey] = useState(null)
  const [updatingReportKey, setUpdatingReportKey] = useState(null)
  const [savingReportKey, setSavingReportKey] = useState(null)
  const [deletingReportKey, setDeletingReportKey] = useState(null)

  const applyReports = useCallback((mappedReports) => {
    setReports(mappedReports)
    setSelectedReportKey((current) => {
      if (current && mappedReports.some((report) => report.key === current)) {
        return current
      }
      return mappedReports[0]?.key || null
    })
  }, [])

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const mappedReports = await fetchReportsFromFirestore()
      applyReports(mappedReports)
    } catch (error) {
      setLoadError(getReportsLoadErrorMessage(error))
      setReports([])
      setSelectedReportKey(null)
    } finally {
      setIsLoading(false)
    }
  }, [applyReports])

  useEffect(() => {
    setIsLoading(true)
    setLoadError('')

    const unsubscribe = subscribeToReportsRealtime({
      onReports: (mappedReports) => {
        applyReports(mappedReports)
        setLoadError('')
        setIsLoading(false)
      },
      onError: (error) => {
        setLoadError(getReportsLoadErrorMessage(error))
        setReports([])
        setSelectedReportKey(null)
        setIsLoading(false)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [applyReports])

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return reports
    }

    return reports.filter((report) => {
      return [report.reportId, report.title, report.issue, report.category, report.status, report.reporterName, report.location, report.userId]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [reports, search])

  const selectedReport = useMemo(() => {
    if (!selectedReportKey) {
      return null
    }

    return reports.find((report) => report.key === selectedReportKey) || null
  }, [reports, selectedReportKey])

  const recentActivity = useMemo(() => {
    return reports.slice(0, 5).map((report) => ({
      id: report.key,
      label: `New report created REP-${report.reportId}`,
      timeAgo: report.activityTimeAgo,
    }))
  }, [reports])

  const summary = useMemo(() => {
    return reports.reduce(
      (result, report) => {
        const normalizedStatus = report.status.toLowerCase()
        if (normalizedStatus.includes('pending')) {
          result.pending += 1
        } else if (normalizedStatus.includes('resolved')) {
          result.resolved += 1
        } else {
          result.other += 1
        }
        return result
      },
      { pending: 0, resolved: 0, other: 0 },
    )
  }, [reports])

  const updateReportStatus = useCallback(async (reportKey, nextStatus) => {
    setUpdatingReportKey(reportKey)

    try {
      const result = await updateReportStatusInFirestore({ reportKey, nextStatus })
      if (!result.ok) {
        return result
      }

      setReports((current) =>
        current.map((report) => {
          if (report.key !== reportKey) {
            return report
          }

          return {
            ...report,
            status: result.normalizedStatus,
            statusClass: toReportStatusClass(result.normalizedStatus),
          }
        }),
      )

      return { ok: true }
    } finally {
      setUpdatingReportKey(null)
    }
  }, [])

  const editReport = useCallback(async (reportKey, draft) => {
    setSavingReportKey(reportKey)

    try {
      const result = await updateReportDetailsInFirestore({ reportKey, draft })
      if (!result.ok) {
        return result
      }

      setReports((current) =>
        current.map((report) => {
          if (report.key !== reportKey) {
            return report
          }

          return {
            ...report,
            ...result.updatedReport,
          }
        }),
      )

      return { ok: true }
    } finally {
      setSavingReportKey(null)
    }
  }, [])

  const deleteReport = useCallback(async ({ reportKey, attachments }) => {
    setDeletingReportKey(reportKey)

    try {
      const result = await deleteReportInFirestore({ reportKey, attachments })
      if (!result.ok) {
        return result
      }

      setReports((current) => current.filter((report) => report.key !== reportKey))
      setSelectedReportKey((current) => (current === reportKey ? null : current))

      return { ok: true }
    } finally {
      setDeletingReportKey(null)
    }
  }, [])

  return {
    reports,
    search,
    setSearch,
    filteredReports,
    isLoading,
    loadError,
    selectedReport,
    selectedReportKey,
    setSelectedReportKey,
    recentActivity,
    summary,
    refreshReports: loadReports,
    updateReportStatus,
    editReport,
    deleteReport,
    updatingReportKey,
    savingReportKey,
    deletingReportKey,
  }
}

export default useReportsData
