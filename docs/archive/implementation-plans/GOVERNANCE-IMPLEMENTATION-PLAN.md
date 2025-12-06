# Project Governance Module - Detailed Implementation Plan

## Overview

This document provides a comprehensive 12-week implementation plan for the Project Governance module in Roadmap-Electron. The module delivers enterprise portfolio management, stage gate processes, policy compliance, and strategic alignment capabilities.

**Total Estimated Timeline**: 12 weeks (60 working days)  
**Team Size Assumption**: 1-2 developers + 1 part-time QA  
**Database Version**: Migration from current version to `user_version 7`

---

## Phase 1: Foundation & Database Schema (Weeks 1-2)

### Week 1: Database Schema Design & Migration

#### Day 1-2: Schema Design & Review
**Tasks**:
- [ ] Review existing database schema and identify integration points
- [ ] Design 14 new governance tables with complete field definitions
- [ ] Design extensions to `projects` table (7 new fields)
- [ ] Define foreign key relationships and cascade rules
- [ ] Design indexes for query optimization
- [ ] Create schema ERD diagram

**Deliverables**:
- `docs/GOVERNANCE_DATABASE_SCHEMA.md` - Complete schema documentation
- `docs/GOVERNANCE_ERD.png` - Entity relationship diagram
- Schema review meeting notes

**Files to Create**:
- `app/main/db-schema-governance.sql` - SQL schema definitions
- `app/main/migrations/migration-v7-governance.ts` - Migration script

---

#### Day 3-4: Migration Script Development
**Tasks**:
- [ ] Create migration script from current version to v7
- [ ] Implement `governance_gates` table creation with default gate definitions
- [ ] Implement `gate_criteria` table with default criteria library
- [ ] Implement `project_gates` table
- [ ] Implement `gate_criteria_compliance` table
- [ ] Implement `governance_policies` table with default policies
- [ ] Implement `policy_compliance` table
- [ ] Implement `policy_waivers` table
- [ ] Implement `governance_decisions` table
- [ ] Implement `governance_actions` table
- [ ] Implement `action_dependencies` table
- [ ] Implement `escalations` table
- [ ] Implement `strategic_initiatives` table
- [ ] Implement `project_benefits` table
- [ ] Implement `governance_meetings` table
- [ ] Add new fields to `projects` table
- [ ] Create all indexes for governance tables
- [ ] Write migration rollback script (downgrade to v6)

**Deliverables**:
- `app/main/migrations/migration-v7-governance.ts` - Complete migration
- `app/main/migrations/rollback-v7-governance.ts` - Rollback script

**Migration Script Structure**:
```typescript
export function migrateToV7(db: Database): void {
  console.log('Starting migration to version 7 (Governance module)...');
  
  db.exec('BEGIN TRANSACTION');
  
  try {
    // 1. Create governance_gates table with default gates
    db.exec(`CREATE TABLE governance_gates (...)`);
    // Insert default gates: Ideation, Business Case, Design, Build, UAT, Deploy, PIR
    
    // 2. Create gate_criteria table with default criteria
    db.exec(`CREATE TABLE gate_criteria (...)`);
    // Insert default criteria for each gate
    
    // 3-14. Create remaining governance tables
    // ...
    
    // 15. Alter projects table
    db.exec(`ALTER TABLE projects ADD COLUMN current_gate_id INTEGER`);
    // Add remaining fields...
    
    // 16. Create indexes
    db.exec(`CREATE INDEX idx_project_gates_status ON project_gates(gate_status)`);
    // Create remaining indexes...
    
    // 17. Update schema version
    db.exec('PRAGMA user_version = 7');
    
    db.exec('COMMIT');
    console.log('Migration to version 7 completed successfully');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
```

---

#### Day 5: Migration Testing & Default Data
**Tasks**:
- [ ] Test migration on fresh database
- [ ] Test migration on database with existing projects
- [ ] Create default gate template (Standard 7-gate process)
- [ ] Create default policy set (Security, Privacy, Architecture, Finance)
- [ ] Verify all foreign keys work correctly
- [ ] Verify indexes are created and used by query planner
- [ ] Test rollback script
- [ ] Link existing projects to default first gate (Ideation)

**Deliverables**:
- `tests/integration/governance-migration.test.ts` - Migration tests
- `app/data/governance-defaults.json` - Default data definitions

**Default Data**:
```json
{
  "gates": [
    {"gate_id": 1, "gate_name": "Ideation", "gate_order": 1, "is_mandatory": true},
    {"gate_id": 2, "gate_name": "Business Case", "gate_order": 2, "is_mandatory": true},
    {"gate_id": 3, "gate_name": "Design", "gate_order": 3, "is_mandatory": true},
    {"gate_id": 4, "gate_name": "Build", "gate_order": 4, "is_mandatory": true},
    {"gate_id": 5, "gate_name": "UAT", "gate_order": 5, "is_mandatory": true},
    {"gate_id": 6, "gate_name": "Deploy", "gate_order": 6, "is_mandatory": true},
    {"gate_id": 7, "gate_name": "Post-Implementation Review", "gate_order": 7, "is_mandatory": true}
  ],
  "policies": [
    {"policy_id": 1, "policy_name": "Security Review", "policy_category": "Security"},
    {"policy_id": 2, "policy_name": "Privacy Assessment", "policy_category": "Privacy"},
    {"policy_id": 3, "policy_name": "Architecture Approval", "policy_category": "Architecture"},
    {"policy_id": 4, "policy_name": "Budget Approval", "policy_category": "Finance"}
  ]
}
```

---

### Week 2: TypeScript Models & Base Types

#### Day 1-2: TypeScript Type Definitions
**Tasks**:
- [ ] Create TypeScript interfaces for all 14 governance tables
- [ ] Create enums for status types (gate_status, compliance_status, decision_status, etc.)
- [ ] Create union types for entity_type, action_source, etc.
- [ ] Create DTOs (Data Transfer Objects) for API requests/responses
- [ ] Create validation schemas using Zod or similar
- [ ] Document all types with JSDoc comments

**Deliverables**:
- `app/main/types/governance.ts` - All governance type definitions
- `app/main/types/governance-enums.ts` - Enums and constants
- `app/main/types/governance-dtos.ts` - DTOs for API layer

**Type Definitions Structure**:
```typescript
// app/main/types/governance.ts

export interface GovernanceGate {
  gate_id: number;
  gate_name: string;
  gate_order: number;
  gate_description: string | null;
  gate_type: string;
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
  project_id: number;
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

// ... remaining interfaces

export type CriteriaType = 'document' | 'approval' | 'quality' | 'budget' | 'resource' | 'dependency';
export type GateStatus = 'not-started' | 'in-review' | 'passed' | 'passed-with-conditions' | 'failed' | 'deferred';
export type ComplianceStatus = 'not-started' | 'in-progress' | 'compliant' | 'non-compliant' | 'exempt' | 'waived';
export type DecisionStatus = 'proposed' | 'approved' | 'rejected' | 'deferred' | 'reversed';
export type ActionStatus = 'open' | 'in-progress' | 'blocked' | 'completed' | 'cancelled';
export type EscalationStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type BenefitRealizationStatus = 'not-yet' | 'partial' | 'full' | 'not-realized';
```

---

#### Day 3-4: Validation Layer
**Tasks**:
- [ ] Create validation functions for all governance entities
- [ ] Implement date validation (NZ format DD-MM-YYYY)
- [ ] Implement business rule validations:
  - Gate order uniqueness within template
  - Mandatory criteria must be met before gate pass
  - Policy effective dates validation
  - Decision date cannot be in future
  - Action due date must be after creation date
  - Escalation level must be 1-5
  - Strategic alignment score must be 0-100
- [ ] Create validation error messages
- [ ] Write unit tests for all validators

**Deliverables**:
- `app/main/validation/governance-validation.ts` - Validation functions
- `tests/unit/governance-validation.test.ts` - Validator tests (50+ test cases)

