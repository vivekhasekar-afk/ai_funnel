// =============================================================================
// AI FUNNEL PLATFORM - AIToolsPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  generateAdCopy, 
  generateFollowUp, 
  suggestImprovements,
  getAICredits 
} from '../../../api/ai.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const AI_TOOLS_STYLES = `
/* AI Tools Container */
.ai-tools-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%);
  padding: 2rem;
}

.ai-tools__container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.ai-tools__header {
  margin-bottom: 3rem;
  text-align: center;
}

.ai-tools__title {
  font-size: 3rem;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 1rem 0;
  letter-spacing: -0.03em;
}

.ai-tools__subtitle {
  font-size: 1.25rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

/* Credits Display */
.ai-credits-card {
  display: inline-flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.3);
  color: #ffffff;
  animation: fadeInScale 0.6s ease;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.ai-credits__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  backdrop-filter: blur(10px);
}

.ai-credits__icon svg {
  width: 32px;
  height: 32px;
}

.ai-credits__info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ai-credits__label {
  font-size: 0.875rem;
  font-weight: 600;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ai-credits__value {
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
}

.ai-credits__usage {
  font-size: 0.813rem;
  opacity: 0.8;
}

/* Tools Grid */
.ai-tools__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

/* Tool Card */
.ai-tool-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-tool-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.ai-tool-card__header {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
}

.ai-tool-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.ai-tool-card__icon svg {
  width: 32px;
  height: 32px;
  color: #ffffff;
}

.ai-tool-card__content {
  flex: 1;
}

.ai-tool-card__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.ai-tool-card__description {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.ai-tool-card__body {
  margin-bottom: 1.5rem;
}

/* Form Elements */
.ai-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.ai-form-label {
  font-size: 0.938rem;
  font-weight: 700;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ai-form-required {
  color: #ef4444;
}

.ai-form-input,
.ai-form-textarea,
.ai-form-select {
  width: 100%;
  padding: 1rem 1.25rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  color: #111827;
  font-family: inherit;
  transition: all 0.3s ease;
}

.ai-form-input:focus,
.ai-form-textarea:focus,
.ai-form-select:focus {
  outline: none;
  background: #ffffff;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.ai-form-textarea {
  min-height: 120px;
  resize: vertical;
}

.ai-form-input::placeholder,
.ai-form-textarea::placeholder {
  color: #9ca3af;
}

.ai-form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 3rem;
}

.ai-form-hint {
  font-size: 0.813rem;
  color: #9ca3af;
  margin-top: -0.5rem;
}

/* Loading State */
.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  gap: 1.5rem;
}

.ai-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ai-loading__text {
  font-size: 1rem;
  font-weight: 600;
  color: #6b7280;
  text-align: center;
}

/* Result Display */
.ai-result {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border: 2px solid #e0e7ff;
  border-radius: 16px;
  animation: fadeInSlide 0.5s ease;
}

@keyframes fadeInSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-result__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.ai-result__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #667eea;
  border-radius: 8px;
  color: #ffffff;
  flex-shrink: 0;
}

.ai-result__icon svg {
  width: 18px;
  height: 18px;
}

.ai-result__title {
  font-size: 1rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.ai-result__content {
  font-size: 0.938rem;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.ai-result__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ai-result__list-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #ffffff;
  border-radius: 12px;
  font-size: 0.938rem;
  color: #374151;
  line-height: 1.5;
}

.ai-result__list-item::before {
  content: '✨';
  font-size: 1.25rem;
  flex-shrink: 0;
}

.ai-result__actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

/* Error Display */
.ai-error {
  padding: 1.5rem;
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 16px;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.ai-error__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.ai-error__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #ef4444;
  border-radius: 8px;
  color: #ffffff;
  flex-shrink: 0;
}

.ai-error__icon svg {
  width: 18px;
  height: 18px;
}

.ai-error__title {
  font-size: 1rem;
  font-weight: 800;
  color: #991b1b;
  margin: 0;
}

.ai-error__message {
  font-size: 0.938rem;
  color: #991b1b;
  margin: 0;
  line-height: 1.5;
}

/* Buttons */
.ai-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.75rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: none;
  font-family: inherit;
}

