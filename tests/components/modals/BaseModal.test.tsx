/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseModal } from '../../../app/renderer/components/modals/BaseModal';

// Mock createPortal for testing
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

// Test wrapper component
const TestModalWrapper = ({ 
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
      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Test Modal"
        {...modalProps}
      >
        <div data-testid="modal-content">Test Content</div>
        <button data-testid="modal-button">Modal Button</button>
        <input data-testid="modal-input" placeholder="Modal Input" />
      </BaseModal>
    </>
  );
};

describe('BaseModal', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Reset body styles before each test
    document.body.style.overflow = '';
    // Clear any existing modals
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Cleanup body styles after each test
    document.body.style.overflow = '';
    // Clear event listeners
    document.removeEventListener('keydown', jest.fn());
  });

  describe('✅ POSITIVE TESTS - Basic Functionality', () => {
    test('should render modal when isOpen is true', () => {
      render(<TestModalWrapper initialOpen={true} />);
      
      expect(screen.getByTestId('base-modal')).toBeInTheDocument();
      expect(screen.getByTestId('base-modal-title')).toHaveTextContent('Test Modal');
      expect(screen.getByTestId('modal-content')).toHaveTextContent('Test Content');
    });

    test('should not render modal when isOpen is false', () => {
      render(<TestModalWrapper initialOpen={false} />);
      
      expect(screen.queryByTestId('base-modal')).not.toBeInTheDocument();
    });

    test('should open and close modal with state changes', async () => {
      render(<TestModalWrapper />);
      
      // Modal should not be visible initially
      expect(screen.queryByTestId('base-modal')).not.toBeInTheDocument();
      
      // Open modal
      await user.click(screen.getByTestId('open-modal'));
      expect(screen.getByTestId('base-modal')).toBeInTheDocument();
    });

    test('should display title correctly', () => {
      const customTitle = 'Custom Modal Title';
      render(
        <TestModalWrapper 
          initialOpen={true} 
          modalProps={{ title: customTitle }}
        />
      );
      
      expect(screen.getByTestId('base-modal-title')).toHaveTextContent(customTitle);
    });

    test('should render close button when showCloseButton is true', () => {
      render(<TestModalWrapper initialOpen={true} modalProps={{ showCloseButton: true }} />);
      
      expect(screen.getByTestId('base-modal-close-button')).toBeInTheDocument();
    });

    test('should not render close button when showCloseButton is false', () => {
      render(<TestModalWrapper initialOpen={true} modalProps={{ showCloseButton: false }} />);
      
      expect(screen.queryByTestId('base-modal-close-button')).not.toBeInTheDocument();
    });

    test('should render with different sizes', () => {
      const sizes = ['small', 'medium', 'large', 'xlarge', 'fullscreen'] as const;
      
      sizes.forEach(size => {
        const { unmount } = render(
          <TestModalWrapper 
            initialOpen={true} 
            modalProps={{ size, testId: `modal-${size}` }}
          />
        );
        
        const modal = screen.getByTestId(`modal-${size}-container`);
        expect(modal).toBeInTheDocument();
        
        // Check size-specific classes are applied
        const sizeClassMap = {
          small: 'max-w-md',
          medium: 'max-w-lg', 
          large: 'max-w-2xl',
          xlarge: 'max-w-4xl',
          fullscreen: 'max-w-none'
        };
        
        expect(modal.className).toContain(sizeClassMap[size]);
        unmount();
      });
    });
  });

  describe('✅ POSITIVE TESTS - User Interactions', () => {
    test('should close modal when close button is clicked', async () => {
      const onClose = jest.fn();
      render(
        <BaseModal isOpen={true} onClose={onClose} title="Test">
          <div>Content</div>
        </BaseModal>
      );
      
      await user.click(screen.getByTestId('base-modal-close-button'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('should close modal when backdrop is clicked', async () => {
      const onClose = jest.fn();
      render(
        <BaseModal 
          isOpen={true} 
          onClose={onClose} 
          title="Test" 
          closeOnBackdropClick={true}
        >
          <div>Content</div>
        </BaseModal>
      );
      
      await user.click(screen.getByTestId('base-modal-backdrop'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('should close modal when Escape key is pressed', async () => {
      const onClose = jest.fn();
      render(
        <BaseModal isOpen={true} onClose={onClose} title="Test" closeOnEscape={true}>
          <div>Content</div>
        </BaseModal>
      );
      
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('should trap focus within modal', async () => {
      render(<TestModalWrapper initialOpen={true} />);
      
      const button = screen.getByTestId('modal-button');
      const input = screen.getByTestId('modal-input');
      
      // Focus should start on first focusable element
      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });
      
      // Tab should move to next focusable element
      await user.tab();
      expect(document.activeElement).toBe(input);
      
      // Tab should cycle back to first element
      await user.tab();
      expect(document.activeElement).toBe(button);
      
      // Shift+Tab should go to last element
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(input);
    });

    test('should disable body scroll when modal is open', () => {
      const { rerender } = render(
        <BaseModal isOpen={false} onClose={jest.fn()} title="Test" disableBodyScroll={true}>
          <div>Content</div>
        </BaseModal>
      );
      
      expect(document.body.style.overflow).toBe('');
      
      rerender(
        <BaseModal isOpen={true} onClose={jest.fn()} title="Test" disableBodyScroll={true}>
          <div>Content</div>
        </BaseModal>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    test('should restore body scroll when modal is closed', () => {
      document.body.style.overflow = 'auto';
      
      const { rerender } = render(
        <BaseModal isOpen={true} onClose={jest.fn()} title="Test" disableBodyScroll={true}>
          <div>Content</div>
        </BaseModal>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(
        <BaseModal isOpen={false} onClose={jest.fn()} title="Test" disableBodyScroll={true}>
          <div>Content</div>
        </BaseModal>
      );
      
      expect(document.body.style.overflow).toBe('auto');
    });
  });

  describe('✅ POSITIVE TESTS - Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(
        <BaseModal 
          isOpen={true} 
          onClose={jest.fn()} 
          title="Test Modal"
          ariaLabel="Custom aria label"
          ariaDescribedBy="description-id"
        >
          <div>Content</div>
        </BaseModal>
      );
      
      const modal = screen.getByTestId('base-modal');
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-label', 'Custom aria label');
      expect(modal).toHaveAttribute('aria-describedby', 'description-id');
    });

    test('should use title as aria-label when no custom ariaLabel provided', () => {
      render(
        <BaseModal isOpen={true} onClose={jest.fn()} title="Test Modal">
          <div>Content</div>
        </BaseModal>
      );
      
      const modal = screen.getByTestId('base-modal');
      expect(modal).toHaveAttribute('aria-label', 'Test Modal');
    });

    test('should have backdrop marked as aria-hidden', () => {
      render(
        <BaseModal isOpen={true} onClose={jest.fn()} title="Test">
          <div>Content</div>
        </BaseModal>
      );
      
      const backdrop = screen.getByTestId('base-modal-backdrop');
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });

    test('should have proper aria-label on close button', () => {
      render(
        <BaseModal isOpen={true} onClose={jest.fn()} title="Test">
          <div>Content</div>
        </BaseModal>
      );
      
      const closeButton = screen.getByTestId('base-modal-close-button');
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
  });

  describe('❌ NEGATIVE TESTS - Edge Cases and Error Handling', () => {
    test('should not close modal when closeOnBackdropClick is false', async () => {
      const onClose = jest.fn();
      render(
        <BaseModal 
          isOpen={true} 
          onClose={onClose} 
          title="Test" 
          closeOnBackdropClick={false}
        >
          <div>Content</div>
        </BaseModal>
      );
      
      await user.click(screen.getByTestId('base-modal-backdrop'));
      expect(onClose).not.toHaveBeenCalled();
    });

    test('should not close modal when closeOnEscape is false', async () => {
      const onClose = jest.fn();
      render(
        <BaseModal isOpen={true} onClose={onClose} title="Test" closeOnEscape={false}>
          <div>Content</div>
        </BaseModal>
      );
      
      await user.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();
    });

    test('should not disable body scroll when disableBodyScroll is false', () => {
      const originalOverflow = 'visible';
      document.body.style.overflow = originalOverflow;
      
      render(
        <BaseModal 
          isOpen={true} 
          onClose={jest.fn()} 
          title="Test" 
          disableBodyScroll={false}
        >
          <div>Content</div>
        </BaseModal>
      );
      
      expect(document.body.style.overflow).toBe(originalOverflow);
    });

    test('should handle missing focusable elements gracefully', () => {
      render(
        <BaseModal isOpen={true} onClose={jest.fn()} title="Test" autoFocus={true}>
          <div>No focusable content</div>
        </BaseModal>
      );
      
      // Should not throw error
      expect(screen.getByTestId('base-modal')).toBeInTheDocument();
    });

    test('should handle clicking on modal content without closing', async () => {
      const onClose = jest.fn();
      render(
        <BaseModal 
          isOpen={true} 
          onClose={onClose} 
          title="Test" 
          closeOnBackdropClick={true}
        >
          <div data-testid="modal-content">Content</div>
        </BaseModal>
      );
      
      await user.click(screen.getByTestId('modal-content'));
      expect(onClose).not.toHaveBeenCalled();
    });

    test('should handle multiple escape key presses', async () => {
      const onClose = jest.fn();
      render(
        <BaseModal isOpen={true} onClose={onClose} title="Test" closeOnEscape={true}>
          <div>Content</div>
        </BaseModal>
      );
      
      await user.keyboard('{Escape}');
      await user.keyboard('{Escape}');
      
      // Should only call once per key press
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    test('should handle non-function onClose prop', () => {
      // This tests that the component handles invalid props gracefully
      expect(() => {
        render(
          <BaseModal isOpen={true} onClose={null as any} title="Test">
            <div>Content</div>
          </BaseModal>
        );
      }).not.toThrow();
    });

    test('should handle custom zIndex values', () => {
      render(
        <BaseModal isOpen={true} onClose={jest.fn()} title="Test" zIndex={9999}>
          <div>Content</div>
        </BaseModal>
      );
      
      const modal = screen.getByTestId('base-modal');
      expect(modal.style.zIndex).toBe('9999');
    });

    test('should handle custom backdrop opacity', () => {
      render(
        <BaseModal 
          isOpen={true} 
          onClose={jest.fn()} 
          title="Test" 
          backdropOpacity={0.8}
        >
          <div>Content</div>
        </BaseModal>
      );
      
      const backdrop = screen.getByTestId('base-modal-backdrop');
      expect(backdrop.style.backgroundColor).toBe('rgba(0, 0, 0, 0.8)');
    });

    test('should handle custom animation duration', () => {
      render(
        <BaseModal 
          isOpen={true} 
          onClose={jest.fn()} 
          title="Test" 
          animationDuration={500}
        >
          <div>Content</div>
        </BaseModal>
      );
      
      const backdrop = screen.getByTestId('base-modal-backdrop');
      const container = screen.getByTestId('base-modal-container');
      
      expect(backdrop.style.transitionDuration).toBe('500ms');
      expect(container.style.transitionDuration).toBe('500ms');
    });
  });

  describe('❌ NEGATIVE TESTS - Invalid Props and Error States', () => {
    test('should handle invalid size prop gracefully', () => {
      console.error = jest.fn(); // Suppress console errors for this test
      
      expect(() => {
        render(
          <BaseModal 
            isOpen={true} 
            onClose={jest.fn()} 
            title="Test" 
            size={'invalid-size' as any}
          >
            <div>Content</div>
          </BaseModal>
        );
      }).not.toThrow();
    });

    test('should handle missing title and ariaLabel', () => {
      render(
        <BaseModal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </BaseModal>
      );
      
      const modal = screen.getByTestId('base-modal');
      expect(modal).toHaveAttribute('aria-label', '');
    });

    test('should handle rapid open/close state changes', async () => {
      const TestRapidToggle = () => {
        const [isOpen, setIsOpen] = useState(false);
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setIsOpen(prev => !prev);
          }, 10);
          
          setTimeout(() => clearInterval(interval), 100);
        }, []);
        
        return (
          <BaseModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test">
            <div>Content</div>
          </BaseModal>
        );
      };
      
      expect(() => {
        render(<TestRapidToggle />);
      }).not.toThrow();
    });

    test('should handle cleanup on unmount during open state', () => {
      const { unmount } = render(
        <BaseModal isOpen={true} onClose={jest.fn()} title="Test">
          <div>Content</div>
        </BaseModal>
      );
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('🔄 Integration Tests', () => {
    test('should work with multiple modals (stacking)', async () => {
      const TestMultipleModals = () => {
        const [modal1Open, setModal1Open] = useState(false);
        const [modal2Open, setModal2Open] = useState(false);
        
        return (
          <>
            <button onClick={() => setModal1Open(true)} data-testid="open-modal-1">
              Open Modal 1
            </button>
            <BaseModal 
              isOpen={modal1Open} 
              onClose={() => setModal1Open(false)} 
              title="Modal 1"
              testId="modal-1"
              zIndex={50}
            >
              <button 
                onClick={() => setModal2Open(true)} 
                data-testid="open-modal-2"
              >
                Open Modal 2
              </button>
            </BaseModal>
            <BaseModal 
              isOpen={modal2Open} 
              onClose={() => setModal2Open(false)} 
              title="Modal 2"
              testId="modal-2"
              zIndex={60}
            >
              <div>Modal 2 Content</div>
            </BaseModal>
          </>
        );
      };
      
      render(<TestMultipleModals />);
      
      await user.click(screen.getByTestId('open-modal-1'));
      expect(screen.getByTestId('modal-1')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('open-modal-2'));
      expect(screen.getByTestId('modal-2')).toBeInTheDocument();
      
      // Both modals should be present
      expect(screen.getByTestId('modal-1')).toBeInTheDocument();
      expect(screen.getByTestId('modal-2')).toBeInTheDocument();
    });

    test('should integrate properly with form elements', async () => {
      const handleSubmit = jest.fn();
      
      const TestFormModal = () => {
        const [isOpen, setIsOpen] = useState(true);
        
        return (
          <BaseModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Form Modal">
            <form onSubmit={handleSubmit}>
              <input data-testid="form-input" required />
              <button type="submit" data-testid="form-submit">Submit</button>
            </form>
          </BaseModal>
        );
      };
      
      render(<TestFormModal />);
      
      const input = screen.getByTestId('form-input');
      const submitButton = screen.getByTestId('form-submit');
      
      await user.type(input, 'test value');
      await user.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    test('should preserve focus correctly after modal closes', async () => {
      const TestFocusPreservation = () => {
        const [isOpen, setIsOpen] = useState(false);
        
        return (
          <>
            <button 
              data-testid="trigger-button"
              onClick={() => setIsOpen(true)}
            >
              Open Modal
            </button>
            <BaseModal 
              isOpen={isOpen} 
              onClose={() => setIsOpen(false)} 
              title="Test"
              restoreFocus={true}
            >
              <button data-testid="modal-button">Modal Button</button>
            </BaseModal>
          </>
        );
      };
      
      render(<TestFocusPreservation />);
      
      const triggerButton = screen.getByTestId('trigger-button');
      
      // Focus trigger button
      triggerButton.focus();
      expect(document.activeElement).toBe(triggerButton);
      
      // Open modal
      await user.click(triggerButton);
      
      // Focus should move to modal
      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByTestId('modal-button'));
      });
      
      // Close modal with escape
      await user.keyboard('{Escape}');
      
      // Focus should return to trigger button
      await waitFor(() => {
        expect(document.activeElement).toBe(triggerButton);
      });
    });
  });
});