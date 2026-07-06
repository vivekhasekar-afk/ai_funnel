// =============================================================================
// AI FUNNEL PLATFORM - FLOW VALIDATION SCHEMAS
// =============================================================================
// Comprehensive validation for visual flow builder nodes, edges, and layouts
// Using Zod for runtime validation with React Flow compatibility
// =============================================================================

import { z } from 'zod';
import { TEXT_LIMITS } from '@config/constants';

// =============================================================================
// BASE VALIDATION SCHEMAS
// =============================================================================

/**
 * Position Schema (X, Y coordinates)
 */
export const positionSchema = z.object({
  x: z.number().finite('X coordinate must be a finite number'),
  y: z.number().finite('Y coordinate must be a finite number'),
});

/**
 * Dimensions Schema (Width, Height)
 */
export const dimensionsSchema = z.object({
  width: z.number().min(50, 'Width must be at least 50px').max(2000, 'Width cannot exceed 2000px'),
  height: z.number().min(30, 'Height must be at least 30px').max(2000, 'Height cannot exceed 2000px'),
});

/**
 * Color Schema
 */
export const colorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format')
  .optional();

/**
 * Node ID Schema
 */
export const nodeIdSchema = z
  .string()
  .min(1, 'Node ID is required')
  .max(100, 'Node ID must be less than 100 characters');

/**
 * Edge ID Schema
 */
export const edgeIdSchema = z
  .string()
  .min(1, 'Edge ID is required')
  .max(100, 'Edge ID must be less than 100 characters');

// =============================================================================
// NODE TYPE SCHEMAS
// =============================================================================

/**
 * Node Type Schema
 */
export const nodeTypeSchema = z.enum([
  // Entry nodes
  'start',
  'landing_page',
  'email_capture',
  
  // Question nodes
  'question',
  'multiple_choice',
  'single_choice',
  'text_input',
  'email_input',
  'phone_input',
  'number_input',
  'date_input',
  'file_upload',
  'rating',
  'slider',
  'yes_no',
  'ranking',
  'matrix',
  
  // Logic nodes
  'conditional',
  'branch',
  'merge',
  'delay',
  'webhook',
  'api_call',
  
  // Action nodes
  'send_email',
  'send_sms',
  'tag_lead',
  'score_lead',
  'update_field',
  'trigger_automation',
  
  // Result nodes
  'result_page',
  'redirect',
  'thank_you',
  'end',
  
  // Integration nodes
  'crm_sync',
  'email_marketing',
  'zapier',
  'custom_integration',
  
  // Special nodes
  'note',
  'group',
]);

/**
 * Handle Type Schema
 */
export const handleTypeSchema = z.enum(['source', 'target']);

/**
 * Handle Position Schema
 */
export const handlePositionSchema = z.enum(['top', 'right', 'bottom', 'left']);

/**
 * Handle Schema
 */
export const handleSchema = z.object({
  id: z.string().min(1),
  type: handleTypeSchema,
  position: handlePositionSchema,
  isConnectable: z.boolean().optional().default(true),
  style: z.record(z.any()).optional(),
});

// =============================================================================
// NODE DATA SCHEMAS
// =============================================================================

/**
 * Base Node Data Schema
 */
export const baseNodeDataSchema = z.object({
  label: z.string().min(1).max(TEXT_LIMITS.QUESTION_TEXT_MAX),
  description: z.string().max(TEXT_LIMITS.QUESTION_DESCRIPTION_MAX).optional(),
  icon: z.string().max(50).optional(),
  color: colorSchema,
  metadata: z.record(z.any()).optional(),
});

/**
 * Question Node Data Schema
 */
