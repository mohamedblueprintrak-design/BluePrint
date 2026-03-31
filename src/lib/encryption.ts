/**
 * Encryption Utility for Sensitive Data
 * أداة تشفير البيانات الحساسة
 * 
 * Uses AES-256-GCM for encrypting sensitive data like:
 * - API keys (Stripe, OpenAI, etc.)
 * - 2FA secrets
 * - Personal identifiable information (PII)
 * - Any data that needs to be stored securely
 * 
 * SECURITY: 
 * - ENCRYPTION_KEY must be set in production
 * - Uses AES-256-GCM (Galois/Counter Mode) for authenticated encryption
 * - Each encryption uses a unique IV (Initialization Vector)
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash, pbkdf2Sync } from 'crypto';

// ============================================
// Configuration
// ============================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for AES
const AUTH_TAG_LENGTH = 16; // 128 bits for GCM
const SALT_LENGTH = 64;
const KEY_LENGTH = 32; // 256 bits

/**
 * Get the encryption key from environment
 * SECURITY: Key must be 64 hex characters (32 bytes)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: ENCRYPTION_KEY environment variable is required in production. ' +
        'Generate a secure key with: openssl rand -hex 32'
      );
    }
    
    console.warn(
      '\n⚠️  ENCRYPTION WARNING: ENCRYPTION_KEY is not set. ' +
      'Using development-only key. Set ENCRYPTION_KEY for production.\n'
    );
    
    // Development-only derived key (NOT secure for production)
    return createHash('sha256')
      .update('dev-encryption-key-not-for-production-use')
      .digest();
  }
  
  // Validate key format
  if (!/^[a-f0-9]{64}$/i.test(key)) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate with: openssl rand -hex 32'
    );
  }
  
  return Buffer.from(key, 'hex');
}

// ============================================
// Encryption Functions
// ============================================

/**
 * Encrypt a string value
 * Returns a base64 encoded string containing: salt + iv + authTag + ciphertext
 * 
 * @param plaintext - The data to encrypt
 * @returns Base64 encoded encrypted data
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty value');
  }
  
  const key = getEncryptionKey();
  
  // Generate unique salt and IV for each encryption
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  
  // Derive a unique key for this encryption using PBKDF2
  const derivedKey = pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');
  
  // Create cipher
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });
  
  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  // Combine: salt + iv + authTag + ciphertext
  const result = Buffer.concat([salt, iv, authTag, encrypted]);
  
  return result.toString('base64');
}

/**
 * Decrypt an encrypted value
 * 
 * @param encryptedData - Base64 encoded encrypted data
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty value');
  }
  
  const key = getEncryptionKey();
  
  // Decode base64
  const data = Buffer.from(encryptedData, 'base64');
  
  // Extract components
  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  
  // Derive the same key using PBKDF2
  const derivedKey = pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');
  
  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });
  
  // Set auth tag for verification
  decipher.setAuthTag(authTag);
  
  // Decrypt
  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch {
    throw new Error('Decryption failed: Invalid ciphertext or authentication tag');
  }
}

/**
 * Hash a value using SHA-256 (one-way, for passwords use bcrypt)
 * Useful for creating lookup hashes of encrypted data
 * 
 * @param value - Value to hash
 * @returns Hex encoded hash
 */
export function hashValue(value: string): string {
  return createHash('sha256')
    .update(value)
    .digest('hex');
}

/**
 * Create a secure random token
 * 
 * @param length - Token length in bytes (default 32)
 * @returns Hex encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Mask a sensitive value for display (e.g., API keys)
 * 
 * @param value - Value to mask
 * @param visibleChars - Number of characters to show at start and end
 * @returns Masked value
 */
export function maskSensitiveValue(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars * 2) {
    return '****';
  }
  
  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  const masked = '*'.repeat(Math.min(value.length - visibleChars * 2, 20));
  
  return `${start}${masked}${end}`;
}

// ============================================
// Object Encryption Helpers
// ============================================

/**
 * Encrypt specific fields in an object
 * 
 * @param obj - Object containing data
 * @param fields - Array of field names to encrypt
 * @returns Object with encrypted fields
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T, 
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string' && value) {
      (result as Record<string, unknown>)[field as string] = encrypt(value);
    }
  }
  
  return result;
}

/**
 * Decrypt specific fields in an object
 * 
 * @param obj - Object containing encrypted data
 * @param fields - Array of field names to decrypt
 * @returns Object with decrypted fields
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T, 
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string' && value) {
      try {
        (result as Record<string, unknown>)[field as string] = decrypt(value);
      } catch {
        // Keep original value if decryption fails (might not be encrypted)
      }
    }
  }
  
  return result;
}

// ============================================
// Validation
// ============================================

/**
 * Check if a value appears to be encrypted
 * Encrypted values are base64 encoded and have specific length
 * 
 * @param value - Value to check
 * @returns True if value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  
  // Check if it's valid base64
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  if (!base64Regex.test(value)) return false;
  
  try {
    const buffer = Buffer.from(value, 'base64');
    // Encrypted values have: salt(64) + iv(16) + authTag(16) + ciphertext
    // Minimum length: 64 + 16 + 16 + 1 = 97 bytes
    return buffer.length >= 97;
  } catch {
    return false;
  }
}

/**
 * Test encryption/decryption (for setup verification)
 * 
 * @returns True if encryption is working correctly
 */
export function testEncryption(): boolean {
  try {
    const testValue = 'test-encryption-value-123';
    const encrypted = encrypt(testValue);
    const decrypted = decrypt(encrypted);
    return decrypted === testValue;
  } catch {
    return false;
  }
}
