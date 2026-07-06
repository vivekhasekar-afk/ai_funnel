// =============================================================================
// AI FUNNEL PLATFORM - LoginPage Component (Production Grade Enhanced)
// =============================================================================
// Professional login page with FastAPI backend integration
// Features: Email/Password auth, OAuth, form validation, error handling
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation, Link } from 'react-router-dom';

// Auth context and API
import { useAuth } from '@/contexts/AuthContext';
import { loginWithGoogle, loginWithLinkedIn } from '@/lib/api/auth.api';

// UI Components
import { Input, Button, Checkbox } from '@/components/ui';

// Notification hook (assuming you have one)
import { useNotification } from '@/contexts/NotificationContext';

// =============================================================================
// ENHANCED STYLES (Same as before)
// =============================================================================

const LOGIN_PAGE_STYLES = `
/* Login Container */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
  pointer-events: none;
  animation: login-bg-pulse 8s ease-in-out infinite;
}

@keyframes login-bg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.login-page::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  animation: login-bg-rotate 20s linear infinite;
}

@keyframes login-bg-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Login Card */
.login-card {
  position: relative;
  width: 100%;
  max-width: 460px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  padding: 3rem 2.5rem;
  z-index: 1;
  animation: login-card-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes login-card-enter {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.9) rotateX(10deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0deg);
  }
}

/* Logo */
.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  animation: login-logo-float 3s ease-in-out infinite;
}

@keyframes login-logo-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

.login-logo__icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  transition: transform 0.3s ease;
  color: #ffffff;
}

.login-logo__icon:hover {
  transform: scale(1.05) rotate(5deg);
}

.login-logo__icon svg {
  width: 36px;
  height: 36px;
}

/* Header */
.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header__title {
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

.login-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.login-header__subtitle a {
  color: #667eea;
  text-decoration: none;
  font-weight: 700;
  transition: color 0.3s ease;
}

.login-header__subtitle a:hover {
  color: #764ba2;
}

/* Alert Messages */
.login-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  animation: login-alert-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.login-alert::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

@keyframes login-alert-enter {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-alert--error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1.5px solid #fca5a5;
}

.login-alert--error::before {
  background: linear-gradient(180deg, #dc2626 0%, #ef4444 100%);
}

.login-alert--success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 1.5px solid #6ee7b7;
}

.login-alert--success::before {
  background: linear-gradient(180deg, #059669 0%, #10b981 100%);
}

.login-alert--info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1.5px solid #93c5fd;
}

.login-alert--info::before {
  background: linear-gradient(180deg, #2563eb 0%, #3b82f6 100%);
}

.login-alert__icon {
  flex-shrink: 0;
  animation: login-icon-bounce 0.6s ease-out;
}

@keyframes login-icon-bounce {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.1); }
}

.login-alert--error .login-alert__icon {
  color: #dc2626;
}

.login-alert--success .login-alert__icon {
  color: #059669;
}

.login-alert--info .login-alert__icon {
  color: #2563eb;
}

.login-alert__icon svg {
  width: 22px;
  height: 22px;
}

.login-alert__content {
  flex: 1;
}

.login-alert__title {
  font-size: 0.938rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.login-alert--error .login-alert__title {
  color: #991b1b;
}

.login-alert--success .login-alert__title {
  color: #065f46;
}

.login-alert--info .login-alert__title {
  color: #1e40af;
}

.login-alert__message {
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

.login-alert--error .login-alert__message {
  color: #7f1d1d;
}

.login-alert--success .login-alert__message {
  color: #064e3b;
}

.login-alert--info .login-alert__message {
  color: #1e3a8a;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.login-form__group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.login-form__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.login-form__label-required {
  color: #ef4444;
  font-size: 1rem;
}

.login-form__error {
  font-size: 0.813rem;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  animation: login-error-shake 0.4s ease-in-out;
}

@keyframes login-error-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.login-form__error svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Options Row */
.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: -0.75rem;
}

.login-options__remember {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.login-options__remember-label {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
}

.login-options__remember-label:hover {
  color: #111827;
}

.login-options__forgot {
  font-size: 0.875rem;
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
  white-space: nowrap;
}

.login-options__forgot:hover {
  color: #764ba2;
}

/* Submit Button */
.login-submit {
  margin-top: 0.5rem;
}

/* Divider */
.login-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
}

.login-divider__line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
}

.login-divider__text {
  font-size: 0.813rem;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* OAuth Buttons */
.login-oauth {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.login-oauth__button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.875rem;
  width: 100%;
  padding: 0.875rem 1.25rem;
  background-color: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  color: #1f2937;
  font-size: 0.938rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.login-oauth__button:hover {
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.login-oauth__button:active {
  transform: translateY(0);
}

.login-oauth__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-oauth__button--google:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-color: #4285f4;
}

.login-oauth__button--linkedin:hover {
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  border-color: #0077b5;
}

.login-oauth__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.login-oauth__icon svg {
  width: 22px;
  height: 22px;
}

/* Security Badge */
.login-security {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  margin-top: 1.75rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1.5px solid #bbf7d0;
  border-radius: 12px;
  font-size: 0.813rem;
  color: #065f46;
  font-weight: 600;
}

.login-security svg {
  width: 18px;
  height: 18px;
  color: #059669;
}

/* Footer */
.login-footer {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #f3f4f6;
  text-align: center;
}

.login-footer__text {
  font-size: 0.813rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.login-footer__link {
  color: #667eea;
  text-decoration: none;
  font-weight: 700;
  transition: color 0.2s ease;
}

.login-footer__link:hover {
  color: #764ba2;
}

/* Back Link */
.login-back {
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 2;
}

.login-back__link {
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

.login-back__link:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateX(-4px);
}

.login-back__link svg {
  width: 18px;
  height: 18px;
}

/* Rate Limit Warning */
.login-rate-limit {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1.5px solid #fcd34d;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  text-align: center;
}

.login-rate-limit__text {
  font-size: 0.875rem;
  color: #92400e;
  font-weight: 600;
  margin: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .login-page {
    padding: 1.5rem 1rem;
  }
  
  .login-card {
    padding: 2.5rem 2rem;
    max-width: 100%;
  }
  
  .login-header__title {
    font-size: 1.75rem;
  }
  
  .login-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .login-back {
    top: 1rem;
    left: 1rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .login-page::before,
  .login-page::after,
  .login-card,
  .login-logo,
  .login-alert {
    animation: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'login-page');
  styleElement.textContent = LOGIN_PAGE_STYLES;
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

const CheckCircleIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const LightningIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24">
    <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="#0077b5">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const LoginPage = ({
  showLogo = true,
  enableGoogle = true,
  enableLinkedIn = true,
  showBackLink = true,
  className = '',
}) => {
  // Inject styles
  useEffect(() => {
    injectStyles();
  }, []);

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error: authError, canAttemptLogin, clearError } = useAuth();
  const { showNotification } = useNotification?.() || { showNotification: () => {} };

  // Refs
  const emailRef = useRef(null);
  const formRef = useRef(null);

  // Local state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [oauthLoading, setOauthLoading] = useState(null);

  // =========================================================================
  // EFFECTS
  // =========================================================================

  // Focus email input on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Show message from location state (e.g., after signup or password reset)
  useEffect(() => {
    if (location.state?.message) {
      setAlert({
        type: 'success',
        title: 'Success',
        message: location.state.message,
      });
      
      // Clear location state
      window.history.replaceState({}, document.title);
    }

    if (location.state?.error) {
      setAlert({
        type: 'error',
        title: 'Error',
        message: location.state.error,
      });
      
      // Clear location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Show auth error from context
  useEffect(() => {
    if (authError) {
      setAlert({
        type: 'error',
        title: 'Login Failed',
        message: authError,
      });
    }
  }, [authError]);

  // Clear alert when user types
  useEffect(() => {
    if (alert && (formData.email || formData.password)) {
      const timer = setTimeout(() => {
        setAlert(null);
        clearError?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [formData.email, formData.password, alert, clearError]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear field error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setAlert(null);
    clearError?.();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Check rate limiting
    if (!canAttemptLogin) {
      setAlert({
        type: 'error',
        title: 'Too Many Attempts',
        message: 'Please wait 5 minutes before trying again.',
      });
      return;
    }

    try {
      // Call login from auth context
      await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      // Success - context will handle redirect
      showNotification?.('success', 'Welcome back!');
    } catch (error) {
      // Error is already handled by auth context
      console.error('Login error:', error);
      
      // Show notification
      showNotification?.('error', error.message || 'Login failed');
    }
  };

  /**
   * Handle OAuth login
   */
  const handleOAuthLogin = (provider) => {
    setOauthLoading(provider);
    setAlert(null);
    clearError?.();

    try {
      // Redirect to OAuth provider
      if (provider === 'google') {
        loginWithGoogle();
      } else if (provider === 'linkedin') {
        loginWithLinkedIn();
      }
    } catch (error) {
      console.error('OAuth error:', error);
      setAlert({
        type: 'error',
        title: 'OAuth Failed',
        message: `Failed to connect with ${provider}. Please try again.`,
      });
      setOauthLoading(null);
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
    <div className={`login-page ${className}`}>
      {/* Back link */}
      {showBackLink && (
        <div className="login-back">
          <Link to="/" className="login-back__link">
            <ArrowLeftIcon />
            <span>Back to Home</span>
          </Link>
        </div>
      )}

      {/* Login card */}
      <div className="login-card">
        {/* Logo */}
        {showLogo && (
          <div className="login-logo">
            <div className="login-logo__icon">
              <LightningIcon />
            </div>
          </div>
        )}

        {/* Header */}
        <div className="login-header">
          <h1 className="login-header__title">Welcome Back</h1>
          <p className="login-header__subtitle">
            New here? <Link to="/auth/signup">Create an account</Link>
          </p>
        </div>

        {/* Rate limit warning */}
        {!canAttemptLogin && (
          <div className="login-rate-limit">
            <p className="login-rate-limit__text">
              Too many login attempts. Please wait 5 minutes before trying again.
            </p>
          </div>
        )}

        {/* Alert message */}
        {alert && (
          <div className={`login-alert login-alert--${alert.type}`}>
            <div className="login-alert__icon">
              {getAlertIcon(alert.type)}
            </div>
            <div className="login-alert__content">
              <p className="login-alert__title">{alert.title}</p>
              <p className="login-alert__message">{alert.message}</p>
            </div>
          </div>
        )}

        {/* Login form */}
        <form ref={formRef} className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Email field */}
          <div className="login-form__group">
            <label htmlFor="email" className="login-form__label">
              Email Address
              <span className="login-form__label-required">*</span>
            </label>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              error={!!errors.email}
              disabled={isLoading || !canAttemptLogin}
              autoComplete="email"
              autoFocus
              required
            />
            {errors.email && (
              <p className="login-form__error">
                <AlertIcon />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="login-form__group">
            <label htmlFor="password" className="login-form__label">
              Password
              <span className="login-form__label-required">*</span>
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              error={!!errors.password}
              disabled={isLoading || !canAttemptLogin}
              autoComplete="current-password"
              required
            />
            {errors.password && (
              <p className="login-form__error">
                <AlertIcon />
                {errors.password}
              </p>
            )}
          </div>

          {/* Options row */}
          <div className="login-options">
            <div className="login-options__remember">
              <Checkbox
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isLoading || !canAttemptLogin}
              />
              <label htmlFor="rememberMe" className="login-options__remember-label">
                Remember me
              </label>
            </div>
            <Link to="/auth/forgot-password" className="login-options__forgot">
              Forgot password?
            </Link>
          </div>

          {/* Submit button */}
          <div className="login-submit">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={isLoading || oauthLoading || !canAttemptLogin}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </form>

        {/* OAuth section */}
        {(enableGoogle || enableLinkedIn) && (
          <>
            <div className="login-divider">
              <div className="login-divider__line" />
              <span className="login-divider__text">Or continue with</span>
              <div className="login-divider__line" />
            </div>

            <div className="login-oauth">
              {enableGoogle && (
                <button
                  type="button"
                  className="login-oauth__button login-oauth__button--google"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading || oauthLoading !== null || !canAttemptLogin}
                >
                  <span className="login-oauth__icon">
                    <GoogleIcon />
                  </span>
                  {oauthLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
                </button>
              )}

              {enableLinkedIn && (
                <button
                  type="button"
                  className="login-oauth__button login-oauth__button--linkedin"
                  onClick={() => handleOAuthLogin('linkedin')}
                  disabled={isLoading || oauthLoading !== null || !canAttemptLogin}
                >
                  <span className="login-oauth__icon">
                    <LinkedInIcon />
                  </span>
                  {oauthLoading === 'linkedin' ? 'Connecting to LinkedIn...' : 'Continue with LinkedIn'}
                </button>
              )}
            </div>
          </>
        )}

        {/* Security badge */}
        <div className="login-security">
          <ShieldCheckIcon />
          <span>Protected by 256-bit SSL encryption</span>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p className="login-footer__text">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="login-footer__link">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="login-footer__link">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

LoginPage.propTypes = {
  showLogo: PropTypes.bool,
  enableGoogle: PropTypes.bool,
  enableLinkedIn: PropTypes.bool,
  showBackLink: PropTypes.bool,
  className: PropTypes.string,
};

export default LoginPage;
export { LoginPage };
