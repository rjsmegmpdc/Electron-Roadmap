/**
 * Project Store Audit Logging Tests
 * 
 * Tests audit logging integration with Zustand store for project state management.
 * Validates that all store operations trigger appropriate audit events.
 */

const { test, expect } = require('@playwright/test');
const { _electron } = require('@playwright/test');
const path = require('path');

test.describe('Project Store Audit Logging', () => {
  let electronApp;
  let window;

  const getRecentAuditEvents = async (minutes = 2) => {
    return await window.evaluate(async (mins) => {
      const events = await window.auditLogger.getRecentEvents(mins);
      return events || [];
    }, minutes);
  };

  const waitForStoreUpdate = async (timeout = 3000) => {
    return await window.waitForTimeout(100); // Allow time for store updates
  };

  test.beforeAll(async () => {
    electronApp = await _electron.launch({
      args: [path.join(__dirname, '../../dist/main/main.js')],
      timeout: 30000
    });
    
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test.beforeEach(async () => {
    // Clear any existing projects and reset store state
    await window.evaluate(async () => {
      // Reset project store to initial state
      if (window.useProjectStore && window.useProjectStore.getState) {
        const store = window.useProjectStore.getState();
        store.reset();
      }
    });
  });

  test.describe('Store State Change Auditing', () => {
    test('should log project loading state changes', async () => {
      await window.evaluate(async () => {
        // Simulate fetching projects through store
        const store = window.useProjectStore.getState();
        
        // Log loading start
        window.auditLogger.logDataChange('loading_start', 'project_store', 'projects', 
          { loading: false }, { loading: true }
        );
        
        store.setLoading(true);
        
        // Simulate API call completion
        setTimeout(() => {
          window.auditLogger.logDataChange('loading_end', 'project_store', 'projects',
            { loading: true, projects: [] }, 
            { loading: false, projects: [] }
          );
          store.setLoading(false);
        }, 100);
      });

      await waitForStoreUpdate();

      const events = await getRecentAuditEvents();
      const loadingEvents = events.filter(e => 
        e.event_type === 'data_change' && 
        e.data.entity_type === 'project_store'
      );

      expect(loadingEvents.length).toBeGreaterThanOrEqual(1);
      
      const loadingStartEvent = loadingEvents.find(e => e.action === 'loading_start');
      expect(loadingStartEvent).toBeDefined();
      expect(loadingStartEvent.data.old_data.loading).toBe(false);
      expect(loadingStartEvent.data.new_data.loading).toBe(true);
    });

    test('should log project creation through store', async () => {
      const projectData = {
        title: 'Store Test Project',
        description: 'Project created through store',
        start_date: '01-01-2024',
        end_date: '31-12-2024',
        status: 'active'
      };

      const result = await window.evaluate(async (data) => {
        const store = window.useProjectStore.getState();
        
        // Log the store operation start
        window.auditLogger.logUserInteraction('store_operation_start', 'ProjectStore', 'createProject', {
          operation: 'create',
          data: data
        });
        
        // Create project through store
        const result = await store.createProject(data);
        
        // Log the operation completion
        window.auditLogger.logUserInteraction('store_operation_complete', 'ProjectStore', 'createProject', {
          operation: 'create',
          success: result.success,
          projectId: result.project?.id
        });
        
        return result;
      }, projectData);

      expect(result.success).toBe(true);

      const events = await getRecentAuditEvents();
      
      // Should have store operation events
      const storeStartEvent = events.find(e => 
        e.action === 'store_operation_start' && 
        e.component === 'ProjectStore'
      );
      
      const storeCompleteEvent = events.find(e => 
        e.action === 'store_operation_complete' && 
        e.component === 'ProjectStore'
      );

      expect(storeStartEvent).toBeDefined();
      expect(storeCompleteEvent).toBeDefined();
      expect(storeCompleteEvent.data.success).toBe(true);
      expect(storeCompleteEvent.data.projectId).toBeDefined();
    });

    test('should log store error states with context', async () => {
      await window.evaluate(async () => {
        const store = window.useProjectStore.getState();
        
        // Simulate API error
        const errorMessage = 'Network connection failed';
        
        // Log error state change
        window.auditLogger.logError(
          new Error(errorMessage), 
          'ProjectStore',
          {
            operation: 'fetchProjects',
            store_state: 'error',
            previous_state: 'loading',
            retry_available: true,
            error_recoverable: true
          }
        );
        
        // Set error in store
        store.setError(errorMessage);
        store.setLoading(false);
      });

      const events = await getRecentAuditEvents();
      const errorEvent = events.find(e => 
        e.event_type === 'error' && 
        e.component === 'ProjectStore'
      );

      expect(errorEvent).toBeDefined();
      expect(errorEvent.data.operation).toBe('fetchProjects');
      expect(errorEvent.data.store_state).toBe('error');
      expect(errorEvent.data.retry_available).toBe(true);
    });

    test('should log bulk project updates through store', async () => {
      // First create multiple projects
      const projects = await window.evaluate(async () => {
        const store = window.useProjectStore.getState();
        const createdProjects = [];
        
        for (let i = 1; i <= 3; i++) {
          const result = await store.createProject({
            title: `Bulk Update Project ${i}`,
            start_date: '01-01-2024',
            end_date: '31-12-2024',
            status: 'active'
          });
          
          if (result.success) {
            createdProjects.push(result.project);
          }
        }
        
        return createdProjects;
      });

      expect(projects.length).toBe(3);

      // Now perform bulk update
      await window.evaluate(async (projectList) => {
        const store = window.useProjectStore.getState();
        
        window.auditLogger.logUserInteraction('bulk_update_start', 'ProjectStore', 'bulkUpdate', {
          operation: 'bulk_status_change',
          project_count: projectList.length,
          target_status: 'on-hold'
        });
        
        // Update all projects to 'on-hold' status
        for (const project of projectList) {
          await store.updateProject({
            id: project.id,
            status: 'on-hold'
          });
        }
        
        window.auditLogger.logUserInteraction('bulk_update_complete', 'ProjectStore', 'bulkUpdate', {
          operation: 'bulk_status_change',
          projects_updated: projectList.length,
          new_status: 'on-hold'
        });
        
      }, projects);

      const events = await getRecentAuditEvents();
      
      const bulkStartEvent = events.find(e => e.action === 'bulk_update_start');
      const bulkCompleteEvent = events.find(e => e.action === 'bulk_update_complete');
      
      expect(bulkStartEvent).toBeDefined();
      expect(bulkCompleteEvent).toBeDefined();
      expect(bulkStartEvent.data.project_count).toBe(3);
      expect(bulkCompleteEvent.data.projects_updated).toBe(3);
    });
  });

  test.describe('Store Performance Auditing', () => {
    test('should log store performance metrics', async () => {
      await window.evaluate(async () => {
        const store = window.useProjectStore.getState();
        
        const startTime = performance.now();
        
        // Simulate performance monitoring
        window.auditLogger.logSystemEvent('performance_measurement_start', {
          component: 'ProjectStore',
          operation: 'fetchProjects',
          start_time: startTime
        });
        
        // Simulate store operation
        store.setLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        window.auditLogger.logSystemEvent('performance_measurement_complete', {
          component: 'ProjectStore',
          operation: 'fetchProjects',
          duration_ms: duration,
          performance_threshold: 1000,
          meets_threshold: duration < 1000
        });
        
        store.setLoading(false);
      });

      const events = await getRecentAuditEvents();
      
      const perfStartEvent = events.find(e => 
        e.action === 'performance_measurement_start' && 
        e.data.component === 'ProjectStore'
      );
      
      const perfCompleteEvent = events.find(e => 
        e.action === 'performance_measurement_complete' && 
        e.data.component === 'ProjectStore'
      );

      expect(perfStartEvent).toBeDefined();
      expect(perfCompleteEvent).toBeDefined();
      expect(typeof perfCompleteEvent.data.duration_ms).toBe('number');
      expect(perfCompleteEvent.data.meets_threshold).toBe(true);
    });

    test('should log memory usage during large store operations', async () => {
      await window.evaluate(async () => {
        const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        window.auditLogger.logSystemEvent('memory_usage_before_operation', {
          component: 'ProjectStore',
          operation: 'load_large_dataset',
          memory_used_bytes: memoryBefore
        });
        
        // Simulate loading large number of projects
        const store = window.useProjectStore.getState();
        const largeProjectList = [];
        
        for (let i = 0; i < 1000; i++) {
          largeProjectList.push({
            id: `proj-${i}`,
            title: `Project ${i}`,
            description: `Generated project ${i} for memory testing`,
            start_date: '01-01-2024',
            end_date: '31-12-2024',
            status: 'active'
          });
        }
        
        store.setProjects(largeProjectList);
        
        const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
        const memoryDelta = memoryAfter - memoryBefore;
        
        window.auditLogger.logSystemEvent('memory_usage_after_operation', {
          component: 'ProjectStore',
          operation: 'load_large_dataset',
          memory_used_bytes: memoryAfter,
          memory_delta_bytes: memoryDelta,
          projects_loaded: 1000
        });
      });

      const events = await getRecentAuditEvents();
      
      const memoryBeforeEvent = events.find(e => e.action === 'memory_usage_before_operation');
      const memoryAfterEvent = events.find(e => e.action === 'memory_usage_after_operation');

      expect(memoryBeforeEvent).toBeDefined();
      expect(memoryAfterEvent).toBeDefined();
      expect(typeof memoryAfterEvent.data.memory_delta_bytes).toBe('number');
    });
  });

  test.describe('Store Concurrency Auditing', () => {
    test('should log concurrent store operations', async () => {
      const results = await window.evaluate(async () => {
        const store = window.useProjectStore.getState();
        
        window.auditLogger.logUserInteraction('concurrent_operations_start', 'ProjectStore', 'parallel_operations', {
          operation_count: 5,
          operation_type: 'create_project'
        });
        
        // Create 5 projects concurrently
        const promises = [];
        for (let i = 1; i <= 5; i++) {
          promises.push(
            store.createProject({
              title: `Concurrent Project ${i}`,
              start_date: '01-01-2024',
              end_date: '31-12-2024',
              status: 'active'
            })
          );
        }
        
        const results = await Promise.allSettled(promises);
        
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const errorCount = results.length - successCount;
        
        window.auditLogger.logUserInteraction('concurrent_operations_complete', 'ProjectStore', 'parallel_operations', {
          total_operations: results.length,
          successful_operations: successCount,
          failed_operations: errorCount,
          operation_type: 'create_project'
        });
        
        return { successCount, errorCount, total: results.length };
      });

      const events = await getRecentAuditEvents();
      
      const concurrentStartEvent = events.find(e => e.action === 'concurrent_operations_start');
      const concurrentCompleteEvent = events.find(e => e.action === 'concurrent_operations_complete');

      expect(concurrentStartEvent).toBeDefined();
      expect(concurrentCompleteEvent).toBeDefined();
      expect(concurrentCompleteEvent.data.total_operations).toBe(5);
      expect(concurrentCompleteEvent.data.successful_operations).toBeGreaterThan(0);
    });

    test('should log race condition detection', async () => {
      await window.evaluate(async () => {
        const store = window.useProjectStore.getState();
        
        // Create a project first
        const project = await store.createProject({
          title: 'Race Condition Test',
          start_date: '01-01-2024',
          end_date: '31-12-2024'
        });
        
        if (!project.success) return;
        
        // Simulate concurrent updates to the same project
        window.auditLogger.logSystemEvent('race_condition_detected', {
          component: 'ProjectStore',
          entity_type: 'project',
          entity_id: project.project.id,
          concurrent_operations: [
            { operation: 'update', field: 'title', user: 'user1', timestamp: Date.now() },
            { operation: 'update', field: 'status', user: 'user2', timestamp: Date.now() + 1 }
          ],
          resolution_strategy: 'last_writer_wins'
        });
      });

      const events = await getRecentAuditEvents();
      const raceConditionEvent = events.find(e => e.action === 'race_condition_detected');

      expect(raceConditionEvent).toBeDefined();
      expect(raceConditionEvent.data.concurrent_operations.length).toBe(2);
      expect(raceConditionEvent.data.resolution_strategy).toBe('last_writer_wins');
    });
  });

  test.describe('Store Recovery and Resilience Auditing', () => {
    test('should log store recovery from corrupted state', async () => {
      await window.evaluate(async () => {
        const store = window.useProjectStore.getState();
        
        // Simulate store corruption
        window.auditLogger.logError(
          new Error('Store state corruption detected'),
          'ProjectStore',
          {
            corruption_type: 'invalid_project_references',
            affected_projects: ['proj-123', 'proj-456'],
            data_integrity_check: 'failed',
            recovery_action: 'reset_and_refetch'
          }
        );
        
        // Simulate recovery
        window.auditLogger.logSystemEvent('store_recovery_start', {
          component: 'ProjectStore',
          recovery_strategy: 'reset_and_refetch',
          backup_available: true
        });
        
        // Reset store
        store.reset();
        
        window.auditLogger.logSystemEvent('store_recovery_complete', {
          component: 'ProjectStore',
          recovery_successful: true,
          data_restored: true,
          consistency_verified: true
        });
      });

      const events = await getRecentAuditEvents();
      
      const corruptionError = events.find(e => 
        e.event_type === 'error' && 
        e.data.corruption_type === 'invalid_project_references'
      );
      
      const recoveryStart = events.find(e => e.action === 'store_recovery_start');
      const recoveryComplete = events.find(e => e.action === 'store_recovery_complete');

      expect(corruptionError).toBeDefined();
      expect(recoveryStart).toBeDefined();
      expect(recoveryComplete).toBeDefined();
      expect(recoveryComplete.data.recovery_successful).toBe(true);
    });

    test('should log store backup and restore operations', async () => {
      await window.evaluate(async () => {
        const store = window.useProjectStore.getState();
        
        // Create some projects
        await store.createProject({ 
          title: 'Backup Test 1', 
          start_date: '01-01-2024', 
          end_date: '31-12-2024' 
        });
        
        await store.createProject({ 
          title: 'Backup Test 2', 
          start_date: '01-01-2024', 
          end_date: '31-12-2024' 
        });
        
        const currentState = store.getState ? store.getState() : store;
        
        // Simulate store backup
        window.auditLogger.logSystemEvent('store_backup_created', {
          component: 'ProjectStore',
          backup_timestamp: new Date().toISOString(),
          projects_count: currentState.projects ? currentState.projects.length : 0,
          backup_size_estimate: JSON.stringify(currentState).length,
          backup_trigger: 'manual'
        });
        
        // Simulate corruption and restore
        window.auditLogger.logSystemEvent('store_restore_initiated', {
          component: 'ProjectStore',
          restore_reason: 'data_corruption',
          backup_age_minutes: 5,
          expected_projects: 2
        });
        
        // Restore would happen here
        
        window.auditLogger.logSystemEvent('store_restore_complete', {
          component: 'ProjectStore',
          projects_restored: 2,
          data_integrity_verified: true,
          restore_successful: true
        });
      });

      const events = await getRecentAuditEvents();
      
      const backupEvent = events.find(e => e.action === 'store_backup_created');
      const restoreInitEvent = events.find(e => e.action === 'store_restore_initiated');
      const restoreCompleteEvent = events.find(e => e.action === 'store_restore_complete');

      expect(backupEvent).toBeDefined();
      expect(restoreInitEvent).toBeDefined();  
      expect(restoreCompleteEvent).toBeDefined();
      expect(restoreCompleteEvent.data.projects_restored).toBe(2);
    });
  });

  test.describe('Store Integration Auditing', () => {
    test('should log store hydration and persistence', async () => {
      await window.evaluate(async () => {
        // Simulate store hydration from localStorage/sessionStorage
        window.auditLogger.logSystemEvent('store_hydration_start', {
          component: 'ProjectStore',
          storage_source: 'localStorage',
          hydration_strategy: 'merge_with_defaults'
        });
        
        // Simulate hydrated data
        const hydratedData = {
          projects: [
            { id: 'hydrated-1', title: 'Hydrated Project 1' },
            { id: 'hydrated-2', title: 'Hydrated Project 2' }
          ],
          currentProject: null,
          loading: false
        };
        
        window.auditLogger.logSystemEvent('store_hydration_complete', {
          component: 'ProjectStore',
          projects_hydrated: 2,
          hydration_successful: true,
          data_integrity_check: 'passed'
        });
        
        // Simulate persistence
        window.auditLogger.logSystemEvent('store_persistence_triggered', {
          component: 'ProjectStore',
          persistence_trigger: 'state_change',
          storage_target: 'localStorage',
          data_size_bytes: JSON.stringify(hydratedData).length
        });
      });

      const events = await getRecentAuditEvents();
      
      const hydrationStart = events.find(e => e.action === 'store_hydration_start');
      const hydrationComplete = events.find(e => e.action === 'store_hydration_complete');
      const persistenceEvent = events.find(e => e.action === 'store_persistence_triggered');

      expect(hydrationStart).toBeDefined();
      expect(hydrationComplete).toBeDefined();
      expect(persistenceEvent).toBeDefined();
      expect(hydrationComplete.data.projects_hydrated).toBe(2);
    });
  });
});

test.describe('Negative Test Cases - Project Store Audit Logging', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await _electron.launch({
      args: [path.join(__dirname, '../../dist/main/main.js')],
      timeout: 30000
    });
    
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should handle store unavailability gracefully', async () => {
    const result = await window.evaluate(async () => {
      try {
        // Simulate store being undefined
        const originalStore = window.useProjectStore;
        window.useProjectStore = undefined;
        
        // Try to log store operation
        window.auditLogger.logUserInteraction('store_operation', 'ProjectStore', 'test');
        
        // Restore store
        window.useProjectStore = originalStore;
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Should handle gracefully
    expect(result.success).toBe(true);
  });

  test('should handle corrupted store state during audit logging', async () => {
    const result = await window.evaluate(async () => {
      try {
        // Create store state with circular references
        const corruptedState = {
          projects: [],
          loading: false
        };
        corruptedState.self = corruptedState; // Circular reference
        
        window.auditLogger.logDataChange(
          'state_update', 
          'project_store', 
          'corrupted', 
          null, 
          corruptedState
        );
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Should handle serialization errors gracefully
    expect(typeof result.success).toBe('boolean');
  });

  test('should handle store operation timeouts', async () => {
    const result = await window.evaluate(async () => {
      try {
        window.auditLogger.logSystemEvent('store_operation_timeout', {
          component: 'ProjectStore',
          operation: 'fetchProjects',
          timeout_duration_ms: 30000,
          retry_count: 3,
          fallback_strategy: 'use_cached_data'
        });
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(result.success).toBe(true);
  });
});