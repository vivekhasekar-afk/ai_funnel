// =============================================================================
// AI FUNNEL PLATFORM - LEAD VALIDATION SCHEMAS
// =============================================================================
// Comprehensive validation for lead capture, management, and operations
// Using Zod for runtime validation
// =============================================================================

import { z } from 'zod';
import { TEXT_LIMITS, VALIDATION_CONFIG } from '@config/constants';
import { LEAD_STATUS } from '@config/constants';

// =============================================================================
// BASE VALIDATION SCHEMAS
// =============================================================================

/**
 * Lead Email Schema
 */
export const leadEmailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

/**
 * Lead Name Schema
 */
export const leadNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(TEXT_LIMITS.NAME_MAX, `Name must be less than ${TEXT_LIMITS.NAME_MAX} characters`)
  .trim();

/**
 * Lead Phone Schema
 */
export const leadPhoneSchema = z
  .string()
  .regex(VALIDATION_CONFIG.PHONE_PATTERN, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

/**
 * Lead Company Schema
 */
export const leadCompanySchema = z
  .string()
  .max(TEXT_LIMITS.COMPANY_MAX, `Company name must be less than ${TEXT_LIMITS.COMPANY_MAX} characters`)
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Lead Status Schema
 */
export const leadStatusSchema = z.enum(
  [LEAD_STATUS.NEW, LEAD_STATUS.CONTACTED, LEAD_STATUS.QUALIFIED, LEAD_STATUS.CONVERTED, LEAD_STATUS.LOST],
  { errorMap: () => ({ message: 'Invalid lead status' }) }
);

/**
 * Lead Score Schema
 */
export const leadScoreSchema = z
  .number()
  .int()
  .min(0)
  .max(100)
  .optional();

/**
 * Lead Tag Schema
 */
export const leadTagSchema = z
  .string()
  .min(TEXT_LIMITS.TAG_MIN)
  .max(TEXT_LIMITS.TAG_MAX)
  .trim();

/**
 * Lead Tags Array Schema
 */
export const leadTagsSchema = z
  .array(leadTagSchema)
  .max(TEXT_LIMITS.MAX_TAGS, `Maximum ${TEXT_LIMITS.MAX_TAGS} tags allowed`)
  .optional()
  .default([]);

/**
 * Lead Source Schema
 */
export const leadSourceSchema = z
  .string()
  .max(100)
  .optional()
  .or(z.literal(''));

/**
 * UTM Parameters Schema
 */
export const utmParametersSchema = z.object({
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_term: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
}).optional();

/**
 * Lead Custom Field Schema
 */
export const leadCustomFieldSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Key can only contain letters, numbers, and underscores'),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  type: z.enum(['text', 'number', 'boolean', 'date', 'select']).optional(),
});

/**
 * Lead Custom Fields Array Schema
 */
export const leadCustomFieldsSchema = z
  .array(leadCustomFieldSchema)
  .max(50, 'Maximum 50 custom fields allowed')
  .optional()
  .default([]);

/**
 * Lead Response Schema (Question + Answer)
 */
export const leadResponseSchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
  questionText: z.string().min(1),
  questionType: z.string().min(1),
  answer: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.null(),
  ]),
  answeredAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Lead Responses Array Schema
 */
export const leadResponsesSchema = z
  .array(leadResponseSchema)
  .optional()
  .default([]);

// =============================================================================
// LEAD CAPTURE SCHEMAS
// =============================================================================

/**
 * Submit Lead Schema (Public Funnel Submission)
 */
export const submitLeadSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  email: leadEmailSchema,
  name: leadNameSchema.optional(),
  phone: leadPhoneSchema,
  company: leadCompanySchema,
  responses: leadResponsesSchema,
  customFields: leadCustomFieldsSchema,
  
  // Tracking data
  source: leadSourceSchema,
  referrer: z.string().url().optional().or(z.literal('')),
  landingPage: z.string().url().optional().or(z.literal('')),
  utmParameters: utmParametersSchema,
  
  // Device & Location
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  country: z.string().length(2).optional(), // ISO country code
  city: z.string().max(100).optional(),
  
  // Consent & Privacy
  consentMarketing: z.boolean().optional().default(false),
  consentData: z.boolean().optional().default(true),
  gdprConsent: z.boolean().optional(),
  
  // Anti-spam
  honeypot: z.string().max(0).optional(), // Should be empty
  recaptchaToken: z.string().optional(),
  timestamp: z.number().optional(), // For spam detection
});

