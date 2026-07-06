// =============================================================================
// AI FUNNEL PLATFORM - OnboardingPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Input, Button, Select } from '../../../components/ui';
import { completeOnboarding, createProject } from '../../../api/onboarding.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const ONBOARDING_PAGE_STYLES = `
/* Onboarding Container */
.onboarding-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.onboarding-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
  pointer-events: none;
  animation: onboarding-bg-pulse 8s ease-in-out infinite;
}

@keyframes onboarding-bg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.onboarding-page::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  animation: onboarding-bg-rotate 20s linear infinite;
}

@keyframes onboarding-bg-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Onboarding Card */
.onboarding-card {
  position: relative;
  width: 100%;
  max-width: 680px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  overflow: hidden;
  z-index: 1;
  animation: onboarding-card-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes onboarding-card-enter {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Progress Bar */
.onboarding-progress {
  height: 6px;
  background: linear-gradient(90deg, #e5e7eb 0%, #d1d5db 100%);
  position: relative;
  overflow: hidden;
}

.onboarding-progress__bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.onboarding-progress__bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: onboarding-progress-shimmer 2s infinite;
}

@keyframes onboarding-progress-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Content */
.onboarding-content {
  padding: 3rem 3rem 2.5rem;
}

/* Skip Button */
.onboarding-skip {
  position: absolute;
  top: 2rem;
  right: 2rem;
  z-index: 2;
}

.onboarding-skip__button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(107, 114, 128, 0.1);
  border: 1.5px solid rgba(107, 114, 128, 0.2);
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.onboarding-skip__button:hover {
  background: rgba(107, 114, 128, 0.15);
  border-color: rgba(107, 114, 128, 0.3);
  color: #374151;
}

/* Steps Indicator */
.onboarding-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 3rem;
}

.onboarding-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  max-width: 140px;
  position: relative;
}

.onboarding-step::after {
  content: '';
  position: absolute;
  top: 18px;
  left: calc(50% + 20px);
  width: calc(100% + 12px);
  height: 2px;
  background: #e5e7eb;
  z-index: -1;
}

.onboarding-step:last-child::after {
  display: none;
}