**Validation Examples**:
```typescript
// app/main/validation/governance-validation.ts

export function validateGateOrder(gates: GovernanceGate[], templateId: number): ValidationResult {
  const gatesInTemplate = gates.filter(g => g.template_id === templateId);
  const orders = gatesInTemplate.map(g => g.gate_order);
  const hasDuplicates = new Set(orders).size !== orders.length;
  
  if (hasDuplicates) {
    return { valid: false, error: 'Gate order must be unique within template' };
  }
  
  // Check sequential (1, 2, 3, ... n)
  const sortedOrders = [...orders].sort((a, b) => a - b);
  const isSequential = sortedOrders.every((order, index) => order === index + 1);
  
  if (!isSequential) {
    return { valid: false, error: 'Gate order must be sequential starting from 1' };
  }
  
  return { valid: true };
}

export function validateGateProgression(
  projectGate: ProjectGate, 
  criteriaCompliance: GateCriteriaCompliance[]
): ValidationResult {
  if (projectGate.gate_status === 'passed') {
    // Check all mandatory criteria are met
    const mandatoryCriteria = criteriaCompliance.filter(c => c.is_mandatory);
    const allMet = mandatoryCriteria.every(c => c.status === 'met' || c.status === 'waived');
    
    if (!allMet) {
      return { 
        valid: false, 
        error: 'Cannot mark gate as passed - mandatory criteria not met',
        details: mandatoryCriteria.filter(c => c.status !== 'met' && c.status !== 'waived')
      };
    }
  }
  
  return { valid: true };
}
```

---

#### Day 5: Database Access Layer (DAL)
**Tasks**:
- [ ] Create base repository class for governance tables
- [ ] Implement CRUD operations for each governance table
- [ ] Implement transaction support for multi-table operations
- [ ] Implement query builders for complex joins
- [ ] Add error handling and logging
- [ ] Write integration tests for DAL

**Deliverables**:
- `app/main/repositories/governance-repository.ts` - Base repository
- `app/main/repositories/gate-repository.ts` - Gate operations
- `app/main/repositories/compliance-repository.ts` - Compliance operations
- `app/main/repositories/decision-repository.ts` - Decision operations
- `tests/integration/governance-dal.test.ts` - DAL tests

**Repository Pattern**:
```typescript
// app/main/repositories/governance-repository.ts

export abstract class GovernanceRepository<T> {
  constructor(protected db: Database) {}
  
  abstract getTableName(): string;
  abstract mapRowToEntity(row: any): T;
  
  getById(id: number): T | null {
    const row = this.db.prepare(
      `SELECT * FROM ${this.getTableName()} WHERE id = ?`
    ).get(id);
    
    return row ? this.mapRowToEntity(row) : null;
  }
  
  getAll(): T[] {
    const rows = this.db.prepare(
      `SELECT * FROM ${this.getTableName()}`
    ).all();
    
    return rows.map(row => this.mapRowToEntity(row));
  }
  
  create(entity: Omit<T, 'id' | 'created_at' | 'updated_at'>): T {
    // Implementation
  }
  
  update(id: number, entity: Partial<T>): T {
    // Implementation
  }
  
  delete(id: number): boolean {
    // Implementation
  }
  
  transaction<R>(callback: () => R): R {
    return this.db.transaction(callback)();
  }
}

// app/main/repositories/gate-repository.ts

export class GateRepository extends GovernanceRepository<GovernanceGate> {
  getTableName(): string {
    return 'governance_gates';
  }
  
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
  
  getGatesByTemplate(templateId: number): GovernanceGate[] {
    const rows = this.db.prepare(
      'SELECT * FROM governance_gates WHERE template_id = ? ORDER BY gate_order'
    ).all(templateId);
    
    return rows.map(row => this.mapRowToEntity(row));
  }
  
  getGateWithCriteria(gateId: number): GateWithCriteria {
    // Complex join query
  }
}
```

---

## Phase 2: Service Layer Development (Weeks 3-5)

### Week 3: Core Governance Services

#### Day 1-2: GovernanceService (Main Orchestrator)
**Tasks**:
- [ ] Create `GovernanceService.ts` main orchestration class
- [ ] Implement portfolio metrics calculation method
- [ ] Implement portfolio health score calculation
- [ ] Implement cross-module data aggregation
- [ ] Add caching for expensive calculations
- [ ] Implement refresh/recalculate triggers
- [ ] Write unit tests for calculations

**Deliverables**:
- `app/main/services/governance/GovernanceService.ts`
- `tests/unit/governance-service.test.ts` - 30+ test cases

**Service Structure**:
```typescript
// app/main/services/governance/GovernanceService.ts

export class GovernanceService {
  constructor(
    private db: Database,
    private gateRepository: GateRepository,
    private complianceRepository: ComplianceRepository,
    private decisionRepository: DecisionRepository,
    private projectRepository: ProjectRepository
  ) {}
  
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
        onTimeScore,
        budgetScore,
        riskScore,
        complianceScore,
        benefitsScore
      },
      scoreBand: this.getScoreBand(totalScore),
      calculatedAt: new Date().toISOString()
    };
  }
  
  private calculateOnTimeDeliveryScore(): number {
    const projects = this.projectRepository.getAllActive();
    const onTime = projects.filter(p => this.isProjectOnSchedule(p)).length;
    return (onTime / projects.length) * 100;
  }
  
  private getScoreBand(score: number): ScoreBand {
    if (score >= 90) return { label: 'Excellent', color: 'green' };
    if (score >= 75) return { label: 'Good', color: 'light-green' };
    if (score >= 60) return { label: 'Fair', color: 'yellow' };
    if (score >= 40) return { label: 'Poor', color: 'orange' };
    return { label: 'Critical', color: 'red' };
  }
  
  async getPortfolioDashboardData(): Promise<PortfolioDashboard> {
    const healthScore = await this.calculatePortfolioHealthScore();
    const projectsByGate = await this.getProjectDistributionByGate();
    const overdueCompliance = await this.getOverdueComplianceCount();
    const openActions = await this.getOpenActionsBreakdown();
    const recentDecisions = await this.getRecentDecisions(5);
    const escalatedItems = await this.getEscalatedItemsCount();
    const benefitsAtRisk = await this.getBenefitsAtRiskCount();
    
    return {
      healthScore,
      projectsByGate,
      overdueCompliance,
      openActions,
      recentDecisions,
      escalatedItems,
      benefitsAtRisk
    };
  }
}
```

---

#### Day 3: StageGateService
**Tasks**:
- [ ] Implement gate configuration CRUD operations
- [ ] Implement gate criteria management
- [ ] Implement project gate progression logic
- [ ] Implement gate compliance checking
- [ ] Implement auto-progression evaluation
- [ ] Implement gate review workflow
- [ ] Write unit tests

**Deliverables**:
- `app/main/services/governance/StageGateService.ts`
- `tests/unit/stage-gate-service.test.ts`

