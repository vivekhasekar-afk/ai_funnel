// =============================================================================
// AI FUNNEL PLATFORM - USER VALIDATION SCHEMAS
// =============================================================================
// Comprehensive validation for user profiles, preferences, and account settings
// Using Zod for runtime validation
// =============================================================================

import { z } from 'zod';
import { TEXT_LIMITS, VALIDATION_CONFIG } from '@config/constants';
import { emailSchema, passwordSchema, phoneSchema } from './auth.schemas';

// =============================================================================
// BASE VALIDATION SCHEMAS
// =============================================================================

/**
 * User Name Schema
 */
export const userNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(TEXT_LIMITS.NAME_MAX, `Name must be less than ${TEXT_LIMITS.NAME_MAX} characters`)
  .trim()
  .refine(
    (name) => /^[a-zA-Z\s'-]+$/.test(name),
    { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' }
  );

/**
 * Username Schema
 */
export const usernameSchema = z
  .string()
  .min(VALIDATION_CONFIG.USERNAME_MIN_LENGTH, `Username must be at least ${VALIDATION_CONFIG.USERNAME_MIN_LENGTH} characters`)
  .max(VALIDATION_CONFIG.USERNAME_MAX_LENGTH, `Username must be less than ${VALIDATION_CONFIG.USERNAME_MAX_LENGTH} characters`)
  .regex(VALIDATION_CONFIG.USERNAME_PATTERN, 'Username can only contain letters, numbers, underscores, and hyphens')
  .toLowerCase()
  .trim()
  .refine(
    (username) => {
      const reserved = ['admin', 'root', 'system', 'api', 'support', 'help', 'sales', 'info'];
      return !reserved.includes(username);
    },
    { message: 'This username is reserved' }
  );

/**
 * Bio Schema
 */
export const bioSchema = z
  .string()
  .max(TEXT_LIMITS.BIO_MAX, `Bio must be less than ${TEXT_LIMITS.BIO_MAX} characters`)
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Job Title Schema
 */
export const jobTitleSchema = z
  .string()
  .max(100, 'Job title must be less than 100 characters')
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Company Name Schema
 */
export const companyNameSchema = z
  .string()
  .max(TEXT_LIMITS.COMPANY_MAX, `Company name must be less than ${TEXT_LIMITS.COMPANY_MAX} characters`)
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Website Schema
 */
export const websiteSchema = z
  .string()
  .url('Invalid website URL')
  .max(500, 'URL must be less than 500 characters')
  .optional()
  .or(z.literal(''));

/**
 * Location Schema
 */
export const locationSchema = z
  .string()
  .max(100, 'Location must be less than 100 characters')
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Timezone Schema
 */
export const timezoneSchema = z
  .string()
  .max(50)
  .optional()
  .default('UTC');

/**
 * Language Schema (ISO 639-1)
 */
export const languageSchema = z
  .string()
  .length(2, 'Use ISO 639-1 language code')
  .optional()
  .default('en');

/**
 * Currency Schema (ISO 4217)
 */
export const currencySchema = z
  .string()
  .length(3, 'Use ISO 4217 currency code')
  .optional()
  .default('USD');

/**
 * Avatar URL Schema
 */
export const avatarUrlSchema = z
  .string()
  .url('Invalid avatar URL')
  .max(500)
  .optional()
  .or(z.literal(''));

// =============================================================================
// USER PROFILE SCHEMAS
// =============================================================================

/**
 * Update User Profile Schema
 */
export const updateProfileSchema = z.object({
  name: userNameSchema.optional(),
  username: usernameSchema.optional(),
  bio: bioSchema,
  jobTitle: jobTitleSchema,
  company: companyNameSchema,
  phone: phoneSchema,
  website: websiteSchema,
  location: locationSchema,
  avatarUrl: avatarUrlSchema,
  
  // Social links
  socialLinks: z.object({
    twitter: z.string().max(100).optional().or(z.literal('')),
    linkedin: z.string().url().max(500).optional().or(z.literal('')),
    facebook: z.string().url().max(500).optional().or(z.literal('')),
    github: z.string().max(100).optional().or(z.literal('')),
    instagram: z.string().max(100).optional().or(z.literal('')),
  }).optional(),
});

/**
 * Upload Avatar Schema
 */
export const uploadAvatarSchema = z.object({
  file: z.any(), // File object
  cropData: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1),
  }).optional(),
});

