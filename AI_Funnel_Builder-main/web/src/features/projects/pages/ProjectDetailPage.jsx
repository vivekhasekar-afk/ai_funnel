// =============================================================================
// AI FUNNEL PLATFORM - ProjectDetailPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { Input, Button } from '../../../components/ui';
import { getProjectById, updateProject, getProjectAnalytics, getProjectActivity } from '../../../api/projects.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const PROJECT_DETAIL_STYLES = `
/* Project Detail Container */
.project-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.project-detail__inner {
  max-width: 1400px;
  margin: 0 auto;
}

/* Breadcrumb */
.project-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.project-breadcrumb__link {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s ease;
}

.project-breadcrumb__link:hover {
  color: #667eea;
}

.project-breadcrumb__separator {
  color: #d1d5db;
}

.project-breadcrumb__current {
  color: #111827;
  font-weight: 600;
}

/* Header */
.project-header {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.project-header__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.project-header__left {
  flex: 1;
}

.project-header__icon-wrapper {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.project-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.project-header__icon svg {
  width: 32px;
  height: 32px;
}

.project-header__status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.813rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.project-header__status--active {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.project-header__status--archived {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
}

.project-header__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.project-header__status--active .project-header__status-dot {
  background: #10b981;
}

.project-header__status--archived .project-header__status-dot {
  background: #9ca3af;
}

.project-header__title {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.75rem 0;
  line-height: 1.2;
}

.project-header__description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.project-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.project-header__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f3f4f6;
}

.project-header__stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.project-header__stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.project-header__stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Tabs */
.project-tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  overflow-x: auto;
  scrollbar-width: none;
}

.project-tabs::-webkit-scrollbar {
  display: none;
}

.project-tab {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  font-size: 0.938rem;
  font-weight: 600;
  color: #6b7280;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  margin-bottom: -2px;
}

.project-tab:hover {
  color: #667eea;
  background: #f9fafb;
}

.project-tab--active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.project-tab__icon {
  display: flex;
  align-items: center;
}

.project-tab__icon svg {
  width: 18px;
  height: 18px;
}

.project-tab__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.375rem;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 10px;
}

.project-tab--active .project-tab__badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

/* Content Grid */
.project-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  align-items: flex-start;
}

/* Main Content */
.project-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Sidebar */
.project-sidebar {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: sticky;
  top: 2rem;
}

/* Section Card */
.project-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.project-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.project-section__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.project-section__title-icon {
  display: flex;
  align-items: center;
  color: #667eea;
}

.project-section__title-icon svg {
  width: 20px;
  height: 20px;
}

.project-section__action {
  font-size: 0.875rem;
  font-weight: 600;
  color: #667eea;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: color 0.2s ease;
}

.project-section__action:hover {
  color: #764ba2;
}

.project-section__action svg {
  width: 16px;
  height: 16px;
}

/* Funnels List */
.project-funnels {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.project-funnel-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.project-funnel-card:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  transform: translateX(4px);
}

.project-funnel-card__icon {
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

.project-funnel-card__icon svg {
  width: 24px;
  height: 24px;
}

.project-funnel-card__content {
  flex: 1;
}

.project-funnel-card__name {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.375rem 0;
}

.project-funnel-card__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.813rem;
  color: #6b7280;
}

.project-funnel-card__stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.project-funnel-card__stat svg {
  width: 14px;
  height: 14px;
}

.project-funnel-card__arrow {
  color: #9ca3af;
  display: flex;
  align-items: center;
}

.project-funnel-card__arrow svg {
  width: 20px;
  height: 20px;
}

/* Groups List */
.project-groups {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.project-group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: #f9fafb;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.project-group-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.project-group-item__left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.project-group-item__color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.project-group-item__name {
  font-size: 0.938rem;
  font-weight: 600;
  color: #111827;
}

.project-group-item__count {
  font-size: 0.813rem;
  font-weight: 700;
  color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
}

/* Activity Feed */
.project-activity {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.project-activity-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 10px;
}

.project-activity-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #667eea;
  flex-shrink: 0;
}

.project-activity-item__icon svg {
  width: 18px;
  height: 18px;
}

.project-activity-item__content {
  flex: 1;
}

.project-activity-item__text {
  font-size: 0.875rem;
  color: #374151;
  margin: 0 0 0.375rem 0;
  line-height: 1.5;
}

.project-activity-item__text strong {
  font-weight: 700;
  color: #111827;
}

