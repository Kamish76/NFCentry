import crypto from 'crypto';

/**
 * Encryption utility for securely storing sensitive data like OAuth tokens.
 * Uses AES-256-GCM for authenticated encryption.
 * 
 * Environment variable required:
 * - ENCRYPTION_SECRET: 32-byte (64 hex characters) secret key
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get the encryption key from environment variables.
 * Throws an error if not configured.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  
  if (!secret) {
    throw new Error(
      'ENCRYPTION_SECRET environment variable is not set. ' +
      'Generate a 32-byte hex string using: openssl rand -hex 32'
    );
  }
  
  // Validate that the secret is a valid hex string of correct length
  if (!/^[a-fA-F0-9]{64}$/.test(secret)) {
    throw new Error(
      'ENCRYPTION_SECRET must be a 64-character hex string (32 bytes). ' +
      'Generate one using: openssl rand -hex 32'
    );
  }
  
  return Buffer.from(secret, 'hex');
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string containing: IV + AuthTag + Ciphertext
 * 
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted string
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  
  // Generate a random IV for each encryption
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher and encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // Get the authentication tag
  const authTag = cipher.getAuthTag();
  
  // Combine IV + AuthTag + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  
  return combined.toString('base64');
}

/**
 * Decrypt a previously encrypted string.
 * Expects base64-encoded input containing: IV + AuthTag + Ciphertext
 * 
 * @param encryptedData - Base64-encoded encrypted string
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails (invalid data or tampered)
 */
export function decryptToken(encryptedData: string): string {
  const key = getEncryptionKey();
  
  // Decode from base64
  const combined = Buffer.from(encryptedData, 'base64');
  
  // Validate minimum length (IV + AuthTag + at least 1 byte of data)
  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error('Invalid encrypted data: too short');
  }
  
  // Extract IV, AuthTag, and Ciphertext
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  // Create decipher and decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}

/**
 * Check if encryption is properly configured.
 * Useful for health checks or startup validation.
 * 
 * @returns true if ENCRYPTION_SECRET is properly configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}
