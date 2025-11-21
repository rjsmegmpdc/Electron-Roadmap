/**
 * Roadmap Validator
 * 
 * Domain-specific validation schemas and logic for roadmap entities.
 * Extends BaseValidator with roadmap-specific validation rules.
 */

import BaseValidator, { ValidationResult } from './base-validator.js';
import DateUtils from '../date-utils.js';
import { configManager } from '../config-manager.js';

export default class RoadmapValidator extends BaseValidator {
  constructor(options = {}) {
    super(options);
    this.initializeSchemas();
  }

  /**
   * Initialize all validation schemas
   * @private
   */
  initializeSchemas() {
    this.schemas = {
      // Core roadmap entity schemas
      roadmap: this.createRoadmapSchema(),
      milestone: this.createMilestoneSchema(),
      task: this.createTaskSchema(),
      
      // Configuration schemas
      settings: this.createSettingsSchema(),
      preferences: this.createPreferencesSchema(),
      
      // Import/Export schemas
      importData: this.createImportDataSchema(),
      exportConfig: this.createExportConfigSchema()
    };
  }

  /**
   * Get a validation schema by name
   * @param {string} schemaName - Name of the schema
   * @returns {Object} Validation schema
   */
  getSchema(schemaName) {
    if (!this.schemas[schemaName]) {
      throw new Error(`Unknown schema: ${schemaName}`);
    }
    return this.schemas[schemaName];
  }

  /**
   * Validate roadmap data structure
   * @param {Object} data - Roadmap data to validate
   * @returns {ValidationResult} Validation result
   */
  validateRoadmap(data) {
    const result = this.validate(data, this.schemas.roadmap, 'roadmap');
    
    // Additional business logic validations
    if (result.valid && data) {
      this._validateRoadmapBusinessRules(data, result);
    }
    
    return result;
  }

  /**
   * Validate milestone data structure
   * @param {Object} data - Milestone data to validate
   * @param {Object} context - Additional context for validation
   * @returns {ValidationResult} Validation result
   */
  validateMilestone(data, context = {}) {
    const result = this.validate(data, this.schemas.milestone, 'milestone');
    
    if (result.valid && data) {
      this._validateMilestoneBusinessRules(data, result, context);
    }
    
    return result;
  }

  /**
   * Validate task data structure
   * @param {Object} data - Task data to validate
   * @param {Object} context - Additional context for validation
   * @returns {ValidationResult} Validation result
   */
  validateTask(data, context = {}) {
    const result = this.validate(data, this.schemas.task, 'task');
    
    if (result.valid && data) {
      this._validateTaskBusinessRules(data, result, context);
    }
    
    return result;
  }

  /**
   * Validate settings data
   * @param {Object} data - Settings data to validate
   * @returns {ValidationResult} Validation result
   */
  validateSettings(data) {
    return this.validate(data, this.schemas.settings, 'settings');
  }

  /**
   * Validate user preferences
   * @param {Object} data - Preferences data to validate
   * @returns {ValidationResult} Validation result
   */
  validatePreferences(data) {
    return this.validate(data, this.schemas.preferences, 'preferences');
  }

  /**
   * Validate import data structure
   * @param {Object} data - Import data to validate
   * @returns {ValidationResult} Validation result
   */
  validateImportData(data) {
    const result = this.validate(data, this.schemas.importData, 'importData');
    
    if (result.valid && data) {
      this._validateImportDataBusinessRules(data, result);
    }
    
    return result;
  }

  /**
   * Validate export configuration
   * @param {Object} data - Export config to validate
   * @returns {ValidationResult} Validation result
   */
  validateExportConfig(data) {
    return this.validate(data, this.schemas.exportConfig, 'exportConfig');
  }

  // Schema Definitions
  
