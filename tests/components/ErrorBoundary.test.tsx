/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import {
  ErrorBoundary,
  withErrorBoundary,
  type ErrorBoundaryProps,
  type ErrorFallbackProps
} from '../../app/renderer/components/ErrorBoundary';

// Mock console methods to avoid noise in test output
const originalError = console.error;
const originalLog = console.log;
const originalGroup = console.group;
const originalGroupEnd = console.groupEnd;

beforeEach(() => {
  // Mock console methods
  console.error = jest.fn();
  console.log = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalError;
  console.log = originalLog;
  console.group = originalGroup;
  console.groupEnd = originalGroupEnd;
});

// Test components that can throw errors
const ThrowError: React.FC<{ shouldThrow?: boolean; error?: Error }> = ({ 
  shouldThrow = true, 
  error = new Error('Test error') 
}) => {
  if (shouldThrow) {
    throw error;
  }
  return <div data-testid="no-error">No error occurred</div>;
};

const GoodComponent: React.FC<{ message: string }> = ({ message }) => (
  <div data-testid="good-component">{message}</div>
);

// Custom fallback component for testing
const CustomErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorId,
  retryCount,
  onRetry,
  testId = 'custom-error'
}) => (
  <div data-testid={`${testId}-custom-fallback`}>
    <p data-testid={`${testId}-custom-message`}>Custom Error: {error.message}</p>
    <p data-testid={`${testId}-custom-id`}>ID: {errorId}</p>
    <p data-testid={`${testId}-custom-retry-count`}>Retries: {retryCount}</p>
    <button onClick={onRetry} data-testid={`${testId}-custom-retry`}>
      Custom Retry
    </button>
  </div>
);

