import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Asegúrate de que ENCRYPTION_KEY esté en el .env y tenga exactamente 32 bytes (64 caracteres hex)
function getKey(): Buffer {
  const keyStr = process.env.ENCRYPTION_KEY;
  if (!keyStr) {
    // Si no hay key, generamos una estática solo para desarrollo, PERO debe fallar en PROD.
    // Para cumplir la auditoría P0, forzaremos un error si no hay key y estamos en producción.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production');
    }
    // Clave dummy fallback segura solo para dev
    return crypto.scryptSync('dummy-dev-key-12345', 'salt', 32);
  }
  
  if (keyStr.length === 64) {
    return Buffer.from(keyStr, 'hex');
  }
  
  // Fallback a derivación si es un string random
  return crypto.scryptSync(keyStr, 'salt', 32);
}

export function encryptSecret(text: string | null | undefined): string | null {
  if (!text) return null;

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Formato: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return null; // O throw error, dependiendo de si es crítico
  }
}

export function decryptSecret(encryptedData: string | null | undefined): string | null {
  if (!encryptedData) return null;
  
  // Si no está en el formato esperado (ej. migración pendiente), lo devolvemos tal cual.
  // Esto permite que el sistema siga funcionando temporalmente si hay secretos en plaintext.
  const parts = encryptedData.split(':');
  if (parts.length !== 3) return encryptedData;

  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null; // O throw error
  }
}
