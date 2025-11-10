import React from 'react';
import { BaseModal, BaseModalProps } from './BaseModal';

export interface ConfirmationModalProps extends Omit<BaseModalProps, 'children'> {
  /** Confirmation message to display */
  message: string | React.ReactNode;
  /** Optional detailed description */
  description?: string;
  /** Type of confirmation - affects button styling */
  type?: 'danger' | 'warning' | 'info' | 'success';
  /** Text for confirm button */
  confirmLabel?: string;
  /** Text for cancel button */
  cancelLabel?: string;
  /** Whether confirm button should be loading */
  loading?: boolean;
  /** Loading text to display */
  loadingText?: string;
  /** Function called when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Function called when user cancels (defaults to onClose) */
  onCancel?: () => void;
  /** Whether to hide cancel button */
  hideCancelButton?: boolean;
  /** Whether to disable buttons */
  disabled?: boolean;
  /** Auto focus button */
  autoFocusButton?: 'confirm' | 'cancel' | 'none';
  /** Whether to show icon for the confirmation type */
  showIcon?: boolean;
  /** Custom icon to display */
  customIcon?: React.ReactNode;
}

const TYPE_CONFIGS = {
  danger: {
    icon: (
      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    iconContainer: 'bg-red-100 rounded-full p-3',
    defaultConfirmText: 'Delete',
    defaultTitle: 'Confirm Deletion'
  },
  warning: {
    icon: (
      <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white',
    iconContainer: 'bg-yellow-100 rounded-full p-3',
    defaultConfirmText: 'Continue',
    defaultTitle: 'Warning'
  },
  info: {
    icon: (
      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
    iconContainer: 'bg-blue-100 rounded-full p-3',
    defaultConfirmText: 'OK',
    defaultTitle: 'Information'
  },
  success: {
    icon: (
      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white',
    iconContainer: 'bg-green-100 rounded-full p-3',
    defaultConfirmText: 'OK',
    defaultTitle: 'Success'
  }
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  message,
  description,
  type = 'danger',
  confirmLabel,
  cancelLabel = 'Cancel',
  loading = false,
  loadingText = 'Loading...',
  onConfirm,
  onCancel,
  hideCancelButton = false,
  disabled = false,
  autoFocusButton = 'cancel',
  showIcon = true,
  customIcon,
  title,
  testId = 'confirmation-modal',
  size = 'small',
  closeOnBackdropClick = false,
  closeOnEscape = !loading,
  ...modalProps
}) => {
  // Handle invalid type prop gracefully
  const validType = TYPE_CONFIGS[type] ? type : 'danger';
  const typeConfig = TYPE_CONFIGS[validType];
  const modalTitle = title || typeConfig.defaultTitle;
  const confirmButtonText = confirmLabel || typeConfig.defaultConfirmText;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error in confirmation action:', error);
      // Allow the parent to handle the error
      throw error;
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      modalProps.onClose();
    }
  };

  return (
    <BaseModal
      {...modalProps}
      title={modalTitle}
      size={size}
      testId={testId}
      closeOnBackdropClick={closeOnBackdropClick && !isLoading}
      closeOnEscape={closeOnEscape}
      showCloseButton={false}
    >
      <div className="sm:flex sm:items-start">
        {/* Icon */}
        {showIcon && (
          <div 
            className={`mx-auto flex-shrink-0 flex items-center justify-center sm:mx-0 sm:h-10 sm:w-10 ${typeConfig.iconContainer}`}
            data-testid={`${testId}-icon`}
          >
            {customIcon || typeConfig.icon}
          </div>
        )}

        {/* Content */}
        <div className={`mt-3 text-center sm:mt-0 ${showIcon ? 'sm:ml-4' : ''} sm:text-left`}>
        {/* Message */}
          <div className="mt-2">
            {typeof message === 'string' ? (
              <p 
                className="text-sm text-gray-900 font-medium"
                data-testid={`${testId}-message`}
              >
                {message}
              </p>
            ) : (
              <div data-testid={`${testId}-message`}>
                {message}
              </div>
            )}
            {description && (
              <p 
                className="text-sm text-gray-500 mt-2"
                data-testid={`${testId}-description`}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || disabled}
          className={`
            w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium shadow-sm
            focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            ${typeConfig.confirmButton}
          `}
          data-testid={`${testId}-confirm-button`}
          autoFocus={autoFocusButton === 'confirm'}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {loadingText}
            </>
          ) : (
            confirmButtonText
          )}
        </button>

        {/* Cancel Button */}
        {!hideCancelButton && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading || disabled}
            className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={`${testId}-cancel-button`}
            autoFocus={autoFocusButton === 'cancel'}
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </BaseModal>
  );
};

// Convenience components for specific types
export const DangerConfirmationModal: React.FC<Omit<ConfirmationModalProps, 'type'>> = (props) => (
  <ConfirmationModal {...props} type="danger" />
);

export const WarningConfirmationModal: React.FC<Omit<ConfirmationModalProps, 'type'>> = (props) => (
  <ConfirmationModal {...props} type="warning" />
);

export const InfoConfirmationModal: React.FC<Omit<ConfirmationModalProps, 'type'>> = (props) => (
  <ConfirmationModal {...props} type="info" />
);

export const SuccessConfirmationModal: React.FC<Omit<ConfirmationModalProps, 'type'>> = (props) => (
  <ConfirmationModal {...props} type="success" />
);

export default ConfirmationModal;