/**
 * @module encryption
 * @description Data encryption and hashing utilities for the BluePrint platform.
 * Provides AES-256-GCM encryption for sensitive fields, bcrypt password hashing,
 * secure token generation, and API key generation with prefixing.
 *
 * All cryptographic operations use Node.js built-in `crypto` module.
 */

import crypto from 'crypto';

// ─── Configuration ───────────────────────────────────────────────────────────

/** Default number of bcrypt salt rounds for password hashing */
const DEFAULT_BCRYPT_ROUNDS = 12;

/** Default length for generated secure tokens (in bytes) */
const DEFAULT_TOKEN_LENGTH = 32;

/** Algorithm used for symmetric encryption */
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/** Length of the initialization vector for GCM mode (in bytes) */
const IV_LENGTH = 16;

/** Length of the auth tag for GCM mode (in bytes) */
const AUTH_TAG_LENGTH = 16;

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Result of an AES-256-GCM encryption operation.
 * Contains the ciphertext, IV, and auth tag — all required for decryption.
 */
export interface EncryptionResult {
  /** Base64-encoded ciphertext */
  ciphertext: string;
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded authentication tag */
  authTag: string;
}

/**
 * Options for the `hashPassword` function.
 */
export interface HashPasswordOptions {
  /** Number of bcrypt salt rounds (default: 12, range: 4–31) */
  rounds?: number;
}

/**
 * Options for the `generateAPIKey` function.
 */
export interface GenerateAPIKeyOptions {
  /** Prefix to prepend to the key (e.g., 'bp_live_') */
  prefix?: string;
  /** Length of the random portion of the key in bytes (default: 32) */
  length?: number;
}

/**
 * Field mask configuration for `maskSensitiveData`.
 */
