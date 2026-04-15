import { useEffect } from 'react'

import {
  useAuthError,
  useAuthLoading,
  useAuthStore,
  useAuthUser,
  useIsAuthenticated,
} from '@/store/auth-store'
import { getUserTypeFlags } from '@/types/auth'

export function useAuth() {
  const user = useAuthUser()
  const isLoading = useAuthLoading()
  const error = useAuthError()
  const isAuthenticated = useIsAuthenticated()
  const initialize = useAuthStore((state) => state.initialize)
  const refreshProfile = useAuthStore((state) => state.refreshProfile)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    isHydrated,
    refreshProfile,
    clearAuth,
    ...getUserTypeFlags(user),
  }
}
