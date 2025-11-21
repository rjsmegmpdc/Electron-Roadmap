import { describe, beforeEach, afterEach, test, expect, jest } from '@jest/globals';
import { ProjectIpcHandlers } from '../../../app/main/ipc/projectHandlers';
import { openDB, DB } from '../../../app/main/db';
import path from 'path';
import fs from 'fs';
import { ipcMain } from 'electron';

// Mock Electron
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

describe('ProjectIPC Integration Tests', () => {
  let db: DB;
  let projectHandlers: ProjectIpcHandlers;
  let testDbPath: string;

  beforeEach(() => {
    // Create temporary database for each test
    testDbPath = path.join(__dirname, `test-ipc-${Date.now()}.db`);
    db = openDB(testDbPath);
    projectHandlers = new ProjectIpcHandlers(db);
  });

  afterEach(() => {
    // Clean up
    if (db) {
      try {
        db.close();
      } catch (error) {
        // Database might already be closed
      }
    }
    
    // Remove test database file
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch (error) {
      // File might not exist
    }

    // Clean up handlers
    if (projectHandlers) {
      projectHandlers.cleanup();
    }

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('IPC Handler Registration', () => {
    test('should register all required IPC handlers', () => {
      const mockHandle = ipcMain.handle as jest.Mock;
      
      expect(mockHandle).toHaveBeenCalledWith('project:getAll', expect.any(Function));
      expect(mockHandle).toHaveBeenCalledWith('project:getById', expect.any(Function));
      expect(mockHandle).toHaveBeenCalledWith('project:create', expect.any(Function));
      expect(mockHandle).toHaveBeenCalledWith('project:update', expect.any(Function));
      expect(mockHandle).toHaveBeenCalledWith('project:delete', expect.any(Function));
      expect(mockHandle).toHaveBeenCalledWith('project:getByStatus', expect.any(Function));
      expect(mockHandle).toHaveBeenCalledWith('project:getStats', expect.any(Function));
    });

    test('should clean up handlers on cleanup', () => {
      const mockRemoveAllListeners = ipcMain.removeAllListeners as jest.Mock;
      
      projectHandlers.cleanup();
      
      expect(mockRemoveAllListeners).toHaveBeenCalledWith('project:getAll');
      expect(mockRemoveAllListeners).toHaveBeenCalledWith('project:getById');
      expect(mockRemoveAllListeners).toHaveBeenCalledWith('project:create');
      expect(mockRemoveAllListeners).toHaveBeenCalledWith('project:update');
      expect(mockRemoveAllListeners).toHaveBeenCalledWith('project:delete');
      expect(mockRemoveAllListeners).toHaveBeenCalledWith('project:getByStatus');
      expect(mockRemoveAllListeners).toHaveBeenCalledWith('project:getStats');
    });
  });

  // Helper function to get the actual handler function
  const getHandler = (handlerName: string) => {
    const mockHandle = ipcMain.handle as jest.Mock;
    const calls = mockHandle.mock.calls;
    const call = calls.find(c => c[0] === handlerName);
    return call ? call[1] : null;
  };

  describe('Project CRUD Operations via IPC', () => {

    test('should handle project creation with valid data', async () => {
      const createHandler = getHandler('project:create');
      expect(createHandler).not.toBeNull();

      const validProjectData = {
        title: 'Integration Test Project',
        description: 'A project created during integration testing',
        lane: 'Development',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active' as const,
        pm_name: 'Test Manager',
        budget_nzd: '50,000.00',
        financial_treatment: 'CAPEX' as const,
      };

      const result = await createHandler({}, validProjectData);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        title: 'Integration Test Project',
        description: 'A project created during integration testing',
        status: 'active',
        pm_name: 'Test Manager',
      });
      expect(result.data.id).toMatch(/^PROJ-\d+-[A-Z0-9]{5}$/);
      expect(result.errors).toBeUndefined();
    });

    test('should handle project creation with invalid data', async () => {
      const createHandler = getHandler('project:create');
      expect(createHandler).not.toBeNull();

      const invalidProjectData = {
        title: '', // Empty title should fail validation
        start_date: 'invalid-date', // Invalid date format
        end_date: '31-12-2025',
        status: 'invalid-status' as any, // Invalid status
      };

      const result = await createHandler({}, invalidProjectData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Project title is required');
      expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
      expect(result.errors).toContain('Status must be one of: active, completed, on-hold, cancelled');
      expect(result.data).toBeUndefined();
    });

    test('should handle project creation with missing required data', async () => {
      const createHandler = getHandler('project:create');
      expect(createHandler).not.toBeNull();

      // Test with null/undefined data
      const resultNull = await createHandler({}, null);
      expect(resultNull.success).toBe(false);
      expect(resultNull.errors).toContain('Project data is required');

      // Test with non-object data
      const resultString = await createHandler({}, 'not an object');
      expect(resultString.success).toBe(false);
      expect(resultString.errors).toContain('Project data is required');
    });

    test('should retrieve all projects', async () => {
      // First create a project
      const createHandler = getHandler('project:create');
      const getAllHandler = getHandler('project:getAll');
      
      const projectData = {
        title: 'Test Project for Retrieval',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active' as const,
      };

      await createHandler({}, projectData);
      const result = await getAllHandler({});

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('title');
      expect(result.data[0]).toHaveProperty('status');
    });

    test('should retrieve project by ID', async () => {
      // First create a project
      const createHandler = getHandler('project:create');
      const getByIdHandler = getHandler('project:getById');
      
      const projectData = {
        title: 'Test Project for ID Retrieval',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active' as const,
      };

      const createResult = await createHandler({}, projectData);
      const projectId = createResult.data.id;

      const getResult = await getByIdHandler({}, projectId);

      expect(getResult.success).toBe(true);
      expect(getResult.data).not.toBeNull();
      expect(getResult.data.id).toBe(projectId);
      expect(getResult.data.title).toBe('Test Project for ID Retrieval');
    });

    test('should handle get project by invalid ID', async () => {
      const getByIdHandler = getHandler('project:getById');

      // Test with empty ID
      const resultEmpty = await getByIdHandler({}, '');
      expect(resultEmpty.success).toBe(false);
      expect(resultEmpty.errors).toContain('Project ID is required');

      // Test with non-string ID
      const resultNumber = await getByIdHandler({}, 123);
      expect(resultNumber.success).toBe(false);
      expect(resultNumber.errors).toContain('Project ID is required');

      // Test with non-existent ID
      const resultNonExistent = await getByIdHandler({}, 'non-existent-id');
      expect(resultNonExistent.success).toBe(true);
      expect(resultNonExistent.data).toBeNull();
    });

    test('should update existing project', async () => {
      // First create a project
      const createHandler = getHandler('project:create');
      const updateHandler = getHandler('project:update');
      
      const projectData = {
        title: 'Original Title',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active' as const,
      };

      const createResult = await createHandler({}, projectData);
      const projectId = createResult.data.id;

      // Update the project with valid complete data
      const updateData = {
        id: projectId,
        title: 'Updated Title',
        start_date: '01-01-2025',
        end_date: '31-12-2025', 
        status: 'completed' as const,
      };

      const updateResult = await updateHandler({}, updateData);

      if (!updateResult.success) {
        console.log('Update failed with errors:', updateResult.errors);
      }

      expect(updateResult.success).toBe(true);
      expect(updateResult.data.title).toBe('Updated Title');
      expect(updateResult.data.status).toBe('completed');
      expect(updateResult.data.id).toBe(projectId);
    });

    test('should handle update with invalid data', async () => {
      const updateHandler = getHandler('project:update');

      // Test with missing ID
      const resultNoId = await updateHandler({}, { title: 'Test' });
      expect(resultNoId.success).toBe(false);
      expect(resultNoId.errors).toContain('Project data with ID is required');

      // Test with null data
      const resultNull = await updateHandler({}, null);
      expect(resultNull.success).toBe(false);
      expect(resultNull.errors).toContain('Project data with ID is required');

      // Test with invalid validation data (the update call will validate dates and status)
      const invalidData = {
        id: 'test-id', // Non-existent, but has an ID
        start_date: 'invalid-date',
        end_date: 'invalid-date',
        status: 'invalid-status'
      };
      const resultInvalid = await updateHandler({}, invalidData);
      expect(resultInvalid.success).toBe(false);
      // It will try to validate the data, and should have validation errors
      expect(resultInvalid.errors.length).toBeGreaterThan(0);
    });

    test('should delete existing project', async () => {
      // First create a project
      const createHandler = getHandler('project:create');
      const deleteHandler = getHandler('project:delete');
      const getByIdHandler = getHandler('project:getById');
      
      const projectData = {
        title: 'Project to Delete',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active' as const,
      };

      const createResult = await createHandler({}, projectData);
      const projectId = createResult.data.id;

      // Delete the project
      const deleteResult = await deleteHandler({}, projectId);
      expect(deleteResult.success).toBe(true);

      // Verify project is deleted
      const getResult = await getByIdHandler({}, projectId);
      expect(getResult.data).toBeNull();
    });

    test('should handle delete with invalid ID', async () => {
      const deleteHandler = getHandler('project:delete');

      // Test with empty ID
      const resultEmpty = await deleteHandler({}, '');
      expect(resultEmpty.success).toBe(false);
      expect(resultEmpty.errors).toContain('Project ID is required');

      // Test with non-existent ID
      const resultNonExistent = await deleteHandler({}, 'non-existent-id');
      expect(resultNonExistent.success).toBe(false);
      expect(resultNonExistent.errors).toContain('Project not found');
    });

    test('should get projects by status', async () => {
      // Create projects with different statuses
      const createHandler = getHandler('project:create');
      const getByStatusHandler = getHandler('project:getByStatus');
      
      await createHandler({}, {
        title: 'Active Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active' as const,
      });

      await createHandler({}, {
        title: 'Completed Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'completed' as const,
      });

      const activeResult = await getByStatusHandler({}, 'active');
      expect(activeResult.success).toBe(true);
      expect(activeResult.data.length).toBeGreaterThan(0);
      expect(activeResult.data.every(p => p.status === 'active')).toBe(true);

      const completedResult = await getByStatusHandler({}, 'completed');
      expect(completedResult.success).toBe(true);
      expect(completedResult.data.length).toBeGreaterThan(0);
      expect(completedResult.data.every(p => p.status === 'completed')).toBe(true);
    });

    test('should handle invalid status filter', async () => {
      const getByStatusHandler = getHandler('project:getByStatus');

      // Test with invalid status
      const result = await getByStatusHandler({}, 'invalid-status');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid status. Must be one of: active, completed, on-hold, cancelled');

      // Test with empty status
      const resultEmpty = await getByStatusHandler({}, '');
      expect(resultEmpty.success).toBe(false);
      expect(resultEmpty.errors).toContain('Status is required');
    });

    test('should get project statistics', async () => {
      // Create some test projects
      const createHandler = getHandler('project:create');
      const getStatsHandler = getHandler('project:getStats');
      
      await createHandler({}, {
        title: 'Active Project 1',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active' as const,
        budget_nzd: '10,000.00',
      });

      await createHandler({}, {
        title: 'Active Project 2',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active' as const,
        budget_nzd: '20,000.00',
      });

      await createHandler({}, {
        title: 'Completed Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'completed' as const,
        budget_nzd: '15,000.00',
      });

      const statsResult = await getStatsHandler({});
      expect(statsResult.success).toBe(true);
      expect(statsResult.data).toHaveProperty('total');
      expect(statsResult.data).toHaveProperty('by_status');
      expect(statsResult.data).toHaveProperty('total_budget_cents');
      
      expect(statsResult.data.total).toBe(3);
      expect(statsResult.data.by_status.active).toBe(2);
      expect(statsResult.data.by_status.completed).toBe(1);
      expect(statsResult.data.total_budget_cents).toBe(4500000); // 45,000.00 in cents
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // Close the database to simulate connection error
      db.close();

      const getAllHandler = getHandler('project:getAll');
      const result = await getAllHandler({});

      // The service handles database errors gracefully by returning empty array
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    test('should handle malformed project data', async () => {
      const createHandler = getHandler('project:create');

      const malformedData = {
        title: 'A'.repeat(300), // Exceeds title length limit
        start_date: '32-13-2025', // Invalid date
        end_date: '01-01-2025', // End before start
        status: 'active' as const,
        budget_nzd: 'invalid-amount',
      };

      const result = await createHandler({}, malformedData);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Project title must be 200 characters or less');
      expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
      expect(result.errors).toContain('Budget must be a valid NZD amount (e.g., \"1,234.56\")');
    });
  });

  describe('Data Validation', () => {
    test('should validate NZ date formats correctly', async () => {
      const createHandler = getHandler('project:create');

      // Test valid dates
      const validDateProject = {
        title: 'Valid Date Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'active' as const,
      };
      
      const validResult = await createHandler({}, validDateProject);
      expect(validResult.success).toBe(true);
      
      // Test invalid date format
      const invalidDateProject = {
        title: 'Invalid Date Project',
        start_date: '2025-01-01', // Wrong format
        end_date: '31-12-2025',
        status: 'active' as const,
      };
      
      const invalidResult = await createHandler({}, invalidDateProject);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toContain('Start date must be in DD-MM-YYYY format');
      
      // Test invalid day
      const invalidDayProject = {
        title: 'Invalid Day Project',
        start_date: '32-01-2025', // Invalid day
        end_date: '31-12-2025',
        status: 'active' as const,
      };
      
      const invalidDayResult = await createHandler({}, invalidDayProject);
      expect(invalidDayResult.success).toBe(false);
      expect(invalidDayResult.errors).toContain('Start date must be in DD-MM-YYYY format');
    });

    test('should validate NZ currency formats correctly', async () => {
      const createHandler = getHandler('project:create');

      const testCases = [
        { budget: '1,000.00', shouldPass: true },
        { budget: '1000', shouldPass: true },
        { budget: '1000.50', shouldPass: true },
        { budget: '10,000,000.99', shouldPass: true },
        { budget: '1000.', shouldPass: false }, // Trailing decimal
        { budget: '1000.123', shouldPass: false }, // Too many decimal places
        { budget: '$1000', shouldPass: false }, // Currency symbol
        { budget: 'abc', shouldPass: false }, // Non-numeric
      ];

      for (const testCase of testCases) {
        const projectData = {
          title: `Budget Test ${testCase.budget}`,
          start_date: '01-01-2025',
          end_date: '31-12-2025',
          status: 'active' as const,
          budget_nzd: testCase.budget,
        };

        const result = await createHandler({}, projectData);

        if (testCase.shouldPass) {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
          expect(result.errors).toContain('Budget must be a valid NZD amount (e.g., \"1,234.56\")');
        }
      }
    });

    test('should validate date ranges correctly', async () => {
      const createHandler = getHandler('project:create');

      // Test case: end date before start date
      const invalidRangeData = {
        title: 'Invalid Date Range Project',
        start_date: '31-12-2025',
        end_date: '01-01-2025', // End before start
        status: 'active' as const,
      };

      const result = await createHandler({}, invalidRangeData);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('End date must be after start date');
    });
  });
});