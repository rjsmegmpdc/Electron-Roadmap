/**
 * ResourceManager - Manages resources within projects
 * 
 * Handles CRUD operations for resources, validation, cost calculations,
 * utilization analysis, and integration with ProjectManager for persistence.
 * 
 * Resource structure follows sample data format:
 * {
 *   id: string,
 *   name: string,
 *   type: 'internal' | 'contractor' | 'vendor',
 *   allocation: number (0.0 to 1.0),
 *   rate_per_hour?: number (cents, optional)
 * }
 */

export default class ResourceManager {
  constructor(projectManager) {
    if (!projectManager) {
      throw new Error('ProjectManager is required');
    }
    this.projectManager = projectManager;
  }

  /**
   * Create a new resource within a project
   * @param {string} projectId - ID of the project
   * @param {Object} resourceData - Resource data
   * @returns {Object} Created resource with generated ID
   */
  createResource(projectId, resourceData) {
    // Validate inputs
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    if (!resourceData) {
      throw new Error('Resource data is required');
    }

    // Validate project exists
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Validate resource data
    this._validateResource(resourceData, false);

    // Generate unique resource ID
    const resourceId = this._generateResourceId();

    // Create resource object with all validated fields
    const resource = {
      id: resourceId,
      name: resourceData.name,
      type: resourceData.type,
      allocation: this._parseNumber(resourceData.allocation, 'allocation'),
      ...((resourceData.rate_per_hour !== undefined) && {
        rate_per_hour: this._parseNumber(resourceData.rate_per_hour, 'rate_per_hour')
      })
    };

    // Add resource to project
    const updatedResources = [...(project.resources || []), resource];
    this.projectManager.updateProject(projectId, { resources: updatedResources });

    return resource;
  }

