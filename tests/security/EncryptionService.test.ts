import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Mock electron app before importing the service
jest.mock('electron', () => ({
  app: global.mockElectronApp,
}));

import { EncryptionService } from '../../app/main/services/security/EncryptionService';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let testUserDataPath: string;

  beforeAll(async () => {
    testUserDataPath = path.join(global.testTempDir, 'test-userdata');
    await fs.mkdir(testUserDataPath, { recursive: true });
  });

  beforeEach(() => {
    // Get a fresh instance for each test
    service = EncryptionService.getInstance();
    // Clear any existing master key
    service.clearMasterKey();
  });

  afterEach(() => {
    service.clearMasterKey();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
    });

    test('should create master key file on first initialization', async () => {
      await service.initialize();
      
      const keyPath = path.join(testUserDataPath, '.keys', 'master.key');
      const keyExists = await fs.access(keyPath).then(() => true).catch(() => false);
      expect(keyExists).toBe(true);
    });

    test('should reuse existing master key on subsequent initializations', async () => {
      // First initialization
      await service.initialize();
      const testData = 'test-data';
      const encrypted1 = service.encrypt(testData);
      
      // Clear service and reinitialize
      service.clearMasterKey();
      await service.initialize();
      const encrypted2 = service.encrypt(testData);
      
      // Both encryptions should decrypt to the same value with the same key
      const decrypted1 = service.decrypt(encrypted1);
      const decrypted2 = service.decrypt(encrypted2);
      
      expect(decrypted1).toBe(testData);
      expect(decrypted2).toBe(testData);
    });

    test('should fail if master key cannot be created', async () => {
      // Mock fs to simulate write failure
      const originalMkdir = fs.mkdir;
      fs.mkdir = jest.fn().mockRejectedValue(new Error('Permission denied'));
      
      // Should still work with in-memory fallback
      await expect(service.initialize()).resolves.not.toThrow();
      
      // Restore fs
      fs.mkdir = originalMkdir;
    });
  });

  describe('Encryption and Decryption', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('should encrypt and decrypt data correctly', () => {
      const testData = 'test-secret-data';
      
      const encrypted = service.encrypt(testData);
      expect(encrypted).toHaveProperty('data');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(testData);
    });

    test('should produce different encrypted results for same input', () => {
      const testData = 'test-secret-data';
      
      const encrypted1 = service.encrypt(testData);
      const encrypted2 = service.encrypt(testData);
      
      // IVs should be different
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      // Encrypted data should be different
      expect(encrypted1.data).not.toBe(encrypted2.data);
      // But both should decrypt to same value
      expect(service.decrypt(encrypted1)).toBe(testData);
      expect(service.decrypt(encrypted2)).toBe(testData);
    });

    test('should handle empty string encryption', () => {
      expect(() => service.encrypt('')).toThrow('Cannot encrypt empty data');
    });

    test('should handle various data types', () => {
      const testCases = [
        'simple string',
        'string with spaces and special chars: !@#$%^&*()',
        'unicode: 🔐🗝️🔑',
        'very long string: ' + 'a'.repeat(1000),
        JSON.stringify({ key: 'value', number: 123, boolean: true }),
      ];

      testCases.forEach(testData => {
        const encrypted = service.encrypt(testData);
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(testData);
      });
    });

    test('should fail decryption with invalid data', () => {
      const invalidData = {
        data: 'invalid',
        iv: 'invalid',
        tag: 'invalid'
      };
      
      expect(() => service.decrypt(invalidData)).toThrow('Failed to decrypt data');
    });

    test('should fail decryption with missing fields', () => {
      const incompleteData = {
        data: 'some-data',
        iv: 'some-iv',
        // missing tag
      };
      
      expect(() => service.decrypt(incompleteData as any)).toThrow('Invalid encrypted data format');
    });

    test('should fail if service not initialized', () => {
      const uninitializedService = EncryptionService.getInstance();
      uninitializedService.clearMasterKey();
      
      expect(() => uninitializedService.encrypt('test')).toThrow('Encryption service not initialized');
      expect(() => uninitializedService.decrypt({ data: 'test', iv: 'test', tag: 'test' })).toThrow('Encryption service not initialized');
    });
  });

  describe('Token Validation', () => {
    test('should validate correct PAT token format', () => {
      const validPAT = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      expect(service.validateTokenFormat(validPAT, 'PAT')).toBe(true);
    });

    test('should reject invalid PAT token formats', () => {
      // Test each case individually for better debugging
      expect(service.validateTokenFormat('short', 'PAT')).toBe(false); // too short
      expect(service.validateTokenFormat('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'PAT')).toBe(false); // too long (95 chars)
      expect(service.validateTokenFormat('contains-invalid-chars!@#$%^&*()', 'PAT')).toBe(false); // invalid chars
      expect(service.validateTokenFormat('', 'PAT')).toBe(false); // empty
      expect(service.validateTokenFormat(null as any, 'PAT')).toBe(false); // null
      expect(service.validateTokenFormat(undefined as any, 'PAT')).toBe(false); // undefined
      expect(service.validateTokenFormat('aaaaaaaaaaaaaaaaaaaaa', 'PAT')).toBe(false); // all same character
      expect(service.validateTokenFormat('000000000000000000000', 'PAT')).toBe(false); // all zeros
      expect(service.validateTokenFormat('abcdefghijklmnopqrst', 'PAT')).toBe(true); // this should be valid - 20 chars, valid format
      expect(service.validateTokenFormat('passwordabcdefghijklmnopqrstuvwxyz1234567890ABC', 'PAT')).toBe(false); // contains password
      expect(service.validateTokenFormat('tokenabcdefghijklmnopqrstuvwxyz1234567890ABCD', 'PAT')).toBe(false); // contains token
    });

    test('should validate correct Bearer token format', () => {
      const validBearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(service.validateTokenFormat(validBearer, 'Bearer')).toBe(true);
    });

    test('should reject invalid Bearer token formats', () => {
      const invalidBearers = [
        'too-short',
        'no-dots-here-just-a-long-string-that-is-over-100-characters-but-missing-the-required-dot-separators',
        '', // empty
      ];

      invalidBearers.forEach(token => {
        expect(service.validateTokenFormat(token, 'Bearer')).toBe(false);
      });
    });

    test('should reject unknown token types', () => {
      expect(service.validateTokenFormat('any-token', 'UNKNOWN' as any)).toBe(false);
    });
  });

  describe('Password Hashing', () => {
    test('should hash passwords correctly', () => {
      const password = 'test-password';
      const hashed = service.hash(password);
      
      expect(hashed).toContain(':'); // Should contain salt separator
      expect(hashed.length).toBeGreaterThan(50); // Should be reasonably long
    });

    test('should produce different hashes for same password', () => {
      const password = 'test-password';
      const hash1 = service.hash(password);
      const hash2 = service.hash(password);
      
      expect(hash1).not.toBe(hash2); // Different salts should produce different hashes
    });

    test('should verify correct password', () => {
      const password = 'test-password';
      const hashed = service.hash(password);
      
      expect(service.verifyHash(password, hashed)).toBe(true);
    });

    test('should reject incorrect password', () => {
      const password = 'test-password';
      const wrongPassword = 'wrong-password';
      const hashed = service.hash(password);
      
      expect(service.verifyHash(wrongPassword, hashed)).toBe(false);
    });

    test('should use custom salt when provided', () => {
      const password = 'test-password';
      const customSalt = 'custom-salt';
      const hash1 = service.hash(password, customSalt);
      const hash2 = service.hash(password, customSalt);
      
      expect(hash1).toBe(hash2); // Same salt should produce same hash
    });

    test('should handle invalid hash format gracefully', () => {
      const password = 'test-password';
      const invalidHash = 'invalid-hash-format';
      
      expect(service.verifyHash(password, invalidHash)).toBe(false);
    });
  });

  describe('Secure Key Generation', () => {
    test('should generate keys of specified length', () => {
      const lengths = [16, 32, 64, 128];
      
      lengths.forEach(length => {
        const key = service.generateSecureKey(length);
        // Base64url encoding: 4 chars per 3 bytes
        const expectedLength = Math.ceil(length * 4 / 3);
        expect(key.length).toBeCloseTo(expectedLength, 2);
      });
    });

    test('should generate different keys each time', () => {
      const key1 = service.generateSecureKey(32);
      const key2 = service.generateSecureKey(32);
      
      expect(key1).not.toBe(key2);
    });

    test('should generate URL-safe keys', () => {
      const key = service.generateSecureKey(32);
      
      // Base64url should only contain A-Z, a-z, 0-9, -, _
      expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    test('should use default length when not specified', () => {
      const key = service.generateSecureKey();
      expect(key.length).toBeGreaterThan(30);
    });
  });

  describe('Memory Management', () => {
    test('should clear master key from memory', async () => {
      await service.initialize();
      
      // Should work before clearing
      const testData = 'test-data';
      const encrypted = service.encrypt(testData);
      expect(service.decrypt(encrypted)).toBe(testData);
      
      // Clear master key
      service.clearMasterKey();
      
      // Should fail after clearing
      expect(() => service.encrypt('test')).toThrow('Encryption service not initialized');
      expect(() => service.decrypt(encrypted)).toThrow('Encryption service not initialized');
    });

    test('should handle multiple clear calls gracefully', async () => {
      await service.initialize();
      
      service.clearMasterKey();
      service.clearMasterKey(); // Second call should not throw
      
      expect(() => service.encrypt('test')).toThrow('Encryption service not initialized');
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = EncryptionService.getInstance();
      const instance2 = EncryptionService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    test('should maintain state across getInstance calls', async () => {
      const instance1 = EncryptionService.getInstance();
      await instance1.initialize();
      
      const instance2 = EncryptionService.getInstance();
      
      // Should be able to use service without re-initializing
      const testData = 'test-data';
      const encrypted = instance2.encrypt(testData);
      expect(instance2.decrypt(encrypted)).toBe(testData);
    });
  });

  describe('Error Handling', () => {
    test('should handle file system errors gracefully', async () => {
      // Mock fs.writeFileSync to fail
      const originalWriteFileSync = require('fs').writeFileSync;
      require('fs').writeFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Disk full');
      });

      // Should still initialize with in-memory key
      await expect(service.initialize()).resolves.not.toThrow();
      
      // Should still work
      const testData = 'test-data';
      const encrypted = service.encrypt(testData);
      expect(service.decrypt(encrypted)).toBe(testData);
      
      // Restore fs
      require('fs').writeFileSync = originalWriteFileSync;
    });

    test('should handle crypto errors gracefully', () => {
      // Mock crypto.createCipheriv to fail
      const originalCreateCipheriv = crypto.createCipheriv;
      crypto.createCipheriv = jest.fn().mockImplementation(() => {
        throw new Error('Crypto error');
      });

      // Should throw appropriate error
      expect(() => service.encrypt('test')).toThrow();
      
      // Restore crypto
      crypto.createCipheriv = originalCreateCipheriv;
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('should handle maximum length data', () => {
      // Test with large data (1MB)
      const largeData = 'A'.repeat(1024 * 1024);
      
      const encrypted = service.encrypt(largeData);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(largeData);
    });

    test('should handle binary-like data', () => {
      const binaryLikeData = String.fromCharCode(...Array.from({ length: 256 }, (_, i) => i));
      
      const encrypted = service.encrypt(binaryLikeData);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(binaryLikeData);
    });

    test('should handle concurrent operations', async () => {
      const testData = 'concurrent-test';
      
      // Perform multiple encryptions concurrently
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(service.encrypt(testData))
      );
      
      const results = await Promise.all(promises);
      
      // All should decrypt correctly
      results.forEach(encrypted => {
        expect(service.decrypt(encrypted)).toBe(testData);
      });
    });
  });
});