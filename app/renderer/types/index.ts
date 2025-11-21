/**
 * Centralized Type Definitions
 * 
 * This file contains all shared TypeScript interfaces and types
 * used across the Roadmap-Electron application.
 */

// Base types
export type NZDate = string; // DD-MM-YYYY format
export type ISODate = string; // ISO 8601 format
export type Status = 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
export type Priority = 1 | 2 | 3 | 4;
export type ValueArea = 'Business' | 'Architectural';
export type EpicSizing = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type WorkItemState = 'New' | 'Active' | 'Resolved' | 'Closed' | 'Removed';
export type DependencyType = 'Hard' | 'Soft';
export type FinancialTreatment = 'CAPEX' | 'OPEX';

// Core Domain Types
export interface Project {
  id: string;
  title: string;
  description?: string;
  lane?: string;
  start_date: NZDate;
  end_date: NZDate;
  status: Status;
  pm_name?: string;
  budget_nzd: number;
  financial_treatment: FinancialTreatment;
  row?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  start_date: NZDate;
  end_date: NZDate;
  effort_hours?: number;
  status: Status;
  assigned_resources?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Epic {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  state: WorkItemState;
  effort?: number;
  business_value?: number;
  time_criticality?: number;
  start_date?: NZDate;
  end_date?: NZDate;
  assigned_to?: string;
  area_path?: string;
  iteration_path?: string;
  risk?: RiskLevel;
  value_area?: ValueArea;
  parent_feature?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  
  // ADO-specific fields
  epic_sizing?: EpicSizing;
  epic_owner?: string;
  delivery_lead?: string;
  tech_lead?: string;
  business_owner?: string;
  process_owner?: string;
  platform_owner?: string;
  tags?: string;
  outcomes?: string;
  leading_indicators?: string;
  epic_acceptance_criteria?: string;
  out_of_scope?: string;
  nonfunctional_requirements?: string;
}

export interface Feature {
  id: string;
  epic_id: string;
  project_id: string;
  title: string;
  description?: string;
  state: WorkItemState;
  effort?: number;
  business_value?: number;
  time_criticality?: number;
  start_date?: NZDate;
  end_date?: NZDate;
  assigned_to?: string;
  area_path?: string;
  iteration_path?: string;
  risk?: RiskLevel;
  value_area?: ValueArea;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  
  // Feature-specific fields
  product_owner?: string;
  delivery_lead?: string;
  tech_lead?: string;
  business_owner?: string;
  process_owner?: string;
  platform_owner?: string;
  tags?: string;
  acceptance_criteria?: string;
  outcomes?: string;
  definition_of_ready?: string;
  definition_of_done?: string;
}

export interface Dependency {
  id: string;
  from: { type: 'project' | 'task' | 'epic' | 'feature'; id: string };
  to: { type: 'project' | 'task' | 'epic' | 'feature'; id: string };
  kind: 'FS' | 'SS' | 'FF' | 'SF'; // Finish-Start, Start-Start, Finish-Finish, Start-Finish
  lag_days?: number;
  note?: string;
  created_at?: string;
  
  // ADO-specific fields
  source_id?: string;
  target_id?: string;
  dependency_type?: DependencyType;
  reason?: string;
  needed_by?: string;
  risk_level?: RiskLevel;
  status?: string;
  created_by?: string;
}

// Configuration Types
export interface EpicFeatureDefaults {
  // Common fields for both Epics and Features
  priority: string;
  valueArea: ValueArea;
  areaPath: string;
  iterationPath: string;
  
  // Epic specific defaults
  epic: {
    epicSizing: EpicSizing;
    risk: RiskLevel;
    epicOwner: string;
    deliveryLead: string;
    techLead: string;
    businessOwner: string;
    processOwner: string;
    platformOwner: string;
    tags: string;
  };
  
  // Feature specific defaults  
  feature: {
    productOwner: string;
    deliveryLead: string;
    techLead: string;
    businessOwner: string;
    processOwner: string;
    platformOwner: string;
    tags: string;
  };
  
  // Active iterations for quick selection
  activeIterations: string[];
  customAreaPaths: string[];
}

// Team Member Types
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  displayName: string;
  role?: string;
}

// UI State Types
export type Connection = 'connected' | 'reconnecting' | 'disconnected';
export type Mode = 'solo' | 'host' | 'client';
export type CurrentView = 'timeline' | 'fortnight' | 'details' | 'project-list' | 'project-detail';

export interface UIState {
  selectedProject: string | null;
  selectedTask: string | null;
  timelineZoom: number; // days per pixel
  showDependencies: boolean;
  showArchived: boolean;
  currentView: CurrentView;
  viewingProjectId: string | null;
  sidebarOpen: boolean;
  linkingMode: { active: boolean; from?: { type: 'project' | 'task'; id: string } };
}

export interface LoadingState {
  projects: boolean;
  mutations: boolean;
  import: boolean;
  export: boolean;
}

// Store Types
export interface AppState {
  // Data
  projects: Record<string, Project>;
  tasks: Record<string, Task>;
  epics: Record<string, Epic>;
  features: Record<string, Feature>;
  dependencies: Record<string, Dependency>;
  
  // Connection
  mode: Mode;
  connection: Connection;
  hostBaseUrl?: string;
  lastEventId?: string;
  
  // UI State
  ui: UIState;
  
  // User
  user: string;
  
  // Loading states
  loading: LoadingState;
  
  // Errors
  errors: string[];
}

// Component Props Types
export interface ModuleInfo {
  title: string;
  description: string;
  status: 'stable' | 'beta' | 'alpha' | 'deprecated';
  version: string;
  features: string[];
  shortcuts?: Array<{ key: string; description: string }>;
  tips: string[];
  documentation?: string;
  stats: Array<{ label: string; value: string }>;
  lastUpdated: string;
}

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  badge?: string;
  category?: string;
}

// Test Types
export interface TestResult {
  id: string;
  name: string;
  type: 'security' | 'integration' | 'performance' | 'unit' | 'e2e';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  startTime?: string;
  endTime?: string;
  passCount?: number;
  failCount?: number;
  skipCount?: number;
  totalCount?: number;
  logFile?: string;
  errors?: string[];
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
  status: 'idle' | 'running' | 'completed';
  totalDuration?: number;
  logFile?: string;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'datetime-local' | 'number' | 'email';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: any) => string | null;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MutationResult {
  success: boolean;
  error?: string;
}

// Event Types
export interface AppEvent {
  id: string;
  type: string;
  timestamp: string;
  user: string;
  data: any;
}

// ADO Integration Types
export interface ADOConfig {
  id: number;
  org_url: string;
  project_name: string;
  auth_mode: 'PAT' | 'OAuth';
  pat_token?: string;
  client_id?: string;
  tenant_id?: string;
  webhook_url?: string;
  webhook_secret?: string;
  max_retry_attempts: number;
  base_delay_ms: number;
  is_enabled: boolean;
  connection_status: 'connected' | 'disconnected' | 'error';
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Re-export commonly used React types
export type { 
  ComponentType, 
  FC, 
  ReactNode, 
  PropsWithChildren,
  ChangeEvent,
  FormEvent,
  MouseEvent,
  KeyboardEvent
} from 'react';