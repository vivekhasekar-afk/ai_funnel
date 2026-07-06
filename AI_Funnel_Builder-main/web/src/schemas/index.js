// =============================================================================
// AI FUNNEL PLATFORM - SCHEMAS BARREL EXPORT
// =============================================================================
// Central export point for all validation schemas
// =============================================================================

// =============================================================================
// AUTHENTICATION SCHEMAS
// =============================================================================
export {
  // Base schemas
  emailSchema,
  passwordSchema,
  nameSchema,
  usernameSchema,
  phoneSchema as authPhoneSchema,
  companySchema as authCompanySchema,
  tokenSchema,
  otpSchema,

  // Auth flow schemas
  loginSchema,
  signupSchema,
  oauthSignupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,

  // 2FA schemas
  twoFactorSetupSchema,
  twoFactorVerifySchema,
  twoFactorDisableSchema,
  twoFactorLoginSchema,
  twoFactorBackupCodesSchema,
  twoFactorRecoverySchema,

  // OAuth schemas
  oauthCallbackSchema,
  oauthConnectSchema,
  oauthDisconnectSchema,

  // Session schemas
  refreshTokenSchema,
  logoutSchema,
  sessionCheckSchema,
  revokeSessionSchema,
  listSessionsSchema,

  // Security schemas
  updateEmailSchema as authUpdateEmailSchema,
  verifyEmailChangeSchema,
  ipWhitelistSchema,
  securityQuestionSchema,
  deleteAccountSchema as authDeleteAccountSchema,

  // Helper functions
  checkPasswordStrength,
  isValidEmail,
  isValidPassword,
  isValidUsername as isValidAuthUsername,
  isValidPhone as isValidAuthPhone,
  safeParseLogin,
  safeParseSignup,
  safeParseForgotPassword,
  safeParseResetPassword,
  safeParseChangePassword,
  safeParseTwoFactorVerify,
  formatZodErrors as formatAuthErrors,
  getFirstError,
  sanitizeInput,

  // Types
  AuthSchemaTypes,
} from './auth.schemas';

// =============================================================================
// FUNNEL SCHEMAS
// =============================================================================
export {
  // Base schemas
  funnelNameSchema,
  funnelDescriptionSchema,
  funnelSlugSchema,
  funnelGoalSchema,
  funnelFocusSchema,
  funnelStatusSchema,
  hexColorSchema,
  urlSchema as funnelUrlSchema,
  customDomainSchema,
  tagSchema as funnelTagSchema,
  tagsSchema as funnelTagsSchema,

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
  conditionSchema as funnelConditionSchema,
  conditionGroupSchema as funnelConditionGroupSchema,
  conditionalLogicSchema as funnelConditionalLogicSchema,

  // Import/Export schemas
  exportFunnelSchema,
  importFunnelSchema,

  // Versioning schemas
  createVersionSchema,
  restoreVersionSchema,

  // Helper functions
  validateFunnelNameUnique,
  validateSlugUnique as validateFunnelSlugUnique,
  generateSlugFromName as generateFunnelSlug,
  safeParseCreateFunnel,
  safeParseUpdateFunnel,
  safeParseCloneFunnel,
  safeParseFunnelSettings,
  safeParsePublishFunnel,
  formatFunnelErrors,
  validateConditionalLogic as validateFunnelConditionalLogic,

  // Types
  FunnelSchemaTypes,
} from './funnel.schemas';

// =============================================================================
// QUESTION SCHEMAS
// =============================================================================
export {
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
  emailValidationSchema as questionEmailValidationSchema,
  phoneValidationSchema as questionPhoneValidationSchema,
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
} from './question.schemas';

// =============================================================================
// LEAD SCHEMAS
// =============================================================================
export {
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
} from './lead.schemas';

// =============================================================================
// ANALYTICS SCHEMAS
// =============================================================================
export {
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
  funnelAnalyticsQuerySchema as analyticsFunnelQuerySchema,
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
} from './analytics.schemas';

// =============================================================================
// PROJECT SCHEMAS
// =============================================================================
export {
  // Base schemas
  projectNameSchema,
  projectDescriptionSchema,
  projectSlugSchema,
  industrySchema,
  businessTypeSchema,
  projectStatusSchema,
  projectColorSchema,
  projectIconSchema,
  urlSchema as projectUrlSchema,
  tagSchema as projectTagSchema,
  tagsSchema as projectTagsSchema,

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
  generateSlugFromName as generateProjectSlug,
  validateProjectNameUnique,
  validateSlugUnique as validateProjectSlugUnique,
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
} from './project.schemas';

