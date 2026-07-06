// =============================================================================
// AI FUNNEL PLATFORM - QUESTION VALIDATION SCHEMAS
// =============================================================================
// Comprehensive validation for funnel questions, options, and configurations
// Using Zod for runtime validation
// =============================================================================

import { z } from 'zod';
import { TEXT_LIMITS, VALIDATION_CONFIG } from '@config/constants';
import { QUESTION_TYPE_IDS } from '@constants/question-types';

// =============================================================================
// BASE VALIDATION SCHEMAS
// =============================================================================

/**
 * Question Text Schema
 */
export const questionTextSchema = z
  .string()
  .min(TEXT_LIMITS.QUESTION_TEXT_MIN, `Question must be at least ${TEXT_LIMITS.QUESTION_TEXT_MIN} characters`)
  .max(TEXT_LIMITS.QUESTION_TEXT_MAX, `Question must be less than ${TEXT_LIMITS.QUESTION_TEXT_MAX} characters`)
  .trim()
  .refine(
    (text) => !/^\s*$/.test(text),
    { message: 'Question cannot be only whitespace' }
  );

/**
 * Question Description Schema
 */
export const questionDescriptionSchema = z
  .string()
  .max(TEXT_LIMITS.QUESTION_DESCRIPTION_MAX, `Description must be less than ${TEXT_LIMITS.QUESTION_DESCRIPTION_MAX} characters`)
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Question Placeholder Schema
 */
export const questionPlaceholderSchema = z
  .string()
  .max(TEXT_LIMITS.QUESTION_PLACEHOLDER_MAX, `Placeholder must be less than ${TEXT_LIMITS.QUESTION_PLACEHOLDER_MAX} characters`)
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Question Type Schema
 */
export const questionTypeSchema = z.enum(
  Object.values(QUESTION_TYPE_IDS),
  { errorMap: () => ({ message: 'Invalid question type' }) }
);

/**
 * Question Order Schema
 */
export const questionOrderSchema = z
  .number()
  .int('Order must be an integer')
  .min(0, 'Order cannot be negative');

/**
 * Question Option Text Schema
 */
export const optionTextSchema = z
  .string()
  .min(1, 'Option text is required')
  .max(TEXT_LIMITS.QUESTION_OPTION_TEXT_MAX, `Option text must be less than ${TEXT_LIMITS.QUESTION_OPTION_TEXT_MAX} characters`)
  .trim();

/**
 * Question Option Schema
 */
export const questionOptionSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new options
  text: optionTextSchema,
  value: z.string().max(100).optional(), // Custom value for backend
  order: z.number().int().min(0).optional(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  score: z.number().int().optional(), // For scoring/quiz funnels
  isCorrect: z.boolean().optional(), // For quiz funnels
  redirectTo: z.string().uuid().optional(), // Redirect to specific question
  metadata: z.record(z.any()).optional(),
});

/**
 * Question Options Array Schema
 */
export const questionOptionsSchema = z
  .array(questionOptionSchema)
  .min(TEXT_LIMITS.QUESTION_OPTIONS_MIN, `At least ${TEXT_LIMITS.QUESTION_OPTIONS_MIN} options required`)
  .max(TEXT_LIMITS.QUESTION_OPTIONS_MAX, `Maximum ${TEXT_LIMITS.QUESTION_OPTIONS_MAX} options allowed`)
  .refine(
    (options) => {
      const texts = options.map((opt) => opt.text.toLowerCase().trim());
      return texts.length === new Set(texts).size;
    },
    { message: 'Options must have unique text values' }
  );

// =============================================================================
// VALIDATION RULES SCHEMAS
// =============================================================================

/**
 * Text Validation Schema
 */
export const textValidationSchema = z.object({
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  pattern: z.string().optional(), // Regex pattern
  errorMessage: z.string().max(200).optional(),
}).refine(
  (data) => {
    if (data.minLength !== undefined && data.maxLength !== undefined) {
      return data.minLength <= data.maxLength;
    }
    return true;
  },
  { message: 'Min length must be less than or equal to max length' }
);

