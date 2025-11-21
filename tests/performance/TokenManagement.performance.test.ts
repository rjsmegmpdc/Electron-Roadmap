import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Mock electron app
jest.mock('electron', () => ({
  app: global.mockElectronApp,
}));

import { EncryptionService } from '../../app/main/services/security/EncryptionService';
import { TokenManager } from '../../app/main/services/security/TokenManager';

describe('Token Management Performance Tests', () => {
  let encryptionService: EncryptionService;
  let tokenManager: TokenManager;
  let testDb: Database.Database;
  let testDbPath: string;

  beforeAll(async () => {
    // Create test database
    testDbPath = path.join(global.testTempDir, 'performance-test.db');
    testDb = new Database(testDbPath);

    // Create the database schema
    testDb.exec(`
      CREATE TABLE ado_config (
        id INTEGER PRIMARY KEY,
        org_url TEXT NOT NULL,
        project_name TEXT NOT NULL,
        auth_mode TEXT DEFAULT 'PAT',
        pat_token TEXT,
        client_id TEXT,
        tenant_id TEXT,
        webhook_url TEXT,
        webhook_secret TEXT,
        max_retry_attempts INTEGER DEFAULT 3,
        base_delay_ms INTEGER DEFAULT 500,
        is_enabled BOOLEAN DEFAULT FALSE,
        connection_status TEXT DEFAULT 'disconnected',
        last_sync_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      CREATE INDEX idx_ado_config_org_project ON ado_config(org_url, project_name);
      CREATE INDEX idx_ado_config_status ON ado_config(connection_status);
      CREATE INDEX idx_ado_config_enabled ON ado_config(is_enabled);
    `);

    // Initialize services once
    encryptionService = EncryptionService.getInstance();
    await encryptionService.initialize();
    
    tokenManager = TokenManager.getInstance();
    tokenManager.initialize(testDb);
  });

  beforeEach(() => {
    // Clear test data
    testDb.exec('DELETE FROM ado_config');
  });

  afterAll(async () => {
    encryptionService.clearMasterKey();
    if (testDb) {
      testDb.close();
    }
    
    try {
      await fs.unlink(testDbPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Encryption Performance', () => {
    test('should encrypt tokens efficiently', async () => {
      const testData = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const iterations = 1000;
      
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const encrypted = encryptionService.encrypt(testData);
        const decrypted = encryptionService.decrypt(encrypted);
        expect(decrypted).toBe(testData);
      }
      
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / iterations;
      
      console.log(`Encryption Performance: ${iterations} operations in ${totalTime}ms (avg: ${avgTime.toFixed(2)}ms per operation)`);
      
      // Should be able to do at least 100 encrypt/decrypt operations per second
      expect(avgTime).toBeLessThan(10);
    });

    test('should handle varying data sizes efficiently', async () => {
      const dataSizes = [10, 50, 100, 500, 1000];
      const iterationsPerSize = 100;
      
      for (const size of dataSizes) {
        const testData = 'a'.repeat(size);
        const startTime = Date.now();
        
        for (let i = 0; i < iterationsPerSize; i++) {
          const encrypted = encryptionService.encrypt(testData);
          const decrypted = encryptionService.decrypt(encrypted);
          expect(decrypted).toBe(testData);
        }
        
        const totalTime = Date.now() - startTime;
        const avgTime = totalTime / iterationsPerSize;
        
        console.log(`Data size ${size}: ${iterationsPerSize} operations in ${totalTime}ms (avg: ${avgTime.toFixed(2)}ms)`);
        
        // Performance should remain reasonable even for larger data
        expect(avgTime).toBeLessThan(50);
      }
    });

    test('should handle concurrent encryption efficiently', async () => {
      const testData = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const concurrentOperations = 100;
      
      const startTime = Date.now();
      
      const operations = Array.from({ length: concurrentOperations }, async () => {
        const encrypted = encryptionService.encrypt(testData);
        const decrypted = encryptionService.decrypt(encrypted);
        expect(decrypted).toBe(testData);
        return decrypted;
      });
      
      const results = await Promise.all(operations);
      const totalTime = Date.now() - startTime;
      
      console.log(`Concurrent Encryption: ${concurrentOperations} concurrent operations in ${totalTime}ms`);
      
      expect(results).toHaveLength(concurrentOperations);
      expect(results.every(result => result === testData)).toBe(true);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Token Storage Performance', () => {
    test('should store tokens efficiently', async () => {
      const baseToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const tokenCount = 500;
      
      const startTime = Date.now();
      
      for (let i = 0; i < tokenCount; i++) {
        await tokenManager.storePATToken(
          `https://dev.azure.com/org${i}`,
          'TestProject',
          baseToken
        );
      }
      
      const storeTime = Date.now() - startTime;
      const avgStoreTime = storeTime / tokenCount;
      
      console.log(`Token Storage: ${tokenCount} tokens stored in ${storeTime}ms (avg: ${avgStoreTime.toFixed(2)}ms per token)`);
      
      // Should be able to store tokens reasonably fast
      expect(avgStoreTime).toBeLessThan(20);
      
      // Verify all tokens were stored
      const configs = tokenManager.getADOConfigurations();
      expect(configs).toHaveLength(tokenCount);
    });

    test('should retrieve tokens efficiently', async () => {
      const baseToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const tokenCount = 500;
      
      // Store tokens first
      for (let i = 0; i < tokenCount; i++) {
        await tokenManager.storePATToken(
          `https://dev.azure.com/org${i}`,
          'TestProject',
          baseToken
        );
      }
      
      // Measure retrieval time
      const startTime = Date.now();
      
      for (let i = 0; i < tokenCount; i++) {
        const token = await tokenManager.retrievePATToken(
          `https://dev.azure.com/org${i}`,
          'TestProject'
        );
        expect(token).toBe(baseToken);
      }
      
      const retrieveTime = Date.now() - startTime;
      const avgRetrieveTime = retrieveTime / tokenCount;
      
      console.log(`Token Retrieval: ${tokenCount} tokens retrieved in ${retrieveTime}ms (avg: ${avgRetrieveTime.toFixed(2)}ms per token)`);
      
      // Should be able to retrieve tokens very fast
      expect(avgRetrieveTime).toBeLessThan(10);
    });

    test('should handle concurrent token operations', async () => {
      const baseToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const concurrentOps = 100;
      
      const startTime = Date.now();
      
      // Perform concurrent store operations
      const storeOperations = Array.from({ length: concurrentOps }, (_, i) =>
        tokenManager.storePATToken(
          `https://dev.azure.com/org${i}`,
          'TestProject',
          baseToken
        )
      );
      
      await Promise.all(storeOperations);
      
      const storeTime = Date.now() - startTime;
      
      // Perform concurrent retrieve operations
      const retrieveStartTime = Date.now();
      
      const retrieveOperations = Array.from({ length: concurrentOps }, (_, i) =>
        tokenManager.retrievePATToken(
          `https://dev.azure.com/org${i}`,
          'TestProject'
        )
      );
      
      const tokens = await Promise.all(retrieveOperations);
      
      const retrieveTime = Date.now() - retrieveStartTime;
      const totalTime = Date.now() - startTime;
      
      console.log(`Concurrent Operations: ${concurrentOps} store ops in ${storeTime}ms, ${concurrentOps} retrieve ops in ${retrieveTime}ms (total: ${totalTime}ms)`);
      
      expect(tokens.every(token => token === baseToken)).toBe(true);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Database Performance', () => {
    test('should handle large configuration lists efficiently', async () => {
      const configCount = 1000;
      const baseToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      
      // Store many configurations
      console.log(`Storing ${configCount} configurations...`);
      const storeStartTime = Date.now();
      
      const batchSize = 50;
      for (let batch = 0; batch < configCount; batch += batchSize) {
        const batchOperations = [];
        for (let i = batch; i < Math.min(batch + batchSize, configCount); i++) {
          batchOperations.push(
            tokenManager.storePATToken(
              `https://dev.azure.com/org${Math.floor(i / 10)}`,
              `Project${i % 10}`,
              baseToken
            )
          );
        }
        await Promise.all(batchOperations);
      }
      
      const storeTime = Date.now() - storeStartTime;
      console.log(`Stored ${configCount} configurations in ${storeTime}ms`);
      
      // Test listing performance
      const listStartTime = Date.now();
      const allConfigs = tokenManager.getADOConfigurations();
      const listTime = Date.now() - listStartTime;
      
      console.log(`Listed ${allConfigs.length} configurations in ${listTime}ms`);
      
      expect(allConfigs).toHaveLength(configCount);
      expect(listTime).toBeLessThan(2000); // Should list within 2 seconds
    });

    test('should handle database queries efficiently under load', async () => {
      const configCount = 100;
      const baseToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      
      // Setup test data
      for (let i = 0; i < configCount; i++) {
        await tokenManager.storePATToken(
          `https://dev.azure.com/org${i}`,
          'TestProject',
          baseToken,
          { isEnabled: i % 2 === 0 }
        );
      }
      
      // Test various query patterns
      const queryTests = [
        { name: 'Get All Configurations', fn: () => tokenManager.getADOConfigurations() },
        { name: 'Get Specific Configuration', fn: () => tokenManager.getADOConfiguration('https://dev.azure.com/org50', 'TestProject') },
        { name: 'Retrieve Token', fn: () => tokenManager.retrievePATToken('https://dev.azure.com/org25', 'TestProject') },
        { name: 'Test Connection', fn: () => tokenManager.testConnection('https://dev.azure.com/org75', 'TestProject') },
      ];
      
      for (const test of queryTests) {
        const iterations = 100;
        const startTime = Date.now();
        
        for (let i = 0; i < iterations; i++) {
          await test.fn();
        }
        
        const totalTime = Date.now() - startTime;
        const avgTime = totalTime / iterations;
        
        console.log(`${test.name}: ${iterations} operations in ${totalTime}ms (avg: ${avgTime.toFixed(2)}ms)`);
        
        expect(avgTime).toBeLessThan(20); // Each operation should be fast
      }
    });
  });

  describe('Memory Performance', () => {
    test('should not leak memory during repeated operations', async () => {
      const baseToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const iterations = 1000;
      
      // Get baseline memory usage
      if (global.gc) {
        global.gc();
      }
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < iterations; i++) {
        const orgUrl = `https://dev.azure.com/org${i % 10}`; // Reuse some URLs
        const projectName = `Project${i % 5}`; // Reuse some projects
        
        // Store, retrieve, and remove to test cleanup
        await tokenManager.storePATToken(orgUrl, projectName, baseToken);
        const retrieved = await tokenManager.retrievePATToken(orgUrl, projectName);
        expect(retrieved).toBe(baseToken);
        
        if (i % 10 === 9) {
          // Periodically remove old data
          tokenManager.removePATToken(orgUrl, projectName);
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Memory usage after ${iterations} operations:`);
      console.log(`  Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`);
      
      // Memory growth should be reasonable (less than 10MB for this test)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
    });

    test('should handle master key reinitialization efficiently', async () => {
      const reinitCount = 50;
      const baseToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      
      const startTime = Date.now();
      
      for (let i = 0; i < reinitCount; i++) {
        // Clear and reinitialize encryption service
        encryptionService.clearMasterKey();
        await encryptionService.initialize();
        
        // Test basic functionality
        const encrypted = encryptionService.encrypt(baseToken);
        const decrypted = encryptionService.decrypt(encrypted);
        expect(decrypted).toBe(baseToken);
      }
      
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / reinitCount;
      
      console.log(`Master Key Reinitialization: ${reinitCount} reinits in ${totalTime}ms (avg: ${avgTime.toFixed(2)}ms)`);
      
      expect(avgTime).toBeLessThan(100); // Should reinitialize quickly
    });
  });

  describe('Stress Tests', () => {
    test('should handle maximum realistic load', async () => {
      // Simulate a large enterprise with many organizations and projects
      const orgCount = 50;
      const projectsPerOrg = 20;
      const totalConfigs = orgCount * projectsPerOrg;
      const baseToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      
      console.log(`Stress test: ${totalConfigs} configurations (${orgCount} orgs × ${projectsPerOrg} projects)`);
      
      const startTime = Date.now();
      
      // Store all configurations
      const storeStartTime = Date.now();
      for (let orgIndex = 0; orgIndex < orgCount; orgIndex++) {
        const batchOperations = [];
        for (let projIndex = 0; projIndex < projectsPerOrg; projIndex++) {
          batchOperations.push(
            tokenManager.storePATToken(
              `https://dev.azure.com/enterprise-org-${orgIndex.toString().padStart(3, '0')}`,
              `Project-${projIndex.toString().padStart(2, '0')}`,
              baseToken,
              {
                webhookUrl: `https://webhooks.example.com/org${orgIndex}/proj${projIndex}`,
                isEnabled: Math.random() > 0.2 // 80% enabled
              }
            )
          );
        }
        await Promise.all(batchOperations);
        
        // Log progress
        if ((orgIndex + 1) % 10 === 0) {
          console.log(`  Stored configurations for ${orgIndex + 1}/${orgCount} organizations`);
        }
      }
      const storeTime = Date.now() - storeStartTime;
      
      // Test retrieval performance
      const retrieveStartTime = Date.now();
      const sampleSize = Math.min(100, totalConfigs);
      const sampleResults = [];
      
      for (let i = 0; i < sampleSize; i++) {
        const orgIndex = Math.floor(Math.random() * orgCount);
        const projIndex = Math.floor(Math.random() * projectsPerOrg);
        
        const token = await tokenManager.retrievePATToken(
          `https://dev.azure.com/enterprise-org-${orgIndex.toString().padStart(3, '0')}`,
          `Project-${projIndex.toString().padStart(2, '0')}`
        );
        sampleResults.push(token);
      }
      const retrieveTime = Date.now() - retrieveStartTime;
      
      // Test configuration listing
      const listStartTime = Date.now();
      const allConfigs = tokenManager.getADOConfigurations();
      const listTime = Date.now() - listStartTime;
      
      const totalTime = Date.now() - startTime;
      
      console.log(`Stress Test Results:`);
      console.log(`  Total configurations: ${totalConfigs}`);
      console.log(`  Store time: ${storeTime}ms (${(storeTime / totalConfigs).toFixed(2)}ms per config)`);
      console.log(`  Retrieve sample time: ${retrieveTime}ms for ${sampleSize} samples`);
      console.log(`  List time: ${listTime}ms for ${allConfigs.length} configs`);
      console.log(`  Total time: ${totalTime}ms`);
      
      // Verify results
      expect(allConfigs).toHaveLength(totalConfigs);
      expect(sampleResults.every(result => result === baseToken)).toBe(true);
      
      // Performance expectations for stress test
      expect(storeTime / totalConfigs).toBeLessThan(50); // Avg store time per config
      expect(listTime).toBeLessThan(3000); // List all configs within 3 seconds
      expect(retrieveTime / sampleSize).toBeLessThan(20); // Avg retrieve time per sample
    });

    test('should maintain performance under concurrent stress', async () => {
      const concurrentUsers = 20;
      const operationsPerUser = 25;
      const baseToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      
      console.log(`Concurrent stress test: ${concurrentUsers} users × ${operationsPerUser} operations = ${concurrentUsers * operationsPerUser} total operations`);
      
      const startTime = Date.now();
      
      // Simulate concurrent users each performing multiple operations
      const userOperations = Array.from({ length: concurrentUsers }, (_, userIndex) => 
        async () => {
          const userStartTime = Date.now();
          
          for (let opIndex = 0; opIndex < operationsPerUser; opIndex++) {
            const orgUrl = `https://dev.azure.com/user-${userIndex}-org`;
            const projectName = `Project-${opIndex}`;
            
            // Store token
            await tokenManager.storePATToken(orgUrl, projectName, baseToken);
            
            // Retrieve token
            const retrieved = await tokenManager.retrievePATToken(orgUrl, projectName);
            expect(retrieved).toBe(baseToken);
            
            // Test connection
            const connected = await tokenManager.testConnection(orgUrl, projectName);
            expect(connected).toBe(true);
            
            // Occasionally update configuration
            if (opIndex % 5 === 0) {
              tokenManager.updateADOConfiguration(orgUrl, projectName, {
                is_enabled: opIndex % 2 === 0,
                webhook_url: `https://webhook-${opIndex}.example.com`
              });
            }
          }
          
          const userTime = Date.now() - userStartTime;
          return { userIndex, userTime };
        }
      );
      
      const results = await Promise.all(userOperations.map(op => op()));
      
      const totalTime = Date.now() - startTime;
      const avgUserTime = results.reduce((sum, r) => sum + r.userTime, 0) / results.length;
      
      console.log(`Concurrent Stress Test Results:`);
      console.log(`  Total time: ${totalTime}ms`);
      console.log(`  Average time per user: ${avgUserTime.toFixed(2)}ms`);
      console.log(`  Operations per second: ${((concurrentUsers * operationsPerUser * 3 * 1000) / totalTime).toFixed(2)}`); // 3 ops per iteration
      
      // Verify final state
      const finalConfigs = tokenManager.getADOConfigurations();
      expect(finalConfigs).toHaveLength(concurrentUsers * operationsPerUser);
      
      // Performance expectations
      expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(avgUserTime).toBeLessThan(15000); // Each user should complete within 15 seconds
    });
  });
});