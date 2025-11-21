/**
 * Tests for Task UI Components
 * 
 * Tests cover:
 * - TaskForm component rendering and validation
 * - TaskItem component display and interactions  
 * - TaskList component filtering, sorting, and selection
 * - User interactions and event handling
 * - Error handling and edge cases
 * - Accessibility features
 * - Form integration scenarios
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { TaskForm } from '../../app/renderer/components/TaskForm';
import { TaskItem } from '../../app/renderer/components/TaskItem';
import { TaskList } from '../../app/renderer/components/TaskList';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../../app/renderer/stores/taskDependencyStore';

// Mock data
const mockTask: Task = {
  id: 'task-1',
  project_id: 'project-1',
  title: 'Test Task',
  start_date: '01-01-2024',
  end_date: '31-01-2024',
  effort_hours: 40,
  status: 'in-progress',
  assigned_resources: ['John Doe', 'Jane Smith'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockTasks: Task[] = [
  mockTask,
  {
    id: 'task-2',
    project_id: 'project-1',
    title: 'Another Task',
    start_date: '15-01-2024',
    end_date: '28-02-2024',
    effort_hours: 20,
    status: 'planned',
    assigned_resources: ['Bob Wilson'],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'task-3',
    project_id: 'project-2',
    title: 'Done Task',
    start_date: '01-12-2023',
    end_date: '15-12-2023',
    effort_hours: 16,
    status: 'done',
    assigned_resources: [],
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2023-12-15T00:00:00Z'
  }
];

const mockProjects = [
  { id: 'project-1', title: 'Project Alpha' },
  { id: 'project-2', title: 'Project Beta' }
];

// Mock functions
const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();
const mockOnClick = jest.fn();
const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockOnCreateTask = jest.fn();
const mockOnSelectionChange = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TaskForm', () => {
  describe('Rendering', () => {
    it('should render create form with all fields', () => {
      render(
        <TaskForm
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Create New Task')).toBeInTheDocument();
      expect(screen.getByLabelText(/Task Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Start Date/)).toBeInTheDocument();
      expect(screen.getByLabelText(/End Date/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Effort Hours/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Assigned Resources/)).toBeInTheDocument();
      expect(screen.getByText('Create Task')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render edit form with task data', () => {
      render(
        <TaskForm
          task={mockTask}
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('01-01-2024')).toBeInTheDocument();
      expect(screen.getByDisplayValue('31-01-2024')).toBeInTheDocument();
      expect(screen.getByDisplayValue('40')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe, Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Update Task')).toBeInTheDocument();
    });

    it('should disable form when submitting', () => {
      render(
        <TaskForm
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={true}
        />
      );

      expect(screen.getByLabelText(/Task Title/)).toBeDisabled();
      expect(screen.getByTestId('task-form-submit-button')).toBeDisabled();
      expect(screen.getByTestId('task-form-cancel-button')).toBeDisabled();
    });
  });

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Try to submit empty form
      await user.click(screen.getByText('Create Task'));

      await waitFor(() => {
        expect(screen.getByText('Task title is required')).toBeInTheDocument();
        expect(screen.getByText('Start date is required')).toBeInTheDocument();
        expect(screen.getByText('End date is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate title length', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/Task Title/);
      
      // Test minimum length
      await user.type(titleInput, 'ab');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Task title must be at least 3 characters')).toBeInTheDocument();
      });

      // Test maximum length
      const longTitle = 'a'.repeat(201);
      await user.clear(titleInput);
      await user.type(titleInput, longTitle);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Task title must be less than 200 characters')).toBeInTheDocument();
      });
    });

    it('should validate date format and logic', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const startDateInput = screen.getByLabelText(/Start Date/);
      const endDateInput = screen.getByLabelText(/End Date/);

      // Test invalid date format
      await user.type(startDateInput, '2024-01-01');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid date in DD-MM-YYYY format')).toBeInTheDocument();
      });

      // Test end date before start date
      await user.clear(startDateInput);
      await user.type(startDateInput, '15-01-2024');
      await user.type(endDateInput, '10-01-2024');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
      });
    });

    it('should validate effort hours', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const effortInput = screen.getByLabelText(/Effort Hours/);

      // Test non-numeric input
      await user.type(effortInput, 'abc');
      fireEvent.blur(effortInput);

      await waitFor(() => {
        expect(screen.getByText('Effort hours must be a valid number')).toBeInTheDocument();
      });

      // Test negative number
      await user.clear(effortInput);
      await user.type(effortInput, '-10');
      fireEvent.blur(effortInput);

      await waitFor(() => {
        expect(screen.getByText('Effort hours cannot be negative')).toBeInTheDocument();
      });

      // Test excessive hours
      await user.clear(effortInput);
      await user.type(effortInput, '20000');
      fireEvent.blur(effortInput);

      await waitFor(() => {
        expect(screen.getByText('Effort hours must be less than 10,000')).toBeInTheDocument();
      });
    });

    it('should validate assigned resources format', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const resourcesInput = screen.getByLabelText(/Assigned Resources/);

      // Test too many resources
      const manyResources = Array.from({ length: 25 }, (_, i) => `Person ${i + 1}`).join(', ');
      await user.type(resourcesInput, manyResources);
      fireEvent.blur(resourcesInput);

      await waitFor(() => {
        expect(screen.getByText('Cannot assign more than 20 resources to a task')).toBeInTheDocument();
      });

      // Test long resource name
      await user.clear(resourcesInput);
      const longName = 'a'.repeat(101);
      await user.type(resourcesInput, longName);
      fireEvent.blur(resourcesInput);

      await waitFor(() => {
        expect(screen.getByText('Resource names must be less than 100 characters each')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit valid create form', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({ success: true });

      render(
        <TaskForm
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill out form
      await user.type(screen.getByLabelText(/Task Title/), 'New Task');
      await user.type(screen.getByLabelText(/Start Date/), '01-03-2024');
      await user.type(screen.getByLabelText(/End Date/), '15-03-2024');
      await user.type(screen.getByLabelText(/Effort Hours/), '24');
      await user.type(screen.getByLabelText(/Assigned Resources/), 'Alice, Bob');

      // Submit form
      await user.click(screen.getByText('Create Task'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          project_id: 'project-1',
          title: 'New Task',
          start_date: '01-03-2024',
          end_date: '15-03-2024',
          effort_hours: 24,
          status: 'planned',
          assigned_resources: ['Alice', 'Bob']
        });
      });
    });

    it('should submit valid update form', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({ success: true });

      render(
        <TaskForm
          task={mockTask}
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Update title
      const titleInput = screen.getByDisplayValue('Test Task');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task');

      // Submit form
      await user.click(screen.getByText('Update Task'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          id: 'task-1',
          project_id: 'project-1',
          title: 'Updated Task',
          start_date: '01-01-2024',
          end_date: '31-01-2024',
          effort_hours: 40,
          status: 'in-progress',
          assigned_resources: ['John Doe', 'Jane Smith']
        });
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({
        success: false,
        errors: ['Task title already exists', 'Invalid date range']
      });

      render(
        <TaskForm
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill minimal form and submit
      await user.type(screen.getByLabelText(/Task Title/), 'Duplicate Task');
      await user.type(screen.getByLabelText(/Start Date/), '01-03-2024');
      await user.type(screen.getByLabelText(/End Date/), '15-03-2024');
      await user.click(screen.getByText('Create Task'));

      await waitFor(() => {
        expect(screen.getByText('Task title already exists')).toBeInTheDocument();
      });
    });

    it('should handle cancel action', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText('Cancel'));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and ARIA attributes', () => {
      render(
        <TaskForm
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/Task Title/)).toBeRequired();
      expect(screen.getByLabelText(/Start Date/)).toBeRequired();
      expect(screen.getByLabelText(/End Date/)).toBeRequired();
      expect(screen.getByLabelText(/Status/)).toBeRequired();

      // Check for help text
      expect(screen.getByText('A clear, descriptive title for this task')).toBeInTheDocument();
      expect(screen.getByText('Estimated hours of work required')).toBeInTheDocument();
    });

    it('should announce errors with proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(
        <TaskForm
          projectId="project-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Trigger validation error
      const titleInput = screen.getByLabelText(/Task Title/);
      await user.type(titleInput, 'ab');
      await user.tab();

      await waitFor(() => {
        const errorElement = screen.getByText('Task title must be at least 3 characters');
        expect(errorElement).toHaveAttribute('role', 'alert');
        expect(errorElement).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});

describe('TaskItem', () => {
  describe('Rendering', () => {
    it('should render task information', () => {
      render(<TaskItem task={mockTask} />);

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('ID: task-1')).toBeInTheDocument();
      expect(screen.getByText('In progress')).toBeInTheDocument();
      expect(screen.getByText('01-01-2024')).toBeInTheDocument();
      expect(screen.getByText('31-01-2024')).toBeInTheDocument();
      expect(screen.getByText('40h effort')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should show project ID when showProject is true', () => {
      render(<TaskItem task={mockTask} showProject={true} />);

      expect(screen.getByText('Project: project-1')).toBeInTheDocument();
    });

    it('should render action buttons when showActions is true', () => {
      render(
        <TaskItem 
          task={mockTask} 
          showActions={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByRole('button', { name: /Edit task/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete task/i })).toBeInTheDocument();
    });

    it('should render checkbox when selection is enabled', () => {
      render(
        <TaskItem 
          task={mockTask} 
          selected={false}
          onToggleSelect={jest.fn()}
        />
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should handle tasks with no assigned resources', () => {
      const taskNoResources = { ...mockTask, assigned_resources: [] };
      render(<TaskItem task={taskNoResources} />);

      expect(screen.getByText('No resources assigned')).toBeInTheDocument();
    });

    it('should truncate long resource lists', () => {
      const taskManyResources = {
        ...mockTask,
        assigned_resources: ['Person 1', 'Person 2', 'Person 3', 'Person 4', 'Person 5']
      };
      render(<TaskItem task={taskManyResources} />);

      expect(screen.getByText('Person 1')).toBeInTheDocument();
      expect(screen.getByText('Person 2')).toBeInTheDocument();
      expect(screen.getByText('Person 3')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should display correct status colors and progress indicators', () => {
      const statuses: Array<{ status: any; expectedClass: string }> = [
        { status: 'planned', expectedClass: 'bg-blue-100 text-blue-800' },
        { status: 'in-progress', expectedClass: 'bg-yellow-100 text-yellow-800' },
        { status: 'blocked', expectedClass: 'bg-red-100 text-red-800' },
        { status: 'done', expectedClass: 'bg-green-100 text-green-800' },
        { status: 'archived', expectedClass: 'bg-gray-100 text-gray-800' }
      ];

      statuses.forEach(({ status, expectedClass }) => {
        const { rerender } = render(<TaskItem task={{ ...mockTask, status }} />);
        
        const statusElement = screen.getByTestId('task-status');
        expect(statusElement).toHaveClass(...expectedClass.split(' '));

        rerender(<div />); // Clear between tests
      });
    });

    it('should show completed status for done tasks', () => {
      const doneTask = { ...mockTask, status: 'done' as const };
      render(<TaskItem task={doneTask} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should calculate and display progress correctly', () => {
      // Test future task
      const futureTask = {
        ...mockTask,
        start_date: '01-12-2025',
        end_date: '31-12-2025'
      };
      render(<TaskItem task={futureTask} />);

      expect(screen.getByText(/Starts in \d+ days/)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup();
      render(<TaskItem task={mockTask} onClick={mockOnClick} />);

      await user.click(screen.getByTestId(`task-item-${mockTask.id}`));

      expect(mockOnClick).toHaveBeenCalledWith(mockTask);
    });

    it('should handle edit button click', async () => {
      const user = userEvent.setup();
      render(<TaskItem task={mockTask} onEdit={mockOnEdit} />);

      await user.click(screen.getByRole('button', { name: /Edit task/i }));

      expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
      expect(mockOnClick).not.toHaveBeenCalled(); // Should not trigger main click
    });

    it('should handle delete button click with confirmation', async () => {
      const user = userEvent.setup();
      // Mock window.confirm
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(<TaskItem task={mockTask} onDelete={mockOnDelete} />);

      await user.click(screen.getByRole('button', { name: /Delete task/i }));

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete task "Test Task"?'
      );
      expect(mockOnDelete).toHaveBeenCalledWith(mockTask);

      mockConfirm.mockRestore();
    });

    it('should handle checkbox selection', async () => {
      const user = userEvent.setup();
      const mockToggleSelect = jest.fn();

      render(
        <TaskItem 
          task={mockTask} 
          selected={false}
          onToggleSelect={mockToggleSelect}
        />
      );

      await user.click(screen.getByRole('checkbox'));

      expect(mockToggleSelect).toHaveBeenCalledWith(mockTask.id, true);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TaskItem task={mockTask} onClick={mockOnClick} />);

      const taskElement = screen.getByTestId(`task-item-${mockTask.id}`);
      taskElement.focus();
      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledWith(mockTask);
    });
  });
});

describe('TaskList', () => {
  describe('Rendering', () => {
    it('should render tasks list', () => {
      render(<TaskList tasks={mockTasks} />);

      expect(screen.getByText('Tasks (3)')).toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Another Task')).toBeInTheDocument();
      expect(screen.getByText('Done Task')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<TaskList tasks={[]} loading={true} />);

      expect(screen.getByRole('status')).toBeInTheDocument(); // LoadingSpinner
    });

    it('should show error state', () => {
      render(<TaskList tasks={[]} error="Failed to load tasks" />);

      expect(screen.getByText('Failed to load tasks')).toBeInTheDocument();
    });

    it('should show empty state', () => {
      render(<TaskList tasks={[]} />);

      expect(screen.getByText('No tasks found.')).toBeInTheDocument();
    });

    it('should render create button when provided', () => {
      render(<TaskList tasks={mockTasks} onCreateTask={mockOnCreateTask} />);

      expect(screen.getByText('+ Create Task')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter by status', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={mockTasks} showFilters={true} />);

      // Filter by 'done' status
      const statusSelect = screen.getByTestId('status-filter-select');
      await user.selectOptions(statusSelect, 'done');

      // Should only show done task
      expect(screen.getByText('Tasks (1)')).toBeInTheDocument();
      expect(screen.getByText('Done Task')).toBeInTheDocument();
      expect(screen.queryByText('Test Task')).not.toBeInTheDocument();
    });

    it('should filter by project', async () => {
      const user = userEvent.setup();
      render(
        <TaskList 
          tasks={mockTasks} 
          showFilters={true}
          availableProjects={mockProjects}
        />
      );

      // Filter by project-2
      const projectSelect = screen.getByTestId('project-filter-select');
      await user.selectOptions(projectSelect, 'project-2');

      // Should only show project-2 tasks
      expect(screen.getByText('Tasks (1)')).toBeInTheDocument();
      expect(screen.getByText('Done Task')).toBeInTheDocument();
      expect(screen.queryByText('Test Task')).not.toBeInTheDocument();
    });

    it('should filter by search query', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={mockTasks} showFilters={true} />);

      // Search for "Another"
      const searchInput = screen.getByTestId('task-search-input');
      await user.type(searchInput, 'Another');

      // Should only show matching task
      expect(screen.getByText('Tasks (1)')).toBeInTheDocument();
      expect(screen.getByText('Another Task')).toBeInTheDocument();
      expect(screen.queryByText('Test Task')).not.toBeInTheDocument();
    });

    it('should show filter help text when no results', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={mockTasks} showFilters={true} />);

      // Search for non-existent task
      const searchInput = screen.getByTestId('task-search-input');
      await user.type(searchInput, 'NonExistent');

      expect(screen.getByText('No tasks found.')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or search query.')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by title', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={mockTasks} showFilters={true} />);

      // Sort by title ascending
      const sortSelect = screen.getByTestId('sort-by-select');
      await user.selectOptions(sortSelect, 'title');
      
      const directionSelect = screen.getByTestId('sort-direction-select');
      await user.selectOptions(directionSelect, 'asc');

      // Tasks should be sorted alphabetically
      const taskElements = screen.getAllByTestId(/task-item-/);
      expect(taskElements[0]).toHaveTextContent('Another Task');
      expect(taskElements[1]).toHaveTextContent('Done Task');
      expect(taskElements[2]).toHaveTextContent('Test Task');
    });

    it('should sort by date', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={mockTasks} showFilters={true} />);

      // Sort by start date ascending
      const sortSelect = screen.getByTestId('sort-by-select');
      await user.selectOptions(sortSelect, 'start_date');
      
      const directionSelect = screen.getByTestId('sort-direction-select');
      await user.selectOptions(directionSelect, 'asc');

      // Tasks should be sorted by date (Done Task is oldest)
      const taskElements = screen.getAllByTestId(/task-item-/);
      expect(taskElements[0]).toHaveTextContent('Done Task');
    });
  });

  describe('Selection', () => {
    it('should handle individual task selection', async () => {
      const user = userEvent.setup();
      const selectedIds = new Set<string>();

      render(
        <TaskList 
          tasks={mockTasks}
          allowSelection={true}
          selectedTaskIds={selectedIds}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Select first task checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(
        new Set(['task-1'])
      );
    });

    it('should handle select all functionality', async () => {
      const user = userEvent.setup();
      const selectedIds = new Set<string>();

      render(
        <TaskList 
          tasks={mockTasks}
          allowSelection={true}
          selectedTaskIds={selectedIds}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Click select all button
      await user.click(screen.getByTestId('select-all-button'));

      expect(mockOnSelectionChange).toHaveBeenCalledWith(
        new Set(['task-1', 'task-2', 'task-3'])
      );
    });

    it('should show selection count', () => {
      const selectedIds = new Set(['task-1', 'task-2']);

      render(
        <TaskList 
          tasks={mockTasks}
          allowSelection={true}
          selectedTaskIds={selectedIds}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should handle create task action', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={mockTasks} onCreateTask={mockOnCreateTask} />);

      await user.click(screen.getByText('+ Create Task'));

      expect(mockOnCreateTask).toHaveBeenCalled();
    });

    it('should pass through task actions to TaskItem', async () => {
      const user = userEvent.setup();
      render(
        <TaskList 
          tasks={[mockTask]}
          onTaskClick={mockOnClick}
          onTaskEdit={mockOnEdit}
          onTaskDelete={mockOnDelete}
        />
      );

      // Click on task
      await user.click(screen.getByTestId(`task-item-${mockTask.id}`));
      expect(mockOnClick).toHaveBeenCalledWith(mockTask);

      // Click edit button
      await user.click(screen.getByRole('button', { name: /Edit task/i }));
      expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<TaskList tasks={mockTasks} />);

      expect(screen.getByRole('heading', { name: /Tasks \(3\)/ })).toBeInTheDocument();
    });

    it('should have accessible form controls', () => {
      render(
        <TaskList 
          tasks={mockTasks}
          showFilters={true}
          availableProjects={mockProjects}
        />
      );

      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Project')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort By')).toBeInTheDocument();
      expect(screen.getByLabelText('Direction')).toBeInTheDocument();
    });

    it('should have accessible search input', () => {
      render(<TaskList tasks={mockTasks} showFilters={true} />);

      const searchInput = screen.getByTestId('task-search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search tasks...');
    });
  });
});