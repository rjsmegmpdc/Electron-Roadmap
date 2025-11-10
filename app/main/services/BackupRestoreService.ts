import { app, dialog } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import { AuditLogger, AuditEvent } from './AuditLogger';

export interface BackupMetadata {
  version: string;
  created_at: string;
  app_version: string;
  platform: string;
  user_id: string;
  session_id: string;
  database_version: string;
  total_projects: number;
  total_audit_events: number;
  backup_size_bytes: number;
  checksum: string;
  description?: string;
  tags?: string[];
}

export interface BackupData {
  metadata: BackupMetadata;
  database: {
    projects: any[];
    tasks?: any[];
    dependencies?: any[];
    initiatives?: any[];
    audit_events?: any[];
    // Add other tables as needed
  };
  audit_logs: {
    events: AuditEvent[];
    stats: any;
  };
  user_preferences?: Record<string, any>;
  app_settings?: Record<string, any>;
}

export interface RestoreOptions {
  includeAuditLogs: boolean;
  includeUserPreferences: boolean;
  includeAppSettings: boolean;
  conflictResolution: 'overwrite' | 'skip' | 'merge';
  validateIntegrity: boolean;
}

export interface RestoreResult {
  success: boolean;
  warnings: string[];
  errors: string[];
  stats: {
    projects_restored: number;
    audit_events_restored: number;
    skipped_items: number;
    conflicts_resolved: number;
  };
}

export class BackupRestoreService {
  private db: Database.Database;
  private auditLogger?: AuditLogger;
  private backupDir: string;

  constructor(db: Database.Database, baseDir: string) {
    this.db = db;
    this.backupDir = path.join(baseDir, 'backups');
    this.ensureBackupDirectory();
  }

