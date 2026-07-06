// =============================================================================
// AI FUNNEL PLATFORM - OnboardingRoute Component (Enhanced Production)
// =============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation, useNavigate, Outlet  } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUser, updateUserPreferences } from '@/lib/api/users.api';

// =============================================================================
// CONSTANTS
// =============================================================================

const ONBOARDING_STEPS = {
  WELCOME: 'welcome',
  PROFILE: 'profile',
  PREFERENCES: 'preferences',
  FIRST_PROJECT: 'first_project',
  TUTORIAL: 'tutorial',
  COMPLETE: 'complete',
};

const ONBOARDING_ROUTES = {
  BASE: '/onboarding',
  WELCOME: '/onboarding/welcome',
  PROFILE: '/onboarding/profile',
  PREFERENCES: '/onboarding/preferences',
  FIRST_PROJECT: '/onboarding/first-project',
  TUTORIAL: '/onboarding/tutorial',
};

const STORAGE_KEYS = {
  ONBOARDING_PROGRESS: 'onboarding_progress',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  ONBOARDING_STARTED: 'onboarding_started',
};

const SKIP_ONBOARDING_ROLES = ['admin', 'manager'];
const ONBOARDING_EXPIRY_DAYS = 30;

// =============================================================================
// STYLED COMPONENTS
// =============================================================================