/**
 * Remove Avatar Schema
 */
export const removeAvatarSchema = z.object({
  confirm: z.boolean().refine((val) => val === true, {
    message: 'Please confirm avatar removal',
  }),
});

// =============================================================================
// USER PREFERENCES SCHEMAS
// =============================================================================

/**
 * Notification Preferences Schema
 */
export const notificationPreferencesSchema = z.object({
  // Email notifications
  email: z.object({
    enabled: z.boolean().default(true),
    newLead: z.boolean().default(true),
    funnelPublished: z.boolean().default(true),
    funnelCompleted: z.boolean().default(true),
    dailyDigest: z.boolean().default(false),
    weeklyReport: z.boolean().default(true),
    monthlyReport: z.boolean().default(false),
    productUpdates: z.boolean().default(true),
    marketingEmails: z.boolean().default(false),
    securityAlerts: z.boolean().default(true),
    teamInvitations: z.boolean().default(true),
    mentions: z.boolean().default(true),
  }).optional(),
  
  // In-app notifications
  inApp: z.object({
    enabled: z.boolean().default(true),
    newLead: z.boolean().default(true),
    funnelPublished: z.boolean().default(true),
    comments: z.boolean().default(true),
    mentions: z.boolean().default(true),
    teamActivity: z.boolean().default(true),
  }).optional(),
  
  // Browser notifications
  browser: z.object({
    enabled: z.boolean().default(false),
    newLead: z.boolean().default(true),
    urgentAlerts: z.boolean().default(true),
  }).optional(),
  
  // Notification schedule
  schedule: z.object({
    quietHoursEnabled: z.boolean().default(false),
    quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:MM
    quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:MM
    timezone: timezoneSchema,
  }).optional(),
});

/**
 * Privacy Preferences Schema
 */
export const privacyPreferencesSchema = z.object({
  profileVisibility: z.enum(['public', 'team_only', 'private']).default('team_only'),
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  allowSearchEngineIndexing: z.boolean().default(false),
  dataCollection: z.boolean().default(true),
  analyticsTracking: z.boolean().default(true),
  thirdPartyIntegrations: z.boolean().default(true),
});

/**
 * Display Preferences Schema
 */
export const displayPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  colorScheme: z.enum(['default', 'blue', 'green', 'purple', 'orange']).default('default'),
  sidebarCollapsed: z.boolean().default(false),
  density: z.enum(['comfortable', 'compact', 'spacious']).default('comfortable'),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).default('MM/DD/YYYY'),
  timeFormat: z.enum(['12h', '24h']).default('12h'),
  numberFormat: z.enum(['1,234.56', '1.234,56', '1 234.56']).default('1,234.56'),
  firstDayOfWeek: z.enum(['sunday', 'monday']).default('sunday'),
  language: languageSchema,
});

/**
 * Dashboard Preferences Schema
 */
export const dashboardPreferencesSchema = z.object({
  defaultView: z.enum(['overview', 'projects', 'funnels', 'leads', 'analytics']).default('overview'),
  defaultProjectId: z.string().uuid().optional(),
  showWelcomeMessage: z.boolean().default(true),
  showQuickActions: z.boolean().default(true),
  showRecentActivity: z.boolean().default(true),
  showTopFunnels: z.boolean().default(true),
  recentActivityLimit: z.number().int().min(5).max(50).default(10),
  topFunnelsLimit: z.number().int().min(3).max(20).default(5),
  widgetLayout: z.array(
    z.object({
      id: z.string(),
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      w: z.number().int().min(1),
      h: z.number().int().min(1),
    })
  ).optional(),
});

