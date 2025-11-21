/**
 * Form Validation Utilities
 * Provides field-level validation rules, form state management, and real-time validation feedback
 * Built on top of existing NZCurrency and NZDate validation classes
 */

import { NZCurrency, NZDate } from './validation';

// Validation rule types
export type ValidationRule = (value: string) => string | null;
export type ValidationRules = ValidationRule[];

// Form field configuration
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'currency' | 'select' | 'textarea';
  rules: ValidationRules;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[]; // For select inputs
}

// Field state
export interface FieldState {
  value: string;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

// Form state
export interface FormState {
  fields: Record<string, FieldState>;
  isValid: boolean;
  isSubmitted: boolean;
  errors: string[];
}

/**
 * Core validation rules
 */
export const ValidationRules = {
  /**
   * Required field validation
   */
  required: (fieldName: string = 'Field'): ValidationRule => 
    (value: string) => {
      if (!value || value.trim().length === 0) {
        return `${fieldName} is required`;
      }
      return null;
    },

  /**
   * Minimum length validation
   */
  minLength: (min: number, fieldName: string = 'Field'): ValidationRule =>
    (value: string) => {
      if (value && value.length < min) {
        return `${fieldName} must be at least ${min} characters`;
      }
      return null;
    },

  /**
   * Maximum length validation
   */
  maxLength: (max: number, fieldName: string = 'Field'): ValidationRule =>
    (value: string) => {
      if (value && value.length > max) {
        return `${fieldName} must not exceed ${max} characters`;
      }
      return null;
    },

  /**
   * Email validation
   */
  email: (fieldName: string = 'Email'): ValidationRule =>
    (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        return `${fieldName} must be a valid email address`;
      }
      return null;
    },

  /**
   * NZ Currency validation using existing NZCurrency class
   */
  nzCurrency: (fieldName: string = 'Amount'): ValidationRule =>
    (value: string) => {
      if (value && !NZCurrency.validate(value)) {
        return `${fieldName} must be a valid NZ currency amount (e.g., 1,234.56)`;
      }
      return null;
    },

  /**
   * NZ Date validation using existing NZDate class
   */
  nzDate: (fieldName: string = 'Date'): ValidationRule =>
    (value: string) => {
      if (value && !NZDate.validate(value)) {
        return `${fieldName} must be a valid date in DD-MM-YYYY format`;
      }
      return null;
    },

  /**
   * Future date validation (must be after today)
   */
  futureDate: (fieldName: string = 'Date'): ValidationRule =>
    (value: string) => {
      if (value && NZDate.validate(value)) {
        try {
          const inputDate = NZDate.parse(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time for date-only comparison
          
          if (inputDate <= today) {
            return `${fieldName} must be a future date`;
          }
        } catch {
          // Date parsing failed, but this should be caught by nzDate rule
        }
      }
      return null;
    },

  /**
   * Date range validation
   */
  dateRange: (minDate: string, maxDate: string, fieldName: string = 'Date'): ValidationRule =>
    (value: string) => {
      if (value && NZDate.validate(value)) {
        try {
          const inputDate = NZDate.parse(value);
          const min = NZDate.parse(minDate);
          const max = NZDate.parse(maxDate);
          
          if (inputDate < min || inputDate > max) {
            return `${fieldName} must be between ${minDate} and ${maxDate}`;
          }
        } catch {
          // Date parsing failed
        }
      }
      return null;
    },

  /**
   * Custom pattern validation
   */
  pattern: (regex: RegExp, message: string): ValidationRule =>
    (value: string) => {
      if (value && !regex.test(value)) {
        return message;
      }
      return null;
    }
};

/**
 * Form validation utilities
 */
export class FormValidation {
  private fields: Record<string, FieldConfig> = {};
  private state: FormState = {
    fields: {},
    isValid: false,
    isSubmitted: false,
    errors: []
  };

  /**
   * Add a field configuration to the form
   */
  addField(config: FieldConfig): void {
    this.fields[config.name] = config;
    this.state.fields[config.name] = {
      value: '',
      error: null,
      touched: false,
      dirty: false
    };
  }

  /**
   * Add multiple field configurations
   */
  addFields(configs: FieldConfig[]): void {
    configs.forEach(config => this.addField(config));
  }

