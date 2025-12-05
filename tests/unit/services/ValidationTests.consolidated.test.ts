import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { ProjectService, CreateProjectRequest, UpdateProjectRequest } from '../../../app/main/services/ProjectService';
import { TaskService, CreateTaskRequest, UpdateTaskRequest } from '../../../app/main/services/TaskService';
import { TestDatabase } from '../../helpers/testDatabase';

/**
 * Consolidated Validation Tests
 * 
 * Replaces 40+ individual validation tests with parameterized tests
 * Benefits:
 * - Reduces test count from 40+ to ~10
 * - Easier to maintain (add new cases without new tests)
 * - Consistent validation testing pattern
 * - Faster execution (less test setup overhead)
 * - Better documentation of validation rules
 */
describe('Service Validation - Consolidated', () => {
  let testDb: TestDatabase;
  let db: Database.Database;
  let projectService: ProjectService;
  let taskService: TaskService;
  let testProjectId: string;

  beforeEach(async () => {
    testDb = new TestDatabase();
    db = await testDb.setup(true);
    projectService = new ProjectService(db);
    taskService = new TaskService(db);

    // Create test project for task validation
    const result = projectService.createProject({
      title: 'Test Project',
      start_date: '01-01-2025',
      end_date: '31-12-2025',
      status: 'active'
    });
    testProjectId = result.project!.id;
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  describe('Project Validation', () => {
    // Base valid project data for testing
    const validProjectData: CreateProjectRequest = {
      title: 'Valid Project',
      description: 'Valid description',
      lane: 'Development',
      start_date: '01-01-2025',
      end_date: '31-12-2025',
      status: 'active',
      pm_name: 'John Manager',
      budget_nzd: '50,000.00',
      financial_treatment: 'CAPEX'
    };

    test.each([
      // Title validations
      {
        field: 'title',
        value: '',
        error: 'title is required',
        description: 'empty title'
      },
      {
        field: 'title',
        value: 'A'.repeat(201),
        error: 'must be 200 characters or less',
        description: 'title too long'
      },

      // Date format validations
      {
        field: 'start_date',
        value: '2025-01-01',
        error: 'must be in DD-MM-YYYY format',
        description: 'start date in ISO format'
      },
      {
        field: 'start_date',
        value: '32-01-2025',
        error: 'must be in DD-MM-YYYY format',
        description: 'invalid start date day'
      },
      {
        field: 'start_date',
        value: '01-13-2025',
        error: 'must be in DD-MM-YYYY format',
        description: 'invalid start date month'
      },
      {
        field: 'end_date',
        value: '2025/12/31',
        error: 'must be in DD-MM-YYYY format',
        description: 'end date wrong separator'
      },
      {
        field: 'end_date',
        value: '29-02-2025',
        error: 'must be in DD-MM-YYYY format',
        description: 'invalid leap year date'
      },

      // Status validations
      {
        field: 'status',
        value: 'invalid-status',
        error: 'must be one of',
        description: 'invalid status'
      },

      // Budget validations
      {
        field: 'budget_nzd',
        value: '$1,000.00',
        error: 'valid NZD amount',
        description: 'budget with dollar sign'
      },
      {
        field: 'budget_nzd',
        value: '1,234.567',
        error: 'valid NZD amount',
        description: 'budget with 3 decimal places'
      },
      {
        field: 'budget_nzd',
        value: 'invalid',
        error: 'valid NZD amount',
        description: 'non-numeric budget'
      },

      // Financial treatment validations
      {
        field: 'financial_treatment',
        value: 'INVALID',
        error: 'must be either CAPEX or OPEX',
        description: 'invalid financial treatment'
      },

      // Field length validations
      {
        field: 'description',
        value: 'A'.repeat(1001),
        error: 'must be 1000 characters or less',
        description: 'description too long'
      },
      {
        field: 'pm_name',
        value: 'B'.repeat(101),
        error: 'must be 100 characters or less',
        description: 'PM name too long'
      },
      {
        field: 'lane',
        value: 'C'.repeat(101),
        error: 'must be 100 characters or less',
        description: 'lane too long'
      }
    ])('should reject $description', ({ field, value, error }) => {
      const invalidData = { ...validProjectData, [field]: value };
      const result = projectService.validateProject(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.join(' ').toLowerCase()).toContain(error.toLowerCase());
    });

    test('should reject end date before start date', () => {
      const invalidData: CreateProjectRequest = {
        ...validProjectData,
        start_date: '31-12-2025',
        end_date: '01-01-2025'
      };

      const result = projectService.validateProject(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.join(' ')).toContain('End date must be after start date');
    });

    test('should accept all valid project data', () => {
      const result = projectService.validateProject(validProjectData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test.each([
      { budget_nzd: '100.00', expected_cents: 10000 },
      { budget_nzd: '1,234.56', expected_cents: 123456 },
      { budget_nzd: '50000', expected_cents: 5000000 },
      { budget_nzd: '0.99', expected_cents: 99 },
      { budget_nzd: '99,999,999.99', expected_cents: 9999999999 }
    ])('should correctly convert budget $budget_nzd to $expected_cents cents', ({ budget_nzd, expected_cents }) => {
      const projectData: CreateProjectRequest = {
        ...validProjectData,
        budget_nzd
      };

      const result = projectService.createProject(projectData);

      expect(result.success).toBe(true);
      expect(result.project!.budget_cents).toBe(expected_cents);
    });

    test('should aggregate multiple validation errors', () => {
      const invalidData: CreateProjectRequest = {
        title: '',                      // Invalid
        start_date: 'invalid',          // Invalid
        end_date: '2025-12-31',         // Invalid format
        status: 'bad-status' as any,    // Invalid
        budget_nzd: '$invalid',         // Invalid
        financial_treatment: 'BAD' as any // Invalid
      };

      const result = projectService.validateProject(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(5); // Should catch multiple errors
    });

    test('should trim whitespace from string fields', () => {
      const dataWithWhitespace: CreateProjectRequest = {
        ...validProjectData,
        title: '  Trimmed Title  ',
        description: '  Trimmed Description  ',
        pm_name: '  Trimmed Name  ',
        lane: '  Trimmed Lane  '
      };

      const result = projectService.createProject(dataWithWhitespace);

      expect(result.success).toBe(true);
      expect(result.project!.title).toBe('Trimmed Title');
      expect(result.project!.description).toBe('Trimmed Description');
      expect(result.project!.pm_name).toBe('Trimmed Name');
      expect(result.project!.lane).toBe('Trimmed Lane');
    });
  });

  describe('Task Validation', () => {
    // Base valid task data for testing
    const validTaskData: CreateTaskRequest = {
      project_id: '', // Will be set in test
      title: 'Valid Task',
      start_date: '01-02-2025',
      end_date: '28-02-2025',
      status: 'planned',
      effort_hours: 40,
      assigned_resources: ['Alice', 'Bob']
    };

    beforeEach(() => {
      validTaskData.project_id = testProjectId;
    });

    test.each([
      // Title validations
      {
        field: 'title',
        value: '',
        error: 'title is required',
        description: 'empty title'
      },
      {
        field: 'title',
        value: 'A'.repeat(201),
        error: 'must be 200 characters or less',
        description: 'title too long'
      },

      // Project ID validations
      {
        field: 'project_id',
        value: '',
        error: 'Project ID is required',
        description: 'empty project ID'
      },

      // Date format validations
      {
        field: 'start_date',
        value: '2025-01-01',
        error: 'must be in DD-MM-YYYY format',
        description: 'start date ISO format'
      },
      {
        field: 'start_date',
        value: '32-01-2025',
        error: 'must be in DD-MM-YYYY format',
        description: 'invalid start date'
      },
      {
        field: 'end_date',
        value: '2025/01/31',
        error: 'must be in DD-MM-YYYY format',
        description: 'end date wrong separator'
      },
      {
        field: 'end_date',
        value: '01-13-2025',
        error: 'must be in DD-MM-YYYY format',
        description: 'invalid month'
      },

      // Status validations
      {
        field: 'status',
        value: 'invalid-status',
        error: 'must be one of',
        description: 'invalid status'
      },

      // Effort hours validations
      {
        field: 'effort_hours',
        value: -10,
        error: 'cannot be negative',
        description: 'negative effort hours'
      },
      {
        field: 'effort_hours',
        value: 10001,
        error: 'cannot exceed 10,000',
        description: 'excessive effort hours'
      }
    ])('should reject task with $description', ({ field, value, error }) => {
      const invalidData = { ...validTaskData, [field]: value };
      const result = taskService.validateTask(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.join(' ').toLowerCase()).toContain(error.toLowerCase());
    });

    test('should reject end date before start date', () => {
      const invalidData: CreateTaskRequest = {
        ...validTaskData,
        start_date: '28-02-2025',
        end_date: '01-02-2025'
      };

      const result = taskService.validateTask(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.join(' ')).toContain('End date must be after start date');
    });

    test('should reject same start and end dates', () => {
      const invalidData: CreateTaskRequest = {
        ...validTaskData,
        start_date: '15-02-2025',
        end_date: '15-02-2025'
      };

      const result = taskService.validateTask(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.join(' ')).toContain('End date must be after start date');
    });

    test('should accept valid task data', () => {
      const result = taskService.validateTask(validTaskData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    describe('Assigned Resources Validation', () => {
      test.each([
        {
          resources: 'not an array',
          error: 'must be an array',
          description: 'non-array resources'
        },
        {
          resources: Array(21).fill('Resource'),
          error: 'Cannot assign more than 20',
          description: 'too many resources'
        },
        {
          resources: ['Valid', '', 'Another'],
          error: 'must be a non-empty string',
          description: 'empty resource name'
        },
        {
          resources: ['Valid', '   ', 'Another'],
          error: 'must be a non-empty string',
          description: 'whitespace-only resource'
        },
        {
          resources: ['Valid', 'A'.repeat(101)],
          error: 'must be 100 characters or less',
          description: 'resource name too long'
        }
      ])('should reject $description', ({ resources, error }) => {
        const invalidData: any = {
          ...validTaskData,
          assigned_resources: resources
        };

        const result = taskService.validateTask(invalidData);

        expect(result.isValid).toBe(false);
        expect(result.errors.join(' ')).toContain(error);
      });

      test('should accept valid resource arrays', () => {
        const validResourceSets = [
          [],
          ['Alice'],
          ['Alice', 'Bob', 'Charlie'],
          Array(20).fill(0).map((_, i) => `Resource ${i + 1}`)
        ];

        validResourceSets.forEach(resources => {
          const taskData = { ...validTaskData, assigned_resources: resources };
          const result = taskService.validateTask(taskData);

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });
    });

    test.each([
      { effort_hours: 0, expected: 0 },
      { effort_hours: 40, expected: 40 },
      { effort_hours: 160, expected: 160 },
      { effort_hours: 9999, expected: 9999 },
      { effort_hours: 10000, expected: 10000 }
    ])('should accept valid effort hours $effort_hours', ({ effort_hours, expected }) => {
      const taskData: CreateTaskRequest = {
        ...validTaskData,
        effort_hours
      };

      const result = taskService.createTask(taskData);

      expect(result.success).toBe(true);
      expect(result.task!.effort_hours).toBe(expected);
    });

    test('should reject task for non-existent project', () => {
      const invalidData: CreateTaskRequest = {
        ...validTaskData,
        project_id: 'NON-EXISTENT-PROJECT'
      };

      const result = taskService.createTask(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Project not found');
    });

    test('should aggregate multiple validation errors', () => {
      const invalidData: CreateTaskRequest = {
        project_id: '',                  // Invalid
        title: '',                       // Invalid
        start_date: 'invalid',           // Invalid
        end_date: '2025-12-31',          // Invalid format
        status: 'bad' as any,            // Invalid
        effort_hours: -100,              // Invalid
        assigned_resources: 'bad' as any // Invalid type
      };

      const result = taskService.validateTask(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(6);
    });

    test('should trim whitespace from task title', () => {
      const dataWithWhitespace: CreateTaskRequest = {
        ...validTaskData,
        title: '  Trimmed Task Title  '
      };

      const result = taskService.createTask(dataWithWhitespace);

      expect(result.success).toBe(true);
      expect(result.task!.title).toBe('Trimmed Task Title');
    });

    test('should handle leap year dates correctly', () => {
      const leapYearTask: CreateTaskRequest = {
        ...validTaskData,
        start_date: '29-02-2024', // 2024 is leap year
        end_date: '01-03-2024'
      };

      const result = taskService.createTask(leapYearTask);

      expect(result.success).toBe(true);
    });

    test('should reject invalid leap year date', () => {
      const invalidLeapYear: CreateTaskRequest = {
        ...validTaskData,
        start_date: '29-02-2025', // 2025 is not leap year
        end_date: '01-03-2025'
      };

      const result = taskService.createTask(invalidLeapYear);

      expect(result.success).toBe(false);
      expect(result.errors.join(' ')).toContain('DD-MM-YYYY format');
    });
  });

  describe('Update Validation', () => {
    let testProjectIdForUpdate: string;
    let testTaskId: string;

    beforeEach(() => {
      // Create project for update tests
      const projectResult = projectService.createProject({
        title: 'Original Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active'
      });
      testProjectIdForUpdate = projectResult.project!.id;

      // Create task for update tests
      const taskResult = taskService.createTask({
        project_id: testProjectIdForUpdate,
        title: 'Original Task',
        start_date: '01-02-2025',
        end_date: '28-02-2025',
        status: 'planned'
      });
      testTaskId = taskResult.task!.id;
    });

    test('should validate project updates with same rules', () => {
      const invalidUpdate: UpdateProjectRequest = {
        id: testProjectIdForUpdate,
        title: '',                    // Invalid
        start_date: 'invalid-date'    // Invalid
      };

      const result = projectService.updateProject(invalidUpdate);

      expect(result.success).toBe(false);
      expect(result.errors.join(' ')).toContain('title is required');
      expect(result.errors.join(' ')).toContain('DD-MM-YYYY format');
    });

    test('should validate task updates with same rules', () => {
      const invalidUpdate: UpdateTaskRequest = {
        id: testTaskId,
        title: '',                    // Invalid
        effort_hours: -50             // Invalid
      };

      const result = taskService.updateTask(invalidUpdate);

      expect(result.success).toBe(false);
      expect(result.errors.join(' ')).toContain('title is required');
      expect(result.errors.join(' ')).toContain('cannot be negative');
    });

    test('should allow partial updates with only valid changed fields', () => {
      const validUpdate: UpdateProjectRequest = {
        id: testProjectIdForUpdate,
        status: 'completed'
      };

      const result = projectService.updateProject(validUpdate);

      expect(result.success).toBe(true);
      expect(result.project!.status).toBe('completed');
      expect(result.project!.title).toBe('Original Project'); // Unchanged
    });

    test('should reject update for non-existent entity', () => {
      const invalidUpdate: UpdateProjectRequest = {
        id: 'NON-EXISTENT',
        title: 'New Title'
      };

      const result = projectService.updateProject(invalidUpdate);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Project not found');
    });
  });

  describe('Validation Performance', () => {
    test('should validate 1000 projects quickly', () => {
      const testData: CreateProjectRequest = {
        title: 'Performance Test',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active'
      };

      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        projectService.validateProject(testData);
      }
      
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200); // <200ms for 1000 validations
    });

    test('should validate 1000 tasks quickly', () => {
      const testData: CreateTaskRequest = {
        project_id: testProjectId,
        title: 'Performance Test',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned'
      };

      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        taskService.validateTask(testData);
      }
      
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200); // <200ms for 1000 validations
    });
  });
});