export const questionNodeDataSchema = baseNodeDataSchema.extend({
  questionId: z.string().uuid('Invalid question ID').optional(),
  questionType: z.string().min(1),
  questionText: z.string().min(1).max(TEXT_LIMITS.QUESTION_TEXT_MAX),
  placeholder: z.string().max(TEXT_LIMITS.QUESTION_PLACEHOLDER_MAX).optional(),
  required: z.boolean().optional().default(false),
  options: z.array(
    z.object({
      id: z.string(),
      text: z.string().min(1).max(TEXT_LIMITS.QUESTION_OPTION_TEXT_MAX),
      value: z.string().optional(),
      nextNodeId: z.string().optional(), // For branching logic
    })
  ).optional(),
  validation: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

/**
 * Conditional Node Data Schema
 */
export const conditionalNodeDataSchema = baseNodeDataSchema.extend({
  conditions: z.array(
    z.object({
      id: z.string().uuid().optional(),
      field: z.string().min(1),
      operator: z.enum([
        'equals',
        'not_equals',
        'contains',
        'not_contains',
        'greater_than',
        'less_than',
        'greater_or_equal',
        'less_or_equal',
        'is_empty',
        'is_not_empty',
        'in',
        'not_in',
      ]),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
      nextNodeId: z.string().optional(),
    })
  ).min(1, 'At least one condition is required'),
  logic: z.enum(['AND', 'OR']).default('AND'),
  defaultNextNodeId: z.string().optional(), // Fallback if no conditions match
});

/**
 * Action Node Data Schema
 */
export const actionNodeDataSchema = baseNodeDataSchema.extend({
  actionType: z.enum([
    'send_email',
    'send_sms',
    'tag_lead',
    'score_lead',
    'update_field',
    'trigger_webhook',
    'api_call',
  ]),
  actionConfig: z.record(z.any()),
  onSuccess: z.string().optional(), // Next node on success
  onFailure: z.string().optional(), // Next node on failure
  retryAttempts: z.number().int().min(0).max(5).optional().default(0),
  timeout: z.number().int().min(1000).max(60000).optional().default(5000), // milliseconds
});

/**
 * Result Node Data Schema
 */
export const resultNodeDataSchema = baseNodeDataSchema.extend({
  resultType: z.enum(['success', 'error', 'redirect', 'thank_you', 'custom']),
  title: z.string().min(1).max(200),
  message: z.string().max(2000).optional(),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().url().max(500).optional(),
  redirectUrl: z.string().url().max(500).optional(),
  redirectDelay: z.number().int().min(0).max(60).optional(), // seconds
  showDownload: z.boolean().optional().default(false),
  downloadUrl: z.string().url().max(500).optional(),
});

/**
 * Integration Node Data Schema
 */
export const integrationNodeDataSchema = baseNodeDataSchema.extend({
  provider: z.enum(['salesforce', 'hubspot', 'mailchimp', 'zapier', 'custom']),
  integrationType: z.enum(['sync', 'create', 'update', 'trigger']),
  config: z.record(z.any()),
  fieldMapping: z.record(z.string()).optional(),
  onSuccess: z.string().optional(),
  onFailure: z.string().optional(),
});

/**
 * Delay Node Data Schema
 */
export const delayNodeDataSchema = baseNodeDataSchema.extend({
  delayType: z.enum(['fixed', 'until_date', 'until_condition']),
  duration: z.number().int().min(0).optional(), // milliseconds
  delayUntil: z.string().datetime().optional(),
  condition: z.record(z.any()).optional(),
});

/**
 * Note Node Data Schema
 */
export const noteNodeDataSchema = z.object({
  content: z.string().max(2000),
  color: colorSchema,
  fontSize: z.number().int().min(10).max(24).optional().default(14),
  width: z.number().int().min(100).max(800).optional(),
  height: z.number().int().min(50).max(600).optional(),
});

/**
 * Group Node Data Schema
 */
export const groupNodeDataSchema = z.object({
  label: z.string().max(100),
  color: colorSchema,
  backgroundColor: colorSchema,
  borderStyle: z.enum(['solid', 'dashed', 'dotted']).optional().default('solid'),
  childNodeIds: z.array(z.string()).optional().default([]),
});

// =============================================================================
// NODE SCHEMA
// =============================================================================

/**
 * Flow Node Schema
 */
export const flowNodeSchema = z.object({
  id: nodeIdSchema,
  type: nodeTypeSchema,
  position: positionSchema,
  data: z.union([
    baseNodeDataSchema,
    questionNodeDataSchema,
    conditionalNodeDataSchema,
    actionNodeDataSchema,
    resultNodeDataSchema,
    integrationNodeDataSchema,
    delayNodeDataSchema,
    noteNodeDataSchema,
    groupNodeDataSchema,
  ]),
  
  // React Flow specific
  selected: z.boolean().optional(),
  draggable: z.boolean().optional().default(true),
  selectable: z.boolean().optional().default(true),
  connectable: z.boolean().optional().default(true),
  deletable: z.boolean().optional().default(true),
  
  // Styling
  style: z.record(z.any()).optional(),
  className: z.string().optional(),
  
  // Layout
  width: z.number().optional(),
  height: z.number().optional(),
  zIndex: z.number().int().optional(),
  
  // Grouping
  parentNode: z.string().optional(),
  extent: z.enum(['parent']).optional(),
  expandParent: z.boolean().optional(),
  
  // Custom handles
  sourcePosition: handlePositionSchema.optional(),
  targetPosition: handlePositionSchema.optional(),
});

// =============================================================================
// EDGE SCHEMAS
// =============================================================================

/**
 * Edge Type Schema
 */
export const edgeTypeSchema = z.enum([
  'default',
  'straight',
  'step',
  'smoothstep',
  'bezier',
  'custom',
]);

/**
 * Edge Animation Schema
 */
export const edgeAnimationSchema = z.object({
  enabled: z.boolean().default(false),
  duration: z.number().int().min(100).max(10000).optional().default(1000), // milliseconds
  direction: z.enum(['forward', 'backward', 'both']).optional().default('forward'),
});

/**
 * Edge Label Schema
 */
export const edgeLabelSchema = z.object({
  text: z.string().max(100),
  style: z.record(z.any()).optional(),
  labelBgPadding: z.array(z.number()).length(2).optional(),
  labelBgBorderRadius: z.number().optional(),
  labelBgStyle: z.record(z.any()).optional(),
});

/**
 * Flow Edge Schema
 */
export const flowEdgeSchema = z.object({
  id: edgeIdSchema,
  type: edgeTypeSchema.optional().default('default'),
  source: nodeIdSchema,
  target: nodeIdSchema,
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  
  // Edge data
  data: z.object({
    label: z.string().max(100).optional(),
    condition: z.string().max(500).optional(),
    weight: z.number().int().min(0).max(100).optional(),
    metadata: z.record(z.any()).optional(),
  }).optional(),
  
  // Styling
  animated: z.boolean().optional().default(false),
  style: z.record(z.any()).optional(),
  className: z.string().optional(),
  label: z.union([z.string(), edgeLabelSchema]).optional(),
  labelStyle: z.record(z.any()).optional(),
  labelShowBg: z.boolean().optional().default(true),
  labelBgStyle: z.record(z.any()).optional(),
  
  // Markers
  markerStart: z.string().optional(),
  markerEnd: z.string().optional(),
  
  // Interaction
  selected: z.boolean().optional(),
  selectable: z.boolean().optional().default(true),
  deletable: z.boolean().optional().default(true),
  focusable: z.boolean().optional().default(true),
  
  // Custom
  zIndex: z.number().int().optional(),
}).refine(
  (data) => data.source !== data.target,
  { message: 'Source and target nodes cannot be the same', path: ['target'] }
);

// =============================================================================
// VIEWPORT & LAYOUT SCHEMAS
// =============================================================================

/**
 * Viewport Schema
 */
export const viewportSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  zoom: z.number().min(0.1).max(4).default(1),
});

