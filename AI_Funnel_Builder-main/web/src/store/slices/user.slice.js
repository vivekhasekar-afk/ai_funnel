// =============================================================================
// AI FUNNEL PLATFORM - User Slice
// =============================================================================
// User profile state management: profile, preferences, stats, avatar
// Depends on: users.api.js
// =============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import usersAPI from '@/lib/api/users.api';
import { showSuccess, showError } from './ui.slice';

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // User profile
  profile: null,
  
  // User preferences
  preferences: {
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
    notifications: {
      email: true,
      push: true,
      browser: true,
      marketing: false,
    },
    privacy: {
      showProfile: true,
      showActivity: false,
    },
    theme: 'light',
    sidebar: {
      defaultOpen: true,
      collapsed: false,
    },
    editor: {
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
    },
  },
  
  // User statistics
  stats: {
    totalProjects: 0,
    totalFunnels: 0,
    totalLeads: 0,
    totalResponses: 0,
    conversionRate: 0,
    lastActivity: null,
  },
  
  // Avatar
  avatar: {
    url: null,
    uploading: false,
    error: null,
  },
  
  // Loading states
  loading: {
    profile: false,
    preferences: false,
    stats: false,
    update: false,
    delete: false,
    export: false,
  },
  
  // Errors
  errors: {
    profile: null,
    preferences: null,
    stats: null,
    update: null,
    delete: null,
  },
  
  // Last sync timestamp
  lastSync: null,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Fetch current user profile
 */
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getCurrentUser();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Update user profile
 */
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (updates, { dispatch, rejectWithValue }) => {
    try {
      const response = await usersAPI.updateProfile(updates);
      dispatch(showSuccess('Profile updated successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to update profile'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Update user preferences
 */
export const updateUserPreferences = createAsyncThunk(
  'user/updatePreferences',
  async (preferences, { dispatch, rejectWithValue }) => {
    try {
      const response = await usersAPI.updatePreferences(preferences);
      dispatch(showSuccess('Preferences updated'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to update preferences'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Fetch user statistics
 */
export const fetchUserStats = createAsyncThunk(
  'user/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUserStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Upload user avatar
 */
export const uploadAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async (file, { dispatch, rejectWithValue }) => {
    try {
      const response = await usersAPI.uploadAvatar(file);
      dispatch(showSuccess('Avatar updated successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to upload avatar'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Delete user avatar
 */
export const deleteAvatar = createAsyncThunk(
  'user/deleteAvatar',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await usersAPI.deleteAvatar();
      dispatch(showSuccess('Avatar removed'));
      return null;
    } catch (error) {
      dispatch(showError('Failed to delete avatar'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Delete user account
 */
export const deleteUserAccount = createAsyncThunk(
  'user/deleteAccount',
  async (password, { dispatch, rejectWithValue }) => {
    try {
      await usersAPI.deleteAccount(password);
      dispatch(showSuccess('Account deleted successfully'));
      return true;
    } catch (error) {
      dispatch(showError('Failed to delete account'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Export user data
 */
export const exportUserData = createAsyncThunk(
  'user/exportData',
  async (format, { dispatch, rejectWithValue }) => {
    try {
      const response = await usersAPI.exportUserData(format);
      dispatch(showSuccess('Data export started. You will receive an email when ready.'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to export data'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Refresh user data (profile + stats)
 */
export const refreshUserData = createAsyncThunk(
  'user/refreshData',
  async (_, { dispatch }) => {
    const [profile, stats] = await Promise.all([
      dispatch(fetchUserProfile()),
      dispatch(fetchUserStats()),
    ]);
    
    return {
      profile: profile.payload,
      stats: stats.payload,
    };
  }
);

// =============================================================================
// SLICE
// =============================================================================

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // =========================================================================
    // PROFILE
    // =========================================================================
    
    setUserProfile: (state, action) => {
      state.profile = action.payload;
      state.lastSync = Date.now();
    },
    
    clearUserProfile: (state) => {
      state.profile = null;
      state.preferences = initialState.preferences;
      state.stats = initialState.stats;
      state.avatar = initialState.avatar;
    },
    
    updateProfileField: (state, action) => {
      const { field, value } = action.payload;
      if (state.profile) {
        state.profile[field] = value;
      }
    },
    
    // =========================================================================
    // PREFERENCES
    // =========================================================================
    
    setPreferences: (state, action) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
      };
      
      // Persist to localStorage
      localStorage.setItem('user-preferences', JSON.stringify(state.preferences));
    },
    
    updatePreference: (state, action) => {
      const { key, value } = action.payload;
      const keys = key.split('.');
      
      let current = state.preferences;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      // Persist to localStorage
      localStorage.setItem('user-preferences', JSON.stringify(state.preferences));
    },
    
    toggleNotification: (state, action) => {
      const type = action.payload;
      state.preferences.notifications[type] = !state.preferences.notifications[type];
      
      localStorage.setItem('user-preferences', JSON.stringify(state.preferences));
    },
    
    resetPreferences: (state) => {
      state.preferences = initialState.preferences;
      localStorage.removeItem('user-preferences');
    },
    
    // =========================================================================
    // STATS
    // =========================================================================
    
    setStats: (state, action) => {
      state.stats = {
        ...state.stats,
        ...action.payload,
      };
    },
    
    incrementStat: (state, action) => {
      const { stat, amount = 1 } = action.payload;
      if (typeof state.stats[stat] === 'number') {
        state.stats[stat] += amount;
      }
    },
    
    // =========================================================================
    // AVATAR
    // =========================================================================
    
    setAvatarUrl: (state, action) => {
      state.avatar.url = action.payload;
      if (state.profile) {
        state.profile.avatar = action.payload;
      }
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
    
    resetUser: () => initialState,
  },
  
  extraReducers: (builder) => {
    // =========================================================================
    // FETCH PROFILE
    // =========================================================================
    
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading.profile = true;
        state.errors.profile = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = action.payload;
        state.avatar.url = action.payload.avatar;
        state.lastSync = Date.now();
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.errors.profile = action.payload;
      });
    
    // =========================================================================
    // UPDATE PROFILE
    // =========================================================================
    
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading.update = true;
        state.errors.update = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading.update = false;
        state.profile = {
          ...state.profile,
          ...action.payload,
        };
        state.lastSync = Date.now();
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading.update = false;
        state.errors.update = action.payload;
      });
    
    // =========================================================================
    // UPDATE PREFERENCES
    // =========================================================================
    
    builder
      .addCase(updateUserPreferences.pending, (state) => {
        state.loading.preferences = true;
        state.errors.preferences = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.loading.preferences = false;
        state.preferences = {
          ...state.preferences,
          ...action.payload,
        };
        
        // Persist to localStorage
        localStorage.setItem('user-preferences', JSON.stringify(state.preferences));
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.loading.preferences = false;
        state.errors.preferences = action.payload;
      });
    
    // =========================================================================
    // FETCH STATS
    // =========================================================================
    
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.loading.stats = true;
        state.errors.stats = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = {
          ...state.stats,
          ...action.payload,
        };
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.errors.stats = action.payload;
      });
    
    // =========================================================================
    // UPLOAD AVATAR
    // =========================================================================
    
    builder
      .addCase(uploadAvatar.pending, (state) => {
        state.avatar.uploading = true;
        state.avatar.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.avatar.uploading = false;
        state.avatar.url = action.payload.url;
        if (state.profile) {
          state.profile.avatar = action.payload.url;
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.avatar.uploading = false;
        state.avatar.error = action.payload;
      });
    
    // =========================================================================
    // DELETE AVATAR
    // =========================================================================
    
    builder
      .addCase(deleteAvatar.pending, (state) => {
        state.avatar.uploading = true;
        state.avatar.error = null;
      })
      .addCase(deleteAvatar.fulfilled, (state) => {
        state.avatar.uploading = false;
        state.avatar.url = null;
        if (state.profile) {
          state.profile.avatar = null;
        }
      })
      .addCase(deleteAvatar.rejected, (state, action) => {
        state.avatar.uploading = false;
        state.avatar.error = action.payload;
      });
    
    // =========================================================================
    // DELETE ACCOUNT
    // =========================================================================
    
    builder
      .addCase(deleteUserAccount.pending, (state) => {
        state.loading.delete = true;
        state.errors.delete = null;
      })
      .addCase(deleteUserAccount.fulfilled, (state) => {
        state.loading.delete = false;
        // State will be cleared by auth logout
      })
      .addCase(deleteUserAccount.rejected, (state, action) => {
        state.loading.delete = false;
        state.errors.delete = action.payload;
      });
    
    // =========================================================================
    // EXPORT DATA
    // =========================================================================
    
    builder
      .addCase(exportUserData.pending, (state) => {
        state.loading.export = true;
      })
      .addCase(exportUserData.fulfilled, (state) => {
        state.loading.export = false;
      })
      .addCase(exportUserData.rejected, (state) => {
        state.loading.export = false;
      });
    
    // =========================================================================
    // REFRESH DATA
    // =========================================================================
    
    builder
      .addCase(refreshUserData.fulfilled, (state, action) => {
        state.profile = action.payload.profile;
        state.stats = action.payload.stats;
        state.lastSync = Date.now();
      });
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
  // Profile
  setUserProfile,
  clearUserProfile,
  updateProfileField,
  
  // Preferences
  setPreferences,
  updatePreference,
  toggleNotification,
  resetPreferences,
  
  // Stats
  setStats,
  incrementStat,
  
  // Avatar
  setAvatarUrl,
  
  // Errors
  clearError,
  clearAllErrors,
  
  // Reset
  resetUser,
} = userSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

// Profile
export const selectUserProfile = (state) => state.user.profile;
export const selectUserId = (state) => state.user.profile?.id;
export const selectUserName = (state) => state.user.profile?.name;
export const selectUserEmail = (state) => state.user.profile?.email;
export const selectUserRole = (state) => state.user.profile?.role;
export const selectUserPlan = (state) => state.user.profile?.plan;
export const selectUserAvatar = (state) => state.user.avatar.url || state.user.profile?.avatar;
export const selectIsProfileComplete = (state) => {
  const profile = state.user.profile;
  return profile?.name && profile?.email && profile?.avatar;
};

// Preferences
export const selectPreferences = (state) => state.user.preferences;
export const selectLanguage = (state) => state.user.preferences.language;
export const selectTimezone = (state) => state.user.preferences.timezone;
export const selectDateFormat = (state) => state.user.preferences.dateFormat;
export const selectTimeFormat = (state) => state.user.preferences.timeFormat;
export const selectCurrency = (state) => state.user.preferences.currency;
export const selectNotificationPreferences = (state) => state.user.preferences.notifications;
export const selectPrivacySettings = (state) => state.user.preferences.privacy;
export const selectEditorPreferences = (state) => state.user.preferences.editor;

// Specific notification preferences
export const selectEmailNotificationsEnabled = (state) => 
  state.user.preferences.notifications.email;
export const selectPushNotificationsEnabled = (state) => 
  state.user.preferences.notifications.push;
export const selectBrowserNotificationsEnabled = (state) => 
  state.user.preferences.notifications.browser;

// Stats
export const selectUserStats = (state) => state.user.stats;
export const selectTotalProjects = (state) => state.user.stats.totalProjects;
export const selectTotalFunnels = (state) => state.user.stats.totalFunnels;
export const selectTotalLeads = (state) => state.user.stats.totalLeads;
export const selectConversionRate = (state) => state.user.stats.conversionRate;
export const selectLastActivity = (state) => state.user.stats.lastActivity;

// Avatar
export const selectAvatarState = (state) => state.user.avatar;
export const selectIsAvatarUploading = (state) => state.user.avatar.uploading;
export const selectAvatarError = (state) => state.user.avatar.error;

// Loading
export const selectUserLoading = (state) => state.user.loading;
export const selectIsProfileLoading = (state) => state.user.loading.profile;
export const selectIsPreferencesLoading = (state) => state.user.loading.preferences;
export const selectIsStatsLoading = (state) => state.user.loading.stats;
export const selectIsProfileUpdating = (state) => state.user.loading.update;
export const selectIsAccountDeleting = (state) => state.user.loading.delete;
export const selectIsDataExporting = (state) => state.user.loading.export;

// Errors
export const selectUserErrors = (state) => state.user.errors;
export const selectProfileError = (state) => state.user.errors.profile;
export const selectPreferencesError = (state) => state.user.errors.preferences;
export const selectUpdateError = (state) => state.user.errors.update;

// Meta
export const selectLastSync = (state) => state.user.lastSync;
export const selectIsUserDataStale = (state) => {
  if (!state.user.lastSync) return true;
  
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() - state.user.lastSync > fiveMinutes;
};

// Combined selectors
export const selectUserDisplayName = (state) => {
  const profile = state.user.profile;
  return profile?.name || profile?.email?.split('@')[0] || 'User';
};

export const selectUserInitials = (state) => {
  const profile = state.user.profile;
  if (!profile?.name) return '?';
  
  const parts = profile.name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// =============================================================================
// THUNK HELPERS
// =============================================================================

/**
 * Initialize user data (profile + preferences + stats)
 */
export const initializeUserData = () => async (dispatch) => {
  try {
    // Load preferences from localStorage
    const storedPreferences = localStorage.getItem('user-preferences');
    if (storedPreferences) {
      dispatch(setPreferences(JSON.parse(storedPreferences)));
    }
    
    // Fetch profile and stats
    await dispatch(refreshUserData());
  } catch (error) {
    console.error('Failed to initialize user data:', error);
  }
};

/**
 * Update multiple profile fields
 */
export const updateMultipleFields = (updates) => async (dispatch) => {
  try {
    await dispatch(updateUserProfile(updates)).unwrap();
    return true;
  } catch (error) {
    return false;
  }
};

// =============================================================================
// REDUCER
// =============================================================================

export default userSlice.reducer;
