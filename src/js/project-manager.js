/**
 * ProjectManager
 * 
 * Manages projects with CRUD operations and lifecycle gates.
 * Uses DataPersistenceManager for persistence and DateUtils for validation.
 * Enforces business rules on status transitions.
 * 
 * Features:
 * - Project validation with required fields
 * - Date validation using NZ format
 * - Status gate enforcement
 * - ID generation and uniqueness
 * - Full CRUD operations
 */

import DateUtils from './date-utils.js';

class ProjectManager {
  /**
   * Constructor
   * @param {DataPersistenceManager} dataPM - Data persistence manager instance
   */
  constructor(dataPM) {
    this.dataPM = dataPM;
  }

  /**
   * Create a new project
   * @param {Object} projectData - Project data to create
   * @returns {Object} The created project
   * @throws {Error} If validation fails
   */
  createProject(projectData) {
    // Validate the project data
    this._validateProject(projectData, false);
    
    // Create a copy to avoid mutating the original
    const project = { ...projectData };
    
    // Generate ID if not provided
    if (!project.id) {
      project.id = this._generateId();
    }
    
    // Check for duplicate ID
    const existingProjects = this.dataPM.loadProjects();
    if (existingProjects.find(p => p.id === project.id)) {
      throw new Error(`Project id already exists: ${project.id}`);
    }
    
    // Set default values
    if (!project.status) {
      project.status = 'concept-design';
    }
    if (!project.tasks) {
      project.tasks = [];
    }
    if (!project.resources) {
      project.resources = [];
    }
    if (!project.forecasts) {
      project.forecasts = [];
    }
    
    // Save the project
    const projects = [...existingProjects, project];
    this.dataPM.saveProjects(projects);
    
    return project;
  }

  /**
   * Get a project by ID
   * @param {string} id - Project ID
   * @returns {Object|null} The project or null if not found
   */
  getProject(id) {
    const projects = this.dataPM.loadProjects();
    return projects.find(p => p.id === id) || null;
  }

  /**
   * Update an existing project
   * @param {string} id - Project ID
   * @param {Object} updates - Fields to update
   * @returns {Object} The updated project
   * @throws {Error} If project not found or validation fails
   */
  updateProject(id, updates) {
    const projects = this.dataPM.loadProjects();
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      throw new Error(`Project not found: ${id}`);
    }
    
    const currentProject = projects[projectIndex];
    const updatedProject = { ...currentProject, ...updates };
    
    // Validate the updated project
    this._validateProject(updatedProject, true);
    
    // Validate status gate if status is being updated
    if (updates.status && updates.status !== currentProject.status) {
      this._validateStatusGate(updatedProject, updates.status);
    }
    
    // Update the project in the array
    projects[projectIndex] = updatedProject;
    
    // Save the updated projects
    this.dataPM.saveProjects(projects);
    
