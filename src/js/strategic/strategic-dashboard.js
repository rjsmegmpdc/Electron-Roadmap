/**
 * StrategicDashboard - KPI tracking and vision progress monitoring
 * 
 * Provides dashboard functionality for tracking strategic layer progress,
 * health status, and key performance indicators across visions, goals,
 * and initiatives.
 */

export default class StrategicDashboard {
  constructor(strategicManager) {
    this.strategicManager = strategicManager;
  }

  /**
   * Generate executive summary dashboard data
   * @returns {Object} Executive dashboard data
   */
  getExecutiveSummary() {
    const dashboardData = this.strategicManager.getDashboardData();
    
    // Calculate overall health score
    const overallHealth = this._calculateOverallHealth(dashboardData.health);
    
    // Get top risks and issues
    const topRisks = this._getTopRisks();
    const criticalIssues = this._getCriticalIssues();
    
    // Calculate progress trends
    const progressTrends = this._calculateProgressTrends();
    
    return {
      timestamp: new Date().toISOString(),
      overview: {
        totalVisions: dashboardData.summary.visions,
        totalGoals: dashboardData.summary.goals,
        totalInitiatives: dashboardData.summary.initiatives,
        overallHealth,
        averageProgress: Math.round(
          (dashboardData.progress.visions + 
           dashboardData.progress.goals + 
           dashboardData.progress.initiatives) / 3
        )
      },
      healthSummary: {
        visions: dashboardData.health.visions,
        goals: dashboardData.health.goals,
        initiatives: dashboardData.health.initiatives,
        overall: overallHealth
      },
      progress: dashboardData.progress,
      trends: progressTrends,
      alertsAndIssues: {
        topRisks,
        criticalIssues,
        overdueItems: this._getOverdueItems()
      },
      recentActivity: dashboardData.recentActivity,
      kpiSummary: this._getKPISummary()
    };
  }

  /**
   * Get detailed vision health report
   * @param {string} visionId - Vision ID (optional, if null returns all visions)
   * @returns {Object} Vision health report
   */
  getVisionHealthReport(visionId = null) {
    let visions = [];
    
    if (visionId) {
      const vision = this.strategicManager.getVision(visionId);
      if (!vision) {
        throw new Error(`Vision ${visionId} not found`);
      }
      visions = [vision];
    } else {
      visions = this.strategicManager.getVisions();
    }

    const reports = visions.map(vision => {
      const goals = this.strategicManager.getGoalsByVision(vision.id);
      const health = vision.getHealthStatus();
      const progress = vision.getProgress();
      
      // Calculate goal health distribution
      const goalHealthDistribution = this._getHealthDistribution(
        goals.map(g => g.getHealthStatus().status)
      );
      
      // Get KPI status
      const kpiStatus = this._analyzeKPIs(vision.kpis);
      
      return {
        vision: {
          id: vision.id,
          title: vision.title,
          status: vision.status,
          owner: vision.owner,
          strategic_priority: vision.strategic_priority
        },
        health: {
          status: health.status,
          score: health.score,
          issues: health.issues,
          lastUpdated: health.lastUpdated
        },
        progress: {
          percentage: progress,
          criteria: {
            total: vision.success_criteria?.length || 0,
            achieved: vision.success_criteria?.filter(c => c.achieved).length || 0
          }
        },
        goals: {
          total: goals.length,
          healthDistribution: goalHealthDistribution
        },
        kpis: kpiStatus
      };
    });

    return {
      timestamp: new Date().toISOString(),
      reportType: visionId ? 'single-vision' : 'all-visions',
      visionCount: reports.length,
      reports
    };
  }

