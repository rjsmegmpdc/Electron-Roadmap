import React, { useEffect, useCallback, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface BaseModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to call when modal should be closed */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Size of the modal */
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'fullscreen';
  /** Whether clicking backdrop should close modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape should close modal */
  closeOnEscape?: boolean;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Custom CSS classes for modal container */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Aria label for accessibility */
  ariaLabel?: string;
  /** Aria described by for accessibility */
  ariaDescribedBy?: string;
  /** Custom z-index for modal */
  zIndex?: number;
  /** Whether to disable scroll on body when modal is open */
  disableBodyScroll?: boolean;
  /** Custom backdrop opacity */
  backdropOpacity?: number;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Whether to focus first element on open */
  autoFocus?: boolean;
  /** Whether to restore focus on close */
  restoreFocus?: boolean;
}

interface ModalSizeConfig {
  container: string;
  content: string;
}

const SIZE_CONFIGS: Record<NonNullable<BaseModalProps['size']>, ModalSizeConfig> = {
  small: {
    container: 'max-w-md',
    content: 'p-6'
  },
  medium: {
    container: 'max-w-lg',
    content: 'p-6'
  },
  large: {
    container: 'max-w-2xl',
    content: 'p-8'
  },
  xlarge: {
    container: 'max-w-4xl',
    content: 'p-8'
  },
  fullscreen: {
    container: 'max-w-none w-full h-full',
    content: 'p-8'
  }
};

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  testId = 'base-modal',
  ariaLabel,
  ariaDescribedBy,
  zIndex = 50,
  disableBodyScroll = true,
  backdropOpacity = 0.5,
  animationDuration = 200,
  autoFocus = true,
  restoreFocus = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
    }
  }, [isOpen]);

  // Handle body scroll
  useEffect(() => {
    if (!disableBodyScroll) return;

    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, disableBodyScroll]);

  // Handle escape key
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [onClose, closeOnEscape]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, handleEscapeKey]);

  // Focus management
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!modalRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const focusableElements = modalRef.current.querySelectorAll(
      focusableSelectors.join(', ')
    ) as NodeListOf<HTMLElement>;

    return Array.from(focusableElements);
  }, []);

  // Handle focus trap
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab - moving backward
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab - moving forward
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [getFocusableElements]);

  useEffect(() => {
    if (!isOpen) return;

    // Set up focus trap
    document.addEventListener('keydown', handleTabKey);

    // Auto focus first element
    if (autoFocus) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        firstElement.focus();
        firstFocusableRef.current = firstElement;
        lastFocusableRef.current = focusableElements[focusableElements.length - 1];
      }
    }

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      
      // Restore focus
      if (restoreFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleTabKey, getFocusableElements, autoFocus, restoreFocus]);

  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  }, [onClose, closeOnBackdropClick]);

  const handleCloseClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onClose();
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  // Handle invalid size prop gracefully
  const validSize = SIZE_CONFIGS[size] ? size : 'medium';
  const sizeConfig = SIZE_CONFIGS[validSize];
  const modalContent = (
    <div
      className={`fixed inset-0 z-${zIndex} overflow-y-auto`}
      style={{ zIndex }}
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title || ''}
      aria-describedby={ariaDescribedBy}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{ 
          backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
          transitionDuration: `${animationDuration}ms`
        }}
        onClick={handleBackdropClick}
        data-testid={`${testId}-backdrop`}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          ref={modalRef}
          className={`
            relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all
            ${sizeConfig.container}
            ${className}
          `}
          style={{ 
            transitionDuration: `${animationDuration}ms`
          }}
          data-testid={`${testId}-container`}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div 
              className="flex items-center justify-between border-b border-gray-200 px-6 py-4"
              data-testid={`${testId}-header`}
            >
              {title && (
                <h2 
                  className="text-lg font-semibold text-gray-900"
                  data-testid={`${testId}-title`}
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={handleCloseClick}
                  className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  data-testid={`${testId}-close-button`}
                  aria-label="Close modal"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div 
            className={sizeConfig.content}
            data-testid={`${testId}-content`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
};

export default BaseModal;