/**
 * Tests for FormValidation utilities
 * 
 * Tests cover:
 * - Validation rules (positive and negative cases)
 * - Form state management
 * - Field state management
 * - Edge cases and error handling
 * - Integration with NZ validation classes
 */

import { 
  FormValidation,
  ValidationRules,
  FieldConfigs,
  createFormValidation,
  type FieldConfig
} from '../../app/renderer/utils/formValidation';

describe('ValidationRules', () => {
  describe('required', () => {
    it('should return error for empty string', () => {
      const rule = ValidationRules.required('Test Field');
      expect(rule('')).toBe('Test Field is required');
      expect(rule('   ')).toBe('Test Field is required');
    });

    it('should return null for non-empty string', () => {
      const rule = ValidationRules.required('Test Field');
      expect(rule('test')).toBeNull();
      expect(rule(' test ')).toBeNull();
    });

    it('should use default field name', () => {
      const rule = ValidationRules.required();
      expect(rule('')).toBe('Field is required');
    });
  });

  describe('minLength', () => {
    it('should return error for strings shorter than minimum', () => {
      const rule = ValidationRules.minLength(5, 'Password');
      expect(rule('123')).toBe('Password must be at least 5 characters');
      expect(rule('')).toBeNull(); // Empty string is valid for optional fields
    });

    it('should return null for strings meeting minimum length', () => {
      const rule = ValidationRules.minLength(5, 'Password');
      expect(rule('12345')).toBeNull();
      expect(rule('123456')).toBeNull();
    });
  });

  describe('maxLength', () => {
    it('should return error for strings longer than maximum', () => {
      const rule = ValidationRules.maxLength(10, 'Username');
      expect(rule('12345678901')).toBe('Username must not exceed 10 characters');
    });

    it('should return null for strings within maximum length', () => {
      const rule = ValidationRules.maxLength(10, 'Username');
      expect(rule('123456789')).toBeNull();
      expect(rule('1234567890')).toBeNull();
      expect(rule('')).toBeNull();
    });
  });

  describe('email', () => {
    it('should return error for invalid email formats', () => {
      const rule = ValidationRules.email('Email');
      expect(rule('invalid-email')).toBe('Email must be a valid email address');
      expect(rule('test@')).toBe('Email must be a valid email address');
      expect(rule('@test.com')).toBe('Email must be a valid email address');
      expect(rule('test.com')).toBe('Email must be a valid email address');
      expect(rule('test @test.com')).toBe('Email must be a valid email address');
    });

    it('should return null for valid email formats', () => {
      const rule = ValidationRules.email('Email');
      expect(rule('test@example.com')).toBeNull();
      expect(rule('user.name+tag@domain.co.nz')).toBeNull();
      expect(rule('')).toBeNull(); // Empty is valid for optional fields
    });
  });

  describe('nzCurrency', () => {
    it('should return error for invalid NZ currency formats', () => {
      const rule = ValidationRules.nzCurrency('Amount');
      expect(rule('$1,234.56')).toBe('Amount must be a valid NZ currency amount (e.g., 1,234.56)');
      expect(rule('1,234.567')).toBe('Amount must be a valid NZ currency amount (e.g., 1,234.56)');
      expect(rule('invalid')).toBe('Amount must be a valid NZ currency amount (e.g., 1,234.56)');
    });

    it('should return null for valid NZ currency formats', () => {
      const rule = ValidationRules.nzCurrency('Amount');
      expect(rule('1,234.56')).toBeNull();
      expect(rule('1234.56')).toBeNull();
      expect(rule('1234')).toBeNull();
      expect(rule('0.50')).toBeNull();
      expect(rule('')).toBeNull(); // Empty is valid for optional fields
    });
  });

  describe('nzDate', () => {
    it('should return error for invalid NZ date formats', () => {
      const rule = ValidationRules.nzDate('Date');
      expect(rule('2025-03-01')).toBe('Date must be a valid date in DD-MM-YYYY format');
      expect(rule('1/3/2025')).toBe('Date must be a valid date in DD-MM-YYYY format');
      expect(rule('32-01-2025')).toBe('Date must be a valid date in DD-MM-YYYY format');
      expect(rule('01-13-2025')).toBe('Date must be a valid date in DD-MM-YYYY format');
      expect(rule('invalid')).toBe('Date must be a valid date in DD-MM-YYYY format');
    });

    it('should return null for valid NZ date formats', () => {
      const rule = ValidationRules.nzDate('Date');
      expect(rule('01-03-2025')).toBeNull();
      expect(rule('31-12-2025')).toBeNull();
      expect(rule('29-02-2024')).toBeNull(); // Leap year
      expect(rule('')).toBeNull(); // Empty is valid for optional fields
    });
  });

  describe('futureDate', () => {
    it('should return error for past and current dates', () => {
      const rule = ValidationRules.futureDate('End Date');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayNZ = `${yesterday.getDate().toString().padStart(2, '0')}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getFullYear()}`;
      
      const today = new Date();
      const todayNZ = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
      
      expect(rule(yesterdayNZ)).toBe('End Date must be a future date');
      expect(rule(todayNZ)).toBe('End Date must be a future date');
    });

    it('should return null for future dates', () => {
      const rule = ValidationRules.futureDate('End Date');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowNZ = `${tomorrow.getDate().toString().padStart(2, '0')}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getFullYear()}`;
      
      expect(rule(tomorrowNZ)).toBeNull();
      expect(rule('')).toBeNull(); // Empty is valid for optional fields
    });

    it('should return null for invalid dates (let nzDate rule handle it)', () => {
      const rule = ValidationRules.futureDate('End Date');
      expect(rule('invalid-date')).toBeNull();
    });
  });

  describe('dateRange', () => {
    it('should return error for dates outside range', () => {
      const rule = ValidationRules.dateRange('01-01-2025', '31-12-2025', 'Project Date');
      expect(rule('01-01-2024')).toBe('Project Date must be between 01-01-2025 and 31-12-2025');
      expect(rule('01-01-2026')).toBe('Project Date must be between 01-01-2025 and 31-12-2025');
    });

    it('should return null for dates within range', () => {
      const rule = ValidationRules.dateRange('01-01-2025', '31-12-2025', 'Project Date');
      expect(rule('01-01-2025')).toBeNull();
      expect(rule('15-06-2025')).toBeNull();
      expect(rule('31-12-2025')).toBeNull();
      expect(rule('')).toBeNull(); // Empty is valid for optional fields
    });
  });

  describe('pattern', () => {
    it('should return error for values not matching pattern', () => {
      const rule = ValidationRules.pattern(/^[A-Z]{3}$/, 'Code must be 3 uppercase letters');
      expect(rule('abc')).toBe('Code must be 3 uppercase letters');
      expect(rule('AB')).toBe('Code must be 3 uppercase letters');
      expect(rule('ABCD')).toBe('Code must be 3 uppercase letters');
      expect(rule('12A')).toBe('Code must be 3 uppercase letters');
    });

    it('should return null for values matching pattern', () => {
      const rule = ValidationRules.pattern(/^[A-Z]{3}$/, 'Code must be 3 uppercase letters');
      expect(rule('ABC')).toBeNull();
      expect(rule('XYZ')).toBeNull();
      expect(rule('')).toBeNull(); // Empty is valid for optional fields
    });
  });
});

