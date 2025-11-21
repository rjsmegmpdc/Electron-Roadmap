/**
 * Vision - Top-level strategic entity
 * 
 * Represents the highest level strategic vision that guides all goals and initiatives.
 * Visions are internal-only and do not sync to external systems.
 */

import { DateUtils, IdUtils, ValidationUtils, ValidationResult } from '../core/utils.js';

export default class Vision {
  constructor(data = {}) {
    this.id = data.id || IdUtils.generate('vision');
    this.title = data.title || '';
    this.description = data.description || '';
    this.timeframe = data.timeframe || ''; // e.g., "FY25-FY27"
    this.owner = data.owner || ''; // Strategic owner/sponsor
    this.status = data.status || 'draft'; // draft, active, achieved, discontinued
    
    // Dates in NZ format
    this.start_date = data.start_date || '';
    this.target_date = data.target_date || '';
    
    // Success criteria and KPIs
    this.success_criteria = data.success_criteria || [];
    this.kpis = data.kpis || [];
    
    // Metadata
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.created_by = data.created_by || '';
    this.updated_by = data.updated_by || '';
    
    // Strategic context
    this.strategic_priority = data.strategic_priority || 'medium'; // low, medium, high, critical
    this.business_value = data.business_value || '';
    this.risk_level = data.risk_level || 'medium';
    
    // Validation
    this._validate();
  }

