# Project Coordinator Architecture
## Modern Workspace Project (#98047) - Financial Tracker Integration

---

## Executive Summary

This document defines the architecture for Project Coordinator modules that integrate with the existing Roadmap-Electron tool to provide comprehensive project financial tracking, resource management, and variance analysis.

**Key Capabilities:**
- Resource commitment tracking ("I can commit X hours per day/week/fortnight")
- External squad workflow management (ServiceHub, other projects)
- Multi-source data reconciliation (Timesheets, SAP Actuals, Labour Rates)
- Variance detection (effort, cost, schedule)
- P&L tracking by WBSE and Workstream
- Automated alerts and forecasting

---

## Data Sources

### 1. Raw_TimeSheets
**Source:** SAP CATS (Cross-Application Time Sheet)  
**Frequency:** Monthly export  
**Purpose:** FTE staff time submissions

**Key Fields:**
```typescript
interface RawTimesheet {
  stream: string;                      // e.g., "OneIntune"
  month: string;                       // "October"
  senderCostCenter: string;
  nameOfEmployee: string;              // "Abbie AllHouse"
  personnelNumber: string;             // "19507812" (links to Resources.EmployeeID)
  date: string;                        // "10/31/2025"
  activityType: string;                // "N4_CAP", "N4_OPX"
  generalReceiver: string;             // "N.93003271.004" (WBSE)
  acctAssgntText: string;              // "98047 Modern Workspace..."
  numberUnit: number;                  // 6.000 (hours)
  internalUoM: string;                 // "H" (hours)
  createdOn: string;
  approvedBy: string;
  approvalDate: string;
  objectDescription: string;
}
```

**Business Rules:**
- Validates against Resources table (Personnel Number → EmployeeID)
- Activity Type must match Resource's ActivityType_CAP or ActivityType_OPX
- WBSE must exist in Project Detail
- Detects unauthorized time entries (people not assigned to project)

---

### 2. Raw_Actuals
**Source:** SAP FI (Financial Accounting) export  
**Frequency:** Monthly  
**Purpose:** Software licenses, contractor invoices (SOW), hardware

**Key Fields:**
```typescript
interface RawActual {
  month: string;
  postingDate: string;                 // "10/17/2025"
  documentDate: string;                // "10/10/2025"
  costElement: string;                 // "11513000"
  costElementDescr: string;            // "Software Assets Under Construct - System"
  wbsElement: string;                  // "N.93003271.004"
  valueInObjCrcy: number;              // 555.78 (NZD)
  period: number;                      // 7
  fiscalYear: number;                  // 2026
  transactionCurrency: string;         // "NZD"
  personnelNumber: string;             // "0" for non-labour costs
  documentNumber: string;
  createdOn: string;
  objectKey: string;
  valueTranCurr: number;
  vblValueObjCurr: number;
  name: string;                        // Empty for software/hardware
}
```

**Business Rules:**
- Personnel Number = "0" indicates non-labour cost (software, hardware)
- Personnel Number != "0" indicates contractor timesheet (SOW resource)
- Cost Element determines type: software, hardware, professional services
- WBSE links to Project Detail for cost treatment classification

---

### 3. Raw_Labour_Rates
**Source:** Finance department  
**Frequency:** Annual (FY planning)  
**Purpose:** Forecasting and cost allocation

**Key Fields:**
```typescript
interface LabourRate {
  band: string;                        // "CAPEX BAND H (N4_CAP)"
  localBand: string;                   // "Local Band H"
  activityType: string;                // "N4_CAP"
  fiscalYear: string;                  // "FY26"
  hourlyRate: number;                  // 92.63 (NZD)
  dailyRate: number;                   // 741.01 (NZD)
  upliftAmount: number;                // Year-over-year increase
  upliftPercent: number;               // 1%
}
```

**Business Rules:**
- Separate rates for CAPEX (N1-N6_CAP) and OPEX (N1-N6_OPX)
- Hourly Rate × 8 = Daily Rate
- Used for forecasting when Resources provide effort estimates

---

### 4. Resources
**Purpose:** People working on projects  
**Links:** EmployeeID → Raw_TimeSheets.PersonnelNumber

**Key Fields:**
```typescript
interface Resource {
  roadmapResourceID: number;           // 567800
  resourceName: string;                // "Abbie AllHouse"
  email: string;
  workArea: string;                    // "Digital Team", "Architect", "Security"
  activityTypeCAP: string;             // "N4_CAP" (links to Labour Rates)
  activityTypeOPX: string;             // "N4_OPX"
  contractType: string;                // "FTE" or "SOW"
  employeeID: string;                  // "19507812" (links to timesheets)
}
```

**Special Resource Types:**
- **FTE:** Internal staff, submit timesheets, tracked via commitment model
- **SOW:** Contractors, invoiced monthly via Raw_Actuals, no timesheets
- **External Squads:** e.g., "ServiceHub ServiceNow" - tracked via milestone model only

---

### 5. FinanceLedger
**Purpose:** P&L tracking by WBSE and Workstream  
**Structure:** Complex Excel with nested budgets and actuals

