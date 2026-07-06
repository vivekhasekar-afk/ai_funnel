// =============================================================================
// AI FUNNEL PLATFORM - ROUTES CONFIGURATION
// =============================================================================
// Route configuration with metadata, authentication, and layout requirements
// Uses constants from src/lib/constants/routes.js
// =============================================================================

import {
  AUTH_ROUTES,
  ONBOARDING_ROUTES,
  DASHBOARD_ROUTES,
  PROJECT_ROUTES,
  GROUP_ROUTES,
  FUNNEL_ROUTES,
  LEAD_ROUTES,
  ANALYTICS_ROUTES,
  AI_ROUTES,
  SETTINGS_ROUTES,
  PUBLIC_ROUTES,
  HELP_ROUTES,
  LEGAL_ROUTES,
  ERROR_ROUTES,
  SPECIAL_ROUTES,
} from '@constants/routes';

/**
 * Layout Types
 */
export const LAYOUT_TYPES = {
  DEFAULT: 'default', // Full app layout with sidebar
  AUTH: 'auth', // Authentication layout (centered, no sidebar)
  PUBLIC: 'public', // Public layout (minimal header/footer)
  MINIMAL: 'minimal', // Minimal layout (no header/footer)
  FULLSCREEN: 'fullscreen', // Fullscreen layout
  BLANK: 'blank', // Completely blank (for embeds)
};

/**
 * Route Configuration Structure
 * Each route can have:
 * - path: Route path
 * - requiresAuth: Boolean - requires authentication
 * - requiresGuest: Boolean - only accessible when not logged in
 * - layout: Layout type to use
 * - title: Page title
 * - description: Page description (for SEO)
 * - roles: Array of allowed user roles
 * - permissions: Array of required permissions
 * - showInNav: Boolean - show in navigation
 * - icon: Icon name for navigation
 * - breadcrumb: Breadcrumb label
 */

/**
 * Authentication Routes Configuration
 */
export const AUTH_ROUTES_CONFIG = {
  [AUTH_ROUTES.LOGIN]: {
    path: AUTH_ROUTES.LOGIN,
    requiresAuth: false,
    requiresGuest: true,
    layout: LAYOUT_TYPES.AUTH,
    title: 'Login',
    description: 'Sign in to your account',
    showInNav: false,
  },
  [AUTH_ROUTES.SIGNUP]: {
    path: AUTH_ROUTES.SIGNUP,
    requiresAuth: false,
    requiresGuest: true,
    layout: LAYOUT_TYPES.AUTH,
    title: 'Sign Up',
    description: 'Create a new account',
    showInNav: false,
  },
  [AUTH_ROUTES.FORGOT_PASSWORD]: {
    path: AUTH_ROUTES.FORGOT_PASSWORD,
    requiresAuth: false,
    requiresGuest: true,
    layout: LAYOUT_TYPES.AUTH,
    title: 'Forgot Password',
    description: 'Reset your password',
    showInNav: false,
  },
  [AUTH_ROUTES.RESET_PASSWORD]: {
    path: AUTH_ROUTES.RESET_PASSWORD,
    requiresAuth: false,
    requiresGuest: true,
    layout: LAYOUT_TYPES.AUTH,
    title: 'Reset Password',
    description: 'Create a new password',
    showInNav: false,
  },
  [AUTH_ROUTES.VERIFY_EMAIL]: {
    path: AUTH_ROUTES.VERIFY_EMAIL,
    requiresAuth: false,
    layout: LAYOUT_TYPES.AUTH,
    title: 'Verify Email',
    description: 'Verify your email address',
    showInNav: false,
  },
};

/**
 * Onboarding Routes Configuration
 */
