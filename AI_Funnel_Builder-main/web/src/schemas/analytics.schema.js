// =============================================================================
// AI FUNNEL PLATFORM - ANALYTICS VALIDATION SCHEMAS
// =============================================================================
// Comprehensive validation for analytics queries, reports, and metrics
// Using Zod for runtime validation
// =============================================================================

import { z } from 'zod';

// =============================================================================
// BASE VALIDATION SCHEMAS
// =============================================================================

/**
 * Date Range Schema
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  { message: 'Start date must be before or equal to end date', path: ['endDate'] }
);

/**
 * Time Period Schema (Predefined ranges)
 */
export const timePeriodSchema = z.enum([
  'today',
  'yesterday',
  'last_7_days',
  'last_14_days',
  'last_30_days',
  'last_90_days',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
  'this_quarter',
  'last_quarter',
  'this_year',
  'last_year',
  'all_time',
  'custom',
]);

/**
 * Metric Schema
 */
export const metricSchema = z.enum([
  // Funnel metrics
  'views',
  'unique_views',
  'starts',
  'completions',
  'submissions',
  'conversion_rate',
  'completion_rate',
  'drop_off_rate',
  'avg_time_to_complete',
  'avg_questions_answered',
  
  // Lead metrics
  'total_leads',
  'new_leads',
  'qualified_leads',
  'converted_leads',
  'avg_lead_score',
  'lead_quality',
  
  // Engagement metrics
  'avg_session_duration',
  'bounce_rate',
  'return_rate',
  'share_rate',
  
  // Question metrics
  'question_completion_rate',
  'question_skip_rate',
  'question_time',
  'option_selection_rate',
  
  // Result page metrics
  'result_views',
  'result_actions',
  'result_conversions',
]);

/**
 * Dimension Schema (Group by)
 */
export const dimensionSchema = z.enum([
  'date',
  'hour',
  'day_of_week',
  'week',
  'month',
  'quarter',
  'year',
  'funnel',
  'question',
  'source',
  'device',
  'browser',
  'country',
  'city',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'referrer',
]);

/**
 * Comparison Type Schema
 */
export const comparisonTypeSchema = z.enum([
  'previous_period',
  'same_period_last_year',
  'custom_period',
  'none',
]);

/**
 * Chart Type Schema
 */
export const chartTypeSchema = z.enum([
  'line',
  'bar',
  'pie',
  'doughnut',
  'area',
  'funnel',
  'heatmap',
  'table',
]);

/**
 * Aggregation Schema
 */
export const aggregationSchema = z.enum([
  'sum',
  'avg',
  'min',
  'max',
  'count',
  'count_unique',
  'median',
  'percentile',
]);

// =============================================================================
// ANALYTICS QUERY SCHEMAS
// =============================================================================

/**
 * Base Analytics Query Schema
 */
export const baseAnalyticsQuerySchema = z.object({
  // Time range
  timePeriod: timePeriodSchema.optional().default('last_30_days'),
  dateRange: dateRangeSchema.optional(),
  timezone: z.string().max(50).optional().default('UTC'),
  
  // Metrics
  metrics: z.array(metricSchema).min(1, 'At least one metric is required').max(10),
  
  // Dimensions
  groupBy: z.array(dimensionSchema).max(5).optional(),
  
  // Comparison
  compareWith: comparisonTypeSchema.optional().default('none'),
  comparisonDateRange: dateRangeSchema.optional(),
  
  // Filters (handled separately)
  includeFilters: z.boolean().optional().default(false),
}).refine(
  (data) => {
    if (data.timePeriod === 'custom') {
      return !!data.dateRange;
    }
    return true;
  },
  { message: 'Date range is required when time period is "custom"', path: ['dateRange'] }
);

/**
 * Funnel Analytics Query Schema
 */
