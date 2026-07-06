// =============================================================================
// AI FUNNEL PLATFORM - Radio Component (Self-Contained)
// =============================================================================
// Radio button with group support, labels, descriptions, and disabled states
// All styles included - no external CSS dependencies
// =============================================================================

import React, { forwardRef, useEffect, createContext, useContext } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const RADIO_STYLES = `
/* Radio Container */
.radio-wrapper {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.radio-wrapper--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Hidden Input */
.radio-input {
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

/* Radio Circle */
.radio-circle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  background-color: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  transition: all 0.2s ease-in-out;
}

.radio-wrapper:hover:not(.radio-wrapper--disabled) .radio-circle {
  border-color: #9ca3af;
}

.radio-input:focus-visible + .radio-circle {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Checked State */
.radio-input:checked + .radio-circle {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.radio-input:checked:hover + .radio-circle {
  background-color: #2563eb;
  border-color: #2563eb;
}

/* Disabled State */
.radio-input:disabled + .radio-circle {
  background-color: #f3f4f6;
  border-color: #e5e7eb;
  cursor: not-allowed;
}

.radio-input:checked:disabled + .radio-circle {
  background-color: #e5e7eb;
  border-color: #d1d5db;
}

/* Inner Dot */
.radio-dot {
  width: 8px;
  height: 8px;
  background-color: #ffffff;
  border-radius: 50%;
  transform: scale(0);
  transition: transform 0.2s ease-in-out;
}

.radio-input:checked + .radio-circle .radio-dot {
  transform: scale(1);
}

.radio-input:checked:disabled + .radio-circle .radio-dot {
  background-color: #9ca3af;
}

/* Sizes */
.radio-circle--sm {
  width: 16px;
  height: 16px;
}

.radio-circle--sm .radio-dot {
  width: 6px;
  height: 6px;
}

.radio-circle--lg {
  width: 24px;
  height: 24px;
}

.radio-circle--lg .radio-dot {
  width: 10px;
  height: 10px;
}

/* Label */
.radio-label {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  padding-top: 0.125rem;
}

.radio-label--sm {
  font-size: 0.813rem;
}

.radio-label--lg {
  font-size: 1rem;
}

.radio-wrapper--disabled .radio-label {
  color: #9ca3af;
}

/* Description */
.radio-description {
  font-size: 0.813rem;
  color: #6b7280;
  line-height: 1.4;
}

.radio-wrapper--disabled .radio-description {
  color: #9ca3af;
}

/* Error State */
.radio-wrapper--error .radio-circle {
  border-color: #ef4444;
}

.radio-input:checked + .radio-circle--error {
  background-color: #ef4444;
  border-color: #ef4444;
}

/* Variants */
.radio-wrapper--primary .radio-input:checked + .radio-circle {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.radio-wrapper--success .radio-input:checked + .radio-circle {
  background-color: #10b981;
  border-color: #10b981;
}

.radio-wrapper--warning .radio-input:checked + .radio-circle {
  background-color: #f59e0b;
  border-color: #f59e0b;
}

.radio-wrapper--danger .radio-input:checked + .radio-circle {
  background-color: #ef4444;
  border-color: #ef4444;
}

/* Radio Group */
.radio-group {
  display: flex;
  flex-direction: column;
}

.radio-group__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.radio-group__label--required::after {
  content: '*';
  color: #ef4444;
  margin-left: 0.25rem;
}

.radio-group__description {
  font-size: 0.813rem;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 0.75rem;
}

.radio-group__items {
  display: flex;
  flex-direction: column;
}

.radio-group__items--horizontal {
  flex-direction: row;
  flex-wrap: wrap;
}

.radio-group__error {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.813rem;
  color: #ef4444;
  margin-top: 0.5rem;
}

.radio-group__error svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* Card Variant */
.radio-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-color: #ffffff;
}

.radio-card:hover:not(.radio-card--disabled) {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

.radio-input:checked ~ .radio-card,
.radio-card--checked {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.radio-card--disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: #f9fafb;
}

.radio-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.radio-card__title {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.radio-card__description {
  font-size: 0.813rem;
  color: #6b7280;
  line-height: 1.4;
}

.radio-card--disabled .radio-card__title,
.radio-card--disabled .radio-card__description {
  color: #9ca3af;
}

/* Dark Mode */
.dark .radio-circle {
  background-color: #1f2937;
  border-color: #374151;
}

.dark .radio-wrapper:hover:not(.radio-wrapper--disabled) .radio-circle {
  border-color: #4b5563;
}

.dark .radio-input:disabled + .radio-circle {
  background-color: #111827;
  border-color: #374151;
}

.dark .radio-label {
  color: #e5e7eb;
}

.dark .radio-description {
  color: #9ca3af;
}

.dark .radio-wrapper--disabled .radio-label,
.dark .radio-wrapper--disabled .radio-description {
  color: #6b7280;
}

.dark .radio-group__label {
  color: #e5e7eb;
}

.dark .radio-group__description {
  color: #9ca3af;
}

.dark .radio-card {
  background-color: #1f2937;
  border-color: #374151;
}

.dark .radio-card:hover:not(.radio-card--disabled) {
  border-color: #3b82f6;
  background-color: #1e3a5f;
}

.dark .radio-card--checked {
  background-color: #1e3a5f;
}

.dark .radio-card__title {
  color: #f3f4f6;
}

.dark .radio-card__description {
  color: #9ca3af;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .radio-circle,
  .radio-dot,
  .radio-card {
    transition: none;
  }
}

@media (prefers-contrast: high) {
  .radio-circle {
    border-width: 3px;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'radio');
  styleElement.textContent = RADIO_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// RADIO GROUP CONTEXT
// =============================================================================

const RadioGroupContext = createContext({
  name: undefined,
  value: undefined,
  onChange: undefined,
  disabled: false,
  size: 'md',
  variant: 'primary',
});

// =============================================================================
// RADIO COMPONENT
// =============================================================================

const Radio = forwardRef(({
  // Input props
  checked,
  defaultChecked,
  disabled,
  required = false,
  name,
  id,
  value,
  
  // Styling
  size,
  variant,
  className = '',
  
  // Label
  label,
  description,
  
  // Events
  onChange,
  onFocus,
  onBlur,
  
  ...props
}, ref) => {
  useEffect(() => {
    injectStyles();
  }, []);

  // Get context from RadioGroup if available
  const groupContext = useContext(RadioGroupContext);
  
  // Merge props with context
  const actualName = name || groupContext.name;
  const actualSize = size || groupContext.size || 'md';
  const actualVariant = variant || groupContext.variant || 'primary';
  const actualDisabled = disabled !== undefined ? disabled : groupContext.disabled;
  const isChecked = checked !== undefined 
    ? checked 
    : groupContext.value !== undefined 
      ? groupContext.value === value 
      : undefined;

  // Build classes
  const wrapperClasses = [
    'radio-wrapper',
    `radio-wrapper--${actualVariant}`,
    actualDisabled && 'radio-wrapper--disabled',
    className,
  ].filter(Boolean).join(' ');

  const circleClasses = [
    'radio-circle',
    `radio-circle--${actualSize}`,
  ].filter(Boolean).join(' ');

  const labelClasses = [
    'radio-label',
    `radio-label--${actualSize}`,
  ].filter(Boolean).join(' ');

  // Generate ID if not provided
  const radioId = id || `radio-${actualName}-${value || Math.random().toString(36).substr(2, 9)}`;

  // Handle change
  const handleChange = (e) => {
    if (actualDisabled) return;
    onChange?.(e);
    groupContext.onChange?.(e.target.value);
  };

  return (
    <label className={wrapperClasses}>
      <input
        ref={ref}
        type="radio"
        id={radioId}
        name={actualName}
        value={value}
        checked={isChecked}
        defaultChecked={defaultChecked}
        disabled={actualDisabled}
        required={required}
        className="radio-input"
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        {...props}
      />
      
      <span className={circleClasses}>
        <span className="radio-dot" />
      </span>

      {(label || description) && (
        <span className={labelClasses}>
          {label && <span>{label}</span>}
          {description && (
            <span className="radio-description">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
});

Radio.displayName = 'Radio';

// =============================================================================
// RADIO GROUP COMPONENT
// =============================================================================

export const RadioGroup = ({
  children,
  name,
  value,
  defaultValue,
  onChange,
  label,
  description,
  error,
  required = false,
  disabled = false,
  size = 'md',
  variant = 'primary',
  orientation = 'vertical',
  gap = '0.75rem',
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const contextValue = {
    name,
    value: value !== undefined ? value : defaultValue,
    onChange,
    disabled,
    size,
    variant,
  };

  const itemsStyles = {
    gap: gap,
  };

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div className={`radio-group ${className}`} role="radiogroup" {...props}>
        {label && (
          <div className={`radio-group__label ${required ? 'radio-group__label--required' : ''}`}>
            {label}
          </div>
        )}
        
        {description && (
          <div className="radio-group__description">
            {description}
          </div>
        )}
        
        <div
          className={`radio-group__items ${orientation === 'horizontal' ? 'radio-group__items--horizontal' : ''}`}
          style={itemsStyles}
        >
          {children}
        </div>
        
        {error && (
          <div className="radio-group__error">
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
    </RadioGroupContext.Provider>
  );
};

// =============================================================================
// RADIO CARD COMPONENT
// =============================================================================

export const RadioCard = forwardRef(({
  value,
  label,
  description,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const groupContext = useContext(RadioGroupContext);
  const isChecked = groupContext.value === value;
  const actualDisabled = disabled !== undefined ? disabled : groupContext.disabled;

  const cardClasses = [
    'radio-card',
    isChecked && 'radio-card--checked',
    actualDisabled && 'radio-card--disabled',
    className,
  ].filter(Boolean).join(' ');

  const handleChange = (e) => {
    if (actualDisabled) return;
    groupContext.onChange?.(value);
  };

  return (
    <label className="radio-wrapper">
      <input
        ref={ref}
        type="radio"
        name={groupContext.name}
        value={value}
        checked={isChecked}
        disabled={actualDisabled}
        className="radio-input"
        onChange={handleChange}
        {...props}
      />
      
      <div className={cardClasses}>
        <span className="radio-circle">
          <span className="radio-dot" />
        </span>
        
        <div className="radio-card__content">
          {label && (
            <div className="radio-card__title">{label}</div>
          )}
          {description && (
            <div className="radio-card__description">{description}</div>
          )}
          {children}
        </div>
      </div>
    </label>
  );
});

RadioCard.displayName = 'RadioCard';

// =============================================================================
// PROP TYPES
// =============================================================================

Radio.propTypes = {
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  name: PropTypes.string,
  id: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger']),
  className: PropTypes.string,
  label: PropTypes.node,
  description: PropTypes.node,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

RadioGroup.propTypes = {
  children: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  label: PropTypes.string,
  description: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger']),
  orientation: PropTypes.oneOf(['vertical', 'horizontal']),
  gap: PropTypes.string,
  className: PropTypes.string,
};

RadioCard.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.node,
  description: PropTypes.node,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Radio;