/**
 * Number Validation Schema
 */
export const numberValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
  allowDecimals: z.boolean().optional().default(false),
  allowNegative: z.boolean().optional().default(false),
  errorMessage: z.string().max(200).optional(),
}).refine(
  (data) => {
    if (data.min !== undefined && data.max !== undefined) {
      return data.min <= data.max;
    }
    return true;
  },
  { message: 'Min value must be less than or equal to max value' }
);

/**
 * Email Validation Schema
 */
export const emailValidationSchema = z.object({
  blockDisposable: z.boolean().optional().default(false),
  requireVerification: z.boolean().optional().default(false),
  errorMessage: z.string().max(200).optional(),
});

/**
 * Phone Validation Schema
 */
export const phoneValidationSchema = z.object({
  requireCountryCode: z.boolean().optional().default(false),
  allowedCountries: z.array(z.string().length(2)).optional(), // ISO country codes
  format: z.enum(['international', 'national', 'any']).optional().default('any'),
  errorMessage: z.string().max(200).optional(),
});

/**
 * File Upload Validation Schema
 */
export const fileValidationSchema = z.object({
  maxSize: z.number().int().min(1).max(100 * 1024 * 1024).optional(), // Up to 100MB
  maxFiles: z.number().int().min(1).max(20).optional().default(1),
  allowedTypes: z.array(z.string()).optional(), // MIME types
  allowedExtensions: z.array(z.string()).optional(),
  requirePreview: z.boolean().optional().default(true),
  errorMessage: z.string().max(200).optional(),
});

/**
 * Date Validation Schema
 */
export const dateValidationSchema = z.object({
  minDate: z.string().datetime().optional(),
  maxDate: z.string().datetime().optional(),
  allowPast: z.boolean().optional().default(true),
  allowFuture: z.boolean().optional().default(true),
  disabledDays: z.array(z.number().int().min(0).max(6)).optional(), // 0 = Sunday
  errorMessage: z.string().max(200).optional(),
});

/**
 * Rating Validation Schema
 */
export const ratingValidationSchema = z.object({
  min: z.number().int().min(1).optional().default(1),
  max: z.number().int().min(1).max(10).optional().default(5),
  step: z.number().positive().optional().default(1),
  allowHalf: z.boolean().optional().default(false),
  icon: z.enum(['star', 'heart', 'thumbs', 'emoji']).optional().default('star'),
  labels: z.array(z.string().max(50)).optional(),
  errorMessage: z.string().max(200).optional(),
});

/**
 * Slider Validation Schema
 */
export const sliderValidationSchema = z.object({
  min: z.number().optional().default(0),
  max: z.number().optional().default(100),
  step: z.number().positive().optional().default(1),
  showValue: z.boolean().optional().default(true),
  showLabels: z.boolean().optional().default(true),
  minLabel: z.string().max(50).optional(),
  maxLabel: z.string().max(50).optional(),
  errorMessage: z.string().max(200).optional(),
});

/**
 * Multiple Choice Validation Schema
 */
export const multipleChoiceValidationSchema = z.object({
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  errorMessage: z.string().max(200).optional(),
}).refine(
  (data) => {
    if (data.minSelections !== undefined && data.maxSelections !== undefined) {
      return data.minSelections <= data.maxSelections;
    }
    return true;
  },
  { message: 'Min selections must be less than or equal to max selections' }
);

/**
 * Combined Validation Rules Schema
 */
export const validationRulesSchema = z.object({
  required: z.boolean().optional().default(false),
  text: textValidationSchema.optional(),
  number: numberValidationSchema.optional(),
  email: emailValidationSchema.optional(),
  phone: phoneValidationSchema.optional(),
  file: fileValidationSchema.optional(),
  date: dateValidationSchema.optional(),
  rating: ratingValidationSchema.optional(),
  slider: sliderValidationSchema.optional(),
  multipleChoice: multipleChoiceValidationSchema.optional(),
  customValidation: z.string().optional(), // Custom validation function name
});

