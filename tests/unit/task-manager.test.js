/**
 * Enhanced Unit Tests for TaskManager
 * 
 * Tests enhanced TaskManager functionality including:
 * - CRUD operations with PRD-compliant data structure
 * - Required fields validation (title, start_date, end_date, effort_hours)
 * - Resource assignment integration (assigned_resources array)
 * - Progress calculation (calculateProjectProgress)
 * - Date range validation (start_date < end_date)
 * - ResourceManager integration for resource validation
 * - Status enum enforcement (planned, in-progress, blocked, completed)
 */

import TaskManager from '../../src/js/task-manager.js';
import ProjectManager from '../../src/js/project-manager.js';
import ResourceManager from '../../src/js/resource-manager.js';
import DataPersistenceManager from '../../src/js/data-persistence-manager.js';

// Mock dependencies
const mockDataPM = {
  saveProjects: jest.fn(),
  loadProjects: jest.fn(() => [])
};

const mockProjectManager = {
  getProject: jest.fn(),
  updateProject: jest.fn(),
  listProjects: jest.fn(() => []),
  dataPM: mockDataPM
};

const mockResourceManager = {
  getResource: jest.fn(),
  getProjectResources: jest.fn(() => [])
};

describe('Enhanced TaskManager', () => {
  let taskManager;

  beforeEach(() => {
    jest.clearAllMocks();
    taskManager = new TaskManager(mockProjectManager, mockResourceManager);
  });

  describe('Constructor', () => {
    test('should initialize with ProjectManager and ResourceManager dependencies', () => {
      expect(taskManager).toBeInstanceOf(TaskManager);
      expect(taskManager.projectManager).toBe(mockProjectManager);
      expect(taskManager.resourceManager).toBe(mockResourceManager);
    });

    test('should throw error if ProjectManager is not provided', () => {
      expect(() => new TaskManager(null, mockResourceManager)).toThrow('ProjectManager is required');
      expect(() => new TaskManager(undefined, mockResourceManager)).toThrow('ProjectManager is required');
    });

    test('should throw error if ResourceManager is not provided', () => {
      expect(() => new TaskManager(mockProjectManager, null)).toThrow('ResourceManager is required');
      expect(() => new TaskManager(mockProjectManager, undefined)).toThrow('ResourceManager is required');
    });
  });

  describe('Task Creation with PRD Structure', () => {
    const validProject = {
      id: 'proj-001',
      title: 'Test Project',
      tasks: []
    };

    beforeEach(() => {
      mockProjectManager.getProject.mockReturnValue(validProject);
    });

    test('should create task with all PRD-required fields', () => {
      const taskData = {
        title: 'Implementation Task',
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: 40,
        status: 'planned',
        assigned_resources: []
      };

      const result = taskManager.createTask('proj-001', taskData);

      expect(result).toMatchObject({
        id: expect.stringMatching(/^task-/),
        project_id: 'proj-001',
        title: 'Implementation Task',
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: 40,
        status: 'planned',
        assigned_resources: []
      });
      expect(mockProjectManager.updateProject).toHaveBeenCalledWith('proj-001', {
        tasks: [result]
      });
    });

    test('should auto-generate task ID when not provided', () => {
      const taskData = {
        title: 'Test Task',
        start_date: '01-02-2025',
        end_date: '10-02-2025',
        effort_hours: 20,
        assigned_resources: []
      };

      const result1 = taskManager.createTask('proj-001', taskData);
      const result2 = taskManager.createTask('proj-001', taskData);

      expect(result1.id).toMatch(/^task-[\w-]+$/);
      expect(result2.id).toMatch(/^task-[\w-]+$/);
      expect(result1.id).not.toBe(result2.id);
    });

    test('should set default status to planned when not provided', () => {
      const taskData = {
        title: 'Default Status Task',
        start_date: '01-03-2025',
        end_date: '15-03-2025',
        effort_hours: 30,
        assigned_resources: []
      };

      const result = taskManager.createTask('proj-001', taskData);

      expect(result.status).toBe('planned');
    });

    test('should set project_id automatically', () => {
      const taskData = {
        title: 'Project ID Test',
        start_date: '01-04-2025',
        end_date: '15-04-2025',
        effort_hours: 25,
        assigned_resources: []
      };

      const result = taskManager.createTask('proj-001', taskData);

      expect(result.project_id).toBe('proj-001');
    });

    test('should initialize empty assigned_resources array when not provided', () => {
      const taskData = {
        title: 'Resource Array Test',
        start_date: '01-05-2025',
        end_date: '15-05-2025',
        effort_hours: 35
      };

      const result = taskManager.createTask('proj-001', taskData);

      expect(result.assigned_resources).toEqual([]);
    });
  });

  describe('Required Fields Validation', () => {
    const validProject = {
      id: 'proj-001',
      tasks: []
    };

    beforeEach(() => {
      mockProjectManager.getProject.mockReturnValue(validProject);
    });

    test('should validate all PRD-required fields on create', () => {
      const requiredFieldTests = [
        { field: 'title', data: { start_date: '01-01-2025', end_date: '15-01-2025', effort_hours: 20 } },
        { field: 'start_date', data: { title: 'Test', end_date: '15-01-2025', effort_hours: 20 } },
        { field: 'end_date', data: { title: 'Test', start_date: '01-01-2025', effort_hours: 20 } },
        { field: 'effort_hours', data: { title: 'Test', start_date: '01-01-2025', end_date: '15-01-2025' } }
      ];

      requiredFieldTests.forEach(({ field, data }) => {
        expect(() => {
          taskManager.createTask('proj-001', data);
        }).toThrow(`Task ${field} is required`);
      });
    });

    test('should validate date format for start_date and end_date', () => {
      const invalidDateTests = [
        {
          data: {
            title: 'Invalid Start Date',
            start_date: '2025-01-01', // ISO format instead of NZ
            end_date: '15-01-2025',
            effort_hours: 20
          },
          expectedError: 'Task start_date must be in valid NZ format (DD-MM-YYYY)'
        },
        {
          data: {
            title: 'Invalid End Date',
            start_date: '01-01-2025',
            end_date: '31-13-2025', // Invalid month
            effort_hours: 20
          },
          expectedError: 'Task end_date must be in valid NZ format (DD-MM-YYYY)'
        }
      ];

      invalidDateTests.forEach(({ data, expectedError }) => {
        expect(() => {
          taskManager.createTask('proj-001', data);
        }).toThrow(expectedError);
      });
    });

    test('should validate end_date is after start_date', () => {
      const taskData = {
        title: 'Date Range Test',
        start_date: '15-01-2025',
        end_date: '10-01-2025', // End before start
        effort_hours: 20
      };

      expect(() => {
        taskManager.createTask('proj-001', taskData);
      }).toThrow('Task end_date must be after start_date');
    });

    test('should reject when end_date equals start_date', () => {
      const taskData = {
        title: 'Same Date Test',
        start_date: '15-01-2025',
        end_date: '15-01-2025', // Same date
        effort_hours: 20
      };

      expect(() => {
        taskManager.createTask('proj-001', taskData);
      }).toThrow('Task end_date must be after start_date');
    });

    test('should validate effort_hours is non-negative', () => {
      const taskData = {
        title: 'Negative Effort Test',
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: -10
      };

      expect(() => {
        taskManager.createTask('proj-001', taskData);
      }).toThrow('Task effort_hours must be >= 0');
    });

    test('should allow zero effort_hours', () => {
      const taskData = {
        title: 'Zero Effort Test',
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: 0
      };

      const result = taskManager.createTask('proj-001', taskData);

      expect(result.effort_hours).toBe(0);
    });
  });

  describe('Status Validation', () => {
    const validProject = {
      id: 'proj-001',
      tasks: []
    };

    beforeEach(() => {
      mockProjectManager.getProject.mockReturnValue(validProject);
    });

    test('should accept all PRD-defined valid statuses', () => {
      const validStatuses = ['planned', 'in-progress', 'blocked', 'completed'];
      
      validStatuses.forEach((status, index) => {
        const taskData = {
          title: `Status Test ${status}`,
          start_date: '01-01-2025',
          end_date: '15-01-2025',
          effort_hours: 20,
          status: status
        };

        const result = taskManager.createTask('proj-001', { ...taskData, title: `${taskData.title} ${index}` });
        expect(result.status).toBe(status);
      });
    });

    test('should reject invalid status values', () => {
      const invalidStatuses = ['cancelled', 'on-hold', 'invalid-status'];
      
      invalidStatuses.forEach(status => {
        const taskData = {
          title: 'Invalid Status Test',
          start_date: '01-01-2025',
          end_date: '15-01-2025',
          effort_hours: 20,
          status: status
        };

        expect(() => {
          taskManager.createTask('proj-001', taskData);
        }).toThrow('Task status must be one of: planned, in-progress, blocked, completed');
      });
    });
  });

  describe('Resource Assignment Integration', () => {
    const projectWithResources = {
      id: 'proj-001',
      tasks: [],
      resources: [
        { id: 'res-001', name: 'Developer A', type: 'internal', allocation: 0.8 },
        { id: 'res-002', name: 'Designer B', type: 'contractor', allocation: 0.5 }
      ]
    };

    beforeEach(() => {
      mockProjectManager.getProject.mockReturnValue(projectWithResources);
      mockResourceManager.getProjectResources.mockReturnValue(projectWithResources.resources);
    });

    test('should accept valid resource assignments', () => {
      mockResourceManager.getResource.mockImplementation((projectId, resourceId) => {
        return projectWithResources.resources.find(r => r.id === resourceId) || null;
      });

      const taskData = {
        title: 'Resource Assignment Test',
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: 40,
        assigned_resources: ['res-001', 'res-002']
      };

      const result = taskManager.createTask('proj-001', taskData);

      expect(result.assigned_resources).toEqual(['res-001', 'res-002']);
    });

    test('should validate assigned resources exist in project', () => {
      mockResourceManager.getResource.mockImplementation((projectId, resourceId) => {
        return resourceId === 'res-nonexistent' ? null : projectWithResources.resources.find(r => r.id === resourceId);
      });

      const taskData = {
        title: 'Invalid Resource Test',
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: 40,
        assigned_resources: ['res-001', 'res-nonexistent']
      };

      expect(() => {
        taskManager.createTask('proj-001', taskData);
      }).toThrow('Resource not found in project: res-nonexistent');
    });

    test('should reject duplicate resource assignments', () => {
      mockResourceManager.getResource.mockImplementation((projectId, resourceId) => {
        return projectWithResources.resources.find(r => r.id === resourceId) || null;
      });

      const taskData = {
        title: 'Duplicate Resource Test',
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: 40,
        assigned_resources: ['res-001', 'res-001'] // Duplicate
      };

      expect(() => {
        taskManager.createTask('proj-001', taskData);
      }).toThrow('Duplicate resource assignment: res-001');
    });

    test('should allow empty assigned_resources array', () => {
      const taskData = {
        title: 'No Resources Test',
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: 40,
        assigned_resources: []
      };

      const result = taskManager.createTask('proj-001', taskData);

      expect(result.assigned_resources).toEqual([]);
    });
  });

  describe('Task Retrieval', () => {
    const projectWithTasks = {
      id: 'proj-001',
      tasks: [
        {
          id: 'task-001',
          project_id: 'proj-001',
          title: 'Task 1',
          start_date: '01-01-2025',
          end_date: '15-01-2025',
          effort_hours: 20,
          status: 'planned',
          assigned_resources: ['res-001']
        },
        {
          id: 'task-002',
          project_id: 'proj-001',
          title: 'Task 2',
          start_date: '16-01-2025',
          end_date: '30-01-2025',
          effort_hours: 30,
          status: 'completed',
          assigned_resources: ['res-002']
        }
      ]
    };

    test('should get task by ID', () => {
      mockProjectManager.listProjects.mockReturnValue([projectWithTasks]);

      const result = taskManager.getTask('task-001');

      expect(result).toMatchObject({
        id: 'task-001',
        title: 'Task 1',
        status: 'planned'
      });
    });

    test('should return null for non-existent task', () => {
      mockProjectManager.getProject.mockReturnValue(projectWithTasks);

      const result = taskManager.getTask('task-nonexistent');

      expect(result).toBeNull();
    });

    test('should get all tasks for a project', () => {
      mockProjectManager.getProject.mockReturnValue(projectWithTasks);

      const result = taskManager.getProjectTasks('proj-001');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'task-001', title: 'Task 1' });
      expect(result[1]).toMatchObject({ id: 'task-002', title: 'Task 2' });
    });

    test('should return empty array for project with no tasks', () => {
      mockProjectManager.getProject.mockReturnValue({ id: 'proj-001', tasks: [] });

      const result = taskManager.getProjectTasks('proj-001');

      expect(result).toEqual([]);
    });
  });

  describe('Task Updates', () => {
    const projectWithTasks = {
      id: 'proj-001',
      tasks: [
        {
          id: 'task-001',
          project_id: 'proj-001',
          title: 'Original Task',
          start_date: '01-01-2025',
          end_date: '15-01-2025',
          effort_hours: 20,
          status: 'planned',
          assigned_resources: []
        }
      ]
    };

    beforeEach(() => {
      mockProjectManager.listProjects.mockReturnValue([projectWithTasks]);
    });

    test('should update task with valid data', () => {
      const updates = {
        title: 'Updated Task',
        status: 'in-progress',
        effort_hours: 30
      };

      const result = taskManager.updateTask('task-001', updates);

      expect(result).toMatchObject({
        id: 'task-001',
        title: 'Updated Task',
        status: 'in-progress',
        effort_hours: 30,
        start_date: '01-01-2025', // Unchanged
        end_date: '15-01-2025'    // Unchanged
      });

      expect(mockProjectManager.updateProject).toHaveBeenCalledWith('proj-001', {
        tasks: [result]
      });
    });

    test('should validate updated fields', () => {
      const invalidUpdates = [
        { title: '', expectedError: 'Task title is required' },
        { status: 'invalid', expectedError: 'Task status must be one of: planned, in-progress, blocked, completed' },
        { effort_hours: -5, expectedError: 'Task effort_hours must be >= 0' },
        { start_date: 'invalid-date', expectedError: 'Task start_date must be in valid NZ format (DD-MM-YYYY)' },
        { end_date: '01-13-2025', expectedError: 'Task end_date must be in valid NZ format (DD-MM-YYYY)' }
      ];

      invalidUpdates.forEach(({ expectedError, ...updates }) => {
        expect(() => {
          taskManager.updateTask('task-001', updates);
        }).toThrow(expectedError);
      });
    });

    test('should prevent changing project_id', () => {
      const updates = {
        project_id: 'different-project'
      };

      expect(() => {
        taskManager.updateTask('task-001', updates);
      }).toThrow('Cannot change task project association');
    });

    test('should prevent changing task ID', () => {
      const updates = {
        id: 'different-id'
      };

      expect(() => {
        taskManager.updateTask('task-001', updates);
      }).toThrow('Cannot change task ID');
    });
  });

  describe('Task Deletion', () => {
    const projectWithTasks = {
      id: 'proj-001',
      tasks: [
        { id: 'task-001', title: 'Task 1', project_id: 'proj-001' },
        { id: 'task-002', title: 'Task 2', project_id: 'proj-001' }
      ]
    };

    beforeEach(() => {
      mockProjectManager.listProjects.mockReturnValue([projectWithTasks]);
    });

    test('should delete existing task', () => {
      const result = taskManager.deleteTask('task-001');

      expect(result).toBe(true);
      expect(mockProjectManager.updateProject).toHaveBeenCalledWith('proj-001', {
        tasks: [{ id: 'task-002', title: 'Task 2', project_id: 'proj-001' }]
      });
    });

    test('should return false for non-existent task', () => {
      const result = taskManager.deleteTask('task-nonexistent');

      expect(result).toBe(false);
      expect(mockProjectManager.updateProject).not.toHaveBeenCalled();
    });
  });

  describe('Progress Calculation', () => {
    const projectWithMixedTasks = {
      id: 'proj-001',
      tasks: [
        {
          id: 'task-001',
          title: 'Completed Task 1',
          effort_hours: 20,
          status: 'completed'
        },
        {
          id: 'task-002',
          title: 'Completed Task 2',
          effort_hours: 30,
          status: 'completed'
        },
        {
          id: 'task-003',
          title: 'In Progress Task',
          effort_hours: 40,
          status: 'in-progress'
        },
        {
          id: 'task-004',
          title: 'Planned Task',
          effort_hours: 10,
          status: 'planned'
        }
      ]
    };

    test('should calculate project progress correctly', () => {
      mockProjectManager.getProject.mockReturnValue(projectWithMixedTasks);

      const result = taskManager.calculateProjectProgress('proj-001');

      expect(result).toEqual({
        progress: 50, // floor((20+30) / (20+30+40+10) * 100) = floor(50) = 50
        total_hours: 100,
        completed_hours: 50
      });
    });

    test('should handle project with no tasks', () => {
      mockProjectManager.getProject.mockReturnValue({ id: 'proj-001', tasks: [] });

      const result = taskManager.calculateProjectProgress('proj-001');

      expect(result).toEqual({
        progress: 0,
        total_hours: 0,
        completed_hours: 0
      });
    });

    test('should handle project with all completed tasks', () => {
      const allCompletedProject = {
        id: 'proj-001',
        tasks: [
          { id: 'task-001', effort_hours: 20, status: 'completed' },
          { id: 'task-002', effort_hours: 30, status: 'completed' }
        ]
      };

      mockProjectManager.getProject.mockReturnValue(allCompletedProject);

      const result = taskManager.calculateProjectProgress('proj-001');

      expect(result).toEqual({
        progress: 100,
        total_hours: 50,
        completed_hours: 50
      });
    });

    test('should handle project with no completed tasks', () => {
      const noCompletedProject = {
        id: 'proj-001',
        tasks: [
          { id: 'task-001', effort_hours: 20, status: 'planned' },
          { id: 'task-002', effort_hours: 30, status: 'in-progress' }
        ]
      };

      mockProjectManager.getProject.mockReturnValue(noCompletedProject);

      const result = taskManager.calculateProjectProgress('proj-001');

      expect(result).toEqual({
        progress: 0,
        total_hours: 50,
        completed_hours: 0
      });
    });

    test('should throw error for non-existent project', () => {
      mockProjectManager.getProject.mockReturnValue(null);

      expect(() => {
        taskManager.calculateProjectProgress('nonexistent-project');
      }).toThrow('Project not found: nonexistent-project');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle project not found for task creation', () => {
      mockProjectManager.getProject.mockReturnValue(null);

      const taskData = {
        title: 'Test Task',
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: 20
      };

      expect(() => {
        taskManager.createTask('nonexistent-project', taskData);
      }).toThrow('Project not found: nonexistent-project');
    });

    test('should validate null/undefined task data', () => {
      const validProject = { id: 'proj-001', tasks: [] };
      mockProjectManager.getProject.mockReturnValue(validProject);

      expect(() => {
        taskManager.createTask('proj-001', null);
      }).toThrow('Task data is required');

      expect(() => {
        taskManager.createTask('proj-001', undefined);
      }).toThrow('Task data is required');
    });

    test('should handle string effort_hours conversion', () => {
      const validProject = { id: 'proj-001', tasks: [] };
      mockProjectManager.getProject.mockReturnValue(validProject);

      const taskData = {
        title: 'String Hours Test',
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: '25' // String number
      };

      const result = taskManager.createTask('proj-001', taskData);

      expect(result.effort_hours).toBe(25);
    });

    test('should reject invalid effort_hours strings', () => {
      const validProject = { id: 'proj-001', tasks: [] };
      mockProjectManager.getProject.mockReturnValue(validProject);

      const taskData = {
        title: 'Invalid Hours Test',
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: 'not-a-number'
      };

      expect(() => {
        taskManager.createTask('proj-001', taskData);
      }).toThrow('Task effort_hours must be a valid number');
    });

    test('should handle very long task titles', () => {
      const validProject = { id: 'proj-001', tasks: [] };
      mockProjectManager.getProject.mockReturnValue(validProject);

      const longTitle = 'A'.repeat(1000);
      const taskData = {
        title: longTitle,
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: 20
      };

      const result = taskManager.createTask('proj-001', taskData);

      expect(result.title).toBe(longTitle);
    });

    test('should handle special characters in task titles', () => {
      const validProject = { id: 'proj-001', tasks: [] };
      mockProjectManager.getProject.mockReturnValue(validProject);

      const specialTitle = 'Task with Spéciál Çhåracters & Símböls!@#$%';
      const taskData = {
        title: specialTitle,
        start_date: '01-01-2025',
        end_date: '15-01-2025',
        effort_hours: 20
      };

      const result = taskManager.createTask('proj-001', taskData);

      expect(result.title).toBe(specialTitle);
    });
  });
});