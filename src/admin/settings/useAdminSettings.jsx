import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../../firebase.js'

const SETTINGS_STORAGE_KEY = 'puredrop_admin_settings'
const ADMIN_PROFILE_COLLECTION = 'admin_user'
const ACTIVITY_COLLECTION = 'admin_activity'

const DEFAULT_SETTINGS = {
  general: {
    fullName: '',
    email: '',
    address: '',
  },
  security: {
    lockoutMinutes: 10,
    twoFactorEnabled: false,
    maxLoginAttempts: 5,
  },
  notifications: {
    reportEmailTypes: {
      noWater: true,
      dirtyWater: true,
      waterLeaking: false,
      infrastructure: false,
    },
    systemHealthAlerts: 'enable',
    weeklySummaryEmail: 'webvi.puredrop.com',
  },
  roles: [
    {
      id: 'admin',
      name: 'Admin',
      permissions: { edit: true, process: true, admin: true, view: true, close: true },
    },
    {
      id: 'manager',
      name: 'Manager',
      permissions: { edit: false, process: true, admin: false, view: true, close: false },
    },
    {
      id: 'viewer',
      name: 'Viewer',
      permissions: { edit: false, process: false, admin: false, view: true, close: false },
    },
  ],
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const cloneSettings = (value) => JSON.parse(JSON.stringify(value))

const mergeSettingsWithDefaults = (parsed = {}) => ({
  ...cloneSettings(DEFAULT_SETTINGS),
  ...parsed,
  general: { ...DEFAULT_SETTINGS.general, ...parsed.general },
  security: { ...DEFAULT_SETTINGS.security, ...parsed.security },
  notifications: {
    ...DEFAULT_SETTINGS.notifications,
    ...parsed.notifications,
    reportEmailTypes: {
      ...DEFAULT_SETTINGS.notifications.reportEmailTypes,
      ...parsed?.notifications?.reportEmailTypes,
    },
  },
  roles: Array.isArray(parsed.roles) && parsed.roles.length ? parsed.roles : cloneSettings(DEFAULT_SETTINGS.roles),
})

const readStoredSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) {
      return cloneSettings(DEFAULT_SETTINGS)
    }
    return mergeSettingsWithDefaults(JSON.parse(raw))
  } catch {
    return cloneSettings(DEFAULT_SETTINGS)
  }
}

const toRoleId = (value) =>
  String(value || 'new-role')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'new-role'