.project-activity-item__time {
  font-size: 0.75rem;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.project-activity-item__time svg {
  width: 12px;
  height: 12px;
}

/* Analytics Summary */
.project-analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.project-analytics-stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 10px;
}

.project-analytics-stat__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.project-analytics-stat__value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.project-analytics-stat__change {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.813rem;
  font-weight: 600;
}

.project-analytics-stat__change--positive {
  color: #059669;
}

.project-analytics-stat__change--negative {
  color: #dc2626;
}

.project-analytics-stat__change svg {
  width: 14px;
  height: 14px;
}

/* Edit Form */
.project-edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.project-edit-form__group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.project-edit-form__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
}

.project-edit-form__textarea {
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

.project-edit-form__textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.project-edit-form__actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding-top: 1rem;
  border-top: 2px solid #f3f4f6;
}

/* Empty States */
.project-empty {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

.project-empty__icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  color: #d1d5db;
}

.project-empty__icon svg {
  width: 100%;
  height: 100%;
}

.project-empty__text {
  font-size: 0.938rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

/* Loading */
.project-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.project-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: project-spin 0.8s linear infinite;
}

@keyframes project-spin {
  to { transform: rotate(360deg); }
}

.project-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Responsive */
@media (max-width: 1200px) {
  .project-content {
    grid-template-columns: 1fr 320px;
  }
  
  .project-header__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .project-detail {
    padding: 1.5rem 1rem;
  }
  
  .project-header {
    padding: 1.5rem;
  }
  
  .project-header__top {
    flex-direction: column;
  }
  
  .project-header__title {
    font-size: 1.75rem;
  }
  
  .project-header__stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
  
  .project-content {
    grid-template-columns: 1fr;
  }
  
  .project-sidebar {
    position: static;
  }
  
  .project-section {
    padding: 1.5rem;
  }
  
  .project-analytics-grid {
    grid-template-columns: 1fr;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .project-loading__spinner,
  .project-funnel-card {
    animation: none !important;
  }
  
  .project-funnel-card:hover {
    transform: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'project-detail');
  styleElement.textContent = PROJECT_DETAIL_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const FolderIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const EditIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const ChartIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LayersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const ClockIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const EyeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

const PlusIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const ActivityIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

const TagIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const InfoIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const ProjectDetailPage = ({
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectData, analyticsData, activityData] = await Promise.all([
        getProjectById(projectId),
        getProjectAnalytics(projectId),
        getProjectActivity(projectId),
      ]);
      setProject(projectData);
      setAnalytics(analyticsData);
      setActivity(activityData);
      setEditData({ name: projectData.name, description: projectData.description || '' });
    } catch (error) {
      console.error('Failed to fetch project data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProject(projectId, editData);
      setProject((prev) => ({ ...prev, ...editData }));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <InfoIcon /> },
    { id: 'funnels', label: 'Funnels', icon: <ChartIcon />, badge: project?.funnels?.length || 0 },
    { id: 'groups', label: 'Groups', icon: <TagIcon />, badge: project?.groups?.length || 0 },
    { id: 'activity', label: 'Activity', icon: <ActivityIcon /> },
  ];

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toLocaleString() || 0;
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="project-detail">
        <div className="project-detail__inner">
          <div className="project-loading">
            <div className="project-loading__spinner" />
            <p className="project-loading__text">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-detail">
        <div className="project-detail__inner">
          <div className="project-empty">
            <div className="project-empty__icon">
              <FolderIcon />
            </div>
            <p className="project-empty__text">Project not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`project-detail ${className}`} {...props}>
      <div className="project-detail__inner">
        {/* Breadcrumb */}
        <nav className="project-breadcrumb">
          <a href="/projects" className="project-breadcrumb__link">Projects</a>
          <span className="project-breadcrumb__separator">/</span>
          <span className="project-breadcrumb__current">{project.name}</span>
        </nav>

        {/* Header */}
        <div className="project-header">
          <div className="project-header__top">
            <div className="project-header__left">
              <div className="project-header__icon-wrapper">
                <div className="project-header__icon">
                  <FolderIcon />
                </div>
                <div className={`project-header__status project-header__status--${project.status}`}>
                  <span className="project-header__status-dot" />
                  {project.status}
                </div>
              </div>
              {isEditing ? (
                <form onSubmit={handleSaveEdit} className="project-edit-form">
                  <div className="project-edit-form__group">
                    <label htmlFor="projectName" className="project-edit-form__label">
                      Project Name
                    </label>
                    <Input
                      id="projectName"
                      value={editData.name}
                      onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={saving}
                      required
                    />
                  </div>
                  <div className="project-edit-form__group">
                    <label htmlFor="projectDescription" className="project-edit-form__label">
                      Description
                    </label>
                    <textarea
                      id="projectDescription"
                      className="project-edit-form__textarea"
                      value={editData.description}
                      onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
                      disabled={saving}
                      placeholder="Brief description..."
                    />
                  </div>
                  <div className="project-edit-form__actions">
                    <Button type="submit" variant="primary" loading={saving}>
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 className="project-header__title">{project.name}</h1>
                  {project.description && (
                    <p className="project-header__description">{project.description}</p>
                  )}
                </>
              )}
            </div>
            {!isEditing && (
              <div className="project-header__actions">
                <Button variant="outline" size="md" onClick={() => setIsEditing(true)} leftIcon={<EditIcon />}>
                  Edit
                </Button>
                <Button variant="primary" size="md" leftIcon={<PlusIcon />}>
                  New Funnel
                </Button>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="project-header__stats">
              <div className="project-header__stat">
                <p className="project-header__stat-value">{project.funnels?.length || 0}</p>
                <p className="project-header__stat-label">Funnels</p>
              </div>
              <div className="project-header__stat">
                <p className="project-header__stat-value">{formatNumber(analytics?.totalViews || 0)}</p>
                <p className="project-header__stat-label">Total Views</p>
              </div>
              <div className="project-header__stat">
                <p className="project-header__stat-value">{formatNumber(analytics?.totalLeads || 0)}</p>
                <p className="project-header__stat-label">Total Leads</p>
              </div>
              <div className="project-header__stat">
                <p className="project-header__stat-value">{analytics?.conversionRate || 0}%</p>
                <p className="project-header__stat-label">Conversion</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="project-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`project-tab ${activeTab === tab.id ? 'project-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="project-tab__icon">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="project-tab__badge">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="project-content">
          <div className="project-main">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="project-section">
                <div className="project-section__header">
                  <h2 className="project-section__title">
                    <span className="project-section__title-icon">
                      <ChartIcon />
                    </span>
                    Analytics Summary
                  </h2>
                </div>
                <div className="project-analytics-grid">
                  <div className="project-analytics-stat">
                    <span className="project-analytics-stat__label">Views</span>
                    <span className="project-analytics-stat__value">{formatNumber(analytics?.views || 0)}</span>
                    <div className={`project-analytics-stat__change project-analytics-stat__change--${analytics?.viewsChange >= 0 ? 'positive' : 'negative'}`}>
                      {analytics?.viewsChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      {Math.abs(analytics?.viewsChange || 0)}% vs last period
                    </div>
                  </div>
                  <div className="project-analytics-stat">
                    <span className="project-analytics-stat__label">Leads</span>
                    <span className="project-analytics-stat__value">{formatNumber(analytics?.leads || 0)}</span>
                    <div className={`project-analytics-stat__change project-analytics-stat__change--${analytics?.leadsChange >= 0 ? 'positive' : 'negative'}`}>
                      {analytics?.leadsChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      {Math.abs(analytics?.leadsChange || 0)}% vs last period
                    </div>
                  </div>
                  <div className="project-analytics-stat">
                    <span className="project-analytics-stat__label">Conversion</span>
                    <span className="project-analytics-stat__value">{analytics?.conversionRate || 0}%</span>
                    <div className={`project-analytics-stat__change project-analytics-stat__change--${analytics?.conversionChange >= 0 ? 'positive' : 'negative'}`}>
                      {analytics?.conversionChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      {Math.abs(analytics?.conversionChange || 0)}% vs last period
                    </div>
                  </div>
                  <div className="project-analytics-stat">
                    <span className="project-analytics-stat__label">Avg. Time</span>
                    <span className="project-analytics-stat__value">{analytics?.avgTime || '0'}s</span>
                    <div className={`project-analytics-stat__change project-analytics-stat__change--${analytics?.timeChange >= 0 ? 'positive' : 'negative'}`}>
                      {analytics?.timeChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      {Math.abs(analytics?.timeChange || 0)}% vs last period
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Funnels Tab */}
            {activeTab === 'funnels' && (
              <div className="project-section">
                <div className="project-section__header">
                  <h2 className="project-section__title">
                    <span className="project-section__title-icon">
                      <ChartIcon />
                    </span>
                    Funnels
                  </h2>
                  <a href={`/projects/${projectId}/funnels/new`} className="project-section__action">
                    <PlusIcon />
                    Add Funnel
                  </a>
                </div>
                {project.funnels && project.funnels.length > 0 ? (
                  <div className="project-funnels">
                    {project.funnels.map((funnel) => (
                      <a key={funnel.id} href={`/funnels/${funnel.id}`} className="project-funnel-card">
                        <div className="project-funnel-card__icon">
                          <ChartIcon />
                        </div>
                        <div className="project-funnel-card__content">
                          <h3 className="project-funnel-card__name">{funnel.name}</h3>
                          <div className="project-funnel-card__meta">
                            <span className="project-funnel-card__stat">
                              <EyeIcon />
                              {formatNumber(funnel.views || 0)} views
                            </span>
                            <span className="project-funnel-card__stat">
                              <UsersIcon />
                              {formatNumber(funnel.leads || 0)} leads
                            </span>
                          </div>
                        </div>
                        <div className="project-funnel-card__arrow">
                          <ArrowRightIcon />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="project-empty">
                    <div className="project-empty__icon">
                      <ChartIcon />
                    </div>
                    <p className="project-empty__text">No funnels yet</p>
                    <Button variant="primary" size="sm">
                      Create Funnel
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Groups Tab */}
            {activeTab === 'groups' && (
              <div className="project-section">
                <div className="project-section__header">
                  <h2 className="project-section__title">
                    <span className="project-section__title-icon">
                      <TagIcon />
                    </span>
                    Groups
                  </h2>
                  <button className="project-section__action">
                    <PlusIcon />
                    Add Group
                  </button>
                </div>
                {project.groups && project.groups.length > 0 ? (
                  <div className="project-groups">
                    {project.groups.map((group) => (
                      <div key={group.id} className="project-group-item">
                        <div className="project-group-item__left">
                          <span className="project-group-item__color" style={{ background: group.color }} />
                          <span className="project-group-item__name">{group.name}</span>
                        </div>
                        <span className="project-group-item__count">{group.count || 0}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="project-empty">
                    <div className="project-empty__icon">
                      <TagIcon />
                    </div>
                    <p className="project-empty__text">No groups yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="project-section">
                <div className="project-section__header">
                  <h2 className="project-section__title">
                    <span className="project-section__title-icon">
                      <ActivityIcon />
                    </span>
                    Recent Activity
                  </h2>
                </div>
                {activity && activity.length > 0 ? (
                  <div className="project-activity">
                    {activity.map((item) => (
                      <div key={item.id} className="project-activity-item">
                        <div className="project-activity-item__icon">
                          {item.type === 'funnel' && <ChartIcon />}
                          {item.type === 'lead' && <UsersIcon />}
                          {item.type === 'edit' && <EditIcon />}
                        </div>
                        <div className="project-activity-item__content">
                          <p className="project-activity-item__text" dangerouslySetInnerHTML={{ __html: item.text }} />
                          <div className="project-activity-item__time">
                            <ClockIcon />
                            {getTimeAgo(item.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="project-empty">
                    <div className="project-empty__icon">
                      <ActivityIcon />
                    </div>
                    <p className="project-empty__text">No recent activity</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="project-sidebar">
            {/* Quick Stats */}
            <div className="project-section">
              <div className="project-section__header">
                <h3 className="project-section__title">Quick Stats</h3>
              </div>
              <div className="project-analytics-grid">
                <div className="project-analytics-stat">
                  <span className="project-analytics-stat__label">Active</span>
                  <span className="project-analytics-stat__value">{project.activeFunnels || 0}</span>
                </div>
                <div className="project-analytics-stat">
                  <span className="project-analytics-stat__label">Draft</span>
                  <span className="project-analytics-stat__value">{project.draftFunnels || 0}</span>
                </div>
              </div>
            </div>

            {/* Project Info */}
            <div className="project-section">
              <div className="project-section__header">
                <h3 className="project-section__title">Project Info</h3>
              </div>
              <div className="project-activity">
                <div className="project-activity-item">
                  <div className="project-activity-item__icon">
                    <ClockIcon />
                  </div>
                  <div className="project-activity-item__content">
                    <p className="project-activity-item__text">
                      <strong>Created:</strong> {formatDate(project.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="project-activity-item">
                  <div className="project-activity-item__icon">
                    <EditIcon />
                  </div>
                  <div className="project-activity-item__content">
                    <p className="project-activity-item__text">
                      <strong>Updated:</strong> {formatDate(project.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

ProjectDetailPage.propTypes = {
  className: PropTypes.string,
};

export default ProjectDetailPage;
export { ProjectDetailPage };