**Key Concepts:**
```typescript
interface FinanceLedgerEntry {
  budgetType: string;                  // "Capex", "Opex"
  workStream: string;                  // "OneIntune", "Luma", "Hoki"
  wbse: string;                        // "N.93003271.004"
  expenditureType: string;             // "Capped Labour", "Software", "Professional Services"
  allocationRate: string;              // Daily rate or "Budget"
  hoursOrDays: number;
  originalBudget: number;              // NZD
  forecast: number;                    // NZD
  actualCost: number;                  // NZD to date
  remainingBudget: number;             // Original - Actual
  
  // Monthly breakdown (Forecast)
  forecastByMonth: Record<string, number>;  // Apr-Mar (FY26)
  
  // Monthly breakdown (Actuals)
  actualsByMonth: Record<string, number>;   // Apr-Mar (FY26)
  
  // Summary
  forecastCost: number;
  actualCostTotal: number;
  estimatedAtCompletion: number;
  varianceAgainstBudget: number;
  comment: string;
}
```

**Business Rules:**
- Forecasts are sum of resource effort × labour rates
- Actuals come from Raw_TimeSheets (FTE) + Raw_Actuals (SOW, software, hardware)
- Variance = Original Budget - Estimated At Completion
- Tracks by: WBSE → Workstream → Resource → Month

---

### 6. Workstream
**Purpose:** Major delivery components, strategic milestones

**Key Fields:**
```typescript
interface Workstream {
  deliveryWorkstreamID: number;        // 1
  workstream: string;                  // "Tickets to Conversations", "OneIntune"
  wbse: string;                        // "N.93003271.004"
  wbseDesc: string;                    // "Capped Labour"
  sme: string;                         // Subject Matter Expert (resource name)
  projectIDLink: string;               // Link to other projects (optional)
}
```

**Examples from your data:**
1. Tickets to Conversations - N.93003271.004 (Capped Labour)
2. OneIntune - N.93003271.005 (Software)
3. Hoki - N.93003271.003 (Professional Services)
4. Test retail store setup - N.93003271.006 (Hardware)
5. LUMA - N.93003271.005 (Software)
6. Notifier - N.93003271.005 (Software)

---

### 7. Project Detail
**Purpose:** Finance coding, cost treatments, SAP configuration

**Key Fields:**
```typescript
interface ProjectDetail {
  projectMgr: string;                  // "PM Name"
  sentinelNumber: string;              // "98047"
  name: string;                        // "Modern Workspace modernization..."
  deliveryGoal: string;                // "Reduce Calls to 021"
  wbse: string;                        // "N.93003271.004"
  wbseDesc: string;                    // "Capped Labour"
  aucNumber: string;                   // "900000124091" (Asset Under Construction)
  finalAsset: string;                  // "100000232511"
  sapCode: string;                     // "N.93003271"
  ioCode: string;                      // "18000026755"
  projectStartDate: string;            // "4/1/2025"
  projectEndDate: string;              // "4/1/2026"
}
```

**WBSE Types:**
- N.93003271.003 - Professional Services
- N.93003271.004 - Capped Labour
- N.93003271.005 - Software
- N.93003271.006 - Hardware

---

## New Data Models (To Be Created)

### 8. ResourceCommitment
**Purpose:** Track "I can commit X hours per day/week/fortnight"

```typescript
interface ResourceCommitment {
  commitmentID: string;                // UUID
  resourceID: number;                  // Links to Resources.Roadmap_ResourceID
  periodStart: string;                 // "01-04-2025" (DD-MM-YYYY)
  periodEnd: string;                   // "30-06-2025"
  commitmentType: 'per-day' | 'per-week' | 'per-fortnight';
  committedHours: number;              // e.g., 4 hrs/day, 20 hrs/week
  
  // Calculated
  totalAvailableHours: number;         // Based on period length and commitment type
  allocatedHours: number;              // Sum across all project allocations
  remainingCapacity: number;           // Available - Allocated
  
  createdAt: string;
  updatedAt: string;
}

interface ProjectAllocation {
  allocationID: string;
  commitmentID: string;                // Links to ResourceCommitment
  projectID: string;                   // Links to Project (from roadmap tool)
  workstreamID: number;                // Links to Workstream
  epicID?: string;                     // Optional: links to Epic in roadmap
  featureID?: string;                  // Optional: links to Feature in roadmap
  
  allocatedHours: number;              // Hours allocated to this project
  forecastStartDate: string;
  forecastEndDate: string;
  
  // Tracking
  actualHoursToDate: number;           // From Raw_TimeSheets
  variance: number;                    // Allocated - Actual
  status: 'on-track' | 'at-risk' | 'over' | 'under';
  
  createdAt: string;
  updatedAt: string;
}
```

**Calculation Logic:**
```typescript
// Per Day
totalAvailableHours = committedHours * workingDaysInPeriod(periodStart, periodEnd)

// Per Week
totalAvailableHours = committedHours * (daysInPeriod / 7)

// Per Fortnight
totalAvailableHours = committedHours * (daysInPeriod / 14)

// Capacity
remainingCapacity = totalAvailableHours - allocatedHours

// Status
if (actualHoursToDate >= allocatedHours * 0.9 && actualHoursToDate <= allocatedHours * 1.1)
  status = 'on-track'
else if (actualHoursToDate < allocatedHours * 0.8)
  status = 'under'
else if (actualHoursToDate > allocatedHours * 1.2)
  status = 'over'
else
  status = 'at-risk'
```

---

### 9. ExternalSquadWorkItem
**Purpose:** Track ServiceHub and external squad deliverables

