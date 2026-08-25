import { type SelectHTMLAttributes, type ReactNode, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: (SelectOption | string)[];
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  containerClassName?: string;
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, leftIcon, containerClassName = '', id, required, className = '', ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`form-group ${error ? 'has-error' : ''} ${containerClassName}`}>
        {label && (
          <label htmlFor={selectId} className="form-label">
            {label}
            {required && <span className="text-danger" aria-hidden="true"> *</span>}
          </label>
        )}
        <div className="select-wrapper">
          {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
          <select
            id={selectId}
            ref={ref}
            className={`form-select ${leftIcon ? 'with-left-icon' : ''} ${className}`}
            aria-invalid={!!error}
            {...props}
          >
            {options.map((opt) => {
              if (typeof opt === 'string') {
                return (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                );
              }
              return (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              );
            })}
          </select>
          <div className="select-arrow" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        {error ? (
          <span className="form-error" role="alert">{error}</span>
        ) : helperText ? (
          <span className="form-helper">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
