/**
 * Error Handler System
 * 
 * Provides centralized error management with categorization, user-friendly messages,
 * recovery strategies, and integration with the logging and event systems.
 */

import { logger } from './logger.js';
import { eventBus, AppEvents } from './event-bus.js';
import { configManager } from './config-manager.js';

export const ErrorCategory = {
  VALIDATION: 'validation',
  NETWORK: 'network', 
  STORAGE: 'storage',
  PERMISSION: 'permission',
  BUSINESS_LOGIC: 'business_logic',
  SYSTEM: 'system',
  USER_INPUT: 'user_input',
  CONFIGURATION: 'configuration'
};

export const ErrorSeverity = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

export default class ErrorHandler {
  constructor(options = {}) {
    this.logger = options.logger || logger;
    this.eventBus = options.eventBus || eventBus;
    this.showUserMessages = options.showUserMessages !== false;
    this.autoReportCritical = options.autoReportCritical !== false;
    
    // Error message templates
    this.messageTemplates = new Map();
    this._initializeMessageTemplates();
    
    // Recovery strategies
    this.recoveryStrategies = new Map();
    this._initializeRecoveryStrategies();
    
    // Error statistics
    this.statistics = {
      total: 0,
      byCategory: new Map(),
      bySeverity: new Map(),
      recent: []
    };
  }

  /**
   * Handle an error with full processing
   * @param {Error|string} error - Error to handle
   * @param {Object} context - Additional context about the error
   * @param {string} context.category - Error category
   * @param {number} context.severity - Error severity (1-4)
   * @param {string} context.operation - Operation that failed
   * @param {Object} context.data - Additional data for debugging
   * @param {boolean} context.userFriendly - Whether to show user-friendly message
   * @param {string} context.userMessage - Custom user message
   * @returns {Object} Processed error information
   */
  handle(error, context = {}) {
    // Normalize error to Error object
    const normalizedError = this._normalizeError(error);
    
    // Create error record
    const errorRecord = this._createErrorRecord(normalizedError, context);
    
    // Update statistics
    this._updateStatistics(errorRecord);
    
    // Log the error
    this._logError(errorRecord);
    
    // Emit error event
    this._emitErrorEvent(errorRecord);
    
    // Show user message if enabled
    if (this.showUserMessages && context.userFriendly !== false) {
      this._showUserMessage(errorRecord);
    }
    
    // Attempt recovery if strategy exists
    const recoveryResult = this._attemptRecovery(errorRecord);
    
    // Report critical errors
    if (errorRecord.severity >= ErrorSeverity.CRITICAL && this.autoReportCritical) {
      this._reportCriticalError(errorRecord);
    }
    
    return {
      id: errorRecord.id,
      handled: true,
      recovered: recoveryResult.recovered,
      userMessage: errorRecord.userMessage,
      recoveryAction: recoveryResult.action
    };
  }

  /**
   * Handle validation errors specifically
   * @param {Object} validationErrors - Object with field errors
   * @param {string} context - Context about what was being validated
   * @returns {Object} Processed validation error
   */
  handleValidation(validationErrors, context = 'form validation') {
    const error = new Error(`Validation failed: ${context}`);
    error.validation = validationErrors;
    
    return this.handle(error, {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      operation: context,
      data: { validationErrors },
      userFriendly: true
    });
  }

  /**
   * Handle network errors specifically
   * @param {Error} error - Network error
   * @param {Object} context - Request context
   * @returns {Object} Processed network error
   */
  handleNetwork(error, context = {}) {
    const category = ErrorCategory.NETWORK;
    const severity = context.critical ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    
    return this.handle(error, {
      category,
      severity,
      operation: context.operation || 'network request',
      data: {
        url: context.url,
        method: context.method,
        status: context.status,
        timeout: context.timeout
      },
      userFriendly: true
    });
  }

  /**
   * Handle storage errors specifically  
   * @param {Error} error - Storage error
   * @param {Object} context - Storage context
   * @returns {Object} Processed storage error
   */
  handleStorage(error, context = {}) {
    const severity = context.dataLoss ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH;
    
    return this.handle(error, {
      category: ErrorCategory.STORAGE,
      severity,
      operation: context.operation || 'storage operation',
      data: {
        storageType: context.storageType || 'localStorage',
        key: context.key,
        action: context.action
      },
      userFriendly: true
    });
  }