```typescript
interface ExternalSquadWorkItem {
  workItemID: string;                  // UUID
  resourceID: number;                  // Links to Resources (e.g., 567814 "ServiceHub ServiceNow")
  workstreamID: number;                // Links to Workstream
  projectID: string;                   // Links to Project
  epicID?: string;
  featureID?: string;
  
  title: string;                       // "Implement knowledge base integration"
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requesterName: string;               // Who requested it from your team
  
  // Lifecycle milestones
  backlogSubmissionDate: string;       // When you submitted to their backlog
  backlogAccepted: boolean;
  
  designWorkshopScheduledDate?: string;
  designWalkthroughDeliveredDate?: string;  // When YOU delivered requirements
  designApprovedDate?: string;
  
  developmentStartDate?: string;
  developmentTargetDate?: string;
  
  uatTargetDate?: string;
  uatStartDate?: string;
  uatPassedDate?: string;
  
  defectsIdentified?: number;
  defectsResolved?: number;
  defectResolutionTargetDate?: string;
  
  prodDeploymentTargetDate?: string;
  prodDeploymentActualDate?: string;
  
  // Status
  currentPhase: 'backlog' | 'design' | 'development' | 'uat' | 'defect-resolution' | 'prod-ready' | 'deployed' | 'blocked';
  overallStatus: 'on-track' | 'at-risk' | 'delayed' | 'blocked';
  blockingIssues?: string;
  
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface MilestoneDelay {
  delayID: string;
  workItemID: string;
  milestoneType: 'backlog-acceptance' | 'design-workshop' | 'design-approval' | 
                 'dev-start' | 'uat-start' | 'uat-pass' | 'prod-deploy';
  originalDate: string;
  revisedDate: string;
  delayDays: number;
  reason?: string;
  impactAssessment: string;            // How this affects your project
  dependentWorkItems: string[];        // Other work items affected
  
  recordedAt: string;
}
```

**Business Rules:**
- External squad resources (like "ServiceHub ServiceNow") don't submit timesheets
- Tracking is purely milestone-based
- Milestone slippage triggers impact analysis on dependent work
- No cost allocation from Raw_Actuals (unless SOW invoiced separately)

---

## Service Layer Architecture

### Core Services

#### 1. ResourceCommitmentService
```typescript
class ResourceCommitmentService {
  // Commitment management
  createCommitment(data: CreateCommitmentDto): Promise<ResourceCommitment>
  updateCommitment(id: string, data: UpdateCommitmentDto): Promise<ResourceCommitment>
  getCommitmentsByResource(resourceID: number, period: DateRange): Promise<ResourceCommitment[]>
  
  // Allocation management
  allocateToProject(data: ProjectAllocationDto): Promise<ProjectAllocation>
  updateAllocation(id: string, data: UpdateAllocationDto): Promise<ProjectAllocation>
  removeAllocation(id: string): Promise<void>
  
  // Capacity calculations
  calculateAvailableCapacity(resourceID: number, period: DateRange): Promise<CapacityView>
  getResourceUtilization(resourceID: number, period: DateRange): Promise<UtilizationMetrics>
  detectOverCommitment(resourceID: number): Promise<OverCommitmentAlert[]>
  
  // Forecasting
  forecastResourceNeed(projectID: string, effortHours: number): Promise<ResourceForecast>
  recommendResourceAllocations(projectID: string): Promise<AllocationRecommendation[]>
}
```

#### 2. ExternalSquadService
```typescript
class ExternalSquadService {
  // Work item management
  createWorkItem(data: CreateWorkItemDto): Promise<ExternalSquadWorkItem>
  updateWorkItem(id: string, data: UpdateWorkItemDto): Promise<ExternalSquadWorkItem>
  updateMilestone(id: string, milestone: MilestoneUpdate): Promise<ExternalSquadWorkItem>
  
  // Lifecycle tracking
  submitToBacklog(workItemID: string, submissionDate: string): Promise<void>
  scheduleDesignWorkshop(workItemID: string, date: string): Promise<void>
  recordWalkthroughDelivered(workItemID: string, date: string): Promise<void>
  startUAT(workItemID: string, date: string): Promise<void>
  deployToProd(workItemID: string, date: string): Promise<void>
  
  // Delay tracking
  recordMilestoneDelay(data: MilestoneDelayDto): Promise<MilestoneDelay>
  analyzeDependencyImpact(workItemID: string): Promise<ImpactAnalysis>
  
  // Reporting
  getSquadStatusDashboard(resourceID: number): Promise<SquadDashboard>
  getUpcomingMilestones(days: number): Promise<MilestoneView[]>
  getBlockedItems(): Promise<ExternalSquadWorkItem[]>
}
```

#### 3. TimesheetService (Enhanced)
```typescript
class TimesheetService {
  // Import & validation
  importTimesheets(csvData: string): Promise<ImportResult>
  validateTimesheet(entry: RawTimesheet): Promise<ValidationResult>
  
  // Processing
  processTimesheets(month: string): Promise<ProcessingResult>
  reconcileWithCommitments(period: DateRange): Promise<ReconciliationReport>
  
  // Unauthorized detection
  detectUnauthorizedEntries(month: string): Promise<UnauthorizedEntry[]>
  detectResourceNotInProject(entry: RawTimesheet): Promise<boolean>
  
  // Aggregation
  getTimesheetsByResource(resourceID: number, period: DateRange): Promise<TimesheetSummary>
  getTimesheetsByWorkstream(workstreamID: number, period: DateRange): Promise<TimesheetSummary>
  getTimesheetsByWBSE(wbse: string, period: DateRange): Promise<TimesheetSummary>
  
  // Variance
  calculateCommitmentVariance(resourceID: number, period: DateRange): Promise<VarianceReport>
}
```

