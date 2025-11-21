/**
 * Test setup file for modal component tests
 * Configures Jest environment and React Testing Library
 */

// Import Jest DOM matchers
import '@testing-library/jest-dom';

// Mock createPortal globally for all tests
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node) => node,
}));

// Mock IntersectionObserver for components that might use it
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver for components that might use it
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia for responsive components
global.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn().mockImplementation(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn().mockImplementation(id => clearTimeout(id));

// Set up default console error/warn suppression for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  // Reset console mocks before each test
  console.error = originalError;
  console.warn = originalWarn;
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllMocks();
  
  // Reset document body
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  
  // Clear any remaining event listeners
  const events = ['keydown', 'click', 'focus', 'blur'];
  events.forEach(event => {
    document.removeEventListener(event, jest.fn());
    window.removeEventListener(event, jest.fn());
  });
});

// Global test utilities
global.testUtils = {
  /**
   * Suppress console errors during a test
   */
  suppressConsoleError: () => {
    console.error = jest.fn();
  },
  
  /**
   * Suppress console warnings during a test
   */
  suppressConsoleWarn: () => {
    console.warn = jest.fn();
  },
  
  /**
   * Wait for async operations to complete
   */
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Create a mock function with proper typing
   */
  createMockFn: (implementation) => jest.fn(implementation),
  
  /**
   * Generate test IDs for consistent testing
   */
  generateTestId: (prefix, suffix) => `${prefix}${suffix ? `-${suffix}` : ''}`,
};

// Configure Jest environment
jest.setTimeout(10000); // 10 second timeout for async tests

// Add custom matchers if needed
expect.extend({
  /**
   * Check if element has specific CSS class
   */
  toHaveClass(received, className) {
    const pass = received.classList.contains(className);
    return {
      message: () => 
        pass 
          ? `Expected element not to have class "${className}"`
          : `Expected element to have class "${className}"`,
      pass,
    };
  },
  
  /**
   * Check if element is disabled
   */
  toBeDisabled(received) {
    const pass = received.disabled === true || received.getAttribute('disabled') !== null;
    return {
      message: () => 
        pass
          ? `Expected element not to be disabled`
          : `Expected element to be disabled`,
      pass,
    };
  },
});

// Export utilities for use in tests
export { testUtils };