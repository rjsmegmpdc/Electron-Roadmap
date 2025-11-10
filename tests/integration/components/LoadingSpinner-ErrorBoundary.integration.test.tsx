import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LoadingSpinner } from '../../../app/renderer/components/LoadingSpinner';
import { ErrorBoundary } from '../../../app/renderer/components/ErrorBoundary';

// Test component that can throw errors on demand
interface TestComponentProps {
  shouldThrow?: boolean;
  loading?: boolean;
  errorMessage?: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ 
  shouldThrow = false, 
  loading = false,
  errorMessage = 'Test error'
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }

  if (loading) {
    return (
      <div>
        <LoadingSpinner 
          size="medium" 
          message="Loading test data..."
        />
        <p>Test content loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Test Component</h1>
      <p>Everything is working correctly!</p>
    </div>
  );
};

describe('LoadingSpinner and ErrorBoundary Integration Tests', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should show loading state inside error boundary', () => {
    render(
      <ErrorBoundary>
        <TestComponent loading={true} />
      </ErrorBoundary>
    );

    // Should show loading spinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading test data...')).toBeInTheDocument();
    expect(screen.getByText('Test content loading...')).toBeInTheDocument();
    
    // Should not show error UI
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  test('should catch errors and show fallback while hiding loading', () => {
    render(
      <ErrorBoundary>
        <TestComponent shouldThrow={true} errorMessage="Integration test error" />
      </ErrorBoundary>
    );

    // Should show error boundary fallback
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
    
    // Should not show loading spinner
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading test data...')).not.toBeInTheDocument();
    
    // Should not show normal content
    expect(screen.queryByText('Test Component')).not.toBeInTheDocument();
    expect(screen.queryByText('Everything is working correctly!')).not.toBeInTheDocument();
  });

  test('should show normal content when no loading or errors', () => {
    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // Should show normal content
    expect(screen.getByText('Test Component')).toBeInTheDocument();
    expect(screen.getByText('Everything is working correctly!')).toBeInTheDocument();
    
    // Should not show loading or error states
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  test('should recover from error state after retry', async () => {
    let shouldThrow = true;

    const TestComponentWithRecovery: React.FC = () => {
      if (shouldThrow) {
        throw new Error('Recoverable error');
      }
      return <TestComponent />;
    };

    render(
      <ErrorBoundary>
        <TestComponentWithRecovery />
      </ErrorBoundary>
    );

    // Should show error state initially
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Simulate recovery (component will stop throwing)
    shouldThrow = false;
    
    // Click retry button
    const retryButton = screen.getByText(/try again/i);
    await userEvent.click(retryButton);
    
    // Should show normal content after retry
    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
      expect(screen.getByText('Everything is working correctly!')).toBeInTheDocument();
    });
    
    // Should not show error state anymore
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  test('should maintain accessibility when combining components', () => {
    render(
      <ErrorBoundary>
        <TestComponent loading={true} />
      </ErrorBoundary>
    );

    const spinner = screen.getByTestId('loading-spinner');
    
    // LoadingSpinner should have proper ARIA attributes
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    
    // Message should have aria-live for screen readers
    const message = screen.getByTestId('loading-spinner-message');
    expect(message).toHaveAttribute('aria-live', 'polite');
  });

  test('should maintain accessibility in error state', () => {
    render(
      <ErrorBoundary>
        <TestComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
  });
});