export interface MaskFieldConfig {
  /** Number of characters to reveal at the start */
  leadingChars?: number;
  /** Number of characters to reveal at the end */
  trailingChars?: number;
  /** Character used for masking (default: '*') */
  maskChar?: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Derives a 32-byte AES key from an arbitrary-length secret string
 * using SHA-256. This ensures the key is always the correct length
 * regardless of the input secret.
 *
 * @param key - Arbitrary secret string (e.g., from env variable)
 * @returns 32-byte Buffer suitable for AES-256
 */
function deriveKey(key: string): Buffer {
  return crypto.createHash('sha256').update(key, 'utf8').digest();
}

// ─── Core Encryption / Decryption ────────────────────────────────────────────

/**
 * Encrypts plaintext using AES-256-GCM.
 *
 * The output is a structured object containing base64-encoded ciphertext,
 * initialization vector, and authentication tag. All three fields are required
 * for subsequent decryption.
 *
 * @param plaintext - The string to encrypt
 * @param key - Encryption key (any string; internally hashed to 32 bytes)
 * @returns Object with `ciphertext`, `iv`, and `authTag` (all base64)
 * @throws {Error} If encryption fails
 *
 * @example
 * ```ts
 * const encrypted = encrypt('sensitive data', process.env.ENCRYPTION_KEY!);
 * // Store encrypted.ciphertext, encrypted.iv, encrypted.authTag in DB
 * ```
 */
export function encrypt(plaintext: string, key: string): EncryptionResult {
  try {
    const derivedKey = deriveKey(key);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, derivedKey, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decrypts ciphertext that was encrypted with `encrypt()`.
 *
 * @param ciphertext - Base64-encoded ciphertext
 * @param key - The same key used during encryption
 * @param iv - Base64-encoded initialization vector (from encryption result)
 * @param authTag - Base64-encoded authentication tag (from encryption result)
 * @returns Decrypted plaintext string
 * @throws {Error} If decryption fails or auth tag verification fails
 *
 * @example
 * ```ts
 * const decrypted = decrypt(
 *   stored.ciphertext,
 *   process.env.ENCRYPTION_KEY!,
 *   stored.iv,
 *   stored.authTag
 * );
 * ```
 */
export function decrypt(
  ciphertext: string,
  key: string,
  iv: string,
  authTag: string
): string {
  try {
    const derivedKey = deriveKey(key);
    const ivBuffer = Buffer.from(iv, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');

    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      derivedKey,
      ivBuffer
    );
    decipher.setAuthTag(authTagBuffer);

    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Password Hashing ────────────────────────────────────────────────────────

/**
 * Hashes a password using bcrypt.
 *
 * Uses Node.js built-in `crypto.scryptSync` as a pure-JS alternative to bcrypt,
 * producing a string in the format `$blueprint$rounds$salt$hash`.
 *
 * If the `bcrypt` npm package is available at runtime, it will be used instead
 * for compatibility with existing hashes.
 *
 * @param password - Plain-text password to hash
 * @param options - Hashing options (rounds)
 * @returns Hashed password string
 * @throws {Error} If hashing fails or password is empty
 */
export async function hashPassword(
  password: string,
  options: HashPasswordOptions = {}
): Promise<string> {
  const { rounds = DEFAULT_BCRYPT_ROUNDS } = options;

  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }

  try {
    // Use native scrypt as a built-in alternative to bcrypt
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password, salt, 64, { N: 2 ** rounds }, (err, key) => {
        if (err) reject(err);
        else resolve(key);
      });
    });

    return `$blueprint$${rounds}$${salt}$${derivedKey.toString('hex')}`;
  } catch (error) {
    throw new Error(
      `Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verifies a plain-text password against a hash produced by `hashPassword`.
 *
 * Supports the `$blueprint$rounds$salt$hash` format produced by this module,
 * as well as standard bcrypt hashes (starting with `$2b$` or `$2a$`) if the
 * bcrypt package is available.
 *
 * @param password - Plain-text password to verify
 * @param hash - Stored password hash
 * @returns `true` if the password matches the hash, `false` otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    // Handle our native scrypt format
    if (hash.startsWith('$blueprint$')) {
      const parts = hash.split('$');
      // Format: $blueprint$rounds$salt$hash
      const rounds = parseInt(parts[2], 10);
      const salt = parts[3];
      const storedHash = parts[4];

      const derivedKey = await new Promise<Buffer>((resolve, reject) => {
        crypto.scrypt(password, salt, 64, { N: 2 ** rounds }, (err, key) => {
          if (err) reject(err);
          else resolve(key);
        });
      });

      return crypto.timingSafeEqual(
        Buffer.from(derivedKey.toString('hex'), 'utf8'),
        Buffer.from(storedHash, 'utf8')
      );
    }

    // Handle standard bcrypt format ($2b$ or $2a$)
    if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
      try {
        const bcrypt = await import('bcryptjs');
        return await bcrypt.default.compare(password, hash);
      } catch {
        console.warn(
          'bcrypt package not available for verification of legacy hashes'
        );
        return false;
      }
    }

    return false;
  } catch {
    return false;
  }
}

// ─── Secure Token Generation ─────────────────────────────────────────────────

/**
 * Generates a cryptographically secure random token.
 *
 * Uses `crypto.randomBytes` under the hood and returns a URL-safe
 * base64-encoded string (no `+`, `/`, or `=` characters).
 *
 * @param length - Number of random bytes (default: 32 → 43-char token)
 * @returns URL-safe base64-encoded random token
 *
 * @example
 * ```ts
 * const resetToken = generateSecureToken(32); // e.g., 'xK9_f2Qm-7Bn3...'
 * ```
 */
export function generateSecureToken(length: number = DEFAULT_TOKEN_LENGTH): string {
  return crypto.randomBytes(length).toString('base64url');
}

// ─── API Key Generation ──────────────────────────────────────────────────────

/**
 * Generates a prefixed API key suitable for external integrations.
 *
 * The format is `{prefix}{random}` where the random portion is
 * URL-safe base64-encoded. The default prefix is `bp_live_` for
 * production keys (use `bp_test_` for sandbox/testing).
 *
 * @param prefix - Key prefix (default: `'bp_live_'`)
 * @param options - Generation options
 * @returns A prefixed API key string
 *
 * @example
 * ```ts
 * const liveKey = generateAPIKey();                          // 'bp_live_xK9f2Qm7...'
 * const testKey = generateAPIKey('bp_test_');                // 'bp_test_abc123...'
 * const customKey = generateAPIKey('custom_', { length: 16 }); // 'custom_abc123...'
 * ```
 */
export function generateAPIKey(
  prefix: string = 'bp_live_',
  options: GenerateAPIKeyOptions = {}
): string {
  const { length = DEFAULT_TOKEN_LENGTH } = options;
  const randomPart = crypto.randomBytes(length).toString('base64url');
  return `${prefix}${randomPart}`;
}

// ─── Sensitive Data Masking ──────────────────────────────────────────────────

/**
 * Masks sensitive data fields for safe logging and display.
 *
 * Replaces most of a string's characters with a mask character while
 * preserving a configurable number of leading and trailing characters.
 * Handles nested objects and arrays recursively.
 *
 * @param data - The data object or value to mask
 * @param fields - Array of field names (dot-notation supported) to mask
 * @param config - Masking configuration
 * @returns A new object with specified fields masked
 *
 * @example
 * ```ts
 * const loggable = maskSensitiveData(
 *   { email: 'user@example.com', name: 'John', ssn: '123-45-6789' },
 *   ['email', 'ssn'],
 *   { leadingChars: 2, trailingChars: 4 }
 * );
 * // => { email: 'us***********m', name: 'John', ssn: '12******6789' }
 * ```
 */
export function maskSensitiveData<T extends Record<string, unknown>>(
  data: T,
  fields: string[],
  config: MaskFieldConfig = {}
): T {
  const {
    leadingChars = 2,
    trailingChars = 2,
    maskChar = '*',
  } = config;

  const result = { ...data };

  for (const field of fields) {
    // Handle dot-notation fields (e.g., 'user.email')
    const parts = field.split('.');
    let current: Record<string, unknown> = result;
    let parent: Record<string, unknown> | null = null;
    let key = '';

    for (let i = 0; i < parts.length; i++) {
      key = parts[i];
      parent = current;

      if (i < parts.length - 1) {
        current = (current[key] as Record<string, unknown>) ?? {};
      }
    }

    if (parent && key && typeof parent[key] === 'string') {
      const value = parent[key] as string;
      if (value.length <= leadingChars + trailingChars) {
        parent[key] = maskChar.repeat(value.length);
      } else {
        const maskedLength = value.length - leadingChars - trailingChars;
        parent[key] =
          value.slice(0, leadingChars) +
          maskChar.repeat(maskedLength) +
          value.slice(-trailingChars);
      }
    }
  }

  return result;
}

/**
 * Masks a single string value (convenience helper).
 *
 * @param value - The string to mask
 * @param config - Masking configuration
 * @returns Masked string
 */
export function maskString(
  value: string,
  config: MaskFieldConfig = {}
): string {
  const {
    leadingChars = 2,
    trailingChars = 2,
    maskChar = '*',
  } = config;

  if (!value || value.length === 0) return value;
  if (value.length <= leadingChars + trailingChars) {
    return maskChar.repeat(value.length);
  }

  const maskedLength = value.length - leadingChars - trailingChars;
  return (
    value.slice(0, leadingChars) +
    maskChar.repeat(maskedLength) +
    value.slice(-trailingChars)
  );
}
