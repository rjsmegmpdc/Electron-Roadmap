/**
 * Project Governance Module - Type Definitions
 * 
 * Complete TypeScript interfaces for all governance entities
 * including gates, policies, decisions, actions, and benefits tracking.
 */

// ===== ENUMS AND UNION TYPES =====

export type GateStatus = 
  | 'not-started'
  | 'in-review'
  | 'passed'
  | 'passed-with-conditions'
  | 'failed'
  | 'deferred';

export type GateType = 
  | 'standard'
  | 'custom'
  | 'security'
  | 'architecture';

export type CriteriaType = 
  | 'document'
  | 'approval'
  | 'quality'
  | 'budget'
  | 'resource'
  | 'dependency';

export type CriteriaStatus = 
  | 'not-started'
  | 'in-progress'
  | 'met'
  | 'not-met'
  | 'waived';

export type PolicyCategory = 
  | 'Security'
  | 'Privacy'
  | 'Architecture'
  | 'Procurement'
  | 'HR'
  | 'Legal'
  | 'Finance';

export type ComplianceStatus = 
  | 'not-started'
  | 'in-progress'
  | 'compliant'
  | 'non-compliant'
  | 'exempt'
  | 'waived';

export type WaiverStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired';

export type DecisionType = 
  | 'strategic'
  | 'tactical'
  | 'operational';

export type DecisionStatus = 
  | 'proposed'
  | 'approved'
  | 'rejected'
  | 'deferred'
  | 'reversed';

export type ActionSource = 
  | 'decision'
  | 'gate-review'
  | 'issue'
  | 'meeting';

export type ActionPriority = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export type ActionStatus = 
  | 'open'
  | 'in-progress'
  | 'blocked'
  | 'completed'
  | 'cancelled';

export type DependencyType = 
  | 'blocks'
  | 'blocked-by';

export type EscalationEntityType = 
  | 'project'
  | 'action'
  | 'issue'
  | 'compliance';

export type EscalationStatus = 
  | 'open'
  | 'in-progress'
  | 'resolved'
  | 'closed';

export type InitiativeStatus = 
  | 'active'
  | 'on-hold'
  | 'completed'
  | 'cancelled';

export type BenefitType = 
  | 'financial'
  | 'non-financial';

export type BenefitCategory = 
  | 'cost-savings'
  | 'revenue'
  | 'efficiency'
  | 'quality'
  | 'risk-reduction';

export type BenefitRealizationStatus = 
  | 'not-yet'
  | 'partial'
  | 'full'
  | 'not-realized';

export type MeetingType = 
  | 'governance-board'
  | 'gate-review'
  | 'steering-committee';

export type GovernanceStatus = 
  | 'on-track'
  | 'at-risk'
  | 'blocked'
  | 'escalated';

// ===== CORE INTERFACES =====