// =============================================================================
// QUESTION SETTINGS SCHEMAS
// =============================================================================

/**
 * Display Settings Schema
 */
export const displaySettingsSchema = z.object({
  displayAs: z.enum(['list', 'grid', 'buttons', 'dropdown', 'cards']).optional().default('list'),
  columns: z.number().int().min(1).max(6).optional().default(1),
  showIcons: z.boolean().optional().default(false),
  showImages: z.boolean().optional().default(false),
  randomizeOptions: z.boolean().optional().default(false),
  showOtherOption: z.boolean().optional().default(false),
  otherOptionLabel: z.string().max(50).optional().default('Other'),
  showNoneOption: z.boolean().optional().default(false),
  noneOptionLabel: z.string().max(50).optional().default('None of the above'),
});

/**
 * Logic Settings Schema
 */
export const logicSettingsSchema = z.object({
  allowSkip: z.boolean().optional().default(false),
  skipButtonText: z.string().max(50).optional().default('Skip'),
  enableConditionalLogic: z.boolean().optional().default(false),
  hideIfConditionsMet: z.boolean().optional().default(false),
  showIfConditionsMet: z.boolean().optional().default(false),
  jumpToQuestion: z.string().uuid().optional(), // Skip to specific question
});

/**
 * Styling Settings Schema
 */
export const stylingSettingsSchema = z.object({
  textAlign: z.enum(['left', 'center', 'right']).optional().default('left'),
  fontSize: z.enum(['sm', 'md', 'lg', 'xl']).optional().default('md'),
  fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional().default('normal'),
  backgroundColor: z.string().regex(VALIDATION_CONFIG.HEX_COLOR_PATTERN).optional(),
  textColor: z.string().regex(VALIDATION_CONFIG.HEX_COLOR_PATTERN).optional(),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).optional().default('md'),
  customCss: z.string().max(2000).optional(),
});

/**
 * Advanced Settings Schema
 */
export const advancedSettingsSchema = z.object({
  trackingId: z.string().max(50).optional(), // For analytics
  dataAttribute: z.string().max(50).optional(), // Custom data attribute
  autoAdvance: z.boolean().optional().default(false), // Auto-advance to next question
  autoAdvanceDelay: z.number().int().min(0).max(10000).optional(), // Milliseconds
  showTimer: z.boolean().optional().default(false),
  timerDuration: z.number().int().min(1).max(3600).optional(), // Seconds
  timerType: z.enum(['countdown', 'stopwatch']).optional().default('countdown'),
  enableAutocomplete: z.boolean().optional().default(false),
  autocompleteSource: z.string().max(200).optional(), // API endpoint
  prefillFromLead: z.boolean().optional().default(false),
  prefillField: z.string().max(50).optional(), // Lead field to prefill from
  saveProgress: z.boolean().optional().default(false),
});

/**
 * Combined Question Settings Schema
 */
export const questionSettingsSchema = z.object({
  display: displaySettingsSchema.optional(),
  logic: logicSettingsSchema.optional(),
  styling: stylingSettingsSchema.optional(),
  advanced: advancedSettingsSchema.optional(),
});

// =============================================================================
// QUESTION CONDITIONAL LOGIC SCHEMAS
// =============================================================================

/**
 * Question Condition Schema
 */
export const questionConditionSchema = z.object({
  id: z.string().uuid().optional(),
  sourceQuestionId: z.string().uuid('Invalid question ID'),
  operator: z.enum([
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'starts_with',
    'ends_with',
    'greater_than',
    'less_than',
    'greater_or_equal',
    'less_or_equal',
    'is_empty',
    'is_not_empty',
    'matches_pattern',
  ]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  valueType: z.enum(['string', 'number', 'boolean', 'array']).optional().default('string'),
});

/**
 * Question Condition Group Schema
 */
export const questionConditionGroupSchema = z.object({
  id: z.string().uuid().optional(),
  logic: z.enum(['AND', 'OR']).default('AND'),
  conditions: z.array(questionConditionSchema).min(1, 'At least one condition is required'),
});

/**
 * Question Action Schema
 */
export const questionActionSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum([
    'show',
    'hide',
    'enable',
    'disable',
    'skip_to',
    'show_result',
    'redirect',
    'set_value',
    'trigger_webhook',
  ]),
  targetQuestionId: z.string().uuid().optional(),
  value: z.any().optional(),
  url: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
});

