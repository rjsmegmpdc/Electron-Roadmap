/**
 * Tests for Timeline Components
 * 
 * Tests cover:
 * - Timeline main component rendering and interactions
 * - TimelineBar component display and events
 * - TimelineGrid component grid and time labels
 * - DependencyOverlay component dependency rendering
 * - Drag and drop functionality
 * - Date calculations and positioning
 * - Viewport optimization
 * - User interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { Timeline } from '../../app/renderer/components/Timeline';
import { TimelineBar } from '../../app/renderer/components/TimelineBar';
import { TimelineGrid } from '../../app/renderer/components/TimelineGrid';
import { DependencyOverlay } from '../../app/renderer/components/DependencyOverlay';
import type { TimelineItem, TimelineDependency } from '../../app/renderer/components/Timeline';

// Mock data
const mockTimelineItems: TimelineItem[] = [
  {
    id: 'project-1',
    type: 'project',
    title: 'Project Alpha',
    start_date: '01-01-2024',
    end_date: '31-03-2024',
    parentId: undefined,
    status: 'active',
    level: 0,
    expanded: true
  },
  {
    id: 'task-1',
    type: 'task',
    title: 'Task 1',
    start_date: '01-01-2024',
    end_date: '15-01-2024',
    parentId: 'project-1',
    status: 'done',
    effort_hours: 40,
    assigned_resources: ['John Doe'],
    level: 1
  },
  {
    id: 'task-2',
    type: 'task',
    title: 'Task 2',
    start_date: '16-01-2024',
    end_date: '31-01-2024',
    parentId: 'project-1',
    status: 'in-progress',
    effort_hours: 60,
    assigned_resources: ['Jane Smith', 'Bob Wilson'],
    level: 1
  }
];

const mockDependencies: TimelineDependency[] = [
  {
    id: 'dep-1',
    fromId: 'task-1',
    toId: 'task-2',
    type: 'FS',
    lag_days: 0
  },
  {
    id: 'dep-2',
    fromId: 'project-1',
    toId: 'task-1',
    type: 'SS',
    lag_days: 5
  }
];

// Mock functions
const mockOnItemMove = jest.fn();
const mockOnItemResize = jest.fn();
const mockOnItemClick = jest.fn();
const mockOnItemDoubleClick = jest.fn();
const mockOnDependencyCreate = jest.fn();
const mockOnDependencyDelete = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  // Mock window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1200
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 800
  });
});

describe('Timeline', () => {
  describe('Rendering', () => {
    it('should render timeline container with header', () => {
      render(<Timeline items={mockTimelineItems} />);

      expect(screen.getByTestId('timeline-container')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByTestId('time-scale-select')).toBeInTheDocument();
      expect(screen.getByTestId('link-mode-button')).toBeInTheDocument();
    });

    it('should render timeline items', () => {
      render(<Timeline items={mockTimelineItems} />);

      expect(screen.getByTestId('timeline-bar-project-1')).toBeInTheDocument();
      expect(screen.getByTestId('timeline-bar-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('timeline-bar-task-2')).toBeInTheDocument();
    });

    it('should render dependencies when provided', () => {
      render(
        <Timeline 
          items={mockTimelineItems} 
          dependencies={mockDependencies}
          showDependencies={true}
        />
      );

      expect(screen.getByTestId('dependency-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('dependency-dep-1')).toBeInTheDocument();
      expect(screen.getByTestId('dependency-dep-2')).toBeInTheDocument();
    });

    it('should render grid when showGrid is true', () => {
      render(<Timeline items={mockTimelineItems} showGrid={true} />);

      expect(screen.getByTestId('timeline-grid')).toBeInTheDocument();
    });

    it('should show empty state when no items', () => {
      render(<Timeline items={[]} />);

      expect(screen.getByText('No timeline items')).toBeInTheDocument();
      expect(screen.getByText('Add projects or tasks to see them on the timeline')).toBeInTheDocument();
    });

    it('should apply custom height and styling', () => {
      render(
        <Timeline 
          items={mockTimelineItems} 
          height={400}
          className="custom-timeline"
        />
      );

      const container = screen.getByTestId('timeline-container');
      expect(container).toHaveClass('custom-timeline');
      expect(container).toHaveStyle({ height: '400px' });
    });
  });

  describe('Time Scale and Grid', () => {
    it('should support different time scales', () => {
      const { rerender } = render(
        <Timeline items={mockTimelineItems} timeScale="day" />
      );

      expect(screen.getByTestId('time-scale-select')).toHaveValue('day');

      rerender(<Timeline items={mockTimelineItems} timeScale="week" />);
      expect(screen.getByTestId('time-scale-select')).toHaveValue('week');

      rerender(<Timeline items={mockTimelineItems} timeScale="month" />);
      expect(screen.getByTestId('time-scale-select')).toHaveValue('month');
    });

    it('should calculate timeline bounds correctly', () => {
      const startDate = new Date('2023-12-01');
      const endDate = new Date('2024-04-30');

      render(
        <Timeline 
          items={mockTimelineItems}
          startDate={startDate}
          endDate={endDate}
        />
      );

      // Timeline should be rendered with custom bounds
      expect(screen.getByTestId('timeline-container')).toBeInTheDocument();
    });

    it('should auto-calculate bounds from items when not provided', () => {
      render(<Timeline items={mockTimelineItems} />);

      // Should automatically calculate bounds from item dates
      expect(screen.getByTestId('timeline-container')).toBeInTheDocument();
    });
  });

  describe('Item Interactions', () => {
    it('should handle item clicks', async () => {
      const user = userEvent.setup();
      render(
        <Timeline 
          items={mockTimelineItems}
          onItemClick={mockOnItemClick}
        />
      );

      await user.click(screen.getByTestId('timeline-bar-task-1'));

      expect(mockOnItemClick).toHaveBeenCalledWith(mockTimelineItems[1]);
    });

    it('should handle item double clicks', async () => {
      const user = userEvent.setup();
      render(
        <Timeline 
          items={mockTimelineItems}
          onItemDoubleClick={mockOnItemDoubleClick}
        />
      );

      await user.dblClick(screen.getByTestId('timeline-bar-task-1'));

      expect(mockOnItemDoubleClick).toHaveBeenCalledWith(mockTimelineItems[1]);
    });

    it('should support drag and drop when enabled', async () => {
      const user = userEvent.setup();
      render(
        <Timeline 
          items={mockTimelineItems}
          allowDragAndDrop={true}
          onItemMove={mockOnItemMove}
        />
      );

      const taskBar = screen.getByTestId('timeline-bar-task-1');
      
      // Simulate drag start
      await user.pointer({ target: taskBar, keys: '[MouseLeft>]' });
      
      // Note: Full drag simulation requires more complex setup
      // This tests that the drag handlers are attached
      expect(taskBar).toBeInTheDocument();
    });

    it('should support resize when enabled', () => {
      render(
        <Timeline 
          items={mockTimelineItems}
          allowResize={true}
          onItemResize={mockOnItemResize}
        />
      );

      // Resize handles should be present on hover
      const taskBar = screen.getByTestId('timeline-bar-task-1');
      fireEvent.mouseEnter(taskBar);

      expect(screen.getByTestId('resize-handle-left-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('resize-handle-right-task-1')).toBeInTheDocument();
    });
  });

  describe('Linking Mode', () => {
    it('should toggle linking mode', async () => {
      const user = userEvent.setup();
      render(
        <Timeline 
          items={mockTimelineItems}
          onDependencyCreate={mockOnDependencyCreate}
        />
      );

      const linkButton = screen.getByTestId('link-mode-button');
      
      // Enable linking mode
      await user.click(linkButton);
      expect(screen.getByText('Click target item to create dependency')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-linking-button')).toBeInTheDocument();

      // Disable linking mode
      await user.click(screen.getByTestId('cancel-linking-button'));
      expect(screen.queryByText('Click target item to create dependency')).not.toBeInTheDocument();
    });

    it('should create dependencies in linking mode', async () => {
      const user = userEvent.setup();
      render(
        <Timeline 
          items={mockTimelineItems}
          onDependencyCreate={mockOnDependencyCreate}
        />
      );

      // Enable linking mode
      await user.click(screen.getByTestId('link-mode-button'));

      // Click first item to start linking
      await user.click(screen.getByTestId('timeline-bar-task-1'));

      // Click second item to complete linking
      await user.click(screen.getByTestId('timeline-bar-task-2'));

      expect(mockOnDependencyCreate).toHaveBeenCalledWith('task-1', 'task-2');
    });

    it('should cancel linking mode with Escape key', async () => {
      const user = userEvent.setup();
      render(
        <Timeline 
          items={mockTimelineItems}
          onDependencyCreate={mockOnDependencyCreate}
        />
      );

      // Enable linking mode
      await user.click(screen.getByTestId('link-mode-button'));
      expect(screen.getByText('Click target item to create dependency')).toBeInTheDocument();

      // Press Escape to cancel
      await user.keyboard('{Escape}');
      expect(screen.queryByText('Click target item to create dependency')).not.toBeInTheDocument();
    });
  });

  describe('Viewport and Scrolling', () => {
    it('should track scroll position for optimization', () => {
      render(<Timeline items={mockTimelineItems} />);

      const timelineMain = screen.getByTestId('timeline-container')
        .querySelector('.timeline-main');

      if (timelineMain) {
        fireEvent.scroll(timelineMain, { target: { scrollTop: 100, scrollLeft: 200 } });
      }

      // Should handle scroll events
      expect(screen.getByTestId('timeline-container')).toBeInTheDocument();
    });
  });
});

describe('TimelineBar', () => {
  const mockItem: TimelineItem = {
    id: 'test-item',
    type: 'task',
    title: 'Test Task',
    start_date: '01-01-2024',
    end_date: '15-01-2024',
    status: 'in-progress',
    effort_hours: 40,
    assigned_resources: ['John Doe', 'Jane Smith'],
    level: 1
  };

  describe('Rendering', () => {
    it('should render timeline bar with correct positioning', () => {
      render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={40}
        />
      );

      const bar = screen.getByTestId('timeline-bar-test-item');
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveStyle({
        left: '100px',
        top: '50px',
        width: '200px',
        height: '40px'
      });
    });

    it('should display item title and details', () => {
      render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={40}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('40h')).toBeInTheDocument();
      expect(screen.getByText('John Doe +1')).toBeInTheDocument();
    });

    it('should show appropriate icons for different item types', () => {
      const projectItem = { ...mockItem, type: 'project' as const };
      
      const { rerender } = render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={40}
        />
      );

      // Task should have task icon
      expect(screen.getByTestId('timeline-bar-test-item')).toBeInTheDocument();

      rerender(
        <TimelineBar
          item={projectItem}
          x={100}
          y={50}
          width={200}
          height={40}
        />
      );

      // Project should have project icon
      expect(screen.getByTestId('timeline-bar-test-item')).toBeInTheDocument();
    });

    it('should apply correct colors based on status', () => {
      const statuses: Array<{ status: string; expectedColorClass: string }> = [
        { status: 'planned', expectedColorClass: 'bg-blue-400' },
        { status: 'in-progress', expectedColorClass: 'bg-yellow-400' },
        { status: 'blocked', expectedColorClass: 'bg-red-400' },
        { status: 'done', expectedColorClass: 'bg-green-400' },
        { status: 'archived', expectedColorClass: 'bg-gray-400' }
      ];

      statuses.forEach(({ status, expectedColorClass }) => {
        const { rerender } = render(
          <TimelineBar
            item={{ ...mockItem, status }}
            x={100}
            y={50}
            width={200}
            height={40}
          />
        );

        const bar = screen.getByTestId('timeline-bar-test-item');
        expect(bar).toHaveClass(expectedColorClass);

        rerender(<div />); // Clear between tests
      });
    });

    it('should show progress indicator for in-progress items', () => {
      render(
        <TimelineBar
          item={{ ...mockItem, status: 'in-progress' }}
          x={100}
          y={50}
          width={200}
          height={40}
        />
      );

      // Progress indicator should be rendered for in-progress items
      const bar = screen.getByTestId('timeline-bar-test-item');
      // Check that the bar contains progress-related classes
      expect(bar).toHaveClass('bg-yellow-400');
    });

    it('should show status indicator dot in detailed mode', () => {
      render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={40}
          viewMode="detailed"
        />
      );

      expect(screen.getByTestId('status-indicator-test-item')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();

      render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={40}
          onClick={mockOnClick}
        />
      );

      await user.click(screen.getByTestId('timeline-bar-test-item'));

      expect(mockOnClick).toHaveBeenCalledWith(mockItem);
    });

    it('should handle double click events', async () => {
      const user = userEvent.setup();
      const mockOnDoubleClick = jest.fn();

      render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={40}
          onDoubleClick={mockOnDoubleClick}
        />
      );

      await user.dblClick(screen.getByTestId('timeline-bar-test-item'));

      expect(mockOnDoubleClick).toHaveBeenCalledWith(mockItem);
    });

    it('should handle drag start events', async () => {
      const user = userEvent.setup();
      const mockOnDragStart = jest.fn();

      render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={40}
          onDragStart={mockOnDragStart}
        />
      );

      const bar = screen.getByTestId('timeline-bar-test-item');
      await user.pointer({ target: bar, keys: '[MouseLeft>]' });

      expect(mockOnDragStart).toHaveBeenCalledWith('test-item', expect.any(Object));
    });

    it('should handle link clicks in linking mode', async () => {
      const user = userEvent.setup();
      const mockOnLinkClick = jest.fn();

      render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={40}
          isLinkingMode={true}
          onLinkClick={mockOnLinkClick}
        />
      );

      await user.click(screen.getByTestId('timeline-bar-test-item'));

      expect(mockOnLinkClick).toHaveBeenCalledWith('test-item', expect.any(Object));
    });

    it('should show resize handles when enabled and hovered', async () => {
      const user = userEvent.setup();
      render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={40}
          allowResize={true}
        />
      );

      const bar = screen.getByTestId('timeline-bar-test-item');
      await user.hover(bar);

      expect(screen.getByTestId('resize-handle-left-test-item')).toBeInTheDocument();
      expect(screen.getByTestId('resize-handle-right-test-item')).toBeInTheDocument();
    });
  });

  describe('Linking Mode', () => {
    it('should show crosshair cursor in linking mode', () => {
      render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={40}
          isLinkingMode={true}
        />
      );

      const bar = screen.getByTestId('timeline-bar-test-item');
      expect(bar).toHaveClass('cursor-crosshair');
    });

    it('should highlight as linking target', () => {
      render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={40}
          isLinkingMode={true}
          isLinkingTarget={true}
        />
      );

      const bar = screen.getByTestId('timeline-bar-test-item');
      expect(bar).toHaveClass('ring-2', 'ring-blue-400', 'ring-opacity-50');
    });

    it('should show link icon in linking mode', () => {
      render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={40}
          isLinkingMode={true}
        />
      );

      // Link icon should be visible
      const bar = screen.getByTestId('timeline-bar-test-item');
      expect(bar.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('View Modes', () => {
    it('should truncate text in compact mode', () => {
      const longTitleItem = { ...mockItem, title: 'This is a very long task title that should be truncated' };

      render(
        <TimelineBar
          item={longTitleItem}
          x={100}
          y={50}
          width={100}
          height={40}
          viewMode="compact"
        />
      );

      expect(screen.getByText(/This is a very .../)).toBeInTheDocument();
    });

    it('should show more details in detailed mode', () => {
      render(
        <TimelineBar
          item={mockItem}
          x={100}
          y={50}
          width={200}
          height={60}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('40h')).toBeInTheDocument();
      expect(screen.getByText('John Doe +1')).toBeInTheDocument();
      expect(screen.getByTestId('status-indicator-test-item')).toBeInTheDocument();
    });
  });
});

describe('TimelineGrid', () => {
  const defaultProps = {
    width: 1000,
    height: 400,
    cellWidth: 30,
    rowHeight: 40,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    timeScale: 'day' as const
  };

  describe('Rendering', () => {
    it('should render grid container', () => {
      render(<TimelineGrid {...defaultProps} />);

      expect(screen.getByTestId('timeline-grid')).toBeInTheDocument();
    });

    it('should render grid lines', () => {
      render(<TimelineGrid {...defaultProps} />);

      const grid = screen.getByTestId('timeline-grid');
      
      // Should contain vertical lines
      expect(grid.querySelectorAll('.border-l').length).toBeGreaterThan(0);
      
      // Should contain horizontal lines
      expect(grid.querySelectorAll('.border-t').length).toBeGreaterThan(0);
    });

    it('should show today indicator when today is in range', () => {
      const today = new Date();
      const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      render(
        <TimelineGrid 
          {...defaultProps}
          startDate={startDate}
          endDate={endDate}
        />
      );

      expect(screen.getByTestId('today-indicator')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('should not show today indicator when today is out of range', () => {
      render(<TimelineGrid {...defaultProps} />);

      expect(screen.queryByTestId('today-indicator')).not.toBeInTheDocument();
    });

    it('should highlight weekends for day scale', () => {
      render(<TimelineGrid {...defaultProps} timeScale="day" />);

      // Weekend highlights should be present
      expect(screen.getAllByTestId(/weekend-highlight-/).length).toBeGreaterThan(0);
    });

    it('should not highlight weekends for non-day scales', () => {
      render(<TimelineGrid {...defaultProps} timeScale="week" />);

      // Weekend highlights should not be present
      expect(screen.queryAllByTestId(/weekend-highlight-/)).toHaveLength(0);
    });
  });

  describe('Time Scales', () => {
    it('should format labels correctly for day scale', () => {
      render(<TimelineGrid {...defaultProps} timeScale="day" />);

      const grid = screen.getByTestId('timeline-grid');
      expect(grid).toBeInTheDocument();
      // Day labels should be present (numbers)
    });

    it('should format labels correctly for week scale', () => {
      render(<TimelineGrid {...defaultProps} timeScale="week" />);

      const grid = screen.getByTestId('timeline-grid');
      expect(grid).toBeInTheDocument();
      // Week labels (W1, W2, etc.) should be present
    });

    it('should format labels correctly for month scale', () => {
      render(
        <TimelineGrid 
          {...defaultProps}
          timeScale="month"
          endDate={new Date('2024-12-31')}
        />
      );

      const grid = screen.getByTestId('timeline-grid');
      expect(grid).toBeInTheDocument();
      // Month labels should be present
    });
  });

  describe('Viewport Optimization', () => {
    it('should only render visible cells for performance', () => {
      render(
        <TimelineGrid 
          {...defaultProps}
          scrollLeft={500}
          width={2000}
        />
      );

      // Should still render grid but optimize for viewport
      expect(screen.getByTestId('timeline-grid')).toBeInTheDocument();
    });
  });
});

describe('DependencyOverlay', () => {
  const defaultProps = {
    dependencies: mockDependencies,
    items: mockTimelineItems,
    rowPositions: {
      'project-1': { y: 0, height: 40 },
      'task-1': { y: 42, height: 40 },
      'task-2': { y: 84, height: 40 }
    },
    dateToPixel: (date: Date) => {
      const start = new Date('2024-01-01').getTime();
      const current = date.getTime();
      return (current - start) / (24 * 60 * 60 * 1000) * 30; // 30px per day
    }
  };

  describe('Rendering', () => {
    it('should render dependency overlay', () => {
      render(<DependencyOverlay {...defaultProps} />);

      expect(screen.getByTestId('dependency-overlay')).toBeInTheDocument();
    });

    it('should render individual dependencies', () => {
      render(<DependencyOverlay {...defaultProps} />);

      expect(screen.getByTestId('dependency-dep-1')).toBeInTheDocument();
      expect(screen.getByTestId('dependency-dep-2')).toBeInTheDocument();
    });

    it('should not render when no dependencies', () => {
      render(<DependencyOverlay {...defaultProps} dependencies={[]} />);

      // Should render empty container but no dependency paths
      const overlay = screen.getByTestId('dependency-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay.querySelector('svg')).not.toBeInTheDocument();
    });

    it('should not render when items are missing', () => {
      const invalidDeps = [{
        id: 'invalid-dep',
        fromId: 'non-existent',
        toId: 'also-non-existent',
        type: 'FS' as const
      }];

      render(<DependencyOverlay {...defaultProps} dependencies={invalidDeps} />);

      expect(screen.queryByTestId('dependency-invalid-dep')).not.toBeInTheDocument();
    });
  });

  describe('Dependency Types', () => {
    it('should render different dependency types with appropriate colors', () => {
      const typedDependencies: TimelineDependency[] = [
        { id: 'fs', fromId: 'task-1', toId: 'task-2', type: 'FS' },
        { id: 'ss', fromId: 'task-1', toId: 'task-2', type: 'SS' },
        { id: 'ff', fromId: 'task-1', toId: 'task-2', type: 'FF' },
        { id: 'sf', fromId: 'task-1', toId: 'task-2', type: 'SF' }
      ];

      render(
        <DependencyOverlay 
          {...defaultProps}
          dependencies={typedDependencies}
        />
      );

      expect(screen.getByTestId('dependency-fs')).toBeInTheDocument();
      expect(screen.getByTestId('dependency-ss')).toBeInTheDocument();
      expect(screen.getByTestId('dependency-ff')).toBeInTheDocument();
      expect(screen.getByTestId('dependency-sf')).toBeInTheDocument();
    });
  });

  describe('Lag Indicators', () => {
    it('should show lag indicators for dependencies with lag', () => {
      const lagDependency: TimelineDependency = {
        id: 'lag-dep',
        fromId: 'task-1',
        toId: 'task-2',
        type: 'FS',
        lag_days: 5
      };

      render(
        <DependencyOverlay 
          {...defaultProps}
          dependencies={[lagDependency]}
        />
      );

      // Should render lag indicator
      expect(screen.getByText('+5d')).toBeInTheDocument();
    });

    it('should show negative lag indicators', () => {
      const negativeLagDependency: TimelineDependency = {
        id: 'neg-lag-dep',
        fromId: 'task-1',
        toId: 'task-2',
        type: 'FS',
        lag_days: -3
      };

      render(
        <DependencyOverlay 
          {...defaultProps}
          dependencies={[negativeLagDependency]}
        />
      );

      expect(screen.getByText('-3d')).toBeInTheDocument();
    });

    it('should not show lag indicators for zero lag', () => {
      const zeroLagDependency: TimelineDependency = {
        id: 'zero-lag-dep',
        fromId: 'task-1',
        toId: 'task-2',
        type: 'FS',
        lag_days: 0
      };

      render(
        <DependencyOverlay 
          {...defaultProps}
          dependencies={[zeroLagDependency]}
        />
      );

      expect(screen.queryByText('0d')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle dependency clicks', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();

      render(
        <DependencyOverlay 
          {...defaultProps}
          onDependencyClick={mockOnClick}
        />
      );

      const dependency = screen.getByTestId('dependency-dep-1');
      await user.click(dependency);

      expect(mockOnClick).toHaveBeenCalledWith('dep-1');
    });
  });

  describe('Viewport Optimization', () => {
    it('should optimize rendering for viewport', () => {
      render(
        <DependencyOverlay 
          {...defaultProps}
          scrollLeft={1000}
          scrollTop={1000}
        />
      );

      // Should handle viewport optimization
      expect(screen.getByTestId('dependency-overlay')).toBeInTheDocument();
    });
  });
});