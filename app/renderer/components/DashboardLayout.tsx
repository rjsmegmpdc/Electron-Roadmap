import React, { useState, useEffect } from 'react';
import { NavigationSidebar } from './NavigationSidebar';
import { ContentPane, WelcomeContent, EmptyState } from './ContentPane';
import { InfoPane } from './InfoPane';
import { ErrorBoundary } from './ErrorBoundary';
import { moduleInfoData } from '../data/moduleInfo';

// Import existing components
import { ProjectEditForm } from './ProjectEditForm';
import { ProjectDetailView } from './ProjectDetailView';
import { TestRunner } from './TestRunner';
import { QuickTaskForm } from './QuickTaskForm';
import { EnhancedEpicFeatureManager } from './EnhancedEpicFeatureManager';
import { ADOConfigManager } from './ADOConfigManager';
import TestSuite from '../src/components/TestSuite';
import EpicFeatureConfig from './EpicFeatureConfig';
import { GanttChart } from './GanttChart';
import { Settings } from './Settings';
import { ProjectTableView } from './ProjectTableView';
import { CalendarManager } from './CalendarManager';
import { ExportImport } from './ExportImport';
import { ProjectCoordinatorDashboard } from './ProjectCoordinatorDashboard';
import { ResourceManagement } from './ResourceManagement';

// Import Governance pages
import { GovernanceDashboard } from '../pages/GovernanceDashboard';
import { GovernanceAnalytics } from '../pages/GovernanceAnalytics';

// Import existing views/functions from App.tsx
import { useAppStore, type Project } from '../state/store';