// =============================================================================
// USER SCHEMAS
// =============================================================================
export {
  // Base schemas
  userNameSchema,
  usernameSchema as userUsernameSchema,
  bioSchema,
  jobTitleSchema,
  companyNameSchema as userCompanySchema,
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
  updateEmailSchema as userUpdateEmailSchema,
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
  deleteAccountSchema as userDeleteAccountSchema,

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
  safeParseUpdateEmail as safeParseUserUpdateEmail,
  safeParseDeleteAccount as safeParseUserDeleteAccount,
  safeParseOnboardingSurvey,
  formatUserErrors,
  sanitizeUserProfile,

  // Types
  UserSchemaTypes,
} from './user.schemas';

// =============================================================================
// FLOW SCHEMAS
// =============================================================================
export {
  // Base schemas
  positionSchema,
  dimensionsSchema,
  colorSchema as flowColorSchema,
  nodeIdSchema,
  edgeIdSchema,
  nodeTypeSchema,
  edgeTypeSchema,
  handleTypeSchema,
  handlePositionSchema,
  handleSchema,

  // Node data schemas
  baseNodeDataSchema,
  questionNodeDataSchema,
  conditionalNodeDataSchema,
  actionNodeDataSchema,
  resultNodeDataSchema,
  integrationNodeDataSchema,
  delayNodeDataSchema,
  noteNodeDataSchema,
  groupNodeDataSchema,

  // Node & edge schemas
  flowNodeSchema,
  flowEdgeSchema,

  // Layout schemas
  viewportSchema,
  layoutDirectionSchema,
  layoutAlgorithmSchema,
  flowLayoutSchema,
  flowSettingsSchema,

  // Flow schema
  flowSchema,

  // Operation schemas
  createNodeSchema,
  updateNodeSchema,
  deleteNodeSchema,
  createEdgeSchema,
  updateEdgeSchema,
  deleteEdgeSchema,
  bulkUpdatePositionsSchema,
  autoLayoutSchema,
  validateFlowSchema,
  exportFlowSchema,
  importFlowSchema,

  // Helper functions
  generateNodeId,
  generateEdgeId,
  validateConnection,
  checkForCycle,
  findOrphanedNodes,
  findDeadEndNodes,
  calculateFlowStats,
  calculateMaxDepth,
  safeParseFlow,
  safeParseNode,
  safeParseEdge,
  safeParseCreateNode,
  safeParseCreateEdge,
  formatFlowErrors,

  // Types
  FlowSchemaTypes,
} from './flow.schemas';

// =============================================================================
// GROUP SCHEMAS
// =============================================================================
export {
  // Base schemas
  groupNameSchema,
  groupDescriptionSchema,
  groupTypeSchema,
  groupColorSchema,
  groupIconSchema,
  groupStatusSchema,
  groupVisibilitySchema,
  tagSchema as groupTagSchema,
  tagsSchema as groupTagsSchema,

  // Settings schemas
  groupAccessControlSchema,
  groupOrganizationSchema,
  groupDisplaySettingsSchema,
  groupAutomationSchema,
  groupSettingsSchema,

  // CRUD schemas
  createGroupSchema,
  updateGroupSchema,
  deleteGroupSchema,
  archiveGroupSchema,
  restoreGroupSchema,
  moveGroupSchema,
  duplicateGroupSchema,

  // Hierarchy schemas
  reorderGroupsSchema,
  setParentGroupSchema,
  getGroupTreeSchema,

  // Filter & search schemas
  groupFilterSchema,
  groupSearchSchema,

  // Statistics schemas
  groupStatsQuerySchema,

  // Bulk operations schemas
  bulkUpdateGroupsSchema,
  bulkDeleteGroupsSchema,
  bulkArchiveGroupsSchema,
  bulkMoveGroupsSchema,

  // Export/Import schemas
  exportGroupSchema,
  importGroupSchema,

  // Permissions schemas
  updateGroupPermissionsSchema,
  shareGroupSchema,

  // Helper functions
  validateGroupHierarchy,
  calculateGroupDepth,
  getGroupPath,
  getAllChildGroups,
  getDefaultGroupColor,
  getDefaultGroupIcon,
  safeParseCreateGroup,
  safeParseUpdateGroup,
  safeParseGroupFilter,
  safeParseMoveGroup,
  formatGroupErrors,

  // Types
  GroupSchemaTypes,
} from './group.schemas';

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================
export {
  // Base schemas
  sessionIdSchema,
  responseIdSchema,
  questionIdSchema,
  answerValueSchema,

  // Type-specific answer schemas
  textAnswerSchema,
  emailAnswerSchema as responseEmailSchema,
  phoneAnswerSchema as responsePhoneSchema,
  numberAnswerSchema,
  dateAnswerSchema,
  urlAnswerSchema as responseUrlSchema,
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
} from './response.schemas';

