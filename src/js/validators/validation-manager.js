/**
 * Validation Manager
 * 
 * Central facade for all validation operations in the roadmap application.
 * Provides a unified API for validation, error handling, and schema management.
 */

import BaseValidator, { ValidationError, ValidationResult } from './base-validator.js';
import RoadmapValidator from './roadmap-validator.js';
import { eventBus } from '../event-bus.js';
import { logger } from '../logger.js';
import { configManager } from '../config-manager.js';

class ValidationManager {
  constructor() {
    this.validators = new Map();
    this.schemaCache = new Map();
    this.validationHistory = [];
    this.initialized = false;
    
    this.logger = logger.group ? logger.group('ValidationManager') : logger;
    this._setupEventListeners();
  }

  /**
   * Initialize the validation manager
   */
  initialize() {
    if (this.initialized) return;
    
    try {
      // Register default validators
      this.registerValidator('roadmap', new RoadmapValidator({
        strict: configManager.get('validation.strict', true),
        allowNull: configManager.get('validation.allowNull', false)
      }));

      // Register base validator for general use
      this.registerValidator('base', new BaseValidator({
        strict: configManager.get('validation.strict', true),
        allowNull: configManager.get('validation.allowNull', false)
      }));

      this.initialized = true;
      this.logger.info('Validation manager initialized successfully');
      
      eventBus.emit('validation:manager:ready', { 
        validators: Array.from(this.validators.keys()) 
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize validation manager', { error: error.message });
      throw new Error(`Validation manager initialization failed: ${error.message}`);
    }
  }

  /**
   * Register a validator instance
   * @param {string} name - Validator name
   * @param {BaseValidator} validator - Validator instance
   */
  registerValidator(name, validator) {
    if (!validator || !(validator instanceof BaseValidator)) {
      throw new Error('Validator must be an instance of BaseValidator');
    }
    
    this.validators.set(name, validator);
    this.logger.debug(`Validator registered: ${name}`);
    
    eventBus.emit('validation:validator:registered', { name, validator });
  }

  /**
   * Get a validator instance
   * @param {string} name - Validator name
   * @returns {BaseValidator} Validator instance
   */
  getValidator(name) {
    const validator = this.validators.get(name);
    if (!validator) {
      throw new Error(`Unknown validator: ${name}`);
    }
    return validator;
  }

  /**
   * Validate roadmap data
   * @param {Object} data - Roadmap data to validate
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  validateRoadmap(data, options = {}) {
    const validator = this.getValidator('roadmap');
    return this._performValidation('roadmap', 'roadmap', data, validator.validateRoadmap.bind(validator), options);
  }

  /**
   * Validate milestone data
   * @param {Object} data - Milestone data to validate
   * @param {Object} context - Additional validation context
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  validateMilestone(data, context = {}, options = {}) {
    const validator = this.getValidator('roadmap');
    return this._performValidation('milestone', 'milestone', data, 
      (d) => validator.validateMilestone(d, context), options);
  }

  /**
   * Validate task data
   * @param {Object} data - Task data to validate
   * @param {Object} context - Additional validation context
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  validateTask(data, context = {}, options = {}) {
    const validator = this.getValidator('roadmap');
    return this._performValidation('task', 'task', data, 
      (d) => validator.validateTask(d, context), options);
  }

  /**
   * Validate settings data
   * @param {Object} data - Settings data to validate
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  validateSettings(data, options = {}) {
    const validator = this.getValidator('roadmap');
    return this._performValidation('settings', 'settings', data, validator.validateSettings.bind(validator), options);
  }

  /**
   * Validate user preferences
   * @param {Object} data - Preferences data to validate
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  validatePreferences(data, options = {}) {
    const validator = this.getValidator('roadmap');
    return this._performValidation('preferences', 'preferences', data, validator.validatePreferences.bind(validator), options);
  }

  /**
   * Validate import data
   * @param {Object} data - Import data to validate
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  validateImportData(data, options = {}) {
    const validator = this.getValidator('roadmap');
    return this._performValidation('importData', 'import', data, validator.validateImportData.bind(validator), options);
  }

  /**
   * Validate export configuration
   * @param {Object} data - Export config to validate
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  validateExportConfig(data, options = {}) {
    const validator = this.getValidator('roadmap');
    return this._performValidation('exportConfig', 'export', data, validator.validateExportConfig.bind(validator), options);
  }

  /**
   * Validate data against a custom schema
   * @param {*} data - Data to validate
   * @param {Object} schema - Validation schema
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  validateWithSchema(data, schema, options = {}) {
    const validatorName = options.validator || 'base';
    const validator = this.getValidator(validatorName);
    const context = options.context || 'data';
    
    return this._performValidation(context, 'custom', data, 
      (d) => validator.validate(d, schema, context), options);
  }

  /**
   * Validate multiple values against schemas
   * @param {Object} data - Object with values to validate
   * @param {Object} schemas - Object with validation schemas
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  validateMultiple(data, schemas, options = {}) {
    const validatorName = options.validator || 'base';
    const validator = this.getValidator(validatorName);
    
    return this._performValidation('multiple', 'batch', data, 
      (d) => validator.validateMultiple(d, schemas), options);
  }

  /**
   * Get a schema by name from a validator
   * @param {string} schemaName - Schema name
   * @param {string} validatorName - Validator name (defaults to 'roadmap')
   * @returns {Object} Validation schema
   */
  getSchema(schemaName, validatorName = 'roadmap') {
    const cacheKey = `${validatorName}:${schemaName}`;
    
    if (this.schemaCache.has(cacheKey)) {
      return this.schemaCache.get(cacheKey);
    }
    
    const validator = this.getValidator(validatorName);
    if (!validator.getSchema) {
      throw new Error(`Validator ${validatorName} does not support schema retrieval`);
    }
    
    const schema = validator.getSchema(schemaName);
    this.schemaCache.set(cacheKey, schema);
    return schema;
  }

  /**
   * Check if data is valid (quick validation without full result)
   * @param {*} data - Data to validate
   * @param {Object} schema - Validation schema
   * @param {Object} options - Validation options
   * @returns {boolean} True if data is valid
   */
  isValid(data, schema, options = {}) {
    const result = this.validateWithSchema(data, schema, options);
    return result.valid;
  }

  /**
   * Get validation statistics
   * @returns {Object} Validation statistics
   */
  getValidationStats() {
    const total = this.validationHistory.length;
    const successful = this.validationHistory.filter(v => v.valid).length;
    const failed = total - successful;
    
    const typeCounts = {};
    const errorCounts = {};
    
    for (const validation of this.validationHistory) {
      typeCounts[validation.type] = (typeCounts[validation.type] || 0) + 1;
      
      if (!validation.valid) {
        for (const error of validation.errors || []) {
          errorCounts[error.code] = (errorCounts[error.code] || 0) + 1;
        }
      }
    }
    
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) : 0,
      typeCounts,
      errorCounts,
      recentValidations: this.validationHistory.slice(-10)
    };
  }

