// =============================================================================
// AI FUNNEL PLATFORM - ProtectedRoute Component (Enhanced Production)
// =============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { refreshToken } from '@/lib/api/auth.api';

// =============================================================================
// CONSTANTS
// =============================================================================

const TOKEN_REFRESH_INTERVAL = 840000; // 14 minutes (before 15 min expiry)
const TOKEN_CHECK_INTERVAL = 60000; // 1 minute
const AUTH_CHECK_TIMEOUT = 5000; // 5 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRY: 'token_expiry',
  LAST_ACTIVITY: 'last_activity',
  SESSION_ID: 'session_id',
};

const INACTIVITY_TIMEOUT = 1800000; // 30 minutes
const SESSION_WARNING_TIME = 300000; // 5 minutes before timeout

// =============================================================================
// STYLED COMPONENTS
// =============================================================================

const PROTECTED_ROUTE_STYLES = `
.protected-route-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 99999;
  gap: 2rem;
}

.protected-route-loader__spinner {
  width: 64px;
  height: 64px;
  border: 6px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.protected-route-loader__text {
  color: #ffffff;
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.protected-route-loader__logo {
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  margin-bottom: 1rem;
}

.session-warning {
  position: fixed;
  top: 20px;
  right: 20px;
  left: 20px;
  max-width: 450px;
  margin: 0 auto;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 100000;
  animation: slideDown 0.4s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.session-warning__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.session-warning__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  border-radius: 12px;
  flex-shrink: 0;
}

.session-warning__icon svg {
  width: 28px;
  height: 28px;
  color: #ffffff;
}

.session-warning__title {
  font-size: 1.125rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.session-warning__message {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.session-warning__timer {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 6px;
  font-weight: 700;
  font-size: 1rem;
}

.session-warning__actions {
  display: flex;
  gap: 0.75rem;
}

.session-warning__button {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.session-warning__button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.session-warning__button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.session-warning__button--secondary {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.session-warning__button--secondary:hover {
  background: #e5e7eb;
}

.access-denied {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  z-index: 99999;
  padding: 2rem;
}

.access-denied__content {
  max-width: 600px;
  text-align: center;
  background: #ffffff;
  padding: 3rem;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.access-denied__icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fee2e2;
  border-radius: 50%;
}

.access-denied__icon svg {
  width: 48px;
  height: 48px;
  color: #ef4444;
}

.access-denied__title {
  font-size: 2rem;
  font-weight: 900;
  color: #111827;
  margin: 0 0 1rem 0;
}

.access-denied__message {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.access-denied__button {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.access-denied__button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .session-warning {
    left: 10px;
    right: 10px;
  }

  .session-warning__actions {
    flex-direction: column;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'protected-route');
  styleElement.textContent = PROTECTED_ROUTE_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if token is expired
 */
const isTokenExpired = () => {
  try {
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiry) return true;
    
    const expiryTime = parseInt(expiry, 10);
    const currentTime = Date.now();
    
    return currentTime >= expiryTime;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
};

/**
 * Get time until token expires
 */
const getTimeUntilExpiry = () => {
  try {
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiry) return 0;
    
    const expiryTime = parseInt(expiry, 10);
    const currentTime = Date.now();
    
    return Math.max(0, expiryTime - currentTime);
  } catch (error) {
    console.error('Error getting time until expiry:', error);
    return 0;
  }
};

/**
 * Check if user has required role
 */
const hasRequiredRole = (userRole, requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!userRole) return false;
  
  const normalizedUserRole = userRole.toLowerCase();
  return requiredRoles.some(role => role.toLowerCase() === normalizedUserRole);
};

/**
 * Check if user has required permissions
 */
const hasRequiredPermissions = (userPermissions, requiredPermissions) => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
};

/**
 * Update last activity timestamp
 */
const updateLastActivity = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  } catch (error) {
    console.error('Error updating last activity:', error);
  }
};

/**
 * Get time since last activity
 */
const getTimeSinceLastActivity = () => {
  try {
    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    if (!lastActivity) return Infinity;
    
    const lastActivityTime = parseInt(lastActivity, 10);
    const currentTime = Date.now();
    
    return currentTime - lastActivityTime;
  } catch (error) {
    console.error('Error getting time since last activity:', error);
    return Infinity;
  }
};

/**
 * Generate session ID
 */
const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const LoadingScreen = () => {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="protected-route-loader">
      <div className="protected-route-loader__logo">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div className="protected-route-loader__spinner" />
      <div className="protected-route-loader__text">Verifying authentication...</div>
    </div>
  );
};

const SessionWarning = ({ timeRemaining, onExtend, onLogout }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div className="session-warning">
      <div className="session-warning__header">
        <div className="session-warning__icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="session-warning__title">Session Expiring Soon</h3>
      </div>
      <p className="session-warning__message">
        Your session will expire in{' '}
        <span className="session-warning__timer">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
        . Would you like to extend your session?
      </p>
      <div className="session-warning__actions">
        <button
          className="session-warning__button session-warning__button--primary"
          onClick={onExtend}
        >
          Extend Session
        </button>
        <button
          className="session-warning__button session-warning__button--secondary"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

SessionWarning.propTypes = {
  timeRemaining: PropTypes.number.isRequired,
  onExtend: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

const AccessDenied = ({ message, onGoBack }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="access-denied">
      <div className="access-denied__content">
        <div className="access-denied__icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="access-denied__title">Access Denied</h2>
        <p className="access-denied__message">
          {message || 'You do not have permission to access this page.'}
        </p>
        <button className="access-denied__button" onClick={onGoBack}>
          Go Back to Dashboard
        </button>
      </div>
    </div>
  );
};

AccessDenied.propTypes = {
  message: PropTypes.string,
  onGoBack: PropTypes.func.isRequired,
};

// =============================================================================
// MAIN PROTECTED ROUTE COMPONENT
// =============================================================================

const ProtectedRoute = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  redirectTo = '/login',
  checkEmailVerification = false,
  showLoader = true,
  enableInactivityTimeout = true,
  enableTokenRefresh = true,
  customAccessCheck = null,
  onAccessDenied = null,
  onSessionExpired = null,
}) => {
  const { isAuthenticated, isLoading, user, logout, error: authError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [authCheckTimeout, setAuthCheckTimeout] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(INACTIVITY_TIMEOUT);
  const [tokenRefreshFailed, setTokenRefreshFailed] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');

  const authCheckTimeoutRef = useRef(null);
  const tokenRefreshIntervalRef = useRef(null);
  const sessionCheckIntervalRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const sessionWarningTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasNavigatedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (authCheckTimeoutRef.current) clearTimeout(authCheckTimeoutRef.current);
      if (tokenRefreshIntervalRef.current) clearInterval(tokenRefreshIntervalRef.current);
      if (sessionCheckIntervalRef.current) clearInterval(sessionCheckIntervalRef.current);
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      if (sessionWarningTimeoutRef.current) clearTimeout(sessionWarningTimeoutRef.current);
    };
  }, []);

  // Generate session ID on mount
  useEffect(() => {
    if (isAuthenticated && !localStorage.getItem(STORAGE_KEYS.SESSION_ID)) {
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, generateSessionId());
    }
  }, [isAuthenticated]);

  // Auth check timeout
  useEffect(() => {
    if (isLoading) {
      authCheckTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setAuthCheckTimeout(true);
        }
      }, AUTH_CHECK_TIMEOUT);
    } else {
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
      setAuthCheckTimeout(false);
    }
  }, [isLoading]);

  // Token refresh mechanism
  useEffect(() => {
    if (!isAuthenticated || !enableTokenRefresh) return;

    const performTokenRefresh = async () => {
      if (isTokenExpired()) {
        try {
          const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (storedRefreshToken) {
            const response = await refreshToken({ refresh_token: storedRefreshToken });
            
            if (response.access_token) {
              localStorage.setItem(STORAGE_KEYS.TOKEN, response.access_token);
              if (response.refresh_token) {
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
              }
              if (response.expires_in) {
                const expiryTime = Date.now() + response.expires_in * 1000;
                localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
              }
              setTokenRefreshFailed(false);
              setRetryAttempts(0);
            }
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          setRetryAttempts(prev => prev + 1);
          
          if (retryAttempts >= MAX_RETRY_ATTEMPTS) {
            setTokenRefreshFailed(true);
            if (onSessionExpired) {
              onSessionExpired();
            }
            handleLogout();
          }
        }
      }
    };

    performTokenRefresh();
    tokenRefreshIntervalRef.current = setInterval(performTokenRefresh, TOKEN_REFRESH_INTERVAL);

    return () => {
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
    };
  }, [isAuthenticated, enableTokenRefresh, retryAttempts, onSessionExpired]);

  // Inactivity monitoring
  useEffect(() => {
    if (!isAuthenticated || !enableInactivityTimeout) return;

    const resetInactivityTimer = () => {
      updateLastActivity();

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (sessionWarningTimeoutRef.current) {
        clearTimeout(sessionWarningTimeoutRef.current);
      }

      setShowSessionWarning(false);

      // Set warning before timeout
      sessionWarningTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setShowSessionWarning(true);
        }
      }, INACTIVITY_TIMEOUT - SESSION_WARNING_TIME);

      // Set actual timeout
      activityTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          handleLogout();
        }
      }, INACTIVITY_TIMEOUT);
    };

    // Activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      if (sessionWarningTimeoutRef.current) clearTimeout(sessionWarningTimeoutRef.current);
    };
  }, [isAuthenticated, enableInactivityTimeout]);

  // Session warning countdown
  useEffect(() => {
    if (!showSessionWarning) return;

    const updateCountdown = () => {
      const timeSinceActivity = getTimeSinceLastActivity();
      const remaining = Math.max(0, INACTIVITY_TIMEOUT - timeSinceActivity);
      setSessionTimeRemaining(remaining);

      if (remaining === 0) {
        handleLogout();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [showSessionWarning]);

  // Access control check
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Custom access check
    if (customAccessCheck) {
      const hasAccess = customAccessCheck(user, location);
      if (!hasAccess) {
        setAccessDenied(true);
        setAccessDeniedMessage('You do not have permission to access this resource.');
        if (onAccessDenied) {
          onAccessDenied(user, location);
        }
        return;
      }
    }

    // Role-based check
    if (requiredRoles.length > 0) {
      const userRole = user.role || user.user_type || user.userType;
      if (!hasRequiredRole(userRole, requiredRoles)) {
        setAccessDenied(true);
        setAccessDeniedMessage(`This page requires one of the following roles: ${requiredRoles.join(', ')}`);
        if (onAccessDenied) {
          onAccessDenied(user, location);
        }
        return;
      }
    }

    // Permission-based check
    if (requiredPermissions.length > 0) {
      const userPermissions = user.permissions || [];
      if (!hasRequiredPermissions(userPermissions, requiredPermissions)) {
        setAccessDenied(true);
        setAccessDeniedMessage('You do not have the required permissions to access this page.');
        if (onAccessDenied) {
          onAccessDenied(user, location);
        }
        return;
      }
    }

    // Email verification check
    if (checkEmailVerification && !user.email_verified && !user.emailVerified) {
      setAccessDenied(true);
      setAccessDeniedMessage('Please verify your email address to access this page.');
      return;
    }

    setAccessDenied(false);
  }, [
    isAuthenticated,
    user,
    requiredRoles,
    requiredPermissions,
    checkEmailVerification,
    customAccessCheck,
    location,
    onAccessDenied,
  ]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout]);

  // Handle session extension
  const handleExtendSession = useCallback(() => {
    updateLastActivity();
    setShowSessionWarning(false);
  }, []);

  // Handle go back from access denied
  const handleGoBack = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Show access denied screen
  if (accessDenied && isAuthenticated) {
    return (
      <AccessDenied
        message={accessDeniedMessage}
        onGoBack={handleGoBack}
      />
    );
  }

  // Show session warning
  if (showSessionWarning && isAuthenticated) {
    return (
      <>
        <SessionWarning
          timeRemaining={sessionTimeRemaining}
          onExtend={handleExtendSession}
          onLogout={handleLogout}
        />
        {children}
      </>
    );
  }

  // Auth check timeout
  if (authCheckTimeout) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location, reason: 'timeout' }}
      />
    );
  }

  // Token refresh failed
  if (tokenRefreshFailed) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location, reason: 'token_expired' }}
      />
    );
  }

  // Show loader during auth check
  if (isLoading && showLoader) {
    return <LoadingScreen />;
  }

  // Redirect unauthenticated users
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location }}
      />
    );
  }

  // Render protected content
  return <>{children || <Outlet />}</>;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
  requiredPermissions: PropTypes.arrayOf(PropTypes.string),
  redirectTo: PropTypes.string,
  checkEmailVerification: PropTypes.bool,
  showLoader: PropTypes.bool,
  enableInactivityTimeout: PropTypes.bool,
  enableTokenRefresh: PropTypes.bool,
  customAccessCheck: PropTypes.func,
  onAccessDenied: PropTypes.func,
  onSessionExpired: PropTypes.func,
};

export default ProtectedRoute;

// =============================================================================
// ENHANCED VARIANTS
// =============================================================================

/**
 * Admin-only protected route
 */
export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute requiredRoles={['admin', 'administrator']} {...props}>
    {children}
  </ProtectedRoute>
);

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Manager-level protected route
 */
export const ManagerRoute = ({ children, ...props }) => (
  <ProtectedRoute requiredRoles={['admin', 'manager', 'moderator']} {...props}>
    {children}
  </ProtectedRoute>
);

ManagerRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Verified email required route
 */
export const VerifiedRoute = ({ children, ...props }) => (
  <ProtectedRoute checkEmailVerification {...props}>
    {children}
  </ProtectedRoute>
);

VerifiedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  LoadingScreen,
  SessionWarning,
  AccessDenied,
  hasRequiredRole,
  hasRequiredPermissions,
  isTokenExpired,
  getTimeUntilExpiry,
};
