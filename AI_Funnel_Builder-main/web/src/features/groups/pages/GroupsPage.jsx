// =============================================================================
// AI FUNNEL PLATFORM - GroupsPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Input, Button } from '../../../components/ui';
import { getGroups, createGroup, updateGroup, deleteGroup } from '../../../api/groups.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const GROUPS_PAGE_STYLES = `
/* Groups Container */
.groups-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.groups-page__inner {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.groups-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.groups-header__content {
  flex: 1;
  min-width: 200px;
}

.groups-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.groups-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.groups-header__actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

/* Toolbar */
.groups-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.groups-toolbar__search {
  flex: 1;
  min-width: 280px;
  max-width: 400px;
  position: relative;
}

.groups-toolbar__search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.groups-toolbar__search-icon svg {
  width: 18px;
  height: 18px;
}

.groups-toolbar__search input {
  width: 100%;
  padding-left: 2.75rem;
}

.groups-toolbar__filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.groups-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.groups-filter-chip:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.groups-filter-chip--active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #667eea;
  color: #667eea;
}

.groups-filter-chip__icon {
  display: flex;
  align-items: center;
}

.groups-filter-chip__icon svg {
  width: 16px;
  height: 16px;
}

.groups-filter-chip__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.375rem;
  background: #667eea;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 10px;
}