/**
 * Layout Direction Schema
 */
export const layoutDirectionSchema = z.enum(['TB', 'BT', 'LR', 'RL']); // Top-Bottom, Bottom-Top, Left-Right, Right-Left

/**
 * Layout Algorithm Schema
 */
export const layoutAlgorithmSchema = z.enum(['dagre', 'elk', 'manual', 'auto']);

/**
 * Flow Layout Schema
 */
export const flowLayoutSchema = z.object({
  algorithm: layoutAlgorithmSchema.default('dagre'),
  direction: layoutDirectionSchema.default('TB'),
  nodeSpacing: z.number().int().min(20).max(500).optional().default(100),
  rankSpacing: z.number().int().min(20).max(500).optional().default(150),
  edgeSpacing: z.number().int().min(10).max(200).optional().default(50),
  align: z.enum(['UL', 'UR', 'DL', 'DR']).optional(), // Upper-Left, Upper-Right, etc.
});

// =============================================================================
// FLOW CONFIGURATION SCHEMAS
// =============================================================================

/**
 * Flow Settings Schema
 */
export const flowSettingsSchema = z.object({
  // Grid
  showGrid: z.boolean().optional().default(true),
  snapToGrid: z.boolean().optional().default(true),
  gridSize: z.number().int().min(5).max(50).optional().default(15),
  
  // Minimap
  showMinimap: z.boolean().optional().default(true),
  minimapPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).optional().default('bottom-right'),
  
  // Controls
  showControls: z.boolean().optional().default(true),
  showZoomControls: z.boolean().optional().default(true),
  showFitViewControl: z.boolean().optional().default(true),
  showInteractiveControl: z.boolean().optional().default(true),
  
  // Interaction
  nodesDraggable: z.boolean().optional().default(true),
  nodesConnectable: z.boolean().optional().default(true),
  elementsSelectable: z.boolean().optional().default(true),
  panOnDrag: z.boolean().optional().default(true),
  panOnScroll: z.boolean().optional().default(false),
  zoomOnScroll: z.boolean().optional().default(true),
  zoomOnPinch: z.boolean().optional().default(true),
  zoomOnDoubleClick: z.boolean().optional().default(true),
  selectNodesOnDrag: z.boolean().optional().default(true),
  
  // Connection
  connectionMode: z.enum(['strict', 'loose']).optional().default('loose'),
  connectionLineType: edgeTypeSchema.optional().default('bezier'),
  connectionLineStyle: z.record(z.any()).optional(),
  
  // Validation
  validateConnection: z.boolean().optional().default(true),
  maxConnections: z.number().int().min(1).max(100).optional(),
  preventCycles: z.boolean().optional().default(true),
  
  // Auto-layout
  autoLayout: z.boolean().optional().default(false),
  layoutOnChange: z.boolean().optional().default(false),
});

