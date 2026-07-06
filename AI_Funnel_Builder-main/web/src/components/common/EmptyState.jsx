// =============================================================================
// AI FUNNEL PLATFORM - EmptyState Component (Self-Contained)
// =============================================================================
// Empty state with icon, message, actions, and illustration support
// Depends on: Button component from UI library
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../ui';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const EMPTY_STATE_STYLES = `
/* Empty State Container */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  min-height: 400px;
}

.empty-state--compact {
  padding: 2rem 1rem;
  min-height: 300px;
}

.empty-state--full-height {
  min-height: calc(100vh - 200px);
}

/* Icon Container */
.empty-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: 1.5rem;
  background-color: #f3f4f6;
  border-radius: 50%;
  color: #9ca3af;
}

.empty-state__icon svg {
  width: 40px;
  height: 40px;
}

.empty-state--primary .empty-state__icon {
  background-color: #dbeafe;
  color: #3b82f6;
}

.empty-state--success .empty-state__icon {
  background-color: #d1fae5;
  color: #10b981;
}

.empty-state--warning .empty-state__icon {
  background-color: #fef3c7;
  color: #f59e0b;
}

.empty-state--danger .empty-state__icon {
  background-color: #fee2e2;
  color: #ef4444;
}

.empty-state--info .empty-state__icon {
  background-color: #dbeafe;
  color: #3b82f6;
}

/* Icon Sizes */
.empty-state--sm .empty-state__icon {
  width: 64px;
  height: 64px;
}

.empty-state--sm .empty-state__icon svg {
  width: 32px;
  height: 32px;
}

.empty-state--lg .empty-state__icon {
  width: 96px;
  height: 96px;
}

.empty-state--lg .empty-state__icon svg {
  width: 48px;
  height: 48px;
}

/* Illustration */
.empty-state__illustration {
  max-width: 400px;
  width: 100%;
  height: auto;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.empty-state--compact .empty-state__illustration {
  max-width: 300px;
  margin-bottom: 1.5rem;
}

.empty-state--lg .empty-state__illustration {
  max-width: 500px;
}

/* Content */
.empty-state__content {
  max-width: 480px;
  width: 100%;
}

.empty-state--compact .empty-state__content {
  max-width: 400px;
}

.empty-state--lg .empty-state__content {
  max-width: 560px;
}

/* Title */
.empty-state__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
  margin: 0 0 0.75rem 0;
}

.empty-state--sm .empty-state__title {
  font-size: 1.25rem;
}

.empty-state--lg .empty-state__title {
  font-size: 1.75rem;
}

