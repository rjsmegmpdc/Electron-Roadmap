import { DB } from '../db';
import { NZDate } from '../../renderer/utils/validation';

export type TaskStatus = 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  start_date: string; // DD-MM-YYYY format
  end_date: string;   // DD-MM-YYYY format
  effort_hours: number;
  status: TaskStatus;
  assigned_resources: string[]; // Array of resource names/IDs
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  project_id: string;
  title: string;
  start_date: string; // DD-MM-YYYY
  end_date: string;   // DD-MM-YYYY
  effort_hours?: number;
  status: TaskStatus;
  assigned_resources?: string[];
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
}

export interface TaskValidationResult {
  isValid: boolean;
  errors: string[];
}

export class TaskService {
  private db: DB;
  private createStmt: any;
  private updateStmt: any;
  private getByIdStmt: any;
  private getAllStmt: any;
  private getByProjectIdStmt: any;
  private deleteStmt: any;

  constructor(db: DB) {
    this.db = db;
    this.initializeStatements();
  }

  private initializeStatements() {
    this.createStmt = this.db.prepare(`
      INSERT INTO tasks (
        id, project_id, title, 
        start_date_nz, end_date_nz, start_date_iso, end_date_iso,
        effort_hours, status, assigned_resources,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?
      )
    `);

    this.updateStmt = this.db.prepare(`
      UPDATE tasks SET
        project_id = ?, title = ?,
        start_date_nz = ?, end_date_nz = ?, start_date_iso = ?, end_date_iso = ?,
        effort_hours = ?, status = ?, assigned_resources = ?,
        updated_at = ?
      WHERE id = ?
    `);

    this.getByIdStmt = this.db.prepare(`
      SELECT id, project_id, title, 
             start_date_nz as start_date, end_date_nz as end_date,
             effort_hours, status, assigned_resources,
             created_at, updated_at
      FROM tasks 
      WHERE id = ?
    `);

    this.getAllStmt = this.db.prepare(`
      SELECT id, project_id, title, 
             start_date_nz as start_date, end_date_nz as end_date,
             effort_hours, status, assigned_resources,
             created_at, updated_at
      FROM tasks 
      ORDER BY start_date_iso
    `);

    this.getByProjectIdStmt = this.db.prepare(`
      SELECT id, project_id, title, 
             start_date_nz as start_date, end_date_nz as end_date,
             effort_hours, status, assigned_resources,
             created_at, updated_at
      FROM tasks 
      WHERE project_id = ?
      ORDER BY start_date_iso
    `);

    this.deleteStmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
  }

  /**
   * Validates task data for creation (all fields required)
   */
  validateTaskForCreate(data: CreateTaskRequest): TaskValidationResult {
    const errors: string[] = [];

    // Project ID validation (required for create)
    if (!data.project_id || data.project_id.trim().length === 0) {
      errors.push('Project ID is required');
    }

    // Title validation (required for create)
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Task title is required');
    } else if (data.title.trim().length > 200) {
      errors.push('Task title must be 200 characters or less');
    }

    // Date validation (required for create)
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

    // Status validation (required for create)
    const validStatuses: TaskStatus[] = ['planned', 'in-progress', 'blocked', 'done', 'archived'];
    if (!data.status || !validStatuses.includes(data.status)) {
      errors.push('Status must be one of: planned, in-progress, blocked, done, archived');
    }

    // Effort hours validation
    if (data.effort_hours !== undefined) {
      if (data.effort_hours < 0) {
        errors.push('Effort hours cannot be negative');
      } else if (data.effort_hours > 10000) {
        errors.push('Effort hours cannot exceed 10,000 hours');
      }
    }

