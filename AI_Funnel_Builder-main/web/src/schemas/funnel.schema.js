// =============================================================================
// AI FUNNEL PLATFORM - FUNNEL VALIDATION SCHEMAS
// =============================================================================
// Comprehensive validation for funnel creation, updates, and management
// Using Zod for runtime validation
// =============================================================================

import { z } from 'zod';
import { TEXT_LIMITS, VALIDATION_CONFIG } from '@config/constants';
import { FUNNEL_GOAL_TYPES } from '@constants/funnel-goals';
import { FUNNEL_FOCUS_TYPES } from '@constants/funnel-focus';
import { FUNNEL_STATUS } from '@config/constants';

// =============================================================================
// BASE VALIDATION SCHEMAS
// =============================================================================

/**
 * Funnel Name Schema
 */
export const funnelNameSchema = z
  .string()
  .min(TEXT_LIMITS.FUNNEL_NAME_MIN, `Funnel name must be at least ${TEXT_LIMITS.FUNNEL_NAME_MIN} characters`)
  .max(TEXT_LIMITS.FUNNEL_NAME_MAX, `Funnel name must be less than ${TEXT_LIMITS.FUNNEL_NAME_MAX} characters`)
  .trim()
  .refine(
    (name) => !/^\s*$/.test(name),
    { message: 'Funnel name cannot be only whitespace' }
  );

/**
 * Funnel Description Schema
 */
export const funnelDescriptionSchema = z
  .string()
  .max(TEXT_LIMITS.FUNNEL_DESCRIPTION_MAX, `Description must be less than ${TEXT_LIMITS.FUNNEL_DESCRIPTION_MAX} characters`)
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Funnel Slug Schema
 */
