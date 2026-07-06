// =============================================================================
// AI FUNNEL PLATFORM - API Middleware (Production Grade)
// =============================================================================
// Intercept API actions, handle loading/error states globally
// Features: Auto-retry, token refresh, rate limiting, caching, analytics
// Version: 2.1.0 - Synced with auth.slice.js
// =============================================================================

import { isRejectedWithValue } from '@reduxjs/toolkit';

// ✅ FIXED: Import correct action names from auth.slice.js
import {
  setGlobalLoading,
  setOperationLoading,
  showError,
  showWarning,
  showSuccess,
} from '../slices/ui.slice';

import { 
  logout,                    // ✅ Correct: exported as logout
  refreshAccessToken,        // ✅ Correct: exported as refreshAccessToken (not refreshTokenAction)
  selectToken,
  selectRefreshToken,
} from '../slices/auth.slice';

import { updateRateLimit } from '../slices/ai.slice';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // Base delay in ms
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  
  // Rate limiting
  rateLimitHeader: 'X-RateLimit-Remaining',
  rateLimitResetHeader: 'X-RateLimit-Reset',
  
  // Token refresh
  tokenRefreshEnabled: true,
  unauthorizedStatusCode: 401,
  refreshAttempts: 0,
  maxRefreshAttempts: 1, // Prevent infinite refresh loops
  
  // Logging
  enableLogging: process.env.NODE_ENV === 'development',
  logSuccessfulRequests: false,
  logFailedRequests: true,
  
  // Timeouts
  defaultTimeout: 30000, // 30 seconds
  
  // Operations that shouldn't show global loading
  excludeFromGlobalLoading: [
    'auth/refreshAccessToken',  // ✅ Updated to match auth slice action name
    'auth/initializeAuth',
    'ui/fetchNotifications',
    'projects/autoSave',
    'analytics/track',
  ],
  
  // Operations that shouldn't show error toasts
  suppressErrorToasts: [
    'auth/login/rejected',
    'auth/signup/rejected',
    'auth/refreshAccessToken/rejected',  // ✅ Updated
    'auth/initializeAuth/rejected',
  ],
  
  // Cache configuration
  cacheDuration: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100,
  
  // Batch configuration
  batchDelay: 50, // ms
  maxBatchSize: 10,
};

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

let isRefreshing = false;
let refreshSubscribers = [];
let failedQueue = [];

/**
 * Subscribe to token refresh completion
 */
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers when token is refreshed
 */
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
  
  // Retry failed requests
  failedQueue.forEach(({ resolve }) => resolve());
  failedQueue = [];
};

/**
 * Clear refresh state on error
 */
const onRefreshError = (error) => {
  refreshSubscribers = [];
  isRefreshing = false;
  CONFIG.refreshAttempts = 0;
  
  // Reject all failed requests
  failedQueue.forEach(({ reject }) => reject(error));
  failedQueue = [];
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if error is retryable
 */
const isRetryableError = (error) => {
  if (!error?.response) {
    // Network error - retryable
    return true;
  }
  
  const status = error.response.status;
  return CONFIG.retryableStatusCodes.includes(status);
};

/**
 * Calculate retry delay with exponential backoff + jitter
 */
const getRetryDelay = (retryCount) => {
  const exponentialDelay = CONFIG.retryDelay * Math.pow(2, retryCount);
  const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
  return exponentialDelay + jitter;
};

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract error message from various error formats
 */
const extractErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    error?.error ||
    'An unexpected error occurred'
  );
};

/**
 * Get base action type (remove /pending, /fulfilled, /rejected)
 */
const getBaseActionType = (type) => {
  return type.replace(/\/(pending|fulfilled|rejected)$/, '');
};

/**
 * Check if action should be excluded from global loading
 */
const shouldExcludeFromGlobalLoading = (baseType) => {
  return CONFIG.excludeFromGlobalLoading.some(excluded => baseType.includes(excluded));
};

/**
 * Check if action should suppress error toasts
 */
const shouldSuppressErrorToast = (actionType) => {
  return CONFIG.suppressErrorToasts.some(type => actionType.includes(type));
};

// =============================================================================
// LOGGER
// =============================================================================

/**
 * Log API request
 */
