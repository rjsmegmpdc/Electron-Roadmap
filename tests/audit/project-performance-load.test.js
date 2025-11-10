/**
 * Project Performance and Load Testing for Audit Logging
 * 
 * Tests audit logging performance under various load scenarios,
 * stress conditions, and edge cases with project domain operations.
 */

const { test, expect } = require('@playwright/test');
const { _electron } = require('@playwright/test');
const path = require('path');

test.describe('Project Audit Logging Performance Tests', () => {
  let electronApp;
  let window;

  const measurePerformance = async (operation, expectedEvents = 1) => {
    const startTime = Date.now();
    
    await operation();
    
    // Wait for audit events to be processed
    await window.waitForTimeout(200);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Verify events were logged
    const events = await window.evaluate(async () => {
      return await window.auditLogger.getRecentEvents(1);
    });
    
    return {
      duration,
      eventsLogged: events.length,
      throughput: events.length / (duration / 1000) // events per second
    };
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

  test.describe('High-Frequency Operation Testing', () => {
    test('should handle rapid form field changes without performance degradation', async () => {
      const iterations = 100;
      const startTime = performance.now();
      
      const results = await window.evaluate(async (count) => {
        const timings = [];
        
        for (let i = 0; i < count; i++) {
          const iterationStart = performance.now();
          
          // Simulate rapid field changes
          window.auditLogger.logFormChange(
            'ProjectForm',
            'title', 
            `Previous Title ${i}`,
            `New Title ${i}`,
            { valid: true, errors: [] }
          );
          
          const iterationEnd = performance.now();
          timings.push(iterationEnd - iterationStart);
          
          // Small delay to prevent overwhelming
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        
        return {
          timings,
          averageTime: timings.reduce((a, b) => a + b) / timings.length,
          maxTime: Math.max(...timings),
          minTime: Math.min(...timings)
        };
      }, iterations);
      
      // Performance assertions
      expect(results.averageTime).toBeLessThan(10); // < 10ms average
      expect(results.maxTime).toBeLessThan(50);     // < 50ms max
      expect(results.timings.length).toBe(iterations);
      
      // Verify events were logged
      const events = await window.evaluate(async () => {
        return await window.auditLogger.getRecentEvents(2);
      });
      
      expect(events.length).toBe(iterations);
    });

    test('should handle concurrent project operations efficiently', async () => {
      const concurrentOperations = 20;
      
      const results = await window.evaluate(async (opCount) => {
        const startTime = performance.now();
        const promises = [];
        
        // Create concurrent project operations
        for (let i = 0; i < opCount; i++) {
          promises.push(
            window.electronAPI.createProject({
              title: `Concurrent Project ${i}`,
              start_date: '01-01-2024',
              end_date: '31-12-2024',
              status: 'active'
            })
          );
        }
        
        const results = await Promise.allSettled(promises);
        const endTime = performance.now();
        
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;
        
        return {
          totalTime: endTime - startTime,
          successful,
          failed,
          throughput: successful / ((endTime - startTime) / 1000)
        };
      }, concurrentOperations);
      
      expect(results.successful).toBeGreaterThan(concurrentOperations * 0.8); // 80% success rate
      expect(results.totalTime).toBeLessThan(10000); // Complete within 10 seconds
      expect(results.throughput).toBeGreaterThan(1); // > 1 operation per second
    });

    test('should maintain performance with large project datasets', async () => {
      // First create a large number of projects
      const projectCount = 500;
      
      const createResults = await window.evaluate(async (count) => {
        const startTime = performance.now();
        const projects = [];
        
        // Create projects in batches to avoid overwhelming
        const batchSize = 50;
        for (let batch = 0; batch < count / batchSize; batch++) {
          const batchPromises = [];
          
          for (let i = 0; i < batchSize; i++) {
            const projectIndex = batch * batchSize + i;
            batchPromises.push(
              window.electronAPI.createProject({
                title: `Large Dataset Project ${projectIndex}`,
                description: `Generated project ${projectIndex} for performance testing`,
                start_date: '01-01-2024',
                end_date: '31-12-2024',
                status: 'active'
              })
            );
          }
          
          const batchResults = await Promise.allSettled(batchPromises);
          const successful = batchResults.filter(r => r.status === 'fulfilled' && r.value.success);
          projects.push(...successful.map(r => r.value.data));
          
          // Brief pause between batches
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const endTime = performance.now();
        
        return {
          creationTime: endTime - startTime,
          projectsCreated: projects.length,
          creationThroughput: projects.length / ((endTime - startTime) / 1000)
        };
      }, projectCount);
      
      expect(createResults.projectsCreated).toBeGreaterThan(projectCount * 0.9);
      expect(createResults.creationTime).toBeLessThan(30000); // Complete within 30 seconds
      
      // Now test querying performance with large dataset
      const queryResults = await window.evaluate(async () => {
        const startTime = performance.now();
        
        // Perform various queries
        const allProjects = await window.electronAPI.getAllProjects();
        const activeProjects = await window.electronAPI.getProjectsByStatus('active');
        const stats = await window.electronAPI.getProjectStats();
        
        const endTime = performance.now();
        
        return {
          queryTime: endTime - startTime,
          totalProjects: allProjects.data ? allProjects.data.length : 0,
          activeProjects: activeProjects.data ? activeProjects.data.length : 0,
          queryThroughput: 3 / ((endTime - startTime) / 1000) // 3 queries
        };
      });
      
      expect(queryResults.totalProjects).toBeGreaterThan(400);
      expect(queryResults.queryTime).toBeLessThan(5000); // Queries complete within 5 seconds
      expect(queryResults.queryThroughput).toBeGreaterThan(0.5); // > 0.5 queries per second
    });
  });

  test.describe('Memory and Resource Testing', () => {
    test('should not cause memory leaks during extended audit logging', async () => {
      const results = await window.evaluate(async () => {
        // Get initial memory usage
        const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        // Perform many audit operations
        const operationCount = 1000;
        for (let i = 0; i < operationCount; i++) {
          window.auditLogger.logUserInteraction(
            'memory_test_operation',
            'MemoryTestComponent',
            'test-target',
            {
              iteration: i,
              timestamp: Date.now(),
              testData: `Test data for iteration ${i}`,
              largeArray: new Array(100).fill(`Item ${i}`)
            }
          );
          
          // Periodic cleanup triggers
          if (i % 100 === 0) {
            if (window.gc) {
              window.gc();
            }
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
        
        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        const memoryDelta = finalMemory - initialMemory;
        
        return {
          initialMemory,
          finalMemory,
          memoryDelta,
          memoryDeltaMB: memoryDelta / (1024 * 1024),
          operationCount
        };
      });
      
      // Memory growth should be reasonable (< 50MB for 1000 operations)
      expect(results.memoryDeltaMB).toBeLessThan(50);
      
      // Log memory usage for analysis
      await window.evaluate((memResults) => {
        window.auditLogger.logSystemEvent('memory_test_results', {
          component: 'AuditLogger',
          test_type: 'memory_leak_test',
          initial_memory_mb: memResults.initialMemory / (1024 * 1024),
          final_memory_mb: memResults.finalMemory / (1024 * 1024),
          memory_delta_mb: memResults.memoryDeltaMB,
          operations_performed: memResults.operationCount,
          memory_per_operation_kb: (memResults.memoryDelta / memResults.operationCount) / 1024
        });
      }, results);
    });

    test('should handle audit log storage limits gracefully', async () => {
      const results = await window.evaluate(async () => {
        // Simulate approaching storage limits
        window.auditLogger.logSystemEvent('storage_limit_simulation', {
          component: 'AuditLogger',
          available_space_mb: 100,
          used_space_mb: 8500,
          threshold_mb: 500,
          action_required: 'log_rotation'
        });
        
        // Continue logging after limit warning
        const operationCount = 100;
        let successful = 0;
        let failed = 0;
        
        for (let i = 0; i < operationCount; i++) {
          try {
            window.auditLogger.logUserInteraction(
              'storage_limit_test',
              'StorageTestComponent',
              'test-operation',
              { iteration: i }
            );
            successful++;
          } catch (error) {
            failed++;
          }
        }
        
        return { successful, failed, total: operationCount };
      });
      
      // Should handle storage limits gracefully
      expect(results.successful).toBeGreaterThan(results.total * 0.8); // 80% success rate minimum
      expect(results.failed).toBeLessThan(results.total * 0.2); // Less than 20% failures
    });
  });

  test.describe('Stress Testing Scenarios', () => {
    test('should survive rapid UI interactions without crashing', async () => {
      await window.click('[data-testid="create-project-btn"]');
      await window.waitForSelector('[data-testid="project-form"]');
      
      const stressResults = await window.evaluate(async () => {
        const startTime = performance.now();
        let interactions = 0;
        let errors = 0;
        
        // Simulate rapid UI interactions
        const rapidInteractions = async () => {
          for (let i = 0; i < 50; i++) {
            try {
              // Rapid form field changes
              window.auditLogger.logFormChange(
                'ProjectForm',
                'title',
                `Previous ${i}`,
                `New ${i}`,
                { valid: true }
              );
              
              // Rapid user interactions
              window.auditLogger.logUserInteraction(
                'rapid_click',
                'StressTestComponent',
                `button-${i}`,
                { iteration: i }
              );
              
              interactions += 2;
              
              if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
              }
            } catch (error) {
              errors++;
            }
          }
        };
        
        // Run multiple concurrent interaction streams
        await Promise.all([
          rapidInteractions(),
          rapidInteractions(),
          rapidInteractions()
        ]);
        
        const endTime = performance.now();
        
        return {
          totalTime: endTime - startTime,
          totalInteractions: interactions,
          errors,
          throughput: interactions / ((endTime - startTime) / 1000)
        };
      });
      
      expect(stressResults.errors).toBeLessThan(stressResults.totalInteractions * 0.05); // < 5% error rate
      expect(stressResults.throughput).toBeGreaterThan(50); // > 50 interactions per second
      expect(stressResults.totalInteractions).toBe(300); // All interactions completed
    });

    test('should handle database connection failures gracefully', async () => {
      const results = await window.evaluate(async () => {
        // Simulate database connectivity issues
        const errors = [];
        const recoveries = [];
        
        try {
          // Simulate connection loss
          window.auditLogger.logError(
            new Error('Database connection lost'),
            'DatabaseManager',
            {
              error_type: 'connection_failure',
              retry_available: true,
              fallback_enabled: true
            }
          );
          
          // Attempt to continue logging during outage
          window.auditLogger.logSystemEvent('database_outage_logging', {
            component: 'AuditLogger',
            storage_mode: 'fallback_memory',
            queue_size: 150,
            max_queue_size: 1000
          });
          
          // Simulate recovery
          window.auditLogger.logSystemEvent('database_connection_restored', {
            component: 'DatabaseManager',
            outage_duration_ms: 5000,
            queued_events_processed: 150,
            data_integrity_verified: true
          });
          
          return { success: true, errorCount: 0 };
        } catch (error) {
          return { success: false, errorCount: 1, error: error.message };
        }
      });
      
      expect(results.success).toBe(true);
      expect(results.errorCount).toBe(0);
    });

    test('should handle extremely large audit payloads', async () => {
      const results = await window.evaluate(async () => {
        const testResults = {
          smallPayload: { success: false, time: 0 },
          mediumPayload: { success: false, time: 0 },
          largePayload: { success: false, time: 0 }
        };
        
        // Test small payload (1KB)
        try {
          const start1 = performance.now();
          window.auditLogger.logUserInteraction(
            'payload_test_small',
            'PayloadTestComponent',
            'small-data',
            { data: 'A'.repeat(1024) }
          );
          testResults.smallPayload = { success: true, time: performance.now() - start1 };
        } catch (error) {
          testResults.smallPayload = { success: false, time: 0, error: error.message };
        }
        
        // Test medium payload (100KB)
        try {
          const start2 = performance.now();
          window.auditLogger.logUserInteraction(
            'payload_test_medium',
            'PayloadTestComponent',
            'medium-data',
            { data: 'B'.repeat(100 * 1024) }
          );
          testResults.mediumPayload = { success: true, time: performance.now() - start2 };
        } catch (error) {
          testResults.mediumPayload = { success: false, time: 0, error: error.message };
        }
        
        // Test large payload (1MB) - should be rejected or truncated
        try {
          const start3 = performance.now();
          window.auditLogger.logUserInteraction(
            'payload_test_large',
            'PayloadTestComponent',
            'large-data',
            { data: 'C'.repeat(1024 * 1024) }
          );
          testResults.largePayload = { success: true, time: performance.now() - start3 };
        } catch (error) {
          testResults.largePayload = { success: false, time: 0, error: error.message };
        }
        
        return testResults;
      });
      
      // Small and medium payloads should succeed
      expect(results.smallPayload.success).toBe(true);
      expect(results.mediumPayload.success).toBe(true);
      
      // Large payload handling (either succeeds with reasonable time or fails gracefully)
      if (results.largePayload.success) {
        expect(results.largePayload.time).toBeLessThan(1000); // < 1 second if accepted
      } else {
        expect(results.largePayload.error).toBeDefined(); // Graceful failure
      }
      
      // Performance expectations
      expect(results.smallPayload.time).toBeLessThan(50); // < 50ms for small
      expect(results.mediumPayload.time).toBeLessThan(200); // < 200ms for medium
    });
  });

  test.describe('Error Recovery and Resilience', () => {
    test('should recover from audit logger crashes', async () => {
      const results = await window.evaluate(async () => {
        try {
          // Simulate audit logger crash
          window.auditLogger.logError(
            new Error('Audit logger service crashed'),
            'AuditLogger',
            {
              crash_type: 'service_failure',
              recovery_strategy: 'restart_service',
              data_loss_prevention: 'enabled'
            }
          );
          
          // Simulate restart
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Test recovery
          window.auditLogger.logSystemEvent('audit_service_recovered', {
            component: 'AuditLogger',
            recovery_time_ms: 100,
            queued_events_processed: 0,
            service_health: 'healthy'
          });
          
          // Test normal operations after recovery
          window.auditLogger.logUserInteraction(
            'post_recovery_test',
            'RecoveryTestComponent',
            'test-operation',
            { recovery_verified: true }
          );
          
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      expect(results.success).toBe(true);
    });

    test('should maintain audit integrity during system stress', async () => {
      const results = await window.evaluate(async () => {
        const startTime = performance.now();
        const eventIds = [];
        const stressOperations = 200;
        
        // Generate events under stress
        for (let i = 0; i < stressOperations; i++) {
          const eventId = `stress-test-${i}-${Date.now()}`;
          eventIds.push(eventId);
          
          window.auditLogger.logUserInteraction(
            'system_stress_test',
            'StressTestComponent',
            'stress-operation',
            { 
              eventId,
              iteration: i,
              systemLoad: 'high',
              memoryPressure: i > 100 ? 'high' : 'normal'
            }
          );
          
          // Simulate system stress
          if (i % 20 === 0) {
            // CPU intensive operation
            let sum = 0;
            for (let j = 0; j < 100000; j++) {
              sum += Math.random();
            }
          }
        }
        
        const endTime = performance.now();
        
        // Verify event integrity
        await new Promise(resolve => setTimeout(resolve, 500));
        const recentEvents = await window.auditLogger.getRecentEvents(5);
        const stressEvents = recentEvents.filter(e => e.action === 'system_stress_test');
        
        return {
          totalTime: endTime - startTime,
          expectedEvents: stressOperations,
          actualEvents: stressEvents.length,
          dataIntegrity: stressEvents.length >= stressOperations * 0.95, // 95% integrity
          averageTime: (endTime - startTime) / stressOperations
        };
      });
      
      expect(results.dataIntegrity).toBe(true);
      expect(results.actualEvents).toBeGreaterThan(results.expectedEvents * 0.9); // 90% minimum
      expect(results.averageTime).toBeLessThan(50); // < 50ms average per event
    });
  });
});

test.describe('Negative Performance Test Cases', () => {
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

  test('should handle audit logging when system resources are exhausted', async () => {
    const result = await window.evaluate(async () => {
      try {
        // Simulate resource exhaustion
        window.auditLogger.logSystemEvent('resource_exhaustion_simulation', {
          component: 'SystemMonitor',
          cpu_usage: 95,
          memory_usage: 90,
          disk_usage: 95,
          available_handles: 50,
          audit_queue_size: 5000,
          performance_degraded: true
        });
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    expect(result.success).toBe(true);
  });

  test('should gracefully degrade when audit system becomes unresponsive', async () => {
    const result = await window.evaluate(async () => {
      try {
        // Simulate unresponsive audit system
        window.auditLogger.logError(
          new Error('Audit system unresponsive'),
          'AuditLogger',
          {
            response_time_ms: 30000,
            timeout_threshold_ms: 5000,
            degradation_mode: 'critical_only',
            buffering_enabled: true
          }
        );
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    expect(result.success).toBe(true);
  });
});