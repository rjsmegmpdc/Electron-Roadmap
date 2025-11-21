/**
 * Comprehensive FinancialManager Unit Tests
 * 
 * Tests all financial management functionality as per PRD requirements:
 * - Project budget management (get/set)
 * - Task actual cost calculations
 * - Project actual cost roll-ups
 * - Budget variance calculations
 * - Resource cost calculations with allocations
 * - Financial treatment handling (CAPEX/OPEX/MIXED)
 */

import FinancialManager from '../../src/js/financial-manager.js';

describe('FinancialManager', () => {
  let financialManager;
  let mockProjectManager;
  let mockResourceManager;
  let mockTaskManager;

  beforeEach(() => {
    // Mock dependencies
    mockProjectManager = {
      getProject: jest.fn(),
      updateProject: jest.fn()
    };

    mockResourceManager = {
      getProjectResources: jest.fn(),
      getResource: jest.fn()
    };

    mockTaskManager = {
      getProjectTasks: jest.fn(),
      getTask: jest.fn()
    };

    financialManager = new FinancialManager(
      mockProjectManager,
      mockResourceManager,
      mockTaskManager
    );
  });

  describe('Constructor', () => {
    test('should initialize with all required dependencies', () => {
      expect(financialManager).toBeDefined();
      expect(financialManager.projectManager).toBe(mockProjectManager);
      expect(financialManager.resourceManager).toBe(mockResourceManager);
      expect(financialManager.taskManager).toBe(mockTaskManager);
    });

    test('should throw error if ProjectManager is not provided', () => {
      expect(() => {
        new FinancialManager(null, mockResourceManager, mockTaskManager);
      }).toThrow('ProjectManager is required');
    });

    test('should throw error if ResourceManager is not provided', () => {
      expect(() => {
        new FinancialManager(mockProjectManager, null, mockTaskManager);
      }).toThrow('ResourceManager is required');
    });

    test('should throw error if TaskManager is not provided', () => {
      expect(() => {
        new FinancialManager(mockProjectManager, mockResourceManager, null);
      }).toThrow('TaskManager is required');
    });
  });

  describe('getProjectBudget', () => {
    test('should return project budget information', () => {
      const mockProject = {
        id: 'proj-001',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      mockProjectManager.getProject.mockReturnValue(mockProject);
      
      const budget = financialManager.getProjectBudget('proj-001');
      
      expect(budget).toEqual({
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      });
    });

    test('should throw error for non-existent project', () => {
      mockProjectManager.getProject.mockReturnValue(null);
      
      expect(() => {
        financialManager.getProjectBudget('non-existent');
      }).toThrow('Project non-existent not found');
    });
  });

  describe('setProjectBudget', () => {
    test('should update project budget and treatment', () => {
      const mockProject = {
        id: 'proj-001',
        budget_cents: 500000,
        financial_treatment: 'OPEX'
      };
      
      const updatedProject = {
        ...mockProject,
        budget_cents: 1500000,
        financial_treatment: 'MIXED'
      };
      
      mockProjectManager.getProject.mockReturnValue(mockProject);
      mockProjectManager.updateProject.mockReturnValue(updatedProject);
      
      const result = financialManager.setProjectBudget('proj-001', 1500000, 'MIXED');
      
      expect(mockProjectManager.updateProject).toHaveBeenCalledWith('proj-001', {
        budget_cents: 1500000,
        financial_treatment: 'MIXED'
      });
      
      expect(result).toEqual({
        budget_cents: 1500000,
        financial_treatment: 'MIXED'
      });
    });

    test('should validate budget is non-negative', () => {
      mockProjectManager.getProject.mockReturnValue({ id: 'proj-001' });
      
      expect(() => {
        financialManager.setProjectBudget('proj-001', -100000, 'CAPEX');
      }).toThrow('Budget must be >= 0');
    });

    test('should validate financial treatment is valid', () => {
      mockProjectManager.getProject.mockReturnValue({ id: 'proj-001' });
      
      expect(() => {
        financialManager.setProjectBudget('proj-001', 100000, 'INVALID');
      }).toThrow('Financial treatment must be CAPEX, OPEX, or MIXED');
    });

    test('should throw error for non-existent project', () => {
      mockProjectManager.getProject.mockReturnValue(null);
      
      expect(() => {
        financialManager.setProjectBudget('non-existent', 100000, 'CAPEX');
      }).toThrow('Project non-existent not found');
    });
  });

  describe('calculateTaskActualCostCents', () => {
    test('should calculate task cost with assigned resources', () => {
      const mockTask = {
        id: 'task-001',
        project_id: 'proj-001',
        effort_hours: 40,
        assigned_resources: ['resource-001', 'resource-002']
      };
      
      const mockResources = [
        {
          id: 'resource-001',
          rate_per_hour: 15000, // $150/hour in cents
          allocation: 0.6
        },
        {
          id: 'resource-002', 
          rate_per_hour: 12000, // $120/hour in cents
          allocation: 0.4
        }
      ];
      
      mockTaskManager.getTask.mockReturnValue(mockTask);
      mockResourceManager.getResource
        .mockReturnValueOnce(mockResources[0])
        .mockReturnValueOnce(mockResources[1]);
      
      const cost = financialManager.calculateTaskActualCostCents('task-001');
      
      // Expected: (40 * 0.6 * 15000) + (40 * 0.4 * 12000) = 360000 + 192000 = 552000
      expect(cost).toBe(552000);
    });

    test('should return 0 for task with no assigned resources', () => {
      const mockTask = {
        id: 'task-001',
        effort_hours: 40,
        assigned_resources: []
      };
      
      mockTaskManager.getTask.mockReturnValue(mockTask);
      
      const cost = financialManager.calculateTaskActualCostCents('task-001');
      
      expect(cost).toBe(0);
    });

    test('should handle resources with zero rates', () => {
      const mockTask = {
        id: 'task-001',
        effort_hours: 40,
        assigned_resources: ['resource-001']
      };
      
      const mockResource = {
        id: 'resource-001',
        rate_per_hour: 0, // Internal resource with no rate
        allocation: 0.8
      };
      
      mockTaskManager.getTask.mockReturnValue(mockTask);
      mockResourceManager.getResource.mockReturnValue(mockResource);
      
      const cost = financialManager.calculateTaskActualCostCents('task-001');
      
      expect(cost).toBe(0);
    });

    test('should throw error for non-existent task', () => {
      mockTaskManager.getTask.mockReturnValue(null);
      
      expect(() => {
        financialManager.calculateTaskActualCostCents('non-existent');
      }).toThrow('Task non-existent not found');
    });
  });

  describe('calculateProjectActualCosts', () => {
    test('should calculate total project costs with breakdown', () => {
      const mockTasks = [
        {
          id: 'task-001',
          project_id: 'proj-001',
          effort_hours: 40,
          assigned_resources: ['resource-001']
        },
        {
          id: 'task-002',
          project_id: 'proj-001',
          effort_hours: 60,
          assigned_resources: ['resource-002']
        },
        {
          id: 'task-003',
          project_id: 'proj-001',
          effort_hours: 80,
          assigned_resources: ['resource-001', 'resource-002']
        }
      ];
      
      const mockResources = [
        { id: 'resource-001', rate_per_hour: 15000, allocation: 1.0 },
        { id: 'resource-002', rate_per_hour: 12000, allocation: 1.0 }
      ];
      
      mockTaskManager.getProjectTasks.mockReturnValue(mockTasks);
      mockResourceManager.getResource
        .mockImplementation((projectId, resourceId) => {
          return mockResources.find(r => r.id === resourceId);
        });
      
      const costs = financialManager.calculateProjectActualCosts('proj-001');
      
      expect(costs).toMatchObject({
        total_actual_cents: expect.any(Number),
        by_task: expect.arrayContaining([
          expect.objectContaining({
            task_id: 'task-001',
            actual_cents: expect.any(Number)
          }),
          expect.objectContaining({
            task_id: 'task-002', 
            actual_cents: expect.any(Number)
          }),
          expect.objectContaining({
            task_id: 'task-003',
            actual_cents: expect.any(Number)
          })
        ]),
        by_resource: expect.arrayContaining([
          expect.objectContaining({
            resource_id: 'resource-001',
            actual_cents: expect.any(Number)
          }),
          expect.objectContaining({
            resource_id: 'resource-002',
            actual_cents: expect.any(Number)
          })
        ])
      });
      
      // Verify totals match
      const taskTotal = costs.by_task.reduce((sum, task) => sum + task.actual_cents, 0);
      expect(costs.total_actual_cents).toBe(taskTotal);
    });

    test('should return zero costs for project with no tasks', () => {
      mockTaskManager.getProjectTasks.mockReturnValue([]);
      
      const costs = financialManager.calculateProjectActualCosts('proj-001');
      
      expect(costs).toEqual({
        total_actual_cents: 0,
        by_task: [],
        by_resource: []
      });
    });

    test('should handle tasks with no resources', () => {
      const mockTasks = [
        {
          id: 'task-001',
          project_id: 'proj-001',
          effort_hours: 40,
          assigned_resources: []
        }
      ];
      
      mockTaskManager.getProjectTasks.mockReturnValue(mockTasks);
      
      const costs = financialManager.calculateProjectActualCosts('proj-001');
      
      expect(costs).toEqual({
        total_actual_cents: 0,
        by_task: [{
          task_id: 'task-001',
          actual_cents: 0
        }],
        by_resource: []
      });
    });
  });

  describe('calculateVariance', () => {
    test('should calculate budget variance correctly', () => {
      const mockProject = {
        id: 'proj-001',
        budget_cents: 1000000
      };
      
      mockProjectManager.getProject.mockReturnValue(mockProject);
      mockTaskManager.getProjectTasks.mockReturnValue([
        { id: 'task-001', effort_hours: 40, assigned_resources: ['resource-001'] }
      ]);
      mockResourceManager.getResource.mockReturnValue({
        id: 'resource-001',
        rate_per_hour: 15000,
        allocation: 1.0
      });
      
      const variance = financialManager.calculateVariance('proj-001');
      
      // Expected actual cost: 40 * 15000 = 600000
      // Expected variance: 1000000 - 600000 = 400000
      expect(variance).toEqual({
        budget_cents: 1000000,
        actual_cents: 600000,
        variance_cents: 400000
      });
    });

    test('should handle over-budget scenarios', () => {
      const mockProject = {
        id: 'proj-001',
        budget_cents: 500000
      };
      
      mockProjectManager.getProject.mockReturnValue(mockProject);
      mockTaskManager.getProjectTasks.mockReturnValue([
        { id: 'task-001', effort_hours: 40, assigned_resources: ['resource-001'] }
      ]);
      mockResourceManager.getResource.mockReturnValue({
        id: 'resource-001',
        rate_per_hour: 20000,
        allocation: 1.0
      });
      
      const variance = financialManager.calculateVariance('proj-001');
      
      // Expected actual cost: 40 * 20000 = 800000
      // Expected variance: 500000 - 800000 = -300000 (over budget)
      expect(variance).toEqual({
        budget_cents: 500000,
        actual_cents: 800000,
        variance_cents: -300000
      });
      
      expect(variance.variance_cents).toBeLessThan(0);
    });

    test('should throw error for non-existent project', () => {
      mockProjectManager.getProject.mockReturnValue(null);
      
      expect(() => {
        financialManager.calculateVariance('non-existent');
      }).toThrow('Project non-existent not found');
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complex multi-resource multi-task scenario', () => {
      const mockProject = {
        id: 'proj-complex',
        budget_cents: 2000000,
        financial_treatment: 'MIXED'
      };
      
      const mockTasks = [
        {
          id: 'task-design',
          project_id: 'proj-complex',
          effort_hours: 80,
          assigned_resources: ['architect', 'designer']
        },
        {
          id: 'task-develop',
          project_id: 'proj-complex',
          effort_hours: 200,
          assigned_resources: ['dev-senior', 'dev-junior']
        },
        {
          id: 'task-test',
          project_id: 'proj-complex',
          effort_hours: 60,
          assigned_resources: ['tester']
        }
      ];
      
      const mockResources = [
        { id: 'architect', rate_per_hour: 25000, allocation: 0.5 },
        { id: 'designer', rate_per_hour: 18000, allocation: 0.8 },
        { id: 'dev-senior', rate_per_hour: 20000, allocation: 0.7 },
        { id: 'dev-junior', rate_per_hour: 12000, allocation: 0.9 },
        { id: 'tester', rate_per_hour: 15000, allocation: 1.0 }
      ];
      
      mockProjectManager.getProject.mockReturnValue(mockProject);
      mockTaskManager.getProjectTasks.mockReturnValue(mockTasks);
      mockResourceManager.getResource
        .mockImplementation((projectId, resourceId) => {
          return mockResources.find(r => r.id === resourceId);
        });
      
      const costs = financialManager.calculateProjectActualCosts('proj-complex');
      const variance = financialManager.calculateVariance('proj-complex');
      
      expect(costs.total_actual_cents).toBeGreaterThan(0);
      expect(costs.by_task).toHaveLength(3);
      expect(costs.by_resource).toHaveLength(5);
      
      expect(variance.budget_cents).toBe(2000000);
      expect(variance.actual_cents).toBe(costs.total_actual_cents);
      expect(variance.variance_cents).toBe(2000000 - costs.total_actual_cents);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero effort hours', () => {
      const mockTask = {
        id: 'task-zero',
        effort_hours: 0,
        assigned_resources: ['resource-001']
      };
      
      mockTaskManager.getTask.mockReturnValue(mockTask);
      mockResourceManager.getResource.mockReturnValue({
        rate_per_hour: 15000,
        allocation: 1.0
      });
      
      const cost = financialManager.calculateTaskActualCostCents('task-zero');
      
      expect(cost).toBe(0);
    });

    test('should handle missing resource data gracefully', () => {
      const mockTask = {
        id: 'task-missing',
        effort_hours: 40,
        assigned_resources: ['missing-resource']
      };
      
      mockTaskManager.getTask.mockReturnValue(mockTask);
      mockResourceManager.getResource.mockReturnValue(null);
      
      const cost = financialManager.calculateTaskActualCostCents('task-missing');
      
      expect(cost).toBe(0);
    });

    test('should handle very large numbers correctly', () => {
      const mockTask = {
        id: 'task-large',
        effort_hours: 1000,
        assigned_resources: ['expensive-resource']
      };
      
      mockTaskManager.getTask.mockReturnValue(mockTask);
      mockResourceManager.getResource.mockReturnValue({
        rate_per_hour: 50000, // $500/hour
        allocation: 1.0
      });
      
      const cost = financialManager.calculateTaskActualCostCents('task-large');
      
      expect(cost).toBe(50000000); // $500,000 in cents
    });
  });
});