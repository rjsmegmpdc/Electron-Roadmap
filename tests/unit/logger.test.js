/**
 * Tests for Logger
 * 
 * Tests the logging system including different log levels, performance timing,
 * audit logging, and log persistence.
 */

import { Logger, LogLevel, logger, createLogger, withLogging } from '../../src/js/logger.js';

// Mock configManager for testing
jest.mock('../../src/js/config-manager.js', () => ({
  configManager: {
    get: jest.fn((key, defaultValue) => {
      const config = {
        'logging.level': 'debug',
        'errors.max_stack_trace_length': 1000,
        'errors.user_friendly_messages': true
      };
      return config[key] ?? defaultValue;
    })
  }
}));

describe('Logger', () => {
  let testLogger;
  let consoleSpy;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Create test logger
    testLogger = new Logger('TestLogger');
    
    // Spy on console methods
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation()
    };
  });

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('Basic Logging', () => {
    test('should log debug messages', () => {
      testLogger.debug('Debug message', { data: 'test' });
      
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] [TestLogger]'),
        'Debug message',
        { data: 'test' }
      );
    });

    test('should log info messages', () => {
      testLogger.info('Info message');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [TestLogger]'),
        'Info message'
      );
    });

    test('should log warning messages', () => {
      testLogger.warn('Warning message');
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] [TestLogger]'),
        'Warning message'
      );
    });

    test('should log error messages', () => {
      testLogger.error('Error message');
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] [TestLogger]'),
        'Error message'
      );
    });

    test('should handle Error objects', () => {
      const error = new Error('Test error');
      error.code = 'TEST_ERROR';
      
      testLogger.error(error, { context: 'test' });
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] [TestLogger]'),
        'Error: Test error',
        expect.objectContaining({
          name: 'Error',
          message: 'Test error',
          context: 'test'
        })
      );
    });
  });

  describe('Log Levels', () => {
    test('should respect log level filtering', () => {
      testLogger.setLogLevel(LogLevel.WARN);
      
      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warning message');
      testLogger.error('Error message');
      
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    test('should throw error for invalid log level', () => {
      expect(() => testLogger.setLogLevel('invalid')).toThrow();
      expect(() => testLogger.setLogLevel(null)).toThrow();
      expect(() => testLogger.setLogLevel(undefined)).toThrow();
    });

    test('should get current log level', () => {
      testLogger.setLogLevel(LogLevel.ERROR);
      expect(testLogger.getLogLevel()).toBe(LogLevel.ERROR);
    });
  });

  describe('Performance Logging', () => {
    test('should log performance measurements', () => {
      testLogger.performance('test-operation', 150, { items: 10 });
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [TestLogger]'),
        'Performance: test-operation completed in 150ms',
        expect.objectContaining({
          operation: 'test-operation',
          duration: 150,
          items: 10
        })
      );
    });

    test('should create and use performance timer', () => {
      const timer = testLogger.timer('test-timer');
      expect(typeof timer).toBe('function');
      
      const duration = timer({ result: 'success' });
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [TestLogger]'),
        expect.stringContaining('Performance: test-timer completed in'),
        expect.objectContaining({
          operation: 'test-timer',
          result: 'success'
        })
      );
    });
  });

  describe('Audit Logging', () => {
    test('should log audit trail', () => {
      testLogger.audit('user-login', { 
        user: 'testuser', 
        ip: '127.0.0.1',
        success: true 
      });
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [TestLogger]'),
        'Audit: user-login',
        expect.objectContaining({
          action: 'user-login',
          user: 'testuser',
          ip: '127.0.0.1',
          success: true,
          timestamp: expect.any(String)
        })
      );
    });

    test('should default to anonymous user for audit', () => {
      testLogger.audit('action-performed');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [TestLogger]'),
        'Audit: action-performed',
        expect.objectContaining({
          user: 'anonymous'
        })
      );
    });
  });

  describe('Log History', () => {
    test('should maintain log history', () => {
      testLogger.info('First message');
      testLogger.warn('Second message');
      testLogger.error('Third message');
      
      const history = testLogger.getHistory();
      
      expect(history).toHaveLength(3);
      expect(history[0].message).toBe('First message');
      expect(history[0].levelName).toBe('INFO');
      expect(history[1].message).toBe('Second message');
      expect(history[1].levelName).toBe('WARN');
      expect(history[2].message).toBe('Third message');
      expect(history[2].levelName).toBe('ERROR');
    });

    test('should limit history by level', () => {
      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warning message');
      testLogger.error('Error message');
      
      const errorAndAbove = testLogger.getHistory(100, LogLevel.ERROR);
      expect(errorAndAbove).toHaveLength(1);
      expect(errorAndAbove[0].message).toBe('Error message');
      
      const warnAndAbove = testLogger.getHistory(100, LogLevel.WARN);
      expect(warnAndAbove).toHaveLength(2);
    });

    test('should clear log history', () => {
      testLogger.info('Test message');
      expect(testLogger.getHistory()).toHaveLength(1);
      
      testLogger.clearHistory();
      expect(testLogger.getHistory()).toHaveLength(0);
    });

    test('should export logs as JSON', () => {
      testLogger.info('Test message 1');
      testLogger.warn('Test message 2');
      
      const exported = testLogger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(parsed.logger).toBe('TestLogger');
      expect(parsed.count).toBe(2);
      expect(parsed.logs).toHaveLength(2);
      expect(parsed.exported).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO date format
    });
  });

  describe('Grouped Logging', () => {
    test('should create grouped logs', () => {
      const group = testLogger.group('Test Group');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [TestLogger]'),
        '▼ Test Group',
        expect.objectContaining({
          action: 'group_start'
        })
      );
      
      group.info('Grouped message');
      group.end();
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [TestLogger]'),
        '  Grouped message'
      );
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [TestLogger]'),
        '▲ Test Group (end)',
        expect.objectContaining({
          action: 'group_end'
        })
      );
    });
  });

  describe('Argument Sanitization', () => {
    test('should handle circular references', () => {
      const obj = { name: 'test' };
      obj.self = obj; // Create circular reference
      
      testLogger.info('Circular test', obj);
      
      const history = testLogger.getHistory();
      expect(history[0].args[0]).toBe('[Circular Reference]');
    });

    test('should handle functions', () => {
      const fn = function testFunction() { return 'test'; };
      
      testLogger.info('Function test', fn);
      
      const history = testLogger.getHistory();
      expect(history[0].args[0]).toBe('[Function]');
    });

    test('should handle null and undefined', () => {
      testLogger.info('Null/undefined test', null, undefined);
      
      const history = testLogger.getHistory();
      expect(history[0].args[0]).toBeNull();
      expect(history[0].args[1]).toBeUndefined();
    });
  });

  describe('Log Persistence', () => {
    test('should persist logs to localStorage', () => {
      const persistLogger = new Logger('PersistTest', { persistLogs: true });
      
      persistLogger.info('Persistent message');
      
      const stored = localStorage.getItem('logger_PersistTest_history');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe('Persistent message');
    });

    test('should not persist when disabled', () => {
      const noPersistLogger = new Logger('NoPersistTest', { persistLogs: false });
      
      noPersistLogger.info('Non-persistent message');
      
      const stored = localStorage.getItem('logger_NoPersistTest_history');
      expect(stored).toBeNull();
    });
  });
});

