/**
 * Base Validator
 * 
 * Provides foundational validation functionality and common validation patterns.
 * All specific validators extend this base class for consistent behavior.
 */

import DateUtils from '../date-utils.js';
import { configManager } from '../config-manager.js';
import { logger } from '../logger.js';

export class ValidationError extends Error {
  constructor(message, field, code, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
    this.value = value;
  }
}

export class ValidationResult {
  constructor(valid = true, errors = [], warnings = []) {
    this.valid = valid;
    this.errors = errors;
    this.warnings = warnings;
  }

  /**
   * Add an error to the validation result
   * @param {string} field - Field name
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {*} value - Invalid value
   */
  addError(field, message, code = 'INVALID', value = undefined) {
    this.valid = false;
    this.errors.push({
      field,
      message,
      code,
      value
    });
  }

  /**
   * Add a warning to the validation result
   * @param {string} field - Field name
   * @param {string} message - Warning message
   * @param {*} value - Value that caused warning
   */
  addWarning(field, message, value = undefined) {
    this.warnings.push({
      field,
      message,
      value
    });
  }

  /**
   * Merge another validation result into this one
   * @param {ValidationResult} other - Other validation result
   */
  merge(other) {
    if (!other.valid) {
      this.valid = false;
    }
    this.errors.push(...other.errors);
    this.warnings.push(...other.warnings);
  }

  /**
   * Get errors for a specific field
   * @param {string} field - Field name
   * @returns {Array} Array of errors for the field
   */
  getFieldErrors(field) {
    return this.errors.filter(error => error.field === field);
  }

  /**
   * Check if a specific field has errors
   * @param {string} field - Field name
   * @returns {boolean} True if field has errors
   */
  hasFieldError(field) {
    return this.errors.some(error => error.field === field);
  }

  /**
   * Get formatted error messages
   * @returns {Object} Object with field names as keys and error messages as values
   */
  getFieldMessages() {
    const messages = {};
    for (const error of this.errors) {
      if (!messages[error.field]) {
        messages[error.field] = [];
      }
      messages[error.field].push(error.message);
    }
    
    // Convert arrays to strings for single errors
    for (const field in messages) {
      if (messages[field].length === 1) {
        messages[field] = messages[field][0];
      }
    }
    
    return messages;
  }
}

export default class BaseValidator {
  constructor(options = {}) {
    this.strict = options.strict !== false; // Default to strict validation
    this.allowNull = options.allowNull === true; // Default to not allowing null
    this.config = configManager;
    this.logger = logger.group ? logger.group('Validator') : logger;
  }

  /**
   * Validate a value according to a schema
   * @param {*} value - Value to validate
   * @param {Object} schema - Validation schema
   * @param {string} context - Context for error messages
   * @returns {ValidationResult} Validation result
   */
  validate(value, schema, context = 'value') {
    const result = new ValidationResult();
    
    try {
      this._validateValue(value, schema, context, result);
    } catch (error) {
      logger.error('Validation error occurred', {
        context,
        error: error.message,
        schema: schema?.type || 'unknown'
      });
      
      if (error instanceof ValidationError) {
        result.addError(error.field, error.message, error.code, error.value);
      } else {
        result.addError(context, `Validation failed: ${error.message}`, 'VALIDATION_ERROR');
      }
    }
    
    return result;
  }

  /**
   * Validate multiple values according to schemas
   * @param {Object} values - Object with values to validate
   * @param {Object} schemas - Object with validation schemas
   * @returns {ValidationResult} Combined validation result
   */
  validateMultiple(values, schemas) {
    const result = new ValidationResult();
    
    for (const [field, schema] of Object.entries(schemas)) {
      const fieldValue = values[field];
      const fieldResult = this.validate(fieldValue, schema, field);
      result.merge(fieldResult);
    }
    
    return result;
  }

  /**
   * Core validation logic
   * @private
   * @param {*} value - Value to validate
   * @param {Object} schema - Validation schema
   * @param {string} field - Field name for errors
   * @param {ValidationResult} result - Result object to update
   */
  _validateValue(value, schema, field, result) {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      if (schema.required === true) {
        result.addError(field, `${field} is required`, 'REQUIRED');
        return;
      }
      if (!this.allowNull && !schema.allowNull) {
        if (value === null) {
          result.addError(field, `${field} cannot be null`, 'NULL_NOT_ALLOWED');
          return;
        }
      }
      // If not required and null/undefined is allowed, skip further validation
      return;
    }