    return updatedProject;
  }

  /**
   * Delete a project
   * @param {string} id - Project ID
   * @returns {boolean} True if deleted, false if not found
   */
  deleteProject(id) {
    const projects = this.dataPM.loadProjects();
    const initialLength = projects.length;
    const filteredProjects = projects.filter(p => p.id !== id);
    
    if (filteredProjects.length === initialLength) {
      return false; // Project not found
    }
    
    this.dataPM.saveProjects(filteredProjects);
    return true;
  }

  /**
   * List all projects
   * @returns {Array} Array of all projects
   */
  listProjects() {
    return this.dataPM.loadProjects();
  }

  /**
   * Link project to initiative
   * @param {string} projectId - Project ID
   * @param {string} initiativeId - Initiative ID
   * @returns {Object} The updated project
   * @throws {Error} If project not found
   */
  linkToInitiative(projectId, initiativeId) {
    return this.updateProject(projectId, { initiative_id: initiativeId });
  }

  /**
   * Unlink project from initiative
   * @param {string} projectId - Project ID
   * @returns {Object} The updated project
   * @throws {Error} If project not found
   */
  unlinkFromInitiative(projectId) {
    return this.updateProject(projectId, { initiative_id: null });
  }

  /**
   * Get projects linked to a specific initiative
   * @param {string} initiativeId - Initiative ID
   * @returns {Array} Array of projects linked to the initiative
   */
  getProjectsByInitiative(initiativeId) {
    const projects = this.dataPM.loadProjects();
    return projects.filter(p => p.initiative_id === initiativeId);
  }

  /**
   * Get projects with no initiative linkage
   * @returns {Array} Array of unlinked projects
   */
  getUnlinkedProjects() {
    const projects = this.dataPM.loadProjects();
    return projects.filter(p => !p.initiative_id);
  }

  /**
   * Private method to validate project data
   * @param {Object} projectData - Project data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @throws {Error} If validation fails
   * @private
   */
  _validateProject(projectData, isUpdate = false) {
    // For updates, only validate fields that are present
    if (!isUpdate || projectData.hasOwnProperty('title')) {
      if (!projectData.title) {
        throw new Error('Project title is required');
      }
    }
    
    if (!isUpdate || projectData.hasOwnProperty('start_date')) {
      if (!projectData.start_date || !DateUtils.isValidNZ(projectData.start_date)) {
        throw new Error('Project start_date is required');
      }
    }
    
    if (!isUpdate || projectData.hasOwnProperty('end_date')) {
      if (!projectData.end_date || !DateUtils.isValidNZ(projectData.end_date)) {
        throw new Error('Project end_date is required');
      }
    }
    
    if (!isUpdate || projectData.hasOwnProperty('budget_cents')) {
      if (projectData.budget_cents === undefined || projectData.budget_cents === null) {
        throw new Error('Project budget_cents is required');
      }
      if (projectData.budget_cents < 0) {
        throw new Error('Project budget_cents must be >= 0');
      }
    }
    
    if (!isUpdate || projectData.hasOwnProperty('financial_treatment')) {
      if (!projectData.financial_treatment) {
        throw new Error('Project financial_treatment is required');
      }
    }
    
    // Validate initiative_id if present (optional field)
    if (projectData.hasOwnProperty('initiative_id') && projectData.initiative_id !== null && projectData.initiative_id !== '') {
      if (typeof projectData.initiative_id !== 'string') {
        throw new Error('Project initiative_id must be a string');
      }
    }
    
    // Validate date comparison if both dates are present
    if (projectData.start_date && projectData.end_date) {
      if (DateUtils.isValidNZ(projectData.start_date) && DateUtils.isValidNZ(projectData.end_date)) {
        const comparison = DateUtils.compareNZ(projectData.start_date, projectData.end_date);
        if (comparison >= 0) {
          throw new Error('Project end_date must be after start_date');
        }
      }
    }
  }

  /**
   * Private method to validate status gate rules
   * @param {Object} project - Full project data
   * @param {string} newStatus - Status being transitioned to
   * @throws {Error} If status gate validation fails
   * @private
   */
  _validateStatusGate(project, newStatus) {
    switch (newStatus) {
      case 'solution-design':
        if (project.budget_cents <= 0) {
          throw new Error('Cannot enter solution-design without budget');
        }
        break;
        
      case 'engineering':
        if (!project.tasks || project.tasks.length === 0) {
          throw new Error('Cannot enter engineering without tasks');
        }
        break;
        
      case 'uat':
        if (!project.forecasts || project.forecasts.length === 0) {
          throw new Error('Cannot enter uat without forecast');
        }
        break;
        
      case 'release':
        if (!project.tasks || project.tasks.length === 0) {
          throw new Error('Cannot enter release with incomplete tasks');
        }
        // Check that all tasks are completed
        const incompleteTasks = project.tasks.filter(task => task.status !== 'completed');
        if (incompleteTasks.length > 0) {
          throw new Error('Cannot enter release with incomplete tasks');
        }
        break;
        
      // concept-design has no gates
      default:
        break;
    }
  }

  /**
   * Private method to generate a unique project ID
   * @returns {string} Generated ID
   * @private
   */
  _generateId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `proj-${timestamp}-${random}`;
  }
}

export default ProjectManager;