export interface GovernanceGate {
  gate_id: number;
  gate_name: string;
  gate_order: number;
  gate_description: string | null;
  gate_type: GateType;
  is_mandatory: boolean;
  template_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface GateCriteria {
  criteria_id: number;
  gate_id: number;
  criteria_type: CriteriaType;
  criteria_name: string;
  criteria_description: string | null;
  is_mandatory: boolean;
  validation_rule: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectGate {
  project_gate_id: number;
  project_id: string;
  gate_id: number;
  gate_status: GateStatus;
  scheduled_date: string | null;
  review_date: string | null;
  outcome: string | null;
  conditions: string | null;
  reviewer_notes: string | null;
  next_review_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface GateCriteriaCompliance {
  compliance_id: number;
  project_gate_id: number;
  criteria_id: number;
  status: CriteriaStatus;
  evidence_reference: string | null;
  completed_date: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GovernancePolicy {
  policy_id: number;
  policy_name: string;
  policy_category: PolicyCategory;
  policy_description: string | null;
  policy_owner: string | null;
  effective_date: string;
  end_date: string | null;
  version: string;
  applicability_rules: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PolicyCompliance {
  compliance_id: number;
  project_id: string;
  policy_id: number;
  compliance_status: ComplianceStatus;
  due_date: string | null;
  evidence_reference: string | null;
  last_assessed_date: string | null;
  assessed_by: string | null;
  remediation_plan: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyWaiver {
  waiver_id: number;
  compliance_id: number;
  waiver_reason: string;
  requested_by: string;
  requested_date: string;
  approved_by: string | null;
  approved_date: string | null;
  waiver_status: WaiverStatus;
  expiry_date: string | null;
  conditions: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GovernanceDecision {
  decision_id: number;
  decision_title: string;
  decision_description: string | null;
  decision_context: string | null;
  decision_rationale: string | null;
  decision_date: string;
  decision_maker: string;
  decision_type: DecisionType;
  decision_status: DecisionStatus;
  impact_budget: number | null;
  impact_timeline: string | null;
  impact_resources: string | null;
  affected_projects: string | null;
  parent_decision_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface GovernanceAction {
  action_id: number;
  action_description: string;
  action_owner: string;
  action_source: ActionSource;
  source_id: number | null;
  due_date: string | null;
  priority: ActionPriority;
  action_status: ActionStatus;
  completed_date: string | null;
  completion_notes: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionDependency {
  dependency_id: number;
  action_id: number;
  depends_on_action_id: number;
  dependency_type: DependencyType;
  created_at: string;
}

export interface Escalation {
  escalation_id: number;
  entity_type: EscalationEntityType;
  entity_id: string;
  escalation_reason: string;
  escalation_level: number; // 1-5
  escalated_to: string | null;
  escalated_date: string;
  escalation_status: EscalationStatus;
  resolution_date: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StrategicInitiative {
  initiative_id: number;
  initiative_name: string;
  initiative_description: string | null;
  initiative_owner: string | null;
  start_date: string;
  target_date: string;
  initiative_status: InitiativeStatus;
  kpi_targets: string | null; // JSON string
  progress_percentage: number; // 0-100
  created_at: string;
  updated_at: string;
}

export interface ProjectBenefit {
  benefit_id: number;
  project_id: string;
  benefit_type: BenefitType;
  benefit_category: BenefitCategory;
  benefit_description: string;
  benefit_owner: string | null;
  target_value: number;
  value_unit: string;
  baseline_value: number | null;
  actual_value: number | null;
  realization_status: BenefitRealizationStatus;
  realization_date: string | null;
  measurement_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GovernanceMeeting {
  meeting_id: number;
  meeting_type: MeetingType;
  meeting_date: string;
  agenda: string | null;
  attendees: string | null;
  minutes_reference: string | null;
  decisions_made: string | null;
  actions_created: string | null;
  created_at: string;
  updated_at: string;
}

// ===== EXTENDED PROJECT INTERFACE =====

export interface ProjectWithGovernance {
  id: string;
  title: string;
  // ... existing project fields
  current_gate_id: number | null;
  strategic_initiative_id: number | null;
  governance_status: GovernanceStatus;
  last_gate_review_date: string | null;
  next_gate_review_date: string | null;
  strategic_alignment_score: number; // 0-100
  benefit_realization_status: BenefitRealizationStatus;
}

// ===== COMPOSITE/VIEW TYPES =====

export interface GateWithCriteria extends GovernanceGate {
  criteria: GateCriteria[];
}

export interface ProjectGateWithDetails extends ProjectGate {
  gate: GovernanceGate;
  criteriaCompliance: GateCriteriaCompliance[];
  completionPercentage: number;
}

export interface PolicyWithCompliance extends GovernancePolicy {
  compliance?: PolicyCompliance;
  waiver?: PolicyWaiver;
}

export interface DecisionWithActions extends GovernanceDecision {
  actions: GovernanceAction[];
  childDecisions?: GovernanceDecision[];
}

export interface ActionWithDependencies extends GovernanceAction {
  blocks: GovernanceAction[];
  blockedBy: GovernanceAction[];
}

export interface InitiativeWithProjects extends StrategicInitiative {
  projects: ProjectWithGovernance[];
  totalBudget: number;
  alignmentScore: number;
}

export interface ProjectWithBenefits extends ProjectWithGovernance {
  benefits: ProjectBenefit[];
  totalTargetValue: number;
  totalActualValue: number;
  roiPercentage: number;
}

// ===== PORTFOLIO ANALYTICS TYPES =====

export interface PortfolioHealthScore {
  totalScore: number; // 0-100
  components: {
    onTimeScore: number;
    budgetScore: number;
    riskScore: number;
    complianceScore: number;
    benefitsScore: number;
  };
  scoreBand: ScoreBand;
  calculatedAt: string;
}

export interface ScoreBand {
  label: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  color: 'green' | 'light-green' | 'yellow' | 'orange' | 'red';
}

export interface ProjectsByGate {
  [gateId: number]: {
    gateName: string;
    count: number;
    projects: string[]; // project IDs
  };
}

export interface ComplianceAlert {
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  items: PolicyCompliance[];
}

export interface OpenActionsBreakdown {
  total: number;
  overdue: number;
  dueThisWeek: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface PortfolioDashboard {
  healthScore: PortfolioHealthScore;
  projectsByGate: ProjectsByGate;
  overdueCompliance: ComplianceAlert;
  openActions: OpenActionsBreakdown;
  recentDecisions: GovernanceDecision[];
  escalatedItems: number;
  benefitsAtRisk: number;
  riskValueMatrix?: HeatmapData;
  resourceMatrix?: HeatmapData;
  portfolioAlignment?: number;
  benefitsData?: BenefitsRealizationData;
}

export interface HeatmapData {
  rows: string[];
  columns: string[];
  data: number[][];
  colorScale: 'red-yellow-green' | 'blue-white-red';
}

export interface BenefitsRealizationData {
  totalBenefits: number;
  realizedBenefits: number;
  realizationRate: number;
  benefitsByCategory: {
    [category: string]: number;
  };
}

// ===== CALCULATION RESULT TYPES =====

export interface ProjectROI {
  projectId: string;
  projectName: string;
  totalCosts: number;
  totalBenefits: number;
  roiPercentage: number;
  paybackPeriodMonths: number;
  benefitBreakdown: {
    [category: string]: number;
  };
}

export interface PortfolioROI {
  portfolioROI: number;
  totalCosts: number;
  totalBenefits: number;
  projectCount: number;
  topPerformers: ProjectROI[];
}

export interface AlignmentScore {
  projectId: string;
  alignmentScore: number; // 0-100
  components: {
    linkageScore: number;
    valueScore: number;
    timelineScore: number;
  };
}

export interface AutoProgressionResult {
  shouldProgress: boolean;
  reason?: string;
  gatePassed?: number;
  failedChecks?: {
    type: string;
    message: string;
  }[];
}

// ===== FILTER AND QUERY TYPES =====

export interface DecisionFilters {
  type?: DecisionType;
  status?: DecisionStatus;
  dateFrom?: string;
  dateTo?: string;
  maker?: string;
  affectedProject?: string;
}

export interface ActionFilters {
  owner?: string;
  status?: ActionStatus;
  priority?: ActionPriority;
  source?: ActionSource;
  dueFrom?: string;
  dueTo?: string;
  isOverdue?: boolean;
}

export interface ComplianceFilters {
  projectId?: string;
  policyId?: number;
  status?: ComplianceStatus;
  category?: PolicyCategory;
  dueFrom?: string;
  dueTo?: string;
}

export interface BenefitFilters {
  projectId?: string;
  type?: BenefitType;
  category?: BenefitCategory;
  status?: BenefitRealizationStatus;
}

// ===== GOVERNANCE SETTINGS =====

export interface GovernanceSettings {
  portfolio_health_weights: {
    onTime: number;
    budget: number;
    risk: number;
    compliance: number;
    benefits: number;
  };
  escalation_sla_hours: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
  };
  auto_progression_enabled: boolean;
  compliance_alert_days: number;
  gate_review_reminder_days: number;
  default_gate_template: number;
}

// ===== CREATE/UPDATE DTOs =====

export type CreateGovernanceGate = Omit<GovernanceGate, 'gate_id' | 'created_at' | 'updated_at'>;
export type UpdateGovernanceGate = Partial<CreateGovernanceGate>;

export type CreateGateCriteria = Omit<GateCriteria, 'criteria_id' | 'created_at' | 'updated_at'>;
export type UpdateGateCriteria = Partial<CreateGateCriteria>;

export type CreateProjectGate = Omit<ProjectGate, 'project_gate_id' | 'created_at' | 'updated_at'>;
export type UpdateProjectGate = Partial<CreateProjectGate>;

export type CreatePolicyCompliance = Omit<PolicyCompliance, 'compliance_id' | 'created_at' | 'updated_at'>;
export type UpdatePolicyCompliance = Partial<CreatePolicyCompliance>;

export type CreatePolicyWaiver = Omit<PolicyWaiver, 'waiver_id' | 'created_at' | 'updated_at'>;
export type UpdatePolicyWaiver = Partial<CreatePolicyWaiver>;

export type CreateGovernanceDecision = Omit<GovernanceDecision, 'decision_id' | 'created_at' | 'updated_at'>;
export type UpdateGovernanceDecision = Partial<CreateGovernanceDecision>;

export type CreateGovernanceAction = Omit<GovernanceAction, 'action_id' | 'created_at' | 'updated_at'>;
export type UpdateGovernanceAction = Partial<CreateGovernanceAction>;

export type CreateStrategicInitiative = Omit<StrategicInitiative, 'initiative_id' | 'created_at' | 'updated_at'>;
export type UpdateStrategicInitiative = Partial<CreateStrategicInitiative>;

export type CreateProjectBenefit = Omit<ProjectBenefit, 'benefit_id' | 'created_at' | 'updated_at'>;
export type UpdateProjectBenefit = Partial<CreateProjectBenefit>;

export type CreateEscalation = Omit<Escalation, 'escalation_id' | 'created_at' | 'updated_at'>;
export type UpdateEscalation = Partial<CreateEscalation>;

// ===== VALIDATION RESULT TYPES =====

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationReport {
  valid: boolean;
  errors: ValidationError[];
}
