// =============================================================================
// AI FUNNEL PLATFORM - FunnelAnalyticsPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { Button, Select } from '../../../components/ui';
import { getFunnelAnalytics, getConversionFunnel, getTimeSeries, getAllQuestionsAnalytics, exportAnalytics } from '../../../api/analytics.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const FUNNEL_ANALYTICS_STYLES = `
/* Analytics Page Container */
.funnel-analytics-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.funnel-analytics-page__inner {
  max-width: 1600px;
  margin: 0 auto;
}

/* Header */
.funnel-analytics-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.funnel-analytics-header__content {
  flex: 1;
  min-width: 200px;
}

.funnel-analytics-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.funnel-analytics-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.funnel-analytics-header__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.funnel-analytics-date-range {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
}

.funnel-analytics-date-range__icon {
  display: flex;
  align-items: center;
  color: #6b7280;
}

.funnel-analytics-date-range__icon svg {
  width: 18px;
  height: 18px;
}

.funnel-analytics-date-range select {
  border: none;
  background: none;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
}

/* Stats Grid */
.funnel-analytics-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.funnel-analytics-stat-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.funnel-analytics-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.funnel-analytics-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.funnel-analytics-stat-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.funnel-analytics-stat-card__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.funnel-analytics-stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 12px;
  color: #667eea;
}

.funnel-analytics-stat-card__icon svg {
  width: 20px;
  height: 20px;
}

.funnel-analytics-stat-card__value {
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
  margin-bottom: 0.75rem;
}

.funnel-analytics-stat-card__change {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.funnel-analytics-stat-card__change--up {
  color: #059669;
}

.funnel-analytics-stat-card__change--down {
  color: #dc2626;
}

.funnel-analytics-stat-card__change svg {
  width: 16px;
  height: 16px;
}

/* Chart Card */
.funnel-analytics-chart-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 2px solid #e5e7eb;
  margin-bottom: 2rem;
  overflow: hidden;
}

.funnel-analytics-chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.75rem 2rem;
  border-bottom: 2px solid #f3f4f6;
}

.funnel-analytics-chart-card__title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.funnel-analytics-chart-card__title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 10px;
  color: #667eea;
}

.funnel-analytics-chart-card__title-icon svg {
  width: 20px;
  height: 20px;
}

.funnel-analytics-chart-card__body {
  padding: 2rem;
}

/* Conversion Funnel */
.funnel-analytics-conversion {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.funnel-analytics-conversion-step {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.2s ease;
  position: relative;
}

.funnel-analytics-conversion-step:hover {
  border-color: #667eea;
  transform: translateX(4px);
}

.funnel-analytics-conversion-step__number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 12px;
  font-size: 1.25rem;
  font-weight: 800;
  flex-shrink: 0;
}

.funnel-analytics-conversion-step__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.funnel-analytics-conversion-step__label {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.funnel-analytics-conversion-step__bar-container {
  height: 32px;
  background: #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.funnel-analytics-conversion-step__bar {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.6s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 1rem;
}

.funnel-analytics-conversion-step__bar-text {
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 700;
}

.funnel-analytics-conversion-step__stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.funnel-analytics-conversion-step__stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.funnel-analytics-conversion-step__stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.funnel-analytics-conversion-step__stat-value {
  font-size: 1.125rem;
  font-weight: 800;
  color: #111827;
}

.funnel-analytics-conversion-step__dropoff {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(0.5rem);
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  z-index: 1;
}

.funnel-analytics-conversion-step__dropoff svg {
  width: 14px;
  height: 14px;
}

/* Time Series Chart */
.funnel-analytics-timeseries {
  min-height: 400px;
  position: relative;
}

.funnel-analytics-timeseries__chart {
  width: 100%;
  height: 400px;
}

.funnel-analytics-timeseries__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #9ca3af;
}