export const funnelSlugSchema = z
  .string()
  .min(TEXT_LIMITS.FUNNEL_SLUG_MIN, `Slug must be at least ${TEXT_LIMITS.FUNNEL_SLUG_MIN} characters`)
  .max(TEXT_LIMITS.FUNNEL_SLUG_MAX, `Slug must be less than ${TEXT_LIMITS.FUNNEL_SLUG_MAX} characters`)
  .regex(VALIDATION_CONFIG.SLUG_PATTERN, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .toLowerCase()
  .trim()
  .refine(
    (slug) => {
      // Reserved slugs
      const reserved = ['admin', 'api', 'app', 'dashboard', 'settings', 'help', 'support'];
      return !reserved.includes(slug);
    },
    { message: 'This slug is reserved' }
  )
  .refine(
    (slug) => !slug.startsWith('-') && !slug.endsWith('-'),
    { message: 'Slug cannot start or end with a hyphen' }
  )
  .refine(
    (slug) => !/--/.test(slug),
    { message: 'Slug cannot contain consecutive hyphens' }
  );

/**
 * Funnel Goal Schema
 */
export const funnelGoalSchema = z.enum(
  Object.values(FUNNEL_GOAL_TYPES),
  { errorMap: () => ({ message: 'Invalid funnel goal' }) }
);

/**
 * Funnel Focus Schema (array of focus areas)
 */
export const funnelFocusSchema = z
  .array(
    z.enum(Object.values(FUNNEL_FOCUS_TYPES), {
      errorMap: () => ({ message: 'Invalid focus area' }),
    })
  )
  .min(1, 'Select at least one focus area')
  .max(5, 'Select up to 5 focus areas');

/**
 * Funnel Status Schema
 */
export const funnelStatusSchema = z.enum(
  [FUNNEL_STATUS.DRAFT, FUNNEL_STATUS.PUBLISHED, FUNNEL_STATUS.PAUSED, FUNNEL_STATUS.ARCHIVED],
  { errorMap: () => ({ message: 'Invalid funnel status' }) }
);

/**
 * Hex Color Schema
 */
export const hexColorSchema = z
  .string()
  .regex(VALIDATION_CONFIG.HEX_COLOR_PATTERN, 'Invalid color format. Use hex format (e.g., #FF5733)')
  .optional();

/**
 * URL Schema
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(500, 'URL must be less than 500 characters')
  .optional()
  .or(z.literal(''));

/**
 * Custom Domain Schema
 */
export const customDomainSchema = z
  .string()
  .regex(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
    'Invalid domain format'
  )
  .optional()
  .or(z.literal(''));

/**
 * Tag Schema
 */
export const tagSchema = z
  .string()
  .min(TEXT_LIMITS.TAG_MIN, `Tag must be at least ${TEXT_LIMITS.TAG_MIN} characters`)
  .max(TEXT_LIMITS.TAG_MAX, `Tag must be less than ${TEXT_LIMITS.TAG_MAX} characters`)
  .trim();

/**
 * Tags Array Schema
 */
export const tagsSchema = z
  .array(tagSchema)
  .max(TEXT_LIMITS.MAX_TAGS, `Maximum ${TEXT_LIMITS.MAX_TAGS} tags allowed`)
  .optional()
  .default([]);

// =============================================================================
// FUNNEL CREATION & UPDATE SCHEMAS
// =============================================================================

/**
 * Create Funnel Schema (Basic)
 */
export const createFunnelSchema = z.object({
  name: funnelNameSchema,
  description: funnelDescriptionSchema,
  slug: funnelSlugSchema.optional(), // Auto-generated if not provided
  projectId: z.string().uuid('Invalid project ID'),
  groupId: z.string().uuid('Invalid group ID').optional(),
  goal: funnelGoalSchema,
  focus: funnelFocusSchema,
  tags: tagsSchema,
});

/**
 * Create Funnel Schema (With AI)
 */
export const createFunnelWithAISchema = z.object({
  name: funnelNameSchema,
  description: funnelDescriptionSchema,
  slug: funnelSlugSchema.optional(),
  projectId: z.string().uuid('Invalid project ID'),
  groupId: z.string().uuid('Invalid group ID').optional(),
  goal: funnelGoalSchema,
  focus: funnelFocusSchema,
  tags: tagsSchema,
  
  // AI generation options
  generateQuestions: z.boolean().optional().default(true),
  questionCount: z.number().min(3).max(20).optional().default(5),
  generateResultPage: z.boolean().optional().default(true),
  
  // Additional context for AI
  targetAudience: z.string().max(500).optional(),
  productService: z.string().max(500).optional(),
  keyBenefits: z.array(z.string().max(200)).max(10).optional(),
  painPoints: z.array(z.string().max(200)).max(10).optional(),
});

/**
 * Update Funnel Schema (Basic)
 */
export const updateFunnelSchema = z.object({
  name: funnelNameSchema.optional(),
  description: funnelDescriptionSchema,
  slug: funnelSlugSchema.optional(),
  groupId: z.string().uuid('Invalid group ID').optional().nullable(),
  goal: funnelGoalSchema.optional(),
  focus: funnelFocusSchema.optional(),
  tags: tagsSchema,
  status: funnelStatusSchema.optional(),
});

/**
 * Clone Funnel Schema
 */
export const cloneFunnelSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  name: funnelNameSchema,
  slug: funnelSlugSchema.optional(),
  projectId: z.string().uuid('Invalid project ID').optional(), // If cloning to different project
  groupId: z.string().uuid('Invalid group ID').optional(),
  includeQuestions: z.boolean().optional().default(true),
  includeResultPage: z.boolean().optional().default(true),
  includeSettings: z.boolean().optional().default(true),
  includeAnalytics: z.boolean().optional().default(false),
});

/**
 * Move Funnel Schema
 */
export const moveFunnelSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  targetProjectId: z.string().uuid('Invalid project ID').optional(),
  targetGroupId: z.string().uuid('Invalid group ID').optional().nullable(),
});

/**
 * Delete Funnel Schema
 */
export const deleteFunnelSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  permanent: z.boolean().optional().default(false),
  confirmText: z
    .string()
    .refine((val) => val === 'DELETE', {
      message: 'Type DELETE to confirm',
    })
    .optional(),
});

// =============================================================================
// FUNNEL SETTINGS SCHEMAS
// =============================================================================

/**
 * Funnel Branding Settings Schema
 */
export const funnelBrandingSchema = z.object({
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  logoUrl: urlSchema,
  faviconUrl: urlSchema,
  customCss: z.string().max(10000).optional(),
  fontFamily: z
    .string()
    .max(100)
    .optional(),
  buttonStyle: z
    .enum(['rounded', 'square', 'pill'])
    .optional()
    .default('rounded'),
});

