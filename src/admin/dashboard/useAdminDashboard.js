import { useEffect, useMemo, useState } from 'react'
import { collection, collectionGroup, doc, getDoc, getDocs } from 'firebase/firestore'
import { auth, db } from '../../firebase.js'
import {
  createInitialDashboard,
  formatDateTime,
  formatTimeAgo,
  getInitials,
  isAdminProfile,
  isSameDate,
  normalizeStatus,
  toDateValue,
  toStatusClass,
} from './dashboardUtils.js'

const ADMIN_COLLECTION = 'admin_user'
const USERS_COLLECTION = 'regular_user'
const REPORTS_COLLECTION = 'reports'

const mapReports = (reportDocs) =>
  reportDocs
    .map((docSnap) => {
      const data = docSnap.data()
      const submittedAtDate = toDateValue(data.createdAt) || toDateValue(data.submittedAt) || toDateValue(data.updatedAt)
      const statusUpdatedAtDate = toDateValue(data.statusUpdatedAt) || toDateValue(data.updatedAt) || submittedAtDate
      const status = normalizeStatus(data.status)
      const reportId = data.reportId || docSnap.id
      const reporterName = data.reporterName || 'Unknown Reporter'
      const location = data.location || data.address || 'N/A'
      const statusUpdatedBy = String(data.statusUpdatedBy || '').trim().toLowerCase()

      return {
        key: docSnap.ref.path,
        reportId,
        reporterName,
        category: data.category || 'Uncategorized',
        status,
        statusClass: toStatusClass(status),
        location,
        submittedAtDate,
        submittedAtMs: submittedAtDate ? submittedAtDate.getTime() : 0,
        submittedAtLabel: formatDateTime(submittedAtDate),
        statusUpdatedAtDate,
        statusUpdatedAtMs: statusUpdatedAtDate ? statusUpdatedAtDate.getTime() : 0,
        statusUpdatedAtLabel: formatDateTime(statusUpdatedAtDate),
        statusUpdatedBy,
      }
    })
    .sort((left, right) => right.submittedAtMs - left.submittedAtMs)

const getSystemStatus = (openReports, totalReports) => {
  if (openReports > Math.max(5, Math.ceil(totalReports * 0.4))) {
    return { systemStatusLabel: 'Needs Attention', systemStatusClass: 'warning' }
  }
  if (openReports > 0) {
    return { systemStatusLabel: 'Operational', systemStatusClass: 'operational' }
  }
  return { systemStatusLabel: 'Healthy', systemStatusClass: 'healthy' }
}

const buildRecentActivity = (reports) =>
  [...reports]
    .sort((left, right) => right.statusUpdatedAtMs - left.statusUpdatedAtMs)
    .slice(0, 6)
    .map((report) => {
      const label =
        report.statusUpdatedBy === 'admin'
          ? `Status updated: REP-${report.reportId} is now ${report.status}`
          : `Report submitted: REP-${report.reportId}`

      return {
        id: `${report.key}-activity`,
        label,
        meta: `${report.reporterName} - ${report.location}`,
        timeAgo: formatTimeAgo(report.statusUpdatedAtDate),
      }
    })

function useAdminDashboard(user) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isAccessDenied, setIsAccessDenied] = useState(false)
  const [adminName, setAdminName] = useState('')
  const [dashboard, setDashboard] = useState(createInitialDashboard)

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      if (!user?.uid) {
        if (isMounted) {
          setIsLoading(false)
          setIsAccessDenied(true)
        }
        return
      }

      setIsLoading(true)
      setLoadError('')
      setIsAccessDenied(false)

      try {
        const [tokenResult, adminProfileSnap, usersSnap, reportsSnap] = await Promise.all([
          auth.currentUser?.getIdTokenResult().catch(() => null),
          getDoc(doc(db, ADMIN_COLLECTION, user.uid)),
          getDocs(collection(db, USERS_COLLECTION)),
          getDocs(collectionGroup(db, REPORTS_COLLECTION)),
        ])

        if (!isMounted) {
          return
        }

        const hasAdminClaim = tokenResult?.claims?.admin === true || tokenResult?.claims?.role === 'admin'
        const adminProfileData = adminProfileSnap.exists() ? adminProfileSnap.data() : null
        const hasAdminDoc = adminProfileSnap.exists() && isAdminProfile(adminProfileData)

        if (!hasAdminClaim && !hasAdminDoc) {
          setIsAccessDenied(true)
          setLoadError('Access denied. This dashboard is for admin accounts only.')
          setDashboard((current) => ({ ...current, recentReports: [], recentActivity: [] }))
          setIsLoading(false)
          return
        }

        setAdminName(adminProfileData?.fullName || user.email || 'Administrator')

        const mappedReports = mapReports(reportsSnap.docs)
        const totalReports = mappedReports.length
        const totalUsers = usersSnap.size
        const openReports = mappedReports.filter((report) => report.status !== 'Resolved').length
        const resolvedReports = mappedReports.filter((report) => report.status === 'Resolved').length
        const reportsToday = mappedReports.filter((report) => isSameDate(report.submittedAtDate, new Date())).length
        const { systemStatusLabel, systemStatusClass } = getSystemStatus(openReports, totalReports)

        setDashboard({
          totalUsers,
          totalReports,
          openReports,
          resolvedReports,
          reportsToday,
          lastReportAtLabel: mappedReports[0]?.submittedAtLabel || 'N/A',
          systemStatusLabel,
          systemStatusClass,
          recentReports: mappedReports.slice(0, 8),
          recentActivity: buildRecentActivity(mappedReports),
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (error?.code === 'permission-denied') {
          setLoadError('Unable to load dashboard: permission denied by Firestore rules.')
        } else {
          setLoadError('Unable to load dashboard data right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [user?.uid, user?.email])

  const adminInitials = useMemo(() => getInitials(adminName || user?.email || 'Administrator'), [adminName, user?.email])

  return {
    isLoading,
    loadError,
    isAccessDenied,
    adminName,
    adminInitials,
    dashboard,
  }
}

export default useAdminDashboard
