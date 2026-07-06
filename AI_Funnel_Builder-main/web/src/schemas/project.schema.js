// =============================================================================
// AI FUNNEL PLATFORM - PROJECT VALIDATION SCHEMAS
// =============================================================================
// Comprehensive validation for project creation, updates, and management
// Using Zod for runtime validation
// =============================================================================

import { z } from 'zod';
import { TEXT_LIMITS, VALIDATION_CONFIG } from '@config/constants';

// =============================================================================
// BASE VALIDATION SCHEMAS
// =============================================================================

/**
 * Project Name Schema
 */
export const projectNameSchema = z
  .string()
  .min(TEXT_LIMITS.PROJECT_NAME_MIN, `Project name must be at least ${TEXT_LIMITS.PROJECT_NAME_MIN} characters`)
  .max(TEXT_LIMITS.PROJECT_NAME_MAX, `Project name must be less than ${TEXT_LIMITS.PROJECT_NAME_MAX} characters`)
  .trim()
  .refine(
    (name) => !/^\s*$/.test(name),
    { message: 'Project name cannot be only whitespace' }
  );

/**
 * Project Description Schema
 */
export const projectDescriptionSchema = z
  .string()
  .max(TEXT_LIMITS.PROJECT_DESCRIPTION_MAX, `Description must be less than ${TEXT_LIMITS.PROJECT_DESCRIPTION_MAX} characters`)
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Project Slug Schema
 */
