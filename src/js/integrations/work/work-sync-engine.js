/**
 * WorkSyncEngine - Manual sync operations for Azure DevOps integration
 * 
 * Handles manual push/pull operations between Roadmap Tool and ADO work items.
 * No automatic syncing - all operations are user-initiated.
 */

export default class WorkSyncEngine {
  constructor({ adoClient, mappingConfig, validation, audit }) {
    if (!adoClient) {
      throw new Error('ADO client is required');
    }
    if (!mappingConfig) {
      throw new Error('Mapping configuration is required');
    }
    if (!validation) {
      throw new Error('Validation is required');
    }
    if (!audit) {
      throw new Error('Audit log is required');
    }

    this.adoClient = adoClient;
    this.mappingConfig = mappingConfig;
    this.validation = validation;
    this.audit = audit;
  }

  /**
   * Manually push RT entity to ADO (user-initiated)
   * @param {Object} rtEntity - RT project or task object
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} Sync result with work item ID
   */
  async pushFromRTToADO(rtEntity, options = {}) {
    try {
      this.audit.append({
        ts: new Date().toISOString(),
        actor: options.userId || 'system',
        action: 'push_initiated',
        entityType: rtEntity.project_id ? 'task' : 'project',
        entityId: rtEntity.id,
        details: { target: 'ADO', manual: true }
      });

      // Determine work item type
      const workItemType = this._determineADOWorkItemType(rtEntity, options);
      
      // Map RT entity to ADO format
      const adoPayload = this._mapRTEntityToADO(rtEntity, workItemType, options);
      
      // Validate the payload
      const validation = this.validation.validateWorkItem(adoPayload, workItemType);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Create work item in ADO
      const workItem = await this.adoClient.createWorkItem(workItemType, adoPayload);
      
      // Log successful push
      this.audit.append({
        ts: new Date().toISOString(),
        actor: options.userId || 'system',
        action: 'push_completed',
        entityType: rtEntity.project_id ? 'task' : 'project',
        entityId: rtEntity.id,
        details: { 
          adoWorkItemId: workItem.id,
          adoWorkItemType: workItemType,
          adoUrl: workItem.url
        }
      });

      return {
        success: true,
        workItemId: workItem.id,
        workItemType: workItemType,
        url: workItem.url,
        syncDirection: 'RT -> ADO',
        syncedAt: new Date().toISOString()
      };

    } catch (error) {
      this.audit.append({
        ts: new Date().toISOString(),
        actor: options.userId || 'system',
        action: 'push_failed',
        entityType: rtEntity.project_id ? 'task' : 'project',
        entityId: rtEntity.id,
        details: { error: error.message }
      });

      throw new Error(`Failed to push to ADO: ${error.message}`);
    }
  }

  /**
   * Manually pull from ADO work item (user-initiated)
   * @param {number} workItemId - ADO work item ID
   * @param {Object} options - Pull options
   * @returns {Promise<Object>} Pull result with update status
   */
  async pullFromADOWorkItem(workItemId, options = {}) {
    try {
      this.audit.append({
        ts: new Date().toISOString(),
        actor: options.userId || 'system',
        action: 'pull_initiated',
        entityType: 'work_item',
        entityId: workItemId.toString(),
        details: { source: 'ADO', manual: true }
      });

      // Get work item from ADO
      const workItem = await this.adoClient.getWorkItem(workItemId);
      
      // Extract RT IDs from work item
      const rtIds = this._extractRTIdsFromADO(workItem);
      if (!rtIds.rt_project_id) {
        throw new Error('Work item does not contain RT project ID - cannot sync back');
      }

      // Map ADO data back to RT format
      const rtUpdates = this._mapADOToRTUpdates(workItem, rtIds);
      
      // Apply updates to RT entities
      const updateResults = await this._applyRTUpdates(rtIds, rtUpdates, options);

      // Log successful pull
      this.audit.append({
        ts: new Date().toISOString(),
        actor: options.userId || 'system',
        action: 'pull_completed',
        entityType: updateResults.entityType,
        entityId: updateResults.entityId,
        details: { 
          adoWorkItemId: workItemId,
          updatedFields: Object.keys(rtUpdates),
          conflicts: updateResults.conflicts || []
        }
      });

      return {
        success: true,
        updated: updateResults.updated,
        entityType: updateResults.entityType,
        entityId: updateResults.entityId,
        updatedFields: Object.keys(rtUpdates),
        conflicts: updateResults.conflicts || [],
        syncDirection: 'ADO -> RT',
        syncedAt: new Date().toISOString()
      };

    } catch (error) {
      this.audit.append({
        ts: new Date().toISOString(),
        actor: options.userId || 'system',
        action: 'pull_failed',
        entityType: 'work_item',
        entityId: workItemId.toString(),
        details: { error: error.message }
      });

      throw new Error(`Failed to pull from ADO: ${error.message}`);
    }
  }

