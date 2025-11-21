/**
 * @jest-environment jsdom
 * 
 * Test Suite for PRDIntegration
 * 
 * Tests cover:
 * - System initialization with all managers
 * - Data seeding functionality
 * - Project lifecycle management
 * - CSV import/export workflows
 * - Backup and restore operations
 * - Project readiness validation
 * - System health checks
 * - Error handling and edge cases
 */

import PRDIntegration from '../../src/js/prd-integration.js';
import ProjectManager from '../../src/js/project-manager.js';
import TaskManager from '../../src/js/task-manager.js';
import ResourceManager from '../../src/js/resource-manager.js';
import ForecastingEngine from '../../src/js/forecasting-engine.js';
import FinancialManager from '../../src/js/financial-manager.js';
import DataPersistenceManager from '../../src/js/data-persistence-manager.js';
import CSVManager from '../../src/js/csv-manager.js';

// Mock all dependencies
jest.mock('../../src/js/project-manager.js');
jest.mock('../../src/js/task-manager.js');
jest.mock('../../src/js/resource-manager.js');
jest.mock('../../src/js/forecasting-engine.js');
jest.mock('../../src/js/financial-manager.js');
jest.mock('../../src/js/data-persistence-manager.js');
jest.mock('../../src/js/csv-manager.js');

