/**
 * PRDIntegration - Main Orchestrator Class
 * 
 * High-level operations that coordinate between all modules:
 * - Data seeding and initialization
 * - Project creation with tasks and resources
 * - Status gate enforcement and project approval
 * - Forecasting operations
 * - CSV import/export workflows
 * - Backup and restore operations
 * - End-to-end project lifecycle management
 */

export default class PRDIntegration {
  /**
   * Initialize PRDIntegration with all required dependencies
   * @param {Object} deps - Dependencies object containing all managers
   */
  constructor(deps) {
    const required = [
      'dataPM', 'projectManager', 'taskManager', 'resourceManager', 
      'financialManager', 'forecastingEngine', 'csvManager'
    ];
    
    for (const dep of required) {
      if (!deps[dep]) {
        throw new Error(`${dep} is required`);
      }
      this[dep] = deps[dep];
    }
  }

  /**
   * Seed the system with initial data
   * @param {Object} data - Seed data with projects array
   */
  seed(data) {
    if (!data || !data.projects || !Array.isArray(data.projects)) {
      throw new Error('Seed data must contain projects array');
    }

    // Clear existing data and load seed data
    this.dataPM.saveProjects(data.projects);
  }

  /**
   * Create a complete project with tasks and resources
   * @param {Object} projectData - Project data
   * @param {Array} tasks - Array of task data
   * @returns {Object} Created project with tasks
   */
  createProjectWithTasks(projectData, tasks = []) {
    // Create the project first
    const project = this.projectManager.createProject(projectData);
    
    const createdTasks = [];
    
    // Add tasks if provided
    for (const taskData of tasks) {
      try {
        const task = this.taskManager.createTask(project.id, taskData);
        createdTasks.push(task);
      } catch (error) {
        console.warn(`Failed to create task: ${error.message}`);
      }
    }
    
    return {
      project,
      tasks: createdTasks
    };
  }

  /**
   * Approve a project by validating all requirements and advancing status
   * @param {string} projectId - Project ID to approve
   * @returns {Object} Approval result with success status and any errors
   */
  approveProject(projectId) {
    const result = {
      ok: false,
      errors: []
    };

    try {
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        result.errors.push({ msg: `Project ${projectId} not found`, code: 'PROJECT_NOT_FOUND' });
        return result;
      }

      // Determine next status based on current status
      let nextStatus;
      switch (project.status) {
        case 'concept-design':
          nextStatus = 'solution-design';
          break;
        case 'solution-design':
          nextStatus = 'engineering';
          break;
        case 'engineering':
          nextStatus = 'uat';
          break;
        case 'uat':
          nextStatus = 'release';
          break;
        default:
          result.errors.push({ msg: `Project ${projectId} is already in final status`, code: 'ALREADY_FINAL' });
          return result;
      }

      // Try to advance to next status (this will validate gates)
      try {
        this.projectManager.updateProject(projectId, { status: nextStatus });
        result.ok = true;
      } catch (gateError) {
        result.errors.push({ msg: gateError.message, code: 'GATE_VALIDATION_FAILED' });
      }

    } catch (error) {
      result.errors.push({ msg: error.message, code: 'APPROVAL_ERROR' });
    }

