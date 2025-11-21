/**
 * Governance Module - Validation Layer
 * 
 * Business rule validation for governance entities
 */

import {
  GovernanceGate,
  GateCriteria,
  ProjectGate,
  GateCriteriaCompliance,
  ValidationResult,
  ValidationReport,
  ValidationError,
  GovernanceDecision,
  GovernanceAction,
  Escalation,
  StrategicInitiative,
  ProjectBenefit
} from '../types/governance';

// ===== GATE VALIDATION =====

export function validateGateOrder(gates: GovernanceGate[], templateId: number): ValidationResult {
  const gatesInTemplate = gates.filter(g => g.template_id === templateId);
  
  if (gatesInTemplate.length === 0) {
    return { valid: true }; // No gates to validate
  }
  
  const orders = gatesInTemplate.map(g => g.gate_order);
  
  // Check for duplicates
  const hasDuplicates = new Set(orders).size !== orders.length;
  if (hasDuplicates) {
    return { 
      valid: false, 
      error: 'Gate order must be unique within template',
      details: { duplicates: orders.filter((o, i) => orders.indexOf(o) !== i) }
    };
  }
  
  // Check sequential (1, 2, 3, ... n)
  const sortedOrders = [...orders].sort((a, b) => a - b);
  const isSequential = sortedOrders.every((order, index) => order === index + 1);
  
  if (!isSequential) {
    return { 
      valid: false, 
      error: 'Gate order must be sequential starting from 1',
      details: { actual: sortedOrders, expected: sortedOrders.map((_, i) => i + 1) }
    };
  }
  
  return { valid: true };
}

export function validateGateProgression(
  projectGate: ProjectGate,
  criteriaCompliance: GateCriteriaCompliance[],
  criteria: GateCriteria[]
): ValidationResult {
  if (projectGate.gate_status === 'passed' || projectGate.gate_status === 'passed-with-conditions') {
    // Check all mandatory criteria are met
    const mandatoryCriteriaIds = criteria
      .filter(c => c.gate_id === projectGate.gate_id && c.is_mandatory)
      .map(c => c.criteria_id);
    
    const mandatoryCompliance = criteriaCompliance.filter(
      cc => mandatoryCriteriaIds.includes(cc.criteria_id)
    );
    
    const allMet = mandatoryCompliance.every(
      cc => cc.status === 'met' || cc.status === 'waived'
    );
    
    if (!allMet) {
      const unmetCriteria = mandatoryCompliance
        .filter(cc => cc.status !== 'met' && cc.status !== 'waived')
        .map(cc => ({
          criteria_id: cc.criteria_id,
          status: cc.status
        }));
      
      return {
        valid: false,
        error: 'Cannot mark gate as passed - mandatory criteria not met',
        details: { unmetCriteria }
      };
    }
  }
  
  return { valid: true };
}

// ===== DATE VALIDATION =====

export function validateNZDate(dateStr: string): ValidationResult {
  const nzDateRegex = /^\d{2}-\d{2}-\d{4}$/;
  
  if (!nzDateRegex.test(dateStr)) {
    return {
      valid: false,
      error: 'Date must be in DD-MM-YYYY format',
      details: { provided: dateStr }
    };
  }
  
  const [day, month, year] = dateStr.split('-').map(Number);
  
  // Validate month
  if (month < 1 || month > 12) {
    return {
      valid: false,
      error: 'Invalid month (must be 1-12)',
      details: { month }
    };
  }
  
  // Validate day
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return {
      valid: false,
      error: `Invalid day for month ${month} (must be 1-${daysInMonth})`,
      details: { day, month, daysInMonth }
    };
  }
  
  // Validate year (reasonable range)
  if (year < 2000 || year > 2100) {
    return {
      valid: false,
      error: 'Year must be between 2000 and 2100',
      details: { year }
    };
  }
  
  return { valid: true };
}

export function validateISODate(dateStr: string): ValidationResult {
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      error: 'Invalid ISO date format',
      details: { provided: dateStr }
    };
  }
  
  return { valid: true };
}

export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      valid: false,
      error: 'Invalid date format',
      details: { startDate, endDate }
    };
  }
  
  if (start > end) {
    return {
      valid: false,
      error: 'Start date must be before or equal to end date',
      details: { startDate, endDate }
    };
  }
  
  return { valid: true };
}

// ===== DECISION VALIDATION =====

export function validateDecisionDate(decisionDate: string): ValidationResult {
  const date = new Date(decisionDate);
  const now = new Date();
  
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      error: 'Invalid decision date format',
      details: { provided: decisionDate }
    };
  }
  
  if (date > now) {
    return {
      valid: false,
      error: 'Decision date cannot be in the future',
      details: { decisionDate, currentDate: now.toISOString() }
    };
  }
  
  return { valid: true };
}

