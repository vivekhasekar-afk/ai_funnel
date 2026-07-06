// =============================================================================
// AI FUNNEL PLATFORM - GROUP VALIDATION SCHEMAS
// =============================================================================
// Comprehensive validation for groups (folders/collections) that organize funnels
// Using Zod for runtime validation
// =============================================================================

import { z } from 'zod';
import { TEXT_LIMITS, VALIDATION_CONFIG } from '@config/constants';

// =============================================================================
// BASE VALIDATION SCHEMAS
// =============================================================================

/**
 * Group Name Schema
 */
export const groupNameSchema = z
  .string()
  .min(TEXT_LIMITS.GROUP_NAME_MIN, `Group name must be at least ${TEXT_LIMITS.GROUP_NAME_MIN} characters`)
  .max(TEXT_LIMITS.GROUP_NAME_MAX, `Group name must be less than ${TEXT_LIMITS.GROUP_NAME_MAX} characters`)
  .trim()
  .refine(
    (name) => !/^\s*$/.test(name),
    { message: 'Group name cannot be only whitespace' }
  );

/**
 * Group Description Schema
 */
export const groupDescriptionSchema = z
  .string()
  .max(TEXT_LIMITS.GROUP_DESCRIPTION_MAX, `Description must be less than ${TEXT_LIMITS.GROUP_DESCRIPTION_MAX} characters`)
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Group Type Schema
 */
export const groupTypeSchema = z.enum([
  'folder',        // Simple folder organization
  'campaign',      // Marketing campaign
  'product',       // Product-specific funnels
  'service',       // Service-specific funnels
  'client',        // Client-specific (for agencies)
  'experiment',    // A/B testing experiments
  'archive',       // Archived funnels
  'template',      // Template collection
  'custom',        // Custom grouping
], { errorMap: () => ({ message: 'Invalid group type' }) });

/**
 * Group Color Schema
 */
export const groupColorSchema = z
  .string()
  .regex(VALIDATION_CONFIG.HEX_COLOR_PATTERN, 'Invalid color format. Use hex format (e.g., #FF5733)')
  .optional();

/**
 * Group Icon Schema
 */
export const groupIconSchema = z
  .string()
  .max(50, 'Icon name must be less than 50 characters')
  .optional();

/**
 * Group Status Schema
 */
export const groupStatusSchema = z.enum([
  'active',
  'archived',
  'paused',
], { errorMap: () => ({ message: 'Invalid group status' }) });

/**
 * Group Visibility Schema
 */
export const groupVisibilitySchema = z.enum([
  'public',      // Visible to all team members
  'private',     // Visible only to creator
  'team',        // Visible to specific team members
  'restricted',  // Restricted access
], { errorMap: () => ({ message: 'Invalid visibility setting' }) });

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
// GROUP SETTINGS SCHEMAS
// =============================================================================

/**
 * Group Access Control Schema
 */
export const groupAccessControlSchema = z.object({
  visibility: groupVisibilitySchema.default('team'),
  allowedUserIds: z.array(z.string().uuid()).max(100).optional().default([]),
  allowedRoles: z.array(z.enum(['admin', 'editor', 'viewer'])).optional().default([]),
  inheritProjectPermissions: z.boolean().optional().default(true),
  requireApproval: z.boolean().optional().default(false),
}).optional();

/**
 * Group Organization Schema
 */
export const groupOrganizationSchema = z.object({
  sortOrder: z.number().int().min(0).optional().default(0),
  isDefault: z.boolean().optional().default(false),
  isStarred: z.boolean().optional().default(false),
  isHidden: z.boolean().optional().default(false),
  autoArchive: z.boolean().optional().default(false),
  autoArchiveAfterDays: z.number().int().min(1).max(365).optional(),
}).optional();

/**
 * Group Display Settings Schema
 */
export const groupDisplaySettingsSchema = z.object({
  defaultView: z.enum(['grid', 'list', 'kanban']).optional().default('grid'),
  showFunnelCount: z.boolean().optional().default(true),
  showLeadCount: z.boolean().optional().default(true),
  showLastModified: z.boolean().optional().default(true),
  customFields: z.array(
    z.object({
      key: z.string().max(50),
      label: z.string().max(100),
      type: z.enum(['text', 'number', 'date', 'boolean']),
    })
  ).max(10).optional(),
}).optional();

/**
 * Group Automation Settings Schema
 */