/**
 * Funnel SEO Settings Schema
 */
export const funnelSeoSchema = z.object({
  title: z.string().min(10).max(60).optional(),
  description: z.string().min(50).max(160).optional(),
  keywords: z.array(z.string().max(50)).max(20).optional(),
  ogImage: urlSchema,
  ogTitle: z.string().max(60).optional(),
  ogDescription: z.string().max(160).optional(),
  twitterCard: z.enum(['summary', 'summary_large_image']).optional(),
  canonicalUrl: urlSchema,
  robots: z.enum(['index', 'noindex']).optional().default('index'),
});

/**
 * Funnel Tracking Settings Schema
 */
export const funnelTrackingSchema = z.object({
  googleAnalyticsId: z.string().max(50).optional(),
  facebookPixelId: z.string().max(50).optional(),
  googleTagManagerId: z.string().max(50).optional(),
  linkedInInsightTag: z.string().max(50).optional(),
  customTrackingCode: z.string().max(5000).optional(),
  enableCookieConsent: z.boolean().optional().default(true),
});

/**
 * Funnel Notification Settings Schema
 */
export const funnelNotificationSchema = z.object({
  enableEmailNotifications: z.boolean().optional().default(true),
  notificationEmails: z
    .array(z.string().email('Invalid email address'))
    .max(10, 'Maximum 10 email addresses')
    .optional()
    .default([]),
  notifyOnSubmission: z.boolean().optional().default(true),
  notifyOnMilestone: z.boolean().optional().default(false),
  dailyDigest: z.boolean().optional().default(false),
  webhookUrl: urlSchema,
  webhookEvents: z
    .array(z.enum(['submission', 'completion', 'milestone']))
    .optional()
    .default([]),
});

/**
 * Funnel Security Settings Schema
 */
export const funnelSecuritySchema = z.object({
  requirePassword: z.boolean().optional().default(false),
  password: z.string().min(6).max(50).optional(),
  ipWhitelist: z
    .array(
      z.string().regex(
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        'Invalid IP address'
      )
    )
    .max(20)
    .optional(),
  enableRecaptcha: z.boolean().optional().default(false),
  recaptchaScore: z.number().min(0).max(1).optional().default(0.5),
  maxSubmissionsPerIp: z.number().min(1).max(1000).optional(),
  blockTor: z.boolean().optional().default(false),
  blockVpn: z.boolean().optional().default(false),
});

/**
 * Funnel Redirect Settings Schema
 */
export const funnelRedirectSchema = z.object({
  redirectOnCompletion: z.boolean().optional().default(false),
  redirectUrl: urlSchema,
  redirectDelay: z.number().min(0).max(60).optional().default(0), // seconds
  openInNewTab: z.boolean().optional().default(false),
});

/**
 * Funnel Scheduling Settings Schema
 */
export const funnelSchedulingSchema = z.object({
  enableScheduling: z.boolean().optional().default(false),
  publishAt: z.string().datetime().optional(),
  unpublishAt: z.string().datetime().optional(),
  timezone: z.string().max(50).optional().default('UTC'),
}).refine(
  (data) => {
    if (data.publishAt && data.unpublishAt) {
      return new Date(data.publishAt) < new Date(data.unpublishAt);
    }
    return true;
  },
  {
    message: 'Publish date must be before unpublish date',
    path: ['unpublishAt'],
  }
);

/**
 * Funnel Limits Settings Schema
 */
export const funnelLimitsSchema = z.object({
  enableLimits: z.boolean().optional().default(false),
  maxSubmissions: z.number().min(1).max(1000000).optional(),
  maxSubmissionsPerDay: z.number().min(1).max(100000).optional(),
  maxSubmissionsPerUser: z.number().min(1).max(100).optional(),
  closedMessage: z.string().max(500).optional().default('This funnel is currently closed.'),
});

/**
 * Combined Funnel Settings Schema
 */