const logRequest = (action, timestamp) => {
  if (!CONFIG.enableLogging) return;
  
  const { type, meta } = action;
  console.group(`🌐 API Request: ${type}`);
  console.log('⏰ Timestamp:', new Date(timestamp).toISOString());
  console.log('📦 Action:', action);
  if (meta?.arg) {
    console.log('📝 Params:', meta.arg);
  }
  console.groupEnd();
};

/**
 * Log API response
 */
const logResponse = (action, duration, success = true) => {
  if (!CONFIG.enableLogging) return;
  if (!CONFIG.logSuccessfulRequests && success) return;
  if (!CONFIG.logFailedRequests && !success) return;
  
  const emoji = success ? '✅' : '❌';
  const label = success ? 'Success' : 'Error';
  
  console.group(`${emoji} API ${label}: ${action.type}`);
  console.log('⏱️ Duration:', `${duration}ms`);
  console.log('📦 Action:', action);
  if (action.payload) {
    console.log('📊 Payload:', action.payload);
  }
  if (!success && action.error) {
    console.error('💥 Error:', action.error);
  }
  console.groupEnd();
};

// =============================================================================
// ERROR HANDLERS
// =============================================================================

/**
 * Handle authentication errors with token refresh
 */
const handleAuthError = async (store, error, originalAction) => {
  const { status } = error.response || {};
  
  if (status !== 401) return false;
  
  // Don't try to refresh if we're already logging in/signing up/refreshing
  const actionType = originalAction?.type || '';
  const isAuthAction = ['auth/login', 'auth/signup', 'auth/refreshAccessToken'].some(
    type => actionType.includes(type)
  );
  
  if (isAuthAction) {
    return false;
  }
  
  // Check if token refresh is enabled
  if (!CONFIG.tokenRefreshEnabled) {
    console.log('🚫 Token refresh disabled, logging out');
    await store.dispatch(logout());
    return false;
  }
  
  // Prevent infinite refresh loops
  if (CONFIG.refreshAttempts >= CONFIG.maxRefreshAttempts) {
    console.error('❌ Max refresh attempts reached. Logging out.');
    await store.dispatch(logout());
    CONFIG.refreshAttempts = 0;
    return false;
  }
  
  // Check if we have a refresh token
  const state = store.getState();
  const refreshToken = selectRefreshToken(state);
  
  if (!refreshToken) {
    console.log('🚫 No refresh token available, logging out');
    await store.dispatch(logout());
    return false;
  }
  
  // If already refreshing, queue this request
  if (isRefreshing) {
    console.log('⏳ Token refresh in progress, queueing request');
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }
  
  // Start token refresh
  isRefreshing = true;
  CONFIG.refreshAttempts++;
  
  try {
    console.log('🔄 Attempting to refresh token...');
    
    // ✅ Use refreshAccessToken from auth.slice
    const result = await store.dispatch(refreshAccessToken()).unwrap();
    
    console.log('✅ Token refreshed successfully');
    isRefreshing = false;
    CONFIG.refreshAttempts = 0;
    
    // Notify all waiting requests
    onTokenRefreshed(result.accessToken);
    
    return true; // Indicate that request should be retried
  } catch (refreshError) {
    console.error('❌ Token refresh failed:', refreshError);
    onRefreshError(refreshError);
    
    // Logout user
    await store.dispatch(logout());
    
    return false;
  }
};

/**
 * Handle rate limit errors
 */
const handleRateLimitError = (store, error) => {
  const { headers } = error.response || {};
  
  if (headers) {
    const remaining = headers[CONFIG.rateLimitHeader.toLowerCase()];
    const resetTime = headers[CONFIG.rateLimitResetHeader.toLowerCase()];
    
    if (remaining !== undefined) {
      store.dispatch(updateRateLimit({
        requestsRemaining: parseInt(remaining, 10),
        resetTime: resetTime ? new Date(parseInt(resetTime, 10) * 1000) : null,
      }));
    }
  }
  
  const resetTime = headers?.[CONFIG.rateLimitResetHeader.toLowerCase()];
  const message = resetTime 
    ? `Rate limit exceeded. Resets at ${new Date(parseInt(resetTime, 10) * 1000).toLocaleTimeString()}`
    : 'Rate limit exceeded. Please try again later.';
  
  store.dispatch(showWarning(message));
};

