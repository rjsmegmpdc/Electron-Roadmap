/**
 * DataPersistenceManager - Save/load/backup/restore projects array
 * 
 * Purpose: Manages all data persistence using localStorage
 * Provides backup and restore functionality with timestamped backups
 * Supports data versioning and automatic migrations for backward compatibility
 */

import { configManager } from './config-manager.js';
import { logger } from './logger.js';
import { errorHandler, ErrorCategory, ErrorSeverity } from './error-handler.js';
import { eventBus, AppEvents } from './event-bus.js';

export default class DataPersistenceManager {
  /**
   * Constructor
   * @param {string} storageKey - Key for main projects data in localStorage
   * @param {string} backupPrefix - Prefix for backup keys
   */
  constructor(storageKey = 'projectsData', backupPrefix = 'projectsDataBackup_') {
    this.storageKey = configManager.get('storage.main.key', storageKey);
    this.backupPrefix = configManager.get('storage.backup.prefix', backupPrefix);
    this.schemaVersionKey = `${this.storageKey}_schema_version`;
    this.currentSchemaVersion = 3; // Current schema version
    
    // Migration functions for each version
    this.migrations = new Map([
      [1, this._migrateToV1.bind(this)],
      [2, this._migrateToV2.bind(this)],
      [3, this._migrateToV3.bind(this)]
    ]);
    
    // Initialize migrations if needed
    this._initializeMigrations();
  }

  /**
   * Save projects array to localStorage with versioning
   * @param {Array} projects - Array of project objects to save
   */
  saveProjects(projects) {
    try {
      const dataToSave = {
        version: this.currentSchemaVersion,
        timestamp: new Date().toISOString(),
        data: projects
      };
      
      const jsonData = JSON.stringify(dataToSave);
      localStorage.setItem(this.storageKey, jsonData);
      
      // Update schema version
      localStorage.setItem(this.schemaVersionKey, this.currentSchemaVersion.toString());
      
      // Emit data saved event
      eventBus.emit(AppEvents.DATA_SAVED, {
        storageKey: this.storageKey,
        version: this.currentSchemaVersion,
        recordCount: projects.length
      });
      
      logger.debug('Projects saved successfully', {
        count: projects.length,
        version: this.currentSchemaVersion,
        storageKey: this.storageKey
      });
    } catch (error) {
      const handledError = errorHandler.handleStorage(error, {
        operation: 'save projects',
        key: this.storageKey,
        action: 'save'
      });
      throw error;
    }
  }

  /**
   * Load projects array from localStorage with automatic migration
   * Returns empty array if no data exists or data is corrupt
   * @returns {Array} Array of project objects
   */
  loadProjects() {
    try {
      const jsonData = localStorage.getItem(this.storageKey);
      
      // Return empty array if no data exists
      if (jsonData === null || jsonData === '') {
        logger.debug('No projects data found, returning empty array');
        return [];
      }

      // Parse JSON data
      const parsedData = JSON.parse(jsonData);
      
      // Handle versioned data format
      if (this._isVersionedData(parsedData)) {
        const migratedData = this._migrateData(parsedData);
        
        // Emit data loaded event
        eventBus.emit(AppEvents.DATA_LOADED, {
          storageKey: this.storageKey,
          version: migratedData.version,
          recordCount: migratedData.data.length,
          migrated: migratedData.version !== parsedData.version
        });
        
        return migratedData.data;
      } else {
        // Legacy data format - migrate to current version
        logger.info('Found legacy data format, migrating to current version');
        const migratedData = this._migrateLegacyData(parsedData);
        
        // Save migrated data
        this.saveProjects(migratedData);
        
        return migratedData;
      }
    } catch (error) {
      // PRD requirement: Corrupt JSON → log warning; return []
      errorHandler.handleStorage(error, {
        operation: 'load projects',
        key: this.storageKey,
        action: 'load'
      });
      return [];
    }
  }

