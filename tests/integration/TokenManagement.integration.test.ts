import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { openDB, DB } from '../../app/main/db';

// Mock electron app
jest.mock('electron', () => ({
  app: global.mockElectronApp,
}));

import { EncryptionService } from '../../app/main/services/security/EncryptionService';
import { TokenManager } from '../../app/main/services/security/TokenManager';

describe('Token Management Integration', () => {
  let encryptionService: EncryptionService;
  let tokenManager: TokenManager;
  let testDb: DB;
  let testDbPath: string;
  let testUserDataPath: string;

  beforeAll(async () => {
    // Set up test paths
    testUserDataPath = path.join(global.testTempDir, 'integration-userdata');
    await fs.mkdir(testUserDataPath, { recursive: true });
    
    // Create test database with proper schema
    testDbPath = path.join(global.testTempDir, 'integration-test.db');
    testDb = openDB(testDbPath); // This will create the full schema with migrations
  });

  beforeEach(async () => {
    // Clear test data
    testDb.exec('DELETE FROM ado_config');
    
    // Initialize services
    encryptionService = EncryptionService.getInstance();
    encryptionService.clearMasterKey();
    await encryptionService.initialize();
    
    tokenManager = TokenManager.getInstance();
    tokenManager.initialize(testDb);
  });

  afterEach(() => {
    encryptionService.clearMasterKey();
  });

  afterAll(async () => {
    if (testDb) {
      testDb.close();
    }
    
    // Clean up test files
    try {
      await fs.unlink(testDbPath);
      await fs.rm(testUserDataPath, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('End-to-End Token Management Workflow', () => {
    test('should complete full token lifecycle', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const webhookUrl = 'https://example.com/webhooks/ado';

      // 1. Store initial configuration
      await tokenManager.storePATToken(orgUrl, projectName, patToken, {
        webhookUrl,
        isEnabled: true
      });

      // 2. Verify configuration exists
      const configs = tokenManager.getADOConfigurations();
      expect(configs).toHaveLength(1);
      expect(configs[0].org_url).toBe(orgUrl);
      expect(configs[0].project_name).toBe(projectName);
      expect(configs[0].is_enabled).toBe(true);
      expect(configs[0].connection_status).toBe('connected');

      // 3. Retrieve and verify token
      const retrievedToken = await tokenManager.retrievePATToken(orgUrl, projectName);
      expect(retrievedToken).toBe(patToken);

      // 4. Test connection
      const connectionResult = await tokenManager.testConnection(orgUrl, projectName);
      expect(connectionResult).toBe(true);

      // 5. Update configuration
      tokenManager.updateADOConfiguration(orgUrl, projectName, {
        webhook_url: 'https://newwebhook.com',
        is_enabled: false
      });

      const updatedConfig = await tokenManager.getADOConfiguration(orgUrl, projectName);
      expect(updatedConfig!.webhook_url).toBe('https://newwebhook.com');
      expect(updatedConfig!.is_enabled).toBe(false);

      // 6. Update token
      const newToken = 'ZYXWVUTSRQPONMLKJIHGFEDCBA9876543210abcdefghijklmn';
      await tokenManager.updatePATToken(orgUrl, projectName, newToken);

      const newRetrievedToken = await tokenManager.retrievePATToken(orgUrl, projectName);
      expect(newRetrievedToken).toBe(newToken);

      // 7. Update connection status
      const syncTime = new Date().toISOString();
      tokenManager.updateConnectionStatus(orgUrl, projectName, 'connected', syncTime);

      const finalConfig = await tokenManager.getADOConfiguration(orgUrl, projectName);
      expect(finalConfig!.connection_status).toBe('connected');
      expect(finalConfig!.last_sync_at).toBe(syncTime);

      // 8. Remove configuration
      tokenManager.removePATToken(orgUrl, projectName);

      const removedConfig = await tokenManager.getADOConfiguration(orgUrl, projectName);
      expect(removedConfig).toBeNull();

      const finalConfigs = tokenManager.getADOConfigurations();
      expect(finalConfigs).toHaveLength(0);
    });

    test('should handle multiple organizations and projects', async () => {
      const configurations = [
        {
          orgUrl: 'https://dev.azure.com/org1',
          projectName: 'Project1',
          patToken: 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMN1',
        },
        {
          orgUrl: 'https://dev.azure.com/org1',
          projectName: 'Project2',
          patToken: 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMN2',
        },
        {
          orgUrl: 'https://dev.azure.com/org2',
          projectName: 'Project1',
          patToken: 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMN3',
        },
      ];

      // Store all configurations
      for (const config of configurations) {
        await tokenManager.storePATToken(
          config.orgUrl,
          config.projectName,
          config.patToken,
          { isEnabled: true }
        );
      }

      // Verify all configurations exist
      const allConfigs = tokenManager.getADOConfigurations();
      expect(allConfigs).toHaveLength(3);

      // Verify each token can be retrieved correctly
      for (const config of configurations) {
        const retrievedToken = await tokenManager.retrievePATToken(
          config.orgUrl,
          config.projectName
        );
        expect(retrievedToken).toBe(config.patToken);
      }

      // Test connection for all
      for (const config of configurations) {
        const connectionResult = await tokenManager.testConnection(
          config.orgUrl,
          config.projectName
        );
        expect(connectionResult).toBe(true);
      }

      // Remove one configuration
      tokenManager.removePATToken(configurations[0].orgUrl, configurations[0].projectName);

      const remainingConfigs = tokenManager.getADOConfigurations();
      expect(remainingConfigs).toHaveLength(2);

      // Verify removed configuration is gone
      const removedConfig = await tokenManager.getADOConfiguration(
        configurations[0].orgUrl,
        configurations[0].projectName
      );
      expect(removedConfig).toBeNull();

      // Verify other configurations still work
      const stillExistingToken = await tokenManager.retrievePATToken(
        configurations[1].orgUrl,
        configurations[1].projectName
      );
      expect(stillExistingToken).toBe(configurations[1].patToken);
    });

    test('should maintain encryption integrity across service restarts', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';

      // Store token with first service instance
      await tokenManager.storePATToken(orgUrl, projectName, patToken);

      const originalToken = await tokenManager.retrievePATToken(orgUrl, projectName);
      expect(originalToken).toBe(patToken);

      // Simulate service restart by clearing memory and reinitializing
      encryptionService.clearMasterKey();

      // Reinitialize encryption service (should load existing master key)
      await encryptionService.initialize();

      // Should still be able to decrypt the token
      const tokenAfterRestart = await tokenManager.retrievePATToken(orgUrl, projectName);
      expect(tokenAfterRestart).toBe(patToken);
    });

    test('should handle master key recreation gracefully', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';

      // Store token
      await tokenManager.storePATToken(orgUrl, projectName, patToken);
      const originalToken = await tokenManager.retrievePATToken(orgUrl, projectName);
      expect(originalToken).toBe(patToken);

      // Delete master key file to simulate corruption
      const keyPath = path.join(testUserDataPath, '.keys', 'master.key');
      try {
        await fs.unlink(keyPath);
      } catch (error) {
        // Key file might not exist
      }

      // Clear memory and reinitialize (should create new master key)
      encryptionService.clearMasterKey();
      await encryptionService.initialize();

      // Old encrypted data should not be decryptable with new key
      const tokenAfterKeyChange = await tokenManager.retrievePATToken(orgUrl, projectName);
      expect(tokenAfterKeyChange).toBeNull(); // Should fail gracefully

      // But new tokens should work fine
      const newToken = 'ZYXWVUTSRQPONMLKJIHGFEDCBA9876543210abcdefghijklmn';
      await tokenManager.storePATToken(orgUrl, projectName, newToken);

      const newRetrievedToken = await tokenManager.retrievePATToken(orgUrl, projectName);
      expect(newRetrievedToken).toBe(newToken);
    });
  });

  describe('Security Integration Tests', () => {
    test('should properly encrypt tokens in database', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';

      await tokenManager.storePATToken(orgUrl, projectName, patToken);

      // Check raw database content
      const rawRecord = testDb.prepare('SELECT pat_token FROM ado_config WHERE org_url = ? AND project_name = ?')
        .get(orgUrl, projectName);

      expect(rawRecord.pat_token).toBeTruthy();
      expect(rawRecord.pat_token).not.toBe(patToken); // Should be encrypted
      expect(rawRecord.pat_token).not.toContain(patToken); // Should not contain plaintext

      // Should be valid JSON (encrypted data structure)
      expect(() => JSON.parse(rawRecord.pat_token)).not.toThrow();

      const encryptedData = JSON.parse(rawRecord.pat_token);
      expect(encryptedData).toHaveProperty('data');
      expect(encryptedData).toHaveProperty('iv');
      expect(encryptedData).toHaveProperty('tag');
    });

    test('should not expose sensitive data in logs or errors', async () => {
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      
      const logMessages: string[] = [];
      const errorMessages: string[] = [];

      console.log = jest.fn().mockImplementation((...args) => {
        logMessages.push(args.join(' '));
      });
      console.error = jest.fn().mockImplementation((...args) => {
        errorMessages.push(args.join(' '));
      });

      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';

      try {
        // Perform various operations
        await tokenManager.storePATToken(orgUrl, projectName, patToken);
        await tokenManager.retrievePATToken(orgUrl, projectName);
        await tokenManager.testConnection(orgUrl, projectName);
        
        // Try invalid operations
        try {
          await tokenManager.storePATToken(orgUrl, projectName, 'invalid-token');
        } catch (error) {
          // Expected error
        }

        // Check that sensitive data doesn't appear in logs
        const allMessages = [...logMessages, ...errorMessages].join(' ');
        expect(allMessages).not.toContain(patToken);
        expect(allMessages).not.toContain('abcdefghijklmnopqrstuvwxyz');

      } finally {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
      }
    });

    test('should validate all token operations for security', async () => {
      const validToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const invalidTokens = [
        '', // empty
        'too-short', // too short
        'contains-invalid-chars!@#$%^&*()ABCDEFGHIJKLMNOPQRST', // invalid characters
        'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQ', // too long
        null, // null
        undefined, // undefined
      ];

      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';

      // Valid token should work
      await expect(tokenManager.storePATToken(orgUrl, projectName, validToken))
        .resolves.toBeUndefined();

      // All invalid tokens should be rejected
      for (let i = 0; i < invalidTokens.length; i++) {
        const invalidToken = invalidTokens[i];
        try {
          await tokenManager.storePATToken(orgUrl, `${projectName}-${i}`, invalidToken as any);
          expect(true).toBe(false); // This should not be reached
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBeTruthy();
        }
      }
    });

    test('should handle concurrent access safely', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const baseProjectName = 'ConcurrentProject';
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';

      // Perform multiple concurrent operations
      const concurrentOperations = Array.from({ length: 10 }, (_, i) => {
        const projectName = `${baseProjectName}${i}`;
        return async () => {
          await tokenManager.storePATToken(orgUrl, projectName, patToken);
          const retrieved = await tokenManager.retrievePATToken(orgUrl, projectName);
          expect(retrieved).toBe(patToken);
          const connection = await tokenManager.testConnection(orgUrl, projectName);
          expect(connection).toBe(true);
        };
      });

      // Execute all operations concurrently
      await expect(Promise.all(concurrentOperations.map(op => op())))
        .resolves.toBeDefined();

      // Verify all configurations were created
      const allConfigs = tokenManager.getADOConfigurations();
      expect(allConfigs).toHaveLength(10);

      // Verify each can still be accessed
      for (let i = 0; i < 10; i++) {
        const projectName = `${baseProjectName}${i}`;
        const token = await tokenManager.retrievePATToken(orgUrl, projectName);
        expect(token).toBe(patToken);
      }
    });
  });

  describe('Error Recovery Integration Tests', () => {
    test('should handle database transaction failures gracefully', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';

      // Store initial token
      await tokenManager.storePATToken(orgUrl, projectName, patToken);

      // Simulate database being busy/locked
      const originalPrepare = testDb.prepare;
      testDb.prepare = jest.fn().mockImplementation((sql: string) => {
        if (sql.includes('UPDATE') && sql.includes('ado_config')) {
          throw new Error('Database is locked');
        }
        return originalPrepare.call(testDb, sql);
      });

      // Should handle error gracefully
      try {
        await tokenManager.storePATToken(orgUrl, projectName, patToken, { isEnabled: false });
        expect(true).toBe(false); // This should not be reached
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Database is locked');
      }

      // Restore database
      testDb.prepare = originalPrepare;

      // Should still be able to access original data
      const retrievedToken = await tokenManager.retrievePATToken(orgUrl, projectName);
      expect(retrievedToken).toBe(patToken);
    });

    test('should handle encryption service failures gracefully', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';

      // Store token successfully
      await tokenManager.storePATToken(orgUrl, projectName, patToken);

      // Clear encryption service to simulate failure
      encryptionService.clearMasterKey();

      // Retrieval should return null gracefully (not throw)
      const retrievedToken = await tokenManager.retrievePATToken(orgUrl, projectName);
      expect(retrievedToken).toBeNull();

      // Reinitialize and verify we can store new tokens
      await encryptionService.initialize();
      const newToken = 'ZYXWVUTSRQPONMLKJIHGFEDCBA9876543210abcdefghijklmn';
      await expect(tokenManager.storePATToken(orgUrl, `${projectName}2`, newToken))
        .resolves.toBeUndefined();
    });

    test('should maintain data integrity during partial failures', async () => {
      const configurations = [
        { orgUrl: 'https://dev.azure.com/org1', projectName: 'Project1', patToken: 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMN1' },
        { orgUrl: 'https://dev.azure.com/org2', projectName: 'Project2', patToken: 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMN2' },
        { orgUrl: 'https://dev.azure.com/org3', projectName: 'Project3', patToken: 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMN3' },
      ];

      // Store all configurations
      for (const config of configurations) {
        await tokenManager.storePATToken(config.orgUrl, config.projectName, config.patToken);
      }

      // Simulate partial corruption by manually corrupting one record
      testDb.prepare('UPDATE ado_config SET pat_token = ? WHERE org_url = ?')
        .run('corrupted-data', 'https://dev.azure.com/org2');

      // First and third should still work
      const token1 = await tokenManager.retrievePATToken(configurations[0].orgUrl, configurations[0].projectName);
      expect(token1).toBe(configurations[0].patToken);

      const token3 = await tokenManager.retrievePATToken(configurations[2].orgUrl, configurations[2].projectName);
      expect(token3).toBe(configurations[2].patToken);

      // Corrupted one should return null
      const token2 = await tokenManager.retrievePATToken(configurations[1].orgUrl, configurations[1].projectName);
      expect(token2).toBeNull();

      // Should be able to fix corrupted record
      await tokenManager.updatePATToken(configurations[1].orgUrl, configurations[1].projectName, configurations[1].patToken);
      const fixedToken = await tokenManager.retrievePATToken(configurations[1].orgUrl, configurations[1].projectName);
      expect(fixedToken).toBe(configurations[1].patToken);
    });
  });

  describe('Performance Integration Tests', () => {
    test('should handle large numbers of configurations efficiently', async () => {
      const startTime = Date.now();
      const configCount = 100;
      const baseToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';

      // Store many configurations
      const storePromises = Array.from({ length: configCount }, (_, i) => 
        tokenManager.storePATToken(
          `https://dev.azure.com/org${i}`,
          'TestProject',
          baseToken
        )
      );

      await Promise.all(storePromises);

      const storeTime = Date.now() - startTime;
      expect(storeTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Retrieve all configurations
      const retrieveStart = Date.now();
      const retrievePromises = Array.from({ length: configCount }, (_, i) => 
        tokenManager.retrievePATToken(`https://dev.azure.com/org${i}`, 'TestProject')
      );

      const tokens = await Promise.all(retrievePromises);
      const retrieveTime = Date.now() - retrieveStart;

      expect(retrieveTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(tokens.every(token => token === baseToken)).toBe(true);

      // List all configurations should be fast
      const listStart = Date.now();
      const allConfigs = tokenManager.getADOConfigurations();
      const listTime = Date.now() - listStart;

      expect(listTime).toBeLessThan(1000); // Should complete within 1 second
      expect(allConfigs).toHaveLength(configCount);
    });

    test('should handle large token data efficiently', async () => {
      // Test with maximum size PAT token (Azure DevOps allows up to 52 characters)
      const maxSizeToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';

      const startTime = Date.now();
      
      await tokenManager.storePATToken(orgUrl, projectName, maxSizeToken);
      const retrievedToken = await tokenManager.retrievePATToken(orgUrl, projectName);
      
      const totalTime = Date.now() - startTime;

      expect(retrievedToken).toBe(maxSizeToken);
      expect(totalTime).toBeLessThan(1000); // Should be very fast for single operation
    });
  });
});