// =============================================================================
// AI FUNNEL PLATFORM - API CONFIGURATION
// =============================================================================
// API base URL, timeout, retry logic, environment-based configuration
// =============================================================================

import { ENV } from './constants';

/**
 * API Base URLs by Environment
 */
const API_BASE_URLS = {
  development: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  staging: import.meta.env.VITE_API_BASE_URL || 'https://staging-api.aifunnelplatform.com',
  production: import.meta.env.VITE_API_BASE_URL || 'https://api.aifunnelplatform.com',
  test: 'http://localhost:8000',
};

/**
 * Get current API base URL based on environment
 */
export const getApiBaseUrl = () => {
  return API_BASE_URLS[ENV.MODE] || API_BASE_URLS.development;
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Base URL
  BASE_URL: getApiBaseUrl(),
  
  // API Version
  VERSION: 'v1',
  
  // Timeout (milliseconds)
  TIMEOUT: 30000, // 30 seconds
  
  // Retry Configuration
  RETRY: {
    ENABLED: true,
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    BACKOFF_FACTOR: 2, // Exponential backoff
    RETRY_ON_STATUS_CODES: [408, 429, 500, 502, 503, 504],
    RETRY_ON_NETWORK_ERROR: true,
  },
  
  // Request Configuration
  REQUEST: {
    HEADERS: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    WITH_CREDENTIALS: true, // Send cookies with requests
  },
  
  // Response Configuration
  RESPONSE: {
    VALIDATE_STATUS: (status) => status >= 200 && status < 300,
  },
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // =============================================================================
  // AUTHENTICATION
  // =============================================================================
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    ME: '/auth/me',
    
    // OAuth
    OAUTH_GOOGLE: '/auth/oauth/google',
    OAUTH_LINKEDIN: '/auth/oauth/linkedin',
    OAUTH_FACEBOOK: '/auth/oauth/facebook',
    OAUTH_CALLBACK: '/auth/oauth/callback',
  },
  
  // =============================================================================
  // USERS
  // =============================================================================
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/users/avatar',
    PREFERENCES: '/users/preferences',
    NOTIFICATIONS: '/users/notifications',
    ACTIVITY: '/users/activity',
  },
  
  // =============================================================================
  // PROJECTS
  // =============================================================================
  PROJECTS: {
    BASE: '/projects',
    DETAIL: '/projects/:id',
    CREATE: '/projects',
    UPDATE: '/projects/:id',
    DELETE: '/projects/:id',
    ARCHIVE: '/projects/:id/archive',
    RESTORE: '/projects/:id/restore',
    DUPLICATE: '/projects/:id/duplicate',
    MEMBERS: '/projects/:id/members',
    SETTINGS: '/projects/:id/settings',
  },
  
  // =============================================================================
  // GROUPS
  // =============================================================================
  GROUPS: {
    BASE: '/groups',
    DETAIL: '/groups/:id',
    CREATE: '/groups',
    UPDATE: '/groups/:id',
    DELETE: '/groups/:id',
    BY_PROJECT: '/projects/:projectId/groups',
  },
  
  // =============================================================================
  // FUNNELS
  // =============================================================================
  FUNNELS: {
    BASE: '/funnels',
    DETAIL: '/funnels/:id',
    CREATE: '/funnels',
    UPDATE: '/funnels/:id',
    DELETE: '/funnels/:id',
    PUBLISH: '/funnels/:id/publish',
    UNPUBLISH: '/funnels/:id/unpublish',
    CLONE: '/funnels/:id/clone',
    EXPORT: '/funnels/:id/export',
    IMPORT: '/funnels/import',
    BY_PROJECT: '/projects/:projectId/funnels',
    BY_GROUP: '/groups/:groupId/funnels',
    PUBLIC_VIEW: '/public/funnels/:slug',
    PREVIEW: '/funnels/:id/preview',
  },
  
  // =============================================================================
  // QUESTIONS
  // =============================================================================
  QUESTIONS: {
    BASE: '/questions',
    DETAIL: '/questions/:id',
    CREATE: '/questions',
    UPDATE: '/questions/:id',
    DELETE: '/questions/:id',
    REORDER: '/questions/reorder',
    BY_FUNNEL: '/funnels/:funnelId/questions',
    BULK_CREATE: '/questions/bulk',
    BULK_UPDATE: '/questions/bulk',
    BULK_DELETE: '/questions/bulk',
  },
  
  // =============================================================================
  // AI TOOLS
  // =============================================================================
  AI: {
    GENERATE_STRATEGY: '/ai/generate-strategy',
    GENERATE_QUESTIONS: '/ai/generate-questions',
    OPTIMIZE_RESULT: '/ai/optimize-result',
    GENERATE_COPY: '/ai/generate-copy',
    GENERATE_FOLLOWUP: '/ai/generate-followup',
    SUGGEST_IMPROVEMENTS: '/ai/suggest-improvements',
    CREDITS_BALANCE: '/ai/credits',
    USAGE_HISTORY: '/ai/usage-history',
  },
  
  // =============================================================================
  // LEADS
  // =============================================================================
  LEADS: {
    BASE: '/leads',
    DETAIL: '/leads/:id',
    CREATE: '/leads',
    UPDATE: '/leads/:id',
    DELETE: '/leads/:id',
    EXPORT: '/leads/export',
    IMPORT: '/leads/import',
    BY_FUNNEL: '/funnels/:funnelId/leads',
    TAGS: '/leads/:id/tags',
    BULK_TAG: '/leads/bulk-tag',
    BULK_DELETE: '/leads/bulk-delete',
    SEARCH: '/leads/search',
  },
  
  // =============================================================================
  // ANALYTICS
  // =============================================================================
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    FUNNEL: '/analytics/funnels/:funnelId',
    CONVERSION: '/analytics/conversion',
    PERFORMANCE: '/analytics/performance',
    TRAFFIC: '/analytics/traffic',
    LEADS_OVERVIEW: '/analytics/leads',
    EXPORT: '/analytics/export',
    REPORTS: '/analytics/reports',
    REALTIME: '/analytics/realtime',
  },
  
  // =============================================================================
  // RESULT PAGE
  // =============================================================================
  RESULT_PAGE: {
    BASE: '/result-pages',
    DETAIL: '/result-pages/:id',
    CREATE: '/result-pages',
    UPDATE: '/result-pages/:id',
    DELETE: '/result-pages/:id',
    BY_FUNNEL: '/funnels/:funnelId/result-page',
    BLOCKS: '/result-pages/:id/blocks',
    REORDER_BLOCKS: '/result-pages/:id/blocks/reorder',
  },
  
  // =============================================================================
  // INTEGRATIONS
  // =============================================================================
  INTEGRATIONS: {
    BASE: '/integrations',
    AVAILABLE: '/integrations/available',
    CONNECTED: '/integrations/connected',
    CONNECT: '/integrations/:type/connect',
    DISCONNECT: '/integrations/:id/disconnect',
    TEST: '/integrations/:id/test',
    WEBHOOKS: '/integrations/webhooks',
    API_KEYS: '/integrations/api-keys',
  },
  
  // =============================================================================
  // SETTINGS
  // =============================================================================
  SETTINGS: {
    GENERAL: '/settings/general',
    ACCOUNT: '/settings/account',
    BILLING: '/settings/billing',
    TEAM: '/settings/team',
    TEAM_MEMBERS: '/settings/team/members',
    INVITE_MEMBER: '/settings/team/invite',
    REMOVE_MEMBER: '/settings/team/members/:id',
    NOTIFICATIONS: '/settings/notifications',
    SECURITY: '/settings/security',
    API: '/settings/api',
  },
  
  // =============================================================================
  // BILLING
  // =============================================================================
  BILLING: {
    PLANS: '/billing/plans',
    SUBSCRIPTION: '/billing/subscription',
    SUBSCRIBE: '/billing/subscribe',
    CANCEL: '/billing/cancel',
    UPDATE_PAYMENT: '/billing/payment-method',
    INVOICES: '/billing/invoices',
    USAGE: '/billing/usage',
  },
  
  // =============================================================================
  // MEDIA/FILES
  // =============================================================================
  MEDIA: {
    UPLOAD: '/media/upload',
    DELETE: '/media/:id',
    LIST: '/media',
    BY_TYPE: '/media/type/:type',
  },
  
  // =============================================================================
  // TEMPLATES
  // =============================================================================
  TEMPLATES: {
    BASE: '/templates',
    DETAIL: '/templates/:id',
    CATEGORIES: '/templates/categories',
    FEATURED: '/templates/featured',
    USE_TEMPLATE: '/templates/:id/use',
  },
  
  // =============================================================================
  // PUBLIC API (for funnel submissions)
  // =============================================================================
  PUBLIC: {
    SUBMIT_FUNNEL: '/public/funnels/:slug/submit',
    FUNNEL_DATA: '/public/funnels/:slug',
    TRACK_VIEW: '/public/funnels/:slug/track',
  },
  
  // =============================================================================
  // HEALTH CHECK
  // =============================================================================
  HEALTH: {
    STATUS: '/health',
    PING: '/ping',
  },
};

