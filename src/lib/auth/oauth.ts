import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { getSecretKey } from './token'

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

/**
 * Resolves the canonical OAuth redirect URI for Google.
 * Strips any trailing slashes and detects production URLs.
 */
export function getOAuthRedirectUri(request?: NextRequest): string {
  // 1. Explicit app URL from env (stripping trailing slash)
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (envUrl && envUrl.trim() !== '') {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '')
    const base = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`
    return `${base}/api/auth/oauth/google/callback`
  }

  // 2. Vercel deployment URLs (production or branch)
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  if (vercelUrl && vercelUrl.trim() !== '') {
    const cleanVercel = vercelUrl.trim().replace(/\/+$/, '')
    return `https://${cleanVercel}/api/auth/oauth/google/callback`
  }

  // 3. Fallback to incoming request headers/origin
  if (request) {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
    if (host) {
      const proto =
        request.headers.get('x-forwarded-proto') ||
        (request.nextUrl.protocol.replace(':', '') || 'https')
      return `${proto}://${host}/api/auth/oauth/google/callback`
    }
    return `${request.nextUrl.origin}/api/auth/oauth/google/callback`
  }

  return 'http://localhost:3000/api/auth/oauth/google/callback'
}

/**
 * Creates a cryptographically signed OAuth state string.
 * This ensures that even if cross-domain cookies are dropped or partitioned
 * on cloud redirects, the returned callback state can be validated safely.
 */
export function createSignedOAuthState(next: string): { state: string; rawStateId: string } {
  const rawStateId = crypto.randomUUID()
  const secret = getSecretKey()
  const payload = JSON.stringify({
    id: rawStateId,
    next: sanitizeNext(next),
    ts: Date.now(),
  })
  const b64 = Buffer.from(payload).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(b64).digest('base64url')
  return {
    state: `${b64}.${sig}`,
    rawStateId,
  }
}

/**
 * Validates a signed OAuth state string and returns the payload if valid and unexpired.
 */
export function verifySignedOAuthState(
  stateString?: string | null
): { rawStateId: string; next: string } | null {
  if (!stateString || !stateString.includes('.')) return null
  const [b64, sig] = stateString.split('.')
  if (!b64 || !sig) return null

  try {
    const secret = getSecretKey()
    const expectedSig = crypto.createHmac('sha256', secret).update(b64).digest('base64url')
    const sigBuffer = Buffer.from(sig)
    const expectedBuffer = Buffer.from(expectedSig)

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null
    }

    const payloadStr = Buffer.from(b64, 'base64url').toString('utf8')
    const payload = JSON.parse(payloadStr)

    // Verify timestamp within max age (10 minutes)
    if (!payload.ts || Date.now() - payload.ts > OAUTH_STATE_MAX_AGE_SECONDS * 1000) {
      return null
    }

    return {
      rawStateId: payload.id,
      next: sanitizeNext(payload.next),
    }
  } catch {
    return null
  }
}