  /**
   * Get initiative progress and health report
   * @param {Object} filters - Optional filters
   * @returns {Object} Initiative progress report
   */
  getInitiativeProgressReport(filters = {}) {
    const initiatives = this.strategicManager.getInitiatives(filters);
    
    const reports = initiatives.map(initiative => {
      const health = initiative.getHealthStatus();
      const progress = initiative.getProgress();
      
      // Get linked projects (epics) count
      const linkedProjects = this._getLinkedProjectsCount(initiative.id);
      
      // Calculate budget utilization
      const budgetUtilization = initiative.budget > 0 ? 
        Math.round((initiative.spent / initiative.budget) * 100) : 0;
      
      return {
        initiative: {
          id: initiative.id,
          title: initiative.title,
          status: initiative.status,
          owner: initiative.owner,
          category: initiative.category,
          priority: initiative.priority
        },
        health: {
          status: health.status,
          score: health.score,
          issues: health.issues
        },
        progress: {
          percentage: progress,
          milestones: {
            total: initiative.milestones?.length || 0,
            completed: initiative.milestones?.filter(m => m.status === 'completed').length || 0,
            delayed: initiative.milestones?.filter(m => m.status === 'delayed').length || 0
          }
        },
        financial: {
          budget: initiative.budget,
          spent: initiative.spent,
          utilization: budgetUtilization,
          currency: initiative.currency
        },
        delivery: {
          linkedProjects,
          teamSize: initiative.team_size,
          activeRisks: initiative.risks?.filter(r => r.status === 'active').length || 0,
          openIssues: initiative.issues?.filter(i => i.status === 'open').length || 0
        },
        sync: {
          githubEnabled: initiative.github_sync,
          adoEnabled: initiative.ado_sync,
          githubLabel: initiative.github_label,
          adoAreaPath: initiative.ado_area_path
        }
      };
    });

    // Calculate summary statistics
    const summary = this._calculateInitiativeSummary(reports);
    
    return {
      timestamp: new Date().toISOString(),
      filters: filters,
      summary,
      initiativeCount: reports.length,
      reports
    };
  }

  /**
   * Get KPI dashboard across all entities
   * @returns {Object} KPI dashboard data
   */
  getKPIDashboard() {
    const visions = this.strategicManager.getVisions();
    const goals = this.strategicManager.getGoals();
    
    const allKPIs = [];
    
    // Collect KPIs from visions
    visions.forEach(vision => {
      if (vision.kpis && vision.kpis.length > 0) {
        vision.kpis.forEach(kpi => {
          allKPIs.push({
            ...kpi,
            entityType: 'vision',
            entityId: vision.id,
            entityTitle: vision.title
          });
        });
      }
    });
    
    // Collect KPIs from goals
    goals.forEach(goal => {
      if (goal.kpis && goal.kpis.length > 0) {
        goal.kpis.forEach(kpi => {
          allKPIs.push({
            ...kpi,
            entityType: 'goal',
            entityId: goal.id,
            entityTitle: goal.title
          });
        });
      }
    });
    
    // Analyze KPI performance
    const kpiAnalysis = this._analyzeAllKPIs(allKPIs);
    
    return {
      timestamp: new Date().toISOString(),
      totalKPIs: allKPIs.length,
      summary: {
        onTrack: kpiAnalysis.onTrack,
        atRisk: kpiAnalysis.atRisk,
        failing: kpiAnalysis.failing,
        avgPerformance: kpiAnalysis.avgPerformance
      },
      byEntity: {
        visions: kpiAnalysis.byEntityType.vision || 0,
        goals: kpiAnalysis.byEntityType.goal || 0
      },
      topPerformers: kpiAnalysis.topPerformers,
      needsAttention: kpiAnalysis.needsAttention,
      kpis: allKPIs
    };
  }