export const funnelAnalyticsQuerySchema = baseAnalyticsQuerySchema.extend({
  funnelId: z.string().uuid('Invalid funnel ID'),
  includeQuestionBreakdown: z.boolean().optional().default(false),
  includeDeviceBreakdown: z.boolean().optional().default(false),
  includeSourceBreakdown: z.boolean().optional().default(false),
  includeLocationBreakdown: z.boolean().optional().default(false),
});

/**
 * Dashboard Analytics Query Schema
 */
export const dashboardAnalyticsQuerySchema = baseAnalyticsQuerySchema.extend({
  projectId: z.string().uuid('Invalid project ID').optional(),
  funnelIds: z.array(z.string().uuid()).max(20).optional(),
  includeTopFunnels: z.boolean().optional().default(true),
  topFunnelsLimit: z.number().int().min(1).max(20).optional().default(5),
  includeRecentActivity: z.boolean().optional().default(true),
});

/**
 * Question Analytics Query Schema
 */
export const questionAnalyticsQuerySchema = baseAnalyticsQuerySchema.extend({
  questionId: z.string().uuid('Invalid question ID'),
  includeOptionBreakdown: z.boolean().optional().default(true),
  includeDropOffRate: z.boolean().optional().default(true),
  includeAverageTime: z.boolean().optional().default(true),
});

/**
 * Lead Analytics Query Schema
 */
export const leadAnalyticsQuerySchema = baseAnalyticsQuerySchema.extend({
  funnelId: z.string().uuid('Invalid funnel ID').optional(),
  includeSourceBreakdown: z.boolean().optional().default(true),
  includeStatusBreakdown: z.boolean().optional().default(true),
  includeScoreDistribution: z.boolean().optional().default(true),
  includeConversionFunnel: z.boolean().optional().default(true),
});

/**
 * Conversion Analytics Query Schema
 */
export const conversionAnalyticsQuerySchema = baseAnalyticsQuerySchema.extend({
  funnelId: z.string().uuid('Invalid funnel ID').optional(),
  projectId: z.string().uuid('Invalid project ID').optional(),
  conversionGoal: z.enum([
    'funnel_completion',
    'lead_submission',
    'email_capture',
    'phone_capture',
    'result_action',
    'custom',
  ]).optional().default('funnel_completion'),
  customGoal: z.string().max(100).optional(),
  includeStepBreakdown: z.boolean().optional().default(true),
});

/**
 * Real-time Analytics Query Schema
 */
export const realtimeAnalyticsQuerySchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID').optional(),
  refreshInterval: z.number().int().min(5).max(300).optional().default(30), // seconds
  metrics: z.array(metricSchema).min(1).max(5),
  lastMinutes: z.number().int().min(5).max(1440).optional().default(60),
});

// =============================================================================
// ADVANCED ANALYTICS SCHEMAS
// =============================================================================

/**
 * Cohort Analysis Schema
 */
export const cohortAnalysisSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  cohortType: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  retentionMetric: z.enum(['completion', 'return_visit', 'conversion']).default('completion'),
  cohortSize: z.number().int().min(1).max(100).optional().default(10),
});

/**
 * Funnel Drop-off Analysis Schema
 */
export const dropOffAnalysisSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  dateRange: dateRangeSchema,
  includeQuestionDetails: z.boolean().optional().default(true),
  includeDeviceBreakdown: z.boolean().optional().default(true),
  minDropOffPercentage: z.number().min(0).max(100).optional().default(5),
});

/**
 * A/B Test Analytics Schema
 */
export const abTestAnalyticsSchema = z.object({
  testId: z.string().uuid('Invalid test ID'),
  variantIds: z.array(z.string().uuid()).min(2).max(10),
  dateRange: dateRangeSchema,
  metrics: z.array(metricSchema).min(1),
  confidenceLevel: z.number().min(0.5).max(0.99).optional().default(0.95),
  includeStatisticalSignificance: z.boolean().optional().default(true),
});

