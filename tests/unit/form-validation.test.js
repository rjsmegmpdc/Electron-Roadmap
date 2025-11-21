/**
 * @jest-environment jsdom
 * 
 * Test Suite for FormValidation
 * 
 * Tests cover:
 * - Project validation (title, dates, budget, financial treatment)
 * - Task validation (title, dates, effort, status)
 * - Resource validation (name, type, allocation, rate)
 * - Date format validation using DateUtils
 * - Field length and format validation
 * - Error message generation
 * - Edge cases and boundary values
 */

import FormValidation from '../../src/js/form-validation.js';
import DateUtils from '../../src/js/date-utils.js';

// Mock DateUtils
jest.mock('../../src/js/date-utils.js');

describe('FormValidation', () => {
  beforeEach(() => {
    // Setup DateUtils mocks
    DateUtils.isValidNZ = jest.fn();
    DateUtils.parseNZ = jest.fn();
    DateUtils.compareNZ = jest.fn();
  });

  describe('validateProject', () => {
    test('should validate complete valid project', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.parseNZ.mockReturnValueOnce(new Date(2025, 0, 1))
                       .mockReturnValueOnce(new Date(2025, 11, 31));
      DateUtils.compareNZ.mockReturnValue(-1); // start < end
      
      const projectData = {
        title: 'Valid Project',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      const result = FormValidation.validateProject(projectData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should require title field', () => {
      const projectData = {
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      const result = FormValidation.validateProject(projectData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    test('should reject empty title', () => {
      const projectData = {
        title: '',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      const result = FormValidation.validateProject(projectData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title cannot be empty');
    });

    test('should enforce title length limit', () => {
      const projectData = {
        title: 'A'.repeat(201), // 201 characters
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      const result = FormValidation.validateProject(projectData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title must be 200 characters or less');
    });

    test('should validate start_date format', () => {
      DateUtils.isValidNZ.mockReturnValue(false);
      
      const projectData = {
        title: 'Valid Project',
        start_date: 'invalid-date',
        end_date: '31/12/2025',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      const result = FormValidation.validateProject(projectData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be in DD/MM/YYYY format');
    });

    test('should validate end_date format', () => {
      DateUtils.isValidNZ.mockReturnValueOnce(true).mockReturnValueOnce(false);
      
      const projectData = {
        title: 'Valid Project',
        start_date: '01/01/2025',
        end_date: 'invalid-date',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      const result = FormValidation.validateProject(projectData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('End date must be in DD/MM/YYYY format');
    });

    test('should ensure end_date is after start_date', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.parseNZ.mockReturnValueOnce(new Date(2025, 11, 31))
                       .mockReturnValueOnce(new Date(2025, 0, 1));
      DateUtils.compareNZ.mockReturnValue(1); // start > end
      
      const projectData = {
        title: 'Valid Project',
        start_date: '31/12/2025',
        end_date: '01/01/2025',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      const result = FormValidation.validateProject(projectData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('End date must be after start date');
    });

    test('should validate budget_cents is non-negative', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
      
      const projectData = {
        title: 'Valid Project',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: -1000,
        financial_treatment: 'CAPEX'
      };
      
      const result = FormValidation.validateProject(projectData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Budget must be non-negative');
    });

    test('should allow zero budget', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
      
      const projectData = {
        title: 'Valid Project',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: 0,
        financial_treatment: 'CAPEX'
      };
      
      const result = FormValidation.validateProject(projectData);
      
      expect(result.isValid).toBe(true);
    });

    test('should validate financial_treatment enum', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
      
      const projectData = {
        title: 'Valid Project',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: 1000000,
        financial_treatment: 'INVALID'
      };
      
      const result = FormValidation.validateProject(projectData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Financial treatment must be CAPEX or OPEX');
    });

    test('should accept valid financial_treatment values', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
      
      const capexProject = {
        title: 'CAPEX Project',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      const opexProject = {
        title: 'OPEX Project',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: 1000000,
        financial_treatment: 'OPEX'
      };
      
      expect(FormValidation.validateProject(capexProject).isValid).toBe(true);
      expect(FormValidation.validateProject(opexProject).isValid).toBe(true);
    });
  });

  describe('validateTask', () => {
    test('should validate complete valid task', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
      
      const taskData = {
        title: 'Valid Task',
        start_date: '01/01/2025',
        end_date: '15/01/2025',
        effort_hours: 40,
        status: 'planned'
      };
      
      const result = FormValidation.validateTask(taskData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should require title field', () => {
      const taskData = {
        start_date: '01/01/2025',
        end_date: '15/01/2025',
        effort_hours: 40,
        status: 'planned'
      };
      
      const result = FormValidation.validateTask(taskData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    test('should validate effort_hours is non-negative', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
      
      const taskData = {
        title: 'Valid Task',
        start_date: '01/01/2025',
        end_date: '15/01/2025',
        effort_hours: -10,
        status: 'planned'
      };
      
      const result = FormValidation.validateTask(taskData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Effort hours must be non-negative');
    });

    test('should allow zero effort_hours', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
      
      const taskData = {
        title: 'Valid Task',
        start_date: '01/01/2025',
        end_date: '15/01/2025',
        effort_hours: 0,
        status: 'planned'
      };
      
      const result = FormValidation.validateTask(taskData);
      
      expect(result.isValid).toBe(true);
    });

    test('should validate status enum', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
      
      const taskData = {
        title: 'Valid Task',
        start_date: '01/01/2025',
        end_date: '15/01/2025',
        effort_hours: 40,
        status: 'invalid-status'
      };
      
      const result = FormValidation.validateTask(taskData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Status must be one of: planned, in-progress, completed, on-hold');
    });

    test('should accept valid status values', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
      
      const validStatuses = ['planned', 'in-progress', 'completed', 'on-hold'];
      
      validStatuses.forEach(status => {
        const taskData = {
          title: 'Valid Task',
          start_date: '01/01/2025',
          end_date: '15/01/2025',
          effort_hours: 40,
          status: status
        };
        
        const result = FormValidation.validateTask(taskData);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateResource', () => {
    test('should validate complete valid internal resource', () => {
      const resourceData = {
        name: 'John Doe',
        type: 'internal',
        allocation_percentage: 100,
        rate_per_hour_cents: 0
      };
      
      const result = FormValidation.validateResource(resourceData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate complete valid contractor resource', () => {
      const resourceData = {
        name: 'Jane Smith',
        type: 'contractor',
        allocation_percentage: 50,
        rate_per_hour_cents: 8000
      };
      
      const result = FormValidation.validateResource(resourceData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should require name field', () => {
      const resourceData = {
        type: 'internal',
        allocation_percentage: 100,
        rate_per_hour_cents: 0
      };
      
      const result = FormValidation.validateResource(resourceData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    test('should reject empty name', () => {
      const resourceData = {
        name: '',
        type: 'internal',
        allocation_percentage: 100,
        rate_per_hour_cents: 0
      };
      
      const result = FormValidation.validateResource(resourceData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name cannot be empty');
    });

    test('should validate type enum', () => {
      const resourceData = {
        name: 'John Doe',
        type: 'invalid-type',
        allocation_percentage: 100,
        rate_per_hour_cents: 0
      };
      
      const result = FormValidation.validateResource(resourceData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Type must be internal or contractor');
    });

    test('should validate allocation_percentage range', () => {
      const invalidResourceLow = {
        name: 'John Doe',
        type: 'internal',
        allocation_percentage: -1,
        rate_per_hour_cents: 0
      };
      
      const invalidResourceHigh = {
        name: 'Jane Smith',
        type: 'internal',
        allocation_percentage: 101,
        rate_per_hour_cents: 0
      };
      
      expect(FormValidation.validateResource(invalidResourceLow).isValid).toBe(false);
      expect(FormValidation.validateResource(invalidResourceLow).errors)
        .toContain('Allocation percentage must be between 0 and 100');
        
      expect(FormValidation.validateResource(invalidResourceHigh).isValid).toBe(false);
      expect(FormValidation.validateResource(invalidResourceHigh).errors)
        .toContain('Allocation percentage must be between 0 and 100');
    });

    test('should accept boundary allocation_percentage values', () => {
      const resource0 = {
        name: 'John Doe',
        type: 'internal',
        allocation_percentage: 0,
        rate_per_hour_cents: 0
      };
      
      const resource100 = {
        name: 'Jane Smith',
        type: 'internal',
        allocation_percentage: 100,
        rate_per_hour_cents: 0
      };
      
      expect(FormValidation.validateResource(resource0).isValid).toBe(true);
      expect(FormValidation.validateResource(resource100).isValid).toBe(true);
    });

    test('should validate rate_per_hour_cents is non-negative', () => {
      const resourceData = {
        name: 'John Doe',
        type: 'contractor',
        allocation_percentage: 100,
        rate_per_hour_cents: -1000
      };
      
      const result = FormValidation.validateResource(resourceData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Rate per hour must be non-negative');
    });
  });

  describe('Date validation integration', () => {
    test('should handle DateUtils validation errors', () => {
      DateUtils.isValidNZ.mockImplementation(() => {
        throw new Error('DateUtils error');
      });
      
      const projectData = {
        title: 'Test Project',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      const result = FormValidation.validateProject(projectData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Date validation error');
    });

    test('should handle DateUtils comparison errors', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.parseNZ.mockReturnValue(new Date(2025, 0, 1));
      DateUtils.compareNZ.mockImplementation(() => {
        throw new Error('Compare error');
      });
      
      const projectData = {
        title: 'Test Project',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: 1000000,
        financial_treatment: 'CAPEX'
      };
      
      const result = FormValidation.validateProject(projectData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Date comparison error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null/undefined input data', () => {
      expect(FormValidation.validateProject(null).isValid).toBe(false);
      expect(FormValidation.validateProject(undefined).isValid).toBe(false);
      expect(FormValidation.validateTask(null).isValid).toBe(false);
      expect(FormValidation.validateTask(undefined).isValid).toBe(false);
      expect(FormValidation.validateResource(null).isValid).toBe(false);
      expect(FormValidation.validateResource(undefined).isValid).toBe(false);
    });

    test('should handle empty objects', () => {
      const emptyProject = FormValidation.validateProject({});
      const emptyTask = FormValidation.validateTask({});
      const emptyResource = FormValidation.validateResource({});
      
      expect(emptyProject.isValid).toBe(false);
      expect(emptyTask.isValid).toBe(false);
      expect(emptyResource.isValid).toBe(false);
      
      expect(emptyProject.errors.length).toBeGreaterThan(0);
      expect(emptyTask.errors.length).toBeGreaterThan(0);
      expect(emptyResource.errors.length).toBeGreaterThan(0);
    });

    test('should handle string numbers for numeric fields', () => {
      DateUtils.isValidNZ.mockReturnValue(true);
      DateUtils.compareNZ.mockReturnValue(-1);
      
      const projectData = {
        title: 'Test Project',
        start_date: '01/01/2025',
        end_date: '31/12/2025',
        budget_cents: '1000000', // String number
        financial_treatment: 'CAPEX'
      };
      
      const result = FormValidation.validateProject(projectData);
      expect(result.isValid).toBe(true);
    });

    test('should handle invalid string numbers', () => {
      const resourceData = {
        name: 'John Doe',
        type: 'internal',
        allocation_percentage: 'not-a-number',
        rate_per_hour_cents: 0
      };
      
      const result = FormValidation.validateResource(resourceData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Allocation percentage must be a valid number');
    });
  });
});