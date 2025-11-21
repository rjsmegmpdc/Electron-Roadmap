// app/main/services/coordinator/AdoSyncService.ts
import type { DB } from '../../db';
import type { AdoFeatureMapping } from '../../types/coordinator';

export interface AdoWorkItem {
  id: number;
  fields: {
    'System.Title'?: string;
    'System.State'?: string;
    'System.AssignedTo'?: { displayName: string };
    'Microsoft.VSTS.Scheduling.Effort'?: number;
    'System.IterationPath'?: string;
    'System.AreaPath'?: string;
    [key: string]: any;
  };
}

export interface ExternalSquadMilestones {
  backlog_submission_date?: string;  // DD-MM-YYYY
  design_workshop_date?: string;
  development_start_date?: string;
  uat_target_date?: string;
  prod_deployment_date?: string;
}

export class AdoSyncService {
  constructor(private db: DB) {}

  async createMapping(data: {
    feature_id: string;
    ado_work_item_id: number;
    milestones?: ExternalSquadMilestones;
  }): Promise<AdoFeatureMapping> {
    const now = new Date().toISOString();

    const mapping: AdoFeatureMapping = {
      feature_id: data.feature_id,
      ado_work_item_id: data.ado_work_item_id,
      backlog_submission_date: data.milestones?.backlog_submission_date,
      design_workshop_date: data.milestones?.design_workshop_date,
      development_start_date: data.milestones?.development_start_date,
      uat_target_date: data.milestones?.uat_target_date,
      prod_deployment_date: data.milestones?.prod_deployment_date,
      sync_status: 'pending',
      created_at: now,
      updated_at: now,
    };

    this.db
      .prepare(
        `INSERT INTO ado_feature_mapping (
          feature_id, ado_work_item_id,
          backlog_submission_date, design_workshop_date, development_start_date,
          uat_target_date, prod_deployment_date,
          sync_status, created_at, updated_at
        ) VALUES (
          @feature_id, @ado_work_item_id,
          @backlog_submission_date, @design_workshop_date, @development_start_date,
          @uat_target_date, @prod_deployment_date,
          @sync_status, @created_at, @updated_at
        )`
      )
      .run(mapping);

    return mapping;
  }

  async updateMapping(
    featureId: string,
    updates: {
      ado_state?: string;
      ado_assigned_to?: string;
      ado_effort?: number;
      ado_iteration_path?: string;
      ado_area_path?: string;
      milestones?: ExternalSquadMilestones;
    }
  ): Promise<void> {
    const now = new Date().toISOString();
    const sets: string[] = [];
    const params: any = { feature_id: featureId, updated_at: now };

    if (updates.ado_state !== undefined) {
      sets.push('ado_state = @ado_state');
      params.ado_state = updates.ado_state;
    }
    if (updates.ado_assigned_to !== undefined) {
      sets.push('ado_assigned_to = @ado_assigned_to');
      params.ado_assigned_to = updates.ado_assigned_to;
    }
    if (updates.ado_effort !== undefined) {
      sets.push('ado_effort = @ado_effort');
      params.ado_effort = updates.ado_effort;
    }
    if (updates.ado_iteration_path !== undefined) {
      sets.push('ado_iteration_path = @ado_iteration_path');
      params.ado_iteration_path = updates.ado_iteration_path;
    }
    if (updates.ado_area_path !== undefined) {
      sets.push('ado_area_path = @ado_area_path');
      params.ado_area_path = updates.ado_area_path;
    }

    if (updates.milestones) {
      if (updates.milestones.backlog_submission_date !== undefined) {
        sets.push('backlog_submission_date = @backlog_submission_date');
        params.backlog_submission_date = updates.milestones.backlog_submission_date;
      }
      if (updates.milestones.design_workshop_date !== undefined) {
        sets.push('design_workshop_date = @design_workshop_date');
        params.design_workshop_date = updates.milestones.design_workshop_date;
      }
      if (updates.milestones.development_start_date !== undefined) {
        sets.push('development_start_date = @development_start_date');
        params.development_start_date = updates.milestones.development_start_date;
      }
      if (updates.milestones.uat_target_date !== undefined) {
        sets.push('uat_target_date = @uat_target_date');
        params.uat_target_date = updates.milestones.uat_target_date;
      }
      if (updates.milestones.prod_deployment_date !== undefined) {
        sets.push('prod_deployment_date = @prod_deployment_date');
        params.prod_deployment_date = updates.milestones.prod_deployment_date;
      }
    }

    if (sets.length === 0) return;

    sets.push('last_synced_at = @last_synced_at');
    params.last_synced_at = now;

    this.db
      .prepare(
        `UPDATE ado_feature_mapping SET ${sets.join(', ')}, updated_at = @updated_at WHERE feature_id = @feature_id`
      )
      .run(params);
  }

