// =============================================================================
// AI FUNNEL PLATFORM - FunnelResultPageEditor Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { Input, Button, Textarea, Select, Checkbox } from '../../../components/ui';
import { getFunnel, updateFunnelLayout } from '../../../api/funnels.api';
import { optimizeContent } from '../../../api/ai.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const RESULT_PAGE_EDITOR_STYLES = `
/* Editor Container */
.result-page-editor {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* Top Bar */
.result-editor-topbar {
  background: #ffffff;
  border-bottom: 2px solid #e5e7eb;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.result-editor-topbar__left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.result-editor-topbar__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.result-editor-topbar__status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.813rem;
  font-weight: 600;
  color: #6b7280;
}

.result-editor-topbar__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.result-editor-topbar__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.result-editor-mode-toggle {
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 0.25rem;
}

.result-editor-mode-toggle__button {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-editor-mode-toggle__button--active {
  background: #ffffff;
  color: #667eea;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Main Layout */
.result-editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.result-editor-sidebar {
  width: 320px;
  background: #ffffff;
  border-right: 2px solid #e5e7eb;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.result-editor-sidebar__header {
  padding: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
}

.result-editor-sidebar__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.result-editor-sidebar__subtitle {
  font-size: 0.813rem;
  color: #6b7280;
  margin: 0;
}

.result-editor-sidebar__content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Block List */
.result-editor-block-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.result-editor-block-item {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.result-editor-block-item:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}

.result-editor-block-item--active {
  border-color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.result-editor-block-item__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-editor-block-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #ffffff;
  border-radius: 10px;
  color: #667eea;
  flex-shrink: 0;
}

.result-editor-block-item__icon svg {
  width: 20px;
  height: 20px;
}

.result-editor-block-item__info {
  flex: 1;
}

.result-editor-block-item__label {
  font-size: 0.938rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.result-editor-block-item__description {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.result-editor-block-item__drag {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  cursor: grab;
}

.result-editor-block-item__drag:active {
  cursor: grabbing;
}

.result-editor-block-item__drag svg {
  width: 18px;
  height: 18px;
}

/* AI Section */
.result-editor-ai-section {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #667eea;
  border-radius: 12px;
  padding: 1.25rem;
  margin-top: 1rem;
}

.result-editor-ai-section__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.result-editor-ai-section__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: #ffffff;
  flex-shrink: 0;
}

.result-editor-ai-section__icon svg {
  width: 20px;
  height: 20px;
}

.result-editor-ai-section__content {
  flex: 1;
}

.result-editor-ai-section__title {
  font-size: 0.938rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.result-editor-ai-section__subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

/* Canvas */
.result-editor-canvas {
  flex: 1;
  overflow-y: auto;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 3rem 2rem;
  position: relative;
}

.result-editor-canvas__inner {
  max-width: 800px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  min-height: 600px;
  overflow: hidden;
}

/* Preview Mode */
.result-editor-canvas--preview {
  padding: 0;
}

.result-editor-canvas--preview .result-editor-canvas__inner {
  max-width: 100%;
  border-radius: 0;
  box-shadow: none;
}

/* Editable Blocks */
.result-editor-editable-block {
  padding: 2rem;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.result-editor-editable-block:hover {
  border-color: #e5e7eb;
  background: #fafbfc;
}

.result-editor-editable-block--editing {
  border-color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.result-editor-editable-block--hidden {
  display: none;
}

.result-editor-editable-block__toolbar {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.result-editor-editable-block:hover .result-editor-editable-block__toolbar {
  opacity: 1;
}

.result-editor-editable-block__toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-editor-editable-block__toolbar-button:hover {
  border-color: #667eea;
  color: #667eea;
}

.result-editor-editable-block__toolbar-button svg {
  width: 16px;
  height: 16px;
}

/* Headline Block */
.result-editor-headline {
  text-align: center;
}

.result-editor-headline__title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.result-editor-headline__subtitle {
  font-size: 1.25rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.result-editor-headline__title[contenteditable="true"],
.result-editor-headline__subtitle[contenteditable="true"] {
  outline: 2px solid #667eea;
  outline-offset: 4px;
  border-radius: 8px;
  padding: 0.5rem;
}

/* Benefits Block */
.result-editor-benefits {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.result-editor-benefit-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
}

.result-editor-benefit-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 16px;
  color: #667eea;
  margin: 0 auto;
}

.result-editor-benefit-item__icon svg {
  width: 32px;
  height: 32px;
}

.result-editor-benefit-item__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.result-editor-benefit-item__description {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

/* Testimonials Block */
.result-editor-testimonials {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.result-editor-testimonial-item {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-editor-testimonial-item__quote {
  font-size: 1rem;
  color: #374151;
  margin: 0;
  line-height: 1.6;
  font-style: italic;
}

.result-editor-testimonial-item__author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.result-editor-testimonial-item__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 1.125rem;
}

.result-editor-testimonial-item__info {
  flex: 1;
}

.result-editor-testimonial-item__name {
  font-size: 0.938rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.result-editor-testimonial-item__role {
  font-size: 0.813rem;
  color: #6b7280;
  margin: 0;
}

/* CTA Block */
.result-editor-cta {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  text-align: center;
  border-radius: 16px;
  padding: 3rem 2rem;
  margin: 2rem;
}

.result-editor-cta__title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  line-height: 1.2;
}

.result-editor-cta__description {
  font-size: 1.125rem;
  margin: 0 0 2rem 0;
  opacity: 0.95;
  line-height: 1.6;
}

.result-editor-cta__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: #ffffff;
  color: #667eea;
  font-size: 1.063rem;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.result-editor-cta__button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* Video Block */
.result-editor-video {
  aspect-ratio: 16 / 9;
  background: #000000;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-editor-video__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #ffffff;
}

.result-editor-video__placeholder-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-editor-video__placeholder-icon svg {
  width: 40px;
  height: 40px;
}

.result-editor-video__placeholder-text {
  font-size: 1.125rem;
  font-weight: 600;
}

.result-editor-video iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* Properties Panel */
.result-editor-properties {
  width: 360px;
  background: #ffffff;
  border-left: 2px solid #e5e7eb;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.result-editor-properties__header {
  padding: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
}

.result-editor-properties__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.result-editor-properties__subtitle {
  font-size: 0.813rem;
  color: #6b7280;
  margin: 0;
}

.result-editor-properties__content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.result-editor-properties__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  color: #9ca3af;
}

.result-editor-properties__empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
}

.result-editor-properties__empty-icon svg {
  width: 100%;
  height: 100%;
}

.result-editor-properties__empty-text {
  font-size: 0.938rem;
  font-weight: 600;
}

/* Form Group */
.result-editor-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-editor-form-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
}

.result-editor-form-hint {
  font-size: 0.813rem;
  color: #6b7280;
  margin-top: -0.25rem;
}

/* Loading */
.result-editor-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.result-editor-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: result-editor-spin 0.8s linear infinite;
}

@keyframes result-editor-spin {
  to { transform: rotate(360deg); }
}

.result-editor-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Responsive */
@media (max-width: 1200px) {
  .result-editor-properties {
    display: none;
  }
}

@media (max-width: 768px) {
  .result-editor-topbar {
    padding: 1rem;
    flex-direction: column;
    align-items: stretch;
  }
  
  .result-editor-sidebar {
    display: none;
  }
  
  .result-editor-canvas {
    padding: 1.5rem 1rem;
  }
  
  .result-editor-benefits {
    grid-template-columns: 1fr;
  }
  
  .result-editor-testimonials {
    grid-template-columns: 1fr;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .result-editor-loading__spinner {
    animation: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'result-page-editor');
  styleElement.textContent = RESULT_PAGE_EDITOR_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const EditIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const EyeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const SparklesIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const SaveIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const TypeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
  </svg>
);

const StarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ChatIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const BellIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const PlayIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const LightbulbIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const DragIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
  </svg>
);

const TrashIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CursorClickIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const FunnelResultPageEditor = ({ className = '', ...props }) => {
  const { id } = useParams();

  useEffect(() => {
    injectStyles();
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('edit'); // 'edit' | 'preview'
  const [funnel, setFunnel] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [aiOptimizing, setAiOptimizing] = useState(false);

  // Block configuration
  const [blocks, setBlocks] = useState({
    headline: {
      id: 'headline',
      type: 'headline',
      label: 'Headline',
      description: 'Main title and subtitle',
      icon: <TypeIcon />,
      enabled: true,
      order: 0,
      data: {
        title: 'Your Personalized Results Are Ready!',
        subtitle: 'Based on your responses, here\'s what we recommend',
      },
    },
    benefits: {
      id: 'benefits',
      type: 'benefits',
      label: 'Benefits',
      description: 'Key benefits list',
      icon: <CheckIcon />,
      enabled: true,
      order: 1,
      data: {
        items: [
          { icon: <CheckIcon />, title: 'Benefit One', description: 'Description of first benefit' },
          { icon: <StarIcon />, title: 'Benefit Two', description: 'Description of second benefit' },
          { icon: <LightbulbIcon />, title: 'Benefit Three', description: 'Description of third benefit' },
        ],
      },
    },
    testimonials: {
      id: 'testimonials',
      type: 'testimonials',
      label: 'Testimonials',
      description: 'Customer reviews',
      icon: <ChatIcon />,
      enabled: true,
      order: 2,
      data: {
        items: [
          {
            quote: 'This product exceeded my expectations! Highly recommended.',
            author: 'John Doe',
            role: 'CEO, Company Inc',
            avatar: 'JD',
          },
          {
            quote: 'Amazing experience from start to finish. Will definitely use again.',
            author: 'Jane Smith',
            role: 'Marketing Director',
            avatar: 'JS',
          },
        ],
      },
    },
    cta: {
      id: 'cta',
      type: 'cta',
      label: 'Call to Action',
      description: 'Primary CTA button',
      icon: <BellIcon />,
      enabled: true,
      order: 3,
      data: {
        title: 'Ready to Get Started?',
        description: 'Join thousands of satisfied customers today',
        buttonText: 'Get Started Now',
        buttonUrl: '#',
      },
    },
    video: {
      id: 'video',
      type: 'video',
      label: 'Video',
      description: 'Embedded video',
      icon: <PlayIcon />,
      enabled: false,
      order: 4,
      data: {
        url: '',
        thumbnail: '',
      },
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFunnel(id);
      setFunnel(data);
      // Load saved blocks if available
      if (data.resultPageBlocks) {
        setBlocks(data.resultPageBlocks);
      }
    } catch (error) {
      console.error('Failed to fetch funnel:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleBlock = useCallback((blockId) => {
    setBlocks((prev) => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        enabled: !prev[blockId].enabled,
      },
    }));
  }, []);

  const handleSelectBlock = useCallback((blockId) => {
    setSelectedBlock(blockId);
  }, []);

  const handleUpdateBlockData = useCallback((blockId, field, value) => {
    setBlocks((prev) => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        data: {
          ...prev[blockId].data,
          [field]: value,
        },
      },
    }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFunnelLayout(id, { resultPageBlocks: blocks });
      alert('Saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAIOptimize = async () => {
    if (!selectedBlock) return;
    
    setAiOptimizing(true);
    try {
      const block = blocks[selectedBlock];
      const optimized = await optimizeContent({
        type: block.type,
        content: block.data,
        goal: funnel.goal,
        industry: funnel.industry,
      });
      
      handleUpdateBlockData(selectedBlock, 'optimized', optimized);
      alert('Content optimized by AI!');
    } catch (error) {
      console.error('Failed to optimize:', error);
      alert('AI optimization failed');
    } finally {
      setAiOptimizing(false);
    }
  };

  const enabledBlocks = Object.values(blocks)
    .filter((block) => block.enabled)
    .sort((a, b) => a.order - b.order);

  if (loading) {
    return (
      <div className="result-page-editor">
        <div className="result-editor-loading">
          <div className="result-editor-loading__spinner" />
          <p className="result-editor-loading__text">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`result-page-editor ${className}`} {...props}>
      {/* Top Bar */}
      <div className="result-editor-topbar">
        <div className="result-editor-topbar__left">
          <h1 className="result-editor-topbar__title">Result Page Editor</h1>
          <div className="result-editor-topbar__status">
            <span className="result-editor-topbar__status-dot" />
            Auto-saved
          </div>
        </div>
        <div className="result-editor-topbar__actions">
          <div className="result-editor-mode-toggle">
            <button
              className={`result-editor-mode-toggle__button ${mode === 'edit' ? 'result-editor-mode-toggle__button--active' : ''}`}
              onClick={() => setMode('edit')}
            >
              <EditIcon /> Edit
            </button>
            <button
              className={`result-editor-mode-toggle__button ${mode === 'preview' ? 'result-editor-mode-toggle__button--active' : ''}`}
              onClick={() => setMode('preview')}
            >
              <EyeIcon /> Preview
            </button>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={saving}
          >
            <SaveIcon />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="result-editor-main">
        {/* Sidebar */}
        {mode === 'edit' && (
          <div className="result-editor-sidebar">
            <div className="result-editor-sidebar__header">
              <h2 className="result-editor-sidebar__title">Content Blocks</h2>
              <p className="result-editor-sidebar__subtitle">
                Toggle and arrange blocks
              </p>
            </div>
            <div className="result-editor-sidebar__content">
              <div className="result-editor-block-list">
                {Object.values(blocks).map((block) => (
                  <div
                    key={block.id}
                    className={`result-editor-block-item ${selectedBlock === block.id ? 'result-editor-block-item--active' : ''}`}
                    onClick={() => handleSelectBlock(block.id)}
                  >
                    <div className="result-editor-block-item__toggle">
                      <Checkbox
                        checked={block.enabled}
                        onChange={() => handleToggleBlock(block.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="result-editor-block-item__icon">
                      {block.icon}
                    </div>
                    <div className="result-editor-block-item__info">
                      <h3 className="result-editor-block-item__label">{block.label}</h3>
                      <p className="result-editor-block-item__description">{block.description}</p>
                    </div>
                    <div className="result-editor-block-item__drag">
                      <DragIcon />
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Section */}
              <div className="result-editor-ai-section">
                <div className="result-editor-ai-section__header">
                  <div className="result-editor-ai-section__icon">
                    <SparklesIcon />
                  </div>
                  <div className="result-editor-ai-section__content">
                    <h3 className="result-editor-ai-section__title">AI Optimize</h3>
                    <p className="result-editor-ai-section__subtitle">
                      Enhance selected block with AI
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAIOptimize}
                  disabled={!selectedBlock || aiOptimizing}
                  style={{ width: '100%' }}
                >
                  {aiOptimizing ? 'Optimizing...' : 'Optimize with AI'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className={`result-editor-canvas ${mode === 'preview' ? 'result-editor-canvas--preview' : ''}`}>
          <div className="result-editor-canvas__inner">
            {enabledBlocks.map((block) => (
              <ResultPageBlock
                key={block.id}
                block={block}
                isSelected={selectedBlock === block.id}
                mode={mode}
                onSelect={() => handleSelectBlock(block.id)}
                onUpdate={(field, value) => handleUpdateBlockData(block.id, field, value)}
              />
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        {mode === 'edit' && (
          <div className="result-editor-properties">
            <div className="result-editor-properties__header">
              <h2 className="result-editor-properties__title">Properties</h2>
              <p className="result-editor-properties__subtitle">
                Edit block content
              </p>
            </div>
            <div className="result-editor-properties__content">
              {selectedBlock ? (
                <BlockProperties
                  block={blocks[selectedBlock]}
                  onUpdate={(field, value) => handleUpdateBlockData(selectedBlock, field, value)}
                />
              ) : (
                <div className="result-editor-properties__empty">
                  <div className="result-editor-properties__empty-icon">
                    <CursorClickIcon />
                  </div>
                  <p className="result-editor-properties__empty-text">
                    Select a block to edit its properties
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const ResultPageBlock = ({ block, isSelected, mode, onSelect, onUpdate }) => {
  const isEditing = mode === 'edit' && isSelected;

  const renderBlockContent = () => {
    switch (block.type) {
      case 'headline':
        return (
          <div className="result-editor-headline">
            <h1
              className="result-editor-headline__title"
              contentEditable={isEditing}
              suppressContentEditableWarning
              onBlur={(e) => onUpdate('title', e.target.textContent)}
            >
              {block.data.title}
            </h1>
            <p
              className="result-editor-headline__subtitle"
              contentEditable={isEditing}
              suppressContentEditableWarning
              onBlur={(e) => onUpdate('subtitle', e.target.textContent)}
            >
              {block.data.subtitle}
            </p>
          </div>
        );

      case 'benefits':
        return (
          <div className="result-editor-benefits">
            {block.data.items.map((item, index) => (
              <div key={index} className="result-editor-benefit-item">
                <div className="result-editor-benefit-item__icon">
                  {item.icon}
                </div>
                <h3 className="result-editor-benefit-item__title">{item.title}</h3>
                <p className="result-editor-benefit-item__description">{item.description}</p>
              </div>
            ))}
          </div>
        );

      case 'testimonials':
        return (
          <div className="result-editor-testimonials">
            {block.data.items.map((item, index) => (
              <div key={index} className="result-editor-testimonial-item">
                <p className="result-editor-testimonial-item__quote">"{item.quote}"</p>
                <div className="result-editor-testimonial-item__author">
                  <div className="result-editor-testimonial-item__avatar">{item.avatar}</div>
                  <div className="result-editor-testimonial-item__info">
                    <p className="result-editor-testimonial-item__name">{item.author}</p>
                    <p className="result-editor-testimonial-item__role">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'cta':
        return (
          <div className="result-editor-cta">
            <h2 className="result-editor-cta__title">{block.data.title}</h2>
            <p className="result-editor-cta__description">{block.data.description}</p>
            <button className="result-editor-cta__button">{block.data.buttonText}</button>
          </div>
        );

      case 'video':
        return (
          <div className="result-editor-video">
            {block.data.url ? (
              <iframe src={block.data.url} title="Video" />
            ) : (
              <div className="result-editor-video__placeholder">
                <div className="result-editor-video__placeholder-icon">
                  <PlayIcon />
                </div>
                <p className="result-editor-video__placeholder-text">Add video URL</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`result-editor-editable-block ${isEditing ? 'result-editor-editable-block--editing' : ''}`}
      onClick={onSelect}
    >
      {mode === 'edit' && (
        <div className="result-editor-editable-block__toolbar">
          <button className="result-editor-editable-block__toolbar-button">
            <EditIcon />
          </button>
          <button className="result-editor-editable-block__toolbar-button">
            <TrashIcon />
          </button>
        </div>
      )}
      {renderBlockContent()}
    </div>
  );
};

const BlockProperties = ({ block, onUpdate }) => {
  switch (block.type) {
    case 'headline':
      return (
        <>
          <div className="result-editor-form-group">
            <label className="result-editor-form-label">Title</label>
            <Input
              value={block.data.title}
              onChange={(e) => onUpdate('title', e.target.value)}
            />
          </div>
          <div className="result-editor-form-group">
            <label className="result-editor-form-label">Subtitle</label>
            <Textarea
              value={block.data.subtitle}
              onChange={(e) => onUpdate('subtitle', e.target.value)}
              rows={3}
            />
          </div>
        </>
      );

    case 'cta':
      return (
        <>
          <div className="result-editor-form-group">
            <label className="result-editor-form-label">Title</label>
            <Input
              value={block.data.title}
              onChange={(e) => onUpdate('title', e.target.value)}
            />
          </div>
          <div className="result-editor-form-group">
            <label className="result-editor-form-label">Description</label>
            <Textarea
              value={block.data.description}
              onChange={(e) => onUpdate('description', e.target.value)}
              rows={2}
            />
          </div>
          <div className="result-editor-form-group">
            <label className="result-editor-form-label">Button Text</label>
            <Input
              value={block.data.buttonText}
              onChange={(e) => onUpdate('buttonText', e.target.value)}
            />
          </div>
          <div className="result-editor-form-group">
            <label className="result-editor-form-label">Button URL</label>
            <Input
              value={block.data.buttonUrl}
              onChange={(e) => onUpdate('buttonUrl', e.target.value)}
            />
          </div>
        </>
      );

    case 'video':
      return (
        <div className="result-editor-form-group">
          <label className="result-editor-form-label">Video URL</label>
          <Input
            value={block.data.url}
            onChange={(e) => onUpdate('url', e.target.value)}
            placeholder="https://youtube.com/embed/..."
          />
          <p className="result-editor-form-hint">
            Enter YouTube or Vimeo embed URL
          </p>
        </div>
      );

    default:
      return (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          No editable properties for this block type
        </p>
      );
  }
};

ResultPageBlock.propTypes = {
  block: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  mode: PropTypes.string,
  onSelect: PropTypes.func,
  onUpdate: PropTypes.func,
};

BlockProperties.propTypes = {
  block: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

FunnelResultPageEditor.propTypes = {
  className: PropTypes.string,
};

export default FunnelResultPageEditor;
export { FunnelResultPageEditor };
