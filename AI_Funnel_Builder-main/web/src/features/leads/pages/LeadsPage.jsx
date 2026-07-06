// =============================================================================
// AI FUNNEL PLATFORM - LeadsPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Select, Checkbox } from '../../../components/ui';
import { listLeads, updateLead, deleteLead, bulkActionLeads, exportLeads } from '../../../api/leads.api';
import { listFunnels } from '../../../api/funnels.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const LEADS_PAGE_STYLES = `
/* Leads Page Container */
.leads-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.leads-page__inner {
  max-width: 1600px;
  margin: 0 auto;
}

/* Header */
.leads-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.leads-header__content {
  flex: 1;
  min-width: 200px;
}

.leads-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.leads-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.leads-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Stats Cards */
.leads-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.leads-stat-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.leads-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.leads-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.leads-stat-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.leads-stat-card__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.leads-stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 12px;
  color: #667eea;
}

.leads-stat-card__icon svg {
  width: 20px;
  height: 20px;
}

.leads-stat-card__value {
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

/* Filters */
.leads-filters {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 2px solid #e5e7eb;
  margin-bottom: 2rem;
}

.leads-filters__row {
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr) auto;
  gap: 1rem;
  align-items: center;
}

.leads-filters__search {
  position: relative;
}

.leads-filters__search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #6b7280;
  pointer-events: none;
}

.leads-filters__search-icon svg {
  width: 100%;
  height: 100%;
}

.leads-filters__search input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.938rem;
  color: #374151;
  transition: all 0.2s ease;
}

.leads-filters__search input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.leads-filters__select select {
  width: 100%;
  padding: 0.875rem 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.938rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leads-filters__select select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.leads-filters__clear {
  white-space: nowrap;
}

/* Bulk Actions Bar */
.leads-bulk-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.leads-bulk-actions__info {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #ffffff;
}

.leads-bulk-actions__count {
  font-size: 1rem;
  font-weight: 700;
}

.leads-bulk-actions__buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Table */
.leads-table-container {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 2px solid #e5e7eb;
  overflow: hidden;
}

.leads-table {
  width: 100%;
  border-collapse: collapse;
}

.leads-table thead {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  position: sticky;
  top: 0;
  z-index: 10;
}

.leads-table th {
  padding: 1.25rem 1.5rem;
  text-align: left;
  font-size: 0.813rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.leads-table th:hover {
  background: rgba(102, 126, 234, 0.05);
  color: #667eea;
}

.leads-table th--sortable {
  position: relative;
  padding-right: 2.5rem;
}

.leads-table th--sorted {
  color: #667eea;
}

.leads-table__sort-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9ca3af;
  transition: all 0.2s ease;
}

.leads-table th--sorted .leads-table__sort-icon {
  color: #667eea;
}

.leads-table th--sorted-desc .leads-table__sort-icon {
  transform: translateY(-50%) rotate(180deg);
}

.leads-table__sort-icon svg {
  width: 100%;
  height: 100%;
}

.leads-table td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.938rem;
  color: #374151;
}

.leads-table tbody tr {
  transition: all 0.2s ease;
}

.leads-table tbody tr:hover {
  background: linear-gradient(135deg, #fafbfc 0%, #f9fafb 100%);
}

.leads-table tbody tr:last-child td {
  border-bottom: none;
}

.leads-table__checkbox {
  width: 40px;
}

.leads-table__name {
  font-weight: 700;
  color: #111827;
}

.leads-table__email {
  color: #667eea;
  text-decoration: none;
  transition: all 0.2s ease;
}

.leads-table__email:hover {
  color: #764ba2;
  text-decoration: underline;
}

.leads-table__phone {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
}

.leads-table__funnel {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.875rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #2563eb;
  border-radius: 8px;
  font-size: 0.813rem;
  font-weight: 600;
}

.leads-table__date {
  color: #6b7280;
  font-size: 0.875rem;
}

.leads-table__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.leads-table__tag {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #4b5563;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leads-table__tag:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.leads-table__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.leads-table__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leads-table__action-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.leads-table__action-btn--delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.leads-table__action-btn svg {
  width: 18px;
  height: 18px;
}

/* Pagination */
.leads-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: #ffffff;
  border-top: 2px solid #f3f4f6;
}

