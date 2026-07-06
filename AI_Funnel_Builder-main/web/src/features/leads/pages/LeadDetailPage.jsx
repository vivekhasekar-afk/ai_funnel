// =============================================================================
// AI FUNNEL PLATFORM - LeadDetailPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tabs, Button, Input, TextArea } from '../../../components/ui';
import { getLead, updateLead, exportLead, addLeadNote, getLeadTimeline, getLeadResponses } from '../../../api/leads.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const LEAD_DETAIL_STYLES = `
/* Lead Detail Page */
.lead-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.lead-detail-page__inner {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.lead-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.lead-detail-header__left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
}

.lead-detail-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lead-detail-header__back:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: #ffffff;
  transform: translateX(-4px);
}

.lead-detail-header__back svg {
  width: 24px;
  height: 24px;
}

.lead-detail-header__content {
  flex: 1;
}

.lead-detail-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.lead-detail-header__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.lead-detail-header__badge {
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

.lead-detail-header__badge--new {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #16a34a;
}

.lead-detail-header__badge--contacted {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
}

.lead-detail-header__badge--converted {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #6366f1;
}

.lead-detail-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Grid Layout */
.lead-detail-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

/* Sidebar */
.lead-detail-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Contact Card */
.lead-contact-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 2px solid #e5e7eb;
}

.lead-contact-card__avatar {
  width: 96px;
  height: 96px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 2.5rem;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.lead-contact-card__name {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  text-align: center;
  margin: 0 0 0.5rem 0;
}

.lead-contact-card__email {
  font-size: 0.938rem;
  color: #667eea;
  text-align: center;
  margin: 0 0 1.5rem 0;
  word-break: break-word;
}

.lead-contact-card__divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
  margin: 1.5rem 0;
}

.lead-contact-card__field {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.lead-contact-card__field:last-child {
  margin-bottom: 0;
}

.lead-contact-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 10px;
  color: #667eea;
}

.lead-contact-card__icon svg {
  width: 20px;
  height: 20px;
}

.lead-contact-card__field-content {
  flex: 1;
  padding-top: 0.25rem;
}

.lead-contact-card__label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.lead-contact-card__value {
  font-size: 0.938rem;
  color: #111827;
  font-weight: 600;
  word-break: break-word;
}

.lead-contact-card__value--link {
  color: #667eea;
  text-decoration: none;
  transition: all 0.2s ease;
}

.lead-contact-card__value--link:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* Stats Card */
.lead-stats-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 2px solid #e5e7eb;
}

.lead-stats-card__title {
  font-size: 1.125rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 1.5rem 0;
}

.lead-stats-card__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 0.75rem;
}

.lead-stats-card__item:last-child {
  margin-bottom: 0;
}

.lead-stats-card__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.lead-stats-card__value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
}

/* Tags Card */
.lead-tags-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 2px solid #e5e7eb;
}