export const funnelSettingsSchema = z.object({
  branding: funnelBrandingSchema.optional(),
  seo: funnelSeoSchema.optional(),
  tracking: funnelTrackingSchema.optional(),
  notifications: funnelNotificationSchema.optional(),
  security: funnelSecuritySchema.optional(),
  redirect: funnelRedirectSchema.optional(),
  scheduling: funnelSchedulingSchema.optional(),
  limits: funnelLimitsSchema.optional(),
  customDomain: customDomainSchema,
  enableProgressBar: z.boolean().optional().default(true),
  enableSaveAndResume: z.boolean().optional().default(false),
  enableBackButton: z.boolean().optional().default(true),
  enableQuestionNumbers: z.boolean().optional().default(true),
  allowSkipQuestions: z.boolean().optional().default(false),
  shuffleQuestions: z.boolean().optional().default(false),
  showBranding: z.boolean().optional().default(true),
});

// =============================================================================
// FUNNEL PUBLISHING SCHEMAS
// =============================================================================

/**
 * Publish Funnel Schema
 */
export const publishFunnelSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  publishAt: z.string().datetime().optional(), // Schedule for later
  notifySubscribers: z.boolean().optional().default(false),
  version: z.string().optional(), // For version control
});

/**
 * Unpublish Funnel Schema
 */
export const unpublishFunnelSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  reason: z
    .enum(['maintenance', 'completed', 'paused', 'other'])
    .optional(),
  customReason: z.string().max(200).optional(),
});

/**
 * Preview Funnel Schema
 */
export const previewFunnelSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  password: z.string().optional(), // For password-protected funnels
});

// =============================================================================
// FUNNEL ANALYTICS SCHEMAS
// =============================================================================

/**
 * Funnel Analytics Query Schema
 */
export const funnelAnalyticsQuerySchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metrics: z
    .array(
      z.enum(['views', 'submissions', 'completions', 'conversion_rate', 'avg_time', 'bounce_rate'])
    )
    .optional()
    .default(['views', 'submissions', 'conversion_rate']),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});

// =============================================================================
// FUNNEL CONDITIONAL LOGIC SCHEMAS
// =============================================================================

/**
 * Condition Schema
 */
export const conditionSchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']),
  value: z.union([z.string(), z.number(), z.boolean()]),
  valueType: z.enum(['string', 'number', 'boolean']).optional().default('string'),
});

/**
 * Condition Group Schema (AND/OR logic)
 */
export const conditionGroupSchema = z.object({
  logic: z.enum(['AND', 'OR']).default('AND'),
  conditions: z.array(conditionSchema).min(1, 'At least one condition is required'),
});

/**
 * Conditional Logic Rule Schema
 */
export const conditionalLogicSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100).optional(),
  enabled: z.boolean().optional().default(true),
  conditionGroups: z.array(conditionGroupSchema).min(1),
  actions: z.array(
    z.object({
      type: z.enum(['show_question', 'hide_question', 'skip_to_question', 'show_result', 'redirect']),
      targetId: z.string().optional(), // Question ID or result page ID
      value: z.string().optional(), // For redirect URL
    })
  ).min(1, 'At least one action is required'),
});

// =============================================================================
// FUNNEL IMPORT/EXPORT SCHEMAS
// =============================================================================

/**
 * Export Funnel Schema
 */
export const exportFunnelSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  includeQuestions: z.boolean().optional().default(true),
  includeResultPage: z.boolean().optional().default(true),
  includeSettings: z.boolean().optional().default(true),
  includeAnalytics: z.boolean().optional().default(false),
  includeLeads: z.boolean().optional().default(false),
});

/**
 * Import Funnel Schema
 */
export const importFunnelSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  groupId: z.string().uuid('Invalid group ID').optional(),
  data: z.string().min(1, 'Import data is required'), // JSON string
  overwrite: z.boolean().optional().default(false),
  generateNewIds: z.boolean().optional().default(true),
});

// =============================================================================
// FUNNEL VERSIONING SCHEMAS
// =============================================================================

/**
 * Create Funnel Version Schema
 */
export const createVersionSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  versionName: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  autoVersion: z.boolean().optional().default(false), // Auto-increment version
});

/**
 * Restore Funnel Version Schema
 */
export const restoreVersionSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  versionId: z.string().uuid('Invalid version ID'),
  createBackup: z.boolean().optional().default(true),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate funnel name uniqueness (for use with API call)
 */
