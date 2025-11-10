# Project Coordinator - System Integration Plan
## Integration with Existing Roadmap-Electron Tool

Based on clarifications from 2025-11-08

---

## Integration Decisions Summary

### 1. EPIC/Feature Mapping
**Decision:** Use existing Roadmap tool's Projects → Epics → Features hierarchy  
**Implementation:**
- Link Financial Coordinator data to existing `epics` and `features` tables
- Add Finance tab to Project Details view
- Store WBSE and financial coding as metadata on projects/epics

### 2. External Squad Data Source
**Decision:** Pull from ADO via existing `AdoApiService`  
**Implementation:**
- Read related ADO Features linked to Roadmap Features
- Use ADO work item states/milestones for squad progress tracking
- Store mapping in `ado_feature_mapping` table

### 3. Resource Allocation & Forecasting
**Decision:** Resources allocated to ADO Features = work effort forecasting  
**Implementation:**
- Resources assigned via ADO `assigned_to` field
- Effort stored in ADO Feature `effort` field (story points or hours)
- Forecasted effort = sum of Feature efforts for each resource

### 4. Variance Thresholds
**Decision:** Adjustable per resource AND per project  
**Implementation:**
- New table: `variance_thresholds` with resource-level and project-level overrides
- Global defaults in `app_settings`
- Variance = cost variance (based on hours × labour rates)

### 5. Fiscal Year Calendar
**Decision:** Follow existing Roadmap dashboard settings  
**Implementation:**
- Use existing `app_settings` for FY start/end dates
- Integrate with existing `calendar_years`, `calendar_months`, `public_holidays` tables
- Fortnight calculations align with existing calendar module

### 6. SOW & Timesheet Tracking
**Decision:** Monitor both Raw_Actuals (invoices) AND Raw_Timesheets  
**Implementation:**
- SOWs appear in Raw_Actuals (Personnel Number != "0")
- Alert if resource submits timesheets but NOT allocated to any Feature
- Alert if resource allocated to Feature but submits time to different WBSE

---

## Database Schema Extensions

### New Coordinator Tables (additions to existing db.ts)