/**
 * Quick Lead Capture Schema (Simple form)
 */
export const quickCaptureLeadSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  email: leadEmailSchema,
  name: leadNameSchema.optional(),
  source: leadSourceSchema,
  tags: leadTagsSchema,
});

// =============================================================================
// LEAD MANAGEMENT SCHEMAS
// =============================================================================

/**
 * Create Lead Schema (Manual creation)
 */
export const createLeadSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID').optional(),
  email: leadEmailSchema,
  name: leadNameSchema,
  phone: leadPhoneSchema,
  company: leadCompanySchema,
  status: leadStatusSchema.optional().default(LEAD_STATUS.NEW),
  score: leadScoreSchema,
  source: leadSourceSchema,
  tags: leadTagsSchema,
  customFields: leadCustomFieldsSchema,
  responses: leadResponsesSchema,
  notes: z.string().max(2000).optional(),
  assignedTo: z.string().uuid('Invalid user ID').optional(),
});

/**
 * Update Lead Schema
 */
export const updateLeadSchema = z.object({
  name: leadNameSchema.optional(),
  phone: leadPhoneSchema,
  company: leadCompanySchema,
  status: leadStatusSchema.optional(),
  score: leadScoreSchema,
  source: leadSourceSchema,
  tags: leadTagsSchema,
  customFields: leadCustomFieldsSchema,
  notes: z.string().max(2000).optional(),
  assignedTo: z.string().uuid('Invalid user ID').optional().nullable(),
});

/**
 * Delete Lead Schema
 */
export const deleteLeadSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  permanent: z.boolean().optional().default(false),
  reason: z.enum(['duplicate', 'spam', 'gdpr_request', 'other']).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Merge Leads Schema
 */
export const mergeLeadsSchema = z.object({
  primaryLeadId: z.string().uuid('Invalid lead ID'),
  secondaryLeadIds: z.array(z.string().uuid('Invalid lead ID')).min(1).max(10),
  preferredData: z.enum(['primary', 'most_recent', 'most_complete']).optional().default('primary'),
  mergeResponses: z.boolean().optional().default(true),
  mergeCustomFields: z.boolean().optional().default(true),
  mergeTags: z.boolean().optional().default(true),
  deleteSecondary: z.boolean().optional().default(true),
});

// =============================================================================
// LEAD FILTERING & SEARCH SCHEMAS
// =============================================================================

/**
 * Lead Filter Schema
 */
export const leadFilterSchema = z.object({
  // Basic filters
  funnelId: z.string().uuid().optional(),
  status: z.array(leadStatusSchema).optional(),
  tags: z.array(leadTagSchema).optional(),
  source: z.array(z.string().max(100)).optional(),
  
  // Score filter
  minScore: z.number().int().min(0).max(100).optional(),
  maxScore: z.number().int().min(0).max(100).optional(),
  
  // Date filters
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  updatedAfter: z.string().datetime().optional(),
  updatedBefore: z.string().datetime().optional(),
  
  // Assignment filter
  assignedTo: z.string().uuid().optional(),
  unassigned: z.boolean().optional(),
  
  // Engagement filters
  hasPhone: z.boolean().optional(),
  hasCompany: z.boolean().optional(),
  hasResponses: z.boolean().optional(),
  completedFunnel: z.boolean().optional(),
  
  // Custom field filters
  customFields: z.array(
    z.object({
      key: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
      value: z.union([z.string(), z.number(), z.boolean()]),
    })
  ).optional(),
  
  // Pagination
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  
  // Sorting
  sortBy: z.enum(['created_at', 'updated_at', 'name', 'email', 'score', 'status']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).refine(
  (data) => {
    if (data.minScore !== undefined && data.maxScore !== undefined) {
      return data.minScore <= data.maxScore;
    }
    return true;
  },
  { message: 'Min score must be less than or equal to max score' }
).refine(
  (data) => {
    if (data.createdAfter && data.createdBefore) {
      return new Date(data.createdAfter) <= new Date(data.createdBefore);
    }
    return true;
  },
  { message: 'Created after date must be before created before date' }
);

/**
 * Lead Search Schema
 */
export const leadSearchSchema = z.object({
  query: z.string().min(1).max(200),
  searchIn: z.array(z.enum(['name', 'email', 'company', 'phone', 'notes', 'responses'])).optional().default(['name', 'email']),
  filters: leadFilterSchema.optional(),
});

/**
 * Advanced Lead Query Schema
 */
export const advancedLeadQuerySchema = z.object({
  filters: leadFilterSchema,
  includeResponses: z.boolean().optional().default(false),
  includeCustomFields: z.boolean().optional().default(true),
  includeNotes: z.boolean().optional().default(false),
  includeActivity: z.boolean().optional().default(false),
});

// =============================================================================
// LEAD TAGGING SCHEMAS
// =============================================================================

/**
 * Add Tags to Lead Schema
 */
export const addLeadTagsSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  tags: z.array(leadTagSchema).min(1, 'At least one tag is required').max(10),
});

