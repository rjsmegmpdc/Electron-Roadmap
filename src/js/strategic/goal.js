/**
 * Goal - Strategic goals that support visions
 * 
 * Goals are mid-level strategic entities that bridge between high-level visions
 * and executable initiatives. They have measurable outcomes and KPIs.
 */

import { DateUtils, IdUtils, ValidationUtils, ValidationResult } from '../core/utils.js';

export default class Goal {
  constructor(data = {}) {
    this.id = data.id || IdUtils.generate('goal');
    this.vision_id = data.vision_id || ''; // Parent vision
    this.title = data.title || '';
    this.description = data.description || '';
    this.objective = data.objective || ''; // What we're trying to achieve
    this.owner = data.owner || ''; // Goal owner/sponsor
    this.status = data.status || 'draft'; // draft, active, achieved, at-risk, discontinued
    
    // Dates in NZ format
    this.start_date = data.start_date || '';
    this.target_date = data.target_date || '';
    
    // Success metrics and KPIs
    this.success_metrics = data.success_metrics || [];
    this.kpis = data.kpis || [];
    
    // Goal categorization
    this.category = data.category || 'operational'; // strategic, operational, financial, customer
    this.priority = data.priority || 'medium'; // low, medium, high, critical
    this.risk_level = data.risk_level || 'medium';
    
    // Metadata
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.created_by = data.created_by || '';
    this.updated_by = data.updated_by || '';
    
    // Business context
    this.business_value = data.business_value || '';
    this.dependencies = data.dependencies || [];
    this.stakeholders = data.stakeholders || [];
    
    // Progress tracking
    this.milestones = data.milestones || [];
    
    // Validation
    this._validate();
  }

  /**
   * Validate goal data
   * @private
   */
  _validate() {
    let result = new ValidationResult(true);

    // Title validation
    result = result.combine(
      ValidationUtils.validateString(this.title, 'Goal title', { 
        required: true, 
        maxLength: 150 
      })
    );

    // Description validation
    result = result.combine(
      ValidationUtils.validateString(this.description, 'Goal description', { 
        required: true 
      })
    );

    // Vision ID validation
    result = result.combine(
      ValidationUtils.validateString(this.vision_id, 'Vision ID', { 
        required: true 
      })
    );

    // Date validations
    result = result.combine(
      ValidationUtils.validateDate(this.start_date, 'Start date', { 
        required: false 
      })
    );
    
    result = result.combine(
      ValidationUtils.validateDate(this.target_date, 'Target date', { 
        required: false 
      })
    );

    // Date range validation
    if (this.start_date && this.target_date && DateUtils.isValidNZ(this.start_date) && DateUtils.isValidNZ(this.target_date)) {
      if (DateUtils.compareNZ(this.start_date, this.target_date) >= 0) {
        result.addError('Target date must be after start date');
      }
    }

    // Status validation
    const validStatuses = ['draft', 'active', 'achieved', 'at-risk', 'discontinued'];
    result = result.combine(
      ValidationUtils.validateEnum(this.status, 'Status', validStatuses, { 
        required: true 
      })
    );

    // Category validation
    const validCategories = ['strategic', 'operational', 'financial', 'customer'];
    result = result.combine(
      ValidationUtils.validateEnum(this.category, 'Category', validCategories, { 
        required: true 
      })
    );

    // Priority validation
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    result = result.combine(
      ValidationUtils.validateEnum(this.priority, 'Priority', validPriorities, { 
        required: true 
      })
    );

    // Risk level validation
    const validRiskLevels = ['low', 'medium', 'high'];
    result = result.combine(
      ValidationUtils.validateEnum(this.risk_level, 'Risk level', validRiskLevels, { 
        required: true 
      })
    );

    result.throwIfInvalid('Goal validation');
  }

