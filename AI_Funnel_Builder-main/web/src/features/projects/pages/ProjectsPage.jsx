// =============================================================================
// AI FUNNEL PLATFORM - ProjectsPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Input, Button } from '../../../components/ui';
import { getProjects, createProject, updateProject, deleteProject, archiveProject } from '../../../api/projects.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const PROJECTS_PAGE_STYLES = `
/* Projects Container */
.projects-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.projects-page__inner {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.projects-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.projects-header__content {
  flex: 1;
  min-width: 200px;
}

.projects-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.projects-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.projects-header__actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

/* Stats Bar */
.projects-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.projects-stat-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.projects-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.projects-stat-card__header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 0.75rem;
}

.projects-stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #667eea;
}

.projects-stat-card__icon svg {
  width: 20px;
  height: 20px;
}

.projects-stat-card__value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
  line-height: 1;
}

.projects-stat-card__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
}

/* Toolbar */
.projects-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.projects-toolbar__search {
  flex: 1;
  min-width: 280px;
  max-width: 400px;
  position: relative;
}

.projects-toolbar__search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.projects-toolbar__search-icon svg {
  width: 18px;
  height: 18px;
}

.projects-toolbar__search input {
  width: 100%;
  padding-left: 2.75rem;
}

.projects-toolbar__filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.projects-toolbar__view-toggle {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.projects-toolbar__view-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.projects-toolbar__view-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.projects-toolbar__view-button--active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.projects-toolbar__view-button svg {
  width: 18px;
  height: 18px;
}

.projects-toolbar__sort {
  position: relative;
}

.projects-toolbar__sort-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.projects-toolbar__sort-button:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.projects-toolbar__sort-button svg {
  width: 16px;
  height: 16px;
}

/* Grid View */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.projects-card {
  background: #ffffff;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.projects-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.projects-card__header {
  padding: 1.75rem 1.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.projects-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.projects-card__icon {
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

.projects-card__icon svg {
  width: 24px;
  height: 24px;
}

.projects-card__menu {
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

.projects-card__menu:hover {
  background: #f3f4f6;
  color: #374151;
}

.projects-card__menu svg {
  width: 18px;
  height: 18px;
}

.projects-card__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.projects-card__description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.projects-card__body {
  padding: 1.25rem 1.75rem;
}

.projects-card__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.projects-card__stat {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.projects-card__stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.projects-card__stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.projects-card__footer {
  padding: 1rem 1.75rem 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.projects-card__updated {
  font-size: 0.813rem;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.projects-card__updated svg {
  width: 14px;
  height: 14px;
}

.projects-card__status {
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

.projects-card__status--active {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.projects-card__status--archived {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
}

/* Table View */
.projects-table-container {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.projects-table {
  width: 100%;
  border-collapse: collapse;
}

.projects-table__header {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.projects-table__header th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.813rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
}

.projects-table__body tr {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.projects-table__body tr:hover {
  background: linear-gradient(135deg, #fafbfc 0%, #f9fafb 100%);
}

.projects-table__body td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.938rem;
}

.projects-table__body tr:last-child td {
  border-bottom: none;
}

.projects-table__project {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.projects-table__project-icon {
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

.projects-table__project-icon svg {
  width: 20px;
  height: 20px;
}

.projects-table__project-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.projects-table__project-name {
  font-weight: 700;
  color: #111827;
}

.projects-table__project-description {
  font-size: 0.813rem;
  color: #6b7280;
}

.projects-table__stat {
  font-weight: 600;
  color: #111827;
}

.projects-table__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}

.projects-table__action-button {
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

.projects-table__action-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.projects-table__action-button--danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

.projects-table__action-button svg {
  width: 16px;
  height: 16px;
}

/* Modal */
.projects-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  animation: projects-modal-enter 0.3s ease-out;
}

@keyframes projects-modal-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}

.projects-modal__content {
  background: #ffffff;
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 540px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: projects-modal-content-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes projects-modal-content-enter {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.projects-modal__header {
  margin-bottom: 2rem;
}

.projects-modal__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.projects-modal__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.projects-modal__form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.projects-modal__form-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.projects-modal__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
}

.projects-modal__textarea {
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

.projects-modal__textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.projects-modal__actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 2px solid #f3f4f6;
  margin-top: 0.5rem;
}

/* Empty State */
.projects-empty {
  text-align: center;
  padding: 4rem 2rem;
  background: #ffffff;
  border-radius: 16px;
  border: 2px dashed #e5e7eb;
}

.projects-empty__icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  color: #d1d5db;
}

.projects-empty__icon svg {
  width: 100%;
  height: 100%;
}

.projects-empty__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.projects-empty__message {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

/* Loading */
.projects-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.projects-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: projects-spin 0.8s linear infinite;
}

@keyframes projects-spin {
  to { transform: rotate(360deg); }
}

.projects-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Responsive */
@media (max-width: 1200px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .projects-page {
    padding: 1.5rem 1rem;
  }
  
  .projects-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .projects-header__title {
    font-size: 1.75rem;
  }
  
  .projects-header__actions {
    width: 100%;
  }
  
  .projects-stats {
    grid-template-columns: 1fr;
  }
  
  .projects-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .projects-toolbar__search {
    max-width: 100%;
  }
  
  .projects-toolbar__filters {
    justify-content: space-between;
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
  }
  
  .projects-table-container {
    overflow-x: auto;
  }
  
  .projects-modal__content {
    padding: 2rem 1.5rem;
  }
  
  .projects-modal__actions {
    flex-direction: column-reverse;
  }
  
  .projects-modal__actions button {
    width: 100%;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .projects-card,
  .projects-modal,
  .projects-modal__content,
  .projects-loading__spinner {
    animation: none !important;
  }
  
  .projects-card:hover,
  .projects-stat-card:hover {
    transform: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'projects-page');
  styleElement.textContent = PROJECTS_PAGE_STYLES;
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

const SearchIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const GridIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const DotsIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
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

const UsersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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

const ArchiveIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);

const SortIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const ProjectsPage = ({
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    return projects.filter((project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === 'active').length;
    const totalFunnels = projects.reduce((sum, p) => sum + (p.funnelsCount || 0), 0);
    const totalLeads = projects.reduce((sum, p) => sum + (p.leadsCount || 0), 0);
    return { total: projects.length, active, totalFunnels, totalLeads };
  }, [projects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setFormLoading(true);
    try {
      await createProject(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      fetchProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleArchiveProject = async (id) => {
    try {
      await archiveProject(id);
      fetchProjects();
    } catch (error) {
      console.error('Failed to archive project:', error);
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className={`projects-page ${className}`} {...props}>
      <div className="projects-page__inner">
        {/* Header */}
        <div className="projects-header">
          <div className="projects-header__content">
            <h1 className="projects-header__title">Projects</h1>
            <p className="projects-header__subtitle">Organize your funnels into projects</p>
          </div>
          <div className="projects-header__actions">
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<PlusIcon />}
            >
              New Project
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="projects-stats">
          <div className="projects-stat-card">
            <div className="projects-stat-card__header">
              <div className="projects-stat-card__icon">
                <FolderIcon />
              </div>
              <div>
                <p className="projects-stat-card__value">{stats.total}</p>
                <p className="projects-stat-card__label">Total Projects</p>
              </div>
            </div>
          </div>

          <div className="projects-stat-card">
            <div className="projects-stat-card__header">
              <div className="projects-stat-card__icon">
                <ChartIcon />
              </div>
              <div>
                <p className="projects-stat-card__value">{stats.totalFunnels}</p>
                <p className="projects-stat-card__label">Total Funnels</p>
              </div>
            </div>
          </div>

          <div className="projects-stat-card">
            <div className="projects-stat-card__header">
              <div className="projects-stat-card__icon">
                <UsersIcon />
              </div>
              <div>
                <p className="projects-stat-card__value">{stats.totalLeads.toLocaleString()}</p>
                <p className="projects-stat-card__label">Total Leads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="projects-toolbar">
          <div className="projects-toolbar__search">
            <div className="projects-toolbar__search-icon">
              <SearchIcon />
            </div>
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="projects-toolbar__filters">
            <div className="projects-toolbar__view-toggle">
              <button
                className={`projects-toolbar__view-button ${viewMode === 'grid' ? 'projects-toolbar__view-button--active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <GridIcon />
              </button>
              <button
                className={`projects-toolbar__view-button ${viewMode === 'table' ? 'projects-toolbar__view-button--active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <ListIcon />
              </button>
            </div>

            <div className="projects-toolbar__sort">
              <button className="projects-toolbar__sort-button">
                <SortIcon />
                Sort by
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="projects-loading">
            <div className="projects-loading__spinner" />
            <p className="projects-loading__text">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="projects-empty">
            <div className="projects-empty__icon">
              <FolderIcon />
            </div>
            <h3 className="projects-empty__title">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="projects-empty__message">
              {searchQuery ? 'Try adjusting your search' : 'Create your first project to get started'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Create Project
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <div key={project.id} className="projects-card">
                <div className="projects-card__header">
                  <div className="projects-card__top">
                    <div className="projects-card__icon">
                      <FolderIcon />
                    </div>
                    <button className="projects-card__menu">
                      <DotsIcon />
                    </button>
                  </div>
                  <h3 className="projects-card__title">{project.name}</h3>
                  {project.description && (
                    <p className="projects-card__description">{project.description}</p>
                  )}
                </div>

                <div className="projects-card__body">
                  <div className="projects-card__stats">
                    <div className="projects-card__stat">
                      <span className="projects-card__stat-label">Funnels</span>
                      <span className="projects-card__stat-value">{project.funnelsCount || 0}</span>
                    </div>
                    <div className="projects-card__stat">
                      <span className="projects-card__stat-label">Leads</span>
                      <span className="projects-card__stat-value">{(project.leadsCount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="projects-card__footer">
                  <div className="projects-card__updated">
                    <ClockIcon />
                    {formatDate(project.updatedAt)}
                  </div>
                  <div className={`projects-card__status projects-card__status--${project.status}`}>
                    {project.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="projects-table-container">
            <table className="projects-table">
              <thead className="projects-table__header">
                <tr>
                  <th>Project</th>
                  <th>Funnels</th>
                  <th>Leads</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="projects-table__body">
                {filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="projects-table__project">
                        <div className="projects-table__project-icon">
                          <FolderIcon />
                        </div>
                        <div className="projects-table__project-info">
                          <div className="projects-table__project-name">{project.name}</div>
                          {project.description && (
                            <div className="projects-table__project-description">{project.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="projects-table__stat">{project.funnelsCount || 0}</span>
                    </td>
                    <td>
                      <span className="projects-table__stat">{(project.leadsCount || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <div className={`projects-card__status projects-card__status--${project.status}`}>
                        {project.status}
                      </div>
                    </td>
                    <td>
                      <div className="projects-card__updated">
                        <ClockIcon />
                        {formatDate(project.updatedAt)}
                      </div>
                    </td>
                    <td>
                      <div className="projects-table__actions">
                        <button className="projects-table__action-button" title="Edit">
                          <EditIcon />
                        </button>
                        <button
                          className="projects-table__action-button"
                          onClick={() => handleArchiveProject(project.id)}
                          title="Archive"
                        >
                          <ArchiveIcon />
                        </button>
                        <button
                          className="projects-table__action-button projects-table__action-button--danger"
                          onClick={() => handleDeleteProject(project.id)}
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="projects-modal" onClick={() => setShowCreateModal(false)}>
          <div className="projects-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="projects-modal__header">
              <h2 className="projects-modal__title">Create New Project</h2>
              <p className="projects-modal__subtitle">Organize your funnels into a project</p>
            </div>

            <form className="projects-modal__form" onSubmit={handleCreateProject}>
              <div className="projects-modal__form-group">
                <label htmlFor="projectName" className="projects-modal__label">
                  Project Name
                </label>
                <Input
                  id="projectName"
                  placeholder="e.g., Product Launch 2025"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={formLoading}
                  autoFocus
                  required
                />
              </div>

              <div className="projects-modal__form-group">
                <label htmlFor="projectDescription" className="projects-modal__label">
                  Description (optional)
                </label>
                <textarea
                  id="projectDescription"
                  className="projects-modal__textarea"
                  placeholder="Brief description of your project..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={formLoading}
                />
              </div>

              <div className="projects-modal__actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={formLoading}>
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

ProjectsPage.propTypes = {
  className: PropTypes.string,
};

export default ProjectsPage;
export { ProjectsPage };
