// =============================================================================
// AI FUNNEL PLATFORM - Navbar Component (Self-Contained)
// =============================================================================
// Top navigation with logo, search, notifications, user menu, and mobile menu
// Depends on: Button, Input, Modal components from UI library
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button, IconButton } from '../ui';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const NAVBAR_STYLES = `
/* Navbar Container */
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95);
}

.navbar--transparent {
  background-color: transparent;
  border-bottom-color: transparent;
}

.navbar--shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Navbar Inner */
.navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0.75rem 2rem;
}

.navbar--compact .navbar__inner {
  padding: 0.5rem 1.5rem;
}

/* Left Section */
.navbar__left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 0 0 auto;
}

/* Logo */
.navbar__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #111827;
  font-weight: 700;
  font-size: 1.25rem;
  white-space: nowrap;
}

.navbar__logo-image {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.navbar__logo-text {
  font-size: 1.25rem;
  font-weight: 700;
}

/* Navigation Links */
.navbar__nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.navbar__nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.15s ease-in-out;
  white-space: nowrap;
}

.navbar__nav-link:hover {
  color: #111827;
  background-color: #f3f4f6;
}

.navbar__nav-link--active {
  color: #3b82f6;
  background-color: #eff6ff;
}

.navbar__nav-link svg {
  width: 1.125rem;
  height: 1.125rem;
}

/* Center Section */
.navbar__center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
}

/* Search */
.navbar__search {
  position: relative;
  width: 100%;
  max-width: 480px;
}

.navbar__search-input {
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

.navbar__search-input:hover {
  border-color: #d1d5db;
  background-color: #f3f4f6;
}

.navbar__search-input:focus {
  background-color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.navbar__search-input::placeholder {
  color: #9ca3af;
}

.navbar__search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
}

.navbar__search-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.navbar__search-shortcut {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #9ca3af;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  pointer-events: none;
}

/* Right Section */
.navbar__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 0 0 auto;
}

/* Icon Button */
.navbar__icon-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #6b7280;
  background-color: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.navbar__icon-button:hover {
  color: #111827;
  background-color: #f3f4f6;
}

.navbar__icon-button svg {
  width: 1.25rem;
  height: 1.25rem;
}

.navbar__icon-button-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #ef4444;
  border: 2px solid #ffffff;
  border-radius: 9999px;
  line-height: 1;
}

/* User Menu */
.navbar__user {
  position: relative;
}

.navbar__user-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.375rem 0.5rem 0.375rem 0.625rem;
  background-color: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.navbar__user-button:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
}

.navbar__user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.navbar__user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.navbar__user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.navbar__user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.navbar__user-role {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.navbar__user-chevron {
  color: #9ca3af;
  flex-shrink: 0;
}

.navbar__user-chevron svg {
  width: 1rem;
  height: 1rem;
}

/* Dropdown Menu */
.navbar__dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 240px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 0.5rem;
  z-index: 60;
  animation: navbar-dropdown-enter 0.15s ease-out;
}

@keyframes navbar-dropdown-enter {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.navbar__dropdown-section {
  padding: 0.5rem 0;
}

.navbar__dropdown-section + .navbar__dropdown-section {
  border-top: 1px solid #f3f4f6;
}

.navbar__dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  text-align: left;
  text-decoration: none;
  background-color: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.navbar__dropdown-item:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.navbar__dropdown-item--danger {
  color: #dc2626;
}

.navbar__dropdown-item--danger:hover {
  background-color: #fee2e2;
}

.navbar__dropdown-item svg {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

.navbar__dropdown-label {
  flex: 1;
}

.navbar__dropdown-badge {
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #dbeafe;
  color: #1e40af;
  border-radius: 9999px;
  line-height: 1;
}

/* Mobile Menu Toggle */
.navbar__mobile-toggle {
  display: none;
}

/* Mobile Menu */
.navbar__mobile-menu {
  display: none;
}

/* Responsive */
@media (max-width: 1024px) {
  .navbar__nav {
    display: none;
  }
  
  .navbar__center {
    display: none;
  }
  
  .navbar__user-info {
    display: none;
  }
}

@media (max-width: 768px) {
  .navbar__inner {
    padding: 0.75rem 1.25rem;
    gap: 1rem;
  }
  
  .navbar__logo-text {
    display: none;
  }
  
  .navbar__mobile-toggle {
    display: flex;
  }
  
  .navbar__right {
    gap: 0.5rem;
  }
  
  .navbar__mobile-menu {
    display: block;
    position: fixed;
    inset: 0;
    top: 65px;
    background-color: #ffffff;
    z-index: 40;
    padding: 1.5rem;
    overflow-y: auto;
    animation: navbar-mobile-enter 0.2s ease-out;
  }
  
  @keyframes navbar-mobile-enter {
    from {
      opacity: 0;
      transform: translateX(-100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .navbar__mobile-nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 0 0 2rem 0;
  }
  
  .navbar__mobile-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    font-size: 1rem;
    font-weight: 500;
    color: #374151;
    text-decoration: none;
    background-color: #f9fafb;
    border-radius: 8px;
    transition: all 0.15s ease-in-out;
  }
  
  .navbar__mobile-link:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
  
  .navbar__mobile-link--active {
    background-color: #eff6ff;
    color: #3b82f6;
  }
  
  .navbar__mobile-link svg {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .navbar__mobile-search {
    margin-bottom: 2rem;
  }
}

/* Dark Mode */
.dark .navbar {
  background-color: rgba(17, 23, 39, 0.95);
  border-bottom-color: #374151;
}

.dark .navbar__logo {
  color: #f3f4f6;
}

.dark .navbar__nav-link {
  color: #9ca3af;
}

.dark .navbar__nav-link:hover {
  color: #f3f4f6;
  background-color: #374151;
}

.dark .navbar__nav-link--active {
  color: #60a5fa;
  background-color: #1e3a5f;
}

.dark .navbar__search-input {
  background-color: #1f2937;
  border-color: #374151;
  color: #f3f4f6;
}

.dark .navbar__search-input:hover {
  border-color: #4b5563;
  background-color: #374151;
}

.dark .navbar__search-input:focus {
  background-color: #111827;
  border-color: #3b82f6;
}

.dark .navbar__search-icon {
  color: #9ca3af;
}

.dark .navbar__search-shortcut {
  background-color: #374151;
  border-color: #4b5563;
  color: #9ca3af;
}

.dark .navbar__icon-button {
  color: #9ca3af;
}

.dark .navbar__icon-button:hover {
  color: #f3f4f6;
  background-color: #374151;
}

.dark .navbar__user-button {
  border-color: #374151;
}

.dark .navbar__user-button:hover {
  background-color: #1f2937;
  border-color: #4b5563;
}

.dark .navbar__user-name {
  color: #f3f4f6;
}

.dark .navbar__user-role {
  color: #9ca3af;
}

.dark .navbar__dropdown {
  background-color: #1f2937;
  border-color: #374151;
}

.dark .navbar__dropdown-section + .navbar__dropdown-section {
  border-top-color: #374151;
}

.dark .navbar__dropdown-item {
  color: #e5e7eb;
}

.dark .navbar__dropdown-item:hover {
  background-color: #374151;
  color: #f3f4f6;
}

.dark .navbar__dropdown-item--danger:hover {
  background-color: #7f1d1d;
}

.dark .navbar__mobile-menu {
  background-color: #111827;
}

.dark .navbar__mobile-link {
  background-color: #1f2937;
  color: #e5e7eb;
}

.dark .navbar__mobile-link:hover {
  background-color: #374151;
  color: #f3f4f6;
}

.dark .navbar__mobile-link--active {
  background-color: #1e3a5f;
  color: #60a5fa;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .navbar__nav-link,
  .navbar__search-input,
  .navbar__icon-button,
  .navbar__user-button,
  .navbar__dropdown,
  .navbar__dropdown-item,
  .navbar__mobile-menu,
  .navbar__mobile-link {
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
  styleElement.setAttribute('data-component', 'navbar');
  styleElement.textContent = NAVBAR_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const SearchIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BellIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const MenuIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const UserIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SettingsIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// =============================================================================
// NAVBAR COMPONENT
// =============================================================================

const Navbar = ({
  // Logo
  logo,
  logoText = 'AI Funnel',
  logoHref = '/',
  
  // Navigation
  navLinks = [],
  
  // Search
  showSearch = true,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  searchShortcut = '⌘K',
  
  // Notifications
  showNotifications = true,
  notificationCount = 0,
  onNotificationClick,
  
  // User
  user,
  userMenuItems = [],
  onLogout,
  
  // Mobile
  mobileLinks,
  
  // Styling
  transparent = false,
  shadow = true,
  compact = false,
  
  // Custom
  children,
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navbarClasses = [
    'navbar',
    transparent && 'navbar--transparent',
    shadow && 'navbar--shadow',
    compact && 'navbar--compact',
    className,
  ].filter(Boolean).join(' ');

  // Get user initials
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className={navbarClasses} {...props}>
      <div className="navbar__inner">
        {/* Left Section */}
        <div className="navbar__left">
          {/* Mobile Menu Toggle */}
          <button
            className="navbar__icon-button navbar__mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          {/* Logo */}
          <a href={logoHref} className="navbar__logo">
            {logo && (
              typeof logo === 'string' ? (
                <img src={logo} alt={logoText} className="navbar__logo-image" />
              ) : (
                logo
              )
            )}
            <span className="navbar__logo-text">{logoText}</span>
          </a>

          {/* Desktop Navigation */}
          <ul className="navbar__nav">
            {navLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className={`navbar__nav-link ${link.active ? 'navbar__nav-link--active' : ''}`}
                  onClick={link.onClick}
                >
                  {link.icon}
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Center Section - Search */}
        {showSearch && (
          <div className="navbar__center">
            <div className="navbar__search">
              <span className="navbar__search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="navbar__search-input"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
              {searchShortcut && (
                <span className="navbar__search-shortcut">{searchShortcut}</span>
              )}
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="navbar__right">
          {/* Notifications */}
          {showNotifications && (
            <button
              className="navbar__icon-button"
              onClick={onNotificationClick}
              aria-label="Notifications"
            >
              <BellIcon />
              {notificationCount > 0 && (
                <span className="navbar__icon-button-badge">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          )}

          {/* Custom Children */}
          {children}

          {/* User Menu */}
          {user && (
            <div className="navbar__user" ref={userMenuRef}>
              <button
                className="navbar__user-button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                <div className="navbar__user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    getUserInitials()
                  )}
                </div>
                <div className="navbar__user-info">
                  <span className="navbar__user-name">{user.name}</span>
                  {user.role && (
                    <span className="navbar__user-role">{user.role}</span>
                  )}
                </div>
                <span className="navbar__user-chevron">
                  <ChevronDownIcon />
                </span>
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="navbar__dropdown">
                  {userMenuItems.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="navbar__dropdown-section">
                      {section.items.map((item, itemIndex) => (
                        item.type === 'link' ? (
                          <a
                            key={itemIndex}
                            href={item.href}
                            className={`navbar__dropdown-item ${item.danger ? 'navbar__dropdown-item--danger' : ''}`}
                            onClick={() => {
                              item.onClick?.();
                              setUserMenuOpen(false);
                            }}
                          >
                            {item.icon}
                            <span className="navbar__dropdown-label">{item.label}</span>
                            {item.badge && (
                              <span className="navbar__dropdown-badge">{item.badge}</span>
                            )}
                          </a>
                        ) : (
                          <button
                            key={itemIndex}
                            type="button"
                            className={`navbar__dropdown-item ${item.danger ? 'navbar__dropdown-item--danger' : ''}`}
                            onClick={() => {
                              item.onClick?.();
                              setUserMenuOpen(false);
                            }}
                          >
                            {item.icon}
                            <span className="navbar__dropdown-label">{item.label}</span>
                            {item.badge && (
                              <span className="navbar__dropdown-badge">{item.badge}</span>
                            )}
                          </button>
                        )
                      ))}
                    </div>
                  ))}
                  
                  {onLogout && (
                    <div className="navbar__dropdown-section">
                      <button
                        type="button"
                        className="navbar__dropdown-item navbar__dropdown-item--danger"
                        onClick={() => {
                          onLogout();
                          setUserMenuOpen(false);
                        }}
                      >
                        <LogoutIcon />
                        <span className="navbar__dropdown-label">Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="navbar__mobile-menu">
          {/* Mobile Search */}
          {showSearch && (
            <div className="navbar__mobile-search">
              <div className="navbar__search">
                <span className="navbar__search-icon">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  className="navbar__search-input"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Mobile Navigation */}
          <ul className="navbar__mobile-nav">
            {(mobileLinks || navLinks).map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className={`navbar__mobile-link ${link.active ? 'navbar__mobile-link--active' : ''}`}
                  onClick={(e) => {
                    link.onClick?.(e);
                    setMobileMenuOpen(false);
                  }}
                >
                  {link.icon}
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

Navbar.propTypes = {
  logo: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  logoText: PropTypes.string,
  logoHref: PropTypes.string,
  navLinks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      onClick: PropTypes.func,
      icon: PropTypes.node,
      active: PropTypes.bool,
    })
  ),
  showSearch: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchShortcut: PropTypes.string,
  showNotifications: PropTypes.bool,
  notificationCount: PropTypes.number,
  onNotificationClick: PropTypes.func,
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    role: PropTypes.string,
    avatar: PropTypes.string,
  }),
  userMenuItems: PropTypes.arrayOf(
    PropTypes.shape({
      items: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.oneOf(['link', 'button']),
          label: PropTypes.string.isRequired,
          href: PropTypes.string,
          onClick: PropTypes.func,
          icon: PropTypes.node,
          badge: PropTypes.string,
          danger: PropTypes.bool,
        })
      ).isRequired,
    })
  ),
  onLogout: PropTypes.func,
  mobileLinks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      onClick: PropTypes.func,
      icon: PropTypes.node,
      active: PropTypes.bool,
    })
  ),
  transparent: PropTypes.bool,
  shadow: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Navbar;
export { Navbar };