const validateSettings = (settings) => {
  const errors = {}

  if (!settings.general.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  }
  if (settings.general.email && !EMAIL_RE.test(settings.general.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (settings.general.address.trim() && settings.general.address.trim().length < 5) {
    errors.address = 'Address looks too short.'
  }
  if (settings.notifications.weeklySummaryEmail && !EMAIL_RE.test(settings.notifications.weeklySummaryEmail)) {
    errors.weeklySummaryEmail = 'Enter a valid summary email.'
  }
  if (!Number.isFinite(settings.security.lockoutMinutes) || settings.security.lockoutMinutes < 1) {
    errors.lockoutMinutes = 'Lockout must be at least 1 minute.'
  }
  if (!Number.isFinite(settings.security.maxLoginAttempts) || settings.security.maxLoginAttempts < 1) {
    errors.maxLoginAttempts = 'Max attempts must be at least 1.'
  }

  const rolesWithView = settings.roles.filter((role) => role.permissions.view)
  if (settings.roles.length > 0 && rolesWithView.length === 0) {
    errors.roles = 'At least one role must keep view access.'
  }

  return errors
}

function useAdminSettings(user) {
  const [settings, setSettings] = useState(() => readStoredSettings())
  const [recentActivity, setRecentActivity] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' })

  const pushActivity = (title) => {
    setRecentActivity((current) => [{ id: `${Date.now()}-${Math.random()}`, title, timeAgo: 'Just now' }, ...current].slice(0, 8))
  }

  const loadActivity = async () => {
    if (!user?.uid) return
    try {
      const activityQuery = query(
        collection(db, ACTIVITY_COLLECTION, user.uid, 'events'),
        orderBy('createdAt', 'desc'),
        limit(8),
      )
      const snapshot = await getDocs(activityQuery)
      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          title: data.title || 'Activity',
          timeAgo: data.timeAgo || 'Just now',
        }
      })
      if (items.length) {
        setRecentActivity(items)
      }
    } catch {
      // Activity is non-critical; keep whatever is in state.
    }
  }

  const recordActivity = async (title) => {
    pushActivity(title)
    if (!user?.uid) return
    try {
      await setDoc(doc(collection(db, ACTIVITY_COLLECTION, user.uid, 'events')), {
        title,
        timeAgo: 'Just now',
        createdAt: serverTimestamp(),
      })
    } catch {
      // Best-effort persistence; ignore failures.
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadAdminSettings = async () => {
      if (!user?.uid) {
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)

      try {
        const adminDocSnap = await getDoc(doc(db, ADMIN_PROFILE_COLLECTION, user.uid))
        if (!isMounted) {
          return
        }

        const stored = readStoredSettings()
        if (!adminDocSnap.exists()) {
          setSettings({
            ...stored,
            general: {
              ...stored.general,
              email: user.email || stored.general.email,
            },
          })
          return
        }

        const adminData = adminDocSnap.data()
        const remoteSettings = mergeSettingsWithDefaults(adminData.settings || {})

        setSettings({
          ...remoteSettings,
          general: {
            fullName: adminData.fullName || remoteSettings.general.fullName,
            email: adminData.email || user.email || remoteSettings.general.email,
            address: adminData.address || adminData.location || remoteSettings.general.address,
          },
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        const fallback = readStoredSettings()
        setSettings({
          ...fallback,
          general: {
            ...fallback.general,
            email: user.email || fallback.general.email,
          },
        })

        if (error?.code === 'permission-denied') {
          setSaveStatus({ type: 'error', message: 'Unable to load admin settings: permission denied by Firestore rules.' })
        } else {
          setSaveStatus({ type: 'error', message: 'Unable to load admin settings right now.' })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAdminSettings()
    loadActivity()

    return () => {
      isMounted = false
    }
  }, [user?.uid, user?.email])

  const setGeneralField = (field, value) => {
    setSettings((current) => ({
      ...current,
      general: {
        ...current.general,
        [field]: value,
      },
    }))
  }

  const setSecurityField = (field, value) => {
    setSettings((current) => ({
      ...current,
      security: {
        ...current.security,
        [field]: value,
      },
    }))
  }

  const toggleReportEmailType = (key) => {
    setSettings((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        reportEmailTypes: {
          ...current.notifications.reportEmailTypes,
          [key]: !current.notifications.reportEmailTypes[key],
        },
      },
    }))
  }

  const setSystemHealthAlerts = (value) => {
    setSettings((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        systemHealthAlerts: value,
      },
    }))
  }

  const setWeeklySummaryEmail = (value) => {
    setSettings((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        weeklySummaryEmail: value,
      },
    }))
  }

  const setRoleName = (roleId, value) => {
    setSettings((current) => ({
      ...current,
      roles: current.roles.map((role) => (role.id === roleId ? { ...role, name: value } : role)),
    }))
  }

  const toggleRolePermission = (roleId, permissionKey) => {
    setSettings((current) => {
      // Prevent removing view access from every role (would lock staff out).
      if (permissionKey === 'view') {
        const role = current.roles.find((item) => item.id === roleId)
        const currentlyEnabled = Boolean(role?.permissions?.view)
        const otherRolesHaveView = current.roles.some((item) => item.id !== roleId && item.permissions.view)
        if (currentlyEnabled && !otherRolesHaveView) {
          setSaveStatus({ type: 'error', message: 'At least one role must keep view access.' })
          return current
        }
      }

      return {
        ...current,
        roles: current.roles.map((role) =>
          role.id === roleId
            ? {
                ...role,
                permissions: {
                  ...role.permissions,
                  [permissionKey]: !role.permissions[permissionKey],
                },
              }
            : role,
        ),
      }
    })
  }

  const addRole = (name) => {
    const trimmedName = String(name || '').trim()
    if (!trimmedName) {
      setSaveStatus({ type: 'error', message: 'Enter a role name before adding a role.' })
      return
    }

    setSettings((current) => {
      const baseId = toRoleId(trimmedName)
      const candidateIds = new Set(current.roles.map((role) => role.id))

      let nextId = baseId
      let suffix = 1
      while (candidateIds.has(nextId)) {
        suffix += 1
        nextId = `${baseId}-${suffix}`
      }

      return {
        ...current,
        roles: [
          ...current.roles,
          {
            id: nextId,
            name: trimmedName,
            permissions: { edit: false, process: false, admin: false, view: true, close: false },
          },
        ],
      }
    })

    setSaveStatus({ type: 'success', message: `Role "${trimmedName}" added.` })
    recordActivity(`Role "${trimmedName}" added`)
  }

  const deleteRole = (roleId) => {
    setSettings((current) => {
      const role = current.roles.find((item) => item.id === roleId)
      if (!role) return current
      if (role.id === 'admin') {
        setSaveStatus({ type: 'error', message: 'The Admin role cannot be deleted.' })
        return current
      }

      const remainingWithView = current.roles.some((item) => item.id !== roleId && item.permissions.view)
      if (!remainingWithView) {
        setSaveStatus({ type: 'error', message: 'Cannot delete the only role with view access.' })
        return current
      }

      recordActivity(`Role "${role.name}" deleted`)
      setSaveStatus({ type: 'success', message: `Role "${role.name}" deleted.` })
      return {
        ...current,
        roles: current.roles.filter((item) => item.id !== roleId),
      }
    })
  }

  const saveSettings = async () => {
    if (!user?.uid) {
      setSaveStatus({ type: 'error', message: 'No active admin session.' })
      return false
    }

    const errors = validateSettings(settings)
    if (Object.keys(errors).length > 0) {
      setSaveStatus({ type: 'error', message: Object.values(errors)[0] })
      setFieldErrors(errors)
      return false
    }

    setFieldErrors({})
    setIsSaving(true)
    setSaveStatus({ type: '', message: '' })

    try {
      const settingsToPersist = {
        security: settings.security,
        notifications: settings.notifications,
        roles: settings.roles,
      }

      await setDoc(
        doc(db, ADMIN_PROFILE_COLLECTION, user.uid),
        {
          uid: user.uid,
          email: user.email || settings.general.email || '',
          fullName: settings.general.fullName.trim(),
          address: settings.general.address.trim(),
          role: 'admin',
          updatedAt: serverTimestamp(),
          settings: settingsToPersist,
        },
        { merge: true },
      )

      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          ...settings,
          general: {
            ...settings.general,
            email: user.email || settings.general.email || '',
          },
        }),
      )

      setSaveStatus({ type: 'success', message: 'Settings saved successfully.' })
      recordActivity('Settings saved')
      return true
    } catch (error) {
      if (error?.code === 'permission-denied') {
        setSaveStatus({ type: 'error', message: 'Save failed: permission denied by Firestore rules.' })
      } else {
        setSaveStatus({ type: 'error', message: 'Unable to save settings right now.' })
      }
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const restoreDefaults = () => {
    setSettings((current) => ({
      ...cloneSettings(DEFAULT_SETTINGS),
      general: {
        ...current.general,
        email: user?.email || current.general.email,
      },
    }))
    setFieldErrors({})
    setSaveStatus({ type: 'success', message: 'Default settings restored (profile details kept).' })
    recordActivity('Restored system default settings')
  }

  const exportSettings = () => {
    try {
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `puredrop-admin-settings-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(link.href)
      setSaveStatus({ type: 'success', message: 'Configuration export started.' })
    } catch {
      setSaveStatus({ type: 'error', message: 'Export failed. Please try again.' })
    }
  }

  const bulkEnableViewPermission = () => {
    setSettings((current) => ({
      ...current,
      roles: current.roles.map((role) => ({
        ...role,
        permissions: {
          ...role.permissions,
          view: true,
        },
      })),
    }))
    setSaveStatus({ type: 'success', message: 'Bulk permission update applied (view access enabled).' })
    recordActivity('Bulk user permissions updated')
  }

  return {
    settings,
    recentActivity,
    isLoading,
    isSaving,
    saveStatus,
    fieldErrors,
    setGeneralField,
    setSecurityField,
    toggleReportEmailType,
    setSystemHealthAlerts,
    setWeeklySummaryEmail,
    setRoleName,
    toggleRolePermission,
    addRole,
    deleteRole,
    saveSettings,
    restoreDefaults,
    exportSettings,
    bulkEnableViewPermission,
  }
}

export default useAdminSettings
