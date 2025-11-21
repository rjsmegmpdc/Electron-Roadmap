/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectForm } from '../../../app/renderer/components/ProjectForm';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '../../../app/main/preload';

// Mock project data for testing
const mockProject: Project = {
  id: 1,
  title: 'Test Project',
  description: 'Test description',
  lane: 'Development',
  start_date: '01-01-2024',
  end_date: '31-12-2024',
  status: 'active',
  pm_name: 'John Doe',
  budget_cents: 100000, // $1,000.00
  financial_treatment: 'CAPEX',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

// Mock success response
const mockSuccessResponse = {
  success: true as const,
  project: mockProject
};

// Mock error response
const mockErrorResponse = {
  success: false as const,
  errors: ['Validation error occurred']
};

describe('ProjectForm Integration Tests', () => {
  let mockOnSubmit: jest.Mock;
  let mockOnCancel: jest.Mock;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mockOnSubmit = jest.fn();
    mockOnCancel = jest.fn();
    user = userEvent.setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create form with correct title and empty fields', () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('form-title')).toHaveTextContent('Create New Project');
      expect(screen.getByTestId('title-input')).toHaveValue('');
      expect(screen.getByTestId('description-input')).toHaveValue('');
      expect(screen.getByTestId('lane-input')).toHaveValue('');
      expect(screen.getByTestId('start-date-input')).toHaveValue('');
      expect(screen.getByTestId('end-date-input')).toHaveValue('');
      expect(screen.getByTestId('status-input')).toHaveValue('active');
      expect(screen.getByTestId('pm-name-input')).toHaveValue('');
      expect(screen.getByTestId('budget-input')).toHaveValue('');
      expect(screen.getByTestId('financial-treatment-input')).toHaveValue('CAPEX');
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Create Project');
    });

    it('validates required fields on submit', async () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('title-errors')).toBeInTheDocument();
        expect(screen.getByTestId('start-date-errors')).toBeInTheDocument();
        expect(screen.getByTestId('end-date-errors')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates field formats correctly', async () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // Test invalid date format
      const startDateInput = screen.getByTestId('start-date-input');
      await user.type(startDateInput, 'invalid-date');
      await user.tab(); // trigger onBlur

      await waitFor(() => {
        expect(screen.getByTestId('start-date-errors')).toHaveTextContent('Start date must be in DD-MM-YYYY format');
      });

      // Test invalid budget format
      const budgetInput = screen.getByTestId('budget-input');
      await user.type(budgetInput, 'invalid-amount');
      await user.tab(); // trigger onBlur

      await waitFor(() => {
        expect(screen.getByTestId('budget-errors')).toHaveTextContent('Budget must be a valid NZD amount');
      });
    });

    it('validates date range correctly', async () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const startDateInput = screen.getByTestId('start-date-input');
      const endDateInput = screen.getByTestId('end-date-input');

      // Set end date before start date
      await user.type(startDateInput, '31-12-2024');
      await user.type(endDateInput, '01-01-2024');
      await user.tab(); // trigger onBlur for end date

      await waitFor(() => {
        expect(screen.getByTestId('end-date-errors')).toHaveTextContent('End date must be after start date');
      });
    });

    it('validates field length limits', async () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // Test title length limit
      const titleInput = screen.getByTestId('title-input');
      const longTitle = 'a'.repeat(201);
      await user.type(titleInput, longTitle);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('title-errors')).toHaveTextContent('Project title must be 200 characters or less');
      });

      // Test description length limit
      const descriptionInput = screen.getByTestId('description-input');
      const longDescription = 'a'.repeat(1001);
      await user.type(descriptionInput, longDescription);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('description-errors')).toHaveTextContent('Description must be 1000 characters or less');
      });
    });

    it('submits valid create data correctly', async () => {
      mockOnSubmit.mockResolvedValue(mockSuccessResponse);

      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in required fields
      await user.type(screen.getByTestId('title-input'), 'Test Project');
      await user.type(screen.getByTestId('description-input'), 'Test description');
      await user.type(screen.getByTestId('lane-input'), 'Development');
      await user.type(screen.getByTestId('start-date-input'), '01-01-2024');
      await user.type(screen.getByTestId('end-date-input'), '31-12-2024');
      await user.selectOptions(screen.getByTestId('status-input'), 'active');
      await user.type(screen.getByTestId('pm-name-input'), 'John Doe');
      await user.type(screen.getByTestId('budget-input'), '1,000.00');
      await user.selectOptions(screen.getByTestId('financial-treatment-input'), 'CAPEX');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Test Project',
          description: 'Test description',
          lane: 'Development',
          start_date: '01-01-2024',
          end_date: '31-12-2024',
          status: 'active',
          pm_name: 'John Doe',
          budget_nzd: '1,000.00',
          financial_treatment: 'CAPEX'
        });
      });
    });

    it('handles empty optional fields correctly', async () => {
      mockOnSubmit.mockResolvedValue(mockSuccessResponse);

      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // Fill only required fields
      await user.type(screen.getByTestId('title-input'), 'Test Project');
      await user.type(screen.getByTestId('start-date-input'), '01-01-2024');
      await user.type(screen.getByTestId('end-date-input'), '31-12-2024');

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Test Project',
          description: undefined,
          lane: undefined,
          start_date: '01-01-2024',
          end_date: '31-12-2024',
          status: 'active',
          pm_name: undefined,
          budget_nzd: undefined,
          financial_treatment: 'CAPEX'
        });
      });
    });
  });

  describe('Edit Mode', () => {
    it('renders edit form with correct title and populated fields', () => {
      render(
        <ProjectForm
          mode="edit"
          initialProject={mockProject}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('form-title')).toHaveTextContent('Edit Project');
      expect(screen.getByTestId('title-input')).toHaveValue('Test Project');
      expect(screen.getByTestId('description-input')).toHaveValue('Test description');
      expect(screen.getByTestId('lane-input')).toHaveValue('Development');
      expect(screen.getByTestId('start-date-input')).toHaveValue('01-01-2024');
      expect(screen.getByTestId('end-date-input')).toHaveValue('31-12-2024');
      expect(screen.getByTestId('status-input')).toHaveValue('active');
      expect(screen.getByTestId('pm-name-input')).toHaveValue('John Doe');
      expect(screen.getByTestId('budget-input')).toHaveValue('1,000.00');
      expect(screen.getByTestId('financial-treatment-input')).toHaveValue('CAPEX');
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Save Changes');
    });

    it('handles budget_cents conversion correctly', () => {
      const projectWithBudget: Project = {
        ...mockProject,
        budget_cents: 125050 // $1,250.50
      };

      render(
        <ProjectForm
          mode="edit"
          initialProject={projectWithBudget}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('budget-input')).toHaveValue('1,250.50');
    });

    it('handles null budget_cents correctly', () => {
      const projectWithoutBudget: Project = {
        ...mockProject,
        budget_cents: null
      };

      render(
        <ProjectForm
          mode="edit"
          initialProject={projectWithoutBudget}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('budget-input')).toHaveValue('');
    });

    it('submits valid edit data correctly', async () => {
      mockOnSubmit.mockResolvedValue(mockSuccessResponse);

      render(
        <ProjectForm
          mode="edit"
          initialProject={mockProject}
          onSubmit={mockOnSubmit}
        />
      );

      // Modify a field
      const titleInput = screen.getByTestId('title-input');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Project');

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          id: 1,
          title: 'Updated Project',
          description: 'Test description',
          lane: 'Development',
          start_date: '01-01-2024',
          end_date: '31-12-2024',
          status: 'active',
          pm_name: 'John Doe',
          budget_nzd: '1,000.00',
          financial_treatment: 'CAPEX'
        });
      });
    });
  });

  describe('Loading State', () => {
    it('disables form elements when loading', () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('title-input')).toBeDisabled();
      expect(screen.getByTestId('description-input')).toBeDisabled();
      expect(screen.getByTestId('submit-button')).toBeDisabled();
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Creating...');
    });

    it('shows correct loading text for edit mode', () => {
      render(
        <ProjectForm
          mode="edit"
          initialProject={mockProject}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('submit-button')).toHaveTextContent('Saving...');
    });
  });

  describe('Error Handling', () => {
    it('displays server-side validation errors', async () => {
      const errorResponse = {
        success: false as const,
        errors: [
          'Title is already taken',
          'Start date is invalid',
          'Budget exceeds limit'
        ]
      };
      
      mockOnSubmit.mockResolvedValue(errorResponse);

      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      // Fill valid data
      await user.type(screen.getByTestId('title-input'), 'Test Project');
      await user.type(screen.getByTestId('start-date-input'), '01-01-2024');
      await user.type(screen.getByTestId('end-date-input'), '31-12-2024');

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('title-errors')).toHaveTextContent('Title is already taken');
        expect(screen.getByTestId('start-date-errors')).toHaveTextContent('Start date is invalid');
        expect(screen.getByTestId('budget-errors')).toHaveTextContent('Budget exceeds limit');
      });
    });

    it('displays general errors for unmapped server errors', async () => {
      const errorResponse = {
        success: false as const,
        errors: ['General server error']
      };
      
      mockOnSubmit.mockResolvedValue(errorResponse);

      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      await user.type(screen.getByTestId('title-input'), 'Test Project');
      await user.type(screen.getByTestId('start-date-input'), '01-01-2024');
      await user.type(screen.getByTestId('end-date-input'), '31-12-2024');

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('general-errors')).toHaveTextContent('General server error');
      });
    });

    it('handles unexpected submission errors', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Network error'));

      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      await user.type(screen.getByTestId('title-input'), 'Test Project');
      await user.type(screen.getByTestId('start-date-input'), '01-01-2024');
      await user.type(screen.getByTestId('end-date-input'), '31-12-2024');

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('general-errors')).toHaveTextContent('An unexpected error occurred');
      });
    });
  });

  describe('User Interactions', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByTestId('cancel-button'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('does not render cancel button when onCancel is not provided', () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument();
    });

    it('validates fields on blur (real-time validation)', async () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const titleInput = screen.getByTestId('title-input');
      await user.click(titleInput);
      await user.tab(); // move focus away without typing

      await waitFor(() => {
        expect(screen.getByTestId('title-errors')).toHaveTextContent('Project title is required');
      });
    });

    it('clears errors when field becomes valid', async () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const titleInput = screen.getByTestId('title-input');
      
      // First trigger an error
      await user.click(titleInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('title-errors')).toBeInTheDocument();
      });

      // Now fix the error
      await user.type(titleInput, 'Valid title');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByTestId('title-errors')).not.toBeInTheDocument();
      });
    });
  });

  describe('Status Options', () => {
    it('renders all status options correctly', () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const statusSelect = screen.getByTestId('status-input');
      const options = statusSelect.querySelectorAll('option');
      
      expect(options).toHaveLength(4);
      expect(options[0]).toHaveValue('active');
      expect(options[0]).toHaveTextContent('Active');
      expect(options[1]).toHaveValue('completed');
      expect(options[1]).toHaveTextContent('Completed');
      expect(options[2]).toHaveValue('on-hold');
      expect(options[2]).toHaveTextContent('On Hold');
      expect(options[3]).toHaveValue('cancelled');
      expect(options[3]).toHaveTextContent('Cancelled');
    });
  });

  describe('Financial Treatment Options', () => {
    it('renders all financial treatment options correctly', () => {
      render(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      const financialTreatmentSelect = screen.getByTestId('financial-treatment-input');
      const options = financialTreatmentSelect.querySelectorAll('option');
      
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveValue('CAPEX');
      expect(options[0]).toHaveTextContent('CAPEX - Capital Expenditure');
      expect(options[1]).toHaveValue('OPEX');
      expect(options[1]).toHaveTextContent('OPEX - Operational Expenditure');
    });
  });

  describe('Form Reset', () => {
    it('resets form data when switching from edit to create mode', () => {
      const { rerender } = render(
        <ProjectForm
          mode="edit"
          initialProject={mockProject}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('title-input')).toHaveValue('Test Project');

      rerender(
        <ProjectForm
          mode="create"
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('title-input')).toHaveValue('');
    });

    it('updates form data when initialProject changes', () => {
      const { rerender } = render(
        <ProjectForm
          mode="edit"
          initialProject={mockProject}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('title-input')).toHaveValue('Test Project');

      const updatedProject: Project = {
        ...mockProject,
        title: 'Updated Project Title'
      };

      rerender(
        <ProjectForm
          mode="edit"
          initialProject={updatedProject}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('title-input')).toHaveValue('Updated Project Title');
    });
  });
});