```sql
-- ===== FINANCIAL COORDINATOR TABLES =====

-- Raw data imports
CREATE TABLE IF NOT EXISTS raw_timesheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stream TEXT NOT NULL,
  month TEXT NOT NULL,
  sender_cost_center TEXT,
  name_of_employee TEXT NOT NULL,
  personnel_number TEXT NOT NULL,
  status_and_processing TEXT,
  date TEXT NOT NULL,              -- DD-MM-YYYY
  activity_type TEXT NOT NULL,     -- N4_CAP, N4_OPX
  general_receiver TEXT NOT NULL,  -- WBSE (N.93003271.004)
  acct_assgnt_text TEXT,
  number_unit REAL NOT NULL,       -- Hours
  internal_uom TEXT,               -- "H"
  att_absence_type TEXT,
  created_on TEXT,
  time_of_entry TEXT,
  created_by TEXT,
  last_change TEXT,
  changed_at TEXT,
  changed_by TEXT,
  approved_by TEXT,
  approval_date TEXT,
  object_description TEXT,
  
  imported_at TEXT NOT NULL,
  processed BOOLEAN DEFAULT 0,
  
  -- Links to existing tables
  resource_id INTEGER,             -- Links to financial_resources
  project_id TEXT,                 -- Links to projects.id
  epic_id TEXT,                    -- Links to epics.id  
  feature_id TEXT,                 -- Links to features.id
  
  FOREIGN KEY (resource_id) REFERENCES financial_resources(id)
);

CREATE TABLE IF NOT EXISTS raw_actuals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT NOT NULL,
  posting_date TEXT NOT NULL,
  document_date TEXT NOT NULL,
  cost_element TEXT NOT NULL,      -- "11513000" (software)
  cost_element_descr TEXT,
  wbs_element TEXT NOT NULL,       -- WBSE
  value_in_obj_crcy REAL NOT NULL, -- NZD
  period INTEGER,
  fiscal_year INTEGER,
  transaction_currency TEXT,
  personnel_number TEXT,           -- "0" for non-labour, else contractor
  document_number TEXT,
  created_on TEXT,
  object_key TEXT,
  value_tran_curr REAL,
  vbl_value_obj_curr REAL,
  name TEXT,
  
  imported_at TEXT NOT NULL,
  processed BOOLEAN DEFAULT 0,
  
  -- Classification
  actual_type TEXT,                -- 'software' | 'hardware' | 'contractor' | 'other'
  resource_id INTEGER,
  project_id TEXT,
  
  FOREIGN KEY (resource_id) REFERENCES financial_resources(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS raw_labour_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  band TEXT NOT NULL,              -- "CAPEX BAND H (N4_CAP)"
  local_band TEXT,
  activity_type TEXT NOT NULL UNIQUE, -- "N4_CAP"
  fiscal_year TEXT NOT NULL,
  hourly_rate REAL NOT NULL,       -- NZD
  daily_rate REAL NOT NULL,        -- NZD
  uplift_amount REAL,
  uplift_percent REAL,
  
  imported_at TEXT NOT NULL
);

-- Resources (Financial perspective)
CREATE TABLE IF NOT EXISTS financial_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roadmap_resource_id INTEGER UNIQUE, -- Legacy/imported ID
  resource_name TEXT NOT NULL,
  email TEXT,
  work_area TEXT,                  -- "Digital Team", "Security"
  activity_type_cap TEXT,          -- Links to raw_labour_rates
  activity_type_opx TEXT,
  contract_type TEXT,              -- "FTE" | "SOW" | "External Squad"
  employee_id TEXT UNIQUE,         -- SAP Personnel Number
  
  -- ADO Integration
  ado_identity_id TEXT,            -- ADO user identity ID
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (activity_type_cap) REFERENCES raw_labour_rates(activity_type),
  FOREIGN KEY (activity_type_opx) REFERENCES raw_labour_rates(activity_type)
);

-- Resource Commitments: "I can commit X hours per day/week/fortnight"
CREATE TABLE IF NOT EXISTS resource_commitments (
  id TEXT PRIMARY KEY,
  resource_id INTEGER NOT NULL,
  period_start TEXT NOT NULL,      -- DD-MM-YYYY
  period_end TEXT NOT NULL,
  commitment_type TEXT NOT NULL,   -- 'per-day' | 'per-week' | 'per-fortnight'
  committed_hours REAL NOT NULL,
  
  -- Calculated
  total_available_hours REAL NOT NULL,
  allocated_hours REAL DEFAULT 0,
  remaining_capacity REAL DEFAULT 0,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (resource_id) REFERENCES financial_resources(id),
  CHECK (commitment_type IN ('per-day', 'per-week', 'per-fortnight'))
);

-- Feature Allocations: Resource allocated to Features (from ADO or manual)
CREATE TABLE IF NOT EXISTS feature_allocations (
  id TEXT PRIMARY KEY,
  resource_id INTEGER NOT NULL,
  feature_id TEXT NOT NULL,        -- Links to features.id
  epic_id TEXT NOT NULL,           -- Links to epics.id
  project_id TEXT NOT NULL,        -- Links to projects.id
  
  allocated_hours REAL NOT NULL,   -- Forecasted effort
  forecast_start_date TEXT,        -- DD-MM-YYYY
  forecast_end_date TEXT,
  
  -- Tracking
  actual_hours_to_date REAL DEFAULT 0,  -- From timesheets
  actual_cost_to_date REAL DEFAULT 0,   -- Hours × labour rate
  variance_hours REAL DEFAULT 0,
  variance_cost REAL DEFAULT 0,
  status TEXT DEFAULT 'on-track',  -- 'on-track' | 'at-risk' | 'over' | 'under'
  
  -- Source tracking
  source TEXT DEFAULT 'manual',    -- 'manual' | 'ado' | 'imported'
  ado_feature_id TEXT,             -- ADO Work Item ID
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (resource_id) REFERENCES financial_resources(id),
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  FOREIGN KEY (epic_id) REFERENCES epics(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Workstreams (major delivery components)
CREATE TABLE IF NOT EXISTS financial_workstreams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  workstream_name TEXT NOT NULL,   -- "OneIntune", "Hoki", "LUMA"
  wbse TEXT NOT NULL,              -- "N.93003271.004"
  wbse_desc TEXT,                  -- "Capped Labour"
  sme_resource_id INTEGER,         -- Subject Matter Expert
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (sme_resource_id) REFERENCES financial_resources(id)
);

-- Project Financial Detail (SAP coding, cost treatments)
CREATE TABLE IF NOT EXISTS project_financial_detail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL UNIQUE,
  
  -- SAP Coding
  sentinel_number TEXT,            -- "98047"
  delivery_goal TEXT,
  wbse TEXT NOT NULL,              -- "N.93003271"
  wbse_desc TEXT,
  auc_number TEXT,                 -- Asset Under Construction
  final_asset TEXT,
  sap_code TEXT,
  io_code TEXT,
  
  -- Budget
  original_budget_nzd REAL DEFAULT 0,
  forecast_budget_nzd REAL DEFAULT 0,
  actual_cost_nzd REAL DEFAULT 0,
  variance_nzd REAL DEFAULT 0,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ADO Feature Mapping (links Roadmap Features to ADO Work Items)
CREATE TABLE IF NOT EXISTS ado_feature_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id TEXT NOT NULL,        -- Roadmap feature.id
  ado_work_item_id INTEGER NOT NULL, -- ADO Feature/Epic/User Story ID
  ado_work_item_type TEXT,         -- "Feature" | "Epic" | "User Story"
  
  -- ADO metadata (cached from ADO)
  ado_state TEXT,                  -- "New" | "Active" | "Resolved" | "Closed"
  ado_assigned_to TEXT,
  ado_effort REAL,                 -- Story points or hours
  ado_iteration_path TEXT,
  ado_area_path TEXT,
  
  -- Milestone tracking (for external squads)
  backlog_submission_date TEXT,
  design_workshop_date TEXT,
  development_start_date TEXT,
  uat_target_date TEXT,
  prod_deployment_date TEXT,
  
  last_synced_at TEXT,
  sync_status TEXT DEFAULT 'synced', -- 'synced' | 'pending' | 'error'
  sync_error TEXT,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  UNIQUE(feature_id, ado_work_item_id)
);

-- Variance Thresholds (adjustable per resource/project)
CREATE TABLE IF NOT EXISTS variance_thresholds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,       -- 'resource' | 'project' | 'global'
  entity_id TEXT,                  -- NULL for global
  
  hours_variance_percent REAL DEFAULT 20.0,
  cost_variance_percent REAL DEFAULT 20.0,
  schedule_variance_days INTEGER DEFAULT 7,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  UNIQUE(entity_type, entity_id)
);

-- Variance Alerts
CREATE TABLE IF NOT EXISTS variance_alerts (
  id TEXT PRIMARY KEY,
  alert_type TEXT NOT NULL,        -- 'commitment' | 'effort' | 'cost' | 'schedule' | 'unauthorized'
  severity TEXT NOT NULL,          -- 'low' | 'medium' | 'high' | 'critical'
  entity_type TEXT NOT NULL,       -- 'resource' | 'project' | 'feature' | 'epic'
  entity_id TEXT NOT NULL,
  
  message TEXT NOT NULL,
  details TEXT,                    -- JSON
  variance_amount REAL,
  variance_percent REAL,
  
  acknowledged BOOLEAN DEFAULT 0,
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  
  created_at TEXT NOT NULL,
  
  CHECK (alert_type IN ('commitment', 'effort', 'cost', 'schedule', 'unauthorized')),
  CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Finance Ledger (monthly accruals, P&L tracking)
CREATE TABLE IF NOT EXISTS finance_ledger_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  workstream_id INTEGER,
  wbse TEXT NOT NULL,
  
  period_month TEXT NOT NULL,      -- "October"
  period_year INTEGER NOT NULL,    -- 2025
  fiscal_year TEXT,                -- "FY26"
  
  budget_type TEXT NOT NULL,       -- 'CAPEX' | 'OPEX'
  expenditure_type TEXT NOT NULL,  -- 'Capped Labour' | 'Software' | 'Professional Services' | 'Hardware'
  
  -- Financials (NZD)
  forecast_amount REAL DEFAULT 0,
  actual_amount REAL DEFAULT 0,
  variance_amount REAL DEFAULT 0,
  
  -- Source tracking
  source_type TEXT,                -- 'timesheet' | 'actual' | 'manual'
  source_ids TEXT,                 -- JSON array of source record IDs
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (workstream_id) REFERENCES financial_workstreams(id)
);

-- ===== INDEXES =====

CREATE INDEX IF NOT EXISTS idx_timesheets_personnel ON raw_timesheets(personnel_number);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON raw_timesheets(date);
CREATE INDEX IF NOT EXISTS idx_timesheets_wbse ON raw_timesheets(general_receiver);
CREATE INDEX IF NOT EXISTS idx_timesheets_month ON raw_timesheets(month);
CREATE INDEX IF NOT EXISTS idx_timesheets_resource ON raw_timesheets(resource_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_feature ON raw_timesheets(feature_id);

CREATE INDEX IF NOT EXISTS idx_actuals_wbse ON raw_actuals(wbs_element);
CREATE INDEX IF NOT EXISTS idx_actuals_cost_element ON raw_actuals(cost_element);
CREATE INDEX IF NOT EXISTS idx_actuals_month ON raw_actuals(month);
CREATE INDEX IF NOT EXISTS idx_actuals_personnel ON raw_actuals(personnel_number);
CREATE INDEX IF NOT EXISTS idx_actuals_resource ON raw_actuals(resource_id);

CREATE INDEX IF NOT EXISTS idx_labour_rates_activity ON raw_labour_rates(activity_type);

CREATE INDEX IF NOT EXISTS idx_fin_resources_employee ON financial_resources(employee_id);
CREATE INDEX IF NOT EXISTS idx_fin_resources_ado ON financial_resources(ado_identity_id);

CREATE INDEX IF NOT EXISTS idx_commitments_resource ON resource_commitments(resource_id);
CREATE INDEX IF NOT EXISTS idx_commitments_period ON resource_commitments(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_feature_alloc_resource ON feature_allocations(resource_id);
CREATE INDEX IF NOT EXISTS idx_feature_alloc_feature ON feature_allocations(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_alloc_epic ON feature_allocations(epic_id);
CREATE INDEX IF NOT EXISTS idx_feature_alloc_project ON feature_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_feature_alloc_ado ON feature_allocations(ado_feature_id);

CREATE INDEX IF NOT EXISTS idx_workstreams_project ON financial_workstreams(project_id);
CREATE INDEX IF NOT EXISTS idx_workstreams_wbse ON financial_workstreams(wbse);

CREATE INDEX IF NOT EXISTS idx_proj_fin_detail_project ON project_financial_detail(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_fin_detail_wbse ON project_financial_detail(wbse);

CREATE INDEX IF NOT EXISTS idx_ado_feature_map_feature ON ado_feature_mapping(feature_id);
CREATE INDEX IF NOT EXISTS idx_ado_feature_map_ado_id ON ado_feature_mapping(ado_work_item_id);
CREATE INDEX IF NOT EXISTS idx_ado_feature_map_sync ON ado_feature_mapping(sync_status, last_synced_at);

CREATE INDEX IF NOT EXISTS idx_variance_thresholds_entity ON variance_thresholds(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_alerts_type ON variance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON variance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_entity ON variance_alerts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON variance_alerts(acknowledged);

CREATE INDEX IF NOT EXISTS idx_ledger_project ON finance_ledger_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_ledger_workstream ON finance_ledger_entries(workstream_id);
CREATE INDEX IF NOT EXISTS idx_ledger_period ON finance_ledger_entries(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_ledger_wbse ON finance_ledger_entries(wbse);
```