  /**
   * Clear validation history
   */
  clearHistory() {
    this.validationHistory = [];
    this.logger.debug('Validation history cleared');
    eventBus.emit('validation:history:cleared');
  }

  /**
   * Clear schema cache
   */
  clearCache() {
    this.schemaCache.clear();
    this.logger.debug('Schema cache cleared');
    eventBus.emit('validation:cache:cleared');
  }

  /**
   * Create validation error with context
   * @param {string} message - Error message
   * @param {string} field - Field name
   * @param {string} code - Error code
   * @param {*} value - Invalid value
   * @returns {ValidationError} Validation error
   */
  createError(message, field, code = 'INVALID', value = undefined) {
    return new ValidationError(message, field, code, value);
  }

  /**
   * Create empty validation result
   * @param {boolean} valid - Initial validity
   * @returns {ValidationResult} Empty validation result
   */
  createResult(valid = true) {
    return new ValidationResult(valid);
  }

  /**
   * Perform validation with common error handling and logging
   * @private
   */
  _performValidation(context, type, data, validationFunction, options) {
    const startTime = performance.now();
    let result;
    
    try {
      // Pre-validation hooks
      if (options.beforeValidation) {
        options.beforeValidation(data, context);
      }
      
      result = validationFunction(data);
      
      // Post-validation hooks
      if (options.afterValidation) {
        options.afterValidation(result, data, context);
      }
      
    } catch (error) {
      this.logger.error(`Validation failed for ${type}`, {
        context,
        error: error.message,
        data: options.logData !== false ? data : '[hidden]'
      });
      
      result = new ValidationResult(false);
      if (error instanceof ValidationError) {
        result.addError(error.field, error.message, error.code, error.value);
      } else {
        result.addError(context, `Validation error: ${error.message}`, 'VALIDATION_FAILED');
      }
    }
    
    const duration = performance.now() - startTime;
    
    // Record validation in history
    const historyEntry = {
      timestamp: new Date().toISOString(),
      context,
      type,
      valid: result.valid,
      duration,
      errorCount: result.errors.length,
      warningCount: result.warnings.length
    };
    
    // Include errors for failed validations
    if (!result.valid) {
      historyEntry.errors = result.errors.map(e => ({
        field: e.field,
        code: e.code,
        message: e.message
      }));
    }
    
    this.validationHistory.push(historyEntry);
    
    // Keep only last 1000 validations
    if (this.validationHistory.length > 1000) {
      this.validationHistory = this.validationHistory.slice(-1000);
    }
    
    // Log validation result
    if (result.valid) {
      this.logger.debug(`Validation successful for ${type}`, {
        context,
        duration: `${duration.toFixed(2)}ms`,
        warnings: result.warnings.length
      });
    } else {
      this.logger.warn(`Validation failed for ${type}`, {
        context,
        duration: `${duration.toFixed(2)}ms`,
        errors: result.errors.length,
        warnings: result.warnings.length
      });
    }
    
    // Emit validation events
    eventBus.emit('validation:completed', {
      context,
      type,
      valid: result.valid,
      duration,
      result
    });
    
    if (!result.valid) {
      eventBus.emit('validation:failed', {
        context,
        type,
        errors: result.errors,
        warnings: result.warnings
      });
    }
    
    return result;
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Listen for configuration changes that affect validation
    eventBus.on('config:changed', (event) => {
      if (event.key.startsWith('validation.')) {
        this.logger.debug('Validation configuration changed, clearing cache');
        this.clearCache();
      }
    });

    // Listen for data version changes
    eventBus.on('data:version:changed', () => {
      this.logger.debug('Data version changed, clearing validation cache');
      this.clearCache();
    });
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.validators.clear();
    this.schemaCache.clear();
    this.validationHistory = [];
    this.initialized = false;
    
    eventBus.off('config:changed');
    eventBus.off('data:version:changed');
    
    this.logger.info('Validation manager destroyed');
  }
}

// Create and export singleton instance
export const validationManager = new ValidationManager();

// Auto-initialize if not in test environment
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  // Initialize after a short delay to ensure dependencies are loaded
  setTimeout(() => {
    try {
      validationManager.initialize();
    } catch (error) {
      console.error('Failed to auto-initialize validation manager:', error);
    }
  }, 100);
}

export default validationManager;

// Export classes for testing and extension
export {
  ValidationManager,
  ValidationError,
  ValidationResult,
  BaseValidator,
  RoadmapValidator
};