/**
 * Editor Preferences Schema
 */
export const editorPreferencesSchema = z.object({
  autoSave: z.boolean().default(true),
  autoSaveInterval: z.number().int().min(10).max(300).default(30), // seconds
  showGridLines: z.boolean().default(true),
  snapToGrid: z.boolean().default(true),
  showQuestionNumbers: z.boolean().default(true),
  defaultQuestionType: z.string().optional(),
  enableKeyboardShortcuts: z.boolean().default(true),
  confirmBeforeDelete: z.boolean().default(true),
});

/**
 * Analytics Preferences Schema
 */
export const analyticsPreferencesSchema = z.object({
  defaultDateRange: z.enum(['today', 'last_7_days', 'last_30_days', 'last_90_days', 'this_month']).default('last_30_days'),
  defaultChartType: z.enum(['line', 'bar', 'pie', 'area']).default('line'),
  showComparison: z.boolean().default(false),
  comparisonPeriod: z.enum(['previous_period', 'same_period_last_year']).default('previous_period'),
  currency: currencySchema,
  timezone: timezoneSchema,
});

/**
 * Combined User Preferences Schema
 */
export const userPreferencesSchema = z.object({
  notifications: notificationPreferencesSchema.optional(),
  privacy: privacyPreferencesSchema.optional(),
  display: displayPreferencesSchema.optional(),
  dashboard: dashboardPreferencesSchema.optional(),
  editor: editorPreferencesSchema.optional(),
  analytics: analyticsPreferencesSchema.optional(),
});

/**
 * Update User Preferences Schema
 */
export const updatePreferencesSchema = userPreferencesSchema;

// =============================================================================
// ACCOUNT SETTINGS SCHEMAS
// =============================================================================

/**
 * Update Email Schema
 */
export const updateEmailSchema = z.object({
  newEmail: emailSchema,
  password: z.string().min(1, 'Password is required for verification'),
});

/**
 * Update Password Schema (imported from auth.schemas but redefined for completeness)
 */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine(
  (data) => data.newPassword === data.confirmNewPassword,
  { message: 'Passwords do not match', path: ['confirmNewPassword'] }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  { message: 'New password must be different from current password', path: ['newPassword'] }
);

/**
 * Two-Factor Authentication Toggle Schema
 */
export const toggle2FASchema = z.object({
  enabled: z.boolean(),
  password: z.string().min(1, 'Password is required'),
  method: z.enum(['app', 'sms', 'email']).optional().default('app'),
});

/**
 * Session Management Schema
 */
export const sessionManagementSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  action: z.enum(['revoke', 'revoke_all_except_current', 'revoke_all']),
  password: z.string().min(1, 'Password is required').optional(),
});

/**
 * Connected Accounts Schema
 */
export const connectedAccountsSchema = z.object({
  provider: z.enum(['google', 'linkedin', 'facebook', 'github', 'microsoft']),
  action: z.enum(['connect', 'disconnect']),
  password: z.string().min(1, 'Password is required for disconnection').optional(),
});

/**
 * API Key Management Schema
 */
export const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.enum([
    'read',
    'write',
    'delete',
    'admin',
  ])).min(1),
  expiresAt: z.string().datetime().optional(),
  ipWhitelist: z.array(
    z.string().ip()
  ).max(20).optional(),
});

/**
 * Create API Key Schema
 */
export const createApiKeySchema = apiKeySchema;

/**
 * Update API Key Schema
 */
export const updateApiKeySchema = z.object({
  keyId: z.string().uuid('Invalid key ID'),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).optional(),
  ipWhitelist: z.array(z.string().ip()).max(20).optional(),
});

/**
 * Revoke API Key Schema
 */
export const revokeApiKeySchema = z.object({
  keyId: z.string().uuid('Invalid key ID'),
  password: z.string().min(1, 'Password is required'),
});

// =============================================================================
// BILLING & SUBSCRIPTION SCHEMAS
// =============================================================================

/**
 * Billing Information Schema
 */
