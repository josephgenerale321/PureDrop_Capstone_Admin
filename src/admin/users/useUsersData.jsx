import { useEffect, useMemo, useState } from 'react'
import {
  createUserAccountInFirestore,
  deleteUserAccountInFirestore,
  getUsersLoadErrorMessage,
  subscribeUsers,
  updateUserAccountInFirestore,
} from './usersService.js'
import { resolvePresenceStatus } from './presenceStatus.js'

const PRESENCE_REFRESH_INTERVAL_MS = 60 * 1000

function useUsersData(search) {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [savingUserId, setSavingUserId] = useState('')
  const [deletingUserId, setDeletingUserId] = useState('')
  const [creatingUserEmail, setCreatingUserEmail] = useState('')
  const [presenceNowMs, setPresenceNowMs] = useState(() => Date.now())

  useEffect(() => {
    setIsLoading(true)
    setLoadError('')

    const unsubscribe = subscribeUsers({
      onUsers: (mappedUsers) => {
        setUsers(mappedUsers)
        setSelectedUserId((current) => {
          if (current && mappedUsers.some((user) => user.id === current)) {
            return current
          }
          return mappedUsers[0]?.id || null
        })
        setIsLoading(false)
      },
      onError: (error) => {
        setLoadError(getUsersLoadErrorMessage(error))
        setUsers([])
        setIsLoading(false)
      },
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPresenceNowMs(Date.now())
    }, PRESENCE_REFRESH_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [])

  const liveUsers = useMemo(() => {
    return users.map((user) => ({
      ...user,
      status: resolvePresenceStatus({
        status: user.presenceStatusRaw || user.status,
        presenceUpdatedAt: user.presenceUpdatedAtMs,
        lastSeenAt: user.lastSeenAtMs,
        lastActiveAt: user.lastActiveAtMs,
        nowMs: presenceNowMs,
      }),
    }))
  }, [presenceNowMs, users])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return liveUsers
    }

    return liveUsers.filter((user) => {
      return [user.id, user.name, user.email, user.role, user.status].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query),
      )
    })
  }, [liveUsers, search])

  const selectedUser = useMemo(() => {
    if (!selectedUserId) {
      return null
    }
    return liveUsers.find((user) => user.id === selectedUserId) || null
  }, [liveUsers, selectedUserId])

  const toggleStatus = (id) => {
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== id) {
          return user
        }
        return { ...user, status: user.status === 'Active' ? 'Suspended' : 'Active' }
      }),
    )
  }

  const updateUserAccount = async (id, updates) => {
    if (!id) {
      return {
        ok: false,
        error: 'Select a user first.',
      }
    }

    setSavingUserId(id)
    try {
      const result = await updateUserAccountInFirestore({ id, updates, users })
      if (!result.ok) {
        return result
      }

      if (result.updatedUser) {
        setUsers((current) =>
          current.map((user) => {
            if (user.id !== id) {
              return user
            }

            return {
              ...user,
              ...result.updatedUser,
            }
          }),
        )
      }

      return { ok: true }
    } finally {
      setSavingUserId('')
    }
  }

  const createUserAccount = async (payload) => {
    const email = String(payload?.email || '')
      .trim()
      .toLowerCase()

    setCreatingUserEmail(email)
    try {
      const result = await createUserAccountInFirestore(payload)
      if (result.ok && result.uid) {
        setSelectedUserId(result.uid)
      }
      return result
    } finally {
      setCreatingUserEmail('')
    }
  }

  const deleteUserAccount = async (id) => {
    if (!id) {
      return {
        ok: false,
        error: 'Select a user first.',
      }
    }

    setDeletingUserId(id)
    try {
      const result = await deleteUserAccountInFirestore({ id, users })
      if (!result.ok) {
        return result
      }

      setUsers((current) => {
        const nextUsers = current.filter((user) => user.id !== id)
        setSelectedUserId((currentSelectedUserId) => {
          if (currentSelectedUserId !== id) {
            return currentSelectedUserId
          }
          return nextUsers[0]?.id || null
        })
        return nextUsers
      })

      return result
    } finally {
      setDeletingUserId('')
    }
  }

  return {
    filteredUsers,
    isLoading,
    loadError,
    selectedUser,
    selectedUserId,
    setSelectedUserId,
    toggleStatus,
    createUserAccount,
    updateUserAccount,
    deleteUserAccount,
    creatingUserEmail,
    savingUserId,
    deletingUserId,
  }
}

export default useUsersData