    // Assigned resources validation
    if (data.assigned_resources) {
      if (!Array.isArray(data.assigned_resources)) {
        errors.push('Assigned resources must be an array');
      } else if (data.assigned_resources.length > 20) {
        errors.push('Cannot assign more than 20 resources to a task');
      } else {
        // Check each resource name
        for (let i = 0; i < data.assigned_resources.length; i++) {
          const resource = data.assigned_resources[i];
          if (!resource || typeof resource !== 'string' || resource.trim().length === 0) {
            errors.push(`Resource at position ${i + 1} must be a non-empty string`);
          } else if (resource.trim().length > 100) {
            errors.push(`Resource name at position ${i + 1} must be 100 characters or less`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates task data for updates (only validates provided fields)
   */
  validateTaskForUpdate(data: UpdateTaskRequest, existing: any): TaskValidationResult {
    const errors: string[] = [];

    // Project ID validation (if provided)
    if (data.project_id !== undefined) {
      if (!data.project_id || data.project_id.trim().length === 0) {
        errors.push('Project ID is required');
      }
    }

    // Title validation (if provided)
    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        errors.push('Task title is required');
      } else if (data.title.trim().length > 200) {
        errors.push('Task title must be 200 characters or less');
      }
    }

    // Date validation (if provided)
    if (data.start_date !== undefined) {
      if (!data.start_date || !NZDate.validate(data.start_date)) {
        errors.push('Start date must be in DD-MM-YYYY format');
      }
    }
    if (data.end_date !== undefined) {
      if (!data.end_date || !NZDate.validate(data.end_date)) {
        errors.push('End date must be in DD-MM-YYYY format');
      }
    }

    // Date range validation (use final values after merge)
    const finalStartDate = data.start_date || existing.start_date;
    const finalEndDate = data.end_date || existing.end_date;
    if (finalStartDate && finalEndDate && 
        NZDate.validate(finalStartDate) && NZDate.validate(finalEndDate)) {
      try {
        const startDate = NZDate.parse(finalStartDate);
        const endDate = NZDate.parse(finalEndDate);
        if (endDate <= startDate) {
          errors.push('End date must be after start date');
        }
      } catch (error) {
        errors.push('Invalid date range');
      }
    }

    // Status validation (if provided)
    if (data.status !== undefined) {
      const validStatuses: TaskStatus[] = ['planned', 'in-progress', 'blocked', 'done', 'archived'];
      if (!data.status || !validStatuses.includes(data.status)) {
        errors.push('Status must be one of: planned, in-progress, blocked, done, archived');
      }
    }

    // Effort hours validation (if provided)
    if (data.effort_hours !== undefined) {
      if (data.effort_hours < 0) {
        errors.push('Effort hours cannot be negative');
      } else if (data.effort_hours > 10000) {
        errors.push('Effort hours cannot exceed 10,000 hours');
      }
    }

    // Assigned resources validation (if provided)
    if (data.assigned_resources !== undefined) {
      if (!Array.isArray(data.assigned_resources)) {
        errors.push('Assigned resources must be an array');
      } else if (data.assigned_resources.length > 20) {
        errors.push('Cannot assign more than 20 resources to a task');
      } else {
        // Check each resource name
        for (let i = 0; i < data.assigned_resources.length; i++) {
          const resource = data.assigned_resources[i];
          if (!resource || typeof resource !== 'string' || resource.trim().length === 0) {
            errors.push(`Resource at position ${i + 1} must be a non-empty string`);
          } else if (resource.trim().length > 100) {
            errors.push(`Resource name at position ${i + 1} must be 100 characters or less`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Legacy validation method for backwards compatibility
   */
  validateTask(data: CreateTaskRequest | UpdateTaskRequest): TaskValidationResult {
    // For create operations, validate all required fields
    if ('id' in data && data.id) {
      // This is an update - we need the existing data to validate properly
      // For now, just do basic validation
      return this.validateTaskForCreate(data as CreateTaskRequest);
    } else {
      // This is a create operation
      return this.validateTaskForCreate(data as CreateTaskRequest);
    }
  }

  /**
   * Validates that a project exists for task operations
   */
  private validateProjectExists(projectId: string): boolean {
    try {
      const projectStmt = this.db.prepare('SELECT id FROM projects WHERE id = ?');
      const project = projectStmt.get(projectId);
      return !!project;
    } catch (error) {
      console.error('Error validating project existence:', error);
      return false;
    }
  }

  /**
   * Creates a new task with validation and audit logging
   */
  createTask(data: CreateTaskRequest): { success: boolean; task?: Task; errors?: string[] } {
    const validation = this.validateTaskForCreate(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // Validate project exists
    if (!this.validateProjectExists(data.project_id)) {
      return { success: false, errors: ['Project not found'] };
    }

    try {
      const id = `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const now = new Date().toISOString();
      
      // Convert dates to ISO for database indexing
      const startDateISO = NZDate.toISO(data.start_date);
      const endDateISO = NZDate.toISO(data.end_date);
      
      // Serialize assigned resources as JSON
      const assignedResourcesJson = JSON.stringify(data.assigned_resources || []);

      const taskData = [
        id,
        data.project_id,
        data.title.trim(),
        data.start_date,
        data.end_date,
        startDateISO,
        endDateISO,
        data.effort_hours || 0,
        data.status,
        assignedResourcesJson,
        now,
        now
      ];

      this.db.transaction(() => {
        this.createStmt.run(...taskData);
        
        // Log audit event
        this.logAuditEvent({
          type: 'CREATE',
          entity_type: 'task',
          entity_id: id,
          action: 'create_task',
          payload: JSON.stringify({
            project_id: data.project_id,
            title: data.title,
            status: data.status,
            start_date: data.start_date,
            end_date: data.end_date,
            effort_hours: data.effort_hours || 0
          })
        });
      })();

      const task = this.getTaskById(id);
      return { success: true, task: task! };

    } catch (error: any) {
      console.error('Failed to create task:', error);
      return { 
        success: false, 
        errors: [`Database error: ${error.message}`] 
      };
    }
  }

  /**
   * Updates an existing task with validation
   */
  updateTask(data: UpdateTaskRequest): { success: boolean; task?: Task; errors?: string[] } {
    try {
      const existing = this.getByIdStmt.get(data.id);
      if (!existing) {
        return { success: false, errors: ['Task not found'] };
      }

      // Validate update data with existing task context
      const validation = this.validateTaskForUpdate(data, existing);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Validate project exists if changing project
      if (data.project_id && data.project_id !== existing.project_id) {
        if (!this.validateProjectExists(data.project_id)) {
          return { success: false, errors: ['Project not found'] };
        }
      }

      const now = new Date().toISOString();
      
      // Use existing values for fields not being updated
      const startDate = data.start_date || existing.start_date;
      const endDate = data.end_date || existing.end_date;
      const startDateISO = NZDate.toISO(startDate);
      const endDateISO = NZDate.toISO(endDate);
      
      // Parse existing assigned resources or use new ones
      let existingResources = [];
      try {
        existingResources = JSON.parse(existing.assigned_resources || '[]');
      } catch (e) {
        existingResources = [];
      }
      
      const assignedResourcesJson = JSON.stringify(
        data.assigned_resources !== undefined ? data.assigned_resources : existingResources
      );

      const updateData = [
        data.project_id || existing.project_id,
        data.title?.trim() || existing.title,
        startDate,
        endDate,
        startDateISO,
        endDateISO,
        data.effort_hours !== undefined ? data.effort_hours : existing.effort_hours,
        data.status || existing.status,
        assignedResourcesJson,
        now,
        data.id
      ];

      this.db.transaction(() => {
        this.updateStmt.run(...updateData);
        
        // Log audit event
        this.logAuditEvent({
          type: 'UPDATE',
          entity_type: 'task',
          entity_id: data.id,
          action: 'update_task',
          payload: JSON.stringify({
            changed_fields: Object.keys(data).filter(k => k !== 'id'),
            title: data.title || existing.title,
            project_id: data.project_id || existing.project_id
          })
        });
      })();

      const task = this.getTaskById(data.id);
      return { success: true, task: task! };

    } catch (error: any) {
      console.error('Failed to update task:', error);
      return { 
        success: false, 
        errors: [`Database error: ${error.message}`] 
      };
    }
  }

  /**
   * Gets a task by ID with parsed assigned resources
   */
  getTaskById(id: string): Task | null {
    try {
      const raw = this.getByIdStmt.get(id);
      if (!raw) return null;

      return this.parseTaskFromDB(raw);
    } catch (error) {
      console.error('Failed to get task by ID:', error);
      return null;
    }
  }

  /**
   * Gets all tasks ordered by start date
   */
  getAllTasks(): Task[] {
    try {
      const rawTasks = this.getAllStmt.all();
      return rawTasks.map((task: any) => this.parseTaskFromDB(task));
    } catch (error) {
      console.error('Failed to get all tasks:', error);
      return [];
    }
  }

  /**
   * Gets all tasks for a specific project
   */
  getTasksByProjectId(projectId: string): Task[] {
    try {
      const rawTasks = this.getByProjectIdStmt.all(projectId);
      return rawTasks.map((task: any) => this.parseTaskFromDB(task));
    } catch (error) {
      console.error('Failed to get tasks by project ID:', error);
      return [];
    }
  }

  /**
   * Deletes a task
   */
  deleteTask(id: string): { success: boolean; errors?: string[] } {
    try {
      const existing = this.getByIdStmt.get(id);
      if (!existing) {
        return { success: false, errors: ['Task not found'] };
      }

      this.db.transaction(() => {
        this.deleteStmt.run(id);
        
        // Log audit event
        this.logAuditEvent({
          type: 'DELETE',
          entity_type: 'task',
          entity_id: id,
          action: 'delete_task',
          payload: JSON.stringify({
            title: existing.title,
            project_id: existing.project_id,
            status: existing.status
          })
        });
      })();

      return { success: true };

    } catch (error: any) {
      console.error('Failed to delete task:', error);
      return { 
        success: false, 
        errors: [`Database error: ${error.message}`] 
      };
    }
  }

  /**
   * Gets tasks with optional filtering by status
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    try {
      const stmt = this.db.prepare(`
        SELECT id, project_id, title, 
               start_date_nz as start_date, end_date_nz as end_date,
               effort_hours, status, assigned_resources,
               created_at, updated_at
        FROM tasks 
        WHERE status = ?
        ORDER BY start_date_iso
      `);
      const rawTasks = stmt.all(status);
      return rawTasks.map(task => this.parseTaskFromDB(task));
    } catch (error) {
      console.error('Failed to get tasks by status:', error);
      return [];
    }
  }

  /**
   * Gets task statistics
   */
  getTaskStats(): {
    total: number;
    by_status: Record<TaskStatus, number>;
    total_effort_hours: number;
  } {
    try {
      const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM tasks');
      const statusStmt = this.db.prepare(`
        SELECT status, COUNT(*) as count, SUM(effort_hours) as total_effort
        FROM tasks 
        GROUP BY status
      `);
      
      const total = (totalStmt.get() as any).count;
      const statusResults = statusStmt.all() as any[];
      
      const by_status: Record<TaskStatus, number> = {
        'planned': 0,
        'in-progress': 0,
        'blocked': 0,
        'done': 0,
        'archived': 0
      };
      
      let total_effort_hours = 0;
      
      statusResults.forEach(row => {
        by_status[row.status as TaskStatus] = row.count;
        total_effort_hours += row.total_effort || 0;
      });

      return { total, by_status, total_effort_hours };
      
    } catch (error) {
      console.error('Failed to get task stats:', error);
      return {
        total: 0,
        by_status: { 'planned': 0, 'in-progress': 0, 'blocked': 0, 'done': 0, 'archived': 0 },
        total_effort_hours: 0
      };
    }
  }

  /**
   * Parse task from database row, handling JSON fields
   */
  private parseTaskFromDB(raw: any): Task {
    let assignedResources = [];
    try {
      assignedResources = JSON.parse(raw.assigned_resources || '[]');
    } catch (e) {
      assignedResources = [];
    }

    return {
      id: raw.id,
      project_id: raw.project_id,
      title: raw.title,
      start_date: raw.start_date,
      end_date: raw.end_date,
      effort_hours: raw.effort_hours,
      status: raw.status,
      assigned_resources: assignedResources,
      created_at: raw.created_at,
      updated_at: raw.updated_at
    };
  }

  /**
   * Logs audit events for task operations
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
        'core', 'TaskService', event.action,
        event.entity_type, event.entity_id,
        null, 'main-process', null
      );
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging failures shouldn't break operations
    }
  }
}