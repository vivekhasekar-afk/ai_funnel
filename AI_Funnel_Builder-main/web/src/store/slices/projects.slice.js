// =============================================================================
// AI FUNNEL PLATFORM - Projects Slice
// =============================================================================
// Projects state management: list, active project, CRUD operations
// Depends on: projects.api.js
// =============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import projectsAPI from '@/lib/api/projects.api';
import { showSuccess, showError } from './ui.slice';

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // Projects list
  items: [],
  
  // Active/selected project
  activeProject: localStorage.getItem('active-project-id') || null,
  
  // Current project details
  currentProject: null,
  
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
    status: 'all', // 'all', 'active', 'archived', 'paused'
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  },
  
  // Project statistics
  stats: {
    total: 0,
    active: 0,
    archived: 0,
    paused: 0,
  },
  
  // Loading states
  loading: {
    list: false,
    current: false,
    create: false,
    update: false,
    delete: false,
    clone: false,
    stats: false,
    restore: false,
  },
  
  // Errors
  errors: {
    list: null,
    current: null,
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
 * Fetch projects list
 */
export const fetchProjects = createAsyncThunk(
  'projects/fetchList',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { filters, pagination } = getState().projects;
      
      const response = await projectsAPI.getProjects({
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        search: params.search !== undefined ? params.search : filters.search,
        status: params.status || filters.status,
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
 * Fetch single project by ID
 */
export const fetchProjectById = createAsyncThunk(
  'projects/fetchById',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await projectsAPI.getProject(projectId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Create new project
 */
export const createProject = createAsyncThunk(
  'projects/create',
  async (projectData, { dispatch, rejectWithValue }) => {
    try {
      const response = await projectsAPI.createProject(projectData);
      dispatch(showSuccess('Project created successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to create project'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Update project
 */
export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ projectId, updates }, { dispatch, rejectWithValue }) => {
    try {
      const response = await projectsAPI.updateProject(projectId, updates);
      dispatch(showSuccess('Project updated successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to update project'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Delete project
 */
export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (projectId, { dispatch, rejectWithValue }) => {
    try {
      await projectsAPI.deleteProject(projectId);
      dispatch(showSuccess('Project deleted successfully'));
      return projectId;
    } catch (error) {
      dispatch(showError('Failed to delete project'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Restore deleted project
 */
export const restoreProject = createAsyncThunk(
  'projects/restore',
  async (projectId, { dispatch, rejectWithValue }) => {
    try {
      const response = await projectsAPI.restoreProject(projectId);
      dispatch(showSuccess('Project restored successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to restore project'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Clone project
 */
export const cloneProject = createAsyncThunk(
  'projects/clone',
  async ({ projectId, name }, { dispatch, rejectWithValue }) => {
    try {
      const response = await projectsAPI.cloneProject(projectId, name);
      dispatch(showSuccess('Project cloned successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to clone project'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Activate project
 */
export const activateProject = createAsyncThunk(
  'projects/activate',
  async (projectId, { dispatch, rejectWithValue }) => {
    try {
      const response = await projectsAPI.activateProject(projectId);
      dispatch(showSuccess('Project activated'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to activate project'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Deactivate project
 */
export const deactivateProject = createAsyncThunk(
  'projects/deactivate',
  async (projectId, { dispatch, rejectWithValue }) => {
    try {
      const response = await projectsAPI.deactivateProject(projectId);
      dispatch(showSuccess('Project deactivated'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to deactivate project'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Fetch project statistics
 */
export const fetchProjectStats = createAsyncThunk(
  'projects/fetchStats',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await projectsAPI.getProjectStats(projectId);
      return { projectId, stats: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Refresh project stats
 */
export const refreshProjectStats = createAsyncThunk(
  'projects/refreshStats',
  async (projectId, { dispatch, rejectWithValue }) => {
    try {
      const response = await projectsAPI.refreshProjectStats(projectId);
      dispatch(showSuccess('Stats refreshed'));
      return { projectId, stats: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// =============================================================================
// SLICE
// =============================================================================

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    // =========================================================================
    // ACTIVE PROJECT
    // =========================================================================
    
    setActiveProject: (state, action) => {
      state.activeProject = action.payload;
      if (action.payload) {
        localStorage.setItem('active-project-id', action.payload);
      } else {
        localStorage.removeItem('active-project-id');
      }
    },
    
    clearActiveProject: (state) => {
      state.activeProject = null;
      localStorage.removeItem('active-project-id');
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
    // LOCAL UPDATES
    // =========================================================================
    
    updateProjectInList: (state, action) => {
      const { projectId, updates } = action.payload;
      const index = state.items.findIndex(p => p.id === projectId);
      
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...updates,
        };
      }
      
      // Update current project if it matches
      if (state.currentProject?.id === projectId) {
        state.currentProject = {
          ...state.currentProject,
          ...updates,
        };
      }
    },
    
    removeProjectFromList: (state, action) => {
      const projectId = action.payload;
      state.items = state.items.filter(p => p.id !== projectId);
      state.stats.total = Math.max(0, state.stats.total - 1);
      
      // Clear current project if it matches
      if (state.currentProject?.id === projectId) {
        state.currentProject = null;
      }
      
      // Clear active project if it matches
      if (state.activeProject === projectId) {
        state.activeProject = null;
        localStorage.removeItem('active-project-id');
      }
    },
    
    addProjectToList: (state, action) => {
      state.items.unshift(action.payload);
      state.stats.total += 1;
      
      if (action.payload.status === 'active') {
        state.stats.active += 1;
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
    
    resetProjects: () => initialState,
  },
  
  extraReducers: (builder) => {
    // =========================================================================
    // FETCH PROJECTS LIST
    // =========================================================================
    
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading.list = true;
        state.errors.list = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading.list = false;
        state.items = action.payload.items || action.payload.projects || [];
        
        // Update pagination
        if (action.payload.pagination) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.pagination,
          };
        }
        
        // Update stats if provided
        if (action.payload.stats) {
          state.stats = action.payload.stats;
        }
        
        state.lastFetch = Date.now();
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading.list = false;
        state.errors.list = action.payload;
      });
    
    // =========================================================================
    // FETCH PROJECT BY ID
    // =========================================================================
    
    builder
      .addCase(fetchProjectById.pending, (state) => {
        state.loading.current = true;
        state.errors.current = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading.current = false;
        state.currentProject = action.payload;
        
        // Update in list if present
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading.current = false;
        state.errors.current = action.payload;
      });
    
    // =========================================================================
    // CREATE PROJECT
    // =========================================================================
    
    builder
      .addCase(createProject.pending, (state) => {
        state.loading.create = true;
        state.errors.create = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading.create = false;
        
        // Add to list
        state.items.unshift(action.payload);
        
        // Update stats
        state.stats.total += 1;
        if (action.payload.status === 'active') {
          state.stats.active += 1;
        }
        
        // Set as active project
        state.activeProject = action.payload.id;
        localStorage.setItem('active-project-id', action.payload.id);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading.create = false;
        state.errors.create = action.payload;
      });
    
    // =========================================================================
    // UPDATE PROJECT
    // =========================================================================
    
    builder
      .addCase(updateProject.pending, (state) => {
        state.loading.update = true;
        state.errors.update = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading.update = false;
        
        // Update in list
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        
        // Update current project
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading.update = false;
        state.errors.update = action.payload;
      });
    
    // =========================================================================
    // DELETE PROJECT
    // =========================================================================
    
    builder
      .addCase(deleteProject.pending, (state) => {
        state.loading.delete = true;
        state.errors.delete = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading.delete = false;
        
        const projectId = action.payload;
        
        // Remove from list
        state.items = state.items.filter(p => p.id !== projectId);
        
        // Update stats
        state.stats.total = Math.max(0, state.stats.total - 1);
        
        // Clear current project
        if (state.currentProject?.id === projectId) {
          state.currentProject = null;
        }
        
        // Clear active project
        if (state.activeProject === projectId) {
          state.activeProject = null;
          localStorage.removeItem('active-project-id');
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading.delete = false;
        state.errors.delete = action.payload;
      });
    
    // =========================================================================
    // RESTORE PROJECT
    // =========================================================================
    
    builder
      .addCase(restoreProject.pending, (state) => {
        state.loading.restore = true;
      })
      .addCase(restoreProject.fulfilled, (state, action) => {
        state.loading.restore = false;
        
        // Add back to list
        state.items.unshift(action.payload);
        state.stats.total += 1;
      })
      .addCase(restoreProject.rejected, (state) => {
        state.loading.restore = false;
      });
    
    // =========================================================================
    // CLONE PROJECT
    // =========================================================================
    
    builder
      .addCase(cloneProject.pending, (state) => {
        state.loading.clone = true;
      })
      .addCase(cloneProject.fulfilled, (state, action) => {
        state.loading.clone = false;
        
        // Add to list
        state.items.unshift(action.payload);
        state.stats.total += 1;
      })
      .addCase(cloneProject.rejected, (state) => {
        state.loading.clone = false;
      });
    
    // =========================================================================
    // ACTIVATE PROJECT
    // =========================================================================
    
    builder
      .addCase(activateProject.fulfilled, (state, action) => {
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
        
        state.stats.active += 1;
      });
    
    // =========================================================================
    // DEACTIVATE PROJECT
    // =========================================================================
    
    builder
      .addCase(deactivateProject.fulfilled, (state, action) => {
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
        
        state.stats.active = Math.max(0, state.stats.active - 1);
      });
    
    // =========================================================================
    // FETCH/REFRESH STATS
    // =========================================================================
    
    builder
      .addCase(fetchProjectStats.pending, (state) => {
        state.loading.stats = true;
      })
      .addCase(fetchProjectStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        
        // Update project stats in list
        const index = state.items.findIndex(p => p.id === action.payload.projectId);
        if (index !== -1) {
          state.items[index].stats = action.payload.stats;
        }
        
        // Update current project stats
        if (state.currentProject?.id === action.payload.projectId) {
          state.currentProject.stats = action.payload.stats;
        }
      })
      .addCase(fetchProjectStats.rejected, (state) => {
        state.loading.stats = false;
      });
    
    builder
      .addCase(refreshProjectStats.fulfilled, (state, action) => {
        const index = state.items.findIndex(p => p.id === action.payload.projectId);
        if (index !== -1) {
          state.items[index].stats = action.payload.stats;
        }
        
        if (state.currentProject?.id === action.payload.projectId) {
          state.currentProject.stats = action.payload.stats;
        }
      });
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
  // Active project
  setActiveProject,
  clearActiveProject,
  
  // Filters
  setFilter,
  setFilters,
  clearFilters,
  setSearchQuery,
  
  // Sorting
  setSorting,
  toggleSortOrder,
  
  // Pagination
  setPage,
  setPageSize,
  nextPage,
  previousPage,
  
  // Local updates
  updateProjectInList,
  removeProjectFromList,
  addProjectToList,
  
  // Cache
  invalidateCache,
  
  // Errors
  clearError,
  clearAllErrors,
  
  // Reset
  resetProjects,
} = projectsSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

// Projects list
export const selectProjects = (state) => state.projects.items;
export const selectProjectsCount = (state) => state.projects.items.length;
export const selectHasProjects = (state) => state.projects.items.length > 0;

// Active project
export const selectActiveProjectId = (state) => state.projects.activeProject;
export const selectActiveProject = (state) => {
  const activeId = state.projects.activeProject;
  if (!activeId) return null;
  
  return state.projects.items.find(p => p.id === activeId) || 
         state.projects.currentProject;
};

// Current project
export const selectCurrentProject = (state) => state.projects.currentProject;
export const selectCurrentProjectId = (state) => state.projects.currentProject?.id;
export const selectCurrentProjectName = (state) => state.projects.currentProject?.name;

// Specific project by ID
export const selectProjectById = (projectId) => (state) => {
  return state.projects.items.find(p => p.id === projectId);
};

// Filters
export const selectFilters = (state) => state.projects.filters;
export const selectSearchQuery = (state) => state.projects.filters.search;
export const selectStatusFilter = (state) => state.projects.filters.status;
export const selectSortBy = (state) => state.projects.filters.sortBy;
export const selectSortOrder = (state) => state.projects.filters.sortOrder;

// Pagination
export const selectPagination = (state) => state.projects.pagination;
export const selectCurrentPage = (state) => state.projects.pagination.page;
export const selectPageSize = (state) => state.projects.pagination.limit;
export const selectTotalPages = (state) => state.projects.pagination.totalPages;
export const selectTotalProjects = (state) => state.projects.pagination.total;
export const selectHasNextPage = (state) => 
  state.projects.pagination.page < state.projects.pagination.totalPages;
export const selectHasPreviousPage = (state) => 
  state.projects.pagination.page > 1;

// Stats
export const selectProjectsStats = (state) => state.projects.stats;
export const selectActiveProjectsCount = (state) => state.projects.stats.active;
export const selectArchivedProjectsCount = (state) => state.projects.stats.archived;

// Loading states
export const selectProjectsLoading = (state) => state.projects.loading;
export const selectIsProjectsListLoading = (state) => state.projects.loading.list;
export const selectIsCurrentProjectLoading = (state) => state.projects.loading.current;
export const selectIsProjectCreating = (state) => state.projects.loading.create;
export const selectIsProjectUpdating = (state) => state.projects.loading.update;
export const selectIsProjectDeleting = (state) => state.projects.loading.delete;
export const selectIsProjectCloning = (state) => state.projects.loading.clone;

// Errors
export const selectProjectsErrors = (state) => state.projects.errors;
export const selectProjectsListError = (state) => state.projects.errors.list;
export const selectCurrentProjectError = (state) => state.projects.errors.current;

// Cache
export const selectLastFetch = (state) => state.projects.lastFetch;
export const selectIsCacheStale = (state) => {
  if (!state.projects.lastFetch) return true;
  return Date.now() - state.projects.lastFetch > state.projects.cacheExpiry;
};

// Filtered/sorted projects (client-side)
export const selectFilteredProjects = (state) => {
  let filtered = [...state.projects.items];
  const { search, status } = state.projects.filters;
  
  // Apply search filter
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(p => 
      p.name?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    );
  }
  
  // Apply status filter
  if (status !== 'all') {
    filtered = filtered.filter(p => p.status === status);
  }
  
  return filtered;
};

// Projects by status
export const selectActiveProjects = (state) => 
  state.projects.items.filter(p => p.status === 'active');

export const selectArchivedProjects = (state) => 
  state.projects.items.filter(p => p.status === 'archived');

export const selectPausedProjects = (state) => 
  state.projects.items.filter(p => p.status === 'paused');

// Recent projects
export const selectRecentProjects = (state) => {
  return [...state.projects.items]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);
};

// =============================================================================
// THUNK HELPERS
// =============================================================================

/**
 * Fetch projects if cache is stale
 */
export const fetchProjectsIfNeeded = () => (dispatch, getState) => {
  const state = getState();
  const isCacheStale = selectIsCacheStale(state);
  const isLoading = selectIsProjectsListLoading(state);
  
  if (isCacheStale && !isLoading) {
    return dispatch(fetchProjects());
  }
  
  return Promise.resolve();
};

/**
 * Select and load project
 */
export const selectAndLoadProject = (projectId) => async (dispatch) => {
  dispatch(setActiveProject(projectId));
  await dispatch(fetchProjectById(projectId));
};

/**
 * Create and select project
 */
export const createAndSelectProject = (projectData) => async (dispatch) => {
  const result = await dispatch(createProject(projectData)).unwrap();
  dispatch(setActiveProject(result.id));
  return result;
};

// =============================================================================
// REDUCER
// =============================================================================

export default projectsSlice.reducer;
