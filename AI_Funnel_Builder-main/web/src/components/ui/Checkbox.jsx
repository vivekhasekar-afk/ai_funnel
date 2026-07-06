// =============================================================================
// AI FUNNEL PLATFORM - Checkbox Component (Self-Contained)
// =============================================================================
// Checkbox with checked, indeterminate, label, and disabled states
// All styles included - no external CSS dependencies
// =============================================================================

import React, { forwardRef, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const CHECKBOX_STYLES = `
/* Checkbox Container */
.checkbox-wrapper {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.checkbox-wrapper--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Hidden Input */
.checkbox-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Checkbox Box */
.checkbox-box {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  background-color: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
}

.checkbox-wrapper:hover:not(.checkbox-wrapper--disabled) .checkbox-box {
  border-color: #9ca3af;
}

.checkbox-input:focus-visible + .checkbox-box {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Checked State */
.checkbox-input:checked + .checkbox-box {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-input:checked:hover + .checkbox-box {
  background-color: #2563eb;
  border-color: #2563eb;
}

/* Indeterminate State */
.checkbox-box--indeterminate {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-wrapper:hover:not(.checkbox-wrapper--disabled) .checkbox-box--indeterminate {
  background-color: #2563eb;
  border-color: #2563eb;
}

/* Disabled State */
.checkbox-input:disabled + .checkbox-box {
  background-color: #f3f4f6;
  border-color: #e5e7eb;
  cursor: not-allowed;
}

.checkbox-input:checked:disabled + .checkbox-box,
.checkbox-input:disabled + .checkbox-box--indeterminate {
  background-color: #e5e7eb;
  border-color: #d1d5db;
}

/* Check Icon */
.checkbox-icon {
  display: none;
  color: #ffffff;
  width: 14px;
  height: 14px;
}

.checkbox-input:checked + .checkbox-box .checkbox-icon--check {
  display: block;
}

.checkbox-box--indeterminate .checkbox-icon--minus {
  display: block;
}

/* Sizes */
.checkbox-box--sm {
  width: 16px;
  height: 16px;
}

.checkbox-box--sm .checkbox-icon {
  width: 10px;
  height: 10px;
}

.checkbox-box--lg {
  width: 24px;
  height: 24px;
}

.checkbox-box--lg .checkbox-icon {
  width: 18px;
  height: 18px;
}

/* Label */
.checkbox-label {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  padding-top: 0.125rem;
}

.checkbox-label--sm {
  font-size: 0.813rem;
}

.checkbox-label--lg {
  font-size: 1rem;
}

.checkbox-wrapper--disabled .checkbox-label {
  color: #9ca3af;
}

/* Description */
.checkbox-description {
  font-size: 0.813rem;
  color: #6b7280;
  line-height: 1.4;
}

.checkbox-wrapper--disabled .checkbox-description {
  color: #9ca3af;
}

/* Error State */
.checkbox-wrapper--error .checkbox-box {
  border-color: #ef4444;
}

.checkbox-input:checked + .checkbox-box--error {
  background-color: #ef4444;
  border-color: #ef4444;
}

.checkbox-box--error.checkbox-box--indeterminate {
  background-color: #ef4444;
  border-color: #ef4444;
}

.checkbox-error {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.813rem;
  color: #ef4444;
  margin-top: 0.25rem;
}

.checkbox-error svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* Variants */
.checkbox-wrapper--primary .checkbox-input:checked + .checkbox-box {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-wrapper--success .checkbox-input:checked + .checkbox-box {
  background-color: #10b981;
  border-color: #10b981;
}

.checkbox-wrapper--warning .checkbox-input:checked + .checkbox-box {
  background-color: #f59e0b;
  border-color: #f59e0b;
}

.checkbox-wrapper--danger .checkbox-input:checked + .checkbox-box {
  background-color: #ef4444;
  border-color: #ef4444;
}

/* Dark Mode */
.dark .checkbox-box {
  background-color: #1f2937;
  border-color: #374151;
}

.dark .checkbox-wrapper:hover:not(.checkbox-wrapper--disabled) .checkbox-box {
  border-color: #4b5563;
}

.dark .checkbox-input:disabled + .checkbox-box {
  background-color: #111827;
  border-color: #374151;
}

.dark .checkbox-label {
  color: #e5e7eb;
}

.dark .checkbox-description {
  color: #9ca3af;
}

.dark .checkbox-wrapper--disabled .checkbox-label,
.dark .checkbox-wrapper--disabled .checkbox-description {
  color: #6b7280;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .checkbox-box {
    transition: none;
  }
}

@media (prefers-contrast: high) {
  .checkbox-box {
    border-width: 3px;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'checkbox');
  styleElement.textContent = CHECKBOX_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// CHECKBOX COMPONENT
// =============================================================================

const Checkbox = forwardRef(({
  // Input props
  checked,
  defaultChecked,
  indeterminate = false,
  disabled = false,
  required = false,
  name,
  id,
  value,
  
  // Styling
  size = 'md',
  variant = 'primary',
  className = '',
  
  // Label
  label,
  description,
  
  // Validation
  error,
  
  // Events
  onChange,
  onFocus,
  onBlur,
  
  ...props
}, ref) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const internalRef = useRef(null);
  const checkboxRef = ref || internalRef;

  // Set indeterminate state (can't be set via HTML attribute)
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate, checkboxRef]);

  // Build classes
  const wrapperClasses = [
    'checkbox-wrapper',
    `checkbox-wrapper--${variant}`,
    disabled && 'checkbox-wrapper--disabled',
    error && 'checkbox-wrapper--error',
    className,
  ].filter(Boolean).join(' ');

  const boxClasses = [
    'checkbox-box',
    `checkbox-box--${size}`,
    indeterminate && 'checkbox-box--indeterminate',
    error && 'checkbox-box--error',
  ].filter(Boolean).join(' ');

  const labelClasses = [
    'checkbox-label',
    `checkbox-label--${size}`,
  ].filter(Boolean).join(' ');

  // Generate ID if not provided
  const checkboxId = id || `checkbox-${name || Math.random().toString(36).substr(2, 9)}`;

  // Handle change
  const handleChange = (e) => {
    if (disabled) return;
    onChange?.(e);
  };

  return (
    <>
      <label className={wrapperClasses}>
        <input
          ref={checkboxRef}
          type="checkbox"
          id={checkboxId}
          name={name}
          value={value}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          className="checkbox-input"
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${checkboxId}-error` : undefined}
          {...props}
        />
        
        <span className={boxClasses}>
          {/* Check Icon */}
          <svg
            className="checkbox-icon checkbox-icon--check"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          
          {/* Minus Icon (Indeterminate) */}
          <svg
            className="checkbox-icon checkbox-icon--minus"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12h14"
            />
          </svg>
        </span>

        {(label || description) && (
          <span className={labelClasses}>
            {label && <span>{label}</span>}
            {description && (
              <span className="checkbox-description">
                {description}
              </span>
            )}
          </span>
        )}
      </label>

      {/* Error Message */}
      {error && (
        <div className="checkbox-error" id={`${checkboxId}-error`}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </>
  );
});