export const validateFunnelNameUnique = async (name, projectId, excludeFunnelId = null) => {
  // This would typically call your API
  // Return true if unique, false if duplicate
  return true;
};

/**
 * Validate slug uniqueness
 */
export const validateSlugUnique = async (slug, excludeFunnelId = null) => {
  // This would typically call your API
  return true;
};

/**
 * Generate slug from funnel name
 */
export const generateSlugFromName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+/, '') // Remove leading hyphens
    .replace(/-+$/, '') // Remove trailing hyphens
    .substring(0, TEXT_LIMITS.FUNNEL_SLUG_MAX);
};

/**
 * Safe parse helpers
 */
export const safeParseCreateFunnel = (data) => {
  return createFunnelSchema.safeParse(data);
};

export const safeParseUpdateFunnel = (data) => {
  return updateFunnelSchema.safeParse(data);
};

export const safeParseCloneFunnel = (data) => {
  return cloneFunnelSchema.safeParse(data);
};

export const safeParseFunnelSettings = (data) => {
  return funnelSettingsSchema.safeParse(data);
};

export const safeParsePublishFunnel = (data) => {
  return publishFunnelSchema.safeParse(data);
};

/**
 * Format Zod errors for display
 */
export const formatFunnelErrors = (zodError) => {
  const errors = {};
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  return errors;
};

/**
 * Validate conditional logic chains
 */
export const validateConditionalLogic = (logic, questions) => {
  const questionIds = new Set(questions.map((q) => q.id));
  
  for (const group of logic.conditionGroups) {
    for (const condition of group.conditions) {
      if (!questionIds.has(condition.questionId)) {
        return {
          valid: false,
          error: `Question ${condition.questionId} not found in funnel`,
        };
      }
    }
  }
  
  return { valid: true };
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export const FunnelSchemaTypes = {
  Name: funnelNameSchema,
  Description: funnelDescriptionSchema,
  Slug: funnelSlugSchema,
  Goal: funnelGoalSchema,
  Focus: funnelFocusSchema,
  Status: funnelStatusSchema,
  CreateFunnel: createFunnelSchema,
  CreateFunnelWithAI: createFunnelWithAISchema,
  UpdateFunnel: updateFunnelSchema,
  CloneFunnel: cloneFunnelSchema,
  FunnelSettings: funnelSettingsSchema,
  PublishFunnel: publishFunnelSchema,
  ConditionalLogic: conditionalLogicSchema,
  ExportFunnel: exportFunnelSchema,
  ImportFunnel: importFunnelSchema,
};

/**
 * Default Export
 */
export default {
  // Base schemas
  funnelNameSchema,
  funnelDescriptionSchema,
  funnelSlugSchema,
  funnelGoalSchema,
  funnelFocusSchema,
  funnelStatusSchema,
  hexColorSchema,
  urlSchema,
  customDomainSchema,
  tagSchema,
  tagsSchema,

  // Creation & update schemas
  createFunnelSchema,
  createFunnelWithAISchema,
  updateFunnelSchema,
  cloneFunnelSchema,
  moveFunnelSchema,
  deleteFunnelSchema,

  // Settings schemas
  funnelBrandingSchema,
  funnelSeoSchema,
  funnelTrackingSchema,
  funnelNotificationSchema,
  funnelSecuritySchema,
  funnelRedirectSchema,
  funnelSchedulingSchema,
  funnelLimitsSchema,
  funnelSettingsSchema,

  // Publishing schemas
  publishFunnelSchema,
  unpublishFunnelSchema,
  previewFunnelSchema,

  // Analytics schemas
  funnelAnalyticsQuerySchema,

  // Conditional logic schemas
  conditionSchema,
  conditionGroupSchema,
  conditionalLogicSchema,

  // Import/Export schemas
  exportFunnelSchema,
  importFunnelSchema,

  // Versioning schemas
  createVersionSchema,
  restoreVersionSchema,

  // Helper functions
  validateFunnelNameUnique,
  validateSlugUnique,
  generateSlugFromName,
  safeParseCreateFunnel,
  safeParseUpdateFunnel,
  safeParseCloneFunnel,
  safeParseFunnelSettings,
  safeParsePublishFunnel,
  formatFunnelErrors,
  validateConditionalLogic,

  // Types
  FunnelSchemaTypes,
};
