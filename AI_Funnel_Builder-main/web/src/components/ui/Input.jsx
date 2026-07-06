// =============================================================================
// AI FUNNEL PLATFORM - Input Component (Self-Contained)
// =============================================================================
// Text input with label, validation, icons, and accessibility
// All styles included - no external CSS dependencies
// =============================================================================

import React, { forwardRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const INPUT_STYLES = `
/* Input Container */
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
}

/* Label */
.input-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.input-label--required::after {
  content: '*';
  color: #ef4444;
  margin-left: 0.125rem;
}

/* Input Container */
.input-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

/* Input Base */
.input {
  width: 100%;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #111827;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  transition: all 0.2s ease-in-out;
  outline: none;
}

.input::placeholder {
  color: #9ca3af;
}

.input:hover:not(:disabled) {
  border-color: #9ca3af;
}

.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.input:read-only {
  background-color: #f9fafb;
  cursor: default;
}

/* Sizes */
.input--sm {
  height: 36px;
  padding: 0 0.75rem;
  font-size: 0.813rem;
}

.input--md {
  height: 40px;
  padding: 0 0.875rem;
  font-size: 0.875rem;
}

.input--lg {
  height: 48px;
  padding: 0 1rem;
  font-size: 1rem;
}

/* With Icons */
.input--with-left-icon {
  padding-left: 2.5rem;
}

.input--with-right-icon {
  padding-right: 2.5rem;
}

.input--sm.input--with-left-icon {
  padding-left: 2.25rem;
}

.input--sm.input--with-right-icon {
  padding-right: 2.25rem;
}

.input--lg.input--with-left-icon {
  padding-left: 2.75rem;
}

.input--lg.input--with-right-icon {
  padding-right: 2.75rem;
}

/* Input Icons */
.input-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  pointer-events: none;
}

.input-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.input-icon--left {
  left: 0.75rem;
}

.input-icon--right {
  right: 0.75rem;
}

.input-icon--clickable {
  pointer-events: auto;
  cursor: pointer;
  color: #9ca3af;
  transition: color 0.2s ease-in-out;
}

.input-icon--clickable:hover {
  color: #374151;
}

.input--sm .input-icon svg {
  width: 1rem;
  height: 1rem;
}

.input--lg .input-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

/* States */
.input--error {
  border-color: #ef4444;
}

.input--error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input--success {
  border-color: #10b981;
}

.input--success:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.input--warning {
  border-color: #f59e0b;
}

.input--warning:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

/* Helper Text */
.input-helper {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  font-size: 0.813rem;
  line-height: 1.4;
  color: #6b7280;
}

.input-helper svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

/* Error Message */
.input-error {
  color: #ef4444;
}

.input-error svg {
  color: #ef4444;
}

/* Success Message */
.input-success {
  color: #10b981;
}

.input-success svg {
  color: #10b981;
}

/* Warning Message */
.input-warning {
  color: #f59e0b;
}

.input-warning svg {
  color: #f59e0b;
}

/* Character Count */
.input-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #6b7280;
}

.input-count--error {
  color: #ef4444;
}

/* Addon (Prefix/Suffix) */
.input-addon {
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  white-space: nowrap;
}

.input-addon--prefix {
  border-right: none;
  border-radius: 6px 0 0 6px;
}

.input-addon--suffix {
  border-left: none;
  border-radius: 0 6px 6px 0;
}

.input--with-prefix {
  border-left: none;
  border-radius: 0 6px 6px 0;
}

.input--with-suffix {
  border-right: none;
  border-radius: 6px 0 0 0;
}

/* Dark Mode */
.dark .input-label {
  color: #e5e7eb;
}

.dark .input {
  color: #f3f4f6;
  background-color: #1f2937;
  border-color: #374151;
}

.dark .input::placeholder {
  color: #6b7280;
}

.dark .input:hover:not(:disabled) {
  border-color: #4b5563;
}

.dark .input:disabled {
  background-color: #111827;
  color: #6b7280;
}

.dark .input:read-only {
  background-color: #1f2937;
}

.dark .input-icon {
  color: #9ca3af;
}

.dark .input-helper {
  color: #9ca3af;
}

.dark .input-addon {
  background-color: #374151;
  border-color: #4b5563;
  color: #9ca3af;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .input,
  .input-icon {
    transition: none;
  }
}

/* Focus Visible */
.input:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'input');
  styleElement.textContent = INPUT_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// INPUT COMPONENT
// =============================================================================

const Input = forwardRef(({
  // Input props
  type = 'text',
  value,
  defaultValue,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  autoFocus = false,
  autoComplete,
  name,
  id,
  
  // Styling
  size = 'md',
  className = '',
  
  // Label
  label,
  labelClassName = '',
  
  // Icons
  leftIcon,
  rightIcon,
  onRightIconClick,
  
  // Validation
  error,
  success,
  warning,
  helperText,
  
  // Character count
  maxLength,
  showCount = false,
  
  // Addons
  prefix,
  suffix,
  
  // State
  state, // 'error' | 'success' | 'warning'
  
  // Events
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onKeyPress,
  
  ...props
}, ref) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [charCount, setCharCount] = useState(
    value?.length || defaultValue?.length || 0
  );

  // Handle change with character count
  const handleChange = (e) => {
    if (showCount || maxLength) {
      setCharCount(e.target.value.length);
    }
    onChange?.(e);
  };

  // Determine state
  const inputState = error ? 'error' : success ? 'success' : warning ? 'warning' : state;
  
  // Build classes
  const inputClasses = [
    'input',
    `input--${size}`,
    leftIcon && 'input--with-left-icon',
    rightIcon && 'input--with-right-icon',
    prefix && 'input--with-prefix',
    suffix && 'input--with-suffix',
    inputState && `input--${inputState}`,
    className,
  ].filter(Boolean).join(' ');

  // Generate ID if not provided
  const inputId = id || `input-${name || Math.random().toString(36).substr(2, 9)}`;

  // Render helper text or error
  const renderMessage = () => {
    const message = error || success || warning || helperText;
    if (!message) return null;

    const messageClasses = [
      'input-helper',
      error && 'input-error',
      success && 'input-success',
      warning && 'input-warning',
    ].filter(Boolean).join(' ');

    return (
      <div className={messageClasses}>
        {error && (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {success && (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {warning && (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        <span>{message}</span>
      </div>
    );
  };

  // Render character count
  const renderCount = () => {
    if (!showCount && !maxLength) return null;

    const countClasses = [
      'input-count',
      maxLength && charCount > maxLength && 'input-count--error',
    ].filter(Boolean).join(' ');

    return (
      <div className={countClasses}>
        <span>{helperText || ''}</span>
        <span>
          {charCount}{maxLength ? `/${maxLength}` : ''}
        </span>
      </div>
    );
  };

  return (
    <div className="input-wrapper">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={`input-label ${required ? 'input-label--required' : ''} ${labelClassName}`}
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="input-container">
        {/* Prefix Addon */}
        {prefix && (
          <span className="input-addon input-addon--prefix">
            {prefix}
          </span>
        )}

        {/* Left Icon */}
        {leftIcon && (
          <span className="input-icon input-icon--left">
            {leftIcon}
          </span>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={type}
          id={inputId}
          name={name}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={inputClasses}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onKeyPress={onKeyPress}
          aria-invalid={!!error}
          aria-describedby={
            error || helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <span
            className={`input-icon input-icon--right ${onRightIconClick ? 'input-icon--clickable' : ''}`}
            onClick={onRightIconClick}
            role={onRightIconClick ? 'button' : undefined}
            tabIndex={onRightIconClick ? 0 : undefined}
          >
            {rightIcon}
          </span>
        )}

        {/* Suffix Addon */}
        {suffix && (
          <span className="input-addon input-addon--suffix">
            {suffix}
          </span>
        )}
      </div>

      {/* Helper Text / Error / Success / Warning */}
      {renderMessage()}

      {/* Character Count */}
      {renderCount()}
    </div>
  );
});

Input.displayName = 'Input';

// =============================================================================
// PROP TYPES
// =============================================================================

Input.propTypes = {
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  autoFocus: PropTypes.bool,
  autoComplete: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  label: PropTypes.string,
  labelClassName: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  onRightIconClick: PropTypes.func,
  error: PropTypes.string,
  success: PropTypes.string,
  warning: PropTypes.string,
  helperText: PropTypes.string,
  maxLength: PropTypes.number,
  showCount: PropTypes.bool,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  state: PropTypes.oneOf(['error', 'success', 'warning']),
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
  onKeyPress: PropTypes.func,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Input;
export { Input };