/**
 * Handle network errors
 */
const handleNetworkError = (store, error) => {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  
  const message = isOnline
    ? 'Unable to connect to server. Please try again.'
    : 'You appear to be offline. Please check your connection.';
  
  store.dispatch(showError(message));
  
  console.error('Network error:', error);
};

/**
 * Handle server errors
 */
const handleServerError = (store, error, action) => {
  const { status } = error.response || {};
  const actionType = action.type;
  
  // Don't show toast for suppressed actions
  if (shouldSuppressErrorToast(actionType)) {
    return;
  }
  
  let message = extractErrorMessage(error);
  
  // Override with specific messages for common status codes
  if (status === 500) {
    message = 'Server error. Our team has been notified.';
  } else if (status === 502) {
    message = 'Bad gateway. Please try again.';
  } else if (status === 503) {
    message = 'Service temporarily unavailable. Please try again later.';
  } else if (status === 504) {
    message = 'Request timeout. Please try again.';
  }
  
  store.dispatch(showError(message));
  
  // Log to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error);
    console.error('Production error:', { error, action, status });
  }
};

/**
 * Handle client errors (4xx)
 */
const handleClientError = (store, error, action) => {
  const { status } = error.response || {};
  const actionType = action.type;
  
  // Don't show toast for suppressed actions
  if (shouldSuppressErrorToast(actionType)) {
    return;
  }
  
  let message = extractErrorMessage(error);
  
  // Override with specific messages
  if (status === 400) {
    message = message || 'Invalid request. Please check your input.';
  } else if (status === 403) {
    message = 'Access forbidden. You don\'t have permission to perform this action.';
  } else if (status === 404) {
    message = 'Resource not found.';
  } else if (status === 422) {
    message = message || 'Validation error. Please check your input.';
  }
  
  store.dispatch(showError(message));
};

// =============================================================================
// MAIN API MIDDLEWARE
// =============================================================================

/**
 * API Middleware - Intercepts all Redux actions
 */
export const apiMiddleware = (store) => (next) => (action) => {
  const { type, meta = {} } = action;
  const requestStartTime = Date.now();
  
  // ==========================================================================
  // PENDING: Request Started
  // ==========================================================================
  
  if (type.endsWith('/pending')) {
    const baseType = getBaseActionType(type);
    
    // Log request
    logRequest(action, requestStartTime);
    
    // Set loading state
    if (!shouldExcludeFromGlobalLoading(baseType)) {
      store.dispatch(setGlobalLoading(true));
    }
    
    // Set operation-specific loading
    store.dispatch(setOperationLoading({
      operation: baseType,
      isLoading: true,
    }));
    
    // Store start time for duration calculation
    action.meta = {
      ...meta,
      startTime: requestStartTime,
    };
  }
  
  // ==========================================================================
  // FULFILLED: Request Succeeded
  // ==========================================================================
  
  if (type.endsWith('/fulfilled')) {
    const baseType = getBaseActionType(type);
    const duration = Date.now() - (meta.startTime || requestStartTime);
    
    // Log response
    logResponse(action, duration, true);
    
    // Clear loading state
    if (!shouldExcludeFromGlobalLoading(baseType)) {
      store.dispatch(setGlobalLoading(false));
    }
    
    store.dispatch(setOperationLoading({
      operation: baseType,
      isLoading: false,
    }));
    
    // Update rate limit if headers present
    if (meta.response?.headers) {
      const headers = meta.response.headers;
      const remaining = headers[CONFIG.rateLimitHeader.toLowerCase()];
      
      if (remaining !== undefined) {
        store.dispatch(updateRateLimit({
          requestsRemaining: parseInt(remaining, 10),
        }));
      }
    }
    
    // Track successful request
    trackAPIMetric(baseType, true, duration);
  }
  
  // ==========================================================================
  // REJECTED: Request Failed
  // ==========================================================================
  
  if (type.endsWith('/rejected')) {
    const baseType = getBaseActionType(type);
    const duration = Date.now() - (meta.startTime || requestStartTime);
    
    // Log error
    logResponse(action, duration, false);
    
    // Clear loading state
    if (!shouldExcludeFromGlobalLoading(baseType)) {
      store.dispatch(setGlobalLoading(false));
    }
    
    store.dispatch(setOperationLoading({
      operation: baseType,
      isLoading: false,
    }));
    
    // Handle different error types
    const error = action.payload || action.error;
    const status = error?.response?.status;
    
    if (error) {
      // Authentication errors (401)
      if (status === 401) {
        handleAuthError(store, error, action);
      }
      // Rate limiting (429)
      else if (status === 429) {
        handleRateLimitError(store, error);
      }
      // Server errors (5xx)
      else if (status >= 500) {
        handleServerError(store, error, action);
      }
      // Client errors (4xx except 401, 429)
      else if (status >= 400 && status < 500) {
        handleClientError(store, error, action);
      }
      // Network errors
      else if (!error.response) {
        handleNetworkError(store, error);
      }
    }
    
    // Track failed request
    trackAPIMetric(baseType, false, duration, status);
  }
  
  // Continue with the action
  return next(action);
};

