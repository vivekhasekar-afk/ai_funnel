// =============================================================================
// AI FUNNEL PLATFORM - WizardLayout Component (Enhanced & Fixed)
// =============================================================================
// Wizard layout with stepper, navigation, save draft, validation & UX improvements
// ✅ FIXED: steps prop now optional with proper defaults
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';
import { Button } from '../ui';

// =============================================================================
// STYLES INJECTION (ENHANCED UI/UX)
// =============================================================================

const WIZARD_LAYOUT_STYLES = `
/* Wizard Container */
.wizard-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f9fafb;
}

.wizard-layout--dark {
  background-color: #0f172a;
}

/* ✨ Enhanced: Wizard Header with Shadow on Scroll */
.wizard-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: box-shadow 0.3s ease-in-out;
}

.wizard-header--scrolled {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.wizard-layout--dark .wizard-header {
  background-color: #1e293b;
  border-bottom-color: #334155;
}

.wizard-header__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.wizard-header__title-section {
  flex: 1;
  min-width: 0;
}

.wizard-header__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.wizard-layout--dark .wizard-header__title {
  color: #f1f5f9;
}

.wizard-header__subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.wizard-layout--dark .wizard-header__subtitle {
  color: #94a3b8;
}

.wizard-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* ✨ Enhanced: Stepper with Smooth Scrolling */
.wizard-stepper {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f3f4f6;
  scroll-behavior: smooth;
}

.wizard-stepper::-webkit-scrollbar {
  height: 6px;
}

.wizard-stepper::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.wizard-stepper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.wizard-stepper::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.wizard-layout--dark .wizard-stepper {
  background-color: #1e293b;
  border-bottom-color: #334155;
}

.wizard-stepper__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 2rem 0;
}

.wizard-stepper__list {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  list-style: none;
  padding: 0;
  margin: 0;
  position: relative;
}

/* ✨ Enhanced: Animated Progress Line */
.wizard-stepper__list::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #e5e7eb;
  z-index: 0;
  border-radius: 2px;
}

.wizard-layout--dark .wizard-stepper__list::before {
  background-color: #334155;
}

/* ✨ Enhanced: Completed Progress Line Overlay */
.wizard-stepper__list::after {
  content: '';
  position: absolute;
  top: 20px;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
  z-index: 0;
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

/* Step Item */
.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  z-index: 1;
}

.wizard-step__button {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 100%;
  transition: transform 0.2s ease-in-out;
}

.wizard-step__button:not(:disabled):hover {
  transform: scale(1.05);
}

.wizard-step--disabled .wizard-step__button {
  cursor: not-allowed;
  opacity: 0.5;
}

/* ✨ Enhanced: Step Indicator with Better Animation */
.wizard-step__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #ffffff;
  border: 3px solid #e5e7eb;
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 0.75rem;
  position: relative;
}

.wizard-layout--dark .wizard-step__indicator {
  background-color: #1e293b;
  border-color: #334155;
  color: #64748b;
}

.wizard-step--completed .wizard-step__indicator {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #10b981;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  animation: wizard-step-complete 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes wizard-step-complete {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.wizard-step--current .wizard-step__indicator {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
  color: #ffffff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15), 0 4px 12px rgba(59, 130, 246, 0.4);
  animation: wizard-step-pulse 2s ease-in-out infinite;
}

@keyframes wizard-step-pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15), 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.2), 0 6px 16px rgba(59, 130, 246, 0.5);
  }
}

.wizard-step--error .wizard-step__indicator {
  background-color: #fee2e2;
  border-color: #ef4444;
  color: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  animation: wizard-step-shake 0.5s ease-in-out;
}

@keyframes wizard-step-shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.wizard-layout--dark .wizard-step--error .wizard-step__indicator {
  background-color: #7f1d1d;
  border-color: #ef4444;
  color: #fca5a5;
}

.wizard-step__indicator svg {
  width: 22px;
  height: 22px;
}

.wizard-step__content {
  text-align: center;
  padding-bottom: 1.5rem;
}

.wizard-step__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
  transition: color 0.3s ease-in-out;
}

.wizard-layout--dark .wizard-step__label {
  color: #94a3b8;
}

.wizard-step--completed .wizard-step__label,
.wizard-step--current .wizard-step__label {
  color: #111827;
  font-weight: 700;
}

.wizard-layout--dark .wizard-step--completed .wizard-step__label,
.wizard-layout--dark .wizard-step--current .wizard-step__label {
  color: #f1f5f9;
}

.wizard-step__description {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
  line-height: 1.4;
}

.wizard-layout--dark .wizard-step__description {
  color: #64748b;
}

/* ✨ Enhanced: Progress Bar with Gradient & Shadow */
.wizard-progress {
  height: 5px;
  background-color: #e5e7eb;
  position: relative;
  overflow: hidden;
}

.wizard-layout--dark .wizard-progress {
  background-color: #334155;
}

.wizard-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%);
  background-size: 200% 100%;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  animation: wizard-progress-gradient 3s ease-in-out infinite;
}

@keyframes wizard-progress-gradient {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.wizard-progress__fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: wizard-progress-shimmer 2s infinite;
}

@keyframes wizard-progress-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Main Content */
.wizard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.wizard-main__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
  flex: 1;
}

.wizard-main--narrow .wizard-main__inner {
  max-width: 800px;
}

/* ✨ Enhanced: Content Area with Better Shadow */
.wizard-content {
  background-color: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 2.5rem;
  min-height: 400px;
  animation: wizard-content-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s ease-in-out;
}

.wizard-content:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.wizard-layout--dark .wizard-content {
  background-color: #1e293b;
  border-color: #334155;
}

@keyframes wizard-content-enter {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wizard-content__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.wizard-layout--dark .wizard-content__title {
  color: #f1f5f9;
}

.wizard-content__description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.wizard-layout--dark .wizard-content__description {
  color: #94a3b8;
}

/* Footer */
.wizard-footer {
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  position: sticky;
  bottom: 0;
  z-index: 100;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
}

.wizard-layout--dark .wizard-footer {
  background-color: #1e293b;
  border-top-color: #334155;
}

.wizard-footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.wizard-footer__left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.wizard-footer__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Step Info */
.wizard-footer__info {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.wizard-layout--dark .wizard-footer__info {
  color: #94a3b8;
}

.wizard-footer__info strong {
  color: #111827;
  font-weight: 700;
}

.wizard-layout--dark .wizard-footer__info strong {
  color: #f1f5f9;
}

/* ✨ Enhanced: Save Indicator with Better Styling */
.wizard-save-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  padding: 0.5rem 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-weight: 500;
  transition: all 0.3s ease-in-out;
}

.wizard-layout--dark .wizard-save-indicator {
  background-color: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}

.wizard-save-indicator--saving {
  color: #3b82f6;
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.wizard-layout--dark .wizard-save-indicator--saving {
  color: #60a5fa;
  border-color: #60a5fa;
  background-color: #1e3a8a;
}

.wizard-save-indicator--saved {
  color: #10b981;
  border-color: #10b981;
  background-color: #f0fdf4;
  animation: wizard-save-success 0.5s ease-in-out;
}

@keyframes wizard-save-success {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.wizard-layout--dark .wizard-save-indicator--saved {
  color: #34d399;
  border-color: #34d399;
  background-color: #064e3b;
}

.wizard-save-indicator--error {
  color: #ef4444;
  border-color: #ef4444;
  background-color: #fef2f2;
}

.wizard-layout--dark .wizard-save-indicator--error {
  color: #f87171;
  border-color: #f87171;
  background-color: #7f1d1d;
}

.wizard-save-indicator__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.wizard-save-indicator__icon svg {
  width: 18px;
  height: 18px;
}

.wizard-save-indicator__spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: wizard-spin 0.6s linear infinite;
}

@keyframes wizard-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ✨ Enhanced: Validation Alert with Better Design */
.wizard-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background-color: #fef3c7;
  border: 1.5px solid #fde68a;
  border-left-width: 4px;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  animation: wizard-alert-enter 0.3s ease-out;
}

@keyframes wizard-alert-enter {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wizard-alert--error {
  background-color: #fee2e2;
  border-color: #fecaca;
  border-left-color: #ef4444;
}

.wizard-alert__icon {
  flex-shrink: 0;
  color: #f59e0b;
}

.wizard-alert--error .wizard-alert__icon {
  color: #ef4444;
}

.wizard-alert__icon svg {
  width: 22px;
  height: 22px;
}

.wizard-alert__content {
  flex: 1;
}

.wizard-alert__title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #92400e;
  margin: 0 0 0.5rem 0;
}

.wizard-alert--error .wizard-alert__title {
  color: #991b1b;
}

.wizard-alert__message {
  font-size: 0.813rem;
  color: #78350f;
  margin: 0;
  list-style: disc;
  padding-left: 1.25rem;
}

.wizard-alert__message li {
  margin: 0.25rem 0;
}

.wizard-alert--error .wizard-alert__message {
  color: #7f1d1d;
}

/* Responsive */
@media (max-width: 768px) {
  .wizard-header__inner,
  .wizard-stepper__inner,
  .wizard-main__inner,
  .wizard-footer__inner {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  
  .wizard-content {
    padding: 2rem 1.5rem;
    border-radius: 12px;
  }
  
  .wizard-stepper__list {
    justify-content: flex-start;
    gap: 1rem;
  }
  
  .wizard-step {
    flex: 0 0 auto;
    min-width: 80px;
  }
  
  .wizard-step__indicator {
    width: 40px;
    height: 40px;
  }
  
  .wizard-step__description {
    display: none;
  }
  
  .wizard-footer__inner {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .wizard-footer__left,
  .wizard-footer__right {
    width: 100%;
    justify-content: space-between;
  }
  
  .wizard-footer__right {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .wizard-footer__right button {
    width: 100%;
  }
  
  .wizard-header__actions {
    display: none;
  }
  
  .wizard-save-indicator {
    font-size: 0.813rem;
    padding: 0.5rem 0.75rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .wizard-step__indicator,
  .wizard-step__label,
  .wizard-step__button,
  .wizard-progress__fill,
  .wizard-content,
  .wizard-progress__fill::after,
  .wizard-save-indicator__spinner,
  .wizard-step-complete,
  .wizard-step-pulse,
  .wizard-step-shake,
  .wizard-progress-gradient,
  .wizard-progress-shimmer,
  .wizard-save-success,
  .wizard-alert-enter {
    transition: none !important;
    animation: none !important;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'wizard-layout');
  styleElement.textContent = WIZARD_LAYOUT_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const CheckIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const AlertIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CloudIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

// =============================================================================
// WIZARD LAYOUT COMPONENT
// =============================================================================

const WizardLayout = ({
  // Steps
  steps = [], // ✅ DEFAULT: empty array
  currentStep = 0,
  onStepChange,
  
  // Content
  title = 'Wizard', // ✅ DEFAULT: fallback title
  subtitle,
  children,
  
  // Navigation
  onBack,
  onNext,
  onComplete,
  backLabel = 'Back',
  nextLabel = 'Next',
  completeLabel = 'Complete',
  
  // Save
  onSave,
  saveLabel = 'Save Draft',
  autoSave = false,
  saveStatus,
  
  // Validation
  validationErrors = [],
  canGoNext = true,
  canGoBack = true,
  
  // Actions
  headerActions,
  
  // Styling
  variant = 'light',
  contentWidth = 'default',
  
  // Exit
  onExit,
  exitLabel = 'Exit',
  
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [localSaveStatus, setLocalSaveStatus] = useState('idle');
  const [scrolled, setScrolled] = useState(false);

  // ✅ GUARD: Ensure steps is always an array
  const safeSteps = Array.isArray(steps) ? steps : [];
  const hasSteps = safeSteps.length > 0;

  // ✨ Enhanced: Scroll detection for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onSave) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [children, autoSave, onSave]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setLocalSaveStatus('saving');
    try {
      await onSave();
      setLocalSaveStatus('saved');
      setTimeout(() => setLocalSaveStatus('idle'), 2000);
    } catch (error) {
      setLocalSaveStatus('error');
      setTimeout(() => setLocalSaveStatus('idle'), 3000);
    }
  }, [onSave]);

  const handleStepClick = (stepIndex) => {
    if (!hasSteps) return; // ✅ GUARD: No steps available
    if (stepIndex === currentStep) return;
    if (stepIndex > currentStep && !safeSteps[stepIndex]?.unlocked) return;
    onStepChange?.(stepIndex);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      onBack?.();
      onStepChange?.(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!hasSteps) {
      onComplete?.();
      return;
    }
    
    if (currentStep < safeSteps.length - 1) {
      onNext?.();
      onStepChange?.(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  // ✅ GUARD: Safe calculations
  const isLastStep = hasSteps ? currentStep === safeSteps.length - 1 : true;
  const progressPercentage = hasSteps ? ((currentStep + 1) / safeSteps.length) * 100 : 100;
  const currentStepData = hasSteps ? safeSteps[currentStep] : null;

  const layoutClasses = [
    'wizard-layout',
    `wizard-layout--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  const headerClasses = [
    'wizard-header',
    scrolled && 'wizard-header--scrolled',
  ].filter(Boolean).join(' ');

  const mainClasses = [
    'wizard-main',
    contentWidth === 'narrow' && 'wizard-main--narrow',
  ].filter(Boolean).join(' ');

  const actualSaveStatus = saveStatus || localSaveStatus;

  return (
    <div className={layoutClasses} {...props}>
      {/* Header */}
      <div className={headerClasses}>
        <div className="wizard-header__inner">
          <div className="wizard-header__title-section">
            <h1 className="wizard-header__title">{title}</h1>
            {subtitle && <p className="wizard-header__subtitle">{subtitle}</p>}
          </div>
          <div className="wizard-header__actions">
            {headerActions}
            {onExit && (
              <Button variant="ghost" size="sm" onClick={onExit}>
                {exitLabel}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stepper - Only render if steps exist */}
      {hasSteps && (
        <div className="wizard-stepper">
          <div className="wizard-stepper__inner">
            <ol className="wizard-stepper__list">
              {safeSteps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isDisabled = index > currentStep && !step.unlocked;
                const hasError = step.error || (isCurrent && validationErrors.length > 0);

                const stepClasses = [
                  'wizard-step',
                  isCompleted && 'wizard-step--completed',
                  isCurrent && 'wizard-step--current',
                  isDisabled && 'wizard-step--disabled',
                  hasError && 'wizard-step--error',
                ].filter(Boolean).join(' ');

                return (
                  <li key={step.id || index} className={stepClasses}>
                    <button
                      type="button"
                      className="wizard-step__button"
                      onClick={() => handleStepClick(index)}
                      disabled={isDisabled}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      <div className="wizard-step__indicator">
                        {isCompleted ? (
                          <CheckIcon />
                        ) : hasError ? (
                          <AlertIcon />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div className="wizard-step__content">
                        <p className="wizard-step__label">{step.label}</p>
                        {step.description && (
                          <p className="wizard-step__description">{step.description}</p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          
          {/* Progress Bar */}
          <div className="wizard-progress">
            <div
              className="wizard-progress__fill"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={mainClasses}>
        <div className="wizard-main__inner">
          <div className="wizard-content">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="wizard-alert wizard-alert--error" role="alert">
                <div className="wizard-alert__icon" aria-hidden="true">
                  <AlertIcon />
                </div>
                <div className="wizard-alert__content">
                  <p className="wizard-alert__title">Please fix the following errors:</p>
                  <ul className="wizard-alert__message">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Step Content */}
            {currentStepData?.title && (
              <h2 className="wizard-content__title">{currentStepData.title}</h2>
            )}
            {currentStepData?.description && (
              <p className="wizard-content__description">{currentStepData.description}</p>
            )}
            
            {/* ✅ React Router Outlet for nested routes */}
            <Outlet />
            
            {/* Keep children for backward compatibility */}
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="wizard-footer">
        <div className="wizard-footer__inner">
          <div className="wizard-footer__left">
            {/* Step Info - Only show if steps exist */}
            {hasSteps && (
              <div className="wizard-footer__info">
                Step <strong>{currentStep + 1}</strong> of <strong>{safeSteps.length}</strong>
              </div>
            )}

            {/* Save Indicator */}
            {(onSave || autoSave) && (
              <div className={`wizard-save-indicator wizard-save-indicator--${actualSaveStatus}`}>
                <div className="wizard-save-indicator__icon" aria-hidden="true">
                  {actualSaveStatus === 'saving' ? (
                    <div className="wizard-save-indicator__spinner" />
                  ) : actualSaveStatus === 'saved' ? (
                    <CheckIcon />
                  ) : actualSaveStatus === 'error' ? (
                    <AlertIcon />
                  ) : (
                    <CloudIcon />
                  )}
                </div>
                <span>
                  {actualSaveStatus === 'saving'
                    ? 'Saving...'
                    : actualSaveStatus === 'saved'
                    ? 'Saved'
                    : actualSaveStatus === 'error'
                    ? 'Save failed'
                    : autoSave
                    ? 'Auto-saving'
                    : 'Not saved'}
                </span>
              </div>
            )}
          </div>

          <div className="wizard-footer__right">
            {/* Back Button */}
            {currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={!canGoBack}
              >
                {backLabel}
              </Button>
            )}

            {/* Save Draft Button */}
            {onSave && !autoSave && (
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={actualSaveStatus === 'saving'}
                loading={actualSaveStatus === 'saving'}
              >
                {saveLabel}
              </Button>
            )}

            {/* Next/Complete Button */}
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canGoNext}
            >
              {isLastStep ? completeLabel : nextLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// PROP TYPES (✅ FIXED: steps is now optional)
// =============================================================================

WizardLayout.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      title: PropTypes.string,
      unlocked: PropTypes.bool,
      error: PropTypes.bool,
    })
  ), // ✅ REMOVED .isRequired
  currentStep: PropTypes.number,
  onStepChange: PropTypes.func,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  onBack: PropTypes.func,
  onNext: PropTypes.func,
  onComplete: PropTypes.func,
  backLabel: PropTypes.string,
  nextLabel: PropTypes.string,
  completeLabel: PropTypes.string,
  onSave: PropTypes.func,
  saveLabel: PropTypes.string,
  autoSave: PropTypes.bool,
  saveStatus: PropTypes.oneOf(['idle', 'saving', 'saved', 'error']),
  validationErrors: PropTypes.arrayOf(PropTypes.string),
  canGoNext: PropTypes.bool,
  canGoBack: PropTypes.bool,
  headerActions: PropTypes.node,
  variant: PropTypes.oneOf(['light', 'dark']),
  contentWidth: PropTypes.oneOf(['default', 'narrow']),
  onExit: PropTypes.func,
  exitLabel: PropTypes.string,
  className: PropTypes.string,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default WizardLayout;
export { WizardLayout };
