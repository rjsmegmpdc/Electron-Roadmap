/**
 * Integration test for audit logging and backup/restore functionality
 * This test verifies that the audit logger and backup service are properly initialized
 * and can be accessed through the IPC API.
 */

const { test, expect } = require('@playwright/test');
const { ElectronApplication, _electron } = require('@playwright/test');

test.describe('Audit Logging and Backup Integration', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    // Launch the Electron app
    electronApp = await _electron.launch({
      args: ['dist/main/main.js'],
      timeout: 30000
    });
    
    // Get the first window
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should have audit logger API available in window', async () => {
    // Check if auditLogger API is exposed
    const hasAuditLogger = await window.evaluate(() => {
      return typeof window.auditLogger === 'object' && 
             typeof window.auditLogger.logUserInteraction === 'function';
    });
    
    expect(hasAuditLogger).toBe(true);
  });

  test('should log user interaction successfully', async () => {
    const result = await window.evaluate(async () => {
      try {
        // Test logging a user interaction
        await window.auditLogger.logUserInteraction(
          'test_click', 
          'TestComponent', 
          'test-button',
          { testData: 'integration-test' }
        );
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
  });

  test('should log form changes successfully', async () => {
    const result = await window.evaluate(async () => {
      try {
        await window.auditLogger.logFormChange(
          'TestForm',
          'testField',
          'oldValue',
          'newValue',
          { valid: true, errors: [] }
        );
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
  });

  test('should log navigation successfully', async () => {
    const result = await window.evaluate(async () => {
      try {
        await window.auditLogger.logNavigation('/old-route', '/new-route', 'user');
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
  });

  test('should get recent audit events', async () => {
    const result = await window.evaluate(async () => {
      try {
        const events = await window.auditLogger.getRecentEvents(10);
        return { 
          success: true, 
          hasEvents: Array.isArray(events) && events.length > 0,
          eventCount: events.length 
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.hasEvents).toBe(true);
    expect(result.eventCount).toBeGreaterThan(0);
  });

  test('should get audit stats', async () => {
    const result = await window.evaluate(async () => {
      try {
        const stats = await window.auditLogger.getStats();
        return { 
          success: true, 
          hasStats: typeof stats === 'object' && stats.totalEvents !== undefined,
          totalEvents: stats.totalEvents
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.hasStats).toBe(true);
    expect(result.totalEvents).toBeGreaterThan(0);
  });

  test('should have backup/restore API available', async () => {
    const hasBackupAPI = await window.evaluate(() => {
      return typeof window.electronAPI.createBackup === 'function' &&
             typeof window.electronAPI.listBackups === 'function' &&
             typeof window.electronAPI.restoreFromBackup === 'function';
    });
    
    expect(hasBackupAPI).toBe(true);
  });

  test('should create backup successfully', async () => {
    const result = await window.evaluate(async () => {
      try {
        const backupResult = await window.electronAPI.createBackup(
          'Integration test backup',
          ['test', 'integration'],
          false // Don't include full audit history for test
        );
        return backupResult;
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.backupPath).toBeDefined();
    expect(typeof result.backupPath).toBe('string');
  });

  test('should list backups successfully', async () => {
    const result = await window.evaluate(async () => {
      try {
        const listResult = await window.electronAPI.listBackups();
        return {
          success: listResult.success,
          hasBackups: Array.isArray(listResult.backups) && listResult.backups.length > 0,
          backupCount: listResult.backups ? listResult.backups.length : 0
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.hasBackups).toBe(true);
    expect(result.backupCount).toBeGreaterThan(0);
  });

  test('should handle errors gracefully in audit logging', async () => {
    const result = await window.evaluate(async () => {
      try {
        // Test logging an error
        const testError = new Error('Test error for audit logging');
        await window.auditLogger.logError(testError, 'TestComponent', { 
          testContext: 'error-handling-test' 
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
  });

  test('should log data changes successfully', async () => {
    const result = await window.evaluate(async () => {
      try {
        await window.auditLogger.logDataChange(
          'update',
          'project',
          'test-project-123',
          { name: 'Old Project Name' },
          { name: 'New Project Name' }
        );
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
  });
});