describe('PRDIntegration', () => {
  let prdIntegration;
  let mockProjectManager;
  let mockTaskManager;
  let mockResourceManager;
  let mockForecastingEngine;
  let mockFinancialManager;
  let mockDataPersistenceManager;
  let mockCSVManager;

  beforeEach(() => {
    // Setup mock instances with required methods
    mockProjectManager = {
      createProject: jest.fn(),
      getProject: jest.fn(),
      updateProject: jest.fn(),
      deleteProject: jest.fn(),
      listProjects: jest.fn(() => []),
      validateProject: jest.fn()
    };

    mockTaskManager = {
      createTask: jest.fn(),
      getTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      getProjectTasks: jest.fn(() => []),
      calculateProjectProgress: jest.fn(() => 0)
    };

    mockResourceManager = {
      createResource: jest.fn(),
      getResource: jest.fn(),
      updateResource: jest.fn(),
      deleteResource: jest.fn(),
      getProjectResources: jest.fn(() => []),
      calculateResourceUtilization: jest.fn()
    };

    mockForecastingEngine = {
      createProjectForecast: jest.fn(() => ({
        project_id: 'test-proj',
        forecast_date: '01/01/2025',
        estimated_completion: '31/12/2025',
        confidence_rating: 85,
        warnings: [],
        recommendations: []
      }))
    };

    mockFinancialManager = {
      getProjectBudget: jest.fn(),
      setProjectBudget: jest.fn(),
      calculateProjectActualCosts: jest.fn(() => ({ total_cost_cents: 0 })),
      calculateVariance: jest.fn(() => ({ variance_cents: 0 }))
    };

    mockDataPersistenceManager = {
      saveProjects: jest.fn(),
      loadProjects: jest.fn(() => []),
      backupProjects: jest.fn(() => 'backup_key_123'),
      restoreProjects: jest.fn(),
      listBackups: jest.fn(() => [])
    };

    mockCSVManager = {
      exportProjectsCSV: jest.fn(() => 'csv,data'),
      exportTasksCSV: jest.fn(() => 'csv,data'),
      exportResourcesCSV: jest.fn(() => 'csv,data'),
      parseCSV: jest.fn(() => [])
    };

    // Mock constructors to return our mocks
    ProjectManager.mockImplementation(() => mockProjectManager);
    TaskManager.mockImplementation(() => mockTaskManager);
    ResourceManager.mockImplementation(() => mockResourceManager);
    ForecastingEngine.mockImplementation(() => mockForecastingEngine);
    FinancialManager.mockImplementation(() => mockFinancialManager);
    DataPersistenceManager.mockImplementation(() => mockDataPersistenceManager);
    CSVManager.mockImplementation(() => mockCSVManager);

    prdIntegration = new PRDIntegration();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize all managers correctly', () => {
      expect(ProjectManager).toHaveBeenCalledWith(mockDataPersistenceManager);
      expect(TaskManager).toHaveBeenCalledWith(mockProjectManager, mockResourceManager);
      expect(ResourceManager).toHaveBeenCalledWith(mockProjectManager);
      expect(ForecastingEngine).toHaveBeenCalledWith(
        mockProjectManager,
        mockTaskManager,
        mockResourceManager,
        mockFinancialManager
      );
      expect(FinancialManager).toHaveBeenCalledWith(
        mockProjectManager,
        mockResourceManager,
        mockTaskManager
      );
      expect(CSVManager).toHaveBeenCalledWith(
        mockProjectManager,
        mockTaskManager,
        mockResourceManager
      );
    });

    test('should expose all managers as properties', () => {
      expect(prdIntegration.projectManager).toBe(mockProjectManager);
      expect(prdIntegration.taskManager).toBe(mockTaskManager);
      expect(prdIntegration.resourceManager).toBe(mockResourceManager);
      expect(prdIntegration.forecastingEngine).toBe(mockForecastingEngine);
      expect(prdIntegration.financialManager).toBe(mockFinancialManager);
      expect(prdIntegration.dataPersistenceManager).toBe(mockDataPersistenceManager);
      expect(prdIntegration.csvManager).toBe(mockCSVManager);
    });
  });

  describe('seedSampleData', () => {
    test('should create sample projects, tasks, and resources', () => {
      const result = prdIntegration.seedSampleData();

      expect(mockProjectManager.createProject).toHaveBeenCalled();
      expect(mockTaskManager.createTask).toHaveBeenCalled();
      expect(mockResourceManager.createResource).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toContain('Sample data seeded successfully');
    });

    test('should handle seeding errors gracefully', () => {
      mockProjectManager.createProject.mockImplementation(() => {
        throw new Error('Seeding failed');
      });

      const result = prdIntegration.seedSampleData();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Seeding failed');
    });
  });

  describe('createProject', () => {
    test('should create project with validation', () => {
      const projectData = {
        title: 'Test Project',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };

      mockProjectManager.createProject.mockReturnValue({
        id: 'proj-001',
        ...projectData
      });

      const result = prdIntegration.createProject(projectData);

      expect(mockProjectManager.createProject).toHaveBeenCalledWith(projectData);
      expect(result.id).toBe('proj-001');
    });

    test('should handle project creation errors', () => {
      mockProjectManager.createProject.mockImplementation(() => {
        throw new Error('Creation failed');
      });

      expect(() => {
        prdIntegration.createProject({});
      }).toThrow('Creation failed');
    });
  });

  describe('approveProjectToNextStage', () => {
    test('should update project status with validation', () => {
      const project = {
        id: 'proj-001',
        status: 'concept-design'
      };

      mockProjectManager.getProject.mockReturnValue(project);
      mockProjectManager.updateProject.mockReturnValue({
        ...project,
        status: 'solution-design'
      });

      const result = prdIntegration.approveProjectToNextStage('proj-001', 'solution-design');

      expect(mockProjectManager.getProject).toHaveBeenCalledWith('proj-001');
      expect(mockProjectManager.updateProject).toHaveBeenCalledWith('proj-001', {
        status: 'solution-design'
      });
      expect(result.status).toBe('solution-design');
    });

    test('should throw error for non-existent project', () => {
      mockProjectManager.getProject.mockReturnValue(null);

      expect(() => {
        prdIntegration.approveProjectToNextStage('nonexistent', 'solution-design');
      }).toThrow('Project not found: nonexistent');
    });

    test('should handle status update validation errors', () => {
      const project = { id: 'proj-001', status: 'concept-design' };
      mockProjectManager.getProject.mockReturnValue(project);
      mockProjectManager.updateProject.mockImplementation(() => {
        throw new Error('Invalid status transition');
      });

      expect(() => {
        prdIntegration.approveProjectToNextStage('proj-001', 'invalid-status');
      }).toThrow('Invalid status transition');
    });
  });

  describe('generateProjectForecast', () => {
    test('should create and return forecast', () => {
      const projectId = 'proj-001';
      const expectedForecast = {
        project_id: projectId,
        forecast_date: '01/01/2025',
        estimated_completion: '31/12/2025',
        confidence_rating: 85
      };

      mockForecastingEngine.createProjectForecast.mockReturnValue(expectedForecast);

      const result = prdIntegration.generateProjectForecast(projectId);

      expect(mockForecastingEngine.createProjectForecast).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(expectedForecast);
    });

    test('should handle forecasting errors', () => {
      mockForecastingEngine.createProjectForecast.mockImplementation(() => {
        throw new Error('Forecasting failed');
      });

      expect(() => {
        prdIntegration.generateProjectForecast('proj-001');
      }).toThrow('Forecasting failed');
    });
  });

  describe('CSV Operations', () => {
    test('should export all data to CSV', () => {
      const result = prdIntegration.exportAllDataCSV('simple');

      expect(mockCSVManager.exportProjectsCSV).toHaveBeenCalledWith('simple');
      expect(mockCSVManager.exportTasksCSV).toHaveBeenCalledWith('simple');
      expect(mockCSVManager.exportResourcesCSV).toHaveBeenCalledWith('simple');
      expect(result.projects).toBe('csv,data');
      expect(result.tasks).toBe('csv,data');
      expect(result.resources).toBe('csv,data');
    });

    test('should handle CSV export errors', () => {
      mockCSVManager.exportProjectsCSV.mockImplementation(() => {
        throw new Error('Export failed');
      });

      expect(() => {
        prdIntegration.exportAllDataCSV('simple');
      }).toThrow('Export failed');
    });

    test('should import CSV data', () => {
      const csvData = 'id,title\nproj-001,Test Project';
      mockCSVManager.parseCSV.mockReturnValue([
        { id: 'proj-001', title: 'Test Project' }
      ]);

      const result = prdIntegration.importProjectsFromCSV(csvData);

      expect(mockCSVManager.parseCSV).toHaveBeenCalledWith(csvData);
      expect(result.imported).toBe(1);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Backup and Restore', () => {
    test('should create system backup', () => {
      const result = prdIntegration.backupSystem();

      expect(mockDataPersistenceManager.backupProjects).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.backupKey).toBe('backup_key_123');
    });

    test('should restore from backup', () => {
      const backupKey = 'backup_key_123';
      const result = prdIntegration.restoreFromBackup(backupKey);

      expect(mockDataPersistenceManager.restoreProjects).toHaveBeenCalledWith(backupKey);
      expect(result.success).toBe(true);
    });

    test('should list available backups', () => {
      mockDataPersistenceManager.listBackups.mockReturnValue([
        'backup_1', 'backup_2'
      ]);

      const result = prdIntegration.listBackups();

      expect(result).toEqual(['backup_1', 'backup_2']);
    });

    test('should handle backup errors', () => {
      mockDataPersistenceManager.backupProjects.mockImplementation(() => {
        throw new Error('Backup failed');
      });

      const result = prdIntegration.backupSystem();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Backup failed');
    });

    test('should handle restore errors', () => {
      mockDataPersistenceManager.restoreProjects.mockImplementation(() => {
        throw new Error('Restore failed');
      });

      const result = prdIntegration.restoreFromBackup('invalid_key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Restore failed');
    });
  });

  describe('getProjectStatus', () => {
    test('should return comprehensive project status', () => {
      const project = {
        id: 'proj-001',
        title: 'Test Project',
        status: 'engineering'
      };

      mockProjectManager.getProject.mockReturnValue(project);
      mockTaskManager.getProjectTasks.mockReturnValue([{ id: 'task-1' }]);
      mockResourceManager.getProjectResources.mockReturnValue([{ id: 'res-1' }]);
      mockTaskManager.calculateProjectProgress.mockReturnValue(65);
      mockFinancialManager.calculateProjectActualCosts.mockReturnValue({
        total_cost_cents: 50000
      });

      const result = prdIntegration.getProjectStatus('proj-001');

      expect(result.project).toEqual(project);
      expect(result.progress_percentage).toBe(65);
      expect(result.task_count).toBe(1);
      expect(result.resource_count).toBe(1);
      expect(result.current_cost_cents).toBe(50000);
    });

    test('should handle non-existent project', () => {
      mockProjectManager.getProject.mockReturnValue(null);

      expect(() => {
        prdIntegration.getProjectStatus('nonexistent');
      }).toThrow('Project not found: nonexistent');
    });
  });

  describe('validateProjectReadiness', () => {
    test('should validate project readiness for next stage', () => {
      const project = {
        id: 'proj-001',
        status: 'concept-design',
        budget_cents: 1000000
      };

      mockProjectManager.getProject.mockReturnValue(project);

      const result = prdIntegration.validateProjectReadiness('proj-001', 'solution-design');

      expect(result.ready).toBe(true);
      expect(result.blockers).toEqual([]);
    });

    test('should identify readiness blockers', () => {
      const project = {
        id: 'proj-001',
        status: 'solution-design',
        budget_cents: 0 // This should block progression to engineering
      };

      mockProjectManager.getProject.mockReturnValue(project);
      mockTaskManager.getProjectTasks.mockReturnValue([]); // No tasks

      const result = prdIntegration.validateProjectReadiness('proj-001', 'engineering');

      expect(result.ready).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
    });

    test('should handle validation for non-existent project', () => {
      mockProjectManager.getProject.mockReturnValue(null);

      expect(() => {
        prdIntegration.validateProjectReadiness('nonexistent', 'engineering');
      }).toThrow('Project not found: nonexistent');
    });
  });

  describe('getSystemHealth', () => {
    test('should return system health status', () => {
      mockProjectManager.listProjects.mockReturnValue([
        { id: 'proj-1', status: 'engineering' },
        { id: 'proj-2', status: 'completed' }
      ]);

      const result = prdIntegration.getSystemHealth();

      expect(result.status).toBe('healthy');
      expect(result.project_count).toBe(2);
      expect(result.active_projects).toBe(1);
      expect(result.completed_projects).toBe(1);
      expect(result.timestamp).toBeDefined();
    });

    test('should handle system health check errors', () => {
      mockProjectManager.listProjects.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = prdIntegration.getSystemHealth();

      expect(result.status).toBe('error');
      expect(result.error).toContain('Database error');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle null/undefined inputs gracefully', () => {
      expect(() => {
        prdIntegration.createProject(null);
      }).toThrow();

      expect(() => {
        prdIntegration.approveProjectToNextStage(null, 'engineering');
      }).toThrow();
    });

    test('should handle manager initialization failures', () => {
      ProjectManager.mockImplementation(() => {
        throw new Error('Manager init failed');
      });

      expect(() => {
        new PRDIntegration();
      }).toThrow('Manager init failed');
    });
  });

  describe('Integration Workflows', () => {
    test('should handle complete project lifecycle', () => {
      const projectData = {
        title: 'Lifecycle Test Project',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };

      // Create project
      mockProjectManager.createProject.mockReturnValue({
        id: 'proj-lifecycle',
        ...projectData,
        status: 'concept-design'
      });

      const project = prdIntegration.createProject(projectData);
      expect(project.id).toBe('proj-lifecycle');

      // Progress through stages
      mockProjectManager.getProject.mockReturnValue(project);
      mockProjectManager.updateProject.mockReturnValue({
        ...project,
        status: 'solution-design'
      });

      const updatedProject = prdIntegration.approveProjectToNextStage(
        'proj-lifecycle',
        'solution-design'
      );
      expect(updatedProject.status).toBe('solution-design');

      // Generate forecast
      const forecast = prdIntegration.generateProjectForecast('proj-lifecycle');
      expect(forecast.project_id).toBe('proj-lifecycle');
    });

    test('should handle data export/import cycle', () => {
      // Export data
      const exported = prdIntegration.exportAllDataCSV('full');
      expect(exported.projects).toBe('csv,data');

      // Import data
      const imported = prdIntegration.importProjectsFromCSV('id,title\nproj-001,Imported Project');
      expect(imported.imported).toBe(1);
    });

    test('should handle backup/restore cycle', () => {
      // Create backup
      const backup = prdIntegration.backupSystem();
      expect(backup.success).toBe(true);

      // List backups
      const backups = prdIntegration.listBackups();
      expect(Array.isArray(backups)).toBe(true);

      // Restore backup
      const restore = prdIntegration.restoreFromBackup(backup.backupKey);
      expect(restore.success).toBe(true);
    });
  });
});