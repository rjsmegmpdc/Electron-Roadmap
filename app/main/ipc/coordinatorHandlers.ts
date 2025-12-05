// app/main/ipc/coordinatorHandlers.ts
import { ipcMain } from 'electron';
import type { DB } from '../db';
import { TimesheetImportService } from '../services/coordinator/TimesheetImportService';
import { ActualsImportService } from '../services/coordinator/ActualsImportService';
import { LabourRatesImportService } from '../services/coordinator/LabourRatesImportService';
import { ResourceCommitmentService } from '../services/coordinator/ResourceCommitmentService';
import { AllocationService } from '../services/coordinator/AllocationService';
import { AdoSyncService } from '../services/coordinator/AdoSyncService';
import { VarianceDetectionService } from '../services/coordinator/VarianceDetectionService';
import { ResourceImportService } from '../services/coordinator/ResourceImportService';
import { FinanceLedgerService } from '../services/coordinator/FinanceLedgerService';

export function registerCoordinatorHandlers(db: DB) {
  const timesheetService = new TimesheetImportService(db);
  const actualsService = new ActualsImportService(db);
  const labourRatesService = new LabourRatesImportService(db);
  const commitmentService = new ResourceCommitmentService(db);
  const allocationService = new AllocationService(db);
  const adoSyncService = new AdoSyncService(db);
  const varianceService = new VarianceDetectionService(db);
  const resourceImportService = new ResourceImportService(db);
  const financeLedgerService = new FinanceLedgerService(db);

  // Import handlers
  ipcMain.handle('coordinator:importTimesheets', async (_, csvData: string) => {
    try {
      return await timesheetService.importTimesheets(csvData);
    } catch (error: any) {
      console.error('Failed to import timesheets:', error);
      return {
        success: false,
        recordsProcessed: 0,
        recordsImported: 0,
        recordsFailed: 0,
        errors: [{ row: 0, message: error.message, severity: 'error' as const }],
        warnings: []
      };
    }
  });

  ipcMain.handle('coordinator:importActuals', async (_, csvData: string) => {
    try {
      const result = await actualsService.importActuals(csvData);
      // Categorize after import
      if (result.success) {
        await actualsService.categorizeActuals();
      }
      return result;
    } catch (error: any) {
      console.error('Failed to import actuals:', error);
      return {
        success: false,
        recordsProcessed: 0,
        recordsImported: 0,
        recordsFailed: 0,
        errors: [{ row: 0, message: error.message, severity: 'error' as const }],
        warnings: []
      };
    }
  });

  ipcMain.handle('coordinator:importLabourRates', async (_, csvData: string, fiscalYear: string) => {
    try {
      return await labourRatesService.importLabourRates(csvData, fiscalYear);
    } catch (error: any) {
      console.error('Failed to import labour rates:', error);
      return {
        success: false,
        recordsProcessed: 0,
        recordsImported: 0,
        recordsFailed: 0,
        errors: [{ row: 0, message: error.message, severity: 'error' as const }],
        warnings: []
      };
    }
  });

  ipcMain.handle('coordinator:importResources', async (_, csvData: string) => {
    try {
      return await resourceImportService.importResources(csvData);
    } catch (error: any) {
      console.error('Failed to import resources:', error);
      return {
        success: false,
        recordsProcessed: 0,
        recordsImported: 0,
        recordsFailed: 0,
        errors: [{ row: 0, message: error.message, severity: 'error' as const }],
        warnings: []
      };
    }
  });

  // Get imported data counts
  ipcMain.handle('coordinator:getImportCounts', async () => {
    try {
      const timesheetCount = db.prepare('SELECT COUNT(*) as count FROM raw_timesheets').get() as any;
      const actualsCount = db.prepare('SELECT COUNT(*) as count FROM raw_actuals').get() as any;
      const ratesCount = db.prepare('SELECT COUNT(*) as count FROM raw_labour_rates').get() as any;
      
      return {
        timesheets: timesheetCount.count,
        actuals: actualsCount.count,
        labourRates: ratesCount.count
      };
    } catch (error: any) {
      console.error('Failed to get import counts:', error);
      return { timesheets: 0, actuals: 0, labourRates: 0 };
    }
  });

  ipcMain.handle('coordinator:getAllResources', async () => {
    try {
      return db.prepare('SELECT * FROM financial_resources ORDER BY resource_name').all();
    } catch (error: any) {
      console.error('Failed to get all resources:', error);
      throw error;
    }
  });

  // Resource Commitments
  
  // New handler for listing resources (used by ResourceCommitment component)
  ipcMain.handle('coordinator:resources:list', async () => {
    try {
      return db.prepare('SELECT id, resource_name, personnel_number, activity_type_cap, activity_type_opx FROM financial_resources ORDER BY resource_name').all();
    } catch (error: any) {
      console.error('Failed to list resources:', error);
      throw error;
    }
  });

  // New handler for creating resources
  ipcMain.handle('coordinator:resource:create', async (_, data) => {
    try {
      const {
        resource_name,
        contract_type,
        email,
        work_area,
        activity_type_cap,
        activity_type_opx,
        employee_id
      } = data;

      // Validate required fields
      if (!resource_name || !contract_type) {
        throw new Error('Resource name and contract type are required');
      }

      // Check if employee_id already exists (if provided)
      if (employee_id) {
        const existing = db.prepare('SELECT id FROM financial_resources WHERE employee_id = ?').get(employee_id);
        if (existing) {
          throw new Error(`Resource with employee ID ${employee_id} already exists`);
        }
      }

      // Check if email already exists (if provided)
      if (email) {
        const existing = db.prepare('SELECT id FROM financial_resources WHERE email = ?').get(email);
        if (existing) {
          throw new Error(`Resource with email ${email} already exists`);
        }
      }

      // Insert new resource
      const now = new Date().toISOString();
      const result = db.prepare(`
        INSERT INTO financial_resources (
          resource_name,
          contract_type,
          email,
          work_area,
          activity_type_cap,
          activity_type_opx,
          employee_id,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        resource_name,
        contract_type,
        email || null,
        work_area || null,
        activity_type_cap || null,
        activity_type_opx || null,
        employee_id || null,
        now,
        now
      );

      return {
        success: true,
        id: result.lastInsertRowid,
        resource_name,
        contract_type,
        message: `Resource '${resource_name}' created successfully`
      };
    } catch (error: any) {
      console.error('Failed to create resource:', error);
      throw error;
    }
  });

  // New handler for creating commitments (used by ResourceCommitment component)
  ipcMain.handle('coordinator:commitment:create', async (_, data) => {
    try {
      const result = await commitmentService.createCommitment(data);
      // Update allocated hours for the resource
      await commitmentService.updateAllocatedHoursForResource(data.resource_id);
      return result;
    } catch (error: any) {
      console.error('Failed to create commitment:', error);
      throw error;
    }
  });

  // New handler for updating resources
  ipcMain.handle('coordinator:resource:update', async (_, data) => {
    try {
      const {
        id,
        resource_name,
        contract_type,
        email,
        work_area,
        activity_type_cap,
        activity_type_opx,
        employee_id
      } = data;

      // Validate required fields
      if (!id || !resource_name || !contract_type) {
        throw new Error('ID, resource name, and contract type are required');
      }

      // Check if email already exists (if provided and different from current)
      if (email) {
        const existing = db.prepare('SELECT id FROM financial_resources WHERE email = ? AND id != ?').get(email, id);
        if (existing) {
          throw new Error(`Resource with email ${email} already exists`);
        }
      }

      // Check if employee_id already exists (if provided and different from current)
      if (employee_id) {
        const existing = db.prepare('SELECT id FROM financial_resources WHERE employee_id = ? AND id != ?').get(employee_id, id);
        if (existing) {
          throw new Error(`Resource with employee ID ${employee_id} already exists`);
        }
      }

      // Update resource
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE financial_resources SET
          resource_name = ?,
          contract_type = ?,
          email = ?,
          work_area = ?,
          activity_type_cap = ?,
          activity_type_opx = ?,
          employee_id = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        resource_name,
        contract_type,
        email || null,
        work_area || null,
        activity_type_cap || null,
        activity_type_opx || null,
        employee_id || null,
        now,
        id
      );

      return {
        success: true,
        id,
        resource_name,
        message: `Resource '${resource_name}' updated successfully`
      };
    } catch (error: any) {
      console.error('Failed to update resource:', error);
      throw error;
    }
  });

  // New handler for deleting resources
  ipcMain.handle('coordinator:resource:delete', async (_, { id }) => {
    try {
      if (!id) {
        throw new Error('Resource ID is required');
      }

      // Get resource name before deletion
      const resource = db.prepare('SELECT resource_name FROM financial_resources WHERE id = ?').get(id) as any;
      
      if (!resource) {
        throw new Error('Resource not found');
      }

      // Check if resource has commitments
      const commitments = db.prepare('SELECT COUNT(*) as count FROM resource_commitments WHERE resource_id = ?').get(id) as any;
      if (commitments.count > 0) {
        throw new Error(`Cannot delete resource with ${commitments.count} commitment(s). Please remove commitments first.`);
      }

      // Check if resource has allocations
      const allocations = db.prepare('SELECT COUNT(*) as count FROM feature_allocations WHERE resource_id = ?').get(id) as any;
      if (allocations.count > 0) {
        throw new Error(`Cannot delete resource with ${allocations.count} allocation(s). Please remove allocations first.`);
      }

      // Delete the resource
      db.prepare('DELETE FROM financial_resources WHERE id = ?').run(id);

      return {
        success: true,
        id,
        message: `Resource '${resource.resource_name}' deleted successfully`
      };
    } catch (error: any) {
      console.error('Failed to delete resource:', error);
      throw error;
    }
  });

  // Legacy handler for backwards compatibility
  ipcMain.handle('coordinator:createCommitment', async (_, data) => {
    try {
      return await commitmentService.createCommitment(data);
    } catch (error: any) {
      console.error('Failed to create commitment:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:getCapacity', async (_, { resourceId, periodStart, periodEnd }) => {
    try {
      return await commitmentService.getCapacityCalculation(resourceId, periodStart, periodEnd);
    } catch (error: any) {
      console.error('Failed to get capacity:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:getAllCapacities', async () => {
    try {
      return await commitmentService.getAllCapacities();
    } catch (error: any) {
      console.error('Failed to get all capacities:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:updateAllocatedHours', async (_, { resourceId }) => {
    try {
      await commitmentService.updateAllocatedHoursForResource(resourceId);
    } catch (error: any) {
      console.error('Failed to update allocated hours:', error);
      throw error;
    }
  });

  // Feature Allocations
  ipcMain.handle('coordinator:createAllocation', async (_, data) => {
    try {
      const allocation = await allocationService.createAllocation(data);
      await commitmentService.updateAllocatedHoursForResource(data.resource_id);
      return allocation;
    } catch (error: any) {
      console.error('Failed to create allocation:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:updateAllocation', async (_, { allocationId, updates }) => {
    try {
      const alloc = db.prepare('SELECT resource_id FROM feature_allocations WHERE id = ?').get(allocationId) as any;
      await allocationService.updateAllocation(allocationId, updates);
      if (alloc) {
        await commitmentService.updateAllocatedHoursForResource(alloc.resource_id);
      }
    } catch (error: any) {
      console.error('Failed to update allocation:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:deleteAllocation', async (_, { allocationId }) => {
    try {
      const alloc = db.prepare('SELECT resource_id FROM feature_allocations WHERE id = ?').get(allocationId) as any;
      await allocationService.deleteAllocation(allocationId);
      if (alloc) {
        await commitmentService.updateAllocatedHoursForResource(alloc.resource_id);
      }
    } catch (error: any) {
      console.error('Failed to delete allocation:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:getAllocationsForResource', async (_, { resourceId }) => {
    try {
      return await allocationService.getAllocationsForResource(resourceId);
    } catch (error: any) {
      console.error('Failed to get allocations for resource:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:getAllocationsForFeature', async (_, { featureId }) => {
    try {
      return await allocationService.getAllocationsForFeature(featureId);
    } catch (error: any) {
      console.error('Failed to get allocations for feature:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:reconcileAllocation', async (_, { allocationId }) => {
    try {
      return await allocationService.reconcileAllocation(allocationId);
    } catch (error: any) {
      console.error('Failed to reconcile allocation:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:reconcileAllAllocations', async () => {
    try {
      return await allocationService.reconcileAllAllocations();
    } catch (error: any) {
      console.error('Failed to reconcile all allocations:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:getFeatureAllocationSummary', async (_, { featureId }) => {
    try {
      return await allocationService.getFeatureAllocationSummary(featureId);
    } catch (error: any) {
      console.error('Failed to get feature allocation summary:', error);
      throw error;
    }
  });

  // ADO Integration
  ipcMain.handle('coordinator:createAdoMapping', async (_, data) => {
    try {
      return await adoSyncService.createMapping(data);
    } catch (error: any) {
      console.error('Failed to create ADO mapping:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:updateAdoMapping', async (_, { featureId, updates }) => {
    try {
      await adoSyncService.updateMapping(featureId, updates);
    } catch (error: any) {
      console.error('Failed to update ADO mapping:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:syncWorkItem', async (_, { featureId, workItem }) => {
    try {
      await adoSyncService.syncWorkItem(featureId, workItem);
    } catch (error: any) {
      console.error('Failed to sync work item:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:getExternalSquadFeatures', async () => {
    try {
      return await adoSyncService.getExternalSquadFeatures();
    } catch (error: any) {
      console.error('Failed to get external squad features:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:getPendingSyncs', async () => {
    try {
      return await adoSyncService.getPendingSyncs();
    } catch (error: any) {
      console.error('Failed to get pending syncs:', error);
      throw error;
    }
  });

  // Variance Detection
  ipcMain.handle('coordinator:setVarianceThreshold', async (_, data) => {
    try {
      return await varianceService.setThreshold(data);
    } catch (error: any) {
      console.error('Failed to set variance threshold:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:detectAllVariances', async () => {
    try {
      return await varianceService.detectAllVariances();
    } catch (error: any) {
      console.error('Failed to detect variances:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:createAlert', async (_, check) => {
    try {
      return await varianceService.createAlert(check);
    } catch (error: any) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:resolveAlert', async (_, { alertId, resolvedBy, notes }) => {
    try {
      await varianceService.resolveAlert(alertId, resolvedBy, notes);
    } catch (error: any) {
      console.error('Failed to resolve alert:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:getOpenAlerts', async () => {
    try {
      return await varianceService.getOpenAlerts();
    } catch (error: any) {
      console.error('Failed to get open alerts:', error);
      throw error;
    }
  });

  // Variance Alerts UI handlers
  ipcMain.handle('coordinator:alerts:list', async () => {
    try {
      const alerts = db.prepare(`
        SELECT 
          id,
          alert_type,
          severity,
          entity_type,
          entity_id,
          message,
          acknowledged,
          acknowledged_at,
          created_at
        FROM variance_alerts
        ORDER BY 
          acknowledged ASC,
          CASE severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          created_at DESC
      `).all();
      return alerts;
    } catch (error: any) {
      console.error('Failed to list alerts:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:alerts:acknowledge', async (_, alertId: string) => {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE variance_alerts 
        SET acknowledged = 1, acknowledged_at = ?
        WHERE id = ?
      `).run(now, alertId);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  });

  // Project Finance handlers
  ipcMain.handle('coordinator:finance:getLedger', async (_, params?: { projectId?: string; month?: string }) => {
    try {
      const ledger = await financeLedgerService.getFinanceLedger(params?.projectId, params?.month);
      return ledger;
    } catch (error: any) {
      console.error('Failed to get finance ledger:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:finance:getSummary', async (_, params?: { projectId?: string; month?: string }) => {
    try {
      const summary = await financeLedgerService.getFinanceSummary(params?.projectId, params?.month);
      return summary;
    } catch (error: any) {
      console.error('Failed to get finance summary:', error);
      throw error;
    }
  });

  ipcMain.handle('coordinator:finance:getAvailableMonths', async () => {
    try {
      const months = await financeLedgerService.getAvailableMonths();
      return months;
    } catch (error: any) {
      console.error('Failed to get available months:', error);
      return [];
    }
  });

  console.log('Project Coordinator IPC handlers registered');
}