  /**
   * Create a user-friendly error boundary for functions
   * @param {Function} fn - Function to wrap
   * @param {Object} context - Error context for this function
   * @returns {Function} Wrapped function
   */
  withErrorBoundary(fn, context = {}) {
    return (...args) => {
      try {
        const result = fn(...args);
        
        // Handle promises
        if (result && typeof result.then === 'function') {
          return result.catch(error => {
            this.handle(error, {
              ...context,
              operation: context.operation || fn.name || 'async operation'
            });
            throw error; // Re-throw unless recovery handled it
          });
        }
        
        return result;
      } catch (error) {
        const handled = this.handle(error, {
          ...context,
          operation: context.operation || fn.name || 'operation'
        });
        
        // Re-throw unless recovery handled it successfully
        if (!handled.recovered) {
          throw error;
        }
        
        return handled.recoveryResult;
      }
    };
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      byCategory: Object.fromEntries(this.statistics.byCategory),
      bySeverity: Object.fromEntries(this.statistics.bySeverity)
    };
  }

  /**
   * Clear error statistics
   */
  clearStatistics() {
    this.statistics = {
      total: 0,
      byCategory: new Map(),
      bySeverity: new Map(),
      recent: []
    };
  }

  /**
   * Register a custom error message template
   * @param {string} category - Error category
   * @param {Function|string} template - Message template
   */
  registerMessageTemplate(category, template) {
    this.messageTemplates.set(category, template);
  }

  /**
   * Register a custom recovery strategy
   * @param {string} category - Error category
   * @param {Function} strategy - Recovery function
   */
  registerRecoveryStrategy(category, strategy) {
    this.recoveryStrategies.set(category, strategy);
  }

  /**
   * Normalize error to Error object
   * @private
   * @param {*} error - Error to normalize
   * @returns {Error} Normalized Error object
   */
  _normalizeError(error) {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    if (typeof error === 'object' && error !== null) {
      const err = new Error(error.message || 'Unknown error');
      Object.assign(err, error);
      return err;
    }
    
    return new Error('Unknown error occurred');
  }

  /**
   * Create detailed error record
   * @private
   * @param {Error} error - Normalized error
   * @param {Object} context - Error context
   * @returns {Object} Error record
   */
  _createErrorRecord(error, context) {
    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      name: error.name,
      message: error.message,
      stack: error.stack,
      category: context.category || ErrorCategory.SYSTEM,
      severity: context.severity || ErrorSeverity.MEDIUM,
      operation: context.operation || 'unknown',
      data: context.data || {},
      userMessage: context.userMessage || this._generateUserMessage(error, context),
      url: typeof window !== 'undefined' ? window.location?.href : null,
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'Node.js',
      validation: error.validation || null
    };
  }

  /**
   * Generate user-friendly error message
   * @private
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   * @returns {string} User-friendly message
   */
  _generateUserMessage(error, context) {
    if (!configManager.get('errors.user_friendly_messages', true)) {
      return error.message;
    }

    const template = this.messageTemplates.get(context.category);
    
    if (typeof template === 'function') {
      return template(error, context);
    }
    
    if (typeof template === 'string') {
      return template;
    }
    
    // Default user-friendly messages by category
    switch (context.category) {
      case ErrorCategory.VALIDATION:
        return 'Please check the information you entered and try again.';
      case ErrorCategory.NETWORK:
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case ErrorCategory.STORAGE:
        return 'Unable to save your data. Please try again or contact support if the problem continues.';
      case ErrorCategory.PERMISSION:
        return 'You do not have permission to perform this action.';
      case ErrorCategory.USER_INPUT:
        return 'There was a problem with the information provided. Please review and try again.';
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem continues.';
    }
  }

  /**
   * Update error statistics
   * @private
   * @param {Object} errorRecord - Error record
   */
  _updateStatistics(errorRecord) {
    this.statistics.total++;
    
    // Update category statistics
    const categoryCount = this.statistics.byCategory.get(errorRecord.category) || 0;
    this.statistics.byCategory.set(errorRecord.category, categoryCount + 1);
    
    // Update severity statistics
    const severityCount = this.statistics.bySeverity.get(errorRecord.severity) || 0;
    this.statistics.bySeverity.set(errorRecord.severity, severityCount + 1);
    
    // Update recent errors (keep last 50)
    this.statistics.recent.push({
      id: errorRecord.id,
      timestamp: errorRecord.timestamp,
      category: errorRecord.category,
      severity: errorRecord.severity,
      message: errorRecord.message
    });
    
    if (this.statistics.recent.length > 50) {
      this.statistics.recent = this.statistics.recent.slice(-50);
    }
  }

  /**
   * Log the error
   * @private
   * @param {Object} errorRecord - Error record
   */
  _logError(errorRecord) {
    const logData = {
      errorId: errorRecord.id,
      category: errorRecord.category,
      severity: errorRecord.severity,
      operation: errorRecord.operation,
      data: errorRecord.data
    };

    switch (errorRecord.severity) {
      case ErrorSeverity.LOW:
        this.logger.info(`Error: ${errorRecord.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(`Error: ${errorRecord.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        this.logger.error(new Error(errorRecord.message), logData);
        break;
    }
  }

  /**
   * Emit error event
   * @private
   * @param {Object} errorRecord - Error record
   */
  _emitErrorEvent(errorRecord) {
    this.eventBus.emit(AppEvents.ERROR_OCCURRED, {
      id: errorRecord.id,
      category: errorRecord.category,
      severity: errorRecord.severity,
      message: errorRecord.message,
      operation: errorRecord.operation,
      userMessage: errorRecord.userMessage
    });
  }

  /**
   * Show user message
   * @private
   * @param {Object} errorRecord - Error record
   */
  _showUserMessage(errorRecord) {
    // This would be implemented based on the UI framework being used
    // For now, we'll emit a UI event
    this.eventBus.emit(AppEvents.UI_ERROR_SHOWN, {
      id: errorRecord.id,
      message: errorRecord.userMessage,
      severity: errorRecord.severity,
      category: errorRecord.category
    });
  }

  /**
   * Attempt error recovery
   * @private
   * @param {Object} errorRecord - Error record
   * @returns {Object} Recovery result
   */
  _attemptRecovery(errorRecord) {
    const strategy = this.recoveryStrategies.get(errorRecord.category);
    
    if (typeof strategy === 'function') {
      try {
        const result = strategy(errorRecord);
        return {
          recovered: true,
          action: result.action || 'automatic recovery',
          result: result.data
        };
      } catch (recoveryError) {
        this.logger.warn('Recovery strategy failed', { 
          originalError: errorRecord.id,
          recoveryError: recoveryError.message 
        });
      }
    }
    
    return {
      recovered: false,
      action: null,
      result: null
    };
  }

  /**
   * Report critical error
   * @private
   * @param {Object} errorRecord - Error record
   */
  _reportCriticalError(errorRecord) {
    // In a real application, this would send the error to a monitoring service
    this.logger.error('Critical error reported', {
      errorId: errorRecord.id,
      message: errorRecord.message,
      stack: errorRecord.stack,
      context: errorRecord.data
    });
  }

  /**
   * Initialize default message templates
   * @private
   */
  _initializeMessageTemplates() {
    // Templates can be functions that generate dynamic messages
    this.messageTemplates.set(ErrorCategory.VALIDATION, (error, context) => {
      if (error.validation && Object.keys(error.validation).length > 0) {
        const fieldErrors = Object.entries(error.validation)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ');
        return `Please correct the following: ${fieldErrors}`;
      }
      return 'Please check the information you entered and try again.';
    });
  }

  /**
   * Initialize default recovery strategies
   * @private
   */
  _initializeRecoveryStrategies() {
    // Storage error recovery - clear corrupt data
    this.recoveryStrategies.set(ErrorCategory.STORAGE, (errorRecord) => {
      if (errorRecord.data.action === 'load' && errorRecord.message.includes('corrupt')) {
        try {
          localStorage.removeItem(errorRecord.data.key);
          return {
            action: 'cleared corrupt data',
            data: null
          };
        } catch {
          // Recovery failed
        }
      }
      throw new Error('No recovery strategy available');
    });
  }
}

// Create default error handler instance
const errorHandler = new ErrorHandler();

// Set up global error handling
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.handle(event.error || event.message, {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      operation: 'global error handler',
      data: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handle(event.reason, {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      operation: 'unhandled promise rejection',
      userFriendly: true
    });
  });
}

export { ErrorHandler, errorHandler };