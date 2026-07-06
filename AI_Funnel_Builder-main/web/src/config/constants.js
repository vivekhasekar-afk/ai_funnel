// =============================================================================
// AI FUNNEL PLATFORM - APP CONFIGURATION CONSTANTS
// =============================================================================
// Application-wide configuration constants (pagination, limits, formats, etc.)
// =============================================================================

/**
 * Environment Detection
 */
export const ENV = {
  MODE: import.meta.env.MODE || 'development',
  IS_DEV: import.meta.env.DEV || false,
  IS_PROD: import.meta.env.PROD || false,
  IS_TEST: import.meta.env.MODE === 'test',
};

/**
 * Application Metadata
 */
export const APP_CONFIG = {
  NAME: 'AI Funnel Platform',
  SHORT_NAME: 'FunnelAI',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-Powered Funnel Builder Platform',
  COMPANY: 'Your Company',
  SUPPORT_EMAIL: 'support@aifunnelplatform.com',
  CONTACT_EMAIL: 'hello@aifunnelplatform.com',
  WEBSITE_URL: 'https://aifunnelplatform.com',
};

/**
 * Pagination Configuration
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MIN_PAGE_SIZE: 5,
  MAX_PAGE_SIZE: 100,
  SHOW_SIZE_CHANGER: true,
  SHOW_QUICK_JUMPER: true,
};

/**
 * File Upload Limits
 */
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 5,
  
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
  
  IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  VIDEO_EXTENSIONS: ['.mp4', '.webm', '.ogg', '.mov'],
  DOCUMENT_EXTENSIONS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'],
};

/**
 * Date and Time Formats
 */
export const DATE_TIME_CONFIG = {
  // Display Formats
  DATE_FORMAT: 'MMM DD, YYYY',
  DATE_SHORT_FORMAT: 'MM/DD/YYYY',
  DATE_LONG_FORMAT: 'MMMM DD, YYYY',
  TIME_FORMAT: 'HH:mm',
  TIME_12H_FORMAT: 'hh:mm A',
  DATETIME_FORMAT: 'MMM DD, YYYY HH:mm',
  DATETIME_LONG_FORMAT: 'MMMM DD, YYYY hh:mm A',
  
  // ISO Formats
  ISO_DATE_FORMAT: 'YYYY-MM-DD',
  ISO_DATETIME_FORMAT: 'YYYY-MM-DDTHH:mm:ss',
  
  // API Formats
  API_DATE_FORMAT: 'YYYY-MM-DD',
  API_DATETIME_FORMAT: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  
  // Relative Time
  RELATIVE_TIME_THRESHOLD: 7, // days - show relative time if within this threshold
  
  // Timezone
  DEFAULT_TIMEZONE: 'UTC',
};

/**
 * Text Limits
 */
export const TEXT_LIMITS = {
  // Project & Group
  PROJECT_NAME_MIN: 2,
  PROJECT_NAME_MAX: 100,
  PROJECT_DESCRIPTION_MAX: 500,
  GROUP_NAME_MIN: 2,
  GROUP_NAME_MAX: 100,
  
  // Funnel
  FUNNEL_NAME_MIN: 2,
  FUNNEL_NAME_MAX: 100,
  FUNNEL_DESCRIPTION_MAX: 500,
  FUNNEL_SLUG_MIN: 3,
  FUNNEL_SLUG_MAX: 100,
  
  // Questions
  QUESTION_TEXT_MIN: 5,
  QUESTION_TEXT_MAX: 500,
  QUESTION_DESCRIPTION_MAX: 1000,
  QUESTION_PLACEHOLDER_MAX: 100,
  QUESTION_OPTIONS_MIN: 2,
  QUESTION_OPTIONS_MAX: 20,
  QUESTION_OPTION_TEXT_MAX: 200,
  
  // Result Page
  RESULT_HEADLINE_MAX: 200,
  RESULT_SUBHEADLINE_MAX: 300,
  RESULT_PARAGRAPH_MAX: 2000,
  RESULT_CTA_TEXT_MAX: 50,
  
  // User Input
  NAME_MIN: 2,
  NAME_MAX: 100,
  EMAIL_MAX: 255,
  PHONE_MAX: 20,
  COMPANY_MAX: 100,
  BIO_MAX: 500,
  MESSAGE_MAX: 2000,
  
  // Tags
  TAG_MIN: 2,
  TAG_MAX: 30,
  MAX_TAGS: 10,
};

/**
 * Validation Rules
 */
