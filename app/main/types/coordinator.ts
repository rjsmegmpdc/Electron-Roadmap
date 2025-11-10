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
  field?: string;
  value?: any;
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
