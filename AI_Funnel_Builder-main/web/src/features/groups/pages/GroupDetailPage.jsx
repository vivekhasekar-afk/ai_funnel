// =============================================================================
// AI FUNNEL PLATFORM - GroupDetailPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Button, Select } from '../../../components/ui';
import { getGroupById, updateGroup, deleteGroup, getGroupFunnels, moveFunnel, getGroupAnalytics } from '../../../api/groups.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const GROUP_DETAIL_STYLES = `
/* Group Detail Container */
.group-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.group-detail-page__inner {
  max-width: 1400px;
  margin: 0 auto;
}

/* Breadcrumb */
.group-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.group-breadcrumb__link {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s ease;
}

.group-breadcrumb__link:hover {
  color: #667eea;
}

.group-breadcrumb__separator {
  color: #d1d5db;
}

.group-breadcrumb__current {
  color: #111827;
  font-weight: 600;
}

/* Header */
.group-detail-header {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.group-detail-header__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.group-detail-header__content {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.group-detail-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  flex-shrink: 0;
}

.group-detail-header__icon--ab {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.group-detail-header__icon--campaign {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
}

.group-detail-header__icon--client {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
}

.group-detail-header__icon svg {
  width: 36px;
  height: 36px;
}

.group-detail-header__info {
  flex: 1;
}

.group-detail-header__type {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.group-detail-header__type--ab {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
}

.group-detail-header__type--campaign {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.group-detail-header__type--client {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.group-detail-header__title {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.group-detail-header__description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.group-detail-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.group-detail-header__action-button {
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

.group-detail-header__action-button:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f0f9ff;
}

.group-detail-header__action-button--danger:hover {
  border-color: #dc2626;
  color: #dc2626;
  background: #fee2e2;
}

.group-detail-header__action-button svg {
  width: 18px;
  height: 18px;
}

.group-detail-header__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f3f4f6;
}

.group-detail-stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-detail-stat__label {
  font-size: 0.813rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.group-detail-stat__value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.group-detail-stat__change {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.813rem;
  font-weight: 600;
}

.group-detail-stat__change--up {
  color: #059669;
}

.group-detail-stat__change--down {
  color: #dc2626;
}

.group-detail-stat__change svg {
  width: 14px;
  height: 14px;
}

/* Content Layout */
.group-detail-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  align-items: flex-start;
}

/* Main Section */
.group-detail-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Funnels Section */
.group-funnels {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.group-funnels__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.group-funnels__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.group-funnels__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-funnel-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.group-funnel-card:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

.group-funnel-card__icon {
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

.group-funnel-card__icon svg {
  width: 24px;
  height: 24px;
}

.group-funnel-card__content {
  flex: 1;
}

.group-funnel-card__name {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.group-funnel-card__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.813rem;
  color: #6b7280;
}

.group-funnel-card__meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.group-funnel-card__meta-item svg {
  width: 14px;
  height: 14px;
}

.group-funnel-card__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.group-funnel-card__action {
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

.group-funnel-card__action:hover {
  background: #667eea;
  color: #ffffff;
}

.group-funnel-card__action svg {
  width: 16px;
  height: 16px;
}

/* Sidebar */
.group-detail-sidebar {
  position: sticky;
  top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Info Card */
.group-info-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.group-info-card__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1.25rem 0;
}

.group-info-card__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-info-card__item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.group-info-card__label {
  font-size: 0.813rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.group-info-card__value {
  font-size: 0.938rem;
  font-weight: 600;
  color: #111827;
}

.group-info-card__actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f3f4f6;
}

/* Comparison Chart */
.group-comparison {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.group-comparison__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.group-comparison__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.group-comparison__body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.group-comparison__item {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.group-comparison__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-comparison__item-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.group-comparison__item-value {
  font-size: 0.938rem;
  font-weight: 700;
  color: #667eea;
}

.group-comparison__bar {
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.group-comparison__bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* Edit Modal */
.group-edit-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  animation: group-modal-enter 0.3s ease-out;
}

@keyframes group-modal-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}

.group-edit-modal__content {
  background: #ffffff;
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 540px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: group-modal-content-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes group-modal-content-enter {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.group-edit-modal__header {
  margin-bottom: 2rem;
}

.group-edit-modal__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.group-edit-modal__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.group-edit-modal__form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.group-edit-modal__form-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.group-edit-modal__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
}

.group-edit-modal__textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.875rem 1rem;
  font-size: 0.938rem;
  font-family: inherit;
  color: #111827;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  resize: vertical;
  transition: all 0.2s ease;
}

.group-edit-modal__textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.group-edit-modal__actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 2px solid #f3f4f6;
  margin-top: 0.5rem;
}

/* Move Modal */
.group-move-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  animation: group-modal-enter 0.3s ease-out;
}

.group-move-modal__content {
  background: #ffffff;
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: group-modal-content-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.group-move-modal__header {
  margin-bottom: 2rem;
}

.group-move-modal__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.group-move-modal__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.group-move-modal__form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.group-move-modal__form-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.group-move-modal__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
}

.group-move-modal__actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 2px solid #f3f4f6;
  margin-top: 0.5rem;
}

/* Empty State */
.group-funnels-empty {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

.group-funnels-empty__icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  color: #d1d5db;
}

.group-funnels-empty__icon svg {
  width: 100%;
  height: 100%;
}

.group-funnels-empty__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.group-funnels-empty__message {
  font-size: 0.875rem;
  margin: 0 0 1.25rem 0;
  line-height: 1.6;
}

/* Loading */
.group-detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.group-detail-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: group-spin 0.8s linear infinite;
}

@keyframes group-spin {
  to { transform: rotate(360deg); }
}

.group-detail-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Responsive */
@media (max-width: 1024px) {
  .group-detail-content {
    grid-template-columns: 1fr;
  }
  
  .group-detail-sidebar {
    position: static;
  }
  
  .group-detail-header__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .group-detail-page {
    padding: 1.5rem 1rem;
  }
  
  .group-detail-header {
    padding: 1.5rem;
  }
  
  .group-detail-header__top {
    flex-direction: column;
  }
  
  .group-detail-header__content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .group-detail-header__actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .group-detail-header__stats {
    grid-template-columns: 1fr;
  }
  
  .group-funnels,
  .group-info-card,
  .group-comparison {
    padding: 1.5rem;
  }
  
  .group-funnel-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .group-funnel-card__actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .group-edit-modal__content,
  .group-move-modal__content {
    padding: 2rem 1.5rem;
  }
  
  .group-edit-modal__actions,
  .group-move-modal__actions {
    flex-direction: column-reverse;
  }
  
  .group-edit-modal__actions button,
  .group-move-modal__actions button {
    width: 100%;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .group-funnel-card,
  .group-edit-modal,
  .group-edit-modal__content,
  .group-move-modal,
  .group-move-modal__content,
  .group-detail-loading__spinner {
    animation: none !important;
  }
  
  .group-funnel-card:hover {
    transform: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'group-detail');
  styleElement.textContent = GROUP_DETAIL_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const BeakerIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const SpeakerphoneIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);

const UserGroupIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const EditIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChartIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const EyeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const UsersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

const SwitchIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const PlusIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const GroupDetailPage = ({
  className = '',
  ...props
}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    injectStyles();
  }, []);

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [funnels, setFunnels] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState(null);
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [moveToGroupId, setMoveToGroupId] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const groupTypeIcons = {
    ab: <BeakerIcon />,
    campaign: <SpeakerphoneIcon />,
    client: <UserGroupIcon />,
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupData, funnelsData, analyticsData] = await Promise.all([
        getGroupById(id),
        getGroupFunnels(id),
        getGroupAnalytics(id),
      ]);
      setGroup(groupData);
      setFunnels(funnelsData);
      setAnalytics(analyticsData);
      setEditData({ name: groupData.name, description: groupData.description || '' });
    } catch (error) {
      console.error('Failed to fetch group data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!editData.name.trim()) return;

    setFormLoading(true);
    try {
      await updateGroup(id, editData);
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update group:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this group? All funnels will be ungrouped.')) return;

    try {
      await deleteGroup(id);
      navigate('/groups');
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleMoveFunnel = (funnel) => {
    setSelectedFunnel(funnel);
    setShowMoveModal(true);
  };

  const handleConfirmMove = async (e) => {
    e.preventDefault();
    if (!moveToGroupId || !selectedFunnel) return;

    setFormLoading(true);
    try {
      await moveFunnel(selectedFunnel.id, moveToGroupId);
      setShowMoveModal(false);
      setSelectedFunnel(null);
      setMoveToGroupId('');
      fetchData();
    } catch (error) {
      console.error('Failed to move funnel:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="group-detail-page">
        <div className="group-detail-page__inner">
          <div className="group-detail-loading">
            <div className="group-detail-loading__spinner" />
            <p className="group-detail-loading__text">Loading group...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-detail-page">
        <div className="group-detail-page__inner">
          <div className="group-funnels-empty">
            <h3 className="group-funnels-empty__title">Group not found</h3>
            <p className="group-funnels-empty__message">The group you're looking for doesn't exist.</p>
            <Button variant="primary" onClick={() => navigate('/groups')}>
              Back to Groups
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group-detail-page ${className}`} {...props}>
      <div className="group-detail-page__inner">
        {/* Breadcrumb */}
        <div className="group-breadcrumb">
          <a href="/groups" className="group-breadcrumb__link">Groups</a>
          <span className="group-breadcrumb__separator">/</span>
          <span className="group-breadcrumb__current">{group.name}</span>
        </div>

        {/* Header */}
        <div className="group-detail-header">
          <div className="group-detail-header__top">
            <div className="group-detail-header__content">
              <div className={`group-detail-header__icon group-detail-header__icon--${group.type}`}>
                {groupTypeIcons[group.type]}
              </div>
              <div className="group-detail-header__info">
                <div className={`group-detail-header__type group-detail-header__type--${group.type}`}>
                  {group.type === 'ab' ? 'A/B Test' : group.type === 'campaign' ? 'Campaign' : 'Client'}
                </div>
                <h1 className="group-detail-header__title">{group.name}</h1>
                {group.description && (
                  <p className="group-detail-header__description">{group.description}</p>
                )}
              </div>
            </div>
            <div className="group-detail-header__actions">
              <button
                className="group-detail-header__action-button"
                onClick={handleEdit}
                title="Edit Group"
              >
                <EditIcon />
              </button>
              <button
                className="group-detail-header__action-button group-detail-header__action-button--danger"
                onClick={handleDelete}
                title="Delete Group"
              >
                <TrashIcon />
              </button>
            </div>
          </div>

          {analytics && (
            <div className="group-detail-header__stats">
              <div className="group-detail-stat">
                <div className="group-detail-stat__label">Total Views</div>
                <div className="group-detail-stat__value">{formatNumber(analytics.views)}</div>
                {analytics.viewsChange !== undefined && (
                  <div className={`group-detail-stat__change ${analytics.viewsChange >= 0 ? 'group-detail-stat__change--up' : 'group-detail-stat__change--down'}`}>
                    {analytics.viewsChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    {Math.abs(analytics.viewsChange)}%
                  </div>
                )}
              </div>

              <div className="group-detail-stat">
                <div className="group-detail-stat__label">Total Leads</div>
                <div className="group-detail-stat__value">{formatNumber(analytics.leads)}</div>
                {analytics.leadsChange !== undefined && (
                  <div className={`group-detail-stat__change ${analytics.leadsChange >= 0 ? 'group-detail-stat__change--up' : 'group-detail-stat__change--down'}`}>
                    {analytics.leadsChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    {Math.abs(analytics.leadsChange)}%
                  </div>
                )}
              </div>

              <div className="group-detail-stat">
                <div className="group-detail-stat__label">Avg. Conversion</div>
                <div className="group-detail-stat__value">{analytics.conversion}%</div>
                {analytics.conversionChange !== undefined && (
                  <div className={`group-detail-stat__change ${analytics.conversionChange >= 0 ? 'group-detail-stat__change--up' : 'group-detail-stat__change--down'}`}>
                    {analytics.conversionChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    {Math.abs(analytics.conversionChange)}%
                  </div>
                )}
              </div>

              <div className="group-detail-stat">
                <div className="group-detail-stat__label">Funnels</div>
                <div className="group-detail-stat__value">{funnels.length}</div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="group-detail-content">
          {/* Main Section */}
          <div className="group-detail-main">
            {/* Funnels */}
            <div className="group-funnels">
              <div className="group-funnels__header">
                <h2 className="group-funnels__title">Funnels ({funnels.length})</h2>
                <Button variant="outline" size="sm" leftIcon={<PlusIcon />}>
                  Add Funnel
                </Button>
              </div>

              {funnels.length === 0 ? (
                <div className="group-funnels-empty">
                  <div className="group-funnels-empty__icon">
                    <ChartIcon />
                  </div>
                  <h3 className="group-funnels-empty__title">No funnels yet</h3>
                  <p className="group-funnels-empty__message">
                    Add funnels to this group to start organizing
                  </p>
                  <Button variant="primary" size="sm">Add Funnel</Button>
                </div>
              ) : (
                <div className="group-funnels__list">
                  {funnels.map((funnel) => (
                    <div key={funnel.id} className="group-funnel-card">
                      <div className="group-funnel-card__icon">
                        <ChartIcon />
                      </div>
                      <div className="group-funnel-card__content">
                        <h3 className="group-funnel-card__name">{funnel.name}</h3>
                        <div className="group-funnel-card__meta">
                          <div className="group-funnel-card__meta-item">
                            <EyeIcon />
                            {formatNumber(funnel.views)} views
                          </div>
                          <div className="group-funnel-card__meta-item">
                            <UsersIcon />
                            {formatNumber(funnel.leads)} leads
                          </div>
                          <div className="group-funnel-card__meta-item">
                            {funnel.conversion}% conversion
                          </div>
                        </div>
                      </div>
                      <div className="group-funnel-card__actions">
                        <button
                          className="group-funnel-card__action"
                          onClick={() => handleMoveFunnel(funnel)}
                          title="Move to another group"
                        >
                          <SwitchIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="group-detail-sidebar">
            {/* Info Card */}
            <div className="group-info-card">
              <h3 className="group-info-card__title">Group Information</h3>
              <div className="group-info-card__list">
                <div className="group-info-card__item">
                  <div className="group-info-card__label">Type</div>
                  <div className="group-info-card__value">
                    {group.type === 'ab' ? 'A/B Test' : group.type === 'campaign' ? 'Campaign' : 'Client'}
                  </div>
                </div>
                <div className="group-info-card__item">
                  <div className="group-info-card__label">Created</div>
                  <div className="group-info-card__value">{formatDate(group.createdAt)}</div>
                </div>
                <div className="group-info-card__item">
                  <div className="group-info-card__label">Last Updated</div>
                  <div className="group-info-card__value">{formatDate(group.updatedAt)}</div>
                </div>
                <div className="group-info-card__item">
                  <div className="group-info-card__label">Funnels</div>
                  <div className="group-info-card__value">{funnels.length} total</div>
                </div>
              </div>
              <div className="group-info-card__actions">
                <Button variant="outline" size="sm" onClick={handleEdit} leftIcon={<EditIcon />}>
                  Edit Group
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDelete} leftIcon={<TrashIcon />}>
                  Delete Group
                </Button>
              </div>
            </div>

            {/* Comparison */}
            {funnels.length > 0 && (
              <div className="group-comparison">
                <div className="group-comparison__header">
                  <h3 className="group-comparison__title">Performance Comparison</h3>
                </div>
                <div className="group-comparison__body">
                  {funnels.slice(0, 5).map((funnel) => (
                    <div key={funnel.id} className="group-comparison__item">
                      <div className="group-comparison__item-header">
                        <div className="group-comparison__item-label">{funnel.name}</div>
                        <div className="group-comparison__item-value">{funnel.conversion}%</div>
                      </div>
                      <div className="group-comparison__bar">
                        <div
                          className="group-comparison__bar-fill"
                          style={{ width: `${funnel.conversion}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="group-edit-modal" onClick={() => setShowEditModal(false)}>
          <div className="group-edit-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="group-edit-modal__header">
              <h2 className="group-edit-modal__title">Edit Group</h2>
              <p className="group-edit-modal__subtitle">Update group information</p>
            </div>

            <form className="group-edit-modal__form" onSubmit={handleUpdateGroup}>
              <div className="group-edit-modal__form-group">
                <label htmlFor="editName" className="group-edit-modal__label">
                  Group Name
                </label>
                <Input
                  id="editName"
                  value={editData.name}
                  onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={formLoading}
                  autoFocus
                  required
                />
              </div>

              <div className="group-edit-modal__form-group">
                <label htmlFor="editDescription" className="group-edit-modal__label">
                  Description (optional)
                </label>
                <textarea
                  id="editDescription"
                  className="group-edit-modal__textarea"
                  value={editData.description}
                  onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={formLoading}
                />
              </div>

              <div className="group-edit-modal__actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowEditModal(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={formLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && selectedFunnel && (
        <div className="group-move-modal" onClick={() => setShowMoveModal(false)}>
          <div className="group-move-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="group-move-modal__header">
              <h2 className="group-move-modal__title">Move Funnel</h2>
              <p className="group-move-modal__subtitle">
                Move "{selectedFunnel.name}" to another group
              </p>
            </div>

            <form className="group-move-modal__form" onSubmit={handleConfirmMove}>
              <div className="group-move-modal__form-group">
                <label htmlFor="moveToGroup" className="group-move-modal__label">
                  Select Group
                </label>
                <Select
                  id="moveToGroup"
                  value={moveToGroupId}
                  onChange={(e) => setMoveToGroupId(e.target.value)}
                  disabled={formLoading}
                  required
                >
                  <option value="">Choose a group...</option>
                  <option value="group-1">Marketing Campaign</option>
                  <option value="group-2">A/B Test 2025</option>
                  <option value="group-3">Client Projects</option>
                </Select>
              </div>

              <div className="group-move-modal__actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowMoveModal(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={formLoading}>
                  Move Funnel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

GroupDetailPage.propTypes = {
  className: PropTypes.string,
};

export default GroupDetailPage;
export { GroupDetailPage };