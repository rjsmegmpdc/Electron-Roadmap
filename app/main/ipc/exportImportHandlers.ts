import { ipcMain, dialog } from 'electron';
import { ExportImportService } from '../services/ExportImportService';
import type { DB } from '../db';

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export class ExportImportIpcHandlers {
  private service: ExportImportService;

  constructor(db: DB) {
    this.service = new ExportImportService(db);
    this.registerHandlers();
  }

  private registerHandlers() {
    // Export data to file
    ipcMain.handle('exportImport:export', async (event, options: { areas: string[]; epicFeatureConfigOptions?: { includeDefaults?: boolean; includeTeamMembers?: boolean; includePaths?: boolean } }): Promise<IpcResponse> => {
      try {
        if (!options || !options.areas || !Array.isArray(options.areas) || options.areas.length === 0) {
          return {
            success: false,
            errors: ['At least one data area must be selected']
          };
        }

        // Show save dialog
        const result = await dialog.showSaveDialog({
          title: 'Export Data',
          defaultPath: `roadmap-export-${new Date().toISOString().split('T')[0]}.zip`,
          filters: [
            { name: 'ZIP Archive', extensions: ['zip'] }
          ]
        });

        if (result.canceled || !result.filePath) {
          return {
            success: false,
            errors: ['Export canceled by user']
          };
        }

        // Perform export
        const exportResult = await this.service.exportData({
          areas: options.areas,
          outputPath: result.filePath,
          epicFeatureConfigOptions: options.epicFeatureConfigOptions,
          event // Pass event for localStorage access
        });

        return {
          success: exportResult.success,
          data: exportResult,
          errors: exportResult.error ? [exportResult.error] : undefined
        };
      } catch (error: any) {
        console.error('IPC error - exportImport:export:', error);
        return {
          success: false,
          errors: [`Failed to export data: ${error.message}`]
        };
      }
    });

    // Import data from file
    ipcMain.handle('exportImport:import', async (event, options: { areas: string[] }): Promise<IpcResponse> => {
      try {
        if (!options || !options.areas || !Array.isArray(options.areas) || options.areas.length === 0) {
          return {
            success: false,
            errors: ['At least one data area must be selected']
          };
        }

        // Show open dialog
        const result = await dialog.showOpenDialog({
          title: 'Import Data',
          filters: [
            { name: 'Data Files', extensions: ['zip', 'csv'] },
            { name: 'ZIP Archive', extensions: ['zip'] },
            { name: 'CSV File', extensions: ['csv'] }
          ],
          properties: ['openFile']
        });

        if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
          return {
            success: false,
            errors: ['Import canceled by user']
          };
        }

        // Perform import
        const importResult = await this.service.importData({
          areas: options.areas,
          inputPath: result.filePaths[0],
          event // Pass event for localStorage access
        });

        return {
          success: importResult.success,
          data: importResult,
          errors: importResult.error ? [importResult.error] : undefined
        };
      } catch (error: any) {
        console.error('IPC error - exportImport:import:', error);
        return {
          success: false,
          errors: [`Failed to import data: ${error.message}`]
        };
      }
    });

    console.log('Export/Import IPC handlers registered successfully');
  }

  /**
   * Cleanup handlers when shutting down
   */
  cleanup() {
    const handlers = [
      'exportImport:export',
      'exportImport:import'
    ];

    handlers.forEach(handler => {
      ipcMain.removeAllListeners(handler);
    });

    console.log('Export/Import IPC handlers cleaned up');
  }
}
