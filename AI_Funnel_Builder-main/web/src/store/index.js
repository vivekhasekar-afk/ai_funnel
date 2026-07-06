// =============================================================================
// AI FUNNEL PLATFORM - Redux Store Configuration (Production Grade)
// =============================================================================
// Central store setup: combines slices, middleware, persistence, devtools
// Version: 2.0
// =============================================================================

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage
import sessionStorage from 'redux-persist/lib/storage/session'; // sessionStorage

// =============================================================================
// SLICE IMPORTS
// =============================================================================

import uiReducer, * as uiActions from './slices/ui.slice';
import authReducer, * as authActions from './slices/auth.slice';
import userReducer, * as userActions from './slices/user.slice';
import onboardingReducer, * as onboardingActions from './slices/onboarding.slice';
import projectsReducer, * as projectsActions from './slices/projects.slice';
import groupsReducer, * as groupsActions from './slices/groups.slice';
import funnelsReducer, * as funnelsActions from './slices/funnels.slice';
import wizardReducer, * as wizardActions from './slices/wizard.slice';
import flowReducer, * as flowActions from './slices/flow.slice';
import aiReducer, * as aiActions from './slices/ai.slice';

// =============================================================================
// MIDDLEWARE IMPORTS
// =============================================================================

import apiMiddleware from './middleware/api.middleware';

// Conditional logger import
let createLogger = null;
if (process.env.NODE_ENV === 'development') {
  try {
    const loggerModule = require('redux-logger');
    createLogger = loggerModule.createLogger;
  } catch (e) {
    console.warn('⚠️ redux-logger not installed. Install with: npm install redux-logger');
  }
}

// =============================================================================
// PERSIST CONFIGURATION
// =============================================================================

/**
 * Auth persist config - Store in localStorage
 * Persists authentication state across sessions
 */
const authPersistConfig = {
  key: 'auth',
  storage,
  version: 1,
  whitelist: ['token', 'refreshToken', 'isAuthenticated', 'user', 'rememberMe'],
  blacklist: ['loading', 'error', 'errors', 'isInitializing'],
};

/**
 * User persist config - Store in localStorage
 * Persists user profile and preferences
 */
const userPersistConfig = {
  key: 'user',
  storage,
  version: 1,
  whitelist: ['profile', 'preferences', 'settings'],
  blacklist: ['loading', 'error', 'errors', 'avatar', 'uploadProgress'],
};

/**
 * UI persist config - Store in localStorage
 * Persists UI preferences (theme, layout, sidebar state)
 */
const uiPersistConfig = {
  key: 'ui',
  storage,
  version: 1,
  whitelist: ['theme', 'sidebar', 'layout', 'keyboardShortcutsEnabled'],
  blacklist: [
    'modals',
    'notifications',
    'loading',
    'search',
    'commandPalette',
    'settingsPanel',
    'rightPanel',
    'confirmation',
    'dragDrop',
  ],
};

/**
 * Projects persist config - Store in sessionStorage (temporary)
 * Only persists active project selection during session
 */
const projectsPersistConfig = {
  key: 'projects',
  storage: sessionStorage,
  version: 1,
  whitelist: ['activeProject', 'filters'],
  blacklist: ['items', 'loading', 'error', 'errors', 'pagination'],
};

/**
 * Funnels persist config - Store in sessionStorage
 * Only persists active funnel selection during session
 */
const funnelsPersistConfig = {
  key: 'funnels',
  storage: sessionStorage,
  version: 1,
  whitelist: ['activeFunnel', 'view'],
  blacklist: ['items', 'loading', 'error', 'errors', 'pagination', 'layout', 'theme'],
};

/**
 * Wizard persist config - Store in localStorage (for draft recovery)
 * Persists wizard progress for draft recovery
 */
const wizardPersistConfig = {
  key: 'wizard',
  storage,
  version: 1,
  whitelist: ['formData', 'currentStep', 'completedSteps', 'draftId', 'savedAt'],
  blacklist: ['loading', 'error', 'errors', 'aiGenerating', 'validation', 'streaming'],
};

/**
 * AI persist config - Store in localStorage
 * Persists AI configuration and credit information
 */
