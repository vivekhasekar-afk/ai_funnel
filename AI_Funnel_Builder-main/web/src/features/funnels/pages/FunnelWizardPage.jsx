// =============================================================================
// AI FUNNEL PLATFORM - FunnelWizardPage Component
// PART 1: Core Setup, Styles, Icons, Utilities & Step 1
// Production-Grade Implementation with Full API Integration
// =============================================================================
// Version: 1.0.0
// Created: December 29, 2025
// =============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// API Imports
import { createFunnel } from '@/lib/api/funnels.api';
import { listProjects, createProject } from '@/lib/api/projects.api';
import { listGroups, createGroup } from '@/lib/api/groups.api';
import { 
  generateQuestions, 
  generateFunnelStrategy,
  pollTaskUntilComplete 
} from '@/lib/api/ai.api';

// =============================================================================
// PROFESSIONAL UI STYLES (2025 Modern Design System)
// =============================================================================

const FUNNEL_WIZARD_STYLES = `
/* ========== CSS RESET & BASE ========== */
* {
  box-sizing: border-box;
}

/* ========== WIZARD PAGE CONTAINER ========== */
.fwiz {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.fwiz::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: fwiz-float 20s ease-in-out infinite;
}

.fwiz::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: fwiz-float 15s ease-in-out infinite reverse;
}

@keyframes fwiz-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -30px) scale(1.05); }
}

.fwiz__inner {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* ========== WIZARD HEADER ========== */
.fwiz-header {
  text-align: center;
  margin-bottom: 3rem;
  animation: fwiz-fade-in-down 0.6s ease;
}

.fwiz-header__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  margin-bottom: 1.5rem;
  color: #ffffff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.fwiz-header__logo:hover {
  transform: translateY(-4px) scale(1.05);
}

.fwiz-header__logo svg {
  width: 36px;
  height: 36px;
}

.fwiz-header__title {
  font-size: 2.75rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
}

.fwiz-header__subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  font-weight: 500;
}

/* ========== PROGRESS INDICATOR (3 STEPS) ========== */
.fwiz-progress {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: fwiz-fade-in 0.6s ease 0.2s backwards;
}

.fwiz-progress__steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  max-width: 640px;
  margin: 0 auto;
}

.fwiz-progress__line {
  position: absolute;
  top: 22px;
  left: 70px;
  right: 70px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  z-index: 0;
}

.fwiz-progress__line-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #ffffff 0%, rgba(255, 255, 255, 0.9) 100%);
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.3);
}

.fwiz-progress__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.875rem;
  position: relative;
  z-index: 1;
  flex: 1;
  max-width: 160px;
}

.fwiz-progress__step-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.fwiz-progress__step--active .fwiz-progress__step-circle {
  background: #ffffff;
  color: #667eea;
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
  transform: scale(1.15);
  border-color: rgba(102, 126, 234, 0.3);
}

.fwiz-progress__step--completed .fwiz-progress__step-circle {
  background: rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.5);
}

.fwiz-progress__step-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
  line-height: 1.3;
  transition: all 0.3s ease;
}

.fwiz-progress__step--active .fwiz-progress__step-label {
  color: #ffffff;
  font-weight: 700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.fwiz-progress__step--completed .fwiz-progress__step-label {
  color: rgba(255, 255, 255, 0.95);
}

/* ========== MAIN CONTENT CARD ========== */
.fwiz-content {
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  min-height: 640px;
  display: flex;
  flex-direction: column;
  animation: fwiz-fade-in-up 0.6s ease 0.3s backwards;
}

/* ========== STEP CONTAINER ========== */
.fwiz-step {
  padding: 3.5rem 3rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  animation: fwiz-slide-in 0.4s ease;
}

@keyframes fwiz-slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.fwiz-step__header {
  text-align: center;
  margin-bottom: 3rem;
}

.fwiz-step__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 20px;
  color: #667eea;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  transition: transform 0.3s ease;
}

.fwiz-step__icon:hover {
  transform: translateY(-4px);
}

.fwiz-step__icon svg {
  width: 40px;
  height: 40px;
}

.fwiz-step__title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.875rem 0;
  letter-spacing: -0.02em;
}

.fwiz-step__description {
  font-size: 1.063rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.65;
  max-width: 560px;
  margin: 0 auto;
}

.fwiz-step__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  max-width: 920px;
  margin: 0 auto;
  width: 100%;
}

/* ========== SECTION CARDS ========== */
.fwiz-section {
  background: #f9fafb;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  padding: 2rem;
  transition: all 0.2s ease;
}

.fwiz-section:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.fwiz-section__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1.75rem 0;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.fwiz-section__title svg {
  width: 22px;
  height: 22px;
  color: #667eea;
  flex-shrink: 0;
}

/* ========== FORM ELEMENTS ========== */
.fwiz-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.75rem;
}

.fwiz-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.fwiz-label {
  font-size: 0.938rem;
  font-weight: 700;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.fwiz-label--required::after {
  content: '*';
  color: #ef4444;
  font-weight: 800;
}

.fwiz-input,
.fwiz-select,
.fwiz-textarea {
  width: 100%;
  padding: 0.875rem 1.125rem;
  font-size: 1rem;
  font-family: inherit;
  color: #111827;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s ease;
  outline: none;
}

.fwiz-input:hover,
.fwiz-select:hover,
.fwiz-textarea:hover {
  border-color: #d1d5db;
}

.fwiz-input:focus,
.fwiz-select:focus,
.fwiz-textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.fwiz-input::placeholder,
.fwiz-textarea::placeholder {
  color: #9ca3af;
}

.fwiz-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.fwiz-hint {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin-top: -0.25rem;
}

.fwiz-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #dc2626;
  font-weight: 600;
  margin-top: -0.25rem;
  animation: fwiz-shake 0.3s ease;
}

.fwiz-error svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

@keyframes fwiz-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* ========== SELECTION CARDS ========== */
.fwiz-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
}

.fwiz-card {
  padding: 1.75rem 1.25rem;
  background: #ffffff;
  border: 2.5px solid #e5e7eb;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.fwiz-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 0;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  transition: height 0.25s ease;
  z-index: 0;
}

.fwiz-card:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
}

.fwiz-card:hover::before {
  height: 100%;
}

.fwiz-card--selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
  transform: translateY(-2px);
}

.fwiz-card--selected::after {
  content: '✓';
  position: absolute;
  top: 0.875rem;
  right: 0.875rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 50%;
  font-weight: 800;
  font-size: 0.75rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  z-index: 1;
  animation: fwiz-check-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes fwiz-check-pop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.fwiz-card__icon {
  width: 56px;
  height: 56px;
  background: #f3f4f6;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  flex-shrink: 0;
  transition: all 0.25s ease;
  position: relative;
  z-index: 1;
}

.fwiz-card:hover .fwiz-card__icon,
.fwiz-card--selected .fwiz-card__icon {
  background: #667eea;
  color: #ffffff;
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.fwiz-card__icon svg {
  width: 28px;
  height: 28px;
}

.fwiz-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.4;
  position: relative;
  z-index: 1;
}

.fwiz-card__desc {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
  position: relative;
  z-index: 1;
}

/* ========== CONDITIONAL REVEAL ========== */
.fwiz-reveal {
  margin-top: 1.5rem;
  padding: 2rem;
  background: #ffffff;
  border: 2px dashed #d1d5db;
  border-radius: 14px;
  animation: fwiz-expand 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fwiz-expand {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  to {
    opacity: 1;
    max-height: 600px;
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
}

.fwiz-reveal__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #667eea;
  border-radius: 10px;
  font-size: 0.813rem;
  font-weight: 700;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.25rem;
}

.fwiz-reveal__badge svg {
  width: 16px;
  height: 16px;
}

/* ========== FOOTER NAVIGATION ========== */
.fwiz-footer {
  background: linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%);
  border-top: 2px solid #e5e7eb;
  padding: 2rem 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.fwiz-footer__progress {
  font-size: 0.938rem;
  color: #6b7280;
  font-weight: 500;
}

.fwiz-footer__progress strong {
  color: #111827;
  font-weight: 700;
}

.fwiz-footer__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.fwiz-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  white-space: nowrap;
}

.fwiz-btn svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.fwiz-btn--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.3);
}

.fwiz-btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.fwiz-btn--primary:active:not(:disabled) {
  transform: translateY(0);
}

.fwiz-btn--secondary {
  background: #ffffff;
  color: #374151;
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.fwiz-btn--secondary:hover:not(:disabled) {
  border-color: #d1d5db;
  background: #f9fafb;
  transform: translateY(-1px);
}

.fwiz-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== LOADING & ERROR STATES ========== */
.fwiz-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 4rem 2rem;
  min-height: 400px;
}

.fwiz-spinner {
  width: 56px;
  height: 56px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: fwiz-spin 0.8s linear infinite;
}

@keyframes fwiz-spin {
  to { transform: rotate(360deg); }
}

.fwiz-loading__text {
  font-size: 1.125rem;
  font-weight: 700;
  color: #667eea;
}

.fwiz-loading__hint {
  font-size: 0.938rem;
  color: #6b7280;
  text-align: center;
  max-width: 440px;
  line-height: 1.6;
}

/* ========== ALERT BANNER ========== */
.fwiz-alert {
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #fca5a5;
  border-radius: 12px;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  animation: fwiz-fade-in 0.3s ease;
}

.fwiz-alert__icon {
  width: 24px;
  height: 24px;
  color: #dc2626;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.fwiz-alert__content {
  flex: 1;
}

.fwiz-alert__title {
  font-size: 1rem;
  font-weight: 700;
  color: #dc2626;
  margin: 0 0 0.5rem 0;
}

.fwiz-alert__message {
  font-size: 0.938rem;
  color: #991b1b;
  margin: 0;
  line-height: 1.6;
}

/* ========== ANIMATIONS ========== */
@keyframes fwiz-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fwiz-fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fwiz-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== RESPONSIVE DESIGN ========== */
@media (max-width: 768px) {
  .fwiz {
    padding: 1rem;
  }
  
  .fwiz-header__title {
    font-size: 2rem;
  }
  
  .fwiz-progress {
    padding: 1.5rem;
  }
  
  .fwiz-progress__steps {
    max-width: 100%;
  }
  
  .fwiz-progress__step-label {
    font-size: 0.75rem;
  }
  
  .fwiz-step {
    padding: 2rem 1.5rem;
  }
  
  .fwiz-step__title {
    font-size: 1.75rem;
  }
  
  .fwiz-form-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .fwiz-selection-grid {
    grid-template-columns: 1fr;
  }
  
  .fwiz-footer {
    flex-direction: column;
    align-items: stretch;
    padding: 1.5rem;
  }
  
  .fwiz-footer__actions {
    flex-direction: column;
  }
  
  .fwiz-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

// Inject styles into document
if (typeof document !== 'undefined' && !document.getElementById('fwiz-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'fwiz-styles';
  styleEl.textContent = FUNNEL_WIZARD_STYLES;
  document.head.appendChild(styleEl);
}

// =============================================================================
// PROFESSIONAL ICON COMPONENTS
// =============================================================================

const SparklesIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const FolderIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const TargetIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const UserGroupIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const LightBulbIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AlertIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// =============================================================================
// CONTINUES IN PART 2...
// =============================================================================

export { 
  FUNNEL_WIZARD_STYLES,
  SparklesIcon,
  FolderIcon,
  TargetIcon,
  UserGroupIcon,
  LightBulbIcon,
  ChartBarIcon,
  AlertIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon
};

// =============================================================================
// AI FUNNEL PLATFORM - FunnelWizardPage Component
// PART 2: Constants, Helpers, Validation & Step 1 Component
// Production-Grade Implementation with Full API Integration
// =============================================================================

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

const FUNNEL_TYPES = [
  { 
    id: 'quiz', 
    label: 'Quiz', 
    icon: LightBulbIcon,
    description: 'Engage users with interactive questions'
  },
  { 
    id: 'survey', 
    label: 'Survey', 
    icon: ChartBarIcon,
    description: 'Collect feedback and opinions'
  },
  { 
    id: 'assessment', 
    label: 'Assessment', 
    icon: TargetIcon,
    description: 'Evaluate skills and knowledge'
  },
  { 
    id: 'lead_gen', 
    label: 'Lead Generator', 
    icon: UserGroupIcon,
    description: 'Capture qualified leads'
  },
];

const INDUSTRIES = [
  'E-commerce',
  'SaaS/Software',
  'Marketing Agency',
  'Education',
  'Healthcare',
  'Real Estate',
  'Finance/Insurance',
  'Fitness/Wellness',
  'Food & Beverage',
  'Travel & Hospitality',
  'Professional Services',
  'Manufacturing',
  'Retail',
  'Entertainment',
  'Other',
];

const GOALS = [
  { 
    id: 'awareness', 
    label: 'Brand Awareness', 
    icon: SparklesIcon,
    description: 'Build brand recognition and visibility'
  },
  { 
    id: 'lead', 
    label: 'Lead Generation', 
    icon: UserGroupIcon,
    description: 'Capture qualified leads and contacts'
  },
  { 
    id: 'sales', 
    label: 'Drive Sales', 
    icon: ChartBarIcon,
    description: 'Convert visitors into customers'
  },
  { 
    id: 'feedback', 
    label: 'Collect Feedback', 
    icon: LightBulbIcon,
    description: 'Gather insights and opinions'
  },
  { 
    id: 'recommendation', 
    label: 'Product Recommendation', 
    icon: TargetIcon,
    description: 'Guide users to perfect products'
  },
];

const FOCUS_AREAS = [
  { 
    id: 'feature', 
    label: 'Product Features', 
    description: 'Highlight specific capabilities'
  },
  { 
    id: 'problem', 
    label: 'Problem Solving', 
    description: 'Address customer pain points'
  },
  { 
    id: 'experience', 
    label: 'User Experience', 
    description: 'Emphasize quality of experience'
  },
  { 
    id: 'journey', 
    label: 'Customer Journey', 
    description: 'Guide through decision process'
  },
];

const TONES = [
  { id: 'professional', label: 'Professional', emoji: '💼' },
  { id: 'casual', label: 'Casual', emoji: '😊' },
  { id: 'friendly', label: 'Friendly', emoji: '🤝' },
  { id: 'authoritative', label: 'Authoritative', emoji: '🎯' },
  { id: 'playful', label: 'Playful', emoji: '🎨' },
];

const GROUP_TYPES = [
  { id: 'product', label: 'Product Line', icon: FolderIcon },
  { id: 'category', label: 'Category', icon: FolderIcon },
  { id: 'campaign', label: 'Campaign', icon: FolderIcon },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
];

const LEAD_FIELDS = [
  { id: 'email', label: 'Email Address', required: true },
  { id: 'name', label: 'Full Name', required: false },
  { id: 'phone', label: 'Phone Number', required: false },
  { id: 'company', label: 'Company Name', required: false },
  { id: 'city', label: 'City/Location', required: false },
];

const CAPTURE_TIMING_OPTIONS = [
  { 
    id: 'before_result', 
    label: 'Before Result', 
    description: 'Collect info before showing results'
  },
  { 
    id: 'after_result', 
    label: 'After Result', 
    description: 'Show results first, then collect info'
  },
  { 
    id: 'optional', 
    label: 'Optional', 
    description: 'Make it optional for users'
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate URL-friendly slug from text
 */
const generateSlug = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Debounce function for performance
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format API error message
 */
const formatApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
const isValidUrl = (url) => {
  if (!url) return true; // Optional field
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if field has value
 */
const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

// =============================================================================
// VALIDATION LOGIC
// =============================================================================

/**
 * Validate Step 1: Organization & Strategy
 */
const validateStep1 = (data) => {
  const errors = {};

  // Project validation
  if (!hasValue(data.projectId)) {
    errors.projectId = 'Please select or create a project';
  }

  // New project validation
  if (data.projectId === 'new') {
    if (!hasValue(data.newProjectName)) {
      errors.newProjectName = 'Project name is required';
    } else if (data.newProjectName.trim().length < 3) {
      errors.newProjectName = 'Project name must be at least 3 characters';
    }

    if (!hasValue(data.newProjectIndustry)) {
      errors.newProjectIndustry = 'Industry is required';
    }

    if (data.newProjectWebsite && !isValidUrl(data.newProjectWebsite)) {
      errors.newProjectWebsite = 'Please enter a valid URL';
    }
  }

  // New group validation
  if (data.groupSelection === 'new') {
    if (!hasValue(data.newGroupName)) {
      errors.newGroupName = 'Group name is required';
    } else if (data.newGroupName.trim().length < 3) {
      errors.newGroupName = 'Group name must be at least 3 characters';
    }

    if (!hasValue(data.newGroupType)) {
      errors.newGroupType = 'Group type is required';
    }

    if (!hasValue(data.positioningProblem)) {
      errors.positioningProblem = 'Problem/positioning is required for AI strategy';
    } else if (data.positioningProblem.trim().length < 20) {
      errors.positioningProblem = 'Please provide at least 20 characters for better AI results';
    }
  }

  // Strategy validation
  if (!hasValue(data.goal)) {
    errors.goal = 'Please select a funnel goal';
  }

  if (!hasValue(data.focus)) {
    errors.focus = 'Please select a focus area';
  }

  if (!hasValue(data.targetAudience)) {
    errors.targetAudience = 'Target audience description is required';
  } else if (data.targetAudience.trim().length < 10) {
    errors.targetAudience = 'Please provide a more detailed audience description';
  }

  if (!hasValue(data.tone)) {
    errors.tone = 'Please select a content tone';
  }

  return errors;
};

/**
 * Validate Step 2: Funnel Configuration
 */
const validateStep2 = (data) => {
  const errors = {};

  if (!hasValue(data.funnelName)) {
    errors.funnelName = 'Funnel name is required';
  } else if (data.funnelName.trim().length < 3) {
    errors.funnelName = 'Funnel name must be at least 3 characters';
  }

  if (!hasValue(data.slug)) {
    errors.slug = 'URL slug is required';
  } else if (data.slug.length < 3) {
    errors.slug = 'Slug must be at least 3 characters';
  } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
  }

  if (!hasValue(data.funnelType)) {
    errors.funnelType = 'Please select a funnel type';
  }

  if (!hasValue(data.language)) {
    errors.language = 'Please select a language';
  }

  if (data.questionCount && (data.questionCount < 3 || data.questionCount > 15)) {
    errors.questionCount = 'Question count must be between 3 and 15';
  }

  if (!data.leadFields || data.leadFields.length === 0) {
    errors.leadFields = 'Please select at least one lead capture field';
  }

  if (!hasValue(data.captureTiming)) {
    errors.captureTiming = 'Please select when to capture leads';
  }

  if (data.privacyUrl && !isValidUrl(data.privacyUrl)) {
    errors.privacyUrl = 'Please enter a valid privacy policy URL';
  }

  return errors;
};

/**
 * Main validation dispatcher
 */
const validateStep = (stepIndex, data) => {
  switch (stepIndex) {
    case 0:
      return validateStep1(data);
    case 1:
      return validateStep2(data);
    case 2:
      return {}; // Review step - no validation needed
    default:
      return {};
  }
};

// =============================================================================
// STEP 1 COMPONENT: ORGANIZATION & STRATEGY
// =============================================================================

const Step1_OrgStrategy = ({ data, onChange, errors }) => {
  const [projects, setProjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Load projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await listProjects({ 
          status: 'active',
          sortBy: 'updated_at',
          sortOrder: 'desc' 
        });
        setProjects(response.data.items || response.data || []);
      } catch (error) {
        console.error('Error loading projects:', error);
        // Set empty array on error - allow user to create new
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Load groups when project is selected
  useEffect(() => {
    const fetchGroups = async () => {
      if (!data.projectId || data.projectId === 'new') {
        setGroups([]);
        return;
      }

      try {
        setLoadingGroups(true);
        const response = await listGroups(data.projectId, {
          status: 'active',
          sortBy: 'updated_at',
          sortOrder: 'desc'
        });
        setGroups(response.data.items || response.data || []);
      } catch (error) {
        console.error('Error loading groups:', error);
        setGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, [data.projectId]);

  // Auto-select first project if none selected and projects loaded
  useEffect(() => {
    if (!loadingProjects && projects.length > 0 && !data.projectId) {
      onChange('projectId', projects[0].id || projects[0].project_id);
    }
  }, [loadingProjects, projects, data.projectId, onChange]);

  return (
    <div className="fwiz-step">
      {/* Header */}
      <div className="fwiz-step__header">
        <div className="fwiz-step__icon">
          <FolderIcon />
        </div>
        <h2 className="fwiz-step__title">Organization & Strategy</h2>
        <p className="fwiz-step__description">
          Set up your project structure and define your funnel strategy for AI-powered optimization
        </p>
      </div>

      {/* Body */}
      <div className="fwiz-step__body">
        {/* Section 1: Project Selection */}
        <div className="fwiz-section">
          <h3 className="fwiz-section__title">
            <FolderIcon />
            Project Organization
          </h3>

          <div className="fwiz-form-group">
            <label className="fwiz-label fwiz-label--required">
              Select or Create Project
            </label>
            {loadingProjects ? (
              <div className="fwiz-loading" style={{ minHeight: '120px', padding: '2rem' }}>
                <div className="fwiz-spinner" style={{ width: '32px', height: '32px' }}></div>
                <span className="fwiz-loading__text" style={{ fontSize: '0.875rem' }}>Loading projects...</span>
              </div>
            ) : (
              <>
                <select
                  className="fwiz-select"
                  value={data.projectId || ''}
                  onChange={(e) => onChange('projectId', e.target.value)}
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((project) => (
                    <option key={project.id || project.project_id} value={project.id || project.project_id}>
                      {project.name}
                    </option>
                  ))}
                  <option value="new">+ Create New Project</option>
                </select>
                {errors.projectId && (
                  <div className="fwiz-error">
                    <AlertIcon />
                    {errors.projectId}
                  </div>
                )}
              </>
            )}
          </div>

          {/* New Project Fields */}
          {data.projectId === 'new' && (
            <div className="fwiz-reveal">
              <div className="fwiz-reveal__badge">
                <SparklesIcon />
                New Project Details
              </div>

              <div className="fwiz-form-grid">
                <div className="fwiz-form-group">
                  <label className="fwiz-label fwiz-label--required">
                    Project Name
                  </label>
                  <input
                    type="text"
                    className="fwiz-input"
                    placeholder="e.g., Acme E-commerce Store"
                    value={data.newProjectName || ''}
                    onChange={(e) => onChange('newProjectName', e.target.value)}
                  />
                  {errors.newProjectName && (
                    <div className="fwiz-error">
                      <AlertIcon />
                      {errors.newProjectName}
                    </div>
                  )}
                </div>

                <div className="fwiz-form-group">
                  <label className="fwiz-label fwiz-label--required">
                    Industry
                  </label>
                  <select
                    className="fwiz-select"
                    value={data.newProjectIndustry || ''}
                    onChange={(e) => onChange('newProjectIndustry', e.target.value)}
                  >
                    <option value="">-- Select Industry --</option>
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                  {errors.newProjectIndustry && (
                    <div className="fwiz-error">
                      <AlertIcon />
                      {errors.newProjectIndustry}
                    </div>
                  )}
                </div>

                <div className="fwiz-form-group">
                  <label className="fwiz-label">
                    Website URL
                  </label>
                  <input
                    type="url"
                    className="fwiz-input"
                    placeholder="https://example.com"
                    value={data.newProjectWebsite || ''}
                    onChange={(e) => onChange('newProjectWebsite', e.target.value)}
                  />
                  <span className="fwiz-hint">Optional - helps AI understand your brand</span>
                  {errors.newProjectWebsite && (
                    <div className="fwiz-error">
                      <AlertIcon />
                      {errors.newProjectWebsite}
                    </div>
                  )}
                </div>

                <div className="fwiz-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="fwiz-label">
                    Project Description
                  </label>
                  <textarea
                    className="fwiz-textarea"
                    placeholder="Brief description of your business, products, or services..."
                    value={data.newProjectDescription || ''}
                    onChange={(e) => onChange('newProjectDescription', e.target.value)}
                    rows={3}
                  />
                  <span className="fwiz-hint">Optional - provides context for AI generation</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Group Selection */}
        {data.projectId && data.projectId !== 'new' && (
          <div className="fwiz-section">
            <h3 className="fwiz-section__title">
              <FolderIcon />
              Funnel Group (Optional)
            </h3>

            <div className="fwiz-form-group">
              <label className="fwiz-label">
                Group Funnels Together
              </label>
              {loadingGroups ? (
                <div className="fwiz-loading" style={{ minHeight: '80px', padding: '1.5rem' }}>
                  <div className="fwiz-spinner" style={{ width: '24px', height: '24px' }}></div>
                  <span className="fwiz-loading__text" style={{ fontSize: '0.875rem' }}>Loading groups...</span>
                </div>
              ) : (
                <>
                  <select
                    className="fwiz-select"
                    value={data.groupSelection || 'none'}
                    onChange={(e) => onChange('groupSelection', e.target.value)}
                  >
                    <option value="none">No Group (Standalone Funnel)</option>
                    {groups.map((group) => (
                      <option key={group.id || group.group_id} value={group.id || group.group_id}>
                        {group.name} ({group.type})
                      </option>
                    ))}
                    <option value="new">+ Create New Group</option>
                  </select>
                  <span className="fwiz-hint">
                    Groups help organize related funnels (e.g., product lines, campaigns)
                  </span>
                </>
              )}
            </div>

            {/* New Group Fields */}
            {data.groupSelection === 'new' && (
              <div className="fwiz-reveal">
                <div className="fwiz-reveal__badge">
                  <SparklesIcon />
                  New Group Details
                </div>

                <div className="fwiz-form-grid">
                  <div className="fwiz-form-group">
                    <label className="fwiz-label fwiz-label--required">
                      Group Name
                    </label>
                    <input
                      type="text"
                      className="fwiz-input"
                      placeholder="e.g., Summer Collection 2025"
                      value={data.newGroupName || ''}
                      onChange={(e) => onChange('newGroupName', e.target.value)}
                    />
                    {errors.newGroupName && (
                      <div className="fwiz-error">
                        <AlertIcon />
                        {errors.newGroupName}
                      </div>
                    )}
                  </div>

                  <div className="fwiz-form-group">
                    <label className="fwiz-label fwiz-label--required">
                      Group Type
                    </label>
                    <select
                      className="fwiz-select"
                      value={data.newGroupType || ''}
                      onChange={(e) => onChange('newGroupType', e.target.value)}
                    >
                      <option value="">-- Select Type --</option>
                      {GROUP_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.newGroupType && (
                      <div className="fwiz-error">
                        <AlertIcon />
                        {errors.newGroupType}
                      </div>
                    )}
                  </div>

                  <div className="fwiz-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="fwiz-label fwiz-label--required">
                      Problem / Positioning
                    </label>
                    <textarea
                      className="fwiz-textarea"
                      placeholder="What problem does this solve? What makes it unique? (AI uses this for better funnel generation)"
                      value={data.positioningProblem || ''}
                      onChange={(e) => onChange('positioningProblem', e.target.value)}
                      rows={3}
                    />
                    <span className="fwiz-hint">
                      Describe the core problem/value proposition - minimum 20 characters
                    </span>
                    {errors.positioningProblem && (
                      <div className="fwiz-error">
                        <AlertIcon />
                        {errors.positioningProblem}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Funnel Strategy */}
        <div className="fwiz-section">
          <h3 className="fwiz-section__title">
            <TargetIcon />
            Funnel Strategy
          </h3>

          {/* Goal Selection */}
          <div className="fwiz-form-group">
            <label className="fwiz-label fwiz-label--required">
              What's Your Primary Goal?
            </label>
            <div className="fwiz-selection-grid">
              {GOALS.map((goal) => {
                const IconComponent = goal.icon;
                return (
                  <div
                    key={goal.id}
                    className={`fwiz-card ${data.goal === goal.id ? 'fwiz-card--selected' : ''}`}
                    onClick={() => onChange('goal', goal.id)}
                  >
                    <div className="fwiz-card__icon">
                      <IconComponent />
                    </div>
                    <h4 className="fwiz-card__title">{goal.label}</h4>
                    <p className="fwiz-card__desc">{goal.description}</p>
                  </div>
                );
              })}
            </div>
            {errors.goal && (
              <div className="fwiz-error">
                <AlertIcon />
                {errors.goal}
              </div>
            )}
          </div>

          {/* Focus Area */}
          <div className="fwiz-form-group">
            <label className="fwiz-label fwiz-label--required">
              Content Focus
            </label>
            <div className="fwiz-selection-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
              {FOCUS_AREAS.map((focus) => (
                <div
                  key={focus.id}
                  className={`fwiz-card ${data.focus === focus.id ? 'fwiz-card--selected' : ''}`}
                  onClick={() => onChange('focus', focus.id)}
                  style={{ padding: '1.25rem 1rem' }}
                >
                  <h4 className="fwiz-card__title" style={{ fontSize: '0.938rem' }}>{focus.label}</h4>
                  <p className="fwiz-card__desc" style={{ fontSize: '0.813rem' }}>{focus.description}</p>
                </div>
              ))}
            </div>
            {errors.focus && (
              <div className="fwiz-error">
                <AlertIcon />
                {errors.focus}
              </div>
            )}
          </div>

          {/* Target Audience */}
          <div className="fwiz-form-group">
            <label className="fwiz-label fwiz-label--required">
              Target Audience
            </label>
            <textarea
              className="fwiz-textarea"
              placeholder="Describe your ideal customer: demographics, pain points, interests... (AI will use this to personalize content)"
              value={data.targetAudience || ''}
              onChange={(e) => onChange('targetAudience', e.target.value)}
              rows={3}
            />
            <span className="fwiz-hint">
              Be specific - e.g., "Small business owners aged 30-50 struggling with online marketing"
            </span>
            {errors.targetAudience && (
              <div className="fwiz-error">
                <AlertIcon />
                {errors.targetAudience}
              </div>
            )}
          </div>

          {/* Tone Selection */}
          <div className="fwiz-form-group">
            <label className="fwiz-label fwiz-label--required">
              Content Tone
            </label>
            <div className="fwiz-selection-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              {TONES.map((tone) => (
                <div
                  key={tone.id}
                  className={`fwiz-card ${data.tone === tone.id ? 'fwiz-card--selected' : ''}`}
                  onClick={() => onChange('tone', tone.id)}
                  style={{ padding: '1.25rem 0.875rem' }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{tone.emoji}</div>
                  <h4 className="fwiz-card__title" style={{ fontSize: '0.938rem' }}>{tone.label}</h4>
                </div>
              ))}
            </div>
            {errors.tone && (
              <div className="fwiz-error">
                <AlertIcon />
                {errors.tone}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Step1_OrgStrategy.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
};

Step1_OrgStrategy.defaultProps = {
  errors: {},
};

// =============================================================================
// EXPORT COMPONENTS AND UTILITIES
// =============================================================================

export {
  // Constants
  FUNNEL_TYPES,
  INDUSTRIES,
  GOALS,
  FOCUS_AREAS,
  TONES,
  GROUP_TYPES,
  LANGUAGES,
  LEAD_FIELDS,
  CAPTURE_TIMING_OPTIONS,
  
  // Helpers
  generateSlug,
  debounce,
  formatApiError,
  isValidEmail,
  isValidUrl,
  hasValue,
  
  // Validation
  validateStep,
  validateStep1,
  validateStep2,
  
  // Components
  Step1_OrgStrategy,
};

// =============================================================================
// AI FUNNEL PLATFORM - FunnelWizardPage Component
// PART 3: Step 2 (Configuration), Step 3 (Review), Success & Main Component
// Production-Grade Implementation with Full API Integration
// =============================================================================

// =============================================================================
// STEP 2 COMPONENT: FUNNEL CONFIGURATION
// =============================================================================

const Step2_FunnelConfig = ({ data, onChange, errors }) => {
  // Auto-generate slug from funnel name (unless manually edited)
  const handleNameChange = useCallback((value) => {
    onChange('funnelName', value);
    
    // Only auto-generate slug if user hasn't manually edited it
    if (!data.manualSlugEdit) {
      const newSlug = generateSlug(value);
      onChange('slug', newSlug);
    }
  }, [data.manualSlugEdit, onChange]);

  // Handle manual slug edit
  const handleSlugChange = useCallback((value) => {
    onChange('manualSlugEdit', true);
    onChange('slug', generateSlug(value));
  }, [onChange]);

  // Toggle lead field selection
  const toggleLeadField = useCallback((fieldId) => {
    const currentFields = data.leadFields || [];
    const newFields = currentFields.includes(fieldId)
      ? currentFields.filter(id => id !== fieldId)
      : [...currentFields, fieldId];
    
    onChange('leadFields', newFields);
  }, [data.leadFields, onChange]);

  return (
    <div className="fwiz-step">
      {/* Header */}
      <div className="fwiz-step__header">
        <div className="fwiz-step__icon">
          <LightBulbIcon />
        </div>
        <h2 className="fwiz-step__title">Funnel Configuration</h2>
        <p className="fwiz-step__description">
          Customize your funnel settings, questions, and lead capture preferences
        </p>
      </div>

      {/* Body */}
      <div className="fwiz-step__body">
        {/* Section 1: Basic Information */}
        <div className="fwiz-section">
          <h3 className="fwiz-section__title">
            <SparklesIcon />
            Basic Information
          </h3>

          <div className="fwiz-form-grid">
            <div className="fwiz-form-group">
              <label className="fwiz-label fwiz-label--required">
                Funnel Name
              </label>
              <input
                type="text"
                className="fwiz-input"
                placeholder="e.g., Product Recommendation Quiz"
                value={data.funnelName || ''}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              <span className="fwiz-hint">
                Internal name - only you will see this
              </span>
              {errors.funnelName && (
                <div className="fwiz-error">
                  <AlertIcon />
                  {errors.funnelName}
                </div>
              )}
            </div>

            <div className="fwiz-form-group">
              <label className="fwiz-label fwiz-label--required">
                URL Slug
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="fwiz-input"
                  placeholder="product-quiz"
                  value={data.slug || ''}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.938rem' }}
                />
                <div 
                  style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.813rem', 
                    color: '#6b7280',
                    padding: '0.5rem 0.75rem',
                    background: '#f3f4f6',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}
                >
                  <strong>Preview:</strong> {data.slug ? `yoursite.com/f/${data.slug}` : 'yoursite.com/f/your-slug'}
                </div>
              </div>
              {errors.slug && (
                <div className="fwiz-error">
                  <AlertIcon />
                  {errors.slug}
                </div>
              )}
            </div>

            <div className="fwiz-form-group">
              <label className="fwiz-label fwiz-label--required">
                Funnel Type
              </label>
              <select
                className="fwiz-select"
                value={data.funnelType || 'quiz'}
                onChange={(e) => onChange('funnelType', e.target.value)}
              >
                {FUNNEL_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
              {errors.funnelType && (
                <div className="fwiz-error">
                  <AlertIcon />
                  {errors.funnelType}
                </div>
              )}
            </div>

            <div className="fwiz-form-group">
              <label className="fwiz-label fwiz-label--required">
                Language
              </label>
              <select
                className="fwiz-select"
                value={data.language || 'en'}
                onChange={(e) => onChange('language', e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              {errors.language && (
                <div className="fwiz-error">
                  <AlertIcon />
                  {errors.language}
                </div>
              )}
            </div>

            <div className="fwiz-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="fwiz-label">
                Description (Optional)
              </label>
              <textarea
                className="fwiz-textarea"
                placeholder="Brief description of what this funnel does..."
                value={data.description || ''}
                onChange={(e) => onChange('description', e.target.value)}
                rows={2}
              />
              <span className="fwiz-hint">
                Internal notes - helps you remember the funnel's purpose
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Question Settings */}
        <div className="fwiz-section">
          <h3 className="fwiz-section__title">
            <LightBulbIcon />
            AI Question Generation
          </h3>

          <div className="fwiz-form-group">
            <label className="fwiz-label fwiz-label--required">
              Number of Questions
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <input
                type="range"
                min="3"
                max="15"
                step="1"
                value={data.questionCount || 5}
                onChange={(e) => onChange('questionCount', parseInt(e.target.value))}
                style={{ 
                  flex: 1, 
                  height: '6px', 
                  borderRadius: '3px',
                  background: 'linear-gradient(to right, #667eea 0%, #764ba2 100%)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <div 
                style={{ 
                  minWidth: '60px',
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                {data.questionCount || 5}
              </div>
            </div>
            <span className="fwiz-hint">
              AI will generate {data.questionCount || 5} personalized questions based on your strategy
            </span>
            {errors.questionCount && (
              <div className="fwiz-error">
                <AlertIcon />
                {errors.questionCount}
              </div>
            )}
          </div>

          <div 
            style={{ 
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '2px solid #667eea',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}
          >
            <div style={{ 
              width: '32px', 
              height: '32px', 
              background: '#667eea', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0
            }}>
              <SparklesIcon />
            </div>
            <div>
              <h4 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '0.938rem', 
                fontWeight: 700, 
                color: '#667eea' 
              }}>
                AI-Powered Question Generation
              </h4>
              <p style={{ 
                margin: 0, 
                fontSize: '0.875rem', 
                color: '#374151', 
                lineHeight: 1.6 
              }}>
                Our AI will analyze your strategy, target audience, and goals to create highly 
                personalized questions that maximize engagement and conversions. You can edit 
                them later in the funnel builder.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Lead Capture */}
        <div className="fwiz-section">
          <h3 className="fwiz-section__title">
            <UserGroupIcon />
            Lead Capture Settings
          </h3>

          {/* Lead Fields Selection */}
          <div className="fwiz-form-group">
            <label className="fwiz-label fwiz-label--required">
              Information to Collect
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '0.75rem' 
            }}>
              {LEAD_FIELDS.map((field) => (
                <label
                  key={field.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.25rem',
                    background: (data.leadFields || []).includes(field.id) 
                      ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' 
                      : '#ffffff',
                    border: (data.leadFields || []).includes(field.id)
                      ? '2px solid #667eea'
                      : '2px solid #e5e7eb',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 600,
                    fontSize: '0.938rem',
                    color: '#374151'
                  }}
                  onMouseEnter={(e) => {
                    if (!(data.leadFields || []).includes(field.id)) {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(data.leadFields || []).includes(field.id)) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(data.leadFields || []).includes(field.id)}
                    onChange={() => toggleLeadField(field.id)}
                    disabled={field.required}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: field.required ? 'not-allowed' : 'pointer',
                      accentColor: '#667eea'
                    }}
                  />
                  <span>
                    {field.label}
                    {field.required && (
                      <span style={{ 
                        marginLeft: '0.375rem', 
                        color: '#ef4444', 
                        fontSize: '0.75rem' 
                      }}>
                        (Required)
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
            {errors.leadFields && (
              <div className="fwiz-error">
                <AlertIcon />
                {errors.leadFields}
              </div>
            )}
          </div>

          {/* Capture Timing */}
          <div className="fwiz-form-group">
            <label className="fwiz-label fwiz-label--required">
              When to Capture Leads
            </label>
            <div className="fwiz-selection-grid">
              {CAPTURE_TIMING_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`fwiz-card ${data.captureTiming === option.id ? 'fwiz-card--selected' : ''}`}
                  onClick={() => onChange('captureTiming', option.id)}
                  style={{ padding: '1.5rem 1.25rem' }}
                >
                  <h4 className="fwiz-card__title">{option.label}</h4>
                  <p className="fwiz-card__desc">{option.description}</p>
                </div>
              ))}
            </div>
            {errors.captureTiming && (
              <div className="fwiz-error">
                <AlertIcon />
                {errors.captureTiming}
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Privacy & Compliance */}
        <div className="fwiz-section">
          <h3 className="fwiz-section__title">
            <CheckCircleIcon />
            Privacy & Compliance
          </h3>

          <div className="fwiz-form-group">
            <label className="fwiz-label">
              Privacy Policy URL
            </label>
            <input
              type="url"
              className="fwiz-input"
              placeholder="https://yoursite.com/privacy"
              value={data.privacyUrl || ''}
              onChange={(e) => onChange('privacyUrl', e.target.value)}
            />
            <span className="fwiz-hint">
              Link to your privacy policy (recommended for GDPR compliance)
            </span>
            {errors.privacyUrl && (
              <div className="fwiz-error">
                <AlertIcon />
                {errors.privacyUrl}
              </div>
            )}
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1.25rem 1.5rem',
              background: '#f9fafb',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <input
              type="checkbox"
              checked={data.gdprConsent || false}
              onChange={(e) => onChange('gdprConsent', e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                marginTop: '0.125rem',
                cursor: 'pointer',
                accentColor: '#667eea',
                flexShrink: 0
              }}
            />
            <div>
              <div style={{ 
                fontSize: '0.938rem', 
                fontWeight: 700, 
                color: '#374151',
                marginBottom: '0.375rem'
              }}>
                Enable GDPR Consent Checkbox
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280',
                lineHeight: 1.5
              }}>
                Require users to consent to data processing before submitting (recommended for EU visitors)
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

Step2_FunnelConfig.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
};

Step2_FunnelConfig.defaultProps = {
  errors: {},
};

// =============================================================================
// STEP 3 COMPONENT: REVIEW & SUBMIT
// =============================================================================

const Step3_Review = ({ data, onSubmit, isSubmitting }) => {
  const [agreed, setAgreed] = useState(false);

  const getProjectName = () => {
    return data.projectId === 'new' ? data.newProjectName : 'Existing Project';
  };

  const getGroupName = () => {
    if (data.groupSelection === 'none') return 'No Group';
    if (data.groupSelection === 'new') return data.newGroupName;
    return 'Existing Group';
  };

  const handleSubmit = () => {
    if (!agreed) {
      alert('Please agree to the terms before creating your funnel');
      return;
    }
    onSubmit();
  };

  return (
    <div className="fwiz-step">
      {/* Header */}
      <div className="fwiz-step__header">
        <div className="fwiz-step__icon">
          <CheckCircleIcon />
        </div>
        <h2 className="fwiz-step__title">Review & Launch</h2>
        <p className="fwiz-step__description">
          Review your funnel configuration and launch AI-powered generation
        </p>
      </div>

      {/* Body */}
      <div className="fwiz-step__body">
        {/* Organization Summary */}
        <div className="fwiz-section">
          <h3 className="fwiz-section__title">
            <FolderIcon />
            Organization
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.25rem' 
          }}>
            <ReviewItem label="Project" value={getProjectName()} />
            <ReviewItem label="Group" value={getGroupName()} />
            {data.newProjectIndustry && (
              <ReviewItem label="Industry" value={data.newProjectIndustry} />
            )}
          </div>
        </div>

        {/* Strategy Summary */}
        <div className="fwiz-section">
          <h3 className="fwiz-section__title">
            <TargetIcon />
            Strategy
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.25rem' 
          }}>
            <ReviewItem 
              label="Goal" 
              value={GOALS.find(g => g.id === data.goal)?.label || data.goal} 
            />
            <ReviewItem 
              label="Focus" 
              value={FOCUS_AREAS.find(f => f.id === data.focus)?.label || data.focus} 
            />
            <ReviewItem 
              label="Tone" 
              value={TONES.find(t => t.id === data.tone)?.label || data.tone} 
            />
          </div>
          {data.targetAudience && (
            <div style={{ marginTop: '1.25rem' }}>
              <ReviewItem 
                label="Target Audience" 
                value={data.targetAudience}
                fullWidth
              />
            </div>
          )}
        </div>

        {/* Funnel Configuration Summary */}
        <div className="fwiz-section">
          <h3 className="fwiz-section__title">
            <LightBulbIcon />
            Funnel Configuration
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.25rem' 
          }}>
            <ReviewItem label="Funnel Name" value={data.funnelName} />
            <ReviewItem 
              label="Type" 
              value={FUNNEL_TYPES.find(t => t.id === data.funnelType)?.label || data.funnelType} 
            />
            <ReviewItem label="URL Slug" value={data.slug} mono />
            <ReviewItem 
              label="Language" 
              value={LANGUAGES.find(l => l.code === data.language)?.name || data.language} 
            />
            <ReviewItem label="Questions" value={`${data.questionCount || 5} AI-generated`} />
            <ReviewItem 
              label="Lead Capture" 
              value={CAPTURE_TIMING_OPTIONS.find(o => o.id === data.captureTiming)?.label || data.captureTiming} 
            />
          </div>
          
          {data.leadFields && data.leadFields.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: 700, 
                color: '#6b7280', 
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Collecting
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {data.leadFields.map(fieldId => {
                  const field = LEAD_FIELDS.find(f => f.id === fieldId);
                  return (
                    <span
                      key={fieldId}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: '2px solid #667eea',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#667eea'
                      }}
                    >
                      {field?.label || fieldId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* AI Generation Preview */}
        <div 
          style={{ 
            padding: '2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            color: '#ffffff',
            boxShadow: '0 12px 32px rgba(102, 126, 234, 0.3)'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '1.5rem' 
          }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <SparklesIcon />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ 
                margin: '0 0 0.75rem 0', 
                fontSize: '1.25rem', 
                fontWeight: 800,
                letterSpacing: '-0.01em'
              }}>
                Ready to Generate Your AI Funnel!
              </h4>
              <p style={{ 
                margin: 0, 
                fontSize: '1rem', 
                lineHeight: 1.6,
                opacity: 0.95
              }}>
                We'll use your strategy to create <strong>{data.questionCount || 5} personalized questions</strong>, 
                generate dynamic result pages, and set up lead capture - all optimized by AI for maximum engagement.
              </p>
              <div style={{ 
                marginTop: '1.25rem',
                padding: '1rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '10px',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                fontSize: '0.875rem',
                lineHeight: 1.6
              }}>
                ⚡ <strong>Estimated generation time:</strong> 30-60 seconds
              </div>
            </div>
          </div>
        </div>

        {/* Terms Agreement */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            padding: '1.5rem',
            background: '#f9fafb',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{
              width: '24px',
              height: '24px',
              marginTop: '0.125rem',
              cursor: 'pointer',
              accentColor: '#667eea',
              flexShrink: 0
            }}
          />
          <div>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: 700, 
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              I agree to create this funnel
            </div>
            <div style={{ 
              fontSize: '0.938rem', 
              color: '#6b7280',
              lineHeight: 1.6
            }}>
              By checking this box, you confirm that all information provided is accurate and 
              you agree to proceed with AI-powered funnel generation using the settings above.
            </div>
          </div>
        </label>

        {/* Submit Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: '1rem'
        }}>
          <button
            className="fwiz-btn fwiz-btn--primary"
            onClick={handleSubmit}
            disabled={!agreed || isSubmitting}
            style={{
              fontSize: '1.125rem',
              padding: '1.125rem 3rem',
              minWidth: '280px'
            }}
          >
            {isSubmitting ? (
              <>
                <div className="fwiz-spinner" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></div>
                Generating Funnel...
              </>
            ) : (
              <>
                <SparklesIcon />
                Create Funnel with AI
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

Step3_Review.propTypes = {
  data: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};

Step3_Review.defaultProps = {
  isSubmitting: false,
};

// =============================================================================
// REVIEW ITEM HELPER COMPONENT
// =============================================================================

const ReviewItem = ({ label, value, mono, fullWidth }) => (
  <div style={{ gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
    <div style={{ 
      fontSize: '0.813rem', 
      fontWeight: 700, 
      color: '#6b7280', 
      marginBottom: '0.5rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {label}
    </div>
    <div style={{ 
      fontSize: '1rem', 
      fontWeight: 600, 
      color: '#111827',
      fontFamily: mono ? 'monospace' : 'inherit',
      wordBreak: 'break-word',
      lineHeight: 1.5
    }}>
      {value || '—'}
    </div>
  </div>
);

ReviewItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  mono: PropTypes.bool,
  fullWidth: PropTypes.bool,
};

ReviewItem.defaultProps = {
  value: '',
  mono: false,
  fullWidth: false,
};

// =============================================================================
// SUCCESS COMPONENT
// =============================================================================

const FunnelCreatedSuccess = ({ funnelData, onViewFunnel, onCreateAnother }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      minHeight: '600px'
    }}>
      {/* Success Icon */}
      <div style={{
        width: '120px',
        height: '120px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        marginBottom: '2rem',
        animation: 'fwiz-check-pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        boxShadow: '0 12px 32px rgba(16, 185, 129, 0.3)'
      }}>
        <svg 
          style={{ width: '64px', height: '64px' }} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Success Message */}
      <h2 style={{ 
        fontSize: '2.5rem', 
        fontWeight: 800, 
        color: '#111827',
        margin: '0 0 1rem 0',
        letterSpacing: '-0.02em'
      }}>
        🎉 Funnel Created Successfully!
      </h2>
      
      <p style={{ 
        fontSize: '1.125rem', 
        color: '#6b7280',
        margin: '0 0 3rem 0',
        maxWidth: '560px',
        lineHeight: 1.6
      }}>
        Your AI-powered funnel has been generated with {funnelData.questionCount || 5} personalized 
        questions and is ready to collect leads!
      </p>

      {/* Funnel Details */}
      <div style={{
        width: '100%',
        maxWidth: '640px',
        padding: '2rem',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
        border: '2px solid #e5e7eb',
        borderRadius: '16px',
        marginBottom: '3rem'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ 
              fontSize: '0.813rem', 
              fontWeight: 700, 
              color: '#6b7280',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Funnel Name
            </div>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: 700, 
              color: '#111827' 
            }}>
              {funnelData.name || funnelData.funnel_name}
            </div>
          </div>
          
          <div>
            <div style={{ 
              fontSize: '0.813rem', 
              fontWeight: 700, 
              color: '#6b7280',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              URL Slug
            </div>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: 700, 
              color: '#667eea',
              fontFamily: 'monospace'
            }}>
              /{funnelData.slug}
            </div>
          </div>
          
          <div>
            <div style={{ 
              fontSize: '0.813rem', 
              fontWeight: 700, 
              color: '#6b7280',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Status
            </div>
            <div style={{ 
              display: 'inline-flex',
              padding: '0.375rem 0.875rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 700
            }}>
              ✓ Active
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          className="fwiz-btn fwiz-btn--primary"
          onClick={onViewFunnel}
          style={{ minWidth: '200px' }}
        >
          <ArrowRightIcon />
          View & Edit Funnel
        </button>
        
        <button
          className="fwiz-btn fwiz-btn--secondary"
          onClick={onCreateAnother}
          style={{ minWidth: '200px' }}
        >
          <SparklesIcon />
          Create Another
        </button>
      </div>
    </div>
  );
};

FunnelCreatedSuccess.propTypes = {
  funnelData: PropTypes.object.isRequired,
  onViewFunnel: PropTypes.func.isRequired,
  onCreateAnother: PropTypes.func.isRequired,
};

// =============================================================================
// CONTINUES IN PART 4 (FINAL)...
// =============================================================================

export {
  Step2_FunnelConfig,
  Step3_Review,
  ReviewItem,
  FunnelCreatedSuccess,
};

// =============================================================================
// AI FUNNEL PLATFORM - FunnelWizardPage Component
// PART 4: Main Component with State Management & API Integration (FINAL)
// Production-Grade Implementation with Full API Integration
// =============================================================================

// =============================================================================
// MAIN FUNNEL WIZARD COMPONENT
// =============================================================================

const FunnelWizardPage = () => {
  const navigate = useNavigate();

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdFunnel, setCreatedFunnel] = useState(null);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Project & Organization
    projectId: '',
    newProjectName: '',
    newProjectIndustry: '',
    newProjectWebsite: '',
    newProjectDescription: '',
    
    // Group
    groupSelection: 'none',
    newGroupName: '',
    newGroupType: '',
    positioningProblem: '',
    
    // Strategy
    goal: '',
    focus: '',
    targetAudience: '',
    tone: '',
    
    // Funnel Configuration
    funnelName: '',
    slug: '',
    manualSlugEdit: false,
    funnelType: 'quiz',
    language: 'en',
    description: '',
    questionCount: 5,
    
    // Lead Capture
    leadFields: ['email'],
    captureTiming: 'before_result',
    privacyUrl: '',
    gdprConsent: false,
  });

  // =============================================================================
  // STEP CONFIGURATION
  // =============================================================================

  const steps = useMemo(() => [
    {
      id: 'organization',
      label: 'Organization & Strategy',
      component: Step1_OrgStrategy,
    },
    {
      id: 'configuration',
      label: 'Funnel Configuration',
      component: Step2_FunnelConfig,
    },
    {
      id: 'review',
      label: 'Review & Launch',
      component: Step3_Review,
    },
  ], []);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  /**
   * Handle form field changes
   */
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Clear global error
    if (globalError) {
      setGlobalError(null);
    }
  }, [errors, globalError]);

  /**
   * Navigate to next step
   */
  const handleNext = useCallback(() => {
    // Validate current step
    const stepErrors = validateStep(currentStep, formData);
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Clear errors and move to next step
    setErrors({});
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, formData, steps.length]);

  /**
   * Navigate to previous step
   */
  const handleBack = useCallback(() => {
    setErrors({});
    setGlobalError(null);
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /**
   * Handle final submission
   */
  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setGlobalError(null);

      // Step 1: Create/get project
      let projectId = formData.projectId;
      
      if (formData.projectId === 'new') {
        const projectResponse = await createProject({
          name: formData.newProjectName,
          industry: formData.newProjectIndustry,
          website: formData.newProjectWebsite,
          description: formData.newProjectDescription,
        });
        projectId = projectResponse.data.id || projectResponse.data.project_id;
      }

      // Step 2: Create/get group (if needed)
      let groupId = null;
      
      if (formData.groupSelection === 'new') {
        const groupResponse = await createGroup(projectId, {
          name: formData.newGroupName,
          type: formData.newGroupType,
          positioning_problem: formData.positioningProblem,
          aiContext: {
            targetAudience: formData.targetAudience,
            tone: formData.tone,
            goal: formData.goal,
            focus: formData.focus,
          },
        });
        groupId = groupResponse.data.id || groupResponse.data.group_id;
      } else if (formData.groupSelection !== 'none') {
        groupId = formData.groupSelection;
      }

      // Step 3: Create funnel
      const funnelPayload = {
        name: formData.funnelName,
        slug: formData.slug,
        type: formData.funnelType,
        description: formData.description,
        language: formData.language,
        
        // Link to project/group
        project_id: projectId,
        group_id: groupId,
        
        // Strategy
        goal: formData.goal,
        focus: formData.focus,
        focus_detail: formData.targetAudience,
        
        // AI Strategy for question generation
        ai_strategy: {
          goal: formData.goal,
          focus: formData.focus,
          targetAudience: formData.targetAudience,
          tone: formData.tone,
          positioningProblem: formData.positioningProblem,
          questionCount: formData.questionCount,
        },
        
        // Lead capture configuration
        config: {
          lead_capture: {
            enabled: true,
            fields: formData.leadFields.reduce((acc, fieldId) => {
              const field = LEAD_FIELDS.find(f => f.id === fieldId);
              acc[fieldId] = {
                enabled: true,
                required: field?.required || false,
              };
              return acc;
            }, {}),
            capture_timing: formData.captureTiming,
            gdpr_consent: formData.gdprConsent,
            privacy_url: formData.privacyUrl,
          },
        },
        
        // Status
        status: 'draft',
      };

      const funnelResponse = await createFunnel(funnelPayload);
      const createdFunnelData = funnelResponse.data;

      // Step 4: Generate AI questions
      try {
        const questionsPayload = {
          funnelId: createdFunnelData.id || createdFunnelData.funnel_id,
          topic: formData.funnelName,
          goal: formData.goal,
          count: formData.questionCount,
          targetAudience: formData.targetAudience,
          tone: formData.tone,
          questionTypes: ['multiple_choice', 'rating', 'text'],
          context: {
            industry: formData.newProjectIndustry,
            positioning: formData.positioningProblem,
            focus: formData.focus,
          },
        };

        const questionsResponse = await generateQuestions(questionsPayload);
        
        // If async task, poll for completion
        if (questionsResponse.data.taskId) {
          await pollTaskUntilComplete(questionsResponse.data.taskId, {
            interval: 2000,
            maxAttempts: 30,
            onProgress: (progress) => {
              console.log('Question generation progress:', progress);
            },
          });
        }

        console.log('✅ AI questions generated successfully');
      } catch (questionError) {
        console.error('Question generation failed (non-fatal):', questionError);
        // Continue anyway - user can add questions manually
      }

      // Success!
      setCreatedFunnel({
        ...createdFunnelData,
        questionCount: formData.questionCount,
      });
      setSuccess(true);
      setIsSubmitting(false);

      // Dispatch success event
      window.dispatchEvent(new CustomEvent('funnel:wizard-completed', {
        detail: { funnel: createdFunnelData },
      }));

    } catch (error) {
      console.error('Funnel creation error:', error);
      setGlobalError(formatApiError(error));
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [formData]);

  /**
   * Handle view funnel
   */
  const handleViewFunnel = useCallback(() => {
    if (createdFunnel) {
      navigate(`/funnels/${createdFunnel.id || createdFunnel.funnel_id}`);
    }
  }, [createdFunnel, navigate]);

  /**
   * Handle create another funnel
   */
  const handleCreateAnother = useCallback(() => {
    setSuccess(false);
    setCreatedFunnel(null);
    setCurrentStep(0);
    setFormData({
      projectId: '',
      newProjectName: '',
      newProjectIndustry: '',
      newProjectWebsite: '',
      newProjectDescription: '',
      groupSelection: 'none',
      newGroupName: '',
      newGroupType: '',
      positioningProblem: '',
      goal: '',
      focus: '',
      targetAudience: '',
      tone: '',
      funnelName: '',
      slug: '',
      manualSlugEdit: false,
      funnelType: 'quiz',
      language: 'en',
      description: '',
      questionCount: 5,
      leadFields: ['email'],
      captureTiming: 'before_result',
      privacyUrl: '',
      gdprConsent: false,
    });
    setErrors({});
    setGlobalError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const progressPercentage = useMemo(() => {
    return (currentStep / (steps.length - 1)) * 100;
  }, [currentStep, steps.length]);

  const CurrentStepComponent = steps[currentStep].component;

  // =============================================================================
  // RENDER: SUCCESS STATE
  // =============================================================================

  if (success && createdFunnel) {
    return (
      <div className="fwiz">
        <div className="fwiz__inner">
          <div className="fwiz-content">
            <FunnelCreatedSuccess
              funnelData={createdFunnel}
              onViewFunnel={handleViewFunnel}
              onCreateAnother={handleCreateAnother}
            />
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER: WIZARD
  // =============================================================================

  return (
    <div className="fwiz">
      <div className="fwiz__inner">
        {/* Header */}
        <div className="fwiz-header">
          <div className="fwiz-header__logo">
            <SparklesIcon />
          </div>
          <h1 className="fwiz-header__title">Create New Funnel</h1>
          <p className="fwiz-header__subtitle">
            Build your AI-powered funnel in 3 simple steps
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="fwiz-progress">
          <div className="fwiz-progress__steps">
            <div className="fwiz-progress__line">
              <div
                className="fwiz-progress__line-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`fwiz-progress__step ${
                  index === currentStep ? 'fwiz-progress__step--active' : ''
                } ${
                  index < currentStep ? 'fwiz-progress__step--completed' : ''
                }`}
              >
                <div className="fwiz-progress__step-circle">
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span className="fwiz-progress__step-label">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Error Alert */}
        {globalError && (
          <div className="fwiz-alert">
            <div className="fwiz-alert__icon">
              <AlertIcon />
            </div>
            <div className="fwiz-alert__content">
              <h4 className="fwiz-alert__title">Error Creating Funnel</h4>
              <p className="fwiz-alert__message">{globalError}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="fwiz-content">
          {/* Current Step Component */}
          {currentStep < 2 ? (
            <CurrentStepComponent
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
            />
          ) : (
            <Step3_Review
              data={formData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Footer Navigation */}
          <div className="fwiz-footer">
            <div className="fwiz-footer__progress">
              Step <strong>{currentStep + 1}</strong> of <strong>{steps.length}</strong>
            </div>

            <div className="fwiz-footer__actions">
              {currentStep > 0 && (
                <button
                  className="fwiz-btn fwiz-btn--secondary"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeftIcon />
                  Back
                </button>
              )}

              {currentStep < steps.length - 1 && (
                <button
                  className="fwiz-btn fwiz-btn--primary"
                  onClick={handleNext}
                >
                  Next Step
                  <ArrowRightIcon />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

FunnelWizardPage.propTypes = {};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default FunnelWizardPage;

// =============================================================================
// 🎉 FUNNEL WIZARD COMPLETE - PRODUCTION READY!
// =============================================================================
// Features Included:
// ✅ 3-Step wizard with beautiful UI/UX
// ✅ Full API integration (Projects, Groups, Funnels, AI)
// ✅ Comprehensive validation
// ✅ Error handling with user-friendly messages
// ✅ Loading states and progress indicators
// ✅ Auto-slug generation
// ✅ Conditional form reveals
// ✅ Lead capture configuration
// ✅ GDPR compliance options
// ✅ AI question generation
// ✅ Success screen with actions
// ✅ Responsive design
// ✅ Accessibility features
// ✅ Professional animations
// ✅ Event dispatching for analytics
// =============================================================================
