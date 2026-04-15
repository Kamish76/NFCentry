import { useEffect, useState } from 'react'
import {
  useAuthError,
  useAuthLoading,
  useAuthStore,
  useAuthUser,
} from '@/store/auth-store'
import type { User } from '@/types/user'

interface UseUserProfileReturn {
  user: User | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUserProfile(): UseUserProfileReturn {
  const user = useAuthUser()
  const loading = useAuthLoading()
  const error = useAuthError()
  const initialize = useAuthStore((state) => state.initialize)
  const refreshProfile = useAuthStore((state) => state.refreshProfile)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return { user, loading, error, refetch: refreshProfile }
}

interface UseProfileStatusReturn {
  hasProfile: boolean
  loading: boolean
  error: string | null
  authId: string | null
  email: string | null
}

/** @deprecated Use useAuth instead. */
export function useProfileStatus(): UseProfileStatusReturn {
  const [hasProfile, setHasProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authId, setAuthId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/user/profile-status')
        const data = await response.json()

        if (response.ok) {
          setHasProfile(data.hasProfile)
          setAuthId(data.authId || null)
          setEmail(data.email || null)
        } else {
          setError(data.error || 'Failed to check profile status')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    checkProfileStatus()
  }, [])

  return { hasProfile, loading, error, authId, email }
}