// =============================================================================
// RETRY MIDDLEWARE
// =============================================================================

/**
 * Retry failed requests automatically
 */
export const retryMiddleware = (store) => (next) => async (action) => {
  // Only handle rejected async thunks
  if (!isRejectedWithValue(action)) {
    return next(action);
  }
  
  const { type, meta = {}, payload } = action;
  const retryCount = meta.retryCount || 0;
  
  // Check if we should retry
  if (retryCount < CONFIG.maxRetries && isRetryableError(payload)) {
    const baseType = getBaseActionType(type);
    console.log(`🔄 Retrying ${baseType} (attempt ${retryCount + 1}/${CONFIG.maxRetries})`);
    
    // Wait with exponential backoff
    await sleep(getRetryDelay(retryCount));
    
    // Retry the original action
    const originalAction = meta.originalAction;
    if (originalAction && typeof originalAction === 'function') {
      return store.dispatch(originalAction);
    }
  }
  
  // Max retries reached or not retryable
  return next(action);
};

// =============================================================================
// PERFORMANCE MONITORING MIDDLEWARE
// =============================================================================

/**
 * Monitor API performance
 */
export const performanceMiddleware = (store) => (next) => (action) => {
  const { type, meta = {} } = action;
  
  // Track slow requests
  if (type.endsWith('/fulfilled') || type.endsWith('/rejected')) {
    const duration = Date.now() - (meta.startTime || 0);
    
    // Warn about slow requests (> 5 seconds)
    if (duration > 5000) {
      const baseType = getBaseActionType(type);
      console.warn(`⚠️ Slow API request: ${baseType} (${duration}ms)`);
      
      // In production, send to monitoring service
      if (process.env.NODE_ENV === 'production') {
        // Example: monitoring.trackSlowRequest({ action: baseType, duration });
      }
    }
  }
  
  return next(action);
};

// =============================================================================
// CACHE MIDDLEWARE
// =============================================================================

const requestCache = new Map();

export const cacheMiddleware = (store) => (next) => (action) => {
  const { type, meta = {} } = action;
  
  // Only cache GET requests
  if (type.endsWith('/pending') && meta.method === 'GET' && meta.cache !== false) {
    const cacheKey = `${type}:${JSON.stringify(meta.arg || {})}`;
    const cached = requestCache.get(cacheKey);
    
    // Return cached response if valid
    if (cached && Date.now() - cached.timestamp < CONFIG.cacheDuration) {
      console.log(`📦 Cache hit: ${getBaseActionType(type)}`);
      
      // Dispatch fulfilled action with cached data
      store.dispatch({
        type: type.replace('/pending', '/fulfilled'),
        payload: cached.data,
        meta: {
          ...meta,
          cached: true,
        },
      });
      
      // Don't continue with original request
      return;
    }
  }
  
  // Cache successful GET responses
  if (type.endsWith('/fulfilled') && meta.method === 'GET' && meta.cache !== false) {
    const baseType = type.replace('/fulfilled', '/pending');
    const cacheKey = `${baseType}:${JSON.stringify(meta.arg || {})}`;
    
    requestCache.set(cacheKey, {
      data: action.payload,
      timestamp: Date.now(),
    });
    
    // Cleanup old cache entries
    if (requestCache.size > CONFIG.maxCacheSize) {
      const firstKey = requestCache.keys().next().value;
      requestCache.delete(firstKey);
    }
  }
  
  return next(action);
};

