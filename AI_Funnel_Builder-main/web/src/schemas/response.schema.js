// =============================================================================
// AI FUNNEL PLATFORM - RESPONSE VALIDATION SCHEMAS
// =============================================================================
// Comprehensive validation for user responses to funnel questions
// Using Zod for runtime validation
// =============================================================================

import { z } from 'zod';
import { TEXT_LIMITS, VALIDATION_CONFIG } from '@config/constants';
import { QUESTION_TYPE_IDS } from '@constants/question-types';

// =============================================================================
// BASE VALIDATION SCHEMAS
// =============================================================================

/**
 * Session ID Schema
 */
export const sessionIdSchema = z
  .string()
  .min(1, 'Session ID is required')
  .max(100);

/**
 * Response ID Schema
 */
export const responseIdSchema = z
  .string()
  .uuid('Invalid response ID');

/**
 * Question ID Schema
 */
export const questionIdSchema = z
  .string()
  .uuid('Invalid question ID');

/**
 * Answer Value Schema (flexible for different question types)
 */
export const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
  z.null(),
]);

// =============================================================================
// QUESTION TYPE-SPECIFIC ANSWER SCHEMAS
// =============================================================================

/**
 * Text Input Answer Schema
 */
export const textAnswerSchema = z
  .string()
  .max(TEXT_LIMITS.RESPONSE_TEXT_MAX, `Answer must be less than ${TEXT_LIMITS.RESPONSE_TEXT_MAX} characters`)
  .trim();

/**
 * Email Answer Schema
 */
export const emailAnswerSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

/**
 * Phone Answer Schema
 */
export const phoneAnswerSchema = z
  .string()
  .regex(VALIDATION_CONFIG.PHONE_PATTERN, 'Invalid phone number format')
  .trim();

/**
 * Number Answer Schema
 */
export const numberAnswerSchema = z
  .number()
  .finite('Number must be finite');

/**
 * Date Answer Schema
 */
export const dateAnswerSchema = z
  .string()
  .datetime('Invalid date format');

/**
 * URL Answer Schema
 */
export const urlAnswerSchema = z
  .string()
  .url('Invalid URL format')
  .max(500, 'URL must be less than 500 characters');

/**
 * Single Choice Answer Schema
 */
export const singleChoiceAnswerSchema = z
  .string()
  .min(1, 'Please select an option');

/**
 * Multiple Choice Answer Schema
 */
export const multipleChoiceAnswerSchema = z
  .array(z.string())
  .min(1, 'Please select at least one option')
  .max(50, 'Maximum 50 selections allowed');

/**
 * Rating Answer Schema
 */
export const ratingAnswerSchema = z
  .number()
  .int()
  .min(0)
  .max(10);

/**
 * Slider Answer Schema
 */
export const sliderAnswerSchema = z
  .number()
  .finite();

/**
 * Yes/No Answer Schema
 */
export const yesNoAnswerSchema = z
  .enum(['yes', 'no'], { errorMap: () => ({ message: 'Please select Yes or No' }) });

/**
 * Ranking Answer Schema
 */
export const rankingAnswerSchema = z
  .array(
    z.object({
      optionId: z.string(),
      rank: z.number().int().min(1),
    })
  )
  .min(1, 'Please rank at least one option');

/**
 * Matrix Answer Schema
 */
export const matrixAnswerSchema = z
  .array(
    z.object({
      rowId: z.string(),
      columnId: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]).optional(),
    })
  )
  .min(1, 'Please answer at least one row');

/**
 * File Upload Answer Schema
 */
export const fileUploadAnswerSchema = z
  .array(
    z.object({
      fileId: z.string().uuid(),
      fileName: z.string().max(255),
      fileSize: z.number().int().min(1),
      fileType: z.string().max(100),
      fileUrl: z.string().url().max(500),
      uploadedAt: z.string().datetime(),
    })
  )
  .min(1, 'Please upload at least one file')
  .max(20, 'Maximum 20 files allowed');

/**
 * Scale Answer Schema (Likert scale)
 */
export const scaleAnswerSchema = z
  .number()
  .int()
  .min(1)
  .max(7);

