// =============================================================================
// AI FUNNEL PLATFORM - FunnelDetailPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui';
import { getFunnel, getFunnelStats, publishFunnel, unpublishFunnel, pauseFunnel, archiveFunnel, cloneFunnel, getPreviewUrl } from '@/lib/api/funnels.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const FUNNEL_DETAIL_STYLES = `
/* Funnel Detail Container */
.funnel-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.funnel-detail-page__inner {
  max-width: 1600px;
  margin: 0 auto;
}

/* Breadcrumb */
.funnel-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.funnel-breadcrumb__link {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s ease;
}

.funnel-breadcrumb__link:hover {
  color: #667eea;
}

.funnel-breadcrumb__separator {
  color: #d1d5db;
}

.funnel-breadcrumb__current {
  color: #111827;
  font-weight: 600;
}

/* Header */
.funnel-detail-header {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.funnel-detail-header__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
}

.funnel-detail-header__content {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.funnel-detail-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  flex-shrink: 0;
}

.funnel-detail-header__icon svg {
  width: 40px;
  height: 40px;
}

.funnel-detail-header__info {
  flex: 1;
}

.funnel-detail-header__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.funnel-detail-header__status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.funnel-detail-header__status--active {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.funnel-detail-header__status--draft {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
}

.funnel-detail-header__status--paused {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.funnel-detail-header__status--archived {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
}

.funnel-detail-header__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.funnel-detail-header__status--active .funnel-detail-header__status-dot {
  background: #10b981;
}

.funnel-detail-header__status--draft .funnel-detail-header__status-dot {
  background: #9ca3af;
}

.funnel-detail-header__status--paused .funnel-detail-header__status-dot {
  background: #f59e0b;
}

.funnel-detail-header__status--archived .funnel-detail-header__status-dot {
  background: #64748b;
}

.funnel-detail-header__group {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #667eea;
}

.funnel-detail-header__group svg {
  width: 14px;
  height: 14px;
}

.funnel-detail-header__title {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.funnel-detail-header__description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.funnel-detail-header__links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.funnel-detail-header__link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  text-decoration: none;
  transition: all 0.2s ease;
}

.funnel-detail-header__link:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f0f9ff;
}

.funnel-detail-header__link svg {
  width: 16px;
  height: 16px;
}

.funnel-detail-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.funnel-detail-header__action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid #e5e7eb;
  background: #ffffff;
  color: #6b7280;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.funnel-detail-header__action-button:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f0f9ff;
}

.funnel-detail-header__action-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: #ffffff;
}

.funnel-detail-header__action-button--primary:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

.funnel-detail-header__action-button svg {
  width: 18px;
  height: 18px;
}

.funnel-detail-header__stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #f3f4f6;
}

.funnel-detail-stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.funnel-detail-stat__label {
  font-size: 0.813rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.funnel-detail-stat__value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.funnel-detail-stat__change {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.813rem;
  font-weight: 600;
}

.funnel-detail-stat__change--up {
  color: #059669;
}

.funnel-detail-stat__change--down {
  color: #dc2626;
}

.funnel-detail-stat__change svg {
  width: 14px;
  height: 14px;
}

/* Quick Links */
.funnel-quick-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.funnel-quick-link-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.funnel-quick-link-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.funnel-quick-link-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #667eea;
}

.funnel-quick-link-card__icon svg {
  width: 28px;
  height: 28px;
}

.funnel-quick-link-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.funnel-quick-link-card__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.funnel-quick-link-card__description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* Content Layout */
.funnel-detail-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  align-items: flex-start;
}

/* Main Section */
.funnel-detail-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Info Card */
.funnel-info-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.funnel-info-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.funnel-info-card__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.funnel-info-card__list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.funnel-info-card__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #f3f4f6;
}

.funnel-info-card__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.funnel-info-card__item-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.funnel-info-card__item-value {
  font-size: 0.938rem;
  font-weight: 600;
  color: #111827;
  text-align: right;
}

.funnel-info-card__item-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #667eea;
  text-decoration: none;
  transition: color 0.2s ease;
}

.funnel-info-card__item-link:hover {
  color: #764ba2;
}

.funnel-info-card__item-link svg {
  width: 14px;
  height: 14px;
}

/* Sidebar */
.funnel-detail-sidebar {
  position: sticky;
  top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Actions Card */
.funnel-actions-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.funnel-actions-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1.25rem 0;
}

.funnel-actions-card__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.funnel-actions-card__button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.funnel-actions-card__button:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f0f9ff;
}

.funnel-actions-card__button--danger:hover {
  border-color: #dc2626;
  color: #dc2626;
  background: #fee2e2;
}

