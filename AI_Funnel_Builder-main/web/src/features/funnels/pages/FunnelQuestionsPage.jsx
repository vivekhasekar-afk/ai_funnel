// =============================================================================
// AI FUNNEL PLATFORM - FunnelQuestionsPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Button, Select, Textarea, Checkbox } from '../../../components/ui';
import { 
  getQuestions, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion, 
  bulkReorderQuestions,
  duplicateQuestion 
} from '../../../api/questions.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const FUNNEL_QUESTIONS_STYLES = `
/* Questions Page Container */
.funnel-questions-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.funnel-questions-page__inner {
  max-width: 1400px;
  margin: 0 auto;
}

/* Breadcrumb */
.questions-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.questions-breadcrumb__link {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s ease;
}

.questions-breadcrumb__link:hover {
  color: #667eea;
}

.questions-breadcrumb__separator {
  color: #d1d5db;
}

.questions-breadcrumb__current {
  color: #111827;
  font-weight: 600;
}

/* Header */
.questions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.questions-header__content {
  flex: 1;
  min-width: 200px;
}

.questions-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.questions-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.questions-header__actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

/* Toolbar */
.questions-toolbar {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.questions-toolbar__left {
  flex: 1;
  min-width: 200px;
}

.questions-toolbar__count {
  font-size: 0.938rem;
  color: #6b7280;
}

.questions-toolbar__count strong {
  color: #111827;
  font-weight: 700;
}

.questions-toolbar__right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.questions-toolbar__bulk {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.questions-toolbar__bulk-info {
  font-size: 0.875rem;
  font-weight: 600;
  color: #667eea;
}

/* Questions List */
.questions-list {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 2rem;
}

.questions-list__header {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  padding: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.questions-list__header-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.questions-list__body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Question Item */
.question-item {
  background: linear-gradient(135deg, #fafbfc 0%, #f9fafb 100%);
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.3s ease;
  cursor: move;
}

.question-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  transform: translateX(4px);
}

.question-item--dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.question-item--selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.question-item__drag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #9ca3af;
  cursor: grab;
  flex-shrink: 0;
}

.question-item__drag:active {
  cursor: grabbing;
}

.question-item__drag svg {
  width: 20px;
  height: 20px;
}

.question-item__checkbox {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.question-item__checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.question-item__number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
}

.question-item__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.question-item__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.question-item__text {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.5;
}

.question-item__badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.question-item__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.question-item__badge--type {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
}

.question-item__badge--required {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.question-item__badge--logic {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.question-item__meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-size: 0.813rem;
  color: #6b7280;
}

.question-item__meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.question-item__meta-item svg {
  width: 14px;
  height: 14px;
}

.question-item__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.question-item__action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #ffffff;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.question-item__action-button:hover {
  background: #667eea;
  color: #ffffff;
}

.question-item__action-button--danger:hover {
  background: #dc2626;
  color: #ffffff;
}

.question-item__action-button svg {
  width: 16px;
  height: 16px;
}

/* Modal */
.question-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  animation: question-modal-enter 0.3s ease-out;
}

@keyframes question-modal-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}

.question-modal__content {
  background: #ffffff;
  border-radius: 20px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: question-modal-content-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes question-modal-content-enter {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.question-modal__header {
  padding: 2rem 2.5rem;
  border-bottom: 2px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.question-modal__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.question-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: #f9fafb;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.question-modal__close:hover {
  background: #f3f4f6;
  color: #111827;
}

.question-modal__close svg {
  width: 20px;
  height: 20px;
}

.question-modal__body {
  padding: 2.5rem;
  overflow-y: auto;
  flex: 1;
}

.question-modal__form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.question-modal__section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-modal__section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f3f4f6;
}

.question-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.question-form-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
}

.question-form-label--required::after {
  content: '*';
  color: #dc2626;
  margin-left: 0.25rem;
}

.question-form-hint {
  font-size: 0.813rem;
  color: #6b7280;
  margin-top: -0.375rem;
}

.question-form-error {
  font-size: 0.813rem;
  color: #dc2626;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.question-form-error svg {
  width: 14px;
  height: 14px;
}

/* Answer Options */
.answer-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.answer-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
}

.answer-option__drag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #9ca3af;
  cursor: grab;
  flex-shrink: 0;
}

