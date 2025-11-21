/**
 * ForecastingEngine - Advanced Project Forecasting and Scenario Analysis
 * 
 * Provides comprehensive project forecasting including:
 * - Delivery estimation with ETA calculation
 * - Resource capacity analysis and overallocation detection
 * - Cost projections (projected, actual, remaining)
 * - Scenario modeling (baseline, scope changes, resource unavailable)
 * - Confidence rating algorithm (0-5 scale)
 * - Smart warnings and recommendations
 * 
 * Implements PRD Section 6 requirements with sophisticated algorithms.
 */

import DateUtils from './date-utils.js';

export default class ForecastingEngine {
  /**
   * Initialize ForecastingEngine with required dependencies
   * @param {ProjectManager} projectManager - For project data access
   * @param {TaskManager} taskManager - For task data and progress calculations
   * @param {ResourceManager} resourceManager - For resource allocation analysis
   * @param {FinancialManager} financialManager - For cost calculations
   */
  constructor(projectManager, taskManager, resourceManager, financialManager) {
    if (!projectManager) {
      throw new Error('ProjectManager is required');
    }
    if (!taskManager) {
      throw new Error('TaskManager is required');
    }
    if (!resourceManager) {
      throw new Error('ResourceManager is required');
    }
    if (!financialManager) {
      throw new Error('FinancialManager is required');
    }

    this.projectManager = projectManager;
    this.taskManager = taskManager;
    this.resourceManager = resourceManager;
    this.financialManager = financialManager;
  }

  /**
   * Create comprehensive project forecast with scenarios and analysis
   * @param {string} projectId - Project ID to forecast
   * @returns {Object} Complete forecast object with all analysis
   * @throws {Error} If project not found or no forecasting possible
   */
  createProjectForecast(projectId) {
    // Validate project exists
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Get project data
    const tasks = this.taskManager.getProjectTasks(projectId);
    const resources = this.resourceManager.getProjectResources(projectId);
    const progress = this.taskManager.calculateProjectProgress(projectId);
    const actualCosts = this.financialManager.calculateProjectActualCosts(projectId);
    const variance = this.financialManager.calculateVariance(projectId);

    // Check if forecasting is possible
    const incompleteTasks = tasks.filter(task => task.status !== 'completed');
    if (incompleteTasks.length === 0) {
      throw new Error('Cannot forecast: no tasks');
    }

    // Calculate core metrics
    const remainingHours = this._calculateRemainingHours(incompleteTasks);
    const dailyCapacity = this._calculateDailyCapacity(resources);
    const estimatedDays = this._calculateEstimatedDays(remainingHours, dailyCapacity);
    const riskOverallocation = this._assessOverallocationRisk(resources);
    
    // Generate forecast date (today in NZ format)
    const forecastDate = DateUtils.formatNZ(new Date());
    const etaEndDate = DateUtils.addDaysNZ(forecastDate, estimatedDays);

    // Calculate costs
    const costs = this._calculateCostProjections(remainingHours, resources, actualCosts, variance);

    // Generate scenarios
    const scenarios = this._generateScenarios({
      remainingHours,
      dailyCapacity,
      resources,
      costs,
      forecastDate
    });

    // Analyze data quality and generate confidence rating
    const confidenceRating = this._calculateConfidenceRating({
      tasks: incompleteTasks,
      resources,
      riskOverallocation,
      progress,
      variance
    });

    // Generate warnings and recommendations
    const warnings = this._generateWarnings({
      resources,
      riskOverallocation,
      variance,
      progress,
      dailyCapacity
    });
    
    const recommendations = this._generateRecommendations({
      warnings,
      progress,
      variance,
      resources,
      estimatedDays
    });

    return {
      project_id: projectId,
      forecast_date: forecastDate,
      delivery: {
        estimated_days: estimatedDays,
        eta_end_date: etaEndDate
      },
      resources: {
        capacity_hours_per_day: dailyCapacity,
        risk_overallocation: riskOverallocation
      },
      costs,
      scenarios,
      confidence_rating: confidenceRating,
      warnings,
      recommendations
    };
  }

  /**
   * Calculate total remaining hours from incomplete tasks
   * @param {Array} incompleteTasks - Tasks that are not completed
   * @returns {number} Total remaining hours
   * @private
   */
  _calculateRemainingHours(incompleteTasks) {
    return incompleteTasks.reduce((total, task) => {
      return total + (task.effort_hours || 0);
    }, 0);
  }

  /**
   * Calculate daily capacity from all project resources
   * @param {Array} resources - Project resources
   * @returns {number} Total daily capacity in hours
   * @private
   */
  _calculateDailyCapacity(resources) {
    return resources.reduce((total, resource) => {
      // Daily capacity = 8 hours * allocation percentage
      const allocation = resource.allocation || 0;
      return total + (8 * allocation);
    }, 0);
  }