describe('FieldConfigs', () => {
  describe('text', () => {
    it('should create text field config with validation rules', () => {
      const config = FieldConfigs.text('username', 'Username', true, 3, 20);
      
      expect(config.name).toBe('username');
      expect(config.label).toBe('Username');
      expect(config.type).toBe('text');
      expect(config.required).toBe(true);
      expect(config.rules).toHaveLength(2); // minLength and maxLength
      
      // Test the rules
      expect(config.rules[0]('ab')).toBe('Username must be at least 3 characters');
      expect(config.rules[1]('a'.repeat(21))).toBe('Username must not exceed 20 characters');
    });

    it('should create text field config without length validation', () => {
      const config = FieldConfigs.text('title', 'Title');
      
      expect(config.required).toBe(false);
      expect(config.rules).toHaveLength(0);
    });
  });

  describe('email', () => {
    it('should create email field config', () => {
      const config = FieldConfigs.email('email', 'Email Address', true);
      
      expect(config.name).toBe('email');
      expect(config.label).toBe('Email Address');
      expect(config.type).toBe('email');
      expect(config.required).toBe(true);
      expect(config.rules).toHaveLength(1);
      
      expect(config.rules[0]('invalid-email')).toBe('Email Address must be a valid email address');
    });
  });

  describe('currency', () => {
    it('should create currency field config', () => {
      const config = FieldConfigs.currency('budget', 'Budget', true);
      
      expect(config.name).toBe('budget');
      expect(config.label).toBe('Budget');
      expect(config.type).toBe('currency');
      expect(config.required).toBe(true);
      expect(config.placeholder).toBe('0.00');
      expect(config.rules).toHaveLength(1);
      
      expect(config.rules[0]('invalid')).toBe('Budget must be a valid NZ currency amount (e.g., 1,234.56)');
    });
  });

  describe('date', () => {
    it('should create date field config', () => {
      const config = FieldConfigs.date('startDate', 'Start Date', true, false);
      
      expect(config.name).toBe('startDate');
      expect(config.label).toBe('Start Date');
      expect(config.type).toBe('date');
      expect(config.required).toBe(true);
      expect(config.placeholder).toBe('DD-MM-YYYY');
      expect(config.rules).toHaveLength(1); // nzDate only
    });

    it('should create future date field config', () => {
      const config = FieldConfigs.date('endDate', 'End Date', true, true);
      
      expect(config.rules).toHaveLength(2); // nzDate and futureDate
    });
  });

  describe('select', () => {
    it('should create select field config', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' }
      ];
      const config = FieldConfigs.select('status', 'Status', options, true);
      
      expect(config.name).toBe('status');
      expect(config.label).toBe('Status');
      expect(config.type).toBe('select');
      expect(config.required).toBe(true);
      expect(config.options).toBe(options);
      expect(config.rules).toHaveLength(0); // No validation rules for select
    });
  });

  describe('textarea', () => {
    it('should create textarea field config', () => {
      const config = FieldConfigs.textarea('description', 'Description', true, 10, 500);
      
      expect(config.name).toBe('description');
      expect(config.label).toBe('Description');
      expect(config.type).toBe('textarea');
      expect(config.required).toBe(true);
      expect(config.rules).toHaveLength(2); // minLength and maxLength
    });
  });
});