const aiPersistConfig = {
  key: 'ai',
  storage,
  version: 1,
  whitelist: ['config', 'credits', 'preferences'],
  blacklist: ['loading', 'error', 'errors', 'activeOperations', 'streaming', 'queue'],
};

// =============================================================================
// ROOT REDUCER
// =============================================================================

const appReducer = combineReducers({
  ui: persistReducer(uiPersistConfig, uiReducer),
  auth: persistReducer(authPersistConfig, authReducer),
  user: persistReducer(userPersistConfig, userReducer),
  onboarding: onboardingReducer, // No persistence needed
  projects: persistReducer(projectsPersistConfig, projectsReducer),
  groups: groupsReducer, // No persistence needed (fetched from server)
  funnels: persistReducer(funnelsPersistConfig, funnelsReducer),
  wizard: persistReducer(wizardPersistConfig, wizardReducer),
  flow: flowReducer, // No persistence needed (too large, real-time)
  ai: persistReducer(aiPersistConfig, aiReducer),
});

/**
 * Root reducer with logout handling
 * Resets all state on logout action
 */
const rootReducer = (state, action) => {
  // Reset state on logout
  if (action.type === 'auth/logout/fulfilled' || action.type === 'RESET_STORE') {
    // Keep only theme and layout preferences
    const { ui } = state;
    state = {
      ui: {
        theme: ui?.theme,
        sidebar: {
          isOpen: true,
          isCollapsed: false,
          activeSection: null,
        },
        layout: ui?.layout,
      },
    };
  }

  return appReducer(state, action);
};

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

/**
 * Configure middleware based on environment
 */
const configureMiddleware = (getDefaultMiddleware) => {
  const middleware = getDefaultMiddleware({
    serializableCheck: {
      // Ignore these action types for serializable check
      ignoredActions: [
        FLUSH,
        REHYDRATE,
        PAUSE,
        PERSIST,
        PURGE,
        REGISTER,
        'ui/openModal',
        'ui/openConfirmation',
        'wizard/setValidationRules',
        'flow/addNode',
        'flow/updateNodeData',
      ],
      // Ignore these paths in the state
      ignoredPaths: [
        'ui.modals.data',
        'ui.confirmation.onConfirm',
        'ui.confirmation.onCancel',
        'flow.nodes',
        'flow.edges',
        'wizard.validation',
      ],
      // Increase warning threshold
      warnAfter: 128,
    },
    // Enable immutability check in development only
    immutableCheck: process.env.NODE_ENV === 'development' ? {
      warnAfter: 128,
      ignoredPaths: ['flow.nodes', 'flow.edges'],
    } : false,
    // Enable thunk middleware (enabled by default)
    thunk: true,
  });

  // Add custom API middleware
  if (apiMiddleware) {
    middleware.push(apiMiddleware);
  }

  // Add logger in development (if enabled and installed)
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.REACT_APP_ENABLE_LOGGER === 'true' &&
    createLogger
  ) {
    const logger = createLogger({
      collapsed: true,
      duration: true,
      timestamp: true,
      diff: false, // Set to true to see state diff (can be slow)
      colors: {
        title: () => '#139BFE',
        prevState: () => '#9E9E9E',
        action: () => '#149945',
        nextState: () => '#A47104',
        error: () => '#FF0005',
      },
      // Filter out noisy actions
      predicate: (getState, action) => {
        const noisyActions = [
          'ui/saveScrollPosition',
          'ui/updateDeviceInfo',
          'flow/updateNodePosition',
          'flow/updateNodeDimensions',
          'wizard/updateStreamingContent',
          'ai/updateProgress',
        ];
        return !noisyActions.some((type) => action.type.includes(type));
      },
    });
    middleware.push(logger);
  }

  return middleware;
};

// =============================================================================
// STORE CONFIGURATION
// =============================================================================