export const VALIDATION_CONFIG = {
  // Password Rules
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_SPECIAL: true,
  
  // Username Rules
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
  
  // Slug Rules
  SLUG_PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  SLUG_MIN_LENGTH: 3,
  SLUG_MAX_LENGTH: 100,
  
  // Email Pattern
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Phone Pattern (international)
  PHONE_PATTERN: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
  
  // URL Pattern
  URL_PATTERN: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  
  // Hex Color Pattern
  HEX_COLOR_PATTERN: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
};

/**
 * Rate Limits (per user)
 */
export const RATE_LIMITS = {
  // API Requests
  API_REQUESTS_PER_MINUTE: 60,
  API_REQUESTS_PER_HOUR: 1000,
  
  // AI Generation
  AI_REQUESTS_PER_MINUTE: 5,
  AI_REQUESTS_PER_HOUR: 50,
  AI_REQUESTS_PER_DAY: 200,
  
  // Lead Submissions (per funnel)
  LEAD_SUBMISSIONS_PER_MINUTE: 10,
  LEAD_SUBMISSIONS_PER_HOUR: 100,
  LEAD_SUBMISSIONS_PER_DAY: 1000,
  
  // Email Sending
  EMAILS_PER_HOUR: 100,
  EMAILS_PER_DAY: 500,
  
  // Exports
  EXPORTS_PER_HOUR: 10,
  EXPORTS_PER_DAY: 50,
};

/**
 * Resource Limits (Free Tier)
 */
export const FREE_TIER_LIMITS = {
  PROJECTS: 3,
  GROUPS_PER_PROJECT: 5,
  FUNNELS_PER_PROJECT: 10,
  QUESTIONS_PER_FUNNEL: 15,
  LEADS_TOTAL: 1000,
  AI_CREDITS_PER_MONTH: 100,
  TEAM_MEMBERS: 1,
  FILE_STORAGE_MB: 100,
};

/**
 * Resource Limits (Pro Tier)
 */
export const PRO_TIER_LIMITS = {
  PROJECTS: 20,
  GROUPS_PER_PROJECT: 50,
  FUNNELS_PER_PROJECT: 100,
  QUESTIONS_PER_FUNNEL: 50,
  LEADS_TOTAL: 50000,
  AI_CREDITS_PER_MONTH: 1000,
  TEAM_MEMBERS: 5,
  FILE_STORAGE_MB: 1000,
};

/**
 * Resource Limits (Agency/Enterprise Tier)
 */
export const ENTERPRISE_TIER_LIMITS = {
  PROJECTS: null, // Unlimited
  GROUPS_PER_PROJECT: null,
  FUNNELS_PER_PROJECT: null,
  QUESTIONS_PER_FUNNEL: 100,
  LEADS_TOTAL: null,
  AI_CREDITS_PER_MONTH: null,
  TEAM_MEMBERS: null,
  FILE_STORAGE_MB: 10000,
};

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  // Cache TTL (Time To Live) in seconds
  USER_PROFILE_TTL: 300, // 5 minutes
  PROJECTS_LIST_TTL: 60, // 1 minute
  FUNNELS_LIST_TTL: 60,
  ANALYTICS_TTL: 300, // 5 minutes
  STATIC_DATA_TTL: 3600, // 1 hour
  
  // Cache Keys Prefix
  PREFIX: 'ai_funnel_',
  
  // Cache Strategy
  ENABLE_CACHE: true,
  CACHE_STRATEGY: 'memory', // memory, localStorage, sessionStorage
};

/**
 * Session Configuration
 */
export const SESSION_CONFIG = {
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  REFRESH_TOKEN_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REMEMBER_ME_EXPIRY: 90 * 24 * 60 * 60 * 1000, // 90 days
};

/**
 * Notification Configuration
 */
export const NOTIFICATION_CONFIG = {
  // Toast Durations (milliseconds)
  TOAST_DURATION_SHORT: 2000,
  TOAST_DURATION_MEDIUM: 4000,
  TOAST_DURATION_LONG: 6000,
  
  // Toast Positions
  TOAST_POSITION: 'top-right', // top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
  
  // Max Notifications
  MAX_NOTIFICATIONS: 5,
  
  // Auto Dismiss
  AUTO_DISMISS: true,
};

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  // Sidebar
  SIDEBAR_WIDTH: 280,
  SIDEBAR_COLLAPSED_WIDTH: 80,
  
  // Header
  HEADER_HEIGHT: 64,
  
  // Modal
  MODAL_MAX_WIDTH: 800,
  MODAL_OVERLAY_OPACITY: 0.5,
  
  // Animation Durations (milliseconds)
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
  
  // Debounce Delays (milliseconds)
  DEBOUNCE_SEARCH: 300,
  DEBOUNCE_AUTO_SAVE: 1000,
  DEBOUNCE_RESIZE: 150,
  DEBOUNCE_SCROLL: 100,
  
  // Loading States
  MIN_LOADING_TIME: 500, // Show loader for at least this duration
  SKELETON_COUNT: 5,
};

