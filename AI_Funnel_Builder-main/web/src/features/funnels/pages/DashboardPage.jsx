// =============================================================================
// AI FUNNEL PLATFORM - DashboardPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui';
import { getDashboardStats, getRecentFunnels, getActivityTimeline } from '@/lib/api/funnels.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const DASHBOARD_PAGE_STYLES = `
/* Dashboard Container */
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.dashboard-page__inner {
  max-width: 1600px;
  margin: 0 auto;
}

/* Header */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.dashboard-header__content {
  flex: 1;
}

.dashboard-header__greeting {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.dashboard-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.dashboard-header__actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

/* Stats Grid */
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.dashboard-stat-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.dashboard-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.dashboard-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.dashboard-stat-card:hover::before {
  transform: scaleX(1);
}

.dashboard-stat-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.dashboard-stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  flex-shrink: 0;
}

.dashboard-stat-card__icon--primary {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #667eea;
}

.dashboard-stat-card__icon--success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
}

.dashboard-stat-card__icon--warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
}

.dashboard-stat-card__icon--info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #3b82f6;
}

.dashboard-stat-card__icon svg {
  width: 26px;
  height: 26px;
}

.dashboard-stat-card__trend {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  font-size: 0.813rem;
  font-weight: 700;
}

.dashboard-stat-card__trend--up {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.dashboard-stat-card__trend--down {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.dashboard-stat-card__trend svg {
  width: 14px;
  height: 14px;
}

.dashboard-stat-card__body {
  margin-bottom: 0.75rem;
}

.dashboard-stat-card__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.dashboard-stat-card__value {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
  line-height: 1;
}

.dashboard-stat-card__footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.813rem;
  color: #6b7280;
}

.dashboard-stat-card__footer-icon svg {
  width: 14px;
  height: 14px;
}

/* Main Layout */
.dashboard-main {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 2rem;
  align-items: flex-start;
}

/* Recent Funnels */
.dashboard-funnels {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.dashboard-funnels__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.dashboard-funnels__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.dashboard-funnels__link {
  font-size: 0.875rem;
  font-weight: 600;
  color: #667eea;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: color 0.2s ease;
}

.dashboard-funnels__link:hover {
  color: #764ba2;
}

.dashboard-funnels__link svg {
  width: 16px;
  height: 16px;
}

.dashboard-funnels__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dashboard-funnel-card {
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

.dashboard-funnel-card:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

.dashboard-funnel-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  flex-shrink: 0;
}

.dashboard-funnel-card__icon svg {
  width: 28px;
  height: 28px;
}

.dashboard-funnel-card__content {
  flex: 1;
}

.dashboard-funnel-card__name {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.375rem 0;
}

.dashboard-funnel-card__stats {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  font-size: 0.813rem;
  color: #6b7280;
}

.dashboard-funnel-card__stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.dashboard-funnel-card__stat svg {
  width: 14px;
  height: 14px;
}

.dashboard-funnel-card__status {
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

.dashboard-funnel-card__status--active {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.dashboard-funnel-card__status--draft {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
}

.dashboard-funnel-card__status--paused {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

/* Sidebar */
.dashboard-sidebar {
  position: sticky;
  top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Quick Actions */
.dashboard-quick-actions {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  color: #ffffff;
}

.dashboard-quick-actions__title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
}

.dashboard-quick-actions__list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.dashboard-quick-action {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dashboard-quick-action:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(4px);
}

.dashboard-quick-action__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.dashboard-quick-action__icon svg {
  width: 20px;
  height: 20px;
}

.dashboard-quick-action__content {
  flex: 1;
}

.dashboard-quick-action__title {
  font-size: 0.938rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.dashboard-quick-action__description {
  font-size: 0.813rem;
  margin: 0;
  opacity: 0.9;
}

/* Activity Timeline */
.dashboard-activity {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.dashboard-activity__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.dashboard-activity__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.dashboard-activity__timeline {
  position: relative;
  padding-left: 2rem;
}

.dashboard-activity__timeline::before {
  content: '';
  position: absolute;
  left: 0.625rem;
  top: 0.5rem;
  bottom: 0.5rem;
  width: 2px;
  background: linear-gradient(180deg, #667eea 0%, #e5e7eb 100%);
}

.dashboard-activity__item {
  position: relative;
  padding-bottom: 1.5rem;
}

.dashboard-activity__item:last-child {
  padding-bottom: 0;
}

.dashboard-activity__item::before {
  content: '';
  position: absolute;
  left: -1.375rem;
  top: 0.375rem;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #667eea;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 2px #667eea;
}

.dashboard-activity__item--success::before {
  background: #10b981;
  box-shadow: 0 0 0 2px #10b981;
}

.dashboard-activity__item--warning::before {
  background: #f59e0b;
  box-shadow: 0 0 0 2px #f59e0b;
}

.dashboard-activity__item-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.375rem;
}

.dashboard-activity__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
  flex-shrink: 0;
}

.dashboard-activity__item-icon svg {
  width: 16px;
  height: 16px;
}

.dashboard-activity__item-content {
  flex: 1;
}

.dashboard-activity__item-title {
  font-size: 0.938rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.dashboard-activity__item-description {
  font-size: 0.813rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.dashboard-activity__item-time {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

/* Chart Section */
.dashboard-chart {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-top: 2rem;
}

.dashboard-chart__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-chart__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.dashboard-chart__filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dashboard-chart__filter {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dashboard-chart__filter:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.dashboard-chart__filter--active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #667eea;
  color: #667eea;
}

.dashboard-chart__body {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 12px;
  padding: 2rem;
}

.dashboard-chart__placeholder {
  text-align: center;
  color: #6b7280;
}

.dashboard-chart__placeholder-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  color: #d1d5db;
}

.dashboard-chart__placeholder-icon svg {
  width: 100%;
  height: 100%;
}

.dashboard-chart__placeholder-text {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

/* Empty State */
.dashboard-empty {
  text-align: center;
  padding: 3rem 2rem;
  background: #ffffff;
  border-radius: 16px;
  border: 2px dashed #e5e7eb;
}

.dashboard-empty__icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  color: #d1d5db;
}

.dashboard-empty__icon svg {
  width: 100%;
  height: 100%;
}

.dashboard-empty__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.dashboard-empty__message {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

/* Loading */
.dashboard-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.dashboard-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: dashboard-spin 0.8s linear infinite;
}

@keyframes dashboard-spin {
  to { transform: rotate(360deg); }
}

.dashboard-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Responsive */
@media (max-width: 1400px) {
  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dashboard-main {
    grid-template-columns: 1fr;
  }
  
  .dashboard-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 1.5rem 1rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .dashboard-header__greeting {
    font-size: 1.75rem;
  }
  
  .dashboard-header__actions {
    width: 100%;
  }
  
  .dashboard-stats {
    grid-template-columns: 1fr;
  }
  
  .dashboard-funnels,
  .dashboard-quick-actions,
  .dashboard-activity,
  .dashboard-chart {
    padding: 1.5rem;
  }
  
  .dashboard-funnel-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .dashboard-funnel-card__stats {
    flex-wrap: wrap;
  }
  
  .dashboard-chart__header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .dashboard-chart__filters {
    width: 100%;
    overflow-x: auto;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .dashboard-stat-card,
  .dashboard-funnel-card,
  .dashboard-quick-action,
  .dashboard-loading__spinner {
    animation: none !important;
  }
  
  .dashboard-stat-card:hover,
  .dashboard-funnel-card:hover,
  .dashboard-quick-action:hover {
    transform: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'dashboard-page');
  styleElement.textContent = DASHBOARD_PAGE_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

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

const ChartIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

const ClockIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const PlusIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const TemplateIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
  </svg>
);

const DocumentIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BellIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const SparklesIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const DollarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
// Add this with the other icons
const LogoutIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const DashboardPage = ({
  className = '',
  ...props
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    injectStyles();
  }, []);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentFunnels, setRecentFunnels] = useState([]);
  const [activities, setActivities] = useState([]);
  const [chartMetric, setChartMetric] = useState('views');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, funnelsData, activitiesData] = await Promise.all([
        getDashboardStats(),
        getRecentFunnels(5),
        getActivityTimeline(10),
      ]);
      setStats(statsData);
      setRecentFunnels(funnelsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
const handleLogout = async () => {
  try {
    // Clear ALL storage types
    sessionStorage.clear();
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Optional: Call logout API endpoint
    // await fetch('/api/v1/auth/logout', { method: 'POST' });
    
    // Show success message
    console.log('✅ Logged out successfully');
    
    // Redirect to login page
    navigate('/auth/login', { replace: true });
  } catch (error) {
    console.error('❌ Logout failed:', error);
    // Still redirect even if API call fails
    navigate('/auth/login', { replace: true });
  }
};

  const quickActions = [
    {
      icon: <PlusIcon />,
      title: 'Create Funnel',
      description: 'Build a new funnel from scratch',
      action: () => navigate('/funnels/create'),
    },
    {
      icon: <TemplateIcon />,
      title: 'Use Template',
      description: 'Start with a pre-built template',
      action: () => navigate('/templates'),
    },
    {
      icon: <DocumentIcon />,
      title: 'View Reports',
      description: 'Check detailed analytics',
      action: () => navigate('/analytics'),
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-page__inner">
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <p className="dashboard-loading__text">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-page ${className}`} {...props}>
      <div className="dashboard-page__inner">
{/* Header */}
<div className="dashboard-header">
  <div className="dashboard-header__content">
    <h1 className="dashboard-header__greeting">{getGreeting()}! 👋</h1>
    <p className="dashboard-header__subtitle">Here's what's happening with your funnels today</p>
  </div>
  <div className="dashboard-header__actions">
    <Button 
      variant="outline" 
      size="md" 
      leftIcon={<BellIcon />}
    >
      Notifications
    </Button>
    <Button 
      variant="primary" 
      size="md" 
      leftIcon={<PlusIcon />} 
      onClick={() => navigate('/funnels/create')}
    >
      Create Funnel
    </Button>
    <Button 
      variant="danger" 
      size="md" 
      leftIcon={<LogoutIcon />} 
      onClick={handleLogout}
    >
      Logout
    </Button>
  </div>
</div>

        {/* Stats */}
        {stats && (
          <div className="dashboard-stats">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-card__header">
                <div className="dashboard-stat-card__icon dashboard-stat-card__icon--primary">
                  <EyeIcon />
                </div>
                <div className={`dashboard-stat-card__trend ${stats.views.trend >= 0 ? 'dashboard-stat-card__trend--up' : 'dashboard-stat-card__trend--down'}`}>
                  {stats.views.trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  {Math.abs(stats.views.trend)}%
                </div>
              </div>
              <div className="dashboard-stat-card__body">
                <p className="dashboard-stat-card__label">Total Views</p>
                <p className="dashboard-stat-card__value">{formatNumber(stats.views.total)}</p>
              </div>
              <div className="dashboard-stat-card__footer">
                <div className="dashboard-stat-card__footer-icon">
                  <ClockIcon />
                </div>
                <span>Last 30 days</span>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-card__header">
                <div className="dashboard-stat-card__icon dashboard-stat-card__icon--success">
                  <UsersIcon />
                </div>
                <div className={`dashboard-stat-card__trend ${stats.leads.trend >= 0 ? 'dashboard-stat-card__trend--up' : 'dashboard-stat-card__trend--down'}`}>
                  {stats.leads.trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  {Math.abs(stats.leads.trend)}%
                </div>
              </div>
              <div className="dashboard-stat-card__body">
                <p className="dashboard-stat-card__label">Total Leads</p>
                <p className="dashboard-stat-card__value">{formatNumber(stats.leads.total)}</p>
              </div>
              <div className="dashboard-stat-card__footer">
                <div className="dashboard-stat-card__footer-icon">
                  <ClockIcon />
                </div>
                <span>Last 30 days</span>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-card__header">
                <div className="dashboard-stat-card__icon dashboard-stat-card__icon--warning">
                  <ChartIcon />
                </div>
                <div className={`dashboard-stat-card__trend ${stats.conversion.trend >= 0 ? 'dashboard-stat-card__trend--up' : 'dashboard-stat-card__trend--down'}`}>
                  {stats.conversion.trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  {Math.abs(stats.conversion.trend)}%
                </div>
              </div>
              <div className="dashboard-stat-card__body">
                <p className="dashboard-stat-card__label">Avg. Conversion</p>
                <p className="dashboard-stat-card__value">{stats.conversion.rate}%</p>
              </div>
              <div className="dashboard-stat-card__footer">
                <div className="dashboard-stat-card__footer-icon">
                  <ClockIcon />
                </div>
                <span>Last 30 days</span>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-card__header">
                <div className="dashboard-stat-card__icon dashboard-stat-card__icon--info">
                  <DollarIcon />
                </div>
                <div className={`dashboard-stat-card__trend ${stats.revenue.trend >= 0 ? 'dashboard-stat-card__trend--up' : 'dashboard-stat-card__trend--down'}`}>
                  {stats.revenue.trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  {Math.abs(stats.revenue.trend)}%
                </div>
              </div>
              <div className="dashboard-stat-card__body">
                <p className="dashboard-stat-card__label">Total Revenue</p>
                <p className="dashboard-stat-card__value">${formatNumber(stats.revenue.total)}</p>
              </div>
              <div className="dashboard-stat-card__footer">
                <div className="dashboard-stat-card__footer-icon">
                  <ClockIcon />
                </div>
                <span>Last 30 days</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="dashboard-main">
          {/* Recent Funnels */}
          <div className="dashboard-funnels">
            <div className="dashboard-funnels__header">
              <h2 className="dashboard-funnels__title">Recent Funnels</h2>
              <a href="/funnels" className="dashboard-funnels__link">
                View All
                <ArrowRightIcon />
              </a>
            </div>

            {recentFunnels.length === 0 ? (
              <div className="dashboard-empty">
                <div className="dashboard-empty__icon">
                  <ChartIcon />
                </div>
                <h3 className="dashboard-empty__title">No funnels yet</h3>
                <p className="dashboard-empty__message">
                  Create your first funnel to start capturing leads
                </p>
                <Button variant="primary" onClick={() => navigate('/funnels/create')}>
                  Create Funnel
                </Button>
              </div>
            ) : (
              <div className="dashboard-funnels__list">
                {recentFunnels.map((funnel) => (
                  <div
                    key={funnel.id}
                    className="dashboard-funnel-card"
                    onClick={() => navigate(`/funnels/${funnel.id}`)}
                  >
                    <div className="dashboard-funnel-card__icon">
                      <ChartIcon />
                    </div>
                    <div className="dashboard-funnel-card__content">
                      <h3 className="dashboard-funnel-card__name">{funnel.name}</h3>
                      <div className="dashboard-funnel-card__stats">
                        <div className="dashboard-funnel-card__stat">
                          <EyeIcon />
                          {formatNumber(funnel.views)} views
                        </div>
                        <div className="dashboard-funnel-card__stat">
                          <UsersIcon />
                          {formatNumber(funnel.leads)} leads
                        </div>
                        <div className="dashboard-funnel-card__stat">
                          {funnel.conversion}% conversion
                        </div>
                      </div>
                    </div>
                    <div className={`dashboard-funnel-card__status dashboard-funnel-card__status--${funnel.status}`}>
                      {funnel.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="dashboard-sidebar">
            {/* Quick Actions */}
            <div className="dashboard-quick-actions">
              <h3 className="dashboard-quick-actions__title">Quick Actions</h3>
              <div className="dashboard-quick-actions__list">
                {quickActions.map((action, index) => (
                  <div key={index} className="dashboard-quick-action" onClick={action.action}>
                    <div className="dashboard-quick-action__icon">{action.icon}</div>
                    <div className="dashboard-quick-action__content">
                      <h4 className="dashboard-quick-action__title">{action.title}</h4>
                      <p className="dashboard-quick-action__description">{action.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="dashboard-activity">
              <div className="dashboard-activity__header">
                <h3 className="dashboard-activity__title">Recent Activity</h3>
              </div>
              <div className="dashboard-activity__timeline">
                {activities.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                    No recent activity
                  </p>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`dashboard-activity__item dashboard-activity__item--${activity.type}`}
                    >
                      <div className="dashboard-activity__item-header">
                        <div className="dashboard-activity__item-icon">
                          {activity.type === 'success' ? <SparklesIcon /> : <BellIcon />}
                        </div>
                        <div className="dashboard-activity__item-content">
                          <h4 className="dashboard-activity__item-title">{activity.title}</h4>
                          <p className="dashboard-activity__item-description">{activity.description}</p>
                          <div className="dashboard-activity__item-time">{activity.time}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="dashboard-chart">
          <div className="dashboard-chart__header">
            <h2 className="dashboard-chart__title">Performance Overview</h2>
            <div className="dashboard-chart__filters">
              {['views', 'leads', 'conversions', 'revenue'].map((metric) => (
                <button
                  key={metric}
                  className={`dashboard-chart__filter ${chartMetric === metric ? 'dashboard-chart__filter--active' : ''}`}
                  onClick={() => setChartMetric(metric)}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="dashboard-chart__body">
            <div className="dashboard-chart__placeholder">
              <div className="dashboard-chart__placeholder-icon">
                <ChartIcon />
              </div>
              <p className="dashboard-chart__placeholder-text">
                Chart visualization will be rendered here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DashboardPage.propTypes = {
  className: PropTypes.string,
};

export default DashboardPage;
export { DashboardPage };
