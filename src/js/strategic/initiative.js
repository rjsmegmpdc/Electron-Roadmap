/**
 * Initiative - Executable initiatives that link to epics
 * 
 * Initiatives are concrete programs or projects that execute strategic goals.
 * They link down to Epics and can be synced to external systems (GitHub/ADO).
 */

import { DateUtils, IdUtils, ValidationUtils, ValidationResult } from '../core/utils.js';

export default class Initiative {
  constructor(data = {}) {
    this.id = data.id || IdUtils.generate('init');
    this.goal_id = data.goal_id || ''; // Parent goal
    this.title = data.title || '';
    this.description = data.description || '';
    this.business_case = data.business_case || '';
    this.owner = data.owner || '';
    this.status = data.status || 'planning'; // planning, active, on-hold, completed, cancelled
    
    // Dates in NZ format
    this.start_date = data.start_date || '';
    this.target_date = data.target_date || '';
    this.actual_start_date = data.actual_start_date || '';
    this.actual_end_date = data.actual_end_date || '';
    
    // Initiative categorization
    this.category = data.category || 'transformation'; // transformation, optimization, innovation, compliance
    this.priority = data.priority || 'medium'; // low, medium, high, critical
    this.complexity = data.complexity || 'medium'; // low, medium, high
    this.risk_level = data.risk_level || 'medium';
    
    // Financial information
    this.budget = data.budget || 0;
    this.spent = data.spent || 0;
    this.currency = data.currency || 'NZD';
    
    // Team and resources
    this.team_size = data.team_size || 0;
    this.key_stakeholders = data.key_stakeholders || [];
    this.dependencies = data.dependencies || [];
    
    // Success criteria and outcomes
    this.success_criteria = data.success_criteria || [];
    this.expected_outcomes = data.expected_outcomes || [];
    this.deliverables = data.deliverables || [];
    
    // External sync configuration
    this.github_sync = data.github_sync || false;
    this.github_label = data.github_label || '';
    this.ado_sync = data.ado_sync || false;
    this.ado_area_path = data.ado_area_path || '';
    
    // Metadata
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.created_by = data.created_by || '';
    this.updated_by = data.updated_by || '';
    
    // Progress tracking
    this.milestones = data.milestones || [];
    this.risks = data.risks || [];
    this.issues = data.issues || [];
    
    // Business value
    this.business_value = data.business_value || '';
    this.roi_target = data.roi_target || 0;
    this.benefits_realization = data.benefits_realization || [];
    
    // Validation
    this._validate();
  }

