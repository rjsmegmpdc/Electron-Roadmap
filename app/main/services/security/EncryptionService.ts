import crypto from 'crypto';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const TAG_LENGTH = 16; // 128 bits

export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: Buffer | null = null;

  private constructor() {}

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Initialize encryption service with master key
   */
  public async initialize(): Promise<void> {
    try {
      this.masterKey = await this.getOrCreateMasterKey();
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      throw new Error('Encryption service initialization failed');
    }
  }

  /**
   * Encrypt sensitive data
   */
  public encrypt(plaintext: string): EncryptedData {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    if (!plaintext) {
      throw new Error('Cannot encrypt empty data');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);
    cipher.setAAD(Buffer.from('ADO-Token-Encryption', 'utf8'));

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag();

    return {
      data: encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    };
  }

  /**
   * Decrypt sensitive data
   */
  public decrypt(encryptedData: EncryptedData): string {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    if (!encryptedData.data || !encryptedData.iv || !encryptedData.tag) {
      throw new Error('Invalid encrypted data format');
    }

    try {
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
      decipher.setAAD(Buffer.from('ADO-Token-Encryption', 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));

      let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt data - invalid key or corrupted data');
    }
  }

  /**
   * Securely hash passwords or tokens for storage validation
   */
  public hash(data: string, salt?: string): string {
    const saltToUse = salt || crypto.randomBytes(16).toString('base64');
    const hash = crypto.pbkdf2Sync(data, saltToUse, 10000, 64, 'sha512');
    return `${saltToUse}:${hash.toString('base64')}`;
  }

  /**
   * Verify hashed data
   */
  public verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, originalHash] = hashedData.split(':');
      const hash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
      return originalHash === hash.toString('base64');
    } catch {
      return false;
    }
  }

  /**
   * Generate secure random key for webhook secrets
   */
  public generateSecureKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Get or create master key for encryption
   */
  private async getOrCreateMasterKey(): Promise<Buffer> {
    const keyPath = this.getMasterKeyPath();

    try {
      // Try to read existing key
      if (fs.existsSync(keyPath)) {
        const keyData = fs.readFileSync(keyPath);
        return Buffer.from(keyData.toString(), 'base64');
      }
    } catch (error) {
      console.warn('Could not read existing master key, creating new one');
    }

    // Create new master key
    const newKey = crypto.randomBytes(KEY_LENGTH);
    
    try {
      // Ensure directory exists
      const keyDir = path.dirname(keyPath);
      if (!fs.existsSync(keyDir)) {
        fs.mkdirSync(keyDir, { recursive: true });
      }

      // Save key with restricted permissions
      fs.writeFileSync(keyPath, newKey.toString('base64'), { mode: 0o600 });
      
      return newKey;
    } catch (error) {
      console.error('Failed to save master key:', error);
      // Return in-memory key as fallback (less secure)
      return newKey;
    }
  }

  /**
   * Get the path for storing the master key
   */
  private getMasterKeyPath(): string {
    // In test environment, use global testTempDir if available
    if ((global as any).testTempDir && process.env.NODE_ENV === 'test') {
      return path.join((global as any).testTempDir, 'integration-userdata', '.keys', 'master.key');
    }
    
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, '.keys', 'master.key');
  }

  /**
   * Clear master key from memory (for security)
   */
  public clearMasterKey(): void {
    if (this.masterKey) {
      this.masterKey.fill(0); // Clear the buffer
      this.masterKey = null;
    }
  }

  /**
   * Validate token format according to Microsoft documentation
   * https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate
   */
  public validateTokenFormat(token: string, type: 'PAT' | 'Bearer'): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    switch (type) {
      case 'PAT':
        // Azure DevOps PAT tokens are base64url encoded strings
        // They are typically 52 characters long but can vary (44-88 characters)
        // Format: [A-Za-z0-9_-] (base64url character set)
        // Microsoft uses base64url encoding without padding
        const patRegex = /^[A-Za-z0-9_-]{20,88}$/;
        if (!patRegex.test(token)) {
          return false;
        }
        
        // Additional validation: ensure it's not obviously invalid
        // PAT tokens should not contain common invalid patterns
        const invalidPatterns = [
          /^[0]+$/, // All zeros
          /^[a]+$/i, // All same character
          /password/i, // Contains "password"
          /token/i, // Contains "token"
          /example/i, // Contains "example"
          /test/i, // Contains "test"
          /^[\s]*$/, // Only whitespace
        ];
        
        return !invalidPatterns.some(pattern => pattern.test(token));
      
      case 'Bearer':
        // OAuth2 Bearer tokens (JWT format)
        // JWT tokens have three parts separated by dots: header.payload.signature
        const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
        return jwtRegex.test(token) && token.length > 100;
      
      default:
        return false;
    }
  }

  /**
   * Get detailed validation error for PAT token
   */
  public getPATValidationError(token: string): string | null {
    if (!token || typeof token !== 'string') {
      return 'PAT token is required and must be a string';
    }

    if (token.length < 20) {
      return 'PAT token is too short (minimum 20 characters)';
    }

    if (token.length > 88) {
      return 'PAT token is too long (maximum 88 characters)';
    }

    const validChars = /^[A-Za-z0-9_-]+$/;
    if (!validChars.test(token)) {
      return 'PAT token contains invalid characters (only A-Z, a-z, 0-9, _, - allowed)';
    }

    // Check for invalid patterns
    if (/^[0]+$/.test(token)) {
      return 'PAT token cannot be all zeros';
    }

    if (/^[a]+$/i.test(token)) {
      return 'PAT token cannot be all the same character';
    }

    if (/password|token|example|test/i.test(token)) {
      return 'PAT token appears to contain placeholder text';
    }

    return null; // Token is valid
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();