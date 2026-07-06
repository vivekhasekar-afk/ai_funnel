// =============================================================================
// AI FUNNEL PLATFORM - PublicLayout Component (Enhanced for Landing Page)
// =============================================================================
// Public layout with navigation header, full-width content support, and footer
// Optimized for Landing Page → Auth Page flow
// =============================================================================

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui';
import Footer from './Footer';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const PUBLIC_LAYOUT_STYLES = `
/* Layout Container */
.public-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #ffffff;
}

/* Header */
.public-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.public-header--scrolled {
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.public-header--transparent {
  background-color: transparent;
  border-bottom-color: transparent;
}

.public-header__inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

/* Logo */
.public-header__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.public-header__logo:hover {
  opacity: 0.85;
}

.public-header__logo-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.public-header__logo-text {
  font-size: 1.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Navigation */
.public-header__nav {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  flex: 1;
  justify-content: center;
}

.public-header__nav-link {
  font-size: 0.938rem;
  font-weight: 600;
  color: #374151;
  text-decoration: none;
  transition: color 0.2s;
  position: relative;
  padding: 0.5rem 0;
}

.public-header__nav-link:hover {
  color: #667eea;
}

.public-header__nav-link--active {
  color: #667eea;
}

.public-header__nav-link--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 1px;
}

/* Actions */
.public-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Mobile Toggle */
.public-header__mobile-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
}

.public-header__mobile-toggle:hover {
  background: #f3f4f6;
}

.public-header__mobile-toggle svg {
  width: 24px;
  height: 24px;
}

/* Mobile Menu */
.public-header__mobile-menu {
  display: none;
  position: fixed;
  top: 72px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  z-index: 999;
  padding: 2rem;
  overflow-y: auto;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.public-header__mobile-menu--open {
  display: block;
}

.public-header__mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.public-header__mobile-link {
  display: block;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
}

.public-header__mobile-link:hover {
  background: #f3f4f6;
  color: #667eea;
}

.public-header__mobile-link--active {
  background: #ede9fe;
  color: #667eea;
}

.public-header__mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.public-header__mobile-actions button {
  width: 100%;
}

/* Main Content */
.public-layout__main {
  flex: 1;
  margin-top: 72px; /* Header height */
}

.public-layout__main--no-header {
  margin-top: 0;
}

/* Auth Page Specific */
.public-layout--auth .public-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.public-layout--auth .public-header__nav,
.public-layout--auth .public-footer {
  display: none;
}

/* Landing Page Specific */
.public-layout--landing .public-layout__main {
  margin-top: 0;
}

.public-layout--landing .public-header {
  background: transparent;
  border-bottom: transparent;
}

.public-layout--landing .public-header--scrolled {
  background: rgba(255, 255, 255, 0.98);
  border-bottom: 1px solid #e5e7eb;
}

/* Responsive */
@media (max-width: 1024px) {
  .public-header__nav {
    display: none;
  }

  .public-header__mobile-toggle {
    display: flex;
  }
}

@media (max-width: 768px) {
  .public-header__inner {
    padding: 1rem 1.5rem;
  }

  .public-header__actions {
    display: none;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;

  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'public-layout');
  styleElement.textContent = PUBLIC_LAYOUT_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

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

const LightningIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

// =============================================================================
// PUBLIC LAYOUT COMPONENT
// =============================================================================

const PublicLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    injectStyles();
  }, []);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Determine layout variant
  const isAuthPage = location.pathname.startsWith('/auth');
  const isLandingPage = location.pathname === '/' || location.pathname === '/home';

  const layoutClasses = [
    'public-layout',
    isAuthPage && 'public-layout--auth',
    isLandingPage && 'public-layout--landing',
  ].filter(Boolean).join(' ');

  const headerClasses = [
    'public-header',
    scrolled && 'public-header--scrolled',
    isLandingPage && !scrolled && 'public-header--transparent',
  ].filter(Boolean).join(' ');

  const mainClasses = [
    'public-layout__main',
    isAuthPage && 'public-layout__main--no-header',
  ].filter(Boolean).join(' ');

  // Navigation items
  const navItems = [
    { id: 'features', label: 'Features', href: '#features' },
    { id: 'how-it-works', label: 'How It Works', href: '#how-it-works' },
    { id: 'pricing', label: 'Pricing', href: '#pricing' },
    { id: 'testimonials', label: 'Testimonials', href: '#testimonials' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    
    // If not on landing page, navigate there first
    if (!isLandingPage) {
      navigate('/');
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className={layoutClasses}>
      {/* Header - Only show on landing and public pages */}
      {!isAuthPage && (
        <header className={headerClasses}>
          <div className="public-header__inner">
            {/* Logo */}
            <div className="public-header__logo" onClick={() => navigate('/')}>
              <div className="public-header__logo-icon">
                <LightningIcon />
              </div>
              <span className="public-header__logo-text">AI Funnel Platform</span>
            </div>

            {/* Desktop Navigation - Only on landing page */}
            {isLandingPage && (
              <nav className="public-header__nav">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className="public-header__nav-link"
                    onClick={(e) => handleNavClick(e, item.href)}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            )}

            {/* Header Actions - Desktop */}
            <div className="public-header__actions">
              <Button variant="ghost" onClick={() => navigate('/auth/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth/signup')}>
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            {isLandingPage && (
              <button
                type="button"
                className="public-header__mobile-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            )}
          </div>

          {/* Mobile Menu */}
          {isLandingPage && (
            <div className={`public-header__mobile-menu ${mobileMenuOpen ? 'public-header__mobile-menu--open' : ''}`}>
              <nav className="public-header__mobile-nav">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className="public-header__mobile-link"
                    onClick={(e) => handleNavClick(e, item.href)}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="public-header__mobile-actions">
                <Button variant="outline" onClick={() => navigate('/auth/login')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/auth/signup')}>
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Main Content */}
      <main className={mainClasses}>
        {/* React Router Outlet for nested routes */}
        <Outlet />
        
        {/* Direct children for non-nested usage */}
        {children}
      </main>

      {/* Footer - Only show on landing page */}
      {isLandingPage && <Footer />}
    </div>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

PublicLayout.propTypes = {
  children: PropTypes.node,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default PublicLayout;
export { PublicLayout };