  /**
   * Create roadmap validation schema
   * @private
   */
  createRoadmapSchema() {
    return {
      type: 'object',
      required: ['id', 'title', 'milestones', 'createdAt', 'version'],
      additionalProperties: false,
      properties: {
        id: BaseValidator.required('string', {
          format: 'uuid',
          description: 'Unique roadmap identifier'
        }),
        title: BaseValidator.required('string', {
          minLength: 1,
          maxLength: 200,
          pattern: '^\\S+.*\\S+$|^\\S+$', // No leading/trailing whitespace
          description: 'Roadmap title'
        }),
        description: BaseValidator.optional('string', {
          maxLength: 2000,
          description: 'Roadmap description'
        }),
        milestones: BaseValidator.required('array', {
          minItems: 0,
          items: { $ref: '#/schemas/milestone' },
          description: 'Array of milestones'
        }),
        metadata: BaseValidator.optional('object', {
          properties: {
            category: { type: 'string', maxLength: 100 },
            tags: { 
              type: 'array', 
              items: { type: 'string', maxLength: 50 },
              maxItems: 20,
              uniqueItems: true
            },
            priority: { 
              type: 'string', 
              enum: ['low', 'medium', 'high', 'critical'] 
            },
            estimatedDuration: { type: 'integer', min: 1 }, // days
            actualDuration: { type: 'integer', min: 1 }
          },
          additionalProperties: false
        }),
        createdAt: BaseValidator.required('nz-date', {
          description: 'Creation date'
        }),
        updatedAt: BaseValidator.optional('nz-date', {
          description: 'Last update date'
        }),
        version: BaseValidator.required('integer', {
          min: 1,
          description: 'Data version for migrations'
        }),
        status: BaseValidator.optional('string', {
          enum: ['draft', 'active', 'completed', 'archived'],
          description: 'Roadmap status'
        })
      }
    };
  }

  /**
   * Create milestone validation schema
   * @private
   */
  createMilestoneSchema() {
    return {
      type: 'object',
      required: ['id', 'title', 'targetDate', 'tasks'],
      additionalProperties: false,
      properties: {
        id: BaseValidator.required('string', {
          format: 'uuid',
          description: 'Unique milestone identifier'
        }),
        title: BaseValidator.required('string', {
          minLength: 1,
          maxLength: 150,
          pattern: '^\\S+.*\\S+$|^\\S+$',
          description: 'Milestone title'
        }),
        description: BaseValidator.optional('string', {
          maxLength: 1000,
          description: 'Milestone description'
        }),
        targetDate: BaseValidator.required('nz-date', {
          description: 'Target completion date'
        }),
        actualDate: BaseValidator.optional('nz-date', {
          description: 'Actual completion date'
        }),
        tasks: BaseValidator.required('array', {
          minItems: 0,
          items: { $ref: '#/schemas/task' },
          description: 'Array of tasks'
        }),
        dependencies: BaseValidator.optional('array', {
          items: { 
            type: 'string', 
            format: 'uuid',
            description: 'Milestone ID this depends on'
          },
          maxItems: 10,
          uniqueItems: true,
          description: 'Milestone dependencies'
        }),
        status: BaseValidator.optional('string', {
          enum: ['not-started', 'in-progress', 'completed', 'blocked', 'cancelled'],
          description: 'Milestone status'
        }),
        completion: BaseValidator.optional('integer', {
          min: 0,
          max: 100,
          description: 'Completion percentage'
        }),
        metadata: BaseValidator.optional('object', {
          properties: {
            category: { type: 'string', maxLength: 100 },
            priority: { 
              type: 'string', 
              enum: ['low', 'medium', 'high', 'critical'] 
            },
            owner: { type: 'string', maxLength: 100 },
            estimatedHours: { type: 'integer', min: 1 },
            actualHours: { type: 'integer', min: 0 }
          },
          additionalProperties: false
        })
      }
    };
  }

