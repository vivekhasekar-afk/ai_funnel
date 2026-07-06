// =============================================================================
// AI FUNNEL PLATFORM - Groups Slice
// =============================================================================
// Funnel groups state management (collections/campaigns)
// Uses: groups.api.js
// Dependencies: ui.slice.js (notifications), projects.slice.js (project context)
// =============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import groupsAPI from '@/lib/api/groups.api';
import { showSuccess, showError } from './ui.slice';

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // Groups data
  groups: [],
  groupsById: {},
  
  // Current/active group
  activeGroupId: null,
  activeGroup: null,
  
  // Filters and sorting
  filters: {
    projectId: null,
    status: 'all', // 'all', 'active', 'paused', 'archived'
    search: '',
  },
  
  sortBy: 'updatedAt', // 'name', 'createdAt', 'updatedAt', 'funnelCount'
  sortOrder: 'desc', // 'asc', 'desc'
  
  // Pagination
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  
  // Loading states
  isLoading: false,
  isFetching: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  
  // Operation tracking
  operationLoading: {},
  
  // Error state
  error: null,
  
  // Stats cache
  statsCache: {},
  
  // AI context cache
  aiContextCache: {},
  
  // Last fetch timestamp
  lastFetch: null,
  
  // Selection (for bulk operations)
  selectedGroupIds: [],
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Fetch groups for a project
 */
