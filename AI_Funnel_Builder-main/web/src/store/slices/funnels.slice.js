// =============================================================================
// AI FUNNEL PLATFORM - Funnels Slice
// =============================================================================
// Funnels state management: list, active funnel, CRUD, publish/clone operations
// Depends on: funnels.api.js
// =============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import funnelsAPI from '@/lib/api/funnels.api';
import { showSuccess, showError } from './ui.slice';

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // Funnels list
  items: [],
  
  // Active/selected funnel
  activeFunnel: localStorage.getItem('active-funnel-id') || null,
  
  // Current funnel details
  currentFunnel: null,
  
  // Funnel layout (questions, sections)
  layout: null,
  
  // Funnel theme
  theme: null,
  
  // Funnel SEO settings
  seo: null,
  
  // Pagination
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  
  // Filters
  filters: {
    search: '',
    status: 'all', // 'all', 'draft', 'published', 'paused', 'archived'
    groupId: null,
    projectId: null,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  },
  
  // Statistics
  stats: {
    total: 0,
    draft: 0,
    published: 0,
    paused: 0,
    archived: 0,
  },
  
  // Bulk selection
  selectedFunnels: [],
  
  // Loading states
  loading: {
    list: false,
    current: false,
    layout: false,
    theme: false,
    seo: false,
    create: false,
    update: false,
    delete: false,
    publish: false,
    clone: false,
    bulkMove: false,
    stats: false,
  },
  
  // Errors
  errors: {
    list: null,
    current: null,
    layout: null,
    theme: null,
    seo: null,
    create: null,
    update: null,
    delete: null,
  },
  
  // Cache metadata
  lastFetch: null,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Fetch funnels list
 */