.answer-option__drag svg {
  width: 16px;
  height: 16px;
}

.answer-option__input {
  flex: 1;
}

.answer-option__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #9ca3af;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.answer-option__remove:hover {
  background: #fee2e2;
  color: #dc2626;
}

.answer-option__remove svg {
  width: 16px;
  height: 16px;
}

.answer-options__add {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.answer-options__add:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f0f9ff;
}

.answer-options__add svg {
  width: 16px;
  height: 16px;
}

/* Media Upload */
.media-upload {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.media-upload__dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.media-upload__dropzone:hover {
  border-color: #667eea;
  background: #f0f9ff;
}

.media-upload__dropzone--active {
  border-color: #667eea;
  background: #eff6ff;
}

.media-upload__icon {
  width: 48px;
  height: 48px;
  color: #9ca3af;
}

.media-upload__icon svg {
  width: 100%;
  height: 100%;
}

.media-upload__text {
  font-size: 0.938rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.media-upload__hint {
  font-size: 0.813rem;
  color: #6b7280;
  margin: 0;
}

.media-upload__preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.media-upload__preview img {
  width: 100%;
  height: auto;
  display: block;
}

.media-upload__preview-remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.media-upload__preview-remove:hover {
  background: #dc2626;
}

.media-upload__preview-remove svg {
  width: 18px;
  height: 18px;
}

/* Logic Editor */
.logic-editor {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.logic-editor__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logic-editor__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #ffffff;
  border-radius: 8px;
  color: #f59e0b;
}

.logic-editor__icon svg {
  width: 20px;
  height: 20px;
}

.logic-editor__title {
  font-size: 1rem;
  font-weight: 700;
  color: #78350f;
  margin: 0;
}

.logic-rule {
  background: #ffffff;
  border: 2px solid #fbbf24;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.logic-rule__row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 0.75rem;
  align-items: end;
}

.logic-rule__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: #fef3c7;
  color: #92400e;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logic-rule__remove:hover {
  background: #fee2e2;
  color: #dc2626;
}

.logic-rule__remove svg {
  width: 16px;
  height: 16px;
}

.logic-editor__add {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #ffffff;
  border: 2px dashed #fbbf24;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.logic-editor__add:hover {
  border-color: #f59e0b;
  background: #fffbeb;
}

.logic-editor__add svg {
  width: 16px;
  height: 16px;
}

/* Modal Footer */
.question-modal__footer {
  padding: 1.5rem 2.5rem;
  border-top: 2px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

/* Empty State */
.questions-empty {
  text-align: center;
  padding: 4rem 2rem;
  background: #ffffff;
  border-radius: 16px;
  border: 2px dashed #e5e7eb;
}

.questions-empty__icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  color: #d1d5db;
}

.questions-empty__icon svg {
  width: 100%;
  height: 100%;
}

.questions-empty__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.questions-empty__message {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

/* Loading */
.questions-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.questions-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: questions-spin 0.8s linear infinite;
}

@keyframes questions-spin {
  to { transform: rotate(360deg); }
}

.questions-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Responsive */
@media (max-width: 768px) {
  .funnel-questions-page {
    padding: 1.5rem 1rem;
  }
  
  .questions-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .questions-header__title {
    font-size: 1.75rem;
  }
  
  .questions-header__actions {
    width: 100%;
  }
  
  .questions-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .question-item {
    flex-wrap: wrap;
  }
  
  .question-item__actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .question-modal__content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .question-modal__header,
  .question-modal__body,
  .question-modal__footer {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  
  .logic-rule__row {
    grid-template-columns: 1fr;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .questions-loading__spinner,
  .question-modal,
  .question-modal__content {
    animation: none !important;
  }
  
  .question-item:hover {
    transform: none;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'funnel-questions');
  styleElement.textContent = FUNNEL_QUESTIONS_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const QuestionIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const DragIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
  </svg>
);

const EditIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const CopyIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CloseIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ImageIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LightningIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const AlertIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const EyeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const FunnelQuestionsPage = ({ className = '', ...props }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    injectStyles();
  }, []);

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    text: '',
    type: 'text',
    required: false,
    description: '',
    placeholder: '',
    options: [],
    media: null,
    logic: [],
  });

  const [errors, setErrors] = useState({});

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getQuestions(id);
      setQuestions(data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleOpenModal = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        text: question.text,
        type: question.type,
        required: question.required || false,
        description: question.description || '',
        placeholder: question.placeholder || '',
        options: question.options || [],
        media: question.media || null,
        logic: question.logic || [],
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        text: '',
        type: 'text',
        required: false,
        description: '',
        placeholder: '',
        options: [],
        media: null,
        logic: [],
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
    setFormData({
      text: '',
      type: 'text',
      required: false,
      description: '',
      placeholder: '',
      options: [],
      media: null,
      logic: [],
    });
    setErrors({});
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleAddOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { id: Date.now(), label: '', value: '' }],
    }));
  };

  const handleUpdateOption = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const handleRemoveOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('media', { url: reader.result, type: file.type, name: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMedia = () => {
    handleChange('media', null);
  };

  const handleAddLogicRule = () => {
    setFormData((prev) => ({
      ...prev,
      logic: [
        ...prev.logic,
        { id: Date.now(), condition: 'equals', value: '', action: 'skip', target: '' },
      ],
    }));
  };

  const handleUpdateLogicRule = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      logic: prev.logic.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      ),
    }));
  };

  const handleRemoveLogicRule = (index) => {
    setFormData((prev) => ({
      ...prev,
      logic: prev.logic.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.text.trim()) {
      newErrors.text = 'Question text is required';
    }

    if (['radio', 'checkbox', 'dropdown'].includes(formData.type)) {
      if (formData.options.length === 0) {
        newErrors.options = 'At least one option is required';
      } else if (formData.options.some((opt) => !opt.label.trim())) {
        newErrors.options = 'All options must have a label';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, formData);
      } else {
        await createQuestion(id, formData);
      }
      handleCloseModal();
      fetchQuestions();
    } catch (error) {
      console.error('Failed to save question:', error);
      setErrors({ submit: 'Failed to save question' });
    }
  };

  const handleDuplicate = async (question) => {
    try {
      await duplicateQuestion(question.id);
      fetchQuestions();
    } catch (error) {
      console.error('Failed to duplicate question:', error);
    }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;

    try {
      await deleteQuestion(questionId);
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedQuestions.length} question(s)?`)) return;

    try {
      await Promise.all(selectedQuestions.map((qid) => deleteQuestion(qid)));
      setSelectedQuestions([]);
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete questions:', error);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedQuestions(questions.map((q) => q.id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleSelectQuestion = (questionId) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...questions];
    const draggedQuestion = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedQuestion);

    setQuestions(newQuestions);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      const reorderedIds = questions.map((q) => q.id);
      await bulkReorderQuestions(id, { questionIds: reorderedIds });
      setDraggedIndex(null);
    } catch (error) {
      console.error('Failed to reorder questions:', error);
      fetchQuestions();
    }
  };

  const questionTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'radio', label: 'Multiple Choice (Single)' },
    { value: 'checkbox', label: 'Multiple Choice (Multi)' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'date', label: 'Date' },
    { value: 'rating', label: 'Rating' },
  ];

  if (loading) {
    return (
      <div className="funnel-questions-page">
        <div className="funnel-questions-page__inner">
          <div className="questions-loading">
            <div className="questions-loading__spinner" />
            <p className="questions-loading__text">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`funnel-questions-page ${className}`} {...props}>
      <div className="funnel-questions-page__inner">
        {/* Breadcrumb */}
        <div className="questions-breadcrumb">
          <a href="/funnels" className="questions-breadcrumb__link">Funnels</a>
          <span className="questions-breadcrumb__separator">/</span>
          <a href={`/funnels/${id}`} className="questions-breadcrumb__link">Funnel</a>
          <span className="questions-breadcrumb__separator">/</span>
          <span className="questions-breadcrumb__current">Questions</span>
        </div>

        {/* Header */}
        <div className="questions-header">
          <div className="questions-header__content">
            <h1 className="questions-header__title">Questions</h1>
            <p className="questions-header__subtitle">
              Manage and organize your funnel questions
            </p>
          </div>
          <div className="questions-header__actions">
            <Button variant="primary" size="md" onClick={() => handleOpenModal()} leftIcon={<PlusIcon />}>
              Add Question
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        {questions.length > 0 && (
          <div className="questions-toolbar">
            <div className="questions-toolbar__left">
              <p className="questions-toolbar__count">
                <strong>{questions.length}</strong> {questions.length === 1 ? 'question' : 'questions'}
              </p>
            </div>
            <div className="questions-toolbar__right">
              {selectedQuestions.length > 0 ? (
                <div className="questions-toolbar__bulk">
                  <div className="questions-toolbar__bulk-info">
                    {selectedQuestions.length} selected
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleBulkDelete} leftIcon={<TrashIcon />}>
                    Delete
                  </Button>
                </div>
              ) : (
                <Checkbox
                  checked={selectedQuestions.length === questions.length}
                  onChange={handleSelectAll}
                  label="Select All"
                />
              )}
            </div>
          </div>
        )}

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="questions-empty">
            <div className="questions-empty__icon">
              <QuestionIcon />
            </div>
            <h3 className="questions-empty__title">No Questions Yet</h3>
            <p className="questions-empty__message">
              Get started by adding your first question to this funnel
            </p>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              Add Your First Question
            </Button>
          </div>
        ) : (
          <div className="questions-list">
            <div className="questions-list__header">
              <h2 className="questions-list__header-title">Question List</h2>
            </div>
            <div className="questions-list__body">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`question-item ${draggedIndex === index ? 'question-item--dragging' : ''} ${selectedQuestions.includes(question.id) ? 'question-item--selected' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="question-item__drag">
                    <DragIcon />
                  </div>
                  <div className="question-item__checkbox">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question.id)}
                      onChange={() => handleSelectQuestion(question.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="question-item__number">{index + 1}</div>
                  <div className="question-item__content">
                    <div className="question-item__header">
                      <p className="question-item__text">{question.text}</p>
                      <div className="question-item__badges">
                        <span className="question-item__badge question-item__badge--type">
                          {question.type}
                        </span>
                        {question.required && (
                          <span className="question-item__badge question-item__badge--required">
                            Required
                          </span>
                        )}
                        {question.logic && question.logic.length > 0 && (
                          <span className="question-item__badge question-item__badge--logic">
                            Logic
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="question-item__meta">
                      {question.options && question.options.length > 0 && (
                        <div className="question-item__meta-item">
                          <CheckIcon />
                          {question.options.length} options
                        </div>
                      )}
                      {question.media && (
                        <div className="question-item__meta-item">
                          <ImageIcon />
                          Has media
                        </div>
                      )}
                      {question.views !== undefined && (
                        <div className="question-item__meta-item">
                          <EyeIcon />
                          {question.views} views
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="question-item__actions">
                    <button
                      className="question-item__action-button"
                      onClick={() => handleOpenModal(question)}
                      title="Edit"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="question-item__action-button"
                      onClick={() => handleDuplicate(question)}
                      title="Duplicate"
                    >
                      <CopyIcon />
                    </button>
                    <button
                      className="question-item__action-button question-item__action-button--danger"
                      onClick={() => handleDelete(question.id)}
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Modal */}
        {isModalOpen && (
          <div className="question-modal" onClick={handleCloseModal}>
            <div className="question-modal__content" onClick={(e) => e.stopPropagation()}>
              <div className="question-modal__header">
                <h2 className="question-modal__title">
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </h2>
                <button className="question-modal__close" onClick={handleCloseModal}>
                  <CloseIcon />
                </button>
              </div>

              <div className="question-modal__body">
                <div className="question-modal__form">
                  {/* Basic Information */}
                  <div className="question-modal__section">
                    <h3 className="question-modal__section-title">Basic Information</h3>

                    <div className="question-form-group">
                      <label className="question-form-label question-form-label--required">
                        Question Text
                      </label>
                      <Input
                        placeholder="Enter your question..."
                        value={formData.text}
                        onChange={(e) => handleChange('text', e.target.value)}
                      />
                      {errors.text && (
                        <div className="question-form-error">
                          <AlertIcon />
                          {errors.text}
                        </div>
                      )}
                    </div>

                    <div className="question-form-group">
                      <label className="question-form-label question-form-label--required">
                        Question Type
                      </label>
                      <Select
                        value={formData.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                      >
                        {questionTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="question-form-group">
                      <label className="question-form-label">Description (Optional)</label>
                      <Textarea
                        placeholder="Add helpful description or instructions..."
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="question-form-group">
                      <label className="question-form-label">Placeholder Text</label>
                      <Input
                        placeholder="e.g., Enter your answer here..."
                        value={formData.placeholder}
                        onChange={(e) => handleChange('placeholder', e.target.value)}
                      />
                    </div>

                    <div className="question-form-group">
                      <Checkbox
                        checked={formData.required}
                        onChange={(e) => handleChange('required', e.target.checked)}
                        label="Mark as required"
                      />
                    </div>
                  </div>

                  {/* Answer Options */}
                  {['radio', 'checkbox', 'dropdown'].includes(formData.type) && (
                    <div className="question-modal__section">
                      <h3 className="question-modal__section-title">Answer Options</h3>

                      <div className="answer-options">
                        {formData.options.map((option, index) => (
                          <div key={option.id} className="answer-option">
                            <div className="answer-option__drag">
                              <DragIcon />
                            </div>
                            <Input
                              className="answer-option__input"
                              placeholder={`Option ${index + 1}`}
                              value={option.label}
                              onChange={(e) => handleUpdateOption(index, 'label', e.target.value)}
                            />
                            <button
                              className="answer-option__remove"
                              onClick={() => handleRemoveOption(index)}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        ))}

                        <button className="answer-options__add" onClick={handleAddOption}>
                          <PlusIcon />
                          Add Option
                        </button>

                        {errors.options && (
                          <div className="question-form-error">
                            <AlertIcon />
                            {errors.options}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Media Upload */}
                  <div className="question-modal__section">
                    <h3 className="question-modal__section-title">Media (Optional)</h3>

                    <div className="media-upload">
                      {!formData.media ? (
                        <div
                          className="media-upload__dropzone"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="media-upload__icon">
                            <ImageIcon />
                          </div>
                          <p className="media-upload__text">Click to upload image or video</p>
                          <p className="media-upload__hint">PNG, JPG, GIF up to 10MB</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            style={{ display: 'none' }}
                            onChange={handleMediaUpload}
                          />
                        </div>
                      ) : (
                        <div className="media-upload__preview">
                          <img src={formData.media.url} alt="Preview" />
                          <button
                            className="media-upload__preview-remove"
                            onClick={handleRemoveMedia}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logic Editor */}
                  <div className="question-modal__section">
                    <h3 className="question-modal__section-title">Logic & Branching (Optional)</h3>

                    <div className="logic-editor">
                      <div className="logic-editor__header">
                        <div className="logic-editor__icon">
                          <LightningIcon />
                        </div>
                        <h4 className="logic-editor__title">Conditional Logic</h4>
                      </div>

                      {formData.logic.map((rule, index) => (
                        <div key={rule.id} className="logic-rule">
                          <div className="logic-rule__row">
                            <div className="question-form-group">
                              <label className="question-form-label">If answer</label>
                              <Select
                                value={rule.condition}
                                onChange={(e) => handleUpdateLogicRule(index, 'condition', e.target.value)}
                              >
                                <option value="equals">Equals</option>
                                <option value="not-equals">Not equals</option>
                                <option value="contains">Contains</option>
                                <option value="greater-than">Greater than</option>
                                <option value="less-than">Less than</option>
                              </Select>
                            </div>

                            <div className="question-form-group">
                              <label className="question-form-label">Value</label>
                              <Input
                                value={rule.value}
                                onChange={(e) => handleUpdateLogicRule(index, 'value', e.target.value)}
                                placeholder="Enter value"
                              />
                            </div>

                            <div className="question-form-group">
                              <label className="question-form-label">Then</label>
                              <Select
                                value={rule.action}
                                onChange={(e) => handleUpdateLogicRule(index, 'action', e.target.value)}
                              >
                                <option value="skip">Skip to question</option>
                                <option value="show">Show question</option>
                                <option value="end">End funnel</option>
                              </Select>
                            </div>

                            <button
                              className="logic-rule__remove"
                              onClick={() => handleRemoveLogicRule(index)}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      ))}

                      <button className="logic-editor__add" onClick={handleAddLogicRule}>
                        <PlusIcon />
                        Add Logic Rule
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="question-modal__footer">
                <Button variant="outline" size="md" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={handleSubmit}>
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

FunnelQuestionsPage.propTypes = {
  className: PropTypes.string,
};

export default FunnelQuestionsPage;
export { FunnelQuestionsPage };