/**
 * Build full API URL
 */
export const buildApiUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.BASE_URL}/api/${API_CONFIG.VERSION}${endpoint}`;
  
  // Replace path parameters
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, encodeURIComponent(value));
  });
  
  return url;
};

/**
 * Build URL with query parameters
 */
export const buildUrlWithParams = (endpoint, pathParams = {}, queryParams = {}) => {
  let url = buildApiUrl(endpoint, pathParams);
  
  const queryString = new URLSearchParams(queryParams).toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  return url;
};

/**
 * HTTP Methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

/**
 * Request Headers
 */
export const REQUEST_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  X_CSRF_TOKEN: 'X-CSRF-Token',
  X_REQUEST_ID: 'X-Request-ID',
  X_API_KEY: 'X-API-Key',
};

/**
 * Content Types
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
};

/**
 * Error Codes
 */
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * Default Error Messages
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timeout. Please try again.',
  [ERROR_CODES.PARSE_ERROR]: 'Failed to parse response.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation error. Please check your input.',
  [ERROR_CODES.AUTHENTICATION_ERROR]: 'Authentication failed. Please log in again.',
  [ERROR_CODES.AUTHORIZATION_ERROR]: 'You do not have permission to perform this action.',
  [ERROR_CODES.NOT_FOUND_ERROR]: 'The requested resource was not found.',
  [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later.',
  [ERROR_CODES.RATE_LIMIT_ERROR]: 'Too many requests. Please try again later.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred.',
};

/**
 * API Response Status
 */
export const API_RESPONSE_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending',
};

/**
 * WebSocket Configuration
 */
export const WEBSOCKET_CONFIG = {
  ENABLED: false,
  URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',
  RECONNECT: true,
  RECONNECT_INTERVAL: 5000, // 5 seconds
  MAX_RECONNECT_ATTEMPTS: 5,
};

/**
 * Default Export - API Configuration
 */
export default {
  API_CONFIG,
  API_ENDPOINTS,
  HTTP_METHODS,
  HTTP_STATUS,
  REQUEST_HEADERS,
  CONTENT_TYPES,
  ERROR_CODES,
  ERROR_MESSAGES,
  API_RESPONSE_STATUS,
  WEBSOCKET_CONFIG,
  buildApiUrl,
  buildUrlWithParams,
  getApiBaseUrl,
};
