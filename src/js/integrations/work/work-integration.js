/**
 * WorkIntegration - Main orchestrator for manual ADO sync operations
 * 
 * Coordinates all Work Integration components for manual synchronization
 * between Roadmap Tool and Azure DevOps work items.
 */

import WorkTemplateEngine from './work-template-engine.js';
import WorkValidation from './work-validation.js';
import WorkMappingConfig from './work-mapping-config.js';
import WorkSyncEngine from './work-sync-engine.js';
import AzureDevOpsClient from './azure-devops-client.js';
import AuditLog from './audit-log.js';

export default class WorkIntegration {
  constructor(config = {}) {
    this.config = {
      adoOrganization: config.adoOrganization || process.env.ADO_ORGANIZATION,
      adoProject: config.adoProject || process.env.ADO_PROJECT,
      adoPat: config.adoPat || process.env.ADO_PAT,
      templatesPath: config.templatesPath || './tests/fixtures/work/zip-mirror',
      auditStorage: config.auditStorage || 'localStorage',
      ...config
    };

    // Validate required configuration
    this._validateConfig();

    // Initialize components
    this.templateEngine = null;
    this.validation = null;
    this.mappingConfig = null;
    this.adoClient = null;
    this.syncEngine = null;
    this.audit = null;

    // Initialize asynchronously if needed
    this._initialized = false;
  }

  /**
   * Initialize all components (async setup)
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) {
      return;
    }

    try {
      // Initialize audit log first
      this.audit = new AuditLog({
        storage: this.config.auditStorage,
        maxEntries: this.config.maxAuditEntries || 10000,
        retentionDays: this.config.auditRetentionDays || 90
      });

      // Initialize template engine
      this.templateEngine = new WorkTemplateEngine({
        templatesPath: this.config.templatesPath
      });
      await this.templateEngine.initialize();

      // Initialize validation
      this.validation = new WorkValidation({
        templatesPath: this.config.templatesPath
      });
      await this.validation.initialize();

      // Initialize mapping configuration
      this.mappingConfig = new WorkMappingConfig({
        configPath: this.config.templatesPath
      });
      await this.mappingConfig.initialize();

      // Initialize ADO client
      this.adoClient = new AzureDevOpsClient({
        organization: this.config.adoOrganization,
        project: this.config.adoProject,
        pat: this.config.adoPat
      });

      // Test ADO connection
      const connected = await this.adoClient.testConnection();
      if (!connected) {
        throw new Error('Failed to connect to Azure DevOps - check credentials and network');
      }

      // Initialize sync engine
      this.syncEngine = new WorkSyncEngine({
        adoClient: this.adoClient,
        mappingConfig: this.mappingConfig,
        validation: this.validation,
        audit: this.audit
      });

      this._initialized = true;

      // Log successful initialization
      this.audit.append({
        action: 'integration_initialized',
        entityType: 'system',
        entityId: 'work-integration',
        details: {
          adoOrganization: this.config.adoOrganization,
          adoProject: this.config.adoProject,
          templatesPath: this.config.templatesPath
        }
      });

    } catch (error) {
      throw new Error(`Work Integration initialization failed: ${error.message}`);
    }
  }

  /**
   * Push RT project or task to ADO (manual operation)
   * @param {Object} rtEntity - RT project or task object
   * @param {Object} options - Push options
   * @returns {Promise<Object>} Push result
   */
  async pushToADO(rtEntity, options = {}) {
    await this._ensureInitialized();

    try {
      // Validate entity
      if (!rtEntity || !rtEntity.id) {
        throw new Error('Invalid RT entity - missing ID');
      }

      // Check if already synced (unless force override)
      if (!options.force) {
        const syncStatus = this.syncEngine.getSyncStatus(rtEntity);
        if (syncStatus.synced) {
          throw new Error(`Entity ${rtEntity.id} is already synced to ADO work item ${syncStatus.adoWorkItemId}. Use force: true to override.`);
        }
      }

      // Render templates if applicable
      let processedEntity = rtEntity;
      if (options.renderTemplates !== false) {
        const entityType = rtEntity.project_id ? 'task' : 'project';
        const templateType = entityType === 'project' ? 'epic' : 'user_story';
        
        try {
          const rendered = await this.templateEngine.renderWorkItem(rtEntity, templateType);
          processedEntity = { ...rtEntity, ...rendered };
        } catch (templateError) {
          console.warn('Template rendering failed, proceeding with original entity:', templateError.message);
        }
      }

      // Perform push operation
      const result = await this.syncEngine.pushFromRTToADO(processedEntity, {
        userId: options.userId,
        workItemType: options.workItemType
      });

      return {
        success: true,
        operation: 'push',
        entityId: rtEntity.id,
        entityType: rtEntity.project_id ? 'task' : 'project',
        adoWorkItemId: result.workItemId,
        adoWorkItemType: result.workItemType,
        adoUrl: result.url,
        syncedAt: result.syncedAt
      };

    } catch (error) {
      throw new Error(`Push to ADO failed: ${error.message}`);
    }
  }

