export const SESSION_COOKIE_NAME = 'neon_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

export interface SessionUser {
  id: string
  email: string
  user_type?: string
  name?: string
}

function getSecretKey(): string {
  return (
    process.env.NEON_AUTH_COOKIE_SECRET ||
    process.env.DATABASE_URL ||
    'nfcentry-neon-hardened-session-secret-key-32chars'
  )
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlToBytes(str: string): Uint8Array {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) {
    b64 += '='
  }
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const secret = getSecretKey()
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    exp,
  })

  const enc = new TextEncoder()
  const payloadB64 = bytesToBase64Url(enc.encode(payload))
  const key = await getCryptoKey(secret)
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(payloadB64)
  )
  const signatureB64 = bytesToBase64Url(new Uint8Array(signatureBuffer))

  return `${payloadB64}.${signatureB64}`
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  if (!token || !token.includes('.')) return null
  const [payloadB64, signatureB64] = token.split('.')
  if (!payloadB64 || !signatureB64) return null

  try {
    const secret = getSecretKey()
    const key = await getCryptoKey(secret)
    const sigBytes = base64UrlToBytes(signatureB64)
    const enc = new TextEncoder()

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      enc.encode(payloadB64)
    )

    if (!isValid) return null

    const dec = new TextDecoder()
    const payloadStr = dec.decode(base64UrlToBytes(payloadB64))
    const payload = JSON.parse(payloadStr)

    if (!payload.id || !payload.email) return null
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return {
      id: payload.id,
      email: payload.email,
    }
  } catch {
    return null
  }
}
