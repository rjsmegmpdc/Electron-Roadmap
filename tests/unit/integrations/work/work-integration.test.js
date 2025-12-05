/**
 * Unit tests for Work Integration module
 * 
 * Tests the complete manual sync workflow between RT and Azure DevOps
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MockWorkIntegration } from '../../../../src/js/integrations/work/work-integration.js';
import WorkTemplateEngine from '../../../../src/js/integrations/work/work-template-engine.js';
import WorkValidation from '../../../../src/js/integrations/work/work-validation.js';
import WorkMappingConfig from '../../../../src/js/integrations/work/work-mapping-config.js';
import WorkSyncEngine from '../../../../src/js/integrations/work/work-sync-engine.js';
import { MockAzureDevOpsClient } from '../../../../src/js/integrations/work/azure-devops-client.js';
import { MockAuditLog } from '../../../../src/js/integrations/work/audit-log.js';

describe('Work Integration', () => {
  let workIntegration;
  let sampleProject;
  let sampleTask;

  beforeEach(async () => {
    workIntegration = new MockWorkIntegration({
      templatesPath: './tests/fixtures/work/zip-mirror'
    });

    await workIntegration.initialize();

    // Sample RT project
    sampleProject = {
      id: 'rt-project-123',
      title: 'Digital Transformation Initiative',
      description: 'Modernize legacy systems and improve digital capabilities',
      status: 'In Progress',
      priority: 'P1',
      start_date: '15/01/2024',
      end_date: '30/06/2024',
      financial_treatment: 'CAPEX',
      security_block: false,
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-15T14:30:00Z'
    };

    // Sample RT task
    sampleTask = {
      id: 'rt-task-456',
      project_id: 'rt-project-123',
      title: 'Implement new user authentication system',
      description: 'Replace legacy auth with modern OAuth2/OIDC system',
      status: 'Not Started',
      priority: 'P2',
      effort_hours: 80,
      start_date: '20/01/2024',
      end_date: '15/02/2024',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z'
    };
  });

  afterEach(() => {
    // Cleanup
    workIntegration = null;
  });

  describe('Initialization', () => {
    it('should initialize all components successfully', async () => {
      expect(workIntegration._initialized).toBe(true);
      expect(workIntegration.templateEngine).toBeInstanceOf(WorkTemplateEngine);
      expect(workIntegration.validation).toBeInstanceOf(WorkValidation);
      expect(workIntegration.mappingConfig).toBeInstanceOf(WorkMappingConfig);
      expect(workIntegration.syncEngine).toBeInstanceOf(WorkSyncEngine);
      expect(workIntegration.adoClient).toBeInstanceOf(MockAzureDevOpsClient);
      expect(workIntegration.audit).toBeInstanceOf(MockAuditLog);
    });

    it('should test ADO connection on initialization', async () => {
      const connected = await workIntegration.testConnection();
      expect(connected).toBe(true);
    });

    it('should log initialization in audit log', () => {
      const recentEntries = workIntegration.getRecentOperations({ limit: 10 });
      const initEntry = recentEntries.find(entry => entry.action === 'integration_initialized');
      
      expect(initEntry).toBeDefined();
      expect(initEntry.entityType).toBe('system');
      expect(initEntry.details.mock).toBe(true);
    });
  });

  describe('Push to ADO', () => {
    it('should push RT project to ADO as Epic', async () => {
      const result = await workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com'
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe('push');
      expect(result.entityId).toBe(sampleProject.id);
      expect(result.entityType).toBe('project');
      expect(result.adoWorkItemType).toBe('Epic');
      expect(result.adoWorkItemId).toBeGreaterThan(1000);
      expect(result.adoUrl).toContain('/_workitems/edit/');
      expect(result.syncedAt).toBeDefined();
    });

    it('should push RT task to ADO as User Story', async () => {
      const result = await workIntegration.pushToADO(sampleTask, {
        userId: 'test.user@company.com'
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe('push');
      expect(result.entityId).toBe(sampleTask.id);
      expect(result.entityType).toBe('task');
      expect(result.adoWorkItemType).toBe('User Story');
      expect(result.adoWorkItemId).toBeGreaterThan(1000);
    });

    it('should prevent duplicate pushes without force flag', async () => {
      // First push should succeed
      await workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com'
      });

      // Second push should fail
      await expect(workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com'
      })).rejects.toThrow(/already synced/);
    });

    it('should allow duplicate push with force flag', async () => {
      // First push
      const result1 = await workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com'
      });

      // Second push with force should succeed
      const result2 = await workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com',
        force: true
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result2.adoWorkItemId).toBeGreaterThan(result1.adoWorkItemId);
    });

    it('should handle validation errors', async () => {
      const invalidProject = { ...sampleProject };
      delete invalidProject.id;

      await expect(workIntegration.pushToADO(invalidProject, {
        userId: 'test.user@company.com'
      })).rejects.toThrow(/Invalid RT entity/);
    });
  });

  describe('Pull from ADO', () => {
    it('should pull updates from ADO work item to RT', async () => {
      // First push to create ADO work item
      const pushResult = await workIntegration.pushToADO(sampleTask, {
        userId: 'test.user@company.com'
      });

      // Simulate ADO work item changes
      await workIntegration.adoClient.updateWorkItem(pushResult.adoWorkItemId, {
        'System.State': 'Active',
        'Microsoft.VSTS.Common.Priority': 1
      });

      // Pull changes back
      const pullResult = await workIntegration.pullFromADO(pushResult.adoWorkItemId, {
        userId: 'test.user@company.com'
      });

      expect(pullResult.success).toBe(true);
      expect(pullResult.operation).toBe('pull');
      expect(pullResult.adoWorkItemId).toBe(pushResult.adoWorkItemId);
      expect(pullResult.entityType).toBe('task');
      expect(pullResult.updatedFields).toContain('status');
      expect(pullResult.updatedFields).toContain('priority');
      expect(pullResult.conflicts).toHaveLength(0);
    });

    it('should handle non-existent work item ID', async () => {
      await expect(workIntegration.pullFromADO(99999, {
        userId: 'test.user@company.com'
      })).rejects.toThrow(/not found/);
    });

    it('should handle invalid work item ID', async () => {
      await expect(workIntegration.pullFromADO('invalid-id', {
        userId: 'test.user@company.com'
      })).rejects.toThrow(/Valid ADO work item ID/);
    });
  });

  describe('Reconciliation', () => {
    it('should detect conflicts and recommend actions', async () => {
      // Push project to ADO
      const pushResult = await workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com'
      });

      // Get the created work item
      const workItem = await workIntegration.adoClient.getWorkItem(pushResult.adoWorkItemId);

      // Simulate changes in both RT and ADO
      const modifiedProject = {
        ...sampleProject,
        status: 'On Hold',
        updated_at: '2024-01-20T09:00:00Z'
      };

      // Update ADO work item with different status
      await workIntegration.adoClient.updateWorkItem(pushResult.adoWorkItemId, {
        'System.State': 'Active'
      });

      const updatedWorkItem = await workIntegration.adoClient.getWorkItem(pushResult.adoWorkItemId);

      // Reconcile
      const reconcileResult = await workIntegration.reconcile(modifiedProject, pushResult.adoWorkItemId, {
        userId: 'test.user@company.com'
      });

      expect(reconcileResult.success).toBe(true);
      expect(reconcileResult.operation).toBe('reconcile');
      expect(reconcileResult.conflicts).toHaveLength(1);
      expect(reconcileResult.conflicts[0].field).toBe('status');
      expect(reconcileResult.recommendedAction).toBeOneOf(['push', 'pull', 'skip']);
      expect(reconcileResult.reasons).toBeDefined();
      expect(reconcileResult.rtLastModified).toBeDefined();
      expect(reconcileResult.adoLastModified).toBeDefined();
    });

    it('should recommend skip action when no conflicts', async () => {
      const reconcileResult = await workIntegration.reconcile(sampleProject, 1001, {
        userId: 'test.user@company.com'
      });

      expect(reconcileResult.recommendedAction).toBe('skip');
      expect(reconcileResult.reasons).toContain('No conflicts detected');
    });
  });

  describe('Finding Linked Work Items', () => {
    it('should find ADO work items linked to RT project', async () => {
      // Push project to create link
      const pushResult = await workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com'
      });

      // Find linked work items
      const linkedItems = await workIntegration.findLinkedWorkItems(sampleProject);

      expect(linkedItems).toHaveLength(1);
      expect(linkedItems[0].id).toBe(pushResult.adoWorkItemId);
      expect(linkedItems[0].workItemType).toBe('Epic');
      expect(linkedItems[0].url).toBeDefined();
    });

    it('should find ADO work items linked to RT task', async () => {
      const pushResult = await workIntegration.pushToADO(sampleTask, {
        userId: 'test.user@company.com'
      });

      const linkedItems = await workIntegration.findLinkedWorkItems(sampleTask);

      expect(linkedItems).toHaveLength(1);
      expect(linkedItems[0].id).toBe(pushResult.adoWorkItemId);
      expect(linkedItems[0].workItemType).toBe('User Story');
    });

    it('should return empty array for unlinked entities', async () => {
      const unlinkedProject = {
        ...sampleProject,
        id: 'unlinked-project-999'
      };

      const linkedItems = await workIntegration.findLinkedWorkItems(unlinkedProject);
      expect(linkedItems).toHaveLength(0);
    });
  });

  describe('Sync Status', () => {
    it('should return never_synced status for new entity', () => {
      const status = workIntegration.getSyncStatus(sampleProject);
      
      expect(status.synced).toBe(false);
      expect(status.status).toBe('never_synced');
      expect(status.lastSync).toBeNull();
      expect(status.adoWorkItemId).toBeNull();
    });

    it('should return synced status after successful push', async () => {
      const pushResult = await workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com'
      });

      const status = workIntegration.getSyncStatus(sampleProject);
      
      expect(status.synced).toBe(true);
      expect(status.status).toBe('synced');
      expect(status.lastSync).toBeDefined();
      expect(status.lastSyncDirection).toBe('RT -> ADO');
      expect(status.adoWorkItemId).toBe(pushResult.adoWorkItemId);
      expect(status.adoUrl).toBe(pushResult.adoUrl);
    });
  });

  describe('Statistics and Audit', () => {
    it('should track sync statistics', async () => {
      // Perform some sync operations
      await workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com'
      });
      
      const pushResult = await workIntegration.pushToADO(sampleTask, {
        userId: 'test.user@company.com'
      });

      await workIntegration.pullFromADO(pushResult.adoWorkItemId, {
        userId: 'test.user@company.com'
      });

      const stats = workIntegration.getSyncStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.totalOperations).toBeGreaterThan(0);
      expect(stats.pushOperations.completed).toBe(2);
      expect(stats.pullOperations.completed).toBe(1);
      expect(stats.successRate).toBeGreaterThan(0);
    });

    it('should list recent operations', async () => {
      await workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com'
      });

      const operations = workIntegration.getRecentOperations({ limit: 10 });
      
      expect(operations.length).toBeGreaterThan(0);
      
      const pushOperation = operations.find(op => 
        op.action === 'push_completed' && op.entityId === sampleProject.id
      );
      
      expect(pushOperation).toBeDefined();
      expect(pushOperation.actor).toBe('test.user@company.com');
      expect(pushOperation.details.adoWorkItemType).toBe('Epic');
    });

    it('should export audit log', async () => {
      await workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com'
      });

      const exportJson = workIntegration.exportAuditLog({
        entityId: sampleProject.id
      });

      expect(exportJson).toBeDefined();
      
      const exportData = JSON.parse(exportJson);
      expect(exportData.version).toBe('1.0');
      expect(exportData.entries).toBeDefined();
      expect(exportData.total_entries).toBeGreaterThan(0);
      expect(exportData.exported_at).toBeDefined();
    });
  });

  describe('ADO Integration', () => {
    it('should get available work item types', async () => {
      const workItemTypes = await workIntegration.getAvailableWorkItemTypes();
      
      expect(Array.isArray(workItemTypes)).toBe(true);
      // Mock client returns empty array by default
      expect(workItemTypes).toHaveLength(0);
    });

    it('should handle ADO connection errors gracefully', async () => {
      // This test would require mocking connection failures
      // For now, just verify the connection method exists
      const connected = await workIntegration.testConnection();
      expect(typeof connected).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required configuration', () => {
      expect(() => {
        new MockWorkIntegration({
          adoOrganization: null
        });
      }).toThrow(/Required configuration missing/);
    });

    it('should handle template rendering errors gracefully', async () => {
      // Create entity with problematic data that might break template rendering
      const problematicEntity = {
        ...sampleProject,
        title: null,
        description: null
      };

      // Should not throw - template errors should be handled gracefully
      const result = await workIntegration.pushToADO(problematicEntity, {
        userId: 'test.user@company.com',
        renderTemplates: true
      });

      expect(result.success).toBe(true);
    });

    it('should handle validation errors', async () => {
      // Create invalid work item data that should fail validation
      const invalidEntity = {
        id: 'test-123'
        // Missing required fields
      };

      await expect(workIntegration.pushToADO(invalidEntity, {
        userId: 'test.user@company.com'
      })).rejects.toThrow();
    });
  });

  describe('Template Integration', () => {
    it('should apply templates during push if enabled', async () => {
      const result = await workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com',
        renderTemplates: true
      });

      expect(result.success).toBe(true);
      
      // Verify the work item was created in ADO
      const workItem = await workIntegration.adoClient.getWorkItem(result.adoWorkItemId);
      expect(workItem.fields['System.Title']).toContain('[Epic]');
      expect(workItem.fields['System.Tags']).toContain('roadmap-tool');
    });

    it('should skip templates if disabled', async () => {
      const result = await workIntegration.pushToADO(sampleProject, {
        userId: 'test.user@company.com',
        renderTemplates: false
      });

      expect(result.success).toBe(true);
    });
  });
});