  /**
   * Get a specific resource by ID from a project
   * @param {string} projectId - ID of the project
   * @param {string} resourceId - ID of the resource
   * @returns {Object|null} Resource object or null if not found
   */
  getResource(projectId, resourceId) {
    try {
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return null;
      }

      const resources = project.resources || [];
      return resources.find(resource => resource.id === resourceId) || null;
    } catch (error) {
      throw error; // Re-throw ProjectManager errors
    }
  }

  /**
   * Get all resources for a project
   * @param {string} projectId - ID of the project
   * @returns {Array} Array of resources
   */
  getProjectResources(projectId) {
    try {
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return [];
      }

      if (project.resources === null || project.resources === undefined) {
        throw new Error('Invalid project resources data');
      }

      return project.resources || [];
    } catch (error) {
      throw error; // Re-throw ProjectManager errors
    }
  }

  /**
   * Update an existing resource
   * @param {string} projectId - ID of the project
   * @param {string} resourceId - ID of the resource
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated resource
   */
  updateResource(projectId, resourceId, updates) {
    // Validate inputs
    if (!projectId || !resourceId || !updates) {
      throw new Error('Project ID, resource ID, and updates are required');
    }

    // Prevent ID changes
    if (updates.id && updates.id !== resourceId) {
      throw new Error('Cannot change resource ID');
    }

    // Get project and resource
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const resources = project.resources || [];
    const resourceIndex = resources.findIndex(r => r.id === resourceId);
    if (resourceIndex === -1) {
      throw new Error(`Resource not found: ${resourceId}`);
    }

    // Validate update data
    this._validateResource(updates, true);

    // Create updated resource
    const currentResource = resources[resourceIndex];
    const updatedResource = {
      ...currentResource,
      ...updates
    };

    // Convert numeric fields
    if (updates.allocation !== undefined) {
      updatedResource.allocation = this._parseNumber(updates.allocation, 'allocation');
    }
    if (updates.rate_per_hour !== undefined) {
      updatedResource.rate_per_hour = this._parseNumber(updates.rate_per_hour, 'rate_per_hour');
    }

    // Update resource in project
    const updatedResources = [...resources];
    updatedResources[resourceIndex] = updatedResource;
    this.projectManager.updateProject(projectId, { resources: updatedResources });

    return updatedResource;
  }

  /**
   * Delete a resource from a project
   * @param {string} projectId - ID of the project
   * @param {string} resourceId - ID of the resource
   * @returns {boolean} True if deleted, false if not found
   */
  deleteResource(projectId, resourceId) {
    try {
      const project = this.projectManager.getProject(projectId);
      if (!project) {
        return false;
      }

      const resources = project.resources || [];
      const resourceIndex = resources.findIndex(r => r.id === resourceId);
      if (resourceIndex === -1) {
        return false;
      }

      // Remove resource from project
      const updatedResources = resources.filter(r => r.id !== resourceId);
      this.projectManager.updateProject(projectId, { resources: updatedResources });

      return true;
    } catch (error) {
      throw error; // Re-throw ProjectManager errors
    }
  }

  /**
   * Calculate hourly cost for a resource
   * @param {Object} resource - Resource object
   * @returns {number} Hourly cost in cents
   */
  calculateHourlyCost(resource) {
    return resource.rate_per_hour || 0;
  }

  /**
   * Calculate total cost for a resource based on hours
   * @param {Object} resource - Resource object
   * @param {number} hours - Number of hours
   * @returns {number} Total cost in cents
   */
  calculateResourceCost(resource, hours) {
    const hourlyCost = this.calculateHourlyCost(resource);
    return hourlyCost * (hours || 0);
  }

  /**
   * Get total allocation for a resource across all projects
   * @param {string} resourceId - ID of the resource
   * @returns {number} Total allocation (0.0 to potentially > 1.0)
   */
  getTotalResourceAllocation(resourceId) {
    try {
      const projects = this.projectManager.listProjects();
      let totalAllocation = 0;

      for (const project of projects) {
        const resources = project.resources || [];
        const resource = resources.find(r => r.id === resourceId);
        if (resource) {
          totalAllocation += resource.allocation || 0;
        }
      }

      return totalAllocation;
    } catch (error) {
      throw error; // Re-throw ProjectManager errors
    }
  }

  /**
   * Check if a resource is overallocated (>100%)
   * @param {string} resourceId - ID of the resource
   * @returns {boolean} True if overallocated
   */
  isResourceOverallocated(resourceId) {
    const totalAllocation = this.getTotalResourceAllocation(resourceId);
    return totalAllocation > 1.0;
  }

  /**
   * Get all resources of a specific type across projects
   * @param {string} type - Resource type ('internal', 'contractor', 'vendor')
   * @returns {Array} Array of resources with project context
   */
  getResourcesByType(type) {
    try {
      const projects = this.projectManager.listProjects();
      const resources = [];

      for (const project of projects) {
        const projectResources = project.resources || [];
        const filteredResources = projectResources
          .filter(resource => resource.type === type)
          .map(resource => ({
            ...resource,
            projectId: project.id,
            projectTitle: project.title
          }));
        resources.push(...filteredResources);
      }

      return resources;
    } catch (error) {
      throw error; // Re-throw ProjectManager errors
    }
  }

  /**
   * Search resources by name across projects
   * @param {string} searchTerm - Term to search for in resource names
   * @returns {Array} Array of matching resources with project context
   */
  searchResourcesByName(searchTerm) {
    if (!searchTerm) {
      return [];
    }

    try {
      const projects = this.projectManager.listProjects();
      const resources = [];
      const lowerSearchTerm = searchTerm.toLowerCase();

      for (const project of projects) {
        const projectResources = project.resources || [];
        const matchingResources = projectResources
          .filter(resource => resource.name.toLowerCase().includes(lowerSearchTerm))
          .map(resource => ({
            ...resource,
            projectId: project.id,
            projectTitle: project.title
          }));
        resources.push(...matchingResources);
      }

      return resources;
    } catch (error) {
      throw error; // Re-throw ProjectManager errors
    }
  }

  /**
   * Validate resource data
   * @private
   * @param {Object} resourceData - Resource data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   */
  _validateResource(resourceData, isUpdate = false) {
    const validTypes = ['internal', 'contractor', 'vendor'];

    // Required fields validation (skip for updates if field not provided)
    if (!isUpdate || resourceData.name !== undefined) {
      if (!resourceData.name) {
        throw new Error('Resource name is required');
      }
    }

    if (!isUpdate || resourceData.type !== undefined) {
      if (!resourceData.type) {
        throw new Error('Resource type is required');
      }
      if (!validTypes.includes(resourceData.type)) {
        throw new Error(`Resource type must be one of: ${validTypes.join(', ')}`);
      }
    }

    if (!isUpdate || resourceData.allocation !== undefined) {
      if (resourceData.allocation === undefined || resourceData.allocation === null) {
        throw new Error('Resource allocation is required');
      }

      const allocation = this._parseNumber(resourceData.allocation, 'allocation');
      if (allocation < 0 || allocation > 1.0) {
        throw new Error('Resource allocation must be between 0.0 and 1.0');
      }
      if (allocation <= 0) {
        throw new Error('Resource allocation must be greater than 0');
      }
    }

    // Optional rate validation
    if (resourceData.rate_per_hour !== undefined) {
      const rate = this._parseNumber(resourceData.rate_per_hour, 'rate_per_hour');
      if (rate < 0) {
        throw new Error('Resource rate_per_hour must be greater than 0');
      }
    }
  }

  /**
   * Parse and validate numeric values
   * @private
   * @param {any} value - Value to parse
   * @param {string} fieldName - Name of the field for error messages
   * @returns {number} Parsed number
   */
  _parseNumber(value, fieldName) {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        throw new Error(`Resource ${fieldName} must be a valid number`);
      }
      return parsed;
    }

    throw new Error(`Resource ${fieldName} must be a valid number`);
  }

  /**
   * Generate unique resource ID
   * @private
   * @returns {string} Generated resource ID
   */
  _generateResourceId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `res-${timestamp}-${random}`;
  }
}