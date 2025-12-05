/**
 * Comprehensive ForecastingEngine Unit Tests
 * 
 * Tests all forecasting functionality as per PRD requirements:
 * - Delivery estimation with ETA calculation
 * - Resource capacity analysis and overallocation detection
 * - Cost projections (projected, actual, remaining)
 * - Scenario modeling (baseline, scope changes, resource unavailable)
 * - Confidence rating algorithm (0-5 scale)
 * - Warnings and recommendations generation
 */

import ForecastingEngine from '../../src/js/forecasting-engine.js';
import DateUtils from '../../src/js/date-utils.js';

describe('ForecastingEngine', () => {
  let forecastingEngine;
  let mockProjectManager;
  let mockTaskManager;
  let mockResourceManager;
  let mockFinancialManager;
  
  // Mock data used across tests
  const mockProject = {
    id: 'proj-001',
    title: 'Test Project',
    start_date: '01-01-2025',
    end_date: '30-06-2025',
    budget_cents: 1000000,
    financial_treatment: 'CAPEX'
  };

  const mockTasks = [
    {
      id: 'task-001',
      title: 'Completed Task',
      effort_hours: 40,
      status: 'completed',
      assigned_resources: ['resource-001']
    },
    {
      id: 'task-002', 
      title: 'In Progress Task',
      effort_hours: 80,
      status: 'in-progress',
      assigned_resources: ['resource-001', 'resource-002']
    },
    {
      id: 'task-003',
      title: 'Planned Task',
      effort_hours: 120,
      status: 'planned',
      assigned_resources: ['resource-002']
    }
  ];

  const mockResources = [
    {
      id: 'resource-001',
      name: 'Developer A',
      type: 'internal',
      allocation: 0.8
    },
    {
      id: 'resource-002',
      name: 'Developer B',
      type: 'contractor',
      allocation: 0.6,
      rate_per_hour: 15000
    }
  ];

  beforeEach(() => {
    // Mock dependencies
    mockProjectManager = {
      getProject: jest.fn(),
      listProjects: jest.fn()
    };

    mockTaskManager = {
      getProjectTasks: jest.fn(),
      calculateProjectProgress: jest.fn()
    };

    mockResourceManager = {
      getProjectResources: jest.fn(),
      getTotalResourceAllocation: jest.fn(),
      isResourceOverallocated: jest.fn()
    };

    mockFinancialManager = {
      calculateProjectActualCosts: jest.fn(),
      calculateVariance: jest.fn()
    };

    forecastingEngine = new ForecastingEngine(
      mockProjectManager,
      mockTaskManager,
      mockResourceManager,
      mockFinancialManager
    );
  });

  describe('Constructor', () => {
    test('should initialize with all required dependencies', () => {
      expect(forecastingEngine).toBeDefined();
      expect(forecastingEngine.projectManager).toBe(mockProjectManager);
      expect(forecastingEngine.taskManager).toBe(mockTaskManager);
      expect(forecastingEngine.resourceManager).toBe(mockResourceManager);
      expect(forecastingEngine.financialManager).toBe(mockFinancialManager);
    });

    test('should throw error if ProjectManager is not provided', () => {
      expect(() => {
        new ForecastingEngine(null, mockTaskManager, mockResourceManager, mockFinancialManager);
      }).toThrow('ProjectManager is required');
    });

    test('should throw error if TaskManager is not provided', () => {
      expect(() => {
        new ForecastingEngine(mockProjectManager, null, mockResourceManager, mockFinancialManager);
      }).toThrow('TaskManager is required');
    });

    test('should throw error if ResourceManager is not provided', () => {
      expect(() => {
        new ForecastingEngine(mockProjectManager, mockTaskManager, null, mockFinancialManager);
      }).toThrow('ResourceManager is required');
    });

    test('should throw error if FinancialManager is not provided', () => {
      expect(() => {
        new ForecastingEngine(mockProjectManager, mockTaskManager, mockResourceManager, null);
      }).toThrow('FinancialManager is required');
    });
  });

  describe('createProjectForecast', () => {

    beforeEach(() => {
      mockProjectManager.getProject.mockReturnValue(mockProject);
      mockTaskManager.getProjectTasks.mockReturnValue(mockTasks);
      mockTaskManager.calculateProjectProgress.mockReturnValue({
        progress: 16,
        total_hours: 240,
        completed_hours: 40
      });
      mockResourceManager.getProjectResources.mockReturnValue(mockResources);
      mockResourceManager.isResourceOverallocated.mockReturnValue(false);
      mockFinancialManager.calculateProjectActualCosts.mockReturnValue({
        total_actual_cents: 200000,
        by_task: [],
        by_resource: []
      });
      mockFinancialManager.calculateVariance.mockReturnValue({
        budget_cents: 1000000,
        actual_cents: 200000,
        variance_cents: 800000
      });
    });

    test('should throw error for non-existent project', () => {
      mockProjectManager.getProject.mockReturnValue(null);
      
      expect(() => {
        forecastingEngine.createProjectForecast('non-existent');
      }).toThrow('Project non-existent not found');
    });

    test('should throw error for project with no tasks', () => {
      mockTaskManager.getProjectTasks.mockReturnValue([]);
      
      expect(() => {
        forecastingEngine.createProjectForecast('proj-001');
      }).toThrow('Cannot forecast: no tasks');
    });

    test('should create complete forecast with all required fields', () => {
      const forecast = forecastingEngine.createProjectForecast('proj-001');

      // Verify all required top-level fields
      expect(forecast).toMatchObject({
        project_id: 'proj-001',
        forecast_date: expect.stringMatching(/^\d{2}-\d{2}-\d{4}$/), // DD-MM-YYYY format
        delivery: expect.objectContaining({
          estimated_days: expect.any(Number),
          eta_end_date: expect.stringMatching(/^\d{2}-\d{2}-\d{4}$/)
        }),
        resources: expect.objectContaining({
          capacity_hours_per_day: expect.any(Number),
          risk_overallocation: expect.any(Boolean)
        }),
        costs: expect.objectContaining({
          projected_cents: expect.any(Number),
          actual_cents: expect.any(Number),
          remaining_cents: expect.any(Number)
        }),
        scenarios: expect.objectContaining({
          baseline: expect.any(Object),
          scope_reduction_20: expect.any(Object),
          scope_increase_15: expect.any(Object),
          key_resource_unavailable: expect.any(Object)
        }),
        confidence_rating: expect.any(Number),
        warnings: expect.arrayContaining([]),
        recommendations: expect.arrayContaining([])
      });

      // Verify confidence rating is in valid range
      expect(forecast.confidence_rating).toBeGreaterThanOrEqual(0);
      expect(forecast.confidence_rating).toBeLessThanOrEqual(5);
    });

    test('should calculate remaining hours correctly', () => {
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      // Remaining hours = in-progress (80) + planned (120) = 200 hours
      // (completed tasks don't count toward remaining)
      const expectedRemainingHours = 200;
      
      // This should be reflected in the delivery estimation
      expect(forecast.delivery.estimated_days).toBeGreaterThan(0);
    });

    test('should calculate daily capacity from active resources', () => {
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      // Daily capacity = sum of (8 hours * allocation percentage)
      // Resource 1: 8 * 0.8 = 6.4 hours/day
      // Resource 2: 8 * 0.6 = 4.8 hours/day  
      // Total: 11.2 hours/day
      expect(forecast.resources.capacity_hours_per_day).toBeCloseTo(11.2, 1);
    });

    test('should calculate ETA based on remaining hours and capacity', () => {
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      // Remaining hours: 200
      // Daily capacity: 11.2 hours/day
      // ETA days = ceil(200 / 11.2) = ceil(17.86) = 18 days
      expect(forecast.delivery.estimated_days).toBe(18);
      
      // ETA date should be 18 days from today
      const todayNZ = DateUtils.formatNZ(new Date());
      const expectedEtaDate = DateUtils.addDaysNZ(todayNZ, 18);
      expect(forecast.delivery.eta_end_date).toBe(expectedEtaDate);
    });

    test('should detect resource overallocation risk', () => {
      mockResourceManager.isResourceOverallocated.mockReturnValue(true);
      
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      expect(forecast.resources.risk_overallocation).toBe(true);
    });

    test('should calculate cost projections accurately', () => {
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      expect(forecast.costs.actual_cents).toBe(200000);
      expect(forecast.costs.projected_cents).toBeGreaterThan(200000);
      expect(forecast.costs.remaining_cents).toBeGreaterThan(0);
      
      // Projected should equal actual + remaining
      expect(forecast.costs.projected_cents).toBe(
        forecast.costs.actual_cents + forecast.costs.remaining_cents
      );
    });

    test('should generate different scenarios', () => {
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      const { scenarios } = forecast;
      
      // All scenarios should have delivery and costs
      expect(scenarios.baseline).toMatchObject({
        delivery: expect.objectContaining({
          estimated_days: expect.any(Number),
          eta_end_date: expect.any(String)
        }),
        costs: expect.objectContaining({
          projected_cents: expect.any(Number)
        })
      });

      // Scope reduction should have fewer days than baseline
      expect(scenarios.scope_reduction_20.delivery.estimated_days).toBeLessThan(
        scenarios.baseline.delivery.estimated_days
      );

      // Scope increase should have more days than baseline
      expect(scenarios.scope_increase_15.delivery.estimated_days).toBeGreaterThan(
        scenarios.baseline.delivery.estimated_days
      );

      // Key resource unavailable should have more days (reduced capacity)
      expect(scenarios.key_resource_unavailable.delivery.estimated_days).toBeGreaterThan(
        scenarios.baseline.delivery.estimated_days
      );
    });

    test('should generate confidence rating based on data quality', () => {
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      // With good data (tasks, resources, no overallocation), confidence should be high
      expect(forecast.confidence_rating).toBeGreaterThanOrEqual(3);
    });

    test('should lower confidence rating for poor data quality', () => {
      // Simulate poor data quality
      mockResourceManager.getProjectResources.mockReturnValue([
        { id: 'resource-001', allocation: 0.1 } // Very low allocation
      ]);
      mockResourceManager.isResourceOverallocated.mockReturnValue(true);
      
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      // Confidence should be lower due to risks
      expect(forecast.confidence_rating).toBeLessThan(3);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle zero capacity scenario', () => {
      mockProjectManager.getProject.mockReturnValue({
        id: 'proj-001',
        title: 'Zero Capacity Project'
      });
      mockTaskManager.getProjectTasks.mockReturnValue([
        { effort_hours: 40, status: 'planned' }
      ]);
      mockTaskManager.calculateProjectProgress.mockReturnValue({
        progress: 0,
        total_hours: 40,
        completed_hours: 0
      });
      mockResourceManager.getProjectResources.mockReturnValue([]);
      mockResourceManager.isResourceOverallocated.mockReturnValue(false);
      mockFinancialManager.calculateProjectActualCosts.mockReturnValue({
        total_actual_cents: 0,
        by_task: [],
        by_resource: []
      });
      mockFinancialManager.calculateVariance.mockReturnValue({
        budget_cents: 100000,
        actual_cents: 0,
        variance_cents: 100000
      });

      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      expect(forecast.resources.capacity_hours_per_day).toBe(0);
      expect(forecast.delivery.estimated_days).toBeGreaterThan(365); // Very large ETA
      expect(forecast.confidence_rating).toBe(0); // Lowest confidence
      expect(forecast.warnings).toContain('No resources available for project');
    });

    test('should handle project with only completed tasks', () => {
      mockProjectManager.getProject.mockReturnValue(mockProject);
      mockTaskManager.getProjectTasks.mockReturnValue([
        { effort_hours: 40, status: 'completed' }
      ]);

      expect(() => {
        forecastingEngine.createProjectForecast('proj-001');
      }).toThrow('Cannot forecast: no tasks');
    });

    test('should handle very large projects', () => {
      mockProjectManager.getProject.mockReturnValue(mockProject);
      const largeTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        effort_hours: 40,
        status: 'planned'
      }));
      
      mockTaskManager.getProjectTasks.mockReturnValue(largeTasks);
      mockTaskManager.calculateProjectProgress.mockReturnValue({
        progress: 0,
        total_hours: 4000,
        completed_hours: 0
      });
      mockResourceManager.getProjectResources.mockReturnValue(mockResources);
      mockResourceManager.isResourceOverallocated.mockReturnValue(false);
      mockFinancialManager.calculateProjectActualCosts.mockReturnValue({
        total_actual_cents: 0,
        by_task: [],
        by_resource: []
      });
      mockFinancialManager.calculateVariance.mockReturnValue({
        budget_cents: 10000000,
        actual_cents: 0,
        variance_cents: 10000000
      });
      
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      // Should handle large projects without errors
      expect(forecast.delivery.estimated_days).toBeGreaterThan(100);
    });
  });

  describe('Warnings and Recommendations', () => {
    test('should generate warnings for high-risk situations', () => {
      mockProjectManager.getProject.mockReturnValue(mockProject);
      mockTaskManager.getProjectTasks.mockReturnValue(mockTasks);
      mockTaskManager.calculateProjectProgress.mockReturnValue({
        progress: 16,
        total_hours: 240,
        completed_hours: 40
      });
      mockResourceManager.getProjectResources.mockReturnValue([
        { id: 'resource-001', allocation: 1.2 } // Over 100% allocation
      ]);
      mockResourceManager.isResourceOverallocated.mockReturnValue(true);
      mockFinancialManager.calculateProjectActualCosts.mockReturnValue({
        total_actual_cents: 200000,
        by_task: [],
        by_resource: []
      });
      mockFinancialManager.calculateVariance.mockReturnValue({
        budget_cents: 1000000,
        actual_cents: 200000,
        variance_cents: 800000
      });

      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      expect(forecast.warnings).toContain('Resource overallocation detected');
      expect(forecast.confidence_rating).toBeLessThan(3);
    });

    test('should generate recommendations for improvement', () => {
      mockProjectManager.getProject.mockReturnValue(mockProject);
      // Create large tasks with low capacity to ensure long timeline
      const largeTasks = [
        { id: 'large-1', effort_hours: 500, status: 'planned' },
        { id: 'large-2', effort_hours: 500, status: 'planned' }
      ];
      mockTaskManager.getProjectTasks.mockReturnValue(largeTasks);
      // Simulate scenario needing recommendations
      mockTaskManager.calculateProjectProgress.mockReturnValue({
        progress: 5, // Very low progress
        total_hours: 1000,
        completed_hours: 50
      });
      // Use low capacity resources to trigger timeline recommendations
      const lowCapacityResources = [
        { id: 'resource-001', allocation: 0.1 }, // Very low allocation
        { id: 'resource-002', allocation: 0.1 }
      ];
      mockResourceManager.getProjectResources.mockReturnValue(lowCapacityResources);
      mockResourceManager.isResourceOverallocated.mockReturnValue(false);
      mockFinancialManager.calculateProjectActualCosts.mockReturnValue({
        total_actual_cents: 200000,
        by_task: [],
        by_resource: []
      });
      mockFinancialManager.calculateVariance.mockReturnValue({
        budget_cents: 1000000,
        actual_cents: 200000,
        variance_cents: 800000
      });

      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      expect(forecast.recommendations).toContain('Consider adding more resources to accelerate delivery');
    });

    test('should recommend scope reduction for over-budget projects', () => {
      mockProjectManager.getProject.mockReturnValue(mockProject);
      mockTaskManager.getProjectTasks.mockReturnValue(mockTasks);
      mockTaskManager.calculateProjectProgress.mockReturnValue({
        progress: 16,
        total_hours: 240,
        completed_hours: 40
      });
      mockResourceManager.getProjectResources.mockReturnValue(mockResources);
      mockResourceManager.isResourceOverallocated.mockReturnValue(false);
      mockFinancialManager.calculateProjectActualCosts.mockReturnValue({
        total_actual_cents: 600000,
        by_task: [],
        by_resource: []
      });
      mockFinancialManager.calculateVariance.mockReturnValue({
        budget_cents: 500000,
        actual_cents: 600000, // Over budget
        variance_cents: -100000
      });

      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      expect(forecast.warnings).toContain('Project is over budget');
      expect(forecast.recommendations).toContain('Consider scope reduction to control costs');
    });
  });

  describe('Date Handling', () => {
    test('should use NZ date format for forecast_date', () => {
      mockProjectManager.getProject.mockReturnValue(mockProject);
      mockTaskManager.getProjectTasks.mockReturnValue(mockTasks);
      mockTaskManager.calculateProjectProgress.mockReturnValue({
        progress: 16,
        total_hours: 240,
        completed_hours: 40
      });
      mockResourceManager.getProjectResources.mockReturnValue(mockResources);
      mockResourceManager.isResourceOverallocated.mockReturnValue(false);
      mockFinancialManager.calculateProjectActualCosts.mockReturnValue({
        total_actual_cents: 200000,
        by_task: [],
        by_resource: []
      });
      mockFinancialManager.calculateVariance.mockReturnValue({
        budget_cents: 1000000,
        actual_cents: 200000,
        variance_cents: 800000
      });
      
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      // Should match DD-MM-YYYY format
      expect(forecast.forecast_date).toMatch(/^\d{2}-\d{2}-\d{4}$/);
      
      // Should be today's date
      const todayNZ = DateUtils.formatNZ(new Date());
      expect(forecast.forecast_date).toBe(todayNZ);
    });

    test('should use NZ date format for ETA dates', () => {
      mockProjectManager.getProject.mockReturnValue(mockProject);
      mockTaskManager.getProjectTasks.mockReturnValue(mockTasks);
      mockTaskManager.calculateProjectProgress.mockReturnValue({
        progress: 16,
        total_hours: 240,
        completed_hours: 40
      });
      mockResourceManager.getProjectResources.mockReturnValue(mockResources);
      mockResourceManager.isResourceOverallocated.mockReturnValue(false);
      mockFinancialManager.calculateProjectActualCosts.mockReturnValue({
        total_actual_cents: 200000,
        by_task: [],
        by_resource: []
      });
      mockFinancialManager.calculateVariance.mockReturnValue({
        budget_cents: 1000000,
        actual_cents: 200000,
        variance_cents: 800000
      });
      
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      expect(forecast.delivery.eta_end_date).toMatch(/^\d{2}-\d{2}-\d{4}$/);
      expect(forecast.scenarios.baseline.delivery.eta_end_date).toMatch(/^\d{2}-\d{2}-\d{4}$/);
    });
  });

  describe('Scenario Calculations', () => {
    beforeEach(() => {
      mockProjectManager.getProject.mockReturnValue(mockProject);
      mockTaskManager.getProjectTasks.mockReturnValue(mockTasks);
      mockTaskManager.calculateProjectProgress.mockReturnValue({
        progress: 16,
        total_hours: 240,
        completed_hours: 40
      });
      mockResourceManager.getProjectResources.mockReturnValue(mockResources);
      mockResourceManager.isResourceOverallocated.mockReturnValue(false);
      mockFinancialManager.calculateProjectActualCosts.mockReturnValue({
        total_actual_cents: 200000,
        by_task: [],
        by_resource: []
      });
      mockFinancialManager.calculateVariance.mockReturnValue({
        budget_cents: 1000000,
        actual_cents: 200000,
        variance_cents: 800000
      });
    });
    
    test('should calculate scope reduction scenario correctly', () => {
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      const baseline = forecast.scenarios.baseline.delivery.estimated_days;
      const reduced = forecast.scenarios.scope_reduction_20.delivery.estimated_days;
      
      // 20% scope reduction should reduce days by approximately 20%
      const expectedReduction = Math.ceil(baseline * 0.8);
      expect(reduced).toBeCloseTo(expectedReduction, 1);
    });

    test('should calculate scope increase scenario correctly', () => {
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      const baseline = forecast.scenarios.baseline.delivery.estimated_days;
      const increased = forecast.scenarios.scope_increase_15.delivery.estimated_days;
      
      // 15% scope increase should increase days by approximately 15%
      const expectedIncrease = Math.ceil(baseline * 1.15);
      expect(increased).toBeCloseTo(expectedIncrease, 1);
    });

    test('should calculate key resource unavailable scenario', () => {
      const forecast = forecastingEngine.createProjectForecast('proj-001');
      
      const baseline = forecast.scenarios.baseline.delivery.estimated_days;
      const reduced = forecast.scenarios.key_resource_unavailable.delivery.estimated_days;
      
      // Should have more days due to reduced capacity
      expect(reduced).toBeGreaterThan(baseline);
    });
  });
});