export const groupAutomationSchema = z.object({
  autoTagFunnels: z.boolean().optional().default(false),
  autoTags: tagsSchema,
  applyDefaultSettings: z.boolean().optional().default(false),
  defaultFunnelSettings: z.record(z.any()).optional(),
  webhookUrl: z.string().url().max(500).optional().or(z.literal('')),
  webhookEvents: z.array(
    z.enum(['funnel_created', 'funnel_published', 'funnel_archived', 'group_updated'])
  ).optional(),
}).optional();

/**
 * Combined Group Settings Schema
 */
export const groupSettingsSchema = z.object({
  accessControl: groupAccessControlSchema,
  organization: groupOrganizationSchema,
  display: groupDisplaySettingsSchema,
  automation: groupAutomationSchema,
});

// =============================================================================
// GROUP CRUD SCHEMAS
// =============================================================================

/**
 * Create Group Schema
 */
export const createGroupSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  name: groupNameSchema,
  description: groupDescriptionSchema,
  type: groupTypeSchema,
  color: groupColorSchema,
  icon: groupIconSchema,
  tags: tagsSchema,
  parentGroupId: z.string().uuid('Invalid parent group ID').optional().nullable(),
  settings: groupSettingsSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Update Group Schema
 */
export const updateGroupSchema = z.object({
  name: groupNameSchema.optional(),
  description: groupDescriptionSchema,
  type: groupTypeSchema.optional(),
  color: groupColorSchema,
  icon: groupIconSchema,
  tags: tagsSchema,
  status: groupStatusSchema.optional(),
  parentGroupId: z.string().uuid('Invalid parent group ID').optional().nullable(),
  settings: groupSettingsSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Delete Group Schema
 */
export const deleteGroupSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  deleteChildren: z.boolean().optional().default(false), // Delete sub-groups
  moveFunnelsTo: z.string().uuid('Invalid group ID').optional(), // Move funnels to another group
  permanent: z.boolean().optional().default(false),
  confirmText: z
    .string()
    .refine((val) => val === 'DELETE', {
      message: 'Type DELETE to confirm',
    })
    .optional(),
});

/**
 * Archive Group Schema
 */
export const archiveGroupSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  archiveChildren: z.boolean().optional().default(true),
  archiveFunnels: z.boolean().optional().default(false),
  reason: z.enum(['completed', 'paused', 'no_longer_needed', 'other']).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Restore Group Schema
 */
export const restoreGroupSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  restoreChildren: z.boolean().optional().default(true),
  restoreFunnels: z.boolean().optional().default(false),
});

/**
 * Move Group Schema
 */
export const moveGroupSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  targetProjectId: z.string().uuid('Invalid project ID').optional(),
  targetParentGroupId: z.string().uuid('Invalid parent group ID').optional().nullable(),
  moveChildren: z.boolean().optional().default(true),
  moveFunnels: z.boolean().optional().default(true),
});

/**
 * Duplicate Group Schema
 */
export const duplicateGroupSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  newName: groupNameSchema,
  targetProjectId: z.string().uuid('Invalid project ID').optional(),
  duplicateChildren: z.boolean().optional().default(true),
  duplicateFunnels: z.boolean().optional().default(true),
  duplicateSettings: z.boolean().optional().default(true),
});

// =============================================================================
// GROUP HIERARCHY SCHEMAS
// =============================================================================

/**
 * Reorder Groups Schema
 */
export const reorderGroupsSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  groupOrders: z.array(
    z.object({
      groupId: z.string().uuid('Invalid group ID'),
      order: z.number().int().min(0),
      parentGroupId: z.string().uuid().optional().nullable(),
    })
  ).min(1, 'At least one group is required'),
});

/**
 * Set Parent Group Schema
 */
export const setParentGroupSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  parentGroupId: z.string().uuid('Invalid parent group ID').nullable(),
}).refine(
  (data) => data.groupId !== data.parentGroupId,
  { message: 'A group cannot be its own parent', path: ['parentGroupId'] }
);

/**
 * Get Group Tree Schema
 */
export const getGroupTreeSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  maxDepth: z.number().int().min(1).max(10).optional().default(5),
  includeEmpty: z.boolean().optional().default(true),
  includeArchived: z.boolean().optional().default(false),
  includeFunnelCount: z.boolean().optional().default(true),
});

// =============================================================================
// GROUP FILTERING & SEARCH SCHEMAS
// =============================================================================

/**
 * Group Filter Schema
 */
