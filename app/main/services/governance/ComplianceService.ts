/**
 * ComplianceService - tracks compliance items and manages waivers
 */

import { DB } from '../../db';
import { PolicyCompliance, PolicyWaiver } from '../../types/governance';
import { PolicyRepository, PolicyComplianceRepository } from '../../repositories/governance-repositories';

export class ComplianceService {
  private policyRepo: PolicyRepository;
  private complianceRepo: PolicyComplianceRepository;

  constructor(private db: DB) {
    this.policyRepo = new PolicyRepository(db);
    this.complianceRepo = new PolicyComplianceRepository(db);
  }

  /**
   * Initialize compliance items for a project based on active policies
   */
  async initializeProjectCompliance(projectId: string): Promise<void> {
    const policies = this.policyRepo.getActive();
    
    for (const policy of policies) {
      // Check if already exists
      const existing = this.db.prepare(
        'SELECT compliance_id FROM policy_compliance WHERE project_id = ? AND policy_id = ?'
      ).get(projectId, policy.policy_id);

      if (!existing) {
        this.complianceRepo.create({
          project_id: projectId,
          policy_id: policy.policy_id,
          compliance_status: 'not-started'
        });
      }
    }
  }

  /**
   * Update compliance status
   */
  async updateComplianceStatus(
    complianceId: string,
    status: PolicyCompliance['compliance_status'],
    evidence?: string,
    assessedBy?: string
  ): Promise<void> {
    const compliance = this.complianceRepo.getById(complianceId);
    if (!compliance) throw new Error(`Compliance item ${complianceId} not found`);

    this.complianceRepo.updateStatus(complianceId, status, evidence);

    if (status === 'compliant' || status === 'non-compliant') {
      this.db.prepare('UPDATE policy_compliance SET assessed_by = ?, assessed_date = ? WHERE compliance_id = ?')
        .run(assessedBy || null, new Date().toISOString(), complianceId);
    }
  }

  /**
   * Create a compliance waiver
   */
  async createWaiver(waiver: Omit<PolicyWaiver, 'waiver_id' | 'requested_date'>): Promise<string> {
    const result = this.db.prepare(`
      INSERT INTO policy_waivers (compliance_id, reason, requested_by, approved_by, approval_date, expiry_date, conditions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      waiver.compliance_id,
      waiver.reason,
      waiver.requested_by,
      waiver.approved_by || null,
      waiver.approval_date || null,
      waiver.expiry_date || null,
      waiver.conditions || null
    );

    // Update compliance to waived
    this.complianceRepo.updateStatus(waiver.compliance_id, 'waived');

    return `waiver-${result.lastInsertRowid}`;
  }

  /**
   * Get overdue compliance items and auto-escalate if needed
   */
  async processOverdueCompliance(): Promise<void> {
    const overdue = this.complianceRepo.getOverdue();
    const alertDays = this.getComplianceAlertDays();

    for (const item of overdue) {
      if (!item.due_date) continue;
      const daysOverdue = Math.floor((Date.now() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue >= alertDays) {
        // Auto-escalate
        this.db.prepare(`
          INSERT INTO escalations (project_id, escalation_type, reason, escalation_level, raised_by)
          VALUES (?, 'compliance', ?, ?, 'system')
        `).run(item.project_id, `Compliance overdue: ${item.policy_name}`, this.getEscalationLevel(daysOverdue));
      }
    }
  }

  private getComplianceAlertDays(): number {
    const settings = this.db.prepare('SELECT value FROM app_settings WHERE key = ?').get('governance.compliance_alert_days') as { value: string } | undefined;
    return settings ? JSON.parse(settings.value) : 7;
  }

  private getEscalationLevel(daysOverdue: number): number {
    if (daysOverdue >= 31) return 4; // Critical
    if (daysOverdue >= 15) return 3; // High
    if (daysOverdue >= 8) return 2; // Medium
    return 1; // Low
  }
}