  /**
   * Calculate estimated days to completion
   * @param {number} remainingHours - Remaining work hours
   * @param {number} dailyCapacity - Daily resource capacity
   * @returns {number} Estimated days (minimum 1, maximum 9999)
   * @private
   */
  _calculateEstimatedDays(remainingHours, dailyCapacity) {
    if (dailyCapacity <= 0) {
      return 9999; // Very large number for zero capacity
    }
    
    const estimatedDays = Math.ceil(remainingHours / dailyCapacity);
    return Math.max(1, Math.min(9999, estimatedDays));
  }

  /**
   * Assess resource overallocation risk
   * @param {Array} resources - Project resources
   * @returns {boolean} True if overallocation risk detected
   * @private
   */
  _assessOverallocationRisk(resources) {
    return resources.some(resource => {
      // Check if any resource is over 100% allocated or flagged as overallocated
      return (resource.allocation > 1.0) || 
             this.resourceManager.isResourceOverallocated(resource.id);
    });
  }

  /**
   * Calculate comprehensive cost projections
   * @param {number} remainingHours - Remaining work hours
   * @param {Array} resources - Project resources
   * @param {Object} actualCosts - Current actual costs
   * @param {Object} variance - Budget variance data
   * @returns {Object} Cost projections
   * @private
   */
  _calculateCostProjections(remainingHours, resources, actualCosts, variance) {
    const actualCents = actualCosts.total_actual_cents || 0;
    
    // Estimate remaining costs based on resource rates and remaining hours
    const remainingCents = resources.reduce((total, resource) => {
      const rate = resource.rate_per_hour || 0;
      const allocation = resource.allocation || 0;
      
      // Estimate this resource's share of remaining work
      const resourceHours = remainingHours * allocation;
      return total + (resourceHours * rate);
    }, 0);

    return {
      projected_cents: actualCents + remainingCents,
      actual_cents: actualCents,
      remaining_cents: remainingCents
    };
  }

  /**
   * Generate scenario analysis with different assumptions
   * @param {Object} baseData - Base calculation data
   * @returns {Object} Scenario analysis
   * @private
   */
  _generateScenarios({ remainingHours, dailyCapacity, resources, costs, forecastDate }) {
    // Baseline scenario (current assumptions)
    const baselineDelivery = this._calculateScenarioDelivery(
      remainingHours, dailyCapacity, forecastDate
    );
    const baselineCosts = { ...costs };

    // Scope reduction scenario (20% less work)
    const reducedHours = Math.ceil(remainingHours * 0.8);
    const scopeReductionDelivery = this._calculateScenarioDelivery(
      reducedHours, dailyCapacity, forecastDate
    );
    const scopeReductionCosts = {
      projected_cents: Math.ceil(costs.projected_cents * 0.8),
      actual_cents: costs.actual_cents,
      remaining_cents: Math.ceil(costs.remaining_cents * 0.8)
    };

    // Scope increase scenario (15% more work)
    const increasedHours = Math.ceil(remainingHours * 1.15);
    const scopeIncreaseDelivery = this._calculateScenarioDelivery(
      increasedHours, dailyCapacity, forecastDate
    );
    const scopeIncreaseCosts = {
      projected_cents: Math.ceil(costs.projected_cents * 1.15),
      actual_cents: costs.actual_cents,
      remaining_cents: Math.ceil(costs.remaining_cents * 1.15)
    };

    // Key resource unavailable scenario (reduce capacity by top contributor)
    const reducedCapacity = this._calculateReducedCapacity(resources);
    const keyResourceDelivery = this._calculateScenarioDelivery(
      remainingHours, reducedCapacity, forecastDate
    );
    const keyResourceCosts = {
      projected_cents: Math.ceil(costs.projected_cents * 1.1), // Slightly higher due to delays
      actual_cents: costs.actual_cents,
      remaining_cents: Math.ceil(costs.remaining_cents * 1.1)
    };

    return {
      baseline: {
        delivery: baselineDelivery,
        costs: baselineCosts
      },
      scope_reduction_20: {
        delivery: scopeReductionDelivery,
        costs: scopeReductionCosts
      },
      scope_increase_15: {
        delivery: scopeIncreaseDelivery,
        costs: scopeIncreaseCosts
      },
      key_resource_unavailable: {
        delivery: keyResourceDelivery,
        costs: keyResourceCosts
      }
    };
  }

  /**
   * Calculate delivery metrics for a scenario
   * @param {number} hours - Work hours for scenario
   * @param {number} capacity - Daily capacity for scenario
   * @param {string} forecastDate - Base forecast date
   * @returns {Object} Delivery metrics
   * @private
   */
  _calculateScenarioDelivery(hours, capacity, forecastDate) {
    const estimatedDays = this._calculateEstimatedDays(hours, capacity);
    const etaEndDate = DateUtils.addDaysNZ(forecastDate, estimatedDays);
    
    return {
      estimated_days: estimatedDays,
      eta_end_date: etaEndDate
    };
  }