/**
 * Remove Tags from Lead Schema
 */
export const removeLeadTagsSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  tags: z.array(leadTagSchema).min(1, 'At least one tag is required'),
});

/**
 * Replace Lead Tags Schema
 */
export const replaceLeadTagsSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  tags: leadTagsSchema,
});

/**
 * Bulk Tag Leads Schema
 */
export const bulkTagLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid('Invalid lead ID')).min(1).max(100, 'Maximum 100 leads at once'),
  tags: z.array(leadTagSchema).min(1).max(10),
  action: z.enum(['add', 'remove', 'replace']).default('add'),
});

// =============================================================================
// LEAD EXPORT SCHEMAS
// =============================================================================

/**
 * Export Leads Schema
 */
export const exportLeadsSchema = z.object({
  filters: leadFilterSchema.optional(),
  format: z.enum(['csv', 'xlsx', 'json', 'pdf']).default('csv'),
  
  // Field selection
  fields: z.array(
    z.enum([
      'id',
      'email',
      'name',
      'phone',
      'company',
      'status',
      'score',
      'source',
      'tags',
      'created_at',
      'updated_at',
      'assigned_to',
      'responses',
      'custom_fields',
      'notes',
    ])
  ).optional(),
  
  // Options
  includeHeaders: z.boolean().optional().default(true),
  includeResponses: z.boolean().optional().default(true),
  includeCustomFields: z.boolean().optional().default(true),
  flattenResponses: z.boolean().optional().default(true),
  
  // Limits
  maxRows: z.number().int().min(1).max(100000).optional(),
  
  // Scheduling
  scheduleExport: z.boolean().optional().default(false),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  emailTo: z.array(z.string().email()).max(10).optional(),
});

/**
 * Import Leads Schema
 */
export const importLeadsSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
  data: z.string().min(1, 'Import data is required'), // File content or JSON string
  
  // Field mapping
  fieldMapping: z.record(z.string()).optional(), // Maps source fields to lead fields
  
  // Options
  skipDuplicates: z.boolean().optional().default(true),
  updateExisting: z.boolean().optional().default(false),
  duplicateCheckField: z.enum(['email', 'phone', 'email_phone']).optional().default('email'),
  defaultStatus: leadStatusSchema.optional().default(LEAD_STATUS.NEW),
  defaultTags: leadTagsSchema,
  
  // Validation
  validateEmails: z.boolean().optional().default(true),
  requireName: z.boolean().optional().default(false),
  
  // Limits
  maxRows: z.number().int().min(1).max(10000).optional().default(1000),
});

// =============================================================================
// LEAD BULK OPERATIONS SCHEMAS
// =============================================================================

/**
 * Bulk Update Leads Schema
 */
export const bulkUpdateLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid('Invalid lead ID')).min(1).max(100),
  updates: z.object({
    status: leadStatusSchema.optional(),
    score: leadScoreSchema,
    assignedTo: z.string().uuid('Invalid user ID').optional().nullable(),
    tags: z.object({
      action: z.enum(['add', 'remove', 'replace']),
      values: leadTagsSchema,
    }).optional(),
  }),
});

/**
 * Bulk Delete Leads Schema
 */
export const bulkDeleteLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid('Invalid lead ID')).min(1).max(100),
  permanent: z.boolean().optional().default(false),
  reason: z.enum(['duplicate', 'spam', 'gdpr_request', 'bulk_cleanup', 'other']).optional(),
});

/**
 * Bulk Assign Leads Schema
 */
export const bulkAssignLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid('Invalid lead ID')).min(1).max(100),
  assignedTo: z.string().uuid('Invalid user ID'),
  notifyAssignee: z.boolean().optional().default(true),
});