**Auto-Progression Logic**:
```typescript
export class StageGateService {
  async evaluateAutoProgression(projectId: number): Promise<AutoProgressionResult> {
    const currentGate = await this.getCurrentProjectGate(projectId);
    
    if (!currentGate || !this.isAutoProgressionEnabled(projectId)) {
      return { shouldProgress: false, reason: 'Auto-progression disabled' };
    }
    
    const checks = await Promise.all([
      this.checkMandatoryCriteria(currentGate.project_gate_id),
      this.checkRequiredApprovals(currentGate.project_gate_id),
      this.checkQualityGates(projectId),
      this.checkBudgetGates(projectId),
      this.checkDependencyGates(projectId)
    ]);
    
    const allPassed = checks.every(check => check.passed);
    
    if (allPassed) {
      await this.progressToNextGate(projectId, currentGate);
      return { shouldProgress: true, gatePassed: currentGate.gate_id };
    }
    
    return { 
      shouldProgress: false, 
      reason: 'Criteria not met',
      failedChecks: checks.filter(c => !c.passed)
    };
  }
  
  private async progressToNextGate(projectId: number, currentGate: ProjectGate): Promise<void> {
    const nextGate = await this.getNextGate(currentGate.gate_id);
    
    this.db.transaction(() => {
      // Mark current gate as passed
      this.updateProjectGateStatus(currentGate.project_gate_id, 'passed');
      
      // Create next gate entry
      this.createProjectGate({
        project_id: projectId,
        gate_id: nextGate.gate_id,
        gate_status: 'not-started',
        scheduled_date: this.calculateNextGateDate(nextGate)
      });
      
      // Update project current_gate_id
      this.projectRepository.update(projectId, { current_gate_id: nextGate.gate_id });
      
      // Create action item for next gate preparation
      this.createGatePreparationAction(projectId, nextGate);
      
      // Log audit event
      this.auditService.log({
        module: 'governance',
        component: 'stage-gate',
        action: 'gate-auto-progression',
        entity_type: 'project',
        entity_id: projectId,
        details: `Auto-progressed from ${currentGate.gate_name} to ${nextGate.gate_name}`
      });
    })();
  }
}
```

---

#### Day 4: ComplianceService
**Tasks**:
- [ ] Implement policy CRUD operations
- [ ] Implement compliance tracking and status updates
- [ ] Implement waiver request and approval workflow
- [ ] Implement compliance alerts generation
- [ ] Implement overdue compliance escalation logic
- [ ] Write unit tests

**Deliverables**:
- `app/main/services/governance/ComplianceService.ts`
- `tests/unit/compliance-service.test.ts`

---

#### Day 5: DecisionLogService & EscalationService
**Tasks**:
- [ ] Implement decision recording and tracking
- [ ] Implement action item CRUD with dependencies
- [ ] Implement recurring action scheduling
- [ ] Implement decision impact analysis
- [ ] Implement auto-escalation rule evaluation
- [ ] Implement escalation workflow execution
- [ ] Write unit tests

**Deliverables**:
- `app/main/services/governance/DecisionLogService.ts`
- `app/main/services/governance/EscalationService.ts`
- `tests/unit/decision-escalation-services.test.ts`

---

### Week 4: Specialized Governance Services

#### Day 1: RiskGovernanceService
**Tasks**:
- [ ] Implement portfolio risk aggregation
- [ ] Implement risk concentration analysis
- [ ] Implement risk mitigation tracking
- [ ] Implement risk appetite monitoring
- [ ] Calculate portfolio risk score
- [ ] Write unit tests

**Deliverables**:
- `app/main/services/governance/RiskGovernanceService.ts`
- `tests/unit/risk-governance-service.test.ts`

---

#### Day 2: BenefitsService
**Tasks**:
- [ ] Implement benefits definition and tracking
- [ ] Implement baseline and actual measurement
- [ ] Implement ROI calculation logic
- [ ] Implement benefits variance analysis
- [ ] Calculate payback period
- [ ] Write unit tests

**Deliverables**:
- `app/main/services/governance/BenefitsService.ts`
- `tests/unit/benefits-service.test.ts`

**ROI Calculation**:
```typescript
export class BenefitsService {
  calculateProjectROI(projectId: number): ProjectROI {
    const project = this.projectRepository.getById(projectId);
    const benefits = this.getBenefitsByProject(projectId);
    const actuals = this.actualsService.getProjectActuals(projectId);
    
    const totalCosts = project.budget_cents / 100 + actuals.totalActualCosts;
    const realizedBenefits = benefits
      .filter(b => b.realization_status === 'full' || b.realization_status === 'partial')
      .reduce((sum, b) => sum + (b.actual_value || 0), 0);
    
    const roiPercentage = ((realizedBenefits - totalCosts) / totalCosts) * 100;
    
    // Calculate payback period
    const monthlyBenefit = realizedBenefits / this.getRealizationPeriodMonths(benefits);
    const paybackPeriodMonths = totalCosts / monthlyBenefit;
    
    return {
      projectId,
      projectName: project.name,
      totalCosts,
      totalBenefits: realizedBenefits,
      roiPercentage: Math.round(roiPercentage * 100) / 100,
      paybackPeriodMonths: Math.round(paybackPeriodMonths * 10) / 10,
      benefitBreakdown: this.getBenefitBreakdown(benefits)
    };
  }
  
  calculatePortfolioROI(): PortfolioROI {
    const projects = this.projectRepository.getAll();
    const projectROIs = projects.map(p => this.calculateProjectROI(p.project_id));
    
    const totalCosts = projectROIs.reduce((sum, roi) => sum + roi.totalCosts, 0);
    const totalBenefits = projectROIs.reduce((sum, roi) => sum + roi.totalBenefits, 0);
    const portfolioROI = ((totalBenefits - totalCosts) / totalCosts) * 100;
    
    return {
      portfolioROI: Math.round(portfolioROI * 100) / 100,
      totalCosts,
      totalBenefits,
      projectCount: projects.length,
      topPerformers: this.getTopPerformingProjects(projectROIs, 10)
    };
  }
}
```

---

#### Day 3: StrategicAlignmentService
**Tasks**:
- [ ] Implement strategic initiative CRUD operations
- [ ] Implement project-initiative linkage
- [ ] Implement alignment scoring algorithm
- [ ] Implement initiative progress rollup
- [ ] Calculate portfolio alignment score
- [ ] Write unit tests

**Deliverables**:
- `app/main/services/governance/StrategicAlignmentService.ts`
- `tests/unit/strategic-alignment-service.test.ts`

**Alignment Scoring**:
```typescript
export class StrategicAlignmentService {
  calculateProjectAlignmentScore(projectId: number): number {
    const project = this.projectRepository.getById(projectId);
    const initiative = project.strategic_initiative_id 
      ? this.getInitiative(project.strategic_initiative_id)
      : null;
    
    // Direct Linkage Score (40%)
    const linkageScore = initiative ? 100 : 0;
    
    // Value Contribution Score (30%)
    let valueScore = 0;
    if (initiative) {
      const projectBenefits = this.benefitsService.getTotalBenefitValue(projectId);
      const initiativeTarget = this.parseKPITargets(initiative.kpi_targets).benefitTarget;
      valueScore = Math.min((projectBenefits / initiativeTarget) * 100, 100);
    }
    
    // Timeline Alignment Score (30%)
    let timelineScore = 50; // Default
    if (initiative) {
      const projectStart = new Date(project.start_date);
      const projectEnd = new Date(project.end_date);
      const initiativeStart = new Date(initiative.start_date);
      const initiativeEnd = new Date(initiative.target_date);
      
      const hasOverlap = projectEnd >= initiativeStart && projectStart <= initiativeEnd;
      timelineScore = hasOverlap ? 100 : 50;
    }
    
    const alignmentScore = (linkageScore * 0.4) + (valueScore * 0.3) + (timelineScore * 0.3);
    
    // Cache in database
    this.projectRepository.update(projectId, { strategic_alignment_score: Math.round(alignmentScore) });
    
    return Math.round(alignmentScore);
  }
  
  calculatePortfolioAlignmentScore(): number {
    const projects = this.projectRepository.getAllActive();
    
    let totalWeightedScore = 0;
    let totalBudget = 0;
    
    for (const project of projects) {
      const alignmentScore = this.calculateProjectAlignmentScore(project.project_id);
      const projectBudget = project.budget_cents / 100;
      
      totalWeightedScore += alignmentScore * projectBudget;
      totalBudget += projectBudget;
    }
    
    return Math.round(totalWeightedScore / totalBudget);
  }
}
```

---

#### Day 4: PortfolioAnalyticsService
**Tasks**:
- [ ] Implement portfolio health score calculation
- [ ] Implement delivery predictability index
- [ ] Implement portfolio velocity metrics
- [ ] Implement heatmap data generation (Risk vs Value, Resource Demand vs Capacity)
- [ ] Implement multi-dimensional portfolio views
- [ ] Write unit tests