/**
 * NPS Answer Schema (Net Promoter Score)
 */
export const npsAnswerSchema = z
  .number()
  .int()
  .min(0, 'Score must be between 0 and 10')
  .max(10, 'Score must be between 0 and 10');

// =============================================================================
// RESPONSE METADATA SCHEMAS
// =============================================================================

/**
 * Device Info Schema
 */
export const deviceInfoSchema = z.object({
  type: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  browser: z.string().max(50).optional(),
  os: z.string().max(50).optional(),
  userAgent: z.string().max(500).optional(),
  screenWidth: z.number().int().positive().optional(),
  screenHeight: z.number().int().positive().optional(),
}).optional();

/**
 * Location Info Schema
 */
export const locationInfoSchema = z.object({
  ipAddress: z.string().ip().optional(),
  country: z.string().length(2).optional(), // ISO country code
  countryName: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timezone: z.string().max(50).optional(),
}).optional();

/**
 * Tracking Info Schema
 */
export const trackingInfoSchema = z.object({
  source: z.string().max(100).optional(),
  medium: z.string().max(100).optional(),
  campaign: z.string().max(100).optional(),
  referrer: z.string().url().max(500).optional().or(z.literal('')),
  landingPage: z.string().url().max(500).optional().or(z.literal('')),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
}).optional();

/**
 * Response Metadata Schema
 */
export const responseMetadataSchema = z.object({
  timeSpent: z.number().int().min(0).optional(), // milliseconds
  attemptCount: z.number().int().min(1).optional().default(1),
  isSkipped: z.boolean().optional().default(false),
  isEdited: z.boolean().optional().default(false),
  editCount: z.number().int().min(0).optional().default(0),
  device: deviceInfoSchema,
  location: locationInfoSchema,
  tracking: trackingInfoSchema,
  customData: z.record(z.any()).optional(),
}).optional();

// =============================================================================
// SINGLE RESPONSE SCHEMAS
// =============================================================================

/**
 * Single Response Schema (one question answer)
 */
export const singleResponseSchema = z.object({
  questionId: questionIdSchema,
  questionType: z.string().min(1),
  answer: answerValueSchema,
  metadata: responseMetadataSchema,
  answeredAt: z.string().datetime().optional(),
  
  // Validation override (for advanced use cases)
  skipValidation: z.boolean().optional().default(false),
});

/**
 * Validate Response Answer Schema (type-specific validation)
 */
export const validateResponseAnswerSchema = z.object({
  questionType: z.enum(Object.values(QUESTION_TYPE_IDS)),
  answer: answerValueSchema,
  validationRules: z.record(z.any()).optional(),
});

// =============================================================================
// RESPONSE SUBMISSION SCHEMAS
// =============================================================================

/**
 * Submit Single Response Schema
 */
export const submitSingleResponseSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  sessionId: sessionIdSchema.optional(),
  response: singleResponseSchema,
  
  // Auto-save/draft mode
  isDraft: z.boolean().optional().default(false),
  
  // Lead association
  leadId: z.string().uuid().optional(),
  createLeadIfNotExists: z.boolean().optional().default(true),
});

/**
 * Submit Multiple Responses Schema (batch)
 */
export const submitMultipleResponsesSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  sessionId: sessionIdSchema.optional(),
  responses: z.array(singleResponseSchema).min(1).max(100, 'Maximum 100 responses per submission'),
  
  // Submission metadata
  isComplete: z.boolean().optional().default(false),
  completedAt: z.string().datetime().optional(),
  
  // Lead data
  leadData: z.object({
    email: z.string().email().optional(),
    name: z.string().max(TEXT_LIMITS.NAME_MAX).optional(),
    phone: phoneAnswerSchema.optional(),
    customFields: z.record(z.any()).optional(),
  }).optional(),
  
  // Auto-save/draft mode
  isDraft: z.boolean().optional().default(false),
  
  // Device & tracking
  device: deviceInfoSchema,
  location: locationInfoSchema,
  tracking: trackingInfoSchema,
});

/**
 * Complete Funnel Submission Schema
 */
