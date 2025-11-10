import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import { openDB } from './db';
import { applyMutation, validateMutation, withTransaction, saveCalendarMonth, getCalendarMonth, importPublicHolidays, getPublicHolidays, deletePublicHoliday } from './mutations';
import type { DB } from './db';
import { encryptionService } from './services/security/EncryptionService';
import { tokenManager } from './services/security/TokenManager';
import { debugLogger, setupGlobalErrorHandlers } from './services/debug/DebugLogger';
import { ProjectIpcHandlers } from './ipc/projectHandlers';
import { TaskIpcHandlers } from './ipc/taskHandlers';
import { DependencyIpcHandlers } from './ipc/dependencyHandlers';
import { registerSettingsHandlers } from './ipc/settingsHandlers';
import { ExportImportIpcHandlers } from './ipc/exportImportHandlers';
import { LocalStorageIpcHandlers } from './ipc/localStorageHandlers';
import { AuditLogger } from './services/AuditLogger';
import { BackupRestoreService } from './services/BackupRestoreService';
import { registerCoordinatorHandlers } from './ipc/coordinatorHandlers';
import { registerTemplateHandlers } from './ipc/templateHandlers';
// TEMPORARILY DISABLED - Governance module has type mismatches
// import { GovernanceIpcHandlers } from './ipc/governanceHandlers';

// Global references
let mainWindow: BrowserWindow | null = null;
let database: DB | null = null;
let projectHandlers: ProjectIpcHandlers | null = null;
let taskHandlers: TaskIpcHandlers | null = null;
let dependencyHandlers: DependencyIpcHandlers | null = null;
let exportImportHandlers: ExportImportIpcHandlers | null = null;
let localStorageHandlers: LocalStorageIpcHandlers | null = null;
// TEMPORARILY DISABLED - Governance module has type mismatches
// let governanceHandlers: GovernanceIpcHandlers | null = null;
let auditLogger: AuditLogger | null = null;
let backupService: BackupRestoreService | null = null;

