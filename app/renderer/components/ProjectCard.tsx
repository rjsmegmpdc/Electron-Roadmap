import React from 'react';
import { NZCurrency } from '../utils/validation';
import type { Project } from '../../main/preload';

export interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  showActions?: boolean;
  className?: string;
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  'on-hold': 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800'
} as const;

const FINANCIAL_TREATMENT_COLORS = {
  CAPEX: 'bg-purple-100 text-purple-800',
  OPEX: 'bg-orange-100 text-orange-800'
} as const;

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  onEdit,
  onDelete,
  showActions = true,
  className = ''
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.(project);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(project);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
      onDelete?.(project);
    }
  };

  const formatBudget = (budgetCents?: number): string => {
    if (!budgetCents) return 'No budget set';
    try {
      return NZCurrency.formatCents(budgetCents);
    } catch (error) {
      return 'Invalid budget';
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'No date';
    // Already in DD-MM-YYYY format, just return as is
    return dateString;
  };

  return (
    <div
      className={`card cursor-pointer ${className}`}
      onClick={handleCardClick}
      data-testid={`project-card-${project.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(project);
        }
      }}
    >
      {/* Header */}
      <div className="card-header">
        <div className="flex-1">
          <h3 className="card-title" data-testid="project-title">
            {project.title}
          </h3>
          <p className="card-subtitle" data-testid="project-id">
            {project.id}
          </p>
        </div>
        
        {showActions && (
          <div className="flex gap-sm ml-md">
            <button
              onClick={handleEditClick}
              className="btn btn-sm ghost"
              data-testid="edit-button"
              title="Edit project"
              aria-label={`Edit ${project.title}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              className="btn btn-sm ghost text-error"
              data-testid="delete-button"
              title="Delete project"
              aria-label={`Delete ${project.title}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="card-body">
        {/* Description */}
        {project.description && (
          <p className="line-clamp-3" data-testid="project-description">
            {project.description}
          </p>
        )}

        {/* Status and Tags */}
        <div className="flex flex-wrap gap-xs mb-md">
          <span 
            className={`status-badge status-${project.status}`}
            data-testid="project-status"
          >
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
        
          {project.financial_treatment && (
            <span 
              className={`badge ${project.financial_treatment === 'CAPEX' ? 'badge-primary' : 'badge-warning'}`}
              data-testid="project-financial-treatment"
            >
              {project.financial_treatment}
            </span>
          )}
          
          {project.lane && (
            <span 
              className="badge badge-outline"
              data-testid="project-lane"
            >
              {project.lane}
            </span>
          )}
      </div>

        {/* Project Details */}
        <div className="grid grid-cols-2 gap-md text-sm">
          <div>
            <span className="text-secondary">Start:</span>
            <span className="ml-sm text-primary" data-testid="project-start-date">
              {formatDate(project.start_date)}
            </span>
          </div>
          <div>
            <span className="text-secondary">End:</span>
            <span className="ml-sm text-primary" data-testid="project-end-date">
              {formatDate(project.end_date)}
            </span>
          </div>
          
          {project.pm_name && (
            <div className="col-span-2">
              <span className="text-secondary">PM:</span>
              <span className="ml-sm text-primary" data-testid="project-pm-name">
                {project.pm_name}
              </span>
            </div>
          )}
          
          <div className="col-span-2">
            <span className="text-secondary">Budget:</span>
            <span className="ml-sm text-primary font-medium" data-testid="project-budget">
              {formatBudget(project.budget_cents)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;