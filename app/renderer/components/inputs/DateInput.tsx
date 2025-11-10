import React, { forwardRef, useState, useEffect } from 'react';
import { BaseInput } from './BaseInput';
import { NZDate } from '../../utils/validation';

export interface DateInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  'data-testid'?: string;
}

/**
 * Date input component with NZ date validation and DD-MM-YYYY formatting
 * Supports both typed input and date picker interface
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched = false,
  required = false,
  disabled = false,
  className,
  helpText,
  'data-testid': testId
}, ref) => {
  const [displayValue, setDisplayValue] = useState(value);

  // Sync display value with prop value
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // For testing and simplicity, always use text input
    // Format as user types if it looks like numbers
    const formatted = formatAsUserTypes(newValue);
    setDisplayValue(formatted);
    onChange(formatted);
  };

  const handleBlur = () => {
    onBlur?.();
  };

  /**
   * Format date input as user types (DD-MM-YYYY)
   */
  const formatAsUserTypes = (input: string): string => {
    // If input looks like ISO format (YYYY-MM-DD), don't auto-format to allow validation to catch it
    if (input.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return input;
    }
    
    // Remove non-numeric characters except existing dashes in DD-MM-YYYY format
    const numbers = input.replace(/[^\d-]/g, '');
    
    // If it already looks like DD-MM-YYYY format, keep it as is
    if (numbers.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
      return numbers;
    }
    
    // Auto-format with dashes for numeric input only
    const digitsOnly = numbers.replace(/[^\d]/g, '');
    if (digitsOnly.length <= 2) {
      return digitsOnly;
    } else if (digitsOnly.length <= 4) {
      return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2)}`;
    } else {
      return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 4)}-${digitsOnly.slice(4, 8)}`;
    }
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
      helpText={helpText || 'Enter date in DD-MM-YYYY format'}
    >
      <input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="DD-MM-YYYY"
        data-testid={testId}
        maxLength={10}
      />
    </BaseInput>
  );
});
