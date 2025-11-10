/**
 * GovernanceService - Main Orchestrator
 * Coordinates all governance operations and calculates portfolio metrics
 */

import { DB } from '../../db';
import {
  PortfolioHealthScore,
  PortfolioDashboard,
  ProjectsByGate,
  ComplianceAlert,
  OpenActionsBreakdown,
  GovernanceSettings,
  ScoreBand
} from '../../types/governance';
import {
  GateRepository,
  ProjectGateRepository,
  PolicyComplianceRepository,
  DecisionRepository,
  ActionRepository,
  BenefitsRepository,
  EscalationRepository
} from '../../repositories/governance-repositories';

export class GovernanceService {
  private gateRepo: GateRepository;
  private projectGateRepo: ProjectGateRepository;
  private complianceRepo: PolicyComplianceRepository;
  private decisionRepo: DecisionRepository;
  private actionRepo: ActionRepository;
  private benefitsRepo: BenefitsRepository;
  private escalationRepo: EscalationRepository;

  constructor(private db: DB) {
    this.gateRepo = new GateRepository(db);
    this.projectGateRepo = new ProjectGateRepository(db);
    this.complianceRepo = new PolicyComplianceRepository(db);
    this.decisionRepo = new DecisionRepository(db);
    this.actionRepo = new ActionRepository(db);
    this.benefitsRepo = new BenefitsRepository(db);
    this.escalationRepo = new EscalationRepository(db);
  }

