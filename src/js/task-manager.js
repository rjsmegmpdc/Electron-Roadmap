/**
 * Enhanced TaskManager - PRD Compliant
 * 
 * Manages tasks within projects with comprehensive CRUD operations,
 * resource assignment integration, and progress calculation.
 * 
 * PRD Compliance Features:
 * - Task data structure: {id, project_id, title, start_date, end_date, effort_hours, status, assigned_resources}
 * - Required fields: title, start_date, end_date, effort_hours
 * - Status enum: planned, in-progress, blocked, completed
 * - Resource assignment integration with ResourceManager
 * - Progress calculation: calculateProjectProgress()
 * - Date validation using DateUtils (NZ format)
 * - Integration with ProjectManager for persistence
 */

import DateUtils from './date-utils.js';

class TaskManager {
  /**
   * Valid task status values (PRD compliant)
   */
  static VALID_STATUSES = ['planned', 'in-progress', 'blocked', 'completed'];

  /**
   * Constructor
   * @param {ProjectManager} projectManager - ProjectManager instance for persistence
   * @param {ResourceManager} resourceManager - ResourceManager instance for resource validation
   */
  constructor(projectManager, resourceManager) {
    if (!projectManager) {
      throw new Error('ProjectManager is required');
    }
    if (!resourceManager) {
      throw new Error('ResourceManager is required');
    }
    this.projectManager = projectManager;
    this.resourceManager = resourceManager;
  }

  /**
   * Create a task within a project (PRD compliant)
   * @param {string} projectId - Project ID to add task to
   * @param {Object} taskData - Task data with PRD structure
   * @returns {Object} The created task
   * @throws {Error} If validation fails or project not found
   */
  createTask(projectId, taskData) {
    // Validate inputs
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    if (!taskData) {
      throw new Error('Task data is required');
    }

    // Find the project
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Create task with PRD-compliant structure
    const task = { ...taskData };

    // Generate ID if not provided
    if (!task.id) {
      task.id = this._generateTaskId();
    }

    // Set project_id automatically
    task.project_id = projectId;

    // Set default status if not provided
    if (!task.status) {
      task.status = 'planned';
    }

    // Initialize assigned_resources array if not provided
    if (!task.assigned_resources) {
      task.assigned_resources = [];
    }

    // Check for duplicate task ID within project
    if (project.tasks && project.tasks.find(t => t.id === task.id)) {
      throw new Error(`Task id already exists: ${task.id}`);
    }

    // Validate the task (PRD requirements)
    this._validateTask(task, false);

    // Validate assigned resources
    this._validateAssignedResources(projectId, task.assigned_resources);

    // Add task to project
    const updatedTasks = [...(project.tasks || []), task];
    this.projectManager.updateProject(projectId, { tasks: updatedTasks });

    return task;
  }

  /**
   * Get a task by ID across all projects (PRD compliant)
   * @param {string} taskId - Task ID
   * @returns {Object|null} The task or null if not found
   */
  getTask(taskId) {
    const projects = this.projectManager.listProjects();
    
    for (const project of projects) {
      const task = (project.tasks || []).find(task => task.id === taskId);
      if (task) {
        return task;
      }
    }
    
    return null;
  }

  /**
   * Get all tasks for a project
   * @param {string} projectId - Project ID
   * @returns {Array} Array of tasks
   * @throws {Error} If project not found
   */
  getProjectTasks(projectId) {
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    return project.tasks || [];
  }

  /**
   * Update a task (PRD compliant)
   * @param {string} taskId - Task ID
   * @param {Object} updates - Fields to update
   * @returns {Object} The updated task
   * @throws {Error} If task not found or validation fails
   */
  updateTask(taskId, updates) {
    // Prevent changing critical fields
    if (updates.id && updates.id !== taskId) {
      throw new Error('Cannot change task ID');
    }
    if (updates.project_id) {
      throw new Error('Cannot change task project association');
    }

    // Find the task and its project
    let foundProject = null;
    let taskIndex = -1;
    
    const projects = this.projectManager.listProjects();
    for (const project of projects) {
      taskIndex = (project.tasks || []).findIndex(task => task.id === taskId);
      if (taskIndex !== -1) {
        foundProject = project;
        break;
      }
    }

    if (!foundProject) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const currentTask = foundProject.tasks[taskIndex];
    const updatedTask = { ...currentTask, ...updates };

    // Validate the updated task
    this._validateTask(updatedTask, true);

    // Validate assigned resources if updated
    if (updates.assigned_resources) {
      this._validateAssignedResources(foundProject.id, updates.assigned_resources);
    }

    // Update the task in the project
    const updatedTasks = [...foundProject.tasks];
    updatedTasks[taskIndex] = updatedTask;
    this.projectManager.updateProject(foundProject.id, { tasks: updatedTasks });

    return updatedTask;
  }