/**
 * Create and configure Redux store
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware: configureMiddleware,
  devTools: process.env.NODE_ENV === 'development' && {
    // DevTools configuration
    name: 'AI Funnel Platform',
    trace: true,
    traceLimit: 25,
    maxAge: 50, // Keep last 50 actions
    // Action sanitizer - Remove large payloads
    actionSanitizer: (action) => {
      // Sanitize large payloads
      if (action.type?.includes('fetch') && action.type?.includes('fulfilled')) {
        return {
          ...action,
          payload: action.payload?.items
            ? {
                ...action.payload,
                items: `<<ITEMS: ${action.payload.items.length}>>`,
              }
            : action.payload?.data
            ? {
                ...action.payload,
                data: `<<DATA: ${JSON.stringify(action.payload.data).length} bytes>>`,
              }
            : action.payload,
        };
      }
      return action;
    },
    // State sanitizer - Remove large state branches
    stateSanitizer: (state) => ({
      ...state,
      funnels: state.funnels
        ? {
            ...state.funnels,
            items: `<<FUNNELS: ${state.funnels.items?.length || 0}>>`,
          }
        : state.funnels,
      projects: state.projects
        ? {
            ...state.projects,
            items: `<<PROJECTS: ${state.projects.items?.length || 0}>>`,
          }
        : state.projects,
      flow: state.flow
        ? {
            ...state.flow,
            nodes: `<<NODES: ${state.flow.nodes?.length || 0}>>`,
            edges: `<<EDGES: ${state.flow.edges?.length || 0}>>`,
          }
        : state.flow,
      ai: state.ai
        ? {
            ...state.ai,
            history: `<<HISTORY: ${state.ai.history?.length || 0}>>`,
          }
        : state.ai,
    }),
  },
});

// =============================================================================
// PERSISTOR
// =============================================================================

/**
 * Create persistor for redux-persist
 */
export const persistor = persistStore(store, null, () => {
  console.log('🔄 Redux store rehydrated');
  
  // Dispatch rehydration complete event
  store.dispatch({ type: 'persist/REHYDRATE_COMPLETE' });
});

// =============================================================================
// STORE TYPES (TypeScript Support)
// =============================================================================

/**
 * For TypeScript users:
 * export type RootState = ReturnType<typeof store.getState>;
 * export type AppDispatch = typeof store.dispatch;
 */

// =============================================================================
// STORE HELPERS
// =============================================================================

/**
 * Reset entire store (useful for logout)
 */
export const resetStore = async () => {
  console.log('🗑️ Resetting store...');
  
  try {
    // Pause persistor
    persistor.pause();
    
    // Flush pending writes
    await persistor.flush();
    
    // Purge all persisted data
    await persistor.purge();
    
    // Dispatch reset action
    store.dispatch({ type: 'RESET_STORE' });
    
    // Restart persistor
    persistor.persist();
    
    console.log('✅ Store reset complete');
  } catch (error) {
    console.error('❌ Error resetting store:', error);
  }
};

/**
 * Get current store state
 */
export const getState = () => store.getState();

/**
 * Subscribe to store changes
 */
export const subscribe = (listener) => store.subscribe(listener);

/**
 * Dispatch action to store
 */
export const dispatch = (action) => store.dispatch(action);

// =============================================================================
// STORE MONITORING & DEBUGGING
// =============================================================================

/**
 * Monitor store size (development only)
 */
if (process.env.NODE_ENV === 'development') {
  let lastWarningTime = 0;
  const WARNING_THROTTLE = 5000; // Only warn every 5 seconds

  store.subscribe(() => {
    const now = Date.now();
    if (now - lastWarningTime < WARNING_THROTTLE) return;

    try {
      const state = store.getState();
      const stateSize = new Blob([JSON.stringify(state)]).size;
      const stateSizeMB = stateSize / 1024 / 1024;

      // Warn if state is getting too large (> 5MB)
      if (stateSizeMB > 5) {
        console.warn(
          `⚠️ Redux state is large: ${stateSizeMB.toFixed(2)} MB\n` +
            'Consider reducing state size or moving data to server.'
        );
        lastWarningTime = now;

        // Log which slices are largest
        Object.entries(state).forEach(([key, value]) => {
          try {
            const sliceSize = new Blob([JSON.stringify(value)]).size / 1024 / 1024;
            if (sliceSize > 1) {
              console.warn(`  - ${key}: ${sliceSize.toFixed(2)} MB`);
            }
          } catch (e) {
            // Ignore serialization errors
          }
        });
      }
    } catch (error) {
      // Ignore errors in monitoring
    }
  });
}

/**
 * Log store initialization
 */