.funnel-actions-card__button svg {
  width: 18px;
  height: 18px;
}

/* Meta Card */
.funnel-meta-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.funnel-meta-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1.25rem 0;
}

.funnel-meta-card__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.funnel-meta-card__item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.funnel-meta-card__item-label {
  font-size: 0.813rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.funnel-meta-card__item-value {
  font-size: 0.938rem;
  font-weight: 600;
  color: #111827;
}

/* Loading */
.funnel-detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.funnel-detail-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: funnel-detail-spin 0.8s linear infinite;
}

@keyframes funnel-detail-spin {
  to { transform: rotate(360deg); }
}

.funnel-detail-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Responsive */
@media (max-width: 1200px) {
  .funnel-detail-content {
    grid-template-columns: 1fr;
  }
  
  .funnel-detail-sidebar {
    position: static;
  }
  
  .funnel-quick-links {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .funnel-detail-header__stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .funnel-detail-page {
    padding: 1.5rem 1rem;
  }
  
  .funnel-detail-header {
    padding: 1.5rem;
  }
  
  .funnel-detail-header__top {
    flex-direction: column;
  }
  
  .funnel-detail-header__content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .funnel-detail-header__actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .funnel-detail-header__stats {
    grid-template-columns: 1fr;
  }
  
  .funnel-quick-links {
    grid-template-columns: 1fr;
  }
  
  .funnel-info-card,
  .funnel-actions-card,
  .funnel-meta-card {
    padding: 1.5rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .funnel-quick-link-card,
  .funnel-detail-loading__spinner {
    animation: none !important;
  }
  
  .funnel-quick-link-card:hover {
    transform: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'funnel-detail');
  styleElement.textContent = FUNNEL_DETAIL_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const ChartIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

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

const ShareIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const CopyIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const PauseIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArchiveIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDownIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const FolderIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const QuestionIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FlowIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
  </svg>
);

const SettingsIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ExternalIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const PlayIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const FunnelDetailPage = ({
  className = '',
  ...props
}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    injectStyles();
  }, []);

  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState(null);
  const [stats, setStats] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [funnelData, statsData, urlData] = await Promise.all([
        getFunnel(id),
        getFunnelStats(id),
        getPreviewUrl(id),
      ]);
      setFunnel(funnelData);
      setStats(statsData);
      setPreviewUrl(urlData.url);
    } catch (error) {
      console.error('Failed to fetch funnel data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePublish = async () => {
    try {
      if (funnel.status === 'active') {
        await unpublishFunnel(id);
      } else {
        await publishFunnel(id);
      }
      fetchData();
    } catch (error) {
      console.error('Failed to publish/unpublish funnel:', error);
    }
  };

  const handlePause = async () => {
    try {
      await pauseFunnel(id);
      fetchData();
    } catch (error) {
      console.error('Failed to pause funnel:', error);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Archive this funnel?')) return;
    try {
      await archiveFunnel(id);
      navigate('/funnels');
    } catch (error) {
      console.error('Failed to archive funnel:', error);
    }
  };

  const handleClone = async () => {
    try {
      const cloned = await cloneFunnel(id);
      navigate(`/funnels/${cloned.id}`);
    } catch (error) {
      console.error('Failed to clone funnel:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="funnel-detail-page">
        <div className="funnel-detail-page__inner">
          <div className="funnel-detail-loading">
            <div className="funnel-detail-loading__spinner" />
            <p className="funnel-detail-loading__text">Loading funnel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="funnel-detail-page">
        <div className="funnel-detail-page__inner">
          <div className="funnel-detail-loading">
            <h3>Funnel not found</h3>
            <Button variant="primary" onClick={() => navigate('/funnels')}>
              Back to Funnels
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`funnel-detail-page ${className}`} {...props}>
      <div className="funnel-detail-page__inner">
        {/* Breadcrumb */}
        <div className="funnel-breadcrumb">
          <a href="/funnels" className="funnel-breadcrumb__link">Funnels</a>
          <span className="funnel-breadcrumb__separator">/</span>
          <span className="funnel-breadcrumb__current">{funnel.name}</span>
        </div>

        {/* Header */}
        <div className="funnel-detail-header">
          <div className="funnel-detail-header__top">
            <div className="funnel-detail-header__content">
              <div className="funnel-detail-header__icon">
                <ChartIcon />
              </div>
              <div className="funnel-detail-header__info">
                <div className="funnel-detail-header__meta">
                  <div className={`funnel-detail-header__status funnel-detail-header__status--${funnel.status}`}>
                    <span className="funnel-detail-header__status-dot" />
                    {funnel.status}
                  </div>
                  {funnel.group && (
                    <div className="funnel-detail-header__group">
                      <FolderIcon />
                      {funnel.group}
                    </div>
                  )}
                </div>
                <h1 className="funnel-detail-header__title">{funnel.name}</h1>
                {funnel.description && (
                  <p className="funnel-detail-header__description">{funnel.description}</p>
                )}
                <div className="funnel-detail-header__links">
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="funnel-detail-header__link"
                    >
                      <EyeIcon />
                      Preview
                    </a>
                  )}
                  {funnel.liveUrl && (
                    <a
                      href={funnel.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="funnel-detail-header__link"
                    >
                      <ExternalIcon />
                      View Live
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="funnel-detail-header__actions">
              <button
                className="funnel-detail-header__action-button"
                onClick={() => navigate(`/funnels/${id}/edit`)}
                title="Edit"
              >
                <EditIcon />
              </button>
              <button
                className="funnel-detail-header__action-button"
                onClick={handleClone}
                title="Clone"
              >
                <CopyIcon />
              </button>
              <button
                className="funnel-detail-header__action-button"
                onClick={() => navigator.clipboard.writeText(previewUrl)}
                title="Share"
              >
                <ShareIcon />
              </button>
              <button
                className={`funnel-detail-header__action-button ${funnel.status === 'active' ? '' : 'funnel-detail-header__action-button--primary'}`}
                onClick={handlePublish}
                title={funnel.status === 'active' ? 'Unpublish' : 'Publish'}
              >
                <PlayIcon />
              </button>
            </div>
          </div>

          {stats && (
            <div className="funnel-detail-header__stats">
              <div className="funnel-detail-stat">
                <div className="funnel-detail-stat__label">Total Views</div>
                <div className="funnel-detail-stat__value">{formatNumber(stats.views)}</div>
                {stats.viewsChange !== undefined && (
                  <div className={`funnel-detail-stat__change ${stats.viewsChange >= 0 ? 'funnel-detail-stat__change--up' : 'funnel-detail-stat__change--down'}`}>
                    {stats.viewsChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    {Math.abs(stats.viewsChange)}%
                  </div>
                )}
              </div>

              <div className="funnel-detail-stat">
                <div className="funnel-detail-stat__label">Total Leads</div>
                <div className="funnel-detail-stat__value">{formatNumber(stats.leads)}</div>
                {stats.leadsChange !== undefined && (
                  <div className={`funnel-detail-stat__change ${stats.leadsChange >= 0 ? 'funnel-detail-stat__change--up' : 'funnel-detail-stat__change--down'}`}>
                    {stats.leadsChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    {Math.abs(stats.leadsChange)}%
                  </div>
                )}
              </div>

              <div className="funnel-detail-stat">
                <div className="funnel-detail-stat__label">Conversion</div>
                <div className="funnel-detail-stat__value">{stats.conversion}%</div>
                {stats.conversionChange !== undefined && (
                  <div className={`funnel-detail-stat__change ${stats.conversionChange >= 0 ? 'funnel-detail-stat__change--up' : 'funnel-detail-stat__change--down'}`}>
                    {stats.conversionChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    {Math.abs(stats.conversionChange)}%
                  </div>
                )}
              </div>

              <div className="funnel-detail-stat">
                <div className="funnel-detail-stat__label">Avg. Time</div>
                <div className="funnel-detail-stat__value">{stats.avgTime}s</div>
              </div>

              <div className="funnel-detail-stat">
                <div className="funnel-detail-stat__label">Questions</div>
                <div className="funnel-detail-stat__value">{stats.questionsCount}</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="funnel-quick-links">
          <a href={`/funnels/${id}/edit`} className="funnel-quick-link-card">
            <div className="funnel-quick-link-card__icon">
              <EditIcon />
            </div>
            <div className="funnel-quick-link-card__content">
              <h3 className="funnel-quick-link-card__title">Edit Funnel</h3>
              <p className="funnel-quick-link-card__description">
                Customize design and content
              </p>
            </div>
          </a>

          <a href={`/funnels/${id}/analytics`} className="funnel-quick-link-card">
            <div className="funnel-quick-link-card__icon">
              <ChartIcon />
            </div>
            <div className="funnel-quick-link-card__content">
              <h3 className="funnel-quick-link-card__title">Analytics</h3>
              <p className="funnel-quick-link-card__description">
                View detailed performance
              </p>
            </div>
          </a>

          <a href={`/funnels/${id}/questions`} className="funnel-quick-link-card">
            <div className="funnel-quick-link-card__icon">
              <QuestionIcon />
            </div>
            <div className="funnel-quick-link-card__content">
              <h3 className="funnel-quick-link-card__title">Questions</h3>
              <p className="funnel-quick-link-card__description">
                Manage funnel questions
              </p>
            </div>
          </a>

          <a href={`/funnels/${id}/flow`} className="funnel-quick-link-card">
            <div className="funnel-quick-link-card__icon">
              <FlowIcon />
            </div>
            <div className="funnel-quick-link-card__content">
              <h3 className="funnel-quick-link-card__title">Flow Builder</h3>
              <p className="funnel-quick-link-card__description">
                Design question flow
              </p>
            </div>
          </a>
        </div>

        {/* Content */}
        <div className="funnel-detail-content">
          {/* Main */}
          <div className="funnel-detail-main">
            <div className="funnel-info-card">
              <div className="funnel-info-card__header">
                <h2 className="funnel-info-card__title">Funnel Information</h2>
              </div>
              <div className="funnel-info-card__list">
                <div className="funnel-info-card__item">
                  <div className="funnel-info-card__item-label">Funnel URL</div>
                  <a
                    href={funnel.liveUrl || previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="funnel-info-card__item-link"
                  >
                    {funnel.slug}
                    <ExternalIcon />
                  </a>
                </div>
                <div className="funnel-info-card__item">
                  <div className="funnel-info-card__item-label">Created</div>
                  <div className="funnel-info-card__item-value">{formatDate(funnel.createdAt)}</div>
                </div>
                <div className="funnel-info-card__item">
                  <div className="funnel-info-card__item-label">Last Updated</div>
                  <div className="funnel-info-card__item-value">{formatDate(funnel.updatedAt)}</div>
                </div>
                <div className="funnel-info-card__item">
                  <div className="funnel-info-card__item-label">Status</div>
                  <div className="funnel-info-card__item-value">{funnel.status}</div>
                </div>
                {funnel.publishedAt && (
                  <div className="funnel-info-card__item">
                    <div className="funnel-info-card__item-label">Published</div>
                    <div className="funnel-info-card__item-value">{formatDate(funnel.publishedAt)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="funnel-detail-sidebar">
            <div className="funnel-actions-card">
              <h3 className="funnel-actions-card__title">Quick Actions</h3>
              <div className="funnel-actions-card__list">
                <button
                  className="funnel-actions-card__button"
                  onClick={handlePublish}
                >
                  <PlayIcon />
                  {funnel.status === 'active' ? 'Unpublish' : 'Publish'} Funnel
                </button>
                <button
                  className="funnel-actions-card__button"
                  onClick={handlePause}
                >
                  <PauseIcon />
                  Pause Funnel
                </button>
                <button
                  className="funnel-actions-card__button"
                  onClick={handleClone}
                >
                  <CopyIcon />
                  Duplicate Funnel
                </button>
                <button
                  className="funnel-actions-card__button"
                  onClick={() => navigate(`/funnels/${id}/settings`)}
                >
                  <SettingsIcon />
                  Settings
                </button>
                <button
                  className="funnel-actions-card__button funnel-actions-card__button--danger"
                  onClick={handleArchive}
                >
                  <ArchiveIcon />
                  Archive Funnel
                </button>
              </div>
            </div>

            <div className="funnel-meta-card">
              <h3 className="funnel-meta-card__title">Details</h3>
              <div className="funnel-meta-card__list">
                <div className="funnel-meta-card__item">
                  <div className="funnel-meta-card__item-label">Project</div>
                  <div className="funnel-meta-card__item-value">{funnel.project || 'None'}</div>
                </div>
                <div className="funnel-meta-card__item">
                  <div className="funnel-meta-card__item-label">Group</div>
                  <div className="funnel-meta-card__item-value">{funnel.group || 'None'}</div>
                </div>
                <div className="funnel-meta-card__item">
                  <div className="funnel-meta-card__item-label">Type</div>
                  <div className="funnel-meta-card__item-value">{funnel.type || 'Standard'}</div>
                </div>
                <div className="funnel-meta-card__item">
                  <div className="funnel-meta-card__item-label">Questions</div>
                  <div className="funnel-meta-card__item-value">{stats?.questionsCount || 0}</div>
                </div>
                <div className="funnel-meta-card__item">
                  <div className="funnel-meta-card__item-label">Steps</div>
                  <div className="funnel-meta-card__item-value">{funnel.stepsCount || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

FunnelDetailPage.propTypes = {
  className: PropTypes.string,
};

export default FunnelDetailPage;
export { FunnelDetailPage };
