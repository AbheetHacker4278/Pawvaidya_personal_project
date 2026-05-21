import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 12 bytes for GCM

// Generate a deterministic 32-byte key from JWT_SECRET or a fallback
const secretSource = process.env.JWT_SECRET || 'pawvaidya-secure-fallback-crypt-salt-9876';
const ENCRYPTION_KEY = crypto.scryptSync(secretSource, 'pawvaidya-salt-gcm-aes', 32);

/**
 * Encrypts cleartext using AES-256-GCM
 * @param {string} text Plaintext to encrypt
 * @returns {string} Colon-delimited format: 'iv:encrypted:tag'
 */
export const encrypt = (text) => {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${encrypted}:${tag}`;
  } catch (err) {
    console.error('Encryption failed:', err.message);
    throw new Error('Encryption operation failed.');
  }
};

/**
 * Decrypts AES-256-GCM ciphertext
 * @param {string} cipherText Colon-delimited 'iv:encrypted:tag'
 * @returns {string} Original plaintext
 */
export const decrypt = (cipherText) => {
  if (!cipherText) return '';
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      // If it is already decrypted or unencrypted plain text fallback safely
      return cipherText;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.warn('Decryption failed, returning input as-is (might be plain raw string):', err.message);
    return cipherText; // Graceful fallback
  }
};
