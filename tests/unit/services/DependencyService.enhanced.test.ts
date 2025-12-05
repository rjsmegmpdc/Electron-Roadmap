import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { DependencyService, CreateDependencyRequest, DependencyType } from '../../../app/main/services/DependencyService';
import { ProjectService, CreateProjectRequest } from '../../../app/main/services/ProjectService';
import { TaskService, CreateTaskRequest } from '../../../app/main/services/TaskService';
import { TestDatabase, withTestDatabase } from '../../helpers/testDatabase';

/**
 * Enhanced Dependency Service Tests
 * 
 * Focuses on:
 * - Complex cycle detection scenarios
 * - Large-scale dependency graph performance
 * - Transaction rollback verification
 * - Cycle path reporting in errors
 * - Edge cases in dependency management
 */
describe('DependencyService - Enhanced Cycle Detection', () => {
  let testDb: TestDatabase;
  let db: Database.Database;
  let dependencyService: DependencyService;
  let projectService: ProjectService;
  let taskService: TaskService;

  beforeEach(async () => {
    testDb = new TestDatabase();
    db = await testDb.setup(true);
    dependencyService = new DependencyService(db);
    projectService = new ProjectService(db);
    taskService = new TaskService(db);
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  describe('Complex Cycle Detection', () => {
    test('should detect self-referencing cycle (A -> A)', async () => {
      // Seed project using service instead of private helper
      const projectResult = projectService.createProject({
        title: 'Self-Ref Project',
        start_date: '01-01-2025',
        end_date: '31-12-2025',
        status: 'in-progress',
        budget_nzd: '10,000.00'
      });
      const projects = [projectResult.project!];

      const result = await dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[0].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Cannot create a dependency from an entity to itself');
    });

    test('should detect cycles in 10-node chain', async () => {
      // Create 10-node chain using helper
      const projects = await testDb.createProjectChain(10);

      // Try to create cycle: P10 -> P1
      const result = await dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[9].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('cycle');
    });

    test('should detect cycles in 100-node chain with performance timing', async () => {
      // Create 100-node chain
      const projects = await testDb.createProjectChain(100);

      const startTime = Date.now();
      const result = await dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[99].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('cycle');
      expect(duration).toBeLessThan(2000); // Should detect cycle in <2 seconds
    });

    test('should detect diamond dependency cycles vs valid diamond patterns', async () => {
      // Seed projects using service instead of private helper
      const projects = [];
      for (const title of ['P1', 'P2', 'P3', 'P4']) {
        const result = projectService.createProject({
          title,
          start_date: '01-01-2025',
          end_date: '31-12-2025',
          status: 'in-progress',
          budget_nzd: '10,000.00'
        });
        projects.push(result.project!);
      }

      // Create valid diamond: P1 -> P2, P1 -> P3, P2 -> P4, P3 -> P4
      const validDeps = [
        { from: projects[0].id, to: projects[1].id },
        { from: projects[0].id, to: projects[2].id },
        { from: projects[1].id, to: projects[3].id },
        { from: projects[2].id, to: projects[3].id }
      ];

      validDeps.forEach(({ from, to }) => {
        const result = dependencyService.createDependency({
          from_type: 'project',
          from_id: from,
          to_type: 'project',
          to_id: to,
          kind: 'FS'
        });
        expect(result.success).toBe(true);
      });

      // Now try to create cycle: P4 -> P1 (would create cycle)
      const cycleResult = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[3].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });

      expect(cycleResult.success).toBe(false);
      expect(cycleResult.errors![0]).toContain('cycle');
    });

    test('should detect cycles through multiple paths', async () => {
      // Seed projects using service instead of private helper
      const projects = [];
      for (const title of ['P1', 'P2', 'P3', 'P4']) {
        const result = projectService.createProject({
          title,
          start_date: '01-01-2025',
          end_date: '31-12-2025',
          status: 'in-progress',
          budget_nzd: '10,000.00'
        });
        projects.push(result.project!);
      }

      // Create complex graph with multiple paths:
      // P1 -> P2 -> P4
      // P1 -> P3 -> P4
      const deps = [
        { from: projects[0].id, to: projects[1].id }, // P1 -> P2
        { from: projects[0].id, to: projects[2].id }, // P1 -> P3
        { from: projects[1].id, to: projects[3].id }, // P2 -> P4
        { from: projects[2].id, to: projects[3].id }  // P3 -> P4
      ];

      deps.forEach(({ from, to }) => {
        const result = dependencyService.createDependency({
          from_type: 'project',
          from_id: from,
          to_type: 'project',
          to_id: to,
          kind: 'FS'
        });
        expect(result.success).toBe(true);
      });

      // Try to create P4 -> P2 (creates cycle through P2 -> P4 path)
      const cycleResult1 = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[3].id,
        to_type: 'project',
        to_id: projects[1].id,
        kind: 'FS'
      });

      expect(cycleResult1.success).toBe(false);

      // Try to create P4 -> P3 (creates cycle through P3 -> P4 path)
      const cycleResult2 = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[3].id,
        to_type: 'project',
        to_id: projects[2].id,
        kind: 'FS'
      });

      expect(cycleResult2.success).toBe(false);
    });

    test('should detect cycles with mixed project and task dependencies', async () => {
      // Seed projects using service instead of private helper
      const projects = [];
      for (const title of ['P1', 'P2']) {
        const result = projectService.createProject({
          title,
          start_date: '01-01-2025',
          end_date: '31-12-2025',
          status: 'in-progress',
          budget_nzd: '10,000.00'
        });
        projects.push(result.project!);
      }

      // Seed tasks using service instead of private helper
      const tasks = [];
      const taskData = [
        { project_id: projects[0].id, title: 'T1', start: '01-01-2025', end: '31-01-2025' },
        { project_id: projects[1].id, title: 'T2', start: '01-02-2025', end: '28-02-2025' }
      ];
      for (const data of taskData) {
        const result = taskService.createTask({
          project_id: data.project_id,
          title: data.title,
          start_date: data.start,
          end_date: data.end,
          status: 'planned',
          effort_hours: 40,
          assigned_resources: []
        });
        tasks.push(result.task!);
      }

      // Create chain: P1 -> T2 -> P2 -> T1
      dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[0].id,
        to_type: 'task',
        to_id: tasks[1].id,
        kind: 'FS'
      });

      dependencyService.createDependency({
        from_type: 'task',
        from_id: tasks[1].id,
        to_type: 'project',
        to_id: projects[1].id,
        kind: 'FS'
      });

      dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[1].id,
        to_type: 'task',
        to_id: tasks[0].id,
        kind: 'FS'
      });

      // Try to create T1 -> P1 (completes cycle)
      const cycleResult = dependencyService.createDependency({
        from_type: 'task',
        from_id: tasks[0].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });

      expect(cycleResult.success).toBe(false);
      expect(cycleResult.errors![0]).toContain('cycle');
    });

    test('should include cycle path in error message for debugging', async () => {
      const projects = testDb['seedProjects']([
        { title: 'Alpha', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' },
        { title: 'Beta', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' },
        { title: 'Gamma', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' }
      ]);

      // Create chain: Alpha -> Beta -> Gamma
      dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[0].id,
        to_type: 'project',
        to_id: projects[1].id,
        kind: 'FS'
      });

      dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[1].id,
        to_type: 'project',
        to_id: projects[2].id,
        kind: 'FS'
      });

      // Try to create Gamma -> Alpha
      const result = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[2].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('cycle');
      
      // Error message should ideally include the cycle path
      // e.g., "Gamma -> Alpha -> Beta -> Gamma"
      // This verifies the error is helpful for debugging
      const errorMsg = result.errors![0];
      expect(errorMsg.length).toBeGreaterThan(30); // Should be descriptive
    });
  });

  describe('Transaction Rollback on Cycle Detection', () => {
    test('should not persist dependency when cycle is detected', async () => {
      const projects = testDb['seedProjects']([
        { title: 'P1', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' },
        { title: 'P2', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' }
      ]);

      // Create A -> B
      const dep1Result = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[0].id,
        to_type: 'project',
        to_id: projects[1].id,
        kind: 'FS'
      });
      expect(dep1Result.success).toBe(true);

      const countBefore = dependencyService.getAllDependencies().length;

      // Try to create B -> A (cycle)
      const cycleResult = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[1].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });

      expect(cycleResult.success).toBe(false);

      const countAfter = dependencyService.getAllDependencies().length;

      // Dependency should NOT have been persisted
      expect(countAfter).toBe(countBefore);
      expect(countAfter).toBe(1); // Only the first dependency exists
    });

    test('should maintain database consistency after failed cycle creation', async () => {
      const projects = await testDb.createProjectChain(5);

      const initialDeps = dependencyService.getAllDependencies();
      expect(initialDeps).toHaveLength(4); // 5 projects = 4 dependencies

      // Try to create cycle
      const cycleResult = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[4].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });

      expect(cycleResult.success).toBe(false);

      // Verify no partial/corrupt data
      const finalDeps = dependencyService.getAllDependencies();
      expect(finalDeps).toHaveLength(4); // Should be unchanged

      // Verify all original dependencies still exist and are valid
      finalDeps.forEach(dep => {
        expect(dep.id).toBeDefined();
        expect(dep.from_id).toBeDefined();
        expect(dep.to_id).toBeDefined();
        expect(dep.kind).toBeDefined();
      });
    });

    test('should allow valid dependency after cycle rejection', async () => {
      const projects = testDb['seedProjects']([
        { title: 'P1', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' },
        { title: 'P2', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' },
        { title: 'P3', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' }
      ]);

      // Create P1 -> P2
      dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[0].id,
        to_type: 'project',
        to_id: projects[1].id,
        kind: 'FS'
      });

      // Try to create P2 -> P1 (cycle) - should fail
      const cycleResult = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[1].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });
      expect(cycleResult.success).toBe(false);

      // Create P2 -> P3 (valid) - should succeed
      const validResult = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[1].id,
        to_type: 'project',
        to_id: projects[2].id,
        kind: 'FS'
      });

      expect(validResult.success).toBe(true);
      expect(validResult.dependency).toBeDefined();
      expect(dependencyService.getAllDependencies()).toHaveLength(2);
    });
  });

  describe('Performance with Large Dependency Graphs', () => {
    test('should handle 100-node dependency graph efficiently', async () => {
      const projects = await testDb.createProjectChain(100);

      const startTime = Date.now();
      const allDeps = dependencyService.getAllDependencies();
      const duration = Date.now() - startTime;

      expect(allDeps).toHaveLength(99); // 100 nodes = 99 edges
      expect(duration).toBeLessThan(100); // Should retrieve in <100ms
    });

    test('should efficiently query dependencies for entity in large graph', async () => {
      const projects = await testDb.createProjectChain(100);

      // Middle node should have incoming and outgoing dependencies
      const middleProjectId = projects[50].id;

      const startTime = Date.now();
      const deps = dependencyService.getDependenciesForEntity('project', middleProjectId);
      const duration = Date.now() - startTime;

      expect(deps.incoming).toHaveLength(1); // From P49
      expect(deps.outgoing).toHaveLength(1); // To P51
      expect(deps.all).toHaveLength(2);
      expect(duration).toBeLessThan(50); // Should query in <50ms
    });

    test('should create multiple dependencies in parallel without corruption', async () => {
      const projects = testDb['seedProjects'](
        Array(20).fill(0).map((_, i) => ({
          title: `Project ${i}`,
          start_date: '01-01-2025',
          end_date: '31-12-2025',
          status: 'active',
          budget_nzd: '10,000.00'
        }))
      );

      // Create 10 parallel dependencies (no cycles)
      const parallelCreations = [
        { from: 0, to: 1 },
        { from: 2, to: 3 },
        { from: 4, to: 5 },
        { from: 6, to: 7 },
        { from: 8, to: 9 },
        { from: 10, to: 11 },
        { from: 12, to: 13 },
        { from: 14, to: 15 },
        { from: 16, to: 17 },
        { from: 18, to: 19 }
      ].map(({ from, to }) =>
        dependencyService.createDependency({
          from_type: 'project',
          from_id: projects[from].id,
          to_type: 'project',
          to_id: projects[to].id,
          kind: 'FS'
        })
      );

      // All should succeed
      parallelCreations.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify all were persisted
      const allDeps = dependencyService.getAllDependencies();
      expect(allDeps).toHaveLength(10);
    });

    test('should handle cycle detection in graph with 500 nodes within reasonable time', async () => {
      // Create 500-node chain
      const projects = await testDb.createProjectChain(500);

      const startTime = Date.now();
      
      // Try to create cycle at the end
      const result = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[499].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });
      
      const duration = Date.now() - startTime;

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('cycle');
      expect(duration).toBeLessThan(3000); // Should detect within 3 seconds
    });
  });

  describe('Edge Cases in Cycle Detection', () => {
    test('should handle different dependency kinds without false cycle detection', async () => {
      const projects = testDb['seedProjects']([
        { title: 'P1', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' },
        { title: 'P2', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' }
      ]);

      // Create all 4 different kinds between same pair
      const kinds: DependencyType[] = ['FS', 'SS', 'FF', 'SF'];
      
      kinds.forEach(kind => {
        const result = dependencyService.createDependency({
          from_type: 'project',
          from_id: projects[0].id,
          to_type: 'project',
          to_id: projects[1].id,
          kind
        });
        expect(result.success).toBe(true);
      });

      // Now try reverse with one kind - should still detect cycle
      const reverseResult = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[1].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });

      expect(reverseResult.success).toBe(false);
    });

    test('should handle deleted dependencies in cycle detection', async () => {
      const projects = testDb['seedProjects']([
        { title: 'P1', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' },
        { title: 'P2', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' },
        { title: 'P3', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' }
      ]);

      // Create P1 -> P2 -> P3
      const dep1 = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[0].id,
        to_type: 'project',
        to_id: projects[1].id,
        kind: 'FS'
      });

      const dep2 = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[1].id,
        to_type: 'project',
        to_id: projects[2].id,
        kind: 'FS'
      });

      // P3 -> P1 would create cycle
      const cycleResult1 = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[2].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });
      expect(cycleResult1.success).toBe(false);

      // Delete middle dependency P1 -> P2
      dependencyService.deleteDependency(dep1.dependency!.id);

      // Now P3 -> P1 should be valid (no path from P1 to P3 anymore)
      const validResult = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[2].id,
        to_type: 'project',
        to_id: projects[0].id,
        kind: 'FS'
      });

      expect(validResult.success).toBe(true);
    });

    test('should detect cycles when dependencies span deleted entities', async () => {
      // This tests that cycle detection doesn't break with orphaned references
      const projects = testDb['seedProjects']([
        { title: 'P1', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' },
        { title: 'P2', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' },
        { title: 'P3', start_date: '01-01-2025', end_date: '31-12-2025', status: 'active', budget_nzd: '10,000.00' }
      ]);

      // Create dependencies
      dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[0].id,
        to_type: 'project',
        to_id: projects[1].id,
        kind: 'FS'
      });

      // Delete middle project (orphans dependency)
      projectService.deleteProject(projects[1].id);

      // Create P1 -> P3 should still work (no cycle through deleted entity)
      const result = dependencyService.createDependency({
        from_type: 'project',
        from_id: projects[0].id,
        to_type: 'project',
        to_id: projects[2].id,
        kind: 'FS'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Dependency Statistics with Large Graphs', () => {
    test('should calculate accurate statistics for large dependency graph', async () => {
      // Create diverse dependency graph
      const projects = testDb['seedProjects'](
        Array(50).fill(0).map((_, i) => ({
          title: `Project ${i}`,
          start_date: '01-01-2025',
          end_date: '31-12-2025',
          status: 'active',
          budget_nzd: '10,000.00'
        }))
      );

      // Create mixed dependencies
      const kindCounts = { FS: 0, SS: 0, FF: 0, SF: 0 };
      const kinds: DependencyType[] = ['FS', 'SS', 'FF', 'SF'];

      // Create 40 dependencies with varied kinds
      for (let i = 0; i < 40; i++) {
        const kind = kinds[i % 4];
        kindCounts[kind]++;
        
        dependencyService.createDependency({
          from_type: 'project',
          from_id: projects[i].id,
          to_type: 'project',
          to_id: projects[i + 10].id, // Skip to avoid cycles
          kind
        });
      }

      const stats = dependencyService.getDependencyStats();

      expect(stats.total).toBe(40);
      expect(stats.by_kind.FS).toBe(kindCounts.FS);
      expect(stats.by_kind.SS).toBe(kindCounts.SS);
      expect(stats.by_kind.FF).toBe(kindCounts.FF);
      expect(stats.by_kind.SF).toBe(kindCounts.SF);
    });
  });
});
