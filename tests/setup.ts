import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import '@testing-library/jest-dom';

// Global test setup
beforeAll(async () => {
  // Create temporary directories for tests
  global.testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'roadmap-tests-'));
  
  // Mock console methods to prevent noise during testing
  global.originalConsoleLog = console.log;
  global.originalConsoleError = console.error;
  global.originalConsoleWarn = console.warn;
  
  // Only show console output for failed tests
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.warn = jest.fn();
  }
});

afterAll(async () => {
  // Restore console methods
  console.log = global.originalConsoleLog;
  console.error = global.originalConsoleError;
  console.warn = global.originalConsoleWarn;
  
  // Clean up temporary directories
  if (global.testTempDir) {
    try {
      await fs.rmdir(global.testTempDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
});

// Mock Electron APIs for testing
const mockElectronApp = {
  getPath: jest.fn((name: string): string => {
    switch (name) {
      case 'userData':
        return path.join(global.testTempDir || os.tmpdir(), 'test-userdata');
      case 'temp':
        return global.testTempDir || os.tmpdir();
      default:
        return global.testTempDir || os.tmpdir();
    }
  }),
  quit: jest.fn(() => {}),
  whenReady: jest.fn(async (): Promise<void> => {}),
};

global.mockElectronApp = mockElectronApp as any;

// Custom matchers for better testing
expect.extend({
  toBeValidNZDate(received: string) {
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    const pass = dateRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid NZ date format`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid NZ date format (DD-MM-YYYY)`,
        pass: false,
      };
    }
  },
  
  toBeValidNZCurrency(received: number) {
    const pass = Number.isInteger(received) && received >= 0;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid NZ currency in cents`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid NZ currency in cents (non-negative integer)`,
        pass: false,
      };
    }
  }
});

// Extend global types for TypeScript
declare global {
  var testTempDir: string;
  var originalConsoleLog: typeof console.log;
  var originalConsoleError: typeof console.error;
  var originalConsoleWarn: typeof console.warn;
  var mockElectronApp: any;
  
  namespace jest {
    interface Matchers<R> {
      toBeValidNZDate(): R;
      toBeValidNZCurrency(): R;
    }
  }
}