.leads-pagination__info {
  font-size: 0.875rem;
  color: #6b7280;
}

.leads-pagination__info strong {
  color: #111827;
  font-weight: 700;
}

.leads-pagination__controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.leads-pagination__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leads-pagination__button:hover:not(:disabled) {
  background: #667eea;
  border-color: #667eea;
  color: #ffffff;
}

.leads-pagination__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.leads-pagination__button svg {
  width: 20px;
  height: 20px;
}

.leads-pagination__page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0 0.75rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leads-pagination__page:hover {
  background: #f3f4f6;
  border-color: #667eea;
  color: #667eea;
}

.leads-pagination__page--active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: #ffffff;
}

/* Tags Editor Modal */
.leads-tags-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.leads-tags-modal__content {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.leads-tags-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.leads-tags-modal__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.leads-tags-modal__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leads-tags-modal__close:hover {
  background: #f3f4f6;
  color: #111827;
}

.leads-tags-modal__close svg {
  width: 20px;
  height: 20px;
}

.leads-tags-modal__input-group {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.leads-tags-modal__input {
  flex: 1;
}

.leads-tags-modal__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  min-height: 80px;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
}

.leads-tags-modal__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
}

.leads-tags-modal__tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leads-tags-modal__tag-remove:hover {
  background: rgba(255, 255, 255, 0.3);
}

.leads-tags-modal__tag-remove svg {
  width: 12px;
  height: 12px;
}

.leads-tags-modal__footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* Loading */
.leads-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.leads-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.leads-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Empty State */
.leads-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.leads-empty__icon {
  width: 120px;
  height: 120px;
  margin-bottom: 2rem;
  opacity: 0.5;
}

.leads-empty__icon svg {
  width: 100%;
  height: 100%;
}

.leads-empty__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.75rem 0;
}

.leads-empty__description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  max-width: 400px;
}