  /**
   * Calculate portfolio health score
   */
  async calculatePortfolioHealthScore(): Promise<PortfolioHealthScore> {
    const [
      onTimeScore,
      budgetScore,
      riskScore,
      complianceScore,
      benefitsScore
    ] = await Promise.all([
      this.calculateOnTimeDeliveryScore(),
      this.calculateBudgetPerformanceScore(),
      this.calculatePortfolioRiskScore(),
      this.calculateComplianceScore(),
      this.calculateBenefitsRealizationScore()
    ]);

    const weights = this.getHealthScoreWeights();
    
    const totalScore = 
      (onTimeScore * weights.onTime) +
      (budgetScore * weights.budget) +
      (riskScore * weights.risk) +
      (complianceScore * weights.compliance) +
      (benefitsScore * weights.benefits);

    return {
      totalScore: Math.round(totalScore),
      components: {
        onTimeScore: Math.round(onTimeScore),
        budgetScore: Math.round(budgetScore),
        riskScore: Math.round(riskScore),
        complianceScore: Math.round(complianceScore),
        benefitsScore: Math.round(benefitsScore)
      },
      scoreBand: this.getScoreBand(totalScore),
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Get complete portfolio dashboard data
   */
  async getPortfolioDashboardData(): Promise<PortfolioDashboard> {
    const [
      healthScore,
      projectsByGate,
      overdueCompliance,
      openActions,
      recentDecisions,
      escalatedItems,
      benefitsAtRisk
    ] = await Promise.all([
      this.calculatePortfolioHealthScore(),
      this.getProjectDistributionByGate(),
      this.getOverdueComplianceAlert(),
      this.getOpenActionsBreakdown(),
      this.decisionRepo.getRecent(5),
      this.escalationRepo.getOpen(),
      this.getBenefitsAtRiskCount()
    ]);

    return {
      healthScore,
      projectsByGate,
      overdueCompliance,
      openActions,
      recentDecisions,
      escalatedItems: escalatedItems.length,
      benefitsAtRisk
    };
  }

  /**
   * Refresh portfolio metrics (cache invalidation)
   */
  async refreshPortfolioMetrics(): Promise<void> {
    // In a full implementation, this would clear caches
    // For now, metrics are calculated on-demand
    console.log('Portfolio metrics refreshed at', new Date().toISOString());
  }

  // ===== PRIVATE CALCULATION METHODS =====

  private async calculateOnTimeDeliveryScore(): Promise<number> {
    const projects = this.getAllProjects();
    if (projects.length === 0) return 100;

    const now = new Date();
    const onTimeProjects = projects.filter(p => {
      if (p.status === 'done' || p.status === 'archived') return true;
      const endDate = new Date(p.end_date_iso);
      return endDate >= now;
    });

    return (onTimeProjects.length / projects.length) * 100;
  }

  private async calculateBudgetPerformanceScore(): Promise<number> {
    const projects = this.getAllProjects();
    if (projects.length === 0) return 100;

    // Projects within 10% budget variance are considered "on budget"
    const withinBudget = projects.filter(p => {
      // In full implementation, compare actual vs budget from financial tables
      // For now, assume 90% are within budget (placeholder)
      return true;
    });

    return (withinBudget.length / projects.length) * 100;
  }

  private async calculatePortfolioRiskScore(): Promise<number> {
    // Inverse of risk - higher is better
    const escalations = this.escalationRepo.getOpen();
    const criticalEscalations = escalations.filter(e => e.escalation_level >= 4);
    
    if (escalations.length === 0) return 100;
    
    // Score decreases with escalations
    const riskFactor = criticalEscalations.length / escalations.length;
    return Math.max(0, 100 - (riskFactor * 50));
  }

  private async calculateComplianceScore(): Promise<number> {
    const allCompliance = this.db.prepare(
      'SELECT COUNT(*) as total, SUM(CASE WHEN compliance_status IN (?, ?) THEN 1 ELSE 0 END) as compliant FROM policy_compliance'
    ).get('compliant', 'waived') as { total: number; compliant: number };

    if (allCompliance.total === 0) return 100;
    return (allCompliance.compliant / allCompliance.total) * 100;
  }

  private async calculateBenefitsRealizationScore(): Promise<number> {
    const allBenefits = this.db.prepare(
      'SELECT COUNT(*) as total, SUM(CASE WHEN realization_status IN (?, ?) THEN 1 ELSE 0 END) as realized FROM project_benefits'
    ).get('full', 'partial') as { total: number; realized: number };

    if (allBenefits.total === 0) return 100;
    return (allBenefits.realized / allBenefits.total) * 100;
  }

  private getHealthScoreWeights(): GovernanceSettings['portfolio_health_weights'] {
    const settings = this.db.prepare(
      'SELECT value FROM app_settings WHERE key = ?'
    ).get('governance.portfolio_health_weights') as { value: string } | undefined;

    if (settings) {
      return JSON.parse(settings.value);
    }

    // Default weights
    return {
      onTime: 0.30,
      budget: 0.25,
      risk: 0.20,
      compliance: 0.15,
      benefits: 0.10
    };
  }

  private getScoreBand(score: number): ScoreBand {
    if (score >= 90) return { label: 'Excellent', color: 'green' };
    if (score >= 75) return { label: 'Good', color: 'light-green' };
    if (score >= 60) return { label: 'Fair', color: 'yellow' };
    if (score >= 40) return { label: 'Poor', color: 'orange' };
    return { label: 'Critical', color: 'red' };
  }

  private async getProjectDistributionByGate(): Promise<ProjectsByGate> {
    const gates = this.gateRepo.getAll();
    const result: ProjectsByGate = {};

    for (const gate of gates) {
      const projectGates = this.db.prepare(
        'SELECT DISTINCT project_id FROM project_gates WHERE gate_id = ?'
      ).all(gate.gate_id) as { project_id: string }[];

      result[gate.gate_id] = {
        gateName: gate.gate_name,
        count: projectGates.length,
        projects: projectGates.map(pg => pg.project_id)
      };
    }

    return result;
  }

  private async getOverdueComplianceAlert(): Promise<ComplianceAlert> {
    const overdueItems = this.complianceRepo.getOverdue();
    
    // Determine severity based on count
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (overdueItems.length > 20) severity = 'critical';
    else if (overdueItems.length > 10) severity = 'high';
    else if (overdueItems.length > 5) severity = 'medium';

    return {
      count: overdueItems.length,
      severity,
      items: overdueItems
    };
  }

  private async getOpenActionsBreakdown(): Promise<OpenActionsBreakdown> {
    const openActions = this.actionRepo.getOpen();
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const overdue = openActions.filter(a => {
      if (!a.due_date) return false;
      return new Date(a.due_date) < now;
    });

    const dueThisWeek = openActions.filter(a => {
      if (!a.due_date) return false;
      const dueDate = new Date(a.due_date);
      return dueDate >= now && dueDate <= oneWeekFromNow;
    });

    const byPriority = {
      critical: openActions.filter(a => a.priority === 'critical').length,
      high: openActions.filter(a => a.priority === 'high').length,
      medium: openActions.filter(a => a.priority === 'medium').length,
      low: openActions.filter(a => a.priority === 'low').length
    };

    return {
      total: openActions.length,
      overdue: overdue.length,
      dueThisWeek: dueThisWeek.length,
      byPriority
    };
  }

  private async getBenefitsAtRiskCount(): Promise<number> {
    // Benefits are "at risk" if project is blocked/at-risk and benefits are not yet realized
    const atRisk = this.db.prepare(`
      SELECT COUNT(DISTINCT pb.benefit_id) as count
      FROM project_benefits pb
      JOIN projects p ON p.id = pb.project_id
      WHERE pb.realization_status IN ('not-yet', 'partial')
      AND p.governance_status IN ('at-risk', 'blocked', 'escalated')
    `).get() as { count: number };

    return atRisk.count;
  }

  private getAllProjects(): any[] {
    return this.db.prepare(
      'SELECT * FROM projects WHERE status NOT IN (?)'
    ).all('archived') as any[];
  }
}