**Deliverables**:
- `app/main/services/governance/PortfolioAnalyticsService.ts`
- `tests/unit/portfolio-analytics-service.test.ts`

---

#### Day 5: GovernanceReportingService
**Tasks**:
- [ ] Implement executive summary report generation
- [ ] Implement gate status report
- [ ] Implement compliance report
- [ ] Implement benefits realization report
- [ ] Implement portfolio health report
- [ ] Implement CSV export functionality
- [ ] Write unit tests

**Deliverables**:
- `app/main/services/governance/GovernanceReportingService.ts`
- `tests/unit/governance-reporting-service.test.ts`

---

### Week 5: Background Jobs & Automation

#### Day 1-2: Scheduled Jobs Infrastructure
**Tasks**:
- [ ] Create job scheduler infrastructure
- [ ] Implement compliance alert job (daily at 6am)
- [ ] Implement escalation auto-creation job (hourly)
- [ ] Implement portfolio metrics refresh job (every 30 minutes)
- [ ] Implement gate auto-progression job (on criteria update)
- [ ] Add job status monitoring
- [ ] Write tests for job execution

**Deliverables**:
- `app/main/services/governance/jobs/JobScheduler.ts`
- `app/main/services/governance/jobs/ComplianceAlertJob.ts`
- `app/main/services/governance/jobs/EscalationJob.ts`
- `app/main/services/governance/jobs/PortfolioMetricsJob.ts`
- `tests/integration/governance-jobs.test.ts`

**Job Scheduler**:
```typescript
// app/main/services/governance/jobs/JobScheduler.ts

export class JobScheduler {
  private jobs: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(
    private complianceService: ComplianceService,
    private escalationService: EscalationService,
    private governanceService: GovernanceService
  ) {}
  
  start(): void {
    // Daily compliance alert job at 6am
    this.scheduleDaily('compliance-alert', '06:00', async () => {
      await this.complianceService.generateDailyComplianceAlerts();
    });
    
    // Hourly escalation auto-creation
    this.scheduleHourly('auto-escalation', async () => {
      await this.escalationService.evaluateAndCreateEscalations();
    });
    
    // Portfolio metrics refresh every 30 minutes
    this.scheduleInterval('portfolio-metrics', 30 * 60 * 1000, async () => {
      await this.governanceService.refreshPortfolioMetrics();
    });
    
    console.log('Governance job scheduler started');
  }
  
  stop(): void {
    this.jobs.forEach(timeout => clearTimeout(timeout));
    this.jobs.clear();
    console.log('Governance job scheduler stopped');
  }
  
  private scheduleDaily(jobName: string, time: string, callback: () => Promise<void>): void {
    const [hours, minutes] = time.split(':').map(Number);
    
    const scheduleNext = () => {
      const now = new Date();
      const scheduled = new Date(now);
      scheduled.setHours(hours, minutes, 0, 0);
      
      if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1);
      }
      
      const delay = scheduled.getTime() - now.getTime();
      
      const timeout = setTimeout(async () => {
        try {
          await callback();
        } catch (error) {
          console.error(`Job ${jobName} failed:`, error);
        }
        scheduleNext();
      }, delay);
      
      this.jobs.set(jobName, timeout);
    };
    
    scheduleNext();
  }
  
  private scheduleHourly(jobName: string, callback: () => Promise<void>): void {
    this.scheduleInterval(jobName, 60 * 60 * 1000, callback);
  }
  
  private scheduleInterval(jobName: string, intervalMs: number, callback: () => Promise<void>): void {
    const timeout = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`Job ${jobName} failed:`, error);
      }
    }, intervalMs);
    
    this.jobs.set(jobName, timeout as any);
    
    // Run immediately on startup
    callback().catch(error => console.error(`Initial job ${jobName} failed:`, error));
  }
}
```

---

#### Day 3-4: IPC Handler Integration
**Tasks**:
- [ ] Create IPC handlers for all governance services
- [ ] Implement request/response patterns
- [ ] Add error handling and validation
- [ ] Implement rate limiting for expensive operations
- [ ] Add security checks (future: user permissions)
- [ ] Write integration tests

**Deliverables**:
- `app/main/ipc/governance-handlers.ts` - All IPC handlers
- `app/main/preload.ts` - Update with governance API
- `tests/integration/governance-ipc.test.ts`

**IPC Handlers Structure**:
```typescript
// app/main/ipc/governance-handlers.ts

export function registerGovernanceHandlers(
  ipcMain: IpcMain,
  governanceService: GovernanceService,
  stageGateService: StageGateService,
  complianceService: ComplianceService,
  decisionService: DecisionLogService,
  // ... other services
): void {
  
  // Portfolio Dashboard
  ipcMain.handle('governance:getPortfolioDashboard', async () => {
    try {
      return await governanceService.getPortfolioDashboardData();
    } catch (error) {
      console.error('Failed to get portfolio dashboard:', error);
      throw error;
    }
  });
  
  // Stage Gates
  ipcMain.handle('governance:getGates', async () => {
    return await stageGateService.getAllGates();
  });
  
  ipcMain.handle('governance:createGate', async (event, gate: Omit<GovernanceGate, 'gate_id'>) => {
    return await stageGateService.createGate(gate);
  });
  
  ipcMain.handle('governance:getProjectGateStatus', async (event, projectId: number) => {
    return await stageGateService.getProjectGateStatus(projectId);
  });
  
  ipcMain.handle('governance:updateProjectGate', async (event, projectGateId: number, update: Partial<ProjectGate>) => {
    return await stageGateService.updateProjectGate(projectGateId, update);
  });
  
  ipcMain.handle('governance:evaluateAutoProgression', async (event, projectId: number) => {
    return await stageGateService.evaluateAutoProgression(projectId);
  });
  
  // Compliance
  ipcMain.handle('governance:getPolicies', async () => {
    return await complianceService.getAllPolicies();
  });
  
  ipcMain.handle('governance:getComplianceMatrix', async () => {
    return await complianceService.getComplianceMatrix();
  });
  
  ipcMain.handle('governance:updateCompliance', async (event, complianceId: number, update: Partial<PolicyCompliance>) => {
    return await complianceService.updateCompliance(complianceId, update);
  });
  
  ipcMain.handle('governance:requestWaiver', async (event, waiver: Omit<PolicyWaiver, 'waiver_id'>) => {
    return await complianceService.requestWaiver(waiver);
  });
  
  // Decisions & Actions
  ipcMain.handle('governance:getDecisions', async (event, filters?: DecisionFilters) => {
    return await decisionService.getDecisions(filters);
  });
  
  ipcMain.handle('governance:createDecision', async (event, decision: Omit<GovernanceDecision, 'decision_id'>) => {
    return await decisionService.createDecision(decision);
  });
  
  ipcMain.handle('governance:getActions', async (event, filters?: ActionFilters) => {
    return await decisionService.getActions(filters);
  });
  
  ipcMain.handle('governance:createAction', async (event, action: Omit<GovernanceAction, 'action_id'>) => {
    return await decisionService.createAction(action);
  });
  
  // Strategic Alignment
  ipcMain.handle('governance:getInitiatives', async () => {
    return await strategicAlignmentService.getAllInitiatives();
  });
  
  ipcMain.handle('governance:calculatePortfolioAlignment', async () => {
    return await strategicAlignmentService.calculatePortfolioAlignmentScore();
  });
  
  // Benefits
  ipcMain.handle('governance:getBenefits', async (event, projectId: number) => {
    return await benefitsService.getBenefitsByProject(projectId);
  });
  
  ipcMain.handle('governance:calculateROI', async (event, projectId: number) => {
    return await benefitsService.calculateProjectROI(projectId);
  });
  
  // Reports
  ipcMain.handle('governance:generateReport', async (event, reportType: string, options?: any) => {
    return await reportingService.generateReport(reportType, options);
  });
}

// app/main/preload.ts - Add to electronAPI

governance: {
  // Portfolio
  getPortfolioDashboard: () => ipcRenderer.invoke('governance:getPortfolioDashboard'),
  
  // Stage Gates
  getGates: () => ipcRenderer.invoke('governance:getGates'),
  createGate: (gate: any) => ipcRenderer.invoke('governance:createGate', gate),
  getProjectGateStatus: (projectId: number) => ipcRenderer.invoke('governance:getProjectGateStatus', projectId),
  updateProjectGate: (projectGateId: number, update: any) => ipcRenderer.invoke('governance:updateProjectGate', projectGateId, update),
  evaluateAutoProgression: (projectId: number) => ipcRenderer.invoke('governance:evaluateAutoProgression', projectId),
  
  // Compliance
  getPolicies: () => ipcRenderer.invoke('governance:getPolicies'),
  getComplianceMatrix: () => ipcRenderer.invoke('governance:getComplianceMatrix'),
  updateCompliance: (complianceId: number, update: any) => ipcRenderer.invoke('governance:updateCompliance', complianceId, update),
  requestWaiver: (waiver: any) => ipcRenderer.invoke('governance:requestWaiver', waiver),
  
  // Decisions & Actions
  getDecisions: (filters?: any) => ipcRenderer.invoke('governance:getDecisions', filters),
  createDecision: (decision: any) => ipcRenderer.invoke('governance:createDecision', decision),
  getActions: (filters?: any) => ipcRenderer.invoke('governance:getActions', filters),
  createAction: (action: any) => ipcRenderer.invoke('governance:createAction', action),
  
  // Strategic Alignment
  getInitiatives: () => ipcRenderer.invoke('governance:getInitiatives'),
  calculatePortfolioAlignment: () => ipcRenderer.invoke('governance:calculatePortfolioAlignment'),
  
  // Benefits
  getBenefits: (projectId: number) => ipcRenderer.invoke('governance:getBenefits', projectId),
  calculateROI: (projectId: number) => ipcRenderer.invoke('governance:calculateROI', projectId),
  
  // Reports
  generateReport: (reportType: string, options?: any) => ipcRenderer.invoke('governance:generateReport', reportType, options)
}
```