  /**
   * Calculate reduced capacity for key resource unavailable scenario
   * @param {Array} resources - Project resources
   * @returns {number} Reduced daily capacity
   * @private
   */
  _calculateReducedCapacity(resources) {
    if (resources.length === 0) {
      return 0;
    }

    // Find resource with highest capacity contribution
    const topResource = resources.reduce((max, resource) => {
      const capacity = (resource.allocation || 0) * 8;
      const maxCapacity = (max.allocation || 0) * 8;
      return capacity > maxCapacity ? resource : max;
    });

    // Remove top resource from capacity calculation
    return resources
      .filter(resource => resource.id !== topResource.id)
      .reduce((total, resource) => total + ((resource.allocation || 0) * 8), 0);
  }

  /**
   * Calculate confidence rating based on data quality and risks
   * @param {Object} analysisData - Analysis data for confidence assessment
   * @returns {number} Confidence rating (0-5)
   * @private
   */
  _calculateConfidenceRating({ tasks, resources, riskOverallocation, progress, variance }) {
    let confidence = 5; // Start with maximum confidence

    // Reduce confidence for data quality issues
    if (resources.length === 0) {
      confidence = 0; // Cannot be confident without resources
    } else if (resources.length < 2) {
      confidence -= 1; // Limited resources reduce confidence
    }

    // Reduce confidence for overallocation risks
    if (riskOverallocation) {
      confidence -= 2; // Major risk factor
    }

    // Reduce confidence for very low capacity
    const totalCapacity = resources.reduce((sum, r) => sum + (r.allocation || 0), 0);
    if (totalCapacity < 0.5) {
      confidence -= 1; // Very low total capacity
    }

    // Reduce confidence for budget issues
    if (variance.variance_cents < 0) {
      confidence -= 1; // Over budget reduces confidence
    }

    // Reduce confidence for very low progress with high remaining work
    if (progress.progress < 10 && tasks.length > 10) {
      confidence -= 1; // Large projects with minimal progress
    }

    return Math.max(0, Math.min(5, confidence));
  }

  /**
   * Generate warnings based on analysis results
   * @param {Object} analysisData - Analysis data for warning generation
   * @returns {Array<string>} Array of warning messages
   * @private
   */
  _generateWarnings({ resources, riskOverallocation, variance, progress, dailyCapacity }) {
    const warnings = [];

    // Resource warnings
    if (resources.length === 0) {
      warnings.push('No resources available for project');
    } else if (dailyCapacity < 1.0) {
      warnings.push('Very low resource capacity may cause significant delays');
    }

    if (riskOverallocation) {
      warnings.push('Resource overallocation detected');
    }

    // Budget warnings
    if (variance.variance_cents < 0) {
      warnings.push('Project is over budget');
    } else if (variance.variance_cents < variance.budget_cents * 0.1) {
      warnings.push('Project budget utilization is very high');
    }

    // Progress warnings
    if (progress.progress < 10) {
      warnings.push('Project progress is very low');
    }

    return warnings;
  }

  /**
   * Generate recommendations based on analysis results
   * @param {Object} analysisData - Analysis data for recommendation generation
   * @returns {Array<string>} Array of recommendation messages
   * @private
   */
  _generateRecommendations({ warnings, progress, variance, resources, estimatedDays }) {
    const recommendations = [];

    // Resource recommendations
    if (warnings.includes('No resources available for project')) {
      recommendations.push('Assign resources to enable project delivery');
    } else if (warnings.includes('Very low resource capacity may cause significant delays')) {
      recommendations.push('Consider adding more resources to accelerate delivery');
    }

    if (warnings.includes('Resource overallocation detected')) {
      recommendations.push('Review resource allocations to prevent burnout and delays');
    }

    // Budget recommendations
    if (warnings.includes('Project is over budget')) {
      recommendations.push('Consider scope reduction to control costs');
    } else if (warnings.includes('Project budget utilization is very high')) {
      recommendations.push('Monitor spending closely to avoid budget overrun');
    }

    // Timeline recommendations
    if (estimatedDays > 180) {
      recommendations.push('Consider breaking down large tasks or adding resources for shorter delivery');
    }

    // Progress recommendations
    if (progress.progress < 10) {
      recommendations.push('Focus on completing initial tasks to build momentum');
      // Also recommend more resources if progress is very low and timeline is long
      if (estimatedDays > 90 && resources.length > 0) {
        recommendations.push('Consider adding more resources to accelerate delivery');
      }
    }

    return recommendations;
  }
}