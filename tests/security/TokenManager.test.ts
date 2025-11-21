import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Mock electron app
jest.mock('electron', () => ({
  app: global.mockElectronApp,
}));

import { TokenManager } from '../../app/main/services/security/TokenManager';
import { EncryptionService } from '../../app/main/services/security/EncryptionService';

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  let encryptionService: EncryptionService;
  let testDb: Database.Database;
  let testDbPath: string;

  beforeAll(async () => {
    // Initialize encryption service
    encryptionService = EncryptionService.getInstance();
    await encryptionService.initialize();

    // Create test database
    testDbPath = path.join(global.testTempDir, 'test-token-manager.db');
    testDb = new Database(testDbPath);

    // Create required tables
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
    `);
  });

  beforeEach(() => {
    // Clear the table
    testDb.exec('DELETE FROM ado_config');
    
    // Get fresh instance and initialize with test database
    tokenManager = TokenManager.getInstance();
    tokenManager.initialize(testDb);
  });

  afterEach(() => {
    // Clear any sensitive data from memory
    encryptionService.clearMasterKey();
  });

  afterAll(async () => {
    if (testDb) {
      testDb.close();
    }
    // Clean up test database file
    try {
      await fs.unlink(testDbPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    test('should initialize with database connection', () => {
      const manager = TokenManager.getInstance();
      expect(() => manager.initialize(testDb)).not.toThrow();
    });

    test('should be singleton', () => {
      const manager1 = TokenManager.getInstance();
      const manager2 = TokenManager.getInstance();
      expect(manager1).toBe(manager2);
    });

    test('should throw error when not initialized', async () => {
      const uninitializedManager = TokenManager.getInstance();
      // Reset the manager by creating a new instance (for testing)
      (uninitializedManager as any).db = null;
      
      await expect(uninitializedManager.storePATToken('org', 'project', 'token'))
        .rejects.toThrow('TokenManager not initialized with database');
    });
  });

  describe('PAT Token Storage', () => {
    beforeEach(async () => {
      await encryptionService.initialize();
    });

    test('should store new PAT token successfully', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';

      await expect(tokenManager.storePATToken(orgUrl, projectName, patToken))
        .resolves.not.toThrow();

      // Verify record exists in database
      const record = testDb.prepare('SELECT * FROM ado_config WHERE org_url = ? AND project_name = ?')
        .get(orgUrl, projectName);
      
      expect(record).toBeDefined();
      expect(record.org_url).toBe(orgUrl);
      expect(record.project_name).toBe(projectName);
      expect(record.pat_token).toBeTruthy();
      expect(record.is_enabled).toBe(1); // SQLite boolean
      expect(record.connection_status).toBe('connected');
    });

    test('should store token with options', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const options = {
        webhookUrl: 'https://example.com/webhook',
        webhookSecret: 'custom-secret',
        isEnabled: false
      };

      await tokenManager.storePATToken(orgUrl, projectName, patToken, options);

      const record = testDb.prepare('SELECT * FROM ado_config WHERE org_url = ? AND project_name = ?')
        .get(orgUrl, projectName);
      
      expect(record.webhook_url).toBe(options.webhookUrl);
      expect(record.webhook_secret).toBe(options.webhookSecret);
      expect(record.is_enabled).toBe(0); // SQLite boolean false
    });

    test('should update existing configuration', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const patToken1 = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      const patToken2 = 'ZYXWVUTSRQPONMLKJIHGFEDCBA9876543210abcdefghijklmn';

      // Store first token
      await tokenManager.storePATToken(orgUrl, projectName, patToken1);
      
      // Store second token (should update)
      await tokenManager.storePATToken(orgUrl, projectName, patToken2, { isEnabled: false });

      // Should only have one record
      const records = testDb.prepare('SELECT * FROM ado_config').all();
      expect(records).toHaveLength(1);
      
      const record = records[0];
      expect(record.is_enabled).toBe(0); // Updated to false
    });

    test('should reject invalid PAT token format', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const invalidToken = 'invalid-token';

      await expect(tokenManager.storePATToken(orgUrl, projectName, invalidToken))
        .rejects.toThrow('Invalid PAT token format');
    });

    test('should generate webhook secret if not provided', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';

      await tokenManager.storePATToken(orgUrl, projectName, patToken);

      const record = testDb.prepare('SELECT webhook_secret FROM ado_config WHERE org_url = ? AND project_name = ?')
        .get(orgUrl, projectName);
      
      expect(record.webhook_secret).toBeTruthy();
      expect(record.webhook_secret.length).toBeGreaterThan(20);
    });
  });

  describe('PAT Token Retrieval', () => {
    beforeEach(async () => {
      await encryptionService.initialize();
    });

    test('should retrieve and decrypt PAT token', async () => {
      const orgUrl = 'https://dev.azure.com/testorg';
      const projectName = 'TestProject';
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';

      // Store token
      await tokenManager.storePATToken(orgUrl, projectName, patToken);

      // Retrieve token
      const retrievedToken = await tokenManager.retrievePATToken(orgUrl, projectName);
      
      expect(retrievedToken).toBe(patToken);
    });

    test('should return null for non-existent configuration', async () => {
      const token = await tokenManager.retrievePATToken('nonexistent', 'project');
      expect(token).toBeNull();
    });

    test('should return null for configuration without token', async () => {
      // Insert configuration without token
      const now = new Date().toISOString();
      testDb.prepare(`
        INSERT INTO ado_config (org_url, project_name, auth_mode, created_at, updated_at)
        VALUES (?, ?, 'PAT', ?, ?)
      `).run('https://dev.azure.com/testorg', 'TestProject', now, now);

      const token = await tokenManager.retrievePATToken('https://dev.azure.com/testorg', 'TestProject');
      expect(token).toBeNull();
    });

    test('should handle decryption errors gracefully', async () => {
      // Insert invalid encrypted token
      const now = new Date().toISOString();
      testDb.prepare(`
        INSERT INTO ado_config (org_url, project_name, auth_mode, pat_token, created_at, updated_at)
        VALUES (?, ?, 'PAT', ?, ?, ?)
      `).run('https://dev.azure.com/testorg', 'TestProject', 'invalid-encrypted-data', now, now);

      const token = await tokenManager.retrievePATToken('https://dev.azure.com/testorg', 'TestProject');
      expect(token).toBeNull();
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await encryptionService.initialize();
      
      // Add test data
      const now = new Date().toISOString();
      const configs = [
        ['https://dev.azure.com/org1', 'Project1', true, 'connected'],
        ['https://dev.azure.com/org2', 'Project2', false, 'disconnected'],
        ['https://dev.azure.com/org3', 'Project3', true, 'error'],
      ];

      configs.forEach(([orgUrl, projectName, isEnabled, status], index) => {
        testDb.prepare(`
          INSERT INTO ado_config (
            org_url, project_name, auth_mode, webhook_url, webhook_secret,
            max_retry_attempts, base_delay_ms, is_enabled, connection_status,
            created_at, updated_at
          ) VALUES (?, ?, 'PAT', ?, ?, 3, 500, ?, ?, ?, ?)
        `).run(
          orgUrl, projectName, `https://example.com/webhook${index}`, `secret${index}`,
          isEnabled, status, now, now
        );
      });
    });

    test('should get all ADO configurations', () => {
      const configs = tokenManager.getADOConfigurations();
      
      expect(configs).toHaveLength(3);
      expect(configs[0].org_url).toBe('https://dev.azure.com/org1');
      expect(configs[0].is_enabled).toBe(true);
      expect(configs[0].connection_status).toBe('connected');
    });

    test('should get specific ADO configuration', async () => {
      const config = await tokenManager.getADOConfiguration('https://dev.azure.com/org1', 'Project1');
      
      expect(config).toBeDefined();
      expect(config!.org_url).toBe('https://dev.azure.com/org1');
      expect(config!.project_name).toBe('Project1');
      expect(config!.encrypted_pat_token).toBe('[ENCRYPTED]'); // Should be masked
    });

    test('should return null for non-existent configuration', async () => {
      const config = await tokenManager.getADOConfiguration('nonexistent', 'project');
      expect(config).toBeNull();
    });

    test('should update configuration settings', () => {
      const updates = {
        webhook_url: 'https://new-webhook.com',
        is_enabled: false,
        connection_status: 'error' as const
      };

      expect(() => tokenManager.updateADOConfiguration('https://dev.azure.com/org1', 'Project1', updates))
        .not.toThrow();

      const record = testDb.prepare('SELECT * FROM ado_config WHERE org_url = ? AND project_name = ?')
        .get('https://dev.azure.com/org1', 'Project1');
      
      expect(record.webhook_url).toBe(updates.webhook_url);
      expect(record.is_enabled).toBe(0); // SQLite boolean false
      expect(record.connection_status).toBe(updates.connection_status);
    });

    test('should throw error when updating non-existent configuration', () => {
      expect(() => tokenManager.updateADOConfiguration('nonexistent', 'project', { is_enabled: true }))
        .toThrow('No configuration found to update');
    });

    test('should handle empty updates', () => {
      expect(() => tokenManager.updateADOConfiguration('https://dev.azure.com/org1', 'Project1', {}))
        .not.toThrow();
    });
  });

  describe('PAT Token Updates', () => {
    beforeEach(async () => {
      await encryptionService.initialize();
      
      // Create initial configuration
      const now = new Date().toISOString();
      testDb.prepare(`
        INSERT INTO ado_config (org_url, project_name, auth_mode, created_at, updated_at)
        VALUES (?, ?, 'PAT', ?, ?)
      `).run('https://dev.azure.com/testorg', 'TestProject', now, now);
    });

    test('should update existing PAT token', async () => {
      const newToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      
      await expect(tokenManager.updatePATToken('https://dev.azure.com/testorg', 'TestProject', newToken))
        .resolves.not.toThrow();

      // Verify token can be retrieved
      const retrievedToken = await tokenManager.retrievePATToken('https://dev.azure.com/testorg', 'TestProject');
      expect(retrievedToken).toBe(newToken);
    });

    test('should reject invalid token format', async () => {
      const invalidToken = 'invalid-token';
      
      await expect(tokenManager.updatePATToken('https://dev.azure.com/testorg', 'TestProject', invalidToken))
        .rejects.toThrow('Invalid PAT token format');
    });

    test('should throw error for non-existent configuration', async () => {
      const validToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      
      await expect(tokenManager.updatePATToken('nonexistent', 'project', validToken))
        .rejects.toThrow('No configuration found to update');
    });

    test('should update connection status when updating token', async () => {
      const newToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      
      await tokenManager.updatePATToken('https://dev.azure.com/testorg', 'TestProject', newToken);
      
      const record = testDb.prepare('SELECT connection_status FROM ado_config WHERE org_url = ? AND project_name = ?')
        .get('https://dev.azure.com/testorg', 'TestProject');
      
      expect(record.connection_status).toBe('connected');
    });
  });

  describe('Configuration Removal', () => {
    beforeEach(() => {
      // Add test configuration
      const now = new Date().toISOString();
      testDb.prepare(`
        INSERT INTO ado_config (org_url, project_name, auth_mode, created_at, updated_at)
        VALUES (?, ?, 'PAT', ?, ?)
      `).run('https://dev.azure.com/testorg', 'TestProject', now, now);
    });

    test('should remove PAT token and configuration', () => {
      expect(() => tokenManager.removePATToken('https://dev.azure.com/testorg', 'TestProject'))
        .not.toThrow();

      // Verify record is deleted
      const record = testDb.prepare('SELECT * FROM ado_config WHERE org_url = ? AND project_name = ?')
        .get('https://dev.azure.com/testorg', 'TestProject');
      
      expect(record).toBeUndefined();
    });

    test('should throw error for non-existent configuration', () => {
      expect(() => tokenManager.removePATToken('nonexistent', 'project'))
        .toThrow('No configuration found to remove');
    });
  });

  describe('Connection Testing', () => {
    beforeEach(async () => {
      await encryptionService.initialize();
      
      // Store a valid token
      await tokenManager.storePATToken(
        'https://dev.azure.com/testorg',
        'TestProject',
        'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP'
      );
    });

    test('should test connection with valid token', async () => {
      const result = await tokenManager.testConnection('https://dev.azure.com/testorg', 'TestProject');
      expect(result).toBe(true); // Should pass format validation
    });

    test('should fail connection test with no token', async () => {
      // Add configuration without token
      const now = new Date().toISOString();
      testDb.prepare(`
        INSERT INTO ado_config (org_url, project_name, auth_mode, created_at, updated_at)
        VALUES (?, ?, 'PAT', ?, ?)
      `).run('https://dev.azure.com/notoken', 'Project', now, now);

      const result = await tokenManager.testConnection('https://dev.azure.com/notoken', 'Project');
      expect(result).toBe(false);
    });

    test('should handle connection test errors', async () => {
      const result = await tokenManager.testConnection('nonexistent', 'project');
      expect(result).toBe(false);
    });
  });

  describe('Connection Status Management', () => {
    beforeEach(() => {
      // Add test configuration
      const now = new Date().toISOString();
      testDb.prepare(`
        INSERT INTO ado_config (org_url, project_name, auth_mode, connection_status, created_at, updated_at)
        VALUES (?, ?, 'PAT', 'disconnected', ?, ?)
      `).run('https://dev.azure.com/testorg', 'TestProject', now, now);
    });

    test('should update connection status', () => {
      const syncTime = new Date().toISOString();
      
      expect(() => tokenManager.updateConnectionStatus(
        'https://dev.azure.com/testorg',
        'TestProject',
        'connected',
        syncTime
      )).not.toThrow();

      const record = testDb.prepare('SELECT connection_status, last_sync_at FROM ado_config WHERE org_url = ? AND project_name = ?')
        .get('https://dev.azure.com/testorg', 'TestProject');
      
      expect(record.connection_status).toBe('connected');
      expect(record.last_sync_at).toBe(syncTime);
    });

    test('should update status without sync time', () => {
      expect(() => tokenManager.updateConnectionStatus(
        'https://dev.azure.com/testorg',
        'TestProject',
        'error'
      )).not.toThrow();

      const record = testDb.prepare('SELECT connection_status FROM ado_config WHERE org_url = ? AND project_name = ?')
        .get('https://dev.azure.com/testorg', 'TestProject');
      
      expect(record.connection_status).toBe('error');
    });
  });

  describe('Webhook Management', () => {
    test('should generate webhook secret', () => {
      const secret = tokenManager.generateWebhookSecret();
      
      expect(secret).toBeTruthy();
      expect(secret.length).toBeGreaterThan(30);
      expect(secret).toMatch(/^[A-Za-z0-9_-]+$/); // Base64url format
    });

    test('should generate different secrets each time', () => {
      const secret1 = tokenManager.generateWebhookSecret();
      const secret2 = tokenManager.generateWebhookSecret();
      
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', () => {
      // Close the database to simulate error
      testDb.close();
      
      expect(() => tokenManager.getADOConfigurations()).toThrow();
    });

    test('should handle invalid database operations', () => {
      // Try to insert duplicate primary keys or violate constraints
      const now = new Date().toISOString();
      
      // This should work
      testDb.prepare(`
        INSERT INTO ado_config (org_url, project_name, auth_mode, created_at, updated_at)
        VALUES (?, ?, 'PAT', ?, ?)
      `).run('https://dev.azure.com/testorg', 'TestProject', now, now);
      
      // This should also work (different project)
      testDb.prepare(`
        INSERT INTO ado_config (org_url, project_name, auth_mode, created_at, updated_at)
        VALUES (?, ?, 'PAT', ?, ?)
      `).run('https://dev.azure.com/testorg', 'TestProject2', now, now);
    });
  });

  describe('Security Considerations', () => {
    beforeEach(async () => {
      await encryptionService.initialize();
    });

    test('should not expose raw tokens in configuration list', () => {
      // Store a token
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      testDb.prepare(`
        INSERT INTO ado_config (org_url, project_name, auth_mode, pat_token, created_at, updated_at)
        VALUES (?, ?, 'PAT', ?, ?, ?)
      `).run(
        'https://dev.azure.com/testorg',
        'TestProject',
        JSON.stringify(encryptionService.encrypt(patToken)),
        new Date().toISOString(),
        new Date().toISOString()
      );

      const configs = tokenManager.getADOConfigurations();
      
      // Should not include encrypted_pat_token field in list
      expect(configs[0]).not.toHaveProperty('encrypted_pat_token');
      expect(configs[0]).not.toHaveProperty('pat_token');
    });

    test('should mask tokens in single configuration retrieval', async () => {
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      await tokenManager.storePATToken('https://dev.azure.com/testorg', 'TestProject', patToken);

      const config = await tokenManager.getADOConfiguration('https://dev.azure.com/testorg', 'TestProject');
      
      expect(config).toBeDefined();
      expect(config!.encrypted_pat_token).toBe('[ENCRYPTED]');
    });

    test('should handle concurrent operations safely', async () => {
      const patToken = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
      
      // Perform multiple operations concurrently
      const operations = [
        tokenManager.storePATToken('https://dev.azure.com/org1', 'Project1', patToken),
        tokenManager.storePATToken('https://dev.azure.com/org2', 'Project2', patToken),
        tokenManager.storePATToken('https://dev.azure.com/org3', 'Project3', patToken),
      ];

      await expect(Promise.all(operations)).resolves.not.toThrow();
      
      // All should be stored
      const configs = tokenManager.getADOConfigurations();
      expect(configs).toHaveLength(3);
    });
  });
});