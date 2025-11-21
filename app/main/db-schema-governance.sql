-- ===== PROJECT GOVERNANCE MODULE - DATABASE SCHEMA =====
-- Version: 7
-- Description: Complete governance framework with portfolio oversight, stage gates,
--              policy compliance, strategic alignment, and benefits realization tracking
-- Author: Governance Module Implementation
-- Date: 2025-11-09

-- ===== GOVERNANCE CORE TABLES =====

-- 1. GOVERNANCE_GATES: Stage gate definitions and templates
CREATE TABLE IF NOT EXISTS governance_gates (
  gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gate_name TEXT NOT NULL,
  gate_order INTEGER NOT NULL,
  gate_description TEXT,
  gate_type TEXT NOT NULL DEFAULT 'standard',
  is_mandatory BOOLEAN NOT NULL DEFAULT 1,
  template_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  CHECK (gate_order > 0),
  CHECK (gate_type IN ('standard', 'custom', 'security', 'architecture'))
);

-- 2. GATE_CRITERIA: Checklist items per gate
CREATE TABLE IF NOT EXISTS gate_criteria (
  criteria_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gate_id INTEGER NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_name TEXT NOT NULL,
  criteria_description TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT 1,
  validation_rule TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (gate_id) REFERENCES governance_gates(gate_id) ON DELETE CASCADE,
  CHECK (criteria_type IN ('document', 'approval', 'quality', 'budget', 'resource', 'dependency'))
);

-- 3. PROJECT_GATES: Project progression through gates
CREATE TABLE IF NOT EXISTS project_gates (
  project_gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  gate_id INTEGER NOT NULL,
  gate_status TEXT NOT NULL DEFAULT 'not-started',
  scheduled_date TEXT,
  review_date TEXT,
  outcome TEXT,
  conditions TEXT,
  reviewer_notes TEXT,
  next_review_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (gate_id) REFERENCES governance_gates(gate_id) ON DELETE CASCADE,
  CHECK (gate_status IN ('not-started', 'in-review', 'passed', 'passed-with-conditions', 'failed', 'deferred')),
  UNIQUE(project_id, gate_id)
);

-- 4. GATE_CRITERIA_COMPLIANCE: Checklist completion per project per gate
CREATE TABLE IF NOT EXISTS gate_criteria_compliance (
  compliance_id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_gate_id INTEGER NOT NULL,
  criteria_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'not-started',
  evidence_reference TEXT,
  completed_date TEXT,
  completed_by TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (project_gate_id) REFERENCES project_gates(project_gate_id) ON DELETE CASCADE,
  FOREIGN KEY (criteria_id) REFERENCES gate_criteria(criteria_id) ON DELETE CASCADE,
  CHECK (status IN ('not-started', 'in-progress', 'met', 'not-met', 'waived')),
  UNIQUE(project_gate_id, criteria_id)
);

-- 5. GOVERNANCE_POLICIES: Policy repository
CREATE TABLE IF NOT EXISTS governance_policies (
  policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_name TEXT NOT NULL,
  policy_category TEXT NOT NULL,
  policy_description TEXT,
  policy_owner TEXT,
  effective_date TEXT NOT NULL,
  end_date TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  applicability_rules TEXT,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  CHECK (policy_category IN ('Security', 'Privacy', 'Architecture', 'Procurement', 'HR', 'Legal', 'Finance'))
);

-- 6. POLICY_COMPLIANCE: Project compliance tracking
CREATE TABLE IF NOT EXISTS policy_compliance (
  compliance_id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  policy_id INTEGER NOT NULL,
  compliance_status TEXT NOT NULL DEFAULT 'not-started',
  due_date TEXT,
  evidence_reference TEXT,
  last_assessed_date TEXT,
  assessed_by TEXT,
  remediation_plan TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (policy_id) REFERENCES governance_policies(policy_id) ON DELETE CASCADE,
  CHECK (compliance_status IN ('not-started', 'in-progress', 'compliant', 'non-compliant', 'exempt', 'waived')),
  UNIQUE(project_id, policy_id)
);

-- 7. POLICY_WAIVERS: Policy exemption tracking
CREATE TABLE IF NOT EXISTS policy_waivers (
  waiver_id INTEGER PRIMARY KEY AUTOINCREMENT,
  compliance_id INTEGER NOT NULL,
  waiver_reason TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_date TEXT NOT NULL,
  approved_by TEXT,
  approved_date TEXT,
  waiver_status TEXT NOT NULL DEFAULT 'pending',
  expiry_date TEXT,
  conditions TEXT,
  review_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (compliance_id) REFERENCES policy_compliance(compliance_id) ON DELETE CASCADE,
  CHECK (waiver_status IN ('pending', 'approved', 'rejected', 'expired'))
);

