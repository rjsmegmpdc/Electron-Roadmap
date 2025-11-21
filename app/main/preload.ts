import { contextBridge, ipcRenderer } from 'electron';

// Types imported from ProjectService
export interface Project {
  id: string;
  title: string;
  description: string;
  lane: string;
  start_date: string; // DD-MM-YYYY format
  end_date: string;   // DD-MM-YYYY format
  status: 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
  pm_name: string;
  budget_cents: number;
  financial_treatment: 'CAPEX' | 'OPEX';
  row?: number;
  created_at: string;
  updated_at: string;
}

// Task types
export interface Task {
  id: string;
  project_id: string;
  title: string;
  start_date: string; // DD-MM-YYYY format
  end_date: string;   // DD-MM-YYYY format
  effort_hours: number;
  status: 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
  assigned_resources: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  project_id: string;
  title: string;
  start_date: string;
  end_date: string;
  effort_hours?: number;
  status: 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
  assigned_resources?: string[];
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
}

// Dependency types
export interface Dependency {
  id: string;
  from_type: 'project' | 'task';
  from_id: string;
  to_type: 'project' | 'task';
  to_id: string;
  kind: 'FS' | 'SS' | 'FF' | 'SF';
  lag_days: number;
  note: string;
  created_at: string;
}

export interface CreateDependencyRequest {
  from_type: 'project' | 'task';
  from_id: string;
  to_type: 'project' | 'task';
  to_id: string;
  kind: 'FS' | 'SS' | 'FF' | 'SF';
  lag_days?: number;
  note?: string;
}

export interface UpdateDependencyRequest {
  id: string;
  kind?: 'FS' | 'SS' | 'FF' | 'SF';
  lag_days?: number;
  note?: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  lane?: string;
  start_date: string; // DD-MM-YYYY
  end_date: string;   // DD-MM-YYYY
  status: 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
  pm_name?: string;
  budget_nzd?: string; // NZD format like "1,234.56"
  financial_treatment?: 'CAPEX' | 'OPEX';
  row?: number;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string;
}

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
}

// Define the API interface for type safety
export interface ElectronAPI {
  // Basic functionality
  ping: () => Promise<string>;
  getAppPath: (name: string) => Promise<string>;
  
  // Database operations
  dbQuery: (sql: string, params?: any) => Promise<any[]>;
  dbGet: (sql: string, params?: any) => Promise<any>;
  
  // Mutations
  applyMutation: (mutation: any) => Promise<{ success: boolean; result?: any; error?: string }>;
  
  // Project Management API (New)
  getAllProjects: () => Promise<IpcResponse<Project[]>>;
  getProjectById: (id: string) => Promise<IpcResponse<Project | null>>;
  createProject: (data: CreateProjectRequest) => Promise<IpcResponse<Project>>;
  updateProject: (data: UpdateProjectRequest) => Promise<IpcResponse<Project>>;
  deleteProject: (id: string) => Promise<IpcResponse<void>>;
  getProjectsByStatus: (status: string) => Promise<IpcResponse<Project[]>>;
  getProjectStats: () => Promise<IpcResponse<any>>;
  
  // Task Management API
  getAllTasks: () => Promise<IpcResponse<Task[]>>;
  getTaskById: (id: string) => Promise<IpcResponse<Task | null>>;
  getTasksByProject: (projectId: string) => Promise<IpcResponse<Task[]>>;
  createTask: (data: CreateTaskRequest) => Promise<IpcResponse<Task>>;
  updateTask: (data: UpdateTaskRequest) => Promise<IpcResponse<Task>>;
  deleteTask: (id: string) => Promise<IpcResponse<void>>;
  getTasksByStatus: (status: string) => Promise<IpcResponse<Task[]>>;
  getTaskStats: () => Promise<IpcResponse<any>>;
  