describe('Logger Utilities', () => {
  test('createLogger should create new logger instance', () => {
    const customLogger = createLogger('CustomLogger', { maxHistorySize: 500 });
    
    expect(customLogger.name).toBe('CustomLogger');
    expect(customLogger.maxHistorySize).toBe(500);
  });

  test('withLogging should wrap function with logging', () => {
    const mockLogger = {
      timer: jest.fn(() => jest.fn()),
      error: jest.fn()
    };
    
    const testFunction = (x, y) => x + y;
    const wrappedFunction = withLogging(testFunction, mockLogger, 'addition');
    
    const result = wrappedFunction(2, 3);
    
    expect(result).toBe(5);
    expect(mockLogger.timer).toHaveBeenCalledWith('addition');
  });

  test('withLogging should handle function errors', () => {
    const mockLogger = {
      timer: jest.fn(() => jest.fn()),
      error: jest.fn()
    };
    
    const errorFunction = () => {
      throw new Error('Test error');
    };
    
    const wrappedFunction = withLogging(errorFunction, mockLogger, 'error-test');
    
    expect(() => wrappedFunction()).toThrow('Test error');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  test('withLogging should handle promise rejections', async () => {
    const mockLogger = {
      timer: jest.fn(() => jest.fn()),
      error: jest.fn()
    };
    
    const asyncErrorFunction = async () => {
      throw new Error('Async error');
    };
    
    const wrappedFunction = withLogging(asyncErrorFunction, mockLogger, 'async-error');
    
    await expect(wrappedFunction()).rejects.toThrow('Async error');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});