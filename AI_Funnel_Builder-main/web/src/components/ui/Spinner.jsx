// =============================================================================
// AI FUNNEL PLATFORM - Spinner Component
// =============================================================================
// Loading spinner with multiple sizes, variants, and colors
// No dependencies - primitive component with internal styles
// =============================================================================

import React from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// INTERNAL STYLES
// =============================================================================

const styles = `
/* =============================================================================
   SPINNER COMPONENT STYLES
   ============================================================================= */

/* Base Spinner */
.spinner {
  --spinner-thickness: 2px;
  --spinner-speed: 0.8s;
  
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* Hide accessible label visually but keep for screen readers */
.spinner__label {
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

/* =============================================================================
   SIZES
   ============================================================================= */

.spinner--xs {
  width: 16px;
  height: 16px;
}

.spinner--sm {
  width: 24px;
  height: 24px;
}

.spinner--md {
  width: 40px;
  height: 40px;
}

.spinner--lg {
  width: 56px;
  height: 56px;
}

.spinner--xl {
  width: 72px;
  height: 72px;
}

/* =============================================================================
   COLORS
   ============================================================================= */

.spinner--primary {
  --spinner-color: #3b82f6;
}

.spinner--secondary {
  --spinner-color: #10b981;
}

.spinner--white {
  --spinner-color: #ffffff;
}

.spinner--gray {
  --spinner-color: #6b7280;
}

.spinner--success {
  --spinner-color: #10b981;
}

.spinner--warning {
  --spinner-color: #f59e0b;
}

.spinner--error {
  --spinner-color: #ef4444;
}

/* =============================================================================
   VARIANT: SPINNER (Default)
   ============================================================================= */

.spinner__circle {
  width: 100%;
  height: 100%;
  animation: spinner-rotate var(--spinner-speed) linear infinite;
}

.spinner__svg {
  width: 100%;
  height: 100%;
}

.spinner__path {
  stroke: var(--spinner-color);
  stroke-linecap: round;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  animation: spinner-dash 1.5s ease-in-out infinite;
}

@keyframes spinner-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spinner-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* =============================================================================
   VARIANT: DOTS
   ============================================================================= */

.spinner__dots {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.spinner__dot {
  width: 25%;
  height: 25%;
  background-color: var(--spinner-color);
  border-radius: 50%;
  animation: spinner-bounce var(--spinner-speed) infinite ease-in-out both;
}

.spinner__dot:nth-child(1) {
  animation-delay: -0.32s;
}

.spinner__dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes spinner-bounce {
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
   VARIANT: PULSE
   ============================================================================= */

.spinner__pulse {
  position: relative;
  width: 100%;
  height: 100%;
}

.spinner__pulse-ring {
  position: absolute;
  inset: 0;
  border: var(--spinner-thickness) solid var(--spinner-color);
  border-radius: 50%;
  animation: spinner-pulse 1.2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
}

.spinner__pulse-ring:nth-child(2) {
  animation-delay: -0.6s;
}

@keyframes spinner-pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

/* =============================================================================
   VARIANT: RING
   ============================================================================= */

.spinner__ring-container {
  width: 100%;
  height: 100%;
}

.spinner__ring {
  width: 100%;
  height: 100%;
  border: var(--spinner-thickness) solid rgba(59, 130, 246, 0.2);
  border-top-color: var(--spinner-color);
  border-radius: 50%;
  animation: spinner-rotate var(--spinner-speed) linear infinite;
}

/* =============================================================================
   FULL SCREEN OVERLAY
   ============================================================================= */

.spinner--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner--fullscreen .spinner__circle,
.spinner--fullscreen .spinner__dots,
.spinner--fullscreen .spinner__pulse,
.spinner--fullscreen .spinner__ring-container {
  width: 64px;
  height: 64px;
}

/* =============================================================================
   DARK MODE
   ============================================================================= */

.dark .spinner--gray {
  --spinner-color: #9ca3af;
}

.dark .spinner--fullscreen {
  background-color: rgba(0, 0, 0, 0.7);
}

/* =============================================================================
   REDUCED MOTION
   ============================================================================= */

@media (prefers-reduced-motion: reduce) {
  .spinner__circle,
  .spinner__dot,
  .spinner__pulse-ring,
  .spinner__ring {
    animation-duration: 2s;
  }
}
`;

// =============================================================================
// SPINNER COMPONENT
// =============================================================================

/**
 * Spinner - Loading indicator component
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size variant: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} props.variant - Style variant: 'spinner' | 'dots' | 'pulse' | 'ring'
 * @param {string} props.color - Color: 'primary' | 'secondary' | 'white' | 'gray' | 'success' | 'warning' | 'error'
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.label - Accessible label for screen readers
 * @param {boolean} props.fullScreen - Display as full-screen overlay
 * @param {number} props.thickness - Border thickness (1-8)
 * @param {number} props.speed - Animation speed in seconds
 * 
 * @example
 * <Spinner size="md" variant="spinner" color="primary" />
 * <Spinner variant="dots" color="success" />
 * <Spinner fullScreen variant="pulse" />
 */
const Spinner = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  className = '',
  label = 'Loading...',
  fullScreen = false,
  thickness = 2,
  speed = 0.8,
  ...props
}) => {
  // Build CSS classes
  const spinnerClasses = [
    'spinner',
    `spinner--${size}`,
    `spinner--${variant}`,
    `spinner--${color}`,
    fullScreen && 'spinner--fullscreen',
    className,
  ].filter(Boolean).join(' ');

  // Inline styles for customization
  const spinnerStyle = {
    '--spinner-thickness': `${thickness}px`,
    '--spinner-speed': `${speed}s`,
  };

  // Render different spinner variants
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="spinner__dots">
            <div className="spinner__dot" />
            <div className="spinner__dot" />
            <div className="spinner__dot" />
          </div>
        );

      case 'pulse':
        return (
          <div className="spinner__pulse">
            <div className="spinner__pulse-ring" />
            <div className="spinner__pulse-ring" />
          </div>
        );

      case 'ring':
        return (
          <div className="spinner__ring-container">
            <div className="spinner__ring" />
          </div>
        );

      case 'spinner':
      default:
        return (
          <div className="spinner__circle">
            <svg className="spinner__svg" viewBox="0 0 50 50">
              <circle
                className="spinner__path"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth={thickness}
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <>
      {/* Inject styles only once */}
      <style>{styles}</style>

      <div
        className={spinnerClasses}
        style={spinnerStyle}
        role="status"
        aria-live="polite"
        aria-label={label}
        {...props}
      >
        {renderSpinner()}
        <span className="spinner__label">{label}</span>
      </div>
    </>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

Spinner.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  variant: PropTypes.oneOf(['spinner', 'dots', 'pulse', 'ring']),
  color: PropTypes.oneOf(['primary', 'secondary', 'white', 'gray', 'success', 'warning', 'error']),
  className: PropTypes.string,
  label: PropTypes.string,
  fullScreen: PropTypes.bool,
  thickness: PropTypes.number,
  speed: PropTypes.number,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Spinner;

// Named exports for convenience
export { Spinner };