/**
 * Question Conditional Logic Rule Schema
 */
export const questionConditionalLogicSchema = z.object({
  id: z.string().uuid().optional(),
  enabled: z.boolean().optional().default(true),
  name: z.string().min(1).max(100).optional(),
  conditionGroups: z.array(questionConditionGroupSchema).min(1, 'At least one condition group is required'),
  actions: z.array(questionActionSchema).min(1, 'At least one action is required'),
  priority: z.number().int().min(0).optional().default(0),
});

// =============================================================================
// QUESTION CRUD SCHEMAS
// =============================================================================

/**
 * Create Question Schema
 */
export const createQuestionSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  type: questionTypeSchema,
  text: questionTextSchema,
  description: questionDescriptionSchema,
  placeholder: questionPlaceholderSchema,
  order: questionOrderSchema.optional(),
  options: questionOptionsSchema.optional(),
  validation: validationRulesSchema.optional(),
  settings: questionSettingsSchema.optional(),
  conditionalLogic: z.array(questionConditionalLogicSchema).optional(),
  metadata: z.record(z.any()).optional(),
}).refine(
  (data) => {
    // Questions that require options
    const typesRequiringOptions = [
      QUESTION_TYPE_IDS.MULTIPLE_CHOICE,
      QUESTION_TYPE_IDS.SINGLE_CHOICE,
      QUESTION_TYPE_IDS.DROPDOWN,
      QUESTION_TYPE_IDS.RANKING,
    ];
    
    if (typesRequiringOptions.includes(data.type)) {
      return data.options && data.options.length >= TEXT_LIMITS.QUESTION_OPTIONS_MIN;
    }
    return true;
  },
  {
    message: 'This question type requires options',
    path: ['options'],
  }
);

/**
 * Update Question Schema
 */
export const updateQuestionSchema = z.object({
  type: questionTypeSchema.optional(),
  text: questionTextSchema.optional(),
  description: questionDescriptionSchema,
  placeholder: questionPlaceholderSchema,
  order: questionOrderSchema.optional(),
  options: questionOptionsSchema.optional(),
  validation: validationRulesSchema.optional(),
  settings: questionSettingsSchema.optional(),
  conditionalLogic: z.array(questionConditionalLogicSchema).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Reorder Questions Schema
 */
export const reorderQuestionsSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  questionOrders: z.array(
    z.object({
      questionId: z.string().uuid('Invalid question ID'),
      order: questionOrderSchema,
    })
  ).min(1, 'At least one question is required'),
});

/**
 * Delete Question Schema
 */
export const deleteQuestionSchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
  deleteConditionalLogic: z.boolean().optional().default(true),
});

/**
 * Clone Question Schema
 */
export const cloneQuestionSchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
  targetFunnelId: z.string().uuid('Invalid funnel ID').optional(),
  includeOptions: z.boolean().optional().default(true),
  includeSettings: z.boolean().optional().default(true),
  includeValidation: z.boolean().optional().default(true),
  includeConditionalLogic: z.boolean().optional().default(false),
});

// =============================================================================
// BULK OPERATIONS SCHEMAS
// =============================================================================

/**
 * Bulk Create Questions Schema
 */
export const bulkCreateQuestionsSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  questions: z.array(
    createQuestionSchema.omit({ funnelId: true })
  ).min(1).max(50, 'Maximum 50 questions can be created at once'),
});

/**
 * Bulk Update Questions Schema
 */
export const bulkUpdateQuestionsSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  updates: z.array(
    z.object({
      questionId: z.string().uuid('Invalid question ID'),
      data: updateQuestionSchema,
    })
  ).min(1).max(50, 'Maximum 50 questions can be updated at once'),
});

/**
 * Bulk Delete Questions Schema
 */
export const bulkDeleteQuestionsSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  questionIds: z.array(z.string().uuid('Invalid question ID')).min(1).max(50),
  deleteConditionalLogic: z.boolean().optional().default(true),
});

// =============================================================================
// AI GENERATION SCHEMAS
// =============================================================================

/**
 * AI Generate Questions Schema
 */
export const aiGenerateQuestionsSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  goal: z.string().min(1).max(500),
  focusAreas: z.array(z.string()).min(1).max(5),
  targetAudience: z.string().max(500).optional(),
  productService: z.string().max(500).optional(),
  questionCount: z.number().int().min(3).max(20).optional().default(5),
  includeContactFields: z.boolean().optional().default(true),
  questionTypes: z.array(questionTypeSchema).optional(),
  tone: z.enum(['professional', 'friendly', 'casual', 'formal']).optional().default('professional'),
  language: z.string().length(2).optional().default('en'), // ISO language code
});

/**
 * AI Optimize Question Schema
 */
export const aiOptimizeQuestionSchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
  optimizationGoal: z.enum(['clarity', 'conversion', 'engagement', 'brevity']).default('clarity'),
  targetAudience: z.string().max(500).optional(),
  context: z.string().max(1000).optional(),
});

// =============================================================================
// QUESTION IMPORT/EXPORT SCHEMAS
// =============================================================================

/**
 * Export Questions Schema
 */
export const exportQuestionsSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  questionIds: z.array(z.string().uuid()).optional(), // If not provided, export all
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
  includeOptions: z.boolean().optional().default(true),
  includeSettings: z.boolean().optional().default(true),
  includeValidation: z.boolean().optional().default(true),
  includeConditionalLogic: z.boolean().optional().default(true),
});

/**
 * Import Questions Schema
 */
export const importQuestionsSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  data: z.string().min(1, 'Import data is required'), // JSON string
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
  overwrite: z.boolean().optional().default(false),
  startOrder: z.number().int().min(0).optional().default(0),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate question type supports options
 */
export const requiresOptions = (questionType) => {
  const typesWithOptions = [
    QUESTION_TYPE_IDS.MULTIPLE_CHOICE,
    QUESTION_TYPE_IDS.SINGLE_CHOICE,
    QUESTION_TYPE_IDS.DROPDOWN,
    QUESTION_TYPE_IDS.RANKING,
    QUESTION_TYPE_IDS.MATRIX,
    QUESTION_TYPE_IDS.YES_NO,
  ];
  return typesWithOptions.includes(questionType);
};

/**
 * Get default validation for question type
 */
export const getDefaultValidation = (questionType) => {
  const defaults = {
    [QUESTION_TYPE_IDS.EMAIL]: {
      required: true,
      email: { blockDisposable: false },
    },
    [QUESTION_TYPE_IDS.PHONE]: {
      required: false,
      phone: { requireCountryCode: false },
    },
    [QUESTION_TYPE_IDS.NUMBER]: {
      required: false,
      number: { allowDecimals: false, allowNegative: false },
    },
    [QUESTION_TYPE_IDS.RATING]: {
      required: false,
      rating: { min: 1, max: 5, step: 1 },
    },
    [QUESTION_TYPE_IDS.SLIDER]: {
      required: false,
      slider: { min: 0, max: 100, step: 1 },
    },
  };
  
  return defaults[questionType] || { required: false };
};

/**
 * Get default options for yes/no questions
 */
export const getDefaultYesNoOptions = () => {
  return [
    { text: 'Yes', value: 'yes', order: 0 },
    { text: 'No', value: 'no', order: 1 },
  ];
};

/**
 * Validate conditional logic references
 */
