/**
 * Governance Module - Complete Repository Implementations
 */

import { DB } from '../db';
import { GovernanceRepositoryBase } from './governance-repository-base';
import {
  GovernanceGate,
  GateCriteria,
  ProjectGate,
  GateCriteriaCompliance,
  GovernancePolicy,
  PolicyCompliance,
  PolicyWaiver,
  GovernanceDecision,
  GovernanceAction,
  ActionDependency,
  Escalation,
  StrategicInitiative,
  ProjectBenefit,
  GovernanceMeeting,
  GateWithCriteria,
  ProjectGateWithDetails,
  DecisionFilters,
  ActionFilters,
  ComplianceFilters
} from '../types/governance';

// ===== GATE REPOSITORY =====

export class GateRepository extends GovernanceRepositoryBase<GovernanceGate> {
  getTableName() { return 'governance_gates'; }
  getPrimaryKey() { return 'gate_id'; }
  
  mapRowToEntity(row: any): GovernanceGate {
    return {
      gate_id: row.gate_id,
      gate_name: row.gate_name,
      gate_order: row.gate_order,
      gate_description: row.gate_description,
      gate_type: row.gate_type,
      is_mandatory: Boolean(row.is_mandatory),
      template_id: row.template_id,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  getByTemplate(templateId: number): GovernanceGate[] {
    return this.query(
      'SELECT * FROM governance_gates WHERE template_id = ? ORDER BY gate_order',
      [templateId]
    );
  }

  getWithCriteria(gateId: number): GateWithCriteria | null {
    const gate = this.getById(gateId);
    if (!gate) return null;

    const criteriaRepo = new GateCriteriaRepository(this.db);
    const criteria = criteriaRepo.getByGate(gateId);

    return { ...gate, criteria };
  }
}

// ===== GATE CRITERIA REPOSITORY =====

export class GateCriteriaRepository extends GovernanceRepositoryBase<GateCriteria> {
  getTableName() { return 'gate_criteria'; }
  getPrimaryKey() { return 'criteria_id'; }
  
  mapRowToEntity(row: any): GateCriteria {
    return {
      criteria_id: row.criteria_id,
      gate_id: row.gate_id,
      criteria_type: row.criteria_type,
      criteria_name: row.criteria_name,
      criteria_description: row.criteria_description,
      is_mandatory: Boolean(row.is_mandatory),
      validation_rule: row.validation_rule,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  getByGate(gateId: number): GateCriteria[] {
    return this.query(
      'SELECT * FROM gate_criteria WHERE gate_id = ? ORDER BY criteria_id',
      [gateId]
    );
  }

  getMandatoryByGate(gateId: number): GateCriteria[] {
    return this.query(
      'SELECT * FROM gate_criteria WHERE gate_id = ? AND is_mandatory = 1',
      [gateId]
    );
  }
}

// ===== PROJECT GATE REPOSITORY =====

export class ProjectGateRepository extends GovernanceRepositoryBase<ProjectGate> {
  getTableName() { return 'project_gates'; }
  getPrimaryKey() { return 'project_gate_id'; }
  
  mapRowToEntity(row: any): ProjectGate {
    return {
      project_gate_id: row.project_gate_id,
      project_id: row.project_id,
      gate_id: row.gate_id,
      gate_status: row.gate_status,
      scheduled_date: row.scheduled_date,
      review_date: row.review_date,
      outcome: row.outcome,
      conditions: row.conditions,
      reviewer_notes: row.reviewer_notes,
      next_review_date: row.next_review_date,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  getByProject(projectId: string): ProjectGate[] {
    return this.query(
      'SELECT * FROM project_gates WHERE project_id = ? ORDER BY gate_id',
      [projectId]
    );
  }

  getCurrentGate(projectId: string): ProjectGate | null {
    return this.querySingle(
      'SELECT pg.* FROM project_gates pg JOIN projects p ON p.id = pg.project_id WHERE pg.project_id = ? AND pg.gate_id = p.current_gate_id',
      [projectId]
    );
  }

  getWithDetails(projectGateId: number): ProjectGateWithDetails | null {
    const projectGate = this.getById(projectGateId);
    if (!projectGate) return null;

    const gateRepo = new GateRepository(this.db);
    const gate = gateRepo.getById(projectGate.gate_id);
    if (!gate) return null;

    const complianceRepo = new GateCriteriaComplianceRepository(this.db);
    const criteriaCompliance = complianceRepo.getByProjectGate(projectGateId);

    const totalCriteria = criteriaCompliance.length;
    const metCriteria = criteriaCompliance.filter(c => c.status === 'met' || c.status === 'waived').length;
    const completionPercentage = totalCriteria > 0 ? (metCriteria / totalCriteria) * 100 : 0;

    return {
      ...projectGate,
      gate,
      criteriaCompliance,
      completionPercentage: Math.round(completionPercentage)
    };
  }
}

// ===== GATE CRITERIA COMPLIANCE REPOSITORY =====

export class GateCriteriaComplianceRepository extends GovernanceRepositoryBase<GateCriteriaCompliance> {
  getTableName() { return 'gate_criteria_compliance'; }
  getPrimaryKey() { return 'compliance_id'; }
  
  mapRowToEntity(row: any): GateCriteriaCompliance {
    return {
      compliance_id: row.compliance_id,
      project_gate_id: row.project_gate_id,
      criteria_id: row.criteria_id,
      status: row.status,
      evidence_reference: row.evidence_reference,
      completed_date: row.completed_date,
      completed_by: row.completed_by,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  getByProjectGate(projectGateId: number): GateCriteriaCompliance[] {
    return this.query(
      'SELECT * FROM gate_criteria_compliance WHERE project_gate_id = ?',
      [projectGateId]
    );
  }
}

// ===== POLICY REPOSITORY =====

export class PolicyRepository extends GovernanceRepositoryBase<GovernancePolicy> {
  getTableName() { return 'governance_policies'; }
  getPrimaryKey() { return 'policy_id'; }
  
  mapRowToEntity(row: any): GovernancePolicy {
    return {
      policy_id: row.policy_id,
      policy_name: row.policy_name,
      policy_category: row.policy_category,
      policy_description: row.policy_description,
      policy_owner: row.policy_owner,
      effective_date: row.effective_date,
      end_date: row.end_date,
      version: row.version,
      applicability_rules: row.applicability_rules,
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  getActive(): GovernancePolicy[] {
    return this.query('SELECT * FROM governance_policies WHERE is_active = 1 ORDER BY policy_category, policy_name');
  }

  getByCategory(category: string): GovernancePolicy[] {
    return this.query(
      'SELECT * FROM governance_policies WHERE policy_category = ? AND is_active = 1',
      [category]
    );
  }
}

// ===== POLICY COMPLIANCE REPOSITORY =====

export class PolicyComplianceRepository extends GovernanceRepositoryBase<PolicyCompliance> {
  getTableName() { return 'policy_compliance'; }
  getPrimaryKey() { return 'compliance_id'; }
  
  mapRowToEntity(row: any): PolicyCompliance {
    return {
      compliance_id: row.compliance_id,
      project_id: row.project_id,
      policy_id: row.policy_id,
      compliance_status: row.compliance_status,
      due_date: row.due_date,
      evidence_reference: row.evidence_reference,
      last_assessed_date: row.last_assessed_date,
      assessed_by: row.assessed_by,
      remediation_plan: row.remediation_plan,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  getByProject(projectId: string): PolicyCompliance[] {
    return this.query(
      'SELECT * FROM policy_compliance WHERE project_id = ?',
      [projectId]
    );
  }

  getByFilters(filters: ComplianceFilters): PolicyCompliance[] {
    let sql = 'SELECT * FROM policy_compliance WHERE 1=1';
    const params: any[] = [];

    if (filters.projectId) {
      sql += ' AND project_id = ?';
      params.push(filters.projectId);
    }
    if (filters.policyId) {
      sql += ' AND policy_id = ?';
      params.push(filters.policyId);
    }
    if (filters.status) {
      sql += ' AND compliance_status = ?';
      params.push(filters.status);
    }
    if (filters.dueFrom) {
      sql += ' AND due_date >= ?';
      params.push(filters.dueFrom);
    }
    if (filters.dueTo) {
      sql += ' AND due_date <= ?';
      params.push(filters.dueTo);
    }

    sql += ' ORDER BY due_date';
    return this.query(sql, params);
  }

  getOverdue(): PolicyCompliance[] {
    const now = new Date().toISOString();
    return this.query(
      'SELECT * FROM policy_compliance WHERE due_date < ? AND compliance_status NOT IN (?, ?)',
      [now, 'compliant', 'waived']
    );
  }
}

// ===== DECISION REPOSITORY =====

export class DecisionRepository extends GovernanceRepositoryBase<GovernanceDecision> {
  getTableName() { return 'governance_decisions'; }
  getPrimaryKey() { return 'decision_id'; }
  
  mapRowToEntity(row: any): GovernanceDecision {
    return {
      decision_id: row.decision_id,
      decision_title: row.decision_title,
      decision_description: row.decision_description,
      decision_context: row.decision_context,
      decision_rationale: row.decision_rationale,
      decision_date: row.decision_date,
      decision_maker: row.decision_maker,
      decision_type: row.decision_type,
      decision_status: row.decision_status,
      impact_budget: row.impact_budget,
      impact_timeline: row.impact_timeline,
      impact_resources: row.impact_resources,
      affected_projects: row.affected_projects,
      parent_decision_id: row.parent_decision_id,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  getByFilters(filters: DecisionFilters): GovernanceDecision[] {
    let sql = 'SELECT * FROM governance_decisions WHERE 1=1';
    const params: any[] = [];

    if (filters.type) {
      sql += ' AND decision_type = ?';
      params.push(filters.type);
    }
    if (filters.status) {
      sql += ' AND decision_status = ?';
      params.push(filters.status);
    }
    if (filters.maker) {
      sql += ' AND decision_maker = ?';
      params.push(filters.maker);
    }
    if (filters.dateFrom) {
      sql += ' AND decision_date >= ?';
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      sql += ' AND decision_date <= ?';
      params.push(filters.dateTo);
    }

    sql += ' ORDER BY decision_date DESC';
    return this.query(sql, params);
  }

  getRecent(limit: number = 10): GovernanceDecision[] {
    return this.query(
      'SELECT * FROM governance_decisions ORDER BY decision_date DESC LIMIT ?',
      [limit]
    );
  }
}

// ===== ACTION REPOSITORY =====

export class ActionRepository extends GovernanceRepositoryBase<GovernanceAction> {
  getTableName() { return 'governance_actions'; }
  getPrimaryKey() { return 'action_id'; }
  
  mapRowToEntity(row: any): GovernanceAction {
    return {
      action_id: row.action_id,
      action_description: row.action_description,
      action_owner: row.action_owner,
      action_source: row.action_source,
      source_id: row.source_id,
      due_date: row.due_date,
      priority: row.priority,
      action_status: row.action_status,
      completed_date: row.completed_date,
      completion_notes: row.completion_notes,
      is_recurring: Boolean(row.is_recurring),
      recurrence_rule: row.recurrence_rule,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  getByFilters(filters: ActionFilters): GovernanceAction[] {
    let sql = 'SELECT * FROM governance_actions WHERE 1=1';
    const params: any[] = [];

    if (filters.owner) {
      sql += ' AND action_owner = ?';
      params.push(filters.owner);
    }
    if (filters.status) {
      sql += ' AND action_status = ?';
      params.push(filters.status);
    }
    if (filters.priority) {
      sql += ' AND priority = ?';
      params.push(filters.priority);
    }
    if (filters.source) {
      sql += ' AND action_source = ?';
      params.push(filters.source);
    }
    if (filters.dueFrom) {
      sql += ' AND due_date >= ?';
      params.push(filters.dueFrom);
    }
    if (filters.dueTo) {
      sql += ' AND due_date <= ?';
      params.push(filters.dueTo);
    }
    if (filters.isOverdue) {
      const now = new Date().toISOString();
      sql += ' AND due_date < ? AND action_status NOT IN (?, ?)';
      params.push(now, 'completed', 'cancelled');
    }

    sql += ' ORDER BY priority DESC, due_date';
    return this.query(sql, params);
  }

  getOpen(): GovernanceAction[] {
    return this.query(
      'SELECT * FROM governance_actions WHERE action_status IN (?, ?, ?) ORDER BY priority DESC, due_date',
      ['open', 'in-progress', 'blocked']
    );
  }
}

// ===== BENEFITS REPOSITORY =====

export class BenefitsRepository extends GovernanceRepositoryBase<ProjectBenefit> {
  getTableName() { return 'project_benefits'; }
  getPrimaryKey() { return 'benefit_id'; }
  
  mapRowToEntity(row: any): ProjectBenefit {
    return {
      benefit_id: row.benefit_id,
      project_id: row.project_id,
      benefit_type: row.benefit_type,
      benefit_category: row.benefit_category,
      benefit_description: row.benefit_description,
      benefit_owner: row.benefit_owner,
      target_value: row.target_value,
      value_unit: row.value_unit,
      baseline_value: row.baseline_value,
      actual_value: row.actual_value,
      realization_status: row.realization_status,
      realization_date: row.realization_date,
      measurement_notes: row.measurement_notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  getByProject(projectId: string): ProjectBenefit[] {
    return this.query(
      'SELECT * FROM project_benefits WHERE project_id = ?',
      [projectId]
    );
  }

  getTotalTargetValue(projectId: string): number {
    const result = this.db.prepare(
      'SELECT SUM(target_value) as total FROM project_benefits WHERE project_id = ?'
    ).get(projectId) as { total: number | null };
    return result.total || 0;
  }

  getTotalActualValue(projectId: string): number {
    const result = this.db.prepare(
      'SELECT SUM(actual_value) as total FROM project_benefits WHERE project_id = ? AND actual_value IS NOT NULL'
    ).get(projectId) as { total: number | null };
    return result.total || 0;
  }
}

// ===== INITIATIVE REPOSITORY =====

export class InitiativeRepository extends GovernanceRepositoryBase<StrategicInitiative> {
  getTableName() { return 'strategic_initiatives'; }
  getPrimaryKey() { return 'initiative_id'; }
  
  mapRowToEntity(row: any): StrategicInitiative {
    return {
      initiative_id: row.initiative_id,
      initiative_name: row.initiative_name,
      initiative_description: row.initiative_description,
      initiative_owner: row.initiative_owner,
      start_date: row.start_date,
      target_date: row.target_date,
      initiative_status: row.initiative_status,
      kpi_targets: row.kpi_targets,
      progress_percentage: row.progress_percentage,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  getActive(): StrategicInitiative[] {
    return this.query(
      'SELECT * FROM strategic_initiatives WHERE initiative_status = ? ORDER BY start_date',
      ['active']
    );
  }
}

// ===== ESCALATION REPOSITORY =====

export class EscalationRepository extends GovernanceRepositoryBase<Escalation> {
  getTableName() { return 'escalations'; }
  getPrimaryKey() { return 'escalation_id'; }
  
  mapRowToEntity(row: any): Escalation {
    return {
      escalation_id: row.escalation_id,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      escalation_reason: row.escalation_reason,
      escalation_level: row.escalation_level,
      escalated_to: row.escalated_to,
      escalated_date: row.escalated_date,
      escalation_status: row.escalation_status,
      resolution_date: row.resolution_date,
      resolution_notes: row.resolution_notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  getOpen(): Escalation[] {
    return this.query(
      'SELECT * FROM escalations WHERE escalation_status IN (?, ?) ORDER BY escalation_level DESC, escalated_date',
      ['open', 'in-progress']
    );
  }

  getByEntity(entityType: string, entityId: string): Escalation[] {
    return this.query(
      'SELECT * FROM escalations WHERE entity_type = ? AND entity_id = ? ORDER BY escalated_date DESC',
      [entityType, entityId]
    );
  }
}
