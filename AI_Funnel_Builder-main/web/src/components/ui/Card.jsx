// =============================================================================
// AI FUNNEL PLATFORM - Card Component (Self-Contained)
// =============================================================================
// Versatile card component with header, footer, sections, and actions
// Depends on: Button component
// All styles included - no external CSS dependencies
// =============================================================================

import React, { forwardRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const CARD_STYLES = `
/* Card Base */
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.2s ease-in-out;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Card Variants */
.card--elevated {
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
}

.card--elevated:hover {
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.card--outlined {
  border: 2px solid #e5e7eb;
  box-shadow: none;
}

.card--flat {
  border: none;
  box-shadow: none;
}

.card--interactive {
  cursor: pointer;
  user-select: none;
}

.card--interactive:active {
  transform: scale(0.98);
}

.card--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-header--no-border {
  border-bottom: none;
}

.card-header--compact {
  padding: 1rem 1.25rem;
}

.card-header__content {
  flex: 1;
  min-width: 0;
}

.card-header__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
  margin: 0;
}

.card-header__subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
  margin-top: 0.25rem;
}

.card-header__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.card-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.card-header__icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* Card Body */
.card-body {
  flex: 1;
  padding: 1.5rem;
}

.card-body--compact {
  padding: 1rem 1.25rem;
}

.card-body--spacious {
  padding: 2rem;
}

.card-body--no-padding {
  padding: 0;
}

/* Card Section */
.card-section {
  padding: 1.5rem;
}

.card-section + .card-section {
  border-top: 1px solid #e5e7eb;
}

.card-section--compact {
  padding: 1rem 1.25rem;
}

.card-section__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Card Footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.card-footer--no-border {
  border-top: none;
}

.card-footer--no-background {
  background-color: transparent;
}

.card-footer--space-between {
  justify-content: space-between;
}

.card-footer--center {
  justify-content: center;
}

.card-footer--compact {
  padding: 0.75rem 1.25rem;
}

/* Card Image */
.card-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.card-image--cover {
  height: 200px;
  object-fit: cover;
}

.card-image--contain {
  height: 200px;
  object-fit: contain;
  background-color: #f3f4f6;
}

/* Card Badge */
.card-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1;
}

/* Card Overlay */
.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.5rem;
  color: #ffffff;
}

.card-overlay__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #ffffff;
}

.card-overlay__description {
  font-size: 0.875rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.9);
}

/* Card Loading */
.card--loading {
  position: relative;
  pointer-events: none;
}

.card__loader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  z-index: 10;
}

/* Card Divider */
.card-divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 0;
  border: none;
}

/* Card List */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.card-list__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  transition: background-color 0.15s ease-in-out;
}

.card-list__item:hover {
  background-color: #f9fafb;
}

.card-list__item + .card-list__item {
  border-top: 1px solid #e5e7eb;
}

.card-list__item--interactive {
  cursor: pointer;
}

.card-list__item--interactive:active {
  background-color: #f3f4f6;
}

/* Responsive */
@media (max-width: 640px) {
  .card-header,
  .card-body,
  .card-footer,
  .card-section {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .card-header {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
  
  .card-body {
    padding-top: 1.25rem;
    padding-bottom: 1.25rem;
  }
}

/* Dark Mode */
.dark .card {
  background-color: #1f2937;
  border-color: #374151;
}

.dark .card-header,
.dark .card-section + .card-section,
.dark .card-list__item + .card-list__item {
  border-color: #374151;
}

.dark .card-header__title {
  color: #f3f4f6;
}

.dark .card-header__subtitle {
  color: #9ca3af;
}

.dark .card-section__title {
  color: #e5e7eb;
}

.dark .card-footer {
  background-color: #111827;
  border-color: #374151;
}

.dark .card-list__item:hover {
  background-color: #374151;
}

.dark .card-list__item--interactive:active {
  background-color: #4b5563;
}

.dark .card-divider {
  background-color: #374151;
}

.dark .card__loader {
  background-color: rgba(31, 41, 55, 0.8);
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .card,
  .card--elevated,
  .card-list__item {
    transition: none;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'card');
  styleElement.textContent = CARD_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// CARD COMPONENT
// =============================================================================

const Card = forwardRef(({
  children,
  className = '',
  variant = 'default',
  interactive = false,
  disabled = false,
  loading = false,
  onClick,
  ...props
}, ref) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const cardClasses = [
    'card',
    `card--${variant}`,
    interactive && 'card--interactive',
    disabled && 'card--disabled',
    loading && 'card--loading',
    className,
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  return (
    <div
      ref={ref}
      className={cardClasses}
      onClick={interactive ? handleClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive && !disabled ? 0 : undefined}
      {...props}
    >
      {loading && (
        <div className="card__loader">
          <div className="spinner" />
        </div>
      )}
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// =============================================================================
// CARD HEADER
// =============================================================================

export const CardHeader = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  noBorder = false,
  compact = false,
  className = '',
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const headerClasses = [
    'card-header',
    noBorder && 'card-header--no-border',
    compact && 'card-header--compact',
    className,
  ].filter(Boolean).join(' ');

  if (children) {
    return <div className={headerClasses}>{children}</div>;
  }

  return (
    <div className={headerClasses}>
      <div className="card-header__content">
        <h3 className="card-header__title">
          {icon && <span className="card-header__icon">{icon}</span>}
          {title}
        </h3>
        {subtitle && <p className="card-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="card-header__actions">{actions}</div>}
    </div>
  );
};

// =============================================================================
// CARD BODY
// =============================================================================

export const CardBody = ({
  children,
  compact = false,
  spacious = false,
  noPadding = false,
  className = '',
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const bodyClasses = [
    'card-body',
    compact && 'card-body--compact',
    spacious && 'card-body--spacious',
    noPadding && 'card-body--no-padding',
    className,
  ].filter(Boolean).join(' ');

  return <div className={bodyClasses}>{children}</div>;
};

// =============================================================================
// CARD SECTION
// =============================================================================

export const CardSection = ({
  title,
  children,
  compact = false,
  className = '',
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const sectionClasses = [
    'card-section',
    compact && 'card-section--compact',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={sectionClasses}>
      {title && <h4 className="card-section__title">{title}</h4>}
      {children}
    </div>
  );
};

// =============================================================================
// CARD FOOTER
// =============================================================================

export const CardFooter = ({
  children,
  noBorder = false,
  noBackground = false,
  spaceBetween = false,
  center = false,
  compact = false,
  className = '',
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const footerClasses = [
    'card-footer',
    noBorder && 'card-footer--no-border',
    noBackground && 'card-footer--no-background',
    spaceBetween && 'card-footer--space-between',
    center && 'card-footer--center',
    compact && 'card-footer--compact',
    className,
  ].filter(Boolean).join(' ');

  return <div className={footerClasses}>{children}</div>;
};

// =============================================================================
// CARD IMAGE
// =============================================================================

export const CardImage = ({
  src,
  alt = '',
  fit = 'cover',
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const imageClasses = [
    'card-image',
    `card-image--${fit}`,
    className,
  ].filter(Boolean).join(' ');

  return <img src={src} alt={alt} className={imageClasses} {...props} />;
};

// =============================================================================
// CARD BADGE
// =============================================================================

export const CardBadge = ({ children, className = '' }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  return <div className={`card-badge ${className}`}>{children}</div>;
};

// =============================================================================
// CARD OVERLAY
// =============================================================================

export const CardOverlay = ({
  title,
  description,
  children,
  className = '',
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className={`card-overlay ${className}`}>
      {children || (
        <>
          {title && <h3 className="card-overlay__title">{title}</h3>}
          {description && <p className="card-overlay__description">{description}</p>}
        </>
      )}
    </div>
  );
};

// =============================================================================
// CARD DIVIDER
// =============================================================================

export const CardDivider = ({ className = '' }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  return <hr className={`card-divider ${className}`} />;
};

// =============================================================================
// CARD LIST
// =============================================================================

export const CardList = ({ children, className = '' }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  return <div className={`card-list ${className}`}>{children}</div>;
};

export const CardListItem = ({
  children,
  interactive = false,
  onClick,
  className = '',
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const itemClasses = [
    'card-list__item',
    interactive && 'card-list__item--interactive',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={itemClasses}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'flat']),
  interactive: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
};

CardHeader.propTypes = {
  title: PropTypes.node,
  subtitle: PropTypes.node,
  icon: PropTypes.node,
  actions: PropTypes.node,
  children: PropTypes.node,
  noBorder: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string,
};

CardBody.propTypes = {
  children: PropTypes.node.isRequired,
  compact: PropTypes.bool,
  spacious: PropTypes.bool,
  noPadding: PropTypes.bool,
  className: PropTypes.string,
};

CardSection.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  compact: PropTypes.bool,
  className: PropTypes.string,
};

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  noBorder: PropTypes.bool,
  noBackground: PropTypes.bool,
  spaceBetween: PropTypes.bool,
  center: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string,
};

CardImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  fit: PropTypes.oneOf(['cover', 'contain']),
  className: PropTypes.string,
};

CardBadge.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardOverlay.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

CardDivider.propTypes = {
  className: PropTypes.string,
};

CardList.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardListItem.propTypes = {
  children: PropTypes.node.isRequired,
  interactive: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

// =============================================================================
// EXPORTS
// =============================================================================

// ✅ ADD NAMED EXPORT
export { Card };

// Keep default export for backward compatibility
export default Card;