export const completeFunnelSubmissionSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  sessionId: sessionIdSchema,
  
  // Mark as complete
  isComplete: z.boolean().default(true),
  completedAt: z.string().datetime().optional(),
  
  // Optional: any remaining responses
  finalResponses: z.array(singleResponseSchema).optional(),
  
  // Lead finalization
  leadData: z.object({
    email: z.string().email().optional(),
    name: z.string().max(TEXT_LIMITS.NAME_MAX).optional(),
    phone: phoneAnswerSchema.optional(),
    consentMarketing: z.boolean().optional().default(false),
    consentData: z.boolean().optional().default(true),
  }).optional(),
});

/**
 * Resume Session Schema
 */
export const resumeSessionSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  sessionId: sessionIdSchema,
  email: z.string().email().optional(), // For verification
  token: z.string().optional(), // Resume token
});

// =============================================================================
// RESPONSE UPDATE & DELETE SCHEMAS
// =============================================================================

/**
 * Update Response Schema
 */
export const updateResponseSchema = z.object({
  responseId: responseIdSchema,
  answer: answerValueSchema,
  metadata: responseMetadataSchema,
  
  // Track edit
  markAsEdited: z.boolean().optional().default(true),
});

/**
 * Delete Response Schema
 */
export const deleteResponseSchema = z.object({
  responseId: responseIdSchema,
  sessionId: sessionIdSchema,
  reason: z.enum(['user_request', 'invalid_data', 'duplicate', 'gdpr', 'other']).optional(),
});

/**
 * Bulk Delete Responses Schema
 */
export const bulkDeleteResponsesSchema = z.object({
  responseIds: z.array(responseIdSchema).min(1).max(100),
  sessionId: sessionIdSchema.optional(),
  reason: z.enum(['user_request', 'invalid_data', 'duplicate', 'gdpr', 'bulk_cleanup', 'other']).optional(),
});

// =============================================================================
// RESPONSE QUERY SCHEMAS
// =============================================================================

/**
 * Response Filter Schema
 */
export const responseFilterSchema = z.object({
  // Basic filters
  funnelId: z.string().uuid().optional(),
  sessionId: sessionIdSchema.optional(),
  leadId: z.string().uuid().optional(),
  questionId: questionIdSchema.optional(),
  
  // Answer filters
  hasAnswer: z.boolean().optional(),
  isSkipped: z.boolean().optional(),
  isEdited: z.boolean().optional(),
  
  // Date filters
  answeredAfter: z.string().datetime().optional(),
  answeredBefore: z.string().datetime().optional(),
  
  // Completion filters
  isComplete: z.boolean().optional(),
  isDraft: z.boolean().optional(),
  
  // Device filters
  deviceType: z.array(z.enum(['desktop', 'mobile', 'tablet'])).optional(),
  
  // Location filters
  country: z.array(z.string().length(2)).optional(),
  city: z.array(z.string().max(100)).optional(),
  
  // Pagination
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  
  // Sorting
  sortBy: z.enum(['answered_at', 'created_at', 'updated_at']).optional().default('answered_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Get Session Responses Schema
 */
export const getSessionResponsesSchema = z.object({
  sessionId: sessionIdSchema,
  includeMetadata: z.boolean().optional().default(true),
  includeSkipped: z.boolean().optional().default(false),
});

/**
 * Get Question Responses Schema (all responses for a question)
 */
export const getQuestionResponsesSchema = z.object({
  questionId: questionIdSchema,
  funnelId: z.string().uuid().optional(),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).optional(),
  includeMetadata: z.boolean().optional().default(false),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(1000).optional().default(100),
});

// =============================================================================
// RESPONSE ANALYTICS SCHEMAS
// =============================================================================

/**
 * Response Analytics Query Schema
 */
export const responseAnalyticsSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID').optional(),
  questionId: questionIdSchema.optional(),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).optional(),
  
  // Metrics
  metrics: z.array(
    z.enum([
      'total_responses',
      'unique_sessions',
      'completion_rate',
      'skip_rate',
      'avg_time_to_answer',
      'answer_distribution',
    ])
  ).optional(),
  
  // Group by
  groupBy: z.array(
    z.enum(['date', 'device', 'country', 'source', 'question'])
  ).optional(),
});

