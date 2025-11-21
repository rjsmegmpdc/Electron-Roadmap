import React, { ReactNode, useState } from 'react';
import { BaseModal, BaseModalProps } from './BaseModal';

export interface FormModalProps extends Omit<BaseModalProps, 'children'> {
  /** Form content */
  children: ReactNode;
  /** Whether form is currently submitting */
  submitting?: boolean;
  /** Loading text to display */
  loadingText?: string;
  /** Form submit handler */
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  /** Whether to show form actions footer */
  showActions?: boolean;
  /** Text for submit button */
  submitLabel?: string;
  /** Text for cancel button */
  cancelLabel?: string;
  /** Whether to disable buttons */
  disabled?: boolean;
  /** Whether to hide cancel button */
  hideCancelButton?: boolean;
  /** Function called when user cancels (defaults to onClose) */
  onCancel?: () => void;
  /** Whether to prevent closing while submitting */
  preventCloseWhileSubmitting?: boolean;
  /** Error to display */
  error?: string | React.ReactNode | null;
  /** Custom footer content */
  customFooter?: ReactNode;
  /** Whether to auto-focus first input */
  autoFocusFirstInput?: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({
  children,
  submitting = false,
  loadingText = 'Submitting...',
  onSubmit,
  showActions = true,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  disabled = false,
  hideCancelButton = false,
  onCancel,
  preventCloseWhileSubmitting = true,
  error = null,
  customFooter,
  autoFocusFirstInput = true,
  testId = 'form-modal',
  size = 'medium',
  closeOnBackdropClick = false,
  closeOnEscape = true,
  ...modalProps
}) => {
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);
    
    if (onSubmit) {
      try {
        await onSubmit(event);
        setHasSubmitted(false);
      } catch (error) {
        console.error('Form submission error:', error);
        setHasSubmitted(false);
        throw error;
      }
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (modalProps.onClose) {
      modalProps.onClose();
    }
  };

  const handleSubmitButtonClick = () => {
    // Trigger form submit by finding and clicking the form's submit button
    // or dispatching a submit event
    const form = document.querySelector(`[data-testid="${testId}"] form`) as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  const isFormDisabled = submitting || hasSubmitted || disabled;
  const canClose = !preventCloseWhileSubmitting || !isFormDisabled;

  // Default submit button renderer
  const defaultSubmitButton = (props: {
    isSubmitting: boolean;
    disabled: boolean;
    onClick: () => void;
    text: string;
  }) => (
    <button
      type="submit"
      form={`${testId}-form`}
      disabled={props.disabled}
      className={`
        inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${props.disabled 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700'
        }
      `}
      data-testid={`${testId}-submit-button`}
    >
      {props.isSubmitting ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </>
      ) : (
        props.text
      )}
    </button>
  );

  // Default cancel button renderer
  const defaultCancelButton = (props: {
    isSubmitting: boolean;
    disabled: boolean;
    onClick: () => void;
    text: string;
  }) => (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      data-testid={`${testId}-cancel-button`}
    >
      {props.text}
    </button>
  );

  return (
    <BaseModal
      {...modalProps}
      testId={testId}
      size={size}
      closeOnBackdropClick={closeOnBackdropClick && canClose}
      closeOnEscape={closeOnEscape && canClose}
    >
      {/* Form Error */}
      {error && (
        <div 
          className="mb-4 bg-red-50 border border-red-200 rounded-md p-4"
          data-testid={`${testId}-error`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-red-800">
                {typeof error === 'string' ? error : error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <form
        id={`${testId}-form`}
        onSubmit={handleSubmit}
        noValidate
        data-testid={`${testId}-form`}
        aria-disabled={isFormDisabled}
      >
        <fieldset disabled={isFormDisabled}>
          {children}
        </fieldset>
      </form>

      {/* Form Actions */}
      {customFooter ? (
        customFooter
      ) : showActions ? (
        <div 
          className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0"
          data-testid={`${testId}-actions`}
        >
          {/* Cancel Button */}
          {!hideCancelButton && (
            defaultCancelButton({
              isSubmitting: isFormDisabled,
              disabled: isFormDisabled,
              onClick: handleCancel,
              text: cancelLabel
            })
          )}

          {/* Submit Button */}
          {defaultSubmitButton({
            isSubmitting: isFormDisabled,
            disabled: isFormDisabled,
            onClick: handleSubmitButtonClick,
            text: submitLabel
          })}
        </div>
      ) : null}
    </BaseModal>
  );
};

export default FormModal;