/**
 * Complete Flow Schema
 */
export const flowSchema = z.object({
  id: z.string().uuid('Invalid flow ID').optional(),
  funnelId: z.string().uuid('Invalid funnel ID'),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  version: z.number().int().min(1).optional().default(1),
  nodes: z.array(flowNodeSchema).min(1, 'At least one node is required').max(500, 'Maximum 500 nodes allowed'),
  edges: z.array(flowEdgeSchema).max(1000, 'Maximum 1000 edges allowed'),
  viewport: viewportSchema.optional(),
  layout: flowLayoutSchema.optional(),
  settings: flowSettingsSchema.optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// =============================================================================
// FLOW OPERATIONS SCHEMAS
// =============================================================================

/**
 * Create Node Schema
 */
export const createNodeSchema = z.object({
  flowId: z.string().uuid('Invalid flow ID'),
  node: flowNodeSchema,
  autoConnect: z.boolean().optional().default(false),
  connectToNodeId: z.string().optional(),
});

/**
 * Update Node Schema
 */
export const updateNodeSchema = z.object({
  flowId: z.string().uuid('Invalid flow ID'),
  nodeId: nodeIdSchema,
  updates: flowNodeSchema.partial(),
});

/**
 * Delete Node Schema
 */
export const deleteNodeSchema = z.object({
  flowId: z.string().uuid('Invalid flow ID'),
  nodeId: nodeIdSchema,
  deleteConnectedEdges: z.boolean().optional().default(true),
});

/**
 * Create Edge Schema
 */
export const createEdgeSchema = z.object({
  flowId: z.string().uuid('Invalid flow ID'),
  edge: flowEdgeSchema,
  validateConnection: z.boolean().optional().default(true),
});

/**
 * Update Edge Schema
 */
export const updateEdgeSchema = z.object({
  flowId: z.string().uuid('Invalid flow ID'),
  edgeId: edgeIdSchema,
  updates: flowEdgeSchema.partial(),
});

/**
 * Delete Edge Schema
 */
export const deleteEdgeSchema = z.object({
  flowId: z.string().uuid('Invalid flow ID'),
  edgeId: edgeIdSchema,
});

/**
 * Bulk Update Positions Schema
 */
export const bulkUpdatePositionsSchema = z.object({
  flowId: z.string().uuid('Invalid flow ID'),
  nodePositions: z.array(
    z.object({
      nodeId: nodeIdSchema,
      position: positionSchema,
    })
  ).min(1).max(100),
});

/**
 * Auto Layout Schema
 */
export const autoLayoutSchema = z.object({
  flowId: z.string().uuid('Invalid flow ID'),
  layout: flowLayoutSchema,
  animate: z.boolean().optional().default(true),
  fitView: z.boolean().optional().default(true),
});

/**
 * Validate Flow Schema
 */
export const validateFlowSchema = z.object({
  flowId: z.string().uuid('Invalid flow ID'),
  checkCycles: z.boolean().optional().default(true),
  checkOrphans: z.boolean().optional().default(true),
  checkDeadEnds: z.boolean().optional().default(true),
  checkConnectivity: z.boolean().optional().default(true),
});

/**
 * Export Flow Schema
 */
export const exportFlowSchema = z.object({
  flowId: z.string().uuid('Invalid flow ID'),
  format: z.enum(['json', 'svg', 'png', 'pdf']).default('json'),
  includeMetadata: z.boolean().optional().default(true),
  includeStyles: z.boolean().optional().default(true),
});

/**
 * Import Flow Schema
 */
export const importFlowSchema = z.object({
  funnelId: z.string().uuid('Invalid funnel ID'),
  data: z.string().min(1, 'Flow data is required'),
  format: z.enum(['json', 'reactflow']).default('json'),
  overwrite: z.boolean().optional().default(false),
  validateOnImport: z.boolean().optional().default(true),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate unique node ID
 */
export const generateNodeId = (type) => {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate unique edge ID
 */
export const generateEdgeId = (source, target) => {
  return `${source}->${target}_${Date.now()}`;
};

/**
 * Validate connection
 */
export const validateConnection = (source, target, nodes, edges) => {
  // Check if nodes exist
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);
  
  if (!sourceNode || !targetNode) {
    return { valid: false, error: 'Source or target node not found' };
  }
  
  // Check for cycles
  const hasCycle = checkForCycle(source, target, edges);
  if (hasCycle) {
    return { valid: false, error: 'Connection would create a cycle' };
  }
  
  // Check if connection already exists
  const connectionExists = edges.some(
    (e) => e.source === source && e.target === target
  );
  if (connectionExists) {
    return { valid: false, error: 'Connection already exists' };
  }
  
  return { valid: true };
};

/**
 * Check for cycles in graph
 */
export const checkForCycle = (source, target, edges) => {
  const adjacencyList = new Map();
  
  // Build adjacency list
  edges.forEach((edge) => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source).push(edge.target);
  });
  
  // Add new edge temporarily
  if (!adjacencyList.has(source)) {
    adjacencyList.set(source, []);
  }
  adjacencyList.get(source).push(target);
  
  // DFS to detect cycle
  const visited = new Set();
  const recursionStack = new Set();
  
  const hasCycleDFS = (node) => {
    visited.add(node);
    recursionStack.add(node);
    
    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }
    
    recursionStack.delete(node);
    return false;
  };
  
  return hasCycleDFS(source);
};

/**
 * Find orphaned nodes
 */
export const findOrphanedNodes = (nodes, edges) => {
  const connectedNodeIds = new Set();
  
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });
  
  return nodes.filter((node) => {
    // Start nodes are not orphaned
    if (node.type === 'start' || node.type === 'landing_page') return false;
    return !connectedNodeIds.has(node.id);
  });
};