  /**
   * Create a timestamped backup of current projects data
   * @returns {string} The backup key that was created
   */
  backupProjects() {
    // Get current projects (or empty array if none exist)
    const currentProjects = this.loadProjects();
    
    // Create timestamped backup key
    const timestamp = Date.now();
    const backupKey = `${this.backupPrefix}${timestamp}`;
    
    // Store backup
    const jsonData = JSON.stringify(currentProjects);
    localStorage.setItem(backupKey, jsonData);
    
    return backupKey;
  }

  /**
   * Restore projects from a backup key
   * @param {string} backupKey - The backup key to restore from
   * @throws {Error} If backup key is not found or data is corrupt
   */
  restoreProjects(backupKey) {
    const backupData = localStorage.getItem(backupKey);
    
    // PRD requirement: throw error if backup not found
    if (backupData === null) {
      throw new Error(`Backup not found: ${backupKey}`);
    }

    try {
      // Verify backup data is valid JSON
      const projects = JSON.parse(backupData);
      
      // Restore to main storage
      this.saveProjects(projects);
    } catch {
      // If backup is corrupt, treat as not found
      throw new Error(`Backup not found: ${backupKey}`);
    }
  }

  /**
   * List all available backup keys
   * @returns {Array<string>} Sorted array of backup keys
   */
  listBackups() {
    const backupKeys = [];
    
    // Iterate through localStorage to find backup keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.backupPrefix)) {
        backupKeys.push(key);
      }
    }
    
    // Return sorted array (chronological order by timestamp)
    return backupKeys.sort();
  }

  /**
   * Get current schema version from storage
   * @returns {number} Current schema version
   */
  getSchemaVersion() {
    try {
      const version = localStorage.getItem(this.schemaVersionKey);
      return version ? parseInt(version, 10) : 0; // 0 means legacy/unversioned
    } catch {
      return 0;
    }
  }

  /**
   * Initialize migrations if needed
   * @private
   */
  _initializeMigrations() {
    const currentStoredVersion = this.getSchemaVersion();
    
    if (currentStoredVersion < this.currentSchemaVersion) {
      logger.info('Schema migration needed', {
        currentVersion: currentStoredVersion,
        targetVersion: this.currentSchemaVersion
      });
    }
  }

  /**
   * Check if data is in the new versioned format
   * @private
   * @param {*} data - Data to check
   * @returns {boolean} True if versioned format
   */
  _isVersionedData(data) {
    return data && typeof data === 'object' && 'version' in data && 'data' in data;
  }

  /**
   * Migrate data from one version to another
   * @private
   * @param {Object} versionedData - Data with version information
   * @returns {Object} Migrated data
   */
  _migrateData(versionedData) {
    let currentData = { ...versionedData };
    const startVersion = currentData.version;
    
    // Apply migrations sequentially from current version to target
    for (let version = startVersion + 1; version <= this.currentSchemaVersion; version++) {
      if (this.migrations.has(version)) {
        logger.info(`Migrating data from v${currentData.version} to v${version}`);
        
        try {
          currentData = this.migrations.get(version)(currentData);
          currentData.version = version;
          currentData.migratedAt = new Date().toISOString();
        } catch (error) {
          logger.error('Migration failed', {
            fromVersion: currentData.version,
            toVersion: version,
            error: error.message
          });
          throw error;
        }
      }
    }
    
    if (currentData.version !== startVersion) {
      logger.info('Data migration completed', {
        fromVersion: startVersion,
        toVersion: currentData.version
      });
      
      // Save migrated data
      this.saveProjects(currentData.data);
    }
    
    return currentData;
  }

  /**
   * Migrate legacy data (unversioned) to current version
   * @private
   * @param {Array} legacyData - Legacy data array
   * @returns {Array} Migrated data
   */
  _migrateLegacyData(legacyData) {
    // Create versioned wrapper
    let versionedData = {
      version: 0,
      timestamp: new Date().toISOString(),
      data: Array.isArray(legacyData) ? legacyData : []
    };
    
    // Apply all migrations
    const migratedData = this._migrateData(versionedData);
    return migratedData.data;
  }

  /**
   * Migration to version 1: Add project metadata
   * @private
   * @param {Object} data - Data to migrate
   * @returns {Object} Migrated data
   */
  _migrateToV1(data) {
    const migrated = { ...data };
    
    migrated.data = migrated.data.map(project => ({
      ...project,
      created_at: project.created_at || new Date().toISOString(),
      updated_at: project.updated_at || new Date().toISOString(),
      version: project.version || 1
    }));
    
    logger.debug('Applied v1 migration: added project metadata');
    return migrated;
  }

  /**
   * Migration to version 2: Add strategic layer support
   * @private
   * @param {Object} data - Data to migrate
   * @returns {Object} Migrated data
   */
  _migrateToV2(data) {
    const migrated = { ...data };
    
    // Add strategic layer arrays if they don't exist
    if (!migrated.visions) migrated.visions = [];
    if (!migrated.goals) migrated.goals = [];
    if (!migrated.initiatives) migrated.initiatives = [];
    
    // Add initiative_id to projects if not present
    migrated.data = migrated.data.map(project => ({
      ...project,
      initiative_id: project.initiative_id || null
    }));
    
    logger.debug('Applied v2 migration: added strategic layer support');
    return migrated;
  }

  /**
   * Migration to version 3: Add enhanced resource management
   * @private
   * @param {Object} data - Data to migrate
   * @returns {Object} Migrated data
   */
  _migrateToV3(data) {
    const migrated = { ...data };
    
    // Add global resources array if it doesn't exist
    if (!migrated.resources) migrated.resources = [];
    
    // Update project resources to reference global resources
    migrated.data = migrated.data.map(project => {
      if (project.resources && Array.isArray(project.resources)) {
        // Convert inline resources to resource references
        project.resources = project.resources.map(resource => {
          if (typeof resource === 'object' && resource.id) {
            // Add to global resources if not already there
            const existingResource = migrated.resources.find(r => r.id === resource.id);
            if (!existingResource) {
              migrated.resources.push({
                ...resource,
                active: resource.active !== false // Default to active
              });
            }
            return resource.id; // Return just the ID
          }
          return resource;
        });
      }
      
      return project;
    });
    
    logger.debug('Applied v3 migration: enhanced resource management');
    return migrated;
  }

  /**
   * Create a pre-migration backup
   * @private
   * @param {number} fromVersion - Version being migrated from
   * @param {number} toVersion - Version being migrated to
   * @returns {string} Backup key
   */
  _createMigrationBackup(fromVersion, toVersion) {
    const timestamp = Date.now();
    const backupKey = `${this.backupPrefix}migration_v${fromVersion}_to_v${toVersion}_${timestamp}`;
    
    try {
      const currentData = localStorage.getItem(this.storageKey);
      if (currentData) {
        localStorage.setItem(backupKey, currentData);
        logger.info('Created migration backup', { backupKey });
      }
    } catch (error) {
      logger.warn('Failed to create migration backup', { error: error.message });
    }
    
    return backupKey;
  }

  /**
   * Validate migrated data structure
   * @private
   * @param {Object} data - Data to validate
   * @returns {boolean} True if valid
   */
  _validateMigratedData(data) {
    try {
      // Basic structure validation
      if (!data || typeof data !== 'object') return false;
      if (!data.data || !Array.isArray(data.data)) return false;
      if (typeof data.version !== 'number') return false;
      
      // Validate each project has required fields
      return data.data.every(project => (
        project && 
        typeof project === 'object' && 
        typeof project.id === 'string' &&
        typeof project.title === 'string'
      ));
    } catch {
      return false;
    }
  }
}
