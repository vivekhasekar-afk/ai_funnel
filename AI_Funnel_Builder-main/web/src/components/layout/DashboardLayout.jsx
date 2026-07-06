// =============================================================================
// AI FUNNEL PLATFORM - DashboardLayout Component (Enhanced & Fixed)
// =============================================================================
// Dashboard layout with navbar, sidebar, content area, enhanced UX & responsive behavior
// Depends on: Navbar, Sidebar components
// All styles included - no external CSS dependencies
// =============================================================================


import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';  // ✅ CRITICAL FIX - ADDED
import Navbar from './Navbar';
import Sidebar from './Sidebar';


// =============================================================================
// STYLES INJECTION (ENHANCED UI/UX)
// =============================================================================


const DASHBOARD_LAYOUT_STYLES = `
/* Dashboard Container */
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb;
  background-image: radial-gradient(at 0% 0%, rgba(147, 197, 253, 0.08) 0px, transparent 50%),
                    radial-gradient(at 100% 100%, rgba(167, 139, 250, 0.08) 0px, transparent 50%);
}


.dashboard-layout--dark {
  background-color: #0f172a;
  background-image: radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.05) 0px, transparent 50%),
                    radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.05) 0px, transparent 50%);
}


/* Main Container */
.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 280px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}


.dashboard-main--sidebar-collapsed {
  margin-left: 80px;
}


.dashboard-main--no-sidebar {
  margin-left: 0;
}


/* ✨ Enhanced: Navbar Container with Backdrop Blur */
.dashboard-navbar {
  position: sticky;
  top: 0;
  z-index: 90;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
}


.dashboard-layout--dark .dashboard-navbar {
  background-color: rgba(30, 41, 59, 0.8);
  border-bottom-color: #334155;
}


/* Content Wrapper */
.dashboard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}


/* ✨ Enhanced: Page Header with Better Spacing */
.dashboard-header {
  padding: 2rem 2rem 1.5rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  transition: all 0.3s ease-in-out;
}


.dashboard-layout--dark .dashboard-header {
  background-color: #1e293b;
  border-bottom-color: #334155;
}


.dashboard-header--compact {
  padding: 1.5rem 2rem 1rem;
}


.dashboard-header--transparent {
  background-color: transparent;
  border-bottom: none;
}


.dashboard-header__inner {
  max-width: 1600px;
  margin: 0 auto;
}


.dashboard-header__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1rem;
}


.dashboard-header__title-section {
  flex: 1;
  min-width: 0;
}


/* ✨ Enhanced: Breadcrumbs with Hover Effects */
.dashboard-header__breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}


.dashboard-layout--dark .dashboard-header__breadcrumbs {
  color: #94a3b8;
}


.dashboard-header__breadcrumb-link {
  color: #6b7280;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  margin: -0.25rem -0.5rem;
}


.dashboard-header__breadcrumb-link:hover {
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
}


.dashboard-layout--dark .dashboard-header__breadcrumb-link {
  color: #94a3b8;
}


.dashboard-layout--dark .dashboard-header__breadcrumb-link:hover {
  color: #60a5fa;
  background-color: rgba(96, 165, 250, 0.1);
}


.dashboard-header__breadcrumb-separator {
  color: #d1d5db;
}


.dashboard-layout--dark .dashboard-header__breadcrumb-separator {
  color: #475569;
}


.dashboard-header__breadcrumb-separator svg {
  width: 16px;
  height: 16px;
}


/* ✨ Enhanced: Title with Animation */
.dashboard-header__title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.3;
  animation: dashboard-title-enter 0.4s ease-out;
}


@keyframes dashboard-title-enter {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


.dashboard-layout--dark .dashboard-header__title {
  color: #f1f5f9;
}


.dashboard-header__subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
}


.dashboard-layout--dark .dashboard-header__subtitle {
  color: #94a3b8;
}


.dashboard-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}


/* ✨ Enhanced: Tabs with Better Interaction */
.dashboard-header__tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  margin-top: 1rem;
  overflow-x: auto;
  scrollbar-width: none;
}


.dashboard-layout--dark .dashboard-header__tabs {
  border-bottom-color: #334155;
}


.dashboard-header__tabs::-webkit-scrollbar {
  display: none;
}


.dashboard-header__tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
  position: relative;
  margin-bottom: -2px;
  border-radius: 8px 8px 0 0;
}


.dashboard-header__tab:hover {
  color: #111827;
  background-color: rgba(59, 130, 246, 0.05);
}


.dashboard-layout--dark .dashboard-header__tab {
  color: #94a3b8;
}


.dashboard-layout--dark .dashboard-header__tab:hover {
  color: #f1f5f9;
  background-color: rgba(96, 165, 250, 0.05);
}


.dashboard-header__tab--active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.08);
}


.dashboard-layout--dark .dashboard-header__tab--active {
  color: #60a5fa;
  border-bottom-color: #60a5fa;
  background-color: rgba(96, 165, 250, 0.08);
}


.dashboard-header__tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #e5e7eb;
  color: #6b7280;
  border-radius: 11px;
  line-height: 1;
  transition: all 0.2s ease-in-out;
}


.dashboard-header__tab--active .dashboard-header__tab-badge {
  background-color: #3b82f6;
  color: #ffffff;
  transform: scale(1.05);
}


/* Main Content Area */
.dashboard-main-content {
  flex: 1;
  padding: 2rem;
}


.dashboard-main-content--compact {
  padding: 1.5rem;
}


.dashboard-main-content--full {
  padding: 0;
}


.dashboard-main-content__inner {
  max-width: 1600px;
  margin: 0 auto;
  animation: dashboard-content-enter 0.5s ease-out;
}


@keyframes dashboard-content-enter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


.dashboard-main-content--narrow .dashboard-main-content__inner {
  max-width: 1200px;
}


.dashboard-main-content--wide .dashboard-main-content__inner {
  max-width: none;
}


/* ✨ Enhanced: Page Container with Subtle Shadow */
.dashboard-page {
  background-color: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  min-height: 400px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease-in-out;
}


.dashboard-page:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}


.dashboard-layout--dark .dashboard-page {
  background-color: #1e293b;
  border-color: #334155;
}


.dashboard-layout--dark .dashboard-page:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}


.dashboard-page--no-padding {
  padding: 0;
}


.dashboard-page--no-border {
  border: none;
}


.dashboard-page--transparent {
  background-color: transparent;
  border: none;
  box-shadow: none;
}


/* Split Layout */
.dashboard-split {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;
  align-items: start;
}


.dashboard-split__main {
  min-width: 0;
}


.dashboard-split__sidebar {
  position: sticky;
  top: 80px;
}


/* Grid Layout */
.dashboard-grid {
  display: grid;
  gap: 1.5rem;
}


.dashboard-grid--2 {
  grid-template-columns: repeat(2, 1fr);
}


.dashboard-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}


.dashboard-grid--4 {
  grid-template-columns: repeat(4, 1fr);
}


.dashboard-grid--auto {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}


/* ✨ Enhanced: Empty State with Animation */
.dashboard-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  min-height: 400px;
  animation: dashboard-empty-enter 0.5s ease-out;
}


@keyframes dashboard-empty-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}


.dashboard-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background-color: #f3f4f6;
  color: #9ca3af;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease-in-out;
}


.dashboard-empty__icon:hover {
  background-color: #e5e7eb;
  transform: scale(1.05);
}


.dashboard-layout--dark .dashboard-empty__icon {
  background-color: #334155;
  color: #64748b;
}


.dashboard-layout--dark .dashboard-empty__icon:hover {
  background-color: #475569;
}


.dashboard-empty__icon svg {
  width: 48px;
  height: 48px;
}


.dashboard-empty__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}


.dashboard-layout--dark .dashboard-empty__title {
  color: #f1f5f9;
}


.dashboard-empty__description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  max-width: 400px;
  line-height: 1.6;
}


.dashboard-layout--dark .dashboard-empty__description {
  color: #94a3b8;
}


.dashboard-empty__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}


/* ✨ Enhanced: Loading State with Gradient Spinner */
.dashboard-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 4rem 2rem;
}


.dashboard-loading__spinner {
  width: 56px;
  height: 56px;
  border: 5px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-right-color: #8b5cf6;
  border-radius: 50%;
  animation: dashboard-spin 0.8s linear infinite;
}


.dashboard-layout--dark .dashboard-loading__spinner {
  border-color: #334155;
  border-top-color: #60a5fa;
  border-right-color: #a78bfa;
}


@keyframes dashboard-spin {
  to {
    transform: rotate(360deg);
  }
}


/* ✨ Enhanced: FAB with Gradient & Pulse */
.dashboard-fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 80;
}


.dashboard-fab__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease-in-out;
  position: relative;
}


.dashboard-fab__button::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  animation: dashboard-fab-pulse 2s ease-in-out infinite;
}


@keyframes dashboard-fab-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.3;
  }
}


.dashboard-fab__button:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.5);
}


.dashboard-fab__button:active {
  transform: scale(1.02);
}


.dashboard-fab__button svg {
  width: 28px;
  height: 28px;
  position: relative;
  z-index: 1;
}


/* ✨ Enhanced: Mobile Toggle with Badge */
.dashboard-mobile-toggle {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: 80;
  display: none;
}


.dashboard-mobile-toggle__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #ffffff;
  color: #111827;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease-in-out;
  position: relative;
}


.dashboard-layout--dark .dashboard-mobile-toggle__button {
  background-color: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}


.dashboard-mobile-toggle__button:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.18);
}


.dashboard-mobile-toggle__button svg {
  width: 28px;
  height: 28px;
}


/* Notification Badge */
.dashboard-notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  border-radius: 12px;
  border: 2px solid #ffffff;
  line-height: 1;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  animation: dashboard-badge-pulse 2s ease-in-out infinite;
}


@keyframes dashboard-badge-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}


.dashboard-layout--dark .dashboard-notification-badge {
  border-color: #1e293b;
}


/* Responsive */
@media (max-width: 1024px) {
  .dashboard-main {
    margin-left: 0;
  }
  
  .dashboard-main--sidebar-collapsed {
    margin-left: 0;
  }
  
  .dashboard-mobile-toggle {
    display: block;
  }
  
  .dashboard-split {
    grid-template-columns: 1fr;
  }
  
  .dashboard-split__sidebar {
    position: static;
  }
  
  .dashboard-grid--2,
  .dashboard-grid--3,
  .dashboard-grid--4 {
    grid-template-columns: 1fr;
  }
}


@media (max-width: 768px) {
  .dashboard-header {
    padding: 1.5rem 1.5rem 1rem;
  }
  
  .dashboard-header__top {
    flex-direction: column;
    gap: 1rem;
  }
  
  .dashboard-header__actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .dashboard-header__title {
    font-size: 1.5rem;
  }
  
  .dashboard-main-content {
    padding: 1.5rem;
  }
  
  .dashboard-main-content--compact {
    padding: 1rem;
  }
  
  .dashboard-page {
    padding: 1rem;
    border-radius: 12px;
  }
  
  .dashboard-fab,
  .dashboard-mobile-toggle {
    bottom: 1.5rem;
  }
  
  .dashboard-fab {
    right: 1.5rem;
  }
  
  .dashboard-fab__button,
  .dashboard-mobile-toggle__button {
    width: 56px;
    height: 56px;
  }
  
  .dashboard-mobile-toggle {
    left: 1.5rem;
  }
}


/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .dashboard-main,
  .dashboard-navbar,
  .dashboard-header,
  .dashboard-header__breadcrumb-link,
  .dashboard-header__tab,
  .dashboard-page,
  .dashboard-empty__icon,
  .dashboard-loading__spinner,
  .dashboard-fab__button,
  .dashboard-fab__button::before,
  .dashboard-mobile-toggle__button,
  .dashboard-notification-badge,
  .dashboard-title-enter,
  .dashboard-content-enter,
  .dashboard-empty-enter {
    transition: none !important;
    animation: none !important;
  }
}
`;


// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'dashboard-layout');
  styleElement.textContent = DASHBOARD_LAYOUT_STYLES;
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


const MenuIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);


const PlusIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);


const InboxIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);


// =============================================================================
// DASHBOARD LAYOUT COMPONENT
// =============================================================================


const DashboardLayout = ({
  // Sidebar Props
  sidebarProps,
  showSidebar = true,
  sidebarCollapsed = false,
  onSidebarCollapsedChange,
  
  // Navbar Props
  navbarProps,
  showNavbar = true,
  
  // Header
  pageTitle,
  pageSubtitle,
  breadcrumbs,
  headerActions,
  tabs,
  activeTab,
  onTabChange,
  showHeader = true,
  headerCompact = false,
  headerTransparent = false,
  
  // Content
  children,
  contentLayout = 'default',
  contentWidth = 'default',
  contentPadding = 'default',
  
  // States
  loading = false,
  empty = false,
  emptyProps,
  
  // Quick Actions
  showFab = false,
  fabIcon,
  onFabClick,
  
  // Styling
  variant = 'light',
  
  // Custom
  customHeader,
  
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);


  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSidebarCollapsed, setLocalSidebarCollapsed] = useState(sidebarCollapsed);


  useEffect(() => {
    setLocalSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);


  const handleSidebarToggle = () => {
    const newValue = !localSidebarCollapsed;
    setLocalSidebarCollapsed(newValue);
    onSidebarCollapsedChange?.(newValue);
  };


  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };


  const layoutClasses = [
    'dashboard-layout',
    `dashboard-layout--${variant}`,
    className,
  ].filter(Boolean).join(' ');


  const mainClasses = [
    'dashboard-main',
    !showSidebar && 'dashboard-main--no-sidebar',
    localSidebarCollapsed && 'dashboard-main--sidebar-collapsed',
  ].filter(Boolean).join(' ');


  const headerClasses = [
    'dashboard-header',
    headerCompact && 'dashboard-header--compact',
    headerTransparent && 'dashboard-header--transparent',
  ].filter(Boolean).join(' ');


  const contentClasses = [
    'dashboard-main-content',
    `dashboard-main-content--${contentPadding}`,
    `dashboard-main-content--${contentWidth}`,
  ].filter(Boolean).join(' ');


  return (
    <div className={layoutClasses} {...props}>
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          {...sidebarProps}
          collapsed={localSidebarCollapsed}
          onCollapsedChange={handleSidebarToggle}
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
          variant={variant === 'dark' ? 'dark' : 'dark'}
        />
      )}


      {/* Main Content Area */}
      <div className={mainClasses}>
        {/* Navbar */}
        {showNavbar && (
          <div className="dashboard-navbar">
            <Navbar {...navbarProps} variant={variant} />
          </div>
        )}


        {/* Page Header */}
        {showHeader && !customHeader && (pageTitle || breadcrumbs || tabs) && (
          <div className={headerClasses}>
            <div className="dashboard-header__inner">
              <div className="dashboard-header__top">
                <div className="dashboard-header__title-section">
                  {/* Breadcrumbs */}
                  {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="dashboard-header__breadcrumbs" aria-label="Breadcrumb">
                      {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return (
                          <React.Fragment key={index}>
                            {index > 0 && (
                              <span className="dashboard-header__breadcrumb-separator">
                                <ChevronRightIcon />
                              </span>
                            )}
                            {isLast ? (
                              <span>{crumb.label}</span>
                            ) : (
                              <a href={crumb.href} className="dashboard-header__breadcrumb-link">
                                {crumb.label}
                              </a>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </nav>
                  )}


                  {/* Title */}
                  {pageTitle && <h1 className="dashboard-header__title">{pageTitle}</h1>}
                  {pageSubtitle && <p className="dashboard-header__subtitle">{pageSubtitle}</p>}
                </div>


                {/* Actions */}
                {headerActions && (
                  <div className="dashboard-header__actions">{headerActions}</div>
                )}
              </div>


              {/* Tabs */}
              {tabs && tabs.length > 0 && (
                <div className="dashboard-header__tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`dashboard-header__tab ${
                        activeTab === tab.id ? 'dashboard-header__tab--active' : ''
                      }`}
                      onClick={() => onTabChange?.(tab.id)}
                    >
                      {tab.icon && <span>{tab.icon}</span>}
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className="dashboard-header__tab-badge">{tab.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


        {/* Custom Header */}
        {customHeader}


        {/* Main Content */}
        <div className="dashboard-content">
          <div className={contentClasses}>
            <div className="dashboard-main-content__inner">
              {/* Loading State */}
              {loading ? (
                <div className="dashboard-loading">
                  <div className="dashboard-loading__spinner" />
                </div>
              ) : empty ? (
                /* Empty State */
                <div className="dashboard-empty">
                  <div className="dashboard-empty__icon">
                    {emptyProps?.icon || <InboxIcon />}
                  </div>
                  <h3 className="dashboard-empty__title">
                    {emptyProps?.title || 'No data available'}
                  </h3>
                  <p className="dashboard-empty__description">
                    {emptyProps?.description || 'Get started by creating your first item.'}
                  </p>
                  {emptyProps?.actions && (
                    <div className="dashboard-empty__actions">{emptyProps.actions}</div>
                  )}
                </div>
              ) : (
                /* ✅ CRITICAL FIX - React Router Outlet for nested routes */
                <>
                  <Outlet />
                  {children}
                </>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Floating Action Button */}
      {showFab && (
        <div className="dashboard-fab">
          <button
            type="button"
            className="dashboard-fab__button"
            onClick={onFabClick}
            aria-label="Quick action"
          >
            {fabIcon || <PlusIcon />}
          </button>
        </div>
      )}


      {/* Mobile Sidebar Toggle */}
      {showSidebar && (
        <div className="dashboard-mobile-toggle">
          <button
            type="button"
            className="dashboard-mobile-toggle__button"
            onClick={handleMobileMenuToggle}
            aria-label="Toggle sidebar"
          >
            <MenuIcon />
            {sidebarProps?.user && (
              <span className="dashboard-notification-badge">3</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};


// =============================================================================
// PROP TYPES
// =============================================================================


DashboardLayout.propTypes = {
  sidebarProps: PropTypes.object,
  showSidebar: PropTypes.bool,
  sidebarCollapsed: PropTypes.bool,
  onSidebarCollapsedChange: PropTypes.func,
  navbarProps: PropTypes.object,
  showNavbar: PropTypes.bool,
  pageTitle: PropTypes.node,
  pageSubtitle: PropTypes.node,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
    })
  ),
  headerActions: PropTypes.node,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
  showHeader: PropTypes.bool,
  headerCompact: PropTypes.bool,
  headerTransparent: PropTypes.bool,
  children: PropTypes.node,
  contentLayout: PropTypes.oneOf(['default', 'split', 'grid']),
  contentWidth: PropTypes.oneOf(['default', 'narrow', 'wide']),
  contentPadding: PropTypes.oneOf(['default', 'compact', 'full']),
  loading: PropTypes.bool,
  empty: PropTypes.bool,
  emptyProps: PropTypes.shape({
    icon: PropTypes.node,
    title: PropTypes.string,
    description: PropTypes.string,
    actions: PropTypes.node,
  }),
  showFab: PropTypes.bool,
  fabIcon: PropTypes.node,
  onFabClick: PropTypes.func,
  variant: PropTypes.oneOf(['light', 'dark']),
  customHeader: PropTypes.node,
  className: PropTypes.string,
};


// =============================================================================
// SUB-COMPONENTS
// =============================================================================


const DashboardPage = ({ children, noPadding, noBorder, transparent, className = '' }) => {
  const pageClasses = [
    'dashboard-page',
    noPadding && 'dashboard-page--no-padding',
    noBorder && 'dashboard-page--no-border',
    transparent && 'dashboard-page--transparent',
    className,
  ].filter(Boolean).join(' ');


  return <div className={pageClasses}>{children}</div>;
};


DashboardPage.propTypes = {
  children: PropTypes.node,
  noPadding: PropTypes.bool,
  noBorder: PropTypes.bool,
  transparent: PropTypes.bool,
  className: PropTypes.string,
};


const DashboardSplit = ({ main, sidebar, children }) => (
  <div className="dashboard-split">
    <div className="dashboard-split__main">{main || children}</div>
    {sidebar && <div className="dashboard-split__sidebar">{sidebar}</div>}
  </div>
);


DashboardSplit.propTypes = {
  main: PropTypes.node,
  sidebar: PropTypes.node,
  children: PropTypes.node,
};


const DashboardGrid = ({ columns = 'auto', children, className = '' }) => {
  const gridClasses = [
    'dashboard-grid',
    columns !== 'auto' && `dashboard-grid--${columns}`,
    columns === 'auto' && 'dashboard-grid--auto',
    className,
  ].filter(Boolean).join(' ');


  return <div className={gridClasses}>{children}</div>;
};


DashboardGrid.propTypes = {
  columns: PropTypes.oneOf(['auto', '2', '3', '4', 2, 3, 4]),
  children: PropTypes.node,
  className: PropTypes.string,
};


// =============================================================================
// EXPORTS
// =============================================================================


export default DashboardLayout;
export { DashboardLayout, DashboardPage, DashboardSplit, DashboardGrid };