/* Grid */
.groups-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.groups-card {
  background: #ffffff;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.groups-card::before {
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

.groups-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.groups-card:hover::before {
  transform: scaleX(1);
}

.groups-card__header {
  padding: 1.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.groups-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.groups-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  flex-shrink: 0;
  position: relative;
}

.groups-card__icon--ab {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.groups-card__icon--campaign {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
}

.groups-card__icon--client {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
}

.groups-card__icon svg {
  width: 28px;
  height: 28px;
}

.groups-card__menu {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #f9fafb;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.groups-card__menu:hover {
  background: #f3f4f6;
  color: #374151;
}

.groups-card__menu svg {
  width: 18px;
  height: 18px;
}

.groups-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.groups-card__type {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  align-self: flex-start;
}

.groups-card__type--ab {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
}

.groups-card__type--campaign {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.groups-card__type--client {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.groups-card__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.3;
}

.groups-card__description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.groups-card__body {
  padding: 1.25rem 1.75rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.groups-card__stats {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.groups-card__stat {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.groups-card__stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #ffffff;
  color: #667eea;
}

.groups-card__stat-icon svg {
  width: 18px;
  height: 18px;
}

.groups-card__stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.groups-card__stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.groups-card__stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.groups-card__footer {
  padding: 1rem 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.groups-card__updated {
  font-size: 0.813rem;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.groups-card__updated svg {
  width: 14px;
  height: 14px;
}

.groups-card__action {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 0.813rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.groups-card__action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.groups-card__action svg {
  width: 14px;
  height: 14px;
}

/* Modal */
.groups-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  animation: groups-modal-enter 0.3s ease-out;
}

@keyframes groups-modal-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}

.groups-modal__content {
  background: #ffffff;
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 580px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: groups-modal-content-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-height: 90vh;
  overflow-y: auto;
}

@keyframes groups-modal-content-enter {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.groups-modal__header {
  margin-bottom: 2rem;
}

.groups-modal__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.groups-modal__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.groups-modal__form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.groups-modal__form-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.groups-modal__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
}

.groups-modal__type-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.groups-modal__type-option {
  position: relative;
}

.groups-modal__type-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.groups-modal__type-label {
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

.groups-modal__type-label:hover {
  border-color: #d1d5db;
  background: #f9fafb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.groups-modal__type-input:checked + .groups-modal__type-label {
  border-color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
}

.groups-modal__type-icon {
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

.groups-modal__type-input:checked + .groups-modal__type-label .groups-modal__type-icon--ab {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  transform: scale(1.1);
}

.groups-modal__type-input:checked + .groups-modal__type-label .groups-modal__type-icon--campaign {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  transform: scale(1.1);
}

.groups-modal__type-input:checked + .groups-modal__type-label .groups-modal__type-icon--client {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  transform: scale(1.1);
}

.groups-modal__type-icon svg {
  width: 28px;
  height: 28px;
}

.groups-modal__type-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;
}

.groups-modal__type-description {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

.groups-modal__textarea {
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

.groups-modal__textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.groups-modal__textarea:disabled {
  background: #f9fafb;
  cursor: not-allowed;
  opacity: 0.6;
}

.groups-modal__actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  justify-content: flex-end;
  padding-top: 1.5rem;
  border-top: 2px solid #f3f4f6;
  margin-top: 0.5rem;
}

/* Empty State */
.groups-empty {
  text-align: center;
  padding: 4rem 2rem;
  background: #ffffff;
  border-radius: 16px;
  border: 2px dashed #e5e7eb;
}

.groups-empty__icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  color: #d1d5db;
}

.groups-empty__icon svg {
  width: 100%;
  height: 100%;
}

.groups-empty__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.groups-empty__message {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

/* Loading */
.groups-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.groups-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: groups-spin 0.8s linear infinite;
}

@keyframes groups-spin {
  to { transform: rotate(360deg); }
}

.groups-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Responsive */
@media (max-width: 1200px) {
  .groups-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .groups-page {
    padding: 1.5rem 1rem;
  }
  
  .groups-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .groups-header__title {
    font-size: 1.75rem;
  }
  
  .groups-header__actions {
    width: 100%;
  }
  
  .groups-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .groups-toolbar__search {
    max-width: 100%;
  }
  
  .groups-toolbar__filters {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
  
  .groups-grid {
    grid-template-columns: 1fr;
  }
  
  .groups-card__stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .groups-modal__content {
    padding: 2rem 1.5rem;
  }
  
  .groups-modal__type-selector {
    grid-template-columns: 1fr;
  }
  
  .groups-modal__actions {
    flex-direction: column-reverse;
  }
  
  .groups-modal__actions button {
    width: 100%;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .groups-card,
  .groups-modal,
  .groups-modal__content,
  .groups-loading__spinner {
    animation: none !important;
  }
  
  .groups-card:hover {
    transform: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'groups-page');
  styleElement.textContent = GROUPS_PAGE_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const LayersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const SearchIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const ClockIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const DotsIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

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

// =============================================================================
// COMPONENT
// =============================================================================

const GroupsPage = ({
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', type: 'ab' });
  const [formLoading, setFormLoading] = useState(false);

  const groupTypes = [
    { value: 'ab', label: 'A/B Test', description: 'Compare variants', icon: <BeakerIcon /> },
    { value: 'campaign', label: 'Campaign', description: 'Marketing campaign', icon: <SpeakerphoneIcon /> },
    { value: 'client', label: 'Client', description: 'Client projects', icon: <UserGroupIcon /> },
  ];

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const filteredGroups = useMemo(() => {
    let filtered = groups;

    if (activeFilter !== 'all') {
      filtered = filtered.filter((group) => group.type === activeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter((group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [groups, searchQuery, activeFilter]);

  const groupCounts = useMemo(() => {
    return {
      all: groups.length,
      ab: groups.filter((g) => g.type === 'ab').length,
      campaign: groups.filter((g) => g.type === 'campaign').length,
      client: groups.filter((g) => g.type === 'client').length,
    };
  }, [groups]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setFormLoading(true);
    try {
      await createGroup(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', type: 'ab' });
      fetchGroups();
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getTypeLabel = (type) => {
    return groupTypes.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className={`groups-page ${className}`} {...props}>
      <div className="groups-page__inner">
        {/* Header */}
        <div className="groups-header">
          <div className="groups-header__content">
            <h1 className="groups-header__title">Groups</h1>
            <p className="groups-header__subtitle">Organize funnels into logical groups</p>
          </div>
          <div className="groups-header__actions">
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<PlusIcon />}
            >
              New Group
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="groups-toolbar">
          <div className="groups-toolbar__search">
            <div className="groups-toolbar__search-icon">
              <SearchIcon />
            </div>
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="groups-toolbar__filters">
            <button
              className={`groups-filter-chip ${activeFilter === 'all' ? 'groups-filter-chip--active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <span className="groups-filter-chip__icon">
                <LayersIcon />
              </span>
              All Groups
              <span className="groups-filter-chip__count">{groupCounts.all}</span>
            </button>

            <button
              className={`groups-filter-chip ${activeFilter === 'ab' ? 'groups-filter-chip--active' : ''}`}
              onClick={() => setActiveFilter('ab')}
            >
              <span className="groups-filter-chip__icon">
                <BeakerIcon />
              </span>
              A/B Tests
              <span className="groups-filter-chip__count">{groupCounts.ab}</span>
            </button>

            <button
              className={`groups-filter-chip ${activeFilter === 'campaign' ? 'groups-filter-chip--active' : ''}`}
              onClick={() => setActiveFilter('campaign')}
            >
              <span className="groups-filter-chip__icon">
                <SpeakerphoneIcon />
              </span>
              Campaigns
              <span className="groups-filter-chip__count">{groupCounts.campaign}</span>
            </button>

            <button
              className={`groups-filter-chip ${activeFilter === 'client' ? 'groups-filter-chip--active' : ''}`}
              onClick={() => setActiveFilter('client')}
            >
              <span className="groups-filter-chip__icon">
                <UserGroupIcon />
              </span>
              Clients
              <span className="groups-filter-chip__count">{groupCounts.client}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="groups-loading">
            <div className="groups-loading__spinner" />
            <p className="groups-loading__text">Loading groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="groups-empty">
            <div className="groups-empty__icon">
              <LayersIcon />
            </div>
            <h3 className="groups-empty__title">
              {searchQuery ? 'No groups found' : 'No groups yet'}
            </h3>
            <p className="groups-empty__message">
              {searchQuery ? 'Try adjusting your search' : 'Create your first group to organize your funnels'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Create Group
              </Button>
            )}
          </div>
        ) : (
          <div className="groups-grid">
            {filteredGroups.map((group) => (
              <div key={group.id} className="groups-card">
                <div className="groups-card__header">
                  <div className="groups-card__top">
                    <div className={`groups-card__icon groups-card__icon--${group.type}`}>
                      {groupTypes.find((t) => t.value === group.type)?.icon}
                    </div>
                    <button className="groups-card__menu">
                      <DotsIcon />
                    </button>
                  </div>

                  <div className="groups-card__content">
                    <div className={`groups-card__type groups-card__type--${group.type}`}>
                      {getTypeLabel(group.type)}
                    </div>
                    <h3 className="groups-card__title">{group.name}</h3>
                    {group.description && (
                      <p className="groups-card__description">{group.description}</p>
                    )}
                  </div>
                </div>

                <div className="groups-card__body">
                  <div className="groups-card__stats">
                    <div className="groups-card__stat">
                      <div className="groups-card__stat-icon">
                        <ChartIcon />
                      </div>
                      <div className="groups-card__stat-content">
                        <div className="groups-card__stat-value">{group.funnelsCount || 0}</div>
                        <div className="groups-card__stat-label">Funnels</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="groups-card__footer">
                  <div className="groups-card__updated">
                    <ClockIcon />
                    {formatDate(group.updatedAt)}
                  </div>
                  <button className="groups-card__action">
                    View
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="groups-modal" onClick={() => setShowCreateModal(false)}>
          <div className="groups-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="groups-modal__header">
              <h2 className="groups-modal__title">Create New Group</h2>
              <p className="groups-modal__subtitle">Organize related funnels together</p>
            </div>

            <form className="groups-modal__form" onSubmit={handleCreateGroup}>
              <div className="groups-modal__form-group">
                <label className="groups-modal__label">Group Type</label>
                <div className="groups-modal__type-selector">
                  {groupTypes.map((type) => (
                    <div key={type.value} className="groups-modal__type-option">
                      <input
                        type="radio"
                        id={`type-${type.value}`}
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                        className="groups-modal__type-input"
                        disabled={formLoading}
                      />
                      <label htmlFor={`type-${type.value}`} className="groups-modal__type-label">
                        <div className={`groups-modal__type-icon groups-modal__type-icon--${type.value}`}>
                          {type.icon}
                        </div>
                        <div className="groups-modal__type-name">{type.label}</div>
                        <div className="groups-modal__type-description">{type.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="groups-modal__form-group">
                <label htmlFor="groupName" className="groups-modal__label">
                  Group Name
                </label>
                <Input
                  id="groupName"
                  placeholder="e.g., Summer Campaign 2025"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={formLoading}
                  autoFocus
                  required
                />
              </div>

              <div className="groups-modal__form-group">
                <label htmlFor="groupDescription" className="groups-modal__label">
                  Description (optional)
                </label>
                <textarea
                  id="groupDescription"
                  className="groups-modal__textarea"
                  placeholder="Brief description of this group..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={formLoading}
                />
              </div>

              <div className="groups-modal__actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={formLoading}>
                  Create Group
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

GroupsPage.propTypes = {
  className: PropTypes.string,
};

export default GroupsPage;
export { GroupsPage };