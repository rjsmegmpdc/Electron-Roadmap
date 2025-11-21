import { ipcMain } from 'electron';
import type { DB } from '../db';
import type { IpcResponse } from '../preload';
import { DependencyService } from '../services/DependencyService';
import type { 
  Dependency, 
  CreateDependencyRequest, 
  UpdateDependencyRequest 
} from '../preload';

export class DependencyIpcHandlers {
  private dependencyService: DependencyService;

  constructor(database: DB) {
    this.dependencyService = new DependencyService(database);
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Get all dependencies
    ipcMain.handle('dependency:getAll', async (): Promise<IpcResponse<Dependency[]>> => {
      try {
        const result = this.dependencyService.getAllDependencies();
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Error in dependency:getAll:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Get dependency by ID
    ipcMain.handle('dependency:getById', async (_, dependencyId: string): Promise<IpcResponse<Dependency | null>> => {
      try {
        const result = this.dependencyService.getDependencyById(dependencyId);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Error in dependency:getById:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Get dependencies for entity
    ipcMain.handle('dependency:getForEntity', async (_, entityType: 'project' | 'task', entityId: string): Promise<IpcResponse<any>> => {
      try {
        const result = this.dependencyService.getDependenciesForEntity(entityType, entityId);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Error in dependency:getForEntity:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Create dependency
    ipcMain.handle('dependency:create', async (_, dependencyData: CreateDependencyRequest): Promise<IpcResponse<Dependency>> => {
      try {
        const result = this.dependencyService.createDependency(dependencyData);
        return {
          success: result.success,
          data: result.dependency,
          errors: result.errors
        };
      } catch (error) {
        console.error('Error in dependency:create:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Update dependency
    ipcMain.handle('dependency:update', async (_, dependencyData: UpdateDependencyRequest): Promise<IpcResponse<Dependency>> => {
      try {
        const result = this.dependencyService.updateDependency(dependencyData);
        return {
          success: result.success,
          data: result.dependency,
          errors: result.errors
        };
      } catch (error) {
        console.error('Error in dependency:update:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Delete dependency
    ipcMain.handle('dependency:delete', async (_, dependencyId: string): Promise<IpcResponse<void>> => {
      try {
        const result = await this.dependencyService.deleteDependency(dependencyId);
        return {
          success: result.success,
          errors: result.errors
        };
      } catch (error) {
        console.error('Error in dependency:delete:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Get dependency statistics
    ipcMain.handle('dependency:getStats', async (): Promise<IpcResponse<any>> => {
      try {
        const result = this.dependencyService.getDependencyStats();
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Error in dependency:getStats:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });
  }

  cleanup(): void {
    // Remove all dependency-related IPC handlers
    ipcMain.removeHandler('dependency:getAll');
    ipcMain.removeHandler('dependency:getById');
    ipcMain.removeHandler('dependency:getForEntity');
    ipcMain.removeHandler('dependency:create');
    ipcMain.removeHandler('dependency:update');
    ipcMain.removeHandler('dependency:delete');
    ipcMain.removeHandler('dependency:getStats');
  }
}