.lead-tags-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.lead-tags-card__title {
  font-size: 1.125rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.lead-tags-card__add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lead-tags-card__add:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.lead-tags-card__add svg {
  width: 18px;
  height: 18px;
}

.lead-tags-card__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.lead-tags-card__tag {
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

.lead-tags-card__tag-remove {
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

.lead-tags-card__tag-remove:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lead-tags-card__tag-remove svg {
  width: 12px;
  height: 12px;
}

.lead-tags-card__empty {
  text-align: center;
  padding: 2rem 1rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

/* Main Content */
.lead-detail-main {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 2px solid #e5e7eb;
  min-height: 600px;
}

/* Tabs */
.lead-detail-tabs {
  margin-bottom: 2rem;
}

.lead-detail-tabs .tabs__list {
  border-bottom: 2px solid #f3f4f6;
  gap: 2rem;
}

.lead-detail-tabs .tabs__trigger {
  padding: 1rem 0;
  font-size: 0.938rem;
  font-weight: 700;
  color: #6b7280;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.lead-detail-tabs .tabs__trigger:hover {
  color: #667eea;
}

.lead-detail-tabs .tabs__trigger--active {
  color: #667eea;
  border-bottom-color: #667eea;
}

/* Responses Section */
.lead-responses {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.lead-response-item {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.2s ease;
}

.lead-response-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

.lead-response-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.lead-response-item__question {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.lead-response-item__date {
  font-size: 0.813rem;
  color: #6b7280;
}

.lead-response-item__answer {
  font-size: 0.938rem;
  color: #374151;
  line-height: 1.6;
  padding: 1rem;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.lead-responses__empty {
  text-align: center;
  padding: 4rem 2rem;
  color: #9ca3af;
}

.lead-responses__empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  opacity: 0.3;
}

/* Timeline */
.lead-timeline {
  position: relative;
  padding-left: 2.5rem;
}

.lead-timeline::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #667eea, #764ba2);
  border-radius: 3px;
}

.lead-timeline-item {
  position: relative;
  margin-bottom: 2rem;
}

.lead-timeline-item:last-child {
  margin-bottom: 0;
}

.lead-timeline-item__dot {
  position: absolute;
  left: -2.5rem;
  top: 0.25rem;
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 4px solid #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  z-index: 1;
}

.lead-timeline-item__dot svg {
  width: 18px;
  height: 18px;
}

.lead-timeline-item__content {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.25rem;
  border: 2px solid #e5e7eb;
}

.lead-timeline-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.lead-timeline-item__title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.lead-timeline-item__time {
  font-size: 0.813rem;
  color: #6b7280;
}

.lead-timeline-item__description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
}

/* Notes */
.lead-notes {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.lead-notes__form {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
}

.lead-notes__form-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;
}

.lead-notes__form-input {
  margin-bottom: 1rem;
}

.lead-notes__form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.lead-notes__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lead-note-item {
  padding: 1.25rem;
  background: #ffffff;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
}

.lead-note-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.lead-note-item__author {
  font-size: 0.875rem;
  font-weight: 700;
  color: #667eea;
}

.lead-note-item__date {
  font-size: 0.813rem;
  color: #6b7280;
}

.lead-note-item__content {
  font-size: 0.938rem;
  color: #374151;
  line-height: 1.6;
}

/* Follow-up Actions */
.lead-followup {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.lead-followup__form {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
}

.lead-followup__form-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;
}

.lead-followup__form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.lead-followup__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lead-followup-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: #ffffff;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.2s ease;
}

.lead-followup-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

.lead-followup-item__checkbox {
  margin-top: 0.25rem;
}

.lead-followup-item__content {
  flex: 1;
}

.lead-followup-item__title {
  font-size: 0.938rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.lead-followup-item__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.813rem;
  color: #6b7280;
}

.lead-followup-item__actions {
  display: flex;
  gap: 0.5rem;
}

.lead-followup-item__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lead-followup-item__action-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.lead-followup-item__action-btn--delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.lead-followup-item__action-btn svg {
  width: 16px;
  height: 16px;
}

/* Loading */
.lead-detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.lead-detail-loading__spinner {
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

.lead-detail-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Responsive */
@media (max-width: 1024px) {
  .lead-detail-grid {
    grid-template-columns: 1fr;
  }
  
  .lead-detail-sidebar {
    order: 2;
  }
  
  .lead-detail-main {
    order: 1;
  }
}

@media (max-width: 768px) {
  .lead-detail-page {
    padding: 1.5rem 1rem;
  }
  
  .lead-detail-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .lead-followup__form-grid {
    grid-template-columns: 1fr;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'lead-detail-page');
  styleElement.textContent = LEAD_DETAIL_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const ArrowLeftIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const MailIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const CalendarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const FunnelIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const PlusIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const CloseIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

const MessageIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const LeadDetailPage = ({ className = '', ...props }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState(null);
  const [responses, setResponses] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [newFollowup, setNewFollowup] = useState({ title: '', dueDate: '', type: 'email' });

  useEffect(() => {
    fetchLeadData();
  }, [id]);

  const fetchLeadData = async () => {
    setLoading(true);
    try {
      const [leadData, responsesData, timelineData] = await Promise.all([
        getLead(id),
        getLeadResponses(id),
        getLeadTimeline(id),
      ]);

      setLead(leadData);
      setResponses(responsesData.responses || []);
      setTimeline(timelineData.timeline || []);
      setNotes(leadData.notes || []);
      setFollowups(leadData.followups || []);
    } catch (error) {
      console.error('Failed to fetch lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportLead(id);
      alert('Export started! Check your downloads.');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await addLeadNote(id, { content: newNote });
      setNewNote('');
      fetchLeadData();
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleAddTag = async () => {
    const tag = prompt('Enter tag name:');
    if (!tag) return;

    try {
      const updatedTags = [...(lead.tags || []), tag];
      await updateLead(id, { tags: updatedTags });
      fetchLeadData();
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const handleRemoveTag = async (tag) => {
    try {
      const updatedTags = lead.tags.filter((t) => t !== tag);
      await updateLead(id, { tags: updatedTags });
      fetchLeadData();
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getInitials = (name) => {
    if (!name) return 'L';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusBadgeClass = (status) => {
    const map = {
      new: 'lead-detail-header__badge--new',
      contacted: 'lead-detail-header__badge--contacted',
      converted: 'lead-detail-header__badge--converted',
    };
    return map[status] || '';
  };

  if (loading) {
    return (
      <div className="lead-detail-page">
        <div className="lead-detail-loading">
          <div className="lead-detail-loading__spinner" />
          <p className="lead-detail-loading__text">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="lead-detail-page">
        <div className="lead-detail-loading">
          <p className="lead-detail-loading__text">Lead not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`lead-detail-page ${className}`} {...props}>
      <div className="lead-detail-page__inner">
        {/* Header */}
        <div className="lead-detail-header">
          <div className="lead-detail-header__left">
            <button
              className="lead-detail-header__back"
              onClick={() => navigate('/leads')}
            >
              <ArrowLeftIcon />
            </button>
            <div className="lead-detail-header__content">
              <h1 className="lead-detail-header__title">{lead.name || 'Unnamed Lead'}</h1>
              <div className="lead-detail-header__meta">
                <span className={`lead-detail-header__badge ${getStatusBadgeClass(lead.status)}`}>
                  {lead.status || 'New'}
                </span>
                <span className="lead-detail-header__badge">
                  Score: {lead.score || 0}/100
                </span>
                <span className="lead-detail-header__badge">
                  {formatDate(lead.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="lead-detail-header__actions">
            <Button variant="outline" size="md" onClick={handleExport}>
              <DownloadIcon />
              Export
            </Button>
            <Button variant="primary" size="md">
              <EditIcon />
              Edit
            </Button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="lead-detail-grid">
          {/* Sidebar */}
          <div className="lead-detail-sidebar">
            {/* Contact Card */}
            <Card className="lead-contact-card">
              <div className="lead-contact-card__avatar">
                {getInitials(lead.name)}
              </div>
              <h2 className="lead-contact-card__name">{lead.name || 'N/A'}</h2>
              <p className="lead-contact-card__email">{lead.email}</p>

              <div className="lead-contact-card__divider" />

              <div className="lead-contact-card__field">
                <div className="lead-contact-card__icon">
                  <PhoneIcon />
                </div>
                <div className="lead-contact-card__field-content">
                  <div className="lead-contact-card__label">Phone</div>
                  <div className="lead-contact-card__value">
                    {lead.phone || 'Not provided'}
                  </div>
                </div>
              </div>

              <div className="lead-contact-card__field">
                <div className="lead-contact-card__icon">
                  <FunnelIcon />
                </div>
                <div className="lead-contact-card__field-content">
                  <div className="lead-contact-card__label">Funnel</div>
                  <div className="lead-contact-card__value">
                    {lead.funnelName || 'Unknown'}
                  </div>
                </div>
              </div>

              <div className="lead-contact-card__field">
                <div className="lead-contact-card__icon">
                  <CalendarIcon />
                </div>
                <div className="lead-contact-card__field-content">
                  <div className="lead-contact-card__label">Captured</div>
                  <div className="lead-contact-card__value">
                    {formatDate(lead.createdAt)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats Card */}
            <Card className="lead-stats-card">
              <h3 className="lead-stats-card__title">Statistics</h3>
              <div className="lead-stats-card__item">
                <span className="lead-stats-card__label">Responses</span>
                <span className="lead-stats-card__value">{responses.length}</span>
              </div>
              <div className="lead-stats-card__item">
                <span className="lead-stats-card__label">Completion</span>
                <span className="lead-stats-card__value">{lead.completionRate || 0}%</span>
              </div>
              <div className="lead-stats-card__item">
                <span className="lead-stats-card__label">Time Spent</span>
                <span className="lead-stats-card__value">{lead.timeSpent || '0m'}</span>
              </div>
            </Card>

            {/* Tags Card */}
            <Card className="lead-tags-card">
              <div className="lead-tags-card__header">
                <h3 className="lead-tags-card__title">Tags</h3>
                <button className="lead-tags-card__add" onClick={handleAddTag}>
                  <PlusIcon />
                </button>
              </div>
              {lead.tags?.length > 0 ? (
                <div className="lead-tags-card__list">
                  {lead.tags.map((tag, index) => (
                    <div key={index} className="lead-tags-card__tag">
                      {tag}
                      <button
                        className="lead-tags-card__tag-remove"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="lead-tags-card__empty">No tags yet</div>
              )}
            </Card>
          </div>

          {/* Main Content */}
          <Card className="lead-detail-main">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="lead-detail-tabs">
              <Tabs.List>
                <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
                <Tabs.Trigger value="responses">Responses ({responses.length})</Tabs.Trigger>
                <Tabs.Trigger value="timeline">Timeline</Tabs.Trigger>
                <Tabs.Trigger value="notes">Notes ({notes.length})</Tabs.Trigger>
                <Tabs.Trigger value="followup">Follow-up</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="overview">
                <div className="lead-responses">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
                    Recent Activity
                  </h3>
                  {timeline.slice(0, 5).map((item, index) => (
                    <div key={index} className="lead-response-item">
                      <div className="lead-response-item__header">
                        <span className="lead-response-item__question">{item.event}</span>
                        <span className="lead-response-item__date">{formatDateTime(item.timestamp)}</span>
                      </div>
                      <div className="lead-response-item__answer">{item.description}</div>
                    </div>
                  ))}
                </div>
              </Tabs.Content>

              <Tabs.Content value="responses">
                <div className="lead-responses">
                  {responses.length > 0 ? (
                    responses.map((response) => (
                      <div key={response.id} className="lead-response-item">
                        <div className="lead-response-item__header">
                          <span className="lead-response-item__question">{response.questionText}</span>
                          <span className="lead-response-item__date">{formatDateTime(response.createdAt)}</span>
                        </div>
                        <div className="lead-response-item__answer">{response.answer}</div>
                      </div>
                    ))
                  ) : (
                    <div className="lead-responses__empty">
                      <div className="lead-responses__empty-icon">
                        <MessageIcon />
                      </div>
                      <p>No responses yet</p>
                    </div>
                  )}
                </div>
              </Tabs.Content>

              <Tabs.Content value="timeline">
                <div className="lead-timeline">
                  {timeline.map((item, index) => (
                    <div key={index} className="lead-timeline-item">
                      <div className="lead-timeline-item__dot">
                        <CheckCircleIcon />
                      </div>
                      <div className="lead-timeline-item__content">
                        <div className="lead-timeline-item__header">
                          <h4 className="lead-timeline-item__title">{item.event}</h4>
                          <span className="lead-timeline-item__time">{formatDateTime(item.timestamp)}</span>
                        </div>
                        <p className="lead-timeline-item__description">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Tabs.Content>

              <Tabs.Content value="notes">
                <div className="lead-notes">
                  <div className="lead-notes__form">
                    <h4 className="lead-notes__form-title">Add Note</h4>
                    <TextArea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter your note..."
                      rows={4}
                      className="lead-notes__form-input"
                    />
                    <div className="lead-notes__form-actions">
                      <Button variant="outline" size="md" onClick={() => setNewNote('')}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="md" onClick={handleAddNote}>
                        Add Note
                      </Button>
                    </div>
                  </div>

                  <div className="lead-notes__list">
                    {notes.map((note) => (
                      <div key={note.id} className="lead-note-item">
                        <div className="lead-note-item__header">
                          <span className="lead-note-item__author">{note.author}</span>
                          <span className="lead-note-item__date">{formatDateTime(note.createdAt)}</span>
                        </div>
                        <p className="lead-note-item__content">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Tabs.Content>

              <Tabs.Content value="followup">
                <div className="lead-followup">
                  <div className="lead-followup__form">
                    <h4 className="lead-followup__form-title">Schedule Follow-up</h4>
                    <div className="lead-followup__form-grid">
                      <Input
                        placeholder="Task title"
                        value={newFollowup.title}
                        onChange={(e) => setNewFollowup({ ...newFollowup, title: e.target.value })}
                      />
                      <Input
                        type="date"
                        value={newFollowup.dueDate}
                        onChange={(e) => setNewFollowup({ ...newFollowup, dueDate: e.target.value })}
                      />
                    </div>
                    <Button variant="primary" size="md" style={{ width: '100%' }}>
                      <PlusIcon />
                      Add Follow-up
                    </Button>
                  </div>

                  <div className="lead-followup__list">
                    {followups.map((followup) => (
                      <div key={followup.id} className="lead-followup-item">
                        <input
                          type="checkbox"
                          className="lead-followup-item__checkbox"
                          checked={followup.completed}
                          onChange={() => {}}
                        />
                        <div className="lead-followup-item__content">
                          <h5 className="lead-followup-item__title">{followup.title}</h5>
                          <div className="lead-followup-item__meta">
                            <span>{followup.type}</span>
                            <span>Due: {formatDate(followup.dueDate)}</span>
                          </div>
                        </div>
                        <div className="lead-followup-item__actions">
                          <button className="lead-followup-item__action-btn">
                            <EditIcon />
                          </button>
                          <button className="lead-followup-item__action-btn lead-followup-item__action-btn--delete">
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Tabs.Content>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

LeadDetailPage.propTypes = {
  className: PropTypes.string,
};

export default LeadDetailPage;
export { LeadDetailPage };