  /**
   * Manual reconciliation - compare RT entity with ADO work item
   * @param {Object} rtEntity - RT project or task
   * @param {Object} adoWorkItem - ADO work item
   * @param {Object} options - Reconciliation options
   * @returns {Object} Reconciliation result with recommended action
   */
  reconcile(rtEntity, adoWorkItem, options = {}) {
    const conflicts = [];
    const recommendations = [];
    
    try {
      // Compare last modified timestamps
      const rtLastModified = new Date(rtEntity.updated_at || rtEntity.created_at || Date.now());
      const adoLastModified = new Date(adoWorkItem.fields['System.ChangedDate'] || adoWorkItem.fields['System.CreatedDate']);
      
      // Check for conflicts in key fields
      const fieldConflicts = this._detectFieldConflicts(rtEntity, adoWorkItem);
      conflicts.push(...fieldConflicts);

      // Check for locked field violations
      const lockedFieldViolations = this._checkLockedFields(rtEntity, adoWorkItem, options);
      if (lockedFieldViolations.length > 0) {
        conflicts.push(...lockedFieldViolations);
        recommendations.push({
          action: 'push',
          reason: 'Locked fields modified in ADO - RT should overwrite',
          priority: 'high'
        });
      }

      // Determine recommended action based on timestamps and conflicts
      let recommendedAction = 'skip';
      const reasons = [];

      if (conflicts.length === 0) {
        recommendedAction = 'skip';
        reasons.push('No conflicts detected');
      } else if (rtLastModified > adoLastModified) {
        recommendedAction = 'push';
        reasons.push('RT entity is newer');
      } else if (adoLastModified > rtLastModified) {
        recommendedAction = 'pull';
        reasons.push('ADO work item is newer');
      } else {
        // Same timestamp - check governance rules
        if (this._hasGovernanceViolations(adoWorkItem)) {
          recommendedAction = 'push';
          reasons.push('ADO work item violates governance rules');
        } else {
          recommendedAction = 'pull';
          reasons.push('Accept ADO changes');
        }
      }

      return {
        action: recommendedAction,
        reasons,
        conflicts,
        recommendations,
        rtLastModified: rtLastModified.toISOString(),
        adoLastModified: adoLastModified.toISOString(),
        conflictCount: conflicts.length
      };

    } catch (error) {
      return {
        action: 'error',
        reasons: [`Reconciliation failed: ${error.message}`],
        conflicts: [],
        recommendations: [],
        conflictCount: 0
      };
    }
  }

  /**
   * Get sync status for RT entity
   * @param {Object} rtEntity - RT project or task
   * @returns {Object} Sync status information
   */
  getSyncStatus(rtEntity) {
    // Check if entity has been synced before
    const syncHistory = this.audit.list({
      entityId: rtEntity.id,
      actions: ['push_completed', 'pull_completed']
    });

    if (syncHistory.length === 0) {
      return {
        synced: false,
        status: 'never_synced',
        lastSync: null,
        adoWorkItemId: null
      };
    }

    const lastSync = syncHistory[syncHistory.length - 1];
    
    return {
      synced: true,
      status: 'synced',
      lastSync: lastSync.ts,
      lastSyncDirection: lastSync.action.includes('push') ? 'RT -> ADO' : 'ADO -> RT',
      adoWorkItemId: lastSync.details.adoWorkItemId || null,
      adoUrl: lastSync.details.adoUrl || null
    };
  }

  /**
   * Determine ADO work item type based on RT entity
   * @private
   */
  _determineADOWorkItemType(rtEntity, options) {
    if (options.workItemType) {
      return options.workItemType;
    }

    // Project -> Epic, Task -> User Story (default mapping)
    if (rtEntity.project_id) {
      return 'User Story';
    } else {
      return 'Epic';
    }
  }

  /**
   * Map RT entity to ADO work item format
   * @private
   */
  _mapRTEntityToADO(rtEntity, workItemType, options) {
    const fields = {};

    // Basic fields
    fields['System.Title'] = `[${workItemType}] ${rtEntity.title}`;
    fields['System.Description'] = rtEntity.description || '';
    
    // State mapping
    if (rtEntity.status) {
      fields['System.State'] = this.mappingConfig.mapStatusRTtoADO(rtEntity.status);
    }

    // Priority mapping
    if (rtEntity.priority) {
      fields['Microsoft.VSTS.Common.Priority'] = this._mapPriorityToADO(rtEntity.priority);
    }

    // Effort mapping for User Stories
    if (workItemType === 'User Story' && rtEntity.effort_hours) {
      fields['Microsoft.VSTS.Scheduling.Effort'] = rtEntity.effort_hours;
    }

    // Date fields in NZ format
    if (rtEntity.start_date) {
      fields['Microsoft.VSTS.Scheduling.StartDate'] = rtEntity.start_date;
    }
    if (rtEntity.end_date) {
      fields['Microsoft.VSTS.Scheduling.TargetDate'] = rtEntity.end_date;
    }

    // RT metadata (custom fields)
    fields['Custom.RTProjectId'] = rtEntity.project_id || rtEntity.id;
    if (rtEntity.project_id) {
      fields['Custom.RTTaskId'] = rtEntity.id;
    }

    // Tags for tracking
    const tags = ['roadmap-tool'];
    if (rtEntity.financial_treatment) {
      tags.push(`financial-${rtEntity.financial_treatment.toLowerCase()}`);
    }
    fields['System.Tags'] = tags.join('; ');

    return fields;
  }

