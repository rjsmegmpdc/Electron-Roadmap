/**
 * AuditLog - Tracks all sync operations and changes for compliance
 * 
 * Provides comprehensive audit trail for all Work Integration operations
 * including sync attempts, successes, failures, and data changes.
 */

export default class AuditLog {
  constructor({ storage = 'memory', maxEntries = 10000, retentionDays = 90 } = {}) {
    this.storage = storage;
    this.maxEntries = maxEntries;
    this.retentionDays = retentionDays;
    this.entries = [];
    
    // Initialize storage
    this._initStorage();
  }

  /**
   * Append new audit log entry
   * @param {Object} entry - Audit entry details
   */
  append(entry) {
    const auditEntry = {
      id: this._generateId(),
      ts: entry.ts || new Date().toISOString(),
      actor: entry.actor || 'system',
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details || {},
      source: entry.source || 'work-integration',
      level: entry.level || this._inferLevel(entry.action)
    };

    // Validate required fields
    if (!auditEntry.action || !auditEntry.entityType) {
      throw new Error('Action and entityType are required for audit entries');
    }

    // Add entry to memory store
    this.entries.push(auditEntry);

    // Enforce retention policy
    this._enforceRetention();

    // Persist to storage if configured
    this._persistEntry(auditEntry);

    return auditEntry.id;
  }

  /**
   * List audit entries with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Array} Matching audit entries
   */
  list(filters = {}) {
    let results = [...this.entries];

    // Apply filters
    if (filters.entityId) {
      results = results.filter(entry => entry.entityId === filters.entityId);
    }

    if (filters.entityType) {
      results = results.filter(entry => entry.entityType === filters.entityType);
    }

    if (filters.actions && Array.isArray(filters.actions)) {
      results = results.filter(entry => filters.actions.includes(entry.action));
    }

    if (filters.actor) {
      results = results.filter(entry => entry.actor === filters.actor);
    }

    if (filters.level) {
      results = results.filter(entry => entry.level === filters.level);
    }

    if (filters.since) {
      const sinceDate = new Date(filters.since);
      results = results.filter(entry => new Date(entry.ts) >= sinceDate);
    }

    if (filters.until) {
      const untilDate = new Date(filters.until);
      results = results.filter(entry => new Date(entry.ts) <= untilDate);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.ts) - new Date(a.ts));

