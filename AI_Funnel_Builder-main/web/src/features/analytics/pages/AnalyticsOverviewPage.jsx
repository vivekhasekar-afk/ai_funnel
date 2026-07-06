// =============================================================================
// AI FUNNEL PLATFORM - AnalyticsOverviewPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, Select } from '../../../components/ui';
import { getOverviewAnalytics, getTopPerformers, getChartData } from '../../../api/analytics.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const ANALYTICS_PAGE_STYLES = `
/* Analytics Container */
.analytics-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.analytics-page__inner {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.analytics-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.analytics-header__content {
  flex: 1;
  min-width: 200px;
}

.analytics-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.analytics-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.analytics-header__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Date Range Picker */
.analytics-date-picker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.analytics-date-picker__icon {
  color: #667eea;
  display: flex;
  align-items: center;
}

.analytics-date-picker__icon svg {
  width: 20px;
  height: 20px;
}

.analytics-date-picker__select {
  border: none;
  background: none;
  font-size: 0.938rem;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  outline: none;
  padding: 0.25rem 0.5rem;
}

/* Stats Grid */
.analytics-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.analytics-stat-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.analytics-stat-card::before {
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

.analytics-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.analytics-stat-card:hover::before {
  transform: scaleX(1);
}

.analytics-stat-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.analytics-stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #667eea;
}

.analytics-stat-card__icon svg {
  width: 24px;
  height: 24px;
}

.analytics-stat-card__trend {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  font-size: 0.813rem;
  font-weight: 700;
}

.analytics-stat-card__trend--up {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.analytics-stat-card__trend--down {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.analytics-stat-card__trend svg {
  width: 14px;
  height: 14px;
}

.analytics-stat-card__body {
  margin-bottom: 0.75rem;
}

.analytics-stat-card__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.analytics-stat-card__value {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
  line-height: 1;
}

.analytics-stat-card__footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.813rem;
  color: #6b7280;
}

.analytics-stat-card__footer-icon svg {
  width: 14px;
  height: 14px;
}

/* Chart Section */
.analytics-chart-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.analytics-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.analytics-chart-header__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.analytics-chart-header__filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.analytics-chart-filter {
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

.analytics-chart-filter:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.analytics-chart-filter--active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #667eea;
  color: #667eea;
}

.analytics-chart-body {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 12px;
  padding: 2rem;
}

.analytics-chart-placeholder {
  text-align: center;
  color: #6b7280;
}

.analytics-chart-placeholder__icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  color: #d1d5db;
}

.analytics-chart-placeholder__icon svg {
  width: 100%;
  height: 100%;
}

.analytics-chart-placeholder__text {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

/* Top Performers */
.analytics-performers {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.analytics-performers__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.analytics-performers__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.analytics-performers__link {
  font-size: 0.875rem;
  font-weight: 600;
  color: #667eea;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: color 0.2s ease;
}

.analytics-performers__link:hover {
  color: #764ba2;
}

.analytics-performers__link svg {
  width: 16px;
  height: 16px;
}

.analytics-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.analytics-table__header {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.analytics-table__header th {
  padding: 0.875rem 1rem;
  text-align: left;
  font-size: 0.813rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
}

.analytics-table__header th:first-child {
  border-radius: 8px 0 0 0;
}

.analytics-table__header th:last-child {
  border-radius: 0 8px 0 0;
}

.analytics-table__body tr {
  transition: background-color 0.2s ease;
}

.analytics-table__body tr:hover {
  background: linear-gradient(135deg, #fafbfc 0%, #f9fafb 100%);
}

.analytics-table__body td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.938rem;
}

.analytics-table__body tr:last-child td {
  border-bottom: none;
}

.analytics-table__rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.875rem;
}

.analytics-table__rank--1 {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.analytics-table__rank--2 {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #3730a3;
}

.analytics-table__rank--3 {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  color: #7c2d12;
}

.analytics-table__rank--other {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
}

.analytics-table__funnel {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.analytics-table__funnel-name {
  font-weight: 600;
  color: #111827;
}

.analytics-table__funnel-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.analytics-table__funnel-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.analytics-table__funnel-status-dot--active {
  background: #10b981;
}

.analytics-table__funnel-status-dot--paused {
  background: #f59e0b;
}

.analytics-table__metric {
  font-weight: 600;
  color: #111827;
}

.analytics-table__conversion {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.analytics-table__conversion-bar {
  flex: 1;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.analytics-table__conversion-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.analytics-table__conversion-value {
  font-weight: 700;
  color: #667eea;
  min-width: 45px;
  text-align: right;
}

/* Empty State */
.analytics-empty {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.analytics-empty__icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  color: #d1d5db;
}

.analytics-empty__icon svg {
  width: 100%;
  height: 100%;
}

.analytics-empty__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.analytics-empty__message {
  font-size: 0.938rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

/* Loading State */
.analytics-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.analytics-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: analytics-spin 0.8s linear infinite;
}

@keyframes analytics-spin {
  to { transform: rotate(360deg); }
}

.analytics-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Skeleton Loading */
.analytics-skeleton {
  background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
  background-size: 200% 100%;
  animation: analytics-skeleton 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes analytics-skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.analytics-skeleton--stat {
  height: 120px;
}

.analytics-skeleton--chart {
  height: 400px;
}

.analytics-skeleton--table {
  height: 60px;
  margin-bottom: 0.5rem;
}

/* Responsive */
@media (max-width: 1200px) {
  .analytics-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .analytics-page {
    padding: 1.5rem 1rem;
  }
  
  .analytics-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .analytics-header__title {
    font-size: 1.75rem;
  }
  
  .analytics-header__actions {
    width: 100%;
    flex-direction: column;
  }
  
  .analytics-date-picker {
    width: 100%;
    justify-content: space-between;
  }
  
  .analytics-stats {
    grid-template-columns: 1fr;
  }
  
  .analytics-chart-section,
  .analytics-performers {
    padding: 1.5rem;
  }
  
  .analytics-chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .analytics-chart-header__filters {
    width: 100%;
    overflow-x: auto;
  }
  
  .analytics-table {
    display: block;
    overflow-x: auto;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .analytics-stat-card,
  .analytics-loading__spinner,
  .analytics-skeleton {
    animation: none !important;
  }
  
  .analytics-stat-card:hover {
    transform: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'analytics-page');
  styleElement.textContent = ANALYTICS_PAGE_STYLES;
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

const DollarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChartIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const ClockIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const AnalyticsOverviewPage = ({
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');
  const [chartMetric, setChartMetric] = useState('views');
  const [stats, setStats] = useState(null);
  const [performers, setPerformers] = useState([]);

  const dateRanges = [
    { value: '7days', label: 'Last 7 days' },
    { value: '30days', label: 'Last 30 days' },
    { value: '90days', label: 'Last 90 days' },
    { value: 'year', label: 'This year' },
  ];

  const chartMetrics = [
    { value: 'views', label: 'Views' },
    { value: 'leads', label: 'Leads' },
    { value: 'conversions', label: 'Conversions' },
    { value: 'revenue', label: 'Revenue' },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewData, performersData] = await Promise.all([
        getOverviewAnalytics(dateRange),
        getTopPerformers(dateRange),
      ]);
      setStats(overviewData);
      setPerformers(performersData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'analytics-table__rank--1';
    if (rank === 2) return 'analytics-table__rank--2';
    if (rank === 3) return 'analytics-table__rank--3';
    return 'analytics-table__rank--other';
  };

  return (
    <div className={`analytics-page ${className}`} {...props}>
      <div className="analytics-page__inner">
        {/* Header */}
        <div className="analytics-header">
          <div className="analytics-header__content">
            <h1 className="analytics-header__title">Analytics Overview</h1>
            <p className="analytics-header__subtitle">
              Track performance across all your funnels
            </p>
          </div>
          <div className="analytics-header__actions">
            <div className="analytics-date-picker">
              <div className="analytics-date-picker__icon">
                <CalendarIcon />
              </div>
              <select
                className="analytics-date-picker__select"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                {dateRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="primary" size="md">
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="analytics-stats">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="analytics-skeleton analytics-skeleton--stat" />
            ))}
          </div>
        ) : stats ? (
          <div className="analytics-stats">
            {/* Total Views */}
            <div className="analytics-stat-card">
              <div className="analytics-stat-card__header">
                <div className="analytics-stat-card__icon">
                  <EyeIcon />
                </div>
                <div className={`analytics-stat-card__trend ${stats.views.trend >= 0 ? 'analytics-stat-card__trend--up' : 'analytics-stat-card__trend--down'}`}>
                  {stats.views.trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  {Math.abs(stats.views.trend)}%
                </div>
              </div>
              <div className="analytics-stat-card__body">
                <p className="analytics-stat-card__label">Total Views</p>
                <p className="analytics-stat-card__value">{formatNumber(stats.views.total)}</p>
              </div>
              <div className="analytics-stat-card__footer">
                <div className="analytics-stat-card__footer-icon">
                  <ClockIcon />
                </div>
                <span>{formatNumber(stats.views.previous)} previous period</span>
              </div>
            </div>

            {/* Total Leads */}
            <div className="analytics-stat-card">
              <div className="analytics-stat-card__header">
                <div className="analytics-stat-card__icon">
                  <UsersIcon />
                </div>
                <div className={`analytics-stat-card__trend ${stats.leads.trend >= 0 ? 'analytics-stat-card__trend--up' : 'analytics-stat-card__trend--down'}`}>
                  {stats.leads.trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  {Math.abs(stats.leads.trend)}%
                </div>
              </div>
              <div className="analytics-stat-card__body">
                <p className="analytics-stat-card__label">Total Leads</p>
                <p className="analytics-stat-card__value">{formatNumber(stats.leads.total)}</p>
              </div>
              <div className="analytics-stat-card__footer">
                <div className="analytics-stat-card__footer-icon">
                  <ClockIcon />
                </div>
                <span>{formatNumber(stats.leads.previous)} previous period</span>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="analytics-stat-card">
              <div className="analytics-stat-card__header">
                <div className="analytics-stat-card__icon">
                  <ChartIcon />
                </div>
                <div className={`analytics-stat-card__trend ${stats.conversion.trend >= 0 ? 'analytics-stat-card__trend--up' : 'analytics-stat-card__trend--down'}`}>
                  {stats.conversion.trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  {Math.abs(stats.conversion.trend)}%
                </div>
              </div>
              <div className="analytics-stat-card__body">
                <p className="analytics-stat-card__label">Conversion Rate</p>
                <p className="analytics-stat-card__value">{stats.conversion.rate}%</p>
              </div>
              <div className="analytics-stat-card__footer">
                <div className="analytics-stat-card__footer-icon">
                  <ClockIcon />
                </div>
                <span>{stats.conversion.previous}% previous period</span>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="analytics-stat-card">
              <div className="analytics-stat-card__header">
                <div className="analytics-stat-card__icon">
                  <DollarIcon />
                </div>
                <div className={`analytics-stat-card__trend ${stats.revenue.trend >= 0 ? 'analytics-stat-card__trend--up' : 'analytics-stat-card__trend--down'}`}>
                  {stats.revenue.trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  {Math.abs(stats.revenue.trend)}%
                </div>
              </div>
              <div className="analytics-stat-card__body">
                <p className="analytics-stat-card__label">Total Revenue</p>
                <p className="analytics-stat-card__value">{formatCurrency(stats.revenue.total)}</p>
              </div>
              <div className="analytics-stat-card__footer">
                <div className="analytics-stat-card__footer-icon">
                  <ClockIcon />
                </div>
                <span>{formatCurrency(stats.revenue.previous)} previous period</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Chart Section */}
        <div className="analytics-chart-section">
          <div className="analytics-chart-header">
            <h2 className="analytics-chart-header__title">Performance Trends</h2>
            <div className="analytics-chart-header__filters">
              {chartMetrics.map((metric) => (
                <button
                  key={metric.value}
                  className={`analytics-chart-filter ${chartMetric === metric.value ? 'analytics-chart-filter--active' : ''}`}
                  onClick={() => setChartMetric(metric.value)}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>
          <div className="analytics-chart-body">
            {loading ? (
              <div className="analytics-loading">
                <div className="analytics-loading__spinner" />
                <p className="analytics-loading__text">Loading chart data...</p>
              </div>
            ) : (
              <div className="analytics-chart-placeholder">
                <div className="analytics-chart-placeholder__icon">
                  <ChartIcon />
                </div>
                <p className="analytics-chart-placeholder__text">
                  Chart visualization will be rendered here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="analytics-performers">
          <div className="analytics-performers__header">
            <h2 className="analytics-performers__title">Top Performing Funnels</h2>
            <a href="/funnels" className="analytics-performers__link">
              View All
              <ArrowRightIcon />
            </a>
          </div>

          {loading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="analytics-skeleton analytics-skeleton--table" />
              ))}
            </>
          ) : performers.length > 0 ? (
            <table className="analytics-table">
              <thead className="analytics-table__header">
                <tr>
                  <th>Rank</th>
                  <th>Funnel</th>
                  <th>Views</th>
                  <th>Leads</th>
                  <th>Conversion</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody className="analytics-table__body">
                {performers.map((funnel, index) => (
                  <tr key={funnel.id}>
                    <td>
                      <div className={`analytics-table__rank ${getRankClass(index + 1)}`}>
                        {index + 1}
                      </div>
                    </td>
                    <td>
                      <div className="analytics-table__funnel">
                        <span className="analytics-table__funnel-name">{funnel.name}</span>
                        <span className="analytics-table__funnel-status">
                          <span className={`analytics-table__funnel-status-dot analytics-table__funnel-status-dot--${funnel.status}`} />
                          {funnel.status === 'active' ? 'Active' : 'Paused'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="analytics-table__metric">{formatNumber(funnel.views)}</span>
                    </td>
                    <td>
                      <span className="analytics-table__metric">{formatNumber(funnel.leads)}</span>
                    </td>
                    <td>
                      <div className="analytics-table__conversion">
                        <div className="analytics-table__conversion-bar">
                          <div
                            className="analytics-table__conversion-fill"
                            style={{ width: `${funnel.conversion}%` }}
                          />
                        </div>
                        <span className="analytics-table__conversion-value">{funnel.conversion}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="analytics-table__metric">{formatCurrency(funnel.revenue)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="analytics-empty">
              <div className="analytics-empty__icon">
                <ChartIcon />
              </div>
              <h3 className="analytics-empty__title">No Data Available</h3>
              <p className="analytics-empty__message">
                Create your first funnel to start tracking performance
              </p>
              <Button variant="primary">Create Funnel</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AnalyticsOverviewPage.propTypes = {
  className: PropTypes.string,
};

export default AnalyticsOverviewPage;
export { AnalyticsOverviewPage };