export const projectSlugSchema = z
  .string()
  .min(TEXT_LIMITS.PROJECT_SLUG_MIN, `Slug must be at least ${TEXT_LIMITS.PROJECT_SLUG_MIN} characters`)
  .max(TEXT_LIMITS.PROJECT_SLUG_MAX, `Slug must be less than ${TEXT_LIMITS.PROJECT_SLUG_MAX} characters`)
  .regex(VALIDATION_CONFIG.SLUG_PATTERN, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .toLowerCase()
  .trim()
  .refine(
    (slug) => {
      const reserved = ['admin', 'api', 'app', 'dashboard', 'settings', 'new', 'create', 'edit'];
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
 * Industry Schema
 */
export const industrySchema = z.enum([
  'technology',
  'ecommerce',
  'saas',
  'healthcare',
  'finance',
  'education',
  'real_estate',
  'consulting',
  'marketing',
  'agency',
  'nonprofit',
  'retail',
  'hospitality',
  'fitness',
  'legal',
  'automotive',
  'manufacturing',
  'media',
  'travel',
  'food_beverage',
  'fashion',
  'beauty',
  'gaming',
  'entertainment',
  'other',
], { errorMap: () => ({ message: 'Invalid industry' }) });

/**
 * Business Type Schema
 */
export const businessTypeSchema = z.enum([
  'b2b',
  'b2c',
  'b2b2c',
  'marketplace',
  'ecommerce',
  'service',
  'agency',
  'startup',
  'enterprise',
  'freelancer',
  'other',
], { errorMap: () => ({ message: 'Invalid business type' }) });

/**
 * Project Status Schema
 */
export const projectStatusSchema = z.enum([
  'active',
  'archived',
  'paused',
], { errorMap: () => ({ message: 'Invalid project status' }) });

/**
 * Project Color Schema
 */
export const projectColorSchema = z
  .string()
  .regex(VALIDATION_CONFIG.HEX_COLOR_PATTERN, 'Invalid color format. Use hex format (e.g., #FF5733)')
  .optional();

/**
 * Project Icon Schema
 */
export const projectIconSchema = z
  .string()
  .max(50)
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
 * Tag Schema
 */
export const tagSchema = z
  .string()
  .min(TEXT_LIMITS.TAG_MIN)
  .max(TEXT_LIMITS.TAG_MAX)
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
// PROJECT SETTINGS SCHEMAS
// =============================================================================

/**
 * Project Branding Schema
 */
export const projectBrandingSchema = z.object({
  primaryColor: projectColorSchema,
  secondaryColor: projectColorSchema,
  logoUrl: urlSchema,
  faviconUrl: urlSchema,
  brandName: z.string().max(100).optional(),
  tagline: z.string().max(200).optional(),
});

/**
 * Project Contact Info Schema
 */
export const projectContactSchema = z.object({
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().regex(VALIDATION_CONFIG.PHONE_PATTERN, 'Invalid phone number').optional().or(z.literal('')),
  website: urlSchema,
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().length(2, 'Use ISO country code').optional(), // ISO code
  postalCode: z.string().max(20).optional(),
});

/**
 * Project Social Links Schema
 */
export const projectSocialSchema = z.object({
  facebook: urlSchema,
  twitter: urlSchema,
  linkedin: urlSchema,
  instagram: urlSchema,
  youtube: urlSchema,
  tiktok: urlSchema,
  pinterest: urlSchema,
  github: urlSchema,
}).optional();

/**
 * Project Goals Schema
 */
export const projectGoalsSchema = z.object({
  monthlyLeadTarget: z.number().int().min(0).optional(),
  monthlyConversionTarget: z.number().int().min(0).optional(),
  averageLeadValue: z.number().min(0).optional(),
  annualRevenueTarget: z.number().min(0).optional(),
  customGoals: z.array(
    z.object({
      name: z.string().min(1).max(100),
      target: z.number().min(0),
      unit: z.string().max(50).optional(),
    })
  ).max(10).optional(),
}).optional();

/**
 * Project Notification Settings Schema
 */
export const projectNotificationSchema = z.object({
  enableEmailNotifications: z.boolean().optional().default(true),
  notificationEmails: z.array(z.string().email()).max(10).optional().default([]),
  notifyOnNewLead: z.boolean().optional().default(true),
  notifyOnFunnelPublish: z.boolean().optional().default(false),
  notifyOnMilestone: z.boolean().optional().default(true),
  dailyDigest: z.boolean().optional().default(false),
  weeklyReport: z.boolean().optional().default(true),
  monthlyReport: z.boolean().optional().default(false),
}).optional();

/**
 * Project Integrations Schema
 */
export const projectIntegrationsSchema = z.object({
  googleAnalytics: z.object({
    enabled: z.boolean().default(false),
    propertyId: z.string().max(50).optional(),
  }).optional(),
  facebookPixel: z.object({
    enabled: z.boolean().default(false),
    pixelId: z.string().max(50).optional(),
  }).optional(),
  linkedInInsight: z.object({
    enabled: z.boolean().default(false),
    partnerId: z.string().max(50).optional(),
  }).optional(),
  crm: z.object({
    provider: z.enum(['salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom']).optional(),
    enabled: z.boolean().default(false),
    apiKey: z.string().max(200).optional(),
    webhookUrl: urlSchema,
  }).optional(),
  emailMarketing: z.object({
    provider: z.enum(['mailchimp', 'sendgrid', 'convertkit', 'activecampaign', 'custom']).optional(),
    enabled: z.boolean().default(false),
    apiKey: z.string().max(200).optional(),
    listId: z.string().max(100).optional(),
  }).optional(),
  zapier: z.object({
    enabled: z.boolean().default(false),
    webhookUrl: urlSchema,
  }).optional(),
}).optional();

/**
 * Combined Project Settings Schema
 */
export const projectSettingsSchema = z.object({
  branding: projectBrandingSchema.optional(),
  contact: projectContactSchema.optional(),
  social: projectSocialSchema,
  goals: projectGoalsSchema,
  notifications: projectNotificationSchema,
  integrations: projectIntegrationsSchema,
  timezone: z.string().max(50).optional().default('UTC'),
  currency: z.string().length(3).optional().default('USD'), // ISO currency code
  language: z.string().length(2).optional().default('en'), // ISO language code
});

// =============================================================================
// PROJECT CRUD SCHEMAS
// =============================================================================

/**
 * Create Project Schema
 */
export const createProjectSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema,
  slug: projectSlugSchema.optional(), // Auto-generated if not provided
  industry: industrySchema,
  businessType: businessTypeSchema.optional(),
  color: projectColorSchema,
  icon: projectIconSchema,
  tags: tagsSchema,
  settings: projectSettingsSchema.optional(),
  isDefault: z.boolean().optional().default(false),
});

/**
 * Update Project Schema
 */
export const updateProjectSchema = z.object({
  name: projectNameSchema.optional(),
  description: projectDescriptionSchema,
  slug: projectSlugSchema.optional(),
  industry: industrySchema.optional(),
  businessType: businessTypeSchema.optional(),
  color: projectColorSchema,
  icon: projectIconSchema,
  tags: tagsSchema,
  status: projectStatusSchema.optional(),
  settings: projectSettingsSchema.optional(),
  isDefault: z.boolean().optional(),
});

/**
 * Delete Project Schema
 */
export const deleteProjectSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  permanent: z.boolean().optional().default(false),
  transferFunnelsTo: z.string().uuid('Invalid project ID').optional(), // Transfer to another project
  confirmText: z
    .string()
    .refine((val) => val === 'DELETE', {
      message: 'Type DELETE to confirm',
    })
    .optional(),
});

