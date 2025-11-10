/**
 * StageGateService - manages project progression through governance gates
 */

import { DB } from '../../db';
import { Gate, ProjectGate, GateProgressionResult } from '../../types/governance';
import { GateRepository, ProjectGateRepository, GateCriteriaComplianceRepository } from '../../repositories/governance-repositories';
import { validateGateOrder, validateGateProgression } from '../../validation/governance-validation';

export class StageGateService {
  private gateRepo: GateRepository;
  private projectGateRepo: ProjectGateRepository;
  private criteriaComplianceRepo: GateCriteriaComplianceRepository;

  constructor(private db: DB) {
    this.gateRepo = new GateRepository(db);
    this.projectGateRepo = new ProjectGateRepository(db);
    this.criteriaComplianceRepo = new GateCriteriaComplianceRepository(db);
  }

  /**
   * Attempt to auto-progress a project to the next gate if all criteria are met.
   */
  async tryAutoProgress(projectId: string): Promise<GateProgressionResult> {
    const settings = this.db.prepare('SELECT value FROM app_settings WHERE key = ?').get('governance.auto_progression') as { value: string } | undefined;
    const auto = settings ? JSON.parse(settings.value) === true : false;
    if (!auto) {
      return { progressed: false, reason: 'Auto-progression disabled' };
    }

    const current = this.projectGateRepo.getCurrentForProject(projectId);
    if (!current) {
      // initialize to first gate
      const firstGate = this.gateRepo.getAll().sort((a,b) => a.sequence_order - b.sequence_order)[0];
      if (!firstGate) return { progressed: false, reason: 'No gates configured' };
      this.projectGateRepo.create({ project_id: projectId, gate_id: firstGate.gate_id, status: 'in-progress' });
      return { progressed: true, newGateId: firstGate.gate_id };
    }

    // validate order and readiness
    const gates = this.gateRepo.getAll().sort((a,b) => a.sequence_order - b.sequence_order);
    const orderValid = validateGateOrder(gates.map(g => g.gate_id));
    if (!orderValid.valid) return { progressed: false, reason: orderValid.message };

    const nextGate = this.getNextGate(gates, current.gate_id);
    if (!nextGate) return { progressed: false, reason: 'Already at final gate' };

    const ready = this.isReadyForNextGate(projectId, current.gate_id);
    if (!ready.valid) return { progressed: false, reason: ready.message };

    // mark current as completed and create next as in-progress
    this.db.transaction(() => {
      this.projectGateRepo.updateStatus(projectId, current.gate_id, 'completed');
      this.projectGateRepo.create({ project_id: projectId, gate_id: nextGate.gate_id, status: 'in-progress' });
      this.db.prepare('UPDATE projects SET current_gate_id = ?, last_gate_review_date = ?, next_gate_review_date = NULL WHERE id = ?')
        .run(nextGate.gate_id, new Date().toISOString(), projectId);
    })();

    return { progressed: true, newGateId: nextGate.gate_id };
  }

  isReadyForNextGate(projectId: string, currentGateId: string): { valid: boolean; message?: string } {
    // Check all mandatory criteria met and approved
    const unmet = this.criteriaComplianceRepo.getUnmetMandatory(projectId, currentGateId);
    if (unmet.length > 0) {
      return { valid: false, message: `Unmet mandatory criteria: ${unmet.map(u => u.criteria_name).join(', ')}` };
    }

    // Additional validation hooks
    const progression = validateGateProgression(projectId, currentGateId, this.db);
    if (!progression.valid) return progression;

    return { valid: true };
  }

  private getNextGate(gates: Gate[], currentGateId: string): Gate | undefined {
    const idx = gates.findIndex(g => g.gate_id === currentGateId);
    if (idx === -1) return undefined;
    return gates[idx + 1];
  }
}