// =============================================================================
// RESULT PAGE SCHEMAS
// =============================================================================
export {
  // Base schemas
  resultPageNameSchema,
  headlineSchema,
  subheadlineSchema,
  bodyTextSchema,
  ctaTextSchema,
  urlSchema as resultPageUrlSchema,
  colorSchema as resultPageColorSchema,
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
  generateSlugFromName as generateResultPageSlug,
  validateConditionalLogic as validateResultPageConditionalLogic,
  calculateReadingTime,
  safeParseCreateResultPage,
  safeParseUpdateResultPage,
  safeParseAddBlock,
  safeParseContentBlock,
  formatResultPageErrors,

  // Types
  ResultPageSchemaTypes,
} from './result-page.schemas';

// =============================================================================
// COMBINED SCHEMA TYPES
// =============================================================================

/**
 * All schema types organized by category
 */
export const AllSchemaTypes = {
  Auth: AuthSchemaTypes,
  Funnel: FunnelSchemaTypes,
  Question: QuestionSchemaTypes,
  Lead: LeadSchemaTypes,
  Analytics: AnalyticsSchemaTypes,
  Project: ProjectSchemaTypes,
  User: UserSchemaTypes,
  Flow: FlowSchemaTypes,
  Group: GroupSchemaTypes,
  Response: ResponseSchemaTypes,
  ResultPage: ResultPageSchemaTypes,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all validation errors from multiple schemas
 */
export const getAllValidationErrors = (zodErrors) => {
  const allErrors = {};
  
  zodErrors.forEach((error, index) => {
    if (error?.errors) {
      error.errors.forEach((err) => {
        const path = `${index}.${err.path.join('.')}`;
        allErrors[path] = err.message;
      });
    }
  });
  
  return allErrors;
};

/**
 * Validate multiple schemas at once
 */
export const validateMultipleSchemas = (schemas, data) => {
  const results = schemas.map((schema) => schema.safeParse(data));
  const isValid = results.every((result) => result.success);
  
  return {
    valid: isValid,
    results,
    errors: isValid ? null : getAllValidationErrors(results.filter((r) => !r.success)),
  };
};

/**
 * Get schema by name
 */
export const getSchemaByName = (schemaName) => {
  const schemaMap = {
    // Auth
    login: loginSchema,
    signup: signupSchema,
    forgotPassword: forgotPasswordSchema,
    resetPassword: resetPasswordSchema,
    
    // Funnel
    createFunnel: createFunnelSchema,
    updateFunnel: updateFunnelSchema,
    
    // Question
    createQuestion: createQuestionSchema,
    updateQuestion: updateQuestionSchema,
    
    // Lead
    submitLead: submitLeadSchema,
    createLead: createLeadSchema,
    updateLead: updateLeadSchema,
    
    // Project
    createProject: createProjectSchema,
    updateProject: updateProjectSchema,
    
    // User
    updateProfile: updateProfileSchema,
    updatePreferences: updatePreferencesSchema,
    
    // Flow
    createNode: createNodeSchema,
    createEdge: createEdgeSchema,
    
    // Group
    createGroup: createGroupSchema,
    updateGroup: updateGroupSchema,
    
    // Response
    submitSingleResponse: submitSingleResponseSchema,
    submitMultipleResponses: submitMultipleResponsesSchema,
    
    // Result Page
    createResultPage: createResultPageSchema,
    updateResultPage: updateResultPageSchema,
  };
  
  return schemaMap[schemaName];
};

/**
 * Default Export
 */
export default {
  AllSchemaTypes,
  getAllValidationErrors,
  validateMultipleSchemas,
  getSchemaByName,
};
