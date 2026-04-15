'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { ROLE_PERMISSIONS, type OrganizationRole } from '@/types/organization'
import {
  getOrganizationRoleFlags,
  getUserTypeFlags,
  type AuthSessionSnapshot,
  type AuthStore,
  type OrganizationPermission,
} from '@/types/auth'

const initialState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  error: null,
  lastFetchedAt: null,
} as const

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: Boolean(user),
          error: null,
          lastFetchedAt: Date.now(),
        }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      clearAuth: () =>
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastFetchedAt: Date.now(),
        }),
      markHydrated: () => set({ isHydrated: true }),
      updateUser: (patch) => {
        const current = get().user

        if (!current) {
          return
        }

        const updated = {
          ...current,
          ...patch,
        }

        set({ user: updated, lastFetchedAt: Date.now(), error: null })
      },
      initialize: async (force = false) => {
        const state = get()

        if (state.isLoading) {
          return
        }

        if (!force && state.isAuthenticated && state.user) {
          return
        }

        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/user/profile', {
            method: 'GET',
            cache: 'no-store',
          })

          if (response.status === 401) {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              lastFetchedAt: Date.now(),
            })
            return
          }

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch profile')
          }

          const user = data.user ?? null
          const session: AuthSessionSnapshot | null = user
            ? {
                authUserId: user.id,
                email: user.email,
              }
            : null

          set({
            user,
            session,
            isAuthenticated: Boolean(user),
            isLoading: false,
            error: null,
            lastFetchedAt: Date.now(),
          })
        } catch (error) {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'An error occurred',
            lastFetchedAt: Date.now(),
          })
        }
      },
      refreshProfile: async () => {
        await get().initialize(true)
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        lastFetchedAt: state.lastFetchedAt,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          state.markHydrated()
          if (error) {
            state.clearAuth()
          }
        }
      },
    }
  )
)

export const useAuthUser = () => useAuthStore((state) => state.user)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthError = () => useAuthStore((state) => state.error)
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated)

export function hasOrganizationPermission(
  role: OrganizationRole | null | undefined,
  permission: OrganizationPermission
): boolean {
  if (!role) {
    return false
  }

  return ROLE_PERMISSIONS[role][permission]
}

export function useUserTypeFlags() {
  const user = useAuthUser()
  return getUserTypeFlags(user)
}

export function useOrganizationRoleFlags(role: OrganizationRole | null | undefined) {
  return getOrganizationRoleFlags(role)
}
