// =============================================================================
// AI FUNNEL PLATFORM - CONFIGURATION BARREL EXPORT
// =============================================================================
// Central export point for all configuration modules
// =============================================================================

// Constants Configuration
export {
  ENV,
  APP_CONFIG,
  PAGINATION_CONFIG,
  FILE_UPLOAD_CONFIG,
  DATE_TIME_CONFIG,
  TEXT_LIMITS,
  VALIDATION_CONFIG,
  RATE_LIMITS,
  FREE_TIER_LIMITS,
  PRO_TIER_LIMITS,
  ENTERPRISE_TIER_LIMITS,
  CACHE_CONFIG,
  SESSION_CONFIG,
  NOTIFICATION_CONFIG,
  UI_CONFIG,
  AI_CONFIG,
  ANALYTICS_CONFIG,
  EXPORT_CONFIG,
  SEO_CONFIG,
  ERROR_CONFIG,
  SECURITY_CONFIG,
  STORAGE_KEYS,
} from './constants';

// API Configuration
export {
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
} from './api.config';

// Features Configuration
export {
  FEATURE_STATE,
  CORE_FEATURES,
  AI_FEATURES,
  ANALYTICS_FEATURES,
  TESTING_FEATURES,
  INTEGRATION_FEATURES,
  COLLABORATION_FEATURES,
  BRANDING_FEATURES,
  ADVANCED_FEATURES,
  SECURITY_FEATURES,
  SUPPORT_FEATURES,
  EXPERIMENTAL_FEATURES,
  ALL_FEATURES,
  isFeatureEnabled,
  hasFeatureAccess,
  getEnabledFeatures,
  getFeaturesByState,
  getFeaturesByTier,
} from './features.config';

// Routes Configuration
export {
  LAYOUT_TYPES,
  AUTH_ROUTES_CONFIG,
  ONBOARDING_ROUTES_CONFIG,
  DASHBOARD_ROUTES_CONFIG,
  PROJECT_ROUTES_CONFIG,
  FUNNEL_ROUTES_CONFIG,
  LEAD_ROUTES_CONFIG,
  ANALYTICS_ROUTES_CONFIG,
  AI_ROUTES_CONFIG,
  SETTINGS_ROUTES_CONFIG,
  PUBLIC_ROUTES_CONFIG,
  ERROR_ROUTES_CONFIG,
  SPECIAL_ROUTES_CONFIG,
  ALL_ROUTES_CONFIG,
  NAVIGATION_ITEMS,
  getRouteConfig,
  getNavigationForUser,
} from './routes.config';

// =============================================================================
// COMBINED CONFIGURATION OBJECT
// =============================================================================

/**
 * Import all default exports
 */
import constantsConfig from './constants';
import apiConfig from './api.config';
import featuresConfig from './features.config';
import routesConfig from './routes.config';

/**
 * Combined configuration object for convenience
 * Use this when you need access to multiple configs
 */
export const config = {
  // App Constants
  env: constantsConfig.ENV,
  app: constantsConfig.APP_CONFIG,
  pagination: constantsConfig.PAGINATION_CONFIG,
  fileUpload: constantsConfig.FILE_UPLOAD_CONFIG,
  dateTime: constantsConfig.DATE_TIME_CONFIG,
  textLimits: constantsConfig.TEXT_LIMITS,
  validation: constantsConfig.VALIDATION_CONFIG,
  rateLimits: constantsConfig.RATE_LIMITS,
  cache: constantsConfig.CACHE_CONFIG,
  session: constantsConfig.SESSION_CONFIG,
  notification: constantsConfig.NOTIFICATION_CONFIG,
  ui: constantsConfig.UI_CONFIG,
  ai: constantsConfig.AI_CONFIG,
  analytics: constantsConfig.ANALYTICS_CONFIG,
  export: constantsConfig.EXPORT_CONFIG,
  seo: constantsConfig.SEO_CONFIG,
  error: constantsConfig.ERROR_CONFIG,
  security: constantsConfig.SECURITY_CONFIG,
  storageKeys: constantsConfig.STORAGE_KEYS,
  
  // API Configuration
  api: apiConfig.API_CONFIG,
  apiEndpoints: apiConfig.API_ENDPOINTS,
  http: {
    methods: apiConfig.HTTP_METHODS,
    status: apiConfig.HTTP_STATUS,
    headers: apiConfig.REQUEST_HEADERS,
    contentTypes: apiConfig.CONTENT_TYPES,
  },
  websocket: apiConfig.WEBSOCKET_CONFIG,
  
  // Features
  features: featuresConfig.ALL_FEATURES,
  featureState: featuresConfig.FEATURE_STATE,
  
  // Routes
  routes: routesConfig.ALL_ROUTES_CONFIG,
  layouts: routesConfig.LAYOUT_TYPES,
  navigation: routesConfig.NAVIGATION_ITEMS,
};