    // Type validation
    if (schema.type) {
      this._validateType(value, schema.type, field, result);
      if (result.hasFieldError(field)) return; // Skip further validation if type is wrong
    }

    // String validations
    if (schema.type === 'string' && typeof value === 'string') {
      this._validateString(value, schema, field, result);
    }

    // Number validations
    if ((schema.type === 'number' || schema.type === 'integer') && typeof value === 'number') {
      this._validateNumber(value, schema, field, result);
    }

    // Array validations
    if (schema.type === 'array' && Array.isArray(value)) {
      this._validateArray(value, schema, field, result);
    }

    // Object validations
    if (schema.type === 'object' && typeof value === 'object') {
      this._validateObject(value, schema, field, result);
    }

    // Date validations (custom type)
    if (schema.type === 'nz-date' && typeof value === 'string') {
      this._validateNZDate(value, schema, field, result);
    }

    // Custom validation function
    if (schema.validate && typeof schema.validate === 'function') {
      try {
        const customResult = schema.validate(value, field);
        if (customResult !== true) {
          const message = typeof customResult === 'string' ? customResult : `${field} is invalid`;
          result.addError(field, message, 'CUSTOM_VALIDATION');
        }
      } catch (error) {
        result.addError(field, `Custom validation failed: ${error.message}`, 'CUSTOM_ERROR');
      }
    }