if (process.env.NODE_ENV === 'development') {
  console.log('🏪 Redux Store Initialized');
  console.log('📦 Available Slices:', Object.keys(store.getState()));
  console.log('🔧 Middleware:', store.dispatch.toString().includes('logger') ? 'With Logger' : 'Standard');
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Monitor action performance (development only)
 */
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MONITOR_PERFORMANCE === 'true') {
  const originalDispatch = store.dispatch;
  const SLOW_ACTION_THRESHOLD = 16; // 16ms = 60fps

  store.dispatch = function performanceMonitoredDispatch(action) {
    const start = performance.now();
    const result = originalDispatch(action);
    const end = performance.now();
    const duration = end - start;

    // Warn if action takes too long
    if (duration > SLOW_ACTION_THRESHOLD) {
      console.warn(
        `⚠️ Slow Action: ${action.type}\n` +
          `  Duration: ${duration.toFixed(2)}ms\n` +
          `  Threshold: ${SLOW_ACTION_THRESHOLD}ms`
      );
    }

    return result;
  };
}

// =============================================================================
// HOT MODULE REPLACEMENT (HMR)
// =============================================================================

/**
 * Enable hot reloading for reducers in development
 */
if (process.env.NODE_ENV === 'development' && import.meta.hot) {
  import.meta.hot.accept('./slices/ui.slice', () => {
    store.replaceReducer(rootReducer);
  });

  import.meta.hot.accept('./slices/auth.slice', () => {
    store.replaceReducer(rootReducer);
  });

  import.meta.hot.accept('./slices/user.slice', () => {
    store.replaceReducer(rootReducer);
  });

  import.meta.hot.accept('./slices/projects.slice', () => {
    store.replaceReducer(rootReducer);
  });

  import.meta.hot.accept('./slices/funnels.slice', () => {
    store.replaceReducer(rootReducer);
  });

  import.meta.hot.accept('./slices/wizard.slice', () => {
    store.replaceReducer(rootReducer);
  });

  import.meta.hot.accept('./slices/flow.slice', () => {
    store.replaceReducer(rootReducer);
  });

  import.meta.hot.accept('./slices/ai.slice', () => {
    store.replaceReducer(rootReducer);
  });
}

// =============================================================================
// EXPORTS - Individual State Getters
// =============================================================================

export const getAuth = () => store.getState().auth;
export const getUser = () => store.getState().user;
export const getUI = () => store.getState().ui;
export const getOnboarding = () => store.getState().onboarding;
export const getProjects = () => store.getState().projects;
export const getGroups = () => store.getState().groups;
export const getFunnels = () => store.getState().funnels;
export const getWizard = () => store.getState().wizard;
export const getFlow = () => store.getState().flow;
export const getAI = () => store.getState().ai;

// =============================================================================
// STORE UTILITIES
// =============================================================================

/**
 * Wait for store rehydration
 * @returns {Promise<Object>} Resolves with rehydrated state
 */
export const waitForRehydration = () => {
  return new Promise((resolve) => {
    // Check if already rehydrated
    if (isStoreRehydrated()) {
      resolve(store.getState());
      return;
    }

    // Wait for rehydration
    const unsubscribe = store.subscribe(() => {
      if (isStoreRehydrated()) {
        unsubscribe();
        resolve(store.getState());
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      unsubscribe();
      console.warn('⚠️ Store rehydration timeout');
      resolve(store.getState());
    }, 10000);
  });
};

/**
 * Check if store is rehydrated
 * @returns {boolean}
 */
export const isStoreRehydrated = () => {
  const state = store.getState();
  return state._persist?.rehydrated || false;
};

/**
 * Get store rehydration status
 * @returns {Object}
 */
export const getRehydrationStatus = () => {
  const state = store.getState();
  return {
    rehydrated: state._persist?.rehydrated || false,
    version: state._persist?.version || null,
  };
};

/**
 * Clear all persisted state
 */
export const clearPersistedState = async () => {
  console.log('🗑️ Clearing persisted state...');
  
  try {
    await persistor.purge();
    console.log('✅ Persisted state cleared');
  } catch (error) {
    console.error('❌ Error clearing persisted state:', error);
  }
};

// =============================================================================
// EXPORTS - Action Creators (for testing and external use)
// =============================================================================

export {
  uiActions,
  authActions,
  userActions,
  onboardingActions,
  projectsActions,
  groupsActions,
  funnelsActions,
  wizardActions,
  flowActions,
  aiActions,
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default store;