  /**
   * Generate strategic alignment report
   * @returns {Object} Strategic alignment analysis
   */
  getStrategicAlignmentReport() {
    const visions = this.strategicManager.getVisions({ status: 'active' });
    const alignmentData = [];
    
    visions.forEach(vision => {
      const goals = this.strategicManager.getGoalsByVision(vision.id);
      const visionAlignment = {
        vision: {
          id: vision.id,
          title: vision.title,
          strategic_priority: vision.strategic_priority
        },
        goals: [],
        totalInitiatives: 0,
        totalLinkedProjects: 0,
        overallProgress: vision.getProgress(),
        alignmentScore: 0
      };
      
      goals.forEach(goal => {
        const initiatives = this.strategicManager.getInitiativesByGoal(goal.id);
        let linkedProjects = 0;
        
        initiatives.forEach(initiative => {
          linkedProjects += this._getLinkedProjectsCount(initiative.id);
        });
        
        visionAlignment.goals.push({
          id: goal.id,
          title: goal.title,
          category: goal.category,
          progress: goal.getProgress(),
          initiativeCount: initiatives.length,
          linkedProjects
        });
        
        visionAlignment.totalInitiatives += initiatives.length;
        visionAlignment.totalLinkedProjects += linkedProjects;
      });
      
      // Calculate alignment score based on goal coverage and execution
      visionAlignment.alignmentScore = this._calculateAlignmentScore(visionAlignment);
      alignmentData.push(visionAlignment);
    });
    
    return {
      timestamp: new Date().toISOString(),
      visionCount: alignmentData.length,
      overallAlignment: this._calculateOverallAlignment(alignmentData),
      alignmentData
    };
  }

  /**
   * Export dashboard data to various formats
   * @param {string} reportType - Type of report to export
   * @param {string} format - Export format ('json', 'summary')
   * @param {Object} options - Export options
   * @returns {Object} Exported data
   */
  exportDashboardData(reportType, format = 'json', options = {}) {
    let data;
    
    switch (reportType) {
      case 'executive':
        data = this.getExecutiveSummary();
        break;
      case 'vision-health':
        data = this.getVisionHealthReport(options.visionId);
        break;
      case 'initiative-progress':
        data = this.getInitiativeProgressReport(options.filters);
        break;
      case 'kpi-dashboard':
        data = this.getKPIDashboard();
        break;
      case 'strategic-alignment':
        data = this.getStrategicAlignmentReport();
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
    
    if (format === 'summary') {
      return this._generateSummaryExport(data, reportType);
    }
    
    return {
      exportedAt: new Date().toISOString(),
      reportType,
      format,
      data
    };
  }

  // =================
  // PRIVATE METHODS
  // =================

  /**
   * Calculate overall health score
   * @private
   */
  _calculateOverallHealth(healthData) {
    let totalEntities = 0;
    let healthScore = 0;
    
    Object.values(healthData).forEach(entityHealth => {
      const entities = entityHealth.green + entityHealth.amber + entityHealth.red;
      totalEntities += entities;
      healthScore += (entityHealth.green * 100) + (entityHealth.amber * 60) + (entityHealth.red * 20);
    });
    
    const avgScore = totalEntities > 0 ? healthScore / totalEntities : 100;
    
    if (avgScore >= 80) return { status: 'green', score: avgScore };
    if (avgScore >= 60) return { status: 'amber', score: avgScore };
    return { status: 'red', score: avgScore };
  }

  /**
   * Get top risks across all initiatives
   * @private
   */
  _getTopRisks() {
    const initiatives = this.strategicManager.getInitiatives();
    const allRisks = [];
    
    initiatives.forEach(initiative => {
      if (initiative.risks) {
        initiative.risks.forEach(risk => {
          if (risk.status === 'active') {
            allRisks.push({
              ...risk,
              initiativeId: initiative.id,
              initiativeTitle: initiative.title,
              riskScore: this._calculateRiskScore(risk)
            });
          }
        });
      }
    });
    
    return allRisks
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);
  }

  /**
   * Get critical issues across all initiatives
   * @private
   */
  _getCriticalIssues() {
    const initiatives = this.strategicManager.getInitiatives();
    const criticalIssues = [];
    
    initiatives.forEach(initiative => {
      if (initiative.issues) {
        initiative.issues.forEach(issue => {
          if (issue.status === 'open' && issue.severity === 'critical') {
            criticalIssues.push({
              ...issue,
              initiativeId: initiative.id,
              initiativeTitle: initiative.title
            });
          }
        });
      }
    });
    
    return criticalIssues;
  }