export const ONBOARDING_ROUTES_CONFIG = {
  [ONBOARDING_ROUTES.ROOT]: {
    path: ONBOARDING_ROUTES.ROOT,
    requiresAuth: true,
    layout: LAYOUT_TYPES.MINIMAL,
    title: 'Onboarding',
    description: 'Get started with AI Funnel Platform',
    showInNav: false,
  },
  [ONBOARDING_ROUTES.WELCOME]: {
    path: ONBOARDING_ROUTES.WELCOME,
    requiresAuth: true,
    layout: LAYOUT_TYPES.MINIMAL,
    title: 'Welcome',
    showInNav: false,
  },
  [ONBOARDING_ROUTES.BUSINESS_INFO]: {
    path: ONBOARDING_ROUTES.BUSINESS_INFO,
    requiresAuth: true,
    layout: LAYOUT_TYPES.MINIMAL,
    title: 'Business Information',
    showInNav: false,
  },
  [ONBOARDING_ROUTES.CREATE_PROJECT]: {
    path: ONBOARDING_ROUTES.CREATE_PROJECT,
    requiresAuth: true,
    layout: LAYOUT_TYPES.MINIMAL,
    title: 'Create Your First Project',
    showInNav: false,
  },
  [ONBOARDING_ROUTES.COMPLETE]: {
    path: ONBOARDING_ROUTES.COMPLETE,
    requiresAuth: true,
    layout: LAYOUT_TYPES.MINIMAL,
    title: 'Setup Complete',
    showInNav: false,
  },
};

/**
 * Dashboard Routes Configuration
 */
export const DASHBOARD_ROUTES_CONFIG = {
  [DASHBOARD_ROUTES.ROOT]: {
    path: DASHBOARD_ROUTES.ROOT,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Dashboard',
    description: 'Overview of your funnels and performance',
    showInNav: true,
    icon: 'LayoutDashboard',
    breadcrumb: 'Dashboard',
    permissions: ['project.read'],
  },
  [DASHBOARD_ROUTES.OVERVIEW]: {
    path: DASHBOARD_ROUTES.OVERVIEW,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Dashboard Overview',
    showInNav: false,
    breadcrumb: 'Overview',
  },
  [DASHBOARD_ROUTES.ACTIVITY]: {
    path: DASHBOARD_ROUTES.ACTIVITY,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Recent Activity',
    showInNav: false,
    breadcrumb: 'Activity',
  },
};

/**
 * Project Routes Configuration
 */
export const PROJECT_ROUTES_CONFIG = {
  [PROJECT_ROUTES.LIST]: {
    path: PROJECT_ROUTES.LIST,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Projects',
    description: 'Manage your projects',
    showInNav: true,
    icon: 'FolderOpen',
    breadcrumb: 'Projects',
    permissions: ['project.read'],
  },
  [PROJECT_ROUTES.CREATE]: {
    path: PROJECT_ROUTES.CREATE,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Create Project',
    showInNav: false,
    breadcrumb: 'Create',
    permissions: ['project.create'],
  },
  [PROJECT_ROUTES.DETAIL]: {
    path: PROJECT_ROUTES.DETAIL,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Project Details',
    showInNav: false,
    breadcrumb: 'Details',
    permissions: ['project.read'],
  },
  [PROJECT_ROUTES.EDIT]: {
    path: PROJECT_ROUTES.EDIT,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Edit Project',
    showInNav: false,
    breadcrumb: 'Edit',
    permissions: ['project.update'],
  },
  [PROJECT_ROUTES.SETTINGS]: {
    path: PROJECT_ROUTES.SETTINGS,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Project Settings',
    showInNav: false,
    breadcrumb: 'Settings',
    permissions: ['project.update'],
  },
};

/**
 * Funnel Routes Configuration
 */