---

## TypeScript Model Extensions

### Extend existing models (app/renderer/state/store.ts)

```typescript
// Extend Project interface
export interface Project {
  // ... existing fields
  
  // Financial Coordinator fields
  financial?: {
    sentinel_number?: string;
    wbse?: string;
    wbse_desc?: string;
    sap_code?: string;
    io_code?: string;
    auc_number?: string;
    original_budget_nzd?: number;
    forecast_budget_nzd?: number;
    actual_cost_nzd?: number;
    variance_nzd?: number;
  };
}

// Extend Feature interface
export interface Feature {
  // ... existing fields
  
  // Financial Coordinator fields
  ado_work_item_id?: number;
  ado_state?: string;
  allocated_resources?: ResourceAllocation[];
  forecasted_hours?: number;
  actual_hours?: number;
  variance_hours?: number;
}

// New Financial Models
export interface FinancialResource {
  id: number;
  roadmap_resource_id?: number;
  resource_name: string;
  email?: string;
  work_area?: string;
  activity_type_cap?: string;
  activity_type_opx?: string;
  contract_type: 'FTE' | 'SOW' | 'External Squad';
  employee_id?: string;
  ado_identity_id?: string;
}

export interface ResourceCommitment {
  id: string;
  resource_id: number;
  period_start: NZDate;
  period_end: NZDate;
  commitment_type: 'per-day' | 'per-week' | 'per-fortnight';
  committed_hours: number;
  total_available_hours: number;
  allocated_hours: number;
  remaining_capacity: number;
}

export interface ResourceAllocation {
  id: string;
  resource_id: number;
  resource_name: string;
  feature_id: string;
  epic_id: string;
  project_id: string;
  allocated_hours: number;
  actual_hours_to_date: number;
  actual_cost_to_date: number;
  variance_hours: number;
  variance_cost: number;
  status: 'on-track' | 'at-risk' | 'over' | 'under';
}

export interface VarianceAlert {
  id: string;
  alert_type: 'commitment' | 'effort' | 'cost' | 'schedule' | 'unauthorized';
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity_type: 'resource' | 'project' | 'feature' | 'epic';
  entity_id: string;
  message: string;
  details?: any;
  variance_amount?: number;
  variance_percent?: number;
  acknowledged: boolean;
  created_at: string;
}
```