-- 8. GOVERNANCE_DECISIONS: Decision log
CREATE TABLE IF NOT EXISTS governance_decisions (
  decision_id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_title TEXT NOT NULL,
  decision_description TEXT,
  decision_context TEXT,
  decision_rationale TEXT,
  decision_date TEXT NOT NULL,
  decision_maker TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  decision_status TEXT NOT NULL DEFAULT 'proposed',
  impact_budget REAL,
  impact_timeline TEXT,
  impact_resources TEXT,
  affected_projects TEXT,
  parent_decision_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (parent_decision_id) REFERENCES governance_decisions(decision_id) ON DELETE SET NULL,
  CHECK (decision_type IN ('strategic', 'tactical', 'operational')),
  CHECK (decision_status IN ('proposed', 'approved', 'rejected', 'deferred', 'reversed'))
);

-- 9. GOVERNANCE_ACTIONS: Action items from decisions/reviews
CREATE TABLE IF NOT EXISTS governance_actions (
  action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_description TEXT NOT NULL,
  action_owner TEXT NOT NULL,
  action_source TEXT NOT NULL,
  source_id INTEGER,
  due_date TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  action_status TEXT NOT NULL DEFAULT 'open',
  completed_date TEXT,
  completion_notes TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT 0,
  recurrence_rule TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  CHECK (action_source IN ('decision', 'gate-review', 'issue', 'meeting')),
  CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  CHECK (action_status IN ('open', 'in-progress', 'blocked', 'completed', 'cancelled'))
);

-- 10. ACTION_DEPENDENCIES: Action dependency tracking
CREATE TABLE IF NOT EXISTS action_dependencies (
  dependency_id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_id INTEGER NOT NULL,
  depends_on_action_id INTEGER NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'blocks',
  created_at TEXT NOT NULL,
  
  FOREIGN KEY (action_id) REFERENCES governance_actions(action_id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_action_id) REFERENCES governance_actions(action_id) ON DELETE CASCADE,
  CHECK (dependency_type IN ('blocks', 'blocked-by')),
  CHECK (action_id != depends_on_action_id),
  UNIQUE(action_id, depends_on_action_id, dependency_type)
);

-- 11. ESCALATIONS: Escalation tracking
CREATE TABLE IF NOT EXISTS escalations (
  escalation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  escalation_reason TEXT NOT NULL,
  escalation_level INTEGER NOT NULL,
  escalated_to TEXT,
  escalated_date TEXT NOT NULL,
  escalation_status TEXT NOT NULL DEFAULT 'open',
  resolution_date TEXT,
  resolution_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  CHECK (entity_type IN ('project', 'action', 'issue', 'compliance')),
  CHECK (escalation_level BETWEEN 1 AND 5),
  CHECK (escalation_status IN ('open', 'in-progress', 'resolved', 'closed'))
);

-- 12. STRATEGIC_INITIATIVES: Strategic goals/objectives
CREATE TABLE IF NOT EXISTS strategic_initiatives (
  initiative_id INTEGER PRIMARY KEY AUTOINCREMENT,
  initiative_name TEXT NOT NULL,
  initiative_description TEXT,
  initiative_owner TEXT,
  start_date TEXT NOT NULL,
  target_date TEXT NOT NULL,
  initiative_status TEXT NOT NULL DEFAULT 'active',
  kpi_targets TEXT,
  progress_percentage INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  CHECK (initiative_status IN ('active', 'on-hold', 'completed', 'cancelled')),
  CHECK (progress_percentage BETWEEN 0 AND 100)
);

-- 13. PROJECT_BENEFITS: Benefits tracking per project
CREATE TABLE IF NOT EXISTS project_benefits (
  benefit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  benefit_type TEXT NOT NULL,
  benefit_category TEXT NOT NULL,
  benefit_description TEXT NOT NULL,
  benefit_owner TEXT,
  target_value REAL NOT NULL,
  value_unit TEXT NOT NULL,
  baseline_value REAL,
  actual_value REAL,
  realization_status TEXT NOT NULL DEFAULT 'not-yet',
  realization_date TEXT,
  measurement_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CHECK (benefit_type IN ('financial', 'non-financial')),
  CHECK (benefit_category IN ('cost-savings', 'revenue', 'efficiency', 'quality', 'risk-reduction')),
  CHECK (realization_status IN ('not-yet', 'partial', 'full', 'not-realized'))
);

