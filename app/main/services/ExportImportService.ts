import type { DB } from '../db';
import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import AdmZip from 'adm-zip';
import { BrowserWindow } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';

interface ExportOptions {
  areas: string[];
  outputPath: string;
  epicFeatureConfigOptions?: {
    includeDefaults?: boolean;
    includeTeamMembers?: boolean;
    includePaths?: boolean;
  };
  event?: IpcMainInvokeEvent;
}

interface ImportOptions {
  areas: string[];
  inputPath: string;
  event?: any; // IpcMainInvokeEvent for localStorage access
}

interface ImportResult {
  area: string;
  success: boolean;
  message: string;
  rowsProcessed?: number;
}

export class ExportImportService {
  private db: DB;
  private loggedColumns: boolean = false;

  constructor(db: DB) {
    this.db = db;
  }

  /**
   * Export selected data areas to CSV files in a ZIP archive
   */
  async exportData(options: ExportOptions): Promise<{ success: boolean; filesCreated?: number; error?: string }> {
    try {
      const zip = new AdmZip();
      let filesCreated = 0;

      for (const area of options.areas) {
        const csvData = await this.exportArea(area, options.event, options.epicFeatureConfigOptions);
        if (csvData) {
          // Check if this is a multi-file export (work_items, epic_feature_config)
          try {
            const parsed = JSON.parse(csvData);
            if (parsed.__multiFile) {
              // Handle work_items multi-file
              if (parsed.files.epics) {
                zip.addFile('Epics.csv', Buffer.from(parsed.files.epics, 'utf8'));
                filesCreated++;
              }
              if (parsed.files.features) {
                zip.addFile('Features.csv', Buffer.from(parsed.files.features, 'utf8'));
                filesCreated++;
              }
              if (parsed.files.dependencies) {
                zip.addFile('Dependencies.csv', Buffer.from(parsed.files.dependencies, 'utf8'));
                filesCreated++;
              }
              
              // Handle epic_feature_config multi-file
              if (parsed.files.defaults) {
                zip.addFile('Epic-Feature-Defaults.csv', Buffer.from(parsed.files.defaults, 'utf8'));
                filesCreated++;
              }
              if (parsed.files.teamMembers) {
                zip.addFile('Epic-Feature-Team-Members.csv', Buffer.from(parsed.files.teamMembers, 'utf8'));
                filesCreated++;
              }
              if (parsed.files.paths) {
                zip.addFile('Epic-Feature-Paths.csv', Buffer.from(parsed.files.paths, 'utf8'));
                filesCreated++;
              }
              
              continue;
            }
          } catch {
            // Not JSON, treat as regular CSV
          }
          
          // Use descriptive filename based on data area
          const filename = this.getFilenameForArea(area);
          zip.addFile(filename, Buffer.from(csvData, 'utf8'));
          filesCreated++;
        }
      }

      // Write ZIP file
      zip.writeZip(options.outputPath);

      return { success: true, filesCreated };
    } catch (error: any) {
      console.error('Export failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export a single data area to CSV format
   */
  private async exportArea(area: string, event?: IpcMainInvokeEvent, epicFeatureConfigOptions?: { includeDefaults?: boolean; includeTeamMembers?: boolean; includePaths?: boolean }): Promise<string | null> {
    try {
      let query: string;
      let data: any[];

      switch (area) {
        case 'projects':
          query = `SELECT 
            id, title, description, lane, 
            start_date_nz as start_date, end_date_nz as end_date,
            status, pm_name, 
            CAST(budget_cents AS REAL) / 100 as budget_nzd,
            financial_treatment, row,
            created_at, updated_at
          FROM projects ORDER BY created_at`;
          data = this.db.prepare(query).all();
          break;

        case 'tasks':
          query = `SELECT 
            id, project_id, title,
            start_date_nz as start_date, end_date_nz as end_date,
            effort_hours, status, assigned_resources,
            created_at, updated_at
          FROM tasks ORDER BY project_id, created_at`;
          data = this.db.prepare(query).all();
          break;

        case 'work_items':
          // Export all three related tables in a single ZIP with separate CSVs
          return await this.exportWorkItems();

        case 'epics':
          query = `SELECT 
            id, project_id, title, description, state,
            effort, business_value, time_criticality,
            start_date_nz as start_date, end_date_nz as end_date,
            assigned_to, area_path, iteration_path,
            risk, value_area, parent_feature, sort_order,
            created_at, updated_at
          FROM epics ORDER BY project_id, sort_order`;
          data = this.db.prepare(query).all();
          break;

        case 'features':
          query = `SELECT 
            id, epic_id, project_id, title, description, state,
            effort, business_value, time_criticality,
            start_date_nz as start_date, end_date_nz as end_date,
            assigned_to, area_path, iteration_path,
            risk, value_area, sort_order,
            created_at, updated_at
          FROM features ORDER BY epic_id, sort_order`;
          data = this.db.prepare(query).all();
          break;

        case 'dependencies':
          query = `SELECT 
            id, from_type, from_id, to_type, to_id,
            kind, lag_days, note, created_at
          FROM dependencies ORDER BY created_at`;
          data = this.db.prepare(query).all();
          break;

        case 'calendar_months':
          query = `SELECT 
            year, month, days, working_days, weekend_days,
            public_holidays, work_hours, notes,
            created_at, updated_at
          FROM calendar_months ORDER BY year, month`;
          data = this.db.prepare(query).all();
          break;

        case 'public_holidays':
          query = `SELECT 
            name, start_date, end_date,
            year, month, day,
            end_year, end_month, end_day,
            description, is_recurring, source,
            created_at, updated_at
          FROM public_holidays ORDER BY year, month, day`;
          data = this.db.prepare(query).all();
          // Convert boolean to string for CSV
          data = data.map(row => ({
            ...row,
            is_recurring: row.is_recurring ? 'true' : 'false'
          }));
          break;

        case 'app_settings':
          query = `SELECT key, value, updated_at FROM app_settings ORDER BY key`;
          data = this.db.prepare(query).all();
          break;

        case 'ado_config':
          query = `SELECT 
            org_url, project_name, auth_mode,
            pat_token_expiry_date, client_id, tenant_id,
            webhook_url, max_retry_attempts, base_delay_ms,
            is_enabled, connection_status, last_sync_at,
            created_at, updated_at
          FROM ado_config ORDER BY created_at`;
          data = this.db.prepare(query).all();
          // Convert boolean and omit encrypted token
          data = data.map(row => ({
            ...row,
            is_enabled: row.is_enabled ? 'true' : 'false',
            pat_token: '[ENCRYPTED - NOT EXPORTED]'
          }));
          break;

        case 'ado_tags':
          query = `SELECT 
            category, tag_name, tag_value,
            is_active, sort_order,
            created_at, updated_at
          FROM ado_tags ORDER BY category, sort_order`;
          data = this.db.prepare(query).all();
          // Convert boolean
          data = data.map(row => ({
            ...row,
            is_active: row.is_active ? 'true' : 'false'
          }));
          break;

        case 'epic_feature_config':
          // Export from localStorage (browser-side data)
          return await this.exportEpicFeatureConfig(event, epicFeatureConfigOptions);

        case 'financial_resources':
          query = `SELECT 
            roadmap_resource_id as Roadmap_ResourceID,
            resource_name as ResourceName,
            email as Email,
            work_area as WorkArea,
            activity_type_cap as ActivityType_CAP,
            activity_type_opx as ActivityType_OPX,
            contract_type as "Contract Type",
            employee_id as EmployeeID,
            created_at, updated_at
          FROM financial_resources ORDER BY resource_name`;
          data = this.db.prepare(query).all();
          break;

        default:
          console.warn(`Unknown area: ${area}`);
          return null;
      }

      if (data.length === 0) {
        return null; // No data to export
      }

      // Convert to CSV with headers
      const csv = Papa.unparse(data, {
        header: true,
        quotes: true,
        escapeFormulae: true
      });

      return csv;
    } catch (error: any) {
      console.error(`Failed to export ${area}:`, error);
      return null;
    }
  }

  /**
   * Get descriptive filename for data area
   */
  private getFilenameForArea(area: string): string {
    const filenameMap: { [key: string]: string } = {
      'projects': 'Projects.csv',
      'tasks': 'Tasks.csv',
      'calendar_months': 'Calendar-Configuration.csv',
      'public_holidays': 'Public-Holidays.csv',
      'app_settings': 'Application-Settings.csv',
      'ado_config': 'ADO-Configuration.csv',
      'ado_tags': 'ADO-Tags.csv',
      'epic_feature_config': 'Epic-Feature-Configuration.csv',
      'financial_resources': 'Resources.csv'
    };
    
    return filenameMap[area] || `${area}.csv`;
  }

  /**
   * Export Epic & Feature Configuration from localStorage format to CSV
   * This is a special case as data is stored in browser localStorage, not database
   * Returns a JSON marker for multi-file export (similar to work_items)
   */
  private async exportEpicFeatureConfig(
    event?: IpcMainInvokeEvent,
    options?: { includeDefaults?: boolean; includeTeamMembers?: boolean; includePaths?: boolean }
  ): Promise<string> {
    // Default to include all if no options provided
    const includeDefaults = options?.includeDefaults !== false;
    const includeTeamMembers = options?.includeTeamMembers !== false;
    const includePaths = options?.includePaths !== false;
    
    // Get localStorage data from renderer
    let configData: any = null;
    if (event) {
      try {
        const senderWindow = BrowserWindow.fromWebContents(event.sender);
        if (senderWindow) {
          const configJson = await senderWindow.webContents.executeJavaScript(
            `localStorage.getItem('epicFeatureDefaults')`,
            true
          );
          if (configJson) {
            configData = JSON.parse(configJson);
          }
        }
      } catch (error) {
        console.error('Failed to fetch epic/feature config from localStorage:', error);
      }
    }
    
    // Use template data if localStorage fetch failed
    if (!configData) {
      configData = {
        priority: '2',
        valueArea: 'Business',
        areaPath: 'IT\\BTE Tribe',
        iterationPath: 'IT\\Sprint\\FY26\\Q1',
        epic: {
          epicSizing: 'M',
          risk: 'Medium',
          epicOwner: '',
          deliveryLead: '',
          techLead: '',
          businessOwner: '',
          processOwner: '',
          platformOwner: '',
          tags: ''
        },
        feature: {
          productOwner: '',
          deliveryLead: '',
          techLead: '',
          businessOwner: '',
          processOwner: '',
          platformOwner: '',
          tags: ''
        },
        activeIterations: [
          'IT\\Sprint\\FY26\\Q1\\Sprint 1',
          'IT\\Sprint\\FY26\\Q1\\Sprint 2',
          'IT\\Sprint\\FY26\\Q1\\Sprint 3'
        ],
        customAreaPaths: [
          'IT\\BTE Tribe',
          'IT\\BTE Tribe\\Integration and DevOps Tooling',
          'IT\\BTE Tribe\\Platform Engineering'
        ]
      };
    }
    
    const files: { defaults?: string; teamMembers?: string; paths?: string } = {};
    
    // Build defaults CSV if requested
    if (includeDefaults) {
      const defaultsRows = [
        {
          ConfigType: 'Common',
          Priority: configData.priority || '2',
          ValueArea: configData.valueArea || 'Business',
          AreaPath: configData.areaPath || '',
          IterationPath: configData.iterationPath || ''
        },
        {
          ConfigType: 'Epic',
          Priority: '',
          ValueArea: '',
          AreaPath: '',
          IterationPath: '',
          EpicSizing: configData.epic?.epicSizing || 'M',
          Risk: configData.epic?.risk || 'Medium'
        },
        {
          ConfigType: 'Feature',
          Priority: '',
          ValueArea: '',
          AreaPath: '',
          IterationPath: ''
        }
      ];
      files.defaults = Papa.unparse(defaultsRows, { header: true, quotes: true, escapeFormulae: true });
    }
    
    // Build team members CSV if requested
    if (includeTeamMembers) {
      const teamMembersRows = [
        {
          ConfigType: 'Epic',
          EpicOwner: configData.epic?.epicOwner || '',
          ProductOwner: '',
          DeliveryLead: configData.epic?.deliveryLead || '',
          TechLead: configData.epic?.techLead || '',
          BusinessOwner: configData.epic?.businessOwner || '',
          ProcessOwner: configData.epic?.processOwner || '',
          PlatformOwner: configData.epic?.platformOwner || '',
          Tags: configData.epic?.tags || ''
        },
        {
          ConfigType: 'Feature',
          EpicOwner: '',
          ProductOwner: configData.feature?.productOwner || '',
          DeliveryLead: configData.feature?.deliveryLead || '',
          TechLead: configData.feature?.techLead || '',
          BusinessOwner: configData.feature?.businessOwner || '',
          ProcessOwner: configData.feature?.processOwner || '',
          PlatformOwner: configData.feature?.platformOwner || '',
          Tags: configData.feature?.tags || ''
        }
      ];
      files.teamMembers = Papa.unparse(teamMembersRows, { header: true, quotes: true, escapeFormulae: true });
    }
    
    // Build paths CSV if requested
    if (includePaths) {
      const pathsRows: any[] = [];
      
      // Add iterations
      if (configData.activeIterations && Array.isArray(configData.activeIterations)) {
        configData.activeIterations.forEach((iteration: string) => {
          pathsRows.push({ ConfigType: 'Iteration', PathValue: iteration });
        });
      }
      
      // Add area paths
      if (configData.customAreaPaths && Array.isArray(configData.customAreaPaths)) {
        configData.customAreaPaths.forEach((areaPath: string) => {
          pathsRows.push({ ConfigType: 'AreaPath', PathValue: areaPath });
        });
      }
      
      if (pathsRows.length > 0) {
        files.paths = Papa.unparse(pathsRows, { header: true, quotes: true, escapeFormulae: true });
      }
    }
    
    // Return multi-file marker
    return JSON.stringify({
      __multiFile: true,
      files
    });
  }

  /**
   * Import Epic & Feature Configuration from CSV files and write to localStorage
   */
  private async importEpicFeatureConfig(zipEntries: any[], event?: any): Promise<ImportResult> {
    try {
      const defaultsEntry = zipEntries.find(e => e.entryName === 'Epic-Feature-Defaults.csv');
      const teamMembersEntry = zipEntries.find(e => e.entryName === 'Epic-Feature-Team-Members.csv');
      const pathsEntry = zipEntries.find(e => e.entryName === 'Epic-Feature-Paths.csv');

      if (!defaultsEntry && !teamMembersEntry && !pathsEntry) {
        return {
          area: 'Epic & Feature Configuration',
          success: false,
          message: 'No Epic & Feature config files found in ZIP'
        };
      }

      // Initialize config structure
      const config: any = {
        priority: '2',
        valueArea: 'Business',
        areaPath: '',
        iterationPath: '',
        epic: {
          epicSizing: 'M',
          risk: 'Medium',
          epicOwner: '',
          deliveryLead: '',
          techLead: '',
          businessOwner: '',
          processOwner: '',
          platformOwner: '',
          tags: ''
        },
        feature: {
          productOwner: '',
          deliveryLead: '',
          techLead: '',
          businessOwner: '',
          processOwner: '',
          platformOwner: '',
          tags: ''
        },
        activeIterations: [],
        customAreaPaths: []
      };

      let filesProcessed = 0;

      // Parse defaults
      if (defaultsEntry) {
        const csvContent = defaultsEntry.getData().toString('utf8');
        const parseResult = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        
        parseResult.data.forEach((row: any) => {
          if (row.ConfigType === 'Common') {
            config.priority = row.Priority || config.priority;
            config.valueArea = row.ValueArea || config.valueArea;
            config.areaPath = row.AreaPath || config.areaPath;
            config.iterationPath = row.IterationPath || config.iterationPath;
          } else if (row.ConfigType === 'Epic') {
            config.epic.epicSizing = row.EpicSizing || config.epic.epicSizing;
            config.epic.risk = row.Risk || config.epic.risk;
          }
        });
        filesProcessed++;
      }

      // Parse team members
      if (teamMembersEntry) {
        const csvContent = teamMembersEntry.getData().toString('utf8');
        const parseResult = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        
        parseResult.data.forEach((row: any) => {
          if (row.ConfigType === 'Epic') {
            config.epic.epicOwner = row.EpicOwner || '';
            config.epic.deliveryLead = row.DeliveryLead || '';
            config.epic.techLead = row.TechLead || '';
            config.epic.businessOwner = row.BusinessOwner || '';
            config.epic.processOwner = row.ProcessOwner || '';
            config.epic.platformOwner = row.PlatformOwner || '';
            config.epic.tags = row.Tags || '';
          } else if (row.ConfigType === 'Feature') {
            config.feature.productOwner = row.ProductOwner || '';
            config.feature.deliveryLead = row.DeliveryLead || '';
            config.feature.techLead = row.TechLead || '';
            config.feature.businessOwner = row.BusinessOwner || '';
            config.feature.processOwner = row.ProcessOwner || '';
            config.feature.platformOwner = row.PlatformOwner || '';
            config.feature.tags = row.Tags || '';
          }
        });
        filesProcessed++;
      }

      // Parse paths
      if (pathsEntry) {
        const csvContent = pathsEntry.getData().toString('utf8');
        const parseResult = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        
        parseResult.data.forEach((row: any) => {
          if (row.ConfigType === 'Iteration' && row.PathValue) {
            config.activeIterations.push(row.PathValue);
          } else if (row.ConfigType === 'AreaPath' && row.PathValue) {
            config.customAreaPaths.push(row.PathValue);
          }
        });
        filesProcessed++;
      }

      // Write to localStorage if event available
      if (event) {
        const senderWindow = BrowserWindow.fromWebContents(event.sender);
        if (senderWindow) {
          const configJson = JSON.stringify(config);
          const escapedJson = configJson.replace(/\\/g, '\\\\').replace(/'/g, "\\'" ).replace(/\n/g, '\\n');
          
          await senderWindow.webContents.executeJavaScript(
            `
              localStorage.setItem('epicFeatureDefaults', '${escapedJson}');
              window.dispatchEvent(new Event('epic-feature-config-reload'));
            `,
            true
          );
        }
      }

      return {
        area: 'Epic & Feature Configuration',
        success: true,
        message: `Imported successfully (${filesProcessed} file(s))`,
        rowsProcessed: filesProcessed
      };
    } catch (error: any) {
      return {
        area: 'Epic & Feature Configuration',
        success: false,
        message: `Import failed: ${error.message}`
      };
    }
  }

  /**
   * Export work items (epics, features, dependencies) as a combined structure
   * Returns a special marker to indicate multi-file export
   */
  private async exportWorkItems(): Promise<string> {
    // This will be handled specially in the main export function
    // Return a JSON marker that indicates this needs multi-file export
    const epicsQuery = `SELECT 
      id, project_id, title, description, state,
      effort, business_value, time_criticality,
      start_date_nz as start_date, end_date_nz as end_date,
      assigned_to, area_path, iteration_path,
      risk, value_area, parent_feature, sort_order,
      created_at, updated_at
    FROM epics ORDER BY project_id, sort_order`;
    
    const featuresQuery = `SELECT 
      id, epic_id, project_id, title, description, state,
      effort, business_value, time_criticality,
      start_date_nz as start_date, end_date_nz as end_date,
      assigned_to, area_path, iteration_path,
      risk, value_area, sort_order,
      created_at, updated_at
    FROM features ORDER BY epic_id, sort_order`;
    
    const dependenciesQuery = `SELECT 
      id, from_type, from_id, to_type, to_id,
      kind, lag_days, note, created_at
    FROM dependencies ORDER BY created_at`;

    const epics = this.db.prepare(epicsQuery).all();
    const features = this.db.prepare(featuresQuery).all();
    const dependencies = this.db.prepare(dependenciesQuery).all();

    // Return combined data as special marker
    return JSON.stringify({
      __multiFile: true,
      files: {
        epics: epics.length > 0 ? Papa.unparse(epics, { header: true, quotes: true }) : null,
        features: features.length > 0 ? Papa.unparse(features, { header: true, quotes: true }) : null,
        dependencies: dependencies.length > 0 ? Papa.unparse(dependencies, { header: true, quotes: true }) : null
      }
    });
  }

  /**
   * Import data from CSV files
   */
  async importData(options: ImportOptions): Promise<{ success: boolean; results?: ImportResult[]; error?: string }> {
    try {
      const results: ImportResult[] = [];
      const ext = path.extname(options.inputPath).toLowerCase();

      if (ext === '.zip') {
        // Extract ZIP and process each CSV
        const zip = new AdmZip(options.inputPath);
        const zipEntries = zip.getEntries();

        for (const area of options.areas) {
          // Special handling for work_items (multi-file)
          if (area === 'work_items') {
            // Import epics, features, and dependencies (support both old and new naming)
            const epicsEntry = zipEntries.find(e => e.entryName === 'Epics.csv' || e.entryName === 'epics.csv');
            const featuresEntry = zipEntries.find(e => e.entryName === 'Features.csv' || e.entryName === 'features.csv');
            const dependenciesEntry = zipEntries.find(e => e.entryName === 'Dependencies.csv' || e.entryName === 'dependencies.csv');

            if (epicsEntry) {
              const csvContent = epicsEntry.getData().toString('utf8');
              const result = await this.importArea('epics', csvContent);
              results.push({ ...result, area: 'Epics' });
            }

            if (featuresEntry) {
              const csvContent = featuresEntry.getData().toString('utf8');
              const result = await this.importArea('features', csvContent);
              results.push({ ...result, area: 'Features' });
            }

            if (dependenciesEntry) {
              const csvContent = dependenciesEntry.getData().toString('utf8');
              const result = await this.importArea('dependencies', csvContent);
              results.push({ ...result, area: 'Dependencies' });
            }

            if (!epicsEntry && !featuresEntry && !dependenciesEntry) {
              results.push({
                area: 'Work Items',
                success: false,
                message: 'No work item files (epics.csv, features.csv, dependencies.csv) found in ZIP'
              });
            }
            continue;
          }

          // Special handling for epic_feature_config (multi-file)
          if (area === 'epic_feature_config') {
            const result = await this.importEpicFeatureConfig(zipEntries, options.event);
            results.push(result);
            continue;
          }

          // Try both old format (area.csv) and new format (descriptive name)
          const filename = this.getFilenameForArea(area);
          let entry = zipEntries.find(e => e.entryName === filename);
          if (!entry) {
            // Fallback to old naming convention
            entry = zipEntries.find(e => e.entryName === `${area}.csv`);
          }
          
          if (!entry) {
            results.push({
              area,
              success: false,
              message: `File ${filename} not found in ZIP archive`
            });
            continue;
          }

          const csvContent = entry.getData().toString('utf8');
          const result = await this.importArea(area, csvContent);
          results.push(result);
        }
      } else if (ext === '.csv') {
        // Single CSV file - import first selected area
        const csvContent = fs.readFileSync(options.inputPath, 'utf8');
        const result = await this.importArea(options.areas[0], csvContent);
        results.push(result);
      } else {
        return { success: false, error: 'Unsupported file format. Please select a ZIP or CSV file.' };
      }

      return { success: true, results };
    } catch (error: any) {
      console.error('Import failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import a single data area from CSV content
   */
  private async importArea(area: string, csvContent: string): Promise<ImportResult> {
    try {
      // Parse CSV
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      });

      if (parseResult.errors.length > 0) {
        return {
          area,
          success: false,
          message: `CSV parsing errors: ${parseResult.errors.map(e => e.message).join(', ')}`
        };
      }

      const rows = parseResult.data;
      if (rows.length === 0) {
        return {
          area,
          success: false,
          message: 'No data rows found in CSV'
        };
      }

      // Validate and insert data
      const validationResult = this.validateAndInsert(area, rows);
      
      if (validationResult.success) {
        return {
          area,
          success: true,
          message: 'Imported successfully',
          rowsProcessed: validationResult.rowsProcessed
        };
      } else {
        return {
          area,
          success: false,
          message: validationResult.error || 'Import failed'
        };
      }
    } catch (error: any) {
      return {
        area,
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Validate and insert data for a specific area
   */
  private validateAndInsert(area: string, rows: any[]): { success: boolean; rowsProcessed?: number; error?: string } {
    try {
      const now = new Date().toISOString();
      let rowsProcessed = 0;

      // Reset column logging flag for each import
      this.loggedColumns = false;

      // Wrap in transaction
      this.db.transaction(() => {
        // Disable foreign key constraints for financial resources to avoid labour rate dependency
        if (area === 'financial_resources') {
          this.db.exec('PRAGMA foreign_keys = OFF');
        }
        
        for (const row of rows) {
          switch (area) {
            case 'projects':
              this.insertProject(row, now);
              break;
            case 'tasks':
              this.insertTask(row, now);
              break;
            case 'epics':
              this.insertEpic(row, now);
              break;
            case 'features':
              this.insertFeature(row, now);
              break;
            case 'dependencies':
              this.insertDependency(row, now);
              break;
            case 'calendar_months':
              this.insertCalendarMonth(row, now);
              break;
            case 'public_holidays':
              this.insertPublicHoliday(row, now);
              break;
            case 'app_settings':
              this.insertAppSetting(row, now);
              break;
            case 'ado_config':
              this.insertADOConfig(row, now);
              break;
            case 'ado_tags':
              this.insertADOTag(row, now);
              break;
            case 'epic_feature_config':
            case 'epic_feature_config_defaults':
            case 'epic_feature_config_team':
            case 'epic_feature_config_paths':
              this.insertEpicFeatureConfig(row, area);
              break;
            case 'financial_resources':
              this.insertFinancialResource(row, now);
              break;
            default:
              throw new Error(`Unknown area: ${area}`);
          }
          rowsProcessed++;
        }
        
        // Re-enable foreign key constraints after financial resources
        if (area === 'financial_resources') {
          this.db.exec('PRAGMA foreign_keys = ON');
        }
      })();

      return { success: true, rowsProcessed };
    } catch (error: any) {
      console.error(`Error in validateAndInsert for area ${area}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods for inserting each data type
  private insertProject(row: any, now: string) {
    this.validateDateFormat(row.start_date, 'start_date');
    this.validateDateFormat(row.end_date, 'end_date');
    this.validateStatus(row.status);
    this.validateFinancialTreatment(row.financial_treatment);
    
    const budgetCents = Math.round(parseFloat(row.budget_nzd || '0') * 100);
    const startISO = this.convertNZToISO(row.start_date);
    const endISO = this.convertNZToISO(row.end_date);

    this.db.prepare(`
      INSERT OR REPLACE INTO projects (
        id, title, description, lane,
        start_date_nz, end_date_nz, start_date_iso, end_date_iso,
        status, pm_name, budget_cents, financial_treatment, row,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.id, row.title, row.description || '', row.lane || '',
      row.start_date, row.end_date, startISO, endISO,
      row.status, row.pm_name || '', budgetCents, row.financial_treatment || 'CAPEX',
      row.row ? parseInt(row.row) : null,
      row.created_at || now, now
    );
  }

  private insertTask(row: any, now: string) {
    this.validateDateFormat(row.start_date, 'start_date');
    this.validateDateFormat(row.end_date, 'end_date');
    this.validateStatus(row.status);
    
    const startISO = this.convertNZToISO(row.start_date);
    const endISO = this.convertNZToISO(row.end_date);

    this.db.prepare(`
      INSERT OR REPLACE INTO tasks (
        id, project_id, title,
        start_date_nz, end_date_nz, start_date_iso, end_date_iso,
        effort_hours, status, assigned_resources,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.id, row.project_id, row.title,
      row.start_date, row.end_date, startISO, endISO,
      parseInt(row.effort_hours || '0'), row.status,
      row.assigned_resources || '[]',
      row.created_at || now, now
    );
  }

  private insertEpic(row: any, now: string) {
    const startISO = row.start_date ? this.convertNZToISO(row.start_date) : '';
    const endISO = row.end_date ? this.convertNZToISO(row.end_date) : '';

    this.db.prepare(`
      INSERT OR REPLACE INTO epics (
        id, project_id, title, description, state,
        effort, business_value, time_criticality,
        start_date_nz, end_date_nz, start_date_iso, end_date_iso,
        assigned_to, area_path, iteration_path,
        risk, value_area, parent_feature, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.id, row.project_id, row.title, row.description || '', row.state || 'New',
      parseInt(row.effort || '0'), parseInt(row.business_value || '0'), parseInt(row.time_criticality || '0'),
      row.start_date || '', row.end_date || '', startISO, endISO,
      row.assigned_to || '', row.area_path || '', row.iteration_path || '',
      row.risk || '', row.value_area || '', row.parent_feature || '', parseInt(row.sort_order || '0'),
      row.created_at || now, now
    );
  }

  private insertFeature(row: any, now: string) {
    const startISO = row.start_date ? this.convertNZToISO(row.start_date) : '';
    const endISO = row.end_date ? this.convertNZToISO(row.end_date) : '';

    this.db.prepare(`
      INSERT OR REPLACE INTO features (
        id, epic_id, project_id, title, description, state,
        effort, business_value, time_criticality,
        start_date_nz, end_date_nz, start_date_iso, end_date_iso,
        assigned_to, area_path, iteration_path,
        risk, value_area, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.id, row.epic_id, row.project_id, row.title, row.description || '', row.state || 'New',
      parseInt(row.effort || '0'), parseInt(row.business_value || '0'), parseInt(row.time_criticality || '0'),
      row.start_date || '', row.end_date || '', startISO, endISO,
      row.assigned_to || '', row.area_path || '', row.iteration_path || '',
      row.risk || '', row.value_area || '', parseInt(row.sort_order || '0'),
      row.created_at || now, now
    );
  }

  private insertDependency(row: any, now: string) {
    this.validateDependencyKind(row.kind);

    this.db.prepare(`
      INSERT OR REPLACE INTO dependencies (
        id, from_type, from_id, to_type, to_id,
        kind, lag_days, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.id, row.from_type, row.from_id, row.to_type, row.to_id,
      row.kind, parseInt(row.lag_days || '0'), row.note || '',
      row.created_at || now
    );
  }

  private insertCalendarMonth(row: any, now: string) {
    this.db.prepare(`
      INSERT OR REPLACE INTO calendar_months (
        year, month, days, working_days, weekend_days,
        public_holidays, work_hours, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      parseInt(row.year), parseInt(row.month), parseInt(row.days),
      parseInt(row.working_days || '0'), parseInt(row.weekend_days || '0'),
      parseInt(row.public_holidays || '0'), parseInt(row.work_hours || '0'),
      row.notes || '',
      row.created_at || now, now
    );
  }

  private insertPublicHoliday(row: any, now: string) {
    this.db.prepare(`
      INSERT OR REPLACE INTO public_holidays (
        name, start_date, end_date,
        year, month, day,
        end_year, end_month, end_day,
        description, is_recurring, source,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.name, row.start_date, row.end_date,
      parseInt(row.year), parseInt(row.month), parseInt(row.day),
      row.end_year ? parseInt(row.end_year) : null,
      row.end_month ? parseInt(row.end_month) : null,
      row.end_day ? parseInt(row.end_day) : null,
      row.description || '',
      row.is_recurring === 'true' ? 1 : 0,
      row.source || 'manual',
      row.created_at || now, now
    );
  }

  private insertAppSetting(row: any, now: string) {
    this.db.prepare(`
      INSERT OR REPLACE INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `).run(row.key, row.value, now);
  }

  private insertADOConfig(row: any, now: string) {
    // Note: PAT tokens are not imported for security reasons
    this.db.prepare(`
      INSERT OR REPLACE INTO ado_config (
        org_url, project_name, auth_mode,
        pat_token_expiry_date, client_id, tenant_id,
        webhook_url, max_retry_attempts, base_delay_ms,
        is_enabled, connection_status, last_sync_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.org_url, row.project_name, row.auth_mode || 'PAT',
      row.pat_token_expiry_date || null, row.client_id || null, row.tenant_id || null,
      row.webhook_url || null, parseInt(row.max_retry_attempts || '3'), parseInt(row.base_delay_ms || '500'),
      row.is_enabled === 'true' ? 1 : 0,
      row.connection_status || 'disconnected', row.last_sync_at || null,
      row.created_at || now, now
    );
  }

  private insertADOTag(row: any, now: string) {
    this.db.prepare(`
      INSERT OR REPLACE INTO ado_tags (
        category, tag_name, tag_value,
        is_active, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.category, row.tag_name, row.tag_value,
      row.is_active === 'true' ? 1 : 0,
      parseInt(row.sort_order || '0'),
      row.created_at || now, now
    );
  }

  private insertEpicFeatureConfig(row: any, area: string) {
    // Epic/Feature config import is now handled by importEpicFeatureConfig() method
    // which collects all CSV files and writes to localStorage in one operation
    // This method is kept for compatibility but does nothing
    console.log(`Epic/Feature Config row processed via bulk import: ${area}`);
  }

  private insertFinancialResource(row: any, now: string) {
    // Normalize column names (CSV headers may have different cases)
    const roadmapResourceId = row.Roadmap_ResourceID || row.roadmap_resource_id || null;
    const resourceName = row.ResourceName || row.resource_name;
    const email = row.Email || row.email || null;
    const workArea = row.WorkArea || row.work_area || null;
    const activityTypeCap = row.ActivityType_CAP || row.activity_type_cap || null;
    const activityTypeOpx = row.ActivityType_OPX || row.activity_type_opx || null;
    // Handle Contract Type with multiple possible column names
    const contractType = row['Contract Type'] || row['ContractType'] || row.contract_type || row.Contract_Type || row['Contract_Type'];
    const employeeId = row.EmployeeID || row.employee_id || row.EmployeeId || null;

    // Debug: Show all column names in the first row to help diagnose column mapping issues
    if (!this.loggedColumns) {
      console.log('CSV Column names:', Object.keys(row));
      console.log('Sample row data:', row);
      this.loggedColumns = true;
    }
    
    console.log('Inserting financial resource:', { resourceName, contractType, employeeId, activityTypeCap, activityTypeOpx });

    // Validate contract type
    if (!contractType) {
      throw new Error(`Contract Type is missing for resource "${resourceName}". Available columns: ${Object.keys(row).join(', ')}`);
    }
    this.validateContractType(contractType);

    // Validate activity types if provided
    if (activityTypeCap && activityTypeCap !== 'Nil') {
      this.validateActivityType(activityTypeCap, 'ActivityType_CAP');
    }
    if (activityTypeOpx && activityTypeOpx !== 'Nil') {
      this.validateActivityType(activityTypeOpx, 'ActivityType_OPX');
    }

    // Handle 'Nil' values by converting to null
    const finalActivityCap = (activityTypeCap === 'Nil' || !activityTypeCap) ? null : activityTypeCap.trim();
    const finalActivityOpx = (activityTypeOpx === 'Nil' || !activityTypeOpx) ? null : activityTypeOpx.trim();

    // Note: Foreign key constraints are temporarily disabled during import,
    // so we don't need to check if activity types exist in raw_labour_rates

    // Use ON CONFLICT only if employee_id is provided, otherwise INSERT OR REPLACE by id
    if (employeeId && employeeId.trim()) {
      this.db.prepare(`
        INSERT INTO financial_resources (
          roadmap_resource_id, resource_name, email, work_area,
          activity_type_cap, activity_type_opx, contract_type, employee_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(employee_id) DO UPDATE SET
          roadmap_resource_id = excluded.roadmap_resource_id,
          resource_name = excluded.resource_name,
          email = excluded.email,
          work_area = excluded.work_area,
          activity_type_cap = excluded.activity_type_cap,
          activity_type_opx = excluded.activity_type_opx,
          contract_type = excluded.contract_type,
          updated_at = excluded.updated_at
      `).run(
        roadmapResourceId ? parseInt(roadmapResourceId) : null,
        resourceName.trim(),
        email,
        workArea,
        finalActivityCap,
        finalActivityOpx,
        contractType.trim(),
        employeeId.trim(),
        row.created_at || now,
        now
      );
    } else {
      // No employee_id, just insert (will auto-generate id)
      this.db.prepare(`
        INSERT INTO financial_resources (
          roadmap_resource_id, resource_name, email, work_area,
          activity_type_cap, activity_type_opx, contract_type, employee_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        roadmapResourceId ? parseInt(roadmapResourceId) : null,
        resourceName.trim(),
        email,
        workArea,
        finalActivityCap,
        finalActivityOpx,
        contractType.trim(),
        null,
        row.created_at || now,
        now
      );
    }
  }

  // Validation helpers
  private validateDateFormat(date: string, fieldName: string) {
    const pattern = /^\d{2}-\d{2}-\d{4}$/;
    if (!pattern.test(date)) {
      throw new Error(`Invalid date format for ${fieldName}: ${date}. Expected DD-MM-YYYY`);
    }
    
    const [day, month, year] = date.split('-').map(Number);
    const jsDate = new Date(year, month - 1, day);
    if (jsDate.getDate() !== day || jsDate.getMonth() !== month - 1 || jsDate.getFullYear() !== year) {
      throw new Error(`Invalid date for ${fieldName}: ${date}`);
    }
  }

  private validateStatus(status: string) {
    const validStatuses = ['planned', 'in-progress', 'blocked', 'done', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  private validateFinancialTreatment(treatment: string) {
    const validTreatments = ['CAPEX', 'OPEX'];
    if (!validTreatments.includes(treatment)) {
      throw new Error(`Invalid financial_treatment: ${treatment}. Must be CAPEX or OPEX`);
    }
  }

  private validateDependencyKind(kind: string) {
    const validKinds = ['FS', 'SS', 'FF', 'SF'];
    if (!validKinds.includes(kind)) {
      throw new Error(`Invalid dependency kind: ${kind}. Must be one of: ${validKinds.join(', ')}`);
    }
  }

  private validateContractType(contractType: string) {
    const validTypes = ['FTE', 'SOW', 'External Squad'];
    if (!contractType || !validTypes.includes(contractType.trim())) {
      throw new Error(`Invalid Contract Type: "${contractType}". Must be FTE, SOW, or External Squad`);
    }
  }

  private validateActivityType(activityType: string, fieldName: string) {
    const activityRegex = /^N[1-6]_(CAP|OPX)$/;
    if (!activityRegex.test(activityType.trim())) {
      throw new Error(`Invalid ${fieldName}: "${activityType}". Must match N[1-6]_(CAP|OPX) format`);
    }
  }

  private convertNZToISO(nzDate: string): string {
    const [day, month, year] = nzDate.split('-');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
}
