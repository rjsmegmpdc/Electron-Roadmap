import type { DB } from './db';
import { parseNZDateToISO, parseNZDToCents } from './validation';

// Mutation types
export interface ProjectCreatePayload {
  id: string;
  title: string;
  description?: string;
  lane?: string;
  start_date: string; // NZ format DD-MM-YYYY
  end_date: string;   // NZ format DD-MM-YYYY
  status: string;
  pm_name?: string;
  budget_nzd: number | string;
  financial_treatment?: string;
  row?: number;
}

export interface ProjectUpdatePayload {
  id: string;
  newId?: string; // For changing project ID
  title?: string;
  description?: string;
  lane?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  pm_name?: string;
  budget_nzd?: number | string;
  financial_treatment?: string;
  row?: number;
}

export interface TaskCreatePayload {
  id: string;
  project_id: string;
  title: string;
  start_date: string; // NZ format DD-MM-YYYY
  end_date: string;   // NZ format DD-MM-YYYY
  effort_hours?: number;
  status: string;
  assigned_resources?: string[];
}

export interface TaskUpdatePayload {
  id: string;
  project_id?: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  effort_hours?: number;
  status?: string;
  assigned_resources?: string[];
}

export interface DependencyCreatePayload {
  id: string;
  from_type: string;
  from_id: string;
  to_type: string;
  to_id: string;
  kind: string;
  lag_days?: number;
  note?: string;
}

export interface EpicCreatePayload {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  state?: string;
  effort?: number;
  business_value?: number;
  time_criticality?: number;
  start_date?: string;
  end_date?: string;
  assigned_to?: string;
  area_path?: string;
  iteration_path?: string;
  risk?: string;
  value_area?: string;
  parent_feature?: string;
  sort_order?: number;
}

export interface EpicUpdatePayload {
  id: string;
  title?: string;
  description?: string;
  state?: string;
  effort?: number;
  business_value?: number;
  time_criticality?: number;
  start_date?: string;
  end_date?: string;
  assigned_to?: string;
  area_path?: string;
  iteration_path?: string;
  risk?: string;
  value_area?: string;
  parent_feature?: string;
  sort_order?: number;
}

export interface FeatureCreatePayload {
  id: string;
  epic_id: string;
  project_id: string;
  title: string;
  description?: string;
  state?: string;
  effort?: number;
  business_value?: number;
  time_criticality?: number;
  start_date?: string;
  end_date?: string;
  assigned_to?: string;
  area_path?: string;
  iteration_path?: string;
  risk?: string;
  value_area?: string;
  sort_order?: number;
}

export interface FeatureUpdatePayload {
  id: string;
  title?: string;
  description?: string;
  state?: string;
  effort?: number;
  business_value?: number;
  time_criticality?: number;
  start_date?: string;
  end_date?: string;
  assigned_to?: string;
  area_path?: string;
  iteration_path?: string;
  risk?: string;
  value_area?: string;
  sort_order?: number;
}

// Calendar Module Interfaces
export interface CalendarMonthPayload {
  id?: number;
  year: number;
  month: number;
  days: number;
  working_days: number;
  weekend_days: number;
  public_holidays: number;
  work_hours: number;
  notes?: string;
}

export interface PublicHolidayPayload {
  id?: number;
  name: string;
  start_date: string;
  end_date: string;
  year: number;
  month: number;
  day: number;
  end_year?: number;
  end_month?: number;
  end_day?: number;
  description?: string;
  is_recurring?: boolean;
  source?: string;
}

export function validateMutation(mutation: any) {
  if (!mutation.opId) throw new Error('Missing opId');
  if (!mutation.user) throw new Error('Missing user');
  if (!mutation.type) throw new Error('Missing mutation type');
  if (!mutation.payload) throw new Error('Missing payload');
}