---

## Service Layer Integration

### New Services (app/main/services/coordinator/)

```
app/main/services/coordinator/
├── CoordinatorService.ts          # Main orchestration
├── TimesheetImportService.ts      # CSV → raw_timesheets
├── ActualsImportService.ts        # CSV → raw_actuals
├── ResourceCommitmentService.ts   # Commitment management
├── AllocationService.ts           # Feature allocation tracking
├── AdoSyncService.ts              # Sync ADO Features → ado_feature_mapping
├── VarianceDetectionService.ts    # Multi-dimensional variance
├── FinanceLedgerService.ts        # P&L calculation
└── ReportingService.ts            # Dashboards, exports
```

### Key Integration Points

#### 1. ADO Sync Integration

```typescript
// app/main/services/coordinator/AdoSyncService.ts
import { AdoApiService } from '../ado/AdoApiService';

export class AdoSyncService {
  constructor(
    private adoApiService: AdoApiService,
    private db: DB
  ) {}
  
  async syncFeaturesToAdo(featureIds: string[]): Promise<SyncResult> {
    // For each Roadmap Feature:
    // 1. Get linked ADO Work Item ID from ado_feature_mapping
    // 2. Fetch work item from ADO via AdoApiService
    // 3. Extract: state, assigned_to, effort, iteration_path
    // 4. Update ado_feature_mapping cache
    // 5. Extract milestone dates for external squads
  }
  
  async syncResourceAllocations(featureId: string): Promise<void> {
    // 1. Get ADO Feature assigned_to (ADO identity)
    // 2. Map to financial_resources via ado_identity_id
    // 3. Get ADO Feature effort (story points/hours)
    // 4. Upsert feature_allocations record
  }
  
  async syncExternalSquadMilestones(featureId: string): Promise<void> {
    // For external squad features (e.g., ServiceHub):
    // 1. Parse ADO work item custom fields or tags
    // 2. Extract milestone dates: backlog, design, dev, UAT, prod
    // 3. Update ado_feature_mapping milestone fields
  }
}
```

