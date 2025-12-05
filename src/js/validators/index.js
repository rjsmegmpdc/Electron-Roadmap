/**
 * Validators Module - Main Entry Point
 * 
 * Provides centralized access to all validation functionality in the roadmap application.
 * This module exposes the validation manager and all validator components.
 */

// Main validation manager (singleton instance)
export { validationManager as default } from './validation-manager.js';
export { validationManager } from './validation-manager.js';

// Validation classes for extension and testing
export {
  ValidationManager,
  ValidationError,
  ValidationResult,
  BaseValidator,
  RoadmapValidator
} from './validation-manager.js';

// Re-export ValidationError and ValidationResult from base for additional access
export { ValidationError as ValidationErrorClass, ValidationResult as ValidationResultClass } from './base-validator.js';

/**
 * Convenience functions for common validation operations
 */

import { validationManager } from './validation-manager.js';

/**
 * Quick validation helper - returns true/false
 * @param {*} data - Data to validate
 * @param {Object} schema - Validation schema
 * @param {Object} options - Validation options
 * @returns {boolean} True if data is valid
 */
export function isValid(data, schema, options = {}) {
  try {
    return validationManager.isValid(data, schema, options);
  } catch (error) {
    console.warn('Validation check failed:', error.message);
    return false;
  }
}

/**
 * Validate roadmap data with error handling
 * @param {Object} roadmapData - Roadmap data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateRoadmap(roadmapData, options = {}) {
  try {
    return validationManager.validateRoadmap(roadmapData, options);
  } catch (error) {
    console.error('Roadmap validation failed:', error.message);
    const result = validationManager.createResult(false);
    result.addError('roadmap', `Validation failed: ${error.message}`, 'VALIDATION_ERROR');
    return result;
  }
}

/**
 * Validate milestone data with error handling
 * @param {Object} milestoneData - Milestone data to validate
 * @param {Object} context - Additional context
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateMilestone(milestoneData, context = {}, options = {}) {
  try {
    return validationManager.validateMilestone(milestoneData, context, options);
  } catch (error) {
    console.error('Milestone validation failed:', error.message);
    const result = validationManager.createResult(false);
    result.addError('milestone', `Validation failed: ${error.message}`, 'VALIDATION_ERROR');
    return result;
  }
}

/**
 * Validate task data with error handling
 * @param {Object} taskData - Task data to validate
 * @param {Object} context - Additional context
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateTask(taskData, context = {}, options = {}) {
  try {
    return validationManager.validateTask(taskData, context, options);
  } catch (error) {
    console.error('Task validation failed:', error.message);
    const result = validationManager.createResult(false);
    result.addError('task', `Validation failed: ${error.message}`, 'VALIDATION_ERROR');
    return result;
  }
}

/**
 * Validate settings data with error handling
 * @param {Object} settingsData - Settings data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateSettings(settingsData, options = {}) {
  try {
    return validationManager.validateSettings(settingsData, options);
  } catch (error) {
    console.error('Settings validation failed:', error.message);
    const result = validationManager.createResult(false);
    result.addError('settings', `Validation failed: ${error.message}`, 'VALIDATION_ERROR');
    return result;
  }
}

/**
 * Create a validation error
 * @param {string} message - Error message
 * @param {string} field - Field name
 * @param {string} code - Error code
 * @param {*} value - Invalid value
 * @returns {ValidationError} Validation error
 */
export function createValidationError(message, field, code = 'INVALID', value = undefined) {
  return validationManager.createError(message, field, code, value);
}

/**
 * Create an empty validation result
 * @param {boolean} valid - Initial validity
 * @returns {ValidationResult} Validation result
 */
export function createValidationResult(valid = true) {
  return validationManager.createResult(valid);
}

/**
 * Get validation statistics
 * @returns {Object} Validation statistics
 */
export function getValidationStats() {
  try {
    return validationManager.getValidationStats();
  } catch (error) {
    console.warn('Could not retrieve validation stats:', error.message);
    return {
      total: 0,
      successful: 0,
      failed: 0,
      successRate: 0,
      typeCounts: {},
      errorCounts: {},
      recentValidations: []
    };
  }
}

/**
 * Common validation schemas for quick use
 */
export const schemas = {
  /**
   * Simple string validation
   * @param {number} minLength - Minimum length (default: 1)
   * @param {number} maxLength - Maximum length (default: 200)
   * @param {boolean} required - Whether field is required (default: true)
   * @returns {Object} String validation schema
   */
  string: (minLength = 1, maxLength = 200, required = true) => ({
    type: 'string',
    required,
    minLength,
    maxLength,
    pattern: '^\\S+.*\\S+$|^\\S+$' // No leading/trailing whitespace
  }),

  /**
   * Email validation
   * @param {boolean} required - Whether field is required (default: true)
   * @returns {Object} Email validation schema
   */
  email: (required = true) => ({
    type: 'string',
    required,
    format: 'email'
  }),

  /**
   * UUID validation
   * @param {boolean} required - Whether field is required (default: true)
   * @returns {Object} UUID validation schema
   */
  uuid: (required = true) => ({
    type: 'string',
    required,
    format: 'uuid'
  }),

  /**
   * New Zealand date validation
   * @param {boolean} required - Whether field is required (default: true)
   * @returns {Object} NZ date validation schema
   */
  nzDate: (required = true) => ({
    type: 'nz-date',
    required
  }),

  /**
   * Integer validation
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {boolean} required - Whether field is required (default: true)
   * @returns {Object} Integer validation schema
   */
  integer: (min = undefined, max = undefined, required = true) => {
    const schema = {
      type: 'integer',
      required
    };
    if (min !== undefined) schema.min = min;
    if (max !== undefined) schema.max = max;
    return schema;
  },

  /**
   * Enum validation
   * @param {Array} values - Allowed values
   * @param {boolean} required - Whether field is required (default: true)
   * @returns {Object} Enum validation schema
   */
  enum: (values, required = true) => ({
    type: 'string',
    required,
    enum: values
  }),

  /**
   * Array validation
   * @param {Object} itemSchema - Schema for array items
   * @param {number} minItems - Minimum number of items
   * @param {number} maxItems - Maximum number of items
   * @param {boolean} required - Whether field is required (default: true)
   * @returns {Object} Array validation schema
   */
  array: (itemSchema, minItems = 0, maxItems = undefined, required = true) => {
    const schema = {
      type: 'array',
      required,
      minItems,
      items: itemSchema
    };
    if (maxItems !== undefined) schema.maxItems = maxItems;
    return schema;
  }
};

/**
 * Common validation patterns
 */
export const patterns = {
  // No leading/trailing whitespace, allows single character
  NO_TRIM_WHITESPACE: '^\\S+.*\\S+$|^\\S+$',
  
  // Basic email pattern (not comprehensive but practical)
  EMAIL: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
  
  // UUID v4 pattern
  UUID: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
  
  // New Zealand date format DD-MM-YYYY
  NZ_DATE: '^\\d{2}-\\d{2}-\\d{4}$',
  
  // Safe filename characters
  FILENAME: '^[a-zA-Z0-9._-]+$',
  
  // Slug format (URL-friendly)
  SLUG: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
};