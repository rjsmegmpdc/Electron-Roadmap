/**
 * @jest-environment jsdom
 * 
 * Integration Test Suite for ProjectManager
 * 
 * Tests ProjectManager with real DataPersistenceManager and DateUtils
 * to validate complete integration using sample data fixtures.
 * 
 * Tests cover:
 * - Full CRUD workflows with persistence
 * - Date validation integration
 * - Status gate enforcement with real data
 * - Field format validation
 * - Error handling across components
 */

import ProjectManager from '../../src/js/project-manager.js';
import DataPersistenceManager from '../../src/js/data-persistence-manager.js';
import DateUtils from '../../src/js/date-utils.js';
import {
  VALID_PROJECTS,
  LANE_EXAMPLES,
  INVALID_DATA,
  DATE_EXAMPLES,
  ENUM_VALUES,
  STATUS_GATE_SCENARIOS,
  EDGE_CASES,
  UPDATE_SCENARIOS,
  createTestProject,
  createProjectsForAllStatuses
} from '../fixtures/sample-projects.js';

// Mock localStorage for DataPersistenceManager
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

describe('ProjectManager Integration Tests', () => {
  let projectManager;
  let dataPM;

  beforeEach(() => {
    // Clear localStorage mock
    window.localStorage.getItem.mockClear();
    window.localStorage.setItem.mockClear();
    window.localStorage.removeItem.mockClear();
    
    // Start with empty storage
    window.localStorage.getItem.mockReturnValue('[]');
    
    // Mock setItem to actually store data in memory for tests
    const storage = {};
    window.localStorage.setItem.mockImplementation((key, value) => {
      storage[key] = value;
    });
    window.localStorage.getItem.mockImplementation((key) => {
      return storage[key] || null;
    });
    
    // Create real instances
    dataPM = new DataPersistenceManager();
    projectManager = new ProjectManager(dataPM);
  });

  describe('Full CRUD Integration', () => {
    test('should create, read, update, and delete projects using sample data', () => {
      const conceptProject = createTestProject({
        id: 'integration-001',
        title: 'Integration Test Project',
        status: 'concept-design',
        budget_cents: 0
      });

      // CREATE: Create the project
      const created = projectManager.createProject(conceptProject);
      expect(created.id).toBe('integration-001');
      expect(created.status).toBe('concept-design');
      expect(window.localStorage.setItem).toHaveBeenCalled();

      // READ: Retrieve the project
      const retrieved = projectManager.getProject('integration-001');
      expect(retrieved).toEqual(created);

      // UPDATE: Add budget and move to solution-design
      const updated = projectManager.updateProject('integration-001', {
        budget_cents: 1000000,
        status: 'solution-design'
      });
      expect(updated.budget_cents).toBe(1000000);
      expect(updated.status).toBe('solution-design');

      // DELETE: Remove the project
      const deleted = projectManager.deleteProject('integration-001');
      expect(deleted).toBe(true);
      
      const afterDelete = projectManager.getProject('integration-001');
      expect(afterDelete).toBeNull();
    });

    test('should handle multiple projects with different lanes', () => {
      Object.values(LANE_EXAMPLES).forEach(projectData => {
        const created = projectManager.createProject(projectData);
        expect(created.lane).toBe(projectData.lane);
        expect(created.id).toBe(projectData.id);
      });

      const allProjects = projectManager.listProjects();
      expect(allProjects).toHaveLength(4); // office365, euc, compliance, other
      
      // Verify each lane is represented
      ENUM_VALUES.lanes.forEach(lane => {
        const projectsInLane = allProjects.filter(p => p.lane === lane);
        expect(projectsInLane).toHaveLength(1);
      });
    });
  });

  describe('Status Gate Integration', () => {
    test('should enforce solution-design budget requirement', () => {
      const project = projectManager.createProject(STATUS_GATE_SCENARIOS.solutionDesignWithoutBudget);
      
      expect(() => {
        projectManager.updateProject(project.id, { status: 'solution-design' });
      }).toThrow('Cannot enter solution-design without budget');
      
      // Should work with budget
      const updated = projectManager.updateProject(project.id, { 
        budget_cents: 1000000,
        status: 'solution-design'
      });
      expect(updated.status).toBe('solution-design');
    });

    test('should enforce engineering tasks requirement', () => {
      const project = projectManager.createProject(STATUS_GATE_SCENARIOS.engineeringWithoutTasks);
      
      expect(() => {
        projectManager.updateProject(project.id, { status: 'engineering' });
      }).toThrow('Cannot enter engineering without tasks');
      
      // Should work with tasks
      const updated = projectManager.updateProject(project.id, {
        tasks: [{ id: 'task-1', status: 'in-progress' }],
        status: 'engineering'
      });
      expect(updated.status).toBe('engineering');
    });

    test('should enforce UAT forecasts requirement', () => {
      const project = projectManager.createProject(STATUS_GATE_SCENARIOS.uatWithoutForecasts);
      
      expect(() => {
        projectManager.updateProject(project.id, { status: 'uat' });
      }).toThrow('Cannot enter uat without forecast');
      
      // Should work with forecasts
      const updated = projectManager.updateProject(project.id, {
        forecasts: [{ id: 'forecast-1', month: '2025-01' }],
        status: 'uat'
      });
      expect(updated.status).toBe('uat');
    });

    test('should enforce release completion requirement', () => {
      const project = projectManager.createProject(STATUS_GATE_SCENARIOS.releaseWithIncompleteTasks);
      
      expect(() => {
        projectManager.updateProject(project.id, { status: 'release' });
      }).toThrow('Cannot enter release with incomplete tasks');
      
      // Should work with all completed tasks
      const updated = projectManager.updateProject(project.id, {
        tasks: [
          { id: 'task-001', status: 'completed' },
          { id: 'task-002', status: 'completed' }
        ],
        status: 'release'
      });
      expect(updated.status).toBe('release');
    });
  });

  describe('Field Validation Integration', () => {
    test('should validate all required fields from sample invalid data', () => {
      Object.entries(INVALID_DATA).forEach(([key, invalidData]) => {
        expect(() => {
          projectManager.createProject({ ...invalidData, id: `invalid-${key}` });
        }).toThrow();
      });
    });

    test('should handle edge cases from sample data', () => {
      // Minimum valid project
      const minimal = projectManager.createProject({
        ...EDGE_CASES.minimumValidProject,
        id: 'minimal-test'
      });
      expect(minimal.budget_cents).toBe(0);
      
      // Maximum budget
      const maxBudget = projectManager.createProject({
        ...EDGE_CASES.maximumBudget,
        id: 'max-budget-test'
      });
      expect(maxBudget.budget_cents).toBe(999999999999);
      
      // Long title
      const longTitle = projectManager.createProject({
        ...EDGE_CASES.longTitle,
        id: 'long-title-test'
      });
      expect(longTitle.title.length).toBeGreaterThan(100);
    });
  });

  describe('Complete Project Lifecycle Integration', () => {
    test('should create a project and transition through all statuses', () => {
      // Start with concept design
      let project = projectManager.createProject({
        id: 'lifecycle-test',
        title: 'Complete Lifecycle Test',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        budget_cents: 0,
        financial_treatment: 'CAPEX'
      });
      expect(project.status).toBe('concept-design');
      
      // Move to solution-design (requires budget)
      project = projectManager.updateProject('lifecycle-test', {
        budget_cents: 5000000,
        status: 'solution-design'
      });
      expect(project.status).toBe('solution-design');
      
      // Move to engineering (requires tasks)
      project = projectManager.updateProject('lifecycle-test', {
        tasks: [
          { id: 'task-1', title: 'Development', status: 'in-progress' },
          { id: 'task-2', title: 'Testing', status: 'planned' }
        ],
        status: 'engineering'
      });
      expect(project.status).toBe('engineering');
      
      // Move to UAT (requires forecasts)
      project = projectManager.updateProject('lifecycle-test', {
        forecasts: [
          { id: 'forecast-1', month: '2025-06', capex_cents: 100000 }
        ],
        status: 'uat'
      });
      expect(project.status).toBe('uat');
      
      // Move to release (requires all tasks completed)
      project = projectManager.updateProject('lifecycle-test', {
        tasks: [
          { id: 'task-1', title: 'Development', status: 'completed' },
          { id: 'task-2', title: 'Testing', status: 'completed' }
        ],
        status: 'release'
      });
      expect(project.status).toBe('release');
      
      // Verify final state
      const finalProject = projectManager.getProject('lifecycle-test');
      expect(finalProject.status).toBe('release');
      expect(finalProject.budget_cents).toBe(5000000);
      expect(finalProject.tasks).toHaveLength(2);
      expect(finalProject.forecasts).toHaveLength(1);
      expect(finalProject.tasks.every(task => task.status === 'completed')).toBe(true);
    });
  });

  describe('Bulk Operations with Sample Data', () => {
    test('should create multiple projects across all statuses', () => {
      const projects = createProjectsForAllStatuses();
      
      projects.forEach(project => {
        const created = projectManager.createProject(project);
        expect(created.status).toBe(project.status);
      });
      
      const allProjects = projectManager.listProjects();
      expect(allProjects).toHaveLength(ENUM_VALUES.statuses.length);
      
      // Verify each status is represented
      ENUM_VALUES.statuses.forEach(status => {
        const projectsInStatus = allProjects.filter(p => p.status === status);
        expect(projectsInStatus).toHaveLength(1);
      });
    });

    test('should handle update scenarios from sample data', () => {
      const baseProject = projectManager.createProject({
        id: 'update-test',
        ...createTestProject({
          budget_cents: 1000000,
          tasks: [{ id: 'task-1', status: 'completed' }],
          forecasts: [{ id: 'forecast-1', month: '2025-01' }]
        })
      });
      
      Object.entries(UPDATE_SCENARIOS).forEach(([scenarioName, updates]) => {
        // Skip status updates that might fail gate validation
        if (scenarioName === 'statusUpdate' && updates.status === 'engineering') {
          // First add tasks to allow engineering status
          projectManager.updateProject('update-test', {
            tasks: [{ id: 'task-eng', status: 'in-progress' }]
          });
        }
        
        const updated = projectManager.updateProject('update-test', updates);
        
        Object.entries(updates).forEach(([key, value]) => {
          expect(updated[key]).toBe(value);
        });
      });
    });
  });

  describe('Persistence Integration', () => {
    test('should persist data through localStorage', () => {
      const project = projectManager.createProject({
        id: 'persistence-test',
        ...createTestProject()
      });
      
      // Verify localStorage was called
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'projectsData',
        expect.stringContaining('persistence-test')
      );
      
      // Simulate reload by creating new instances
      const savedData = JSON.stringify([project]);
      window.localStorage.getItem.mockReturnValue(savedData);
      
      const newDataPM = new DataPersistenceManager();
      const newProjectManager = new ProjectManager(newDataPM);
      
      const retrieved = newProjectManager.getProject('persistence-test');
      expect(retrieved).toEqual(project);
    });
  });
});