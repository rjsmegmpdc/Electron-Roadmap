/**
 * Core Utilities - Standardized utility functions for Roadmap Tool
 * 
 * Provides consistent utility functions for date handling, ID generation,
 * validation, error handling, and common operations across the application.
 */

import { APP_CONFIG, getConfigValue } from './config.js';

/**
 * Date Utilities - Standardized NZ date format handling
 */
export class DateUtils {
  static #NZ_DATE_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;
  static #NZ_DATE_FORMAT = 'DD-MM-YYYY';

  /**
   * Validates if a string matches NZ date format (DD-MM-YYYY)
   * @param {string} dateStr - Date string to validate
   * @returns {boolean} True if valid NZ format and real date
   */
  static isValidNZ(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
      return false;
    }

    // Check format with regex
    const match = this.#NZ_DATE_REGEX.exec(dateStr);
    if (!match) {
      return false;
    }

    // Parse components and validate calendar date
    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    const date = new Date(yearNum, monthNum - 1, dayNum);

    // Check if the date is valid (handles leap years, days per month, etc.)
    return date.getFullYear() === yearNum &&
           date.getMonth() === monthNum - 1 &&
           date.getDate() === dayNum;
  }

  /**
   * Parses a NZ format date string to a Date object
   * @param {string} dateStr - Date string in DD-MM-YYYY format
   * @returns {Date} Parsed Date object
   * @throws {ValidationError} If format is invalid or date is impossible
   */
  static parseNZ(dateStr) {
    if (!this.isValidNZ(dateStr)) {
      throw new ValidationError(`Invalid NZ date format (expected ${this.#NZ_DATE_FORMAT}): ${dateStr}`);
    }

    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Formats a Date object to NZ format string (DD/MM/YYYY)
   * @param {Date} date - Date object to format
   * @returns {string} Date string in DD-MM-YYYY format
   * @throws {ValidationError} If input is not a valid Date
   */
  static formatNZ(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new ValidationError('Invalid Date object provided to formatNZ');
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());

    return `${day}-${month}-${year}`;
  }

  /**
   * Compares two NZ format date strings
   * @param {string} dateA - First date string (DD-MM-YYYY)
   * @param {string} dateB - Second date string (DD-MM-YYYY)
   * @returns {number} -1 if dateA < dateB, 0 if equal, 1 if dateA > dateB
   * @throws {ValidationError} If either date string is invalid
   */
  static compareNZ(dateA, dateB) {
    const parsedA = this.parseNZ(dateA);
    const parsedB = this.parseNZ(dateB);

    if (parsedA < parsedB) return -1;
    if (parsedA > parsedB) return 1;
    return 0;
  }

  /**
   * Adds/subtracts days from a NZ format date string
   * @param {string} dateStr - Date string in DD-MM-YYYY format
   * @param {number} days - Number of days to add (negative to subtract)
   * @returns {string} Result date string in DD-MM-YYYY format
   * @throws {ValidationError} If input date string is invalid
   */
  static addDaysNZ(dateStr, days) {
    const date = this.parseNZ(dateStr);
    date.setDate(date.getDate() + days);
    return this.formatNZ(date);
  }

  /**
   * Gets current date in NZ format
   * @returns {string} Current date in DD-MM-YYYY format
   */
  static getCurrentNZ() {
    return this.formatNZ(new Date());
  }

  /**
   * Calculates days between two NZ format dates
   * @param {string} startDate - Start date in DD-MM-YYYY format
   * @param {string} endDate - End date in DD-MM-YYYY format
   * @returns {number} Number of days between dates (positive if endDate is later)
   * @throws {ValidationError} If either date string is invalid
   */
  static daysBetweenNZ(startDate, endDate) {
    const start = this.parseNZ(startDate);
    const end = this.parseNZ(endDate);
    
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

/**
 * ID Generation Utilities
 */
export class IdUtils {
  /**
   * Generate a unique ID with specified prefix
   * @param {string} prefix - Entity type prefix
   * @returns {string} Generated ID
   */
  static generate(prefix) {
    const configPrefix = getConfigValue(`idPrefixes.${prefix}`, prefix);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${configPrefix}-${timestamp}-${random}`;
  }

  /**
   * Validate ID format
   * @param {string} id - ID to validate
   * @param {string} expectedPrefix - Expected prefix (optional)
   * @returns {boolean} Whether ID is valid
   */
  static isValid(id, expectedPrefix = null) {
    if (!id || typeof id !== 'string') {
      return false;
    }

    // Basic format check: prefix-timestamp-random
    const parts = id.split('-');
    if (parts.length !== 3) {
      return false;
    }

    const [prefix, timestamp, random] = parts;

    // Check prefix if specified
    if (expectedPrefix) {
      const configPrefix = getConfigValue(`idPrefixes.${expectedPrefix}`, expectedPrefix);
      if (prefix !== configPrefix) {
        return false;
      }
    }

    // Validate timestamp and random parts are numbers
    return !isNaN(Number(timestamp)) && !isNaN(Number(random));
  }

  /**
   * Extract prefix from ID
   * @param {string} id - ID to extract prefix from
   * @returns {string|null} Extracted prefix or null if invalid
   */
  static extractPrefix(id) {
    if (!this.isValid(id)) {
      return null;
    }

    return id.split('-')[0];
  }
}

/**
 * Validation Utilities
 */
export class ValidationUtils {
  /**
   * Validate string field
   * @param {string} value - Value to validate
   * @param {string} fieldName - Field name for error messages
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  static validateString(value, fieldName, options = {}) {
    const errors = [];
    
    // Required check
    if (options.required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
      errors.push(`${fieldName} is required`);
      return new ValidationResult(false, errors);
    }

    // Type check
    if (value && typeof value !== 'string') {
      errors.push(`${fieldName} must be a string`);
      return new ValidationResult(false, errors);
    }

    if (value) {
      // Length checks
      if (options.minLength && value.length < options.minLength) {
        errors.push(`${fieldName} must be at least ${options.minLength} characters`);
      }
      
      if (options.maxLength && value.length > options.maxLength) {
        errors.push(`${fieldName} must be no more than ${options.maxLength} characters`);
      }

      // Pattern check
      if (options.pattern && !options.pattern.test(value)) {
        errors.push(`${fieldName} does not match required format`);
      }
    }

    return new ValidationResult(errors.length === 0, errors);
  }

  /**
   * Validate numeric field
   * @param {number} value - Value to validate
   * @param {string} fieldName - Field name for error messages
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  static validateNumber(value, fieldName, options = {}) {
    const errors = [];

    // Required check
    if (options.required && (value === null || value === undefined)) {
      errors.push(`${fieldName} is required`);
      return new ValidationResult(false, errors);
    }

    // Type and finite check
    if (value !== null && value !== undefined) {
      if (typeof value !== 'number' || !isFinite(value)) {
        errors.push(`${fieldName} must be a valid number`);
        return new ValidationResult(false, errors);
      }

      // Range checks
      if (options.min !== undefined && value < options.min) {
        errors.push(`${fieldName} must be at least ${options.min}`);
      }

      if (options.max !== undefined && value > options.max) {
        errors.push(`${fieldName} must be no more than ${options.max}`);
      }

      // Integer check
      if (options.integer && !Number.isInteger(value)) {
        errors.push(`${fieldName} must be an integer`);
      }
    }

    return new ValidationResult(errors.length === 0, errors);
  }

  /**
   * Validate enum field
   * @param {*} value - Value to validate
   * @param {string} fieldName - Field name for error messages
   * @param {Array} allowedValues - Array of allowed values
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  static validateEnum(value, fieldName, allowedValues, options = {}) {
    const errors = [];

    // Required check
    if (options.required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldName} is required`);
      return new ValidationResult(false, errors);
    }

    // Enum check
    if (value !== null && value !== undefined && value !== '' && !allowedValues.includes(value)) {
      errors.push(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    }

    return new ValidationResult(errors.length === 0, errors);
  }

  /**
   * Validate date field in NZ format
   * @param {string} value - Date string to validate
   * @param {string} fieldName - Field name for error messages
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  static validateDate(value, fieldName, options = {}) {
    const errors = [];

    // Required check
    if (options.required && (!value || value.trim().length === 0)) {
      errors.push(`${fieldName} is required`);
      return new ValidationResult(false, errors);
    }

    if (value && value.trim().length > 0) {
      // Format validation
      if (!DateUtils.isValidNZ(value)) {
        errors.push(`${fieldName} must be in DD-MM-YYYY format`);
        return new ValidationResult(false, errors);
      }

      // Date range validation
      if (options.minDate) {
        try {
          if (DateUtils.compareNZ(value, options.minDate) < 0) {
            errors.push(`${fieldName} must be on or after ${options.minDate}`);
          }
        } catch (e) {
          errors.push(`Invalid minimum date specified for ${fieldName}`);
        }
      }

      if (options.maxDate) {
        try {
          if (DateUtils.compareNZ(value, options.maxDate) > 0) {
            errors.push(`${fieldName} must be on or before ${options.maxDate}`);
          }
        } catch (e) {
          errors.push(`Invalid maximum date specified for ${fieldName}`);
        }
      }
    }

    return new ValidationResult(errors.length === 0, errors);
  }
}

/**
 * Error Classes
 */
export class RoadmapError extends Error {
  constructor(message, code = null, details = null) {
    super(message);
    this.name = 'RoadmapError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends RoadmapError {
  constructor(message, field = null, value = null) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

export class NotFoundError extends RoadmapError {
  constructor(entityType, entityId) {
    super(`${entityType} with ID '${entityId}' not found`, 'NOT_FOUND', { entityType, entityId });
    this.name = 'NotFoundError';
    this.entityType = entityType;
    this.entityId = entityId;
  }
}

export class ConflictError extends RoadmapError {
  constructor(message, conflictingEntity = null) {
    super(message, 'CONFLICT', { conflictingEntity });
    this.name = 'ConflictError';
    this.conflictingEntity = conflictingEntity;
  }
}

/**
 * Validation Result Class
 */
export class ValidationResult {
  constructor(isValid, errors = []) {
    this.isValid = isValid;
    this.errors = Array.isArray(errors) ? errors : [errors];
  }

  /**
   * Add error to validation result
   * @param {string} error - Error message
   */
  addError(error) {
    this.errors.push(error);
    this.isValid = false;
  }

  /**
   * Combine with another validation result
   * @param {ValidationResult} other - Other validation result
   * @returns {ValidationResult} Combined result
   */
  combine(other) {
    return new ValidationResult(
      this.isValid && other.isValid,
      [...this.errors, ...other.errors]
    );
  }

  /**
   * Throw ValidationError if invalid
   * @param {string} context - Context for the error
   * @throws {ValidationError} If validation failed
   */
  throwIfInvalid(context = 'Validation') {
    if (!this.isValid) {
      throw new ValidationError(`${context} failed: ${this.errors.join(', ')}`);
    }
  }
}

/**
 * General Utility Functions
 */

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Deep cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Check if object is empty
 * @param {*} obj - Object to check
 * @returns {boolean} Whether object is empty
 */
export function isEmpty(obj) {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
}

/**
 * Sanitize string for safe usage
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML brackets
    .substring(0, 10000); // Limit length
}

/**
 * Format currency value
 * @param {number} cents - Value in cents
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
export function formatCurrency(cents, currency = 'NZD') {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: currency
  }).format(dollars);
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export everything for backwards compatibility
export default {
  DateUtils,
  IdUtils,
  ValidationUtils,
  ValidationResult,
  RoadmapError,
  ValidationError,
  NotFoundError,
  ConflictError,
  deepClone,
  isEmpty,
  sanitizeString,
  formatCurrency,
  debounce
};