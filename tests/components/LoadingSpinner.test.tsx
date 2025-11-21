/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  LoadingSpinner,
  PrimarySpinner,
  SecondarySpinner,
  WhiteSpinner,
  withLoading,
  type LoadingSpinnerProps,
  type SpinnerSize,
  type SpinnerVariant
} from '../../app/renderer/components/LoadingSpinner';

describe('LoadingSpinner Component Tests', () => {
  describe('Basic Rendering', () => {
    test('renders with default props', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'w-8', 'h-8', 'border-4');
      expect(spinner).toHaveAttribute('role', 'status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    test('renders with custom testId', () => {
      render(<LoadingSpinner testId="custom-spinner" />);
      
      const spinner = screen.getByTestId('custom-spinner');
      expect(spinner).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(<LoadingSpinner className="my-custom-class" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('my-custom-class');
    });

    test('applies custom inline styles', () => {
      const customStyle = { marginTop: '20px', opacity: '0.8' };
      render(<LoadingSpinner style={customStyle} />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveStyle('margin-top: 20px');
      expect(spinner).toHaveStyle('opacity: 0.8');
    });
  });

  describe('Size Variants', () => {
    const sizes: SpinnerSize[] = ['small', 'medium', 'large', 'xlarge'];
    
    test.each(sizes)('renders %s size correctly', (size) => {
      render(<LoadingSpinner size={size} testId={`spinner-${size}`} />);
      
      const spinner = screen.getByTestId(`spinner-${size}`);
      expect(spinner).toBeInTheDocument();
      
      // Check size-specific classes
      switch (size) {
        case 'small':
          expect(spinner).toHaveClass('w-4', 'h-4', 'border-2');
          break;
        case 'medium':
          expect(spinner).toHaveClass('w-8', 'h-8', 'border-4');
          break;
        case 'large':
          expect(spinner).toHaveClass('w-12', 'h-12', 'border-4');
          break;
        case 'xlarge':
          expect(spinner).toHaveClass('w-16', 'h-16', 'border-4');
          break;
      }
    });
  });

  describe('Color Variants', () => {
    const variants: SpinnerVariant[] = ['primary', 'secondary', 'white', 'custom'];
    
    test.each(variants)('renders %s variant correctly', (variant) => {
      render(<LoadingSpinner variant={variant} testId={`spinner-${variant}`} />);
      
      const spinner = screen.getByTestId(`spinner-${variant}`);
      expect(spinner).toBeInTheDocument();
      
      // Check variant-specific classes
      switch (variant) {
        case 'primary':
          expect(spinner).toHaveClass('border-blue-500', 'border-t-transparent');
          break;
        case 'secondary':
          expect(spinner).toHaveClass('border-gray-500', 'border-t-transparent');
          break;
        case 'white':
          expect(spinner).toHaveClass('border-white', 'border-t-transparent');
          break;
        case 'custom':
          // Custom variant should not have predefined border classes
          expect(spinner).not.toHaveClass('border-blue-500', 'border-gray-500', 'border-white');
          break;
      }
    });

    test('applies custom color for custom variant', () => {
      render(<LoadingSpinner variant="custom" customColor="#ff0000" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveStyle('border-color: #ff0000');
      // Check for transparent or equivalent rgba value
      const computedStyle = window.getComputedStyle(spinner);
      const borderTopColor = computedStyle.borderTopColor;
      expect(borderTopColor === 'transparent' || borderTopColor === 'rgba(0, 0, 0, 0)').toBe(true);
    });

    test('ignores customColor for non-custom variants', () => {
      render(<LoadingSpinner variant="primary" customColor="#ff0000" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).not.toHaveStyle('border-color: #ff0000');
    });
  });

  describe('Message Display', () => {
    test('displays message when provided', () => {
      const message = 'Loading projects...';
      render(<LoadingSpinner message={message} />);
      
      const messageElement = screen.getByTestId('loading-spinner-message');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent(message);
      expect(messageElement).toHaveAttribute('aria-live', 'polite');
    });

    test('does not display message element when message is not provided', () => {
      render(<LoadingSpinner />);
      
      expect(screen.queryByTestId('loading-spinner-message')).not.toBeInTheDocument();
    });

    test('applies correct message styles for different sizes', () => {
      render(<LoadingSpinner size="large" message="Loading..." />);
      
      const messageElement = screen.getByTestId('loading-spinner-message');
      expect(messageElement).toHaveClass('text-lg', 'font-medium', 'mt-4');
    });

    test('applies correct message color for different variants', () => {
      render(<LoadingSpinner variant="secondary" message="Loading..." />);
      
      const messageElement = screen.getByTestId('loading-spinner-message');
      expect(messageElement).toHaveClass('text-gray-600');
    });
  });

  describe('Overlay Mode', () => {
    test('renders with overlay when overlay prop is true', () => {
      render(<LoadingSpinner overlay />);
      
      const overlay = screen.getByTestId('loading-spinner-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'z-50');
      expect(overlay).toHaveAttribute('role', 'dialog');
      expect(overlay).toHaveAttribute('aria-modal', 'true');
    });

    test('does not render overlay when overlay prop is false', () => {
      render(<LoadingSpinner overlay={false} />);
      
      expect(screen.queryByTestId('loading-spinner-overlay')).not.toBeInTheDocument();
    });

    test('overlay has correct aria attributes with message', () => {
      render(<LoadingSpinner overlay message="Please wait..." />);
      
      const overlay = screen.getByTestId('loading-spinner-overlay');
      expect(overlay).toHaveAttribute('aria-labelledby', 'loading-spinner-message');
    });

    test('overlay has correct aria attributes without message', () => {
      render(<LoadingSpinner overlay />);
      
      const overlay = screen.getByTestId('loading-spinner-overlay');
      expect(overlay).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('Conditional Rendering', () => {
    test('renders when show prop is true', () => {
      render(<LoadingSpinner show={true} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('does not render when show prop is false', () => {
      render(<LoadingSpinner show={false} />);
      
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    test('renders by default when show prop is not provided', () => {
      render(<LoadingSpinner />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<LoadingSpinner ariaLabel="Loading data" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveAttribute('role', 'status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
      expect(spinner).toHaveAttribute('aria-label', 'Loading data');
    });

    test('uses default aria-label when none provided', () => {
      render(<LoadingSpinner />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    test('message has proper aria-live attribute', () => {
      render(<LoadingSpinner message="Loading..." />);
      
      const message = screen.getByTestId('loading-spinner-message');
      expect(message).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles empty string message gracefully', () => {
      render(<LoadingSpinner message="" />);
      
      // Empty message should not render message element
      expect(screen.queryByTestId('loading-spinner-message')).not.toBeInTheDocument();
    });

    test('handles undefined customColor gracefully', () => {
      render(<LoadingSpinner variant="custom" customColor={undefined} />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
      // Should not crash and should not apply custom border styles
    });

    test('handles null props gracefully', () => {
      render(<LoadingSpinner message={null as any} className={null as any} />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    test('handles extreme size combinations', () => {
      render(
        <LoadingSpinner
          size="xlarge"
          variant="white"
          overlay
          message="Very long loading message that might wrap to multiple lines in the UI"
        />
      );
      
      const spinner = screen.getByTestId('loading-spinner');
      const overlay = screen.getByTestId('loading-spinner-overlay');
      const message = screen.getByTestId('loading-spinner-message');
      
      expect(spinner).toBeInTheDocument();
      expect(overlay).toBeInTheDocument();
      expect(message).toBeInTheDocument();
      
      // Check that large spinner has correct classes
      expect(spinner).toHaveClass('w-16', 'h-16');
      expect(message).toHaveClass('text-xl');
    });
  });

  describe('Pre-configured Spinner Variants', () => {
    test('PrimarySpinner renders with primary variant', () => {
      render(<PrimarySpinner testId="primary-test" />);
      
      const spinner = screen.getByTestId('primary-test');
      expect(spinner).toHaveClass('border-blue-500');
    });

    test('SecondarySpinner renders with secondary variant', () => {
      render(<SecondarySpinner testId="secondary-test" />);
      
      const spinner = screen.getByTestId('secondary-test');
      expect(spinner).toHaveClass('border-gray-500');
    });

    test('WhiteSpinner renders with white variant', () => {
      render(<WhiteSpinner testId="white-test" />);
      
      const spinner = screen.getByTestId('white-test');
      expect(spinner).toHaveClass('border-white');
    });

    test('pre-configured variants accept all other props', () => {
      render(
        <PrimarySpinner
          size="large"
          message="Primary loading..."
          overlay
          testId="primary-full"
        />
      );
      
      const spinner = screen.getByTestId('primary-full');
      const overlay = screen.getByTestId('primary-full-overlay');
      const message = screen.getByTestId('primary-full-message');
      
      expect(spinner).toHaveClass('w-12', 'h-12', 'border-blue-500');
      expect(overlay).toBeInTheDocument();
      expect(message).toHaveTextContent('Primary loading...');
    });
  });

  describe('Higher-Order Component (withLoading)', () => {
    // Create a test component to wrap
    const TestComponent: React.FC<{ title: string }> = ({ title }) => (
      <div data-testid="test-component">{title}</div>
    );

    test('renders wrapped component without loading', () => {
      const WrappedComponent = withLoading(TestComponent);
      render(<WrappedComponent title="Test Title" loading={false} />);
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByTestId('test-component')).toHaveTextContent('Test Title');
      expect(screen.queryByTestId('hoc-loading-spinner')).not.toBeInTheDocument();
    });

    test('renders wrapped component with loading spinner when loading is true', () => {
      const WrappedComponent = withLoading(TestComponent);
      render(<WrappedComponent title="Test Title" loading={true} />);
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByTestId('hoc-loading-spinner')).toBeInTheDocument();
    });

    test('passes loading props to spinner correctly', () => {
      const WrappedComponent = withLoading(TestComponent);
      render(
        <WrappedComponent
          title="Test Title"
          loading={true}
          loadingMessage="Custom loading..."
          loadingSize="large"
          loadingVariant="secondary"
          loadingOverlay={true}
        />
      );
      
      expect(screen.getByTestId('hoc-loading-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('hoc-loading-spinner-message')).toHaveTextContent('Custom loading...');
      expect(screen.getByTestId('hoc-loading-spinner')).toHaveClass('w-12', 'h-12');
      expect(screen.getByTestId('hoc-loading-spinner-overlay')).toBeInTheDocument();
    });

    test('does not pass loading props to wrapped component', () => {
      const TestComponentWithProps: React.FC<{ title: string; loading?: boolean }> = ({ title, loading }) => (
        <div data-testid="test-component">
          {title} - Loading: {loading ? 'true' : 'false'}
        </div>
      );

      const WrappedComponent = withLoading(TestComponentWithProps);
      render(<WrappedComponent title="Test Title" loading={true} />);
      
      // The loading prop should not be passed to the wrapped component
      expect(screen.getByTestId('test-component')).toHaveTextContent('Test Title - Loading: false');
    });
  });

  describe('Performance and Memory', () => {
    test('re-renders efficiently when props change', () => {
      const { rerender } = render(<LoadingSpinner size="small" />);
      
      expect(screen.getByTestId('loading-spinner')).toHaveClass('w-4', 'h-4');
      
      rerender(<LoadingSpinner size="large" />);
      expect(screen.getByTestId('loading-spinner')).toHaveClass('w-12', 'h-12');
    });

    test('cleans up properly when unmounted', () => {
      const { unmount } = render(<LoadingSpinner overlay />);
      
      expect(screen.getByTestId('loading-spinner-overlay')).toBeInTheDocument();
      
      expect(() => unmount()).not.toThrow();
    });

    test('handles rapid show/hide toggles', () => {
      const { rerender } = render(<LoadingSpinner show={true} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      
      rerender(<LoadingSpinner show={false} />);
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      
      rerender(<LoadingSpinner show={true} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });
});