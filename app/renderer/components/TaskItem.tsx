import React from 'react';
import type { Task } from '../stores/taskDependencyStore';

export interface TaskItemProps {
  task: Task;
  onClick?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  showActions?: boolean;
  showProject?: boolean;
  selected?: boolean;
  onToggleSelect?: (taskId: string, selected: boolean) => void;
  className?: string;
}

const STATUS_COLORS = {
  'planned': 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  'blocked': 'bg-red-100 text-red-800',
  'done': 'bg-green-100 text-green-800',
  'archived': 'bg-gray-100 text-gray-800'
} as const;

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onClick,
  onEdit,
  onDelete,
  showActions = true,
  showProject = false,
  selected = false,
  onToggleSelect,
  className = ''
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons or checkbox
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input[type="checkbox"]')) {
      return;
    }
    onClick?.(task);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(task);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      onDelete?.(task);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggleSelect?.(task.id, e.target.checked);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'No date';
    return dateString; // Already in DD-MM-YYYY format
  };

  const calculateDuration = (): string => {
    if (!task.start_date || !task.end_date) return 'Unknown';
    
    try {
      // Convert DD-MM-YYYY to Date objects
      const [startDay, startMonth, startYear] = task.start_date.split('-').map(Number);
      const [endDay, endMonth, endYear] = task.end_date.split('-').map(Number);
      
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return '1 day';
      if (diffDays < 7) return `${diffDays + 1} days`;
      if (diffDays < 30) return `${Math.ceil((diffDays + 1) / 7)} weeks`;
      return `${Math.ceil((diffDays + 1) / 30)} months`;
    } catch {
      return 'Unknown';
    }
  };

  const getProgressIndicator = () => {
    const now = new Date();
    
    try {
      // Convert DD-MM-YYYY to Date objects
      const [startDay, startMonth, startYear] = task.start_date.split('-').map(Number);
      const [endDay, endMonth, endYear] = task.end_date.split('-').map(Number);
      
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      if (task.status === 'done') {
        return { text: 'Completed', color: 'text-green-600' };
      }
      
      if (now < startDate) {
        const daysToStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { text: `Starts in ${daysToStart} days`, color: 'text-blue-600' };
      }
      
      if (now > endDate) {
        const daysOverdue = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        return { text: `${daysOverdue} days overdue`, color: 'text-red-600' };
      }
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (remainingDays <= 0) {
        return { text: 'Due today', color: 'text-orange-600' };
      }
      
      return { text: `${remainingDays} days remaining`, color: 'text-gray-600' };
    } catch {
      return { text: 'Timeline unknown', color: 'text-gray-500' };
    }
  };

  const progressInfo = getProgressIndicator();

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-4 
        hover:shadow-md transition-shadow cursor-pointer
        ${selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        ${className}
      `}
      onClick={handleCardClick}
      data-testid={`task-item-${task.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(task);
        }
      }}
    >
      {/* Header with title and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={handleCheckboxChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              data-testid={`task-checkbox-${task.id}`}
              aria-label={`Select task ${task.title}`}
            />
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate" data-testid="task-title">
              {task.title}
            </h3>
            <p className="text-sm text-gray-600" data-testid="task-id">
              ID: {task.id}
            </p>
            {showProject && (
              <p className="text-sm text-gray-500" data-testid="task-project-id">
                Project: {task.project_id}
              </p>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex space-x-2 ml-4">
            <button
              onClick={handleEditClick}
              className="text-blue-600 hover:text-blue-800 p-1 rounded"
              data-testid="edit-task-button"
              title="Edit task"
              aria-label={`Edit task ${task.title}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-red-600 hover:text-red-800 p-1 rounded"
              data-testid="delete-task-button"
              title="Delete task"
              aria-label={`Delete task ${task.title}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Status and Progress */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span 
          className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[task.status]}`}
          data-testid="task-status"
        >
          {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
        </span>
        
        <span className={`text-xs font-medium ${progressInfo.color}`} data-testid="task-progress">
          {progressInfo.text}
        </span>
        
        {task.effort_hours > 0 && (
          <span className="text-xs text-gray-500" data-testid="task-effort-hours">
            {task.effort_hours}h effort
          </span>
        )}
      </div>

      {/* Timeline and Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-500">Start:</span>
            <span className="text-gray-900" data-testid="task-start-date">
              {formatDate(task.start_date)}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-500">End:</span>
            <span className="text-gray-900" data-testid="task-end-date">
              {formatDate(task.end_date)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Duration:</span>
            <span className="text-gray-900" data-testid="task-duration">
              {calculateDuration()}
            </span>
          </div>
        </div>

        <div>
          {task.assigned_resources && task.assigned_resources.length > 0 ? (
            <div>
              <span className="text-gray-500 text-xs block mb-1">Assigned to:</span>
              <div className="space-y-1" data-testid="task-assigned-resources">
                {task.assigned_resources.slice(0, 3).map((resource, index) => (
                  <div key={index} className="text-xs text-gray-700 truncate">
                    {resource}
                  </div>
                ))}
                {task.assigned_resources.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{task.assigned_resources.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500" data-testid="task-no-resources">
              No resources assigned
            </div>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <span data-testid="task-created-at">
            Created: {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Unknown'}
          </span>
          <span data-testid="task-updated-at">
            Updated: {task.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;