// =============================================================================
// BATCH MIDDLEWARE
// =============================================================================

let batchQueue = [];
let batchTimer = null;

export const batchMiddleware = (store) => (next) => (action) => {
  const { type, meta = {} } = action;
  
  // Only batch specific action types
  if (meta.batch && type.endsWith('/pending')) {
    batchQueue.push(action);
    
    // Clear existing timer
    if (batchTimer) {
      clearTimeout(batchTimer);
    }
    
    // Set new timer
    batchTimer = setTimeout(() => {
      if (batchQueue.length > 0) {
        console.log(`📦 Batching ${batchQueue.length} requests`);
        
        // Process batch
        const batch = [...batchQueue];
        batchQueue = [];
        
        // Dispatch all actions
        batch.forEach(action => next(action));
      }
    }, CONFIG.batchDelay);
    
    return;
  }
  
  return next(action);
};

// =============================================================================
// ANALYTICS MIDDLEWARE
// =============================================================================

/**
 * Track API metrics
 */
const trackAPIMetric = (action, success, duration, status = null) => {
  if (typeof sessionStorage === 'undefined') return;
  
  try {
    const metrics = JSON.parse(sessionStorage.getItem('api_metrics') || '[]');
    
    metrics.push({
      action,
      success,
      duration,
      status,
      timestamp: Date.now(),
    });
    
    // Keep only last 100 entries
    sessionStorage.setItem('api_metrics', JSON.stringify(metrics.slice(-100)));
  } catch (error) {
    console.error('Failed to track API metric:', error);
  }
};

/**
 * Analytics middleware
 */
export const analyticsMiddleware = (store) => (next) => (action) => {
  // Just pass through - metrics are tracked in main middleware
  return next(action);
};

// =============================================================================
// COMBINED MIDDLEWARE
// =============================================================================

/**
 * Export all middleware as array
 */
export const apiMiddlewares = [
  apiMiddleware,
  retryMiddleware,
  performanceMiddleware,
  cacheMiddleware,
  batchMiddleware,
  analyticsMiddleware,
];

// =============================================================================
// UTILITY FUNCTIONS (PUBLIC API)
// =============================================================================

/**
 * Clear request cache
 */
export const clearRequestCache = () => {
  requestCache.clear();
  console.log('🗑️ Request cache cleared');
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: requestCache.size,
    keys: Array.from(requestCache.keys()),
    entries: Array.from(requestCache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.timestamp,
      age: Date.now() - value.timestamp,
    })),
  };
};

/**
 * Get API metrics
 */
export const getAPIMetrics = () => {
  if (typeof sessionStorage === 'undefined') return [];
  
  try {
    return JSON.parse(sessionStorage.getItem('api_metrics') || '[]');
  } catch (error) {
    console.error('Failed to get API metrics:', error);
    return [];
  }
};

/**
 * Clear API metrics
 */
export const clearAPIMetrics = () => {
  if (typeof sessionStorage === 'undefined') return;
  
  sessionStorage.removeItem('api_metrics');
  console.log('🗑️ API metrics cleared');
};

/**
 * Get API statistics
 */
export const getAPIStatistics = () => {
  const metrics = getAPIMetrics();
  
  if (metrics.length === 0) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      averageDuration: 0,
      successRate: 0,
    };
  }
  
  const successful = metrics.filter(m => m.success).length;
  const failed = metrics.filter(m => !m.success).length;
  const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
  
  return {
    total: metrics.length,
    successful,
    failed,
    averageDuration: Math.round(totalDuration / metrics.length),
    successRate: Math.round((successful / metrics.length) * 100),
  };
};

/**
 * Force token refresh
 */
export const forceTokenRefresh = async (store) => {
  CONFIG.refreshAttempts = 0;
  return store.dispatch(refreshAccessToken());
};

/**
 * Reset refresh state (useful for testing)
 */
export const resetRefreshState = () => {
  isRefreshing = false;
  refreshSubscribers = [];
  failedQueue = [];
  CONFIG.refreshAttempts = 0;
  console.log('🔄 Refresh state reset');
};

// =============================================================================
// EXPORT DEFAULT
// =============================================================================

export default apiMiddleware;