#### 2. Timesheet Processing

```typescript
// app/main/services/coordinator/TimesheetImportService.ts
export class TimesheetImportService {
  async importTimesheets(csvData: string): Promise<ImportResult> {
    // 1. Parse CSV
    // 2. For each row:
    //    - Find resource by personnel_number → financial_resources
    //    - Parse WBSE → find project via project_financial_detail
    //    - Find Feature via timesheet date range + project
    //    - Insert raw_timesheets with feature_id linkage
    // 3. Validate: resource allocated to that feature?
    // 4. Generate 'unauthorized' alert if not
  }
  
  async reconcileTimesheets(month: string): Promise<ReconciliationReport> {
    // 1. Group timesheets by resource + feature
    // 2. Sum hours
    // 3. Compare to feature_allocations.allocated_hours
    // 4. Calculate variance
    // 5. Update feature_allocations.actual_hours_to_date
    // 6. Generate variance alerts if threshold exceeded
  }
}
```

#### 3. Variance Detection

```typescript
// app/main/services/coordinator/VarianceDetectionService.ts
export class VarianceDetectionService {
  async detectAllVariances(): Promise<VarianceAlert[]> {
    const alerts: VarianceAlert[] = [];
    
    // 1. Commitment variance (per resource)
    alerts.push(...await this.detectCommitmentVariance());
    
    // 2. Effort variance (per feature)
    alerts.push(...await this.detectEffortVariance());
    
    // 3. Cost variance (per project/WBSE)
    alerts.push(...await this.detectCostVariance());
    
    // 4. Schedule variance (ADO milestones)
    alerts.push(...await this.detectScheduleVariance());
    
    // 5. Unauthorized time entries
    alerts.push(...await this.detectUnauthorizedTime());
    
    return alerts;
  }
  
  private async detectEffortVariance(): Promise<VarianceAlert[]> {
    // 1. Get all feature_allocations
    // 2. For each: calculate variance_hours = actual - allocated
    // 3. Get threshold for resource/project
    // 4. If |variance| > threshold → create alert
    // 5. Calculate cost variance = variance_hours × labour_rate
  }
}
```

