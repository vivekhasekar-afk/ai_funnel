// =============================================================================
// AI FUNNEL PLATFORM - RESULT PAGE VALIDATION SCHEMAS
// =============================================================================
// Comprehensive validation for result pages and content blocks
// Using Zod for runtime validation
// =============================================================================

import { z } from 'zod';
import { TEXT_LIMITS, VALIDATION_CONFIG } from '@config/constants';

// =============================================================================
// BASE VALIDATION SCHEMAS
// =============================================================================

/**
 * Result Page Name Schema
 */
export const resultPageNameSchema = z
  .string()
  .min(1, 'Result page name is required')
  .max(TEXT_LIMITS.RESULT_PAGE_NAME_MAX, `Name must be less than ${TEXT_LIMITS.RESULT_PAGE_NAME_MAX} characters`)
  .trim();

/**
 * Headline Schema
 */
export const headlineSchema = z
  .string()
  .min(1, 'Headline is required')
  .max(TEXT_LIMITS.HEADLINE_MAX, `Headline must be less than ${TEXT_LIMITS.HEADLINE_MAX} characters`)
  .trim();

/**
 * Subheadline Schema
 */
export const subheadlineSchema = z
  .string()
  .max(TEXT_LIMITS.SUBHEADLINE_MAX, `Subheadline must be less than ${TEXT_LIMITS.SUBHEADLINE_MAX} characters`)
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Body Text Schema
 */
export const bodyTextSchema = z
  .string()
  .max(TEXT_LIMITS.BODY_TEXT_MAX, `Body text must be less than ${TEXT_LIMITS.BODY_TEXT_MAX} characters`)
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * CTA Text Schema
 */
export const ctaTextSchema = z
  .string()
  .min(1, 'CTA text is required')
  .max(TEXT_LIMITS.CTA_TEXT_MAX, `CTA text must be less than ${TEXT_LIMITS.CTA_TEXT_MAX} characters`)
  .trim();

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
 * Color Schema
 */
export const colorSchema = z
  .string()
  .regex(VALIDATION_CONFIG.HEX_COLOR_PATTERN, 'Invalid color format. Use hex format (e.g., #FF5733)')
  .optional();

/**
 * Alignment Schema
 */
export const alignmentSchema = z.enum(['left', 'center', 'right', 'justify']);

/**
 * Block Type Schema
 */
export const blockTypeSchema = z.enum([
  'headline',
  'text',
  'image',
  'video',
  'cta_button',
  'benefits_list',
  'features_grid',
  'testimonial',
  'stats',
  'social_proof',
  'countdown',
  'form',
  'divider',
  'spacer',
  'embed',
  'custom_html',
  'download',
  'calendar',
  'social_share',
]);

// =============================================================================
// CONTENT BLOCK DATA SCHEMAS
// =============================================================================

/**
 * Headline Block Data Schema
 */