export const fetchFunnels = createAsyncThunk(
  'funnels/fetchList',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { filters, pagination } = getState().funnels;
      
      const response = await funnelsAPI.getFunnels({
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        search: params.search !== undefined ? params.search : filters.search,
        status: params.status || filters.status,
        groupId: params.groupId !== undefined ? params.groupId : filters.groupId,
        projectId: params.projectId !== undefined ? params.projectId : filters.projectId,
        sortBy: params.sortBy || filters.sortBy,
        sortOrder: params.sortOrder || filters.sortOrder,
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Fetch single funnel by ID
 */
export const fetchFunnelById = createAsyncThunk(
  'funnels/fetchById',
  async (funnelId, { rejectWithValue }) => {
    try {
      const response = await funnelsAPI.getFunnel(funnelId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Fetch funnel layout
 */
export const fetchFunnelLayout = createAsyncThunk(
  'funnels/fetchLayout',
  async (funnelId, { rejectWithValue }) => {
    try {
      const response = await funnelsAPI.getFunnelLayout(funnelId);
      return { funnelId, layout: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Update funnel layout
 */
export const updateFunnelLayout = createAsyncThunk(
  'funnels/updateLayout',
  async ({ funnelId, layout }, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.updateFunnelLayout(funnelId, layout);
      dispatch(showSuccess('Layout updated successfully'));
      return { funnelId, layout: response.data };
    } catch (error) {
      dispatch(showError('Failed to update layout'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Fetch funnel theme
 */
export const fetchFunnelTheme = createAsyncThunk(
  'funnels/fetchTheme',
  async (funnelId, { rejectWithValue }) => {
    try {
      const response = await funnelsAPI.getFunnelTheme(funnelId);
      return { funnelId, theme: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Update funnel theme
 */
export const updateFunnelTheme = createAsyncThunk(
  'funnels/updateTheme',
  async ({ funnelId, theme }, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.updateFunnelTheme(funnelId, theme);
      dispatch(showSuccess('Theme updated successfully'));
      return { funnelId, theme: response.data };
    } catch (error) {
      dispatch(showError('Failed to update theme'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Fetch funnel SEO
 */
export const fetchFunnelSEO = createAsyncThunk(
  'funnels/fetchSEO',
  async (funnelId, { rejectWithValue }) => {
    try {
      const response = await funnelsAPI.getFunnelSEO(funnelId);
      return { funnelId, seo: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Update funnel SEO
 */
export const updateFunnelSEO = createAsyncThunk(
  'funnels/updateSEO',
  async ({ funnelId, seo }, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.updateFunnelSEO(funnelId, seo);
      dispatch(showSuccess('SEO settings updated'));
      return { funnelId, seo: response.data };
    } catch (error) {
      dispatch(showError('Failed to update SEO settings'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Create new funnel
 */
export const createFunnel = createAsyncThunk(
  'funnels/create',
  async (funnelData, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.createFunnel(funnelData);
      dispatch(showSuccess('Funnel created successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to create funnel'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Create funnel from template
 */
export const createFunnelFromTemplate = createAsyncThunk(
  'funnels/createFromTemplate',
  async ({ templateId, customizations }, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.createFromTemplate(templateId, customizations);
      dispatch(showSuccess('Funnel created from template'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to create funnel from template'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Update funnel
 */
export const updateFunnel = createAsyncThunk(
  'funnels/update',
  async ({ funnelId, updates }, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.updateFunnel(funnelId, updates);
      dispatch(showSuccess('Funnel updated successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to update funnel'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Delete funnel
 */
export const deleteFunnel = createAsyncThunk(
  'funnels/delete',
  async (funnelId, { dispatch, rejectWithValue }) => {
    try {
      await funnelsAPI.deleteFunnel(funnelId);
      dispatch(showSuccess('Funnel deleted successfully'));
      return funnelId;
    } catch (error) {
      dispatch(showError('Failed to delete funnel'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Clone funnel
 */
export const cloneFunnel = createAsyncThunk(
  'funnels/clone',
  async ({ funnelId, name, groupId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.cloneFunnel(funnelId, { name, groupId });
      dispatch(showSuccess('Funnel cloned successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to clone funnel'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Publish funnel
 */
export const publishFunnel = createAsyncThunk(
  'funnels/publish',
  async (funnelId, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.publishFunnel(funnelId);
      dispatch(showSuccess('Funnel published successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to publish funnel'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Unpublish funnel
 */
export const unpublishFunnel = createAsyncThunk(
  'funnels/unpublish',
  async (funnelId, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.unpublishFunnel(funnelId);
      dispatch(showSuccess('Funnel unpublished'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to unpublish funnel'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Pause funnel
 */
export const pauseFunnel = createAsyncThunk(
  'funnels/pause',
  async (funnelId, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.pauseFunnel(funnelId);
      dispatch(showSuccess('Funnel paused'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to pause funnel'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Archive funnel
 */
export const archiveFunnel = createAsyncThunk(
  'funnels/archive',
  async (funnelId, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.archiveFunnel(funnelId);
      dispatch(showSuccess('Funnel archived'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to archive funnel'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Bulk move funnels
 */
export const bulkMoveFunnels = createAsyncThunk(
  'funnels/bulkMove',
  async ({ funnelIds, groupId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.bulkMoveFunnels({ funnelIds, groupId });
      dispatch(showSuccess(`${funnelIds.length} funnel(s) moved successfully`));
      return { funnelIds, groupId };
    } catch (error) {
      dispatch(showError('Failed to move funnels'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Fetch funnel statistics
 */
export const fetchFunnelStats = createAsyncThunk(
  'funnels/fetchStats',
  async (funnelId, { rejectWithValue }) => {
    try {
      const response = await funnelsAPI.getFunnelStats(funnelId);
      return { funnelId, stats: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Get funnel preview URL
 */
export const getFunnelPreviewUrl = createAsyncThunk(
  'funnels/getPreviewUrl',
  async (funnelId, { rejectWithValue }) => {
    try {
      const response = await funnelsAPI.getPreviewUrl(funnelId);
      return { funnelId, previewUrl: response.data.url };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Create A/B test
 */
export const createABTest = createAsyncThunk(
  'funnels/createABTest',
  async ({ funnelId, variantData }, { dispatch, rejectWithValue }) => {
    try {
      const response = await funnelsAPI.createABTest(funnelId, variantData);
      dispatch(showSuccess('A/B test created'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to create A/B test'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Get A/B test results
 */
export const getABTestResults = createAsyncThunk(
  'funnels/getABTestResults',
  async (funnelId, { rejectWithValue }) => {
    try {
      const response = await funnelsAPI.getABTestResults(funnelId);
      return { funnelId, results: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// =============================================================================
// SLICE
// =============================================================================

const funnelsSlice = createSlice({
  name: 'funnels',
  initialState,
  reducers: {
    // =========================================================================
    // ACTIVE FUNNEL
    // =========================================================================
    
    setActiveFunnel: (state, action) => {
      state.activeFunnel = action.payload;
      if (action.payload) {
        localStorage.setItem('active-funnel-id', action.payload);
      } else {
        localStorage.removeItem('active-funnel-id');
      }
    },
    
    clearActiveFunnel: (state) => {
      state.activeFunnel = null;
      state.currentFunnel = null;
      state.layout = null;
      state.theme = null;
      state.seo = null;
      localStorage.removeItem('active-funnel-id');
    },
    
    // =========================================================================
    // FILTERS
    // =========================================================================
    
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
      
      // Reset to first page when filters change
      if (key !== 'sortBy' && key !== 'sortOrder') {
        state.pagination.page = 1;
      }
    },
    
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
      state.pagination.page = 1;
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    
    setSearchQuery: (state, action) => {
      state.filters.search = action.payload;
      state.pagination.page = 1;
    },
    
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
      state.pagination.page = 1;
    },
    
    setGroupFilter: (state, action) => {
      state.filters.groupId = action.payload;
      state.pagination.page = 1;
    },
    
    setProjectFilter: (state, action) => {
      state.filters.projectId = action.payload;
      state.pagination.page = 1;
    },
    
    // =========================================================================
    // SORTING
    // =========================================================================
    
    setSorting: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      state.filters.sortBy = sortBy;
      state.filters.sortOrder = sortOrder || 'desc';
    },
    
    toggleSortOrder: (state) => {
      state.filters.sortOrder = state.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    
    // =========================================================================
    // PAGINATION
    // =========================================================================
    
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    
    setPageSize: (state, action) => {
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
    
    toggleFunnelSelection: (state, action) => {
      const funnelId = action.payload;
      const index = state.selectedFunnels.indexOf(funnelId);
      
      if (index > -1) {
        state.selectedFunnels.splice(index, 1);
      } else {
        state.selectedFunnels.push(funnelId);
      }
    },
    
    selectAllFunnels: (state) => {
      state.selectedFunnels = state.items.map(f => f.id);
    },
    
    deselectAllFunnels: (state) => {
      state.selectedFunnels = [];
    },
    
    selectFunnels: (state, action) => {
      state.selectedFunnels = action.payload;
    },
    
    // =========================================================================
    // LOCAL UPDATES
    // =========================================================================
    
    updateFunnelInList: (state, action) => {
      const { funnelId, updates } = action.payload;
      const index = state.items.findIndex(f => f.id === funnelId);
      
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...updates,
        };
      }
      
      // Update current funnel if it matches
      if (state.currentFunnel?.id === funnelId) {
        state.currentFunnel = {
          ...state.currentFunnel,
          ...updates,
        };
      }
    },
    
    removeFunnelFromList: (state, action) => {
      const funnelId = action.payload;
      state.items = state.items.filter(f => f.id !== funnelId);
      state.stats.total = Math.max(0, state.stats.total - 1);
      
      // Clear current funnel if it matches
      if (state.currentFunnel?.id === funnelId) {
        state.currentFunnel = null;
        state.layout = null;
        state.theme = null;
        state.seo = null;
      }
      
      // Clear active funnel if it matches
      if (state.activeFunnel === funnelId) {
        state.activeFunnel = null;
        localStorage.removeItem('active-funnel-id');
      }
      
      // Remove from selection
      state.selectedFunnels = state.selectedFunnels.filter(id => id !== funnelId);
    },
    
    addFunnelToList: (state, action) => {
      state.items.unshift(action.payload);
      state.stats.total += 1;
      
      if (action.payload.status === 'published') {
        state.stats.published += 1;
      } else if (action.payload.status === 'draft') {
        state.stats.draft += 1;
      }
    },
    
    // =========================================================================
    // CACHE
    // =========================================================================
    
    invalidateCache: (state) => {
      state.lastFetch = null;
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
    
    resetFunnels: () => initialState,
  },
  
  extraReducers: (builder) => {
    // =========================================================================
    // FETCH FUNNELS LIST
    // =========================================================================
    
    builder
      .addCase(fetchFunnels.pending, (state) => {
        state.loading.list = true;
        state.errors.list = null;
      })
      .addCase(fetchFunnels.fulfilled, (state, action) => {
        state.loading.list = false;
        state.items = action.payload.items || action.payload.funnels || [];
        
        // Update pagination
        if (action.payload.pagination) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.pagination,
          };
        }
        
        // Update stats
        if (action.payload.stats) {
          state.stats = action.payload.stats;
        }
        
        state.lastFetch = Date.now();
      })
      .addCase(fetchFunnels.rejected, (state, action) => {
        state.loading.list = false;
        state.errors.list = action.payload;
      });
    
    // =========================================================================
    // FETCH FUNNEL BY ID
    // =========================================================================
    
    builder
      .addCase(fetchFunnelById.pending, (state) => {
        state.loading.current = true;
        state.errors.current = null;
      })
      .addCase(fetchFunnelById.fulfilled, (state, action) => {
        state.loading.current = false;
        state.currentFunnel = action.payload;
        
        // Update in list if present
        const index = state.items.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(fetchFunnelById.rejected, (state, action) => {
        state.loading.current = false;
        state.errors.current = action.payload;
      });
    
    // =========================================================================
    // FETCH/UPDATE LAYOUT
    // =========================================================================
    
    builder
      .addCase(fetchFunnelLayout.pending, (state) => {
        state.loading.layout = true;
        state.errors.layout = null;
      })
      .addCase(fetchFunnelLayout.fulfilled, (state, action) => {
        state.loading.layout = false;
        if (state.currentFunnel?.id === action.payload.funnelId) {
          state.layout = action.payload.layout;
        }
      })
      .addCase(fetchFunnelLayout.rejected, (state, action) => {
        state.loading.layout = false;
        state.errors.layout = action.payload;
      });
    
    builder
      .addCase(updateFunnelLayout.pending, (state) => {
        state.loading.layout = true;
      })
      .addCase(updateFunnelLayout.fulfilled, (state, action) => {
        state.loading.layout = false;
        if (state.currentFunnel?.id === action.payload.funnelId) {
          state.layout = action.payload.layout;
        }
      })
      .addCase(updateFunnelLayout.rejected, (state) => {
        state.loading.layout = false;
      });
    
    // =========================================================================
    // FETCH/UPDATE THEME
    // =========================================================================
    
    builder
      .addCase(fetchFunnelTheme.pending, (state) => {
        state.loading.theme = true;
        state.errors.theme = null;
      })
      .addCase(fetchFunnelTheme.fulfilled, (state, action) => {
        state.loading.theme = false;
        if (state.currentFunnel?.id === action.payload.funnelId) {
          state.theme = action.payload.theme;
        }
      })
      .addCase(fetchFunnelTheme.rejected, (state, action) => {
        state.loading.theme = false;
        state.errors.theme = action.payload;
      });
    
    builder
      .addCase(updateFunnelTheme.fulfilled, (state, action) => {
        if (state.currentFunnel?.id === action.payload.funnelId) {
          state.theme = action.payload.theme;
        }
      });
    
    // =========================================================================
    // FETCH/UPDATE SEO
    // =========================================================================
    
    builder
      .addCase(fetchFunnelSEO.pending, (state) => {
        state.loading.seo = true;
        state.errors.seo = null;
      })
      .addCase(fetchFunnelSEO.fulfilled, (state, action) => {
        state.loading.seo = false;
        if (state.currentFunnel?.id === action.payload.funnelId) {
          state.seo = action.payload.seo;
        }
      })
      .addCase(fetchFunnelSEO.rejected, (state, action) => {
        state.loading.seo = false;
        state.errors.seo = action.payload;
      });
    
    builder
      .addCase(updateFunnelSEO.fulfilled, (state, action) => {
        if (state.currentFunnel?.id === action.payload.funnelId) {
          state.seo = action.payload.seo;
        }
      });
    
    // =========================================================================
    // CREATE FUNNEL
    // =========================================================================
    
    builder
      .addCase(createFunnel.pending, (state) => {
        state.loading.create = true;
        state.errors.create = null;
      })
      .addCase(createFunnel.fulfilled, (state, action) => {
        state.loading.create = false;
        
        // Add to list
        state.items.unshift(action.payload);
        
        // Update stats
        state.stats.total += 1;
        if (action.payload.status === 'draft') {
          state.stats.draft += 1;
        }
        
        // Set as active funnel
        state.activeFunnel = action.payload.id;
        localStorage.setItem('active-funnel-id', action.payload.id);
      })
      .addCase(createFunnel.rejected, (state, action) => {
        state.loading.create = false;
        state.errors.create = action.payload;
      });
    
    // =========================================================================
    // CREATE FROM TEMPLATE
    // =========================================================================
    
    builder
      .addCase(createFunnelFromTemplate.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.stats.total += 1;
        
        // Set as active
        state.activeFunnel = action.payload.id;
        localStorage.setItem('active-funnel-id', action.payload.id);
      });
    
    // =========================================================================
    // UPDATE FUNNEL
    // =========================================================================
    
    builder
      .addCase(updateFunnel.pending, (state) => {
        state.loading.update = true;
        state.errors.update = null;
      })
      .addCase(updateFunnel.fulfilled, (state, action) => {
        state.loading.update = false;
        
        // Update in list
        const index = state.items.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        
        // Update current funnel
        if (state.currentFunnel?.id === action.payload.id) {
          state.currentFunnel = action.payload;
        }
      })
      .addCase(updateFunnel.rejected, (state, action) => {
        state.loading.update = false;
        state.errors.update = action.payload;
      });
    
    // =========================================================================
    // DELETE FUNNEL
    // =========================================================================
    
    builder
      .addCase(deleteFunnel.pending, (state) => {
        state.loading.delete = true;
        state.errors.delete = null;
      })
      .addCase(deleteFunnel.fulfilled, (state, action) => {
        state.loading.delete = false;
        
        const funnelId = action.payload;
        
        // Remove from list
        state.items = state.items.filter(f => f.id !== funnelId);
        state.stats.total = Math.max(0, state.stats.total - 1);
        
        // Clear current funnel
        if (state.currentFunnel?.id === funnelId) {
          state.currentFunnel = null;
          state.layout = null;
          state.theme = null;
          state.seo = null;
        }
        
        // Clear active funnel
        if (state.activeFunnel === funnelId) {
          state.activeFunnel = null;
          localStorage.removeItem('active-funnel-id');
        }
        
        // Remove from selection
        state.selectedFunnels = state.selectedFunnels.filter(id => id !== funnelId);
      })
      .addCase(deleteFunnel.rejected, (state, action) => {
        state.loading.delete = false;
        state.errors.delete = action.payload;
      });
    
    // =========================================================================
    // CLONE FUNNEL
    // =========================================================================
    
    builder
      .addCase(cloneFunnel.pending, (state) => {
        state.loading.clone = true;
      })
      .addCase(cloneFunnel.fulfilled, (state, action) => {
        state.loading.clone = false;
        state.items.unshift(action.payload);
        state.stats.total += 1;
      })
      .addCase(cloneFunnel.rejected, (state) => {
        state.loading.clone = false;
      });
    
    // =========================================================================
    // PUBLISH/UNPUBLISH
    // =========================================================================
    
    builder
      .addCase(publishFunnel.pending, (state) => {
        state.loading.publish = true;
      })
      .addCase(publishFunnel.fulfilled, (state, action) => {
        state.loading.publish = false;
        
        const index = state.items.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
          state.stats.published += 1;
          state.stats.draft = Math.max(0, state.stats.draft - 1);
        }
        
        if (state.currentFunnel?.id === action.payload.id) {
          state.currentFunnel = action.payload;
        }
      })
      .addCase(publishFunnel.rejected, (state) => {
        state.loading.publish = false;
      });
    
    builder
      .addCase(unpublishFunnel.fulfilled, (state, action) => {
        const index = state.items.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
          state.stats.published = Math.max(0, state.stats.published - 1);
          state.stats.draft += 1;
        }
        
        if (state.currentFunnel?.id === action.payload.id) {
          state.currentFunnel = action.payload;
        }
      });
    
    // =========================================================================
    // PAUSE/ARCHIVE
    // =========================================================================
    
    builder
      .addCase(pauseFunnel.fulfilled, (state, action) => {
        const index = state.items.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
          state.stats.paused += 1;
        }
        
        if (state.currentFunnel?.id === action.payload.id) {
          state.currentFunnel = action.payload;
        }
      });
    
    builder
      .addCase(archiveFunnel.fulfilled, (state, action) => {
        const index = state.items.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
          state.stats.archived += 1;
        }
        
        if (state.currentFunnel?.id === action.payload.id) {
          state.currentFunnel = action.payload;
        }
      });
    
    // =========================================================================
    // BULK MOVE
    // =========================================================================
    
    builder
      .addCase(bulkMoveFunnels.pending, (state) => {
        state.loading.bulkMove = true;
      })
      .addCase(bulkMoveFunnels.fulfilled, (state, action) => {
        state.loading.bulkMove = false;
        
        const { funnelIds, groupId } = action.payload;
        
        // Update group for moved funnels
        funnelIds.forEach(funnelId => {
          const index = state.items.findIndex(f => f.id === funnelId);
          if (index !== -1) {
            state.items[index].groupId = groupId;
          }
        });
        
        // Clear selection
        state.selectedFunnels = [];
      })
      .addCase(bulkMoveFunnels.rejected, (state) => {
        state.loading.bulkMove = false;
      });
    
    // =========================================================================
    // FETCH STATS
    // =========================================================================
    
    builder
      .addCase(fetchFunnelStats.fulfilled, (state, action) => {
        const index = state.items.findIndex(f => f.id === action.payload.funnelId);
        if (index !== -1) {
          state.items[index].stats = action.payload.stats;
        }
        
        if (state.currentFunnel?.id === action.payload.funnelId) {
          state.currentFunnel.stats = action.payload.stats;
        }
      });
    
    // =========================================================================
    // PREVIEW URL
    // =========================================================================
    
    builder
      .addCase(getFunnelPreviewUrl.fulfilled, (state, action) => {
        if (state.currentFunnel?.id === action.payload.funnelId) {
          state.currentFunnel.previewUrl = action.payload.previewUrl;
        }
      });
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
  // Active funnel
  setActiveFunnel,
  clearActiveFunnel,
  
  // Filters
  setFilter,
  setFilters,
  clearFilters,
  setSearchQuery,
  setStatusFilter,
  setGroupFilter,
  setProjectFilter,
  
  // Sorting
  setSorting,
  toggleSortOrder,
  
  // Pagination
  setPage,
  setPageSize,
  nextPage,
  previousPage,
  
  // Selection
  toggleFunnelSelection,
  selectAllFunnels,
  deselectAllFunnels,
  
  // Local updates
  updateFunnelInList,
  removeFunnelFromList,
  addFunnelToList,
  
  // Cache
  invalidateCache,
  
  // Errors
  clearError,
  clearAllErrors,
  
  // Reset
  resetFunnels,
} = funnelsSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

// Funnels list
export const selectFunnels = (state) => state.funnels.items;
export const selectFunnelsCount = (state) => state.funnels.items.length;
export const selectHasFunnels = (state) => state.funnels.items.length > 0;

// Active funnel
export const selectActiveFunnelId = (state) => state.funnels.activeFunnel;
export const selectActiveFunnel = (state) => {
  const activeId = state.funnels.activeFunnel;
  if (!activeId) return null;
  
  return state.funnels.items.find(f => f.id === activeId) || 
         state.funnels.currentFunnel;
};

// Current funnel
export const selectCurrentFunnel = (state) => state.funnels.currentFunnel;
export const selectCurrentFunnelId = (state) => state.funnels.currentFunnel?.id;
export const selectCurrentFunnelName = (state) => state.funnels.currentFunnel?.name;
export const selectCurrentFunnelStatus = (state) => state.funnels.currentFunnel?.status;
export const selectCurrentFunnelSlug = (state) => state.funnels.currentFunnel?.slug;

// Funnel details
export const selectFunnelLayout = (state) => state.funnels.layout;
export const selectFunnelTheme = (state) => state.funnels.theme;
export const selectFunnelSEO = (state) => state.funnels.seo;

// Specific funnel by ID
export const selectFunnelById = (funnelId) => (state) => {
  return state.funnels.items.find(f => f.id === funnelId);
};

// Filters
export const selectFilters = (state) => state.funnels.filters;
export const selectSearchQuery = (state) => state.funnels.filters.search;
export const selectStatusFilter = (state) => state.funnels.filters.status;
export const selectGroupFilter = (state) => state.funnels.filters.groupId;
export const selectProjectFilter = (state) => state.funnels.filters.projectId;

// Pagination
export const selectPagination = (state) => state.funnels.pagination;
export const selectCurrentPage = (state) => state.funnels.pagination.page;
export const selectPageSize = (state) => state.funnels.pagination.limit;
export const selectTotalPages = (state) => state.funnels.pagination.totalPages;
export const selectTotalFunnels = (state) => state.funnels.pagination.total;

// Selection
export const selectSelectedFunnels = (state) => state.funnels.selectedFunnels;
export const selectSelectedFunnelsCount = (state) => state.funnels.selectedFunnels.length;
export const selectHasSelectedFunnels = (state) => state.funnels.selectedFunnels.length > 0;
export const selectIsFunnelSelected = (funnelId) => (state) => 
  state.funnels.selectedFunnels.includes(funnelId);

// Stats
export const selectFunnelsStats = (state) => state.funnels.stats;
export const selectPublishedFunnelsCount = (state) => state.funnels.stats.published;
export const selectDraftFunnelsCount = (state) => state.funnels.stats.draft;

// Loading states
export const selectFunnelsLoading = (state) => state.funnels.loading;
export const selectIsFunnelsListLoading = (state) => state.funnels.loading.list;
export const selectIsCurrentFunnelLoading = (state) => state.funnels.loading.current;
export const selectIsFunnelCreating = (state) => state.funnels.loading.create;
export const selectIsFunnelUpdating = (state) => state.funnels.loading.update;
export const selectIsFunnelDeleting = (state) => state.funnels.loading.delete;
export const selectIsFunnelPublishing = (state) => state.funnels.loading.publish;

// Errors
export const selectFunnelsErrors = (state) => state.funnels.errors;

// Cache
export const selectLastFetch = (state) => state.funnels.lastFetch;
export const selectIsCacheStale = (state) => {
  if (!state.funnels.lastFetch) return true;
  return Date.now() - state.funnels.lastFetch > state.funnels.cacheExpiry;
};

// Filtered funnels
export const selectFilteredFunnels = (state) => {
  let filtered = [...state.funnels.items];
  const { search, status, groupId, projectId } = state.funnels.filters;
  
  // Search
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(f => 
      f.name?.toLowerCase().includes(query) ||
      f.description?.toLowerCase().includes(query)
    );
  }
  
  // Status
  if (status !== 'all') {
    filtered = filtered.filter(f => f.status === status);
  }
  
  // Group
  if (groupId) {
    filtered = filtered.filter(f => f.groupId === groupId);
  }
  
  // Project
  if (projectId) {
    filtered = filtered.filter(f => f.projectId === projectId);
  }
  
  return filtered;
};

// Funnels by status
export const selectPublishedFunnels = (state) => 
  state.funnels.items.filter(f => f.status === 'published');

export const selectDraftFunnels = (state) => 
  state.funnels.items.filter(f => f.status === 'draft');

export const selectPausedFunnels = (state) => 
  state.funnels.items.filter(f => f.status === 'paused');

// Recent funnels
export const selectRecentFunnels = (state) => {
  return [...state.funnels.items]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);
};

// =============================================================================
// THUNK HELPERS
// =============================================================================

/**
 * Fetch funnels if cache is stale
 */
export const fetchFunnelsIfNeeded = () => (dispatch, getState) => {
  const state = getState();
  const isCacheStale = selectIsCacheStale(state);
  const isLoading = selectIsFunnelsListLoading(state);
  
  if (isCacheStale && !isLoading) {
    return dispatch(fetchFunnels());
  }
  
  return Promise.resolve();
};

/**
 * Select and load funnel with all details
 */
export const selectAndLoadFunnel = (funnelId) => async (dispatch) => {
  dispatch(setActiveFunnel(funnelId));
  
  await Promise.all([
    dispatch(fetchFunnelById(funnelId)),
    dispatch(fetchFunnelLayout(funnelId)),
    dispatch(fetchFunnelTheme(funnelId)),
    dispatch(fetchFunnelSEO(funnelId)),
  ]);
};

/**
 * Create and select funnel
 */
export const createAndSelectFunnel = (funnelData) => async (dispatch) => {
  const result = await dispatch(createFunnel(funnelData)).unwrap();
  dispatch(setActiveFunnel(result.id));
  return result;
};

/**
 * Delete selected funnels
 */
export const deleteSelectedFunnels = () => async (dispatch, getState) => {
  const state = getState();
  const selectedIds = selectSelectedFunnels(state);
  
  await Promise.all(selectedIds.map(id => dispatch(deleteFunnel(id))));
  dispatch(deselectAllFunnels());
};

// =============================================================================
// REDUCER
// =============================================================================

export default funnelsSlice.reducer;
