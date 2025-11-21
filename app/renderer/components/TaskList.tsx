import React, { useState, useMemo } from 'react';
import { TaskItem } from './TaskItem';
import { LoadingSpinner } from './LoadingSpinner';
// Simple error display component for inline errors
const InlineError: React.FC<{ error: string }> = ({ error }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
    <div className="flex">
      <svg className="flex-shrink-0 h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    </div>
  </div>
);
import { SelectInput } from './inputs/SelectInput';
import type { Task, TaskStatus } from '../stores/taskDependencyStore';

export interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  error?: string | null;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onCreateTask?: () => void;
  showActions?: boolean;
  showProject?: boolean;
  allowSelection?: boolean;
  selectedTaskIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  showFilters?: boolean;
  defaultStatus?: TaskStatus | 'all';
  defaultProject?: string | 'all';
  availableProjects?: { id: string; title: string }[];
  className?: string;
  emptyMessage?: string;
}

type SortOption = 'title' | 'start_date' | 'end_date' | 'status' | 'effort_hours' | 'created_at';
type SortDirection = 'asc' | 'desc';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' }
];

const SORT_OPTIONS = [
  { value: 'title', label: 'Title' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'end_date', label: 'End Date' },
  { value: 'status', label: 'Status' },
  { value: 'effort_hours', label: 'Effort Hours' },
  { value: 'created_at', label: 'Created Date' }
];

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  loading = false,
  error = null,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onCreateTask,
  showActions = true,
  showProject = false,
  allowSelection = false,
  selectedTaskIds = new Set(),
  onSelectionChange,
  showFilters = true,
  defaultStatus = 'all',
  defaultProject = 'all',
  availableProjects = [],
  className = '',
  emptyMessage = 'No tasks found.'
}) => {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>(defaultStatus);
  const [projectFilter, setProjectFilter] = useState<string | 'all'>(defaultProject);
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const projectOptions = useMemo(() => [
    { value: 'all', label: 'All Projects' },
    ...availableProjects.map(project => ({
      value: project.id,
      label: project.title
    }))
  ], [availableProjects]);

  const filteredAndSortedTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Project filter
      if (projectFilter !== 'all' && task.project_id !== projectFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchableText = [
          task.title,
          task.id,
          task.project_id,
          ...task.assigned_resources
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'start_date':
          aValue = a.start_date ? new Date(a.start_date.split('-').reverse().join('-')) : new Date(0);
          bValue = b.start_date ? new Date(b.start_date.split('-').reverse().join('-')) : new Date(0);
          break;
        case 'end_date':
          aValue = a.end_date ? new Date(a.end_date.split('-').reverse().join('-')) : new Date(0);
          bValue = b.end_date ? new Date(b.end_date.split('-').reverse().join('-')) : new Date(0);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'effort_hours':
          aValue = a.effort_hours || 0;
          bValue = b.effort_hours || 0;
          break;
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at) : new Date(0);
          bValue = b.created_at ? new Date(b.created_at) : new Date(0);
          break;
        default:
          aValue = a.created_at ? new Date(a.created_at) : new Date(0);
          bValue = b.created_at ? new Date(b.created_at) : new Date(0);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tasks, statusFilter, projectFilter, searchQuery, sortBy, sortDirection]);

  const handleTaskSelect = (taskId: string, selected: boolean) => {
    if (!allowSelection || !onSelectionChange) return;

    const newSelection = new Set(selectedTaskIds);
    if (selected) {
      newSelection.add(taskId);
    } else {
      newSelection.delete(taskId);
    }
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (!allowSelection || !onSelectionChange) return;

    const allVisible = filteredAndSortedTasks.map(task => task.id);
    const newSelection = new Set(selectedTaskIds);
    
    // Check if all visible tasks are selected
    const allSelected = allVisible.every(id => newSelection.has(id));
    
    if (allSelected) {
      // Deselect all visible tasks
      allVisible.forEach(id => newSelection.delete(id));
    } else {
      // Select all visible tasks
      allVisible.forEach(id => newSelection.add(id));
    }
    
    onSelectionChange(newSelection);
  };

  const getSelectionStatus = () => {
    const visibleIds = filteredAndSortedTasks.map(task => task.id);
    const selectedVisibleCount = visibleIds.filter(id => selectedTaskIds.has(id)).length;
    
    if (selectedVisibleCount === 0) return 'none';
    if (selectedVisibleCount === visibleIds.length) return 'all';
    return 'partial';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <InlineError error={error} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Tasks ({filteredAndSortedTasks.length})
          </h2>
          
          {allowSelection && selectedTaskIds.size > 0 && (
            <span className="text-sm text-blue-600 font-medium">
              {selectedTaskIds.size} selected
            </span>
          )}
        </div>

        {onCreateTask && (
          <button
            onClick={onCreateTask}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            data-testid="create-task-button"
          >
            + Create Task
          </button>
        )}
      </div>

      {/* Filters and Search */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="task-search-input"
              />
            </div>
            
            {allowSelection && filteredAndSortedTasks.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                data-testid="select-all-button"
              >
                {getSelectionStatus() === 'all' ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SelectInput
              label="Status"
              name="status-filter"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as TaskStatus | 'all')}
              options={STATUS_OPTIONS}
              data-testid="status-filter-select"
            />

            {availableProjects.length > 0 && (
              <SelectInput
                label="Project"
                name="project-filter"
                value={projectFilter}
                onChange={setProjectFilter}
                options={projectOptions}
                data-testid="project-filter-select"
              />
            )}

            <SelectInput
              label="Sort By"
              name="sort-by"
              value={sortBy}
              onChange={(value) => setSortBy(value as SortOption)}
              options={SORT_OPTIONS}
              data-testid="sort-by-select"
            />

            <SelectInput
              label="Direction"
              name="sort-direction"
              value={sortDirection}
              onChange={(value) => setSortDirection(value as SortDirection)}
              options={[
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' }
              ]}
              data-testid="sort-direction-select"
            />
          </div>
        </div>
      )}

      {/* Task List */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</p>
          {tasks.length > 0 && filteredAndSortedTasks.length === 0 && (
            <p className="text-sm text-gray-500">Try adjusting your filters or search query.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onClick={onTaskClick}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              showActions={showActions}
              showProject={showProject}
              selected={selectedTaskIds.has(task.id)}
              onToggleSelect={allowSelection ? handleTaskSelect : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;