/**
 * Archive Project Schema
 */
export const archiveProjectSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  reason: z.enum(['completed', 'paused', 'no_longer_needed', 'other']).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Restore Project Schema
 */
export const restoreProjectSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
});

// =============================================================================
// PROJECT TEAM & COLLABORATION SCHEMAS
// =============================================================================

/**
 * Project Member Schema
 */
export const projectMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['owner', 'admin', 'editor', 'viewer']).default('editor'),
  permissions: z.array(
    z.enum([
      'project.read',
      'project.update',
      'project.delete',
      'funnel.create',
      'funnel.read',
      'funnel.update',
      'funnel.delete',
      'funnel.publish',
      'lead.read',
      'lead.update',
      'lead.export',
      'lead.delete',
      'analytics.view',
      'settings.update',
      'team.manage',
    ])
  ).optional(),
});

/**
 * Add Project Member Schema
 */
export const addProjectMemberSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'editor', 'viewer']).default('editor'),
  customPermissions: z.array(z.string()).optional(),
  sendInviteEmail: z.boolean().optional().default(true),
  message: z.string().max(500).optional(),
});

/**
 * Update Project Member Schema
 */
export const updateProjectMemberSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['owner', 'admin', 'editor', 'viewer']).optional(),
  permissions: z.array(z.string()).optional(),
});

/**
 * Remove Project Member Schema
 */
export const removeProjectMemberSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  userId: z.string().uuid('Invalid user ID'),
  transferOwnership: z.string().uuid('Invalid user ID').optional(), // For owner removal
});

/**
 * Transfer Project Ownership Schema
 */
export const transferOwnershipSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  newOwnerId: z.string().uuid('Invalid user ID'),
  confirmTransfer: z.boolean().refine((val) => val === true, {
    message: 'You must confirm the ownership transfer',
  }),
});

// =============================================================================
// PROJECT FILTERING & SEARCH SCHEMAS
// =============================================================================

/**
 * Project Filter Schema
 */
export const projectFilterSchema = z.object({
  // Basic filters
  status: z.array(projectStatusSchema).optional(),
  industry: z.array(industrySchema).optional(),
  businessType: z.array(businessTypeSchema).optional(),
  tags: z.array(tagSchema).optional(),
  
  // Date filters
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  updatedAfter: z.string().datetime().optional(),
  updatedBefore: z.string().datetime().optional(),
  
  // Membership filter
  myProjects: z.boolean().optional(),
  role: z.array(z.enum(['owner', 'admin', 'editor', 'viewer'])).optional(),
  
  // Statistics filters
  minFunnels: z.number().int().min(0).optional(),
  maxFunnels: z.number().int().min(0).optional(),
  minLeads: z.number().int().min(0).optional(),
  hasActiveFunnels: z.boolean().optional(),
  
  // Pagination
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  
  // Sorting
  sortBy: z.enum(['name', 'created_at', 'updated_at', 'funnel_count', 'lead_count']).optional().default('updated_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Project Search Schema
 */
export const projectSearchSchema = z.object({
  query: z.string().min(1).max(200),
  searchIn: z.array(z.enum(['name', 'description', 'tags'])).optional().default(['name', 'description']),
  filters: projectFilterSchema.optional(),
});

// =============================================================================
// PROJECT STATISTICS & ANALYTICS SCHEMAS
// =============================================================================

/**
 * Project Statistics Query Schema
 */
export const projectStatsQuerySchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).optional(),
  includeChildData: z.boolean().optional().default(true), // Include funnel stats
  metrics: z.array(
    z.enum([
      'total_funnels',
      'active_funnels',
      'total_leads',
      'new_leads',
      'avg_conversion_rate',
      'total_views',
      'total_completions',
    ])
  ).optional(),
});

