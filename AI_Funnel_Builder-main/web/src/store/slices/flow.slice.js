// =============================================================================
// AI FUNNEL PLATFORM - Flow Slice
// =============================================================================
// Visual flow state: nodes, edges, selected elements, undo/redo stack
// Depends on: flow.api.js
// =============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import flowAPI from '@/lib/api/flow.api';
import { showSuccess, showError } from './ui.slice';

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_HISTORY_SIZE = 50;
const AUTO_SAVE_DELAY = 3000; // 3 seconds

// Node types
export const NODE_TYPES = {
  START: 'start',
  QUESTION: 'question',
  LOGIC: 'logic',
  RESULT: 'result',
  END: 'end',
  CONDITIONAL: 'conditional',
  ACTION: 'action',
};

// Edge types
export const EDGE_TYPES = {
  DEFAULT: 'default',
  SMOOTH: 'smoothstep',
  STEP: 'step',
  STRAIGHT: 'straight',
  ANIMATED: 'animated',
};

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // Current funnel ID
  funnelId: null,
  
  // Flow elements
  nodes: [],
  edges: [],
  
  // Viewport state
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  
  // Selection
  selectedNodes: [],
  selectedEdges: [],
  
  // History (undo/redo)
  history: {
    past: [],
    future: [],
  },
  
  // Validation
  validation: {
    isValid: true,
    errors: [],
    warnings: [],
  },
  
  // Flow metadata
  metadata: {
    nodeCount: 0,
    edgeCount: 0,
    lastModified: null,
    version: 1,
  },
  
  // Clipboard
  clipboard: {
    nodes: [],
    edges: [],
  },
  
  // Drag & drop
  dragNode: null,
  
  // Grid settings
  gridSettings: {
    snapToGrid: localStorage.getItem('flow-snap-to-grid') !== 'false',
    gridSize: 15,
  },
  
  // Loading states
  loading: {
    flow: false,
    save: false,
    validate: false,
    layout: false,
    export: false,
  },
  
  // Errors
  errors: {
    flow: null,
    save: null,
    validate: null,
    layout: null,
  },
  
  // Auto-save
  autoSave: {
    enabled: true,
    isDirty: false,
    lastSaved: null,
    pendingSave: false,
  },
  
  // Cache
  lastFetch: null,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create flow snapshot for history
 */
const createSnapshot = (state) => ({
  nodes: JSON.parse(JSON.stringify(state.nodes)),
  edges: JSON.parse(JSON.stringify(state.edges)),
  viewport: { ...state.viewport },
});

/**
 * Restore flow from snapshot
 */
const restoreSnapshot = (state, snapshot) => {
  state.nodes = snapshot.nodes;
  state.edges = snapshot.edges;
  state.viewport = snapshot.viewport;
};

/**
 * Update metadata
 */
