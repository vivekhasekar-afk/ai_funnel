// =============================================================================
// AI FUNNEL PLATFORM - OnboardingLayout Component (Enhanced & Fixed)
// =============================================================================
// Onboarding layout with centered content, progress, skip, animations & UX improvements
// Depends on: Button component from UI library
// All styles included - no external CSS dependencies
// =============================================================================


import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';  // ✅ CRITICAL FIX - ADDED
import { Button } from '../ui';


// =============================================================================
// STYLES INJECTION (ENHANCED UI/UX)
// =============================================================================


const ONBOARDING_LAYOUT_STYLES = `
/* Onboarding Container */
.onboarding-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}


.onboarding-layout--light {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
}


/* ✨ Enhanced: Animated Background Decoration */
.onboarding-layout::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: onboarding-float 20s ease-in-out infinite;
}


.onboarding-layout::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: onboarding-float 15s ease-in-out infinite reverse;
}


@keyframes onboarding-float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, -30px) scale(1.05);
  }
}


/* Header */
.onboarding-header {
  padding: 2rem;
  position: relative;
  z-index: 10;
}


.onboarding-header__inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}


.onboarding-header__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #ffffff;
  transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
}


.onboarding-header__logo:hover {
  opacity: 0.9;
  transform: scale(1.02);
}


.onboarding-layout--light .onboarding-header__logo {
  color: #1e40af;
}


.onboarding-header__logo-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}


.onboarding-header__logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  white-space: nowrap;
}


.onboarding-header__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}


/* ✨ Enhanced: Progress Indicator with Animation */
.onboarding-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
}


.onboarding-progress:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: scale(1.02);
}


.onboarding-layout--light .onboarding-progress {
  background-color: rgba(255, 255, 255, 0.9);
  color: #1e40af;
}


/* Main Content */
.onboarding-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  z-index: 10;
}


.onboarding-main__inner {
  width: 100%;
  max-width: 600px;
  animation: onboarding-content-enter 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}


.onboarding-main--wide .onboarding-main__inner {
  max-width: 800px;
}


.onboarding-main--narrow .onboarding-main__inner {
  max-width: 480px;
}


@keyframes onboarding-content-enter {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


/* ✨ Enhanced: Content Card with Better Shadow & Hover */
.onboarding-card {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}


.onboarding-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.2), 0 15px 25px -8px rgba(0, 0, 0, 0.15);
}


.onboarding-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}


.onboarding-layout--light .onboarding-card::before {
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
}


/* ✨ Enhanced: Icon with Pulse Animation */
.onboarding-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 18px;
  color: #ffffff;
  margin: 0 auto 1.5rem;
  box-shadow: 0 12px 20px -5px rgba(102, 126, 234, 0.5);
  position: relative;
  animation: onboarding-icon-pulse 2s ease-in-out infinite;
}


@keyframes onboarding-icon-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 12px 20px -5px rgba(102, 126, 234, 0.5);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 15px 25px -5px rgba(102, 126, 234, 0.6);
  }
}


.onboarding-layout--light .onboarding-card__icon {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  box-shadow: 0 12px 20px -5px rgba(59, 130, 246, 0.5);
}


.onboarding-card__icon svg {
  width: 36px;
  height: 36px;
}


/* Title */
.onboarding-card__title {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  text-align: center;
  line-height: 1.2;
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.02em;
}


/* Subtitle */
.onboarding-card__subtitle {
  font-size: 1rem;
  color: #6b7280;
  text-align: center;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}


/* Content */
.onboarding-card__content {
  margin-bottom: 2rem;
}


/* ✨ Enhanced: Step Indicator with Smooth Transitions */
.onboarding-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}


.onboarding-steps__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #d1d5db;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}


.onboarding-steps__dot:hover {
  background-color: #9ca3af;
  transform: scale(1.1);
}


.onboarding-steps__dot--active {
  width: 28px;
  border-radius: 5px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
}


.onboarding-layout--light .onboarding-steps__dot--active {
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
}


/* Actions */
.onboarding-card__actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}


.onboarding-card__actions button {
  width: 100%;
}


.onboarding-card__actions--horizontal {
  flex-direction: row;
  justify-content: center;
}


.onboarding-card__actions--horizontal button {
  width: auto;
  min-width: 140px;
}


/* Footer */
.onboarding-footer {
  padding: 2rem;
  text-align: center;
  position: relative;
  z-index: 10;
}


.onboarding-footer__text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}


.onboarding-layout--light .onboarding-footer__text {
  color: #6b7280;
}


.onboarding-footer__link {
  color: #ffffff;
  text-decoration: underline;
  font-weight: 600;
  transition: opacity 0.2s ease-in-out;
}


.onboarding-footer__link:hover {
  opacity: 0.8;
}


.onboarding-layout--light .onboarding-footer__link {
  color: #3b82f6;
}


/* ✨ Enhanced: Progress Bar with Gradient & Shimmer */
.onboarding-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background-color: rgba(255, 255, 255, 0.25);
  z-index: 100;
  overflow: hidden;
}


.onboarding-layout--light .onboarding-progress-bar {
  background-color: rgba(59, 130, 246, 0.25);
}


.onboarding-progress-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #ffffff 0%, rgba(255, 255, 255, 0.9) 100%);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}


.onboarding-layout--light .onboarding-progress-bar__fill {
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}


.onboarding-progress-bar__fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  animation: onboarding-progress-shimmer 2s infinite;
}


@keyframes onboarding-progress-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}


/* ✨ Enhanced: Feature List with Hover Effects */
.onboarding-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem 0;
}


.onboarding-feature {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 10px;
  transition: all 0.3s ease-in-out;
  border: 1px solid transparent;
}


.onboarding-feature:hover {
  background-color: #f3f4f6;
  transform: translateX(6px);
  border-color: #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}


.onboarding-feature__icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 7px;
  color: #ffffff;
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}


.onboarding-layout--light .onboarding-feature__icon {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}


.onboarding-feature__icon svg {
  width: 16px;
  height: 16px;
}


.onboarding-feature__content {
  flex: 1;
}


.onboarding-feature__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}


.onboarding-feature__description {
  font-size: 0.813rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}


/* ✨ Enhanced: Skip Button with Better Styling */
.onboarding-skip {
  color: #ffffff;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  border-radius: 10px;
  transition: all 0.2s ease-in-out;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  background-color: rgba(255, 255, 255, 0.05);
  cursor: pointer;
}


.onboarding-skip:hover {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}


.onboarding-layout--light .onboarding-skip {
  color: #6b7280;
  border-color: #e5e7eb;
  background-color: #ffffff;
}


.onboarding-layout--light .onboarding-skip:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
}


/* Slide Transition */
.onboarding-slide-enter {
  animation: onboarding-slide-enter 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}


.onboarding-slide-exit {
  animation: onboarding-slide-exit 0.3s cubic-bezier(0.4, 0, 1, 1);
}


@keyframes onboarding-slide-enter {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}


@keyframes onboarding-slide-exit {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-30px);
  }
}


/* Responsive */
@media (max-width: 768px) {
  .onboarding-header,
  .onboarding-main,
  .onboarding-footer {
    padding: 1.5rem;
  }
  
  .onboarding-card {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }
  
  .onboarding-card__title {
    font-size: 1.5rem;
  }
  
  .onboarding-card__subtitle {
    font-size: 0.875rem;
  }
  
  .onboarding-card__icon {
    width: 60px;
    height: 60px;
  }
  
  .onboarding-card__icon svg {
    width: 30px;
    height: 30px;
  }
  
  .onboarding-header__actions {
    gap: 0.5rem;
  }
  
  .onboarding-progress {
    font-size: 0.813rem;
    padding: 0.375rem 0.75rem;
  }
  
  .onboarding-skip {
    padding: 0.5rem 1rem;
    font-size: 0.813rem;
  }
}


/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .onboarding-main__inner,
  .onboarding-steps__dot,
  .onboarding-progress-bar__fill,
  .onboarding-feature,
  .onboarding-skip,
  .onboarding-progress-bar__fill::after,
  .onboarding-slide-enter,
  .onboarding-slide-exit,
  .onboarding-float,
  .onboarding-icon-pulse,
  .onboarding-card {
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
  styleElement.setAttribute('data-component', 'onboarding-layout');
  styleElement.textContent = ONBOARDING_LAYOUT_STYLES;
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


// =============================================================================
// ONBOARDING LAYOUT COMPONENT
// =============================================================================


const OnboardingLayout = ({
  // Header
  logo,
  logoText = 'AI Funnel',
  logoUrl = '/',
  
  // Progress
  currentStep = 0,
  totalSteps,
  showProgress = true,
  showProgressBar = true,
  showStepDots = true,
  
  // Skip
  onSkip,
  skipLabel = 'Skip',
  showSkip = true,
  
  // Content
  icon,
  title,
  subtitle,
  children,
  
  // Features
  features = [],
  
  // Actions
  actions,
  actionsLayout = 'vertical',
  
  // Footer
  footerText,
  footerLink,
  footerLinkText,
  
  // Styling
  variant = 'gradient',
  contentWidth = 'default',
  
  // Animation
  animated = true,
  
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);


  const [isTransitioning, setIsTransitioning] = useState(false);


  useEffect(() => {
    if (animated) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, animated]);


  const progressPercentage = totalSteps ? ((currentStep + 1) / totalSteps) * 100 : 0;


  const layoutClasses = [
    'onboarding-layout',
    `onboarding-layout--${variant}`,
    className,
  ].filter(Boolean).join(' ');


  const mainClasses = [
    'onboarding-main',
    `onboarding-main--${contentWidth}`,
  ].filter(Boolean).join(' ');


  const cardClasses = [
    'onboarding-card',
    animated && isTransitioning && 'onboarding-slide-enter',
  ].filter(Boolean).join(' ');


  const actionsClasses = [
    'onboarding-card__actions',
    `onboarding-card__actions--${actionsLayout}`,
  ].filter(Boolean).join(' ');


  return (
    <div className={layoutClasses} {...props}>
      {/* Progress Bar */}
      {showProgressBar && totalSteps > 0 && (
        <div className="onboarding-progress-bar">
          <div
            className="onboarding-progress-bar__fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}


      {/* Header */}
      <header className="onboarding-header">
        <div className="onboarding-header__inner">
          {/* Logo */}
          <a href={logoUrl} className="onboarding-header__logo">
            {logo && (
              typeof logo === 'string' ? (
                <img src={logo} alt={logoText} className="onboarding-header__logo-image" />
              ) : (
                logo
              )
            )}
            <span className="onboarding-header__logo-text">{logoText}</span>
          </a>


          {/* Header Actions */}
          <div className="onboarding-header__actions">
            {/* Progress Indicator */}
            {showProgress && totalSteps > 0 && (
              <div className="onboarding-progress">
                Step {currentStep + 1} of {totalSteps}
              </div>
            )}


            {/* Skip Button */}
            {showSkip && onSkip && (
              <button
                type="button"
                className="onboarding-skip"
                onClick={onSkip}
              >
                {skipLabel}
              </button>
            )}
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className={mainClasses}>
        <div className="onboarding-main__inner">
          <div className={cardClasses}>
            {/* Icon */}
            {icon && (
              <div className="onboarding-card__icon">
                {icon}
              </div>
            )}


            {/* Step Dots */}
            {showStepDots && totalSteps > 0 && (
              <div className="onboarding-steps">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`onboarding-steps__dot ${
                      index === currentStep ? 'onboarding-steps__dot--active' : ''
                    }`}
                  />
                ))}
              </div>
            )}


            {/* Title */}
            {title && (
              <h1 className="onboarding-card__title">{title}</h1>
            )}


            {/* Subtitle */}
            {subtitle && (
              <p className="onboarding-card__subtitle">{subtitle}</p>
            )}


            {/* Features List */}
            {features.length > 0 && (
              <div className="onboarding-features">
                {features.map((feature, index) => (
                  <div key={index} className="onboarding-feature">
                    <div className="onboarding-feature__icon">
                      {feature.icon || <CheckIcon />}
                    </div>
                    <div className="onboarding-feature__content">
                      <h3 className="onboarding-feature__title">{feature.title}</h3>
                      {feature.description && (
                        <p className="onboarding-feature__description">
                          {feature.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}


            {/* Content */}
            <div className="onboarding-card__content">
              {/* ✅ CRITICAL FIX - React Router Outlet for nested routes */}
              <Outlet />
              
              {/* Children for direct usage */}
              {children}
            </div>


            {/* Actions */}
            {actions && (
              <div className={actionsClasses}>
                {actions}
              </div>
            )}
          </div>
        </div>
      </main>


      {/* Footer */}
      {(footerText || footerLink) && (
        <footer className="onboarding-footer">
          <p className="onboarding-footer__text">
            {footerText}{' '}
            {footerLink && (
              <a href={footerLink} className="onboarding-footer__link">
                {footerLinkText || 'Learn more'}
              </a>
            )}
          </p>
        </footer>
      )}
    </div>
  );
};


// =============================================================================
// PROP TYPES
// =============================================================================


OnboardingLayout.propTypes = {
  logo: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  logoText: PropTypes.string,
  logoUrl: PropTypes.string,
  currentStep: PropTypes.number,
  totalSteps: PropTypes.number,
  showProgress: PropTypes.bool,
  showProgressBar: PropTypes.bool,
  showStepDots: PropTypes.bool,
  onSkip: PropTypes.func,
  skipLabel: PropTypes.string,
  showSkip: PropTypes.bool,
  icon: PropTypes.node,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  children: PropTypes.node,
  features: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
    })
  ),
  actions: PropTypes.node,
  actionsLayout: PropTypes.oneOf(['vertical', 'horizontal']),
  footerText: PropTypes.node,
  footerLink: PropTypes.string,
  footerLinkText: PropTypes.string,
  variant: PropTypes.oneOf(['gradient', 'light']),
  contentWidth: PropTypes.oneOf(['narrow', 'default', 'wide']),
  animated: PropTypes.bool,
  className: PropTypes.string,
};


// =============================================================================
// EXPORTS
// =============================================================================


export default OnboardingLayout;
export { OnboardingLayout };