/**
 * AI Configuration
 */
export const AI_CONFIG = {
  // Generation Settings
  DEFAULT_TEMPERATURE: 0.7,
  MAX_TEMPERATURE: 1.0,
  MIN_TEMPERATURE: 0.1,
  
  // Token Limits
  MAX_TOKENS: 2000,
  DEFAULT_TOKENS: 1000,
  
  // Questions
  MIN_QUESTIONS_GENERATED: 3,
  MAX_QUESTIONS_GENERATED: 20,
  DEFAULT_QUESTIONS_GENERATED: 5,
  
  // Timeouts
  GENERATION_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
  
  // Context
  MAX_CONTEXT_LENGTH: 4000,
};

/**
 * Analytics Configuration
 */
export const ANALYTICS_CONFIG = {
  // Time Ranges
  DEFAULT_TIME_RANGE: '30days',
  TIME_RANGES: [
    { value: 'today', label: 'Today', days: 1 },
    { value: 'yesterday', label: 'Yesterday', days: 1 },
    { value: '7days', label: 'Last 7 Days', days: 7 },
    { value: '30days', label: 'Last 30 Days', days: 30 },
    { value: '90days', label: 'Last 90 Days', days: 90 },
    { value: 'year', label: 'This Year', days: 365 },
    { value: 'custom', label: 'Custom Range', days: null },
  ],
  
  // Refresh Intervals (milliseconds)
  REALTIME_REFRESH_INTERVAL: 30000, // 30 seconds
  DASHBOARD_REFRESH_INTERVAL: 60000, // 1 minute
  
  // Chart Configuration
  CHART_ANIMATION_DURATION: 750,
  CHART_POINT_RADIUS: 4,
  CHART_LINE_WIDTH: 2,
};

/**
 * Export Configuration
 */
export const EXPORT_CONFIG = {
  // Formats
  SUPPORTED_FORMATS: ['csv', 'xlsx', 'json', 'pdf'],
  DEFAULT_FORMAT: 'csv',
  
  // Limits
  MAX_EXPORT_ROWS: 10000,
  BATCH_SIZE: 1000,
  
  // File Names
  TIMESTAMP_FORMAT: 'YYYY-MM-DD_HHmmss',
};

/**
 * SEO Configuration
 */
export const SEO_CONFIG = {
  DEFAULT_TITLE: 'AI Funnel Platform - Build High-Converting Funnels',
  DEFAULT_DESCRIPTION: 'Create personalized, high-converting marketing funnels in minutes with AI',
  DEFAULT_IMAGE: '/og-image.jpg',
  TITLE_TEMPLATE: '%s | AI Funnel Platform',
  TWITTER_HANDLE: '@aifunnelplatform',
  FAVICON: '/favicon.ico',
};

/**
 * Error Configuration
 */
export const ERROR_CONFIG = {
  // Retry Strategy
  ENABLE_RETRY: true,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
  RETRY_BACKOFF: 'exponential', // exponential, linear
  
  // Error Reporting
  ENABLE_ERROR_REPORTING: ENV.IS_PROD,
  LOG_ERRORS_TO_CONSOLE: ENV.IS_DEV,
  
  // User-Friendly Messages
  SHOW_DETAILED_ERRORS: ENV.IS_DEV,
};

/**
 * Security Configuration
 */
export const SECURITY_CONFIG = {
  // CSRF Protection
  ENABLE_CSRF: true,
  CSRF_HEADER_NAME: 'X-CSRF-Token',
  
  // XSS Protection
  ENABLE_XSS_PROTECTION: true,
  SANITIZE_HTML: true,
  
  // Content Security Policy
  ENABLE_CSP: ENV.IS_PROD,
  
  // CORS
  ALLOWED_ORIGINS: ENV.IS_PROD 
    ? ['https://aifunnelplatform.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'ai_funnel_auth_token',
  REFRESH_TOKEN: 'ai_funnel_refresh_token',
  USER: 'ai_funnel_user',
  THEME: 'ai_funnel_theme',
  LANGUAGE: 'ai_funnel_language',
  SIDEBAR_COLLAPSED: 'ai_funnel_sidebar_collapsed',
  RECENT_PROJECTS: 'ai_funnel_recent_projects',
  DRAFT_FUNNEL: 'ai_funnel_draft_funnel',
  PREFERENCES: 'ai_funnel_preferences',
  ONBOARDING_COMPLETED: 'ai_funnel_onboarding_completed',
  ANALYTICS_FILTERS: 'ai_funnel_analytics_filters',
};

/**
 * Default Export - All Configuration Constants
 */
export default {
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
};