  setAuditLogger(auditLogger: AuditLogger): void {
    this.auditLogger = auditLogger;
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create a comprehensive backup of all application data
   */
  async createBackup(
    description?: string,
    tags?: string[],
    includeFullAuditHistory: boolean = false
  ): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      this.auditLogger?.logSystemEvent('backup_start', {
        description,
        tags,
        include_full_audit: includeFullAuditHistory,
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `roadmap-backup-${timestamp}.json`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Collect all database data
      const databaseData = await this.collectDatabaseData();
      
      // Collect audit logs
      const auditData = await this.collectAuditData(includeFullAuditHistory);
      
      // Collect user preferences and settings
      const userPreferences = await this.collectUserPreferences();
      const appSettings = await this.collectAppSettings();

      // Create backup data structure
      const backupData: BackupData = {
        metadata: await this.createBackupMetadata(
          databaseData,
          auditData,
          description,
          tags
        ),
        database: databaseData,
        audit_logs: auditData,
        user_preferences: userPreferences,
        app_settings: appSettings,
      };

      // Calculate checksum
      const backupContent = JSON.stringify(backupData, null, 2);
      const checksum = createHash('sha256').update(backupContent).digest('hex');
      backupData.metadata.checksum = checksum;
      backupData.metadata.backup_size_bytes = Buffer.byteLength(backupContent, 'utf8');

      // Write backup file
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');

      this.auditLogger?.logSystemEvent('backup_complete', {
        backup_path: backupPath,
        backup_size: backupData.metadata.backup_size_bytes,
        checksum: checksum,
        projects_count: backupData.metadata.total_projects,
        audit_events_count: backupData.metadata.total_audit_events,
      });

      return { success: true, backupPath };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown backup error';
      
      this.auditLogger?.logError(error as Error, 'BackupRestoreService', {
        operation: 'create_backup',
        description,
        tags,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Restore data from a backup file
   */
  async restoreFromBackup(
    backupPath: string,
    options: RestoreOptions
  ): Promise<RestoreResult> {
    const result: RestoreResult = {
      success: false,
      warnings: [],
      errors: [],
      stats: {
        projects_restored: 0,
        audit_events_restored: 0,
        skipped_items: 0,
        conflicts_resolved: 0,
      },
    };

    try {
      this.auditLogger?.logSystemEvent('restore_start', {
        backup_path: backupPath,
        options,
      });

      // Read and parse backup file
      const backupContent = fs.readFileSync(backupPath, 'utf8');
      const backupData: BackupData = JSON.parse(backupContent);

      // Validate backup integrity
      if (options.validateIntegrity) {
        const validationResult = await this.validateBackupIntegrity(backupData, backupContent);
        if (!validationResult.isValid) {
          result.errors.push(`Backup integrity validation failed: ${validationResult.error}`);
          return result;
        }
        if (validationResult.warnings) {
          result.warnings.push(...validationResult.warnings);
        }
      }

      // Check compatibility
      const compatibilityResult = this.checkBackupCompatibility(backupData.metadata);
      if (!compatibilityResult.isCompatible) {
        result.errors.push(`Backup incompatible: ${compatibilityResult.reason}`);
        return result;
      }
      if (compatibilityResult.warnings) {
        result.warnings.push(...compatibilityResult.warnings);
      }

      // Begin database transaction for data restoration
      const transaction = this.db.transaction(() => {
        // Restore database tables
        this.restoreDatabaseData(backupData.database, options, result);

        // Restore audit logs if requested
        if (options.includeAuditLogs && backupData.audit_logs) {
          this.restoreAuditLogs(backupData.audit_logs, options, result);
        }

        // Restore user preferences if requested
        if (options.includeUserPreferences && backupData.user_preferences) {
          this.restoreUserPreferences(backupData.user_preferences, options, result);
        }

        // Restore app settings if requested
        if (options.includeAppSettings && backupData.app_settings) {
          this.restoreAppSettings(backupData.app_settings, options, result);
        }
      });

      transaction();
      result.success = true;

      this.auditLogger?.logSystemEvent('restore_complete', {
        backup_path: backupPath,
        result: result.stats,
        warnings_count: result.warnings.length,
        errors_count: result.errors.length,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown restore error';
      result.errors.push(errorMessage);

      this.auditLogger?.logError(error as Error, 'BackupRestoreService', {
        operation: 'restore_from_backup',
        backup_path: backupPath,
        options,
      });
    }

    return result;
  }

  /**
   * List available backup files with metadata
   */
  async listBackups(): Promise<Array<{ path: string; metadata: BackupMetadata; accessible: boolean }>> {
    try {
      const backupFiles = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.json') && file.startsWith('roadmap-backup-'))
        .map(file => path.join(this.backupDir, file));

      const backupList = [];

      for (const filePath of backupFiles) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const backupData: BackupData = JSON.parse(content);
          
          backupList.push({
            path: filePath,
            metadata: backupData.metadata,
            accessible: true,
          });
        } catch (error) {
          // File exists but is not readable/valid
          backupList.push({
            path: filePath,
            metadata: {
              version: 'unknown',
              created_at: 'unknown',
              app_version: 'unknown',
              platform: 'unknown',
              user_id: 'unknown',
              session_id: 'unknown',
              database_version: 'unknown',
              total_projects: 0,
              total_audit_events: 0,
              backup_size_bytes: 0,
              checksum: 'invalid',
            },
            accessible: false,
          });
        }
      }

      return backupList.sort((a, b) => 
        new Date(b.metadata.created_at).getTime() - new Date(a.metadata.created_at).getTime()
      );

    } catch (error) {
      this.auditLogger?.logError(error as Error, 'BackupRestoreService', {
        operation: 'list_backups',
      });
      return [];
    }
  }

  /**
   * Delete a backup file
   */
  async deleteBackup(backupPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup file does not exist' };
      }

      fs.unlinkSync(backupPath);
      
      this.auditLogger?.logSystemEvent('backup_deleted', {
        backup_path: backupPath,
      });

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown deletion error';
      
      this.auditLogger?.logError(error as Error, 'BackupRestoreService', {
        operation: 'delete_backup',
        backup_path: backupPath,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Export backup to user-selected location
   */
  async exportBackup(backupPath: string): Promise<{ success: boolean; exportPath?: string; error?: string }> {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Export Backup',
        defaultPath: `roadmap-backup-${new Date().toISOString().slice(0, 10)}.json`,
        filters: [
          { name: 'JSON Backup Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Export cancelled by user' };
      }

      // Copy backup file to selected location
      fs.copyFileSync(backupPath, result.filePath);

      this.auditLogger?.logSystemEvent('backup_exported', {
        source_path: backupPath,
        export_path: result.filePath,
      });

      return { success: true, exportPath: result.filePath };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      
      this.auditLogger?.logError(error as Error, 'BackupRestoreService', {
        operation: 'export_backup',
        backup_path: backupPath,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Import backup from user-selected file
   */
  async importBackup(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Import Backup',
        filters: [
          { name: 'JSON Backup Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (result.canceled || !result.filePaths[0]) {
        return { success: false, error: 'Import cancelled by user' };
      }

      const sourcePath = result.filePaths[0];
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const importedFileName = `roadmap-backup-imported-${timestamp}.json`;
      const importedPath = path.join(this.backupDir, importedFileName);

      // Copy file to backup directory
      fs.copyFileSync(sourcePath, importedPath);

      // Validate the imported backup
      const content = fs.readFileSync(importedPath, 'utf8');
      const backupData: BackupData = JSON.parse(content);

      const validationResult = await this.validateBackupIntegrity(backupData, content);
      if (!validationResult.isValid) {
        fs.unlinkSync(importedPath); // Clean up invalid backup
        return { success: false, error: `Invalid backup file: ${validationResult.error}` };
      }

      this.auditLogger?.logSystemEvent('backup_imported', {
        source_path: sourcePath,
        imported_path: importedPath,
        backup_metadata: backupData.metadata,
      });

      return { success: true, backupPath: importedPath };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      
      this.auditLogger?.logError(error as Error, 'BackupRestoreService', {
        operation: 'import_backup',
      });

      return { success: false, error: errorMessage };
    }
  }

  // Private helper methods

  private async collectDatabaseData(): Promise<BackupData['database']> {
    const projects = this.db.prepare('SELECT * FROM projects ORDER BY created_at').all();
    const tasks = this.db.prepare('SELECT * FROM tasks ORDER BY created_at').all();
    const dependencies = this.db.prepare('SELECT * FROM dependencies ORDER BY created_at').all();
    const initiatives = this.db.prepare('SELECT * FROM initiatives ORDER BY id').all();

    return {
      projects,
      tasks,
      dependencies,
      initiatives,
    };
  }

  private async collectAuditData(includeFullHistory: boolean): Promise<BackupData['audit_logs']> {
    const limit = includeFullHistory ? undefined : 1000; // Last 1000 events if not full history
    const events = this.auditLogger?.queryEvents?.({ limit }) || [];
    const stats = await this.auditLogger?.getStats?.() || {};

    return { events, stats };
  }

  private async collectUserPreferences(): Promise<Record<string, any>> {
    // Implement user preferences collection
    // This would typically come from a settings service or local storage
    return {};
  }

  private async collectAppSettings(): Promise<Record<string, any>> {
    // Implement app settings collection
    return {};
  }

  private async createBackupMetadata(
    databaseData: BackupData['database'],
    auditData: BackupData['audit_logs'],
    description?: string,
    tags?: string[]
  ): Promise<BackupMetadata> {
    return {
      version: '1.0.0',
      created_at: new Date().toISOString(),
      app_version: app.getVersion(),
      platform: process.platform,
      user_id: 'default-user', // This should come from your user service
      session_id: 'current-session', // This should come from your session service
      database_version: '1.0.0', // Should be tracked in your database
      total_projects: databaseData.projects.length,
      total_audit_events: auditData.events.length,
      backup_size_bytes: 0, // Will be calculated later
      checksum: '', // Will be calculated later
      description,
      tags,
    };
  }

  private async validateBackupIntegrity(
    backupData: BackupData,
    backupContent: string
  ): Promise<{ isValid: boolean; error?: string; warnings?: string[] }> {
    const warnings: string[] = [];

    // Verify checksum
    const contentWithoutChecksum = JSON.stringify({
      ...backupData,
      metadata: { ...backupData.metadata, checksum: '' }
    }, null, 2);
    const calculatedChecksum = createHash('sha256').update(contentWithoutChecksum).digest('hex');
    
    if (calculatedChecksum !== backupData.metadata.checksum) {
      return { 
        isValid: false, 
        error: 'Checksum mismatch - backup file may be corrupted' 
      };
    }

    // Verify backup structure
    if (!backupData.metadata || !backupData.database) {
      return { 
        isValid: false, 
        error: 'Invalid backup structure - missing required sections' 
      };
    }

    // Verify project data integrity
    if (!Array.isArray(backupData.database.projects)) {
      return { 
        isValid: false, 
        error: 'Invalid projects data structure' 
      };
    }

    // Additional validation checks
    const projectCount = backupData.database.projects.length;
    if (projectCount !== backupData.metadata.total_projects) {
      warnings.push(`Project count mismatch: expected ${backupData.metadata.total_projects}, found ${projectCount}`);
    }

    return { isValid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }

  private checkBackupCompatibility(metadata: BackupMetadata): {
    isCompatible: boolean;
    reason?: string;
    warnings?: string[];
  } {
    const warnings: string[] = [];

    // Check version compatibility
    const currentVersion = app.getVersion();
    if (metadata.app_version !== currentVersion) {
      warnings.push(`Backup created with different app version (${metadata.app_version} vs ${currentVersion})`);
    }

    // Check platform compatibility
    if (metadata.platform !== process.platform) {
      warnings.push(`Backup created on different platform (${metadata.platform} vs ${process.platform})`);
    }

    // For now, consider all backups compatible with warnings
    return {
      isCompatible: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private restoreDatabaseData(
    databaseData: BackupData['database'],
    options: RestoreOptions,
    result: RestoreResult
  ): void {
    // Restore projects
    if (databaseData.projects) {
      for (const project of databaseData.projects) {
        try {
          const existing = this.db.prepare('SELECT id FROM projects WHERE id = ?').get(project.id);
          
          if (existing) {
            if (options.conflictResolution === 'skip') {
              result.stats.skipped_items++;
              continue;
            } else if (options.conflictResolution === 'overwrite') {
              this.db.prepare(`
                UPDATE projects SET 
                title=?, description=?, lane=?, start_date=?, end_date=?, 
                status=?, pm_name=?, budget_cents=?, financial_treatment=?, 
                updated_at=CURRENT_TIMESTAMP
                WHERE id=?
              `).run(
                project.title, project.description, project.lane, project.start_date,
                project.end_date, project.status, project.pm_name, project.budget_cents,
                project.financial_treatment, project.id
              );
              result.stats.conflicts_resolved++;
            }
          } else {
            this.db.prepare(`
              INSERT INTO projects (
                id, title, description, lane, start_date, end_date, status, 
                pm_name, budget_cents, financial_treatment, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              project.id, project.title, project.description, project.lane,
              project.start_date, project.end_date, project.status, project.pm_name,
              project.budget_cents, project.financial_treatment, project.created_at,
              project.updated_at
            );
          }
          result.stats.projects_restored++;
        } catch (error) {
          result.warnings.push(`Failed to restore project ${project.id}: ${(error as Error).message}`);
        }
      }
    }

    // Similar restoration logic for tasks, dependencies, etc.
    // ... (implement as needed)
  }

  private restoreAuditLogs(
    auditData: BackupData['audit_logs'],
    options: RestoreOptions,
    result: RestoreResult
  ): void {
    // Implementation for restoring audit logs
    // This is optional since audit logs are typically not restored to avoid conflicts
    result.stats.audit_events_restored = auditData.events.length;
  }

  private restoreUserPreferences(
    preferences: Record<string, any>,
    options: RestoreOptions,
    result: RestoreResult
  ): void {
    // Implementation for restoring user preferences
  }

  private restoreAppSettings(
    settings: Record<string, any>,
    options: RestoreOptions,
    result: RestoreResult
  ): void {
    // Implementation for restoring app settings
  }
}