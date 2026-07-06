// =============================================================================
// AI FUNNEL PLATFORM - Auth Slice
// =============================================================================
// Authentication state management
// Uses: auth.api.js, users.api.js
// Dependencies: ui.slice.js (for notifications)
// =============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authAPI from '@/lib/api/auth.api';
import usersAPI from '@/lib/api/users.api';
import { showSuccess, showError } from './ui.slice';

// Storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

// =============================================================================
// INITIAL STATE
// =============================================================================

const getStoredToken = () => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

const getStoredRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
};

const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

const initialState = {
  // User data
  user: getStoredUser(),
  
  // Tokens
  token: getStoredToken(),
  refreshToken: getStoredRefreshToken(),
  
  // Authentication status
  isAuthenticated: Boolean(getStoredToken()),
  
  // Loading states
  isLoading: false,
  isInitializing: true,
  
  // Error state
  error: null,
  
  // Login attempt tracking
  loginAttempts: 0,
  lastLoginAttempt: null,
  
  // Session info
  sessionExpiry: null,
  rememberMe: Boolean(localStorage.getItem(TOKEN_KEY)),
  
  // Email verification
  emailVerified: getStoredUser()?.emailVerified || false,
  verificationEmailSent: false,
  
  // Password reset
  passwordResetEmailSent: false,
  passwordResetToken: null,
  
  // OAuth
  oauthProvider: null,
  oauthLoading: false,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Initialize auth state (check existing session)
 */
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const token = getStoredToken();
      const refreshToken = getStoredRefreshToken();
      
      if (!token || !refreshToken) {
        return { isAuthenticated: false };
      }
      
      // Validate token by fetching current user
      const response = await usersAPI.getCurrentUser();
      
      return {
        isAuthenticated: true,
        user: response.data,
      };
    } catch (error) {
      // Token is invalid, try to refresh
      try {
        const refreshToken = getStoredRefreshToken();
        if (refreshToken) {
          const refreshResponse = await authAPI.refreshToken(refreshToken);
          
          // Store new tokens
          const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
          storage.setItem(TOKEN_KEY, refreshResponse.data.accessToken);
          storage.setItem(REFRESH_TOKEN_KEY, refreshResponse.data.refreshToken);
          
          // Fetch user with new token
          const userResponse = await usersAPI.getCurrentUser();
          
          return {
            isAuthenticated: true,
            user: userResponse.data,
            token: refreshResponse.data.accessToken,
            refreshToken: refreshResponse.data.refreshToken,
          };
        }
      } catch (refreshError) {
        // Refresh failed, clear everything
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
      }
      
      return rejectWithValue('Session expired');
    }
  }
);

/**
 * Login user
 */
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, rememberMe = false }, { rejectWithValue, dispatch }) => {
    try {
      const response = await authAPI.login({ email, password, rememberMe });
      
      const { accessToken, refreshToken, user } = response.data;
      
      // Store tokens
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, accessToken);
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      storage.setItem(USER_KEY, JSON.stringify(user));
      
      // Show success notification
      dispatch(showSuccess(`Welcome back, ${user.name || user.email}!`));
      
      return {
        accessToken,
        refreshToken,
        user,
        rememberMe,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Signup user
 */
export const signup = createAsyncThunk(
  'auth/signup',
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await authAPI.signup(data);
      
      const { accessToken, refreshToken, user } = response.data;
      
      // Store tokens
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      // Show success notification
      dispatch(showSuccess('Account created successfully!'));
      
      return {
        accessToken,
        refreshToken,
        user,
        rememberMe: true,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Signup failed';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Logout user
 */
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Logout anyway even if API call fails
      console.error('Logout API error:', error);
    }
    
    // Clear storage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    
    // Show notification
    dispatch(showSuccess('Logged out successfully'));
    
    return null;
  }
);

/**
 * Refresh access token
 */
export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const refreshToken = auth.refreshToken || getStoredRefreshToken();
      
      if (!refreshToken) {
        return rejectWithValue('No refresh token available');
      }
      
      const response = await authAPI.refreshToken(refreshToken);
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      // Store new tokens
      const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, accessToken);
      storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      
      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      return rejectWithValue('Token refresh failed');
    }
  }
);

