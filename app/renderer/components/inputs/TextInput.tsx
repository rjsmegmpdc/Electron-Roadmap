import React, { forwardRef } from 'react';
import { BaseInput } from './BaseInput';

export interface TextInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  maxLength?: number;
  minLength?: number;
  className?: string;
  helpText?: string;
  autoComplete?: string;
  'data-testid'?: string;
}

/**
 * Text input component with validation and accessibility features
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched = false,
  required = false,
  disabled = false,
  placeholder,
  type = 'text',
  maxLength,
  minLength,
  className,
  helpText,
  autoComplete,
  'data-testid': testId,
  ...props
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        autoComplete={autoComplete}
        data-testid={testId}
        {...props}
      />
    </BaseInput>
  );
});