/**
 * Find dead-end nodes
 */
export const findDeadEndNodes = (nodes, edges) => {
  const nodesWithOutgoing = new Set(edges.map((e) => e.source));
  
  return nodes.filter((node) => {
    // End nodes are expected dead ends
    const endTypes = ['end', 'result_page', 'redirect', 'thank_you'];
    if (endTypes.includes(node.type)) return false;
    
    return !nodesWithOutgoing.has(node.id);
  });
};

/**
 * Calculate flow statistics
 */
export const calculateFlowStats = (nodes, edges) => {
  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodesByType: nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {}),
    avgConnectionsPerNode: nodes.length > 0 ? (edges.length / nodes.length).toFixed(2) : 0,
    maxDepth: calculateMaxDepth(nodes, edges),
  };
};

/**
 * Calculate max depth of flow
 */
export const calculateMaxDepth = (nodes, edges) => {
  const adjacencyList = new Map();
  edges.forEach((edge) => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source).push(edge.target);
  });
  
  const startNodes = nodes.filter((n) => n.type === 'start' || n.type === 'landing_page');
  if (startNodes.length === 0) return 0;
  
  let maxDepth = 0;
  
  const dfs = (nodeId, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    const neighbors = adjacencyList.get(nodeId) || [];
    neighbors.forEach((neighbor) => dfs(neighbor, depth + 1));
  };
  
  startNodes.forEach((startNode) => dfs(startNode.id, 0));
  
  return maxDepth;
};

/**
 * Safe parse helpers
 */
export const safeParseFlow = (data) => {
  return flowSchema.safeParse(data);
};

export const safeParseNode = (data) => {
  return flowNodeSchema.safeParse(data);
};

export const safeParseEdge = (data) => {
  return flowEdgeSchema.safeParse(data);
};

export const safeParseCreateNode = (data) => {
  return createNodeSchema.safeParse(data);
};

export const safeParseCreateEdge = (data) => {
  return createEdgeSchema.safeParse(data);
};

/**
 * Format Zod errors for display
 */
export const formatFlowErrors = (zodError) => {
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

export const FlowSchemaTypes = {
  Position: positionSchema,
  NodeType: nodeTypeSchema,
  EdgeType: edgeTypeSchema,
  FlowNode: flowNodeSchema,
  FlowEdge: flowEdgeSchema,
  Flow: flowSchema,
  FlowSettings: flowSettingsSchema,
  CreateNode: createNodeSchema,
  CreateEdge: createEdgeSchema,
};

/**
 * Default Export
 */
export default {
  // Base schemas
  positionSchema,
  dimensionsSchema,
  colorSchema,
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
};