export const billingInfoSchema = z.object({
  fullName: z.string().min(1).max(100),
  companyName: companyNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.object({
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional().or(z.literal('')),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional().or(z.literal('')),
    postalCode: z.string().min(1).max(20),
    country: z.string().length(2, 'Use ISO country code'),
  }),
  taxId: z.string().max(50).optional().or(z.literal('')),
});

/**
 * Update Billing Info Schema
 */
export const updateBillingInfoSchema = billingInfoSchema.partial();

/**
 * Payment Method Schema
 */
export const paymentMethodSchema = z.object({
  type: z.enum(['card', 'bank_account', 'paypal']),
  isDefault: z.boolean().default(false),
  // Card details (handled by Stripe/payment provider)
  token: z.string().min(1, 'Payment token is required'),
});

/**
 * Add Payment Method Schema
 */
export const addPaymentMethodSchema = paymentMethodSchema;

/**
 * Remove Payment Method Schema
 */
export const removePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Change Subscription Plan Schema
 */
export const changeSubscriptionSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
  confirmDowngrade: z.boolean().optional(),
});

/**
 * Cancel Subscription Schema
 */
export const cancelSubscriptionSchema = z.object({
  reason: z.enum([
    'too_expensive',
    'missing_features',
    'found_alternative',
    'not_using',
    'poor_support',
    'other',
  ]),
  feedback: z.string().max(1000).optional(),
  cancelImmediately: z.boolean().default(false),
  password: z.string().min(1, 'Password is required'),
});

// =============================================================================
// DATA & PRIVACY SCHEMAS
// =============================================================================

/**
 * Download User Data Schema
 */
export const downloadUserDataSchema = z.object({
  includeProfile: z.boolean().default(true),
  includeProjects: z.boolean().default(true),
  includeFunnels: z.boolean().default(true),
  includeLeads: z.boolean().default(true),
  includeAnalytics: z.boolean().default(false),
  format: z.enum(['json', 'csv', 'zip']).default('json'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Delete Account Schema
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmDeletion: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({ message: 'Please type "DELETE MY ACCOUNT" to confirm' }),
  }),
  reason: z.enum([
    'not_useful',
    'too_expensive',
    'missing_features',
    'found_alternative',
    'privacy_concerns',
    'too_complex',
    'other',
  ]).optional(),
  feedback: z.string().max(1000).optional(),
  deleteImmediately: z.boolean().default(false),
  transferProjectsTo: z.string().uuid().optional(), // Transfer to another user
});

// =============================================================================
// TEAM & WORKSPACE SCHEMAS
// =============================================================================

/**
 * Create Workspace Schema
 */
export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  industry: z.string().max(50).optional(),
});

/**
 * Update Workspace Schema
 */
export const updateWorkspaceSchema = createWorkspaceSchema.partial();

/**
 * Invite Team Member Schema
 */
export const inviteTeamMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
  projectIds: z.array(z.string().uuid()).optional(),
  message: z.string().max(500).optional(),
});

// =============================================================================
// ONBOARDING SCHEMAS
// =============================================================================

/**
 * Complete Onboarding Schema
 */
export const completeOnboardingSchema = z.object({
  step: z.enum(['welcome', 'profile', 'business', 'preferences', 'first_project', 'complete']),
  data: z.record(z.any()),
  skipRemaining: z.boolean().default(false),
});

/**
 * Onboarding Survey Schema
 */
