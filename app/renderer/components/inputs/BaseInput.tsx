import React, { forwardRef, useId } from 'react';

export interface BaseInputProps {
  label: string;
  name: string;
  error?: string | null;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  children: React.ReactNode;
}

/**
 * Base input wrapper component providing consistent layout, styling, and accessibility
 */
export const BaseInput = forwardRef<HTMLDivElement, BaseInputProps>(({
  label,
  name,
  error,
  touched = false,
  required = false,
  disabled = false,
  className = '',
  helpText,
  children
}, ref) => {
  const id = useId();
  const inputId = `${name}-${id}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  const hasError = error && (touched || error);

  return (
    <div ref={ref} className={`form-group ${className}`}>
      <label 
        htmlFor={inputId} 
        className={`label ${required ? 'required' : ''}`}
      >
        {label}
      </label>
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement<any>, {
          id: inputId,
          name,
          disabled,
          'aria-invalid': hasError ? 'true' : 'false',
          'aria-describedby': [
            helpText ? helpId : '',
            hasError ? errorId : ''
          ].filter(Boolean).join(' ') || undefined,
          className: `${(children as React.ReactElement<any>).type === 'select' ? 'select' : 'input'} ${
            hasError ? (children as React.ReactElement<any>).type === 'select' ? 'input-error' : 'input-error' : ''
          } ${(children as React.ReactElement<any>).props?.className || ''}`
        })}
      </div>

      {helpText && (
        <p id={helpId} className="field-help">
          {helpText}
        </p>
      )}

      {hasError && (
        <div 
          id={errorId} 
          className="field-error" 
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
});