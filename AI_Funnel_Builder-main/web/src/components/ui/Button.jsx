// =============================================================================
// AI FUNNEL PLATFORM - Button Component (Self-Contained)
// =============================================================================
// Button with variants, sizes, loading state, icons, and accessibility
// All styles included - no external CSS dependencies
// =============================================================================

import React, { forwardRef, useEffect } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const BUTTON_STYLES = `
/* Button Base Styles */
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
  vertical-align: middle;
  user-select: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  outline: none;
}

.btn:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.btn:disabled,
.btn.btn--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.btn--loading {
  cursor: wait;
  pointer-events: none;
}

.btn--loading .btn__content {
  visibility: hidden;
}

/* Full Width */
.btn--full-width {
  width: 100%;
}

/* Icon Only */
.btn--icon-only {
  padding: 0;
  aspect-ratio: 1;
}

/* =============================================================================
   SIZES
   ============================================================================= */

.btn--xs {
  height: 28px;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  border-radius: 4px;
}

.btn--sm {
  height: 36px;
  padding: 0 1rem;
  font-size: 0.875rem;
  border-radius: 6px;
}

.btn--md {
  height: 40px;
  padding: 0 1.25rem;
  font-size: 0.875rem;
  border-radius: 6px;
}

.btn--lg {
  height: 48px;
  padding: 0 1.5rem;
  font-size: 1rem;
  border-radius: 8px;
}

.btn--xl {
  height: 56px;
  padding: 0 2rem;
  font-size: 1.125rem;
  border-radius: 8px;
}

/* Icon Only Sizes */
.btn--icon-only.btn--xs { width: 28px; }
.btn--icon-only.btn--sm { width: 36px; }
.btn--icon-only.btn--md { width: 40px; }
.btn--icon-only.btn--lg { width: 48px; }
.btn--icon-only.btn--xl { width: 56px; }

/* =============================================================================
   VARIANTS
   ============================================================================= */

/* Primary */
.btn--primary {
  color: #ffffff;
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.btn--primary:hover:not(:disabled) {
  background-color: #2563eb;
  border-color: #2563eb;
}

.btn--primary:active:not(:disabled) {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}

/* Secondary */
.btn--secondary {
  color: #374151;
  background-color: #f3f4f6;
  border-color: #e5e7eb;
}

.btn--secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
  border-color: #d1d5db;
}

.btn--secondary:active:not(:disabled) {
  background-color: #d1d5db;
  border-color: #9ca3af;
}

/* Danger */
.btn--danger {
  color: #ffffff;
  background-color: #ef4444;
  border-color: #ef4444;
}

.btn--danger:hover:not(:disabled) {
  background-color: #dc2626;
  border-color: #dc2626;
}

.btn--danger:active:not(:disabled) {
  background-color: #b91c1c;
  border-color: #b91c1c;
}

/* Success */
.btn--success {
  color: #ffffff;
  background-color: #10b981;
  border-color: #10b981;
}

.btn--success:hover:not(:disabled) {
  background-color: #059669;
  border-color: #059669;
}

.btn--success:active:not(:disabled) {
  background-color: #047857;
  border-color: #047857;
}

/* Warning */
.btn--warning {
  color: #ffffff;
  background-color: #f59e0b;
  border-color: #f59e0b;
}

.btn--warning:hover:not(:disabled) {
  background-color: #d97706;
  border-color: #d97706;
}

.btn--warning:active:not(:disabled) {
  background-color: #b45309;
  border-color: #b45309;
}

/* Outline */
.btn--outline {
  color: #3b82f6;
  background-color: transparent;
  border-color: #3b82f6;
}

.btn--outline:hover:not(:disabled) {
  color: #ffffff;
  background-color: #3b82f6;
}

.btn--outline:active:not(:disabled) {
  color: #ffffff;
  background-color: #2563eb;
  border-color: #2563eb;
}

/* Ghost */
.btn--ghost {
  color: #374151;
  background-color: transparent;
  border-color: transparent;
}

.btn--ghost:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.btn--ghost:active:not(:disabled) {
  background-color: #e5e7eb;
}

/* Link */
.btn--link {
  color: #3b82f6;
  background-color: transparent;
  border-color: transparent;
  text-decoration: underline;
  padding: 0;
  height: auto;
}

.btn--link:hover:not(:disabled) {
  color: #2563eb;
  text-decoration: none;
}

/* Text */
.btn--text {
  color: #374151;
  background-color: transparent;
  border-color: transparent;
}

.btn--text:hover:not(:disabled) {
  background-color: #f3f4f6;
}

/* =============================================================================
   LOADING STATE
   ============================================================================= */

.btn__loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.6s linear infinite;
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}

/* Loading Dots */
.btn__dots {
  display: flex;
  gap: 4px;
}

.btn__dot {
  width: 4px;
  height: 4px;
  background-color: currentColor;
  border-radius: 50%;
  animation: btn-dot-bounce 1s infinite ease-in-out;
}

.btn__dot:nth-child(1) { animation-delay: -0.32s; }
.btn__dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes btn-dot-bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* =============================================================================
   ICON STYLES
   ============================================================================= */

.btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn__icon svg {
  width: 1.25em;
  height: 1.25em;
}

.btn--xs .btn__icon svg { width: 1em; height: 1em; }
.btn--xl .btn__icon svg { width: 1.5em; height: 1.5em; }

/* Icon Position */
.btn__icon--left {
  margin-right: -0.25rem;
}

.btn__icon--right {
  margin-left: -0.25rem;
}

/* =============================================================================
   DARK MODE
   ============================================================================= */

.dark .btn--secondary {
  color: #e5e7eb;
  background-color: #374151;
  border-color: #4b5563;
}

.dark .btn--secondary:hover:not(:disabled) {
  background-color: #4b5563;
  border-color: #6b7280;
}

.dark .btn--ghost {
  color: #e5e7eb;
}

.dark .btn--ghost:hover:not(:disabled) {
  background-color: #374151;
}

.dark .btn--text {
  color: #e5e7eb;
}

.dark .btn--text:hover:not(:disabled) {
  background-color: #374151;
}

/* =============================================================================
   BUTTON GROUP
   ============================================================================= */

.btn-group {
  display: inline-flex;
  align-items: center;
}

.btn-group .btn {
  border-radius: 0;
  position: relative;
}

.btn-group .btn:first-child {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.btn-group .btn:last-child {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

.btn-group .btn:not(:last-child) {
  border-right-width: 0;
}

.btn-group .btn:hover:not(:disabled),
.btn-group .btn:focus:not(:disabled) {
  z-index: 1;
}

/* =============================================================================
   ACCESSIBILITY
   ============================================================================= */

@media (prefers-reduced-motion: reduce) {
  .btn,
  .btn__spinner,
  .btn__dot {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .btn {
    border-width: 2px;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'button');
  styleElement.textContent = BUTTON_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

/**
 * Button - Versatile button component with multiple variants and features
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline' | 'ghost' | 'link' | 'text'
 * @param {string} props.size - Button size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} props.loading - Show loading state
 * @param {string} props.loadingText - Text to show when loading
 * @param {React.ReactNode} props.leftIcon - Icon to display on the left
 * @param {React.ReactNode} props.rightIcon - Icon to display on the right
 * @param {boolean} props.disabled - Disable button
 * @param {boolean} props.fullWidth - Make button full width
 * @param {boolean} props.iconOnly - Button contains only an icon
 * @param {string} props.type - Button type: 'button' | 'submit' | 'reset'
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * 
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 */
const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  disabled = false,
  fullWidth = false,
  iconOnly = false,
  type = 'button',
  onClick,
  className = '',
  children,
  ...props
}, ref) => {
  // Inject styles on mount
  useEffect(() => {
    injectStyles();
  }, []);

  // Build CSS classes
  const buttonClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    loading && 'btn--loading',
    disabled && 'btn--disabled',
    fullWidth && 'btn--full-width',
    iconOnly && 'btn--icon-only',
    className,
  ].filter(Boolean).join(' ');

  // Handle click
  const handleClick = (e) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  // Render loading indicator
  const renderLoader = () => (
    <span className="btn__loader">
      <span className="btn__spinner" />
    </span>
  );

  // Render loading dots (alternative)
  const renderLoadingDots = () => (
    <span className="btn__loader">
      <span className="btn__dots">
        <span className="btn__dot" />
        <span className="btn__dot" />
        <span className="btn__dot" />
      </span>
    </span>
  );

  // Render button content
  const renderContent = () => {
    const content = loading && loadingText ? loadingText : children;

    return (
      <>
        {leftIcon && !iconOnly && (
          <span className="btn__icon btn__icon--left">
            {leftIcon}
          </span>
        )}
        
        {iconOnly ? (
          <span className="btn__icon">
            {children}
          </span>
        ) : (
          <span className="btn__content">
            {content}
          </span>
        )}
        
        {rightIcon && !iconOnly && (
          <span className="btn__icon btn__icon--right">
            {rightIcon}
          </span>
        )}
      </>
    );
  };

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && renderLoader()}
      {renderContent()}
    </button>
  );
});

Button.displayName = 'Button';

// =============================================================================
// BUTTON GROUP COMPONENT
// =============================================================================

/**
 * ButtonGroup - Container for grouped buttons
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button components
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * <ButtonGroup>
 *   <Button>First</Button>
 *   <Button>Second</Button>
 *   <Button>Third</Button>
 * </ButtonGroup>
 */
export const ButtonGroup = ({ children, className = '', ...props }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const groupClasses = ['btn-group', className].filter(Boolean).join(' ');

  return (
    <div className={groupClasses} role="group" {...props}>
      {children}
    </div>
  );
};

// =============================================================================
// ICON BUTTON COMPONENT
// =============================================================================

/**
 * IconButton - Button with only an icon
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {string} props.ariaLabel - Accessible label for screen readers
 * 
 * @example
 * <IconButton icon={<TrashIcon />} ariaLabel="Delete" />
 */
export const IconButton = forwardRef(({ 
  icon, 
  ariaLabel,
  children,
  ...props 
}, ref) => {
  return (
    <Button
      ref={ref}
      iconOnly
      aria-label={ariaLabel}
      {...props}
    >
      {icon || children}
    </Button>
  );
});

IconButton.displayName = 'IconButton';

// =============================================================================
// PROP TYPES
// =============================================================================

Button.propTypes = {
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'danger',
    'success',
    'warning',
    'outline',
    'ghost',
    'link',
    'text',
  ]),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  iconOnly: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
};

ButtonGroup.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

IconButton.propTypes = {
  icon: PropTypes.node,
  ariaLabel: PropTypes.string.isRequired,
  children: PropTypes.node,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Button;