  /**
   * Create task validation schema
   * @private
   */
  createTaskSchema() {
    return {
      type: 'object',
      required: ['id', 'title', 'status'],
      additionalProperties: false,
      properties: {
        id: BaseValidator.required('string', {
          format: 'uuid',
          description: 'Unique task identifier'
        }),
        title: BaseValidator.required('string', {
          minLength: 1,
          maxLength: 200,
          pattern: '^\\S+.*\\S+$|^\\S+$',
          description: 'Task title'
        }),
        description: BaseValidator.optional('string', {
          maxLength: 1000,
          description: 'Task description'
        }),
        status: BaseValidator.required('string', {
          enum: ['not-started', 'in-progress', 'completed', 'blocked', 'cancelled'],
          description: 'Task status'
        }),
        assignee: BaseValidator.optional('string', {
          maxLength: 100,
          description: 'Person assigned to task'
        }),
        dueDate: BaseValidator.optional('nz-date', {
          description: 'Task due date'
        }),
        completedDate: BaseValidator.optional('nz-date', {
          description: 'Task completion date'
        }),
        priority: BaseValidator.optional('string', {
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Task priority'
        }),
        effort: BaseValidator.optional('object', {
          properties: {
            estimated: { type: 'integer', min: 1, description: 'Estimated hours' },
            actual: { type: 'integer', min: 0, description: 'Actual hours' }
          },
          additionalProperties: false
        }),
        dependencies: BaseValidator.optional('array', {
          items: { 
            type: 'string', 
            format: 'uuid',
            description: 'Task ID this depends on'
          },
          maxItems: 20,
          uniqueItems: true,
          description: 'Task dependencies'
        }),
        tags: BaseValidator.optional('array', {
          items: { type: 'string', maxLength: 50 },
          maxItems: 10,
          uniqueItems: true,
          description: 'Task tags'
        })
      }
    };
  }

  /**
   * Create settings validation schema
   * @private
   */
  createSettingsSchema() {
    return {
      type: 'object',
      additionalProperties: false,
      properties: {
        general: BaseValidator.optional('object', {
          properties: {
            autoSave: { type: 'boolean' },
            autoSaveInterval: { type: 'integer', min: 30, max: 600 }, // 30s to 10min
            confirmOnDelete: { type: 'boolean' },
            defaultView: { 
              type: 'string', 
              enum: ['gantt', 'kanban', 'list', 'calendar'] 
            }
          },
          additionalProperties: false
        }),
        display: BaseValidator.optional('object', {
          properties: {
            theme: { 
              type: 'string', 
              enum: ['light', 'dark', 'auto'] 
            },
            density: { 
              type: 'string', 
              enum: ['compact', 'normal', 'comfortable'] 
            },
            showCompletedTasks: { type: 'boolean' },
            groupMilestonesByDate: { type: 'boolean' }
          },
          additionalProperties: false
        }),
        notifications: BaseValidator.optional('object', {
          properties: {
            enabled: { type: 'boolean' },
            milestoneReminders: { type: 'boolean' },
            taskDeadlines: { type: 'boolean' },
            overdueAlerts: { type: 'boolean' },
            reminderDays: { type: 'integer', min: 1, max: 30 }
          },
          additionalProperties: false
        }),
        exports: BaseValidator.optional('object', {
          properties: {
            defaultFormat: { 
              type: 'string', 
              enum: ['json', 'csv', 'pdf'] 
            },
            includeCompletedItems: { type: 'boolean' },
            includeMetadata: { type: 'boolean' }
          },
          additionalProperties: false
        })
      }
    };
  }

