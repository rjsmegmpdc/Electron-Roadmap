/**
 * Enhanced Data Persistence Manager
 * 
 * Provides comprehensive data persistence with versioning, migration,
 * backup/restore functionality, and advanced storage management.
 */

import { eventBus } from './event-bus.js';
import { logger } from './logger.js';
import { configManager } from './config-manager.js';
import { errorHandler } from './error-handler.js';
import { validationManager } from './validators/index.js';
import DateUtils from './date-utils.js';

export class DataPersistenceManager {
  constructor() {
    this.storagePrefix = 'roadmap_v2_';
    this.currentVersion = 2;
    this.compressionEnabled = configManager.get('storage.compression', true);
    this.encryptionEnabled = configManager.get('storage.encryption', false);
    this.backupEnabled = configManager.get('storage.autoBackup', true);
    this.maxBackups = configManager.get('storage.maxBackups', 10);
    
    this.migrations = new Map();
    this.initialized = false;
    
    this.logger = logger.group ? logger.group('DataPersistence') : logger;
    
    this._setupEventListeners();
    this._registerMigrations();
  }

  /**
   * Initialize the data persistence manager
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      this.logger.info('Initializing enhanced data persistence manager');
      
      // Check storage availability
      await this._checkStorageAvailability();
      
      // Perform any necessary migrations
      await this._performMigrations();
      
      // Setup auto-backup if enabled
      if (this.backupEnabled) {
        this._setupAutoBackup();
      }
      
      // Cleanup old data if necessary
      await this._cleanupOldData();
      
      this.initialized = true;
      
      eventBus.emit('persistence:initialized', {
        version: this.currentVersion,
        backupEnabled: this.backupEnabled,
        compressionEnabled: this.compressionEnabled
      });
      
      this.logger.info('Data persistence manager initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize data persistence manager', { error: error.message });
      errorHandler.handleError(error, 'DataPersistenceManager.initialize');
      throw error;
    }
  }

  /**
   * Save data with versioning and validation
   * @param {string} key - Storage key
   * @param {*} data - Data to save
   * @param {Object} options - Save options
   * @returns {Promise<boolean>} Success status
   */
  async save(key, data, options = {}) {
    try {
      const startTime = performance.now();
      
      // Validate data if schema provided
      if (options.schema) {
        const validationResult = validationManager.validateWithSchema(data, options.schema);
        if (!validationResult.valid) {
          throw new Error(`Data validation failed: ${JSON.stringify(validationResult.getFieldMessages())}`);
        }
      }
      
      // Create backup before save if enabled
      if (this.backupEnabled && options.backup !== false) {
        await this._createBackup(key);
      }
      
      // Prepare data for storage
      const storageData = await this._prepareForStorage(data, options);
      const storageKey = this._getStorageKey(key);
      
      // Save to storage
      await this._writeToStorage(storageKey, storageData);
      
      // Update metadata
      await this._updateMetadata(key, {
        lastModified: new Date().toISOString(),
        version: this.currentVersion,
        size: JSON.stringify(storageData).length,
        checksum: await this._calculateChecksum(storageData)
      });
      
      const duration = performance.now() - startTime;
      
      this.logger.debug(`Data saved successfully`, {
        key,
        size: JSON.stringify(storageData).length,
        duration: `${duration.toFixed(2)}ms`
      });
      
      eventBus.emit('persistence:saved', {
        key,
        size: JSON.stringify(storageData).length,
        duration,
        version: this.currentVersion
      });
      
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to save data for key: ${key}`, { error: error.message });
      errorHandler.handleError(error, 'DataPersistenceManager.save', { key });
      
      eventBus.emit('persistence:save:failed', { key, error: error.message });
      return false;
    }
  }

  /**
   * Load data with migration support
   * @param {string} key - Storage key
   * @param {Object} options - Load options
   * @returns {Promise<*>} Loaded data or null
   */
  async load(key, options = {}) {
    try {
      const startTime = performance.now();
      const storageKey = this._getStorageKey(key);
      
      // Check if data exists
      if (!await this._existsInStorage(storageKey)) {
        return options.defaultValue || null;
      }
      
      // Load raw data
      const rawData = await this._readFromStorage(storageKey);
      if (!rawData) {
        return options.defaultValue || null;
      }
      
      // Parse and migrate if necessary
      const data = await this._processLoadedData(rawData, options);
      
      // Validate loaded data if schema provided
      if (options.schema && data) {
        const validationResult = validationManager.validateWithSchema(data, options.schema);
        if (!validationResult.valid) {
          this.logger.warn(`Loaded data validation failed for key: ${key}`, {
            errors: validationResult.getFieldMessages()
          });
          
          if (options.strict) {
            throw new Error(`Loaded data validation failed: ${JSON.stringify(validationResult.getFieldMessages())}`);
          }
        }
      }
      
      const duration = performance.now() - startTime;
      
      this.logger.debug(`Data loaded successfully`, {
        key,
        duration: `${duration.toFixed(2)}ms`
      });
      
      eventBus.emit('persistence:loaded', { key, duration });
      
      return data;
      
    } catch (error) {
      this.logger.error(`Failed to load data for key: ${key}`, { error: error.message });
      errorHandler.handleError(error, 'DataPersistenceManager.load', { key });
      
      eventBus.emit('persistence:load:failed', { key, error: error.message });
      return options.defaultValue || null;
    }
  }

  /**
   * Delete data with backup option
   * @param {string} key - Storage key
   * @param {Object} options - Delete options
   * @returns {Promise<boolean>} Success status
   */
  async delete(key, options = {}) {
    try {
      const storageKey = this._getStorageKey(key);
      
      // Create backup before delete if requested
      if (options.backup) {
        await this._createBackup(key, 'before-delete');
      }
      
      // Delete from storage
      await this._removeFromStorage(storageKey);
      
      // Remove metadata
      await this._removeMetadata(key);
      
      this.logger.debug(`Data deleted successfully`, { key });
      
      eventBus.emit('persistence:deleted', { key });
      
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to delete data for key: ${key}`, { error: error.message });
      errorHandler.handleError(error, 'DataPersistenceManager.delete', { key });
      return false;
    }
  }

  /**
   * List all stored keys with metadata
   * @param {Object} options - List options
   * @returns {Promise<Array>} Array of key information
   */
  async listKeys(options = {}) {
    try {
      const keys = [];
      const prefix = this._getStorageKey('');
      
      // Get all keys from storage
      const allKeys = await this._getAllStorageKeys();
      
      for (const storageKey of allKeys) {
        if (storageKey.startsWith(prefix) && !storageKey.includes('_metadata_') && !storageKey.includes('_backup_')) {
          const key = storageKey.replace(prefix, '');
          const metadata = await this._getMetadata(key);
          
          keys.push({
            key,
            ...metadata,
            exists: true
          });
        }
      }
      
      // Apply filters if provided
      if (options.filter) {
        return keys.filter(options.filter);
      }
      
      // Apply sorting if provided
      if (options.sort) {
        keys.sort(options.sort);
      }
      
      return keys;
      
    } catch (error) {
      this.logger.error('Failed to list keys', { error: error.message });
      errorHandler.handleError(error, 'DataPersistenceManager.listKeys');
      return [];
    }
  }

  /**
   * Export data for backup or transfer
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export data
   */
  async exportData(options = {}) {
    try {
      this.logger.info('Starting data export');
      const startTime = performance.now();
      
      const exportData = {
        version: this.currentVersion,
        exportedAt: new Date().toISOString(),
        metadata: {
          source: 'Roadmap Tool v2',
          exportOptions: options
        },
        data: {}
      };
      
      // Get keys to export
      const keys = options.keys || (await this.listKeys()).map(item => item.key);
      
      // Export each key
      for (const key of keys) {
        const data = await this.load(key, { raw: true });
        if (data !== null) {
          exportData.data[key] = data;
        }
      }
      
      // Validate export data
      const validationResult = validationManager.validateExportConfig(options);
      if (!validationResult.valid) {
        this.logger.warn('Export options validation warnings', {
          warnings: validationResult.warnings
        });
      }
      
      // Compress if requested
      if (options.compress) {
        exportData.compressed = true;
        exportData.data = await this._compress(JSON.stringify(exportData.data));
      }
      
      const duration = performance.now() - startTime;
      
      this.logger.info('Data export completed', {
        keys: keys.length,
        duration: `${duration.toFixed(2)}ms`
      });
      
      eventBus.emit('persistence:exported', {
        keys: keys.length,
        duration,
        compressed: !!options.compress
      });
      
      return exportData;
      
    } catch (error) {
      this.logger.error('Failed to export data', { error: error.message });
      errorHandler.handleError(error, 'DataPersistenceManager.exportData');
      throw error;
    }
  }

  /**
   * Import data from backup or transfer
   * @param {Object} importData - Data to import
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import result
   */
  async importData(importData, options = {}) {
    try {
      this.logger.info('Starting data import');
      const startTime = performance.now();
      
      // Validate import data
      const validationResult = validationManager.validateImportData(importData);
      if (!validationResult.valid) {
        throw new Error(`Import data validation failed: ${JSON.stringify(validationResult.getFieldMessages())}`);
      }
      
      // Check version compatibility
      if (importData.version > this.currentVersion) {
        this.logger.warn('Import data version is newer than current version', {
          importVersion: importData.version,
          currentVersion: this.currentVersion
        });
      }
      
      // Create backup before import if requested
      if (options.backup !== false) {
        await this._createFullBackup('before-import');
      }
      
      const result = {
        imported: 0,
        skipped: 0,
        errors: []
      };
      
      let data = importData.data;
      
      // Decompress if necessary
      if (importData.compressed) {
        data = JSON.parse(await this._decompress(data));
      }
      
      // Import each key
      for (const [key, keyData] of Object.entries(data)) {
        try {
          // Skip if key exists and overwrite is false
          if (!options.overwrite && await this.exists(key)) {
            result.skipped++;
            continue;
          }
          
          // Migrate data if necessary
          const migratedData = await this._migrateData(keyData, importData.version, this.currentVersion);
          
          // Save imported data
          await this.save(key, migratedData, { backup: false });
          result.imported++;
          
        } catch (error) {
          result.errors.push({ key, error: error.message });
          this.logger.error(`Failed to import key: ${key}`, { error: error.message });
        }
      }
      
      const duration = performance.now() - startTime;
      
      this.logger.info('Data import completed', {
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors.length,
        duration: `${duration.toFixed(2)}ms`
      });
      
      eventBus.emit('persistence:imported', {
        ...result,
        duration
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('Failed to import data', { error: error.message });
      errorHandler.handleError(error, 'DataPersistenceManager.importData');
      throw error;
    }
  }

  /**
   * Create backup of specific key or all data
   * @param {string|null} key - Key to backup or null for full backup
   * @param {string} suffix - Backup suffix
   * @returns {Promise<string>} Backup key
   */
  async createBackup(key = null, suffix = '') {
    try {
      if (key) {
        return await this._createBackup(key, suffix);
      } else {
        return await this._createFullBackup(suffix);
      }
    } catch (error) {
      this.logger.error('Failed to create backup', { key, error: error.message });
      errorHandler.handleError(error, 'DataPersistenceManager.createBackup', { key });
      throw error;
    }
  }

  /**
   * Restore from backup
   * @param {string} backupKey - Backup key to restore
   * @param {Object} options - Restore options
   * @returns {Promise<boolean>} Success status
   */
  async restoreFromBackup(backupKey, options = {}) {
    try {
      this.logger.info('Starting restore from backup', { backupKey });
      
      // Load backup data
      const backupData = await this._readFromStorage(backupKey);
      if (!backupData) {
        throw new Error(`Backup not found: ${backupKey}`);
      }
      
      // Parse backup
      const backup = JSON.parse(backupData);
      
      // Restore based on backup type
      if (backup.type === 'full') {
        return await this._restoreFullBackup(backup, options);
      } else {
        return await this._restoreKeyBackup(backup, options);
      }
      
    } catch (error) {
      this.logger.error('Failed to restore from backup', { backupKey, error: error.message });
      errorHandler.handleError(error, 'DataPersistenceManager.restoreFromBackup', { backupKey });
      return false;
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    try {
      const stats = {
        totalKeys: 0,
        totalSize: 0,
        backupCount: 0,
        oldestEntry: null,
        newestEntry: null,
        versionDistribution: {},
        sizeDistribution: {
          small: 0,  // < 1KB
          medium: 0, // 1KB - 100KB
          large: 0   // > 100KB
        }
      };
      
      const keys = await this.listKeys();
      
      for (const keyInfo of keys) {
        stats.totalKeys++;
        stats.totalSize += keyInfo.size || 0;
        
        // Version distribution
        const version = keyInfo.version || 'unknown';
        stats.versionDistribution[version] = (stats.versionDistribution[version] || 0) + 1;
        
        // Size distribution
        const size = keyInfo.size || 0;
        if (size < 1024) {
          stats.sizeDistribution.small++;
        } else if (size < 102400) {
          stats.sizeDistribution.medium++;
        } else {
          stats.sizeDistribution.large++;
        }
        
        // Date tracking
        const lastModified = new Date(keyInfo.lastModified || 0);
        if (!stats.oldestEntry || lastModified < new Date(stats.oldestEntry)) {
          stats.oldestEntry = keyInfo.lastModified;
        }
        if (!stats.newestEntry || lastModified > new Date(stats.newestEntry)) {
          stats.newestEntry = keyInfo.lastModified;
        }
      }
      
      // Count backups
      const allKeys = await this._getAllStorageKeys();
      stats.backupCount = allKeys.filter(key => key.includes('_backup_')).length;
      
      return stats;
      
    } catch (error) {
      this.logger.error('Failed to get storage stats', { error: error.message });
      return null;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Key to check
   * @returns {Promise<boolean>} Existence status
   */
  async exists(key) {
    try {
      const storageKey = this._getStorageKey(key);
      return await this._existsInStorage(storageKey);
    } catch (error) {
      return false;
    }
  }

  // Private Methods

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Listen for configuration changes
    eventBus.on('config:changed', (event) => {
      if (event.key.startsWith('storage.')) {
        this._updateStorageConfig();
      }
    });

    // Listen for low storage warnings
    eventBus.on('storage:low', () => {
      this._handleLowStorage();
    });
  }

  /**
   * Register data migrations
   * @private
   */
  _registerMigrations() {
    // Migration from version 1 to 2
    this.migrations.set('1->2', {
      description: 'Add metadata fields and improve data structure',
      migrate: (data) => {
        if (data.roadmaps && Array.isArray(data.roadmaps)) {
          data.roadmaps.forEach(roadmap => {
            if (!roadmap.version) {
              roadmap.version = 2;
            }
            if (!roadmap.createdAt) {
              roadmap.createdAt = DateUtils.formatToNZ(new Date());
            }
            if (!roadmap.metadata) {
              roadmap.metadata = {};
            }
          });
        }
        return data;
      }
    });

    // Add more migrations as needed
  }

  /**
   * Check storage availability
   * @private
   */
  async _checkStorageAvailability() {
    try {
      const testKey = this._getStorageKey('_storage_test_');
      const testData = { test: true, timestamp: Date.now() };
      
      localStorage.setItem(testKey, JSON.stringify(testData));
      const retrieved = localStorage.getItem(testKey);
      
      if (!retrieved || JSON.parse(retrieved).test !== true) {
        throw new Error('Storage write/read test failed');
      }
      
      localStorage.removeItem(testKey);
      
      this.logger.debug('Storage availability check passed');
      
    } catch (error) {
      throw new Error(`Storage not available: ${error.message}`);
    }
  }

  /**
   * Perform data migrations
   * @private
   */
  async _performMigrations() {
    try {
      const versionKey = this._getStorageKey('_data_version_');
      const currentStoredVersion = parseInt(localStorage.getItem(versionKey) || '1');
      
      if (currentStoredVersion < this.currentVersion) {
        this.logger.info('Performing data migrations', {
          from: currentStoredVersion,
          to: this.currentVersion
        });
        
        // Get all data keys
        const keys = (await this.listKeys()).map(item => item.key);
        
        // Migrate each key
        for (const key of keys) {
          await this._migrateKey(key, currentStoredVersion, this.currentVersion);
        }
        
        // Update version
        localStorage.setItem(versionKey, this.currentVersion.toString());
        
        eventBus.emit('persistence:migration:completed', {
          from: currentStoredVersion,
          to: this.currentVersion,
          keysProcessed: keys.length
        });
        
        this.logger.info('Data migrations completed successfully');
      }
      
    } catch (error) {
      this.logger.error('Failed to perform migrations', { error: error.message });
      throw error;
    }
  }

  /**
   * Migrate single key data
   * @private
   */
  async _migrateKey(key, fromVersion, toVersion) {
    try {
      const data = await this.load(key, { raw: true });
      if (data) {
        const migratedData = await this._migrateData(data, fromVersion, toVersion);
        await this.save(key, migratedData, { backup: false });
      }
    } catch (error) {
      this.logger.error(`Failed to migrate key: ${key}`, { error: error.message });
    }
  }

  /**
   * Migrate data through version chain
   * @private
   */
  async _migrateData(data, fromVersion, toVersion) {
    let currentData = data;
    
    for (let version = fromVersion; version < toVersion; version++) {
      const migrationKey = `${version}->${version + 1}`;
      const migration = this.migrations.get(migrationKey);
      
      if (migration) {
        this.logger.debug(`Applying migration: ${migrationKey}`);
        currentData = migration.migrate(currentData);
      }
    }
    
    return currentData;
  }

  /**
   * Setup automatic backup
   * @private
   */
  _setupAutoBackup() {
    const backupInterval = configManager.get('storage.backupInterval', 24 * 60 * 60 * 1000); // 24 hours
    
    setInterval(async () => {
      try {
        await this._createFullBackup('auto');
        await this._cleanupOldBackups();
      } catch (error) {
        this.logger.error('Auto backup failed', { error: error.message });
      }
    }, backupInterval);
    
    this.logger.debug('Auto backup scheduled', { interval: backupInterval });
  }

  /**
   * Create backup for specific key
   * @private
   */
  async _createBackup(key, suffix = '') {
    const data = await this.load(key, { raw: true });
    if (!data) return null;
    
    const backupKey = this._getBackupKey(key, suffix);
    const backupData = {
      type: 'key',
      key,
      data,
      createdAt: new Date().toISOString(),
      version: this.currentVersion
    };
    
    await this._writeToStorage(backupKey, backupData);
    return backupKey;
  }

  /**
   * Create full backup
   * @private
   */
  async _createFullBackup(suffix = '') {
    const exportData = await this.exportData({ compress: true });
    
    const backupKey = this._getBackupKey('_full_', suffix);
    const backupData = {
      type: 'full',
      data: exportData,
      createdAt: new Date().toISOString(),
      version: this.currentVersion
    };
    
    await this._writeToStorage(backupKey, backupData);
    return backupKey;
  }

  /**
   * Cleanup old data
   * @private
   */
  async _cleanupOldData() {
    try {
      await this._cleanupOldBackups();
      // Add more cleanup tasks as needed
    } catch (error) {
      this.logger.error('Failed to cleanup old data', { error: error.message });
    }
  }

  /**
   * Cleanup old backups
   * @private
   */
  async _cleanupOldBackups() {
    try {
      const allKeys = await this._getAllStorageKeys();
      const backupKeys = allKeys
        .filter(key => key.includes('_backup_'))
        .map(key => ({
          key,
          timestamp: this._extractTimestampFromBackupKey(key)
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      
      // Remove old backups beyond maxBackups
      if (backupKeys.length > this.maxBackups) {
        const keysToRemove = backupKeys.slice(this.maxBackups);
        
        for (const backup of keysToRemove) {
          await this._removeFromStorage(backup.key);
        }
        
        this.logger.debug('Cleaned up old backups', {
          removed: keysToRemove.length,
          remaining: this.maxBackups
        });
      }
      
    } catch (error) {
      this.logger.error('Failed to cleanup old backups', { error: error.message });
    }
  }

  /**
   * Generate storage key
   * @private
   */
  _getStorageKey(key) {
    return `${this.storagePrefix}${key}`;
  }

  /**
   * Generate backup key
   * @private
   */
  _getBackupKey(key, suffix = '') {
    const timestamp = Date.now();
    const suffixPart = suffix ? `_${suffix}` : '';
    return `${this.storagePrefix}_backup_${key}_${timestamp}${suffixPart}`;
  }

  /**
   * Generate metadata key
   * @private
   */
  _getMetadataKey(key) {
    return `${this.storagePrefix}_metadata_${key}`;
  }

  /**
   * Prepare data for storage
   * @private
   */
  async _prepareForStorage(data, options) {
    let prepared = JSON.parse(JSON.stringify(data)); // Deep clone
    
    // Add version and timestamp
    if (typeof prepared === 'object' && prepared !== null) {
      prepared._dataVersion = this.currentVersion;
      prepared._savedAt = new Date().toISOString();
    }
    
    // Compress if enabled
    if (this.compressionEnabled && options.compress !== false) {
      prepared = await this._compress(JSON.stringify(prepared));
    }
    
    return prepared;
  }

  /**
   * Process loaded data
   * @private
   */
  async _processLoadedData(rawData, options) {
    let data = rawData;
    
    // Parse if string
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (error) {
        // Might be compressed
        try {
          data = JSON.parse(await this._decompress(data));
        } catch (decompressError) {
          throw new Error('Failed to parse loaded data');
        }
      }
    }
    
    // Check if needs migration
    const dataVersion = data._dataVersion || 1;
    if (dataVersion < this.currentVersion) {
      data = await this._migrateData(data, dataVersion, this.currentVersion);
    }
    
    // Remove internal fields unless raw requested
    if (!options.raw && typeof data === 'object' && data !== null) {
      delete data._dataVersion;
      delete data._savedAt;
    }
    
    return data;
  }

  // Storage abstraction methods (can be replaced with different storage backends)

  async _writeToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async _readFromStorage(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  async _removeFromStorage(key) {
    localStorage.removeItem(key);
  }

  async _existsInStorage(key) {
    return localStorage.getItem(key) !== null;
  }

  async _getAllStorageKeys() {
    return Object.keys(localStorage);
  }

  // Utility methods

  async _updateMetadata(key, metadata) {
    const metadataKey = this._getMetadataKey(key);
    await this._writeToStorage(metadataKey, metadata);
  }

  async _getMetadata(key) {
    const metadataKey = this._getMetadataKey(key);
    return await this._readFromStorage(metadataKey) || {};
  }

  async _removeMetadata(key) {
    const metadataKey = this._getMetadataKey(key);
    await this._removeFromStorage(metadataKey);
  }

  async _calculateChecksum(data) {
    // Simple checksum for data integrity
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  async _compress(data) {
    // Simple compression simulation (in real implementation, use actual compression)
    return btoa(data);
  }

  async _decompress(data) {
    // Simple decompression simulation
    return atob(data);
  }

  _extractTimestampFromBackupKey(backupKey) {
    const parts = backupKey.split('_');
    const timestampIndex = parts.findIndex(part => /^\d{13}$/.test(part));
    return timestampIndex !== -1 ? parseInt(parts[timestampIndex]) : 0;
  }

  _updateStorageConfig() {
    this.compressionEnabled = configManager.get('storage.compression', true);
    this.encryptionEnabled = configManager.get('storage.encryption', false);
    this.backupEnabled = configManager.get('storage.autoBackup', true);
    this.maxBackups = configManager.get('storage.maxBackups', 10);
    
    this.logger.debug('Storage configuration updated', {
      compression: this.compressionEnabled,
      encryption: this.encryptionEnabled,
      autoBackup: this.backupEnabled,
      maxBackups: this.maxBackups
    });
  }

  async _handleLowStorage() {
    this.logger.warn('Low storage detected, performing cleanup');
    
    try {
      await this._cleanupOldBackups();
      
      // Additional cleanup logic could be added here
      eventBus.emit('persistence:cleanup:completed');
      
    } catch (error) {
      this.logger.error('Failed to handle low storage', { error: error.message });
    }
  }

  async _restoreFullBackup(backup, options) {
    try {
      const importData = backup.data;
      const result = await this.importData(importData, options);
      
      this.logger.info('Full backup restored successfully', result);
      eventBus.emit('persistence:restore:completed', { type: 'full', result });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to restore full backup', { error: error.message });
      return false;
    }
  }

  async _restoreKeyBackup(backup, options) {
    try {
      await this.save(backup.key, backup.data, { backup: false });
      
      this.logger.info('Key backup restored successfully', { key: backup.key });
      eventBus.emit('persistence:restore:completed', { type: 'key', key: backup.key });
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to restore key backup', { error: error.message });
      return false;
    }
  }
}

// Create and export singleton instance
export const dataPersistenceManager = new DataPersistenceManager();

// Auto-initialize if not in test environment
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  setTimeout(async () => {
    try {
      await dataPersistenceManager.initialize();
    } catch (error) {
      console.error('Failed to initialize data persistence manager:', error);
    }
  }, 200);
}

export default dataPersistenceManager;