export function applyMutation(db: DB, mutation: any): any {
  const { type, payload } = mutation;
  
  switch (type) {
    case 'project.create':
      return createProject(db, payload);
    case 'project.update':
      return updateProject(db, payload);
    case 'project.delete':
      return deleteProject(db, payload.id);
    case 'task.create':
      return createTask(db, payload);
    case 'task.update':
      return updateTask(db, payload);
    case 'task.delete':
      return deleteTask(db, payload.id);
    case 'epic.create':
      return createEpic(db, payload);
    case 'epic.update':
      return updateEpic(db, payload);
    case 'epic.delete':
      return deleteEpic(db, payload.id);
    case 'feature.create':
      return createFeature(db, payload);
    case 'feature.update':
      return updateFeature(db, payload);
    case 'feature.delete':
      return deleteFeature(db, payload.id);
    case 'dependency.create':
      return createDependency(db, payload);
    case 'dependency.delete':
      return deleteDependency(db, payload.id);
    default:
      throw new Error(`Unknown mutation type: ${type}`);
  }
}

function createProject(db: DB, payload: ProjectCreatePayload) {
  const start_iso = parseNZDateToISO(payload.start_date);
  const end_iso = parseNZDateToISO(payload.end_date);
  const budget_cents = parseNZDToCents(payload.budget_nzd);
  const now = new Date().toISOString();

  const stmt = db.prepare(`INSERT INTO projects (
    id, title, description, lane, 
    start_date_nz, end_date_nz, start_date_iso, end_date_iso,
    status, pm_name, budget_cents, financial_treatment, row,
    created_at, updated_at
  ) VALUES (
    @id, @title, @description, @lane,
    @start_date_nz, @end_date_nz, @start_date_iso, @end_date_iso,
    @status, @pm_name, @budget_cents, @financial_treatment, @row,
    @created_at, @updated_at
  )`);

  const info = stmt.run({
    id: payload.id,
    title: payload.title,
    description: payload.description || '',
    lane: payload.lane || '',
    start_date_nz: payload.start_date,
    end_date_nz: payload.end_date,
    start_date_iso: start_iso,
    end_date_iso: end_iso,
    status: payload.status,
    pm_name: payload.pm_name || '',
    budget_cents,
    financial_treatment: payload.financial_treatment || 'CAPEX',
    row: payload.row || null,
    created_at: now,
    updated_at: now
  });

  return { insertId: info.lastInsertRowid, changes: info.changes };
}