/**
 * Attribution Analysis Schema
 */
export const attributionAnalysisSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID').optional(),
  dateRange: dateRangeSchema,
  attributionModel: z.enum([
    'first_touch',
    'last_touch',
    'linear',
    'time_decay',
    'position_based',
    'custom',
  ]).default('last_touch'),
  dimensions: z.array(z.enum(['source', 'medium', 'campaign', 'referrer'])).min(1),
  conversionWindow: z.number().int().min(1).max(90).optional().default(30), // days
});

/**
 * Path Analysis Schema
 */
export const pathAnalysisSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  dateRange: dateRangeSchema,
  pathType: z.enum(['most_common', 'successful', 'abandoned']).default('most_common'),
  minPathFrequency: z.number().int().min(1).optional().default(5),
  maxPathLength: z.number().int().min(2).max(20).optional().default(10),
  includeDropOffPoints: z.boolean().optional().default(true),
});

// =============================================================================
// FILTER SCHEMAS
// =============================================================================

/**
 * Analytics Filter Schema
 */
export const analyticsFilterSchema = z.object({
  // Funnel filters
  funnelIds: z.array(z.string().uuid()).optional(),
  funnelStatus: z.array(z.enum(['draft', 'published', 'paused', 'archived'])).optional(),
  
  // Source filters
  sources: z.array(z.string().max(100)).optional(),
  utmSource: z.array(z.string().max(100)).optional(),
  utmMedium: z.array(z.string().max(100)).optional(),
  utmCampaign: z.array(z.string().max(100)).optional(),
  referrers: z.array(z.string().url()).optional(),
  
  // Device filters
  devices: z.array(z.enum(['desktop', 'mobile', 'tablet'])).optional(),
  browsers: z.array(z.string().max(50)).optional(),
  operatingSystems: z.array(z.string().max(50)).optional(),
  
  // Location filters
  countries: z.array(z.string().length(2)).optional(), // ISO codes
  cities: z.array(z.string().max(100)).optional(),
  
  // Lead filters
  leadStatus: z.array(z.enum(['new', 'contacted', 'qualified', 'converted', 'lost'])).optional(),
  leadScoreMin: z.number().int().min(0).max(100).optional(),
  leadScoreMax: z.number().int().min(0).max(100).optional(),
  leadTags: z.array(z.string().max(50)).optional(),
  
  // Completion filters
  completed: z.boolean().optional(),
  minQuestionsAnswered: z.number().int().min(0).optional(),
  maxQuestionsAnswered: z.number().int().max(100).optional(),
  
  // Time filters
  minDuration: z.number().int().min(0).optional(), // seconds
  maxDuration: z.number().int().max(86400).optional(), // seconds
  hourOfDay: z.array(z.number().int().min(0).max(23)).optional(),
  dayOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // 0 = Sunday
});

/**
 * Combined Analytics Query with Filters Schema
 */
export const analyticsQueryWithFiltersSchema = baseAnalyticsQuerySchema.extend({
  filters: analyticsFilterSchema.optional(),
});

// =============================================================================
// REPORT SCHEMAS
// =============================================================================

/**
 * Create Report Schema
 */
export const createReportSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  reportType: z.enum([
    'funnel_performance',
    'lead_generation',
    'conversion',
    'engagement',
    'custom',
  ]),
  query: analyticsQueryWithFiltersSchema,
  visualization: z.object({
    chartType: chartTypeSchema,
    displayOptions: z.record(z.any()).optional(),
  }),
  schedule: z.object({
    enabled: z.boolean().default(false),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:MM
    dayOfWeek: z.number().int().min(0).max(6).optional(), // For weekly reports
    dayOfMonth: z.number().int().min(1).max(31).optional(), // For monthly reports
    recipients: z.array(z.string().email()).max(20).optional(),
  }).optional(),
  isPublic: z.boolean().optional().default(false),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