// =============================================================================
// PROJECT TEMPLATES SCHEMAS
// =============================================================================

/**
 * Create Project Template Schema
 */
export const createProjectTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  industry: industrySchema,
  businessType: businessTypeSchema.optional(),
  includeFunnels: z.boolean().optional().default(true),
  includeSettings: z.boolean().optional().default(true),
  isPublic: z.boolean().optional().default(false),
  tags: tagsSchema,
});

/**
 * Create Project from Template Schema
 */
export const createFromTemplateSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  projectName: projectNameSchema,
  customizeSettings: z.boolean().optional().default(true),
  includeFunnels: z.boolean().optional().default(true),
});

// =============================================================================
// PROJECT EXPORT/IMPORT SCHEMAS
// =============================================================================

/**
 * Export Project Schema
 */
export const exportProjectSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  format: z.enum(['json', 'zip']).default('json'),
  includeFunnels: z.boolean().optional().default(true),
  includeLeads: z.boolean().optional().default(false),
  includeAnalytics: z.boolean().optional().default(false),
  includeSettings: z.boolean().optional().default(true),
  includeTeamMembers: z.boolean().optional().default(false),
});

/**
 * Import Project Schema
 */
export const importProjectSchema = z.object({
  data: z.string().min(1, 'Import data is required'), // JSON string
  projectName: projectNameSchema.optional(),
  overwriteSettings: z.boolean().optional().default(false),
  generateNewIds: z.boolean().optional().default(true),
});

// =============================================================================
// PROJECT DUPLICATION SCHEMAS
// =============================================================================

/**
 * Duplicate Project Schema
 */
export const duplicateProjectSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  newName: projectNameSchema,
  newSlug: projectSlugSchema.optional(),
  includeFunnels: z.boolean().optional().default(true),
  includeLeads: z.boolean().optional().default(false),
  includeSettings: z.boolean().optional().default(true),
  includeTeamMembers: z.boolean().optional().default(false),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate slug from project name
 */
export const generateSlugFromName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .substring(0, TEXT_LIMITS.PROJECT_SLUG_MAX);
};

/**
 * Validate project name uniqueness
 */
export const validateProjectNameUnique = async (name, userId, excludeProjectId = null) => {
  // This would typically call your API
  return true;
};

/**
 * Validate slug uniqueness
 */
export const validateSlugUnique = async (slug, userId, excludeProjectId = null) => {
  // This would typically call your API
  return true;
};

/**
 * Get default project color
 */
