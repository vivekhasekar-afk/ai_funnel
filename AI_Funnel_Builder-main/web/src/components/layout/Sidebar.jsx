// =============================================================================
// AI FUNNEL PLATFORM - Sidebar Component (Self-Contained)
// =============================================================================
// Sidebar navigation with menu items, active state, collapse, project switcher
// Depends on: Button, Tooltip components from UI library
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Tooltip } from '../ui';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const SIDEBAR_STYLES = `
/* Sidebar Container */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background-color: #111827;
  border-right: 1px solid #1f2937;
  display: flex;
  flex-direction: column;
  z-index: 50;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar--collapsed {
  width: 80px;
}

.sidebar--light {
  background-color: #ffffff;
  border-right-color: #e5e7eb;
}

/* Sidebar Overlay (Mobile) */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 49;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease-in-out;
}

.sidebar-overlay--visible {
  opacity: 1;
  pointer-events: auto;
}

/* Sidebar Header */
.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #1f2937;
  flex-shrink: 0;
}

.sidebar--light .sidebar__header {
  border-bottom-color: #e5e7eb;
}

.sidebar--collapsed .sidebar__header {
  padding: 1.25rem 1rem;
  justify-content: center;
}

/* Logo */
.sidebar__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  transition: opacity 0.2s ease-in-out;
}

.sidebar__logo:hover {
  opacity: 0.8;
}

.sidebar__logo-image {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
}

.sidebar__logo-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar--light .sidebar__logo-text {
  color: #111827;
}

.sidebar--collapsed .sidebar__logo-text {
  display: none;
}

/* Toggle Button */
.sidebar__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: transparent;
  color: #9ca3af;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;
}

.sidebar__toggle:hover {
  background-color: #1f2937;
  color: #ffffff;
}

.sidebar--light .sidebar__toggle:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.sidebar__toggle svg {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease-in-out;
}

.sidebar--collapsed .sidebar__toggle svg {
  transform: rotate(180deg);
}

.sidebar--collapsed .sidebar__toggle {
  display: none;
}

/* Project Switcher */
.sidebar__project {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #1f2937;
  flex-shrink: 0;
}

.sidebar--light .sidebar__project {
  border-bottom-color: #e5e7eb;
}

.sidebar--collapsed .sidebar__project {
  padding: 1rem;
}

.sidebar__project-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  color: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.sidebar__project-button:hover {
  background-color: #374151;
  border-color: #4b5563;
}

.sidebar--light .sidebar__project-button {
  background-color: #f9fafb;
  border-color: #e5e7eb;
  color: #111827;
}

.sidebar--light .sidebar__project-button:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.sidebar__project-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px;
  color: #ffffff;
  flex-shrink: 0;
  font-weight: 600;
  font-size: 0.875rem;
}

.sidebar__project-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.sidebar--collapsed .sidebar__project-info {
  display: none;
}

.sidebar__project-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.sidebar--light .sidebar__project-name {
  color: #111827;
}

.sidebar__project-role {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar--light .sidebar__project-role {
  color: #6b7280;
}

.sidebar__project-chevron {
  flex-shrink: 0;
  color: #6b7280;
}

.sidebar--collapsed .sidebar__project-chevron {
  display: none;
}

.sidebar__project-chevron svg {
  width: 16px;
  height: 16px;
}

/* Navigation */
.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem 0;
}

.sidebar__nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar__nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar__nav::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 3px;
}

.sidebar--light .sidebar__nav::-webkit-scrollbar-thumb {
  background: #d1d5db;
}

/* Nav Section */
.sidebar__section {
  padding: 0 1rem;
  margin-bottom: 1.5rem;
}

.sidebar--collapsed .sidebar__section {
  padding: 0 0.75rem;
}

.sidebar__section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.sidebar--collapsed .sidebar__section-title {
  justify-content: center;
  padding: 0.5rem 0;
}

.sidebar__section-title-text {
  white-space: nowrap;
  overflow: hidden;
}

.sidebar--collapsed .sidebar__section-title-text {
  display: none;
}

.sidebar__section-divider {
  width: 12px;
  height: 2px;
  background-color: #374151;
  border-radius: 1px;
}

.sidebar--light .sidebar__section-divider {
  background-color: #d1d5db;
}

/* Menu Items */
.sidebar__menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar__menu-item {
  position: relative;
}

.sidebar__menu-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  color: #9ca3af;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
}

.sidebar__menu-link:hover {
  background-color: #1f2937;
  color: #ffffff;
}

.sidebar--light .sidebar__menu-link {
  color: #6b7280;
}

.sidebar--light .sidebar__menu-link:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.sidebar__menu-link--active {
  background-color: #1e3a8a;
  color: #ffffff;
}

.sidebar--light .sidebar__menu-link--active {
  background-color: #dbeafe;
  color: #1e40af;
}

.sidebar__menu-link--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background-color: #3b82f6;
  border-radius: 0 2px 2px 0;
}

.sidebar--collapsed .sidebar__menu-link {
  justify-content: center;
  padding: 0.75rem;
}

.sidebar__menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar__menu-icon svg {
  width: 20px;
  height: 20px;
}

.sidebar__menu-text {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar--collapsed .sidebar__menu-text {
  display: none;
}

.sidebar__menu-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #ef4444;
  color: #ffffff;
  border-radius: 10px;
  line-height: 1;
  flex-shrink: 0;
}

.sidebar--collapsed .sidebar__menu-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  min-width: 18px;
  height: 18px;
  font-size: 0.688rem;
}

.sidebar__menu-chevron {
  flex-shrink: 0;
  color: #6b7280;
  transition: transform 0.2s ease-in-out;
}

.sidebar__menu-chevron svg {
  width: 16px;
  height: 16px;
}

.sidebar__menu-link--expanded .sidebar__menu-chevron {
  transform: rotate(90deg);
}

.sidebar--collapsed .sidebar__menu-chevron {
  display: none;
}

/* Submenu */
.sidebar__submenu {
  display: none;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.25rem;
  padding-left: 2.5rem;
  list-style: none;
  margin: 0.25rem 0 0 0;
  padding: 0 0 0 2.5rem;
}

.sidebar__submenu--expanded {
  display: flex;
}

.sidebar--collapsed .sidebar__submenu {
  display: none !important;
}

.sidebar__submenu-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  color: #9ca3af;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.813rem;
  transition: all 0.2s ease-in-out;
}

.sidebar__submenu-link:hover {
  background-color: #1f2937;
  color: #ffffff;
}

.sidebar--light .sidebar__submenu-link {
  color: #6b7280;
}

.sidebar--light .sidebar__submenu-link:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.sidebar__submenu-link--active {
  background-color: #1f2937;
  color: #ffffff;
}

.sidebar--light .sidebar__submenu-link--active {
  background-color: #f3f4f6;
  color: #1e40af;
}

.sidebar__submenu-dot {
  width: 6px;
  height: 6px;
  background-color: #4b5563;
  border-radius: 50%;
  flex-shrink: 0;
}

.sidebar__submenu-link--active .sidebar__submenu-dot {
  background-color: #3b82f6;
}

/* Footer */
.sidebar__footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #1f2937;
  flex-shrink: 0;
}

.sidebar--light .sidebar__footer {
  border-top-color: #e5e7eb;
}

.sidebar--collapsed .sidebar__footer {
  padding: 1rem;
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: transparent;
  border: none;
  border-radius: 8px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.sidebar__user:hover {
  background-color: #1f2937;
}

.sidebar--light .sidebar__user:hover {
  background-color: #f3f4f6;
}

.sidebar--collapsed .sidebar__user {
  justify-content: center;
  padding: 0.5rem;
}

.sidebar__user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.sidebar__user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.sidebar__user-info {
  flex: 1;
  min-width: 0;
}

.sidebar--collapsed .sidebar__user-info {
  display: none;
}

.sidebar__user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.sidebar--light .sidebar__user-name {
  color: #111827;
}

.sidebar__user-email {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__user-menu {
  flex-shrink: 0;
  color: #6b7280;
}

.sidebar--collapsed .sidebar__user-menu {
  display: none;
}

.sidebar__user-menu svg {
  width: 16px;
  height: 16px;
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar--mobile-open {
    transform: translateX(0);
  }
  
  .sidebar--collapsed {
    transform: translateX(-100%);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar-overlay,
  .sidebar__toggle svg,
  .sidebar__menu-link,
  .sidebar__menu-chevron,
  .sidebar__submenu-link,
  .sidebar__user {
    transition: none !important;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'sidebar');
  styleElement.textContent = SIDEBAR_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const ChevronLeftIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const DotsVerticalIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

const Sidebar = ({
  // Logo
  logo,
  logoText = 'AI Funnel',
  logoUrl = '/',
  
  // Project Switcher
  currentProject,
  onProjectClick,
  
  // Navigation
  menuItems = [],
  
  // User
  user,
  onUserClick,
  
  // State
  collapsed = false,
  onCollapsedChange,
  mobileOpen = false,
  onMobileOpenChange,
  
  // Active
  activeItem,
  
  // Styling
  variant = 'dark',
  
  // Custom
  children,
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [expandedItems, setExpandedItems] = useState([]);

  const sidebarClasses = [
    'sidebar',
    `sidebar--${variant}`,
    collapsed && 'sidebar--collapsed',
    mobileOpen && 'sidebar--mobile-open',
    className,
  ].filter(Boolean).join(' ');

  const handleToggleCollapse = () => {
    onCollapsedChange?.(!collapsed);
  };

  const handleToggleExpand = (itemId) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleOverlayClick = () => {
    onMobileOpenChange?.(false);
  };

  const renderMenuItem = (item, level = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = activeItem === item.id || item.submenu?.some(sub => activeItem === sub.id);

    const linkClasses = [
      'sidebar__menu-link',
      isActive && 'sidebar__menu-link--active',
      hasSubmenu && isExpanded && 'sidebar__menu-link--expanded',
    ].filter(Boolean).join(' ');

    const handleClick = (e) => {
      if (hasSubmenu) {
        e.preventDefault();
        handleToggleExpand(item.id);
      }
      item.onClick?.();
    };

    const content = (
      <>
        {item.icon && (
          <span className="sidebar__menu-icon">{item.icon}</span>
        )}
        <span className="sidebar__menu-text">{item.label}</span>
        {item.badge && (
          <span className="sidebar__menu-badge">{item.badge}</span>
        )}
        {hasSubmenu && (
          <span className="sidebar__menu-chevron">
            <ChevronRightIcon />
          </span>
        )}
      </>
    );

    return (
      <li key={item.id} className="sidebar__menu-item">
        {item.href ? (
          <a href={item.href} className={linkClasses} onClick={handleClick}>
            {content}
          </a>
        ) : (
          <button type="button" className={linkClasses} onClick={handleClick}>
            {content}
          </button>
        )}

        {/* Submenu */}
        {hasSubmenu && (
          <ul className={`sidebar__submenu ${isExpanded ? 'sidebar__submenu--expanded' : ''}`}>
            {item.submenu.map((subItem) => {
              const subLinkClasses = [
                'sidebar__submenu-link',
                activeItem === subItem.id && 'sidebar__submenu-link--active',
              ].filter(Boolean).join(' ');

              return (
                <li key={subItem.id}>
                  <a
                    href={subItem.href}
                    className={subLinkClasses}
                    onClick={subItem.onClick}
                  >
                    <span className="sidebar__submenu-dot" />
                    <span>{subItem.label}</span>
                    {subItem.badge && (
                      <span className="sidebar__menu-badge">{subItem.badge}</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={handleOverlayClick}
      />

      {/* Sidebar */}
      <aside className={sidebarClasses} {...props}>
        {/* Header */}
        <div className="sidebar__header">
          <a href={logoUrl} className="sidebar__logo">
            {logo && (
              typeof logo === 'string' ? (
                <img src={logo} alt={logoText} className="sidebar__logo-image" />
              ) : (
                logo
              )
            )}
            <span className="sidebar__logo-text">{logoText}</span>
          </a>
          
          {!collapsed && (
            <button
              type="button"
              className="sidebar__toggle"
              onClick={handleToggleCollapse}
              aria-label="Toggle sidebar"
            >
              <ChevronLeftIcon />
            </button>
          )}
        </div>

        {/* Project Switcher */}
        {currentProject && (
          <div className="sidebar__project">
            <button
              type="button"
              className="sidebar__project-button"
              onClick={onProjectClick}
            >
              <div className="sidebar__project-icon">
                {currentProject.icon || currentProject.name.charAt(0).toUpperCase()}
              </div>
              <div className="sidebar__project-info">
                <p className="sidebar__project-name">{currentProject.name}</p>
                <p className="sidebar__project-role">{currentProject.role || 'Owner'}</p>
              </div>
              <span className="sidebar__project-chevron">
                <ChevronDownIcon />
              </span>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar__nav">
          {menuItems.map((section, index) => (
            <div key={index} className="sidebar__section">
              {section.title && (
                <div className="sidebar__section-title">
                  {collapsed ? (
                    <span className="sidebar__section-divider" />
                  ) : (
                    <span className="sidebar__section-title-text">{section.title}</span>
                  )}
                </div>
              )}
              <ul className="sidebar__menu">
                {section.items.map((item) => renderMenuItem(item))}
              </ul>
            </div>
          ))}
          {children}
        </nav>

        {/* Footer - User */}
        {user && (
          <div className="sidebar__footer">
            <button
              type="button"
              className="sidebar__user"
              onClick={onUserClick}
            >
              <div className="sidebar__user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="sidebar__user-info">
                <p className="sidebar__user-name">{user.name}</p>
                <p className="sidebar__user-email">{user.email}</p>
              </div>
              <span className="sidebar__user-menu">
                <DotsVerticalIcon />
              </span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

Sidebar.propTypes = {
  logo: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  logoText: PropTypes.string,
  logoUrl: PropTypes.string,
  currentProject: PropTypes.shape({
    name: PropTypes.string.isRequired,
    role: PropTypes.string,
    icon: PropTypes.node,
  }),
  onProjectClick: PropTypes.func,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          icon: PropTypes.node,
          href: PropTypes.string,
          badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          onClick: PropTypes.func,
          submenu: PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.string.isRequired,
              label: PropTypes.string.isRequired,
              href: PropTypes.string,
              badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
              onClick: PropTypes.func,
            })
          ),
        })
      ).isRequired,
    })
  ),
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }),
  onUserClick: PropTypes.func,
  collapsed: PropTypes.bool,
  onCollapsedChange: PropTypes.func,
  mobileOpen: PropTypes.bool,
  onMobileOpenChange: PropTypes.func,
  activeItem: PropTypes.string,
  variant: PropTypes.oneOf(['dark', 'light']),
  className: PropTypes.string,
  children: PropTypes.node,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Sidebar;
export { Sidebar };