---

#### Day 5: Integration Testing
**Tasks**:
- [ ] Write end-to-end integration tests for all services
- [ ] Test cross-service interactions
- [ ] Test transaction rollback scenarios
- [ ] Test scheduled jobs execution
- [ ] Test IPC communication
- [ ] Performance testing for expensive calculations

**Deliverables**:
- `tests/integration/governance-e2e.test.ts`
- Performance benchmark results

---

## Phase 3: UI Components & Frontend (Weeks 6-9)

### Week 6: Zustand Store & State Management

#### Day 1-2: Governance Store
**Tasks**:
- [ ] Create Zustand governance store
- [ ] Implement state slices for:
  - Portfolio dashboard data
  - Gates and gate criteria
  - Policies and compliance
  - Decisions and actions
  - Strategic initiatives
  - Benefits
  - Escalations
- [ ] Implement state update actions
- [ ] Implement optimistic UI updates
- [ ] Add loading and error states
- [ ] Write tests for store

**Deliverables**:
- `app/renderer/stores/governanceStore.ts`
- `tests/unit/governance-store.test.ts`

**Store Structure**:
```typescript
// app/renderer/stores/governanceStore.ts

import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface GovernanceState {
  // Portfolio Dashboard
  portfolioDashboard: PortfolioDashboard | null;
  dashboardLoading: boolean;
  
  // Gates
  gates: GovernanceGate[];
  gateCriteria: GateCriteria[];
  projectGates: Map<number, ProjectGate[]>; // projectId -> gates
  gatesLoading: boolean;
  
  // Compliance
  policies: GovernancePolicy[];
  complianceMatrix: ComplianceMatrixData | null;
  waivers: PolicyWaiver[];
  complianceLoading: boolean;
  
  // Decisions & Actions
  decisions: GovernanceDecision[];
  actions: GovernanceAction[];
  actionDependencies: ActionDependency[];
  decisionsLoading: boolean;
  
  // Strategic Alignment
  initiatives: StrategicInitiative[];
  portfolioAlignment: number | null;
  initiativesLoading: boolean;
  
  // Benefits
  benefitsByProject: Map<number, ProjectBenefit[]>;
  portfolioROI: PortfolioROI | null;
  benefitsLoading: boolean;
  
  // Escalations
  escalations: Escalation[];
  escalationsLoading: boolean;
  
  // Actions
  loadPortfolioDashboard: () => Promise<void>;
  refreshPortfolioMetrics: () => Promise<void>;
  
  loadGates: () => Promise<void>;
  createGate: (gate: Omit<GovernanceGate, 'gate_id'>) => Promise<GovernanceGate>;
  updateGate: (gateId: number, update: Partial<GovernanceGate>) => Promise<void>;
  deleteGate: (gateId: number) => Promise<void>;
  
  loadProjectGateStatus: (projectId: number) => Promise<void>;
  updateProjectGate: (projectGateId: number, update: Partial<ProjectGate>) => Promise<void>;
  evaluateAutoProgression: (projectId: number) => Promise<AutoProgressionResult>;
  
  loadPolicies: () => Promise<void>;
  loadComplianceMatrix: () => Promise<void>;
  updateCompliance: (complianceId: number, update: Partial<PolicyCompliance>) => Promise<void>;
  requestWaiver: (waiver: Omit<PolicyWaiver, 'waiver_id'>) => Promise<PolicyWaiver>;
  
  loadDecisions: (filters?: DecisionFilters) => Promise<void>;
  createDecision: (decision: Omit<GovernanceDecision, 'decision_id'>) => Promise<GovernanceDecision>;
  
  loadActions: (filters?: ActionFilters) => Promise<void>;
  createAction: (action: Omit<GovernanceAction, 'action_id'>) => Promise<GovernanceAction>;
  updateActionStatus: (actionId: number, status: ActionStatus) => Promise<void>;
  
  loadInitiatives: () => Promise<void>;
  calculatePortfolioAlignment: () => Promise<void>;
  
  loadBenefits: (projectId: number) => Promise<void>;
  calculateProjectROI: (projectId: number) => Promise<ProjectROI>;
}

export const useGovernanceStore = create<GovernanceState>()(
  immer((set, get) => ({
    // Initial state
    portfolioDashboard: null,
    dashboardLoading: false,
    gates: [],
    gateCriteria: [],
    projectGates: new Map(),
    gatesLoading: false,
    policies: [],
    complianceMatrix: null,
    waivers: [],
    complianceLoading: false,
    decisions: [],
    actions: [],
    actionDependencies: [],
    decisionsLoading: false,
    initiatives: [],
    portfolioAlignment: null,
    initiativesLoading: false,
    benefitsByProject: new Map(),
    portfolioROI: null,
    benefitsLoading: false,
    escalations: [],
    escalationsLoading: false,
    
    // Actions
    loadPortfolioDashboard: async () => {
      set(state => { state.dashboardLoading = true; });
      try {
        const data = await window.electronAPI.governance.getPortfolioDashboard();
        set(state => {
          state.portfolioDashboard = data;
          state.dashboardLoading = false;
        });
      } catch (error) {
        console.error('Failed to load portfolio dashboard:', error);
        set(state => { state.dashboardLoading = false; });
      }
    },
    
    refreshPortfolioMetrics: async () => {
      await window.electronAPI.governance.refreshPortfolioMetrics();
      await get().loadPortfolioDashboard();
    },
    
    loadGates: async () => {
      set(state => { state.gatesLoading = true; });
      try {
        const gates = await window.electronAPI.governance.getGates();
        const criteria = await window.electronAPI.governance.getGateCriteria();
        set(state => {
          state.gates = gates;
          state.gateCriteria = criteria;
          state.gatesLoading = false;
        });
      } catch (error) {
        console.error('Failed to load gates:', error);
        set(state => { state.gatesLoading = false; });
      }
    },
    
    createGate: async (gate) => {
      const newGate = await window.electronAPI.governance.createGate(gate);
      set(state => {
        state.gates.push(newGate);
      });
      return newGate;
    },
    
    // ... remaining actions
  }))
);
```