export const FUNNEL_ROUTES_CONFIG = {
  [FUNNEL_ROUTES.LIST]: {
    path: FUNNEL_ROUTES.LIST,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Funnels',
    description: 'Manage your funnels',
    showInNav: true,
    icon: 'GitBranch',
    breadcrumb: 'Funnels',
    permissions: ['funnel.read'],
  },
  [FUNNEL_ROUTES.CREATE]: {
    path: FUNNEL_ROUTES.CREATE,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Create Funnel',
    showInNav: false,
    breadcrumb: 'Create',
    permissions: ['funnel.create'],
  },
  [FUNNEL_ROUTES.WIZARD]: {
    path: FUNNEL_ROUTES.WIZARD,
    requiresAuth: true,
    layout: LAYOUT_TYPES.FULLSCREEN,
    title: 'Funnel Wizard',
    showInNav: false,
    permissions: ['funnel.create'],
  },
  [FUNNEL_ROUTES.DETAIL]: {
    path: FUNNEL_ROUTES.DETAIL,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Funnel Details',
    showInNav: false,
    breadcrumb: 'Details',
    permissions: ['funnel.read'],
  },
  [FUNNEL_ROUTES.EDIT]: {
    path: FUNNEL_ROUTES.EDIT,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Edit Funnel',
    showInNav: false,
    breadcrumb: 'Edit',
    permissions: ['funnel.update'],
  },
  [FUNNEL_ROUTES.FLOW]: {
    path: FUNNEL_ROUTES.FLOW,
    requiresAuth: true,
    layout: LAYOUT_TYPES.FULLSCREEN,
    title: 'Visual Flow Builder',
    showInNav: false,
    breadcrumb: 'Flow',
    permissions: ['funnel.update'],
  },
  [FUNNEL_ROUTES.QUESTIONS]: {
    path: FUNNEL_ROUTES.QUESTIONS,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Funnel Questions',
    showInNav: false,
    breadcrumb: 'Questions',
    permissions: ['question.create', 'question.update'],
  },
  [FUNNEL_ROUTES.RESULT_PAGE]: {
    path: FUNNEL_ROUTES.RESULT_PAGE,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Result Page',
    showInNav: false,
    breadcrumb: 'Result Page',
    permissions: ['funnel.update'],
  },
  [FUNNEL_ROUTES.ANALYTICS]: {
    path: FUNNEL_ROUTES.ANALYTICS,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Funnel Analytics',
    showInNav: false,
    breadcrumb: 'Analytics',
    permissions: ['analytics.view'],
  },
  [FUNNEL_ROUTES.SETTINGS]: {
    path: FUNNEL_ROUTES.SETTINGS,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Funnel Settings',
    showInNav: false,
    breadcrumb: 'Settings',
    permissions: ['funnel.update'],
  },
  [FUNNEL_ROUTES.PREVIEW]: {
    path: FUNNEL_ROUTES.PREVIEW,
    requiresAuth: true,
    layout: LAYOUT_TYPES.BLANK,
    title: 'Preview Funnel',
    showInNav: false,
    permissions: ['funnel.read'],
  },
};

/**
 * Lead Routes Configuration
 */
export const LEAD_ROUTES_CONFIG = {
  [LEAD_ROUTES.LIST]: {
    path: LEAD_ROUTES.LIST,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Leads',
    description: 'Manage your leads',
    showInNav: true,
    icon: 'Users',
    breadcrumb: 'Leads',
    permissions: ['lead.read'],
  },
  [LEAD_ROUTES.DETAIL]: {
    path: LEAD_ROUTES.DETAIL,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Lead Details',
    showInNav: false,
    breadcrumb: 'Details',
    permissions: ['lead.read'],
  },
  [LEAD_ROUTES.EXPORT]: {
    path: LEAD_ROUTES.EXPORT,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Export Leads',
    showInNav: false,
    breadcrumb: 'Export',
    permissions: ['lead.export'],
  },
};

/**
 * Analytics Routes Configuration
 */
export const ANALYTICS_ROUTES_CONFIG = {
  [ANALYTICS_ROUTES.ROOT]: {
    path: ANALYTICS_ROUTES.ROOT,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Analytics',
    description: 'View analytics and reports',
    showInNav: true,
    icon: 'BarChart3',
    breadcrumb: 'Analytics',
    permissions: ['analytics.view'],
  },
  [ANALYTICS_ROUTES.OVERVIEW]: {
    path: ANALYTICS_ROUTES.OVERVIEW,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Analytics Overview',
    showInNav: false,
    breadcrumb: 'Overview',
    permissions: ['analytics.view'],
  },
  [ANALYTICS_ROUTES.CONVERSION]: {
    path: ANALYTICS_ROUTES.CONVERSION,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Conversion Analytics',
    showInNav: false,
    breadcrumb: 'Conversion',
    permissions: ['analytics.view'],
  },
  [ANALYTICS_ROUTES.REPORTS]: {
    path: ANALYTICS_ROUTES.REPORTS,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Reports',
    showInNav: false,
    breadcrumb: 'Reports',
    permissions: ['analytics.view'],
  },
};

/**
 * AI Routes Configuration
 */