  /**
   * Delete a task (PRD compliant)
   * @param {string} taskId - Task ID
   * @returns {boolean} True if deleted, false if not found
   */
  deleteTask(taskId) {
    // Find the task and its project
    const projects = this.projectManager.listProjects();
    
    for (const project of projects) {
      const tasks = project.tasks || [];
      const taskIndex = tasks.findIndex(task => task.id === taskId);
      
      if (taskIndex !== -1) {
        // Remove the task
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        this.projectManager.updateProject(project.id, { tasks: updatedTasks });
        return true;
      }
    }
    
    return false; // Task not found
  }

  /**
   * Calculate project progress based on completed tasks (PRD required)
   * @param {string} projectId - Project ID
   * @returns {Object} Progress information {progress, total_hours, completed_hours}
   * @throws {Error} If project not found
   */
  calculateProjectProgress(projectId) {
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const tasks = project.tasks || [];
    
    if (tasks.length === 0) {
      return {
        progress: 0,
        total_hours: 0,
        completed_hours: 0
      };
    }

    const totalHours = tasks.reduce((sum, task) => sum + (task.effort_hours || 0), 0);
    const completedHours = tasks
      .filter(task => task.status === 'completed')
      .reduce((sum, task) => sum + (task.effort_hours || 0), 0);

    const progress = totalHours > 0 ? Math.floor((completedHours / totalHours) * 100) : 0;

    return {
      progress,
      total_hours: totalHours,
      completed_hours: completedHours
    };
  }


  /**
   * Private method to validate task data (PRD compliant)
   * @param {Object} taskData - Task data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @throws {Error} If validation fails
   * @private
   */
  _validateTask(taskData, isUpdate = false) {
    // Required fields validation (PRD: title, start_date, end_date, effort_hours)
    if (!isUpdate || taskData.hasOwnProperty('title')) {
      if (!taskData.title) {
        throw new Error('Task title is required');
      }
    }

    if (!isUpdate || taskData.hasOwnProperty('start_date')) {
      if (!isUpdate && !taskData.start_date) {
        throw new Error('Task start_date is required');
      }
      if (taskData.start_date && !DateUtils.isValidNZ(taskData.start_date)) {
        throw new Error('Task start_date must be in valid NZ format (DD-MM-YYYY)');
      }
    }

    if (!isUpdate || taskData.hasOwnProperty('end_date')) {
      if (!isUpdate && !taskData.end_date) {
        throw new Error('Task end_date is required');
      }
      if (taskData.end_date && !DateUtils.isValidNZ(taskData.end_date)) {
        throw new Error('Task end_date must be in valid NZ format (DD-MM-YYYY)');
      }
    }

    if (!isUpdate || taskData.hasOwnProperty('effort_hours')) {
      if (!isUpdate && (taskData.effort_hours === undefined || taskData.effort_hours === null)) {
        throw new Error('Task effort_hours is required');
      }
      if (taskData.effort_hours !== undefined) {
        const effortHours = this._parseNumber(taskData.effort_hours, 'effort_hours');
        if (effortHours < 0) {
          throw new Error('Task effort_hours must be >= 0');
        }
        taskData.effort_hours = effortHours;
      }
    }

    // Validate date range: end_date must be after start_date
    if (taskData.start_date && taskData.end_date) {
      if (DateUtils.compareNZ(taskData.start_date, taskData.end_date) >= 0) {
        throw new Error('Task end_date must be after start_date');
      }
    }

    // Validate status enum if provided (PRD: planned, in-progress, blocked, completed)
    if (taskData.hasOwnProperty('status')) {
      if (taskData.status && !TaskManager.VALID_STATUSES.includes(taskData.status)) {
        throw new Error(`Task status must be one of: ${TaskManager.VALID_STATUSES.join(', ')}`);
      }
    }
  }

  /**
   * Validate assigned resources exist in project
   * @param {string} projectId - Project ID
   * @param {Array} assignedResources - Array of resource IDs
   * @throws {Error} If resources are invalid
   * @private
   */
  _validateAssignedResources(projectId, assignedResources) {
    if (!Array.isArray(assignedResources)) {
      throw new Error('Task assigned_resources must be an array');
    }

    // Check for duplicates
    const uniqueResources = new Set(assignedResources);
    if (uniqueResources.size !== assignedResources.length) {
      const duplicates = assignedResources.filter((resource, index) => 
        assignedResources.indexOf(resource) !== index
      );
      throw new Error(`Duplicate resource assignment: ${duplicates[0]}`);
    }

    // Validate each resource exists in the project
    for (const resourceId of assignedResources) {
      const resource = this.resourceManager.getResource(projectId, resourceId);
      if (!resource) {
        throw new Error(`Resource not found in project: ${resourceId}`);
      }
    }
  }

  /**
   * Parse and validate numeric values
   * @param {any} value - Value to parse
   * @param {string} fieldName - Field name for error messages
   * @returns {number} Parsed number
   * @private
   */
  _parseNumber(value, fieldName) {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        throw new Error(`Task ${fieldName} must be a valid number`);
      }
      return parsed;
    }

    throw new Error(`Task ${fieldName} must be a valid number`);
  }

  /**
   * Generate a unique task ID
   * @returns {string} Generated task ID
   * @private
   */
  _generateTaskId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `task-${timestamp}-${random}`;
  }
}

export default TaskManager;