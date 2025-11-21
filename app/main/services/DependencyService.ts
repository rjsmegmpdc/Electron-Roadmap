import { DB } from '../db';

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';
export type EntityType = 'project' | 'task';

export interface Dependency {
  id: string;
  from_type: EntityType;
  from_id: string;
  to_type: EntityType;
  to_id: string;
  kind: DependencyType;
  lag_days: number;
  note: string;
  created_at: string;
}

export interface CreateDependencyRequest {
  from_type: EntityType;
  from_id: string;
  to_type: EntityType;
  to_id: string;
  kind: DependencyType;
  lag_days?: number;
  note?: string;
}

export interface UpdateDependencyRequest {
  id: string;
  kind?: DependencyType;
  lag_days?: number;
  note?: string;
}

export interface DependencyValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CycleDetectionResult {
  hasCycle: boolean;
  cyclePath?: string[];
}

export class DependencyService {
  private db: DB;
  private createStmt: any;
  private updateStmt: any;
  private getByIdStmt: any;
  private getAllStmt: any;
  private getByFromEntityStmt: any;
  private getByToEntityStmt: any;
  private deleteStmt: any;

  constructor(db: DB) {
    this.db = db;
    this.initializeStatements();
  }

  private initializeStatements() {
    this.createStmt = this.db.prepare(`
      INSERT INTO dependencies (
        id, from_type, from_id, to_type, to_id,
        kind, lag_days, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.updateStmt = this.db.prepare(`
      UPDATE dependencies SET
        kind = ?, lag_days = ?, note = ?
      WHERE id = ?
    `);

    this.getByIdStmt = this.db.prepare(`
      SELECT id, from_type, from_id, to_type, to_id,
             kind, lag_days, note, created_at
      FROM dependencies 
      WHERE id = ?
    `);

    this.getAllStmt = this.db.prepare(`
      SELECT id, from_type, from_id, to_type, to_id,
             kind, lag_days, note, created_at
      FROM dependencies 
      ORDER BY created_at DESC
    `);

    this.getByFromEntityStmt = this.db.prepare(`
      SELECT id, from_type, from_id, to_type, to_id,
             kind, lag_days, note, created_at
      FROM dependencies 
      WHERE from_type = ? AND from_id = ?
      ORDER BY created_at DESC
    `);

    this.getByToEntityStmt = this.db.prepare(`
      SELECT id, from_type, from_id, to_type, to_id,
             kind, lag_days, note, created_at
      FROM dependencies 
      WHERE to_type = ? AND to_id = ?
      ORDER BY created_at DESC
    `);

    this.deleteStmt = this.db.prepare('DELETE FROM dependencies WHERE id = ?');
  }

  /**
   * Validates dependency data
   */
  validateDependency(data: CreateDependencyRequest): DependencyValidationResult {
    const errors: string[] = [];

    // From entity validation
    if (!data.from_type || !['project', 'task'].includes(data.from_type)) {
      errors.push('From type must be either "project" or "task"');
    }
    if (!data.from_id || data.from_id.trim().length === 0) {
      errors.push('From ID is required');
    }

    // To entity validation
    if (!data.to_type || !['project', 'task'].includes(data.to_type)) {
      errors.push('To type must be either "project" or "task"');
    }
    if (!data.to_id || data.to_id.trim().length === 0) {
      errors.push('To ID is required');
    }

    // Self-dependency validation
    if (data.from_type === data.to_type && data.from_id === data.to_id) {
      errors.push('Cannot create a dependency from an entity to itself');
    }

    // Dependency kind validation
    const validKinds: DependencyType[] = ['FS', 'SS', 'FF', 'SF'];
    if (!data.kind || !validKinds.includes(data.kind)) {
      errors.push('Dependency kind must be one of: FS (Finish-to-Start), SS (Start-to-Start), FF (Finish-to-Finish), SF (Start-to-Finish)');
    }

    // Lag days validation
    if (data.lag_days !== undefined) {
      if (typeof data.lag_days !== 'number') {
        errors.push('Lag days must be a number');
      } else if (data.lag_days < -365) {
        errors.push('Lag days cannot be less than -365 days');
      } else if (data.lag_days > 365) {
        errors.push('Lag days cannot be more than 365 days');
      }
    }

    // Note validation
    if (data.note && data.note.trim().length > 500) {
      errors.push('Note must be 500 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Checks if entities exist before creating dependencies
   */
  private validateEntitiesExist(fromType: EntityType, fromId: string, toType: EntityType, toId: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Check from entity
      if (fromType === 'project') {
        const fromStmt = this.db.prepare('SELECT id FROM projects WHERE id = ?');
        const fromEntity = fromStmt.get(fromId);
        if (!fromEntity) {
          errors.push(`Source project "${fromId}" not found`);
        }
      } else if (fromType === 'task') {
        const fromStmt = this.db.prepare('SELECT id FROM tasks WHERE id = ?');
        const fromEntity = fromStmt.get(fromId);
        if (!fromEntity) {
          errors.push(`Source task "${fromId}" not found`);
        }
      }

      // Check to entity
      if (toType === 'project') {
        const toStmt = this.db.prepare('SELECT id FROM projects WHERE id = ?');
        const toEntity = toStmt.get(toId);
        if (!toEntity) {
          errors.push(`Target project "${toId}" not found`);
        }
      } else if (toType === 'task') {
        const toStmt = this.db.prepare('SELECT id FROM tasks WHERE id = ?');
        const toEntity = toStmt.get(toId);
        if (!toEntity) {
          errors.push(`Target task "${toId}" not found`);
        }
      }
    } catch (error) {
      console.error('Error validating entities exist:', error);
      errors.push('Error validating entity existence');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Checks if a dependency already exists between two entities with the same kind
   */
  private checkDuplicateDependency(fromType: EntityType, fromId: string, toType: EntityType, toId: string, kind: DependencyType): boolean {
    try {
      const stmt = this.db.prepare(`
        SELECT id FROM dependencies 
        WHERE from_type = ? AND from_id = ? AND to_type = ? AND to_id = ? AND kind = ?
      `);
      const existing = stmt.get(fromType, fromId, toType, toId, kind);
      return !!existing;
    } catch (error) {
      console.error('Error checking duplicate dependency:', error);
      return false;
    }
  }

  /**
   * Detects cycles in the dependency graph using depth-first search
   */
  detectCycle(fromType: EntityType, fromId: string, toType: EntityType, toId: string): CycleDetectionResult {
    try {
      // Create a temporary dependency to test for cycles
      const testDependency = { from_type: fromType, from_id: fromId, to_type: toType, to_id: toId };
      
      // Get all existing dependencies
      const allDeps = this.getAllStmt.all();
      
      // Add the test dependency to the list
      const depsWithTest = [...allDeps, testDependency];
      
      // Build adjacency list
      const graph = new Map<string, Set<string>>();
      
      for (const dep of depsWithTest) {
        const fromKey = `${dep.from_type}:${dep.from_id}`;
        const toKey = `${dep.to_type}:${dep.to_id}`;
        
        if (!graph.has(fromKey)) {
          graph.set(fromKey, new Set());
        }
        graph.get(fromKey)!.add(toKey);
      }
      
      // DFS to detect cycles
      const visited = new Set<string>();
      const recStack = new Set<string>();
      const path: string[] = [];
      
      const dfs = (node: string): boolean => {
        visited.add(node);
        recStack.add(node);
        path.push(node);
        
        const neighbors = graph.get(node) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            if (dfs(neighbor)) {
              return true;
            }
          } else if (recStack.has(neighbor)) {
            // Cycle detected - find the cycle path
            const cycleStart = path.indexOf(neighbor);
            const cyclePath = path.slice(cycleStart);
            cyclePath.push(neighbor); // Complete the cycle
            return true;
          }
        }
        
        recStack.delete(node);
        path.pop();
        return false;
      };
      
      // Check all nodes for cycles
      for (const node of graph.keys()) {
        if (!visited.has(node)) {
          if (dfs(node)) {
            return { hasCycle: true, cyclePath: path.slice() };
          }
        }
      }
      
      return { hasCycle: false };
    } catch (error) {
      console.error('Error detecting cycle:', error);
      // If there's an error in cycle detection, be conservative and assume no cycle
      return { hasCycle: false };
    }
  }

  /**
   * Creates a new dependency with validation and cycle detection
   */
  createDependency(data: CreateDependencyRequest): { success: boolean; dependency?: Dependency; errors?: string[] } {
    // Validate input data
    const validation = this.validateDependency(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // Validate entities exist
    const entityValidation = this.validateEntitiesExist(data.from_type, data.from_id, data.to_type, data.to_id);
    if (!entityValidation.valid) {
      return { success: false, errors: entityValidation.errors };
    }

    // Check for duplicate dependency
    if (this.checkDuplicateDependency(data.from_type, data.from_id, data.to_type, data.to_id, data.kind)) {
      return { success: false, errors: ['A dependency of this type already exists between these entities'] };
    }

    // Check for cycles
    const cycleCheck = this.detectCycle(data.from_type, data.from_id, data.to_type, data.to_id);
    if (cycleCheck.hasCycle) {
      const cyclePath = cycleCheck.cyclePath?.join(' -> ') || 'unknown path';
      return { success: false, errors: [`Creating this dependency would create a cycle: ${cyclePath}`] };
    }

    try {
      const id = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const now = new Date().toISOString();

      const dependencyData = [
        id,
        data.from_type,
        data.from_id,
        data.to_type,
        data.to_id,
        data.kind,
        data.lag_days || 0,
        data.note?.trim() || '',
        now
      ];

      this.db.transaction(() => {
        this.createStmt.run(...dependencyData);
        
        // Log audit event
        this.logAuditEvent({
          type: 'CREATE',
          entity_type: 'dependency',
          entity_id: id,
          action: 'create_dependency',
          payload: JSON.stringify({
            from: `${data.from_type}:${data.from_id}`,
            to: `${data.to_type}:${data.to_id}`,
            kind: data.kind,
            lag_days: data.lag_days || 0
          })
        });
      })();

      const dependency = this.getDependencyById(id);
      return { success: true, dependency: dependency! };

    } catch (error: any) {
      console.error('Failed to create dependency:', error);
      
      // Handle unique constraint violation specifically
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return { success: false, errors: ['A dependency of this type already exists between these entities'] };
      }
      
      return { 
        success: false, 
        errors: [`Database error: ${error.message}`] 
      };
    }
  }

  /**
   * Updates an existing dependency
   */
  updateDependency(data: UpdateDependencyRequest): { success: boolean; dependency?: Dependency; errors?: string[] } {
    try {
      const existing = this.getByIdStmt.get(data.id);
      if (!existing) {
        return { success: false, errors: ['Dependency not found'] };
      }

      // Validate update data
      const errors: string[] = [];
      
      if (data.kind !== undefined) {
        const validKinds: DependencyType[] = ['FS', 'SS', 'FF', 'SF'];
        if (!validKinds.includes(data.kind)) {
          errors.push('Dependency kind must be one of: FS, SS, FF, SF');
        }
      }
      
      if (data.lag_days !== undefined) {
        if (typeof data.lag_days !== 'number') {
          errors.push('Lag days must be a number');
        } else if (data.lag_days < -365 || data.lag_days > 365) {
          errors.push('Lag days must be between -365 and 365 days');
        }
      }
      
      if (data.note !== undefined && data.note.trim().length > 500) {
        errors.push('Note must be 500 characters or less');
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      this.db.transaction(() => {
        this.updateStmt.run(
          data.kind || existing.kind,
          data.lag_days !== undefined ? data.lag_days : existing.lag_days,
          data.note !== undefined ? data.note.trim() : existing.note,
          data.id
        );
        
        // Log audit event
        this.logAuditEvent({
          type: 'UPDATE',
          entity_type: 'dependency',
          entity_id: data.id,
          action: 'update_dependency',
          payload: JSON.stringify({
            changed_fields: Object.keys(data).filter(k => k !== 'id'),
            from: `${existing.from_type}:${existing.from_id}`,
            to: `${existing.to_type}:${existing.to_id}`
          })
        });
      })();

      const dependency = this.getDependencyById(data.id);
      return { success: true, dependency: dependency! };

    } catch (error: any) {
      console.error('Failed to update dependency:', error);
      return { 
        success: false, 
        errors: [`Database error: ${error.message}`] 
      };
    }
  }

  /**
   * Gets a dependency by ID
   */
  getDependencyById(id: string): Dependency | null {
    try {
      return this.getByIdStmt.get(id) as Dependency || null;
    } catch (error) {
      console.error('Failed to get dependency by ID:', error);
      return null;
    }
  }

  /**
   * Gets all dependencies
   */
  getAllDependencies(): Dependency[] {
    try {
      return this.getAllStmt.all() as Dependency[];
    } catch (error) {
      console.error('Failed to get all dependencies:', error);
      return [];
    }
  }

  /**
   * Gets dependencies where the specified entity is the source
   */
  getDependenciesFromEntity(entityType: EntityType, entityId: string): Dependency[] {
    try {
      return this.getByFromEntityStmt.all(entityType, entityId) as Dependency[];
    } catch (error) {
      console.error('Failed to get dependencies from entity:', error);
      return [];
    }
  }

  /**
   * Gets dependencies where the specified entity is the target
   */
  getDependenciesToEntity(entityType: EntityType, entityId: string): Dependency[] {
    try {
      return this.getByToEntityStmt.all(entityType, entityId) as Dependency[];
    } catch (error) {
      console.error('Failed to get dependencies to entity:', error);
      return [];
    }
  }

  /**
   * Gets all dependencies related to an entity (both incoming and outgoing)
   */
  getDependenciesForEntity(entityType: EntityType, entityId: string): {
    outgoing: Dependency[];
    incoming: Dependency[];
    all: Dependency[];
  } {
    const outgoing = this.getDependenciesFromEntity(entityType, entityId);
    const incoming = this.getDependenciesToEntity(entityType, entityId);
    const all = [...outgoing, ...incoming];

    return { outgoing, incoming, all };
  }

  /**
   * Deletes a dependency
   */
  deleteDependency(id: string): { success: boolean; errors?: string[] } {
    try {
      const existing = this.getByIdStmt.get(id);
      if (!existing) {
        return { success: false, errors: ['Dependency not found'] };
      }

      this.db.transaction(() => {
        this.deleteStmt.run(id);
        
        // Log audit event
        this.logAuditEvent({
          type: 'DELETE',
          entity_type: 'dependency',
          entity_id: id,
          action: 'delete_dependency',
          payload: JSON.stringify({
            from: `${existing.from_type}:${existing.from_id}`,
            to: `${existing.to_type}:${existing.to_id}`,
            kind: existing.kind
          })
        });
      })();

      return { success: true };

    } catch (error: any) {
      console.error('Failed to delete dependency:', error);
      return { 
        success: false, 
        errors: [`Database error: ${error.message}`] 
      };
    }
  }

  /**
   * Gets dependency statistics
   */
  getDependencyStats(): {
    total: number;
    by_kind: Record<DependencyType, number>;
    by_entity_type: { 
      'project-to-project': number;
      'project-to-task': number;
      'task-to-project': number;
      'task-to-task': number;
    };
  } {
    try {
      const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM dependencies');
      const kindStmt = this.db.prepare(`
        SELECT kind, COUNT(*) as count
        FROM dependencies 
        GROUP BY kind
      `);
      const typeStmt = this.db.prepare(`
        SELECT 
          (from_type || '-to-' || to_type) as type_combo,
          COUNT(*) as count
        FROM dependencies 
        GROUP BY from_type, to_type
      `);
      
      const total = (totalStmt.get() as any).count;
      const kindResults = kindStmt.all() as any[];
      const typeResults = typeStmt.all() as any[];
      
      const by_kind: Record<DependencyType, number> = {
        'FS': 0,
        'SS': 0,
        'FF': 0,
        'SF': 0
      };
      
      const by_entity_type = {
        'project-to-project': 0,
        'project-to-task': 0,
        'task-to-project': 0,
        'task-to-task': 0
      };
      
      kindResults.forEach(row => {
        by_kind[row.kind as DependencyType] = row.count;
      });
      
      typeResults.forEach(row => {
        const key = row.type_combo as keyof typeof by_entity_type;
        if (key in by_entity_type) {
          by_entity_type[key] = row.count;
        }
      });

      return { total, by_kind, by_entity_type };
      
    } catch (error) {
      console.error('Failed to get dependency stats:', error);
      return {
        total: 0,
        by_kind: { 'FS': 0, 'SS': 0, 'FF': 0, 'SF': 0 },
        by_entity_type: {
          'project-to-project': 0,
          'project-to-task': 0,
          'task-to-project': 0,
          'task-to-task': 0
        }
      };
    }
  }

  /**
   * Logs audit events for dependency operations
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
        'core', 'DependencyService', event.action,
        event.entity_type, event.entity_id,
        null, 'main-process', null
      );
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging failures shouldn't break operations
    }
  }
}