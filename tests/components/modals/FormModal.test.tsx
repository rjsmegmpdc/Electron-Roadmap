/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormModal } from '../../../app/renderer/components/modals/FormModal';

// Mock createPortal for testing
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

// Test wrapper component
const TestFormWrapper = ({ 
  initialOpen = false, 
  modalProps = {} 
}: { 
  initialOpen?: boolean;
  modalProps?: any;
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    modalProps.onSubmit?.(formData);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} data-testid="open-modal">
        Open Modal
      </button>
      <FormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        title="Test Form"
        {...modalProps}
      >
        <div className="space-y-4">
          <input
            data-testid="name-input"
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            data-testid="email-input"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </FormModal>
    </>
  );
};

describe('FormModal', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('✅ POSITIVE TESTS - Basic Functionality', () => {
    test('should render form modal with default props', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
        >
          <input data-testid="test-input" />
        </FormModal>
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByTestId('test-input')).toBeInTheDocument();
      expect(screen.getByTestId('form-modal-cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('form-modal-submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('form-modal-form')).toBeInTheDocument();
    });

    test('should use custom button labels', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          cancelLabel="Cancel Changes"
          submitLabel="Save Changes"
        >
          <input />
        </FormModal>
      );

      expect(screen.getByText('Cancel Changes')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    test('should hide cancel button when hideCancelButton is true', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          hideCancelButton={true}
        >
          <input />
        </FormModal>
      );

      expect(screen.queryByTestId('form-modal-cancel-button')).not.toBeInTheDocument();
      expect(screen.getByTestId('form-modal-submit-button')).toBeInTheDocument();
    });

    test('should display loading state on submit button', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          submitting={true}
          loadingText="Saving..."
        >
          <input />
        </FormModal>
      );

      const submitButton = screen.getByTestId('form-modal-submit-button');
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    test('should disable form when submitting', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          submitting={true}
        >
          <input data-testid="test-input" />
          <button data-testid="form-button">Button</button>
        </FormModal>
      );

      // Form should be disabled
      const form = screen.getByTestId('form-modal-form');
      expect(form).toHaveAttribute('aria-disabled', 'true');
      
      // Buttons should be disabled
      expect(screen.getByTestId('form-modal-submit-button')).toBeDisabled();
      expect(screen.getByTestId('form-modal-cancel-button')).toBeDisabled();
    });

    test('should disable buttons with disabled prop', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          disabled={true}
        >
          <input />
        </FormModal>
      );

      expect(screen.getByTestId('form-modal-cancel-button')).toBeDisabled();
      expect(screen.getByTestId('form-modal-submit-button')).toBeDisabled();
    });

    test('should display error message when provided', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          error="Something went wrong"
        >
          <input />
        </FormModal>
      );

      expect(screen.getByTestId('form-modal-error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    test('should render custom error JSX content', () => {
      const customError = (
        <div>
          <p data-testid="custom-error-1">Error line 1</p>
          <p data-testid="custom-error-2">Error line 2</p>
        </div>
      );

      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          error={customError}
        >
          <input />
        </FormModal>
      );

      expect(screen.getByTestId('custom-error-1')).toBeInTheDocument();
      expect(screen.getByTestId('custom-error-2')).toBeInTheDocument();
    });

    test('should render with different sizes', () => {
      const sizes = ['small', 'medium', 'large', 'xlarge'] as const;
      
      sizes.forEach(size => {
        const { unmount } = render(
          <FormModal
            isOpen={true}
            onClose={jest.fn()}
            onSubmit={jest.fn()}
            title="Test Form"
            size={size}
            testId={`form-${size}`}
          >
            <input />
          </FormModal>
        );

        expect(screen.getByTestId(`form-${size}`)).toBeInTheDocument();
        unmount();
      });
    });

    test('should render custom footer buttons', () => {
      const customFooter = (
        <div>
          <button data-testid="custom-button-1">Custom 1</button>
          <button data-testid="custom-button-2">Custom 2</button>
        </div>
      );

      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          customFooter={customFooter}
        >
          <input />
        </FormModal>
      );

      expect(screen.getByTestId('custom-button-1')).toBeInTheDocument();
      expect(screen.getByTestId('custom-button-2')).toBeInTheDocument();
      
      // Default buttons should not be rendered
      expect(screen.queryByTestId('form-modal-cancel-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('form-modal-submit-button')).not.toBeInTheDocument();
    });
  });

  describe('✅ POSITIVE TESTS - User Interactions', () => {
    test('should call onSubmit when form is submitted', async () => {
      const onSubmit = jest.fn();
      
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          title="Test Form"
        >
          <input data-testid="test-input" required />
        </FormModal>
      );

      // Fill required field
      await user.type(screen.getByTestId('test-input'), 'test value');
      
      // Submit form
      await user.click(screen.getByTestId('form-modal-submit-button'));
      
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test('should call onClose when cancel button is clicked', async () => {
      const onClose = jest.fn();
      const onSubmit = jest.fn();
      
      render(
        <FormModal
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          title="Test Form"
        >
          <input />
        </FormModal>
      );

      await user.click(screen.getByTestId('form-modal-cancel-button'));
      
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('should handle form submission with Enter key', async () => {
      const onSubmit = jest.fn();
      
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          title="Test Form"
        >
          <input data-testid="test-input" />
        </FormModal>
      );

      const input = screen.getByTestId('test-input');
      input.focus();
      
      await user.keyboard('{Enter}');
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test('should prevent form submission when disabled', async () => {
      const onSubmit = jest.fn();
      
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          title="Test Form"
          disabled={true}
        >
          <input />
        </FormModal>
      );

      await user.click(screen.getByTestId('form-modal-submit-button'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('should prevent form submission when submitting', async () => {
      const onSubmit = jest.fn();
      
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          title="Test Form"
          submitting={true}
        >
          <input />
        </FormModal>
      );

      await user.click(screen.getByTestId('form-modal-submit-button'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('should prevent modal close when submitting', async () => {
      const onClose = jest.fn();
      
      render(
        <FormModal
          isOpen={true}
          onClose={onClose}
          onSubmit={jest.fn()}
          title="Test Form"
          submitting={true}
        >
          <input />
        </FormModal>
      );

      // Try to close via escape key
      await user.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();
      
      // Try to close via backdrop click
      await user.click(screen.getByTestId('form-modal-backdrop'));
      expect(onClose).not.toHaveBeenCalled();
      
      // Try to close via cancel button
      await user.click(screen.getByTestId('form-modal-cancel-button'));
      expect(onClose).not.toHaveBeenCalled();
    });

    test('should focus first input on open', async () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          autoFocusFirstInput={true}
        >
          <input data-testid="first-input" />
          <input data-testid="second-input" />
        </FormModal>
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByTestId('first-input'));
      });
    });

    test('should validate form before submission', async () => {
      const onSubmit = jest.fn();
      
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          title="Test Form"
        >
          <input data-testid="required-input" required />
        </FormModal>
      );

      // Try to submit without filling required field
      await user.click(screen.getByTestId('form-modal-submit-button'));
      
      // Form should not submit due to HTML5 validation
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('✅ POSITIVE TESTS - Form Integration', () => {
    test('should work with complex form data', async () => {
      const onSubmit = jest.fn();
      
      render(<TestFormWrapper modalProps={{ onSubmit }} />);
      
      // Open modal
      await user.click(screen.getByTestId('open-modal'));
      
      // Fill form
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      
      // Submit form
      await user.click(screen.getByTestId('form-modal-submit-button'));
      
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    test('should handle form with async validation', async () => {
      const TestAsyncValidationModal = () => {
        const [submitting, setSubmitting] = useState(false);
        const [error, setError] = useState<string | null>(null);
        
        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setSubmitting(true);
          setError(null);
          
          // Simulate async validation
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Simulate validation error
          setError('Email already exists');
          setSubmitting(false);
        };

        return (
          <FormModal
            isOpen={true}
            onClose={jest.fn()}
            onSubmit={handleSubmit}
            title="Async Validation"
            submitting={submitting}
            error={error}
          >
            <input data-testid="email-input" type="email" required />
          </FormModal>
        );
      };

      render(<TestAsyncValidationModal />);
      
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.click(screen.getByTestId('form-modal-submit-button'));
      
      // Should show loading state
      expect(screen.getByTestId('form-modal-submit-button')).toBeDisabled();
      
      // Wait for validation to complete and show error
      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    test('should handle form with file uploads', async () => {
      const onSubmit = jest.fn();
      
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          title="File Upload"
        >
          <input data-testid="file-input" type="file" />
          <input data-testid="text-input" type="text" required />
        </FormModal>
      );

      // Fill text input
      await user.type(screen.getByTestId('text-input'), 'File description');
      
      // Mock file upload
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      await user.upload(screen.getByTestId('file-input'), file);
      
      await user.click(screen.getByTestId('form-modal-submit-button'));
      expect(onSubmit).toHaveBeenCalled();
    });

    test('should handle form with multiple sections', async () => {
      const onSubmit = jest.fn();
      
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          title="Multi-section Form"
        >
          <fieldset>
            <legend>Personal Info</legend>
            <input data-testid="name-input" placeholder="Name" required />
            <input data-testid="email-input" placeholder="Email" type="email" required />
          </fieldset>
          
          <fieldset>
            <legend>Preferences</legend>
            <select data-testid="theme-select">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <input data-testid="notifications-checkbox" type="checkbox" />
          </fieldset>
        </FormModal>
      );

      // Fill all required fields
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.selectOptions(screen.getByTestId('theme-select'), 'dark');
      await user.click(screen.getByTestId('notifications-checkbox'));
      
      await user.click(screen.getByTestId('form-modal-submit-button'));
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('❌ NEGATIVE TESTS - Edge Cases and Error Handling', () => {
    test('should handle missing onSubmit prop gracefully', async () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={undefined as any}
          title="Test Form"
        >
          <input />
        </FormModal>
      );

      expect(() => {
        screen.getByTestId('form-modal-submit-button').click();
      }).not.toThrow();
    });

    test('should handle missing onClose prop gracefully', async () => {
      render(
        <FormModal
          isOpen={true}
          onClose={undefined as any}
          onSubmit={jest.fn()}
          title="Test Form"
        >
          <input />
        </FormModal>
      );

      expect(() => {
        screen.getByTestId('form-modal-cancel-button').click();
      }).not.toThrow();
    });

    test('should handle form without inputs', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Empty Form"
        >
          <div>No inputs here</div>
        </FormModal>
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
      expect(() => {
        screen.getByTestId('form-modal-submit-button').click();
      }).not.toThrow();
    });

    test('should handle null error gracefully', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          error={null}
        >
          <input />
        </FormModal>
      );

      expect(screen.queryByTestId('form-modal-error')).not.toBeInTheDocument();
    });

    test('should handle empty error string gracefully', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          error=""
        >
          <input />
        </FormModal>
      );

      expect(screen.queryByTestId('form-modal-error')).not.toBeInTheDocument();
    });

    test('should handle invalid size prop gracefully', () => {
      console.error = jest.fn(); // Suppress console errors
      
      expect(() => {
        render(
          <FormModal
            isOpen={true}
            onClose={jest.fn()}
            onSubmit={jest.fn()}
            title="Test Form"
            size={'invalid-size' as any}
          >
            <input />
          </FormModal>
        );
      }).not.toThrow();
    });

    test('should handle rapid form submissions gracefully', async () => {
      const onSubmit = jest.fn();
      
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          title="Test Form"
        >
          <input data-testid="test-input" />
        </FormModal>
      );

      const submitButton = screen.getByTestId('form-modal-submit-button');
      
      // Rapid submissions
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      
      expect(onSubmit).toHaveBeenCalledTimes(3);
    });

    test('should handle form submission errors gracefully', async () => {
      const onSubmit = jest.fn().mockImplementation(() => {
        throw new Error('Submission failed');
      });
      
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={onSubmit}
          title="Test Form"
        >
          <input />
        </FormModal>
      );

      expect(() => {
        screen.getByTestId('form-modal-submit-button').click();
      }).not.toThrow();
    });

    test('should handle custom testId prop', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          testId="custom-form"
        >
          <input />
        </FormModal>
      );

      expect(screen.getByTestId('custom-form')).toBeInTheDocument();
      expect(screen.getByTestId('custom-form-form')).toBeInTheDocument();
      expect(screen.getByTestId('custom-form-submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('custom-form-cancel-button')).toBeInTheDocument();
    });

    test('should handle cleanup on unmount during submission', () => {
      const { unmount } = render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Test Form"
          submitting={true}
        >
          <input />
        </FormModal>
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('🔄 Integration Tests', () => {
    test('should work with external form state management', async () => {
      const TestExternalStateForm = () => {
        const [isOpen, setIsOpen] = useState(false);
        const [formData, setFormData] = useState({ value: '' });
        const [submitting, setSubmitting] = useState(false);
        
        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setSubmitting(true);
          await new Promise(resolve => setTimeout(resolve, 100));
          setSubmitting(false);
          setIsOpen(false);
        };

        return (
          <>
            <button onClick={() => setIsOpen(true)} data-testid="open-external-form">
              Open External Form
            </button>
            <FormModal
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              onSubmit={handleSubmit}
              title="External State Form"
              submitting={submitting}
            >
              <input
                data-testid="external-input"
                value={formData.value}
                onChange={(e) => setFormData({ value: e.target.value })}
              />
            </FormModal>
          </>
        );
      };

      render(<TestExternalStateForm />);
      
      await user.click(screen.getByTestId('open-external-form'));
      await user.type(screen.getByTestId('external-input'), 'external value');
      await user.click(screen.getByTestId('form-modal-submit-button'));
      
      // Should show loading and then close
      expect(screen.getByTestId('form-modal-submit-button')).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
      });
    });

    test('should integrate with form libraries (simulated)', async () => {
      const TestFormLibraryIntegration = () => {
        const [errors, setErrors] = useState<Record<string, string>>({});
        const [values, setValues] = useState({ name: '', email: '' });
        
        const validateForm = () => {
          const newErrors: Record<string, string> = {};
          if (!values.name) newErrors.name = 'Name is required';
          if (!values.email) newErrors.email = 'Email is required';
          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
        };
        
        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (!validateForm()) return;
          // Form is valid, proceed with submission
        };

        return (
          <FormModal
            isOpen={true}
            onClose={jest.fn()}
            onSubmit={handleSubmit}
            title="Form Library Integration"
            error={Object.keys(errors).length > 0 ? 'Please fix validation errors' : undefined}
          >
            <div>
              <input
                data-testid="name-input"
                value={values.name}
                onChange={(e) => setValues(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Name"
              />
              {errors.name && <span data-testid="name-error">{errors.name}</span>}
            </div>
            <div>
              <input
                data-testid="email-input"
                value={values.email}
                onChange={(e) => setValues(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
              />
              {errors.email && <span data-testid="email-error">{errors.email}</span>}
            </div>
          </FormModal>
        );
      };

      render(<TestFormLibraryIntegration />);
      
      // Try to submit without filling fields
      await user.click(screen.getByTestId('form-modal-submit-button'));
      
      // Should show validation errors
      expect(screen.getByTestId('name-error')).toBeInTheDocument();
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      expect(screen.getByText('Please fix validation errors')).toBeInTheDocument();
      
      // Fill fields to clear errors
      await user.type(screen.getByTestId('name-input'), 'John');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      
      // Submit again
      await user.click(screen.getByTestId('form-modal-submit-button'));
      
      // Errors should be cleared
      expect(screen.queryByTestId('name-error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });

    test('should handle keyboard navigation within form', async () => {
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Navigation Test"
        >
          <input data-testid="input-1" />
          <input data-testid="input-2" />
          <select data-testid="select-1">
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </select>
          <textarea data-testid="textarea-1" />
        </FormModal>
      );

      const input1 = screen.getByTestId('input-1');
      const input2 = screen.getByTestId('input-2');
      const select1 = screen.getByTestId('select-1');
      const textarea1 = screen.getByTestId('textarea-1');
      const cancelButton = screen.getByTestId('form-modal-cancel-button');
      const submitButton = screen.getByTestId('form-modal-submit-button');

      // Should start with first input focused
      await waitFor(() => {
        expect(document.activeElement).toBe(input1);
      });

      // Tab through form elements
      await user.tab();
      expect(document.activeElement).toBe(input2);

      await user.tab();
      expect(document.activeElement).toBe(select1);

      await user.tab();
      expect(document.activeElement).toBe(textarea1);

      await user.tab();
      expect(document.activeElement).toBe(cancelButton);

      await user.tab();
      expect(document.activeElement).toBe(submitButton);

      // Shift+Tab should go backwards
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(cancelButton);
    });
  });
});