// Development detection
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      contextIsolation: true,
      sandbox: false, // Set to false for file system access
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // Focus on Windows
    if (process.platform === 'win32') {
      mainWindow?.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Setup global error handlers
setupGlobalErrorHandlers();

// App event handlers
app.whenReady().then(async () => {
  // Initialize debug logging first
  try {
    await debugLogger.initialize();
    debugLogger.info('MAIN_PROCESS', 'Application starting up', {
      context: { component: 'Main', function: 'app.whenReady' },
      metadata: { 
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('Failed to initialize debug logger:', error);
    // Continue without debug logging
  }
  
  // Initialize encryption service
  try {
    await encryptionService.initialize();
    console.log('Encryption service initialized successfully');
    debugLogger.info('ENCRYPTION', 'Encryption service initialized successfully', {
      context: { component: 'EncryptionService', function: 'initialize' }
    });
  } catch (error) {
    console.error('Failed to initialize encryption service:', error);
    debugLogger.fatal('ENCRYPTION', 'Failed to initialize encryption service', {
      context: { component: 'EncryptionService', function: 'initialize' },
      error: error as Error
    });
    app.quit();
    return;
  }
  
  // Initialize database
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'roadmap.db');
    database = openDB(dbPath);
    console.log('Database initialized at:', dbPath);
    debugLogger.info('DATABASE', 'Database initialized successfully', {
      context: { component: 'Database', function: 'openDB' },
      metadata: { dbPath, userDataPath }
    });
    
    // Initialize TokenManager with database
    tokenManager.initialize(database);
    console.log('TokenManager initialized with database');
    debugLogger.info('TOKEN_MANAGER', 'TokenManager initialized with database', {
      context: { component: 'TokenManager', function: 'initialize' }
    });
    
    // Initialize Project IPC handlers
    projectHandlers = new ProjectIpcHandlers(database);
    console.log('Project IPC handlers initialized');
    debugLogger.info('PROJECT_IPC', 'Project IPC handlers initialized', {
      context: { component: 'ProjectIpcHandlers', function: 'constructor' }
    });
    
    // Initialize Task IPC handlers
    taskHandlers = new TaskIpcHandlers(database);
    console.log('Task IPC handlers initialized');
    debugLogger.info('TASK_IPC', 'Task IPC handlers initialized', {
      context: { component: 'TaskIpcHandlers', function: 'constructor' }
    });
    
    // Initialize Dependency IPC handlers
    dependencyHandlers = new DependencyIpcHandlers(database);
    console.log('Dependency IPC handlers initialized');
    debugLogger.info('DEPENDENCY_IPC', 'Dependency IPC handlers initialized', {
      context: { component: 'DependencyIpcHandlers', function: 'constructor' }
    });
    
    // Initialize Export/Import IPC handlers
    exportImportHandlers = new ExportImportIpcHandlers(database);
    console.log('Export/Import IPC handlers initialized');
    debugLogger.info('EXPORT_IMPORT_IPC', 'Export/Import IPC handlers initialized', {
      context: { component: 'ExportImportIpcHandlers', function: 'constructor' }
    });
    
    // Initialize LocalStorage IPC handlers
    localStorageHandlers = new LocalStorageIpcHandlers();
    console.log('LocalStorage IPC handlers initialized');
    debugLogger.info('LOCALSTORAGE_IPC', 'LocalStorage IPC handlers initialized', {
      context: { component: 'LocalStorageIpcHandlers', function: 'constructor' }
    });
    
    // Initialize Audit Logger
    auditLogger = new AuditLogger(database, app.getPath('userData'));
    await auditLogger.initialize();
    console.log('Audit logger initialized');
    debugLogger.info('AUDIT_LOGGER', 'Audit logger initialized', {
      context: { component: 'AuditLogger', function: 'initialize' }
    });
    
    // Initialize Backup Service
    backupService = new BackupRestoreService(database, app.getPath('userData'));
    backupService.setAuditLogger(auditLogger);
    console.log('Backup service initialized');
    debugLogger.info('BACKUP_SERVICE', 'Backup service initialized', {
      context: { component: 'BackupRestoreService', function: 'constructor' }
    });
    
    // Register Settings IPC handlers
    registerSettingsHandlers(database);
    console.log('Settings IPC handlers registered');
    debugLogger.info('SETTINGS_IPC', 'Settings IPC handlers registered', {
      context: { component: 'SettingsHandlers', function: 'registerSettingsHandlers' }
    });
    
    // Register Project Coordinator IPC handlers
    registerCoordinatorHandlers(database);
    console.log('Project Coordinator IPC handlers registered');
    debugLogger.info('COORDINATOR_IPC', 'Project Coordinator IPC handlers registered', {
      context: { component: 'CoordinatorHandlers', function: 'registerCoordinatorHandlers' }
    });
    
    // Register Template IPC handlers
    registerTemplateHandlers();
    console.log('Template IPC handlers registered');
    debugLogger.info('TEMPLATE_IPC', 'Template IPC handlers registered', {
      context: { component: 'TemplateHandlers', function: 'registerTemplateHandlers' }
    });
    
    // TEMPORARILY DISABLED - Governance module has type mismatches
    // Initialize Governance IPC handlers
    // governanceHandlers = new GovernanceIpcHandlers(database);
    // console.log('Governance IPC handlers initialized');
    // debugLogger.info('GOVERNANCE_IPC', 'Governance IPC handlers initialized', {
    //   context: { component: 'GovernanceIpcHandlers', function: 'constructor' }
    // });
    
    // Add some test data in development
    if (isDev) {
      addTestData();
      debugLogger.debug('TEST_DATA', 'Test data initialization attempted', {
        context: { component: 'Main', function: 'addTestData' }
      });
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    debugLogger.fatal('DATABASE', 'Failed to initialize database', {
      context: { component: 'Database', function: 'openDB' },
      error: error as Error
    });
    app.quit();
    return;
  }
  
  // Create window
  createWindow();
  
  // macOS: Re-create window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', async () => {
  debugLogger.info('MAIN_PROCESS', 'All windows closed, cleaning up', {
    context: { component: 'Main', function: 'window-all-closed' }
  });
  
  // Cleanup project handlers
  if (projectHandlers) {
    projectHandlers.cleanup();
    projectHandlers = null;
    debugLogger.info('PROJECT_IPC', 'Project IPC handlers cleaned up', {
      context: { component: 'ProjectIpcHandlers', function: 'cleanup' }
    });
  }
  
  // Cleanup task handlers
  if (taskHandlers) {
    taskHandlers.cleanup();
    taskHandlers = null;
    debugLogger.info('TASK_IPC', 'Task IPC handlers cleaned up', {
      context: { component: 'TaskIpcHandlers', function: 'cleanup' }
    });
  }
  
  // Cleanup dependency handlers
  if (dependencyHandlers) {
    dependencyHandlers.cleanup();
    dependencyHandlers = null;
    debugLogger.info('DEPENDENCY_IPC', 'Dependency IPC handlers cleaned up', {
      context: { component: 'DependencyIpcHandlers', function: 'cleanup' }
    });
  }
  
  // Cleanup export/import handlers
  if (exportImportHandlers) {
    exportImportHandlers.cleanup();
    exportImportHandlers = null;
    debugLogger.info('EXPORT_IMPORT_IPC', 'Export/Import IPC handlers cleaned up', {
      context: { component: 'ExportImportIpcHandlers', function: 'cleanup' }
    });
  }
  
  // Cleanup localStorage handlers
  if (localStorageHandlers) {
    localStorageHandlers.cleanup();
    localStorageHandlers = null;
    debugLogger.info('LOCALSTORAGE_IPC', 'LocalStorage IPC handlers cleaned up', {
      context: { component: 'LocalStorageIpcHandlers', function: 'cleanup' }
    });
  }
  
  // TEMPORARILY DISABLED - Governance module has type mismatches
  // Cleanup governance handlers
  // if (governanceHandlers) {
  //   governanceHandlers.cleanup();
  //   governanceHandlers = null;
  //   debugLogger.info('GOVERNANCE_IPC', 'Governance IPC handlers cleaned up', {
  //     context: { component: 'GovernanceIpcHandlers', function: 'cleanup' }
  //   });
  // }
  
  // Cleanup audit logger
  if (auditLogger) {
    await auditLogger.shutdown();
    auditLogger = null;
    debugLogger.info('AUDIT_LOGGER', 'Audit logger shutdown completed', {
      context: { component: 'AuditLogger', function: 'shutdown' }
    });
  }
  
  // Cleanup backup service
  if (backupService) {
    backupService = null;
    debugLogger.info('BACKUP_SERVICE', 'Backup service cleaned up', {
      context: { component: 'BackupRestoreService', function: 'cleanup' }
    });
  }
  
  // Close database
  if (database) {
    database.close();
    database = null;
    debugLogger.info('DATABASE', 'Database connection closed', {
      context: { component: 'Database', function: 'close' }
    });
  }
  
  // Clean up encryption service
  encryptionService.clearMasterKey();
  console.log('Encryption service cleaned up');
  debugLogger.info('ENCRYPTION', 'Encryption service cleaned up', {
    context: { component: 'EncryptionService', function: 'clearMasterKey' }
  });
  
  // Shutdown debug logger
  debugLogger.shutdown().then(() => {
    console.log('Debug logger shutdown completed');
  }).catch(err => {
    console.error('Error shutting down debug logger:', err);
  });
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('ping', () => {
  return 'pong';
});

ipcMain.handle('get-app-path', (event, name: string) => {
  return app.getPath(name as any);
});

ipcMain.handle('db-query', (event, sql: string, params: any = {}) => {
  if (!database) throw new Error('Database not initialized');
  try {
    const stmt = database.prepare(sql);
    return stmt.all(params);
  } catch (error: any) {
    console.error('Database query error:', error);
    throw error;
  }
});

ipcMain.handle('db-get', (event, sql: string, params: any = {}) => {
  if (!database) throw new Error('Database not initialized');
  try {
    const stmt = database.prepare(sql);
    return stmt.get(params);
  } catch (error: any) {
    console.error('Database get error:', error);
    throw error;
  }
});

ipcMain.handle('apply-mutation', async (event, mutation: any) => {
  if (!database) {
    debugLogger.error('IPC', 'Database not initialized for mutation', {
      context: { component: 'IPC', function: 'apply-mutation' },
      metadata: { mutation: { type: mutation?.type, opId: mutation?.opId } }
    });
    throw new Error('Database not initialized');
  }
  
  try {
    validateMutation(mutation);
    
    const result = withTransaction(database, () => {
      return applyMutation(database!, mutation);
    });
    
    console.log('Mutation applied:', mutation.type, mutation.opId);
    debugLogger.info('MUTATION', 'Mutation applied successfully', {
      context: { component: 'Mutation', function: 'apply-mutation' },
      metadata: { type: mutation.type, opId: mutation.opId }
    });
    return { success: true, result };
  } catch (error: any) {
    console.error('Mutation error:', error);
    debugLogger.error('MUTATION', 'Mutation failed', {
      context: { component: 'Mutation', function: 'apply-mutation' },
      error: error,
      metadata: { mutation: { type: mutation?.type, opId: mutation?.opId } }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-projects', () => {
  if (!database) throw new Error('Database not initialized');
  
  try {
    const projects = database.prepare(`
      SELECT id, title, description, lane, 
             start_date_nz as start_date, end_date_nz as end_date,
             status, pm_name, budget_cents, financial_treatment, row
      FROM projects 
      ORDER BY start_date_iso
    `).all();
    
    // Convert cents to NZD for client
    return projects.map((p: any) => ({
      ...p,
      budget_nzd: (p.budget_cents || 0) / 100
    }));
  } catch (error: any) {
    console.error('Error getting projects:', error);
    throw error;
  }
});

ipcMain.handle('get-tasks', () => {
  if (!database) throw new Error('Database not initialized');
  
  try {
    const tasks = database.prepare(`
      SELECT id, project_id, title,
             start_date_nz as start_date, end_date_nz as end_date,
             effort_hours, status, assigned_resources
      FROM tasks 
      ORDER BY start_date_iso
    `).all();
    
    // Convert assigned_resources from JSON string
    return tasks.map((t: any) => ({
      ...t,
      assigned_resources: JSON.parse(t.assigned_resources || '[]')
    }));
  } catch (error: any) {
    console.error('Error getting tasks:', error);
    throw error;
  }
});

ipcMain.handle('get-tasks-for-project', (event, projectId: string) => {
  if (!database) throw new Error('Database not initialized');
  
  try {
    const tasks = database.prepare(`
      SELECT id, project_id, title,
             start_date_nz as start_date, end_date_nz as end_date,
             effort_hours, status, assigned_resources
      FROM tasks 
      WHERE project_id = @projectId
      ORDER BY start_date_iso
    `).all({ projectId });
    
    // Convert assigned_resources from JSON string
    return tasks.map((t: any) => ({
      ...t,
      assigned_resources: JSON.parse(t.assigned_resources || '[]')
    }));
  } catch (error: any) {
    console.error('Error getting tasks for project:', error);
    throw error;
  }
});

ipcMain.handle('get-dependencies', () => {
  if (!database) throw new Error('Database not initialized');
  
  try {
    const deps = database.prepare(`
      SELECT id, from_type, from_id, to_type, to_id, kind, lag_days, note
      FROM dependencies 
      ORDER BY created_at
    `).all();
    
    // Convert to client format
    return deps.map((d: any) => ({
      id: d.id,
      from: { type: d.from_type, id: d.from_id },
      to: { type: d.to_type, id: d.to_id },
      kind: d.kind,
      lag_days: d.lag_days,
      note: d.note
    }));
  } catch (error: any) {
    console.error('Error getting dependencies:', error);
    throw error;
  }
});

ipcMain.handle('get-epics', () => {
  if (!database) throw new Error('Database not initialized');
  
  try {
    const epics = database.prepare(`
      SELECT id, project_id, title, description, state, effort, business_value, time_criticality,
             start_date_nz as start_date, end_date_nz as end_date,
             assigned_to, area_path, iteration_path, risk, value_area, parent_feature,
             sort_order
      FROM epics 
      ORDER BY project_id, sort_order
    `).all();
    
    return epics;
  } catch (error: any) {
    console.error('Error getting epics:', error);
    throw error;
  }
});

ipcMain.handle('get-epics-for-project', (event, projectId: string) => {
  if (!database) throw new Error('Database not initialized');
  
  try {
    const epics = database.prepare(`
      SELECT id, project_id, title, description, state, effort, business_value, time_criticality,
             start_date_nz as start_date, end_date_nz as end_date,
             assigned_to, area_path, iteration_path, risk, value_area, parent_feature,
             sort_order
      FROM epics 
      WHERE project_id = @projectId
      ORDER BY sort_order
    `).all({ projectId });
    
    return epics;
  } catch (error: any) {
    console.error('Error getting epics for project:', error);
    throw error;
  }
});

ipcMain.handle('get-features', () => {
  if (!database) throw new Error('Database not initialized');
  
  try {
    const features = database.prepare(`
      SELECT id, epic_id, project_id, title, description, state, effort, business_value, time_criticality,
             start_date_nz as start_date, end_date_nz as end_date,
             assigned_to, area_path, iteration_path, risk, value_area,
             sort_order
      FROM features 
      ORDER BY epic_id, sort_order
    `).all();
    
    return features;
  } catch (error: any) {
    console.error('Error getting features:', error);
    throw error;
  }
});

ipcMain.handle('get-features-for-epic', (event, epicId: string) => {
  if (!database) throw new Error('Database not initialized');
  
  try {
    const features = database.prepare(`
      SELECT id, epic_id, project_id, title, description, state, effort, business_value, time_criticality,
             start_date_nz as start_date, end_date_nz as end_date,
             assigned_to, area_path, iteration_path, risk, value_area,
             sort_order
      FROM features 
      WHERE epic_id = @epicId
      ORDER BY sort_order
    `).all({ epicId });
    
    return features;
  } catch (error: any) {
    console.error('Error getting features for epic:', error);
    throw error;
  }
});

// TokenManager IPC Handlers
ipcMain.handle('store-pat-token', async (event, orgUrl: string, projectName: string, patToken: string, options?: any) => {
  try {
    await tokenManager.storePATToken(orgUrl, projectName, patToken, options);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to store PAT token:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('retrieve-pat-token', async (event, orgUrl: string, projectName: string) => {
  try {
    const token = await tokenManager.retrievePATToken(orgUrl, projectName);
    return { success: true, token };
  } catch (error: any) {
    console.error('Failed to retrieve PAT token:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-ado-configurations', () => {
  try {
    const configs = tokenManager.getADOConfigurations();
    return { success: true, configurations: configs };
  } catch (error: any) {
    console.error('Failed to get ADO configurations:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-ado-configuration', async (event, orgUrl: string, projectName: string) => {
  try {
    const config = await tokenManager.getADOConfiguration(orgUrl, projectName);
    return { success: true, configuration: config };
  } catch (error: any) {
    console.error('Failed to get ADO configuration:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-ado-configuration', (event, orgUrl: string, projectName: string, updates: any) => {
  try {
    tokenManager.updateADOConfiguration(orgUrl, projectName, updates);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update ADO configuration:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-pat-token', async (event, orgUrl: string, projectName: string, newPatToken: string, expiryDate?: string) => {
  try {
    await tokenManager.updatePATToken(orgUrl, projectName, newPatToken, expiryDate);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update PAT token:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-pat-token', (event, orgUrl: string, projectName: string) => {
  try {
    tokenManager.removePATToken(orgUrl, projectName);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to remove PAT token:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-ado-connection', async (event, orgUrl: string, projectName: string) => {
  try {
    const isConnected = await tokenManager.testConnection(orgUrl, projectName);
    return { success: true, connected: isConnected };
  } catch (error: any) {
    console.error('Failed to test ADO connection:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-connection-status', (event, orgUrl: string, projectName: string, status: string, lastSyncAt?: string) => {
  try {
    tokenManager.updateConnectionStatus(orgUrl, projectName, status as any, lastSyncAt);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update connection status:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('generate-webhook-secret', () => {
  try {
    const secret = tokenManager.generateWebhookSecret();
    return { success: true, secret };
  } catch (error: any) {
    console.error('Failed to generate webhook secret:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-token-expiry', (event, orgUrl: string, projectName: string) => {
  try {
    const expiry = tokenManager.checkTokenExpiry(orgUrl, projectName);
    return { success: true, expiry };
  } catch (error: any) {
    console.error('Failed to check token expiry:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-ado-configurations-with-expiry', () => {
  try {
    const configs = tokenManager.getADOConfigurationsWithExpiry();
    return { success: true, configurations: configs };
  } catch (error: any) {
    console.error('Failed to get ADO configurations with expiry:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('validate-pat-token', (event, token: string) => {
  try {
    const error = encryptionService.getPATValidationError(token);
    return { 
      success: true, 
      isValid: error === null, 
      error: error 
    };
  } catch (error: any) {
    console.error('Failed to validate PAT token:', error);
    return { success: false, error: error.message };
  }
});

// TEMPORARY: Insert Cloud Migration 2 epics and features
ipcMain.handle('insert-cloud-migration-epics', () => {
  if (!database) throw new Error('Database not initialized');
  
  try {
    // Insert Epics
    const insertEpic = database.prepare(`
      INSERT OR REPLACE INTO epics (
        id, project_id, title, description, state, effort, business_value, time_criticality,
        start_date_iso, end_date_iso, start_date_nz, end_date_nz,
        assigned_to, area_path, iteration_path, risk, value_area, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    insertEpic.run(
      'EPIC-CM2-PLATFORM-SEC',
      'PROJ-1762388020575-3S4ZN',
      '[Platform] | Security as Code Implementation',
      'Implement comprehensive security scanning and compliance tools',
      'Active', 25, 85, 2,
      '2025-01-15T00:00:00.000Z', '2025-06-30T00:00:00.000Z',
      '15-01-2025', '30-06-2025',
      'Yash Yash (Yash.Yash@one.nz)',
      'IT\\BTE Tribe', 'IT\\Sprint\\FY26\\Q1',
      'Medium', 'Architectural', 1
    );
    
    insertEpic.run(
      'EPIC-CM2-INTEGRATION-API',
      'PROJ-1762388020575-3S4ZN',
      '[Integration] | API Gateway Modernization',
      'Modernize API gateway infrastructure for better performance',
      'New', 15, 70, 3,
      '2025-02-01T00:00:00.000Z', '2025-05-15T00:00:00.000Z',
      '01-02-2025', '15-05-2025',
      'Farhan Sarfraz (Farhan.Sarfraz@one.nz)',
      'IT\\BTE Tribe', 'IT\\Sprint\\FY26\\Q1',
      'Low', 'Business', 2
    );
    
    // Insert Features
    const insertFeature = database.prepare(`
      INSERT OR REPLACE INTO features (
        id, epic_id, project_id, title, description, state, effort, business_value, time_criticality,
        start_date_iso, end_date_iso, start_date_nz, end_date_nz,
        assigned_to, area_path, iteration_path, risk, value_area, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    insertFeature.run(
      'FEAT-CM2-STATIC-ANALYSIS', 'EPIC-CM2-PLATFORM-SEC',
      'PROJ-1762388020575-3S4ZN',
      'Static Code Analysis Integration',
      'Integrate SonarQube for static code analysis',
      'Active', 8, 75, 2,
      '2025-01-15T00:00:00.000Z', '2025-02-28T00:00:00.000Z',
      '15-01-2025', '28-02-2025',
      'Ashish Shivhare (Ashish.Shivhare@one.nz)',
      'IT\\BTE Tribe\\Integration and DevOps Tooling',
      'IT\\Sprint\\FY26\\Q1\\Sprint 1',
      'Low', 'Architectural', 1
    );
    
    insertFeature.run(
      'FEAT-CM2-CONTAINER-SEC', 'EPIC-CM2-PLATFORM-SEC',
      'PROJ-1762388020575-3S4ZN',
      'Container Security Scanning',
      'Implement Twistlock for container security scanning',
      'New', 5, 80, 1,
      '2025-03-01T00:00:00.000Z', '2025-03-31T00:00:00.000Z',
      '01-03-2025', '31-03-2025',
      'Adrian Albuquerque (Adrian.Albuquerque@one.nz)',
      'IT\\BTE Tribe\\Integration and DevOps Tooling',
      'IT\\Sprint\\FY26\\Q1\\Sprint 2',
      'Medium', 'Architectural', 2
    );
    
    insertFeature.run(
      'FEAT-CM2-API-RATE-LIMIT', 'EPIC-CM2-INTEGRATION-API',
      'PROJ-1762388020575-3S4ZN',
      'API Rate Limiting',
      'Implement rate limiting for API endpoints',
      'New', 3, 60, 3,
      '2025-02-15T00:00:00.000Z', '2025-03-15T00:00:00.000Z',
      '15-02-2025', '15-03-2025',
      'Sanjeev Lokavarapu (Sanjeev.Lokavarapu@one.nz)',
      'IT\\BTE Tribe\\Integration and DevOps Tooling',
      'IT\\Sprint\\FY26\\Q1\\Sprint 2',
      'Low', 'Business', 1
    );
    
    // Verify
    const epicCount = database.prepare('SELECT COUNT(*) as count FROM epics WHERE project_id = ?')
      .get('PROJ-1762388020575-3S4ZN') as { count: number };
    const featureCount = database.prepare('SELECT COUNT(*) as count FROM features WHERE project_id = ?')
      .get('PROJ-1762388020575-3S4ZN') as { count: number };
    
    console.log(`Inserted ${epicCount.count} epics and ${featureCount.count} features for Cloud Migration 2`);
    
    return { success: true, epicCount: epicCount.count, featureCount: featureCount.count };
  } catch (error: any) {
    console.error('Failed to insert Cloud Migration epics:', error);
    return { success: false, error: error.message };
  }
});

// Test Runner IPC Handler
ipcMain.handle('run-test-suite', async (event, testId: string, command: string, args: string[]) => {
  return new Promise((resolve) => {
    console.log(`Starting test suite: ${testId}`);
    console.log(`Command: ${command} ${args.join(' ')}`);
    
    debugLogger.info('TEST_RUNNER', `Starting test suite: ${testId}`, {
      context: { component: 'TestRunner', function: 'run-test-suite' },
      metadata: { testId, command, args }
    });
    
    const output: string[] = [];
    let hasError = false;
    let errorMessage = '';
    
    // Spawn the test process
    const testProcess = spawn(command, args, {
      cwd: process.cwd(),
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Collect stdout
    testProcess.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      output.push(...lines);
    });
    
    // Collect stderr
    testProcess.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      const lines = text.split('\n').filter(line => line.trim());
      output.push(...lines);
      // Only treat it as error if it's actually an error (not just Jest output)
      if (text.includes('FAIL') || text.includes('Error:') || text.includes('TypeError:')) {
        hasError = true;
        errorMessage += text;
      }
    });
    
    // Handle process completion
    testProcess.on('close', (code: number) => {
      console.log(`Test suite ${testId} completed with code: ${code}`);
      
      if (code === 0) {
        debugLogger.info('TEST_RUNNER', `Test suite ${testId} completed successfully`, {
          context: { component: 'TestRunner', function: 'run-test-suite' },
          metadata: { testId, exitCode: code, outputLines: output.length }
        });
        resolve({
          success: true,
          details: `${testId} completed successfully`,
          output
        });
      } else {
        // More detailed error message based on common test failure patterns
        let detailedError = `Test suite failed with exit code ${code}`;
        if (hasError && errorMessage.trim()) {
          detailedError = errorMessage.trim();
        } else if (output.length > 0) {
          // Look for specific error patterns in output
          const errorLines = output.filter(line => 
            line.includes('FAIL') || 
            line.includes('Error:') || 
            line.includes('TypeError:') ||
            line.includes('was compiled against a different Node.js version')
          );
          if (errorLines.length > 0) {
            detailedError = errorLines.join('\n');
          }
        }
        
        debugLogger.error('TEST_RUNNER', `Test suite ${testId} failed`, {
          context: { component: 'TestRunner', function: 'run-test-suite' },
          metadata: { 
            testId, 
            exitCode: code, 
            outputLines: output.length,
            errorMessage: detailedError,
            hasStderrError: hasError
          }
        });
        
        resolve({
          success: false,
          error: detailedError,
          output
        });
      }
    });
    
    // Handle process errors
    testProcess.on('error', (error: Error) => {
      console.error(`Failed to start test suite ${testId}:`, error);
      resolve({
        success: false,
        error: `Failed to start test: ${error.message}`,
        output
      });
    });
    
    // Optional: Set a timeout for long-running tests (5 minutes)
    const timeout = setTimeout(() => {
      testProcess.kill('SIGKILL');
      resolve({
        success: false,
        error: 'Test execution timed out after 5 minutes',
        output
      });
    }, 5 * 60 * 1000);
    
    // Clear timeout when process completes
    testProcess.on('close', () => {
      clearTimeout(timeout);
    });
  });
});

// Debug Logger IPC Handlers
ipcMain.handle('debug-get-config', () => {
  try {
    const config = debugLogger.getConfig();
    return { success: true, config };
  } catch (error: any) {
    debugLogger.error('DEBUG_IPC', 'Failed to get debug config', {
      context: { component: 'DebugIPC', function: 'debug-get-config' },
      error
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('debug-set-enabled', (event, enabled: boolean) => {
  try {
    debugLogger.setEnabled(enabled);
    debugLogger.info('DEBUG_IPC', `Debug logging ${enabled ? 'enabled' : 'disabled'}`, {
      context: { component: 'DebugIPC', function: 'debug-set-enabled' },
      metadata: { enabled }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to set debug enabled state:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('debug-configure', (event, config: any) => {
  try {
    debugLogger.configure(config);
    return { success: true };
  } catch (error: any) {
    debugLogger.error('DEBUG_IPC', 'Failed to configure debug logger', {
      context: { component: 'DebugIPC', function: 'debug-configure' },
      error,
      metadata: { config }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('debug-get-log-files', async () => {
  try {
    const files = await debugLogger.getLogFiles();
    return { success: true, files };
  } catch (error: any) {
    debugLogger.error('DEBUG_IPC', 'Failed to get log files', {
      context: { component: 'DebugIPC', function: 'debug-get-log-files' },
      error
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('debug-read-log-file', async (event, filePath: string, maxLines?: number) => {
  try {
    const entries = await debugLogger.readLogFile(filePath, maxLines);
    return { success: true, entries };
  } catch (error: any) {
    debugLogger.error('DEBUG_IPC', 'Failed to read log file', {
      context: { component: 'DebugIPC', function: 'debug-read-log-file' },
      error,
      metadata: { filePath, maxLines }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('debug-clear-logs', async () => {
  try {
    await debugLogger.clearLogs();
    return { success: true };
  } catch (error: any) {
    debugLogger.error('DEBUG_IPC', 'Failed to clear logs', {
      context: { component: 'DebugIPC', function: 'debug-clear-logs' },
      error
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('debug-get-current-log-file', () => {
  try {
    const currentFile = debugLogger.getCurrentLogFile();
    return { success: true, currentFile };
  } catch (error: any) {
    debugLogger.error('DEBUG_IPC', 'Failed to get current log file', {
      context: { component: 'DebugIPC', function: 'debug-get-current-log-file' },
      error
    });
    return { success: false, error: error.message };
  }
});

// Audit Logger IPC Handlers
ipcMain.handle('audit:logUserInteraction', async (event, action: string, component?: string, target?: string, additionalData?: Record<string, any>) => {
  if (!auditLogger) {
    return { success: false, error: 'Audit logger not initialized' };
  }
  try {
    auditLogger.logUserInteraction(action, component, target, additionalData);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to log user interaction:', error);
    debugLogger.error('AUDIT_IPC', 'Failed to log user interaction', {
      context: { component: 'AuditIPC', function: 'logUserInteraction' },
      error,
      metadata: { action, component, target }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('audit:logFormChange', async (event, component: string, field: string, oldValue: any, newValue: any, validationResult?: { valid: boolean; errors?: string[] }) => {
  if (!auditLogger) {
    return { success: false, error: 'Audit logger not initialized' };
  }
  try {
    auditLogger.logFormChange(component, field, oldValue, newValue, validationResult);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to log form change:', error);
    debugLogger.error('AUDIT_IPC', 'Failed to log form change', {
      context: { component: 'AuditIPC', function: 'logFormChange' },
      error,
      metadata: { component, field }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('audit:logNavigation', async (event, from: string, to: string, trigger?: 'user' | 'system') => {
  if (!auditLogger) {
    return { success: false, error: 'Audit logger not initialized' };
  }
  try {
    auditLogger.logNavigation(from, to, trigger);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to log navigation:', error);
    debugLogger.error('AUDIT_IPC', 'Failed to log navigation', {
      context: { component: 'AuditIPC', function: 'logNavigation' },
      error,
      metadata: { from, to, trigger }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('audit:logError', async (event, error: any, component?: string, additionalContext?: Record<string, any>) => {
  if (!auditLogger) {
    return { success: false, error: 'Audit logger not initialized' };
  }
  try {
    // Convert serialized error to Error object if needed
    let errorObj = error;
    if (typeof error === 'object' && error.message) {
      errorObj = new Error(error.message);
      if (error.stack) errorObj.stack = error.stack;
      if (error.name) errorObj.name = error.name;
    }
    
    auditLogger.logError(errorObj, component, additionalContext);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to log error:', error);
    debugLogger.error('AUDIT_IPC', 'Failed to log error', {
      context: { component: 'AuditIPC', function: 'logError' },
      error
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('audit:logDataChange', async (event, action: string, entityType: string, entityId: string, oldData?: any, newData?: any) => {
  if (!auditLogger) {
    return { success: false, error: 'Audit logger not initialized' };
  }
  try {
    auditLogger.logDataChange(action, entityType, entityId, oldData, newData);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to log data change:', error);
    debugLogger.error('AUDIT_IPC', 'Failed to log data change', {
      context: { component: 'AuditIPC', function: 'logDataChange' },
      error,
      metadata: { action, entityType, entityId }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('audit:getRecentEvents', async (event, minutes?: number) => {
  if (!auditLogger) {
    return { success: false, error: 'Audit logger not initialized' };
  }
  try {
    const events = auditLogger.getRecentEvents(minutes);
    return { success: true, events };
  } catch (error: any) {
    console.error('Failed to get recent events:', error);
    debugLogger.error('AUDIT_IPC', 'Failed to get recent events', {
      context: { component: 'AuditIPC', function: 'getRecentEvents' },
      error,
      metadata: { minutes }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('audit:getErrorContext', async (event, errorTimestamp: string, contextMinutes?: number) => {
  if (!auditLogger) {
    return { success: false, error: 'Audit logger not initialized' };
  }
  try {
    const context = auditLogger.getErrorContext(errorTimestamp, contextMinutes);
    return { success: true, context };
  } catch (error: any) {
    console.error('Failed to get error context:', error);
    debugLogger.error('AUDIT_IPC', 'Failed to get error context', {
      context: { component: 'AuditIPC', function: 'getErrorContext' },
      error,
      metadata: { errorTimestamp, contextMinutes }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('audit:exportLogs', async (event, outputPath: string, filter?: any) => {
  if (!auditLogger) {
    return { success: false, error: 'Audit logger not initialized' };
  }
  try {
    auditLogger.exportLogs(outputPath, filter);
    return { success: true, exportPath: outputPath };
  } catch (error: any) {
    console.error('Failed to export logs:', error);
    debugLogger.error('AUDIT_IPC', 'Failed to export logs', {
      context: { component: 'AuditIPC', function: 'exportLogs' },
      error,
      metadata: { outputPath }
    });
    return { success: false, error: error.message };
  }
});

// Calendar Module IPC Handlers
ipcMain.handle('calendar:saveMonth', async (event, monthData: any) => {
  if (!database) {
    return { success: false, error: 'Database not initialized' };
  }
  try {
    const result = saveCalendarMonth(database, monthData);
    debugLogger.info('CALENDAR_IPC', 'Calendar month data saved', {
      context: { component: 'CalendarIPC', function: 'saveMonth' },
      metadata: { year: monthData.year, month: monthData.month }
    });
    return { success: true, result };
  } catch (error: any) {
    console.error('Failed to save calendar month:', error);
    debugLogger.error('CALENDAR_IPC', 'Failed to save calendar month', {
      context: { component: 'CalendarIPC', function: 'saveMonth' },
      error,
      metadata: { year: monthData?.year, month: monthData?.month }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('calendar:getMonth', async (event, year: number, month: number) => {
  if (!database) {
    return { success: false, error: 'Database not initialized' };
  }
  try {
    const data = getCalendarMonth(database, year, month);
    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to get calendar month:', error);
    debugLogger.error('CALENDAR_IPC', 'Failed to get calendar month', {
      context: { component: 'CalendarIPC', function: 'getMonth' },
      error,
      metadata: { year, month }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('calendar:importHolidays', async (event, holidays: any[]) => {
  if (!database) {
    return { success: false, error: 'Database not initialized' };
  }
  try {
    const result = importPublicHolidays(database, holidays);
    debugLogger.info('CALENDAR_IPC', 'Public holidays imported', {
      context: { component: 'CalendarIPC', function: 'importHolidays' },
      metadata: { totalHolidays: holidays.length, imported: result.imported, skipped: result.skipped }
    });
    return { success: true, result };
  } catch (error: any) {
    console.error('Failed to import holidays:', error);
    debugLogger.error('CALENDAR_IPC', 'Failed to import holidays', {
      context: { component: 'CalendarIPC', function: 'importHolidays' },
      error,
      metadata: { totalHolidays: holidays?.length }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('calendar:getHolidays', async (event, year?: number, month?: number) => {
  if (!database) {
    return { success: false, error: 'Database not initialized' };
  }
  try {
    const holidays = getPublicHolidays(database, year, month);
    return { success: true, holidays };
  } catch (error: any) {
    console.error('Failed to get holidays:', error);
    debugLogger.error('CALENDAR_IPC', 'Failed to get holidays', {
      context: { component: 'CalendarIPC', function: 'getHolidays' },
      error,
      metadata: { year, month }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('calendar:deleteHoliday', async (event, id: number) => {
  if (!database) {
    return { success: false, error: 'Database not initialized' };
  }
  try {
    const result = deletePublicHoliday(database, id);
    debugLogger.info('CALENDAR_IPC', 'Public holiday deleted', {
      context: { component: 'CalendarIPC', function: 'deleteHoliday' },
      metadata: { id }
    });
    return { success: true, result };
  } catch (error: any) {
    console.error('Failed to delete holiday:', error);
    debugLogger.error('CALENDAR_IPC', 'Failed to delete holiday', {
      context: { component: 'CalendarIPC', function: 'deleteHoliday' },
      error,
      metadata: { id }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('audit:getStats', async (event) => {
  if (!auditLogger) {
    return { success: false, error: 'Audit logger not initialized' };
  }
  try {
    const stats = auditLogger.getStats();
    return { success: true, stats };
  } catch (error: any) {
    console.error('Failed to get audit stats:', error);
    debugLogger.error('AUDIT_IPC', 'Failed to get audit stats', {
      context: { component: 'AuditIPC', function: 'getStats' },
      error
    });
    return { success: false, error: error.message };
  }
});

// Backup/Restore IPC Handlers
ipcMain.handle('backup:create', async (event, description?: string, tags?: string[], includeFullAuditHistory?: boolean) => {
  if (!backupService) {
    return { success: false, error: 'Backup service not initialized' };
  }
  try {
    const result = await backupService.createBackup(description, tags, includeFullAuditHistory);
    if (result.success) {
      debugLogger.info('BACKUP_IPC', 'Backup created successfully', {
        context: { component: 'BackupIPC', function: 'createBackup' },
        metadata: { backupPath: result.backupPath, description, tags }
      });
    }
    return result;
  } catch (error: any) {
    console.error('Failed to create backup:', error);
    debugLogger.error('BACKUP_IPC', 'Failed to create backup', {
      context: { component: 'BackupIPC', function: 'createBackup' },
      error,
      metadata: { description, tags }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:restore', async (event, backupPath: string, options: any) => {
  if (!backupService) {
    return { success: false, error: 'Backup service not initialized' };
  }
  try {
    const result = await backupService.restoreFromBackup(backupPath, options);
    debugLogger.info('BACKUP_IPC', 'Restore completed successfully', {
      context: { component: 'BackupIPC', function: 'restoreFromBackup' },
      metadata: { backupPath, options, result }
    });
    return { success: true, result };
  } catch (error: any) {
    console.error('Failed to restore backup:', error);
    debugLogger.error('BACKUP_IPC', 'Failed to restore backup', {
      context: { component: 'BackupIPC', function: 'restoreFromBackup' },
      error,
      metadata: { backupPath, options }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:list', async (event) => {
  if (!backupService) {
    return { success: false, error: 'Backup service not initialized' };
  }
  try {
    const backups = await backupService.listBackups();
    return { success: true, backups };
  } catch (error: any) {
    console.error('Failed to list backups:', error);
    debugLogger.error('BACKUP_IPC', 'Failed to list backups', {
      context: { component: 'BackupIPC', function: 'listBackups' },
      error
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:delete', async (event, backupPath: string) => {
  if (!backupService) {
    return { success: false, error: 'Backup service not initialized' };
  }
  try {
    const result = await backupService.deleteBackup(backupPath);
    if (result.success) {
      debugLogger.info('BACKUP_IPC', 'Backup deleted successfully', {
        context: { component: 'BackupIPC', function: 'deleteBackup' },
        metadata: { backupPath }
      });
    }
    return result;
  } catch (error: any) {
    console.error('Failed to delete backup:', error);
    debugLogger.error('BACKUP_IPC', 'Failed to delete backup', {
      context: { component: 'BackupIPC', function: 'deleteBackup' },
      error,
      metadata: { backupPath }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:export', async (event, backupPath: string) => {
  if (!backupService) {
    return { success: false, error: 'Backup service not initialized' };
  }
  try {
    const result = await backupService.exportBackup(backupPath);
    if (result.success) {
      debugLogger.info('BACKUP_IPC', 'Backup exported successfully', {
        context: { component: 'BackupIPC', function: 'exportBackup' },
        metadata: { backupPath, exportPath: result.exportPath }
      });
    }
    return result;
  } catch (error: any) {
    console.error('Failed to export backup:', error);
    debugLogger.error('BACKUP_IPC', 'Failed to export backup', {
      context: { component: 'BackupIPC', function: 'exportBackup' },
      error,
      metadata: { backupPath }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:import', async (event) => {
  if (!backupService) {
    return { success: false, error: 'Backup service not initialized' };
  }
  try {
    const result = await backupService.importBackup();
    if (result.success) {
      debugLogger.info('BACKUP_IPC', 'Backup imported successfully', {
        context: { component: 'BackupIPC', function: 'importBackup' },
        metadata: { backupPath: result.backupPath }
      });
    }
    return result;
  } catch (error: any) {
    console.error('Failed to import backup:', error);
    debugLogger.error('BACKUP_IPC', 'Failed to import backup', {
      context: { component: 'BackupIPC', function: 'importBackup' },
      error
    });
    return { success: false, error: error.message };
  }
});

// Clear sample data IPC handlers
ipcMain.handle('test:clearModuleData', async (event, moduleName: string) => {
  if (!database) {
    return { success: false, error: 'Database not initialized' };
  }
  
  try {
    let deletedRecords = 0;
    
    withTransaction(database, () => {
      switch (moduleName) {
        case 'projects':
          // Clear projects and related data (cascades to epics, features, tasks)
          const projectResult = database!.prepare('DELETE FROM projects').run();
          deletedRecords = projectResult.changes;
          break;
          
        case 'calendar':
          // Clear calendar data
          database!.prepare('DELETE FROM public_holidays').run();
          database!.prepare('DELETE FROM calendar_months').run();
          const yearResult = database!.prepare('DELETE FROM calendar_years').run();
          deletedRecords = yearResult.changes;
          break;
          
        case 'ado':
          // Clear ADO integration data
          database!.prepare('DELETE FROM ado_webhook_events').run();
          database!.prepare('DELETE FROM dependencies_ado').run();
          database!.prepare('DELETE FROM ado_tags').run();
          const adoResult = database!.prepare('DELETE FROM ado_config').run();
          deletedRecords = adoResult.changes;
          break;
          
        case 'financial':
          // Clear financial coordinator data
          database!.prepare('DELETE FROM variance_alerts').run();
          database!.prepare('DELETE FROM variance_thresholds').run();
          database!.prepare('DELETE FROM finance_ledger_entries').run();
          database!.prepare('DELETE FROM ado_feature_mapping').run();
          database!.prepare('DELETE FROM project_financial_detail').run();
          database!.prepare('DELETE FROM financial_workstreams').run();
          database!.prepare('DELETE FROM feature_allocations').run();
          database!.prepare('DELETE FROM resource_commitments').run();
          const resourceResult = database!.prepare('DELETE FROM financial_resources').run();
          database!.prepare('DELETE FROM raw_labour_rates').run();
          database!.prepare('DELETE FROM raw_actuals').run();
          database!.prepare('DELETE FROM raw_timesheets').run();
          deletedRecords = resourceResult.changes;
          break;
          
        case 'governance':
          // Clear governance data (but keep gate templates)
          database!.prepare('DELETE FROM benefit_realization_tracking').run();
          database!.prepare('DELETE FROM project_policy_compliance').run();
          database!.prepare('DELETE FROM project_risks').run();
          database!.prepare('DELETE FROM project_stakeholders').run();
          database!.prepare('DELETE FROM gate_review_decisions').run();
          database!.prepare('DELETE FROM gate_criteria_assessment').run();
          database!.prepare('DELETE FROM gate_review_sessions').run();
          const gateResult = database!.prepare('DELETE FROM project_gates').run();
          deletedRecords = gateResult.changes;
          break;
          
        case 'dependencies':
          // Clear dependencies
          const depResult = database!.prepare('DELETE FROM dependencies').run();
          deletedRecords = depResult.changes;
          break;
          
        case 'audit':
          // Clear audit events (careful with this one)
          const auditResult = database!.prepare('DELETE FROM audit_events').run();
          deletedRecords = auditResult.changes;
          break;
          
        case 'all':
          // Clear ALL data from all modules
          database!.prepare('DELETE FROM variance_alerts').run();
          database!.prepare('DELETE FROM finance_ledger_entries').run();
          database!.prepare('DELETE FROM ado_feature_mapping').run();
          database!.prepare('DELETE FROM feature_allocations').run();
          database!.prepare('DELETE FROM resource_commitments').run();
          database!.prepare('DELETE FROM financial_resources').run();
          database!.prepare('DELETE FROM raw_labour_rates').run();
          database!.prepare('DELETE FROM raw_actuals').run();
          database!.prepare('DELETE FROM raw_timesheets').run();
          database!.prepare('DELETE FROM project_financial_detail').run();
          database!.prepare('DELETE FROM financial_workstreams').run();
          database!.prepare('DELETE FROM variance_thresholds').run();
          database!.prepare('DELETE FROM benefit_realization_tracking').run();
          database!.prepare('DELETE FROM project_policy_compliance').run();
          database!.prepare('DELETE FROM project_risks').run();
          database!.prepare('DELETE FROM project_stakeholders').run();
          database!.prepare('DELETE FROM gate_review_decisions').run();
          database!.prepare('DELETE FROM gate_criteria_assessment').run();
          database!.prepare('DELETE FROM gate_review_sessions').run();
          database!.prepare('DELETE FROM project_gates').run();
          database!.prepare('DELETE FROM ado_webhook_events').run();
          database!.prepare('DELETE FROM dependencies_ado').run();
          database!.prepare('DELETE FROM ado_tags').run();
          database!.prepare('DELETE FROM ado_config').run();
          database!.prepare('DELETE FROM dependencies').run();
          database!.prepare('DELETE FROM public_holidays').run();
          database!.prepare('DELETE FROM calendar_months').run();
          database!.prepare('DELETE FROM calendar_years').run();
          database!.prepare('DELETE FROM audit_events').run();
          database!.prepare('DELETE FROM tasks').run();
          const allResult = database!.prepare('DELETE FROM projects').run();
          deletedRecords = allResult.changes;
          break;
          
        default:
          return { success: false, error: `Unknown module: ${moduleName}` };
      }
    });
    
    console.log(`Cleared ${deletedRecords} records from ${moduleName} module`);
    debugLogger.info('TEST_DATA', `Cleared sample data from ${moduleName} module`, {
      context: { component: 'TestData', function: 'clearModuleData' },
      metadata: { moduleName, deletedRecords }
    });
    
    return { success: true, deletedRecords, module: moduleName };
  } catch (error: any) {
    console.error(`Failed to clear ${moduleName} data:`, error);
    debugLogger.error('TEST_DATA', `Failed to clear ${moduleName} data`, {
      context: { component: 'TestData', function: 'clearModuleData' },
      error,
      metadata: { moduleName }
    });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test:getDataStats', async (event) => {
  if (!database) {
    return { success: false, error: 'Database not initialized' };
  }
  
  try {
    const stats = {
      projects: database.prepare('SELECT COUNT(*) as count FROM projects').get() as any,
      epics: database.prepare('SELECT COUNT(*) as count FROM epics').get() as any,
      features: database.prepare('SELECT COUNT(*) as count FROM features').get() as any,
      tasks: database.prepare('SELECT COUNT(*) as count FROM tasks').get() as any,
      dependencies: database.prepare('SELECT COUNT(*) as count FROM dependencies').get() as any,
      calendar_years: database.prepare('SELECT COUNT(*) as count FROM calendar_years').get() as any,
      public_holidays: database.prepare('SELECT COUNT(*) as count FROM public_holidays').get() as any,
      ado_config: database.prepare('SELECT COUNT(*) as count FROM ado_config').get() as any,
      ado_tags: database.prepare('SELECT COUNT(*) as count FROM ado_tags').get() as any,
      financial_resources: database.prepare('SELECT COUNT(*) as count FROM financial_resources').get() as any,
      feature_allocations: database.prepare('SELECT COUNT(*) as count FROM feature_allocations').get() as any,
      project_gates: database.prepare('SELECT COUNT(*) as count FROM project_gates').get() as any,
      audit_events: database.prepare('SELECT COUNT(*) as count FROM audit_events').get() as any
    };
    
    return { success: true, stats };
  } catch (error: any) {
    console.error('Failed to get data stats:', error);
    return { success: false, error: error.message };
  }
});

// Add test data in development
function addTestData() {
  if (!database) return;
  
  try {
    // Check if we already have data
    const existingProjects = database.prepare('SELECT COUNT(*) as count FROM projects').get() as any;
    if (existingProjects.count > 0) {
      console.log('Test data already exists, skipping...');
      return;
    }
    
    console.log('Adding test data...');
    
    // Add a test project
    const testMutation = {
      opId: 'test-001',
      user: 'developer',
      ts: new Date().toISOString(),
      type: 'project.create',
      payload: {
        id: 'PRJ-TEST-001',
        title: 'Sample Project',
        description: 'A test project to verify the system works',
        start_date: '01-11-2024',
        end_date: '30-11-2024',
        status: 'planned',
        budget_nzd: 25000,
        financial_treatment: 'CAPEX'
      }
    };
    
    withTransaction(database, () => {
      applyMutation(database!, testMutation);
    });
    
    console.log('Test data added successfully');
  } catch (error) {
    console.error('Failed to add test data:', error);
  }
}

console.log('Roadmap Tool main process started');