describe('FormValidation', () => {
  let form: FormValidation;

  beforeEach(() => {
    form = new FormValidation();
  });

  describe('field management', () => {
    it('should add field and initialize state', () => {
      const config: FieldConfig = {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        rules: [ValidationRules.minLength(3, 'Username')]
      };

      form.addField(config);
      const state = form.getState();

      expect(state.fields.username).toBeDefined();
      expect(state.fields.username.value).toBe('');
      expect(state.fields.username.error).toBeNull();
      expect(state.fields.username.touched).toBe(false);
      expect(state.fields.username.dirty).toBe(false);
    });

    it('should add multiple fields', () => {
      const configs: FieldConfig[] = [
        FieldConfigs.text('username', 'Username', true),
        FieldConfigs.email('email', 'Email', true)
      ];

      form.addFields(configs);
      const state = form.getState();

      expect(state.fields.username).toBeDefined();
      expect(state.fields.email).toBeDefined();
    });
  });

  describe('field validation', () => {
    beforeEach(() => {
      form.addField({
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        rules: [ValidationRules.minLength(3, 'Username')]
      });
    });

    it('should validate required field', () => {
      const error = form.validateField('username', '');
      expect(error).toBe('Username is required');
    });

    it('should validate field rules', () => {
      const error = form.validateField('username', 'ab');
      expect(error).toBe('Username must be at least 3 characters');
    });

    it('should return null for valid field', () => {
      const error = form.validateField('username', 'valid_username');
      expect(error).toBeNull();
    });

    it('should return null for unknown field', () => {
      const error = form.validateField('unknown', 'value');
      expect(error).toBeNull();
    });
  });

  describe('field updates', () => {
    beforeEach(() => {
      form.addField({
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        rules: [ValidationRules.minLength(3, 'Username')]
      });
    });

    it('should update field value and validate', () => {
      const fieldState = form.updateField('username', 'ab');
      
      expect(fieldState.value).toBe('ab');
      expect(fieldState.error).toBe('Username must be at least 3 characters');
      expect(fieldState.dirty).toBe(true);
    });

    it('should throw error for unknown field', () => {
      expect(() => form.updateField('unknown', 'value')).toThrow("Field 'unknown' not found");
    });

    it('should mark field as touched', () => {
      form.touchField('username');
      const state = form.getFieldState('username');
      
      expect(state?.touched).toBe(true);
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      form.addFields([
        {
          name: 'username',
          label: 'Username',
          type: 'text',
          required: true,
          rules: [ValidationRules.minLength(3, 'Username')]
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          rules: [ValidationRules.email('Email')]
        }
      ]);
    });

    it('should validate all fields', () => {
      form.updateField('username', 'ab');
      form.updateField('email', 'invalid-email');
      
      const state = form.validateForm();
      
      expect(state.isValid).toBe(false);
      expect(state.errors).toHaveLength(2);
      expect(state.fields.username.error).toBe('Username must be at least 3 characters');
      expect(state.fields.email.error).toBe('Email must be a valid email address');
    });

    it('should return valid state for valid form', () => {
      form.updateField('username', 'validuser');
      form.updateField('email', 'user@example.com');
      
      const state = form.validateForm();
      
      expect(state.isValid).toBe(true);
      expect(state.errors).toHaveLength(0);
      expect(state.fields.username.error).toBeNull();
      expect(state.fields.email.error).toBeNull();
    });
  });

  describe('form submission', () => {
    beforeEach(() => {
      form.addField({
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        rules: [ValidationRules.minLength(3, 'Username')]
      });
    });

    it('should mark form as submitted and touch all fields', () => {
      const state = form.markAsSubmitted();
      
      expect(state.isSubmitted).toBe(true);
      expect(state.fields.username.touched).toBe(true);
    });
  });

  describe('form reset', () => {
    beforeEach(() => {
      form.addField({
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        rules: []
      });
      
      form.updateField('username', 'test');
      form.touchField('username');
      form.markAsSubmitted();
    });

    it('should reset all form state', () => {
      const state = form.reset();
      
      expect(state.isValid).toBe(false);
      expect(state.isSubmitted).toBe(false);
      expect(state.errors).toHaveLength(0);
      expect(state.fields.username.value).toBe('');
      expect(state.fields.username.error).toBeNull();
      expect(state.fields.username.touched).toBe(false);
      expect(state.fields.username.dirty).toBe(false);
    });
  });

  describe('form values', () => {
    beforeEach(() => {
      form.addFields([
        FieldConfigs.text('username', 'Username'),
        FieldConfigs.email('email', 'Email')
      ]);
    });

    it('should get form values as object', () => {
      form.updateField('username', 'testuser');
      form.updateField('email', 'test@example.com');
      
      const values = form.getValues();
      
      expect(values).toEqual({
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    it('should set form values', () => {
      form.setValues({
        username: 'newuser',
        email: 'new@example.com'
      });
      
      const values = form.getValues();
      
      expect(values).toEqual({
        username: 'newuser',
        email: 'new@example.com'
      });
    });

    it('should ignore unknown fields when setting values', () => {
      form.setValues({
        username: 'testuser',
        unknown: 'value'
      });
      
      const values = form.getValues();
      
      expect(values.username).toBe('testuser');
      expect(values.unknown).toBeUndefined();
    });
  });

  describe('field state access', () => {
    beforeEach(() => {
      form.addField(FieldConfigs.text('username', 'Username'));
    });

    it('should get field state', () => {
      form.updateField('username', 'test');
      const fieldState = form.getFieldState('username');
      
      expect(fieldState?.value).toBe('test');
      expect(fieldState?.dirty).toBe(true);
    });

    it('should return null for unknown field', () => {
      const fieldState = form.getFieldState('unknown');
      expect(fieldState).toBeNull();
    });
  });
});

describe('createFormValidation', () => {
  it('should create form with predefined fields', () => {
    const configs = [
      FieldConfigs.text('username', 'Username', true),
      FieldConfigs.email('email', 'Email', true)
    ];
    
    const form = createFormValidation(configs);
    const state = form.getState();
    
    expect(state.fields.username).toBeDefined();
    expect(state.fields.email).toBeDefined();
  });
});

describe('integration tests', () => {
  describe('complex form validation scenarios', () => {
    let form: FormValidation;

    beforeEach(() => {
      form = createFormValidation([
        FieldConfigs.text('title', 'Project Title', true, 3, 100),
        FieldConfigs.date('startDate', 'Start Date', true),
        FieldConfigs.date('endDate', 'End Date', true, true),
        FieldConfigs.currency('budget', 'Budget', false),
        FieldConfigs.select('status', 'Status', [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ], true)
      ]);
    });

    it('should validate complete project form', () => {
      // Set valid values
      form.setValues({
        title: 'Test Project',
        startDate: '01-01-2025',
        endDate: '31-12-2025',
        budget: '10,000.00',
        status: 'active'
      });
      
      const state = form.validateForm();
      expect(state.isValid).toBe(true);
      expect(state.errors).toHaveLength(0);
    });

    it('should handle multiple validation errors', () => {
      form.setValues({
        title: 'A', // Too short
        startDate: '32-01-2025', // Invalid date
        endDate: '01-01-2020', // Past date
        budget: '$invalid$', // Invalid currency
        status: '' // Required but empty
      });
      
      const state = form.markAsSubmitted();
      
      expect(state.isValid).toBe(false);
      expect(state.errors.length).toBeGreaterThan(0);
      expect(state.fields.title.error).toContain('must be at least');
      expect(state.fields.startDate.error).toContain('valid date');
      expect(state.fields.endDate.error).toContain('valid date');
      expect(state.fields.budget.error).toContain('valid NZ currency');
      expect(state.fields.status.error).toContain('required');
    });

    it('should validate date relationships', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 1);
      
      const formatDate = (date: Date) => 
        `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
      
      form.setValues({
        title: 'Test Project',
        startDate: formatDate(today),
        endDate: formatDate(futureDate),
        status: 'active'
      });
      
      const state = form.validateForm();
      
      // End date should be valid (future date)
      expect(state.fields.endDate.error).toBeNull();
    });
  });
});