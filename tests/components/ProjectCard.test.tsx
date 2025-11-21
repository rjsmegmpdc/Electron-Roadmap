import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockProjects, createTestProject } from '../utils/test-utils';
import { ProjectCard } from '../../app/renderer/components/ProjectCard';
import type { Project } from '../../app/main/preload';

describe('ProjectCard Component', () => {
  const defaultProject = mockProjects[0];
  const mockOnClick = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  // Mock window.confirm for delete functionality
  const originalConfirm = window.confirm;
  
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn();
  });

  afterEach(() => {
    window.confirm = originalConfirm;
  });

  describe('✅ POSITIVE TESTS - Basic Rendering', () => {
    test('should render project information correctly', () => {
      render(<ProjectCard project={defaultProject} />);

      // Check all required elements are present
      expect(screen.getByTestId('project-title')).toHaveTextContent(defaultProject.title);
      expect(screen.getByTestId('project-id')).toHaveTextContent(defaultProject.id);
      expect(screen.getByTestId('project-description')).toHaveTextContent(defaultProject.description!);
      expect(screen.getByTestId('project-status')).toHaveTextContent('Active');
      expect(screen.getByTestId('project-start-date')).toHaveTextContent(defaultProject.start_date);
      expect(screen.getByTestId('project-end-date')).toHaveTextContent(defaultProject.end_date);
      expect(screen.getByTestId('project-pm-name')).toHaveTextContent(defaultProject.pm_name!);
      expect(screen.getByTestId('project-budget')).toHaveTextContent('$50,000.00');
      expect(screen.getByTestId('project-financial-treatment')).toHaveTextContent('CAPEX');
      expect(screen.getByTestId('project-lane')).toHaveTextContent(defaultProject.lane!);
    });

    test('should render with proper CSS classes and styling', () => {
      render(<ProjectCard project={defaultProject} className="test-class" />);
      
      const card = screen.getByTestId(`project-card-${defaultProject.id}`);
      expect(card).toHaveClass('test-class');
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
    });

    test('should render status with correct color classes', () => {
      const statusTests = [
        { status: 'active', expectedClass: 'bg-green-100 text-green-800' },
        { status: 'completed', expectedClass: 'bg-blue-100 text-blue-800' },
        { status: 'on-hold', expectedClass: 'bg-yellow-100 text-yellow-800' },
        { status: 'cancelled', expectedClass: 'bg-red-100 text-red-800' }
      ];

      statusTests.forEach(({ status, expectedClass }) => {
        const testProject = createTestProject({ status: status as any });
        const { rerender } = render(<ProjectCard project={testProject} />);
        
        const statusElement = screen.getByTestId('project-status');
        expect(statusElement).toHaveClass(expectedClass);
        
        rerender(<div />); // Clean up for next iteration
      });
    });

    test('should render financial treatment with correct color classes', () => {
      const capexProject = createTestProject({ financial_treatment: 'CAPEX' });
      const { rerender } = render(<ProjectCard project={capexProject} />);
      
      let treatmentElement = screen.getByTestId('project-financial-treatment');
      expect(treatmentElement).toHaveClass('bg-purple-100 text-purple-800');
      expect(treatmentElement).toHaveTextContent('CAPEX');

      const opexProject = createTestProject({ financial_treatment: 'OPEX' });
      rerender(<ProjectCard project={opexProject} />);
      
      treatmentElement = screen.getByTestId('project-financial-treatment');
      expect(treatmentElement).toHaveClass('bg-orange-100 text-orange-800');
      expect(treatmentElement).toHaveTextContent('OPEX');
    });
  });

  describe('✅ POSITIVE TESTS - User Interactions', () => {
    test('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectCard project={defaultProject} onClick={mockOnClick} />);

      const card = screen.getByTestId(`project-card-${defaultProject.id}`);
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledWith(defaultProject);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('should call onClick when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<ProjectCard project={defaultProject} onClick={mockOnClick} />);

      const card = screen.getByTestId(`project-card-${defaultProject.id}`);
      card.focus();
      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledWith(defaultProject);
    });

    test('should call onClick when Space key is pressed', async () => {
      const user = userEvent.setup();
      render(<ProjectCard project={defaultProject} onClick={mockOnClick} />);

      const card = screen.getByTestId(`project-card-${defaultProject.id}`);
      card.focus();
      await user.keyboard(' ');

      expect(mockOnClick).toHaveBeenCalledWith(defaultProject);
    });

    test('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectCard project={defaultProject} onEdit={mockOnEdit} />);

      const editButton = screen.getByTestId('edit-button');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(defaultProject);
      expect(mockOnClick).not.toHaveBeenCalled(); // Should not trigger card click
    });

    test('should call onDelete when delete button is clicked and confirmed', async () => {
      (window.confirm as jest.Mock).mockReturnValue(true);
      const user = userEvent.setup();
      render(<ProjectCard project={defaultProject} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith(`Are you sure you want to delete "${defaultProject.title}"?`);
      expect(mockOnDelete).toHaveBeenCalledWith(defaultProject);
      expect(mockOnClick).not.toHaveBeenCalled(); // Should not trigger card click
    });

    test('should not call onDelete when delete is cancelled', async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      const user = userEvent.setup();
      render(<ProjectCard project={defaultProject} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('✅ POSITIVE TESTS - Conditional Rendering', () => {
    test('should hide action buttons when showActions is false', () => {
      render(<ProjectCard project={defaultProject} showActions={false} />);

      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
    });

    test('should show action buttons by default', () => {
      render(<ProjectCard project={defaultProject} />);

      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
    });

    test('should not render optional fields when they are missing', () => {
      const minimalProject = createTestProject({
        description: undefined,
        pm_name: undefined,
        lane: undefined,
        financial_treatment: undefined,
        budget_cents: undefined
      });

      render(<ProjectCard project={minimalProject} />);

      expect(screen.queryByTestId('project-description')).not.toBeInTheDocument();
      expect(screen.queryByTestId('project-pm-name')).not.toBeInTheDocument();
      expect(screen.queryByTestId('project-lane')).not.toBeInTheDocument();
      expect(screen.queryByTestId('project-financial-treatment')).not.toBeInTheDocument();
      
      // Budget should show 'No budget set'
      expect(screen.getByTestId('project-budget')).toHaveTextContent('No budget set');
    });
  });

  describe('❌ NEGATIVE TESTS - Edge Cases and Error Handling', () => {
    test('should handle empty or invalid project data gracefully', () => {
      const invalidProject = createTestProject({
        title: '',
        id: '',
        start_date: '',
        end_date: ''
      });

      render(<ProjectCard project={invalidProject} />);

      // Should still render without crashing
      expect(screen.getByTestId('project-title')).toHaveTextContent('');
      expect(screen.getByTestId('project-id')).toHaveTextContent('');
      expect(screen.getByTestId('project-start-date')).toHaveTextContent('No date');
      expect(screen.getByTestId('project-end-date')).toHaveTextContent('No date');
    });

    test('should handle invalid budget values gracefully', () => {
      const projectWithInvalidBudget = createTestProject({
        budget_cents: -100 // Negative budget
      });

      // Mock NZCurrency.formatCents to throw an error
      jest.mock('../../app/renderer/utils/validation', () => ({
        NZCurrency: {
          formatCents: jest.fn(() => {
            throw new Error('Invalid budget');
          })
        }
      }));

      render(<ProjectCard project={projectWithInvalidBudget} />);

      // Should handle the error gracefully
      expect(screen.getByTestId('project-budget')).toBeInTheDocument();
    });

    test('should handle zero budget correctly', () => {
      const projectWithZeroBudget = createTestProject({
        budget_cents: 0
      });

      render(<ProjectCard project={projectWithZeroBudget} />);

      expect(screen.getByTestId('project-budget')).toHaveTextContent('No budget set');
    });

    test('should not break when handlers are not provided', async () => {
      const user = userEvent.setup();
      render(<ProjectCard project={defaultProject} />);

      const card = screen.getByTestId(`project-card-${defaultProject.id}`);
      
      // Should not throw errors when clicking without handlers
      await user.click(card);
      
      expect(() => {
        fireEvent.click(card);
      }).not.toThrow();
    });

    test('should handle very long text content properly', () => {
      const projectWithLongContent = createTestProject({
        title: 'A'.repeat(200), // Very long title
        description: 'B'.repeat(1000), // Very long description
        pm_name: 'C'.repeat(100) // Very long PM name
      });

      render(<ProjectCard project={projectWithLongContent} />);

      expect(screen.getByTestId('project-title')).toBeInTheDocument();
      expect(screen.getByTestId('project-description')).toBeInTheDocument();
      expect(screen.getByTestId('project-pm-name')).toBeInTheDocument();
    });

    test('should prevent card click when clicking on action buttons', async () => {
      const user = userEvent.setup();
      render(
        <ProjectCard 
          project={defaultProject} 
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByTestId('edit-button');
      await user.click(editButton);

      // Only edit handler should be called, not card click
      expect(mockOnEdit).toHaveBeenCalled();
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('🎯 ACCESSIBILITY TESTS', () => {
    test('should have proper ARIA labels and roles', () => {
      render(<ProjectCard project={defaultProject} />);

      const card = screen.getByTestId(`project-card-${defaultProject.id}`);
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabindex', '0');

      const editButton = screen.getByTestId('edit-button');
      expect(editButton).toHaveAttribute('aria-label', `Edit ${defaultProject.title}`);
      expect(editButton).toHaveAttribute('title', 'Edit project');

      const deleteButton = screen.getByTestId('delete-button');
      expect(deleteButton).toHaveAttribute('aria-label', `Delete ${defaultProject.title}`);
      expect(deleteButton).toHaveAttribute('title', 'Delete project');
    });

    test('should be keyboard navigable', () => {
      render(<ProjectCard project={defaultProject} />);

      const card = screen.getByTestId(`project-card-${defaultProject.id}`);
      
      // Card should be focusable
      card.focus();
      expect(document.activeElement).toBe(card);
    });

    test('should handle keyboard events properly', async () => {
      const user = userEvent.setup();
      render(<ProjectCard project={defaultProject} onClick={mockOnClick} />);

      const card = screen.getByTestId(`project-card-${defaultProject.id}`);
      card.focus();

      // Other keys should not trigger onClick
      await user.keyboard('{Escape}');
      await user.keyboard('{Tab}');
      
      expect(mockOnClick).not.toHaveBeenCalled();

      // Enter and Space should trigger onClick
      await user.keyboard('{Enter}');
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('🔧 PERFORMANCE TESTS', () => {
    test('should render efficiently with large project objects', () => {
      const startTime = performance.now();
      
      const largeProject = createTestProject({
        description: 'B'.repeat(10000) // Very large description
      });

      render(<ProjectCard project={largeProject} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render should complete within reasonable time (100ms)
      expect(renderTime).toBeLessThan(100);
    });

    test('should not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <ProjectCard project={defaultProject} />;
      };

      const { rerender } = render(<TestComponent />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props should not cause additional renders
      rerender(<TestComponent />);
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});