interface DashboardLayoutProps {
  // Props for compatibility with existing App.tsx
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    project: Project | null;
  }>({ isOpen: false, project: null });
  const [testRunnerOpen, setTestRunnerOpen] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [ganttRefreshKey, setGanttRefreshKey] = useState(0);
  const [projectViewMode, setProjectViewMode] = useState<'cards' | 'table'>('cards');
  const [filters, setFilters] = useState({
    lane: 'All',
    pm: 'All',
    status: 'All'
  });
  
  const { 
    loadProjects, 
    createProject,
    updateProject,
    addError, 
    ui: { currentView, viewingProjectId },
    showProjectList,
    showProjectDetail,
    getProjectsAsArray,
    loading
  } = useAppStore();
  

  useEffect(() => {
    // Initialize the application
    const initApp = async () => {
      if (!window.electronAPI) {
        addError('Electron API not available - running in browser mode');
        return;
      }
      
      // Load settings from database and sync to localStorage
      try {
        if (window.electronAPI.getSettings) {
          const settings = await window.electronAPI.getSettings();
          console.log('DashboardLayout: Loaded settings on startup:', settings);
          if (settings && Object.keys(settings).length > 0) {
            localStorage.setItem('appSettings', JSON.stringify(settings));
            console.log('DashboardLayout: Settings synced to localStorage:', settings);
          } else {
            console.log('DashboardLayout: No settings found in database on startup');
          }
        }
      } catch (error) {
        console.error('DashboardLayout: Failed to load settings on startup:', error);
      }
      
      // Load initial data
      await loadProjects();
    };
    
    initApp();
  }, [loadProjects, addError]);

  const handleModuleSelect = (moduleId: string) => {
    setActiveModule(moduleId);
    
    // Handle special cases for existing navigation
    switch (moduleId) {
      case 'dashboard':
        showProjectList();
        break;
      case 'projects':
        showProjectList();
        break;
      case 'tests':
        // No special handling needed - just render TestSuite in renderModuleContent
        break;
      default:
        // For other modules, just change the active state
        break;
    }
  };

  const handleCreateProject = () => {
    setEditModal({ isOpen: true, project: null });
  };

  const handleCreateSampleProject = async () => {
    // Generate 24 sample projects with randomized dates over 24 months
    const formatDate = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const getRandomDate = (minMonthsFromNow: number, maxMonthsFromNow: number): Date => {
      const today = new Date();
      const minDate = new Date(today.getFullYear(), today.getMonth() + minMonthsFromNow, today.getDate());
      const maxDate = new Date(today.getFullYear(), today.getMonth() + maxMonthsFromNow, today.getDate());
      const randomTime = minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime());
      return new Date(randomTime);
    };

    const addMonths = (date: Date, months: number): Date => {
      const result = new Date(date);
      result.setMonth(result.getMonth() + months);
      return result;
    };

    const projectTemplates = [
      { title: 'Website Redesign', description: 'Complete overhaul of the company website with modern design and UX improvements.', lane: 'Digital', pm: 'Sarah Johnson' },
      { title: 'Cloud Migration', description: 'Migration of legacy systems to AWS cloud infrastructure.', lane: 'Infrastructure', pm: 'Michael Chen' },
      { title: 'Mobile App Development', description: 'Development of native mobile application for iOS and Android platforms.', lane: 'Digital', pm: 'Emma Wilson' },
      { title: 'Security Audit', description: 'Comprehensive security assessment and vulnerability remediation.', lane: 'Security', pm: 'David Rodriguez' },
      { title: 'Data Analytics Platform', description: 'Implementation of comprehensive data analytics platform with real-time dashboards.', lane: 'Analytics', pm: 'Lisa Park' },
      { title: 'CRM System Upgrade', description: 'Upgrade and modernization of customer relationship management system.', lane: 'Business Systems', pm: 'James Thompson' },
      { title: 'Employee Portal', description: 'Development of internal employee self-service portal.', lane: 'HR Technology', pm: 'Maria Garcia' },
      { title: 'API Gateway Implementation', description: 'Implementation of enterprise API gateway for microservices architecture.', lane: 'Infrastructure', pm: 'Robert Kim' },
      { title: 'Database Optimization', description: 'Performance optimization and scaling of core database systems.', lane: 'Database', pm: 'Jennifer Lee' },
      { title: 'E-commerce Platform', description: 'Development of new e-commerce platform with advanced features.', lane: 'Digital', pm: 'Alex Turner' },
      { title: 'Business Intelligence', description: 'Implementation of BI tools and data warehousing solutions.', lane: 'Analytics', pm: 'Steven Adams' },
      { title: 'Network Infrastructure', description: 'Upgrade of network infrastructure and security systems.', lane: 'Infrastructure', pm: 'Michelle Brown' },
      { title: 'Automation Framework', description: 'Development of test automation framework and CI/CD pipelines.', lane: 'DevOps', pm: 'Daniel Wilson' },
      { title: 'Customer Support System', description: 'Implementation of modern customer support ticketing system.', lane: 'Customer Service', pm: 'Rachel Green' },
      { title: 'Content Management', description: 'Migration to new content management system with improved workflows.', lane: 'Digital', pm: 'Kevin White' },
      { title: 'Supply Chain Optimization', description: 'Digital transformation of supply chain management processes.', lane: 'Operations', pm: 'Amanda Clark' },
      { title: 'Payment Gateway', description: 'Integration of modern payment processing and gateway solutions.', lane: 'FinTech', pm: 'Brian Davis' },
      { title: 'Quality Assurance', description: 'Implementation of comprehensive QA processes and tools.', lane: 'Quality', pm: 'Sophie Miller' },
      { title: 'Document Management', description: 'Digital document management system with workflow automation.', lane: 'Document Systems', pm: 'Chris Anderson' },
      { title: 'Performance Monitoring', description: 'Implementation of application performance monitoring and alerting.', lane: 'Monitoring', pm: 'Laura Martinez' },
      { title: 'Identity Management', description: 'Enterprise identity and access management system deployment.', lane: 'Security', pm: 'Mark Taylor' },
      { title: 'Backup & Recovery', description: 'Enterprise backup and disaster recovery solution implementation.', lane: 'Infrastructure', pm: 'Nancy Johnson' },
      { title: 'Integration Platform', description: 'Enterprise service bus and integration platform development.', lane: 'Integration', pm: 'Paul Robinson' },
      { title: 'Machine Learning', description: 'Implementation of ML models for predictive analytics and automation.', lane: 'AI/ML', pm: 'Grace Wong' }
    ];

    const statuses = ['planned', 'in-progress', 'blocked', 'done', 'archived'];
    const financialTreatments = ['CAPEX', 'OPEX'];

    const sampleProjects = projectTemplates.map((template, index) => {
      // Random project duration between 1 and 12 months
      const durationMonths = Math.floor(Math.random() * 12) + 1;
      
      // Random start date within the next 24 months
      const startDate = getRandomDate(0, 24 - durationMonths);
      const endDate = addMonths(startDate, durationMonths);
      
      // Random budget between $10k and $500k
      const budgetNzd = Math.floor(Math.random() * 490000) + 10000;
      
      // Random status (weighted towards active projects)
      const statusWeights = [0.3, 0.4, 0.05, 0.2, 0.05]; // planned, in-progress, blocked, done, archived
      const randomStatus = Math.random();
      let cumulativeWeight = 0;
      let selectedStatus = statuses[0];
      
      for (let i = 0; i < statuses.length; i++) {
        cumulativeWeight += statusWeights[i];
        if (randomStatus <= cumulativeWeight) {
          selectedStatus = statuses[i];
          break;
        }
      }
      
      return {
        customId: `PROJ-${(index + 1).toString().padStart(3, '0')}-${Date.now()}`,
        title: `${template.title} ${index + 1}`,
        description: template.description,
        lane: template.lane,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        status: selectedStatus,
        pm_name: template.pm,
        budget_nzd: budgetNzd,
        financial_treatment: financialTreatments[Math.floor(Math.random() * financialTreatments.length)]
      };
    });
    
    try {
      console.log(`Creating ${sampleProjects.length} sample projects...`);
      for (const project of sampleProjects) {
        await createProject(project);
        await new Promise(resolve => setTimeout(resolve, 50)); // Reduced delay for faster creation
      }
      console.log('Sample projects created successfully!');
    } catch (error) {
      console.error('Failed to create sample projects:', error);
      addError('Failed to create sample projects. Please check the console for details.');
    }
  };

  const handleEditProject = (project: Project) => {
    setEditModal({ isOpen: true, project });
  };

  const handleCloseEditModal = () => {
    setEditModal({ isOpen: false, project: null });
  };

  const handleSaveProject = async (projectData: any) => {
    try {
      if (editModal.project) {
        const { customId, ...updates } = projectData;
        await updateProject(editModal.project.id, updates);
      } else {
        await createProject(projectData);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  };

  // Filter projects based on selected filters
  const getFilteredProjects = () => {
    const allProjects = getProjectsAsArray();
    
    return allProjects.filter(project => {
      const laneMatch = filters.lane === 'All' || project.lane === filters.lane;
      const pmMatch = filters.pm === 'All' || project.pm_name === filters.pm;
      const statusMatch = filters.status === 'All' || project.status === filters.status;
      
      return laneMatch && pmMatch && statusMatch;
    });
  };

  // Get unique values for filter options
  const getFilterOptions = () => {
    const allProjects = getProjectsAsArray();
    
    const lanes = ['All', ...new Set(allProjects.map(p => p.lane).filter(Boolean))];
    const pms = ['All', ...new Set(allProjects.map(p => p.pm_name).filter(Boolean))];
    const statuses = ['All', 'planned', 'in-progress', 'blocked', 'done', 'archived'];
    
    return { lanes, pms, statuses };
  };

  const renderModuleContent = () => {
    const moduleInfo = moduleInfoData[activeModule] || moduleInfoData.dashboard;

    switch (activeModule) {
      case 'dashboard':
        // Show project details if one is selected
        if (currentView === 'project-detail' && viewingProjectId) {
          return (
            <ContentPane
              activeModule={activeModule}
              title="Project Details"
            >
              <ProjectDetailView 
                projectId={viewingProjectId}
                onBack={showProjectList}
                onEdit={handleEditProject}
              />
            </ContentPane>
          );
        }
        
        // Show roadmap by default
        return (
          <ContentPane
            activeModule={activeModule}
            title="Project Roadmap"
            subtitle="Timeline view of all projects"
            loading={loading.projects}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden'
            }}>
              {/* Refresh button for roadmap */}
              <div style={{
                padding: 'var(--spacing-md)',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={async () => {
                    await loadProjects();
                    // Force GanttChart to reload settings by changing key
                    setGanttRefreshKey(prev => prev + 1);
                  }}
                  disabled={loading.projects}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    cursor: loading.projects ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    transition: 'var(--transition-colors)',
                    opacity: loading.projects ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading.projects) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      e.currentTarget.style.borderColor = 'var(--border-color-dark)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading.projects) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }
                  }}
                >
                  🔄 {loading.projects ? 'Refreshing...' : 'Refresh Timeline'}
                </button>
              </div>
              {!loading.projects && getProjectsAsArray().length > 0 && <GanttChart key={ganttRefreshKey} />}
              {!loading.projects && getProjectsAsArray().length === 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  color: 'var(--text-muted)'
                }}>
                  📊 No projects to display
                </div>
              )}
            </div>
          </ContentPane>
        );

      case 'projects':
        // Use existing project view logic
        if (currentView === 'project-detail' && viewingProjectId) {
          return (
            <ContentPane
              activeModule={activeModule}
              title="Project Details"
            >
              <ProjectDetailView 
                projectId={viewingProjectId}
                onBack={showProjectList}
                onEdit={handleEditProject}
              />
            </ContentPane>
          );
        }
        
        // Render projects view (with table/card toggle)
        return (
          <ContentPane
            activeModule={activeModule}
            title="Project Management"
            subtitle="Manage your roadmap projects and initiatives"
            loading={loading.projects}
          >
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn primary"
                    onClick={handleCreateProject}
                    disabled={loading.mutations}
                  >
                    + New Project
                  </button>
                  <button 
                    className="btn secondary"
                    onClick={handleCreateSampleProject}
                    disabled={loading.mutations}
                  >
                    Create Sample Projects
                  </button>
                  <button 
                    className="btn secondary"
                    onClick={loadProjects}
                    disabled={loading.projects}
                  >
                    Refresh
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280', marginRight: '8px' }}>View:</span>
                  <button
                    className={projectViewMode === 'cards' ? 'btn primary' : 'btn secondary'}
                    onClick={() => setProjectViewMode('cards')}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    📋 Cards
                  </button>
                  <button
                    className={projectViewMode === 'table' ? 'btn primary' : 'btn secondary'}
                    onClick={() => setProjectViewMode('table')}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    📊 Table
                  </button>
                </div>
              </div>
              
              {/* Table View */}
              {projectViewMode === 'table' && (
                <ProjectTableView
                  onSelectProject={(project) => showProjectDetail(project.id)}
                  onEditProject={handleEditProject}
                  selectedProjectId={viewingProjectId}
                />
              )}

              {/* Cards View */}
              {projectViewMode === 'cards' && (
                <>
              {/* Filter Controls */}
              {(() => {
                const { lanes, pms, statuses } = getFilterOptions();
                const filteredProjects = getFilteredProjects();
                
                return (
                  <div style={{ 
                    marginBottom: '20px', 
                    padding: '16px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontWeight: '600', color: '#495057' }}>Filter by:</span>
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>
                        Showing {filteredProjects.length} of {getProjectsAsArray().length} projects
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {/* Lane Filter */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '500', color: '#6c757d' }}>Lane</label>
                        <select
                          value={filters.lane}
                          onChange={(e) => setFilters(prev => ({ ...prev, lane: e.target.value }))}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            backgroundColor: 'white',
                            fontSize: '13px',
                            minWidth: '120px'
                          }}
                        >
                          {lanes.map(lane => (
                            <option key={lane} value={lane}>{lane}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* PM Filter */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '500', color: '#6c757d' }}>Project Manager</label>
                        <select
                          value={filters.pm}
                          onChange={(e) => setFilters(prev => ({ ...prev, pm: e.target.value }))}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            backgroundColor: 'white',
                            fontSize: '13px',
                            minWidth: '140px'
                          }}
                        >
                          {pms.map(pm => (
                            <option key={pm} value={pm}>{pm}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Status Filter */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '500', color: '#6c757d' }}>Status</label>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            backgroundColor: 'white',
                            fontSize: '13px',
                            minWidth: '120px'
                          }}
                        >
                          {statuses.map(status => (
                            <option key={status} value={status}>
                              {status === 'All' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Clear Filters Button */}
                      {(filters.lane !== 'All' || filters.pm !== 'All' || filters.status !== 'All') && (
                        <div style={{ display: 'flex', alignItems: 'end' }}>
                          <button
                            onClick={() => setFilters({ lane: 'All', pm: 'All', status: 'All' })}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: '1px solid #dc3545',
                              backgroundColor: 'white',
                              color: '#dc3545',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#dc3545';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.color = '#dc3545';
                            }}
                          >
                            Clear Filters
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '20px' 
              }}>
                {(() => {
                  const filteredProjects = getFilteredProjects();
                  const displayProjects = showAllProjects ? filteredProjects : filteredProjects.slice(0, 9);
                  
                  return displayProjects.map((project) => (
                  <div 
                    key={project.id}
                    className="card"
                    style={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      padding: '16px'
                    }}
                    onClick={() => showProjectDetail(project.id)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>{project.title}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>
                      {project.description?.substring(0, 120)}...
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginBottom: '8px',
                      flexWrap: 'wrap',
                      fontSize: '11px'
                    }}>
                      {project.lane && (
                        <span style={{ 
                          backgroundColor: '#e3f2fd',
                          color: '#1565c0',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: '500'
                        }}>
                          {project.lane}
                        </span>
                      )}
                      {project.pm_name && (
                        <span style={{ 
                          backgroundColor: '#f3e5f5',
                          color: '#6a1b9a',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: '500'
                        }}>
                          PM: {project.pm_name}
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '12px'
                    }}>
                      <span className={`status-${project.status}`} style={{ 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        fontWeight: '600'
                      }}>
                        {project.status}
                      </span>
                      <span style={{ color: '#28a745', fontWeight: '600' }}>
                        NZD ${(project.budget_nzd / 1000).toFixed(0)}k
                      </span>
                    </div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* Show All/Show Less button */}
              {(() => {
                const filteredProjects = getFilteredProjects();
                return filteredProjects.length > 9 && (
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '24px' 
                  }}>
                    <button
                      className="btn secondary"
                      onClick={() => setShowAllProjects(!showAllProjects)}
                      style={{
                        minWidth: '120px'
                      }}
                    >
                      {showAllProjects ? 'Show Less' : `Show All (${filteredProjects.length})`}
                    </button>
                  </div>
                );
              })()}
                </>
              )}
            </div>
          </ContentPane>
        );

      case 'quick-task':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Quick Task Creation"
            subtitle="Create and assign tasks to projects"
          >
            <QuickTaskForm onTaskCreated={(id) => console.log('Task created:', id)} />
          </ContentPane>
        );

      case 'epic-features':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Epics & Features Management"
            subtitle="Advanced Epic and Feature management with ADO integration"
          >
            <EnhancedEpicFeatureManager />
          </ContentPane>
        );

      case 'config':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Epic & Feature Configuration"
            subtitle="Configure default values to speed up Epic and Feature creation"
          >
            <EpicFeatureConfig />
          </ContentPane>
        );

      case 'tests':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Test Suite Management"
            subtitle="Run and monitor test suites with detailed output analysis"
          >
            <TestSuite />
          </ContentPane>
        );

      case 'ado-config':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Azure DevOps Configuration"
            subtitle="Configure ADO integration settings"
          >
            <ADOConfigManager />
          </ContentPane>
        );

      case 'components':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Component Library"
            subtitle="Reusable React components and UI elements"
          >
            <EmptyState
              icon="🧩"
              title="Component Library"
              description="Browse and manage reusable React components. This module will display available UI components, their documentation, and usage examples."
              actionText="Browse Components"
              onAction={() => console.log('Browse components')}
            />
          </ContentPane>
        );

      case 'services':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Service Layer"
            subtitle="Backend services and API integrations"
          >
            <EmptyState
              icon="⚙️"
              title="Service Management"
              description="Monitor and manage backend services, API integrations, and system components. View service status, performance metrics, and configuration."
              actionText="View Services"
              onAction={() => console.log('View services')}
            />
          </ContentPane>
        );

      case 'settings':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Application Settings"
            subtitle="Configure preferences and system options"
          >
            <Settings />
          </ContentPane>
        );

      case 'calendar':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Calendar Management"
            subtitle="Manage working days, holidays, and work hours"
          >
            <CalendarManager />
          </ContentPane>
        );

      case 'coordinator':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Project Coordinator"
            subtitle="Financial tracking and resource management"
          >
            <ProjectCoordinatorDashboard />
          </ContentPane>
        );

      case 'resources':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Resource Management"
            subtitle="Manage resources, commitments, allocations, and capacity"
          >
            <ResourceManagement />
          </ContentPane>
        );

      case 'governance-dashboard':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Portfolio Governance"
            subtitle="Executive dashboard with portfolio health metrics"
          >
            <GovernanceDashboard />
          </ContentPane>
        );

      case 'governance-analytics':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Portfolio Analytics"
            subtitle="Advanced analytics, heatmaps, and trends"
          >
            <GovernanceAnalytics />
          </ContentPane>
        );

      case 'export-import':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Export & Import Data"
            subtitle="Export data to CSV or import from existing files"
          >
            <ExportImport />
          </ContentPane>
        );

      case 'guides':
        return (
          <ContentPane
            activeModule={activeModule}
            title="User Guides"
            subtitle="Tutorials and documentation"
          >
            <EmptyState
              icon="📚"
              title="User Guides & Tutorials"
              description="Access comprehensive guides, tutorials, and best practices to help you make the most of the Roadmap Tool."
            />
          </ContentPane>
        );

      case 'documentation':
        return (
          <ContentPane
            activeModule={activeModule}
            title="Technical Documentation"
            subtitle="API references and technical guides"
          >
            <EmptyState
              icon="📖"
              title="Technical Documentation"
              description="Access detailed technical documentation, API references, and development resources."
            />
          </ContentPane>
        );

      default:
        return (
          <ContentPane
            activeModule={activeModule}
            title={moduleInfo.title}
            subtitle={moduleInfo.description}
          >
            <EmptyState
              icon="🚧"
              title="Module Under Development"
              description="This module is currently being developed. Check back soon for new features and functionality."
            />
          </ContentPane>
        );
    }
  };

  const currentModuleInfo = moduleInfoData[activeModule] || moduleInfoData.dashboard;

  return (
    <ErrorBoundary>
      <div className="app-container">
        <NavigationSidebar 
          activeItem={activeModule}
          onItemSelect={handleModuleSelect}
        />
        
        <div className="app-main">
          {renderModuleContent()}
          
          <InfoPane 
            activeModule={activeModule}
            moduleInfo={currentModuleInfo}
            onNavigate={handleModuleSelect}
          />
        </div>

        {/* Existing modals */}
        <ProjectEditForm
          project={editModal.project}
          isOpen={editModal.isOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveProject}
          isLoading={loading.mutations}
          existingProjects={getProjectsAsArray()}
        />
        
        <TestRunner
          isOpen={testRunnerOpen}
          onClose={() => setTestRunnerOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
};