  /**
   * Pull from ADO work item to RT (manual operation)
   * @param {number} workItemId - ADO work item ID
   * @param {Object} options - Pull options
   * @returns {Promise<Object>} Pull result
   */
  async pullFromADO(workItemId, options = {}) {
    await this._ensureInitialized();

    try {
      if (!workItemId || typeof workItemId !== 'number') {
        throw new Error('Valid ADO work item ID is required');
      }

      // Perform pull operation
      const result = await this.syncEngine.pullFromADOWorkItem(workItemId, {
        userId: options.userId,
        resolveConflicts: options.resolveConflicts || 'manual'
      });

      return {
        success: true,
        operation: 'pull',
        adoWorkItemId: workItemId,
        entityId: result.entityId,
        entityType: result.entityType,
        updatedFields: result.updatedFields,
        conflicts: result.conflicts,
        syncedAt: result.syncedAt
      };

    } catch (error) {
      throw new Error(`Pull from ADO failed: ${error.message}`);
    }
  }

  /**
   * Reconcile RT entity with ADO work item
   * @param {Object} rtEntity - RT project or task
   * @param {number} workItemId - ADO work item ID
   * @param {Object} options - Reconciliation options
   * @returns {Promise<Object>} Reconciliation result with recommendations
   */
  async reconcile(rtEntity, workItemId, options = {}) {
    await this._ensureInitialized();

    try {
      // Get ADO work item
      const adoWorkItem = await this.adoClient.getWorkItem(workItemId);

      // Perform reconciliation
      const result = this.syncEngine.reconcile(rtEntity, adoWorkItem, {
        lockedFields: options.lockedFields || ['rt_ids', 'security_block']
      });

      // Log reconciliation
      this.audit.append({
        action: 'reconcile_completed',
        entityType: rtEntity.project_id ? 'task' : 'project',
        entityId: rtEntity.id,
        actor: options.userId || 'system',
        details: {
          adoWorkItemId: workItemId,
          recommendedAction: result.action,
          conflictCount: result.conflictCount,
          conflicts: result.conflicts
        }
      });

      return {
        success: true,
        operation: 'reconcile',
        entityId: rtEntity.id,
        adoWorkItemId: workItemId,
        recommendedAction: result.action,
        reasons: result.reasons,
        conflicts: result.conflicts,
        recommendations: result.recommendations,
        rtLastModified: result.rtLastModified,
        adoLastModified: result.adoLastModified
      };

    } catch (error) {
      throw new Error(`Reconciliation failed: ${error.message}`);
    }
  }

  /**
   * Find ADO work items linked to RT entity
   * @param {Object} rtEntity - RT project or task
   * @returns {Promise<Array>} Array of linked work items
   */
  async findLinkedWorkItems(rtEntity) {
    await this._ensureInitialized();

    try {
      const rtProjectId = rtEntity.project_id || rtEntity.id;
      const rtTaskId = rtEntity.project_id ? rtEntity.id : null;

      const workItems = await this.adoClient.findWorkItemsByRTId(rtProjectId, rtTaskId);
      
      return workItems.map(item => ({
        id: item.id,
        title: item.title,
        workItemType: item.workItemType,
        state: item.state,
        url: item.url,
        lastModified: item.lastModified
      }));

    } catch (error) {
      throw new Error(`Failed to find linked work items: ${error.message}`);
    }
  }