-- 14. GOVERNANCE_MEETINGS: Meeting tracking
CREATE TABLE IF NOT EXISTS governance_meetings (
  meeting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_type TEXT NOT NULL,
  meeting_date TEXT NOT NULL,
  agenda TEXT,
  attendees TEXT,
  minutes_reference TEXT,
  decisions_made TEXT,
  actions_created TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  CHECK (meeting_type IN ('governance-board', 'gate-review', 'steering-committee'))
);

-- ===== GOVERNANCE INDEXES =====

-- Stage Gate indexes
CREATE INDEX IF NOT EXISTS idx_gates_order ON governance_gates(gate_order);
CREATE INDEX IF NOT EXISTS idx_gates_template ON governance_gates(template_id);
CREATE INDEX IF NOT EXISTS idx_criteria_gate ON gate_criteria(gate_id);
CREATE INDEX IF NOT EXISTS idx_project_gates_project ON project_gates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_gates_gate ON project_gates(gate_id);
CREATE INDEX IF NOT EXISTS idx_project_gates_status ON project_gates(gate_status);
CREATE INDEX IF NOT EXISTS idx_gate_compliance_project_gate ON gate_criteria_compliance(project_gate_id);
CREATE INDEX IF NOT EXISTS idx_gate_compliance_criteria ON gate_criteria_compliance(criteria_id);
CREATE INDEX IF NOT EXISTS idx_gate_compliance_status ON gate_criteria_compliance(status);

-- Policy & Compliance indexes
CREATE INDEX IF NOT EXISTS idx_policies_category ON governance_policies(policy_category, is_active);
CREATE INDEX IF NOT EXISTS idx_policies_active ON governance_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_policy_compliance_project ON policy_compliance(project_id);
CREATE INDEX IF NOT EXISTS idx_policy_compliance_policy ON policy_compliance(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_compliance_status ON policy_compliance(compliance_status);
CREATE INDEX IF NOT EXISTS idx_policy_compliance_due ON policy_compliance(due_date);
CREATE INDEX IF NOT EXISTS idx_waivers_compliance ON policy_waivers(compliance_id);
CREATE INDEX IF NOT EXISTS idx_waivers_status ON policy_waivers(waiver_status);
CREATE INDEX IF NOT EXISTS idx_waivers_expiry ON policy_waivers(expiry_date);

-- Decision & Action indexes
CREATE INDEX IF NOT EXISTS idx_decisions_date ON governance_decisions(decision_date);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON governance_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON governance_decisions(decision_status);
CREATE INDEX IF NOT EXISTS idx_decisions_maker ON governance_decisions(decision_maker);
CREATE INDEX IF NOT EXISTS idx_actions_owner ON governance_actions(action_owner);
CREATE INDEX IF NOT EXISTS idx_actions_source ON governance_actions(action_source, source_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON governance_actions(action_status);
CREATE INDEX IF NOT EXISTS idx_actions_due_date ON governance_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_actions_priority ON governance_actions(priority);
CREATE INDEX IF NOT EXISTS idx_action_deps_action ON action_dependencies(action_id);
CREATE INDEX IF NOT EXISTS idx_action_deps_depends ON action_dependencies(depends_on_action_id);

-- Escalation indexes
CREATE INDEX IF NOT EXISTS idx_escalations_entity ON escalations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_escalations_level ON escalations(escalation_level);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(escalation_status);
CREATE INDEX IF NOT EXISTS idx_escalations_date ON escalations(escalated_date);

-- Strategic Initiatives indexes
CREATE INDEX IF NOT EXISTS idx_initiatives_status ON strategic_initiatives(initiative_status);
CREATE INDEX IF NOT EXISTS idx_initiatives_dates ON strategic_initiatives(start_date, target_date);
CREATE INDEX IF NOT EXISTS idx_initiatives_owner ON strategic_initiatives(initiative_owner);

-- Benefits indexes
CREATE INDEX IF NOT EXISTS idx_benefits_project ON project_benefits(project_id);
CREATE INDEX IF NOT EXISTS idx_benefits_type ON project_benefits(benefit_type);
CREATE INDEX IF NOT EXISTS idx_benefits_category ON project_benefits(benefit_category);
CREATE INDEX IF NOT EXISTS idx_benefits_status ON project_benefits(realization_status);
CREATE INDEX IF NOT EXISTS idx_benefits_realization_date ON project_benefits(realization_date);

-- Meeting indexes
CREATE INDEX IF NOT EXISTS idx_meetings_type ON governance_meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON governance_meetings(meeting_date);

-- ===== END OF GOVERNANCE SCHEMA =====