/**
 * Helper function to get environment variable
 */
export const getEnvVar = (key, defaultValue = null) => {
  return import.meta.env[key] || defaultValue;
};

/**
 * Helper function to check if in development mode
 */
export const isDevelopment = () => {
  return constantsConfig.ENV.IS_DEV;
};

/**
 * Helper function to check if in production mode
 */
export const isProduction = () => {
  return constantsConfig.ENV.IS_PROD;
};

/**
 * Helper function to check if in test mode
 */
export const isTest = () => {
  return constantsConfig.ENV.IS_TEST;
};

/**
 * Helper function to get app version
 */
export const getAppVersion = () => {
  return constantsConfig.APP_CONFIG.VERSION;
};

/**
 * Helper function to get app name
 */
export const getAppName = () => {
  return constantsConfig.APP_CONFIG.NAME;
};

/**
 * Helper function to get support email
 */
export const getSupportEmail = () => {
  return constantsConfig.APP_CONFIG.SUPPORT_EMAIL;
};

/**
 * Helper function to format page title
 */
export const formatPageTitle = (pageTitle) => {
  if (!pageTitle) return constantsConfig.SEO_CONFIG.DEFAULT_TITLE;
  return `${pageTitle} | ${constantsConfig.APP_CONFIG.NAME}`;
};

/**
 * Helper function to get tier limits
 */
export const getTierLimits = (tier = 'free') => {
  const tierMap = {
    free: constantsConfig.FREE_TIER_LIMITS,
    pro: constantsConfig.PRO_TIER_LIMITS,
    agency: constantsConfig.ENTERPRISE_TIER_LIMITS,
    enterprise: constantsConfig.ENTERPRISE_TIER_LIMITS,
  };
  return tierMap[tier.toLowerCase()] || constantsConfig.FREE_TIER_LIMITS;
};

/**
 * Helper function to check if a resource limit is reached
 */
export const isLimitReached = (tier, resource, currentCount) => {
  const limits = getTierLimits(tier);
  const limit = limits[resource];
  
  // Null means unlimited
  if (limit === null) return false;
  
  return currentCount >= limit;
};

/**
 * Helper function to get remaining resource count
 */
export const getRemainingCount = (tier, resource, currentCount) => {
  const limits = getTierLimits(tier);
  const limit = limits[resource];
  
  // Null means unlimited
  if (limit === null) return Infinity;
  
  const remaining = limit - currentCount;
  return remaining > 0 ? remaining : 0;
};

/**
 * Helper function to validate text length
 */
export const validateTextLength = (text, field) => {
  const limits = constantsConfig.TEXT_LIMITS;
  const minKey = `${field}_MIN`;
  const maxKey = `${field}_MAX`;
  
  const min = limits[minKey] || 0;
  const max = limits[maxKey] || Infinity;
  
  const length = text ? text.length : 0;
  
  return {
    valid: length >= min && length <= max,
    length,
    min,
    max,
    tooShort: length < min,
    tooLong: length > max,
  };
};

/**
 * Helper function to check if file is valid
 */
export const validateFile = (file, type = 'image') => {
  const config = constantsConfig.FILE_UPLOAD_CONFIG;
  
  const typeMap = {
    image: {
      maxSize: config.MAX_IMAGE_SIZE,
      allowedTypes: config.ALLOWED_IMAGE_TYPES,
    },
    video: {
      maxSize: config.MAX_VIDEO_SIZE,
      allowedTypes: config.ALLOWED_VIDEO_TYPES,
    },
    document: {
      maxSize: config.MAX_DOCUMENT_SIZE,
      allowedTypes: config.ALLOWED_DOCUMENT_TYPES,
    },
  };
  
  const settings = typeMap[type] || typeMap.image;
  
  const validType = settings.allowedTypes.includes(file.type);
  const validSize = file.size <= settings.maxSize;
  
  return {
    valid: validType && validSize,
    validType,
    validSize,
    type: file.type,
    size: file.size,
    maxSize: settings.maxSize,
    allowedTypes: settings.allowedTypes,
  };
};

/**
 * Helper function to format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Helper function to get maximum file size for display
 */
export const getMaxFileSizeLabel = (type = 'image') => {
  const config = constantsConfig.FILE_UPLOAD_CONFIG;
  const sizeMap = {
    image: config.MAX_IMAGE_SIZE,
    video: config.MAX_VIDEO_SIZE,
    document: config.MAX_DOCUMENT_SIZE,
  };
  
  const size = sizeMap[type] || config.MAX_FILE_SIZE;
  return formatFileSize(size);
};

/**
 * Default Export - Combined Configuration
 */
export default config;