---

## UI Integration

### 1. Project Detail Page - Finance Tab

**Location:** `app/renderer/views/ProjectDetail.tsx`

**New Tab:** "Finance & Resources"

**Sections:**
- **Financial Summary**
  - WBSE, SAP Code, IO Code
  - Budget vs Actual vs Forecast (gauge chart)
  - Variance breakdown by workstream
  
- **Resource Allocations**
  - Table: Resource | Allocated Hours | Actual Hours | Variance | Status
  - Drill-down to Feature-level allocation
  - Add/Edit allocation buttons
  
- **Epics & Features Forecast**
  - Tree view: Epic → Features → Resource Allocations
  - Effort rollup to Epic level
  - Cost calculation (hours × labour rates)
  
- **Variance Alerts**
  - List of alerts for this project
  - Filter by severity, type
  
- **Timesheet Summary**
  - Monthly breakdown of submitted hours by resource
  - Comparison to forecast

### 2. New View: Resource Capacity Dashboard

**Location:** `app/renderer/views/coordinator/ResourceCapacity.tsx`

**Features:**
- **Commitment Entry Panel**
  - Form: "I can commit X hours per [day/week/fortnight]"
  - Date range picker
  - Submit button
  
- **Capacity Heatmap**
  - Rows: Resources
  - Columns: Weeks/Months
  - Color: Green (under-utilized) → Yellow (optimal) → Red (over-committed)
  
- **Resource Detail Drill-Down**
  - Click resource → see allocations across all features
  - Commitment vs Allocated vs Actual chart
  - Project breakdown pie chart

### 3. New View: Variance Dashboard

**Location:** `app/renderer/views/coordinator/VarianceDashboard.tsx`

**Features:**
- **Alert Summary Cards**
  - Count by severity (Critical / High / Medium / Low)
  - Click to filter
  
- **Variance Table**
  - Columns: Entity | Type | Variance | Status | Actions
  - Sort by variance amount, severity
  - Acknowledge button
  
- **Trend Charts**
  - Variance over time (last 6 months)
  - By project, resource, workstream
  
- **Drill-Down**
  - Click alert → show detail modal
  - Link to related project/feature/resource

### 4. New View: External Squad Tracker

**Location:** `app/renderer/views/coordinator/ExternalSquadTracker.tsx`

**Features:**
- **Squad Selection Dropdown**
  - List of external squad resources (contract_type = 'External Squad')
  
- **Kanban Board**
  - Columns: Backlog → Design → Dev → UAT → Prod
  - Cards: Features assigned to selected squad
  - Card shows: Title, milestone dates, status indicator
  
- **Milestone Timeline**
  - Gantt-style view of squad work items
  - Actual vs planned dates
  - Delay indicators

### 5. Import Manager

**Location:** `app/renderer/views/coordinator/ImportManager.tsx`

**Features:**
- **Drag-Drop CSV Upload**
  - Tabs: Timesheets | Actuals | Labour Rates
  
- **Validation Results**
  - Table: Row | Field | Error | Severity
  - Download error report
  
- **Import History**
  - List of past imports
  - Re-import / Rollback

---

## IPC Handlers (app/main/ipc/coordinatorHandlers.ts)