export const groupFilterSchema = z.object({
  // Basic filters
  projectId: z.string().uuid('Invalid project ID').optional(),
  parentGroupId: z.string().uuid().optional().nullable(),
  type: z.array(groupTypeSchema).optional(),
  status: z.array(groupStatusSchema).optional(),
  tags: z.array(tagSchema).optional(),
  
  // Hierarchy filters
  isRootLevel: z.boolean().optional(), // No parent
  hasChildren: z.boolean().optional(),
  depth: z.number().int().min(0).max(10).optional(),
  
  // Date filters
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  updatedAfter: z.string().datetime().optional(),
  updatedBefore: z.string().datetime().optional(),
  
  // Content filters
  hasFunnels: z.boolean().optional(),
  minFunnels: z.number().int().min(0).optional(),
  maxFunnels: z.number().int().min(0).optional(),
  isEmpty: z.boolean().optional(),
  
  // Access filters
  visibility: z.array(groupVisibilitySchema).optional(),
  createdBy: z.string().uuid().optional(),
  
  // Starred/Hidden
  isStarred: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  
  // Pagination
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  
  // Sorting
  sortBy: z.enum(['name', 'created_at', 'updated_at', 'funnel_count', 'order']).optional().default('order'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Group Search Schema
 */
export const groupSearchSchema = z.object({
  query: z.string().min(1).max(200),
  projectId: z.string().uuid('Invalid project ID').optional(),
  searchIn: z.array(z.enum(['name', 'description', 'tags'])).optional().default(['name', 'description']),
  filters: groupFilterSchema.optional(),
});

// =============================================================================
// GROUP STATISTICS SCHEMAS
// =============================================================================

/**
 * Group Statistics Query Schema
 */
export const groupStatsQuerySchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  includeChildren: z.boolean().optional().default(false),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).optional(),
  metrics: z.array(
    z.enum([
      'total_funnels',
      'active_funnels',
      'total_leads',
      'new_leads',
      'avg_conversion_rate',
      'total_views',
    ])
  ).optional(),
});

// =============================================================================
// BULK OPERATIONS SCHEMAS
// =============================================================================

/**
 * Bulk Update Groups Schema
 */
export const bulkUpdateGroupsSchema = z.object({
  groupIds: z.array(z.string().uuid('Invalid group ID')).min(1).max(50, 'Maximum 50 groups at once'),
  updates: z.object({
    status: groupStatusSchema.optional(),
    tags: z.object({
      action: z.enum(['add', 'remove', 'replace']),
      values: tagsSchema,
    }).optional(),
    parentGroupId: z.string().uuid().optional().nullable(),
    settings: groupSettingsSchema.partial().optional(),
  }),
});

/**
 * Bulk Delete Groups Schema
 */
export const bulkDeleteGroupsSchema = z.object({
  groupIds: z.array(z.string().uuid('Invalid group ID')).min(1).max(50),
  deleteChildren: z.boolean().optional().default(false),
  moveFunnelsTo: z.string().uuid().optional(),
  permanent: z.boolean().optional().default(false),
});

/**
 * Bulk Archive Groups Schema
 */
export const bulkArchiveGroupsSchema = z.object({
  groupIds: z.array(z.string().uuid('Invalid group ID')).min(1).max(50),
  archiveChildren: z.boolean().optional().default(true),
  archiveFunnels: z.boolean().optional().default(false),
});

/**
 * Bulk Move Groups Schema
 */
export const bulkMoveGroupsSchema = z.object({
  groupIds: z.array(z.string().uuid('Invalid group ID')).min(1).max(50),
  targetProjectId: z.string().uuid('Invalid project ID').optional(),
  targetParentGroupId: z.string().uuid('Invalid parent group ID').optional().nullable(),
  moveChildren: z.boolean().optional().default(true),
  moveFunnels: z.boolean().optional().default(true),
});

// =============================================================================
// GROUP EXPORT/IMPORT SCHEMAS
// =============================================================================

/**
 * Export Group Schema
 */
export const exportGroupSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  format: z.enum(['json', 'csv']).default('json'),
  includeChildren: z.boolean().optional().default(true),
  includeFunnels: z.boolean().optional().default(false),
  includeSettings: z.boolean().optional().default(true),
  includeMetadata: z.boolean().optional().default(true),
});

/**
 * Import Group Schema
 */
export const importGroupSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  data: z.string().min(1, 'Import data is required'), // JSON string
  parentGroupId: z.string().uuid().optional().nullable(),
  overwriteExisting: z.boolean().optional().default(false),
  generateNewIds: z.boolean().optional().default(true),
});

// =============================================================================
// GROUP PERMISSIONS SCHEMAS
// =============================================================================

/**
 * Update Group Permissions Schema
 */
export const updateGroupPermissionsSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  userId: z.string().uuid('Invalid user ID'),
  permissions: z.array(
    z.enum([
      'view',
      'create_funnel',
      'edit_funnel',
      'delete_funnel',
      'publish_funnel',
      'manage_group',
      'manage_permissions',
    ])
  ).min(1),
});

