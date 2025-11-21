/**
 * ErrorBoundary Component
 * 
 * A comprehensive error boundary component that catches JavaScript errors anywhere 
 * in the child component tree, logs errors, and displays a fallback UI with retry functionality.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string | null;
  errorBoundaryStack?: string | null;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export interface ErrorBoundaryProps {
  /** Custom fallback UI component */
  fallback?: ComponentType<ErrorFallbackProps>;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Whether to show error details in development */
  showErrorDetails?: boolean;
  /** Custom error handler */
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  /** Children to wrap */
  children: ReactNode;
  /** Custom className for wrapper */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Whether to reset error on prop changes */
  resetOnPropsChange?: boolean;
  /** Props to monitor for changes (to trigger reset) */
  resetKeys?: Array<string | number>;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  maxRetries: number;
  hasRetry: boolean;
  onRetry: () => void;
  showErrorDetails: boolean;
  testId?: string;
}

// Default fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  hasRetry,
  onRetry,
  showErrorDetails,
  testId = 'error-boundary'
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <div
      className="error-boundary-fallback border-2 border-red-300 rounded-lg p-6 m-4 bg-red-50"
      data-testid={`${testId}-fallback`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg
            className="h-8 w-8 text-red-400"
            data-testid={`${testId}-icon`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-red-800" data-testid={`${testId}-title`}>
            Something went wrong
          </h3>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-red-700" data-testid={`${testId}-message`}>
          An unexpected error occurred and the application couldn't continue. 
          {hasRetry && ' You can try to reload this section.'}
        </p>
      </div>

      {hasRetry && (
        <div className="mb-4">
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={`${testId}-retry-button`}
            disabled={retryCount >= maxRetries}
            aria-label={`Retry loading (attempt ${retryCount + 1} of ${maxRetries})`}
          >
            {retryCount >= maxRetries ? 'Max retries reached' : `Try again (${retryCount}/${maxRetries})`}
          </button>
        </div>
      )}

      {(showErrorDetails || isDevelopment) && (
        <details className="mt-4">
          <summary
            className="cursor-pointer text-sm font-medium text-red-800 hover:text-red-900"
            data-testid={`${testId}-details-toggle`}
          >
            Technical Details
          </summary>
          <div className="mt-2 text-xs text-red-700 font-mono bg-red-100 p-3 rounded border" data-testid={`${testId}-error-details`}>
            <div className="mb-2">
              <strong>Error ID:</strong> {errorId}
            </div>
            <div className="mb-2">
              <strong>Error:</strong> {error.name}: {error.message}
            </div>
            {error.stack && (
              <div className="mb-2">
                <strong>Stack trace:</strong>
                <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
              </div>
            )}
            {errorInfo?.componentStack && (
              <div>
                <strong>Component stack:</strong>
                <pre className="whitespace-pre-wrap mt-1">{errorInfo.componentStack}</pre>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

type ComponentType<P> = React.ComponentType<P> | React.FC<P>;

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    this.logError(error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError && this.state.errorId) {
      try {
        this.props.onError(error, errorInfo, this.state.errorId);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when specified props change
    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        // Check specific keys for changes
        const hasResetKeyChanged = resetKeys.some(key => {
          const prevValue = (prevProps as any)[key];
          const currentValue = (this.props as any)[key];
          return prevValue !== currentValue;
        });

        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      } else {
        // Check all props for changes (shallow comparison)
        const propsChanged = Object.keys(this.props).some(key => {
          if (key === 'children' || key === 'onError') {
            return false; // Skip these props for comparison
          }
          return (prevProps as any)[key] !== (this.props as any)[key];
        });

        if (propsChanged) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: { ...this.props, children: '[ReactNode]', onError: '[Function]' },
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Report:', errorReport);
      console.groupEnd();
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry, LogRocket, Rollbar, etc.
    if (process.env.NODE_ENV === 'production') {
      // sendErrorToService(errorReport);
      console.error('Error Boundary:', errorReport);
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    console.log(`ErrorBoundary: Retrying (attempt ${retryCount + 1}/${maxRetries})`);

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
    }));

    // Add a small delay before retrying to avoid immediate re-error
    this.retryTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, 100);
  };

  private resetErrorBoundary = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      // Keep retryCount to track total attempts
    });
  };

  public reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  render() {
    const {
      fallback: FallbackComponent = DefaultErrorFallback,
      maxRetries = 3,
      showRetry = true,
      showErrorDetails = false,
      children,
      className = '',
      testId = 'error-boundary',
    } = this.props;

    const { hasError, error, errorInfo, errorId, retryCount } = this.state;

    if (hasError && error && errorId) {
      return (
        <div className={className} data-testid={testId}>
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            errorId={errorId}
            retryCount={retryCount}
            maxRetries={maxRetries}
            hasRetry={showRetry}
            onRetry={this.handleRetry}
            showErrorDetails={showErrorDetails}
            testId={testId}
          />
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for adding error boundaries to any component
export interface WithErrorBoundaryProps {
  fallback?: ComponentType<ErrorFallbackProps>;
  maxRetries?: number;
  showRetry?: boolean;
  showErrorDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & WithErrorBoundaryProps> {
  return ({
    fallback,
    maxRetries,
    showRetry,
    showErrorDetails,
    onError,
    resetOnPropsChange,
    resetKeys,
    ...props
  }) => {
    return (
      <ErrorBoundary
        fallback={fallback}
        maxRetries={maxRetries}
        showRetry={showRetry}
        showErrorDetails={showErrorDetails}
        onError={onError}
        resetOnPropsChange={resetOnPropsChange}
        resetKeys={resetKeys}
        testId="hoc-error-boundary"
      >
        <Component {...props as P} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
