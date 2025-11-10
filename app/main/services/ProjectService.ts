import { DB } from '../db';
import { NZCurrency, NZDate } from '../../renderer/utils/validation';

export type ProjectStatus = 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
export type FinancialTreatment = 'CAPEX' | 'OPEX';

export interface Project {
  id: string;
  title: string;
  description: string;
  lane: string;
  start_date: string; // DD-MM-YYYY format
  end_date: string;   // DD-MM-YYYY format
  status: ProjectStatus;
  pm_name: string;
  budget_cents: number;
  financial_treatment: FinancialTreatment;
  row?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  lane?: string;
  start_date: string; // DD-MM-YYYY
  end_date: string;   // DD-MM-YYYY
  status: ProjectStatus;
  pm_name?: string;
  budget_nzd?: string; // NZD format like "1,234.56"
  financial_treatment?: FinancialTreatment;
  row?: number;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string;
}

export interface ProjectValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ProjectService {
  private db: DB;
  private createStmt: any;
  private updateStmt: any;
  private getByIdStmt: any;
  private getAllStmt: any;
  private deleteStmt: any;

  constructor(db: DB) {
    this.db = db;
    this.initializeStatements();
  }

  private initializeStatements() {
    this.createStmt = this.db.prepare(`
      INSERT INTO projects (
        id, title, description, lane, 
        start_date_nz, end_date_nz, start_date_iso, end_date_iso,
        status, pm_name, budget_cents, financial_treatment, row,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    this.updateStmt = this.db.prepare(`
      UPDATE projects SET
        title = ?, description = ?, lane = ?,
        start_date_nz = ?, end_date_nz = ?, start_date_iso = ?, end_date_iso = ?,
        status = ?, pm_name = ?, budget_cents = ?, financial_treatment = ?, row = ?,
        updated_at = ?
      WHERE id = ?
    `);

    this.getByIdStmt = this.db.prepare(`
      SELECT id, title, description, lane, 
             start_date_nz as start_date, end_date_nz as end_date,
             status, pm_name, budget_cents, financial_treatment, row,
             created_at, updated_at
      FROM projects 
      WHERE id = ?
    `);

    this.getAllStmt = this.db.prepare(`
      SELECT id, title, description, lane, 
             start_date_nz as start_date, end_date_nz as end_date,
             status, pm_name, budget_cents, financial_treatment, row,
             created_at, updated_at
      FROM projects 
      ORDER BY start_date_iso
    `);

    this.deleteStmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
  }

  /**
   * Validates project data using NZ validation rules
   */
  validateProject(data: CreateProjectRequest | UpdateProjectRequest): ProjectValidationResult {
    const errors: string[] = [];

    // Title validation
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Project title is required');
    } else if (data.title.trim().length > 200) {
      errors.push('Project title must be 200 characters or less');
    }

    // Date validation
    if (!data.start_date || !NZDate.validate(data.start_date)) {
      errors.push('Start date must be in DD-MM-YYYY format');
    }
    if (!data.end_date || !NZDate.validate(data.end_date)) {
      errors.push('End date must be in DD-MM-YYYY format');
    }

    // Date range validation
    if (data.start_date && data.end_date && 
        NZDate.validate(data.start_date) && NZDate.validate(data.end_date)) {
      try {
        const startDate = NZDate.parse(data.start_date);
        const endDate = NZDate.parse(data.end_date);
        if (endDate <= startDate) {
          errors.push('End date must be after start date');
        }
      } catch (error) {
        errors.push('Invalid date range');
      }
    }

    // Status validation
    const validStatuses: ProjectStatus[] = ['planned', 'in-progress', 'blocked', 'done', 'archived'];
    if (!data.status || !validStatuses.includes(data.status)) {
      errors.push('Status must be one of: planned, in-progress, blocked, done, archived');
    }

    // Budget validation
    if (data.budget_nzd) {
      if (!NZCurrency.validate(data.budget_nzd)) {
        errors.push('Budget must be a valid NZD amount (e.g., "1,234.56")');
      }
    }

    // Financial treatment validation
    const validTreatments: FinancialTreatment[] = ['CAPEX', 'OPEX'];
    if (data.financial_treatment && !validTreatments.includes(data.financial_treatment)) {
      errors.push('Financial treatment must be either CAPEX or OPEX');
    }

    // PM name validation
    if (data.pm_name && data.pm_name.trim().length > 100) {
      errors.push('PM name must be 100 characters or less');
    }

    // Description validation
    if (data.description && data.description.trim().length > 1000) {
      errors.push('Description must be 1000 characters or less');
    }

    // Lane validation
    if (data.lane && data.lane.trim().length > 100) {
      errors.push('Lane must be 100 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Creates a new project with validation and audit logging
   */
  createProject(data: CreateProjectRequest): { success: boolean; project?: Project; errors?: string[] } {
    const validation = this.validateProject(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    try {
      const id = `PROJ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const now = new Date().toISOString();
      
      // Convert budget to cents
      const budgetCents = data.budget_nzd ? NZCurrency.parseToCents(data.budget_nzd) : 0;
      
      // Convert dates to ISO for database indexing
      const startDateISO = NZDate.toISO(data.start_date);
      const endDateISO = NZDate.toISO(data.end_date);

      const projectData = [
        id,
        data.title.trim(),
        data.description?.trim() || '',
        data.lane?.trim() || '',
        data.start_date,
        data.end_date,
        startDateISO,
        endDateISO,
        data.status,
        data.pm_name?.trim() || '',
        budgetCents,
        data.financial_treatment || 'CAPEX',
        data.row || null,
        now,
        now
      ];

      this.db.transaction(() => {
        this.createStmt.run(...projectData);
        
        // Log audit event
        this.logAuditEvent({
          type: 'CREATE',
          entity_type: 'project',
          entity_id: id,
          action: 'create_project',
          payload: JSON.stringify({
            title: data.title,
            status: data.status,
            start_date: data.start_date,
            end_date: data.end_date,
            budget_cents: budgetCents
          })
        });
      })();

      const project = this.getByIdStmt.get(id) as Project;
      return { success: true, project };

    } catch (error: any) {
      console.error('Failed to create project:', error);
      return { 
        success: false, 
        errors: [`Database error: ${error.message}`] 
      };
    }
  }

