export const OAUTH_STATE_COOKIE_NAME = 'google_oauth_state'
export const OAUTH_STATE_MAX_AGE_SECONDS = 600 // 10 minutes

export interface OAuthStatePayload {
  state: string
  next: string
}

export function sanitizeNext(next?: string | null): string {
  if (!next) return '/dashboard'
  if (next.startsWith('/') && !next.startsWith('//')) {
    return next
  }
  return '/dashboard'
}