/* Responsive */
@media (max-width: 1200px) {
  .leads-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .leads-filters__row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .leads-page {
    padding: 1.5rem 1rem;
  }
  
  .leads-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .leads-stats {
    grid-template-columns: 1fr;
  }
  
  .leads-table-container {
    overflow-x: auto;
  }
  
  .leads-pagination {
    flex-direction: column;
    gap: 1rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .leads-loading__spinner,
  .leads-bulk-actions {
    animation: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'leads-page');
  styleElement.textContent = LEADS_PAGE_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const UserIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SearchIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const DownloadIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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

const TagIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const CloseIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CalendarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const LeadsPage = ({ className = '', ...props }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [funnels, setFunnels] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [filters, setFilters] = useState({
    search: '',
    funnel: '',
    dateRange: '',
    tags: [],
  });
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
    conversionRate: 0,
  });
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [newTag, setNewTag] = useState('');

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [filters, sortConfig, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, funnelsRes] = await Promise.all([
        listLeads({
          page: currentPage,
          pageSize,
          search: filters.search,
          funnelId: filters.funnel,
          dateRange: filters.dateRange,
          tags: filters.tags,
          sortBy: sortConfig.key,
          sortOrder: sortConfig.direction,
        }),
        listFunnels(),
      ]);

      setLeads(leadsRes.leads || []);
      setFunnels(funnelsRes.funnels || []);
      setStats({
        total: leadsRes.total || 0,
        thisWeek: leadsRes.thisWeek || 0,
        thisMonth: leadsRes.thisMonth || 0,
        conversionRate: leadsRes.conversionRate || 0,
      });
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedLeads(new Set(leads.map((l) => l.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const handleSelectLead = (id, checked) => {
    const newSelected = new Set(selectedLeads);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedLeads(newSelected);
  };

  const handleBulkExport = async () => {
    try {
      const leadIds = Array.from(selectedLeads);
      await exportLeads({ leadIds, format: 'csv' });
      alert('Export started! You will receive an email when ready.');
      setSelectedLeads(new Set());
    } catch (error) {
      console.error('Failed to export leads:', error);
      alert('Export failed');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedLeads.size} leads?`)) return;
    
    try {
      const leadIds = Array.from(selectedLeads);
      await bulkActionLeads({ action: 'delete', leadIds });
      setSelectedLeads(new Set());
      fetchData();
    } catch (error) {
      console.error('Failed to delete leads:', error);
      alert('Delete failed');
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    
    try {
      await deleteLead(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete lead:', error);
      alert('Delete failed');
    }
  };

  const handleEditTags = (lead) => {
    setEditingLead(lead);
    setTagsModalOpen(true);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const updatedTags = [...(editingLead.tags || []), newTag.trim()];
    setEditingLead({ ...editingLead, tags: updatedTags });
    setNewTag('');
  };

  const handleRemoveTag = (tag) => {
    const updatedTags = editingLead.tags.filter((t) => t !== tag);
    setEditingLead({ ...editingLead, tags: updatedTags });
  };

  const handleSaveTags = async () => {
    try {
      await updateLead(editingLead.id, { tags: editingLead.tags });
      setTagsModalOpen(false);
      setEditingLead(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update tags:', error);
      alert('Failed to save tags');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      funnel: '',
      dateRange: '',
      tags: [],
    });
    setCurrentPage(1);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalPages = Math.ceil(stats.total / pageSize);
  const allSelected = leads.length > 0 && selectedLeads.size === leads.length;
  const someSelected = selectedLeads.size > 0 && selectedLeads.size < leads.length;

  if (loading) {
    return (
      <div className="leads-page">
        <div className="leads-loading">
          <div className="leads-loading__spinner" />
          <p className="leads-loading__text">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`leads-page ${className}`} {...props}>
      <div className="leads-page__inner">
        {/* Header */}
        <div className="leads-header">
          <div className="leads-header__content">
            <h1 className="leads-header__title">Leads</h1>
            <p className="leads-header__subtitle">
              Manage and track your captured leads
            </p>
          </div>
          <div className="leads-header__actions">
            <Button variant="outline" size="md">
              <FilterIcon />
              Filters
            </Button>
            <Button variant="primary" size="md" onClick={() => exportLeads({ format: 'csv' })}>
              <DownloadIcon />
              Export All
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="leads-stats">
          <div className="leads-stat-card">
            <div className="leads-stat-card__header">
              <span className="leads-stat-card__label">Total Leads</span>
              <div className="leads-stat-card__icon">
                <UserIcon />
              </div>
            </div>
            <div className="leads-stat-card__value">{stats.total}</div>
          </div>

          <div className="leads-stat-card">
            <div className="leads-stat-card__header">
              <span className="leads-stat-card__label">This Week</span>
              <div className="leads-stat-card__icon">
                <CalendarIcon />
              </div>
            </div>
            <div className="leads-stat-card__value">{stats.thisWeek}</div>
          </div>

          <div className="leads-stat-card">
            <div className="leads-stat-card__header">
              <span className="leads-stat-card__label">This Month</span>
              <div className="leads-stat-card__icon">
                <TrendingUpIcon />
              </div>
            </div>
            <div className="leads-stat-card__value">{stats.thisMonth}</div>
          </div>

          <div className="leads-stat-card">
            <div className="leads-stat-card__header">
              <span className="leads-stat-card__label">Conversion</span>
              <div className="leads-stat-card__icon">
                <CheckIcon />
              </div>
            </div>
            <div className="leads-stat-card__value">{stats.conversionRate}%</div>
          </div>
        </div>

        {/* Filters */}
        <div className="leads-filters">
          <div className="leads-filters__row">
            <div className="leads-filters__search">
              <div className="leads-filters__search-icon">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="leads-filters__select">
              <select
                value={filters.funnel}
                onChange={(e) => setFilters({ ...filters, funnel: e.target.value })}
              >
                <option value="">All Funnels</option>
                {funnels.map((funnel) => (
                  <option key={funnel.id} value={funnel.id}>
                    {funnel.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="leads-filters__select">
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <div className="leads-filters__select">
              <select>
                <option value="">All Tags</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={handleClearFilters}
              className="leads-filters__clear"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedLeads.size > 0 && (
          <div className="leads-bulk-actions">
            <div className="leads-bulk-actions__info">
              <span className="leads-bulk-actions__count">
                {selectedLeads.size} selected
              </span>
            </div>
            <div className="leads-bulk-actions__buttons">
              <Button variant="outline" size="sm" onClick={handleBulkExport}>
                <DownloadIcon />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                <TrashIcon />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {leads.length === 0 ? (
          <div className="leads-table-container">
            <div className="leads-empty">
              <div className="leads-empty__icon">
                <UserIcon />
              </div>
              <h2 className="leads-empty__title">No leads found</h2>
              <p className="leads-empty__description">
                Start capturing leads by publishing your funnels
              </p>
            </div>
          </div>
        ) : (
          <div className="leads-table-container">
            <table className="leads-table">
              <thead>
                <tr>
                  <th className="leads-table__checkbox">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th
                    className={`leads-table th--sortable ${sortConfig.key === 'name' ? `th--sorted th--sorted-${sortConfig.direction}` : ''}`}
                    onClick={() => handleSort('name')}
                  >
                    Name
                    <div className="leads-table__sort-icon">
                      <ChevronDownIcon />
                    </div>
                  </th>
                  <th
                    className={`leads-table th--sortable ${sortConfig.key === 'email' ? `th--sorted th--sorted-${sortConfig.direction}` : ''}`}
                    onClick={() => handleSort('email')}
                  >
                    Email
                    <div className="leads-table__sort-icon">
                      <ChevronDownIcon />
                    </div>
                  </th>
                  <th>Phone</th>
                  <th>Funnel</th>
                  <th
                    className={`leads-table th--sortable ${sortConfig.key === 'createdAt' ? `th--sorted th--sorted-${sortConfig.direction}` : ''}`}
                    onClick={() => handleSort('createdAt')}
                  >
                    Date
                    <div className="leads-table__sort-icon">
                      <ChevronDownIcon />
                    </div>
                  </th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="leads-table__checkbox">
                      <Checkbox
                        checked={selectedLeads.has(lead.id)}
                        onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                      />
                    </td>
                    <td className="leads-table__name">{lead.name || 'N/A'}</td>
                    <td>
                      <a
                        href={`mailto:${lead.email}`}
                        className="leads-table__email"
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="leads-table__phone">{lead.phone || 'N/A'}</td>
                    <td>
                      <span className="leads-table__funnel">
                        {lead.funnelName || 'Unknown'}
                      </span>
                    </td>
                    <td className="leads-table__date">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td>
                      <div className="leads-table__tags">
                        {lead.tags?.slice(0, 2).map((tag, index) => (
                          <span key={index} className="leads-table__tag">
                            {tag}
                          </span>
                        ))}
                        {lead.tags?.length > 2 && (
                          <span className="leads-table__tag">
                            +{lead.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="leads-table__actions">
                        <button
                          className="leads-table__action-btn"
                          onClick={() => handleEditTags(lead)}
                          title="Edit tags"
                        >
                          <TagIcon />
                        </button>
                        <button
                          className="leads-table__action-btn leads-table__action-btn--delete"
                          onClick={() => handleDeleteLead(lead.id)}
                          title="Delete lead"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="leads-pagination">
              <div className="leads-pagination__info">
                Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * pageSize, stats.total)}</strong> of{' '}
                <strong>{stats.total}</strong> leads
              </div>
              <div className="leads-pagination__controls">
                <button
                  className="leads-pagination__button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon />
                </button>

                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      className={`leads-pagination__page ${currentPage === pageNum ? 'leads-pagination__page--active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  className="leads-pagination__button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tags Modal */}
        {tagsModalOpen && editingLead && (
          <div className="leads-tags-modal">
            <div className="leads-tags-modal__content">
              <div className="leads-tags-modal__header">
                <h2 className="leads-tags-modal__title">Edit Tags</h2>
                <button
                  className="leads-tags-modal__close"
                  onClick={() => setTagsModalOpen(false)}
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="leads-tags-modal__input-group">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Enter tag name"
                  className="leads-tags-modal__input"
                />
                <Button variant="primary" size="md" onClick={handleAddTag}>
                  Add
                </Button>
              </div>

              <div className="leads-tags-modal__tags">
                {editingLead.tags?.map((tag, index) => (
                  <div key={index} className="leads-tags-modal__tag">
                    {tag}
                    <button
                      className="leads-tags-modal__tag-remove"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))}
              </div>

              <div className="leads-tags-modal__footer">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setTagsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={handleSaveTags}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

LeadsPage.propTypes = {
  className: PropTypes.string,
};

export default LeadsPage;
export { LeadsPage };
