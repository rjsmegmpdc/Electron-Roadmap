/**
 * Tests for ErrorHandler
 * 
 * Tests the error handling system including error categorization, user-friendly messages,
 * recovery strategies, and integration with logging and event systems.
 */

import { ErrorHandler, ErrorCategory, ErrorSeverity, errorHandler } from '../../src/js/error-handler.js';

// Mock dependencies
jest.mock('../../src/js/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../src/js/event-bus.js', () => ({
  eventBus: {
    emit: jest.fn()
  },
  AppEvents: {
    ERROR_OCCURRED: 'error.occurred',
    UI_ERROR_SHOWN: 'ui.error.shown'
  }
}));

jest.mock('../../src/js/config-manager.js', () => ({
  configManager: {
    get: jest.fn((key, defaultValue) => {
      const config = {
        'errors.user_friendly_messages': true,
        'errors.max_stack_trace_length': 1000
      };
      return config[key] ?? defaultValue;
    })
  }
}));

import { logger } from '../../src/js/logger.js';
import { eventBus, AppEvents } from '../../src/js/event-bus.js';

describe('ErrorHandler', () => {
  let testErrorHandler;
  let mockLogger;
  let mockEventBus;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock dependencies
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    
    mockEventBus = {
      emit: jest.fn()
    };
    
    // Create test error handler
    testErrorHandler = new ErrorHandler({
      logger: mockLogger,
      eventBus: mockEventBus
    });
  });

  describe('Basic Error Handling', () => {
    test('should handle string errors', () => {
      const result = testErrorHandler.handle('Test error message');
      
      expect(result.handled).toBe(true);
      expect(result.userMessage).toContain('error occurred');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    test('should handle Error objects', () => {
      const error = new Error('Test error');
      const result = testErrorHandler.handle(error, {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH
      });
      
      expect(result.handled).toBe(true);
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockEventBus.emit).toHaveBeenCalledWith(AppEvents.ERROR_OCCURRED, expect.any(Object));
    });

    test('should handle custom error context', () => {
      const result = testErrorHandler.handle('Test error', {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        operation: 'form-submission',
        data: { field: 'email' },
        userMessage: 'Custom user message'
      });
      
      expect(result.userMessage).toBe('Custom user message');
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('Error Categorization', () => {
    test('should handle validation errors', () => {
      const validationErrors = {
        email: 'Invalid email format',
        password: 'Password too short'
      };
      
      const result = testErrorHandler.handleValidation(validationErrors, 'user registration');
      
      expect(result.handled).toBe(true);
      expect(result.userMessage).toContain('correct the following');
      expect(result.userMessage).toContain('email: Invalid email format');
    });

    test('should handle network errors', () => {
      const networkError = new Error('Network timeout');
      const result = testErrorHandler.handleNetwork(networkError, {
        url: 'https://api.example.com',
        method: 'POST',
        status: 500
      });
      
      expect(result.handled).toBe(true);
      expect(result.userMessage).toContain('connect to the server');
    });

    test('should handle storage errors', () => {
      const storageError = new Error('localStorage quota exceeded');
      const result = testErrorHandler.handleStorage(storageError, {
        key: 'userData',
        action: 'save',
        dataLoss: true
      });
      
      expect(result.handled).toBe(true);
      expect(result.userMessage).toContain('save your data');
      // Should be critical due to dataLoss: true
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Severity Levels', () => {
    test('should use appropriate log level for error severity', () => {
      // Low severity
      testErrorHandler.handle('Low severity error', { severity: ErrorSeverity.LOW });
      expect(mockLogger.info).toHaveBeenCalled();
      
      // Medium severity  
      jest.clearAllMocks();
      testErrorHandler.handle('Medium severity error', { severity: ErrorSeverity.MEDIUM });
      expect(mockLogger.warn).toHaveBeenCalled();
      
      // High severity
      jest.clearAllMocks();
      testErrorHandler.handle('High severity error', { severity: ErrorSeverity.HIGH });
      expect(mockLogger.error).toHaveBeenCalled();
      
      // Critical severity
      jest.clearAllMocks();
      testErrorHandler.handle('Critical error', { severity: ErrorSeverity.CRITICAL });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('User-Friendly Messages', () => {
    test('should generate category-specific user messages', () => {
      const testCases = [
        { category: ErrorCategory.VALIDATION, expected: 'check the information' },
        { category: ErrorCategory.NETWORK, expected: 'connect to the server' },
        { category: ErrorCategory.STORAGE, expected: 'save your data' },
        { category: ErrorCategory.PERMISSION, expected: 'permission' },
        { category: ErrorCategory.USER_INPUT, expected: 'information provided' }
      ];
      
      testCases.forEach(({ category, expected }) => {
        const result = testErrorHandler.handle('Test error', { category });
        expect(result.userMessage.toLowerCase()).toContain(expected);
      });
    });

    test('should use custom message templates', () => {
      testErrorHandler.registerMessageTemplate(ErrorCategory.SYSTEM, 'Custom system error message');
      
      const result = testErrorHandler.handle('System error', { 
        category: ErrorCategory.SYSTEM 
      });
      
      expect(result.userMessage).toBe('Custom system error message');
    });

    test('should use dynamic message templates', () => {
      const dynamicTemplate = (error, context) => {
        return `Operation '${context.operation}' failed: ${error.message}`;
      };
      
      testErrorHandler.registerMessageTemplate(ErrorCategory.BUSINESS_LOGIC, dynamicTemplate);
      
      const result = testErrorHandler.handle('Business rule violation', {
        category: ErrorCategory.BUSINESS_LOGIC,
        operation: 'create-project'
      });
      
      expect(result.userMessage).toBe("Operation 'create-project' failed: Business rule violation");
    });
  });

  describe('Recovery Strategies', () => {
    test('should attempt recovery when strategy exists', () => {
      const mockRecoveryStrategy = jest.fn(() => ({
        action: 'cleared corrupt data',
        data: null
      }));
      
      testErrorHandler.registerRecoveryStrategy(ErrorCategory.STORAGE, mockRecoveryStrategy);
      
      const result = testErrorHandler.handle('Storage error', {
        category: ErrorCategory.STORAGE
      });
      
      expect(mockRecoveryStrategy).toHaveBeenCalled();
      expect(result.recovered).toBe(true);
      expect(result.recoveryAction).toBe('cleared corrupt data');
    });

    test('should handle recovery strategy failures', () => {
      const failingStrategy = jest.fn(() => {
        throw new Error('Recovery failed');
      });
      
      testErrorHandler.registerRecoveryStrategy(ErrorCategory.STORAGE, failingStrategy);
      
      const result = testErrorHandler.handle('Storage error', {
        category: ErrorCategory.STORAGE
      });
      
      expect(result.recovered).toBe(false);
      expect(result.recoveryAction).toBeNull();
    });
  });

  describe('Error Statistics', () => {
    test('should track error statistics', () => {
      testErrorHandler.handle('Error 1', { category: ErrorCategory.VALIDATION });
      testErrorHandler.handle('Error 2', { category: ErrorCategory.VALIDATION });
      testErrorHandler.handle('Error 3', { category: ErrorCategory.NETWORK });
      
      const stats = testErrorHandler.getStatistics();
      
      expect(stats.total).toBe(3);
      expect(stats.byCategory[ErrorCategory.VALIDATION]).toBe(2);
      expect(stats.byCategory[ErrorCategory.NETWORK]).toBe(1);
      expect(stats.recent).toHaveLength(3);
    });

    test('should clear error statistics', () => {
      testErrorHandler.handle('Error 1');
      expect(testErrorHandler.getStatistics().total).toBe(1);
      
      testErrorHandler.clearStatistics();
      expect(testErrorHandler.getStatistics().total).toBe(0);
    });

    test('should limit recent errors to 50', () => {
      // Add more than 50 errors
      for (let i = 0; i < 60; i++) {
        testErrorHandler.handle(`Error ${i}`);
      }
      
      const stats = testErrorHandler.getStatistics();
      expect(stats.recent).toHaveLength(50);
      expect(stats.recent[49].message).toBe('Error 59'); // Most recent
    });
  });

  describe('Error Boundary', () => {
    test('should wrap functions with error boundary', () => {
      const testFunction = (x, y) => {
        if (x < 0) throw new Error('Negative input');
        return x + y;
      };
      
      const wrappedFunction = testErrorHandler.withErrorBoundary(testFunction, {
        operation: 'addition'
      });
      
      // Should work normally for valid input
      expect(wrappedFunction(2, 3)).toBe(5);
      
      // Should handle errors
      expect(() => wrappedFunction(-1, 3)).toThrow('Negative input');
      expect(mockLogger.warn).toHaveBeenCalled(); // Default severity is MEDIUM
    });

    test('should handle async function errors', async () => {
      const asyncFunction = async (shouldFail) => {
        if (shouldFail) throw new Error('Async error');
        return 'success';
      };
      
      const wrappedFunction = testErrorHandler.withErrorBoundary(asyncFunction);
      
      // Should work normally
      await expect(wrappedFunction(false)).resolves.toBe('success');
      
      // Should handle async errors
      await expect(wrappedFunction(true)).rejects.toThrow('Async error');
    });
  });

  describe('Event Integration', () => {
    test('should emit error events', () => {
      testErrorHandler.handle('Test error', {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH
      });
      
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        AppEvents.ERROR_OCCURRED,
        expect.objectContaining({
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.HIGH,
          message: 'Test error'
        })
      );
    });

    test('should emit UI error events for user-friendly errors', () => {
      testErrorHandler.handle('User error', {
        userFriendly: true,
        severity: ErrorSeverity.HIGH
      });
      
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        AppEvents.UI_ERROR_SHOWN,
        expect.objectContaining({
          severity: ErrorSeverity.HIGH
        })
      );
    });
  });

  describe('Critical Error Reporting', () => {
    test('should automatically report critical errors', () => {
      testErrorHandler.handle('Critical system failure', {
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.SYSTEM
      });
      
      // Should log as critical error
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Critical error reported',
        expect.any(Object)
      );
    });

    test('should not auto-report when disabled', () => {
      const noReportHandler = new ErrorHandler({ 
        logger: mockLogger,
        autoReportCritical: false 
      });
      
      noReportHandler.handle('Critical error', {
        severity: ErrorSeverity.CRITICAL
      });
      
      expect(mockLogger.error).toHaveBeenCalledTimes(1); // Only the main error log, not the report
    });
  });
});

describe('Global Error Handler', () => {
  test('should export singleton error handler', () => {
    expect(errorHandler).toBeInstanceOf(ErrorHandler);
  });
  
  test('should handle various input types', () => {
    // Test with different error types
    expect(() => errorHandler.handle('string error')).not.toThrow();
    expect(() => errorHandler.handle(new Error('error object'))).not.toThrow();
    expect(() => errorHandler.handle({ message: 'object error' })).not.toThrow();
  });
});

describe('Error Categories and Severities', () => {
  test('should export error category constants', () => {
    expect(ErrorCategory.VALIDATION).toBe('validation');
    expect(ErrorCategory.NETWORK).toBe('network');
    expect(ErrorCategory.STORAGE).toBe('storage');
    expect(ErrorCategory.PERMISSION).toBe('permission');
    expect(ErrorCategory.BUSINESS_LOGIC).toBe('business_logic');
    expect(ErrorCategory.SYSTEM).toBe('system');
    expect(ErrorCategory.USER_INPUT).toBe('user_input');
    expect(ErrorCategory.CONFIGURATION).toBe('configuration');
  });

  test('should export error severity constants', () => {
    expect(ErrorSeverity.LOW).toBe(1);
    expect(ErrorSeverity.MEDIUM).toBe(2);
    expect(ErrorSeverity.HIGH).toBe(3);
    expect(ErrorSeverity.CRITICAL).toBe(4);
  });
});