---

#### Day 3-4: Shared UI Components
**Tasks**:
- [ ] Create metric card component for dashboard
- [ ] Create status badge components (gate status, compliance status, etc.)
- [ ] Create progress bar component
- [ ] Create heatmap component
- [ ] Create Kanban board component
- [ ] Create dependency graph component
- [ ] Create timeline/Gantt component for initiatives
- [ ] Write Storybook stories (optional)

**Deliverables**:
- `app/renderer/components/governance/MetricCard.tsx`
- `app/renderer/components/governance/StatusBadge.tsx`
- `app/renderer/components/governance/ProgressBar.tsx`
- `app/renderer/components/governance/Heatmap.tsx`
- `app/renderer/components/governance/KanbanBoard.tsx`
- `app/renderer/components/governance/DependencyGraph.tsx`
- `app/renderer/components/governance/InitiativeTimeline.tsx`

---

#### Day 5: Governance Module Navigation
**Tasks**:
- [ ] Add "Governance" module to NavigationSidebar
- [ ] Create Governance sub-navigation menu (8 pages)
- [ ] Update ContentPane to render governance pages
- [ ] Add governance icon and styling
- [ ] Update routing logic

**Deliverables**:
- Updated `app/renderer/components/NavigationSidebar.tsx`
- Updated `app/renderer/components/ContentPane.tsx`

---

### Week 7: Portfolio & Stage Gate Pages

#### Day 1-3: Portfolio Dashboard
**Tasks**:
- [ ] Create PortfolioDashboard.tsx main component
- [ ] Implement executive metrics cards (12 metrics)
- [ ] Implement portfolio heatmaps:
  - Risk vs Value matrix
  - Resource demand vs capacity
  - Budget burn rate vs forecast
  - Compliance status by policy
- [ ] Implement strategic alignment donut chart
- [ ] Implement project distribution by gate (funnel chart)
- [ ] Implement risk concentration chart
- [ ] Implement benefits realization tracker
- [ ] Implement quick filters
- [ ] Add refresh functionality
- [ ] Make dashboard responsive

**Deliverables**:
- `app/renderer/pages/governance/PortfolioDashboard.tsx`
- `app/renderer/components/governance/PortfolioHeatmap.tsx`
- `app/renderer/components/governance/GateFunnelChart.tsx`
- `app/renderer/components/governance/RiskConcentrationChart.tsx`

**Dashboard Structure**:
```typescript
// app/renderer/pages/governance/PortfolioDashboard.tsx

export function PortfolioDashboard() {
  const { portfolioDashboard, loadPortfolioDashboard, refreshPortfolioMetrics } = useGovernanceStore();
  const [selectedFilter, setSelectedFilter] = useState<PortfolioFilter>('all');
  
  useEffect(() => {
    loadPortfolioDashboard();
  }, []);
  
  if (!portfolioDashboard) {
    return <LoadingSpinner message="Loading portfolio dashboard..." />;
  }
  
  const { healthScore, projectsByGate, overdueCompliance, openActions, recentDecisions, escalatedItems, benefitsAtRisk } = portfolioDashboard;
  
  return (
    <div className="portfolio-dashboard">
      <div className="dashboard-header">
        <h1>Portfolio Dashboard</h1>
        <button onClick={refreshPortfolioMetrics} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>
      
      {/* Portfolio Health Score - Large prominent card */}
      <div className="health-score-card">
        <PortfolioHealthScore score={healthScore} />
      </div>
      
      {/* Executive Metrics Grid */}
      <div className="metrics-grid">
        <MetricCard
          title="Active Gates"
          value={Object.values(projectsByGate).reduce((sum, count) => sum + count, 0)}
          icon="🎯"
          trend={calculateTrend(projectsByGate)}
        />
        <MetricCard
          title="Overdue Compliance"
          value={overdueCompliance.count}
          icon="⚠️"
          severity={overdueCompliance.severity}
          color="warning"
        />
        <MetricCard
          title="Open Actions"
          value={openActions.total}
          subtitle={`${openActions.overdue} overdue`}
          icon="📋"
        />
        <MetricCard
          title="Escalated Items"
          value={escalatedItems}
          icon="🚨"
          color="error"
        />
        {/* ... 8 more metric cards */}
      </div>
      
      {/* Portfolio Heatmaps */}
      <div className="heatmaps-row">
        <div className="heatmap-container">
          <h3>Risk vs Value Matrix</h3>
          <PortfolioHeatmap type="risk-value" data={portfolioDashboard.riskValueMatrix} />
        </div>
        <div className="heatmap-container">
          <h3>Resource Demand vs Capacity</h3>
          <PortfolioHeatmap type="resource-capacity" data={portfolioDashboard.resourceMatrix} />
        </div>
      </div>
      
      {/* Project Distribution by Gate - Funnel Chart */}
      <div className="gate-funnel-section">
        <h3>Project Distribution by Gate</h3>
        <GateFunnelChart data={projectsByGate} />
      </div>
      
      {/* Strategic Alignment & Benefits */}
      <div className="alignment-benefits-row">
        <div className="alignment-chart">
          <h3>Strategic Alignment</h3>
          <AlignmentDonutChart alignment={portfolioDashboard.portfolioAlignment} />
        </div>
        <div className="benefits-tracker">
          <h3>Benefits Realization</h3>
          <BenefitsRealizationTracker data={portfolioDashboard.benefitsData} />
        </div>
      </div>
      
      {/* Recent Decisions */}
      <div className="recent-decisions-section">
        <h3>Recent Decisions</h3>
        <DecisionList decisions={recentDecisions} />
      </div>
    </div>
  );
}
```

---

#### Day 4-5: Stage Gate Manager
**Tasks**:
- [ ] Create StageGateManager.tsx main component
- [ ] Implement Gate Configuration Panel
- [ ] Implement Gate Template management
- [ ] Implement Criteria library with drag-drop
- [ ] Implement Projects by Gate Kanban view
- [ ] Implement Gate Review Queue
- [ ] Implement Gate Analytics charts
- [ ] Add gate pass/fail/defer actions
- [ ] Make responsive

**Deliverables**:
- `app/renderer/pages/governance/StageGateManager.tsx`
- `app/renderer/components/governance/GateConfigPanel.tsx`
- `app/renderer/components/governance/GateKanbanBoard.tsx`
- `app/renderer/components/governance/GateReviewQueue.tsx`
- `app/renderer/components/governance/GateAnalytics.tsx`

---

### Week 8: Compliance & Decision Pages

#### Day 1-2: Compliance Tracker
**Tasks**:
- [ ] Create ComplianceTracker.tsx main component
- [ ] Implement Policy Management Panel
- [ ] Implement Compliance Matrix View (interactive table)
- [ ] Implement Waiver Management section
- [ ] Implement Compliance Alerts section
- [ ] Add policy version control UI
- [ ] Add waiver approval workflow UI
- [ ] Make responsive

**Deliverables**:
- `app/renderer/pages/governance/ComplianceTracker.tsx`
- `app/renderer/components/governance/PolicyManagementPanel.tsx`
- `app/renderer/components/governance/ComplianceMatrix.tsx`
- `app/renderer/components/governance/WaiverQueue.tsx`