describe('ErrorBoundary Component Tests', () => {
  describe('Basic Error Catching', () => {
    test('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <GoodComponent message="Hello World" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('good-component')).toBeInTheDocument();
      expect(screen.getByText('Hello World')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
    });

    test('catches errors and displays default fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByTestId('error-boundary-title')).toHaveTextContent('Something went wrong');
      expect(screen.getByTestId('error-boundary-message')).toHaveTextContent('An unexpected error occurred');
      expect(screen.getByTestId('error-boundary-retry-button')).toBeInTheDocument();
    });

    test('generates unique error IDs for each error', () => {
      const { unmount } = render(
        <ErrorBoundary showErrorDetails testId="error-1">
          <ThrowError error={new Error('First error')} />
        </ErrorBoundary>
      );

      const firstErrorId = screen.getByTestId('error-1-error-details').textContent;
      expect(firstErrorId).toMatch(/Error ID: err_\d+_[a-z0-9]+/);

      // Extract just the error ID from the full text content
      const firstIdMatch = firstErrorId?.match(/Error ID: (err_\d+_[a-z0-9]+)/);
      const firstId = firstIdMatch ? firstIdMatch[1] : '';

      unmount();

      render(
        <ErrorBoundary showErrorDetails testId="error-2">
          <ThrowError error={new Error('Second error')} />
        </ErrorBoundary>
      );

      const secondErrorId = screen.getByTestId('error-2-error-details').textContent;
      expect(secondErrorId).toMatch(/Error ID: err_\d+_[a-z0-9]+/);
      
      const secondIdMatch = secondErrorId?.match(/Error ID: (err_\d+_[a-z0-9]+)/);
      const secondId = secondIdMatch ? secondIdMatch[1] : '';
      
      expect(firstId).not.toEqual(secondId);
    });

    test('logs errors to console in development', () => {
      // Set NODE_ENV to development for this test
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(console.group).toHaveBeenCalledWith('🚨 Error Boundary Caught Error');
      expect(console.error).toHaveBeenCalledWith('Error:', expect.any(Error));
      expect(console.groupEnd).toHaveBeenCalled();

      // Restore NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Custom Props and Configuration', () => {
    test('uses custom testId', () => {
      render(
        <ErrorBoundary testId="custom-error-boundary">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('custom-error-boundary-fallback')).toBeInTheDocument();
      expect(screen.getByTestId('custom-error-boundary-retry-button')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(
        <ErrorBoundary className="my-custom-error-class">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary')).toHaveClass('my-custom-error-class');
    });

    test('uses custom fallback component', () => {
      render(
        <ErrorBoundary fallback={CustomErrorFallback}>
          <ThrowError error={new Error('Custom error')} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-custom-fallback')).toBeInTheDocument();
      expect(screen.getByTestId('error-boundary-custom-message')).toHaveTextContent('Custom Error: Custom error');
      expect(screen.getByTestId('error-boundary-custom-id')).toHaveTextContent(/ID: err_/);
      expect(screen.getByTestId('error-boundary-custom-retry')).toBeInTheDocument();
    });

    test('calls custom error handler when provided', () => {
      const mockErrorHandler = jest.fn();
      
      render(
        <ErrorBoundary onError={mockErrorHandler}>
          <ThrowError error={new Error('Handler test error')} />
        </ErrorBoundary>
      );

      expect(mockErrorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Handler test error'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        }),
        expect.stringMatching(/err_\d+_[a-z0-9]+/)
      );
    });

    test('handles error in custom error handler gracefully', () => {
      const faultyErrorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      
      render(
        <ErrorBoundary onError={faultyErrorHandler}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Error in custom error handler:', expect.any(Error));
    });
  });

  describe('Retry Functionality', () => {
    test('retry button resets error state', async () => {
      let shouldThrow = true;
      
      const DynamicComponent = () => (
        <ThrowError shouldThrow={shouldThrow} />
      );

      render(
        <ErrorBoundary>
          <DynamicComponent />
        </ErrorBoundary>
      );

      // Error should be caught
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      
      // Change the component to not throw
      shouldThrow = false;

      // Click retry
      fireEvent.click(screen.getByTestId('error-boundary-retry-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
        expect(screen.getByTestId('no-error')).toBeInTheDocument();
      });
    });

    test('tracks retry count and respects max retries', async () => {
      render(
        <ErrorBoundary maxRetries={2}>
          <ThrowError />
        </ErrorBoundary>
      );

      // Initial state - should show "Try again (0/2)"
      expect(screen.getByTestId('error-boundary-retry-button')).toHaveTextContent('Try again (0/2)');
      expect(screen.getByTestId('error-boundary-retry-button')).not.toBeDisabled();

      // First retry
      fireEvent.click(screen.getByTestId('error-boundary-retry-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-boundary-retry-button')).toHaveTextContent('Try again (1/2)');
      });
      expect(screen.getByTestId('error-boundary-retry-button')).not.toBeDisabled();

      // Second retry (this should be the last attempt)
      fireEvent.click(screen.getByTestId('error-boundary-retry-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-boundary-retry-button')).toHaveTextContent('Max retries reached');
        expect(screen.getByTestId('error-boundary-retry-button')).toBeDisabled();
      });
    });

    test('can disable retry functionality', () => {
      render(
        <ErrorBoundary showRetry={false}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary-retry-button')).not.toBeInTheDocument();
    });

    test('retry delay prevents immediate re-error', async () => {
      jest.useFakeTimers();
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('error-boundary-retry-button'));

      // Should still show error immediately after click
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Advance timers to trigger retry
      act(() => {
        jest.advanceTimersByTime(100);
      });

      jest.useRealTimers();
    });
  });

  describe('Error Details Display', () => {
    test('shows error details when showErrorDetails is true', () => {
      render(
        <ErrorBoundary showErrorDetails>
          <ThrowError error={new Error('Detailed error')} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-details-toggle')).toBeInTheDocument();
      
      // Click to expand details
      fireEvent.click(screen.getByTestId('error-boundary-details-toggle'));
      
      const errorDetails = screen.getByTestId('error-boundary-error-details');
      expect(errorDetails).toBeInTheDocument();
      expect(errorDetails).toHaveTextContent('Detailed error');
    });

    test('shows error details in development environment by default', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError error={new Error('Dev error')} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-details-toggle')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    test('hides error details in production when showErrorDetails is false', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary showErrorDetails={false}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByTestId('error-boundary-details-toggle')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    test('displays error stack trace and component stack', () => {
      render(
        <ErrorBoundary showErrorDetails>
          <ThrowError error={new Error('Stack trace test')} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('error-boundary-details-toggle'));
      
      const details = screen.getByTestId('error-boundary-error-details');
      expect(details).toHaveTextContent(/Stack trace test/);
      expect(details).toHaveTextContent(/Stack trace:/);
      expect(details).toHaveTextContent(/Component stack:/);
    });
  });

  describe('Props Change Reset Functionality', () => {
    test('resets error when resetOnPropsChange is true and props change', async () => {
      let key = 'initial';
      
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange resetKeys={['testKey']} testKey={key}>
          <ThrowError />
        </ErrorBoundary>
      );

      // Error should be caught
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Change the reset key
      key = 'changed';
      rerender(
        <ErrorBoundary resetOnPropsChange resetKeys={['testKey']} testKey={key}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Error boundary should reset
      await waitFor(() => {
        expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
        expect(screen.getByTestId('no-error')).toBeInTheDocument();
      });
    });

    test('does not reset when resetOnPropsChange is false', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange={false} testKey="initial">
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Change props
      rerender(
        <ErrorBoundary resetOnPropsChange={false} testKey="changed">
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should still show error
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });
  });

  describe('Public Reset Method', () => {
    test('reset method clears error state', async () => {
      let errorBoundaryRef: ErrorBoundary | null = null;
      
      render(
        <ErrorBoundary 
          ref={(ref) => { errorBoundaryRef = ref; }}
        >
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Initially no error
      expect(screen.getByTestId('no-error')).toBeInTheDocument();

      // Force an error through re-render
      const { rerender } = render(
        <ErrorBoundary 
          ref={(ref) => { errorBoundaryRef = ref; }}
        >
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

      // Reset using public method
      if (errorBoundaryRef) {
        act(() => {
          errorBoundaryRef!.reset();
        });

        rerender(
          <ErrorBoundary 
            ref={(ref) => { errorBoundaryRef = ref; }}
          >
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>
        );

        await waitFor(() => {
          expect(screen.getByTestId('no-error')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Accessibility', () => {
    test('fallback UI has proper ARIA attributes', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const fallback = screen.getByTestId('error-boundary-fallback');
      expect(fallback).toHaveAttribute('role', 'alert');
      expect(fallback).toHaveAttribute('aria-live', 'assertive');

      const retryButton = screen.getByTestId('error-boundary-retry-button');
      expect(retryButton).toHaveAttribute('aria-label', 'Retry loading (attempt 1 of 3)');
    });

    test('error icon is properly hidden from screen readers', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const icon = screen.getByTestId('error-boundary-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Higher-Order Component (withErrorBoundary)', () => {
    test('wraps component with error boundary', () => {
      const WrappedComponent = withErrorBoundary(GoodComponent);
      
      render(<WrappedComponent message="HOC Test" />);
      
      expect(screen.getByTestId('good-component')).toBeInTheDocument();
      expect(screen.getByText('HOC Test')).toBeInTheDocument();
    });

    test('catches errors in wrapped component', () => {
      const WrappedThrowError = withErrorBoundary(ThrowError);
      
      render(<WrappedThrowError />);
      
      expect(screen.getByTestId('hoc-error-boundary-fallback')).toBeInTheDocument();
    });

    test('passes error boundary props correctly', () => {
      const WrappedThrowError = withErrorBoundary(ThrowError);
      
      render(
        <WrappedThrowError 
          maxRetries={1}
          showErrorDetails
          showRetry
        />
      );

      expect(screen.getByTestId('hoc-error-boundary-retry-button')).toHaveTextContent('Try again (0/1)');
      expect(screen.getByTestId('hoc-error-boundary-details-toggle')).toBeInTheDocument();
    });

    test('does not pass error boundary props to wrapped component', () => {
      interface TestProps {
        message: string;
        maxRetries?: number; // This should not be passed from HOC
      }

      const TestComponent: React.FC<TestProps> = ({ message, maxRetries }) => (
        <div data-testid="test-component">
          {message} - MaxRetries: {maxRetries || 'undefined'}
        </div>
      );

      const WrappedComponent = withErrorBoundary(TestComponent);
      
      render(<WrappedComponent message="Test" maxRetries={5} />);
      
      // maxRetries should not be passed to the wrapped component
      expect(screen.getByTestId('test-component')).toHaveTextContent('Test - MaxRetries: undefined');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles errors with missing stack traces', () => {
      const errorWithoutStack = new Error('No stack error');
      delete errorWithoutStack.stack;

      render(
        <ErrorBoundary showErrorDetails>
          <ThrowError error={errorWithoutStack} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('error-boundary-details-toggle'));
      expect(screen.getByText(/No stack error/)).toBeInTheDocument();
    });

    test('handles errors with unusual error types', () => {
      // Test with string thrown as error
      const ThrowString = () => {
        throw 'String error';
      };

      render(
        <ErrorBoundary>
          <ThrowString />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });

    test('cleans up timeouts on unmount', () => {
      jest.useFakeTimers();
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Trigger a retry to create a timeout
      fireEvent.click(screen.getByTestId('error-boundary-retry-button'));

      // Unmount the component
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      jest.useRealTimers();
      clearTimeoutSpy.mockRestore();
    });

    test('handles rapid retry clicks gracefully', async () => {
      render(
        <ErrorBoundary maxRetries={5}>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getByTestId('error-boundary-retry-button');

      // Click retry button multiple times rapidly
      for (let i = 0; i < 3; i++) {
        fireEvent.click(retryButton);
      }

      // Should handle multiple clicks without crashing
      expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    });
  });

  describe('Performance and Memory', () => {
    test('does not leak memory on multiple error/reset cycles', async () => {
      // Test that component can be mounted and unmounted without issues
      for (let i = 0; i < 3; i++) {
        const { unmount } = render(
          <ErrorBoundary testId={`cycle-${i}`}>
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>
        );

        expect(screen.getByTestId('no-error')).toBeInTheDocument();
        unmount();
      }

      // Final test to ensure everything cleaned up properly
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByTestId('no-error')).toBeInTheDocument();
      unmount();
      
      // Component should unmount cleanly without errors
      expect(() => unmount()).not.toThrow();
    });

    test('handles component updates efficiently', () => {
      const { rerender } = render(
        <ErrorBoundary className="class1">
          <GoodComponent message="Message 1" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Message 1')).toBeInTheDocument();

      rerender(
        <ErrorBoundary className="class2">
          <GoodComponent message="Message 2" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Message 2')).toBeInTheDocument();
    });
  });
});