  /**
   * Calculate risk score based on probability and impact
   * @private
   */
  _calculateRiskScore(risk) {
    const probabilityScore = { low: 1, medium: 2, high: 3 }[risk.probability] || 2;
    const impactScore = { low: 1, medium: 2, high: 3 }[risk.impact] || 2;
    return probabilityScore * impactScore;
  }

  /**
   * Get overdue items across all entities
   * @private
   */
  _getOverdueItems() {
    const now = new Date();
    const overdue = [];
    
    // Check vision targets
    this.strategicManager.getVisions().forEach(vision => {
      if (vision.target_date) {
        const targetDate = new Date(vision.target_date.split('/').reverse().join('-'));
        if (targetDate < now && vision.status !== 'achieved') {
          overdue.push({
            type: 'vision',
            id: vision.id,
            title: vision.title,
            dueDate: vision.target_date,
            daysOverdue: Math.ceil((now - targetDate) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });
    
    // Check goal targets
    this.strategicManager.getGoals().forEach(goal => {
      if (goal.target_date) {
        const targetDate = new Date(goal.target_date.split('/').reverse().join('-'));
        if (targetDate < now && goal.status !== 'achieved') {
          overdue.push({
            type: 'goal',
            id: goal.id,
            title: goal.title,
            dueDate: goal.target_date,
            daysOverdue: Math.ceil((now - targetDate) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });
    
    return overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  /**
   * Calculate progress trends
   * @private
   */
  _calculateProgressTrends() {
    // This would typically compare current vs historical data
    // For now, return mock trend data
    return {
      visions: { current: 75, trend: 'up', change: 5 },
      goals: { current: 68, trend: 'up', change: 8 },
      initiatives: { current: 62, trend: 'down', change: -3 }
    };
  }

  /**
   * Get KPI summary across all entities
   * @private
   */
  _getKPISummary() {
    const allKPIs = [];
    
    this.strategicManager.getVisions().forEach(vision => {
      if (vision.kpis) allKPIs.push(...vision.kpis);
    });
    
    this.strategicManager.getGoals().forEach(goal => {
      if (goal.kpis) allKPIs.push(...goal.kpis);
    });
    
    const onTrack = allKPIs.filter(kpi => (kpi.current / kpi.target) >= 0.8).length;
    const atRisk = allKPIs.filter(kpi => {
      const ratio = kpi.current / kpi.target;
      return ratio < 0.8 && ratio >= 0.5;
    }).length;
    const failing = allKPIs.filter(kpi => (kpi.current / kpi.target) < 0.5).length;
    
    return {
      total: allKPIs.length,
      onTrack,
      atRisk,
      failing
    };
  }

  /**
   * Helper method to get health distribution
   * @private
   */
  _getHealthDistribution(healthStatuses) {
    return {
      green: healthStatuses.filter(status => status === 'green').length,
      amber: healthStatuses.filter(status => status === 'amber').length,
      red: healthStatuses.filter(status => status === 'red').length
    };
  }

  /**
   * Analyze KPIs for a specific entity
   * @private
   */
  _analyzeKPIs(kpis) {
    if (!kpis || kpis.length === 0) {
      return { total: 0, onTrack: 0, atRisk: 0, performance: 0 };
    }
    
    let totalPerformance = 0;
    let onTrack = 0;
    let atRisk = 0;
    
    kpis.forEach(kpi => {
      const performance = kpi.target > 0 ? (kpi.current / kpi.target) : 0;
      totalPerformance += performance;
      
      if (performance >= 0.8) {
        onTrack++;
      } else if (performance >= 0.5) {
        atRisk++;
      }
    });
    
    return {
      total: kpis.length,
      onTrack,
      atRisk,
      performance: Math.round((totalPerformance / kpis.length) * 100)
    };
  }

  /**
   * Get count of linked projects for an initiative
   * @private
   */
  _getLinkedProjectsCount(initiativeId) {
    // This would integrate with the project manager
    // For now, return mock data
    return Math.floor(Math.random() * 5) + 1;
  }

  /**
   * Analyze all KPIs across entities
   * @private
   */
  _analyzeAllKPIs(allKPIs) {
    let onTrack = 0, atRisk = 0, failing = 0;
    let totalPerformance = 0;
    const byEntityType = {};
    const topPerformers = [];
    const needsAttention = [];
    
    allKPIs.forEach(kpi => {
      const performance = kpi.target > 0 ? (kpi.current / kpi.target) : 0;
      totalPerformance += performance;
      
      // Count by entity type
      byEntityType[kpi.entityType] = (byEntityType[kpi.entityType] || 0) + 1;
      
      // Categorize performance
      if (performance >= 0.8) {
        onTrack++;
        if (performance >= 1.2) {
          topPerformers.push({ ...kpi, performance });
        }
      } else if (performance >= 0.5) {
        atRisk++;
      } else {
        failing++;
        needsAttention.push({ ...kpi, performance });
      }
    });
    
    return {
      onTrack,
      atRisk,
      failing,
      avgPerformance: allKPIs.length > 0 ? Math.round((totalPerformance / allKPIs.length) * 100) : 0,
      byEntityType,
      topPerformers: topPerformers.sort((a, b) => b.performance - a.performance).slice(0, 5),
      needsAttention: needsAttention.sort((a, b) => a.performance - b.performance).slice(0, 5)
    };
  }

  /**
   * Calculate initiative summary statistics
   * @private
   */
  _calculateInitiativeSummary(reports) {
    const total = reports.length;
    const byStatus = {};
    const byHealth = { green: 0, amber: 0, red: 0 };
    let totalBudget = 0, totalSpent = 0, avgProgress = 0;
    
    reports.forEach(report => {
      byStatus[report.initiative.status] = (byStatus[report.initiative.status] || 0) + 1;
      byHealth[report.health.status]++;
      totalBudget += report.financial.budget;
      totalSpent += report.financial.spent;
      avgProgress += report.progress.percentage;
    });
    
    return {
      total,
      byStatus,
      byHealth,
      financial: {
        totalBudget,
        totalSpent,
        utilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
      },
      avgProgress: total > 0 ? Math.round(avgProgress / total) : 0
    };
  }

  /**
   * Calculate alignment score for a vision
   * @private
   */
  _calculateAlignmentScore(visionData) {
    let score = 0;
    
    // Goal coverage (40% of score)
    const goalCoverage = visionData.goals.length > 0 ? 40 : 0;
    score += goalCoverage;
    
    // Initiative execution (30% of score)
    const initiativeExecution = visionData.totalInitiatives > 0 ? 30 : 0;
    score += initiativeExecution;
    
    // Project delivery (30% of score)
    const projectDelivery = visionData.totalLinkedProjects > 0 ? 30 : 0;
    score += projectDelivery;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate overall alignment across all visions
   * @private
   */
  _calculateOverallAlignment(alignmentData) {
    if (alignmentData.length === 0) return 0;
    
    const totalScore = alignmentData.reduce((sum, data) => sum + data.alignmentScore, 0);
    return Math.round(totalScore / alignmentData.length);
  }

  /**
   * Generate summary export format
   * @private
   */
  _generateSummaryExport(data, reportType) {
    const summary = {
      reportType,
      generatedAt: new Date().toISOString(),
      keyMetrics: {}
    };
    
    switch (reportType) {
      case 'executive':
        summary.keyMetrics = {
          totalVisions: data.overview.totalVisions,
          totalGoals: data.overview.totalGoals,
          totalInitiatives: data.overview.totalInitiatives,
          overallHealth: data.overview.overallHealth.status,
          averageProgress: data.overview.averageProgress
        };
        break;
      case 'kpi-dashboard':
        summary.keyMetrics = {
          totalKPIs: data.totalKPIs,
          onTrack: data.summary.onTrack,
          atRisk: data.summary.atRisk,
          failing: data.summary.failing
        };
        break;
      default:
        summary.keyMetrics = { message: 'Summary not available for this report type' };
    }
    
    return summary;
  }
}