// =============================================================================
// RESPONSE EXPORT SCHEMAS
// =============================================================================

/**
 * Export Responses Schema
 */
export const exportResponsesSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
  filters: responseFilterSchema.optional(),
  
  // Field selection
  includeMetadata: z.boolean().optional().default(true),
  includeLeadInfo: z.boolean().optional().default(true),
  includeDeviceInfo: z.boolean().optional().default(false),
  includeLocationInfo: z.boolean().optional().default(false),
  includeTrackingInfo: z.boolean().optional().default(false),
  
  // Options
  flattenResponses: z.boolean().optional().default(true),
  includeQuestionText: z.boolean().optional().default(true),
  maxRows: z.number().int().min(1).max(100000).optional(),
  
  // Email delivery
  emailTo: z.array(z.string().email()).max(10).optional(),
});

// =============================================================================
// RESPONSE VALIDATION SCHEMAS
// =============================================================================

/**
 * Validate Response Integrity Schema
 */
export const validateResponseIntegritySchema = z.object({
  sessionId: sessionIdSchema,
  funnelId: z.string().uuid('Invalid funnel ID'),
  checkComplete: z.boolean().optional().default(true),
  checkRequired: z.boolean().optional().default(true),
  checkDuplicates: z.boolean().optional().default(true),
});

/**
 * Check Spam Response Schema
 */