  /**
   * Validates update data (only validates provided fields)
   */
  private validateUpdateData(data: UpdateProjectRequest): ProjectValidationResult {
    const errors: string[] = [];

    // Only validate fields that are provided
    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        errors.push('Project title is required');
      } else if (data.title.trim().length > 200) {
        errors.push('Project title must be 200 characters or less');
      }
    }

    if (data.start_date !== undefined) {
      if (!NZDate.validate(data.start_date)) {
        errors.push('Start date must be in DD-MM-YYYY format');
      }
    }

    if (data.end_date !== undefined) {
      if (!NZDate.validate(data.end_date)) {
        errors.push('End date must be in DD-MM-YYYY format');
      }
    }

    // Date range validation (only if both dates are provided or we need to check against existing)
    if (data.start_date && data.end_date) {
      if (NZDate.validate(data.start_date) && NZDate.validate(data.end_date)) {
        try {
          const startDate = NZDate.parse(data.start_date);
          const endDate = NZDate.parse(data.end_date);
          if (endDate <= startDate) {
            errors.push('End date must be after start date');
          }
        } catch (error) {
          errors.push('Invalid date range');
        }
      }
    }

    if (data.status !== undefined) {
      const validStatuses: ProjectStatus[] = ['planned', 'in-progress', 'blocked', 'done', 'archived'];
      if (!validStatuses.includes(data.status)) {
        errors.push('Status must be one of: planned, in-progress, blocked, done, archived');
      }
    }

    if (data.budget_nzd !== undefined) {
      if (!NZCurrency.validate(data.budget_nzd)) {
        errors.push('Budget must be a valid NZD amount (e.g., "1,234.56")');
      }
    }

    if (data.financial_treatment !== undefined) {
      const validTreatments: FinancialTreatment[] = ['CAPEX', 'OPEX'];
      if (!validTreatments.includes(data.financial_treatment)) {
        errors.push('Financial treatment must be either CAPEX or OPEX');
      }
    }

    if (data.pm_name !== undefined && data.pm_name.trim().length > 100) {
      errors.push('PM name must be 100 characters or less');
    }

    if (data.description !== undefined && data.description.trim().length > 1000) {
      errors.push('Description must be 1000 characters or less');
    }

    if (data.lane !== undefined && data.lane.trim().length > 100) {
      errors.push('Lane must be 100 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Updates an existing project with validation
   */
  updateProject(data: UpdateProjectRequest): { success: boolean; project?: Project; errors?: string[] } {
    try {
      const existing = this.getByIdStmt.get(data.id) as Project;
      if (!existing) {
        return { success: false, errors: ['Project not found'] };
      }

      const validation = this.validateUpdateData(data);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const now = new Date().toISOString();
      
      // Use existing values for fields not being updated
      const budgetCents = data.budget_nzd ? 
        NZCurrency.parseToCents(data.budget_nzd) : 
        existing.budget_cents;
      
      const startDateISO = data.start_date ? NZDate.toISO(data.start_date) : NZDate.toISO(existing.start_date);
      const endDateISO = data.end_date ? NZDate.toISO(data.end_date) : NZDate.toISO(existing.end_date);

      const updateData = [
        data.title?.trim() || existing.title,
        data.description?.trim() ?? existing.description,
        data.lane?.trim() ?? existing.lane,
        data.start_date || existing.start_date,
        data.end_date || existing.end_date,
        startDateISO,
        endDateISO,
        data.status || existing.status,
        data.pm_name?.trim() ?? existing.pm_name,
        budgetCents,
        data.financial_treatment || existing.financial_treatment,
        data.row ?? existing.row,
        now,
        data.id
      ];

      this.db.transaction(() => {
        this.updateStmt.run(...updateData);
        
        // Log audit event
        this.logAuditEvent({
          type: 'UPDATE',
          entity_type: 'project',
          entity_id: data.id,
          action: 'update_project',
          payload: JSON.stringify({
            changed_fields: Object.keys(data).filter(k => k !== 'id'),
            title: data.title || existing.title
          })
        });
      })();

      const project = this.getByIdStmt.get(data.id) as Project;
      return { success: true, project };

    } catch (error: any) {
      console.error('Failed to update project:', error);
      return { 
        success: false, 
        errors: [`Database error: ${error.message}`] 
      };
    }
  }

  /**
   * Gets a project by ID
   */
  getProjectById(id: string): Project | null {
    try {
      return this.getByIdStmt.get(id) as Project || null;
    } catch (error) {
      console.error('Failed to get project by ID:', error);
      return null;
    }
  }

  /**
   * Gets all projects ordered by start date
   */
  getAllProjects(): Project[] {
    try {
      return this.getAllStmt.all() as Project[];
    } catch (error) {
      console.error('Failed to get all projects:', error);
      return [];
    }
  }

  /**
   * Deletes a project and all related entities
   */
  deleteProject(id: string): { success: boolean; errors?: string[] } {
    try {
      const existing = this.getByIdStmt.get(id) as Project;
      if (!existing) {
        return { success: false, errors: ['Project not found'] };
      }

      this.db.transaction(() => {
        this.deleteStmt.run(id);
        
        // Log audit event
        this.logAuditEvent({
          type: 'DELETE',
          entity_type: 'project',
          entity_id: id,
          action: 'delete_project',
          payload: JSON.stringify({
            title: existing.title,
            status: existing.status
          })
        });
      })();

      return { success: true };

    } catch (error: any) {
      console.error('Failed to delete project:', error);
      return { 
        success: false, 
        errors: [`Database error: ${error.message}`] 
      };
    }
  }

  /**
   * Gets projects with optional filtering
   */
  getProjectsByStatus(status: ProjectStatus): Project[] {
    try {
      const stmt = this.db.prepare(`
        SELECT id, title, description, lane, 
               start_date_nz as start_date, end_date_nz as end_date,
               status, pm_name, budget_cents, financial_treatment, row,
               created_at, updated_at
        FROM projects 
        WHERE status = ?
        ORDER BY start_date_iso
      `);
      return stmt.all(status) as Project[];
    } catch (error) {
      console.error('Failed to get projects by status:', error);
      return [];
    }
  }

  /**
   * Gets project statistics
   */
  getProjectStats(): {
    total: number;
    by_status: Record<ProjectStatus, number>;
    total_budget_cents: number;
  } {
    try {
      const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM projects');
      const statusStmt = this.db.prepare(`
        SELECT status, COUNT(*) as count, SUM(budget_cents) as total_budget
        FROM projects 
        GROUP BY status
      `);
      
      const total = (totalStmt.get() as any).count;
      const statusResults = statusStmt.all() as any[];
      
      const by_status: Record<ProjectStatus, number> = {
        'planned': 0,
        'in-progress': 0,
        'blocked': 0,
        'done': 0,
        'archived': 0
      };
      
      let total_budget_cents = 0;
      
      statusResults.forEach(row => {
        by_status[row.status as ProjectStatus] = row.count;
        total_budget_cents += row.total_budget || 0;
      });

      return { total, by_status, total_budget_cents };
      
    } catch (error) {
      console.error('Failed to get project stats:', error);
      return {
        total: 0,
        by_status: { 'planned': 0, 'in-progress': 0, 'blocked': 0, 'done': 0, 'archived': 0 },
        total_budget_cents: 0
      };
    }
  }

  /**
   * Logs audit events for project operations
   */
  private logAuditEvent(event: {
    type: string;
    entity_type: string;
    entity_id: string;
    action: string;
    payload: string;
  }) {
    try {
      const auditStmt = this.db.prepare(`
        INSERT INTO audit_events (
          id, ts, user, type, payload, module, component, action,
          entity_type, entity_id, route, source, session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const id = `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const now = new Date().toISOString();

      auditStmt.run(
        id, now, 'system', event.type, event.payload,
        'core', 'ProjectService', event.action,
        event.entity_type, event.entity_id,
        null, 'main-process', null
      );
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging failures shouldn't break operations
    }
  }
}