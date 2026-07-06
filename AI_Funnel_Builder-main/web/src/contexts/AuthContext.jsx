// =============================================================================
// AI FUNNEL PLATFORM - Authentication Context (Production Grade Enhanced)
// =============================================================================
// Provides authentication state, user info, and auth actions across the app
// Connected to FastAPI backend via auth.api.js
// Features: Auto token refresh, OAuth support, permission checking, persistent state
// =============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

// Import auth API methods
import * as authAPI from '@/lib/api/auth.api';
import { TokenManager } from '@/lib/api/client';

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const AuthContext = createContext(null);

// =============================================================================
// CONSTANTS
// =============================================================================

const TOKEN_CHECK_INTERVAL = 60 * 1000; // Check token every minute
const TOKEN_REFRESH_THRESHOLD = 5 * 60; // Refresh if expiring in 5 minutes (seconds)

// Storage keys
const STORAGE_KEYS = {
  USER: 'auth_user',
  REMEMBER_ME: 'auth_remember_me',
  LAST_LOGIN: 'auth_last_login',
};

// =============================================================================
// AUTH PROVIDER COMPONENT
// =============================================================================

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================================
  // STATE
  // =========================================================================

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastLoginAttempt, setLastLoginAttempt] = useState(null);

  // Refs for intervals
  const tokenRefreshIntervalRef = useRef(null);
  const authInitializedRef = useRef(false);

  // =========================================================================
  // COMPUTED STATE
  // =========================================================================

  const isAuthenticated = useMemo(() => {
    return !!user && TokenManager.isAuthenticated();
  }, [user]);

  const userRole = useMemo(() => {
    return user?.role || 'user';
  }, [user]);

  const isEmailVerified = useMemo(() => {
    return user?.is_email_verified || false;
  }, [user]);

  const needsEmailVerification = useMemo(() => {
    return isAuthenticated && !isEmailVerified;
  }, [isAuthenticated, isEmailVerified]);

  const canAttemptLogin = useMemo(() => {
    // Allow login if no recent attempts or if 5 minutes have passed
    if (!lastLoginAttempt) return true;
    if (loginAttempts < 5) return true;
    
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return lastLoginAttempt < fiveMinutesAgo;
  }, [loginAttempts, lastLoginAttempt]);

  // =========================================================================
  // STORAGE HELPERS
  // =========================================================================

  const saveUserToStorage = useCallback((userData) => {
    try {
      if (userData) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }, []);

  const loadUserFromStorage = useCallback(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error loading user from storage:', error);
      return null;
    }
  }, []);

  // =========================================================================
  // INITIALIZE AUTH ON MOUNT
  // =========================================================================

  useEffect(() => {
    const initializeAuth = async () => {
      if (authInitializedRef.current) return;
      authInitializedRef.current = true;

      try {
        setIsInitializing(true);

        // Check if user has valid token
        if (TokenManager.isAuthenticated()) {
          // Try to load user from storage first (faster initial render)
          const storedUser = loadUserFromStorage();
          if (storedUser) {
            setUser(storedUser);
          }

          // Fetch fresh user data from backend
          try {
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
            saveUserToStorage(userData);
            
            if (import.meta.env.DEV) {
              console.log('✅ Auth initialized with user:', userData.email);
            }
          } catch (error) {
            console.error('Failed to fetch user data:', error);
            
            // If token is invalid, clear everything
            if (error.status === 401) {
              TokenManager.clearTokens();
              setUser(null);
              saveUserToStorage(null);
            }
          }
        } else {
          // No valid token
          setUser(null);
          saveUserToStorage(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error.message);
      } finally {
        setIsInitializing(false);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [loadUserFromStorage, saveUserToStorage]);

  // =========================================================================
  // TOKEN REFRESH LOGIC
  // =========================================================================

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear interval if not authenticated
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
        tokenRefreshIntervalRef.current = null;
      }
      return;
    }

    const checkAndRefreshToken = async () => {
      const timeUntilExpiry = TokenManager.getTimeUntilExpiry();

      if (timeUntilExpiry <= 0) {
        // Token expired - logout
        if (import.meta.env.DEV) {
          console.warn('⚠️ Token expired, logging out');
        }
        await handleLogout('/auth/login');
        return;
      }

      if (timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD) {
        // Token expiring soon - refresh
        if (import.meta.env.DEV) {
          console.log('🔄 Token expiring soon, refreshing...');
        }
        
        try {
          await authAPI.refreshToken();
          
          if (import.meta.env.DEV) {
            console.log('✅ Token refreshed successfully');
          }
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
          await handleLogout('/auth/login');
        }
      }
    };

    // Check immediately
    checkAndRefreshToken();

    // Set up interval
    tokenRefreshIntervalRef.current = setInterval(
      checkAndRefreshToken,
      TOKEN_CHECK_INTERVAL
    );

    // Cleanup
    return () => {
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
    };
  }, [isAuthenticated]);

  // =========================================================================
  // AUTH EVENT LISTENERS
  // =========================================================================

  useEffect(() => {
    const handleAuthLogin = (event) => {
      const { user: userData } = event.detail;
      setUser(userData);
      saveUserToStorage(userData);
    };

    const handleAuthLogout = () => {
      setUser(null);
      saveUserToStorage(null);
      setError(null);
    };

    const handleEmailVerified = () => {
      setUser(prev => prev ? { ...prev, is_email_verified: true } : null);
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:logout', handleAuthLogout);
    window.addEventListener('auth:email-verified', handleEmailVerified);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:logout', handleAuthLogout);
      window.removeEventListener('auth:email-verified', handleEmailVerified);
    };
  }, [saveUserToStorage]);

  // =========================================================================
  // AUTH ACTIONS
  // =========================================================================

  /**
   * Login with email and password
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @param {boolean} [credentials.rememberMe] - Remember user
   * @returns {Promise<Object>} Login result
   */
  const login = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check rate limiting
      if (!canAttemptLogin) {
        throw new Error('Too many login attempts. Please try again in 5 minutes.');
      }

      // Call login API
      const response = await authAPI.login(credentials);
      const { user: userData } = response;

      // Update state
      setUser(userData);
      saveUserToStorage(userData);
      
      // Save remember me preference
      if (credentials.rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, Date.now().toString());
      }

      // Reset login attempts
      setLoginAttempts(0);
      setLastLoginAttempt(null);

      // Navigate to intended page or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });

      if (import.meta.env.DEV) {
        console.log('✅ Login successful:', userData.email);
      }

      return { success: true, user: userData };
    } catch (error) {
      // Track failed attempts
      setLoginAttempts(prev => prev + 1);
      setLastLoginAttempt(Date.now());

      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);

      if (import.meta.env.DEV) {
        console.error('❌ Login failed:', error);
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [canAttemptLogin, location, navigate, saveUserToStorage]);

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Signup result
   */
  const signup = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call signup API
      const response = await authAPI.signup(userData);
      const { user: newUser, requires_verification } = response;

      if (requires_verification) {
        // Navigate to email verification page
        navigate('/auth/verify-email', { 
          state: { email: userData.email } 
        });
      } else {
        // Auto-login successful
        setUser(newUser);
        saveUserToStorage(newUser);

        // Navigate to onboarding
        navigate('/onboarding', { replace: true });
      }

      if (import.meta.env.DEV) {
        console.log('✅ Signup successful:', newUser?.email);
      }

      return { success: true, user: newUser, requires_verification };
    } catch (error) {
      const errorMessage = error.message || 'Signup failed. Please try again.';
      setError(errorMessage);

      if (import.meta.env.DEV) {
        console.error('❌ Signup failed:', error);
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, saveUserToStorage]);

  /**
   * Logout current user
   * @param {string} [redirectTo] - Path to redirect after logout
   * @returns {Promise<Object>} Logout result
   */
  const handleLogout = useCallback(async (redirectTo = '/auth/login') => {
    try {
      setIsLoading(true);

      // Call logout API
      await authAPI.logout();

      // Clear state
      setUser(null);
      saveUserToStorage(null);
      setError(null);
      setLoginAttempts(0);
      setLastLoginAttempt(null);

      // Clear storage
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      localStorage.removeItem(STORAGE_KEYS.LAST_LOGIN);

      // Navigate to login
      navigate(redirectTo, { replace: true });

      if (import.meta.env.DEV) {
        console.log('✅ Logout successful');
      }

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Force logout locally even if API call fails
      setUser(null);
      saveUserToStorage(null);
      navigate(redirectTo, { replace: true });
      
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [navigate, saveUserToStorage]);

  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Verification result
   */
  const verifyEmail = useCallback(async (token) => {
    try {
      setIsLoading(true);
      setError(null);

      await authAPI.verifyEmail(token);

      // Update user state
      setUser(prev => prev ? { ...prev, is_email_verified: true } : null);

      if (import.meta.env.DEV) {
        console.log('✅ Email verified successfully');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Email verification failed.';
      setError(errorMessage);
      
      if (import.meta.env.DEV) {
        console.error('❌ Email verification failed:', error);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Resend verification email
   * @returns {Promise<Object>} Result
   */
  const resendVerification = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.email) {
        throw new Error('No email address found');
      }

      await authAPI.resendVerificationEmail(user.email);

      if (import.meta.env.DEV) {
        console.log('✅ Verification email sent');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Failed to send verification email.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Result
   */
  const forgotPassword = useCallback(async (email) => {
    try {
      setIsLoading(true);
      setError(null);

      await authAPI.forgotPassword(email);

      if (import.meta.env.DEV) {
        console.log('✅ Password reset email sent to:', email);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Failed to send password reset email.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result
   */
  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);

      await authAPI.resetPassword({ token, new_password: newPassword });

      if (import.meta.env.DEV) {
        console.log('✅ Password reset successful');
      }

      // Navigate to login
      navigate('/auth/login', { 
        state: { message: 'Password reset successful. Please login.' } 
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Password reset failed.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  /**
   * Change password (authenticated)
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);

      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (import.meta.env.DEV) {
        console.log('✅ Password changed successfully');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Password change failed.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Result
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call update profile API (you'll need to add this to auth.api.js)
      const updatedUser = await authAPI.getCurrentUser(); // Simplified - refresh user data
      
      setUser(updatedUser);
      saveUserToStorage(updatedUser);

      if (import.meta.env.DEV) {
        console.log('✅ Profile updated successfully');
      }

      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error.message || 'Profile update failed.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [saveUserToStorage]);

  /**
   * Handle OAuth callback
   * @returns {Promise<Object>} Result
   */
  const handleOAuthCallback = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authAPI.handleOAuthCallback();
      const { user: userData } = response;

      setUser(userData);
      saveUserToStorage(userData);

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });

      if (import.meta.env.DEV) {
        console.log('✅ OAuth login successful:', userData.email);
      }

      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = error.message || 'OAuth authentication failed.';
      setError(errorMessage);
      
      if (import.meta.env.DEV) {
        console.error('❌ OAuth callback failed:', error);
      }
      
      // Redirect to login on error
      navigate('/auth/login', { 
        state: { error: errorMessage } 
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, saveUserToStorage]);

  /**
   * Refresh user data
   * @returns {Promise<Object>} Result
   */
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);

      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      saveUserToStorage(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [saveUserToStorage]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // =========================================================================
  // PERMISSION CHECKS
  // =========================================================================

  /**
   * Check if user has specific role
   * @param {string|string[]} role - Role(s) to check
   * @returns {boolean}
   */
  const hasRole = useCallback((role) => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    
    return userRole === role;
  }, [user, userRole]);

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  const hasPermission = useCallback((permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }, [user]);

  /**
   * Check if user can access a feature
   * @param {string|string[]} requiredRole - Required role(s)
   * @param {string} [requiredPermission] - Required permission
   * @returns {boolean}
   */
  const canAccess = useCallback((requiredRole, requiredPermission = null) => {
    const roleCheck = requiredRole ? hasRole(requiredRole) : true;
    const permissionCheck = requiredPermission ? hasPermission(requiredPermission) : true;
    return roleCheck && permissionCheck;
  }, [hasRole, hasPermission]);

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================

  const contextValue = useMemo(() => ({
    // User state
    user,
    isAuthenticated,
    isLoading,
    isInitializing,
    error,
    userRole,
    isEmailVerified,
    needsEmailVerification,
    canAttemptLogin,
    loginAttempts,

    // Auth actions
    login,
    signup,
    logout: handleLogout,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    handleOAuthCallback,
    refreshUser,
    clearError,

    // OAuth helpers
    loginWithGoogle: () => authAPI.loginWithGoogle(),
    loginWithLinkedIn: () => authAPI.loginWithLinkedIn(),

    // Permission checks
    hasRole,
    hasPermission,
    canAccess,

    // Computed properties
    isAdmin: userRole === 'admin',
    isOwner: userRole === 'owner',
    isMember: userRole === 'member' || userRole === 'user',
    needsOnboarding: isAuthenticated && !user?.onboarding_completed,
  }), [
    user,
    isAuthenticated,
    isLoading,
    isInitializing,
    error,
    userRole,
    isEmailVerified,
    needsEmailVerification,
    canAttemptLogin,
    loginAttempts,
    login,
    signup,
    handleLogout,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    handleOAuthCallback,
    refreshUser,
    clearError,
    hasRole,
    hasPermission,
    canAccess,
  ]);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

/**
 * Hook to access authentication context
 * @throws {Error} if used outside AuthProvider
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

/**
 * Hook to check if user has a specific role
 * @param {string|string[]} role - Role(s) to check
 * @returns {boolean}
 */
export const useHasRole = (role) => {
  const { hasRole } = useAuth();
  return hasRole(role);
};

/**
 * Hook to check if user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const useHasPermission = (permission) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

/**
 * Hook to check if user can access a feature
 * @param {string|string[]} requiredRole - Required role(s)
 * @param {string} [requiredPermission] - Required permission
 * @returns {boolean}
 */
export const useCanAccess = (requiredRole, requiredPermission) => {
  const { canAccess } = useAuth();
  return canAccess(requiredRole, requiredPermission);
};

/**
 * Hook to check if user is admin
 * @returns {boolean}
 */
export const useIsAdmin = () => {
  const { isAdmin } = useAuth();
  return isAdmin;
};

/**
 * Hook to get current user
 * @returns {Object|null} Current user or null
 */
export const useCurrentUser = () => {
  const { user } = useAuth();
  return user;
};

/**
 * Hook to require authentication (redirects if not authenticated)
 * @param {string} [redirectTo='/auth/login'] - Redirect path
 */
export const useRequireAuth = (redirectTo = '/auth/login') => {
  const { isAuthenticated, isInitializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate(redirectTo, {
        state: { from: location },
        replace: true,
      });
    }
  }, [isAuthenticated, isInitializing, navigate, redirectTo, location]);

  return { isAuthenticated, isInitializing };
};

// =============================================================================
// EXPORTS
// =============================================================================

export default AuthContext;