// =============================================================================
// LEAD NOTES & ACTIVITY SCHEMAS
// =============================================================================

/**
 * Add Lead Note Schema
 */
export const addLeadNoteSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  note: z.string().min(1).max(TEXT_LIMITS.MESSAGE_MAX),
  type: z.enum(['note', 'call', 'email', 'meeting', 'task']).optional().default('note'),
  private: z.boolean().optional().default(false),
});

/**
 * Update Lead Note Schema
 */
export const updateLeadNoteSchema = z.object({
  noteId: z.string().uuid('Invalid note ID'),
  note: z.string().min(1).max(TEXT_LIMITS.MESSAGE_MAX),
});

/**
 * Delete Lead Note Schema
 */
export const deleteLeadNoteSchema = z.object({
  noteId: z.string().uuid('Invalid note ID'),
});

/**
 * Lead Activity Log Filter Schema
 */
export const leadActivityFilterSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  activityTypes: z.array(
    z.enum(['submission', 'update', 'status_change', 'tag_added', 'tag_removed', 'note_added', 'assigned', 'email_sent'])
  ).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});

// =============================================================================
// LEAD ENRICHMENT SCHEMAS
// =============================================================================

/**
 * Enrich Lead Schema
 */
export const enrichLeadSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  provider: z.enum(['clearbit', 'fullcontact', 'hunter', 'custom']).optional(),
  enrichFields: z.array(
    z.enum(['company_info', 'social_profiles', 'job_title', 'location', 'phone', 'website'])
  ).optional(),
  overwriteExisting: z.boolean().optional().default(false),
});

/**
 * Verify Lead Email Schema
 */
export const verifyLeadEmailSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  provider: z.enum(['zerobounce', 'neverbounce', 'emaillistverify']).optional(),
});

// =============================================================================
// LEAD SCORING SCHEMAS
// =============================================================================

/**
 * Update Lead Score Schema
 */
export const updateLeadScoreSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  score: leadScoreSchema,
  reason: z.string().max(200).optional(),
  automated: z.boolean().optional().default(false),
});

/**
 * Bulk Calculate Lead Scores Schema
 */
export const bulkCalculateScoresSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID').optional(),
  leadIds: z.array(z.string().uuid()).optional(), // If not provided, score all leads
  scoringRules: z.object({
    emailProvided: z.number().int().optional(),
    phoneProvided: z.number().int().optional(),
    companyProvided: z.number().int().optional(),
    completedFunnel: z.number().int().optional(),
    responseCount: z.number().int().optional(),
    customFields: z.array(
      z.object({
        field: z.string(),
        value: z.any(),
        points: z.number().int(),
      })
    ).optional(),
  }).optional(),
});

// =============================================================================
// LEAD GDPR & PRIVACY SCHEMAS
// =============================================================================

/**
 * GDPR Data Request Schema
 */
export const gdprDataRequestSchema = z.object({
  email: leadEmailSchema,
  requestType: z.enum(['access', 'export', 'delete', 'rectify']),
  verificationToken: z.string().optional(),
});

/**
 * Anonymize Lead Schema
 */
export const anonymizeLeadSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  keepResponses: z.boolean().optional().default(false),
  keepMetadata: z.boolean().optional().default(false),
});

/**
 * Unsubscribe Lead Schema
 */