export const AI_ROUTES_CONFIG = {
  [AI_ROUTES.ROOT]: {
    path: AI_ROUTES.ROOT,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'AI Tools',
    description: 'AI-powered tools for funnel creation',
    showInNav: true,
    icon: 'Sparkles',
    breadcrumb: 'AI Tools',
    permissions: ['ai.use'],
  },
  [AI_ROUTES.GENERATE_STRATEGY]: {
    path: AI_ROUTES.GENERATE_STRATEGY,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Generate Strategy',
    showInNav: false,
    breadcrumb: 'Generate Strategy',
    permissions: ['ai.generate_strategy'],
  },
  [AI_ROUTES.GENERATE_QUESTIONS]: {
    path: AI_ROUTES.GENERATE_QUESTIONS,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Generate Questions',
    showInNav: false,
    breadcrumb: 'Generate Questions',
    permissions: ['ai.generate_questions'],
  },
};

/**
 * Settings Routes Configuration
 */
export const SETTINGS_ROUTES_CONFIG = {
  [SETTINGS_ROUTES.ROOT]: {
    path: SETTINGS_ROUTES.ROOT,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Settings',
    description: 'Manage your account settings',
    showInNav: true,
    icon: 'Settings',
    breadcrumb: 'Settings',
    permissions: ['settings.update'],
  },
  [SETTINGS_ROUTES.PROFILE]: {
    path: SETTINGS_ROUTES.PROFILE,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Profile Settings',
    showInNav: false,
    breadcrumb: 'Profile',
  },
  [SETTINGS_ROUTES.ACCOUNT]: {
    path: SETTINGS_ROUTES.ACCOUNT,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Account Settings',
    showInNav: false,
    breadcrumb: 'Account',
  },
  [SETTINGS_ROUTES.BILLING]: {
    path: SETTINGS_ROUTES.BILLING,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Billing',
    showInNav: false,
    breadcrumb: 'Billing',
    permissions: ['settings.billing'],
  },
  [SETTINGS_ROUTES.TEAM]: {
    path: SETTINGS_ROUTES.TEAM,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Team',
    showInNav: false,
    breadcrumb: 'Team',
    permissions: ['settings.team'],
  },
  [SETTINGS_ROUTES.INTEGRATIONS]: {
    path: SETTINGS_ROUTES.INTEGRATIONS,
    requiresAuth: true,
    layout: LAYOUT_TYPES.DEFAULT,
    title: 'Integrations',
    showInNav: false,
    breadcrumb: 'Integrations',
    permissions: ['settings.integrations'],
  },
};

/**
 * Public Routes Configuration
 */
export const PUBLIC_ROUTES_CONFIG = {
  [PUBLIC_ROUTES.FUNNEL]: {
    path: PUBLIC_ROUTES.FUNNEL,
    requiresAuth: false,
    layout: LAYOUT_TYPES.PUBLIC,
    title: 'Funnel',
    showInNav: false,
  },
  [PUBLIC_ROUTES.FUNNEL_RESULT]: {
    path: PUBLIC_ROUTES.FUNNEL_RESULT,
    requiresAuth: false,
    layout: LAYOUT_TYPES.PUBLIC,
    title: 'Your Results',
    showInNav: false,
  },
  [PUBLIC_ROUTES.EMBED]: {
    path: PUBLIC_ROUTES.EMBED,
    requiresAuth: false,
    layout: LAYOUT_TYPES.BLANK,
    title: 'Funnel',
    showInNav: false,
  },
};

/**
 * Error Routes Configuration
 */
export const ERROR_ROUTES_CONFIG = {
  [ERROR_ROUTES.NOT_FOUND]: {
    path: ERROR_ROUTES.NOT_FOUND,
    requiresAuth: false,
    layout: LAYOUT_TYPES.MINIMAL,
    title: '404 - Page Not Found',
    showInNav: false,
  },
  [ERROR_ROUTES.UNAUTHORIZED]: {
    path: ERROR_ROUTES.UNAUTHORIZED,
    requiresAuth: false,
    layout: LAYOUT_TYPES.MINIMAL,
    title: '401 - Unauthorized',
    showInNav: false,
  },
  [ERROR_ROUTES.FORBIDDEN]: {
    path: ERROR_ROUTES.FORBIDDEN,
    requiresAuth: false,
    layout: LAYOUT_TYPES.MINIMAL,
    title: '403 - Forbidden',
    showInNav: false,
  },
  [ERROR_ROUTES.SERVER_ERROR]: {
    path: ERROR_ROUTES.SERVER_ERROR,
    requiresAuth: false,
    layout: LAYOUT_TYPES.MINIMAL,
    title: '500 - Server Error',
    showInNav: false,
  },
};