/**
 * Update Report Schema
 */
export const updateReportSchema = createReportSchema.partial();

/**
 * Generate Report Schema
 */
export const generateReportSchema = z.object({
  reportId: z.string().uuid('Invalid report ID').optional(),
  query: analyticsQueryWithFiltersSchema.optional(),
  format: z.enum(['pdf', 'csv', 'xlsx', 'json']).default('pdf'),
  includeCharts: z.boolean().optional().default(true),
  includeRawData: z.boolean().optional().default(false),
  emailTo: z.array(z.string().email()).max(10).optional(),
});

/**
 * Report Filter Schema
 */
export const reportFilterSchema = z.object({
  reportType: z.array(z.enum(['funnel_performance', 'lead_generation', 'conversion', 'engagement', 'custom'])).optional(),
  tags: z.array(z.string().max(50)).optional(),
  isPublic: z.boolean().optional(),
  createdBy: z.string().uuid().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['name', 'created_at', 'updated_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// EXPORT SCHEMAS
// =============================================================================

/**
 * Export Analytics Schema
 */
export const exportAnalyticsSchema = z.object({
  query: analyticsQueryWithFiltersSchema,
  format: z.enum(['csv', 'xlsx', 'json', 'pdf']).default('csv'),
  includeCharts: z.boolean().optional().default(false),
  includeRawData: z.boolean().optional().default(true),
  includeMetadata: z.boolean().optional().default(true),
  maxRows: z.number().int().min(1).max(1000000).optional(),
  emailTo: z.array(z.string().email()).max(10).optional(),
});

// =============================================================================
// GOALS & TRACKING SCHEMAS
// =============================================================================

/**
 * Create Goal Schema
 */
export const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  funnelId: z.string().uuid('Invalid funnel ID').optional(),
  goalType: z.enum([
    'conversion_rate',
    'lead_count',
    'completion_rate',
    'avg_time',
    'custom',
  ]),
  targetValue: z.number().min(0),
  comparisonOperator: z.enum(['greater_than', 'less_than', 'equals', 'greater_or_equal', 'less_or_equal']).default('greater_or_equal'),
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  notifyOnAchievement: z.boolean().optional().default(true),
  notifyOnMissing: z.boolean().optional().default(false),
  recipients: z.array(z.string().email()).max(10).optional(),
});

/**
 * Update Goal Schema
 */
export const updateGoalSchema = createGoalSchema.partial();

/**
 * Goal Progress Query Schema
 */
export const goalProgressQuerySchema = z.object({
  goalId: z.string().uuid('Invalid goal ID'),
  includeHistory: z.boolean().optional().default(true),
  historyPeriod: z.enum(['last_7_days', 'last_30_days', 'last_90_days', 'all_time']).optional().default('last_30_days'),
});

// =============================================================================
// EVENT TRACKING SCHEMAS
// =============================================================================

/**
 * Track Event Schema
 */
export const trackEventSchema = z.object({
  eventName: z.string().min(1).max(100),
  eventCategory: z.enum(['funnel', 'question', 'result', 'lead', 'custom']),
  funnelId: z.string().uuid('Invalid funnel ID').optional(),
  questionId: z.string().uuid('Invalid question ID').optional(),
  leadId: z.string().uuid('Invalid lead ID').optional(),
  properties: z.record(z.any()).optional(),
  value: z.number().optional(),
  sessionId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

/**
 * Event Query Schema
 */
export const eventQuerySchema = z.object({
  eventNames: z.array(z.string().max(100)).optional(),
  eventCategories: z.array(z.enum(['funnel', 'question', 'result', 'lead', 'custom'])).optional(),
  funnelId: z.string().uuid().optional(),
  dateRange: dateRangeSchema,
  groupBy: z.array(dimensionSchema).max(3).optional(),
  aggregation: aggregationSchema.optional().default('count'),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(1000).optional().default(100),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get date range from time period
 */
export const getDateRangeFromPeriod = (period, timezone = 'UTC') => {
  const now = new Date();
  let startDate, endDate = now;
  
  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'yesterday':
      endDate = new Date(now.setHours(0, 0, 0, 0));
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'last_7_days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'last_30_days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'last_90_days':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Format metric value
 */
export const formatMetricValue = (metric, value) => {
  const percentageMetrics = [
    'conversion_rate',
    'completion_rate',
    'drop_off_rate',
    'bounce_rate',
    'return_rate',
    'share_rate',
    'question_completion_rate',
    'question_skip_rate',
  ];
  
  if (percentageMetrics.includes(metric)) {
    return `${value.toFixed(2)}%`;
  }
  
  const timeMetrics = ['avg_time_to_complete', 'avg_session_duration', 'question_time'];
  if (timeMetrics.includes(metric)) {
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}m ${seconds}s`;
  }
  
  return value.toLocaleString();
};

/**
 * Safe parse helpers
 */
export const safeParseFunnelAnalytics = (data) => {
  return funnelAnalyticsQuerySchema.safeParse(data);
};

export const safeParseDashboardAnalytics = (data) => {
  return dashboardAnalyticsQuerySchema.safeParse(data);
};

export const safeParseLeadAnalytics = (data) => {
  return leadAnalyticsQuerySchema.safeParse(data);
};

export const safeParseCreateReport = (data) => {
  return createReportSchema.safeParse(data);
};

export const safeParseTrackEvent = (data) => {
  return trackEventSchema.safeParse(data);
};

/**
 * Format Zod errors for display
 */
export const formatAnalyticsErrors = (zodError) => {
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

export const AnalyticsSchemaTypes = {
  DateRange: dateRangeSchema,
  TimePeriod: timePeriodSchema,
  Metric: metricSchema,
  Dimension: dimensionSchema,
  FunnelAnalytics: funnelAnalyticsQuerySchema,
  DashboardAnalytics: dashboardAnalyticsQuerySchema,
  LeadAnalytics: leadAnalyticsQuerySchema,
  CreateReport: createReportSchema,
  TrackEvent: trackEventSchema,
  AnalyticsFilter: analyticsFilterSchema,
};

/**
 * Default Export
 */
export default {
  // Base schemas
  dateRangeSchema,
  timePeriodSchema,
  metricSchema,
  dimensionSchema,
  comparisonTypeSchema,
  chartTypeSchema,
  aggregationSchema,

  // Query schemas
  baseAnalyticsQuerySchema,
  funnelAnalyticsQuerySchema,
  dashboardAnalyticsQuerySchema,
  questionAnalyticsQuerySchema,
  leadAnalyticsQuerySchema,
  conversionAnalyticsQuerySchema,
  realtimeAnalyticsQuerySchema,

  // Advanced analytics schemas
  cohortAnalysisSchema,
  dropOffAnalysisSchema,
  abTestAnalyticsSchema,
  attributionAnalysisSchema,
  pathAnalysisSchema,

  // Filter schemas
  analyticsFilterSchema,
  analyticsQueryWithFiltersSchema,

  // Report schemas
  createReportSchema,
  updateReportSchema,
  generateReportSchema,
  reportFilterSchema,

  // Export schemas
  exportAnalyticsSchema,

  // Goals schemas
  createGoalSchema,
  updateGoalSchema,
  goalProgressQuerySchema,

  // Event tracking schemas
  trackEventSchema,
  eventQuerySchema,

  // Helper functions
  getDateRangeFromPeriod,
  calculatePercentageChange,
  formatMetricValue,
  safeParseFunnelAnalytics,
  safeParseDashboardAnalytics,
  safeParseLeadAnalytics,
  safeParseCreateReport,
  safeParseTrackEvent,
  formatAnalyticsErrors,

  // Types
  AnalyticsSchemaTypes,
};