export const unsubscribeLeadSchema = z.object({
  email: leadEmailSchema,
  unsubscribeFrom: z.array(
    z.enum(['marketing', 'transactional', 'newsletter', 'all'])
  ).min(1),
  reason: z.string().max(500).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate email domain
 */
export const isValidEmailDomain = (email) => {
  const domain = email.split('@')[1];
  const disposableDomains = ['tempmail.com', 'throwaway.email', 'guerrillamail.com'];
  return !disposableDomains.includes(domain);
};

/**
 * Calculate lead completeness score
 */
export const calculateLeadCompleteness = (lead) => {
  const fields = ['name', 'email', 'phone', 'company'];
  const filledFields = fields.filter((field) => lead[field] && lead[field].trim() !== '');
  return Math.round((filledFields.length / fields.length) * 100);
};

/**
 * Detect duplicate leads
 */
export const detectDuplicates = (existingLeads, newLead, checkField = 'email') => {
  return existingLeads.filter((lead) => {
    if (checkField === 'email') {
      return lead.email.toLowerCase() === newLead.email.toLowerCase();
    }
    if (checkField === 'phone') {
      return lead.phone === newLead.phone;
    }
    if (checkField === 'email_phone') {
      return (
        lead.email.toLowerCase() === newLead.email.toLowerCase() ||
        (lead.phone && newLead.phone && lead.phone === newLead.phone)
      );
    }
    return false;
  });
};

/**
 * Safe parse helpers
 */
export const safeParseSubmitLead = (data) => {
  return submitLeadSchema.safeParse(data);
};

export const safeParseCreateLead = (data) => {
  return createLeadSchema.safeParse(data);
};

export const safeParseUpdateLead = (data) => {
  return updateLeadSchema.safeParse(data);
};

export const safeParseLeadFilter = (data) => {
  return leadFilterSchema.safeParse(data);
};

export const safeParseExportLeads = (data) => {
  return exportLeadsSchema.safeParse(data);
};

export const safeParseImportLeads = (data) => {
  return importLeadsSchema.safeParse(data);
};

export const safeParseBulkUpdateLeads = (data) => {
  return bulkUpdateLeadsSchema.safeParse(data);
};

/**
 * Format Zod errors for display
 */
export const formatLeadErrors = (zodError) => {
  const errors = {};
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  return errors;
};

/**
 * Sanitize lead data
 */
export const sanitizeLeadData = (lead) => {
  return {
    ...lead,
    name: lead.name?.trim() || '',
    email: lead.email?.toLowerCase().trim() || '',
    company: lead.company?.trim() || '',
    phone: lead.phone?.trim() || '',
  };
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export const LeadSchemaTypes = {
  Email: leadEmailSchema,
  Name: leadNameSchema,
  Phone: leadPhoneSchema,
  Status: leadStatusSchema,
  SubmitLead: submitLeadSchema,
  CreateLead: createLeadSchema,
  UpdateLead: updateLeadSchema,
  LeadFilter: leadFilterSchema,
  ExportLeads: exportLeadsSchema,
  ImportLeads: importLeadsSchema,
  BulkUpdateLeads: bulkUpdateLeadsSchema,
};

/**
 * Default Export
 */
export default {
  // Base schemas
  leadEmailSchema,
  leadNameSchema,
  leadPhoneSchema,
  leadCompanySchema,
  leadStatusSchema,
  leadScoreSchema,
  leadTagSchema,
  leadTagsSchema,
  leadSourceSchema,
  utmParametersSchema,
  leadCustomFieldSchema,
  leadCustomFieldsSchema,
  leadResponseSchema,
  leadResponsesSchema,

  // Capture schemas
  submitLeadSchema,
  quickCaptureLeadSchema,

  // Management schemas
  createLeadSchema,
  updateLeadSchema,
  deleteLeadSchema,
  mergeLeadsSchema,

  // Filter & search schemas
  leadFilterSchema,
  leadSearchSchema,
  advancedLeadQuerySchema,

  // Tagging schemas
  addLeadTagsSchema,
  removeLeadTagsSchema,
  replaceLeadTagsSchema,
  bulkTagLeadsSchema,

  // Export/Import schemas
  exportLeadsSchema,
  importLeadsSchema,

  // Bulk operations schemas
  bulkUpdateLeadsSchema,
  bulkDeleteLeadsSchema,
  bulkAssignLeadsSchema,

  // Notes & activity schemas
  addLeadNoteSchema,
  updateLeadNoteSchema,
  deleteLeadNoteSchema,
  leadActivityFilterSchema,

  // Enrichment schemas
  enrichLeadSchema,
  verifyLeadEmailSchema,

  // Scoring schemas
  updateLeadScoreSchema,
  bulkCalculateScoresSchema,

  // GDPR & privacy schemas
  gdprDataRequestSchema,
  anonymizeLeadSchema,
  unsubscribeLeadSchema,

  // Helper functions
  isValidEmailDomain,
  calculateLeadCompleteness,
  detectDuplicates,
  safeParseSubmitLead,
  safeParseCreateLead,
  safeParseUpdateLead,
  safeParseLeadFilter,
  safeParseExportLeads,
  safeParseImportLeads,
  safeParseBulkUpdateLeads,
  formatLeadErrors,
  sanitizeLeadData,

  // Types
  LeadSchemaTypes,
};