  /**
   * Validate initiative data
   * @private
   */
  _validate() {
    let result = new ValidationResult(true);

    // Title validation
    result = result.combine(
      ValidationUtils.validateString(this.title, 'Initiative title', { 
        required: true, 
        maxLength: 200 
      })
    );

    // Description validation
    result = result.combine(
      ValidationUtils.validateString(this.description, 'Initiative description', { 
        required: true 
      })
    );

    // Goal ID validation
    result = result.combine(
      ValidationUtils.validateString(this.goal_id, 'Goal ID', { 
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

    result = result.combine(
      ValidationUtils.validateDate(this.actual_start_date, 'Actual start date', { 
        required: false 
      })
    );

    result = result.combine(
      ValidationUtils.validateDate(this.actual_end_date, 'Actual end date', { 
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
    const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
    result = result.combine(
      ValidationUtils.validateEnum(this.status, 'Status', validStatuses, { 
        required: true 
      })
    );

    // Category validation
    const validCategories = ['transformation', 'optimization', 'innovation', 'compliance'];
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

    // Complexity validation
    const validComplexities = ['low', 'medium', 'high'];
    result = result.combine(
      ValidationUtils.validateEnum(this.complexity, 'Complexity', validComplexities, { 
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

    // Numeric field validations
    result = result.combine(
      ValidationUtils.validateNumber(this.budget, 'Budget', { 
        min: 0,
        required: false 
      })
    );

    result = result.combine(
      ValidationUtils.validateNumber(this.spent, 'Spent amount', { 
        min: 0,
        required: false 
      })
    );

    result = result.combine(
      ValidationUtils.validateNumber(this.team_size, 'Team size', { 
        min: 0,
        integer: true,
        required: false 
      })
    );

    result.throwIfInvalid('Initiative validation');
  }

  /**
   * Update initiative fields
   * @param {Object} updates - Fields to update
   * @param {string} userId - User making the update
   */
  update(updates, userId = '') {
    const allowedFields = [
      'goal_id', 'title', 'description', 'business_case', 'owner', 'status',
      'start_date', 'target_date', 'actual_start_date', 'actual_end_date',
      'category', 'priority', 'complexity', 'risk_level',
      'budget', 'spent', 'currency', 'team_size', 'key_stakeholders', 'dependencies',
      'success_criteria', 'expected_outcomes', 'deliverables',
      'github_sync', 'github_label', 'ado_sync', 'ado_area_path',
      'milestones', 'risks', 'issues', 'business_value', 'roi_target', 'benefits_realization'
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
   * Add success criteria
   * @param {string} criteria - Success criteria text
   */
  addSuccessCriteria(criteria) {
    this.success_criteria = this.success_criteria || [];
    this.success_criteria.push({
      id: IdUtils.generate('criteria'),
      text: criteria,
      achieved: false,
      target_date: '',
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
   * Add milestone
   * @param {Object} milestone - Milestone object
   */
  addMilestone(milestone) {
    const milestoneWithId = {
      id: milestone.id || IdUtils.generate('milestone'),
      name: milestone.name,
      description: milestone.description || '',
      target_date: milestone.target_date,
      actual_date: milestone.actual_date || '',
      status: milestone.status || 'planned', // planned, in-progress, completed, delayed
      owner: milestone.owner || '',
      dependencies: milestone.dependencies || [],
      deliverables: milestone.deliverables || [],
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
   * Update milestone status
   * @param {string} milestoneId - Milestone ID
   * @param {string} newStatus - New status
   */
  updateMilestoneStatus(milestoneId, newStatus) {
    const validStatuses = ['planned', 'in-progress', 'completed', 'delayed'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Milestone status must be one of: ${validStatuses.join(', ')}`);
    }

    const milestone = this.milestones.find(m => m.id === milestoneId);
    if (milestone) {
      milestone.status = newStatus;
      if (newStatus === 'completed' && !milestone.actual_date) {
        milestone.actual_date = DateUtils.formatNZ(new Date());
      }
      milestone.updated_at = new Date().toISOString();
      this.updated_at = new Date().toISOString();
    } else {
      throw new Error(`Milestone with ID ${milestoneId} not found`);
    }
  }

  /**
   * Add risk
   * @param {Object} risk - Risk object
   */
  addRisk(risk) {
    const riskWithId = {
      id: risk.id || IdUtils.generate('risk'),
      title: risk.title,
      description: risk.description || '',
      probability: risk.probability || 'medium', // low, medium, high
      impact: risk.impact || 'medium', // low, medium, high
      status: risk.status || 'active', // active, mitigated, realized, closed
      mitigation_plan: risk.mitigation_plan || '',
      owner: risk.owner || '',
      identified_date: DateUtils.formatNZ(new Date()),
      created_at: new Date().toISOString()
    };

    this.risks = this.risks || [];
    this.risks.push(riskWithId);
    this.updated_at = new Date().toISOString();
  }

  /**
   * Add issue
   * @param {Object} issue - Issue object
   */
  addIssue(issue) {
    const issueWithId = {
      id: issue.id || IdUtils.generate('issue'),
      title: issue.title,
      description: issue.description || '',
      severity: issue.severity || 'medium', // low, medium, high, critical
      status: issue.status || 'open', // open, in-progress, resolved, closed
      resolution: issue.resolution || '',
      owner: issue.owner || '',
      raised_date: DateUtils.formatNZ(new Date()),
      created_at: new Date().toISOString()
    };

    this.issues = this.issues || [];
    this.issues.push(issueWithId);
    this.updated_at = new Date().toISOString();
  }

  /**
   * Get initiative progress as percentage
   * @returns {number} Progress percentage (0-100)
   */
  getProgress() {
    if (this.status === 'completed') {
      return 100;
    }

    if (this.status === 'cancelled') {
      return 0;
    }

    const components = [];
    let totalWeight = 0;

    // Success criteria progress (30% weight)
    if (this.success_criteria && this.success_criteria.length > 0) {
      const achievedCount = this.success_criteria.filter(c => c.achieved).length;
      const criteriaProgress = (achievedCount / this.success_criteria.length) * 100;
      components.push({ progress: criteriaProgress, weight: 30 });
      totalWeight += 30;
    }

    // Milestones progress (50% weight)
    if (this.milestones && this.milestones.length > 0) {
      let milestoneProgress = 0;
      this.milestones.forEach(m => {
        switch (m.status) {
          case 'completed':
            milestoneProgress += 100;
            break;
          case 'in-progress':
            milestoneProgress += 50;
            break;
          case 'delayed':
            milestoneProgress += 25;
            break;
          default:
            milestoneProgress += 0;
        }
      });
      milestoneProgress = milestoneProgress / this.milestones.length;
      components.push({ progress: milestoneProgress, weight: 50 });
      totalWeight += 50;
    }

    // Deliverables progress (20% weight)
    if (this.deliverables && this.deliverables.length > 0) {
      const completedCount = this.deliverables.filter(d => d.completed).length;
      const deliverablesProgress = (completedCount / this.deliverables.length) * 100;
      components.push({ progress: deliverablesProgress, weight: 20 });
      totalWeight += 20;
    }

    if (components.length === 0) {
      // Fallback: basic status-based progress
      switch (this.status) {
        case 'planning':
          return 10;
        case 'active':
          return 50;
        case 'on-hold':
          return 25;
        default:
          return 0;
      }
    }

    // Calculate weighted average
    const weightedSum = components.reduce((sum, comp) => sum + (comp.progress * comp.weight), 0);
    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Get initiative health status
   * @returns {Object} Health status information
   */
  getHealthStatus() {
    const progress = this.getProgress();
    let overallHealth = 'green';
    let healthScore = 100;
    const issues = [];
    const recommendations = [];

    // Check timeline health
    if (this.target_date) {
      const targetDate = parseDateNZ(this.target_date);
      const startDate = this.start_date ? parseDateNZ(this.start_date) : new Date();
      const now = new Date();
      
      if (now > targetDate && this.status !== 'completed') {
        overallHealth = 'red';
        healthScore -= 50;
        issues.push('Initiative is overdue');
        recommendations.push('Reassess timeline and scope');
      } else {
        const totalDuration = targetDate - startDate;
        const elapsed = now - startDate;
        const expectedProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
        const progressGap = progress - expectedProgress;
        
        if (progressGap < -25) {
          overallHealth = 'red';
          healthScore -= 40;
          issues.push('Significantly behind schedule');
          recommendations.push('Immediate intervention required');
        } else if (progressGap < -15) {
          if (overallHealth !== 'red') {
            overallHealth = 'amber';
          }
          healthScore -= 25;
          issues.push('Behind schedule');
          recommendations.push('Accelerate delivery or adjust scope');
        }
      }
    }

    // Check budget health
    if (this.budget > 0 && this.spent > 0) {
      const spendRate = (this.spent / this.budget) * 100;
      if (spendRate > 100) {
        overallHealth = 'red';
        healthScore -= 30;
        issues.push('Over budget');
        recommendations.push('Review budget and spending controls');
      } else if (spendRate > 90) {
        if (overallHealth !== 'red') {
          overallHealth = 'amber';
        }
        healthScore -= 15;
        issues.push('Approaching budget limit');
      }
    }

    // Check risks
    const highRisks = this.risks.filter(r => 
      r.status === 'active' && 
      (r.probability === 'high' || r.impact === 'high')
    ).length;
    
    if (highRisks > 2) {
      if (overallHealth !== 'red') {
        overallHealth = 'amber';
      }
      healthScore -= 20;
      issues.push(`${highRisks} high-probability or high-impact risks`);
      recommendations.push('Focus on risk mitigation');
    }

    // Check critical issues
    const criticalIssues = this.issues.filter(i => 
      i.status === 'open' && i.severity === 'critical'
    ).length;
    
    if (criticalIssues > 0) {
      overallHealth = 'red';
      healthScore -= 40;
      issues.push(`${criticalIssues} critical open issue(s)`);
      recommendations.push('Resolve critical issues immediately');
    }

    // Check milestone delays
    const delayedMilestones = this.milestones.filter(m => m.status === 'delayed').length;
    if (delayedMilestones > 0) {
      if (overallHealth !== 'red') {
        overallHealth = 'amber';
      }
      healthScore -= 15;
      issues.push(`${delayedMilestones} milestone(s) delayed`);
      recommendations.push('Address milestone delays');
    }

    return {
      status: overallHealth,
      score: Math.max(0, healthScore),
      progress,
      issues,
      recommendations,
      lastUpdated: this.updated_at,
      risks: {
        total: this.risks.length,
        high: highRisks,
        active: this.risks.filter(r => r.status === 'active').length
      },
      openIssues: {
        total: this.issues.filter(i => i.status === 'open').length,
        critical: criticalIssues
      }
    };
  }

  /**
   * Get GitHub sync configuration
   * @returns {Object} GitHub sync configuration
   */
  getGitHubSyncConfig() {
    if (!this.github_sync) {
      return null;
    }

    return {
      enabled: true,
      label: this.github_label || `initiative:${this.id}`,
      prefix: '[Initiative]',
      metadata: {
        rt_initiative_id: this.id,
        initiative_title: this.title,
        goal_id: this.goal_id
      }
    };
  }

  /**
   * Get ADO sync configuration
   * @returns {Object} ADO sync configuration
   */
  getADOSyncConfig() {
    if (!this.ado_sync) {
      return null;
    }

    return {
      enabled: true,
      areaPath: this.ado_area_path || `Initiative\\${this.title}`,
      tags: [`initiative:${this.id}`, `goal:${this.goal_id}`],
      metadata: {
        rt_initiative_id: this.id,
        initiative_title: this.title,
        goal_id: this.goal_id
      }
    };
  }

  /**
   * Convert to plain object for persistence
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      goal_id: this.goal_id,
      title: this.title,
      description: this.description,
      business_case: this.business_case,
      owner: this.owner,
      status: this.status,
      start_date: this.start_date,
      target_date: this.target_date,
      actual_start_date: this.actual_start_date,
      actual_end_date: this.actual_end_date,
      category: this.category,
      priority: this.priority,
      complexity: this.complexity,
      risk_level: this.risk_level,
      budget: this.budget,
      spent: this.spent,
      currency: this.currency,
      team_size: this.team_size,
      key_stakeholders: this.key_stakeholders,
      dependencies: this.dependencies,
      success_criteria: this.success_criteria,
      expected_outcomes: this.expected_outcomes,
      deliverables: this.deliverables,
      github_sync: this.github_sync,
      github_label: this.github_label,
      ado_sync: this.ado_sync,
      ado_area_path: this.ado_area_path,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      updated_by: this.updated_by,
      milestones: this.milestones,
      risks: this.risks,
      issues: this.issues,
      business_value: this.business_value,
      roi_target: this.roi_target,
      benefits_realization: this.benefits_realization
    };
  }

  /**
   * Create Initiative from plain object
   * @param {Object} data - Plain object data
   * @returns {Initiative} Initiative instance
   */
  static fromJSON(data) {
    return new Initiative(data);
  }

  /**
   * Get display summary
   * @returns {Object} Display summary
   */
  getSummary() {
    return {
      id: this.id,
      goal_id: this.goal_id,
      title: this.title,
      status: this.status,
      owner: this.owner,
      category: this.category,
      priority: this.priority,
      progress: this.getProgress(),
      health: this.getHealthStatus().status,
      target_date: this.target_date,
      budget: this.budget,
      spent: this.spent,
      team_size: this.team_size,
      milestone_count: this.milestones?.length || 0,
      open_issues: this.issues?.filter(i => i.status === 'open').length || 0,
      active_risks: this.risks?.filter(r => r.status === 'active').length || 0,
      github_sync: this.github_sync,
      ado_sync: this.ado_sync
    };
  }
}