#### 4. ActualsService
```typescript
class ActualsService {
  // Import & validation
  importActuals(csvData: string): Promise<ImportResult>
  validateActual(entry: RawActual): Promise<ValidationResult>
  
  // Processing
  processActuals(month: string): Promise<ProcessingResult>
  categorizeActuals(month: string): Promise<CategorizedActuals>
  
  // Analysis
  getSoftwareSpend(period: DateRange): Promise<SoftwareSpendReport>
  getContractorInvoices(period: DateRange): Promise<ContractorInvoiceReport>
  getHardwareSpend(period: DateRange): Promise<HardwareSpendReport>
  
  // Reconciliation
  reconcileContractorSOW(contractorResourceID: number, period: DateRange): Promise<SOWReconciliation>
  reconcileWithBudget(wbse: string, period: DateRange): Promise<BudgetReconciliation>
}
```

#### 5. VarianceDetectionService
```typescript
class VarianceDetectionService {
  // Multi-dimensional variance
  detectCommitmentVariance(period: DateRange): Promise<CommitmentVariance[]>
  detectEffortVariance(epicID: string): Promise<EffortVariance>
  detectCostVariance(wbse: string, period: DateRange): Promise<CostVariance>
  detectScheduleVariance(workItemID: string): Promise<ScheduleVariance>
  
  // External squad variance
  detectMilestoneSlippage(days: number): Promise<MilestoneSlippage[]>
  detectBlockedWorkItems(): Promise<BlockedItemAlert[]>
  
  // Alerts
  generateVarianceAlerts(thresholds: VarianceThresholds): Promise<Alert[]>
  getHighRiskItems(): Promise<RiskItem[]>
  
  // Trends
  analyzeVarianceTrends(period: DateRange): Promise<TrendAnalysis>
}
```

#### 6. FinanceLedgerService (Enhanced)
```typescript
class FinanceLedgerService {
  // P&L calculation
  calculatePnL(period: DateRange): Promise<PnLReport>
  calculatePnLByWorkstream(workstreamID: number, period: DateRange): Promise<PnLReport>
  calculatePnLByWBSE(wbse: string, period: DateRange): Promise<PnLReport>
  
  // Forecast vs Actual
  compareF ForecastActual(period: DateRange): Promise<ForecastActualComparison>
  calculateEstimatedAtCompletion(wbse: string): Promise<EACReport>
  
  // Cost tracking
  trackResourceCosts(resourceID: number, period: DateRange): Promise<ResourceCostReport>
  trackExternalSquadCosts(resourceID: number, period: DateRange): Promise<ExternalCostReport>
  
  // Accrual
  calculateMonthlyAccrual(month: string): Promise<AccrualReport>
  projectFutureAccruals(months: number): Promise<AccrualForecast>
  
  // Budget management
  trackBudgetUtilization(wbse: string): Promise<BudgetUtilization>
  forecastBudgetDepletion(wbse: string): Promise<DepletionForecast>
}
```

---

## Database Schema (SQLite)

