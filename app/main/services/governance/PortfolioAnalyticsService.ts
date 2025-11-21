/**
 * PortfolioAnalyticsService - advanced analytics and visualizations
 */

import { DB } from '../../db';
import { PortfolioHeatmapData, TrendDataPoint, PortfolioFilter } from '../../types/governance';

export class PortfolioAnalyticsService {
  constructor(private db: DB) {}

  /**
   * Generate portfolio heatmap data (risk vs value)
   */
  async generatePortfolioHeatmap(filters?: PortfolioFilter): Promise<PortfolioHeatmapData[]> {
    let query = `
      SELECT 
        p.id,
        p.name,
        p.governance_status,
        p.strategic_alignment_score,
        COALESCE(SUM(pb.expected_value), 0) as total_value,
        p.budget
      FROM projects p
      LEFT JOIN project_benefits pb ON pb.project_id = p.id
      WHERE p.status NOT IN ('archived')
    `;

    const params: any[] = [];

    if (filters?.status) {
      query += ' AND p.governance_status = ?';
      params.push(filters.status);
    }

    if (filters?.gateId) {
      query += ' AND p.current_gate_id = ?';
      params.push(filters.gateId);
    }

    if (filters?.initiativeId) {
      query += ' AND p.strategic_initiative_id = ?';
      params.push(filters.initiativeId);
    }

    query += ' GROUP BY p.id';

    const projects = this.db.prepare(query).all(...params) as any[];

    return projects.map(p => {
      // Calculate risk score (0-100, higher = more risk)
      const riskScore = this.calculateProjectRiskScore(p.id);
      
      // Normalize value (0-100 scale based on max value)
      const maxValue = Math.max(...projects.map(proj => proj.total_value));
      const valueScore = maxValue > 0 ? (p.total_value / maxValue) * 100 : 0;

      return {
        projectId: p.id,
        projectName: p.name,
        riskScore: Math.round(riskScore),
        valueScore: Math.round(valueScore),
        status: p.governance_status,
        alignmentScore: p.strategic_alignment_score || 0
      };
    });
  }