  /**
   * Get sync status for RT entity
   * @param {Object} rtEntity - RT project or task
   * @returns {Object} Sync status information
   */
  getSyncStatus(rtEntity) {
    if (!this._initialized || !this.syncEngine) {
      return {
        synced: false,
        status: 'not_initialized',
        lastSync: null,
        adoWorkItemId: null
      };
    }

    return this.syncEngine.getSyncStatus(rtEntity);
  }

  /**
   * Get sync statistics for time period
   * @param {Object} options - Query options
   * @returns {Object} Sync statistics
   */
  getSyncStatistics(options = {}) {
    if (!this._initialized || !this.audit) {
      return null;
    }

    const since = options.since ? new Date(options.since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago
    const until = options.until ? new Date(options.until) : new Date();

    return this.audit.getSyncStats(since, until);
  }

  /**
   * Get recent sync operations
   * @param {Object} options - Query options
   * @returns {Array} Recent sync operations
   */
  getRecentOperations(options = {}) {
    if (!this._initialized || !this.audit) {
      return [];
    }

    return this.audit.list({
      actions: ['push_completed', 'pull_completed', 'push_failed', 'pull_failed'],
      limit: options.limit || 50,
      since: options.since,
      until: options.until
    });
  }

  /**
   * Export audit log
   * @param {Object} options - Export options
   * @returns {string} JSON export of audit log
   */
  exportAuditLog(options = {}) {
    if (!this._initialized || !this.audit) {
      throw new Error('Work Integration not initialized');
    }

    return this.audit.exportToJSON(options);
  }

  /**
   * Test ADO connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    await this._ensureInitialized();
    return await this.adoClient.testConnection();
  }

  /**
   * Get ADO work item types available
   * @returns {Promise<Array>} Available work item types
   */
  async getAvailableWorkItemTypes() {
    await this._ensureInitialized();
    return await this.adoClient.getWorkItemTypes();
  }

  /**
   * Validate configuration
   * @private
   */
  _validateConfig() {
    const required = ['adoOrganization', 'adoProject'];
    
    for (const field of required) {
      if (!this.config[field]) {
        throw new Error(`Required configuration missing: ${field}`);
      }
    }

    if (!this.config.adoPat) {
      console.warn('ADO Personal Access Token not provided - will attempt to use ADO_PAT environment variable');
    }
  }

  /**
   * Ensure components are initialized
   * @private
   */
  async _ensureInitialized() {
    if (!this._initialized) {
      await this.initialize();
    }
  }
}

/**
 * Factory function for creating Work Integration instances
 * @param {Object} config - Configuration options
 * @returns {Promise<WorkIntegration>} Initialized Work Integration instance
 */
export async function createWorkIntegration(config = {}) {
  const integration = new WorkIntegration(config);
  await integration.initialize();
  return integration;
}

/**
 * Mock Work Integration for testing
 */
export class MockWorkIntegration extends WorkIntegration {
  constructor(config = {}) {
    super({
      adoOrganization: 'mock-org',
      adoProject: 'mock-project',
      adoPat: 'mock-pat',
      auditStorage: 'memory',
      ...config
    });
  }

  async initialize() {
    if (this._initialized) {
      return;
    }

    // Use mock implementations
    const { MockAuditLog } = await import('./audit-log.js');
    const { MockAzureDevOpsClient } = await import('./azure-devops-client.js');

    this.audit = new MockAuditLog();
    this.adoClient = new MockAzureDevOpsClient();

    // Initialize other components normally but with mock ADO client
    this.templateEngine = new WorkTemplateEngine({
      templatesPath: this.config.templatesPath
    });
    await this.templateEngine.initialize();

    this.validation = new WorkValidation({
      templatesPath: this.config.templatesPath
    });
    await this.validation.initialize();

    this.mappingConfig = new WorkMappingConfig({
      configPath: this.config.templatesPath
    });
    await this.mappingConfig.initialize();

    this.syncEngine = new WorkSyncEngine({
      adoClient: this.adoClient,
      mappingConfig: this.mappingConfig,
      validation: this.validation,
      audit: this.audit
    });

    this._initialized = true;

    this.audit.append({
      action: 'integration_initialized',
      entityType: 'system',
      entityId: 'mock-work-integration',
      details: { mock: true }
    });
  }
}