    // Apply limit if specified
    if (filters.limit && typeof filters.limit === 'number') {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Get audit entry by ID
   * @param {string} entryId - Audit entry ID
   * @returns {Object|null} Audit entry or null if not found
   */
  get(entryId) {
    return this.entries.find(entry => entry.id === entryId) || null;
  }

  /**
   * Get sync history for specific entity
   * @param {string} entityId - Entity ID
   * @param {string} entityType - Entity type
   * @returns {Array} Sync history entries
   */
  getSyncHistory(entityId, entityType) {
    const syncActions = [
      'push_initiated', 'push_completed', 'push_failed',
      'pull_initiated', 'pull_completed', 'pull_failed',
      'reconcile_completed'
    ];

    return this.list({
      entityId,
      entityType,
      actions: syncActions
    });
  }

  /**
   * Get error summary for time period
   * @param {Date} since - Start date
   * @param {Date} until - End date (optional, defaults to now)
   * @returns {Object} Error summary statistics
   */
  getErrorSummary(since, until = new Date()) {
    const errorEntries = this.list({
      since: since.toISOString(),
      until: until.toISOString(),
      level: 'error'
    });

    const summary = {
      totalErrors: errorEntries.length,
      errorsByAction: {},
      errorsByEntityType: {},
      commonErrors: {},
      period: {
        start: since.toISOString(),
        end: until.toISOString()
      }
    };

    errorEntries.forEach(entry => {
      // Count by action
      summary.errorsByAction[entry.action] = (summary.errorsByAction[entry.action] || 0) + 1;

      // Count by entity type
      summary.errorsByEntityType[entry.entityType] = (summary.errorsByEntityType[entry.entityType] || 0) + 1;

      // Extract common error patterns
      const errorMsg = entry.details.error || 'Unknown error';
      summary.commonErrors[errorMsg] = (summary.commonErrors[errorMsg] || 0) + 1;
    });

    return summary;
  }

  /**
   * Get sync statistics for time period
   * @param {Date} since - Start date
   * @param {Date} until - End date (optional, defaults to now)
   * @returns {Object} Sync statistics
   */
  getSyncStats(since, until = new Date()) {
    const syncEntries = this.list({
      since: since.toISOString(),
      until: until.toISOString()
    });

    const stats = {
      totalOperations: 0,
      pushOperations: { attempted: 0, completed: 0, failed: 0 },
      pullOperations: { attempted: 0, completed: 0, failed: 0 },
      reconciliations: 0,
      successRate: 0,
      period: {
        start: since.toISOString(),
        end: until.toISOString()
      }
    };

    syncEntries.forEach(entry => {
      stats.totalOperations++;

      if (entry.action.includes('push')) {
        if (entry.action === 'push_initiated') stats.pushOperations.attempted++;
        if (entry.action === 'push_completed') stats.pushOperations.completed++;
        if (entry.action === 'push_failed') stats.pushOperations.failed++;
      }

      if (entry.action.includes('pull')) {
        if (entry.action === 'pull_initiated') stats.pullOperations.attempted++;
        if (entry.action === 'pull_completed') stats.pullOperations.completed++;
        if (entry.action === 'pull_failed') stats.pullOperations.failed++;
      }

      if (entry.action === 'reconcile_completed') {
        stats.reconciliations++;
      }
    });

    // Calculate success rate
    const totalCompleted = stats.pushOperations.completed + stats.pullOperations.completed;
    const totalFailed = stats.pushOperations.failed + stats.pullOperations.failed;
    const totalAttempts = totalCompleted + totalFailed;
    
    stats.successRate = totalAttempts > 0 ? Math.round((totalCompleted / totalAttempts) * 100) : 0;

    return stats;
  }

  /**
   * Export audit log to JSON format
   * @param {Object} filters - Export filters (optional)
   * @returns {string} JSON string of audit entries
   */
  exportToJSON(filters = {}) {
    const entries = this.list(filters);
    
    const exportData = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      total_entries: entries.length,
      filters_applied: filters,
      entries: entries
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear all audit entries (use with caution)
   * @param {Object} options - Clear options
   */
  clear(options = {}) {
    if (!options.confirm) {
      throw new Error('Clear operation requires explicit confirmation');
    }

    const beforeCount = this.entries.length;
    
    if (options.olderThan) {
      const cutoffDate = new Date(options.olderThan);
      this.entries = this.entries.filter(entry => new Date(entry.ts) >= cutoffDate);
    } else {
      this.entries = [];
    }

    const afterCount = this.entries.length;
    
    // Log the clear operation
    this.append({
      action: 'audit_cleared',
      entityType: 'system',
      entityId: 'audit-log',
      details: {
        entries_removed: beforeCount - afterCount,
        entries_remaining: afterCount,
        clear_options: options
      }
    });

    return {
      entriesRemoved: beforeCount - afterCount,
      entriesRemaining: afterCount
    };
  }

  /**
   * Generate unique ID for audit entry
   * @private
   */
  _generateId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Infer log level from action
   * @private
   */
  _inferLevel(action) {
    if (action.includes('_failed') || action.includes('error')) {
      return 'error';
    }
    if (action.includes('_initiated') || action.includes('_completed')) {
      return 'info';
    }
    if (action.includes('warning') || action.includes('conflict')) {
      return 'warn';
    }
    return 'info';
  }

  /**
   * Enforce retention policy
   * @private
   */
  _enforceRetention() {
    // Remove entries older than retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const originalCount = this.entries.length;
    this.entries = this.entries.filter(entry => new Date(entry.ts) >= cutoffDate);

    // Enforce max entries limit
    if (this.entries.length > this.maxEntries) {
      // Keep the most recent entries
      this.entries.sort((a, b) => new Date(b.ts) - new Date(a.ts));
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    const removedCount = originalCount - this.entries.length;
    if (removedCount > 0) {
      console.log(`AuditLog: Removed ${removedCount} entries due to retention policy`);
    }
  }

  /**
   * Initialize storage backend
   * @private
   */
  _initStorage() {
    if (this.storage === 'memory') {
      // Already initialized with in-memory array
      return;
    }

    if (this.storage === 'localStorage') {
      this._loadFromLocalStorage();
      return;
    }

    // Add other storage backends as needed
    console.warn(`AuditLog: Unknown storage type '${this.storage}', falling back to memory`);
    this.storage = 'memory';
  }

  /**
   * Persist entry to configured storage
   * @private
   */
  _persistEntry(entry) {
    if (this.storage === 'localStorage') {
      this._saveToLocalStorage();
    }

    // Add other persistence mechanisms as needed
  }

  /**
   * Load entries from localStorage
   * @private
   */
  _loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('rt_audit_log');
      if (stored) {
        const data = JSON.parse(stored);
        this.entries = data.entries || [];
      }
    } catch (error) {
      console.error('AuditLog: Failed to load from localStorage:', error);
      this.entries = [];
    }
  }

  /**
   * Save entries to localStorage
   * @private
   */
  _saveToLocalStorage() {
    try {
      const data = {
        entries: this.entries,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('rt_audit_log', JSON.stringify(data));
    } catch (error) {
      console.error('AuditLog: Failed to save to localStorage:', error);
    }
  }
}

/**
 * Mock audit log for testing
 */
export class MockAuditLog extends AuditLog {
  constructor(options = {}) {
    super({ storage: 'memory', ...options });
    
    // Pre-populate with sample entries for testing
    this._setupMockData();
  }

  _setupMockData() {
    const now = new Date();
    const sampleEntries = [
      {
        action: 'push_completed',
        entityType: 'project',
        entityId: 'rt-project-123',
        actor: 'test.user@company.com',
        details: {
          adoWorkItemId: 1001,
          adoWorkItemType: 'Epic',
          adoUrl: 'https://dev.azure.com/org/project/_workitems/edit/1001'
        }
      },
      {
        action: 'pull_completed',
        entityType: 'task',
        entityId: 'rt-task-456',
        actor: 'test.user@company.com',
        details: {
          adoWorkItemId: 1002,
          updatedFields: ['status', 'priority'],
          conflicts: []
        }
      },
      {
        action: 'push_failed',
        entityType: 'project',
        entityId: 'rt-project-789',
        actor: 'test.user@company.com',
        details: {
          error: 'ADO API error: Invalid work item type'
        }
      }
    ];

    sampleEntries.forEach((entry, index) => {
      const ts = new Date(now.getTime() - (index * 60000)).toISOString(); // Space entries 1 minute apart
      this.append({ ...entry, ts });
    });
  }
}