/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner with multiple variants, sizes, and overlay modes.
 * Includes comprehensive accessibility support and customization options.
 */

import React from 'react';

export type SpinnerSize = 'small' | 'medium' | 'large' | 'xlarge';
export type SpinnerVariant = 'primary' | 'secondary' | 'white' | 'custom';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Visual variant/theme of the spinner */
  variant?: SpinnerVariant;
  /** Show as full-screen overlay */
  overlay?: boolean;
  /** Loading message to display */
  message?: string;
  /** Custom color for 'custom' variant */
  customColor?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Whether to show the spinner (for conditional rendering) */
  show?: boolean;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Aria label for accessibility */
  ariaLabel?: string;
}

const SIZE_CONFIGS = {
  small: {
    size: 'w-4 h-4',
    border: 'border-2',
    fontSize: 'text-sm'
  },
  medium: {
    size: 'w-8 h-8',
    border: 'border-4',
    fontSize: 'text-base'
  },
  large: {
    size: 'w-12 h-12',
    border: 'border-4',
    fontSize: 'text-lg'
  },
  xlarge: {
    size: 'w-16 h-16',
    border: 'border-4',
    fontSize: 'text-xl'
  }
} as const;

const VARIANT_CONFIGS = {
  primary: {
    border: 'border-blue-500',
    borderTop: 'border-t-transparent',
    text: 'text-blue-600'
  },
  secondary: {
    border: 'border-gray-500',
    borderTop: 'border-t-transparent', 
    text: 'text-gray-600'
  },
  white: {
    border: 'border-white',
    borderTop: 'border-t-transparent',
    text: 'text-white'
  },
  custom: {
    border: '',
    borderTop: '',
    text: 'text-gray-600'
  }
} as const;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  variant = 'primary',
  overlay = false,
  message,
  customColor,
  className = '',
  testId = 'loading-spinner',
  show = true,
  style,
  ariaLabel
}) => {
  // Don't render if show is false
  if (!show) {
    return null;
  }

  const sizeConfig = SIZE_CONFIGS[size];
  const variantConfig = VARIANT_CONFIGS[variant];

  // Build spinner classes
  const spinnerClasses = [
    'animate-spin',
    'rounded-full',
    sizeConfig.size,
    sizeConfig.border,
    variant !== 'custom' ? variantConfig.border : '',
    variant !== 'custom' ? variantConfig.borderTop : ''
  ].filter(Boolean).join(' ');

  // Custom color handling for 'custom' variant
  const spinnerStyle: React.CSSProperties = {
    ...style,
    ...(variant === 'custom' && customColor ? {
      borderColor: customColor,
      borderTopColor: 'transparent'
    } : {})
  };

  // Build message classes
  const messageClasses = [
    'mt-4',
    'font-medium',
    sizeConfig.fontSize,
    variant !== 'custom' ? variantConfig.text : 'text-gray-600'
  ].join(' ');

  // Spinner element
  const spinnerElement = (
    <div
      className={`${spinnerClasses} ${className}`.trim()}
      style={spinnerStyle}
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel || 'Loading'}
    />
  );

  // Content wrapper (spinner + optional message)
  const contentElement = (
    <div className="flex flex-col items-center justify-center">
      {spinnerElement}
      {message && (
        <div 
          className={messageClasses}
          data-testid={`${testId}-message`}
          aria-live="polite"
        >
          {message}
        </div>
      )}
    </div>
  );

  // Return with or without overlay
  if (overlay) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        data-testid={`${testId}-overlay`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={message ? `${testId}-message` : undefined}
        aria-label={!message ? (ariaLabel || 'Loading') : undefined}
      >
        {contentElement}
      </div>
    );
  }

  return contentElement;
};

// Pre-configured spinner variants for common use cases
export const PrimarySpinner: React.FC<Omit<LoadingSpinnerProps, 'variant'>> = (props) => (
  <LoadingSpinner {...props} variant="primary" />
);

export const SecondarySpinner: React.FC<Omit<LoadingSpinnerProps, 'variant'>> = (props) => (
  <LoadingSpinner {...props} variant="secondary" />
);

export const WhiteSpinner: React.FC<Omit<LoadingSpinnerProps, 'variant'>> = (props) => (
  <LoadingSpinner {...props} variant="white" />
);

// Higher-order component for adding loading states to any component
export interface WithLoadingProps {
  loading?: boolean;
  loadingMessage?: string;
  loadingSize?: SpinnerSize;
  loadingVariant?: SpinnerVariant;
  loadingOverlay?: boolean;
}

export function withLoading<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & WithLoadingProps> {
  return ({ 
    loading = false, 
    loadingMessage, 
    loadingSize = 'medium',
    loadingVariant = 'primary',
    loadingOverlay = false,
    ...props 
  }) => {
    return (
      <div className="relative">
        <Component {...props as P} />
        {loading && (
          <LoadingSpinner
            size={loadingSize}
            variant={loadingVariant}
            overlay={loadingOverlay}
            message={loadingMessage}
            testId="hoc-loading-spinner"
          />
        )}
      </div>
    );
  };
}

export default LoadingSpinner;