/**
 * FinancialManager - Project Financial Management and Cost Analysis
 * 
 * Provides comprehensive financial management including:
 * - Project budget baseline management
 * - Task actual cost calculations based on resource allocations
 * - Project cost roll-ups and variance analysis
 * - Financial treatment handling (CAPEX/OPEX/MIXED)
 * - Resource cost calculations with effort allocation
 * 
 * Implements PRD Section 5 requirements with accurate financial modeling.
 */

export default class FinancialManager {
  /**
   * Initialize FinancialManager with required dependencies
   * @param {ProjectManager} projectManager - For project data access and updates
   * @param {ResourceManager} resourceManager - For resource data and rates
   * @param {TaskManager} taskManager - For task data and effort calculations
   */
  constructor(projectManager, resourceManager, taskManager) {
    if (!projectManager) {
      throw new Error('ProjectManager is required');
    }
    if (!resourceManager) {
      throw new Error('ResourceManager is required');
    }
    if (!taskManager) {
      throw new Error('TaskManager is required');
    }

    this.projectManager = projectManager;
    this.resourceManager = resourceManager;
    this.taskManager = taskManager;
  }

  /**
   * Get project budget information
   * @param {string} projectId - Project ID
   * @returns {Object} Budget information with budget_cents and financial_treatment
   * @throws {Error} If project not found
   */
  getProjectBudget(projectId) {
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    return {
      budget_cents: project.budget_cents,
      financial_treatment: project.financial_treatment
    };
  }

  /**
   * Set project budget and financial treatment
   * @param {string} projectId - Project ID
   * @param {number} budgetCents - Budget in cents (must be >= 0)
   * @param {string} treatment - Financial treatment: CAPEX, OPEX, or MIXED
   * @returns {Object} Updated budget information
   * @throws {Error} If project not found or validation fails
   */
  setProjectBudget(projectId, budgetCents, treatment) {
    // Validate project exists
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Validate budget
    if (budgetCents < 0) {
      throw new Error('Budget must be >= 0');
    }

    // Validate financial treatment
    const validTreatments = ['CAPEX', 'OPEX', 'MIXED'];
    if (!validTreatments.includes(treatment)) {
      throw new Error('Financial treatment must be CAPEX, OPEX, or MIXED');
    }

    // Update project
    const updatedProject = this.projectManager.updateProject(projectId, {
      budget_cents: budgetCents,
      financial_treatment: treatment
    });

    return {
      budget_cents: updatedProject.budget_cents,
      financial_treatment: updatedProject.financial_treatment
    };
  }

  /**
   * Calculate actual cost for a specific task based on assigned resources
   * @param {string} taskId - Task ID
   * @returns {number} Actual cost in cents
   * @throws {Error} If task not found
   */
  calculateTaskActualCostCents(taskId) {
    const task = this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // If no assigned resources, cost is 0
    if (!task.assigned_resources || task.assigned_resources.length === 0) {
      return 0;
    }

    // If no effort hours, cost is 0
    if (!task.effort_hours || task.effort_hours <= 0) {
      return 0;
    }

    let totalCost = 0;

    // Calculate cost for each assigned resource
    for (const resourceId of task.assigned_resources) {
      const resource = this.resourceManager.getResource(task.project_id, resourceId);
      
      // Skip if resource not found or has no rate
      if (!resource || !resource.rate_per_hour || resource.rate_per_hour <= 0) {
        continue;
      }

      // Calculate resource's share of task effort
      const allocation = resource.allocation || 0;
      const resourceHours = task.effort_hours * allocation;
      const resourceCost = resourceHours * resource.rate_per_hour;
      
      totalCost += resourceCost;
    }

    return Math.round(totalCost);
  }

  /**
   * Calculate total actual costs for a project with detailed breakdown
   * @param {string} projectId - Project ID
   * @returns {Object} Cost breakdown with total, by task, and by resource
   */
  calculateProjectActualCosts(projectId) {
    const tasks = this.taskManager.getProjectTasks(projectId);
    
    if (!tasks || tasks.length === 0) {
      return {
        total_actual_cents: 0,
        by_task: [],
        by_resource: []
      };
    }

    const byTask = [];
    const resourceTotals = new Map();
    let totalActualCents = 0;

    // Calculate cost for each task
    for (const task of tasks) {
      const taskCost = this._calculateTaskCostWithResourceTracking(task, resourceTotals);
      
      byTask.push({
        task_id: task.id,
        actual_cents: taskCost
      });
      
      totalActualCents += taskCost;
    }

    // Convert resource map to array
    const byResource = Array.from(resourceTotals.entries()).map(([resourceId, actualCents]) => ({
      resource_id: resourceId,
      actual_cents: Math.round(actualCents)
    }));

    return {
      total_actual_cents: Math.round(totalActualCents),
      by_task: byTask,
      by_resource: byResource
    };
  }

  /**
   * Calculate budget variance for a project
   * @param {string} projectId - Project ID
   * @returns {Object} Variance analysis with budget, actual, and variance amounts
   * @throws {Error} If project not found
   */
  calculateVariance(projectId) {
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const budgetCents = project.budget_cents || 0;
    const actualCosts = this.calculateProjectActualCosts(projectId);
    const actualCents = actualCosts.total_actual_cents;
    const varianceCents = budgetCents - actualCents;

    return {
      budget_cents: budgetCents,
      actual_cents: actualCents,
      variance_cents: varianceCents
    };
  }

  /**
   * Calculate task cost and track resource contributions
   * @param {Object} task - Task object
   * @param {Map} resourceTotals - Map to track resource cost totals
   * @returns {number} Task cost in cents
   * @private
   */
  _calculateTaskCostWithResourceTracking(task, resourceTotals) {
    // If no assigned resources, cost is 0
    if (!task.assigned_resources || task.assigned_resources.length === 0) {
      return 0;
    }

    // If no effort hours, cost is 0
    if (!task.effort_hours || task.effort_hours <= 0) {
      return 0;
    }

    let taskCost = 0;

    // Calculate cost for each assigned resource
    for (const resourceId of task.assigned_resources) {
      const resource = this.resourceManager.getResource(task.project_id, resourceId);
      
      // Skip if resource not found or has no rate
      if (!resource || !resource.rate_per_hour || resource.rate_per_hour <= 0) {
        continue;
      }

      // Calculate resource's share of task effort
      const allocation = resource.allocation || 0;
      const resourceHours = task.effort_hours * allocation;
      const resourceCost = resourceHours * resource.rate_per_hour;
      
      taskCost += resourceCost;
      
      // Track resource total
      const currentTotal = resourceTotals.get(resourceId) || 0;
      resourceTotals.set(resourceId, currentTotal + resourceCost);
    }

    return taskCost;
  }
}