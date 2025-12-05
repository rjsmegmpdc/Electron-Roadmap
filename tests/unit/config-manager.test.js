/**
 * Tests for ConfigManager
 * 
 * Tests the configuration management system including environment detection,
 * feature flags, user preferences, and configuration retrieval.
 */

import { ConfigManager } from '../../src/js/config-manager.js';

describe('ConfigManager', () => {
  let configManager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    configManager = new ConfigManager();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('Basic Configuration Management', () => {
    test('should get basic configuration values', () => {
      expect(configManager.get('app.name')).toBe('Roadmap Tool v2');
      expect(configManager.get('app.version')).toBe('1.0.0');
      expect(configManager.get('ui.date_format')).toBe('DD-MM-YYYY');
    });

    test('should return default value for missing keys', () => {
      expect(configManager.get('nonexistent.key', 'default')).toBe('default');
      expect(configManager.get('nonexistent.key')).toBeNull();
    });

    test('should set and get custom configuration values', () => {
      configManager.set('test.key', 'test value');
      expect(configManager.get('test.key')).toBe('test value');
    });

    test('should get all configurations', () => {
      const allConfigs = configManager.getAll();
      expect(allConfigs['app.name']).toBe('Roadmap Tool v2');
      expect(allConfigs['ui.date_format']).toBe('DD-MM-YYYY');
      expect(typeof allConfigs).toBe('object');
      expect(Object.keys(allConfigs).length).toBeGreaterThan(0);
    });
  });

  describe('Environment Detection', () => {
    test('should detect test environment', () => {
      expect(configManager.getEnvironment()).toBe('test');
    });

    test('should provide environment-specific configuration', () => {
      const storageKey = configManager.get('storage.main.key');
      expect(storageKey).toBe('roadmapData_test'); // Test environment override
    });

    test('should fall back to general config when env-specific not available', () => {
      const appName = configManager.get('app.name');
      expect(appName).toBe('Roadmap Tool v2'); // No environment-specific override
    });
  });

  describe('Feature Flags', () => {
    test('should check enabled features', () => {
      expect(configManager.isFeatureEnabled('drag_drop')).toBe(true);
      expect(configManager.isFeatureEnabled('csv_import_export')).toBe(true);
      expect(configManager.isFeatureEnabled('strategic_planning')).toBe(true);
    });

    test('should check disabled features', () => {
      expect(configManager.isFeatureEnabled('github_integration')).toBe(false);
      expect(configManager.isFeatureEnabled('advanced_reporting')).toBe(false);
    });

    test('should return false for nonexistent features', () => {
      expect(configManager.isFeatureEnabled('nonexistent_feature')).toBe(false);
    });
  });

  describe('User Preferences', () => {
    test('should persist and load user preferences', () => {
      // Set a user preference
      configManager.set('user.theme', 'dark');
      configManager.set('user.items_per_page', 50);

      // Create new instance to test persistence
      const newConfigManager = new ConfigManager();
      
      expect(newConfigManager.get('user.theme')).toBe('dark');
      expect(newConfigManager.get('user.items_per_page')).toBe(50);
    });

    test('should handle corrupt user preferences gracefully', () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('roadmapPreferences', 'invalid json');
      
      // Should not throw error when creating new instance
      expect(() => new ConfigManager()).not.toThrow();
    });

    test('should not interfere with system configurations', () => {
      configManager.set('user.app.name', 'User Override');
      
      // System config should still be accessible
      expect(configManager.get('app.name')).toBe('Roadmap Tool v2');
      expect(configManager.get('user.app.name')).toBe('User Override');
    });
  });

  describe('Storage Configuration', () => {
    test('should provide storage configuration values', () => {
      expect(configManager.get('storage.main.key')).toBe('roadmapData_test');
      expect(configManager.get('storage.backup.prefix')).toBe('roadmapBackup_test_');
      expect(configManager.get('storage.max.backups')).toBe(10);
    });
  });

  describe('Validation Configuration', () => {
    test('should provide validation limits', () => {
      expect(configManager.get('validation.project.title.max_length')).toBe(255);
      expect(configManager.get('validation.budget.max_value')).toBe(999999999999);
    });
  });

  describe('Performance Configuration', () => {
    test('should provide performance settings', () => {
      expect(configManager.get('performance.debounce.search')).toBe(300);
      expect(configManager.get('performance.cache.ttl')).toBe(300000);
    });
  });

  describe('Error Handling', () => {
    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw when setting user preference
      expect(() => configManager.set('user.test', 'value')).not.toThrow();

      // Restore original localStorage
      localStorage.setItem = originalSetItem;
    });
  });
});