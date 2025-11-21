/**
 * Input Components
 * 
 * Reusable input components with built-in validation, accessibility, and consistent styling.
 * Built on top of the FormValidation utilities and NZ validation system.
 */

export { BaseInput } from './BaseInput';
export type { BaseInputProps } from './BaseInput';

export { TextInput } from './TextInput';
export type { TextInputProps } from './TextInput';

export { DateInput } from './DateInput';
export type { DateInputProps } from './DateInput';

export { CurrencyInput } from './CurrencyInput';
export type { CurrencyInputProps } from './CurrencyInput';

export { SelectInput } from './SelectInput';
export type { SelectInputProps, SelectOption } from './SelectInput';

export { TextAreaInput } from './TextAreaInput';
export type { TextAreaInputProps } from './TextAreaInput';

// Re-export form validation utilities for convenience
export { 
  FormValidation, 
  ValidationRules, 
  FieldConfigs, 
  createFormValidation 
} from '../../utils/formValidation';

export type {
  ValidationRule,
  ValidationRules as ValidationRulesType,
  FieldConfig,
  FieldState,
  FormState
} from '../../utils/formValidation';