```typescript
import { ipcMain } from 'electron';

// Import
ipcMain.handle('coordinator:import:timesheets', async (event, csvData) => {
  return await timesheetImportService.importTimesheets(csvData);
});

ipcMain.handle('coordinator:import:actuals', async (event, csvData) => {
  return await actualsImportService.importActuals(csvData);
});

ipcMain.handle('coordinator:import:labourRates', async (event, csvData) => {
  return await labourRatesImportService.importLabourRates(csvData);
});

// Resource Commitments
ipcMain.handle('coordinator:commitment:create', async (event, data) => {
  return await resourceCommitmentService.createCommitment(data);
});

ipcMain.handle('coordinator:commitment:getByResource', async (event, resourceId, period) => {
  return await resourceCommitmentService.getCommitmentsByResource(resourceId, period);
});

// Allocations
ipcMain.handle('coordinator:allocation:create', async (event, data) => {
  return await allocationService.createAllocation(data);
});

ipcMain.handle('coordinator:allocation:getByFeature', async (event, featureId) => {
  return await allocationService.getAllocationsByFeature(featureId);
});

ipcMain.handle('coordinator:allocation:getByResource', async (event, resourceId) => {
  return await allocationService.getAllocationsByResource(resourceId);
});

// ADO Sync
ipcMain.handle('coordinator:ado:syncFeature', async (event, featureId) => {
  return await adoSyncService.syncFeaturesToAdo([featureId]);
});

ipcMain.handle('coordinator:ado:syncAllFeatures', async (event, projectId) => {
  const features = await db.prepare('SELECT id FROM features WHERE project_id = ?').all(projectId);
  return await adoSyncService.syncFeaturesToAdo(features.map(f => f.id));
});

// Variance
ipcMain.handle('coordinator:variance:getAlerts', async (event, filters) => {
  return await varianceDetectionService.getAlerts(filters);
});

ipcMain.handle('coordinator:variance:acknowledgeAlert', async (event, alertId) => {
  return await varianceDetectionService.acknowledgeAlert(alertId);
});

ipcMain.handle('coordinator:variance:detectAll', async (event) => {
  return await varianceDetectionService.detectAllVariances();
});

// Finance
ipcMain.handle('coordinator:finance:getProjectSummary', async (event, projectId, period) => {
  return await financeLedgerService.getProjectSummary(projectId, period);
});

ipcMain.handle('coordinator:finance:getPnL', async (event, projectId, period) => {
  return await financeLedgerService.calculatePnL(projectId, period);
});

// Reporting
ipcMain.handle('coordinator:reports:resourceCapacity', async (event, period) => {
  return await reportingService.getResourceCapacityReport(period);
});

ipcMain.handle('coordinator:reports:exportVariance', async (event, filters) => {
  return await reportingService.exportVarianceReport(filters);
});
```

---

## Implementation Plan (Updated)

### Phase 1: Database & Core Models (Week 1)
- ✅ Add coordinator tables to `db.ts` schema
- ✅ Create TypeScript models
- ✅ Add migration logic (user_version bump)

### Phase 2: Import Services (Week 2)
- CSV parsers (Timesheets, Actuals, Labour Rates)
- Validation logic
- IPC handlers for import
- Basic Import Manager UI

### Phase 3: Resource Management (Week 3)
- ResourceCommitmentService
- AllocationService
- Commitment entry UI
- Resource Capacity Dashboard (basic)

### Phase 4: ADO Integration (Week 4)
- AdoSyncService
- Sync Features → ADO Work Items
- Extract allocations from ADO
- External squad milestone tracking

### Phase 5: Variance Detection (Week 5)
- VarianceDetectionService
- Alert generation
- Threshold configuration (per resource/project)
- Variance Dashboard UI

### Phase 6: Finance & Reporting (Week 6)
- FinanceLedgerService
- P&L calculation
- Project Detail Finance Tab
- Monthly accrual tracking

### Phase 7: UI Polish & Testing (Week 7-8)
- External Squad Tracker UI
- Comprehensive dashboards
- E2E tests
- Documentation

---

## Key Business Logic

### 1. Unauthorized Timesheet Detection

```typescript
function detectUnauthorizedTimesheet(entry: RawTimesheet): boolean {
  // 1. Find resource by personnel_number
  const resource = getResourceByEmployeeID(entry.personnelNumber);
  if (!resource) return true; // Unknown resource
  
  // 2. Find project by WBSE
  const projectFinDetail = getProjectFinancialDetailByWBSE(entry.generalReceiver);
  if (!projectFinDetail) return true; // Invalid WBSE
  
  // 3. Find feature(s) for that project in the timesheet date range
  const features = getFeaturesForProjectInDateRange(
    projectFinDetail.project_id, 
    entry.date, 
    entry.date
  );
  
  // 4. Check if resource has allocation to ANY of those features
  const hasAllocation = features.some(feature => 
    getAllocationForResourceAndFeature(resource.id, feature.id) !== null
  );
  
  return !hasAllocation; // Unauthorized if no allocation found
}
```

### 2. Effort Variance Calculation