export const checkSpamResponseSchema = z.object({
  sessionId: sessionIdSchema,
  responses: z.array(singleResponseSchema),
  
  // Spam detection settings
  checkHoneypot: z.boolean().optional().default(true),
  checkSpeed: z.boolean().optional().default(true),
  checkPatterns: z.boolean().optional().default(true),
  minTimeThreshold: z.number().int().min(1000).optional().default(3000), // milliseconds
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate answer based on question type
 */
export const validateAnswerByType = (questionType, answer, validationRules = {}) => {
  try {
    switch (questionType) {
      case QUESTION_TYPE_IDS.EMAIL:
        return emailAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.PHONE:
        return phoneAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.NUMBER:
        return numberAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.DATE:
        return dateAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.URL:
        return urlAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.SINGLE_CHOICE:
      case QUESTION_TYPE_IDS.DROPDOWN:
        return singleChoiceAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.MULTIPLE_CHOICE:
        return multipleChoiceAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.RATING:
        return ratingAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.SLIDER:
        return sliderAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.YES_NO:
        return yesNoAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.RANKING:
        return rankingAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.MATRIX:
        return matrixAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.FILE_UPLOAD:
        return fileUploadAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.NPS:
        return npsAnswerSchema.parse(answer);
      
      case QUESTION_TYPE_IDS.SCALE:
        return scaleAnswerSchema.parse(answer);
      
      default:
        return textAnswerSchema.parse(answer);
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Check if response is spam
 */
export const isSpamResponse = (responses, metadata = {}) => {
  const spamIndicators = [];
  
  // Check for extremely fast completion
  if (metadata.totalTimeSpent && metadata.totalTimeSpent < 3000) {
    spamIndicators.push('Too fast completion');
  }
  
  // Check for repetitive answers
  const answers = responses.map((r) => JSON.stringify(r.answer));
  if (answers.length > 3 && new Set(answers).size === 1) {
    spamIndicators.push('Repetitive answers');
  }
  
  // Check for gibberish text (simple heuristic)
  const textResponses = responses.filter((r) => typeof r.answer === 'string');
  const hasGibberish = textResponses.some((r) => {
    const words = r.answer.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    return avgWordLength > 15 || avgWordLength < 2;
  });
  if (hasGibberish) {
    spamIndicators.push('Gibberish detected');
  }
  
  return {
    isSpam: spamIndicators.length >= 2,
    indicators: spamIndicators,
    confidence: Math.min(spamIndicators.length * 0.33, 1),
  };
};

/**
 * Calculate response completeness
 */
export const calculateResponseCompleteness = (responses, totalQuestions, requiredQuestions = []) => {
  const answeredCount = responses.filter((r) => r.answer !== null && r.answer !== '').length;
  const requiredAnswered = requiredQuestions.every((qId) =>
    responses.some((r) => r.questionId === qId && r.answer !== null)
  );
  
  return {
    completionPercentage: Math.round((answeredCount / totalQuestions) * 100),
    answeredCount,
    totalQuestions,
    requiredAnswered,
    isComplete: answeredCount === totalQuestions && requiredAnswered,
  };
};

/**
 * Generate session ID
 */
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Parse answer display value
 */
export const parseAnswerDisplay = (answer, questionType) => {
  if (answer === null || answer === undefined) return 'No answer';
  
  if (Array.isArray(answer)) {
    if (answer.length === 0) return 'No selection';
    return answer.join(', ');
  }
  
  if (typeof answer === 'boolean') {
    return answer ? 'Yes' : 'No';
  }
  
  if (questionType === QUESTION_TYPE_IDS.DATE) {
    return new Date(answer).toLocaleDateString();
  }
  
  return String(answer);
};

/**
 * Safe parse helpers
 */
export const safeParseSubmitSingleResponse = (data) => {
  return submitSingleResponseSchema.safeParse(data);
};

export const safeParseSubmitMultipleResponses = (data) => {
  return submitMultipleResponsesSchema.safeParse(data);
};

export const safeParseCompleteFunnelSubmission = (data) => {
  return completeFunnelSubmissionSchema.safeParse(data);
};

export const safeParseResponseFilter = (data) => {
  return responseFilterSchema.safeParse(data);
};

export const safeParseExportResponses = (data) => {
  return exportResponsesSchema.safeParse(data);
};

/**
 * Format Zod errors for display
 */
export const formatResponseErrors = (zodError) => {
  const errors = {};
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  return errors;
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export const ResponseSchemaTypes = {
  SingleResponse: singleResponseSchema,
  SubmitSingleResponse: submitSingleResponseSchema,
  SubmitMultipleResponses: submitMultipleResponsesSchema,
  CompleteFunnelSubmission: completeFunnelSubmissionSchema,
  ResponseFilter: responseFilterSchema,
  ExportResponses: exportResponsesSchema,
  ResponseMetadata: responseMetadataSchema,
};

/**
 * Default Export
 */
export default {
  // Base schemas
  sessionIdSchema,
  responseIdSchema,
  questionIdSchema,
  answerValueSchema,

  // Type-specific answer schemas
  textAnswerSchema,
  emailAnswerSchema,
  phoneAnswerSchema,
  numberAnswerSchema,
  dateAnswerSchema,
  urlAnswerSchema,
  singleChoiceAnswerSchema,
  multipleChoiceAnswerSchema,
  ratingAnswerSchema,
  sliderAnswerSchema,
  yesNoAnswerSchema,
  rankingAnswerSchema,
  matrixAnswerSchema,
  fileUploadAnswerSchema,
  scaleAnswerSchema,
  npsAnswerSchema,

  // Metadata schemas
  deviceInfoSchema,
  locationInfoSchema,
  trackingInfoSchema,
  responseMetadataSchema,

  // Response schemas
  singleResponseSchema,
  validateResponseAnswerSchema,

  // Submission schemas
  submitSingleResponseSchema,
  submitMultipleResponsesSchema,
  completeFunnelSubmissionSchema,
  resumeSessionSchema,

  // Update & delete schemas
  updateResponseSchema,
  deleteResponseSchema,
  bulkDeleteResponsesSchema,

  // Query schemas
  responseFilterSchema,
  getSessionResponsesSchema,
  getQuestionResponsesSchema,

  // Analytics schemas
  responseAnalyticsSchema,

  // Export schemas
  exportResponsesSchema,

  // Validation schemas
  validateResponseIntegritySchema,
  checkSpamResponseSchema,

  // Helper functions
  validateAnswerByType,
  isSpamResponse,
  calculateResponseCompleteness,
  generateSessionId,
  parseAnswerDisplay,
  safeParseSubmitSingleResponse,
  safeParseSubmitMultipleResponses,
  safeParseCompleteFunnelSubmission,
  safeParseResponseFilter,
  safeParseExportResponses,
  formatResponseErrors,

  // Types
  ResponseSchemaTypes,
};
