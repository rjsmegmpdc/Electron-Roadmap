/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import * as ModalExports from '../../../app/renderer/components/modals';

describe('Modal Index Exports', () => {
  describe('✅ POSITIVE TESTS - Export Verification', () => {
    test('should export BaseModal component', () => {
      expect(ModalExports.BaseModal).toBeDefined();
      expect(typeof ModalExports.BaseModal).toBe('function');
    });

    test('should export ConfirmationModal component', () => {
      expect(ModalExports.ConfirmationModal).toBeDefined();
      expect(typeof ModalExports.ConfirmationModal).toBe('function');
    });

    test('should export FormModal component', () => {
      expect(ModalExports.FormModal).toBeDefined();
      expect(typeof ModalExports.FormModal).toBe('function');
    });

    test('should export convenience confirmation modal components', () => {
      expect(ModalExports.DangerConfirmationModal).toBeDefined();
      expect(ModalExports.WarningConfirmationModal).toBeDefined();
      expect(ModalExports.InfoConfirmationModal).toBeDefined();
      expect(ModalExports.SuccessConfirmationModal).toBeDefined();
      
      expect(typeof ModalExports.DangerConfirmationModal).toBe('function');
      expect(typeof ModalExports.WarningConfirmationModal).toBe('function');
      expect(typeof ModalExports.InfoConfirmationModal).toBe('function');
      expect(typeof ModalExports.SuccessConfirmationModal).toBe('function');
    });

    test('should export TypeScript types', () => {
      // These types should be available for import even if not runtime values
      // This test verifies the module structure allows proper TypeScript imports
      const moduleKeys = Object.keys(ModalExports);
      
      // Verify core components are exported
      expect(moduleKeys).toContain('BaseModal');
      expect(moduleKeys).toContain('ConfirmationModal');
      expect(moduleKeys).toContain('FormModal');
      
      // Verify convenience components are exported
      expect(moduleKeys).toContain('DangerConfirmationModal');
      expect(moduleKeys).toContain('WarningConfirmationModal');
      expect(moduleKeys).toContain('InfoConfirmationModal');
      expect(moduleKeys).toContain('SuccessConfirmationModal');
    });
  });

  describe('✅ POSITIVE TESTS - Component Functionality', () => {
    test('should render BaseModal from index export', () => {
      const { BaseModal } = ModalExports;
      
      render(
        <BaseModal isOpen={true} onClose={jest.fn()} title="Test">
          <div data-testid="test-content">Content</div>
        </BaseModal>
      );

      expect(screen.getByTestId('base-modal')).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    test('should render ConfirmationModal from index export', () => {
      const { ConfirmationModal } = ModalExports;
      
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          title="Confirm"
          message="Are you sure?"
        />
      );

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    test('should render FormModal from index export', () => {
      const { FormModal } = ModalExports;
      
      render(
        <FormModal
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          title="Form"
        >
          <input data-testid="form-input" />
        </FormModal>
      );

      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('form-input')).toBeInTheDocument();
    });

    test('should render convenience modals from index exports', () => {
      const { 
        DangerConfirmationModal,
        WarningConfirmationModal,
        InfoConfirmationModal,
        SuccessConfirmationModal 
      } = ModalExports;

      // Test each convenience modal
      const modals = [
        { Component: DangerConfirmationModal, testId: 'danger-modal' },
        { Component: WarningConfirmationModal, testId: 'warning-modal' },
        { Component: InfoConfirmationModal, testId: 'info-modal' },
        { Component: SuccessConfirmationModal, testId: 'success-modal' }
      ];

      modals.forEach(({ Component, testId }) => {
        const { unmount } = render(
          <Component
            isOpen={true}
            onClose={jest.fn()}
            onConfirm={jest.fn()}
            title="Test"
            message="Test message"
            testId={testId}
          />
        );

        expect(screen.getByTestId(testId)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('❌ NEGATIVE TESTS - Import Safety', () => {
    test('should handle undefined imports gracefully', () => {
      // Verify that accessing non-existent exports doesn't break
      const nonExistentExport = (ModalExports as any).NonExistentModal;
      expect(nonExistentExport).toBeUndefined();
    });

    test('should have proper default exports structure', () => {
      // Verify the module exports are structured correctly
      expect(ModalExports).toBeDefined();
      expect(typeof ModalExports).toBe('object');
      expect(ModalExports).not.toBeNull();
    });
  });

  describe('🔄 Integration Tests', () => {
    test('should allow using multiple modal components together', () => {
      const { BaseModal, ConfirmationModal, FormModal } = ModalExports;
      
      render(
        <>
          <BaseModal 
            isOpen={true} 
            onClose={jest.fn()} 
            title="Base" 
            testId="base-modal-integration"
          >
            <div>Base Content</div>
          </BaseModal>
          
          <ConfirmationModal
            isOpen={true}
            onClose={jest.fn()}
            onConfirm={jest.fn()}
            title="Confirm"
            message="Confirm message"
            testId="confirmation-modal-integration"
          />
          
          <FormModal
            isOpen={true}
            onClose={jest.fn()}
            onSubmit={jest.fn()}
            title="Form"
            testId="form-modal-integration"
          >
            <input />
          </FormModal>
        </>
      );

      expect(screen.getByTestId('base-modal-integration')).toBeInTheDocument();
      expect(screen.getByTestId('confirmation-modal-integration')).toBeInTheDocument();
      expect(screen.getByTestId('form-modal-integration')).toBeInTheDocument();
    });

    test('should maintain component props and functionality through exports', () => {
      const { ConfirmationModal } = ModalExports;
      const onConfirm = jest.fn();
      const onClose = jest.fn();
      
      render(
        <ConfirmationModal
          isOpen={true}
          onClose={onClose}
          onConfirm={onConfirm}
          title="Test Export Props"
          message="Testing prop functionality"
          type="danger"
          showIcon={true}
        />
      );

      // Verify component renders with proper props
      expect(screen.getByText('Test Export Props')).toBeInTheDocument();
      expect(screen.getByText('Testing prop functionality')).toBeInTheDocument();
      
      // Verify icon is shown (danger type)
      expect(screen.getByTestId('confirmation-modal-icon')).toBeInTheDocument();
      
      // Verify button styling (danger type should have red button)
      const confirmButton = screen.getByTestId('confirmation-confirm-button');
      expect(confirmButton.className).toContain('bg-red-600');
    });
  });

  describe('📋 Documentation Tests', () => {
    test('should provide consistent component interfaces', () => {
      const { BaseModal, ConfirmationModal, FormModal } = ModalExports;
      
      // All modal components should be React components (functions)
      expect(typeof BaseModal).toBe('function');
      expect(typeof ConfirmationModal).toBe('function');
      expect(typeof FormModal).toBe('function');
      
      // Components should have proper displayName (if set)
      if (BaseModal.displayName) {
        expect(typeof BaseModal.displayName).toBe('string');
      }
      if (ConfirmationModal.displayName) {
        expect(typeof ConfirmationModal.displayName).toBe('string');
      }
      if (FormModal.displayName) {
        expect(typeof FormModal.displayName).toBe('string');
      }
    });

    test('should export all documented modal variants', () => {
      // Verify all documented modal types are available
      const expectedExports = [
        'BaseModal',
        'ConfirmationModal', 
        'FormModal',
        'DangerConfirmationModal',
        'WarningConfirmationModal',
        'InfoConfirmationModal',
        'SuccessConfirmationModal'
      ];

      expectedExports.forEach(exportName => {
        expect(ModalExports).toHaveProperty(exportName);
        expect(typeof (ModalExports as any)[exportName]).toBe('function');
      });
    });
  });
});