  /**
   * Extract RT IDs from ADO work item
   * @private
   */
  _extractRTIdsFromADO(workItem) {
    const rtIds = {};

    if (workItem.fields['Custom.RTProjectId']) {
      rtIds.rt_project_id = workItem.fields['Custom.RTProjectId'];
    }
    if (workItem.fields['Custom.RTTaskId']) {
      rtIds.rt_task_id = workItem.fields['Custom.RTTaskId'];
    }

    return rtIds;
  }

  /**
   * Map ADO work item back to RT updates
   * @private
   */
  _mapADOToRTUpdates(workItem, rtIds) {
    const updates = {};

    // State mapping
    if (workItem.fields['System.State']) {
      updates.status = this.mappingConfig.mapStatusADOtoRT(workItem.fields['System.State']);
    }

    // Priority mapping
    if (workItem.fields['Microsoft.VSTS.Common.Priority']) {
      updates.priority = this._mapPriorityFromADO(workItem.fields['Microsoft.VSTS.Common.Priority']);
    }

    // Effort mapping
    if (workItem.fields['Microsoft.VSTS.Scheduling.Effort']) {
      updates.effort_hours = workItem.fields['Microsoft.VSTS.Scheduling.Effort'];
    }

    return updates;
  }

  /**
   * Apply updates to RT entities
   * @private
   */
  async _applyRTUpdates(rtIds, rtUpdates, options) {
    // This would integrate with the existing RT managers
    // For now, return a mock implementation
    return {
      updated: true,
      entityType: rtIds.rt_task_id ? 'task' : 'project',
      entityId: rtIds.rt_task_id || rtIds.rt_project_id,
      conflicts: []
    };
  }

  /**
   * Detect field conflicts between RT and ADO
   * @private
   */
  _detectFieldConflicts(rtEntity, adoWorkItem) {
    const conflicts = [];

    // Compare status
    const rtStatus = rtEntity.status;
    const adoStatus = this.mappingConfig.mapStatusADOtoRT(adoWorkItem.fields['System.State']);
    
    if (rtStatus && adoStatus && rtStatus !== adoStatus) {
      conflicts.push({
        field: 'status',
        rtValue: rtStatus,
        adoValue: adoStatus,
        type: 'field_mismatch'
      });
    }

    return conflicts;
  }

  /**
   * Check for locked field violations
   * @private
   */
  _checkLockedFields(rtEntity, adoWorkItem, options) {
    const violations = [];
    const lockedFields = options.lockedFields || ['rt_ids', 'security_block'];

    // Check RT ID fields (should not be modified in ADO)
    if (lockedFields.includes('rt_ids')) {
      const expectedProjectId = rtEntity.project_id || rtEntity.id;
      const actualProjectId = adoWorkItem.fields['Custom.RTProjectId'];
      
      if (expectedProjectId !== actualProjectId) {
        violations.push({
          field: 'rt_project_id',
          expected: expectedProjectId,
          actual: actualProjectId,
          type: 'locked_field_violation'
        });
      }
    }

    return violations;
  }

  /**
   * Check for governance violations in ADO work item
   * @private
   */
  _hasGovernanceViolations(adoWorkItem) {
    // Check if title follows proper format
    const title = adoWorkItem.fields['System.Title'];
    if (!title || !title.match(/^\[(Epic|User Story|Task|Feature)\]/)) {
      return true;
    }

    return false;
  }

  /**
   * Map RT priority to ADO priority
   * @private
   */
  _mapPriorityToADO(rtPriority) {
    const priorityMap = {
      'P1': 1,
      'P2': 2,
      'P3': 3,
      'P4': 4
    };
    return priorityMap[rtPriority] || 3;
  }

  /**
   * Map ADO priority to RT priority
   * @private
   */
  _mapPriorityFromADO(adoPriority) {
    const priorityMap = {
      1: 'P1',
      2: 'P2',
      3: 'P3',
      4: 'P4'
    };
    return priorityMap[adoPriority] || 'P3';
  }
}