```sql
-- ===== RAW DATA TABLES =====

CREATE TABLE raw_timesheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stream TEXT NOT NULL,
  month TEXT NOT NULL,
  sender_cost_center TEXT,
  name_of_employee TEXT NOT NULL,
  personnel_number TEXT NOT NULL,
  status_and_processing TEXT,
  date TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  general_receiver TEXT NOT NULL, -- WBSE
  acct_assgnt_text TEXT,
  number_unit REAL NOT NULL,      -- Hours
  internal_uom TEXT,              -- "H"
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
  FOREIGN KEY (personnel_number) REFERENCES resources(employee_id)
);

CREATE INDEX idx_timesheets_personnel ON raw_timesheets(personnel_number);
CREATE INDEX idx_timesheets_date ON raw_timesheets(date);
CREATE INDEX idx_timesheets_wbse ON raw_timesheets(general_receiver);
CREATE INDEX idx_timesheets_month ON raw_timesheets(month);

CREATE TABLE raw_actuals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT NOT NULL,
  posting_date TEXT NOT NULL,
  document_date TEXT NOT NULL,
  cost_element TEXT NOT NULL,
  cost_element_descr TEXT,
  wbs_element TEXT NOT NULL,       -- WBSE
  value_in_obj_crcy REAL NOT NULL, -- NZD
  period INTEGER,
  fiscal_year INTEGER,
  transaction_currency TEXT,
  personnel_number TEXT,           -- "0" for non-labour
  document_number TEXT,
  created_on TEXT,
  object_key TEXT,
  value_tran_curr REAL,
  vbl_value_obj_curr REAL,
  name TEXT,
  
  imported_at TEXT NOT NULL,
  processed BOOLEAN DEFAULT 0
);

CREATE INDEX idx_actuals_wbse ON raw_actuals(wbs_element);
CREATE INDEX idx_actuals_cost_element ON raw_actuals(cost_element);
CREATE INDEX idx_actuals_month ON raw_actuals(month);
CREATE INDEX idx_actuals_personnel ON raw_actuals(personnel_number);

CREATE TABLE raw_labour_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  band TEXT NOT NULL,
  local_band TEXT,
  activity_type TEXT NOT NULL UNIQUE, -- "N4_CAP", "N4_OPX"
  fiscal_year TEXT NOT NULL,
  hourly_rate REAL NOT NULL,       -- NZD
  daily_rate REAL NOT NULL,        -- NZD
  uplift_amount REAL,
  uplift_percent REAL,
  
  imported_at TEXT NOT NULL
);

CREATE INDEX idx_labour_rates_activity ON raw_labour_rates(activity_type);

CREATE TABLE resources (
  roadmap_resource_id INTEGER PRIMARY KEY,
  resource_name TEXT NOT NULL,
  email TEXT,
  work_area TEXT,
  activity_type_cap TEXT,          -- Links to labour_rates
  activity_type_opx TEXT,          -- Links to labour_rates
  contract_type TEXT,              -- "FTE" or "SOW"
  employee_id TEXT UNIQUE,         -- Links to timesheets
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (activity_type_cap) REFERENCES raw_labour_rates(activity_type),
  FOREIGN KEY (activity_type_opx) REFERENCES raw_labour_rates(activity_type)
);

CREATE INDEX idx_resources_employee ON resources(employee_id);
CREATE INDEX idx_resources_contract_type ON resources(contract_type);

CREATE TABLE workstreams (
  delivery_workstream_id INTEGER PRIMARY KEY,
  workstream TEXT NOT NULL,
  wbse TEXT NOT NULL,
  wbse_desc TEXT,
  sme TEXT,                        -- Resource name (informal link)
  project_id_link TEXT,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_workstreams_wbse ON workstreams(wbse);

CREATE TABLE project_detail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_mgr TEXT,
  sentinel_number TEXT,
  name TEXT NOT NULL,
  delivery_goal TEXT,
  wbse TEXT NOT NULL UNIQUE,
  wbse_desc TEXT,
  auc_number TEXT,                 -- Asset Under Construction
  final_asset TEXT,
  sap_code TEXT,
  io_code TEXT,
  project_start_date TEXT,
  project_end_date TEXT,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_project_detail_wbse ON project_detail(wbse);
CREATE INDEX idx_project_detail_sentinel ON project_detail(sentinel_number);

-- ===== NEW COORDINATOR TABLES =====

CREATE TABLE resource_commitments (
  commitment_id TEXT PRIMARY KEY,
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
  FOREIGN KEY (resource_id) REFERENCES resources(roadmap_resource_id),
  CHECK (commitment_type IN ('per-day', 'per-week', 'per-fortnight'))
);

CREATE INDEX idx_commitments_resource ON resource_commitments(resource_id);
CREATE INDEX idx_commitments_period ON resource_commitments(period_start, period_end);

CREATE TABLE project_allocations (
  allocation_id TEXT PRIMARY KEY,
  commitment_id TEXT NOT NULL,
  project_id TEXT NOT NULL,        -- Links to projects table in main roadmap
  workstream_id INTEGER,
  epic_id TEXT,
  feature_id TEXT,
  
  allocated_hours REAL NOT NULL,
  forecast_start_date TEXT NOT NULL,
  forecast_end_date TEXT NOT NULL,
  
  -- Tracking
  actual_hours_to_date REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  status TEXT DEFAULT 'on-track', -- 'on-track' | 'at-risk' | 'over' | 'under'
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (commitment_id) REFERENCES resource_commitments(commitment_id) ON DELETE CASCADE,
  FOREIGN KEY (workstream_id) REFERENCES workstreams(delivery_workstream_id),
  CHECK (status IN ('on-track', 'at-risk', 'over', 'under'))
);

CREATE INDEX idx_allocations_commitment ON project_allocations(commitment_id);
CREATE INDEX idx_allocations_project ON project_allocations(project_id);
CREATE INDEX idx_allocations_workstream ON project_allocations(workstream_id);

CREATE TABLE external_squad_work_items (
  work_item_id TEXT PRIMARY KEY,
  resource_id INTEGER NOT NULL,    -- External squad resource (e.g., 567814 ServiceHub)
  workstream_id INTEGER,
  project_id TEXT,
  epic_id TEXT,
  feature_id TEXT,
  
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  requester_name TEXT,
  
  -- Milestones
  backlog_submission_date TEXT,
  backlog_accepted BOOLEAN DEFAULT 0,
  design_workshop_scheduled_date TEXT,
  design_walkthrough_delivered_date TEXT,
  design_approved_date TEXT,
  development_start_date TEXT,
  development_target_date TEXT,
  uat_target_date TEXT,
  uat_start_date TEXT,
  uat_passed_date TEXT,
  defects_identified INTEGER DEFAULT 0,
  defects_resolved INTEGER DEFAULT 0,
  defect_resolution_target_date TEXT,
  prod_deployment_target_date TEXT,
  prod_deployment_actual_date TEXT,
  
  -- Status
  current_phase TEXT NOT NULL DEFAULT 'backlog',
  overall_status TEXT NOT NULL DEFAULT 'on-track',
  blocking_issues TEXT,
  notes TEXT,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (resource_id) REFERENCES resources(roadmap_resource_id),
  FOREIGN KEY (workstream_id) REFERENCES workstreams(delivery_workstream_id),
  CHECK (current_phase IN ('backlog', 'design', 'development', 'uat', 'defect-resolution', 'prod-ready', 'deployed', 'blocked')),
  CHECK (overall_status IN ('on-track', 'at-risk', 'delayed', 'blocked')),
  CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_squad_work_resource ON external_squad_work_items(resource_id);
CREATE INDEX idx_squad_work_workstream ON external_squad_work_items(workstream_id);
CREATE INDEX idx_squad_work_status ON external_squad_work_items(overall_status);
CREATE INDEX idx_squad_work_phase ON external_squad_work_items(current_phase);

CREATE TABLE milestone_delays (
  delay_id TEXT PRIMARY KEY,
  work_item_id TEXT NOT NULL,
  milestone_type TEXT NOT NULL,
  original_date TEXT NOT NULL,
  revised_date TEXT NOT NULL,
  delay_days INTEGER NOT NULL,
  reason TEXT,
  impact_assessment TEXT,
  dependent_work_items TEXT,       -- JSON array of work_item_ids
  
  recorded_at TEXT NOT NULL,
  FOREIGN KEY (work_item_id) REFERENCES external_squad_work_items(work_item_id) ON DELETE CASCADE,
  CHECK (milestone_type IN ('backlog-acceptance', 'design-workshop', 'design-approval', 
                             'dev-start', 'uat-start', 'uat-pass', 'prod-deploy'))
);

CREATE INDEX idx_delays_work_item ON milestone_delays(work_item_id);
CREATE INDEX idx_delays_type ON milestone_delays(milestone_type);

-- ===== VARIANCE & ALERTS =====

CREATE TABLE variance_alerts (
  alert_id TEXT PRIMARY KEY,
  alert_type TEXT NOT NULL,        -- 'commitment' | 'effort' | 'cost' | 'schedule' | 'milestone'
  severity TEXT NOT NULL,          -- 'low' | 'medium' | 'high' | 'critical'
  entity_type TEXT NOT NULL,       -- 'resource' | 'project' | 'workstream' | 'work_item'
  entity_id TEXT NOT NULL,
  
  message TEXT NOT NULL,
  details TEXT,                    -- JSON
  variance_amount REAL,
  variance_percent REAL,
  
  acknowledged BOOLEAN DEFAULT 0,
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  
  created_at TEXT NOT NULL,
  CHECK (alert_type IN ('commitment', 'effort', 'cost', 'schedule', 'milestone')),
  CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_alerts_type ON variance_alerts(alert_type);
CREATE INDEX idx_alerts_severity ON variance_alerts(severity);
CREATE INDEX idx_alerts_entity ON variance_alerts(entity_type, entity_id);
CREATE INDEX idx_alerts_acknowledged ON variance_alerts(acknowledged);

-- ===== AUDIT LOG =====

CREATE TABLE coordinator_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  changes TEXT,                    -- JSON
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_audit_timestamp ON coordinator_audit_log(timestamp);
CREATE INDEX idx_audit_entity ON coordinator_audit_log(entity_type, entity_id);
```