  /**
   * Get portfolio health trend over time
   */
  async getPortfolioHealthTrend(days: number = 90): Promise<TrendDataPoint[]> {
    // In production, this would query historical snapshots
    // For now, generate mock trend based on current state
    const currentHealth = await this.getCurrentPortfolioHealth();
    const trend: TrendDataPoint[] = [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i <= days; i += 7) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Simulate variance around current health
      const variance = (Math.random() - 0.5) * 10;
      const value = Math.max(0, Math.min(100, currentHealth + variance));

      trend.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value)
      });
    }

    return trend;
  }

  /**
   * Get gate progression analytics
   */
  async getGateProgressionAnalytics(): Promise<{
    averageDaysPerGate: Record<string, number>;
    stuckProjects: Array<{ projectId: string; projectName: string; gateId: string; daysInGate: number }>;
  }> {
    const gates = this.db.prepare('SELECT gate_id, gate_name FROM governance_gates ORDER BY sequence_order').all() as any[];
    
    const averageDaysPerGate: Record<string, number> = {};

    for (const gate of gates) {
      const completedGates = this.db.prepare(`
        SELECT 
          pg.entered_date,
          pg.exited_date
        FROM project_gates pg
        WHERE pg.gate_id = ? AND pg.status = 'completed' AND pg.exited_date IS NOT NULL
      `).all(gate.gate_id) as any[];

      if (completedGates.length > 0) {
        const totalDays = completedGates.reduce((sum, pg) => {
          const entered = new Date(pg.entered_date).getTime();
          const exited = new Date(pg.exited_date).getTime();
          return sum + ((exited - entered) / (1000 * 60 * 60 * 24));
        }, 0);

        averageDaysPerGate[gate.gate_name] = Math.round(totalDays / completedGates.length);
      } else {
        averageDaysPerGate[gate.gate_name] = 0;
      }
    }

    // Find stuck projects (in gate > 60 days)
    const stuckProjects = this.db.prepare(`
      SELECT 
        p.id as projectId,
        p.name as projectName,
        pg.gate_id as gateId,
        CAST((julianday('now') - julianday(pg.entered_date)) AS INTEGER) as daysInGate
      FROM projects p
      JOIN project_gates pg ON pg.project_id = p.id
      WHERE pg.status = 'in-progress'
      AND daysInGate > 60
      ORDER BY daysInGate DESC
    `).all() as any[];

    return { averageDaysPerGate, stuckProjects };
  }

  /**
   * Get compliance analytics
   */
  async getComplianceAnalytics(): Promise<{
    complianceRate: number;
    byPolicy: Record<string, { compliant: number; total: number; rate: number }>;
    topViolators: Array<{ projectId: string; projectName: string; violations: number }>;
  }> {
    const allCompliance = this.db.prepare(`
      SELECT 
        pc.*,
        gp.policy_name,
        p.name as project_name
      FROM policy_compliance pc
      JOIN governance_policies gp ON gp.policy_id = pc.policy_id
      JOIN projects p ON p.id = pc.project_id
      WHERE p.status NOT IN ('archived')
    `).all() as any[];

    const total = allCompliance.length;
    const compliant = allCompliance.filter(c => c.compliance_status === 'compliant' || c.compliance_status === 'waived').length;
    const complianceRate = total > 0 ? Math.round((compliant / total) * 10000) / 100 : 100;

    const byPolicy: Record<string, { compliant: number; total: number; rate: number }> = {};
    
    for (const item of allCompliance) {
      if (!byPolicy[item.policy_name]) {
        byPolicy[item.policy_name] = { compliant: 0, total: 0, rate: 0 };
      }
      byPolicy[item.policy_name].total++;
      if (item.compliance_status === 'compliant' || item.compliance_status === 'waived') {
        byPolicy[item.policy_name].compliant++;
      }
    }

    for (const policy in byPolicy) {
      const data = byPolicy[policy];
      data.rate = data.total > 0 ? Math.round((data.compliant / data.total) * 10000) / 100 : 100;
    }

    // Top violators
    const violationsByProject: Record<string, { projectName: string; violations: number }> = {};
    
    for (const item of allCompliance) {
      if (item.compliance_status === 'non-compliant' || item.compliance_status === 'overdue') {
        if (!violationsByProject[item.project_id]) {
          violationsByProject[item.project_id] = { projectName: item.project_name, violations: 0 };
        }
        violationsByProject[item.project_id].violations++;
      }
    }

    const topViolators = Object.entries(violationsByProject)
      .map(([projectId, data]) => ({ projectId, projectName: data.projectName, violations: data.violations }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 10);

    return { complianceRate, byPolicy, topViolators };
  }

  // ===== PRIVATE HELPERS =====

  private calculateProjectRiskScore(projectId: string): number {
    // Composite risk score based on:
    // - Open escalations (40%)
    // - Compliance violations (30%)
    // - Overdue actions (20%)
    // - Days behind schedule (10%)

    const escalations = this.db.prepare(
      'SELECT escalation_level FROM escalations WHERE project_id = ? AND resolution_status != ?'
    ).all(projectId, 'resolved') as { escalation_level: number }[];

    const escalationScore = escalations.length > 0
      ? Math.min(100, escalations.reduce((sum, e) => sum + (e.escalation_level * 25), 0))
      : 0;

    const violations = this.db.prepare(
      'SELECT COUNT(*) as count FROM policy_compliance WHERE project_id = ? AND compliance_status = ?'
    ).get(projectId, 'non-compliant') as { count: number };

    const complianceScore = Math.min(100, violations.count * 33);

    const overdueActions = this.db.prepare(
      'SELECT COUNT(*) as count FROM governance_actions WHERE project_id = ? AND action_status IN (?, ?) AND due_date < ?'
    ).get(projectId, 'pending', 'in-progress', new Date().toISOString()) as { count: number };

    const actionScore = Math.min(100, overdueActions.count * 20);

    const project = this.db.prepare('SELECT end_date_iso FROM projects WHERE id = ?').get(projectId) as { end_date_iso: string } | undefined;
    let scheduleScore = 0;
    if (project) {
      const endDate = new Date(project.end_date_iso);
      const now = new Date();
      if (endDate < now) {
        const daysOverdue = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24);
        scheduleScore = Math.min(100, daysOverdue * 2);
      }
    }

    return (escalationScore * 0.40) + (complianceScore * 0.30) + (actionScore * 0.20) + (scheduleScore * 0.10);
  }

  private async getCurrentPortfolioHealth(): Promise<number> {
    // Simplified current health calculation
    const projects = this.db.prepare('SELECT governance_status FROM projects WHERE status NOT IN (?)').all('archived') as { governance_status: string }[];
    
    if (projects.length === 0) return 100;

    const statusScores: Record<string, number> = {
      'on-track': 100,
      'at-risk': 60,
      'blocked': 30,
      'escalated': 20
    };

    const totalScore = projects.reduce((sum, p) => sum + (statusScores[p.governance_status] || 75), 0);
    return totalScore / projects.length;
  }
}
