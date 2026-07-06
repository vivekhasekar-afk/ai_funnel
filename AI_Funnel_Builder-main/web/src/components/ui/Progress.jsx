// =============================================================================
// AI FUNNEL PLATFORM - Progress Component (Self-Contained)
// =============================================================================
// Progress bar with percentage, steps, colors, and animations
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const PROGRESS_STYLES = `
/* Progress Container */
.progress-container {
  width: 100%;
}

/* Label */
.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.progress-label--sm {
  font-size: 0.813rem;
  margin-bottom: 0.375rem;
}

.progress-label--lg {
  font-size: 1rem;
  margin-bottom: 0.625rem;
}

.progress-percentage {
  font-weight: 600;
  color: #3b82f6;
}

/* Progress Track */
.progress-track {
  position: relative;
  width: 100%;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-track--sm {
  height: 6px;
}

.progress-track--md {
  height: 10px;
}

.progress-track--lg {
  height: 16px;
}

.progress-track--rounded {
  border-radius: 4px;
}

.progress-track--square {
  border-radius: 0;
}

/* Progress Bar */
.progress-bar {
  height: 100%;
  background-color: #3b82f6;
  border-radius: inherit;
  transition: width 0.3s ease-in-out, background-color 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
}

.progress-bar--animated::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: progress-shimmer 1.5s infinite;
}

@keyframes progress-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-bar--striped {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
}

.progress-bar--striped-animated {
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  0% {
    background-position: 1rem 0;
  }
  100% {
    background-position: 0 0;
  }
}

/* Progress Text */
.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
}

.progress-text--outside {
  position: static;
  transform: none;
  color: #374151;
  margin-top: 0.375rem;
  text-align: center;
}

/* Variants */
.progress-bar--primary {
  background-color: #3b82f6;
}

.progress-bar--success {
  background-color: #10b981;
}

.progress-bar--warning {
  background-color: #f59e0b;
}

.progress-bar--danger {
  background-color: #ef4444;
}

.progress-bar--info {
  background-color: #06b6d4;
}

.progress-bar--gradient {
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
}

/* Steps Progress */
.progress-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.progress-steps__line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #e5e7eb;
  transform: translateY(-50%);
  z-index: 0;
}

.progress-steps__line-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease-in-out;
}

.progress-step {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.progress-step__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: #e5e7eb;
  border: 3px solid #ffffff;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-step--active .progress-step__circle {
  background-color: #3b82f6;
  color: #ffffff;
}

.progress-step--completed .progress-step__circle {
  background-color: #10b981;
  color: #ffffff;
}

.progress-step__circle svg {
  width: 16px;
  height: 16px;
}

.progress-step__label {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
  max-width: 100px;
}

.progress-step--active .progress-step__label {
  color: #3b82f6;
  font-weight: 600;
}

.progress-step--completed .progress-step__label {
  color: #10b981;
}

/* Circular Progress */
.progress-circular {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-circular svg {
  transform: rotate(-90deg);
}

.progress-circular__track {
  fill: none;
  stroke: #e5e7eb;
}

.progress-circular__bar {
  fill: none;
  stroke: #3b82f6;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease-in-out;
}

.progress-circular__text {
  position: absolute;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.progress-circular--sm {
  width: 48px;
  height: 48px;
}

.progress-circular--sm .progress-circular__text {
  font-size: 0.875rem;
}

.progress-circular--md {
  width: 80px;
  height: 80px;
}

.progress-circular--lg {
  width: 120px;
  height: 120px;
}

.progress-circular--lg .progress-circular__text {
  font-size: 1.5rem;
}

/* Indeterminate Progress */
.progress-bar--indeterminate {
  animation: progress-indeterminate 1.5s ease-in-out infinite;
  background: linear-gradient(
    90deg,
    transparent,
    #3b82f6,
    transparent
  );
  background-size: 200% 100%;
}

@keyframes progress-indeterminate {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Dark Mode */
.dark .progress-label {
  color: #e5e7eb;
}

.dark .progress-track {
  background-color: #374151;
}

.dark .progress-text--outside {
  color: #e5e7eb;
}

.dark .progress-steps__line {
  background-color: #374151;
}

.dark .progress-step__circle {
  background-color: #374151;
  border-color: #1f2937;
  color: #9ca3af;
}

.dark .progress-step__label {
  color: #9ca3af;
}

.dark .progress-circular__track {
  stroke: #374151;
}

.dark .progress-circular__text {
  color: #e5e7eb;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .progress-bar,
  .progress-steps__line-fill,
  .progress-step__circle,
  .progress-circular__bar {
    transition: none;
  }
  
  .progress-bar--animated::after,
  .progress-bar--striped-animated,
  .progress-bar--indeterminate {
    animation: none;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'progress');
  styleElement.textContent = PROGRESS_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// PROGRESS COMPONENT
// =============================================================================

const Progress = ({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'primary',
  label,
  showPercentage = false,
  showValue = false,
  animated = false,
  striped = false,
  indeterminate = false,
  shape = 'pill',
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const trackClasses = [
    'progress-track',
    `progress-track--${size}`,
    shape === 'rounded' && 'progress-track--rounded',
    shape === 'square' && 'progress-track--square',
  ].filter(Boolean).join(' ');

  const barClasses = [
    'progress-bar',
    `progress-bar--${variant}`,
    animated && 'progress-bar--animated',
    striped && 'progress-bar--striped',
    striped && animated && 'progress-bar--striped-animated',
    indeterminate && 'progress-bar--indeterminate',
  ].filter(Boolean).join(' ');

  const labelClasses = [
    'progress-label',
    `progress-label--${size}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={`progress-container ${className}`} {...props}>
      {(label || showPercentage) && (
        <div className={labelClasses}>
          <span>{label}</span>
          {showPercentage && (
            <span className="progress-percentage">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={trackClasses}>
        <div
          className={barClasses}
          style={{ width: indeterminate ? '100%' : `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        >
          {showValue && size !== 'sm' && (
            <span className="progress-text">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// STEPS PROGRESS COMPONENT
// =============================================================================

export const ProgressSteps = ({
  steps = [],
  currentStep = 0,
  variant = 'primary',
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const progressPercentage = steps.length > 1
    ? (currentStep / (steps.length - 1)) * 100
    : 0;

  return (
    <div className={`progress-steps ${className}`} {...props}>
      <div className="progress-steps__line">
        <div
          className="progress-steps__line-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        
        const stepClasses = [
          'progress-step',
          isActive && 'progress-step--active',
          isCompleted && 'progress-step--completed',
        ].filter(Boolean).join(' ');

        return (
          <div key={index} className={stepClasses}>
            <div className="progress-step__circle">
              {isCompleted ? (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {step.label && (
              <div className="progress-step__label">{step.label}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// CIRCULAR PROGRESS COMPONENT
// =============================================================================

export const ProgressCircular = ({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'primary',
  strokeWidth = 8,
  showValue = true,
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeMap = {
    sm: 48,
    md: 80,
    lg: 120,
  };
  
  const dimension = sizeMap[size];
  const radius = (dimension - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
  };

  return (
    <div className={`progress-circular progress-circular--${size} ${className}`} {...props}>
      <svg width={dimension} height={dimension}>
        <circle
          className="progress-circular__track"
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-circular__bar"
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={colorMap[variant]}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showValue && (
        <div className="progress-circular__text">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

Progress.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info', 'gradient']),
  label: PropTypes.string,
  showPercentage: PropTypes.bool,
  showValue: PropTypes.bool,
  animated: PropTypes.bool,
  striped: PropTypes.bool,
  indeterminate: PropTypes.bool,
  shape: PropTypes.oneOf(['pill', 'rounded', 'square']),
  className: PropTypes.string,
};

ProgressSteps.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
    })
  ).isRequired,
  currentStep: PropTypes.number,
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger']),
  className: PropTypes.string,
};

ProgressCircular.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info']),
  strokeWidth: PropTypes.number,
  showValue: PropTypes.bool,
  className: PropTypes.string,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Progress;