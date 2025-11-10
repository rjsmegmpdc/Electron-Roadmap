import React, { forwardRef, useState, useEffect } from 'react';
import { BaseInput } from './BaseInput';
import { NZCurrency } from '../../utils/validation';

export interface CurrencyInputProps {
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
  showCurrencySymbol?: boolean;
  'data-testid'?: string;
}

/**
 * Currency input component with NZ currency validation and formatting
 * Handles comma separators and decimal places automatically
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(({
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
  showCurrencySymbol = false,
  'data-testid': testId
}, ref) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Sync display value with prop value
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatDisplayValue(value));
    }
  }, [value, isFocused]);

  const formatDisplayValue = (val: string): string => {
    if (!val) return '';
    
    // If it's already a valid NZ currency format, use it
    if (NZCurrency.validate(val)) {
      try {
        const num = NZCurrency.parseToNumber(val);
        return NZCurrency.format(num);
      } catch {
        return val;
      }
    }
    
    return val;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Remove currency symbol if present
    newValue = newValue.replace(/^\$/, '');
    
    // Allow only digits, commas, and one decimal point
    newValue = newValue.replace(/[^0-9,.-]/g, '');
    
    // Handle multiple decimal points - keep only the first one
    const parts = newValue.split('.');
    if (parts.length > 2) {
      newValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      newValue = parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    // Auto-format with commas when not focused on decimal entry
    if (!newValue.endsWith('.') && !newValue.includes('.') && newValue.length > 3) {
      const numValue = newValue.replace(/,/g, '');
      if (/^\d+$/.test(numValue)) {
        const formatted = Number(numValue).toLocaleString('en-NZ');
        newValue = formatted;
      }
    }
    
    setDisplayValue(newValue);
    onChange(newValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Strip formatting for easier editing
    const rawValue = displayValue.replace(/,/g, '');
    setDisplayValue(rawValue);
    
    // Select all text for easy replacement
    setTimeout(() => {
      e.target.select();
    }, 0);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    
    // Format the value when losing focus
    if (displayValue) {
      const formatted = formatDisplayValue(displayValue);
      setDisplayValue(formatted);
      onChange(formatted);
    }
    
    onBlur?.();
  };

  const getPlaceholder = (): string => {
    if (showCurrencySymbol) {
      return '$0.00';
    }
    return '0.00';
  };

  const getDisplayValue = (): string => {
    if (showCurrencySymbol && displayValue && !isFocused) {
      return displayValue.startsWith('$') ? displayValue : `$${displayValue}`;
    }
    return displayValue;
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
      helpText={helpText || 'Enter amount in NZD (e.g., 1,234.56)'}
    >
      <input
        ref={ref}
        type="text"
        value={getDisplayValue()}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={getPlaceholder()}
        data-testid={testId}
        inputMode="decimal"
        autoComplete="off"
      />
    </BaseInput>
  );
});