    // Enum validation
    if (schema.enum && Array.isArray(schema.enum)) {
      if (!schema.enum.includes(value)) {
        result.addError(field, `${field} must be one of: ${schema.enum.join(', ')}`, 'INVALID_ENUM', value);
      }
    }
  }

  /**
   * Validate type
   * @private
   */
  _validateType(value, expectedType, field, result) {
    let actualType = typeof value;
    
    // Special handling for arrays and integers
    if (expectedType === 'array') {
      if (!Array.isArray(value)) {
        result.addError(field, `${field} must be an array`, 'INVALID_TYPE', value);
      }
      return;
    }
    
    if (expectedType === 'integer') {
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        result.addError(field, `${field} must be an integer`, 'INVALID_TYPE', value);
      }
      return;
    }

    if (expectedType === 'nz-date') {
      if (typeof value !== 'string') {
        result.addError(field, `${field} must be a string in DD-MM-YYYY format`, 'INVALID_TYPE', value);
      }
      return;
    }
    
    if (actualType !== expectedType) {
      result.addError(field, `${field} must be of type ${expectedType}`, 'INVALID_TYPE', value);
    }
  }

  /**
   * Validate string constraints
   * @private
   */
  _validateString(value, schema, field, result) {
    if (schema.minLength && value.length < schema.minLength) {
      result.addError(field, `${field} must be at least ${schema.minLength} characters long`, 'MIN_LENGTH');
    }
    
    if (schema.maxLength && value.length > schema.maxLength) {
      result.addError(field, `${field} must be at most ${schema.maxLength} characters long`, 'MAX_LENGTH');
    }
    
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        result.addError(field, `${field} format is invalid`, 'INVALID_PATTERN', value);
      }
    }
    
    if (schema.format) {
      this._validateStringFormat(value, schema.format, field, result);
    }
  }

  /**
   * Validate string formats
   * @private
   */
  _validateStringFormat(value, format, field, result) {
    switch (format) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          result.addError(field, `${field} must be a valid email address`, 'INVALID_EMAIL');
        }
        break;
        
      case 'uuid':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          result.addError(field, `${field} must be a valid UUID`, 'INVALID_UUID');
        }
        break;
        
      case 'url':
        try {
          new URL(value);
        } catch {
          result.addError(field, `${field} must be a valid URL`, 'INVALID_URL');
        }
        break;
    }
  }

  /**
   * Validate number constraints
   * @private
   */
  _validateNumber(value, schema, field, result) {
    if (schema.min !== undefined && value < schema.min) {
      result.addError(field, `${field} must be at least ${schema.min}`, 'MIN_VALUE');
    }
    
    if (schema.max !== undefined && value > schema.max) {
      result.addError(field, `${field} must be at most ${schema.max}`, 'MAX_VALUE');
    }
    
    if (schema.multipleOf && value % schema.multipleOf !== 0) {
      result.addError(field, `${field} must be a multiple of ${schema.multipleOf}`, 'NOT_MULTIPLE');
    }
  }

  /**
   * Validate array constraints
   * @private
   */
  _validateArray(value, schema, field, result) {
    if (schema.minItems && value.length < schema.minItems) {
      result.addError(field, `${field} must have at least ${schema.minItems} items`, 'MIN_ITEMS');
    }
    
    if (schema.maxItems && value.length > schema.maxItems) {
      result.addError(field, `${field} must have at most ${schema.maxItems} items`, 'MAX_ITEMS');
    }
    
    if (schema.uniqueItems === true) {
      const seen = new Set();
      const duplicates = new Set();
      
      for (let i = 0; i < value.length; i++) {
        const item = JSON.stringify(value[i]);
        if (seen.has(item)) {
          duplicates.add(value[i]);
        } else {
          seen.add(item);
        }
      }
      
      if (duplicates.size > 0) {
        result.addError(field, `${field} must contain unique items`, 'DUPLICATE_ITEMS');
      }
    }
    
    // Validate array items
    if (schema.items) {
      for (let i = 0; i < value.length; i++) {
        const itemResult = this.validate(value[i], schema.items, `${field}[${i}]`);
        result.merge(itemResult);
      }
    }
  }

  /**
   * Validate object constraints
   * @private
   */
  _validateObject(value, schema, field, result) {
    if (schema.properties) {
      // Validate known properties
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const propValue = value[propName];
        const propResult = this.validate(propValue, propSchema, `${field}.${propName}`);
        result.merge(propResult);
      }
      
      // Check for additional properties
      if (schema.additionalProperties === false) {
        const allowedProps = Object.keys(schema.properties);
        const actualProps = Object.keys(value);
        const extraProps = actualProps.filter(prop => !allowedProps.includes(prop));
        
        if (extraProps.length > 0) {
          result.addError(field, `${field} contains unexpected properties: ${extraProps.join(', ')}`, 'EXTRA_PROPERTIES');
        }
      }
    }
    
    if (schema.required && Array.isArray(schema.required)) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in value) || value[requiredProp] === undefined) {
          result.addError(`${field}.${requiredProp}`, `${requiredProp} is required`, 'REQUIRED');
        }
      }
    }
  }

  /**
   * Validate New Zealand date format
   * @private
   */
  _validateNZDate(value, schema, field, result) {
    if (!DateUtils.isValidNZ(value)) {
      result.addError(field, `${field} must be a valid date in DD-MM-YYYY format`, 'INVALID_NZ_DATE', value);
      return;
    }
    
    // Date range validations
    if (schema.minDate) {
      if (DateUtils.compareNZ(value, schema.minDate) < 0) {
        result.addError(field, `${field} must be on or after ${schema.minDate}`, 'DATE_TOO_EARLY');
      }
    }
    
    if (schema.maxDate) {
      if (DateUtils.compareNZ(value, schema.maxDate) > 0) {
        result.addError(field, `${field} must be on or before ${schema.maxDate}`, 'DATE_TOO_LATE');
      }
    }
  }

  /**
   * Create a schema for common validation patterns
   * @param {string} type - Base type
   * @param {Object} constraints - Additional constraints
   * @returns {Object} Validation schema
   */
  static createSchema(type, constraints = {}) {
    return {
      type,
      ...constraints
    };
  }

  /**
   * Helper to create required field schema
   * @param {string} type - Field type
   * @param {Object} constraints - Additional constraints
   * @returns {Object} Required field schema
   */
  static required(type, constraints = {}) {
    return {
      type,
      required: true,
      ...constraints
    };
  }

  /**
   * Helper to create optional field schema
   * @param {string} type - Field type
   * @param {Object} constraints - Additional constraints
   * @returns {Object} Optional field schema
   */
  static optional(type, constraints = {}) {
    return {
      type,
      required: false,
      ...constraints
    };
  }
}