.funnel-analytics-timeseries__placeholder-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.funnel-analytics-timeseries__placeholder-icon svg {
  width: 100%;
  height: 100%;
}

/* Questions Table */
.funnel-analytics-questions {
  overflow-x: auto;
}

.funnel-analytics-questions-table {
  width: 100%;
  border-collapse: collapse;
}

.funnel-analytics-questions-table thead {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.funnel-analytics-questions-table th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.813rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.funnel-analytics-questions-table td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.938rem;
  color: #374151;
}

.funnel-analytics-questions-table tr:last-child td {
  border-bottom: none;
}

.funnel-analytics-questions-table tr:hover {
  background: linear-gradient(135deg, #fafbfc 0%, #f9fafb 100%);
}

.funnel-analytics-questions-table__question {
  font-weight: 600;
  color: #111827;
  max-width: 400px;
}

.funnel-analytics-questions-table__metric {
  font-weight: 700;
  color: #111827;
}

.funnel-analytics-questions-table__bar {
  width: 100px;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.funnel-analytics-questions-table__bar-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.4s ease;
}

/* Loading */
.funnel-analytics-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.funnel-analytics-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: funnel-analytics-spin 0.8s linear infinite;
}

@keyframes funnel-analytics-spin {
  to { transform: rotate(360deg); }
}