**Compliance Matrix**:
```typescript
// Compliance Matrix - Interactive table with color coding

export function ComplianceMatrix() {
  const { policies, complianceMatrix, updateCompliance } = useGovernanceStore();
  const { projects } = useProjectStore();
  
  if (!complianceMatrix) return <LoadingSpinner />;
  
  return (
    <div className="compliance-matrix">
      <table className="matrix-table">
        <thead>
          <tr>
            <th>Project</th>
            {policies.map(policy => (
              <th key={policy.policy_id} title={policy.policy_description}>
                {policy.policy_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr key={project.project_id}>
              <td className="project-name">{project.name}</td>
              {policies.map(policy => {
                const compliance = complianceMatrix.get(project.project_id, policy.policy_id);
                return (
                  <td 
                    key={policy.policy_id}
                    className={`compliance-cell status-${compliance.status}`}
                    onClick={() => openComplianceDetail(compliance)}
                  >
                    <StatusBadge status={compliance.status} />
                    {compliance.status === 'waived' && <span className="waiver-icon">W</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

#### Day 3: Decision Log
**Tasks**:
- [ ] Create DecisionLog.tsx main component
- [ ] Implement Decision Timeline View with filters
- [ ] Implement Decision Detail Panel
- [ ] Implement Decision Impact Dashboard
- [ ] Add decision creation form
- [ ] Add decision dependency graph visualization
- [ ] Make responsive

**Deliverables**:
- `app/renderer/pages/governance/DecisionLog.tsx`
- `app/renderer/components/governance/DecisionTimeline.tsx`
- `app/renderer/components/governance/DecisionDetailPanel.tsx`
- `app/renderer/components/governance/DecisionForm.tsx`

---

#### Day 4: Action Items Manager
**Tasks**:
- [ ] Create ActionItemsManager.tsx main component
- [ ] Implement Action Queue Kanban board
- [ ] Implement My Actions View (filtered)
- [ ] Implement Action Dependencies graph
- [ ] Implement Recurring Actions section
- [ ] Add action creation/update forms
- [ ] Add drag-drop status change
- [ ] Make responsive

**Deliverables**:
- `app/renderer/pages/governance/ActionItemsManager.tsx`
- `app/renderer/components/governance/ActionKanbanBoard.tsx`
- `app/renderer/components/governance/ActionDependencyGraph.tsx`
- `app/renderer/components/governance/RecurringActionsPanel.tsx`

---

#### Day 5: Testing Week 8 Components
**Tasks**:
- [ ] Write React component tests for all Week 8 components
- [ ] Test compliance matrix interactions
- [ ] Test decision creation workflow
- [ ] Test action status updates
- [ ] Fix bugs

**Deliverables**:
- `tests/components/governance/` - All component tests

---

### Week 9: Strategic Alignment, Benefits & Reports

#### Day 1: Strategic Alignment Dashboard
**Tasks**:
- [ ] Create StrategicAlignmentDashboard.tsx
- [ ] Implement Initiative Overview with progress bars
- [ ] Implement Project Alignment Matrix
- [ ] Implement Alignment Analytics charts
- [ ] Add initiative creation/edit forms
- [ ] Add project-initiative linking UI
- [ ] Make responsive

**Deliverables**:
- `app/renderer/pages/governance/StrategicAlignmentDashboard.tsx`
- `app/renderer/components/governance/InitiativeOverview.tsx`
- `app/renderer/components/governance/AlignmentMatrix.tsx`

---

#### Day 2: Benefits Realization Tracker
**Tasks**:
- [ ] Create BenefitsRealizationTracker.tsx
- [ ] Implement Benefits Portfolio View table
- [ ] Implement Benefits Timeline
- [ ] Implement Benefits Analytics charts
- [ ] Add benefit creation/measurement forms
- [ ] Display ROI calculations
- [ ] Make responsive

**Deliverables**:
- `app/renderer/pages/governance/BenefitsRealizationTracker.tsx`
- `app/renderer/components/governance/BenefitsTable.tsx`
- `app/renderer/components/governance/BenefitsTimeline.tsx`
- `app/renderer/components/governance/ROIChart.tsx`

---

#### Day 3: Governance Reports
**Tasks**:
- [ ] Create GovernanceReports.tsx
- [ ] Implement Report Templates selection
- [ ] Implement report generation UI
- [ ] Implement Scheduled Reports configuration
- [ ] Implement Report History list
- [ ] Add CSV/PDF export buttons
- [ ] Make responsive

**Deliverables**:
- `app/renderer/pages/governance/GovernanceReports.tsx`
- `app/renderer/components/governance/ReportGenerator.tsx`
- `app/renderer/components/governance/ReportHistory.tsx`

---

#### Day 4: InfoPane Enhancements
**Tasks**:
- [ ] Update InfoPane to show governance metrics when Governance module active
- [ ] Add portfolio health score widget
- [ ] Add quick actions for governance
- [ ] Add project-specific governance info when project selected
- [ ] Show gate criteria checklist
- [ ] Show outstanding compliance items
- [ ] Make responsive

**Deliverables**:
- Updated `app/renderer/components/InfoPane.tsx`
- `app/renderer/components/governance/GovernanceInfoWidget.tsx`

---

#### Day 5: Module Integration & Polishing
**Tasks**:
- [ ] Integrate governance into existing Projects module:
  - Add "Current Gate" field to project cards
  - Add "Compliance Status" indicator
  - Add "Strategic Initiative" tag
  - Show governance status badge
- [ ] Integrate into Dashboard (Gantt):
  - Add gate milestone markers
  - Color-code by governance status
  - Add filters for gate/compliance/initiative
- [ ] Polish all governance UI components
- [ ] Fix styling inconsistencies
- [ ] Add loading states and error handling

**Deliverables**:
- Updated `app/renderer/pages/ProjectsModule.tsx`
- Updated `app/renderer/pages/DashboardModule.tsx`

---

## Phase 4: Testing & Documentation (Weeks 10-11)

### Week 10: Comprehensive Testing

#### Day 1-2: Unit Test Coverage
**Tasks**:
- [ ] Ensure 80%+ code coverage for all services
- [ ] Write missing unit tests
- [ ] Test edge cases and error scenarios
- [ ] Test calculation formulas with various inputs
- [ ] Fix failing tests

**Deliverables**:
- Complete unit test suite with >80% coverage
- Coverage report

---

#### Day 3-4: Integration Testing
**Tasks**:
- [ ] Test full governance workflows end-to-end
- [ ] Test gate progression workflow
- [ ] Test compliance escalation workflow
- [ ] Test decision to action workflow
- [ ] Test benefits ROI calculation workflow
- [ ] Test portfolio metrics calculation
- [ ] Test scheduled jobs execution
- [ ] Test IPC communication reliability
- [ ] Fix integration bugs

**Deliverables**:
- `tests/integration/governance-workflows.test.ts`
- Bug fix commits

---

#### Day 5: E2E Testing with Playwright
**Tasks**:
- [ ] Write E2E test: Create project → Assign to gate → Complete criteria → Auto-progress
- [ ] Write E2E test: Create policy → Assign to project → Track compliance → Request waiver → Approve
- [ ] Write E2E test: Create decision → Create actions → Complete actions → Verify implemented
- [ ] Write E2E test: View portfolio dashboard → Drill into project → View governance details → Export report
- [ ] Write E2E test: Create strategic initiative → Link projects → Calculate alignment
- [ ] Run all E2E tests and fix issues

**Deliverables**:
- `tests/e2e/governance.spec.ts` - All E2E scenarios
- E2E test report

---

### Week 11: Documentation & User Guide

#### Day 1-2: Technical Documentation
**Tasks**:
- [ ] Write `GOVERNANCE_ARCHITECTURE.md`:
  - System architecture overview
  - Database schema documentation
  - Service layer architecture
  - Integration points
  - Performance considerations
- [ ] Write `GOVERNANCE_API.md`:
  - All IPC handlers documented
  - Request/response examples
  - Error codes and handling
- [ ] Write `GOVERNANCE_INTEGRATION.md`:
  - Integration with Projects module
  - Integration with Dashboard (Gantt)
  - Integration with Calendar
  - Integration with ADO
  - Integration with Project Coordinator

**Deliverables**:
- `docs/GOVERNANCE_ARCHITECTURE.md`
- `docs/GOVERNANCE_API.md`
- `docs/GOVERNANCE_INTEGRATION.md`

---

#### Day 3-4: User Guide
**Tasks**:
- [ ] Write `GOVERNANCE_USER_GUIDE.md`:
  - Getting started with Governance module
  - Portfolio Dashboard explained
  - Stage Gate process walkthrough
  - Compliance management walkthrough
  - Decision Log usage
  - Action Items management
  - Strategic Alignment setup
  - Benefits tracking setup
  - Report generation
- [ ] Create screenshots/diagrams for user guide
- [ ] Create video walkthrough (optional)

**Deliverables**:
- `docs/GOVERNANCE_USER_GUIDE.md` - Comprehensive user documentation
- `docs/images/governance/` - Screenshots

---

#### Day 5: Code Comments & JSDoc
**Tasks**:
- [ ] Add JSDoc comments to all public methods
- [ ] Add inline comments for complex business logic
- [ ] Document configuration options
- [ ] Update README.md with Governance module information
- [ ] Create CHANGELOG.md entry for Governance module

**Deliverables**:
- Fully documented codebase
- Updated README.md
- CHANGELOG.md entry

---

## Phase 5: Performance Optimization & Launch (Week 12)

### Week 12: Optimization & Deployment

#### Day 1: Performance Testing & Optimization
**Tasks**:
- [ ] Run performance benchmarks:
  - Portfolio health score calculation time
  - Compliance matrix rendering time
  - Large dataset handling (1000+ projects)
  - Database query performance
- [ ] Optimize slow queries with EXPLAIN QUERY PLAN
- [ ] Add database indexes if missing
- [ ] Optimize React re-renders with useMemo/useCallback
- [ ] Implement virtual scrolling for large lists
- [ ] Add data pagination where appropriate
- [ ] Test on low-end hardware

**Deliverables**:
- Performance benchmark report
- Optimization commits

---

#### Day 2: Security Review
**Tasks**:
- [ ] Review IPC handlers for security vulnerabilities
- [ ] Validate all user inputs on backend
- [ ] Prevent SQL injection (prepared statements)
- [ ] Review audit logging coverage
- [ ] Test permission system (future: user roles)
- [ ] Review sensitive data handling

**Deliverables**:
- Security audit report
- Security fixes

---

#### Day 3: User Acceptance Testing (UAT)
**Tasks**:
- [ ] Prepare UAT environment
- [ ] Create UAT test scenarios
- [ ] Conduct UAT with stakeholders
- [ ] Gather feedback
- [ ] Document UAT issues
- [ ] Prioritize and fix critical issues

**Deliverables**:
- UAT test plan
- UAT feedback report
- Bug fixes

---

#### Day 4: Final Bug Fixes & Polish
**Tasks**:
- [ ] Fix all critical and high-priority bugs
- [ ] Polish UI/UX issues
- [ ] Verify all tests pass
- [ ] Verify build process works
- [ ] Test package on Windows/Mac/Linux
- [ ] Update version number

**Deliverables**:
- Bug-free governance module
- Tested packages

---

#### Day 5: Deployment & Launch
**Tasks**:
- [ ] Merge governance feature branch to main
- [ ] Create release tag (v1.1.0)
- [ ] Build production packages
- [ ] Deploy to production (if applicable)
- [ ] Announce release to users
- [ ] Monitor for issues
- [ ] Celebrate! 🎉

**Deliverables**:
- Production release v1.1.0
- Release notes
- User announcement

---

## Post-Launch Activities (Week 13+)

### Ongoing Maintenance
- [ ] Monitor user feedback and issues
- [ ] Track performance metrics
- [ ] Plan iterative improvements
- [ ] Address bug reports
- [ ] Collect feature requests for v1.2

### Future Enhancements (Backlog)
- [ ] User roles and permissions (viewer/editor/admin)
- [ ] Email notifications for escalations (requires email service)
- [ ] Advanced analytics and predictive insights
- [ ] AI-powered risk assessment
- [ ] Mobile app for governance dashboard
- [ ] API for third-party integrations
- [ ] Customizable dashboards with widget library
- [ ] Governance scorecards and KPI tracking
- [ ] Integration with additional PM tools (Jira, Asana)

---

## Resource Requirements

### Team Composition
- **1-2 Full-Stack Developers**: Database, backend services, frontend UI
- **1 Part-Time QA Engineer**: Testing and quality assurance
- **1 Part-Time Technical Writer**: Documentation
- **1 Product Owner/Stakeholder**: Requirements and UAT

### Development Environment
- **OS**: Windows/Mac/Linux
- **IDE**: VS Code or similar
- **Node.js**: v18+
- **Electron**: v38+
- **SQLite**: v3.40+
- **React**: v19+
- **TypeScript**: v5.9+

### Tools & Libraries
- **Testing**: Jest, Playwright, React Testing Library
- **State Management**: Zustand
- **Database**: better-sqlite3
- **Build**: Vite, electron-builder
- **Linting**: ESLint, Prettier
- **Version Control**: Git

---

## Risk Management

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database migration failure | High | Low | Extensive testing, rollback script, backup before migration |
| Performance issues with large datasets | Medium | Medium | Early performance testing, indexing, pagination |
| Complex state management bugs | Medium | Medium | Comprehensive unit tests, Zustand DevTools |
| IPC communication reliability | Medium | Low | Retry logic, error handling, integration tests |

### Schedule Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Scope creep | High | Medium | Clear requirements, change control process |
| Underestimated complexity | Medium | Medium | Buffer time built into schedule, prioritize MVP |
| Developer availability | Medium | Low | Cross-training, documentation |
| Dependency on external integrations | Low | Low | Stub external APIs for testing |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User adoption low | High | Low | UAT, user training, clear value proposition |
| Feature doesn't meet needs | High | Low | Regular stakeholder feedback, iterative approach |
| Integration issues with existing modules | Medium | Low | Integration testing, phased rollout |

---

## Success Criteria

### Technical Success
- [ ] All 14 governance tables created and migrated successfully
- [ ] 10 governance services implemented with 80%+ test coverage
- [ ] 8 governance UI pages fully functional and responsive
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Performance benchmarks met (dashboard loads <2s, calculations <5s)
- [ ] No critical or high-priority bugs

### Business Success
- [ ] Portfolio health score accurately reflects portfolio status
- [ ] Stage gate process reduces project approval time by 20%
- [ ] Compliance tracking reduces non-compliance incidents by 50%
- [ ] Decision log provides full audit trail for governance board
- [ ] Strategic alignment score helps prioritize projects
- [ ] Benefits tracking demonstrates project value
- [ ] Executive dashboard used weekly by leadership

### User Satisfaction
- [ ] UAT feedback score >4/5
- [ ] User documentation complete and clear
- [ ] Training materials available
- [ ] Support process in place for issues
- [ ] Positive user feedback on usability

---

## Appendix

### A. Database Schema Reference
See `docs/GOVERNANCE_DATABASE_SCHEMA.md` for complete schema definitions.

### B. API Reference
See `docs/GOVERNANCE_API.md` for IPC handler documentation.

### C. UI Component Library
See `app/renderer/components/governance/` for reusable components.

### D. Testing Strategy
See `tests/` directory for all test files.

### E. Configuration Settings
See `app/main/services/governance/config.ts` for configuration options.

---

## Changelog

**Version 1.0 - 2025-11-09**
- Initial implementation plan created
- 12-week timeline established
- 5 phases defined: Foundation, Service Layer, UI, Testing, Launch
- 14 database tables specified
- 10 service classes outlined
- 8 UI pages designed
- Comprehensive testing strategy defined

---

## Contact & Support

For questions or issues during implementation:
- **Development Team**: [Team Contact]
- **Product Owner**: [Stakeholder Contact]
- **Documentation**: `docs/` directory
- **Issue Tracker**: GitHub Issues

---

**End of Implementation Plan**