export function validateDecisionImpact(decision: Partial<GovernanceDecision>): ValidationReport {
  const errors: ValidationError[] = [];
  
  if (decision.impact_budget !== null && decision.impact_budget !== undefined) {
    if (decision.impact_budget < 0) {
      errors.push({
        field: 'impact_budget',
        message: 'Budget impact cannot be negative',
        value: decision.impact_budget
      });
    }
  }
  
  if (decision.decision_type === 'strategic' && !decision.decision_rationale) {
    errors.push({
      field: 'decision_rationale',
      message: 'Strategic decisions require rationale',
      value: decision.decision_rationale
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ===== ACTION VALIDATION =====

export function validateActionDueDate(action: Partial<GovernanceAction>): ValidationResult {
  if (!action.due_date) {
    return { valid: true }; // Due date is optional
  }
  
  const dueDate = new Date(action.due_date);
  const createdAt = action.created_at ? new Date(action.created_at) : new Date();
  
  if (isNaN(dueDate.getTime())) {
    return {
      valid: false,
      error: 'Invalid due date format',
      details: { provided: action.due_date }
    };
  }
  
  if (dueDate < createdAt) {
    return {
      valid: false,
      error: 'Due date must be after creation date',
      details: { dueDate: action.due_date, createdAt: createdAt.toISOString() }
    };
  }
  
  return { valid: true };
}

export function validateActionDependency(
  actionId: number,
  dependsOnActionId: number
): ValidationResult {
  if (actionId === dependsOnActionId) {
    return {
      valid: false,
      error: 'Action cannot depend on itself',
      details: { actionId }
    };
  }
  
  return { valid: true };
}

// ===== ESCALATION VALIDATION =====

export function validateEscalationLevel(level: number): ValidationResult {
  if (!Number.isInteger(level)) {
    return {
      valid: false,
      error: 'Escalation level must be an integer',
      details: { provided: level }
    };
  }
  
  if (level < 1 || level > 5) {
    return {
      valid: false,
      error: 'Escalation level must be between 1 and 5',
      details: { provided: level }
    };
  }
  
  return { valid: true };
}

// ===== STRATEGIC ALIGNMENT VALIDATION =====

export function validateAlignmentScore(score: number): ValidationResult {
  if (!Number.isFinite(score)) {
    return {
      valid: false,
      error: 'Alignment score must be a number',
      details: { provided: score }
    };
  }
  
  if (score < 0 || score > 100) {
    return {
      valid: false,
      error: 'Alignment score must be between 0 and 100',
      details: { provided: score }
    };
  }
  
  return { valid: true };
}

export function validateInitiativeProgress(percentage: number): ValidationResult {
  if (!Number.isInteger(percentage)) {
    return {
      valid: false,
      error: 'Progress percentage must be an integer',
      details: { provided: percentage }
    };
  }
  
  if (percentage < 0 || percentage > 100) {
    return {
      valid: false,
      error: 'Progress percentage must be between 0 and 100',
      details: { provided: percentage }
    };
  }
  
  return { valid: true };
}

export function validateInitiativeDates(initiative: Partial<StrategicInitiative>): ValidationResult {
  if (!initiative.start_date || !initiative.target_date) {
    return {
      valid: false,
      error: 'Initiative requires both start and target dates',
      details: { start_date: initiative.start_date, target_date: initiative.target_date }
    };
  }
  
  return validateDateRange(initiative.start_date, initiative.target_date);
}

// ===== BENEFITS VALIDATION =====

export function validateBenefitValues(benefit: Partial<ProjectBenefit>): ValidationReport {
  const errors: ValidationError[] = [];
  
  if (benefit.target_value !== undefined && benefit.target_value !== null) {
    if (!Number.isFinite(benefit.target_value)) {
      errors.push({
        field: 'target_value',
        message: 'Target value must be a number',
        value: benefit.target_value
      });
    }
  }
  
  if (benefit.baseline_value !== undefined && benefit.baseline_value !== null) {
    if (!Number.isFinite(benefit.baseline_value)) {
      errors.push({
        field: 'baseline_value',
        message: 'Baseline value must be a number',
        value: benefit.baseline_value
      });
    }
  }
  
  if (benefit.actual_value !== undefined && benefit.actual_value !== null) {
    if (!Number.isFinite(benefit.actual_value)) {
      errors.push({
        field: 'actual_value',
        message: 'Actual value must be a number',
        value: benefit.actual_value
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ===== POLICY COMPLIANCE VALIDATION =====

export function validateComplianceDueDate(dueDate: string | null, effectiveDate: string): ValidationResult {
  if (!dueDate) {
    return { valid: true }; // Due date is optional
  }
  
  const due = new Date(dueDate);
  const effective = new Date(effectiveDate);
  
  if (isNaN(due.getTime()) || isNaN(effective.getTime())) {
    return {
      valid: false,
      error: 'Invalid date format',
      details: { dueDate, effectiveDate }
    };
  }
  
  if (due < effective) {
    return {
      valid: false,
      error: 'Compliance due date cannot be before policy effective date',
      details: { dueDate, effectiveDate }
    };
  }
  
  return { valid: true };
}

export function validateWaiverExpiry(waiverExpiryDate: string | null, requestedDate: string): ValidationResult {
  if (!waiverExpiryDate) {
    return { valid: true }; // Expiry date is optional
  }
  
  const expiry = new Date(waiverExpiryDate);
  const requested = new Date(requestedDate);
  
  if (isNaN(expiry.getTime()) || isNaN(requested.getTime())) {
    return {
      valid: false,
      error: 'Invalid date format',
      details: { waiverExpiryDate, requestedDate }
    };
  }
  
  if (expiry < requested) {
    return {
      valid: false,
      error: 'Waiver expiry date cannot be before requested date',
      details: { waiverExpiryDate, requestedDate }
    };
  }
  
  return { valid: true };
}

// ===== COMPOSITE VALIDATION =====

export function validateGovernanceEntity<T extends Record<string, any>>(
  entity: T,
  validators: Array<(e: T) => ValidationResult | ValidationReport>
): ValidationReport {
  const errors: ValidationError[] = [];
  
  for (const validator of validators) {
    const result = validator(entity);
    
    if (!result.valid) {
      if ('errors' in result) {
        errors.push(...result.errors);
      } else {
        errors.push({
          field: 'general',
          message: result.error || 'Validation failed',
          value: result.details
        });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ===== UTILITY FUNCTIONS =====

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  return due < now;
}

export function daysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isWithinWindow(date: string, windowDays: number): boolean {
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  const daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return daysUntil >= 0 && daysUntil <= windowDays;
}