.onboarding-step__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 700;
  border: 3px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.onboarding-step--active .onboarding-step__circle {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.onboarding-step--completed .onboarding-step__circle {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
}

.onboarding-step--completed::after {
  background: linear-gradient(90deg, #10b981 0%, #e5e7eb 100%);
}

.onboarding-step__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-align: center;
  line-height: 1.3;
}

.onboarding-step--active .onboarding-step__label {
  color: #667eea;
}

.onboarding-step--completed .onboarding-step__label {
  color: #059669;
}

/* Step Content */
.onboarding-step-content {
  animation: onboarding-step-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes onboarding-step-enter {
  0% {
    opacity: 0;
    transform: translateX(20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Header */
.onboarding-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.onboarding-header__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  animation: onboarding-icon-float 3s ease-in-out infinite;
}

@keyframes onboarding-icon-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

.onboarding-header__icon svg {
  width: 40px;
  height: 40px;
}

.onboarding-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.onboarding-header__subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

/* Features List */
.onboarding-features {
  list-style: none;
  padding: 0;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.onboarding-features__item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1.5px solid #bfdbfe;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.onboarding-features__item:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

.onboarding-features__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  flex-shrink: 0;
}

.onboarding-features__icon svg {
  width: 24px;
  height: 24px;
}

.onboarding-features__content {
  flex: 1;
}

.onboarding-features__title {
  font-size: 0.938rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.onboarding-features__description {
  font-size: 0.813rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* Form */
.onboarding-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.onboarding-form__group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.onboarding-form__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
}

.onboarding-form__helper {
  font-size: 0.813rem;
  color: #6b7280;
  margin-top: 0.25rem;
  line-height: 1.5;
}

.onboarding-form__error {
  font-size: 0.813rem;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

.onboarding-form__error svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.onboarding-form__row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

/* Goals Selection */
.onboarding-goals {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.onboarding-goal {
  position: relative;
}

.onboarding-goal__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.onboarding-goal__label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  height: 100%;
}

.onboarding-goal__label:hover {
  border-color: #bfdbfe;
  background: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.onboarding-goal__input:checked + .onboarding-goal__label {
  border-color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
}

.onboarding-goal__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
  transition: all 0.3s ease;
}

.onboarding-goal__input:checked + .onboarding-goal__label .onboarding-goal__icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  transform: scale(1.1);
}

.onboarding-goal__icon svg {
  width: 28px;
  height: 28px;
}

.onboarding-goal__name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
}

.onboarding-goal__description {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

/* Actions */
.onboarding-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #f3f4f6;
}

.onboarding-actions button {
  flex: 1;
}

/* Success Screen */
.onboarding-success {
  text-align: center;
  padding: 2rem 0;
}

.onboarding-success__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
  margin-bottom: 2rem;
  animation: onboarding-success-scale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes onboarding-success-scale {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.onboarding-success__icon svg {
  width: 48px;
  height: 48px;
}

.onboarding-success__title {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 1rem 0;
}

.onboarding-success__message {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

/* Loading Overlay */
.onboarding-loading {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  z-index: 10;
  border-radius: 24px;
}

.onboarding-loading__spinner {
  width: 56px;
  height: 56px;
  border: 5px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: onboarding-spin 0.8s linear infinite;
}

@keyframes onboarding-spin {
  to { transform: rotate(360deg); }
}

.onboarding-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Responsive */
@media (max-width: 768px) {
  .onboarding-page {
    padding: 1.5rem 1rem;
  }
  
  .onboarding-card {
    max-width: 100%;
  }
  
  .onboarding-content {
    padding: 2rem 1.5rem;
  }
  
  .onboarding-skip {
    top: 1rem;
    right: 1rem;
  }
  
  .onboarding-steps {
    gap: 0.5rem;
  }
  
  .onboarding-step {
    max-width: 100px;
  }
  
  .onboarding-step__circle {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }
  
  .onboarding-step::after {
    top: 14px;
  }
  
  .onboarding-header__title {
    font-size: 1.75rem;
  }
  
  .onboarding-header__icon {
    width: 64px;
    height: 64px;
  }
  
  .onboarding-header__icon svg {
    width: 32px;
    height: 32px;
  }
  
  .onboarding-form__row,
  .onboarding-goals {
    grid-template-columns: 1fr;
  }
  
  .onboarding-actions {
    flex-direction: column-reverse;
  }
  
  .onboarding-actions button {
    width: 100%;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .onboarding-page::before,
  .onboarding-page::after,
  .onboarding-card,
  .onboarding-step-content,
  .onboarding-header__icon,
  .onboarding-success__icon,
  .onboarding-loading__spinner {
    animation: none !important;
  }
  
  .onboarding-features__item:hover,
  .onboarding-goal__label:hover {
    transform: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'onboarding-page');
  styleElement.textContent = ONBOARDING_PAGE_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const RocketIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const SparklesIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ChartIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const TargetIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const TrendingIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const LightbulbIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const OnboardingPage = ({
  onComplete,
  onSkip,
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    industry: '',
    companySize: '',
    goals: [],
    projectName: '',
    projectDescription: '',
  });

  const industries = [
    { value: 'technology', label: 'Technology & Software' },
    { value: 'ecommerce', label: 'E-commerce & Retail' },
    { value: 'marketing', label: 'Marketing & Advertising' },
    { value: 'consulting', label: 'Consulting & Services' },
    { value: 'education', label: 'Education & Training' },
    { value: 'healthcare', label: 'Healthcare & Medical' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'realestate', label: 'Real Estate' },
    { value: 'other', label: 'Other' },
  ];

  const companySizes = [
    { value: 'solo', label: 'Just me' },
    { value: 'small', label: '2-10 employees' },
    { value: 'medium', label: '11-50 employees' },
    { value: 'large', label: '51-200 employees' },
    { value: 'enterprise', label: '200+ employees' },
  ];

  const availableGoals = [
    { value: 'leads', label: 'Generate Leads', description: 'Capture & nurture prospects', icon: <TargetIcon /> },
    { value: 'sales', label: 'Increase Sales', description: 'Drive revenue growth', icon: <TrendingIcon /> },
    { value: 'awareness', label: 'Brand Awareness', description: 'Build your brand', icon: <SparklesIcon /> },
    { value: 'engagement', label: 'User Engagement', description: 'Connect with audience', icon: <UsersIcon /> },
  ];

  const steps = [
    { id: 0, label: 'Welcome' },
    { id: 1, label: 'Business Info' },
    { id: 2, label: 'Goals' },
    { id: 3, label: 'First Project' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleGoalToggle = (goalValue) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goalValue)
        ? prev.goals.filter((g) => g !== goalValue)
        : [...prev.goals, goalValue],
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.industry) newErrors.industry = 'Please select your industry';
      if (!formData.companySize) newErrors.companySize = 'Please select company size';
    }

    if (step === 2) {
      if (formData.goals.length === 0) newErrors.goals = 'Please select at least one goal';
    }

    if (step === 3) {
      if (!formData.projectName) newErrors.projectName = 'Project name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep > 0 && !validateStep(currentStep)) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);

    try {
      await completeOnboarding(formData);
      if (formData.projectName) {
        await createProject({
          name: formData.projectName,
          description: formData.projectDescription,
        });
      }
      onComplete?.(formData);
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`onboarding-page ${className}`} {...props}>
      <div className="onboarding-card">
        {loading && (
          <div className="onboarding-loading">
            <div className="onboarding-loading__spinner" />
            <p className="onboarding-loading__text">Setting up your account...</p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="onboarding-progress">
          <div className="onboarding-progress__bar" style={{ width: `${progress}%` }} />
        </div>

        {/* Skip Button */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div className="onboarding-skip">
            <button type="button" className="onboarding-skip__button" onClick={handleSkip}>
              Skip for now
            </button>
          </div>
        )}

        <div className="onboarding-content">
          {/* Steps Indicator */}
          {currentStep > 0 && (
            <div className="onboarding-steps">
              {steps.slice(1).map((step, index) => (
                <div
                  key={step.id}
                  className={`onboarding-step ${
                    currentStep === step.id ? 'onboarding-step--active' : ''
                  } ${currentStep > step.id ? 'onboarding-step--completed' : ''}`}
                >
                  <div className="onboarding-step__circle">
                    {currentStep > step.id ? <CheckCircleIcon /> : index + 1}
                  </div>
                  <span className="onboarding-step__label">{step.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="onboarding-step-content">
              <div className="onboarding-header">
                <div className="onboarding-header__icon">
                  <RocketIcon />
                </div>
                <h1 className="onboarding-header__title">Welcome to AI Funnel Platform!</h1>
                <p className="onboarding-header__subtitle">
                  Let's set up your account and create your first AI-powered funnel in just a few steps.
                </p>
              </div>

              <ul className="onboarding-features">
                <li className="onboarding-features__item">
                  <div className="onboarding-features__icon">
                    <SparklesIcon />
                  </div>
                  <div className="onboarding-features__content">
                    <h3 className="onboarding-features__title">AI-Powered Funnels</h3>
                    <p className="onboarding-features__description">
                      Create intelligent funnels that adapt to your audience
                    </p>
                  </div>
                </li>
                <li className="onboarding-features__item">
                  <div className="onboarding-features__icon">
                    <ChartIcon />
                  </div>
                  <div className="onboarding-features__content">
                    <h3 className="onboarding-features__title">Real-time Analytics</h3>
                    <p className="onboarding-features__description">
                      Track performance and optimize conversion rates
                    </p>
                  </div>
                </li>
                <li className="onboarding-features__item">
                  <div className="onboarding-features__icon">
                    <UsersIcon />
                  </div>
                  <div className="onboarding-features__content">
                    <h3 className="onboarding-features__title">Team Collaboration</h3>
                    <p className="onboarding-features__description">
                      Work together seamlessly with your team
                    </p>
                  </div>
                </li>
              </ul>

              <div className="onboarding-actions">
                <Button variant="primary" size="lg" fullWidth onClick={handleNext}>
                  Get Started
                </Button>
              </div>
            </div>
          )}

          {/* Step 1: Business Info */}
          {currentStep === 1 && (
            <div className="onboarding-step-content">
              <div className="onboarding-header">
                <h1 className="onboarding-header__title">Tell us about your business</h1>
                <p className="onboarding-header__subtitle">
                  This helps us personalize your experience
                </p>
              </div>

              <form className="onboarding-form">
                <div className="onboarding-form__group">
                  <label htmlFor="industry" className="onboarding-form__label">
                    What industry are you in?
                  </label>
                  <Select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    error={!!errors.industry}
                    disabled={loading}
                    placeholder="Select your industry"
                  >
                    {industries.map((industry) => (
                      <option key={industry.value} value={industry.value}>
                        {industry.label}
                      </option>
                    ))}
                  </Select>
                  {errors.industry && (
                    <p className="onboarding-form__error">
                      <AlertIcon />
                      {errors.industry}
                    </p>
                  )}
                </div>

                <div className="onboarding-form__group">
                  <label htmlFor="companySize" className="onboarding-form__label">
                    How big is your team?
                  </label>
                  <Select
                    id="companySize"
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    error={!!errors.companySize}
                    disabled={loading}
                    placeholder="Select company size"
                  >
                    {companySizes.map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </Select>
                  {errors.companySize && (
                    <p className="onboarding-form__error">
                      <AlertIcon />
                      {errors.companySize}
                    </p>
                  )}
                </div>
              </form>

              <div className="onboarding-actions">
                <Button variant="ghost" size="lg" fullWidth onClick={handleBack} disabled={loading}>
                  Back
                </Button>
                <Button variant="primary" size="lg" fullWidth onClick={handleNext} disabled={loading}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {currentStep === 2 && (
            <div className="onboarding-step-content">
              <div className="onboarding-header">
                <h1 className="onboarding-header__title">What are your main goals?</h1>
                <p className="onboarding-header__subtitle">
                  Select all that apply (you can change these later)
                </p>
              </div>

              <div className="onboarding-form">
                <div className="onboarding-form__group">
                  <div className="onboarding-goals">
                    {availableGoals.map((goal) => (
                      <div key={goal.value} className="onboarding-goal">
                        <input
                          type="checkbox"
                          id={`goal-${goal.value}`}
                          className="onboarding-goal__input"
                          checked={formData.goals.includes(goal.value)}
                          onChange={() => handleGoalToggle(goal.value)}
                          disabled={loading}
                        />
                        <label htmlFor={`goal-${goal.value}`} className="onboarding-goal__label">
                          <div className="onboarding-goal__icon">{goal.icon}</div>
                          <div className="onboarding-goal__name">{goal.label}</div>
                          <div className="onboarding-goal__description">{goal.description}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.goals && (
                    <p className="onboarding-form__error">
                      <AlertIcon />
                      {errors.goals}
                    </p>
                  )}
                </div>
              </div>

              <div className="onboarding-actions">
                <Button variant="ghost" size="lg" fullWidth onClick={handleBack} disabled={loading}>
                  Back
                </Button>
                <Button variant="primary" size="lg" fullWidth onClick={handleNext} disabled={loading}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: First Project */}
          {currentStep === 3 && (
            <div className="onboarding-step-content">
              <div className="onboarding-header">
                <h1 className="onboarding-header__title">Create your first project</h1>
                <p className="onboarding-header__subtitle">
                  Give your project a name to get started
                </p>
              </div>

              <form className="onboarding-form">
                <div className="onboarding-form__group">
                  <label htmlFor="projectName" className="onboarding-form__label">
                    Project Name
                  </label>
                  <Input
                    id="projectName"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    placeholder="e.g., Product Launch Campaign"
                    error={!!errors.projectName}
                    disabled={loading}
                    autoFocus
                  />
                  {errors.projectName && (
                    <p className="onboarding-form__error">
                      <AlertIcon />
                      {errors.projectName}
                    </p>
                  )}
                </div>

                <div className="onboarding-form__group">
                  <label htmlFor="projectDescription" className="onboarding-form__label">
                    Description (optional)
                  </label>
                  <Input
                    id="projectDescription"
                    name="projectDescription"
                    value={formData.projectDescription}
                    onChange={handleChange}
                    placeholder="Brief description of your project"
                    disabled={loading}
                  />
                  <p className="onboarding-form__helper">
                    You can add more details later in your project settings
                  </p>
                </div>
              </form>

              <div className="onboarding-actions">
                <Button variant="ghost" size="lg" fullWidth onClick={handleBack} disabled={loading}>
                  Back
                </Button>
                <Button variant="primary" size="lg" fullWidth onClick={handleNext} loading={loading}>
                  Complete Setup
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

OnboardingPage.propTypes = {
  onComplete: PropTypes.func,
  onSkip: PropTypes.func,
  className: PropTypes.string,
};

export default OnboardingPage;
export { OnboardingPage };
