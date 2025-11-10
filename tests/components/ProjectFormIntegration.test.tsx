/**
 * Integration tests for ProjectForm with validated input components
 * 
 * Tests cover:
 * - Form rendering with new input components
 * - Backward compatibility with existing behavior
 * - Field validation integration
 * - Form submission with validation
 * - Error handling and display
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { ProjectForm } from '../../app/renderer/components/ProjectForm';
import type { Project, CreateProjectRequest, ProjectStatus, FinancialTreatment } from '../../app/main/preload';

// Mock the validation utilities
jest.mock('../../app/renderer/utils/validation', () => ({
  NZDate: {
    validate: jest.fn((dateString: string) => /^\d{2}-\d{2}-\d{4}$/.test(dateString)),
    parse: jest.fn((dateString: string) => new Date()),
    format: jest.fn((date: Date) => '01-01-2025'),
    formatFromCents: jest.fn((cents: number) => '$1,000.00')
  },
  NZCurrency: {
    validate: jest.fn((value: string) => /^[\d,]+(?:\.\d{1,2})?$/.test(value)),
    parseToNumber: jest.fn((value: string) => 1000),
    format: jest.fn((amount: number) => '1,000.00'),
    formatFromCents: jest.fn((cents: number) => '1,000.00')
  }
}));

const mockProject: Project = {
  id: 'test-project-1',
  title: 'Test Project',
  description: 'Test project description',
  lane: 'Development',
  start_date: '01-01-2025',
  end_date: '31-12-2025',
  status: 'active' as ProjectStatus,
  pm_name: 'John Doe',
  budget_cents: 100000, // $1000.00
  financial_treatment: 'CAPEX' as FinancialTreatment,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

beforeEach(() => {
  mockOnSubmit.mockClear();
  mockOnCancel.mockClear();
  mockOnSubmit.mockResolvedValue({ success: true });
});

describe('ProjectForm Integration with Validated Components', () => {
  describe('Form Rendering', () => {
    it('should render all form fields using new input components', () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Verify all form fields are rendered
      expect(screen.getByLabelText('Project Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Lane')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Financial Treatment')).toBeInTheDocument();
      expect(screen.getByLabelText('Project Manager')).toBeInTheDocument();
      expect(screen.getByLabelText('Budget (NZD)')).toBeInTheDocument();
    });

    it('should display required field indicators', () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // Check for required field indicators (*)
      const requiredFields = screen.getAllByText('*');
      expect(requiredFields.length).toBeGreaterThan(0);
    });

    it('should populate fields when editing existing project', () => {
      render(
        <ProjectForm
          mode="edit"
          initialProject={mockProject}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test project description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Development')).toBeInTheDocument();
      expect(screen.getByDisplayValue('01-01-2025')).toBeInTheDocument();
      expect(screen.getByDisplayValue('31-12-2025')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle text input changes', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const titleInput = screen.getByLabelText('Project Title');
      await user.type(titleInput, 'New Project Title');

      expect(titleInput).toHaveValue('New Project Title');
    });

    it('should handle date input formatting', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const startDateInput = screen.getByLabelText('Start Date');
      await user.type(startDateInput, '01012025');

      // DateInput should format the input
      expect(startDateInput).toHaveValue('01-01-2025');
    });

    it('should handle currency input formatting', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const budgetInput = screen.getByLabelText('Budget (NZD)');
      await user.type(budgetInput, '1500');
      await user.tab(); // Trigger blur to format

      // CurrencyInput should format the value
      expect(budgetInput).toHaveValue('1,500');
    });

    it('should handle select input changes', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const statusSelect = screen.getByLabelText('Status');
      await user.selectOptions(statusSelect, 'completed');

      expect(statusSelect).toHaveValue('completed');
    });
  });

  describe('Validation Integration', () => {
    it('should display validation errors on form submission', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Create Project' });
      await user.click(submitButton);

      // Should show validation errors for required fields
      await waitFor(() => {
        expect(screen.getByText('Project title is required')).toBeInTheDocument();
        expect(screen.getByText('Start date is required')).toBeInTheDocument();
        expect(screen.getByText('End date is required')).toBeInTheDocument();
      });
    });

    it('should show field-level validation errors on blur', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const titleInput = screen.getByLabelText('Project Title');
      await user.click(titleInput);
      await user.tab(); // Blur without entering text

      await waitFor(() => {
        expect(screen.getByText('Project title is required')).toBeInTheDocument();
      });
    });

    it('should clear validation errors when field becomes valid', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const titleInput = screen.getByLabelText('Project Title');
      await user.click(titleInput);
      await user.tab(); // Trigger required validation error

      await waitFor(() => {
        expect(screen.getByText('Project title is required')).toBeInTheDocument();
      });

      // Now enter valid text
      await user.type(titleInput, 'Valid Title');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText('Project title is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit valid form data', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in required fields
      await user.type(screen.getByLabelText('Project Title'), 'Test Project');
      await user.type(screen.getByLabelText('Start Date'), '01-01-2025');
      await user.type(screen.getByLabelText('End Date'), '31-12-2025');

      const submitButton = screen.getByRole('button', { name: 'Create Project' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Project',
            start_date: '01-01-2025',
            end_date: '31-12-2025',
            status: 'active', // Default value
            financial_treatment: 'CAPEX' // Default value
          })
        );
      });
    });

    it('should handle server validation errors', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce({
        success: false,
        errors: ['Project title already exists', 'Invalid date range']
      });

      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // Fill and submit form
      await user.type(screen.getByLabelText('Project Title'), 'Duplicate Project');
      await user.type(screen.getByLabelText('Start Date'), '01-01-2025');
      await user.type(screen.getByLabelText('End Date'), '31-12-2025');

      const submitButton = screen.getByRole('button', { name: 'Create Project' });
      await user.click(submitButton);

      // Should display server errors
      await waitFor(() => {
        expect(screen.getByText('Project title already exists')).toBeInTheDocument();
        expect(screen.getByText('Invalid date range')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form accessibility attributes', () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('noValidate');

      // Check that inputs have proper labels
      const titleInput = screen.getByLabelText('Project Title');
      expect(titleInput).toHaveAccessibleName('Project Title');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // Should be able to tab through all form inputs
      await user.tab();
      expect(screen.getByLabelText('Project Title')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Description')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Lane')).toHaveFocus();
    });
  });

  describe('Loading States', () => {
    it('should disable form inputs when loading', () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      expect(screen.getByLabelText('Project Title')).toBeDisabled();
      expect(screen.getByLabelText('Description')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
    });

    it('should show loading state on submit button', async () => {
      const user = userEvent.setup();
      let resolveSubmit: (value: any) => void;
      const submitPromise = new Promise(resolve => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);

      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // Fill and submit form
      await user.type(screen.getByLabelText('Project Title'), 'Test Project');
      await user.type(screen.getByLabelText('Start Date'), '01-01-2025');
      await user.type(screen.getByLabelText('End Date'), '31-12-2025');

      const submitButton = screen.getByRole('button', { name: 'Create Project' });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();

      // Resolve the promise
      resolveSubmit!({ success: true });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Project' })).not.toBeDisabled();
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain same data-testid attributes', () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // Verify that test IDs are preserved for existing tests
      expect(screen.getByTestId('project-form')).toBeInTheDocument();
      expect(screen.getByTestId('form-title')).toBeInTheDocument();
      expect(screen.getByTestId('title-input')).toBeInTheDocument();
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
      expect(screen.getByTestId('lane-input')).toBeInTheDocument();
      expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
      expect(screen.getByTestId('end-date-input')).toBeInTheDocument();
      expect(screen.getByTestId('status-input')).toBeInTheDocument();
      expect(screen.getByTestId('financial-treatment-input')).toBeInTheDocument();
      expect(screen.getByTestId('pm-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('budget-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('should maintain same form submission interface', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // Fill and submit form
      await user.type(screen.getByLabelText('Project Title'), 'Test Project');
      await user.type(screen.getByLabelText('Description'), 'Test description');
      await user.type(screen.getByLabelText('Lane'), 'Development');
      await user.type(screen.getByLabelText('Start Date'), '01-01-2025');
      await user.type(screen.getByLabelText('End Date'), '31-12-2025');
      await user.type(screen.getByLabelText('Project Manager'), 'John Doe');
      await user.type(screen.getByLabelText('Budget (NZD)'), '1000.00');

      const submitButton = screen.getByRole('button', { name: 'Create Project' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Project',
            description: 'Test description',
            lane: 'Development',
            start_date: '01-01-2025',
            end_date: '31-12-2025',
            status: 'active',
            pm_name: 'John Doe',
            budget_nzd: '1,000.00',
            financial_treatment: 'CAPEX'
          })
        );
      });
    });
  });
});