/**
 * Special Routes Configuration
 */
export const SPECIAL_ROUTES_CONFIG = {
  [SPECIAL_ROUTES.HOME]: {
    path: SPECIAL_ROUTES.HOME,
    requiresAuth: false,
    layout: LAYOUT_TYPES.PUBLIC,
    title: 'AI Funnel Platform - Build High-Converting Funnels',
    description: 'Create personalized, high-converting marketing funnels in minutes with AI',
    showInNav: false,
  },
  [SPECIAL_ROUTES.PRICING]: {
    path: SPECIAL_ROUTES.PRICING,
    requiresAuth: false,
    layout: LAYOUT_TYPES.PUBLIC,
    title: 'Pricing',
    description: 'Choose the perfect plan for your needs',
    showInNav: false,
  },
  [SPECIAL_ROUTES.FEATURES]: {
    path: SPECIAL_ROUTES.FEATURES,
    requiresAuth: false,
    layout: LAYOUT_TYPES.PUBLIC,
    title: 'Features',
    description: 'Explore all features of AI Funnel Platform',
    showInNav: false,
  },
};

/**
 * All Routes Configuration Combined
 */
export const ALL_ROUTES_CONFIG = {
  ...AUTH_ROUTES_CONFIG,
  ...ONBOARDING_ROUTES_CONFIG,
  ...DASHBOARD_ROUTES_CONFIG,
  ...PROJECT_ROUTES_CONFIG,
  ...FUNNEL_ROUTES_CONFIG,
  ...LEAD_ROUTES_CONFIG,
  ...ANALYTICS_ROUTES_CONFIG,
  ...AI_ROUTES_CONFIG,
  ...SETTINGS_ROUTES_CONFIG,
  ...PUBLIC_ROUTES_CONFIG,
  ...ERROR_ROUTES_CONFIG,
  ...SPECIAL_ROUTES_CONFIG,
};

/**
 * Navigation Items (for sidebar)
 */
export const NAVIGATION_ITEMS = [
  {
    label: 'Dashboard',
    path: DASHBOARD_ROUTES.ROOT,
    icon: 'LayoutDashboard',
    permissions: ['project.read'],
  },
  {
    label: 'Projects',
    path: PROJECT_ROUTES.LIST,
    icon: 'FolderOpen',
    permissions: ['project.read'],
  },
  {
    label: 'Funnels',
    path: FUNNEL_ROUTES.LIST,
    icon: 'GitBranch',
    permissions: ['funnel.read'],
  },
  {
    label: 'Leads',
    path: LEAD_ROUTES.LIST,
    icon: 'Users',
    permissions: ['lead.read'],
  },
  {
    label: 'Analytics',
    path: ANALYTICS_ROUTES.ROOT,
    icon: 'BarChart3',
    permissions: ['analytics.view'],
  },
  {
    label: 'AI Tools',
    path: AI_ROUTES.ROOT,
    icon: 'Sparkles',
    permissions: ['ai.use'],
  },
  {
    label: 'Settings',
    path: SETTINGS_ROUTES.ROOT,
    icon: 'Settings',
    permissions: ['settings.update'],
  },
];

/**
 * Get route config by path
 */
export const getRouteConfig = (path) => {
  return ALL_ROUTES_CONFIG[path] || null;
};

/**
 * Get navigation items filtered by user permissions
 */
export const getNavigationForUser = (userPermissions = []) => {
  return NAVIGATION_ITEMS.filter((item) => {
    if (!item.permissions || item.permissions.length === 0) {
      return true;
    }
    return item.permissions.some((permission) => userPermissions.includes(permission));
  });
};

/**
 * Default Export
 */
export default {
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
};
