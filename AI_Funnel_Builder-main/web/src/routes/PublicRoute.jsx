// =============================================================================
// AI FUNNEL PLATFORM - PublicRoute Component (Enhanced Production)
// =============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// =============================================================================
// CONSTANTS
// =============================================================================

const REDIRECT_DELAY = 100; // ms
const AUTH_CHECK_TIMEOUT = 5000; // 5 seconds
const STORAGE_KEY_REDIRECT = 'publicRoute_intendedDestination';
const STORAGE_KEY_REDIRECT_COUNT = 'publicRoute_redirectCount';
const MAX_REDIRECT_COUNT = 3;

const PUBLIC_PAGES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
};

const DASHBOARD_ROUTES = {
  DEFAULT: '/dashboard',
  ADMIN: '/admin/dashboard',
  MANAGER: '/manager/dashboard',
  USER: '/dashboard',
};

// =============================================================================
// STYLED COMPONENTS (Inline Styles)
// =============================================================================

const LOADER_STYLES = `
.public-route-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.98);
  z-index: 9999;
  opacity: 0;
  animation: fadeIn 0.2s ease forwards;
}

@keyframes fadeIn {
  to { opacity: 1; }
}

.public-route-loader__spinner {
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

.public-route-error {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  z-index: 9999;
  padding: 2rem;
}

.public-route-error__content {
  max-width: 500px;
  text-align: center;
}

.public-route-error__icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  color: #ef4444;
}

.public-route-error__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.public-route-error__message {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

.public-route-error__button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.public-route-error__button:hover {
  background: #5568d3;
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'public-route');
  styleElement.textContent = LOADER_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get redirect count from storage
 */
const getRedirectCount = () => {
  try {
    const count = sessionStorage.getItem(STORAGE_KEY_REDIRECT_COUNT);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Failed to get redirect count:', error);
    return 0;
  }
};

/**
 * Increment redirect count
 */
const incrementRedirectCount = () => {
  try {
    const count = getRedirectCount();
    sessionStorage.setItem(STORAGE_KEY_REDIRECT_COUNT, String(count + 1));
  } catch (error) {
    console.error('Failed to increment redirect count:', error);
  }
};

/**
 * Reset redirect count
 */
const resetRedirectCount = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY_REDIRECT_COUNT);
  } catch (error) {
    console.error('Failed to reset redirect count:', error);
  }
};

/**
 * Check if redirect loop is occurring
 */
const isRedirectLoop = () => {
  return getRedirectCount() >= MAX_REDIRECT_COUNT;
};

/**
 * Store intended destination
 */
const storeIntendedDestination = (path) => {
  try {
    sessionStorage.setItem(STORAGE_KEY_REDIRECT, path);
  } catch (error) {
    console.error('Failed to store intended destination:', error);
  }
};

/**
 * Get intended destination
 */
const getIntendedDestination = () => {
  try {
    const path = sessionStorage.getItem(STORAGE_KEY_REDIRECT);
    sessionStorage.removeItem(STORAGE_KEY_REDIRECT);
    return path;
  } catch (error) {
    console.error('Failed to get intended destination:', error);
    return null;
  }
};

/**
 * Determine redirect path based on user role and preferences
 */
const getRedirectPath = (user, defaultPath = DASHBOARD_ROUTES.DEFAULT) => {
  if (!user) return defaultPath;

  // Check for stored intended destination
  const intendedDestination = getIntendedDestination();
  if (intendedDestination && !Object.values(PUBLIC_PAGES).includes(intendedDestination)) {
    return intendedDestination;
  }

  // Role-based redirect
  const userRole = user.role || user.user_type || user.userType;
  
  switch (userRole?.toLowerCase()) {
    case 'admin':
    case 'administrator':
      return DASHBOARD_ROUTES.ADMIN;
    
    case 'manager':
    case 'moderator':
      return DASHBOARD_ROUTES.MANAGER;
    
    case 'user':
    default:
      // Check user preferences
      if (user.preferences?.defaultLandingPage) {
        return user.preferences.defaultLandingPage;
      }
      return DASHBOARD_ROUTES.DEFAULT;
  }
};

/**
 * Check if current path is a public page
 */
const isPublicPage = (pathname) => {
  return Object.values(PUBLIC_PAGES).some(page => 
    pathname.startsWith(page)
  );
};

/**
 * Sanitize redirect path to prevent open redirect vulnerabilities
 */
const sanitizeRedirectPath = (path) => {
  // Remove any protocol or domain
  const sanitized = path.replace(/^https?:\/\/[^/]+/, '');
  
  // Ensure path starts with /
  if (!sanitized.startsWith('/')) {
    return '/' + sanitized;
  }
  
  return sanitized;
};

// =============================================================================
// LOADING COMPONENT
// =============================================================================

const LoadingScreen = () => {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="public-route-loader">
      <div className="public-route-loader__spinner" />
    </div>
  );
};

// =============================================================================
// ERROR COMPONENT
// =============================================================================

const ErrorScreen = ({ message, onRetry }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="public-route-error">
      <div className="public-route-error__content">
        <svg 
          className="public-route-error__icon" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        <h2 className="public-route-error__title">Authentication Error</h2>
        <p className="public-route-error__message">
          {message || 'Failed to verify authentication status. Please try again.'}
        </p>
        {onRetry && (
          <button 
            className="public-route-error__button"
            onClick={onRetry}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

ErrorScreen.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func,
};

// =============================================================================
// MAIN PUBLIC ROUTE COMPONENT
// =============================================================================

const PublicRoute = ({ 
  children,
  redirectTo = null,
  showLoader = true,
  checkVerification = false,
  customRedirectLogic = null,
  onRedirect = null,
  trackAnalytics = true,
}) => {
  const { isAuthenticated, isLoading, user, error: authError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [authCheckTimeout, setAuthCheckTimeout] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auth check timeout
  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setAuthCheckTimeout(true);
        }
      }, AUTH_CHECK_TIMEOUT);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setAuthCheckTimeout(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading]);

  // Store current location for redirect after login
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== PUBLIC_PAGES.LOGIN) {
      const currentPath = location.pathname + location.search;
      if (!isPublicPage(currentPath)) {
        storeIntendedDestination(currentPath);
      }
    }
  }, [isAuthenticated, location]);

  // Track analytics
  useEffect(() => {
    if (trackAnalytics && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname,
        page_title: document.title,
        authenticated: isAuthenticated,
      });
    }
  }, [location.pathname, isAuthenticated, trackAnalytics]);

  // Handle retry for auth errors
  const handleRetry = useCallback(() => {
    setAuthCheckTimeout(false);
    window.location.reload();
  }, []);

  // Perform redirect
  const performRedirect = useCallback(() => {
    if (redirecting || !isMountedRef.current) return null;

    // Check for redirect loop
    if (isRedirectLoop()) {
      console.error('Redirect loop detected');
      resetRedirectCount();
      return <Navigate to={DASHBOARD_ROUTES.DEFAULT} replace />;
    }

    incrementRedirectCount();
    setRedirecting(true);

    // Determine redirect destination
    let destination;

    if (customRedirectLogic) {
      destination = customRedirectLogic(user, location);
    } else if (redirectTo) {
      destination = redirectTo;
    } else {
      destination = getRedirectPath(user, DASHBOARD_ROUTES.DEFAULT);
    }

    // Sanitize redirect path
    destination = sanitizeRedirectPath(destination);

    // Call redirect callback
    if (onRedirect) {
      try {
        onRedirect(destination, user);
      } catch (error) {
        console.error('Redirect callback error:', error);
      }
    }

    // Use setTimeout to prevent React state update warnings
    setTimeout(() => {
      if (isMountedRef.current) {
        resetRedirectCount();
      }
    }, REDIRECT_DELAY);

    return (
      <Navigate 
        to={destination}
        replace 
        state={{ from: location }}
      />
    );
  }, [user, location, redirectTo, customRedirectLogic, onRedirect, redirecting]);

  // Handle authentication check timeout
  if (authCheckTimeout) {
    return (
      <ErrorScreen 
        message="Authentication check is taking longer than expected."
        onRetry={handleRetry}
      />
    );
  }

  // Handle authentication errors
  if (authError && !isLoading) {
    return (
      <ErrorScreen 
        message={authError.message || 'Authentication error occurred.'}
        onRetry={handleRetry}
      />
    );
  }

  // Show loader during auth check
  if (isLoading && showLoader) {
    return <LoadingScreen />;
  }

  // Redirect authenticated users
  if (isAuthenticated && user) {
    // Check email verification if required
    if (checkVerification && !user.email_verified && !user.emailVerified) {
      // Allow access to verification-related pages
      if (location.pathname === PUBLIC_PAGES.VERIFY_EMAIL) {
        return <>{children || <outlet />}</>;
      }
      // Redirect to email verification
      return (
        <Navigate 
          to={PUBLIC_PAGES.VERIFY_EMAIL}
          replace 
          state={{ from: location }}
        />
      );
    }

    return performRedirect();
  }

// Render protected content
return <>{children || <Outlet />}</>;
};

PublicRoute.propTypes = {
  children: PropTypes.node,  // removed .isRequired
  redirectTo: PropTypes.string,
  showLoader: PropTypes.bool,
  checkVerification: PropTypes.bool,
  customRedirectLogic: PropTypes.func,
  onRedirect: PropTypes.func,
  trackAnalytics: PropTypes.bool,
};

export default PublicRoute;

// =============================================================================
// ENHANCED VARIANTS
// =============================================================================

/**
 * PublicRoute with Memory - Remembers last authenticated page
 */
export const PublicRouteWithMemory = ({ children, ...props }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      try {
        localStorage.setItem('lastAuthenticatedPath', location.pathname);
      } catch (error) {
        console.error('Failed to store last path:', error);
      }
    }
  }, [isAuthenticated, location.pathname]);

  const customRedirect = useCallback((user) => {
    try {
      const lastPath = localStorage.getItem('lastAuthenticatedPath');
      if (lastPath && !isPublicPage(lastPath)) {
        return lastPath;
      }
    } catch (error) {
      console.error('Failed to retrieve last path:', error);
    }
    return getRedirectPath(user);
  }, []);

  return (
    <PublicRoute 
      {...props} 
      customRedirectLogic={customRedirect}
    >
      {children}
    </PublicRoute>
  );
};

PublicRouteWithMemory.propTypes = {
  children: PropTypes.node,  // removed .isRequired
};

/**
 * PublicRoute with Session Timeout Warning
 */
export const PublicRouteWithSession = ({ children, sessionTimeout = 3600000, ...props }) => {
  const [showWarning, setShowWarning] = useState(false);
  const warningTimeoutRef = useRef(null);

  useEffect(() => {
    const warningTime = sessionTimeout - 300000; // 5 minutes before timeout
    
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
    }, warningTime);

    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [sessionTimeout]);

  const handleExtendSession = useCallback(() => {
    setShowWarning(false);
    // Trigger session extension logic here
  }, []);

  return (
    <>
      {showWarning && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          padding: '1rem 1.5rem',
          background: '#fef3c7',
          border: '2px solid #fbbf24',
          borderRadius: '8px',
          zIndex: 10000,
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>
            Your session will expire soon
          </p>
          <button
            onClick={handleExtendSession}
            style={{
              padding: '0.5rem 1rem',
              background: '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Extend Session
          </button>
        </div>
      )}
      <PublicRoute {...props}>{children}</PublicRoute>
    </>
  );
};

PublicRouteWithSession.propTypes = {
  children: PropTypes.node,  // removed .isRequired
  sessionTimeout: PropTypes.number,
};

/**
 * PublicRoute with Feature Flags
 */
export const PublicRouteWithFeatureFlags = ({ 
  children, 
  requiredFeatures = [],
  ...props 
}) => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    if (user && requiredFeatures.length > 0) {
      const userFeatures = user.features || user.featureFlags || [];
      const hasAllFeatures = requiredFeatures.every(feature => 
        userFeatures.includes(feature)
      );
      setHasAccess(hasAllFeatures);
    }
  }, [user, requiredFeatures]);

  if (!hasAccess) {
    return (
      <Navigate 
        to="/access-denied" 
        replace 
        state={{ requiredFeatures }}
      />
    );
  }

  return <PublicRoute {...props}>{children}</PublicRoute>;
};

PublicRouteWithFeatureFlags.propTypes = {
  children: PropTypes.node,  // removed .isRequired
  requiredFeatures: PropTypes.arrayOf(PropTypes.string),
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  LoadingScreen,
  ErrorScreen,
  getRedirectPath,
  isPublicPage,
  sanitizeRedirectPath,
  DASHBOARD_ROUTES,
  PUBLIC_PAGES,
};
