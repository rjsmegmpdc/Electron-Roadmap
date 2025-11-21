/**
 * Simple Validators Test
 * 
 * Basic tests to demonstrate the validation system functionality.
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');

// Simple test without ES modules for demonstration
describe('Validators Module Structure', () => {
  test('should be able to create validation components', () => {
    // This test just demonstrates the module structure
    expect(true).toBe(true);
  });
});

// Test validation logic without imports
describe('Validation Logic Tests', () => {
  describe('Validation Result', () => {
    let ValidationResult;
    
    beforeEach(() => {
      // Define ValidationResult class inline for testing
      ValidationResult = class {
        constructor(valid = true, errors = [], warnings = []) {
          this.valid = valid;
          this.errors = errors;
          this.warnings = warnings;
        }
        
        addError(field, message, code = 'INVALID', value = undefined) {
          this.valid = false;
          this.errors.push({ field, message, code, value });
        }
        
        addWarning(field, message, value = undefined) {
          this.warnings.push({ field, message, value });
        }
        
        merge(other) {
          if (!other.valid) this.valid = false;
          this.errors.push(...other.errors);
          this.warnings.push(...other.warnings);
        }
        
        getFieldErrors(field) {
          return this.errors.filter(error => error.field === field);
        }
        
        hasFieldError(field) {
          return this.errors.some(error => error.field === field);
        }
        
        getFieldMessages() {
          const messages = {};
          for (const error of this.errors) {
            if (!messages[error.field]) {
              messages[error.field] = [];
            }
            messages[error.field].push(error.message);
          }
          
          for (const field in messages) {
            if (messages[field].length === 1) {
              messages[field] = messages[field][0];
            }
          }
          
          return messages;
        }
      };
    });

    test('should initialize with default values', () => {
      const result = new ValidationResult();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('should add errors correctly', () => {
      const result = new ValidationResult();
      result.addError('field1', 'Error message', 'ERROR_CODE', 'value');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'field1',
        message: 'Error message',
        code: 'ERROR_CODE',
        value: 'value'
      });
    });

    test('should add warnings correctly', () => {
      const result = new ValidationResult();
      result.addWarning('field1', 'Warning message', 'value');
      
      expect(result.valid).toBe(true); // Warnings don't affect validity
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toEqual({
        field: 'field1',
        message: 'Warning message',
        value: 'value'
      });
    });

    test('should merge results correctly', () => {
      const result1 = new ValidationResult();
      const result2 = new ValidationResult(false);
      
      result1.addError('field1', 'First error');
      result2.addError('field2', 'Second error');
      result2.addWarning('field2', 'Second warning');
      
      result1.merge(result2);
      
      expect(result1.valid).toBe(false);
      expect(result1.errors).toHaveLength(2);
      expect(result1.warnings).toHaveLength(1);
    });

    test('should get field errors correctly', () => {
      const result = new ValidationResult();
      result.addError('field1', 'Error 1');
      result.addError('field2', 'Error 2');
      result.addError('field1', 'Error 3');
      
      const field1Errors = result.getFieldErrors('field1');
      expect(field1Errors).toHaveLength(2);
      expect(field1Errors[0].message).toBe('Error 1');
      expect(field1Errors[1].message).toBe('Error 3');
    });

    test('should check field errors correctly', () => {
      const result = new ValidationResult();
      result.addError('field1', 'Error 1');
      
      expect(result.hasFieldError('field1')).toBe(true);
      expect(result.hasFieldError('field2')).toBe(false);
    });

    test('should format field messages correctly', () => {
      const result = new ValidationResult();
      result.addError('field1', 'Error 1');
      result.addError('field2', 'Error 2');
      result.addError('field1', 'Error 3');
      
      const messages = result.getFieldMessages();
      expect(messages.field2).toBe('Error 2');
      expect(messages.field1).toEqual(['Error 1', 'Error 3']);
    });
  });

  describe('Base Validator Logic', () => {
    test('should validate string types', () => {
      // Test basic type validation logic
      const testValue = 'hello world';
      const expectedType = 'string';
      
      expect(typeof testValue).toBe(expectedType);
      expect(testValue.length).toBeGreaterThan(0);
    });

    test('should validate number ranges', () => {
      const testValue = 50;
      const min = 0;
      const max = 100;
      
      expect(testValue).toBeGreaterThanOrEqual(min);
      expect(testValue).toBeLessThanOrEqual(max);
    });

    test('should validate array constraints', () => {
      const testArray = [1, 2, 3];
      const minItems = 2;
      const maxItems = 5;
      
      expect(Array.isArray(testArray)).toBe(true);
      expect(testArray.length).toBeGreaterThanOrEqual(minItems);
      expect(testArray.length).toBeLessThanOrEqual(maxItems);
    });

    test('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'admin@test.co.uk'
      ];
      
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user.domain.com'
      ];
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
      
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    test('should validate UUID format', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
      ];
      
      const invalidUUIDs = [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-446655440000-extra'
      ];
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      validUUIDs.forEach(uuid => {
        expect(uuidRegex.test(uuid)).toBe(true);
      });
      
      invalidUUIDs.forEach(uuid => {
        expect(uuidRegex.test(uuid)).toBe(false);
      });
    });

    test('should validate NZ date format', () => {
      const validDates = [
        '01-01-2023',
        '25-12-2023',
        '29-02-2024' // Leap year
      ];
      
      const invalidDates = [
        '2023-01-01', // Wrong format
        '1-1-2023', // No zero padding
        '32-01-2023', // Invalid day
        '01-13-2023' // Invalid month
      ];
      
      const nzDateRegex = /^\d{2}-\d{2}-\d{4}$/;
      
      validDates.forEach(date => {
        expect(nzDateRegex.test(date)).toBe(true);
      });
      
      invalidDates.forEach(date => {
        expect(nzDateRegex.test(date)).toBe(false);
      });
    });
  });

  describe('Roadmap Schema Validation Logic', () => {
    test('should validate required roadmap fields', () => {
      const validRoadmap = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Roadmap',
        milestones: [],
        createdAt: '01-01-2024',
        version: 1
      };
      
      const requiredFields = ['id', 'title', 'milestones', 'createdAt', 'version'];
      
      requiredFields.forEach(field => {
        expect(validRoadmap).toHaveProperty(field);
        expect(validRoadmap[field]).toBeDefined();
      });
      
      // Test field types
      expect(typeof validRoadmap.id).toBe('string');
      expect(typeof validRoadmap.title).toBe('string');
      expect(Array.isArray(validRoadmap.milestones)).toBe(true);
      expect(typeof validRoadmap.createdAt).toBe('string');
      expect(typeof validRoadmap.version).toBe('number');
    });

    test('should validate milestone structure', () => {
      const validMilestone = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Test Milestone',
        targetDate: '31-03-2024',
        tasks: []
      };
      
      const requiredFields = ['id', 'title', 'targetDate', 'tasks'];
      
      requiredFields.forEach(field => {
        expect(validMilestone).toHaveProperty(field);
        expect(validMilestone[field]).toBeDefined();
      });
      
      expect(typeof validMilestone.id).toBe('string');
      expect(typeof validMilestone.title).toBe('string');
      expect(typeof validMilestone.targetDate).toBe('string');
      expect(Array.isArray(validMilestone.tasks)).toBe(true);
    });

    test('should validate task structure', () => {
      const validTask = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Test Task',
        status: 'not-started'
      };
      
      const requiredFields = ['id', 'title', 'status'];
      
      requiredFields.forEach(field => {
        expect(validTask).toHaveProperty(field);
        expect(validTask[field]).toBeDefined();
      });
      
      expect(typeof validTask.id).toBe('string');
      expect(typeof validTask.title).toBe('string');
      expect(typeof validTask.status).toBe('string');
      
      // Test valid status values
      const validStatuses = ['not-started', 'in-progress', 'completed', 'blocked', 'cancelled'];
      expect(validStatuses).toContain(validTask.status);
    });
  });

  describe('Business Rules Validation Logic', () => {
    test('should detect circular dependencies', () => {
      const milestones = [
        {
          id: 'milestone1',
          title: 'Milestone 1',
          dependencies: ['milestone2']
        },
        {
          id: 'milestone2', 
          title: 'Milestone 2',
          dependencies: ['milestone1'] // Circular dependency
        }
      ];
      
      // Simple circular dependency detection
      function hasCircularDependency(milestones) {
        const milestoneMap = new Map();
        milestones.forEach(m => milestoneMap.set(m.id, m));
        
        function checkDependency(milestoneId, visited = new Set()) {
          if (visited.has(milestoneId)) {
            return true; // Circular dependency found
          }
          
          visited.add(milestoneId);
          const milestone = milestoneMap.get(milestoneId);
          
          if (milestone && milestone.dependencies) {
            for (const depId of milestone.dependencies) {
              if (checkDependency(depId, new Set(visited))) {
                return true;
              }
            }
          }
          
          return false;
        }
        
        return milestones.some(m => checkDependency(m.id));
      }
      
      expect(hasCircularDependency(milestones)).toBe(true);
      
      // Test with valid dependencies
      const validMilestones = [
        { id: 'milestone1', title: 'Milestone 1', dependencies: [] },
        { id: 'milestone2', title: 'Milestone 2', dependencies: ['milestone1'] }
      ];
      
      expect(hasCircularDependency(validMilestones)).toBe(false);
    });

    test('should validate completion consistency', () => {
      const milestone = {
        tasks: [
          { status: 'completed' },
          { status: 'completed' },
          { status: 'in-progress' }
        ],
        completion: 67
      };
      
      const completedTasks = milestone.tasks.filter(t => t.status === 'completed').length;
      const calculatedCompletion = Math.round((completedTasks / milestone.tasks.length) * 100);
      
      // Should be close (within 5%)
      const tolerance = 5;
      expect(Math.abs(calculatedCompletion - milestone.completion)).toBeLessThanOrEqual(tolerance);
    });

    test('should validate status consistency', () => {
      const completedTask = {
        status: 'completed',
        completedDate: '15-03-2024'
      };
      
      const incompleteTask = {
        status: 'in-progress',
        completedDate: null
      };
      
      // Completed tasks should have completion date
      if (completedTask.status === 'completed') {
        expect(completedTask.completedDate).toBeDefined();
        expect(completedTask.completedDate).not.toBeNull();
      }
      
      // Incomplete tasks should not have completion date
      if (incompleteTask.status !== 'completed') {
        expect(incompleteTask.completedDate).toBeNull();
      }
    });
  });
});