  // Dependency Management API
  getAllDependencies: () => Promise<IpcResponse<Dependency[]>>;
  getDependencyById: (id: string) => Promise<IpcResponse<Dependency | null>>;
  getDependenciesForEntity: (entityType: 'project' | 'task', entityId: string) => Promise<IpcResponse<Dependency[]>>;
  createDependency: (data: CreateDependencyRequest) => Promise<IpcResponse<Dependency>>;
  updateDependency: (data: UpdateDependencyRequest) => Promise<IpcResponse<Dependency>>;
  deleteDependency: (id: string) => Promise<IpcResponse<void>>;
  getDependencyStats: () => Promise<IpcResponse<any>>;
  
  // Legacy Data fetching (for backward compatibility)
  getProjects: () => Promise<any[]>;
  getTasks: () => Promise<any[]>;
  getTasksForProject: (projectId: string) => Promise<any[]>;
  getDependencies: () => Promise<any[]>;
  getEpics: () => Promise<any[]>;
  getEpicsForProject: (projectId: string) => Promise<any[]>;
  getFeatures: () => Promise<any[]>;
  getFeaturesForEpic: (epicId: string) => Promise<any[]>;
  
  // TEMPORARY: Insert Cloud Migration epics
  insertCloudMigrationEpics: () => Promise<{ success: boolean; epicCount?: number; featureCount?: number; error?: string }>;
  
  // Token Management
  storePATToken: (orgUrl: string, projectName: string, patToken: string, options?: any) => Promise<{ success: boolean; error?: string }>;
  retrievePATToken: (orgUrl: string, projectName: string) => Promise<{ success: boolean; token?: string; error?: string }>;
  getADOConfigurations: () => Promise<{ success: boolean; configurations?: any[]; error?: string }>;
  getADOConfigurationsWithExpiry: () => Promise<{ success: boolean; configurations?: any[]; error?: string }>;
  getADOConfiguration: (orgUrl: string, projectName: string) => Promise<{ success: boolean; configuration?: any; error?: string }>;
  updateADOConfiguration: (orgUrl: string, projectName: string, updates: any) => Promise<{ success: boolean; error?: string }>;
  updatePATToken: (orgUrl: string, projectName: string, newPatToken: string, expiryDate?: string) => Promise<{ success: boolean; error?: string }>;
  removePATToken: (orgUrl: string, projectName: string) => Promise<{ success: boolean; error?: string }>;
  testADOConnection: (orgUrl: string, projectName: string) => Promise<{ success: boolean; connected?: boolean; error?: string }>;
  updateConnectionStatus: (orgUrl: string, projectName: string, status: string, lastSyncAt?: string) => Promise<{ success: boolean; error?: string }>;
  generateWebhookSecret: () => Promise<{ success: boolean; secret?: string; error?: string }>;
  checkTokenExpiry: (orgUrl: string, projectName: string) => Promise<{ success: boolean; expiry?: any; error?: string }>;
  validatePATToken: (token: string) => Promise<{ success: boolean; isValid?: boolean; error?: string }>;
  
  // Test Runner
  runTestSuite: (testId: string, command: string, args: string[]) => Promise<{ success: boolean; error?: string; details?: string; output?: string[] }>;
  
  // Test Data Management
  clearModuleData: (moduleName: string) => Promise<{ success: boolean; deletedRecords?: number; module?: string; error?: string }>;
  getDataStats: () => Promise<{ success: boolean; stats?: any; error?: string }>;
  
  // Debug Logging
  debugGetConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
  debugSetEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  debugConfigure: (config: any) => Promise<{ success: boolean; error?: string }>;
  debugGetLogFiles: () => Promise<{ success: boolean; files?: Array<{ name: string; path: string; size: number; created: Date }>; error?: string }>;
  debugReadLogFile: (filePath: string, maxLines?: number) => Promise<{ success: boolean; entries?: any[]; error?: string }>;
  debugClearLogs: () => Promise<{ success: boolean; error?: string }>;
  debugGetCurrentLogFile: () => Promise<{ success: boolean; currentFile?: string; error?: string }>;
  
