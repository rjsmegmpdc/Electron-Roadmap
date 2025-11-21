import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { DependencyService, CreateDependencyRequest, UpdateDependencyRequest, DependencyType, EntityType } from '../../../app/main/services/DependencyService';
import { ProjectService, CreateProjectRequest } from '../../../app/main/services/ProjectService';
import { TaskService, CreateTaskRequest } from '../../../app/main/services/TaskService';
import { openDB } from '../../../app/main/db';
import * as fs from 'fs';
import * as path from 'path';

describe('DependencyService', () => {
  let db: Database.Database;
  let dependencyService: DependencyService;
  let projectService: ProjectService;
  let taskService: TaskService;
  let testDbPath: string;
  let testProject1: any;
  let testProject2: any;
  let testTask1: any;
  let testTask2: any;

  beforeEach(async () => {
    // Create temporary database for testing
    testDbPath = path.join(__dirname, `test-${Date.now()}.db`);
    db = openDB(testDbPath);
    dependencyService = new DependencyService(db);
    projectService = new ProjectService(db);
    taskService = new TaskService(db);

    // Create test projects and tasks
    const project1Data: CreateProjectRequest = {
      title: 'Test Project 1',
      start_date: '01-01-2025',
      end_date: '31-03-2025',
      status: 'planned'
    };
    const project1Result = projectService.createProject(project1Data);
    testProject1 = project1Result.project!;

    const project2Data: CreateProjectRequest = {
      title: 'Test Project 2',
      start_date: '01-04-2025',
      end_date: '30-06-2025',
      status: 'planned'
    };
    const project2Result = projectService.createProject(project2Data);
    testProject2 = project2Result.project!;

    const task1Data: CreateTaskRequest = {
      project_id: testProject1.id,
      title: 'Test Task 1',
      start_date: '15-01-2025',
      end_date: '31-01-2025',
      status: 'planned'
    };
    const task1Result = taskService.createTask(task1Data);
    testTask1 = task1Result.task!;

    const task2Data: CreateTaskRequest = {
      project_id: testProject2.id,
      title: 'Test Task 2',
      start_date: '15-04-2025',
      end_date: '30-04-2025',
      status: 'planned'
    };
    const task2Result = taskService.createTask(task2Data);
    testTask2 = task2Result.task!;
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

  describe('Dependency Validation', () => {
    test('should validate correct dependency data', () => {
      const validDependency: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS',
        lag_days: 5,
        note: 'Test dependency note'
      };

      const result = dependencyService.validateDependency(validDependency);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid from_type', () => {
      const invalidDependency: any = {
        from_type: 'invalid',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS'
      };

      const result = dependencyService.validateDependency(invalidDependency);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('From type must be either "project" or "task"');
    });

    test('should reject empty from_id', () => {
      const invalidDependency: CreateDependencyRequest = {
        from_type: 'project',
        from_id: '',
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS'
      };

      const result = dependencyService.validateDependency(invalidDependency);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('From ID is required');
    });

    test('should reject invalid to_type', () => {
      const invalidDependency: any = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'invalid',
        to_id: testProject2.id,
        kind: 'FS'
      };

      const result = dependencyService.validateDependency(invalidDependency);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('To type must be either "project" or "task"');
    });

    test('should reject empty to_id', () => {
      const invalidDependency: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: '',
        kind: 'FS'
      };

      const result = dependencyService.validateDependency(invalidDependency);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('To ID is required');
    });

    test('should reject self-dependencies', () => {
      const invalidDependency: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject1.id,
        kind: 'FS'
      };

      const result = dependencyService.validateDependency(invalidDependency);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot create a dependency from an entity to itself');
    });

    test('should reject invalid dependency kinds', () => {
      const invalidDependency: any = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'INVALID'
      };

      const result = dependencyService.validateDependency(invalidDependency);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dependency kind must be one of: FS (Finish-to-Start), SS (Start-to-Start), FF (Finish-to-Finish), SF (Start-to-Finish)');
    });

    test('should reject invalid lag days', () => {
      const invalidDependency: any = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS',
        lag_days: 'invalid'
      };

      const result = dependencyService.validateDependency(invalidDependency);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Lag days must be a number');
    });

    test('should reject excessive lag days', () => {
      const testCases = [
        { lag_days: -366, expectedError: 'Lag days cannot be less than -365 days' },
        { lag_days: 366, expectedError: 'Lag days cannot be more than 365 days' }
      ];

      testCases.forEach(({ lag_days, expectedError }) => {
        const invalidDependency: CreateDependencyRequest = {
          from_type: 'project',
          from_id: testProject1.id,
          to_type: 'project',
          to_id: testProject2.id,
          kind: 'FS',
          lag_days
        };

        const result = dependencyService.validateDependency(invalidDependency);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expectedError);
      });
    });

    test('should reject oversized note', () => {
      const invalidDependency: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS',
        note: 'A'.repeat(501)
      };

      const result = dependencyService.validateDependency(invalidDependency);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Note must be 500 characters or less');
    });

    test('should accept valid lag days range', () => {
      const testCases = [-365, -100, 0, 100, 365];

      testCases.forEach(lag_days => {
        const validDependency: CreateDependencyRequest = {
          from_type: 'project',
          from_id: testProject1.id,
          to_type: 'project',
          to_id: testProject2.id,
          kind: 'FS',
          lag_days
        };

        const result = dependencyService.validateDependency(validDependency);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Dependency Creation', () => {
    test('should create a valid project-to-project dependency', () => {
      const dependencyData: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS',
        lag_days: 10,
        note: 'Project 1 must finish before Project 2 starts'
      };

      const result = dependencyService.createDependency(dependencyData);
      
      expect(result.success).toBe(true);
      expect(result.dependency).toBeDefined();
      expect(result.dependency!.from_type).toBe(dependencyData.from_type);
      expect(result.dependency!.from_id).toBe(dependencyData.from_id);
      expect(result.dependency!.to_type).toBe(dependencyData.to_type);
      expect(result.dependency!.to_id).toBe(dependencyData.to_id);
      expect(result.dependency!.kind).toBe(dependencyData.kind);
      expect(result.dependency!.lag_days).toBe(dependencyData.lag_days);
      expect(result.dependency!.note).toBe(dependencyData.note);
      expect(result.dependency!.id).toMatch(/^DEP-\d+-[A-Z0-9]{5}$/);
      expect(result.dependency!.created_at).toBeDefined();
    });

    test('should create a valid task-to-task dependency', () => {
      const dependencyData: CreateDependencyRequest = {
        from_type: 'task',
        from_id: testTask1.id,
        to_type: 'task',
        to_id: testTask2.id,
        kind: 'SS'
      };

      const result = dependencyService.createDependency(dependencyData);
      
      expect(result.success).toBe(true);
      expect(result.dependency).toBeDefined();
      expect(result.dependency!.from_type).toBe('task');
      expect(result.dependency!.to_type).toBe('task');
      expect(result.dependency!.kind).toBe('SS');
      expect(result.dependency!.lag_days).toBe(0); // default
      expect(result.dependency!.note).toBe(''); // default
    });

    test('should create mixed project-task dependencies', () => {
      const testCases = [
        { from_type: 'project' as EntityType, from_id: () => testProject1.id, to_type: 'task' as EntityType, to_id: () => testTask2.id, kind: 'FF' as DependencyType },
        { from_type: 'task' as EntityType, from_id: () => testTask1.id, to_type: 'project' as EntityType, to_id: () => testProject2.id, kind: 'SF' as DependencyType }
      ];

      testCases.forEach(({ from_type, from_id, to_type, to_id, kind }) => {
        const dependencyData: CreateDependencyRequest = {
          from_type,
          from_id: from_id(),
          to_type,
          to_id: to_id(),
          kind
        };

        const result = dependencyService.createDependency(dependencyData);
        expect(result.success).toBe(true);
        expect(result.dependency!.kind).toBe(kind);
      });
    });

    test('should reject dependency for non-existent entities', () => {
      const dependencyData: CreateDependencyRequest = {
        from_type: 'project',
        from_id: 'NON-EXISTENT-PROJECT',
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS'
      };

      const result = dependencyService.createDependency(dependencyData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Source project "NON-EXISTENT-PROJECT" not found');
    });

    test('should reject duplicate dependencies', () => {
      // Create first dependency
      const dependencyData: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS'
      };

      const result1 = dependencyService.createDependency(dependencyData);
      expect(result1.success).toBe(true);

      // Try to create the same dependency again
      const result2 = dependencyService.createDependency(dependencyData);
      expect(result2.success).toBe(false);
      expect(result2.errors).toContain('A dependency of this type already exists between these entities');
    });

    test('should allow different kinds of dependencies between same entities', () => {
      const baseDependency: Omit<CreateDependencyRequest, 'kind'> = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id
      };

      const kinds: DependencyType[] = ['FS', 'SS', 'FF', 'SF'];

      kinds.forEach(kind => {
        const result = dependencyService.createDependency({ ...baseDependency, kind });
        expect(result.success).toBe(true);
      });
    });

    test('should handle minimal dependency data', () => {
      const dependencyData: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS'
      };

      const result = dependencyService.createDependency(dependencyData);
      
      expect(result.success).toBe(true);
      expect(result.dependency!.lag_days).toBe(0);
      expect(result.dependency!.note).toBe('');
    });
  });

  describe('Cycle Detection', () => {
    test('should detect direct cycles', () => {
      // Create A -> B dependency first
      const dep1: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS'
      };
      dependencyService.createDependency(dep1);

      // Try to create B -> A (direct cycle)
      const dep2: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject2.id,
        to_type: 'project',
        to_id: testProject1.id,
        kind: 'FS'
      };

      const result = dependencyService.createDependency(dep2);
      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('Creating this dependency would create a cycle');
    });

    test('should detect indirect cycles', () => {
      // Create third project for indirect cycle test
      const project3Data: CreateProjectRequest = {
        title: 'Test Project 3',
        start_date: '01-07-2025',
        end_date: '30-09-2025',
        status: 'planned'
      };
      const project3Result = projectService.createProject(project3Data);
      const testProject3 = project3Result.project!;

      // Create A -> B -> C chain
      dependencyService.createDependency({
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS'
      });

      dependencyService.createDependency({
        from_type: 'project',
        from_id: testProject2.id,
        to_type: 'project',
        to_id: testProject3.id,
        kind: 'FS'
      });

      // Try to create C -> A (indirect cycle)
      const cycleResult = dependencyService.createDependency({
        from_type: 'project',
        from_id: testProject3.id,
        to_type: 'project',
        to_id: testProject1.id,
        kind: 'FS'
      });

      expect(cycleResult.success).toBe(false);
      expect(cycleResult.errors![0]).toContain('Creating this dependency would create a cycle');
    });

    test('should allow valid non-cyclic dependencies', () => {
      // Create third and fourth projects
      const project3Data: CreateProjectRequest = {
        title: 'Test Project 3',
        start_date: '01-07-2025',
        end_date: '30-09-2025',
        status: 'planned'
      };
      const project3Result = projectService.createProject(project3Data);
      const testProject3 = project3Result.project!;

      const project4Data: CreateProjectRequest = {
        title: 'Test Project 4',
        start_date: '01-10-2025',
        end_date: '31-12-2025',
        status: 'planned'
      };
      const project4Result = projectService.createProject(project4Data);
      const testProject4 = project4Result.project!;

      // Create valid chain A -> B -> C -> D
      const dependencies = [
        { from: testProject1.id, to: testProject2.id },
        { from: testProject2.id, to: testProject3.id },
        { from: testProject3.id, to: testProject4.id }
      ];

      dependencies.forEach(({ from, to }) => {
        const result = dependencyService.createDependency({
          from_type: 'project',
          from_id: from,
          to_type: 'project',
          to_id: to,
          kind: 'FS'
        });
        expect(result.success).toBe(true);
      });

      // Also create A -> D (valid because it doesn't create a cycle)
      const parallelResult = dependencyService.createDependency({
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject4.id,
        kind: 'SS'
      });
      expect(parallelResult.success).toBe(true);
    });

    test('should handle mixed entity type cycles', () => {
      // Create task -> project -> task cycle
      dependencyService.createDependency({
        from_type: 'task',
        from_id: testTask1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS'
      });

      const cycleResult = dependencyService.createDependency({
        from_type: 'project',
        from_id: testProject2.id,
        to_type: 'task',
        to_id: testTask1.id,
        kind: 'FS'
      });

      expect(cycleResult.success).toBe(false);
      expect(cycleResult.errors![0]).toContain('Creating this dependency would create a cycle');
    });
  });

  describe('Dependency Retrieval', () => {
    let testDependency: any;

    beforeEach(() => {
      const dependencyData: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'task',
        to_id: testTask2.id,
        kind: 'FF',
        lag_days: 5,
        note: 'Test retrieval dependency'
      };

      const result = dependencyService.createDependency(dependencyData);
      testDependency = result.dependency;
    });

    test('should retrieve dependency by ID', () => {
      const retrieved = dependencyService.getDependencyById(testDependency.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(testDependency.id);
      expect(retrieved!.from_type).toBe(testDependency.from_type);
      expect(retrieved!.from_id).toBe(testDependency.from_id);
      expect(retrieved!.to_type).toBe(testDependency.to_type);
      expect(retrieved!.to_id).toBe(testDependency.to_id);
      expect(retrieved!.kind).toBe(testDependency.kind);
    });

    test('should return null for non-existent dependency', () => {
      const retrieved = dependencyService.getDependencyById('NON-EXISTENT-ID');
      expect(retrieved).toBeNull();
    });

    test('should retrieve all dependencies', () => {
      // Create another dependency
      const dep2Data: CreateDependencyRequest = {
        from_type: 'task',
        from_id: testTask1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'SS'
      };
      const dep2Result = dependencyService.createDependency(dep2Data);
      expect(dep2Result.success).toBe(true);

      const allDeps = dependencyService.getAllDependencies();
      expect(allDeps).toHaveLength(2);
      
      // Verify both dependencies exist
      const kindList = allDeps.map(d => d.kind);
      expect(kindList).toContain('SS'); // Second dependency
      expect(kindList).toContain('FF'); // Original dependency
      
      // Verify both dependencies can be found
      const originalDep = allDeps.find(d => d.kind === 'FF');
      const newDep = allDeps.find(d => d.kind === 'SS');
      expect(originalDep).toBeDefined();
      expect(newDep).toBeDefined();
      expect(originalDep!.id).toBe(testDependency.id);
    });

    test('should retrieve dependencies from entity', () => {
      const fromDeps = dependencyService.getDependenciesFromEntity('project', testProject1.id);
      expect(fromDeps).toHaveLength(1);
      expect(fromDeps[0].from_id).toBe(testProject1.id);

      const noDeps = dependencyService.getDependenciesFromEntity('project', testProject2.id);
      expect(noDeps).toHaveLength(0);
    });

    test('should retrieve dependencies to entity', () => {
      const toDeps = dependencyService.getDependenciesToEntity('task', testTask2.id);
      expect(toDeps).toHaveLength(1);
      expect(toDeps[0].to_id).toBe(testTask2.id);

      const noDeps = dependencyService.getDependenciesToEntity('task', testTask1.id);
      expect(noDeps).toHaveLength(0);
    });

    test('should retrieve all dependencies for entity', () => {
      // Create another dependency where testProject1 is the target
      const dep2Data: CreateDependencyRequest = {
        from_type: 'task',
        from_id: testTask1.id,
        to_type: 'project',
        to_id: testProject1.id,
        kind: 'FS'
      };
      dependencyService.createDependency(dep2Data);

      const allForEntity = dependencyService.getDependenciesForEntity('project', testProject1.id);
      
      expect(allForEntity.outgoing).toHaveLength(1); // testProject1 -> testTask2
      expect(allForEntity.incoming).toHaveLength(1); // testTask1 -> testProject1
      expect(allForEntity.all).toHaveLength(2);
    });
  });

  describe('Dependency Updates', () => {
    let testDependency: any;

    beforeEach(() => {
      const dependencyData: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS',
        lag_days: 5,
        note: 'Original note'
      };

      const result = dependencyService.createDependency(dependencyData);
      testDependency = result.dependency;
    });

    test('should update dependency successfully', () => {
      const updateData: UpdateDependencyRequest = {
        id: testDependency.id,
        kind: 'SS',
        lag_days: 10,
        note: 'Updated note'
      };

      const result = dependencyService.updateDependency(updateData);
      
      expect(result.success).toBe(true);
      expect(result.dependency!.kind).toBe('SS');
      expect(result.dependency!.lag_days).toBe(10);
      expect(result.dependency!.note).toBe('Updated note');
      
      // Unchanged fields should remain the same
      expect(result.dependency!.from_type).toBe(testDependency.from_type);
      expect(result.dependency!.from_id).toBe(testDependency.from_id);
      expect(result.dependency!.to_type).toBe(testDependency.to_type);
      expect(result.dependency!.to_id).toBe(testDependency.to_id);
    });

    test('should update only specified fields', () => {
      const updateData: UpdateDependencyRequest = {
        id: testDependency.id,
        lag_days: 15
      };

      const result = dependencyService.updateDependency(updateData);
      
      expect(result.success).toBe(true);
      expect(result.dependency!.lag_days).toBe(15);
      expect(result.dependency!.kind).toBe(testDependency.kind); // Should remain unchanged
      expect(result.dependency!.note).toBe(testDependency.note); // Should remain unchanged
    });

    test('should reject updates with invalid data', () => {
      const invalidUpdateData: UpdateDependencyRequest = {
        id: testDependency.id,
        kind: 'INVALID' as DependencyType,
        lag_days: 500
      };

      const result = dependencyService.updateDependency(invalidUpdateData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Dependency kind must be one of: FS, SS, FF, SF');
      expect(result.errors).toContain('Lag days must be between -365 and 365 days');
    });

    test('should reject update for non-existent dependency', () => {
      const updateData: UpdateDependencyRequest = {
        id: 'NON-EXISTENT-ID',
        kind: 'FF'
      };

      const result = dependencyService.updateDependency(updateData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Dependency not found');
    });
  });

  describe('Dependency Deletion', () => {
    let testDependency: any;

    beforeEach(() => {
      const dependencyData: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS'
      };

      const result = dependencyService.createDependency(dependencyData);
      testDependency = result.dependency;
    });

    test('should delete dependency successfully', () => {
      const result = dependencyService.deleteDependency(testDependency.id);
      
      expect(result.success).toBe(true);
      
      // Verify dependency is deleted
      const retrieved = dependencyService.getDependencyById(testDependency.id);
      expect(retrieved).toBeNull();
    });

    test('should reject deletion of non-existent dependency', () => {
      const result = dependencyService.deleteDependency('NON-EXISTENT-ID');
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Dependency not found');
    });
  });

  describe('Dependency Statistics', () => {
    beforeEach(() => {
      // Create dependencies with different kinds and entity types (avoiding cycles)
      const dependencies: CreateDependencyRequest[] = [
        { from_type: 'project', from_id: testProject1.id, to_type: 'project', to_id: testProject2.id, kind: 'FS' },
        { from_type: 'project', from_id: testProject1.id, to_type: 'task', to_id: testTask2.id, kind: 'SS' },
        { from_type: 'task', from_id: testTask1.id, to_type: 'task', to_id: testTask2.id, kind: 'SF' },
        { from_type: 'project', from_id: testProject2.id, to_type: 'task', to_id: testTask1.id, kind: 'FF' }
      ];

      // Create additional projects and tasks to avoid cycles
      const project3Data: CreateProjectRequest = {
        title: 'Stats Test Project 3',
        start_date: '01-07-2025',
        end_date: '31-07-2025',
        status: 'planned'
      };
      const project3Result = projectService.createProject(project3Data);
      const statsProject3 = project3Result.project!;

      const task3Data: CreateTaskRequest = {
        project_id: statsProject3.id,
        title: 'Stats Test Task 3',
        start_date: '15-07-2025',
        end_date: '31-07-2025',
        status: 'planned'
      };
      const task3Result = taskService.createTask(task3Data);
      const statsTask3 = task3Result.task!;

      // Add fifth dependency to make the count exactly 5
      dependencies.push({
        from_type: 'task',
        from_id: statsTask3.id,
        to_type: 'project',
        to_id: statsProject3.id,
        kind: 'FS'
      });

      dependencies.forEach(dep => dependencyService.createDependency(dep));
    });

    test('should return correct dependency statistics', () => {
      const stats = dependencyService.getDependencyStats();
      
      expect(stats.total).toBe(5);
      expect(stats.by_kind.FS).toBe(2); // testProject1->testProject2, statsTask3->statsProject3
      expect(stats.by_kind.SS).toBe(1); // testProject1->testTask2
      expect(stats.by_kind.FF).toBe(1); // testProject2->testTask1
      expect(stats.by_kind.SF).toBe(1); // testTask1->testTask2
      
      expect(stats.by_entity_type['project-to-project']).toBe(1); // testProject1->testProject2
      expect(stats.by_entity_type['project-to-task']).toBe(2); // testProject1->testTask2, testProject2->testTask1
      expect(stats.by_entity_type['task-to-project']).toBe(1); // statsTask3->statsProject3
      expect(stats.by_entity_type['task-to-task']).toBe(1); // testTask1->testTask2
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty note correctly', () => {
      const dependencyData: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS',
        note: '   ' // whitespace only
      };

      const result = dependencyService.createDependency(dependencyData);
      expect(result.success).toBe(true);
      expect(result.dependency!.note).toBe(''); // Should be trimmed to empty
    });

    test('should handle zero lag days', () => {
      const dependencyData: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS',
        lag_days: 0
      };

      const result = dependencyService.createDependency(dependencyData);
      expect(result.success).toBe(true);
      expect(result.dependency!.lag_days).toBe(0);
    });

    test('should handle negative lag days', () => {
      const dependencyData: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS',
        lag_days: -30
      };

      const result = dependencyService.createDependency(dependencyData);
      expect(result.success).toBe(true);
      expect(result.dependency!.lag_days).toBe(-30);
    });

    test('should handle maximum valid note length', () => {
      const maxNote = 'A'.repeat(500);
      const dependencyData: CreateDependencyRequest = {
        from_type: 'project',
        from_id: testProject1.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS',
        note: maxNote
      };

      const result = dependencyService.createDependency(dependencyData);
      expect(result.success).toBe(true);
      expect(result.dependency!.note).toBe(maxNote);
    });

    test('should handle complex cycle detection scenarios', () => {
      // Create projects A, B, C, D
      const projects = [];
      for (let i = 3; i <= 4; i++) {
        const projectData: CreateProjectRequest = {
          title: `Test Project ${i}`,
          start_date: `01-0${i}-2025`,
          end_date: `28-0${i}-2025`,
          status: 'planned'
        };
        const result = projectService.createProject(projectData);
        projects.push(result.project!);
      }

      const [project3, project4] = projects;

      // Create complex dependency chain: 1->2->3->4 and 1->4
      dependencyService.createDependency({ from_type: 'project', from_id: testProject1.id, to_type: 'project', to_id: testProject2.id, kind: 'FS' });
      dependencyService.createDependency({ from_type: 'project', from_id: testProject2.id, to_type: 'project', to_id: project3.id, kind: 'FS' });
      dependencyService.createDependency({ from_type: 'project', from_id: project3.id, to_type: 'project', to_id: project4.id, kind: 'FS' });
      dependencyService.createDependency({ from_type: 'project', from_id: testProject1.id, to_type: 'project', to_id: project4.id, kind: 'SS' });

      // Now try to create 4->2 (would create cycle through multiple paths)
      const cycleResult = dependencyService.createDependency({
        from_type: 'project',
        from_id: project4.id,
        to_type: 'project',
        to_id: testProject2.id,
        kind: 'FS'
      });

      expect(cycleResult.success).toBe(false);
      expect(cycleResult.errors![0]).toContain('Creating this dependency would create a cycle');
    });

    test('should handle all dependency kinds correctly', () => {
      const kinds: DependencyType[] = ['FS', 'SS', 'FF', 'SF'];
      
      kinds.forEach(kind => {
        // Create new projects for each test to avoid conflicts
        const project1Data: CreateProjectRequest = {
          title: `Source Project ${kind}`,
          start_date: '01-01-2025',
          end_date: '31-01-2025',
          status: 'planned'
        };
        const project1Result = projectService.createProject(project1Data);
        const sourceProject = project1Result.project!;

        const project2Data: CreateProjectRequest = {
          title: `Target Project ${kind}`,
          start_date: '01-02-2025',
          end_date: '28-02-2025',
          status: 'planned'
        };
        const project2Result = projectService.createProject(project2Data);
        const targetProject = project2Result.project!;

        const dependencyData: CreateDependencyRequest = {
          from_type: 'project',
          from_id: sourceProject.id,
          to_type: 'project',
          to_id: targetProject.id,
          kind
        };

        const result = dependencyService.createDependency(dependencyData);
        expect(result.success).toBe(true);
        expect(result.dependency!.kind).toBe(kind);
      });
    });
  });
});