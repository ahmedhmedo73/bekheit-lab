import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, containerClassName = '', id, required, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`form-group ${error ? 'has-error' : ''} ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {required && <span className="text-danger" aria-hidden="true"> *</span>}
          </label>
        )}
        <div className="input-wrapper">
          {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={`form-input ${leftIcon ? 'with-left-icon' : ''} ${rightIcon ? 'with-right-icon' : ''} ${className}`}
            aria-invalid={!!error}
            {...props}
          />
          {rightIcon && <span className="input-icon-right">{rightIcon}</span>}
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

Input.displayName = 'Input';
