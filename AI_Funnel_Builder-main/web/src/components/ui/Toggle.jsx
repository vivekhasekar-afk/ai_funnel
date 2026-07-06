// =============================================================================
// AI FUNNEL PLATFORM - Toggle Component (Self-Contained)
// =============================================================================
// Switch toggle with on/off state, labels, icons, and accessibility
// All styles included - no external CSS dependencies
// =============================================================================

import React, { forwardRef, useEffect } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const TOGGLE_STYLES = `
/* Toggle Wrapper */
.toggle-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.toggle-wrapper--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle-wrapper--full-width {
  width: 100%;
  justify-content: space-between;
}

/* Hidden Input */
.toggle-input {
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

/* Toggle Track */
.toggle-track {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  background-color: #d1d5db;
  border-radius: 9999px;
  transition: all 0.2s ease-in-out;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.toggle-wrapper:hover:not(.toggle-wrapper--disabled) .toggle-track {
  background-color: #9ca3af;
}

.toggle-input:focus-visible + .toggle-track {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Checked State */
.toggle-input:checked + .toggle-track {
  background-color: #3b82f6;
}

.toggle-wrapper:hover:not(.toggle-wrapper--disabled) .toggle-input:checked + .toggle-track {
  background-color: #2563eb;
}

/* Disabled State */
.toggle-input:disabled + .toggle-track {
  background-color: #e5e7eb;
  box-shadow: none;
}

.toggle-input:checked:disabled + .toggle-track {
  background-color: #93c5fd;
}

/* Toggle Thumb */
.toggle-thumb {
  position: absolute;
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-input:checked + .toggle-track .toggle-thumb {
  transform: translateX(100%);
}

/* Thumb Icon */
.toggle-thumb-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.toggle-thumb-icon svg {
  width: 60%;
  height: 60%;
}

.toggle-input:checked + .toggle-track .toggle-thumb-icon {
  color: #3b82f6;
}

/* Track Icon */
.toggle-track-icon {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  pointer-events: none;
}

.toggle-track-icon--left {
  left: 25%;
}

.toggle-track-icon--right {
  right: 25%;
}

.toggle-track-icon svg {
  width: 50%;
  height: 50%;
}

.toggle-input:checked + .toggle-track .toggle-track-icon--left {
  opacity: 1;
}

.toggle-input:not(:checked) + .toggle-track .toggle-track-icon--right {
  opacity: 1;
}

/* Sizes */
.toggle-track--sm {
  width: 36px;
  height: 20px;
  padding: 2px;
}

.toggle-track--sm .toggle-thumb {
  width: 16px;
  height: 16px;
}

.toggle-track--md {
  width: 44px;
  height: 24px;
  padding: 2px;
}

.toggle-track--md .toggle-thumb {
  width: 20px;
  height: 20px;
}

.toggle-track--lg {
  width: 56px;
  height: 32px;
  padding: 3px;
}

.toggle-track--lg .toggle-thumb {
  width: 26px;
  height: 26px;
}

/* Label */
.toggle-label {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.toggle-label-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  line-height: 1.5;
}

.toggle-label-text--sm {
  font-size: 0.813rem;
}

.toggle-label-text--lg {
  font-size: 1rem;
}

.toggle-description {
  font-size: 0.813rem;
  color: #6b7280;
  line-height: 1.4;
}

.toggle-wrapper--disabled .toggle-label-text,
.toggle-wrapper--disabled .toggle-description {
  color: #9ca3af;
}

/* Label Position */
.toggle-wrapper--label-left {
  flex-direction: row-reverse;
}

/* Variants */
.toggle-wrapper--success .toggle-input:checked + .toggle-track {
  background-color: #10b981;
}

.toggle-wrapper--success .toggle-wrapper:hover:not(.toggle-wrapper--disabled) .toggle-input:checked + .toggle-track {
  background-color: #059669;
}

.toggle-wrapper--warning .toggle-input:checked + .toggle-track {
  background-color: #f59e0b;
}

.toggle-wrapper--warning .toggle-wrapper:hover:not(.toggle-wrapper--disabled) .toggle-input:checked + .toggle-track {
  background-color: #d97706;
}

.toggle-wrapper--danger .toggle-input:checked + .toggle-track {
  background-color: #ef4444;
}

.toggle-wrapper--danger .toggle-wrapper:hover:not(.toggle-wrapper--disabled) .toggle-input:checked + .toggle-track {
  background-color: #dc2626;
}

/* Loading State */
.toggle-loading {
  pointer-events: none;
}

.toggle-loading .toggle-thumb-icon {
  animation: toggle-spin 1s linear infinite;
}

@keyframes toggle-spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.toggle-error {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.813rem;
  color: #ef4444;
  margin-top: 0.375rem;
}

.toggle-error svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* Dark Mode */
.dark .toggle-track {
  background-color: #374151;
}

.dark .toggle-wrapper:hover:not(.toggle-wrapper--disabled) .toggle-track {
  background-color: #4b5563;
}

.dark .toggle-input:checked + .toggle-track {
  background-color: #3b82f6;
}

.dark .toggle-input:disabled + .toggle-track {
  background-color: #1f2937;
}

.dark .toggle-thumb {
  background-color: #e5e7eb;
}

.dark .toggle-label-text {
  color: #e5e7eb;
}

.dark .toggle-description {
  color: #9ca3af;
}

.dark .toggle-wrapper--disabled .toggle-label-text,
.dark .toggle-wrapper--disabled .toggle-description {
  color: #6b7280;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .toggle-track,
  .toggle-thumb,
  .toggle-track-icon {
    transition: none;
  }
}

@media (prefers-contrast: high) {
  .toggle-track {
    border: 2px solid currentColor;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'toggle');
  styleElement.textContent = TOGGLE_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// TOGGLE COMPONENT
// =============================================================================

const Toggle = forwardRef(({
  // Input props
  checked,
  defaultChecked,
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
  labelPosition = 'right',
  
  // Icons
  showIcons = false,
  checkedIcon,
  uncheckedIcon,
  thumbIcon = false,
  
  // States
  loading = false,
  error,
  
  // Layout
  fullWidth = false,
  
  // Events
  onChange,
  onFocus,
  onBlur,
  
  ...props
}, ref) => {
  useEffect(() => {
    injectStyles();
  }, []);

  // Build classes
  const wrapperClasses = [
    'toggle-wrapper',
    `toggle-wrapper--${variant}`,
    disabled && 'toggle-wrapper--disabled',
    loading && 'toggle-loading',
    labelPosition === 'left' && 'toggle-wrapper--label-left',
    fullWidth && 'toggle-wrapper--full-width',
    className,
  ].filter(Boolean).join(' ');

  const trackClasses = [
    'toggle-track',
    `toggle-track--${size}`,
  ].filter(Boolean).join(' ');

  const labelTextClasses = [
    'toggle-label-text',
    `toggle-label-text--${size}`,
  ].filter(Boolean).join(' ');

  // Generate ID if not provided
  const toggleId = id || `toggle-${name || Math.random().toString(36).substr(2, 9)}`;

  // Handle change
  const handleChange = (e) => {
    if (disabled || loading) return;
    onChange?.(e);
  };

  // Default icons
  const defaultCheckedIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const defaultUncheckedIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const loadingIcon = (
    <svg fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
    </svg>
  );

  return (
    <>
      <label className={wrapperClasses}>
        <input
          ref={ref}
          type="checkbox"
          id={toggleId}
          name={name}
          value={value}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled || loading}
          required={required}
          className="toggle-input"
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          role="switch"
          aria-checked={checked}
          aria-label={typeof label === 'string' ? label : undefined}
          {...props}
        />
        
        <span className={trackClasses}>
          {/* Track Icons */}
          {showIcons && (
            <>
              <span className="toggle-track-icon toggle-track-icon--left">
                {checkedIcon || defaultCheckedIcon}
              </span>
              <span className="toggle-track-icon toggle-track-icon--right">
                {uncheckedIcon || defaultUncheckedIcon}
              </span>
            </>
          )}
          
          {/* Thumb */}
          <span className="toggle-thumb">
            {(thumbIcon || loading) && (
              <span className="toggle-thumb-icon">
                {loading ? loadingIcon : thumbIcon}
              </span>
            )}
          </span>
        </span>

        {/* Label */}
        {(label || description) && (
          <span className="toggle-label">
            {label && (
              <span className={labelTextClasses}>
                {label}
              </span>
            )}
            {description && (
              <span className="toggle-description">
                {description}
              </span>
            )}
          </span>
        )}
      </label>

      {/* Error Message */}
      {error && (
        <div className="toggle-error">
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

Toggle.displayName = 'Toggle';

// =============================================================================
// TOGGLE GROUP COMPONENT
// =============================================================================

export const ToggleGroup = ({
  children,
  label,
  description,
  error,
  orientation = 'vertical',
  gap = '0.75rem',
  className = '',
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
        <div className="toggle-error" style={{ marginTop: '0.5rem' }}>
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

Toggle.propTypes = {
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
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
  labelPosition: PropTypes.oneOf(['left', 'right']),
  showIcons: PropTypes.bool,
  checkedIcon: PropTypes.node,
  uncheckedIcon: PropTypes.node,
  thumbIcon: PropTypes.node,
  loading: PropTypes.bool,
  error: PropTypes.string,
  fullWidth: PropTypes.bool,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

ToggleGroup.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string,
  description: PropTypes.string,
  error: PropTypes.string,
  orientation: PropTypes.oneOf(['vertical', 'horizontal']),
  gap: PropTypes.string,
  className: PropTypes.string,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Toggle;