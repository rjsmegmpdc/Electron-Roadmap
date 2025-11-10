import React, { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useAppStore } from '../state/store';
import type { Project } from '../../main/preload';
import { NZCurrency, NZDate } from '../utils/validation';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';

interface ProjectTableViewProps {
  onSelectProject?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  selectedProjectId?: string | null;
}

type SortField = 'title' | 'status' | 'start_date' | 'end_date' | 'budget_cents' | 'pm_name' | 'lane';
type SortDirection = 'asc' | 'desc';

const ProjectTableViewInternal: React.FC<ProjectTableViewProps> = ({
  onSelectProject,
  onEditProject,
  selectedProjectId
}) => {
  const {
    projects,
    loading,
    error,
    isDeleting,
    fetchProjects,
    deleteProject,
    updateProject,
    clearError
  } = useProjectStore();

  // Also get the main app store to keep it in sync
  const { loadProjects: refreshAppStoreProjects } = useAppStore();

  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const actionMenuRef = React.useRef<HTMLDivElement>(null);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(false);
      }
    };

    if (actionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [actionMenuOpen]);

  // Sort projects
  const sortedProjects = useMemo(() => {
    const sorted = [...projects].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = (a.title || '').toLowerCase();
          bValue = (b.title || '').toLowerCase();
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'lane':
          aValue = (a.lane || '').toLowerCase();
          bValue = (b.lane || '').toLowerCase();
          break;
        case 'start_date':
        case 'end_date':
          try {
            aValue = a[sortField] ? NZDate.parse(a[sortField]).getTime() : 0;
            bValue = b[sortField] ? NZDate.parse(b[sortField]).getTime() : 0;
          } catch {
            aValue = 0;
            bValue = 0;
          }
          break;
        case 'budget_cents':
          aValue = a.budget_cents || 0;
          bValue = b.budget_cents || 0;
          break;
        case 'pm_name':
          aValue = (a.pm_name || '').toLowerCase();
          bValue = (b.pm_name || '').toLowerCase();
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [projects, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === sortedProjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedProjects.map(p => p.id)));
    }
  };

  const handleSelectOne = (projectId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} project(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const deletePromises = Array.from(selectedIds).map(id => deleteProject(id));
      await Promise.all(deletePromises);
      setSelectedIds(new Set());
      setActionMenuOpen(false);
      // Refresh main app store to sync with cards view
      await refreshAppStoreProjects();
    } catch (error) {
      console.error('Failed to delete projects:', error);
    }
  };

  const handleArchiveSelected = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to archive ${selectedIds.size} project(s)?`
    );

    if (!confirmed) return;

    try {
      const archivePromises = Array.from(selectedIds).map(id => {
        const project = projects.find(p => p.id === id);
        if (project) {
          // updateProject expects UpdateProjectRequest with id included
          return updateProject({ id, status: 'archived' });
        }
        return Promise.resolve();
      });

      await Promise.all(archivePromises);
      setSelectedIds(new Set());
      setActionMenuOpen(false);
      // Refresh main app store to sync with cards view
      await refreshAppStoreProjects();
    } catch (error) {
      console.error('Failed to archive projects:', error);
    }
  };

  const handleUnarchiveSelected = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to unarchive ${selectedIds.size} project(s)? They will be set to "in-progress" status.`
    );

    if (!confirmed) return;

    try {
      const unarchivePromises = Array.from(selectedIds).map(id => {
        const project = projects.find(p => p.id === id);
        if (project) {
          return updateProject({ id, status: 'in-progress' });
        }
        return Promise.resolve();
      });

      await Promise.all(unarchivePromises);
      setSelectedIds(new Set());
      setActionMenuOpen(false);
      // Refresh main app store to sync with cards view
      await refreshAppStoreProjects();
    } catch (error) {
      console.error('Failed to unarchive projects:', error);
    }
  };

  const formatCurrency = (cents: number | null | undefined): string => {
    if (cents == null) return '$0.00';
    return NZCurrency.formatFromCents(cents);
  };

  const getStatusBadgeClass = (status: string): string => {
    const baseClass = 'status-badge';
    switch (status) {
      case 'planned':
        return `${baseClass} status-planned`;
      case 'in-progress':
        return `${baseClass} status-in-progress`;
      case 'blocked':
        return `${baseClass} status-blocked`;
      case 'done':
        return `${baseClass} status-done`;
      case 'archived':
        return `${baseClass} status-archived`;
      default:
        return baseClass;
    }
  };

  const getSortIcon = (field: SortField): string => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading && projects.length === 0) {
    return (
      <div className="table-view-container">
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <LoadingSpinner 
            size="large" 
            message="Loading projects..." 
            data-testid="loading-spinner"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="table-view-container">
      {/* Error display */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div className="error-text">
              <p className="error-title">Error</p>
              <p className="error-message">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="error-close"
              aria-label="Clear error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Action Menu */}
      <div className="action-toolbar">
        <div className="action-toolbar-left">
          <div className="action-menu-wrapper" ref={actionMenuRef}>
            <button
              className="action-menu-button"
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              disabled={selectedIds.size === 0}
              data-testid="action-menu-button"
            >
              Actions ({selectedIds.size} selected) ▾
            </button>
            {actionMenuOpen && selectedIds.size > 0 && (
              <div className="action-menu-dropdown">
                {(() => {
                  // Check if any selected projects are archived
                  const selectedProjects = sortedProjects.filter(p => selectedIds.has(p.id));
                  const hasArchived = selectedProjects.some(p => p.status === 'archived');
                  const hasNonArchived = selectedProjects.some(p => p.status !== 'archived');

                  return (
                    <>
                      {hasNonArchived && (
                        <button
                          className="action-menu-item action-archive"
                          onClick={handleArchiveSelected}
                          data-testid="action-archive"
                        >
                          📦 Archive Selected
                        </button>
                      )}
                      {hasArchived && (
                        <button
                          className="action-menu-item action-unarchive"
                          onClick={handleUnarchiveSelected}
                          data-testid="action-unarchive"
                        >
                          📤 Unarchive Selected
                        </button>
                      )}
                      <button
                        className="action-menu-item action-delete"
                        onClick={handleDeleteSelected}
                        disabled={isDeleting}
                        data-testid="action-delete"
                      >
                        🗑️ Delete Selected
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
        <div className="action-toolbar-right">
          <span className="project-count">
            {sortedProjects.length} project{sortedProjects.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Project Table */}
      <div className="table-wrapper">
        <table className="project-table" data-testid="projects-table">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.size === sortedProjects.length && sortedProjects.length > 0}
                  onChange={handleSelectAll}
                  data-testid="select-all-checkbox"
                  aria-label="Select all projects"
                />
              </th>
              <th 
                className="col-sortable col-title"
                onClick={() => handleSort('title')}
                data-testid="sort-title"
              >
                Title {getSortIcon('title')}
              </th>
              <th 
                className="col-sortable col-lane"
                onClick={() => handleSort('lane')}
                data-testid="sort-lane"
              >
                Lane {getSortIcon('lane')}
              </th>
              <th 
                className="col-sortable col-status"
                onClick={() => handleSort('status')}
                data-testid="sort-status"
              >
                Status {getSortIcon('status')}
              </th>
              <th 
                className="col-sortable col-start-date"
                onClick={() => handleSort('start_date')}
                data-testid="sort-start-date"
              >
                Start Date {getSortIcon('start_date')}
              </th>
              <th 
                className="col-sortable col-end-date"
                onClick={() => handleSort('end_date')}
                data-testid="sort-end-date"
              >
                End Date {getSortIcon('end_date')}
              </th>
              <th 
                className="col-sortable col-budget"
                onClick={() => handleSort('budget_cents')}
                data-testid="sort-budget"
              >
                Budget {getSortIcon('budget_cents')}
              </th>
              <th 
                className="col-sortable col-pm"
                onClick={() => handleSort('pm_name')}
                data-testid="sort-pm"
              >
                PM {getSortIcon('pm_name')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map((project) => (
              <tr
                key={project.id}
                className={`project-row ${selectedProjectId === project.id ? 'row-selected' : ''}`}
                data-testid={`project-row-${project.id}`}
              >
                <td className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(project.id)}
                    onChange={() => handleSelectOne(project.id)}
                    data-testid={`select-${project.id}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td 
                  className="col-title"
                  onClick={() => onSelectProject?.(project)}
                >
                  <div className="title-cell">
                    <span className="title-text">{project.title}</span>
                    {project.description && (
                      <span className="description-text">{project.description}</span>
                    )}
                  </div>
                </td>
                <td className="col-lane">
                  {project.lane || '-'}
                </td>
                <td className="col-status">
                  <span className={getStatusBadgeClass(project.status)}>
                    {project.status}
                  </span>
                </td>
                <td className="col-start-date">
                  {project.start_date}
                </td>
                <td className="col-end-date">
                  {project.end_date}
                </td>
                <td className="col-budget">
                  {formatCurrency(project.budget_cents)}
                </td>
                <td className="col-pm">
                  {project.pm_name || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {sortedProjects.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3 className="empty-title">No projects found</h3>
            <p className="empty-description">
              Get started by creating your first project.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .table-view-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #ffffff;
        }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 16px;
          margin: 16px;
        }

        .error-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .error-icon {
          font-size: 20px;
          line-height: 1;
        }

        .error-text {
          flex: 1;
        }

        .error-title {
          font-weight: 600;
          color: #991b1b;
          margin: 0 0 4px 0;
        }

        .error-message {
          color: #dc2626;
          margin: 0;
          font-size: 14px;
        }

        .error-close {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          line-height: 1;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .error-close:hover {
          opacity: 1;
        }

        .action-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .action-toolbar-left {
          display: flex;
          gap: 12px;
        }

        .action-toolbar-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .action-menu-wrapper {
          position: relative;
        }

        .action-menu-button {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .action-menu-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .action-menu-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .action-menu-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 4px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          z-index: 10;
          min-width: 200px;
        }

        .action-menu-item {
          display: block;
          width: 100%;
          padding: 10px 16px;
          background: none;
          border: none;
          text-align: left;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #f3f4f6;
        }

        .action-menu-item:last-child {
          border-bottom: none;
        }

        .action-menu-item:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .action-menu-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-archive {
          color: #2563eb;
        }

        .action-unarchive {
          color: #059669;
        }

        .action-delete {
          color: #dc2626;
        }

        .project-count {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .table-wrapper {
          flex: 1;
          overflow: auto;
        }

        .project-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .project-table thead {
          position: sticky;
          top: 0;
          background: #f9fafb;
          z-index: 1;
        }

        .project-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          border-bottom: 2px solid #e5e7eb;
          white-space: nowrap;
        }

        .col-sortable {
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
        }

        .col-sortable:hover {
          background: #f3f4f6;
        }

        .col-checkbox {
          width: 48px;
          text-align: center;
        }

        .col-title {
          min-width: 250px;
          max-width: 400px;
        }

        .col-lane {
          width: 150px;
        }

        .col-status {
          width: 120px;
        }

        .col-start-date,
        .col-end-date {
          width: 120px;
        }

        .col-budget {
          width: 130px;
        }

        .col-pm {
          width: 150px;
        }

        .project-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.2s;
        }

        .project-table tbody tr:hover {
          background: #f9fafb;
        }

        .project-row.row-selected {
          background: #eff6ff !important;
        }

        .project-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .title-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
        }

        .title-text {
          font-weight: 500;
          color: #111827;
        }

        .description-text {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 350px;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-planned {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-in-progress {
          background: #fef3c7;
          color: #92400e;
        }

        .status-blocked {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-done {
          background: #d1fae5;
          color: #065f46;
        }

        .status-archived {
          background: #f3f4f6;
          color: #4b5563;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 24px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .empty-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        /* Checkbox styling */
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

// Export wrapped with ErrorBoundary
export const ProjectTableView: React.FC<ProjectTableViewProps> = (props) => (
  <ErrorBoundary
    fallbackComponent={(errorProps) => (
      <div className="table-view-container">
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '24px',
          margin: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '32px', marginRight: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#991b1b', margin: 0 }}>
              Project Table Error
            </h2>
          </div>
          <p style={{ color: '#dc2626', marginBottom: '16px' }}>
            Something went wrong while loading the project table. This might be due to a data loading issue or component error.
          </p>
          <button
            onClick={errorProps.resetError}
            style={{
              background: '#dc2626',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )}
    onError={(error, errorInfo) => {
      console.error('ProjectTableView error:', error);
      console.error('ProjectTableView error info:', errorInfo);
    }}
  >
    <ProjectTableViewInternal {...props} />
  </ErrorBoundary>
);
