// =============================================================================
// AI FUNNEL PLATFORM - FEATURE FLAGS CONFIGURATION
// =============================================================================
// Feature flags for enabling/disabling features based on environment or tier
// =============================================================================

import { ENV } from './constants';

/**
 * Feature Flag States
 */
export const FEATURE_STATE = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  BETA: 'beta',
  PREMIUM: 'premium',
  COMING_SOON: 'coming_soon',
};

/**
 * Core Features
 */
export const CORE_FEATURES = {
  // Project Management
  PROJECTS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Create and manage projects',
    requiredTier: null,
  },
  
  GROUPS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Organize funnels into groups',
    requiredTier: null,
  },
  
  // Funnel Builder
  FUNNEL_BUILDER: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Create and edit funnels',
    requiredTier: null,
  },
  
  VISUAL_FLOW_BUILDER: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Visual drag-and-drop funnel flow builder',
    requiredTier: null,
  },
  
  QUESTION_BUILDER: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Create and manage questions',
    requiredTier: null,
  },
  
  RESULT_PAGE_BUILDER: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Build customizable result pages',
    requiredTier: null,
  },
  
  // Lead Management
  LEAD_CAPTURE: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Capture and store leads',
    requiredTier: null,
  },
  
  LEAD_MANAGEMENT: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'View and manage leads',
    requiredTier: null,
  },
  
  LEAD_EXPORT: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Export leads to CSV/Excel',
    requiredTier: null,
  },
};

/**
 * AI Features
 */
export const AI_FEATURES = {
  AI_STRATEGY_GENERATION: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'AI-powered funnel strategy generation',
    requiredTier: null,
    creditsPerUse: 10,
  },
  
  AI_QUESTION_GENERATION: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'AI-generated questions based on goals',
    requiredTier: null,
    creditsPerUse: 5,
  },
  
  AI_RESULT_OPTIMIZATION: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'AI optimization of result page content',
    requiredTier: 'pro',
    creditsPerUse: 8,
  },
  
  AI_COPY_GENERATION: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'AI-generated marketing copy',
    requiredTier: 'pro',
    creditsPerUse: 7,
  },
  
  AI_FOLLOWUP_GENERATION: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'AI-generated follow-up email sequences',
    requiredTier: 'agency',
    creditsPerUse: 15,
  },
  
  AI_SMART_SUGGESTIONS: {
    enabled: true,
    state: FEATURE_STATE.BETA,
    description: 'Real-time AI suggestions during funnel building',
    requiredTier: 'pro',
    creditsPerUse: 2,
  },
};

/**
 * Analytics Features
 */
export const ANALYTICS_FEATURES = {
  BASIC_ANALYTICS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Basic funnel analytics and metrics',
    requiredTier: null,
  },
  
  ADVANCED_ANALYTICS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Advanced analytics with detailed insights',
    requiredTier: 'pro',
  },
  
  CONVERSION_TRACKING: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Track conversion rates and funnels',
    requiredTier: null,
  },
  
  REALTIME_ANALYTICS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Real-time analytics dashboard',
    requiredTier: 'pro',
  },
  
  CUSTOM_REPORTS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Create custom analytics reports',
    requiredTier: 'agency',
  },
  
  ANALYTICS_EXPORT: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Export analytics data',
    requiredTier: 'pro',
  },
  
  HEATMAPS: {
    enabled: false,
    state: FEATURE_STATE.COMING_SOON,
    description: 'Visual heatmaps of user interactions',
    requiredTier: 'agency',
  },
  
  SESSION_RECORDINGS: {
    enabled: false,
    state: FEATURE_STATE.COMING_SOON,
    description: 'Record and replay user sessions',
    requiredTier: 'enterprise',
  },
};

/**
 * Testing & Optimization Features
 */