  /**
   * Validate vision data
   * @private
   */
  _validate() {
    let result = new ValidationResult(true);

    // Title validation
    result = result.combine(
      ValidationUtils.validateString(this.title, 'Vision title', { 
        required: true, 
        maxLength: 200 
      })
    );

    // Description validation
    result = result.combine(
      ValidationUtils.validateString(this.description, 'Vision description', { 
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
    const validStatuses = ['draft', 'active', 'achieved', 'discontinued'];
    result = result.combine(
      ValidationUtils.validateEnum(this.status, 'Status', validStatuses, { 
        required: true 
      })
    );

    // Priority validation
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    result = result.combine(
      ValidationUtils.validateEnum(this.strategic_priority, 'Strategic priority', validPriorities, { 
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

    result.throwIfInvalid('Vision validation');
  }

  /**
   * Update vision fields
   * @param {Object} updates - Fields to update
   * @param {string} userId - User making the update
   */
  update(updates, userId = '') {
    const allowedFields = [
      'title', 'description', 'timeframe', 'owner', 'status',
      'start_date', 'target_date', 'success_criteria', 'kpis',
      'strategic_priority', 'business_value', 'risk_level'
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
   * Add KPI to vision
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
      measurement_frequency: kpi.measurement_frequency || 'quarterly',
      owner: kpi.owner || '',
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
   */
  updateKPI(kpiId, newValue) {
    const kpi = this.kpis.find(k => k.id === kpiId);
    if (kpi) {
      kpi.current = newValue;
      kpi.updated_at = new Date().toISOString();
      this.updated_at = new Date().toISOString();
    } else {
      throw new Error(`KPI with ID ${kpiId} not found`);
    }
  }

  /**
   * Add success criteria
   * @param {string} criteria - Success criteria text
   */
  addSuccessCriteria(criteria) {
    this.success_criteria = this.success_criteria || [];
    this.success_criteria.push({
      id: IdUtils.generate('criteria'),
      text: criteria,
      achieved: false,
      created_at: new Date().toISOString()
    });
    this.updated_at = new Date().toISOString();
  }

  /**
   * Mark success criteria as achieved
   * @param {string} criteriaId - Criteria ID
   */
  markCriteriaAchieved(criteriaId) {
    const criteria = this.success_criteria.find(c => c.id === criteriaId);
    if (criteria) {
      criteria.achieved = true;
      criteria.achieved_at = new Date().toISOString();
      this.updated_at = new Date().toISOString();
    } else {
      throw new Error(`Success criteria with ID ${criteriaId} not found`);
    }
  }

  /**
   * Get vision progress as percentage
   * @returns {number} Progress percentage (0-100)
   */
  getProgress() {
    if (!this.success_criteria || this.success_criteria.length === 0) {
      return 0;
    }

    const achievedCount = this.success_criteria.filter(c => c.achieved).length;
    return Math.round((achievedCount / this.success_criteria.length) * 100);
  }

  /**
   * Get vision health status based on KPIs and progress
   * @returns {Object} Health status information
   */
  getHealthStatus() {
    const progress = this.getProgress();
    const kpiHealth = this._calculateKPIHealth();
    
    let overallHealth = 'green';
    let healthScore = 100;
    const issues = [];

    // Check progress
    if (progress < 25) {
      overallHealth = 'red';
      healthScore -= 30;
      issues.push('Low progress on success criteria');
    } else if (progress < 50) {
      overallHealth = 'amber';
      healthScore -= 15;
      issues.push('Moderate progress on success criteria');
    }

    // Check KPI health
    if (kpiHealth.onTrack < 0.5) {
      overallHealth = 'red';
      healthScore -= 40;
      issues.push(`${Math.round((1 - kpiHealth.onTrack) * 100)}% of KPIs behind target`);
    } else if (kpiHealth.onTrack < 0.75) {
      if (overallHealth !== 'red') {
        overallHealth = 'amber';
      }
      healthScore -= 20;
      issues.push(`${Math.round((1 - kpiHealth.onTrack) * 100)}% of KPIs behind target`);
    }

    // Check timeline
    if (this.target_date) {
      const targetDate = parseDateNZ(this.target_date);
      const now = new Date();
      const daysToTarget = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysToTarget < 0) {
        overallHealth = 'red';
        healthScore -= 50;
        issues.push('Vision target date has passed');
      } else if (daysToTarget < 90 && progress < 80) {
        if (overallHealth !== 'red') {
          overallHealth = 'amber';
        }
        healthScore -= 25;
        issues.push('Risk of missing target date');
      }
    }

    return {
      status: overallHealth,
      score: Math.max(0, healthScore),
      progress,
      kpiHealth,
      issues,
      lastUpdated: this.updated_at
    };
  }

  /**
   * Calculate KPI health
   * @private
   */
  _calculateKPIHealth() {
    if (!this.kpis || this.kpis.length === 0) {
      return { onTrack: 1, total: 0, details: [] };
    }

    let onTrackCount = 0;
    const details = [];

    this.kpis.forEach(kpi => {
      const progress = kpi.current / kpi.target;
      const onTrack = progress >= 0.8; // 80% of target considered on track
      
      if (onTrack) {
        onTrackCount++;
      }

      details.push({
        id: kpi.id,
        name: kpi.name,
        progress,
        onTrack,
        current: kpi.current,
        target: kpi.target,
        unit: kpi.unit
      });
    });

    return {
      onTrack: onTrackCount / this.kpis.length,
      total: this.kpis.length,
      details
    };
  }

  /**
   * Convert to plain object for persistence
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      timeframe: this.timeframe,
      owner: this.owner,
      status: this.status,
      start_date: this.start_date,
      target_date: this.target_date,
      success_criteria: this.success_criteria,
      kpis: this.kpis,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      updated_by: this.updated_by,
      strategic_priority: this.strategic_priority,
      business_value: this.business_value,
      risk_level: this.risk_level
    };
  }

  /**
   * Create Vision from plain object
   * @param {Object} data - Plain object data
   * @returns {Vision} Vision instance
   */
  static fromJSON(data) {
    return new Vision(data);
  }

  /**
   * Get display summary
   * @returns {Object} Display summary
   */
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      status: this.status,
      owner: this.owner,
      strategic_priority: this.strategic_priority,
      progress: this.getProgress(),
      health: this.getHealthStatus().status,
      target_date: this.target_date,
      kpi_count: this.kpis?.length || 0,
      criteria_count: this.success_criteria?.length || 0
    };
  }
}