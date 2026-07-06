// =============================================================================
// AI FUNNEL PLATFORM - FunnelListPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Select } from '../../../components/ui';
import {
  listFunnels,
  deleteFunnel,
  cloneFunnel,
  bulkDeleteFunnels,
  bulkUpdateFunnels,
  searchFunnels,
  publishFunnel,
  unpublishFunnel,
  pauseFunnel,
  archiveFunnel,
  getFunnelStats,
} from '@/lib/api/funnels.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const FUNNEL_LIST_STYLES = `
/* Funnel List Container */
.funnel-list-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.funnel-list-page__inner {
  max-width: 1600px;
  margin: 0 auto;
}

/* Header */
.funnel-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.funnel-list-header__content {
  flex: 1;
  min-width: 200px;
}

.funnel-list-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.funnel-list-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.funnel-list-header__actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

/* Toolbar */
.funnel-list-toolbar {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.funnel-list-toolbar__top {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.funnel-list-toolbar__search {
  flex: 1;
  min-width: 280px;
  position: relative;
}

.funnel-list-toolbar__search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.funnel-list-toolbar__search-icon svg {
  width: 18px;
  height: 18px;
}

.funnel-list-toolbar__search input {
  width: 100%;
  padding-left: 2.75rem;
}

.funnel-list-toolbar__filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.funnel-list-toolbar__filter {
  min-width: 160px;
}

.funnel-list-toolbar__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.funnel-list-toolbar__bulk {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.funnel-list-toolbar__bulk-info {
  font-size: 0.875rem;
  font-weight: 600;
  color: #667eea;
}

.funnel-list-toolbar__bulk-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.funnel-list-toolbar__view-options {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.funnel-list-toolbar__sort {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.funnel-list-toolbar__sort:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}

.funnel-list-toolbar__sort svg {
  width: 16px;
  height: 16px;
}

/* Table Container */
.funnel-list-table-container {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 2rem;
}

/* Table */
.funnel-list-table {
  width: 100%;
  border-collapse: collapse;
}

.funnel-list-table__header {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  position: sticky;
  top: 0;
  z-index: 10;
}

.funnel-list-table__header th {
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

.funnel-list-table__header th:first-child {
  padding-left: 1.5rem;
  width: 40px;
}

.funnel-list-table__header-sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
}

.funnel-list-table__header-sortable:hover {
  color: #667eea;
}

.funnel-list-table__header-sort-icon {
  display: inline-flex;
  margin-left: 0.375rem;
  vertical-align: middle;
}

.funnel-list-table__header-sort-icon svg {
  width: 14px;
  height: 14px;
}

.funnel-list-table__body tr {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.funnel-list-table__body tr:hover {
  background: linear-gradient(135deg, #fafbfc 0%, #f9fafb 100%);
}

.funnel-list-table__body tr.funnel-list-table__row--selected {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.funnel-list-table__body td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.938rem;
  vertical-align: middle;
}

.funnel-list-table__body tr:last-child td {
  border-bottom: none;
}

.funnel-list-table__checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
}

.funnel-list-table__checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.funnel-list-table__funnel {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.funnel-list-table__funnel-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  flex-shrink: 0;
}

.funnel-list-table__funnel-icon svg {
  width: 20px;
  height: 20px;
}

.funnel-list-table__funnel-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.funnel-list-table__funnel-name {
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
}

.funnel-list-table__funnel-group {
  font-size: 0.813rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.funnel-list-table__funnel-group svg {
  width: 12px;
  height: 12px;
}

.funnel-list-table__status {
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

.funnel-list-table__status--active {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.funnel-list-table__status--draft {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
}

.funnel-list-table__status--paused {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.funnel-list-table__status--archived {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
}

.funnel-list-table__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.funnel-list-table__status--active .funnel-list-table__status-dot {
  background: #10b981;
}

.funnel-list-table__status--draft .funnel-list-table__status-dot {
  background: #9ca3af;
}

.funnel-list-table__status--paused .funnel-list-table__status-dot {
  background: #f59e0b;
}

.funnel-list-table__status--archived .funnel-list-table__status-dot {
  background: #64748b;
}

.funnel-list-table__metric {
  font-weight: 600;
  color: #111827;
}

.funnel-list-table__date {
  color: #6b7280;
  white-space: nowrap;
}

.funnel-list-table__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}

.funnel-list-table__action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #f9fafb;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.funnel-list-table__action-button:hover {
  background: #667eea;
  color: #ffffff;
}

.funnel-list-table__action-button--danger:hover {
  background: #dc2626;
  color: #ffffff;
}

.funnel-list-table__action-button svg {
  width: 16px;
  height: 16px;
}

/* Pagination */
.funnel-list-pagination {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.funnel-list-pagination__info {
  font-size: 0.875rem;
  color: #6b7280;
}

.funnel-list-pagination__info strong {
  color: #111827;
  font-weight: 700;
}

.funnel-list-pagination__controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.funnel-list-pagination__button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 0.75rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.funnel-list-pagination__button:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
  background: #f0f9ff;
}

.funnel-list-pagination__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.funnel-list-pagination__button--active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: #ffffff;
}

.funnel-list-pagination__button svg {
  width: 16px;
  height: 16px;
}

/* Empty State */
.funnel-list-empty {
  text-align: center;
  padding: 4rem 2rem;
  background: #ffffff;
  border-radius: 16px;
  border: 2px dashed #e5e7eb;
}

.funnel-list-empty__icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  color: #d1d5db;
}

.funnel-list-empty__icon svg {
  width: 100%;
  height: 100%;
}

.funnel-list-empty__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.funnel-list-empty__message {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

/* Loading */
.funnel-list-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.funnel-list-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: funnel-list-spin 0.8s linear infinite;
}

@keyframes funnel-list-spin {
  to { transform: rotate(360deg); }
}

.funnel-list-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Responsive */
@media (max-width: 1200px) {
  .funnel-list-table-container {
    overflow-x: auto;
  }
  
  .funnel-list-table {
    min-width: 1000px;
  }
}

@media (max-width: 768px) {
  .funnel-list-page {
    padding: 1.5rem 1rem;
  }
  
  .funnel-list-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .funnel-list-header__title {
    font-size: 1.75rem;
  }
  
  .funnel-list-header__actions {
    width: 100%;
  }
  
  .funnel-list-toolbar {
    padding: 1.25rem;
  }
  
  .funnel-list-toolbar__top,
  .funnel-list-toolbar__bottom {
    flex-direction: column;
    align-items: stretch;
  }
  
  .funnel-list-toolbar__search {
    max-width: 100%;
  }
  
  .funnel-list-toolbar__filters {
    width: 100%;
  }
  
  .funnel-list-toolbar__filter {
    flex: 1;
    min-width: 0;
  }
  
  .funnel-list-toolbar__bulk,
  .funnel-list-toolbar__view-options {
    width: 100%;
    justify-content: space-between;
  }
  
  .funnel-list-pagination {
    flex-direction: column;
    align-items: stretch;
  }
  
  .funnel-list-pagination__info {
    text-align: center;
  }
  
  .funnel-list-pagination__controls {
    justify-content: center;
    flex-wrap: wrap;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .funnel-list-loading__spinner {
    animation: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'funnel-list');
  styleElement.textContent = FUNNEL_LIST_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

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

const ChartIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FolderIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const SortIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
);

const SortAscIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

const SortDescIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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

const PlayIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const ChevronLeftIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);
// ADD THIS MISSING ICON
const RefreshIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const FunnelListPage = ({
  className = '',
  ...props
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    injectStyles();
  }, []);

  const [loading, setLoading] = useState(true);
  const [funnels, setFunnels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortField, setSortField] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedFunnels, setSelectedFunnels] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const itemsPerPage = 10;

  // Fetch funnels from API
  const fetchFunnels = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (groupFilter !== 'all') {
        params.groupId = groupFilter;
      }

      const data = await listFunnels(params);
      setFunnels(Array.isArray(data) ? data : data.funnels || []);
    } catch (error) {
      console.error('❌ Failed to fetch funnels:', error);
      setFunnels([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, groupFilter]);

  useEffect(() => {
    fetchFunnels();
  }, [fetchFunnels]);

  // Handle search with API
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      fetchFunnels();
      return;
    }

    setLoading(true);
    try {
      const results = await searchFunnels(query);
      setFunnels(Array.isArray(results) ? results : results.funnels || []);
    } catch (error) {
      console.error('❌ Search failed:', error);
      setFunnels([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFunnels]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        fetchFunnels();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch, fetchFunnels]);

  // Filter and sort funnels locally
  const filteredFunnels = useMemo(() => {
    let filtered = [...funnels];

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const dateThreshold = new Date();
      if (dateFilter === '7days') dateThreshold.setDate(now.getDate() - 7);
      else if (dateFilter === '30days') dateThreshold.setDate(now.getDate() - 30);
      else if (dateFilter === '90days') dateThreshold.setDate(now.getDate() - 90);

      filtered = filtered.filter((funnel) => new Date(funnel.createdAt) >= dateThreshold);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'name') {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      } else if (sortField === 'updatedAt' || sortField === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [funnels, dateFilter, sortField, sortDirection]);

  const paginatedFunnels = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFunnels.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFunnels, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredFunnels.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedFunnels(paginatedFunnels.map((f) => f.funnel_id || f.id));
    } else {
      setSelectedFunnels([]);
    }
  };

  const handleSelectFunnel = (id) => {
    setSelectedFunnels((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  // Bulk delete using API
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedFunnels.length} funnel(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      await bulkDeleteFunnels(selectedFunnels);
      console.log('✅ Bulk delete successful');
      setSelectedFunnels([]);
      fetchFunnels();
    } catch (error) {
      console.error('❌ Failed to delete funnels:', error);
      alert('Failed to delete funnels. Please try again.');
    }
  };

  // Bulk status change using API
  const handleBulkStatusChange = async (status) => {
    try {
      const updates = selectedFunnels.map(id => ({ funnel_id: id, status }));
      await bulkUpdateFunnels(updates);
      console.log(`✅ Bulk status changed to: ${status}`);
      setSelectedFunnels([]);
      fetchFunnels();
    } catch (error) {
      console.error('❌ Failed to update status:', error);
      alert('Failed to update funnel status. Please try again.');
    }
  };

  // Bulk publish
  const handleBulkPublish = async () => {
    try {
      await Promise.all(selectedFunnels.map(id => publishFunnel(id)));
      console.log('✅ Bulk publish successful');
      setSelectedFunnels([]);
      fetchFunnels();
    } catch (error) {
      console.error('❌ Failed to publish funnels:', error);
      alert('Failed to publish funnels. Please try again.');
    }
  };

  // Bulk pause
  const handleBulkPause = async () => {
    try {
      await Promise.all(selectedFunnels.map(id => pauseFunnel(id)));
      console.log('✅ Bulk pause successful');
      setSelectedFunnels([]);
      fetchFunnels();
    } catch (error) {
      console.error('❌ Failed to pause funnels:', error);
      alert('Failed to pause funnels. Please try again.');
    }
  };

  // Bulk archive
  const handleBulkArchive = async () => {
    if (!window.confirm(`Archive ${selectedFunnels.length} funnel(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedFunnels.map(id => archiveFunnel(id)));
      console.log('✅ Bulk archive successful');
      setSelectedFunnels([]);
      fetchFunnels();
    } catch (error) {
      console.error('❌ Failed to archive funnels:', error);
      alert('Failed to archive funnels. Please try again.');
    }
  };

  // Clone/Duplicate funnel using API
  const handleDuplicate = async (funnelId) => {
    try {
      const clonedFunnel = await cloneFunnel(funnelId);
      console.log('✅ Funnel duplicated:', clonedFunnel);
      fetchFunnels();
    } catch (error) {
      console.error('❌ Failed to duplicate funnel:', error);
      alert('Failed to duplicate funnel. Please try again.');
    }
  };

  // Delete single funnel
  const handleDelete = async (funnelId) => {
    if (!window.confirm('Delete this funnel? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteFunnel(funnelId);
      console.log('✅ Funnel deleted');
      fetchFunnels();
    } catch (error) {
      console.error('❌ Failed to delete funnel:', error);
      alert('Failed to delete funnel. Please try again.');
    }
  };

  // Refresh funnels
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFunnels();
    setTimeout(() => setRefreshing(false), 500);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return (num || 0).toLocaleString();
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`funnel-list-pagination__button ${i === currentPage ? 'funnel-list-pagination__button--active' : ''}`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className={`funnel-list-page ${className}`} {...props}>
      <div className="funnel-list-page__inner">
        {/* Header */}
        <div className="funnel-list-header">
          <div className="funnel-list-header__content">
            <h1 className="funnel-list-header__title">Funnels</h1>
            <p className="funnel-list-header__subtitle">
              Manage all your funnels in one place ({filteredFunnels.length} total)
            </p>
          </div>
          <div className="funnel-list-header__actions">
            <Button
              variant="outline"
              size="md"
              onClick={handleRefresh}
              leftIcon={<RefreshIcon />}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/funnels/create')}
              leftIcon={<PlusIcon />}
            >
              Create Funnel
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="funnel-list-toolbar">
          <div className="funnel-list-toolbar__top">
            <div className="funnel-list-toolbar__search">
              <div className="funnel-list-toolbar__search-icon">
                <SearchIcon />
              </div>
              <Input
                placeholder="Search funnels by name, group, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="funnel-list-toolbar__filters">
              <Select
                className="funnel-list-toolbar__filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </Select>

              <Select
                className="funnel-list-toolbar__filter"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
              >
                <option value="all">All Groups</option>
                {/* These would come from actual API */}
                <option value="group-1">Marketing Campaign</option>
                <option value="group-2">A/B Test 2025</option>
                <option value="group-3">Client Projects</option>
              </Select>

              <Select
                className="funnel-list-toolbar__filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
              </Select>
            </div>
          </div>

          {selectedFunnels.length > 0 ? (
            <div className="funnel-list-toolbar__bottom">
              <div className="funnel-list-toolbar__bulk">
                <div className="funnel-list-toolbar__bulk-info">
                  {selectedFunnels.length} selected
                </div>
                <div className="funnel-list-toolbar__bulk-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkPublish}
                    leftIcon={<PlayIcon />}
                  >
                    Publish
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkPause}
                    leftIcon={<PauseIcon />}
                  >
                    Pause
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkArchive}
                    leftIcon={<ArchiveIcon />}
                  >
                    Archive
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkDelete}
                    leftIcon={<TrashIcon />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="funnel-list-toolbar__bottom">
              <div className="funnel-list-toolbar__view-options">
                <button className="funnel-list-toolbar__sort" onClick={() => handleSort('name')}>
                  <SortIcon />
                  Sort by Name
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="funnel-list-loading">
            <div className="funnel-list-loading__spinner" />
            <p className="funnel-list-loading__text">Loading funnels...</p>
          </div>
        ) : filteredFunnels.length === 0 ? (
          <div className="funnel-list-empty">
            <div className="funnel-list-empty__icon">
              <ChartIcon />
            </div>
            <h3 className="funnel-list-empty__title">
              {searchQuery || statusFilter !== 'all' || groupFilter !== 'all' || dateFilter !== 'all'
                ? 'No funnels found'
                : 'No funnels yet'}
            </h3>
            <p className="funnel-list-empty__message">
              {searchQuery || statusFilter !== 'all' || groupFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Create your first funnel to start capturing leads and growing your business'}
            </p>
            <Button variant="primary" onClick={() => navigate('/funnels/create')}>
              Create Your First Funnel
            </Button>
          </div>
        ) : (
          <>
            <div className="funnel-list-table-container">
              <table className="funnel-list-table">
                <thead className="funnel-list-table__header">
                  <tr>
                    <th>
                      <div className="funnel-list-table__checkbox">
                        <input
                          type="checkbox"
                          checked={selectedFunnels.length === paginatedFunnels.length && paginatedFunnels.length > 0}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th
                      className="funnel-list-table__header-sortable"
                      onClick={() => handleSort('name')}
                    >
                      Funnel
                      {sortField === 'name' && (
                        <span className="funnel-list-table__header-sort-icon">
                          {sortDirection === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
                        </span>
                      )}
                    </th>
                    <th>Status</th>
                    <th
                      className="funnel-list-table__header-sortable"
                      onClick={() => handleSort('views')}
                    >
                      Views
                      {sortField === 'views' && (
                        <span className="funnel-list-table__header-sort-icon">
                          {sortDirection === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
                        </span>
                      )}
                    </th>
                    <th
                      className="funnel-list-table__header-sortable"
                      onClick={() => handleSort('leads')}
                    >
                      Leads
                      {sortField === 'leads' && (
                        <span className="funnel-list-table__header-sort-icon">
                          {sortDirection === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
                        </span>
                      )}
                    </th>
                    <th
                      className="funnel-list-table__header-sortable"
                      onClick={() => handleSort('conversion')}
                    >
                      Conversion
                      {sortField === 'conversion' && (
                        <span className="funnel-list-table__header-sort-icon">
                          {sortDirection === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
                        </span>
                      )}
                    </th>
                    <th
                      className="funnel-list-table__header-sortable"
                      onClick={() => handleSort('updatedAt')}
                    >
                      Updated
                      {sortField === 'updatedAt' && (
                        <span className="funnel-list-table__header-sort-icon">
                          {sortDirection === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
                        </span>
                      )}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="funnel-list-table__body">
                  {paginatedFunnels.map((funnel) => {
                    const funnelId = funnel.funnel_id || funnel.id;
                    return (
                      <tr
                        key={funnelId}
                        className={selectedFunnels.includes(funnelId) ? 'funnel-list-table__row--selected' : ''}
                        onClick={() => navigate(`/funnels/${funnelId}`)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="funnel-list-table__checkbox">
                            <input
                              type="checkbox"
                              checked={selectedFunnels.includes(funnelId)}
                              onChange={() => handleSelectFunnel(funnelId)}
                            />
                          </div>
                        </td>
                        <td>
                          <div className="funnel-list-table__funnel">
                            <div className="funnel-list-table__funnel-icon">
                              <ChartIcon />
                            </div>
                            <div className="funnel-list-table__funnel-info">
                              <div className="funnel-list-table__funnel-name">
                                {funnel.name || funnel.title || 'Untitled Funnel'}
                              </div>
                              {funnel.group_name && (
                                <div className="funnel-list-table__funnel-group">
                                  <FolderIcon />
                                  {funnel.group_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={`funnel-list-table__status funnel-list-table__status--${funnel.status || 'draft'}`}>
                            <span className="funnel-list-table__status-dot" />
                            {funnel.status || 'draft'}
                          </div>
                        </td>
                        <td>
                          <span className="funnel-list-table__metric">
                            {formatNumber(funnel.views || funnel.total_views || 0)}
                          </span>
                        </td>
                        <td>
                          <span className="funnel-list-table__metric">
                            {formatNumber(funnel.leads || funnel.total_leads || 0)}
                          </span>
                        </td>
                        <td>
                          <span className="funnel-list-table__metric">
                            {(funnel.conversion_rate || funnel.conversion || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <span className="funnel-list-table__date">
                            {formatDate(funnel.updated_at || funnel.updatedAt)}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="funnel-list-table__actions">
                            <button
                              className="funnel-list-table__action-button"
                              onClick={() => navigate(`/funnels/${funnelId}/edit`)}
                              title="Edit"
                            >
                              <EditIcon />
                            </button>
                            <button
                              className="funnel-list-table__action-button"
                              onClick={() => handleDuplicate(funnelId)}
                              title="Duplicate"
                            >
                              <CopyIcon />
                            </button>
                            <button
                              className="funnel-list-table__action-button funnel-list-table__action-button--danger"
                              onClick={() => handleDelete(funnelId)}
                              title="Delete"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="funnel-list-pagination">
                <div className="funnel-list-pagination__info">
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * itemsPerPage, filteredFunnels.length)}</strong> of{' '}
                  <strong>{filteredFunnels.length}</strong> funnels
                </div>
                <div className="funnel-list-pagination__controls">
                  <button
                    className="funnel-list-pagination__button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeftIcon />
                  </button>
                  {renderPaginationButtons()}
                  <button
                    className="funnel-list-pagination__button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRightIcon />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

FunnelListPage.propTypes = {
  className: PropTypes.string,
};

export default FunnelListPage;
export { FunnelListPage };
