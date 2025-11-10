import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Standalone EncryptionService test that doesn't require Electron
 * This creates a minimal version for testing the core crypto functionality
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
}

class StandaloneEncryptionService {
  private masterKey: Buffer | null = null;

  public async initialize(): Promise<void> {
    // For testing, just generate a master key
    this.masterKey = crypto.randomBytes(KEY_LENGTH);
  }

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

  public hash(data: string, salt?: string): string {
    const saltToUse = salt || crypto.randomBytes(16).toString('base64');
    const hash = crypto.pbkdf2Sync(data, saltToUse, 10000, 64, 'sha512');
    return `${saltToUse}:${hash.toString('base64')}`;
  }

  public verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, originalHash] = hashedData.split(':');
      const hash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
      return originalHash === hash.toString('base64');
    } catch {
      return false;
    }
  }

  public generateSecureKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  public validateTokenFormat(token: string, type: 'PAT' | 'Bearer'): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    switch (type) {
      case 'PAT':
        return /^[A-Za-z0-9_-]{52}$/.test(token);
      
      case 'Bearer':
        return token.length > 100 && token.includes('.');
      
      default:
        return false;
    }
  }

  public clearMasterKey(): void {
    if (this.masterKey) {
      this.masterKey.fill(0);
      this.masterKey = null;
    }
  }
}

async function testStandaloneEncryption() {
  const service = new StandaloneEncryptionService();

  try {
    console.log('🔧 Initializing encryption service...');
    await service.initialize();
    console.log('✅ Encryption service initialized successfully');

    // Test basic encryption/decryption
    console.log('\n📝 Testing basic encryption/decryption...');
    const testData = 'test-pat-token-abcdef1234567890';
    console.log('Original data:', testData);

    const encrypted = service.encrypt(testData);
    console.log('Encrypted data:', {
      data: encrypted.data.substring(0, 20) + '...',
      iv: encrypted.iv.substring(0, 10) + '...',
      tag: encrypted.tag.substring(0, 10) + '...'
    });

    const decrypted = service.decrypt(encrypted);
    console.log('Decrypted data:', decrypted);

    if (testData === decrypted) {
      console.log('✅ Encryption/Decryption test PASSED');
    } else {
      console.log('❌ Encryption/Decryption test FAILED');
    }

    // Test token validation
    console.log('\n🔍 Testing token validation...');
    const validPAT = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
    const invalidPAT = 'invalid-token';

    console.log('Valid PAT test:', service.validateTokenFormat(validPAT, 'PAT'));
    console.log('Invalid PAT test:', service.validateTokenFormat(invalidPAT, 'PAT'));

    // Test hashing
    console.log('\n🔐 Testing hash functionality...');
    const passwordToHash = 'mySecretPassword123';
    const hashedPassword = service.hash(passwordToHash);
    console.log('Hashed password:', hashedPassword.substring(0, 30) + '...');

    const isValidHash = service.verifyHash(passwordToHash, hashedPassword);
    const isInvalidHash = service.verifyHash('wrongPassword', hashedPassword);

    console.log('Valid hash verification:', isValidHash);
    console.log('Invalid hash verification:', isInvalidHash);

    if (isValidHash && !isInvalidHash) {
      console.log('✅ Hash verification test PASSED');
    } else {
      console.log('❌ Hash verification test FAILED');
    }

    // Test secure key generation
    console.log('\n🔑 Testing secure key generation...');
    const webhookSecret = service.generateSecureKey(32);
    console.log('Generated webhook secret:', webhookSecret.substring(0, 20) + '...');

    if (webhookSecret.length > 30) {
      console.log('✅ Secure key generation test PASSED');
    } else {
      console.log('❌ Secure key generation test FAILED');
    }

    // Test multiple encrypt/decrypt cycles
    console.log('\n🔄 Testing multiple encrypt/decrypt cycles...');
    let allPassed = true;
    for (let i = 0; i < 5; i++) {
      const testText = `Test message ${i + 1}: ${crypto.randomBytes(16).toString('hex')}`;
      const enc = service.encrypt(testText);
      const dec = service.decrypt(enc);
      
      if (testText !== dec) {
        console.log(`❌ Cycle ${i + 1} failed`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log('✅ Multiple cycles test PASSED');
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    service.clearMasterKey();
    console.log('🧹 Cleaned up master key from memory');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testStandaloneEncryption();
}

export { testStandaloneEncryption, StandaloneEncryptionService };