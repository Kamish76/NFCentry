import type { User } from '@/types/user'
import type { OrganizationRole } from '@/types/organization'

export type OrganizationPermission =
  | 'canManageOrganization'
  | 'canDeleteOrganization'
  | 'canManageMembers'
  | 'canManageEvents'
  | 'canTakeAttendance'
  | 'canViewAttendance'

export interface AuthSessionSnapshot {
  authUserId: string | null
  email: string | null
}

export interface UserTypeFlags {
  isStudent: boolean
  isFaculty: boolean
}

export interface OrganizationRoleFlags {
  isOwner: boolean
  isAdmin: boolean
  isAttendanceTaker: boolean
  isMember: boolean
}

export interface AuthState {
  user: User | null
  session: AuthSessionSnapshot | null
  isAuthenticated: boolean
  isLoading: boolean
  isHydrated: boolean
  error: string | null
  lastFetchedAt: number | null
}

export interface AuthActions {
  setUser: (user: User | null) => void
  setSession: (session: AuthSessionSnapshot | null) => void
  setLoading: (isLoading: boolean) => void
  clearAuth: () => void
  initialize: (force?: boolean) => Promise<void>
  refreshProfile: () => Promise<void>
  updateUser: (patch: Partial<User>) => void
  markHydrated: () => void
}

export type AuthStore = AuthState & AuthActions

export function getUserTypeFlags(user: User | null): UserTypeFlags {
  return {
    isStudent: user?.user_type === 'Student',
    isFaculty: user?.user_type === 'Faculty',
  }
}

export function getOrganizationRoleFlags(
  role: OrganizationRole | null | undefined
): OrganizationRoleFlags {
  return {
    isOwner: role === 'Owner',
    isAdmin: role === 'Admin',
    isAttendanceTaker: role === 'Attendance Taker',
    isMember: role === 'Member',
  }
}