  /**
   * Update goal fields
   * @param {Object} updates - Fields to update
   * @param {string} userId - User making the update
   */
  update(updates, userId = '') {
    const allowedFields = [
      'vision_id', 'title', 'description', 'objective', 'owner', 'status',
      'start_date', 'target_date', 'success_metrics', 'kpis',
      'category', 'priority', 'risk_level', 'business_value',
      'dependencies', 'stakeholders', 'milestones'
    ];

    // Apply updates
    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        this[field] = value;
      }
    }

    // Update metadata
    this.updated_at = new Date().toISOString();
    this.updated_by = userId;

    // Re-validate
    this._validate();
  }

  /**
   * Add KPI to goal
   * @param {Object} kpi - KPI object
   */
  addKPI(kpi) {
    const kpiWithId = {
      id: kpi.id || IdUtils.generate('kpi'),
      name: kpi.name,
      description: kpi.description || '',
      target: kpi.target,
      current: kpi.current || 0,
      unit: kpi.unit || '',
      measurement_frequency: kpi.measurement_frequency || 'monthly',
      owner: kpi.owner || '',
      baseline: kpi.baseline || 0,
      created_at: new Date().toISOString()
    };

    this.kpis = this.kpis || [];
    this.kpis.push(kpiWithId);
    this.updated_at = new Date().toISOString();
  }

  /**
   * Update KPI value
   * @param {string} kpiId - KPI ID
   * @param {number} newValue - New current value
   * @param {string} notes - Optional notes about the update
   */
  updateKPI(kpiId, newValue, notes = '') {
    const kpi = this.kpis.find(k => k.id === kpiId);
    if (kpi) {
      kpi.previous_value = kpi.current;
      kpi.current = newValue;
      kpi.updated_at = new Date().toISOString();
      if (notes) {
        kpi.notes = notes;
      }
      this.updated_at = new Date().toISOString();
    } else {
      throw new Error(`KPI with ID ${kpiId} not found`);
    }
  }

  /**
   * Add success metric
   * @param {Object} metric - Success metric object
   */
  addSuccessMetric(metric) {
    const metricWithId = {
      id: metric.id || IdUtils.generate('metric'),
      name: metric.name,
      description: metric.description || '',
      target: metric.target,
      current: metric.current || 0,
      unit: metric.unit || '',
      achieved: false,
      created_at: new Date().toISOString()
    };

    this.success_metrics = this.success_metrics || [];
    this.success_metrics.push(metricWithId);
    this.updated_at = new Date().toISOString();
  }

  /**
   * Mark success metric as achieved
   * @param {string} metricId - Metric ID
   */
  markMetricAchieved(metricId) {
    const metric = this.success_metrics.find(m => m.id === metricId);
    if (metric) {
      metric.achieved = true;
      metric.achieved_at = new Date().toISOString();
      this.updated_at = new Date().toISOString();
    } else {
      throw new Error(`Success metric with ID ${metricId} not found`);
    }
  }

  /**
   * Add milestone
   * @param {Object} milestone - Milestone object
   */
  addMilestone(milestone) {
    const milestoneWithId = {
      id: milestone.id || IdUtils.generate('milestone'),
      name: milestone.name,
      description: milestone.description || '',
      target_date: milestone.target_date,
      completed: false,
      owner: milestone.owner || '',
      dependencies: milestone.dependencies || [],
      created_at: new Date().toISOString()
    };

    if (milestoneWithId.target_date && !DateUtils.isValidNZ(milestoneWithId.target_date)) {
      throw new Error('Milestone target date must be in NZ format (DD-MM-YYYY)');
    }

    this.milestones = this.milestones || [];
    this.milestones.push(milestoneWithId);
    this.updated_at = new Date().toISOString();
  }

  /**
   * Mark milestone as completed
   * @param {string} milestoneId - Milestone ID
   */
  completeMilestone(milestoneId) {
    const milestone = this.milestones.find(m => m.id === milestoneId);
    if (milestone) {
      milestone.completed = true;
      milestone.completed_at = new Date().toISOString();
      this.updated_at = new Date().toISOString();
    } else {
      throw new Error(`Milestone with ID ${milestoneId} not found`);
    }
  }

  /**
   * Get goal progress as percentage
   * @returns {number} Progress percentage (0-100)
   */
  getProgress() {
    const components = [];
    let totalWeight = 0;

    // Success metrics progress (40% weight)
    if (this.success_metrics && this.success_metrics.length > 0) {
      const achievedCount = this.success_metrics.filter(m => m.achieved).length;
      const metricsProgress = (achievedCount / this.success_metrics.length) * 100;
      components.push({ progress: metricsProgress, weight: 40 });
      totalWeight += 40;
    }

    // Milestones progress (30% weight)
    if (this.milestones && this.milestones.length > 0) {
      const completedCount = this.milestones.filter(m => m.completed).length;
      const milestonesProgress = (completedCount / this.milestones.length) * 100;
      components.push({ progress: milestonesProgress, weight: 30 });
      totalWeight += 30;
    }

    // KPI progress (30% weight)
    if (this.kpis && this.kpis.length > 0) {
      let kpiProgress = 0;
      this.kpis.forEach(kpi => {
        const progress = Math.min(100, (kpi.current / kpi.target) * 100);
        kpiProgress += progress;
      });
      kpiProgress = kpiProgress / this.kpis.length;
      components.push({ progress: kpiProgress, weight: 30 });
      totalWeight += 30;
    }

    if (components.length === 0) {
      return 0;
    }

    // Calculate weighted average
    const weightedSum = components.reduce((sum, comp) => sum + (comp.progress * comp.weight), 0);
    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Get goal health status
   * @returns {Object} Health status information
   */
  getHealthStatus() {
    const progress = this.getProgress();
    let overallHealth = 'green';
    let healthScore = 100;
    const issues = [];
    const recommendations = [];

    // Check progress against timeline
    if (this.target_date) {
      const targetDate = parseDateNZ(this.target_date);
      const startDate = this.start_date ? parseDateNZ(this.start_date) : new Date();
      const now = new Date();
      
      const totalDuration = targetDate - startDate;
      const elapsed = now - startDate;
      const expectedProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
      
      const progressGap = progress - expectedProgress;
      
      if (progressGap < -20) {
        overallHealth = 'red';
        healthScore -= 40;
        issues.push('Significantly behind schedule');
        recommendations.push('Review resource allocation and timeline');
      } else if (progressGap < -10) {
        if (overallHealth !== 'red') {
          overallHealth = 'amber';
        }
        healthScore -= 20;
        issues.push('Behind schedule');
        recommendations.push('Consider accelerating key activities');
      }
    }

    // Check KPI health
    const kpiHealth = this._calculateKPIHealth();
    if (kpiHealth.atRisk > 0.3) {
      overallHealth = 'red';
      healthScore -= 30;
      issues.push(`${Math.round(kpiHealth.atRisk * 100)}% of KPIs at risk`);
      recommendations.push('Focus on underperforming KPIs');
    } else if (kpiHealth.atRisk > 0.1) {
      if (overallHealth !== 'red') {
        overallHealth = 'amber';
      }
      healthScore -= 15;
      issues.push(`${Math.round(kpiHealth.atRisk * 100)}% of KPIs need attention`);
    }

    // Check milestone delays
    const milestoneHealth = this._calculateMilestoneHealth();
    if (milestoneHealth.overdue > 0) {
      if (overallHealth !== 'red') {
        overallHealth = 'amber';
      }
      healthScore -= 25;
      issues.push(`${milestoneHealth.overdue} milestone(s) overdue`);
      recommendations.push('Address overdue milestones');
    }

    // Check risk level impact
    if (this.risk_level === 'high') {
      healthScore -= 10;
      issues.push('High risk goal requires careful monitoring');
    }

    return {
      status: overallHealth,
      score: Math.max(0, healthScore),
      progress,
      kpiHealth,
      milestoneHealth,
      issues,
      recommendations,
      lastUpdated: this.updated_at
    };
  }

  /**
   * Calculate KPI health metrics
   * @private
   */
  _calculateKPIHealth() {
    if (!this.kpis || this.kpis.length === 0) {
      return { onTrack: 1, atRisk: 0, total: 0, details: [] };
    }

    let onTrackCount = 0;
    let atRiskCount = 0;
    const details = [];

    this.kpis.forEach(kpi => {
      const progress = kpi.current / kpi.target;
      const onTrack = progress >= 0.8;
      const atRisk = progress < 0.5;
      
      if (onTrack) onTrackCount++;
      if (atRisk) atRiskCount++;

      details.push({
        id: kpi.id,
        name: kpi.name,
        progress,
        onTrack,
        atRisk,
        current: kpi.current,
        target: kpi.target,
        unit: kpi.unit
      });
    });

    return {
      onTrack: onTrackCount / this.kpis.length,
      atRisk: atRiskCount / this.kpis.length,
      total: this.kpis.length,
      details
    };
  }

  /**
   * Calculate milestone health metrics
   * @private
   */
  _calculateMilestoneHealth() {
    if (!this.milestones || this.milestones.length === 0) {
      return { completed: 0, overdue: 0, upcoming: 0, total: 0 };
    }

    let completedCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;
    const now = new Date();

    this.milestones.forEach(milestone => {
      if (milestone.completed) {
        completedCount++;
      } else if (milestone.target_date) {
        const targetDate = parseDateNZ(milestone.target_date);
        if (targetDate < now) {
          overdueCount++;
        } else {
          const daysToTarget = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
          if (daysToTarget <= 30) {
            upcomingCount++;
          }
        }
      }
    });

    return {
      completed: completedCount,
      overdue: overdueCount,
      upcoming: upcomingCount,
      total: this.milestones.length
    };
  }

  /**
   * Convert to plain object for persistence
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      vision_id: this.vision_id,
      title: this.title,
      description: this.description,
      objective: this.objective,
      owner: this.owner,
      status: this.status,
      start_date: this.start_date,
      target_date: this.target_date,
      success_metrics: this.success_metrics,
      kpis: this.kpis,
      category: this.category,
      priority: this.priority,
      risk_level: this.risk_level,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      updated_by: this.updated_by,
      business_value: this.business_value,
      dependencies: this.dependencies,
      stakeholders: this.stakeholders,
      milestones: this.milestones
    };
  }

  /**
   * Create Goal from plain object
   * @param {Object} data - Plain object data
   * @returns {Goal} Goal instance
   */
  static fromJSON(data) {
    return new Goal(data);
  }

  /**
   * Get display summary
   * @returns {Object} Display summary
   */
  getSummary() {
    return {
      id: this.id,
      vision_id: this.vision_id,
      title: this.title,
      status: this.status,
      owner: this.owner,
      category: this.category,
      priority: this.priority,
      progress: this.getProgress(),
      health: this.getHealthStatus().status,
      target_date: this.target_date,
      kpi_count: this.kpis?.length || 0,
      metrics_count: this.success_metrics?.length || 0,
      milestone_count: this.milestones?.length || 0
    };
  }
}