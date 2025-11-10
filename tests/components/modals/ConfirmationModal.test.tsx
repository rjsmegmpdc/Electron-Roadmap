/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  ConfirmationModal,
  DangerConfirmationModal,
  WarningConfirmationModal,
  InfoConfirmationModal,
  SuccessConfirmationModal
} from '../../../app/renderer/components/modals/ConfirmationModal';

// Mock createPortal for testing
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

// Test wrapper component
const TestConfirmationWrapper = ({ 
  initialOpen = false, 
  modalProps = {} 
}: { 
  initialOpen?: boolean;
  modalProps?: any;
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)} data-testid="open-modal">
        Open Modal
      </button>
      <ConfirmationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => setIsOpen(false)}
        title="Test Confirmation"
        message="Are you sure?"
        {...modalProps}
      />
    </>
  );
};

describe('ConfirmationModal', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('✅ POSITIVE TESTS - Basic Functionality', () => {
    test('should render confirmation modal with default props', () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Test Title"
          message="Test message"
        />
      );

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByTestId('confirmation-cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('confirmation-confirm-button')).toBeInTheDocument();
    });

    test('should render different modal types with appropriate styling', () => {
      const types = ['danger', 'warning', 'info', 'success'] as const;
      
      types.forEach(type => {
        const { unmount } = render(
          <ConfirmationModal
            isOpen={true}
            onClose={jest.fn()}
            onConfirm={jest.fn()}
            title="Test"
            message="Test"
            type={type}
            testId={`modal-${type}`}
          />
        );

        const modal = screen.getByTestId(`modal-${type}`);
        const confirmButton = screen.getByTestId(`modal-${type}-confirm-button`);
        
        expect(modal).toBeInTheDocument();
        
        // Check type-specific button classes
        const typeClassMap = {
          danger: 'bg-red-600',
          warning: 'bg-yellow-600',
          info: 'bg-blue-600',
          success: 'bg-green-600'
        };
        
        expect(confirmButton.className).toContain(typeClassMap[type]);
        unmount();
      });
    });

    test('should display icons for each modal type', () => {
      const types = ['danger', 'warning', 'info', 'success'] as const;
      
      types.forEach(type => {
        const { unmount } = render(
          <ConfirmationModal
            isOpen={true}
            onClose={jest.fn()}
            onConfirm={jest.fn()}
            title="Test"
            message="Test"
            type={type}
            showIcon={true}
            testId={`modal-${type}`}
          />
        );

        const icon = screen.getByTestId(`modal-${type}-icon`);
        expect(icon).toBeInTheDocument();
        
        // Check icon-specific classes
        const iconClassMap = {
          danger: 'text-red-600',
          warning: 'text-yellow-600',
          info: 'text-blue-600',
          success: 'text-green-600'
        };
        
        expect(icon.className).toContain(iconClassMap[type]);
        unmount();
      });
    });

    test('should hide icon when showIcon is false', () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Test"
          message="Test"
          showIcon={false}
        />
      );

      expect(screen.queryByTestId('confirmation-modal-icon')).not.toBeInTheDocument();
    });

    test('should use custom button labels', () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Test"
          message="Test"
          cancelLabel="No Thanks"
          confirmLabel="Yes Please"
        />
      );

      expect(screen.getByText('No Thanks')).toBeInTheDocument();
      expect(screen.getByText('Yes Please')).toBeInTheDocument();
    });

    test('should render without cancel button when hideCancelButton is true', () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Test"
          message="Test"
          hideCancelButton={true}
        />
      );

      expect(screen.queryByTestId('confirmation-cancel-button')).not.toBeInTheDocument();
      expect(screen.getByTestId('confirmation-confirm-button')).toBeInTheDocument();
    });

    test('should render custom message content when provided as JSX', () => {
      const customMessage = (
        <div>
          <p data-testid="custom-message-1">First paragraph</p>
          <p data-testid="custom-message-2">Second paragraph</p>
        </div>
      );

      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Test"
          message={customMessage}
        />
      );

      expect(screen.getByTestId('custom-message-1')).toBeInTheDocument();
      expect(screen.getByTestId('custom-message-2')).toBeInTheDocument();
    });
  });

  describe('✅ POSITIVE TESTS - User Interactions', () => {
    test('should call onConfirm when confirm button is clicked', async () => {
      const onConfirm = jest.fn();
      const onClose = jest.fn();

      render(
        <ConfirmationModal
          isOpen={true}
          onClose={onClose}
          onConfirm={onConfirm}
          title="Test"
          message="Test"
        />
      );

      await user.click(screen.getByTestId('confirmation-confirm-button'));
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });

    test('should call onClose when cancel button is clicked', async () => {
      const onConfirm = jest.fn();
      const onClose = jest.fn();

      render(
        <ConfirmationModal
          isOpen={true}
          onClose={onClose}
          onConfirm={onConfirm}
          title="Test"
          message="Test"
        />
      );

      await user.click(screen.getByTestId('confirmation-cancel-button'));
      
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    test('should handle loading state on confirm button', async () => {
      const TestLoadingModal = () => {
        const [loading, setLoading] = useState(false);
        
        const handleConfirm = async () => {
          setLoading(true);
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 100));
          setLoading(false);
        };

        return (
          <ConfirmationModal
            isOpen={true}
            onClose={jest.fn()}
            onConfirm={handleConfirm}
            title="Test"
            message="Test"
            loading={loading}
            loadingText="Processing..."
          />
        );
      };

      render(<TestLoadingModal />);
      
      const confirmButton = screen.getByTestId('confirmation-confirm-button');
      
      await user.click(confirmButton);
      
      // Should show loading state
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(confirmButton).toBeDisabled();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      });
    });

    test('should disable buttons when disabled prop is true', () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Test"
          message="Test"
          disabled={true}
        />
      );

      expect(screen.getByTestId('confirmation-cancel-button')).toBeDisabled();
      expect(screen.getByTestId('confirmation-confirm-button')).toBeDisabled();
    });

    test('should focus confirm button by default', async () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Test"
          message="Test"
          autoFocusButton="confirm"
        />
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByTestId('confirmation-confirm-button'));
      });
    });

    test('should focus cancel button when specified', async () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Test"
          message="Test"
          autoFocusButton="cancel"
        />
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByTestId('confirmation-cancel-button'));
      });
    });

    test('should handle Enter key press on confirm button', async () => {
      const onConfirm = jest.fn();
      
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={onConfirm}
          title="Test"
          message="Test"
        />
      );

      const confirmButton = screen.getByTestId('confirmation-confirm-button');
      confirmButton.focus();
      
      await user.keyboard('{Enter}');
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    test('should handle Escape key press', async () => {
      const onClose = jest.fn();
      
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={onClose}
          onConfirm={jest.fn()}
          title="Test"
          message="Test"
        />
      );

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('✅ POSITIVE TESTS - Convenience Components', () => {
    test('should render DangerConfirmationModal with danger styling', () => {
      render(
        <DangerConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Delete Item"
          message="This action cannot be undone."
        />
      );

      const confirmButton = screen.getByTestId('confirmation-confirm-button');
      expect(confirmButton.className).toContain('bg-red-600');
      expect(screen.getByTestId('confirmation-modal-icon')).toHaveClass('text-red-600');
    });

    test('should render WarningConfirmationModal with warning styling', () => {
      render(
        <WarningConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Warning"
          message="This might have side effects."
        />
      );

      const confirmButton = screen.getByTestId('confirmation-confirm-button');
      expect(confirmButton.className).toContain('bg-yellow-600');
      expect(screen.getByTestId('confirmation-modal-icon')).toHaveClass('text-yellow-600');
    });

    test('should render InfoConfirmationModal with info styling', () => {
      render(
        <InfoConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Information"
          message="Here's some information."
        />
      );

      const confirmButton = screen.getByTestId('confirmation-confirm-button');
      expect(confirmButton.className).toContain('bg-blue-600');
      expect(screen.getByTestId('confirmation-modal-icon')).toHaveClass('text-blue-600');
    });

    test('should render SuccessConfirmationModal with success styling', () => {
      render(
        <SuccessConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Success"
          message="Operation completed successfully."
        />
      );

      const confirmButton = screen.getByTestId('confirmation-confirm-button');
      expect(confirmButton.className).toContain('bg-green-600');
      expect(screen.getByTestId('confirmation-modal-icon')).toHaveClass('text-green-600');
    });

    test('should allow overriding props in convenience components', () => {
      render(
        <DangerConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Custom Title"
          message="Custom message"
          confirmLabel="Delete Now"
          cancelLabel="Keep It"
          showIcon={false}
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom message')).toBeInTheDocument();
      expect(screen.getByText('Delete Now')).toBeInTheDocument();
      expect(screen.getByText('Keep It')).toBeInTheDocument();
      expect(screen.queryByTestId('confirmation-modal-icon')).not.toBeInTheDocument();
    });
  });

  describe('❌ NEGATIVE TESTS - Edge Cases and Error Handling', () => {
    test('should not call onConfirm when button is disabled', async () => {
      const onConfirm = jest.fn();
      
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={onConfirm}
          title="Test"
          message="Test"
          disabled={true}
        />
      );

      await user.click(screen.getByTestId('confirmation-confirm-button'));
      expect(onConfirm).not.toHaveBeenCalled();
    });

    test('should not call onClose when cancel button is disabled', async () => {
      const onClose = jest.fn();
      
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={onClose}
          onConfirm={jest.fn()}
          title="Test"
          message="Test"
          disabled={true}
        />
      );

      await user.click(screen.getByTestId('confirmation-cancel-button'));
      expect(onClose).not.toHaveBeenCalled();
    });

    test('should not call onConfirm when loading', async () => {
      const onConfirm = jest.fn();
      
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={onConfirm}
          title="Test"
          message="Test"
          loading={true}
        />
      );

      await user.click(screen.getByTestId('confirmation-confirm-button'));
      expect(onConfirm).not.toHaveBeenCalled();
    });

    test('should handle missing onConfirm prop gracefully', async () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={undefined as any}
          title="Test"
          message="Test"
        />
      );

      expect(() => {
        screen.getByTestId('confirmation-confirm-button').click();
      }).not.toThrow();
    });

    test('should handle missing onClose prop gracefully', async () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={undefined as any}
          onConfirm={jest.fn()}
          title="Test"
          message="Test"
        />
      );

      expect(() => {
        screen.getByTestId('confirmation-cancel-button').click();
      }).not.toThrow();
    });

    test('should handle invalid type prop', () => {
      console.error = jest.fn(); // Suppress console errors
      
      expect(() => {
        render(
          <ConfirmationModal
            isOpen={true}
            onClose={jest.fn()}
            onConfirm={jest.fn()}
            title="Test"
            message="Test"
            type={'invalid-type' as any}
          />
        );
      }).not.toThrow();
    });

    test('should handle empty message gracefully', () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Test"
          message=""
        />
      );

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });

    test('should handle null message gracefully', () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Test"
          message={null as any}
        />
      );

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });

    test('should handle rapid button clicks gracefully', async () => {
      const onConfirm = jest.fn();
      
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={onConfirm}
          title="Test"
          message="Test"
        />
      );

      const confirmButton = screen.getByTestId('confirmation-confirm-button');
      
      // Rapid clicks
      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);
      
      expect(onConfirm).toHaveBeenCalledTimes(3);
    });

    test('should handle custom testId prop', () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Test"
          message="Test"
          testId="custom-confirmation"
        />
      );

      expect(screen.getByTestId('custom-confirmation')).toBeInTheDocument();
      expect(screen.getByTestId('custom-confirmation-confirm-button')).toBeInTheDocument();
      expect(screen.getByTestId('custom-confirmation-cancel-button')).toBeInTheDocument();
    });
  });

  describe('🔄 Integration Tests', () => {
    test('should work with wrapper component state management', async () => {
      const onConfirm = jest.fn();
      
      render(<TestConfirmationWrapper modalProps={{ onConfirm }} />);
      
      // Modal should not be visible initially
      expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
      
      // Open modal
      await user.click(screen.getByTestId('open-modal'));
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      
      // Confirm should close modal
      await user.click(screen.getByTestId('confirmation-confirm-button'));
      expect(onConfirm).toHaveBeenCalled();
    });

    test('should work with async confirm handlers', async () => {
      const asyncConfirm = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const TestAsyncModal = () => {
        const [loading, setLoading] = useState(false);
        
        const handleConfirm = async () => {
          setLoading(true);
          try {
            await asyncConfirm();
          } finally {
            setLoading(false);
          }
        };

        return (
          <ConfirmationModal
            isOpen={true}
            onClose={jest.fn()}
            onConfirm={handleConfirm}
            title="Async Test"
            message="This will take a moment"
            loading={loading}
          />
        );
      };

      render(<TestAsyncModal />);
      
      await user.click(screen.getByTestId('confirmation-confirm-button'));
      
      // Should show loading state
      expect(screen.getByTestId('confirmation-confirm-button')).toBeDisabled();
      
      // Wait for async operation to complete
      await waitFor(() => {
        expect(asyncConfirm).toHaveBeenCalled();
      });
    });

    test('should integrate with form validation', async () => {
      const TestFormValidationModal = () => {
        const [hasError, setHasError] = useState(true);
        
        return (
          <>
            <input 
              data-testid="validation-input"
              onChange={(e) => setHasError(e.target.value.length < 3)}
            />
            <ConfirmationModal
              isOpen={true}
              onClose={jest.fn()}
              onConfirm={jest.fn()}
              title="Validate Form"
              message="Please ensure form is valid"
              disabled={hasError}
            />
          </>
        );
      };

      render(<TestFormValidationModal />);
      
      // Initially disabled due to validation error
      expect(screen.getByTestId('confirmation-confirm-button')).toBeDisabled();
      
      // Fill input to make form valid
      await user.type(screen.getByTestId('validation-input'), 'valid');
      
      // Button should now be enabled
      expect(screen.getByTestId('confirmation-confirm-button')).not.toBeDisabled();
    });

    test('should handle keyboard navigation between buttons', async () => {
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Test"
          message="Test"
        />
      );

      const cancelButton = screen.getByTestId('confirmation-cancel-button');
      const confirmButton = screen.getByTestId('confirmation-confirm-button');

      // Focus should start on cancel button
      await waitFor(() => {
        expect(document.activeElement).toBe(cancelButton);
      });

      // Tab to confirm button
      await user.tab();
      expect(document.activeElement).toBe(confirmButton);

      // Shift+Tab back to cancel
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(cancelButton);
    });
  });
});