.ai-btn svg {
  width: 20px;
  height: 20px;
}

.ai-btn--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.ai-btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.ai-btn--primary:active:not(:disabled) {
  transform: translateY(0);
}

.ai-btn--secondary {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.ai-btn--secondary:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.ai-btn--full {
  width: 100%;
}

.ai-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-btn--icon-only {
  padding: 0.75rem;
}

/* Empty State */
.ai-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.ai-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: #f3f4f6;
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.ai-empty__icon svg {
  width: 40px;
  height: 40px;
  color: #9ca3af;
}

.ai-empty__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.ai-empty__message {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .ai-tools__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .ai-tools-page {
    padding: 1.5rem 1rem;
  }

  .ai-tools__title {
    font-size: 2rem;
  }

  .ai-tools__subtitle {
    font-size: 1rem;
  }

  .ai-credits-card {
    flex-direction: column;
    text-align: center;
  }

  .ai-tool-card {
    padding: 1.5rem;
  }

  .ai-result__actions {
    flex-direction: column;
  }

  .ai-btn {
    width: 100%;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .ai-tool-card,
  .ai-result,
  .ai-loading__spinner,
  .ai-credits-card {
    animation: none !important;
  }
  
  .ai-tool-card:hover,
  .ai-btn--primary:hover {
    transform: none;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'ai-tools-page');
  styleElement.textContent = AI_TOOLS_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const SparklesIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const LightBulbIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const MailIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CopyIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const RefreshIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CreditCardIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const AdCopyGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    platform: 'facebook',
    tone: 'professional',
    targetAudience: '',
  });

  const handleGenerate = async () => {
    if (!formData.productName || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await generateAdCopy({
        product_name: formData.productName,
        description: formData.description,
        platform: formData.platform,
        tone: formData.tone,
        target_audience: formData.targetAudience,
      });
      setResult(response);
    } catch (err) {
      console.error('Failed to generate ad copy:', err);
      setError(err.message || 'Failed to generate ad copy');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="ai-tool-card">
      <div className="ai-tool-card__header">
        <div className="ai-tool-card__icon">
          <SparklesIcon />
        </div>
        <div className="ai-tool-card__content">
          <h3 className="ai-tool-card__title">Generate Ad Copy</h3>
          <p className="ai-tool-card__description">
            Create compelling marketing copy for multiple platforms
          </p>
        </div>
      </div>

      <div className="ai-tool-card__body">
        <div className="ai-form-group">
          <label className="ai-form-label">
            Product/Service Name
            <span className="ai-form-required">*</span>
          </label>
          <input
            type="text"
            className="ai-form-input"
            placeholder="e.g., AI Funnel Builder"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
          />
        </div>

        <div className="ai-form-group">
          <label className="ai-form-label">
            Description
            <span className="ai-form-required">*</span>
          </label>
          <textarea
            className="ai-form-textarea"
            placeholder="Describe your product, key benefits, and unique selling points..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="ai-form-group">
          <label className="ai-form-label">Platform</label>
          <select
            className="ai-form-select"
            value={formData.platform}
            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
          >
            <option value="facebook">Facebook</option>
            <option value="google">Google Ads</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter</option>
          </select>
        </div>

        <div className="ai-form-group">
          <label className="ai-form-label">Tone</label>
          <select
            className="ai-form-select"
            value={formData.tone}
            onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
            <option value="authoritative">Authoritative</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="ai-form-group">
          <label className="ai-form-label">Target Audience</label>
          <input
            type="text"
            className="ai-form-input"
            placeholder="e.g., Small business owners, Marketers"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
          />
          <span className="ai-form-hint">Optional: Specify your target demographic</span>
        </div>

        {loading && (
          <div className="ai-loading">
            <div className="ai-loading__spinner" />
            <div className="ai-loading__text">Generating ad copy...</div>
          </div>
        )}

        {result && (
          <div className="ai-result">
            <div className="ai-result__header">
              <div className="ai-result__icon">
                <CheckCircleIcon />
              </div>
              <h4 className="ai-result__title">Generated Ad Copy</h4>
            </div>
            <div className="ai-result__content">{result.ad_copy || result.text}</div>
            <div className="ai-result__actions">
              <button
                className="ai-btn ai-btn--secondary"
                onClick={() => copyToClipboard(result.ad_copy || result.text)}
              >
                <CopyIcon />
                Copy
              </button>
              <button className="ai-btn ai-btn--secondary" onClick={handleGenerate}>
                <RefreshIcon />
                Regenerate
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="ai-error">
            <div className="ai-error__header">
              <div className="ai-error__icon">
                <AlertCircleIcon />
              </div>
              <h4 className="ai-error__title">Error</h4>
            </div>
            <p className="ai-error__message">{error}</p>
          </div>
        )}
      </div>

      <div className="ai-tool-card__footer">
        <button
          className="ai-btn ai-btn--primary ai-btn--full"
          onClick={handleGenerate}
          disabled={loading || !formData.productName || !formData.description}
        >
          <SparklesIcon />
          Generate Ad Copy
        </button>
      </div>
    </div>
  );
};

const HeadlineOptimizer = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    headline: '',
    context: '',
    goal: 'engagement',
  });

  const handleOptimize = async () => {
    if (!formData.headline) {
      setError('Please enter a headline to optimize');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await suggestImprovements({
        funnel_id: null,
        content: formData.headline,
        context: formData.context,
        optimization_goal: formData.goal,
      });
      setResult(response);
    } catch (err) {
      console.error('Failed to optimize headline:', err);
      setError(err.message || 'Failed to optimize headline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-tool-card">
      <div className="ai-tool-card__header">
        <div className="ai-tool-card__icon">
          <LightBulbIcon />
        </div>
        <div className="ai-tool-card__content">
          <h3 className="ai-tool-card__title">Optimize Headlines</h3>
          <p className="ai-tool-card__description">
            Improve your headlines for better engagement and conversions
          </p>
        </div>
      </div>

      <div className="ai-tool-card__body">
        <div className="ai-form-group">
          <label className="ai-form-label">
            Current Headline
            <span className="ai-form-required">*</span>
          </label>
          <textarea
            className="ai-form-textarea"
            placeholder="Enter your headline to optimize..."
            value={formData.headline}
            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
          />
        </div>

        <div className="ai-form-group">
          <label className="ai-form-label">Context (Optional)</label>
          <input
            type="text"
            className="ai-form-input"
            placeholder="e.g., Landing page for SaaS product"
            value={formData.context}
            onChange={(e) => setFormData({ ...formData, context: e.target.value })}
          />
        </div>

        <div className="ai-form-group">
          <label className="ai-form-label">Optimization Goal</label>
          <select
            className="ai-form-select"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
          >
            <option value="engagement">Engagement</option>
            <option value="conversion">Conversion</option>
            <option value="clarity">Clarity</option>
            <option value="click_through">Click-through Rate</option>
          </select>
        </div>

        {loading && (
          <div className="ai-loading">
            <div className="ai-loading__spinner" />
            <div className="ai-loading__text">Optimizing headline...</div>
          </div>
        )}

        {result && result.suggestions && (
          <div className="ai-result">
            <div className="ai-result__header">
              <div className="ai-result__icon">
                <CheckCircleIcon />
              </div>
              <h4 className="ai-result__title">Optimization Suggestions</h4>
            </div>
            <ul className="ai-result__list">
              {result.suggestions.map((suggestion, index) => (
                <li key={index} className="ai-result__list-item">
                  {suggestion.suggestion || suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="ai-error">
            <div className="ai-error__header">
              <div className="ai-error__icon">
                <AlertCircleIcon />
              </div>
              <h4 className="ai-error__title">Error</h4>
            </div>
            <p className="ai-error__message">{error}</p>
          </div>
        )}
      </div>

      <div className="ai-tool-card__footer">
        <button
          className="ai-btn ai-btn--primary ai-btn--full"
          onClick={handleOptimize}
          disabled={loading || !formData.headline}
        >
          <LightBulbIcon />
          Optimize Headline
        </button>
      </div>
    </div>
  );
};

const FollowUpEmailGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    leadInfo: '',
    sequenceType: 'nurture',
    emailCount: 3,
  });

  const handleGenerate = async () => {
    if (!formData.leadInfo) {
      setError('Please provide lead information');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await generateFollowUp({
        lead_info: formData.leadInfo,
        sequence_type: formData.sequenceType,
        email_count: formData.emailCount,
      });
      setResult(response);
    } catch (err) {
      console.error('Failed to generate follow-up:', err);
      setError(err.message || 'Failed to generate follow-up emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-tool-card">
      <div className="ai-tool-card__header">
        <div className="ai-tool-card__icon">
          <MailIcon />
        </div>
        <div className="ai-tool-card__content">
          <h3 className="ai-tool-card__title">Follow-up Emails</h3>
          <p className="ai-tool-card__description">
            Generate personalized email sequences for your leads
          </p>
        </div>
      </div>

      <div className="ai-tool-card__body">
        <div className="ai-form-group">
          <label className="ai-form-label">
            Lead Information
            <span className="ai-form-required">*</span>
          </label>
          <textarea
            className="ai-form-textarea"
            placeholder="Describe your lead: industry, pain points, interests..."
            value={formData.leadInfo}
            onChange={(e) => setFormData({ ...formData, leadInfo: e.target.value })}
          />
        </div>

        <div className="ai-form-group">
          <label className="ai-form-label">Sequence Type</label>
          <select
            className="ai-form-select"
            value={formData.sequenceType}
            onChange={(e) => setFormData({ ...formData, sequenceType: e.target.value })}
          >
            <option value="nurture">Nurture</option>
            <option value="sales">Sales</option>
            <option value="onboarding">Onboarding</option>
            <option value="re_engagement">Re-engagement</option>
          </select>
        </div>

        <div className="ai-form-group">
          <label className="ai-form-label">Number of Emails</label>
          <select
            className="ai-form-select"
            value={formData.emailCount}
            onChange={(e) => setFormData({ ...formData, emailCount: parseInt(e.target.value) })}
          >
            <option value={3}>3 Emails</option>
            <option value={5}>5 Emails</option>
            <option value={7}>7 Emails</option>
          </select>
        </div>

        {loading && (
          <div className="ai-loading">
            <div className="ai-loading__spinner" />
            <div className="ai-loading__text">Generating email sequence...</div>
          </div>
        )}

        {result && result.emails && (
          <div className="ai-result">
            <div className="ai-result__header">
              <div className="ai-result__icon">
                <CheckCircleIcon />
              </div>
              <h4 className="ai-result__title">{result.emails.length} Emails Generated</h4>
            </div>
            <ul className="ai-result__list">
              {result.emails.map((email, index) => (
                <li key={index} className="ai-result__list-item">
                  <strong>Email {index + 1}:</strong> {email.subject || email}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="ai-error">
            <div className="ai-error__header">
              <div className="ai-error__icon">
                <AlertCircleIcon />
              </div>
              <h4 className="ai-error__title">Error</h4>
            </div>
            <p className="ai-error__message">{error}</p>
          </div>
        )}
      </div>

      <div className="ai-tool-card__footer">
        <button
          className="ai-btn ai-btn--primary ai-btn--full"
          onClick={handleGenerate}
          disabled={loading || !formData.leadInfo}
        >
          <MailIcon />
          Generate Follow-up Sequence
        </button>
      </div>
    </div>
  );
};

const StrategyGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    businessGoal: '',
    industry: '',
    budget: '',
  });

  const handleGenerate = async () => {
    if (!formData.businessGoal) {
      setError('Please describe your business goal');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await suggestImprovements({
        funnel_id: null,
        content: `Business Goal: ${formData.businessGoal}. Industry: ${formData.industry}. Budget: ${formData.budget}`,
        context: 'strategy',
        optimization_goal: 'conversion',
      });
      setResult(response);
    } catch (err) {
      console.error('Failed to generate strategy:', err);
      setError(err.message || 'Failed to generate strategy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-tool-card">
      <div className="ai-tool-card__header">
        <div className="ai-tool-card__icon">
          <ChartBarIcon />
        </div>
        <div className="ai-tool-card__content">
          <h3 className="ai-tool-card__title">Strategy Suggestions</h3>
          <p className="ai-tool-card__description">
            Get AI-powered marketing strategy recommendations
          </p>
        </div>
      </div>

      <div className="ai-tool-card__body">
        <div className="ai-form-group">
          <label className="ai-form-label">
            Business Goal
            <span className="ai-form-required">*</span>
          </label>
          <textarea
            className="ai-form-textarea"
            placeholder="What are you trying to achieve? e.g., Increase lead generation by 50%"
            value={formData.businessGoal}
            onChange={(e) => setFormData({ ...formData, businessGoal: e.target.value })}
          />
        </div>

        <div className="ai-form-group">
          <label className="ai-form-label">Industry</label>
          <input
            type="text"
            className="ai-form-input"
            placeholder="e.g., SaaS, E-commerce, Consulting"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          />
        </div>

        <div className="ai-form-group">
          <label className="ai-form-label">Budget Range</label>
          <select
            className="ai-form-select"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
          >
            <option value="">Select budget range</option>
            <option value="under_1k">Under $1,000</option>
            <option value="1k_5k">$1,000 - $5,000</option>
            <option value="5k_10k">$5,000 - $10,000</option>
            <option value="10k_50k">$10,000 - $50,000</option>
            <option value="over_50k">Over $50,000</option>
          </select>
        </div>

        {loading && (
          <div className="ai-loading">
            <div className="ai-loading__spinner" />
            <div className="ai-loading__text">Generating strategy...</div>
          </div>
        )}

        {result && result.suggestions && (
          <div className="ai-result">
            <div className="ai-result__header">
              <div className="ai-result__icon">
                <CheckCircleIcon />
              </div>
              <h4 className="ai-result__title">Strategy Recommendations</h4>
            </div>
            <ul className="ai-result__list">
              {result.suggestions.map((suggestion, index) => (
                <li key={index} className="ai-result__list-item">
                  {suggestion.suggestion || suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="ai-error">
            <div className="ai-error__header">
              <div className="ai-error__icon">
                <AlertCircleIcon />
              </div>
              <h4 className="ai-error__title">Error</h4>
            </div>
            <p className="ai-error__message">{error}</p>
          </div>
        )}
      </div>

      <div className="ai-tool-card__footer">
        <button
          className="ai-btn ai-btn--primary ai-btn--full"
          onClick={handleGenerate}
          disabled={loading || !formData.businessGoal}
        >
          <ChartBarIcon />
          Generate Strategy
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const AIToolsPage = () => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const data = await getAICredits();
        setCredits(data);
      } catch (err) {
        console.error('Failed to fetch AI credits:', err);
      } finally {
        setLoadingCredits(false);
      }
    };

    fetchCredits();
  }, []);

  return (
    <div className="ai-tools-page">
      <div className="ai-tools__container">
        <div className="ai-tools__header">
          <h1 className="ai-tools__title">AI-Powered Tools</h1>
          <p className="ai-tools__subtitle">
            Supercharge your marketing with intelligent automation and optimization
          </p>

          {!loadingCredits && credits && (
            <div className="ai-credits-card">
              <div className="ai-credits__icon">
                <CreditCardIcon />
              </div>
              <div className="ai-credits__info">
                <div className="ai-credits__label">AI Credits</div>
                <div className="ai-credits__value">
                  {credits.credits_remaining || 0}
                </div>
                <div className="ai-credits__usage">
                  {credits.credits_used || 0} of {credits.credits_total || 0} used
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ai-tools__grid">
          <AdCopyGenerator />
          <HeadlineOptimizer />
          <FollowUpEmailGenerator />
          <StrategyGenerator />
        </div>
      </div>
    </div>
  );
};

AIToolsPage.propTypes = {};

export default AIToolsPage;