/* Description */
.empty-state__description {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.empty-state--sm .empty-state__description {
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.empty-state--lg .empty-state__description {
  font-size: 1.125rem;
  margin-bottom: 2.5rem;
}

/* Actions */
.empty-state__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.empty-state__actions--vertical {
  flex-direction: column;
}

.empty-state__actions--vertical button,
.empty-state__actions--vertical a {
  width: 100%;
  max-width: 280px;
}

/* Secondary Content */
.empty-state__secondary {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.empty-state--compact .empty-state__secondary {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
}

/* Links */
.empty-state__link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.15s ease-in-out;
}

.empty-state__link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.empty-state__link svg {
  width: 1rem;
  height: 1rem;
}

/* Help Text */
.empty-state__help {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-top: 1rem;
}

/* Feature List */
.empty-state__features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
  text-align: left;
}

.empty-state__feature {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.empty-state__feature-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: #3b82f6;
}

.empty-state__feature-icon svg {
  width: 100%;
  height: 100%;
}

.empty-state__feature-content {
  flex: 1;
}

.empty-state__feature-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.empty-state__feature-description {
  font-size: 0.813rem;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}

/* Search Variant */
.empty-state--search .empty-state__icon {
  background-color: #f9fafb;
  border: 2px dashed #d1d5db;
}

/* Error Variant */
.empty-state--error .empty-state__icon {
  background-color: #fee2e2;
  color: #ef4444;
}

/* Bordered */
.empty-state--bordered {
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  background-color: #f9fafb;
}

/* Loading State */
.empty-state--loading {
  opacity: 0.6;
  pointer-events: none;
}

.empty-state__loader {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.empty-state__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: empty-state-spin 0.6s linear infinite;
}

@keyframes empty-state-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .empty-state {
    padding: 2rem 1rem;
    min-height: 350px;
  }
  
  .empty-state__icon {
    width: 64px;
    height: 64px;
  }
  
  .empty-state__icon svg {
    width: 32px;
    height: 32px;
  }
  
  .empty-state__title {
    font-size: 1.25rem;
  }
  
  .empty-state__description {
    font-size: 0.875rem;
  }
  
  .empty-state__illustration {
    max-width: 280px;
  }
  
  .empty-state__features {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .empty-state__actions {
    flex-direction: column;
    width: 100%;
  }
  
  .empty-state__actions button,
  .empty-state__actions a {
    width: 100%;
  }
}

/* Dark Mode */
.dark .empty-state__icon {
  background-color: #374151;
  color: #9ca3af;
}

.dark .empty-state--primary .empty-state__icon {
  background-color: #1e3a5f;
  color: #60a5fa;
}

.dark .empty-state--success .empty-state__icon {
  background-color: #064e3b;
  color: #34d399;
}

.dark .empty-state--warning .empty-state__icon {
  background-color: #78350f;
  color: #fbbf24;
}

.dark .empty-state--danger .empty-state__icon {
  background-color: #7f1d1d;
  color: #f87171;
}

.dark .empty-state__title {
  color: #f3f4f6;
}

.dark .empty-state__description {
  color: #9ca3af;
}

.dark .empty-state__secondary {
  border-top-color: #374151;
}

.dark .empty-state__link {
  color: #60a5fa;
}

.dark .empty-state__link:hover {
  color: #93c5fd;
}

.dark .empty-state__help {
  color: #6b7280;
}

.dark .empty-state__feature-title {
  color: #f3f4f6;
}

.dark .empty-state__feature-description {
  color: #9ca3af;
}

.dark .empty-state--bordered {
  border-color: #374151;
  background-color: #1f2937;
}

.dark .empty-state--search .empty-state__icon {
  background-color: #1f2937;
  border-color: #4b5563;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .empty-state__link,
  .empty-state__spinner {
    animation: none !important;
    transition: none !important;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'empty-state');
  styleElement.textContent = EMPTY_STATE_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// DEFAULT ICONS
// =============================================================================

const DefaultIcons = {
  inbox: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  search: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  folder: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  document: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  database: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  error: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  plus: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  check: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
};

const ArrowRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

const EmptyState = ({
  // Content
  title,
  description,
  icon,
  iconVariant = 'default',
  illustration,
  
  // Actions
  primaryAction,
  secondaryAction,
  actions,
  actionsLayout = 'horizontal',
  
  // Links
  link,
  linkText,
  onLinkClick,
  
  // Features
  features,
  
  // Help Text
  helpText,
  
  // Secondary Content
  secondaryContent,
  
  // Styling
  size = 'md',
  variant = 'default',
  bordered = false,
  compact = false,
  fullHeight = false,
  
  // Loading
  loading = false,
  loadingText = 'Loading...',
  
  // Accessibility
  role = 'status',
  ariaLabel,
  
  className = '',
  children,
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const emptyStateClasses = [
    'empty-state',
    `empty-state--${size}`,
    `empty-state--${variant}`,
    bordered && 'empty-state--bordered',
    compact && 'empty-state--compact',
    fullHeight && 'empty-state--full-height',
    loading && 'empty-state--loading',
    className,
  ].filter(Boolean).join(' ');

  const actionsClasses = [
    'empty-state__actions',
    actionsLayout === 'vertical' && 'empty-state__actions--vertical',
  ].filter(Boolean).join(' ');

  // Render icon or illustration
  const renderVisual = () => {
    if (illustration) {
      return (
        <img
          src={illustration}
          alt=""
          className="empty-state__illustration"
          loading="lazy"
        />
      );
    }

    if (icon) {
      return (
        <div className="empty-state__icon">
          {typeof icon === 'string' ? DefaultIcons[icon] || DefaultIcons.inbox : icon}
        </div>
      );
    }

    return null;
  };

  // Render actions
  const renderActions = () => {
    if (actions) {
      return <div className={actionsClasses}>{actions}</div>;
    }

    if (!primaryAction && !secondaryAction) {
      return null;
    }

    return (
      <div className={actionsClasses}>
        {secondaryAction}
        {primaryAction}
      </div>
    );
  };

  // Render link
  const renderLink = () => {
    if (!link && !linkText && !onLinkClick) return null;

    return (
      <a
        href={link}
        onClick={(e) => {
          if (onLinkClick) {
            e.preventDefault();
            onLinkClick();
          }
        }}
        className="empty-state__link"
      >
        {linkText || 'Learn more'}
        <ArrowRightIcon />
      </a>
    );
  };

  // Render features
  const renderFeatures = () => {
    if (!features?.length) return null;

    return (
      <div className="empty-state__features">
        {features.map((feature, index) => (
          <div key={index} className="empty-state__feature">
            <div className="empty-state__feature-icon">
              {feature.icon || DefaultIcons.check}
            </div>
            <div className="empty-state__feature-content">
              <h4 className="empty-state__feature-title">{feature.title}</h4>
              {feature.description && (
                <p className="empty-state__feature-description">
                  {feature.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={emptyStateClasses}
      role={role}
      aria-label={ariaLabel || title}
      {...props}
    >
      {/* Loading State */}
      {loading && (
        <div className="empty-state__loader">
          <div className="empty-state__spinner" />
          <span>{loadingText}</span>
        </div>
      )}

      {/* Visual (Icon or Illustration) */}
      {!loading && renderVisual()}

      {/* Content */}
      <div className="empty-state__content">
        {title && <h3 className="empty-state__title">{title}</h3>}
        {description && <p className="empty-state__description">{description}</p>}

        {/* Actions */}
        {!loading && renderActions()}

        {/* Link */}
        {!loading && renderLink()}

        {/* Help Text */}
        {helpText && <p className="empty-state__help">{helpText}</p>}

        {/* Features */}
        {!loading && renderFeatures()}

        {/* Custom Children */}
        {children}
      </div>

      {/* Secondary Content */}
      {secondaryContent && (
        <div className="empty-state__secondary">
          {secondaryContent}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

EmptyState.propTypes = {
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  icon: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.oneOf(['inbox', 'search', 'folder', 'document', 'database', 'error', 'plus']),
  ]),
  iconVariant: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'danger', 'info']),
  illustration: PropTypes.string,
  primaryAction: PropTypes.node,
  secondaryAction: PropTypes.node,
  actions: PropTypes.node,
  actionsLayout: PropTypes.oneOf(['horizontal', 'vertical']),
  link: PropTypes.string,
  linkText: PropTypes.string,
  onLinkClick: PropTypes.func,
  features: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
    })
  ),
  helpText: PropTypes.node,
  secondaryContent: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'danger', 'info', 'search', 'error']),
  bordered: PropTypes.bool,
  compact: PropTypes.bool,
  fullHeight: PropTypes.bool,
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  role: PropTypes.string,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default EmptyState;
export { EmptyState, DefaultIcons };