import crypto from 'crypto'

export * from './token'
export * from './oauth'

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derivedKey}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false
  const [salt, key] = storedHash.split(':')
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derivedKey, 'hex'))
}
