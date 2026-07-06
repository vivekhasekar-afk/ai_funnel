// =============================================================================
// AI FUNNEL PLATFORM - ForgotPasswordPage Component (Production Grade Enhanced)
// =============================================================================
// Professional password reset request page with FastAPI backend integration
// Features: Email validation, reset link sending, success state, resend functionality
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation, Link } from 'react-router-dom';

// Auth context
import { useAuth } from '@/contexts/AuthContext';

// UI Components
import { Input, Button } from '@/components/ui';

// Notification hook (optional)
import { useNotification } from '@/contexts/NotificationContext';

// =============================================================================
// ENHANCED STYLES (Same as before - kept for brevity)
// =============================================================================

const FORGOT_PASSWORD_STYLES = `
/* Forgot Password Container */
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.forgot-password-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
  pointer-events: none;
  animation: forgot-bg-pulse 8s ease-in-out infinite;
}

@keyframes forgot-bg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.forgot-password-page::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  animation: forgot-bg-rotate 20s linear infinite;
}

@keyframes forgot-bg-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Card */
.forgot-password-card {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  padding: 3rem 2.5rem;
  z-index: 1;
  animation: forgot-card-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes forgot-card-enter {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Icon */
.forgot-password-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  animation: forgot-icon-float 3s ease-in-out infinite;
}

@keyframes forgot-icon-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

.forgot-password-icon svg {
  width: 40px;
  height: 40px;
  color: #ffffff;
}

/* Success Icon */
.forgot-password-success-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
  animation: forgot-success-scale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes forgot-success-scale {
  0% { transform: scale(0) rotate(-180deg); }
  100% { transform: scale(1) rotate(0deg); }
}

/* Header */
.forgot-password-header {
  text-align: center;
  margin-bottom: 2rem;
}

.forgot-password-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.75rem 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.forgot-password-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

/* Alert Messages */
.forgot-password-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  animation: forgot-alert-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.forgot-password-alert::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

@keyframes forgot-alert-enter {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.forgot-password-alert--error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1.5px solid #fca5a5;
}

.forgot-password-alert--error::before {
  background: linear-gradient(180deg, #dc2626 0%, #ef4444 100%);
}

.forgot-password-alert--info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1.5px solid #93c5fd;
}

.forgot-password-alert--info::before {
  background: linear-gradient(180deg, #2563eb 0%, #3b82f6 100%);
}

.forgot-password-alert--success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 1.5px solid #6ee7b7;
}

.forgot-password-alert--success::before {
  background: linear-gradient(180deg, #059669 0%, #10b981 100%);
}

.forgot-password-alert__icon {
  flex-shrink: 0;
  animation: forgot-icon-bounce 0.6s ease-out;
}

@keyframes forgot-icon-bounce {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.1); }
}

.forgot-password-alert--error .forgot-password-alert__icon {
  color: #dc2626;
}

.forgot-password-alert--info .forgot-password-alert__icon {
  color: #2563eb;
}

.forgot-password-alert--success .forgot-password-alert__icon {
  color: #059669;
}

.forgot-password-alert__icon svg {
  width: 22px;
  height: 22px;
}

.forgot-password-alert__content {
  flex: 1;
}

.forgot-password-alert__title {
  font-size: 0.938rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.forgot-password-alert--error .forgot-password-alert__title {
  color: #991b1b;
}

.forgot-password-alert--info .forgot-password-alert__title {
  color: #1e40af;
}

.forgot-password-alert--success .forgot-password-alert__title {
  color: #065f46;
}

.forgot-password-alert__message {
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

.forgot-password-alert--error .forgot-password-alert__message {
  color: #7f1d1d;
}

.forgot-password-alert--info .forgot-password-alert__message {
  color: #1e3a8a;
}

.forgot-password-alert--success .forgot-password-alert__message {
  color: #064e3b;
}

/* Form */
.forgot-password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.forgot-password-form__group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.forgot-password-form__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.forgot-password-form__label-required {
  color: #ef4444;
  font-size: 1rem;
}

.forgot-password-form__error {
  font-size: 0.813rem;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  animation: forgot-error-shake 0.4s ease-in-out;
}

@keyframes forgot-error-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.forgot-password-form__error svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Submit Button */
.forgot-password-submit button {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.forgot-password-submit button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.forgot-password-submit button:active {
  transform: translateY(0);
}

/* Back Link */
.forgot-password-back {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f3f4f6;
  font-size: 0.875rem;
  color: #6b7280;
}

.forgot-password-back__link {
  color: #667eea;
  text-decoration: none;
  font-weight: 700;
  transition: color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.forgot-password-back__link:hover {
  color: #764ba2;
}

.forgot-password-back__link svg {
  width: 16px;
  height: 16px;
}

/* Success State */
.forgot-password-success {
  text-align: center;
  animation: forgot-success-enter 0.5s ease-out;
}

@keyframes forgot-success-enter {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.forgot-password-success__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.75rem 0;
}

.forgot-password-success__message {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.forgot-password-success__email {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1.5px solid #bbf7d0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #065f46;
  margin-bottom: 1.5rem;
}

.forgot-password-success__email svg {
  width: 18px;
  height: 18px;
  color: #059669;
}

.forgot-password-success__note {
  padding: 1rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1.5px solid #fcd34d;
  border-radius: 12px;
  font-size: 0.813rem;
  color: #92400e;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.forgot-password-success__actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Home Link */
.forgot-password-home {
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 2;
}

.forgot-password-home__link {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1.25rem;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(16px);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.forgot-password-home__link:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateX(-4px);
}

.forgot-password-home__link svg {
  width: 18px;
  height: 18px;
}

/* Resend Timer */
.forgot-password-resend {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 1rem;
}

.forgot-password-resend__button {
  color: #667eea;
  font-weight: 700;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;
  padding: 0;
}

.forgot-password-resend__button:hover {
  color: #764ba2;
}

.forgot-password-resend__button:disabled {
  color: #9ca3af;
  cursor: not-allowed;
  text-decoration: none;
}

/* Responsive */
@media (max-width: 640px) {
  .forgot-password-page {
    padding: 1.5rem 1rem;
  }
  
  .forgot-password-card {
    padding: 2.5rem 2rem;
    max-width: 100%;
  }
  
  .forgot-password-header__title {
    font-size: 1.75rem;
  }
  
  .forgot-password-icon {
    width: 64px;
    height: 64px;
  }
  
  .forgot-password-icon svg {
    width: 32px;
    height: 32px;
  }
  
  .forgot-password-home {
    top: 1rem;
    left: 1rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .forgot-password-page::before,
  .forgot-password-page::after,
  .forgot-password-card,
  .forgot-password-icon,
  .forgot-password-alert {
    animation: none !important;
  }
  
  .forgot-password-submit button:hover,
  .forgot-password-home__link:hover {
    transform: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'forgot-password-page');
  styleElement.textContent = FORGOT_PASSWORD_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const AlertIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const InfoIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MailIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const KeyIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ForgotPasswordPage = ({
  showHomeLink = true,
  className = '',
}) => {
  // Inject styles
  useEffect(() => {
    injectStyles();
  }, []);

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { forgotPassword, isLoading, clearError } = useAuth();
  const { showNotification } = useNotification?.() || { showNotification: () => {} };

  // Refs
  const emailRef = useRef(null);
  const formRef = useRef(null);

  // Local state
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // =========================================================================
  // EFFECTS
  // =========================================================================

  // Focus email input on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Show message from location state
  useEffect(() => {
    if (location.state?.message) {
      setAlert({
        type: 'info',
        title: 'Info',
        message: location.state.message,
      });
      
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Clear alert when user types
  useEffect(() => {
    if (alert && email) {
      const timer = setTimeout(() => {
        setAlert(null);
        clearError?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [email, alert, clearError]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  /**
   * Validate email
   */
  const validateEmail = () => {
    if (!email) {
      setError('Email address is required');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    setError('');
    return true;
  };

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    setEmail(e.target.value);
    
    // Clear error when user types
    if (error) {
      setError('');
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setAlert(null);
    clearError?.();

    // Validate email
    if (!validateEmail()) {
      return;
    }

    try {
      // Call forgotPassword from auth context
      await forgotPassword(email.trim().toLowerCase());

      // Show success state
      setSuccess(true);
      setResendTimer(60); // 60 second cooldown

      // Show notification
      showNotification?.('success', 'Password reset email sent!');

      if (import.meta.env.DEV) {
        console.log('✅ Password reset email sent to:', email);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      const errorMessage = error.message || 'Failed to send reset email. Please try again.';
      
      setAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });

      showNotification?.('error', errorMessage);
    }
  };

  /**
   * Handle resend email
   */
  const handleResend = async () => {
    if (resendTimer > 0) return;

    // Clear previous alerts
    setAlert(null);
    clearError?.();

    try {
      // Call forgotPassword again
      await forgotPassword(email.trim().toLowerCase());

      // Show success alert
      setAlert({
        type: 'success',
        title: 'Email Resent',
        message: 'Check your inbox for the reset link.',
      });

      // Reset timer
      setResendTimer(60);

      showNotification?.('success', 'Reset email sent again');

      if (import.meta.env.DEV) {
        console.log('✅ Password reset email resent to:', email);
      }
    } catch (error) {
      console.error('Resend error:', error);
      
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to resend email. Please try again.',
      });

      showNotification?.('error', 'Failed to resend email');
    }
  };

  /**
   * Get alert icon
   */
  const getAlertIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <AlertIcon />;
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className={`forgot-password-page ${className}`}>
      {/* Home link */}
      {showHomeLink && (
        <div className="forgot-password-home">
          <Link to="/" className="forgot-password-home__link">
            <ArrowLeftIcon />
            <span>Home</span>
          </Link>
        </div>
      )}

      {/* Card */}
      <div className="forgot-password-card">
        {/* Form State */}
        {!success ? (
          <>
            {/* Icon */}
            <div className="forgot-password-icon">
              <KeyIcon />
            </div>

            {/* Header */}
            <div className="forgot-password-header">
              <h1 className="forgot-password-header__title">Forgot Password?</h1>
              <p className="forgot-password-header__subtitle">
                No worries! Enter your email and we'll send you reset instructions.
              </p>
            </div>

            {/* Alert */}
            {alert && (
              <div className={`forgot-password-alert forgot-password-alert--${alert.type}`}>
                <div className="forgot-password-alert__icon">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="forgot-password-alert__content">
                  <p className="forgot-password-alert__title">{alert.title}</p>
                  <p className="forgot-password-alert__message">{alert.message}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form ref={formRef} className="forgot-password-form" onSubmit={handleSubmit} noValidate>
              <div className="forgot-password-form__group">
                <label htmlFor="email" className="forgot-password-form__label">
                  Email Address
                  <span className="forgot-password-form__label-required">*</span>
                </label>
                <Input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  error={!!error}
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                  required
                />
                {error && (
                  <p className="forgot-password-form__error">
                    <AlertIcon />
                    {error}
                  </p>
                )}
              </div>

              <div className="forgot-password-submit">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>

            {/* Back to login */}
            <div className="forgot-password-back">
              <span>Remember your password?</span>
              <Link to="/auth/login" className="forgot-password-back__link">
                <ArrowLeftIcon />
                Back to Login
              </Link>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="forgot-password-success">
            {/* Success icon */}
            <div className="forgot-password-icon forgot-password-success-icon">
              <MailIcon />
            </div>

            {/* Header */}
            <h2 className="forgot-password-success__title">Check Your Email</h2>
            <p className="forgot-password-success__message">
              We've sent password reset instructions to:
            </p>

            {/* Email display */}
            <div className="forgot-password-success__email">
              <MailIcon />
              {email}
            </div>

            {/* Note */}
            <div className="forgot-password-success__note">
              <strong>Didn't receive the email?</strong> Check your spam folder or ensure
              the email address is correct.
            </div>

            {/* Actions */}
            <div className="forgot-password-success__actions">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/auth/login')}
              >
                Back to Login
              </Button>

              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => setSuccess(false)}
              >
                Try Another Email
              </Button>
            </div>

            {/* Resend timer */}
            <div className="forgot-password-resend">
              {resendTimer > 0 ? (
                <span>Resend available in {resendTimer}s</span>
              ) : (
                <>
                  <span>Didn't receive it? </span>
                  <button
                    type="button"
                    className="forgot-password-resend__button"
                    onClick={handleResend}
                    disabled={isLoading}
                  >
                    Resend Email
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ForgotPasswordPage.propTypes = {
  showHomeLink: PropTypes.bool,
  className: PropTypes.string,
};

export default ForgotPasswordPage;
export { ForgotPasswordPage };