function updateProject(db: DB, payload: ProjectUpdatePayload) {
  const updates: string[] = [];
  const params: any = { id: payload.id, updated_at: new Date().toISOString() };
  
  // Handle ID changes first - this requires special handling since ID is primary key
  if (payload.newId !== undefined && payload.newId !== payload.id) {
    // Check if new ID already exists
    const checkStmt = db.prepare('SELECT id FROM projects WHERE id = @newId');
    const existing = checkStmt.get({ newId: payload.newId });
    if (existing) {
      throw new Error('A project with this ID already exists');
    }
    
    // Update related records first (tasks and dependencies)
    const updateTasksStmt = db.prepare('UPDATE tasks SET project_id = @newId WHERE project_id = @oldId');
    updateTasksStmt.run({ newId: payload.newId, oldId: payload.id });
    
    const updateDepsFromStmt = db.prepare('UPDATE dependencies SET from_id = @newId WHERE from_type = "project" AND from_id = @oldId');
    updateDepsFromStmt.run({ newId: payload.newId, oldId: payload.id });
    
    const updateDepsToStmt = db.prepare('UPDATE dependencies SET to_id = @newId WHERE to_type = "project" AND to_id = @oldId');
    updateDepsToStmt.run({ newId: payload.newId, oldId: payload.id });
    
    // Update the project ID
    updates.push('id = @newId');
    params.newId = payload.newId;
  }

  if (payload.title !== undefined) {
    updates.push('title = @title');
    params.title = payload.title;
  }
  if (payload.description !== undefined) {
    updates.push('description = @description');
    params.description = payload.description;
  }
  if (payload.lane !== undefined) {
    updates.push('lane = @lane');
    params.lane = payload.lane;
  }
  if (payload.start_date !== undefined) {
    updates.push('start_date_nz = @start_date_nz, start_date_iso = @start_date_iso');
    params.start_date_nz = payload.start_date;
    params.start_date_iso = parseNZDateToISO(payload.start_date);
  }
  if (payload.end_date !== undefined) {
    updates.push('end_date_nz = @end_date_nz, end_date_iso = @end_date_iso');
    params.end_date_nz = payload.end_date;
    params.end_date_iso = parseNZDateToISO(payload.end_date);
  }
  if (payload.status !== undefined) {
    updates.push('status = @status');
    params.status = payload.status;
  }
  if (payload.pm_name !== undefined) {
    updates.push('pm_name = @pm_name');
    params.pm_name = payload.pm_name;
  }
  if (payload.budget_nzd !== undefined) {
    updates.push('budget_cents = @budget_cents');
    params.budget_cents = parseNZDToCents(payload.budget_nzd);
  }
  if (payload.financial_treatment !== undefined) {
    updates.push('financial_treatment = @financial_treatment');
    params.financial_treatment = payload.financial_treatment;
  }
  if (payload.row !== undefined) {
    updates.push('row = @row');
    params.row = payload.row;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  const stmt = db.prepare(`UPDATE projects SET ${updates.join(', ')}, updated_at = @updated_at WHERE id = @id`);
  const info = stmt.run(params);
  
  if (info.changes === 0) throw new Error('Project not found');
  
  // Return the new ID if it was changed, otherwise return the original ID
  return { 
    changes: info.changes, 
    newId: payload.newId || payload.id 
  };
}

function deleteProject(db: DB, id: string) {
  const stmt = db.prepare('DELETE FROM projects WHERE id = @id');
  const info = stmt.run({ id });
  
  if (info.changes === 0) throw new Error('Project not found');
  return { changes: info.changes };
}

function createTask(db: DB, payload: TaskCreatePayload) {
  const start_iso = parseNZDateToISO(payload.start_date);
  const end_iso = parseNZDateToISO(payload.end_date);
  const now = new Date().toISOString();

  const stmt = db.prepare(`INSERT INTO tasks (
    id, project_id, title, 
    start_date_nz, end_date_nz, start_date_iso, end_date_iso,
    effort_hours, status, assigned_resources,
    created_at, updated_at
  ) VALUES (
    @id, @project_id, @title,
    @start_date_nz, @end_date_nz, @start_date_iso, @end_date_iso,
    @effort_hours, @status, @assigned_resources,
    @created_at, @updated_at
  )`);

  const info = stmt.run({
    id: payload.id,
    project_id: payload.project_id,
    title: payload.title,
    start_date_nz: payload.start_date,
    end_date_nz: payload.end_date,
    start_date_iso: start_iso,
    end_date_iso: end_iso,
    effort_hours: payload.effort_hours || 0,
    status: payload.status,
    assigned_resources: JSON.stringify(payload.assigned_resources || []),
    created_at: now,
    updated_at: now
  });

  return { insertId: info.lastInsertRowid, changes: info.changes };
}

function updateTask(db: DB, payload: TaskUpdatePayload) {
  const updates: string[] = [];
  const params: any = { id: payload.id, updated_at: new Date().toISOString() };

  if (payload.project_id !== undefined) {
    updates.push('project_id = @project_id');
    params.project_id = payload.project_id;
  }
  if (payload.title !== undefined) {
    updates.push('title = @title');
    params.title = payload.title;
  }
  if (payload.start_date !== undefined) {
    updates.push('start_date_nz = @start_date_nz, start_date_iso = @start_date_iso');
    params.start_date_nz = payload.start_date;
    params.start_date_iso = parseNZDateToISO(payload.start_date);
  }
  if (payload.end_date !== undefined) {
    updates.push('end_date_nz = @end_date_nz, end_date_iso = @end_date_iso');
    params.end_date_nz = payload.end_date;
    params.end_date_iso = parseNZDateToISO(payload.end_date);
  }
  if (payload.effort_hours !== undefined) {
    updates.push('effort_hours = @effort_hours');
    params.effort_hours = payload.effort_hours;
  }
  if (payload.status !== undefined) {
    updates.push('status = @status');
    params.status = payload.status;
  }
  if (payload.assigned_resources !== undefined) {
    updates.push('assigned_resources = @assigned_resources');
    params.assigned_resources = JSON.stringify(payload.assigned_resources);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  const stmt = db.prepare(`UPDATE tasks SET ${updates.join(', ')}, updated_at = @updated_at WHERE id = @id`);
  const info = stmt.run(params);
  
  if (info.changes === 0) throw new Error('Task not found');
  return { changes: info.changes };
}

function deleteTask(db: DB, id: string) {
  const stmt = db.prepare('DELETE FROM tasks WHERE id = @id');
  const info = stmt.run({ id });
  
  if (info.changes === 0) throw new Error('Task not found');
  return { changes: info.changes };
}

function createDependency(db: DB, payload: DependencyCreatePayload) {
  try {
    const stmt = db.prepare(`INSERT INTO dependencies (
      id, from_type, from_id, to_type, to_id, kind, lag_days, note, created_at
    ) VALUES (
      @id, @from_type, @from_id, @to_type, @to_id, @kind, @lag_days, @note, @created_at
    )`);
    
    const info = stmt.run({
      id: payload.id,
      from_type: payload.from_type,
      from_id: payload.from_id,
      to_type: payload.to_type,
      to_id: payload.to_id,
      kind: payload.kind,
      lag_days: payload.lag_days || 0,
      note: payload.note || '',
      created_at: new Date().toISOString()
    });

    return { insertId: info.lastInsertRowid, changes: info.changes };
  } catch (e: any) {
    if (String(e.code) === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      throw new Error('Related item not found (FK failed)');
    }
    if (String(e.code)?.startsWith('SQLITE_CONSTRAINT')) {
      throw new Error('Duplicate dependency');
    }
    throw e;
  }
}

function deleteDependency(db: DB, id: string) {
  const stmt = db.prepare('DELETE FROM dependencies WHERE id = @id');
  const info = stmt.run({ id });
  
  if (info.changes === 0) throw new Error('Dependency not found');
  return { changes: info.changes };
}

// EPIC functions
function createEpic(db: DB, payload: EpicCreatePayload) {
  const now = new Date().toISOString();
  
  // Get next sort order for this project
  const sortOrderStmt = db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM epics WHERE project_id = @project_id');
  const sortOrderResult = sortOrderStmt.get({ project_id: payload.project_id }) as any;
  const nextSortOrder = payload.sort_order || sortOrderResult.next_order;

  const stmt = db.prepare(`INSERT INTO epics (
    id, project_id, title, description, state, effort, business_value, time_criticality,
    start_date_nz, end_date_nz, start_date_iso, end_date_iso,
    assigned_to, area_path, iteration_path, risk, value_area, parent_feature,
    sort_order, created_at, updated_at
  ) VALUES (
    @id, @project_id, @title, @description, @state, @effort, @business_value, @time_criticality,
    @start_date_nz, @end_date_nz, @start_date_iso, @end_date_iso,
    @assigned_to, @area_path, @iteration_path, @risk, @value_area, @parent_feature,
    @sort_order, @created_at, @updated_at
  )`);

  const info = stmt.run({
    id: payload.id,
    project_id: payload.project_id,
    title: payload.title,
    description: payload.description || '',
    state: payload.state || 'New',
    effort: payload.effort || 0,
    business_value: payload.business_value || 0,
    time_criticality: payload.time_criticality || 0,
    start_date_nz: payload.start_date || '',
    end_date_nz: payload.end_date || '',
    start_date_iso: payload.start_date ? parseNZDateToISO(payload.start_date) : '',
    end_date_iso: payload.end_date ? parseNZDateToISO(payload.end_date) : '',
    assigned_to: payload.assigned_to || '',
    area_path: payload.area_path || '',
    iteration_path: payload.iteration_path || '',
    risk: payload.risk || '',
    value_area: payload.value_area || '',
    parent_feature: payload.parent_feature || '',
    sort_order: nextSortOrder,
    created_at: now,
    updated_at: now
  });

  return { insertId: info.lastInsertRowid, changes: info.changes };
}

function updateEpic(db: DB, payload: EpicUpdatePayload) {
  const updates: string[] = [];
  const params: any = { id: payload.id, updated_at: new Date().toISOString() };

  if (payload.title !== undefined) {
    updates.push('title = @title');
    params.title = payload.title;
  }
  if (payload.description !== undefined) {
    updates.push('description = @description');
    params.description = payload.description;
  }
  if (payload.state !== undefined) {
    updates.push('state = @state');
    params.state = payload.state;
  }
  if (payload.effort !== undefined) {
    updates.push('effort = @effort');
    params.effort = payload.effort;
  }
  if (payload.business_value !== undefined) {
    updates.push('business_value = @business_value');
    params.business_value = payload.business_value;
  }
  if (payload.time_criticality !== undefined) {
    updates.push('time_criticality = @time_criticality');
    params.time_criticality = payload.time_criticality;
  }
  if (payload.start_date !== undefined) {
    updates.push('start_date_nz = @start_date_nz, start_date_iso = @start_date_iso');
    params.start_date_nz = payload.start_date;
    params.start_date_iso = payload.start_date ? parseNZDateToISO(payload.start_date) : '';
  }
  if (payload.end_date !== undefined) {
    updates.push('end_date_nz = @end_date_nz, end_date_iso = @end_date_iso');
    params.end_date_nz = payload.end_date;
    params.end_date_iso = payload.end_date ? parseNZDateToISO(payload.end_date) : '';
  }
  if (payload.assigned_to !== undefined) {
    updates.push('assigned_to = @assigned_to');
    params.assigned_to = payload.assigned_to;
  }
  if (payload.area_path !== undefined) {
    updates.push('area_path = @area_path');
    params.area_path = payload.area_path;
  }
  if (payload.iteration_path !== undefined) {
    updates.push('iteration_path = @iteration_path');
    params.iteration_path = payload.iteration_path;
  }
  if (payload.risk !== undefined) {
    updates.push('risk = @risk');
    params.risk = payload.risk;
  }
  if (payload.value_area !== undefined) {
    updates.push('value_area = @value_area');
    params.value_area = payload.value_area;
  }
  if (payload.parent_feature !== undefined) {
    updates.push('parent_feature = @parent_feature');
    params.parent_feature = payload.parent_feature;
  }
  if (payload.sort_order !== undefined) {
    updates.push('sort_order = @sort_order');
    params.sort_order = payload.sort_order;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  const stmt = db.prepare(`UPDATE epics SET ${updates.join(', ')}, updated_at = @updated_at WHERE id = @id`);
  const info = stmt.run(params);
  
  if (info.changes === 0) throw new Error('Epic not found');
  return { changes: info.changes };
}

function deleteEpic(db: DB, id: string) {
  const stmt = db.prepare('DELETE FROM epics WHERE id = @id');
  const info = stmt.run({ id });
  
  if (info.changes === 0) throw new Error('Epic not found');
  return { changes: info.changes };
}

// Feature functions
function createFeature(db: DB, payload: FeatureCreatePayload) {
  const now = new Date().toISOString();
  
  // Get next sort order for this epic
  const sortOrderStmt = db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM features WHERE epic_id = @epic_id');
  const sortOrderResult = sortOrderStmt.get({ epic_id: payload.epic_id }) as any;
  const nextSortOrder = payload.sort_order || sortOrderResult.next_order;

  const stmt = db.prepare(`INSERT INTO features (
    id, epic_id, project_id, title, description, state, effort, business_value, time_criticality,
    start_date_nz, end_date_nz, start_date_iso, end_date_iso,
    assigned_to, area_path, iteration_path, risk, value_area,
    sort_order, created_at, updated_at
  ) VALUES (
    @id, @epic_id, @project_id, @title, @description, @state, @effort, @business_value, @time_criticality,
    @start_date_nz, @end_date_nz, @start_date_iso, @end_date_iso,
    @assigned_to, @area_path, @iteration_path, @risk, @value_area,
    @sort_order, @created_at, @updated_at
  )`);

  const info = stmt.run({
    id: payload.id,
    epic_id: payload.epic_id,
    project_id: payload.project_id,
    title: payload.title,
    description: payload.description || '',
    state: payload.state || 'New',
    effort: payload.effort || 0,
    business_value: payload.business_value || 0,
    time_criticality: payload.time_criticality || 0,
    start_date_nz: payload.start_date || '',
    end_date_nz: payload.end_date || '',
    start_date_iso: payload.start_date ? parseNZDateToISO(payload.start_date) : '',
    end_date_iso: payload.end_date ? parseNZDateToISO(payload.end_date) : '',
    assigned_to: payload.assigned_to || '',
    area_path: payload.area_path || '',
    iteration_path: payload.iteration_path || '',
    risk: payload.risk || '',
    value_area: payload.value_area || '',
    sort_order: nextSortOrder,
    created_at: now,
    updated_at: now
  });

  return { insertId: info.lastInsertRowid, changes: info.changes };
}

function updateFeature(db: DB, payload: FeatureUpdatePayload) {
  const updates: string[] = [];
  const params: any = { id: payload.id, updated_at: new Date().toISOString() };

  if (payload.title !== undefined) {
    updates.push('title = @title');
    params.title = payload.title;
  }
  if (payload.description !== undefined) {
    updates.push('description = @description');
    params.description = payload.description;
  }
  if (payload.state !== undefined) {
    updates.push('state = @state');
    params.state = payload.state;
  }
  if (payload.effort !== undefined) {
    updates.push('effort = @effort');
    params.effort = payload.effort;
  }
  if (payload.business_value !== undefined) {
    updates.push('business_value = @business_value');
    params.business_value = payload.business_value;
  }
  if (payload.time_criticality !== undefined) {
    updates.push('time_criticality = @time_criticality');
    params.time_criticality = payload.time_criticality;
  }
  if (payload.start_date !== undefined) {
    updates.push('start_date_nz = @start_date_nz, start_date_iso = @start_date_iso');
    params.start_date_nz = payload.start_date;
    params.start_date_iso = payload.start_date ? parseNZDateToISO(payload.start_date) : '';
  }
  if (payload.end_date !== undefined) {
    updates.push('end_date_nz = @end_date_nz, end_date_iso = @end_date_iso');
    params.end_date_nz = payload.end_date;
    params.end_date_iso = payload.end_date ? parseNZDateToISO(payload.end_date) : '';
  }
  if (payload.assigned_to !== undefined) {
    updates.push('assigned_to = @assigned_to');
    params.assigned_to = payload.assigned_to;
  }
  if (payload.area_path !== undefined) {
    updates.push('area_path = @area_path');
    params.area_path = payload.area_path;
  }
  if (payload.iteration_path !== undefined) {
    updates.push('iteration_path = @iteration_path');
    params.iteration_path = payload.iteration_path;
  }
  if (payload.risk !== undefined) {
    updates.push('risk = @risk');
    params.risk = payload.risk;
  }
  if (payload.value_area !== undefined) {
    updates.push('value_area = @value_area');
    params.value_area = payload.value_area;
  }
  if (payload.sort_order !== undefined) {
    updates.push('sort_order = @sort_order');
    params.sort_order = payload.sort_order;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  const stmt = db.prepare(`UPDATE features SET ${updates.join(', ')}, updated_at = @updated_at WHERE id = @id`);
  const info = stmt.run(params);
  
  if (info.changes === 0) throw new Error('Feature not found');
  return { changes: info.changes };
}

function deleteFeature(db: DB, id: string) {
  const stmt = db.prepare('DELETE FROM features WHERE id = @id');
  const info = stmt.run({ id });
  
  if (info.changes === 0) throw new Error('Feature not found');
  return { changes: info.changes };
}

export function withTransaction<T>(db: DB, fn: () => T): T {
  return db.transaction(fn)();
}

// Calendar Module Functions
export function saveCalendarMonth(db: DB, payload: CalendarMonthPayload) {
  const now = new Date().toISOString();
  
  // Check if record exists
  const existingStmt = db.prepare('SELECT id FROM calendar_months WHERE year = @year AND month = @month');
  const existing = existingStmt.get({ year: payload.year, month: payload.month }) as any;
  
  if (existing) {
    // Update existing
    const stmt = db.prepare(`UPDATE calendar_months SET 
      days = @days,
      working_days = @working_days,
      weekend_days = @weekend_days,
      public_holidays = @public_holidays,
      work_hours = @work_hours,
      notes = @notes,
      updated_at = @updated_at
    WHERE year = @year AND month = @month`);
    
    const info = stmt.run({
      year: payload.year,
      month: payload.month,
      days: payload.days,
      working_days: payload.working_days,
      weekend_days: payload.weekend_days,
      public_holidays: payload.public_holidays,
      work_hours: payload.work_hours,
      notes: payload.notes || '',
      updated_at: now
    });
    
    return { id: existing.id, changes: info.changes };
  } else {
    // Insert new
    // First ensure year exists
    const yearStmt = db.prepare('INSERT OR IGNORE INTO calendar_years (year, total_days, created_at, updated_at) VALUES (@year, 365, @now, @now)');
    yearStmt.run({ year: payload.year, now });
    
    const stmt = db.prepare(`INSERT INTO calendar_months (
      year, month, days, working_days, weekend_days, public_holidays, work_hours, notes, created_at, updated_at
    ) VALUES (
      @year, @month, @days, @working_days, @weekend_days, @public_holidays, @work_hours, @notes, @created_at, @updated_at
    )`);
    
    const info = stmt.run({
      year: payload.year,
      month: payload.month,
      days: payload.days,
      working_days: payload.working_days,
      weekend_days: payload.weekend_days,
      public_holidays: payload.public_holidays,
      work_hours: payload.work_hours,
      notes: payload.notes || '',
      created_at: now,
      updated_at: now
    });
    
    return { id: info.lastInsertRowid, changes: info.changes };
  }
}

export function getCalendarMonth(db: DB, year: number, month: number) {
  const stmt = db.prepare('SELECT * FROM calendar_months WHERE year = @year AND month = @month');
  return stmt.get({ year, month });
}

export function importPublicHolidays(db: DB, holidays: PublicHolidayPayload[]) {
  const now = new Date().toISOString();
  let imported = 0;
  let skipped = 0;
  
  const stmt = db.prepare(`INSERT INTO public_holidays (
    name, start_date, end_date, year, month, day, end_year, end_month, end_day, 
    description, is_recurring, source, created_at, updated_at
  ) VALUES (
    @name, @start_date, @end_date, @year, @month, @day, @end_year, @end_month, @end_day,
    @description, @is_recurring, @source, @created_at, @updated_at
  )`);
  
  for (const holiday of holidays) {
    try {
      const info = stmt.run({
        name: holiday.name,
        start_date: holiday.start_date,
        end_date: holiday.end_date,
        year: holiday.year,
        month: holiday.month,
        day: holiday.day,
        end_year: holiday.end_year || null,
        end_month: holiday.end_month || null,
        end_day: holiday.end_day || null,
        description: holiday.description || '',
        is_recurring: holiday.is_recurring ? 1 : 0,
        source: holiday.source || 'manual',
        created_at: now,
        updated_at: now
      });
      
      if (info.changes > 0) {
        imported++;
      }
    } catch (error) {
      // Skip duplicates or constraint violations
      skipped++;
    }
  }
  
  return { imported, skipped };
}

export function getPublicHolidays(db: DB, year?: number, month?: number) {
  let query = 'SELECT * FROM public_holidays';
  const params: any = {};
  
  if (year && month) {
    query += ' WHERE year = @year AND month = @month';
    params.year = year;
    params.month = month;
  } else if (year) {
    query += ' WHERE year = @year';
    params.year = year;
  }
  
  query += ' ORDER BY date ASC';
  
  const stmt = db.prepare(query);
  return stmt.all(params);
}

export function deletePublicHoliday(db: DB, id: number) {
  const stmt = db.prepare('DELETE FROM public_holidays WHERE id = @id');
  const info = stmt.run({ id });
  
  if (info.changes === 0) throw new Error('Holiday not found');
  return { changes: info.changes };
}