---

## Integration with Existing Roadmap Tool

### IPC Handlers (app/main/ipc/coordinatorHandlers.ts)

```typescript
// Resource Commitment
ipcMain.handle('coordinator:commitment:create', async (event, data) => {
  return await resourceCommitmentService.createCommitment(data);
});

ipcMain.handle('coordinator:commitment:getByResource', async (event, resourceID, period) => {
  return await resourceCommitmentService.getCommitmentsByResource(resourceID, period);
});

// External Squad
ipcMain.handle('coordinator:squad:createWorkItem', async (event, data) => {
  return await externalSquadService.createWorkItem(data);
});

ipcMain.handle('coordinator:squad:updateMilestone', async (event, workItemID, milestone) => {
  return await externalSquadService.updateMilestone(workItemID, milestone);
});

// Import
ipcMain.handle('coordinator:import:timesheets', async (event, csvData) => {
  return await timesheetService.importTimesheets(csvData);
});

ipcMain.handle('coordinator:import:actuals', async (event, csvData) => {
  return await actualsService.importActuals(csvData);
});

// Variance
ipcMain.handle('coordinator:variance:getAlerts', async (event, thresholds) => {
  return await varianceDetectionService.generateVarianceAlerts(thresholds);
});

// Finance
ipcMain.handle('coordinator:finance:getPnL', async (event, period) => {
  return await financeLedgerService.calculatePnL(period);
});
```

---

## UI Component Structure

### 1. Resource Commitment UI
**Location:** `app/renderer/views/coordinator/ResourceCommitment.tsx`

**Features:**
- Input form: "I can commit X hours per [day/week/fortnight]"
- Calendar view of commitment periods
- Project allocation manager
- Capacity utilization gauge
- Over-commitment warnings

### 2. External Squad Tracker
**Location:** `app/renderer/views/coordinator/ExternalSquadTracker.tsx`

**Features:**
- Kanban board: Backlog → Design → Dev → UAT → Prod
- Work item cards with milestone progress bars
- Delay alerts and impact analysis
- Design workshop scheduler
- Defect tracking

### 3. Unified Dashboard
**Location:** `app/renderer/views/coordinator/UnifiedDashboard.tsx`