  /**
   * Validate a single field
   */
  validateField(fieldName: string, value: string): string | null {
    const fieldConfig = this.fields[fieldName];
    if (!fieldConfig) return null;

    // Check required rule first if field is marked as required
    if (fieldConfig.required && (!value || value.trim().length === 0)) {
      return `${fieldConfig.label} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!fieldConfig.required && (!value || value.trim().length === 0)) {
      return null;
    }

    // Run through validation rules
    for (const rule of fieldConfig.rules) {
      const error = rule(value);
      if (error) return error;
    }

    return null;
  }

  /**
   * Update field value and validate
   */
  updateField(fieldName: string, value: string): FieldState {
    if (!this.state.fields[fieldName]) {
      throw new Error(`Field '${fieldName}' not found`);
    }

    const error = this.validateField(fieldName, value);
    const fieldState = {
      value,
      error,
      touched: this.state.fields[fieldName].touched,
      dirty: this.state.fields[fieldName].value !== value
    };

    this.state.fields[fieldName] = fieldState;
    this.updateFormState();

    return fieldState;
  }

  /**
   * Mark field as touched (user has interacted with it)
   */
  touchField(fieldName: string): void {
    if (this.state.fields[fieldName]) {
      this.state.fields[fieldName].touched = true;
      this.updateFormState();
    }
  }

  /**
   * Validate entire form
   */
  validateForm(): FormState {
    const errors: string[] = [];

    // Validate all fields
    Object.keys(this.fields).forEach(fieldName => {
      const fieldState = this.state.fields[fieldName];
      const error = this.validateField(fieldName, fieldState.value);
      
      this.state.fields[fieldName].error = error;
      if (error) {
        errors.push(error);
      }
    });

    this.state.errors = errors;
    this.state.isValid = errors.length === 0;
    this.updateFormState();

    return this.state;
  }

  /**
   * Mark form as submitted
   */
  markAsSubmitted(): FormState {
    this.state.isSubmitted = true;
    
    // Mark all fields as touched on submit
    Object.keys(this.state.fields).forEach(fieldName => {
      this.state.fields[fieldName].touched = true;
    });

    return this.validateForm();
  }

  /**
   * Reset form to initial state
   */
  reset(): FormState {
    Object.keys(this.state.fields).forEach(fieldName => {
      this.state.fields[fieldName] = {
        value: '',
        error: null,
        touched: false,
        dirty: false
      };
    });

    this.state.isValid = false;
    this.state.isSubmitted = false;
    this.state.errors = [];

    return this.state;
  }

  /**
   * Get current form state
   */
  getState(): FormState {
    return { ...this.state };
  }

  /**
   * Get field state
   */
  getFieldState(fieldName: string): FieldState | null {
    return this.state.fields[fieldName] || null;
  }

  /**
   * Get form values as key-value object
   */
  getValues(): Record<string, string> {
    const values: Record<string, string> = {};
    Object.keys(this.state.fields).forEach(fieldName => {
      values[fieldName] = this.state.fields[fieldName].value;
    });
    return values;
  }

  /**
   * Set form values
   */
  setValues(values: Record<string, string>): void {
    Object.keys(values).forEach(fieldName => {
      if (this.state.fields[fieldName]) {
        this.updateField(fieldName, values[fieldName]);
      }
    });
  }

  /**
   * Update overall form validation state
   */
  private updateFormState(): void {
    const hasErrors = Object.values(this.state.fields).some(field => field.error !== null);
    this.state.isValid = !hasErrors;
    
    // Collect all current errors
    this.state.errors = Object.values(this.state.fields)
      .map(field => field.error)
      .filter((error): error is string => error !== null);
  }
}

/**
 * Hook-like function for React integration (can be used with useState)
 * Creates a new FormValidation instance with predefined fields
 */
export function createFormValidation(configs: FieldConfig[]): FormValidation {
  const form = new FormValidation();
  form.addFields(configs);
  return form;
}

/**
 * Utility to create common field configurations
 */
export const FieldConfigs = {
  /**
   * Text input field
   */
  text: (name: string, label: string, required = false, minLength?: number, maxLength?: number): FieldConfig => ({
    name,
    label,
    type: 'text',
    required,
    rules: [
      ...(minLength ? [ValidationRules.minLength(minLength, label)] : []),
      ...(maxLength ? [ValidationRules.maxLength(maxLength, label)] : [])
    ]
  }),

  /**
   * Email input field
   */
  email: (name: string, label: string = 'Email', required = false): FieldConfig => ({
    name,
    label,
    type: 'email',
    required,
    rules: [ValidationRules.email(label)]
  }),

  /**
   * NZ Currency input field
   */
  currency: (name: string, label: string, required = false): FieldConfig => ({
    name,
    label,
    type: 'currency',
    required,
    rules: [ValidationRules.nzCurrency(label)],
    placeholder: '0.00'
  }),

  /**
   * NZ Date input field
   */
  date: (name: string, label: string, required = false, futureOnly = false): FieldConfig => ({
    name,
    label,
    type: 'date',
    required,
    rules: [
      ValidationRules.nzDate(label),
      ...(futureOnly ? [ValidationRules.futureDate(label)] : [])
    ],
    placeholder: 'DD-MM-YYYY'
  }),

  /**
   * Select input field
   */
  select: (name: string, label: string, options: { value: string; label: string }[], required = false): FieldConfig => ({
    name,
    label,
    type: 'select',
    required,
    options,
    rules: []
  }),

  /**
   * Textarea field
   */
  textarea: (name: string, label: string, required = false, minLength?: number, maxLength?: number): FieldConfig => ({
    name,
    label,
    type: 'textarea',
    required,
    rules: [
      ...(minLength ? [ValidationRules.minLength(minLength, label)] : []),
      ...(maxLength ? [ValidationRules.maxLength(maxLength, label)] : [])
    ]
  })
};