  // Audit Logging API
  logUserInteraction: (action: string, component?: string, target?: string, additionalData?: Record<string, any>) => Promise<void>;
  logFormChange: (component: string, field: string, oldValue: any, newValue: any, validationResult?: { valid: boolean; errors?: string[] }) => Promise<void>;
  logNavigation: (from: string, to: string, trigger?: 'user' | 'system') => Promise<void>;
  logError: (error: Error, component?: string, additionalContext?: Record<string, any>) => Promise<void>;
  logDataChange: (action: string, entityType: string, entityId: string, oldData?: any, newData?: any) => Promise<void>;
  getRecentAuditEvents: (minutes?: number) => Promise<any[]>;
  getErrorContext: (errorTimestamp: string, contextMinutes?: number) => Promise<{ error: any | null; leadingEvents: any[] }>;
  exportAuditLogs: (outputPath: string, filter?: any) => Promise<void>;
  getAuditStats: () => Promise<any>;
  
  // Backup & Restore API
  createBackup: (description?: string, tags?: string[], includeFullAuditHistory?: boolean) => Promise<{ success: boolean; backupPath?: string; error?: string }>;
  restoreFromBackup: (backupPath: string, options: any) => Promise<any>;
  listBackups: () => Promise<Array<{ path: string; metadata: any; accessible: boolean }>>;
  deleteBackup: (backupPath: string) => Promise<{ success: boolean; error?: string }>;
  exportBackup: (backupPath: string) => Promise<{ success: boolean; exportPath?: string; error?: string }>;
  importBackup: () => Promise<{ success: boolean; backupPath?: string; error?: string }>;
  
