import React, { forwardRef } from 'react';
import { BaseInput } from './BaseInput';

export interface TextAreaInputProps {
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
  rows?: number;
  maxLength?: number;
  minLength?: number;
  className?: string;
  helpText?: string;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  'data-testid'?: string;
}

/**
 * Textarea input component with validation and accessibility features
 */
export const TextAreaInput = forwardRef<HTMLTextAreaElement, TextAreaInputProps>(({
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
  rows = 3,
  maxLength,
  minLength,
  className,
  helpText,
  resize = 'vertical',
  'data-testid': testId
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    onBlur?.();
  };

  const getResizeClass = () => {
    switch (resize) {
      case 'none': return 'resize-none';
      case 'both': return 'resize';
      case 'horizontal': return 'resize-x';
      case 'vertical': return 'resize-y';
      default: return 'resize-y';
    }
  };

  const getHelpText = () => {
    if (maxLength && value) {
      const remaining = maxLength - value.length;
      const countText = `${value.length}/${maxLength} characters`;
      if (helpText) {
        return `${helpText} (${countText})`;
      }
      return countText;
    }
    return helpText;
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
      helpText={getHelpText()}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        minLength={minLength}
        data-testid={testId}
        className={getResizeClass()}
      />
    </BaseInput>
  );
});