export const getDefaultProjectColor = () => {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Get default project icon
 */
export const getDefaultProjectIcon = (industry) => {
  const iconMap = {
    technology: 'Laptop',
    ecommerce: 'ShoppingCart',
    saas: 'Cloud',
    healthcare: 'Heart',
    finance: 'DollarSign',
    education: 'BookOpen',
    real_estate: 'Home',
    consulting: 'Briefcase',
    marketing: 'TrendingUp',
    agency: 'Users',
    nonprofit: 'HandHeart',
    retail: 'Store',
    hospitality: 'Hotel',
    fitness: 'Dumbbell',
    legal: 'Scale',
    automotive: 'Car',
    manufacturing: 'Factory',
    media: 'Tv',
    travel: 'Plane',
    food_beverage: 'Coffee',
    fashion: 'Shirt',
    beauty: 'Sparkles',
    gaming: 'Gamepad',
    entertainment: 'Film',
    other: 'Folder',
  };
  return iconMap[industry] || 'Folder';
};

/**
 * Safe parse helpers
 */
export const safeParseCreateProject = (data) => {
  return createProjectSchema.safeParse(data);
};

export const safeParseUpdateProject = (data) => {
  return updateProjectSchema.safeParse(data);
};

export const safeParseAddMember = (data) => {
  return addProjectMemberSchema.safeParse(data);
};

export const safeParseProjectFilter = (data) => {
  return projectFilterSchema.safeParse(data);
};

/**
 * Format Zod errors for display
 */
export const formatProjectErrors = (zodError) => {
  const errors = {};
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  return errors;
};

/**
 * Validate project member permissions
 */
export const validateMemberPermissions = (role, permissions) => {
  const rolePermissions = {
    owner: ['*'], // All permissions
    admin: [
      'project.read',
      'project.update',
      'funnel.create',
      'funnel.read',
      'funnel.update',
      'funnel.delete',
      'funnel.publish',
      'lead.read',
      'lead.update',
      'lead.export',
      'analytics.view',
      'settings.update',
      'team.manage',
    ],
    editor: [
      'project.read',
      'funnel.create',
      'funnel.read',
      'funnel.update',
      'funnel.publish',
      'lead.read',
      'lead.update',
      'analytics.view',
    ],
    viewer: ['project.read', 'funnel.read', 'lead.read', 'analytics.view'],
  };
  
  const allowedPermissions = rolePermissions[role] || [];
  
  if (allowedPermissions.includes('*')) return true;
  
  return permissions.every((perm) => allowedPermissions.includes(perm));
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export const ProjectSchemaTypes = {
  Name: projectNameSchema,
  Description: projectDescriptionSchema,
  Slug: projectSlugSchema,
  Industry: industrySchema,
  BusinessType: businessTypeSchema,
  Status: projectStatusSchema,
  CreateProject: createProjectSchema,
  UpdateProject: updateProjectSchema,
  ProjectSettings: projectSettingsSchema,
  AddMember: addProjectMemberSchema,
  ProjectFilter: projectFilterSchema,
};

/**
 * Default Export
 */
export default {
  // Base schemas
  projectNameSchema,
  projectDescriptionSchema,
  projectSlugSchema,
  industrySchema,
  businessTypeSchema,
  projectStatusSchema,
  projectColorSchema,
  projectIconSchema,
  urlSchema,
  tagSchema,
  tagsSchema,

  // Settings schemas
  projectBrandingSchema,
  projectContactSchema,
  projectSocialSchema,
  projectGoalsSchema,
  projectNotificationSchema,
  projectIntegrationsSchema,
  projectSettingsSchema,

  // CRUD schemas
  createProjectSchema,
  updateProjectSchema,
  deleteProjectSchema,
  archiveProjectSchema,
  restoreProjectSchema,

  // Team schemas
  projectMemberSchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
  removeProjectMemberSchema,
  transferOwnershipSchema,

  // Filter & search schemas
  projectFilterSchema,
  projectSearchSchema,

  // Statistics schemas
  projectStatsQuerySchema,

  // Template schemas
  createProjectTemplateSchema,
  createFromTemplateSchema,

  // Export/Import schemas
  exportProjectSchema,
  importProjectSchema,

  // Duplication schemas
  duplicateProjectSchema,

  // Helper functions
  generateSlugFromName,
  validateProjectNameUnique,
  validateSlugUnique,
  getDefaultProjectColor,
  getDefaultProjectIcon,
  safeParseCreateProject,
  safeParseUpdateProject,
  safeParseAddMember,
  safeParseProjectFilter,
  formatProjectErrors,
  validateMemberPermissions,

  // Types
  ProjectSchemaTypes,
};