export const validateConditionalLogicReferences = (logic, availableQuestions) => {
  const questionIds = new Set(availableQuestions.map((q) => q.id));
  const errors = [];
  
  for (const rule of logic) {
    for (const group of rule.conditionGroups) {
      for (const condition of group.conditions) {
        if (!questionIds.has(condition.sourceQuestionId)) {
          errors.push(`Question ${condition.sourceQuestionId} not found`);
        }
      }
    }
    
    for (const action of rule.actions) {
      if (action.targetQuestionId && !questionIds.has(action.targetQuestionId)) {
        errors.push(`Target question ${action.targetQuestionId} not found`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Safe parse helpers
 */
export const safeParseCreateQuestion = (data) => {
  return createQuestionSchema.safeParse(data);
};

export const safeParseUpdateQuestion = (data) => {
  return updateQuestionSchema.safeParse(data);
};

export const safeParseReorderQuestions = (data) => {
  return reorderQuestionsSchema.safeParse(data);
};

export const safeParseBulkCreateQuestions = (data) => {
  return bulkCreateQuestionsSchema.safeParse(data);
};

export const safeParseAIGenerateQuestions = (data) => {
  return aiGenerateQuestionsSchema.safeParse(data);
};

/**
 * Format Zod errors for display
 */
export const formatQuestionErrors = (zodError) => {
  const errors = {};
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  return errors;
};

/**
 * Sanitize question text (remove potential XSS)
 */
export const sanitizeQuestionText = (text) => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export const QuestionSchemaTypes = {
  Text: questionTextSchema,
  Type: questionTypeSchema,
  Option: questionOptionSchema,
  Options: questionOptionsSchema,
  ValidationRules: validationRulesSchema,
  Settings: questionSettingsSchema,
  ConditionalLogic: questionConditionalLogicSchema,
  CreateQuestion: createQuestionSchema,
  UpdateQuestion: updateQuestionSchema,
  ReorderQuestions: reorderQuestionsSchema,
  BulkCreateQuestions: bulkCreateQuestionsSchema,
  AIGenerateQuestions: aiGenerateQuestionsSchema,
};

/**
 * Default Export
 */
export default {
  // Base schemas
  questionTextSchema,
  questionDescriptionSchema,
  questionPlaceholderSchema,
  questionTypeSchema,
  questionOrderSchema,
  optionTextSchema,
  questionOptionSchema,
  questionOptionsSchema,

  // Validation schemas
  textValidationSchema,
  numberValidationSchema,
  emailValidationSchema,
  phoneValidationSchema,
  fileValidationSchema,
  dateValidationSchema,
  ratingValidationSchema,
  sliderValidationSchema,
  multipleChoiceValidationSchema,
  validationRulesSchema,

  // Settings schemas
  displaySettingsSchema,
  logicSettingsSchema,
  stylingSettingsSchema,
  advancedSettingsSchema,
  questionSettingsSchema,

  // Conditional logic schemas
  questionConditionSchema,
  questionConditionGroupSchema,
  questionActionSchema,
  questionConditionalLogicSchema,

  // CRUD schemas
  createQuestionSchema,
  updateQuestionSchema,
  reorderQuestionsSchema,
  deleteQuestionSchema,
  cloneQuestionSchema,

  // Bulk operations schemas
  bulkCreateQuestionsSchema,
  bulkUpdateQuestionsSchema,
  bulkDeleteQuestionsSchema,

  // AI generation schemas
  aiGenerateQuestionsSchema,
  aiOptimizeQuestionSchema,

  // Import/Export schemas
  exportQuestionsSchema,
  importQuestionsSchema,

  // Helper functions
  requiresOptions,
  getDefaultValidation,
  getDefaultYesNoOptions,
  validateConditionalLogicReferences,
  safeParseCreateQuestion,
  safeParseUpdateQuestion,
  safeParseReorderQuestions,
  safeParseBulkCreateQuestions,
  safeParseAIGenerateQuestions,
  formatQuestionErrors,
  sanitizeQuestionText,

  // Types
  QuestionSchemaTypes,
};