/**
 * Verify email
 */
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue, dispatch }) => {
    try {
      await authAPI.verifyEmail({ token });
      
      dispatch(showSuccess('Email verified successfully!'));
      
      return { emailVerified: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Email verification failed';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Resend verification email
 */
export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerification',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await authAPI.resendVerification();
      
      dispatch(showSuccess('Verification email sent!'));
      
      return { verificationEmailSent: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send verification email';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Forgot password (request reset)
 */
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue, dispatch }) => {
    try {
      await authAPI.forgotPassword({ email });
      
      dispatch(showSuccess('Password reset email sent!'));
      
      return { passwordResetEmailSent: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Reset password with token
 */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }, { rejectWithValue, dispatch }) => {
    try {
      await authAPI.resetPassword({ token, newPassword });
      
      dispatch(showSuccess('Password reset successfully!'));
      
      return { passwordResetToken: null };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Change password (while authenticated)
 */
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue, dispatch }) => {
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      
      dispatch(showSuccess('Password changed successfully!'));
      
      return null;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * OAuth login
 */
export const oauthLogin = createAsyncThunk(
  'auth/oauthLogin',
  async ({ provider, code, state }, { rejectWithValue, dispatch }) => {
    try {
      const response = await authAPI.oauthCallback(provider, { code, state });
      
      const { accessToken, refreshToken, user } = response.data;
      
      // Store tokens
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      dispatch(showSuccess(`Welcome, ${user.name || user.email}!`));
      
      return {
        accessToken,
        refreshToken,
        user,
        provider,
        rememberMe: true,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'OAuth login failed';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Update current user profile
 */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates, { rejectWithValue, dispatch }) => {
    try {
      const response = await usersAPI.updateProfile(updates);
      
      // Update stored user
      const storage = localStorage.getItem(USER_KEY) ? localStorage : sessionStorage;
      storage.setItem(USER_KEY, JSON.stringify(response.data));
      
      dispatch(showSuccess('Profile updated successfully!'));
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Delete account
 */
export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await usersAPI.deleteAccount();
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      dispatch(showSuccess('Account deleted successfully'));
      
      return null;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Account deletion failed';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

// =============================================================================
// SLICE
// =============================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set user data
    setUser: (state, action) => {
      state.user = action.payload;
      
      const storage = state.rememberMe ? localStorage : sessionStorage;
      storage.setItem(USER_KEY, JSON.stringify(action.payload));
    },
    
    // Set tokens
    setTokens: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      state.token = accessToken;
      state.refreshToken = refreshToken;
      
      const storage = state.rememberMe ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, accessToken);
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Set email verified
    setEmailVerified: (state, action) => {
      state.emailVerified = action.payload;
      if (state.user) {
        state.user.emailVerified = action.payload;
        
        const storage = state.rememberMe ? localStorage : sessionStorage;
        storage.setItem(USER_KEY, JSON.stringify(state.user));
      }
    },
    
    // Clear password reset state
    clearPasswordResetState: (state) => {
      state.passwordResetEmailSent = false;
      state.passwordResetToken = null;
    },
    
    // Set OAuth provider
    setOAuthProvider: (state, action) => {
      state.oauthProvider = action.payload;
    },
    
    // Increment login attempts
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      state.lastLoginAttempt = Date.now();
    },
    
    // Reset login attempts
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
    },
  },
  
  extraReducers: (builder) => {
    // =========================================================================
    // INITIALIZE AUTH
    // =========================================================================
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isInitializing = false;
        
        if (action.payload.isAuthenticated) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          
          if (action.payload.token) {
            state.token = action.payload.token;
          }
          if (action.payload.refreshToken) {
            state.refreshToken = action.payload.refreshToken;
          }
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.refreshToken = null;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isInitializing = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      });
    
    // =========================================================================
    // LOGIN
    // =========================================================================
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.rememberMe = action.payload.rememberMe;
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.loginAttempts += 1;
        state.lastLoginAttempt = Date.now();
      });
    
    // =========================================================================
    // SIGNUP
    // =========================================================================
    builder
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.rememberMe = action.payload.rememberMe;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // =========================================================================
    // LOGOUT
    // =========================================================================
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        return {
          ...initialState,
          isInitializing: false,
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
        };
      })
      .addCase(logout.rejected, (state) => {
        // Still clear state even if logout API fails
        return {
          ...initialState,
          isInitializing: false,
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
        };
      });
    
    // =========================================================================
    // REFRESH TOKEN
    // =========================================================================
    builder
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        // Token refresh failed, logout user
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      });
    
    // =========================================================================
    // VERIFY EMAIL
    // =========================================================================
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.emailVerified = true;
        if (state.user) {
          state.user.emailVerified = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // =========================================================================
    // RESEND VERIFICATION
    // =========================================================================
    builder
      .addCase(resendVerificationEmail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resendVerificationEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.verificationEmailSent = true;
      })
      .addCase(resendVerificationEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // =========================================================================
    // FORGOT PASSWORD
    // =========================================================================
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.passwordResetEmailSent = true;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // =========================================================================
    // RESET PASSWORD
    // =========================================================================
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.passwordResetToken = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // =========================================================================
    // CHANGE PASSWORD
    // =========================================================================
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // =========================================================================
    // OAUTH LOGIN
    // =========================================================================
    builder
      .addCase(oauthLogin.pending, (state) => {
        state.oauthLoading = true;
        state.error = null;
      })
      .addCase(oauthLogin.fulfilled, (state, action) => {
        state.oauthLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.oauthProvider = action.payload.provider;
        state.rememberMe = action.payload.rememberMe;
        state.error = null;
      })
      .addCase(oauthLogin.rejected, (state, action) => {
        state.oauthLoading = false;
        state.error = action.payload;
      });
    
    // =========================================================================
    // UPDATE PROFILE
    // =========================================================================
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // =========================================================================
    // DELETE ACCOUNT
    // =========================================================================
    builder
      .addCase(deleteAccount.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        return {
          ...initialState,
          isInitializing: false,
          isAuthenticated: false,
        };
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
  setUser,
  setTokens,
  clearError,
  setEmailVerified,
  clearPasswordResetState,
  setOAuthProvider,
  incrementLoginAttempts,
  resetLoginAttempts,
} = authSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

// User
export const selectUser = (state) => state.auth.user;
export const selectUserId = (state) => state.auth.user?.id;
export const selectUserEmail = (state) => state.auth.user?.email;
export const selectUserName = (state) => state.auth.user?.name;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectUserAvatar = (state) => state.auth.user?.avatar;

// Authentication
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectToken = (state) => state.auth.token;
export const selectRefreshToken = (state) => state.auth.refreshToken;

// Loading
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectIsInitializing = (state) => state.auth.isInitializing;
export const selectOAuthLoading = (state) => state.auth.oauthLoading;

// Error
export const selectAuthError = (state) => state.auth.error;

// Email verification
export const selectEmailVerified = (state) => state.auth.emailVerified;
export const selectVerificationEmailSent = (state) => state.auth.verificationEmailSent;

// Password reset
export const selectPasswordResetEmailSent = (state) => state.auth.passwordResetEmailSent;

// Session
export const selectRememberMe = (state) => state.auth.rememberMe;
export const selectLoginAttempts = (state) => state.auth.loginAttempts;
export const selectLastLoginAttempt = (state) => state.auth.lastLoginAttempt;

// OAuth
export const selectOAuthProvider = (state) => state.auth.oauthProvider;

// Computed selectors
export const selectIsEmailVerified = (state) => {
  return state.auth.user?.emailVerified || state.auth.emailVerified;
};

export const selectNeedsEmailVerification = (state) => {
  return state.auth.isAuthenticated && !selectIsEmailVerified(state);
};

export const selectCanAttemptLogin = (state) => {
  const maxAttempts = 5;
  const lockoutDuration = 15 * 60 * 1000; // 15 minutes
  
  if (state.auth.loginAttempts < maxAttempts) {
    return true;
  }
  
  if (state.auth.lastLoginAttempt) {
    const timeSinceLastAttempt = Date.now() - state.auth.lastLoginAttempt;
    return timeSinceLastAttempt > lockoutDuration;
  }
  
  return false;
};

export const selectHasRole = (role) => (state) => {
  return state.auth.user?.role === role || state.auth.user?.roles?.includes(role);
};

export const selectHasPermission = (permission) => (state) => {
  return state.auth.user?.permissions?.includes(permission);
};

// =============================================================================
// REDUCER
// =============================================================================

export default authSlice.reducer;
