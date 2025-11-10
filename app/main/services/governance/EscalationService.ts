/**
 * EscalationService - manages escalations and SLA monitoring
 */

import { DB } from '../../db';
import { Escalation } from '../../types/governance';
import { EscalationRepository } from '../../repositories/governance-repositories';

export class EscalationService {
  private escalationRepo: EscalationRepository;

  constructor(private db: DB) {
    this.escalationRepo = new EscalationRepository(db);
  }

  /**
   * Create an escalation
   */
  async createEscalation(escalation: Omit<Escalation, 'escalation_id' | 'raised_date'>): Promise<string> {
    const escalationId = this.escalationRepo.create(escalation);

    // Update project governance status
    this.updateProjectGovernanceStatus(escalation.project_id, 'escalated');

    return escalationId;
  }

  /**
   * Resolve an escalation
   */
  async resolveEscalation(escalationId: string, resolution: string, resolvedBy: string): Promise<void> {
    const escalation = this.escalationRepo.getById(escalationId);
    if (!escalation) throw new Error(`Escalation ${escalationId} not found`);

    this.db.prepare(`
      UPDATE escalations 
      SET resolution_status = 'resolved', resolution = ?, resolved_date = ?, resolved_by = ?
      WHERE escalation_id = ?
    `).run(resolution, new Date().toISOString(), resolvedBy, escalationId);

    // Check if project has other open escalations
    const openEscalations = this.escalationRepo.getByProject(escalation.project_id).filter(e => e.resolution_status !== 'resolved');
    
    if (openEscalations.length === 0) {
      // No more escalations, reset governance status
      this.updateProjectGovernanceStatus(escalation.project_id, 'on-track');
    }
  }

  /**
   * Auto-escalate based on SLA breaches
   */
  async processAutoEscalations(): Promise<void> {
    const slaHours = this.getEscalationSLAHours();
    
    // Check for SLA breaches on open escalations
    const openEscalations = this.escalationRepo.getOpen();
    const now = Date.now();

    for (const escalation of openEscalations) {
      const raisedTime = new Date(escalation.raised_date).getTime();
      const hoursOpen = (now - raisedTime) / (1000 * 60 * 60);

      const newLevel = this.calculateEscalationLevel(hoursOpen, slaHours);
      
      if (newLevel > escalation.escalation_level) {
        this.db.prepare('UPDATE escalations SET escalation_level = ? WHERE escalation_id = ?')
          .run(newLevel, escalation.escalation_id);
      }
    }

    // Check for new escalation triggers (overdue actions, compliance, etc.)
    await this.checkForNewEscalations();
  }

  /**
   * Get escalation summary for portfolio
   */
  async getPortfolioEscalationSummary(): Promise<{
    total: number;
    byLevel: Record<number, number>;
    byType: Record<string, number>;
    avgResolutionHours: number;
  }> {
    const allEscalations = this.db.prepare('SELECT * FROM escalations').all() as Escalation[];

    const byLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const byType: Record<string, number> = {};

    for (const esc of allEscalations) {
      byLevel[esc.escalation_level] = (byLevel[esc.escalation_level] || 0) + 1;
      byType[esc.escalation_type] = (byType[esc.escalation_type] || 0) + 1;
    }

    const resolved = allEscalations.filter(e => e.resolution_status === 'resolved' && e.resolved_date);
    const avgResolutionHours = resolved.length > 0
      ? resolved.reduce((sum, e) => {
          const raised = new Date(e.raised_date).getTime();
          const resolvedTime = new Date(e.resolved_date!).getTime();
          return sum + ((resolvedTime - raised) / (1000 * 60 * 60));
        }, 0) / resolved.length
      : 0;

    return {
      total: allEscalations.length,
      byLevel,
      byType,
      avgResolutionHours: Math.round(avgResolutionHours * 10) / 10
    };
  }

  // ===== PRIVATE HELPERS =====

  private updateProjectGovernanceStatus(projectId: string, status: string): void {
    this.db.prepare('UPDATE projects SET governance_status = ? WHERE id = ?').run(status, projectId);
  }

  private getEscalationSLAHours(): { level1: number; level2: number; level3: number; level4: number } {
    const settings = this.db.prepare('SELECT value FROM app_settings WHERE key = ?').get('governance.escalation_sla_hours') as { value: string } | undefined;
    
    if (settings) {
      return JSON.parse(settings.value);
    }

    // Defaults
    return { level1: 24, level2: 48, level3: 72, level4: 168 };
  }

  private calculateEscalationLevel(hoursOpen: number, sla: { level1: number; level2: number; level3: number; level4: number }): number {
    if (hoursOpen >= sla.level4) return 4;
    if (hoursOpen >= sla.level3) return 3;
    if (hoursOpen >= sla.level2) return 2;
    return 1;
  }

  private async checkForNewEscalations(): Promise<void> {
    // Check overdue actions
    const overdueActions = this.db.prepare(`
      SELECT ga.*, p.name as project_name
      FROM governance_actions ga
      JOIN projects p ON p.id = ga.project_id
      WHERE ga.action_status IN ('pending', 'in-progress')
      AND ga.due_date < ?
      AND ga.priority IN ('critical', 'high')
    `).all(new Date().toISOString()) as any[];

    for (const action of overdueActions) {
      // Check if escalation already exists
      const existing = this.db.prepare(`
        SELECT escalation_id FROM escalations 
        WHERE project_id = ? AND escalation_type = 'action-overdue' AND resolution_status != 'resolved'
      `).get(action.project_id);

      if (!existing) {
        this.createEscalation({
          project_id: action.project_id,
          escalation_type: 'action-overdue',
          reason: `Critical action overdue: ${action.action_description}`,
          escalation_level: 2,
          raised_by: 'system'
        });
      }
    }
  }
}
