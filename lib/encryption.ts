import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// ENCRYPTION_KEY must be exactly 32 bytes (64 hexadecimal characters)
export function getKey(): Buffer {
  const keyStr = process.env.ENCRYPTION_KEY;
  if (!keyStr) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production (64 hex characters)');
    }
    // Fallback key only for non-production development/local test runner
    return crypto.scryptSync('dummy-dev-key-12345-deterministic', 'salt', 32);
  }
  
  if (!/^[0-9a-fA-F]{64}$/.test(keyStr)) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes)');
  }

  return Buffer.from(keyStr, 'hex');
}

export function encryptSecret(text: string | null | undefined): string | null {
  if (text === null || text === undefined || text === '') return null;

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed');
    // P0-010: Never silently return null on encryption failure if secret was provided
    throw new Error('Encryption operation failed');
  }
}

export function decryptSecret(encryptedData: string | null | undefined): string | null {
  if (!encryptedData) return null;
  
  // Strict AES-256-GCM format check: iv (32 hex) : authTag (32 hex) : cipherHex
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    // If not in encrypted format, do not leak or treat as valid secret
    return null;
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    if (!ivHex || !authTagHex || !encryptedHex) return null;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed');
    return null;
  }
}
