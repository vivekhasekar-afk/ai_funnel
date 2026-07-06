// =============================================================================
// AI FUNNEL PLATFORM - LoadingScreen Component (Self-Contained)
// =============================================================================
// Full-page loading with spinner, logo, progress, and loading messages
// Depends on: Spinner component from UI library
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '../ui';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const LOADING_SCREEN_STYLES = `
/* Loading Screen Container */
.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  overflow: hidden;
}

.loading-screen--blur {
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.9);
}

.loading-screen--overlay {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.loading-screen--gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Animations */
.loading-screen--enter {
  animation: loading-screen-enter 0.3s ease-out;
}

.loading-screen--exit {
  animation: loading-screen-exit 0.3s ease-in forwards;
}

@keyframes loading-screen-enter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes loading-screen-exit {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Content Container */
.loading-screen__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  max-width: 480px;
  padding: 2rem;
  text-align: center;
}

.loading-screen--compact .loading-screen__content {
  gap: 1.5rem;
  padding: 1.5rem;
}

/* Logo */
.loading-screen__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.loading-screen__logo img {
  max-width: 180px;
  height: auto;
  animation: loading-logo-pulse 2s ease-in-out infinite;
}

.loading-screen--compact .loading-screen__logo img {
  max-width: 140px;
}

@keyframes loading-logo-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

/* Spinner Container */
.loading-screen__spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* Custom Spinner */
.loading-screen__spinner-custom {
  width: 64px;
  height: 64px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: loading-spin 0.8s linear infinite;
}

.loading-screen--compact .loading-screen__spinner-custom {
  width: 48px;
  height: 48px;
  border-width: 3px;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dots Spinner */
.loading-screen__dots {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-screen__dot {
  width: 12px;
  height: 12px;
  background-color: #3b82f6;
  border-radius: 50%;
  animation: loading-dot-bounce 1.4s ease-in-out infinite;
}

.loading-screen__dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-screen__dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading-dot-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Pulse Spinner */
.loading-screen__pulse {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #3b82f6;
  animation: loading-pulse 1.5s ease-in-out infinite;
}

@keyframes loading-pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Progress Bar */
.loading-screen__progress {
  width: 100%;
  max-width: 320px;
}

.loading-screen__progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.loading-screen__progress-bar {
  width: 100%;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.loading-screen__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 2px;
  transition: width 0.3s ease-out;
  position: relative;
  overflow: hidden;
}

.loading-screen__progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: loading-progress-shimmer 2s infinite;
}

@keyframes loading-progress-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Indeterminate Progress */
.loading-screen__progress-indeterminate {
  width: 40%;
  animation: loading-progress-indeterminate 1.5s ease-in-out infinite;
}

@keyframes loading-progress-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}

/* Text Content */
.loading-screen__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
  margin: 0;
}

.loading-screen--compact .loading-screen__title {
  font-size: 1.25rem;
}

.loading-screen__message {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

.loading-screen--compact .loading-screen__message {
  font-size: 0.875rem;
}

.loading-screen__tip {
  font-size: 0.875rem;
  color: #9ca3af;
  line-height: 1.5;
  margin: 0;
  font-style: italic;
}

/* Messages List */
.loading-screen__messages {
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-screen__message-item {
  animation: loading-message-fade 0.5s ease-in-out;
}

@keyframes loading-message-fade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Steps Indicator */
.loading-screen__steps {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.loading-screen__step {
  width: 32px;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  transition: all 0.3s ease-in-out;
}

.loading-screen__step--active {
  background-color: #3b82f6;
  width: 48px;
}

.loading-screen__step--complete {
  background-color: #10b981;
}

/* Skeleton Content */
.loading-screen__skeleton {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
  margin-top: 2rem;
}

.loading-screen__skeleton-item {
  height: 16px;
  background: linear-gradient(
    90deg,
    #e5e7eb 0%,
    #f3f4f6 50%,
    #e5e7eb 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  animation: loading-skeleton 1.5s ease-in-out infinite;
}

.loading-screen__skeleton-item:nth-child(1) {
  width: 80%;
}

.loading-screen__skeleton-item:nth-child(2) {
  width: 60%;
}

.loading-screen__skeleton-item:nth-child(3) {
  width: 70%;
}

@keyframes loading-skeleton {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Cancel Button */
.loading-screen__cancel {
  margin-top: 2rem;
}

/* Variant: Overlay */
.loading-screen--overlay .loading-screen__title,
.loading-screen--overlay .loading-screen__message {
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.loading-screen--overlay .loading-screen__tip {
  color: rgba(255, 255, 255, 0.8);
}

.loading-screen--overlay .loading-screen__spinner-custom {
  border-color: rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
}

.loading-screen--overlay .loading-screen__dot {
  background-color: #ffffff;
}

.loading-screen--overlay .loading-screen__progress-bar {
  background-color: rgba(255, 255, 255, 0.2);
}

.loading-screen--overlay .loading-screen__progress-label {
  color: rgba(255, 255, 255, 0.9);
}

/* Variant: Gradient */
.loading-screen--gradient .loading-screen__title,
.loading-screen--gradient .loading-screen__message {
  color: #ffffff;
}

.loading-screen--gradient .loading-screen__tip {
  color: rgba(255, 255, 255, 0.8);
}

.loading-screen--gradient .loading-screen__spinner-custom {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
}

.loading-screen--gradient .loading-screen__dot {
  background-color: #ffffff;
}

.loading-screen--gradient .loading-screen__progress-bar {
  background-color: rgba(255, 255, 255, 0.2);
}

.loading-screen--gradient .loading-screen__progress-fill {
  background: linear-gradient(90deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%);
}

.loading-screen--gradient .loading-screen__progress-label {
  color: rgba(255, 255, 255, 0.9);
}

/* Responsive */
@media (max-width: 640px) {
  .loading-screen__content {
    padding: 1.5rem;
    gap: 1.5rem;
  }
  
  .loading-screen__logo img {
    max-width: 140px;
  }
  
  .loading-screen__title {
    font-size: 1.25rem;
  }
  
  .loading-screen__message {
    font-size: 0.875rem;
  }
  
  .loading-screen__spinner-custom {
    width: 48px;
    height: 48px;
  }
}

/* Dark Mode */
.dark .loading-screen {
  background-color: #111827;
}

.dark .loading-screen--blur {
  background-color: rgba(17, 23, 39, 0.9);
}

.dark .loading-screen__title {
  color: #f3f4f6;
}

.dark .loading-screen__message {
  color: #9ca3af;
}

.dark .loading-screen__tip {
  color: #6b7280;
}

.dark .loading-screen__spinner-custom {
  border-color: #374151;
  border-top-color: #60a5fa;
}

.dark .loading-screen__dot {
  background-color: #60a5fa;
}

.dark .loading-screen__progress-bar {
  background-color: #374151;
}

.dark .loading-screen__progress-label {
  color: #9ca3af;
}

.dark .loading-screen__step {
  background-color: #374151;
}

.dark .loading-screen__step--active {
  background-color: #60a5fa;
}

.dark .loading-screen__skeleton-item {
  background: linear-gradient(
    90deg,
    #374151 0%,
    #4b5563 50%,
    #374151 100%
  );
  background-size: 200% 100%;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .loading-screen,
  .loading-screen__logo img,
  .loading-screen__spinner-custom,
  .loading-screen__dot,
  .loading-screen__pulse,
  .loading-screen__progress-fill::after,
  .loading-screen__progress-indeterminate,
  .loading-screen__message-item,
  .loading-screen__step,
  .loading-screen__skeleton-item {
    animation: none !important;
    transition: none !important;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'loading-screen');
  styleElement.textContent = LOADING_SCREEN_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// LOADING SCREEN COMPONENT
// =============================================================================

const LoadingScreen = ({
  // Visibility
  visible = true,
  
  // Content
  logo,
  title,
  message,
  messages = [],
  tip,
  
  // Spinner
  spinnerType = 'default',
  spinnerSize = 'lg',
  
  // Progress
  showProgress = false,
  progress,
  progressLabel,
  indeterminate = false,
  
  // Steps
  steps,
  currentStep,
  
  // Styling
  variant = 'default',
  compact = false,
  
  // Skeleton
  showSkeleton = false,
  
  // Cancel
  cancelable = false,
  cancelText = 'Cancel',
  onCancel,
  
  // Animation
  animated = true,
  
  // Accessibility
  ariaLabel = 'Loading',
  
  className = '',
  children,
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [isExiting, setIsExiting] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Prevent body scroll when visible
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  // Rotate messages
  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [messages.length]);

  // Handle exit animation
  useEffect(() => {
    if (!visible && animated) {
      setIsExiting(true);
    }
  }, [visible, animated]);

  if (!visible && !isExiting) return null;

  const loadingClasses = [
    'loading-screen',
    `loading-screen--${variant}`,
    compact && 'loading-screen--compact',
    animated && (isExiting ? 'loading-screen--exit' : 'loading-screen--enter'),
    className,
  ].filter(Boolean).join(' ');

  // Render spinner
  const renderSpinner = () => {
    switch (spinnerType) {
      case 'dots':
        return (
          <div className="loading-screen__dots">
            <div className="loading-screen__dot" />
            <div className="loading-screen__dot" />
            <div className="loading-screen__dot" />
          </div>
        );
      
      case 'pulse':
        return <div className="loading-screen__pulse" />;
      
      case 'custom':
        return <div className="loading-screen__spinner-custom" />;
      
      case 'component':
        return <Spinner size={spinnerSize} />;
      
      default:
        return (
          <div className="loading-screen__spinner">
            <div className="loading-screen__spinner-custom" />
          </div>
        );
    }
  };

  // Render progress bar
  const renderProgress = () => {
    if (!showProgress) return null;

    return (
      <div className="loading-screen__progress">
        {progressLabel && (
          <div className="loading-screen__progress-label">
            <span>{progressLabel}</span>
            {progress !== undefined && <span>{progress}%</span>}
          </div>
        )}
        <div className="loading-screen__progress-bar">
          <div
            className={`loading-screen__progress-fill ${
              indeterminate ? 'loading-screen__progress-indeterminate' : ''
            }`}
            style={{
              width: indeterminate ? undefined : `${progress || 0}%`,
            }}
          />
        </div>
      </div>
    );
  };

  // Render steps indicator
  const renderSteps = () => {
    if (!steps?.length) return null;

    return (
      <div className="loading-screen__steps">
        {steps.map((step, index) => {
          const isActive = currentStep === index;
          const isComplete = currentStep > index;
          
          return (
            <div
              key={index}
              className={`loading-screen__step ${
                isActive ? 'loading-screen__step--active' : ''
              } ${isComplete ? 'loading-screen__step--complete' : ''}`}
              title={step}
            />
          );
        })}
      </div>
    );
  };

  // Render skeleton
  const renderSkeleton = () => {
    if (!showSkeleton) return null;

    return (
      <div className="loading-screen__skeleton">
        <div className="loading-screen__skeleton-item" />
        <div className="loading-screen__skeleton-item" />
        <div className="loading-screen__skeleton-item" />
      </div>
    );
  };

  // Current message
  const currentMessage = messages.length > 0
    ? messages[currentMessageIndex]
    : message;

  return (
    <div
      className={loadingClasses}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      {...props}
    >
      <div className="loading-screen__content">
        {/* Logo */}
        {logo && (
          <div className="loading-screen__logo">
            {typeof logo === 'string' ? (
              <img src={logo} alt="Logo" />
            ) : (
              logo
            )}
          </div>
        )}

        {/* Spinner */}
        {renderSpinner()}

        {/* Title */}
        {title && <h2 className="loading-screen__title">{title}</h2>}

        {/* Message */}
        {currentMessage && (
          <div className="loading-screen__messages">
            <p className="loading-screen__message loading-screen__message-item">
              {currentMessage}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        {renderProgress()}

        {/* Steps Indicator */}
        {renderSteps()}

        {/* Tip */}
        {tip && <p className="loading-screen__tip">{tip}</p>}

        {/* Skeleton */}
        {renderSkeleton()}

        {/* Custom Children */}
        {children}

        {/* Cancel Button */}
        {cancelable && (
          <div className="loading-screen__cancel">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn--ghost btn--sm"
            >
              {cancelText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

LoadingScreen.propTypes = {
  visible: PropTypes.bool,
  logo: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  title: PropTypes.node,
  message: PropTypes.node,
  messages: PropTypes.arrayOf(PropTypes.node),
  tip: PropTypes.node,
  spinnerType: PropTypes.oneOf(['default', 'dots', 'pulse', 'custom', 'component']),
  spinnerSize: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  showProgress: PropTypes.bool,
  progress: PropTypes.number,
  progressLabel: PropTypes.string,
  indeterminate: PropTypes.bool,
  steps: PropTypes.arrayOf(PropTypes.string),
  currentStep: PropTypes.number,
  variant: PropTypes.oneOf(['default', 'blur', 'overlay', 'gradient']),
  compact: PropTypes.bool,
  showSkeleton: PropTypes.bool,
  cancelable: PropTypes.bool,
  cancelText: PropTypes.string,
  onCancel: PropTypes.func,
  animated: PropTypes.bool,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default LoadingScreen;
export { LoadingScreen };