**Features:**
- Split pane: Internal resources | External squads
- Capacity heatmap
- Upcoming milestones
- Variance alerts
- P&L summary by workstream

### 4. Import Manager
**Location:** `app/renderer/views/coordinator/ImportManager.tsx`

**Features:**
- Drag-drop CSV import
- Data validation results
- Import history
- Error log viewer

### 5. Variance Reports
**Location:** `app/renderer/views/coordinator/VarianceReports.tsx`

**Features:**
- Multi-dimensional variance view
- Trend charts
- Drill-down by resource/project/workstream
- Export to Excel

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Database schema creation
- TypeScript models
- CSV import parsers
- Basic validation

### Phase 2: Core Services (Weeks 3-5)
- ResourceCommitmentService
- TimesheetService
- ActualsService
- Basic reconciliation

### Phase 3: External Squad (Weeks 6-7)
- ExternalSquadService
- Milestone tracking
- Delay detection

### Phase 4: Variance & Finance (Weeks 8-9)
- VarianceDetectionService
- FinanceLedgerService
- Alert system

### Phase 5: UI (Weeks 10-12)
- Resource commitment UI
- External squad tracker
- Dashboards
- Import manager

### Phase 6: Testing & Polish (Weeks 13-14)
- Unit tests
- E2E tests
- Performance optimization
- Documentation

---

## Key Business Logic

### Unauthorized Timesheet Detection
```typescript
// Person submits time to WBSE they're not allocated to
function detectUnauthorizedTimesheet(entry: RawTimesheet): UnauthorizedEntry | null {
  // 1. Check if resource exists
  const resource = getResourceByEmployeeID(entry.personnelNumber);
  if (!resource) {
    return { type: 'unknown-resource', entry };
  }
  
  // 2. Check if WBSE exists in project
  const projectDetail = getProjectDetailByWBSE(entry.generalReceiver);
  if (!projectDetail) {
    return { type: 'invalid-wbse', entry };
  }
  
  // 3. Check if resource has allocation to this WBSE/project
  const allocation = getProjectAllocationByResourceAndWBSE(
    resource.roadmapResourceID, 
    entry.generalReceiver
  );
  if (!allocation) {
    return { type: 'no-allocation', entry };
  }
  
  // 4. Check if activity type matches resource profile
  if (entry.activityType !== resource.activityTypeCAP && 
      entry.activityType !== resource.activityTypeOPX) {
    return { type: 'invalid-activity-type', entry };
  }
  
  return null; // Authorized
}
```

### Commitment vs Actual Variance
```typescript
function calculateCommitmentVariance(
  resourceID: number, 
  period: DateRange
): VarianceReport {
  // Get commitment
  const commitment = getResourceCommitment(resourceID, period);
  const allocations = getProjectAllocations(commitment.commitmentID);
  
  // Get actual hours from timesheets
  const timesheets = getTimesheetsByResource(resourceID, period);
  const actualHours = timesheets.reduce((sum, ts) => sum + ts.numberUnit, 0);
  
  // Calculate allocation total
  const allocatedHours = allocations.reduce((sum, alloc) => sum + alloc.allocatedHours, 0);
  
  // Variance
  const variance = allocatedHours - actualHours;
  const variancePercent = (variance / allocatedHours) * 100;
  
  // Status
  let status: VarianceStatus;
  if (Math.abs(variancePercent) <= 10) {
    status = 'on-track';
  } else if (variancePercent > 20) {
    status = 'under'; // Under-utilized
  } else if (variancePercent < -20) {
    status = 'over'; // Over-worked
  } else {
    status = 'at-risk';
  }
  
  return {
    resourceID,
    period,
    allocatedHours,
    actualHours,
    variance,
    variancePercent,
    status,
    breakdown: allocations.map(alloc => ({
      projectID: alloc.projectID,
      allocatedHours: alloc.allocatedHours,
      actualHours: getTimesheetsByProjectAllocation(alloc.allocationID)
        .reduce((sum, ts) => sum + ts.numberUnit, 0)
    }))
  };
}
```

### External Squad Milestone Slippage
```typescript
function detectMilestoneSlippage(
  workItemID: string
): SlippageAnalysis | null {
  const workItem = getExternalSquadWorkItem(workItemID);
  const today = new Date();
  
  // Check each milestone
  const slippages: MilestoneSlippage[] = [];
  
  // UAT example
  if (workItem.uatTargetDate) {
    const uatTarget = parseDate(workItem.uatTargetDate);
    const daysDiff = differenceInDays(today, uatTarget);
    
    if (daysDiff > 0 && !workItem.uatStartDate) {
      // UAT should have started but hasn't
      slippages.push({
        milestone: 'uat-start',
        targetDate: workItem.uatTargetDate,
        currentStatus: workItem.currentPhase,
        delayDays: daysDiff,
        severity: daysDiff > 7 ? 'high' : 'medium'
      });
    }
  }
  
  // Production deployment example
  if (workItem.prodDeploymentTargetDate) {
    const prodTarget = parseDate(workItem.prodDeploymentTargetDate);
    const daysDiff = differenceInDays(today, prodTarget);
    
    if (daysDiff > 0 && !workItem.prodDeploymentActualDate) {
      slippages.push({
        milestone: 'prod-deploy',
        targetDate: workItem.prodDeploymentTargetDate,
        currentStatus: workItem.currentPhase,
        delayDays: daysDiff,
        severity: daysDiff > 14 ? 'critical' : 'high'
      });
    }
  }
  
  if (slippages.length === 0) {
    return null;
  }
  
  // Analyze impact on dependent work
  const dependents = getDependentWorkItems(workItemID);
  
  return {
    workItemID,
    workItemTitle: workItem.title,
    squadName: getResourceName(workItem.resourceID),
    slippages,
    impactedWorkItems: dependents.map(d => d.work_item_id),
    recommendedActions: generateRecommendedActions(slippages, dependents)
  };
}
```

