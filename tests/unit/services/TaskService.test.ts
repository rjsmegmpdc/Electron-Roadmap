import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { TaskService, CreateTaskRequest, UpdateTaskRequest, TaskStatus } from '../../../app/main/services/TaskService';
import { ProjectService, CreateProjectRequest } from '../../../app/main/services/ProjectService';
import { openDB } from '../../../app/main/db';
import * as fs from 'fs';
import * as path from 'path';

describe('TaskService', () => {
  let db: Database.Database;
  let taskService: TaskService;
  let projectService: ProjectService;
  let testDbPath: string;
  let testProject: any;

  beforeEach(async () => {
    // Create temporary database for testing
    testDbPath = path.join(__dirname, `test-${Date.now()}.db`);
    db = openDB(testDbPath);
    taskService = new TaskService(db);
    projectService = new ProjectService(db);

    // Create a test project for task operations
    const projectData: CreateProjectRequest = {
      title: 'Test Project for Tasks',
      start_date: '01-01-2025',
      end_date: '31-12-2025',
      status: 'planned'
    };
    const projectResult = projectService.createProject(projectData);
    testProject = projectResult.project!;
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    // Clean up test database
    try {
      fs.unlinkSync(testDbPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Task Validation', () => {
    test('should validate correct task data', () => {
      const validTask: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Test Task',
        start_date: '15-02-2025',
        end_date: '28-02-2025',
        effort_hours: 40,
        status: 'planned',
        assigned_resources: ['John Doe', 'Jane Smith']
      };

      const result = taskService.validateTask(validTask);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty title', () => {
      const invalidTask: CreateTaskRequest = {
        project_id: testProject.id,
        title: '',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned'
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task title is required');
    });

    test('should reject empty project ID', () => {
      const invalidTask: CreateTaskRequest = {
        project_id: '',
        title: 'Test Task',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned'
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project ID is required');
    });

    test('should reject title longer than 200 characters', () => {
      const invalidTask: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'A'.repeat(201),
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned'
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task title must be 200 characters or less');
    });

    test('should reject invalid date formats', () => {
      const invalidTask: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Test Task',
        start_date: '2025-01-01', // ISO format instead of DD-MM-YYYY
        end_date: '2025/01/31',   // Wrong separator
        status: 'planned'
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
      expect(result.errors).toContain('End date must be in DD-MM-YYYY format');
    });

    test('should reject invalid date values', () => {
      const invalidTask: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Test Task',
        start_date: '32-01-2025', // Invalid day
        end_date: '01-13-2025',   // Invalid month
        status: 'planned'
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
      expect(result.errors).toContain('End date must be in DD-MM-YYYY format');
    });

    test('should reject end date before start date', () => {
      const invalidTask: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Test Task',
        start_date: '31-01-2025',
        end_date: '01-01-2025',
        status: 'planned'
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('End date must be after start date');
    });

    test('should reject invalid status', () => {
      const invalidTask: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Test Task',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'invalid-status' as TaskStatus
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Status must be one of: planned, in-progress, blocked, done, archived');
    });

    test('should reject negative effort hours', () => {
      const invalidTask: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Test Task',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned',
        effort_hours: -10
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Effort hours cannot be negative');
    });

    test('should reject excessive effort hours', () => {
      const invalidTask: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Test Task',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned',
        effort_hours: 10001
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Effort hours cannot exceed 10,000 hours');
    });

    test('should reject non-array assigned resources', () => {
      const invalidTask: any = {
        project_id: testProject.id,
        title: 'Test Task',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned',
        assigned_resources: 'not an array'
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Assigned resources must be an array');
    });

    test('should reject too many assigned resources', () => {
      const invalidTask: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Test Task',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned',
        assigned_resources: Array(21).fill('Resource')
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot assign more than 20 resources to a task');
    });

    test('should reject empty resource names', () => {
      const invalidTask: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Test Task',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned',
        assigned_resources: ['Valid Resource', '', '   ', 'Another Valid']
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Resource at position 2 must be a non-empty string');
      expect(result.errors).toContain('Resource at position 3 must be a non-empty string');
    });

    test('should reject oversized resource names', () => {
      const invalidTask: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Test Task',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned',
        assigned_resources: ['Valid Resource', 'A'.repeat(101)]
      };

      const result = taskService.validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Resource name at position 2 must be 100 characters or less');
    });
  });

  describe('Task Creation', () => {
    test('should create a valid task successfully', () => {
      const taskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'New Test Task',
        start_date: '15-02-2025',
        end_date: '28-02-2025',
        effort_hours: 80,
        status: 'planned',
        assigned_resources: ['Alice Johnson', 'Bob Wilson']
      };

      const result = taskService.createTask(taskData);
      
      expect(result.success).toBe(true);
      expect(result.task).toBeDefined();
      expect(result.task!.title).toBe(taskData.title);
      expect(result.task!.project_id).toBe(taskData.project_id);
      expect(result.task!.start_date).toBe(taskData.start_date);
      expect(result.task!.end_date).toBe(taskData.end_date);
      expect(result.task!.effort_hours).toBe(taskData.effort_hours);
      expect(result.task!.status).toBe(taskData.status);
      expect(result.task!.assigned_resources).toEqual(taskData.assigned_resources);
      expect(result.task!.id).toMatch(/^TASK-\d+-[A-Z0-9]{5}$/);
      expect(result.task!.created_at).toBeDefined();
      expect(result.task!.updated_at).toBeDefined();
    });

    test('should create task with minimal required fields', () => {
      const taskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Minimal Task',
        start_date: '01-06-2025',
        end_date: '30-06-2025',
        status: 'planned'
      };

      const result = taskService.createTask(taskData);
      
      expect(result.success).toBe(true);
      expect(result.task).toBeDefined();
      expect(result.task!.effort_hours).toBe(0);
      expect(result.task!.assigned_resources).toEqual([]);
    });

    test('should reject invalid task data', () => {
      const invalidTaskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: '', // Invalid
        start_date: 'invalid-date', // Invalid
        end_date: '31-12-2025',
        status: 'invalid' as TaskStatus // Invalid
      };

      const result = taskService.createTask(invalidTaskData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Task title is required');
      expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
      expect(result.errors).toContain('Status must be one of: planned, in-progress, blocked, done, archived');
    });

    test('should reject task for non-existent project', () => {
      const taskData: CreateTaskRequest = {
        project_id: 'NON-EXISTENT-PROJECT',
        title: 'Test Task',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned'
      };

      const result = taskService.createTask(taskData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Project not found');
    });

    test('should handle various effort hours correctly', () => {
      const testCases = [
        { effort_hours: 0, expected: 0 },
        { effort_hours: 40, expected: 40 },
        { effort_hours: 160, expected: 160 },
        { effort_hours: 9999, expected: 9999 }
      ];

      testCases.forEach(({ effort_hours, expected }, index) => {
        const taskData: CreateTaskRequest = {
          project_id: testProject.id,
          title: `Effort Test ${index}`,
          start_date: '01-01-2025',
          end_date: '31-01-2025',
          status: 'planned',
          effort_hours
        };

        const result = taskService.createTask(taskData);
        expect(result.success).toBe(true);
        expect(result.task!.effort_hours).toBe(expected);
      });
    });
  });

  describe('Task Retrieval', () => {
    let testTask: any;

    beforeEach(() => {
      const taskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Retrieval Test Task',
        start_date: '01-03-2025',
        end_date: '31-03-2025',
        status: 'in-progress',
        effort_hours: 120,
        assigned_resources: ['Test User 1', 'Test User 2']
      };

      const result = taskService.createTask(taskData);
      testTask = result.task;
    });

    test('should retrieve task by ID', () => {
      const retrieved = taskService.getTaskById(testTask.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(testTask.id);
      expect(retrieved!.title).toBe(testTask.title);
      expect(retrieved!.project_id).toBe(testTask.project_id);
      expect(retrieved!.assigned_resources).toEqual(testTask.assigned_resources);
    });

    test('should return null for non-existent task', () => {
      const retrieved = taskService.getTaskById('NON-EXISTENT-ID');
      expect(retrieved).toBeNull();
    });

    test('should retrieve all tasks', () => {
      // Create another task
      const taskData2: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Second Test Task',
        start_date: '01-02-2025',
        end_date: '28-02-2025',
        status: 'done'
      };
      taskService.createTask(taskData2);

      const allTasks = taskService.getAllTasks();
      expect(allTasks).toHaveLength(2);
      
      // Should be ordered by start_date_iso
      expect(allTasks[0].title).toBe('Second Test Task'); // Starts Feb 1st
      expect(allTasks[1].title).toBe('Retrieval Test Task'); // Starts Mar 1st
    });

    test('should retrieve tasks by project ID', () => {
      // Create second project with its own task
      const project2Data: CreateProjectRequest = {
        title: 'Second Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'planned'
      };
      const project2Result = projectService.createProject(project2Data);
      const project2 = project2Result.project!;

      const task2Data: CreateTaskRequest = {
        project_id: project2.id,
        title: 'Task for Second Project',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned'
      };
      taskService.createTask(task2Data);

      const project1Tasks = taskService.getTasksByProjectId(testProject.id);
      expect(project1Tasks).toHaveLength(1);
      expect(project1Tasks[0].project_id).toBe(testProject.id);

      const project2Tasks = taskService.getTasksByProjectId(project2.id);
      expect(project2Tasks).toHaveLength(1);
      expect(project2Tasks[0].project_id).toBe(project2.id);
    });

    test('should retrieve tasks by status', () => {
      // Create tasks with different statuses
      const statuses: TaskStatus[] = ['done', 'blocked', 'archived'];
      statuses.forEach((status, index) => {
        const taskData: CreateTaskRequest = {
          project_id: testProject.id,
          title: `Task ${status}`,
          start_date: `0${index + 2}-01-2025`,
          end_date: `0${index + 2}-02-2025`,
          status
        };
        taskService.createTask(taskData);
      });

      const inProgressTasks = taskService.getTasksByStatus('in-progress');
      expect(inProgressTasks).toHaveLength(1);
      expect(inProgressTasks[0].status).toBe('in-progress');

      const doneTasks = taskService.getTasksByStatus('done');
      expect(doneTasks).toHaveLength(1);
      expect(doneTasks[0].status).toBe('done');

      const blockedTasks = taskService.getTasksByStatus('blocked');
      expect(blockedTasks).toHaveLength(1);
      expect(blockedTasks[0].status).toBe('blocked');
    });
  });

  describe('Task Updates', () => {
    let testTask: any;

    beforeEach(() => {
      const taskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Update Test Task',
        start_date: '01-04-2025',
        end_date: '30-04-2025',
        status: 'planned',
        effort_hours: 40,
        assigned_resources: ['Original User']
      };

      const result = taskService.createTask(taskData);
      testTask = result.task;
    });

    test('should update task successfully', () => {
      const updateData: UpdateTaskRequest = {
        id: testTask.id,
        title: 'Updated Task Title',
        status: 'in-progress',
        effort_hours: 80,
        assigned_resources: ['Updated User 1', 'Updated User 2']
      };

      const result = taskService.updateTask(updateData);
      
      expect(result.success).toBe(true);
      expect(result.task!.title).toBe('Updated Task Title');
      expect(result.task!.status).toBe('in-progress');
      expect(result.task!.effort_hours).toBe(80);
      expect(result.task!.assigned_resources).toEqual(['Updated User 1', 'Updated User 2']);
      
      // Unchanged fields should remain the same
      expect(result.task!.project_id).toBe(testProject.id);
      expect(result.task!.start_date).toBe('01-04-2025');
      expect(result.task!.end_date).toBe('30-04-2025');
    });

    test('should update only specified fields', () => {
      const originalTitle = testTask.title;
      const updateData: UpdateTaskRequest = {
        id: testTask.id,
        status: 'done'
      };

      const result = taskService.updateTask(updateData);
      
      expect(result.success).toBe(true);
      expect(result.task!.status).toBe('done');
      expect(result.task!.title).toBe(originalTitle); // Should remain unchanged
    });

    test('should reject updates with invalid data', () => {
      const invalidUpdateData: UpdateTaskRequest = {
        id: testTask.id,
        title: '', // Invalid
        start_date: 'invalid-date' // Invalid
      };

      const result = taskService.updateTask(invalidUpdateData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Task title is required');
      expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
    });

    test('should reject update for non-existent task', () => {
      const updateData: UpdateTaskRequest = {
        id: 'NON-EXISTENT-ID',
        title: 'New Title'
      };

      const result = taskService.updateTask(updateData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Task not found');
    });

    test('should reject project change to non-existent project', () => {
      const updateData: UpdateTaskRequest = {
        id: testTask.id,
        project_id: 'NON-EXISTENT-PROJECT'
      };

      const result = taskService.updateTask(updateData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Project not found');
    });

    test('should update dates and maintain consistency', () => {
      const updateData: UpdateTaskRequest = {
        id: testTask.id,
        start_date: '15-05-2025',
        end_date: '31-05-2025'
      };

      const result = taskService.updateTask(updateData);
      
      expect(result.success).toBe(true);
      expect(result.task!.start_date).toBe('15-05-2025');
      expect(result.task!.end_date).toBe('31-05-2025');
    });

    test('should handle changing assigned resources', () => {
      const updateData: UpdateTaskRequest = {
        id: testTask.id,
        assigned_resources: []
      };

      const result = taskService.updateTask(updateData);
      
      expect(result.success).toBe(true);
      expect(result.task!.assigned_resources).toEqual([]);
    });
  });

  describe('Task Deletion', () => {
    let testTask: any;

    beforeEach(() => {
      const taskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Delete Test Task',
        start_date: '01-05-2025',
        end_date: '31-05-2025',
        status: 'planned'
      };

      const result = taskService.createTask(taskData);
      testTask = result.task;
    });

    test('should delete task successfully', () => {
      const result = taskService.deleteTask(testTask.id);
      
      expect(result.success).toBe(true);
      
      // Verify task is deleted
      const retrieved = taskService.getTaskById(testTask.id);
      expect(retrieved).toBeNull();
    });

    test('should reject deletion of non-existent task', () => {
      const result = taskService.deleteTask('NON-EXISTENT-ID');
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Task not found');
    });
  });

  describe('Task Statistics', () => {
    beforeEach(() => {
      // Create tasks with different statuses and effort hours
      const tasks: CreateTaskRequest[] = [
        {
          project_id: testProject.id,
          title: 'Planned Task 1',
          start_date: '01-01-2025',
          end_date: '15-01-2025',
          status: 'planned',
          effort_hours: 40
        },
        {
          project_id: testProject.id,
          title: 'Planned Task 2',
          start_date: '16-01-2025',
          end_date: '31-01-2025',
          status: 'planned',
          effort_hours: 80
        },
        {
          project_id: testProject.id,
          title: 'In Progress Task',
          start_date: '01-02-2025',
          end_date: '28-02-2025',
          status: 'in-progress',
          effort_hours: 120
        },
        {
          project_id: testProject.id,
          title: 'Done Task',
          start_date: '01-03-2025',
          end_date: '31-03-2025',
          status: 'done',
          effort_hours: 160
        },
        {
          project_id: testProject.id,
          title: 'Blocked Task',
          start_date: '01-04-2025',
          end_date: '30-04-2025',
          status: 'blocked',
          effort_hours: 60
        }
      ];

      tasks.forEach(task => taskService.createTask(task));
    });

    test('should return correct task statistics', () => {
      const stats = taskService.getTaskStats();
      
      expect(stats.total).toBe(5);
      expect(stats.by_status.planned).toBe(2);
      expect(stats.by_status['in-progress']).toBe(1);
      expect(stats.by_status.done).toBe(1);
      expect(stats.by_status.blocked).toBe(1);
      expect(stats.by_status.archived).toBe(0);
      
      // Total effort: 40 + 80 + 120 + 160 + 60 = 460 hours
      expect(stats.total_effort_hours).toBe(460);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle leap year dates correctly', () => {
      const taskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Leap Year Task',
        start_date: '29-02-2024', // 2024 is a leap year
        end_date: '01-03-2024',
        status: 'planned'
      };

      const result = taskService.createTask(taskData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid leap year dates', () => {
      const taskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Invalid Leap Year Task',
        start_date: '29-02-2025', // 2025 is not a leap year
        end_date: '01-03-2025',
        status: 'planned'
      };

      const result = taskService.createTask(taskData);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Start date must be in DD-MM-YYYY format');
    });

    test('should handle maximum effort hours', () => {
      const taskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Max Effort Task',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'planned',
        effort_hours: 10000
      };

      const result = taskService.createTask(taskData);
      expect(result.success).toBe(true);
      expect(result.task!.effort_hours).toBe(10000);
    });

    test('should handle empty and whitespace-only fields correctly', () => {
      const taskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: '  Valid Task Title  ',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned',
        assigned_resources: ['  Valid Resource  ', 'Another Resource']
      };

      const result = taskService.createTask(taskData);
      expect(result.success).toBe(true);
      expect(result.task!.title).toBe('Valid Task Title'); // Trimmed
      expect(result.task!.assigned_resources).toEqual(['  Valid Resource  ', 'Another Resource']);
    });

    test('should handle tasks with same start and end dates', () => {
      const taskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Same Date Task',
        start_date: '15-01-2025',
        end_date: '15-01-2025',
        status: 'planned'
      };

      const result = taskService.createTask(taskData);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('End date must be after start date');
    });

    test('should handle corrupt assigned_resources JSON in database', () => {
      // Create a task normally first
      const taskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Corrupt JSON Test',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned',
        assigned_resources: ['Original Resource']
      };

      const result = taskService.createTask(taskData);
      const taskId = result.task!.id;

      // Manually corrupt the JSON in the database
      const corruptStmt = db.prepare('UPDATE tasks SET assigned_resources = ? WHERE id = ?');
      corruptStmt.run('invalid json', taskId);

      // Should handle gracefully
      const retrieved = taskService.getTaskById(taskId);
      expect(retrieved).toBeDefined();
      expect(retrieved!.assigned_resources).toEqual([]);
    });

    test('should handle maximum number of assigned resources', () => {
      const maxResources = Array(20).fill(0).map((_, i) => `Resource ${i + 1}`);
      const taskData: CreateTaskRequest = {
        project_id: testProject.id,
        title: 'Max Resources Task',
        start_date: '01-01-2025',
        end_date: '31-01-2025',
        status: 'planned',
        assigned_resources: maxResources
      };

      const result = taskService.createTask(taskData);
      expect(result.success).toBe(true);
      expect(result.task!.assigned_resources).toHaveLength(20);
    });
  });
});