  async syncWorkItem(featureId: string, workItem: AdoWorkItem): Promise<void> {
    const fields = workItem.fields;
    const updates: any = {
      ado_state: fields['System.State'],
      ado_assigned_to: fields['System.AssignedTo']?.displayName,
      ado_effort: fields['Microsoft.VSTS.Scheduling.Effort'],
      ado_iteration_path: fields['System.IterationPath'],
      ado_area_path: fields['System.AreaPath'],
    };

    // Check for custom milestone fields (these would be configured per ADO instance)
    const milestones: ExternalSquadMilestones = {};
    
    // Example custom field mapping - adjust based on actual ADO configuration
    if (fields['Custom.BacklogSubmission']) {
      milestones.backlog_submission_date = this.convertAdoDateToNZ(fields['Custom.BacklogSubmission']);
    }
    if (fields['Custom.DesignWorkshop']) {
      milestones.design_workshop_date = this.convertAdoDateToNZ(fields['Custom.DesignWorkshop']);
    }
    if (fields['Custom.DevelopmentStart']) {
      milestones.development_start_date = this.convertAdoDateToNZ(fields['Custom.DevelopmentStart']);
    }
    if (fields['Custom.UATTarget']) {
      milestones.uat_target_date = this.convertAdoDateToNZ(fields['Custom.UATTarget']);
    }
    if (fields['Custom.ProdDeployment']) {
      milestones.prod_deployment_date = this.convertAdoDateToNZ(fields['Custom.ProdDeployment']);
    }

    if (Object.keys(milestones).length > 0) {
      updates.milestones = milestones;
    }

    try {
      await this.updateMapping(featureId, updates);
      await this.markSyncSuccess(featureId);
    } catch (error: any) {
      await this.markSyncError(featureId, error.message);
      throw error;
    }
  }

  private convertAdoDateToNZ(isoDate: string): string {
    // ISO YYYY-MM-DD -> DD-MM-YYYY
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  async markSyncSuccess(featureId: string): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE ado_feature_mapping 
         SET sync_status = 'synced', sync_error = NULL, last_synced_at = ?, updated_at = ?
         WHERE feature_id = ?`
      )
      .run(now, now, featureId);
  }

  async markSyncError(featureId: string, errorMessage: string): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE ado_feature_mapping 
         SET sync_status = 'error', sync_error = ?, updated_at = ?
         WHERE feature_id = ?`
      )
      .run(errorMessage, now, featureId);
  }

  async getMappingByFeature(featureId: string): Promise<AdoFeatureMapping | undefined> {
    return this.db
      .prepare('SELECT * FROM ado_feature_mapping WHERE feature_id = ?')
      .get(featureId) as AdoFeatureMapping | undefined;
  }

  async getMappingByWorkItem(workItemId: number): Promise<AdoFeatureMapping | undefined> {
    return this.db
      .prepare('SELECT * FROM ado_feature_mapping WHERE ado_work_item_id = ?')
      .get(workItemId) as AdoFeatureMapping | undefined;
  }

  async getPendingSyncs(): Promise<AdoFeatureMapping[]> {
    return this.db
      .prepare("SELECT * FROM ado_feature_mapping WHERE sync_status = 'pending' OR sync_status = 'error'")
      .all() as AdoFeatureMapping[];
  }

  async getAllMappings(): Promise<AdoFeatureMapping[]> {
    return this.db.prepare('SELECT * FROM ado_feature_mapping').all() as AdoFeatureMapping[];
  }

  async getExternalSquadFeatures(): Promise<
    Array<{
      feature_id: string;
      feature_name: string;
      resource_name: string;
      milestones: ExternalSquadMilestones;
      ado_state?: string;
      last_synced_at?: string;
    }>
  > {
    const rows = this.db
      .prepare(
        `SELECT 
          f.id as feature_id,
          f.name as feature_name,
          fr.resource_name,
          afm.backlog_submission_date,
          afm.design_workshop_date,
          afm.development_start_date,
          afm.uat_target_date,
          afm.prod_deployment_date,
          afm.ado_state,
          afm.last_synced_at
        FROM feature_allocations fa
        INNER JOIN features f ON f.id = fa.feature_id
        INNER JOIN financial_resources fr ON fr.id = fa.resource_id
        LEFT JOIN ado_feature_mapping afm ON afm.feature_id = fa.feature_id
        WHERE fr.contract_type = 'External Squad'
        GROUP BY f.id`
      )
      .all() as any[];

    return rows.map((row) => ({
      feature_id: row.feature_id,
      feature_name: row.feature_name,
      resource_name: row.resource_name,
      milestones: {
        backlog_submission_date: row.backlog_submission_date,
        design_workshop_date: row.design_workshop_date,
        development_start_date: row.development_start_date,
        uat_target_date: row.uat_target_date,
        prod_deployment_date: row.prod_deployment_date,
      },
      ado_state: row.ado_state,
      last_synced_at: row.last_synced_at,
    }));
  }
}
