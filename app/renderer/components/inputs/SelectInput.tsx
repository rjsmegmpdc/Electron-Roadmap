import React, { forwardRef } from 'react';
import { BaseInput } from './BaseInput';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  error?: string | null;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  helpText?: string;
  'data-testid'?: string;
}

/**
 * Select input component with validation and accessibility features
 */
export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(({
  label,
  name,
  value,
  onChange,
  onBlur,
  options,
  error,
  touched = false,
  required = false,
  disabled = false,
  placeholder = 'Select an option...',
  className,
  helpText,
  'data-testid': testId
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    onBlur?.();
  };

  return (
    <BaseInput
      label={label}
      name={name}
      error={error}
      touched={touched}
      required={required}
      disabled={disabled}
      className={className}
      helpText={helpText}
    >
      <select
        ref={ref}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        data-testid={testId}
      >
        {!value && (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </BaseInput>
  );
});