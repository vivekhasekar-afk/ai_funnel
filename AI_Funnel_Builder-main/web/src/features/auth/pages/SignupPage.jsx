// =============================================================================
// AI FUNNEL PLATFORM - SignupPage Component (Production Grade Enhanced)
// =============================================================================
// Professional signup page with FastAPI backend integration
// Features: Email/Password signup, OAuth, password strength, role selection
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation, Link } from 'react-router-dom';

// Auth context and API
import { useAuth } from '@/contexts/AuthContext';
import { loginWithGoogle, loginWithLinkedIn } from '@/lib/api/auth.api';

// UI Components
import { Input, Button, Checkbox } from '@/components/ui';

// Notification hook (optional)
import { useNotification } from '@/contexts/NotificationContext';

// =============================================================================
// ENHANCED STYLES (Same as before - kept for brevity)
// =============================================================================

const SIGNUP_PAGE_STYLES = `
/* Signup Container */
.signup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 3rem 2rem;
  position: relative;
  overflow: hidden;
}

.signup-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
  pointer-events: none;
  animation: signup-bg-pulse 8s ease-in-out infinite;
}

@keyframes signup-bg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.signup-page::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  animation: signup-bg-rotate 20s linear infinite;
}

@keyframes signup-bg-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Signup Card */
.signup-card {
  position: relative;
  width: 100%;
  max-width: 520px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  padding: 3rem 2.5rem;
  z-index: 1;
  animation: signup-card-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-height: 90vh;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(102, 126, 234, 0.3) transparent;
}

.signup-card::-webkit-scrollbar {
  width: 6px;
}

.signup-card::-webkit-scrollbar-track {
  background: transparent;
}

.signup-card::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

@keyframes signup-card-enter {
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
.signup-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  animation: signup-logo-float 3s ease-in-out infinite;
}

@keyframes signup-logo-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

.signup-logo__icon {
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

.signup-logo__icon:hover {
  transform: scale(1.05) rotate(5deg);
}

.signup-logo__icon svg {
  width: 36px;
  height: 36px;
}

/* Header */
.signup-header {
  text-align: center;
  margin-bottom: 2rem;
}

.signup-header__title {
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

.signup-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.signup-header__subtitle a {
  color: #667eea;
  text-decoration: none;
  font-weight: 700;
  transition: color 0.3s ease;
}

.signup-header__subtitle a:hover {
  color: #764ba2;
}

/* Alert */
.signup-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  animation: signup-alert-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.signup-alert::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

@keyframes signup-alert-enter {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.signup-alert--error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1.5px solid #fca5a5;
}

.signup-alert--error::before {
  background: linear-gradient(180deg, #dc2626 0%, #ef4444 100%);
}

.signup-alert--success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 1.5px solid #6ee7b7;
}

.signup-alert--success::before {
  background: linear-gradient(180deg, #059669 0%, #10b981 100%);
}

.signup-alert--info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1.5px solid #93c5fd;
}

.signup-alert--info::before {
  background: linear-gradient(180deg, #2563eb 0%, #3b82f6 100%);
}

.signup-alert__icon {
  flex-shrink: 0;
  animation: signup-icon-bounce 0.6s ease-out;
}

@keyframes signup-icon-bounce {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.1); }
}

.signup-alert--error .signup-alert__icon {
  color: #dc2626;
}

.signup-alert--success .signup-alert__icon {
  color: #059669;
}

.signup-alert--info .signup-alert__icon {
  color: #2563eb;
}

.signup-alert__icon svg {
  width: 22px;
  height: 22px;
}

.signup-alert__content {
  flex: 1;
}

.signup-alert__title {
  font-size: 0.938rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.signup-alert--error .signup-alert__title {
  color: #991b1b;
}

.signup-alert--success .signup-alert__title {
  color: #065f46;
}

.signup-alert--info .signup-alert__title {
  color: #1e40af;
}

.signup-alert__message {
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

.signup-alert--error .signup-alert__message {
  color: #7f1d1d;
}

.signup-alert--success .signup-alert__message {
  color: #064e3b;
}

.signup-alert--info .signup-alert__message {
  color: #1e3a8a;
}

/* Form */
.signup-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.signup-form__group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.signup-form__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.signup-form__label-required {
  color: #ef4444;
  font-size: 1rem;
}

.signup-form__error {
  font-size: 0.813rem;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  animation: signup-error-shake 0.4s ease-in-out;
}

@keyframes signup-error-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.signup-form__error svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Password Strength */
.signup-password-strength {
  margin-top: 0.5rem;
}

.signup-password-strength__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.813rem;
  margin-bottom: 0.5rem;
}

.signup-password-strength__text {
  color: #6b7280;
  font-weight: 600;
}

.signup-password-strength__level {
  font-weight: 700;
}

.signup-password-strength__level--weak {
  color: #dc2626;
}

.signup-password-strength__level--fair {
  color: #f59e0b;
}

.signup-password-strength__level--good {
  color: #3b82f6;
}

.signup-password-strength__level--strong {
  color: #059669;
}

.signup-password-strength__bar {
  display: flex;
  gap: 0.375rem;
  height: 4px;
}

.signup-password-strength__segment {
  flex: 1;
  background-color: #e5e7eb;
  border-radius: 2px;
  transition: background-color 0.3s ease;
}

.signup-password-strength__segment--active-weak {
  background-color: #dc2626;
}

.signup-password-strength__segment--active-fair {
  background-color: #f59e0b;
}

.signup-password-strength__segment--active-good {
  background-color: #3b82f6;
}

.signup-password-strength__segment--active-strong {
  background-color: #059669;
}

.signup-password-strength__tips {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.signup-password-strength__tips-title {
  font-size: 0.813rem;
  font-weight: 700;
  color: #1e40af;
  margin: 0 0 0.5rem 0;
}

.signup-password-strength__tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.signup-password-strength__tips-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #1e40af;
}

.signup-password-strength__tips-item svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.signup-password-strength__tips-item--met {
  color: #059669;
}

/* Role Selection */
.signup-role {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.signup-role__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.signup-role__option {
  position: relative;
}

.signup-role__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.signup-role__label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.signup-role__label:hover {
  border-color: #bfdbfe;
  background-color: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.signup-role__input:checked + .signup-role__label {
  border-color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
}

.signup-role__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
  transition: all 0.3s ease;
}

.signup-role__input:checked + .signup-role__label .signup-role__icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  transform: scale(1.1);
}

.signup-role__icon svg {
  width: 24px;
  height: 24px;
}

.signup-role__name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
}

.signup-role__description {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

/* Terms */
.signup-terms {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #f9fafb;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  margin-top: -0.5rem;
}

.signup-terms__checkbox {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.signup-terms__label {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
  cursor: pointer;
  user-select: none;
}

.signup-terms__link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.signup-terms__link:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* Submit Button */
.signup-submit {
  margin-top: 0.5rem;
}

/* Divider */
.signup-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
}

.signup-divider__line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
}

.signup-divider__text {
  font-size: 0.813rem;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* OAuth */
.signup-oauth {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.signup-oauth__button {
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
}

.signup-oauth__button:hover {
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.signup-oauth__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.signup-oauth__button--google:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-color: #4285f4;
}

.signup-oauth__button--linkedin:hover {
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  border-color: #0077b5;
}

.signup-oauth__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.signup-oauth__icon svg {
  width: 22px;
  height: 22px;
}

/* Footer */
.signup-footer {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #f3f4f6;
  text-align: center;
}

.signup-footer__text {
  font-size: 0.813rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

/* Back Link */
.signup-back {
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 2;
}

.signup-back__link {
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

.signup-back__link:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateX(-4px);
}

.signup-back__link svg {
  width: 18px;
  height: 18px;
}

/* Responsive */
@media (max-width: 640px) {
  .signup-page {
    padding: 2rem 1rem;
  }
  
  .signup-card {
    padding: 2.5rem 2rem;
    max-width: 100%;
  }
  
  .signup-header__title {
    font-size: 1.75rem;
  }
  
  .signup-role__grid {
    grid-template-columns: 1fr;
  }
  
  .signup-back {
    top: 1rem;
    left: 1rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .signup-page::before,
  .signup-page::after,
  .signup-card,
  .signup-logo,
  .signup-alert {
    animation: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'signup-page');
  styleElement.textContent = SIGNUP_PAGE_STYLES;
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

const CheckIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const UserIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const RocketIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24">
    <path d="M13.13 22.19l-.24-2.33 2.24-2.24 2.8-2.79c1.04-.92 2.02-2.03 2.88-3.31a15.16 15.16 0 001.85-4.05c.16-.64.26-1.24.32-1.8.06-.57.09-1.08.09-1.53 0-.44-.03-.94-.09-1.53-.05-.56-.16-1.16-.32-1.8a15.16 15.16 0 00-1.85-4.05c-.86-1.28-1.84-2.39-2.88-3.31-.92-1.04-2.03-2.02-3.31-2.88A15.16 15.16 0 009.57.85c-.64-.16-1.24-.26-1.8-.32C7.21.47 6.71.44 6.27.44c-.44 0-.94.03-1.53.09-.56.05-1.16.16-1.8.32a15.16 15.16 0 00-4.05 1.85C-2.39 3.56-3.5 4.54-4.42 5.58-5.46 6.5-6.44 7.61-7.3 8.89a15.16 15.16 0 00-1.85 4.05c-.16.64-.26 1.24-.32 1.8-.06.59-.09 1.09-.09 1.53 0 .44.03.94.09 1.53.06.56.16 1.16.32 1.8.38 1.5.98 2.85 1.85 4.05.86 1.28 1.84 2.39 2.88 3.31l2.79 2.8 2.24 2.24-2.33.24c-.39.04-.78.09-1.17.15.4-.06.79-.11 1.17-.15z"/>
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
// DEFAULT ROLES
// =============================================================================

const DEFAULT_ROLES = [
  {
    value: 'individual',
    label: 'Individual',
    description: 'For personal use',
    icon: <UserIcon />,
  },
  {
    value: 'business',
    label: 'Business',
    description: 'For teams & companies',
    icon: <BriefcaseIcon />,
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const SignupPage = ({
  showLogo = true,
  enableGoogle = true,
  enableLinkedIn = true,
  showBackLink = true,
  roles = DEFAULT_ROLES,
  className = '',
}) => {
  // Inject styles
  useEffect(() => {
    injectStyles();
  }, []);

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, isLoading, error: authError, clearError } = useAuth();
  const { showNotification } = useNotification?.() || { showNotification: () => {} };

  // Refs
  const emailRef = useRef(null);
  const formRef = useRef(null);

  // Local state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: roles[0]?.value || '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPasswordTips, setShowPasswordTips] = useState(false);

  // =========================================================================
  // PASSWORD STRENGTH CALCULATION
  // =========================================================================

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const getPasswordCriteria = (password) => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  });

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
        type: 'success',
        title: 'Success',
        message: location.state.message,
      });
      
      window.history.replaceState({}, document.title);
    }

    if (location.state?.error) {
      setAlert({
        type: 'error',
        title: 'Error',
        message: location.state.error,
      });
      
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Show auth error from context
  useEffect(() => {
    if (authError) {
      setAlert({
        type: 'error',
        title: 'Signup Failed',
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
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Update password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
      setShowPasswordTips(value.length > 0);
    }

    // Clear field error
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

    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters';
    }

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
    } else if (passwordStrength < 2) {
      newErrors.password = 'Password is too weak. Please follow the requirements below.';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select your account type';
    }

    // Terms validation
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
// src/features/auth/pages/SignupPage.jsx
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    console.log('❌ Validation failed:', errors);
    return;
  }

  setErrors({});
  setAlert(null);

  try {
    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      password_confirm: formData.confirmPassword,
      role: formData.role,
    };
    
    console.log('📤 Sending signup request:', payload);

    const result = await signup(payload);
    
    console.log('✅ Signup success:', result);

    // ✅ Show success notification (safely)
    if (showNotification) {
      showNotification({
        type: 'success',
        title: 'Account Created!',
        message: result.message || 'Welcome to AI Funnel Platform!',
      });
    }

    // ✅ Show success alert
    setAlert({
      type: 'success',
      title: 'Account Created!',
      message: 'Welcome to AI Funnel Platform! Redirecting...',
    });

    // Redirect after short delay
    setTimeout(() => {
      if (result.requires_verification) {
        navigate('/auth/verify-email', { 
          state: { email: formData.email } 
        });
      } else {
        navigate('/dashboard');
      }
    }, 1500);

  } catch (error) {
    console.error('❌ Signup error:', error);
    
    const errorMessage = error.message || 'Signup failed. Please try again.';

    setErrors({
      submit: errorMessage,
    });

    setAlert({
      type: 'error',
      title: 'Signup Failed',
      message: errorMessage,
    });

    // ✅ Show error notification (safely)
    if (showNotification) {
      showNotification({
        type: 'error',
        title: 'Signup Failed',
        message: errorMessage,
      });
    }
  }
};

  /**
   * Handle OAuth signup
   */
  const handleOAuthSignup = (provider) => {
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
  // PASSWORD STRENGTH DISPLAY
  // =========================================================================

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthLevels = ['weak', 'fair', 'good', 'strong'];
  const criteria = getPasswordCriteria(formData.password);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className={`signup-page ${className}`}>
      {/* Back link */}
      {showBackLink && (
        <div className="signup-back">
          <Link to="/" className="signup-back__link">
            <ArrowLeftIcon />
            <span>Back to Home</span>
          </Link>
        </div>
      )}

      {/* Signup card */}
      <div className="signup-card">
        {/* Logo */}
        {showLogo && (
          <div className="signup-logo">
            <div className="signup-logo__icon">
              <RocketIcon />
            </div>
          </div>
        )}

        {/* Header */}
        <div className="signup-header">
          <h1 className="signup-header__title">Create Your Account</h1>
          <p className="signup-header__subtitle">
            Already have an account? <Link to="/auth/login">Sign in</Link>
          </p>
        </div>

        {/* Alert message */}
        {alert && (
          <div className={`signup-alert signup-alert--${alert.type}`}>
            <div className="signup-alert__icon">
              {getAlertIcon(alert.type)}
            </div>
            <div className="signup-alert__content">
              <p className="signup-alert__title">{alert.title}</p>
              <p className="signup-alert__message">{alert.message}</p>
            </div>
          </div>
        )}

        {/* Signup form */}
        <form ref={formRef} className="signup-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="signup-form__group">
            <label htmlFor="full_name" className="signup-form__label">
              Full Name
              <span className="signup-form__label-required">*</span>
            </label>
            <Input
              ref={emailRef}
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              error={!!errors.full_name}
              disabled={isLoading}
              autoComplete="name"
              autoFocus
              required
            />
            {errors.full_name && (
              <p className="signup-form__error">
                <AlertIcon />
                {errors.full_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="signup-form__group">
            <label htmlFor="email" className="signup-form__label">
              Email Address
              <span className="signup-form__label-required">*</span>
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              error={!!errors.email}
              disabled={isLoading}
              autoComplete="email"
              required
            />
            {errors.email && (
              <p className="signup-form__error">
                <AlertIcon />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="signup-form__group">
            <label htmlFor="password" className="signup-form__label">
              Password
              <span className="signup-form__label-required">*</span>
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              error={!!errors.password}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
            {errors.password && (
              <p className="signup-form__error">
                <AlertIcon />
                {errors.password}
              </p>
            )}

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="signup-password-strength">
                <div className="signup-password-strength__label">
                  <span className="signup-password-strength__text">
                    Password Strength:
                  </span>
                  <span
                    className={`signup-password-strength__level signup-password-strength__level--${
                      strengthLevels[passwordStrength - 1] || 'weak'
                    }`}
                  >
                    {strengthLabels[passwordStrength - 1] || 'Too Short'}
                  </span>
                </div>
                <div className="signup-password-strength__bar">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`signup-password-strength__segment ${
                        i < passwordStrength
                          ? `signup-password-strength__segment--active-${strengthLevels[passwordStrength - 1]}`
                          : ''
                      }`}
                    />
                  ))}
                </div>

                {/* Password Tips */}
                {showPasswordTips && (
                  <div className="signup-password-strength__tips">
                    <p className="signup-password-strength__tips-title">
                      Password Requirements:
                    </p>
                    <ul className="signup-password-strength__tips-list">
                      <li
                        className={`signup-password-strength__tips-item ${
                          criteria.length ? 'signup-password-strength__tips-item--met' : ''
                        }`}
                      >
                        {criteria.length ? <CheckIcon /> : <AlertIcon />}
                        At least 8 characters
                      </li>
                      <li
                        className={`signup-password-strength__tips-item ${
                          criteria.uppercase && criteria.lowercase
                            ? 'signup-password-strength__tips-item--met'
                            : ''
                        }`}
                      >
                        {criteria.uppercase && criteria.lowercase ? (
                          <CheckIcon />
                        ) : (
                          <AlertIcon />
                        )}
                        Upper & lowercase letters
                      </li>
                      <li
                        className={`signup-password-strength__tips-item ${
                          criteria.number ? 'signup-password-strength__tips-item--met' : ''
                        }`}
                      >
                        {criteria.number ? <CheckIcon /> : <AlertIcon />}
                        At least one number
                      </li>
                      <li
                        className={`signup-password-strength__tips-item ${
                          criteria.special ? 'signup-password-strength__tips-item--met' : ''
                        }`}
                      >
                        {criteria.special ? <CheckIcon /> : <AlertIcon />}
                        Special character (!@#$%^&*)
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="signup-form__group">
            <label htmlFor="confirmPassword" className="signup-form__label">
              Confirm Password
              <span className="signup-form__label-required">*</span>
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              error={!!errors.confirmPassword}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
            {errors.confirmPassword && (
              <p className="signup-form__error">
                <AlertIcon />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="signup-form__group">
            <label className="signup-form__label">
              I'm signing up as
              <span className="signup-form__label-required">*</span>
            </label>
            <div className="signup-role">
              <div className="signup-role__grid">
                {roles.map((role) => (
                  <div key={role.value} className="signup-role__option">
                    <input
                      type="radio"
                      id={`role-${role.value}`}
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={handleChange}
                      className="signup-role__input"
                      disabled={isLoading}
                    />
                    <label htmlFor={`role-${role.value}`} className="signup-role__label">
                      <div className="signup-role__icon">{role.icon}</div>
                      <div className="signup-role__name">{role.label}</div>
                      <div className="signup-role__description">{role.description}</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {errors.role && (
              <p className="signup-form__error">
                <AlertIcon />
                {errors.role}
              </p>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="signup-terms">
            <Checkbox
              id="agreeTerms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              disabled={isLoading}
              className="signup-terms__checkbox"
            />
            <label htmlFor="agreeTerms" className="signup-terms__label">
              I agree to the{' '}
              <Link to="/terms" className="signup-terms__link">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="signup-terms__link">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.agreeTerms && (
            <p className="signup-form__error">
              <AlertIcon />
              {errors.agreeTerms}
            </p>
          )}

          {/* Submit Button */}
          <div className="signup-submit">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={isLoading || oauthLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        {/* OAuth section */}
        {(enableGoogle || enableLinkedIn) && (
          <>
            <div className="signup-divider">
              <div className="signup-divider__line" />
              <span className="signup-divider__text">Or sign up with</span>
              <div className="signup-divider__line" />
            </div>

            <div className="signup-oauth">
              {enableGoogle && (
                <button
                  type="button"
                  className="signup-oauth__button signup-oauth__button--google"
                  onClick={() => handleOAuthSignup('google')}
                  disabled={isLoading || oauthLoading !== null}
                >
                  <span className="signup-oauth__icon">
                    <GoogleIcon />
                  </span>
                  {oauthLoading === 'google'
                    ? 'Connecting to Google...'
                    : 'Continue with Google'}
                </button>
              )}

              {enableLinkedIn && (
                <button
                  type="button"
                  className="signup-oauth__button signup-oauth__button--linkedin"
                  onClick={() => handleOAuthSignup('linkedin')}
                  disabled={isLoading || oauthLoading !== null}
                >
                  <span className="signup-oauth__icon">
                    <LinkedInIcon />
                  </span>
                  {oauthLoading === 'linkedin'
                    ? 'Connecting to LinkedIn...'
                    : 'Continue with LinkedIn'}
                </button>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="signup-footer">
          <p className="signup-footer__text">
            Protected by industry-standard encryption
          </p>
        </div>
      </div>
    </div>
  );
};

SignupPage.propTypes = {
  showLogo: PropTypes.bool,
  enableGoogle: PropTypes.bool,
  enableLinkedIn: PropTypes.bool,
  showBackLink: PropTypes.bool,
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.node,
    })
  ),
  className: PropTypes.string,
};

export default SignupPage;
export { SignupPage };
