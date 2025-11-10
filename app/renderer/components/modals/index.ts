// Base modal component
export { BaseModal } from './BaseModal';
export type { BaseModalProps } from './BaseModal';

// Confirmation modal component
export { 
  ConfirmationModal,
  DangerConfirmationModal,
  WarningConfirmationModal,
  InfoConfirmationModal,
  SuccessConfirmationModal
} from './ConfirmationModal';
export type { ConfirmationModalProps } from './ConfirmationModal';

// Form modal component
export { FormModal } from './FormModal';
export type { FormModalProps } from './FormModal';

// Re-export common types and utilities
export type ModalSize = 'small' | 'medium' | 'large' | 'xlarge' | 'fullscreen';
export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';