Checkbox.displayName = 'Checkbox';

// =============================================================================
// CHECKBOX GROUP COMPONENT
// =============================================================================

export const CheckboxGroup = ({
  children,
  label,
  description,
  error,
  required = false,
  className = '',
  orientation = 'vertical',
  gap = '0.75rem',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const groupStyles = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: gap,
  };

  return (
    <div className={className} role="group" {...props}>
      {label && (
        <div
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#374151',
            marginBottom: '0.5rem',
          }}
        >
          {label}
          {required && (
            <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
          )}
        </div>
      )}
      
      {description && (
        <div
          style={{
            fontSize: '0.813rem',
            color: '#6b7280',
            marginBottom: '0.75rem',
          }}
        >
          {description}
        </div>
      )}
      
      <div style={groupStyles}>
        {children}
      </div>
      
      {error && (
        <div className="checkbox-error" style={{ marginTop: '0.5rem' }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

Checkbox.propTypes = {
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  indeterminate: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  name: PropTypes.string,
  id: PropTypes.string,
  value: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger']),
  className: PropTypes.string,
  label: PropTypes.node,
  description: PropTypes.node,
  error: PropTypes.string,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

CheckboxGroup.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string,
  description: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
  orientation: PropTypes.oneOf(['vertical', 'horizontal']),
  gap: PropTypes.string,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Checkbox;