```typescript
function calculateEffortVariance(allocationId: string): VarianceResult {
  const allocation = getAllocationById(allocationId);
  const thresholds = getVarianceThresholds(allocation.resource_id, allocation.project_id);
  
  // Hours variance
  const varianceHours = allocation.actual_hours_to_date - allocation.allocated_hours;
  const variancePercent = (varianceHours / allocation.allocated_hours) * 100;
  
  // Cost variance
  const resource = getResourceById(allocation.resource_id);
  const labourRate = getLabourRate(resource.activity_type_cap); // or OPX
  const varianceCost = varianceHours * labourRate.hourly_rate;
  
  // Status
  let status: 'on-track' | 'at-risk' | 'over' | 'under';
  if (Math.abs(variancePercent) <= 10) {
    status = 'on-track';
  } else if (variancePercent > thresholds.hours_variance_percent) {
    status = 'under'; // Under-worked
  } else if (variancePercent < -thresholds.hours_variance_percent) {
    status = 'over'; // Over-worked
  } else {
    status = 'at-risk';
  }
  
  return { varianceHours, variancePercent, varianceCost, status };
}
```

### 3. ADO External Squad Milestone Sync

```typescript
async function syncExternalSquadMilestones(featureId: string): Promise<void> {
  const mapping = getAdoFeatureMapping(featureId);
  if (!mapping) return;
  
  // Fetch ADO work item
  const workItem = await adoApiService.getWorkItem(mapping.ado_work_item_id, ['relations']);
  
  // Extract milestones from ADO fields/tags
  const milestones = {
    backlog_submission_date: workItem.fields['Custom.BacklogSubmissionDate'],
    design_workshop_date: workItem.fields['Custom.DesignWorkshopDate'],
    development_start_date: workItem.fields['Custom.DevStartDate'],
    uat_target_date: workItem.fields['Custom.UATTargetDate'],
    prod_deployment_date: workItem.fields['Custom.ProdDeploymentDate']
  };
  
  // Update mapping
  updateAdoFeatureMapping(mapping.id, milestones);
  
  // Check for slippage
  const today = new Date();
  if (milestones.uat_target_date && new Date(milestones.uat_target_date) < today 
      && workItem.fields['System.State'] !== 'UAT') {
    createVarianceAlert({
      alert_type: 'schedule',
      severity: 'high',
      entity_type: 'feature',
      entity_id: featureId,
      message: `UAT target missed for ${workItem.fields['System.Title']}`
    });
  }
}
```

---

## Configuration & Settings

### App Settings (use existing app_settings table)

```sql
-- Global variance thresholds (defaults)
INSERT INTO app_settings (key, value, updated_at) VALUES
('coordinator.variance.hours_default_percent', '20.0', datetime('now')),
('coordinator.variance.cost_default_percent', '20.0', datetime('now')),
('coordinator.variance.schedule_default_days', '7', datetime('now'));

-- FY settings (use existing or add)
INSERT INTO app_settings (key, value, updated_at) VALUES
('fy_start_month', '4', datetime('now')),  -- April
('fy_start_day', '1', datetime('now'));

-- ADO Sync frequency
INSERT INTO app_settings (key, value, updated_at) VALUES
('coordinator.ado_sync_interval_minutes', '30', datetime('now'));
```

### Variance Threshold Override Example

```sql
-- Per-resource override
INSERT INTO variance_thresholds (entity_type, entity_id, hours_variance_percent, cost_variance_percent, created_at, updated_at)
VALUES ('resource', '567800', 15.0, 15.0, datetime('now'), datetime('now'));

-- Per-project override
INSERT INTO variance_thresholds (entity_type, entity_id, hours_variance_percent, cost_variance_percent, created_at, updated_at)
VALUES ('project', 'PRJ-1001', 25.0, 25.0, datetime('now'), datetime('now'));
```

---

## Testing Strategy

### Unit Tests
- CSV parsers (valid/invalid formats)
- Variance calculations
- Allocation logic
- ADO sync mapping

### Integration Tests
- Timesheet import → reconciliation → variance detection → alert generation
- ADO sync → allocation creation → effort tracking
- Finance ledger calculation (hours + rates → costs → P&L)

### E2E Tests (Playwright)
- Import timesheet CSV
- View variance alerts
- Acknowledge alert
- Create resource commitment
- Allocate resource to feature
- View Project Finance tab

---

## Next Steps

1. **Schema Migration**: Add coordinator tables to `ensureSchema()` in `db.ts`
2. **Create Services**: Build coordinator services in `app/main/services/coordinator/`
3. **IPC Handlers**: Add coordinator handlers in `app/main/ipc/coordinatorHandlers.ts`
4. **UI Components**: Build Finance tab in Project Detail view
5. **ADO Integration**: Extend `AdoSyncService` for feature mapping
6. **Testing**: Write unit + E2E tests

Ready to begin implementation?