export const TESTING_FEATURES = {
  AB_TESTING: {
    enabled: true,
    state: FEATURE_STATE.BETA,
    description: 'A/B test different funnel variations',
    requiredTier: 'pro',
  },
  
  MULTIVARIATE_TESTING: {
    enabled: false,
    state: FEATURE_STATE.COMING_SOON,
    description: 'Test multiple variables simultaneously',
    requiredTier: 'agency',
  },
  
  SPLIT_TESTING: {
    enabled: true,
    state: FEATURE_STATE.BETA,
    description: 'Split test result pages',
    requiredTier: 'pro',
  },
  
  AUTO_OPTIMIZATION: {
    enabled: false,
    state: FEATURE_STATE.COMING_SOON,
    description: 'Automatic optimization based on performance',
    requiredTier: 'enterprise',
  },
};

/**
 * Integration Features
 */
export const INTEGRATION_FEATURES = {
  EMAIL_INTEGRATIONS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Connect email marketing platforms',
    requiredTier: null,
  },
  
  CRM_INTEGRATIONS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Connect CRM systems',
    requiredTier: 'pro',
  },
  
  CALENDAR_INTEGRATIONS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Connect calendar booking tools',
    requiredTier: 'pro',
  },
  
  PAYMENT_INTEGRATIONS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Accept payments through funnels',
    requiredTier: 'pro',
  },
  
  WEBHOOKS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Send data to custom webhooks',
    requiredTier: 'pro',
  },
  
  ZAPIER_INTEGRATION: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Connect via Zapier',
    requiredTier: 'pro',
  },
  
  API_ACCESS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Access REST API',
    requiredTier: 'agency',
  },
  
  CUSTOM_INTEGRATIONS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Build custom integrations',
    requiredTier: 'enterprise',
  },
};

/**
 * Collaboration Features
 */
export const COLLABORATION_FEATURES = {
  TEAM_MEMBERS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Invite team members',
    requiredTier: 'pro',
  },
  
  ROLE_BASED_ACCESS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Control permissions with roles',
    requiredTier: 'pro',
  },
  
  COMMENTS: {
    enabled: true,
    state: FEATURE_STATE.BETA,
    description: 'Add comments to funnels',
    requiredTier: 'pro',
  },
  
  ACTIVITY_LOG: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Track team activity',
    requiredTier: 'agency',
  },
  
  REAL_TIME_COLLABORATION: {
    enabled: false,
    state: FEATURE_STATE.COMING_SOON,
    description: 'Collaborate in real-time',
    requiredTier: 'enterprise',
  },
};

/**
 * Branding & Customization Features
 */
export const BRANDING_FEATURES = {
  CUSTOM_DOMAIN: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Use custom domain for funnels',
    requiredTier: 'agency',
  },
  
  WHITE_LABEL: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Remove platform branding',
    requiredTier: 'agency',
  },
  
  CUSTOM_BRANDING: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Add custom logo and colors',
    requiredTier: 'pro',
  },
  
  CUSTOM_CSS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Add custom CSS to funnels',
    requiredTier: 'agency',
  },
  
  CUSTOM_FONTS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Use custom fonts',
    requiredTier: 'pro',
  },
};

/**
 * Advanced Features
 */
export const ADVANCED_FEATURES = {
  TEMPLATES: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Use pre-built funnel templates',
    requiredTier: null,
  },
  
  FUNNEL_CLONING: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Duplicate existing funnels',
    requiredTier: null,
  },
  
  FUNNEL_EXPORT_IMPORT: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Export and import funnels',
    requiredTier: 'pro',
  },
  
  CONDITIONAL_LOGIC: {
    enabled: true,
    state: FEATURE_STATE.BETA,
    description: 'Show/hide questions based on answers',
    requiredTier: 'pro',
  },
  
  DYNAMIC_CONTENT: {
    enabled: true,
    state: FEATURE_STATE.BETA,
    description: 'Personalize content based on answers',
    requiredTier: 'pro',
  },
  
  MULTI_LANGUAGE: {
    enabled: false,
    state: FEATURE_STATE.COMING_SOON,
    description: 'Create funnels in multiple languages',
    requiredTier: 'agency',
  },
  
  SCHEDULING: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Schedule funnel publish/unpublish',
    requiredTier: 'pro',
  },
  
  GDPR_COMPLIANCE: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'GDPR compliance tools',
    requiredTier: null,
  },
};

/**
 * Security Features
 */
