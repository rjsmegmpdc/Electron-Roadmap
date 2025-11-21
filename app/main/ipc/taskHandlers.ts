import { ipcMain } from 'electron';
import type { DB } from '../db';
import type { IpcResponse } from '../preload';
import { TaskService } from '../services/TaskService';
import type { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest 
} from '../preload';

export class TaskIpcHandlers {
  private taskService: TaskService;

  constructor(database: DB) {
    this.taskService = new TaskService(database);
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Get all tasks
    ipcMain.handle('task:getAll', async (): Promise<IpcResponse<Task[]>> => {
      try {
        const result = this.taskService.getAllTasks();
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Error in task:getAll:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Get task by ID
    ipcMain.handle('task:getById', async (_, taskId: string): Promise<IpcResponse<Task | null>> => {
      try {
        const result = this.taskService.getTaskById(taskId);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Error in task:getById:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Get tasks by project
    ipcMain.handle('task:getByProject', async (_, projectId: string): Promise<IpcResponse<Task[]>> => {
      try {
        const result = this.taskService.getTasksByProjectId(projectId);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Error in task:getByProject:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Create task
    ipcMain.handle('task:create', async (_, taskData: CreateTaskRequest): Promise<IpcResponse<Task>> => {
      try {
        const result = this.taskService.createTask(taskData);
        return {
          success: result.success,
          data: result.task,
          errors: result.errors
        };
      } catch (error) {
        console.error('Error in task:create:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Update task
    ipcMain.handle('task:update', async (_, taskData: UpdateTaskRequest): Promise<IpcResponse<Task>> => {
      try {
        const result = this.taskService.updateTask(taskData);
        return {
          success: result.success,
          data: result.task,
          errors: result.errors
        };
      } catch (error) {
        console.error('Error in task:update:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Delete task
    ipcMain.handle('task:delete', async (_, taskId: string): Promise<IpcResponse<void>> => {
      try {
        const result = await this.taskService.deleteTask(taskId);
        return {
          success: result.success,
          errors: result.errors
        };
      } catch (error) {
        console.error('Error in task:delete:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Get tasks by status
    ipcMain.handle('task:getByStatus', async (_, status: string): Promise<IpcResponse<Task[]>> => {
      try {
        const result = this.taskService.getTasksByStatus(status as any);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Error in task:getByStatus:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });

    // Get task statistics
    ipcMain.handle('task:getStats', async (): Promise<IpcResponse<any>> => {
      try {
        const result = this.taskService.getTaskStats();
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error('Error in task:getStats:', error);
        return {
          success: false,
          errors: [(error as Error).message]
        };
      }
    });
  }

  cleanup(): void {
    // Remove all task-related IPC handlers
    ipcMain.removeHandler('task:getAll');
    ipcMain.removeHandler('task:getById');
    ipcMain.removeHandler('task:getByProject');
    ipcMain.removeHandler('task:create');
    ipcMain.removeHandler('task:update');
    ipcMain.removeHandler('task:delete');
    ipcMain.removeHandler('task:getByStatus');
    ipcMain.removeHandler('task:getStats');
  }
}