.funnel-analytics-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Responsive */
@media (max-width: 1200px) {
  .funnel-analytics-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .funnel-analytics-page {
    padding: 1.5rem 1rem;
  }
  
  .funnel-analytics-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .funnel-analytics-stats {
    grid-template-columns: 1fr;
  }
  
  .funnel-analytics-chart-card__body {
    padding: 1.5rem;
  }
  
  .funnel-analytics-conversion-step {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .funnel-analytics-conversion-step__stats {
    width: 100%;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .funnel-analytics-loading__spinner,
  .funnel-analytics-conversion-step__bar {
    animation: none !important;
    transition: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'funnel-analytics');
  styleElement.textContent = FUNNEL_ANALYTICS_STYLES;
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

const EyeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const UserIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const FilterIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const QuestionIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const FunnelAnalyticsPage = ({ className = '', ...props }) => {
  const { id } = useParams();

  useEffect(() => {
    injectStyles();
  }, []);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [analytics, setAnalytics] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [questionsData, setQuestionsData] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, conversionRes, timeSeriesRes, questionsRes] = await Promise.all([
        getFunnelAnalytics(id, { dateRange }),
        getConversionFunnel(id, { dateRange }),
        getTimeSeries({ funnelId: id, dateRange, groupBy: 'day' }),
        getAllQuestionsAnalytics(id, { dateRange }),
      ]);

      setAnalytics(analyticsRes);
      setConversionData(conversionRes);
      setTimeSeriesData(timeSeriesRes);
      setQuestionsData(questionsRes);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [id, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAnalytics({ funnelId: id, dateRange, format: 'csv' });
      alert('Export started! You will receive an email when ready.');
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="funnel-analytics-page">
        <div className="funnel-analytics-loading">
          <div className="funnel-analytics-loading__spinner" />
          <p className="funnel-analytics-loading__text">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`funnel-analytics-page ${className}`} {...props}>
      <div className="funnel-analytics-page__inner">
        {/* Header */}
        <div className="funnel-analytics-header">
          <div className="funnel-analytics-header__content">
            <h1 className="funnel-analytics-header__title">Funnel Analytics</h1>
            <p className="funnel-analytics-header__subtitle">
              Track performance and optimize your funnel
            </p>
          </div>
          <div className="funnel-analytics-header__actions">
            <div className="funnel-analytics-date-range">
              <div className="funnel-analytics-date-range__icon">
                <CalendarIcon />
              </div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={handleExport}
              disabled={exporting}
            >
              <DownloadIcon />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="funnel-analytics-stats">
          <div className="funnel-analytics-stat-card">
            <div className="funnel-analytics-stat-card__header">
              <span className="funnel-analytics-stat-card__label">Total Views</span>
              <div className="funnel-analytics-stat-card__icon">
                <EyeIcon />
              </div>
            </div>
            <div className="funnel-analytics-stat-card__value">
              {formatNumber(analytics?.totalViews || 0)}
            </div>
            <div className={`funnel-analytics-stat-card__change ${analytics?.viewsChange >= 0 ? 'funnel-analytics-stat-card__change--up' : 'funnel-analytics-stat-card__change--down'}`}>
              {analytics?.viewsChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              {Math.abs(analytics?.viewsChange || 0)}% vs previous period
            </div>
          </div>

          <div className="funnel-analytics-stat-card">
            <div className="funnel-analytics-stat-card__header">
              <span className="funnel-analytics-stat-card__label">Total Leads</span>
              <div className="funnel-analytics-stat-card__icon">
                <UserIcon />
              </div>
            </div>
            <div className="funnel-analytics-stat-card__value">
              {formatNumber(analytics?.totalLeads || 0)}
            </div>
            <div className={`funnel-analytics-stat-card__change ${analytics?.leadsChange >= 0 ? 'funnel-analytics-stat-card__change--up' : 'funnel-analytics-stat-card__change--down'}`}>
              {analytics?.leadsChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              {Math.abs(analytics?.leadsChange || 0)}% vs previous period
            </div>
          </div>

          <div className="funnel-analytics-stat-card">
            <div className="funnel-analytics-stat-card__header">
              <span className="funnel-analytics-stat-card__label">Completion Rate</span>
              <div className="funnel-analytics-stat-card__icon">
                <CheckCircleIcon />
              </div>
            </div>
            <div className="funnel-analytics-stat-card__value">
              {analytics?.completionRate || 0}%
            </div>
            <div className={`funnel-analytics-stat-card__change ${analytics?.completionChange >= 0 ? 'funnel-analytics-stat-card__change--up' : 'funnel-analytics-stat-card__change--down'}`}>
              {analytics?.completionChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              {Math.abs(analytics?.completionChange || 0)}% vs previous period
            </div>
          </div>

          <div className="funnel-analytics-stat-card">
            <div className="funnel-analytics-stat-card__header">
              <span className="funnel-analytics-stat-card__label">Avg. Time</span>
              <div className="funnel-analytics-stat-card__icon">
                <ClockIcon />
              </div>
            </div>
            <div className="funnel-analytics-stat-card__value">
              {analytics?.avgTime || 0}s
            </div>
            <div className={`funnel-analytics-stat-card__change ${analytics?.timeChange >= 0 ? 'funnel-analytics-stat-card__change--down' : 'funnel-analytics-stat-card__change--up'}`}>
              {analytics?.timeChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              {Math.abs(analytics?.timeChange || 0)}% vs previous period
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="funnel-analytics-chart-card">
          <div className="funnel-analytics-chart-card__header">
            <h2 className="funnel-analytics-chart-card__title">
              <div className="funnel-analytics-chart-card__title-icon">
                <FilterIcon />
              </div>
              Conversion Funnel
            </h2>
          </div>
          <div className="funnel-analytics-chart-card__body">
            <div className="funnel-analytics-conversion">
              {conversionData?.steps?.map((step, index) => {
                const percentage = conversionData.steps[0].count > 0 
                  ? (step.count / conversionData.steps[0].count) * 100 
                  : 0;
                const dropoffPercent = index > 0 
                  ? ((conversionData.steps[index - 1].count - step.count) / conversionData.steps[index - 1].count) * 100 
                  : 0;

                return (
                  <React.Fragment key={step.step}>
                    <div className="funnel-analytics-conversion-step">
                      <div className="funnel-analytics-conversion-step__number">
                        {index + 1}
                      </div>
                      <div className="funnel-analytics-conversion-step__content">
                        <div className="funnel-analytics-conversion-step__label">
                          {step.name}
                        </div>
                        <div className="funnel-analytics-conversion-step__bar-container">
                          <div 
                            className="funnel-analytics-conversion-step__bar"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="funnel-analytics-conversion-step__bar-text">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="funnel-analytics-conversion-step__stats">
                        <div className="funnel-analytics-conversion-step__stat">
                          <div className="funnel-analytics-conversion-step__stat-label">Users</div>
                          <div className="funnel-analytics-conversion-step__stat-value">
                            {formatNumber(step.count)}
                          </div>
                        </div>
                        <div className="funnel-analytics-conversion-step__stat">
                          <div className="funnel-analytics-conversion-step__stat-label">Conversion</div>
                          <div className="funnel-analytics-conversion-step__stat-value">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      {index > 0 && dropoffPercent > 0 && (
                        <div className="funnel-analytics-conversion-step__dropoff">
                          <ArrowDownIcon />
                          {dropoffPercent.toFixed(1)}% drop-off
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time Series Chart */}
        <div className="funnel-analytics-chart-card">
          <div className="funnel-analytics-chart-card__header">
            <h2 className="funnel-analytics-chart-card__title">
              <div className="funnel-analytics-chart-card__title-icon">
                <ChartIcon />
              </div>
              Views & Leads Over Time
            </h2>
          </div>
          <div className="funnel-analytics-chart-card__body">
            <div className="funnel-analytics-timeseries">
              {timeSeriesData?.dataPoints?.length > 0 ? (
                <div className="funnel-analytics-timeseries__chart">
                  {/* Chart placeholder - would integrate with chart library */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    height: '400px', 
                    gap: '8px',
                    padding: '20px',
                  }}>
                    {timeSeriesData.dataPoints.map((point, index) => (
                      <div 
                        key={index}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          alignItems: 'center',
                        }}
                      >
                        <div 
                          style={{
                            width: '100%',
                            height: `${(point.views / Math.max(...timeSeriesData.dataPoints.map(p => p.views))) * 100}%`,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '4px 4px 0 0',
                            minHeight: '20px',
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                          {new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="funnel-analytics-timeseries__placeholder">
                  <div className="funnel-analytics-timeseries__placeholder-icon">
                    <ChartIcon />
                  </div>
                  <p>No data available for selected period</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question-Level Analytics */}
        <div className="funnel-analytics-chart-card">
          <div className="funnel-analytics-chart-card__header">
            <h2 className="funnel-analytics-chart-card__title">
              <div className="funnel-analytics-chart-card__title-icon">
                <QuestionIcon />
              </div>
              Question-Level Performance
            </h2>
          </div>
          <div className="funnel-analytics-chart-card__body">
            <div className="funnel-analytics-questions">
              <table className="funnel-analytics-questions-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Views</th>
                    <th>Responses</th>
                    <th>Response Rate</th>
                    <th>Avg. Time (s)</th>
                    <th>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {questionsData?.questions?.map((question, index) => (
                    <tr key={question.id || index}>
                      <td className="funnel-analytics-questions-table__question">
                        {question.text}
                      </td>
                      <td className="funnel-analytics-questions-table__metric">
                        {formatNumber(question.views)}
                      </td>
                      <td className="funnel-analytics-questions-table__metric">
                        {formatNumber(question.responses)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="funnel-analytics-questions-table__metric">
                            {question.responseRate}%
                          </span>
                          <div className="funnel-analytics-questions-table__bar">
                            <div 
                              className="funnel-analytics-questions-table__bar-fill"
                              style={{ width: `${question.responseRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="funnel-analytics-questions-table__metric">
                        {question.avgTime}
                      </td>
                      <td className="funnel-analytics-questions-table__metric">
                        {question.completionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

FunnelAnalyticsPage.propTypes = {
  className: PropTypes.string,
};

export default FunnelAnalyticsPage;
export { FunnelAnalyticsPage };
