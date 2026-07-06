// =============================================================================
// AI FUNNEL PLATFORM - PageHeader Component (Self-Contained)
// =============================================================================
// Page header with title, breadcrumbs, actions, filters, and responsive design
// Depends on: Button component from UI library
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, IconButton } from '../ui';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const PAGE_HEADER_STYLES = `
/* Page Header Container */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95);
}

.page-header--compact {
  padding: 1rem 1.5rem;
  gap: 1rem;
}

.page-header--bordered {
  border-bottom: 2px solid #e5e7eb;
}

.page-header--shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Breadcrumbs */
.page-header__breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  flex-wrap: wrap;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb__item {
  display: flex;
  align-items: center;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.15s ease-in-out;
}

.breadcrumb__item:hover {
  color: #3b82f6;
}

.breadcrumb__item--active {
  color: #111827;
  font-weight: 500;
  pointer-events: none;
}

.breadcrumb__separator {
  color: #d1d5db;
  user-select: none;
}

.breadcrumb__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.25rem;
}

.breadcrumb__icon svg {
  width: 1rem;
  height: 1rem;
}

/* Header Main Section */
.page-header__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
}

/* Title Section */
.page-header__title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.page-header__title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #f0f9ff;
  border-radius: 8px;
  color: #3b82f6;
  flex-shrink: 0;
}

.page-header__icon svg {
  width: 24px;
  height: 24px;
}

.page-header__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  margin: 0;
}

.page-header__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  line-height: 1;
}

.page-header__badge--primary {
  background-color: #dbeafe;
  color: #1e40af;
}

.page-header__badge--success {
  background-color: #d1fae5;
  color: #065f46;
}

.page-header__badge--warning {
  background-color: #fef3c7;
  color: #92400e;
}

.page-header__badge--danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.page-header__subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
  max-width: 600px;
}

/* Stats Section */
.page-header__stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.page-header__stat {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.page-header__stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.page-header__stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.page-header__stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.813rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

.page-header__stat-trend--up {
  color: #10b981;
}

.page-header__stat-trend--down {
  color: #ef4444;
}

.page-header__stat-trend svg {
  width: 1rem;
  height: 1rem;
}

/* Actions Section */
.page-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.page-header__actions--mobile {
  display: none;
}

/* Filters Section */
.page-header__filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
}

.page-header__filters--no-border {
  border-top: none;
  padding-top: 0;
}

.page-header__filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-header__filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

/* Search Bar */
.page-header__search {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.page-header__search-input {
  width: 100%;
  height: 40px;
  padding: 0 1rem 0 2.75rem;
  font-size: 0.875rem;
  color: #111827;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.15s ease-in-out;
  outline: none;
}

.page-header__search-input:hover {
  border-color: #d1d5db;
}

.page-header__search-input:focus {
  background-color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.page-header__search-input::placeholder {
  color: #9ca3af;
}

.page-header__search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
}

.page-header__search-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* Tabs */
.page-header__tabs {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border-bottom: 1px solid #e5e7eb;
  margin: -0.5rem -2rem 0;
  padding: 0 2rem;
}

.page-header__tab {
  position: relative;
  padding: 0.875rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  background-color: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  white-space: nowrap;
}

.page-header__tab:hover {
  color: #374151;
  background-color: #f9fafb;
}

.page-header__tab--active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.page-header__tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  margin-left: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #f3f4f6;
  color: #6b7280;
  border-radius: 9999px;
  line-height: 1;
}

.page-header__tab--active .page-header__tab-badge {
  background-color: #3b82f6;
  color: #ffffff;
}

/* Back Button */
.page-header__back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.15s ease-in-out;
  margin-bottom: 0.75rem;
}

.page-header__back:hover {
  color: #3b82f6;
}

.page-header__back svg {
  width: 1.125rem;
  height: 1.125rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .page-header__main {
    flex-direction: column;
    gap: 1rem;
  }
  
  .page-header__actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .page-header__stats {
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 1rem 1.25rem;
    gap: 1rem;
  }
  
  .page-header__title {
    font-size: 1.5rem;
  }
  
  .page-header__icon {
    width: 36px;
    height: 36px;
  }
  
  .page-header__icon svg {
    width: 20px;
    height: 20px;
  }
  
  .page-header__actions {
    gap: 0.5rem;
  }
  
  .page-header__actions--desktop {
    display: none;
  }
  
  .page-header__actions--mobile {
    display: flex;
  }
  
  .page-header__search {
    max-width: 100%;
  }
  
  .page-header__filters {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .page-header__filter-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .page-header__tabs {
    margin: -0.5rem -1.25rem 0;
    padding: 0 1.25rem;
    overflow-x: auto;
    scrollbar-width: none;
  }
  
  .page-header__tabs::-webkit-scrollbar {
    display: none;
  }
}

/* Dark Mode */
.dark .page-header {
  background-color: rgba(31, 41, 55, 0.95);
  border-bottom-color: #374151;
}

.dark .breadcrumb__item {
  color: #9ca3af;
}

.dark .breadcrumb__item:hover {
  color: #60a5fa;
}

.dark .breadcrumb__item--active {
  color: #f3f4f6;
}

.dark .breadcrumb__separator {
  color: #4b5563;
}

.dark .page-header__title {
  color: #f3f4f6;
}

.dark .page-header__subtitle {
  color: #9ca3af;
}

.dark .page-header__icon {
  background-color: #1e3a5f;
  color: #60a5fa;
}

.dark .page-header__stat-label {
  color: #9ca3af;
}

.dark .page-header__stat-value {
  color: #f3f4f6;
}

.dark .page-header__search-input {
  background-color: #1f2937;
  border-color: #374151;
  color: #f3f4f6;
}

.dark .page-header__search-input:hover {
  border-color: #4b5563;
}

.dark .page-header__search-input:focus {
  background-color: #111827;
  border-color: #3b82f6;
}

.dark .page-header__search-icon {
  color: #9ca3af;
}

.dark .page-header__filters {
  border-top-color: #374151;
}

.dark .page-header__filter-label {
  color: #e5e7eb;
}

.dark .page-header__tabs {
  border-bottom-color: #374151;
}

.dark .page-header__tab {
  color: #9ca3af;
}

.dark .page-header__tab:hover {
  color: #e5e7eb;
  background-color: #374151;
}

.dark .page-header__tab--active {
  color: #60a5fa;
  border-bottom-color: #60a5fa;
}

.dark .page-header__tab-badge {
  background-color: #374151;
  color: #9ca3af;
}

.dark .page-header__tab--active .page-header__tab-badge {
  background-color: #3b82f6;
  color: #ffffff;
}

.dark .page-header__back {
  color: #9ca3af;
}

.dark .page-header__back:hover {
  color: #60a5fa;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .page-header,
  .breadcrumb__item,
  .page-header__search-input,
  .page-header__tab {
    transition: none;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'page-header');
  styleElement.textContent = PAGE_HEADER_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const ChevronRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const SearchIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const TrendUpIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

// =============================================================================
// PAGE HEADER COMPONENT
// =============================================================================

const PageHeader = ({
  // Title
  title,
  subtitle,
  icon,
  badge,
  
  // Breadcrumbs
  breadcrumbs,
  showBreadcrumbs = true,
  
  // Back navigation
  backTo,
  backLabel = 'Back',
  onBack,
  
  // Actions
  actions,
  primaryAction,
  secondaryActions,
  
  // Search
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  showSearch = false,
  
  // Filters
  filters,
  showFilters = false,
  
  // Stats
  stats,
  showStats = false,
  
  // Tabs
  tabs,
  activeTab,
  onTabChange,
  showTabs = false,
  
  // Styling
  compact = false,
  bordered = false,
  shadow = false,
  className = '',
  
  children,
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const headerClasses = [
    'page-header',
    compact && 'page-header--compact',
    bordered && 'page-header--bordered',
    shadow && 'page-header--shadow',
    className,
  ].filter(Boolean).join(' ');

  // Render breadcrumbs
  const renderBreadcrumbs = () => {
    if (!showBreadcrumbs || !breadcrumbs?.length) return null;

    return (
      <nav className="page-header__breadcrumbs" aria-label="Breadcrumb">
        <ol className="breadcrumb">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <li key={index} className="breadcrumb__item-wrapper">
                {index > 0 && (
                  <span className="breadcrumb__separator">
                    <ChevronRightIcon />
                  </span>
                )}
                {isLast ? (
                  <span className="breadcrumb__item breadcrumb__item--active">
                    {crumb.icon && (
                      <span className="breadcrumb__icon">{crumb.icon}</span>
                    )}
                    {crumb.label}
                  </span>
                ) : (
                  <a
                    href={crumb.href}
                    onClick={(e) => {
                      if (crumb.onClick) {
                        e.preventDefault();
                        crumb.onClick();
                      }
                    }}
                    className="breadcrumb__item"
                  >
                    {crumb.icon && (
                      <span className="breadcrumb__icon">{crumb.icon}</span>
                    )}
                    {crumb.label}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  };

  // Render back button
  const renderBackButton = () => {
    if (!backTo && !onBack) return null;

    return (
      <a
        href={backTo}
        onClick={(e) => {
          if (onBack) {
            e.preventDefault();
            onBack();
          }
        }}
        className="page-header__back"
      >
        <ArrowLeftIcon />
        {backLabel}
      </a>
    );
  };

  // Render stats
  const renderStats = () => {
    if (!showStats || !stats?.length) return null;

    return (
      <div className="page-header__stats">
        {stats.map((stat, index) => (
          <div key={index} className="page-header__stat">
            <span className="page-header__stat-label">{stat.label}</span>
            <span className="page-header__stat-value">{stat.value}</span>
            {stat.trend && (
              <span className={`page-header__stat-trend page-header__stat-trend--${stat.trend > 0 ? 'up' : 'down'}`}>
                {stat.trend > 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                {Math.abs(stat.trend)}%
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render actions
  const renderActions = () => {
    const hasActions = actions || primaryAction || secondaryActions?.length;
    if (!hasActions) return null;

    return (
      <>
        {/* Desktop Actions */}
        <div className="page-header__actions page-header__actions--desktop">
          {actions || (
            <>
              {secondaryActions?.map((action, index) => (
                <React.Fragment key={index}>{action}</React.Fragment>
              ))}
              {primaryAction}
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="page-header__actions page-header__actions--mobile">
          {primaryAction}
          {(secondaryActions?.length > 0) && (
            <IconButton
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              }
              variant="ghost"
              ariaLabel="More actions"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          )}
        </div>
      </>
    );
  };

  // Render search
  const renderSearch = () => {
    if (!showSearch) return null;

    return (
      <div className="page-header__search">
        <span className="page-header__search-icon">
          <SearchIcon />
        </span>
        <input
          type="text"
          className="page-header__search-input"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>
    );
  };

  // Render filters
  const renderFilters = () => {
    if (!showFilters || !filters?.length) return null;

    return (
      <div className="page-header__filters">
        {filters.map((filter, index) => (
          <div key={index} className="page-header__filter-group">
            {filter.label && (
              <span className="page-header__filter-label">{filter.label}</span>
            )}
            {filter.component}
          </div>
        ))}
      </div>
    );
  };

  // Render tabs
  const renderTabs = () => {
    if (!showTabs || !tabs?.length) return null;

    return (
      <div className="page-header__tabs" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            className={`page-header__tab ${activeTab === tab.value ? 'page-header__tab--active' : ''}`}
            onClick={() => onTabChange?.(tab.value)}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="page-header__tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <header className={headerClasses} {...props}>
      {/* Back Button */}
      {renderBackButton()}

      {/* Breadcrumbs */}
      {renderBreadcrumbs()}

      {/* Main Section */}
      <div className="page-header__main">
        {/* Title Section */}
        <div className="page-header__title-section">
          <div className="page-header__title-wrapper">
            {icon && (
              <div className="page-header__icon">
                {icon}
              </div>
            )}
            <h1 className="page-header__title">{title}</h1>
            {badge && (
              <span className={`page-header__badge page-header__badge--${badge.variant || 'primary'}`}>
                {badge.label || badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="page-header__subtitle">{subtitle}</p>
          )}
          {renderStats()}
        </div>

        {/* Actions Section */}
        {renderActions()}
      </div>

      {/* Search */}
      {renderSearch()}

      {/* Filters */}
      {renderFilters()}

      {/* Tabs */}
      {renderTabs()}

      {/* Custom Children */}
      {children}
    </header>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

PageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  icon: PropTypes.node,
  badge: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      label: PropTypes.node,
      variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger']),
    }),
  ]),
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      onClick: PropTypes.func,
      icon: PropTypes.node,
    })
  ),
  showBreadcrumbs: PropTypes.bool,
  backTo: PropTypes.string,
  backLabel: PropTypes.string,
  onBack: PropTypes.func,
  actions: PropTypes.node,
  primaryAction: PropTypes.node,
  secondaryActions: PropTypes.arrayOf(PropTypes.node),
  searchPlaceholder: PropTypes.string,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  showSearch: PropTypes.bool,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      component: PropTypes.node.isRequired,
    })
  ),
  showFilters: PropTypes.bool,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
      trend: PropTypes.number,
    })
  ),
  showStats: PropTypes.bool,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
  showTabs: PropTypes.bool,
  compact: PropTypes.bool,
  bordered: PropTypes.bool,
  shadow: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default PageHeader;
export { PageHeader };