export const onboardingSurveySchema = z.object({
  role: z.enum(['founder', 'marketer', 'agency_owner', 'freelancer', 'developer', 'other']),
  companySize: z.enum(['solo', '2-10', '11-50', '51-200', '201-1000', '1000+']),
  industry: z.string().max(50),
  goals: z.array(z.string().max(100)).min(1).max(5),
  experience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  referralSource: z.enum(['google', 'social_media', 'referral', 'blog', 'advertisement', 'other']).optional(),
  challenges: z.array(z.string().max(200)).max(5).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate username uniqueness
 */
export const validateUsernameUnique = async (username, excludeUserId = null) => {
  // This would typically call your API
  return true;
};

/**
 * Get user initials from name
 */
export const getUserInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Get default avatar URL
 */
export const getDefaultAvatarUrl = (name, email) => {
  const initial = getUserInitials(name);
  // Could use a service like UI Avatars or generate locally
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=random`;
};

/**
 * Validate quiet hours
 */
export const validateQuietHours = (start, end) => {
  if (!start || !end) return true;
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return startMinutes !== endMinutes;
};

/**
 * Safe parse helpers
 */
export const safeParseUpdateProfile = (data) => {
  return updateProfileSchema.safeParse(data);
};

export const safeParseUpdatePreferences = (data) => {
  return updatePreferencesSchema.safeParse(data);
};

export const safeParseUpdateEmail = (data) => {
  return updateEmailSchema.safeParse(data);
};

export const safeParseDeleteAccount = (data) => {
  return deleteAccountSchema.safeParse(data);
};

export const safeParseOnboardingSurvey = (data) => {
  return onboardingSurveySchema.safeParse(data);
};

/**
 * Format Zod errors for display
 */
export const formatUserErrors = (zodError) => {
  const errors = {};
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  return errors;
};

/**
 * Sanitize user profile data
 */
export const sanitizeUserProfile = (profile) => {
  return {
    ...profile,
    name: profile.name?.trim() || '',
    username: profile.username?.toLowerCase().trim() || '',
    bio: profile.bio?.trim() || '',
    company: profile.company?.trim() || '',
    location: profile.location?.trim() || '',
  };
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export const UserSchemaTypes = {
  Name: userNameSchema,
  Username: usernameSchema,
  UpdateProfile: updateProfileSchema,
  UserPreferences: userPreferencesSchema,
  UpdateEmail: updateEmailSchema,
  UpdatePassword: updatePasswordSchema,
  DeleteAccount: deleteAccountSchema,
  BillingInfo: billingInfoSchema,
  OnboardingSurvey: onboardingSurveySchema,
};

/**
 * Default Export
 */
export default {
  // Base schemas
  userNameSchema,
  usernameSchema,
  bioSchema,
  jobTitleSchema,
  companyNameSchema,
  websiteSchema,
  locationSchema,
  timezoneSchema,
  languageSchema,
  currencySchema,
  avatarUrlSchema,

  // Profile schemas
  updateProfileSchema,
  uploadAvatarSchema,
  removeAvatarSchema,

  // Preferences schemas
  notificationPreferencesSchema,
  privacyPreferencesSchema,
  displayPreferencesSchema,
  dashboardPreferencesSchema,
  editorPreferencesSchema,
  analyticsPreferencesSchema,
  userPreferencesSchema,
  updatePreferencesSchema,

  // Account settings schemas
  updateEmailSchema,
  updatePasswordSchema,
  toggle2FASchema,
  sessionManagementSchema,
  connectedAccountsSchema,
  apiKeySchema,
  createApiKeySchema,
  updateApiKeySchema,
  revokeApiKeySchema,

  // Billing schemas
  billingInfoSchema,
  updateBillingInfoSchema,
  paymentMethodSchema,
  addPaymentMethodSchema,
  removePaymentMethodSchema,
  changeSubscriptionSchema,
  cancelSubscriptionSchema,

  // Data & privacy schemas
  downloadUserDataSchema,
  deleteAccountSchema,

  // Team & workspace schemas
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteTeamMemberSchema,

  // Onboarding schemas
  completeOnboardingSchema,
  onboardingSurveySchema,

  // Helper functions
  validateUsernameUnique,
  getUserInitials,
  getDefaultAvatarUrl,
  validateQuietHours,
  safeParseUpdateProfile,
  safeParseUpdatePreferences,
  safeParseUpdateEmail,
  safeParseDeleteAccount,
  safeParseOnboardingSurvey,
  formatUserErrors,
  sanitizeUserProfile,

  // Types
  UserSchemaTypes,
};
