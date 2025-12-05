/**
 * Validators Test Suite
 * 
 * Comprehensive tests for the validation system including base validator,
 * roadmap validator, and validation manager functionality.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Import validation components
import BaseValidator, { ValidationError, ValidationResult } from '../../src/js/validators/base-validator.js';
import RoadmapValidator from '../../src/js/validators/roadmap-validator.js';
import { ValidationManager, validationManager } from '../../src/js/validators/validation-manager.js';
import { 
  isValid, 
  validateRoadmap, 
  validateMilestone, 
  validateTask,
  schemas,
  patterns
} from '../../src/js/validators/index.js';

// Mock dependencies
jest.mock('../../src/js/date-utils.js', () => ({
  default: {
    isValidNZ: jest.fn((date) => /^\d{2}-\d{2}-\d{4}$/.test(date)),
    compareNZ: jest.fn((date1, date2) => {
      // Simple mock comparison
      const d1 = new Date(date1.split('-').reverse().join('-'));
      const d2 = new Date(date2.split('-').reverse().join('-'));
      return d1.getTime() - d2.getTime();
    }),
    daysBetweenNZ: jest.fn((date1, date2) => {
      const d1 = new Date(date1.split('-').reverse().join('-'));
      const d2 = new Date(date2.split('-').reverse().join('-'));
      return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    }),
    formatToNZ: jest.fn((date) => {
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
    })
  }
}));

jest.mock('../../src/js/config-manager.js', () => ({
  configManager: {
    get: jest.fn((key, defaultValue) => defaultValue)
  }
}));

jest.mock('../../src/js/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    group: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }))
  }
}));

jest.mock('../../src/js/event-bus.js', () => ({
  eventBus: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }
}));

describe('ValidationError', () => {
  test('should create validation error with all properties', () => {
    const error = new ValidationError('Test message', 'testField', 'TEST_CODE', 'invalid_value');
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Test message');
    expect(error.field).toBe('testField');
    expect(error.code).toBe('TEST_CODE');
    expect(error.value).toBe('invalid_value');
  });
});

describe('ValidationResult', () => {
  let result;

  beforeEach(() => {
    result = new ValidationResult();
  });

  test('should initialize with default values', () => {
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  test('should add errors correctly', () => {
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
    const other = new ValidationResult(false);
    other.addError('field2', 'Other error');
    other.addWarning('field2', 'Other warning');
    
    result.addError('field1', 'First error');
    result.merge(other);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.warnings).toHaveLength(1);
  });

  test('should get field errors correctly', () => {
    result.addError('field1', 'Error 1');
    result.addError('field2', 'Error 2');
    result.addError('field1', 'Error 3');
    
    const field1Errors = result.getFieldErrors('field1');
    expect(field1Errors).toHaveLength(2);
    expect(field1Errors[0].message).toBe('Error 1');
    expect(field1Errors[1].message).toBe('Error 3');
  });

  test('should check field errors correctly', () => {
    result.addError('field1', 'Error 1');
    
    expect(result.hasFieldError('field1')).toBe(true);
    expect(result.hasFieldError('field2')).toBe(false);
  });

  test('should format field messages correctly', () => {
    result.addError('field1', 'Error 1');
    result.addError('field2', 'Error 2');
    result.addError('field1', 'Error 3');
    
    const messages = result.getFieldMessages();
    expect(messages.field2).toBe('Error 2');
    expect(messages.field1).toEqual(['Error 1', 'Error 3']);
  });
});

describe('BaseValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new BaseValidator();
  });

  describe('Type Validation', () => {
    test('should validate string types', () => {
      const schema = { type: 'string' };
      
      expect(validator.validate('test', schema).valid).toBe(true);
      expect(validator.validate(123, schema).valid).toBe(false);
      expect(validator.validate(null, schema).valid).toBe(true); // null allowed by default when not required
    });

    test('should validate number types', () => {
      const schema = { type: 'number' };
      
      expect(validator.validate(123, schema).valid).toBe(true);
      expect(validator.validate(123.45, schema).valid).toBe(true);
      expect(validator.validate('123', schema).valid).toBe(false);
    });

    test('should validate integer types', () => {
      const schema = { type: 'integer' };
      
      expect(validator.validate(123, schema).valid).toBe(true);
      expect(validator.validate(123.45, schema).valid).toBe(false);
    });

    test('should validate array types', () => {
      const schema = { type: 'array' };
      
      expect(validator.validate([1, 2, 3], schema).valid).toBe(true);
      expect(validator.validate('not array', schema).valid).toBe(false);
    });

    test('should validate object types', () => {
      const schema = { type: 'object' };
      
      expect(validator.validate({ key: 'value' }, schema).valid).toBe(true);
      expect(validator.validate('not object', schema).valid).toBe(false);
    });

    test('should validate custom nz-date type', () => {
      const schema = { type: 'nz-date' };
      
      expect(validator.validate('25-12-2023', schema).valid).toBe(true);
      expect(validator.validate('2023-12-25', schema).valid).toBe(false);
      expect(validator.validate('invalid', schema).valid).toBe(false);
    });
  });

  describe('Required Field Validation', () => {
    test('should validate required fields', () => {
      const schema = { type: 'string', required: true };
      
      expect(validator.validate('test', schema).valid).toBe(true);
      expect(validator.validate(null, schema).valid).toBe(false);
      expect(validator.validate(undefined, schema).valid).toBe(false);
    });

    test('should allow optional fields', () => {
      const schema = { type: 'string', required: false };
      
      expect(validator.validate('test', schema).valid).toBe(true);
      expect(validator.validate(null, schema).valid).toBe(true);
      expect(validator.validate(undefined, schema).valid).toBe(true);
    });
  });

  describe('String Validation', () => {
    test('should validate string length', () => {
      const schema = { type: 'string', minLength: 3, maxLength: 10 };
      
      expect(validator.validate('test', schema).valid).toBe(true);
      expect(validator.validate('hi', schema).valid).toBe(false);
      expect(validator.validate('this is too long', schema).valid).toBe(false);
    });

    test('should validate string patterns', () => {
      const schema = { type: 'string', pattern: '^[a-z]+$' };
      
      expect(validator.validate('test', schema).valid).toBe(true);
      expect(validator.validate('Test', schema).valid).toBe(false);
      expect(validator.validate('test123', schema).valid).toBe(false);
    });

    test('should validate string formats', () => {
      const emailSchema = { type: 'string', format: 'email' };
      expect(validator.validate('test@example.com', emailSchema).valid).toBe(true);
      expect(validator.validate('invalid-email', emailSchema).valid).toBe(false);

      const uuidSchema = { type: 'string', format: 'uuid' };
      expect(validator.validate('550e8400-e29b-41d4-a716-446655440000', uuidSchema).valid).toBe(true);
      expect(validator.validate('not-uuid', uuidSchema).valid).toBe(false);

      const urlSchema = { type: 'string', format: 'url' };
      expect(validator.validate('https://example.com', urlSchema).valid).toBe(true);
      expect(validator.validate('not-url', urlSchema).valid).toBe(false);
    });
  });

  describe('Number Validation', () => {
    test('should validate number ranges', () => {
      const schema = { type: 'number', min: 0, max: 100 };
      
      expect(validator.validate(50, schema).valid).toBe(true);
      expect(validator.validate(0, schema).valid).toBe(true);
      expect(validator.validate(100, schema).valid).toBe(true);
      expect(validator.validate(-1, schema).valid).toBe(false);
      expect(validator.validate(101, schema).valid).toBe(false);
    });

    test('should validate multiples', () => {
      const schema = { type: 'number', multipleOf: 5 };
      
      expect(validator.validate(10, schema).valid).toBe(true);
      expect(validator.validate(15, schema).valid).toBe(true);
      expect(validator.validate(7, schema).valid).toBe(false);
    });
  });

  describe('Array Validation', () => {
    test('should validate array length', () => {
      const schema = { type: 'array', minItems: 2, maxItems: 5 };
      
      expect(validator.validate([1, 2, 3], schema).valid).toBe(true);
      expect(validator.validate([1], schema).valid).toBe(false);
      expect(validator.validate([1, 2, 3, 4, 5, 6], schema).valid).toBe(false);
    });

    test('should validate unique items', () => {
      const schema = { type: 'array', uniqueItems: true };
      
      expect(validator.validate([1, 2, 3], schema).valid).toBe(true);
      expect(validator.validate([1, 2, 2], schema).valid).toBe(false);
    });

    test('should validate array items', () => {
      const schema = {
        type: 'array',
        items: { type: 'string', minLength: 2 }
      };
      
      expect(validator.validate(['test', 'hello'], schema).valid).toBe(true);
      expect(validator.validate(['test', 'a'], schema).valid).toBe(false);
    });
  });

  describe('Object Validation', () => {
    test('should validate object properties', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', required: true },
          age: { type: 'integer', min: 0 }
        }
      };
      
      expect(validator.validate({ name: 'John', age: 25 }, schema).valid).toBe(true);
      expect(validator.validate({ name: 'John' }, schema).valid).toBe(true); // age optional
      expect(validator.validate({ age: 25 }, schema).valid).toBe(false); // name required
    });

    test('should validate required properties', () => {
      const schema = {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          age: { type: 'integer' }
        }
      };
      
      expect(validator.validate({ name: 'John', email: 'john@example.com', age: 25 }, schema).valid).toBe(true);
      expect(validator.validate({ name: 'John', email: 'john@example.com' }, schema).valid).toBe(true);
      expect(validator.validate({ name: 'John' }, schema).valid).toBe(false);
    });

    test('should validate additional properties', () => {
      const schema = {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' }
        }
      };
      
      expect(validator.validate({ name: 'John' }, schema).valid).toBe(true);
      expect(validator.validate({ name: 'John', extra: 'not allowed' }, schema).valid).toBe(false);
    });
  });

  describe('Enum Validation', () => {
    test('should validate enum values', () => {
      const schema = { type: 'string', enum: ['red', 'green', 'blue'] };
      
      expect(validator.validate('red', schema).valid).toBe(true);
      expect(validator.validate('yellow', schema).valid).toBe(false);
    });
  });

  describe('Custom Validation', () => {
    test('should execute custom validation functions', () => {
      const schema = {
        type: 'string',
        validate: (value) => value.startsWith('custom_') || 'Must start with custom_'
      };
      
      expect(validator.validate('custom_test', schema).valid).toBe(true);
      
      const result = validator.validate('invalid', schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toBe('Must start with custom_');
    });

    test('should handle custom validation errors', () => {
      const schema = {
        type: 'string',
        validate: () => { throw new Error('Custom error'); }
      };
      
      const result = validator.validate('test', schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('CUSTOM_ERROR');
    });
  });

  describe('Multiple Validation', () => {
    test('should validate multiple values', () => {
      const schemas = {
        name: { type: 'string', required: true },
        age: { type: 'integer', min: 0 },
        email: { type: 'string', format: 'email' }
      };
      
      const values = {
        name: 'John',
        age: 25,
        email: 'john@example.com'
      };
      
      const result = validator.validateMultiple(values, schemas);
      expect(result.valid).toBe(true);
    });
  });

  describe('Static Helper Methods', () => {
    test('should create schemas with helpers', () => {
      const schema = BaseValidator.createSchema('string', { minLength: 5 });
      expect(schema.type).toBe('string');
      expect(schema.minLength).toBe(5);

      const requiredSchema = BaseValidator.required('string', { maxLength: 10 });
      expect(requiredSchema.required).toBe(true);

      const optionalSchema = BaseValidator.optional('string');
      expect(optionalSchema.required).toBe(false);
    });
  });
});

describe('RoadmapValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new RoadmapValidator();
  });

  describe('Schema Retrieval', () => {
    test('should get schemas by name', () => {
      const roadmapSchema = validator.getSchema('roadmap');
      expect(roadmapSchema.type).toBe('object');
      expect(roadmapSchema.required).toContain('id');
      expect(roadmapSchema.required).toContain('title');

      expect(() => validator.getSchema('unknown')).toThrow('Unknown schema: unknown');
    });
  });

  describe('Roadmap Validation', () => {
    test('should validate valid roadmap data', () => {
      const roadmap = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Roadmap',
        description: 'A test roadmap',
        milestones: [],
        createdAt: '25-12-2023',
        version: 1,
        status: 'active'
      };
      
      const result = validator.validateRoadmap(roadmap);
      expect(result.valid).toBe(true);
    });

    test('should validate roadmap with milestones', () => {
      const roadmap = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Roadmap',
        milestones: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            title: 'Milestone 1',
            targetDate: '31-12-2023',
            tasks: [],
            status: 'not-started'
          }
        ],
        createdAt: '25-12-2023',
        version: 1
      };
      
      const result = validator.validateRoadmap(roadmap);
      expect(result.valid).toBe(true);
    });

    test('should fail validation for invalid roadmap', () => {
      const roadmap = {
        id: 'not-uuid',
        title: '',
        milestones: 'not-array',
        version: 0
      };
      
      const result = validator.validateRoadmap(roadmap);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Milestone Validation', () => {
    test('should validate valid milestone', () => {
      const milestone = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Test Milestone',
        targetDate: '31-12-2023',
        tasks: [],
        status: 'not-started',
        completion: 0
      };
      
      const result = validator.validateMilestone(milestone);
      expect(result.valid).toBe(true);
    });

    test('should validate milestone with tasks', () => {
      const milestone = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Test Milestone',
        targetDate: '31-12-2023',
        tasks: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            title: 'Test Task',
            status: 'not-started'
          }
        ]
      };
      
      const result = validator.validateMilestone(milestone);
      expect(result.valid).toBe(true);
    });

    test('should fail for missing completion date on completed milestone', () => {
      const milestone = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Test Milestone',
        targetDate: '31-12-2023',
        tasks: [],
        status: 'completed'
        // Missing actualDate
      };
      
      const result = validator.validateMilestone(milestone);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_COMPLETION_DATE')).toBe(true);
    });
  });

  describe('Task Validation', () => {
    test('should validate valid task', () => {
      const task = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Test Task',
        status: 'not-started',
        priority: 'medium',
        assignee: 'John Doe'
      };
      
      const result = validator.validateTask(task);
      expect(result.valid).toBe(true);
    });

    test('should validate task with effort tracking', () => {
      const task = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Test Task',
        status: 'completed',
        completedDate: '30-12-2023',
        effort: {
          estimated: 8,
          actual: 10
        }
      };
      
      const result = validator.validateTask(task);
      expect(result.valid).toBe(true);
    });

    test('should fail for missing completion date on completed task', () => {
      const task = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Test Task',
        status: 'completed'
        // Missing completedDate
      };
      
      const result = validator.validateTask(task);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_COMPLETION_DATE')).toBe(true);
    });
  });

  describe('Settings Validation', () => {
    test('should validate valid settings', () => {
      const settings = {
        general: {
          autoSave: true,
          autoSaveInterval: 300,
          confirmOnDelete: true,
          defaultView: 'gantt'
        },
        display: {
          theme: 'light',
          density: 'normal',
          showCompletedTasks: false
        },
        notifications: {
          enabled: true,
          reminderDays: 7
        }
      };
      
      const result = validator.validateSettings(settings);
      expect(result.valid).toBe(true);
    });

    test('should fail for invalid enum values', () => {
      const settings = {
        general: {
          defaultView: 'invalid-view'
        }
      };
      
      const result = validator.validateSettings(settings);
      expect(result.valid).toBe(false);
    });
  });

  describe('Business Rules Validation', () => {
    test('should detect circular dependencies', () => {
      const roadmap = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Roadmap',
        milestones: [
          {
            id: 'milestone1',
            title: 'Milestone 1',
            targetDate: '31-12-2023',
            tasks: [],
            dependencies: ['milestone2']
          },
          {
            id: 'milestone2',
            title: 'Milestone 2',
            targetDate: '15-01-2024',
            tasks: [],
            dependencies: ['milestone1']
          }
        ],
        createdAt: '25-12-2023',
        version: 1
      };
      
      const result = validator.validateRoadmap(roadmap);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'CIRCULAR_DEPENDENCY')).toBe(true);
    });
  });
});

describe('ValidationManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ValidationManager();
    manager.initialize();
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Initialization', () => {
    test('should initialize with default validators', () => {
      expect(manager.initialized).toBe(true);
      expect(manager.getValidator('base')).toBeInstanceOf(BaseValidator);
      expect(manager.getValidator('roadmap')).toBeInstanceOf(RoadmapValidator);
    });

    test('should not initialize twice', () => {
      const initializedState = manager.initialized;
      manager.initialize();
      expect(manager.initialized).toBe(initializedState);
    });
  });

  describe('Validator Management', () => {
    test('should register and retrieve validators', () => {
      const customValidator = new BaseValidator();
      manager.registerValidator('custom', customValidator);
      
      expect(manager.getValidator('custom')).toBe(customValidator);
    });

    test('should throw for unknown validator', () => {
      expect(() => manager.getValidator('unknown')).toThrow('Unknown validator: unknown');
    });

    test('should throw for invalid validator', () => {
      expect(() => manager.registerValidator('invalid', {})).toThrow('Validator must be an instance of BaseValidator');
    });
  });

  describe('Validation Operations', () => {
    test('should validate roadmap data', () => {
      const roadmap = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Roadmap',
        milestones: [],
        createdAt: '25-12-2023',
        version: 1
      };
      
      const result = manager.validateRoadmap(roadmap);
      expect(result.valid).toBe(true);
    });

    test('should validate with custom schema', () => {
      const schema = { type: 'string', minLength: 3 };
      
      expect(manager.validateWithSchema('test', schema).valid).toBe(true);
      expect(manager.validateWithSchema('hi', schema).valid).toBe(false);
    });

    test('should validate multiple values', () => {
      const data = { name: 'John', age: 25 };
      const schemas = {
        name: { type: 'string', required: true },
        age: { type: 'integer', min: 0 }
      };
      
      const result = manager.validateMultiple(data, schemas);
      expect(result.valid).toBe(true);
    });

    test('should check validity quickly', () => {
      const schema = { type: 'string' };
      
      expect(manager.isValid('test', schema)).toBe(true);
      expect(manager.isValid(123, schema)).toBe(false);
    });
  });

  describe('Schema Management', () => {
    test('should retrieve and cache schemas', () => {
      const schema1 = manager.getSchema('roadmap');
      const schema2 = manager.getSchema('roadmap');
      
      expect(schema1).toBe(schema2); // Should be cached
      expect(schema1.type).toBe('object');
    });

    test('should clear cache', () => {
      manager.getSchema('roadmap'); // Populate cache
      expect(manager.schemaCache.size).toBeGreaterThan(0);
      
      manager.clearCache();
      expect(manager.schemaCache.size).toBe(0);
    });
  });

  describe('Statistics and History', () => {
    test('should track validation statistics', () => {
      const schema = { type: 'string' };
      
      manager.validateWithSchema('valid', schema);
      manager.validateWithSchema(123, schema); // Invalid
      
      const stats = manager.getValidationStats();
      expect(stats.total).toBe(2);
      expect(stats.successful).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBe('50.00');
    });

    test('should clear history', () => {
      const schema = { type: 'string' };
      manager.validateWithSchema('test', schema);
      
      expect(manager.validationHistory.length).toBe(1);
      
      manager.clearHistory();
      expect(manager.validationHistory.length).toBe(0);
    });
  });

  describe('Error Creation', () => {
    test('should create validation errors and results', () => {
      const error = manager.createError('Test error', 'field', 'CODE', 'value');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Test error');
      
      const result = manager.createResult(false);
      expect(result).toBeInstanceOf(ValidationResult);
      expect(result.valid).toBe(false);
    });
  });
});

describe('Convenience Functions', () => {
  describe('isValid', () => {
    test('should return boolean for validity check', () => {
      const schema = { type: 'string' };
      
      expect(isValid('test', schema)).toBe(true);
      expect(isValid(123, schema)).toBe(false);
    });

    test('should handle errors gracefully', () => {
      // Test with malformed schema
      expect(isValid('test', null)).toBe(false);
    });
  });

  describe('Validation Functions', () => {
    test('should validate roadmap data', () => {
      const roadmap = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test Roadmap',
        milestones: [],
        createdAt: '25-12-2023',
        version: 1
      };
      
      const result = validateRoadmap(roadmap);
      expect(result).toBeInstanceOf(ValidationResult);
      expect(result.valid).toBe(true);
    });

    test('should validate milestone data', () => {
      const milestone = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Test Milestone',
        targetDate: '31-12-2023',
        tasks: []
      };
      
      const result = validateMilestone(milestone);
      expect(result).toBeInstanceOf(ValidationResult);
      expect(result.valid).toBe(true);
    });

    test('should validate task data', () => {
      const task = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Test Task',
        status: 'not-started'
      };
      
      const result = validateTask(task);
      expect(result).toBeInstanceOf(ValidationResult);
      expect(result.valid).toBe(true);
    });
  });
});

describe('Common Schemas and Patterns', () => {
  describe('Schema Builders', () => {
    test('should create string schemas', () => {
      const schema = schemas.string(5, 20, true);
      expect(schema.type).toBe('string');
      expect(schema.minLength).toBe(5);
      expect(schema.maxLength).toBe(20);
      expect(schema.required).toBe(true);
    });

    test('should create email schemas', () => {
      const schema = schemas.email();
      expect(schema.type).toBe('string');
      expect(schema.format).toBe('email');
      expect(schema.required).toBe(true);
    });

    test('should create UUID schemas', () => {
      const schema = schemas.uuid();
      expect(schema.format).toBe('uuid');
    });

    test('should create integer schemas', () => {
      const schema = schemas.integer(0, 100);
      expect(schema.type).toBe('integer');
      expect(schema.min).toBe(0);
      expect(schema.max).toBe(100);
    });

    test('should create enum schemas', () => {
      const schema = schemas.enum(['red', 'green', 'blue']);
      expect(schema.enum).toEqual(['red', 'green', 'blue']);
    });

    test('should create array schemas', () => {
      const itemSchema = { type: 'string' };
      const schema = schemas.array(itemSchema, 1, 5);
      expect(schema.type).toBe('array');
      expect(schema.items).toBe(itemSchema);
      expect(schema.minItems).toBe(1);
      expect(schema.maxItems).toBe(5);
    });
  });

  describe('Validation Patterns', () => {
    test('should have common patterns defined', () => {
      expect(patterns.NO_TRIM_WHITESPACE).toBeDefined();
      expect(patterns.EMAIL).toBeDefined();
      expect(patterns.UUID).toBeDefined();
      expect(patterns.NZ_DATE).toBeDefined();
      expect(patterns.FILENAME).toBeDefined();
      expect(patterns.SLUG).toBeDefined();
    });

    test('should validate patterns correctly', () => {
      const emailRegex = new RegExp(patterns.EMAIL);
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);

      const nzDateRegex = new RegExp(patterns.NZ_DATE);
      expect(nzDateRegex.test('25-12-2023')).toBe(true);
      expect(nzDateRegex.test('2023-12-25')).toBe(false);
    });
  });
});

describe('Integration Tests', () => {
  test('should validate complex roadmap structure', () => {
    const roadmap = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Complex Roadmap',
      description: 'A roadmap with multiple milestones and tasks',
      milestones: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Phase 1',
          targetDate: '31-03-2024',
          tasks: [
            {
              id: '550e8400-e29b-41d4-a716-446655440002',
              title: 'Setup Infrastructure',
              status: 'completed',
              completedDate: '15-01-2024',
              priority: 'high',
              effort: {
                estimated: 16,
                actual: 20
              }
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440003',
              title: 'Implement Core Features',
              status: 'in-progress',
              priority: 'high',
              assignee: 'John Doe',
              tags: ['backend', 'api']
            }
          ],
          status: 'in-progress',
          completion: 50
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          title: 'Phase 2',
          targetDate: '30-06-2024',
          tasks: [
            {
              id: '550e8400-e29b-41d4-a716-446655440005',
              title: 'User Interface',
              status: 'not-started',
              priority: 'medium',
              dependencies: ['550e8400-e29b-41d4-a716-446655440002']
            }
          ],
          dependencies: ['550e8400-e29b-41d4-a716-446655440001']
        }
      ],
      metadata: {
        category: 'Product Development',
        tags: ['web', 'frontend', 'backend'],
        priority: 'high',
        estimatedDuration: 180
      },
      createdAt: '01-01-2024',
      updatedAt: '15-01-2024',
      version: 2,
      status: 'active'
    };

    const result = validateRoadmap(roadmap);
    expect(result.valid).toBe(true);
    
    // Should have some warnings about completion percentage mismatch
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('should validate settings and preferences together', () => {
    const settings = {
      general: {
        autoSave: true,
        autoSaveInterval: 300,
        confirmOnDelete: true,
        defaultView: 'gantt'
      },
      display: {
        theme: 'dark',
        density: 'compact',
        showCompletedTasks: true,
        groupMilestonesByDate: false
      },
      notifications: {
        enabled: true,
        milestoneReminders: true,
        taskDeadlines: true,
        overdueAlerts: true,
        reminderDays: 3
      },
      exports: {
        defaultFormat: 'json',
        includeCompletedItems: false,
        includeMetadata: true
      }
    };

    const preferences = {
      ui: {
        sidebarCollapsed: false,
        lastViewedRoadmap: '550e8400-e29b-41d4-a716-446655440000',
        recentRoadmaps: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001'
        ],
        columnWidths: {
          title: 200,
          status: 100,
          priority: 80
        }
      },
      filters: {
        savedFilters: [
          {
            name: 'High Priority Tasks',
            criteria: {
              priority: ['high', 'critical'],
              status: ['not-started', 'in-progress']
            }
          }
        ]
      }
    };

    expect(validationManager.validateSettings(settings).valid).toBe(true);
    expect(validationManager.validatePreferences(preferences).valid).toBe(true);
  });
});