const ONBOARDING_STYLES = `
.onboarding-guard-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 99999;
  gap: 2rem;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
  to { opacity: 1; }
}

.onboarding-guard-loader__content {
  text-align: center;
  max-width: 500px;
  padding: 0 2rem;
}

.onboarding-guard-loader__icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  backdrop-filter: blur(10px);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.onboarding-guard-loader__icon svg {
  width: 56px;
  height: 56px;
  color: #ffffff;
}

.onboarding-guard-loader__title {
  font-size: 2rem;
  font-weight: 900;
  color: #ffffff;
  margin: 0 0 1rem 0;
  letter-spacing: -0.02em;
}

.onboarding-guard-loader__text {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.onboarding-guard-loader__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.onboarding-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  z-index: 100000;
  overflow: hidden;
}

.onboarding-progress-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
}

.onboarding-skip-banner {
  position: fixed;
  bottom: 20px;
  right: 20px;
  left: 20px;
  max-width: 450px;
  margin: 0 auto;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 100001;
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.onboarding-skip-banner__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.onboarding-skip-banner__title {
  font-size: 1.125rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.onboarding-skip-banner__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.onboarding-skip-banner__close:hover {
  background: #e5e7eb;
}

.onboarding-skip-banner__close svg {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.onboarding-skip-banner__message {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.onboarding-skip-banner__actions {
  display: flex;
  gap: 0.75rem;
}

.onboarding-skip-banner__button {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.onboarding-skip-banner__button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.onboarding-skip-banner__button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.onboarding-skip-banner__button--secondary {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.onboarding-skip-banner__button--secondary:hover {
  background: #e5e7eb;
}

.onboarding-welcome-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 100002;
  padding: 2rem;
  animation: fadeIn 0.3s ease;
}

.onboarding-welcome-modal__content {
  max-width: 600px;
  width: 100%;
  background: #ffffff;
  border-radius: 24px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.3);
  animation: scaleIn 0.4s ease;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.onboarding-welcome-modal__icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
}

.onboarding-welcome-modal__icon svg {
  width: 64px;
  height: 64px;
  color: #ffffff;
}

.onboarding-welcome-modal__title {
  font-size: 2.5rem;
  font-weight: 900;
  color: #111827;
  margin: 0 0 1rem 0;
  letter-spacing: -0.03em;
}

.onboarding-welcome-modal__message {
  font-size: 1.25rem;
  color: #6b7280;
  margin: 0 0 2.5rem 0;
  line-height: 1.6;
}

.onboarding-welcome-modal__actions {
  display: flex;
  gap: 1rem;
}

.onboarding-welcome-modal__button {
  flex: 1;
  padding: 1.125rem 2rem;
  border: none;
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.onboarding-welcome-modal__button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.onboarding-welcome-modal__button--primary:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(102, 126, 234, 0.5);
}

.onboarding-welcome-modal__button--secondary {
  background: transparent;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}

.onboarding-welcome-modal__button--secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

@media (max-width: 768px) {
  .onboarding-skip-banner {
    left: 10px;
    right: 10px;
    bottom: 10px;
  }

  .onboarding-skip-banner__actions,
  .onboarding-welcome-modal__actions {
    flex-direction: column;
  }

  .onboarding-welcome-modal__content {
    padding: 2rem 1.5rem;
  }

  .onboarding-welcome-modal__title {
    font-size: 1.75rem;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'onboarding-route');
  styleElement.textContent = ONBOARDING_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if user has completed onboarding
 */
const hasCompletedOnboarding = (user) => {
  if (!user) return false;
  
  return (
    user.onboarding_completed ||
    user.onboardingCompleted ||
    user.is_onboarded ||
    user.isOnboarded ||
    false
  );
};

/**
 * Check if user should skip onboarding
 */
const shouldSkipOnboarding = (user) => {
  if (!user) return false;
  
  const userRole = (user.role || user.user_type || user.userType || '').toLowerCase();
  return SKIP_ONBOARDING_ROLES.includes(userRole);
};

/**
 * Get onboarding progress
 */
const getOnboardingProgress = (user) => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
    if (stored) {
      return JSON.parse(stored);
    }
    
    return {
      currentStep: user?.onboarding_step || user?.onboardingStep || ONBOARDING_STEPS.WELCOME,
      completedSteps: user?.completed_onboarding_steps || user?.completedOnboardingSteps || [],
      startedAt: user?.onboarding_started_at || user?.onboardingStartedAt || null,
    };
  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    return {
      currentStep: ONBOARDING_STEPS.WELCOME,
      completedSteps: [],
      startedAt: null,
    };
  }
};

/**
 * Store onboarding progress
 */
const storeOnboardingProgress = (progress) => {
  try {
    sessionStorage.setItem(STORAGE_KEYS.ONBOARDING_PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Error storing onboarding progress:', error);
  }
};

/**
 * Check if onboarding is expired
 */
const isOnboardingExpired = (startedAt) => {
  if (!startedAt) return false;
  
  const startDate = new Date(startedAt);
  const now = new Date();
  const daysPassed = (now - startDate) / (1000 * 60 * 60 * 24);
  
  return daysPassed > ONBOARDING_EXPIRY_DAYS;
};

/**
 * Calculate onboarding completion percentage
 */
const calculateProgress = (completedSteps) => {
  const totalSteps = Object.keys(ONBOARDING_STEPS).length - 1; // Exclude COMPLETE
  return Math.round((completedSteps.length / totalSteps) * 100);
};

/**
 * Get next onboarding route
 */
const getNextOnboardingRoute = (currentStep, completedSteps) => {
  const stepOrder = [
    ONBOARDING_STEPS.WELCOME,
    ONBOARDING_STEPS.PROFILE,
    ONBOARDING_STEPS.PREFERENCES,
    ONBOARDING_STEPS.FIRST_PROJECT,
    ONBOARDING_STEPS.TUTORIAL,
  ];

  const currentIndex = stepOrder.indexOf(currentStep);
  
  for (let i = currentIndex + 1; i < stepOrder.length; i++) {
    if (!completedSteps.includes(stepOrder[i])) {
      return ONBOARDING_ROUTES[stepOrder[i].toUpperCase()];
    }
  }
  
  return ONBOARDING_ROUTES.WELCOME;
};

/**
 * Check if current path is onboarding route
 */
const isOnboardingRoute = (pathname) => {
  return pathname.startsWith(ONBOARDING_ROUTES.BASE);
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const LoadingScreen = () => {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="onboarding-guard-loader">
      <div className="onboarding-guard-loader__content">
        <div className="onboarding-guard-loader__icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h2 className="onboarding-guard-loader__title">Getting Started</h2>
        <p className="onboarding-guard-loader__text">
          Preparing your personalized experience...
        </p>
        <div className="onboarding-guard-loader__spinner" />
      </div>
    </div>
  );
};

const ProgressBar = ({ progress }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="onboarding-progress-bar">
      <div 
        className="onboarding-progress-bar__fill" 
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
};

const SkipBanner = ({ onSkip, onContinue, onClose }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="onboarding-skip-banner">
      <div className="onboarding-skip-banner__header">
        <h3 className="onboarding-skip-banner__title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Skip Onboarding?
        </h3>
        <button className="onboarding-skip-banner__close" onClick={onClose}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="onboarding-skip-banner__message">
        You can skip the setup wizard, but we recommend completing it to get the most out of your experience.
      </p>
      <div className="onboarding-skip-banner__actions">
        <button 
          className="onboarding-skip-banner__button onboarding-skip-banner__button--primary"
          onClick={onContinue}
        >
          Continue Setup
        </button>
        <button 
          className="onboarding-skip-banner__button onboarding-skip-banner__button--secondary"
          onClick={onSkip}
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
};

SkipBanner.propTypes = {
  onSkip: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const WelcomeModal = ({ onStart, onSkip }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="onboarding-welcome-modal">
      <div className="onboarding-welcome-modal__content">
        <div className="onboarding-welcome-modal__icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        </div>
        <h2 className="onboarding-welcome-modal__title">Welcome Aboard!</h2>
        <p className="onboarding-welcome-modal__message">
          Let's get you set up in just a few quick steps. We'll help you create your first funnel and unlock the full potential of the platform.
        </p>
        <div className="onboarding-welcome-modal__actions">
          <button 
            className="onboarding-welcome-modal__button onboarding-welcome-modal__button--primary"
            onClick={onStart}
          >
            Let's Begin
          </button>
          <button 
            className="onboarding-welcome-modal__button onboarding-welcome-modal__button--secondary"
            onClick={onSkip}
          >
            Skip Tour
          </button>
        </div>
      </div>
    </div>
  );
};

WelcomeModal.propTypes = {
  onStart: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
};

// =============================================================================
// MAIN ONBOARDING ROUTE COMPONENT
// =============================================================================

const OnboardingRoute = ({
  children,
  requireOnboarding = true,
  showWelcomeModal = false,
  showSkipOption = true,
  showProgressBar = true,
  onOnboardingComplete = null,
  onOnboardingSkipped = null,
  customOnboardingCheck = null,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingProgress, setOnboardingProgress] = useState(null);
  const [showSkipBanner, setShowSkipBanner] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [forceSkip, setForceSkip] = useState(false);

  const isMountedRef = useRef(true);
  const checkTimeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthenticated || !user) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        // Custom onboarding check
        if (customOnboardingCheck) {
          const shouldRequire = await customOnboardingCheck(user);
          if (!shouldRequire) {
            setCheckingOnboarding(false);
            return;
          }
        }

        // Check if user should skip onboarding
        if (shouldSkipOnboarding(user)) {
          setForceSkip(true);
          setCheckingOnboarding(false);
          return;
        }

        // Get onboarding progress
        const progress = getOnboardingProgress(user);
        setOnboardingProgress(progress);

        // Check if onboarding is expired
        if (progress.startedAt && isOnboardingExpired(progress.startedAt)) {
          setForceSkip(true);
        }

        // Show welcome modal for new users
        if (showWelcomeModal && !progress.startedAt && !localStorage.getItem('onboarding_welcome_shown')) {
          setShowWelcome(true);
          localStorage.setItem('onboarding_welcome_shown', 'true');
        }

        setCheckingOnboarding(false);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [isAuthenticated, user, customOnboardingCheck, showWelcomeModal]);

  // Handle skip onboarding
  const handleSkip = useCallback(async () => {
    try {
      await updateUserPreferences({
        onboarding_skipped: true,
        onboarding_completed: true,
      });

      sessionStorage.setItem(STORAGE_KEYS.ONBOARDING_SKIPPED, 'true');
      setForceSkip(true);
      setShowSkipBanner(false);

      if (onOnboardingSkipped) {
        onOnboardingSkipped(user);
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  }, [user, onOnboardingSkipped]);

  // Handle continue onboarding
  const handleContinue = useCallback(() => {
    setShowSkipBanner(false);
  }, []);

  // Handle start onboarding
  const handleStart = useCallback(() => {
    setShowWelcome(false);
    const progress = {
      ...onboardingProgress,
      startedAt: new Date().toISOString(),
    };
    setOnboardingProgress(progress);
    storeOnboardingProgress(progress);
  }, [onboardingProgress]);

  // Handle skip from welcome modal
  const handleSkipWelcome = useCallback(() => {
    setShowWelcome(false);
    handleSkip();
  }, [handleSkip]);

  // Show loading screen
  if (isLoading || checkingOnboarding) {
    return <LoadingScreen />;
  }

  // Redirect unauthenticated users
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const onCurrentOnboardingRoute = isOnboardingRoute(location.pathname);
  const completed = hasCompletedOnboarding(user);
  const skipped = forceSkip || sessionStorage.getItem(STORAGE_KEYS.ONBOARDING_SKIPPED) === 'true';

  // User has completed onboarding
  if (completed || skipped) {
    // Redirect away from onboarding routes
    if (onCurrentOnboardingRoute) {
      if (onOnboardingComplete) {
        onOnboardingComplete(user);
      }
      return <Navigate to="/dashboard" replace />;
    }
    
    return <>{children}</>;
  }

  // Onboarding required but not completed
  if (requireOnboarding && !completed && !skipped) {
    // Already on onboarding route
    if (onCurrentOnboardingRoute) {
      const progress = onboardingProgress || getOnboardingProgress(user);
      const completionPercentage = calculateProgress(progress.completedSteps);

      return (
        <>
          {showProgressBar && <ProgressBar progress={completionPercentage} />}
          {showWelcome && (
            <WelcomeModal onStart={handleStart} onSkip={handleSkipWelcome} />
          )}
          {showSkipBanner && showSkipOption && (
            <SkipBanner
              onSkip={handleSkip}
              onContinue={handleContinue}
              onClose={() => setShowSkipBanner(false)}
            />
          )}
          {children}
        </>
      );
    }

    // Redirect to onboarding
    const progress = onboardingProgress || getOnboardingProgress(user);
    const nextRoute = getNextOnboardingRoute(progress.currentStep, progress.completedSteps);

    return (
      <Navigate
        to={nextRoute}
        replace
        state={{ from: location }}
      />
    );
  }

// Render protected content
return <>{children || <Outlet />}</>;
};

OnboardingRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireOnboarding: PropTypes.bool,
  showWelcomeModal: PropTypes.bool,
  showSkipOption: PropTypes.bool,
  showProgressBar: PropTypes.bool,
  onOnboardingComplete: PropTypes.func,
  onOnboardingSkipped: PropTypes.func,
  customOnboardingCheck: PropTypes.func,
};

export default OnboardingRoute;

// =============================================================================
// ENHANCED VARIANTS
// =============================================================================

/**
 * Strict onboarding route - no skip option
 */
export const StrictOnboardingRoute = ({ children, ...props }) => (
  <OnboardingRoute requireOnboarding showSkipOption={false} {...props}>
    {children}
  </OnboardingRoute>
);

StrictOnboardingRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Optional onboarding route - can be skipped
 */
export const OptionalOnboardingRoute = ({ children, ...props }) => (
  <OnboardingRoute requireOnboarding={false} showSkipOption {...props}>
    {children}
  </OnboardingRoute>
);

OptionalOnboardingRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  LoadingScreen,
  ProgressBar,
  SkipBanner,
  WelcomeModal,
  hasCompletedOnboarding,
  shouldSkipOnboarding,
  getOnboardingProgress,
  storeOnboardingProgress,
  calculateProgress,
  ONBOARDING_STEPS,
  ONBOARDING_ROUTES,
};
