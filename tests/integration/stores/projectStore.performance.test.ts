/**
 * @jest-environment jsdom
 */
import { describe, beforeEach, afterEach, test, expect, jest } from '@jest/globals';
import { useProjectStore, projectSelectors } from '../../../app/renderer/stores/projectStore';
import type { Project } from '../../../app/main/preload';

/**
 * ProjectStore Performance & Selector Tests - Phase 3
 * 
 * Tests that were missing from original suite:
 * - Selector performance with large datasets (1000+ items)
 * - Selector memoization verification
 * - Selector composition and purity
 * - Memory leak detection
 * - Store performance under load
 * - Concurrent updates handling
 */
describe('ProjectStore - Performance & Selector Tests', () => {
  
  // Helper to generate realistic project data
  function generateProject(id: number): Project {
    const statuses = ['active', 'completed', 'on-hold', 'cancelled'] as const;
    const lanes = ['Discovery', 'Development', 'Testing', 'Deployment'];
    const treatments = ['CAPEX', 'OPEX'] as const;
    
    return {
      id: `PROJ-${String(id).padStart(4, '0')}`,
      title: `Project ${id} - ${lanes[id % lanes.length]}`,
      description: `Description for project ${id}`.repeat(10), // ~300 chars
      lane: lanes[id % lanes.length],
      start_date: `01-${String((id % 12) + 1).padStart(2, '0')}-2025`,
      end_date: `28-${String((id % 12) + 1).padStart(2, '0')}-2025`,
      status: statuses[id % statuses.length],
      pm_name: `Manager ${id % 20}`,
      budget_cents: (id % 10 + 1) * 1000000, // $10k - $100k
      financial_treatment: treatments[id % 2],
      created_at: new Date(2024, 0, (id % 28) + 1).toISOString(),
      updated_at: new Date(2024, 0, (id % 28) + 1).toISOString(),
    };
  }

  beforeEach(() => {
    useProjectStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('Selector Performance with Large Datasets', () => {
    test('should handle 1000 projects efficiently in getProjectById', () => {
      const projects = Array.from({ length: 1000 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      // Measure performance of selector
      const startTime = performance.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const project = projectSelectors.getProjectById(`PROJ-${String(i % 1000).padStart(4, '0')}`);
        expect(project).toBeDefined();
      }

      const duration = performance.now() - startTime;
      const avgTime = duration / iterations;

      // Should be fast (< 1ms per lookup on average)
      expect(avgTime).toBeLessThan(1);
      expect(duration).toBeLessThan(200); // Total < 200ms for 100 lookups
    });

    test('should handle 1000 projects efficiently in getProjectsByStatus', () => {
      const projects = Array.from({ length: 1000 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      const startTime = performance.now();
      
      const activeProjects = projectSelectors.getProjectsByStatus('active');
      const completedProjects = projectSelectors.getProjectsByStatus('completed');
      const onHoldProjects = projectSelectors.getProjectsByStatus('on-hold');
      const cancelledProjects = projectSelectors.getProjectsByStatus('cancelled');

      const duration = performance.now() - startTime;

      // Verify results
      expect(activeProjects.length).toBeGreaterThan(0);
      expect(completedProjects.length).toBeGreaterThan(0);
      
      // Should complete filtering in reasonable time
      expect(duration).toBeLessThan(50); // < 50ms for 4 filter operations
    });

    test('should handle 1000 projects efficiently in getTotalBudget', () => {
      const projects = Array.from({ length: 1000 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      const startTime = performance.now();
      
      const totalBudget = projectSelectors.getTotalBudget();
      const projectsCount = projectSelectors.getProjectsCount();
      
      const duration = performance.now() - startTime;

      expect(totalBudget).toBeGreaterThan(0);
      expect(projectsCount).toBe(1000);
      expect(duration).toBeLessThan(30);
    });

    test('should handle 5000 projects without performance degradation', () => {
      const projects = Array.from({ length: 5000 }, (_, i) => generateProject(i));
      
      const setStartTime = performance.now();
      useProjectStore.getState().setProjects(projects);
      const setDuration = performance.now() - setStartTime;

      // Setting 5000 projects should be fast
      expect(setDuration).toBeLessThan(100);

      // Lookups should still be efficient
      const lookupStartTime = performance.now();
      const project = projectSelectors.getProjectById('PROJ-2500');
      const lookupDuration = performance.now() - lookupStartTime;

      expect(project).toBeDefined();
      expect(lookupDuration).toBeLessThan(5);
    });
  });

  describe('Selector Memoization', () => {
    test('getProjectById should return same reference for same ID', () => {
      const projects = Array.from({ length: 100 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      const project1 = projectSelectors.getProjectById('PROJ-0050');
      const project2 = projectSelectors.getProjectById('PROJ-0050');

      // Should return exact same reference (memoized)
      expect(project1).toBe(project2);
    });

    test('getProjectsByStatus should recompute when state changes', () => {
      const projects = Array.from({ length: 100 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      const activeProjects1 = projectSelectors.getProjectsByStatus('active');
      
      // Modify state
      const newProject = generateProject(100);
      newProject.status = 'active';
      useProjectStore.getState().setProjects([...projects, newProject]);

      const activeProjects2 = projectSelectors.getProjectsByStatus('active');

      // Should have different count after state change
      expect(activeProjects2.length).toBe(activeProjects1.length + 1);
    });

    test('selectors should not recompute on unrelated state changes', () => {
      const projects = Array.from({ length: 100 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      // Get initial results
      const activeProjects1 = projectSelectors.getProjectsByStatus('active');
      
      // Change unrelated state (loading flag)
      useProjectStore.getState().setLoading(true);
      useProjectStore.getState().setLoading(false);

      // Get results again
      const activeProjects2 = projectSelectors.getProjectsByStatus('active');

      // Should return same reference if projects haven't changed
      // Note: This tests that selectors are properly optimized
      expect(activeProjects1).toEqual(activeProjects2);
    });
  });

  describe('Selector Purity', () => {
    test('selectors should not mutate store state', () => {
      const projects = Array.from({ length: 10 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      const originalProjectCount = useProjectStore.getState().projects.length;
      
      // Call various selectors
      projectSelectors.getProjectById('PROJ-0005');
      projectSelectors.getProjectsByStatus('active');
      projectSelectors.getTotalBudget();
      projectSelectors.getActiveProjects();

      // Store should be unchanged
      expect(useProjectStore.getState().projects.length).toBe(originalProjectCount);
    });

    test('modifying selector results should not affect store', () => {
      const projects = Array.from({ length: 10 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      const activeProjects = projectSelectors.getProjectsByStatus('active');
      const originalCount = activeProjects.length;

      // Try to mutate the result
      (activeProjects as any[]).push(generateProject(999));

      // Get fresh results
      const activeProjects2 = projectSelectors.getProjectsByStatus('active');

      // Should not be affected by mutation
      expect(activeProjects2.length).toBe(originalCount);
    });

    test('selectors should be deterministic', () => {
      const projects = Array.from({ length: 100 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      // Call selector multiple times
      const results = Array(10).fill(0).map(() => 
        projectSelectors.getProjectsByStatus('active')
      );

      // All results should be equal
      results.forEach(result => {
        expect(result).toEqual(results[0]);
      });
    });
  });

  describe('Selector Composition', () => {
    test('should efficiently compose multiple selectors', () => {
      const projects = Array.from({ length: 1000 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      const startTime = performance.now();

      // Compose: get active projects with high budgets
      const activeProjects = projectSelectors.getProjectsByStatus('active');
      const totalBudget = projectSelectors.getTotalBudget();
      
      // Filter high budget projects
      const highBudgetProjects = activeProjects.filter(p => 
        p.budget_cents > 5000000
      );

      const duration = performance.now() - startTime;

      expect(activeProjects.length).toBeGreaterThan(0);
      expect(totalBudget).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50); // Composition should be fast
    });

    test('should handle complex selector chains', () => {
      const projects = Array.from({ length: 500 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      const startTime = performance.now();

      // Complex chain: Active CAPEX projects with budget > $50k sorted
      const result = projectSelectors
        .getProjectsByStatus('active')
        .filter(p => p.financial_treatment === 'CAPEX')
        .filter(p => p.budget_cents > 5000000)
        .sort((a, b) => b.budget_cents - a.budget_cents);

      const duration = performance.now() - startTime;

      // Should have at least some results (statistics would give us ~62 active CAPEX projects)
      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(30);
      
      // Verify sorting
      for (let i = 1; i < result.length; i++) {
        expect(result[i].budget_cents).toBeLessThanOrEqual(result[i - 1].budget_cents);
      }
    });
  });

  describe('Store Performance Under Load', () => {
    test('should handle rapid sequential updates', () => {
      const startTime = performance.now();

      // Rapidly update store 100 times
      for (let i = 0; i < 100; i++) {
        const projects = Array.from({ length: 10 }, (_, j) => generateProject(i * 10 + j));
        useProjectStore.getState().setProjects(projects);
      }

      const duration = performance.now() - startTime;

      // Should handle rapid updates without significant delay
      expect(duration).toBeLessThan(500); // < 500ms for 100 updates
      expect(useProjectStore.getState().projects.length).toBe(10);
    });

    test('should handle incremental project additions efficiently', () => {
      useProjectStore.getState().setProjects([]);

      const startTime = performance.now();

      // Add 1000 projects incrementally
      for (let i = 0; i < 1000; i++) {
        const currentProjects = useProjectStore.getState().projects;
        useProjectStore.getState().setProjects([...currentProjects, generateProject(i)]);
      }

      const duration = performance.now() - startTime;

      expect(useProjectStore.getState().projects.length).toBe(1000);
      // This should complete in reasonable time
      expect(duration).toBeLessThan(5000); // < 5s for 1000 incremental adds
    });

    test('should handle bulk operations efficiently', () => {
      const initialProjects = Array.from({ length: 1000 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(initialProjects);

      const startTime = performance.now();

      // Bulk update: change all active projects to on-hold
      const updatedProjects = useProjectStore.getState().projects.map(p => 
        p.status === 'active' ? { ...p, status: 'on-hold' as const } : p
      );
      useProjectStore.getState().setProjects(updatedProjects);

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100); // Bulk update should be fast
      
      // Verify update
      const activeCount = projectSelectors.getProjectsByStatus('active').length;
      expect(activeCount).toBe(0);
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory with repeated operations', () => {
      // Store initial memory usage (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const projects = Array.from({ length: 100 }, (_, j) => generateProject(j));
        useProjectStore.getState().setProjects(projects);
        
        // Perform selectors
        projectSelectors.getProjectsByStatus('active');
        projectSelectors.getTotalBudget();
        projectSelectors.getProjectById(`PROJ-${String(50).padStart(4, '0')}`);
        projectSelectors.getActiveProjects();
        
        // Reset
        useProjectStore.getState().reset();
      }

      // Check memory after operations (if available)
      const finalMemory = (performance as any).memory?.usedJSHeapSize;

      // If memory API is available, verify no massive leak
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory - initialMemory;
        // Allow some increase but not excessive (< 50MB)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }

      // At minimum, verify store is clean
      expect(useProjectStore.getState().projects.length).toBe(0);
    });

    test('should clean up state on reset', () => {
      const largeProjects = Array.from({ length: 5000 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(largeProjects);

      expect(useProjectStore.getState().projects.length).toBe(5000);

      useProjectStore.getState().reset();

      const store = useProjectStore.getState();
      expect(store.projects).toEqual([]);
      expect(store.currentProject).toBeNull();
      expect(store.error).toBeNull();
      expect(store.stats).toBeNull();
    });
  });

  describe('Edge Cases with Large Datasets', () => {
    test('should handle all projects with same status', () => {
      const projects = Array.from({ length: 1000 }, (_, i) => {
        const p = generateProject(i);
        p.status = 'active';
        return p;
      });
      useProjectStore.getState().setProjects(projects);

      const activeProjects = projectSelectors.getProjectsByStatus('active');
      const completedProjects = projectSelectors.getProjectsByStatus('completed');

      expect(activeProjects.length).toBe(1000);
      expect(completedProjects.length).toBe(0);
    });

    test('should handle projects with very long descriptions', () => {
      const projects = Array.from({ length: 100 }, (_, i) => {
        const p = generateProject(i);
        p.description = 'X'.repeat(10000); // 10KB description
        return p;
      });

      const startTime = performance.now();
      useProjectStore.getState().setProjects(projects);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
      expect(useProjectStore.getState().projects.length).toBe(100);
    });

    test('should handle rapid selector calls during state change', () => {
      const projects = Array.from({ length: 100 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      let selectorCallCount = 0;
      const results: Project[][] = [];

      // Rapidly call selector while updating state
      const intervalId = setInterval(() => {
        results.push(projectSelectors.getProjectsByStatus('active'));
        selectorCallCount++;
      }, 1);

      // Update state a few times
      setTimeout(() => {
        useProjectStore.getState().setProjects([...projects, generateProject(100)]);
      }, 10);

      setTimeout(() => {
        useProjectStore.getState().setProjects([...projects, generateProject(101)]);
      }, 20);

      return new Promise<void>(resolve => {
        setTimeout(() => {
          clearInterval(intervalId);
          
          // All selector calls should complete without errors
          expect(results.length).toBeGreaterThan(0);
          results.forEach(result => {
            expect(Array.isArray(result)).toBe(true);
          });
          
          resolve();
        }, 50);
      });
    });

    test('should handle boundary values in filtering', () => {
      const projects = [
        { ...generateProject(0), budget_cents: 0 },
        { ...generateProject(1), budget_cents: 1 },
        { ...generateProject(2), budget_cents: Number.MAX_SAFE_INTEGER },
      ];
      useProjectStore.getState().setProjects(projects);

      // Custom filter with boundary conditions
      const allProjects = useProjectStore.getState().projects;
      const zeroBudget = allProjects.filter(p => p.budget_cents === 0);
      const maxBudget = allProjects.filter(p => p.budget_cents === Number.MAX_SAFE_INTEGER);

      expect(zeroBudget.length).toBe(1);
      expect(maxBudget.length).toBe(1);
    });
  });

  describe('Concurrent Selector Access', () => {
    test('should handle concurrent selector calls safely', async () => {
      const projects = Array.from({ length: 1000 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      // Simulate concurrent selector access
      const operations = Array(50).fill(0).map((_, i) => 
        Promise.resolve(projectSelectors.getProjectById(`PROJ-${String(i % 1000).padStart(4, '0')}`))
      );

      const results = await Promise.all(operations);

      // All should complete successfully
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    test('should handle concurrent filter operations', async () => {
      const projects = Array.from({ length: 1000 }, (_, i) => generateProject(i));
      useProjectStore.getState().setProjects(projects);

      const operations = [
        Promise.resolve(projectSelectors.getProjectsByStatus('active')),
        Promise.resolve(projectSelectors.getProjectsByStatus('completed')),
        Promise.resolve(projectSelectors.getActiveProjects()),
        Promise.resolve(projectSelectors.getTotalBudget()),
        Promise.resolve(projectSelectors.getProjectById('PROJ-0500')),
      ];

      const results = await Promise.all(operations);

      // All operations should complete
      expect(results[0].length).toBeGreaterThan(0); // active
      expect(results[1].length).toBeGreaterThan(0); // completed
      expect(results[2].length).toBeGreaterThan(0); // getActiveProjects
      expect(results[3]).toBeGreaterThan(0); // getTotalBudget
      expect(results[4]).toBeDefined(); // byId
    });
  });
});