---

## Data Flow Examples

### Example 1: Monthly Timesheet Import & Reconciliation

```
1. User imports Raw_TimeSheets CSV (October)
   ↓
2. TimesheetService.importTimesheets()
   - Parse CSV
   - Validate each entry:
     * Personnel Number exists in Resources
     * WBSE exists in Project Detail
     * Activity Type matches Resource profile
     * Date format valid
   - Flag unauthorized entries
   ↓
3. TimesheetService.processTimesheets()
   - Group by Resource + WBSE
   - Sum hours per resource per project
   ↓
4. ResourceCommitmentService.reconcileWithCommitments()
   - For each resource:
     * Get commitment for October
     * Get allocations
     * Sum actual hours from timesheets
     * Calculate variance
   - Generate alerts if variance > threshold
   ↓
5. VarianceDetectionService.generateVarianceAlerts()
   - Create alert records
   - Notify dashboard
   ↓
6. FinanceLedgerService.calculateMonthlyAccrual()
   - Apply labour rates to hours
   - Calculate cost by WBSE
   - Update P&L
```

### Example 2: External Squad Work Item Lifecycle

```
1. User creates External Squad Work Item
   - Title: "Implement ServiceNow KB integration"
   - Assigned to: ServiceHub ServiceNow (ID 567814)
   - Workstream: Tickets to Conversations
   ↓
2. User records: Backlog submitted (01-Apr-2025)
   ↓
3. ExternalSquadService monitors milestones
   ↓
4. User updates: Design workshop scheduled (15-Apr-2025)
   ↓
5. User records: Walkthrough delivered (15-Apr-2025)
   ↓
6. User updates: Development target (01-May-2025)
   ↓
7. ALERT: Dev start date passed, but currentPhase still "design"
   - VarianceDetectionService.detectMilestoneSlippage()
   - Create alert: "ServiceHub work item delayed - Dev hasn't started"
   ↓
8. User updates: Dev started (08-May-2025)
   - Record delay: 7 days
   - MilestoneDelay record created
   ↓
9. User updates: UAT passed (22-May-2025)
   ↓
10. User updates: Prod deployed (29-May-2025)
    - Work item status: "deployed"
```

### Example 3: Resource Commitment & Allocation

```
1. Resource: Abbie AllHouse (ID 567800)
   Creates commitment:
   - Period: 01-Apr-2025 to 30-Jun-2025 (Q1 FY26)
   - Commitment: 6 hours per day
   - Working days in period: 65
   - Total available: 390 hours
   ↓
2. PM allocates Abbie to projects:
   - OneIntune Epic-123: 200 hours
   - Luma Feature-456: 100 hours
   - Total allocated: 300 hours
   - Remaining capacity: 90 hours
   ↓
3. End of April:
   - Timesheets imported
   - Abbie submitted 120 hours total
   - Breakdown:
     * OneIntune: 100 hours (forecast: 67 hrs for April)
     * Luma: 20 hours (forecast: 33 hrs for April)
   ↓
4. VarianceDetectionService.detectCommitmentVariance()
   - OneIntune: +33 hours (over-committed)
   - Luma: -13 hours (under-utilized)
   - Alert: "Abbie is over-committed to OneIntune"
   ↓
5. PM adjusts allocation:
   - Reduce OneIntune forecast for May/June
   - Increase Luma allocation
   ↓
6. End of June:
   - Total actual: 360 hours
   - Total forecast: 300 hours
   - Variance: +60 hours
   - Status: "over" (worked more than committed)
   - Finance impact: Calculate extra cost at N4_CAP rate
```

---

## Next Steps

1. **Review & Approve Architecture**: Confirm this matches your requirements
2. **Begin Phase 1**: Database schema + TypeScript models
3. **Validate Sample Data**: Import your Excel data to test parsers
4. **Build MVP**: ResourceCommitmentService + TimesheetService + basic UI
5. **Iterate**: Add external squad tracking, variance detection, dashboards

---

## Questions for Clarification

1. **EPIC/Feature Mapping**: Do you use the existing Roadmap tool's projects/tasks as EPICs/Features, or is this separate?
2. **External Squad Data Source**: How do you currently track ServiceHub milestones? Manual entry or do they provide updates?
3. **Forecast Entry**: Do resources enter effort estimates themselves, or does PM allocate on their behalf?
4. **Alert Thresholds**: What variance % triggers alerts? (Default: ±20%?)
5. **FY Calendar**: Confirm FY26 = Apr 2025 - Mar 2026?
6. **External Squad Costs**: Are ServiceHub/contractor SOWs invoiced through Raw_Actuals, or tracked separately?

---

**END OF ARCHITECTURE DOCUMENT**