/**
 * Share Group Schema
 */
export const shareGroupSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  shareWith: z.array(
    z.object({
      userId: z.string().uuid('Invalid user ID').optional(),
      email: z.string().email('Invalid email address').optional(),
      role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
    })
  ).min(1).max(20),
  message: z.string().max(500).optional(),
  sendNotification: z.boolean().optional().default(true),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate group hierarchy (prevent cycles)
 */
export const validateGroupHierarchy = (groupId, parentGroupId, allGroups) => {
  if (!parentGroupId) return { valid: true };
  if (groupId === parentGroupId) {
    return { valid: false, error: 'A group cannot be its own parent' };
  }
  
  // Check for circular reference
  let current = parentGroupId;
  const visited = new Set([groupId]);
  
  while (current) {
    if (visited.has(current)) {
      return { valid: false, error: 'Circular group hierarchy detected' };
    }
    visited.add(current);
    
    const parent = allGroups.find((g) => g.id === current);
    if (!parent) break;
    current = parent.parentGroupId;
  }
  
  return { valid: true };
};

/**
 * Calculate group depth in hierarchy
 */
export const calculateGroupDepth = (groupId, allGroups) => {
  let depth = 0;
  let current = allGroups.find((g) => g.id === groupId);
  
  while (current?.parentGroupId) {
    depth++;
    current = allGroups.find((g) => g.id === current.parentGroupId);
    if (depth > 10) break; // Safety limit
  }
  
  return depth;
};

/**
 * Get group path (breadcrumb)
 */
export const getGroupPath = (groupId, allGroups) => {
  const path = [];
  let current = allGroups.find((g) => g.id === groupId);
  
  while (current) {
    path.unshift(current);
    if (!current.parentGroupId) break;
    current = allGroups.find((g) => g.id === current.parentGroupId);
    if (path.length > 10) break; // Safety limit
  }
  
  return path;
};

/**
 * Get all child groups (recursive)
 */
export const getAllChildGroups = (groupId, allGroups) => {
  const children = [];
  const queue = [groupId];
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    const directChildren = allGroups.filter((g) => g.parentGroupId === currentId);
    
    children.push(...directChildren);
    queue.push(...directChildren.map((g) => g.id));
  }
  
  return children;
};

/**
 * Get default group color
 */
export const getDefaultGroupColor = (type) => {
  const colorMap = {
    folder: '#6B7280',      // Gray
    campaign: '#3B82F6',    // Blue
    product: '#10B981',     // Green
    service: '#8B5CF6',     // Purple
    client: '#F59E0B',      // Amber
    experiment: '#EC4899',  // Pink
    archive: '#9CA3AF',     // Gray
    template: '#14B8A6',    // Teal
    custom: '#6366F1',      // Indigo
  };
  return colorMap[type] || '#6B7280';
};

/**
 * Get default group icon
 */
export const getDefaultGroupIcon = (type) => {
  const iconMap = {
    folder: 'Folder',
    campaign: 'Megaphone',
    product: 'Package',
    service: 'Briefcase',
    client: 'Users',
    experiment: 'FlaskConical',
    archive: 'Archive',
    template: 'FileText',
    custom: 'Layers',
  };
  return iconMap[type] || 'Folder';
};

/**
 * Safe parse helpers
 */
export const safeParseCreateGroup = (data) => {
  return createGroupSchema.safeParse(data);
};

export const safeParseUpdateGroup = (data) => {
  return updateGroupSchema.safeParse(data);
};

export const safeParseGroupFilter = (data) => {
  return groupFilterSchema.safeParse(data);
};

export const safeParseMoveGroup = (data) => {
  return moveGroupSchema.safeParse(data);
};

/**
 * Format Zod errors for display
 */
export const formatGroupErrors = (zodError) => {
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

export const GroupSchemaTypes = {
  Name: groupNameSchema,
  Description: groupDescriptionSchema,
  Type: groupTypeSchema,
  Status: groupStatusSchema,
  CreateGroup: createGroupSchema,
  UpdateGroup: updateGroupSchema,
  GroupFilter: groupFilterSchema,
  GroupSettings: groupSettingsSchema,
};

/**
 * Default Export
 */
export default {
  // Base schemas
  groupNameSchema,
  groupDescriptionSchema,
  groupTypeSchema,
  groupColorSchema,
  groupIconSchema,
  groupStatusSchema,
  groupVisibilitySchema,
  tagSchema,
  tagsSchema,

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
};
