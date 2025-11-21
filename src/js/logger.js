/**
 * Logger System
 * 
 * Provides centralized logging with different log levels, formatting,
 * and persistence capabilities. Integrates with ConfigManager for
 * environment-specific log level configuration.
 */

import { configManager } from './config-manager.js';

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  OFF: 999
};

export default class Logger {
  constructor(name = 'App', options = {}) {
    this.name = name;
    this.history = [];
    this.maxHistorySize = options.maxHistorySize || 1000;
    this.persistLogs = options.persistLogs !== false;
    this.remoteLogging = options.remoteLogging || null;
    
    // Get log level from config manager
    this.logLevel = this._getConfiguredLogLevel();
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {...*} args - Additional arguments
   */
  debug(message, ...args) {
    this._log(LogLevel.DEBUG, message, args);
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {...*} args - Additional arguments
   */
  info(message, ...args) {
    this._log(LogLevel.INFO, message, args);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {...*} args - Additional arguments
   */
  warn(message, ...args) {
    this._log(LogLevel.WARN, message, args);
  }

  /**
   * Log error message
   * @param {string|Error} message - Log message or Error object
   * @param {...*} args - Additional arguments
   */
  error(message, ...args) {
    // Handle Error objects specially
    if (message instanceof Error) {
      const errorInfo = {
        name: message.name,
        message: message.message,
        stack: this._formatStackTrace(message.stack),
        ...args[0] // Allow additional context as first argument
      };
      this._log(LogLevel.ERROR, `${message.name}: ${message.message}`, [errorInfo]);
    } else {
      this._log(LogLevel.ERROR, message, args);
    }
  }

  /**
   * Log a performance measurement
   * @param {string} operation - Name of the operation
   * @param {number} duration - Duration in milliseconds
   * @param {Object} context - Additional context
   */
  performance(operation, duration, context = {}) {
    const message = `Performance: ${operation} completed in ${duration}ms`;
    this._log(LogLevel.INFO, message, [{ operation, duration, ...context }]);
  }

  /**
   * Create a performance timer
   * @param {string} operation - Name of the operation
   * @returns {Function} Function to call when operation completes
   */
  timer(operation) {
    const startTime = performance.now();
    
    return (context = {}) => {
      const duration = performance.now() - startTime;
      this.performance(operation, duration, context);
      return duration;
    };
  }

  /**
   * Log user action for audit trail
   * @param {string} action - Action performed
   * @param {Object} context - Context about the action
   */
  audit(action, context = {}) {
    const auditData = {
      action,
      timestamp: new Date().toISOString(),
      user: context.user || 'anonymous',
      ...context
    };
    this._log(LogLevel.INFO, `Audit: ${action}`, [auditData]);
  }

  /**
   * Set the log level
   * @param {number} level - Log level from LogLevel enum
   */
  setLogLevel(level) {
    if (!Object.values(LogLevel).includes(level)) {
      throw new Error('Invalid log level');
    }
    this.logLevel = level;
  }

  /**
   * Get current log level
   * @returns {number} Current log level
   */
  getLogLevel() {
    return this.logLevel;
  }

  /**
   * Clear log history
   */
  clearHistory() {
    this.history = [];
    this._persistHistory();
  }

  /**
   * Get log history
   * @param {number} limit - Maximum number of entries to return
   * @param {number} level - Minimum log level to include
   * @returns {Array} Array of log entries
   */
  getHistory(limit = 100, level = LogLevel.DEBUG) {
    return this.history
      .filter(entry => entry.level >= level)
      .slice(-limit);
  }

  /**
   * Export logs as JSON string
   * @param {number} limit - Maximum number of entries
   * @returns {string} JSON string of log entries
   */
  exportLogs(limit = 1000) {
    const logs = this.getHistory(limit);
    return JSON.stringify({
      logger: this.name,
      exported: new Date().toISOString(),
      count: logs.length,
      logs
    }, null, 2);
  }

  /**
   * Group related log messages
   * @param {string} label - Group label
   * @returns {Object} Group methods
   */
  group(label) {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this._log(LogLevel.INFO, `▼ ${label}`, [{ groupId, action: 'group_start' }]);
    
    return {
      debug: (message, ...args) => this._log(LogLevel.DEBUG, `  ${message}`, args, groupId),
      info: (message, ...args) => this._log(LogLevel.INFO, `  ${message}`, args, groupId),
      warn: (message, ...args) => this._log(LogLevel.WARN, `  ${message}`, args, groupId),
      error: (message, ...args) => this._log(LogLevel.ERROR, `  ${message}`, args, groupId),
      end: () => this._log(LogLevel.INFO, `▲ ${label} (end)`, [{ groupId, action: 'group_end' }])
    };
  }

  /**
   * Core logging method
   * @private
   * @param {number} level - Log level
   * @param {string} message - Log message
   * @param {Array} args - Additional arguments
   * @param {string} groupId - Optional group ID
   */
  _log(level, message, args = [], groupId = null) {
    // Check if this level should be logged
    if (level < this.logLevel) {
      return;
    }

    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      levelName: this._getLevelName(level),
      logger: this.name,
      message,
      args: this._sanitizeArgs(args),
      groupId,
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'Node.js',
      url: typeof window !== 'undefined' ? window.location?.href : null
    };

    // Add to history
    this.history.push(entry);
    
    // Maintain history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }

    // Output to console
    this._outputToConsole(entry);

    // Persist if enabled
    if (this.persistLogs) {
      this._persistHistory();
    }

    // Send to remote logging if configured
    if (this.remoteLogging && level >= LogLevel.ERROR) {
      this._sendToRemoteLogging(entry);
    }
  }

  /**
   * Output log entry to console
   * @private
   * @param {Object} entry - Log entry
   */
  _outputToConsole(entry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.levelName}] [${entry.logger}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, ...entry.args);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, ...entry.args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, ...entry.args);
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, ...entry.args);
        break;
    }
  }

  /**
   * Get log level name
   * @private
   * @param {number} level - Log level number
   * @returns {string} Level name
   */
  _getLevelName(level) {
    switch (level) {
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.ERROR: return 'ERROR';
      default: return 'UNKNOWN';
    }
  }

  /**
   * Get configured log level from config manager
   * @private
   * @returns {number} Configured log level
   */
  _getConfiguredLogLevel() {
    const levelName = configManager.get('logging.level', 'info').toLowerCase();
    
    switch (levelName) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      case 'off': return LogLevel.OFF;
      default: return LogLevel.INFO;
    }
  }

  /**
   * Sanitize arguments for storage
   * @private
   * @param {Array} args - Arguments to sanitize
   * @returns {Array} Sanitized arguments
   */
  _sanitizeArgs(args) {
    return args.map(arg => {
      if (arg === null || arg === undefined) {
        return arg;
      }
      
      if (typeof arg === 'object') {
        try {
          // Create a safe copy of the object without circular references
          return JSON.parse(JSON.stringify(arg));
        } catch {
          return '[Circular Reference]';
        }
      }
      
      if (typeof arg === 'function') {
        return '[Function]';
      }
      
      return arg;
    });
  }

  /**
   * Format stack trace for better readability
   * @private
   * @param {string} stack - Stack trace string
   * @returns {string} Formatted stack trace
   */
  _formatStackTrace(stack) {
    if (!stack) return '';
    
    const maxLength = configManager.get('errors.max_stack_trace_length', 1000);
    return stack.length > maxLength ? stack.substring(0, maxLength) + '...' : stack;
  }

  /**
   * Persist log history to localStorage
   * @private
   */
  _persistHistory() {
    try {
      const storageKey = `logger_${this.name}_history`;
      const recentHistory = this.history.slice(-100); // Keep only recent entries
      localStorage.setItem(storageKey, JSON.stringify(recentHistory));
    } catch (error) {
      // Fail silently if localStorage is not available
    }
  }

  /**
   * Load log history from localStorage
   * @private
   */
  _loadHistory() {
    try {
      const storageKey = `logger_${this.name}_history`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      // Fail silently if localStorage is not available or data is corrupt
      this.history = [];
    }
  }

  /**
   * Send log entry to remote logging service
   * @private
   * @param {Object} entry - Log entry
   */
  _sendToRemoteLogging(entry) {
    if (!this.remoteLogging || typeof this.remoteLogging !== 'function') {
      return;
    }

    try {
      this.remoteLogging(entry);
    } catch (error) {
      // Don't log this error to avoid infinite recursion
      console.warn('Failed to send log to remote service:', error.message);
    }
  }
}

// Create default logger instance
const logger = new Logger('App');

// Load existing history
if (typeof window !== 'undefined') {
  logger._loadHistory();
}

export { Logger, logger };

// Utility functions for common logging patterns
export const createLogger = (name, options) => new Logger(name, options);

export const withLogging = (fn, logger, operation) => {
  return (...args) => {
    const timer = logger.timer(operation || fn.name || 'operation');
    
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result
          .then(res => {
            timer();
            return res;
          })
          .catch(err => {
            timer({ error: true });
            logger.error(err);
            throw err;
          });
      }
      
      timer();
      return result;
    } catch (error) {
      timer({ error: true });
      logger.error(error);
      throw error;
    }
  };
};