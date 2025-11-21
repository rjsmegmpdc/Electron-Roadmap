/**
 * @jest-environment jsdom
 * 
 * Test Suite for ProjectManager
 * 
 * Tests cover:
 * - CRUD operations with persistence via DataPersistenceManager
 * - Project validation using DateUtils
 * - Lifecycle gates enforcement
 * - Required field validation
 * - Date validation and comparison
 * - Status gate rules
 * - Edge cases and error handling
 */

import ProjectManager from '../../src/js/project-manager.js';
import DataPersistenceManager from '../../src/js/data-persistence-manager.js';
import DateUtils from '../../src/js/date-utils.js';

// Mock the dependencies
jest.mock('../../src/js/data-persistence-manager.js');
jest.mock('../../src/js/date-utils.js');

describe('ProjectManager', () => {
  let projectManager;
  let mockDataPM;
  let testProject;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock DataPersistenceManager instance
    mockDataPM = {
      loadProjects: jest.fn(),
      saveProjects: jest.fn()
    };
    DataPersistenceManager.mockImplementation(() => mockDataPM);
    
    // Setup DateUtils mocks
    DateUtils.isValidNZ = jest.fn();
    DateUtils.compareNZ = jest.fn();
    
    // Create ProjectManager instance
    projectManager = new ProjectManager(mockDataPM);
    
    // Default test project
    testProject = {
      id: 'test-proj-001',
      title: 'Test Project',
      description: 'A test project',
      lane: 'office365',
      start_date: '01-01-2025',
      end_date: '30-06-2025',
      status: 'concept-design',
      pm_name: 'John Doe',
      budget_cents: 1000000,
      financial_treatment: 'CAPEX',
      tasks: [],
      resources: [],
      forecasts: []
    };
  });

  describe('Constructor', () => {
    test('should accept DataPersistenceManager dependency', () => {
      const pm = new ProjectManager(mockDataPM);
      expect(pm).toBeDefined();
      expect(pm.dataPM).toBe(mockDataPM);
    });
  });

  describe('createProject', () => {
    beforeEach(() => {
      mockDataPM.loadProjects.mockReturnValue([]);
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1); // start_date < end_date
    });

    test('should create a project with all required fields', () => {
      const created = projectManager.createProject(testProject);
      
      expect(created).toEqual(testProject);
      expect(mockDataPM.saveProjects).toHaveBeenCalledWith([testProject]);
    });

    test('should generate ID if not provided', () => {
      const projectWithoutId = { ...testProject };
      delete projectWithoutId.id;
      
      const created = projectManager.createProject(projectWithoutId);
      
      expect(created.id).toBeDefined();
      expect(typeof created.id).toBe('string');
      expect(created.id.length).toBeGreaterThan(0);
    });

    test('should initialize empty arrays for tasks, resources, forecasts', () => {
      const minimalProject = {
        title: 'Minimal Project',
        start_date: '01-01-2025',
        end_date: '30-06-2025',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      const created = projectManager.createProject(minimalProject);
      
      expect(created.tasks).toEqual([]);
      expect(created.resources).toEqual([]);
      expect(created.forecasts).toEqual([]);
    });

    test('should set default status to concept-design', () => {
      const projectWithoutStatus = { ...testProject };
      delete projectWithoutStatus.status;
      
      const created = projectManager.createProject(projectWithoutStatus);
      
      expect(created.status).toBe('concept-design');
    });

    describe('Validation Errors', () => {
      test('should throw error for missing title', () => {
        const invalidProject = { ...testProject };
        delete invalidProject.title;
        
        expect(() => {
          projectManager.createProject(invalidProject);
        }).toThrow('Project title is required');
      });

      test('should throw error for missing start_date', () => {
        const invalidProject = { ...testProject };
        delete invalidProject.start_date;
        
        expect(() => {
          projectManager.createProject(invalidProject);
        }).toThrow('Project start_date is required');
      });

      test('should throw error for missing end_date', () => {
        const invalidProject = { ...testProject };
        delete invalidProject.end_date;
        
        expect(() => {
          projectManager.createProject(invalidProject);
        }).toThrow('Project end_date is required');
      });

      test('should throw error for missing budget_cents', () => {
        const invalidProject = { ...testProject };
        delete invalidProject.budget_cents;
        
        expect(() => {
          projectManager.createProject(invalidProject);
        }).toThrow('Project budget_cents is required');
      });

      test('should throw error for missing financial_treatment', () => {
        const invalidProject = { ...testProject };
        delete invalidProject.financial_treatment;
        
        expect(() => {
          projectManager.createProject(invalidProject);
        }).toThrow('Project financial_treatment is required');
      });

      test('should throw error for invalid start_date format', () => {
        DateUtils.isValidNZ.mockReturnValueOnce(false);
        
        expect(() => {
          projectManager.createProject(testProject);
        }).toThrow('Project start_date is required');
      });

      test('should throw error for invalid end_date format', () => {
        DateUtils.isValidNZ.mockReturnValueOnce(true).mockReturnValueOnce(false);
        
        expect(() => {
          projectManager.createProject(testProject);
        }).toThrow('Project end_date is required');
      });

      test('should throw error when end_date is not after start_date', () => {
        DateUtils.compareNZ.mockReturnValue(1); // start_date > end_date
        
        expect(() => {
          projectManager.createProject(testProject);
        }).toThrow('Project end_date must be after start_date');
      });

      test('should throw error when end_date equals start_date', () => {
        DateUtils.compareNZ.mockReturnValue(0); // start_date === end_date
        
        expect(() => {
          projectManager.createProject(testProject);
        }).toThrow('Project end_date must be after start_date');
      });

      test('should throw error for negative budget_cents', () => {
        const invalidProject = { ...testProject, budget_cents: -1000 };
        
        expect(() => {
          projectManager.createProject(invalidProject);
        }).toThrow('Project budget_cents must be >= 0');
      });

      test('should allow zero budget_cents', () => {
        const projectWithZeroBudget = { ...testProject, budget_cents: 0 };
        
        const created = projectManager.createProject(projectWithZeroBudget);
        
        expect(created.budget_cents).toBe(0);
      });

      test('should throw error for duplicate ID', () => {
        mockDataPM.loadProjects.mockReturnValue([testProject]);
        
        expect(() => {
          projectManager.createProject(testProject);
        }).toThrow(`Project id already exists: ${testProject.id}`);
      });
    });

    describe('Valid enum values', () => {
      test('should accept valid lane values', () => {
        const lanes = ['office365', 'euc', 'compliance', 'other'];
        
        lanes.forEach(lane => {
          const project = { ...testProject, id: `test-${lane}`, lane };
          const created = projectManager.createProject(project);
          expect(created.lane).toBe(lane);
        });
      });

      test('should accept valid status values', () => {
        const statuses = ['concept-design', 'solution-design', 'engineering', 'uat', 'release'];
        
        statuses.forEach(status => {
          const project = { ...testProject, id: `test-${status}`, status };
          const created = projectManager.createProject(project);
          expect(created.status).toBe(status);
        });
      });

      test('should accept valid financial_treatment values', () => {
        const treatments = ['CAPEX', 'OPEX', 'MIXED'];
        
        treatments.forEach(financial_treatment => {
          const project = { ...testProject, id: `test-${financial_treatment}`, financial_treatment };
          const created = projectManager.createProject(project);
          expect(created.financial_treatment).toBe(financial_treatment);
        });
      });
    });
  });

  describe('getProject', () => {
    test('should return project when found', () => {
      mockDataPM.loadProjects.mockReturnValue([testProject]);
      
      const found = projectManager.getProject(testProject.id);
      
      expect(found).toEqual(testProject);
    });

    test('should return null when project not found', () => {
      mockDataPM.loadProjects.mockReturnValue([]);
      
      const found = projectManager.getProject('non-existent-id');
      
      expect(found).toBeNull();
    });
  });

  describe('updateProject', () => {
    beforeEach(() => {
      mockDataPM.loadProjects.mockReturnValue([testProject]);
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
    });

    test('should update project when found', () => {
      const updates = { title: 'Updated Project', budget_cents: 2000000 };
      
      const updated = projectManager.updateProject(testProject.id, updates);
      
      expect(updated.title).toBe('Updated Project');
      expect(updated.budget_cents).toBe(2000000);
      expect(mockDataPM.saveProjects).toHaveBeenCalled();
    });

    test('should throw error when project not found', () => {
      mockDataPM.loadProjects.mockReturnValue([]);
      
      expect(() => {
        projectManager.updateProject('non-existent', { title: 'Updated' });
      }).toThrow('Project not found: non-existent');
    });

    test('should validate updates using same validation rules', () => {
      expect(() => {
        projectManager.updateProject(testProject.id, { budget_cents: -1000 });
      }).toThrow('Project budget_cents must be >= 0');
    });

    describe('Status Gate Validation', () => {
      test('should allow update to solution-design when budget > 0', () => {
        const projectWithBudget = { ...testProject, budget_cents: 1000000 };
        mockDataPM.loadProjects.mockReturnValue([projectWithBudget]);
        
        const updated = projectManager.updateProject(testProject.id, { status: 'solution-design' });
        
        expect(updated.status).toBe('solution-design');
      });

      test('should block update to solution-design when budget = 0', () => {
        const projectWithZeroBudget = { ...testProject, budget_cents: 0 };
        mockDataPM.loadProjects.mockReturnValue([projectWithZeroBudget]);
        
        expect(() => {
          projectManager.updateProject(testProject.id, { status: 'solution-design' });
        }).toThrow('Cannot enter solution-design without budget');
      });

      test('should allow update to engineering when tasks exist', () => {
        const projectWithTasks = { ...testProject, tasks: [{ id: 'task1' }] };
        mockDataPM.loadProjects.mockReturnValue([projectWithTasks]);
        
        const updated = projectManager.updateProject(testProject.id, { status: 'engineering' });
        
        expect(updated.status).toBe('engineering');
      });

      test('should block update to engineering when no tasks', () => {
        expect(() => {
          projectManager.updateProject(testProject.id, { status: 'engineering' });
        }).toThrow('Cannot enter engineering without tasks');
      });

      test('should allow update to uat when forecasts exist', () => {
        const projectWithForecasts = { ...testProject, forecasts: [{ id: 'forecast1' }] };
        mockDataPM.loadProjects.mockReturnValue([projectWithForecasts]);
        
        const updated = projectManager.updateProject(testProject.id, { status: 'uat' });
        
        expect(updated.status).toBe('uat');
      });

      test('should block update to uat when no forecasts', () => {
        expect(() => {
          projectManager.updateProject(testProject.id, { status: 'uat' });
        }).toThrow('Cannot enter uat without forecast');
      });

      test('should allow update to release when all tasks completed', () => {
        const projectWithCompletedTasks = {
          ...testProject,
          tasks: [
            { id: 'task1', status: 'completed' },
            { id: 'task2', status: 'completed' }
          ]
        };
        mockDataPM.loadProjects.mockReturnValue([projectWithCompletedTasks]);
        
        const updated = projectManager.updateProject(testProject.id, { status: 'release' });
        
        expect(updated.status).toBe('release');
      });

      test('should block update to release when tasks incomplete', () => {
        const projectWithIncompleteTasks = {
          ...testProject,
          tasks: [
            { id: 'task1', status: 'completed' },
            { id: 'task2', status: 'in-progress' }
          ]
        };
        mockDataPM.loadProjects.mockReturnValue([projectWithIncompleteTasks]);
        
        expect(() => {
          projectManager.updateProject(testProject.id, { status: 'release' });
        }).toThrow('Cannot enter release with incomplete tasks');
      });
    });
  });

  describe('deleteProject', () => {
    test('should delete project when found', () => {
      mockDataPM.loadProjects.mockReturnValue([testProject]);
      
      const deleted = projectManager.deleteProject(testProject.id);
      
      expect(deleted).toBe(true);
      expect(mockDataPM.saveProjects).toHaveBeenCalledWith([]);
    });

    test('should return false when project not found', () => {
      mockDataPM.loadProjects.mockReturnValue([]);
      
      const deleted = projectManager.deleteProject('non-existent');
      
      expect(deleted).toBe(false);
      expect(mockDataPM.saveProjects).not.toHaveBeenCalled();
    });
  });

  describe('listProjects', () => {
    test('should return all projects', () => {
      const projects = [testProject, { ...testProject, id: 'test2' }];
      mockDataPM.loadProjects.mockReturnValue(projects);
      
      const list = projectManager.listProjects();
      
      expect(list).toEqual(projects);
    });

    test('should return empty array when no projects', () => {
      mockDataPM.loadProjects.mockReturnValue([]);
      
      const list = projectManager.listProjects();
      
      expect(list).toEqual([]);
    });
  });

  describe('_validateProject', () => {
    test('should be a private method', () => {
      expect(typeof projectManager._validateProject).toBe('function');
    });

    test('should validate all required fields on create', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
      
      // Should not throw for valid project
      expect(() => {
        projectManager._validateProject(testProject, false);
      }).not.toThrow();
    });

    test('should allow partial validation on update', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
      
      // Should not throw for partial update
      expect(() => {
        projectManager._validateProject({ title: 'Updated Title' }, true);
      }).not.toThrow();
    });
  });
});