  // Settings API
  saveSettings: (settings: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  getSettings: () => Promise<Record<string, any>>;
  getSetting: (key: string) => Promise<any>;
  
  // Calendar API
  saveCalendarMonth: (monthData: any) => Promise<{ success: boolean; result?: any; error?: string }>;
  getCalendarMonth: (year: number, month: number) => Promise<any>;
  importPublicHolidays: (holidays: any[]) => Promise<{ success: boolean; result?: { imported: number; skipped: number }; error?: string }>;
  getPublicHolidays: (year?: number, month?: number) => Promise<any[]>;
  deletePublicHoliday: (id: number) => Promise<{ success: boolean; result?: any; error?: string }>;
  
  // Export/Import API
  exportData: (options: { areas: string[]; epicFeatureConfigOptions?: { includeDefaults?: boolean; includeTeamMembers?: boolean; includePaths?: boolean } }) => Promise<IpcResponse<{ success: boolean; filesCreated?: number; error?: string }>>;
  importData: (options: { areas: string[] }) => Promise<IpcResponse<{ success: boolean; results?: any[]; error?: string }>>;
  
  // LocalStorage Management (for Epic & Feature Config)
  getLocalStorageItem: (key: string) => Promise<string | null>;
  setLocalStorageItem: (key: string, value: string) => Promise<void>;
  
  // Template Management
  listTemplates: () => Promise<{ success: boolean; templates: Array<{ filename: string; displayName: string; path: string }>; error?: string }>;
  openTemplate: (templateName: string) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Governance API
  governance: {
    // Portfolio & Dashboard
    getPortfolioHealth: () => Promise<{ success: boolean; data?: any; error?: string }>;
    getDashboard: () => Promise<{ success: boolean; data?: any; error?: string }>;
    refreshMetrics: () => Promise<{ success: boolean; error?: string }>;
    
    // Stage Gate
    tryAutoProgress: (projectId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    checkGateReadiness: (projectId: string, gateId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    
    // Compliance
    initializeCompliance: (projectId: string) => Promise<{ success: boolean; error?: string }>;
    updateComplianceStatus: (complianceId: string, status: string, evidence?: string, assessedBy?: string) => Promise<{ success: boolean; error?: string }>;
    createWaiver: (waiver: any) => Promise<{ success: boolean; data?: string; error?: string }>;
    processOverdueCompliance: () => Promise<{ success: boolean; error?: string }>;
    
    // Decisions & Actions
    recordDecision: (decision: any, actions?: any[]) => Promise<{ success: boolean; data?: string; error?: string }>;
    createAction: (action: any) => Promise<{ success: boolean; data?: string; error?: string }>;
    updateActionStatus: (actionId: string, status: string, completedBy?: string) => Promise<{ success: boolean; error?: string }>;
    addActionDependency: (actionId: string, dependsOnActionId: string) => Promise<{ success: boolean; error?: string }>;
    getProjectActions: (projectId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getOverdueActions: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    
    // Benefits
    calculateROI: (projectId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    calculateBenefitsVariance: (projectId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    updateBenefitRealization: (benefitId: string, status: string, actualValue?: number, actualDate?: string) => Promise<{ success: boolean; error?: string }>;
    createBenefit: (benefit: any) => Promise<{ success: boolean; data?: string; error?: string }>;
    getPortfolioBenefitsSummary: () => Promise<{ success: boolean; data?: any; error?: string }>;
    
    // Strategic Alignment
    calculateAlignmentScore: (projectId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    linkProjectToInitiative: (projectId: string, initiativeId: string) => Promise<{ success: boolean; error?: string }>;
    getProjectsByInitiative: (initiativeId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getPortfolioAlignmentSummary: () => Promise<{ success: boolean; data?: any; error?: string }>;
    
    // Escalations
    createEscalation: (escalation: any) => Promise<{ success: boolean; data?: string; error?: string }>;
    resolveEscalation: (escalationId: string, resolution: string, resolvedBy: string) => Promise<{ success: boolean; error?: string }>;
    processAutoEscalations: () => Promise<{ success: boolean; error?: string }>;
    getEscalationSummary: () => Promise<{ success: boolean; data?: any; error?: string }>;
    
    // Analytics
    generateHeatmap: (filters?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getHealthTrend: (days?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getGateProgressionAnalytics: () => Promise<{ success: boolean; data?: any; error?: string }>;
    getComplianceAnalytics: () => Promise<{ success: boolean; data?: any; error?: string }>;
    
    // Reporting
    generateExecutiveSummary: (dateRange?: { start: string; end: string }) => Promise<{ success: boolean; data?: any; error?: string }>;
    generateProjectReport: (projectId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    generateComplianceAuditReport: (policyId?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    exportReport: (report: any, format: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  };

  // Project Coordinator API
  coordinator?: {
    // Import operations
    importTimesheets: (csvData: string) => Promise<any>;
    importActuals: (csvData: string) => Promise<any>;
    importLabourRates: (csvData: string, fiscalYear: string) => Promise<any>;
    importResources: (csvData: string) => Promise<any>;
    getImportCounts: () => Promise<{ timesheets: number; actuals: number; labourRates: number }>;
    
    // Resource Commitments
    createCommitment: (data: {
      resource_id: number;
      period_start: string;
      period_end: string;
      commitment_type: 'per-day' | 'per-week' | 'per-fortnight';
      committed_hours: number;
    }) => Promise<any>;
    getCapacity: (data: { resourceId: number; periodStart: string; periodEnd: string }) => Promise<any>;
    getAllCapacities: () => Promise<any[]>;
    updateAllocatedHours: (data: { resourceId: number }) => Promise<void>;
    
    // Feature Allocations
    createAllocation: (data: {
      resource_id: number;
      feature_id: string;
      allocated_hours: number;
      forecast_start_date?: string;
      forecast_end_date?: string;
    }) => Promise<any>;
    updateAllocation: (data: { allocationId: string; updates: any }) => Promise<void>;
    deleteAllocation: (data: { allocationId: string }) => Promise<void>;
    getAllocationsForResource: (data: { resourceId: number }) => Promise<any[]>;
    getAllocationsForFeature: (data: { featureId: number }) => Promise<any[]>;
    reconcileAllocation: (data: { allocationId: string }) => Promise<any>;
    reconcileAllAllocations: () => Promise<any[]>;
    getFeatureAllocationSummary: (data: { featureId: number }) => Promise<any>;
    
    // Resource queries
    getAllResources: () => Promise<any[]>;
  };
}

// Expose the API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Basic functionality
  ping: () => ipcRenderer.invoke('ping'),
  getAppPath: (name: string) => ipcRenderer.invoke('get-app-path', name),
  
  // Database operations
  dbQuery: (sql: string, params?: any) => ipcRenderer.invoke('db-query', sql, params),
  dbGet: (sql: string, params?: any) => ipcRenderer.invoke('db-get', sql, params),
  
  // Mutations
  applyMutation: (mutation: any) => ipcRenderer.invoke('apply-mutation', mutation),
  
  // Project Management API (New)
  getAllProjects: () => ipcRenderer.invoke('project:getAll'),
  getProjectById: (id: string) => ipcRenderer.invoke('project:getById', id),
  createProject: (data: CreateProjectRequest) => ipcRenderer.invoke('project:create', data),
  updateProject: (data: UpdateProjectRequest) => ipcRenderer.invoke('project:update', data),
  deleteProject: (id: string) => ipcRenderer.invoke('project:delete', id),
  getProjectsByStatus: (status: string) => ipcRenderer.invoke('project:getByStatus', status),
  getProjectStats: () => ipcRenderer.invoke('project:getStats'),
  
  // Task Management API
  getAllTasks: () => ipcRenderer.invoke('task:getAll'),
  getTaskById: (id: string) => ipcRenderer.invoke('task:getById', id),
  getTasksByProject: (projectId: string) => ipcRenderer.invoke('task:getByProject', projectId),
  createTask: (data: CreateTaskRequest) => ipcRenderer.invoke('task:create', data),
  updateTask: (data: UpdateTaskRequest) => ipcRenderer.invoke('task:update', data),
  deleteTask: (id: string) => ipcRenderer.invoke('task:delete', id),
  getTasksByStatus: (status: string) => ipcRenderer.invoke('task:getByStatus', status),
  getTaskStats: () => ipcRenderer.invoke('task:getStats'),
  
  // Dependency Management API
  getAllDependencies: () => ipcRenderer.invoke('dependency:getAll'),
  getDependencyById: (id: string) => ipcRenderer.invoke('dependency:getById', id),
  getDependenciesForEntity: (entityType: 'project' | 'task', entityId: string) => 
    ipcRenderer.invoke('dependency:getForEntity', entityType, entityId),
  createDependency: (data: CreateDependencyRequest) => ipcRenderer.invoke('dependency:create', data),
  updateDependency: (data: UpdateDependencyRequest) => ipcRenderer.invoke('dependency:update', data),
  deleteDependency: (id: string) => ipcRenderer.invoke('dependency:delete', id),
  getDependencyStats: () => ipcRenderer.invoke('dependency:getStats'),
  
  // Legacy Data fetching (for backward compatibility)
  getProjects: () => ipcRenderer.invoke('get-projects'),
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  getTasksForProject: (projectId: string) => ipcRenderer.invoke('get-tasks-for-project', projectId),
  getDependencies: () => ipcRenderer.invoke('get-dependencies'),
  getEpics: () => ipcRenderer.invoke('get-epics'),
  getEpicsForProject: (projectId: string) => ipcRenderer.invoke('get-epics-for-project', projectId),
  getFeatures: () => ipcRenderer.invoke('get-features'),
  getFeaturesForEpic: (epicId: string) => ipcRenderer.invoke('get-features-for-epic', epicId),
  
  // TEMPORARY: Insert Cloud Migration epics
  insertCloudMigrationEpics: () => ipcRenderer.invoke('insert-cloud-migration-epics'),
  
  // Token Management
  storePATToken: (orgUrl: string, projectName: string, patToken: string, options?: any) => 
    ipcRenderer.invoke('store-pat-token', orgUrl, projectName, patToken, options),
  retrievePATToken: (orgUrl: string, projectName: string) => 
    ipcRenderer.invoke('retrieve-pat-token', orgUrl, projectName),
  getADOConfigurations: () => 
    ipcRenderer.invoke('get-ado-configurations'),
  getADOConfigurationsWithExpiry: () => 
    ipcRenderer.invoke('get-ado-configurations-with-expiry'),
  getADOConfiguration: (orgUrl: string, projectName: string) => 
    ipcRenderer.invoke('get-ado-configuration', orgUrl, projectName),
  updateADOConfiguration: (orgUrl: string, projectName: string, updates: any) => 
    ipcRenderer.invoke('update-ado-configuration', orgUrl, projectName, updates),
  updatePATToken: (orgUrl: string, projectName: string, newPatToken: string, expiryDate?: string) => 
    ipcRenderer.invoke('update-pat-token', orgUrl, projectName, newPatToken, expiryDate),
  removePATToken: (orgUrl: string, projectName: string) => 
    ipcRenderer.invoke('remove-pat-token', orgUrl, projectName),
  testADOConnection: (orgUrl: string, projectName: string) => 
    ipcRenderer.invoke('test-ado-connection', orgUrl, projectName),
  updateConnectionStatus: (orgUrl: string, projectName: string, status: string, lastSyncAt?: string) => 
    ipcRenderer.invoke('update-connection-status', orgUrl, projectName, status, lastSyncAt),
  generateWebhookSecret: () => 
    ipcRenderer.invoke('generate-webhook-secret'),
  checkTokenExpiry: (orgUrl: string, projectName: string) => 
    ipcRenderer.invoke('check-token-expiry', orgUrl, projectName),
  validatePATToken: (token: string) => 
    ipcRenderer.invoke('validate-pat-token', token),
  
  // Test Runner
  runTestSuite: (testId: string, command: string, args: string[]) => 
    ipcRenderer.invoke('run-test-suite', testId, command, args),
  
  // Test Data Management
  clearModuleData: (moduleName: string) => 
    ipcRenderer.invoke('test:clearModuleData', moduleName),
  getDataStats: () => 
    ipcRenderer.invoke('test:getDataStats'),
  
  // Debug Logging
  debugGetConfig: () => 
    ipcRenderer.invoke('debug-get-config'),
  debugSetEnabled: (enabled: boolean) => 
    ipcRenderer.invoke('debug-set-enabled', enabled),
  debugConfigure: (config: any) => 
    ipcRenderer.invoke('debug-configure', config),
  debugGetLogFiles: () => 
    ipcRenderer.invoke('debug-get-log-files'),
  debugReadLogFile: (filePath: string, maxLines?: number) => 
    ipcRenderer.invoke('debug-read-log-file', filePath, maxLines),
  debugClearLogs: () => 
    ipcRenderer.invoke('debug-clear-logs'),
  debugGetCurrentLogFile: () => 
    ipcRenderer.invoke('debug-get-current-log-file'),
  
  // Audit Logging API
  logUserInteraction: (action: string, component?: string, target?: string, additionalData?: Record<string, any>) => 
    ipcRenderer.invoke('audit:logUserInteraction', action, component, target, additionalData),
  logFormChange: (component: string, field: string, oldValue: any, newValue: any, validationResult?: { valid: boolean; errors?: string[] }) => 
    ipcRenderer.invoke('audit:logFormChange', component, field, oldValue, newValue, validationResult),
  logNavigation: (from: string, to: string, trigger?: 'user' | 'system') => 
    ipcRenderer.invoke('audit:logNavigation', from, to, trigger),
  logError: (error: Error, component?: string, additionalContext?: Record<string, any>) => 
    ipcRenderer.invoke('audit:logError', { message: error.message, stack: error.stack, name: error.name }, component, additionalContext),
  logDataChange: (action: string, entityType: string, entityId: string, oldData?: any, newData?: any) => 
    ipcRenderer.invoke('audit:logDataChange', action, entityType, entityId, oldData, newData),
  getRecentAuditEvents: (minutes?: number) => 
    ipcRenderer.invoke('audit:getRecentEvents', minutes),
  getErrorContext: (errorTimestamp: string, contextMinutes?: number) => 
    ipcRenderer.invoke('audit:getErrorContext', errorTimestamp, contextMinutes),
  exportAuditLogs: (outputPath: string, filter?: any) => 
    ipcRenderer.invoke('audit:exportLogs', outputPath, filter),
  getAuditStats: () => 
    ipcRenderer.invoke('audit:getStats'),
  
  // Backup & Restore API
  createBackup: (description?: string, tags?: string[], includeFullAuditHistory?: boolean) => 
    ipcRenderer.invoke('backup:create', description, tags, includeFullAuditHistory),
  restoreFromBackup: (backupPath: string, options: any) => 
    ipcRenderer.invoke('backup:restore', backupPath, options),
  listBackups: () => 
    ipcRenderer.invoke('backup:list'),
  deleteBackup: (backupPath: string) => 
    ipcRenderer.invoke('backup:delete', backupPath),
  exportBackup: (backupPath: string) => 
    ipcRenderer.invoke('backup:export', backupPath),
  importBackup: () => 
    ipcRenderer.invoke('backup:import'),
  
  // Settings API
  saveSettings: (settings: Record<string, any>) => 
    ipcRenderer.invoke('settings:save', settings),
  getSettings: () => 
    ipcRenderer.invoke('settings:load'),
  getSetting: (key: string) => 
    ipcRenderer.invoke('settings:get', key),
  
  // Calendar API
  saveCalendarMonth: (monthData: any) => 
    ipcRenderer.invoke('calendar:saveMonth', monthData),
  getCalendarMonth: async (year: number, month: number) => {
    const response = await ipcRenderer.invoke('calendar:getMonth', year, month);
    return response.data;
  },
  importPublicHolidays: (holidays: any[]) => 
    ipcRenderer.invoke('calendar:importHolidays', holidays),
  getPublicHolidays: async (year?: number, month?: number) => {
    const response = await ipcRenderer.invoke('calendar:getHolidays', year, month);
    return response.holidays || [];
  },
  deletePublicHoliday: (id: number) => 
    ipcRenderer.invoke('calendar:deleteHoliday', id),
  
  // Export/Import API
  exportData: (options: { areas: string[]; epicFeatureConfigOptions?: { includeDefaults?: boolean; includeTeamMembers?: boolean; includePaths?: boolean } }) => 
    ipcRenderer.invoke('exportImport:export', options),
  importData: (options: { areas: string[] }) => 
    ipcRenderer.invoke('exportImport:import', options),
  
  // LocalStorage Management (for Epic & Feature Config)
  getLocalStorageItem: (key: string) => 
    ipcRenderer.invoke('localStorage:getItem', key),
  setLocalStorageItem: (key: string, value: string) => 
    ipcRenderer.invoke('localStorage:setItem', key, value),
  
  // Template Management
  listTemplates: () => 
    ipcRenderer.invoke('template:list'),
  openTemplate: (templateName: string) => 
    ipcRenderer.invoke('template:open', templateName),

  // TEMPORARILY DISABLED - Governance API
  // Governance module disabled due to type mismatches - returning stub responses
  governance: {
    getPortfolioHealth: () => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    getDashboard: () => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    refreshMetrics: () => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    tryAutoProgress: (projectId: string) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    checkGateReadiness: (projectId: string, gateId: string) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    initializeCompliance: (projectId: string) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    updateComplianceStatus: (complianceId: string, status: string, evidence?: string, assessedBy?: string) => 
      Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    createWaiver: (waiver: any) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    processOverdueCompliance: () => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    recordDecision: (decision: any, actions?: any[]) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    createAction: (action: any) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    updateActionStatus: (actionId: string, status: string, completedBy?: string) => 
      Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    addActionDependency: (actionId: string, dependsOnActionId: string) => 
      Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    getProjectActions: (projectId: string) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    getOverdueActions: () => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    calculateROI: (projectId: string) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    calculateBenefitsVariance: (projectId: string) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    updateBenefitRealization: (benefitId: string, status: string, actualValue?: number, actualDate?: string) => 
      Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    createBenefit: (benefit: any) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    getPortfolioBenefitsSummary: () => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    calculateAlignmentScore: (projectId: string) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    linkProjectToInitiative: (projectId: string, initiativeId: string) => 
      Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    getProjectsByInitiative: (initiativeId: string) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    getPortfolioAlignmentSummary: () => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    createEscalation: (escalation: any) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    resolveEscalation: (escalationId: string, resolution: string, resolvedBy: string) => 
      Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    processAutoEscalations: () => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    getEscalationSummary: () => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    generateHeatmap: (filters?: any) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled', data: [] }),
    getHealthTrend: (days?: number) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled', data: [] }),
    getGateProgressionAnalytics: () => Promise.resolve({ success: false, error: 'Governance module temporarily disabled', data: [] }),
    getComplianceAnalytics: () => Promise.resolve({ success: false, error: 'Governance module temporarily disabled', data: [] }),
    generateExecutiveSummary: (dateRange?: { start: string; end: string }) => 
      Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    generateProjectReport: (projectId: string) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    generateComplianceAuditReport: (policyId?: string) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' }),
    exportReport: (report: any, format: string) => Promise.resolve({ success: false, error: 'Governance module temporarily disabled' })
  },

  // Project Coordinator API
  coordinator: {
    // Import operations
    importTimesheets: (csvData: string) => 
      ipcRenderer.invoke('coordinator:importTimesheets', csvData),
    importActuals: (csvData: string) => 
      ipcRenderer.invoke('coordinator:importActuals', csvData),
    importLabourRates: (csvData: string, fiscalYear: string) => 
      ipcRenderer.invoke('coordinator:importLabourRates', csvData, fiscalYear),
    importResources: (csvData: string) => 
      ipcRenderer.invoke('coordinator:importResources', csvData),
    getImportCounts: () => 
      ipcRenderer.invoke('coordinator:getImportCounts'),
    
    // Resource Commitments
    createCommitment: (data: any) => 
      ipcRenderer.invoke('coordinator:createCommitment', data),
    getCapacity: (data: { resourceId: number; periodStart: string; periodEnd: string }) => 
      ipcRenderer.invoke('coordinator:getCapacity', data),
    getAllCapacities: () => 
      ipcRenderer.invoke('coordinator:getAllCapacities'),
    updateAllocatedHours: (data: { resourceId: number }) => 
      ipcRenderer.invoke('coordinator:updateAllocatedHours', data),
    
    // Feature Allocations
    createAllocation: (data: any) => 
      ipcRenderer.invoke('coordinator:createAllocation', data),
    updateAllocation: (data: { allocationId: string; updates: any }) => 
      ipcRenderer.invoke('coordinator:updateAllocation', data),
    deleteAllocation: (data: { allocationId: string }) => 
      ipcRenderer.invoke('coordinator:deleteAllocation', data),
    getAllocationsForResource: (data: { resourceId: number }) => 
      ipcRenderer.invoke('coordinator:getAllocationsForResource', data),
    getAllocationsForFeature: (data: { featureId: number }) => 
      ipcRenderer.invoke('coordinator:getAllocationsForFeature', data),
    reconcileAllocation: (data: { allocationId: string }) => 
      ipcRenderer.invoke('coordinator:reconcileAllocation', data),
    reconcileAllAllocations: () => 
      ipcRenderer.invoke('coordinator:reconcileAllAllocations'),
    getFeatureAllocationSummary: (data: { featureId: number }) => 
      ipcRenderer.invoke('coordinator:getFeatureAllocationSummary', data),
    
    // Resource queries
    getAllResources: () => 
      ipcRenderer.invoke('coordinator:getAllResources')
  }
} satisfies ElectronAPI);

// Type declaration for renderer process
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    auditLogger?: {
      logUserInteraction: (action: string, component?: string, target?: string, additionalData?: Record<string, any>) => Promise<void>;
      logFormChange: (component: string, field: string, oldValue: any, newValue: any, validationResult?: { valid: boolean; errors?: string[] }) => Promise<void>;
      logNavigation: (from: string, to: string, trigger?: 'user' | 'system') => Promise<void>;
      logError: (error: Error, component?: string, additionalContext?: Record<string, any>) => Promise<void>;
      logDataChange: (action: string, entityType: string, entityId: string, oldData?: any, newData?: any) => Promise<void>;
      getRecentEvents: (minutes?: number) => Promise<any[]>;
      getErrorContext: (errorTimestamp: string, contextMinutes?: number) => Promise<{ error: any | null; leadingEvents: any[] }>;
      exportLogs: (outputPath: string, filter?: any) => Promise<void>;
      getStats: () => Promise<any>;
    };
  }
}

console.log('Preload script loaded');