const updateMetadata = (state) => {
  state.metadata.nodeCount = state.nodes.length;
  state.metadata.edgeCount = state.edges.length;
  state.metadata.lastModified = Date.now();
  state.metadata.version += 1;
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Load flow
 */
export const loadFlow = createAsyncThunk(
  'flow/load',
  async (funnelId, { rejectWithValue }) => {
    try {
      const response = await flowAPI.getFlow(funnelId);
      return { funnelId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Save flow
 */
export const saveFlow = createAsyncThunk(
  'flow/save',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { flow } = getState();
      
      if (!flow.funnelId) {
        throw new Error('No funnel ID provided');
      }
      
      const response = await flowAPI.saveFlow(flow.funnelId, {
        nodes: flow.nodes,
        edges: flow.edges,
        viewport: flow.viewport,
        metadata: flow.metadata,
      });
      
      dispatch(showSuccess('Flow saved successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to save flow'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Auto-save flow (debounced)
 */
export const autoSaveFlow = createAsyncThunk(
  'flow/autoSave',
  async (_, { getState, dispatch }) => {
    const { flow } = getState();
    
    if (!flow.autoSave.enabled || !flow.autoSave.isDirty) {
      return null;
    }
    
    // Use saveFlow but don't show success toast
    const response = await flowAPI.saveFlow(flow.funnelId, {
      nodes: flow.nodes,
      edges: flow.edges,
      viewport: flow.viewport,
      metadata: flow.metadata,
    });
    
    return response.data;
  }
);

/**
 * Validate flow
 */
export const validateFlow = createAsyncThunk(
  'flow/validate',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { flow } = getState();
      
      const response = await flowAPI.validateFlowData({
        nodes: flow.nodes,
        edges: flow.edges,
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Auto-layout flow
 */
export const autoLayoutFlow = createAsyncThunk(
  'flow/autoLayout',
  async ({ algorithm = 'dagre', spacing = 150 }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { flow } = getState();
      
      const response = await flowAPI.autoLayoutFlow(flow.funnelId, {
        algorithm,
        spacing,
        nodes: flow.nodes,
        edges: flow.edges,
      });
      
      dispatch(showSuccess('Layout applied'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to apply layout'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Export flow
 */
export const exportFlow = createAsyncThunk(
  'flow/export',
  async (format, { getState, dispatch, rejectWithValue }) => {
    try {
      const { flow } = getState();
      
      const response = await flowAPI.exportFlow(flow.funnelId, format);
      
      // Create download link
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flow-${flow.funnelId}-${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      
      dispatch(showSuccess('Flow exported successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to export flow'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Import flow
 */
export const importFlow = createAsyncThunk(
  'flow/import',
  async (flowData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(showSuccess('Flow imported successfully'));
      return flowData;
    } catch (error) {
      dispatch(showError('Failed to import flow'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Detect cycles in flow
 */
export const detectCycles = createAsyncThunk(
  'flow/detectCycles',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { flow } = getState();
      
      const response = await flowAPI.detectCycles({
        nodes: flow.nodes,
        edges: flow.edges,
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// =============================================================================
// SLICE
// =============================================================================

const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    setFunnelId: (state, action) => {
      state.funnelId = action.payload;
    },
    
    initializeFlow: (state, action) => {
      const { funnelId, nodes = [], edges = [], viewport = initialState.viewport } = action.payload;
      
      state.funnelId = funnelId;
      state.nodes = nodes;
      state.edges = edges;
      state.viewport = viewport;
      state.history = { past: [], future: [] };
      state.autoSave.isDirty = false;
      updateMetadata(state);
    },
    
    // =========================================================================
    // NODES
    // =========================================================================
    
    addNode: (state, action) => {
      // Save to history
      state.history.past.push(createSnapshot(state));
      if (state.history.past.length > MAX_HISTORY_SIZE) {
        state.history.past.shift();
      }
      state.history.future = [];
      
      const node = {
        id: action.payload.id || `node-${Date.now()}`,
        type: action.payload.type || NODE_TYPES.QUESTION,
        position: action.payload.position || { x: 0, y: 0 },
        data: action.payload.data || {},
        ...action.payload,
      };
      
      state.nodes.push(node);
      state.autoSave.isDirty = true;
      updateMetadata(state);
    },
    
    updateNode: (state, action) => {
      const { nodeId, updates } = action.payload;
      
      const nodeIndex = state.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex !== -1) {
        state.nodes[nodeIndex] = {
          ...state.nodes[nodeIndex],
          ...updates,
          data: {
            ...state.nodes[nodeIndex].data,
            ...updates.data,
          },
        };
        
        state.autoSave.isDirty = true;
        updateMetadata(state);
      }
    },
    
    updateNodePosition: (state, action) => {
      const { nodeId, position } = action.payload;
      
      const nodeIndex = state.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex !== -1) {
        state.nodes[nodeIndex].position = position;
        state.autoSave.isDirty = true;
      }
    },
    
    deleteNode: (state, action) => {
      // Save to history
      state.history.past.push(createSnapshot(state));
      if (state.history.past.length > MAX_HISTORY_SIZE) {
        state.history.past.shift();
      }
      state.history.future = [];
      
      const nodeId = action.payload;
      
      // Remove node
      state.nodes = state.nodes.filter(n => n.id !== nodeId);
      
      // Remove connected edges
      state.edges = state.edges.filter(
        e => e.source !== nodeId && e.target !== nodeId
      );
      
      // Remove from selection
      state.selectedNodes = state.selectedNodes.filter(id => id !== nodeId);
      
      state.autoSave.isDirty = true;
      updateMetadata(state);
    },
    
    deleteNodes: (state, action) => {
      // Save to history
      state.history.past.push(createSnapshot(state));
      if (state.history.past.length > MAX_HISTORY_SIZE) {
        state.history.past.shift();
      }
      state.history.future = [];
      
      const nodeIds = action.payload;
      
      // Remove nodes
      state.nodes = state.nodes.filter(n => !nodeIds.includes(n.id));
      
      // Remove connected edges
      state.edges = state.edges.filter(
        e => !nodeIds.includes(e.source) && !nodeIds.includes(e.target)
      );
      
      // Clear selection
      state.selectedNodes = [];
      
      state.autoSave.isDirty = true;
      updateMetadata(state);
    },
    
    duplicateNode: (state, action) => {
      // Save to history
      state.history.past.push(createSnapshot(state));
      if (state.history.past.length > MAX_HISTORY_SIZE) {
        state.history.past.shift();
      }
      state.history.future = [];
      
      const nodeId = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      
      if (node) {
        const newNode = {
          ...node,
          id: `node-${Date.now()}`,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          data: {
            ...node.data,
            label: `${node.data.label} (Copy)`,
          },
        };
        
        state.nodes.push(newNode);
        state.autoSave.isDirty = true;
        updateMetadata(state);
      }
    },
    
    setNodes: (state, action) => {
      state.nodes = action.payload;
      state.autoSave.isDirty = true;
      updateMetadata(state);
    },
    
    // =========================================================================
    // EDGES
    // =========================================================================
    
    addEdge: (state, action) => {
      // Save to history
      state.history.past.push(createSnapshot(state));
      if (state.history.past.length > MAX_HISTORY_SIZE) {
        state.history.past.shift();
      }
      state.history.future = [];
      
      const edge = {
        id: action.payload.id || `edge-${Date.now()}`,
        source: action.payload.source,
        target: action.payload.target,
        sourceHandle: action.payload.sourceHandle,
        targetHandle: action.payload.targetHandle,
        type: action.payload.type || EDGE_TYPES.SMOOTH,
        animated: action.payload.animated !== undefined ? action.payload.animated : true,
        label: action.payload.label,
        data: action.payload.data || {},
        ...action.payload,
      };
      
      state.edges.push(edge);
      state.autoSave.isDirty = true;
      updateMetadata(state);
    },
    
    updateEdge: (state, action) => {
      const { edgeId, updates } = action.payload;
      
      const edgeIndex = state.edges.findIndex(e => e.id === edgeId);
      if (edgeIndex !== -1) {
        state.edges[edgeIndex] = {
          ...state.edges[edgeIndex],
          ...updates,
        };
        
        state.autoSave.isDirty = true;
        updateMetadata(state);
      }
    },
    
    deleteEdge: (state, action) => {
      // Save to history
      state.history.past.push(createSnapshot(state));
      if (state.history.past.length > MAX_HISTORY_SIZE) {
        state.history.past.shift();
      }
      state.history.future = [];
      
      const edgeId = action.payload;
      
      state.edges = state.edges.filter(e => e.id !== edgeId);
      state.selectedEdges = state.selectedEdges.filter(id => id !== edgeId);
      
      state.autoSave.isDirty = true;
      updateMetadata(state);
    },
    
    deleteEdges: (state, action) => {
      // Save to history
      state.history.past.push(createSnapshot(state));
      if (state.history.past.length > MAX_HISTORY_SIZE) {
        state.history.past.shift();
      }
      state.history.future = [];
      
      const edgeIds = action.payload;
      
      state.edges = state.edges.filter(e => !edgeIds.includes(e.id));
      state.selectedEdges = [];
      
      state.autoSave.isDirty = true;
      updateMetadata(state);
    },
    
    setEdges: (state, action) => {
      state.edges = action.payload;
      state.autoSave.isDirty = true;
      updateMetadata(state);
    },
    
    // =========================================================================
    // SELECTION
    // =========================================================================
    
    selectNode: (state, action) => {
      const nodeId = action.payload;
      if (!state.selectedNodes.includes(nodeId)) {
        state.selectedNodes.push(nodeId);
      }
    },
    
    deselectNode: (state, action) => {
      const nodeId = action.payload;
      state.selectedNodes = state.selectedNodes.filter(id => id !== nodeId);
    },
    
    selectNodes: (state, action) => {
      state.selectedNodes = action.payload;
    },
    
    selectAllNodes: (state) => {
      state.selectedNodes = state.nodes.map(n => n.id);
    },
    
    clearNodeSelection: (state) => {
      state.selectedNodes = [];
    },
    
    selectEdge: (state, action) => {
      const edgeId = action.payload;
      if (!state.selectedEdges.includes(edgeId)) {
        state.selectedEdges.push(edgeId);
      }
    },
    
    deselectEdge: (state, action) => {
      const edgeId = action.payload;
      state.selectedEdges = state.selectedEdges.filter(id => id !== edgeId);
    },
    
    selectEdges: (state, action) => {
      state.selectedEdges = action.payload;
    },
    
    clearEdgeSelection: (state) => {
      state.selectedEdges = [];
    },
    
    clearSelection: (state) => {
      state.selectedNodes = [];
      state.selectedEdges = [];
    },
    
    // =========================================================================
    // VIEWPORT
    // =========================================================================
    
    setViewport: (state, action) => {
      state.viewport = action.payload;
      state.autoSave.isDirty = true;
    },
    
    resetViewport: (state) => {
      state.viewport = initialState.viewport;
    },
    
    // =========================================================================
    // HISTORY (UNDO/REDO)
    // =========================================================================
    
    undo: (state) => {
      if (state.history.past.length === 0) return;
      
      // Save current state to future
      state.history.future.push(createSnapshot(state));
      
      // Restore previous state
      const previousState = state.history.past.pop();
      restoreSnapshot(state, previousState);
      
      state.autoSave.isDirty = true;
      updateMetadata(state);
    },
    
    redo: (state) => {
      if (state.history.future.length === 0) return;
      
      // Save current state to past
      state.history.past.push(createSnapshot(state));
      if (state.history.past.length > MAX_HISTORY_SIZE) {
        state.history.past.shift();
      }
      
      // Restore next state
      const nextState = state.history.future.pop();
      restoreSnapshot(state, nextState);
      
      state.autoSave.isDirty = true;
      updateMetadata(state);
    },
    
    clearHistory: (state) => {
      state.history = { past: [], future: [] };
    },
    
    // =========================================================================
    // CLIPBOARD
    // =========================================================================
    
    copyToClipboard: (state) => {
      const selectedNodeIds = state.selectedNodes;
      const selectedNodes = state.nodes.filter(n => selectedNodeIds.includes(n.id));
      
      // Get edges between selected nodes
      const selectedEdges = state.edges.filter(
        e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
      );
      
      state.clipboard = {
        nodes: selectedNodes,
        edges: selectedEdges,
      };
    },
    
    pasteFromClipboard: (state) => {
      if (state.clipboard.nodes.length === 0) return;
      
      // Save to history
      state.history.past.push(createSnapshot(state));
      if (state.history.past.length > MAX_HISTORY_SIZE) {
        state.history.past.shift();
      }
      state.history.future = [];
      
      const timestamp = Date.now();
      const nodeIdMap = {};
      
      // Create new nodes with new IDs
      const newNodes = state.clipboard.nodes.map((node, index) => {
        const newId = `node-${timestamp}-${index}`;
        nodeIdMap[node.id] = newId;
        
        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
        };
      });
      
      // Create new edges with updated node IDs
      const newEdges = state.clipboard.edges.map((edge, index) => ({
        ...edge,
        id: `edge-${timestamp}-${index}`,
        source: nodeIdMap[edge.source],
        target: nodeIdMap[edge.target],
      }));
      
      state.nodes.push(...newNodes);
      state.edges.push(...newEdges);
      
      // Select pasted nodes
      state.selectedNodes = newNodes.map(n => n.id);
      state.selectedEdges = [];
      
      state.autoSave.isDirty = true;
      updateMetadata(state);
    },
    
    cutToClipboard: (state) => {
      // Copy to clipboard
      const selectedNodeIds = state.selectedNodes;
      const selectedNodes = state.nodes.filter(n => selectedNodeIds.includes(n.id));
      const selectedEdges = state.edges.filter(
        e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
      );
      
      state.clipboard = {
        nodes: selectedNodes,
        edges: selectedEdges,
      };
      
      // Save to history
      state.history.past.push(createSnapshot(state));
      if (state.history.past.length > MAX_HISTORY_SIZE) {
        state.history.past.shift();
      }
      state.history.future = [];
      
      // Delete selected elements
      state.nodes = state.nodes.filter(n => !selectedNodeIds.includes(n.id));
      state.edges = state.edges.filter(
        e => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)
      );
      
      state.selectedNodes = [];
      state.selectedEdges = [];
      
      state.autoSave.isDirty = true;
      updateMetadata(state);
    },
    
    // =========================================================================
    // GRID SETTINGS
    // =========================================================================
    
    toggleSnapToGrid: (state) => {
      state.gridSettings.snapToGrid = !state.gridSettings.snapToGrid;
      localStorage.setItem('flow-snap-to-grid', state.gridSettings.snapToGrid);
    },
    
    setGridSize: (state, action) => {
      state.gridSettings.gridSize = action.payload;
    },
    
    // =========================================================================
    // AUTO-SAVE
    // =========================================================================
    
    toggleAutoSave: (state) => {
      state.autoSave.enabled = !state.autoSave.enabled;
    },
    
    setAutoSaveEnabled: (state, action) => {
      state.autoSave.enabled = action.payload;
    },
    
    markClean: (state) => {
      state.autoSave.isDirty = false;
      state.autoSave.lastSaved = Date.now();
    },
    
    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    setValidation: (state, action) => {
      state.validation = action.payload;
    },
    
    clearValidation: (state) => {
      state.validation = initialState.validation;
    },
    
    // =========================================================================
    // DRAG & DROP
    // =========================================================================
    
    setDragNode: (state, action) => {
      state.dragNode = action.payload;
    },
    
    clearDragNode: (state) => {
      state.dragNode = null;
    },
    
    // =========================================================================
    // ERRORS
    // =========================================================================
    
    clearError: (state, action) => {
      const errorType = action.payload;
      state.errors[errorType] = null;
    },
    
    clearAllErrors: (state) => {
      state.errors = initialState.errors;
    },
    
    // =========================================================================
    // RESET
    // =========================================================================
    
    clearFlow: (state) => {
      state.nodes = [];
      state.edges = [];
      state.selectedNodes = [];
      state.selectedEdges = [];
      state.history = { past: [], future: [] };
      state.clipboard = { nodes: [], edges: [] };
      state.validation = initialState.validation;
      state.autoSave.isDirty = false;
      updateMetadata(state);
    },
    
    resetFlow: () => initialState,
  },
  
  extraReducers: (builder) => {
    // =========================================================================
    // LOAD FLOW
    // =========================================================================
    
    builder
      .addCase(loadFlow.pending, (state) => {
        state.loading.flow = true;
        state.errors.flow = null;
      })
      .addCase(loadFlow.fulfilled, (state, action) => {
        state.loading.flow = false;
        state.funnelId = action.payload.funnelId;
        state.nodes = action.payload.nodes || [];
        state.edges = action.payload.edges || [];
        state.viewport = action.payload.viewport || initialState.viewport;
        state.metadata = action.payload.metadata || initialState.metadata;
        state.history = { past: [], future: [] };
        state.autoSave.isDirty = false;
        state.lastFetch = Date.now();
        updateMetadata(state);
      })
      .addCase(loadFlow.rejected, (state, action) => {
        state.loading.flow = false;
        state.errors.flow = action.payload;
      });
    
    // =========================================================================
    // SAVE FLOW
    // =========================================================================
    
    builder
      .addCase(saveFlow.pending, (state) => {
        state.loading.save = true;
        state.errors.save = null;
        state.autoSave.pendingSave = true;
      })
      .addCase(saveFlow.fulfilled, (state) => {
        state.loading.save = false;
        state.autoSave.isDirty = false;
        state.autoSave.lastSaved = Date.now();
        state.autoSave.pendingSave = false;
      })
      .addCase(saveFlow.rejected, (state, action) => {
        state.loading.save = false;
        state.errors.save = action.payload;
        state.autoSave.pendingSave = false;
      });
    
    // =========================================================================
    // AUTO-SAVE FLOW
    // =========================================================================
    
    builder
      .addCase(autoSaveFlow.pending, (state) => {
        state.autoSave.pendingSave = true;
      })
      .addCase(autoSaveFlow.fulfilled, (state) => {
        state.autoSave.isDirty = false;
        state.autoSave.lastSaved = Date.now();
        state.autoSave.pendingSave = false;
      })
      .addCase(autoSaveFlow.rejected, (state) => {
        state.autoSave.pendingSave = false;
      });
    
    // =========================================================================
    // VALIDATE FLOW
    // =========================================================================
    
    builder
      .addCase(validateFlow.pending, (state) => {
        state.loading.validate = true;
        state.errors.validate = null;
      })
      .addCase(validateFlow.fulfilled, (state, action) => {
        state.loading.validate = false;
        state.validation = action.payload;
      })
      .addCase(validateFlow.rejected, (state, action) => {
        state.loading.validate = false;
        state.errors.validate = action.payload;
      });
    
    // =========================================================================
    // AUTO-LAYOUT
    // =========================================================================
    
    builder
      .addCase(autoLayoutFlow.pending, (state) => {
        state.loading.layout = true;
        state.errors.layout = null;
      })
      .addCase(autoLayoutFlow.fulfilled, (state, action) => {
        state.loading.layout = false;
        
        // Save to history before applying layout
        state.history.past.push(createSnapshot(state));
        if (state.history.past.length > MAX_HISTORY_SIZE) {
          state.history.past.shift();
        }
        state.history.future = [];
        
        // Apply layout
        if (action.payload.flowData) {
          state.nodes = action.payload.flowData.nodes || state.nodes;
          state.edges = action.payload.flowData.edges || state.edges;
        }
        
        state.autoSave.isDirty = true;
        updateMetadata(state);
      })
      .addCase(autoLayoutFlow.rejected, (state, action) => {
        state.loading.layout = false;
        state.errors.layout = action.payload;
      });
    
    // =========================================================================
    // EXPORT FLOW
    // =========================================================================
    
    builder
      .addCase(exportFlow.pending, (state) => {
        state.loading.export = true;
      })
      .addCase(exportFlow.fulfilled, (state) => {
        state.loading.export = false;
      })
      .addCase(exportFlow.rejected, (state) => {
        state.loading.export = false;
      });
    
    // =========================================================================
    // IMPORT FLOW
    // =========================================================================
    
    builder
      .addCase(importFlow.fulfilled, (state, action) => {
        // Save to history
        state.history.past.push(createSnapshot(state));
        if (state.history.past.length > MAX_HISTORY_SIZE) {
          state.history.past.shift();
        }
        state.history.future = [];
        
        state.nodes = action.payload.nodes || [];
        state.edges = action.payload.edges || [];
        state.viewport = action.payload.viewport || initialState.viewport;
        
        state.autoSave.isDirty = true;
        updateMetadata(state);
      });
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
  // Initialization
  setFunnelId,
  initializeFlow,
  
  // Nodes
  addNode,
  updateNode,
  updateNodePosition,
  deleteNode,
  deleteNodes,
  duplicateNode,
  setNodes,
  
  // Edges
  addEdge,
  updateEdge,
  deleteEdge,
  deleteEdges,
  setEdges,
  
  // Selection
  selectNode,
  deselectNode,
  selectAllNodes,
  clearNodeSelection,
  selectEdge,
  deselectEdge,
  clearEdgeSelection,
  clearSelection,
  
  // Viewport
  setViewport,
  resetViewport,
  
  // History
  undo,
  redo,
  clearHistory,
  
  // Clipboard
  copyToClipboard,
  pasteFromClipboard,
  cutToClipboard,
  
  // Grid
  toggleSnapToGrid,
  setGridSize,
  
  // Auto-save
  toggleAutoSave,
  setAutoSaveEnabled,
  markClean,
  
  // Validation
  setValidation,
  clearValidation,
  
  // Drag & drop
  setDragNode,
  clearDragNode,
  
  // Errors
  clearError,
  clearAllErrors,
  
  // Reset
  clearFlow,
  resetFlow,
} = flowSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

// Basic selectors
export const selectFunnelId = (state) => state.flow.funnelId;
export const selectNodes = (state) => state.flow.nodes;
export const selectEdges = (state) => state.flow.edges;
export const selectViewport = (state) => state.flow.viewport;
export const selectMetadata = (state) => state.flow.metadata;

// Node selectors
export const selectNodeCount = (state) => state.flow.nodes.length;
export const selectNodeById = (nodeId) => (state) => 
  state.flow.nodes.find(n => n.id === nodeId);

export const selectNodesByType = (nodeType) => (state) => 
  state.flow.nodes.filter(n => n.type === nodeType);

// Edge selectors
export const selectEdgeCount = (state) => state.flow.edges.length;
export const selectEdgeById = (edgeId) => (state) => 
  state.flow.edges.find(e => e.id === edgeId);

export const selectConnectedEdges = (nodeId) => (state) =>
  state.flow.edges.filter(e => e.source === nodeId || e.target === nodeId);

export const selectIncomingEdges = (nodeId) => (state) =>
  state.flow.edges.filter(e => e.target === nodeId);

export const selectOutgoingEdges = (nodeId) => (state) =>
  state.flow.edges.filter(e => e.source === nodeId);

// Selection
export const selectSelectedNodes = (state) => state.flow.selectedNodes;
export const selectSelectedEdges = (state) => state.flow.selectedEdges;
export const selectSelectedNodeCount = (state) => state.flow.selectedNodes.length;
export const selectSelectedEdgeCount = (state) => state.flow.selectedEdges.length;
export const selectHasSelection = (state) => 
  state.flow.selectedNodes.length > 0 || state.flow.selectedEdges.length > 0;

export const selectIsNodeSelected = (nodeId) => (state) =>
  state.flow.selectedNodes.includes(nodeId);

export const selectIsEdgeSelected = (edgeId) => (state) =>
  state.flow.selectedEdges.includes(edgeId);

// History
export const selectHistory = (state) => state.flow.history;
export const selectCanUndo = (state) => state.flow.history.past.length > 0;
export const selectCanRedo = (state) => state.flow.history.future.length > 0;

// Clipboard
export const selectClipboard = (state) => state.flow.clipboard;
export const selectHasClipboardData = (state) => 
  state.flow.clipboard.nodes.length > 0;

// Grid
export const selectGridSettings = (state) => state.flow.gridSettings;
export const selectSnapToGrid = (state) => state.flow.gridSettings.snapToGrid;
export const selectGridSize = (state) => state.flow.gridSettings.gridSize;

// Auto-save
export const selectAutoSave = (state) => state.flow.autoSave;
export const selectIsAutoSaveEnabled = (state) => state.flow.autoSave.enabled;
export const selectIsDirty = (state) => state.flow.autoSave.isDirty;
export const selectLastSaved = (state) => state.flow.autoSave.lastSaved;
export const selectIsPendingSave = (state) => state.flow.autoSave.pendingSave;

// Validation
export const selectValidation = (state) => state.flow.validation;
export const selectIsFlowValid = (state) => state.flow.validation.isValid;
export const selectValidationErrors = (state) => state.flow.validation.errors;
export const selectValidationWarnings = (state) => state.flow.validation.warnings;

// Loading states
export const selectFlowLoading = (state) => state.flow.loading;
export const selectIsFlowLoading = (state) => state.flow.loading.flow;
export const selectIsFlowSaving = (state) => state.flow.loading.save;
export const selectIsValidating = (state) => state.flow.loading.validate;
export const selectIsLayouting = (state) => state.flow.loading.layout;

// Errors
export const selectFlowErrors = (state) => state.flow.errors;
export const selectFlowError = (state) => state.flow.errors.flow;

// Drag & drop
export const selectDragNode = (state) => state.flow.dragNode;

// Computed selectors
export const selectFlowStats = (state) => ({
  nodeCount: state.flow.nodes.length,
  edgeCount: state.flow.edges.length,
  selectedNodes: state.flow.selectedNodes.length,
  selectedEdges: state.flow.selectedEdges.length,
  canUndo: state.flow.history.past.length > 0,
  canRedo: state.flow.history.future.length > 0,
  isDirty: state.flow.autoSave.isDirty,
  isValid: state.flow.validation.isValid,
});

export const selectNodeTypes = (state) => {
  const types = {};
  state.flow.nodes.forEach(node => {
    types[node.type] = (types[node.type] || 0) + 1;
  });
  return types;
};

export const selectIsFlowEmpty = (state) => 
  state.flow.nodes.length === 0 && state.flow.edges.length === 0;

// =============================================================================
// THUNK HELPERS
// =============================================================================

/**
 * Delete selected elements
 */
export const deleteSelected = () => (dispatch, getState) => {
  const state = getState();
  const selectedNodes = selectSelectedNodes(state);
  const selectedEdges = selectSelectedEdges(state);
  
  if (selectedNodes.length > 0) {
    dispatch(deleteNodes(selectedNodes));
  }
  
  if (selectedEdges.length > 0) {
    dispatch(deleteEdges(selectedEdges));
  }
};

/**
 * Save flow if dirty
 */
export const saveFlowIfDirty = () => (dispatch, getState) => {
  const state = getState();
  const isDirty = selectIsDirty(state);
  
  if (isDirty) {
    return dispatch(saveFlow());
  }
  
  return Promise.resolve();
};

// =============================================================================
// REDUCER
// =============================================================================

export default flowSlice.reducer;
