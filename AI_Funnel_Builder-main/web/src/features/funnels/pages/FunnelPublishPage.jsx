// =============================================================================
// AI FUNNEL PLATFORM - FunnelPublishPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { Input, Button, Textarea, Select, Checkbox } from '../../../components/ui';
import { getFunnel, publishFunnel, unpublishFunnel, updateFunnel, updateFunnelSEO, getEmbedCode } from '../../../api/funnels.api';
import QRCode from 'qrcode';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const FUNNEL_PUBLISH_STYLES = `
/* Publish Page Container */
.funnel-publish-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.funnel-publish-page__inner {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.funnel-publish-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.funnel-publish-header__content {
  flex: 1;
  min-width: 200px;
}

.funnel-publish-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.funnel-publish-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

.funnel-publish-header__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Status Toggle */
.funnel-publish-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
}

.funnel-publish-status__label {
  font-size: 0.938rem;
  font-weight: 700;
  color: #374151;
}

.funnel-publish-status__toggle {
  position: relative;
  width: 56px;
  height: 32px;
  background: #d1d5db;
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.funnel-publish-status__toggle--active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.funnel-publish-status__toggle-thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 24px;
  height: 24px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.funnel-publish-status__toggle--active .funnel-publish-status__toggle-thumb {
  transform: translateX(24px);
}

.funnel-publish-status__text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.funnel-publish-status__text--published {
  color: #059669;
}

/* Layout */
.funnel-publish-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  align-items: flex-start;
}

.funnel-publish-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.funnel-publish-sidebar {
  position: sticky;
  top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Card */
.funnel-publish-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 2px solid #e5e7eb;
  overflow: hidden;
}

.funnel-publish-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.75rem 2rem;
  border-bottom: 2px solid #f3f4f6;
}

.funnel-publish-card__title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.funnel-publish-card__title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 10px;
  color: #667eea;
}

.funnel-publish-card__title-icon svg {
  width: 20px;
  height: 20px;
}

.funnel-publish-card__body {
  padding: 2rem;
}

/* Link Section */
.funnel-publish-link {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.funnel-publish-link__input-group {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.funnel-publish-link__input {
  flex: 1;
}

.funnel-publish-link__input input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.938rem;
  color: #374151;
  font-family: 'Monaco', 'Courier New', monospace;
}

.funnel-publish-link__button {
  flex-shrink: 0;
}

.funnel-publish-link__stats {
  display: flex;
  gap: 1.5rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 12px;
}

.funnel-publish-link__stat {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.funnel-publish-link__stat-label {
  font-size: 0.813rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.funnel-publish-link__stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
}

/* Embed Code */
.funnel-publish-embed {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.funnel-publish-embed__tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 10px;
}

.funnel-publish-embed__tab {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.funnel-publish-embed__tab--active {
  background: #ffffff;
  color: #667eea;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.funnel-publish-embed__code {
  position: relative;
  background: #1f2937;
  border-radius: 12px;
  padding: 1.5rem;
  overflow: hidden;
}

.funnel-publish-embed__code-content {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  color: #d1d5db;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.funnel-publish-embed__code-copy {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

/* QR Code */
.funnel-publish-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 12px;
}

.funnel-publish-qr__canvas {
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.funnel-publish-qr__actions {
  display: flex;
  gap: 0.75rem;
}

/* Lead Fields */
.funnel-publish-lead-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.funnel-publish-lead-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.funnel-publish-lead-field:hover {
  border-color: #d1d5db;
}

.funnel-publish-lead-field--enabled {
  border-color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.funnel-publish-lead-field__info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.funnel-publish-lead-field__label {
  font-size: 0.938rem;
  font-weight: 700;
  color: #111827;
}

.funnel-publish-lead-field__description {
  font-size: 0.813rem;
  color: #6b7280;
}

.funnel-publish-lead-field__required {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 4px;
  font-size: 0.688rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 0.5rem;
}

/* SEO Meta */
.funnel-publish-seo {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.funnel-publish-seo__preview {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 12px;
}

.funnel-publish-seo__preview-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e40af;
  margin: 0 0 0.5rem 0;
  text-decoration: underline;
}

.funnel-publish-seo__preview-url {
  font-size: 0.875rem;
  color: #059669;
  margin: 0 0 0.75rem 0;
}

.funnel-publish-seo__preview-description {
  font-size: 0.938rem;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
}

.funnel-publish-seo__form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.funnel-publish-seo__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.funnel-publish-seo__char-count {
  font-size: 0.813rem;
  font-weight: 600;
  color: #6b7280;
}

.funnel-publish-seo__char-count--warning {
  color: #f59e0b;
}

.funnel-publish-seo__char-count--error {
  color: #dc2626;
}

.funnel-publish-seo__hint {
  font-size: 0.813rem;
  color: #6b7280;
  margin-top: -0.25rem;
}

/* Redirect Settings */
.funnel-publish-redirect {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.funnel-publish-redirect__info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 10px;
}

.funnel-publish-redirect__info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #667eea;
  flex-shrink: 0;
}

.funnel-publish-redirect__info-icon svg {
  width: 100%;
  height: 100%;
}

.funnel-publish-redirect__info-text {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
  margin: 0;
}

/* Summary Card */
.funnel-publish-summary {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.funnel-publish-summary__item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.funnel-publish-summary__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 12px;
  color: #667eea;
  flex-shrink: 0;
}

.funnel-publish-summary__item-icon svg {
  width: 24px;
  height: 24px;
}

.funnel-publish-summary__item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.funnel-publish-summary__item-label {
  font-size: 0.813rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.funnel-publish-summary__item-value {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.funnel-publish-summary__status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.813rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.funnel-publish-summary__status--published {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.funnel-publish-summary__status--draft {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
}

.funnel-publish-summary__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.funnel-publish-summary__status--published .funnel-publish-summary__status-dot {
  background: #10b981;
}

.funnel-publish-summary__status--draft .funnel-publish-summary__status-dot {
  background: #9ca3af;
}

/* Loading */
.funnel-publish-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1.5rem;
}

.funnel-publish-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: funnel-publish-spin 0.8s linear infinite;
}

@keyframes funnel-publish-spin {
  to { transform: rotate(360deg); }
}

.funnel-publish-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* Modal */
.funnel-publish-modal {
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
}

.funnel-publish-modal__content {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.funnel-publish-modal__header {
  margin-bottom: 1.5rem;
}

.funnel-publish-modal__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.funnel-publish-modal__body {
  margin-bottom: 1.5rem;
}

.funnel-publish-modal__footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 1200px) {
  .funnel-publish-layout {
    grid-template-columns: 1fr;
  }
  
  .funnel-publish-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .funnel-publish-page {
    padding: 1.5rem 1rem;
  }
  
  .funnel-publish-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .funnel-publish-card__body {
    padding: 1.5rem;
  }
  
  .funnel-publish-link__input-group {
    flex-direction: column;
  }
  
  .funnel-publish-link__stats {
    flex-direction: column;
  }
  
  .funnel-publish-embed__tabs {
    flex-direction: column;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .funnel-publish-loading__spinner,
  .funnel-publish-status__toggle-thumb {
    animation: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'funnel-publish');
  styleElement.textContent = FUNNEL_PUBLISH_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const GlobeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CodeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const QrCodeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
);

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

const ExternalLinkIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const CopyIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const CheckIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const InformationIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const FunnelPublishPage = ({ className = '', ...props }) => {
  const { id } = useParams();
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    injectStyles();
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [funnel, setFunnel] = useState(null);
  const [embedTab, setEmbedTab] = useState('iframe');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const [settings, setSettings] = useState({
    status: 'draft',
    leadFields: {
      email: true,
      name: false,
      phone: false,
      company: false,
    },
    redirectUrl: '',
    seo: {
      title: '',
      description: '',
      keywords: '',
      ogImage: '',
    },
  });

  const publicUrl = funnel ? `https://yourdomain.com/f/${funnel.slug}` : '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFunnel(id);
      setFunnel(data);
      setSettings({
        status: data.status || 'draft',
        leadFields: data.leadFields || {
          email: true,
          name: false,
          phone: false,
          company: false,
        },
        redirectUrl: data.redirectUrl || '',
        seo: data.seo || {
          title: data.name,
          description: data.description || '',
          keywords: '',
          ogImage: '',
        },
      });
    } catch (error) {
      console.error('Failed to fetch funnel:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate QR Code
  useEffect(() => {
    if (qrCanvasRef.current && publicUrl) {
      QRCode.toCanvas(qrCanvasRef.current, publicUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#111827',
          light: '#ffffff',
        },
      });
    }
  }, [publicUrl]);

  const handleToggleStatus = async () => {
    if (settings.status === 'draft') {
      setShowPublishModal(true);
    } else {
      await handleUnpublish();
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await publishFunnel(id);
      await updateFunnel(id, { leadFields: settings.leadFields, redirectUrl: settings.redirectUrl });
      await updateFunnelSEO(id, settings.seo);
      setSettings((prev) => ({ ...prev, status: 'active' }));
      setShowPublishModal(false);
      alert('Funnel published successfully!');
      fetchData();
    } catch (error) {
      console.error('Failed to publish:', error);
      alert('Failed to publish funnel');
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!window.confirm('Are you sure you want to unpublish this funnel?')) return;
    
    setSaving(true);
    try {
      await unpublishFunnel(id);
      setSettings((prev) => ({ ...prev, status: 'draft' }));
      alert('Funnel unpublished successfully!');
      fetchData();
    } catch (error) {
      console.error('Failed to unpublish:', error);
      alert('Failed to unpublish funnel');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    alert('URL copied to clipboard!');
  };

  const handleCopyEmbedCode = () => {
    const code = getEmbedCodeString();
    navigator.clipboard.writeText(code);
    alert('Embed code copied to clipboard!');
  };

  const handleDownloadQR = () => {
    if (!qrCanvasRef.current) return;
    const url = qrCanvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${funnel.slug}-qr-code.png`;
    link.href = url;
    link.click();
  };

  const handleToggleLeadField = (field) => {
    setSettings((prev) => ({
      ...prev,
      leadFields: {
        ...prev.leadFields,
        [field]: !prev.leadFields[field],
      },
    }));
  };

  const handleSEOChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: value,
      },
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateFunnel(id, { leadFields: settings.leadFields, redirectUrl: settings.redirectUrl });
      await updateFunnelSEO(id, settings.seo);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getEmbedCodeString = () => {
    switch (embedTab) {
      case 'iframe':
        return `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`;
      case 'popup':
        return `<script src="https://yourdomain.com/embed.js" data-funnel="${funnel?.slug}" data-type="popup"></script>`;
      case 'inline':
        return `<div id="funnel-${funnel?.slug}"></div>\n<script src="https://yourdomain.com/embed.js" data-funnel="${funnel?.slug}" data-type="inline"></script>`;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="funnel-publish-page">
        <div className="funnel-publish-loading">
          <div className="funnel-publish-loading__spinner" />
          <p className="funnel-publish-loading__text">Loading publish settings...</p>
        </div>
      </div>
    );
  }

  const seoTitleLength = settings.seo.title.length;
  const seoDescriptionLength = settings.seo.description.length;

  return (
    <div className={`funnel-publish-page ${className}`} {...props}>
      <div className="funnel-publish-page__inner">
        {/* Header */}
        <div className="funnel-publish-header">
          <div className="funnel-publish-header__content">
            <h1 className="funnel-publish-header__title">Publish Funnel</h1>
            <p className="funnel-publish-header__subtitle">
              Configure and publish your funnel to make it live
            </p>
          </div>
          <div className="funnel-publish-header__actions">
            <div className="funnel-publish-status">
              <span className="funnel-publish-status__label">Status:</span>
              <div
                className={`funnel-publish-status__toggle ${settings.status === 'active' ? 'funnel-publish-status__toggle--active' : ''}`}
                onClick={handleToggleStatus}
              >
                <div className="funnel-publish-status__toggle-thumb" />
              </div>
              <span className={`funnel-publish-status__text ${settings.status === 'active' ? 'funnel-publish-status__text--published' : ''}`}>
                {settings.status === 'active' ? 'Published' : 'Draft'}
              </span>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {/* Layout */}
        <div className="funnel-publish-layout">
          {/* Main Content */}
          <div className="funnel-publish-main">
            {/* Public Link */}
            <div className="funnel-publish-card">
              <div className="funnel-publish-card__header">
                <h2 className="funnel-publish-card__title">
                  <div className="funnel-publish-card__title-icon">
                    <GlobeIcon />
                  </div>
                  Public Link
                </h2>
              </div>
              <div className="funnel-publish-card__body">
                <div className="funnel-publish-link">
                  <div className="funnel-publish-link__input-group">
                    <div className="funnel-publish-link__input">
                      <input
                        type="text"
                        value={publicUrl}
                        readOnly
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={handleCopyUrl}
                      className="funnel-publish-link__button"
                    >
                      <CopyIcon /> Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => window.open(publicUrl, '_blank')}
                      className="funnel-publish-link__button"
                    >
                      <ExternalLinkIcon /> Open
                    </Button>
                  </div>
                  <div className="funnel-publish-link__stats">
                    <div className="funnel-publish-link__stat">
                      <div className="funnel-publish-link__stat-label">Total Views</div>
                      <div className="funnel-publish-link__stat-value">
                        {funnel?.stats?.views || 0}
                      </div>
                    </div>
                    <div className="funnel-publish-link__stat">
                      <div className="funnel-publish-link__stat-label">Leads</div>
                      <div className="funnel-publish-link__stat-value">
                        {funnel?.stats?.leads || 0}
                      </div>
                    </div>
                    <div className="funnel-publish-link__stat">
                      <div className="funnel-publish-link__stat-label">Conversion</div>
                      <div className="funnel-publish-link__stat-value">
                        {funnel?.stats?.conversion || 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Embed Code */}
            <div className="funnel-publish-card">
              <div className="funnel-publish-card__header">
                <h2 className="funnel-publish-card__title">
                  <div className="funnel-publish-card__title-icon">
                    <CodeIcon />
                  </div>
                  Embed Code
                </h2>
              </div>
              <div className="funnel-publish-card__body">
                <div className="funnel-publish-embed">
                  <div className="funnel-publish-embed__tabs">
                    <button
                      className={`funnel-publish-embed__tab ${embedTab === 'iframe' ? 'funnel-publish-embed__tab--active' : ''}`}
                      onClick={() => setEmbedTab('iframe')}
                    >
                      iFrame
                    </button>
                    <button
                      className={`funnel-publish-embed__tab ${embedTab === 'popup' ? 'funnel-publish-embed__tab--active' : ''}`}
                      onClick={() => setEmbedTab('popup')}
                    >
                      Popup
                    </button>
                    <button
                      className={`funnel-publish-embed__tab ${embedTab === 'inline' ? 'funnel-publish-embed__tab--active' : ''}`}
                      onClick={() => setEmbedTab('inline')}
                    >
                      Inline
                    </button>
                  </div>
                  <div className="funnel-publish-embed__code">
                    <div className="funnel-publish-embed__code-content">
                      {getEmbedCodeString()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyEmbedCode}
                      className="funnel-publish-embed__code-copy"
                    >
                      <CopyIcon /> Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Capture Fields */}
            <div className="funnel-publish-card">
              <div className="funnel-publish-card__header">
                <h2 className="funnel-publish-card__title">
                  <div className="funnel-publish-card__title-icon">
                    <UserIcon />
                  </div>
                  Lead Capture Fields
                </h2>
              </div>
              <div className="funnel-publish-card__body">
                <div className="funnel-publish-lead-fields">
                  {Object.entries({
                    email: { label: 'Email Address', description: 'Required for all submissions', required: true },
                    name: { label: 'Full Name', description: 'Collect user\'s name', required: false },
                    phone: { label: 'Phone Number', description: 'For direct contact', required: false },
                    company: { label: 'Company Name', description: 'For B2B leads', required: false },
                  }).map(([field, info]) => (
                    <div
                      key={field}
                      className={`funnel-publish-lead-field ${settings.leadFields[field] ? 'funnel-publish-lead-field--enabled' : ''}`}
                    >
                      <div className="funnel-publish-lead-field__info">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className="funnel-publish-lead-field__label">{info.label}</span>
                          {info.required && (
                            <span className="funnel-publish-lead-field__required">Required</span>
                          )}
                        </div>
                        <p className="funnel-publish-lead-field__description">{info.description}</p>
                      </div>
                      <Checkbox
                        checked={settings.leadFields[field]}
                        onChange={() => handleToggleLeadField(field)}
                        disabled={field === 'email'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SEO Meta */}
            <div className="funnel-publish-card">
              <div className="funnel-publish-card__header">
                <h2 className="funnel-publish-card__title">
                  <div className="funnel-publish-card__title-icon">
                    <SearchIcon />
                  </div>
                  SEO Settings
                </h2>
              </div>
              <div className="funnel-publish-card__body">
                <div className="funnel-publish-seo">
                  <div className="funnel-publish-seo__preview">
                    <h3 className="funnel-publish-seo__preview-title">
                      {settings.seo.title || funnel?.name}
                    </h3>
                    <p className="funnel-publish-seo__preview-url">{publicUrl}</p>
                    <p className="funnel-publish-seo__preview-description">
                      {settings.seo.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="funnel-publish-seo__form-group">
                    <label className="funnel-publish-seo__label">
                      Meta Title
                      <span className={`funnel-publish-seo__char-count ${seoTitleLength > 60 ? 'funnel-publish-seo__char-count--error' : seoTitleLength > 50 ? 'funnel-publish-seo__char-count--warning' : ''}`}>
                        {seoTitleLength}/60
                      </span>
                    </label>
                    <Input
                      value={settings.seo.title}
                      onChange={(e) => handleSEOChange('title', e.target.value)}
                      placeholder="Enter SEO title"
                      maxLength={60}
                    />
                    <p className="funnel-publish-seo__hint">
                      Recommended: 50-60 characters
                    </p>
                  </div>

                  <div className="funnel-publish-seo__form-group">
                    <label className="funnel-publish-seo__label">
                      Meta Description
                      <span className={`funnel-publish-seo__char-count ${seoDescriptionLength > 160 ? 'funnel-publish-seo__char-count--error' : seoDescriptionLength > 150 ? 'funnel-publish-seo__char-count--warning' : ''}`}>
                        {seoDescriptionLength}/160
                      </span>
                    </label>
                    <Textarea
                      value={settings.seo.description}
                      onChange={(e) => handleSEOChange('description', e.target.value)}
                      placeholder="Enter SEO description"
                      rows={3}
                      maxLength={160}
                    />
                    <p className="funnel-publish-seo__hint">
                      Recommended: 150-160 characters
                    </p>
                  </div>

                  <div className="funnel-publish-seo__form-group">
                    <label className="funnel-publish-seo__label">Keywords</label>
                    <Input
                      value={settings.seo.keywords}
                      onChange={(e) => handleSEOChange('keywords', e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                    <p className="funnel-publish-seo__hint">
                      Separate keywords with commas
                    </p>
                  </div>

                  <div className="funnel-publish-seo__form-group">
                    <label className="funnel-publish-seo__label">OG Image URL</label>
                    <Input
                      value={settings.seo.ogImage}
                      onChange={(e) => handleSEOChange('ogImage', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="funnel-publish-seo__hint">
                      Recommended: 1200x630px
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Redirect Settings */}
            <div className="funnel-publish-card">
              <div className="funnel-publish-card__header">
                <h2 className="funnel-publish-card__title">
                  <div className="funnel-publish-card__title-icon">
                    <ExternalLinkIcon />
                  </div>
                  Redirect After Completion
                </h2>
              </div>
              <div className="funnel-publish-card__body">
                <div className="funnel-publish-redirect">
                  <div className="funnel-publish-redirect__info">
                    <div className="funnel-publish-redirect__info-icon">
                      <InformationIcon />
                    </div>
                    <p className="funnel-publish-redirect__info-text">
                      Redirect users to a custom URL after they complete the funnel. Leave empty to show the default thank you page.
                    </p>
                  </div>
                  <Input
                    value={settings.redirectUrl}
                    onChange={(e) => setSettings((prev) => ({ ...prev, redirectUrl: e.target.value }))}
                    placeholder="https://example.com/thank-you"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="funnel-publish-sidebar">
            {/* QR Code */}
            <div className="funnel-publish-card">
              <div className="funnel-publish-card__header">
                <h2 className="funnel-publish-card__title">
                  <div className="funnel-publish-card__title-icon">
                    <QrCodeIcon />
                  </div>
                  QR Code
                </h2>
              </div>
              <div className="funnel-publish-card__body">
                <div className="funnel-publish-qr">
                  <div className="funnel-publish-qr__canvas">
                    <canvas ref={qrCanvasRef} />
                  </div>
                  <div className="funnel-publish-qr__actions">
                    <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                      <DownloadIcon /> Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="funnel-publish-card">
              <div className="funnel-publish-card__header">
                <h2 className="funnel-publish-card__title">
                  <div className="funnel-publish-card__title-icon">
                    <ChartIcon />
                  </div>
                  Summary
                </h2>
              </div>
              <div className="funnel-publish-card__body">
                <div className="funnel-publish-summary">
                  <div className="funnel-publish-summary__item">
                    <div className="funnel-publish-summary__item-icon">
                      <CheckIcon />
                    </div>
                    <div className="funnel-publish-summary__item-content">
                      <div className="funnel-publish-summary__item-label">Status</div>
                      <div className={`funnel-publish-summary__status funnel-publish-summary__status--${settings.status === 'active' ? 'published' : 'draft'}`}>
                        <span className="funnel-publish-summary__status-dot" />
                        {settings.status === 'active' ? 'Published' : 'Draft'}
                      </div>
                    </div>
                  </div>

                  <div className="funnel-publish-summary__item">
                    <div className="funnel-publish-summary__item-icon">
                      <UserIcon />
                    </div>
                    <div className="funnel-publish-summary__item-content">
                      <div className="funnel-publish-summary__item-label">Lead Fields</div>
                      <div className="funnel-publish-summary__item-value">
                        {Object.values(settings.leadFields).filter(Boolean).length} fields
                      </div>
                    </div>
                  </div>

                  <div className="funnel-publish-summary__item">
                    <div className="funnel-publish-summary__item-icon">
                      <CalendarIcon />
                    </div>
                    <div className="funnel-publish-summary__item-content">
                      <div className="funnel-publish-summary__item-label">Created</div>
                      <div className="funnel-publish-summary__item-value">
                        {funnel?.createdAt ? new Date(funnel.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="funnel-publish-modal" onClick={() => setShowPublishModal(false)}>
          <div className="funnel-publish-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="funnel-publish-modal__header">
              <h3 className="funnel-publish-modal__title">Publish Funnel?</h3>
            </div>
            <div className="funnel-publish-modal__body">
              <p>
                Are you sure you want to publish this funnel? It will be accessible to the public at:
              </p>
              <p style={{ marginTop: '1rem', fontFamily: 'monospace', background: '#f3f4f6', padding: '0.75rem', borderRadius: '6px', wordBreak: 'break-all' }}>
                {publicUrl}
              </p>
            </div>
            <div className="funnel-publish-modal__footer">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowPublishModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handlePublish}
                disabled={saving}
              >
                {saving ? 'Publishing...' : 'Publish Now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

FunnelPublishPage.propTypes = {
  className: PropTypes.string,
};

export default FunnelPublishPage;
export { FunnelPublishPage };