export const headlineBlockDataSchema = z.object({
  text: headlineSchema,
  level: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).default('h1'),
  alignment: alignmentSchema.optional().default('center'),
  color: colorSchema,
  fontSize: z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']).optional().default('2xl'),
  fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional().default('bold'),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Text Block Data Schema
 */
export const textBlockDataSchema = z.object({
  content: bodyTextSchema,
  alignment: alignmentSchema.optional().default('left'),
  color: colorSchema,
  fontSize: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional().default('md'),
  lineHeight: z.enum(['tight', 'normal', 'relaxed', 'loose']).optional().default('normal'),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Image Block Data Schema
 */
export const imageBlockDataSchema = z.object({
  src: z.string().url('Invalid image URL').max(500),
  alt: z.string().max(200),
  width: z.number().int().min(50).max(2000).optional(),
  height: z.number().int().min(50).max(2000).optional(),
  alignment: alignmentSchema.optional().default('center'),
  caption: z.string().max(500).optional(),
  link: urlSchema,
  openInNewTab: z.boolean().optional().default(false),
  borderRadius: z.number().int().min(0).max(100).optional().default(0),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Video Block Data Schema
 */
export const videoBlockDataSchema = z.object({
  provider: z.enum(['youtube', 'vimeo', 'wistia', 'custom']),
  videoId: z.string().max(100).optional(),
  videoUrl: urlSchema,
  thumbnailUrl: urlSchema,
  width: z.number().int().min(200).max(2000).optional().default(640),
  height: z.number().int().min(150).max(2000).optional().default(360),
  autoplay: z.boolean().optional().default(false),
  controls: z.boolean().optional().default(true),
  loop: z.boolean().optional().default(false),
  muted: z.boolean().optional().default(false),
  alignment: alignmentSchema.optional().default('center'),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * CTA Button Block Data Schema
 */
export const ctaButtonBlockDataSchema = z.object({
  text: ctaTextSchema,
  url: z.string().url('Invalid URL').max(500).optional(),
  action: z.enum(['link', 'download', 'calendar', 'email', 'phone', 'custom']).default('link'),
  actionData: z.record(z.any()).optional(),
  size: z.enum(['sm', 'md', 'lg', 'xl']).optional().default('lg'),
  variant: z.enum(['solid', 'outline', 'ghost', 'link']).optional().default('solid'),
  color: colorSchema,
  backgroundColor: colorSchema,
  hoverColor: colorSchema,
  alignment: alignmentSchema.optional().default('center'),
  fullWidth: z.boolean().optional().default(false),
  openInNewTab: z.boolean().optional().default(false),
  icon: z.string().max(50).optional(),
  iconPosition: z.enum(['left', 'right']).optional().default('right'),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Benefits List Block Data Schema
 */
export const benefitsListBlockDataSchema = z.object({
  title: z.string().max(200).optional(),
  benefits: z.array(
    z.object({
      id: z.string().uuid().optional(),
      text: z.string().min(1).max(500),
      icon: z.string().max(50).optional(),
      iconColor: colorSchema,
    })
  ).min(1, 'At least one benefit is required').max(20, 'Maximum 20 benefits allowed'),
  layout: z.enum(['list', 'grid']).optional().default('list'),
  columns: z.number().int().min(1).max(4).optional().default(1),
  showCheckmarks: z.boolean().optional().default(true),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Features Grid Block Data Schema
 */
export const featuresGridBlockDataSchema = z.object({
  title: z.string().max(200).optional(),
  features: z.array(
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(1).max(200),
      description: z.string().max(500).optional(),
      icon: z.string().max(50).optional(),
      iconColor: colorSchema,
      image: urlSchema,
    })
  ).min(1).max(12),
  columns: z.number().int().min(1).max(4).optional().default(3),
  alignment: alignmentSchema.optional().default('center'),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Testimonial Block Data Schema
 */
export const testimonialBlockDataSchema = z.object({
  quote: z.string().min(1).max(1000),
  author: z.string().min(1).max(100),
  authorTitle: z.string().max(100).optional(),
  authorCompany: z.string().max(100).optional(),
  authorImage: urlSchema,
  rating: z.number().int().min(1).max(5).optional(),
  showRating: z.boolean().optional().default(true),
  alignment: alignmentSchema.optional().default('center'),
  style: z.enum(['default', 'card', 'minimal', 'featured']).optional().default('default'),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Stats Block Data Schema
 */
export const statsBlockDataSchema = z.object({
  title: z.string().max(200).optional(),
  stats: z.array(
    z.object({
      id: z.string().uuid().optional(),
      value: z.string().min(1).max(50), // e.g., "10K+", "99%", "$1M"
      label: z.string().min(1).max(100),
      suffix: z.string().max(20).optional(),
      icon: z.string().max(50).optional(),
      color: colorSchema,
    })
  ).min(1).max(6),
  columns: z.number().int().min(1).max(4).optional().default(3),
  alignment: alignmentSchema.optional().default('center'),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Social Proof Block Data Schema
 */
export const socialProofBlockDataSchema = z.object({
  type: z.enum(['logos', 'reviews', 'count', 'live_activity']),
  title: z.string().max(200).optional(),
  logos: z.array(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().max(100),
      imageUrl: z.string().url().max(500),
      link: urlSchema,
    })
  ).max(20).optional(),
  reviewCount: z.number().int().min(0).optional(),
  averageRating: z.number().min(0).max(5).optional(),
  userCount: z.number().int().min(0).optional(),
  alignment: alignmentSchema.optional().default('center'),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Countdown Block Data Schema
 */
export const countdownBlockDataSchema = z.object({
  title: z.string().max(200).optional(),
  endDate: z.string().datetime('Invalid end date'),
  showDays: z.boolean().optional().default(true),
  showHours: z.boolean().optional().default(true),
  showMinutes: z.boolean().optional().default(true),
  showSeconds: z.boolean().optional().default(true),
  alignment: alignmentSchema.optional().default('center'),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  color: colorSchema,
  backgroundColor: colorSchema,
  expiredMessage: z.string().max(200).optional().default('Offer expired'),
  hideWhenExpired: z.boolean().optional().default(false),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Form Block Data Schema
 */
export const formBlockDataSchema = z.object({
  title: z.string().max(200).optional(),
  fields: z.array(
    z.object({
      id: z.string().uuid().optional(),
      type: z.enum(['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio']),
      label: z.string().min(1).max(100),
      placeholder: z.string().max(200).optional(),
      required: z.boolean().optional().default(false),
      options: z.array(z.string().max(200)).optional(), // For select, radio
    })
  ).min(1).max(20),
  submitButtonText: ctaTextSchema,
  submitAction: z.enum(['email', 'webhook', 'crm', 'custom']).default('email'),
  submitActionConfig: z.record(z.any()).optional(),
  successMessage: z.string().max(500).optional().default('Thank you! We\'ll be in touch soon.'),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Divider Block Data Schema
 */
export const dividerBlockDataSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted']).optional().default('solid'),
  thickness: z.number().int().min(1).max(10).optional().default(1),
  color: colorSchema,
  width: z.number().int().min(10).max(100).optional().default(100), // percentage
  alignment: alignmentSchema.optional().default('center'),
  marginTop: z.number().int().min(0).max(200).optional().default(20),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Spacer Block Data Schema
 */
export const spacerBlockDataSchema = z.object({
  height: z.number().int().min(10).max(500).optional().default(40),
});

/**
 * Embed Block Data Schema
 */
export const embedBlockDataSchema = z.object({
  type: z.enum(['iframe', 'script', 'html']),
  content: z.string().max(10000), // Embed code
  width: z.number().int().min(200).max(2000).optional(),
  height: z.number().int().min(150).max(2000).optional(),
  alignment: alignmentSchema.optional().default('center'),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Custom HTML Block Data Schema
 */
export const customHtmlBlockDataSchema = z.object({
  html: z.string().max(20000),
  css: z.string().max(10000).optional(),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Download Block Data Schema
 */
export const downloadBlockDataSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(500).optional(),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url('Invalid file URL').max(500),
  fileSize: z.string().max(50).optional(), // e.g., "2.5 MB"
  fileType: z.string().max(50).optional(), // e.g., "PDF", "XLSX"
  buttonText: ctaTextSchema.optional().default('Download'),
  icon: z.string().max(50).optional().default('Download'),
  alignment: alignmentSchema.optional().default('center'),
  backgroundColor: colorSchema,
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Calendar Block Data Schema
 */
export const calendarBlockDataSchema = z.object({
  title: z.string().max(200).optional(),
  provider: z.enum(['calendly', 'cal.com', 'google', 'outlook', 'custom']),
  calendarUrl: z.string().url('Invalid calendar URL').max(500),
  embedUrl: urlSchema,
  height: z.number().int().min(400).max(1200).optional().default(600),
  alignment: alignmentSchema.optional().default('center'),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

/**
 * Social Share Block Data Schema
 */
export const socialShareBlockDataSchema = z.object({
  title: z.string().max(200).optional(),
  shareText: z.string().max(280), // Twitter limit
  shareUrl: urlSchema,
  platforms: z.array(
    z.enum(['facebook', 'twitter', 'linkedin', 'whatsapp', 'email', 'copy_link'])
  ).min(1),
  size: z.enum(['sm', 'md', 'lg']).optional().default('md'),
  alignment: alignmentSchema.optional().default('center'),
  showLabels: z.boolean().optional().default(false),
  marginTop: z.number().int().min(0).max(200).optional().default(0),
  marginBottom: z.number().int().min(0).max(200).optional().default(20),
});

// =============================================================================
// CONTENT BLOCK SCHEMA
// =============================================================================

/**
 * Content Block Schema
 */
export const contentBlockSchema = z.object({
  id: z.string().uuid().optional(),
  type: blockTypeSchema,
  order: z.number().int().min(0),
  visible: z.boolean().optional().default(true),
  
  // Block data (discriminated union based on type)
  data: z.union([
    headlineBlockDataSchema,
    textBlockDataSchema,
    imageBlockDataSchema,
    videoBlockDataSchema,
    ctaButtonBlockDataSchema,
    benefitsListBlockDataSchema,
    featuresGridBlockDataSchema,
    testimonialBlockDataSchema,
    statsBlockDataSchema,
    socialProofBlockDataSchema,
    countdownBlockDataSchema,
    formBlockDataSchema,
    dividerBlockDataSchema,
    spacerBlockDataSchema,
    embedBlockDataSchema,
    customHtmlBlockDataSchema,
    downloadBlockDataSchema,
    calendarBlockDataSchema,
    socialShareBlockDataSchema,
  ]),
  
  // Conditional display
  conditionalLogic: z.object({
    enabled: z.boolean().default(false),
    conditions: z.array(
      z.object({
        questionId: z.string().uuid(),
        operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
        value: z.union([z.string(), z.number(), z.boolean()]),
      })
    ).optional(),
    logic: z.enum(['AND', 'OR']).optional().default('AND'),
  }).optional(),
  
  // Styling
  backgroundColor: colorSchema,
  padding: z.object({
    top: z.number().int().min(0).max(200).optional(),
    right: z.number().int().min(0).max(200).optional(),
    bottom: z.number().int().min(0).max(200).optional(),
    left: z.number().int().min(0).max(200).optional(),
  }).optional(),
  customCss: z.string().max(5000).optional(),
  customClasses: z.array(z.string().max(50)).max(10).optional(),
});

// =============================================================================
// RESULT PAGE SETTINGS SCHEMAS
// =============================================================================

/**
 * SEO Settings Schema
 */
export const resultPageSeoSchema = z.object({
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  ogImage: urlSchema,
  noIndex: z.boolean().optional().default(false),
}).optional();

/**
 * Tracking Settings Schema
 */
export const resultPageTrackingSchema = z.object({
  enableTracking: z.boolean().optional().default(true),
  trackingEvents: z.array(
    z.enum(['page_view', 'cta_click', 'download', 'form_submit', 'video_play'])
  ).optional(),
  customPixels: z.array(
    z.object({
      name: z.string().max(100),
      code: z.string().max(5000),
      position: z.enum(['head', 'body', 'footer']),
    })
  ).max(10).optional(),
}).optional();

/**
 * Result Page Design Settings Schema
 */
export const resultPageDesignSchema = z.object({
  backgroundColor: colorSchema,
  backgroundImage: urlSchema,
  backgroundOverlay: z.boolean().optional().default(false),
  overlayColor: colorSchema,
  overlayOpacity: z.number().min(0).max(1).optional().default(0.5),
  maxWidth: z.number().int().min(600).max(2000).optional().default(1200),
  contentPadding: z.number().int().min(0).max(200).optional().default(40),
  fontFamily: z.string().max(100).optional(),
  customCss: z.string().max(20000).optional(),
}).optional();

/**
 * Result Page Redirect Settings Schema
 */
export const resultPageRedirectSchema = z.object({
  enabled: z.boolean().optional().default(false),
  redirectUrl: urlSchema,
  redirectDelay: z.number().int().min(0).max(60).optional().default(5), // seconds
  showMessage: z.boolean().optional().default(true),
  redirectMessage: z.string().max(200).optional().default('Redirecting...'),
}).optional();

/**
 * Result Page Settings Schema
 */
export const resultPageSettingsSchema = z.object({
  seo: resultPageSeoSchema,
  tracking: resultPageTrackingSchema,
  design: resultPageDesignSchema,
  redirect: resultPageRedirectSchema,
  showBranding: z.boolean().optional().default(true),
  enablePrint: z.boolean().optional().default(false),
  enableShare: z.boolean().optional().default(true),
}).optional();

// =============================================================================
// RESULT PAGE CRUD SCHEMAS
// =============================================================================

/**
 * Create Result Page Schema
 */
export const createResultPageSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  name: resultPageNameSchema,
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  isDefault: z.boolean().optional().default(false),
  blocks: z.array(contentBlockSchema).max(50, 'Maximum 50 blocks allowed'),
  settings: resultPageSettingsSchema,
  metadata: z.record(z.any()).optional(),
});

/**
 * Update Result Page Schema
 */
export const updateResultPageSchema = z.object({
  name: resultPageNameSchema.optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  isDefault: z.boolean().optional(),
  blocks: z.array(contentBlockSchema).max(50).optional(),
  settings: resultPageSettingsSchema,
  metadata: z.record(z.any()).optional(),
});

/**
 * Reorder Blocks Schema
 */
export const reorderBlocksSchema = z.object({
  resultPageId: z.string().uuid('Invalid result page ID'),
  blockOrders: z.array(
    z.object({
      blockId: z.string().uuid('Invalid block ID'),
      order: z.number().int().min(0),
    })
  ).min(1),
});

/**
 * Add Block Schema
 */
export const addBlockSchema = z.object({
  resultPageId: z.string().uuid('Invalid result page ID'),
  block: contentBlockSchema,
  position: z.number().int().min(0).optional(),
});

/**
 * Update Block Schema
 */
export const updateBlockSchema = z.object({
  resultPageId: z.string().uuid('Invalid result page ID'),
  blockId: z.string().uuid('Invalid block ID'),
  updates: contentBlockSchema.partial(),
});

/**
 * Delete Block Schema
 */
export const deleteBlockSchema = z.object({
  resultPageId: z.string().uuid('Invalid result page ID'),
  blockId: z.string().uuid('Invalid block ID'),
});

/**
 * Duplicate Result Page Schema
 */
export const duplicateResultPageSchema = z.object({
  resultPageId: z.string().uuid('Invalid result page ID'),
  newName: resultPageNameSchema,
  targetFunnelId: z.string().uuid('Invalid funnel ID').optional(),
});

// =============================================================================
// RESULT PAGE PREVIEW & PUBLISH SCHEMAS
// =============================================================================

/**
 * Preview Result Page Schema
 */
export const previewResultPageSchema = z.object({
  resultPageId: z.string().uuid('Invalid result page ID'),
  leadId: z.string().uuid('Invalid lead ID').optional(), // For personalized preview
  deviceType: z.enum(['desktop', 'tablet', 'mobile']).optional().default('desktop'),
});

/**
 * Publish Result Page Schema
 */
export const publishResultPageSchema = z.object({
  resultPageId: z.string().uuid('Invalid result page ID'),
  version: z.string().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate block data based on block type
 */
export const validateBlockData = (blockType, data) => {
  const schemaMap = {
    headline: headlineBlockDataSchema,
    text: textBlockDataSchema,
    image: imageBlockDataSchema,
    video: videoBlockDataSchema,
    cta_button: ctaButtonBlockDataSchema,
    benefits_list: benefitsListBlockDataSchema,
    features_grid: featuresGridBlockDataSchema,
    testimonial: testimonialBlockDataSchema,
    stats: statsBlockDataSchema,
    social_proof: socialProofBlockDataSchema,
    countdown: countdownBlockDataSchema,
    form: formBlockDataSchema,
    divider: dividerBlockDataSchema,
    spacer: spacerBlockDataSchema,
    embed: embedBlockDataSchema,
    custom_html: customHtmlBlockDataSchema,
    download: downloadBlockDataSchema,
    calendar: calendarBlockDataSchema,
    social_share: socialShareBlockDataSchema,
  };
  
  const schema = schemaMap[blockType];
  if (!schema) return { valid: false, error: 'Invalid block type' };
  
  try {
    schema.parse(data);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Generate default block data
 */
export const getDefaultBlockData = (blockType) => {
  const defaults = {
    headline: { text: 'Your Headline Here', level: 'h1', alignment: 'center' },
    text: { content: 'Your text content here...', alignment: 'left' },
    cta_button: { text: 'Get Started', action: 'link', size: 'lg', alignment: 'center' },
    benefits_list: { benefits: [{ text: 'Benefit 1' }], layout: 'list' },
    divider: { style: 'solid', thickness: 1, width: 100 },
    spacer: { height: 40 },
  };
  
  return defaults[blockType] || {};
};

/**
 * Generate slug from name
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
    .substring(0, 100);
};

/**
 * Validate conditional logic
 */
export const validateConditionalLogic = (conditionalLogic, availableQuestions) => {
  if (!conditionalLogic?.enabled || !conditionalLogic?.conditions) {
    return { valid: true };
  }
  
  const questionIds = new Set(availableQuestions.map((q) => q.id));
  const errors = [];
  
  for (const condition of conditionalLogic.conditions) {
    if (!questionIds.has(condition.questionId)) {
      errors.push(`Question ${condition.questionId} not found`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Calculate estimated reading time
 */
export const calculateReadingTime = (blocks) => {
  const wordsPerMinute = 200;
  let totalWords = 0;
  
  blocks.forEach((block) => {
    if (block.type === 'text' && block.data.content) {
      totalWords += block.data.content.split(/\s+/).length;
    }
    if (block.type === 'headline' && block.data.text) {
      totalWords += block.data.text.split(/\s+/).length;
    }
  });
  
  return Math.ceil(totalWords / wordsPerMinute);
};

/**
 * Safe parse helpers
 */
export const safeParseCreateResultPage = (data) => {
  return createResultPageSchema.safeParse(data);
};

export const safeParseUpdateResultPage = (data) => {
  return updateResultPageSchema.safeParse(data);
};

export const safeParseAddBlock = (data) => {
  return addBlockSchema.safeParse(data);
};

export const safeParseContentBlock = (data) => {
  return contentBlockSchema.safeParse(data);
};

/**
 * Format Zod errors for display
 */
export const formatResultPageErrors = (zodError) => {
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

export const ResultPageSchemaTypes = {
  ContentBlock: contentBlockSchema,
  CreateResultPage: createResultPageSchema,
  UpdateResultPage: updateResultPageSchema,
  ResultPageSettings: resultPageSettingsSchema,
};

/**
 * Default Export
 */
export default {
  // Base schemas
  resultPageNameSchema,
  headlineSchema,
  subheadlineSchema,
  bodyTextSchema,
  ctaTextSchema,
  urlSchema,
  colorSchema,
  alignmentSchema,
  blockTypeSchema,

  // Block data schemas
  headlineBlockDataSchema,
  textBlockDataSchema,
  imageBlockDataSchema,
  videoBlockDataSchema,
  ctaButtonBlockDataSchema,
  benefitsListBlockDataSchema,
  featuresGridBlockDataSchema,
  testimonialBlockDataSchema,
  statsBlockDataSchema,
  socialProofBlockDataSchema,
  countdownBlockDataSchema,
  formBlockDataSchema,
  dividerBlockDataSchema,
  spacerBlockDataSchema,
  embedBlockDataSchema,
  customHtmlBlockDataSchema,
  downloadBlockDataSchema,
  calendarBlockDataSchema,
  socialShareBlockDataSchema,

  // Content block schema
  contentBlockSchema,

  // Settings schemas
  resultPageSeoSchema,
  resultPageTrackingSchema,
  resultPageDesignSchema,
  resultPageRedirectSchema,
  resultPageSettingsSchema,

  // CRUD schemas
  createResultPageSchema,
  updateResultPageSchema,
  reorderBlocksSchema,
  addBlockSchema,
  updateBlockSchema,
  deleteBlockSchema,
  duplicateResultPageSchema,

  // Preview & publish schemas
  previewResultPageSchema,
  publishResultPageSchema,

  // Helper functions
  validateBlockData,
  getDefaultBlockData,
  generateSlugFromName,
  validateConditionalLogic,
  calculateReadingTime,
  safeParseCreateResultPage,
  safeParseUpdateResultPage,
  safeParseAddBlock,
  safeParseContentBlock,
  formatResultPageErrors,

  // Types
  ResultPageSchemaTypes,
};
