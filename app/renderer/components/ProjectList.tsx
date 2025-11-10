import React, { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '../stores/projectStore';
import type { Project, ProjectStatus } from '../../main/preload';
import { NZCurrency, NZDate } from '../utils/validation';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';

interface ProjectListProps {
  onSelectProject?: (project: Project) => void;
  onCreateProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  selectedProjectId?: string | null;
}

type SortField = 'title' | 'status' | 'start_date' | 'end_date' | 'budget_cents' | 'pm_name';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  search: string;
  status: ProjectStatus | 'all';
  pmName: string;
  dateRange: {
    start: string;
    end: string;
  };
}

const ProjectListInternal: React.FC<ProjectListProps> = ({
  onSelectProject,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  selectedProjectId
}) => {
  const {
    projects,
    loading,
    error,
    isDeleting,
    fetchProjects,
    deleteProject,
    clearError
  } = useProjectStore();

  const [sortField, setSortField] = useState<SortField>('start_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    pmName: '',
    dateRange: { start: '', end: '' }
  });

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(project =>
        project.title?.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.lane?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    if (filters.pmName) {
      const pmLower = filters.pmName.toLowerCase();
      filtered = filtered.filter(project =>
        project.pm_name?.toLowerCase().includes(pmLower)
      );
    }

    if (filters.dateRange.start && filters.dateRange.end) {
      try {
        const startDate = NZDate.parse(filters.dateRange.start);
        const endDate = NZDate.parse(filters.dateRange.end);
        
        filtered = filtered.filter(project => {
          const projStart = NZDate.parse(project.start_date);
          const projEnd = NZDate.parse(project.end_date);
          return projStart >= startDate && projEnd <= endDate;
        });
      } catch (error) {
        console.warn('Invalid date range filter:', error);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
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

    return filtered;
  }, [projects, filters, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredAndSortedProjects.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
      const result = await deleteProject(project.id);
      if (result.success) {
        // Project will be removed from store automatically
        console.log('Project deleted successfully');
      }
    }
  };

  const formatCurrency = (cents: number | null | undefined): string => {
    if (cents == null) return '$0.00';
    return NZCurrency.formatFromCents(cents);
  };

  const getStatusBadgeClass = (status: ProjectStatus): string => {
    const baseClass = 'px-2 py-1 rounded text-sm font-medium';
    switch (status) {
      case 'active':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'completed':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'on-hold':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  const getSortIcon = (field: SortField): string => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading && projects.length === 0) {
    return (
      <div className="project-list-container">
        <div className="text-center py-8">
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
    <div className="project-list-container p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        {onCreateProject && (
          <button
            onClick={onCreateProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            data-testid="create-project-btn"
          >
            + Create Project
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="text-red-800">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-600"
              aria-label="Clear error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search projects..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="search-input"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as ProjectStatus | 'all' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* PM Name Filter */}
          <div>
            <label htmlFor="pm-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Project Manager
            </label>
            <input
              id="pm-filter"
              type="text"
              value={filters.pmName}
              onChange={(e) => setFilters({ ...filters, pmName: e.target.value })}
              placeholder="Filter by PM..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="pm-filter"
            />
          </div>

          {/* Items per page */}
          <div>
            <label htmlFor="items-per-page" className="block text-sm font-medium text-gray-700 mb-1">
              Items per page
            </label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="items-per-page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date From
            </label>
            <input
              id="start-date"
              type="text"
              value={filters.dateRange.start}
              onChange={(e) => setFilters({ 
                ...filters, 
                dateRange: { ...filters.dateRange, start: e.target.value }
              })}
              placeholder="DD-MM-YYYY"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="start-date-filter"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date To
            </label>
            <input
              id="end-date"
              type="text"
              value={filters.dateRange.end}
              onChange={(e) => setFilters({ 
                ...filters, 
                dateRange: { ...filters.dateRange, end: e.target.value }
              })}
              placeholder="DD-MM-YYYY"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="end-date-filter"
            />
          </div>
        </div>
      </div>

      {/* Results summary */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedProjects.length)} of {filteredAndSortedProjects.length} projects
        </p>
        {loading && (
          <div className="flex items-center">
            <LoadingSpinner 
              size="small" 
              variant="primary" 
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Refreshing...</span>
          </div>
        )}
      </div>

      {/* Project Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" data-testid="projects-table">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('title')}
                  data-testid="sort-title"
                >
                  Title {getSortIcon('title')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                  data-testid="sort-status"
                >
                  Status {getSortIcon('status')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('start_date')}
                  data-testid="sort-start-date"
                >
                  Start Date {getSortIcon('start_date')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('end_date')}
                  data-testid="sort-end-date"
                >
                  End Date {getSortIcon('end_date')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('budget_cents')}
                  data-testid="sort-budget"
                >
                  Budget {getSortIcon('budget_cents')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('pm_name')}
                  data-testid="sort-pm"
                >
                  PM {getSortIcon('pm_name')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProjects.map((project) => (
                <tr
                  key={project.id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedProjectId === project.id ? 'bg-blue-50 ring-2 ring-blue-200' : ''
                  }`}
                  onClick={() => onSelectProject?.(project)}
                  data-testid={`project-row-${project.id}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {project.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {project.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadgeClass(project.status)}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.start_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.end_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(project.budget_cents)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.pm_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {onEditProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProject(project);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          data-testid={`edit-project-${project.id}`}
                        >
                          Edit
                        </button>
                      )}
                      {onDeleteProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(project);
                          }}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                          data-testid={`delete-project-${project.id}`}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredAndSortedProjects.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">
              {projects.length === 0 
                ? "Get started by creating your first project."
                : "Try adjusting your filters to see more results."
              }
            </p>
            {onCreateProject && projects.length === 0 && (
              <button
                onClick={onCreateProject}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Create Your First Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="prev-page"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                      data-testid={`page-${page}`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="next-page"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export the ProjectList wrapped with ErrorBoundary
export const ProjectList: React.FC<ProjectListProps> = (props) => (
  <ErrorBoundary
    fallbackComponent={(errorProps) => (
      <div className="project-list-container p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="text-red-600 text-2xl mr-3">⚠️</div>
            <h2 className="text-lg font-semibold text-red-800">Project List Error</h2>
          </div>
          <p className="text-red-700 mb-4">
            Something went wrong while loading the project list. This might be due to a data loading issue or component error.
          </p>
          <button
            onClick={errorProps.resetError}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )}
    onError={(error, errorInfo) => {
      console.error('ProjectList error:', error);
      console.error('ProjectList error info:', errorInfo);
    }}
  >
    <ProjectListInternal {...props} />
  </ErrorBoundary>
);