export const SECURITY_FEATURES = {
  TWO_FACTOR_AUTH: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Two-factor authentication',
    requiredTier: null,
  },
  
  SSO: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Single Sign-On',
    requiredTier: 'enterprise',
  },
  
  IP_WHITELISTING: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Restrict access by IP',
    requiredTier: 'enterprise',
  },
  
  AUDIT_LOGS: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Detailed audit logs',
    requiredTier: 'agency',
  },
  
  DATA_ENCRYPTION: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Encrypt sensitive data',
    requiredTier: null,
  },
};

/**
 * Support Features
 */
export const SUPPORT_FEATURES = {
  EMAIL_SUPPORT: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Email support',
    requiredTier: null,
  },
  
  PRIORITY_SUPPORT: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Priority support',
    requiredTier: 'pro',
  },
  
  LIVE_CHAT: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Live chat support',
    requiredTier: 'agency',
  },
  
  DEDICATED_ACCOUNT_MANAGER: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Dedicated account manager',
    requiredTier: 'enterprise',
  },
  
  ONBOARDING_CALL: {
    enabled: true,
    state: FEATURE_STATE.ENABLED,
    description: 'Free onboarding call',
    requiredTier: 'agency',
  },
};

/**
 * Experimental Features (Dev/Staging Only)
 */
export const EXPERIMENTAL_FEATURES = {
  DEBUG_MODE: {
    enabled: ENV.IS_DEV,
    state: FEATURE_STATE.BETA,
    description: 'Debug mode for developers',
    requiredTier: null,
  },
  
  FEATURE_PREVIEW: {
    enabled: ENV.IS_DEV || ENV.MODE === 'staging',
    state: FEATURE_STATE.BETA,
    description: 'Preview upcoming features',
    requiredTier: null,
  },
  
  PERFORMANCE_METRICS: {
    enabled: ENV.IS_DEV,
    state: FEATURE_STATE.BETA,
    description: 'Show performance metrics',
    requiredTier: null,
  },
};

/**
 * All Features Combined
 */
export const ALL_FEATURES = {
  ...CORE_FEATURES,
  ...AI_FEATURES,
  ...ANALYTICS_FEATURES,
  ...TESTING_FEATURES,
  ...INTEGRATION_FEATURES,
  ...COLLABORATION_FEATURES,
  ...BRANDING_FEATURES,
  ...ADVANCED_FEATURES,
  ...SECURITY_FEATURES,
  ...SUPPORT_FEATURES,
  ...EXPERIMENTAL_FEATURES,
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (featureName) => {
  const feature = ALL_FEATURES[featureName];
  return feature ? feature.enabled : false;
};

/**
 * Check if user has access to a feature based on tier
 */
export const hasFeatureAccess = (featureName, userTier = null) => {
  const feature = ALL_FEATURES[featureName];
  
  if (!feature || !feature.enabled) {
    return false;
  }
  
  // If no tier required, feature is accessible to all
  if (!feature.requiredTier) {
    return true;
  }
  
  // If no user tier provided, assume no access
  if (!userTier) {
    return false;
  }
  
  // Tier hierarchy: free < pro < agency < enterprise
  const tierLevels = {
    free: 0,
    pro: 1,
    agency: 2,
    enterprise: 3,
  };
  
  const requiredLevel = tierLevels[feature.requiredTier] || 0;
  const userLevel = tierLevels[userTier] || 0;
  
  return userLevel >= requiredLevel;
};

/**
 * Get all enabled features
 */
export const getEnabledFeatures = () => {
  return Object.entries(ALL_FEATURES)
    .filter(([_, feature]) => feature.enabled)
    .map(([name, feature]) => ({ name, ...feature }));
};

/**
 * Get features by state
 */
export const getFeaturesByState = (state) => {
  return Object.entries(ALL_FEATURES)
    .filter(([_, feature]) => feature.state === state)
    .map(([name, feature]) => ({ name, ...feature }));
};

/**
 * Get features by tier
 */
export const getFeaturesByTier = (tier) => {
  return Object.entries(ALL_FEATURES)
    .filter(([_, feature]) => feature.requiredTier === tier)
    .map(([name, feature]) => ({ name, ...feature }));
};

/**
 * Default Export - Feature Configuration
 */
export default {
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
};