export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async ({ projectId, params = {} }, { getState, rejectWithValue }) => {
    try {
      const { groups: state } = getState();
      
      const response = await groupsAPI.getGroupsByProject(projectId, {
        page: state.pagination.page,
        limit: state.pagination.limit,
        search: state.filters.search,
        status: state.filters.status !== 'all' ? state.filters.status : undefined,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        ...params,
      });
      
      return {
        groups: response.data.groups,
        pagination: response.data.pagination,
        projectId,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch groups';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Fetch single group by ID
 */
export const fetchGroupById = createAsyncThunk(
  'groups/fetchGroupById',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.getGroupById(groupId);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch group';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Create new group
 */
export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async ({ projectId, data }, { rejectWithValue, dispatch }) => {
    try {
      const response = await groupsAPI.createGroup(projectId, data);
      
      dispatch(showSuccess(`Group "${data.name}" created successfully!`));
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create group';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Update group
 */
export const updateGroup = createAsyncThunk(
  'groups/updateGroup',
  async ({ groupId, data }, { rejectWithValue, dispatch }) => {
    try {
      const response = await groupsAPI.updateGroup(groupId, data);
      
      dispatch(showSuccess('Group updated successfully!'));
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update group';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Delete group
 */
export const deleteGroup = createAsyncThunk(
  'groups/deleteGroup',
  async (groupId, { rejectWithValue, dispatch }) => {
    try {
      await groupsAPI.deleteGroup(groupId);
      
      dispatch(showSuccess('Group deleted successfully'));
      
      return groupId;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete group';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Clone group
 */
export const cloneGroup = createAsyncThunk(
  'groups/cloneGroup',
  async ({ groupId, name }, { rejectWithValue, dispatch }) => {
    try {
      const response = await groupsAPI.cloneGroup(groupId, { name });
      
      dispatch(showSuccess(`Group cloned as "${name}"!`));
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to clone group';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Activate group
 */
export const activateGroup = createAsyncThunk(
  'groups/activateGroup',
  async (groupId, { rejectWithValue, dispatch }) => {
    try {
      const response = await groupsAPI.activateGroup(groupId);
      
      dispatch(showSuccess('Group activated!'));
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to activate group';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Pause group
 */
export const pauseGroup = createAsyncThunk(
  'groups/pauseGroup',
  async (groupId, { rejectWithValue, dispatch }) => {
    try {
      const response = await groupsAPI.pauseGroup(groupId);
      
      dispatch(showSuccess('Group paused'));
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to pause group';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Archive group
 */
export const archiveGroup = createAsyncThunk(
  'groups/archiveGroup',
  async (groupId, { rejectWithValue, dispatch }) => {
    try {
      const response = await groupsAPI.archiveGroup(groupId);
      
      dispatch(showSuccess('Group archived'));
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to archive group';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Restore group
 */
export const restoreGroup = createAsyncThunk(
  'groups/restoreGroup',
  async (groupId, { rejectWithValue, dispatch }) => {
    try {
      const response = await groupsAPI.restoreGroup(groupId);
      
      dispatch(showSuccess('Group restored!'));
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to restore group';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Fetch group stats
 */
export const fetchGroupStats = createAsyncThunk(
  'groups/fetchGroupStats',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.getGroupStats(groupId);
      
      return {
        groupId,
        stats: response.data,
      };
    } catch (error) {
      return rejectWithValue('Failed to fetch group stats');
    }
  }
);

/**
 * Refresh group stats
 */
export const refreshGroupStats = createAsyncThunk(
  'groups/refreshGroupStats',
  async (groupId, { rejectWithValue, dispatch }) => {
    try {
      const response = await groupsAPI.refreshGroupStats(groupId);
      
      dispatch(showSuccess('Stats refreshed!'));
      
      return {
        groupId,
        stats: response.data,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to refresh stats';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Fetch AI context
 */
export const fetchAIContext = createAsyncThunk(
  'groups/fetchAIContext',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await groupsAPI.getAIContext(groupId);
      
      return {
        groupId,
        context: response.data,
      };
    } catch (error) {
      return rejectWithValue('Failed to fetch AI context');
    }
  }
);

/**
 * Refresh AI context
 */
export const refreshAIContext = createAsyncThunk(
  'groups/refreshAIContext',
  async (groupId, { rejectWithValue, dispatch }) => {
    try {
      const response = await groupsAPI.refreshAIContext(groupId);
      
      dispatch(showSuccess('AI context refreshed!'));
      
      return {
        groupId,
        context: response.data,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to refresh AI context';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Bulk delete groups
 */
export const bulkDeleteGroups = createAsyncThunk(
  'groups/bulkDeleteGroups',
  async (groupIds, { rejectWithValue, dispatch }) => {
    try {
      await Promise.all(groupIds.map(id => groupsAPI.deleteGroup(id)));
      
      dispatch(showSuccess(`${groupIds.length} groups deleted`));
      
      return groupIds;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete groups';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Bulk archive groups
 */
export const bulkArchiveGroups = createAsyncThunk(
  'groups/bulkArchiveGroups',
  async (groupIds, { rejectWithValue, dispatch }) => {
    try {
      await Promise.all(groupIds.map(id => groupsAPI.archiveGroup(id)));
      
      dispatch(showSuccess(`${groupIds.length} groups archived`));
      
      return groupIds;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to archive groups';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

// =============================================================================
// SLICE
// =============================================================================

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    // =========================================================================
    // ACTIVE GROUP
    // =========================================================================
    
    setActiveGroup: (state, action) => {
      const groupId = action.payload;
      state.activeGroupId = groupId;
      state.activeGroup = groupId ? state.groupsById[groupId] || null : null;
    },
    
    clearActiveGroup: (state) => {
      state.activeGroupId = null;
      state.activeGroup = null;
    },
    
    // =========================================================================
    // FILTERS
    // =========================================================================
    
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
      state.pagination.page = 1; // Reset to first page
    },
    
    setProjectFilter: (state, action) => {
      state.filters.projectId = action.payload;
      state.pagination.page = 1;
    },
    
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
      state.pagination.page = 1;
    },
    
    setSearchFilter: (state, action) => {
      state.filters.search = action.payload;
      state.pagination.page = 1;
    },
    
    clearFilters: (state) => {
      state.filters = {
        projectId: state.filters.projectId, // Keep project filter
        status: 'all',
        search: '',
      };
      state.pagination.page = 1;
    },
    
    // =========================================================================
    // SORTING
    // =========================================================================
    
    setSorting: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      state.sortBy = sortBy;
      state.sortOrder = sortOrder;
      state.pagination.page = 1;
    },
    
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    
    // =========================================================================
    // PAGINATION
    // =========================================================================
    
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    
    nextPage: (state) => {
      if (state.pagination.page < state.pagination.totalPages) {
        state.pagination.page += 1;
      }
    },
    
    previousPage: (state) => {
      if (state.pagination.page > 1) {
        state.pagination.page -= 1;
      }
    },
    
    // =========================================================================
    // SELECTION
    // =========================================================================
    
    selectGroup: (state, action) => {
      const groupId = action.payload;
      if (!state.selectedGroupIds.includes(groupId)) {
        state.selectedGroupIds.push(groupId);
      }
    },
    
    deselectGroup: (state, action) => {
      state.selectedGroupIds = state.selectedGroupIds.filter(
        id => id !== action.payload
      );
    },
    
    toggleGroupSelection: (state, action) => {
      const groupId = action.payload;
      if (state.selectedGroupIds.includes(groupId)) {
        state.selectedGroupIds = state.selectedGroupIds.filter(id => id !== groupId);
      } else {
        state.selectedGroupIds.push(groupId);
      }
    },
    
    selectAllGroups: (state) => {
      state.selectedGroupIds = state.groups.map(g => g.id);
    },
    
    deselectAllGroups: (state) => {
      state.selectedGroupIds = [];
    },
    
    // =========================================================================
    // LOCAL UPDATES
    // =========================================================================
    
    updateGroupLocally: (state, action) => {
      const { groupId, updates } = action.payload;
      
      if (state.groupsById[groupId]) {
        state.groupsById[groupId] = {
          ...state.groupsById[groupId],
          ...updates,
        };
        
        // Update in array
        const index = state.groups.findIndex(g => g.id === groupId);
        if (index !== -1) {
          state.groups[index] = state.groupsById[groupId];
        }
        
        // Update active group if needed
        if (state.activeGroupId === groupId) {
          state.activeGroup = state.groupsById[groupId];
        }
      }
    },
    
    // =========================================================================
    // CACHE
    // =========================================================================
    
    clearStatsCache: (state, action) => {
      if (action.payload) {
        delete state.statsCache[action.payload];
      } else {
        state.statsCache = {};
      }
    },
    
    clearAIContextCache: (state, action) => {
      if (action.payload) {
        delete state.aiContextCache[action.payload];
      } else {
        state.aiContextCache = {};
      }
    },
    
    // =========================================================================
    // ERROR
    // =========================================================================
    
    clearError: (state) => {
      state.error = null;
    },
    
    // =========================================================================
    // RESET
    // =========================================================================
    
    resetGroups: () => initialState,
  },
  
  extraReducers: (builder) => {
    // =========================================================================
    // FETCH GROUPS
    // =========================================================================
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.isLoading = state.groups.length === 0;
        state.isFetching = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isFetching = false;
        
        const { groups, pagination } = action.payload;
        
        state.groups = groups;
        state.groupsById = groups.reduce((acc, group) => {
          acc[group.id] = group;
          return acc;
        }, {});
        
        state.pagination = {
          ...state.pagination,
          ...pagination,
        };
        
        state.lastFetch = Date.now();
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.isFetching = false;
        state.error = action.payload;
      });
    
    // =========================================================================
    // FETCH GROUP BY ID
    // =========================================================================
    builder
      .addCase(fetchGroupById.pending, (state, action) => {
        state.operationLoading[action.meta.arg] = true;
      })
      .addCase(fetchGroupById.fulfilled, (state, action) => {
        const group = action.payload;
        
        state.groupsById[group.id] = group;
        
        // Update in array if exists
        const index = state.groups.findIndex(g => g.id === group.id);
        if (index !== -1) {
          state.groups[index] = group;
        } else {
          state.groups.push(group);
        }
        
        // Update active group if it's the one being fetched
        if (state.activeGroupId === group.id) {
          state.activeGroup = group;
        }
        
        delete state.operationLoading[group.id];
      })
      .addCase(fetchGroupById.rejected, (state, action) => {
        delete state.operationLoading[action.meta.arg];
        state.error = action.payload;
      });
    
    // =========================================================================
    // CREATE GROUP
    // =========================================================================
    builder
      .addCase(createGroup.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.isCreating = false;
        
        const newGroup = action.payload;
        
        state.groups.unshift(newGroup);
        state.groupsById[newGroup.id] = newGroup;
        state.pagination.total += 1;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      });
    
    // =========================================================================
    // UPDATE GROUP
    // =========================================================================
    builder
      .addCase(updateGroup.pending, (state, action) => {
        state.isUpdating = true;
        state.operationLoading[action.meta.arg.groupId] = true;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.isUpdating = false;
        
        const updatedGroup = action.payload;
        
        state.groupsById[updatedGroup.id] = updatedGroup;
        
        const index = state.groups.findIndex(g => g.id === updatedGroup.id);
        if (index !== -1) {
          state.groups[index] = updatedGroup;
        }
        
        if (state.activeGroupId === updatedGroup.id) {
          state.activeGroup = updatedGroup;
        }
        
        delete state.operationLoading[updatedGroup.id];
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.isUpdating = false;
        delete state.operationLoading[action.meta.arg.groupId];
        state.error = action.payload;
      });
    
    // =========================================================================
    // DELETE GROUP
    // =========================================================================
    builder
      .addCase(deleteGroup.pending, (state, action) => {
        state.isDeleting = true;
        state.operationLoading[action.meta.arg] = true;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.isDeleting = false;
        
        const groupId = action.payload;
        
        state.groups = state.groups.filter(g => g.id !== groupId);
        delete state.groupsById[groupId];
        
        if (state.activeGroupId === groupId) {
          state.activeGroupId = null;
          state.activeGroup = null;
        }
        
        state.selectedGroupIds = state.selectedGroupIds.filter(id => id !== groupId);
        
        delete state.operationLoading[groupId];
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.isDeleting = false;
        delete state.operationLoading[action.meta.arg];
        state.error = action.payload;
      });
    
    // =========================================================================
    // CLONE GROUP
    // =========================================================================
    builder
      .addCase(cloneGroup.pending, (state, action) => {
        state.operationLoading[action.meta.arg.groupId] = true;
      })
      .addCase(cloneGroup.fulfilled, (state, action) => {
        const clonedGroup = action.payload;
        
        state.groups.unshift(clonedGroup);
        state.groupsById[clonedGroup.id] = clonedGroup;
        state.pagination.total += 1;
        
        delete state.operationLoading[action.meta.arg.groupId];
      })
      .addCase(cloneGroup.rejected, (state, action) => {
        delete state.operationLoading[action.meta.arg.groupId];
        state.error = action.payload;
      });
    
    // =========================================================================
    // STATUS CHANGES (Activate, Pause, Archive, Restore)
    // =========================================================================
    builder
      .addCase(activateGroup.fulfilled, (state, action) => {
        const group = action.payload;
        state.groupsById[group.id] = group;
        
        const index = state.groups.findIndex(g => g.id === group.id);
        if (index !== -1) {
          state.groups[index] = group;
        }
        
        if (state.activeGroupId === group.id) {
          state.activeGroup = group;
        }
      })
      .addCase(pauseGroup.fulfilled, (state, action) => {
        const group = action.payload;
        state.groupsById[group.id] = group;
        
        const index = state.groups.findIndex(g => g.id === group.id);
        if (index !== -1) {
          state.groups[index] = group;
        }
        
        if (state.activeGroupId === group.id) {
          state.activeGroup = group;
        }
      })
      .addCase(archiveGroup.fulfilled, (state, action) => {
        const group = action.payload;
        
        // Remove from list if not showing archived
        if (state.filters.status !== 'archived' && state.filters.status !== 'all') {
          state.groups = state.groups.filter(g => g.id !== group.id);
        } else {
          state.groupsById[group.id] = group;
          const index = state.groups.findIndex(g => g.id === group.id);
          if (index !== -1) {
            state.groups[index] = group;
          }
        }
      })
      .addCase(restoreGroup.fulfilled, (state, action) => {
        const group = action.payload;
        state.groupsById[group.id] = group;
        
        const index = state.groups.findIndex(g => g.id === group.id);
        if (index !== -1) {
          state.groups[index] = group;
        } else {
          state.groups.unshift(group);
        }
      });
    
    // =========================================================================
    // FETCH GROUP STATS
    // =========================================================================
    builder
      .addCase(fetchGroupStats.fulfilled, (state, action) => {
        const { groupId, stats } = action.payload;
        state.statsCache[groupId] = stats;
      })
      .addCase(refreshGroupStats.fulfilled, (state, action) => {
        const { groupId, stats } = action.payload;
        state.statsCache[groupId] = stats;
      });
    
    // =========================================================================
    // FETCH AI CONTEXT
    // =========================================================================
    builder
      .addCase(fetchAIContext.fulfilled, (state, action) => {
        const { groupId, context } = action.payload;
        state.aiContextCache[groupId] = context;
      })
      .addCase(refreshAIContext.fulfilled, (state, action) => {
        const { groupId, context } = action.payload;
        state.aiContextCache[groupId] = context;
      });
    
    // =========================================================================
    // BULK OPERATIONS
    // =========================================================================
    builder
      .addCase(bulkDeleteGroups.fulfilled, (state, action) => {
        const groupIds = action.payload;
        
        state.groups = state.groups.filter(g => !groupIds.includes(g.id));
        
        groupIds.forEach(id => {
          delete state.groupsById[id];
        });
        
        state.selectedGroupIds = [];
        state.pagination.total = Math.max(0, state.pagination.total - groupIds.length);
      })
      .addCase(bulkArchiveGroups.fulfilled, (state, action) => {
        const groupIds = action.payload;
        
        if (state.filters.status !== 'archived' && state.filters.status !== 'all') {
          state.groups = state.groups.filter(g => !groupIds.includes(g.id));
        }
        
        state.selectedGroupIds = [];
      });
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
  // Active group
  setActiveGroup,
  clearActiveGroup,
  
  // Filters
  setFilters,
  setProjectFilter,
  setStatusFilter,
  setSearchFilter,
  clearFilters,
  
  // Sorting
  setSorting,
  toggleSortOrder,
  
  // Pagination
  setPage,
  setLimit,
  nextPage,
  previousPage,
  
  // Selection
  selectGroup,
  deselectGroup,
  toggleGroupSelection,
  selectAllGroups,
  deselectAllGroups,
  
  // Local updates
  updateGroupLocally,
  
  // Cache
  clearStatsCache,
  clearAIContextCache,
  
  // Error
  clearError,
  
  // Reset
  resetGroups,
} = groupsSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

// Groups data
export const selectGroups = (state) => state.groups.groups;
export const selectGroupsById = (state) => state.groups.groupsById;
export const selectGroupById = (groupId) => (state) => state.groups.groupsById[groupId];

// Active group
export const selectActiveGroupId = (state) => state.groups.activeGroupId;
export const selectActiveGroup = (state) => state.groups.activeGroup;

// Filters
export const selectFilters = (state) => state.groups.filters;
export const selectProjectFilter = (state) => state.groups.filters.projectId;
export const selectStatusFilter = (state) => state.groups.filters.status;
export const selectSearchFilter = (state) => state.groups.filters.search;

// Sorting
export const selectSortBy = (state) => state.groups.sortBy;
export const selectSortOrder = (state) => state.groups.sortOrder;

// Pagination
export const selectPagination = (state) => state.groups.pagination;
export const selectCurrentPage = (state) => state.groups.pagination.page;
export const selectTotalGroups = (state) => state.groups.pagination.total;

// Loading
export const selectGroupsLoading = (state) => state.groups.isLoading;
export const selectGroupsFetching = (state) => state.groups.isFetching;
export const selectGroupCreating = (state) => state.groups.isCreating;
export const selectGroupUpdating = (state) => state.groups.isUpdating;
export const selectGroupDeleting = (state) => state.groups.isDeleting;
export const selectGroupOperationLoading = (groupId) => (state) => 
  state.groups.operationLoading[groupId] || false;

// Error
export const selectGroupsError = (state) => state.groups.error;

// Selection
export const selectSelectedGroupIds = (state) => state.groups.selectedGroupIds;
export const selectHasSelectedGroups = (state) => state.groups.selectedGroupIds.length > 0;
export const selectSelectedGroupsCount = (state) => state.groups.selectedGroupIds.length;

// Cache
export const selectGroupStats = (groupId) => (state) => state.groups.statsCache[groupId];
export const selectGroupAIContext = (groupId) => (state) => state.groups.aiContextCache[groupId];

// Computed
export const selectFilteredGroups = (state) => {
  let filtered = state.groups.groups;
  
  // Apply search
  if (state.groups.filters.search) {
    const search = state.groups.filters.search.toLowerCase();
    filtered = filtered.filter(group => 
      group.name.toLowerCase().includes(search) ||
      group.description?.toLowerCase().includes(search)
    );
  }
  
  return filtered;
};

export const selectGroupsByProject = (projectId) => (state) => {
  return state.groups.groups.filter(group => group.projectId === projectId);
};

export const selectHasGroups = (state) => state.groups.groups.length > 0;

export const selectLastFetch = (state) => state.groups.lastFetch;

export const selectNeedsRefresh = (state) => {
  if (!state.groups.lastFetch) return true;
  
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() - state.groups.lastFetch > fiveMinutes;
};

// =============================================================================
// REDUCER
// =============================================================================

export default groupsSlice.reducer;