    return result;
  }

  /**
   * Run forecasting for a project
   * @param {string} projectId - Project ID
   * @returns {Object} Forecast result
   */
  runForecast(projectId) {
    try {
      return this.forecastingEngine.createProjectForecast(projectId);
    } catch (error) {
      throw new Error(`Forecasting failed: ${error.message}`);
    }
  }

  /**
   * Export all projects to CSV
   * @param {string} format - Export format: 'simple' or 'full'
   * @returns {string} CSV content
   */
  exportCSV(format = 'full') {
    const projects = this.projectManager.listProjects();
    return this.csvManager.exportToCSV(projects, format);
  }

  /**
   * Import projects from CSV
   * @param {string} csvText - CSV content to import
   * @returns {Object} Import result with imported count, errors, and warnings
   */
  importCSV(csvText) {
    const parseResult = this.csvManager.parseCSV(csvText);
    
    let imported = 0;
    const importErrors = [];
    
    // Import each valid project
    for (const projectData of parseResult.projects) {
      try {
        this.projectManager.createProject(projectData);
        imported++;
      } catch (error) {
        importErrors.push({ msg: `Failed to import project ${projectData.title || 'unknown'}: ${error.message}` });
      }
    }
    
    return {
      imported,
      errors: [...parseResult.errors, ...importErrors],
      warnings: parseResult.warnings
    };
  }

  /**
   * Create a backup of all project data
   * @returns {string} Backup key
   */
  backup() {
    return this.dataPM.backupProjects();
  }

  /**
   * Restore project data from backup
   * @param {string} backupKey - Backup key to restore
   */
  restore(backupKey) {
    this.dataPM.restoreProjects(backupKey);
  }

  /**
   * Get comprehensive project status including tasks, resources, and financials
   * @param {string} projectId - Project ID
   * @returns {Object} Complete project status
   */
  getProjectStatus(projectId) {
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const tasks = this.taskManager.getProjectTasks(projectId);
    const resources = this.resourceManager.getProjectResources(projectId);
    const progress = tasks.length > 0 ? this.taskManager.calculateProjectProgress(projectId) : null;
    const financials = this.financialManager.calculateVariance(projectId);
    
    return {
      project,
      tasks,
      resources,
      progress,
      financials,
      task_count: tasks.length,
      resource_count: resources.length
    };
  }

  /**
   * Validate project readiness for status advancement
   * @param {string} projectId - Project ID
   * @returns {Object} Readiness assessment
   */
  validateProjectReadiness(projectId) {
    const result = {
      ready: false,
      current_status: null,
      next_status: null,
      requirements: [],
      blockers: []
    };

    try {
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        result.blockers.push('Project not found');
        return result;
      }

      result.current_status = project.status;
      
      // Determine next status and requirements
      switch (project.status) {
        case 'concept-design':
          result.next_status = 'solution-design';
          result.requirements.push('Budget must be > 0');
          if (!project.budget_cents || project.budget_cents <= 0) {
            result.blockers.push('No budget set');
          }
          break;
          
        case 'solution-design':
          result.next_status = 'engineering';
          result.requirements.push('Must have tasks');
          const tasks = this.taskManager.getProjectTasks(projectId);
          if (!tasks || tasks.length === 0) {
            result.blockers.push('No tasks defined');
          }
          break;
          
        case 'engineering':
          result.next_status = 'uat';
          result.requirements.push('Must have forecasts');
          if (!project.forecasts || project.forecasts.length === 0) {
            result.blockers.push('No forecasts available');
          }
          break;
          
        case 'uat':
          result.next_status = 'release';
          result.requirements.push('All tasks must be completed');
          const allTasks = this.taskManager.getProjectTasks(projectId);
          const incompleteTasks = allTasks.filter(task => task.status !== 'completed');
          if (incompleteTasks.length > 0) {
            result.blockers.push(`${incompleteTasks.length} tasks incomplete`);
          }
          break;
          
        default:
          result.next_status = 'release';
          result.requirements.push('Project is in final status');
      }
      
      result.ready = result.blockers.length === 0;
      
    } catch (error) {
      result.blockers.push(`Validation error: ${error.message}`);
    }

    return result;
  }

  /**
   * Get system health status
   * @returns {Object} System health information
   */
  getSystemHealth() {
    const projects = this.projectManager.listProjects();
    const backups = this.dataPM.listBackups();
    
    let totalTasks = 0;
    let totalResources = 0;
    let completedProjects = 0;
    
    for (const project of projects) {
      totalTasks += (project.tasks || []).length;
      totalResources += (project.resources || []).length;
      
      if (project.status === 'release') {
        completedProjects++;
      }
    }
    
    return {
      projects_count: projects.length,
      completed_projects: completedProjects,
      total_tasks: totalTasks,
      total_resources: totalResources,
      backups_count: backups.length,
      system_status: 'healthy'
    };
  }
}