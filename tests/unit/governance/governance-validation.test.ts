import {
  validateGateOrder,
  validateGateProgression,
  validateDateRange,
  validateNZDate,
  validateDecision,
  validateAction,
  validateActionDependency,
  validateEscalationLevel,
  validateBenefit,
  validateCompliance,
  validateGovernanceDates,
  validateROICalculation,
  calculateRequiredApprovals,
  isCircularDependency,
  formatNZDate,
  parseNZDate
} from '../../../app/main/validation/governance-validation';

describe('Governance Validation', () => {
  describe('✅ Date Validation', () => {
    describe('validateNZDate', () => {
      test('should accept valid NZ date format DD-MM-YYYY', () => {
        expect(validateNZDate('25-12-2024')).toBe(true);
        expect(validateNZDate('01-01-2024')).toBe(true);
        expect(validateNZDate('31-12-2024')).toBe(true);
      });

      test('should reject invalid date formats', () => {
        expect(validateNZDate('2024-12-25')).toBe(false); // ISO format
        expect(validateNZDate('12/25/2024')).toBe(false); // US format
        expect(validateNZDate('25.12.2024')).toBe(false); // Dot separator
        expect(validateNZDate('25-13-2024')).toBe(false); // Invalid month
        expect(validateNZDate('32-12-2024')).toBe(false); // Invalid day
        expect(validateNZDate('00-12-2024')).toBe(false); // Invalid day
        expect(validateNZDate('')).toBe(false);
      });

      test('should handle leap years correctly', () => {
        expect(validateNZDate('29-02-2024')).toBe(true);  // 2024 is leap year
        expect(validateNZDate('29-02-2023')).toBe(false); // 2023 is not
      });

      test('should validate days per month', () => {
        expect(validateNZDate('31-01-2024')).toBe(true);  // January has 31 days
        expect(validateNZDate('31-04-2024')).toBe(false); // April has 30 days
        expect(validateNZDate('30-02-2024')).toBe(false); // February max 29
      });
    });

    describe('validateDateRange', () => {
      test('should accept valid date ranges', () => {
        expect(validateDateRange('01-01-2024', '31-12-2024')).toBe(true);
        expect(validateDateRange('15-06-2024', '15-06-2024')).toBe(true); // Same day
      });

      test('should reject end date before start date', () => {
        expect(validateDateRange('31-12-2024', '01-01-2024')).toBe(false);
        expect(validateDateRange('15-06-2024', '14-06-2024')).toBe(false);
      });

      test('should reject invalid date formats in range', () => {
        expect(validateDateRange('invalid', '31-12-2024')).toBe(false);
        expect(validateDateRange('01-01-2024', 'invalid')).toBe(false);
      });
    });

    describe('formatNZDate and parseNZDate', () => {
      test('should convert between ISO and NZ formats', () => {
        const isoDate = '2024-12-25';
        const nzDate = '25-12-2024';
        
        expect(formatNZDate(isoDate)).toBe(nzDate);
        expect(parseNZDate(nzDate)).toBe(isoDate);
      });

      test('should handle single-digit days and months', () => {
        expect(formatNZDate('2024-01-05')).toBe('05-01-2024');
        expect(parseNZDate('05-01-2024')).toBe('2024-01-05');
      });

      test('should return null for invalid inputs', () => {
        expect(formatNZDate('invalid')).toBeNull();
        expect(parseNZDate('invalid')).toBeNull();
      });
    });

    describe('validateGovernanceDates', () => {
      test('should accept valid governance date structure', () => {
        const result = validateGovernanceDates({
          lastReviewDate: '01-06-2024',
          nextReviewDate: '01-12-2024',
          projectStartDate: '01-01-2024',
          projectEndDate: '31-12-2024'
        });

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should detect review date before project start', () => {
        const result = validateGovernanceDates({
          lastReviewDate: '01-01-2023',
          nextReviewDate: '01-12-2024',
          projectStartDate: '01-01-2024',
          projectEndDate: '31-12-2024'
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Last review date cannot be before project start date');
      });

      test('should detect next review date before last review', () => {
        const result = validateGovernanceDates({
          lastReviewDate: '01-12-2024',
          nextReviewDate: '01-06-2024',
          projectStartDate: '01-01-2024',
          projectEndDate: '31-12-2024'
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Next review date must be after last review date');
      });
    });
  });

  describe('✅ Gate Validation', () => {
    describe('validateGateOrder', () => {
      test('should accept gates with sequential order', () => {
        const gates = [
          { id: 1, gate_name: 'Gate 1', gate_order: 1, mandatory: true },
          { id: 2, gate_name: 'Gate 2', gate_order: 2, mandatory: true },
          { id: 3, gate_name: 'Gate 3', gate_order: 3, mandatory: false }
        ];

        const result = validateGateOrder(gates);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should detect duplicate gate orders', () => {
        const gates = [
          { id: 1, gate_name: 'Gate 1', gate_order: 1, mandatory: true },
          { id: 2, gate_name: 'Gate 2', gate_order: 1, mandatory: true }
        ];

        const result = validateGateOrder(gates);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Duplicate gate order: 1');
      });

      test('should detect gaps in gate sequence', () => {
        const gates = [
          { id: 1, gate_name: 'Gate 1', gate_order: 1, mandatory: true },
          { id: 2, gate_name: 'Gate 2', gate_order: 3, mandatory: true }
        ];

        const result = validateGateOrder(gates);
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Gap in gate sequence');
      });

      test('should detect gates not starting at 1', () => {
        const gates = [
          { id: 1, gate_name: 'Gate 1', gate_order: 2, mandatory: true },
          { id: 2, gate_name: 'Gate 2', gate_order: 3, mandatory: true }
        ];

        const result = validateGateOrder(gates);
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('must start at 1');
      });
    });

    describe('validateGateProgression', () => {
      test('should allow progression to next gate', () => {
        const result = validateGateProgression({
          currentGateOrder: 1,
          targetGateOrder: 2,
          mandatoryCriteriaMet: true,
          totalGates: 5
        });

        expect(result.valid).toBe(true);
      });

      test('should allow progression to final gate', () => {
        const result = validateGateProgression({
          currentGateOrder: 4,
          targetGateOrder: 5,
          mandatoryCriteriaMet: true,
          totalGates: 5
        });

        expect(result.valid).toBe(true);
      });

      test('should reject skipping gates', () => {
        const result = validateGateProgression({
          currentGateOrder: 1,
          targetGateOrder: 3,
          mandatoryCriteriaMet: true,
          totalGates: 5
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Cannot skip gates. Must progress to gate 2');
      });

      test('should reject progression when mandatory criteria not met', () => {
        const result = validateGateProgression({
          currentGateOrder: 1,
          targetGateOrder: 2,
          mandatoryCriteriaMet: false,
          totalGates: 5
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('All mandatory criteria must be met before progressing');
      });

      test('should reject backward progression', () => {
        const result = validateGateProgression({
          currentGateOrder: 3,
          targetGateOrder: 2,
          mandatoryCriteriaMet: true,
          totalGates: 5
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Cannot move backward to gate 2');
      });

      test('should reject progression beyond total gates', () => {
        const result = validateGateProgression({
          currentGateOrder: 5,
          targetGateOrder: 6,
          mandatoryCriteriaMet: true,
          totalGates: 5
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Target gate 6 exceeds total gates (5)');
      });
    });
  });

  describe('✅ Decision Validation', () => {
    describe('validateDecision', () => {
      test('should accept valid decision with all required fields', () => {
        const result = validateDecision({
          decision_type: 'approve',
          decision_date: '15-06-2024',
          decided_by: 'John Doe',
          rationale: 'Project aligns with strategic goals'
        });

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should require decision_type', () => {
        const result = validateDecision({
          decision_type: '',
          decision_date: '15-06-2024',
          decided_by: 'John Doe'
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Decision type is required');
      });

      test('should validate decision_type against allowed types', () => {
        const result = validateDecision({
          decision_type: 'invalid_type',
          decision_date: '15-06-2024',
          decided_by: 'John Doe'
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('must be one of');
      });

      test('should require decided_by', () => {
        const result = validateDecision({
          decision_type: 'approve',
          decision_date: '15-06-2024',
          decided_by: ''
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Decided by is required');
      });

      test('should validate decision_date format', () => {
        const result = validateDecision({
          decision_type: 'approve',
          decision_date: '2024-06-15',
          decided_by: 'John Doe'
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Decision date must be in DD-MM-YYYY format');
      });

      test('should reject future decision dates', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const futureDateStr = formatNZDate(futureDate.toISOString().split('T')[0]) || '';

        const result = validateDecision({
          decision_type: 'approve',
          decision_date: futureDateStr,
          decided_by: 'John Doe'
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Decision date cannot be in the future');
      });
    });
  });

  describe('✅ Action Validation', () => {
    describe('validateAction', () => {
      test('should accept valid action', () => {
        const result = validateAction({
          action_title: 'Complete risk assessment',
          priority: 'high',
          due_date: '31-12-2024',
          status: 'open',
          assigned_to: 'Jane Smith'
        });

        expect(result.valid).toBe(true);
      });

      test('should require action_title', () => {
        const result = validateAction({
          action_title: '',
          priority: 'high',
          due_date: '31-12-2024'
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Action title is required');
      });

      test('should validate priority levels', () => {
        const result = validateAction({
          action_title: 'Test action',
          priority: 'invalid',
          due_date: '31-12-2024'
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Priority must be one of');
      });

      test('should validate status values', () => {
        const result = validateAction({
          action_title: 'Test action',
          priority: 'high',
          status: 'invalid',
          due_date: '31-12-2024'
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Status must be one of');
      });

      test('should validate due_date format', () => {
        const result = validateAction({
          action_title: 'Test action',
          priority: 'high',
          due_date: '2024-12-31'
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Due date must be in DD-MM-YYYY format');
      });
    });

    describe('validateActionDependency', () => {
      const mockActions = [
        { id: 1, action_title: 'Action 1', status: 'completed' },
        { id: 2, action_title: 'Action 2', status: 'in-progress' },
        { id: 3, action_title: 'Action 3', status: 'open' }
      ];

      test('should accept valid dependency', () => {
        const result = validateActionDependency({
          actionId: 2,
          dependsOnId: 1,
          existingActions: mockActions
        });

        expect(result.valid).toBe(true);
      });

      test('should reject self-dependency', () => {
        const result = validateActionDependency({
          actionId: 1,
          dependsOnId: 1,
          existingActions: mockActions
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Action cannot depend on itself');
      });

      test('should reject dependency on non-existent action', () => {
        const result = validateActionDependency({
          actionId: 2,
          dependsOnId: 999,
          existingActions: mockActions
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Dependent action (999) does not exist');
      });

      test('should detect circular dependencies', () => {
        const result = validateActionDependency({
          actionId: 1,
          dependsOnId: 2,
          existingActions: mockActions,
          existingDependencies: [
            { action_id: 2, depends_on_action_id: 1 }
          ]
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Circular dependency detected');
      });
    });

    describe('isCircularDependency', () => {
      test('should detect simple circular dependency', () => {
        const dependencies = [
          { action_id: 1, depends_on_action_id: 2 },
          { action_id: 2, depends_on_action_id: 1 }
        ];

        expect(isCircularDependency(1, 2, dependencies)).toBe(true);
      });

      test('should detect complex circular dependency chain', () => {
        const dependencies = [
          { action_id: 1, depends_on_action_id: 2 },
          { action_id: 2, depends_on_action_id: 3 },
          { action_id: 3, depends_on_action_id: 1 }
        ];

        expect(isCircularDependency(1, 2, dependencies)).toBe(true);
      });

      test('should return false for valid dependency chain', () => {
        const dependencies = [
          { action_id: 2, depends_on_action_id: 1 },
          { action_id: 3, depends_on_action_id: 2 }
        ];

        expect(isCircularDependency(3, 1, dependencies)).toBe(false);
      });
    });
  });

  describe('✅ Escalation Validation', () => {
    describe('validateEscalationLevel', () => {
      test('should accept valid escalation levels', () => {
        const validLevels = [1, 2, 3, 4];
        
        validLevels.forEach(level => {
          const result = validateEscalationLevel({
            level,
            daysOverdue: level * 7
          });
          expect(result.valid).toBe(true);
        });
      });

      test('should map days overdue to correct escalation levels', () => {
        const testCases = [
          { days: 5, expectedLevel: 1 },
          { days: 10, expectedLevel: 2 },
          { days: 20, expectedLevel: 3 },
          { days: 35, expectedLevel: 4 }
        ];

        testCases.forEach(({ days, expectedLevel }) => {
          const result = validateEscalationLevel({
            level: expectedLevel,
            daysOverdue: days
          });
          expect(result.valid).toBe(true);
          expect(result.recommendedLevel).toBe(expectedLevel);
        });
      });

      test('should reject invalid escalation levels', () => {
        const result = validateEscalationLevel({
          level: 5,
          daysOverdue: 10
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Escalation level must be between 1 and 4');
      });

      test('should warn if level doesnt match days overdue', () => {
        const result = validateEscalationLevel({
          level: 1,
          daysOverdue: 35
        });

        expect(result.valid).toBe(true);
        expect(result.warnings).toContain('Level 1 may be too low for 35 days overdue (recommended: Level 4)');
      });
    });

    describe('calculateRequiredApprovals', () => {
      test('should return correct approvals for each level', () => {
        expect(calculateRequiredApprovals(1)).toEqual(['Team Lead']);
        expect(calculateRequiredApprovals(2)).toEqual(['Team Lead', 'Project Manager']);
        expect(calculateRequiredApprovals(3)).toEqual(['Team Lead', 'Project Manager', 'Portfolio Manager']);
        expect(calculateRequiredApprovals(4)).toEqual(['Team Lead', 'Project Manager', 'Portfolio Manager', 'Executive Sponsor']);
      });

      test('should return empty array for invalid levels', () => {
        expect(calculateRequiredApprovals(0)).toEqual([]);
        expect(calculateRequiredApprovals(5)).toEqual([]);
        expect(calculateRequiredApprovals(-1)).toEqual([]);
      });
    });
  });

  describe('✅ Benefits Validation', () => {
    describe('validateBenefit', () => {
      test('should accept valid benefit with all fields', () => {
        const result = validateBenefit({
          benefit_type: 'financial',
          description: 'Cost savings from automation',
          expected_value: 100000,
          realization_status: 'on-track',
          target_date: '31-12-2024'
        });

        expect(result.valid).toBe(true);
      });

      test('should require description', () => {
        const result = validateBenefit({
          benefit_type: 'financial',
          description: '',
          expected_value: 100000
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Benefit description is required');
      });

      test('should validate benefit_type', () => {
        const result = validateBenefit({
          benefit_type: 'invalid',
          description: 'Test benefit',
          expected_value: 100000
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Benefit type must be one of');
      });

      test('should require positive expected_value', () => {
        const result = validateBenefit({
          benefit_type: 'financial',
          description: 'Test benefit',
          expected_value: -1000
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Expected value must be greater than 0');
      });

      test('should validate target_date format', () => {
        const result = validateBenefit({
          benefit_type: 'financial',
          description: 'Test benefit',
          expected_value: 100000,
          target_date: '2024-12-31'
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Target date must be in DD-MM-YYYY format');
      });
    });

    describe('validateROICalculation', () => {
      test('should accept valid ROI calculation', () => {
        const result = validateROICalculation({
          totalCost: 100000,
          totalBenefits: 150000,
          calculatedROI: 50.0
        });

        expect(result.valid).toBe(true);
      });

      test('should reject zero or negative costs', () => {
        const result = validateROICalculation({
          totalCost: 0,
          totalBenefits: 150000,
          calculatedROI: 0
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Total cost must be greater than 0');
      });

      test('should detect incorrect ROI calculation', () => {
        const result = validateROICalculation({
          totalCost: 100000,
          totalBenefits: 150000,
          calculatedROI: 75.0 // Should be 50%
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('ROI calculation is incorrect');
      });

      test('should accept negative ROI for losses', () => {
        const result = validateROICalculation({
          totalCost: 100000,
          totalBenefits: 80000,
          calculatedROI: -20.0
        });

        expect(result.valid).toBe(true);
      });
    });
  });

  describe('✅ Compliance Validation', () => {
    describe('validateCompliance', () => {
      test('should accept valid compliance record', () => {
        const result = validateCompliance({
          project_id: 'PROJ-001',
          policy_id: 1,
          compliance_status: 'compliant',
          checked_date: '15-06-2024',
          checked_by: 'Auditor Name'
        });

        expect(result.valid).toBe(true);
      });

      test('should require project_id', () => {
        const result = validateCompliance({
          project_id: '',
          policy_id: 1,
          compliance_status: 'compliant'
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Project ID is required');
      });

      test('should require policy_id', () => {
        const result = validateCompliance({
          project_id: 'PROJ-001',
          policy_id: 0,
          compliance_status: 'compliant'
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Policy ID is required');
      });

      test('should validate compliance_status', () => {
        const result = validateCompliance({
          project_id: 'PROJ-001',
          policy_id: 1,
          compliance_status: 'invalid'
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Compliance status must be one of');
      });

      test('should validate checked_date format', () => {
        const result = validateCompliance({
          project_id: 'PROJ-001',
          policy_id: 1,
          compliance_status: 'compliant',
          checked_date: '2024-06-15'
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Checked date must be in DD-MM-YYYY format');
      });

      test('should require checked_by when checked_date is provided', () => {
        const result = validateCompliance({
          project_id: 'PROJ-001',
          policy_id: 1,
          compliance_status: 'compliant',
          checked_date: '15-06-2024',
          checked_by: ''
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Checked by is required when checked date is provided');
      });
    });
  });

  describe('❌ Edge Cases and Error Handling', () => {
    test('should handle null and undefined inputs gracefully', () => {
      expect(() => validateNZDate(null as any)).not.toThrow();
      expect(() => validateNZDate(undefined as any)).not.toThrow();
      expect(() => validateDecision(null as any)).not.toThrow();
      expect(() => validateAction(null as any)).not.toThrow();
    });

    test('should handle empty arrays in gate validation', () => {
      const result = validateGateOrder([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No gates provided');
    });

    test('should handle very large numbers in ROI calculation', () => {
      const result = validateROICalculation({
        totalCost: Number.MAX_SAFE_INTEGER,
        totalBenefits: Number.MAX_SAFE_INTEGER * 1.5,
        calculatedROI: 50.0
      });

      expect(result.valid).toBe(true);
    });

    test('should handle whitespace in string validations', () => {
      const result = validateDecision({
        decision_type: '  approve  ',
        decision_date: '15-06-2024',
        decided_by: '  John Doe  '
      });

      expect(result.valid).toBe(true);
    });
  });
});
