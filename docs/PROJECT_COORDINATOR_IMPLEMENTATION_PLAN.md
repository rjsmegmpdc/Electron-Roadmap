# Project Coordinator - Detailed Implementation Plan
## Step-by-Step Guide for Junior Developers

**Last Updated:** 2025-11-08  
**Estimated Total Time:** 8 weeks (160 hours)  
**Difficulty Level:** Intermediate to Advanced

---

## Table of Contents
1. [Prerequisites & Setup](#prerequisites--setup)
2. [Phase 1: Database Schema (Week 1)](#phase-1-database-schema-week-1)
3. [Phase 2: CSV Import Services (Week 2)](#phase-2-csv-import-services-week-2)
4. [Phase 3: Resource Management (Week 3)](#phase-3-resource-management-week-3)
5. [Phase 4: ADO Integration (Week 4)](#phase-4-ado-integration-week-4)
6. [Phase 5: Variance Detection (Week 5)](#phase-5-variance-detection-week-5)
7. [Phase 6: Finance & Reporting (Week 6)](#phase-6-finance--reporting-week-6)
8. [Phase 7-8: UI & Testing (Weeks 7-8)](#phase-7-8-ui--testing-weeks-7-8)
9. [Testing Checklist](#testing-checklist)
10. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## Prerequisites & Setup

### Before You Start
1. **Read the following documents** (in this order):
   - `PRD.md` - Product Requirements (section: Project Coordinator)
   - `docs/PROJECT_COORDINATOR_ARCHITECTURE.md` - Standalone architecture
   - `docs/PROJECT_COORDINATOR_INTEGRATION.md` - Integration details
   - `docs/Implementation-Electron.md` - Existing Electron patterns

2. **Understand the existing codebase**:
   - Review `app/main/db.ts` - Database schema patterns
   - Review `app/main/services/` - Service layer patterns
   - Review `app/renderer/state/store.ts` - State management with Zustand
   - Review `app/main/ipc/` - IPC handler patterns

3. **Set up your development environment**:
   ```powershell
   cd C:\Users\smhar\Roadmap-Electron
   npm install
   npm run dev
   ```

4. **Create a feature branch**:
   ```powershell
   git checkout -b feature/project-coordinator
   ```

### Tools You'll Need
- **VS Code** with extensions:
  - SQLite Viewer (alexcvzz.vscode-sqlite)
  - TypeScript Vue Plugin
  - ESLint
- **DB Browser for SQLite** (optional, for database inspection)
- **Postman** or similar (for testing IPC calls)

---

## Phase 1: Database Schema (Week 1)

**Estimated Time:** 20 hours  
**Goal:** Add 12 new tables to support Project Coordinator

### Step 1.1: Update Database Schema (4 hours)

**File:** `app/main/db.ts`

**What to do:**
1. Open `app/main/db.ts` in VS Code
2. Find the `ensureSchema()` function (around line 39)
3. Locate the section with `db.exec(\`CREATE TABLE IF NOT EXISTS...`)` (around line 46)

**Task 1.1.1: Add Coordinator Tables**

After the last existing table (around line 302, just before the closing of `db.exec()`), add:

```typescript
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
  date TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  general_receiver TEXT NOT NULL,
  acct_assgnt_text TEXT,
  number_unit REAL NOT NULL,
  internal_uom TEXT,
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
  
  resource_id INTEGER,
  project_id TEXT,
  epic_id TEXT,
  feature_id TEXT,
  
  FOREIGN KEY (resource_id) REFERENCES financial_resources(id)
);

CREATE TABLE IF NOT EXISTS raw_actuals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT NOT NULL,
  posting_date TEXT NOT NULL,
  document_date TEXT NOT NULL,
  cost_element TEXT NOT NULL,
  cost_element_descr TEXT,
  wbs_element TEXT NOT NULL,
  value_in_obj_crcy REAL NOT NULL,
  period INTEGER,
  fiscal_year INTEGER,
  transaction_currency TEXT,
  personnel_number TEXT,
  document_number TEXT,
  created_on TEXT,
  object_key TEXT,
  value_tran_curr REAL,
  vbl_value_obj_curr REAL,
  name TEXT,
  
  imported_at TEXT NOT NULL,
  processed BOOLEAN DEFAULT 0,
  
  actual_type TEXT,
  resource_id INTEGER,
  project_id TEXT,
  
  FOREIGN KEY (resource_id) REFERENCES financial_resources(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS raw_labour_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  band TEXT NOT NULL,
  local_band TEXT,
  activity_type TEXT NOT NULL UNIQUE,
  fiscal_year TEXT NOT NULL,
  hourly_rate REAL NOT NULL,
  daily_rate REAL NOT NULL,
  uplift_amount REAL,
  uplift_percent REAL,
  
  imported_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS financial_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roadmap_resource_id INTEGER UNIQUE,
  resource_name TEXT NOT NULL,
  email TEXT,
  work_area TEXT,
  activity_type_cap TEXT,
  activity_type_opx TEXT,
  contract_type TEXT,
  employee_id TEXT UNIQUE,
  
  ado_identity_id TEXT,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (activity_type_cap) REFERENCES raw_labour_rates(activity_type),
  FOREIGN KEY (activity_type_opx) REFERENCES raw_labour_rates(activity_type)
);

CREATE TABLE IF NOT EXISTS resource_commitments (
  id TEXT PRIMARY KEY,
  resource_id INTEGER NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  commitment_type TEXT NOT NULL,
  committed_hours REAL NOT NULL,
  
  total_available_hours REAL NOT NULL,
  allocated_hours REAL DEFAULT 0,
  remaining_capacity REAL DEFAULT 0,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (resource_id) REFERENCES financial_resources(id),
  CHECK (commitment_type IN ('per-day', 'per-week', 'per-fortnight'))
);

CREATE TABLE IF NOT EXISTS feature_allocations (
  id TEXT PRIMARY KEY,
  resource_id INTEGER NOT NULL,
  feature_id TEXT NOT NULL,
  epic_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  
  allocated_hours REAL NOT NULL,
  forecast_start_date TEXT,
  forecast_end_date TEXT,
  
  actual_hours_to_date REAL DEFAULT 0,
  actual_cost_to_date REAL DEFAULT 0,
  variance_hours REAL DEFAULT 0,
  variance_cost REAL DEFAULT 0,
  status TEXT DEFAULT 'on-track',
  
  source TEXT DEFAULT 'manual',
  ado_feature_id TEXT,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (resource_id) REFERENCES financial_resources(id),
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  FOREIGN KEY (epic_id) REFERENCES epics(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS financial_workstreams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  workstream_name TEXT NOT NULL,
  wbse TEXT NOT NULL,
  wbse_desc TEXT,
  sme_resource_id INTEGER,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (sme_resource_id) REFERENCES financial_resources(id)
);

CREATE TABLE IF NOT EXISTS project_financial_detail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL UNIQUE,
  
  sentinel_number TEXT,
  delivery_goal TEXT,
  wbse TEXT NOT NULL,
  wbse_desc TEXT,
  auc_number TEXT,
  final_asset TEXT,
  sap_code TEXT,
  io_code TEXT,
  
  original_budget_nzd REAL DEFAULT 0,
  forecast_budget_nzd REAL DEFAULT 0,
  actual_cost_nzd REAL DEFAULT 0,
  variance_nzd REAL DEFAULT 0,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ado_feature_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id TEXT NOT NULL,
  ado_work_item_id INTEGER NOT NULL,
  ado_work_item_type TEXT,
  
  ado_state TEXT,
  ado_assigned_to TEXT,
  ado_effort REAL,
  ado_iteration_path TEXT,
  ado_area_path TEXT,
  
  backlog_submission_date TEXT,
  design_workshop_date TEXT,
  development_start_date TEXT,
  uat_target_date TEXT,
  prod_deployment_date TEXT,
  
  last_synced_at TEXT,
  sync_status TEXT DEFAULT 'synced',
  sync_error TEXT,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  UNIQUE(feature_id, ado_work_item_id)
);

CREATE TABLE IF NOT EXISTS variance_thresholds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  
  hours_variance_percent REAL DEFAULT 20.0,
  cost_variance_percent REAL DEFAULT 20.0,
  schedule_variance_days INTEGER DEFAULT 7,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  UNIQUE(entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS variance_alerts (
  id TEXT PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  
  message TEXT NOT NULL,
  details TEXT,
  variance_amount REAL,
  variance_percent REAL,
  
  acknowledged BOOLEAN DEFAULT 0,
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  
  created_at TEXT NOT NULL,
  
  CHECK (alert_type IN ('commitment', 'effort', 'cost', 'schedule', 'unauthorized')),
  CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE TABLE IF NOT EXISTS finance_ledger_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  workstream_id INTEGER,
  wbse TEXT NOT NULL,
  
  period_month TEXT NOT NULL,
  period_year INTEGER NOT NULL,
  fiscal_year TEXT,
  
  budget_type TEXT NOT NULL,
  expenditure_type TEXT NOT NULL,
  
  forecast_amount REAL DEFAULT 0,
  actual_amount REAL DEFAULT 0,
  variance_amount REAL DEFAULT 0,
  
  source_type TEXT,
  source_ids TEXT,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (workstream_id) REFERENCES financial_workstreams(id)
);
```

**Task 1.1.2: Add Indexes**

After the table creation (before the closing `);` of the `db.exec()` call), add:

```typescript
-- ===== COORDINATOR INDEXES =====

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

**Task 1.1.3: Update Schema Version**

In the same `ensureSchema()` function, find the migration section (around line 304):

```typescript
// Schema migrations based on user_version
if (current < 4) {
  db.exec('PRAGMA user_version = 4');
}
```

After the existing migrations, add:

```typescript
// Migration for Project Coordinator tables (version 6)
if (current < 6) {
  try {
    // Tables already created above via CREATE TABLE IF NOT EXISTS
    db.exec('PRAGMA user_version = 6');
    console.log('Database schema updated to version 6 (Project Coordinator tables)');
  } catch (error) {
    console.error('Failed to migrate to schema version 6:', error);
  }
}
```

**Testing Task 1.1:**
```powershell
# Run the app and check database was created
npm run dev
# Check console for "Database schema updated to version 6"
# Check database file exists
Test-Path "$env:APPDATA/RoadmapTool/roadmap.db"
```

### Step 1.2: Create TypeScript Type Definitions (4 hours)

**File:** `app/main/types/coordinator.ts` (create new file)

```typescript
// app/main/types/coordinator.ts

export type NZDate = string; // DD-MM-YYYY

// ===== RAW DATA TYPES =====

export interface RawTimesheet {
  id?: number;
  stream: string;
  month: string;
  sender_cost_center?: string;
  name_of_employee: string;
  personnel_number: string;
  status_and_processing?: string;
  date: string; // DD-MM-YYYY
  activity_type: string; // N4_CAP, N4_OPX, etc.
  general_receiver: string; // WBSE
  acct_assgnt_text?: string;
  number_unit: number; // Hours
  internal_uom?: string;
  att_absence_type?: string;
  created_on?: string;
  time_of_entry?: string;
  created_by?: string;
  last_change?: string;
  changed_at?: string;
  changed_by?: string;
  approved_by?: string;
  approval_date?: string;
  object_description?: string;
  
  imported_at: string;
  processed: boolean;
  
  resource_id?: number;
  project_id?: string;
  epic_id?: string;
  feature_id?: string;
}

export interface RawActual {
  id?: number;
  month: string;
  posting_date: string;
  document_date: string;
  cost_element: string;
  cost_element_descr?: string;
  wbs_element: string; // WBSE
  value_in_obj_crcy: number; // NZD
  period?: number;
  fiscal_year?: number;
  transaction_currency?: string;
  personnel_number?: string; // "0" for non-labour
  document_number?: string;
  created_on?: string;
  object_key?: string;
  value_tran_curr?: number;
  vbl_value_obj_curr?: number;
  name?: string;
  
  imported_at: string;
  processed: boolean;
  
  actual_type?: 'software' | 'hardware' | 'contractor' | 'other';
  resource_id?: number;
  project_id?: string;
}

export interface LabourRate {
  id?: number;
  band: string;
  local_band?: string;
  activity_type: string; // N4_CAP, N4_OPX
  fiscal_year: string;
  hourly_rate: number; // NZD
  daily_rate: number; // NZD
  uplift_amount?: number;
  uplift_percent?: number;
  
  imported_at: string;
}

// ===== FINANCIAL RESOURCES =====

export interface FinancialResource {
  id?: number;
  roadmap_resource_id?: number;
  resource_name: string;
  email?: string;
  work_area?: string;
  activity_type_cap?: string;
  activity_type_opx?: string;
  contract_type: 'FTE' | 'SOW' | 'External Squad';
  employee_id?: string; // SAP Personnel Number
  
  ado_identity_id?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ResourceCommitment {
  id: string; // UUID
  resource_id: number;
  period_start: NZDate;
  period_end: NZDate;
  commitment_type: 'per-day' | 'per-week' | 'per-fortnight';
  committed_hours: number;
  
  total_available_hours: number;
  allocated_hours: number;
  remaining_capacity: number;
  
  created_at: string;
  updated_at: string;
}

export interface FeatureAllocation {
  id: string; // UUID
  resource_id: number;
  feature_id: string;
  epic_id: string;
  project_id: string;
  
  allocated_hours: number;
  forecast_start_date?: NZDate;
  forecast_end_date?: NZDate;
  
  actual_hours_to_date: number;
  actual_cost_to_date: number;
  variance_hours: number;
  variance_cost: number;
  status: 'on-track' | 'at-risk' | 'over' | 'under';
  
  source: 'manual' | 'ado' | 'imported';
  ado_feature_id?: string;
  
  created_at: string;
  updated_at: string;
}

// ===== PROJECT FINANCIAL DATA =====

export interface FinancialWorkstream {
  id?: number;
  project_id: string;
  workstream_name: string;
  wbse: string;
  wbse_desc?: string;
  sme_resource_id?: number;
  
  created_at: string;
  updated_at: string;
}

export interface ProjectFinancialDetail {
  id?: number;
  project_id: string;
  
  sentinel_number?: string;
  delivery_goal?: string;
  wbse: string;
  wbse_desc?: string;
  auc_number?: string;
  final_asset?: string;
  sap_code?: string;
  io_code?: string;
  
  original_budget_nzd: number;
  forecast_budget_nzd: number;
  actual_cost_nzd: number;
  variance_nzd: number;
  
  created_at: string;
  updated_at: string;
}

// ===== ADO INTEGRATION =====

export interface AdoFeatureMapping {
  id?: number;
  feature_id: string;
  ado_work_item_id: number;
  ado_work_item_type?: string;
  
  ado_state?: string;
  ado_assigned_to?: string;
  ado_effort?: number;
  ado_iteration_path?: string;
  ado_area_path?: string;
  
  backlog_submission_date?: NZDate;
  design_workshop_date?: NZDate;
  development_start_date?: NZDate;
  uat_target_date?: NZDate;
  prod_deployment_date?: NZDate;
  
  last_synced_at?: string;
  sync_status: 'synced' | 'pending' | 'error';
  sync_error?: string;
  
  created_at: string;
  updated_at: string;
}

// ===== VARIANCE & ALERTS =====

export interface VarianceThreshold {
  id?: number;
  entity_type: 'resource' | 'project' | 'global';
  entity_id?: string; // NULL for global
  
  hours_variance_percent: number;
  cost_variance_percent: number;
  schedule_variance_days: number;
  
  created_at: string;
  updated_at: string;
}

export interface VarianceAlert {
  id: string; // UUID
  alert_type: 'commitment' | 'effort' | 'cost' | 'schedule' | 'unauthorized';
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity_type: 'resource' | 'project' | 'feature' | 'epic';
  entity_id: string;
  
  message: string;
  details?: any; // JSON
  variance_amount?: number;
  variance_percent?: number;
  
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  
  created_at: string;
}

// ===== FINANCE LEDGER =====

export interface FinanceLedgerEntry {
  id?: number;
  project_id: string;
  workstream_id?: number;
  wbse: string;
  
  period_month: string; // "October"
  period_year: number; // 2025
  fiscal_year?: string; // "FY26"
  
  budget_type: 'CAPEX' | 'OPEX';
  expenditure_type: 'Capped Labour' | 'Software' | 'Professional Services' | 'Hardware';
  
  forecast_amount: number;
  actual_amount: number;
  variance_amount: number;
  
  source_type?: 'timesheet' | 'actual' | 'manual';
  source_ids?: string; // JSON array
  
  created_at: string;
  updated_at: string;
}

// ===== IMPORT/EXPORT TYPES =====

export interface ImportResult {
  success: boolean;
  recordsProcessed: number;
  recordsImported: number;
  recordsFailed: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportWarning {
  row: number;
  message: string;
}

// ===== CALCULATION RESULTS =====

export interface CapacityCalculation {
  resource_id: number;
  resource_name: string;
  period_start: NZDate;
  period_end: NZDate;
  
  total_capacity_hours: number;
  allocated_hours: number;
  actual_hours: number;
  remaining_capacity: number;
  
  utilization_percent: number;
  status: 'under-utilized' | 'optimal' | 'over-committed';
}

export interface VarianceCalculation {
  entity_type: 'resource' | 'feature' | 'project';
  entity_id: string;
  entity_name: string;
  
  allocated_hours: number;
  actual_hours: number;
  variance_hours: number;
  variance_percent: number;
  
  allocated_cost: number;
  actual_cost: number;
  variance_cost: number;
  cost_variance_percent: number;
  
  status: 'on-track' | 'at-risk' | 'over' | 'under';
  threshold_hours_percent: number;
  threshold_cost_percent: number;
}
```

**Testing Task 1.2:**
```powershell
# Check TypeScript compilation
npm run typecheck
# Should pass without errors
```

### Step 1.3: Update Zustand Store Types (2 hours)

**File:** `app/renderer/state/store.ts`

Find the existing interface definitions (around line 32-70) and add after the `Feature` interface:

```typescript
// Financial Coordinator types
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

export interface FeatureAllocation {
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

Then in the `AppState` interface (around line 96), add:

```typescript
interface AppState {
  // ... existing fields
  
  // Financial Coordinator data
  financialResources: Record<string, FinancialResource>;
  resourceCommitments: Record<string, ResourceCommitment>;
  featureAllocations: Record<string, FeatureAllocation>;
  varianceAlerts: Record<string, VarianceAlert>;
}
```

**Testing Task 1.3:**
```powershell
npm run typecheck
# Should pass
```

### Step 1.4: Test Database Schema (10 hours)

**File:** `tests/unit/coordinator/database.test.ts` (create new file)

```typescript
// tests/unit/coordinator/database.test.ts
import Database from 'better-sqlite3';
import { openDB } from '../../../app/main/db';
import fs from 'fs';
import path from 'path';

describe('Project Coordinator - Database Schema', () => {
  let db: Database.Database;
  const testDbPath = path.join(__dirname, 'test-coordinator.db');

  beforeEach(() => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Create fresh database with schema
    db = openDB(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Table Creation', () => {
    test('should create raw_timesheets table', () => {
      const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='raw_timesheets'
      `).get();
      
      expect(result).toBeDefined();
      expect(result.name).toBe('raw_timesheets');
    });

    test('should create raw_actuals table', () => {
      const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='raw_actuals'
      `).get();
      
      expect(result).toBeDefined();
    });

    test('should create all 12 coordinator tables', () => {
      const expectedTables = [
        'raw_timesheets',
        'raw_actuals',
        'raw_labour_rates',
        'financial_resources',
        'resource_commitments',
        'feature_allocations',
        'financial_workstreams',
        'project_financial_detail',
        'ado_feature_mapping',
        'variance_thresholds',
        'variance_alerts',
        'finance_ledger_entries'
      ];

      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN (${expectedTables.map(() => '?').join(',')})
      `).all(...expectedTables);

      expect(tables).toHaveLength(12);
    });
  });

  describe('Table Structure', () => {
    test('raw_timesheets should have correct columns', () => {
      const columns = db.prepare(`PRAGMA table_info(raw_timesheets)`).all();
      const columnNames = columns.map((c: any) => c.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('personnel_number');
      expect(columnNames).toContain('date');
      expect(columnNames).toContain('activity_type');
      expect(columnNames).toContain('general_receiver');
      expect(columnNames).toContain('number_unit');
      expect(columnNames).toContain('resource_id');
      expect(columnNames).toContain('feature_id');
    });

    test('feature_allocations should have foreign key constraints', () => {
      const foreignKeys = db.prepare(`PRAGMA foreign_key_list(feature_allocations)`).all();
      
      expect(foreignKeys.length).toBeGreaterThan(0);
      
      const tableRefs = foreignKeys.map((fk: any) => fk.table);
      expect(tableRefs).toContain('financial_resources');
      expect(tableRefs).toContain('features');
      expect(tableRefs).toContain('epics');
      expect(tableRefs).toContain('projects');
    });
  });

  describe('Indexes', () => {
    test('should create index on raw_timesheets.personnel_number', () => {
      const indexes = db.prepare(`PRAGMA index_list(raw_timesheets)`).all();
      const indexNames = indexes.map((idx: any) => idx.name);
      
      expect(indexNames).toContain('idx_timesheets_personnel');
    });

    test('should create all coordinator indexes', () => {
      const expectedIndexes = [
        'idx_timesheets_personnel',
        'idx_timesheets_date',
        'idx_timesheets_wbse',
        'idx_actuals_wbse',
        'idx_labour_rates_activity',
        'idx_fin_resources_employee',
        'idx_commitments_resource',
        'idx_feature_alloc_resource',
        'idx_alerts_type'
      ];

      const allIndexes = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='index'
      `).all();
      
      const indexNames = allIndexes.map((idx: any) => idx.name);
      
      expectedIndexes.forEach(expectedIndex => {
        expect(indexNames).toContain(expectedIndex);
      });
    });
  });

  describe('Data Insertion', () => {
    test('should insert labour rate', () => {
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO raw_labour_rates 
        (band, activity_type, fiscal_year, hourly_rate, daily_rate, imported_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('CAPEX BAND H (N4_CAP)', 'N4_CAP', 'FY26', 92.63, 741.01, now);

      const result = db.prepare(`
        SELECT * FROM raw_labour_rates WHERE activity_type = ?
      `).get('N4_CAP');

      expect(result).toBeDefined();
      expect(result.hourly_rate).toBe(92.63);
      expect(result.daily_rate).toBe(741.01);
    });

    test('should insert financial resource', () => {
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO financial_resources 
        (resource_name, contract_type, employee_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('Test User', 'FTE', '12345678', now, now);

      const result = db.prepare(`
        SELECT * FROM financial_resources WHERE employee_id = ?
      `).get('12345678');

      expect(result).toBeDefined();
      expect(result.resource_name).toBe('Test User');
      expect(result.contract_type).toBe('FTE');
    });

    test('should enforce foreign key constraint', () => {
      const now = new Date().toISOString();
      
      // Try to insert feature_allocation without creating resource first
      expect(() => {
        db.prepare(`
          INSERT INTO feature_allocations 
          (id, resource_id, feature_id, epic_id, project_id, allocated_hours, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run('alloc-1', 999, 'feat-1', 'epic-1', 'proj-1', 100, now, now);
      }).toThrow();
    });
  });

  describe('Schema Version', () => {
    test('should be at version 6', () => {
      const result = db.prepare('PRAGMA user_version').get();
      expect(result.user_version).toBe(6);
    });
  });
});
```

**Run tests:**
```powershell
npm test tests/unit/coordinator/database.test.ts
```

**✅ Phase 1 Checklist:**
- [ ] All 12 tables created successfully
- [ ] All indexes created
- [ ] Schema version updated to 6
- [ ] TypeScript types compiled without errors
- [ ] Database tests pass
- [ ] Can start app and see tables in database

---

## Phase 2: CSV Import Services (Week 2)

**Estimated Time:** 20 hours  
**Goal:** Build CSV parsers for Timesheets, Actuals, and Labour Rates

### Step 2.1: Create Utilities (2 hours)

**File:** `app/main/utils/dateParser.ts` (create new file)

```typescript
// app/main/utils/dateParser.ts

/**
 * Parse DD-MM-YYYY date format
 * @param dateStr Date string in DD-MM-YYYY format
 * @returns ISO date string or null if invalid
 */
export function parseNZDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31) return null;
  if (month < 1 || month > 12) return null;
  if (year < 1900 || year > 2100) return null;
  
  // Create date and validate it's real
  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null; // Invalid date like 31-11-2025
  }
  
  return date.toISOString();
}

/**
 * Format ISO date to DD-MM-YYYY
 */
export function formatToNZDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Get month name from date string
 */
export function getMonthName(dateStr: string): string {
  const date = dateStr.includes('-') 
    ? new Date(parseNZDate(dateStr) || '') 
    : new Date(dateStr);
  
  return date.toLocaleString('en-US', { month: 'long' });
}
```

**File:** `app/main/utils/csvParser.ts` (create new file)

```typescript
// app/main/utils/csvParser.ts
import Papa from 'papaparse';

export interface CsvParseResult<T> {
  data: T[];
  errors: CsvError[];
  meta: {
    totalRows: number;
    validRows: number;
    errorRows: number;
  };
}

export interface CsvError {
  row: number;
  field?: string;
  value?: any;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Generic CSV parser with validation
 */
export function parseCsv<T>(
  csvData: string,
  options: {
    requiredFields: string[];
    validator?: (row: any, rowIndex: number) => CsvError[];
  }
): CsvParseResult<T> {
  const errors: CsvError[] = [];
  const validData: T[] = [];
  
  // Parse CSV
  const parseResult = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  // Check for parsing errors
  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach((err: any) => {
      errors.push({
        row: err.row || 0,
        message: `CSV Parse Error: ${err.message}`,
        severity: 'error'
      });
    });
  }

  // Validate each row
  parseResult.data.forEach((row: any, index: number) => {
    const rowNumber = index + 2; // +2 because index 0 = row 2 (after header)

    // Check required fields
    const missingFields = options.requiredFields.filter(field => !row[field]);
    if (missingFields.length > 0) {
      errors.push({
        row: rowNumber,
        field: missingFields.join(', '),
        message: `Missing required field(s): ${missingFields.join(', ')}`,
        severity: 'error'
      });
      return; // Skip this row
    }

    // Custom validation
    if (options.validator) {
      const validationErrors = options.validator(row, rowNumber);
      errors.push(...validationErrors);
      
      // If any errors are severe, skip this row
      if (validationErrors.some(e => e.severity === 'error')) {
        return;
      }
    }

    validData.push(row as T);
  });

  return {
    data: validData,
    errors,
    meta: {
      totalRows: parseResult.data.length,
      validRows: validData.length,
      errorRows: parseResult.data.length - validData.length
    }
  };
}
```

**Testing Task 2.1:**

Create `tests/unit/coordinator/csvParser.test.ts`:

```typescript
import { parseCsv } from '../../../app/main/utils/csvParser';
import { parseNZDate, formatToNZDate } from '../../../app/main/utils/dateParser';

describe('CSV Parser Utilities', () => {
  describe('parseNZDate', () => {
    test('should parse valid DD-MM-YYYY date', () => {
      const result = parseNZDate('15-03-2025');
      expect(result).toBeDefined();
      expect(new Date(result!).getDate()).toBe(15);
      expect(new Date(result!).getMonth()).toBe(2); // 0-indexed
    });

    test('should reject invalid date', () => {
      expect(parseNZDate('31-11-2025')).toBeNull(); // Nov has 30 days
      expect(parseNZDate('00-01-2025')).toBeNull();
      expect(parseNZDate('32-01-2025')).toBeNull();
      expect(parseNZDate('15-13-2025')).toBeNull();
    });

    test('should reject invalid format', () => {
      expect(parseNZDate('2025-03-15')).toBeNull(); // ISO format
      expect(parseNZDate('15/03/2025')).toBeNull(); // Wrong delimiter
      expect(parseNZDate('abc')).toBeNull();
    });
  });

  describe('parseCsv', () => {
    test('should parse valid CSV', () => {
      const csv = `name,age,email
John,30,john@test.com
Jane,25,jane@test.com`;

      const result = parseCsv(csv, {
        requiredFields: ['name', 'email']
      });

      expect(result.data).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.meta.validRows).toBe(2);
    });

    test('should detect missing required fields', () => {
      const csv = `name,age,email
John,30,john@test.com
Jane,25,`;

      const result = parseCsv(csv, {
        requiredFields: ['name', 'email']
      });

      expect(result.data).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Missing required field');
    });
  });
});
```

Run tests:
```powershell
npm test tests/unit/coordinator/csvParser.test.ts
```

---

### Step 2.2: Timesheet Import Service (6 hours)

**File:** `app/main/services/coordinator/TimesheetImportService.ts` (create new file)

```typescript
// app/main/services/coordinator/TimesheetImportService.ts
import { DB } from '../../db';
import { parseCsv, CsvError } from '../../utils/csvParser';
import { parseNZDate, getMonthName } from '../../utils/dateParser';
import type { RawTimesheet, ImportResult } from '../../types/coordinator';

export class TimesheetImportService {
  constructor(private db: DB) {}

  /**
   * Import timesheets from CSV
   */
  async importTimesheets(csvData: string): Promise<ImportResult> {
    const requiredFields = [
      'Stream',
      'Month',
      'Name of employee or applicant',
      'Personnel Number',
      'Date',
      'Activity Type',
      'General receiver', // WBSE
      'Number (unit)' // Hours
    ];

    // Parse CSV with validation
    const parseResult = parseCsv<any>(csvData, {
      requiredFields,
      validator: (row, rowNumber) => this.validateTimesheetRow(row, rowNumber)
    });

    // Begin transaction
    const insertStmt = this.db.prepare(`
      INSERT INTO raw_timesheets (
        stream, month, sender_cost_center, name_of_employee,
        personnel_number, status_and_processing, date,
        activity_type, general_receiver, acct_assgnt_text,
        number_unit, internal_uom, att_absence_type,
        created_on, time_of_entry, created_by,
        last_change, changed_at, changed_by,
        approved_by, approval_date, object_description,
        imported_at, processed
      ) VALUES (
        @stream, @month, @sender_cost_center, @name_of_employee,
        @personnel_number, @status_and_processing, @date,
        @activity_type, @general_receiver, @acct_assgnt_text,
        @number_unit, @internal_uom, @att_absence_type,
        @created_on, @time_of_entry, @created_by,
        @last_change, @changed_at, @changed_by,
        @approved_by, @approval_date, @object_description,
        @imported_at, 0
      )
    `);

    const insertMany = this.db.transaction((rows: any[]) => {
      let imported = 0;
      const errors: CsvError[] = [];

      rows.forEach((row, index) => {
        try {
          const timesheet = this.mapCsvRowToTimesheet(row);
          insertStmt.run(timesheet);
          imported++;
        } catch (error: any) {
          errors.push({
            row: index + 2,
            message: `Insert failed: ${error.message}`,
            severity: 'error'
          });
        }
      });

      return { imported, errors };
    });

    const result = insertMany(parseResult.data);

    return {
      success: result.imported > 0,
      recordsProcessed: parseResult.meta.totalRows,
      recordsImported: result.imported,
      recordsFailed: parseResult.meta.errorRows + result.errors.length,
      errors: [...parseResult.errors, ...result.errors],
      warnings: []
    };
  }

  /**
   * Validate a single timesheet row
   */
  private validateTimesheetRow(row: any, rowNumber: number): CsvError[] {
    const errors: CsvError[] = [];

    // Validate date format (DD-MM-YYYY)
    const dateValue = row['Date'];
    if (dateValue && !parseNZDate(dateValue)) {
      errors.push({
        row: rowNumber,
        field: 'Date',
        value: dateValue,
        message: `Invalid date format. Expected DD-MM-YYYY, got: ${dateValue}`,
        severity: 'error'
      });
    }

    // Validate hours (must be positive number)
    const hours = parseFloat(row['Number (unit)']);
    if (isNaN(hours) || hours < 0) {
      errors.push({
        row: rowNumber,
        field: 'Number (unit)',
        value: row['Number (unit)'],
        message: `Invalid hours value. Must be positive number, got: ${row['Number (unit)']}`,
        severity: 'error'
      });
    }

    // Validate hours not exceeding 24 per day
    if (hours > 24) {
      errors.push({
        row: rowNumber,
        field: 'Number (unit)',
        value: hours,
        message: `Hours exceed 24 for single day: ${hours}`,
        severity: 'warning'
      });
    }

    // Validate personnel number is numeric
    const personnelNumber = row['Personnel Number'];
    if (personnelNumber && !/^\d+$/.test(personnelNumber)) {
      errors.push({
        row: rowNumber,
        field: 'Personnel Number',
        value: personnelNumber,
        message: `Personnel Number must be numeric, got: ${personnelNumber}`,
        severity: 'warning'
      });
    }

    return errors;
  }

  /**
   * Map CSV row to database structure
   */
  private mapCsvRowToTimesheet(row: any): Omit<RawTimesheet, 'id'> {
    const now = new Date().toISOString();
    
    return {
      stream: row['Stream'] || '',
      month: row['Month'] || '',
      sender_cost_center: row['Sender Cost Center'],
      name_of_employee: row['Name of employee or applicant'],
      personnel_number: row['Personnel Number'],
      status_and_processing: row['Status and Processing Indicator'],
      date: row['Date'],
      activity_type: row['Activity Type'],
      general_receiver: row['General receiver'], // WBSE
      acct_assgnt_text: row['Acct assgnt text'],
      number_unit: parseFloat(row['Number (unit)']),
      internal_uom: row['Internal UoM'],
      att_absence_type: row['Att./Absence type'],
      created_on: row['Created on'],
      time_of_entry: row['Time of entry'],
      created_by: row['Created by'],
      last_change: row['Last Change'],
      changed_at: row['Changed At'],
      changed_by: row['Changed by'],
      approved_by: row['Approved by'],
      approval_date: row['Approval date'],
      object_description: row['Object Description'],
      imported_at: now,
      processed: false
    };
  }

  /**
   * Get unprocessed timesheets
   */
  async getUnprocessedTimesheets(): Promise<RawTimesheet[]> {
    return this.db.prepare(`
      SELECT * FROM raw_timesheets 
      WHERE processed = 0
      ORDER BY date ASC
    `).all() as RawTimesheet[];
  }

  /**
   * Mark timesheets as processed
   */
  async markAsProcessed(ids: number[]): Promise<void> {
    const updateStmt = this.db.prepare(`
      UPDATE raw_timesheets SET processed = 1 WHERE id = ?
    `);
    
    const updateMany = this.db.transaction((idList: number[]) => {
      idList.forEach(id => updateStmt.run(id));
    });
    
    updateMany(ids);
  }
}
```

**Testing Task 2.2:**

Create `tests/unit/coordinator/TimesheetImportService.test.ts`:

```typescript
import Database from 'better-sqlite3';
import { openDB } from '../../../app/main/db';
import { TimesheetImportService } from '../../../app/main/services/coordinator/TimesheetImportService';
import fs from 'fs';
import path from 'path';

describe('TimesheetImportService', () => {
  let db: Database.Database;
  let service: TimesheetImportService;
  const testDbPath = path.join(__dirname, 'test-timesheet-import.db');

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = openDB(testDbPath);
    service = new TimesheetImportService(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('should import valid timesheets', async () => {
    const csv = `Stream,Month,Sender Cost Center,Name of employee or applicant,Personnel Number,Status and Processing Indicator,Date,Activity Type,General receiver,Acct assgnt text,Number (unit),Internal UoM,Att./Absence type,Created on,Time of entry,Created by,Last Change,Changed At,Changed by,Approved by,Approval date,Object Description
OneIntune,October,,Abbie AllHouse,19507812,,31-10-2025,N4_CAP,N.93003271.004,98047 Modern Workspace,6.000,H,,10-10-2025,12:06:19 PM,19507812,10-10-2025,2:23:35 PM,11423376,11423376,10-10-2025,98047 Modern Workspace`;

    const result = await service.importTimesheets(csv);

    expect(result.success).toBe(true);
    expect(result.recordsImported).toBe(1);
    expect(result.recordsFailed).toBe(0);
    expect(result.errors).toHaveLength(0);

    const timesheets = db.prepare('SELECT * FROM raw_timesheets').all();
    expect(timesheets).toHaveLength(1);
    expect(timesheets[0].personnel_number).toBe('19507812');
    expect(timesheets[0].number_unit).toBe(6);
  });

  test('should reject invalid date format', async () => {
    const csv = `Stream,Month,Name of employee or applicant,Personnel Number,Date,Activity Type,General receiver,Number (unit)
OneIntune,October,Test User,12345678,2025-10-31,N4_CAP,N.93003271.004,6.000`;

    const result = await service.importTimesheets(csv);

    expect(result.recordsImported).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Invalid date format');
  });

  test('should reject negative hours', async () => {
    const csv = `Stream,Month,Name of employee or applicant,Personnel Number,Date,Activity Type,General receiver,Number (unit)
OneIntune,October,Test User,12345678,31-10-2025,N4_CAP,N.93003271.004,-5.000`;

    const result = await service.importTimesheets(csv);

    expect(result.recordsImported).toBe(0);
    expect(result.errors.some(e => e.message.includes('Invalid hours'))).toBe(true);
  });

  test('should warn on hours exceeding 24', async () => {
    const csv = `Stream,Month,Name of employee or applicant,Personnel Number,Date,Activity Type,General receiver,Number (unit)
OneIntune,October,Test User,12345678,31-10-2025,N4_CAP,N.93003271.004,25.000`;

    const result = await service.importTimesheets(csv);

    // Should still import with warning
    expect(result.recordsImported).toBe(1);
    expect(result.errors.some(e => e.severity === 'warning' && e.message.includes('exceed 24'))).toBe(true);
  });
});
```

Run tests:
```powershell
npm test tests/unit/coordinator/TimesheetImportService.test.ts
```

---

### Step 2.3: Actuals Import Service (6 hours)

**File:** `app/main/services/coordinator/ActualsImportService.ts` (create new file)

```typescript
// app/main/services/coordinator/ActualsImportService.ts
import { DB } from '../../db';
import { parseCsv, CsvError } from '../../utils/csvParser';
import type { RawActual, ImportResult } from '../../types/coordinator';

export class ActualsImportService {
  constructor(private db: DB) {}

  /**
   * Import actuals from SAP FI CSV export
   */
  async importActuals(csvData: string): Promise<ImportResult> {
    const requiredFields = [
      'Month',
      'Posting Date',
      'Cost Element',
      'WBS element',
      'Value in Obj. Crcy'
    ];

    const parseResult = parseCsv<any>(csvData, {
      requiredFields,
      validator: (row, rowNumber) => this.validateActualRow(row, rowNumber)
    });

    const insertStmt = this.db.prepare(`
      INSERT INTO raw_actuals (
        month, posting_date, document_date, cost_element, cost_element_descr,
        wbs_element, value_in_obj_crcy, period, fiscal_year, transaction_currency,
        personnel_number, document_number, created_on, object_key,
        value_tran_curr, vbl_value_obj_curr, name, imported_at, processed
      ) VALUES (
        @month, @posting_date, @document_date, @cost_element, @cost_element_descr,
        @wbs_element, @value_in_obj_crcy, @period, @fiscal_year, @transaction_currency,
        @personnel_number, @document_number, @created_on, @object_key,
        @value_tran_curr, @vbl_value_obj_curr, @name, @imported_at, 0
      )
    `);

    const insertMany = this.db.transaction((rows: any[]) => {
      let imported = 0;
      const errors: CsvError[] = [];

      rows.forEach((row, index) => {
        try {
          const actual = this.mapCsvRowToActual(row);
          insertStmt.run(actual);
          imported++;
        } catch (error: any) {
          errors.push({
            row: index + 2,
            message: `Insert failed: ${error.message}`,
            severity: 'error'
          });
        }
      });

      return { imported, errors };
    });

    const result = insertMany(parseResult.data);

    return {
      success: result.imported > 0,
      recordsProcessed: parseResult.meta.totalRows,
      recordsImported: result.imported,
      recordsFailed: parseResult.meta.errorRows + result.errors.length,
      errors: [...parseResult.errors, ...result.errors],
      warnings: []
    };
  }

  private validateActualRow(row: any, rowNumber: number): CsvError[] {
    const errors: CsvError[] = [];

    // Validate amount is numeric
    const amount = parseFloat(row['Value in Obj. Crcy']);
    if (isNaN(amount)) {
      errors.push({
        row: rowNumber,
        field: 'Value in Obj. Crcy',
        value: row['Value in Obj. Crcy'],
        message: `Invalid amount. Must be numeric.`,
        severity: 'error'
      });
    }

    // Validate cost element
    const costElement = row['Cost Element'];
    if (costElement && !/^\d+$/.test(costElement)) {
      errors.push({
        row: rowNumber,
        field: 'Cost Element',
        value: costElement,
        message: `Cost Element should be numeric`,
        severity: 'warning'
      });
    }

    return errors;
  }

  private mapCsvRowToActual(row: any): Omit<RawActual, 'id'> {
    const now = new Date().toISOString();
    
    return {
      month: row['Month'] || '',
      posting_date: row['Posting Date'] || '',
      document_date: row['Document Date'] || '',
      cost_element: row['Cost Element'] || '',
      cost_element_descr: row['Cost element descr.'],
      wbs_element: row['WBS element'] || '',
      value_in_obj_crcy: parseFloat(row['Value in Obj. Crcy']) || 0,
      period: row['Period'] ? parseInt(row['Period'], 10) : undefined,
      fiscal_year: row['Fiscal Year'] ? parseInt(row['Fiscal Year'], 10) : undefined,
      transaction_currency: row['Transaction Currency'],
      personnel_number: row['Personnel Number'],
      document_number: row['Document Number'],
      created_on: row['Created on'],
      object_key: row['Object key'],
      value_tran_curr: row['Value TranCurr'] ? parseFloat(row['Value TranCurr']) : undefined,
      vbl_value_obj_curr: row['Vbl. value/Obj. curr'] ? parseFloat(row['Vbl. value/Obj. curr']) : undefined,
      name: row['Name'],
      imported_at: now,
      processed: false
    };
  }

  /**
   * Categorize actuals by type (software, hardware, contractor)
   */
  async categorizeActuals(): Promise<void> {
    // Software: Cost Element starts with 115
    this.db.prepare(`
      UPDATE raw_actuals 
      SET actual_type = 'software'
      WHERE cost_element LIKE '115%' AND actual_type IS NULL
    `).run();

    // Contractor: Personnel Number != '0'
    this.db.prepare(`
      UPDATE raw_actuals 
      SET actual_type = 'contractor'
      WHERE personnel_number IS NOT NULL 
        AND personnel_number != '0' 
        AND actual_type IS NULL
    `).run();

    // Hardware: Cost Element starts with 116
    this.db.prepare(`
      UPDATE raw_actuals 
      SET actual_type = 'hardware'
      WHERE cost_element LIKE '116%' AND actual_type IS NULL
    `).run();
  }
}
```

### Step 2.4: Labour Rates Import Service (4 hours)

**File:** `app/main/services/coordinator/LabourRatesImportService.ts`

```typescript
// app/main/services/coordinator/LabourRatesImportService.ts
import { DB } from '../../db';
import { parseCsv, CsvError } from '../../utils/csvParser';
import type { LabourRate, ImportResult } from '../../types/coordinator';

export class LabourRatesImportService {
  constructor(private db: DB) {}

  async importLabourRates(csvData: string, fiscalYear: string): Promise<ImportResult> {
    const requiredFields = ['Band', 'Activity Type', 'Hourly Rate', 'Daily Rate'];

    const parseResult = parseCsv<any>(csvData, {
      requiredFields,
      validator: (row, rowNumber) => this.validateRateRow(row, rowNumber)
    });

    // Delete existing rates for this fiscal year
    this.db.prepare(`DELETE FROM raw_labour_rates WHERE fiscal_year = ?`).run(fiscalYear);

    const insertStmt = this.db.prepare(`
      INSERT INTO raw_labour_rates (
        band, local_band, activity_type, fiscal_year,
        hourly_rate, daily_rate, uplift_amount, uplift_percent, imported_at
      ) VALUES (
        @band, @local_band, @activity_type, @fiscal_year,
        @hourly_rate, @daily_rate, @uplift_amount, @uplift_percent, @imported_at
      )
    `);

    const insertMany = this.db.transaction((rows: any[]) => {
      let imported = 0;
      const errors: CsvError[] = [];

      rows.forEach((row, index) => {
        try {
          const rate = this.mapCsvRowToRate(row, fiscalYear);
          insertStmt.run(rate);
          imported++;
        } catch (error: any) {
          errors.push({
            row: index + 2,
            message: `Insert failed: ${error.message}`,
            severity: 'error'
          });
        }
      });

      return { imported, errors };
    });

    const result = insertMany(parseResult.data);

    return {
      success: result.imported > 0,
      recordsProcessed: parseResult.meta.totalRows,
      recordsImported: result.imported,
      recordsFailed: parseResult.meta.errorRows + result.errors.length,
      errors: [...parseResult.errors, ...result.errors],
      warnings: []
    };
  }

  private validateRateRow(row: any, rowNumber: number): CsvError[] {
    const errors: CsvError[] = [];

    // Validate hourly rate
    const hourly = this.parseNZDAmount(row['Hourly Rate']);
    if (hourly === null || hourly < 0) {
      errors.push({
        row: rowNumber,
        field: 'Hourly Rate',
        value: row['Hourly Rate'],
        message: `Invalid hourly rate`,
        severity: 'error'
      });
    }

    // Validate daily rate
    const daily = this.parseNZDAmount(row['Daily Rate']);
    if (daily === null || daily < 0) {
      errors.push({
        row: rowNumber,
        field: 'Daily Rate',
        value: row['Daily Rate'],
        message: `Invalid daily rate`,
        severity: 'error'
      });
    }

    // Check daily rate is approximately 8x hourly (allow 10% variance)
    if (hourly && daily) {
      const expected = hourly * 8;
      const variance = Math.abs((daily - expected) / expected);
      if (variance > 0.1) {
        errors.push({
          row: rowNumber,
          message: `Daily rate (${daily}) should be ~8x hourly rate (${hourly})`,
          severity: 'warning'
        });
      }
    }

    return errors;
  }

  /**
   * Parse NZD amount (handles $, commas)
   */
  private parseNZDAmount(value: string): number | null {
    if (!value) return null;
    
    // Remove $, spaces, commas
    const cleaned = value.replace(/[$\s,]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? null : parsed;
  }

  private mapCsvRowToRate(row: any, fiscalYear: string): Omit<LabourRate, 'id'> {
    const now = new Date().toISOString();
    
    return {
      band: row['Band'] || '',
      local_band: row['Local Band'],
      activity_type: row['Activity Type'] || '',
      fiscal_year: fiscalYear,
      hourly_rate: this.parseNZDAmount(row['Hourly Rate']) || 0,
      daily_rate: this.parseNZDAmount(row['Daily Rate']) || 0,
      uplift_amount: row['$ Uplift'] ? this.parseNZDAmount(row['$ Uplift']) : undefined,
      uplift_percent: row['% Uplift'] ? parseFloat(row['% Uplift']) : undefined,
      imported_at: now
    };
  }
}
```

**✅ Phase 2 Checklist:**
- [ ] CSV parser utilities created and tested
- [ ] TimesheetImportService implemented with validation
- [ ] ActualsImportService implemented with categorization
- [ ] LabourRatesImportService implemented with NZD parsing
- [ ] All import services have unit tests
- [ ] Can import sample CSV files successfully

---

## Phase 3: Resource Management (Week 3)

**Estimated Time:** 20 hours  
**Goal:** Build commitment and allocation services

### Step 3.1: Resource Commitment Service (8 hours)

**File:** `app/main/services/coordinator/ResourceCommitmentService.ts`

```typescript
// app/main/services/coordinator/ResourceCommitmentService.ts
import { DB } from '../../db';
import { v4 as uuidv4 } from 'uuid';
import type { ResourceCommitment, CapacityCalculation } from '../../types/coordinator';

export class ResourceCommitmentService {
  constructor(private db: DB) {}

  /**
   * Create a new resource commitment
   */
  async createCommitment(data: {
    resource_id: number;
    period_start: string; // DD-MM-YYYY
    period_end: string;
    commitment_type: 'per-day' | 'per-week' | 'per-fortnight';
    committed_hours: number;
  }): Promise<ResourceCommitment> {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Calculate total available hours
    const totalHours = await this.calculateTotalAvailableHours(
      data.period_start,
      data.period_end,
      data.commitment_type,
      data.committed_hours
    );

    const commitment: ResourceCommitment = {
      id,
      resource_id: data.resource_id,
      period_start: data.period_start,
      period_end: data.period_end,
      commitment_type: data.commitment_type,
      committed_hours: data.committed_hours,
      total_available_hours: totalHours,
      allocated_hours: 0,
      remaining_capacity: totalHours,
      created_at: now,
      updated_at: now
    };

    this.db.prepare(`
      INSERT INTO resource_commitments (
        id, resource_id, period_start, period_end, commitment_type,
        committed_hours, total_available_hours, allocated_hours,
        remaining_capacity, created_at, updated_at
      ) VALUES (
        @id, @resource_id, @period_start, @period_end, @commitment_type,
        @committed_hours, @total_available_hours, @allocated_hours,
        @remaining_capacity, @created_at, @updated_at
      )
    `).run(commitment);

    return commitment;
  }

  /**
   * Calculate total available hours based on commitment type
   */
  private async calculateTotalAvailableHours(
    startDate: string,
    endDate: string,
    type: 'per-day' | 'per-week' | 'per-fortnight',
    committedHours: number
  ): Promise<number> {
    // Get working days from calendar module
    const workingDays = await this.getWorkingDaysBetween(startDate, endDate);

    switch (type) {
      case 'per-day':
        return committedHours * workingDays;
      
      case 'per-week':
        const weeks = workingDays / 5; // Assume 5-day work week
        return committedHours * weeks;
      
      case 'per-fortnight':
        const fortnights = workingDays / 10;
        return committedHours * fortnights;
      
      default:
        throw new Error(`Unknown commitment type: ${type}`);
    }
  }

  /**
   * Get working days between two dates (excluding weekends and holidays)
   */
  private async getWorkingDaysBetween(startDate: string, endDate: string): Promise<number> {
    // Parse DD-MM-YYYY
    const [startDay, startMonth, startYear] = startDate.split('-').map(Number);
    const [endDay, endMonth, endYear] = endDate.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    // Get public holidays from calendar module
    const holidays = this.db.prepare(`
      SELECT start_date FROM public_holidays
      WHERE start_date >= ? AND start_date <= ?
    `).all(start.toISOString(), end.toISOString());
    
    const holidayDates = new Set(holidays.map((h: any) => h.start_date.split('T')[0]));

    let workingDays = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];
      
      // Count if not weekend and not holiday
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        workingDays++;
      }
      
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Update commitment allocated hours (called when allocations change)
   */
  async updateAllocatedHours(commitmentId: string): Promise<void> {
    const now = new Date().toISOString();

    // Sum allocated hours from feature_allocations
    const result = this.db.prepare(`
      SELECT COALESCE(SUM(fa.allocated_hours), 0) as total
      FROM feature_allocations fa
      WHERE fa.resource_id = (
        SELECT resource_id FROM resource_commitments WHERE id = ?
      )
    `).get(commitmentId) as any;

    const allocatedHours = result.total;

    // Update commitment
    this.db.prepare(`
      UPDATE resource_commitments
      SET allocated_hours = ?,
          remaining_capacity = total_available_hours - ?,
          updated_at = ?
      WHERE id = ?
    `).run(allocatedHours, allocatedHours, now, commitmentId);
  }

  /**
   * Get capacity calculation for a resource
   */
  async getCapacityCalculation(resourceId: number, periodStart: string, periodEnd: string): Promise<CapacityCalculation> {
    // Get commitment
    const commitment = this.db.prepare(`
      SELECT * FROM resource_commitments
      WHERE resource_id = ?
        AND period_start <= ?
        AND period_end >= ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(resourceId, periodEnd, periodStart) as ResourceCommitment | undefined;

    if (!commitment) {
      throw new Error(`No commitment found for resource ${resourceId} in period ${periodStart} to ${periodEnd}`);
    }

    // Get actual hours from timesheets
    const actualResult = this.db.prepare(`
      SELECT COALESCE(SUM(number_unit), 0) as total
      FROM raw_timesheets
      WHERE resource_id = ?
        AND date >= ?
        AND date <= ?
    `).get(resourceId, periodStart, periodEnd) as any;

    const actualHours = actualResult.total;
    const utilizationPercent = (actualHours / commitment.total_available_hours) * 100;

    // Determine status
    let status: 'under-utilized' | 'optimal' | 'over-committed';
    if (utilizationPercent < 70) {
      status = 'under-utilized';
    } else if (utilizationPercent > 100) {
      status = 'over-committed';
    } else {
      status = 'optimal';
    }

    // Get resource name
    const resource = this.db.prepare(`
      SELECT resource_name FROM financial_resources WHERE id = ?
    `).get(resourceId) as any;

    return {
      resource_id: resourceId,
      resource_name: resource.resource_name,
      period_start: periodStart,
      period_end: periodEnd,
      total_capacity_hours: commitment.total_available_hours,
      allocated_hours: commitment.allocated_hours,
      actual_hours: actualHours,
      remaining_capacity: commitment.remaining_capacity,
      utilization_percent: utilizationPercent,
      status
    };
  }

  /**
   * Detect over-committed resources
   */
  async detectOverCommitments(): Promise<Array<{ resource_id: number; resource_name: string; over_by: number }>> {
    const results = this.db.prepare(`
      SELECT 
        rc.resource_id,
        fr.resource_name,
        (rc.allocated_hours - rc.total_available_hours) as over_by
      FROM resource_commitments rc
      JOIN financial_resources fr ON fr.id = rc.resource_id
      WHERE rc.allocated_hours > rc.total_available_hours
    `).all();

    return results as any[];
  }
}
```

### Step 3.2: Allocation Service (8 hours)

**File:** `app/main/services/coordinator/AllocationService.ts`

```typescript
// app/main/services/coordinator/AllocationService.ts
import { DB } from '../../db';
import { v4 as uuidv4 } from 'uuid';
import type { FeatureAllocation } from '../../types/coordinator';

export class AllocationService {
  constructor(private db: DB) {}

  /**
   * Create feature allocation
   */
  async createAllocation(data: {
    resource_id: number;
    feature_id: string;
    allocated_hours: number;
    forecast_start_date?: string;
    forecast_end_date?: string;
  }): Promise<FeatureAllocation> {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Get epic_id and project_id from feature
    const feature = this.db.prepare(`
      SELECT epic_id, project_id FROM features WHERE id = ?
    `).get(data.feature_id) as any;

    if (!feature) {
      throw new Error(`Feature ${data.feature_id} not found`);
    }

    const allocation: FeatureAllocation = {
      id,
      resource_id: data.resource_id,
      feature_id: data.feature_id,
      epic_id: feature.epic_id,
      project_id: feature.project_id,
      allocated_hours: data.allocated_hours,
      forecast_start_date: data.forecast_start_date,
      forecast_end_date: data.forecast_end_date,
      actual_hours_to_date: 0,
      actual_cost_to_date: 0,
      variance_hours: 0,
      variance_cost: 0,
      status: 'on-track',
      source: 'manual',
      created_at: now,
      updated_at: now
    };

    this.db.prepare(`
      INSERT INTO feature_allocations (
        id, resource_id, feature_id, epic_id, project_id,
        allocated_hours, forecast_start_date, forecast_end_date,
        actual_hours_to_date, actual_cost_to_date, variance_hours, variance_cost,
        status, source, created_at, updated_at
      ) VALUES (
        @id, @resource_id, @feature_id, @epic_id, @project_id,
        @allocated_hours, @forecast_start_date, @forecast_end_date,
        @actual_hours_to_date, @actual_cost_to_date, @variance_hours, @variance_cost,
        @status, @source, @created_at, @updated_at
      )
    `).run(allocation);

    // Update commitment allocated hours
    await this.updateCommitmentAllocations(data.resource_id);

    return allocation;
  }

  /**
   * Update allocation with actuals from timesheets
   */
  async reconcileAllocationWithTimesheets(allocationId: string): Promise<void> {
    const allocation = this.db.prepare(`
      SELECT * FROM feature_allocations WHERE id = ?
    `).get(allocationId) as FeatureAllocation;

    if (!allocation) return;

    // Sum hours from timesheets for this feature
    const result = this.db.prepare(`
      SELECT COALESCE(SUM(number_unit), 0) as total
      FROM raw_timesheets
      WHERE resource_id = ? AND feature_id = ?
    `).get(allocation.resource_id, allocation.feature_id) as any;

    const actualHours = result.total;

    // Get labour rate
    const resource = this.db.prepare(`
      SELECT activity_type_cap FROM financial_resources WHERE id = ?
    `).get(allocation.resource_id) as any;

    const rate = this.db.prepare(`
      SELECT hourly_rate FROM raw_labour_rates WHERE activity_type = ?
    `).get(resource.activity_type_cap) as any;

    const hourlyRate = rate?.hourly_rate || 0;
    const actualCost = actualHours * hourlyRate;

    // Calculate variance
    const varianceHours = actualHours - allocation.allocated_hours;
    const varianceCost = varianceHours * hourlyRate;
    const variancePercent = (varianceHours / allocation.allocated_hours) * 100;

    // Determine status
    let status: 'on-track' | 'at-risk' | 'over' | 'under';
    if (Math.abs(variancePercent) <= 10) {
      status = 'on-track';
    } else if (variancePercent > 20) {
      status = 'under';
    } else if (variancePercent < -20) {
      status = 'over';
    } else {
      status = 'at-risk';
    }

    // Update allocation
    this.db.prepare(`
      UPDATE feature_allocations
      SET actual_hours_to_date = ?,
          actual_cost_to_date = ?,
          variance_hours = ?,
          variance_cost = ?,
          status = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      actualHours,
      actualCost,
      varianceHours,
      varianceCost,
      status,
      new Date().toISOString(),
      allocationId
    );
  }

  /**
   * Update all commitment allocations for a resource
   */
  private async updateCommitmentAllocations(resourceId: number): Promise<void> {
    const commitments = this.db.prepare(`
      SELECT id FROM resource_commitments WHERE resource_id = ?
    `).all(resourceId) as Array<{ id: string }>;

    for (const commitment of commitments) {
      // This would call ResourceCommitmentService.updateAllocatedHours
      // For now, we'll do it directly
      const result = this.db.prepare(`
        SELECT COALESCE(SUM(allocated_hours), 0) as total
        FROM feature_allocations
        WHERE resource_id = ?
      `).get(resourceId) as any;

      this.db.prepare(`
        UPDATE resource_commitments
        SET allocated_hours = ?,
            remaining_capacity = total_available_hours - ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        result.total,
        result.total,
        new Date().toISOString(),
        commitment.id
      );
    }
  }

  /**
   * Get all allocations for a feature
   */
  async getAllocationsForFeature(featureId: string): Promise<FeatureAllocation[]> {
    return this.db.prepare(`
      SELECT fa.*, fr.resource_name
      FROM feature_allocations fa
      JOIN financial_resources fr ON fr.id = fa.resource_id
      WHERE fa.feature_id = ?
    `).all(featureId) as any[];
  }
}
```

### Step 3.3: Basic UI - Commitment Entry (4 hours)

**File:** `app/renderer/components/coordinator/CommitmentEntryForm.tsx`

```tsx
// app/renderer/components/coordinator/CommitmentEntryForm.tsx
import React, { useState } from 'react';
import type { FinancialResource } from '../../state/store';

interface CommitmentEntryFormProps {
  resources: FinancialResource[];
  onSubmit: (data: {
    resource_id: number;
    period_start: string;
    period_end: string;
    commitment_type: 'per-day' | 'per-week' | 'per-fortnight';
    committed_hours: number;
  }) => Promise<void>;
}

export function CommitmentEntryForm({ resources, onSubmit }: CommitmentEntryFormProps) {
  const [resourceId, setResourceId] = useState<number | ''>('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [commitmentType, setCommitmentType] = useState<'per-day' | 'per-week' | 'per-fortnight'>('per-day');
  const [committedHours, setCommittedHours] = useState<number>(8);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resourceId || !periodStart || !periodEnd) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        resource_id: resourceId as number,
        period_start: periodStart,
        period_end: periodEnd,
        commitment_type: commitmentType,
        committed_hours: committedHours
      });
      
      // Reset form
      setResourceId('');
      setPeriodStart('');
      setPeriodEnd('');
      setCommittedHours(8);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="commitment-entry-form">
      <h3>"I can commit X hours"</h3>
      
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <div className="form-group">
        <label htmlFor="resource">Resource *</label>
        <select
          id="resource"
          value={resourceId}
          onChange={(e) => setResourceId(Number(e.target.value))}
          required
        >
          <option value="">Select resource...</option>
          {resources.map(r => (
            <option key={r.id} value={r.id}>
              {r.resource_name} ({r.contract_type})
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="period_start">Period Start (DD-MM-YYYY) *</label>
          <input
            type="text"
            id="period_start"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            placeholder="01-04-2025"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="period_end">Period End (DD-MM-YYYY) *</label>
          <input
            type="text"
            id="period_end"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            placeholder="30-06-2025"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="committed_hours">Committed Hours *</label>
          <input
            type="number"
            id="committed_hours"
            value={committedHours}
            onChange={(e) => setCommittedHours(Number(e.target.value))}
            min="0"
            max="24"
            step="0.5"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="commitment_type">Per *</label>
          <select
            id="commitment_type"
            value={commitmentType}
            onChange={(e) => setCommitmentType(e.target.value as any)}
            required
          >
            <option value="per-day">Day</option>
            <option value="per-week">Week</option>
            <option value="per-fortnight">Fortnight</option>
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Commitment'}
      </button>
    </form>
  );
}
```

**✅ Phase 3 Checklist:**
- [ ] ResourceCommitmentService implemented with capacity calculations
- [ ] AllocationService implemented with reconciliation
- [ ] Working days calculation integrates with Calendar module
- [ ] Commitment entry form functional
- [ ] Can create commitments and allocations via UI
- [ ] Over-commitment detection works

---

## Phase 4: ADO Integration (Week 4)

**Estimated Time:** 20 hours  
**Goal:** Sync ADO features to resource allocations

### Step 4.1: ADO Sync Service (12 hours)

**File:** `app/main/services/coordinator/AdoSyncService.ts`

```typescript
// app/main/services/coordinator/AdoSyncService.ts
import { DB } from '../../db';
import { AdoApiService } from '../ado/AdoApiService';
import type { AdoFeatureMapping } from '../../types/coordinator';

export class AdoSyncService {
  constructor(
    private db: DB,
    private adoApiService: AdoApiService
  ) {}

  /**
   * Sync ADO features to feature allocations
   */
  async syncFeaturesToAdo(featureIds: string[]): Promise<{ synced: number; errors: string[] }> {
    let synced = 0;
    const errors: string[] = [];

    for (const featureId of featureIds) {
      try {
        await this.syncSingleFeature(featureId);
        synced++;
      } catch (error: any) {
        errors.push(`${featureId}: ${error.message}`);
      }
    }

    return { synced, errors };
  }

  /**
   * Sync a single feature
   */
  private async syncSingleFeature(featureId: string): Promise<void> {
    // Get existing mapping
    const mapping = this.db.prepare(`
      SELECT * FROM ado_feature_mapping WHERE feature_id = ?
    `).get(featureId) as AdoFeatureMapping | undefined;

    if (!mapping) {
      // No ADO mapping, skip
      return;
    }

    // Fetch work item from ADO
    const response = await this.adoApiService.getWorkItem(mapping.ado_work_item_id, ['relations']);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch work item');
    }

    const workItem = response.data;
    const now = new Date().toISOString();

    // Update mapping with ADO data
    this.db.prepare(`
      UPDATE ado_feature_mapping
      SET ado_state = ?,
          ado_assigned_to = ?,
          ado_effort = ?,
          ado_iteration_path = ?,
          ado_area_path = ?,
          last_synced_at = ?,
          sync_status = 'synced',
          sync_error = NULL,
          updated_at = ?
      WHERE id = ?
    `).run(
      workItem.fields['System.State'],
      workItem.fields['System.AssignedTo']?.displayName,
      workItem.fields['Microsoft.VSTS.Scheduling.Effort'],
      workItem.fields['System.IterationPath'],
      workItem.fields['System.AreaPath'],
      now,
      now,
      mapping.id
    );

    // Sync resource allocation if assigned
    if (workItem.fields['System.AssignedTo']) {
      await this.syncResourceAllocation(featureId, workItem);
    }

    // Sync external squad milestones if applicable
    await this.syncExternalSquadMilestones(mapping, workItem);
  }

  /**
   * Sync resource allocation from ADO assigned_to
   */
  private async syncResourceAllocation(featureId: string, workItem: any): Promise<void> {
    const assignedTo = workItem.fields['System.AssignedTo'];
    if (!assignedTo) return;

    // Find resource by ADO identity
    const resource = this.db.prepare(`
      SELECT id FROM financial_resources 
      WHERE ado_identity_id = ? OR email = ?
    `).get(assignedTo.uniqueName, assignedTo.uniqueName) as any;

    if (!resource) {
      console.warn(`Resource not found for ADO user: ${assignedTo.displayName}`);
      return;
    }

    const effort = workItem.fields['Microsoft.VSTS.Scheduling.Effort'] || 0;
    
    // Get feature details
    const feature = this.db.prepare(`
      SELECT epic_id, project_id FROM features WHERE id = ?
    `).get(featureId) as any;

    // Check if allocation already exists
    const existing = this.db.prepare(`
      SELECT id FROM feature_allocations 
      WHERE resource_id = ? AND feature_id = ?
    `).get(resource.id, featureId) as any;

    const now = new Date().toISOString();

    if (existing) {
      // Update existing
      this.db.prepare(`
        UPDATE feature_allocations
        SET allocated_hours = ?,
            source = 'ado',
            ado_feature_id = ?,
            updated_at = ?
        WHERE id = ?
      `).run(effort, workItem.id, now, existing.id);
    } else {
      // Create new
      const { v4: uuidv4 } = require('uuid');
      this.db.prepare(`
        INSERT INTO feature_allocations (
          id, resource_id, feature_id, epic_id, project_id,
          allocated_hours, actual_hours_to_date, actual_cost_to_date,
          variance_hours, variance_cost, status, source, ado_feature_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 'on-track', 'ado', ?, ?, ?)
      `).run(
        uuidv4(),
        resource.id,
        featureId,
        feature.epic_id,
        feature.project_id,
        effort,
        workItem.id,
        now,
        now
      );
    }
  }

  /**
   * Sync external squad milestones from ADO custom fields
   */
  private async syncExternalSquadMilestones(mapping: AdoFeatureMapping, workItem: any): Promise<void> {
    const now = new Date().toISOString();

    // Extract milestone dates from custom fields or tags
    const milestones: Partial<AdoFeatureMapping> = {};

    // Check for custom fields (adjust field names to match your ADO setup)
    if (workItem.fields['Custom.BacklogSubmissionDate']) {
      milestones.backlog_submission_date = this.formatDateToNZ(workItem.fields['Custom.BacklogSubmissionDate']);
    }
    if (workItem.fields['Custom.DesignWorkshopDate']) {
      milestones.design_workshop_date = this.formatDateToNZ(workItem.fields['Custom.DesignWorkshopDate']);
    }
    if (workItem.fields['Custom.DevelopmentStartDate']) {
      milestones.development_start_date = this.formatDateToNZ(workItem.fields['Custom.DevelopmentStartDate']);
    }
    if (workItem.fields['Custom.UATTargetDate']) {
      milestones.uat_target_date = this.formatDateToNZ(workItem.fields['Custom.UATTargetDate']);
    }
    if (workItem.fields['Custom.ProdDeploymentDate']) {
      milestones.prod_deployment_date = this.formatDateToNZ(workItem.fields['Custom.ProdDeploymentDate']);
    }

    // Update mapping if any milestones found
    if (Object.keys(milestones).length > 0) {
      const updates = Object.entries(milestones)
        .map(([key, _]) => `${key} = ?`)
        .join(', ');
      
      const values = [...Object.values(milestones), now, mapping.id];

      this.db.prepare(`
        UPDATE ado_feature_mapping
        SET ${updates}, updated_at = ?
        WHERE id = ?
      `).run(...values);
    }
  }

  /**
   * Format ISO date to DD-MM-YYYY
   */
  private formatDateToNZ(isoDate: string): string {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Schedule periodic sync
   */
  startPeriodicSync(intervalMinutes: number = 30): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        // Get all features with ADO mappings
        const features = this.db.prepare(`
          SELECT DISTINCT feature_id 
          FROM ado_feature_mapping 
          WHERE sync_status != 'error'
        `).all() as Array<{ feature_id: string }>;

        await this.syncFeaturesToAdo(features.map(f => f.feature_id));
      } catch (error) {
        console.error('Periodic ADO sync failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}
```

### Step 4.2: ADO Sync Tests (8 hours)

**File:** `tests/unit/coordinator/AdoSyncService.test.ts`

```typescript
import Database from 'better-sqlite3';
import { openDB } from '../../../app/main/db';
import { AdoSyncService } from '../../../app/main/services/coordinator/AdoSyncService';
import { AdoApiService } from '../../../app/main/services/ado/AdoApiService';
import fs from 'fs';
import path from 'path';

// Mock ADO API
jest.mock('../../../app/main/services/ado/AdoApiService');

describe('AdoSyncService', () => {
  let db: Database.Database;
  let adoApiService: jest.Mocked<AdoApiService>;
  let service: AdoSyncService;
  const testDbPath = path.join(__dirname, 'test-ado-sync.db');

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = openDB(testDbPath);
    
    adoApiService = new AdoApiService({} as any) as jest.Mocked<AdoApiService>;
    service = new AdoSyncService(db, adoApiService);

    // Setup test data
    const now = new Date().toISOString();
    
    // Create project, epic, feature
    db.prepare(`
      INSERT INTO projects (id, title, start_date_nz, end_date_nz, start_date_iso, end_date_iso, status, budget_cents, created_at, updated_at)
      VALUES ('proj-1', 'Test Project', '01-04-2025', '30-06-2025', '2025-04-01', '2025-06-30', 'in-progress', 10000000, ?, ?)
    `).run(now, now);

    db.prepare(`
      INSERT INTO epics (id, project_id, title, state, effort, created_at, updated_at, sort_order)
      VALUES ('epic-1', 'proj-1', 'Test Epic', 'Active', 100, ?, ?, 0)
    `).run(now, now);

    db.prepare(`
      INSERT INTO features (id, epic_id, project_id, title, state, effort, created_at, updated_at, sort_order)
      VALUES ('feat-1', 'epic-1', 'proj-1', 'Test Feature', 'Active', 50, ?, ?, 0)
    `).run(now, now);

    // Create ADO mapping
    db.prepare(`
      INSERT INTO ado_feature_mapping (
        id, feature_id, ado_work_item_id, sync_status, created_at, updated_at
      ) VALUES (1, 'feat-1', 12345, 'pending', ?, ?)
    `).run(now, now);

    // Create financial resource
    db.prepare(`
      INSERT INTO financial_resources (
        id, resource_name, contract_type, ado_identity_id, created_at, updated_at
      ) VALUES (1, 'Test User', 'FTE', 'test@example.com', ?, ?)
    `).run(now, now);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('should sync feature from ADO', async () => {
    // Mock ADO API response
    adoApiService.getWorkItem.mockResolvedValue({
      success: true,
      data: {
        id: 12345,
        fields: {
          'System.State': 'Active',
          'System.AssignedTo': {
            displayName: 'Test User',
            uniqueName: 'test@example.com'
          },
          'Microsoft.VSTS.Scheduling.Effort': 50,
          'System.IterationPath': 'Sprint 1',
          'System.AreaPath': 'Team A'
        }
      }
    });

    const result = await service.syncFeaturesToAdo(['feat-1']);

    expect(result.synced).toBe(1);
    expect(result.errors).toHaveLength(0);

    // Check mapping updated
    const mapping = db.prepare(`
      SELECT * FROM ado_feature_mapping WHERE feature_id = 'feat-1'
    `).get();

    expect(mapping.ado_state).toBe('Active');
    expect(mapping.ado_assigned_to).toBe('Test User');
    expect(mapping.ado_effort).toBe(50);
    expect(mapping.sync_status).toBe('synced');

    // Check allocation created
    const allocation = db.prepare(`
      SELECT * FROM feature_allocations WHERE feature_id = 'feat-1'
    `).get();

    expect(allocation).toBeDefined();
    expect(allocation.resource_id).toBe(1);
    expect(allocation.allocated_hours).toBe(50);
    expect(allocation.source).toBe('ado');
  });

  test('should handle ADO API error', async () => {
    adoApiService.getWorkItem.mockResolvedValue({
      success: false,
      error: 'Work item not found'
    });

    const result = await service.syncFeaturesToAdo(['feat-1']);

    expect(result.synced).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Work item not found');
  });
});
```

**✅ Phase 4 Checklist:**
- [ ] AdoSyncService implemented with work item fetching
- [ ] Resource allocation sync from ADO assigned_to
- [ ] External squad milestone extraction
- [ ] Periodic sync scheduler implemented
- [ ] ADO API mocking works in tests
- [ ] Can sync real ADO work items (manual testing)

---

## Phase 5: Variance Detection (Week 5)

**Estimated Time:** 20 hours  
**Goal:** Multi-dimensional variance detection and alerting

### Step 5.1: Variance Detection Service (12 hours)

**File:** `app/main/services/coordinator/VarianceDetectionService.ts`

```typescript
// app/main/services/coordinator/VarianceDetectionService.ts
import { DB } from '../../db';
import { v4 as uuidv4 } from 'uuid';
import type { VarianceAlert, VarianceThreshold } from '../../types/coordinator';

export class VarianceDetectionService {
  constructor(private db: DB) {}

  /**
   * Detect all types of variance
   */
  async detectAllVariances(): Promise<VarianceAlert[]> {
    const alerts: VarianceAlert[] = [];

    alerts.push(...await this.detectCommitmentVariance());
    alerts.push(...await this.detectEffortVariance());
    alerts.push(...await this.detectCostVariance());
    alerts.push(...await this.detectScheduleVariance());
    alerts.push(...await this.detectUnauthorizedTime());

    // Insert alerts into database
    const insertStmt = this.db.prepare(`
      INSERT OR IGNORE INTO variance_alerts (
        id, alert_type, severity, entity_type, entity_id,
        message, details, variance_amount, variance_percent,
        acknowledged, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    const insertMany = this.db.transaction((alertList: VarianceAlert[]) => {
      alertList.forEach(alert => {
        insertStmt.run(
          alert.id,
          alert.alert_type,
          alert.severity,
          alert.entity_type,
          alert.entity_id,
          alert.message,
          alert.details ? JSON.stringify(alert.details) : null,
          alert.variance_amount,
          alert.variance_percent,
          alert.created_at
        );
      });
    });

    insertMany(alerts);

    return alerts;
  }

  /**
   * Detect commitment variance (resource capacity)
   */
  private async detectCommitmentVariance(): Promise<VarianceAlert[]> {
    const alerts: VarianceAlert[] = [];
    const now = new Date().toISOString();

    const overCommitted = this.db.prepare(`
      SELECT 
        rc.resource_id,
        fr.resource_name,
        rc.total_available_hours,
        rc.allocated_hours,
        (rc.allocated_hours - rc.total_available_hours) as over_by
      FROM resource_commitments rc
      JOIN financial_resources fr ON fr.id = rc.resource_id
      WHERE rc.allocated_hours > rc.total_available_hours
    `).all();

    for (const item of overCommitted as any[]) {
      const variancePercent = ((item.over_by / item.total_available_hours) * 100);
      const threshold = await this.getThreshold('resource', item.resource_id.toString());

      if (variancePercent > threshold.hours_variance_percent) {
        alerts.push({
          id: uuidv4(),
          alert_type: 'commitment',
          severity: variancePercent > 50 ? 'critical' : variancePercent > 30 ? 'high' : 'medium',
          entity_type: 'resource',
          entity_id: item.resource_id.toString(),
          message: `${item.resource_name} is over-committed by ${item.over_by.toFixed(1)} hours (${variancePercent.toFixed(1)}%)`,
          variance_amount: item.over_by,
          variance_percent: variancePercent,
          acknowledged: false,
          created_at: now
        });
      }
    }

    return alerts;
  }

  /**
   * Detect effort variance (feature allocations)
   */
  private async detectEffortVariance(): Promise<VarianceAlert[]> {
    const alerts: VarianceAlert[] = [];
    const now = new Date().toISOString();

    const allocations = this.db.prepare(`
      SELECT 
        fa.id,
        fa.feature_id,
        fa.resource_id,
        fa.project_id,
        fa.allocated_hours,
        fa.actual_hours_to_date,
        fa.variance_hours,
        fa.variance_percent,
        f.title as feature_title,
        fr.resource_name
      FROM feature_allocations fa
      JOIN features f ON f.id = fa.feature_id
      JOIN financial_resources fr ON fr.id = fa.resource_id
      WHERE ABS(fa.variance_percent) > 10
    `).all();

    for (const alloc of allocations as any[]) {
      const threshold = await this.getThreshold('project', alloc.project_id);
      const absVariance = Math.abs(alloc.variance_percent);

      if (absVariance > threshold.hours_variance_percent) {
        const severity = absVariance > 50 ? 'critical' : absVariance > 30 ? 'high' : 'medium';
        
        alerts.push({
          id: uuidv4(),
          alert_type: 'effort',
          severity,
          entity_type: 'feature',
          entity_id: alloc.feature_id,
          message: `${alloc.resource_name} on "${alloc.feature_title}" is ${alloc.variance_percent > 0 ? 'under' : 'over'} by ${Math.abs(alloc.variance_hours).toFixed(1)} hours`,
          variance_amount: alloc.variance_hours,
          variance_percent: alloc.variance_percent,
          acknowledged: false,
          created_at: now,
          details: {
            resource_id: alloc.resource_id,
            feature_id: alloc.feature_id,
            allocated: alloc.allocated_hours,
            actual: alloc.actual_hours_to_date
          }
        });
      }
    }

    return alerts;
  }

  /**
   * Detect cost variance
   */
  private async detectCostVariance(): Promise<VarianceAlert[]> {
    const alerts: VarianceAlert[] = [];
    const now = new Date().toISOString();

    const projects = this.db.prepare(`
      SELECT 
        pfd.project_id,
        p.title,
        pfd.original_budget_nzd,
        pfd.actual_cost_nzd,
        pfd.variance_nzd,
        (pfd.variance_nzd / pfd.original_budget_nzd * 100) as variance_percent
      FROM project_financial_detail pfd
      JOIN projects p ON p.id = pfd.project_id
      WHERE ABS(pfd.variance_nzd) > 1000
    `).all();

    for (const proj of projects as any[]) {
      const threshold = await this.getThreshold('project', proj.project_id);
      const absVariance = Math.abs(proj.variance_percent);

      if (absVariance > threshold.cost_variance_percent) {
        alerts.push({
          id: uuidv4(),
          alert_type: 'cost',
          severity: absVariance > 50 ? 'critical' : absVariance > 25 ? 'high' : 'medium',
          entity_type: 'project',
          entity_id: proj.project_id,
          message: `"${proj.title}" cost variance: $${Math.abs(proj.variance_nzd).toFixed(2)} NZD (${absVariance.toFixed(1)}%)`,
          variance_amount: proj.variance_nzd,
          variance_percent: proj.variance_percent,
          acknowledged: false,
          created_at: now
        });
      }
    }

    return alerts;
  }

  /**
   * Detect schedule variance (ADO milestones)
   */
  private async detectScheduleVariance(): Promise<VarianceAlert[]> {
    const alerts: VarianceAlert[] = [];
    const now = new Date().toISOString();
    const today = new Date();

    const milestones = this.db.prepare(`
      SELECT 
        afm.feature_id,
        afm.uat_target_date,
        afm.prod_deployment_date,
        afm.ado_state,
        f.title,
        f.project_id
      FROM ado_feature_mapping afm
      JOIN features f ON f.id = afm.feature_id
      WHERE afm.uat_target_date IS NOT NULL OR afm.prod_deployment_date IS NOT NULL
    `).all();

    for (const ms of milestones as any[]) {
      // Check UAT slippage
      if (ms.uat_target_date) {
        const [day, month, year] = ms.uat_target_date.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day);
        const daysDiff = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff > 0 && ms.ado_state !== 'UAT' && ms.ado_state !== 'Closed') {
          const threshold = await this.getThreshold('project', ms.project_id);
          
          if (daysDiff > threshold.schedule_variance_days) {
            alerts.push({
              id: uuidv4(),
              alert_type: 'schedule',
              severity: daysDiff > 14 ? 'critical' : daysDiff > 7 ? 'high' : 'medium',
              entity_type: 'feature',
              entity_id: ms.feature_id,
              message: `"${ms.title}" UAT target missed by ${daysDiff} days`,
              variance_amount: daysDiff,
              acknowledged: false,
              created_at: now
            });
          }
        }
      }
    }

    return alerts;
  }

  /**
   * Detect unauthorized time entries
   */
  private async detectUnauthorizedTime(): Promise<VarianceAlert[]> {
    const alerts: VarianceAlert[] = [];
    const now = new Date().toISOString();

    // Find timesheets where resource_id is set but feature_id is null
    // (meaning we couldn't link it to a feature allocation)
    const unauthorized = this.db.prepare(`
      SELECT 
        rt.id as timesheet_id,
        rt.resource_id,
        rt.date,
        rt.general_receiver as wbse,
        rt.number_unit as hours,
        fr.resource_name
      FROM raw_timesheets rt
      JOIN financial_resources fr ON fr.id = rt.resource_id
      WHERE rt.feature_id IS NULL
        AND rt.processed = 0
    `).all();

    for (const entry of unauthorized as any[]) {
      alerts.push({
        id: uuidv4(),
        alert_type: 'unauthorized',
        severity: 'high',
        entity_type: 'resource',
        entity_id: entry.resource_id.toString(),
        message: `${entry.resource_name} submitted ${entry.hours}h on ${entry.date} to WBSE ${entry.wbse} without feature allocation`,
        variance_amount: entry.hours,
        acknowledged: false,
        created_at: now,
        details: {
          timesheet_id: entry.timesheet_id,
          date: entry.date,
          wbse: entry.wbse
        }
      });
    }

    return alerts;
  }

  /**
   * Get variance threshold (with fallback to global)
   */
  private async getThreshold(entityType: 'resource' | 'project', entityId: string): Promise<VarianceThreshold> {
    // Try entity-specific
    let threshold = this.db.prepare(`
      SELECT * FROM variance_thresholds 
      WHERE entity_type = ? AND entity_id = ?
    `).get(entityType, entityId) as VarianceThreshold | undefined;

    // Fall back to global
    if (!threshold) {
      threshold = this.db.prepare(`
        SELECT * FROM variance_thresholds WHERE entity_type = 'global'
      `).get() as VarianceThreshold | undefined;
    }

    // Default if no global
    if (!threshold) {
      return {
        entity_type: 'global',
        hours_variance_percent: 20,
        cost_variance_percent: 20,
        schedule_variance_days: 7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    return threshold;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const now = new Date().toISOString();
    
    this.db.prepare(`
      UPDATE variance_alerts
      SET acknowledged = 1,
          acknowledged_by = ?,
          acknowledged_at = ?
      WHERE id = ?
    `).run(acknowledgedBy, now, alertId);
  }

  /**
   * Get unacknowledged alerts
   */
  async getUnacknowledgedAlerts(): Promise<VarianceAlert[]> {
    return this.db.prepare(`
      SELECT * FROM variance_alerts
      WHERE acknowledged = 0
      ORDER BY 
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        created_at DESC
    `).all() as VarianceAlert[];
  }
}
```

### Step 5.2: Variance Detection Tests (8 hours)

**File:** `tests/unit/coordinator/VarianceDetectionService.test.ts`

```typescript
import Database from 'better-sqlite3';
import { openDB } from '../../../app/main/db';
import { VarianceDetectionService } from '../../../app/main/services/coordinator/VarianceDetectionService';
import fs from 'fs';
import path from 'path';

describe('VarianceDetectionService', () => {
  let db: Database.Database;
  let service: VarianceDetectionService;
  const testDbPath = path.join(__dirname, 'test-variance.db');

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = openDB(testDbPath);
    service = new VarianceDetectionService(db);

    // Setup test data
    setupTestData(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  function setupTestData(db: Database.Database) {
    const now = new Date().toISOString();

    // Create project
    db.prepare(`
      INSERT INTO projects (id, title, start_date_nz, end_date_nz, start_date_iso, end_date_iso, status, budget_cents, created_at, updated_at)
      VALUES ('proj-1', 'Test', '01-04-2025', '30-06-2025', '2025-04-01', '2025-06-30', 'in-progress', 10000000, ?, ?)
    `).run(now, now);

    // Create financial resource
    db.prepare(`
      INSERT INTO financial_resources (id, resource_name, contract_type, created_at, updated_at)
      VALUES (1, 'Test User', 'FTE', ?, ?)
    `).run(now, now);

    // Create over-committed resource
    db.prepare(`
      INSERT INTO resource_commitments (
        id, resource_id, period_start, period_end, commitment_type,
        committed_hours, total_available_hours, allocated_hours, remaining_capacity,
        created_at, updated_at
      ) VALUES ('commit-1', 1, '01-04-2025', '30-06-2025', 'per-day', 8, 500, 600, -100, ?, ?)
    `).run(now, now);

    // Create global threshold
    db.prepare(`
      INSERT INTO variance_thresholds (entity_type, hours_variance_percent, cost_variance_percent, schedule_variance_days, created_at, updated_at)
      VALUES ('global', 20, 20, 7, ?, ?)
    `).run(now, now);
  }

  test('should detect over-committed resource', async () => {
    const alerts = await service.detectAllVariances();
    
    const commitmentAlerts = alerts.filter(a => a.alert_type === 'commitment');
    expect(commitmentAlerts.length).toBeGreaterThan(0);
    expect(commitmentAlerts[0].entity_type).toBe('resource');
    expect(commitmentAlerts[0].message).toContain('over-committed');
  });

  test('should calculate variance percentage correctly', async () => {
    const alerts = await service.detectAllVariances();
    const alert = alerts.find(a => a.alert_type === 'commitment');
    
    expect(alert).toBeDefined();
    expect(alert!.variance_percent).toBeCloseTo(20, 1); // 100/500 = 20%
  });

  test('should acknowledge alert', async () => {
    const alerts = await service.detectAllVariances();
    const alertId = alerts[0].id;

    await service.acknowledgeAlert(alertId, 'test-user');

    const acknowledged = db.prepare(`
      SELECT acknowledged, acknowledged_by FROM variance_alerts WHERE id = ?
    `).get(alertId) as any;

    expect(acknowledged.acknowledged).toBe(1);
    expect(acknowledged.acknowledged_by).toBe('test-user');
  });

  test('should get unacknowledged alerts ordered by severity', async () => {
    await service.detectAllVariances();
    const unacknowledged = await service.getUnacknowledgedAlerts();

    expect(unacknowledged.length).toBeGreaterThan(0);
    
    // Check severity ordering
    const severities = unacknowledged.map(a => a.severity);
    const severityOrder = ['critical', 'high', 'medium', 'low'];
    
    for (let i = 0; i < severities.length - 1; i++) {
      const currentIndex = severityOrder.indexOf(severities[i]);
      const nextIndex = severityOrder.indexOf(severities[i + 1]);
      expect(currentIndex).toBeLessThanOrEqual(nextIndex);
    }
  });
});
```

**✅ Phase 5 Checklist:**
- [ ] VarianceDetectionService detects all 5 variance types
- [ ] Threshold system works (resource/project/global)
- [ ] Alert severity calculated correctly
- [ ] Acknowledgement workflow implemented
- [ ] Tests cover all variance types
- [ ] Can run variance detection and see alerts

---

*Continuing with Phases 6-8 in next message...*
