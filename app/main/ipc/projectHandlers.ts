import { ipcMain } from 'electron';
import { ProjectService, type CreateProjectRequest, type UpdateProjectRequest, type Project } from '../services/ProjectService';
import type { DB } from '../db';

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export class ProjectIpcHandlers {
  private projectService: ProjectService;

  constructor(db: DB) {
    this.projectService = new ProjectService(db);
    this.registerHandlers();
  }

  private registerHandlers() {
    // Get all projects
    ipcMain.handle('project:getAll', async (): Promise<IpcResponse<Project[]>> => {
      try {
        const projects = this.projectService.getAllProjects();
        return {
          success: true,
          data: projects
        };
      } catch (error: any) {
        console.error('IPC error - project:getAll:', error);
        return {
          success: false,
          errors: [`Failed to get projects: ${error.message}`]
        };
      }
    });

    // Get project by ID
    ipcMain.handle('project:getById', async (event, id: string): Promise<IpcResponse<Project | null>> => {
      try {
        if (!id || typeof id !== 'string') {
          return {
            success: false,
            errors: ['Project ID is required']
          };
        }

        const project = this.projectService.getProjectById(id);
        return {
          success: true,
          data: project
        };
      } catch (error: any) {
        console.error('IPC error - project:getById:', error);
        return {
          success: false,
          errors: [`Failed to get project: ${error.message}`]
        };
      }
    });

    // Create project
    ipcMain.handle('project:create', async (event, data: CreateProjectRequest): Promise<IpcResponse<Project>> => {
      try {
        if (!data || typeof data !== 'object') {
          return {
            success: false,
            errors: ['Project data is required']
          };
        }

        const result = this.projectService.createProject(data);
        if (!result.success) {
          return {
            success: false,
            errors: result.errors
          };
        }

        return {
          success: true,
          data: result.project!
        };
      } catch (error: any) {
        console.error('IPC error - project:create:', error);
        return {
          success: false,
          errors: [`Failed to create project: ${error.message}`]
        };
      }
    });

    // Update project
    ipcMain.handle('project:update', async (event, data: UpdateProjectRequest): Promise<IpcResponse<Project>> => {
      try {
        if (!data || typeof data !== 'object' || !data.id) {
          return {
            success: false,
            errors: ['Project data with ID is required']
          };
        }

        const result = this.projectService.updateProject(data);
        if (!result.success) {
          return {
            success: false,
            errors: result.errors
          };
        }

        return {
          success: true,
          data: result.project!
        };
      } catch (error: any) {
        console.error('IPC error - project:update:', error);
        return {
          success: false,
          errors: [`Failed to update project: ${error.message}`]
        };
      }
    });

    // Delete project
    ipcMain.handle('project:delete', async (event, id: string): Promise<IpcResponse<void>> => {
      try {
        if (!id || typeof id !== 'string') {
          return {
            success: false,
            errors: ['Project ID is required']
          };
        }

        const result = this.projectService.deleteProject(id);
        if (!result.success) {
          return {
            success: false,
            errors: result.errors
          };
        }

        return {
          success: true
        };
      } catch (error: any) {
        console.error('IPC error - project:delete:', error);
        return {
          success: false,
          errors: [`Failed to delete project: ${error.message}`]
        };
      }
    });

    // Get projects by status
    ipcMain.handle('project:getByStatus', async (event, status: string): Promise<IpcResponse<Project[]>> => {
      try {
        if (!status || typeof status !== 'string') {
          return {
            success: false,
            errors: ['Status is required']
          };
        }

        const validStatuses = ['planned', 'in-progress', 'blocked', 'done', 'archived'];
        if (!validStatuses.includes(status)) {
          return {
            success: false,
            errors: [`Invalid status. Must be one of: ${validStatuses.join(', ')}`]
          };
        }

        const projects = this.projectService.getProjectsByStatus(status as any);
        return {
          success: true,
          data: projects
        };
      } catch (error: any) {
        console.error('IPC error - project:getByStatus:', error);
        return {
          success: false,
          errors: [`Failed to get projects by status: ${error.message}`]
        };
      }
    });

    // Get project statistics
    ipcMain.handle('project:getStats', async (): Promise<IpcResponse<any>> => {
      try {
        const stats = this.projectService.getProjectStats();
        return {
          success: true,
          data: stats
        };
      } catch (error: any) {
        console.error('IPC error - project:getStats:', error);
        return {
          success: false,
          errors: [`Failed to get project statistics: ${error.message}`]
        };
      }
    });

    console.log('Project IPC handlers registered successfully');
  }

  /**
   * Cleanup handlers when shutting down
   */
  cleanup() {
    const handlers = [
      'project:getAll',
      'project:getById', 
      'project:create',
      'project:update',
      'project:delete',
      'project:getByStatus',
      'project:getStats'
    ];

    handlers.forEach(handler => {
      ipcMain.removeAllListeners(handler);
    });

    console.log('Project IPC handlers cleaned up');
  }
}