  /**
   * Create preferences validation schema
   * @private
   */
  createPreferencesSchema() {
    return {
      type: 'object',
      additionalProperties: false,
      properties: {
        ui: BaseValidator.optional('object', {
          properties: {
            sidebarCollapsed: { type: 'boolean' },
            lastViewedRoadmap: { type: 'string', format: 'uuid' },
            recentRoadmaps: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              maxItems: 10,
              uniqueItems: true
            },
            columnWidths: {
              type: 'object',
              patternProperties: {
                '^[a-zA-Z][a-zA-Z0-9_]*$': { type: 'integer', min: 50, max: 1000 }
              },
              additionalProperties: false
            }
          },
          additionalProperties: false
        }),
        filters: BaseValidator.optional('object', {
          properties: {
            savedFilters: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'criteria'],
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 50 },
                  criteria: {
                    type: 'object',
                    properties: {
                      status: { 
                        type: 'array', 
                        items: { 
                          type: 'string', 
                          enum: ['not-started', 'in-progress', 'completed', 'blocked', 'cancelled'] 
                        }
                      },
                      priority: { 
                        type: 'array', 
                        items: { 
                          type: 'string', 
                          enum: ['low', 'medium', 'high', 'critical'] 
                        }
                      },
                      tags: { 
                        type: 'array', 
                        items: { type: 'string', maxLength: 50 }
                      },
                      assignee: { type: 'string', maxLength: 100 },
                      dateRange: {
                        type: 'object',
                        properties: {
                          start: { type: 'nz-date' },
                          end: { type: 'nz-date' }
                        }
                      }
                    },
                    additionalProperties: false
                  }
                },
                additionalProperties: false
              },
              maxItems: 20
            }
          },
          additionalProperties: false
        })
      }
    };
  }

  /**
   * Create import data validation schema
   * @private
   */
  createImportDataSchema() {
    return {
      type: 'object',
      required: ['version', 'data'],
      additionalProperties: false,
      properties: {
        version: BaseValidator.required('integer', {
          min: 1,
          description: 'Data format version'
        }),
        metadata: BaseValidator.optional('object', {
          properties: {
            source: { type: 'string', maxLength: 100 },
            exportedAt: { type: 'nz-date' },
            exportedBy: { type: 'string', maxLength: 100 }
          },
          additionalProperties: false
        }),
        data: BaseValidator.required('object', {
          properties: {
            roadmaps: {
              type: 'array',
              items: { $ref: '#/schemas/roadmap' },
              minItems: 1,
              maxItems: 100 // Reasonable import limit
            },
            settings: { $ref: '#/schemas/settings' },
            preferences: { $ref: '#/schemas/preferences' }
          },
          additionalProperties: false
        })
      }
    };
  }

  /**
   * Create export config validation schema
   * @private
   */
  createExportConfigSchema() {
    return {
      type: 'object',
      required: ['format'],
      additionalProperties: false,
      properties: {
        format: BaseValidator.required('string', {
          enum: ['json', 'csv', 'pdf'],
          description: 'Export format'
        }),
        roadmapIds: BaseValidator.optional('array', {
          items: { type: 'string', format: 'uuid' },
          minItems: 1,
          maxItems: 50,
          uniqueItems: true,
          description: 'Specific roadmaps to export'
        }),
        options: BaseValidator.optional('object', {
          properties: {
            includeCompleted: { type: 'boolean' },
            includeMetadata: { type: 'boolean' },
            includeSettings: { type: 'boolean' },
            dateRange: {
              type: 'object',
              properties: {
                start: { type: 'nz-date' },
                end: { type: 'nz-date' }
              }
            },
            compression: { type: 'boolean' }
          },
          additionalProperties: false
        })
      }
    };
  }

  // Business Rules Validation

  /**
   * Validate roadmap business rules
   * @private
   */
  _validateRoadmapBusinessRules(data, result) {
    // Validate milestone ordering and dates
    if (data.milestones && data.milestones.length > 1) {
      for (let i = 1; i < data.milestones.length; i++) {
        const current = data.milestones[i];
        const previous = data.milestones[i - 1];
        
        if (current.targetDate && previous.targetDate) {
          if (DateUtils.compareNZ(current.targetDate, previous.targetDate) < 0) {
            result.addWarning(
              `milestones[${i}].targetDate`, 
              `Milestone "${current.title}" has target date before previous milestone`
            );
          }
        }
      }
    }

    // Check for circular dependencies
    if (data.milestones) {
      this._validateMilestoneDependencies(data.milestones, result);
    }
  }

  /**
   * Validate milestone business rules
   * @private
   */
  _validateMilestoneBusinessRules(data, result, context) {
    // Validate completion percentage matches task completion
    if (data.tasks && data.tasks.length > 0 && data.completion !== undefined) {
      const completedTasks = data.tasks.filter(task => task.status === 'completed').length;
      const calculatedCompletion = Math.round((completedTasks / data.tasks.length) * 100);
      
      if (Math.abs(calculatedCompletion - data.completion) > 5) { // Allow 5% tolerance
        result.addWarning(
          'completion',
          `Completion percentage (${data.completion}%) doesn't match task completion (${calculatedCompletion}%)`
        );
      }
    }

    // Validate actual date is not before target date without good reason
    if (data.actualDate && data.targetDate) {
      const daysDiff = DateUtils.daysBetweenNZ(data.targetDate, data.actualDate);
      if (daysDiff > 30) { // More than 30 days late
        result.addWarning(
          'actualDate',
          `Milestone completed more than 30 days after target date`
        );
      }
    }

    // Status consistency checks
    if (data.status === 'completed' && !data.actualDate) {
      result.addError(
        'actualDate',
        'Completed milestones must have an actual completion date',
        'MISSING_COMPLETION_DATE'
      );
    }
  }

  /**
   * Validate task business rules
   * @private
   */
  _validateTaskBusinessRules(data, result, context) {
    // Validate completion date consistency
    if (data.status === 'completed' && !data.completedDate) {
      result.addError(
        'completedDate',
        'Completed tasks must have a completion date',
        'MISSING_COMPLETION_DATE'
      );
    }

    if (data.completedDate && data.status !== 'completed') {
      result.addWarning(
        'status',
        'Task has completion date but status is not completed'
      );
    }

    // Validate due date is reasonable
    if (data.dueDate) {
      const today = DateUtils.formatToNZ(new Date());
      const daysToDue = DateUtils.daysBetweenNZ(today, data.dueDate);
      
      if (daysToDue < -365) { // Due date is over a year in the past
        result.addWarning(
          'dueDate',
          'Task due date is more than a year in the past'
        );
      }
    }

    // Effort validation
    if (data.effort && data.effort.actual !== undefined && data.effort.estimated !== undefined) {
      const variance = (data.effort.actual - data.effort.estimated) / data.effort.estimated;
      if (variance > 2) { // More than 200% over estimate
        result.addWarning(
          'effort.actual',
          `Actual effort significantly exceeds estimate (${Math.round(variance * 100)}% over)`
        );
      }
    }
  }

  /**
   * Validate import data business rules
   * @private
   */
  _validateImportDataBusinessRules(data, result) {
    // Check for duplicate roadmap IDs
    if (data.data.roadmaps) {
      const ids = data.data.roadmaps.map(r => r.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      
      if (duplicates.length > 0) {
        result.addError(
          'data.roadmaps',
          `Duplicate roadmap IDs found: ${[...new Set(duplicates)].join(', ')}`,
          'DUPLICATE_IDS'
        );
      }
    }

    // Version compatibility check
    const currentVersion = configManager.get('dataVersion', 1);
    if (data.version > currentVersion) {
      result.addWarning(
        'version',
        `Import data version (${data.version}) is newer than current version (${currentVersion}). Some features may not work correctly.`
      );
    }
  }

  /**
   * Validate milestone dependencies for cycles
   * @private
   */
  _validateMilestoneDependencies(milestones, result) {
    const milestoneMap = new Map();
    milestones.forEach(milestone => {
      milestoneMap.set(milestone.id, milestone);
    });

    // Check each milestone for circular dependencies
    milestones.forEach(milestone => {
      if (milestone.dependencies && milestone.dependencies.length > 0) {
        const visited = new Set();
        const path = [];
        
        if (this._hasCircularDependency(milestone.id, milestoneMap, visited, path)) {
          result.addError(
            `milestones`,
            `Circular dependency detected in milestone "${milestone.title}": ${path.join(' → ')}`,
            'CIRCULAR_DEPENDENCY'
          );
        }
      }
    });
  }

  /**
   * Check for circular dependencies using DFS
   * @private
   */
  _hasCircularDependency(milestoneId, milestoneMap, visited, path) {
    if (path.includes(milestoneId)) {
      path.push(milestoneId);
      return true; // Found cycle
    }

    if (visited.has(milestoneId)) {
      return false; // Already processed
    }

    visited.add(milestoneId);
    path.push(milestoneId);

    const milestone = milestoneMap.get(milestoneId);
    if (milestone && milestone.dependencies) {
      for (const depId of milestone.dependencies) {
        if (this._hasCircularDependency(depId, milestoneMap, visited, path)) {
          return true;
        }
      }
    }

    path.pop();
    return false;
  }
}